---
name: pdf-ocr-document-intelligence
description: >-
  Directivas y patrones de Optical Character Recognition (OCR) e inteligencia documental para PDFs escaneados.
  Utilizar cuando se procesen documentos escaneados, imágenes de texto, facturas, expedientes o contratos notariales.
---

# PDF OCR & Document Intelligence Mastery

Esta skill reúne las estrategias para transformar documentos escaneados, fotografías de expedientes y planos en PDFs buscables y editables, manteniendo la privacidad total (100% procesamiento local).

---

## 1. Pipeline de Pre-procesamiento de Imagen

Para maximizar la precisión del OCR (del ~75% a más del 98%) en documentos de baja calidad o escaneados con sombras:

1. **Auto-rotación (Deskew & Orientation Detection):**
   * Detectar la orientación del texto (0°, 90°, 180°, 270°) mediante OSD (*Orientation and Script Detection*).
   * Corregir la inclinación leve (ángulo de skew entre -5° y +5°) para que las líneas de texto queden perfectamente horizontales antes de la segmentación.

2. **Binarización y Limpieza:**
   * Convertir imágenes a escala de grises.
   * Aplicar umbralización adaptativa (Otsu o Gaussian Adaptive Thresholding) para eliminar fondos grisáceos, manchas de café o sombras de pliegues.

---

## 2. Generación de PDF "Sandwich" (Searchable PDF)

Al realizar OCR sobre un documento escaneado:
* **Nunca reemplazar la imagen original por texto plano si se desea conservar la autenticidad visual (firmas, sellos, membretes).**
* Generar un **PDF Sandwich**: la imagen escaneada original se mantiene en primer plano y se incrusta una capa de texto invisible e indexable exactamente debajo de cada palabra correspondiente.
* Esto permite seleccionar, copiar y buscar texto (`Ctrl + F`) en Adobe Acrobat o en el navegador sin alterar la estética del documento escaneado original.

---

## 3. Heurística de Detección: ¿El PDF necesita OCR?

Antes de lanzar un proceso OCR costoso en tiempo de CPU:
```python
import fitz

def needs_ocr(pdf_path: str, min_chars_per_page: int = 50) -> bool:
    """Retorna True si el documento es puramente escaneado (sin capa de texto nativa)."""
    doc = fitz.open(pdf_path)
    total_text_chars = 0
    pages_checked = min(5, len(doc))
    for i in range(pages_checked):
        total_text_chars += len(doc[i].get_text().strip())
    doc.close()
    avg_chars = total_text_chars / max(1, pages_checked)
    return avg_chars < min_chars_per_page
```
