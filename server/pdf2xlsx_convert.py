import sys
import os
import re
import argparse
import tempfile
import logging

# Silenciar logs excesivos
logging.getLogger("pdf2docx").setLevel(logging.ERROR)
logging.getLogger("fitz").setLevel(logging.ERROR)
logging.basicConfig(level=logging.ERROR)

import docx
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from pdf2docx import Converter

def parse_cell_value(val_str: str, auto_format: bool = True):
    """
    Convierte una cadena de texto a su tipo de datos real en Excel:
    - Enteros y decimales nativos (float / int)
    - Formato contable con números negativos entre paréntesis: (144,416) -> -144416.0
    - Porcentajes: 18.00% -> 0.18
    - Monedas: S/. 1,234.50 o $ 500.00
    - Códigos de insumos preservados como texto con ceros a la izquierda
    """
    s = val_str.strip()
    if not s:
        return "", "str", "@"

    if not auto_format:
        return s, "str", "@"

    # 1. Porcentajes (ej. "18.00%", "5.5%", "%mo" no es número)
    if s.endswith('%') and len(s) > 1:
        num_part = s[:-1].strip().replace(',', '')
        try:
            p_val = float(num_part) / 100.0
            return p_val, "num", "0.00%"
        except ValueError:
            pass

    # 2. Negativos contables con paréntesis (ej. "(144,416)" o "(144,416.50)")
    if s.startswith('(') and s.endswith(')'):
        inner = s[1:-1].strip().replace(',', '')
        try:
            n_val = -float(inner)
            return n_val, "num", '#,##0.00;(#,##0.00);"-"'
        except ValueError:
            pass

    # 3. Moneda con prefijo S/. o $
    curr_match = re.match(r'^(S\/\.?|\$)\s*(-?[\d,]+(\.\d+)?)$', s)
    if curr_match:
        prefix = curr_match.group(1)
        num_part = curr_match.group(2).replace(',', '')
        try:
            c_val = float(num_part)
            fmt = f'"{prefix} "#,##0.00'
            return c_val, "num", fmt
        except ValueError:
            pass

    # 4. Limpieza de separadores de miles y guiones bajos contables
    clean_num = s.replace(',', '')
    clean_num = re.sub(r'^_+', '', clean_num).strip()

    # Decimal
    if re.match(r'^-?\d+\.\d+$', clean_num):
        try:
            return float(clean_num), "num", '#,##0.00'
        except ValueError:
            pass

    # Entero
    elif re.match(r'^-?\d+$', clean_num):
        # Códigos de catálogo/insumo de 6 a 16 dígitos se mantienen como string
        if len(clean_num) >= 6 and (clean_num.startswith('0') or len(clean_num) >= 10):
            return s, "str", "@"
        try:
            return int(clean_num), "num", '#,##0'
        except ValueError:
            pass

    # 5. Texto ordinario
    return s, "str", "@"

