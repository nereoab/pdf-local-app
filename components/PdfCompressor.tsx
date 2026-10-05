'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Sliders,
  Loader2,
  X,
  Zap,
  FileText,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Shield,
  Target,
  Archive,
  FileCheck2,
  Image as ImageIcon,
  Trash2,
  Plus,
  Sparkles,
  HardDrive,
  Maximize2,
  Download,
  Activity,
  Layers,
  Split,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import FoliarSuccessView from './FoliarSuccessView';
import JSZip from 'jszip';
import type {
  CompressionLevel,
  OutputColorMode,
  DpiMode,
  PageScope,
  EnterpriseCompressionOptions,
  DocumentAnatomy,
  CompressionResult,
  CompressionProgress,
  CompressionAnalysisResult,
  CompressionError,
} from '@/workers/pdf-compress.worker';

export type { CompressionLevel, OutputColorMode, DpiMode, PageScope };

export interface CompressionResultItem {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  wasPdfA: boolean;
  pdfAStatus: 'preserved' | 'broken' | 'not-applicable';
  downloadUrl: string;
  rawBlob?: Blob;
  anatomy?: DocumentAnatomy;
}

export interface CompletedCompressionResult {
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
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const { globalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  // === SISTEMA DE CAJAS (HASTA 3 SLOTS DE TRABAJO) ===
  interface SlotItem {
    id: string;
    file: File | null;
  }

  const [slots, setSlots] = useState<SlotItem[]>([
    { id: 'slot-1', file: globalFile || null },
    { id: 'slot-2', file: null },
    { id: 'slot-3', file: null },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const slot3InputRef = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (index: number) => {
    if (index === 0) return slot1InputRef;
    if (index === 1) return slot2InputRef;
    return slot3InputRef;
  };

  const files = slots.map((s) => s.file).filter(Boolean) as File[];
  const activeFile = slots[activeSlotIndex]?.file || files[0] || null;

  const [isDragging, setIsDragging] = useState<boolean>(false);

  // === ESTADO DE ÉXITO DE COMPRESIÓN ===
  const [completedResult, setCompletedResult] = useState<CompletedCompressionResult | null>(null);
  const [isCreatingZip, setIsCreatingZip] = useState<boolean>(false);

  // === CONFIGURACIÓN EMPRESARIAL DE COMPRESIÓN ===
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [targetPreset, setTargetPreset] = useState<string | null>('web');
  const [targetSizeMB, setTargetSizeMB] = useState<number | undefined>(undefined);
  const [customTargetInput, setCustomTargetInput] = useState<string>('2.0');
  const [showCustomTarget, setShowCustomTarget] = useState<boolean>(false);

  const [outputColorMode, setOutputColorMode] = useState<OutputColorMode>('original');
  const [dpiMode, setDpiMode] = useState<DpiMode>('auto');
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [customSuffix] = useState('_Comprimido');
  const [preserveTextVectors, setPreserveTextVectors] = useState(true);
  const [preservePdfA] = useState(true);
  const [detectPdfA] = useState(true);

  // === ANATOMÍA Y DIAGNÓSTICO EN VIVO (BLOAT ANALYZER) ===
  const [fileAnatomy, setFileAnatomy] = useState<DocumentAnatomy | null>(null);
  const [isAnalyzingAnatomy, setIsAnalyzingAnatomy] = useState<boolean>(false);

  // === ESTADO DE PROCESAMIENTO ASÍNCRONO (WORKER) ===
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // === VISTA PREVIA Y COMPARADOR VISUAL ANTES / DESPUÉS ===
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Modo de inspección visual: 'normal' vs 'split' (slider antes/después)
  const [viewMode, setViewMode] = useState<'normal' | 'split'>('normal');
  const [splitPosition, setSplitPosition] = useState<number>(50);

  // Control de cabecera fija
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      window.scrollTo(0, 0);
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  useEffect(() => {
    return () => {
      setHeaderHidden(false);
      workerRef.current?.terminate();
    };
  }, [setHeaderHidden]);

  // Cargar archivo global al montar si existe
  useEffect(() => {
    if (globalFile) {
      const timer = setTimeout(() => {
        setSlots((prev) => {
          if (!prev.some((s) => s.file !== null)) {
            return [
              { id: 'slot-1', file: globalFile },
              { id: 'slot-2', file: null },
              { id: 'slot-3', file: null },
            ];
          }
          return prev;
        });
        setActiveSlotIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [globalFile]);

  // ─── ANÁLISIS ANATÓMICO RÁPIDO VÍA WORKER CUANDO CAMBIA EL ARCHIVO ACTIVO ───
  const triggerAnatomyAnalysis = useCallback(async (file: File) => {
    setIsAnalyzingAnatomy(true);
    try {
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL('../workers/pdf-compress.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data as CompressionAnalysisResult | CompressionError;
        if (msg.type === 'analysis') {
          setFileAnatomy(msg.anatomy);
        }
        setIsAnalyzingAnatomy(false);
        worker.terminate();
      };

      worker.onerror = () => {
        setIsAnalyzingAnatomy(false);
        worker.terminate();
      };

      // Transferable ArrayBuffer
      worker.postMessage({ action: 'ANALYZE', fileBuffer: buffer, fileName: file.name }, [buffer]);
    } catch {
      setIsAnalyzingAnatomy(false);
    }
  }, []);

  // Generar miniaturas de la página activa
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      const resetTimer = setTimeout(() => {
        setThumbnails([]);
        setTotalPages(1);
        setPreviewPageNum(1);
        setFileAnatomy(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const analysisTimer = setTimeout(() => {
      if (!isCancelled) {
        triggerAnatomyAnalysis(activeFile);
      }
    }, 0);

    const generatePreview = async () => {
      setIsLoadingThumbnails(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const arrayBuffer = await activeFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
          cMapPacked: true,
        }).promise;

        if (isCancelled) return;

        setTotalPages(pdf.numPages);
        setPreviewPageNum((prev) => Math.min(prev, pdf.numPages));

        const targetPage = Math.min(previewPageNum, pdf.numPages);
        const page = await pdf.getPage(targetPage);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({
            canvasContext: ctx,
            viewport,
          } as unknown as Parameters<typeof page.render>[0]).promise;

          if (!isCancelled) {
            setThumbnails([{ pageNum: targetPage, dataUrl: canvas.toDataURL('image/jpeg', 0.85) }]);
          }
        }
      } catch (err) {
        console.warn('Error generando preview:', err);
      } finally {
        if (!isCancelled) setIsLoadingThumbnails(false);
      }
    };

    generatePreview();

    return () => {
      isCancelled = true;
      clearTimeout(analysisTimer);
    };
  }, [activeFile, previewPageNum, triggerAnatomyAnalysis]);

  // Manejo de Drop y Carga de Archivos
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadNewFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadNewFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleSlotFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSlots((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], file };
          return next;
        });
        setActiveSlotIndex(index);
        setCompletedResult(null);
        toast.success(
          isEs ? `Archivo asignado a la Caja ${index + 1}` : `File assigned to Box ${index + 1}`,
        );
      } else {
        toast.error(isEs ? 'Solo se admiten documentos PDF' : 'Only PDF documents are supported');
      }
    }
    e.target.value = '';
  };

