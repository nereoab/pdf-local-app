---
name: pdf-docx-engineering
description: >-
  Guía avanzada de ingeniería OpenXML y reestructuración de documentos PDF a DOCX.
  Utilizar cuando se necesite mejorar la fidelidad visual, estructura de tablas,
  alineación de columnas o corrección de diseño en conversiones de PDF a Microsoft Word.
---

# PDF to Word (OpenXML) Engineering Mastery

Esta skill proporciona las directivas arquitectónicas, estándares de calidad y patrones de código OpenXML (`wordprocessingml`) para garantizar conversiones de PDF a Word con nivel de fidelidad idéntico o superior a herramientas comerciales (iLovePDF, Adobe Acrobat).

---

## 1. Clasificación Automática de Documentos

Antes de aplicar cualquier transformación o estandarización geométrica a las tablas, se debe inspeccionar el tipo de documento para **evitar colisiones de diseño** (por ejemplo, nunca forzar anchos de columna de presupuesto A4 vertical en un balance financiero A3 apaisado):

| Tipo de Documento | Criterio de Detección | Estrategia de Renderizado |
| :--- | :--- | :--- |
| **Presupuestos y Análisis de Costos (S10)** | Palabras clave: `Cuadrilla`, `Costo unitario directo`, `Partida Rendimiento`, `Subpresupuesto`. | Estandarización de columnas fijas (`W7, W8, W12`), inserción de celda vacía en Materiales (6 a 7 cols), alineación estricta de decimales a la derecha. |
| **Estados Financieros y Balances Corporativos** | Palabras clave: `Estado de situación financiera`, `Activos corrientes`, `Pasivos`, `Patrimonio neto`, o páginas en orientación *Landscape*. | Conservación estricta de anchos porcentuales nativos de tabla, celdas elásticas, separación de tabulaciones en cabeceras. |
| **Folletos, Catálogos y Presentaciones** | Predominancia de gráficos vectoriales, imágenes de fondo completas y textos con tipografías display (Rubik, Poppins, Montserrat). | Mapeo tipográfico a fuentes limpias del sistema (Segoe UI), eliminación de capas vectoriales opacas parásitas (overlays sin alfa), compactación de espaciados inter-párrafo. |
| **Informes Legales y Contratos Notariales** | Texto continuo en bloques justificados, encabezados numerados y sellos marginales. | Mantenimiento de interlineado proporcional, flujo de párrafos continuo con saltos de página naturales. |

---

## 2. Estándares Universales OpenXML para Tablas

Todas las tablas generadas por el motor deben cumplir sin excepción las siguientes directivas XML:

### A. Prevención de fractura de filas (`<w:cantSplit/>`)
Impide que Microsoft Word divida una fila horizontalmente a través de un salto de página, manteniendo el contenido íntegro:
```python
from docx.oxml import OxmlElement

for row in table.rows:
    trPr = row._tr.get_or_add_trPr()
    if not trPr.xpath('w:cantSplit'):
        trPr.append(OxmlElement('w:cantSplit'))
```

### B. Centrado vertical de celdas (`<w:vAlign w:val="center"/>`)
Evita que el texto quede pegado a la línea superior de la celda:
```python
from docx.oxml.ns import qn

for row in table.rows:
    for cell in row.cells:
        tcPr = cell._tc.get_or_add_tcPr()
        if not tcPr.xpath('w:vAlign'):
            vAlign = OxmlElement('w:vAlign')
            vAlign.set(qn('w:val'), 'center')
            tcPr.append(vAlign)
```

### C. Depuración de sombreados negros parásitos (`<w:shd/>`)
En documentos con recuadros vectoriales finos (ej. portadas corporativas), `pdf2docx` puede interpretar erróneamente un trazado como fondo negro opaco:
```python
for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            shds = cell._tc.xpath('w:tcPr/w:shd')
            if shds:
                fill = shds[0].attrib.get(qn('w:fill'), '').lower()
                if fill in ['000000', 'black']:
                    cell._tc.get_or_add_tcPr().remove(shds[0])
```

---

## 3. Alineación Numérica y Decimal Milimétrica

Para columnas con valores numéricos (cantidades, precios unitarios, subtotales, totales):
1. **Alineación a la derecha:** Aplicar `<w:jc w:val="right"/>` tanto a los datos numéricos como a las cabeceras correspondientes.
2. **Margen derecho unificado:** Fijar `<w:ind w:right="80"/>` (4 pt) y `<w:ind w:left="0"/>` para asegurar que las comas y puntos decimales caigan exactamente sobre una misma línea vertical sin distorsiones por sangría.
3. **Códigos de insumo (10 a 14 dígitos):** Alinear a la izquierda con `<w:jc w:val="left"/>` y ancho mínimo de celda de 1,500 dxa (aprox. 2.6 cm) para impedir que el código se quiebre en dos renglones.
4. **Unidades de medida (`hh`, `hm`, `und`, `m3`, `kg`, `%`):** Centrar con `<w:jc w:val="center"/>`.

---

## 4. Separación de Logotipos e Imágenes en Cabeceras

Cuando un logotipo en línea (inline drawing) esté ubicado en el mismo párrafo que texto descriptivo con tabulaciones:
* Insertar un elemento `<w:tab/>` inmediatamente después del run de la imagen para que el texto respete el tabulador asignado en el margen derecho y no colisione con el gráfico.

---

## 5. Regla de Paridad de Páginas

El documento DOCX final debe tener **exactamente el mismo número de páginas** que el PDF original:
* No forzar `w:hRule="atLeast"` con valores inflados si el documento contiene tablas densas, ya que provocará saltos de página indeseados.
* Preservar `w:hRule="exact"` en celdas con espaciado ajustado para replicar con exactitud el paginado 1 a 1.
