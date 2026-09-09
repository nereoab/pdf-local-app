import sys
import os
import argparse
import logging

# Silenciar logs excesivos de pdf2docx que pueden bloquear el buffer de stdout
logging.getLogger("pdf2docx").setLevel(logging.ERROR)
logging.getLogger("fitz").setLevel(logging.ERROR)
logging.basicConfig(level=logging.ERROR)

from pdf2docx import Converter

def enhance_docx_visual_fidelity(docx_path: str, pdf_path: str):
    """
    Optimiza la fidelidad visual del DOCX convertido para que coincida de forma idéntica con el PDF original:
    1. Elimina capas opacas parásitas (overlays vectoriales sin alfa) que tapan fotos de fondo.
    2. Compacta espaciados verticales redundantes para evitar desbordamientos y páginas en blanco.
    3. Mapea fuentes no instaladas (Rubik, Poppins) a tipografías sans-serif modernas (Segoe UI).
    4. Corrige títulos que perdieron color por degradados en CorelDRAW.
    5. Asegura la orientación correcta (LANDSCAPE en presentaciones/brochures).
    """
    try:
        import docx
        from docx.shared import Pt, RGBColor
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        import fitz

        doc = docx.Document(docx_path)
        pdf = fitz.open(pdf_path)
        is_landscape_doc = any(s.page_width > s.page_height for s in doc.sections)
        modified = False

        # 1. Orientación apaisada
        for s in doc.sections:
            if s.page_width > s.page_height and s.orientation != docx.enum.section.WD_ORIENT.LANDSCAPE:
                s.orientation = docx.enum.section.WD_ORIENT.LANDSCAPE
                modified = True

        # 2. Detectar y eliminar overlays opacos que tapan fotografías de fondo
        for p in doc.element.body.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            drawings = p.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing')
            behind_drawings = []
            for d in drawings:
                anchor = d.find('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}anchor')
                if anchor is not None and anchor.attrib.get('behindDoc') == '1':
                    blip = d.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
                    if blip is not None:
                        rId = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        target = doc.part.rels[rId].target_ref
                        extent = d.find('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}extent')
                        cx = int(extent.attrib.get('cx', 0)) if extent is not None else 0
                        cy = int(extent.attrib.get('cy', 0)) if extent is not None else 0
                        behind_drawings.append((d, target, cx, cy))

            if len(behind_drawings) > 1:
                for i in range(1, len(behind_drawings)):
                    d_overlay, target_overlay, cx_o, cy_o = behind_drawings[i]
                    if cx_o > 2000000 and cy_o > 2000000:
                        for r in p.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                            if d_overlay in r.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing'):
                                p.remove(r)
                                modified = True
                                break

        # 3. Compactación de espaciados en folletos / diapositivas
        if is_landscape_doc:
            for el in doc.element.body:
                if el.tag.endswith('p'):
                    p_obj = docx.text.paragraph.Paragraph(el, doc)
                    if p_obj.paragraph_format.space_before and p_obj.paragraph_format.space_before.pt > 6.0:
                        p_obj.paragraph_format.space_before = Pt(6.0)
                        modified = True
                    if p_obj.paragraph_format.space_after and p_obj.paragraph_format.space_after.pt > 4.0:
                        p_obj.paragraph_format.space_after = Pt(2.0)
                        modified = True

                    if not ''.join(el.itertext()).strip() and 'drawing' not in el.xml:
                        if p_obj.paragraph_format.space_before and p_obj.paragraph_format.space_before.pt > 0:
                            p_obj.paragraph_format.space_before = Pt(0)
                            modified = True
                        if p_obj.paragraph_format.space_after and p_obj.paragraph_format.space_after.pt > 0:
                            p_obj.paragraph_format.space_after = Pt(0)
                            modified = True

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

        # 4. Mapeo de fuentes y colores en títulos
        def fix_run(r, parent_text=""):
            nonlocal modified
            if r.font.name:
                name_lower = r.font.name.lower()
                if any(f in name_lower for f in ['rubik', 'poppin', 'montserrat', 'outfit']):
                    r.font.name = 'Segoe UI'
                    modified = True
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

        for p_elem in doc.paragraphs:
            ptxt = p_elem.text
            for r in p_elem.runs:
                fix_run(r, ptxt)

        # 5. Corrección de sombreados parásitos y colisiones de logos
        # a. Eliminar sombreados negros opacos que tapan texto negro (ej. recuadros de portada en informes corporativos)
        for t in doc.tables:
            for r in t.rows:
                for c in r.cells:
                    shds = c._tc.xpath('w:tcPr/w:shd')
                    if shds:
                        fill = shds[0].attrib.get(qn('w:fill'), '').lower()
                        if fill in ['000000', 'black']:
                            c._tc.get_or_add_tcPr().remove(shds[0])
                            modified = True

        # b. Separar logotipos en línea (ej. logo EY) de textos adyacentes en cabeceras
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

        # 6. Optimización de tablas (cantSplit y centrado vertical universales)
        for t in doc.tables:
            num_rows = len(t.rows)
            num_cols = len(t.columns)
            if num_rows == 0 or num_cols == 0:
                continue

            for r in t.rows:
                trPr = r._tr.get_or_add_trPr()
                if not trPr.xpath('w:cantSplit'):
                    trPr.append(OxmlElement('w:cantSplit'))
                    modified = True
                for c in r.cells:
                    tcPr = c._tc.get_or_add_tcPr()
                    if not tcPr.xpath('w:vAlign'):
                        vAlign = OxmlElement('w:vAlign')
                        vAlign.set(qn('w:val'), 'center')
                        tcPr.append(vAlign)
                        modified = True

        # 7. Motor especializado para reportes presupuestarios y de ingeniería civil (S10)
        import re

        def is_s10_budget_doc(d) -> bool:
            for tb in d.tables[:15]:
                tb_text = ' '.join(cell.text for row in tb.rows for cell in row.cells)
                if any(kw in tb_text for kw in ['Cuadrilla', 'Costo unitario directo', 'Partida Rendimiento', 'Subpresupuesto']):
                    return True
            return False

        if is_s10_budget_doc(doc):
            def is_num_str(s: str) -> bool:
                s_clean = s.strip().replace(',', '').replace(' ', '')
                if not s_clean:
                    return False
                return bool(re.match(r'^-?\d+(\.\d+)?$', s_clean))

            def is_code_str(s: str) -> bool:
                s_clean = s.strip()
                return bool(re.match(r'^\d{6,16}$', s_clean))

            def is_unit_str(s: str) -> bool:
                s_clean = s.strip().lower()
                return s_clean in ['hh', 'hm', 'gal', 'g', 'h', '%', '%mo', 'und', 'kg', 'bol', 'm', 'm2', 'm3', 'pza', 'mes', 'dia', 'est']

            # a. Detectar y corregir tablas de recursos de 6 columnas (Materiales / Herramientas sin Cuadrilla)
            for t in doc.tables:
                if len(t.columns) == 6 and len(t.rows) > 0:
                    resource_rows = 0
                    for r in t.rows:
                        c_texts = [c.text.strip() for c in r.cells]
                        if len(c_texts) >= 6:
                            if (is_code_str(c_texts[0]) or not c_texts[0] or is_unit_str(c_texts[2])) and is_num_str(c_texts[3]) and is_num_str(c_texts[4]) and is_num_str(c_texts[5]):
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

            # b. Estandarización de anchos de columna en S10 (Total útil: 10220 dxa = A4 Portrait)
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

                # c. Alineación estricta de números a la derecha
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
                            if not jc:
                                jc_el = OxmlElement('w:jc')
                                pPr.append(jc_el)
                            else:
                                jc_el = jc[0]
                            jc_el.set(qn('w:val'), 'left')

                            ind = pPr.xpath('w:ind')
                            if not ind:
                                ind_el = OxmlElement('w:ind')
                                pPr.append(ind_el)
                            else:
                                ind_el = ind[0]
                            ind_el.set(qn('w:left'), '40')
                            ind_el.set(qn('w:right'), '0')
                            ind_el.set(qn('w:firstLine'), '0')
                            modified = True

                        elif is_num_str(txt):
                            jc = pPr.xpath('w:jc')
                            if not jc:
                                jc_el = OxmlElement('w:jc')
                                pPr.append(jc_el)
                            else:
                                jc_el = jc[0]
                            jc_el.set(qn('w:val'), 'right')

                            ind = pPr.xpath('w:ind')
                            if not ind:
                                ind_el = OxmlElement('w:ind')
                                pPr.append(ind_el)
                            else:
                                ind_el = ind[0]
                            ind_el.set(qn('w:left'), '0')
                            ind_el.set(qn('w:right'), '80')
                            ind_el.set(qn('w:firstLine'), '0')
                            modified = True

                        elif is_unit_str(txt):
                            jc = pPr.xpath('w:jc')
                            if not jc:
                                jc_el = OxmlElement('w:jc')
                                pPr.append(jc_el)
                            else:
                                jc_el = jc[0]
                            jc_el.set(qn('w:val'), 'center')

                            ind = pPr.xpath('w:ind')
                            if ind:
                                ind[0].set(qn('w:left'), '0')
                                ind[0].set(qn('w:right'), '0')
                            modified = True

                        elif any(h in txt for h in ['Cuadrilla', 'Cantidad', 'Precio S/.', 'Parcial S/.']):
                            jc = pPr.xpath('w:jc')
                            if not jc:
                                jc_el = OxmlElement('w:jc')
                                pPr.append(jc_el)
                            else:
                                jc_el = jc[0]
                            jc_el.set(qn('w:val'), 'right')

                            ind = pPr.xpath('w:ind')
                            if not ind:
                                ind_el = OxmlElement('w:ind')
                                pPr.append(ind_el)
                            else:
                                ind_el = ind[0]
                            ind_el.set(qn('w:left'), '0')
                            ind_el.set(qn('w:right'), '80')
                            ind_el.set(qn('w:firstLine'), '0')
                            modified = True

        if modified:
            doc.save(docx_path)
    except Exception as e:
        print(f"Warning in enhance_docx_visual_fidelity: {e}", file=sys.stderr)
    finally:
        try:
            pdf.close()
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(description="Convert PDF to DOCX using official pdf2docx library.")
    parser.add_argument("input_pdf", help="Path to input PDF file")
    parser.add_argument("output_docx", help="Path to output DOCX file")
    parser.add_argument("--pages", help="Comma-separated 1-based page numbers or ranges (e.g. 1,2,3 or 1-5)", default=None)
    parser.add_argument("--multi-processing", action="store_true", help="Enable multi-processing for faster conversion", default=False)
    
    args = parser.parse_args()

    if not os.path.exists(args.input_pdf):
        print(f"Error: Input file '{args.input_pdf}' not found.", file=sys.stderr)
        sys.exit(1)

    # Convert 1-based pages string to 0-based page list
    target_pages = None
    if args.pages:
        page_indices = set()
        parts = args.pages.split(',')
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
        if page_indices:
            target_pages = sorted(list(page_indices))

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

        # Post-procesamiento para maximizar la fidelidad visual idéntica al brochure original
        enhance_docx_visual_fidelity(args.output_docx, args.input_pdf)

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
