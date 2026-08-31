import { PDFDocument, PDFName, PDFDict, PDFRef, PDFRawStream } from 'pdf-lib';
import JSZip from 'jszip';

export interface DocxConversionOptions {
  layoutMode: 'exact' | 'flowing';
  includeImages: boolean;
  detectTables: boolean;
  primaryFont?: string;
  targetPages?: number[];
  onProgress?: (pct: number, msg: string) => void;
}

export interface ExtractedImageItem {
  id: string;
  rId: string;
  filename: string;
  bytes: Uint8Array;
  mime: string;
  x: number; // pt
  y: number; // pt
  width: number; // pt
  height: number; // pt
}

export interface ExtractedTextItem {
  text: string;
  x: number; // pt
  y: number; // pt
  width: number; // pt
  height: number; // pt
  fontSize: number; // pt
  fontFamily: string;
  color: string; // hex RRGGBB
  isBold: boolean;
  isItalic: boolean;
  linkUrl?: string;
}

export interface ExtractedPageContent {
  pageNum: number;
  widthPt: number;
  heightPt: number;
  texts: ExtractedTextItem[];
  images: ExtractedImageItem[];
}

/**
 * Escapes XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uD800-\uDFFF\uFFFE\uFFFF]/g, '');
}

/**
 * Converts points to EMUs (1 pt = 12700 EMUs)
 */
function ptToEmu(pt: number): number {
  return Math.round(pt * 12700);
}

/**
 * Converts points to DXA / twips (1 pt = 20 dxa)
 */
function ptToDxa(pt: number): number {
  return Math.round(pt * 20);
}

/**
 * Cleans font names to standard readable font families
 */
function normalizeFontName(pdfFont: string): string {
  if (!pdfFont) return 'Calibri';
  const lower = pdfFont.toLowerCase();
  if (lower.includes('impact')) return 'Impact';
  if (lower.includes('times')) return 'Times New Roman';
  if (lower.includes('arial') || lower.includes('helvetica')) return 'Arial';
  if (lower.includes('courier')) return 'Courier New';
  if (lower.includes('georgia')) return 'Georgia';
  if (lower.includes('verdana')) return 'Verdana';
  if (lower.includes('tahoma')) return 'Tahoma';
  if (lower.includes('trebuchet')) return 'Trebuchet MS';
  if (lower.includes('roboto')) return 'Roboto';
  if (lower.includes('montserrat')) return 'Montserrat';
  if (lower.includes('poppins')) return 'Poppins';
  if (lower.includes('lato')) return 'Lato';
  if (lower.includes('aptos')) return 'Aptos';
  return 'Calibri';
}

async function decompressFlateBytes(bytes: Uint8Array): Promise<string> {
  try {
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(bytes);
        c.close();
      },
    }).pipeThrough(new DecompressionStream('deflate'));
    return await new Response(stream).text();
  } catch {
    try {
      const streamRaw = new ReadableStream({
        start(c) {
          c.enqueue(bytes);
          c.close();
        },
      }).pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(streamRaw).text();
    } catch {
      return new TextDecoder('latin1').decode(bytes);
    }
  }
}

