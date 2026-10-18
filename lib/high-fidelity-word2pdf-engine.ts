import { PDFDocument, StandardFonts, rgb, RGB, PDFPage, PDFFont } from 'pdf-lib';
import JSZip from 'jszip';

export interface Word2PdfOptions {
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: 'normal' | 'narrow' | 'moderate' | 'wide' | 'none';
  pdfFontFamily?: 'helvetica' | 'times' | 'courier';
  pdfFontSize?: number;
  pdfLineSpacing?: number;
  addPageNumbers?: boolean;
  includeWordDocHeader?: boolean;
  watermarkText?: string;
  onProgress?: (pct: number, msg: string) => void;
}

interface ParsedRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  fontSize: number; // pt
  fontFamily: string;
  color: RGB;
  isPageBreak?: boolean;
  isTab?: boolean;
  imageRId?: string;
  imageWidthPt?: number;
  imageHeightPt?: number;
}

interface ParsedParagraph {
  type: 'paragraph';
  runs: ParsedRun[];
  alignment: 'left' | 'center' | 'right' | 'justify';
  spacingBefore: number; // pt
  spacingAfter: number; // pt
  lineSpacing: number; // multiplier, e.g. 1.15
  indentLeft: number; // pt
  isHeading: boolean;
  headingLevel?: number;
  isBullet?: boolean;
  isNumber?: boolean;
  listPrefix?: string;
}

interface ParsedTableCell {
  paragraphs: ParsedParagraph[];
  widthPt: number;
  colSpan: number;
  bgHex?: string;
  hasBorders: boolean;
  borderColorHex?: string;
}

interface ParsedTableRow {
  cells: ParsedTableCell[];
  isHeader?: boolean;
}

interface ParsedTable {
  type: 'table';
  rows: ParsedTableRow[];
  colWidthsPt: number[];
  tableWidthPt: number;
}

type BodyBlock = ParsedParagraph | ParsedTable;

interface ExtractedDocxData {
  title: string;
  blocks: BodyBlock[];
  mediaMap: Map<string, { bytes: Uint8Array; mime: string }>;
  pageWidthPt?: number;
  pageHeightPt?: number;
  marginTopPt?: number;
  marginBottomPt?: number;
  marginLeftPt?: number;
  marginRightPt?: number;
}

// Convierte dxa/twips a puntos (20 dxa = 1 pt)
function dxaToPt(dxa: number): number {
  return dxa / 20;
}

// Convierte EMU a puntos (12700 EMU = 1 pt)
function emuToPt(emu: number): number {
  return emu / 12700;
}

function parseHexColor(hex: string | null | undefined, defaultRgb: RGB = rgb(0.1, 0.1, 0.1)): RGB {
  if (!hex || hex === 'auto' || hex.length < 6) return defaultRgb;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return defaultRgb;
  return rgb(Math.min(1, Math.max(0, r)), Math.min(1, Math.max(0, g)), Math.min(1, Math.max(0, b)));
}

/**
 * Motor Enterprise de Análisis OpenXML para DOCX
 */
