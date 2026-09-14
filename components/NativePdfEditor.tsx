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
} from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useLanguage } from '@/context/LanguageContext';

export interface NativePdfEditorProps {
  file: File;
  filePrefix?: string;
  onFinish: (blob: Blob, totalPages: number) => void;
  onSwitchToApryse?: () => void;
}

// Estructura de texto extraído in-situ de la página
interface ExtractedText {
  id: string;
  str: string;
  pageNumber: number;
  // Coordenadas en espacio nativo de PDF (puntos)
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  // Coordenadas en Viewport a escala 1.0 (px)
  vx: number;
  vy: number;
  vWidth: number;
  vHeight: number;
  fontSize: number;
  fontName: string;
}

// Estructura de texto modificado o nuevo
interface TextModification {
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
  fontFamily: 'Helvetica' | 'Times' | 'Courier';
  color: string; // #RRGGBB
  isBold: boolean;
  isItalic: boolean;
  // Coordenadas porcentuales para renderizado responsive
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

// Estructura de imagen insertada
interface InsertedImage {
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

export default function NativePdfEditor({
  file,
  filePrefix = 'Documento_Editado',
  onFinish,
  onSwitchToApryse,
}: NativePdfEditorProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // Estados del documento
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Herramienta activa: 'select' (editar in-situ) | 'text' (nuevo texto) | 'image'
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image'>('select');

  // Datos de edición
  const [extractedTexts, setExtractedTexts] = useState<Record<number, ExtractedText[]>>({});
  const [modifications, setModifications] = useState<TextModification[]>([]);
  const [images, setImages] = useState<InsertedImage[]>([]);
  const [pageDimensions, setPageDimensions] = useState<
    Record<number, { width: number; height: number; viewportWidth: number; viewportHeight: number }>
  >({});

  // Editor Inline activo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingFontFamily, setEditingFontFamily] = useState<'Helvetica' | 'Times' | 'Courier'>(
    'Helvetica',
  );
  const [editingFontSize, setEditingFontSize] = useState<number>(12);
  const [editingColor, setEditingColor] = useState<string>('#000000');
  const [editingBold, setEditingBold] = useState<boolean>(false);
  const [editingItalic, setEditingItalic] = useState<boolean>(false);

  // Estados de desbloqueo y contraseña
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string>('');

  // Elemento seleccionado (para mover o eliminar)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Referencias DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Arrastre y redimensionado de imágenes
  const dragRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    targetId: string | null;
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

      // Guardar dimensiones de página nativa y viewport
      setPageDimensions((prev) => ({
        ...prev,
        [currentPage]: {
          width: textViewport.width,
          height: textViewport.height,
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
        },
      }));

      // Extraer textos si aún no se han extraído para esta página
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

