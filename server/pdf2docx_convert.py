import sys
import os
import json
import re
import hashlib
import argparse
import fitz  # PyMuPDF
import zipfile

def pt_to_emu(pt):
    return int(round(pt * 12700))

def pt_to_dxa(pt):
    return int(round(pt * 20))

def escape_xml(s):
    if not s:
        return ""
    # Remove XML control characters except valid whitespace (\t, \n, \r)
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', str(s))
    return (clean.replace("&", "&amp;")
                 .replace("<", "&lt;")
                 .replace(">", "&gt;")
                 .replace('"', "&quot;")
                 .replace("'", "&apos;"))

def int_to_hex_color(col):
    if col is None or col == 0:
        return "000000"
    r = (col >> 16) & 255
    g = (col >> 8) & 255
    b = col & 255
    return f"{r:02X}{g:02X}{b:02X}"

def normalize_font(font_name, default_font="Calibri"):
    if not font_name:
        return default_font
    fn = font_name.lower()
    if "impact" in fn:
        return "Impact"
    if "times" in fn or "cambria" in fn or "garamond" in fn:
        return "Times New Roman"
    if "arial" in fn or "helvetica" in fn:
        return "Arial"
    if "courier" in fn or "mono" in fn or "consolas" in fn:
        return "Courier New"
    if "georgia" in fn:
        return "Georgia"
    if "verdana" in fn:
        return "Verdana"
    if "tahoma" in fn:
        return "Tahoma"
    if "trebuchet" in fn:
        return "Trebuchet MS"
    if "roboto" in fn:
        return "Roboto"
    if "montserrat" in fn:
        return "Montserrat"
    if "poppins" in fn:
        return "Poppins"
    if "lato" in fn:
        return "Lato"
    if "aptos" in fn:
        return "Aptos"
    return default_font

def is_bullet_text(text):
    t = text.strip()
    bullet_symbols = ('•', '–', '—', '▪', '▫', '►', '✓', '✔', '‣', '⁃', '○', '●', '*')
    if any(t.startswith(b) for b in bullet_symbols):
        return True, 'bullet'
    if re.match(r'^(?:\d{1,3}[\.\)]|[a-zA-Z][\.\)])\s+', t):
        return True, 'number'
    return False, None

