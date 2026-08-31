import docx
import fitz
import sys
import os
import argparse
import json

def convert_docx_to_pdf(docx_path, output_pdf_path, page_size='a4', orientation='portrait', margin='normal', font_family='helvetica', font_size=11, line_spacing=1.35, add_page_numbers=True, include_header=False):
    doc = docx.Document(docx_path)
    pdf = fitz.open()

    # Dimensiones
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
        margin_val = 108.0  # 3.8 cm
    elif margin == 'moderate':
        margin_val = 54.0  # 1.9 cm
    else:
        margin_val = 72.0  # 2.54 cm

    margin_t = margin_val
    margin_b = margin_val
    margin_l = margin_val
    margin_r = margin_val

    usable_w = page_w - margin_l - margin_r
    usable_h = page_h - margin_t - margin_b

    font_css_family = 'Arial, sans-serif'
    if font_family == 'times':
        font_css_family = '"Times New Roman", Times, serif'
    elif font_family == 'courier':
        font_css_family = '"Courier New", Courier, monospace'

    current_page = pdf.new_page(width=page_w, height=page_h)
    current_y = margin_t
    page_num = 1

    # Título opcional en cabecera
    doc_title = os.path.basename(docx_path).replace('.docx', '').replace('.doc', '')

    for p in doc.paragraphs:
        style_name = p.style.name.lower() if p.style else ""
        
        runs_html = []
        for r in p.runs:
            txt = r.text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            if not txt:
                continue
            b_tag = "<b>" if r.bold else ""
            b_end = "</b>" if r.bold else ""
            i_tag = "<i>" if r.italic else ""
            i_end = "</i>" if r.italic else ""
            runs_html.append(f"{b_tag}{i_tag}{txt}{i_end}{b_end}")

        p_text = "".join(runs_html)
        if not p_text.strip():
            current_y += (font_size * 0.6)
            continue

        is_h1 = "heading 1" in style_name
        is_h2 = "heading 2" in style_name or "heading 3" in style_name
        
        if is_h1:
            h_size = font_size + 5
            html = f'<h1 style="font-family:{font_css_family};font-size:{h_size}pt;color:#1f4e79;margin:0 0 6pt 0;line-height:1.2;">{p_text}</h1>'
        elif is_h2:
            h_size = font_size + 2.5
            html = f'<h2 style="font-family:{font_css_family};font-size:{h_size}pt;color:#2e75b6;margin:0 0 4pt 0;line-height:1.2;">{p_text}</h2>'
        else:
            html = f'<p style="font-family:{font_css_family};font-size:{font_size}pt;line-height:{line_spacing};margin:0 0 4pt 0;text-align:justify;">{p_text}</p>'

        avail_h = (page_h - margin_b) - current_y
        if avail_h < (font_size * 2):
            # Nueva página
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
        current_y += max(font_size + 2, used_h)

    # Procesar tablas si existen
    for tbl in doc.tables:
        col_count = len(tbl.columns)
        if col_count == 0:
            continue
        
        table_html_rows = []
        for r_idx, row in enumerate(tbl.rows):
            is_hdr = (r_idx == 0)
            cell_tag = "th" if is_hdr else "td"
            bg_color = 'background-color:#f2f2f2;' if is_hdr else ''
            b_open = '<b>' if is_hdr else ''
            b_close = '</b>' if is_hdr else ''
            
            cells = []
            for cell in row.cells:
                c_txt = cell.text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").strip()
                cells.append(f'<{cell_tag} style="border:1px solid #ccc;padding:4pt 6pt;{bg_color}">{b_open}{c_txt}{b_close}</{cell_tag}>')
            
            table_html_rows.append(f'<tr>{"".join(cells)}</tr>')

        tbl_html = f'<table style="font-family:{font_css_family};font-size:{font_size - 1}pt;width:100%;border-collapse:collapse;margin:8pt 0;">{"".join(table_html_rows)}</table>'

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
        current_y += max(30, used_h + 10)

    # Números de página y encabezados finales
    total_p = len(pdf)
    if add_page_numbers or include_header:
        for idx, p in enumerate(pdf):
            if add_page_numbers:
                p.insert_text((page_w / 2 - 30, page_h - 25), f"Página {idx + 1} de {total_p}", fontsize=8, color=(0.4, 0.4, 0.4))
            if include_header:
                p.insert_text((margin_l, 25), doc_title[:60], fontsize=8, color=(0.4, 0.4, 0.4))

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
