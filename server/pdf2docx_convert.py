import sys
import os
import json
import re
import hashlib
import argparse
import unicodedata
from collections import Counter
import fitz  # PyMuPDF
import zipfile

def pt_to_emu(pt):
    """Convierte puntos tipográficos (pt) a English Metric Units (EMU)."""
    return int(round(pt * 12700))

def pt_to_dxa(pt):
    """Convierte puntos tipográficos (pt) a vigésimos de punto (dxa / twentieths of a point)."""
    return int(round(pt * 20))

def escape_xml(s):
    """Limpia caracteres de control y escapa caracteres especiales XML."""
    if not s:
        return ""
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f]', '', str(s))
    return (clean.replace("&", "&amp;")
                 .replace("<", "&lt;")
                 .replace(">", "&gt;")
                 .replace('"', "&quot;")
                 .replace("'", "&apos;"))

def normalize_unicode(text):
    """Normaliza ligaduras Unicode (ej. fi, fl, ffi) y caracteres de compatibilidad."""
    if not text:
        return ""
    normalized = unicodedata.normalize('NFKC', str(text))
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f]', '', normalized)

def serialize_text_to_openxml(text):
    """Serializa texto a fragmentos OpenXML respetando tabuladores (<w:tab/>) y saltos (<w:br/>)."""
    if not text:
        return '<w:t xml:space="preserve"></w:t>'
    
    clean = normalize_unicode(text)
    parts = re.split(r'(\t|\r?\n)', clean)
    xml_chunks = []
    
    for part in parts:
        if part == '\t':
            xml_chunks.append('<w:tab/>')
        elif part in ['\n', '\r\n', '\r']:
            xml_chunks.append('<w:br/>')
        elif part:
            esc = (part.replace("&", "&amp;")
                       .replace("<", "&lt;")
                       .replace(">", "&gt;")
                       .replace('"', "&quot;")
                       .replace("'", "&apos;"))
            xml_chunks.append(f'<w:t xml:space="preserve">{esc}</w:t>')
            
    return "".join(xml_chunks) if xml_chunks else '<w:t xml:space="preserve"></w:t>'

def int_to_hex_color(col):
    """Convierte un entero de color sRGB a formato hexadecimal RRGGBB."""
    if col is None or col == 0:
        return "000000"
    r = (col >> 16) & 255
    g = (col >> 8) & 255
    b = col & 255
    return f"{r:02X}{g:02X}{b:02X}"

def clean_font_name(font_name):
    """Elimina prefijos aleatorios de subconjuntos de fuentes incrustadas en PDF (ej. ABCDEF+Calibri)."""
    if not font_name:
        return ""
    cleaned = re.sub(r'^[A-Z]{6}\+', '', font_name)
    return cleaned.strip()

def normalize_font(font_name, default_font="Calibri"):
    """Normaliza nombres de fuentes PostScript y familias tipográficas a familias OpenXML estándar."""
    if not font_name:
        return default_font
    
    cleaned = clean_font_name(font_name)
    fn = cleaned.lower()
    
    if "aptos" in fn:
        return "Aptos"
    if "segoe" in fn:
        return "Segoe UI"
    if any(k in fn for k in ["times", "cambria", "garamond", "georgia", "roman", "liberationserif", "serif"]):
        if "georgia" in fn:
            return "Georgia"
        if "cambria" in fn:
            return "Cambria"
        return "Times New Roman"
    if any(k in fn for k in ["arial", "helvetica", "liberation sans", "dejavu", "sans"]):
        return "Arial"
    if any(k in fn for k in ["courier", "mono", "consolas", "menlo", "liberation mono"]):
        return "Consolas" if "consolas" in fn else "Courier New"
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
    if "open sans" in fn or "noto sans" in fn:
        return "Open Sans"
    if "impact" in fn:
        return "Impact"
    
    return default_font

FONT_WIDTH_RATIOS = {
    'Arial': 0.52,
    'Calibri': 0.48,
    'Times New Roman': 0.45,
    'Georgia': 0.50,
    'Aptos': 0.49,
    'Segoe UI': 0.50,
    'Roboto': 0.51,
    'Open Sans': 0.52,
    'Consolas': 0.55,
    'Courier New': 0.60,
}

def compute_metric_calibration(txt, f_size, f_name, visual_w):
    """
    FASE 3: Calibración métrica tipográfica.
    Calcula si el ancho visual real en el PDF difiere del esperado en la fuente de destino de Word.
    Retorna (scale_pct, spacing_dxa).
    """
    if not txt or len(txt) < 3 or f_size <= 0 or visual_w <= 0:
        return None, None
    
    ratio = FONT_WIDTH_RATIOS.get(f_name, 0.49)
    expected_w = len(txt) * ratio * f_size
    if expected_w <= 0:
        return None, None
    
    scale_ratio = visual_w / expected_w
    if 0.78 <= scale_ratio <= 1.22 and abs(scale_ratio - 1.0) >= 0.04:
        return max(75, min(125, int(round(scale_ratio * 100)))), None
    elif scale_ratio < 0.78 or scale_ratio > 1.22:
        diff = visual_w - expected_w
        char_diff_pt = diff / max(1, len(txt) - 1)
        dxa = int(round(char_diff_pt * 20))
        if abs(dxa) >= 4:
            return None, max(-40, min(120, dxa))
            
    return None, None

def parse_bullet_prefix(text):
    """
    Detecta si el texto comienza con una viñeta o número de lista.
    Retorna (is_bullet, bullet_type, clean_text).
    """
    if not text:
        return False, None, text
    
    t = text.strip()
    bullet_symbols = ('•', '·', '-', '–', '—', '▪', '▫', '►', '✓', '✔', '‣', '⁃', '○', '●', '*', '\u2022', '\u00b7', '\u25cf', '\u25aa', '\u25cb', '\u25ba', '\u2043', '\u2219')
    
    for b in bullet_symbols:
        if t.startswith(b):
            clean_t = t[len(b):].lstrip()
            return True, 'bullet', clean_t
    
    # Lista numerada o con letras: 1. 1) a. a) (1) (a)
    num_match = re.match(r'^(?:\d{1,3}[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))\s+', t)
    if num_match:
        matched_str = num_match.group(0)
        clean_t = t[len(matched_str):].lstrip()
        return True, 'number', clean_t
    
    return False, None, text

def sort_items_reading_order(items, page_w):
    """
    Ordena elementos en orden natural de lectura adaptativo:
    Detecta elementos de ancho completo (encabezados, tablas, diagramas, formas vectoriales, separadores)
    y agrupa elementos en columnas paralelas (1, 2 o 3 columnas, simétricas o asimétricas).
    """
    if len(items) <= 1:
        return items

    bands = []
    current_band = []

    sorted_by_y = sorted(items, key=lambda it: it[1])

    for it in sorted_by_y:
        rect = it[2]
        is_wide = (rect.width > page_w * 0.65) or (it[0] in ['table', 'diagram', 'divider', 'vector_shape'])
        if is_wide:
            if current_band:
                bands.append(('band', current_band))
                current_band = []
            bands.append(('wide', [it]))
        else:
            current_band.append(it)
    if current_band:
        bands.append(('band', current_band))

    result = []
    for b_type, b_items in bands:
        if b_type == 'wide':
            result.extend(b_items)
        else:
            min_x = min(it[2].x0 for it in b_items)
            max_x = max(it[2].x1 for it in b_items)
            span_x = max_x - min_x

            if span_x > page_w * 0.40 and len(b_items) > 1:
                x_mid = (min_x + max_x) / 2.0
                has_left = any(it[2].x1 <= x_mid + 20 for it in b_items)
                has_right = any(it[2].x0 >= x_mid - 20 for it in b_items)
                
                if has_left and has_right:
                    col_sorted = sorted(b_items, key=lambda it: (0 if (it[2].x0 + it[2].x1) / 2.0 < x_mid else 1, it[1]))
                    result.extend(col_sorted)
                else:
                    col_sorted = sorted(b_items, key=lambda it: it[1])
                    result.extend(col_sorted)
            else:
                col_sorted = sorted(b_items, key=lambda it: it[1])
                result.extend(col_sorted)

    return result