def convert_pdf_to_docx(pdf_path, output_docx_path, pages=None, layout_mode="flowing", include_images=True, primary_font="Calibri", add_page_breaks=True, include_header=False):
    doc = fitz.open(pdf_path)
    
    media_files = {}
    image_hash_to_rid = {}
    
    doc_rels = [
        ('rId1', 'styles.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles'),
        ('rId2', 'fontTable.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable'),
        ('rId3', 'settings.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings'),
    ]
    
    rel_counter = 10
    image_counter = 1
    drawing_id = 1
    
    target_page_indices = pages if pages is not None else list(range(len(doc)))
    total_targets = len(target_page_indices)
    
    # 1. ANÁLISIS GLOBAL DEL DOCUMENTO (Detección de tamaño de texto base del cuerpo)
    font_sizes = []
    sample_pages = target_page_indices[:min(30, total_targets)]
    for p_idx in sample_pages:
        if 0 <= p_idx < len(doc):
            p_dict = doc[p_idx].get_text("dict")
            for b in p_dict.get("blocks", []):
                if b.get("type") == 0:
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            txt = span.get("text", "").strip()
                            if len(txt) > 3:
                                font_sizes.append(round(span.get("size", 11), 1))
    
    body_font_size = 11.0
    if font_sizes:
        # Moda del tamaño de letra
        body_font_size = max(set(font_sizes), key=font_sizes.count)
    
    heading1_threshold = body_font_size + 4.5
    heading2_threshold = body_font_size + 2.0
    
    body_elements = []
    
    # ── MODO 1: TEXTO FLUIDO PROFESIONAL (RECONSTRUCCIÓN INTELIGENTE) ──
    if layout_mode == "flowing":
        for idx_num, page_idx in enumerate(target_page_indices):
            if page_idx < 0 or page_idx >= len(doc):
                continue
            page = doc[page_idx]
            rect = page.rect
            page_w = rect.width
            page_h = rect.height
            
            # Detección de Tablas en la página
            table_bboxes = []
            table_xml_list = []
            try:
                tables = page.find_tables()
                if tables and tables.tables:
                    for tbl in tables.tables:
                        table_bboxes.append(fitz.Rect(tbl.bbox))
                        tbl_cells = tbl.extract()
                        if tbl_cells and len(tbl_cells) > 0:
                            # Construir tabla nativa Word OpenXML
                            col_count = max(len(row) for row in tbl_cells if row)
                            col_width_dxa = int(round(9000 / max(1, col_count)))
                            
                            grid_xml = "".join([f'<w:gridCol w:w="{col_width_dxa}"/>' for _ in range(col_count)])
                            
                            rows_xml = []
                            for r_idx, row in enumerate(tbl_cells):
                                is_header_row = (r_idx == 0)
                                tr_pr = "<w:tblHeader/>" if is_header_row else ""
                                
                                cells_xml = []
                                for c_idx in range(col_count):
                                    cell_val = row[c_idx] if c_idx < len(row) and row[c_idx] is not None else ""
                                    clean_cell = escape_xml(str(cell_val).strip())
                                    shd_xml = '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>' if is_header_row else ''
                                    bold_xml = '<w:b/>' if is_header_row else ''
                                    
                                    tc_xml = f"""<w:tc><w:tcPr><w:tcW w:w="{col_width_dxa}" w:type="dxa"/>{shd_xml}<w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/><w:sz w:val="{int(round(body_font_size * 2))}"/><w:szCs w:val="{int(round(body_font_size * 2))}"/>{bold_xml}</w:rPr><w:t xml:space="preserve">{clean_cell}</w:t></w:r></w:p></w:tc>"""
                                    cells_xml.append(tc_xml)
                                
                                rows_xml.append(f"""<w:tr><w:trPr>{tr_pr}</w:trPr>{"".join(cells_xml)}</w:tr>""")
                            
                            tbl_full_xml = f"""<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/><w:right w:val="none"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/><w:insideV w:val="none"/></w:tblBorders><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>{grid_xml}</w:tblGrid>{"".join(rows_xml)}</w:tbl>"""
                            table_xml_list.append((fitz.Rect(tbl.bbox), tbl_full_xml))
            except Exception:
                pass
            
            page_dict = page.get_text("dict")
            blocks = page_dict.get("blocks", [])
            has_text = False
            
            # Ordenar bloques en orden natural de lectura (top-to-bottom, left-to-right)
            text_and_table_items = []
            
            # Añadir tablas a la lista ordenada
            for t_rect, t_xml in table_xml_list:
                text_and_table_items.append(('table', t_rect.y0, t_rect, t_xml))
            
            # Procesar bloques de texto
            for b in blocks:
                if b.get("type") == 0:  # text block
                    bx0, by0, bx1, by1 = b.get("bbox")
                    b_rect = fitz.Rect(bx0, by0, bx1, by1)
                    
                    # Evitar procesar texto que ya está dentro de una tabla detectada
                    in_table = any(b_rect.intersects(t_bbox) for t_bbox in table_bboxes)
                    if in_table:
                        continue
                    
                    # Filtrar números de página aislados en extremos (cabecera y pie)
                    is_isolated_header_footer = False
                    block_text_raw = "".join([span.get("text", "") for line in b.get("lines", []) for span in line.get("spans", [])]).strip()
                    if block_text_raw.isdigit() and len(block_text_raw) <= 4:
                        if by0 < 45 or by1 > (page_h - 45):
                            is_isolated_header_footer = True
                    
                    if not is_isolated_header_footer and block_text_raw:
                        has_text = True
                        text_and_table_items.append(('text', by0, b_rect, b))
            
            # Ordenar elementos verticalmente
            text_and_table_items.sort(key=lambda item: item[1])
            
            # Procesar cada elemento en orden
            for item_type, _, _, item_data in text_and_table_items:
                if item_type == 'table':
                    body_elements.append(item_data)
                    continue
                
                # Procesar bloque de texto con unión inteligente de párrafos y desguionado
                b = item_data
                lines = b.get("lines", [])
                if not lines:
                    continue
                
                # Evaluar características del bloque
                block_runs = []
                max_font_size = 0
                total_text_len = 0
                
                # Fusión de líneas con desguionado (de-hyphenation)
                for line_idx, line in enumerate(lines):
                    spans = line.get("spans", [])
                    line_runs = []
                    
                    for span_idx, span in enumerate(spans):
                        txt = span.get("text", "")
                        if not txt:
                            continue
                        
                        f_size = max(7, span.get("size", body_font_size))
                        if f_size > max_font_size:
                            max_font_size = f_size
                        
                        f_name = normalize_font(span.get("font", ""), primary_font)
                        f_color = int_to_hex_color(span.get("color", 0))
                        flags = span.get("flags", 0)
                        is_bold = bool(flags & 2 ** 4) or "bold" in span.get("font", "").lower() or "heavy" in span.get("font", "").lower() or f_size >= heading1_threshold
                        is_italic = bool(flags & 2 ** 1) or "italic" in span.get("font", "").lower()
                        
                        line_runs.append({
                            'text': txt,
                            'font': f_name,
                            'color': f_color,
                            'size': f_size,
                            'bold': is_bold,
                            'italic': is_italic,
                        })
                        total_text_len += len(txt)
                    
                    if not line_runs:
                        continue
                    
                    # Comprobar desguionado con la línea anterior
                    if block_runs and len(block_runs) > 0:
                        prev_last_run = block_runs[-1]
                        if prev_last_run['text'].endswith('-') and len(prev_last_run['text']) > 1:
                            # Quitar el guión y unir directamente con la primera palabra de esta línea
                            prev_last_run['text'] = prev_last_run['text'][:-1]
                        elif not prev_last_run['text'].endswith(' ') and not line_runs[0]['text'].startswith(' '):
                            # Añadir espacio natural entre líneas del mismo párrafo
                            prev_last_run['text'] += ' '
                    
                    block_runs.extend(line_runs)
                
                if not block_runs:
                    continue
                
                # Determinar si es Título (Heading), Viñeta (Bullet) o Párrafo Normal
                first_run_text = block_runs[0]['text']
                is_bullet, bullet_type = is_bullet_text(first_run_text)
                
                is_heading1 = (max_font_size >= heading1_threshold) and total_text_len < 180
                is_heading2 = (max_font_size >= heading2_threshold and not is_heading1) and total_text_len < 220
                
                # Configurar estilo y espaciado de párrafo
                p_pr_elements = []
                if is_heading1:
                    p_pr_elements.append('<w:pStyle w:val="Heading1"/>')
                    p_pr_elements.append('<w:spacing w:before="240" w:after="120" w:line="280" w:lineRule="auto"/>')
                elif is_heading2:
                    p_pr_elements.append('<w:pStyle w:val="Heading2"/>')
                    p_pr_elements.append('<w:spacing w:before="180" w:after="80" w:line="260" w:lineRule="auto"/>')
                elif is_bullet:
                    p_pr_elements.append('<w:pStyle w:val="ListBullet"/>')
                    p_pr_elements.append('<w:ind w:left="720" w:hanging="360"/>')
                    p_pr_elements.append('<w:spacing w:before="40" w:after="60" w:line="240" w:lineRule="auto"/>')
                else:
                    # Párrafo de cuerpo normal justificado
                    p_pr_elements.append('<w:spacing w:before="0" w:after="100" w:line="260" w:lineRule="auto"/>')
                    if total_text_len > 120:
                        p_pr_elements.append('<w:jc w:val="both"/>')
                
                # Construir runs OpenXML
                xml_runs = []
                for r_data in block_runs:
                    t_clean = r_data['text']
                    if not t_clean:
                        continue
                    
                    bold_tag = "<w:b/>" if r_data['bold'] else ""
                    italic_tag = "<w:i/>" if r_data['italic'] else ""
                    sz_val = int(round(r_data['size'] * 2))
                    
                    xml_runs.append(
                        f"""<w:r><w:rPr><w:rFonts w:ascii="{escape_xml(r_data['font'])}" w:hAnsi="{escape_xml(r_data['font'])}"/><w:color w:val="{r_data['color']}"/><w:sz w:val="{sz_val}"/><w:szCs w:val="{sz_val}"/>{bold_tag}{italic_tag}</w:rPr><w:t xml:space="preserve">{escape_xml(t_clean)}</w:t></w:r>"""
                    )
                
                if xml_runs:
                    p_xml = f"""<w:p><w:pPr>{"".join(p_pr_elements)}</w:pPr>{"".join(xml_runs)}</w:p>"""
                    body_elements.append(p_xml)
            
            # Extraer imágenes incrustadas con deduplicación por hash SHA-256
            if include_images:
                try:
                    for img_info in page.get_images(full=True):
                        xref = img_info[0]
                        base_img = doc.extract_image(xref)
                        if base_img:
                            img_bytes = base_img["image"]
                            img_hash = hashlib.sha256(img_bytes).hexdigest()
                            img_ext = base_img.get("ext", "jpeg")
                            if img_ext not in ["jpeg", "jpg", "png"]:
                                img_ext = "jpeg"
                            
                            # Reutilizar imagen si ya existe (deduplicación para logos/fondos)
                            if img_hash in image_hash_to_rid:
                                r_id = image_hash_to_rid[img_hash]
                            else:
                                img_name = f"image{image_counter}.{img_ext}"
                                image_counter += 1
                                r_id = f"rId{rel_counter}"
                                rel_counter += 1
                                
                                media_files[f"word/media/{img_name}"] = img_bytes
                                doc_rels.append((r_id, f"media/{img_name}", 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'))
                                image_hash_to_rid[img_hash] = r_id
                            
                            orig_w = base_img.get("width", 400)
                            orig_h = base_img.get("height", 300)
                            display_w_pt = min(468, orig_w * 0.75)
                            display_h_pt = display_w_pt * (orig_h / max(1, orig_w))
                            
                            w_emu = pt_to_emu(display_w_pt)
                            h_emu = pt_to_emu(display_h_pt)
                            d_id = drawing_id
                            drawing_id += 1
                            
                            img_xml = f"""<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{w_emu}" cy="{h_emu}"/><wp:docPr id="{d_id}" name="Picture {d_id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="Picture {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>"""
                            body_elements.append(img_xml)
                except Exception:
                    pass
            
            # Si la página es puramente escaneada (sin texto vectorial), rasterizarla de forma individual
            if not has_text and not table_xml_list:
                try:
                    pix = page.get_pixmap(dpi=130)
                    img_bytes = pix.tobytes("jpeg")
                    img_name = f"image{image_counter}.jpeg"
                    image_counter += 1
                    r_id = f"rId{rel_counter}"
                    rel_counter += 1
                    
                    media_files[f"word/media/{img_name}"] = img_bytes
                    doc_rels.append((r_id, f"media/{img_name}", 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'))
                    
                    w_emu = pt_to_emu(min(468, page_w))
                    h_emu = pt_to_emu(min(468, page_w) * (page_h / page_w))
                    d_id = drawing_id
                    drawing_id += 1
                    
                    scan_xml = f"""<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{w_emu}" cy="{h_emu}"/><wp:docPr id="{d_id}" name="Scanned Page {d_id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="Scanned Page {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>"""
                    body_elements.append(scan_xml)
                except Exception:
                    pass
            
            # Salto de página entre páginas consecutivas
            if add_page_breaks and idx_num < total_targets - 1:
                body_elements.append("""<w:p><w:r><w:br w:type="page"/></w:r></w:p>""")
                
        # Propiedad de sección estándar (márgenes normales de 2.54 cm / 1440 dxa)
        body_elements.append("""<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>""")

    # ── MODO 2: RÉPLICA EXACTA (DTP ABSOLUTO OPTIMIZADO) ──
    else:
        for idx_num, page_idx in enumerate(target_page_indices):
            if page_idx < 0 or page_idx >= len(doc):
                continue
            page = doc[page_idx]
            rect = page.rect
            page_w = rect.width
            page_h = rect.height
            
            page_dict = page.get_text("dict")
            blocks = page_dict.get("blocks", [])
            has_text = False
            
            for b in blocks:
                if b.get("type") == 0:
                    bx0, by0, bx1, by1 = b.get("bbox")
                    bw = max(20, bx1 - bx0)
                    bh = max(12, by1 - by0)
                    
                    paras_xml = []
                    for line in b.get("lines", []):
                        spans_xml = []
                        for span in line.get("spans", []):
                            txt = span.get("text", "")
                            if not txt or not txt.strip():
                                continue
                            has_text = True
                            f_size = max(7, span.get("size", body_font_size))
                            f_name = normalize_font(span.get("font", ""), primary_font)
                            f_color = int_to_hex_color(span.get("color", 0))
                            flags = span.get("flags", 0)
                            is_bold = bool(flags & 2 ** 4) or "bold" in span.get("font", "").lower() or "heavy" in span.get("font", "").lower() or f_size >= heading1_threshold
                            is_italic = bool(flags & 2 ** 1) or "italic" in span.get("font", "").lower()
                            
                            bold_xml = "<w:b/>" if is_bold else ""
                            italic_xml = "<w:i/>" if is_italic else ""
                            
                            r_xml = f"""<w:r><w:rPr><w:rFonts w:ascii="{escape_xml(f_name)}" w:hAnsi="{escape_xml(f_name)}"/><w:color w:val="{f_color}"/><w:sz w:val="{int(round(f_size * 2))}"/><w:szCs w:val="{int(round(f_size * 2))}"/>{bold_xml}{italic_xml}</w:rPr><w:t xml:space="preserve">{escape_xml(txt)}</w:t></w:r>"""
                            spans_xml.append(r_xml)
                        
                        if spans_xml:
                            paras_xml.append(f"""<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>{''.join(spans_xml)}</w:p>""")
                    
                    if paras_xml:
                        bx_emu = pt_to_emu(bx0)
                        by_emu = pt_to_emu(by0)
                        bw_emu = pt_to_emu(bw)
                        bh_emu = pt_to_emu(bh)
                        d_id = drawing_id
                        drawing_id += 1
                        
                        tb_xml = f"""<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658241" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>{bx_emu}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>{by_emu}</wp:posOffset></wp:positionV><wp:extent cx="{bw_emu}" cy="{bh_emu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="{d_id}" name="Textbox {d_id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:cNvPr id="{d_id}" name="Textbox {d_id}"/><wps:cNvSpPr txBox="1"/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{bw_emu}" cy="{bh_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></wps:spPr><wps:txbx><w:txbxContent>{''.join(paras_xml)}</w:txbxContent></wps:txbx><wps:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0"><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></mc:Choice><mc:Fallback/></mc:AlternateContent></w:r></w:p>"""
                        body_elements.append(tb_xml)
            
            # Extraer imágenes incrustadas con su posición exacta
            if include_images:
                try:
                    for img_info in page.get_images(full=True):
                        xref = img_info[0]
                        base_img = doc.extract_image(xref)
                        if base_img:
                            rects = page.get_image_rects(xref)
                            img_rect = rects[0] if rects else None
                            if img_rect:
                                img_bytes = base_img["image"]
                                img_ext = base_img.get("ext", "jpeg")
                                if img_ext not in ["jpeg", "jpg", "png"]:
                                    img_ext = "jpeg"
                                
                                img_name = f"image{image_counter}.{img_ext}"
                                image_counter += 1
                                r_id = f"rId{rel_counter}"
                                rel_counter += 1
                                
                                media_files[f"word/media/{img_name}"] = img_bytes
                                doc_rels.append((r_id, f"media/{img_name}", 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'))
                                
                                ix_emu = pt_to_emu(img_rect.x0)
                                iy_emu = pt_to_emu(img_rect.y0)
                                iw_emu = pt_to_emu(img_rect.width)
                                ih_emu = pt_to_emu(img_rect.height)
                                d_id = drawing_id
                                drawing_id += 1
                                
                                img_dtp_xml = f"""<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>{ix_emu}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>{iy_emu}</wp:posOffset></wp:positionV><wp:extent cx="{iw_emu}" cy="{ih_emu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="{d_id}" name="Picture {d_id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="Picture {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{iw_emu}" cy="{ih_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>"""
                                body_elements.append(img_dtp_xml)
                except Exception:
                    pass
            
            # Si no tiene texto vectorial (página escaneada), rasterizar únicamente esa página
            if not has_text:
                try:
                    pix = page.get_pixmap(dpi=140)
                    img_bytes = pix.tobytes("jpeg")
                    img_name = f"image{image_counter}.jpeg"
                    image_counter += 1
                    r_id = f"rId{rel_counter}"
                    rel_counter += 1
                    
                    media_files[f"word/media/{img_name}"] = img_bytes
                    doc_rels.append((r_id, f"media/{img_name}", 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'))
                    
                    w_emu = pt_to_emu(page_w)
                    h_emu = pt_to_emu(page_h)
                    d_id = drawing_id
                    drawing_id += 1
                    
                    scan_bg_xml = f"""<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="{w_emu}" cy="{h_emu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="{d_id}" name="Background {d_id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="Background {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>"""
                    body_elements.append(scan_bg_xml)
                except Exception:
                    pass
            
            p_w_dxa = pt_to_dxa(page_w)
            p_h_dxa = pt_to_dxa(page_h)
            orient = "landscape" if page_w > page_h else "portrait"
            is_last = (idx_num == total_targets - 1)
            sect_xml = f"""<w:sectPr><w:type w:val="continuous"/><w:pgSz w:w="{p_w_dxa}" w:h="{p_h_dxa}" w:orient="{orient}"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>"""
            
            if not is_last:
                body_elements.append(f"""<w:p><w:pPr>{sect_xml}</w:pPr></w:p>""")
            else:
                body_elements.append(sect_xml)

    doc.close()
    
    full_doc_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14" xml:space="preserve">
<w:body>
{"".join(body_elements)}
</w:body>
</w:document>"""

    rels_xml_lines = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    ]
    for r_id, target, r_type in doc_rels:
        rels_xml_lines.append(f'  <Relationship Id="{r_id}" Type="{r_type}" Target="{target}"/>')
    rels_xml_lines.append('</Relationships>')
    full_rels_xml = "\n".join(rels_xml_lines)
    
    styles_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}" w:cs="{escape_xml(primary_font)}"/><w:sz w:val="{int(round(body_font_size * 2))}"/><w:szCs w:val="{int(round(body_font_size * 2))}"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="260" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="240" w:after="120"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/>
      <w:b/>
      <w:color w:val="1F4E79"/>
      <w:sz w:val="{int(round((body_font_size + 5) * 2))}"/>
      <w:szCs w:val="{int(round((body_font_size + 5) * 2))}"/>
    </w:rPr>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="180" w:after="80"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/>
      <w:b/>
      <w:color w:val="2E75B6"/>
      <w:sz w:val="{int(round((body_font_size + 2.5) * 2))}"/>
      <w:szCs w:val="{int(round((body_font_size + 2.5) * 2))}"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:ind w:left="720" w:hanging="360"/>
      <w:spacing w:before="40" w:after="60"/>
    </w:pPr>
  </w:style>
</w:styles>"""

    font_table_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:font w:name="Calibri"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Arial"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Times New Roman"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Georgia"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Aptos"><w:pitch w:val="variable"/></w:font>
</w:fonts>"""

    settings_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>"""

    content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>"""

    root_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""

    core_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Converted Document</dc:title>
  <dc:creator>PDFBlack Ultra Engine</dc:creator>
  <cp:lastModifiedBy>PDFBlack</cp:lastModifiedBy>
</cp:coreProperties>"""

    app_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>PDFBlack Ultra</Application>
  <TotalTime>0</TotalTime>
</Properties>"""

    with zipfile.ZipFile(output_docx_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', content_types_xml)
        zf.writestr('_rels/.rels', root_rels_xml)
        zf.writestr('docProps/core.xml', core_xml)
        zf.writestr('docProps/app.xml', app_xml)
        zf.writestr('word/styles.xml', styles_xml)
        zf.writestr('word/fontTable.xml', font_table_xml)
        zf.writestr('word/settings.xml', settings_xml)
        zf.writestr('word/_rels/document.xml.rels', full_rels_xml)
        zf.writestr('word/document.xml', full_doc_xml)
        for m_path, m_bytes in media_files.items():
            zf.writestr(m_path, m_bytes)

    return True, None

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='PDF to DOCX Ultra Fast High-Precision Converter')
    parser.add_argument('input_pdf', help='Path to input PDF file')
    parser.add_argument('output_docx', help='Path to output DOCX file')
    parser.add_argument('--pages', help='Comma-separated 1-indexed page numbers (e.g. 1,2,3)', default=None)
    parser.add_argument('--layout-mode', help='Layout mode: flowing or exact', default='flowing')
    parser.add_argument('--include-images', help='Include images: true or false', default='true')
    parser.add_argument('--primary-font', help='Primary font name', default='Calibri')
    parser.add_argument('--add-page-breaks', help='Add page breaks: true or false', default='true')

    args = parser.parse_args()

    page_list = None
    if args.pages:
        try:
            page_list = [int(p.strip()) - 1 for p in args.pages.split(',') if p.strip()]
        except Exception:
            page_list = None

    inc_img = str(args.include_images).lower() in ['true', '1', 'yes']
    breaks = str(args.add_page_breaks).lower() in ['true', '1', 'yes']

    try:
        convert_pdf_to_docx(
            args.input_pdf,
            args.output_docx,
            pages=page_list,
            layout_mode=args.layout_mode,
            include_images=inc_img,
            primary_font=args.primary_font,
            add_page_breaks=breaks
        )
        if os.path.exists(args.output_docx):
            print(json.dumps({'status': 'success', 'output': args.output_docx, 'size': os.path.getsize(args.output_docx)}))
            sys.exit(0)
        else:
            print(json.dumps({'status': 'error', 'message': 'Output file was not created'}), file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(json.dumps({'status': 'error', 'message': str(e)}), file=sys.stderr)
        sys.exit(1)
