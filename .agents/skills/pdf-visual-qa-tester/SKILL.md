---
name: pdf-visual-qa-tester
description: >-
  Protocolo de pruebas de control de calidad visual y benchmarking automatizado para conversiones PDF/Word/Excel.
  Utilizar para verificar paridad de páginas, validar ausencia de desbordes, comparar renderizados visuales
  y asegurar que ninguna optimización genere regresiones en otros tipos de documentos.
---

# PDF Visual QA & Regression Testing Protocol

Esta skill proporciona las directivas y scripts de verificación para auditar la calidad visual, la estabilidad estructural y la paridad de páginas entre el PDF original y el documento convertido (Word / Excel).

---

## 1. Reglas de Validación Esenciales

Antes de dar por concluida cualquier mejora en los motores de conversión, se deben validar obligatoriamente los siguientes 3 pilares:

1. **Paridad Exacta de Páginas:**
   * El conteo de páginas en Microsoft Word (calculado vía COM `ComputeStatistics(2)`) debe ser idéntico al del PDF original:
     $$\text{Páginas}_{\text{DOCX}} = \text{Páginas}_{\text{PDF}}$$
   * Cualquier incremento en el número de páginas indica desbordamiento vertical de tablas o párrafos (*table row overflow*).

2. **Integridad de Texto y Cero Superposiciones:**
   * No deben existir recuadros negros tapando texto en portadas.
   * Logotipos e imágenes en cabeceras no deben colisionar con nombres o textos adyacentes.

3. **Cero Regresiones Cruzadas:**
   * Toda mejora implementada para un formato específico (ej. estados financieros corporativos) debe ser probada contra presupuestos S10 y folletos vectoriales para garantizar que continúen funcionando al 100%.

---

## 2. Scripts de Prueba Automatizados (Python en Windows)

### A. Verificación Inmediata de Conteo de Páginas y Tamaño
Ejecutar este script rápido para comparar el archivo generado contra el original o contra conversiones de referencia:

```python
import win32com.client
import os

def check_docx_pages(docx_path: str) -> int:
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(os.path.abspath(docx_path), ReadOnly=True)
        pages = doc.ComputeStatistics(2) # 2 = wdStatisticPages
        doc.Close(False)
        return pages
    finally:
        word.Quit()

# Uso:
pages = check_docx_pages("archivo_convertido.docx")
print(f"Total páginas en Microsoft Word: {pages}")
```

### B. Renderizado de Páginas Clave a PNG para Inspección Visual
Renderizar páginas específicas (ej. portada, dictamen de auditores, estados financieros apaisados o presupuestos) para inspección visual:

```python
import win32com.client
import fitz # PyMuPDF
import os

def render_docx_pages_to_images(docx_path: str, pages_to_render: list[int], output_dir: str):
    temp_pdf = os.path.splitext(docx_path)[0] + "_temp_view.pdf"
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(os.path.abspath(docx_path), ReadOnly=True)
        doc.SaveAs2(os.path.abspath(temp_pdf), FileFormat=17) # 17 = wdFormatPDF
        doc.Close(False)
    finally:
        word.Quit()

    pdf_doc = fitz.open(temp_pdf)
    os.makedirs(output_dir, exist_ok=True)
    
    for p_num in pages_to_render:
        if 1 <= p_num <= len(pdf_doc):
            pix = pdf_doc[p_num - 1].get_pixmap(dpi=150)
            pix.save(os.path.join(output_dir, f"page_{p_num}.png"))
    
    pdf_doc.close()
    if os.path.exists(temp_pdf):
        os.remove(temp_pdf)
```

---

## 3. Matriz de Documentos de Prueba Estándar

Siempre probar contra este banco de documentos de referencia del proyecto:

| Archivo de Prueba | Caso Crítico a Verificar | Resultado Esperado |
| :--- | :--- | :--- |
| `Inversiones-Centenario-S.A.A.-Consolidado-2025.pdf` | Portada, logo EY en pág. 3, y balance apaisado en pág. 11. | 114 páginas exactas, columnas amplias en A3 Landscape, cero cajas negras. |
| `1.3 Analisis de Precios Unitarios_Subpartidas_Final 2024_3.pdf` | Tablas de 6, 7 y 12 columnas (Mano de Obra, Materiales, Equipos). | 13 páginas exactas, columna Cuadrilla insertada en Materiales, decimales alineados a la derecha. |
| `MAGECO_Brochure.pdf` | Fondos fotográficos y gráficos vectoriales superpuestos. | Colores vivos, sin capas opacas tapando el fondo, tipografía limpia. |
