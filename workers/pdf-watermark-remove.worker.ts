import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFStream, PDFRawStream } from 'pdf-lib';

export interface WatermarkRemoveWorkerOptions {
  filePrefix: string;
  cleanMode: 'smart' | 'deep' | 'custom';
  targetText: string;
  removeAnnots: boolean;
  removeBackgrounds: boolean;
  removeOcgLayers?: boolean;
  pageScope: 'all' | 'custom' | 'odds' | 'evens';
  customPageRange: string;
  skipFirstPage?: boolean;
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

// Helper recursivo para obtener todos los flujos de contenido de una página
const getContentStreams = (
  pdfDoc: PDFDocument,
  pageNode: PDFDict,
): (PDFStream | PDFRawStream)[] => {
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

// Helper para decodificar cadenas hexadecimales de PDF (<52455345525641444F>)
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
  removeBackgrounds: boolean,
  isDeep: boolean,
): { newContents: string; modified: boolean } => {
  let newContents = contents;
  let modified = false;

  // 1. ELIMINAR BLOQUES MARKED CONTENT DE MARCAS DE AGUA (/Watermark BDC ... EMC, /Artifact, /Apryse, etc.)
  const bdcRegex =
    /\/(?:Watermark|Artifact|WM|PieceInfo|PDFBLACK_WM|Apryse|Background)\b[^\n\r]*?BDC[\s\S]*?EMC/gi;
  if (bdcRegex.test(newContents)) {
    newContents = newContents.replace(bdcRegex, '');
    modified = true;
  }

  // BMC ... EMC para marcas simples
  const bmcRegex = /\/(?:Watermark|Artifact|WM|Apryse)\s+BMC[\s\S]*?EMC/gi;
  if (bmcRegex.test(newContents)) {
    newContents = newContents.replace(bmcRegex, '');
    modified = true;
  }

  // 2. ELIMINAR BLOQUES DE TEXTO BT...ET QUE CONTIENEN PALABRAS CLAVE
  const btBlockRegex = /BT[\s\S]*?ET/gi;
  newContents = newContents.replace(btBlockRegex, (match) => {
    const matchLower = match.toLowerCase();
    for (const kw of keywords) {
      if (matchLower.includes(kw)) {
        modified = true;
        return ''; // Suprimir el bloque completo del sello
      }
    }
    return match;
  });

  // 3. REMOVER OPERADORES Tj / TJ INDIVIDUALES QUE CONTENGAN PALABRAS CLAVE
  // A) Cadenas literales: (CONFIDENCIAL) Tj
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

  // C) Arrays de texto fraccionado con espaciado: [(C) 10 (O) -5 (P) 0 (I) (A)] TJ
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
  if (removeBackgrounds || isDeep) {
    const doRegex = /\/(?:wm\d*|apryse\d*|watermark\d*|fm\d*|stamp\d*)\s+Do/gi;
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
      (self as unknown as Worker).postMessage({
        type: 'progress',
        percent,
        message,
      } as WatermarkRemoveWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura y diccionarios del documento PDF...');

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

    const {
      cleanMode = 'smart',
      targetText = '',
      removeAnnots = true,
      removeBackgrounds = true,
      removeOcgLayers = true,
      pageScope = 'all',
      customPageRange = '',
      skipFirstPage = false,
      metadata,
    } = options;

    const isDeep = cleanMode === 'deep';

    postProgress(20, 'Escaneando catálogo, capas OCG y metadatos forenses...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    // 1. Limpieza de capas globales OCG (Optional Content Groups) y PieceInfo en el Catálogo
    if (removeOcgLayers || isDeep) {
      if (pdfDoc.catalog.has(PDFName.of('OCProperties'))) {
        pdfDoc.catalog.delete(PDFName.of('OCProperties'));
      }
    }
    if (pdfDoc.catalog.has(PDFName.of('PieceInfo'))) {
      pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
    }

    // LISTA MAESTRA DE PALABRAS CLAVE
    const userKeywords = targetText
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const defaultKeywords = [
      'apryse',
      'reservado',
      'confidencial',
      'borrador',
      'copia',
      'watermark',
      'draft',
      'confidential',
      'copy',
      'sample',
      'ejemplo',
      'anulado',
      'prohibido',
      'pdfblack',
      'ilovepdf',
      'smallpdf',
      'sejda',
      'camscanner',
      'wondershare',
      'nitro',
      'foxit',
      'trial',
      'evaluation',
      'demo',
      'unregistered',
      'preview',
      'do not copy',
      'copia no controlada',
      'uso interno',
    ];

    const allKeywords = Array.from(new Set([...userKeywords, ...defaultKeywords]));

    // Determinar páginas objetivo
    const targetPages = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) targetPages.add(i);
    } else if (pageScope === 'odds') {
      for (let i = 1; i <= totalPages; i += 2) targetPages.add(i);
    } else if (pageScope === 'evens') {
      for (let i = 2; i <= totalPages; i += 2) targetPages.add(i);
    } else {
      const parts = customPageRange.split(',');
      parts.forEach((part) => {
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

    if (skipFirstPage) {
      targetPages.delete(1);
    }

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      if (!targetPages.has(pageNum)) continue;

      const currentPercent = 20 + Math.floor(((i + 1) / totalPages) * 65);
      postProgress(
        currentPercent,
        `Depurando marcas de agua y sellos en página ${pageNum} de ${totalPages}...`,
      );

      const page = pages[i];
      const node = page.node;

      // 2. Eliminar anotaciones (/Annots) de marcas de agua o sellos flotantes
      if (removeAnnots || isDeep) {
        if (node.has(PDFName.of('Annots'))) {
          const annots = node.lookup(PDFName.of('Annots'), PDFArray);
          if (annots) {
            // Filtrado selectivo o eliminación total de sellos
            const filteredAnnots = pdfDoc.context.obj([]);
            for (let a = 0; a < annots.size(); a++) {
              const annotRef = annots.get(a);
              const annotObj = pdfDoc.context.lookup(annotRef, PDFDict);
              if (annotObj) {
                const subtype = annotObj.get(PDFName.of('Subtype'))?.toString().toLowerCase();
                const isWatermarkAnnot =
                  subtype?.includes('watermark') ||
                  subtype?.includes('stamp') ||
                  annotObj.get(PDFName.of('F'))?.toString() === '64';
                if (!isWatermarkAnnot && !isDeep) {
                  filteredAnnots.push(annotRef);
                }
              }
            }
            if (filteredAnnots.size() === 0) {
              node.delete(PDFName.of('Annots'));
            } else {
              node.set(PDFName.of('Annots'), filteredAnnots);
            }
          }
        }
        if (node.has(PDFName.of('PieceInfo'))) {
          node.delete(PDFName.of('PieceInfo'));
        }
      }

      // 3. Identificar y vaciar XObjects de marcas de agua (Apryse, WM, FM, Backgrounds)
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
                    allKeywords.some((kw) => keyStr.includes(kw) || streamText.includes(kw)) ||
                    keyStr.includes('watermark') ||
                    keyStr.includes('wm') ||
                    keyStr.includes('apryse') ||
                    keyStr.includes('fm') ||
                    keyStr.includes('stamp') ||
                    streamText.includes('apryse') ||
                    streamText.includes('watermark') ||
                    ((removeBackgrounds || isDeep) &&
                      (keyStr.includes('fm') ||
                        keyStr.includes('res') ||
                        streamText.includes('/ca') ||
                        streamText.includes('/gs')));

                  if (isMatch) {
                    if ('setContents' in obj && typeof (obj as any).setContents === 'function') {
                      (obj as any).setContents(new Uint8Array(0));
                    } else {
                      (obj as any).contents = new Uint8Array(0);
                    }
                  }
                } catch {
                  if (
                    allKeywords.some((kw) => keyStr.includes(kw)) ||
                    keyStr.includes('apryse') ||
                    keyStr.includes('wm')
                  ) {
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

      // 4. Limpieza profunda en todos los flujos de contenido de la página
      const streams = getContentStreams(pdfDoc, node);

      streams.forEach((stream) => {
        try {
          const bytes = stream.getContents();
          const contentsText = new TextDecoder('latin1').decode(bytes);

          const { newContents, modified } = cleanContentStreamText(
            contentsText,
            allKeywords,
            removeBackgrounds,
            isDeep,
          );

          if (modified) {
            const newBytes = new TextEncoder().encode(newContents);
            if ('setContents' in stream && typeof (stream as any).setContents === 'function') {
              (stream as any).setContents(newBytes);
            } else {
              (stream as any).contents = newBytes;
            }
          }
        } catch (e) {
          console.warn('Advertencia al depurar flujo de contenido en worker:', e);
        }
      });
    }

    postProgress(85, 'Optimizando estructura y guardando bytes del PDF depurado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength,
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF depurado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as WatermarkRemoveWorkerMessageOut,
      [resultBuffer],
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al remover el sello de agua del documento PDF',
    } as WatermarkRemoveWorkerMessageOut);
  }
};