  const loadNewFiles = (newFiles: File[]) => {
    const validPdfs = newFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    if (validPdfs.length === 0) {
      toast.error(isEs ? 'Solo se admiten documentos PDF' : 'Only PDF documents are supported');
      return;
    }

    setSlots((prev) => {
      const next = [...prev];
      let pIdx = 0;
      for (let s = 0; s < 3 && pIdx < validPdfs.length; s++) {
        if (!next[s].file) {
          next[s] = { ...next[s], file: validPdfs[pIdx] };
          pIdx++;
        }
      }
      if (pIdx < validPdfs.length) {
        next[0] = { ...next[0], file: validPdfs[0] };
      }
      return next;
    });

    setActiveSlotIndex(0);
    setCompletedResult(null);
    toast.success(
      isEs
        ? `${validPdfs.length} archivo(s) PDF cargado(s)`
        : `${validPdfs.length} PDF file(s) loaded`,
    );
  };

  const handleRemoveSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], file: null };
      return next;
    });
    setCompletedResult(null);
  };

  const handleRemoveAllFiles = () => {
    setSlots([
      { id: 'slot-1', file: null },
      { id: 'slot-2', file: null },
      { id: 'slot-3', file: null },
    ]);
    setActiveSlotIndex(0);
    setCompletedResult(null);
    setFileAnatomy(null);
  };

  // Presets de tamaño objetivo rápido (Enterprise 1-Clic)
  const handleApplyPreset = (preset: 'email' | 'judicial' | 'web_light' | 'print' | 'custom') => {
    if (isProcessing) return;
    setTargetPreset(preset);

    if (preset === 'email') {
      setShowCustomTarget(false);
      setCompressionLevel('target');
      setTargetSizeMB(2.0);
      setDpiMode('96');
      setStripMetadata(true);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '📧 Preset para Correo aplicado: Objetivo < 2 MB, 96 DPI y limpieza de metadatos.'
          : '📧 Email Preset applied: Target < 2 MB, 96 DPI & metadata cleanup.',
      );
    } else if (preset === 'judicial') {
      setShowCustomTarget(false);
      setCompressionLevel('target');
      setTargetSizeMB(5.0);
      setDpiMode('150');
      setStripMetadata(false);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '🏛️ Preset Judicial / Mesa de Partes aplicado: Límite < 5 MB con fidelidad documental.'
          : '🏛️ Judicial Preset applied: Under 5 MB target with full legal fidelity.',
      );
    } else if (preset === 'web_light') {
      setShowCustomTarget(false);
      setCompressionLevel('target');
      setTargetSizeMB(1.0);
      setDpiMode('72');
      setStripMetadata(true);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '⚡ Preset Web Ligero aplicado: Reducción máxima < 1 MB para WhatsApp y móvil.'
          : '⚡ Web Light Preset applied: Max reduction < 1 MB for mobile & WhatsApp.',
      );
    } else if (preset === 'print') {
      setShowCustomTarget(false);
      setCompressionLevel('low');
      setTargetSizeMB(undefined);
      setDpiMode('150');
      setStripMetadata(false);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '📐 Preset Impresión / CAD: Máxima resolución (150 DPI) y fidelidad vectorial intacta.'
          : '📐 Print / CAD Preset: Maximum resolution (150 DPI) and full vector fidelity.',
      );
    } else if (preset === 'custom') {
      setShowCustomTarget(true);
      setCompressionLevel('target');
      const mb = parseFloat(customTargetInput) || 2.0;
      setTargetSizeMB(mb);
    }
  };

  const handleCustomMbChange = (val: string) => {
    setCustomTargetInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setTargetSizeMB(parsed);
    }
  };

  const handleLevelSelect = (lvl: CompressionLevel) => {
    setCompressionLevel(lvl);
    setTargetPreset(null);
    setShowCustomTarget(false);
    setTargetSizeMB(undefined);
  };

  // ─── EJECUCIÓN ASÍNCRONA EN WEB WORKER (ZERO-COPY) ───
  const executeCompress = async () => {
    if (files.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressMsg(
      isEs
        ? 'Inicializando motor de compresión asíncrono...'
        : 'Initializing async compression engine...',
    );
    setCompletedResult(null);
    setTotalFilesCount(files.length);

    try {
      // 1. Instanciar Web Worker
      const worker = new Worker(new URL('../workers/pdf-compress.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      // 2. Preparar buffers transferibles
      const filePayloads: Array<{ name: string; buffer: ArrayBuffer }> = [];
      const transferableBuffers: ArrayBuffer[] = [];

      for (let i = 0; i < files.length; i++) {
        const buf = await files[i].arrayBuffer();
        filePayloads.push({ name: files[i].name, buffer: buf });
        transferableBuffers.push(buf);
      }

      const options: EnterpriseCompressionOptions = {
        level: compressionLevel,
        targetSizeMB: compressionLevel === 'target' ? targetSizeMB : undefined,
        mode: preserveTextVectors ? 'smart' : 'rasterize_all',
        outputColorMode,
        dpiMode,
        pageScope,
        pageRange,
        stripMetadata,
        preserveTextVectors,
        preservePdfA,
        detectPdfA,
        customSuffix,
      };

      const collectedResults: CompressionResultItem[] = [];

      // 3. Manejo de mensajes del Worker
      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data as
          CompressionProgress | CompressionResult | CompressionAnalysisResult | CompressionError;

        if (msg.type === 'progress') {
          setProgressPercent(msg.percent);
          setProgressMsg(msg.message);
          setCurrentFileIndex(msg.currentFile);
        } else if (msg.type === 'analysis') {
          setFileAnatomy(msg.anatomy);
        } else if (msg.type === 'result') {
          const blob = new Blob([msg.compressedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);

          collectedResults.push({
            fileName: msg.fileName,
            originalSize: msg.originalSize,
            compressedSize: msg.compressedSize,
            reductionPercent: msg.reductionPercent,
            wasPdfA: msg.wasPdfA,
            pdfAStatus: msg.pdfAStatus,
            downloadUrl: url,
            rawBlob: blob,
            anatomy: msg.anatomy,
          });

          // Si se completaron todos los archivos
          if (collectedResults.length === files.length) {
            const totalOriginal = collectedResults.reduce((acc, r) => acc + r.originalSize, 0);
            const totalCompressed = collectedResults.reduce((acc, r) => acc + r.compressedSize, 0);
            const overallReduction =
              totalOriginal > 0
                ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
                : 0;

            const firstItem = collectedResults[0];
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
              items: [...collectedResults],
            });

            setIsProcessing(false);
            worker.terminate();

            toast.success(
              isEs
                ? `¡${collectedResults.length} PDF(s) optimizado(s)! Reducción global: ${overallReduction}%`
                : `${collectedResults.length} PDF(s) optimized! Overall reduction: ${overallReduction}%`,
            );
          }
        } else if (msg.type === 'error') {
          toast.error(msg.message);
          setIsProcessing(false);
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error('Worker compression error:', err);
        toast.error(isEs ? 'Error en el proceso de compresión' : 'Compression process error');
        setIsProcessing(false);
        worker.terminate();
      };

      // 4. Enviar trabajo con Zero-Copy Transfer
      worker.postMessage({ files: filePayloads, options }, transferableBuffers);
    } catch (err) {
      console.error('Failed to launch worker:', err);
      toast.error(isEs ? 'No se pudo iniciar el Web Worker' : 'Could not start Web Worker');
      setIsProcessing(false);
    }
  };

  // Descargar paquete ZIP para múltiples archivos
  const handleDownloadAllZip = async () => {
    if (!completedResult || completedResult.items.length === 0) return;
    setIsCreatingZip(true);
    try {
      const zip = new JSZip();
      completedResult.items.forEach((item) => {
        if (item.rawBlob) {
          const name = `${item.fileName.replace(/\.[^/.]+$/, '')}${customSuffix}.pdf`;
          zip.file(name, item.rawBlob);
        }
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `PDFBlack_Optimizados_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
      toast.success(
        isEs ? 'Paquete ZIP descargado con éxito' : 'ZIP package downloaded successfully',
      );
    } catch (err) {
      console.error('Error al generar ZIP:', err);
      toast.error(isEs ? 'Error al generar archivo ZIP' : 'Error generating ZIP file');
    } finally {
      setIsCreatingZip(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedReduction = (level: CompressionLevel) => {
    const ranges: Record<CompressionLevel, { min: number; max: number; label: string }> = {
      low: { min: 15, max: 40, label: '15-40%' },
      medium: { min: 40, max: 65, label: '40-65%' },
      high: { min: 65, max: 88, label: '65-88%' },
      target: { min: 30, max: 80, label: 'Calibrado a tamaño' },
    };
    return ranges[level] || ranges.medium;
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={addMoreInputRef}
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
            href={isEs ? '/optimizar' : '/en/optimize'}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-zinc-700" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / COMPRESIÓN EMPRESARIAL Y OPTIMIZACIÓN PDF
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Sliders className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'COMPRIMIR ARCHIVOS PDF (PRESERVACIÓN VECTORIAL 100%)'
                  : 'COMPRESS PDF FILES (100% VECTOR PRESERVATION)'}
              </span>
            </h2>
          </div>
        </div>

        {completedResult && (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-xs font-mono text-white">
            <Archive className="w-4 h-4 text-zinc-300" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {completedResult.filename}
            </span>
            <button
              onClick={handleRemoveAllFiles}
              className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {files.length > 0 && !completedResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => addMoreInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>{isEs ? 'Añadir más' : 'Add more'}</span>
            </button>
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <Archive className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold">{files.length}</span> {isEs ? 'archivo(s)' : 'file(s)'}
            </div>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        /* DROPZONE INICIAL CUANDO NO HAY ARCHIVOS */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[440px] shadow-2xl relative overflow-hidden group ${
            isDragging
              ? 'border-white bg-[#1a1a24] scale-[1.01]'
              : 'border-zinc-700 hover:border-zinc-500 hover:bg-[#131319]'
          }`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:border-zinc-500 transition-all duration-300 shadow-xl">
            <Zap className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-3 font-sans uppercase">
            {isEs ? 'Arrastra tus archivos PDF aquí' : 'Drag and drop your PDF files here'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-xl font-mono mb-8 leading-relaxed">
            {isEs
              ? 'Compresión inteligente in-place: reduce el peso hasta un 80% preservando el texto vectorial 100% nítido, editable y seleccionable.'
              : 'Smart in-place compression: shrink file size by up to 80% while keeping vector text 100% crisp, selectable, and searchable.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar Archivos PDF para Comprimir' : 'Select PDF Files to Compress'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Texto Vectorial Intacto' : '✓ 100% Vector Text'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'No rasteriza el texto a imagen; las fuentes y planos se mantienen infinitamente nítidos.'
                  : 'Does not rasterize text into blurry photos; typography and CAD lines stay pin-sharp.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Tamaño Objetivo (<2MB)' : '✓ Target Size (<2MB)'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Ajuste matemático automático para enviar por correo o subir a mesas de partes.'
                  : 'Automated calibration to fit under Gmail, Outlook, or court portal upload limits.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Procesamiento Seguro' : '✓ Strict In-Browser Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Todo se ejecuta en Web Workers en tu memoria RAM. Cero servidores externos.'
                  : 'Everything executes in Web Workers inside your RAM. Zero server uploads.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO ULTRA-PREMIUM CON COMPARTIR EN WHATSAPP / TELEGRAM / DRIVE */
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: completedResult.downloadUrl,
              filename: completedResult.filename,
              fileSize: completedResult.fileSize,
              rawBlob: completedResult.rawBlob,
            }}
            totalPages={completedResult.items.length}
            modeText={
              isEs
                ? 'Motor de Compresión Empresarial In-Place'
                : 'Enterprise In-Place PDF Compression Engine'
            }
            toolName={isEs ? 'Comprimir PDF' : 'Compress PDF'}
            badgeText={isEs ? 'Compresión Exitosa' : 'Compression Successful'}
            successTitle={
              completedResult.items.length > 1
                ? isEs
                  ? `¡${completedResult.items.length} Documentos Optimizados con Éxito!`
                  : `¡${completedResult.items.length} Documents Optimized Successfully!`
                : isEs
                  ? '¡Documento Optimizado con Éxito!'
                  : 'Document Successfully Optimized!'
            }
            downloadButtonText={
              completedResult.items.length > 1
                ? isEs
                  ? `Descargar Primer Archivo (${completedResult.filename})`
                  : `Download First File (${completedResult.filename})`
                : isEs
                  ? 'Descargar PDF Optimizado'
                  : 'Download Optimized PDF'
            }
            shareSubject={isEs ? 'documento optimizado' : 'optimized document'}
            fallbackUrl="https://pdf-black.com/optimizar/comprimir"
            metricBadge={
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-bold font-mono text-xs">
                  {completedResult.overallReduction > 0
                    ? `-${completedResult.overallReduction}%`
                    : 'Optimizado'}{' '}
                  (
                  {formatFileSize(
                    completedResult.totalOriginalSize - completedResult.totalCompressedSize,
                  )}{' '}
                  {isEs ? 'ahorrados' : 'saved'})
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md font-mono text-xs">
                  {formatFileSize(completedResult.totalOriginalSize)} →{' '}
                  {formatFileSize(completedResult.totalCompressedSize)}
                </span>
              </div>
            }
            extraActions={
              completedResult.items.length > 1 ? (
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={handleDownloadAllZip}
                    disabled={isCreatingZip}
                    className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-sans font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg transition-all cursor-pointer border border-emerald-400/40"
                  >
                    {isCreatingZip ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Archive className="w-4 h-4 text-white" />
                    )}
                    <span>
                      {isCreatingZip
                        ? isEs
                          ? 'Generando archivo ZIP...'
                          : 'Generating ZIP file...'
                        : isEs
                          ? `Descargar los ${completedResult.items.length} archivos comprimidos (.ZIP)`
                          : `Download all ${completedResult.items.length} compressed files (.ZIP)`}
                    </span>
                  </motion.button>

                  <div className="bg-[#121217] border border-zinc-800 rounded-xl p-3 space-y-2">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-bold px-1">
                      {isEs ? 'Archivos individuales disponibles:' : 'Individual files available:'}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {completedResult.items.map((item, idx) => {
                        const itemOutName = `${item.fileName.replace(/\.[^/.]+$/, '')}${customSuffix}.pdf`;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="truncate text-zinc-200 font-medium">
                                {itemOutName}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold flex-shrink-0">
                                -{item.reductionPercent}%
                              </span>
                            </div>
                            <a
                              href={item.downloadUrl}
                              download={itemOutName}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded border border-zinc-700 text-[11px] font-bold transition-colors flex items-center gap-1.5 flex-shrink-0"
                            >
                              <Download className="w-3 h-3" />
                              <span>{isEs ? 'Descargar' : 'Download'}</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : undefined
            }
            onReset={handleRemoveAllFiles}
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="w-full flex flex-col gap-6 font-sans mb-6"
        >
          {/* SECCIÓN 1: VISTA PREVIA INTERACTIVA (50%) Y 3 CAJAS (50%) */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* BARRA SUPERIOR DE LA SECCIÓN 1 */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                  {isEs
                    ? '001 / VISOR INTERACTIVO Y DOCUMENTOS'
                    : '001 / INTERACTIVE VIEWER & DOCUMENTS'}
                </span>
                <div className="hidden sm:block h-3.5 w-px bg-zinc-700" />
                <span className="text-xs text-zinc-300 font-bold font-sans truncate max-w-[200px] sm:max-w-[400px]">
                  {activeFile
                    ? activeFile.name
                    : isEs
                      ? 'Sin archivo seleccionado'
                      : 'No file selected'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                  <span className="font-bold font-mono text-white">{files.length}</span> / 3{' '}
                  {isEs ? 'cargados' : 'loaded'}
                </div>

                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRemoveAllFiles}
                    className="text-zinc-500 hover:text-red-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1 ml-2"
                    title={isEs ? 'Limpiar todas las cajas' : 'Clear all boxes'}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">{isEs ? 'Limpiar todo' : 'Clear all'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* CONTENEDOR PRINCIPAL SPLIT: IZQUIERDA AL 50% | DERECHA 3 CAJAS */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[420px] overflow-hidden">
              {/* ── LADO IZQUIERDO: VISOR CON MODO SPLIT COMPARADOR ── */}
              <div className="lg:col-span-6 bg-[#0c0c10] rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-between relative overflow-hidden shadow-inner min-h-[380px]">
                {activeFile ? (
                  <div className="flex flex-col items-center justify-between w-full h-full py-1">
                    {/* ENCABEZADO INFO DEL VISOR CON BOTÓN COMPARADOR */}
                    <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400 shrink-0">
                      <span className="truncate max-w-[180px] sm:max-w-[240px] text-white font-bold">
                        {activeFile.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewMode((m) => (m === 'normal' ? 'split' : 'normal'))}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                            viewMode === 'split'
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                          title={isEs ? 'Comparar antes vs después' : 'Compare before vs after'}
                        >
                          <Split className="w-3 h-3" />
                          <span>{isEs ? 'Comparar' : 'Compare'}</span>
                        </button>
                        <span className="text-zinc-400">{formatFileSize(activeFile.size)}</span>
                      </div>
                    </div>

                    {/* LIENZO / VISUALIZADOR DE PÁGINA CON SPLIT SLIDER INTERACTIVO */}
                    <div className="relative my-auto bg-white rounded-xl shadow-2xl border border-zinc-400/80 overflow-hidden flex items-center justify-center transition-all duration-300 w-[240px] sm:w-[280px] h-[310px] sm:h-[340px] group select-none">
                      {isLoadingThumbnails ? (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                          <span className="text-[11px] font-mono font-bold text-zinc-400">
                            {isEs ? 'Renderizando visor...' : 'Rendering viewer...'}
                          </span>
                        </div>
                      ) : thumbnails.find((t) => t.pageNum === previewPageNum) ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnails.find((t) => t.pageNum === previewPageNum)?.dataUrl}
                            alt={`Pág ${previewPageNum}`}
                            className="w-full h-full object-contain select-none pointer-events-none"
                          />

                          {/* Split View Simulator Overlay */}
                          {viewMode === 'split' && (
                            <>
                              <div
                                className="absolute inset-0 overflow-hidden pointer-events-none"
                                style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    thumbnails.find((t) => t.pageNum === previewPageNum)?.dataUrl
                                  }
                                  alt="Original"
                                  className="w-full h-full object-contain select-none"
                                />
                                <div className="absolute top-2 left-2 bg-black/80 text-emerald-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                                  {isEs ? 'Original (Vector)' : 'Original (Vector)'}
                                </div>
                              </div>

                              <div
                                className="absolute inset-0 overflow-hidden pointer-events-none"
                                style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
                              >
                                <div className="w-full h-full relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={
                                      thumbnails.find((t) => t.pageNum === previewPageNum)?.dataUrl
                                    }
                                    alt="Optimizado"
                                    className="w-full h-full object-contain select-none opacity-95"
                                  />
                                  <div className="absolute top-2 right-2 bg-black/80 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-white/20">
                                    {isEs ? 'Optimizado (Deflate 9)' : 'Optimized (Deflate 9)'}
                                  </div>
                                </div>
                              </div>

                              {/* Barra divisora interactiva */}
                              <div
                                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                style={{ left: `${splitPosition}%` }}
                              >
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center shadow-lg border border-zinc-400">
                                  ↔
                                </div>
                              </div>

                              {/* Input slider transparente para arrastrar fácilmente */}
                              <input
                                type="range"
                                min="5"
                                max="95"
                                value={splitPosition}
                                onChange={(e) => setSplitPosition(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-ew-resize z-30"
                              />
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setZoomModalImage(
                                thumbnails.find((t) => t.pageNum === previewPageNum)?.dataUrl ||
                                  null,
                              )
                            }
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                            title={isEs ? 'Ampliar' : 'Zoom'}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 p-4 text-center">
                          <FileText className="w-8 h-8 text-zinc-400" />
                          <span className="text-[10px] font-mono">
                            {isEs ? 'Vista previa no disponible' : 'Preview not available'}
                          </span>
                        </div>
                      )}

                      {totalPages > 0 && viewMode === 'normal' && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                          #{previewPageNum} / {totalPages}
                        </div>
                      )}
                    </div>

                    {/* CONTROLES COMPACTOS DE PAGINACIÓN */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-3 mt-2 bg-zinc-900 border border-zinc-700/80 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 shadow-md shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewPageNum((p) => Math.max(1, p - 1))}
                          disabled={previewPageNum <= 1}
                          className="px-2 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                          title={isEs ? 'Anterior' : 'Previous'}
                        >
                          ◀
                        </button>
                        <span className="font-bold text-white text-[11px]">
                          {previewPageNum} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewPageNum((p) => Math.min(totalPages, p + 1))}
                          disabled={previewPageNum >= totalPages}
                          className="px-2 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                          title={isEs ? 'Siguiente' : 'Next'}
                        >
                          ▶
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500 font-mono text-xs">
                    <FileText className="w-8 h-8 text-zinc-600" />
                    <span>{isEs ? 'Sin archivo para previsualizar' : 'No file to preview'}</span>
                  </div>
                )}
              </div>

              {/* ── LADO DERECHO: 3 CAJAS INDEPENDIENTES ── */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3 h-full">
                {slots.map((slot, sIdx) => {
                  const isLoaded = slot.file !== null;
                  const isActive = isLoaded && sIdx === activeSlotIndex;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isLoaded) {
                          setActiveSlotIndex(sIdx);
                        } else {
                          getSlotInputRef(sIdx).current?.click();
                        }
                      }}
                      className={`flex-1 rounded-2xl border-2 transition-all p-3.5 flex items-center justify-between cursor-pointer min-h-[95px] relative group shadow-sm ${
                        isActive
                          ? 'bg-zinc-800/80 border-white shadow-white/10'
                          : isLoaded
                            ? 'bg-[#121217] border-zinc-700/80 hover:border-zinc-500'
                            : 'bg-[#0e0e12] border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-[#121218]'
                      }`}
                    >
                      <input
                        ref={getSlotInputRef(sIdx)}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => handleSlotFileChange(sIdx, e)}
                      />

                      {isLoaded ? (
                        <div className="flex items-center justify-between w-full gap-3 font-mono">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2.5 rounded-xl border flex-shrink-0 ${
                                isActive
                                  ? 'bg-white/20 border-white text-white'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                              }`}
                            >
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                  {isEs ? `Caja ${sIdx + 1}` : `Box ${sIdx + 1}`}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-white/20 text-white rounded border border-white/40 font-bold">
                                    {isEs ? 'Visualizando' : 'Viewing'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px] font-sans">
                                {slot.file!.name}
                              </p>
                              <span className="text-[10px] text-zinc-400">
                                {formatFileSize(slot.file!.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSlot(sIdx, e)}
                              className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-500/30"
                              title={isEs ? 'Eliminar de esta caja' : 'Remove from this box'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full font-mono">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-zinc-300 group-hover:border-zinc-700 transition-colors">
                              <Plus className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors font-sans">
                                {isEs ? `+ Cargar PDF ${sIdx + 1}` : `+ Upload PDF ${sIdx + 1}`}
                              </p>
                              <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                                .pdf
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800/80">
                            {isEs ? 'Disponible' : 'Available'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN ANATÓMICA DEL DOCUMENTO (BLOAT ANALYZER) ── */}
          {activeFile && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-[#101015] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl font-mono text-xs relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                    {isEs ? 'Anatomía del Archivo & Diagnóstico' : 'File Anatomy & Bloat Diagnosis'}
                  </span>
                  {isAnalyzingAnatomy && (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                      {isEs ? 'Analizando...' : 'Analyzing...'}
                    </span>
                  )}
                </div>

                {fileAnatomy?.isPdfA && (
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded text-[10px] font-bold">
                    ✓ PDF/A Compatible
                  </span>
                )}
              </div>

              {fileAnatomy ? (
                <div className="space-y-3">
                  {/* BARRA SEGMENTADA DE COLORES */}
                  <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${fileAnatomy.imagePercent}%` }}
                      className="bg-purple-500 hover:bg-purple-400 transition-all"
                      title={`Imágenes: ${fileAnatomy.imagePercent}% (${formatFileSize(fileAnatomy.imageBytes)})`}
                    />
                    <div
                      style={{ width: `${fileAnatomy.fontPercent}%` }}
                      className="bg-sky-500 hover:bg-sky-400 transition-all"
                      title={`Fuentes: ${fileAnatomy.fontPercent}% (${formatFileSize(fileAnatomy.fontBytes)})`}
                    />
                    <div
                      style={{ width: `${fileAnatomy.vectorPercent}%` }}
                      className="bg-emerald-500 hover:bg-emerald-400 transition-all"
                      title={`Vectores: ${fileAnatomy.vectorPercent}% (${formatFileSize(fileAnatomy.vectorAndContentBytes)})`}
                    />
                    <div
                      style={{ width: `${fileAnatomy.structurePercent}%` }}
                      className="bg-zinc-500 hover:bg-zinc-400 transition-all"
                      title={`Metadatos: ${fileAnatomy.structurePercent}% (${formatFileSize(fileAnatomy.structureAndMetadataBytes)})`}
                    />
                  </div>

                  {/* LEYENDA DEL DIAGNÓSTICO */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-zinc-400 block truncate">
                          {isEs ? 'Imágenes' : 'Images'} ({fileAnatomy.imageCount})
                        </span>
                        <strong className="text-white">
                          {formatFileSize(fileAnatomy.imageBytes)} ({fileAnatomy.imagePercent}%)
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-zinc-400 block truncate">
                          {isEs ? 'Fuentes' : 'Fonts'} ({fileAnatomy.fontCount})
                        </span>
                        <strong className="text-white">
                          {formatFileSize(fileAnatomy.fontBytes)} ({fileAnatomy.fontPercent}%)
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-zinc-400 block truncate">
                          {isEs ? 'Vectores/Texto' : 'Vectors/Text'}
                        </span>
                        <strong className="text-white">
                          {formatFileSize(fileAnatomy.vectorAndContentBytes)} (
                          {fileAnatomy.vectorPercent}%)
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-zinc-400 block truncate">
                          {isEs ? 'Estructura' : 'Structure'}
                        </span>
                        <strong className="text-white">
                          {formatFileSize(fileAnatomy.structureAndMetadataBytes)} (
                          {fileAnatomy.structurePercent}%)
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* INSIGHT INTELIGENTE */}
                  <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {fileAnatomy.imagePercent >= 50
                        ? isEs
                          ? `💡 Las imágenes representan el ${fileAnatomy.imagePercent}% del archivo. El motor in-place optimizará sus streams sin perder texto vectorial.`
                          : `💡 Images make up ${fileAnatomy.imagePercent}% of file size. In-place compression will downscale image streams while keeping vector text sharp.`
                        : isEs
                          ? `💡 Documento predominantemente vectorial (${fileAnatomy.vectorPercent}%). Se aplicará Deflate Nivel 9 y compactación de flujos sin pérdida.`
                          : `💡 Predominantly vector document (${fileAnatomy.vectorPercent}%). Level 9 Deflate stream compacting will be applied losslessly.`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-[11px]">
                  {isEs ? 'Analizando estructura del PDF...' : 'Analyzing PDF structure...'}
                </div>
              )}
            </motion.div>
          )}

          {/* SECCIÓN 2: PANEL DE CONTROL DEBAJO A ANCHO COMPLETO */}
          <div
            ref={controlPanelRef}
            className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sans"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* CABECERA PANEL DE CONTROL */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                  002 / CONFIGURACIÓN Y ACCIÓN
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                </h2>
              </div>
              <div className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm">
                <Sliders className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              {/* PRESETS DE TAMAÑO OBJETIVO (1-CLIC ENTERPRISE) */}
              <div className="mb-4">
                <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase">
                  {isEs ? 'Objetivo Rápido de Tamaño' : 'Quick Size Target'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                  <button
                    onClick={() => handleApplyPreset('email')}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                      targetPreset === 'email'
                        ? 'border-white bg-zinc-800 text-white shadow-md'
                        : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                      <span>📧</span> {isEs ? 'Correo' : 'Email'}
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {isEs ? '< 2 MB (Gmail)' : '< 2 MB (Gmail)'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('judicial')}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                      targetPreset === 'judicial'
                        ? 'border-white bg-zinc-800 text-white shadow-md'
                        : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                      <span>🏛️</span> {isEs ? 'Judicial' : 'Legal/Court'}
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {isEs ? '< 5 MB Trámites' : '< 5 MB Filing'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('web_light')}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                      targetPreset === 'web_light'
                        ? 'border-white bg-zinc-800 text-white shadow-md'
                        : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                      <span>⚡</span> {isEs ? 'Web Ligero' : 'Light Web'}
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {isEs ? '< 1 MB Ultra' : '< 1 MB Ultra'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('print')}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                      targetPreset === 'print'
                        ? 'border-white bg-zinc-800 text-white shadow-md'
                        : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                      <span>📐</span> {isEs ? 'CAD / Planos' : 'CAD / Print'}
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {isEs ? '150 DPI nítido' : '150 DPI crisp'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('custom')}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                      targetPreset === 'custom'
                        ? 'border-white bg-zinc-800 text-white shadow-md'
                        : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                      <span>🎯</span> {isEs ? 'Personalizado' : 'Custom MB'}
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {targetSizeMB ? `< ${targetSizeMB} MB` : isEs ? 'Fijar límite' : 'Set limit'}
                    </div>
                  </button>
                </div>

                {/* INPUT PARA TAMAÑO PERSONALIZADO */}
                {showCustomTarget && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2.5 flex items-center gap-3 bg-zinc-900 border border-zinc-700/80 p-3 rounded-xl font-mono text-xs"
                  >
                    <span className="text-zinc-300">
                      {isEs ? 'Tamaño máximo objetivo:' : 'Maximum target size:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.5"
                        value={customTargetInput}
                        onChange={(e) => handleCustomMbChange(e.target.value)}
                        className="w-20 bg-black border border-zinc-600 rounded px-2 py-1 text-white font-bold text-center focus:outline-none focus:border-white"
                      />
                      <span className="text-white font-bold">MB</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {isEs
                        ? '(El motor adaptará la resolución para no superar este peso)'
                        : '(The engine will calibrate resolution to strictly fit)'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* PERFIL CLÁSICO DE COMPRESIÓN */}
              <div className="mb-4">
                <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase">
                  {isEs ? 'Perfil de Calidad / Compresión' : 'Quality / Compression Profile'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => {
                    const configs = {
                      low: {
                        labelEs: 'Baja (Alta Calidad)',
                        labelEn: 'Low (High Quality)',
                        descEs: 'Máxima nitidez para planos, cotas y lectura',
                        descEn: 'High fidelity for CAD, blueprints & print',
                        icon: Shield,
                      },
                      medium: {
                        labelEs: 'Media (Recomendada)',
                        labelEn: 'Medium (Recommended)',
                        descEs: 'Balance perfecto entre reducción y nitidez',
                        descEn: 'Ideal balance between size & clarity',
                        icon: HardDrive,
                      },
                      high: {
                        labelEs: 'Alta (Máxima Compresión)',
                        labelEn: 'High (Maximum Compression)',
                        descEs: 'Deflate Nivel 9 + optimización profunda de imágenes',
                        descEn: 'Deflate Level 9 + deep image compression',
                        icon: Zap,
                      },
                    };
                    const cfg = configs[lvl];
                    const Icon = cfg.icon;
                    const est = getEstimatedReduction(lvl);
                    const isSelected = compressionLevel === lvl && !targetPreset;

                    return (
                      <div
                        key={lvl}
                        onClick={() => handleLevelSelect(lvl)}
                        className={`relative p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
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
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-white bg-white' : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {isEs ? cfg.descEs : cfg.descEn}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 font-mono">
                          <Icon className="w-3 h-3 text-zinc-400" />
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-300'
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

              {/* ESTIMADOR DINÁMICO DE REDUCCIÓN */}
              <div className="mb-4 bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 shadow-inner font-mono text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    {isEs ? 'Ahorro proyectado:' : 'Projected savings:'}
                  </span>
                  <span className="text-[#FAF6EE] font-extrabold text-xs">
                    ~ {getEstimatedReduction(compressionLevel).label}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-zinc-300 via-white to-[#FAF6EE] h-full rounded-full"
                    initial={{ width: '40%' }}
                    animate={{
                      width:
                        compressionLevel === 'low'
                          ? '30%'
                          : compressionLevel === 'medium'
                            ? '60%'
                            : '85%',
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-400">
                  <span>
                    {isEs ? 'Original:' : 'Original:'}{' '}
                    <strong className="text-white">{formatFileSize(totalOriginalSize)}</strong>
                  </span>
                  <span>
                    {isEs ? 'Proyección estimada:' : 'Estimated target:'}{' '}
                    <strong className="text-[#FAF6EE]">
                      {targetSizeMB
                        ? `< ${targetSizeMB} MB`
                        : formatFileSize(
                            totalOriginalSize *
                              (compressionLevel === 'low'
                                ? 0.75
                                : compressionLevel === 'medium'
                                  ? 0.5
                                  : 0.25),
                          )}
                    </strong>
                  </span>
                </div>
              </div>

              {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-2 px-3 bg-[#121217] hover:bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer mb-3"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                  <span>
                    {isEs
                      ? 'Opciones Avanzadas (DPI, Color, Alcance, Preservación Vectorial)'
                      : 'Advanced Options (DPI, Color, Scope, Vector Preservation)'}
                  </span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* CONTENIDO DE OPCIONES AVANZADAS */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 mb-4 shadow-inner overflow-hidden"
                  >
                    {/* MODO DE COLOR */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 font-mono tracking-widest uppercase flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-zinc-400" />
                        {isEs ? 'Modo de Color' : 'Color Mode'}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['original', 'grayscale', 'blackwhite'] as OutputColorMode[]).map(
                          (opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setOutputColorMode(opt)}
                              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                outputColorMode === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {opt === 'original'
                                ? '🎨 Color'
                                : opt === 'grayscale'
                                  ? '⚪ Grises'
                                  : '■ B/N'}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* RESOLUCIÓN DPI */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 font-mono tracking-widest uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-zinc-400" />
                        {isEs ? 'Resolución Máxima (DPI)' : 'Maximum Resolution (DPI)'}
                      </label>
                      <div className="flex gap-1.5">
                        {(['auto', '72', '96', '150'] as DpiMode[]).map((dpi) => (
                          <button
                            key={dpi}
                            type="button"
                            onClick={() => setDpiMode(dpi)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                              dpiMode === dpi
                                ? 'border-white bg-zinc-700 text-white'
                                : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {dpi === 'auto' ? 'Auto' : `${dpi} DPI`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ALCANCE DE PÁGINAS */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 font-mono tracking-widest uppercase flex items-center gap-1.5">
                        <FileCheck2 className="w-3 h-3 text-zinc-400" />
                        {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                        {(['todas', 'pares', 'impares', 'rango'] as PageScope[]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setPageScope(opt)}
                            className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                              pageScope === opt
                                ? 'border-white bg-zinc-700 text-white'
                                : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
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

                    {/* PRESERVACIÓN VECTORIAL Y METADATOS */}
                    <div className="space-y-1.5 pt-1">
                      <div
                        onClick={() => setPreserveTextVectors((v) => !v)}
                        className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-emerald-400" />
                            {isEs
                              ? 'Preservación Vectorial Total (In-Place)'
                              : 'Full Vector Preservation (In-Place)'}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono">
                            {isEs
                              ? 'Conserva texto 100% seleccionable; solo optimiza imágenes incrustadas'
                              : 'Keeps text 100% selectable; only optimizes embedded images'}
                          </p>
                        </div>
                        <div
                          className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${
                            preserveTextVectors ? 'bg-white' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${
                              preserveTextVectors ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </div>
                      </div>

                      <div
                        onClick={() => setStripMetadata((v) => !v)}
                        className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-white">
                            {isEs ? 'Eliminar metadatos ocultos' : 'Strip hidden metadata'}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono">
                            {isEs
                              ? 'Limpia autor, software emisor, etiquetas y miniaturas'
                              : 'Removes author, software tags, and thumbnail caches'}
                          </p>
                        </div>
                        <div
                          className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${
                            stripMetadata ? 'bg-white' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${
                              stripMetadata ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BOTÓN DE ACCIÓN PRINCIPAL Y BARRA DE PROGRESO */}
            <div>
              {isProcessing ? (
                <div className="w-full bg-[#121217] border border-zinc-700 rounded-2xl p-4 flex flex-col gap-2 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      {progressMsg || (isEs ? 'Comprimiendo...' : 'Compressing...')}
                    </span>
                    <span className="text-[#FAF6EE] font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 flex justify-between">
                    <span>
                      {isEs
                        ? `Archivo ${currentFileIndex} de ${totalFilesCount}`
                        : `File ${currentFileIndex} of ${totalFilesCount}`}
                    </span>
                    <span>
                      {isEs
                        ? 'Web Worker Asíncrono Activo (60 FPS)'
                        : 'Async Web Worker Active (60 FPS)'}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={executeCompress}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 font-sans text-sm sm:text-base uppercase tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Zap className="w-5 h-5 text-black fill-current" />
                  <span>
                    {isEs
                      ? `COMPRIMIR AHORA (${files.length} ARCHIVO${files.length > 1 ? 'S' : ''})`
                      : `COMPRESS NOW (${files.length} FILE${files.length > 1 ? 'S' : ''})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE MINIATURA */}
      {zoomModalImage && (
        <div
          onClick={() => setZoomModalImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121217] border border-zinc-700 rounded-3xl p-4 max-w-2xl max-h-[85vh] flex flex-col items-center relative shadow-2xl"
          >
            <button
              onClick={() => setZoomModalImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-400 mb-3">
              {isEs ? 'Vista previa de página' : 'Page preview'}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomModalImage}
              alt="Zoom preview"
              className="max-h-[70vh] object-contain rounded-xl border border-zinc-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
