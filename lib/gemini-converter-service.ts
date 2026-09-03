import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface GeminiConversionOptions {
  pages?: string;
  tableDetectionAccuracy?: 'high' | 'ultra';
  preserveFormatting?: boolean;
}

interface GeminiTableSchema {
  sheetName: string;
  headers?: string[];
  rows: (string | number | null)[][];
}

export interface GeminiDocumentBlock {
  type:
    | 'heading'
    | 'paragraph'
    | 'metadata_grid'
    | 'signature_block'
    | 'table'
    | 'bullet'
    | 'callout'
    | 'quote'
    | 'divider'
    | 'page_break';
  level?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  spacing?: { before?: number; after?: number; line?: number };
  text?: string;
  color?: string;
  size?: number;
  runs?: Array<{
    text: string;
    bold?: boolean;
    italics?: boolean;
    underline?: boolean;
    color?: string;
    size?: number;
  }>;
  gridRows?: Array<{
    label: string;
    value: string;
  }>;
  tableTitle?: string;
  headers?: string[];
  alignments?: Array<'left' | 'center' | 'right'>;
  rows?: (string | number)[][];
  headerBgColor?: string;
  footerNote?: string;
  hasTotalsRow?: boolean;
  calloutType?: 'info' | 'warning' | 'success' | 'note' | 'quote';
  bold?: boolean;
}

/**
 * Obtiene la API Key de Gemini desde variables de entorno
 */
export function getGeminiApiKey(): string {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  return (apiKey || '').trim();
}

/**
 * Extrae texto de respuesta JSON de Gemini limpiando etiquetas y delimitadores markdown
 */
function extractJsonFromText(rawText: string): string {
  let cleaned = rawText.trim();

  // Buscar bloque de código ```json ... ```
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    return jsonBlockMatch[1].trim();
  }

  // Buscar primer '{' o '[' y último '}' o ']'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Llama a la API de Google Gemini con prioridad en Gemini 3.7 Flash y fallback inteligente
 */
export async function callGeminiApi(
  prompt: string,
  base64File?: { data: string; mimeType: string },
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY no está configurada. Agrega tu clave gratuita de Google AI Studio en .env.local o variables de entorno.',
    );
  }

  // Modelos preferidos: Gemini 3.7 Flash como principal
  const models = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ];

  const apiVersions = ['v1', 'v1beta'];
  let lastError: Error | null = null;

  for (const version of apiVersions) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
          { text: prompt },
        ];

        if (base64File) {
          parts.push({
            inlineData: {
              mimeType: base64File.mimeType,
              data: base64File.data,
            },
          });
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 32,
              topP: 0.95,
              maxOutputTokens: 65536,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (textOutput && textOutput.trim().length > 0) {
            return textOutput;
          }
        } else {
          const errorText = await response.text();
          console.warn(
            `[Gemini Engine] [${version}/${model}] returned ${response.status}:`,
            errorText.substring(0, 150),
          );
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Engine] Error en [${version}/${model}]:`, err?.message);
      }
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta del motor Gemini AI.');
}

/**
 * 1. CONVERTIDOR UNIVERSAL PDF A EXCEL CON GEMINI AI
 * Analiza visualmente cualquier documento PDF (balances, cuadros, facturas, presupuestos, inventarios, planillas)
 * y lo reconstruye con máxima fidelidad desde cero en hojas de cálculo nativas .xlsx.
 */
export async function convertPdfToExcelWithGemini(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
  options?: GeminiConversionOptions,
): Promise<Buffer> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY no está configurada en .env.local ni en las variables de entorno.',
    );
  }

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = pdfDoc.getPageCount();

  const prompt = `Eres un motor de visión artificial e inteligencia artificial de máxima precisión especializado en la transcripción, estructuración y reconstrucción fiel de documentos PDF a Microsoft Excel (.xlsx).

Tu misión es RECONSTRUIR DESDE CERO Y CON MÁXIMA FIDELIDAD ESTRUCTURAL todos los cuadros, tablas, matrices, formularios y datos contenidos en este documento PDF (nombre: "${fileName}", total páginas: ${totalPages}).

