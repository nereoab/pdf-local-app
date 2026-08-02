'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Hash, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, FileText, 
  Trash2, Plus, LayoutGrid, Check, UploadCloud, Sliders, Lock, Unlock
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NumberWorkerMessageIn, NumberWorkerMessageOut, Position9 } from '@/workers/pdf-number.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';

export default function PdfFoliador() {
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

  // Opciones Principales de Foliado
  const [pageMode, setPageMode] = useState<'single' | 'facing'>('single');
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [textFormat, setTextFormat] = useState<string>('only-number');
  const [customPrefix, setCustomPrefix] = useState<string>('Folio');

  // Opciones Avanzadas
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Foliado');
  const [margin, setMargin] = useState<'small' | 'recommended' | 'big'>('recommended');
  const [fontSizeOption, setFontSizeOption] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontColor, setFontColor] = useState<string>('dark');
  const [numberStyle, setNumberStyle] = useState<'arabic' | 'padded' | 'roman'>('arabic');
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  const [firstNumber, setFirstNumber] = useState<number>(1);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadThumbnails = useCallback(async (selectedFile: File, pass?: string) => {
    setIsLoadingThumbs(true);
    setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, "") + '_Foliado');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: buffer, password: pass });
      const pdfDoc = await loadingTask.promise;

      setTotalPages(pdfDoc.numPages);
      setStartPage(1);
      setEndPage(pdfDoc.numPages);

      const thumbs: string[] = [];
      const countToRender = Math.min(pdfDoc.numPages, 32);

      for (let i = 1; i <= countToRender; i++) {
        if (i % 4 === 0) await new Promise(r => setTimeout(r, 5));
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
          thumbs.push(canvas.toDataURL());
        }
      }

      for (let i = countToRender + 1; i <= pdfDoc.numPages; i++) {
        thumbs.push('');
      }

      setPageThumbnails(thumbs);
      setIsEncrypted(false);
      setIsUnlocked(true);
      toast.success(isEs ? `${pdfDoc.numPages} páginas listas para foliado` : `${pdfDoc.numPages} pages ready for numbering`);
    } catch (err: any) {
      if (err?.name === 'PasswordException' || err?.code === 1) {
        setIsEncrypted(true);
        setIsUnlocked(false);
        toast.warning(isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open');
      } else {
        console.error("Error al cargar miniaturas:", err);
        toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
      }
    } finally {
      setIsLoadingThumbs(false);
    }
  }, [isEs]);

  useEffect(() => {
    if (file && pageThumbnails.length === 0 && !isEncrypted) {
      loadThumbnails(file);
    }
  }, [file, pageThumbnails.length, isEncrypted, loadThumbnails]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
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
      toast.success(isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF unlocked successfully!');
    } catch {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setUnlockedPassword(undefined);
  };

  // Mapeo visual de punto rojo de posición según matriz 3x3
  const getDotPositionStyle = (pos: Position9) => {
    switch (pos) {
      case 'top-left': return 'top-3 left-3';
      case 'top-center': return 'top-3 left-1/2 -translate-x-1/2';
      case 'top-right': return 'top-3 right-3';
      case 'center-left': return 'top-1/2 -translate-y-1/2 left-3';
      case 'center': return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
      case 'center-right': return 'top-1/2 -translate-y-1/2 right-3';
      case 'bottom-left': return 'bottom-3 left-3';
      case 'bottom-center': return 'bottom-3 left-1/2 -translate-x-1/2';
      case 'bottom-right': return 'bottom-3 right-3';
      default: return 'bottom-3 right-3';
    }
  };

  // EJECUCIÓN CON WEB WORKER
  const executeFoliado = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first.");
      return;
    }

    if (isEncrypted && !isUnlocked) {
      toast.error(isEs ? 'Desbloquea el PDF con su contraseña antes de procesar' : 'Unlock PDF with password before processing');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando Web Worker acelerado...' : 'Starting Web Worker...');

    try {
      const buffer = await file.arrayBuffer();
      const bufferCopy = buffer.slice(0);

      const worker = new Worker(new URL('../workers/pdf-number.worker.ts', import.meta.url), { type: 'module' });

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
          numberStyle,
          skipFirstPage,
          firstNumber,
          startPage,
          endPage,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          }
        }
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>((resolve, reject) => {
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
      });

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
      toast.success(isEs ? '¡Documento foliado! Tu archivo está listo.' : 'PDF numbered! Your file is ready.');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || (isEs ? 'Error al foliar el documento.' : 'Failed to number PDF.'));
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "002 / FOLIADO Y NUMERACIÓN DE PÁGINAS" : "002 / PAGE NUMBERING & FOLIOS"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Hash className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "NUMERACIÓN O FOLIADO DE PÁGINAS DE DOCUMENTOS PDF" : "NUMBERING OR FOLIOS OF PDF PAGES"}
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
              onClick={handleRemoveFile} 
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
            {isEs ? "NUMERACIÓN O FOLIADO DE PÁGINAS DE DOCUMENTOS PDF" : "NUMBERING OR FOLIOS OF PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Inserta numeración correlativa y foliados personalizados 100% de forma local." : "Insert customizable page numbers 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL DE OPCIONES */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS EN CUADRÍCULA 4x4 */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA (${totalPages} PÁGINAS)` : `001 / PAGES PREVIEW (${totalPages} PAGES)`}</span>
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
                  <span>{isEs ? "Este PDF está protegido con contraseña" : "This PDF is password protected"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder={isEs ? "Ingresa la contraseña de apertura..." : "Enter open password..."}
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
                    <span>{isEs ? "Desbloquear" : "Unlock"}</span>
                  </button>
                </div>
              </div>
            )}

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">{isEs ? "Generando vista previa de miniaturas..." : "Generating page thumbnails..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isIncluded = pageNum >= startPage && pageNum <= endPage && !(skipFirstPage && pageNum === 1);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-zinc-950 border ${isIncluded ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 opacity-30'} rounded-xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                    >
                      {/* Número de página etiqueta top-left */}
                      <span className="absolute top-2 left-2 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                        {pageNum}
                      </span>

                      {/* Imagen miniatura */}
                      {typeof thumb === 'string' && thumb.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-md bg-white shadow-inner" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-zinc-600 text-xs font-mono font-bold">
                          {pageNum}
                        </div>
                      )}

                      {/* PUNTO ROJO DE POSICIÓN DE NUMERACIÓN */}
                      {isIncluded && (
                        <div className={`absolute z-30 ${getDotPositionStyle(position)} transition-all duration-300`}>
                          <span className="relative flex h-4 w-4 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border border-white shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

              {/* 1. MODO DE PÁGINA */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Página" : "Page mode"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPageMode('single')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${pageMode === 'single' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${pageMode === 'single' ? 'opacity-100' : 'opacity-0'}`} />
                    {isEs ? "Página suelta" : "Single page"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPageMode('facing')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${pageMode === 'facing' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${pageMode === 'facing' ? 'opacity-100' : 'opacity-0'}`} />
                    {isEs ? "Enfrentadas" : "Facing pages"}
                  </button>
                </div>
              </div>

              {/* 2. MATRIZ 3x3 DE SELECCIÓN DE POSICIÓN */}
              <div className="mb-5 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">{isEs ? "Posición:" : "Position:"}</label>
                  <span className="text-[10px] font-mono text-zinc-300 font-bold">{position.replace('-', ' ').toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 border border-white/10 rounded-xl shadow-inner">
                  {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position9[]).map((pos) => {
                    const isSelected = position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`h-11 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}
                      >
                        <span className={`w-3 h-3 rounded-full transition-transform ${isSelected ? 'bg-red-600 border-2 border-white scale-110 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'bg-zinc-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. FORMATO DE TEXTO */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Formato de Texto:" : "Text format:"}</label>
                <select 
                  value={textFormat} 
                  onChange={e => setTextFormat(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-mono text-white outline-none cursor-pointer focus:border-white/30"
                >
                  <option value="only-number">{isEs ? "Solo número de página (Recomendado)" : "Only page number (Recommended)"}</option>
                  <option value="page-n-of-p">{isEs ? "Página {n} de {p}" : "Page {n} of {p}"}</option>
                  <option value="folio-n">{isEs ? "Folio {n}" : "Folio {n}"}</option>
                  <option value="custom">{isEs ? "Texto personalizado..." : "Custom text..."}</option>
                </select>

                {textFormat === 'custom' && (
                  <input 
                    type="text" 
                    placeholder="Ej: Expediente 2026" 
                    value={customPrefix} 
                    onChange={e => setCustomPrefix(e.target.value)} 
                    className="w-full mt-2 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:border-white/50" 
                  />
                )}
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-4 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo del Archivo Resultante:" : "Output File Prefix:"}</label>
                  <input
                    type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Foliado"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                {/* A. ESTILO DE NUMERACIÓN */}
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Estilo de Numeración:" : "Numbering Style:"}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => setNumberStyle('arabic')}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${numberStyle === 'arabic' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'}`}
                    >
                      1, 2, 3
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNumberStyle('padded')}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${numberStyle === 'padded' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'}`}
                    >
                      01, 02, 03
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNumberStyle('roman')}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${numberStyle === 'roman' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'}`}
                    >
                      I, II, III
                    </button>
                  </div>
                </div>

                {/* B. MARGEN */}
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Margen del Foliado:" : "Margin:"}</label>
                  <select 
                    value={margin} 
                    onChange={e => setMargin(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30 font-mono"
                  >
                    <option value="recommended">{isEs ? "Recomendado (1 cm)" : "Recommended (1 cm)"}</option>
                    <option value="small">{isEs ? "Pequeño (0.5 cm)" : "Small (0.5 cm)"}</option>
                    <option value="big">{isEs ? "Grande (2 cm)" : "Big (2 cm)"}</option>
                  </select>
                </div>

                {/* C. TAMAÑO DE LETRA Y COLOR DEL TEXTO */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Tamaño Letra:" : "Font Size:"}</label>
                    <select 
                      value={fontSizeOption} 
                      onChange={e => setFontSizeOption(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30 font-mono"
                    >
                      <option value="small">{isEs ? "Pequeño (10pt)" : "Small (10pt)"}</option>
                      <option value="medium">{isEs ? "Normal (13pt)" : "Normal (13pt)"}</option>
                      <option value="large">{isEs ? "Grande (16pt)" : "Large (16pt)"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Color Texto:" : "Text Color:"}</label>
                    <select 
                      value={fontColor} 
                      onChange={e => setFontColor(e.target.value)}
                      className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30 font-mono"
                    >
                      <option value="dark">{isEs ? "Negro / Oscuro" : "Dark / Black"}</option>
                      <option value="red">{isEs ? "Rojo" : "Red"}</option>
                      <option value="blue">{isEs ? "Azul" : "Blue"}</option>
                      <option value="white">{isEs ? "Blanco" : "White"}</option>
                    </select>
                  </div>
                </div>

                {/* D. OMITIR PRIMERA PÁGINA (PORTADA) */}
                <div 
                  onClick={() => setSkipFirstPage(!skipFirstPage)}
                  className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-all font-mono"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${skipFirstPage ? 'bg-white border-white text-black' : 'border-zinc-600'}`}>
                    {skipFirstPage && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                  <span className="text-xs text-zinc-300 font-semibold">{isEs ? "Omitir numeración en 1ª página (Portada)" : "Skip numbering on page 1 (Cover)"}</span>
                </div>

                {/* E. PRIMER NÚMERO Y RANGO */}
                <div className="space-y-2.5 pt-1 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">{isEs ? "Primer Número y Rango:" : "First number & Range:"}</label>
                  
                  <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-white/10 text-xs">
                    <span className="text-zinc-400">{isEs ? "Primer número:" : "First number:"}</span>
                    <input 
                      type="number" 
                      min={1} 
                      value={firstNumber} 
                      onChange={e => setFirstNumber(Number(e.target.value))} 
                      className="w-20 p-1.5 bg-zinc-950 border border-white/10 rounded-lg text-center text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>

                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">{isEs ? "Desde pág:" : "From page:"}</span>
                    <input 
                      type="number" min={1} max={totalPages || 1} 
                      value={startPage} 
                      onChange={e => setStartPage(Number(e.target.value))} 
                      className="w-16 p-1.5 bg-zinc-950 border border-white/10 rounded-lg text-center text-white outline-none focus:border-white/30 font-mono"
                    />
                    <span className="text-zinc-400">{isEs ? "hasta:" : "to:"}</span>
                    <input 
                      type="number" min={1} max={totalPages || 1} 
                      value={endPage} 
                      onChange={e => setEndPage(Number(e.target.value))} 
                      className="w-16 p-1.5 bg-zinc-950 border border-white/10 rounded-lg text-center text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">{isEs ? "METADATOS DEL PDF FOLIADO" : "NUMBERED PDF METADATA"}</label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Título:" : "Title:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Documento_Foliado_2026" : "Ex: Numbered_Document_2026"}
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
                      placeholder={isEs ? "Ej: Foliado de expediente" : "Ex: Document folios"}
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

              {completedResult ? (
                <DownloadSuccessCard
                  downloadUrl={completedResult.downloadUrl}
                  filename={completedResult.filename}
                  fileSize={completedResult.fileSize}
                  outputFormat="pdf"
                  rawBlob={completedResult.rawBlob}
                  onReset={() => setCompletedResult(null)}
                />
              ) : (
                <button 
                  onClick={executeFoliado} 
                  disabled={isProcessing || !file || (isEncrypted && !isUnlocked)} 
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                  <span>
                    {isProcessing 
                      ? progressMsg 
                      : (!file 
                          ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') 
                          : (isEs ? 'Añadir números de página →' : 'Add page numbers →'))}
                  </span>
                </button>
              )}
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}