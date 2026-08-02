import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFStream, PDFRawStream } from 'pdf-lib';

export interface WatermarkRemoveWorkerOptions {
  filePrefix: string;
  cleanMode: 'smart' | 'layers';
  targetText: string;
  removeAnnots: boolean;
  removeBackgrounds: boolean;
  pageScope: 'all' | 'custom';
  customPageRange: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface WatermarkRemoveWorkerMessageIn {
  action: 'remove-watermark';
  arrayBuffer: ArrayBuffer;
  password?: string;
  options: WatermarkRemoveWorkerOptions;
}

export type WatermarkRemoveWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

// Helper recursivo para obtener TODOS los flujos de contenido de una página (incluso en PDFRef de PDFArray)
const getContentStreams = (pdfDoc: PDFDocument, pageNode: PDFDict): (PDFStream | PDFRawStream)[] => {
  const streams: (PDFStream | PDFRawStream)[] = [];
  const contents = pageNode.get(PDFName.of('Contents'));

  const resolveItem = (item: any) => {
    if (!item) return;
    const resolved = item instanceof PDFRef ? pdfDoc.context.lookup(item) : item;
    if (resolved instanceof PDFStream || resolved instanceof PDFRawStream) {
      streams.push(resolved);
    } else if (resolved instanceof PDFArray) {
      for (let i = 0; i < resolved.size(); i++) {
        resolveItem(resolved.get(i));
      }
    }
  };

  resolveItem(contents);
  return streams;
};

// Helper para convertir cadenas hexadecimales de PDF (<52455345525641444F>) a texto ASCII
const decodeHex = (hexStr: string): string => {
  const cleanHex = hexStr.replace(/[^0-9A-Fa-f]/g, '');
  let str = '';
  for (let i = 0; i < cleanHex.length; i += 2) {
    const code = parseInt(cleanHex.substring(i, i + 2), 16);
    if (!isNaN(code) && code >= 32 && code <= 126) {
      str += String.fromCharCode(code);
    }
  }
  return str.toLowerCase();
};

// Algoritmo de limpieza profunda de contenido vectorial, Apryse, Marked Content y PDF-Lib
const cleanContentStreamText = (
  contents: string, 
  keywords: string[], 
  removeBackgrounds: boolean
): { newContents: string; modified: boolean } => {
  let newContents = contents;
  let modified = false;

  // 1. ELIMINAR BLOQUES MARKED CONTENT DE MARCAS DE AGUA (/Watermark BDC ... EMC, /Apryse, etc.)
  const bdcRegex = /\/(?:Watermark|Artifact|WM|PieceInfo|PDFBLACK_WM|Apryse)\b[^\n\r]*?BDC[\s\S]*?EMC/gi;
  if (bdcRegex.test(newContents)) {
    newContents = newContents.replace(bdcRegex, '');
    modified = true;
  }

  // 2. ELIMINAR BLOQUES DE TEXTO BT...ET QUE CONTIENEN PALABRAS CLAVE (Apryse, Reservado, Confidencial, etc.)
  const btBlockRegex = /BT[\s\S]*?ET/gi;
  newContents = newContents.replace(btBlockRegex, (match) => {
    const matchLower = match.toLowerCase();
    for (const kw of keywords) {
      if (matchLower.includes(kw)) {
        modified = true;
        return ''; // Eliminar únicamente el bloque de texto del sello
      }
    }
    return match;
  });

  // 3. REMOVER OPERADORES Tj / TJ INDIVIDUALES QUE CONTENGAN PALABRAS CLAVE
  // A) Cadenas literales: (CONFIDENCIAL) Tj o (RESERVADO) TJ
  const tjStringRegex = /\((?:[^)\\]|\\.)*\)\s*(?:Tj|TJ|tj)/gi;
  newContents = newContents.replace(tjStringRegex, (match) => {
    const matchLower = match.toLowerCase();
    for (const kw of keywords) {
      if (matchLower.includes(kw)) {
        modified = true;
        return '() Tj';
      }
    }
    return match;
  });