function parseColorsFromDecodedStream(
  streamText: string,
): Array<{ fontSize: number; color: string }> {
  const tokens = streamText.split(/\s+/).filter(Boolean);
  const colorMap: Array<{ fontSize: number; color: string }> = [];
  let currentColor = '000000';

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'rg' || t === 'RG') {
      const r = parseFloat(tokens[i - 3]) || 0;
      const g = parseFloat(tokens[i - 2]) || 0;
      const b = parseFloat(tokens[i - 1]) || 0;
      currentColor = [r, g, b]
        .map((x) =>
          Math.min(255, Math.max(0, Math.round(x > 1 ? x : x * 255)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
        .toUpperCase();
    } else if (t === 'scn' || t === 'sc' || t === 'SCN' || t === 'SC') {
      if (i >= 4 && !isNaN(parseFloat(tokens[i - 4]))) {
        const c = parseFloat(tokens[i - 4]) || 0;
        const m = parseFloat(tokens[i - 3]) || 0;
        const y = parseFloat(tokens[i - 2]) || 0;
        const k = parseFloat(tokens[i - 1]) || 0;
        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - m) * (1 - k));
        const b = Math.round(255 * (1 - y) * (1 - k));
        currentColor = [r, g, b]
          .map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
      } else if (i >= 3 && !isNaN(parseFloat(tokens[i - 3]))) {
        const r = parseFloat(tokens[i - 3]) || 0;
        const g = parseFloat(tokens[i - 2]) || 0;
        const b = parseFloat(tokens[i - 1]) || 0;
        currentColor = [r, g, b]
          .map((x) =>
            Math.min(255, Math.max(0, Math.round(x > 1 ? x : x * 255)))
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')
          .toUpperCase();
      } else if (i >= 1 && !isNaN(parseFloat(tokens[i - 1]))) {
        const g = parseFloat(tokens[i - 1]) || 0;
        const v = Math.min(255, Math.max(0, Math.round(g > 1 ? g : g * 255)))
          .toString(16)
          .padStart(2, '0');
        currentColor = (v + v + v).toUpperCase();
      }
    } else if (t === 'g' || t === 'G') {
      const g = parseFloat(tokens[i - 1]) || 0;
      const v = Math.min(255, Math.max(0, Math.round(g > 1 ? g : g * 255)))
        .toString(16)
        .padStart(2, '0');
      currentColor = (v + v + v).toUpperCase();
    } else if (t === 'Tf') {
      const fs = parseFloat(tokens[i - 1]) || 12;
      colorMap.push({ fontSize: fs, color: currentColor });
    }
  }
  return colorMap;
}

/**
 * Engine Ultra HD de Conversión de PDF a Word (.docx)
 * Produce resultados con fidelidad milimétrica visual idéntica o superior a iLovePDF
 */
