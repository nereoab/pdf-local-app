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
  Trash2,
  Plus,
  Palette,
  ShieldCheck,
  FileText,
  Lock,
  Unlock,
  PenTool,
  Square,
  Circle as CircleIcon,
  Minus,
  Highlighter,
  Eraser,
  Copy,
  BringToFront,
  SendToBack,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Sparkles,
  Zap,
  Check,
  Loader2,
  Layers,
  Shapes,
} from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '@/context/LanguageContext';

export interface FabricPdfEditorProps {
  file: File;
  filePrefix?: string;
  onFinish: (blob: Blob, totalPages: number) => void;
  onSwitchToApryse?: () => void;
  onSwitchToNative?: () => void;
}

interface ExtractedText {
  id: string;
  str: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export default function FabricPdfEditor({
  file,
  filePrefix = 'Documento_Editado',
  onFinish,
  onSwitchToApryse,
  onSwitchToNative,
}: FabricPdfEditorProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // Estados de carga y documento
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Contraseña en PDFs protegidos
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockedPassword, setUnlockedPassword] = useState('');

  // Herramienta activa
  // 'select' | 'text' | 'draw' | 'whiteout' | 'highlighter' | 'rect' | 'circle' | 'line'
  const [activeTool, setActiveTool] = useState<string>('select');

  // Propiedades de formato para el objeto seleccionado
  const [selectedObj, setSelectedObj] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [brushColor, setBrushColor] = useState('#2563eb');
  const [brushWidth, setBrushWidth] = useState(3);

  // Textos originales detectados por página
  const [extractedTexts, setExtractedTexts] = useState<Record<number, ExtractedText[]>>({});
  const [convertedTextIds, setConvertedTextIds] = useState<Record<string, boolean>>({});
  const [showDetectedTexts, setShowDetectedTexts] = useState(true);

  // Almacenamiento de modificaciones por página en JSON de Fabric
  const pageFabricJSON = useRef<Record<number, any>>({});

  // Referencias a elementos DOM y Fabric
  const pdfDocRef = useRef<any>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricInstanceRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<any>(null);

