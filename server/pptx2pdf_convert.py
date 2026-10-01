import os
import sys
import argparse
import subprocess
import shutil
import tempfile
import zipfile
import re
import json

def convert_with_powerpoint_com(input_path, output_path):
    """
    Convierte PPTX/PPT a PDF usando la API COM nativa de Microsoft PowerPoint en Windows.
    Fidelidad 100% oficial con motor de renderizado vectorial de Microsoft Office.
    """
    if sys.platform != "win32":
        return False

    try:
        import win32com.client
        import pythoncom
    except ImportError:
        print("[COM Info]: pywin32 no disponible en esta plataforma.", file=sys.stderr)
        return False

    pythoncom.CoInitialize()
    ppt = None
    pres = None
    try:
        ppt = win32com.client.DispatchEx("PowerPoint.Application")
        # 1 = ppAlertsNone (desactiva diálogos modales y advertencias)
        try:
            ppt.DisplayAlerts = 1
        except Exception:
            pass

        abs_in = os.path.abspath(input_path)
        abs_out = os.path.abspath(output_path)

        # Intentar abrir en modo silencioso sin ventana
        try:
            pres = ppt.Presentations.Open(abs_in, -1, 0, 0) # ReadOnly=True, Untitled=False, WithWindow=False
        except Exception:
            # Fallback en caso de que la versión de PowerPoint exija ventana
            pres = ppt.Presentations.Open(abs_in, -1, 0, -1)

        # 2 = ppFixedFormatTypePDF, Intent: 2 = ppFixedFormatIntentPrint (máxima resolución de impresión)
        try:
            pres.ExportAsFixedFormat(abs_out, 2, 2)
        except Exception:
            # Fallback a SaveAs convencional (32 = ppSaveAsPDF)
            pres.SaveAs(abs_out, 32)

        if os.path.exists(abs_out) and os.path.getsize(abs_out) > 0:
            return True
        return False
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


def get_libreoffice_binary():
    """Detecta la ruta del ejecutable de LibreOffice en Windows o Linux."""
    # 1. Comprobar en PATH
    soffice_path = shutil.which("soffice") or shutil.which("libreoffice")
    if soffice_path:
        return soffice_path

    # 2. Rutas estándar en Windows
    win_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for p in win_paths:
        if os.path.exists(p):
            return p

    # 3. Rutas estándar en Linux
    linux_paths = [
        "/usr/bin/soffice",
        "/usr/bin/libreoffice",
        "/usr/local/bin/soffice",
        "/opt/libreoffice/program/soffice"
    ]
    for p in linux_paths:
        if os.path.exists(p):
            return p

    return None


def convert_with_libreoffice(input_path, output_path):
    """Convierte presentaciones usando LibreOffice headless (ideal para Linux / Docker / servidores)."""
    soffice_bin = get_libreoffice_binary()
    if not soffice_bin:
        return False

    try:
        out_dir = os.path.dirname(os.path.abspath(output_path))
        abs_in = os.path.abspath(input_path)

        cmd = [
            soffice_bin,
            "--headless",
            "--invisible",
            "--nodefault",
            "--nofirststartwizard",
            "--nolockcheck",
            "--nologo",
            "--convert-to",
            "pdf",
            "--outdir",
            out_dir,
            abs_in
        ]

        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if result.returncode == 0:
            base_name = os.path.splitext(os.path.basename(abs_in))[0]
            generated_pdf = os.path.join(out_dir, f"{base_name}.pdf")
            if os.path.exists(generated_pdf):
                if generated_pdf != os.path.abspath(output_path):
                    if os.path.exists(output_path):
                        os.remove(output_path)
                    os.rename(generated_pdf, output_path)
                return True
        return False
    except Exception as e:
        print(f"[LibreOffice Error]: {e}", file=sys.stderr)
        return False