  // B) Cadenas hexadecimales: <52455345525641444F> Tj
  const tjHexRegex = /<[0-9A-Fa-f\s]+>\s*(?:Tj|TJ|tj)/gi;
  newContents = newContents.replace(tjHexRegex, (match) => {
    const hexPart = match.substring(1, match.indexOf('>'));
    const decoded = decodeHex(hexPart);
    for (const kw of keywords) {
      if (decoded.includes(kw)) {
        modified = true;
        return '() Tj';
      }
    }
    return match;
  });

  // C) Arrays de texto fraccionado con posicionamiento: [(R) 10 (E) -5 (S) 0 (E) (R) (V) (A) (D) (O)] TJ
  const tjArrayRegex = /\[([^\]]+)\]\s*(?:TJ|Tj|tj)/gi;
  newContents = newContents.replace(tjArrayRegex, (match, inner) => {
    const fragments: string[] = [];
    const parenRegex = /\((?:[^)\\]|\\.)*\)/g;
    let m;
    while ((m = parenRegex.exec(inner)) !== null) {
      fragments.push(m[0].slice(1, -1));
    }
    const combined = fragments.join('').toLowerCase();

    const hexRegex = /<[0-9A-Fa-f\s]+>/g;
    let hm;
    let hexCombined = '';
    while ((hm = hexRegex.exec(inner)) !== null) {
      hexCombined += decodeHex(hm[0].slice(1, -1));
    }

    for (const kw of keywords) {
      if ((combined && combined.includes(kw)) || (hexCombined && hexCombined.includes(kw))) {
        modified = true;
        return '() Tj';
      }
    }
    return match;
  });

  // 4. ELIMINAR LLAMADAS A XOBJECTS DE SELLO (/WM0 Do, /Apryse Do, etc.)
  if (removeBackgrounds) {
    const doRegex = /\/(?:wm\d*|apryse\d*|watermark\d*|fm\d*)\s+Do/gi;
    if (doRegex.test(newContents)) {
      newContents = newContents.replace(doRegex, '');
      modified = true;
    }
  }

  return { newContents, modified };
};

