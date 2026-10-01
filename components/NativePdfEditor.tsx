'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Type,
  Image as ImageIcon,
  MousePointer,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  RotateCw,
  Trash2,
  Check,
  X,
  Loader2,
  Sparkles,
  Move,
  Bold,
  Italic,
  Plus,
  Palette,
  ShieldCheck,
  FileText,
  Lock,
  Unlock,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  StickyNote,
  PenTool,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Award,
  Eraser,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useLanguage } from '@/context/LanguageContext';
import {
  EditorTab,
  EditorTool,
  FontFamily,
  ExtractedText,
  TextModification,
  AnnotationItem,
  ShapeItem,
  InsertedImage,
  StampItem,
  EditorStateSnapshot,
} from './native-editor/types';
import SignatureModal from './native-editor/SignatureModal';
import ThumbnailsSidebar from './native-editor/ThumbnailsSidebar';
import PropertyBar from './native-editor/PropertyBar';
import { createStampDataUrl } from './native-editor/StampGenerator';

export interface NativePdfEditorProps {
  file: File;
  filePrefix?: string;
  onFinish: (blob: Blob, totalPages: number) => void;
  onSwitchToApryse?: () => void;
}

interface DetectedFontInfo {
  fontFamily: FontFamily;
  realFontName: string;
  isBold: boolean;
  isItalic: boolean;
}

function detectFontProperties(page: any, textContent: any, fontName: string): DetectedFontInfo {
  let rawName = '';
  let isBold = false;
  let isItalic = false;
  let fallbackName = 'sans-serif';

  // 1. Inspect page.commonObjs
  try {
    if (page?.commonObjs?.has?.(fontName)) {
      const fontObj = page.commonObjs.get(fontName);
      if (fontObj) {
        rawName = fontObj.name || fontObj.fallbackName || '';
        if (fontObj.bold || fontObj.black) isBold = true;
        if (fontObj.italic) isItalic = true;
        if (fontObj.fallbackName) fallbackName = fontObj.fallbackName;
      }
    }
  } catch (e) {}

  // 2. Inspect page.objs
  if (!rawName) {
    try {
      if (page?.objs?.has?.(fontName)) {
        const fontObj = page.objs.get(fontName);
        if (fontObj) {
          rawName = fontObj.name || fontObj.fallbackName || '';
          if (fontObj.bold || fontObj.black) isBold = true;
          if (fontObj.italic) isItalic = true;
          if (fontObj.fallbackName) fallbackName = fontObj.fallbackName;
        }
      }
    } catch (e) {}
  }

  // 3. Inspect textContent.styles
  const style = textContent?.styles?.[fontName];
  if (style) {
    if (!rawName && style.fontFamily) {
      rawName = style.fontFamily;
    }
    if (style.fontFamily === 'serif' || style.fontFamily === 'monospace') {
      fallbackName = style.fontFamily;
    }
  }

  // 4. Default to fontName itself
  if (!rawName) {
    rawName = fontName || 'Helvetica';
  }

  // Analyze rawName for bold / italic indicators
  const lower = rawName.toLowerCase();
  if (
    lower.includes('bold') ||
    lower.includes('black') ||
    lower.includes('heavy') ||
    lower.includes('demi') ||
    lower.includes('semibold') ||
    /-bd\b|_bd\b/i.test(rawName)
  ) {
    isBold = true;
  }
  if (lower.includes('italic') || lower.includes('oblique') || /-it\b|_it\b/i.test(rawName)) {
    isItalic = true;
  }

  // Clean PDF subset prefix like "BAAAAA+Calibri"
  let cleanName = rawName.replace(/^[A-Z]{6}\+/, '');
  // Strip style suffixes
  cleanName = cleanName
    .replace(
      /-(Bold|Italic|Regular|BoldItalic|Oblique|Roman|Medium|Light|Semibold|Black|Heavy|MT|PSMT|PS)+$/i,
      '',
    )
    .trim();

  const cleanLower = cleanName.toLowerCase();
  let realFontName = 'Arial';
  let fontFamily: FontFamily = 'Helvetica';

  if (cleanLower.includes('calibri') || cleanLower.includes('aptos')) {
    realFontName = 'Calibri';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('arial')) {
    realFontName = 'Arial';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('times')) {
    realFontName = 'Times New Roman';
    fontFamily = 'Times';
  } else if (cleanLower.includes('courier')) {
    realFontName = 'Courier New';
    fontFamily = 'Courier';
  } else if (cleanLower.includes('georgia')) {
    realFontName = 'Georgia';
    fontFamily = 'Times';
  } else if (cleanLower.includes('cambria')) {
    realFontName = 'Cambria';
    fontFamily = 'Times';
  } else if (cleanLower.includes('garamond')) {
    realFontName = 'Garamond';
    fontFamily = 'Times';
  } else if (cleanLower.includes('verdana')) {
    realFontName = 'Verdana';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('tahoma')) {
    realFontName = 'Tahoma';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('trebuchet')) {
    realFontName = 'Trebuchet MS';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('roboto')) {
    realFontName = 'Roboto';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('segoe')) {
    realFontName = 'Segoe UI';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('helvetica')) {
    realFontName = 'Helvetica';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('impact')) {
    realFontName = 'Impact';
    fontFamily = 'Helvetica';
  } else if (cleanLower.includes('consolas')) {
    realFontName = 'Consolas';
    fontFamily = 'Courier';
  } else if (fallbackName === 'serif') {
    realFontName = 'Times New Roman';
    fontFamily = 'Times';
  } else if (fallbackName === 'monospace') {
    realFontName = 'Courier New';
    fontFamily = 'Courier';
  } else {
    if (cleanName && cleanName.length > 2 && !cleanName.startsWith('g_')) {
      realFontName = cleanName;
      fontFamily =
        fallbackName === 'serif' ? 'Times' : fallbackName === 'monospace' ? 'Courier' : 'Helvetica';
    } else {
      realFontName = 'Arial';
      fontFamily = 'Helvetica';
    }
  }

  return {
    fontFamily,
    realFontName,
    isBold,
    isItalic,
  };
}

function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
): string {
  try {
    const startX = Math.max(0, Math.min(canvasWidth - 1, Math.round(x)));
    const startY = Math.max(0, Math.min(canvasHeight - 1, Math.round(y)));
    const w = Math.max(1, Math.min(canvasWidth - startX, Math.round(width)));
    const h = Math.max(1, Math.min(canvasHeight - startY, Math.round(height)));

    if (w <= 0 || h <= 0) return '#000000';

    const sampleW = Math.min(w, 50);
    const sampleH = Math.min(h, 25);
    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
    const data = imgData.data;

    // Corner sampling for background determination
    const cornerIndices = [
      0,
      (sampleW - 1) * 4,
      (sampleH - 1) * sampleW * 4,
      ((sampleH - 1) * sampleW + (sampleW - 1)) * 4,
    ];

    let bgR = 255;
    let bgG = 255;
    let bgB = 255;
    let validCorners = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    for (const idx of cornerIndices) {
      if (idx >= 0 && idx + 3 < data.length && data[idx + 3] > 100) {
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        validCorners++;
      }
    }

    if (validCorners > 0) {
      bgR = Math.round(sumR / validCorners);
      bgG = Math.round(sumG / validCorners);
      bgB = Math.round(sumB / validCorners);
    }

    let maxDist = 0;
    let bestR = 0;
    let bestG = 0;
    let bestB = 0;
    let found = false;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 120) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      if (dist > 75 && dist > maxDist) {
        maxDist = dist;
        bestR = r;
        bestG = g;
        bestB = b;
        found = true;
      }
    }

    if (!found) {
      const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
      return bgLum < 128 ? '#FFFFFF' : '#000000';
    }

    if (bestR < 35 && bestG < 35 && bestB < 35) return '#000000';
    if (bestR > 235 && bestG > 235 && bestB > 235) return '#FFFFFF';

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(bestR)}${toHex(bestG)}${toHex(bestB)}`;
  } catch (e) {
    return '#000000';
  }
}

function getCssFontFamily(realFontName?: string, fontFamily?: FontFamily): string {
  const primary = realFontName ? `"${realFontName}", ` : '';
  if (fontFamily === 'Times') {
    return `${primary}"Times New Roman", Times, Georgia, serif`;
  }
  if (fontFamily === 'Courier') {
    return `${primary}"Courier New", Courier, monospace`;
  }
  return `${primary}"Calibri", "Helvetica Neue", Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
}