async function parseDocxPackage(
  fileOrBuffer: File | Blob | ArrayBuffer,
  onProgress?: (pct: number, msg: string) => void,
): Promise<ExtractedDocxData> {
  onProgress?.(15, 'Desempaquetando estructura OpenXML del documento...');
  const zip = new JSZip();
  let buffer: ArrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    buffer = fileOrBuffer;
  } else {
    buffer = await fileOrBuffer.arrayBuffer();
  }
  const loadedZip = await zip.loadAsync(buffer);

  // 1. Extraer imágenes de word/media/
  const mediaMap = new Map<string, { bytes: Uint8Array; mime: string }>();
  for (const relativePath in loadedZip.files) {
    if (relativePath.startsWith('word/media/')) {
      const fileName = relativePath.replace('word/media/', '');
      const fileData = await loadedZip.files[relativePath].async('uint8array');
      const lower = fileName.toLowerCase();
      let mime = 'image/png';
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
      else if (lower.endsWith('.gif')) mime = 'image/gif';
      else if (lower.endsWith('.webp')) mime = 'image/webp';
      mediaMap.set(fileName, { bytes: fileData, mime });
    }
  }

  // 2. Extraer relaciones word/_rels/document.xml.rels para mapear rId -> media
  const rIdMap = new Map<string, string>(); // rId -> filename in media
  const relsXmlStr = await loadedZip.file('word/_rels/document.xml.rels')?.async('text');
  if (relsXmlStr) {
    const parser = new DOMParser();
    const relsDoc = parser.parseFromString(relsXmlStr, 'text/xml');
    const relElements = Array.from(relsDoc.getElementsByTagName('Relationship'));
    for (const rel of relElements) {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target') || '';
      if (id && target.includes('media/')) {
        const fname = target.split('media/').pop();
        if (fname) rIdMap.set(id, fname);
      }
    }
  }

  // 3. Extraer estilos de word/styles.xml para herencia
  const headingStyles = new Set<string>();
  const stylesXmlStr = await loadedZip.file('word/styles.xml')?.async('text');
  if (stylesXmlStr) {
    const parser = new DOMParser();
    const stylesDoc = parser.parseFromString(stylesXmlStr, 'text/xml');
    const styleElems = Array.from(stylesDoc.getElementsByTagName('w:style'));
    for (const st of styleElems) {
      const id = st.getAttribute('w:styleId') || '';
      const nameElem = st.getElementsByTagName('w:name')[0];
      const nameVal = nameElem?.getAttribute('w:val')?.toLowerCase() || '';
      if (
        id.toLowerCase().includes('heading') ||
        id.toLowerCase().includes('titulo') ||
        nameVal.includes('heading') ||
        nameVal.includes('título') ||
        nameVal.includes('titulo')
      ) {
        headingStyles.add(id);
      }
    }
  }

  // 4. Procesar word/document.xml
  onProgress?.(25, 'Procesando árbol semántico OOXML y maquetación...');
  const docXmlStr = await loadedZip.file('word/document.xml')?.async('text');
  if (!docXmlStr) {
    throw new Error(
      'El archivo no contiene un documento Word válido (word/document.xml inexistente).',
    );
  }

  const parser = new DOMParser();
  const docXml = parser.parseFromString(docXmlStr, 'text/xml');
  const bodyElem = docXml.getElementsByTagName('w:body')[0];
  if (!bodyElem) {
    throw new Error('Estructura XML de Word inválida (cuerpo no encontrado).');
  }

  // Extraer configuración de página de w:sectPr
  let pageWidthPt: number | undefined;
  let pageHeightPt: number | undefined;
  let marginTopPt: number | undefined;
  let marginBottomPt: number | undefined;
  let marginLeftPt: number | undefined;
  let marginRightPt: number | undefined;

  const sectPr = bodyElem.getElementsByTagName('w:sectPr')[0];
  if (sectPr) {
    const pgSz = sectPr.getElementsByTagName('w:pgSz')[0];
    if (pgSz) {
      const wDxa = parseInt(pgSz.getAttribute('w:w') || '11906', 10);
      const hDxa = parseInt(pgSz.getAttribute('w:h') || '16838', 10);
      pageWidthPt = dxaToPt(wDxa);
      pageHeightPt = dxaToPt(hDxa);
    }
    const pgMar = sectPr.getElementsByTagName('w:pgMar')[0];
    if (pgMar) {
      marginTopPt = dxaToPt(parseInt(pgMar.getAttribute('w:top') || '1440', 10));
      marginBottomPt = dxaToPt(parseInt(pgMar.getAttribute('w:bottom') || '1440', 10));
      marginLeftPt = dxaToPt(parseInt(pgMar.getAttribute('w:left') || '1440', 10));
      marginRightPt = dxaToPt(parseInt(pgMar.getAttribute('w:right') || '1440', 10));
    }
  }

  const blocks: BodyBlock[] = [];

  // Función auxiliar para parsear un w:p
  function parseParagraphElement(pNode: Element): ParsedParagraph {
    const pPr = pNode.getElementsByTagName('w:pPr')[0];
    let alignment: 'left' | 'center' | 'right' | 'justify' = 'left';
    let spacingBefore = 2;
    let spacingAfter = 4;
    const lineSpacing = 1.25;
    let indentLeft = 0;
    let isHeading = false;
    let headingLevel: number | undefined;
    let isBullet = false;
    let isNumber = false;
    let listPrefix = '';

    if (pPr) {
      const jc = pPr.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
      if (jc === 'center') alignment = 'center';
      else if (jc === 'right') alignment = 'right';
      else if (jc === 'both' || jc === 'distribute') alignment = 'justify';

      const pStyle = pPr.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val');
      if (pStyle) {
        const lowerStyle = pStyle.toLowerCase();
        if (
          headingStyles.has(pStyle) ||
          lowerStyle.includes('heading') ||
          lowerStyle.includes('titulo')
        ) {
          isHeading = true;
          const match = lowerStyle.match(/\d+/);
          headingLevel = match ? parseInt(match[0], 10) : 1;
        }
        if (lowerStyle.includes('bullet') || lowerStyle.includes('viñeta')) {
          isBullet = true;
          listPrefix = '•';
        }
        if (
          lowerStyle.includes('number') ||
          lowerStyle.includes('numero') ||
          lowerStyle.includes('list')
        ) {
          isNumber = true;
        }
      }

      const numPr = pPr.getElementsByTagName('w:numPr')[0];
      if (numPr) {
        isBullet = true;
        listPrefix = '•';
      }

      const spacing = pPr.getElementsByTagName('w:spacing')[0];
      if (spacing) {
        const before = parseInt(spacing.getAttribute('w:before') || '0', 10);
        const after = parseInt(spacing.getAttribute('w:after') || '0', 10);
        if (before > 0) spacingBefore = dxaToPt(before);
        if (after > 0) spacingAfter = dxaToPt(after);
      }

      const ind = pPr.getElementsByTagName('w:ind')[0];
      if (ind) {
        const left = parseInt(ind.getAttribute('w:left') || '0', 10);
        if (left > 0) indentLeft = dxaToPt(left);
      }
    }

    const runs: ParsedRun[] = [];
    const children = Array.from(pNode.childNodes);

    for (const child of children) {
      if (child.nodeType !== 1) continue;
      const el = child as Element;
      const localName = el.localName || el.nodeName.split(':').pop();

      if (localName === 'r') {
        const rPr = el.getElementsByTagName('w:rPr')[0];
        let bold = false;
        let italic = false;
        let underline = false;
        let strike = false;
        let fontSize = isHeading ? (headingLevel === 1 ? 16 : headingLevel === 2 ? 14 : 12) : 11;
        let fontFamily = 'Helvetica';
        let color = rgb(0.12, 0.15, 0.2);

        if (rPr) {
          if (rPr.getElementsByTagName('w:b').length > 0) bold = true;
          if (rPr.getElementsByTagName('w:i').length > 0) italic = true;
          if (rPr.getElementsByTagName('w:u').length > 0) underline = true;
          if (rPr.getElementsByTagName('w:strike').length > 0) strike = true;

          const sz = rPr.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
          if (sz) {
            fontSize = parseInt(sz, 10) / 2;
          }

          const col = rPr.getElementsByTagName('w:color')[0]?.getAttribute('w:val');
          if (col) {
            color = parseHexColor(col);
          }

          const rFonts = rPr.getElementsByTagName('w:rFonts')[0];
          if (rFonts) {
            const fontName = rFonts.getAttribute('w:ascii') || rFonts.getAttribute('w:hAnsi');
            if (fontName) fontFamily = fontName;
          }
        }

        // Detectar imágenes incrustadas dentro del run
        const drawings = Array.from(el.getElementsByTagName('w:drawing'));
        for (const drw of drawings) {
          const blips = Array.from(drw.getElementsByTagName('a:blip'));
          for (const blip of blips) {
            const rId = blip.getAttribute('r:embed');
            if (rId && rIdMap.has(rId)) {
              const fileName = rIdMap.get(rId)!;
              const extent = drw.getElementsByTagName('wp:extent')[0];
              let wPt = 200;
              let hPt = 150;
              if (extent) {
                const cx = parseInt(extent.getAttribute('cx') || '0', 10);
                const cy = parseInt(extent.getAttribute('cy') || '0', 10);
                if (cx > 0) wPt = emuToPt(cx);
                if (cy > 0) hPt = emuToPt(cy);
              }
              runs.push({
                text: '',
                bold: false,
                italic: false,
                underline: false,
                strike: false,
                fontSize: 10,
                fontFamily: 'Helvetica',
                color,
                imageRId: fileName,
                imageWidthPt: wPt,
                imageHeightPt: hPt,
              });
            }
          }
        }

        // Detectar saltos de página dentro del run
        const brs = Array.from(el.getElementsByTagName('w:br'));
        for (const br of brs) {
          if (br.getAttribute('w:type') === 'page') {
            runs.push({
              text: '',
              bold: false,
              italic: false,
              underline: false,
              strike: false,
              fontSize,
              fontFamily,
              color,
              isPageBreak: true,
            });
          }
        }

        // Detectar texto
        const ts = Array.from(el.getElementsByTagName('w:t'));
        let textContent = '';
        for (const t of ts) {
          textContent += t.textContent || '';
        }
        if (textContent) {
          runs.push({
            text: textContent,
            bold,
            italic,
            underline,
            strike,
            fontSize,
            fontFamily,
            color,
          });
        }
      }
    }

    return {
      type: 'paragraph',
      runs,
      alignment,
      spacingBefore,
      spacingAfter,
      lineSpacing,
      indentLeft,
      isHeading,
      headingLevel,
      isBullet,
      isNumber,
      listPrefix,
    };
  }

  // Recorrer hijos del cuerpo (párrafos y tablas en orden de aparición)
  const bodyChildren = Array.from(bodyElem.childNodes);
  for (const child of bodyChildren) {
    if (child.nodeType !== 1) continue;
    const el = child as Element;
    const localName = el.localName || el.nodeName.split(':').pop();

    if (localName === 'p') {
      const pBlock = parseParagraphElement(el);
      // Evitar párrafos vacíos sin imágenes ni texto
      if (pBlock.runs.length > 0) {
        blocks.push(pBlock);
      }
    } else if (localName === 'tbl') {
      // Parsear Tabla OpenXML
      const colWidthsPt: number[] = [];
      const tblGrid = el.getElementsByTagName('w:tblGrid')[0];
      if (tblGrid) {
        const gridCols = Array.from(tblGrid.getElementsByTagName('w:gridCol'));
        for (const col of gridCols) {
          const wDxa = parseInt(col.getAttribute('w:w') || '1440', 10);
          colWidthsPt.push(dxaToPt(wDxa));
        }
      }

      const rows: ParsedTableRow[] = [];
      const trNodes = Array.from(el.getElementsByTagName('w:tr'));

      for (let rIdx = 0; rIdx < trNodes.length; rIdx++) {
        const tr = trNodes[rIdx];
        const isHeader = rIdx === 0;
        const cells: ParsedTableCell[] = [];
        const tcNodes = Array.from(tr.getElementsByTagName('w:tc'));

        for (let cIdx = 0; cIdx < tcNodes.length; cIdx++) {
          const tc = tcNodes[cIdx];
          const tcPr = tc.getElementsByTagName('w:tcPr')[0];
          let colSpan = 1;
          let bgHex: string | undefined = isHeader ? 'F1F5F9' : undefined;
          let cellWidthPt = colWidthsPt[cIdx] || 80;

          if (tcPr) {
            const gridSpan = tcPr.getElementsByTagName('w:gridSpan')[0];
            if (gridSpan) {
              colSpan = parseInt(gridSpan.getAttribute('w:val') || '1', 10);
            }
            const tcW = tcPr.getElementsByTagName('w:tcW')[0];
            if (tcW) {
              const wVal = parseInt(tcW.getAttribute('w:w') || '0', 10);
              if (wVal > 0) cellWidthPt = dxaToPt(wVal);
            }
            const shd = tcPr.getElementsByTagName('w:shd')[0];
            if (shd) {
              const fill = shd.getAttribute('w:fill');
              if (fill && fill !== 'auto' && fill !== '000000') {
                bgHex = fill;
              }
            }
          }

          const cellParagraphs: ParsedParagraph[] = [];
          const pInTc = Array.from(tc.getElementsByTagName('w:p'));
          for (const pNode of pInTc) {
            const parsedP = parseParagraphElement(pNode);
            if (isHeader) {
              parsedP.runs.forEach((r) => {
                r.bold = true;
                r.color = rgb(0.1, 0.2, 0.45);
              });
            }
            cellParagraphs.push(parsedP);
          }

          cells.push({
            paragraphs: cellParagraphs,
            widthPt: cellWidthPt,
            colSpan,
            bgHex,
            hasBorders: true,
            borderColorHex: 'CBD5E1',
          });
        }

        if (cells.length > 0) {
          rows.push({ cells, isHeader });
        }
      }

      const tableWidthPt = colWidthsPt.reduce((a, b) => a + b, 0);
      if (rows.length > 0) {
        blocks.push({
          type: 'table',
          rows,
          colWidthsPt,
          tableWidthPt,
        });
      }
    }
  }

  return {
    title: 'Documento Word',
    blocks,
    mediaMap,
    pageWidthPt,
    pageHeightPt,
    marginTopPt,
    marginBottomPt,
    marginLeftPt,
    marginRightPt,
  };
}

