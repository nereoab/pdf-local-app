'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Crop,
  FileText,
  X,
  Loader2,
  Sliders,
  UploadCloud,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Unlock,
  LayoutGrid,
  Plus,
  Trash2,
  Link as LinkIcon,
  Unlink,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Eye,
  Split,
  Info,
  Check,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CropWorkerMessageIn, CropWorkerMessageOut, CropScope } from '@/workers/pdf-crop.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

interface CompletedCropResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  totalPages: number;
  rawBlob: Blob;
  originalSize: string;
}

interface PageThumbnailMini {
  pageNum: number;
  dataUrl: string;
}

export default function PdfCropper() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });
  const [miniThumbnails, setMiniThumbnails] = useState<PageThumbnailMini[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedResult, setCompletedResult] = useState<CompletedCropResult | null>(null);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // MÁRGENES DE RECORTE EN MM
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [marginLeft, setMarginLeft] = useState<number>(10);
  const [marginRight, setMarginRight] = useState<number>(10);
  const [isLinkedMargins, setIsLinkedMargins] = useState<boolean>(false);
  const [cropScope, setCropScope] = useState<CropScope>('all');
  const [customPagesInput, setCustomPagesInput] = useState<string>('1-5');

  // ZOOM & VISTA
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [previewZoom, setPreviewZoom] = useState<boolean>(false);
  const [showThumbnailsBar, setShowThumbnailsBar] = useState<boolean>(false);

  // RESULTADOS Y PREVIAS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // OPCIONES AVANZADAS Y METADATOS
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Recortado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  // ESTADO DE ARRASTRE DEL RECUADRO DE RECORTE
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startTop: number;
    startBottom: number;
    startLeft: number;
    startRight: number;
  } | null>(null);

  // Dimensiones físicas aproximadas de la página en mm (A4 base estándar o proporcional)
  const pageAspectRatio = pageSize.height / (pageSize.width || 1);
  const pageHeightMm = Math.round(210 * pageAspectRatio);
  const pageWidthMm = 210;

  // Ocultar barra superior global y scroll automático hacia el tope de la pantalla
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      window.scrollTo(0, 0);
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  // Asegurar restauración de barra superior al desmontar
  useEffect(() => {
    return () => {
      setHeaderHidden(false);
    };
  }, [setHeaderHidden]);

  // Cargar PDF y renderizar vista previa de la página actual
  const renderCurrentPage = useCallback(
    async (selectedFile: File, pageNum: number, pass?: string) => {
      setIsProcessing(true);
      setProgressMsg(
        isEs ? `Cargando vista previa pág ${pageNum}...` : `Loading preview page ${pageNum}...`,
      );
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, '') + '_Recortado');

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          password: pass,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);

        const targetPageNum = Math.max(1, Math.min(pdf.numPages, pageNum));
        const page = await pdf.getPage(targetPageNum);
        const viewport = page.getViewport({ scale: 1.6 });

        setPageSize({ width: Math.round(viewport.width), height: Math.round(viewport.height) });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as unknown as Parameters<
            typeof page.render
          >[0]).promise;
          setPageDataUrl(canvas.toDataURL('image/jpeg', 0.9));
        }

        setIsEncrypted(false);
        setIsUnlocked(true);

        // Cargar miniaturas rápidas para las primeras 20 páginas
        if (miniThumbnails.length === 0) {
          const thumbs: PageThumbnailMini[] = [];
          const limit = Math.min(pdf.numPages, 16);
          for (let i = 1; i <= limit; i++) {
            try {
              const p = await pdf.getPage(i);
              const vp = p.getViewport({ scale: 0.25 });
              const c = document.createElement('canvas');
              const ctx = c.getContext('2d');
              c.height = vp.height;
              c.width = vp.width;
              if (ctx) {
                await p.render({ canvasContext: ctx, viewport: vp } as any).promise;
                thumbs.push({ pageNum: i, dataUrl: c.toDataURL('image/jpeg', 0.6) });
              }
            } catch {
              // skip
            }
          }
          setMiniThumbnails(thumbs);
        }
      } catch (error: any) {
        if (error?.name === 'PasswordException' || error?.code === 1) {
          setIsEncrypted(true);
          setIsUnlocked(false);
          toast.warning(
            isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open',
          );
        } else {
          console.error(error);
          toast.error(isEs ? 'Error al renderizar página del PDF' : 'Error rendering PDF page');
        }
      } finally {
        setIsProcessing(false);
        setProgressMsg('');
      }
    },
    [isEs, miniThumbnails.length],
  );

  useEffect(() => {
    if (file && !isEncrypted) {
      renderCurrentPage(file, currentPage, unlockedPassword);
    }
  }, [file, currentPage, isEncrypted, unlockedPassword, renderCurrentPage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setCurrentPage(1);
        setMiniThumbnails([]);
        setDownloadUrl(null);
        setIsEncrypted(false);
        setIsUnlocked(false);
        setUnlockedPassword(undefined);
        setPasswordInput('');
        await renderCurrentPage(selected, 1);
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      await renderCurrentPage(file, currentPage, passwordInput);
      setUnlockedPassword(passwordInput);
      setIsUnlocked(true);
      setIsEncrypted(false);
      toast.success(
        isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF unlocked successfully!',
      );
    } catch {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  const removeFile = useCallback(() => {
    setHeaderHidden(false);
    setFile(null);
    setTotalPages(0);
    setPageDataUrl(null);
    setMiniThumbnails([]);
    setDownloadUrl(null);
    setCompletedResult(null);
    setGlobalFile(null);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setGlobalFile, setHeaderHidden]);

  // MANEJO DE MÁRGENES (CON SOPORTE DE ENLACE)
  const updateMargin = (field: 'top' | 'bottom' | 'left' | 'right', val: number) => {
    const clamped = Math.max(
      0,
      Math.min(field === 'top' || field === 'bottom' ? pageHeightMm - 20 : pageWidthMm - 20, val),
    );
    if (isLinkedMargins) {
      setMarginTop(clamped);
      setMarginBottom(clamped);
      setMarginLeft(clamped);
      setMarginRight(clamped);
    } else {
      if (field === 'top') setMarginTop(clamped);
      if (field === 'bottom') setMarginBottom(clamped);
      if (field === 'left') setMarginLeft(clamped);
      if (field === 'right') setMarginRight(clamped);
    }
    setDownloadUrl(null);
  };

  const applyPreset = (t: number, b: number, l: number, r: number, name: string) => {
    setMarginTop(t);
    setMarginBottom(b);
    setMarginLeft(l);
    setMarginRight(r);
    setDownloadUrl(null);
    toast.info(isEs ? `Preajuste aplicado: ${name}` : `Preset applied: ${name}`);
  };

  const resetMargins = () => {
    setMarginTop(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setMarginRight(0);
    setDownloadUrl(null);
    toast.info(isEs ? 'Márgenes restablecidos a 0 mm' : 'Margins reset to 0 mm');
  };

  // MANEJADORES DE ARRASTRE INTERACTIVO DEL RECUADRO DE RECORTE
  const handleMouseDownOnHandle = (handleType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(handleType);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTop: marginTop,
      startBottom: marginBottom,
      startLeft: marginLeft,
      startRight: marginRight,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !cropContainerRef.current) return;
      const rect = cropContainerRef.current.getBoundingClientRect();
      const deltaX_px = e.clientX - dragStartRef.current.startX;
      const deltaY_px = e.clientY - dragStartRef.current.startY;

      const deltaX_mm = Math.round((deltaX_px / rect.width) * pageWidthMm);
      const deltaY_mm = Math.round((deltaY_px / rect.height) * pageHeightMm);

      const maxH = pageHeightMm - 20;
      const maxW = pageWidthMm - 20;

      if (isDragging === 'top' || isDragging === 'nw' || isDragging === 'ne') {
        const newTop = Math.max(
          0,
          Math.min(
            maxH - dragStartRef.current.startBottom,
            dragStartRef.current.startTop + deltaY_mm,
          ),
        );
        setMarginTop(newTop);
      }
      if (isDragging === 'bottom' || isDragging === 'sw' || isDragging === 'se') {
        const newBottom = Math.max(
          0,
          Math.min(
            maxH - dragStartRef.current.startTop,
            dragStartRef.current.startBottom - deltaY_mm,
          ),
        );
        setMarginBottom(newBottom);
      }
      if (isDragging === 'left' || isDragging === 'nw' || isDragging === 'sw') {
        const newLeft = Math.max(
          0,
          Math.min(
            maxW - dragStartRef.current.startRight,
            dragStartRef.current.startLeft + deltaX_mm,
          ),
        );
        setMarginLeft(newLeft);
      }
      if (isDragging === 'right' || isDragging === 'ne' || isDragging === 'se') {
        const newRight = Math.max(
          0,
          Math.min(
            maxW - dragStartRef.current.startLeft,
            dragStartRef.current.startRight - deltaX_mm,
          ),
        );
        setMarginRight(newRight);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(null);
        dragStartRef.current = null;
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pageHeightMm, pageWidthMm]);

  // PARSEO DE PÁGINAS PERSONALIZADAS
  const parsedCustomPages = useMemo(() => {
    if (cropScope !== 'custom') return [];
    const pages = new Set<number>();
    customPagesInput.split(',').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= totalPages) pages.add(i);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) pages.add(num);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  }, [cropScope, customPagesInput, totalPages]);

  // CÁLCULO DE MÉTRICAS Y RESUMEN DINÁMICO EN TIEMPO REAL
  const liveSummary = useMemo(() => {
    if (totalPages === 0) return null;

    let affectedPagesCount = 0;
    let scopeLabel = '';

    if (cropScope === 'all') {
      affectedPagesCount = totalPages;
      scopeLabel = isEs ? 'Todas las páginas' : 'All pages';
    } else if (cropScope === 'even') {
      affectedPagesCount = Math.floor(totalPages / 2);
      scopeLabel = isEs ? 'Páginas pares' : 'Even pages';
    } else if (cropScope === 'odd') {
      affectedPagesCount = Math.ceil(totalPages / 2);
      scopeLabel = isEs ? 'Páginas impares' : 'Odd pages';
    } else if (cropScope === 'current') {
      affectedPagesCount = 1;
      scopeLabel = isEs ? `Página ${currentPage}` : `Page ${currentPage}`;
    } else {
      affectedPagesCount = parsedCustomPages.length;
      scopeLabel = isEs
        ? `${affectedPagesCount} páginas seleccionadas`
        : `${affectedPagesCount} custom pages`;
    }

    const finalWidthMm = Math.max(10, pageWidthMm - marginLeft - marginRight);
    const finalHeightMm = Math.max(10, pageHeightMm - marginTop - marginBottom);
    const originalArea = pageWidthMm * pageHeightMm;
    const finalArea = finalWidthMm * finalHeightMm;
    const areaReductionPercent = Math.max(
      0,
      Math.round(((originalArea - finalArea) / originalArea) * 100),
    );

    return {
      affectedPagesCount,
      scopeLabel,
      finalWidthMm,
      finalHeightMm,
      areaReductionPercent,
    };
  }, [
    totalPages,
    cropScope,
    currentPage,
    parsedCustomPages,
    pageWidthMm,
    pageHeightMm,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    isEs,
  ]);

  // EJECUCIÓN CON WEB WORKER
  const executeCrop = async () => {
    if (!file) {
      toast.error(isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file');
      return;
    }

    if (isEncrypted && !isUnlocked) {
      toast.error(
        isEs
          ? 'Desbloquea el PDF con su contraseña antes de procesar'
          : 'Unlock PDF with password before processing',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando Web Worker acelerado...' : 'Starting Web Worker...');

    try {
      const buffer = await file.arrayBuffer();
      const bufferCopy = buffer.slice(0);

      const worker = new Worker(new URL('../workers/pdf-crop.worker.ts', import.meta.url), {
        type: 'module',
      });

      const payload: CropWorkerMessageIn = {
        action: 'crop',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Recortado',
          renumberPages,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
          cropScope,
          currentPage,
          customPages: cropScope === 'custom' ? parsedCustomPages : undefined,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
          worker.onmessage = (e: MessageEvent<CropWorkerMessageOut>) => {
            const msg = e.data;
            if (msg.type === 'progress') {
              setProgressPercent(msg.percent);
              setProgressMsg(msg.message);
            } else if (msg.type === 'result') {
              resolve({
                buffer: msg.buffer,
                totalPages: msg.totalPages,
              });
            } else if (msg.type === 'error') {
              reject(new Error(msg.message));
            }
          };

          worker.onerror = (err) => reject(err);
          worker.postMessage(payload, [bufferCopy]);
        },
      );

      worker.terminate();

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix.trim() || 'Documento_Recortado'}.pdf`;
      const sizeFormatted = formatFileSize(blob.size);
      const origSizeFormatted = file ? formatFileSize(file.size) : '—';

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeFormatted,
        totalPages: result.totalPages,
        rawBlob: blob,
        originalSize: origSizeFormatted,
      });

      setProgressPercent(100);
      toast.success(
        isEs ? '¡Márgenes del PDF recortados con éxito!' : 'PDF margins cropped successfully!',
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message ||
          (isEs ? 'Error al recortar los márgenes del PDF' : 'Error cropping PDF margins'),
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <Link
            href="/organizar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '002 / RECORTE Y AJUSTE DE MÁRGENES PDF'
                : '002 / PDF MARGIN CROPPING & ADJUSTMENT'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Crop className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'RECORTAR MÁRGENES DE DOCUMENTOS PDF' : 'CROP PDF MARGINS'}
            </h1>
          </div>
        </div>

        {completedResult ? (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-xs font-mono text-white">
            <FileText className="w-4 h-4 text-zinc-300" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {completedResult.filename}
            </span>
          </div>
        ) : file ? (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {file.name}
              </span>
            </div>
            <button
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA ── */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE RECORTE */}
          <div className="bg-[#09090b] border border-white/20 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                  <Crop className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DEL RECORTE DE PDF' : 'PDF CROP RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs ? '¡Documento recortado con éxito!' : 'Document cropped successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-zinc-800 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.originalSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Modo de Procesamiento' : 'Processing Mode'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Recorte Box Nativo' : 'Native Box Crop'}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA ÉXITO CON ENCADENAMIENTO DE HERRAMIENTAS */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="recortar"
            onReset={removeFile}
          />
        </motion.div>
      ) : !file ? (
        /* VISTA DROPZONE VACÍA */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? 'RECORTAR MÁRGENES DE DOCUMENTOS PDF' : 'CROP PDF MARGINS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Recorta los márgenes superior, inferior y laterales de tu PDF con control interactivo 100% local.'
              : 'Crop top, bottom, left, and right margins of your PDF with interactive control 100% locally.'}
          </p>
          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-white font-bold text-xs font-mono rounded-full mt-8 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>
              {isEs
                ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL'
                : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}
            </span>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISOR INTERACTIVO CROPBOX */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: VISOR INTERACTIVO CROP BOX CON HANDLES ARRASTRABLES */}
          <div className="lg:col-span-7 xl:col-span-7 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[750px] lg:h-[830px] max-h-[850px] overflow-hidden">
            {/* CABECERA DE LA VISTA PREVIA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold shrink-0">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs ? `001 / VISOR CROPBOX INTERACTIVO` : `001 / INTERACTIVE CROPBOX VIEWER`}
                </span>
              </div>

              {/* NAVEGADOR DE PÁGINAS Y CONTROLES DE ZOOM */}
              <div className="flex items-center gap-2">
                {/* ZOOM CONTROLS */}
                <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setZoomLevel((prev) => Math.max(0.8, parseFloat((prev - 0.2).toFixed(1))))
                    }
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                    title={isEs ? 'Reducir Zoom' : 'Zoom Out'}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-zinc-300 font-bold px-1 min-w-[32px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setZoomLevel((prev) => Math.min(2.0, parseFloat((prev + 0.2).toFixed(1))))
                    }
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                    title={isEs ? 'Aumentar Zoom' : 'Zoom In'}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* PAGINADOR */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 px-2 py-1 rounded-xl text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-0.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white font-bold text-[11px]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-0.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* PASSWORD WIDGET FOR ENCRYPTED PDF */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-3 space-y-2 font-mono text-xs shrink-0">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Lock className="w-4 h-4" />
                  <span>
                    {isEs
                      ? 'Este PDF está protegido con contraseña'
                      : 'This PDF is password protected'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder={
                      isEs ? 'Ingresa la contraseña de apertura...' : 'Enter open password...'
                    }
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && unlockFileWithPassword()}
                    className="flex-1 bg-zinc-900 border border-white/15 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-white/40 font-mono"
                  />
                  <button
                    onClick={unlockFileWithPassword}
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 font-mono"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DETALLES DEL ARCHIVO CARGADO Y DIMENSIONES DINÁMICAS */}
            <div className="bg-zinc-950 border border-white/10 p-2.5 rounded-xl mb-3 flex items-center justify-between font-mono text-xs shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-white font-bold block truncate text-xs">{file.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {formatFileSize(file.size)} • Original: {pageWidthMm}×{pageHeightMm} mm •{' '}
                    {totalPages} {isEs ? 'páginas' : 'pages'}
                  </span>
                </div>
              </div>

              {liveSummary && (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-md font-bold">
                    📐 {liveSummary.finalWidthMm} × {liveSummary.finalHeightMm} mm
                  </span>
                  {liveSummary.areaReductionPercent > 0 && (
                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-bold">
                      -{liveSummary.areaReductionPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* CONTENEDOR CANVAS DE PÁGINA CON OVERLAY DE MÁRGENES DE RECORTE INTERACTIVO */}
            <div
              ref={cropContainerRef}
              className="relative w-full flex-1 min-h-0 bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center p-3 shadow-inner border border-white/5 font-mono select-none"
            >
              {pageDataUrl ? (
                <div
                  className="relative inline-block max-h-full max-w-full shadow-2xl rounded transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  {/* IMAGEN DE LA PÁGINA */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pageDataUrl}
                    alt={`Página ${currentPage}`}
                    draggable={false}
                    className="max-h-[520px] w-auto max-w-full object-contain block rounded shadow-2xl bg-white select-none pointer-events-none"
                  />

                  {/* OVERLAY VISUAL DE MÁRGENES DE RECORTE (CROP BOX INTERACTIVO) */}
                  <div
                    className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/10 rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.5),0_0_15px_rgba(6,182,212,0.6)] transition-all duration-75"
                    style={{
                      top: `${(marginTop / pageHeightMm) * 100}%`,
                      bottom: `${(marginBottom / pageHeightMm) * 100}%`,
                      left: `${(marginLeft / pageWidthMm) * 100}%`,
                      right: `${(marginRight / pageWidthMm) * 100}%`,
                    }}
                  >
                    {/* ETIQUETA EN VIVO DE ÁREA CONSERVADA */}
                    <div className="absolute top-1.5 left-2 bg-cyan-400 text-black text-[9px] font-mono font-extrabold px-2 py-0.5 rounded shadow-lg flex items-center gap-1 uppercase tracking-wider select-none pointer-events-none">
                      <Crop className="w-3 h-3 text-black" />
                      <span>{isEs ? 'Área Conservada' : 'Conserved Area'}</span>
                    </div>

                    {/* MANEJADORES DE LAS 4 ESQUINAS (HANDLES NW, NE, SW, SE) */}
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('nw', e)}
                      className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-cyan-400 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                      title={isEs ? 'Arrastrar esquina superior izquierda' : 'Drag top-left corner'}
                    />
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('ne', e)}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-cyan-400 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                      title={isEs ? 'Arrastrar esquina superior derecha' : 'Drag top-right corner'}
                    />
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('sw', e)}
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-cyan-400 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                      title={
                        isEs ? 'Arrastrar esquina inferior izquierda' : 'Drag bottom-left corner'
                      }
                    />
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('se', e)}
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-cyan-400 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                      title={
                        isEs ? 'Arrastrar esquina inferior derecha' : 'Drag bottom-right corner'
                      }
                    />

                    {/* MANEJADORES DE LOS 4 BORDES (HANDLES TOP, BOTTOM, LEFT, RIGHT) */}
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('top', e)}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-cyan-400 rounded-full cursor-ns-resize shadow-md hover:scale-110 transition-transform"
                      title={isEs ? 'Arrastrar margen superior' : 'Drag top margin'}
                    />
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('bottom', e)}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-cyan-400 rounded-full cursor-ns-resize shadow-md hover:scale-110 transition-transform"
                      title={isEs ? 'Arrastrar margen inferior' : 'Drag bottom margin'}
                    />
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('left', e)}
                      className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-8 w-3 bg-cyan-400 rounded-full cursor-ew-resize shadow-md hover:scale-110 transition-transform"
                      title={isEs ? 'Arrastrar margen izquierdo' : 'Drag left margin'}
                    />
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle('right', e)}
                      className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-8 w-3 bg-cyan-400 rounded-full cursor-ew-resize shadow-md hover:scale-110 transition-transform"
                      title={isEs ? 'Arrastrar margen derecho' : 'Drag right margin'}
                    />
                  </div>

                  {/* BOTÓN EXPANDIR FULLSCREEN */}
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(true)}
                    className="absolute bottom-2 right-2 p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-white/20 shadow-md cursor-pointer transition-transform hover:scale-105"
                    title={isEs ? 'Pantalla completa' : 'Fullscreen'}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="text-xs text-zinc-400">
                    {isEs ? 'Renderizando vista previa HD...' : 'Rendering HD preview...'}
                  </span>
                </div>
              )}
            </div>

            {/* MINI TIRA DE NAVEGACIÓN RÁPIDA ENTRE PÁGINAS */}
            {totalPages > 1 && (
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 py-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider shrink-0 font-mono">
                  {isEs ? 'Saltar a pág:' : 'Jump to pg:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {miniThumbnails.length > 0
                    ? miniThumbnails.map((thumb) => (
                        <button
                          key={thumb.pageNum}
                          type="button"
                          onClick={() => setCurrentPage(thumb.pageNum)}
                          className={`relative w-9 h-11 rounded-lg border overflow-hidden transition-all cursor-pointer shrink-0 ${
                            currentPage === thumb.pageNum
                              ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-zinc-900'
                              : 'border-white/10 hover:border-white/30 bg-zinc-950 opacity-70 hover:opacity-100'
                          }`}
                          title={
                            isEs ? `Ir a página ${thumb.pageNum}` : `Go to page ${thumb.pageNum}`
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb.dataUrl}
                            alt={`Pg ${thumb.pageNum}`}
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute bottom-0 right-0 left-0 bg-black/80 text-[8px] text-center font-bold text-white font-mono">
                            {thumb.pageNum}
                          </span>
                        </button>
                      ))
                    : Array.from({ length: Math.min(totalPages, 12) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all ${
                            currentPage === p
                              ? 'bg-white text-black border-white shadow'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                </div>
              </div>
            )}
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL (ALTURA NATURAL SIN SCROLL FORZADO) */}
          <div className="lg:col-span-5 xl:col-span-5 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-3 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* 1. MODO DE ALCANCE DEL RECORTE */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                    {isEs ? 'Alcance del Recorte:' : 'Crop Scope:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCropScope('all')}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'all'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Todas' : 'All'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCropScope('even')}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'even'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Pares' : 'Evens'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCropScope('odd')}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'odd'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Impares' : 'Odds'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCropScope('current')}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'current'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Actual' : 'Current'}
                    </button>
                  </div>
                </div>

                {/* ALCANCE PERSONALIZADO SI SE DESEA */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCropScope(cropScope === 'custom' ? 'all' : 'custom')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      cropScope === 'custom'
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    <span>{isEs ? 'Rango Personalizado' : 'Custom Range'}</span>
                  </button>

                  {cropScope === 'custom' && (
                    <input
                      type="text"
                      placeholder="Ej: 1-5, 8, 12"
                      value={customPagesInput}
                      onChange={(e) => setCustomPagesInput(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-white/20 rounded-lg py-1 px-2.5 text-xs text-white outline-none focus:border-white/50 font-mono"
                    />
                  )}
                </div>

                {/* 2. MÁRGENES DE RECORTE EN MM CON VINCULACIÓN */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5 text-cyan-400" />
                      {isEs ? 'Márgenes de Recorte (mm):' : 'Crop Margins (mm):'}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* BOTÓN VINCULAR MÁRGENES */}
                      <button
                        type="button"
                        onClick={() => setIsLinkedMargins(!isLinkedMargins)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                          isLinkedMargins
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                        }`}
                        title={
                          isEs ? 'Vincular/desvincular todos los márgenes' : 'Link/unlink margins'
                        }
                      >
                        {isLinkedMargins ? (
                          <LinkIcon className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Unlink className="w-3 h-3" />
                        )}
                        <span className="text-[10px]">
                          {isLinkedMargins
                            ? isEs
                              ? 'Vinculados'
                              : 'Linked'
                            : isEs
                              ? 'Libres'
                              : 'Free'}
                        </span>
                      </button>

                      {/* RESET */}
                      <button
                        type="button"
                        onClick={resetMargins}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-colors"
                        title={isEs ? 'Restablecer márgenes a 0' : 'Reset margins to 0'}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">
                        {isEs ? 'Superior (Top):' : 'Top:'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={150}
                        value={marginTop}
                        onChange={(e) => updateMargin('top', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-1.5 px-3 text-white font-bold text-xs outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">
                        {isEs ? 'Inferior (Bottom):' : 'Bottom:'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={150}
                        value={marginBottom}
                        onChange={(e) => updateMargin('bottom', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-1.5 px-3 text-white font-bold text-xs outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">
                        {isEs ? 'Izquierdo (Left):' : 'Left:'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={150}
                        value={marginLeft}
                        onChange={(e) => updateMargin('left', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-1.5 px-3 text-white font-bold text-xs outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">
                        {isEs ? 'Derecho (Right):' : 'Right:'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={150}
                        value={marginRight}
                        onChange={(e) => updateMargin('right', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-1.5 px-3 text-white font-bold text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* PREAJUSTES RÁPIDOS PROFESIONALES */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'Preajustes de Recorte:' : 'Crop Presets:'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset(0, 0, 0, 0, 'Sin Recorte')}
                      className="py-1.5 px-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl border border-white/10 text-[11px] transition-colors cursor-pointer text-center"
                    >
                      0 mm
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(5, 5, 5, 5, 'Bordes Limpios (5mm)')}
                      className="py-1.5 px-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl border border-white/10 text-[11px] transition-colors cursor-pointer text-center"
                    >
                      5 mm
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(10, 10, 10, 10, 'Estándar (10mm)')}
                      className="py-1.5 px-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl border border-white/10 text-[11px] transition-colors cursor-pointer text-center"
                    >
                      10 mm
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(15, 15, 0, 0, 'Cabecera y Pie')}
                      className="py-1.5 px-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl border border-white/10 text-[11px] transition-colors cursor-pointer text-center"
                      title={isEs ? 'Eliminar 15mm arriba y abajo' : 'Remove 15mm top and bottom'}
                    >
                      {isEs ? 'Cab/Pie' : 'Top/Bot'}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS Y METADATOS PLEGABLES */}
              <div className="pt-3 border-t border-white/10 space-y-3 font-mono">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEs ? 'Prefijo del Archivo Resultante:' : 'Output File Prefix:'}
                  </label>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Recortado"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'AJUSTES DE NUMERACIÓN' : 'NUMBERING SETTINGS'}
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={renumberPages}
                      onChange={(e) => setRenumberPages(e.target.checked)}
                      className="accent-white w-4 h-4 rounded cursor-pointer"
                    />
                    <span>
                      {isEs
                        ? 'Re-numerar páginas en pie de página (Página N / M)'
                        : 'Re-number footer pages (Page N / M)'}
                    </span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE (PLEGABLE CON ACCORDEON) */}
                <div className="bg-zinc-950/70 rounded-xl border border-white/10 overflow-hidden font-mono">
                  <button
                    type="button"
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      {isEs ? 'Metadatos del PDF (Opcional)' : 'PDF Metadata (Optional)'}
                    </span>
                    {showMetadata ? (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>

                  {showMetadata && (
                    <div className="p-3 pt-1 border-t border-white/5 space-y-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">
                          {isEs ? 'Título:' : 'Title:'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            isEs ? 'Ej: Documento_Ajustado_2026' : 'Ex: Cropped_Document_2026'
                          }
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">
                          {isEs ? 'Autor / Organización:' : 'Author / Organization:'}
                        </label>
                        <input
                          type="text"
                          placeholder={isEs ? 'Ej: Mi Empresa S.A.' : 'Ex: Company Inc.'}
                          value={docAuthor}
                          onChange={(e) => setDocAuthor(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">
                          {isEs ? 'Asunto / Descripción:' : 'Subject / Description:'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            isEs
                              ? 'Ej: Ajuste de márgenes de escaneo'
                              : 'Ex: Margin crop adjustment'
                          }
                          value={docSubject}
                          onChange={(e) => setDocSubject(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TARJETA DE RESUMEN EN VIVO & BOTÓN PRINCIPAL */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              {/* TARJETA DE RESUMEN DINÁMICO EN VIVO */}
              {liveSummary && (
                <div className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-3 font-mono text-xs flex items-center justify-between shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                      {isEs ? 'Resumen del recorte' : 'Crop summary'}
                    </span>
                    <span className="text-white font-bold text-xs">
                      {liveSummary.scopeLabel} • {liveSummary.finalWidthMm}×
                      {liveSummary.finalHeightMm} mm
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                      {liveSummary.affectedPagesCount}{' '}
                      {liveSummary.affectedPagesCount === 1 ? 'pág' : 'págs'}
                    </span>
                  </div>
                </div>
              )}

              {/* BARRA DE PROGRESO */}
              {isProcessing && (
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                    <span className="truncate max-w-[200px]">{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-cyan-400 transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={executeCrop}
                disabled={isProcessing || !file || (isEncrypted && !isUnlocked)}
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-5 h-5 text-black" />
                )}
                <span>
                  {isProcessing
                    ? progressMsg
                    : !file
                      ? isEs
                        ? 'Selecciona un archivo PDF'
                        : 'Select a PDF file'
                      : isEs
                        ? 'Recortar Márgenes del PDF →'
                        : 'Crop PDF Margins →'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA CON CROP BOX */}
      <AnimatePresence>
        {previewZoom && pageDataUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono"
            onClick={() => setPreviewZoom(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#09090b] border border-white/20 p-6 rounded-2xl max-w-2xl w-full flex flex-col items-center gap-4 relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setPreviewZoom(false)}
                className="absolute top-4 right-4 p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-cyan-400" />
                <h4 className="text-white font-bold text-sm">
                  {isEs
                    ? `Previsualización Recorte - Página ${currentPage} de ${totalPages}`
                    : `Crop Preview - Page ${currentPage} of ${totalPages}`}
                </h4>
              </div>

              <div className="w-full max-h-[70vh] bg-zinc-950 rounded-xl overflow-hidden p-3 flex items-center justify-center shadow-inner relative border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative inline-block max-h-[65vh] max-w-full overflow-hidden rounded">
                  <img
                    src={pageDataUrl}
                    alt="Preview Zoom"
                    className="max-h-[65vh] object-contain block rounded bg-white shadow-2xl"
                  />
                  <div
                    className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/10 pointer-events-none rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.5),0_0_15px_rgba(6,182,212,0.7)]"
                    style={{
                      top: `${(marginTop / pageHeightMm) * 100}%`,
                      bottom: `${(marginBottom / pageHeightMm) * 100}%`,
                      left: `${(marginLeft / pageWidthMm) * 100}%`,
                      right: `${(marginRight / pageWidthMm) * 100}%`,
                    }}
                  >
                    <div className="absolute top-1.5 left-2 bg-cyan-400 text-black text-[9px] font-mono font-extrabold px-2 py-0.5 rounded shadow-lg flex items-center gap-1 uppercase tracking-wider">
                      <Crop className="w-3 h-3 text-black" />
                      <span>{isEs ? 'Área Conservada' : 'Conserved Area'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {liveSummary && (
                <div className="text-xs text-zinc-400 font-mono">
                  {isEs ? 'Dimensiones estimadas:' : 'Estimated dimensions:'}{' '}
                  <strong className="text-cyan-400 font-bold">
                    {liveSummary.finalWidthMm} × {liveSummary.finalHeightMm} mm
                  </strong>{' '}
                  (
                  {isEs
                    ? `Reducción de área: ${liveSummary.areaReductionPercent}%`
                    : `Area reduction: ${liveSummary.areaReductionPercent}%`}
                  )
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
