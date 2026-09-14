'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScanText,
  Loader2,
  Settings2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  FileText,
  Trash2,
  Plus,
  LayoutGrid,
  CheckCircle2,
  Copy,
  Check,
  FileSearch,
  Globe,
  Layers,
  Contrast,
  Eye,
  FileCode,
  Zap,
  RotateCw,
  Lightbulb,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  User,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Sliders,
  Compass,
  FileCheck,
  Cpu,
  FileDown,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { OcrWorkerOptions, OcrWorkerResult } from '@/workers/pdf-ocr.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import { createDocxFromOcrText } from '@/utils/ocr-docx-exporter';

// ── Language map ──
const LANG_LABELS: Record<string, { es: string; en: string }> = {
  spa: { es: 'Español', en: 'Spanish' },
  eng: { es: 'Inglés', en: 'English' },
  fra: { es: 'Francés', en: 'French' },
  deu: { es: 'Alemán', en: 'German' },
  por: { es: 'Portugués', en: 'Portuguese' },
  ita: { es: 'Italiano', en: 'Italian' },
  chi_sim: { es: 'Chino Simplificado', en: 'Chinese (Simplified)' },
  jpn: { es: 'Japonés', en: 'Japanese' },
  ara: { es: 'Árabe', en: 'Arabic' },
  rus: { es: 'Ruso', en: 'Russian' },
};

