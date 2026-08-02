'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  Scissors, FileText, X, Loader2, Sliders, 
  UploadCloud, Plus, Check, Trash2, Layers3, LayoutGrid, Maximize2,
  ShieldCheck, ArrowLeft, Sparkles, Lock, Unlock, Eye, RefreshCw, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SplitWorkerMessageIn, SplitWorkerMessageOut } from '@/workers/pdf-split.worker';

type MainTab = 'rango' | 'paginas' | 'tamano';
type RangeSubMode = 'personalizado' | 'fijo' | 'inteligente';

interface RangeItem {
  id: string;
  from: number;
  to: number;
}

interface PageThumbnail {
  pageIndex: number;
  dataUrl: string;
  included: boolean;
}

export default function PdfSplitter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [totalPages, setTotalPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // PAGE THUMBNAILS & SELECTION
  const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // RESULTADOS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [createdCount, setCreatedCount] = useState<number>(0);

  // TABS Y MODOS DE RANGO
  const [mainTab, setMainTab] = useState<MainTab>('rango');
  const [rangeSubMode, setRangeSubMode] = useState<RangeSubMode>('personalizado');
  const [ranges, setRanges] = useState<RangeItem[]>([
    { id: '1', from: 1, to: 1 }
  ]);
  const [mergeAllRanges, setMergeAllRanges] = useState<boolean>(false);

  // OPCIONES AVANZADAS Y METADATOS
  const [extractMode, setExtractMode] = useState<'all' | 'specific' | 'even' | 'odd'>('all');
  const [specificPagesInput, setSpecificPagesInput] = useState<string>('1, 2, 3');
  const [chunkPageCount, setChunkPageCount] = useState<number>(5);
  const [createZip, setCreateZip] = useState<boolean>(true);
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Dividido');
  const [addPageFooterNumbering, setAddPageFooterNumbering] = useState<boolean>(false);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  // RENDERIZAR MINIATURAS REALES CON PDFJS
  const renderThumbnails = useCallback(async (pdfBuffer: ArrayBuffer, pass?: string) => {
    setIsLoadingThumbnails(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer), password: pass });
      const pdfjsDoc = await loadingTask.promise;
      const count = pdfjsDoc.numPages;

      setTotalPages(count);
      const thumbs: PageThumbnail[] = [];

      // Renderizar primeras 24 páginas en miniatura para alta respuesta
      const renderLimit = Math.min(count, 32);
      for (let i = 1; i <= renderLimit; i++) {
        const page = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas } as any).promise;
          thumbs.push({
            pageIndex: i - 1,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            included: true,
          });
        }
      }

      // Rellenar resto si el PDF es gigante
      for (let i = renderLimit + 1; i <= count; i++) {
        thumbs.push({
          pageIndex: i - 1,
          dataUrl: '',
          included: true,
        });
      }

      setPageThumbnails(thumbs);
      setIsEncrypted(false);
      setIsUnlocked(true);
    } catch (err: any) {
      if (err?.name === 'PasswordException' || err?.code === 1) {
        setIsEncrypted(true);
        setIsUnlocked(false);
        toast.warning(isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open');
      } else {
        console.error(err);
        toast.error(isEs ? 'Error al procesar las páginas del PDF' : 'Error processing PDF pages');
      }
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, [isEs]);

  // INSPECCIONAR PDF AL CARGAR ARCHIVO
  const inspectPdf = useCallback(async (selectedFile: File, pass?: string) => {
    try {
      const buffer = await selectedFile.arrayBuffer();
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, ""));

      // Intentar cargar con pdf-lib
      try {
        const pdfDoc = await PDFDocument.load(buffer, { password: pass, ignoreEncryption: true } as any);
        const count = pdfDoc.getPageCount();
        setTotalPages(count);
        setRanges([{ id: '1', from: 1, to: count }]);
      } catch (err: any) {
        // Encriptado
      }

      await renderThumbnails(buffer, pass);
    } catch (err) {
      toast.error(isEs ? 'Error al leer la estructura del PDF' : 'Error reading PDF structure');
    }
  }, [isEs, renderThumbnails]);

  useEffect(() => {
    if (file && totalPages === 0 && !isEncrypted) {
      inspectPdf(file);
    }
  }, [file, totalPages, isEncrypted, inspectPdf]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
        return;
      }
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setCreatedCount(0);
      setIsEncrypted(false);
      setIsUnlocked(false);
      setUnlockedPassword(undefined);
      setPasswordInput('');
      setTotalPages(0);
      inspectPdf(selected);
      toast.success(isEs ? 'Archivo cargado con éxito' : 'File loaded successfully');
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      const buffer = await file.arrayBuffer();
      await renderThumbnails(buffer, passwordInput);
      setUnlockedPassword(passwordInput);
      setIsUnlocked(true);
      setIsEncrypted(false);
      toast.success(isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF unlocked successfully!');
    } catch {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setDownloadUrl(null);
    setGlobalFile(null);
    setCreatedCount(0);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
    setPageThumbnails([]);
    setRanges([{ id: '1', from: 1, to: 1 }]);
  }, [setGlobalFile]);

  // TOGGLE INCLUSION DE PAGINA AL HACER CLICK EN MINIATURA
  const togglePageIncluded = (index: number) => {
    setPageThumbnails(prev => prev.map(p => p.pageIndex === index ? { ...p, included: !p.included } : p));
  };

  // MANEJO DE RANGOS MÚLTIPLES
  const handleAddRange = () => {
    if (totalPages === 0) return;
    const lastRange = ranges[ranges.length - 1];
    const newFrom = lastRange ? Math.min(lastRange.to + 1, totalPages) : 1;
    const newTo = totalPages;
    setRanges(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, from: newFrom, to: newTo }]);
    setDownloadUrl(null);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length === 1) return;
    setRanges(prev => prev.filter(r => r.id !== id));
    setDownloadUrl(null);
  };

  const handleUpdateRange = (id: string, field: 'from' | 'to', value: number) => {
    const val = Math.max(1, Math.min(totalPages || 1, value));
    setRanges(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: val };
        if (field === 'from' && updated.from > updated.to) updated.to = updated.from;
        if (field === 'to' && updated.to < updated.from) updated.from = updated.to;
        return updated;
      }
      return r;
    }));
    setDownloadUrl(null);
  };

  // EXECUTE SPLIT WITH WEB WORKER
  const executeSplit = async () => {
    if (!file || totalPages === 0) {
      toast.error(isEs ? 'Por favor carga un archivo PDF' : 'Please upload a PDF file');
      return;
    }

    if (isEncrypted && !isUnlocked) {
      toast.error(isEs ? 'Desbloquea el PDF con su contraseña antes de dividir' : 'Unlock PDF with password before splitting');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando Web Worker acelerado...' : 'Starting Web Worker...');

    try {
      const buffer = await file.arrayBuffer();

      let pageGroups: number[][] = [];

      if (mainTab === 'rango') {
        if (rangeSubMode === 'personalizado') {
          pageGroups = ranges.map(r => {
            const indices: number[] = [];
            const start = Math.max(0, r.from - 1);
            const end = Math.min(totalPages - 1, r.to - 1);
            for (let i = start; i <= end; i++) {
              if (pageThumbnails[i] ? pageThumbnails[i].included : true) {
                indices.push(i);
              }
            }
            return indices;
          }).filter(g => g.length > 0);
        } else if (rangeSubMode === 'fijo') {
          const chunkSize = Math.max(1, chunkPageCount);
          for (let i = 0; i < totalPages; i += chunkSize) {
            const chunk: number[] = [];
            for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) {
              if (pageThumbnails[j] ? pageThumbnails[j].included : true) chunk.push(j);
            }
            if (chunk.length > 0) pageGroups.push(chunk);
          }
        } else {
          // Inteligente (divide cada 10 páginas)
          const chunkSize = 10;
          for (let i = 0; i < totalPages; i += chunkSize) {
            const chunk: number[] = [];
            for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) {
              if (pageThumbnails[j] ? pageThumbnails[j].included : true) chunk.push(j);
            }
            if (chunk.length > 0) pageGroups.push(chunk);
          }
        }
      } else if (mainTab === 'paginas') {
        if (extractMode === 'all') {
          for (let i = 0; i < totalPages; i++) {
            if (pageThumbnails[i] ? pageThumbnails[i].included : true) pageGroups.push([i]);
          }
        } else if (extractMode === 'even') {
          const evens: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            if ((i + 1) % 2 === 0 && (pageThumbnails[i] ? pageThumbnails[i].included : true)) evens.push(i);
          }
          if (evens.length > 0) pageGroups.push(evens);
        } else if (extractMode === 'odd') {
          const odds: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            if ((i + 1) % 2 !== 0 && (pageThumbnails[i] ? pageThumbnails[i].included : true)) odds.push(i);
          }
          if (odds.length > 0) pageGroups.push(odds);
        } else {
          const indices: Set<number> = new Set();
          specificPagesInput.split(',').forEach(p => {
            const num = parseInt(p.trim(), 10);
            if (!isNaN(num) && num >= 1 && num <= totalPages) indices.add(num - 1);
          });
          const sorted = Array.from(indices).sort((a, b) => a - b);
          if (sorted.length > 0) pageGroups.push(sorted);
        }
      } else {
        // TAB TAMAÑO
        const size = Math.max(1, chunkPageCount);
        for (let i = 0; i < totalPages; i += size) {
          const chunk: number[] = [];
          for (let j = i; j < Math.min(i + size, totalPages); j++) {
            if (pageThumbnails[j] ? pageThumbnails[j].included : true) chunk.push(j);
          }
          if (chunk.length > 0) pageGroups.push(chunk);
        }
      }

      if (pageGroups.length === 0) {
        toast.error(isEs ? 'No se seleccionaron páginas válidas para dividir' : 'No valid pages selected for splitting');
        setIsProcessing(false);
        return;
      }

      const worker = new Worker(new URL('../workers/pdf-split.worker.ts', import.meta.url), { type: 'module' });

      const bufferCopy = buffer.slice(0);
      const payload: SplitWorkerMessageIn = {
        action: 'split',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        pageGroups,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Dividido',
          createZip,
          mergeAllRanges,
          addPageFooterNumbering,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          }
        }
      };

      const result = await new Promise<{ buffer: ArrayBuffer; filename: string; isZip: boolean; createdCount: number }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<SplitWorkerMessageOut>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            setProgressPercent(msg.percent);
            setProgressMsg(msg.message);
          } else if (msg.type === 'result') {
            resolve({
              buffer: msg.buffer,
              filename: msg.filename,
              isZip: msg.isZip,
              createdCount: msg.createdCount,
            });
          } else if (msg.type === 'error') {
            reject(new Error(msg.message));
          }
        };

        worker.onerror = (err) => reject(err);

        worker.postMessage(payload, [bufferCopy]);
      });

      worker.terminate();

      const blob = new Blob([result.buffer], { type: result.isZip ? 'application/zip' : 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);

      setDownloadUrl(localUrl);
      setDownloadFilename(result.filename);
      setCreatedCount(result.createdCount);

      // Trigger instant download
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Documento dividido con éxito!' : 'Document split successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || (isEs ? 'Error al dividir el documento PDF' : 'Error splitting PDF document'));
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
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/organizar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "002 / CORTE Y DIVISIÓN DE DOCUMENTOS PDF" : "002 / PDF CUTTING & SPLITTING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Scissors className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF" : "SPLIT OR EXTRACT PDF PAGES"}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button 
              onClick={removeFile} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Quitar archivo" : "Remove file"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* VISTA DROPZONE VACÍA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer"
        >
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? "DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF" : "SPLIT OR EXTRACT PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Separa o extrae rangos de páginas de tu PDF de forma 100% confidencial y local." : "Split or extract ranges of pages from your PDF 100% locally."}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISTA PREVIA DE RANGOS DE HOJAS */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: REJILLA DE MINIATURAS REALES Y RANGOS DE HOJAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISOR Y MINIATURAS DE PÁGINAS (${totalPages} PÁGINAS)` : `001 / PAGE THUMBNAILS & PREVIEW (${totalPages} PAGES)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {/* DETALLES DEL ARCHIVO CARGADO Y WIDGET DE CONTRASEÑA */}
            <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl mb-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-white font-bold block truncate">{file.name}</span>
                    <span className="text-[10px] text-zinc-400">{formatFileSize(file.size)} • {totalPages} {isEs ? 'páginas en total' : 'total pages'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUnlocked && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> {isEs ? "Desbloqueado" : "Unlocked"}
                    </span>
                  )}
                  <button onClick={removeFile} className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ENCRYPTED PASSWORD WIDGET */}
              {isEncrypted && !isUnlocked && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>{isEs ? "Este PDF está protegido con contraseña" : "This PDF is password protected"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder={isEs ? "Ingresa la contraseña de apertura..." : "Enter open password..."}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && unlockFileWithPassword()}
                      className="flex-1 bg-zinc-900 border border-white/15 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-white/40"
                    />
                    <button
                      onClick={unlockFileWithPassword}
                      className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isEs ? "Desbloquear" : "Unlock"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* VISUALIZADOR GRAFICO DE MINIATURAS REALES EN GRILLA 4x4 */}
            <div className="flex-1 overflow-y-auto max-h-[580px] pr-2 font-mono">
              {isLoadingThumbnails ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="text-xs font-bold">{isEs ? 'Generando vistas previas de páginas en 4x4...' : 'Generating 4x4 page previews...'}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {pageThumbnails.map((p) => (
                    <div
                      key={p.pageIndex}
                      onClick={() => togglePageIncluded(p.pageIndex)}
                      className={`relative bg-zinc-950 border ${p.included ? 'border-white/20 hover:border-white/40' : 'border-red-500/30 opacity-40'} rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-md">
                          #{p.pageIndex + 1}
                        </span>
                        <div className={`p-1 rounded-md border ${p.included ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {p.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                      </div>

                      <div className="w-full h-40 bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 relative">
                        {p.dataUrl ? (
                          <img src={p.dataUrl} alt={`Página ${p.pageIndex + 1}`} className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                            <FileText className="w-6 h-6" />
                            <span className="text-[9px]">Pág. {p.pageIndex + 1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-5 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* TABS SUPERIORES [0-0] RANGO, PÁGINAS, TAMAÑO */}
              <div className="grid grid-cols-3 border border-white/10 bg-zinc-950 rounded-xl overflow-hidden mb-5 p-1 gap-1 font-mono">
                <button
                  onClick={() => setMainTab('rango')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'rango' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers3 className="w-4 h-4" />
                  <span>{isEs ? 'Rango' : 'Range'}</span>
                </button>

                <button
                  onClick={() => setMainTab('paginas')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'paginas' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{isEs ? 'Páginas' : 'Pages'}</span>
                </button>

                <button
                  onClick={() => setMainTab('tamano')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'tamano' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>{isEs ? 'Tamaño' : 'Size'}</span>
                </button>
              </div>

              {/* CONTENIDO TAB 1: RANGO */}
              {mainTab === 'rango' && (
                <div className="space-y-4 font-mono">
                  <div>
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Rango:" : "Range Mode:"}</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setRangeSubMode('personalizado')}
                        className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          rangeSubMode === 'personalizado' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Personalizado' : 'Custom'}
                      </button>

                      <button
                        onClick={() => setRangeSubMode('fijo')}
                        className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          rangeSubMode === 'fijo' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Fijo (1 pág / PDF)' : 'Fixed (1 pg / PDF)'}
                      </button>

                      <button
                        onClick={() => setRangeSubMode('inteligente')}
                        className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          rangeSubMode === 'inteligente' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Inteligente' : 'Smart'}
                      </button>
                    </div>
                  </div>

                  {rangeSubMode === 'personalizado' && (
                    <>
                      {/* CONTROLES DE RANGOS PERSONALIZADOS */}
                      <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                        {ranges.map((r, idx) => (
                          <div key={r.id} className="bg-zinc-950 border border-white/10 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-white">
                              <span>{isEs ? `Rango ${idx + 1}` : `Range ${idx + 1}`}</span>
                              {ranges.length > 1 && (
                                <button onClick={() => handleRemoveRange(r.id)} className="text-zinc-400 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-300">
                              <span className="text-[10px] text-zinc-400">{isEs ? "de la página" : "from page"}</span>
                              <input
                                type="number" min={1} max={totalPages || 100} value={r.from}
                                onChange={(e) => handleUpdateRange(r.id, 'from', parseInt(e.target.value, 10) || 1)}
                                className="w-14 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                              />
                              <span className="text-[10px] text-zinc-400">{isEs ? "a" : "to"}</span>
                              <input
                                type="number" min={1} max={totalPages || 100} value={r.to}
                                onChange={(e) => handleUpdateRange(r.id, 'to', parseInt(e.target.value, 10) || 1)}
                                className="w-14 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddRange}
                          className="flex-1 border border-white/20 hover:border-white/40 bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isEs ? 'Añadir Rango' : 'Add Range'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (totalPages === 0) return;
                            const newRanges: RangeItem[] = [];
                            for (let i = 1; i <= totalPages; i++) {
                              newRanges.push({ id: `range-${i}`, from: i, to: i });
                            }
                            setRanges(newRanges);
                            toast.success(isEs ? `Se crearon ${totalPages} rangos (1 página cada uno)` : `Created ${totalPages} ranges (1 page each)`);
                          }}
                          className="px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title={isEs ? "Crear 1 rango por cada página del PDF" : "Create 1 range per PDF page"}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isEs ? '1 pág / PDF' : '1 pg / PDF'}</span>
                        </button>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-bold text-zinc-300 pt-1">
                        <input
                          type="checkbox" checked={mergeAllRanges} onChange={(e) => setMergeAllRanges(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? 'Unir todos los rangos en un único PDF.' : 'Merge all ranges into single PDF.'}</span>
                      </label>
                    </>
                  )}

                  {rangeSubMode === 'fijo' && (
                    <div className="bg-zinc-950 border border-white/10 p-3.5 rounded-xl space-y-2.5">
                      <label className="text-[11px] text-zinc-300 font-bold block">
                        {isEs ? "Bloques de páginas por PDF:" : "Page block size per PDF:"}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{isEs ? "Dividir cada" : "Split every"}</span>
                        <input
                          type="number" min={1} max={totalPages || 100} value={chunkPageCount}
                          onChange={(e) => setChunkPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-20 bg-zinc-900 border border-white/20 rounded-lg p-1.5 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                        />
                        <span className="text-xs text-zinc-400">{isEs ? "página(s)" : "page(s)"}</span>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-mono">
                        {isEs 
                          ? `✓ Se generarán ${Math.ceil((totalPages || 1) / Math.max(1, chunkPageCount))} archivos PDF (${createZip ? 'empaquetados en .ZIP' : 'descarga directa'})`
                          : `✓ Will generate ${Math.ceil((totalPages || 1) / Math.max(1, chunkPageCount))} PDF files (${createZip ? 'packaged in .ZIP' : 'direct download'})`}
                      </p>
                    </div>
                  )}

                  {rangeSubMode === 'inteligente' && (
                    <div className="bg-zinc-950 border border-white/10 p-3.5 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-white block">🧠 {isEs ? 'División Inteligente Individual' : 'Smart Individual Split'}</span>
                      <p className="text-[11px] text-zinc-400">
                        {isEs 
                          ? `Cada una de las ${totalPages} páginas del documento se dividirá automáticamente en un archivo PDF independiente (total: ${totalPages} PDFs en 1 archivo .ZIP).`
                          : `Each of the ${totalPages} pages will be automatically split into an independent PDF file (total: ${totalPages} PDFs in 1 .ZIP file).`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO TAB 2: PÁGINAS */}
              {mainTab === 'paginas' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'all'} onChange={() => setExtractMode('all')} className="accent-white" />
                      <span>{isEs ? 'Extraer todas las páginas (1 PDF / pág)' : 'Extract every page (1 PDF / page)'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'even'} onChange={() => setExtractMode('even')} className="accent-white" />
                      <span>{isEs ? 'Extraer solo páginas pares' : 'Extract even pages only'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'odd'} onChange={() => setExtractMode('odd')} className="accent-white" />
                      <span>{isEs ? 'Extraer solo páginas impares' : 'Extract odd pages only'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'specific'} onChange={() => setExtractMode('specific')} className="accent-white" />
                      <span>{isEs ? 'Extraer páginas específicas' : 'Extract specific pages'}</span>
                    </label>
                  </div>

                  {extractMode === 'specific' && (
                    <input
                      type="text" value={specificPagesInput} onChange={(e) => setSpecificPagesInput(e.target.value)}
                      placeholder="1, 3, 5"
                      className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-white/50"
                    />
                  )}
                </div>
              )}

              {/* CONTENIDO TAB 3: TAMAÑO */}
              {mainTab === 'tamano' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">{isEs ? "Dividir cada N páginas:" : "Chunk every N pages:"}</label>
                    <input
                      type="number" min={1} max={totalPages || 100} value={chunkPageCount}
                      onChange={(e) => setChunkPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-white/50"
                    />
                  </div>
                </div>
              )}

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-3 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo de Archivos:" : "Output File Prefix:"}</label>
                  <input
                    type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Corte"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "OPCIONES DE SALIDA" : "OUTPUT OPTIONS"}</label>
                  
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" checked={createZip} onChange={(e) => setCreateZip(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>{isEs ? "Empaquetar en archivo .ZIP (2+ partes)" : "Package into .ZIP file"}</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" checked={addPageFooterNumbering} onChange={(e) => setAddPageFooterNumbering(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>{isEs ? "Re-numerar páginas en pie de página" : "Re-number pages in footer"}</span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">{isEs ? "METADATOS DEL PDF DIVIDIDO" : "SPLIT PDF METADATA"}</label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Título:" : "Title:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Documento_Fragmentado" : "Ex: Split_Document"}
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Autor / Organización:" : "Author / Organization:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Mi Empresa S.A." : "Ex: Company Inc."}
                      value={docAuthor}
                      onChange={(e) => setDocAuthor(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Asunto / Descripción:" : "Subject / Description:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: División de expedientes corporativos" : "Ex: Merged corporate records"}
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
                    <div style={{ width: `${progressPercent}%` }} className="h-full bg-white transition-all duration-300" />
                  </div>
                </div>
              )}

              <button 
                onClick={executeSplit} 
                disabled={isProcessing || !file || (isEncrypted && !isUnlocked)} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (!file ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') : (isEs ? 'Dividir Documento (Corte) →' : 'Split Document (Cut) →'))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}