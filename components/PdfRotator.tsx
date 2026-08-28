'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  RotateCw,
  RotateCcw,
  FileText,
  X,
  Loader2,
  Sliders,
  UploadCloud,
  Filter,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Unlock,
  LayoutGrid,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RotateWorkerMessageIn, RotateWorkerMessageOut } from '@/workers/pdf-rotate.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

type PageThumb = {
  pageNum: number; // 1-indexed
  thumbnailUrl: string | null;
  rotation: number; // 0, 90, 180, 270
  isLandscape: boolean;
  selected: boolean;
};

interface CompletedRotateResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  rotatedPagesCount: number;
  totalPages: number;
  rawBlob: Blob;
  originalSize: string;
}

export default function PdfRotator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [pages, setPages] = useState<PageThumb[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedResult, setCompletedResult] = useState<CompletedRotateResult | null>(null);

  // Ocultar barra superior global y scroll automático suave hacia la cabecera de la herramienta
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

  // Asegurar restauración de barra superior al desmontar
  useEffect(() => {
    return () => {
      setHeaderHidden(false);
    };
  }, [setHeaderHidden]);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // RESULTADOS Y PREVIAS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // OPCIONES AVANZADAS Y METADATOS
  const [rangeInput, setRangeInput] = useState<string>('');
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Rotado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [previewZoomPage, setPreviewZoomPage] = useState<PageThumb | null>(null);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const rotatedCount = useMemo(() => {
    return pages.filter((p) => p.rotation !== 0).length;
  }, [pages]);

  // Cargar y renderizar miniaturas Canvas del PDF
  const renderThumbnails = useCallback(
    async (selectedFile: File, pass?: string) => {
      setIsProcessing(true);
      setProgressPercent(10);
      setProgressMsg(isEs ? 'Renderizando miniaturas...' : 'Rendering thumbnails...');
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, '') + '_Rotado');

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: pass });
        const pdf = await loadingTask.promise;
        const count = pdf.numPages;

        const thumbs: PageThumb[] = [];
        const renderLimit = Math.min(count, 32);

        for (let p = 1; p <= renderLimit; p++) {
          setProgressMsg(
            isEs ? `Procesando pág ${p} de ${count}...` : `Processing page ${p} of ${count}...`,
          );
          setProgressPercent(10 + Math.floor((p / count) * 80));
          if (p % 4 === 0) await new Promise((r) => setTimeout(r, 5));

          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          let dataUrl: string | null = null;
          const isLandscape = viewport.width > viewport.height;

          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport, canvas } as any).promise;
            dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          }

          thumbs.push({
            pageNum: p,
            thumbnailUrl: dataUrl,
            rotation: 0,
            isLandscape,
            selected: false,
          });
        }

        // Rellenar resto de páginas si el documento es grande
        for (let p = renderLimit + 1; p <= count; p++) {
          thumbs.push({
            pageNum: p,
            thumbnailUrl: null,
            rotation: 0,
            isLandscape: false,
            selected: false,
          });
        }

        setPages(thumbs);
        setIsEncrypted(false);
        setIsUnlocked(true);
        setProgressPercent(100);
        toast.success(
          isEs ? `${count} páginas listas para rotación` : `${count} pages ready for rotation`,
        );
      } catch (error: any) {
        if (error?.name === 'PasswordException' || error?.code === 1) {
          setIsEncrypted(true);
          setIsUnlocked(false);
          toast.warning(
            isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open',
          );
        } else {
          console.error(error);
          toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
        }
      } finally {
        setIsProcessing(false);
        setProgressMsg('');
      }
    },
    [isEs],
  );

  useEffect(() => {
    if (file && pages.length === 0 && !isEncrypted) {
      renderThumbnails(file);
    }
  }, [file, pages.length, isEncrypted, renderThumbnails]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        setPages([]);
        setIsEncrypted(false);
        setIsUnlocked(false);
        setUnlockedPassword(undefined);
        setPasswordInput('');
        await renderThumbnails(selected);
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      await renderThumbnails(file, passwordInput);
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
    setPages([]);
    setDownloadUrl(null);
    setCompletedResult(null);
    setGlobalFile(null);
    setRangeInput('');
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setGlobalFile, setHeaderHidden]);

  // ROTACIÓN DE PÁGINAS INDIVIDUALES
  const rotateSinglePage = (index: number, degreesToAdd: number) => {
    setPages((prev) => {
      const updated = [...prev];
      const newRotation = (updated[index].rotation + degreesToAdd + 360) % 360;
      updated[index] = { ...updated[index], rotation: newRotation };
      return updated;
    });
    setDownloadUrl(null);
  };

  // ROTACIÓN MASIVA O POR FILTROS
  const rotateAllPages = (degreesToAdd: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + degreesToAdd + 360) % 360,
      })),
    );
    setDownloadUrl(null);
    toast.success(
      isEs ? `Todas las páginas giradas ${degreesToAdd}°` : `All pages rotated ${degreesToAdd}°`,
    );
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
    setDownloadUrl(null);
    toast.info(isEs ? 'Rotaciones restablecidas a 0°' : 'Rotations reset to 0°');
  };

  const normalizeLandscapePages = () => {
    let count = 0;
    setPages((prev) =>
      prev.map((p) => {
        if (p.isLandscape && p.rotation === 0) {
          count++;
          return { ...p, rotation: 90 };
        }
        return p;
      }),
    );
    setDownloadUrl(null);
    if (count > 0) {
      toast.success(
        isEs
          ? `${count} páginas horizontales normalizadas a 90°`
          : `${count} landscape pages normalized to 90°`,
      );
    } else {
      toast.info(
        isEs
          ? 'No se encontraron páginas horizontales sin rotar'
          : 'No unrotated landscape pages found',
      );
    }
  };

  const toggleSelectPage = (index: number) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const selectEvenPages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: p.pageNum % 2 === 0 })));
  };

  const selectOddPages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: p.pageNum % 2 !== 0 })));
  };

  const selectLandscapePages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: p.isLandscape })));
  };

  const clearSelection = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  const rotateSelectedPages = (degreesToAdd: number) => {
    const selectedCount = pages.filter((p) => p.selected).length;
    if (selectedCount === 0) {
      toast.error(
        isEs ? 'Selecciona al menos una página primero' : 'Select at least one page first',
      );
      return;
    }

    setPages((prev) =>
      prev.map((p) => {
        if (p.selected) {
          return { ...p, rotation: (p.rotation + degreesToAdd + 360) % 360 };
        }
        return p;
      }),
    );
    setDownloadUrl(null);
    toast.success(
      isEs
        ? `${selectedCount} páginas seleccionadas giradas ${degreesToAdd}°`
        : `${selectedCount} selected pages rotated ${degreesToAdd}°`,
    );
  };

  // SINCRONIZAR ENTRADA DE RANGOS DE TEXTO CON SELECCIÓN DE ROTACIÓN
  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    if (!val.trim()) return;

    const indicesToSelect: Set<number> = new Set();
    val.split(',').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= pages.length) indicesToSelect.add(i);
          }
        }
      } else {
        const pNum = parseInt(trimmed, 10);
        if (!isNaN(pNum) && pNum >= 1 && pNum <= pages.length) {
          indicesToSelect.add(pNum);
        }
      }
    });

    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        selected: indicesToSelect.has(p.pageNum),
      })),
    );
  };

  // EJECUCIÓN CON WEB WORKER
  const executeRotate = async () => {
    if (!file || pages.length === 0) {
      toast.error(isEs ? 'Carga un archivo PDF' : 'Upload a PDF file');
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

      const worker = new Worker(new URL('../workers/pdf-rotate.worker.ts', import.meta.url), {
        type: 'module',
      });

      const pageRotationsPayload = pages.map((p) => ({
        pageNum: p.pageNum,
        rotation: p.rotation,
      }));

      const payload: RotateWorkerMessageIn = {
        action: 'rotate',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        pageRotations: pageRotationsPayload,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Rotado',
          renumberPages,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
          worker.onmessage = (e: MessageEvent<RotateWorkerMessageOut>) => {
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
      const outName = `${filePrefix.trim() || 'Documento_Rotado'}.pdf`;
      const sizeFormatted = formatFileSize(blob.size);
      const origSizeFormatted = file ? formatFileSize(file.size) : '—';

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeFormatted,
        rotatedPagesCount: rotatedCount,
        totalPages: result.totalPages,
        rawBlob: blob,
        originalSize: origSizeFormatted,
      });

      setProgressPercent(100);
      toast.success(
        isEs ? '¡Documento PDF rotado con éxito!' : 'PDF document rotated successfully!',
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message ||
          (isEs ? 'Error al guardar la rotación del documento' : 'Error saving document rotation'),
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
                ? '002 / ROTACIÓN Y ORIENTACIÓN DE DOCUMENTOS PDF'
                : '002 / PDF ROTATION & ORIENTATION'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <RotateCw className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'ROTAR O CAMBIAR ORIENTACIÓN DE PÁGINAS PDF' : 'ROTATE PDF PAGES'}
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
          {/* BANNER DE RESULTADO Y MÉTRICAS DE ROTACIÓN (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-2xl text-white shadow-md">
                  <RotateCw className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA ROTACIÓN DE PÁGINAS' : 'PAGE ROTATION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? '¡Documento rotado con éxito!' : 'Document rotated successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5 font-sans">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Rotadas' : 'Rotated Pages'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.rotatedPagesCount}{' '}
                  {isEs ? 'Páginas modificadas' : 'Pages modified'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Totales' : 'Total Pages'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Modo de Procesamiento' : 'Processing Mode'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Vectorial Nativo' : 'Native Vector'}
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
            {isEs ? 'ROTAR O CAMBIAR ORIENTACIÓN DE PÁGINAS PDF' : 'ROTATE PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Gira hojas individuales o masivamente a 90°, 180° o 270° de forma 100% confidencial y local.'
              : 'Rotate single pages or entire documents to 90°, 180°, or 270° 100% locally.'}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y GRID DE PÁGINAS ROTABLES EN CUADRÍCULA 4x4 */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
        >
          {/* LADO IZQUIERDO: REJILLA INTERACTIVA DE PÁGINAS EN CUADRÍCULA 4x4 */}
          <div className="lg:col-span-7 xl:col-span-8 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col lg:h-[760px] lg:max-h-[760px] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / VISTA PREVIA Y ORIENTACIÓN DE PÁGINAS (${pages.length} HOJAS)`
                    : `001 / PREVIEW & PAGE ORIENTATION (${pages.length} SHEETS)`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono bg-zinc-800 px-3 py-1 rounded-xl border border-zinc-600 shadow-sm">
                  {rotatedCount} {isEs ? 'rotadas' : 'rotated'}
                </span>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* PASSWORD WIDGET FOR ENCRYPTED PDF */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4 space-y-2 font-mono text-xs">
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

            {/* BARRA DE SELECCIÓN RÁPIDA DE FILTROS */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] mb-4">
              <span className="text-zinc-300 font-bold">
                {isEs ? 'Selección Rápida:' : 'Quick Select:'}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectEvenPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Pares' : 'Evens'}
                </button>
                <button
                  type="button"
                  onClick={selectOddPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Impares' : 'Odds'}
                </button>
                <button
                  type="button"
                  onClick={selectLandscapePages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Filter className="w-3 h-3 text-white" />
                  {isEs ? 'Horizontales' : 'Landscapes'}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Limpiar' : 'Clear'}
                </button>
              </div>
            </div>

            {/* GRID DE MINIATURAS CANVAS CON ROTACIÓN VISUAL EN CUADRÍCULA ESPACIOSA Y PROPORCIONAL */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 p-1">
              {pages.map((p, idx) => (
                <motion.div
                  key={p.pageNum}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => toggleSelectPage(idx)}
                  className={`relative w-full h-[290px] min-h-[290px] rounded-2xl border p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 group overflow-hidden ${
                    p.selected
                      ? 'border-white bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                      : p.rotation !== 0
                        ? 'border-white/40 bg-zinc-950'
                        : 'border-white/10 hover:border-white/30 bg-zinc-950'
                  }`}
                >
                  {/* BADGES DE PÁGINA Y ROTACIÓN */}
                  <div className="w-full flex items-center justify-between mb-2 font-mono text-[10px] shrink-0">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-zinc-900 border border-white/10 text-zinc-300">
                      Pág. {p.pageNum}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${p.rotation !== 0 ? 'bg-white text-black' : 'text-zinc-500'}`}
                    >
                      {p.rotation}°
                    </span>
                  </div>

                  {/* MINIATURA CANVAS ROTADA VISUALMENTE EN TIEMPO REAL */}
                  <div className="w-full flex-1 min-h-0 bg-zinc-900/90 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner p-2 border border-white/5">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnailUrl}
                        alt={`Página ${p.pageNum}`}
                        className="max-w-full max-h-full object-contain rounded drop-shadow-md transition-transform duration-300"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* CONTROLES FLOTANTES INDIVIDUALES */}
                  <div className="w-full flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateSinglePage(idx, 90);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
                        title={isEs ? 'Girar 90° Derecha' : 'Rotate 90° CW'}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateSinglePage(idx, -90);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
                        title={isEs ? 'Girar 90° Izquierda' : 'Rotate 90° CCW'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewZoomPage(p);
                      }}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
                      title={isEs ? 'Zoom' : 'Zoom'}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6 lg:h-[760px] lg:max-h-[760px] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-4 pb-3 border-b border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* BOTONES DE ROTACIÓN MASIVA UNIFICADA */}
              <div className="space-y-3 font-mono text-xs mb-5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">
                  {isEs ? 'Rotación Masiva de Todo el Documento:' : 'Mass Full Document Rotation:'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => rotateAllPages(90)}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar 90° Derecha' : 'Rotate 90° CW'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => rotateAllPages(-90)}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar 90° Izquierda' : 'Rotate 90° CCW'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => rotateAllPages(180)}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar 180° (Invertir)' : 'Rotate 180°'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetAllRotations}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEs ? 'Restablecer (0°)' : 'Reset (0°)'}</span>
                  </button>
                </div>

                {/* NORMALIZAR HORIZONTALES AUTOMÁTICO */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold">
                    {isEs ? 'Normalización Inteligente:' : 'Smart Normalization:'}
                  </span>
                  <button
                    type="button"
                    onClick={normalizeLandscapePages}
                    disabled={pages.length === 0}
                    className="px-3 py-1.5 bg-white text-black font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 font-mono"
                  >
                    {isEs ? 'Normalizar Horizontales' : 'Normalize Landscapes'}
                  </button>
                </div>

                {/* APLICAR ROTACIÓN A SELECCIÓN */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                    {isEs ? 'Girar Páginas Seleccionadas:' : 'Rotate Selected Pages:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => rotateSelectedPages(90)}
                      disabled={pages.length === 0}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      +90° Derecha
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateSelectedPages(-90)}
                      disabled={pages.length === 0}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      -90° Izquierda
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-3 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>{isEs ? 'Opciones Avanzadas PDFBLACK' : 'PDFBLACK Advanced Options'}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEs ? 'Rotación por Texto / Rango:' : 'Range Selection Input:'}
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => handleRangeInputChange(e.target.value)}
                    placeholder="ej: 1, 3, 5-8"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEs ? 'Prefijo del Archivo Resultante:' : 'Output File Prefix:'}
                  </label>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Rotado"
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
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>
                      {isEs
                        ? 'Re-numerar páginas en pie de página (Página N / M)'
                        : 'Re-number footer pages (Page N / M)'}
                    </span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">
                    {isEs ? 'METADATOS DEL PDF ROTADO' : 'ROTATED PDF METADATA'}
                  </label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isEs ? 'Título:' : 'Title:'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isEs ? 'Ej: Documento_Orientado_2026' : 'Ex: Rotated_Document_2026'
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
                        isEs ? 'Ej: Orientación de planos y hojas' : 'Ex: Sheet orientation'
                      }
                      value={docSubject}
                      onChange={(e) => setDocSubject(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
            <div className="pt-4 border-t border-white/10 font-sans">
              {isProcessing && (
                <div className="mb-3 space-y-1.5 font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                    <span className="truncate max-w-[200px]">{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-white transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={executeRotate}
                disabled={isProcessing || pages.length === 0 || (isEncrypted && !isUnlocked)}
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
                    : pages.length === 0
                      ? isEs
                        ? 'Selecciona un archivo PDF'
                        : 'Select a PDF file'
                      : isEs
                        ? `Guardar Cambios y Rotar PDF (${rotatedCount} rotadas) →`
                        : `Save Changes & Rotate PDF (${rotatedCount} rotated) →`}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA */}
      {previewZoomPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/20 p-6 rounded-2xl max-w-xl w-full flex flex-col items-center gap-4 relative shadow-2xl font-mono">
            <button
              type="button"
              onClick={() => setPreviewZoomPage(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-white font-bold text-sm">
              {isEs
                ? `Previsualización - Página #${previewZoomPage.pageNum} (${previewZoomPage.rotation}°)`
                : `Preview - Page #${previewZoomPage.pageNum} (${previewZoomPage.rotation}°)`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner">
              {previewZoomPage.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewZoomPage.thumbnailUrl}
                  alt="Preview Zoom"
                  className="max-h-[65vh] object-contain transition-transform duration-300"
                  style={{ transform: `rotate(${previewZoomPage.rotation}deg)` }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