export default function PdfOcr() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((s) => s.globalFile);
  const setGlobalFile = useFileStore((s) => s.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [totalPages, setTotalPages] = useState(0);
  const [miniThumbnails, setMiniThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [processedPages, setProcessedPages] = useState<Set<number>>(new Set());
  const [activePageInOcr, setActivePageInOcr] = useState<number | null>(null);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);

  // Password
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Options & Enterprise settings
  const [ocrEngine, setOcrEngine] = useState<'tesseract' | 'paddleocr'>('tesseract');
  const [ocrLang, setOcrLang] = useState('spa');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'docx' | 'txt' | 'json'>('pdf');
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState('1');
  const [enhanceContrast, setEnhanceContrast] = useState(false);
  const [autoDeskew, setAutoDeskew] = useState(true);
  const [numericMode, setNumericMode] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const [zoomMode, setZoomMode] = useState<'fit-width' | 'fit-page' | 'custom'>('fit-width');
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [viewerHighContrast, setViewerHighContrast] = useState<boolean>(true);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(1.414);

  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize?: string;
    outputFormat: 'pdf' | 'docx' | 'txt' | 'json';
    rawBlob?: Blob;
    processedPagesCount?: number;
    ocrLanguageName?: string;
    stats?: {
      totalPages: number;
      totalWords: number;
      avgConfidence: number;
      deskewedCount: number;
      processingTimeMs: number;
      ocrEngine?: string;
    };
  } | null>(null);

  // Metadata
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');

  // Drag & Drop y Heurística de Detección de Texto
  const [isDropzoneDragging, setIsDropzoneDragging] = useState(false);
  const [hasNativeText, setHasNativeText] = useState(false);
  const [avgNativeChars, setAvgNativeChars] = useState(0);
  const [dismissedNativeTextWarning, setDismissedNativeTextWarning] = useState(false);

  const [currentViewPage, setCurrentViewPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [viewerHiResImage, setViewerHiResImage] = useState<string | null>(null);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const pageCacheRef = useRef<Map<number, string>>(new Map());
  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Scroll automático suave e inmediato hacia el inicio de la herramienta
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

  useEffect(() => {
    if (globalFile && !file) setFile(globalFile);
  }, [globalFile, file]);

  // ── Cargar información del documento y generar miniaturas en background ──
  useEffect(() => {
    if (!file) {
      setMiniThumbnails([]);
      setTotalPages(0);
      setExtractedText('');
      setNeedsPassword(false);
      setProcessedPages(new Set());
      setViewerHiResImage(null);
      pageCacheRef.current.clear();
      return;
    }
    let isMounted = true;
    setIsLoadingThumbs(true);
    setNeedsPassword(false);
    pageCacheRef.current.clear();
    setViewerHiResImage(null);
    setMiniThumbnails([]);

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const buffer = await file.arrayBuffer();
        const loadParams: Record<string, unknown> = {
          data: buffer,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
          wasmUrl: '/pdfjs/wasm/',
          stopAtErrors: false,
        };
        if (pdfPassword) loadParams.password = pdfPassword;
        const pdfDoc = await pdfjsLib.getDocument(loadParams).promise;
        if (!isMounted) return;
        const n = pdfDoc.numPages;
        setTotalPages(n);
        setCurrentViewPage(1);
        setPageInput('1');
        setCustomPageRange(`1-${n}`);

        // Heurística de detección documental: Verificar si el PDF ya tiene capa de texto digital nativa
        try {
          const sampleCount = Math.min(3, n);
          let totalChars = 0;
          for (let pi = 1; pi <= sampleCount; pi++) {
            const page = await pdfDoc.getPage(pi);
            const textContent = await page.getTextContent();
            const pageChars = textContent.items
              .map((item: any) => item.str || '')
              .join(' ')
              .trim().length;
            totalChars += pageChars;
          }
          const avg = totalChars / sampleCount;
          if (avg > 50) {
            setHasNativeText(true);
            setAvgNativeChars(Math.round(avg));
          } else {
            setHasNativeText(false);
          }
        } catch {
          // Ignorar fallback si falla el escaneo superficial
        }

        setIsLoadingThumbs(false);

        // Generar miniaturas de la tira inferior en background para las primeras 20 páginas
        (async () => {
          const thumbs: { pageNum: number; dataUrl: string }[] = [];
          const maxThumbs = Math.min(n, 20);
          for (let p = 1; p <= maxThumbs; p++) {
            if (!isMounted) return;
            try {
              const pg = await pdfDoc.getPage(p);
              const vp = pg.getViewport({ scale: 0.22 });
              const cv = document.createElement('canvas');
              cv.width = vp.width;
              cv.height = vp.height;
              const ctx = cv.getContext('2d', { alpha: false });
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, cv.width, cv.height);
                await pg.render({ canvasContext: ctx, viewport: vp, canvas: cv } as any).promise;
                thumbs.push({ pageNum: p, dataUrl: cv.toDataURL('image/jpeg', 0.85) });
                if (isMounted) setMiniThumbnails([...thumbs]);
              }
            } catch {
              /* ignore thumbnail render errors */
            }
          }
        })();
      } catch (err: any) {
        if (isMounted) {
          if (
            err?.name === 'PasswordException' ||
            err?.message?.toLowerCase().includes('password')
          ) {
            setNeedsPassword(true);
          } else {
            toast.error(isEs ? 'Error al cargar el PDF.' : 'Error loading PDF.');
          }
          setIsLoadingThumbs(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [file, pdfPassword, isEs]);

  // Visor HD de la página activa con caché instantánea y cMaps
  useEffect(() => {
    if (!file || totalPages === 0 || currentViewPage < 1 || needsPassword) {
      setViewerHiResImage(null);
      return;
    }

    setPageInput(currentViewPage.toString());

    const cached = pageCacheRef.current.get(currentViewPage);
    if (cached) {
      setViewerHiResImage(cached);
      return;
    }

    let isMounted = true;
    setIsRenderingPage(true);

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const buffer = await file.arrayBuffer();
        const loadParams: Record<string, unknown> = {
          data: buffer,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
          wasmUrl: '/pdfjs/wasm/',
          stopAtErrors: false,
        };
        if (pdfPassword) loadParams.password = pdfPassword;
        const pdfDoc = await pdfjsLib.getDocument(loadParams).promise;
        if (!isMounted) return;
        const page = await pdfDoc.getPage(currentViewPage);

        // HiDPI scale factor: 2.2x mínimo para máxima nitidez tipográfica
        const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const targetScale = Math.max(2.2, dpr * 2.0);
        const vp = page.getViewport({ scale: targetScale });

        if (vp.width > 0) {
          setPageAspectRatio(vp.height / vp.width);
        }

        const canvas = document.createElement('canvas');
        canvas.height = Math.round(vp.height);
        canvas.width = Math.round(vp.width);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;
          if (isMounted) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
            pageCacheRef.current.set(currentViewPage, dataUrl);
            setViewerHiResImage(dataUrl);
          }
        }
      } catch (e) {
        console.error('Error al renderizar página OCR:', e);
      } finally {
        if (isMounted) setIsRenderingPage(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [file, currentViewPage, totalPages, needsPassword, pdfPassword]);

  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneDragging(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneDragging(false);
  };

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type !== 'application/pdf' && !dropped.name.toLowerCase().endsWith('.pdf')) {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
        return;
      }
      setFile(dropped);
      setGlobalFile(dropped);
      setProcessedPages(new Set());
      setDismissedNativeTextWarning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      setFile(f);
      setGlobalFile(f);
      setProcessedPages(new Set());
      setDismissedNativeTextWarning(false);
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setMiniThumbnails([]);
    setTotalPages(0);
    setCurrentViewPage(1);
    setPageInput('1');
    setViewerHiResImage(null);
    pageCacheRef.current.clear();
    setExtractedText('');
    setProcessedPages(new Set());
    setHasNativeText(false);
    setAvgNativeChars(0);
    setDismissedNativeTextWarning(false);
    setCompletedResult(null);
  };

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success(isEs ? 'Texto copiado al portapapeles' : 'Text copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadWord = async () => {
    if (!extractedText) {
      toast.error(
        isEs
          ? 'No hay texto reconocido disponible para Word.'
          : 'No recognized text available for Word.',
      );
      return;
    }
    setIsGeneratingDocx(true);
    try {
      const filePrefix = file?.name.replace(/\.[^/.]+$/, '') || 'Documento';
      const docxBlob = await createDocxFromOcrText(extractedText, {
        title: metaTitle || filePrefix,
        author: metaAuthor || 'PDFBlack',
        subject:
          metaSubject || (isEs ? 'Reconocimiento Óptico OCR' : 'Optical Character Recognition'),
        engineName: ocrEngine === 'paddleocr' ? 'PaddleOCR AI' : 'Tesseract v5',
      });
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filePrefix}_OCR_Editable.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success(
        isEs
          ? '¡Documento Word (.docx) descargado con éxito!'
          : 'Word (.docx) document downloaded successfully!',
      );
    } catch (err) {
      console.error('Error al generar DOCX:', err);
      toast.error(isEs ? 'Error al generar documento Word' : 'Error generating Word document');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const parseSelectedPages = useCallback((): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) selected.add(i);
      return selected;
    }
    const parts = customPageRange.split(',');
    parts.forEach((part) => {
      const t = part.trim();
      if (t.includes('-')) {
        const [s, ee] = t.split('-').map(Number);
        if (!isNaN(s) && !isNaN(ee))
          for (let i = Math.min(s, ee); i <= Math.max(s, ee); i++)
            if (i >= 1 && i <= totalPages) selected.add(i);
      } else {
        const n = Number(t);
        if (!isNaN(n) && n >= 1 && n <= totalPages) selected.add(n);
      }
    });
    return selected;
  }, [pageScope, customPageRange, totalPages]);

  // ── Execute OCR via Enterprise Worker ──
  const executeOcr = async () => {
    if (!file) {
      toast.error(
        isEs ? 'Sube un archivo PDF escaneado primero.' : 'Upload a scanned PDF file first.',
      );
      return;
    }
    setIsProcessing(true);
    setProgressPercent(2);
    setProgressMsg(
      isEs ? 'Iniciando motor OCR Enterprise...' : 'Starting Enterprise OCR engine...',
    );
    setExtractedText('');
    setProcessedPages(new Set());

    try {
      const buffer = await file.arrayBuffer();
      const filePrefix = file.name.replace(/\.[^/.]+$/, '');

      // Terminate previous worker if any
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      const worker = new Worker(new URL('../workers/pdf-ocr.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = async (ev: MessageEvent<OcrWorkerResult>) => {
        const msg = ev.data;
        if (msg.type === 'progress') {
          setProgressPercent(msg.percent);
          setProgressMsg(msg.message);
          if (msg.currentPage) {
            setActivePageInOcr(msg.currentPage);
            setCurrentViewPage(msg.currentPage);
            setProcessedPages((prev) => {
              const next = new Set(prev);
              for (let p = 1; p < msg.currentPage!; p++) next.add(p);
              return next;
            });
          }
        } else if (msg.type === 'success') {
          setExtractedText(msg.extractedText);
          setActivePageInOcr(null);
          setProcessedPages((prev) => {
            const next = new Set(prev);
            for (let p = 1; p <= totalPages; p++) next.add(p);
            return next;
          });

          // Save result for authorized download card
          const mimeMap: Record<string, string> = {
            pdf: 'application/pdf',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain;charset=utf-8',
            json: 'application/json',
          };

          let blob: Blob;
          let downloadFilename = msg.filename;

          if (msg.outputFormat === 'docx') {
            try {
              blob = await createDocxFromOcrText(msg.extractedText, {
                title: metaTitle || filePrefix,
                author: metaAuthor || 'PDFBlack',
                subject:
                  metaSubject ||
                  (isEs ? 'Reconocimiento Óptico OCR' : 'Optical Character Recognition'),
                engineName: ocrEngine === 'paddleocr' ? 'PaddleOCR AI' : 'Tesseract v5',
              });
              downloadFilename = `${filePrefix}_OCR_Editable.docx`;
            } catch (docErr) {
              console.error('Error empacando DOCX:', docErr);
              blob = new Blob([msg.outputBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              });
            }
          } else {
            blob = new Blob([msg.outputBuffer], {
              type: mimeMap[msg.outputFormat] ?? 'application/octet-stream',
            });
          }

          const url = URL.createObjectURL(blob);
          const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
          const processedCount = selectedPagesSet.size;
          const langName = LANG_LABELS[ocrLang]?.[isEs ? 'es' : 'en'] || ocrLang;

          setCompletedResult({
            downloadUrl: url,
            filename: downloadFilename,
            fileSize: sizeMb,
            outputFormat: msg.outputFormat as any,
            rawBlob: blob,
            processedPagesCount: processedCount,
            ocrLanguageName: langName,
            stats: msg.stats,
          });

          toast.success(
            isEs
              ? '¡OCR Enterprise completado! Tu archivo está listo para descargar.'
              : 'Enterprise OCR completed! Your file is ready for download.',
          );
          setIsProcessing(false);
          setProgressMsg('');
          worker.terminate();
          workerRef.current = null;
        } else if (msg.type === 'error') {
          toast.error(isEs ? `Error de OCR: ${msg.message}` : `OCR error: ${msg.message}`);
          setIsProcessing(false);
          setProgressMsg('');
          worker.terminate();
          workerRef.current = null;
        }
      };

      const workerOpts: OcrWorkerOptions = {
        filePrefix,
        pdfBuffer: buffer,
        ocrLang,
        ocrEngine,
        outputFormat,
        pageScope,
        customPageRange,
        totalPages,
        textOpacity,
        numericMode,
        enhanceContrast,
        autoDeskew,
        metaTitle: metaTitle || `${filePrefix} — OCR`,
        metaAuthor: metaAuthor || '',
        metaSubject: metaSubject || (isEs ? 'Documento con OCR' : 'OCR Document'),
        pdfPassword: pdfPassword || undefined,
      };

      worker.postMessage(workerOpts, [buffer]);
    } catch (err: any) {
      toast.error(isEs ? `Error: ${err.message}` : `Error: ${err.message}`);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  // ── RENDER ──
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

      {/* HEADER DE HERRAMIENTA */}
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
                ? '006 / RECONOCIMIENTO ÓPTICO DE CARACTERES (OCR)'
                : '006 / OPTICAL CHARACTER RECOGNITION (OCR)'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ScanText className="w-6 h-6 text-white flex-shrink-0" />
              {isEs
                ? 'RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF'
                : 'MAKE PDF SEARCHABLE WITH OCR'}
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

      {/* CAJA SUPERIOR DE SELECCIÓN DE MOTOR OCR */}
      {!completedResult && (
        <div className="w-full bg-[#0d0d12] border border-zinc-700/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl font-mono relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-inner flex-shrink-0">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-sans">
                    {isEs
                      ? 'SELECCIONA EL MOTOR IA DE RECONOCIMIENTO:'
                      : 'SELECT AI OCR ENGINE ARCHITECTURE:'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    100% In-RAM · Zero-Knowledge
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {isEs
                    ? 'Elige la arquitectura neuronal que procesará tu documento PDF:'
                    : 'Choose the neural network architecture that will process your PDF document:'}
                </p>
              </div>
            </div>

            {/* Selector de Motores en dos tarjetas clicables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto min-w-[320px] sm:min-w-[480px]">
              {/* Opción 1: Tesseract v5 */}
              <button
                type="button"
                onClick={() => setOcrEngine('tesseract')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                  ocrEngine === 'tesseract'
                    ? 'bg-zinc-800/95 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/50'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    ocrEngine === 'tesseract'
                      ? 'border-white bg-white text-black'
                      : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  {ocrEngine === 'tesseract' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs text-white">Tesseract v5</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-300 font-mono">
                      LSTM Standard
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    {isEs
                      ? 'Ultraligero, 100+ idiomas y documentos estándar.'
                      : 'Ultra-light, 100+ languages & standard docs.'}
                  </p>
                </div>
              </button>

              {/* Opción 2: PaddleOCR AI */}
              <button
                type="button"
                onClick={() => setOcrEngine('paddleocr')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                  ocrEngine === 'paddleocr'
                    ? 'bg-zinc-800/95 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/50'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    ocrEngine === 'paddleocr'
                      ? 'border-white bg-white text-black'
                      : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  {ocrEngine === 'paddleocr' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs text-white">PaddleOCR AI</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                      ONNX Deep Learning
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    {isEs
                      ? 'Alta fidelidad en tablas, sellos y expedientes escaneados.'
                      : 'High fidelity for tables, stamps & scanned files.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DROP ZONE */}
      {!file ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneDrop}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
            isDropzoneDragging
              ? 'border-white bg-zinc-900/50'
              : 'border-zinc-600 hover:border-white'
          } rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <ScanText className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de Reconocimiento OCR Enterprise v5.0 • 100% Local'
                : 'Enterprise OCR Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF'
              : 'MAKE PDF SEARCHABLE WITH OCR'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Transforma documentos PDF escaneados en archivos con texto 100% seleccionable e indexable, sin subir datos a servidores ni perder nitidez visual.'
              : 'Transform scanned PDF documents into 100% searchable and selectable files, without uploading data to servers or losing visual sharpness.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ PDF Sandwich Buscable' : '✓ Searchable PDF Sandwich'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Capa de texto invisible debajo de la imagen original para buscar con Ctrl+F y copiar.'
                  : 'Invisible text layer beneath original scan to search with Ctrl+F and copy words.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Auto-Deskew & Binarización Otsu' : '✓ Auto-Deskew & Otsu Binarization'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Corrige documentos torcidos y purifica sombras oscuras para máxima tasa de acierto.'
                  : 'Corrects tilted scans and eliminates shadows for maximum accuracy.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Estricta en RAM' : '✓ Strict In-RAM Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Documentos confidenciales procesados 100% en WebAssembly en tu navegador sin servidores.'
                  : 'Confidential documents processed 100% locally in WebAssembly with zero uploads.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO Y DESCARGA CON MÉTRICAS DE OCR */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE MÉTRICAS DE OCR */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <ScanText className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DEL RECONOCIMIENTO ÓPTICO (OCR)' : 'OCR RECOGNITION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Documento procesado e indexado con éxito!'
                      : 'Document processed & indexed successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-[#E8DFCF]/30 px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Capa de Texto' : 'Text Layer'}
                  </div>
                  <div className="text-[#FAF6EE] font-extrabold text-sm flex items-center justify-end gap-1.5 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-[#FAF6EE]" />
                    <span>{isEs ? '100% Seleccionable' : '100% Searchable'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.processedPagesCount || totalPages} />{' '}
                  {isEs ? 'Págs' : 'Pgs'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Palabras Extraídas' : 'Extracted Words'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.stats?.totalWords || 0} />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Confianza Promedio' : 'Avg. Confidence'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.stats?.avgConfidence
                    ? `${completedResult.stats.avgConfidence.toFixed(1)}%`
                    : '95%+'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Motor OCR Utilizado' : 'OCR Engine Used'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.stats?.ocrEngine ||
                    (ocrEngine === 'paddleocr' ? 'PaddleOCR AI' : 'Tesseract v5')}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat={completedResult.outputFormat}
            rawBlob={completedResult.rawBlob}
            currentToolId="ocr"
            onReset={() => setCompletedResult(null)}
          >
            {/* PANEL MULTI-FORMATO: DESCARGAR EN WORD / PDF / TXT */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">
                  {isEs ? 'Formatos Adicionales de Descarga:' : 'Additional Download Formats:'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {completedResult.outputFormat !== 'docx' && (
                  <button
                    type="button"
                    onClick={handleDownloadWord}
                    disabled={isGeneratingDocx}
                    className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 hover:border-blue-400 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    title={
                      isEs
                        ? 'Generar y descargar documento Word editable (.docx)'
                        : 'Generate and download editable Word document (.docx)'
                    }
                  >
                    {isGeneratingDocx ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>{isEs ? 'Descargar en Word (.DOCX)' : 'Download in Word (.DOCX)'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copied ? (isEs ? 'Copiado' : 'Copied') : isEs ? 'Copiar Texto' : 'Copy Text'}
                  </span>
                </button>
              </div>
            </div>
          </DownloadSuccessCard>
        </motion.div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
           LAYOUT APILADO ENTERPRISE: VISOR ARRIBA Y PANEL DE CONTROL DEBAJO
        ══════════════════════════════════════════════════════════════════════════ */
        <div className="w-full flex flex-col gap-6">
          {/* BANNER INFORMATIVO DE HEURÍSTICA DE DETECCIÓN DE TEXTO */}
          {hasNativeText && !dismissedNativeTextWarning && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg font-mono text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 flex-shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-white font-bold block">
                    {isEs ? 'Aviso de Inteligencia Documental:' : 'Document Intelligence Notice:'}
                  </span>
                  <span className="text-zinc-400 text-[11px] leading-relaxed">
                    {isEs
                      ? `Este archivo parece contener texto digital nativo (~${avgNativeChars} caracteres/pág). No es indispensable aplicar OCR a menos que desees indexar sellos, firmas manuscritas o páginas escaneadas adicionales.`
                      : `This file appears to have native digital text (~${avgNativeChars} chars/page). OCR is not strictly required unless you wish to index embedded scanned stamps or signatures.`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedNativeTextWarning(true)}
                className="self-end sm:self-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[11px] transition-all cursor-pointer border border-zinc-700 flex-shrink-0 font-bold"
              >
                {isEs ? 'Entendido, continuar' : 'Got it, continue'}
              </button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 1: VISOR DE DOCUMENTO ESCANEADO (ANCHO COMPLETO ARRIBA)
          ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col h-[560px] lg:h-[640px] overflow-hidden relative"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* CABECERA DEL VISOR CON NAVEGACIÓN Y ZOOM */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold shrink-0">
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                <ScanText className="w-4 h-4 text-white" />
                <span>
                  {isEs ? '001 / VISOR DE DOCUMENTO ESCANEADO' : '001 / SCANNED DOCUMENT VIEWER'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* BOTÓN REALCE DE CONTRASTE / NITIDEZ HD */}
                <button
                  type="button"
                  onClick={() => setViewerHighContrast((v) => !v)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    viewerHighContrast
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                  title={
                    isEs
                      ? 'Realzar contraste para ver texto tenue o escaneado con poca tinta'
                      : 'Enhance contrast for faint or washed out scanned text'
                  }
                >
                  <Contrast className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {viewerHighContrast
                      ? isEs
                        ? 'Nitidez: ON'
                        : 'Sharp: ON'
                      : isEs
                        ? 'Nitidez: OFF'
                        : 'Sharp: OFF'}
                  </span>
                </button>

                {/* ZOOM CONTROLS CON MODOS ANCHO Y PÁGINA */}
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 gap-0.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setZoomMode('custom');
                      setZoomPercent((p) => Math.max(50, p - 20));
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                    title={isEs ? 'Reducir zoom' : 'Zoom out'}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomMode('fit-width')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      zoomMode === 'fit-width'
                        ? 'bg-white text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={
                      isEs
                        ? 'Ajustar al ancho (Lectura cómoda)'
                        : 'Fit to width (Comfortable reading)'
                    }
                  >
                    {isEs ? 'Ancho' : 'Width'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomMode('fit-page')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      zoomMode === 'fit-page'
                        ? 'bg-white text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Ajustar a la página entera' : 'Fit entire page'}
                  >
                    {isEs ? 'Página' : 'Page'}
                  </button>

                  <span className="text-[10px] text-zinc-300 font-bold px-1.5 min-w-[36px] text-center font-mono">
                    {zoomMode === 'fit-width'
                      ? '100%'
                      : zoomMode === 'fit-page'
                        ? 'Fit'
                        : `${zoomPercent}%`}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setZoomMode('custom');
                      setZoomPercent((p) => Math.min(250, p + 20));
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                    title={isEs ? 'Aumentar zoom' : 'Zoom in'}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* PAGINACIÓN CON SALTO DIRECTO */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-xl text-xs font-mono text-white shadow-sm">
                    <button
                      type="button"
                      disabled={currentViewPage <= 1}
                      onClick={() => setCurrentViewPage(1)}
                      className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? 'Primera página' : 'First page'}
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentViewPage <= 1}
                      onClick={() => setCurrentViewPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? 'Página anterior' : 'Previous page'}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {isEs ? 'Pág.' : 'Pg.'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onBlur={() => {
                          const val = parseInt(pageInput);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            setCurrentViewPage(val);
                          } else {
                            setPageInput(currentViewPage.toString());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(pageInput);
                            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                              setCurrentViewPage(val);
                            } else {
                              setPageInput(currentViewPage.toString());
                            }
                          }
                        }}
                        className="w-10 bg-zinc-950 border border-zinc-700 rounded-lg px-1 py-0.5 text-center text-xs text-white font-mono font-bold outline-none focus:border-white"
                      />
                      <span className="text-[11px] text-zinc-400 font-mono">/ {totalPages}</span>
                    </div>

                    <button
                      type="button"
                      disabled={currentViewPage >= totalPages}
                      onClick={() => setCurrentViewPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? 'Página siguiente' : 'Next page'}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentViewPage >= totalPages}
                      onClick={() => setCurrentViewPage(totalPages)}
                      className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? 'Última página' : 'Last page'}
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local WASM
                </div>
              </div>
            </div>

            {/* PASSWORD REQUIRED WIDGET */}
            {needsPassword && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] gap-5">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-sm w-full">
                  <Lock className="w-8 h-8 text-amber-400" />
                  <p className="text-sm font-bold text-white font-sans text-center">
                    {isEs ? 'PDF Protegido con Contraseña' : 'Password-Protected PDF'}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono text-center">
                    {isEs
                      ? 'Introduce la clave para desbloquear y continuar.'
                      : 'Enter the password to unlock and continue.'}
                  </p>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && pdfPassword) setPdfPassword((p) => p);
                      }}
                      placeholder={isEs ? 'Contraseña del PDF...' : 'PDF password...'}
                      className="w-full p-2.5 pr-10 bg-zinc-950 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:border-white/50"
                    />
                    <button
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setPdfPassword(pdfPassword)}
                    className="w-full bg-white text-black hover:bg-zinc-200 py-2.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" /> {isEs ? 'Desbloquear PDF' : 'Unlock PDF'}
                  </button>
                </div>
              </div>
            )}

            {/* VISOR PRINCIPAL DE PÁGINA ESCANEADA CON ZOOM */}
            {!needsPassword && (
              <div className="flex-1 w-full min-h-0 bg-zinc-950 rounded-2xl border border-white/5 overflow-auto select-none shadow-inner p-4 flex flex-col items-center">
                {isLoadingThumbs || isRenderingPage ? (
                  <div className="flex flex-col items-center justify-center m-auto min-h-[300px] gap-3 font-mono">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <p className="text-zinc-400 text-xs">
                      {isEs
                        ? `Renderizando página ${currentViewPage} en alta definición...`
                        : `Rendering page ${currentViewPage} in HD...`}
                    </p>
                  </div>
                ) : viewerHiResImage ? (
                  <div
                    className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-700 transition-all duration-150 my-auto"
                    style={{
                      width:
                        zoomMode === 'fit-width'
                          ? '100%'
                          : zoomMode === 'fit-page'
                            ? `${Math.round(480 / pageAspectRatio)}px`
                            : `${Math.round(720 * (zoomPercent / 100))}px`,
                      maxWidth: zoomMode === 'fit-width' ? '920px' : undefined,
                      height: zoomMode === 'fit-page' ? '480px' : 'auto',
                      filter: viewerHighContrast ? 'contrast(1.48) brightness(0.95)' : 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={viewerHiResImage}
                      alt={`Página ${currentViewPage}`}
                      className="w-full h-full object-contain pointer-events-none select-none block"
                    />

                    {/* BADGE DE ESTADO PROCESADA */}
                    {processedPages.has(currentViewPage) && (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg z-20 flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>OCR ✓</span>
                      </div>
                    )}

                    {/* BADGE DE PROCESANDO */}
                    {activePageInOcr === currentViewPage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
                        <div className="bg-zinc-950 border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                          <span className="text-white text-xs font-mono font-bold">
                            {isEs
                              ? `Extrayendo texto Pág. ${currentViewPage}...`
                              : `Extracting text Pg. ${currentViewPage}...`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* VISTA PREVIA DEL TEXTO RECONOCIDO EN VIVO */}
            {extractedText && (
              <div className="mt-2 pt-2 border-t border-zinc-800 font-mono shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-white" />
                    {isEs ? 'Texto Reconocido por el Motor OCR:' : 'Recognized Text:'}
                  </span>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copied ? (isEs ? 'Copiado' : 'Copied') : isEs ? 'Copiar texto' : 'Copy text'}
                    </span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full h-18 p-2 bg-[#121217] border border-zinc-700/80 rounded-xl text-[11px] font-mono text-zinc-300 outline-none resize-none shadow-inner"
                />
              </div>
            )}

            {/* MINI TIRA DE NAVEGACIÓN RÁPIDA ENTRE PÁGINAS */}
            {totalPages > 1 && (
              <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 py-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider shrink-0 font-mono">
                  {isEs ? 'Saltar a pág:' : 'Jump to pg:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {miniThumbnails.length > 0
                    ? miniThumbnails.map((thumb) => (
                        <button
                          key={thumb.pageNum}
                          type="button"
                          onClick={() => setCurrentViewPage(thumb.pageNum)}
                          className={`relative w-8 h-10 rounded-lg border overflow-hidden transition-all cursor-pointer shrink-0 ${
                            currentViewPage === thumb.pageNum
                              ? 'border-white ring-2 ring-white/40 bg-zinc-900 scale-105'
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
                            className="w-full h-full object-contain pointer-events-none"
                          />
                          {processedPages.has(thumb.pageNum) && (
                            <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-[8px] text-white text-center font-bold font-mono">
                              ✓
                            </div>
                          )}
                        </button>
                      ))
                    : Array.from({ length: Math.min(totalPages, 16) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentViewPage(p)}
                          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            currentViewPage === p
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
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 2: PANEL DE CONTROL OCR ENTERPRISE (DEBAJO DEL VISOR)
          ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* CABECERA DEL PANEL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN Y PARÁMETROS' : '002 / CONFIGURATION & SETTINGS'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                  <Sliders className="w-5 h-5 text-white" />
                  <span>
                    {isEs ? 'PANEL DE CONTROL OCR ENTERPRISE' : 'ENTERPRISE OCR CONTROL PANEL'}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {ocrEngine === 'paddleocr' ? 'PaddleOCR AI (ONNX)' : 'Tesseract LSTM v5'}
                </span>
                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-white" />
                  {LANG_LABELS[ocrLang]?.[isEs ? 'es' : 'en'] || ocrLang}
                </span>
                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-white" />
                  {selectedPagesSet.size}{' '}
                  {selectedPagesSet.size === 1
                    ? isEs
                      ? 'página'
                      : 'page'
                    : isEs
                      ? 'páginas'
                      : 'pages'}
                </span>
                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold">
                  .{outputFormat.toUpperCase()}{' '}
                  {outputFormat === 'pdf'
                    ? isEs
                      ? 'Sandwich'
                      : 'Sandwich'
                    : outputFormat === 'docx'
                      ? isEs
                        ? 'Word Editable'
                        : 'Editable Word'
                      : ''}
                </span>
              </div>
            </div>

            {/* CUADRÍCULA ENTERPRISE DE 3 COLUMNAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start font-mono text-xs">
              {/* ── COLUMNA 1: MOTOR OCR E IDIOMA ── */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-white pb-2 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-white" />
                    {isEs ? 'Motor OCR e Idioma' : 'OCR Engine & Language'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {ocrEngine === 'paddleocr' ? 'ONNX Deep Learning' : 'LSTM WASM'}
                  </span>
                </div>

                {/* Selector de Motor OCR */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">
                    {isEs ? 'Arquitectura del Motor:' : 'Engine Architecture:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOcrEngine('tesseract')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        ocrEngine === 'tesseract'
                          ? 'bg-zinc-800 border-white text-white shadow-md'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Tesseract v5</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-300 font-mono">
                          LSTM
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {isEs ? 'Estándar y 100+ idiomas.' : 'Standard & 100+ languages.'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOcrEngine('paddleocr')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        ocrEngine === 'paddleocr'
                          ? 'bg-zinc-800 border-white text-white shadow-md'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">PaddleOCR AI</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                          ONNX
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {isEs
                          ? 'Deep Learning: sellos y tablas.'
                          : 'Deep Learning: stamps & tables.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Selector de idioma */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">
                    {isEs ? 'Idioma del Documento:' : 'Document Language:'}
                  </label>
                  <select
                    value={ocrLang}
                    onChange={(e) => setOcrLang(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-white transition-all shadow-sm"
                  >
                    {Object.entries(LANG_LABELS).map(([code, labels]) => (
                      <option key={code} value={code}>
                        {isEs ? labels.es : labels.en} ({code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modo Numérico / Financiero Especializado */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-start gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={numericMode}
                      onChange={(e) => setNumericMode(e.target.checked)}
                      className="accent-white w-4 h-4 rounded mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="group-hover:text-white transition-colors block">
                        {isEs ? 'Modo Financiero / Numérico' : 'Numeric / Financial Mode'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal leading-tight block mt-0.5">
                        {isEs
                          ? 'Prioriza cifras, separadores de miles/decimales y divisas ($ € £) en facturas y balances.'
                          : 'Prioritizes digits, decimals, and currencies ($ € £) in invoices and tables.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ── COLUMNA 2: PREPROCESAMIENTO Y CALIDAD ── */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-white pb-2 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Contrast className="w-4 h-4 text-white" />
                    {isEs ? 'Preprocesamiento y Calidad' : 'Preprocessing & Quality'}
                  </span>
                  <span className="text-[10px] text-white/80 font-mono">v5.0 Enterprise</span>
                </div>

                {/* Binarización Adaptativa Otsu */}
                <label className="flex items-start gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enhanceContrast}
                    onChange={(e) => setEnhanceContrast(e.target.checked)}
                    className="accent-white w-4 h-4 rounded mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="group-hover:text-white transition-colors block">
                      {isEs ? 'Binarización Adaptativa Otsu' : 'Otsu Adaptive Binarization'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal leading-tight block mt-0.5">
                      {isEs
                        ? 'Elimina sombras, fondos oscuros y manchas de fotos para máxima tasa de acierto.'
                        : 'Eliminates shadows, dark backgrounds, and folds for higher accuracy.'}
                    </span>
                  </div>
                </label>

                {/* Auto-Deskew / Corrección de Inclinación */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-start gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={autoDeskew}
                      onChange={(e) => setAutoDeskew(e.target.checked)}
                      className="accent-white w-4 h-4 rounded mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="group-hover:text-white transition-colors block">
                        {isEs
                          ? 'Auto-Deskew (Alinear Inclinación)'
                          : 'Auto-Deskew (Straighten Tilt)'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal leading-tight block mt-0.5">
                        {isEs
                          ? 'Detecta y corrige automáticamente giros de -5° a +5° antes del OCR.'
                          : 'Detects and straightens tilted scans from -5° to +5° before OCR.'}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Visibilidad Capa de Texto */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'Visibilidad Capa Invisible:' : 'Text Layer Opacity:'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {textOpacity === 0
                        ? isEs
                          ? '0% (Invisible)'
                          : '0% (Invisible)'
                        : `${textOpacity}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={textOpacity}
                    onChange={(e) => setTextOpacity(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-400 block mt-0.5">
                    {isEs
                      ? '0% = Norma ISO 32000-1 (invisible para buscar y copiar)'
                      : '0% = ISO 32000-1 standard (invisible for search & copy)'}
                  </span>
                </div>
              </div>

              {/* ── COLUMNA 3: ALCANCE Y FORMATO DE SALIDA ── */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-white pb-2 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-white" />
                    {isEs ? 'Alcance y Formato' : 'Scope & Output Format'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {totalPages} {isEs ? 'págs' : 'pgs'}
                  </span>
                </div>

                {/* Formato de salida */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">
                    {isEs ? 'Formato de Salida:' : 'Output Format:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(['pdf', 'docx', 'txt', 'json'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setOutputFormat(fmt)}
                        className={`py-2 px-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          outputFormat === fmt
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {fmt === 'pdf' && <FileText className="w-3.5 h-3.5" />}
                        {fmt === 'docx' && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                        {fmt === 'txt' && <FileSearch className="w-3.5 h-3.5" />}
                        {fmt === 'json' && <FileCode className="w-3.5 h-3.5" />}
                        <span>.{fmt.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alcance de páginas */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'Alcance de Páginas:' : 'Page Scope:'}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="ocr-scope"
                        checked={pageScope === 'all'}
                        onChange={() => setPageScope('all')}
                        className="accent-white"
                      />
                      <span>
                        {isEs ? 'Todas' : 'All'} ({totalPages})
                      </span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="ocr-scope"
                        checked={pageScope === 'custom'}
                        onChange={() => setPageScope('custom')}
                        className="accent-white"
                      />
                      <span>{isEs ? 'Rango' : 'Custom'}</span>
                    </label>
                  </div>
                  {pageScope === 'custom' && (
                    <input
                      type="text"
                      value={customPageRange}
                      onChange={(e) => setCustomPageRange(e.target.value)}
                      placeholder="Ej: 1-3, 5"
                      className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white transition-all"
                    />
                  )}
                </div>

                {/* Metadatos opcionales */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-white" />
                    {isEs ? 'Título del PDF (Opcional):' : 'PDF Title (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={file.name.replace(/\.[^/.]+$/, '')}
                    className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white outline-none focus:border-white placeholder:text-zinc-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* BARRA DE PROGRESO EN TIEMPO REAL */}
            {isProcessing && (
              <div className="space-y-2 font-mono bg-zinc-950 p-4 rounded-2xl border border-white/10 shadow-inner">
                <div className="flex justify-between text-xs font-bold text-zinc-200">
                  <span className="flex items-center gap-2 truncate max-w-[400px]">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    {progressMsg}
                  </span>
                  <span className="text-white font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-zinc-400 via-white to-zinc-200 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* BOTÓN DE ACCIÓN PRINCIPAL ENTERPRISE */}
            <button
              onClick={executeOcr}
              disabled={isProcessing || needsPassword}
              className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-100 py-4 px-6 rounded-2xl font-sans font-extrabold text-sm sm:text-base uppercase tracking-tight transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.008] active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <Sparkles className="w-5 h-5 text-black" />
              )}
              <span>
                {isProcessing
                  ? progressMsg
                  : isEs
                    ? `Reconocer Texto (OCR) — ${selectedPagesSet.size} ${selectedPagesSet.size === 1 ? 'página' : 'páginas'} →`
                    : `Recognize Text (OCR) — ${selectedPagesSet.size} ${selectedPagesSet.size === 1 ? 'page' : 'pages'} →`}
              </span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