            items.push({
              id: `text-${currentPage}-${idx}-${Date.now()}`,
              str: item.str,
              pageNumber: currentPage,
              pdfX: tx,
              pdfY: ty,
              pdfWidth: rawWidth,
              pdfHeight: fontHeight,
              vx,
              vy: vy - fontHeight * 0.82, // Calibrado al borde superior exacto de los ascendentes
              vWidth: rawWidth,
              vHeight: fontHeight * 1.04, // Abarca exactamente desde ascendentes hasta descendentes
              fontSize: Math.round(fontHeight),
              fontName: item.fontName || 'Helvetica',
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

  // ── 3. MANEJO DE EDICIÓN IN-SITU DE TEXTO ORIGINAL ──────────────────
  const handleStartEditingOriginal = (item: ExtractedText) => {
    // Si ya existe una modificación para este texto, editar la modificación
    const existingMod = modifications.find((m) => m.id === item.id);
    const pDim = pageDimensions[currentPage];
    if (!pDim) return;

    if (existingMod) {
      setEditingId(existingMod.id);
      setEditingText(existingMod.text);
      setEditingFontFamily(existingMod.fontFamily);
      setEditingFontSize(existingMod.fontSize);
      setEditingColor(existingMod.color);
      setEditingBold(existingMod.isBold);
      setEditingItalic(existingMod.isItalic);
    } else {
      const xPercent = (item.vx / pDim.width) * 100;
      const yPercent = (item.vy / pDim.height) * 100;
      const widthPercent = Math.min(100 - xPercent, Math.max(10, (item.vWidth / pDim.width) * 100));
      const heightPercent = (item.vHeight / pDim.height) * 100;

      setEditingId(item.id);
      setEditingText(item.str);
      setEditingFontFamily('Helvetica');
      setEditingFontSize(item.fontSize);
      setEditingColor('#000000');
      setEditingBold(false);
      setEditingItalic(false);

      // Crear entrada provisional
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
        fontFamily: 'Helvetica',
        color: '#000000',
        isBold: false,
        isItalic: false,
        xPercent,
        yPercent,
        widthPercent,
        heightPercent,
      };

      setModifications((prev) => [...prev.filter((m) => m.id !== item.id), newMod]);
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
            fontSize: editingFontSize,
            color: editingColor,
            isBold: editingBold,
            isItalic: editingItalic,
          };
        }
        return mod;
      }),
    );

    setEditingId(null);
    toast.success(isEs ? 'Texto actualizado' : 'Text updated');
  };

  const handleCancelEdit = () => {
    // Si era nuevo y no tiene texto, descartar
    if (editingId) {
      const mod = modifications.find((m) => m.id === editingId);
      if (mod && !mod.isOriginal && (!editingText || editingText.trim() === '')) {
        setModifications((prev) => prev.filter((m) => m.id !== editingId));
      }
    }
    setEditingId(null);
  };

  const handleDeleteModification = (id: string) => {
    setModifications((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
    if (selectedElementId === id) setSelectedElementId(null);
    toast.success(isEs ? 'Modificación eliminada' : 'Modification deleted');
  };

  // ── 4. AÑADIR NUEVO TEXTO LIBRE ──────────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'text') return;
    if (!overlayRef.current || !pageDimensions[currentPage]) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    const pDim = pageDimensions[currentPage];
    const pdfX = (xPercent / 100) * pDim.width;
    const pdfY = pDim.height - (yPercent / 100) * pDim.height;

    const newId = `new-text-${Date.now()}`;
    const newMod: TextModification = {
      id: newId,
      pageNumber: currentPage,
      isOriginal: false,
      text: isEs ? 'Escribe aquí tu texto...' : 'Type text here...',
      pdfX,
      pdfY,
      pdfWidth: 120,
      pdfHeight: 20,
      fontSize: 14,
      fontFamily: 'Helvetica',
      color: '#000000',
      isBold: false,
      isItalic: false,
      xPercent,
      yPercent,
      widthPercent: 25,
      heightPercent: 4,
    };

    setModifications((prev) => [...prev, newMod]);
    setEditingId(newId);
    setEditingText(newMod.text);
    setEditingFontFamily('Helvetica');
    setEditingFontSize(14);
    setEditingColor('#000000');
    setEditingBold(false);
    setEditingItalic(false);
    setActiveTool('select');
  };

  // ── 5. MANEJO DE INSERCIÓN DE IMÁGENES ──────────────────────────────
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
        setSelectedElementId(newImage.id);
        toast.success(isEs ? '¡Imagen añadida con éxito!' : 'Image added successfully!');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setActiveTool('select');
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
    toast.success(isEs ? 'Imagen eliminada' : 'Image deleted');
  };

  // ── 6. CONTROLADORES DE ARRASTRE Y REDIMENSIÓN DE IMÁGENES ──────────
  const handleStartDrag = (e: React.MouseEvent, img: InsertedImage) => {
    e.stopPropagation();
    setSelectedElementId(img.id);
    dragRef.current = {
      isDragging: true,
      isResizing: false,
      targetId: img.id,
      startX: e.clientX,
      startY: e.clientY,
      initXPercent: img.xPercent,
      initYPercent: img.yPercent,
      initWPercent: img.widthPercent,
      initHPercent: img.heightPercent,
    };
  };

  const handleStartResize = (e: React.MouseEvent, img: InsertedImage) => {
    e.stopPropagation();
    setSelectedElementId(img.id);
    dragRef.current = {
      isDragging: false,
      isResizing: true,
      targetId: img.id,
      startX: e.clientX,
      startY: e.clientY,
      initXPercent: img.xPercent,
      initYPercent: img.yPercent,
      initWPercent: img.widthPercent,
      initHPercent: img.heightPercent,
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
        setImages((prev) =>
          prev.map((img) => {
            if (img.id === state.targetId) {
              const newX = Math.max(
                0,
                Math.min(100 - img.widthPercent, state.initXPercent + deltaXPercent),
              );
              const newY = Math.max(
                0,
                Math.min(100 - img.heightPercent, state.initYPercent + deltaYPercent),
              );
              return { ...img, xPercent: newX, yPercent: newY };
            }
            return img;
          }),
        );
      } else if (state.isResizing) {
        setImages((prev) =>
          prev.map((img) => {
            if (img.id === state.targetId) {
              const newW = Math.max(
                5,
                Math.min(100 - img.xPercent, state.initWPercent + deltaXPercent),
              );
              const newH = newW / (img.aspectRatio || 1);
              return { ...img, widthPercent: newW, heightPercent: newH };
            }
            return img;
          }),
        );
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

  // ── 7. EXPORTACIÓN Y COMPILACIÓN VECTORIAL CON PDF-LIB ──────────────
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

      setSaveProgress(35);
      setStatusMessage(
        isEs
          ? 'Aplicando sustituciones in-situ y neutralización...'
          : 'Applying in-situ replacements and neutralization...',
      );

      // Embeber fuentes estándar con todas las variantes
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

      const getFont = (
        family: 'Helvetica' | 'Times' | 'Courier',
        isBold: boolean,
        isItalic: boolean,
      ) => {
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

      // Aplicar modificaciones de texto
      modifications.forEach((mod) => {
        if (mod.pageNumber > 0 && mod.pageNumber <= pages.length) {
          const page = pages[mod.pageNumber - 1];
          const { width, height } = page.getSize();

          // Si es texto original modificado, neutralizar el texto original con un rectángulo del color de fondo (blanco)
          // Calibración tipográfica precisa:
          // En coordenadas PDF, pdfY es la línea base (baseline).
          // Los descendentes ('p','q','y','g') bajan como máximo 0.20 * fontSize.
          // Los ascendentes ('b','d','h','k','A-Z') y tildes mayúsculas suben hasta 0.80 * fontSize.
          // Con alto = 1.00 * fontSize y origen en (pdfY - 0.20 * fontSize), la caja cubre perfectamente el texto
          // pero NUNCA invade la línea superior (evita cortar las letras de la línea de arriba).
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

          // Dibujar el nuevo texto en la posición correspondiente
          const font = getFont(mod.fontFamily, mod.isBold, mod.isItalic);
          const color = hexToRgbPdf(mod.color);

          let targetX = mod.pdfX;
          let targetY = mod.pdfY;

          // Si no es original, calcular desde porcentaje
          if (!mod.isOriginal) {
            targetX = (mod.xPercent / 100) * width;
            targetY = height - (mod.yPercent / 100) * height - mod.fontSize;
          }

          // Sanitizar caracteres para compatibilidad con el juego tipográfico estándar
          let safeText = '';
          for (const ch of mod.text) {
            try {
              font.encodeText(ch);
              safeText += ch;
            } catch {
              safeText += ' ';
            }
          }

          page.drawText(safeText, {
            x: targetX,
            y: targetY,
            size: mod.fontSize,
            font,
            color,
          });
        }
      });

      setSaveProgress(65);
      setStatusMessage(
        isEs
          ? 'Incrustando imágenes y gráficos vectoriales...'
          : 'Embedding images and graphics...',
      );

      // Incrustar imágenes
      for (const imgItem of images) {
        if (imgItem.pageNumber > 0 && imgItem.pageNumber <= pages.length) {
          const page = pages[imgItem.pageNumber - 1];
          const { width, height } = page.getSize();

          const base64Data = imgItem.dataUrl.split(',')[1];
          const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

          let embeddedImg;
          if (imgItem.mimeType === 'image/png') {
            embeddedImg = await pdfDoc.embedPng(imgBytes);
          } else {
            embeddedImg = await pdfDoc.embedJpg(imgBytes);
          }

          const imgW = (imgItem.widthPercent / 100) * width;
          const imgH = (imgItem.heightPercent / 100) * height;
          const imgX = (imgItem.xPercent / 100) * width;
          const imgY = height - (imgItem.yPercent / 100) * height - imgH;

          page.drawImage(embeddedImg, {
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
          });
        }
      }

      setSaveProgress(85);
      setStatusMessage(isEs ? 'Compilando archivo PDF final...' : 'Compiling final PDF file...');

      const savedBytes = await pdfDoc.save();
      const outputBlob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      setSaveProgress(100);
      toast.success(isEs ? '¡Documento guardado con éxito!' : 'Document saved successfully!');
      onFinish(outputBlob, pages.length);
    } catch (err: any) {
      console.error('Error al guardar documento:', err);
      toast.error(isEs ? 'Error al compilar el PDF modificado' : 'Failed to compile modified PDF');
    } finally {
      setIsSaving(false);
      setStatusMessage('');
    }
  };

  // ── RENDERIZADO DEL EDITOR NATIVO ────────────────────────────────────
  const currentExtracted = extractedTexts[currentPage] || [];
  const currentModifications = modifications.filter((m) => m.pageNumber === currentPage);
  const currentImages = images.filter((img) => img.pageNumber === currentPage);
  const pDimensions = pageDimensions[currentPage];

  return (
    <div className="w-full flex flex-col bg-[#0b0b0e] text-white rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* ── BARRA SUPERIOR DE HERRAMIENTAS CORPORATIVA ── */}
      <div className="bg-[#121217] border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Lado Izquierdo: Herramientas de Edición */}
        <div className="flex items-center gap-2">
          {/* Herramienta Selección e In-Situ */}
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
            }`}
            title={isEs ? 'Modo Selección y Edición In-Situ' : 'Selection and In-Situ Edit Mode'}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEs ? 'Editar In-Situ' : 'In-Situ Edit'}</span>
          </button>

          {/* Herramienta Nuevo Texto */}
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
            }`}
            title={isEs ? 'Añadir Nuevo Bloque de Texto' : 'Add New Text Block'}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEs ? '+ Nuevo Texto' : '+ New Text'}</span>
          </button>

          {/* Herramienta Añadir Imagen */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title={isEs ? 'Insertar Imagen PNG o JPG' : 'Insert PNG or JPG Image'}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEs ? '+ Imagen' : '+ Image'}</span>
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageFileChange}
            className="hidden"
          />

          <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* Conmutador a Motor Apryse */}
          {onSwitchToApryse && (
            <button
              type="button"
              onClick={onSwitchToApryse}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-950/70 via-purple-900/60 to-purple-950/70 text-purple-200 border border-purple-500/60 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all flex items-center gap-2 cursor-pointer"
              title={
                isEs
                  ? 'Alternar al Motor Avanzado WebAssembly de Apryse'
                  : 'Switch to Apryse WebAssembly Engine'
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>{isEs ? 'Cambiar a Motor Apryse' : 'Switch to Apryse'}</span>
              <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-mono uppercase">
                WASM
              </span>
            </button>
          )}
        </div>

        {/* Centro: Controles de Paginación y Zoom */}
        <div className="flex items-center gap-3">
          {/* Paginación */}
          <div className="flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-300 px-1">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              disabled={scale <= 0.8}
              onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-zinc-300 w-10 text-center">
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
        </div>

        {/* Lado Derecho: Botón Guardar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={handleSaveDocument}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isEs ? 'Compilando...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEs ? 'Guardar y Descargar' : 'Save & Download'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── BARRA FLOTANTE DE EDICIÓN TIPOGRÁFICA (CUANDO SE EDITA TEXTO) ── */}
      {editingId && (
        <div className="bg-zinc-900 border-b border-blue-900/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              {isEs ? 'Editor Tipográfico:' : 'Typography Editor:'}
            </span>

            {/* Tipografía */}
            <select
              value={editingFontFamily}
              onChange={(e) => setEditingFontFamily(e.target.value as any)}
              className="bg-black/60 border border-zinc-700 rounded px-2 py-1 text-xs text-white cursor-pointer"
            >
              <option value="Helvetica">Helvetica / Arial</option>
              <option value="Times">Times New Roman</option>
              <option value="Courier">Courier / Monospace</option>
            </select>

            {/* Tamaño */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400 text-[11px]">{isEs ? 'Tamaño:' : 'Size:'}</span>
              <input
                type="number"
                min={6}
                max={72}
                value={editingFontSize}
                onChange={(e) => setEditingFontSize(Number(e.target.value) || 12)}
                className="w-12 bg-black/60 border border-zinc-700 rounded px-1.5 py-0.5 text-center text-xs text-white"
              />
            </div>

            {/* Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px]">{isEs ? 'Color:' : 'Color:'}</span>
              <input
                type="color"
                value={editingColor}
                onChange={(e) => setEditingColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
              />
            </div>

            {/* Negrita / Cursiva */}
            <button
              type="button"
              onClick={() => setEditingBold(!editingBold)}
              className={`p-1 rounded border cursor-pointer ${
                editingBold
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-zinc-700 bg-black/40 text-zinc-400'
              }`}
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setEditingItalic(!editingItalic)}
              className={`p-1 rounded border cursor-pointer ${
                editingItalic
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-zinc-700 bg-black/40 text-zinc-400'
              }`}
            >
              <Italic className="w-3 h-3" />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyEdit}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {isEs ? 'Aplicar Cambio' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              {isEs ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteModification(editingId)}
              className="bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 p-1 rounded cursor-pointer"
              title={isEs ? 'Eliminar modificación' : 'Delete modification'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── ÁREA DE TRABAJO Y VISOR DE PÁGINA CON OVERLAY INTERACTIVO ── */}
      <div className="flex-1 min-h-[620px] bg-[#070709] overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
        {isPasswordProtected ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[#121217] border border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-emerald-400 shadow-md">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white uppercase font-sans">
                {isEs ? 'Documento Protegido con Contraseña' : 'Password Protected Document'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {isEs
                  ? 'Este archivo PDF está protegido. Introduce la clave de apertura para visualizarlo y editarlo in-situ:'
                  : 'This PDF file is protected. Enter password to view and edit in-situ:'}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput.trim()) {
                  loadPdfDocument(passwordInput.trim());
                }
              }}
              className="w-full space-y-3"
            >
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={isEs ? 'Escribe la contraseña...' : 'Enter password...'}
                autoFocus
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={!passwordInput.trim() || isLoading}
                className="w-full bg-white text-black font-bold py-2.5 rounded-xl text-xs font-sans hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Unlock className="w-4 h-4 text-black" />
                )}
                <span>{isEs ? 'Desbloquear y Editar' : 'Unlock & Edit'}</span>
              </button>
            </form>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-zinc-400 text-sm font-mono">{statusMessage}</p>
          </div>
        ) : (
          <div
            className="relative shadow-2xl rounded border border-zinc-700/80 bg-white"
            style={{
              width: pDimensions ? pDimensions.viewportWidth : 'auto',
              height: pDimensions ? pDimensions.viewportHeight : 'auto',
            }}
          >
            {/* Canvas de renderizado de la página del PDF */}
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Capa de Interacción In-Situ (Overlay) */}
            <div
              ref={overlayRef}
              onClick={handleOverlayClick}
              className={`absolute inset-0 z-10 ${
                activeTool === 'text' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              {/* 1. Spans de Texto Originales (Detección In-Situ) */}
              {pDimensions &&
                activeTool === 'select' &&
                currentExtracted.map((item) => {
                  // Si este texto original ya fue reemplazado por una modificación, no mostrar el marco transparente
                  const hasMod = currentModifications.some((m) => m.id === item.id);
                  if (hasMod) return null;

                  const left = (item.vx / pDimensions.width) * 100;
                  const top = (item.vy / pDimensions.height) * 100;
                  const width = (item.vWidth / pDimensions.width) * 100;
                  const height = (item.vHeight / pDimensions.height) * 100;

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

              {/* 2. Textos Modificados y Nuevos Bloques de Texto */}
              {pDimensions &&
                currentModifications.map((mod) => {
                  const isEditingThis = editingId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      style={{
                        position: 'absolute',
                        left: `${mod.xPercent}%`,
                        top: `${mod.yPercent}%`,
                        minWidth: `${mod.widthPercent}%`,
                        zIndex: isEditingThis ? 25 : 15,
                      }}
                      className={`group ${
                        isEditingThis
                          ? 'ring-2 ring-blue-500 bg-white shadow-lg rounded-xs'
                          : 'cursor-pointer hover:ring-1 hover:ring-blue-400/80'
                      }`}
                    >
                      {isEditingThis ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApplyEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          style={{
                            fontSize: `${mod.fontSize * scale}px`,
                            fontFamily:
                              mod.fontFamily === 'Times'
                                ? 'Times New Roman, serif'
                                : mod.fontFamily === 'Courier'
                                  ? 'Courier New, monospace'
                                  : 'Helvetica, Arial, sans-serif',
                            color: editingColor,
                            fontWeight: editingBold ? 'bold' : 'normal',
                            fontStyle: editingItalic ? 'italic' : 'normal',
                            lineHeight: 1,
                          }}
                          className="w-full bg-white outline-none text-black px-1 py-0 border-0"
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingId(mod.id);
                            setEditingText(mod.text);
                            setEditingFontFamily(mod.fontFamily);
                            setEditingFontSize(mod.fontSize);
                            setEditingColor(mod.color);
                            setEditingBold(mod.isBold);
                            setEditingItalic(mod.isItalic);
                          }}
                          style={{
                            fontSize: `${mod.fontSize * scale}px`,
                            fontFamily:
                              mod.fontFamily === 'Times'
                                ? 'Times New Roman, serif'
                                : mod.fontFamily === 'Courier'
                                  ? 'Courier New, monospace'
                                  : 'Helvetica, Arial, sans-serif',
                            color: mod.color,
                            fontWeight: mod.isBold ? 'bold' : 'normal',
                            fontStyle: mod.isItalic ? 'italic' : 'normal',
                            backgroundColor: mod.isOriginal ? '#FFFFFF' : 'transparent',
                            lineHeight: 1,
                          }}
                          className="px-0.5 rounded-xs whitespace-pre select-none"
                        >
                          {mod.text}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* 3. Imágenes Insertadas */}
              {currentImages.map((img) => {
                const isSelected = selectedElementId === img.id;

                return (
                  <div
                    key={img.id}
                    onMouseDown={(e) => handleStartDrag(e, img)}
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
                      alt="Elemento PDF"
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Botón flotante para eliminar imagen */}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id);
                        }}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-500 cursor-pointer z-30"
                        title={isEs ? 'Eliminar imagen' : 'Delete image'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {/* Handle de redimensionamiento en esquina inferior derecha */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleStartResize(e, img)}
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

      {/* ── PIE DEL EDITOR: ESTADO Y GARANTÍA TÉCNICA ── */}
      <div className="bg-[#121217] border-t border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-[11px]">
            {isEs
              ? 'Motor In-Situ Nativo • Modificaciones 100% Vectoriales sin Marcas de Agua'
              : 'Native In-Situ Engine • 100% Vectorial Changes Without Watermarks'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>
            {isEs ? 'Modificaciones activas:' : 'Active changes:'}{' '}
            <strong className="text-white">{modifications.length + images.length}</strong>
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