DIRECTRICES UNIVERSALES OBLIGATORIAS:
1. RECONSTRUCCIÓN EXACTA Y SIN OMISIONES:
   - Analiza visualmente la estructura, cuadrículas y jerarquía de cada página del PDF.
   - Transcribe todas las tablas, filas, columnas, subtotales, totales y metadatos tal y como aparecen en el documento original.
   - NO resumas ni omitas filas o columnas de datos; reproduce el contenido íntegro de principio a fin.

2. ADAPTABILIDAD AL TIPO DE DOCUMENTO:
   - Identifica el formato y propósito del archivo (presupuestos de obra, estados financieros, balances, facturas, listas de inventario, planillas de sueldos, reportes de ventas, cronogramas, tablas científicas, etc.).
   - Estructura las hojas de cálculo según el contenido real del documento:
     * Si el documento contiene múltiples tablas temáticas o reportes diferenciados, crea una hoja ("sheetName") para cada sección principal o un resumen consolidado si aplica.
     * Si es un único reporte o tabla continua, organízalo en una hoja limpia y bien estructurada.

3. TRATAMIENTO DE DATOS Y CELDAS:
   - Convierte todos los valores numéricos (cantidades, importes monetarios, porcentajes, rendimientos, precios unitarios) a números reales (ej: 1450.50, 42, -500), no texto.
   - Conserva los encabezados, textos descriptivos, códigos alfanuméricos y fechas con su formato original.
   - Respeta la alineación de columnas para que los datos coincidan verticalmente con sus encabezados correspondientes.

4. FORMATO DE SALIDA (ESTRICTAMENTE JSON):
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "sheets": [
    {
      "sheetName": "Nombre descriptivo de la hoja",
      "rows": [
        ["Título o Encabezado Principal"],
        ["Columna 1", "Columna 2", "Columna 3", "Columna 4"],
        ["Dato A", "Descripción A", 100, 15.50],
        ["Dato B", "Descripción B", 250, 42.00],
        ["Total", null, 350, 57.50]
      ]
    }
  ]
}`;

  const rawResponse = await callGeminiApi(prompt, {
    data: pdfBuffer.toString('base64'),
    mimeType: 'application/pdf',
  });

  const cleanJsonStr = extractJsonFromText(rawResponse);
  const parsedData: { sheets?: Array<{ sheetName: string; headers?: string[]; rows: any[][] }> } =
    JSON.parse(cleanJsonStr);

  if (!parsedData.sheets || parsedData.sheets.length === 0) {
    throw new Error('Gemini no detectó tablas estructuradas en el documento.');
  }

  // Crear libro de trabajo Excel nativo con SheetJS
  const workbook = XLSX.utils.book_new();

  for (const sheetData of parsedData.sheets) {
    const sheetName = (sheetData.sheetName || 'Hoja1')
      .substring(0, 31)
      .replace(/[:\\/?*\[\]]/g, '_');

    const rowsData: any[][] = [];

    if (sheetData.headers && sheetData.headers.length > 0) {
      rowsData.push(sheetData.headers);
    }

    if (sheetData.rows && sheetData.rows.length > 0) {
      for (const row of sheetData.rows) {
        rowsData.push(row);
      }
    }

    if (rowsData.length === 0) {
      rowsData.push(['Sin datos en esta hoja']);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rowsData);

    // Calcular anchos de columna automáticos basados en el contenido
    const colWidths = rowsData.reduce((acc: number[], row: any[]) => {
      row.forEach((cell, colIdx) => {
        const len = cell ? String(cell).length : 5;
        acc[colIdx] = Math.max(acc[colIdx] || 10, Math.min(len + 3, 60));
      });
      return acc;
    }, []);

    worksheet['!cols'] = colWidths.map((w: number) => ({ wch: w }));

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const excelUint8Array = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
  });

  return Buffer.from(excelUint8Array);
}

/**
 * 2. CONVERTIDOR EXCEL A PDF CON GEMINI AI
 */
export async function convertExcelToPdfWithGemini(
  excelBuffer: Buffer,
  fileName = 'spreadsheet.xlsx',
): Promise<Buffer> {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData || jsonData.length === 0) continue;

    let page = pdfDoc.addPage([842, 595]); // A4 Horizontal
    const { width, height } = page.getSize();
    let yPos = height - 40;

    // Encabezado de la hoja
    page.drawText(`Hoja: ${sheetName}`, {
      x: 40,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.4, 0.2),
    });
    yPos -= 25;

    const numCols = Math.max(...jsonData.map((r) => (r ? r.length : 0)), 1);
    const colWidth = Math.min((width - 80) / numCols, 120);

    for (let rowIdx = 0; rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (yPos < 45) {
        page = pdfDoc.addPage([842, 595]);
        yPos = height - 40;
      }

      const isHeaderRow = rowIdx === 0;

      if (row && row.length > 0) {
        row.forEach((cellVal, colIdx) => {
          if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
            const text = String(cellVal).substring(0, 30);
            page.drawText(text, {
              x: 40 + colIdx * colWidth,
              y: yPos,
              size: isHeaderRow ? 9 : 8,
              font: isHeaderRow ? fontBold : font,
              color: isHeaderRow ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
            });
          }
        });
      }

      yPos -= 16;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 3. CONVERTIDOR PDF A WORD CON GEMINI AI
 * Reconstruye el documento con diseño de nivel oficial y corporativo de alta precisión:
 * - Membretes institucionales y epígrafes oficiales.
 * - Fechas alineadas y códigos de documento.
 * - Grillas de metadatos (Asunto, Referencia) sin bordes toscos.
 * - Párrafos justificados con resaltado de términos clave, plazos y cifras.
 * - Bloques de firma y anexos tabulares estilizados con efecto cebra y notas al pie.
 */
export async function convertPdfToWordWithGemini(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
  options?: GeminiConversionOptions,
): Promise<Buffer> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY no está configurada en .env.local ni en las variables de entorno.',
    );
  }

  const prompt = `Eres un diseñador editorial y maquetador oficial de documentos de máxima precisión.
