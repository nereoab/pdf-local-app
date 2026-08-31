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
    """Fallback con pdf2docx"""
    from pdf2docx import Converter
    cv = Converter(input_pdf)
    cv.convert(output_docx, start=0, end=None)
    cv.close()
    if not os.path.exists(output_docx):
        raise RuntimeError("pdf2docx fallback failed")
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
