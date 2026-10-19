import os
import sys
import subprocess
import tempfile
import shutil
import urllib.parse
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PDFBlack Cloud Run Conversion Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"service": "PDFBlack Cloud Run Engine", "status": "running"}

@app.get("/health")
def health():
    # Comprobar disponibilidad de LibreOffice
    lo_available = shutil.which("soffice") is not None or shutil.which("libreoffice") is not None
    return {
        "status": "ok",
        "libreoffice_available": lo_available,
        "environment": "Google Cloud Run"
    }

def convert_with_libreoffice(input_pdf: str, output_dir: str) -> str:
    """Convierte PDF a DOCX usando LibreOffice Headless Writer Import"""
    cmd = [
        "soffice",
        "--headless",
        "--infilter=writer_pdf_import",
        "--convert-to",
        "docx",
        "--outdir",
        output_dir,
        input_pdf
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    base_name = os.path.splitext(os.path.basename(input_pdf))[0]
    expected_out = os.path.join(output_dir, f"{base_name}.docx")
    if os.path.exists(expected_out):
        return expected_out
    raise RuntimeError(f"LibreOffice conversion failed: {res.stderr.decode('utf-8', errors='ignore')}")

def convert_with_pdf2docx(input_pdf: str, output_docx: str):
    """Conversión Ultra HD con paridad visual y post-procesamiento OpenXML idéntico a Local"""
    try:
        from pdf2docx_official_convert import Converter, enhance_docx_visual_fidelity
        cv = Converter(input_pdf)
        kwargs = {
            "delete_end_line_hyphen": True,
            "line_overlap_threshold": 1.0,
            "parse_stream_table": True,
            "parse_lattice_table": True,
            "clip_image_res_ratio": 2.0,
        }
        cv.convert(output_docx, multi_processing=False, **kwargs)
        cv.close()
        if not os.path.exists(output_docx) or os.path.getsize(output_docx) == 0:
            raise RuntimeError("pdf2docx failed to generate file")
        # Post-procesamiento OpenXML idéntico al motor local
        enhance_docx_visual_fidelity(output_docx, input_pdf)
        return output_docx
    except Exception as e:
        print(f"[CloudRun Engine] Error en motor oficial pdf2docx: {e}. Intentando fallback estándar...", file=sys.stderr)
        from pdf2docx import Converter
        cv = Converter(input_pdf)
        cv.convert(output_docx, start=0, end=None)
        cv.close()
        if not os.path.exists(output_docx):
            raise RuntimeError(f"pdf2docx fallback failed: {e}")
        return output_docx

@app.post("/convert/pdf-to-docx")
async def convert_pdf_to_docx(
    file: UploadFile = File(...),
    engine: str = Form("libreoffice") # 'libreoffice' | 'pdf2docx'
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    unique_id = os.urandom(8).hex()
    temp_dir = tempfile.mkdtemp(prefix=f"conv_{unique_id}_")
    input_pdf_path = os.path.join(temp_dir, "input.pdf")

    try:
        content = await file.read()
        with open(input_pdf_path, "wb") as f:
            f.write(content)

        output_docx_path = None

        # Detección de arquetipo BROCHURE / CATÁLOGO (Arquitectura Gemini 4 Argon)
        try:
            from brochure_engine import is_brochure_archetype, PDFBlackBrochureEngine
            if is_brochure_archetype(input_pdf_path):
                print("[CloudRun Engine] Arquetipo BROCHURE detectado. Activando Motor OpenXML Absoluto...", file=sys.stderr)
                brochure_out = os.path.join(temp_dir, "brochure_out.docx")
                b_engine = PDFBlackBrochureEngine(input_pdf_path, brochure_out, dpi=150)
                b_engine.convert()
                if os.path.exists(brochure_out) and os.path.getsize(brochure_out) > 0:
                    output_docx_path = brochure_out
        except Exception as b_err:
            print(f"[CloudRun Engine] Error en brochure engine: {b_err}", file=sys.stderr)

        if not output_docx_path:
            if engine == "libreoffice":
                try:
                    output_docx_path = convert_with_libreoffice(input_pdf_path, temp_dir)
                except Exception as lo_err:
                    print(f"LibreOffice failed ({lo_err}), trying pdf2docx fallback...", file=sys.stderr)
                    fallback_path = os.path.join(temp_dir, "fallback_out.docx")
                    output_docx_path = convert_with_pdf2docx(input_pdf_path, fallback_path)
            else:
                fallback_path = os.path.join(temp_dir, "pdf2docx_out.docx")
                output_docx_path = convert_with_pdf2docx(input_pdf_path, fallback_path)

        if not output_docx_path or not os.path.exists(output_docx_path):
            raise HTTPException(status_code=500, detail="Conversion could not generate DOCX file")

        original_title = os.path.splitext(file.filename)[0]
        safe_filename = f"{urllib.parse.quote(original_title)}_Word.docx"

        return FileResponse(
            path=output_docx_path,
            filename=safe_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        pass # Los archivos temporales se limpian en background o ciclo de vida del contenedor

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
