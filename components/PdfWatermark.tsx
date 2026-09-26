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
  Grid,
  Repeat,
  Stamp,
  Layers,
  Palette,
  Eye,
  X as XIcon,
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
  WatermarkPattern,
} from '@/workers/pdf-watermark.worker';
import FoliarSuccessView from '@/components/FoliarSuccessView';

export default function PdfWatermark() {
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

  // Opciones de Marca de Agua Principales
  const [wmType, setWmType] = useState<WatermarkType>('text');
  const [wmPattern, setWmPattern] = useState<WatermarkPattern>('single');
  const [wmText, setWmText] = useState<string>('CONFIDENCIAL');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState<number>(35); // 10% a 100%

  // Opciones Avanzadas y Tipografía Empresarial
  const [filePrefix, setFilePrefix] = useState<string>('Documento_SelloAgua');
  const [position, setPosition] = useState<Position9>('center');
  const [rotation, setRotation] = useState<number>(-45);
  const [opacity, setOpacity] = useState<number>(25); // 5% a 100%
  const [fontSize, setFontSize] = useState<number>(44);
  const [fontColor, setFontColor] = useState<string>('red');
  const [fontFamily, setFontFamily] = useState<'helvetica' | 'times' | 'courier'>('helvetica');

  // Alcance y Selección de Páginas
  const [pageScope, setPageScope] = useState<'all' | 'custom' | 'odds' | 'evens'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  // METADATOS EMPRESARIALES
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const cancelRenderRef = useRef<boolean>(false);

  // Cancelar renders al desmontar el componente
  useEffect(() => {
    return () => {
      cancelRenderRef.current = true;
    };
  }, []);

  // Scroll automático suave hacia el inicio al terminar
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
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, '') + '_SelloAgua');

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

        // Array inicial pre-rellenado para el total de páginas
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
            ? `${count} páginas listas para estampado de marcas de agua`
            : `${count} pages ready for watermark stamping`,
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const img = e.target.files[0];
      if (img.type.startsWith('image/')) {
        setImageFile(img);
        toast.success(
          isEs ? `Imagen «${img.name}» cargada correctamente` : `Image "${img.name}" loaded`,
        );
      } else {
        toast.error(
          isEs
            ? 'Selecciona un archivo de imagen válido (PNG, JPG)'
            : 'Select a valid image (PNG, JPG)',
        );
      }
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

  // Helpers para el color del overlay de previsualización
  const getOverlayColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      dark: '#1a1a1a',
      blue: '#3b82f6',
      emerald: '#10b981',
      amber: '#f59e0b',
      white: '#f5f5f5',
    };
    return colorMap[color] || '#ef4444';
  };

  const getOverlayTextColorClass = (color: string): string => {
    const classMap: Record<string, string> = {
      red: 'text-red-500 border-red-500',
      dark: 'text-zinc-900 border-zinc-800',
      blue: 'text-blue-400 border-blue-400',
      emerald: 'text-emerald-400 border-emerald-400',
      amber: 'text-amber-400 border-amber-400',
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

  // EJECUCIÓN CON WEB WORKER EMPRESARIAL
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
    setProgressMsg(
      isEs ? 'Iniciando motor empresarial en Web Worker...' : 'Starting enterprise Web Worker...',
    );

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
          wmPattern,
          wmText,
          imageBuffer,
          imageMime,
          imageScale: imageScale / 100,
          position,
          rotation,
          opacity,
          fontSize,
          fontColor,
          fontFamily,
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
      const sizeFormatted = formatFileSize(blob.size);

      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeFormatted,
        rawBlob: blob,
      });

      setProgressPercent(100);
      toast.success(
        isEs
          ? '¡Marca de agua estampada con éxito! Tu archivo está listo.'
          : 'Watermark applied successfully! Your file is ready.',
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
        accept="image/png,image/jpeg,image/jpg"
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
                ? wmType === 'text'
                  ? wmPattern === 'tile'
                    ? 'Mosaico de Seguridad'
                    : 'Sello Textual'
                  : 'Sello Gráfico / Logo'
                : wmType === 'text'
                  ? wmPattern === 'tile'
                    ? 'Security Tile Mosaic'
                    : 'Text Stamp'
                  : 'Graphic Stamp / Logo'
            }
            toolName={isEs ? 'Poner Sello de Agua' : 'Add Watermark'}
            badgeText={isEs ? 'Sello de Agua Aplicado' : 'Watermark Applied'}
            successTitle={
              isEs ? '¡Documento Sellado con Éxito!' : 'Document Watermarked Successfully!'
            }
            downloadButtonText={isEs ? 'Descargar PDF con Sello' : 'Download Watermarked PDF'}
            shareSubject={isEs ? 'documento con sello de agua' : 'watermarked document'}
            fallbackUrl="https://pdf-black.com/editar/marca-agua"
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
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor Empresarial de Marcas de Agua v5.0 • 100% Local'
                : 'Enterprise Watermark Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? 'PONER SELLO DE AGUA EN DOCUMENTOS PDF' : 'ADD WATERMARK TO PDF DOCUMENTS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Estampa marcas de confidencialidad, borrador, logotipos o patrones en mosaico repetido con control milimétrico, compensación de giro y privacidad absoluta en RAM.'
              : 'Stamp confidentiality badges, draft stamps, logos, or repeating security mosaic patterns with millimeter control, rotation compensation, and zero-knowledge in-RAM privacy.'}
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
                {isEs ? '✓ Sellos Legales & Logotipos' : '✓ Legal Stamps & Logos'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Sellos prediseñados (Confidencial, Borrador, Copia) e inserción de logos PNG con transparencia.'
                  : 'Prebuilt stamps (Confidential, Draft, Copy) and transparent PNG logo insertion.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Patrón en Mosaico Anti-Fugas' : '✓ Anti-Leak Repeating Mosaic'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Protege documentos contra capturas de pantalla y fotocopias cubriendo la página entera en diagonal.'
                  : 'Protect documents against screenshots and photocopying with diagonal full-page coverage.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Estricta en RAM' : '✓ Strict In-RAM Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Procesamiento 100% en Web Workers locales sin subir archivos confidenciales a servidores.'
                  : '100% local Web Worker execution without uploading sensitive files to cloud servers.'}
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
                    ? `001 / VISTA PREVIA DEL SELLO (${totalPages} PÁGINAS)`
                    : `001 / WATERMARK PREVIEW (${totalPages} PAGES)`}
                </span>
                {wmPattern === 'tile' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                    {isEs ? 'Modo Mosaico Repetido' : 'Repeating Mosaic Mode'}
                  </span>
                )}
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
                    ? 'Previsualización en tiempo real con opacidad'
                    : 'Live real-time watermark overlay'}
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
                    const isStamped = selectedPagesSet.has(pageNum);

                    return (
                      <div
                        key={idx}
                        className={`relative group bg-zinc-950 border ${
                          isStamped
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

                        {/* STAMP OVERLAY EN TIEMPO REAL */}
                        {isStamped && (
                          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden p-1 flex">
                            {wmPattern === 'tile' ? (
                              <div
                                style={{ opacity: opacity / 100 }}
                                className="w-full h-full grid grid-cols-2 grid-rows-3 gap-1 place-items-center"
                              >
                                {Array.from({ length: 6 }).map((_, tileIdx) => (
                                  <div
                                    key={tileIdx}
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                    className="flex items-center justify-center"
                                  >
                                    {wmType === 'text' ? (
                                      <span
                                        style={{
                                          color: getOverlayColor(fontColor),
                                          fontSize: '8px',
                                        }}
                                        className="font-black tracking-wider uppercase select-none font-mono text-center truncate max-w-[50px] leading-tight"
                                      >
                                        {wmText || 'CONFIDENCIAL'}
                                      </span>
                                    ) : imageFile ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={URL.createObjectURL(imageFile)}
                                        alt="Logo"
                                        className="w-5 h-5 object-contain"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-zinc-400" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`w-full h-full flex ${getPositionClasses(position)}`}>
                                {wmType === 'text' && (
                                  <span
                                    style={{
                                      transform: `rotate(${rotation}deg)`,
                                      opacity: opacity / 100,
                                      fontSize: `${Math.max(Math.min(fontSize * 0.28, 22), 6)}px`,
                                      color: getOverlayColor(fontColor),
                                    }}
                                    className={`font-black tracking-widest uppercase px-1 py-0.5 rounded select-none font-mono text-center break-all leading-tight ${getOverlayTextColorClass(
                                      fontColor,
                                    )}`}
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
                                      style={{
                                        maxWidth: `${Math.min(imageScale, 80)}%`,
                                        maxHeight: `${Math.min(imageScale, 80)}%`,
                                      }}
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
                            )}
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
                  {isEs
                    ? '002 / CONFIGURACIÓN DEL MOTOR EMPRESARIAL'
                    : '002 / ENTERPRISE ENGINE CONFIG'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                  <Sliders className="w-5 h-5 text-white" />
                  <span>
                    {isEs ? 'PANEL DE CONTROL DE MARCAS DE AGUA' : 'WATERMARK CONTROL PANEL'}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                  ✓ {isEs ? 'Motor Empresarial v5.0' : 'Enterprise Engine v5.0'}
                </span>
              </div>
            </div>

            {/* GRID DE 3 COLUMNAS TEMÁTICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* COLUMNA 1: TIPO DE SELLO, MODO Y CONTENIDO */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Stamp className="w-4 h-4 text-white" />
                  <span>{isEs ? '1. Tipo y Formato del Sello' : '1. Stamp Type & Content'}</span>
                </div>

                {/* Tipo de Sello (Texto vs Imagen) */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                    {isEs ? 'Modalidad del Sello:' : 'Stamp Mode:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWmType('text')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        wmType === 'text'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Type className="w-4 h-4" /> {isEs ? 'Texto' : 'Text'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWmType('image')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        wmType === 'image'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" /> {isEs ? 'Logo / Imagen' : 'Logo / Image'}
                    </button>
                  </div>
                </div>

                {/* Patrón: Sello Único vs Mosaico Repetido */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                    {isEs ? 'Patrón de Cobertura:' : 'Coverage Pattern:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWmPattern('single')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        wmPattern === 'single'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Stamp className="w-4 h-4" /> {isEs ? 'Sello Único' : 'Single Stamp'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWmPattern('tile')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        wmPattern === 'tile'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Repeat className="w-4 h-4" /> {isEs ? 'Mosaico Repetido' : 'Tiled Mosaic'}
                    </button>
                  </div>
                </div>

                {/* Input de texto o carga de logo */}
                {wmType === 'text' ? (
                  <div className="space-y-3">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      {isEs ? 'Texto de la Marca de Agua:' : 'Watermark Text:'}
                    </label>
                    <input
                      type="text"
                      value={wmText}
                      onChange={(e) => setWmText(e.target.value)}
                      placeholder="CONFIDENCIAL"
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'CONFIDENCIAL',
                        'BORRADOR',
                        'COPIA',
                        'RESERVADO',
                        'USO INTERNO',
                        'NO COPIAR',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWmText(preset)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      {isEs ? 'Archivo de Logotipo (PNG / JPG):' : 'Logo File (PNG / JPG):'}
                    </label>
                    {imageFile ? (
                      <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs text-white truncate font-bold">
                            {imageFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-colors"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full p-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        <span>{isEs ? 'Cargar Logotipo PNG / JPG' : 'Upload PNG / JPG Logo'}</span>
                      </button>
                    )}

                    {imageFile && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-zinc-400 uppercase">
                            {isEs ? 'Escala del Logo' : 'Logo Scale'}
                          </span>
                          <span className="text-xs font-bold text-white">{imageScale}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          value={imageScale}
                          onChange={(e) => setImageScale(Number(e.target.value))}
                          className="w-full accent-white cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* COLUMNA 2: POSICIÓN, ÁNGULO, OPACIDAD Y ESTILO */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Palette className="w-4 h-4 text-white" />
                  <span>
                    {isEs ? '2. Posición, Ángulo & Estilo' : '2. Position, Angle & Style'}
                  </span>
                </div>

                {/* Matriz 3x3 de Posición (activa solo en sello único) */}
                {wmPattern === 'single' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                        {isEs ? 'Posición (Matriz 3x3):' : 'Position (3x3 Grid):'}
                      </label>
                      <span className="text-[10px] text-zinc-300 font-bold">
                        {position.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-inner max-w-[200px] mx-auto">
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
                            className={`h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full transition-transform ${
                                isSelected ? 'bg-red-600 scale-110' : 'bg-zinc-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                    {isEs
                      ? '✓ En modo mosaico el sello se repite automáticamente por toda la superficie de cada página.'
                      : '✓ Tiled mode repeats the watermark across the entire page surface automatically.'}
                  </div>
                )}

                {/* Ángulo y Opacidad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">
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
                    <div className="flex gap-1 mt-1">
                      {[-45, 0, 90].map((ang) => (
                        <button
                          key={ang}
                          type="button"
                          onClick={() => setRotation(ang)}
                          className="flex-1 py-0.5 text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
                        >
                          {ang}°
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">
                        {isEs ? 'Opacidad' : 'Opacity'}
                      </label>
                      <span className="text-xs font-bold text-white">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                    <div className="flex gap-1 mt-1">
                      {[15, 30, 60].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setOpacity(op)}
                          className="flex-1 py-0.5 text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
                        >
                          {op}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tipografía, Tamaño y Color (para modo texto) */}
                {wmType === 'text' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                        {isEs ? 'Fuente:' : 'Font:'}
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e: any) => setFontFamily(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white font-mono"
                      >
                        <option value="helvetica">Helvetica</option>
                        <option value="times">Times</option>
                        <option value="courier">Courier</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                        {isEs ? 'Tamaño:' : 'Size:'}
                      </label>
                      <input
                        type="number"
                        min={12}
                        max={120}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white text-center font-mono shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                        {isEs ? 'Color:' : 'Color:'}
                      </label>
                      <select
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white font-mono"
                      >
                        <option value="red">{isEs ? 'Rojo' : 'Red'}</option>
                        <option value="dark">{isEs ? 'Negro' : 'Dark'}</option>
                        <option value="blue">{isEs ? 'Azul' : 'Blue'}</option>
                        <option value="emerald">{isEs ? 'Verde' : 'Green'}</option>
                        <option value="amber">{isEs ? 'Dorado' : 'Gold'}</option>
                        <option value="white">{isEs ? 'Blanco' : 'White'}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMNA 3: ALCANCE, METADATOS Y EJECUCIÓN */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Layers className="w-4 h-4 text-white" />
                  <span>
                    {isEs ? '3. Alcance, Metadatos & Aplicar' : '3. Scope, Metadata & Apply'}
                  </span>
                </div>

                {/* Alcance de Páginas */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">
                    {isEs ? 'Páginas a estampar:' : 'Pages to stamp:'}
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

                {/* Prefijo de Archivo y Metadatos */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      {isEs ? 'Prefijo de archivo:' : 'File prefix:'}
                    </label>
                    <input
                      type="text"
                      value={filePrefix}
                      onChange={(e) => setFilePrefix(e.target.value)}
                      placeholder="Documento_SelloAgua"
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
                        placeholder="Documento_Sellado"
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
                        placeholder="Empresa S.A."
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
                    onClick={executeWatermark}
                    disabled={isProcessing || !file || (isEncrypted && !isUnlocked)}
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-100 py-3.5 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-black" />
                    )}
                    <span>
                      {isProcessing
                        ? progressMsg
                        : !file
                          ? isEs
                            ? 'Selecciona un archivo PDF'
                            : 'Select a PDF file'
                          : isEs
                            ? 'Estampar Sello de Agua →'
                            : 'Apply Watermark Stamp →'}
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