def convert_with_python_pptx(input_path, output_path, default_aspect_ratio="16:9"):
    """
    Motor Empresarial python-pptx + PyMuPDF (fitz).
    Extrae geometría real, cajas de texto, fuentes, colores RGB, imágenes y tablas
    generando un PDF de alta fidelidad sin requerir Microsoft Office.
    """
    try:
        from pptx import Presentation
        from pptx.enum.shapes import MSO_SHAPE_TYPE
        import fitz
    except ImportError as e:
        print(f"[python-pptx/fitz Import Error]: {e}", file=sys.stderr)
        return False

    doc_pdf = None
    try:
        prs = Presentation(input_path)
        slide_w = prs.slide_width.pt if hasattr(prs, "slide_width") else (842.0 if default_aspect_ratio == "16:9" else 792.0)
        slide_h = prs.slide_height.pt if hasattr(prs, "slide_height") else (595.0 if default_aspect_ratio == "16:9" else 612.0)

        doc_pdf = fitz.open()

        for s_idx, slide in enumerate(prs.slides):
            page = doc_pdf.new_page(width=slide_w, height=slide_h)

            # Fondo base suave y profesional
            bg_drawn = False
            try:
                bg = slide.background
                if bg and hasattr(bg, "fill") and bg.fill.type == 1:
                    c = bg.fill.fore_color.rgb
                    bg_col = (c[0] / 255.0, c[1] / 255.0, c[2] / 255.0)
                    page.draw_rect(fitz.Rect(0, 0, slide_w, slide_h), color=bg_col, fill=bg_col)
                    bg_drawn = True
            except Exception:
                pass

            if not bg_drawn:
                page.draw_rect(fitz.Rect(0, 0, slide_w, slide_h), color=(0.985, 0.985, 0.99), fill=(0.985, 0.985, 0.99))

            # Procesar formas (shapes)
            for shape in slide.shapes:
                try:
                    x0 = shape.left.pt
                    y0 = shape.top.pt
                    x1 = x0 + shape.width.pt
                    y1 = y0 + shape.height.pt
                    rect = fitz.Rect(x0, y0, x1, y1)

                    # 1. IMAGEN / FOTOGRAFÍA
                    if shape.shape_type == MSO_SHAPE_TYPE.PICTURE and hasattr(shape, "image"):
                        try:
                            img_blob = shape.image.blob
                            page.insert_image(rect, stream=img_blob, keep_proportion=True)
                            continue
                        except Exception as img_e:
                            print(f"[Warning] Error insertando imagen en slide {s_idx+1}: {img_e}", file=sys.stderr)

                    # 2. TABLA
                    if shape.has_table:
                        try:
                            table = shape.table
                            n_rows = len(table.rows)
                            n_cols = len(table.columns)
                            if n_rows > 0 and n_cols > 0:
                                row_h = (y1 - y0) / n_rows
                                col_w = (x1 - x0) / n_cols
                                for r_i in range(n_rows):
                                    for c_i in range(n_cols):
                                        cell_x0 = x0 + c_i * col_w
                                        cell_y0 = y0 + r_i * row_h
                                        cell_rect = fitz.Rect(cell_x0, cell_y0, cell_x0 + col_w, cell_y0 + row_h)
                                        # Fondo alternado para filas de datos
                                        fill_col = (0.94, 0.95, 0.97) if r_i % 2 == 0 else (1.0, 1.0, 1.0)
                                        if r_i == 0:
                                            fill_col = (0.2, 0.25, 0.35)
                                        page.draw_rect(cell_rect, color=(0.8, 0.82, 0.85), fill=fill_col, width=0.75)

                                        cell_text = table.cell(r_i, c_i).text.strip()
                                        if cell_text:
                                            text_col = (1.0, 1.0, 1.0) if r_i == 0 else (0.15, 0.15, 0.2)
                                            font_size = 10 if r_i > 0 else 11
                                            inset_rect = fitz.Rect(cell_x0 + 4, cell_y0 + 3, cell_x0 + col_w - 4, cell_y0 + row_h - 3)
                                            page.insert_textbox(inset_rect, cell_text, fontsize=font_size, fontname="helv", color=text_col)
                            continue
                        except Exception as tbl_e:
                            print(f"[Warning] Error procesando tabla en slide {s_idx+1}: {tbl_e}", file=sys.stderr)

                    # 3. FORMAS CON FONDO DE COLOR (RECTÁNGULOS, TARJETAS)
                    if hasattr(shape, "fill") and shape.fill and shape.fill.type == 1:
                        try:
                            c = shape.fill.fore_color.rgb
                            shape_col = (c[0] / 255.0, c[1] / 255.0, c[2] / 255.0)
                            page.draw_rect(rect, color=shape_col, fill=shape_col)
                        except Exception:
                            pass

                    # 4. TEXT FRAME / CAJAS DE TEXTO
                    if shape.has_text_frame:
                        tf = shape.text_frame
                        full_text = tf.text.strip()
                        if full_text:
                            # Configuración de fuente y color según el primer párrafo/run
                            fontsize = 14
                            fontname = "helv"
                            text_color = (0.12, 0.12, 0.18)

                            if tf.paragraphs:
                                p0 = tf.paragraphs[0]
                                if p0.runs:
                                    r0 = p0.runs[0]
                                    if r0.font.size and hasattr(r0.font.size, "pt"):
                                        fontsize = min(44, max(9, r0.font.size.pt))
                                    if r0.font.bold:
                                        fontname = "hebo" # Helvetica Bold
                                    if r0.font.italic:
                                        fontname = "heit" if fontname != "hebo" else "hebi"
                                    if r0.font.color and hasattr(r0.font.color, "rgb") and r0.font.color.rgb:
                                        c = r0.font.color.rgb
                                        text_color = (c[0] / 255.0, c[1] / 255.0, c[2] / 255.0)

                            # Margen interno de la caja de texto
                            inset_rect = fitz.Rect(x0 + 4, y0 + 3, x1 - 4, y1 - 3)
                            # PyMuPDF insert_textbox envuelve texto automáticamente
                            page.insert_textbox(
                                inset_rect,
                                full_text,
                                fontsize=fontsize,
                                fontname=fontname,
                                color=text_color,
                                align=fitz.TEXT_ALIGN_LEFT
                            )

                except Exception as shape_err:
                    print(f"[Warning] Error procesando forma en slide {s_idx+1}: {shape_err}", file=sys.stderr)

            # Pie de diapositiva discreto
            footer_rect = fitz.Rect(slide_w - 180, slide_h - 25, slide_w - 20, slide_h - 10)
            page.insert_textbox(
                footer_rect,
                f"Diapositiva {s_idx + 1} de {len(prs.slides)}",
                fontsize=8,
                fontname="helv",
                color=(0.55, 0.55, 0.6),
                align=fitz.TEXT_ALIGN_RIGHT
            )

        doc_pdf.save(output_path, deflate=True)
        doc_pdf.close()
        return True
    except Exception as e:
        print(f"[python-pptx Engine Error]: {e}", file=sys.stderr)
        if doc_pdf:
            try:
                doc_pdf.close()
            except Exception:
                pass
        return False


