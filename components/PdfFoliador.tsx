'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hash,
  Loader2,
  Settings2,
  ShieldCheck,
  Download,
  ArrowLeft,
  Sparkles,
  FileText,
  Trash2,
  Plus,
  LayoutGrid,
  Check,
  UploadCloud,
  Sliders,
  Lock,
  Unlock,
  BookOpen,
  FileCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  NumberWorkerMessageIn,
  NumberWorkerMessageOut,
  Position9,
} from '@/workers/pdf-number.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';

export default function PdfFoliador() {
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

  // Opciones Principales de Foliado Empresarial
  const [pageMode, setPageMode] = useState<'single' | 'facing'>('single');
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [textFormat, setTextFormat] = useState<string>('only-number');
  const [customPrefix, setCustomPrefix] = useState<string>('Folio');

  // Opciones Avanzadas y Tipografía Empresarial
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Foliado');
  const [margin, setMargin] = useState<'small' | 'recommended' | 'big'>('recommended');
  const [fontSizeOption, setFontSizeOption] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontColor, setFontColor] = useState<string>('dark');
  const [fontFamily, setFontFamily] = useState<'helvetica' | 'times' | 'courier'>('helvetica');
  const [numberStyle, setNumberStyle] = useState<
    'arabic' | 'padded' | 'padded-3' | 'padded-6' | 'roman' | 'roman-lower'
  >('arabic');
  const [drawBackground, setDrawBackground] = useState<boolean>(false);
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  const [firstNumber, setFirstNumber] = useState<number>(1);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);

  // METADATOS EMPRESARIALES
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const cancelRenderRef = useRef<boolean>(false);

  // Asegurar cancelación de renders al desmontar
  useEffect(() => {
    return () => {
      cancelRenderRef.current = true;
    };
  }, []);

  // Scroll automático suave hacia el inicio de la herramienta
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

  const loadThumbnails = useCallback(
    async (selectedFile: File, pass?: string) => {
      cancelRenderRef.current = true;
      await new Promise((r) => setTimeout(r, 25));
      cancelRenderRef.current = false;

      setIsLoadingThumbs(true);
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, '') + '_Foliado');

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
        setStartPage(1);
        setEndPage(count);

        // Pre-llenar array de miniaturas con strings vacíos para el total de páginas
        const thumbs: string[] = new Array(count).fill('');

        // Lote inicial rápido (16 páginas) a escala liviana para visualización inmediata
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
            ? `${count} páginas listas para foliado empresarial`
            : `${count} pages ready for enterprise numbering`,
        );

        // Streaming progresivo en segundo plano para procesar todas las páginas restantes
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

              // Actualizar estado en lotes suaves de 4 páginas o al finalizar
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

  const handleRemoveFile = () => {
    cancelRenderRef.current = true;
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setUnlockedPassword(undefined);
  };

  // Mapeo visual de punto rojo de posición según matriz 3x3 y modo dúplex
  const getDotPositionStyle = (pos: Position9, isEvenPage = false) => {
    let effectivePos = pos;
    if (pageMode === 'facing' && isEvenPage) {
      if (pos === 'top-right') effectivePos = 'top-left';
      else if (pos === 'top-left') effectivePos = 'top-right';
      else if (pos === 'bottom-right') effectivePos = 'bottom-left';
      else if (pos === 'bottom-left') effectivePos = 'bottom-right';
      else if (pos === 'center-right') effectivePos = 'center-left';
      else if (pos === 'center-left') effectivePos = 'center-right';
    }

    switch (effectivePos) {
      case 'top-left':
        return 'top-3 left-3';
      case 'top-center':
        return 'top-3 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-3 right-3';
      case 'center-left':
        return 'top-1/2 -translate-y-1/2 left-3';
      case 'center':
        return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
      case 'center-right':
        return 'top-1/2 -translate-y-1/2 right-3';
      case 'bottom-left':
        return 'bottom-3 left-3';
      case 'bottom-center':
        return 'bottom-3 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-3 right-3';
      default:
        return 'bottom-3 right-3';
    }
  };

  // EJECUCIÓN CON WEB WORKER EMPRESARIAL
  const executeFoliado = async () => {
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
      isEs
        ? 'Iniciando Motor Empresarial de Foliado...'
        : 'Starting Enterprise Numbering Engine...',
    );

    try {
      const buffer = await file.arrayBuffer();
      const bufferCopy = buffer.slice(0);

      const worker = new Worker(new URL('../workers/pdf-number.worker.ts', import.meta.url), {
        type: 'module',
      });

      const payload: NumberWorkerMessageIn = {
        action: 'number',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Foliado',
          renumberPages: false,
          position,
          textFormat,
          customPrefix,
          margin,
          fontSizeOption,
          fontColor,
          fontFamily,
          numberStyle,
          pageMode,
          drawBackground,
          skipFirstPage,
          firstNumber,
          startPage,
          endPage,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
          worker.onmessage = (e: MessageEvent<NumberWorkerMessageOut>) => {
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
      const outName = `${filePrefix.trim() || 'Documento_Foliado'}.pdf`;
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';

      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeMb,
        rawBlob: blob,
      });

      setProgressPercent(100);
      toast.success(
        isEs
          ? '¡Documento foliado con éxito! Tu archivo está listo.'
          : 'PDF numbered successfully! Your file is ready.',
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message || (isEs ? 'Error al foliar el documento.' : 'Failed to number PDF.'),
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
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
                ? '002 / FOLIADO Y NUMERACIÓN EMPRESARIAL'
                : '002 / ENTERPRISE PAGE NUMBERING & FOLIOS'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Hash className="w-6 h-6 text-white flex-shrink-0" />
              {isEs
                ? 'NUMERACIÓN O FOLIADO DE PÁGINAS DE DOCUMENTOS PDF'
                : 'NUMBERING OR FOLIOS OF PDF PAGES'}
            </h1>
          </div>
        </div>

        {file && !completedResult && (
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
        /* ── PANTALLA DE ÉXITO DEDICADA ── */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE FOLIADO */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <Hash className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DEL FOLIADO DE DOCUMENTO' : 'DOCUMENT NUMBERING RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? '¡Páginas foliadas con éxito!' : 'Pages numbered successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-[#E8DFCF]/30 px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-[#FAF6EE] font-extrabold text-sm sm:text-base flex items-center gap-1.5 font-sans">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Foliadas' : 'Numbered Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber
                    value={Math.max(1, endPage - startPage + 1 - (skipFirstPage ? 1 : 0))}
                  />{' '}
                  {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Total del Documento' : 'Document Total'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={totalPages} /> {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Modo de Procesamiento' : 'Processing Mode'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Motor Empresarial Notarial' : 'Enterprise Notarial Engine'}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA ÉXITO */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            onReset={handleStartOver}
          />
        </motion.div>
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
            <Hash className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de Foliado y Numeración Vectorial v5.0 • 100% Local'
                : 'Vector Page Numbering & Folio Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'NUMERACIÓN O FOLIADO DE PÁGINAS DE DOCUMENTOS PDF'
              : 'NUMBERING OR FOLIOS OF PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Añade números correlativos, folios notariales y sellos Bates con precisión milimétrica, páginas enfrentadas y máxima confidencialidad en tu memoria RAM.'
              : 'Add sequential page numbers, notarial folios, and Bates stamps with millimeter precision, facing pages, and maximum in-RAM privacy.'}
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
                {isEs ? '✓ Foliado Notarial y Bates' : '✓ Notarial & Bates Folios'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Formatos legales para expedientes judiciales, licitaciones públicas, contratos y folios frente y vuelta.'
                  : 'Legal formats for judicial records, public tenders, contracts, and front/back folios.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Páginas Enfrentadas (Dúplex)' : '✓ Facing Pages (Duplex)'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Alineación simétrica automática en páginas pares e impares, ideal para encuadernación de libros e informes.'
                  : 'Automatic symmetrical alignment on odd and even pages, ideal for binding books and reports.'}
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
                    ? `001 / VISTA PREVIA DEL DOCUMENTO (${totalPages} PÁGINAS)`
                    : `001 / DOCUMENT PAGES PREVIEW (${totalPages} PAGES)`}
                </span>
                {pageMode === 'facing' && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                    {isEs ? 'Modo Dúplex / Enfrentadas' : 'Duplex / Facing Mode'}
                  </span>
                )}
                {/* Indicador de progreso de carga en streaming para documentos extensos */}
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
                    ? 'El punto rojo indica la posición activa del foliado'
                    : 'Red dot indicates live folio stamp position'}
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

            {/* GRILLA DE MINIATURAS FULL WIDTH CON VIEWPORT EXPANDIDO */}
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
                    const isIncluded =
                      pageNum >= startPage &&
                      pageNum <= endPage &&
                      !(skipFirstPage && pageNum === 1);
                    const isEven = pageNum % 2 === 0;

                    return (
                      <div
                        key={idx}
                        className={`relative group bg-zinc-950 border ${
                          isIncluded
                            ? 'border-white/40 ring-1 ring-white/20'
                            : 'border-white/5 opacity-30'
                        } rounded-xl p-2 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                      >
                        {/* Etiqueta de número de página */}
                        <span className="absolute top-1.5 left-1.5 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                          {pageNum}
                        </span>

                        {/* Indicador de página Par / Impar en modo dúplex */}
                        {pageMode === 'facing' && (
                          <span className="absolute bottom-1.5 left-1.5 z-20 bg-black/80 text-zinc-400 font-mono text-[8px] px-1 rounded">
                            {isEven ? (isEs ? 'Par' : 'Even') : isEs ? 'Impar' : 'Odd'}
                          </span>
                        )}

                        {/* Imagen miniatura o indicador de carga en streaming */}
                        {typeof thumb === 'string' && thumb.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={`Página ${pageNum}`}
                            loading="lazy"
                            className="w-full h-full object-contain rounded-md bg-white shadow-inner"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900/90 rounded-md flex flex-col items-center justify-center gap-1.5 text-zinc-500 font-mono">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                            <span className="text-[10px] text-zinc-500 font-bold">{pageNum}</span>
                          </div>
                        )}

                        {/* PUNTO ROJO DE POSICIÓN DE FOLIADO */}
                        {isIncluded && (
                          <div
                            className={`absolute z-30 ${getDotPositionStyle(position, isEven)} transition-all duration-300`}
                          >
                            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                            </span>
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
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                  {isEs
                    ? '002 / CONFIGURACIÓN DEL MOTOR EMPRESARIAL'
                    : '002 / ENTERPRISE ENGINE CONFIGURATION'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 font-sans uppercase tracking-tight">
                  <Sliders className="w-6 h-6 text-emerald-400" />
                  <span>{isEs ? 'PANEL DE CONTROL DE FOLIADO' : 'FOLIO CONTROL PANEL'}</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-semibold">
                  {isEs ? '✓ Motor Empresarial v5.0' : '✓ Enterprise Engine v5.0'}
                </span>
              </div>
            </div>

            {/* GRILLA DE 3 COLUMNAS ESTRUCTURADAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* COLUMNA 1: POSICIÓN Y MODO DE PÁGINA */}
              <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-zinc-800">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>{isEs ? '1. Ubicación y Página' : '1. Location & Page'}</span>
                  </div>

                  {/* Modo de Página: Suelta vs Enfrentadas */}
                  <div className="mb-4">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                      {isEs ? 'Modo de Documento:' : 'Document Mode:'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPageMode('single')}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          pageMode === 'single'
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <Check
                          className={`w-3.5 h-3.5 ${pageMode === 'single' ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {isEs ? 'Página suelta' : 'Single page'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageMode('facing')}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          pageMode === 'facing'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                        title={
                          isEs
                            ? 'Alterna automáticamente márgenes en páginas pares/impares para encuadernación'
                            : 'Mirrors margins on odd/even pages for binding'
                        }
                      >
                        <Check
                          className={`w-3.5 h-3.5 ${pageMode === 'facing' ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {isEs ? 'Enfrentadas (Dúplex)' : 'Facing (Duplex)'}
                      </button>
                    </div>
                  </div>

                  {/* Matriz 3x3 de Posición */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
                        {isEs ? 'Posición del Foliado:' : 'Stamp Position:'}
                      </label>
                      <span className="text-[10px] text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {position.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-black/60 border border-zinc-800 rounded-2xl shadow-inner">
                      {(
                        [
                          'top-left',
                          'top-center',
                          'top-right',
                          'center-left',
                          'center',
                          'center-right',
                          'bottom-left',
                          'bottom-center',
                          'bottom-right',
                        ] as Position9[]
                      ).map((pos) => {
                        const isSelected = position === pos;
                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setPosition(pos)}
                            className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'
                            }`}
                            title={pos.replace('-', ' ')}
                          >
                            <span
                              className={`w-3 h-3 rounded-full transition-transform ${
                                isSelected
                                  ? 'bg-red-600 border-2 border-white scale-110 shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                                  : 'bg-zinc-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Margen */}
                <div className="pt-2 border-t border-zinc-800">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                    {isEs ? 'Margen del Borde:' : 'Margin Distance:'}
                  </label>
                  <select
                    value={margin}
                    onChange={(e) => setMargin(e.target.value as any)}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-zinc-600 font-mono"
                  >
                    <option value="recommended">
                      {isEs ? 'Recomendado (1 cm)' : 'Recommended (1 cm)'}
                    </option>
                    <option value="small">{isEs ? 'Estrecho (0.5 cm)' : 'Narrow (0.5 cm)'}</option>
                    <option value="big">{isEs ? 'Amplio (2 cm)' : 'Wide (2 cm)'}</option>
                  </select>
                </div>
              </div>

              {/* COLUMNA 2: FORMATO EMPRESARIAL Y TIPOGRAFÍA */}
              <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-zinc-800">
                    <FileCheck className="w-4 h-4 text-purple-400" />
                    <span>{isEs ? '2. Formato y Tipografía' : '2. Format & Font'}</span>
                  </div>

                  {/* Formato de Texto */}
                  <div className="mb-4">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                      {isEs ? 'Estructura del Texto:' : 'Text Format Structure:'}
                    </label>
                    <select
                      value={textFormat}
                      onChange={(e) => setTextFormat(e.target.value)}
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white outline-none cursor-pointer focus:border-zinc-600"
                    >
                      <option value="only-number">
                        {isEs ? 'Solo número: 1, 2, 3' : 'Only number: 1, 2, 3'}
                      </option>
                      <option value="page-n-of-p">
                        {isEs ? 'Página {n} de {p}' : 'Page {n} of {p}'}
                      </option>
                      <option value="pag-n-of-p">
                        {isEs ? 'Pág. {n} de {p}' : 'Pág. {n} of {p}'}
                      </option>
                      <option value="folio-n">{isEs ? 'Folio {n}' : 'Folio {n}'}</option>
                      <option value="folio-n-vto">
                        {isEs ? 'Folio {n} y vto. (Notarial)' : 'Folio {n} & vto. (Notarial)'}
                      </option>
                      <option value="bates">
                        {isEs
                          ? 'Foliado Bates Judicial (BATES-000001)'
                          : 'Bates Judicial (BATES-000001)'}
                      </option>
                      <option value="custom">
                        {isEs ? 'Plantilla personalizada...' : 'Custom template...'}
                      </option>
                    </select>

                    {textFormat === 'custom' && (
                      <input
                        type="text"
                        placeholder={
                          isEs ? 'Ej: Exp. 2026 - Folio {n}' : 'Ex: Case 2026 - Page {n}'
                        }
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                        className="w-full mt-2 p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white outline-none focus:border-zinc-500"
                      />
                    )}
                    {textFormat === 'bates' && (
                      <input
                        type="text"
                        placeholder="Prefijo Bates (Ej: EXP-JUDICIAL)"
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                        className="w-full mt-2 p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white outline-none focus:border-zinc-500"
                      />
                    )}
                  </div>

                  {/* Estilo de Numeración */}
                  <div className="mb-4">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">
                      {isEs ? 'Estilo Numérico:' : 'Numbering Style:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNumberStyle('arabic')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          numberStyle === 'arabic'
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        1, 2, 3
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumberStyle('padded')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          numberStyle === 'padded'
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        01, 02
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumberStyle('padded-3')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          numberStyle === 'padded-3'
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                        title="Estándar notarial de 3 dígitos"
                      >
                        001, 002
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumberStyle('padded-6')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          numberStyle === 'padded-6'
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                        title="Estándar Bates judicial de 6 dígitos"
                      >
                        000001
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumberStyle('roman')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          numberStyle === 'roman'
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        I, II, III
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumberStyle('roman-lower')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          numberStyle === 'roman-lower'
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        i, ii, iii
                      </button>
                    </div>
                  </div>

                  {/* Fuente, Tamaño y Color */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                        {isEs ? 'Fuente:' : 'Font:'}
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value as any)}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-zinc-600 font-mono"
                      >
                        <option value="helvetica">Helvetica</option>
                        <option value="times">Times</option>
                        <option value="courier">Courier</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                        {isEs ? 'Tamaño:' : 'Size:'}
                      </label>
                      <select
                        value={fontSizeOption}
                        onChange={(e) => setFontSizeOption(e.target.value as any)}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-zinc-600 font-mono"
                      >
                        <option value="small">9pt</option>
                        <option value="medium">12pt</option>
                        <option value="large">15pt</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                        {isEs ? 'Color:' : 'Color:'}
                      </label>
                      <select
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-zinc-600 font-mono"
                      >
                        <option value="dark">{isEs ? 'Negro' : 'Black'}</option>
                        <option value="red">{isEs ? 'Rojo' : 'Red'}</option>
                        <option value="blue">{isEs ? 'Azul' : 'Blue'}</option>
                        <option value="white">{isEs ? 'Blanco' : 'White'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fondo protector opcional */}
                <div
                  onClick={() => setDrawBackground(!drawBackground)}
                  className="flex items-center gap-2.5 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all font-mono"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      drawBackground ? 'bg-white border-white text-black' : 'border-zinc-700'
                    }`}
                  >
                    {drawBackground && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-zinc-300 font-semibold">
                    {isEs
                      ? 'Fondo protector blanco (Antiobstrucción)'
                      : 'Protective white badge (Anti-clash)'}
                  </span>
                </div>
              </div>

              {/* COLUMNA 3: RANGO, PORTADA Y METADATOS */}
              <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-zinc-800">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '3. Rango y Metadatos' : '3. Range & Metadata'}</span>
                  </div>

                  {/* Omitir Portada */}
                  <div
                    onClick={() => setSkipFirstPage(!skipFirstPage)}
                    className="flex items-center gap-2.5 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all font-mono mb-3"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        skipFirstPage ? 'bg-white border-white text-black' : 'border-zinc-700'
                      }`}
                    >
                      {skipFirstPage && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </div>
                    <span className="text-[11px] text-zinc-300 font-semibold">
                      {isEs
                        ? 'Omitir foliado en 1ª página (Portada)'
                        : 'Skip numbering on page 1 (Cover)'}
                    </span>
                  </div>

                  {/* Número inicial y Rango de Páginas */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between bg-zinc-900/70 p-2 rounded-xl border border-zinc-800 text-xs">
                      <span className="text-zinc-400">
                        {isEs ? 'Número inicial:' : 'First number:'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={firstNumber}
                        onChange={(e) => setFirstNumber(Number(e.target.value) || 1)}
                        className="w-20 p-1 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-xs font-bold text-white outline-none focus:border-zinc-500 font-mono"
                      />
                    </div>

                    <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">{isEs ? 'Desde pág:' : 'From:'}</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages || 1}
                        value={startPage}
                        onChange={(e) => setStartPage(Number(e.target.value) || 1)}
                        className="w-16 p-1 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-white outline-none focus:border-zinc-500 font-mono"
                      />
                      <span className="text-zinc-400">{isEs ? 'hasta:' : 'to:'}</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages || 1}
                        value={endPage}
                        onChange={(e) => setEndPage(Number(e.target.value) || 1)}
                        className="w-16 p-1 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-white outline-none focus:border-zinc-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Prefijo de Archivo y Metadatos */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                        {isEs ? 'Prefijo de Descarga:' : 'Download File Prefix:'}
                      </label>
                      <input
                        type="text"
                        value={filePrefix}
                        onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Foliado"
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white outline-none focus:border-zinc-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                        {isEs ? 'Organización / Notaría / Autor:' : 'Organization / Author:'}
                      </label>
                      <input
                        type="text"
                        value={docAuthor}
                        onChange={(e) => setDocAuthor(e.target.value)}
                        placeholder={
                          isEs ? 'Ej: Notaría / Estudio Jurídico' : 'Ex: Notary / Legal Firm'
                        }
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-zinc-600 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE ACCIÓN DESTACADA FINAL */}
            <div className="pt-4 border-t border-zinc-800 font-sans">
              {isProcessing && (
                <div className="mb-4 space-y-2 font-mono">
                  <div className="flex justify-between text-xs font-bold text-zinc-300">
                    <span className="truncate max-w-[300px] flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      {progressMsg}
                    </span>
                    <span className="text-emerald-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-zinc-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    {isEs
                      ? `Se foliarán ${Math.max(1, endPage - startPage + 1 - (skipFirstPage ? 1 : 0))} de ${totalPages} páginas.`
                      : `${Math.max(1, endPage - startPage + 1 - (skipFirstPage ? 1 : 0))} of ${totalPages} pages will be stamped.`}
                  </span>
                </div>

                <button
                  onClick={executeFoliado}
                  disabled={isProcessing || !file || (isEncrypted && !isUnlocked)}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-sans font-bold text-base transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-black" />
                  )}
                  <span>
                    {isProcessing
                      ? progressMsg || (isEs ? 'Foliando documento...' : 'Processing...')
                      : isEs
                        ? 'Añadir números de página y foliar PDF →'
                        : 'Add page numbers & folio PDF →'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
