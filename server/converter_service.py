import os
import tempfile
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pdf2docx import Converter

app = FastAPI(title="PDFBlack High-Precision Conversion Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "pdf2docx-engine"}

@app.post("/convert/pdf2docx")
async def convert_pdf_to_docx(
    file: UploadFile = File(...),
    pages: str = Form(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    unique_id = os.urandom(8).hex()
    temp_dir = tempfile.gettempdir()
    input_path = os.path.join(temp_dir, f"in_{unique_id}.pdf")
    output_path = os.path.join(temp_dir, f"out_{unique_id}.docx")

    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        page_list = None
        if pages and pages.strip():
            try:
                page_list = [int(p.strip()) - 1 for p in pages.split(",") if p.strip()]
            except Exception:
                page_list = None

        cv = Converter(input_path)
        if page_list:
            cv.convert(output_path, pages=page_list)
        else:
            cv.convert(output_path, start=0, end=None)
        cv.close()

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Conversion failed to produce output file")

        original_title = os.path.splitext(file.filename)[0]
        safe_filename = f"{original_title}_Word.docx"

        return FileResponse(
            path=output_path,
            filename=safe_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