export async function convertPdfToUltraDocx(
  file: File,
  options: DocxConversionOptions,
): Promise<Blob> {
  const { onProgress } = options;
  onProgress?.(5, 'Iniciando motor de precisión OpenXML...');

  const arrayBuffer = await file.arrayBuffer();

  // 1. Cargar con PDF.js para renderizado de texto, coordenadas y fuentes
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdfDoc = await pdfjsLib.getDocument({
    data: arrayBuffer.slice(0),
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  }).promise;

  // 2. Cargar con pdf-lib para extracción de recursos e imágenes nativas
  let pdfLibDoc: PDFDocument | null = null;
  try {
    pdfLibDoc = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
  } catch (e) {
    console.warn('PDF-Lib load fallback:', e);
  }

  const numPages = pdfDoc.numPages;
  const targetPages =
    options.targetPages && options.targetPages.length > 0
      ? options.targetPages
      : Array.from({ length: numPages }, (_, i) => i + 1);

  const totalPagesToProcess = targetPages.length;
  const extractedPages: ExtractedPageContent[] = [];
  const allMediaMap = new Map<string, { bytes: Uint8Array; extension: string; mime: string }>();
  let imageCounter = 1;
  let relsCounter = 8; // Start after default rels

  // 3. Procesar cada página
  for (let idx = 0; idx < totalPagesToProcess; idx++) {
    const pageNum = targetPages[idx];
    const pct = 10 + Math.round(((idx + 1) / totalPagesToProcess) * 70);
    onProgress?.(
      pct,
      `Extrayendo tipografía, capas y elementos de página ${idx + 1} de ${totalPagesToProcess}...`,
    );

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const widthPt = viewport.width;
    const heightPt = viewport.height;

    // A. Extraer hipervínculos de la página
    const annotations = await page.getAnnotations();
    const linkRects: Array<{ rect: number[]; url: string }> = [];
    annotations.forEach((ann: any) => {
      if (ann.subtype === 'Link' && ann.url && ann.rect) {
        linkRects.push({
          rect: ann.rect, // [x1, y1, x2, y2] in PDF coordinates
          url: ann.url,
        });
      }
    });

    // B0. Extraer colores del content stream si están disponibles
    const streamColors: Array<{ fontSize: number; color: string }> = [];
    if (pdfLibDoc && pdfLibDoc.getPageCount() >= pageNum) {
      try {
        const libPage = pdfLibDoc.getPages()[pageNum - 1];
        const contents = libPage.node.lookup(PDFName.of('Contents'));
        const streams = Array.isArray(contents) ? contents : [contents];
        for (let c of streams) {
          if (c instanceof PDFRef) c = pdfLibDoc.context.lookup(c);
          if (c instanceof PDFRawStream) {
            const rawBytes = c.getContents();
            const decodedText = await decompressFlateBytes(rawBytes);
            if (decodedText) {
              const colors = parseColorsFromDecodedStream(decodedText);
              if (colors.length > 0) {
                streamColors.push(...colors);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error leyendo stream de colores en página ${pageNum}:`, err);
      }
    }

    // B. Extraer texto con coordenadas exactas
    const textContent = await page.getTextContent();
    const rawItems = textContent.items as Array<{
      str?: string;
      transform?: number[];
      width?: number;
      height?: number;
      fontName?: string;
      hasEOL?: boolean;
    }>;

    const pageTexts: ExtractedTextItem[] = [];

    const lineMap = new Map<number, typeof rawItems>();

    for (const item of rawItems) {
      if (!item.str || !item.transform) continue;
      const text = item.str;
      if (!text.trim()) continue;

      // Coordenadas transform: [scaleX, skewY, skewX, scaleY, transX, transY]
      const ty = item.transform[5];
      const fontSize = Math.max(
        7,
        Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 11,
      );

      // Convertir coordenada Y de PDF (bottom-up) a Word (top-down)
      const topY = heightPt - ty - fontSize;
      const roundedY = Math.round(topY / 3) * 3;

      if (!lineMap.has(roundedY)) {
        lineMap.set(roundedY, []);
      }
      lineMap.get(roundedY)!.push(item);
    }

    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => a - b);

    for (const y of sortedYs) {
      const itemsInLine = (lineMap.get(y) || []).sort(
        (a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0),
      );

      let currentBlockText = '';
      let blockX = itemsInLine[0]?.transform?.[4] || 0;
      const blockY = y;
      let blockFontSize = Math.max(7, Math.abs(itemsInLine[0]?.transform?.[0] || 11));
      let blockFontName = itemsInLine[0]?.fontName || '';
      let blockWidth = 0;

      for (let i = 0; i < itemsInLine.length; i++) {
        const item = itemsInLine[i];
        const itemX = item.transform?.[4] || 0;
        const itemW = item.width || (item.str?.length || 1) * blockFontSize * 0.55;
        const itemFontSize = Math.max(7, Math.abs(item.transform?.[0] || 11));

        // Si hay salto grande horizontal o cambio brusco de tamaño, guardar bloque anterior
        if (
          currentBlockText &&
          (itemX - (blockX + blockWidth) > 15 || Math.abs(itemFontSize - blockFontSize) > 2.5)
        ) {
          const fontLower = blockFontName.toLowerCase();
          const isBold =
            fontLower.includes('bold') ||
            fontLower.includes('black') ||
            fontLower.includes('heavy') ||
            blockFontSize >= 15;
          const isItalic = fontLower.includes('italic') || fontLower.includes('oblique');

          // Comprobar link
          let matchedLink: string | undefined;
          const pdfY = heightPt - blockY;
          for (const l of linkRects) {
            if (
              blockX >= l.rect[0] - 10 &&
              blockX <= l.rect[2] + 10 &&
              pdfY >= l.rect[1] - 10 &&
              pdfY <= l.rect[3] + 10
            ) {
              matchedLink = l.url;
              break;
            }
          }

          let matchedColor = '000000';
          if (streamColors.length > 0) {
            const match = streamColors.find((c) => Math.abs(c.fontSize - blockFontSize) < 1.0);
            if (match) matchedColor = match.color;
          }

          pageTexts.push({
            text: currentBlockText.trim(),
            x: Math.max(0, blockX),
            y: Math.max(0, blockY),
            width: Math.max(20, blockWidth + 10),
            height: Math.max(blockFontSize * 1.3, 14),
            fontSize: blockFontSize,
            fontFamily: normalizeFontName(blockFontName),
            color: matchedColor,
            isBold,
            isItalic,
            linkUrl: matchedLink,
          });

          currentBlockText = item.str || '';
          blockX = itemX;
          blockFontSize = itemFontSize;
          blockFontName = item.fontName || '';
          blockWidth = itemW;
        } else {
          currentBlockText +=
            (currentBlockText && !currentBlockText.endsWith(' ') ? ' ' : '') + (item.str || '');
          blockWidth = itemX + itemW - blockX;
        }
      }

      if (currentBlockText.trim()) {
        const fontLower = blockFontName.toLowerCase();
        const isBold =
          fontLower.includes('bold') ||
          fontLower.includes('black') ||
          fontLower.includes('heavy') ||
          blockFontSize >= 15;
        const isItalic = fontLower.includes('italic') || fontLower.includes('oblique');

        let matchedLink: string | undefined;
        const pdfY = heightPt - blockY;
        for (const l of linkRects) {
          if (
            blockX >= l.rect[0] - 10 &&
            blockX <= l.rect[2] + 10 &&
            pdfY >= l.rect[1] - 10 &&
            pdfY <= l.rect[3] + 10
          ) {
            matchedLink = l.url;
            break;
          }
        }

        let matchedColor = '000000';
        if (streamColors.length > 0) {
          const match = streamColors.find((c) => Math.abs(c.fontSize - blockFontSize) < 1.0);
          if (match) matchedColor = match.color;
        }

        pageTexts.push({
          text: currentBlockText.trim(),
          x: Math.max(0, blockX),
          y: Math.max(0, blockY),
          width: Math.max(20, blockWidth + 10),
          height: Math.max(blockFontSize * 1.3, 14),
          fontSize: blockFontSize,
          fontFamily: normalizeFontName(blockFontName),
          color: matchedColor,
          isBold,
          isItalic,
          linkUrl: matchedLink,
        });
      }
    }

    // C. Extraer imágenes nativas y capa gráfica de fondo en Modo Exacto
    const pageImages: ExtractedImageItem[] = [];

    if (options.includeImages) {
      if (options.layoutMode === 'exact') {
        // EN MODO EXACTO: Renderizar capa base gráfica HD (fondos, vectores, iconos y marcas)
        try {
          const vp = page.getViewport({ scale: 1.8 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(vp.width);
          canvas.height = Math.ceil(vp.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvasContext: ctx,
              viewport: vp,
            } as unknown as Parameters<typeof page.render>[0]).promise;

            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, 'image/jpeg', 0.88),
            );
            if (blob) {
              const imgBytes = new Uint8Array(await blob.arrayBuffer());
              const imgName = `bg_page_${pageNum}.jpeg`;
              const rId = `rId${relsCounter++}`;
              allMediaMap.set(imgName, {
                bytes: imgBytes,
                extension: 'jpeg',
                mime: 'image/jpeg',
              });

              pageImages.push({
                id: imgName,
                rId,
                filename: imgName,
                bytes: imgBytes,
                mime: 'image/jpeg',
                x: 0,
                y: 0,
                width: widthPt,
                height: heightPt,
              });
            }
          }
        } catch (canvasErr) {
          console.warn(`Error renderizando fondo HD en página ${pageNum}:`, canvasErr);
        }
      } else {
        // EN MODO FLUIDO: Extraer imágenes individuales XObject
        if (pdfLibDoc && pdfLibDoc.getPageCount() >= pageNum) {
          try {
            const libPage = pdfLibDoc.getPages()[pageNum - 1];
            let res = libPage.node.lookup(PDFName.of('Resources'));
            if (res instanceof PDFRef) res = pdfLibDoc.context.lookup(res);
            if (!res) {
              let parent = libPage.node.lookup(PDFName.of('Parent'));
              while (parent instanceof PDFDict) {
                res = parent.lookup(PDFName.of('Resources'));
                if (res) break;
                parent = parent.lookup(PDFName.of('Parent'));
              }
              if (res instanceof PDFRef) res = pdfLibDoc.context.lookup(res);
            }

            if (res instanceof PDFDict) {
              let xobj = res.lookup(PDFName.of('XObject'));
              if (xobj instanceof PDFRef) xobj = pdfLibDoc.context.lookup(xobj);

              if (xobj instanceof PDFDict) {
                for (const k of xobj.keys()) {
                  let obj = xobj.lookup(k);
                  if (obj instanceof PDFRef) obj = pdfLibDoc.context.lookup(obj);
                  if (obj instanceof PDFRawStream) {
                    const subtype = obj.dict.get(PDFName.of('Subtype'))?.toString();
                    const filter = obj.dict.get(PDFName.of('Filter'))?.toString() || '';
                    const w = Number(obj.dict.get(PDFName.of('Width'))?.toString()) || 400;
                    const h = Number(obj.dict.get(PDFName.of('Height'))?.toString()) || 300;

                    if (
                      subtype === '/Image' &&
                      (filter.includes('DCTDecode') || filter.includes('/DCT'))
                    ) {
                      const imgBytes = obj.getContents();
                      if (imgBytes && imgBytes.length > 300) {
                        const imgName = `image${imageCounter++}.jpeg`;
                        const rId = `rId${relsCounter++}`;
                        allMediaMap.set(imgName, {
                          bytes: imgBytes,
                          extension: 'jpeg',
                          mime: 'image/jpeg',
                        });

                        const targetW = Math.min(widthPt * 0.95, Math.max(80, Math.round(w * 0.5)));
                        const targetH = Math.round((h / w) * targetW) || 150;

                        pageImages.push({
                          id: imgName,
                          rId,
                          filename: imgName,
                          bytes: imgBytes,
                          mime: 'image/jpeg',
                          x: Math.round((widthPt - targetW) / 2),
                          y: Math.min(heightPt - targetH - 20, 40),
                          width: targetW,
                          height: targetH,
                        });
                      }
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`Error extrayendo imágenes XObject en página ${pageNum}:`, err);
          }
        }
      }
    }

    extractedPages.push({
      pageNum,
      widthPt,
      heightPt,
      texts: pageTexts,
      images: pageImages,
    });
  }

  onProgress?.(85, 'Compilando paquete Office OpenXML (.docx)...');

  // 4. Generar el XML de WordProcessingML nativo de alta fidelidad
  const zip = new JSZip();

  // A. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // B. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  zip.file('_rels/.rels', rootRelsXml);

  // C. docProps/core.xml & app.xml
  const docTitle = escapeXml(file.name.replace(/\.[^/.]+$/, ''));
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${docTitle}</dc:title>
  <dc:creator>PDFBlack Suite Ultra</dc:creator>
  <cp:lastModifiedBy>PDFBlack</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;
  zip.file('docProps/core.xml', coreXml);

  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>PDFBlack Ultra Engine</Application>
  <TotalTime>0</TotalTime>
  <Pages>${extractedPages.length}</Pages>
</Properties>`;
  zip.file('docProps/app.xml', appXml);

  // D. word/styles.xml, fontTable.xml, settings.xml
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="es-ES"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`;
  zip.file('word/styles.xml', stylesXml);

  const fontTableXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:font w:name="Calibri"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Arial"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Times New Roman"><w:pitch w:val="variable"/></w:font>
  <w:font w:name="Impact"><w:pitch w:val="variable"/></w:font>
</w:fonts>`;
  zip.file('word/fontTable.xml', fontTableXml);

  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
</w:settings>`;
  zip.file('word/settings.xml', settingsXml);

  // E. Guardar archivos de media en word/media/
  for (const [name, media] of allMediaMap.entries()) {
    zip.file(`word/media/${name}`, media.bytes);
  }

  // F. Construir word/_rels/document.xml.rels
  let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>`;

  let hyperlinkCounter = 1000;
  const hyperlinkMap = new Map<string, string>(); // url -> rId

  extractedPages.forEach((page) => {
    page.images.forEach((img) => {
      docRelsXml += `\n  <Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${img.filename}"/>`;
    });
    page.texts.forEach((txt) => {
      if (txt.linkUrl && !hyperlinkMap.has(txt.linkUrl)) {
        const rId = `rIdLink${hyperlinkCounter++}`;
        hyperlinkMap.set(txt.linkUrl, rId);
        docRelsXml += `\n  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(txt.linkUrl)}" TargetMode="External"/>`;
      }
    });
  });

  docRelsXml += '\n</Relationships>';
  zip.file('word/_rels/document.xml.rels', docRelsXml);

  // G. Construir word/document.xml con posicionamiento visual exacto o fluido
  let docBodyXml = '';
  let drawingId = 1;

  extractedPages.forEach((page, pIdx) => {
    const pageWidthDxa = ptToDxa(page.widthPt);
    const pageHeightDxa = ptToDxa(page.heightPt);

    if (options.layoutMode === 'exact') {
      // ─── MODO EXACTO: CAPAS Y COORDENADAS PRECISAS (ESTILO ILOVEPDF) ───
      // 1. Dibujar imágenes de fondo o elementos gráficos
      page.images.forEach((img) => {
        const posXEmu = ptToEmu(img.x);
        const posYEmu = ptToEmu(img.y);
        const widthEmu = ptToEmu(img.width);
        const heightEmu = ptToEmu(img.height);
        const dId = drawingId++;

        docBodyXml += `
<w:p>
  <w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">
        <wp:simplePos x="0" y="0"/>
        <wp:positionH relativeFrom="page"><wp:posOffset>${posXEmu}</wp:posOffset></wp:positionH>
        <wp:positionV relativeFrom="page"><wp:posOffset>${posYEmu}</wp:posOffset></wp:positionV>
        <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:wrapNone/>
        <wp:docPr id="${dId}" name="Image ${dId}"/>
        <wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${dId}" name="Image ${dId}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="${img.rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:anchor>
    </w:drawing>
  </w:r>
</w:p>`;
      });

      // 2. Dibujar cajas de texto con coordenadas exactas
      page.texts.forEach((txt) => {
        const posXEmu = ptToEmu(txt.x);
        const posYEmu = ptToEmu(txt.y);
        const widthEmu = ptToEmu(Math.max(txt.width, 30));
        const heightEmu = ptToEmu(Math.max(txt.height, txt.fontSize * 1.4));
        const halfSize = Math.round(txt.fontSize * 2);
        const dId = drawingId++;

        const linkRId = txt.linkUrl ? hyperlinkMap.get(txt.linkUrl) : undefined;
        const fontName = escapeXml(txt.fontFamily);
        const textContentEsc = escapeXml(txt.text);

        let runXml = `
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}"/>
            <w:color w:val="${txt.linkUrl ? '0066CC' : txt.color}"/>
            <w:sz w:val="${halfSize}"/>
            ${txt.isBold ? '<w:b/>' : ''}
            ${txt.isItalic ? '<w:i/>' : ''}
            ${txt.linkUrl ? '<w:u w:val="single"/>' : ''}
          </w:rPr>
          <w:t xml:space="preserve">${textContentEsc}</w:t>
        </w:r>`;

        if (linkRId) {
          runXml = `<w:hyperlink r:id="${linkRId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${runXml}</w:hyperlink>`;
        }

        docBodyXml += `
<w:p>
  <w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
  <w:r>
    <mc:AlternateContent>
      <mc:Choice Requires="wps">
        <w:drawing>
          <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658241" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
            <wp:simplePos x="0" y="0"/>
            <wp:positionH relativeFrom="page"><wp:posOffset>${posXEmu}</wp:posOffset></wp:positionH>
            <wp:positionV relativeFrom="page"><wp:posOffset>${posYEmu}</wp:posOffset></wp:positionV>
            <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:wrapNone/>
            <wp:docPr id="${dId}" name="Text ${dId}"/>
            <wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
                <wps:wsp xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
                  <wps:cNvPr id="${dId}" name="Text ${dId}"/>
                  <wps:cNvSpPr txBox="1"/>
                  <wps:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                    <a:noFill/>
                    <a:ln><a:noFill/></a:ln>
                  </wps:spPr>
                  <wps:txbx>
                    <w:txbxContent>
                      <w:p>
                        <w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
                        ${runXml}
                      </w:p>
                    </w:txbxContent>
                  </wps:txbx>
                  <wps:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0"><a:noAutofit/></wps:bodyPr>
                </wps:wsp>
              </a:graphicData>
            </a:graphic>
          </wp:anchor>
        </w:drawing>
      </mc:Choice>
      <mc:Fallback/>
    </mc:AlternateContent>
  </w:r>
</w:p>`;
      });
    } else {
      // ─── MODO FLUIDO: PÁRRAFOS CONTINUOS Y TABLAS (ESTILO EDITORIAL) ───
      page.texts.forEach((txt) => {
        const halfSize = Math.round(txt.fontSize * 2);
        const fontName = escapeXml(txt.fontFamily);
        const textContentEsc = escapeXml(txt.text);
        const linkRId = txt.linkUrl ? hyperlinkMap.get(txt.linkUrl) : undefined;

        let runXml = `
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}"/>
            <w:color w:val="${txt.linkUrl ? '0066CC' : txt.color}"/>
            <w:sz w:val="${halfSize}"/>
            ${txt.isBold ? '<w:b/>' : ''}
            ${txt.isItalic ? '<w:i/>' : ''}
            ${txt.linkUrl ? '<w:u w:val="single"/>' : ''}
          </w:rPr>
          <w:t xml:space="preserve">${textContentEsc}</w:t>
        </w:r>`;

        if (linkRId) {
          runXml = `<w:hyperlink r:id="${linkRId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${runXml}</w:hyperlink>`;
        }

        docBodyXml += `
<w:p>
  <w:pPr>
    <w:spacing w:before="60" w:after="60" w:line="260" w:lineRule="auto"/>
    <w:ind w:left="${Math.round(txt.x * 12)}"/>
  </w:pPr>
  ${runXml}
</w:p>`;
      });

      page.images.forEach((img) => {
        const widthEmu = ptToEmu(img.width);
        const heightEmu = ptToEmu(img.height);
        const dId = drawingId++;

        docBodyXml += `
<w:p>
  <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
        <wp:docPr id="${dId}" name="Picture ${dId}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${dId}" name="Picture ${dId}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="${img.rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>`;
      });
    }

    // Propiedades de sección para cada página (dimensiones exactas de papel y márgenes)
    const isLastPage = pIdx === extractedPages.length - 1;
    const sectPrXml = `
<w:sectPr>
  <w:pgSz w:w="${pageWidthDxa}" w:h="${pageHeightDxa}" w:orient="${page.widthPt > page.heightPt ? 'landscape' : 'portrait'}"/>
  <w:pgMar w:top="${options.layoutMode === 'exact' ? '0' : '720'}" w:right="${options.layoutMode === 'exact' ? '0' : '720'}" w:bottom="${options.layoutMode === 'exact' ? '0' : '720'}" w:left="${options.layoutMode === 'exact' ? '0' : '720'}" w:header="0" w:footer="0" w:gutter="0"/>
</w:sectPr>`;

    if (!isLastPage) {
      docBodyXml += `\n<w:p><w:pPr>${sectPrXml}</w:pPr></w:p>`;
    } else {
      docBodyXml += `\n${sectPrXml}`;
    }
  });

  const fullDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
            xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            mc:Ignorable="w14"
            xml:space="preserve">
  <w:body>
    ${docBodyXml}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', fullDocumentXml);

  onProgress?.(95, 'Generando archivo final de Word...');
  const resultBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return resultBlob;
}
