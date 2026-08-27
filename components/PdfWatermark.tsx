'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
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
  Image as ImageIcon,
  Type,
  Sliders,
  UploadCloud,
  Lock,
  Unlock,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  WatermarkWorkerMessageIn,
  WatermarkWorkerMessageOut,
  Position9,
  WatermarkType,
} from '@/workers/pdf-watermark.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';

export default function PdfWatermark() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize?: string;
    rawBlob?: Blob;
  } | null>(null);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // Thumbnails y páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);

  // Opciones de Marca de Agua Principales
  const [wmType, setWmType] = useState<WatermarkType>('text');
  const [wmText, setWmText] = useState<string>('CONFIDENCIAL');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Opciones Avanzadas
  const [filePrefix, setFilePrefix] = useState<string>('Documento_SelloAgua');
  const [position, setPosition] = useState<Position9>('center');
  const [rotation, setRotation] = useState<number>(-45);
  const [opacity, setOpacity] = useState<number>(30); // 10% a 100%
  const [fontSize, setFontSize] = useState<number>(42);
  const [fontColor, setFontColor] = useState<string>('red');

  // Selección de Páginas
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);

  // Altura sincronizada para igualar panel de vista previa al panel de control
  const [previewHeight, setPreviewHeight] = useState<number>(0);

  const loadThumbnails = useCallback(
    async (selectedFile: File, pass?: string) => {
      setIsLoadingThumbs(true);
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, '') + '_SelloAgua');

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const buffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: buffer, password: pass });
        const pdfDoc = await loadingTask.promise;

        setTotalPages(pdfDoc.numPages);
        setCustomPageRange(`1-${pdfDoc.numPages}`);

        const thumbs: string[] = [];
        const countToRender = Math.min(pdfDoc.numPages, 32);

        for (let i = 1; i <= countToRender; i++) {
          if (i % 4 === 0) await new Promise((r) => setTimeout(r, 5));
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport, canvas } as any).promise;
            thumbs.push(canvas.toDataURL());
          }
        }

        for (let i = countToRender + 1; i <= pdfDoc.numPages; i++) {
          thumbs.push('');
        }

        setPageThumbnails(thumbs);
        setIsEncrypted(false);
        setIsUnlocked(true);
        toast.success(
          isEs
            ? `${pdfDoc.numPages} páginas listas para sello de agua`
            : `${pdfDoc.numPages} pages ready for watermark`,
        );
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
      } finally {
        setIsLoadingThumbs(false);
      }
    },
    [isEs],
  );

  // Sincronización con el store global
  useEffect(() => {
    if (globalFile && file !== globalFile) {
      setFile(globalFile);
      setPageThumbnails([]);
      setCompletedResult(null);
      loadThumbnails(globalFile);
    }
    if (!globalFile && file) {
      setFile(null);
      setPageThumbnails([]);
      setCompletedResult(null);
    }
  }, [globalFile, file, loadThumbnails]);

  // Carga inicial de miniaturas cuando hay un archivo listo
  useEffect(() => {
    if (file && pageThumbnails.length === 0 && !isEncrypted) {
      loadThumbnails(file);
    }
  }, [file, pageThumbnails.length, isEncrypted, loadThumbnails]);

  const topContainerRef = useRef<HTMLDivElement>(null);

  // Scroll automático hacia el inicio de la herramienta (debajo del Navbar global)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setCompletedResult(null);
      setFile(selected);
      setGlobalFile(selected);
      setIsEncrypted(false);
      setIsUnlocked(false);
      setPasswordInput('');
      setUnlockedPassword(undefined);
      await loadThumbnails(selected);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (completedResult?.downloadUrl) {
      URL.revokeObjectURL(completedResult.downloadUrl);
    }
    setCompletedResult(null);
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setUnlockedPassword(undefined);
  };

  // Helpers para el color del overlay de previsualización
  const getOverlayColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      dark: '#1a1a1a',
      blue: '#3b82f6',
      emerald: '#10b981',
      white: '#f5f5f5',
    };
    return colorMap[color] || '#ef4444';
  };

  const getOverlayTextColorClass = (color: string): string => {
    const classMap: Record<string, string> = {
      red: 'text-red-500 border-red-500',
      dark: 'text-gray-900 border-gray-800',
      blue: 'text-blue-400 border-blue-400',
      emerald: 'text-emerald-400 border-emerald-400',
      white: 'text-white border-white',
    };
    return classMap[color] || 'text-red-500 border-red-500';
  };

  const getPositionClasses = (pos: Position9): string => {
    const posMap: Record<Position9, string> = {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      center: 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-left': 'items-end justify-start',
      'bottom-center': 'items-end justify-center',
      'bottom-right': 'items-end justify-end',
    };
    return posMap[pos] || 'items-center justify-center';
  };

  // Helper para verificar qué páginas deben recibir el sello de agua
  const parseSelectedPages = (): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) selected.add(i);
      return selected;
    }

    const parts = customPageRange.split(',');
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

    return selected;
  };

  // EJECUCIÓN CON WEB WORKER
  const executeWatermark = async () => {
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

    if (wmType === 'text' && !wmText.trim()) {
      toast.error(isEs ? 'Ingresa el texto para la marca de agua.' : 'Enter watermark text.');
      return;
    }

    if (wmType === 'image' && !imageFile) {
      toast.error(isEs ? 'Selecciona una imagen de logotipo.' : 'Select a logo image.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando Web Worker acelerado...' : 'Starting Web Worker...');

    try {
      const buffer = await file.arrayBuffer();
      const bufferCopy = buffer.slice(0);

      let imageBuffer: ArrayBuffer | undefined = undefined;
      let imageMime: string | undefined = undefined;

      if (wmType === 'image' && imageFile) {
        const imgArray = await imageFile.arrayBuffer();
        imageBuffer = imgArray.slice(0);
        imageMime = imageFile.type;
      }

      const worker = new Worker(new URL('../workers/pdf-watermark.worker.ts', import.meta.url), {
        type: 'module',
      });

      const payload: WatermarkWorkerMessageIn = {
        action: 'watermark',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_SelloAgua',
          renumberPages: false,
          wmType,
          wmText,
          imageBuffer,
          imageMime,
          position,
          rotation,
          opacity,
          fontSize,
          fontColor,
          pageScope,
          customPageRange,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const transferables: Transferable[] = [bufferCopy];
      if (imageBuffer) transferables.push(imageBuffer);

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
          worker.onmessage = (e: MessageEvent<WatermarkWorkerMessageOut>) => {
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

          worker.postMessage(payload, transferables);
        },
      );

      worker.terminate();

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix.trim() || 'Documento_SelloAgua'}.pdf`;
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
          ? '¡Sello de agua estampado! Tu archivo está listo.'
          : 'Watermark applied! Your file is ready.',
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message || (isEs ? 'Error al aplicar marca de agua.' : 'Failed to apply watermark.'),
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  // Sincronizar altura del panel de vista previa con la del panel de control
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.target.getBoundingClientRect().height;
        if (h > 0) {
          setPreviewHeight(h);
        }
      }
    });
    observer.observe(controlPanelRef.current);
    // Medir inmediatamente también
    setPreviewHeight(controlPanelRef.current.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [file]); // Re-ejecutar cuando cambia el archivo (el panel aparece/desaparece)

  const handleStartOver = () => {
    if (completedResult?.downloadUrl) {
      URL.revokeObjectURL(completedResult.downloadUrl);
    }
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
    if (imageInputRef.current) imageInputRef.current.value = '';
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
      <input
        type="file"
        accept="image/png, image/jpeg"
        className="hidden"
        ref={imageInputRef}
        onChange={handleImageChange}
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
              {isEs ? '003 / SELLO DE AGUA Y MARCAS DE PROPIEDAD' : '003 / WATERMARK & BRANDING'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ShieldAlert className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'PONER SELLO DE AGUA EN DOCUMENTOS PDF' : 'ADD WATERMARK TO PDF DOCUMENTS'}
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
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all"
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
          {/* BANNER DE RESULTADO Y MÉTRICAS DE MARCA DE AGUA */}
          <div className="bg-[#09090b] border border-white/20 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA MARCA DE AGUA' : 'WATERMARK RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs ? '¡Marca de agua insertada con éxito!' : 'Watermark added successfully!'}
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
                  {isEs ? 'Páginas Marcadas' : 'Stamped Pages'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {selectedPagesSet.size} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Total del Documento' : 'Document Total'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
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
            onReset={handleStartOver}
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
            {isEs ? 'PONER SELLO DE AGUA EN DOCUMENTOS PDF' : 'ADD WATERMARK TO PDF DOCUMENTS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? "Estampa logotipos, sellos de 'Confidencial' o marcas de propiedad 100% de forma local."
              : "Stamp logos or 'Confidential' watermarks across the document 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS EN CUADRÍCULA 4x4 */}
          <div
            style={previewHeight > 0 ? { height: `${previewHeight}px` } : undefined}
            className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold font-mono">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / VISTA PREVIA DEL SELLO (${totalPages} PÁGINAS)`
                    : `001 / WATERMARK PREVIEW (${totalPages} PAGES)`}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
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

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">
                  {isEs ? 'Generando vista previa de miniaturas...' : 'Generating page preview...'}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {(pageThumbnails.length > 0
                    ? pageThumbnails
                    : Array.from({ length: totalPages || 8 })
                  ).map((thumb, idx) => {
                    const pageNum = idx + 1;
                    const isStamped = selectedPagesSet.has(pageNum);

                    return (
                      <div
                        key={idx}
                        className={`relative group bg-zinc-950 border ${isStamped ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 opacity-30'} rounded-xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                      >
                        <span className="absolute top-2 left-2 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                          {pageNum}
                        </span>

                        {typeof thumb === 'string' && thumb.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={`Página ${pageNum}`}
                            className="w-full h-full object-contain rounded-md bg-white shadow-inner"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-zinc-600 text-xs font-mono font-bold">
                            {pageNum}
                          </div>
                        )}

                        {/* STAMP OVERLAY EN TIEMPO REAL */}
                        <div
                          className={`absolute inset-0 z-30 pointer-events-none overflow-hidden p-1 flex ${getPositionClasses(position)}`}
                        >
                          {wmType === 'text' && (
                            <span
                              style={{
                                transform: `rotate(${rotation}deg)`,
                                opacity: opacity / 100,
                                fontSize: `${Math.max(Math.min(fontSize * 0.28, 22), 6)}px`,
                                color: getOverlayColor(fontColor),
                              }}
                              className={`font-black tracking-widest uppercase px-1 py-0.5 rounded select-none font-mono text-center break-all leading-tight ${getOverlayTextColorClass(fontColor)}`}
                            >
                              {wmText || 'CONFIDENCIAL'}
                            </span>
                          )}
                          {wmType === 'image' && imageFile && (
                            <div
                              style={{
                                transform: `rotate(${rotation}deg)`,
                                opacity: opacity / 100,
                              }}
                              className="flex items-center justify-center"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={URL.createObjectURL(imageFile)}
                                alt="Watermark"
                                style={{ maxWidth: '70%', maxHeight: '70%' }}
                                className="object-contain"
                              />
                            </div>
                          )}
                          {wmType === 'image' && !imageFile && (
                            <div
                              style={{ opacity: 0.35 }}
                              className="flex items-center justify-center text-zinc-400 text-[8px] font-mono"
                            >
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div
            ref={controlPanelRef}
            className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6"
          >
            <div>
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-5 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* 1. TIPO DE SELLO (TEXTO O IMAGEN) */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                  {isEs ? 'Tipo de Sello' : 'Stamp Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWmType('text')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${wmType === 'text' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Type className="w-4 h-4" /> {isEs ? 'Texto' : 'Text'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWmType('image')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${wmType === 'image' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> {isEs ? 'Imagen / Logo' : 'Image / Logo'}
                  </button>
                </div>
              </div>

              {wmType === 'text' ? (
                <div className="mb-5 space-y-3 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                    {isEs ? 'Texto del Sello:' : 'Watermark text:'}
                  </label>
                  <input
                    type="text"
                    value={wmText}
                    onChange={(e) => setWmText(e.target.value)}
                    placeholder="CONFIDENCIAL"
                    className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['CONFIDENCIAL', 'BORRADOR', 'COPIA', 'RESERVADO'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWmText(preset)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-5 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">
                    {isEs ? 'Seleccionar Logotipo:' : 'Select Logo Image:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer font-mono"
                  >
                    <ImageIcon className="w-4 h-4 text-zinc-400" />{' '}
                    {imageFile
                      ? imageFile.name
                      : isEs
                        ? 'Cargar imagen PNG/JPG'
                        : 'Upload PNG/JPG image'}
                  </button>
                </div>
              )}

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-4 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? 'Opciones Avanzadas PDFBLACK' : 'PDFBLACK Advanced Options'}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEs ? 'Prefijo del Archivo Resultante:' : 'Output File Prefix:'}
                  </label>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_SelloAgua"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                {/* A. MATRIZ 3x3 DE POSICIÓN */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      {isEs ? 'Posición:' : 'Position:'}
                    </label>
                    <span className="text-[10px] text-zinc-300 font-bold">
                      {position.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 border border-white/10 rounded-xl shadow-inner">
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
                          className={`h-10 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full transition-transform ${isSelected ? 'bg-red-600 scale-110' : 'bg-zinc-600'}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* B. ROTACIÓN Y OPACIDAD */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        {isEs ? 'Ángulo' : 'Angle'}
                      </label>
                      <span className="text-xs font-bold text-white">{rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min={-90}
                      max={90}
                      step={15}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        {isEs ? 'Opacidad' : 'Opacity'}
                      </label>
                      <span className="text-xs font-bold text-white">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* C. TAMAÑO Y COLOR DE TEXTO */}
                {wmType === 'text' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5">
                        {isEs ? 'Tamaño Letra:' : 'Font Size:'}
                      </label>
                      <input
                        type="number"
                        min={12}
                        max={120}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 text-center font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5">
                        {isEs ? 'Color Texto:' : 'Text Color:'}
                      </label>
                      <select
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30 font-mono"
                      >
                        <option value="red">{isEs ? 'Rojo' : 'Red'}</option>
                        <option value="dark">{isEs ? 'Negro / Oscuro' : 'Dark / Black'}</option>
                        <option value="blue">{isEs ? 'Azul' : 'Blue'}</option>
                        <option value="emerald">{isEs ? 'Verde Esmeralda' : 'Emerald'}</option>
                        <option value="white">{isEs ? 'Blanco' : 'White'}</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* D. SELECCIÓN DE PÁGINAS OBJETIVO */}
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">
                    {isEs ? 'Páginas a estampar:' : 'Pages to stamp:'}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={pageScope === 'all'}
                        onChange={() => setPageScope('all')}
                        className="accent-white"
                      />
                      <span>{isEs ? 'Todo el documento (Todas)' : 'All pages'}</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={pageScope === 'custom'}
                        onChange={() => setPageScope('custom')}
                        className="accent-white"
                      />
                      <span>
                        {isEs
                          ? 'Páginas específicas (Ej: 1, 3-5, 8)'
                          : 'Specific pages (e.g. 1, 3-5, 8)'}
                      </span>
                    </label>
                  </div>

                  {pageScope === 'custom' && (
                    <input
                      type="text"
                      value={customPageRange}
                      onChange={(e) => setCustomPageRange(e.target.value)}
                      placeholder="1, 3-5, 8"
                      className="w-full mt-2.5 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:border-white/50 font-mono"
                    />
                  )}
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">
                    {isEs ? 'METADATOS DEL PDF SELLADO' : 'WATERMARKED PDF METADATA'}
                  </label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isEs ? 'Título:' : 'Title:'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isEs ? 'Ej: Documento_Sellado_2026' : 'Ex: Watermarked_Document_2026'
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
                        isEs ? 'Ej: Marca de agua confidencial' : 'Ex: Confidential watermark'
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
                onClick={executeWatermark}
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
                        ? 'Poner Sello de Agua →'
                        : 'Add Watermark →'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
