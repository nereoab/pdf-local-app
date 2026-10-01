export type EditorTab = 'view' | 'edit' | 'annotate' | 'shapes' | 'insert' | 'fill-sign';

export type EditorTool =
  | 'select'
  | 'text'
  | 'whiteout'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'sticky-note'
  | 'freehand'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'image'
  | 'stamp'
  | 'signature'
  | 'checkmark'
  | 'crossmark'
  | 'date';

export type FontFamily = 'Helvetica' | 'Times' | 'Courier';

export interface ExtractedText {
  id: string;
  str: string;
  pageNumber: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  vx: number;
  vy: number;
  vWidth: number;
  vHeight: number;
  fontSize: number;
  fontName: string;
}

export interface TextModification {
  id: string;
  pageNumber: number;
  isOriginal: boolean;
  originalStr?: string;
  text: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number;
  fontFamily: FontFamily;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  align?: 'left' | 'center' | 'right';
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface AnnotationItem {
  id: string;
  pageNumber: number;
  type: 'highlight' | 'underline' | 'strikethrough' | 'whiteout' | 'sticky-note';
  color: string;
  opacity: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  content?: string; // Para sticky notes
}

export interface ShapeItem {
  id: string;
  pageNumber: number;
  type: 'rectangle' | 'circle' | 'line' | 'arrow';
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string; // transparent si no tiene
  opacity: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface InsertedImage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  aspectRatio: number;
}

export interface StampItem {
  id: string;
  pageNumber: number;
  type: 'APPROVED' | 'CONFIDENTIAL' | 'REVIEWED' | 'DRAFT' | 'PAID';
  dataUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface EditorStateSnapshot {
  modifications: TextModification[];
  annotations: AnnotationItem[];
  shapes: ShapeItem[];
  images: InsertedImage[];
  stamps: StampItem[];
}