def get_background_colored_rects(page):
    """
    Extrae rectángulos con color de fondo (tarjetas, banners, celdas destacadas)
    para aplicar sombreado nativo <w:shd> de párrafo/celda en Word.
    """
    colored_rects = []
    try:
        drawings = page.get_drawings()
        page_area = page.rect.width * page.rect.height
        for d in drawings:
            fill = d.get('fill')
            r = d.get('rect')
            if fill and r and len(fill) >= 3:
                r_val, g_val, b_val = fill[0], fill[1], fill[2]
                if (r_val > 0.98 and g_val > 0.98 and b_val > 0.98) or (r_val < 0.02 and g_val < 0.02 and b_val < 0.02):
                    continue
                f_rect = fitz.Rect(r)
                area = f_rect.width * f_rect.height
                if 80 < area < (page_area * 0.92):
                    hex_color = f"{int(round(r_val * 255)):02X}{int(round(g_val * 255)):02X}{int(round(b_val * 255)):02X}"
                    colored_rects.append((f_rect, hex_color))
    except Exception:
        pass
    return colored_rects

def classify_vector_drawings(page, page_w, page_h, table_bboxes, current_drawing_id):
    """
    FASE 2: Clasificador inteligente de trazados vectoriales.
    Separa los gráficos vectoriales en:
    1. Líneas divisorias horizontales ('divider') -> emitidas como bordes o separadores nativos de Word
    2. Formas geométricas simples ('vector_shape') -> DrawingML <wps:wsp> (editables directamente en Word)
    3. Diagramas complejos ('diagram') -> Rasterizado selectivo PNG de alta fidelidad (fallback)
    """
    divider_items = []
    vector_shape_items = []
    complex_diagram_rects = []
    drawing_id = current_drawing_id
    
    try:
        drawings = page.get_drawings()
        page_area = page_w * page_h
        
        page_dict = page.get_text("dict")
        text_bboxes = [fitz.Rect(b["bbox"]) for b in page_dict.get("blocks", []) if b.get("type") == 0]
        
        for d in drawings:
            r = d.get('rect')
            if not r:
                continue
            f_rect = fitz.Rect(r)
            area = f_rect.width * f_rect.height
            items = d.get('items', [])
            if not items:
                continue
            
            is_single_line = (len(items) == 1 and items[0][0] == 'l')
            if not is_single_line and (area < 16 or area > (page_area * 0.88)):
                continue
            
            if any(t_bbox.contains(f_rect) or (area > 0 and t_bbox.intersects(f_rect) and (t_bbox & f_rect).get_area() > area * 0.50) for t_bbox in table_bboxes):
                continue
            
            # 1. Detección de línea divisoria horizontal
            is_horiz_line = False
            line_w = d.get('width', 1.0)
            stroke_color = d.get('color') or d.get('fill')
            
            if len(items) == 1:
                it = items[0]
                if it[0] == 'l':
                    p1, p2 = it[1], it[2]
                    if abs(p1.y - p2.y) <= 2.5 and abs(p1.x - p2.x) >= 45.0:
                        is_horiz_line = True
                elif it[0] == 're':
                    if f_rect.height <= 3.5 and f_rect.width >= 45.0:
                        is_horiz_line = True
            
            if is_horiz_line:
                hex_c = "D0D5DD"
                if stroke_color and len(stroke_color) >= 3:
                    hex_c = f"{int(round(stroke_color[0] * 255)):02X}{int(round(stroke_color[1] * 255)):02X}{int(round(stroke_color[2] * 255)):02X}"
                sz_val = max(4, int(round(line_w * 8)))
                
                div_xml = f"""<w:p><w:pPr><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/><w:pBdr><w:bottom w:val="single" w:sz="{sz_val}" w:space="1" w:color="{hex_c}"/></w:pBdr></w:pPr><w:r><w:t></w:t></w:r></w:p>"""
                divider_items.append(('divider', f_rect.y0, f_rect, div_xml))
                continue
            
            # 2. Detección de formas geométricas simples (Rectángulos, bordes decorativos)
            has_bezier = any(it[0] in ['c', 'qu'] for it in items)
            is_simple_shape = (len(items) == 1 and items[0][0] == 're') or (len(items) <= 4 and not has_bezier and f_rect.width > 20 and f_rect.height > 12)
            
            has_internal_text = any(f_rect.contains(tb) or (f_rect.intersects(tb) and (f_rect & tb).get_area() > tb.get_area() * 0.55) for tb in text_bboxes)
            
            if is_simple_shape and not has_internal_text and f_rect.width >= 20 and f_rect.height >= 12:
                w_emu = pt_to_emu(min(page_w - 60, f_rect.width))
                h_emu = pt_to_emu(f_rect.height)
                d_id = drawing_id
                drawing_id += 1
                
                fill_color = d.get('fill')
                fill_xml = '<a:noFill/>'
                if fill_color and len(fill_color) >= 3:
                    f_hex = f"{int(round(fill_color[0] * 255)):02X}{int(round(fill_color[1] * 255)):02X}{int(round(fill_color[2] * 255)):02X}"
                    fill_xml = f'<a:solidFill><a:srgbClr val="{f_hex}"/></a:solidFill>'
                
                stroke_c = d.get('color')
                stroke_xml = '<a:ln><a:noFill/></a:ln>'
                if stroke_c and len(stroke_c) >= 3:
                    s_hex = f"{int(round(stroke_c[0] * 255)):02X}{int(round(stroke_c[1] * 255)):02X}{int(round(stroke_c[2] * 255)):02X}"
                    ln_w_emu = pt_to_emu(max(0.5, d.get('width', 1.0)))
                    stroke_xml = f'<a:ln w="{ln_w_emu}"><a:solidFill><a:srgbClr val="{s_hex}"/></a:solidFill></a:ln>'
                
                shape_xml = f"""<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr><w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{w_emu}" cy="{h_emu}"/><wp:docPr id="{d_id}" name="Shape {d_id}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>{fill_xml}{stroke_xml}</wps:spPr><wps:bodyPr/></wps:wsp></a:graphicData></a:graphic></wp:inline></w:drawing></mc:Choice><mc:Fallback/></mc:AlternateContent></w:r></w:p>"""
                vector_shape_items.append(('vector_shape', f_rect.y0, f_rect, shape_xml))
                continue
            
            # 3. Gráficos complejos (curvas compuestas, estadísticas, infografías)
            if (has_bezier or len(items) > 3) and area >= 300:
                complex_diagram_rects.append(f_rect)
    except Exception:
        pass
    
    # Agrupación de rectángulos complejos para rasterizado selectivo
    merged_diagram_rects = []
    for cr in complex_diagram_rects:
        merged = False
        for idx, existing in enumerate(merged_diagram_rects):
            if existing.intersects(cr) or (existing | cr).get_area() < (existing.get_area() + cr.get_area()) * 1.30:
                merged_diagram_rects[idx] = existing | cr
                merged = True
                break
        if not merged:
            merged_diagram_rects.append(cr)
            
    return divider_items, vector_shape_items, merged_diagram_rects, drawing_id

def extract_safe_image_bytes(doc, xref):
    """
    Extrae la imagen del PDF garantizando conversión limpia a sRGB (PNG o JPEG).
    Maneja espacios de color CMYK y máscaras alfa de transparencia (/SMask).
    """
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n >= 5 or pix.colorspace.name == "DeviceCMYK":
            pix_rgb = fitz.Pixmap(fitz.csRGB, pix)
            pix = pix_rgb
        
        if pix.alpha:
            return pix.tobytes("png"), "png"
        else:
            return pix.tobytes("jpeg"), "jpeg"
    except Exception:
        try:
            base_img = doc.extract_image(xref)
            if base_img:
                ext = base_img.get("ext", "jpeg")
                if ext not in ["jpeg", "jpg", "png"]:
                    ext = "jpeg"
                return base_img["image"], ext
        except Exception:
            pass
    return None, None

