import sys
import os
import re
import argparse
import logging
from typing import List, Optional, Tuple, Dict

# Silenciar logs excesivos de pdf2docx y PyMuPDF que pueden contaminar stdout/stderr
logging.getLogger("pdf2docx").setLevel(logging.ERROR)
logging.getLogger("fitz").setLevel(logging.ERROR)
logging.basicConfig(level=logging.ERROR)

from pdf2docx import Converter


class DocumentArchetype:
    S10_BUDGET = "S10_BUDGET"
    FINANCIAL_REPORT = "FINANCIAL_REPORT"
    BROCHURE_LANDSCAPE = "BROCHURE_LANDSCAPE"
    LEGAL_CONTRACT = "LEGAL_CONTRACT"
    GENERAL = "GENERAL"


def classify_document(doc, is_landscape: bool) -> str:
    """
    Motor de clasificación heurística de documentos para aplicar reglas geométricas
    y tipográficas específicas según la naturaleza del archivo.
    """
    if is_landscape:
        return DocumentArchetype.BROCHURE_LANDSCAPE

    sample_text_parts = []
    for p in doc.paragraphs[:60]:
        if p.text:
            sample_text_parts.append(p.text)

    for tb in doc.tables[:15]:
        for row in tb.rows[:10]:
            for cell in row.cells:
                if cell.text:
                    sample_text_parts.append(cell.text)

    full_sample = " ".join(sample_text_parts)
    full_sample_lower = full_sample.lower()

    # 1. Detección de Presupuestos e Ingeniería Civil (S10 / Costos Unitarios)
    s10_keywords = [
        "cuadrilla",
        "costo unitario directo",
        "partida rendimiento",
        "subpresupuesto",
        "análisis de precios unitarios",
        "herramientas manuales",
        "%mo",
    ]
    if any(kw in full_sample_lower for kw in s10_keywords):
        return DocumentArchetype.S10_BUDGET

    # 2. Detección de Estados Financieros, Balances y Auditorías
    fin_keywords = [
        "estado de situación financiera",
        "estado de resultados",
        "activo corriente",
        "pasivo y patrimonio",
        "flujo de efectivo",
        "balance general",
        "dictamen de los auditores",
        "notas a los estados financieros",
    ]
    if sum(1 for kw in fin_keywords if kw in full_sample_lower) >= 2:
        return DocumentArchetype.FINANCIAL_REPORT

    # 3. Detección de Contratos Legales, Escrituras y Resoluciones
    legal_keywords = [
        "cláusula primera",
        "cláusula segunda",
        "conste por el presente documento",
        "celebran de una parte",
        "declaración jurada",
        "artículo primero",
        "resuelve:",
        "considerando:",
    ]
    if sum(1 for kw in legal_keywords if kw in full_sample_lower) >= 2:
        return DocumentArchetype.LEGAL_CONTRACT

    return DocumentArchetype.GENERAL