def convert_pdf_to_xlsx(
    input_pdf: str,
    output_xlsx: str,
    target_pages: list[int] = None,
    sheet_structure: str = "per_page",
    theme: str = "corporate_blue",
    auto_format: bool = True
):
    """
    Convierte las tablas y estructuras de un PDF a un libro nativo de Microsoft Excel (.xlsx).
    """
    unique_temp = os.path.join(
        tempfile.gettempdir(),
        f"pdf2xlsx_{os.getpid()}_{hash(input_pdf) & 0xFFFFFF}.docx"
    )

    cv = None
    try:
        cv = Converter(input_pdf)
        kwargs = {
            "delete_end_line_hyphen": True,
            "line_overlap_threshold": 1.0,
            "parse_stream_table": True,
            "parse_lattice_table": True,
            "clip_image_res_ratio": 2.0,
        }
        if target_pages:
            cv.convert(unique_temp, pages=target_pages, multi_processing=False, **kwargs)
        else:
            cv.convert(unique_temp, multi_processing=False, **kwargs)
        cv.close()
        cv = None

        if not os.path.exists(unique_temp) or os.path.getsize(unique_temp) == 0:
            raise RuntimeError("Fallo en la extracción estructural intermedia del PDF.")

        # Post-procesar con el motor de fidelidad de tablas si está disponible
        try:
            from pdf2docx_official_convert import enhance_docx_visual_fidelity
            enhance_docx_visual_fidelity(unique_temp, input_pdf)
        except Exception:
            pass

        doc = docx.Document(unique_temp)

        # Configuración de Estilos y Temas
        wb = openpyxl.Workbook()
        # Eliminar hoja default
        wb.remove(wb.active)

        if theme == "slate":
            hdr_bg = "334155" # Slate 700
            accent_bg = "F1F5F9" # Slate 100
        elif theme == "classic":
            hdr_bg = "1E293B" # Dark Slate
            accent_bg = "F8FAFC"
        else: # corporate_blue
            hdr_bg = "1E3A8A" # Blue 900
            accent_bg = "EFF6FF" # Blue 50

        header_font = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color=hdr_bg, end_color=hdr_bg, fill_type="solid")
        title_font = Font(name="Segoe UI", size=11, bold=True, color="0F172A")
        subtitle_font = Font(name="Segoe UI", size=9, italic=True, color="475569")
        regular_font = Font(name="Segoe UI", size=9, color="0F172A")
        bold_font = Font(name="Segoe UI", size=9, bold=True, color="0F172A")
        total_font = Font(name="Segoe UI", size=9, bold=True, color="0F172A")

        thin_border = Border(
            left=Side(style='thin', color='E2E8F0'),
            right=Side(style='thin', color='E2E8F0'),
            top=Side(style='thin', color='E2E8F0'),
            bottom=Side(style='thin', color='E2E8F0')
        )
        total_border = Border(
            left=Side(style='thin', color='E2E8F0'),
            right=Side(style='thin', color='E2E8F0'),
            top=Side(style='thin', color='0F172A'),
            bottom=Side(style='double', color='0F172A')
        )

        current_sheet = None
        current_row = 1
        page_counter = 1

        def get_or_create_sheet(p_num: int):
            nonlocal current_sheet, current_row
            if sheet_structure == "per_page":
                sheet_name = f"Pág {p_num}"
                if sheet_name not in wb.sheetnames:
                    current_sheet = wb.create_sheet(title=sheet_name)
                    current_sheet.views.sheetView[0].showGridLines = True
                    current_row = 1
                else:
                    current_sheet = wb[sheet_name]
            else:
                if "Consolidado" not in wb.sheetnames:
                    current_sheet = wb.create_sheet(title="Consolidado")
                    current_sheet.views.sheetView[0].showGridLines = True
                    current_row = 1
            return current_sheet

        current_sheet = get_or_create_sheet(page_counter)

        # Recorrer los elementos del cuerpo en orden cronológico
        for el in doc.element.body:
            # Detección de salto de página
            if el.xpath('.//w:br[@w:type="page"]') or el.xpath('.//w:lastRenderedPageBreak'):
                page_counter += 1
                if sheet_structure == "per_page":
                    current_sheet = get_or_create_sheet(page_counter)
                else:
                    # En hoja consolidada, agregar un separador elegante
                    current_row += 2

            if el.tag.endswith('p'):
                p = docx.text.paragraph.Paragraph(el, doc)
                txt = p.text.strip()
                if txt:
                    cell = current_sheet.cell(row=current_row, column=1, value=txt)
                    is_title = len(txt) < 130 and (
                        current_row <= 2 or any(k in txt for k in [
                            'Partida', 'Presupuesto', 'Estado', 'Balance', 'Nota', 
                            'INVERSIONES', 'DICTAMEN', 'ACTIVO', 'PASIVO', 'ESTADO',
                            'Informe', 'Dictamen', 'Opinión', 'Fundamento'
                        ])
                    )
                    if is_title:
                        cell.font = title_font if current_row <= 2 else subtitle_font
                    else:
                        cell.font = regular_font
                        cell.alignment = Alignment(wrap_text=True, vertical="top")
                    current_row += 1

            elif el.tag.endswith('tbl'):
                t = docx.table.Table(el, doc)
                num_rows = len(t.rows)
                num_cols = len(t.columns)
                if num_rows == 0 or num_cols == 0:
                    continue

                # Espaciador antes de la tabla
                current_row += 1
                table_start_row = current_row

                for r_idx, r in enumerate(t.rows):
                    c_texts = [c.text.strip().replace('\r', ' ').replace('\n', ' ') for c in r.cells]
                    
                    # Detección de fila de cabecera
                    is_header_row = (
                        r_idx == 0 or
                        any(h in ' '.join(c_texts) for h in [
                            'Partida', 'Rendimiento', 'Cuadrilla', 'Descripción', 'Costo',
                            'Activos', 'Pasivos', 'Nota', 'S/(000)', '2025', '2024'
                        ])
                    )
                    is_total_row = any(tot in ' '.join(c_texts) for tot in ['Total', 'total', 'TOTAL', 'Subtotal', 'Patrimonio'])

                    for col_idx, cell_text in enumerate(c_texts, start=1):
                        cell = current_sheet.cell(row=current_row, column=col_idx)
                        val, v_type, fmt = parse_cell_value(cell_text, auto_format=auto_format)
                        cell.value = val
                        cell.number_format = fmt

                        if is_header_row:
                            cell.font = header_font
                            cell.fill = header_fill
                            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                            cell.border = thin_border
                        else:
                            cell.font = total_font if is_total_row else regular_font
                            cell.border = total_border if is_total_row else thin_border

                            if v_type == "num":
                                cell.alignment = Alignment(horizontal="right", vertical="center")
                            elif len(cell_text) <= 6 and cell_text.lower() in ['hh', 'hm', 'und', 'gal', 'kg', 'm2', 'm3', '%']:
                                cell.alignment = Alignment(horizontal="center", vertical="center")
                            else:
                                cell.alignment = Alignment(horizontal="left", vertical="center")

                    current_row += 1

                # Espaciador después de la tabla
                current_row += 1

        # Auto-ajuste de anchos de columnas y congelación de paneles en cada hoja
        for ws in wb.worksheets:
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    if cell.value is not None:
                        s_val = str(cell.value)
                        # Ignorar títulos largos en la columna A que excedan 40 caracteres
                        if col_letter == 'A' and cell.row <= 3 and len(s_val) > 35:
                            continue
                        max_len = max(max_len, len(s_val))
                ws.column_dimensions[col_letter].width = min(max(max_len + 3, 10), 45)

            # Congelar encabezados
            ws.freeze_panes = 'A2'

        # Si el libro no tiene hojas, crear una por defecto
        if len(wb.worksheets) == 0:
            ws = wb.create_sheet(title="Datos")
            ws.cell(row=1, column=1, value="No se detectaron tablas en las páginas seleccionadas.")

        out_dir = os.path.dirname(os.path.abspath(output_xlsx))
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        wb.save(output_xlsx)
        print(f"XLSX successfully created: {output_xlsx}")
        return True

    finally:
        if cv:
            try:
                cv.close()
            except Exception:
                pass
        if os.path.exists(unique_temp):
            try:
                os.remove(unique_temp)
            except Exception:
                pass

