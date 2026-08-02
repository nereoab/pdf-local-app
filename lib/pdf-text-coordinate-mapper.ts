/**
 * PDF Text Coordinate Mapper - Mapeo de Precisión v3.0
 * 
 * Convierte coordenadas entre sistemas:
 *  - Viewport UI (porcentajes 0-100%, origen top-left, mapa de bits del visor)
 *  - PDF User Space (puntos, origen bottom-left, espacio nativo del documento)
 *  - Content Stream coordinates (operadores de texto Tm/Td)
 * 
 * Maneja transformaciones compuestas: MediaBox, CropBox, Rotate, CTM
 * 
 * Compatible con pdf-lib 1.17.1 y pdfjs-dist 6.1.200
 */

// ============================================================
// TIPOS
// ============================================================

export interface PageGeometry {
  /** MediaBox [llx, lly, urx, ury] en puntos PDF */
  mediaBox: [number, number, number, number];
  /** CropBox opcional (recorte visible) */
  cropBox?: [number, number, number, number];
  /** Rotación en grados (0, 90, 180, 270) */
  rotate?: number;
  /** Ancho del viewport renderizado a escala 1.0 */
  viewportWidth: number;
  /** Alto del viewport renderizado a escala 1.0 */
  viewportHeight: number;
}

export interface PdfUserSpaceCoords {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ViewportPercentCoords {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

// ============================================================
// CONVERSIÓN VIEWPORT % → PDF USER SPACE
// ============================================================

/**
 * Convierte coordenadas de porcentaje de viewport (top-left origin, Y hacia abajo)
 * a coordenadas de espacio de usuario PDF (bottom-left origin, Y hacia arriba).
 * 
 * Tiene en cuenta:
 *  - Rotación de página
 *  - CropBox (si existe, ajusta el área visible)
 *  - Inversión del eje Y
 */
export function viewportPercentToPdfUserSpace(
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number,
  geometry: PageGeometry
): PdfUserSpaceCoords {
  const cropBox = geometry.cropBox || geometry.mediaBox;
  const cropWidth = cropBox[2] - cropBox[0];
  const cropHeight = cropBox[3] - cropBox[1];

  const rotate = geometry.rotate || 0;

  let userX: number;
  let userY: number;
  let userW: number;
  let userH: number;

  // Ajustar según rotación
  switch (rotate) {
    case 90:
      // Viewport X → PDF Y (desde arriba)
      // Viewport Y → PDF X (invertido)
      userW = (heightPercent / 100) * cropWidth;
      userH = (widthPercent / 100) * cropHeight;
      userX = cropBox[1] + cropHeight - ((yPercent / 100) * cropHeight) - userW;
      userY = cropBox[0] + ((xPercent / 100) * cropWidth);
      return { x: userX, y: userY, w: userW, h: userH };

    case 180:
      // Ambos ejes invertidos
      userX = cropBox[2] - ((xPercent / 100) * cropWidth) - ((widthPercent / 100) * cropWidth);
      userY = cropBox[1] + cropHeight - ((yPercent / 100) * cropHeight) - ((heightPercent / 100) * cropHeight);
      userW = (widthPercent / 100) * cropWidth;
      userH = (heightPercent / 100) * cropHeight;
      return { x: userX, y: userY, w: userW, h: userH };

    case 270:
      // Viewport X → PDF Y (invertido)
      // Viewport Y → PDF X (desde arriba)
      userW = (heightPercent / 100) * cropWidth;
      userH = (widthPercent / 100) * cropHeight;
      userX = cropBox[1] + ((yPercent / 100) * cropHeight);
      userY = cropBox[0] + cropWidth - ((xPercent / 100) * cropWidth) - userH;
      return { x: userX, y: userY, w: userW, h: userH };

    default: // 0°
      // Eje X: misma dirección (izquierda a derecha)
      userX = cropBox[0] + ((xPercent / 100) * cropWidth);
      userW = (widthPercent / 100) * cropWidth;

      // Eje Y: invertir (viewport Y hacia abajo → PDF Y hacia arriba)
      // cropBox[1] es bottom-left en Y
      const viewportYFromTop = (yPercent / 100) * cropHeight;
      const boxH = (heightPercent / 100) * cropHeight;
      userY = cropBox[1] + cropHeight - viewportYFromTop - boxH;
      userH = boxH;

      return { x: userX, y: userY, w: userW, h: userH };
  }
}

/**
 * Convierte coordenadas PDF user space → porcentaje de viewport.
 * Útil para feedback visual inverso (ej: resaltar texto detectado en el visor).
 */
export function pdfUserSpaceToViewportPercent(
  pdfX: number,
  pdfY: number,
  pdfW: number,
  pdfH: number,
  geometry: PageGeometry
): ViewportPercentCoords {
  const cropBox = geometry.cropBox || geometry.mediaBox;
  const cropWidth = cropBox[2] - cropBox[0];
  const cropHeight = cropBox[3] - cropBox[1];

  const rotate = geometry.rotate || 0;

  switch (rotate) {
    case 90:
      return {
        xPercent: ((pdfY - cropBox[0]) / cropWidth) * 100,
        yPercent: ((cropBox[1] + cropHeight - pdfX - pdfH) / cropHeight) * 100,
        widthPercent: (pdfH / cropWidth) * 100,
        heightPercent: (pdfW / cropHeight) * 100,
      };

    case 180:
      return {
        xPercent: ((cropBox[2] - pdfX - pdfW) / cropWidth) * 100,
        yPercent: ((cropBox[1] + cropHeight - pdfY - pdfH) / cropHeight) * 100,
        widthPercent: (pdfW / cropWidth) * 100,
        heightPercent: (pdfH / cropHeight) * 100,
      };

    case 270:
      return {
        xPercent: ((cropBox[0] + cropWidth - pdfY - pdfH) / cropHeight) * 100,
        yPercent: ((pdfX - cropBox[1]) / cropWidth) * 100,
        widthPercent: (pdfH / cropHeight) * 100,
        heightPercent: (pdfW / cropWidth) * 100,
      };

    default: // 0°
      return {
        xPercent: ((pdfX - cropBox[0]) / cropWidth) * 100,
        yPercent: ((cropBox[1] + cropHeight - pdfY - pdfH) / cropHeight) * 100,
        widthPercent: (pdfW / cropWidth) * 100,
        heightPercent: (pdfH / cropHeight) * 100,
      };
  }
}

// ============================================================
// EXTRACCIÓN DE GEOMETRÍA DESDE PDF.JS
// ============================================================

/**
 * Extrae la geometría completa de una página desde el objeto page de pdf.js.
 * Incluye MediaBox, CropBox, Rotate y dimensiones de viewport a escala 1.0.
 */
export function extractPageGeometry(page: {
  getViewport: (params: { scale: number }) => {
    width: number;
    height: number;
  };
  view?: [number, number, number, number];
  rotate?: number;
  _pageInfo?: {
    view?: number[];
  };
  mediaBox?: [number, number, number, number];
  cropBox?: [number, number, number, number];
}): PageGeometry {
  const viewport = page.getViewport({ scale: 1.0 });

  // Intentar obtener MediaBox desde propiedades de la página
  // pdf.js internamente almacena esto en diferentes lugares según la versión
  let mediaBox: [number, number, number, number] = [0, 0, viewport.width, viewport.height];

  try {
    // Introspección de la API de pdf.js (puede variar entre versiones)
    const pageAny = page as Record<string, unknown>;

    if (pageAny.mediaBox && Array.isArray(pageAny.mediaBox) && pageAny.mediaBox.length === 4) {
      mediaBox = pageAny.mediaBox as [number, number, number, number];
    } else if (page.view && Array.isArray(page.view) && page.view.length >= 4) {
      mediaBox = [page.view[0], page.view[1], page.view[2], page.view[3]];
    } else if (page._pageInfo?.view && Array.isArray(page._pageInfo.view) && page._pageInfo.view.length >= 4) {
      const v = page._pageInfo.view;
      mediaBox = [v[0], v[1], v[2], v[3]];
    }
  } catch {
    // Fallback: usar dimensiones de viewport
  }

  // CropBox - pdf.js generalmente no expone cropBox directamente
  // Usamos el viewport como aproximación del área visible
  const cropBox: [number, number, number, number] = [0, 0, viewport.width, viewport.height];

  return {
    mediaBox,
    cropBox,
    rotate: page.rotate || 0,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  };
}

// ============================================================
// TRANSFORMACIÓN DE COORDENADAS DE TEXTO (Tm → User Space)
// ============================================================

/**
 * Convierte una matriz de texto Tm [a, b, c, d, e, f] a coordenadas
 * en espacio de usuario PDF (puntos, origen bottom-left).
 * 
 * La matriz de texto establece la posición y escala del texto:
 * [ a  b  0 ]
 * [ c  d  0 ]
 * [ e  f  1 ]
 * 
 * Donde (e, f) = (Tx, Ty) es la posición base del texto.
 */
export function textMatrixToUserSpace(
  tm: [number, number, number, number, number, number],
  ctm?: [number, number, number, number, number, number]
): { x: number; y: number; fontSize: number } {
  let x = tm[4]; // e
  let y = tm[5]; // f
  let fontSize = Math.sqrt(tm[0] * tm[0] + tm[1] * tm[1]);

  // Aplicar CTM (Current Transformation Matrix) si existe
  if (ctm) {
    const newX = ctm[0] * x + ctm[2] * y + ctm[4];
    const newY = ctm[1] * x + ctm[3] * y + ctm[5];
    x = newX;
    y = newY;
    fontSize *= Math.abs(ctm[0]); // Escalar tamaño de fuente
  }

  return { x, y, fontSize };
}

// ============================================================
// UTILIDADES DE BOUNDING BOX
// ============================================================

/**
 * Calcula el bounding box de un texto en espacio de usuario PDF
 * dadas su posición base y métricas estimadas.
 */
export function textBoundingBox(
  x: number,
  y: number,
  text: string,
  fontSize: number
): { left: number; bottom: number; right: number; top: number } {
  const width = text.length * fontSize * 0.55;
  const height = fontSize * 1.2;
  const descent = fontSize * 0.2;

  return {
    left: x,
    bottom: y - descent,
    right: x + width,
    top: y - descent + height,
  };
}

/**
 * Detecta si dos bounding boxes se solapan.
 * Usa algoritmo AABB (Axis-Aligned Bounding Box) overlap.
 */
export function boxesOverlap(
  box1: { left: number; bottom: number; right: number; top: number },
  box2: { left: number; bottom: number; right: number; top: number }
): boolean {
  return (
    box1.left < box2.right &&
    box1.right > box2.left &&
    box1.bottom < box2.top &&
    box1.top > box2.bottom
  );
}

/**
 * Calcula el porcentaje de solapamiento entre dos bounding boxes.
 * Retorna 0-1 donde 1 = solapamiento total.
 */
export function overlapPercent(
  box1: { left: number; bottom: number; right: number; top: number },
  box2: { left: number; bottom: number; right: number; top: number }
): number {
  if (!boxesOverlap(box1, box2)) return 0;

  const overlapLeft = Math.max(box1.left, box2.left);
  const overlapRight = Math.min(box1.right, box2.right);
  const overlapBottom = Math.max(box1.bottom, box2.bottom);
  const overlapTop = Math.min(box1.top, box2.top);

  const overlapArea = Math.max(0, overlapRight - overlapLeft) * Math.max(0, overlapTop - overlapBottom);
  const box1Area = (box1.right - box1.left) * (box1.top - box1.bottom);

  if (box1Area <= 0) return 0;
  return Math.min(1, overlapArea / box1Area);
}

// ============================================================
// AJUSTE DE PRECISIÓN
// ============================================================

/**
 * Expande un área de censura para asegurar cobertura completa del texto.
 * Agrega un margen de seguridad (default 15%) alrededor del área original.
 * 
 * Esto compensa imprecisiones en la estimación de anchos de fuente
 * y variaciones en métricas de glifos individuales.
 */
export function expandRedactionArea(
  box: PdfUserSpaceCoords,
  marginPercent: number = 15
): PdfUserSpaceCoords {
  const marginX = box.w * (marginPercent / 100);
  const marginY = box.h * (marginPercent / 100);

  return {
    x: Math.max(0, box.x - marginX),
    y: Math.max(0, box.y - marginY),
    w: box.w + marginX * 2,
    h: box.h + marginY * 2,
  };
}

/**
 * Recorta un área de censura para que no exceda los límites de la página.
 */
export function clampToMediaBox(
  box: PdfUserSpaceCoords,
  mediaBox: [number, number, number, number]
): PdfUserSpaceCoords {
  const mbLeft = mediaBox[0];
  const mbBottom = mediaBox[1];
  const mbRight = mediaBox[2];
  const mbTop = mediaBox[3];

  const x = Math.max(mbLeft, box.x);
  const y = Math.max(mbBottom, box.y);
  const w = Math.min(box.w, mbRight - x);
  const h = Math.min(box.h, mbTop - y);

  return { x, y, w, h };
}