Analiza este documento PDF (archivo: "${fileName}") y reconstruye su estructura completa en un modelo de bloques semántico en formato JSON puro.

OBJETIVO:
Reproducir fielmente la diagramación, jerarquía, alineaciones y estilos del documento original (ya sea un Oficio Oficial del Estado, Carta Formal, Informe Técnico o Reporte Corporativo).

INSTRUCCIONES DE IDENTIFICACIÓN Y ESTRUCTURA:
1. "paragraph": Párrafos de texto. Especifica "align" ("left", "center", "right", "justify") y "spacing" si es necesario.
   - En lugar de texto plano simple, desglosa en "runs" con:
     * "bold": true para nombres de instituciones, códigos de oficio, palabras de urgencia ("MUY URGENTE"), plazos ("24 horas", "48 horas"), importes o firmantes.
     * "italics": true para lemas oficiales ("Decenio de la Igualdad..."), [DOCUMENTO FIRMADO DIGITALMENTE], etc.
     * "color": "003366" (azul institucional), "444444" (gris oscuro), "666666" (gris medio), "777777" (gris tenue), "000000" o "1E3A8A".
     * "size": 24 (12pt), 22 (11pt), 20 (10pt), 19 (9.5pt), 17 (8.5pt), 15 (7.5pt).
2. "metadata_grid": Para campos de formulario o encabezados como:
   {
     "type": "metadata_grid",
     "gridRows": [
       { "label": "Asunto  :", "value": "Solicita información de acciones realizadas sobre los puntos críticos..." },
       { "label": "Referencia  :", "value": "INFORME DE VISITA DE CONTROL N° 019-2026-OCI/5335-SVC" }
     ]
   }