  // ── 1. INICIALIZAR PDF CON PDF.JS ──────────────────────────────────
  const loadPdfDocument = useCallback(
    async (pass = '') => {
      if (!file) return;
      setIsLoading(true);
      setStatusMessage(
        isEs ? 'Cargando documento en Motor Vectorial...' : 'Loading document in Vector Engine...',
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
            ? `¡Motor Vectorial Fabric listo! (${doc.numPages} páginas)`
            : `Fabric Vector Engine ready! (${doc.numPages} pages)`,
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
              ? 'Error al abrir el PDF. Prueba otro motor.'
              : 'Failed to open PDF. Try another engine.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [file, isEs],
  );

  useEffect(() => {
    loadPdfDocument(unlockedPassword);
    return () => {
      if (fabricInstanceRef.current) {
        try {
          fabricInstanceRef.current.dispose();
        } catch {}
        fabricInstanceRef.current = null;
      }
    };
  }, [loadPdfDocument, unlockedPassword]);

  // ── 2. RENDERIZAR PÁGINA ACTUAL E INICIALIZAR FABRIC CANVAS ──────────
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current || currentPage < 1 || currentPage > totalPages) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      // 1. Renderizar fondo PDF en canvas nativo
      const pdfCanvas = pdfCanvasRef.current;
      if (pdfCanvas) {
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        const ctx = pdfCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
          } as any);
          renderTaskRef.current = renderTask;
          await renderTask.promise;
        }
      }

      // 2. Extraer textos originales para superposición interactiva
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
            const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
            const rawWidth = (item.width || item.str.length * 6) * scale;
            const fontHeight = (item.height || Math.abs(item.transform[3]) || 12) * scale;

            items.push({
              id: `raw-${currentPage}-${idx}`,
              str: item.str,
              pageNumber: currentPage,
              x: vx,
              y: vy - fontHeight * 0.85,
              width: rawWidth,
              height: fontHeight * 1.1,
              fontSize: Math.round(fontHeight),
              fontName: item.fontName || 'Calibri',
            });
          }
        });

        setExtractedTexts((prev) => ({
          ...prev,
          [currentPage]: items,
        }));
      }

      // 3. Inicializar o sincronizar Fabric Canvas
      const fabricLib = await import('fabric');
      const fabricCanvasEl = fabricCanvasRef.current;
      if (!fabricCanvasEl) return;

      let fabricCanvas = fabricInstanceRef.current;

      if (!fabricCanvas) {
        fabricCanvas = new fabricLib.Canvas(fabricCanvasEl, {
          width: viewport.width,
          height: viewport.height,
          selection: true,
          preserveObjectStacking: true,
          backgroundColor: 'transparent',
        });
        fabricInstanceRef.current = fabricCanvas;

        // Configurar eventos de selección
        fabricCanvas.on('selection:created', (e: any) => handleObjectSelected(e.selected?.[0]));
        fabricCanvas.on('selection:updated', (e: any) => handleObjectSelected(e.selected?.[0]));
        fabricCanvas.on('selection:cleared', () => {
          setSelectedObj(null);
          setSelectedType(null);
        });
        fabricCanvas.on('object:modified', () => saveCurrentPageJSON());
        fabricCanvas.on('object:added', () => saveCurrentPageJSON());
        fabricCanvas.on('object:removed', () => saveCurrentPageJSON());
      } else {
        fabricCanvas.setDimensions({
          width: viewport.width,
          height: viewport.height,
        });
      }

      // Cargar objetos previos de esta página si existen
      const savedJSON = pageFabricJSON.current[currentPage];
      if (savedJSON && savedJSON.objects && savedJSON.objects.length > 0) {
        await fabricCanvas.loadFromJSON(savedJSON);
        fabricCanvas.renderAll();
      } else {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = 'transparent';
        fabricCanvas.renderAll();
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error al renderizar página en Fabric:', err);
      }
    }
  }, [currentPage, totalPages, scale, extractedTexts]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Guardar estado de la página actual en JSON
  const saveCurrentPageJSON = () => {
    if (fabricInstanceRef.current) {
      pageFabricJSON.current[currentPage] = fabricInstanceRef.current.toJSON();
    }
  };

  // Manejar selección de un objeto en el lienzo
  const handleObjectSelected = (obj: any) => {
    if (!obj) return;
    setSelectedObj(obj);
    setSelectedType(obj.type || 'object');

    if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      setFontFamily(obj.fontFamily || 'Calibri');
      setFontSize(Math.round(obj.fontSize * (obj.scaleY || 1)));
      setTextColor(obj.fill || '#000000');
      setIsBold(obj.fontWeight === 'bold');
      setIsItalic(obj.fontStyle === 'italic');
      setIsUnderline(Boolean(obj.underline));
      setTextAlign(obj.textAlign || 'left');
    } else if (obj.fill && typeof obj.fill === 'string') {
      setTextColor(obj.fill);
    }
  };

  // ── 3. CAMBIO DE PÁGINAS Y ZOOM ─────────────────────────────────────
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    saveCurrentPageJSON();
    setCurrentPage(page);
    setSelectedObj(null);
    setSelectedType(null);
  };

  const handleZoom = (delta: number) => {
    saveCurrentPageJSON();
    setScale((prev) => Math.min(2.5, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  // ── 4. AGREGAR ELEMENTOS AL LIENZO ──────────────────────────────────
  // Añadir Bloque de Texto Editable
  const handleAddText = async () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas) return;
    const fabricLib = await import('fabric');

    const viewportW = fabricCanvas.getWidth();
    const viewportH = fabricCanvas.getHeight();

    const text = new fabricLib.IText(
      isEs ? 'Haz doble clic para escribir...' : 'Double click to edit...',
      {
        left: viewportW * 0.25,
        top: viewportH * 0.3,
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#000000',
        backgroundColor: '#FFFFFF',
        padding: 2,
        transparentCorners: false,
        cornerColor: '#2563eb',
        cornerStrokeColor: '#1d4ed8',
        cornerSize: 8,
      },
    );

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    fabricCanvas.renderAll();
    saveCurrentPageJSON();
    setActiveTool('select');
  };

  // Añadir Rectángulo Blanco (Borrador / Corrector In-Situ)
  const handleAddWhiteout = async () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas) return;
    const fabricLib = await import('fabric');

    const viewportW = fabricCanvas.getWidth();
    const viewportH = fabricCanvas.getHeight();

    const rect = new fabricLib.Rect({
      left: viewportW * 0.3,
      top: viewportH * 0.3,
      width: 160,
      height: 28,
      fill: '#FFFFFF',
      stroke: '#cbd5e1',
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerSize: 8,
    });

    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
    saveCurrentPageJSON();
    toast.success(
      isEs ? 'Borrador blanco añadido. Muévelo sobre el texto a tapar.' : 'Whiteout box added.',
    );
    setActiveTool('select');
  };

  // Añadir Resaltador Amarillo
  const handleAddHighlighter = async () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas) return;
    const fabricLib = await import('fabric');

    const viewportW = fabricCanvas.getWidth();
    const viewportH = fabricCanvas.getHeight();

    const hl = new fabricLib.Rect({
      left: viewportW * 0.3,
      top: viewportH * 0.35,
      width: 180,
      height: 22,
      fill: 'rgba(250, 204, 21, 0.45)', // Amarillo translúcido
      strokeWidth: 0,
      transparentCorners: false,
      cornerColor: '#eab308',
      cornerSize: 8,
    });

    fabricCanvas.add(hl);
    fabricCanvas.setActiveObject(hl);
    fabricCanvas.renderAll();
    saveCurrentPageJSON();
    toast.success(isEs ? 'Resaltador añadido' : 'Highlighter added');
    setActiveTool('select');
  };

  // Añadir Formas Geométricas (Rectángulo / Círculo / Línea)
  const handleAddShape = async (type: 'rect' | 'circle' | 'line') => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas) return;
    const fabricLib = await import('fabric');

    const viewportW = fabricCanvas.getWidth();
    const viewportH = fabricCanvas.getHeight();

    let shapeObj: any;

    if (type === 'rect') {
      shapeObj = new fabricLib.Rect({
        left: viewportW * 0.35,
        top: viewportH * 0.35,
        width: 140,
        height: 90,
        fill: 'transparent',
        stroke: '#ef4444',
        strokeWidth: 2,
        transparentCorners: false,
        cornerColor: '#ef4444',
        cornerSize: 8,
      });
    } else if (type === 'circle') {
      shapeObj = new fabricLib.Circle({
        left: viewportW * 0.35,
        top: viewportH * 0.35,
        radius: 45,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        transparentCorners: false,
        cornerColor: '#3b82f6',
        cornerSize: 8,
      });
    } else if (type === 'line') {
      shapeObj = new fabricLib.Line([50, 100, 220, 100], {
        left: viewportW * 0.35,
        top: viewportH * 0.35,
        stroke: '#000000',
        strokeWidth: 2,
        transparentCorners: false,
        cornerColor: '#000000',
        cornerSize: 8,
      });
    }

    if (shapeObj) {
      fabricCanvas.add(shapeObj);
      fabricCanvas.setActiveObject(shapeObj);
      fabricCanvas.renderAll();
      saveCurrentPageJSON();
      setActiveTool('select');
    }
  };

  // Alternar Modo Dibujo a Mano Alzada (Firma o Trazos)
  const toggleDrawingMode = async () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas) return;
    const fabricLib = await import('fabric');

    const nextMode = !fabricCanvas.isDrawingMode;
    fabricCanvas.isDrawingMode = nextMode;
    setActiveTool(nextMode ? 'draw' : 'select');

    if (nextMode) {
      if (!fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush = new fabricLib.PencilBrush(fabricCanvas);
      }
      fabricCanvas.freeDrawingBrush.color = brushColor;
      fabricCanvas.freeDrawingBrush.width = brushWidth;
      toast.info(
        isEs
          ? 'Modo trazo/firma activo. Dibuja libremente en la página.'
          : 'Freehand drawing active.',
      );
    }
  };

  // Convertir Texto Original del PDF en Objeto Interactivo de Fabric
  const handleConvertOriginalText = async (item: ExtractedText) => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas) return;
    const fabricLib = await import('fabric');

    // Crear un IText interactivo con fondo blanco exactamente donde estaba el texto original
    const textObj = new fabricLib.IText(item.str, {
      left: item.x,
      top: item.y,
      fontSize: item.fontSize,
      fontFamily: 'Calibri',
      fill: '#000000',
      backgroundColor: '#FFFFFF',
      padding: 0,
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerSize: 8,
    });

    fabricCanvas.add(textObj);
    fabricCanvas.setActiveObject(textObj);
    fabricCanvas.renderAll();

    // Marcar como convertido para no mostrar el recuadro original
    setConvertedTextIds((prev) => ({
      ...prev,
      [item.id]: true,
    }));

    saveCurrentPageJSON();
    toast.success(
      isEs
        ? '¡Texto convertido! Ahora puedes moverlo, rotarlo o editarlo.'
        : 'Text converted to interactive object!',
    );
  };

  // Insertar Imagen (Firmas, Logos, Sellos)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
      toast.error(isEs ? 'Solo se admiten imágenes PNG o JPG' : 'Only PNG or JPG images supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const fabricCanvas = fabricInstanceRef.current;
      if (!fabricCanvas) return;
      const fabricLib = await import('fabric');

      try {
        const img = await fabricLib.FabricImage.fromURL(reader.result as string);
        img.scaleToWidth(180);
        img.set({
          left: fabricCanvas.getWidth() * 0.35,
          top: fabricCanvas.getHeight() * 0.35,
          transparentCorners: false,
          cornerColor: '#2563eb',
          cornerSize: 8,
        });

        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
        saveCurrentPageJSON();
        toast.success(isEs ? 'Imagen agregada con éxito' : 'Image added successfully');
      } catch (err) {
        console.error('Error al insertar imagen en Fabric:', err);
        toast.error(isEs ? 'Error al procesar imagen' : 'Failed to process image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setActiveTool('select');
  };

  // ── 5. MODIFICACIÓN DEL FORMATO DEL OBJETO SELECCIONADO ─────────────
  const updateSelectedProp = (prop: string, value: any) => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas || !selectedObj) return;

    selectedObj.set(prop, value);
    fabricCanvas.renderAll();
    saveCurrentPageJSON();

    // Actualizar estados reactivos
    if (prop === 'fontFamily') setFontFamily(value);
    if (prop === 'fontSize') setFontSize(value);
    if (prop === 'fill') setTextColor(value);
    if (prop === 'textAlign') setTextAlign(value);
  };

  const toggleBold = () => {
    const next = !isBold;
    setIsBold(next);
    updateSelectedProp('fontWeight', next ? 'bold' : 'normal');
  };

  const toggleItalic = () => {
    const next = !isItalic;
    setIsItalic(next);
    updateSelectedProp('fontStyle', next ? 'italic' : 'normal');
  };

  const toggleUnderline = () => {
    const next = !isUnderline;
    setIsUnderline(next);
    updateSelectedProp('underline', next);
  };

  const handleDeleteSelected = () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas || !selectedObj) return;

    fabricCanvas.remove(selectedObj);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    setSelectedObj(null);
    setSelectedType(null);
    saveCurrentPageJSON();
    toast.success(isEs ? 'Elemento eliminado' : 'Object deleted');
  };

  const handleDuplicateSelected = async () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas || !selectedObj) return;

    const cloned = await selectedObj.clone();
    cloned.set({
      left: selectedObj.left + 20,
      top: selectedObj.top + 20,
      evented: true,
    });
    fabricCanvas.add(cloned);
    fabricCanvas.setActiveObject(cloned);
    fabricCanvas.renderAll();
    saveCurrentPageJSON();
    toast.success(isEs ? 'Elemento duplicado' : 'Object duplicated');
  };

  const handleBringToFront = () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas || !selectedObj) return;
    fabricCanvas.bringObjectToFront(selectedObj);
    fabricCanvas.renderAll();
    saveCurrentPageJSON();
  };

  const handleSendToBack = () => {
    const fabricCanvas = fabricInstanceRef.current;
    if (!fabricCanvas || !selectedObj) return;
    fabricCanvas.sendObjectToBack(selectedObj);
    fabricCanvas.renderAll();
    saveCurrentPageJSON();
  };

  // ── 6. COMPILACIÓN Y EXPORTACIÓN DEL PDF MODIFICADO ──────────────────
  const handleSaveDocument = async () => {
    if (!file || !pdfDocRef.current) return;

    saveCurrentPageJSON();
    setIsSaving(true);
    setSaveProgress(10);
    setStatusMessage(
      isEs ? 'Preparando páginas para compilación...' : 'Preparing pages for compilation...',
    );

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
      });

      const pages = pdfDoc.getPages();
      const numPages = pages.length;

      // Importar Fabric dinámicamente para renderizado temporal
      const fabricLib = await import('fabric');

      // Iterar por cada página y fusionar capas de Fabric con resolución 2X
      for (let pIdx = 1; pIdx <= numPages; pIdx++) {
        const pageData = pageFabricJSON.current[pIdx];

        if (pageData && pageData.objects && pageData.objects.length > 0) {
          setStatusMessage(
            isEs
              ? `Incrustando modificaciones vectoriales en página ${pIdx} de ${numPages}...`
              : `Embedding vector layers on page ${pIdx} of ${numPages}...`,
          );

          const targetPage = pages[pIdx - 1];
          const { width: pWidth, height: pHeight } = targetPage.getSize();

          // Crear canvas temporal de exportación en resolución retina
          const tempCanvasEl = document.createElement('canvas');
          const tempFabric = new fabricLib.StaticCanvas(tempCanvasEl, {
            width: targetPage.getWidth(),
            height: targetPage.getHeight(),
            backgroundColor: 'transparent',
          });

          await tempFabric.loadFromJSON(pageData);

          // Escalar objetos al tamaño de puntos PDF exacto
          const currentViewScale = scale;
          const scaleRatioX = pWidth / (tempFabric.getWidth() / currentViewScale);
          const scaleRatioY = pHeight / (tempFabric.getHeight() / currentViewScale);

          tempFabric.setDimensions({
            width: pWidth,
            height: pHeight,
          });
          tempFabric.setZoom(scaleRatioX);
          tempFabric.renderAll();

          // Exportar PNG transparente a resolución retina 2x
          const overlayDataUrl = tempFabric.toDataURL({
            format: 'png',
            multiplier: 2,
          });

          tempFabric.dispose();

          const base64Data = overlayDataUrl.split(',')[1];
          const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const embeddedOverlay = await pdfDoc.embedPng(imgBytes);

          // Incrustar en la página exactamente alineado con los límites
          targetPage.drawImage(embeddedOverlay, {
            x: 0,
            y: 0,
            width: pWidth,
            height: pHeight,
          });
        }

        setSaveProgress(15 + Math.round((pIdx / numPages) * 70));
      }

      setSaveProgress(90);
      setStatusMessage(isEs ? 'Guardando archivo PDF final...' : 'Saving final PDF file...');

      const savedBytes = await pdfDoc.save();
      const outputBlob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      setSaveProgress(100);
      toast.success(isEs ? '¡Documento compilado con éxito!' : 'Document compiled successfully!');
      onFinish(outputBlob, numPages);
    } catch (err: any) {
      console.error('Error al guardar con motor vectorial:', err);
      toast.error(isEs ? 'Error al compilar el PDF modificado' : 'Failed to compile modified PDF');
    } finally {
      setIsSaving(false);
      setStatusMessage('');
    }
  };

  const currentExtracted = extractedTexts[currentPage] || [];

  return (
    <div className="w-full flex flex-col bg-[#0b0b0e] text-white rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* ── BARRA SUPERIOR DE HERRAMIENTAS CORPORATIVA (ESTILO CANVA) ── */}
      <div className="bg-[#121217] border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Herramientas Principales */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Herramienta Mover / Seleccionar */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('select');
              if (fabricInstanceRef.current) fabricInstanceRef.current.isDrawingMode = false;
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
            }`}
            title={isEs ? 'Seleccionar y mover objetos' : 'Select and move objects'}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>{isEs ? 'Seleccionar' : 'Select'}</span>
          </button>

          {/* Añadir Texto Libre */}
          <button
            type="button"
            onClick={handleAddText}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
            title={isEs ? 'Añadir nuevo texto libre' : 'Add new text box'}
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? 'Texto' : 'Text'}</span>
          </button>

          {/* Borrador Blanco (Whiteout) */}
          <button
            type="button"
            onClick={handleAddWhiteout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
            title={isEs ? 'Tapar texto o contenido indeseado' : 'Whiteout text or content'}
          >
            <Eraser className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? 'Borrador' : 'Whiteout'}</span>
          </button>

          {/* Resaltador */}
          <button
            type="button"
            onClick={handleAddHighlighter}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
            title={isEs ? 'Resaltar texto con color translúcido' : 'Highlight text'}
          >
            <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
            <span>{isEs ? 'Resaltar' : 'Highlight'}</span>
          </button>

          {/* Formas Geométricas */}
          <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleAddShape('rect')}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-all cursor-pointer"
              title={isEs ? 'Añadir rectángulo' : 'Add rectangle'}
            >
              <Square className="w-3.5 h-3.5 text-red-400" />
            </button>
            <button
              type="button"
              onClick={() => handleAddShape('circle')}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-all cursor-pointer"
              title={isEs ? 'Añadir círculo' : 'Add circle'}
            >
              <CircleIcon className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => handleAddShape('line')}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-all cursor-pointer"
              title={isEs ? 'Añadir línea separadora' : 'Add line'}
            >
              <Minus className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Trazo a Mano Alzada / Firma */}
          <button
            type="button"
            onClick={toggleDrawingMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'draw'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
            }`}
            title={isEs ? 'Dibujar firma o trazo libre' : 'Draw signature or freehand'}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{isEs ? 'Firma / Lápiz' : 'Draw'}</span>
          </button>

          {/* Insertar Imagen / Sello */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
            title={isEs ? 'Subir imagen, logo o sello' : 'Upload image or stamp'}
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isEs ? 'Imagen' : 'Image'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Toggle Textos Detectados */}
          <button
            type="button"
            onClick={() => setShowDetectedTexts(!showDetectedTexts)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showDetectedTexts
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
            title={
              isEs
                ? 'Mostrar u ocultar textos detectados para convertir'
                : 'Toggle detected text overlay'
            }
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showDetectedTexts
                ? isEs
                  ? 'Textos Activos'
                  : 'Texts ON'
                : isEs
                  ? 'Textos OFF'
                  : 'Texts OFF'}
            </span>
          </button>
        </div>

        {/* Acciones Globales: Descarga / Alternar Motores */}
        <div className="flex items-center gap-2">
          {onSwitchToNative && (
            <button
              type="button"
              onClick={onSwitchToNative}
              className="text-[11px] text-zinc-400 hover:text-blue-400 font-mono flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-all cursor-pointer"
              title={isEs ? 'Cambiar a Motor In-Situ Nativo' : 'Switch to Native In-Situ'}
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">{isEs ? 'Motor In-Situ' : 'In-Situ'}</span>
            </button>
          )}

          {onSwitchToApryse && (
            <button
              type="button"
              onClick={onSwitchToApryse}
              className="text-[11px] text-zinc-400 hover:text-purple-400 font-mono flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-all cursor-pointer"
              title={isEs ? 'Cambiar a Motor Apryse' : 'Switch to Apryse Engine'}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">{isEs ? 'Motor Apryse' : 'Apryse'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDocument}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEs ? 'Guardar PDF' : 'Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── BARRA CONTEXTUAL DE FORMATO (CUANDO HAY UN OBJETO SELECCIONADO) ── */}
      {selectedObj && (
        <div className="bg-[#181822] border-b border-zinc-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 text-[11px] uppercase font-bold flex items-center gap-1">
              <Shapes className="w-3.5 h-3.5 text-emerald-400" />
              {isEs ? 'Elemento Activo:' : 'Active Object:'}
            </span>

            {/* Opciones de Texto */}
            {(selectedType === 'i-text' ||
              selectedType === 'textbox' ||
              selectedType === 'text') && (
              <>
                {/* Fuente */}
                <select
                  value={fontFamily}
                  onChange={(e) => updateSelectedProp('fontFamily', e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Inter">Inter</option>
                  <option value="Georgia">Georgia</option>
                </select>

                {/* Tamaño de fuente */}
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded">
                  <button
                    type="button"
                    onClick={() => updateSelectedProp('fontSize', Math.max(8, fontSize - 2))}
                    className="px-2 py-1 hover:bg-zinc-800 text-zinc-300 font-bold"
                  >
                    -
                  </button>
                  <span className="px-2 text-[11px] font-bold">{fontSize}px</span>
                  <button
                    type="button"
                    onClick={() => updateSelectedProp('fontSize', Math.min(96, fontSize + 2))}
                    className="px-2 py-1 hover:bg-zinc-800 text-zinc-300 font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Negrita, Cursiva, Subrayado */}
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded p-0.5">
                  <button
                    type="button"
                    onClick={toggleBold}
                    className={`p-1 rounded ${
                      isBold ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Negrita' : 'Bold'}
                  >
                    <Bold className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleItalic}
                    className={`p-1 rounded ${
                      isItalic ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Cursiva' : 'Italic'}
                  >
                    <Italic className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleUnderline}
                    className={`p-1 rounded ${
                      isUnderline ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Subrayado' : 'Underline'}
                  >
                    <Underline className="w-3 h-3" />
                  </button>
                </div>

                {/* Alineación */}
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => updateSelectedProp('textAlign', 'left')}
                    className={`p-1 rounded ${
                      textAlign === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedProp('textAlign', 'center')}
                    className={`p-1 rounded ${
                      textAlign === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedProp('textAlign', 'right')}
                    className={`p-1 rounded ${
                      textAlign === 'right' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <AlignRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}

            {/* Selector de Color Rápido */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-zinc-400 text-[10px]">{isEs ? 'Color:' : 'Color:'}</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => updateSelectedProp('fill', e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border border-zinc-600 bg-transparent p-0"
              />
              <div className="flex items-center gap-1">
                {['#000000', '#FFFFFF', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateSelectedProp('fill', hex)}
                    style={{ backgroundColor: hex }}
                    className="w-3.5 h-3.5 rounded-full border border-zinc-600 hover:scale-110 transition-transform cursor-pointer"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Acciones sobre el Objeto (Capas, Duplicar, Borrar) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBringToFront}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 hover:text-white"
              title={isEs ? 'Traer al frente' : 'Bring to front'}
            >
              <BringToFront className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSendToBack}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 hover:text-white"
              title={isEs ? 'Enviar al fondo' : 'Send to back'}
            >
              <SendToBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 hover:text-white"
              title={isEs ? 'Duplicar objeto' : 'Duplicate object'}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700/60 rounded text-red-300"
              title={isEs ? 'Eliminar objeto' : 'Delete object'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── BARRA INFERIOR DE PÁGINAS Y ZOOM ── */}
      <div className="bg-[#121217] border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-zinc-300">
            {isEs ? 'Pág.' : 'Page'} <strong className="text-white">{currentPage}</strong> /{' '}
            {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleZoom(-0.15)}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
            title={isEs ? 'Reducir zoom' : 'Zoom out'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-zinc-300 text-[11px] font-bold w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(0.15)}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
            title={isEs ? 'Aumentar zoom' : 'Zoom in'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── ÁREA DE TRABAJO DEL DOCUMENTO (CANVAS APILADOS) ── */}
      <div className="flex-1 bg-[#09090c] p-4 sm:p-8 flex items-center justify-center overflow-auto min-h-[640px] relative">
        {/* Spinner de Carga Inicial */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center z-50">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <span className="text-sm font-mono text-zinc-300">{statusMessage}</span>
          </div>
        )}

        {/* Modal de Protección con Contraseña */}
        {isPasswordProtected && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
            <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-2">
                {isEs ? 'PDF Protegido con Contraseña' : 'Password Protected PDF'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mb-4">
                {isEs
                  ? 'Introduce la clave del documento para cargarlo en el editor.'
                  : 'Enter password to unlock and edit.'}
              </p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={isEs ? 'Contraseña...' : 'Password...'}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono mb-4 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => loadPdfDocument(passwordInput)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs font-mono transition-all"
              >
                {isEs ? 'Desbloquear Documento' : 'Unlock Document'}
              </button>
            </div>
          </div>
        )}

        {/* Contenedor Relativo de la Página Activa */}
        <div
          className="relative shadow-[0_0_35px_rgba(0,0,0,0.8)] border border-zinc-800 rounded-sm bg-white"
          style={{
            width: pdfCanvasRef.current ? pdfCanvasRef.current.width : 'auto',
            height: pdfCanvasRef.current ? pdfCanvasRef.current.height : 'auto',
          }}
        >
          {/* Capa 1: Canvas nativo de renderizado PDF (fidelidad 100%) */}
          <canvas ref={pdfCanvasRef} className="block pointer-events-none" />

          {/* Capa 2: Canvas de Objetos Interactivos Fabric.js */}
          <div className="absolute inset-0 z-20">
            <canvas ref={fabricCanvasRef} />
          </div>

          {/* Capa 3: Marcadores de Texto Original Detectados (para convertir con 1 clic) */}
          {showDetectedTexts &&
            activeTool === 'select' &&
            currentExtracted.map((item) => {
              if (convertedTextIds[item.id]) return null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleConvertOriginalText(item)}
                  style={{
                    position: 'absolute',
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                  className="group absolute border border-transparent hover:border-emerald-400 hover:bg-emerald-500/15 cursor-pointer z-30 transition-all select-none"
                  title={
                    isEs
                      ? 'Clic para convertir a objeto vectorial editable'
                      : 'Click to convert into editable vector text'
                  }
                >
                  <div className="hidden group-hover:block absolute -top-5 left-0 bg-emerald-600 text-[9px] text-white font-mono px-1 rounded shadow pointer-events-none whitespace-nowrap">
                    {isEs ? 'Clic para mover/editar' : 'Click to move/edit'}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── MODAL DE PROCESAMIENTO AL GUARDAR ── */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
            <h4 className="text-base font-bold text-white mb-2">
              {isEs ? 'Compilando Documento PDF' : 'Compiling PDF Document'}
            </h4>
            <p className="text-xs text-zinc-400 font-mono mb-4">{statusMessage}</p>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${saveProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">{saveProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
