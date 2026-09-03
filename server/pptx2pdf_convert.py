import os
import sys
import argparse
import tempfile
import zipfile
import re

def convert_with_powerpoint_native(input_path, output_path):
    """Convierte PPTX/PPT a PDF usando la API COM nativa de Microsoft PowerPoint en Windows."""
    import win32com.client
    import pythoncom

    pythoncom.CoInitialize()
    ppt = None
    pres = None
    try:
        ppt = win32com.client.DispatchEx("PowerPoint.Application")
        # 32 = ppSaveAsPDF
        abs_in = os.path.abspath(input_path)
        abs_out = os.path.abspath(output_path)
        
        # Abrir presentación en modo oculto / sin ventana
        pres = ppt.Presentations.Open(abs_in, True, False, False)
        pres.SaveAs(abs_out, 32)
        return True
    except Exception as e:
        print(f"[PowerPoint-COM Error]: {e}", file=sys.stderr)
        return False
    finally:
        if pres:
            try:
                pres.Close()
            except Exception:
                pass
        if ppt:
            try:
                ppt.Quit()
            except Exception:
                pass
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass


def convert_with_pymupdf_fallback(input_path, output_path, aspect_ratio="16:9"):
    """Fallback usando PyMuPDF y parseo OpenXML para extraer texto e imágenes de las diapositivas."""
    import fitz

    doc_pdf = fitz.open()

    # Dimensiones en puntos
    if aspect_ratio == "4:3":
        page_w, page_h = 792.0, 612.0
    else: # 16:9
        page_w, page_h = 842.0, 595.0

    try:
        with zipfile.ZipFile(input_path, "r") as z:
            slide_files = sorted(
                [f for f in z.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")],
                key=lambda x: int(re.sub(r"[^0-9]", "", x) or 0)
            )

            # Extraer imágenes del zip
            media_files = {
                os.path.basename(f): z.read(f)
                for f in z.namelist()
                if f.startswith("ppt/media/")
            }

            if not slide_files:
                slide_files = ["placeholder"]

            for idx, sfile in enumerate(slide_files):
                page = doc_pdf.new_page(width=page_w, height=page_h)
                
                # Fondo elegante de diapositiva
                rect_bg = fitz.Rect(0, 0, page_w, page_h)
                page.draw_rect(rect_bg, color=(0.97, 0.97, 0.98), fill=(0.97, 0.97, 0.98))
                
                # Marco sutil
                rect_border = fitz.Rect(25, 25, page_w - 25, page_h - 25)
                page.draw_rect(rect_border, color=(0.82, 0.82, 0.86), width=1.5)

                title = f"Diapositiva {idx + 1}"
                paragraphs = []
                slide_images = []

                if sfile != "placeholder":
                    xml_content = z.read(sfile).decode("utf-8", errors="ignore")
                    matches = re.findall(r"<a:t[^>]*>([^<]+)</a:t>", xml_content)
                    clean_matches = [m.strip() for m in matches if m.strip()]
                    if clean_matches:
                        title = clean_matches[0]
                        paragraphs = clean_matches[1:]

                    # Buscar relaciones de imágenes para esta diapositiva
                    rel_file = f"ppt/slides/_rels/{os.path.basename(sfile)}.rels"
                    if rel_file in z.namelist():
                        rel_xml = z.read(rel_file).decode("utf-8", errors="ignore")
                        target_images = re.findall(r'Target="(?:\.\./)?media/([^"]+)"', rel_xml)
                        for t_img in target_images:
                            if t_img in media_files:
                                slide_images.append(media_files[t_img])

                # Dibujar Título
                page.insert_text(
                    (50, 75),
                    title[:80],
                    fontname="helv",
                    fontsize=20,
                    color=(0.12, 0.12, 0.18)
                )

                # Si hay imagen, dividir el espacio: texto a la izquierda, imagen a la derecha
                has_image = len(slide_images) > 0
                max_text_width = page_w - 100 if not has_image else (page_w / 2) - 30

                y_pos = 125
                for p in paragraphs[:10]:
                    if y_pos > page_h - 60:
                        break
                    page.insert_text(
                        (55, y_pos),
                        f"• {p[:110]}",
                        fontname="helv",
                        fontsize=12,
                        color=(0.25, 0.25, 0.32)
                    )
                    y_pos += 26

                # Dibujar imagen en la diapositiva si existe
                if has_image:
                    img_bytes = slide_images[0]
                    img_rect = fitz.Rect(page_w / 2 + 10, 110, page_w - 50, page_h - 80)
                    try:
                        page.insert_image(img_rect, stream=img_bytes)
                    except Exception as img_err:
                        print(f"Error incrustando imagen en diapositiva {idx+1}: {img_err}", file=sys.stderr)

                # Pie de diapositiva
                page.insert_text(
                    (page_w - 180, page_h - 35),
                    f"Diapositiva {idx + 1} de {len(slide_files)}",
                    fontname="helv",
                    fontsize=9,
                    color=(0.55, 0.55, 0.62)
                )

        doc_pdf.save(output_path)
        doc_pdf.close()
        return True
    except Exception as e:
        print(f"[PyMuPDF Fallback Error]: {e}", file=sys.stderr)
        if doc_pdf:
            doc_pdf.close()
        return False


def main():
    parser = argparse.ArgumentParser(description="Convertidor Local Profesional de PowerPoint a PDF")
    parser.add_argument("input", help="Ruta al archivo PPTX/PPT de entrada")
    parser.add_argument("output", help="Ruta al archivo PDF de salida")
    parser.add_argument("--aspect-ratio", default="16:9", choices=["16:9", "4:3"], help="Relación de aspecto")

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: El archivo de entrada '{args.input}' no existe.", file=sys.stderr)
        sys.exit(1)

    # 1. Intentar con motor nativo de Microsoft PowerPoint en Windows
    success = convert_with_powerpoint_native(args.input, args.output)
    if success and os.path.exists(args.output) and os.path.getsize(args.output) > 0:
        print("CONVERT_SUCCESS: PowerPoint COM Native Engine")
        sys.exit(0)

    # 2. Fallback con PyMuPDF + OpenXML
    print("Fell back to PyMuPDF OpenXML Engine...", file=sys.stderr)
    success = convert_with_pymupdf_fallback(args.input, args.output, args.aspect_ratio)
    if success and os.path.exists(args.output) and os.path.getsize(args.output) > 0:
        print("CONVERT_SUCCESS: PyMuPDF OpenXML Engine")
        sys.exit(0)

    print("Error: Todos los métodos de conversión local fallaron.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