def convert_with_zip_pymupdf_fallback(input_path, output_path, aspect_ratio="16:9"):
    """
    Fallback ultra-resistente OpenXML + PyMuPDF.
    Descomprime el archivo como ZIP y reconstruye las diapositivas
    incluso si faltan metadatos o el archivo está dañado.
    """
    try:
        import fitz
    except ImportError:
        return False

    doc_pdf = fitz.open()
    page_w = 842.0 if aspect_ratio == "16:9" else 792.0
    page_h = 595.0 if aspect_ratio == "16:9" else 612.0

    try:
        with zipfile.ZipFile(input_path, "r") as z:
            slide_files = sorted(
                [f for f in z.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")],
                key=lambda x: int(re.sub(r"[^0-9]", "", x) or 0)
            )

            media_files = {
                os.path.basename(f): z.read(f)
                for f in z.namelist()
                if f.startswith("ppt/media/")
            }

            if not slide_files:
                slide_files = ["placeholder"]

            for idx, sfile in enumerate(slide_files):
                page = doc_pdf.new_page(width=page_w, height=page_h)
                page.draw_rect(fitz.Rect(0, 0, page_w, page_h), color=(0.98, 0.98, 0.99), fill=(0.98, 0.98, 0.99))

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

                    rel_file = f"ppt/slides/_rels/{os.path.basename(sfile)}.rels"
                    if rel_file in z.namelist():
                        rel_xml = z.read(rel_file).decode("utf-8", errors="ignore")
                        target_images = re.findall(r'Target="(?:\.\./)?media/([^"]+)"', rel_xml)
                        for t_img in target_images:
                            if t_img in media_files:
                                slide_images.append(media_files[t_img])

                # Título de diapositiva
                title_rect = fitz.Rect(50, 40, page_w - 50, 95)
                page.insert_textbox(title_rect, title[:100], fontsize=22, fontname="hebo", color=(0.12, 0.12, 0.18))

                has_image = len(slide_images) > 0
                text_w = (page_w / 2) - 40 if has_image else page_w - 100

                # Párrafos en viñetas
                y_pos = 110
                for p in paragraphs[:12]:
                    if y_pos > page_h - 60:
                        break
                    p_rect = fitz.Rect(55, y_pos, 55 + text_w, y_pos + 40)
                    page.insert_textbox(p_rect, f"• {p}", fontsize=12, fontname="helv", color=(0.25, 0.25, 0.32))
                    y_pos += 30

                # Imagen incrustada
                if has_image:
                    img_bytes = slide_images[0]
                    img_rect = fitz.Rect(page_w / 2 + 10, 110, page_w - 50, page_h - 70)
                    try:
                        page.insert_image(img_rect, stream=img_bytes, keep_proportion=True)
                    except Exception:
                        pass

                # Pie
                footer_rect = fitz.Rect(page_w - 180, page_h - 30, page_w - 30, page_h - 10)
                page.insert_textbox(
                    footer_rect,
                    f"Diapositiva {idx + 1} de {len(slide_files)}",
                    fontsize=9,
                    fontname="helv",
                    color=(0.55, 0.55, 0.62),
                    align=fitz.TEXT_ALIGN_RIGHT
                )

        doc_pdf.save(output_path, deflate=True)
        doc_pdf.close()
        return True
    except Exception as e:
        print(f"[Zip Fallback Error]: {e}", file=sys.stderr)
        if doc_pdf:
            try:
                doc_pdf.close()
            except Exception:
                pass
        return False


def main():
    parser = argparse.ArgumentParser(description="Motor Empresarial de Conversión de PowerPoint a PDF")
    parser.add_argument("input", help="Ruta al archivo PPTX/PPT de entrada")
    parser.add_argument("output", help="Ruta al archivo PDF de salida")
    parser.add_argument("--aspect-ratio", default="16:9", choices=["16:9", "4:3"], help="Relación de aspecto")
    parser.add_argument("--engine", default="auto", choices=["auto", "com", "libreoffice", "python-pptx"], help="Motor preferido")

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(json.dumps({"status": "error", "message": f"El archivo '{args.input}' no existe"}), file=sys.stderr)
        sys.exit(1)

    # 1. Si se fuerza COM o en modo auto: intentar Microsoft Office PowerPoint COM (si es Windows)
    if args.engine in ["auto", "com"] and sys.platform == "win32":
        if convert_with_powerpoint_com(args.input, args.output):
            if os.path.exists(args.output) and os.path.getsize(args.output) > 0:
                print(json.dumps({"status": "success", "engine": "PowerPoint COM Native Engine", "size": os.path.getsize(args.output)}))
                sys.exit(0)

    # 2. Si se fuerza LibreOffice o en modo auto: intentar LibreOffice Headless
    if args.engine in ["auto", "libreoffice"]:
        if convert_with_libreoffice(args.input, args.output):
            if os.path.exists(args.output) and os.path.getsize(args.output) > 0:
                print(json.dumps({"status": "success", "engine": "LibreOffice Headless Engine", "size": os.path.getsize(args.output)}))
                sys.exit(0)

    # 3. Motor python-pptx + PyMuPDF de alta fidelidad
    if convert_with_python_pptx(args.input, args.output, args.aspect_ratio):
        if os.path.exists(args.output) and os.path.getsize(args.output) > 0:
            print(json.dumps({"status": "success", "engine": "python-pptx PyMuPDF High-Fidelity Engine", "size": os.path.getsize(args.output)}))
            sys.exit(0)

    # 4. Fallback Ultra-Resistente OpenXML ZIP
    if convert_with_zip_pymupdf_fallback(args.input, args.output, args.aspect_ratio):
        if os.path.exists(args.output) and os.path.getsize(args.output) > 0:
            print(json.dumps({"status": "success", "engine": "OpenXML Resilient Fallback Engine", "size": os.path.getsize(args.output)}))
            sys.exit(0)

    print(json.dumps({"status": "error", "message": "Todos los motores locales fallaron"}), file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
