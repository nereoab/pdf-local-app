import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  Footer,
  PageNumber,
} from 'docx';

export interface OcrPageText {
  pageNum: number;
  text: string;
}

export interface OcrDocxOptions {
  title?: string;
  author?: string;
  subject?: string;
  engineName?: string;
  includePageBreaks?: boolean;
}

/**
 * Parsea el texto acumulado del OCR (con separadores '--- PÁGINA X ---')
 * o recibe un array de páginas y genera un documento Microsoft Word (.docx)
 * con tipografía profesional, paridad de páginas y formateo estructurado.
 */
export async function createDocxFromOcrText(
  input: string | OcrPageText[],
  options: OcrDocxOptions = {},
): Promise<Blob> {
  const {
    title = 'Documento OCR',
    author = 'PDFBlack',
    subject = 'Reconocimiento Óptico de Caracteres (OCR)',
    engineName = 'PDFBlack OCR Engine',
    includePageBreaks = true,
  } = options;

  let pages: OcrPageText[] = [];

  if (typeof input === 'string') {
    // Parsear separadores "--- PÁGINA X ---"
    const pageRegex = /---\s*(?:PÁGINA|PAGINA|PAGE)\s*(\d+)\s*---/gi;
    const matches = Array.from(input.matchAll(pageRegex));

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const pageNum = parseInt(match[1], 10) || i + 1;
        const startIdx = match.index! + match[0].length;
        const endIdx = i < matches.length - 1 ? matches[i + 1].index! : input.length;
        const pageText = input.slice(startIdx, endIdx).trim();
        pages.push({ pageNum, text: pageText });
      }
    } else {
      // Documento de una sola página o sin separadores explícitos
      pages.push({ pageNum: 1, text: input.trim() });
    }
  } else {
    pages = input;
  }

  const documentChildren: Paragraph[] = [];

  pages.forEach((page, pageIdx) => {
    // Si no es la primera página y está habilitado el salto de página, insertar PageBreak
    if (pageIdx > 0 && includePageBreaks) {
      documentChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
      );
    }

    // Dividir el texto de la página en párrafos
    const lines = page.text.split('\n');
    let currentParagraphLines: string[] = [];

    const flushCurrentParagraph = () => {
      if (currentParagraphLines.length === 0) return;
      const paragraphText = currentParagraphLines.join(' ').replace(/\s+/g, ' ').trim();
      if (!paragraphText) {
        currentParagraphLines = [];
        return;
      }

      // Heurística de encabezado (título en mayúsculas corto o enumerado)
      const isHeading =
        paragraphText.length < 80 &&
        (paragraphText === paragraphText.toUpperCase() ||
          /^(?:artículo|articulo|cláusula|clausula|capítulo|capitulo|sección|seccion|\d+\.)\s+/i.test(
            paragraphText,
          ));

      if (isHeading) {
        documentChildren.push(
          new Paragraph({
            spacing: { before: 240, after: 120, line: 276 },
            children: [
              new TextRun({
                text: paragraphText,
                bold: true,
                size: 24, // 12pt
                color: '111827',
                font: 'Segoe UI',
              }),
            ],
          }),
        );
      } else {
        documentChildren.push(
          new Paragraph({
            spacing: { before: 0, after: 140, line: 276 },
            children: [
              new TextRun({
                text: paragraphText,
                size: 22, // 11pt
                color: '1F2937',
                font: 'Segoe UI',
              }),
            ],
          }),
        );
      }

      currentParagraphLines = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushCurrentParagraph();
      } else {
        currentParagraphLines.push(line);
      }
    }
    flushCurrentParagraph();
  });

  // Si no se extrajo texto o quedó vacío
  if (documentChildren.length === 0) {
    documentChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'No se detectó texto en el documento.',
            italics: true,
            size: 22,
            font: 'Segoe UI',
            color: '6B7280',
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    creator: author,
    title,
    description: `${subject} — ${engineName}`,
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 22,
            color: '1F2937',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 pulgada (72pt * 20)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: 'Página ',
                    size: 18,
                    font: 'Segoe UI',
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: 'Segoe UI',
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 18,
                    font: 'Segoe UI',
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    font: 'Segoe UI',
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    text: ' • PDFBlack OCR',
                    size: 18,
                    font: 'Segoe UI',
                    color: '9CA3AF',
                  }),
                ],
              }),
            ],
          }),
        },
        children: documentChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