def find_tessdata_dir():
    """Busca el directorio local con modelos de Tesseract (.traineddata)."""
    candidates = [
        os.getcwd(),
        os.path.join(os.getcwd(), "tessdata"),
        os.path.dirname(os.path.abspath(__file__)),
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        os.environ.get("TESSDATA_PREFIX", "")
    ]
    for c in candidates:
        if c and os.path.isdir(c):
            if os.path.exists(os.path.join(c, "spa.traineddata")) or os.path.exists(os.path.join(c, "eng.traineddata")):
                return c
    return None

def is_safe_hyphen_break(prev_text, next_text):
    """
    Verifica si un guion al final de línea es un salto de palabra morfológico
    y no parte de una palabra compuesta establecida (ej. e-commerce, COVID-19, etc.).
    """
    if not prev_text or not prev_text.endswith('-') or len(prev_text) < 2:
        return False
    
    prefix = prev_text[:-1].strip()
    if not prefix:
        return False
    
    if re.search(r'\d$', prefix) or prefix.lower() in ['e', 'co', 'pre', 'post', 'sub', 'non']:
        return False
    
    if next_text and next_text[0].isupper():
        return False
    
    return True

def convert_pdf_to_docx(pdf_path, output_docx_path, pages=None, layout_mode="flowing", include_images=True, primary_font="Calibri", add_page_breaks=True, include_header=True):
    doc = fitz.open(pdf_path)
    
    media_files = {}
    image_hash_to_rid = {}
    link_uri_to_rid = {}
    
    target_page_indices = pages if pages is not None else list(range(len(doc)))
    total_targets = len(target_page_indices)
    
    # ── 1. EXTRACCIÓN DE METADATOS Y ANÁLISIS DE RUNNING HEADERS / FOOTERS ──
    header_candidates = []
    font_sizes = []
    sample_pages = target_page_indices[:min(30, total_targets)]
    
    for p_idx in sample_pages:
        if 0 <= p_idx < len(doc):
            p_dict = doc[p_idx].get_text("dict")
            for b in p_dict.get("blocks", []):
                if b.get("type") == 0:
                    by0 = b.get("bbox")[1]
                    raw_block = "".join(s.get("text", "") for l in b.get("lines", []) for s in l.get("spans", [])).strip()
                    if by0 < 55 and len(raw_block) > 3 and not raw_block.isdigit():
                        header_candidates.append(normalize_unicode(raw_block))
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            txt = span.get("text", "").strip()
                            if len(txt) > 3:
                                font_sizes.append(round(span.get("size", 11), 1))
    
    detected_running_header = None
    if header_candidates:
        counts = Counter(header_candidates)
        most_common, count = counts.most_common(1)[0]
        if count >= 2 or (total_targets == 1 and count >= 1):
            detected_running_header = most_common

    body_font_size = 11.0
    if font_sizes:
        body_font_size = max(set(font_sizes), key=font_sizes.count)
    
    heading1_threshold = body_font_size + 4.0
    heading2_threshold = body_font_size + 1.8
    
    # ── 2. PREPARAR MARCADORES DE ÍNDICE (TOC) Y RELACIONES DE DOCUMENTO ──
    bookmark_counter = 1
    doc_toc = doc.get_toc() # [[lvl, title, pno], ...]
    toc_titles_map = {}
    for lvl, title, pno in doc_toc:
        clean_title = normalize_unicode(title).strip().lower()
        if clean_title:
            toc_titles_map[clean_title] = f"_toc_bm_{bookmark_counter}"
            bookmark_counter += 1

    doc_rels = [
        ('rId1', 'styles.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles'),
        ('rId2', 'fontTable.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable'),
        ('rId3', 'settings.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings'),
        ('rId4', 'numbering.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering'),
        ('rId5', 'header1.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'),
        ('rId6', 'footer1.xml', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer'),
    ]
    
    rel_counter = 10
    image_counter = 1
    drawing_id = 1
    
    body_elements = []
    tessdata_dir = find_tessdata_dir()
    
    # ── MODO 1: TEXTO FLUIDO PROFESIONAL ──
    if layout_mode == "flowing":
        prev_page_geometry = None
        
        for idx_num, page_idx in enumerate(target_page_indices):
            if page_idx < 0 or page_idx >= len(doc):
                continue
            page = doc[page_idx]
            rect = page.rect
            page_w = rect.width
            page_h = rect.height
            page_links = page.get_links()
            page_bg_rects = get_background_colored_rects(page)
            
            # Marcador interno de página para navegación (ej. _page_1, _page_2)
            page_anchor_id = bookmark_counter
            bookmark_counter += 1
            body_elements.append(f'<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:bookmarkStart w:id="{page_anchor_id}" w:name="_page_{idx_num + 1}"/><w:bookmarkEnd w:id="{page_anchor_id}"/></w:p>')
            
            # ── 1. DETECCIÓN DUAL INTELIGENTE DE TABLAS (LATTICE + STREAM CON RECORTE) ──
            table_bboxes = []
            table_items = []
            detected_tables = []
            
            try:
                tabs_lines = page.find_tables(strategy="lines")
                if tabs_lines and tabs_lines.tables:
                    for t in tabs_lines.tables:
                        extracted = t.extract()
                        if extracted and len(extracted) > 0:
                            detected_tables.append({
                                'tbl_obj': t,
                                'bbox': fitz.Rect(t.bbox),
                                'cells_data': extracted,
                                'rows_obj': t.rows,
                                'is_borderless': False
                            })
                
                tabs_text = page.find_tables(strategy="text", min_words_vertical=2)
                if tabs_text and tabs_text.tables:
                    for t in tabs_text.tables:
                        raw_cells = t.extract()
                        if not raw_cells:
                            continue
                        
                        max_cols_candidate = max(len([c for c in row if c and str(c).strip()]) for row in raw_cells) if raw_cells else 0
                        
                        def is_table_content_row(row, max_cols):
                            non_empty = [str(c).strip() for c in row if c and str(c).strip()]
                            if len(non_empty) < 2:
                                return False
                            total_len = sum(len(c) for c in non_empty)
                            if total_len > 45:
                                return False
                            if len(non_empty) == 2 and len(non_empty[0]) > 18:
                                return False
                            return True
                            
                        valid_row_indices = [
                            i for i, row in enumerate(raw_cells)
                            if is_table_content_row(row, max_cols_candidate)
                        ]
                        
                        if len(valid_row_indices) >= 2:
                            start_r = min(valid_row_indices)
                            end_r = max(valid_row_indices)
                            
                            trimmed_rows_obj = t.rows[start_r:end_r + 1] if hasattr(t, 'rows') else []
                            trimmed_cells_data = raw_cells[start_r:end_r + 1]
                            
                            all_actual_cells = [
                                c for r in trimmed_rows_obj if hasattr(r, 'cells') and r.cells
                                for c in r.cells if c is not None
                            ]
                            if all_actual_cells:
                                x0 = min(c[0] for c in all_actual_cells)
                                y0 = min(c[1] for c in all_actual_cells)
                                x1 = max(c[2] for c in all_actual_cells)
                                y1 = max(c[3] for c in all_actual_cells)
                                trimmed_bbox = fitz.Rect(x0, y0, x1, y1)
                            else:
                                trimmed_bbox = fitz.Rect(t.bbox)
                            
                            overlaps = any(
                                trimmed_bbox.intersects(dt['bbox']) and 
                                (trimmed_bbox & dt['bbox']).get_area() > trimmed_bbox.get_area() * 0.40
                                for dt in detected_tables
                            )
                            if not overlaps:
                                detected_tables.append({
                                    'tbl_obj': t,
                                    'bbox': trimmed_bbox,
                                    'cells_data': trimmed_cells_data,
                                    'rows_obj': trimmed_rows_obj,
                                    'is_borderless': True
                                })
                
                for t_info in detected_tables:
                    tbl = t_info['tbl_obj']
                    tbl_bbox = t_info['bbox']
                    tbl_cells = t_info['cells_data']
                    tbl_rows = t_info['rows_obj']
                    is_borderless = t_info['is_borderless']
                    
                    table_bboxes.append(tbl_bbox)
                    
                    if tbl_cells and len(tbl_cells) > 0:
                        col_count = tbl.col_count if hasattr(tbl, 'col_count') and tbl.col_count else max(len(row) for row in tbl_cells if row)
                        
                        col_widths_dxa = []
                        best_row = None
                        for r in tbl_rows:
                            if hasattr(r, 'cells') and r.cells and len([c for c in r.cells if c is not None]) == col_count:
                                best_row = r
                                break
                        if best_row is None and len(tbl_rows) > 0:
                            best_row = tbl_rows[0]
                            
                        if best_row and hasattr(best_row, 'cells'):
                            for c_idx in range(col_count):
                                if c_idx < len(best_row.cells) and best_row.cells[c_idx] is not None:
                                    c_rect = best_row.cells[c_idx]
                                    w_pt = max(20.0, c_rect[2] - c_rect[0])
                                    col_widths_dxa.append(pt_to_dxa(w_pt))
                                else:
                                    col_widths_dxa.append(pt_to_dxa(tbl_bbox.width / max(1, col_count)))
                        else:
                            default_w = pt_to_dxa(tbl_bbox.width / max(1, col_count))
                            col_widths_dxa = [default_w] * col_count
                        
                        grid_xml = "".join([f'<w:gridCol w:w="{w_dxa}"/>' for w_dxa in col_widths_dxa])
                        
                        rows_xml = []
                        vertical_merge_tracker = [False] * col_count
                        
                        for r_idx, row in enumerate(tbl_cells):
                            is_header_row = (r_idx == 0)
                            tr_pr = "<w:tblHeader/>" if is_header_row else ""
                            
                            table_row_obj = tbl_rows[r_idx] if r_idx < len(tbl_rows) else None
                            row_cells_geom = table_row_obj.cells if (table_row_obj and hasattr(table_row_obj, 'cells')) else None
                            
                            cells_xml = []
                            c_idx = 0
                            while c_idx < col_count:
                                cell_val = row[c_idx] if c_idx < len(row) else None
                                cell_geom = row_cells_geom[c_idx] if (row_cells_geom and c_idx < len(row_cells_geom)) else None
                                
                                if cell_val is None and vertical_merge_tracker[c_idx]:
                                    c_w = col_widths_dxa[c_idx] if c_idx < len(col_widths_dxa) else 1440
                                    v_tc_xml = f"""<w:tc><w:tcPr><w:tcW w:w="{c_w}" w:type="dxa"/><w:vMerge/></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t></w:t></w:r></w:p></w:tc>"""
                                    cells_xml.append(v_tc_xml)
                                    c_idx += 1
                                    continue
                                
                                span_cols = 1
                                if cell_geom is not None:
                                    while (c_idx + span_cols < col_count and 
                                           row_cells_geom and 
                                           (c_idx + span_cols < len(row_cells_geom)) and 
                                           row_cells_geom[c_idx + span_cols] is None and
                                           (c_idx + span_cols < len(row)) and
                                           row[c_idx + span_cols] is None):
                                        span_cols += 1
                                
                                is_vmerge_start = False
                                if cell_geom and r_idx + 1 < len(tbl_rows):
                                    next_r_obj = tbl_rows[r_idx + 1]
                                    if hasattr(next_r_obj, 'cells') and next_r_obj.cells and c_idx < len(next_r_obj.cells):
                                        if next_r_obj.cells[c_idx] is None and r_idx + 1 < len(tbl_cells) and tbl_cells[r_idx + 1][c_idx] is None:
                                            is_vmerge_start = True
                                            vertical_merge_tracker[c_idx] = True
                                        else:
                                            vertical_merge_tracker[c_idx] = False
                                    else:
                                        vertical_merge_tracker[c_idx] = False
                                else:
                                    vertical_merge_tracker[c_idx] = False
                                
                                cell_w_dxa = sum(col_widths_dxa[c_idx:c_idx + span_cols]) if c_idx < len(col_widths_dxa) else 1440
                                
                                tc_pr_parts = [f'<w:tcW w:w="{cell_w_dxa}" w:type="dxa"/>']
                                if span_cols > 1:
                                    tc_pr_parts.append(f'<w:gridSpan w:val="{span_cols}"/>')
                                if is_vmerge_start:
                                    tc_pr_parts.append('<w:vMerge w:val="restart"/>')
                                    
                                cell_bg_hex = None
                                if cell_geom:
                                    c_rect_obj = fitz.Rect(cell_geom)
                                    for bg_r, bg_hex in page_bg_rects:
                                        if bg_r.contains(c_rect_obj) or (bg_r.intersects(c_rect_obj) and (bg_r & c_rect_obj).get_area() > c_rect_obj.get_area() * 0.45):
                                            cell_bg_hex = bg_hex
                                            break
                                
                                if cell_bg_hex:
                                    tc_pr_parts.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{cell_bg_hex}"/>')
                                elif is_header_row and not is_borderless:
                                    tc_pr_parts.append('<w:shd w:val="clear" w:color="auto" w:fill="F2F4F7"/>')
                                
                                tc_pr_parts.append('<w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar>')
                                
                                paras_in_cell = []
                                cell_extracted_spans = False
                                
                                if cell_geom:
                                    c_clip_rect = fitz.Rect(cell_geom)
                                    cell_dict = page.get_text("dict", clip=c_clip_rect)
                                    c_blocks = cell_dict.get("blocks", [])
                                    
                                    for cb in c_blocks:
                                        if cb.get("type") == 0:
                                            for cl in cb.get("lines", []):
                                                c_runs_xml = []
                                                for cs in cl.get("spans", []):
                                                    raw_cs_txt = cs.get("text", "")
                                                    if not raw_cs_txt:
                                                        continue
                                                    cs_txt = normalize_unicode(raw_cs_txt)
                                                    cs_f_size = max(7, cs.get("size", body_font_size - 1))
                                                    cs_f_name = normalize_font(cs.get("font", ""), primary_font)
                                                    cs_color = int_to_hex_color(cs.get("color", 0))
                                                    cs_flags = cs.get("flags", 0)
                                                    cs_bold = bool(cs_flags & 2 ** 4) or "bold" in cs.get("font", "").lower() or is_header_row
                                                    cs_italic = bool(cs_flags & 2 ** 1) or "italic" in cs.get("font", "").lower()
                                                    
                                                    bold_tag = "<w:b/>" if cs_bold else ""
                                                    italic_tag = "<w:i/>" if cs_italic else ""
                                                    sz_tag = f'<w:sz w:val="{int(round(cs_f_size * 2))}"/><w:szCs w:val="{int(round(cs_f_size * 2))}"/>'
                                                    
                                                    cs_rect = fitz.Rect(cs.get("bbox", (0, 0, 0, 0)))
                                                    c_link_uri = None
                                                    c_link_anchor = None
                                                    if page_links:
                                                        for pl in page_links:
                                                            if pl.get("from") and fitz.Rect(pl["from"]).intersects(cs_rect):
                                                                if pl.get("kind") == fitz.LINK_URI:
                                                                    c_link_uri = pl.get("uri")
                                                                    break
                                                                elif pl.get("kind") == fitz.LINK_GOTO and pl.get("page") is not None:
                                                                    c_link_anchor = f"_page_{pl.get('page') + 1}"
                                                                    break
                                                    
                                                    text_content_xml = serialize_text_to_openxml(cs_txt)
                                                    c_scale, c_spacing = compute_metric_calibration(cs_txt, cs_f_size, cs_f_name, cs_rect.width)
                                                    c_scale_tag = f'<w:w w:val="{c_scale}"/>' if c_scale else ""
                                                    c_spacing_tag = f'<w:spacing w:val="{c_spacing}"/>' if c_spacing else ""
                                                    
                                                    if c_link_uri:
                                                        if c_link_uri in link_uri_to_rid:
                                                            l_rid = link_uri_to_rid[c_link_uri]
                                                        else:
                                                            l_rid = f"rId{rel_counter}"
                                                            rel_counter += 1
                                                            link_uri_to_rid[c_link_uri] = l_rid
                                                            doc_rels.append((l_rid, c_link_uri, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', 'External'))
                                                        r_xml_core = f"""<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:rFonts w:ascii="{escape_xml(cs_f_name)}" w:hAnsi="{escape_xml(cs_f_name)}"/><w:color w:val="0563C1"/>{c_spacing_tag}{c_scale_tag}<w:sz w:val="{int(round(cs_f_size * 2))}"/><w:szCs w:val="{int(round(cs_f_size * 2))}"/><w:u w:val="single"/>{bold_tag}{italic_tag}</w:rPr>{text_content_xml}</w:r>"""
                                                        c_runs_xml.append(f"""<w:hyperlink r:id="{l_rid}" w:history="1">{r_xml_core}</w:hyperlink>""")
                                                    elif c_link_anchor:
                                                        r_xml_core = f"""<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:rFonts w:ascii="{escape_xml(cs_f_name)}" w:hAnsi="{escape_xml(cs_f_name)}"/><w:color w:val="0563C1"/>{c_spacing_tag}{c_scale_tag}<w:sz w:val="{int(round(cs_f_size * 2))}"/><w:szCs w:val="{int(round(cs_f_size * 2))}"/><w:u w:val="single"/>{bold_tag}{italic_tag}</w:rPr>{text_content_xml}</w:r>"""
                                                        c_runs_xml.append(f"""<w:hyperlink w:anchor="{c_link_anchor}" w:history="1">{r_xml_core}</w:hyperlink>""")
                                                    else:
                                                        run_xml = f"""<w:r><w:rPr><w:rFonts w:ascii="{escape_xml(cs_f_name)}" w:hAnsi="{escape_xml(cs_f_name)}"/><w:color w:val="{cs_color}"/>{c_spacing_tag}{c_scale_tag}{sz_tag}{bold_tag}{italic_tag}</w:rPr>{text_content_xml}</w:r>"""
                                                        c_runs_xml.append(run_xml)
                                                
                                                if c_runs_xml:
                                                    paras_in_cell.append(f"""<w:p><w:pPr><w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/></w:pPr>{"".join(c_runs_xml)}</w:p>""")
                                                    cell_extracted_spans = True
                                
                                if not cell_extracted_spans:
                                    clean_cell_str = str(cell_val).strip() if cell_val is not None else ""
                                    cell_lines = clean_cell_str.split('\n') if clean_cell_str else [""]
                                    bold_xml = '<w:b/>' if is_header_row else ''
                                    header_color_xml = '<w:color w:val="1F4E79"/>' if is_header_row else '<w:color w:val="262626"/>'
                                    
                                    for cl in cell_lines:
                                        cl_norm = normalize_unicode(cl.strip())
                                        p_cell = f"""<w:p><w:pPr><w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/><w:sz w:val="{int(round(max(8, body_font_size - 1) * 2))}"/><w:szCs w:val="{int(round(max(8, body_font_size - 1) * 2))}"/>{bold_xml}{header_color_xml}</w:rPr>{serialize_text_to_openxml(cl_norm)}</w:r></w:p>"""
                                        paras_in_cell.append(p_cell)
                                
                                if not paras_in_cell:
                                    paras_in_cell.append('<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t></w:t></w:r></w:p>')
                                
                                tc_xml = f"""<w:tc><w:tcPr>{"".join(tc_pr_parts)}</w:tcPr>{"".join(paras_in_cell)}</w:tc>"""
                                cells_xml.append(tc_xml)
                                
                                c_idx += span_cols
                            
                            rows_xml.append(f"""<w:tr><w:trPr>{tr_pr}</w:trPr>{"".join(cells_xml)}</w:tr>""")
                        
                        if is_borderless:
                            tbl_borders_xml = '<w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>'
                        else:
                            tbl_borders_xml = '<w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="B0C4DE"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="B0C4DE"/><w:right w:val="none"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="none"/></w:tblBorders>'
                        
                        tbl_full_xml = f"""<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/>{tbl_borders_xml}<w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>{grid_xml}</w:tblGrid>{"".join(rows_xml)}</w:tbl>"""
                        table_items.append(('table', tbl_bbox.y0, tbl_bbox, tbl_full_xml))
            except Exception:
                pass
            
            # ── 2. FASE 2: CLASIFICACIÓN DE TRAZADOS VECTORIALES (LÍNEAS DIVISORIAS, FORMAS DRAWINGML Y DIAGRAMAS) ──
            image_items = []
            diagram_items = []
            diagram_bboxes = []
            
            divider_items, vector_shape_items, merged_diagram_rects, drawing_id = classify_vector_drawings(
                page, page_w, page_h, table_bboxes, drawing_id
            )
            
            if include_images:
                try:
                    for d_rect in merged_diagram_rects:
                        diagram_bboxes.append(d_rect)
                        pix = page.get_pixmap(clip=d_rect, dpi=220)
                        img_bytes = pix.tobytes("png")
                        img_name = f"diagram{image_counter}.png"
                        image_counter += 1
                        r_id = f"rId{rel_counter}"
                        rel_counter += 1
                        
                        media_files[f"word/media/{img_name}"] = img_bytes
                        doc_rels.append((r_id, f"media/{img_name}", 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'))
                        
                        disp_w = min(page_w - 60, d_rect.width)
                        disp_h = disp_w * (d_rect.height / max(1, d_rect.width))
                        w_emu = pt_to_emu(disp_w)
                        h_emu = pt_to_emu(disp_h)
                        d_id = drawing_id
                        drawing_id += 1
                        
                        diag_xml = f"""<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{w_emu}" cy="{h_emu}"/><wp:docPr id="{d_id}" name="Diagram {d_id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="Diagram {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>"""
                        diagram_items.append(('diagram', d_rect.y0, d_rect, diag_xml))
                except Exception:
                    pass
                
                try:
                    for img_info in page.get_images(full=True):
                        xref = img_info[0]
                        img_bytes, img_ext = extract_safe_image_bytes(doc, xref)
                        if img_bytes:
                            img_hash = hashlib.sha256(img_bytes).hexdigest()
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
                            
                            rects = page.get_image_rects(xref)
                            img_rect = rects[0] if (rects and len(rects) > 0) else None
                            
                            if img_rect and img_rect.width > 10:
                                display_w_pt = min(page_w - 60, max(20, img_rect.width))
                                display_h_pt = display_w_pt * (img_rect.height / max(1, img_rect.width))
                                item_y0 = img_rect.y0
                                item_rect = img_rect
                            else:
                                display_w_pt = min(page_w - 60, 360)
                                display_h_pt = 240
                                item_y0 = page_h * 0.5
                                item_rect = fitz.Rect(30, item_y0, 30 + display_w_pt, item_y0 + display_h_pt)
                            
                            w_emu = pt_to_emu(display_w_pt)
                            h_emu = pt_to_emu(display_h_pt)
                            d_id = drawing_id
                            drawing_id += 1
                            
                            img_xml = f"""<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{w_emu}" cy="{h_emu}"/><wp:docPr id="{d_id}" name="Picture {d_id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="Picture {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>"""
                            image_items.append(('image', item_y0, item_rect, img_xml))
                except Exception:
                    pass
            
            # ── 3. OBTENER Y FILTRAR BLOQUES DE TEXTO NATIVOS ──
            page_dict = page.get_text("dict")
            blocks = page_dict.get("blocks", [])
            has_text = any(b.get("type") == 0 and any(s.get("text", "").strip() for line in b.get("lines", []) for s in line.get("spans", [])) for b in blocks)
            
            if not has_text and tessdata_dir:
                try:
                    tp = page.get_textpage_ocr(tessdata=tessdata_dir, language="spa+eng", dpi=200)
                    ocr_dict = page.get_text("dict", textpage=tp)
                    ocr_blocks = ocr_dict.get("blocks", [])
                    if any(b.get("type") == 0 and any(s.get("text", "").strip() for line in b.get("lines", []) for s in line.get("spans", [])) for b in ocr_blocks):
                        blocks = ocr_blocks
                        has_text = True
                except Exception:
                    pass
            
            text_items = []
            for b in blocks:
                if b.get("type") == 0:
                    bx0, by0, bx1, by1 = b.get("bbox")
                    b_rect = fitz.Rect(bx0, by0, bx1, by1)
                    
                    in_table = any(t_bbox.contains(b_rect) or (t_bbox.intersects(b_rect) and (t_bbox & b_rect).get_area() > b_rect.get_area() * 0.55) for t_bbox in table_bboxes)
                    if in_table:
                        continue
                    
                    in_diagram = any(d_bbox.contains(b_rect) or (d_bbox.intersects(b_rect) and (d_bbox & b_rect).get_area() > b_rect.get_area() * 0.50) for d_bbox in diagram_bboxes)
                    if in_diagram:
                        continue
                    
                    block_text_raw = "".join([span.get("text", "") for line in b.get("lines", []) for span in line.get("spans", [])]).strip()
                    
                    if detected_running_header and by0 < 55 and normalize_unicode(block_text_raw) == detected_running_header:
                        continue
                    
                    if by1 > (page_h - 55):
                        if block_text_raw.isdigit() or re.match(r'^(?:p[aá]g(?:ina)?\.?\s*\d+|\d+\s*/\s*\d+|page\s*\d+)$', block_text_raw, re.IGNORECASE):
                            continue
                    
                    if block_text_raw:
                        text_items.append(('text', by0, b_rect, b))
            
            # ── 4. PIPELINE UNIFICADO: COMBINAR Y ORDENAR ELEMENTOS (TEXTO, TABLAS, FORMAS DRAWINGML, SEPARADORES, IMÁGENES) ──
            all_page_items = table_items + divider_items + vector_shape_items + image_items + diagram_items + text_items
            all_page_items = sort_items_reading_order(all_page_items, page_w)
            
            # ── 5. PROCESAR CADA ELEMENTO EN ORDEN NATURAL DE LECTURA ──
            for item_type, _, item_rect, item_data in all_page_items:
                if item_type in ['table', 'image', 'diagram', 'divider', 'vector_shape']:
                    body_elements.append(item_data)
                    continue
                
                b = item_data
                lines = b.get("lines", [])
                if not lines:
                    continue
                
                line_pitches = []
                for i in range(1, len(lines)):
                    pitch = lines[i]["bbox"][1] - lines[i-1]["bbox"][1]
                    if pitch > 0:
                        line_pitches.append(pitch)
                typical_pitch = (sum(line_pitches) / len(line_pitches)) if line_pitches else 14.0
                
                paragraph_chunks = []
                current_chunk_lines = []
                prev_line_obj = None
                
                for line in lines:
                    spans = line.get("spans", [])
                    if not spans or not any(s.get("text", "").strip() for s in spans):
                        continue
                    
                    line_rect = fitz.Rect(line.get("bbox"))
                    first_span_text = spans[0].get("text", "").lstrip()
                    is_bullet_line, _, _ = parse_bullet_prefix(first_span_text)
                    
                    should_split = False
                    if prev_line_obj is not None:
                        prev_rect = fitz.Rect(prev_line_obj.get("bbox"))
                        vert_gap = line_rect.y0 - prev_rect.y1
                        line_pitch_here = line_rect.y0 - prev_rect.y0
                        
                        if is_bullet_line or line_pitch_here > (typical_pitch * 1.45) or vert_gap > (prev_rect.height * 1.1):
                            should_split = True
                    
                    if should_split and current_chunk_lines:
                        paragraph_chunks.append(current_chunk_lines)
                        current_chunk_lines = [line]
                    else:
                        current_chunk_lines.append(line)
                    
                    prev_line_obj = line
                
                if current_chunk_lines:
                    paragraph_chunks.append(current_chunk_lines)
                
                for p_lines in paragraph_chunks:
                    para_runs = []
                    max_font_size = 0
                    total_text_len = 0
                    
                    p_sizes = [s.get("size", body_font_size) for l in p_lines for s in l.get("spans", []) if s.get("text", "").strip()]
                    p_avg_font_size = (sum(p_sizes) / len(p_sizes)) if p_sizes else body_font_size
                    
                    for line_idx, line in enumerate(p_lines):
                        spans = line.get("spans", [])
                        line_runs = []
                        prev_span_bbox = None
                        line_y1 = line.get("bbox", (0, 0, 0, 0))[3]
                        
                        for span in spans:
                            raw_txt = span.get("text", "")
                            if not raw_txt:
                                continue
                            
                            txt = normalize_unicode(raw_txt)
                            f_size = max(7, span.get("size", body_font_size))
                            if f_size > max_font_size:
                                max_font_size = f_size
                            
                            raw_font_name = span.get("font", "")
                            f_name = normalize_font(raw_font_name, primary_font)
                            f_color = int_to_hex_color(span.get("color", 0))
                            flags = span.get("flags", 0)
                            
                            is_bold = bool(flags & 2 ** 4) or "bold" in raw_font_name.lower() or "heavy" in raw_font_name.lower() or "black" in raw_font_name.lower()
                            is_italic = bool(flags & 2 ** 1) or "italic" in raw_font_name.lower() or "oblique" in raw_font_name.lower()
                            
                            span_bbox = span.get("bbox", (0, 0, 0, 0))
                            span_rect = fitz.Rect(span_bbox)
                            
                            vert_align = None
                            if f_size < (p_avg_font_size * 0.82):
                                if span_bbox[3] < (line_y1 - f_size * 0.20):
                                    vert_align = "superscript"
                                elif span_bbox[1] > (line.get("bbox")[1] + f_size * 0.20):
                                    vert_align = "subscript"
                            
                            if prev_span_bbox is not None and line_runs:
                                horiz_gap = span_bbox[0] - prev_span_bbox[2]
                                if horiz_gap > (f_size * 0.26):
                                    prev_txt = line_runs[-1]['text']
                                    if not prev_txt.endswith(' ') and not txt.startswith((' ', ',', '.', ';', ':', '!', '?', ')', ']', '}', '%')):
                                        line_runs[-1]['text'] += ' '
                            
                            prev_span_bbox = span_bbox
                            
                            link_uri = None
                            link_anchor = None
                            if page_links:
                                for pl in page_links:
                                    if pl.get("from") and fitz.Rect(pl["from"]).intersects(span_rect):
                                        kind = pl.get("kind")
                                        if kind == fitz.LINK_URI:
                                            link_uri = pl.get("uri")
                                            break
                                        elif kind == fitz.LINK_GOTO:
                                            target_page_idx = pl.get("page")
                                            if target_page_idx is not None:
                                                link_anchor = f"_page_{target_page_idx + 1}"
                                                break
                            
                            line_runs.append({
                                'text': txt,
                                'font': f_name,
                                'color': f_color,
                                'size': f_size,
                                'bold': is_bold,
                                'italic': is_italic,
                                'vert_align': vert_align,
                                'link_uri': link_uri,
                                'link_anchor': link_anchor,
                                'visual_w': span_rect.width,
                            })
                            total_text_len += len(txt)
                        
                        if not line_runs:
                            continue
                        
                        if para_runs and len(para_runs) > 0:
                            prev_last_run = para_runs[-1]
                            next_first_text = line_runs[0]['text'].strip()
                            if is_safe_hyphen_break(prev_last_run['text'], next_first_text):
                                prev_last_run['text'] = prev_last_run['text'][:-1]
                            elif not prev_last_run['text'].endswith(' ') and not line_runs[0]['text'].startswith((' ', ',', '.', ';', ':', ')', ']')):
                                prev_last_run['text'] += ' '
                        
                        para_runs.extend(line_runs)
                    
                    if not para_runs:
                        continue
                    
                    first_run_text = para_runs[0]['text']
                    is_bullet, bullet_type, clean_first_text = parse_bullet_prefix(first_run_text)
                    if is_bullet:
                        para_runs[0]['text'] = clean_first_text
                    
                    is_heading1 = (max_font_size >= heading1_threshold) and total_text_len < 160 and not is_bullet
                    is_heading2 = (max_font_size >= heading2_threshold and not is_heading1) and total_text_len < 200 and not is_bullet
                    
                    block_bg_hex = None
                    if page_bg_rects and item_rect:
                        for bg_r, bg_hex in page_bg_rects:
                            if bg_r.contains(item_rect) or (bg_r.intersects(item_rect) and (bg_r & item_rect).get_area() > item_rect.get_area() * 0.40):
                                block_bg_hex = bg_hex
                                break

                    p_pr_elements = []
                    if block_bg_hex:
                        p_pr_elements.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{block_bg_hex}"/>')

                    if is_heading1:
                        p_pr_elements.append('<w:pStyle w:val="Heading1"/>')
                        p_pr_elements.append('<w:spacing w:before="240" w:after="120" w:line="280" w:lineRule="auto"/>')
                    elif is_heading2:
                        p_pr_elements.append('<w:pStyle w:val="Heading2"/>')
                        p_pr_elements.append('<w:spacing w:before="180" w:after="80" w:line="260" w:lineRule="auto"/>')
                    elif is_bullet:
                        num_id = "2" if bullet_type == 'number' else "1"
                        p_pr_elements.append(f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num_id}"/></w:numPr>')
                        p_pr_elements.append('<w:spacing w:before="40" w:after="60" w:line="240" w:lineRule="auto"/>')
                    else:
                        p_pr_elements.append('<w:spacing w:before="0" w:after="90" w:line="260" w:lineRule="auto"/>')
                        if total_text_len > 140:
                            p_pr_elements.append('<w:jc w:val="both"/>')
                    
                    xml_runs = []
                    
                    matched_toc_bm = None
                    if is_heading1 or is_heading2:
                        p_raw_title = "".join(r['text'] for r in para_runs).strip().lower()
                        if p_raw_title in toc_titles_map:
                            matched_toc_bm = toc_titles_map[p_raw_title]
                            bm_id = bookmark_counter
                            bookmark_counter += 1
                            xml_runs.append(f'<w:bookmarkStart w:id="{bm_id}" w:name="{matched_toc_bm}"/>')

                    for r_data in para_runs:
                        t_clean = r_data['text']
                        if not t_clean:
                            continue
                        
                        bold_tag = "<w:b/>" if r_data['bold'] else ""
                        italic_tag = "<w:i/>" if r_data['italic'] else ""
                        vert_tag = f'<w:vertAlign w:val="{r_data["vert_align"]}"/>' if r_data.get('vert_align') else ""
                        sz_val = int(round(r_data['size'] * 2))
                        
                        f_col = r_data['color']
                        if block_bg_hex:
                            try:
                                b_r = int(block_bg_hex[0:2], 16)
                                b_g = int(block_bg_hex[2:4], 16)
                                b_b = int(block_bg_hex[4:6], 16)
                                bg_lum = 0.299 * b_r + 0.587 * b_g + 0.114 * b_b
                                if bg_lum < 140 and (f_col.lower() in ['000000', 'auto', '333333', '1f4e79']):
                                    f_col = 'FFFFFF'
                            except Exception:
                                pass

                        text_xml_content = serialize_text_to_openxml(t_clean)
                        l_uri = r_data.get('link_uri')
                        l_anchor = r_data.get('link_anchor')
                        
                        m_scale, m_spacing = compute_metric_calibration(t_clean, r_data['size'], r_data['font'], r_data.get('visual_w', 0))
                        scale_tag = f'<w:w w:val="{m_scale}"/>' if m_scale else ""
                        spacing_tag = f'<w:spacing w:val="{m_spacing}"/>' if m_spacing else ""

                        if l_uri:
                            if l_uri in link_uri_to_rid:
                                l_rid = link_uri_to_rid[l_uri]
                            else:
                                l_rid = f"rId{rel_counter}"
                                rel_counter += 1
                                link_uri_to_rid[l_uri] = l_rid
                                doc_rels.append((l_rid, l_uri, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', 'External'))
                            
                            r_xml_core = f"""<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:rFonts w:ascii="{escape_xml(r_data['font'])}" w:hAnsi="{escape_xml(r_data['font'])}"/><w:color w:val="0563C1"/>{spacing_tag}{scale_tag}<w:sz w:val="{sz_val}"/><w:szCs w:val="{sz_val}"/><w:u w:val="single"/>{bold_tag}{italic_tag}{vert_tag}</w:rPr>{text_xml_content}</w:r>"""
                            xml_runs.append(f"""<w:hyperlink r:id="{l_rid}" w:history="1">{r_xml_core}</w:hyperlink>""")
                        elif l_anchor:
                            r_xml_core = f"""<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:rFonts w:ascii="{escape_xml(r_data['font'])}" w:hAnsi="{escape_xml(r_data['font'])}"/><w:color w:val="0563C1"/>{spacing_tag}{scale_tag}<w:sz w:val="{sz_val}"/><w:szCs w:val="{sz_val}"/><w:u w:val="single"/>{bold_tag}{italic_tag}{vert_tag}</w:rPr>{text_xml_content}</w:r>"""
                            xml_runs.append(f"""<w:hyperlink w:anchor="{l_anchor}" w:history="1">{r_xml_core}</w:hyperlink>""")
                        else:
                            xml_runs.append(
                                f"""<w:r><w:rPr><w:rFonts w:ascii="{escape_xml(r_data['font'])}" w:hAnsi="{escape_xml(r_data['font'])}"/><w:color w:val="{f_col}"/>{spacing_tag}{scale_tag}<w:sz w:val="{sz_val}"/><w:szCs w:val="{sz_val}"/>{bold_tag}{italic_tag}{vert_tag}</w:rPr>{text_xml_content}</w:r>"""
                            )
                    
                    if matched_toc_bm:
                        xml_runs.append(f'<w:bookmarkEnd w:id="{bm_id}"/>')
                    
                    if xml_runs:
                        p_xml = f"""<w:p><w:pPr>{"".join(p_pr_elements)}</w:pPr>{"".join(xml_runs)}</w:p>"""
                        body_elements.append(p_xml)
            
            p_w_dxa = pt_to_dxa(page_w)
            p_h_dxa = pt_to_dxa(page_h)
            is_landscape = page_w > page_h
            orient = "landscape" if is_landscape else "portrait"
            mar_size = 540 if (page_w < 520 or page_h < 520) else 720
            
            current_geom = (p_w_dxa, p_h_dxa, orient)
            sect_xml = f"""<w:sectPr><w:headerReference w:type="default" r:id="rId5"/><w:footerReference w:type="default" r:id="rId6"/><w:pgSz w:w="{p_w_dxa}" w:h="{p_h_dxa}" w:orient="{orient}"/><w:pgMar w:top="{mar_size}" w:right="{mar_size}" w:bottom="{mar_size}" w:left="{mar_size}" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>"""
            
            if idx_num < total_targets - 1:
                if add_page_breaks:
                    if prev_page_geometry is not None and prev_page_geometry != current_geom:
                        body_elements.append(f"""<w:p><w:pPr>{sect_xml}</w:pPr></w:p>""")
                    else:
                        body_elements.append("""<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>""")
            else:
                body_elements.append(sect_xml)
                
            prev_page_geometry = current_geom

    # ── MODO 2: RÉPLICA EXACTA (DTP ABSOLUTO) ──
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
            
            if include_images:
                try:
                    for img_info in page.get_images(full=True):
                        xref = img_info[0]
                        img_bytes, img_ext = extract_safe_image_bytes(doc, xref)
                        if img_bytes:
                            rects = page.get_image_rects(xref)
                            img_rect = rects[0] if rects else None
                            if img_rect:
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
                    # Si la página es puramente gráfica/vectorial sin imágenes incrustadas ni texto
                    text_blocks = [b for b in blocks if b.get("type") == 0]
                    if len(text_blocks) == 0 and len(page.get_images()) == 0 and len(page.get_drawings()) > 10:
                        pix = page.get_pixmap(dpi=200)
                        img_bytes = pix.tobytes("png")
                        img_name = f"image{image_counter}.png"
                        image_counter += 1
                        r_id = f"rId{rel_counter}"
                        rel_counter += 1
                        media_files[f"word/media/{img_name}"] = img_bytes
                        doc_rels.append((r_id, f"media/{img_name}", 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'))
                        
                        iw_emu = pt_to_emu(page_w)
                        ih_emu = pt_to_emu(page_h)
                        d_id = drawing_id
                        drawing_id += 1
                        vec_page_xml = f"""<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="{iw_emu}" cy="{ih_emu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="{d_id}" name="VectorCanvas {d_id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{d_id}" name="VectorCanvas {d_id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{r_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{iw_emu}" cy="{ih_emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>"""
                        body_elements.append(vec_page_xml)
                except Exception:
                    pass
            
            for b in blocks:
                if b.get("type") == 0:
                    bx0, by0, bx1, by1 = b.get("bbox")
                    bw = max(20, (bx1 - bx0) + 6)
                    bh = max(12, (by1 - by0) + 4)
                    
                    paras_xml = []
                    for line in b.get("lines", []):
                        spans_xml = []
                        prev_span_bbox = None
                        
                        for span in line.get("spans", []):
                            txt = span.get("text", "")
                            if not txt or not txt.strip():
                                continue
                            has_text = True
                            txt_norm = normalize_unicode(txt)
                            f_size = max(7, span.get("size", body_font_size))
                            raw_font = span.get("font", "")
                            f_name = normalize_font(raw_font, primary_font)
                            f_color = int_to_hex_color(span.get("color", 0))
                            flags = span.get("flags", 0)
                            is_bold = bool(flags & 2 ** 4) or "bold" in raw_font.lower()
                            is_italic = bool(flags & 2 ** 1) or "italic" in raw_font.lower()
                            
                            span_bbox = span.get("bbox", (0, 0, 0, 0))
                            if prev_span_bbox is not None and spans_xml:
                                if span_bbox[0] - prev_span_bbox[2] > (f_size * 0.25):
                                    txt_norm = ' ' + txt_norm
                            prev_span_bbox = span_bbox
                            
                            bold_xml = "<w:b/>" if is_bold else ""
                            italic_xml = "<w:i/>" if is_italic else ""
                            
                            r_xml = f"""<w:r><w:rPr><w:rFonts w:ascii="{escape_xml(f_name)}" w:hAnsi="{escape_xml(f_name)}"/><w:color w:val="{f_color}"/><w:sz w:val="{int(round(f_size * 2))}"/><w:szCs w:val="{int(round(f_size * 2))}"/>{bold_xml}{italic_xml}</w:rPr>{serialize_text_to_openxml(txt_norm)}</w:r>"""
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
            
            p_w_dxa = pt_to_dxa(page_w)
            p_h_dxa = pt_to_dxa(page_h)
            orient = "landscape" if page_w > page_h else "portrait"
            is_last = (idx_num == total_targets - 1)
            sect_xml = f"""<w:sectPr><w:pgSz w:w="{p_w_dxa}" w:h="{p_h_dxa}" w:orient="{orient}"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>"""
            
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
    for r_item in doc_rels:
        if len(r_item) == 4:
            r_id, target, r_type, target_mode = r_item
            clean_target = escape_xml(target)
            rels_xml_lines.append(f'  <Relationship Id="{r_id}" Type="{r_type}" Target="{clean_target}" TargetMode="{target_mode}"/>')
        else:
            r_id, target, r_type = r_item
            clean_target = escape_xml(target)
            rels_xml_lines.append(f'  <Relationship Id="{r_id}" Type="{r_type}" Target="{clean_target}"/>')
    rels_xml_lines.append('</Relationships>')
    full_rels_xml = "\n".join(rels_xml_lines)
    
    styles_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}" w:cs="{escape_xml(primary_font)}"/><w:sz w:val="{int(round(body_font_size * 2))}"/><w:szCs w:val="{int(round(body_font_size * 2))}"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="90" w:line="260" w:lineRule="auto"/></w:pPr></w:pPrDefault>
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
      <w:sz w:val="{int(round((body_font_size + 4.5) * 2))}"/>
      <w:szCs w:val="{int(round((body_font_size + 4.5) * 2))}"/>
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
      <w:sz w:val="{int(round((body_font_size + 2.0) * 2))}"/>
      <w:szCs w:val="{int(round((body_font_size + 2.0) * 2))}"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Header">
    <w:name w:val="header"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:tabs><w:tab w:val="center" w:pos="4320"/><w:tab w:val="right" w:pos="8640"/></w:tabs>
      <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Footer">
    <w:name w:val="footer"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:tabs><w:tab w:val="center" w:pos="4320"/><w:tab w:val="right" w:pos="8640"/></w:tabs>
      <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
  </w:style>

  <w:style w:type="character" w:styleId="Hyperlink">
    <w:name w:val="Hyperlink"/>
    <w:basedOn w:val="DefaultParagraphFont"/>
    <w:uiPriority w:val="99"/>
    <w:unhideWhenUsed/>
    <w:rPr>
      <w:color w:val="0563C1" w:themeColor="hyperlink"/>
      <w:u w:val="single"/>
    </w:rPr>
  </w:style>
</w:styles>"""

    # ── GENERACIÓN NATIVA DE HEADER1.XML Y FOOTER1.XML ──
    header_content_text = escape_xml(detected_running_header) if detected_running_header else ""
    header_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
      <w:jc w:val="right"/>
      <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="777777"/>
      </w:rPr>
      <w:t>{header_content_text}</w:t>
    </w:r>
  </w:p>
</w:hdr>"""

    footer_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:jc w:val="center"/>
      <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="777777"/>
      </w:rPr>
      <w:fldSimple w:instr="PAGE"/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="777777"/>
      </w:rPr>
      <w:t xml:space="preserve"> / </w:t>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="{escape_xml(primary_font)}" w:hAnsi="{escape_xml(primary_font)}"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="777777"/>
      </w:rPr>
      <w:fldSimple w:instr="NUMPAGES"/>
    </w:r>
  </w:p>
</w:ftr>"""

    numbering_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
  <w:num w:numId="2">
    <w:abstractNumId w:val="1"/>
  </w:num>
</w:numbering>"""

    font_table_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:font w:name="Calibri"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Arial"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Times New Roman"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Georgia"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Aptos"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Segoe UI"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Roboto"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Open Sans"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Symbol"><w:pitch w:val="variable"/></w:font>
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
  <Default Extension="emf" ContentType="image/x-emf"/>
  <Default Extension="wmf" ContentType="image/x-wmf"/>
  <Default Extension="tiff" ContentType="image/tiff"/>
  <Default Extension="tif" ContentType="image/tiff"/>
  <Default Extension="gif" ContentType="image/gif"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
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
        zf.writestr('word/header1.xml', header_xml)
        zf.writestr('word/footer1.xml', footer_xml)
        zf.writestr('word/numbering.xml', numbering_xml)
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