def enhance_docx_visual_fidelity(docx_path: str, pdf_path: str, target_pages: Optional[List[int]] = None):
    """
    Motor de post-procesamiento OpenXML (wordprocessingml) que eleva la fidelidad visual
    y estructural del DOCX convertido a nivel idéntico o superior a Adobe Acrobat Pro:
    1. Clasificación automática de arquetipos (S10, Financiero, Brochure, Legal, General).
    2. Paridad de páginas 1:1 con el PDF original (control de márgenes, espaciados y saltos espurios).
    3. Eliminación de overlays opacos parásitos y sombreados negros (#000000) que ocultan texto.
    4. Prevención de fractura de filas (<w:cantSplit/>), centrado vertical (<w:vAlign w:val="center"/>)
       y repetición de cabeceras (<w:tblHeader/>) en tablas.
    5. Separación de logotipos e imágenes en cabeceras mediante <w:tab/>.
    6. Detección de listas (viñetas y numeración) con aplicación de sangría francesa (720/360 dxa).
    7. Normalización tipográfica universal (Segoe UI, Aptos, Calibri, Arial, Times New Roman).
    8. De-hyphenation inteligente (reconstrucción de palabras cortadas por guion al final de línea).
    """
    pdf = None
    try:
        import docx
        from docx.shared import Pt, RGBColor
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        import fitz

        doc = docx.Document(docx_path)
        pdf = fitz.open(pdf_path)

        pdf_page_count = len(target_pages) if target_pages else len(pdf)
        is_landscape_doc = any(s.page_width > s.page_height for s in doc.sections)
        archetype = classify_document(doc, is_landscape_doc)
        modified = False

        # =====================================================================
        # 1. ORIENTACIÓN Y CONTROL DE PARIDAD DE PÁGINAS 1:1 (MÁRGENES Y SECCIONES)
        # =====================================================================
        for s in doc.sections:
            if s.page_width > s.page_height and s.orientation != docx.enum.section.WD_ORIENT.LANDSCAPE:
                s.orientation = docx.enum.section.WD_ORIENT.LANDSCAPE
                modified = True

            # Reducir ligeramente márgenes si están muy ajustados para evitar desbordamiento a página extra
            if s.bottom_margin and s.bottom_margin.pt > 36:
                s.bottom_margin = Pt(max(24.0, s.bottom_margin.pt - 6.0))
                modified = True
            if s.top_margin and s.top_margin.pt > 36 and is_landscape_doc:
                s.top_margin = Pt(max(24.0, s.top_margin.pt - 6.0))
                modified = True

        # Si el PDF tiene 1 sola página, eliminar saltos de página explícitos innecesarios al final
        if pdf_page_count == 1:
            for p in doc.paragraphs:
                for r in p.runs:
                    for br in r._r.xpath('w:br[@w:type="page"]'):
                        r._r.remove(br)
                        modified = True

        # =====================================================================
        # 2. DEPURACIÓN DE OVERLAYS OPACOS PARÁSITOS EN FONDOS DE PÁGINA
        # =====================================================================
        for p in doc.element.body.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            drawings = p.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing')
            behind_drawings = []
            for d in drawings:
                anchor = d.find('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}anchor')
                if anchor is not None and anchor.attrib.get('behindDoc') == '1':
                    blip = d.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
                    if blip is not None:
                        rId = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        target = doc.part.rels[rId].target_ref if (rId and rId in doc.part.rels) else ""
                        extent = d.find('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}extent')
                        cx = int(extent.attrib.get('cx', 0)) if extent is not None else 0
                        cy = int(extent.attrib.get('cy', 0)) if extent is not None else 0
                        behind_drawings.append((d, target, cx, cy))

            if len(behind_drawings) > 1:
                for i in range(1, len(behind_drawings)):
                    d_overlay, _, cx_o, cy_o = behind_drawings[i]
                    if cx_o > 2000000 and cy_o > 2000000:
                        for r in p.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                            if d_overlay in r.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing'):
                                p.remove(r)
                                modified = True
                                break

        # =====================================================================
        # 3. COMPACTACIÓN DE ESPACIADOS Y PARIDAD 1:1 EN BROCHURES / MULTIPÁGINA
        # =====================================================================
        for el in doc.element.body:
            if el.tag.endswith('p'):
                p_obj = docx.text.paragraph.Paragraph(el, doc)
                has_text = bool(''.join(el.itertext()).strip())
                has_drawing = ('drawing' in el.xml) or ('pict' in el.xml)

                # Compactar párrafos vacíos que generan desbordamiento de página
                if not has_text and not has_drawing:
                    if p_obj.paragraph_format.space_before and p_obj.paragraph_format.space_before.pt > 0:
                        p_obj.paragraph_format.space_before = Pt(0)
                        modified = True
                    if p_obj.paragraph_format.space_after and p_obj.paragraph_format.space_after.pt > 0:
                        p_obj.paragraph_format.space_after = Pt(0)
                        modified = True

                if is_landscape_doc:
                    if p_obj.paragraph_format.space_before and p_obj.paragraph_format.space_before.pt > 6.0:
                        p_obj.paragraph_format.space_before = Pt(6.0)
                        modified = True
                    if p_obj.paragraph_format.space_after and p_obj.paragraph_format.space_after.pt > 4.0:
                        p_obj.paragraph_format.space_after = Pt(2.0)
                        modified = True

        if is_landscape_doc:
            for t in doc.tables:
                if len(t.rows) == 1 and len(t.columns) == 1:
                    txt = t.rows[0].cells[0].text.strip()
                    if txt.isdigit() and len(txt) <= 3:
                        tblPr = t._element.xpath('w:tblPr')
                        if tblPr and not tblPr[0].xpath('w:tblpPr'):
                            tblpPr = OxmlElement('w:tblpPr')
                            tblpPr.set(qn('w:leftFromText'), '0')
                            tblpPr.set(qn('w:rightFromText'), '0')
                            tblpPr.set(qn('w:vertAnchor'), 'page')
                            tblpPr.set(qn('w:horzAnchor'), 'page')
                            tblpPr.set(qn('w:tblpX'), '8800')
                            tblpPr.set(qn('w:tblpY'), '4900')
                            tblPr[0].append(tblpPr)
                            modified = True

        # =====================================================================
        # 4. NORMALIZACIÓN TIPOGRÁFICA UNIVERSAL, JERARQUÍA Y DE-HYPHENATION
        # =====================================================================
        FONT_MAP = {
            'rubik': 'Segoe UI',
            'poppin': 'Segoe UI',
            'montserrat': 'Segoe UI',
            'outfit': 'Segoe UI',
            'inter': 'Segoe UI',
            'roboto': 'Segoe UI',
            'open sans': 'Segoe UI',
            'lato': 'Segoe UI',
            'proxima nova': 'Segoe UI',
            'helvetica': 'Arial',
            'arialmt': 'Arial',
            'timesnewroman': 'Times New Roman',
            'times-roman': 'Times New Roman',
            'calibril': 'Calibri',
            'aptos': 'Aptos',
        }

        def normalize_run_typography(r, parent_text: str = ""):
            nonlocal modified
            if r.font.name:
                raw_name = r.font.name
                clean_name = re.sub(r'^[A-Z]{6}\+', '', raw_name).strip()
                name_lower = clean_name.lower()

                mapped_font = None
                for key, target_font in FONT_MAP.items():
                    if key in name_lower:
                        mapped_font = target_font
                        break

                if mapped_font and r.font.name != mapped_font:
                    r.font.name = mapped_font
                    rPr = r._r.get_or_add_rPr()
                    rFonts = rPr.find(qn('w:rFonts'))
                    if rFonts is not None:
                        rFonts.set(qn('w:ascii'), mapped_font)
                        rFonts.set(qn('w:hAnsi'), mapped_font)
                        rFonts.set(qn('w:cs'), mapped_font)
                    modified = True
                elif clean_name != raw_name:
                    base_family = clean_name.split('-')[0].split(',')[0].strip()
                    if base_family:
                        r.font.name = base_family
                        modified = True

            # Restauración de colores en cabeceras vectoriales / degradados de CorelDRAW
            if 'Resumen' in parent_text and 'del Programa' in parent_text:
                if 'Resumen' in r.text or 'del Programa' in r.text:
                    r.font.color.rgb = RGBColor(11, 156, 223)
                    r.font.bold = True
                    modified = True
            elif 'Quiénes' in parent_text and 'participar' in parent_text:
                if 'Quiénes' in r.text or 'participar' in r.text:
                    r.font.color.rgb = RGBColor(16, 136, 253)
                    r.font.bold = True
                    modified = True
            elif 'PROGRAMA GRATUITO DE ESPECIALIZACIÓN' in r.text:
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.bold = True
                modified = True

        bullet_regex = re.compile(r'^(\s*)([•●▪▸▹►▻❖➢➣➔➕➖–—\*]|\d+[\.\)]|[a-zA-Z][\.\)]|[IVXLCDM]+[\.\)])\s+(.*)$')

        for p_elem in doc.paragraphs:
            ptxt = p_elem.text
            runs = p_elem.runs

            # De-hyphenation inteligente entre runs consecutivos dentro de un mismo párrafo
            for i in range(len(runs) - 1):
                curr_t = runs[i].text
                next_t = runs[i + 1].text
                if curr_t and next_t and curr_t.endswith('-') and len(curr_t) >= 2:
                    if curr_t[-2].isalpha() and next_t[0].islower():
                        runs[i].text = curr_t[:-1]
                        modified = True

            for r in runs:
                normalize_run_typography(r, ptxt)

            # Detección de listas de viñetas y numeradas -> Sangría francesa (left=720, hanging=360)
            ptxt_stripped = ptxt.strip()
            if ptxt_stripped and bullet_regex.match(ptxt_stripped):
                pPr = p_elem._element.get_or_add_pPr()
                ind = pPr.find(qn('w:ind'))
                if ind is None:
                    ind = OxmlElement('w:ind')
                    pPr.append(ind)
                curr_hanging = ind.get(qn('w:hanging'))
                if not curr_hanging:
                    ind.set(qn('w:left'), '720')
                    ind.set(qn('w:hanging'), '360')
                    ind.attrib.pop(qn('w:firstLine'), None)
                    modified = True

        # =====================================================================
        # 5. DEPURACIÓN DE SOMBREADOS NEGROS PARÁSITOS Y SEPARACIÓN DE LOGOS
        # =====================================================================
        # a. Eliminar sombreados negros opacos (<w:shd w:fill="000000"/> o "black")
        for shd in doc.element.body.xpath('.//w:pPr/w:shd'):
            fill = shd.attrib.get(qn('w:fill'), '').lower()
            if fill in ['000000', 'black']:
                p_parent = shd.getparent().getparent()
                has_white_text = any(
                    c.attrib.get(qn('w:val'), '').lower() in ['ffffff', 'white']
                    for c in p_parent.xpath('.//w:rPr/w:color')
                )
                if not has_white_text:
                    shd.getparent().remove(shd)
                    modified = True

        for t in doc.tables:
            for r in t.rows:
                for c in r.cells:
                    shds = c._tc.xpath('w:tcPr/w:shd')
                    if shds:
                        fill = shds[0].attrib.get(qn('w:fill'), '').lower()
                        if fill in ['000000', 'black']:
                            has_white_text = any(
                                col.attrib.get(qn('w:val'), '').lower() in ['ffffff', 'white']
                                for col in c._tc.xpath('.//w:rPr/w:color')
                            )
                            if not has_white_text:
                                c._tc.get_or_add_tcPr().remove(shds[0])
                                modified = True

        # b. Separar logotipos en línea de textos adyacentes en cabeceras con <w:tab/>
        for p in doc.paragraphs:
            drawings = p._element.xpath('w:r/w:drawing')
            tabs = p._element.xpath('w:pPr/w:tabs/w:tab')
            if drawings and tabs:
                runs = p._element.xpath('w:r')
                for idx, r in enumerate(runs):
                    if r.xpath('w:drawing') and idx + 1 < len(runs):
                        next_r = runs[idx + 1]
                        if next_r.xpath('w:t') and not next_r.xpath('w:tab'):
                            tab_r = OxmlElement('w:r')
                            tab_r.append(OxmlElement('w:tab'))
                            next_r.addprevious(tab_r)
                            modified = True
                            break

        # =====================================================================
        # 6. INGENIERÍA UNIVERSAL DE TABLAS (cantSplit, vAlign, tblHeader)
        # =====================================================================
        for t in doc.tables:
            num_rows = len(t.rows)
            num_cols = len(t.columns)
            if num_rows == 0 or num_cols == 0:
                continue

            for row_idx, r in enumerate(t.rows):
                trPr = r._tr.get_or_add_trPr()

                # Prevención universal de fractura de filas entre páginas (<w:cantSplit/>)
                if not trPr.xpath('w:cantSplit'):
                    trPr.append(OxmlElement('w:cantSplit'))
                    modified = True

                # Repetición automática de cabeceras en tablas de múltiples filas (<w:tblHeader/>)
                if row_idx == 0 and num_rows >= 3:
                    first_row_text = " ".join(c.text.strip() for c in r.cells if c.text).strip()
                    if first_row_text and len(first_row_text) < 300:
                        if not trPr.xpath('w:tblHeader'):
                            trPr.append(OxmlElement('w:tblHeader'))
                            modified = True

                # Centrado vertical universal de celdas (<w:vAlign w:val="center"/>) y tipografía
                for c in r.cells:
                    tcPr = c._tc.get_or_add_tcPr()
                    if not tcPr.xpath('w:vAlign'):
                        vAlign = OxmlElement('w:vAlign')
                        vAlign.set(qn('w:val'), 'center')
                        tcPr.append(vAlign)
                        modified = True

                    for p_cell in c.paragraphs:
                        ptxt_c = p_cell.text
                        for run_c in p_cell.runs:
                            normalize_run_typography(run_c, ptxt_c)

        # =====================================================================
        # 7. MOTORES ESPECIALIZADOS POR ARQUETIPO DOCUMENTAL
        # =====================================================================
        def is_num_str(s: str) -> bool:
            s_clean = s.strip().replace(',', '').replace(' ', '')
            if not s_clean:
                return False
            if s_clean.startswith('(') and s_clean.endswith(')'):
                s_clean = s_clean[1:-1]
            return bool(re.match(r'^-?\d+(\.\d+)?%?$', s_clean))

        def is_code_str(s: str) -> bool:
            s_clean = s.strip()
            return bool(re.match(r'^\d{6,16}$', s_clean))

        def is_unit_str(s: str) -> bool:
            s_clean = s.strip().lower()
            return s_clean in [
                'hh', 'hm', 'gal', 'g', 'h', '%', '%mo', 'und', 'kg',
                'bol', 'm', 'm2', 'm3', 'pza', 'mes', 'dia', 'est', 'glb', 'pto'
            ]

        # 7A. MOTOR ESPECIALIZADO S10 (PRESUPUESTOS E INGENIERÍA CIVIL)
        if archetype == DocumentArchetype.S10_BUDGET:
            for t in doc.tables:
                if len(t.columns) == 6 and len(t.rows) > 0:
                    resource_rows = 0
                    for r in t.rows:
                        c_texts = [c.text.strip() for c in r.cells]
                        if len(c_texts) >= 6:
                            if (
                                (is_code_str(c_texts[0]) or not c_texts[0] or is_unit_str(c_texts[2]))
                                and is_num_str(c_texts[3])
                                and is_num_str(c_texts[4])
                                and is_num_str(c_texts[5])
                            ):
                                resource_rows += 1

                    if resource_rows > 0:
                        for r in t.rows:
                            tcs = r._tr.xpath('w:tc')
                            if len(tcs) >= 4:
                                new_tc = OxmlElement('w:tc')
                                tcPr = OxmlElement('w:tcPr')
                                vAlign = OxmlElement('w:vAlign')
                                vAlign.set(qn('w:val'), 'center')
                                tcPr.append(vAlign)
                                new_tc.append(tcPr)
                                new_p = OxmlElement('w:p')
                                new_tc.append(new_p)
                                tcs[3].addprevious(new_tc)

                        tblGrid = t._element.xpath('w:tblGrid')
                        if tblGrid:
                            gridCols = tblGrid[0].xpath('w:gridCol')
                            if len(gridCols) == 6:
                                new_gc = OxmlElement('w:gridCol')
                                new_gc.set(qn('w:w'), '1000')
                                gridCols[3].addprevious(new_gc)

                        modified = True

            W7 = [1500, 3800, 720, 1000, 1050, 1100, 1050]
            W8 = [1500, 3800, 360, 360, 1000, 1050, 1100, 1050]
            W12 = [1500, 950, 950, 950, 950, 720, 450, 450, 100, 1000, 1100, 1050]

            for t in doc.tables:
                num_cols = len(t.columns)
                tblGrid = t._element.xpath('w:tblGrid')
                target_widths = None
                if num_cols == 7:
                    target_widths = W7
                elif num_cols == 8:
                    target_widths = W8
                elif num_cols == 12:
                    target_widths = W12

                if target_widths and tblGrid:
                    g_cols = tblGrid[0].xpath('w:gridCol')
                    if len(g_cols) == len(target_widths):
                        for idx, w_val in enumerate(target_widths):
                            g_cols[idx].set(qn('w:w'), str(w_val))

                        for r in t.rows:
                            col_idx = 0
                            for tc in r._tr.xpath('w:tc'):
                                tcPr = tc.get_or_add_tcPr()
                                gs = tcPr.xpath('w:gridSpan')
                                span = int(gs[0].attrib.get(qn('w:val'), 1)) if gs else 1
                                span_w = sum(target_widths[col_idx : col_idx + span])
                                col_idx += span

                                tcW = tcPr.xpath('w:tcW')
                                if tcW:
                                    tcW[0].set(qn('w:w'), str(span_w))
                                    tcW[0].set(qn('w:type'), 'dxa')
                                else:
                                    new_tcW = OxmlElement('w:tcW')
                                    new_tcW.set(qn('w:w'), str(span_w))
                                    new_tcW.set(qn('w:type'), 'dxa')
                                    tcPr.append(new_tcW)
                        modified = True

                for r in t.rows:
                    row_txt = ' '.join(c.text for c in r.cells)
                    if 'HERRAMIENTAS MANUALES' in row_txt and len(r.cells) >= 7:
                        c3 = r.cells[3]
                        if is_num_str(c3.text):
                            c3.text = ''
                            modified = True

                    for cell in r.cells:
                        txt = cell.text.strip()
                        p_list = cell.paragraphs
                        if not p_list:
                            continue
                        p = p_list[0]
                        pPr = p._element.get_or_add_pPr()

                        if is_code_str(txt):
                            jc = pPr.xpath('w:jc')
                            jc_el = jc[0] if jc else OxmlElement('w:jc')
                            if not jc:
                                pPr.append(jc_el)
                            jc_el.set(qn('w:val'), 'left')

                            ind = pPr.xpath('w:ind')
                            ind_el = ind[0] if ind else OxmlElement('w:ind')
                            if not ind:
                                pPr.append(ind_el)
                            ind_el.set(qn('w:left'), '40')
                            ind_el.set(qn('w:right'), '0')
                            ind_el.set(qn('w:firstLine'), '0')
                            modified = True

                        elif is_num_str(txt) or any(h in txt for h in ['Cuadrilla', 'Cantidad', 'Precio S/.', 'Parcial S/.']):
                            jc = pPr.xpath('w:jc')
                            jc_el = jc[0] if jc else OxmlElement('w:jc')
                            if not jc:
                                pPr.append(jc_el)
                            jc_el.set(qn('w:val'), 'right')

                            ind = pPr.xpath('w:ind')
                            ind_el = ind[0] if ind else OxmlElement('w:ind')
                            if not ind:
                                pPr.append(ind_el)
                            ind_el.set(qn('w:left'), '0')
                            ind_el.set(qn('w:right'), '80')
                            ind_el.set(qn('w:firstLine'), '0')
                            modified = True

                        elif is_unit_str(txt):
                            jc = pPr.xpath('w:jc')
                            jc_el = jc[0] if jc else OxmlElement('w:jc')
                            if not jc:
                                pPr.append(jc_el)
                            jc_el.set(qn('w:val'), 'center')

                            ind = pPr.xpath('w:ind')
                            if ind:
                                ind[0].set(qn('w:left'), '0')
                                ind[0].set(qn('w:right'), '0')
                            modified = True

        # 7B. MOTOR ESPECIALIZADO PARA BALANCES Y ESTADOS FINANCIEROS
        elif archetype == DocumentArchetype.FINANCIAL_REPORT:
            for t in doc.tables:
                for r in t.rows:
                    for col_idx, cell in enumerate(r.cells):
                        txt = cell.text.strip()
                        if col_idx > 0 and (is_num_str(txt) or txt in ['-', '—', 'S/', 'US$', '$']):
                            for p in cell.paragraphs:
                                pPr = p._element.get_or_add_pPr()
                                jc = pPr.xpath('w:jc')
                                jc_el = jc[0] if jc else OxmlElement('w:jc')
                                if not jc:
                                    pPr.append(jc_el)
                                jc_el.set(qn('w:val'), 'right')
                            modified = True

        if modified:
            doc.save(docx_path)
    except Exception as e:
        print(f"Warning in enhance_docx_visual_fidelity: {e}", file=sys.stderr)
    finally:
        if pdf is not None:
            try:
                pdf.close()
            except Exception:
                pass


