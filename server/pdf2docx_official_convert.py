import sys
import os
import argparse
import logging

# Silenciar logs excesivos de pdf2docx que pueden bloquear el buffer de stdout
logging.getLogger("pdf2docx").setLevel(logging.ERROR)
logging.getLogger("fitz").setLevel(logging.ERROR)
logging.basicConfig(level=logging.ERROR)

from pdf2docx import Converter

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

    try:
        cv = Converter(args.input_pdf)
        kwargs = {
            "delete_end_line_hyphen": True,
            "line_overlap_threshold": 1.0,
            "parse_stream_table": True,
            "parse_lattice_table": True,
        }
        if target_pages:
            cv.convert(args.output_docx, pages=target_pages, multi_processing=False, **kwargs)
        else:
            cv.convert(args.output_docx, multi_processing=args.multi_processing, **kwargs)
        cv.close()

        if os.path.exists(args.output_docx) and os.path.getsize(args.output_docx) > 0:
            print("Conversion completed successfully.")
            sys.exit(0)
        else:
            print("Error: Output file was not generated or is empty.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error during pdf2docx conversion: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