def main():
    parser = argparse.ArgumentParser(description="Convert PDF tables to native Microsoft Excel (.xlsx)")
    parser.add_argument("input_pdf", help="Path to input PDF")
    parser.add_argument("output_xlsx", help="Path to output XLSX")
    parser.add_argument("--pages", help="Comma-separated 1-based page numbers or ranges (e.g. 1-5, 11)", default=None)
    parser.add_argument("--sheet-structure", choices=["per_page", "single_sheet"], default="per_page", help="Structure of Excel sheets")
    parser.add_argument("--theme", choices=["corporate_blue", "slate", "classic"], default="corporate_blue", help="Visual styling theme")
    parser.add_argument("--no-auto-format", action="store_true", help="Disable automatic numeric and accounting formatting")

    args = parser.parse_args()

    if not os.path.exists(args.input_pdf):
        print(f"Error: Input file '{args.input_pdf}' not found.", file=sys.stderr)
        sys.exit(1)

    target_pages = None
    if args.pages:
        page_indices = set()
        for part in args.pages.split(','):
            part = part.strip()
            if not part:
                continue
            if '-' in part:
                try:
                    s_str, e_str = part.split('-', 1)
                    s, e = int(s_str), int(e_str)
                    for p in range(min(s, e), max(s, e) + 1):
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

    success = convert_pdf_to_xlsx(
        input_pdf=args.input_pdf,
        output_xlsx=args.output_xlsx,
        target_pages=target_pages,
        sheet_structure=args.sheet_structure,
        theme=args.theme,
        auto_format=not args.no_auto_format
    )

    if success and os.path.exists(args.output_xlsx) and os.path.getsize(args.output_xlsx) > 0:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
