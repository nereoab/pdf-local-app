'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Sliders,
  FileDown,
  Loader2,
  X,
  ShieldCheck,
  FilePlus,
  Zap,
  ArrowRight,
  RefreshCw,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Shield,
  Target,
  Archive,
  FileCheck2,
  ChevronLeft,
  Eye,
  Layers,
  Package,
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';

type CompressionLevel = 'high' | 'medium' | 'low';
type OutputColorMode = 'original' | 'grayscale' | 'blackwhite';
type DpiMode = 'auto' | '72' | '96' | '150';
type PageScope = 'todas' | 'pares' | 'impares' | 'rango';

interface CompressionResultItem {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  wasPdfA: boolean;
  pdfAStatus: 'preserved' | 'broken' | 'not-applicable';
  downloadUrl: string;
  rawBlob?: Blob;
}

interface CompletedCompressionResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  rawBlob?: Blob;
  totalOriginalSize: number;
  totalCompressedSize: number;
  overallReduction: number;
  items: CompressionResultItem[];
}

export default function PdfCompressor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  // === ESTADO MULTI-ARCHIVO (BATCH) ===
  const [files, setFiles] = useState<File[]>(globalFile ? [globalFile] : []);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);

  // === ESTADO DE ÉXITO DE COMPRESIÓN ===
  const [completedResult, setCompletedResult] = useState<CompletedCompressionResult | null>(null);

  // === CONFIGURACIÓN DE COMPRESIÓN ===
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [outputColorMode, setOutputColorMode] = useState<OutputColorMode>('original');
  const [dpiMode, setDpiMode] = useState<DpiMode>('auto');
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Comprimido');
  const [preserveTextVectors, setPreserveTextVectors] = useState(true);
  const [preservePdfA, setPreservePdfA] = useState(true);
  const [detectPdfA, setDetectPdfA] = useState(true);

  // === ESTADO DE PROCESAMIENTO CON WEB WORKER ===
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  // Refs para mutar valores dentro de callbacks sin depender de closures stale
  const resultsRef = useRef<CompressionResultItem[]>([]);
  const filesCountRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // === RESULTADOS DE COMPRESIÓN ===
  const [results, setResults] = useState<CompressionResultItem[]>([]);

  // === VISTA PREVIA DE PÁGINA ===
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Altura sincronizada para igualar panel de vista previa al panel de control
  const [previewHeight, setPreviewHeight] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  // ============================================================
  // EFECTOS Y GENERACIÓN DE MINIATURAS DEL DOCUMENTO
  // ============================================================

  // Ocultar barra superior global y posicionar la vista en el tope de la página
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);

      // Posicionar en el tope absoluto (y = 0) para mantener el margen y vista completa del título
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const raf = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      });

      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 50);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  // Restaurar barra superior al desmontar
  useEffect(() => {
    return () => {
      setHeaderHidden(false);
    };
  }, [setHeaderHidden]);

  useEffect(() => {
    if (globalFile && files.length === 0) {
      setFiles([globalFile]);
    }
  }, [globalFile, files.length]);

  // Limpiar worker al desmontar
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const activeFile = files[activeFileIdx] || null;

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Sincronizar altura del panel de vista previa con la del panel de control
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const updateHeight = () => {
      if (controlPanelRef.current) {
        const h = controlPanelRef.current.getBoundingClientRect().height;
        if (h > 0) setPreviewHeight(h);
      }
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.target.getBoundingClientRect().height;
        if (h > 0) {
          setPreviewHeight(h);
        }
      }
    });
    observer.observe(controlPanelRef.current);
    updateHeight();
    return () => observer.disconnect();
  }, [
    files,
    compressionLevel,
    outputColorMode,
    dpiMode,
    pageScope,
    preserveTextVectors,
    detectPdfA,
    preservePdfA,
    stripMetadata,
    isProcessing,
    results,
  ]);

  const loadFileThumbnails = useCallback(async (pdfFile: File) => {
    setIsLoadingThumbnails(true);
    setThumbnails([]);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const total = pdfDoc.numPages;
      setTotalPages(total);

      const generated: { pageNum: number; dataUrl: string }[] = [];
      const maxThumbnails = Math.min(total, 60);

      for (let pn = 1; pn <= maxThumbnails; pn++) {
        const page = await pdfDoc.getPage(pn);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
            typeof page.render
          >[0]).promise;
          generated.push({ pageNum: pn, dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
        }
      }
      setThumbnails(generated);
    } catch (err) {
      console.error('Error al generar miniaturas:', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      loadFileThumbnails(activeFile);
      setGlobalFile(activeFile);
    } else {
      setThumbnails([]);
      setTotalPages(1);
    }
  }, [activeFile, loadFileThumbnails]);

  // ============================================================
  // MANEJO DE ARCHIVOS (BATCH)
  // ============================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type === 'application/pdf');
      if (newFiles.length === 0) {
        toast.error(isEs ? 'Selecciona archivos PDF válidos' : 'Select valid PDF files');
        e.target.value = '';
        return;
      }
      if (newFiles.length !== e.target.files.length) {
        toast.warning(
          isEs
            ? `${e.target.files.length - newFiles.length} archivo(s) ignorado(s) por no ser PDF`
            : `${e.target.files.length - newFiles.length} file(s) ignored (not PDF)`,
        );
      }

      setFiles((prev) => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setGlobalFile(newFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
      setCompletedResult(null);
      toast.success(
        isEs
          ? `${newFiles.length} PDF(s) añadido(s) a la cola`
          : `${newFiles.length} PDF(s) added to queue`,
      );
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setResults((prev) => prev.filter((_, i) => i !== idx));
    setCompletedResult(null);
    if (idx === activeFileIdx) {
      setActiveFileIdx(0);
    } else if (idx < activeFileIdx) {
      setActiveFileIdx((prev) => Math.max(0, prev - 1));
    }
    if (files.length <= 1) {
      setGlobalFile(null);
    }
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setGlobalFile(null);
    setResults([]);
    setCompletedResult(null);
    setActiveFileIdx(0);
  };

  // ============================================================
  // COMPRESIÓN CON WEB WORKER
  // ============================================================

  const executeCompress = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg(
      isEs
        ? 'Iniciando motor de compresión en Web Worker...'
        : 'Starting compression engine in Web Worker...',
    );
    setResults([]);
    setCompletedResult(null);
    setTotalFilesCount(files.length);
    setCurrentFileIndex(0);

    try {
      // Leer todos los archivos como ArrayBuffer
      const fileBuffers: Array<{ buffer: ArrayBuffer; name: string }> = [];
      for (const f of files) {
        const buffer = await f.arrayBuffer();
        fileBuffers.push({ buffer, name: f.name });
      }

      // Crear Web Worker
      // Usamos URL directa al archivo compilado en /workers/
      const workerUrl = new URL('../workers/pdf-compress.worker.ts', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });
      workerRef.current = worker;

      const newResults: CompressionResultItem[] = [];

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;

        if (msg.type === 'progress') {
          setProgressPercent(msg.percent);
          setProgressMsg(msg.message);
          setCurrentFileIndex(msg.currentFile);
          setTotalFilesCount(msg.totalFiles);
        } else if (msg.type === 'result') {
          const blob = new Blob([msg.compressedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);

          const resultItem: CompressionResultItem = {
            fileName: msg.fileName,
            originalSize: msg.originalSize,
            compressedSize: msg.compressedSize,
            reductionPercent: msg.reductionPercent,
            wasPdfA: msg.wasPdfA,
            pdfAStatus: msg.pdfAStatus,
            downloadUrl: url,
            rawBlob: blob,
          };

          newResults.push(resultItem);
          setResults([...newResults]);
        } else if (msg.type === 'error') {
          toast.error(msg.message);
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        toast.error(isEs ? 'Error en el motor de compresión' : 'Compression engine error');
        setIsProcessing(false);
      };

      // Enviar trabajo al worker
      worker.postMessage({
        files: fileBuffers,
        options: {
          level: compressionLevel,
          outputColorMode,
          dpiMode,
          pageScope,
          pageRange: pageScope === 'rango' ? pageRange : undefined,
          stripMetadata,
          preserveTextVectors,
          preservePdfA,
          detectPdfA,
          customSuffix,
        },
      });

      // Monitorear finalización (el worker envía progress 100 al terminar)
      const checkCompletion = setInterval(() => {
        if (progressPercent >= 100 || newResults.length >= files.length) {
          clearInterval(checkCompletion);
          setIsProcessing(false);
          worker.terminate();
          workerRef.current = null;

          const totalOriginal = newResults.reduce((acc, r) => acc + r.originalSize, 0);
          const totalCompressed = newResults.reduce((acc, r) => acc + r.compressedSize, 0);
          const overallReduction =
            totalOriginal > 0
              ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
              : 0;

          const firstItem = newResults[0];
          const originalName = firstItem
            ? firstItem.fileName.replace(/\.[^/.]+$/, '')
            : 'Documento';
          const outName = `${originalName}${customSuffix}.pdf`;

          setCompletedResult({
            downloadUrl: firstItem ? firstItem.downloadUrl : '',
            filename: outName,
            fileSize: firstItem ? formatFileSize(firstItem.compressedSize) : '',
            rawBlob: firstItem ? firstItem.rawBlob : undefined,
            totalOriginalSize: totalOriginal,
            totalCompressedSize: totalCompressed,
            overallReduction,
            items: [...newResults],
          });

          toast.success(
            isEs
              ? `¡${newResults.length} PDF(s) comprimido(s)! Reducción total: ${overallReduction}%`
              : `${newResults.length} PDF(s) compressed! Total reduction: ${overallReduction}%`,
          );
        }
      }, 300);
    } catch (error) {
      console.error('Compression error:', error);
      toast.error(isEs ? 'Error al iniciar la compresión' : 'Error starting compression');
      setIsProcessing(false);
    }
  };

  // ============================================================
  // UTILIDADES
  // ============================================================

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedReduction = (level: CompressionLevel) => {
    const ranges: Record<CompressionLevel, { min: number; max: number; label: string }> = {
      low: { min: 10, max: 40, label: isEs ? '10-40%' : '10-40%' },
      medium: { min: 40, max: 70, label: isEs ? '40-70%' : '40-70%' },
      high: { min: 60, max: 90, label: isEs ? '60-90%' : '60-90%' },
    };
    return ranges[level];
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalCompressedSize = results.reduce((acc, r) => acc + r.compressedSize, 0);
  const overallReduction =
    totalOriginalSize > 0
      ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
      : 0;

  const hasResults = results.length > 0;
  const activeResult = results[activeFileIdx] || null;

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <div className="w-full max-w-7xl mx-auto">
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/optimizar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-zinc-700" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / COMPRESIÓN Y OPTIMIZACIÓN DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Sliders className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'COMPRIMIR ARCHIVOS PDF (OPTIMIZAR TAMAÑO Y ESPACIO)'
                  : 'COMPRESS PDF FILES (OPTIMIZE SIZE AND SPACE)'}
              </span>
            </h1>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <Package className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold">{files.length}</span> {isEs ? 'archivo(s)' : 'file(s)'}
            </div>
            <button
              onClick={handleRemoveAllFiles}
              disabled={isProcessing}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar todos' : 'Remove all'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        /* DROPZONE SIN ARCHIVOS */
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
            {isEs
              ? 'COMPRIMIR ARCHIVOS PDF (OPTIMIZAR TAMAÑO Y ESPACIO)'
              : 'COMPRESS PDF FILES (OPTIMIZE SIZE AND SPACE)'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Reduce el peso de tus documentos PDF manteniendo la máxima calidad posible de forma 100% confidencial y local.'
              : 'Reduce the file size of your PDF documents with local confidential processing.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />{' '}
            {isEs ? 'Seleccionar Archivos PDF' : 'Select PDF Files'}
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
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO Y DESCARGA CON METRICAS DE COMPRESIÓN */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE METRICAS DE COMPRESIÓN (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-2xl text-white shadow-md">
                  <Zap className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA COMPRESIÓN' : 'COMPRESSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? '¡Documento optimizado con éxito!' : 'Document optimized successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-2xl min-w-[140px] shadow-sm">
                <div className="w-full text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Ahorro de espacio' : 'Space saved'}
                  </div>
                  <div className="text-[#FAF6EE] font-extrabold text-base flex items-center justify-end gap-1">
                    <span>↓ {completedResult.overallReduction}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#FAF6EE] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(250,246,238,0.5)]"
                      style={{
                        width: `${Math.min(Math.max(completedResult.overallReduction, 6), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.totalOriginalSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold">
                    {isEs ? 'Tamaño Comprimido' : 'Compressed Size'}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-[#FAF6EE]/10 border border-[#E8DFCF]/30 text-[#E8DFCF] rounded font-mono font-bold">
                    -{completedResult.overallReduction}%
                  </span>
                </div>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.totalCompressedSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Espacio Reducido' : 'Space Reduced'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(
                    completedResult.totalOriginalSize - completedResult.totalCompressedSize,
                  )}
                </span>
              </div>
            </div>

            {completedResult.items.length > 1 && (
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase tracking-wider">
                  {isEs
                    ? `Archivos procesados (${completedResult.items.length})`
                    : `Processed files (${completedResult.items.length})`}
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {completedResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#121217] p-3 rounded-xl border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[50%]">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate text-white font-mono">{item.fileName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-mono text-[11px]">
                          {formatFileSize(item.originalSize)} →{' '}
                          <strong className="text-[#FAF6EE]">
                            {formatFileSize(item.compressedSize)}
                          </strong>
                        </span>
                        <a
                          href={item.downloadUrl}
                          download={`${item.fileName.replace(/\.[^/.]+$/, '')}${customSuffix}.pdf`}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-[#FAF6EE] via-[#E8DFCF] to-[#DFD5C2] text-black hover:opacity-90 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(232,223,207,0.25)]"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>{isEs ? 'Descargar' : 'Download'}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TARJETA DE DESCARGA ÉXITO (DownloadSuccessCard) */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="comprimir"
            onReset={handleRemoveAllFiles}
          />
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO DE 2 COLUMNAS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans items-stretch">
          {/* LADO IZQUIERDO: VISTA PREVIA + LISTA DE ARCHIVOS */}
          <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 h-full overflow-hidden">
            {/* LISTA DE ARCHIVOS (BATCH) */}
            {files.length > 1 && (
              <div className="bg-[#09090b] border border-white/10 rounded-xl p-3 max-h-[180px] overflow-y-auto">
                <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                  {isEs ? 'Cola de archivos' : 'File queue'} ({files.length})
                </span>
                <div className="space-y-1.5">
                  {files.map((f, i) => {
                    const res = results[i];
                    return (
                      <div
                        key={i}
                        onClick={() => setActiveFileIdx(i)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs ${
                          i === activeFileIdx
                            ? 'bg-zinc-800 border border-white/20 text-white'
                            : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                          <span className="truncate font-mono">{f.name}</span>
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">
                            {formatFileSize(f.size)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          {res && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                res.reductionPercent > 0
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-zinc-700/50 text-zinc-400'
                              }`}
                            >
                              ↓{res.reductionPercent}%
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(i);
                            }}
                            disabled={isProcessing}
                            className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="mt-2 w-full text-[10px] font-mono text-zinc-500 hover:text-white py-1.5 border border-dashed border-white/10 hover:border-white/30 rounded-lg transition-all cursor-pointer"
                >
                  + {isEs ? 'Añadir más archivos' : 'Add more files'}
                </button>
              </div>
            )}

            {/* VISTA PREVIA CON GRILLA DE MINIATURAS DEL DOCUMENTO */}
            <div
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative font-mono"
              style={{
                height: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                maxHeight: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                minHeight: '300px',
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              {/* BARRA SUPERIOR DE METADATOS Y MINIATURAS */}
              <div className="bg-[#121217] border-b border-zinc-800 p-3.5 flex justify-between items-center z-10 font-sans flex-shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 flex-shrink-0 text-white">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden font-mono">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">
                      {activeFile?.name || ''}
                    </span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1.5">
                      <span>{activeFile ? formatFileSize(activeFile.size) : ''}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-300 font-bold">
                        {isEs
                          ? `Est. ~↓${getEstimatedReduction(compressionLevel).label}`
                          : `Est. ~↓${getEstimatedReduction(compressionLevel).label}`}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>
                      {isEs ? `Miniaturas (${totalPages} págs)` : `Thumbnails (${totalPages} pgs)`}
                    </span>
                  </span>
                </div>
              </div>

              {/* GRILLA DE MINIATURAS DE PÁGINAS (OCUPA TODO EL VISOR) */}
              <div className="w-full flex-1 min-h-0 max-lg:max-h-[500px] bg-[#0c0c0f] relative p-3 sm:p-4 overflow-y-auto font-sans flex flex-col justify-start custom-scrollbar">
                {isLoadingThumbnails ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[320px] my-auto">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">
                      {isEs
                        ? 'Generando miniaturas de las páginas...'
                        : 'Generating page thumbnails...'}
                    </span>
                  </div>
                ) : thumbnails.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 w-full">
                    {thumbnails.map((thumb) => (
                      <div
                        key={thumb.pageNum}
                        onClick={() => setPreviewPageNum(thumb.pageNum)}
                        className={`group relative bg-[#18181f] rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-2 shadow-sm hover:shadow-md ${
                          previewPageNum === thumb.pageNum
                            ? 'border-white ring-2 ring-white/40 bg-zinc-800 scale-[1.02]'
                            : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-xl border border-zinc-700/80 bg-white flex items-center justify-center min-h-[110px] max-h-[140px] w-full p-1 shadow-inner">
                          <img
                            src={thumb.dataUrl}
                            alt={`Página ${thumb.pageNum}`}
                            className="max-h-[130px] w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <div className="w-full flex items-center justify-between pt-0.5 font-mono text-[10px]">
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-lg ${
                              previewPageNum === thumb.pageNum
                                ? 'bg-white text-black font-extrabold shadow-sm'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {isEs ? `Pág ${thumb.pageNum}` : `Pg ${thumb.pageNum}`}
                          </span>
                          {previewPageNum === thumb.pageNum && (
                            <span className="text-white text-[9px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              {isEs ? 'Seleccionada' : 'Selected'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[320px] my-auto">
                    <FileText className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-mono">
                      {isEs ? 'Sin miniaturas disponibles' : 'No thumbnails available'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              ref={controlPanelRef}
              className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between gap-3 relative shadow-2xl font-sans overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div>
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-0.5">
                      002 / CONFIGURACIÓN DE OPTIMIZACIÓN
                    </span>
                    <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-700 text-white shadow-sm">
                    <Sliders className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>

                {/* NIVEL DE COMPRESIÓN (3 PERFILES PROFESIONALES) */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase">
                    {isEs ? 'Perfil de Compresión' : 'Compression Profile'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as CompressionLevel[]).map((lvl) => {
                      const configs: Record<
                        CompressionLevel,
                        {
                          labelEs: string;
                          labelEn: string;
                          descEs: string;
                          descEn: string;
                          icon: React.ElementType;
                          useCaseEs: string;
                          useCaseEn: string;
                        }
                      > = {
                        low: {
                          labelEs: 'Baja (Alta Calidad)',
                          labelEn: 'Low (High Quality)',
                          descEs: 'Optimización sin pérdida visible',
                          descEn: 'Lossless optimization',
                          icon: Shield,
                          useCaseEs: 'Planos técnicos CAD, líneas finas y cotas legibles',
                          useCaseEn: 'CAD blueprints, fine lines & dimensions readable',
                        },
                        medium: {
                          labelEs: 'Media (Recomendada)',
                          labelEn: 'Medium (Recommended)',
                          descEs: 'Balance calidad-compresión',
                          descEn: 'Quality-compression balance',
                          icon: Gauge,
                          useCaseEs: 'Informes CAO, reportes con texto e imágenes',
                          useCaseEn: 'Progress reports, text & image documents',
                        },
                        high: {
                          labelEs: 'Alta (Máxima Compresión)',
                          labelEn: 'High (Maximum Compression)',
                          descEs: 'Reducción extrema, downsampling agresivo',
                          descEn: 'Extreme reduction, aggressive downsampling',
                          icon: Zap,
                          useCaseEs: 'Envíos por correo con límite de peso',
                          useCaseEn: 'Email with file size limits',
                        },
                      };
                      const cfg = configs[lvl];
                      const Icon = cfg.icon;
                      const est = getEstimatedReduction(lvl);

                      return (
                        <div
                          key={lvl}
                          onClick={() => !isProcessing && setCompressionLevel(lvl)}
                          className={`relative p-2.5 rounded-2xl border cursor-pointer transition-all ${
                            compressionLevel === lvl
                              ? 'border-white bg-zinc-800 text-white shadow-md'
                              : 'border-zinc-700/80 bg-[#121217] text-zinc-400 hover:text-white hover:border-zinc-600'
                          }`}
                        >
                          {lvl === 'medium' && (
                            <span className="absolute -top-2 right-2 bg-white text-black text-[8px] font-black font-mono px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-sm">
                              {isEs ? 'Recomendado' : 'Best Choice'}
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold leading-tight">
                              {isEs ? cfg.labelEs : cfg.labelEn}
                            </span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${compressionLevel === lvl ? 'border-white bg-white' : 'border-zinc-600'}`}
                            >
                              {compressionLevel === lvl && (
                                <div className="w-1.5 h-1.5 rounded-full bg-black" />
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight">
                            {isEs ? cfg.descEs : cfg.descEn}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Icon className="w-3 h-3 text-zinc-400" />
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                compressionLevel === lvl
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              ↓ {est.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OPCIONES AVANZADAS (SIEMPRE VISIBLES Y SIN SCROLL) */}
                <div className="mb-4 space-y-3 bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 sm:p-4 shadow-inner">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white font-mono tracking-wider border-b border-zinc-800 pb-2 mb-2 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                    <span>
                      {isEs
                        ? 'OPCIONES AVANZADAS DE OPTIMIZACIÓN'
                        : 'ADVANCED OPTIMIZATION OPTIONS'}
                    </span>
                  </div>

                  {/* MODO DE COLOR */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Modo de Color de Salida' : 'Output Color Mode'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['original', 'grayscale', 'blackwhite'] as OutputColorMode[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setOutputColorMode(opt)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                            outputColorMode === opt
                              ? 'border-white bg-zinc-700 text-white'
                              : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {opt === 'original'
                            ? '🎨 Color'
                            : opt === 'grayscale'
                              ? '⚪ Grises'
                              : '■ B/N'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DPI */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Resolución (DPI)' : 'Resolution (DPI)'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['auto', '72', '96', '150'] as DpiMode[]).map((dpi) => (
                        <button
                          key={dpi}
                          onClick={() => setDpiMode(dpi)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                            dpiMode === dpi
                              ? 'border-white bg-zinc-700 text-white'
                              : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {dpi === 'auto' ? (isEs ? 'Auto' : 'Auto') : `${dpi}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ALCANCE DE PÁGINAS */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <FileCheck2 className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                      {(['todas', 'pares', 'impares', 'rango'] as PageScope[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setPageScope(opt)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                            pageScope === opt
                              ? 'border-white bg-zinc-700 text-white'
                              : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {opt === 'todas'
                            ? isEs
                              ? 'Todas'
                              : 'All'
                            : opt === 'pares'
                              ? isEs
                                ? 'Pares'
                                : 'Even'
                              : opt === 'impares'
                                ? isEs
                                  ? 'Impares'
                                  : 'Odd'
                                : isEs
                                  ? 'Rango'
                                  : 'Range'}
                        </button>
                      ))}
                    </div>
                    {pageScope === 'rango' && (
                      <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder={isEs ? 'Ej: 1-3, 5, 8-12' : 'e.g. 1-3, 5, 8-12'}
                        className="w-full bg-zinc-900 border border-white/15 text-white text-[10px] font-mono placeholder-zinc-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/40 transition"
                      />
                    )}
                  </div>

                  {/* PRESERVACIÓN DE TEXTO VECTORIAL Y PDF/A */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Preservación y Metadatos' : 'Preservation & Metadata'}
                    </label>

                    {/* Preservar texto vectorial */}
                    <div
                      onClick={() => setPreserveTextVectors((v) => !v)}
                      className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-white">
                          {isEs ? 'Preservar texto vectorial' : 'Preserve vector text'}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          {isEs
                            ? 'No rasteriza páginas sin imágenes'
                            : 'Do not rasterize pages without images'}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${preserveTextVectors ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${preserveTextVectors ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    {/* Detectar y preservar PDF/A */}
                    <div
                      onClick={() => setDetectPdfA((v) => !v)}
                      className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-white">
                          {isEs ? 'Detectar PDF/A' : 'Detect PDF/A'}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          {isEs
                            ? 'Identifica documentos para archivo público'
                            : 'Identifies archival-grade documents'}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${detectPdfA ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${detectPdfA ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    {detectPdfA && (
                      <div
                        onClick={() => setPreservePdfA((v) => !v)}
                        className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-white">
                            {isEs ? 'Preservar estructura PDF/A' : 'Preserve PDF/A structure'}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono">
                            {isEs
                              ? 'Mantiene conformidad para archivo a largo plazo'
                              : 'Maintains long-term archival compliance'}
                          </p>
                        </div>
                        <div
                          className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${preservePdfA ? 'bg-white' : 'bg-zinc-700'}`}
                        >
                          <div
                            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${preservePdfA ? 'left-4' : 'left-0.5'}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Strip metadata */}
                    <div
                      onClick={() => setStripMetadata((v) => !v)}
                      className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-white">
                          {isEs ? 'Eliminar metadatos' : 'Strip metadata'}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          {isEs
                            ? 'Título, autor, software de creación'
                            : 'Title, author, creation software'}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${stripMetadata ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${stripMetadata ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    {/* Sufijo */}
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                        {isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}
                      </label>
                      <input
                        type="text"
                        value={customSuffix}
                        onChange={(e) => setCustomSuffix(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/15 text-white text-[10px] font-mono placeholder-zinc-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/40 transition"
                      />
                      <p className="text-[9px] font-mono text-zinc-600 mt-0.5">
                        {isEs
                          ? `Ejemplo: archivo${customSuffix}.pdf`
                          : `Example: file${customSuffix}.pdf`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESO + RESULTADOS Y BOTÓN PRINCIPAL */}
              <div className="pt-2.5 border-t border-white/10 font-sans">
                {/* BARRA DE PROGRESO REAL */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 font-mono"
                    >
                      <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
                        <span className="truncate mr-2">{progressMsg}</span>
                        <span className="font-bold tabular-nums">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-white/10">
                        <motion.div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ ease: 'easeInOut', duration: 0.3 }}
                        />
                      </div>
                      {totalFilesCount > 1 && (
                        <p className="text-[9px] text-zinc-500 mt-1 text-center">
                          {isEs
                            ? `Archivo ${currentFileIndex} de ${totalFilesCount}`
                            : `File ${currentFileIndex} of ${totalFilesCount}`}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RESUMEN DE RESULTADOS */}
                {hasResults && !isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl font-mono"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">
                        {isEs ? 'Original total' : 'Total original'}:{' '}
                        <strong className="text-white">{formatFileSize(totalOriginalSize)}</strong>
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-zinc-400">
                        {isEs ? 'Comprimido' : 'Compressed'}:{' '}
                        <strong className="text-emerald-300">
                          {formatFileSize(totalCompressedSize)}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-block bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-lg text-xs border border-emerald-400/30">
                        ↓ {overallReduction}% {isEs ? 'ahorrado' : 'saved'} (
                        {formatFileSize(totalOriginalSize - totalCompressedSize)}{' '}
                        {isEs ? 'menos' : 'less'})
                      </div>

                      {results.some((r) => r.wasPdfA) && (
                        <div
                          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded ${
                            results.some((r) => r.pdfAStatus === 'broken')
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {results.some((r) => r.pdfAStatus === 'broken') ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />{' '}
                              {isEs ? 'PDF/A alterado' : 'PDF/A altered'}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />{' '}
                              {isEs ? 'PDF/A preservado' : 'PDF/A preserved'}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {results.length > 1 && (
                      <div className="mt-3 text-[10px] text-zinc-500 space-y-1 max-h-24 overflow-y-auto">
                        {results.map((r, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="truncate max-w-[60%]">{r.fileName}</span>
                            <span
                              className={
                                r.reductionPercent > 0 ? 'text-emerald-400' : 'text-zinc-500'
                              }
                            >
                              {formatFileSize(r.originalSize)} → {formatFileSize(r.compressedSize)}{' '}
                              (↓{r.reductionPercent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* BOTÓN PRINCIPAL */}
                <div className="space-y-3 pt-2">
                  {!hasResults ? (
                    <button
                      onClick={executeCompress}
                      disabled={isProcessing || files.length === 0}
                      className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>{isEs ? 'Comprimiendo...' : 'Compressing...'}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-black" />
                          <span>
                            {isEs
                              ? files.length > 1
                                ? `Comprimir ${files.length} archivos`
                                : 'Comprimir PDF'
                              : files.length > 1
                                ? `Compress ${files.length} files`
                                : 'Compress PDF'}
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 font-sans">
                      <button
                        onClick={handleRemoveAllFiles}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Comprimir otros archivos' : 'Compress other files'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* INDICADOR WEB WORKER */}
                <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isEs ? 'Web Worker Activo' : 'Web Worker Active'}
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Database className="w-3 h-3" />
                    {isEs ? '100% Local' : '100% Local'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