3. "signature_block": Para el bloque de firma y despedida:
   {
     "type": "signature_block",
     "align": "center",
     "runs": [
       { "text": "Atentamente,\n\n", "size": 20 },
       { "text": "[DOCUMENTO FIRMADO DIGITALMENTE]\n", "italics": true, "size": 17 },
       { "text": "JULIO LUIS BERRIOS FERIA\n", "bold": true, "size": 22 },
       { "text": "GERENTE REGIONAL DE GESTIÓN DE RIESGO DE DESASTRES, SEGURIDAD Y DEFENSA", "size": 18 }
     ]
   }
4. "table": Para tablas o cuadros anexos:
   - "tableTitle": Título del cuadro (ej. "Cuadro n.° 1: Relación de Fichas Técnicas Referenciales 2025")
   - "headers": Nombres de las columnas
   - "alignments": Arreglo de alineaciones ("left", "center", "right") por columna
   - "rows": Filas de datos
   - "footerNote": Nota al pie de la tabla (ej. "Fuente: Oficio N° 0016-2026-ANA-AAA.PA...")
5. "heading": Para títulos de secciones (level 1, 2 o 3).
6. "page_break": Si hay un anexo o salto de página evidente.

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "documentTitle": "OFICIO MÚLTIPLE N° 000098-2026-GRA/GR-GRGRDSD",
  "blocks": [
    {
      "type": "paragraph",
      "align": "center",
      "spacing": { "before": 0, "after": 60 },
      "runs": [
        { "text": "GOBIERNO REGIONAL AYACUCHO\n", "bold": true, "color": "003366", "size": 22 },
        { "text": "GOBERNACIÓN REGIONAL\nGERENCIA REGIONAL DE GESTIÓN DE RIESGO DE DESASTRES, SEGURIDAD Y DEFENSA", "bold": true, "color": "444444", "size": 19 }
      ]
    },
    {
      "type": "paragraph",
      "align": "center",
      "spacing": { "before": 60, "after": 200 },
      "runs": [
        { "text": "\"Decenio de la Igualdad de Oportunidades para Mujeres y Hombres\"\n\"Año de la Esperanza y el Fortalecimiento de la Democracia\"", "italics": true, "color": "666666", "size": 17 }
      ]
    },
    {
      "type": "paragraph",
      "align": "right",
      "spacing": { "before": 0, "after": 140 },
      "runs": [
        { "text": "Ayacucho, 18 de agosto del 2026", "size": 20 }
      ]
    },
    {
      "type": "paragraph",
      "align": "left",
      "spacing": { "before": 120, "after": 180 },
      "runs": [
        { "text": "OFICIO MÚLTIPLE N° 000098-2026-GRA/GR-GRGRDSD", "bold": true, "size": 22 }
      ]
    },
    {
      "type": "metadata_grid",
      "gridRows": [
        { "label": "Asunto  :", "value": "Solicita información de acciones realizadas sobre los puntos críticos..." },
        { "label": "Referencia  :", "value": "INFORME DE VISITA DE CONTROL N° 019-2026-OCI/5335-SVC" }
      ]
    },
    {
      "type": "paragraph",
      "align": "justify",
      "spacing": { "before": 120, "after": 160 },
      "runs": [
        { "text": "Tengo el agrado de dirigirme a ustedes para saludarlos cordialmente y, en atención al documento de la referencia, se solicita información con carácter de " },
        { "text": "MUY URGENTE", "bold": true },
        { "text": ", a fin de que remitan información en un plazo de " },
        { "text": "24 horas", "bold": true },
        { "text": ". De acuerdo al Cuadro 1 que se adjunta." }
      ]
    }
  ]
}`;

  const rawResponse = await callGeminiApi(prompt, {
    data: pdfBuffer.toString('base64'),
    mimeType: 'application/pdf',
  });

  const cleanJsonStr = extractJsonFromText(rawResponse);
  const parsedData: { documentTitle?: string; blocks?: GeminiDocumentBlock[] } =
    JSON.parse(cleanJsonStr);

  if (!parsedData.blocks || parsedData.blocks.length === 0) {
    throw new Error('Gemini no generó bloques semánticos para el documento.');
  }

  const docTitle =
    parsedData.documentTitle || fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  const docChildren: any[] = [];

  const getAlignment = (alignStr?: string): (typeof AlignmentType)[keyof typeof AlignmentType] => {
    if (alignStr === 'center') return AlignmentType.CENTER;
    if (alignStr === 'right') return AlignmentType.RIGHT;
    if (alignStr === 'justify' || alignStr === 'both') return AlignmentType.JUSTIFIED;
    return AlignmentType.LEFT;
  };

  for (const block of parsedData.blocks) {
    if (block.type === 'heading') {
      const level = block.level || 1;
      const isH1 = level === 1;
      const isH2 = level === 2;

      docChildren.push(
        new Paragraph({
          heading: isH1
            ? HeadingLevel.HEADING_1
            : isH2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
          alignment: getAlignment(block.align),
          children: [
            new TextRun({
              text: block.text || '',
              bold: true,
              color: isH1 ? '003366' : isH2 ? '334155' : '475569',
              size: isH1 ? 24 : isH2 ? 22 : 20,
            }),
          ],
          spacing: {
            before: block.spacing?.before ?? (isH1 ? 280 : isH2 ? 180 : 120),
            after: block.spacing?.after ?? (isH1 ? 120 : 80),
          },
        }),
      );
    } else if (block.type === 'paragraph') {
      const runs: TextRun[] = [];

      if (block.runs && block.runs.length > 0) {
        for (const run of block.runs) {
          runs.push(
            new TextRun({
              text: run.text || '',
              bold: !!run.bold,
              italics: !!run.italics,
              underline: run.underline ? { type: 'single' } : undefined,
              color: run.color || (run.bold ? '000000' : '222222'),
              size: run.size || (run.bold ? 22 : 20),
            }),
          );
        }
      } else {
        runs.push(
          new TextRun({
            text: block.text || '',
            bold: !!block.bold,
            color: block.color || '222222',
            size: block.size || 20,
          }),
        );
      }

      docChildren.push(
        new Paragraph({
          alignment: getAlignment(block.align),
          children: runs,
          spacing: {
            before: block.spacing?.before ?? 0,
            after: block.spacing?.after ?? 140,
            line: block.spacing?.line ?? 276,
          },
        }),
      );
    } else if (block.type === 'metadata_grid' && block.gridRows && block.gridRows.length > 0) {
      const gridTableRows = block.gridRows.map(
        (row) =>
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                margins: { top: 40, bottom: 40, left: 0, right: 60 },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: row.label,
                        bold: true,
                        color: '111111',
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 82, type: WidthType.PERCENTAGE },
                margins: { top: 40, bottom: 40, left: 60, right: 0 },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: row.value,
                        color: '222222',
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
      );

      docChildren.push(
        new Table({
          rows: gridTableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
      docChildren.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    } else if (block.type === 'signature_block') {
      const runs: TextRun[] = [];

      if (block.runs && block.runs.length > 0) {
        for (const run of block.runs) {
          runs.push(
            new TextRun({
              text: run.text || '',
              bold: !!run.bold,
              italics: !!run.italics,
              color: run.color || (run.bold ? '000000' : run.italics ? '555555' : '333333'),
              size: run.size || 18,
            }),
          );
        }
      } else {
        runs.push(
          new TextRun({
            text: block.text || 'Atentamente,',
            size: 20,
          }),
        );
      }

      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: runs,
          spacing: {
            before: block.spacing?.before ?? 360,
            after: block.spacing?.after ?? 100,
            line: 260,
          },
        }),
      );
    } else if (block.type === 'callout' || block.type === 'quote') {
      const isWarn = block.calloutType === 'warning';
      const isSuccess = block.calloutType === 'success';
      const accentColor = isWarn ? 'D97706' : isSuccess ? '059669' : '003366';
      const bgColor = isWarn ? 'FFFBEB' : isSuccess ? 'ECFDF5' : 'F8FAFC';

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: bgColor },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  borders: {
                    left: { style: BorderStyle.SINGLE, size: 24, color: accentColor },
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: block.text || '',
                          italics: true,
                          color: '1E293B',
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );
      docChildren.push(new Paragraph({ text: '', spacing: { after: 100 } }));
    } else if (block.type === 'bullet') {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: block.text || '',
              color: '222222',
              size: 20,
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
      );
    } else if (block.type === 'page_break') {
      docChildren.push(
        new Paragraph({
          pageBreakBefore: true,
        }),
      );
    } else if (block.type === 'table' && block.rows && block.rows.length > 0) {
      if (block.tableTitle) {
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: block.tableTitle,
                bold: true,
                color: '003366',
                size: 22,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),
        );
      }

      const tableRows: TableRow[] = [];
      const headerColor = block.headerBgColor || '1F4E79';

      if (block.headers && block.headers.length > 0) {
        tableRows.push(
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: block.headers.map((hText, colIdx) => {
              const align =
                block.alignments?.[colIdx] === 'right'
                  ? AlignmentType.RIGHT
                  : block.alignments?.[colIdx] === 'center'
                    ? AlignmentType.CENTER
                    : AlignmentType.LEFT;

              return new TableCell({
                shading: { fill: headerColor },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: headerColor },
                  bottom: { style: BorderStyle.SINGLE, size: 10, color: '002244' },
                  left: { style: BorderStyle.SINGLE, size: 2, color: '2E6B9E' },
                  right: { style: BorderStyle.SINGLE, size: 2, color: '2E6B9E' },
                },
                children: [
                  new Paragraph({
                    alignment: align,
                    children: [
                      new TextRun({
                        text: String(hText),
                        bold: true,
                        color: 'FFFFFF',
                        size: 18,
                      }),
                    ],
                  }),
                ],
              });
            }),
          }),
        );
      }

      block.rows.forEach((rowData, rIdx) => {
        const isZebra = rIdx % 2 === 1;
        const isTotalRow = !!block.hasTotalsRow && rIdx === block.rows!.length - 1;

        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: rowData.map((cellVal, colIdx) => {
              const align =
                block.alignments?.[colIdx] === 'right'
                  ? AlignmentType.RIGHT
                  : block.alignments?.[colIdx] === 'center'
                    ? AlignmentType.CENTER
                    : AlignmentType.LEFT;
              const cellText = String(cellVal ?? '');

              return new TableCell({
                shading: { fill: isTotalRow ? 'EAEAEA' : isZebra ? 'F4F6F7' : 'FFFFFF' },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: isTotalRow ? 8 : 2,
                    color: isTotalRow ? '888888' : 'D9D9D9',
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: isTotalRow ? 10 : 2,
                    color: isTotalRow ? '444444' : 'D9D9D9',
                  },
                  left: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
                  right: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
                },
                children: [
                  new Paragraph({
                    alignment: align,
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: isTotalRow,
                        color: isTotalRow ? '000000' : '222222',
                        size: 17,
                      }),
                    ],
                  }),
                ],
              });
            }),
          }),
        );
      });

      docChildren.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );

      if (block.footerNote) {
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: block.footerNote,
                color: '666666',
                size: 15,
              }),
            ],
            spacing: { before: 80, after: 160 },
          }),
        );
      } else {
        docChildren.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            color: '222222',
            size: 20,
          },
          paragraph: {
            spacing: { line: 276, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: docTitle.toUpperCase().substring(0, 50),
                    color: '94A3B8',
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Página ', color: '94A3B8', size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: '64748B', size: 18 }),
                  new TextRun({ text: ' de ', color: '94A3B8', size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '64748B', size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return docxBuffer;
}

/**
 * 4. CONVERTIDOR WORD A PDF CON GEMINI AI
 */
export async function convertWordToPdfWithGemini(
  wordBuffer: Buffer,
  fileName = 'document.docx',
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();

  page.drawText(fileName.replace(/\.[^/.]+$/, ''), {
    x: 50,
    y: height - 50,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('Documento compilado con motor estructural Gemini AI.', {
    x: 50,
    y: height - 80,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
