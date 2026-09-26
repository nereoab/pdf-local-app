'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  Settings2,
  ShieldCheck,
  Download,
  ArrowLeft,
  FileText,
  Trash2,
  Plus,
  LayoutGrid,
  CheckCircle2,
  Eraser,
  Layers,
  Search,
  Sliders,
  UploadCloud,
  Lock,
  Unlock,
  Check,
  Filter,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  WatermarkRemoveWorkerMessageIn,
  WatermarkRemoveWorkerMessageOut,
} from '@/workers/pdf-watermark-remove.worker';
import FoliarSuccessView from '@/components/FoliarSuccessView';

export default function PdfWatermarkRemover() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize?: string;
    outputFormat: 'pdf';
    rawBlob?: Blob;
  } | null>(null);

  // ESTADO DE ENCRIPTACIÓN / CONTRASEÑA
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // Thumbnails y páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);

  // Opciones de Limpieza Principales
  const [cleanMode, setCleanMode] = useState<'smart' | 'deep' | 'custom'>('smart');
  const [targetText, setTargetText] = useState<string>('');

  // Opciones Avanzadas
  const [filePrefix, setFilePrefix] = useState<string>('Documento_SinSello');
  const [removeAnnots, setRemoveAnnots] = useState<boolean>(true);
  const [removeBackgrounds, setRemoveBackgrounds] = useState<boolean>(true);
  const [removeOcgLayers, setRemoveOcgLayers] = useState<boolean>(true);

  // Selección de Páginas
  const [pageScope, setPageScope] = useState<'all' | 'custom' | 'odds' | 'evens'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const cancelRenderRef = useRef<boolean>(false);

  // Cancelar renders pendientes al desmontar
  useEffect(() => {
    return () => {
      cancelRenderRef.current = true;
    };
  }, []);

  // Scroll automático suave hacia el inicio de la herramienta al terminar
  useEffect(() => {
    if (completedResult) {
      const timer = setTimeout(() => {
        if (topContainerRef.current) {
          topContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [completedResult]);

  // Carga progresiva streaming de miniaturas sin límite estricto
  const loadThumbnails = useCallback(
    async (selectedFile: File, pass?: string) => {
      cancelRenderRef.current = true;
      await new Promise((r) => setTimeout(r, 25));
      cancelRenderRef.current = false;

      setIsLoadingThumbs(true);
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, '') + '_SinSello');

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const buffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: buffer,
          password: pass,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        const pdfDoc = await loadingTask.promise;

        const count = pdfDoc.numPages;
        setTotalPages(count);
        setCustomPageRange(`1-${count}`);

        // Array inicial pre-llenado con strings vacíos
        const thumbs: string[] = new Array(count).fill('');

        // Lote inicial rápido (primeras 16 páginas) a escala liviana
        const initialBatch = Math.min(count, 16);

        for (let i = 1; i <= initialBatch; i++) {
          if (cancelRenderRef.current) return;
          try {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.22 });
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const context = canvas.getContext('2d');

            if (context) {
              context.fillStyle = '#FFFFFF';
              context.fillRect(0, 0, canvas.width, canvas.height);
              await page.render({ canvasContext: context, viewport, canvas } as any).promise;
              thumbs[i - 1] = canvas.toDataURL('image/jpeg', 0.65);
            }
          } catch (err) {
            console.error(`Error al renderizar miniatura ${i}:`, err);
          }
        }

        if (cancelRenderRef.current) return;

        setPageThumbnails([...thumbs]);
        setIsLoadingThumbs(false);
        setIsEncrypted(false);
        setIsUnlocked(true);

        toast.success(
          isEs
            ? `${count} páginas listas para depuración de marcas`
            : `${count} pages ready for watermark removal`,
        );

        // Streaming progresivo en segundo plano para páginas restantes (17 a count)
        if (initialBatch < count) {
          (async () => {
            for (let i = initialBatch + 1; i <= count; i++) {
              if (cancelRenderRef.current) return;
              try {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.22 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const context = canvas.getContext('2d');

                if (context) {
                  context.fillStyle = '#FFFFFF';
                  context.fillRect(0, 0, canvas.width, canvas.height);
                  await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                  thumbs[i - 1] = canvas.toDataURL('image/jpeg', 0.65);
                }
              } catch (err) {
                console.error(`Error renderizando página ${i} en segundo plano:`, err);
              }

              // Actualizar estado suavemente cada 4 páginas o al terminar
              if (i % 4 === 0 || i === count) {
                if (cancelRenderRef.current) return;
                setPageThumbnails([...thumbs]);
                await new Promise((r) => setTimeout(r, 10));
              }
            }
          })();
        }
      } catch (err: any) {
        if (err?.name === 'PasswordException' || err?.code === 1) {
          setIsEncrypted(true);
          setIsUnlocked(false);
          toast.warning(
            isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open',
          );
        } else {
          console.error('Error al cargar miniaturas:', err);
          toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
        }
        setIsLoadingThumbs(false);
      }
    },
    [isEs],
  );

  useEffect(() => {
    if (file && pageThumbnails.length === 0 && !isEncrypted) {
      loadThumbnails(file);
    }
  }, [file, pageThumbnails.length, isEncrypted, loadThumbnails]);

  const processSelectedFile = async (selected: File) => {
    if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(selected);
      setGlobalFile(selected);
      setIsEncrypted(false);
      setIsUnlocked(false);
      setPasswordInput('');
      setUnlockedPassword(undefined);
      await loadThumbnails(selected);
    } else {
      toast.error(
        isEs ? 'Por favor selecciona un archivo PDF válido' : 'Please select a valid PDF file',
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      await loadThumbnails(file, passwordInput);
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

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveFile = () => {
    cancelRenderRef.current = true;
    setFile(null);
    setGlobalFile(null);
    setCompletedResult(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setUnlockedPassword(undefined);
  };

  const handleStartOver = () => {
    cancelRenderRef.current = true;
    setCompletedResult(null);
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setUnlockedPassword(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper para verificar qué páginas deben recibir el filtrado
  const parseSelectedPages = (): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) selected.add(i);
    } else if (pageScope === 'odds') {
      for (let i = 1; i <= totalPages; i += 2) selected.add(i);
    } else if (pageScope === 'evens') {
      for (let i = 2; i <= totalPages; i += 2) selected.add(i);
    } else {
      const parts = (customPageRange || '').split(',');
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i >= 1 && i <= totalPages) selected.add(i);
            }
          }
        } else {
          const num = Number(trimmed);
          if (!isNaN(num) && num >= 1 && num <= totalPages) {
            selected.add(num);
          }
        }
      });
    }

    if (skipFirstPage) {
      selected.delete(1);
    }

    return selected;
  };

  // EJECUCIÓN CON WEB WORKER
  const executeRemoveWatermark = async () => {
    if (!file) {
      toast.error(isEs ? 'Sube un archivo PDF primero.' : 'Upload a PDF file first.');
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
    setProgressMsg(
      isEs ? 'Iniciando motor forense de depuración...' : 'Starting forensic cleaning worker...',
    );

    try {
      const buffer = await file.arrayBuffer();
      const bufferCopy = buffer.slice(0);

      const worker = new Worker(
        new URL('../workers/pdf-watermark-remove.worker.ts', import.meta.url),
        { type: 'module' },
      );

      const payload: WatermarkRemoveWorkerMessageIn = {
        action: 'remove-watermark',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_SinSello',
          cleanMode,
          targetText,
          removeAnnots,
          removeBackgrounds,
          removeOcgLayers,
          pageScope,
          customPageRange,
          skipFirstPage,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
          worker.onmessage = (e: MessageEvent<WatermarkRemoveWorkerMessageOut>) => {
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
      const outName = `${filePrefix.trim() || 'Documento_SinSello'}.pdf`;
      const sizeFormatted = formatFileSize(blob.size);

      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeFormatted,
        outputFormat: 'pdf',
        rawBlob: blob,
      });

      setProgressPercent(100);
      toast.success(
        isEs
          ? '¡Marcas de agua eliminadas con éxito! Tu archivo está listo.'
          : 'Watermarks removed successfully! Your file is ready.',
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message || (isEs ? 'Error al limpiar el documento.' : 'Failed to clean document.'),
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  return (
    <div
      ref={topContainerRef}
      className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start"
    >
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <Link
            href="/editar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '004 / ELIMINACIÓN Y DEPURACIÓN DE MARCAS'
                : '004 / WATERMARK REMOVAL & CLEANING'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Eraser className="w-6 h-6 text-white flex-shrink-0" />
              {isEs
                ? 'REMOVER SELLO DE AGUA DE DOCUMENTOS PDF'
                : 'REMOVE WATERMARK FROM PDF DOCUMENTS'}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {file.name}
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA ULTRA-PREMIUM CON COMPARTIR EN WHATSAPP / TELEGRAM / DRIVE ── */
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: completedResult.downloadUrl,
              filename: completedResult.filename,
              fileSize:
                completedResult.fileSize ||
                (completedResult.rawBlob
                  ? formatFileSize(completedResult.rawBlob.size)
                  : undefined),
              rawBlob: completedResult.rawBlob,
            }}
            totalPages={totalPages}
            modeText={
              isEs
                ? cleanMode === 'smart'
                  ? 'Depuración Inteligente'
                  : cleanMode === 'deep'
                    ? 'Depuración Forense Profunda'
                    : 'Depuración Personalizada'
                : cleanMode === 'smart'
                  ? 'Smart Cleaning'
                  : cleanMode === 'deep'
                    ? 'Deep Forensic Cleaning'
                    : 'Custom Cleaning'
            }
            toolName={isEs ? 'Quitar Sello de Agua' : 'Remove Watermark'}
            badgeText={isEs ? 'Limpieza Completada' : 'Cleaning Completed'}
            successTitle={
              isEs ? '¡Marca de Agua Eliminada con Éxito!' : 'Watermark Removed Successfully!'
            }
            downloadButtonText={isEs ? 'Descargar PDF Limpio' : 'Download Clean PDF'}
            shareSubject={
              isEs ? 'documento depurado sin marcas' : 'clean document without watermarks'
            }
            fallbackUrl="https://pdf-black.com/editar/quitar-marca-agua"
            metricBadge={
              file && completedResult?.rawBlob ? (
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded font-bold font-mono">
                  {formatFileSize(file.size)} → {formatFileSize(completedResult.rawBlob.size)}
                </span>
              ) : null
            }
            onReset={handleStartOver}
          />
        </div>
      ) : !file ? (
        /* ── VISTA DROPZONE DE CARGA EMPRESARIAL CON DRAG AND DROP ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await processSelectedFile(e.dataTransfer.files[0]);
            }
          }}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
            isDraggingFile ? 'border-white bg-zinc-900/50' : 'border-zinc-600 hover:border-white'
          } rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <Eraser className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor Forense de Eliminación de Marcas v5.0 • 100% Local'
                : 'Forensic Watermark Removal Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'REMOVER SELLO DE AGUA DE DOCUMENTOS PDF'
              : 'REMOVE WATERMARK FROM PDF DOCUMENTS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Elimina sellos confidenciales, marcas de fondo de software, sellos de borrador o marcas comerciales de tus documentos PDF de forma limpia, sin rasterizar fuentes ni degradar imágenes.'
              : 'Cleanly strip confidential stamps, background trial watermarks, draft stamps, or vendor watermarks without rasterizing text or degrading image clarity.'}
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
                {isEs ? '✓ Depuración Vectorial Limpia' : '✓ Clean Vector Purging'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Desensambla las instrucciones de marcado (BDC/EMC y operadores Tj) preservando el texto útil.'
                  : 'Disassembles marked content instructions (BDC/EMC and Tj operators) keeping clean body text.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Purgado de Capas OCG & Apryse' : '✓ OCG Layers & Vendor Purge'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Elimina metadatos de marcas, banners de prueba y capas OCG incrustadas por editores comerciales.'
                  : 'Purges watermark metadata, evaluation banners, and OCG layers embedded by commercial editors.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Estricta en RAM' : '✓ Strict In-RAM Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Todo el análisis y limpieza ocurren en Web Workers aislados en tu navegador sin transferir archivos.'
                  : 'All parsing and cleaning take place inside in-browser Web Workers with zero cloud uploads.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── VISTA PRINCIPAL CON DISEÑO APILADO (VISTA PREVIA ARRIBA + PANEL DE CONTROL ABAJO) ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6"
        >
          {/* 1. SECCIÓN SUPERIOR FULL-WIDTH: VISTA PREVIA AMPLIA DE PÁGINAS */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex flex-wrap items-center gap-2 text-zinc-200 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / PÁGINAS A DEPURAR (${totalPages} PÁGINAS)`
                    : `001 / PAGES TO CLEAN (${totalPages} PAGES)`}
                </span>
                {/* Indicador de progreso de streaming en vivo */}
                {totalPages > 0 &&
                pageThumbnails.filter((t) => typeof t === 'string' && t.length > 0).length <
                  totalPages ? (
                  <span className="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-0.5 rounded-full font-mono font-normal flex items-center gap-1.5 shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>
                      {isEs
                        ? `Cargando páginas (${pageThumbnails.filter((t) => typeof t === 'string' && t.length > 0).length}/${totalPages})...`
                        : `Loading pages (${pageThumbnails.filter((t) => typeof t === 'string' && t.length > 0).length}/${totalPages})...`}
                    </span>
                  </span>
                ) : totalPages > 0 ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-0.5 rounded-full font-mono font-normal flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{isEs ? '100% Páginas listas' : '100% Pages loaded'}</span>
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400 font-normal hidden sm:inline">
                  {isEs
                    ? 'Las páginas seleccionadas serán procesadas'
                    : 'Selected pages will be cleaned'}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* WIDGET PARA PDF PROTEGIDO CON CONTRASEÑA */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 space-y-2 font-mono text-xs shadow-inner">
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
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl py-1.5 px-3 text-xs text-white outline-none focus:border-white/40 font-mono shadow-inner"
                  />
                  <button
                    onClick={unlockFileWithPassword}
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 font-mono shadow-sm"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* GRILLA DE MINIATURAS FULL WIDTH */}
            {isLoadingThumbs ? (
              <div className="flex flex-col items-center justify-center min-h-[220px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">
                  {isEs
                    ? 'Generando vista previa de miniaturas en alta resolución...'
                    : 'Generating high-resolution page thumbnails...'}
                </p>
              </div>
            ) : (
              <div className="w-full max-h-[460px] sm:max-h-[520px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 pb-2">
                  {(pageThumbnails.length > 0
                    ? pageThumbnails
                    : Array.from({ length: totalPages || 8 })
                  ).map((thumb, idx) => {
                    const pageNum = idx + 1;
                    const isSelected = selectedPagesSet.has(pageNum);

                    return (
                      <div
                        key={idx}
                        className={`relative group bg-zinc-950 border ${
                          isSelected
                            ? 'border-white/40 ring-1 ring-white/20'
                            : 'border-white/5 opacity-30'
                        } rounded-xl p-2 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                      >
                        {/* Etiqueta de número de página */}
                        <span className="absolute top-1.5 left-1.5 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                          {pageNum}
                        </span>

                        {/* Imagen miniatura */}
                        {typeof thumb === 'string' && thumb.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={`Página ${pageNum}`}
                            loading="lazy"
                            className="w-full h-full object-contain rounded-md bg-white shadow-inner"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900/90 rounded-md flex flex-col items-center justify-center gap-1 text-zinc-500 font-mono">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                            <span className="text-[10px] text-zinc-500 font-bold">{pageNum}</span>
                          </div>
                        )}

                        {/* Badge de limpieza */}
                        {isSelected && (
                          <div className="absolute bottom-2 right-2 z-30 bg-zinc-900/90 border border-zinc-700 p-1.5 rounded-full shadow-md">
                            <Eraser className="w-3 h-3 text-cyan-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. SECCIÓN INFERIOR FULL-WIDTH: PANEL DE CONTROL EMPRESARIAL */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono text-xs">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Encabezado del Panel de Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN DEL MOTOR FORENSE' : '002 / FORENSIC ENGINE CONFIG'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                  <Sliders className="w-5 h-5 text-white" />
                  <span>
                    {isEs ? 'PANEL DE CONTROL DE ELIMINACIÓN' : 'WATERMARK REMOVAL PANEL'}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                  ✓ {isEs ? 'Motor Forense v5.0' : 'Forensic Engine v5.0'}
                </span>
              </div>
            </div>

            {/* GRID DE 3 COLUMNAS TEMÁTICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* COLUMNA 1: MODO DE LIMPIEZA & PALABRAS CLAVE */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Eraser className="w-4 h-4 text-white" />
                  <span>{isEs ? '1. Modo de Limpieza' : '1. Cleaning Mode'}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                    {isEs ? 'Nivel de Depuración:' : 'Purging Level:'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCleanMode('smart')}
                      className={`py-2 px-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                        cleanMode === 'smart'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Inteligente' : 'Smart'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCleanMode('deep')}
                      className={`py-2 px-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                        cleanMode === 'deep'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Forense' : 'Forensic'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCleanMode('custom')}
                      className={`py-2 px-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                        cleanMode === 'custom'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Manual' : 'Custom'}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 leading-tight">
                    {cleanMode === 'smart'
                      ? isEs
                        ? 'Elimina sellos vectoriales, marcas Apryse y textos de fondo conservando ilustraciones legítimas.'
                        : 'Removes vector stamps, Apryse marks, and text watermarks while preserving illustrations.'
                      : cleanMode === 'deep'
                        ? isEs
                          ? 'Purga agresiva de capas OCG, objetos transparentes (/ca), PieceInfo y metadatos de marcas.'
                          : 'Aggressive purge of OCG layers, transparent objects (/ca), PieceInfo, and vendor metadata.'
                        : isEs
                          ? 'Focaliza la eliminación exclusivamente en las palabras clave ingresadas a continuación.'
                          : 'Targets removal exclusively on the custom keywords entered below.'}
                  </p>
                </div>

                {/* Palabras Clave */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between font-bold">
                    <span>
                      {isEs ? 'Términos a Buscar y Eliminar:' : 'Target Terms to Remove:'}
                    </span>
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                  </label>
                  <input
                    type="text"
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder={
                      isEs ? 'Ej: CONFIDENCIAL, BORRADOR, COPIA' : 'e.g. CONFIDENTIAL, DRAFT, COPY'
                    }
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'CONFIDENCIAL',
                      'BORRADOR',
                      'COPIA',
                      'RESERVADO',
                      'APRYSE',
                      'WATERMARK',
                      'DRAFT',
                      'SAMPLE',
                      'CAMSCANNER',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const current = targetText
                            ? targetText.split(',').map((s) => s.trim())
                            : [];
                          if (!current.includes(preset)) {
                            setTargetText(current.length > 0 ? `${targetText}, ${preset}` : preset);
                          }
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: FILTROS AVANZADOS DE CAPAS Y METADATOS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Filter className="w-4 h-4 text-white" />
                  <span>
                    {isEs ? '2. Filtros de Capas & XObjects' : '2. Layer & XObject Filters'}
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={removeAnnots}
                      onChange={(e) => setRemoveAnnots(e.target.checked)}
                      className="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-white focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isEs
                          ? 'Eliminar Anotaciones Flotantes (/Annots)'
                          : 'Remove Floating Annotations (/Annots)'}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                        {isEs
                          ? 'Suprime sellos, estampas y capas de marcado superpuestas como anotaciones.'
                          : 'Purges stamps, annotations, and overlays registered as page annotations.'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={removeBackgrounds}
                      onChange={(e) => setRemoveBackgrounds(e.target.checked)}
                      className="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-white focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isEs
                          ? 'Vaciar XObjects de Sello (/WM /FM)'
                          : 'Zero Watermark XObjects (/WM /FM)'}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                        {isEs
                          ? 'Localiza y vacía los streams de logotipos o sellos de agua gráficos incrustados.'
                          : 'Locates and zeroes embedded graphic logo and watermark streams.'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={removeOcgLayers}
                      onChange={(e) => setRemoveOcgLayers(e.target.checked)}
                      className="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-white focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isEs ? 'Purgar Capas OCG & Metadatos' : 'Purge OCG Layers & Metadata'}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                        {isEs
                          ? 'Elimina /OCProperties y /PieceInfo para desactivar capas de software comercial.'
                          : 'Deletes /OCProperties and /PieceInfo to strip commercial vendor layer states.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* COLUMNA 3: ALCANCE DE PÁGINAS, PREFIJO Y EJECUCIÓN */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Layers className="w-4 h-4 text-white" />
                  <span>
                    {isEs ? '3. Alcance, Metadatos & Ejecutar' : '3. Scope, Metadata & Execute'}
                  </span>
                </div>

                {/* Alcance de Páginas */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">
                    {isEs ? 'Páginas a Depurar:' : 'Pages to Clean:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                    {[
                      { id: 'all', label: isEs ? 'Todas' : 'All' },
                      { id: 'odds', label: isEs ? 'Impares' : 'Odds' },
                      { id: 'evens', label: isEs ? 'Pares' : 'Evens' },
                      { id: 'custom', label: isEs ? 'Rango' : 'Custom' },
                    ].map((scopeItem) => (
                      <button
                        key={scopeItem.id}
                        type="button"
                        onClick={() => setPageScope(scopeItem.id as any)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          pageScope === scopeItem.id
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {scopeItem.label}
                      </button>
                    ))}
                  </div>

                  {pageScope === 'custom' && (
                    <input
                      type="text"
                      value={customPageRange}
                      onChange={(e) => setCustomPageRange(e.target.value)}
                      placeholder="1, 3-5, 8"
                      className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono mb-2"
                    />
                  )}

                  <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={skipFirstPage}
                      onChange={(e) => setSkipFirstPage(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 cursor-pointer"
                    />
                    <span>
                      {isEs ? 'Omitir carátula / primera página' : 'Skip cover / first page'}
                    </span>
                  </label>
                </div>

                {/* Prefijo y Metadatos */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                      {isEs ? 'Prefijo de archivo:' : 'File prefix:'}
                    </label>
                    <input
                      type="text"
                      value={filePrefix}
                      onChange={(e) => setFilePrefix(e.target.value)}
                      placeholder="Documento_SinSello"
                      className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase block mb-0.5">
                        {isEs ? 'Título PDF:' : 'PDF Title:'}
                      </label>
                      <input
                        type="text"
                        placeholder="Documento_Limpio"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-[10px] text-white outline-none focus:border-white shadow-inner font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase block mb-0.5">
                        {isEs ? 'Autor / Entidad:' : 'Author / Entity:'}
                      </label>
                      <input
                        type="text"
                        placeholder="Mi Empresa S.A."
                        value={docAuthor}
                        onChange={(e) => setDocAuthor(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-[10px] text-white outline-none focus:border-white shadow-inner font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Principal de Acción */}
                <div className="pt-2">
                  {isProcessing && (
                    <div className="mb-3 space-y-1.5 font-mono">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                        <span className="truncate max-w-[200px]">{progressMsg}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className="h-full bg-white transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={executeRemoveWatermark}
                    disabled={isProcessing || !file || (isEncrypted && !isUnlocked)}
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-100 py-3.5 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Eraser className="w-4 h-4 text-black" />
                    )}
                    <span>
                      {isProcessing
                        ? progressMsg
                        : !file
                          ? isEs
                            ? 'Selecciona un archivo PDF'
                            : 'Select a PDF file'
                          : isEs
                            ? 'Remover Sello de Agua →'
                            : 'Remove Watermark →'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
