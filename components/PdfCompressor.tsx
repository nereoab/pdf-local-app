'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Sliders, FileDown, Loader2, X, ShieldCheck, FilePlus, Zap,
  ArrowRight, RefreshCw, FileText, UploadCloud, ChevronDown, ChevronUp,
  SlidersHorizontal, Shield, Target, Archive, FileCheck2, ChevronLeft, Eye,
  Layers, Package, AlertTriangle, CheckCircle2, Database, Gauge, Image as ImageIcon,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export default function PdfCompressor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  // === ESTADO MULTI-ARCHIVO (BATCH) ===
  const [files, setFiles] = useState<File[]>(globalFile ? [globalFile] : []);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);

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
  const [previewScale, setPreviewScale] = useState<number>(1.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; scrollX: number; scrollY: number }>({ x: 0, y: 0, scrollX: 0, scrollY: 0 });
  const viewerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // EFECTOS
  // ============================================================

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

  // Actualizar vista previa cuando cambia el archivo activo
  const activeFile = files[activeFileIdx] || null;

  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      renderPagePreview(activeFile, 1);
      setGlobalFile(activeFile);
    } else {
      setPreviewDataUrl(null);
      setTotalPages(1);
    }
  }, [activeFile]);

  // ============================================================
  // VISTA PREVIA
  // ============================================================

  // Ref para mantener la escala actual sin problemas de closure
  const previewScaleRef = useRef<number>(1.5);

  const renderPagePreview = useCallback(async (pdfFile: File, pageNum: number, scale?: number) => {
    const effectiveScale = scale ?? previewScaleRef.current;
    setIsLoadingPreview(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdfDoc.numPages);

      const targetPageNum = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
      const page = await pdfDoc.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: effectiveScale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.85));
      }
    } catch {
      // Error silencioso en preview
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const changePreviewPage = (delta: number) => {
    if (!activeFile) return;
    const newPage = Math.min(Math.max(1, previewPageNum + delta), totalPages);
    if (newPage !== previewPageNum) {
      setPreviewPageNum(newPage);
      renderPagePreview(activeFile, newPage);
    }
  };

  // ============================================================
  // MANEJO DE ARCHIVOS (BATCH)
  // ============================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (newFiles.length === 0) {
        toast.error(isEs ? 'Selecciona archivos PDF válidos' : 'Select valid PDF files');
        e.target.value = '';
        return;
      }
      if (newFiles.length !== e.target.files.length) {
        toast.warning(isEs
          ? `${e.target.files.length - newFiles.length} archivo(s) ignorado(s) por no ser PDF`
          : `${e.target.files.length - newFiles.length} file(s) ignored (not PDF)`);
      }

      setFiles(prev => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setGlobalFile(newFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
      toast.success(isEs
        ? `${newFiles.length} PDF(s) añadido(s) a la cola`
        : `${newFiles.length} PDF(s) added to queue`);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setResults(prev => prev.filter((_, i) => i !== idx));
    if (idx === activeFileIdx) {
      setActiveFileIdx(0);
    } else if (idx < activeFileIdx) {
      setActiveFileIdx(prev => Math.max(0, prev - 1));
    }
    if (files.length <= 1) {
      setGlobalFile(null);
    }
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setGlobalFile(null);
    setResults([]);
    setActiveFileIdx(0);
  };

  // ============================================================
  // COMPRESIÓN CON WEB WORKER
  // ============================================================

  const executeCompress = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg(isEs ? 'Iniciando motor de compresión en Web Worker...' : 'Starting compression engine in Web Worker...');
    setResults([]);
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
          };

          newResults.push(resultItem);
          setResults([...newResults]);

          // Descargar automáticamente al finalizar
          const originalName = msg.fileName.replace(/\.[^/.]+$/, '');
          const link = document.createElement('a');
          link.href = url;
          link.download = `${originalName}${customSuffix}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
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
          const overallReduction = totalOriginal > 0
            ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
            : 0;

          toast.success(isEs
            ? `¡${newResults.length} PDF(s) comprimido(s)! Reducción total: ${overallReduction}%`
            : `${newResults.length} PDF(s) compressed! Total reduction: ${overallReduction}%`);
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
  const overallReduction = totalOriginalSize > 0
    ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
    : 0;

  const hasResults = results.length > 0;
  const activeResult = results[activeFileIdx] || null;

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <div className="w-full max-w-7xl mx-auto">
      <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />

      {/* CABECERA */}
      <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/#herramientas"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-white/10" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / COMPRESIÓN Y OPTIMIZACIÓN DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Sliders className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'COMPRIMIR ARCHIVOS PDF (OPTIMIZAR TAMAÑO Y ESPACIO)' : 'COMPRESS PDF FILES (OPTIMIZE SIZE AND SPACE)'}</span>
            </h1>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <Package className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
              <span className="font-bold">{files.length}</span> {isEs ? 'archivo(s)' : 'file(s)'}
            </div>
            <button
              onClick={handleRemoveAllFiles}
              disabled={isProcessing}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? 'Quitar todos' : 'Remove all'}
            >
              <X className="w-4 h-4" />
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
          className="w-full max-w-3xl mx-auto bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
          >
            <UploadCloud className="w-12 h-12 text-white" />
          </motion.div>

          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs ? 'Arrastra tus PDFs aquí para optimizar' : 'Drop your PDFs here to optimize'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos (múltiples permitidos)' : 'Or click to browse your files (multiple allowed)'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" /> {isEs ? 'Subir Archivos' : 'Upload Files'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL • WEB WORKER' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING • WEB WORKER'}</span>
          </div>
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO DE 2 COLUMNAS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans items-stretch">

          {/* LADO IZQUIERDO: VISTA PREVIA + LISTA DE ARCHIVOS */}
          <div className="lg:col-span-5 flex flex-col gap-4">
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
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">{formatFileSize(f.size)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          {res && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              res.reductionPercent > 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-700/50 text-zinc-400'
                            }`}>
                              ↓{res.reductionPercent}%
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
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

            {/* VISTA PREVIA */}
            <div className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative font-mono flex-1 min-h-[520px]">
              {/* BARRA SUPERIOR */}
              <div className="bg-zinc-900 border-b border-white/10 p-3.5 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">{activeFile?.name || ''}</span>
                    <span className="text-zinc-400 text-[10px]">
                      {activeFile ? formatFileSize(activeFile.size) : ''}
                      {activeResult && (
                        <span className="text-emerald-400 ml-2">
                          → {formatFileSize(activeResult.compressedSize)} ({isEs ? '↓' : '↓'}{activeResult.reductionPercent}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Controles de zoom */}
                  <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl px-1.5 py-0.5 text-xs text-zinc-300">
                    <button
                      onClick={() => {
                        const newScale = Math.max(0.5, previewScale - 0.5);
                        previewScaleRef.current = newScale;
                        setPreviewScale(newScale);
                        if (activeFile) renderPagePreview(activeFile, previewPageNum, newScale);
                      }}
                      disabled={previewScale <= 0.5 || isLoadingPreview}
                      className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                      title={isEs ? 'Alejar' : 'Zoom out'}
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 text-[10px] font-mono font-bold text-white min-w-[40px] text-center">
                      {Math.round(previewScale * 100)}%
                    </span>
                    <button
                      onClick={() => {
                        const newScale = Math.min(3.0, previewScale + 0.5);
                        previewScaleRef.current = newScale;
                        setPreviewScale(newScale);
                        if (activeFile) renderPagePreview(activeFile, previewPageNum, newScale);
                      }}
                      disabled={previewScale >= 3.0 || isLoadingPreview}
                      className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                      title={isEs ? 'Acercar' : 'Zoom in'}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Navegación de páginas */}
                  <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl px-2 py-1 text-xs text-zinc-300">
                    <button
                      onClick={() => changePreviewPage(-1)}
                      disabled={previewPageNum <= 1 || isLoadingPreview}
                      className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-[11px] font-mono font-bold text-white">
                      {previewPageNum} / {totalPages}
                    </span>
                    <button
                      onClick={() => changePreviewPage(1)}
                      disabled={previewPageNum >= totalPages || isLoadingPreview}
                      className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENEDOR DE VISTA PREVIA */}
              <div
                ref={viewerRef}
                className={`w-full flex-1 bg-[#09090b] relative p-3 sm:p-5 min-h-[440px] overflow-auto ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={(e) => {
                  if (!viewerRef.current) return;
                  setIsPanning(true);
                  panStart.current = {
                    x: e.clientX,
                    y: e.clientY,
                    scrollX: viewerRef.current.scrollLeft,
                    scrollY: viewerRef.current.scrollTop,
                  };
                  e.preventDefault();
                }}
                onMouseMove={(e) => {
                  if (!isPanning || !viewerRef.current) return;
                  const dx = e.clientX - panStart.current.x;
                  const dy = e.clientY - panStart.current.y;
                  viewerRef.current.scrollLeft = panStart.current.scrollX - dx;
                  viewerRef.current.scrollTop = panStart.current.scrollY - dy;
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
              >
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[200px]">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">{isEs ? 'Generando previsualización...' : 'Rendering preview...'}</span>
                  </div>
                ) : previewDataUrl ? (
                  <div className="relative inline-block select-none pointer-events-none">
                    <img
                      src={previewDataUrl}
                      alt={`Página ${previewPageNum}`}
                      className="block rounded-lg shadow-2xl border border-white/15 bg-white"
                      style={{ maxWidth: 'none' }}
                      draggable={false}
                    />
                    <div className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>{isEs ? `Pág ${previewPageNum}/${totalPages}` : `Pg ${previewPageNum}/${totalPages}`}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <FileText className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-mono">{isEs ? 'Vista previa no disponible' : 'Preview unavailable'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans flex-1">

              <div>
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                      002 / CONFIGURACIÓN DE OPTIMIZACIÓN
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                    <Sliders className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* NIVEL DE COMPRESIÓN (3 PERFILES PROFESIONALES) */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                    {isEs ? 'Perfil de Compresión' : 'Compression Profile'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as CompressionLevel[]).map((lvl) => {
                      const configs: Record<CompressionLevel, {
                        labelEs: string; labelEn: string;
                        descEs: string; descEn: string;
                        icon: React.ElementType;
                        useCaseEs: string; useCaseEn: string;
                      }> = {
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
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            compressionLevel === lvl
                              ? 'border-white bg-zinc-800 text-white shadow-md'
                              : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold leading-tight">{isEs ? cfg.labelEs : cfg.labelEn}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${compressionLevel === lvl ? 'border-white bg-white' : 'border-zinc-500'}`}>
                              {compressionLevel === lvl && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-tight">{isEs ? cfg.descEs : cfg.descEn}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Icon className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[11px] font-mono font-bold bg-zinc-700/60 text-zinc-200 px-1.5 py-0.5 rounded">
                              ↓ {est.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OPCIONES AVANZADAS TOGGLE */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 bg-zinc-950/60 border border-white/8 rounded-xl p-4 max-h-[420px] overflow-y-auto">

                      {/* MODO DE COLOR */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Modo de Color de Salida' : 'Output Color Mode'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['original','grayscale','blackwhite'] as OutputColorMode[]).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setOutputColorMode(opt)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                outputColorMode === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {opt === 'original' ? '🎨 Color' : opt === 'grayscale' ? '⚪ Grises' : '■ B/N'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* DPI */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Resolución (DPI)' : 'Resolution (DPI)'}
                        </label>
                        <div className="flex gap-1.5">
                          {(['auto','72','96','150'] as DpiMode[]).map(dpi => (
                            <button
                              key={dpi}
                              onClick={() => setDpiMode(dpi)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
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
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {(['todas','pares','impares','rango'] as PageScope[]).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setPageScope(opt)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                pageScope === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {opt === 'todas' ? (isEs ? 'Todas' : 'All') : opt === 'pares' ? (isEs ? 'Pares' : 'Even') : opt === 'impares' ? (isEs ? 'Impares' : 'Odd') : (isEs ? 'Rango' : 'Range')}
                            </button>
                          ))}
                        </div>
                        {pageScope === 'rango' && (
                          <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder={isEs ? 'Ej: 1-3, 5, 8-12' : 'e.g. 1-3, 5, 8-12'}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                        )}
                      </div>

                      {/* PRESERVACIÓN DE TEXTO VECTORIAL Y PDF/A */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Preservación y Metadatos' : 'Preservation & Metadata'}
                        </label>

                        {/* Preservar texto vectorial */}
                        <div onClick={() => setPreserveTextVectors(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Preservar texto vectorial' : 'Preserve vector text'}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{isEs ? 'No rasteriza páginas sin imágenes' : 'Do not rasterize pages without images'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${preserveTextVectors ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${preserveTextVectors ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        {/* Detectar y preservar PDF/A */}
                        <div onClick={() => setDetectPdfA(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Detectar PDF/A' : 'Detect PDF/A'}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{isEs ? 'Identifica documentos para archivo público' : 'Identifies archival-grade documents'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${detectPdfA ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${detectPdfA ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        {detectPdfA && (
                          <div onClick={() => setPreservePdfA(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                            <div>
                              <p className="text-[11px] font-bold text-white">{isEs ? 'Preservar estructura PDF/A' : 'Preserve PDF/A structure'}</p>
                              <p className="text-[9px] text-zinc-500 font-mono">{isEs ? 'Mantiene conformidad para archivo a largo plazo' : 'Maintains long-term archival compliance'}</p>
                            </div>
                            <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${preservePdfA ? 'bg-white' : 'bg-zinc-700'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${preservePdfA ? 'left-4' : 'left-0.5'}`} />
                            </div>
                          </div>
                        )}

                        {/* Strip metadata */}
                        <div onClick={() => setStripMetadata(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Eliminar metadatos' : 'Strip metadata'}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{isEs ? 'Título, autor, software de creación' : 'Title, author, creation software'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${stripMetadata ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${stripMetadata ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        {/* Sufijo */}
                        <div>
                          <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">{isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}</label>
                          <input
                            type="text"
                            value={customSuffix}
                            onChange={e => setCustomSuffix(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                          <p className="text-[9px] font-mono text-zinc-600 mt-1">
                            {isEs ? `Ejemplo: archivo${customSuffix}.pdf` : `Example: file${customSuffix}.pdf`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BARRA DE PROGRESO + RESULTADOS */}
              <div>
                {/* BARRA DE PROGRESO REAL */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 font-mono">
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
                          {isEs ? `Archivo ${currentFileIndex} de ${totalFilesCount}` : `File ${currentFileIndex} of ${totalFilesCount}`}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RESUMEN DE RESULTADOS */}
                {hasResults && !isProcessing && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl font-mono">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">
                        {isEs ? 'Original total' : 'Total original'}: <strong className="text-white">{formatFileSize(totalOriginalSize)}</strong>
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-zinc-400">
                        {isEs ? 'Comprimido' : 'Compressed'}: <strong className="text-emerald-300">{formatFileSize(totalCompressedSize)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-block bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-lg text-xs border border-emerald-400/30">
                        ↓ {overallReduction}% {isEs ? 'ahorrado' : 'saved'} ({formatFileSize(totalOriginalSize - totalCompressedSize)} {isEs ? 'menos' : 'less'})
                      </div>

                      {results.some(r => r.wasPdfA) && (
                        <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded ${
                          results.some(r => r.pdfAStatus === 'broken')
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {results.some(r => r.pdfAStatus === 'broken') ? (
                            <><AlertTriangle className="w-3 h-3" /> {isEs ? 'PDF/A alterado' : 'PDF/A altered'}</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3" /> {isEs ? 'PDF/A preservado' : 'PDF/A preserved'}</>
                          )}
                        </div>
                      )}
                    </div>

                    {results.length > 1 && (
                      <div className="mt-3 text-[10px] text-zinc-500 space-y-1 max-h-24 overflow-y-auto">
                        {results.map((r, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="truncate max-w-[60%]">{r.fileName}</span>
                            <span className={r.reductionPercent > 0 ? 'text-emerald-400' : 'text-zinc-500'}>
                              {formatFileSize(r.originalSize)} → {formatFileSize(r.compressedSize)} (↓{r.reductionPercent}%)
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
                              ? files.length > 1 ? `Comprimir ${files.length} archivos` : 'Comprimir PDF'
                              : files.length > 1 ? `Compress ${files.length} files` : 'Compress PDF'}
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

      
      <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><Sliders className="w-5 h-5 text-white" /></div>
            <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '1. Cómo comprimir un PDF' : '1. How to compress a PDF'}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[{step:'01',es:'Sube tu archivo PDF a la zona de carga.',en:'Upload your PDF to the upload zone.'},{step:'02',es:'Selecciona el nivel de compresión: Baja, Media o Alta.',en:'Select the compression level: Low, Medium, or High.'},{step:'03',es:'Configura opciones avanzadas: DPI, color, páginas y metadatos.',en:'Configure advanced options: DPI, color, pages, and metadata.'},{step:'04',es:'Haz clic en "Comprimir PDF →" y descarga el archivo optimizado.',en:'Click "Compress PDF →" and download the optimized file.'}].map((item,i)=>(<div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2"><span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span><p className="text-xs text-zinc-400 leading-relaxed">{isEs?item.es:item.en}</p></div>))}
          </div>
        </div>
        <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
            <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'2. Limitaciones y consejos útiles':'2. Limitations & useful tips'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3"><h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs?'LO QUE PUEDES HACER':'WHAT YOU CAN DO'}</h4>
              {[isEs?'Reducir el tamaño de archivos PDF hasta un 90%.':'Reduce PDF file size by up to 90%.',isEs?'Elegir entre 3 niveles de compresión según el uso final.':'Choose between 3 compression levels based on final use.',isEs?'Mantener texto vectorial y gráficos perfectamente legibles.':'Keep vector text and graphics perfectly readable.',isEs?'Procesar múltiples archivos en lote con Web Worker.':'Process multiple files in batch with Web Worker.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span><span>{t}</span></div>))}
            </div>
            <div className="space-y-3"><h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs?'CONSEJOS':'TIPS'}</h4>
              {[isEs?'Usa compresión baja para documentos que serán impresos en alta calidad.':'Use low compression for documents to be printed in high quality.',isEs?'Usa compresión media para documentos de uso general (email, almacenamiento).':'Use medium compression for general-use documents (email, storage).',isEs?'Usa compresión alta para documentos solo para pantalla con límites de tamaño.':'Use high compression for screen-only documents with size limits.',isEs?'El texto vectorial no se ve afectado — permanece siempre nítido.':'Vector text is unaffected — it always remains sharp.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-amber-400 flex-shrink-0 mt-0.5">→</span><span>{t}</span></div>))}
            </div>
          </div>
        </div>
        <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
            <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'3. ¿Qué sucede con tu documento al comprimirlo?':'3. What happens to your document when compressing it?'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🖥️ {isEs?'Procesamiento 100% local':'100% local processing'}</strong><p className="text-[11px]">{isEs?'La compresión se ejecuta en la RAM de tu navegador. Tus documentos nunca salen de tu equipo.':'Compression runs in your browser RAM. Your documents never leave your device.'}</p></div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🗜️ {isEs?'Recompresión inteligente de imágenes':'Smart image recompression'}</strong><p className="text-[11px]">{isEs?'Cada imagen JPEG se re-codifica vía Canvas 2D. Se eliminan metadatos redundantes y se aplica compresión deflate a los streams.':'Each JPEG image is re-encoded via Canvas 2D. Redundant metadata is removed and deflate compression is applied to streams.'}</p></div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">📥 {isEs?'Descarga directa y segura':'Direct & secure download'}</strong><p className="text-[11px]">{isEs?'El PDF comprimido se genera localmente. El motor reporta el porcentaje de reducción.':'The compressed PDF is generated locally. The engine reports the reduction percentage.'}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}