export default function NativePdfEditor({
  file,
  filePrefix = 'Documento_Editado',
  onFinish,
  onSwitchToApryse,
}: NativePdfEditorProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // ── ESTADOS DEL DOCUMENTO Y VISOR ──────────────────────────────────
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // ── PESTAÑA Y HERRAMIENTA ACTIVA (ARQUITECTURA DE ESCRITORIO TIPO APRYSE) ──
  const [activeTab, setActiveTab] = useState<EditorTab>('edit');
  const [activeTool, setActiveTool] = useState<EditorTool>('select');

  // ── DATOS DE EDICIÓN ────────────────────────────────────────────────
  const [extractedTexts, setExtractedTexts] = useState<Record<number, ExtractedText[]>>({});
  const [modifications, setModifications] = useState<TextModification[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [images, setImages] = useState<InsertedImage[]>([]);
  const [stamps, setStamps] = useState<StampItem[]>([]);
  const [pageDimensions, setPageDimensions] = useState<
    Record<number, { width: number; height: number; viewportWidth: number; viewportHeight: number }>
  >({});

  // ── PILA DE HISTORIAL (UNDO / REDO) ─────────────────────────────────
  const [history, setHistory] = useState<EditorStateSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const saveSnapshot = useCallback(() => {
    const snapshot: EditorStateSnapshot = {
      modifications: JSON.parse(JSON.stringify(modifications)),
      annotations: JSON.parse(JSON.stringify(annotations)),
      shapes: JSON.parse(JSON.stringify(shapes)),
      images: JSON.parse(JSON.stringify(images)),
      stamps: JSON.parse(JSON.stringify(stamps)),
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot]);
    setHistoryIndex((prev) => prev + 1);
  }, [modifications, annotations, shapes, images, stamps, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevSnapshot = history[historyIndex - 1];
      setModifications(prevSnapshot.modifications);
      setAnnotations(prevSnapshot.annotations);
      setShapes(prevSnapshot.shapes);
      setImages(prevSnapshot.images);
      setStamps(prevSnapshot.stamps);
      setHistoryIndex(historyIndex - 1);
      toast.info(isEs ? 'Deshecho' : 'Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextSnapshot = history[historyIndex + 1];
      setModifications(nextSnapshot.modifications);
      setAnnotations(nextSnapshot.annotations);
      setShapes(nextSnapshot.shapes);
      setImages(nextSnapshot.images);
      setStamps(nextSnapshot.stamps);
      setHistoryIndex(historyIndex + 1);
      toast.info(isEs ? 'Rehecho' : 'Redo');
    }
  };

  // ── ELEMENTO SELECCIONADO Y PROPIEDADES EN VIVO ─────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    'text' | 'shape' | 'annotation' | 'image' | 'stamp' | null
  >(null);

  // Estados de edición de texto
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingFontFamily, setEditingFontFamily] = useState<FontFamily>('Helvetica');
  const [editingRealFontName, setEditingRealFontName] = useState<string>('Arial');
  const [editingFontSize, setEditingFontSize] = useState<number>(12);
  const [editingColor, setEditingColor] = useState<string>('#000000');
  const [editingBold, setEditingBold] = useState<boolean>(false);
  const [editingItalic, setEditingItalic] = useState<boolean>(false);
  const [editingAlign, setEditingAlign] = useState<'left' | 'center' | 'right'>('left');

  // Estados de dibujo de formas y anotaciones
  const [currentStrokeColor, setCurrentStrokeColor] = useState<string>('#2563EB');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(2);
  const [currentFillColor, setCurrentFillColor] = useState<string>('');
  const [currentOpacity, setCurrentOpacity] = useState<number>(1);
  const [highlightColor, setHighlightColor] = useState<string>('#FDE047'); // Amarillo fluor

  // Estados de modal de firma y sellos
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);

  // Estados de desbloqueo y contraseña
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string>('');

  // Hovered state
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Referencias DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Arrastre y redimensión
  const dragRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    targetId: string | null;
    targetType: 'image' | 'stamp' | 'shape' | 'text' | null;
    startX: number;
    startY: number;
    initXPercent: number;
    initYPercent: number;
    initWPercent: number;
    initHPercent: number;
  }>({
    isDragging: false,
    isResizing: false,
    targetId: null,
    targetType: null,
    startX: 0,
    startY: 0,
    initXPercent: 0,
    initYPercent: 0,
    initWPercent: 0,
    initHPercent: 0,
  });

  // ── 1. INICIALIZAR Y CARGAR PDF CON PDF.JS ──────────────────────────
  const loadPdfDocument = useCallback(
    async (pass = '') => {
      if (!file) return;
      setIsLoading(true);
      setStatusMessage(
        isEs ? 'Cargando documento en Motor In-Situ...' : 'Loading document in Native Engine...',
      );

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const buffer = await file.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          password: pass,
          stopAtErrors: false,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setIsPasswordProtected(false);
        setUnlockedPassword(pass);

        toast.success(
          isEs
            ? `¡Motor In-Situ listo! (${doc.numPages} páginas)`
            : `Native Engine ready! (${doc.numPages} pages)`,
        );
      } catch (err: any) {
        if (err?.name === 'PasswordException' || err?.code === 1) {
          setIsPasswordProtected(true);
          if (pass) {
            toast.error(
              isEs
                ? 'Contraseña incorrecta. Inténtalo de nuevo.'
                : 'Incorrect password. Try again.',
            );
          } else {
            toast.warning(
              isEs
                ? 'El archivo requiere contraseña para abrirse'
                : 'File requires password to open',
            );
          }
        } else {
          console.error('Error al inicializar PDF.js:', err);
          toast.error(
            isEs
              ? 'Error al abrir el PDF con el motor in-situ. Prueba el Motor Apryse.'
              : 'Failed to open PDF with native engine. Try Apryse Engine.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [file, isEs],
  );

  useEffect(() => {
    loadPdfDocument('');

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [loadPdfDocument]);

  // ── 2. RENDERIZAR PÁGINA ACTIVA Y EXTRAER TEXTOS IN-SITU ─────────────
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current || currentPage < 1 || currentPage > totalPages) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {}
      renderTaskRef.current = null;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const textViewport = page.getViewport({ scale: 1.0 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const renderTask = page.render(renderContext as any);
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      // Guardar dimensiones
      setPageDimensions((prev) => ({
        ...prev,
        [currentPage]: {
          width: textViewport.width,
          height: textViewport.height,
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
        },
      }));

      // Extraer textos si aún no se han extraído
      if (!extractedTexts[currentPage]) {
        const textContent = await page.getTextContent();
        const items: ExtractedText[] = [];

        textContent.items.forEach((item: any, idx: number) => {
          if (
            item &&
            typeof item === 'object' &&
            'str' in item &&
            typeof item.str === 'string' &&
            item.str.trim().length > 0 &&
            Array.isArray(item.transform) &&
            item.transform.length >= 6
          ) {
            const tx = item.transform[4];
            const ty = item.transform[5];
            const rawWidth = item.width > 0 ? item.width : item.str.length * 6;
            const fontHeight =
              item.height > 0
                ? item.height
                : Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 11;

            const [vx, vy] = textViewport.convertToViewportPoint(tx, ty);
            const itemLeft = vx;
            const itemTop = vy - fontHeight * 0.82;
            const itemWidth = rawWidth;
            const itemHeight = fontHeight * 1.04;

            const detectedFont = detectFontProperties(page, textContent, item.fontName || '');
            const detectedColor = sampleTextColor(
              ctx,
              itemLeft * scale,
              itemTop * scale,
              itemWidth * scale,
              itemHeight * scale,
              canvas.width,
              canvas.height,
            );

            items.push({
              id: `text-${currentPage}-${idx}-${Date.now()}`,
              str: item.str,
              pageNumber: currentPage,
              pdfX: tx,
              pdfY: ty,
              pdfWidth: rawWidth,
              pdfHeight: fontHeight,
              vx: itemLeft,
              vy: itemTop,
              vWidth: itemWidth,
              vHeight: itemHeight,
              fontSize: Math.round(fontHeight),
              fontName: item.fontName || 'Helvetica',
              detectedFontFamily: detectedFont.fontFamily,
              detectedRealFontName: detectedFont.realFontName,
              detectedIsBold: detectedFont.isBold,
              detectedIsItalic: detectedFont.isItalic,
              detectedColor,
            });
          }
        });

        setExtractedTexts((prev) => ({
          ...prev,
          [currentPage]: items,
        }));
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error al renderizar página:', err);
      }
    }
  }, [currentPage, totalPages, scale, extractedTexts]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Atajos de teclado (Ctrl+Z / Ctrl+Y / Esc / Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedType(null);
        setEditingId(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Solo borrar si no se está escribiendo en un input
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          if (selectedId) {
            handleDeleteSelected();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ── 3. MANEJO DE EDICIÓN IN-SITU DE TEXTO ────────────────────────────
  const updateSelectedTextProperty = useCallback(
    (updates: Partial<TextModification>) => {
      if (selectedId && selectedType === 'text') {
        setModifications((prev) =>
          prev.map((m) => (m.id === selectedId ? { ...m, ...updates } : m)),
        );
      }
    },
    [selectedId, selectedType],
  );

  const handleStartEditingOriginal = (item: ExtractedText) => {
    saveSnapshot();
    const existingMod = modifications.find((m) => m.id === item.id);
    const pDim = pageDimensions[currentPage];
    if (!pDim) return;

    if (existingMod) {
      setEditingId(existingMod.id);
      setSelectedId(existingMod.id);
      setSelectedType('text');
      setEditingText(existingMod.text);
      setEditingFontFamily(existingMod.fontFamily);
      setEditingRealFontName(existingMod.realFontName || 'Arial');
      setEditingFontSize(existingMod.fontSize);
      setEditingColor(existingMod.color);
      setEditingBold(existingMod.isBold);
      setEditingItalic(existingMod.isItalic);
      setEditingAlign(existingMod.align || 'left');
    } else {
      const xPercent = (item.vx / pDim.width) * 100;
      const yPercent = (item.vy / pDim.height) * 100;
      const widthPercent = Math.min(100 - xPercent, Math.max(10, (item.vWidth / pDim.width) * 100));
      const heightPercent = (item.vHeight / pDim.height) * 100;

      const detectedFam = item.detectedFontFamily || 'Helvetica';
      const detectedReal = item.detectedRealFontName || 'Arial';
      const detectedBold = Boolean(item.detectedIsBold);
      const detectedItalic = Boolean(item.detectedIsItalic);
      const detectedColor = item.detectedColor || '#000000';

      const newMod: TextModification = {
        id: item.id,
        pageNumber: currentPage,
        isOriginal: true,
        originalStr: item.str,
        text: item.str,
        pdfX: item.pdfX,
        pdfY: item.pdfY,
        pdfWidth: item.pdfWidth,
        pdfHeight: item.pdfHeight,
        fontSize: item.fontSize,
        fontFamily: detectedFam,
        realFontName: detectedReal,
        color: detectedColor,
        isBold: detectedBold,
        isItalic: detectedItalic,
        align: 'left',
        xPercent,
        yPercent,
        widthPercent,
        heightPercent,
      };

      setModifications((prev) => [...prev.filter((m) => m.id !== item.id), newMod]);
      setEditingId(item.id);
      setSelectedId(item.id);
      setSelectedType('text');
      setEditingText(item.str);
      setEditingFontFamily(detectedFam);
      setEditingRealFontName(detectedReal);
      setEditingFontSize(item.fontSize);
      setEditingColor(detectedColor);
      setEditingBold(detectedBold);
      setEditingItalic(detectedItalic);
      setEditingAlign('left');
    }
  };

  const handleApplyEdit = () => {
    if (!editingId) return;

    setModifications((prev) =>
      prev.map((mod) => {
        if (mod.id === editingId) {
          return {
            ...mod,
            text: editingText,
            fontFamily: editingFontFamily,
            realFontName: editingRealFontName,
            fontSize: editingFontSize,
            color: editingColor,
            isBold: editingBold,
            isItalic: editingItalic,
            align: editingAlign,
          };
        }
        return mod;
      }),
    );

    setEditingId(null);
    toast.success(isEs ? 'Texto actualizado' : 'Text updated');
  };

  const handleCancelEdit = () => {
    if (editingId) {
      const mod = modifications.find((m) => m.id === editingId);
      if (mod && !mod.isOriginal && (!editingText || editingText.trim() === '')) {
        setModifications((prev) => prev.filter((m) => m.id !== editingId));
      }
    }
    setEditingId(null);
  };

  // ── 4. CLIC EN EL LIENZO INTERACTIVO SEGÚN HERRAMIENTA ACTIVA ────────
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    // Si la herramienta es Nuevo Texto
    if (activeTool === 'text') {
      saveSnapshot();
      const newId = `custom-text-${Date.now()}`;
      const newMod: TextModification = {
        id: newId,
        pageNumber: currentPage,
        isOriginal: false,
        text: isEs ? 'Nuevo texto' : 'New text',
        pdfX: 0,
        pdfY: 0,
        pdfWidth: 100,
        pdfHeight: 14,
        fontSize: editingFontSize || 14,
        fontFamily: editingFontFamily || 'Helvetica',
        realFontName: editingRealFontName || 'Arial',
        color: editingColor || '#000000',
        isBold: editingBold || false,
        isItalic: editingItalic || false,
        align: 'left',
        xPercent,
        yPercent,
        widthPercent: 25,
        heightPercent: 4,
      };

      setModifications((prev) => [...prev, newMod]);
      setEditingId(newId);
      setSelectedId(newId);
      setSelectedType('text');
      setEditingText(newMod.text);
      setActiveTool('select');
      toast.success(isEs ? 'Bloque de texto insertado' : 'Text block inserted');
      return;
    }

    // Si la herramienta es Whiteout (Borrador / Censura rápida)
    if (activeTool === 'whiteout') {
      saveSnapshot();
      const newAnnot: AnnotationItem = {
        id: `whiteout-${Date.now()}`,
        pageNumber: currentPage,
        type: 'whiteout',
        color: '#FFFFFF',
        opacity: 1,
        xPercent: Math.max(0, xPercent - 5),
        yPercent: Math.max(0, yPercent - 2),
        widthPercent: 12,
        heightPercent: 4,
      };
      setAnnotations((prev) => [...prev, newAnnot]);
      setSelectedId(newAnnot.id);
      setSelectedType('annotation');
      setActiveTool('select');
      toast.success(isEs ? 'Zona censurada con borrador blanco' : 'Area covered with whiteout');
      return;
    }

    // Si la herramienta es Resaltador (Highlight)
    if (activeTool === 'highlight') {
      saveSnapshot();
      const newAnnot: AnnotationItem = {
        id: `highlight-${Date.now()}`,
        pageNumber: currentPage,
        type: 'highlight',
        color: highlightColor,
        opacity: 0.4,
        xPercent: Math.max(0, xPercent - 8),
        yPercent: Math.max(0, yPercent - 1.5),
        widthPercent: 16,
        heightPercent: 3.5,
      };
      setAnnotations((prev) => [...prev, newAnnot]);
      setSelectedId(newAnnot.id);
      setSelectedType('annotation');
      setActiveTool('select');
      toast.success(isEs ? 'Resaltado aplicado' : 'Highlight applied');
      return;
    }

    // Si la herramienta es Rectángulo
    if (activeTool === 'rectangle') {
      saveSnapshot();
      const newShape: ShapeItem = {
        id: `rect-${Date.now()}`,
        pageNumber: currentPage,
        type: 'rectangle',
        strokeColor: currentStrokeColor,
        strokeWidth: currentStrokeWidth,
        fillColor: currentFillColor,
        opacity: currentOpacity,
        xPercent: Math.max(0, xPercent - 7.5),
        yPercent: Math.max(0, yPercent - 5),
        widthPercent: 15,
        heightPercent: 10,
      };
      setShapes((prev) => [...prev, newShape]);
      setSelectedId(newShape.id);
      setSelectedType('shape');
      setActiveTool('select');
      toast.success(isEs ? 'Rectángulo insertado' : 'Rectangle inserted');
      return;
    }

    // Si la herramienta es Círculo
    if (activeTool === 'circle') {
      saveSnapshot();
      const newShape: ShapeItem = {
        id: `circle-${Date.now()}`,
        pageNumber: currentPage,
        type: 'circle',
        strokeColor: currentStrokeColor,
        strokeWidth: currentStrokeWidth,
        fillColor: currentFillColor,
        opacity: currentOpacity,
        xPercent: Math.max(0, xPercent - 5),
        yPercent: Math.max(0, yPercent - 5),
        widthPercent: 10,
        heightPercent: 10,
      };
      setShapes((prev) => [...prev, newShape]);
      setSelectedId(newShape.id);
      setSelectedType('shape');
      setActiveTool('select');
      toast.success(isEs ? 'Círculo insertado' : 'Circle inserted');
      return;
    }

    // Si la herramienta es Línea
    if (activeTool === 'line') {
      saveSnapshot();
      const newShape: ShapeItem = {
        id: `line-${Date.now()}`,
        pageNumber: currentPage,
        type: 'line',
        strokeColor: currentStrokeColor,
        strokeWidth: currentStrokeWidth,
        opacity: currentOpacity,
        xPercent: Math.max(0, xPercent - 10),
        yPercent,
        widthPercent: 20,
        heightPercent: 1,
      };
      setShapes((prev) => [...prev, newShape]);
      setSelectedId(newShape.id);
      setSelectedType('shape');
      setActiveTool('select');
      toast.success(isEs ? 'Línea insertada' : 'Line inserted');
      return;
    }

    // Si la herramienta es Flecha
    if (activeTool === 'arrow') {
      saveSnapshot();
      const newShape: ShapeItem = {
        id: `arrow-${Date.now()}`,
        pageNumber: currentPage,
        type: 'arrow',
        strokeColor: currentStrokeColor,
        strokeWidth: currentStrokeWidth,
        opacity: currentOpacity,
        xPercent: Math.max(0, xPercent - 8),
        yPercent,
        widthPercent: 16,
        heightPercent: 2,
      };
      setShapes((prev) => [...prev, newShape]);
      setSelectedId(newShape.id);
      setSelectedType('shape');
      setActiveTool('select');
      toast.success(isEs ? 'Flecha insertada' : 'Arrow inserted');
      return;
    }

    // Si la herramienta es Checkmark (✓)
    if (activeTool === 'checkmark') {
      saveSnapshot();
      const newMod: TextModification = {
        id: `chk-${Date.now()}`,
        pageNumber: currentPage,
        isOriginal: false,
        text: '✓',
        pdfX: 0,
        pdfY: 0,
        pdfWidth: 20,
        pdfHeight: 20,
        fontSize: 18,
        fontFamily: 'Helvetica',
        color: '#16A34A',
        isBold: true,
        isItalic: false,
        xPercent,
        yPercent,
        widthPercent: 3,
        heightPercent: 3,
      };
      setModifications((prev) => [...prev, newMod]);
      setSelectedId(newMod.id);
      setSelectedType('text');
      setActiveTool('select');
      toast.success(isEs ? 'Casilla marcada (✓)' : 'Checkmark placed');
      return;
    }

    // Si la herramienta es Cruz (✗)
    if (activeTool === 'crossmark') {
      saveSnapshot();
      const newMod: TextModification = {
        id: `crs-${Date.now()}`,
        pageNumber: currentPage,
        isOriginal: false,
        text: '✗',
        pdfX: 0,
        pdfY: 0,
        pdfWidth: 20,
        pdfHeight: 20,
        fontSize: 18,
        fontFamily: 'Helvetica',
        color: '#DC2626',
        isBold: true,
        isItalic: false,
        xPercent,
        yPercent,
        widthPercent: 3,
        heightPercent: 3,
      };
      setModifications((prev) => [...prev, newMod]);
      setSelectedId(newMod.id);
      setSelectedType('text');
      setActiveTool('select');
      toast.success(isEs ? 'Casilla desmarcada (✗)' : 'Crossmark placed');
      return;
    }

    // Si la herramienta es Fecha de Hoy
    if (activeTool === 'date') {
      saveSnapshot();
      const todayStr = new Intl.DateTimeFormat(isEs ? 'es-PE' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date());

      const newMod: TextModification = {
        id: `date-${Date.now()}`,
        pageNumber: currentPage,
        isOriginal: false,
        text: todayStr,
        pdfX: 0,
        pdfY: 0,
        pdfWidth: 60,
        pdfHeight: 12,
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: '#111827',
        isBold: false,
        isItalic: false,
        xPercent,
        yPercent,
        widthPercent: 12,
        heightPercent: 2.5,
      };
      setModifications((prev) => [...prev, newMod]);
      setSelectedId(newMod.id);
      setSelectedType('text');
      setActiveTool('select');
      toast.success(isEs ? `Fecha insertada: ${todayStr}` : `Date inserted: ${todayStr}`);
      return;
    }

    // Clic en el fondo deselecciona elementos
    setSelectedId(null);
    setSelectedType(null);
  };

  // ── 5. INSERCIÓN DE IMÁGENES, FIRMAS Y SELLOS ───────────────────────
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
      toast.error(
        isEs ? 'Solo se admiten imágenes PNG o JPG' : 'Only PNG or JPG images are allowed',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        saveSnapshot();
        const aspect = img.width / img.height;
        const initialWidthPercent = 25;
        const initialHeightPercent = initialWidthPercent / (aspect || 1);

        const newImage: InsertedImage = {
          id: `img-${Date.now()}`,
          pageNumber: currentPage,
          dataUrl,
          mimeType: file.type as 'image/png' | 'image/jpeg',
          xPercent: 35,
          yPercent: 35,
          widthPercent: initialWidthPercent,
          heightPercent: initialHeightPercent,
          aspectRatio: aspect,
        };

        setImages((prev) => [...prev, newImage]);
        setSelectedId(newImage.id);
        setSelectedType('image');
        toast.success(isEs ? '¡Imagen añadida con éxito!' : 'Image added successfully!');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setActiveTool('select');
  };

  const handleApplySignature = (dataUrl: string) => {
    saveSnapshot();
    const newImage: InsertedImage = {
      id: `sig-${Date.now()}`,
      pageNumber: currentPage,
      dataUrl,
      mimeType: 'image/png',
      xPercent: 40,
      yPercent: 65,
      widthPercent: 20,
      heightPercent: 10,
      aspectRatio: 2.0,
    };
    setImages((prev) => [...prev, newImage]);
    setSelectedId(newImage.id);
    setSelectedType('image');
    toast.success(isEs ? 'Firma estampada con éxito' : 'Signature placed successfully');
  };

  const handleAddStamp = (type: 'APPROVED' | 'CONFIDENTIAL' | 'REVIEWED' | 'DRAFT' | 'PAID') => {
    saveSnapshot();
    const dataUrl = createStampDataUrl(type, isEs ? 'es' : 'en');
    const newStamp: StampItem = {
      id: `stamp-${Date.now()}`,
      pageNumber: currentPage,
      type,
      dataUrl,
      xPercent: 60,
      yPercent: 15,
      widthPercent: 26,
      heightPercent: 9,
    };
    setStamps((prev) => [...prev, newStamp]);
    setSelectedId(newStamp.id);
    setSelectedType('stamp');
    toast.success(isEs ? `Sello "${type}" insertado` : `"${type}" stamp inserted`);
  };

  // ── 6. ELIMINACIÓN DE ELEMENTO SELECCIONADO ─────────────────────────
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    saveSnapshot();

    if (selectedType === 'text') {
      setModifications((prev) => prev.filter((m) => m.id !== selectedId));
    } else if (selectedType === 'annotation') {
      setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
    } else if (selectedType === 'shape') {
      setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    } else if (selectedType === 'image') {
      setImages((prev) => prev.filter((img) => img.id !== selectedId));
    } else if (selectedType === 'stamp') {
      setStamps((prev) => prev.filter((st) => st.id !== selectedId));
    }

    setSelectedId(null);
    setSelectedType(null);
    setEditingId(null);
    toast.success(isEs ? 'Elemento eliminado' : 'Item deleted');
  };

  // ── 7. CONTROLADORES DE ARRASTRE Y REDIMENSIÓN EN VIVO ───────────────
  const handleStartDrag = (
    e: React.MouseEvent,
    id: string,
    type: 'image' | 'stamp' | 'shape' | 'text',
    initX: number,
    initY: number,
    initW: number,
    initH: number,
  ) => {
    e.stopPropagation();
    setSelectedId(id);
    setSelectedType(type);
    dragRef.current = {
      isDragging: true,
      isResizing: false,
      targetId: id,
      targetType: type,
      startX: e.clientX,
      startY: e.clientY,
      initXPercent: initX,
      initYPercent: initY,
      initWPercent: initW,
      initHPercent: initH,
    };
  };

  const handleStartResize = (
    e: React.MouseEvent,
    id: string,
    type: 'image' | 'stamp' | 'shape' | 'text',
    initX: number,
    initY: number,
    initW: number,
    initH: number,
  ) => {
    e.stopPropagation();
    setSelectedId(id);
    setSelectedType(type);
    dragRef.current = {
      isDragging: false,
      isResizing: true,
      targetId: id,
      targetType: type,
      startX: e.clientX,
      startY: e.clientY,
      initXPercent: initX,
      initYPercent: initY,
      initWPercent: initW,
      initHPercent: initH,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = dragRef.current;
      if (!state.targetId || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();

      const deltaXPercent = ((e.clientX - state.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - state.startY) / rect.height) * 100;

      if (state.isDragging) {
        const newX = Math.max(0, Math.min(95, state.initXPercent + deltaXPercent));
        const newY = Math.max(0, Math.min(95, state.initYPercent + deltaYPercent));

        if (state.targetType === 'image') {
          setImages((prev) =>
            prev.map((item) =>
              item.id === state.targetId ? { ...item, xPercent: newX, yPercent: newY } : item,
            ),
          );
        } else if (state.targetType === 'stamp') {
          setStamps((prev) =>
            prev.map((item) =>
              item.id === state.targetId ? { ...item, xPercent: newX, yPercent: newY } : item,
            ),
          );
        } else if (state.targetType === 'shape') {
          setShapes((prev) =>
            prev.map((item) =>
              item.id === state.targetId ? { ...item, xPercent: newX, yPercent: newY } : item,
            ),
          );
        } else if (state.targetType === 'text') {
          setModifications((prev) =>
            prev.map((item) =>
              item.id === state.targetId ? { ...item, xPercent: newX, yPercent: newY } : item,
            ),
          );
        }
      } else if (state.isResizing) {
        const newW = Math.max(
          3,
          Math.min(100 - state.initXPercent, state.initWPercent + deltaXPercent),
        );
        const newH = Math.max(
          2,
          Math.min(100 - state.initYPercent, state.initHPercent + deltaYPercent),
        );

        if (state.targetType === 'image') {
          setImages((prev) =>
            prev.map((item) =>
              item.id === state.targetId
                ? {
                    ...item,
                    widthPercent: newW,
                    heightPercent: newW / (item.aspectRatio || 1),
                  }
                : item,
            ),
          );
        } else if (state.targetType === 'stamp') {
          setStamps((prev) =>
            prev.map((item) =>
              item.id === state.targetId
                ? { ...item, widthPercent: newW, heightPercent: newH }
                : item,
            ),
          );
        } else if (state.targetType === 'shape') {
          setShapes((prev) =>
            prev.map((item) =>
              item.id === state.targetId
                ? { ...item, widthPercent: newW, heightPercent: newH }
                : item,
            ),
          );
        }
      }
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      dragRef.current.isResizing = false;
      dragRef.current.targetId = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ── 8. COMPILADOR VECTORIAL COMPLETO CON PDF-LIB ─────────────────────
  const handleSaveDocument = async () => {
    if (!file) return;
    setIsSaving(true);
    setSaveProgress(15);
    setStatusMessage(
      isEs ? 'Cargando bytes del documento original...' : 'Loading original document bytes...',
    );

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });

      setSaveProgress(30);
      setStatusMessage(
        isEs
          ? 'Compilando tipografías y vectores de alta fidelidad...'
          : 'Compiling fonts and high-fidelity vectors...',
      );

      // Embeber fuentes estándar
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);
      const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
      const courierOblique = await pdfDoc.embedFont(StandardFonts.CourierOblique);
      const courierBoldOblique = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

      const getFont = (family: FontFamily, isBold: boolean, isItalic: boolean) => {
        if (family === 'Times') {
          if (isBold && isItalic) return timesBoldItalic;
          if (isBold) return timesBold;
          if (isItalic) return timesItalic;
          return timesRoman;
        }
        if (family === 'Courier') {
          if (isBold && isItalic) return courierBoldOblique;
          if (isBold) return courierBold;
          if (isItalic) return courierOblique;
          return courier;
        }
        if (isBold && isItalic) return helveticaBoldOblique;
        if (isBold) return helveticaBold;
        if (isItalic) return helveticaOblique;
        return helvetica;
      };

      const hexToRgbPdf = (hex: string) => {
        const cleaned = hex.replace('#', '');
        const r = parseInt(cleaned.substring(0, 2), 16) / 255 || 0;
        const g = parseInt(cleaned.substring(2, 4), 16) / 255 || 0;
        const b = parseInt(cleaned.substring(4, 6), 16) / 255 || 0;
        return rgb(r, g, b);
      };

      const pages = pdfDoc.getPages();

      // 1. Aplicar Anotaciones y Resaltados
      annotations.forEach((annot) => {
        if (annot.pageNumber > 0 && annot.pageNumber <= pages.length) {
          const page = pages[annot.pageNumber - 1];
          const { width, height } = page.getSize();

          const x = (annot.xPercent / 100) * width;
          const y = height - (annot.yPercent / 100) * height - (annot.heightPercent / 100) * height;
          const w = (annot.widthPercent / 100) * width;
          const h = (annot.heightPercent / 100) * height;

          if (annot.type === 'whiteout') {
            page.drawRectangle({
              x,
              y,
              width: w,
              height: h,
              color: rgb(1, 1, 1),
            });
          } else if (annot.type === 'highlight') {
            page.drawRectangle({
              x,
              y,
              width: w,
              height: h,
              color: hexToRgbPdf(annot.color),
              opacity: annot.opacity || 0.35,
            });
          }
        }
      });

      // 2. Aplicar Formas Vectoriales (Rectángulos, Círculos, Líneas)
      shapes.forEach((shape) => {
        if (shape.pageNumber > 0 && shape.pageNumber <= pages.length) {
          const page = pages[shape.pageNumber - 1];
          const { width, height } = page.getSize();

          const x = (shape.xPercent / 100) * width;
          const y = height - (shape.yPercent / 100) * height - (shape.heightPercent / 100) * height;
          const w = (shape.widthPercent / 100) * width;
          const h = (shape.heightPercent / 100) * height;

          if (shape.type === 'rectangle') {
            page.drawRectangle({
              x,
              y,
              width: w,
              height: h,
              borderColor: hexToRgbPdf(shape.strokeColor),
              borderWidth: shape.strokeWidth,
              color: shape.fillColor ? hexToRgbPdf(shape.fillColor) : undefined,
              opacity: shape.opacity,
            });
          } else if (shape.type === 'circle') {
            page.drawEllipse({
              x: x + w / 2,
              y: y + h / 2,
              xScale: w / 2,
              yScale: h / 2,
              borderColor: hexToRgbPdf(shape.strokeColor),
              borderWidth: shape.strokeWidth,
              color: shape.fillColor ? hexToRgbPdf(shape.fillColor) : undefined,
              opacity: shape.opacity,
            });
          } else if (shape.type === 'line' || shape.type === 'arrow') {
            page.drawLine({
              start: { x, y: y + h / 2 },
              end: { x: x + w, y: y + h / 2 },
              thickness: shape.strokeWidth,
              color: hexToRgbPdf(shape.strokeColor),
              opacity: shape.opacity,
            });
          }
        }
      });

      // 3. Aplicar Textos (Modificados y Nuevos)
      modifications.forEach((mod) => {
        if (mod.pageNumber > 0 && mod.pageNumber <= pages.length) {
          const page = pages[mod.pageNumber - 1];
          const { width, height } = page.getSize();

          // Si es original, neutralizar el texto original con fondo blanco calibrado
          if (mod.isOriginal) {
            const fSize = mod.pdfHeight || mod.fontSize || 11;
            const descenderOffset = fSize * 0.2;
            const rectHeight = fSize * 1.0;

            page.drawRectangle({
              x: Math.max(0, mod.pdfX - 0.5),
              y: Math.max(0, mod.pdfY - descenderOffset),
              width: mod.pdfWidth + 1.0,
              height: rectHeight,
              color: rgb(1, 1, 1),
            });
          }

          const font = getFont(mod.fontFamily, mod.isBold, mod.isItalic);
          const color = hexToRgbPdf(mod.color);

          let targetX = mod.pdfX;
          let targetY = mod.pdfY;

          if (!mod.isOriginal) {
            targetX = (mod.xPercent / 100) * width;
            targetY = height - (mod.yPercent / 100) * height - mod.fontSize;
          }

          // Soporte multilínea
          const lines = mod.text.split('\n');
          lines.forEach((lineText, idx) => {
            const lineY = targetY - idx * (mod.fontSize * 1.25);
            page.drawText(lineText, {
              x: targetX,
              y: lineY,
              size: mod.fontSize,
              font,
              color,
            });
          });
        }
      });

      // 4. Aplicar Imágenes y Firmas
      for (const img of images) {
        if (img.pageNumber > 0 && img.pageNumber <= pages.length) {
          const page = pages[img.pageNumber - 1];
          const { width, height } = page.getSize();

          const imgBytes = await fetch(img.dataUrl).then((r) => r.arrayBuffer());
          const embeddedImg =
            img.mimeType === 'image/jpeg'
              ? await pdfDoc.embedJpg(imgBytes)
              : await pdfDoc.embedPng(imgBytes);

          const imgW = (img.widthPercent / 100) * width;
          const imgH = (img.heightPercent / 100) * height;
          const imgX = (img.xPercent / 100) * width;
          const imgY = height - (img.yPercent / 100) * height - imgH;

          page.drawImage(embeddedImg, {
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
          });
        }
      }

      // 5. Aplicar Sellos Oficiales
      for (const stamp of stamps) {
        if (stamp.pageNumber > 0 && stamp.pageNumber <= pages.length) {
          const page = pages[stamp.pageNumber - 1];
          const { width, height } = page.getSize();

          const stampBytes = await fetch(stamp.dataUrl).then((r) => r.arrayBuffer());
          const embeddedStamp = await pdfDoc.embedPng(stampBytes);

          const sW = (stamp.widthPercent / 100) * width;
          const sH = (stamp.heightPercent / 100) * height;
          const sX = (stamp.xPercent / 100) * width;
          const sY = height - (stamp.yPercent / 100) * height - sH;

          page.drawImage(embeddedStamp, {
            x: sX,
            y: sY,
            width: sW,
            height: sH,
          });
        }
      }

      setSaveProgress(90);
      setStatusMessage(isEs ? 'Finalizando archivo...' : 'Finalizing document...');

      const savedBytes = await pdfDoc.save();
      const outputBlob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      setSaveProgress(100);
      toast.success(isEs ? '¡Documento guardado con éxito!' : 'Document saved successfully!');
      onFinish(outputBlob, pages.length);
    } catch (err: any) {
      console.error('Error al compilar documento:', err);
      toast.error(isEs ? 'Error al compilar el PDF modificado' : 'Failed to compile modified PDF');
    } finally {
      setIsSaving(false);
      setStatusMessage('');
    }
  };

  // Render elements
  const currentExtracted = extractedTexts[currentPage] || [];
  const currentModifications = modifications.filter((m) => m.pageNumber === currentPage);
  const currentAnnotations = annotations.filter((a) => a.pageNumber === currentPage);
  const currentShapes = shapes.filter((s) => s.pageNumber === currentPage);
  const currentImages = images.filter((img) => img.pageNumber === currentPage);
  const currentStamps = stamps.filter((st) => st.pageNumber === currentPage);
  const pDimensions = pageDimensions[currentPage];

  return (
    <div className="w-full flex flex-col bg-[#0b0b0e] text-white rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden font-mono">
      {/* ── BARRA SUPERIOR DE PESTAÑAS Y HERRAMIENTAS CORPORATIVAS (TIPO APRYSE) ── */}
      <div className="bg-[#121218] border-b border-zinc-800">
        {/* FILA 1: PESTAÑAS PRINCIPALES Y ACCIÓN DE GUARDADO */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80">
          {/* Lado izquierdo: Controles de navegación y Pestañas */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Drawer Miniaturas */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSidebarOpen
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
              title={isEs ? 'Mostrar/Ocultar miniaturas' : 'Toggle page thumbnails'}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Paginación */}
            <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-zinc-300 px-1 font-mono">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                disabled={scale <= 0.8}
                onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-zinc-300 w-12 text-center font-mono">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                disabled={scale >= 2.2}
                onClick={() => setScale((s) => Math.min(2.2, s + 0.2))}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

            {/* PESTAÑAS ESTILO DESKTOP (APRYSE CLASS) */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800 text-xs font-sans">
              {(
                [
                  { id: 'edit', labelEs: 'Editar', labelEn: 'Edit', icon: Type },
                  { id: 'annotate', labelEs: 'Anotar', labelEn: 'Annotate', icon: Highlighter },
                  { id: 'shapes', labelEs: 'Formas', labelEn: 'Shapes', icon: Square },
                  { id: 'insert', labelEs: 'Insertar', labelEn: 'Insert', icon: ImageIcon },
                  { id: 'fill-sign', labelEs: 'Firmar', labelEn: 'Fill & Sign', icon: PenTool },
                  { id: 'view', labelEs: 'Vista', labelEn: 'View', icon: Eye },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{isEs ? tab.labelEs : tab.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lado derecho: Deshacer / Rehacer y Guardar */}
          <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer rounded hover:bg-zinc-800"
                title={isEs ? 'Deshacer (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer rounded hover:bg-zinc-800"
                title={isEs ? 'Rehacer (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alternar a Apryse si está disponible */}
            {onSwitchToApryse && (
              <button
                type="button"
                onClick={onSwitchToApryse}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-950/40 text-purple-300 border border-purple-800/60 hover:bg-purple-900/50 flex items-center gap-1.5 cursor-pointer transition-all"
                title={isEs ? 'Cambiar a Motor Avanzado Apryse' : 'Switch to Apryse Engine'}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Apryse WASM</span>
              </button>
            )}

            {/* Guardar y Finalizar */}
            <button
              type="button"
              disabled={isSaving || isLoading}
              onClick={handleSaveDocument}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEs ? 'Compilando...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEs ? 'Finalizar y Guardar →' : 'Finish & Save →'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FILA 2: SUB-BARRA DE HERRAMIENTAS SEGÚN LA PESTAÑA ACTIVA */}
        <div className="px-4 py-2 flex flex-wrap items-center gap-2 bg-[#0c0c11]">
          {/* PESTAÑA: EDITAR */}
          {activeTab === 'edit' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'select'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>{isEs ? 'Editar In-Situ' : 'In-Situ Edit'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'text'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEs ? '+ Nuevo Texto' : '+ Add Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('whiteout')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'whiteout'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
                title={isEs ? 'Ocultar o borrar texto con máscara blanca' : 'Whiteout / Eraser'}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>{isEs ? 'Borrador / Whiteout' : 'Whiteout'}</span>
              </button>
            </>
          )}

          {/* PESTAÑA: ANOTAR */}
          {activeTab === 'annotate' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTool('highlight')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'highlight'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
                <span>{isEs ? 'Resaltador' : 'Highlighter'}</span>
              </button>

              {/* Colores de Resaltador */}
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                {[
                  { name: 'Amarillo', hex: '#FDE047' },
                  { name: 'Verde', hex: '#86EFAC' },
                  { name: 'Celeste', hex: '#93C5FD' },
                  { name: 'Rosa', hex: '#F472B6' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      setHighlightColor(col.hex);
                      setActiveTool('highlight');
                    }}
                    style={{ backgroundColor: col.hex }}
                    className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${
                      highlightColor === col.hex ? 'border-white scale-125' : 'border-transparent'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            </>
          )}

          {/* PESTAÑA: FORMAS */}
          {activeTab === 'shapes' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTool('rectangle')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'rectangle'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>{isEs ? 'Rectángulo' : 'Rectangle'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('circle')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'circle'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>{isEs ? 'Círculo' : 'Circle'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('line')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'line'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>{isEs ? 'Línea' : 'Line'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('arrow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'arrow'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{isEs ? 'Flecha' : 'Arrow'}</span>
              </button>
            </>
          )}

          {/* PESTAÑA: INSERTAR */}
          {activeTab === 'insert' && (
            <>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{isEs ? '+ Subir Imagen' : '+ Upload Image'}</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div className="h-4 w-px bg-zinc-800 mx-1" />

              <span className="text-[11px] text-zinc-400 font-bold">
                {isEs ? 'Sellos Oficiales:' : 'Stamps:'}
              </span>

              {[
                {
                  type: 'APPROVED' as const,
                  label: 'APROBADO',
                  color: 'border-emerald-500 text-emerald-400',
                },
                {
                  type: 'CONFIDENTIAL' as const,
                  label: 'CONFIDENCIAL',
                  color: 'border-red-500 text-red-400',
                },
                {
                  type: 'REVIEWED' as const,
                  label: 'REVISADO',
                  color: 'border-blue-500 text-blue-400',
                },
                {
                  type: 'DRAFT' as const,
                  label: 'BORRADOR',
                  color: 'border-amber-500 text-amber-400',
                },
                { type: 'PAID' as const, label: 'PAGADO', color: 'border-teal-500 text-teal-400' },
              ].map((st) => (
                <button
                  key={st.type}
                  type="button"
                  onClick={() => handleAddStamp(st.type)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-black/40 hover:bg-zinc-800 cursor-pointer transition-all ${st.color}`}
                >
                  {st.label}
                </button>
              ))}
            </>
          )}

          {/* PESTAÑA: FIRMAR Y RELLENAR */}
          {activeTab === 'fill-sign' && (
            <>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{isEs ? '✍️ Crear Firma Manuscrita' : '✍️ Draw Signature'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('checkmark')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'checkmark'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-emerald-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isEs ? 'Casilla (✓)' : 'Checkmark (✓)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('crossmark')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'crossmark'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-red-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isEs ? 'Cruz (✗)' : 'Cross (✗)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('date')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTool === 'date'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isEs ? 'Fecha de Hoy' : 'Date'}</span>
              </button>
            </>
          )}

          {/* PESTAÑA: VISTA */}
          {activeTab === 'view' && (
            <>
              <button
                type="button"
                onClick={() => setScale(1.0)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setScale(1.35)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
              >
                {isEs ? 'Ajustar al Ancho' : 'Fit Width'}
              </button>
              <button
                type="button"
                onClick={() => setScale(0.95)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
              >
                {isEs ? 'Página Completa' : 'Fit Page'}
              </button>
            </>
          )}
        </div>

        {/* BARRA DE PROPIEDADES CONTEXTUALES FLOTANTE */}
        {selectedId && (
          <PropertyBar
            selectedType={selectedType}
            fontFamily={editingFontFamily}
            onChangeFontFamily={(font) => {
              setEditingFontFamily(font);
              updateSelectedTextProperty({ fontFamily: font });
            }}
            realFontName={editingRealFontName}
            onChangeRealFontName={(name) => {
              setEditingRealFontName(name);
              updateSelectedTextProperty({ realFontName: name });
            }}
            fontSize={editingFontSize}
            onChangeFontSize={(size) => {
              setEditingFontSize(size);
              updateSelectedTextProperty({ fontSize: size });
            }}
            textColor={editingColor}
            onChangeTextColor={(color) => {
              setEditingColor(color);
              updateSelectedTextProperty({ color });
            }}
            isBold={editingBold}
            onToggleBold={() => {
              const nb = !editingBold;
              setEditingBold(nb);
              updateSelectedTextProperty({ isBold: nb });
            }}
            isItalic={editingItalic}
            onToggleItalic={() => {
              const ni = !editingItalic;
              setEditingItalic(ni);
              updateSelectedTextProperty({ isItalic: ni });
            }}
            textAlign={editingAlign}
            onChangeTextAlign={(align) => {
              setEditingAlign(align);
              updateSelectedTextProperty({ align });
            }}
            strokeColor={currentStrokeColor}
            onChangeStrokeColor={setCurrentStrokeColor}
            strokeWidth={currentStrokeWidth}
            onChangeStrokeWidth={setCurrentStrokeWidth}
            fillColor={currentFillColor}
            onChangeFillColor={setCurrentFillColor}
            opacity={currentOpacity}
            onChangeOpacity={setCurrentOpacity}
            onDelete={handleDeleteSelected}
            onApply={editingId ? handleApplyEdit : undefined}
            onCancel={editingId ? handleCancelEdit : undefined}
            lang={isEs ? 'es' : 'en'}
          />
        )}
      </div>

      {/* ── ÁREA DE TRABAJO PRINCIPAL: SIDEBAR + VISOR CANVAS CON OVERLAY ── */}
      <div className="flex-1 min-h-[640px] flex relative overflow-hidden bg-[#070709]">
        {/* Panel Lateral de Miniaturas */}
        <ThumbnailsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          totalPages={totalPages}
          currentPage={currentPage}
          onSelectPage={(p) => setCurrentPage(p)}
          pdfDoc={pdfDocRef.current}
          lang={isEs ? 'es' : 'en'}
        />

        {/* Visor central del documento */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
          {isPasswordProtected ? (
            /* Pantalla de contraseña */
            <div className="flex flex-col items-center justify-center p-8 bg-[#121217] border border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-4">
              <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-emerald-400">
                <Lock className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase">
                {isEs ? 'Documento Protegido' : 'Password Protected'}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadPdfDocument(passwordInput);
                }}
                className="w-full space-y-3"
              >
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={isEs ? 'Contraseña del PDF...' : 'PDF Password...'}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-700 text-white text-center text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                >
                  {isEs ? 'Desbloquear y Editar' : 'Unlock & Edit'}
                </button>
              </form>
            </div>
          ) : isLoading ? (
            /* Spinner de carga */
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs text-zinc-400">{statusMessage}</p>
            </div>
          ) : (
            /* Lienzo PDF + Overlay de edición */
            <div
              className="relative shadow-2xl bg-white select-none transition-transform duration-100"
              style={{
                width: pDimensions?.viewportWidth || 'auto',
                height: pDimensions?.viewportHeight || 'auto',
              }}
            >
              <canvas ref={canvasRef} className="block pointer-events-none" />

              {/* OVERLAY INTERACTIVO */}
              <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className="absolute inset-0 cursor-crosshair overflow-hidden"
              >
                {/* 1. Textos Originales Detectados (In-situ) */}
                {pDimensions &&
                  currentExtracted.map((item) => {
                    const left = (item.vx / pDimensions.width) * 100;
                    const top = (item.vy / pDimensions.height) * 100;
                    const width = (item.vWidth / pDimensions.width) * 100;
                    const height = (item.vHeight / pDimensions.height) * 100;

                    const isModified = modifications.some((m) => m.id === item.id);
                    if (isModified) return null;

                    const isHovered = hoveredTextId === item.id;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredTextId(item.id)}
                        onMouseLeave={() => setHoveredTextId(null)}
                        onDoubleClick={() => handleStartEditingOriginal(item)}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${Math.max(2, width)}%`,
                          height: `${Math.max(2, height)}%`,
                        }}
                        className={`group transition-all select-none cursor-text ${
                          isHovered
                            ? 'bg-blue-500/15 border border-blue-400 rounded-xs'
                            : 'border border-transparent hover:border-blue-300/60'
                        }`}
                        title={
                          isEs
                            ? 'Doble clic para editar texto in-situ'
                            : 'Double click to edit text in-situ'
                        }
                      >
                        {isHovered && (
                          <div className="absolute -top-5 left-0 bg-blue-600 text-[9px] text-white font-mono px-1 rounded shadow pointer-events-none whitespace-nowrap z-30">
                            {isEs ? 'Doble clic para editar' : 'Double click to edit'}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* 2. Anotaciones y Resaltados */}
                {currentAnnotations.map((annot) => {
                  const isSelected = selectedId === annot.id;
                  return (
                    <div
                      key={annot.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(annot.id);
                        setSelectedType('annotation');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${annot.xPercent}%`,
                        top: `${annot.yPercent}%`,
                        width: `${annot.widthPercent}%`,
                        height: `${annot.heightPercent}%`,
                        backgroundColor: annot.color,
                        opacity: annot.opacity,
                        zIndex: 10,
                      }}
                      className={`group ${
                        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-400'
                      }`}
                    />
                  );
                })}

                {/* 3. Formas Vectoriales */}
                {currentShapes.map((shape) => {
                  const isSelected = selectedId === shape.id;
                  return (
                    <div
                      key={shape.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(shape.id);
                        setSelectedType('shape');
                      }}
                      onMouseDown={(e) =>
                        handleStartDrag(
                          e,
                          shape.id,
                          'shape',
                          shape.xPercent,
                          shape.yPercent,
                          shape.widthPercent,
                          shape.heightPercent,
                        )
                      }
                      style={{
                        position: 'absolute',
                        left: `${shape.xPercent}%`,
                        top: `${shape.yPercent}%`,
                        width: `${shape.widthPercent}%`,
                        height: `${shape.heightPercent}%`,
                        borderWidth: `${shape.strokeWidth}px`,
                        borderStyle: 'solid',
                        borderColor: shape.strokeColor,
                        backgroundColor: shape.fillColor || 'transparent',
                        borderRadius: shape.type === 'circle' ? '9999px' : '0px',
                        opacity: shape.opacity,
                        zIndex: 12,
                      }}
                      className={`cursor-move ${
                        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-400'
                      }`}
                    >
                      {isSelected && (
                        <div
                          onMouseDown={(e) =>
                            handleStartResize(
                              e,
                              shape.id,
                              'shape',
                              shape.xPercent,
                              shape.yPercent,
                              shape.widthPercent,
                              shape.heightPercent,
                            )
                          }
                          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-xs cursor-se-resize"
                        />
                      )}
                    </div>
                  );
                })}

                {/* 4. Textos Modificados y Nuevos */}
                {pDimensions &&
                  currentModifications.map((mod) => {
                    const isEditingThis = editingId === mod.id;
                    const isSelected = selectedId === mod.id;

                    return (
                      <div
                        key={mod.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(mod.id);
                          setSelectedType('text');
                          setEditingText(mod.text);
                          setEditingFontFamily(mod.fontFamily);
                          setEditingRealFontName(mod.realFontName || 'Arial');
                          setEditingFontSize(mod.fontSize);
                          setEditingColor(mod.color);
                          setEditingBold(mod.isBold);
                          setEditingItalic(mod.isItalic);
                          setEditingAlign(mod.align || 'left');
                        }}
                        onMouseDown={(e) =>
                          !isEditingThis &&
                          handleStartDrag(
                            e,
                            mod.id,
                            'text',
                            mod.xPercent,
                            mod.yPercent,
                            mod.widthPercent,
                            mod.heightPercent,
                          )
                        }
                        style={{
                          position: 'absolute',
                          left: `${mod.xPercent}%`,
                          top: `${mod.yPercent}%`,
                          minWidth: `${mod.widthPercent}%`,
                          zIndex: isEditingThis ? 25 : 15,
                        }}
                        className={`group ${
                          isEditingThis
                            ? 'ring-2 ring-blue-500 bg-white shadow-lg'
                            : isSelected
                              ? 'ring-2 ring-blue-500 cursor-move'
                              : 'cursor-pointer hover:ring-1 hover:ring-blue-400/80'
                        }`}
                      >
                        {isEditingThis ? (
                          <textarea
                            autoFocus
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleApplyEdit();
                              }
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            style={{
                              fontSize: `${mod.fontSize * scale}px`,
                              fontFamily: getCssFontFamily(
                                mod.realFontName || editingRealFontName,
                                editingFontFamily,
                              ),
                              color: editingColor,
                              fontWeight: editingBold ? 'bold' : 'normal',
                              fontStyle: editingItalic ? 'italic' : 'normal',
                              lineHeight: 1.15,
                              textAlign: editingAlign,
                            }}
                            className="w-full bg-white outline-none px-1 py-0.5 border-0 resize-none overflow-hidden"
                            rows={Math.max(1, editingText.split('\n').length)}
                          />
                        ) : (
                          <div
                            onDoubleClick={() => {
                              setEditingId(mod.id);
                              setSelectedId(mod.id);
                              setSelectedType('text');
                              setEditingText(mod.text);
                              setEditingFontFamily(mod.fontFamily);
                              setEditingRealFontName(mod.realFontName || 'Arial');
                              setEditingFontSize(mod.fontSize);
                              setEditingColor(mod.color);
                              setEditingBold(mod.isBold);
                              setEditingItalic(mod.isItalic);
                              setEditingAlign(mod.align || 'left');
                            }}
                            style={{
                              fontSize: `${mod.fontSize * scale}px`,
                              fontFamily: getCssFontFamily(mod.realFontName, mod.fontFamily),
                              color: mod.color,
                              fontWeight: mod.isBold ? 'bold' : 'normal',
                              fontStyle: mod.isItalic ? 'italic' : 'normal',
                              backgroundColor: mod.isOriginal ? '#FFFFFF' : 'transparent',
                              lineHeight: 1.15,
                              textAlign: mod.align || 'left',
                            }}
                            className="px-0.5 whitespace-pre select-none"
                          >
                            {mod.text}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* 5. Imágenes y Firmas Insertadas */}
                {currentImages.map((img) => {
                  const isSelected = selectedId === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(img.id);
                        setSelectedType('image');
                      }}
                      onMouseDown={(e) =>
                        handleStartDrag(
                          e,
                          img.id,
                          'image',
                          img.xPercent,
                          img.yPercent,
                          img.widthPercent,
                          img.heightPercent,
                        )
                      }
                      style={{
                        position: 'absolute',
                        left: `${img.xPercent}%`,
                        top: `${img.yPercent}%`,
                        width: `${img.widthPercent}%`,
                        height: `${img.heightPercent}%`,
                        zIndex: isSelected ? 20 : 12,
                      }}
                      className={`group select-none cursor-move ${
                        isSelected
                          ? 'border-2 border-blue-500 shadow-xl'
                          : 'border border-dashed border-blue-400/50 hover:border-blue-400'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.dataUrl}
                        alt="Elemento"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      {isSelected && (
                        <div
                          onMouseDown={(e) =>
                            handleStartResize(
                              e,
                              img.id,
                              'image',
                              img.xPercent,
                              img.yPercent,
                              img.widthPercent,
                              img.heightPercent,
                            )
                          }
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 border border-white rounded-xs cursor-se-resize z-30 shadow"
                        />
                      )}
                    </div>
                  );
                })}

                {/* 6. Sellos Oficiales */}
                {currentStamps.map((stamp) => {
                  const isSelected = selectedId === stamp.id;
                  return (
                    <div
                      key={stamp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(stamp.id);
                        setSelectedType('stamp');
                      }}
                      onMouseDown={(e) =>
                        handleStartDrag(
                          e,
                          stamp.id,
                          'stamp',
                          stamp.xPercent,
                          stamp.yPercent,
                          stamp.widthPercent,
                          stamp.heightPercent,
                        )
                      }
                      style={{
                        position: 'absolute',
                        left: `${stamp.xPercent}%`,
                        top: `${stamp.yPercent}%`,
                        width: `${stamp.widthPercent}%`,
                        height: `${stamp.heightPercent}%`,
                        zIndex: isSelected ? 22 : 14,
                      }}
                      className={`group select-none cursor-move ${
                        isSelected ? 'border-2 border-blue-500 shadow-xl' : 'hover:scale-105'
                      } transition-transform`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stamp.dataUrl}
                        alt={stamp.type}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      {isSelected && (
                        <div
                          onMouseDown={(e) =>
                            handleStartResize(
                              e,
                              stamp.id,
                              'stamp',
                              stamp.xPercent,
                              stamp.yPercent,
                              stamp.widthPercent,
                              stamp.heightPercent,
                            )
                          }
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 border border-white rounded-xs cursor-se-resize z-30 shadow"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE FIRMA DIGITAL MANUSCRITA ── */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onApply={handleApplySignature}
        lang={isEs ? 'es' : 'en'}
      />

      {/* ── PIE DEL EDITOR: ESTADO Y GARANTÍA TÉCNICA ── */}
      <div className="bg-[#121218] border-t border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px]">
            {isEs
              ? 'Motor In-Situ Nativo Pro • 100% Vectorial sin Marcas de Agua'
              : 'Native In-Situ Engine Pro • 100% Vectorial Changes Without Watermarks'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>
            {isEs ? 'Modificaciones:' : 'Active changes:'}{' '}
            <strong className="text-white">
              {modifications.length +
                annotations.length +
                shapes.length +
                images.length +
                stamps.length}
            </strong>
          </span>
          <span>
            {isEs ? 'Página:' : 'Page:'} <strong className="text-white">{currentPage}</strong> /{' '}
            {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}