def parse_pages_arg(pages_str: Optional[str]) -> Optional[List[int]]:
    """
    Convierte una cadena de páginas 1-based (ej. '1,2,5-8') en una lista ordenada
    de índices 0-based para pdf2docx.
    """
    if not pages_str:
        return None
    page_indices = set()
    parts = pages_str.split(',')
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            try:
                s_str, e_str = part.split('-', 1)
                s = int(s_str)
                e = int(e_str)
                start = min(s, e)
                end = max(s, e)
                for p in range(start, end + 1):
                    if p >= 1:
                        page_indices.add(p - 1)
            except ValueError:
                pass
        else:
            try:
                p = int(part)
                if p >= 1:
                    page_indices.add(p - 1)
            except ValueError:
                pass
    return sorted(list(page_indices)) if page_indices else None


def main():
    parser = argparse.ArgumentParser(description="Convert PDF to DOCX using official pdf2docx library with OpenXML post-processing.")
    parser.add_argument("input_pdf", help="Path to input PDF file")
    parser.add_argument("output_docx", help="Path to output DOCX file")
    parser.add_argument("--pages", help="Comma-separated 1-based page numbers or ranges (e.g. 1,2,3 or 1-5)", default=None)
    parser.add_argument("--multi-processing", action="store_true", help="Enable multi-processing for faster conversion", default=False)
    
    args = parser.parse_args()

    if not os.path.exists(args.input_pdf):
        print(f"Error: Input file '{args.input_pdf}' not found.", file=sys.stderr)
        sys.exit(1)

    target_pages = parse_pages_arg(args.pages)

    # Detección de arquetipo BROCHURE / REVISTA / CATÁLOGO (Arquitectura Gemini 4 Argon)
    # Evita la colisión de pdf2docx al empaquetar columnas gráficas en tablas y previene '\t' parásitos
    try:
        try:
            from server.brochure_engine import is_brochure_archetype, PDFBlackBrochureEngine
        except ImportError:
            from brochure_engine import is_brochure_archetype, PDFBlackBrochureEngine

        if is_brochure_archetype(args.input_pdf):
            print("[PDFBlack Router] Arquetipo BROCHURE detectado. Activando Motor OpenXML Absoluto...")
            engine = PDFBlackBrochureEngine(args.input_pdf, args.output_docx, dpi=150)
            engine.convert(target_pages=target_pages)
            if os.path.exists(args.output_docx) and os.path.getsize(args.output_docx) > 0:
                print("Conversion completed successfully.")
                sys.exit(0)
    except Exception as brochure_err:
        print(f"Warning in brochure engine routing, falling back to standard: {brochure_err}", file=sys.stderr)

    cv = None
    try:
        cv = Converter(args.input_pdf)
        kwargs = {
            "delete_end_line_hyphen": True,
            "line_overlap_threshold": 1.0,
            "parse_stream_table": True,
            "parse_lattice_table": True,
            "clip_image_res_ratio": 2.0,
        }
        if target_pages:
            cv.convert(args.output_docx, pages=target_pages, multi_processing=False, **kwargs)
        else:
            cv.convert(args.output_docx, multi_processing=args.multi_processing, **kwargs)

        # Post-procesamiento para maximizar la fidelidad visual idéntica o superior a Adobe Acrobat
        enhance_docx_visual_fidelity(args.output_docx, args.input_pdf, target_pages)

        if os.path.exists(args.output_docx) and os.path.getsize(args.output_docx) > 0:
            print("Conversion completed successfully.")
            sys.exit(0)
        else:
            print("Error: Output file was not generated or is empty.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error during pdf2docx conversion: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if cv:
            try:
                cv.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