self.onmessage = async (e: MessageEvent<WatermarkRemoveWorkerMessageIn>) => {
  const { action, arrayBuffer, password, options } = e.data;

  if (action !== 'remove-watermark') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as WatermarkRemoveWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura del documento PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new Error('El documento PDF no contiene páginas válidas para procesar.');
    }

    const { targetText, removeAnnots, removeBackgrounds, pageScope, customPageRange, metadata } = options;

    postProgress(20, 'Escaneando catálogo, marcas Apryse y capas OCG...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    // 1. Limpieza de capas globales OCG y metadatos de marcas en el Catálogo (Apryse, Adobe, iLovePDF, etc.)
    if (pdfDoc.catalog.has(PDFName.of('OCProperties'))) {
      pdfDoc.catalog.delete(PDFName.of('OCProperties'));
    }
    if (pdfDoc.catalog.has(PDFName.of('PieceInfo'))) {
      pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
    }

    // LISTA MAESTRA DE PALABRAS CLAVE (Incluye Apryse, marcas corporativas y entrada de usuario)
    const userKeywords = targetText
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const defaultKeywords = [
      'apryse', 'reservado', 'confidencial', 'borrador', 'copia', 'watermark', 'draft', 
      'confidential', 'copy', 'sample', 'ejemplo', 'anulado', 'prohibido',
      'pdfblack', 'ilovepdf', 'smallpdf', 'do not copy'
    ];

    const allKeywords = Array.from(new Set([...userKeywords, ...defaultKeywords]));

    // Helper para interpretar páginas seleccionadas
    const targetPages = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) targetPages.add(i);
    } else {
      const parts = customPageRange.split(',');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i >= 1 && i <= totalPages) targetPages.add(i);
            }
          }
        } else {
          const num = Number(trimmed);
          if (!isNaN(num) && num >= 1 && num <= totalPages) {
            targetPages.add(num);
          }
        }
      });
    }

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      if (!targetPages.has(pageNum)) continue;

      const currentPercent = 20 + Math.floor(((i + 1) / totalPages) * 65);
      postProgress(currentPercent, `Depurando marcas Apryse y sellos de agua en página ${pageNum} de ${totalPages}...`);

      const page = pages[i];
      const node = page.node;

      // 2. Eliminar anotaciones y marcas de metadatos (/Annots y /PieceInfo)
      if (removeAnnots) {
        if (node.has(PDFName.of('Annots'))) node.delete(PDFName.of('Annots'));
        if (node.has(PDFName.of('PieceInfo'))) node.delete(PDFName.of('PieceInfo'));
      }

      // 3. Identificar y VACIAR los contenidos de XObjects de marcas de agua (Apryse, WM, FM)
      if (node.has(PDFName.of('Resources'))) {
        const resources = node.lookup(PDFName.of('Resources'), PDFDict);
        if (resources && resources.has(PDFName.of('XObject'))) {
          const xObjectDict = resources.lookup(PDFName.of('XObject'), PDFDict);
          if (xObjectDict) {
            xObjectDict.entries().forEach(([key, ref]) => {
              const keyStr = key.decodeText().toLowerCase();
              const obj = pdfDoc.context.lookup(ref);

              if (obj instanceof PDFStream || obj instanceof PDFRawStream) {
                try {
                  const streamBytes = obj.getContents();
                  const streamText = new TextDecoder('latin1').decode(streamBytes).toLowerCase();

                  const isMatch = 
                    allKeywords.some(kw => keyStr.includes(kw) || streamText.includes(kw)) ||
                    keyStr.includes('watermark') || keyStr.includes('wm') || keyStr.includes('apryse') || keyStr.includes('fm') ||
                    streamText.includes('apryse') || streamText.includes('watermark') ||
                    (removeBackgrounds && (keyStr.includes('fm') || keyStr.includes('res') || streamText.includes('/ca')));

                  if (isMatch) {
                    if ('setContents' in obj && typeof (obj as any).setContents === 'function') {
                      (obj as any).setContents(new Uint8Array(0));
                    } else {
                      (obj as any).contents = new Uint8Array(0);
                    }
                  }
                } catch (e) {
                  if (allKeywords.some(kw => keyStr.includes(kw)) || keyStr.includes('apryse') || keyStr.includes('wm')) {
                    if ('setContents' in obj && typeof (obj as any).setContents === 'function') {
                      (obj as any).setContents(new Uint8Array(0));
                    }
                  }
                }
              }
            });
          }
        }
      }

      // 4. Limpieza profunda en TODOS los flujos de contenido (Content Streams resueltos recursivamente)
      const streams = getContentStreams(pdfDoc, node);

      streams.forEach(stream => {
        try {
          const bytes = stream.getContents();
          const contentsText = new TextDecoder('latin1').decode(bytes);

          const { newContents, modified } = cleanContentStreamText(contentsText, allKeywords, removeBackgrounds);

          if (modified) {
            const newBytes = new TextEncoder().encode(newContents);
            if ('setContents' in stream && typeof (stream as any).setContents === 'function') {
              (stream as any).setContents(newBytes);
            } else {
              (stream as any).contents = newBytes;
            }
          }
        } catch (e) {
          console.warn("Warn al limpiar flujo de contenido en worker:", e);
        }
      });
    }

    postProgress(85, 'Guardando y optimizando bytes del PDF depurado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF depurado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as WatermarkRemoveWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al remover el sello de agua del documento PDF',
    } as WatermarkRemoveWorkerMessageOut);
  }
};