/**
 * Compilador de Grado Adobe para Word a PDF Vectorial
 */
export async function convertWordToPdfLocally(
  fileOrBuffer: File | Blob | ArrayBuffer,
  options: Word2PdfOptions = {},
): Promise<Blob> {
  const { onProgress } = options;
  onProgress?.(10, 'Iniciando compilador vectorial OpenXML a PDF...');

  const docData = await parseDocxPackage(fileOrBuffer, onProgress);
  onProgress?.(40, 'Construyendo estructura PDF con paridad geométrica...');

  const pdfDoc = await PDFDocument.create();

  // Selección de fuentes estándar de Adobe Type 1
  let fontBase = StandardFonts.Helvetica;
  let fontBoldBase = StandardFonts.HelveticaBold;
  let fontItalicBase = StandardFonts.HelveticaOblique;
  let fontBoldItalicBase = StandardFonts.HelveticaBoldOblique;

  if (options.pdfFontFamily === 'times') {
    fontBase = StandardFonts.TimesRoman;
    fontBoldBase = StandardFonts.TimesRomanBold;
    fontItalicBase = StandardFonts.TimesRomanItalic;
    fontBoldItalicBase = StandardFonts.TimesRomanBoldItalic;
  } else if (options.pdfFontFamily === 'courier') {
    fontBase = StandardFonts.Courier;
    fontBoldBase = StandardFonts.CourierBold;
    fontItalicBase = StandardFonts.CourierOblique;
    fontBoldItalicBase = StandardFonts.CourierBoldOblique;
  }

  const normalFont = await pdfDoc.embedFont(fontBase);
  const boldFont = await pdfDoc.embedFont(fontBoldBase);
  const italicFont = await pdfDoc.embedFont(fontItalicBase);
  const boldItalicFont = await pdfDoc.embedFont(fontBoldItalicBase);

  // Dimensiones de página
  let defaultWidth = docData.pageWidthPt || 595.28; // A4
  let defaultHeight = docData.pageHeightPt || 841.89;

  if (options.pageSize === 'letter') {
    defaultWidth = 612.0;
    defaultHeight = 792.0;
  } else if (options.pageSize === 'legal') {
    defaultWidth = 612.0;
    defaultHeight = 1008.0;
  } else if (options.pageSize === 'a4') {
    defaultWidth = 595.28;
    defaultHeight = 841.89;
  }

  if (options.orientation === 'landscape') {
    const w = Math.max(defaultWidth, defaultHeight);
    const h = Math.min(defaultWidth, defaultHeight);
    defaultWidth = w;
    defaultHeight = h;
  } else if (options.orientation === 'portrait') {
    const w = Math.min(defaultWidth, defaultHeight);
    const h = Math.max(defaultWidth, defaultHeight);
    defaultWidth = w;
    defaultHeight = h;
  }

  // Márgenes
  let marginL = docData.marginLeftPt || 50;
  let marginR = docData.marginRightPt || 50;
  let marginT = docData.marginTopPt || 50;
  let marginB = docData.marginBottomPt || 50;

  if (options.margin === 'narrow') {
    marginL = marginR = marginT = marginB = 28.35; // 1 cm
  } else if (options.margin === 'wide') {
    marginL = marginR = 90;
    marginT = marginB = 60;
  } else if (options.margin === 'moderate') {
    marginL = marginR = 54;
    marginT = marginB = 54;
  } else if (options.margin === 'none') {
    marginL = marginR = marginT = marginB = 15;
  }

  const usableWidth = defaultWidth - marginL - marginR;

  // Pre-embebido de imágenes extraídas
  const embeddedImagesMap = new Map<string, any>();
  for (const [name, media] of docData.mediaMap.entries()) {
    try {
      if (media.mime === 'image/png') {
        const img = await pdfDoc.embedPng(media.bytes);
        embeddedImagesMap.set(name, img);
      } else if (media.mime === 'image/jpeg') {
        const img = await pdfDoc.embedJpg(media.bytes);
        embeddedImagesMap.set(name, img);
      }
    } catch {
      // Ignorar imágenes corruptas o de formato no compatible
    }
  }

  // Pipeline de maquetación y paginado
  const pages: PDFPage[] = [];
  let currentPage = pdfDoc.addPage([defaultWidth, defaultHeight]);
  pages.push(currentPage);
  let currentY = defaultHeight - marginT;

  const addNewPage = (): PDFPage => {
    currentPage = pdfDoc.addPage([defaultWidth, defaultHeight]);
    pages.push(currentPage);
    currentY = defaultHeight - marginT;
    return currentPage;
  };

  const getFontForRun = (run: ParsedRun): PDFFont => {
    if (run.bold && run.italic) return boldItalicFont;
    if (run.bold) return boldFont;
    if (run.italic) return italicFont;
    return normalFont;
  };

  onProgress?.(60, 'Renderizando vectores, tipografías y tablas corporativas...');

  // Dibujar bloques del documento
  for (let bIdx = 0; bIdx < docData.blocks.length; bIdx++) {
    const block = docData.blocks[bIdx];

    if (block.type === 'paragraph') {
      currentY -= block.spacingBefore;

      for (const run of block.runs) {
        if (run.isPageBreak) {
          addNewPage();
          continue;
        }

        if (run.imageRId && embeddedImagesMap.has(run.imageRId)) {
          const img = embeddedImagesMap.get(run.imageRId);
          let imgW = run.imageWidthPt || 200;
          let imgH = run.imageHeightPt || 150;
          if (imgW > usableWidth) {
            const ratio = usableWidth / imgW;
            imgW = usableWidth;
            imgH = imgH * ratio;
          }

          if (currentY - imgH < marginB) {
            addNewPage();
          }

          let imgX = marginL + block.indentLeft;
          if (block.alignment === 'center') {
            imgX = marginL + (usableWidth - imgW) / 2;
          } else if (block.alignment === 'right') {
            imgX = marginL + usableWidth - imgW;
          }

          currentPage.drawImage(img, {
            x: imgX,
            y: currentY - imgH,
            width: imgW,
            height: imgH,
          });
          currentY -= imgH + 8;
          continue;
        }

        const runText = run.text;
        if (!runText) continue;

        const font = getFontForRun(run);
        const fontSize = run.fontSize;
        const lineHeight = fontSize * (options.pdfLineSpacing || block.lineSpacing || 1.25);

        // Word Wrapping inteligente de alta precisión
        const words = runText.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
          const testW = font.widthOfTextAtSize(testLine, fontSize);

          if (testW > usableWidth - block.indentLeft && currentLine) {
            // Imprimir línea actual
            if (currentY - lineHeight < marginB) {
              addNewPage();
            }

            let lineX = marginL + block.indentLeft;
            const curW = font.widthOfTextAtSize(currentLine, fontSize);
            if (block.alignment === 'center') {
              lineX = marginL + (usableWidth - curW) / 2;
            } else if (block.alignment === 'right') {
              lineX = marginL + usableWidth - curW;
            }

            currentPage.drawText(currentLine, {
              x: lineX,
              y: currentY - fontSize,
              size: fontSize,
              font,
              color: run.color,
            });

            if (run.underline) {
              currentPage.drawLine({
                start: { x: lineX, y: currentY - fontSize - 2 },
                end: { x: lineX + curW, y: currentY - fontSize - 2 },
                thickness: 0.8,
                color: run.color,
              });
            }

            currentY -= lineHeight;
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          if (currentY - lineHeight < marginB) {
            addNewPage();
          }

          let lineX = marginL + block.indentLeft;
          const curW = font.widthOfTextAtSize(currentLine, fontSize);
          if (block.alignment === 'center') {
            lineX = marginL + (usableWidth - curW) / 2;
          } else if (block.alignment === 'right') {
            lineX = marginL + usableWidth - curW;
          }

          currentPage.drawText(currentLine, {
            x: lineX,
            y: currentY - fontSize,
            size: fontSize,
            font,
            color: run.color,
          });

          if (run.underline) {
            currentPage.drawLine({
              start: { x: lineX, y: currentY - fontSize - 2 },
              end: { x: lineX + curW, y: currentY - fontSize - 2 },
              thickness: 0.8,
              color: run.color,
            });
          }

          currentY -= lineHeight;
        }
      }

      currentY -= block.spacingAfter;
    } else if (block.type === 'table') {
      // RENDERIZADO VECTORIAL DE TABLAS DE NIVEL ADOBE
      currentY -= 8;
      let scaleRatio = 1.0;
      const totalRawW = block.colWidthsPt.reduce((a, b) => a + b, 0);
      if (totalRawW > usableWidth && totalRawW > 0) {
        scaleRatio = usableWidth / totalRawW;
      }
      const adjustedColWidths = block.colWidthsPt.map((w) => w * scaleRatio);

      for (const row of block.rows) {
        // Calcular altura dinámica de la fila midiendo el contenido de cada celda
        let maxRowH = 22;
        const cellWrappedTexts: {
          lines: string[];
          font: PDFFont;
          fontSize: number;
          color: RGB;
        }[][] = [];

        for (let cIdx = 0; cIdx < row.cells.length; cIdx++) {
          const cell = row.cells[cIdx];
          const cellW = (adjustedColWidths[cIdx] || 80) * (cell.colSpan || 1);
          const cellLines: { lines: string[]; font: PDFFont; fontSize: number; color: RGB }[] = [];
          let cellHeightAcc = 8; // padding top/bottom

          for (const p of cell.paragraphs) {
            for (const r of p.runs) {
              if (!r.text) continue;
              const f = getFontForRun(r);
              const fSz = Math.max(7.5, r.fontSize - 1);
              const lH = fSz * 1.25;

              const words = r.text.split(' ');
              let curL = '';
              const rLines: string[] = [];

              for (const w of words) {
                const tL = curL ? `${curL} ${w}` : w;
                if (f.widthOfTextAtSize(tL, fSz) > cellW - 10 && curL) {
                  rLines.push(curL);
                  curL = w;
                } else {
                  curL = tL;
                }
              }
              if (curL) rLines.push(curL);

              cellHeightAcc += rLines.length * lH + 2;
              cellLines.push({ lines: rLines, font: f, fontSize: fSz, color: r.color });
            }
          }

          maxRowH = Math.max(maxRowH, cellHeightAcc);
          cellWrappedTexts.push(cellLines);
        }

        // Salto de página para fila completa si excede el margen inferior (cantSplit)
        if (currentY - maxRowH < marginB) {
          addNewPage();
        }

        // Dibujar celdas y bordes de la fila
        let cellX = marginL;
        for (let cIdx = 0; cIdx < row.cells.length; cIdx++) {
          const cell = row.cells[cIdx];
          const cellW = (adjustedColWidths[cIdx] || 80) * (cell.colSpan || 1);

          // Fondo / Sombreado de celda
          if (cell.bgHex) {
            currentPage.drawRectangle({
              x: cellX,
              y: currentY - maxRowH,
              width: cellW,
              height: maxRowH,
              color: parseHexColor(cell.bgHex),
            });
          }

          // Bordes sutiles corporativos
          currentPage.drawRectangle({
            x: cellX,
            y: currentY - maxRowH,
            width: cellW,
            height: maxRowH,
            borderWidth: 0.6,
            borderColor: rgb(0.8, 0.84, 0.88),
            opacity: 1,
          });

          // Dibujar texto dentro de la celda con padding
          let textY = currentY - 7;
          const textRuns = cellWrappedTexts[cIdx] || [];

          for (const tr of textRuns) {
            const lH = tr.fontSize * 1.25;
            for (const line of tr.lines) {
              if (textY - tr.fontSize > currentY - maxRowH) {
                currentPage.drawText(line, {
                  x: cellX + 5,
                  y: textY - tr.fontSize,
                  size: tr.fontSize,
                  font: tr.font,
                  color: tr.color,
                });
                textY -= lH;
              }
            }
          }

          cellX += cellW;
        }

        currentY -= maxRowH;
      }
      currentY -= 8;
    }
  }

  // Marca de agua y numeración de páginas final
  const totalP = pages.length;
  for (let i = 0; i < totalP; i++) {
    const p = pages[i];
    const { width: pW, height: pH } = p.getSize();

    if (options.watermarkText?.trim()) {
      p.drawText(options.watermarkText.toUpperCase(), {
        x: pW * 0.2,
        y: pH * 0.45,
        size: 42,
        font: boldFont,
        color: rgb(0.85, 0.2, 0.2),
        opacity: 0.15,
        rotate: { type: 'degrees' as any, angle: 35 } as any,
      });
    }

    if (options.addPageNumbers !== false) {
      const pageStr = `${i + 1} / ${totalP}`;
      const numW = normalFont.widthOfTextAtSize(pageStr, 8.5);
      p.drawText(pageStr, {
        x: pW - marginR - numW,
        y: marginB * 0.5,
        size: 8.5,
        font: normalFont,
        color: rgb(0.5, 0.55, 0.65),
      });
    }
  }

  onProgress?.(95, 'Generando archivo PDF vectorial final...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}
