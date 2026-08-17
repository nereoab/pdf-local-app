'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScanText, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles,
  FileText, Trash2, Plus, LayoutGrid, CheckCircle2, Copy, Check, FileSearch,
  Globe, Layers, Contrast, Eye, FileCode, Zap, RotateCw, Lightbulb, Lock, Unlock,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag, User, BookOpen,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { OcrWorkerOptions, OcrWorkerResult } from '@/workers/pdf-ocr.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';

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

  const globalFile = useFileStore(s => s.globalFile);
  const setGlobalFile = useFileStore(s => s.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [totalPages, setTotalPages] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [processedPages, setProcessedPages] = useState<Set<number>>(new Set());
  const [activePageInOcr, setActivePageInOcr] = useState<number | null>(null);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);

  // Password
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Options
  const [ocrLang, setOcrLang] = useState('spa');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'txt' | 'json'>('pdf');
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);

  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState('1');
  const [enhanceContrast, setEnhanceContrast] = useState(false);
  const [numericMode, setNumericMode] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0);

  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize?: string;
    outputFormat: 'pdf' | 'txt' | 'json';
    rawBlob?: Blob;
    processedPagesCount?: number;
    ocrLanguageName?: string;
  } | null>(null);

  // Metadata
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');

  const [currentViewPage, setCurrentViewPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [viewerHiResImage, setViewerHiResImage] = useState<string | null>(null);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const pageCacheRef = useRef<Map<number, string>>(new Map());
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Scroll automático suave e inmediato hacia el inicio de la herramienta (debajo del Navbar global)
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

  // Sincronizar dinámicamente la altura de la vista previa con el panel de control
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const updateHeight = () => {
      if (controlPanelRef.current) {
        setPreviewHeight(controlPanelRef.current.offsetHeight);
      }
    };
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(controlPanelRef.current);
    return () => resizeObserver.disconnect();
  }, [file, needsPassword, outputFormat, pageScope, enhanceContrast, isProcessing]);

  useEffect(() => { if (globalFile && !file) setFile(globalFile); }, [globalFile, file]);

  // ── Load document info ──
  useEffect(() => {
    if (!file) { 
      setPageThumbnails([]); 
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

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const buffer = await file.arrayBuffer();
        const loadParams: Record<string, unknown> = { data: buffer };
        if (pdfPassword) loadParams.password = pdfPassword;
        const pdfDoc = await pdfjsLib.getDocument(loadParams).promise;
        if (!isMounted) return;
        const n = pdfDoc.numPages;
        setTotalPages(n);
        setCurrentViewPage(1);
        setPageInput('1');
        setCustomPageRange(`1-${n}`);
        setIsLoadingThumbs(false);
      } catch (err: any) {
        if (isMounted) {
          if (err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password')) {
            setNeedsPassword(true);
          } else {
            toast.error(isEs ? 'Error al cargar el PDF.' : 'Error loading PDF.');
          }
          setIsLoadingThumbs(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [file, pdfPassword, isEs]);

  // Visor HD de la página activa con caché instantánea
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
        const loadParams: Record<string, unknown> = { data: buffer };
        if (pdfPassword) loadParams.password = pdfPassword;
        const pdfDoc = await pdfjsLib.getDocument(loadParams).promise;
        if (!isMounted) return;
        const page = await pdfDoc.getPage(currentViewPage);
        const vp = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.height = vp.height;
        canvas.width = vp.width;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await (page.render({ canvasContext: ctx, viewport: vp, canvas } as any)).promise;
          if (isMounted) {
            const dataUrl = canvas.toDataURL('image/webp', 0.9);
            pageCacheRef.current.set(currentViewPage, dataUrl);
            setViewerHiResImage(dataUrl);
          }
        }
      } catch (e) {
        console.error("Error al renderizar página OCR:", e);
      } finally {
        if (isMounted) setIsRenderingPage(false);
      }
    })();

    return () => { isMounted = false; };
  }, [file, currentViewPage, totalPages, needsPassword, pdfPassword]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      setFile(f); setGlobalFile(f); setProcessedPages(new Set());
    }
    e.target.value = '';
  };
  const handleRemoveFile = () => { 
    setFile(null); 
    setGlobalFile(null); 
    setPageThumbnails([]); 
    setTotalPages(0); 
    setCurrentViewPage(1);
    setPageInput('1');
    setViewerHiResImage(null);
    pageCacheRef.current.clear();
    setExtractedText(''); 
    setProcessedPages(new Set()); 
  };

  const handleCopyText = () => {
    if (extractedText) { navigator.clipboard.writeText(extractedText); setCopied(true); toast.success(isEs ? 'Texto copiado' : 'Text copied'); setTimeout(() => setCopied(false), 2000); }
  };

  const parseSelectedPages = useCallback((): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') { for (let i = 1; i <= totalPages; i++) selected.add(i); return selected; }
    const parts = customPageRange.split(',');
    parts.forEach(part => {
      const t = part.trim();
      if (t.includes('-')) {
        const [s, ee] = t.split('-').map(Number);
        if (!isNaN(s) && !isNaN(ee)) for (let i = Math.min(s, ee); i <= Math.max(s, ee); i++) if (i >= 1 && i <= totalPages) selected.add(i);
      } else { const n = Number(t); if (!isNaN(n) && n >= 1 && n <= totalPages) selected.add(n); }
    });
    return selected;
  }, [pageScope, customPageRange, totalPages]);

  // ── Execute OCR via Worker ──
  const executeOcr = async () => {
    if (!file) { toast.error(isEs ? 'Sube un archivo PDF escaneado primero.' : 'Upload a scanned PDF file first.'); return; }
    setIsProcessing(true);
    setProgressPercent(2);
    setProgressMsg(isEs ? 'Iniciando motor OCR...' : 'Starting OCR engine...');
    setExtractedText('');
    setProcessedPages(new Set());

    try {
      const buffer = await file.arrayBuffer();
      const filePrefix = file.name.replace(/\.[^/.]+$/, '');

      // Terminate previous worker if any
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }

      const worker = new Worker(new URL('../workers/pdf-ocr.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (ev: MessageEvent<OcrWorkerResult>) => {
        const msg = ev.data;
        if (msg.type === 'progress') {
          setProgressPercent(msg.percent);
          setProgressMsg(msg.message);
          if (msg.currentPage) {
            setActivePageInOcr(msg.currentPage);
            setCurrentViewPage(msg.currentPage);
            setProcessedPages(prev => {
              const next = new Set(prev);
              // Mark pages up to current as processed
              for (let p = 1; p < msg.currentPage!; p++) next.add(p);
              return next;
            });
          }
        } else if (msg.type === 'success') {
          setExtractedText(msg.extractedText);
          setActivePageInOcr(null);
          // Mark all pages as processed
          setProcessedPages(prev => {
            const next = new Set(prev);
            for (let p = 1; p <= totalPages; p++) next.add(p);
            return next;
          });

          // Save result for authorized download card
          const mimeMap: Record<string, string> = { pdf: 'application/pdf', txt: 'text/plain;charset=utf-8', json: 'application/json' };
          const blob = new Blob([msg.outputBuffer], { type: mimeMap[msg.outputFormat] ?? 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
          const processedCount = selectedPagesSet.size;
          const langName = LANG_LABELS[ocrLang]?.[isEs ? 'es' : 'en'] || ocrLang;

          setCompletedResult({
            downloadUrl: url,
            filename: msg.filename,
            fileSize: sizeMb,
            outputFormat: msg.outputFormat as any,
            rawBlob: blob,
            processedPagesCount: processedCount,
            ocrLanguageName: langName,
          });

          toast.success(isEs ? '¡OCR completado! Tu archivo está listo para descargar.' : 'OCR completed! Your file is ready for download.');
          setIsProcessing(false);
          setProgressMsg('');
          worker.terminate(); workerRef.current = null;
        } else if (msg.type === 'error') {
          toast.error(isEs ? `Error de OCR: ${msg.message}` : `OCR error: ${msg.message}`);
          setIsProcessing(false); setProgressMsg('');
          worker.terminate(); workerRef.current = null;
        }
      };

      const workerOpts: OcrWorkerOptions = {
        filePrefix,
        pdfBuffer: buffer,
        ocrLang, outputFormat, pageScope, customPageRange, totalPages,
        textOpacity, numericMode, enhanceContrast,
        metaTitle: metaTitle || `${filePrefix} — OCR`,
        metaAuthor: metaAuthor || '',
        metaSubject: metaSubject || (isEs ? 'Documento con OCR' : 'OCR Document'),
      };

      worker.postMessage(workerOpts, [buffer]);
    } catch (err: any) {
      toast.error(isEs ? `Error: ${err.message}` : `Error: ${err.message}`);
      setIsProcessing(false); setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  // ── RENDER ──
  return (
    <div ref={topContainerRef} className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* HEADER */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{isEs ? '006 / RECONOCIMIENTO ÓPTICO DE CARACTERES (OCR)' : '006 / OPTICAL CHARACTER RECOGNITION (OCR)'}</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ScanText className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF' : 'MAKE PDF SEARCHABLE WITH OCR'}
            </h1>
          </div>
        </div>
        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all cursor-pointer" title={isEs ? 'Quitar archivo' : 'Remove file'}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* DROP ZONE */}
      {!file ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => fileInputRef.current?.click()}
          className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
            <ScanText className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? 'RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF' : 'MAKE PDF SEARCHABLE WITH OCR'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? 'Convierte documentos PDF escaneados en texto seleccionable 100% local.' : 'Convert scanned PDFs into searchable documents 100% locally.'}
          </p>
          <button type="button" className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span>
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
          <div className="bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <ScanText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DEL RECONOCIMIENTO ÓPTICO (OCR)' : 'OCR RECOGNITION RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs ? '¡Documento procesado e indexado con éxito!' : 'Document processed & indexed successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">{isEs ? 'Capa de Texto' : 'Text Layer'}</div>
                  <div className="text-emerald-400 font-extrabold text-sm flex items-center justify-end gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '100% Seleccionable' : '100% Searchable'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Páginas Procesadas' : 'Processed Pages'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.processedPagesCount || totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Idioma de Reconocimiento' : 'OCR Language'}</span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.ocrLanguageName || 'Español'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Formato Resultante' : 'Resulting Format'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.outputFormat.toUpperCase()} {completedResult.outputFormat === 'pdf' ? (isEs ? '(PDF Buscable)' : '(Searchable PDF)') : ''}
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
            onReset={() => setCompletedResult(null)}
          />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">

          {/* ════ PANEL IZQUIERDO: VISOR DE DOCUMENTO ESCANEADO (COL-SPAN-7) ════ */}
          <div 
            style={previewHeight > 0 ? { height: `${previewHeight}px` } : undefined}
            className="lg:col-span-7 xl:col-span-7 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between min-h-0 relative overflow-hidden"
          >
            {/* CABECERA CON BARRA DE NAVEGACIÓN INTELIGENTE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold w-full">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <ScanText className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISOR DE DOCUMENTO ESCANEADO` : `001 / SCANNED DOCUMENT VIEWER`}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 px-1.5 py-1 rounded-lg text-xs font-mono text-white shadow-sm">
                    {/* BOTÓN PRIMERA PÁGINA */}
                    <button
                      type="button"
                      disabled={currentViewPage <= 1}
                      onClick={() => setCurrentViewPage(1)}
                      className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? "Ir a la primera página" : "First page"}
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    {/* BOTÓN PÁGINA ANTERIOR */}
                    <button
                      type="button"
                      disabled={currentViewPage <= 1}
                      onClick={() => setCurrentViewPage(p => Math.max(1, p - 1))}
                      className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? "Página anterior" : "Previous page"}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* INPUT DIRECTO DE PÁGINA */}
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[11px] text-zinc-400 font-mono">{isEs ? "Pág." : "Pg."}</span>
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
                        className="w-10 bg-zinc-950 border border-white/20 rounded px-1 py-0.5 text-center text-xs text-white font-mono font-bold outline-none focus:border-white"
                      />
                      <span className="text-[11px] text-zinc-400 font-mono">/ {totalPages}</span>
                    </div>

                    {/* BOTÓN PÁGINA SIGUIENTE */}
                    <button
                      type="button"
                      disabled={currentViewPage >= totalPages}
                      onClick={() => setCurrentViewPage(p => Math.min(totalPages, p + 1))}
                      className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? "Página siguiente" : "Next page"}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* BOTÓN ÚLTIMA PÁGINA */}
                    <button
                      type="button"
                      disabled={currentViewPage >= totalPages}
                      onClick={() => setCurrentViewPage(totalPages)}
                      className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      title={isEs ? "Ir a la última página" : "Last page"}
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* PASSWORD REQUIRED WIDGET */}
            {needsPassword && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] gap-5">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-sm w-full">
                  <Lock className="w-8 h-8 text-amber-400" />
                  <p className="text-sm font-bold text-white font-sans text-center">{isEs ? 'PDF Protegido con Contraseña' : 'Password-Protected PDF'}</p>
                  <p className="text-[11px] text-zinc-400 font-mono text-center">{isEs ? 'Introduce la clave para desbloquear y continuar.' : 'Enter the password to unlock and continue.'}</p>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pdfPassword}
                      onChange={e => setPdfPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && pdfPassword) setPdfPassword(p => p); }}
                      placeholder={isEs ? 'Contraseña del PDF...' : 'PDF password...'}
                      className="w-full p-2.5 pr-10 bg-zinc-950 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:border-white/50"
                    />
                    <button onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors">
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

            {/* VISOR PRINCIPAL DE PÁGINA ESCANEADA */}
            {!needsPassword && (
              <div className="flex-1 w-full flex items-center justify-center min-h-0 relative p-1 overflow-hidden">
                {isLoadingThumbs || isRenderingPage ? (
                  <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 font-mono">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <p className="text-zinc-400 text-xs">{isEs ? `Cargando página ${currentViewPage}...` : `Loading page ${currentViewPage}...`}</p>
                  </div>
                ) : viewerHiResImage ? (
                  <div className="relative aspect-[1/1.414] max-h-full w-auto max-w-full bg-white rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-zinc-700 select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={viewerHiResImage} 
                      alt={`Página ${currentViewPage}`} 
                      className="w-full h-full object-contain pointer-events-none select-none" 
                    />

                    {/* ETIQUETA FLOTANTE DE PÁGINA */}
                    <div className="absolute top-2.5 left-2.5 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-md border border-white/10 shadow-md">
                      {isEs ? `Página ${currentViewPage} de ${totalPages}` : `Page ${currentViewPage} of ${totalPages}`}
                    </div>

                    {/* BADGE DE ESTADO PROCESADA */}
                    {processedPages.has(currentViewPage) && (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg z-20 flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>OCR ✓</span>
                      </div>
                    )}

                    {/* BADGE DE PROCESANDO */}
                    {activePageInOcr === currentViewPage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
                        <div className="bg-zinc-950 border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                          <span className="text-white text-xs font-mono font-bold">{isEs ? `Extrayendo texto Pág. ${currentViewPage}...` : `Extracting text Pg. ${currentViewPage}...`}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* VISTA PREVIA DEL TEXTO RECONOCIDO EN VIVO */}
            {extractedText && (
              <div className="mt-3 pt-3 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-emerald-400" /> {isEs ? 'Texto Reconocido por el Motor OCR:' : 'Recognized Text:'}
                  </span>
                  <button onClick={handleCopyText} className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar texto' : 'Copy text')}</span>
                  </button>
                </div>
                <textarea readOnly value={extractedText} className="w-full h-24 p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 outline-none resize-none shadow-inner" />
              </div>
            )}

            {/* PIE DE VISTA PREVIA CON ESTADO Y ALCANCE */}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] text-zinc-400 font-mono w-full">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-emerald-400 font-bold">
                  {selectedPagesSet.has(currentViewPage) 
                    ? (isEs ? `✓ Esta página será procesada con OCR` : `✓ This page will be processed with OCR`) 
                    : (isEs ? `✗ Esta página está omitida del alcance` : `✗ This page is excluded from scope`)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>{isEs ? `Idioma: ${LANG_LABELS[ocrLang]?.es || ocrLang}` : `Language: ${LANG_LABELS[ocrLang]?.en || ocrLang}`}</span>
              </div>
            </div>
          </div>

          {/* ════ PANEL DERECHO: PANEL DE CONTROL (COL-SPAN-5, INTACTO) ════ */}
          <div 
            ref={controlPanelRef}
            className="lg:col-span-5 xl:col-span-5 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
          >
            {/* Panel title */}
            <div className="pb-3 border-b border-white/10">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">{isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}</span>
              <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                <Settings2 className="w-5 h-5 text-white" />
              </h2>
            </div>

            {/* Language */}
            <div className="font-mono">
              <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-white" /> {isEs ? 'Idioma del Documento' : 'Document Language'}
              </label>
              <select value={ocrLang} onChange={e => setOcrLang(e.target.value)} className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-white/30">
                {Object.entries(LANG_LABELS).map(([code, labels]) => (
                  <option key={code} value={code}>{isEs ? labels.es : labels.en}</option>
                ))}
              </select>
            </div>

            {/* Output format */}
            <div className="font-mono">
              <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-white" /> {isEs ? 'Formato de Salida' : 'Output Format'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['pdf', 'txt', 'json'] as const).map(fmt => (
                  <button key={fmt} type="button" onClick={() => setOutputFormat(fmt)}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === fmt ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}>
                    {fmt === 'pdf' && <FileText className="w-4 h-4" />}
                    {fmt === 'txt' && <FileSearch className="w-4 h-4" />}
                    {fmt === 'json' && <FileCode className="w-4 h-4" />}
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Page scope */}
            <div className="font-mono">
              <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-white" /> {isEs ? 'Páginas a Procesar' : 'Pages to Process'}
              </label>
              <div className="space-y-2">
                {(['all', 'custom'] as const).map(scope => (
                  <label key={scope} className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input type="radio" name="ocr-scope" checked={pageScope === scope} onChange={() => setPageScope(scope)} className="accent-white" />
                    <span>{scope === 'all' ? (isEs ? 'Todas las páginas' : 'All pages') : (isEs ? 'Páginas específicas (Ej: 1, 3-5)' : 'Specific pages (e.g. 1, 3-5)')}</span>
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {pageScope === 'custom' && (
                  <motion.input initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)}
                    placeholder="1, 3-5" className="w-full mt-2.5 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:border-white/50" />
                )}
              </AnimatePresence>
            </div>

            {/* Pre-processing */}
            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5 font-mono">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-white" /> {isEs ? 'Pre-procesamiento' : 'Pre-Processing'}
              </label>
              <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={enhanceContrast} onChange={e => setEnhanceContrast(e.target.checked)} className="accent-white w-4 h-4 rounded" />
                <span>{isEs ? 'Mejorar Contraste' : 'Enhance Contrast'}</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={numericMode} onChange={e => setNumericMode(e.target.checked)} className="accent-white w-4 h-4 rounded" />
                <span>{isEs ? 'Modo Numérico (Priorizar Números)' : 'Numeric Mode'}</span>
              </label>
            </div>

            {/* Text layer visibility */}
            <div className="font-mono">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-white" /> {isEs ? 'Visibilidad Capa de Texto' : 'Text Layer Visibility'}
                </label>
                <span className="text-xs font-bold text-white">{textOpacity === 0 ? (isEs ? 'Invisible' : 'Invisible') : `${textOpacity}%`}</span>
              </div>
              <input type="range" min={0} max={50} step={5} value={textOpacity} onChange={e => setTextOpacity(Number(e.target.value))} className="w-full accent-white cursor-pointer" />
              <span className="text-[9px] text-zinc-400 block mt-0.5">{isEs ? '0% = Capa invisible estándar (recomendado)' : '0% = Standard invisible layer (recommended)'}</span>
            </div>

            {/* PDF Metadata */}
            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5 font-mono">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-white" /> {isEs ? 'Metadatos del PDF Resultante' : 'Output PDF Metadata'}
              </label>
              {[
                { icon: <BookOpen className="w-3.5 h-3.5 text-zinc-400" />, label: isEs ? 'Título' : 'Title', val: metaTitle, set: setMetaTitle, ph: isEs ? 'Título del documento...' : 'Document title...' },
                { icon: <User className="w-3.5 h-3.5 text-zinc-400" />, label: isEs ? 'Autor' : 'Author', val: metaAuthor, set: setMetaAuthor, ph: isEs ? 'Nombre del autor...' : 'Author name...' },
                { icon: <FileText className="w-3.5 h-3.5 text-zinc-400" />, label: isEs ? 'Asunto' : 'Subject', val: metaSubject, set: setMetaSubject, ph: isEs ? 'Asunto o descripción...' : 'Subject or description...' },
              ].map(({ icon, label, val, set, ph }) => (
                <div key={label} className="flex items-center gap-2">
                  {icon}
                  <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="flex-1 p-2 bg-zinc-900 border border-white/10 rounded-lg text-[11px] font-mono text-white outline-none focus:border-white/30 placeholder:text-zinc-600" />
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {isProcessing && (
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                  <span className="truncate max-w-[200px]">{progressMsg}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                  <div style={{ width: `${progressPercent}%` }} className="h-full bg-white transition-all duration-300" />
                </div>
              </div>
            )}

            {/* Action button */}
            <button onClick={executeOcr} disabled={isProcessing || needsPassword}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
              <span>{isProcessing ? progressMsg : (isEs ? `Reconocer Texto (OCR) — ${pageScope === 'all' ? `${totalPages} pág.` : 'Selección'} →` : `Recognize Text (OCR) — ${pageScope === 'all' ? `${totalPages} pages` : 'Selection'} →`)}</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}