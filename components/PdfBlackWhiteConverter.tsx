'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  Printer,
  FileText,
  ShieldCheck,
  Zap,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import FoliarSuccessView from '@/components/FoliarSuccessView';
import { useUIStore } from '@/store/useUIStore';
import Link from 'next/link';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del worker de PDF.js para cliente
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
}

export type BlackWhiteMode = 'grayscale' | 'blackwhite';
export type QualityPreset = 'draft' | 'standard' | 'high';
export type PageScope = 'all' | 'even' | 'odd' | 'range';

interface SlotItem {
  id: string;
  file: File | null;
  totalPages: number;
  activePage: number;
  previewOriginalUrl: string | null;
  previewFilteredUrl: string | null;
}

interface CompletedResult {
  downloadUrl: string;
  filename: string;
  originalSize: number;
  convertedSize: number;
  totalPages: number;
  pagesConverted: number;
  rawBlob: Blob;
  outputFormat: string;
  fileSizeFormatted: string;
}

export default function PdfBlackWhiteConverter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const { globalFile, setGlobalFile } = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);

  // Inputs ocultos para cada slot
  const slotInputRef0 = useRef<HTMLInputElement>(null);
  const slotInputRef1 = useRef<HTMLInputElement>(null);
  const slotInputRef2 = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (index: number) => {
    if (index === 0) return slotInputRef0;
    if (index === 1) return slotInputRef1;
    return slotInputRef2;
  };

  // ── ESTADO DE 3 SLOTS INDEPENDIENTES ──
  const [slots, setSlots] = useState<SlotItem[]>([
    {
      id: 'slot-1',
      file: null,
      totalPages: 0,
      activePage: 1,
      previewOriginalUrl: null,
      previewFilteredUrl: null,
    },
    {
      id: 'slot-2',
      file: null,
      totalPages: 0,
      activePage: 1,
      previewOriginalUrl: null,
      previewFilteredUrl: null,
    },
    {
      id: 'slot-3',
      file: null,
      totalPages: 0,
      activePage: 1,
      previewOriginalUrl: null,
      previewFilteredUrl: null,
    },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  // Opciones de conversión
  const [mode, setMode] = useState<BlackWhiteMode>('blackwhite');
  const [threshold, setThreshold] = useState<number>(170);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('standard');
  const [pageScope, setPageScope] = useState<PageScope>('all');
  const [pageRange, setPageRange] = useState<string>('');

  // Toggle de vista previa: filtrado o color original
  const [previewModeToggle, setPreviewModeToggle] = useState<'filtered' | 'original'>('filtered');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Estado del proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);

  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      const timer = setTimeout(() => {
        if (topHeaderRef.current) {
          topHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  const workerRef = useRef<Worker | null>(null);

  // Formateador de bytes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ranuras ocupadas
  const loadedSlots = useMemo(() => slots.filter((s) => s.file !== null), [slots]);
  const activeSlot = slots[activeSlotIndex];
  const activeFile = activeSlot?.file;

  // Generador de previsualización fotométrica en tiempo real
  const renderSlotPreview = useCallback(
    async (
      targetFile: File,
      pageNum: number,
      currentMode: BlackWhiteMode,
      currentThreshold: number,
      slotIdx: number,
    ) => {
      try {
        setIsPreviewLoading(true);
        const arrayBuffer = await targetFile.arrayBuffer();
        const pdfjsDoc = await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true,
        }).promise;

        const total = pdfjsDoc.numPages;
        const validPage = Math.min(Math.max(1, pageNum), total);
        const page = await pdfjsDoc.getPage(validPage);
        const viewport = page.getViewport({ scale: 1.2 });

        // Canvas original
        const origCanvas = document.createElement('canvas');
        origCanvas.width = Math.ceil(viewport.width);
        origCanvas.height = Math.ceil(viewport.height);
        const origCtx = origCanvas.getContext('2d');
        if (!origCtx) return;

        await page.render({
          canvasContext: origCtx,
          viewport,
        } as unknown as Parameters<typeof page.render>[0]).promise;

        const origDataUrl = origCanvas.toDataURL('image/jpeg', 0.85);

        // Canvas filtrado en tiempo real
        const filteredCanvas = document.createElement('canvas');
        filteredCanvas.width = origCanvas.width;
        filteredCanvas.height = origCanvas.height;
        const filtCtx = filteredCanvas.getContext('2d', { willReadFrequently: true });
        if (!filtCtx) return;

        filtCtx.drawImage(origCanvas, 0, 0);
        const imgData = filtCtx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imgData.data;
        const len = data.length;

        if (currentMode === 'blackwhite') {
          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = gray < currentThreshold ? 0 : 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        } else {
          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
        }
        filtCtx.putImageData(imgData, 0, 0);
        const filtDataUrl = filteredCanvas.toDataURL('image/jpeg', 0.85);

        page.cleanup();

        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) {
            next[slotIdx] = {
              ...next[slotIdx],
              totalPages: total,
              activePage: validPage,
              previewOriginalUrl: origDataUrl,
              previewFilteredUrl: filtDataUrl,
            };
          }
          return next;
        });
      } catch (err) {
        console.error('Error renderizando previsualización:', err);
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [],
  );

  // Cargar archivos en los slots
  const loadFilesIntoSlots = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
      if (incoming.length === 0) {
        toast.error(
          isEs
            ? 'Por favor selecciona archivos PDF válidos (.pdf).'
            : 'Please select valid PDF files (.pdf).',
        );
        return;
      }

      setCompletedResult(null);

      // Encontrar slots vacíos o sobreescribir desde el activo
      setSlots((prev) => {
        const next = [...prev];
        let incomingIdx = 0;

        // Primero llenar slots vacíos
        for (let i = 0; i < next.length && incomingIdx < incoming.length; i++) {
          if (!next[i].file) {
            next[i] = {
              ...next[i],
              file: incoming[incomingIdx],
              activePage: 1,
              totalPages: 0,
              previewOriginalUrl: null,
              previewFilteredUrl: null,
            };
            incomingIdx++;
          }
        }

        // Si aún sobran archivos, reemplazar empezando por el activo
        if (incomingIdx < incoming.length) {
          next[activeSlotIndex] = {
            ...next[activeSlotIndex],
            file: incoming[incomingIdx],
            activePage: 1,
            totalPages: 0,
            previewOriginalUrl: null,
            previewFilteredUrl: null,
          };
        }

        return next;
      });

      // Renderizar el primer archivo cargado
      const firstTarget = incoming[0];
      if (firstTarget) {
        renderSlotPreview(firstTarget, 1, mode, threshold, activeSlotIndex);
      }
    },
    [isEs, activeSlotIndex, mode, threshold, renderSlotPreview],
  );

  // Cargar archivo global de zustand si existe al montar
  useEffect(() => {
    if (globalFile && !slots.some((s) => s.file !== null)) {
      if (globalFile.name.toLowerCase().endsWith('.pdf')) {
        loadFilesIntoSlots([globalFile]);
      }
    }
  }, [globalFile, loadFilesIntoSlots, slots]);

  // Actualizar previsualización cuando cambie el modo, umbral o página activa
  useEffect(() => {
    if (activeFile) {
      renderSlotPreview(activeFile, activeSlot.activePage || 1, mode, threshold, activeSlotIndex);
    }
  }, [activeFile, activeSlot?.activePage, mode, threshold, activeSlotIndex, renderSlotPreview]);

  // Eliminar un slot
  const handleRemoveSlot = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        file: null,
        totalPages: 0,
        activePage: 1,
        previewOriginalUrl: null,
        previewFilteredUrl: null,
      };
      return next;
    });

    // Reasignar slot activo si el eliminado estaba seleccionado
    if (activeSlotIndex === idx) {
      const otherLoadedIdx = slots.findIndex((s, i) => i !== idx && s.file !== null);
      if (otherLoadedIdx !== -1) {
        setActiveSlotIndex(otherLoadedIdx);
      }
    }
  };

  // Limpiar todos los slots
  const handleClearAllSlots = () => {
    setSlots([
      {
        id: 'slot-1',
        file: null,
        totalPages: 0,
        activePage: 1,
        previewOriginalUrl: null,
        previewFilteredUrl: null,
      },
      {
        id: 'slot-2',
        file: null,
        totalPages: 0,
        activePage: 1,
        previewOriginalUrl: null,
        previewFilteredUrl: null,
      },
      {
        id: 'slot-3',
        file: null,
        totalPages: 0,
        activePage: 1,
        previewOriginalUrl: null,
        previewFilteredUrl: null,
      },
    ]);
    setActiveSlotIndex(0);
    setCompletedResult(null);
    setGlobalFile(null);
    setProgressPercent(0);
    setProgressMsg('');
    setHeaderHidden(false);
  };

  // Cambiar página activa en la vista previa
  const handlePageChange = (newPage: number) => {
    if (!activeFile || newPage < 1 || newPage > (activeSlot.totalPages || 1)) return;
    setSlots((prev) => {
      const next = [...prev];
      if (next[activeSlotIndex]) {
        next[activeSlotIndex] = { ...next[activeSlotIndex], activePage: newPage };
      }
      return next;
    });
  };

  // Ejecutar conversión con Web Worker
  const handleConvert = async () => {
    if (!activeFile) {
      toast.error(
        isEs ? 'Por favor carga al menos un archivo PDF.' : 'Please load at least one PDF file.',
      );
      return;
    }

    try {
      setIsProcessing(true);
      setProgressPercent(5);
      setProgressMsg(
        isEs
          ? 'Iniciando motor de conversión monocromática en memoria RAM...'
          : 'Initializing client-side monochrome conversion engine...',
      );

      const arrayBuffer = await activeFile.arrayBuffer();

      const worker = new Worker(new URL('../workers/pdf-blackwhite.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'progress') {
          setProgressPercent(data.percent);
          setProgressMsg(data.message);
        } else if (data.type === 'result') {
          const blob = new Blob([data.buffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const baseName = activeFile.name.replace(/\.pdf$/i, '');
          const suffix = mode === 'blackwhite' ? '_BlancoNegro' : '_EscalaGrises';
          const outName = `${baseName}${suffix}.pdf`;

          setCompletedResult({
            downloadUrl: url,
            filename: outName,
            originalSize: data.originalSize,
            convertedSize: data.convertedSize,
            totalPages: data.totalPages,
            pagesConverted: data.pagesConverted,
            rawBlob: blob,
            outputFormat: 'PDF',
            fileSizeFormatted: formatFileSize(data.convertedSize),
          });

          setIsProcessing(false);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          toast.success(
            isEs
              ? '¡Documento transformado a blanco y negro con éxito!'
              : 'Document successfully transformed to black and white!',
          );
          worker.terminate();
        } else if (data.type === 'error') {
          setIsProcessing(false);
          toast.error(data.message || (isEs ? 'Error en la conversión.' : 'Conversion error.'));
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        setIsProcessing(false);
        console.error('Worker error:', err);
        toast.error(
          isEs ? 'Error crítico en el worker monocromático.' : 'Critical worker conversion error.',
        );
        worker.terminate();
      };

      worker.postMessage(
        {
          action: 'convert',
          arrayBuffer,
          fileName: activeFile.name,
          options: {
            mode,
            threshold,
            qualityPreset,
            pageScope,
            pageRange,
          },
        },
        [arrayBuffer],
      );
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Error inesperado.';
      toast.error(msg);
    }
  };

  const handleReset = () => {
    if (completedResult?.downloadUrl) {
      URL.revokeObjectURL(completedResult.downloadUrl);
    }
    setCompletedResult(null);
    setProgressPercent(0);
    setProgressMsg('');
    setHeaderHidden(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 font-sans space-y-6">
      {/* INPUTS OCULTOS DE CARGA */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            loadFilesIntoSlots(e.target.files);
          }
          e.target.value = '';
        }}
      />
      {[0, 1, 2].map((idx) => (
        <input
          key={idx}
          ref={getSlotInputRef(idx)}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const f = e.target.files[0];
              setSlots((prev) => {
                const next = [...prev];
                next[idx] = {
                  ...next[idx],
                  file: f,
                  totalPages: 0,
                  activePage: 1,
                  previewOriginalUrl: null,
                  previewFilteredUrl: null,
                };
                return next;
              });
              setActiveSlotIndex(idx);
              renderSlotPreview(f, 1, mode, threshold, idx);
            }
            e.target.value = '';
          }}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER DE HERRAMIENTA ELEGANTE (MATCH 1:1 CON EL ESTÁNDAR)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <Link
            href="/convertir"
            onClick={() => setHeaderHidden(false)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '006 / CONVERSIÓN DE DOCUMENTOS A BLANCO Y NEGRO'
                : '006 / BLACK & WHITE DOCUMENT CONVERSION'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Printer className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'grayscale'
                ? isEs
                  ? 'CONVERTIR PDF A ESCALA DE GRISES'
                  : 'CONVERT PDF TO GRAYSCALE'
                : isEs
                  ? 'CONVERTIR PDF A BLANCO Y NEGRO'
                  : 'CONVERT PDF TO BLACK & WHITE'}
            </h1>
          </div>
        </div>

        {(loadedSlots.length > 0 || completedResult) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {completedResult
                  ? completedResult.filename
                  : activeFile?.name ||
                    (isEs
                      ? `${loadedSlots.length} archivos cargados`
                      : `${loadedSlots.length} files loaded`)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearAllSlots}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Limpiar archivos' : 'Clear files'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {completedResult ? (
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: completedResult.downloadUrl,
              filename: completedResult.filename,
              fileSize: completedResult.fileSizeFormatted,
              rawBlob: completedResult.rawBlob,
            }}
            totalPages={completedResult.totalPages || activeSlot?.totalPages || 1}
            modeText={
              mode === 'grayscale'
                ? isEs
                  ? 'Motor Monocromático a Escala de Grises'
                  : 'Grayscale Monochrome Engine'
                : isEs
                  ? 'Motor de Umbralización B&W Puro'
                  : 'Pure B&W Threshold Engine'
            }
            toolName={
              mode === 'grayscale'
                ? isEs
                  ? 'PDF a Escala de Grises'
                  : 'PDF to Grayscale'
                : isEs
                  ? 'PDF a Blanco y Negro'
                  : 'PDF to Black & White'
            }
            badgeText={
              mode === 'grayscale'
                ? isEs
                  ? 'Conversión a Grises Completada'
                  : 'Grayscale Conversion Completed'
                : isEs
                  ? 'Conversión Monocromática Completada'
                  : 'Monochrome Conversion Completed'
            }
            successTitle={
              mode === 'grayscale'
                ? isEs
                  ? '¡PDF en Escala de Grises Listo!'
                  : 'Grayscale PDF Ready!'
                : isEs
                  ? '¡PDF en Blanco y Negro Listo!'
                  : 'Black & White PDF Ready!'
            }
            downloadButtonText={
              isEs
                ? 'Descargar Documento Monocromático (.pdf)'
                : 'Download Monochrome Document (.pdf)'
            }
            shareSubject={isEs ? 'documento PDF monocromático' : 'monochrome PDF document'}
            fallbackUrl="https://pdf-black.com/convertir/pdf-blanco-negro"
            metricBadge={
              <span className="px-2 py-0.5 bg-zinc-500/20 border border-zinc-500/40 text-zinc-300 rounded font-bold font-mono">
                {completedResult.pagesConverted || completedResult.totalPages || 1}{' '}
                {isEs ? 'pág(s) procesadas' : 'processed page(s)'}
              </span>
            }
            onReset={handleClearAllSlots}
          />
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════════════
              SELECTOR DUAL DE MODO 2 EN 1 (PILL SWITCH)
             ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-center my-2 font-mono">
            <div className="bg-[#09090b] border border-zinc-700 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => setMode('grayscale')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'grayscale'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEs ? 'Escala de Grises (.pdf)' : 'Grayscale (.pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('blackwhite')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'blackwhite'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>{isEs ? 'Blanco y Negro (.pdf)' : 'Black & White (.pdf)'}</span>
              </button>
            </div>
          </div>

          {loadedSlots.length === 0 ? (
            /* ═══════════════════════════════════════════════════════════════════════════
                VISTA DROPZONE VACÍA (IDÉNTICA A LA CAPTURA DEL USUARIO)
               ═══════════════════════════════════════════════════════════════════════════ */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  loadFilesIntoSlots(e.dataTransfer.files);
                }
              }}
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
                {mode === 'grayscale' ? (
                  <Sparkles className="w-12 h-12 text-white" />
                ) : (
                  <Printer className="w-12 h-12 text-white" />
                )}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {mode === 'grayscale'
                    ? isEs
                      ? 'Motor Fotométrico Grayscale ITU-R BT.601 • 100% Local'
                      : 'Grayscale Photometric ITU-R BT.601 Engine • 100% Local'
                    : isEs
                      ? 'Motor de Binarización Monocromática v5.0 • 100% Local'
                      : 'Monochrome Binarization Engine v5.0 • 100% Local'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
                {mode === 'grayscale'
                  ? isEs
                    ? 'CONVERTIR PDF A ESCALA DE GRISES'
                    : 'CONVERT PDF TO GRAYSCALE'
                  : isEs
                    ? 'CONVERTIR PDF A BLANCO Y NEGRO'
                    : 'CONVERT PDF TO BLACK & WHITE'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
                {mode === 'grayscale'
                  ? isEs
                    ? 'Convierte imágenes, textos y fondos a gradientes suaves de gris para ahorrar tóner y optimizar el tamaño en MB.'
                    : 'Convert images, text, and backgrounds into smooth gray gradients to save toner and optimize file size.'
                  : isEs
                    ? 'Binariza todo el documento a blanco y negro absoluto eliminando capas de color para impresión nítida y máximo ahorro de tinta.'
                    : 'Binarize documents into pure high-contrast black & white, removing color layers for crisp printing and maximum ink savings.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl font-mono text-left">
                <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-emerald-400 font-bold text-xs block mb-1">
                    {isEs ? '✓ Ahorro del 100% en Tinta a Color' : '✓ 100% Color Ink Savings'}
                  </span>
                  <span className="text-zinc-400 text-[11px] leading-tight">
                    {isEs
                      ? 'Elimina capas de color para imprimir únicamente con cartucho negro o tóner monocromo.'
                      : 'Removes color layers so you print exclusively with black ink or monochrome toner.'}
                  </span>
                </div>
                <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-emerald-400 font-bold text-xs block mb-1">
                    {isEs ? '✓ Filtro Fotométrico ITU-R' : '✓ ITU-R Photometric Filter'}
                  </span>
                  <span className="text-zinc-400 text-[11px] leading-tight">
                    {isEs
                      ? 'Preserva nitidez tipográfica, sellos y firmas calculando la luminancia precisa de cada píxel.'
                      : 'Preserves text sharpness, stamps, and signatures calculating precise per-pixel luminance.'}
                  </span>
                </div>
                <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-emerald-400 font-bold text-xs block mb-1">
                    {isEs ? '✓ Privacidad Estricta en RAM' : '✓ Strict In-RAM Privacy'}
                  </span>
                  <span className="text-zinc-400 text-[11px] leading-tight">
                    {isEs
                      ? 'Procesamiento 100% local en tu navegador sin enviar documentos a servidores externos.'
                      : '100% local processing in your browser without uploading documents to external servers.'}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════════════
                VISTA PRINCIPAL: SECCIÓN 1 (VISOR + 3 SLOTS) + SECCIÓN 2 (PANEL CONTROL)
               ═══════════════════════════════════════════════════════════════════════════ */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 flex-1 w-full"
            >
              {/* ── SECCIÓN 1: VISTA PREVIA (50%) Y 3 CAJAS INDEPENDIENTES ── */}
              <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* BARRA SUPERIOR DE LA SECCIÓN 1 */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                      {isEs ? '001 / VISTA PREVIA (50%) Y ARCHIVOS' : '001 / PREVIEW (50%) & FILES'}
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
                      <span className="font-bold font-mono text-white">{loadedSlots.length}</span> /
                      3 {isEs ? 'cargados' : 'loaded'}
                    </div>

                    <button
                      type="button"
                      onClick={handleClearAllSlots}
                      className="text-zinc-500 hover:text-red-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1 ml-2"
                      title={isEs ? 'Limpiar todas las cajas' : 'Clear all boxes'}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {isEs ? 'Limpiar todo' : 'Clear all'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT: IZQUIERDA AL 50% | DERECHA 3 CAJAS */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[420px] overflow-hidden">
                  {/* ── LADO IZQUIERDO: VISOR COMPACTO CON PREVISUALIZACIÓN FILTRADA ── */}
                  <div className="lg:col-span-6 bg-[#0c0c10] rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-between relative overflow-hidden shadow-inner min-h-[380px]">
                    {/* CONTROLES SUPERIORES DEL VISOR: TOGGLE FILTRO VS ORIGINAL */}
                    <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-zinc-800/80">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                        {previewModeToggle === 'filtered'
                          ? mode === 'blackwhite'
                            ? isEs
                              ? 'Vista: Blanco y Negro'
                              : 'View: Black & White'
                            : isEs
                              ? 'Vista: Escala de Grises'
                              : 'View: Grayscale'
                          : isEs
                            ? 'Vista: Original a Color'
                            : 'View: Original Color'}
                      </span>
                      <div className="flex items-center bg-zinc-900 border border-zinc-700/80 p-0.5 rounded-lg text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setPreviewModeToggle('filtered')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            previewModeToggle === 'filtered'
                              ? 'bg-white text-black shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Monocromo' : 'Monochrome'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewModeToggle('original')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            previewModeToggle === 'original'
                              ? 'bg-white text-black shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Original' : 'Original'}
                        </button>
                      </div>
                    </div>

                    {/* HOJA PDF EN VISTA PREVIA REDUCIDA AL 50% */}
                    <div className="relative bg-white rounded-xl shadow-2xl border border-zinc-400/80 overflow-hidden flex items-center justify-center transition-all duration-300 w-[240px] sm:w-[260px] h-[330px] sm:h-[358px] group">
                      {isPreviewLoading ? (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-zinc-800" />
                          <span className="text-[11px] font-mono font-bold text-zinc-700">
                            {isEs ? 'Renderizando filtro...' : 'Rendering filter...'}
                          </span>
                        </div>
                      ) : previewModeToggle === 'filtered' && activeSlot?.previewFilteredUrl ? (
                        <img
                          src={activeSlot.previewFilteredUrl}
                          alt="Vista previa filtrada"
                          className="w-full h-full object-contain select-none"
                        />
                      ) : activeSlot?.previewOriginalUrl ? (
                        <img
                          src={activeSlot.previewOriginalUrl}
                          alt="Vista previa original"
                          className="w-full h-full object-contain select-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                          <Printer className="w-8 h-8 text-zinc-400" />
                          <span className="text-[11px] font-mono">
                            {isEs ? 'Cargando documento...' : 'Loading document...'}
                          </span>
                        </div>
                      )}

                      {/* BADGE DE PÁGINA */}
                      {(activeSlot?.totalPages || 0) > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/85 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
                          #{activeSlot.activePage} / {activeSlot.totalPages}
                        </div>
                      )}
                    </div>

                    {/* CONTROLES COMPACTOS DE PAGINACIÓN */}
                    {(activeSlot?.totalPages || 0) > 1 && (
                      <div className="flex items-center gap-3 mt-3 bg-zinc-900 border border-zinc-700/80 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 shadow-md">
                        <button
                          type="button"
                          onClick={() => handlePageChange(activeSlot.activePage - 1)}
                          disabled={activeSlot.activePage <= 1}
                          className="hover:text-white disabled:opacity-30 disabled:hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-bold">
                          {isEs ? 'Pág.' : 'Page'} {activeSlot.activePage} {isEs ? 'de' : 'of'}{' '}
                          {activeSlot.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePageChange(activeSlot.activePage + 1)}
                          disabled={activeSlot.activePage >= activeSlot.totalPages}
                          className="hover:text-white disabled:opacity-30 disabled:hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── LADO DERECHO: 3 CAJAS INDEPENDIENTES ── */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-3">
                    {slots.map((slot, sIdx) => {
                      const isOccupied = slot.file !== null;
                      const isActive = activeSlotIndex === sIdx;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            if (isOccupied) {
                              setActiveSlotIndex(sIdx);
                            } else {
                              getSlotInputRef(sIdx).current?.click();
                            }
                          }}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden group min-h-[105px] ${
                            isActive && isOccupied
                              ? 'bg-zinc-900/90 border-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                              : isOccupied
                                ? 'bg-[#121217] border-zinc-800 hover:border-zinc-600'
                                : 'bg-[#0f0f13] border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-[#121217]'
                          }`}
                        >
                          {isOccupied ? (
                            <div className="flex items-center justify-between w-full font-mono">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white shrink-0">
                                  <Printer className="w-5 h-5 text-white" />
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
                                    {isEs
                                      ? `+ Cargar PDF en Caja ${sIdx + 1}`
                                      : `+ Upload PDF in Box ${sIdx + 1}`}
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

              {/* ── SECCIÓN 2: PANEL DE CONTROL EN CUADRÍCULA HORIZONTAL ── */}
              <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                      {isEs
                        ? '002 / CONFIGURACIÓN Y PARÁMETROS MONOCROMÁTICOS'
                        : '002 / CONFIGURATION & MONOCHROME SETTINGS'}
                    </span>
                    <h2 className="text-lg font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                      <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                    </h2>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm">
                    <Sliders className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* CONTENIDO DEL PANEL EN 3 COLUMNAS MODULARES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  {/* COLUMNA 1: MODO Y UMBRAL (THRESHOLD) */}
                  <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col justify-between shadow-inner space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">
                        {isEs ? '1. Modo y Luminancia' : '1. Mode & Luminance'}
                      </span>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setMode('grayscale')}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                            mode === 'grayscale'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Escala Grises' : 'Grayscale'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('blackwhite')}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                            mode === 'blackwhite'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isEs ? 'B&W Puro' : 'Pure B&W'}
                        </button>
                      </div>

                      {mode === 'blackwhite' ? (
                        <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-300">
                              {isEs ? 'Umbral de Contraste:' : 'Contrast Threshold:'}
                            </span>
                            <span className="text-white font-bold font-mono">
                              {threshold} / 255
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="230"
                            step="1"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                            <span>{isEs ? 'Más Oscuro (50)' : 'Darker (50)'}</span>
                            <span>{isEs ? 'Más Claro (230)' : 'Lighter (230)'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-zinc-800/80">
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                            {isEs
                              ? 'Preserva 256 niveles de gris con gradientes fotométricos continuos sin recortar tonos medios.'
                              : 'Preserves 256 smooth gray levels with photometric continuous gradients.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA 2: PRESET DE CALIDAD Y ESCALA */}
                  <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col justify-between shadow-inner space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">
                        {isEs ? '2. Calidad de Salida' : '2. Output Quality'}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {(['draft', 'standard', 'high'] as QualityPreset[]).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setQualityPreset(preset)}
                            className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                              qualityPreset === preset
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {preset === 'draft'
                              ? isEs
                                ? 'Borrador'
                                : 'Draft'
                              : preset === 'standard'
                                ? isEs
                                  ? 'Estándar'
                                  : 'Standard'
                                : isEs
                                  ? 'Imprenta'
                                  : 'High-Res'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-sans mt-2">
                        {qualityPreset === 'draft'
                          ? isEs
                            ? 'Escala 1.2x • Mínimo peso en MB, ideal para envíos por email.'
                            : '1.2x scale • Smallest MB size, ideal for fast email attachments.'
                          : qualityPreset === 'standard'
                            ? isEs
                              ? 'Escala 1.6x • Balance óptimo de legibilidad y peso de archivo.'
                              : '1.6x scale • Optimal balance of sharp text and compact file size.'
                            : isEs
                              ? 'Escala 2.2x • Máxima resolución vectorial para impresión profesional.'
                              : '2.2x scale • Maximum vector sharpness for professional press.'}
                      </p>
                    </div>
                  </div>

                  {/* COLUMNA 3: ALCANCE DE PÁGINAS */}
                  <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col justify-between shadow-inner space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-2">
                        {isEs ? '3. Alcance de Páginas' : '3. Page Range Scope'}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={() => setPageScope('all')}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                            pageScope === 'all'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Todas' : 'All Pages'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageScope('range')}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                            pageScope === 'range'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Por Rango' : 'Custom Range'}
                        </button>
                      </div>

                      {pageScope === 'range' && (
                        <input
                          type="text"
                          placeholder={isEs ? 'Ej: 1, 3-5, 8' : 'E.g.: 1, 3-5, 8'}
                          value={pageRange}
                          onChange={(e) => setPageRange(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 font-mono mt-1"
                        />
                      )}

                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setPageScope('odd')}
                          className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-all ${
                            pageScope === 'odd'
                              ? 'bg-zinc-700 text-white border-zinc-500'
                              : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300'
                          }`}
                        >
                          {isEs ? 'Impares' : 'Odd Pages'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageScope('even')}
                          className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-all ${
                            pageScope === 'even'
                              ? 'bg-zinc-700 text-white border-zinc-500'
                              : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300'
                          }`}
                        >
                          {isEs ? 'Pares' : 'Even Pages'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BARRA DE PROGRESO INTERACTIVA */}
                {isProcessing && (
                  <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700 space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span className="flex items-center gap-2 font-bold">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        {progressMsg}
                      </span>
                      <span className="font-extrabold text-white">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* BOTÓN DE ACCIÓN PRINCIPAL */}
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing || !activeFile}
                  className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-4 rounded-2xl font-sans text-sm w-full flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>{isEs ? 'Procesando en RAM...' : 'Processing in RAM...'}</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 text-black" />
                      <span>
                        {mode === 'grayscale'
                          ? isEs
                            ? 'CONVERTIR A ESCALA DE GRISES'
                            : 'CONVERT TO GRAYSCALE'
                          : isEs
                            ? 'CONVERTIR A BLANCO Y NEGRO'
                            : 'CONVERT TO BLACK & WHITE'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
