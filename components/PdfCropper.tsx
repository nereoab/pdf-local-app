'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  Crop, FileText, X, Loader2, Sliders, 
  UploadCloud, Sparkles, ZoomIn, ChevronLeft, ChevronRight, RefreshCw,
  ShieldCheck, ArrowLeft, Lock, Unlock, LayoutGrid, Plus, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CropWorkerMessageIn, CropWorkerMessageOut, CropScope } from '@/workers/pdf-crop.worker';

export default function PdfCropper() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // MÁRGENES DE RECORTE EN MM
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [marginLeft, setMarginLeft] = useState<number>(10);
  const [marginRight, setMarginRight] = useState<number>(10);
  const [cropScope, setCropScope] = useState<CropScope>('all');

  // RESULTADOS Y PREVIAS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // OPCIONES AVANZADAS Y METADATOS
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Recortado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<boolean>(false);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  // Cargar PDF y renderizar vista previa de la página actual
  const renderCurrentPage = useCallback(async (selectedFile: File, pageNum: number, pass?: string) => {
    setIsProcessing(true);
    setProgressMsg(isEs ? `Cargando vista previa pág ${pageNum}...` : `Loading preview page ${pageNum}...`);
    setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, "") + '_Recortado');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: pass });
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);

      const targetPageNum = Math.max(1, Math.min(pdf.numPages, pageNum));
      const page = await pdf.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: 0.8 });

      setPageSize({ width: Math.round(viewport.width), height: Math.round(viewport.height) });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        setPageDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      }

      setIsEncrypted(false);
      setIsUnlocked(true);
    } catch (error: any) {
      if (error?.name === 'PasswordException' || error?.code === 1) {
        setIsEncrypted(true);
        setIsUnlocked(false);
        toast.warning(isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open');
      } else {
        console.error(error);
        toast.error(isEs ? 'Error al renderizar página del PDF' : 'Error rendering PDF page');
      }
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  }, [isEs]);

  useEffect(() => {
    if (file && !isEncrypted) {
      renderCurrentPage(file, currentPage, unlockedPassword);
    }
  }, [file, currentPage, isEncrypted, unlockedPassword, renderCurrentPage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setCurrentPage(1);
        setDownloadUrl(null);
        setIsEncrypted(false);
        setIsUnlocked(false);
        setUnlockedPassword(undefined);
        setPasswordInput('');
        await renderCurrentPage(selected, 1);
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      await renderCurrentPage(file, currentPage, passwordInput);
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
    setPageDataUrl(null);
    setDownloadUrl(null);
    setGlobalFile(null);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
  }, [setGlobalFile]);

  const applyPreset = (mm: number) => {
    setMarginTop(mm);
    setMarginBottom(mm);
    setMarginLeft(mm);
    setMarginRight(mm);
    setDownloadUrl(null);
    toast.info(isEs ? `Márgenes ajustados a ${mm} mm` : `Margins adjusted to ${mm} mm`);
  };

  const resetMargins = () => {
    setMarginTop(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setMarginRight(0);
    setDownloadUrl(null);
  };

  // EJECUCIÓN CON WEB WORKER
  const executeCrop = async () => {
    if (!file) {
      toast.error(isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file');
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

      const worker = new Worker(new URL('../workers/pdf-crop.worker.ts', import.meta.url), { type: 'module' });

      const payload: CropWorkerMessageIn = {
        action: 'crop',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Recortado',
          renumberPages,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
          cropScope,
          currentPage,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          }
        }
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<CropWorkerMessageOut>) => {
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
      const outName = `${filePrefix.trim() || 'Documento_Recortado'}.pdf`;

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);

      // Trigger download
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = outName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgressPercent(100);
      toast.success(isEs ? '¡Márgenes del PDF recortados con éxito!' : 'PDF margins cropped successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || (isEs ? 'Error al recortar los márgenes del PDF' : 'Error cropping PDF margins'));
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
              {isEs ? "002 / RECORTE Y AJUSTE DE MÁRGENES PDF" : "002 / PDF MARGIN CROPPING & ADJUSTMENT"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Crop className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "RECORTAR MÁRGENES DE DOCUMENTOS PDF" : "CROP PDF MARGINS"}
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
            {isEs ? "RECORTAR MÁRGENES DE DOCUMENTOS PDF" : "CROP PDF MARGINS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Recorta los márgenes superior, inferior y laterales de tu PDF de forma 100% confidencial y local." : "Crop top, bottom, left, and right margins of your PDF 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISOR DE PÁGINA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: VISOR INTERACTIVO CROP BOX */}
          <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA Y ÁREA CONSERVADA` : `001 / PREVIEW & CONSERVED AREA`}</span>
              </div>

              {/* NAVEGADOR DE PÁGINAS Y CONTROLES */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 px-2 py-1 rounded-xl text-xs font-mono">
                  <button
                    type="button" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white font-bold text-[11px]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
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

            {/* DETALLES DEL ARCHIVO CARGADO */}
            <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl mb-4 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-white flex-shrink-0" />
                <div className="truncate">
                  <span className="text-white font-bold block truncate">{file.name}</span>
                  <span className="text-[10px] text-zinc-400">{formatFileSize(file.size)} • {pageSize.width}x{pageSize.height}px • {totalPages} {isEs ? 'páginas en total' : 'total pages'}</span>
                </div>
              </div>
              <button type="button" onClick={removeFile} className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* CONTENEDOR CANVAS DE PÁGINA CON OVERLAY DE MÁRGENES DE RECORTE (CROP BOX) */}
            <div className="relative w-full flex-1 min-h-[460px] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center p-4 shadow-inner border border-white/5 font-mono">
              {pageDataUrl ? (
                <div className="relative inline-block max-h-full max-w-full shadow-2xl rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pageDataUrl} alt={`Página ${currentPage}`} className="max-h-[440px] max-w-full object-contain block rounded" />

                  {/* OVERLAY VISUAL DE MÁRGENES DE RECORTE (CROP BOX DESTELLANTE) */}
                  <div 
                    className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none transition-all duration-200 rounded shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    style={{
                      top: `${(marginTop / 297) * 100}%`,
                      bottom: `${(marginBottom / 297) * 100}%`,
                      left: `${(marginLeft / 210) * 100}%`,
                      right: `${(marginRight / 210) * 100}%`,
                    }}
                  >
                    <span className="absolute top-1 left-2 text-[9px] font-mono font-bold bg-white text-black px-1.5 py-0.5 rounded shadow uppercase">
                      Área Conservada
                    </span>
                  </div>

                  <button
                    type="button" onClick={() => setPreviewZoom(true)}
                    className="absolute bottom-2 right-2 p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-white/20"
                    title={isEs ? "Zoom" : "Zoom"}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              )}
            </div>

          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
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

              {/* MODO DE ALCANCE DEL RECORTE */}
              <div className="space-y-4 font-mono text-xs mb-5">
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Alcance del Recorte:" : "Crop Scope:"}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button" onClick={() => setCropScope('all')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'all' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Todas' : 'All'}
                    </button>

                    <button
                      type="button" onClick={() => setCropScope('even')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'even' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Pares' : 'Evens'}
                    </button>

                    <button
                      type="button" onClick={() => setCropScope('odd')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'odd' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Impares' : 'Odds'}
                    </button>

                    <button
                      type="button" onClick={() => setCropScope('current')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'current' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Actual' : 'Current'}
                    </button>
                  </div>
                </div>

                {/* MÁRGENES DE RECORTE (MM) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white">
                    <span>{isEs ? 'Márgenes de Recorte (mm):' : 'Crop Margins (mm):'}</span>
                    <button type="button" onClick={resetMargins} className="text-zinc-400 hover:text-white transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Superior (Top):' : 'Top:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginTop}
                        onChange={(e) => setMarginTop(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Inferior (Bottom):' : 'Bottom:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginBottom}
                        onChange={(e) => setMarginBottom(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Izquierdo (Left):' : 'Left:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginLeft}
                        onChange={(e) => setMarginLeft(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Derecho (Right):' : 'Right:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginRight}
                        onChange={(e) => setMarginRight(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>
                  </div>
                </div>

                {/* PREAJUSTES RÁPIDOS EN 1-CLIC */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? 'Preajustes Rápido:' : 'Quick Presets:'}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button" onClick={() => applyPreset(0)}
                      className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer text-center font-mono"
                    >
                      0 mm
                    </button>
                    <button
                      type="button" onClick={() => applyPreset(10)}
                      className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer text-center font-mono"
                    >
                      10 mm
                    </button>
                    <button
                      type="button" onClick={() => applyPreset(20)}
                      className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer text-center font-mono"
                    >
                      20 mm
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-3 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo del Archivo Resultante:" : "Output File Prefix:"}</label>
                  <input
                    type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Recortado"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "AJUSTES DE NUMERACIÓN" : "NUMBERING SETTINGS"}</label>
                  
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" checked={renumberPages} onChange={(e) => setRenumberPages(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>{isEs ? "Re-numerar páginas en pie de página (Página N / M)" : "Re-number footer pages (Page N / M)"}</span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">{isEs ? "METADATOS DEL PDF RECORTADO" : "CROPPED PDF METADATA"}</label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Título:" : "Title:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Documento_Ajustado_2026" : "Ex: Cropped_Document_2026"}
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
                      placeholder={isEs ? "Ej: Ajuste de márgenes de escaneo" : "Ex: Margin crop adjustment"}
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
                onClick={executeCrop} 
                disabled={isProcessing || !file || (isEncrypted && !isUnlocked)} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (!file 
                        ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') 
                        : (isEs ? 'Recortar Márgenes del PDF →' : 'Crop PDF Margins →'))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA CON CROP BOX */}
      {previewZoom && pageDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-zinc-900 border border-white/20 p-6 rounded-2xl max-w-xl w-full flex flex-col items-center gap-4 relative shadow-2xl">
            <button
              type="button" onClick={() => setPreviewZoom(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-white font-bold text-sm">
              {isEs ? `Previsualización Recorte - Página ${currentPage}` : `Crop Preview - Page ${currentPage}`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pageDataUrl} alt="Preview Zoom" className="max-h-[65vh] object-contain block rounded" />
              <div 
                className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none rounded"
                style={{
                  top: `${(marginTop / 297) * 100}%`,
                  bottom: `${(marginBottom / 297) * 100}%`,
                  left: `${(marginLeft / 210) * 100}%`,
                  right: `${(marginRight / 210) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}