import docx
import fitz
import sys
import os
import argparse
import json
import base64
import re
from docx.enum.text import WD_ALIGN_PARAGRAPH

def pt_to_dxa(pt):
    return int(round(pt * 20))

def escape_html(s):
    if not s:
        return ""
    return (str(s).replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace('"', "&quot;")
                  .replace("'", "&#39;"))

def get_font_color_hex(run):
    try:
        if run.font.color and run.font.color.rgb:
            return f"#{str(run.font.color.rgb)}"
    except Exception:
        pass
    return None

def extract_docx_images(doc):
    """Extrae imágenes incrustadas en el archivo docx como data URIs base64."""
    images = {}
    try:
        for rel in doc.part.rels.values():
            if "image" in rel.target_ref:
                img_part = rel.target_part
                content_type = img_part.content_type
                b64_data = base64.b64encode(img_part.blob).decode('utf-8')
                images[rel.rId] = f"data:{content_type};base64,{b64_data}"
    except Exception:
        pass
    return images

def convert_docx_to_pdf(docx_path, output_pdf_path, page_size='a4', orientation='portrait', margin='normal', font_family='helvetica', font_size=11, line_spacing=1.35, add_page_numbers=True, include_header=False):
    doc = docx.Document(docx_path)
    pdf = fitz.open()

    # Dimensiones estándar
    if page_size.lower() == 'letter':
        w, h = 612.0, 792.0
    elif page_size.lower() == 'legal':
        w, h = 612.0, 1008.0
    else:  # a4
        w, h = 595.28, 841.89

    if orientation.lower() == 'landscape':
        page_w, page_h = max(w, h), min(w, h)
    else:
        page_w, page_h = min(w, h), max(w, h)

    # Margen
    if margin == 'narrow':
        margin_val = 36.0  # 1.27 cm
    elif margin == 'wide':
        margin_val = 90.0  # 3.17 cm
    elif margin == 'moderate':
        margin_val = 54.0  # 1.9 cm
    elif margin == 'none':
        margin_val = 20.0
    else:
        margin_val = 60.0  # ~2.1 cm Normal

    margin_t = margin_val
    margin_b = margin_val
    margin_l = margin_val
    margin_r = margin_val

    usable_w = page_w - margin_l - margin_r
    usable_h = page_h - margin_t - margin_b

    font_css_family = 'Arial, sans-serif'
    if font_family == 'times':
        font_css_family = 'Times-Roman, serif'
    elif font_family == 'courier':
        font_css_family = 'Courier, monospace'

    current_page = pdf.new_page(width=page_w, height=page_h)
    current_y = margin_t
    page_num = 1

    doc_title = os.path.basename(docx_path).replace('.docx', '').replace('.doc', '')

    # Extraer imágenes del documento
    extracted_images = extract_docx_images(doc)

    # 1. Procesar elementos del cuerpo en orden (Párrafos y Tablas)
    for element in doc.element.body:
        tag_name = element.tag.split('}')[-1] if '}' in element.tag else element.tag

        if tag_name == 'p':
            # Párrafo
            p = docx.text.paragraph.Paragraph(element, doc)
            style_name = p.style.name.lower() if p.style else ""
            
            runs_html = []
            for r in p.runs:
                txt = escape_html(r.text)
                if not txt:
                    continue

                r_style = []
                if r.bold:
                    r_style.append("font-weight:bold;")
                if r.italic:
                    r_style.append("font-style:italic;")
                if r.underline:
                    r_style.append("text-decoration:underline;")
                if hasattr(r.font, 'strike') and r.font.strike:
                    r_style.append("text-decoration:line-through;")
                
                col_hex = get_font_color_hex(r)
                if col_hex:
                    r_style.append(f"color:{col_hex};")
                
                r_size = r.font.size.pt if r.font.size else None
                if r_size:
                    r_style.append(f"font-size:{r_size}pt;")

                style_attr = f' style="{"".join(r_style)}"' if r_style else ''
                runs_html.append(f'<span{style_attr}>{txt}</span>')

            p_text = "".join(runs_html)

            # Comprobar si el párrafo contiene una imagen incrustada
            img_html = ""
            for blip in element.xpath('.//a:blip/@r:embed'):
                if blip in extracted_images:
                    img_data = extracted_images[blip]
                    img_html += f'<div style="text-align:center;margin:8pt 0;"><img src="{img_data}" style="max-width:100%;max-height:280pt;object-fit:contain;border-radius:3pt;" /></div>'

            if not p_text.strip() and not img_html:
                current_y += (font_size * 0.5)
                continue

            # Alineación del párrafo
            align_css = "text-align:left;"
            if p.alignment == WD_ALIGN_PARAGRAPH.CENTER:
                align_css = "text-align:center;"
            elif p.alignment == WD_ALIGN_PARAGRAPH.RIGHT:
                align_css = "text-align:right;"
            elif p.alignment == WD_ALIGN_PARAGRAPH.JUSTIFY:
                align_css = "text-align:justify;"

            # Estilos de encabezado
            is_title = "title" in style_name
            is_subtitle = "subtitle" in style_name
            is_h1 = "heading 1" in style_name
            is_h2 = "heading 2" in style_name
            is_h3 = "heading 3" in style_name or "heading 4" in style_name
            is_bullet = "list bullet" in style_name or "bullet" in style_name
            is_number = "list number" in style_name

            if is_title:
                h_size = font_size + 9
                html = f'<h1 style="font-family:{font_css_family};font-size:{h_size}pt;color:#1e3a8a;font-weight:bold;margin:4pt 0 8pt 0;line-height:1.2;{align_css}">{p_text}</h1>{img_html}'
            elif is_subtitle:
                h_size = font_size + 3
                html = f'<p style="font-family:{font_css_family};font-size:{h_size}pt;color:#475569;margin:0 0 6pt 0;line-height:1.2;{align_css}">{p_text}</p>{img_html}'
            elif is_h1:
                h_size = font_size + 5
                html = f'<h1 style="font-family:{font_css_family};font-size:{h_size}pt;color:#1f4e79;font-weight:bold;margin:8pt 0 4pt 0;line-height:1.2;{align_css}">{p_text}</h1>{img_html}'
            elif is_h2:
                h_size = font_size + 2.5
                html = f'<h2 style="font-family:{font_css_family};font-size:{h_size}pt;color:#2e75b6;font-weight:bold;margin:6pt 0 3pt 0;line-height:1.2;{align_css}">{p_text}</h2>{img_html}'
            elif is_h3:
                h_size = font_size + 1
                html = f'<h3 style="font-family:{font_css_family};font-size:{h_size}pt;color:#334155;font-weight:bold;margin:4pt 0 2pt 0;line-height:1.2;{align_css}">{p_text}</h3>{img_html}'
            elif is_bullet:
                html = f'<div style="font-family:{font_css_family};font-size:{font_size}pt;line-height:{line_spacing};margin:2pt 0 2pt 16pt;display:flex;align-items:flex-start;"><span style="color:#2563eb;margin-right:6pt;font-weight:bold;">•</span><span>{p_text}</span></div>{img_html}'
            elif is_number:
                html = f'<div style="font-family:{font_css_family};font-size:{font_size}pt;line-height:{line_spacing};margin:2pt 0 2pt 16pt;">{p_text}</div>{img_html}'
            else:
                html = f'<p style="font-family:{font_css_family};font-size:{font_size}pt;line-height:{line_spacing};margin:0 0 4pt 0;color:#1e293b;{align_css}">{p_text}</p>{img_html}'

            avail_h = (page_h - margin_b) - current_y
            if avail_h < (font_size * 2):
                current_page = pdf.new_page(width=page_w, height=page_h)
                page_num += 1
                current_y = margin_t
                avail_h = (page_h - margin_b) - current_y

            rect = fitz.Rect(margin_l, current_y, margin_l + usable_w, page_h - margin_b)
            rem_h, placed = current_page.insert_htmlbox(rect, html)

            if placed < 0.99 or rem_h <= 0:
                current_page = pdf.new_page(width=page_w, height=page_h)
                page_num += 1
                current_y = margin_t
                rect = fitz.Rect(margin_l, current_y, margin_l + usable_w, page_h - margin_b)
                rem_h, placed = current_page.insert_htmlbox(rect, html)

            used_h = rect.height - rem_h
            current_y += max(font_size + 1, used_h)

        elif tag_name == 'tbl':
            # Tabla
            tbl = docx.table.Table(element, doc)
            col_count = len(tbl.columns)
            if col_count == 0:
                continue

            table_html_rows = []
            for r_idx, row in enumerate(tbl.rows):
                is_hdr = (r_idx == 0)
                cell_tag = "th" if is_hdr else "td"
                bg_color = 'background-color:#f1f5f9;' if is_hdr else ('background-color:#ffffff;' if r_idx % 2 == 1 else 'background-color:#f8fafc;')
                hdr_style = 'font-weight:bold;color:#1e3a8a;' if is_hdr else 'color:#334155;'

                cells = []
                for cell in row.cells:
                    c_txt = escape_html(cell.text.strip())
                    # Convertir saltos de línea a <br/>
                    c_txt_html = c_txt.replace("\n", "<br/>") if c_txt else "&nbsp;"
                    cells.append(f'<{cell_tag} style="border:1px solid #cbd5e1;padding:5pt 7pt;{bg_color}{hdr_style}text-align:left;vertical-align:middle;">{c_txt_html}</{cell_tag}>')

                table_html_rows.append(f'<tr>{"".join(cells)}</tr>')

            tbl_html = f'<table style="font-family:{font_css_family};font-size:{max(7.5, font_size - 1.5)}pt;width:100%;border-collapse:collapse;margin:8pt 0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">{"".join(table_html_rows)}</table>'

            avail_h = (page_h - margin_b) - current_y
            if avail_h < 60:
                current_page = pdf.new_page(width=page_w, height=page_h)
                page_num += 1
                current_y = margin_t

            rect = fitz.Rect(margin_l, current_y, margin_l + usable_w, page_h - margin_b)
            rem_h, placed = current_page.insert_htmlbox(rect, tbl_html)
            if placed < 0.99 or rem_h <= 0:
                current_page = pdf.new_page(width=page_w, height=page_h)
                page_num += 1
                current_y = margin_t
                rect = fitz.Rect(margin_l, current_y, margin_l + usable_w, page_h - margin_b)
                rem_h, placed = current_page.insert_htmlbox(rect, tbl_html)

            used_h = rect.height - rem_h
            current_y += max(24, used_h + 8)

    # Encabezados y números de página finales
    total_p = len(pdf)
    if add_page_numbers or include_header:
        for idx, p in enumerate(pdf):
            if add_page_numbers:
                p.insert_text((page_w / 2 - 35, page_h - 22), f"Página {idx + 1} de {total_p}", fontsize=8, fontname='helv', color=(0.45, 0.45, 0.45))
            if include_header:
                p.insert_text((margin_l, 24), doc_title[:60], fontsize=8, fontname='helv', color=(0.45, 0.45, 0.45))
                p.draw_line((margin_l, 30), (page_w - margin_r, 30), color=(0.85, 0.85, 0.85), width=0.5)

    pdf.save(output_pdf_path, garbage=4, deflate=True)
    pdf.close()
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert DOCX to high-precision PDF')
    parser.add_argument('input_docx')
    parser.add_argument('output_pdf')
    parser.add_argument('--page-size', default='a4')
    parser.add_argument('--orientation', default='portrait')
    parser.add_argument('--margin', default='normal')
    parser.add_argument('--font-family', default='helvetica')
    parser.add_argument('--font-size', type=float, default=11.0)
    parser.add_argument('--line-spacing', type=float, default=1.35)
    parser.add_argument('--add-page-numbers', default='true')
    parser.add_argument('--include-header', default='false')

    args = parser.parse_args()

    num_bool = str(args.add_page_numbers).lower() in ['true', '1', 'yes']
    hdr_bool = str(args.include_header).lower() in ['true', '1', 'yes']

    try:
        convert_docx_to_pdf(
            args.input_docx,
            args.output_pdf,
            page_size=args.page_size,
            orientation=args.orientation,
            margin=args.margin,
            font_family=args.font_family,
            font_size=args.font_size,
            line_spacing=args.line_spacing,
            add_page_numbers=num_bool,
            include_header=hdr_bool
        )
        if os.path.exists(args.output_pdf):
            print(json.dumps({'status': 'success', 'output': args.output_pdf, 'size': os.path.getsize(args.output_pdf)}))
            sys.exit(0)
        else:
            print(json.dumps({'status': 'error', 'message': 'Output file not created'}), file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(json.dumps({'status': 'error', 'message': str(e)}), file=sys.stderr)
        sys.exit(1)
