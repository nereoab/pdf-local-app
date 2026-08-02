'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, ShieldCheck, Lock, Loader2, FileText, X, Eye, EyeOff,
  Settings, UploadCloud, Shield, KeyRound, Check, AlertTriangle,
  ChevronDown, ChevronUp, SlidersHorizontal, Database, Package, FilePlus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

import type {
  ProtectProgress,
  ProtectResult,
  ProtectError,
} from '../workers/pdf-protect.worker';

export default function PdfProtector() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  // === BATCH DE ARCHIVOS ===
  const [files, setFiles] = useState<File[]>(globalFile ? [globalFile] : []);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);

  // === PREVISUALIZACIÓN ===
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // === CONTRASEÑAS ===
  const [userPassword, setUserPassword] = useState('');
  const [confirmUserPassword, setConfirmUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmOwnerPassword, setConfirmOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // === PERMISOS GRANULARES ===
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowHighQualityPrint, setAllowHighQualityPrint] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowExtraction, setAllowExtraction] = useState(true);
  const [allowModifying, setAllowModifying] = useState(true);
  const [allowAnnotating, setAllowAnnotating] = useState(true);
  const [allowFillingForms, setAllowFillingForms] = useState(true);
  const [allowAssembly, setAllowAssembly] = useState(true);

  // Preset rápido: "Máxima protección"
  const applyMaxProtection = () => {
    setAllowPrinting(false);
    setAllowHighQualityPrint(false);
    setAllowCopying(false);
    setAllowExtraction(false);
    setAllowModifying(false);
    setAllowAnnotating(false);
    setAllowFillingForms(false);
    setAllowAssembly(false);
  };

  // Preset rápido: "Solo lectura"
  const applyReadOnly = () => {
    setAllowPrinting(true);
    setAllowHighQualityPrint(true);
    setAllowCopying(true);
    setAllowExtraction(true);
    setAllowModifying(false);
    setAllowAnnotating(false);
    setAllowFillingForms(false);
    setAllowAssembly(false);
  };

  // === OPCIONES ===
  const [enableRasterize, setEnableRasterize] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSuffix, setCustomSuffix] = useState('_Protegido');

  // === ESTADO DE PROCESAMIENTO ===
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // === RESULTADOS ===
  const [results, setResults] = useState<ProtectResult[]>([]);

  const activeFile = files[activeFileIdx] || null;
  const hasResults = results.length > 0;

  // === EFECTOS ===
  useEffect(() => {
    if (globalFile && files.length === 0) {
      setFiles([globalFile]);
    }
  }, [globalFile, files.length]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      renderPagePreview(activeFile, 1);
    } else {
      setPreviewDataUrl(null);
      setTotalPages(1);
    }
  }, [activeFile]);

  // === VISTA PREVIA ===
  const renderPagePreview = useCallback(async (pdfFile: File, pageNum: number) => {
    setIsLoadingPreview(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdfDoc.numPages);
      const targetPageNum = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
      const page = await pdfDoc.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.85));
      }
    } catch {
      setPreviewDataUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const changePreviewPage = (delta: number) => {
    if (!activeFile) return;
    const newPage = Math.min(Math.max(1, previewPageNum + delta), totalPages);
    if (newPage !== previewPageNum) {
      setPreviewPageNum(newPage);
      renderPagePreview(activeFile, newPage);
    }
  };

  // === MANEJO DE ARCHIVOS (BATCH) ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (newFiles.length === 0) {
        toast.error(isEs ? 'Selecciona archivos PDF válidos' : 'Select valid PDF files');
        e.target.value = '';
        return;
      }
      if (newFiles.length !== e.target.files.length) {
        toast.warning(isEs
          ? `${e.target.files.length - newFiles.length} archivo(s) ignorado(s)`
          : `${e.target.files.length - newFiles.length} file(s) ignored`);
      }
      setFiles(prev => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setGlobalFile(newFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setResults(prev => prev.filter((_, i) => i !== idx));
    if (idx === activeFileIdx) setActiveFileIdx(0);
    else if (idx < activeFileIdx) setActiveFileIdx(prev => Math.max(0, prev - 1));
    if (files.length <= 1) setGlobalFile(null);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setGlobalFile(null);
    setResults([]);
    setActiveFileIdx(0);
  };

  // === MEDIDOR DE FUERZA DE CONTRASEÑA ===
  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: 'bg-zinc-700' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: isEs ? 'Débil' : 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: isEs ? 'Regular' : 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: isEs ? 'Buena' : 'Good', color: 'bg-emerald-500' };
    return { score: 4, label: isEs ? 'Fuerte' : 'Strong', color: 'bg-emerald-400' };
  };

  const hasAnyRestriction = !allowPrinting || !allowHighQualityPrint || !allowCopying || 
    !allowExtraction || !allowModifying || !allowAnnotating || !allowFillingForms || !allowAssembly;

  // === EJECUTAR PROTECCIÓN (WEB WORKER) ===
  const executeProtect = async () => {
    if (files.length === 0) {
      toast.error(isEs ? 'Selecciona al menos un archivo PDF' : 'Select at least one PDF file');
      return;
    }

    if (userPassword && userPassword !== confirmUserPassword) {
      toast.error(isEs ? 'Las contraseñas de apertura no coinciden' : 'User passwords do not match');
      return;
    }

    if (ownerPassword && ownerPassword !== confirmOwnerPassword) {
      toast.error(isEs ? 'Las contraseñas de propietario no coinciden' : 'Owner passwords do not match');
      return;
    }

    if (!userPassword && !ownerPassword && !hasAnyRestriction && !enableRasterize) {
      toast.warning(isEs ? 'Debes establecer al menos una contraseña o restricción' : 'Set at least one password or restriction');
      return;
    }

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setResults([]);
    setTotalFilesCount(files.length);
    setCurrentFileIndex(0);

    try {
      const fileBuffers: ArrayBuffer[] = [];
      const fileNames: string[] = [];

      for (const f of files) {
        const buffer = await f.arrayBuffer();
        fileBuffers.push(buffer);
        fileNames.push(f.name);
      }

      const workerUrl = new URL('../workers/pdf-protect.worker.ts', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });
      workerRef.current = worker;

      let newResults: ProtectResult[] = [];

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;

        if (msg.type === 'progress') {
          const p = msg as ProtectProgress;
          setProgressPercent(p.percent);
          setProgressMsg(p.message);
          if (p.currentFile) setCurrentFileIndex(p.currentFile);
          if (p.totalFiles) setTotalFilesCount(p.totalFiles);
        } else if (msg.type === 'result') {
          const r = msg as ProtectResult;
          const blob = new Blob([r.protectedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          (r as unknown as Record<string, unknown>).downloadUrl = url;
          newResults.push(r);
          setResults([...newResults]);

          const originalName = r.fileName.replace(/\.[^/.]+$/, '');
          const suffix = customSuffix || '_Protegido';
          const link = document.createElement('a');
          link.href = url;
          link.download = `${originalName}${suffix}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(isEs
            ? `${r.fileName}: ¡Protegido con AES-256! ${r.restrictions.length} restricciones aplicadas.`
            : `${r.fileName}: Protected with AES-256! ${r.restrictions.length} restrictions applied.`);
        } else if (msg.type === 'error') {
          const e = msg as ProtectError;
          toast.error(e.message);
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        toast.error(isEs ? 'Error en el motor de cifrado' : 'Encryption engine error');
        setIsProcessing(false);
      };

      worker.postMessage({
        fileBuffers,
        fileNames,
        options: {
          userPassword,
          ownerPassword,
          allowPrinting,
          allowHighQualityPrint,
          allowModifying,
          allowCopying,
          allowExtraction,
          allowAnnotating,
          allowFillingForms,
          allowAssembly,
          enableRasterize,
          customSuffix,
        },
      });

      const checkCompletion = setInterval(() => {
        if (progressPercent >= 100 || newResults.length >= files.length) {
          clearInterval(checkCompletion);
          setIsProcessing(false);
          worker.terminate();
          workerRef.current = null;

          if (newResults.length > 1) {
            toast.success(isEs
              ? `¡${newResults.length} PDFs protegidos con éxito!`
              : `${newResults.length} PDFs protected successfully!`);
          }
        }
      }, 300);

    } catch (error) {
      console.error('Protect error:', error);
      toast.error(isEs ? 'Error al iniciar la protección' : 'Error starting protection');
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const userPwdStrength = passwordStrength(userPassword);
  const ownerPwdStrength = passwordStrength(ownerPassword);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />

      {/* CABECERA */}
      <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/#herramientas"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-white/10" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / PROTECCIÓN Y CIFRADO DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Lock className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'PROTEGER Y CIFRAR DOCUMENTOS PDF CON CONTRASEÑA' : 'PROTECT AND ENCRYPT PDF DOCUMENTS WITH PASSWORD'}</span>
            </h1>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <Package className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
              <span className="font-bold">{files.length}</span> {isEs ? 'archivo(s)' : 'file(s)'}
            </div>
            <button
              onClick={handleRemoveAllFiles}
              disabled={isProcessing}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? 'Quitar todos' : 'Remove all'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        /* DROPZONE SIN ARCHIVOS */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-3xl mx-auto bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
          >
            <UploadCloud className="w-12 h-12 text-white" />
          </motion.div>

          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs ? 'Arrastra tus PDFs aquí para proteger' : 'Drop your PDFs here to protect'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos (múltiples permitidos)' : 'Or click to browse your files (multiple allowed)'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" /> {isEs ? 'Subir Archivos PDF' : 'Upload PDF Files'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% LOCAL • CIFRADO AES-256 • WEB WORKER' : '100% LOCAL • AES-256 ENCRYPTION • WEB WORKER'}</span>
          </div>
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO: VISOR 5/12 + PANEL 7/12 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans items-stretch">

          {/* LADO IZQUIERDO: LISTA DE ARCHIVOS + VISTA PREVIA */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {files.length > 1 && (
              <div className="bg-[#09090b] border border-white/10 rounded-xl p-3 max-h-[160px] overflow-y-auto">
                <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                  {isEs ? 'Cola de archivos' : 'File queue'} ({files.length})
                </span>
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveFileIdx(i)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs ${
                        i === activeFileIdx
                          ? 'bg-zinc-800 border border-white/20 text-white'
                          : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                        <span className="truncate font-mono">{f.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }} disabled={isProcessing}
                        className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                  className="mt-2 w-full text-[10px] font-mono text-zinc-500 hover:text-white py-1.5 border border-dashed border-white/10 hover:border-white/30 rounded-lg transition-all cursor-pointer">
                  + {isEs ? 'Añadir más archivos' : 'Add more files'}
                </button>
              </div>
            )}

            <div className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative font-mono flex-1 min-h-[520px]">
              <div className="bg-zinc-900 border-b border-white/10 p-3.5 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">{activeFile?.name || ''}</span>
                    <span className="text-zinc-400 text-[10px]">{activeFile ? formatFileSize(activeFile.size) : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl px-2 py-1 text-xs text-zinc-300">
                    <button onClick={() => changePreviewPage(-1)} disabled={previewPageNum <= 1 || isLoadingPreview} className="p-1 hover:text-white disabled:opacity-30 cursor-pointer">
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    <span className="px-2 text-[11px] font-mono font-bold text-white">{previewPageNum} / {totalPages}</span>
                    <button onClick={() => changePreviewPage(1)} disabled={previewPageNum >= totalPages || isLoadingPreview} className="p-1 hover:text-white disabled:opacity-30 cursor-pointer">
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full flex-1 bg-[#09090b] relative flex items-center justify-center p-3 sm:p-5 min-h-[440px]">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">{isEs ? 'Cargando preview...' : 'Loading preview...'}</span>
                  </div>
                ) : previewDataUrl ? (
                  <div className="w-full h-full max-h-[480px] flex items-center justify-center relative">
                    <img src={previewDataUrl} alt={`Página ${previewPageNum}`} className="max-h-[470px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/15 bg-white" />
                    <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AES 256-BIT</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <FileText className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-mono">{isEs ? 'Vista previa no disponible' : 'Preview unavailable'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans flex-1">

              <div className="overflow-y-auto pr-1 max-h-[calc(100vh-250px)]">
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                      002 / CONFIGURACIÓN DE SEGURIDAD
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* === CONTRASEÑA DE APERTURA (User Password) === */}
                <div className="mb-5 bg-zinc-950/60 border border-white/8 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      {isEs ? 'Contraseña de Apertura' : 'User Password (Open)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3 font-sans leading-relaxed">
                    {isEs ? 'Restringe quién puede abrir y leer el documento. Déjalo en blanco si solo deseas restricciones de permisos.' : 'Restricts who can open and read the document. Leave blank for permission-only restrictions.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input type={showUserPassword ? 'text' : 'password'} value={userPassword} onChange={e => setUserPassword(e.target.value)}
                        placeholder={isEs ? 'Contraseña de apertura' : 'User password'}
                        className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors pr-9 font-mono"
                      />
                      <button type="button" onClick={() => setShowUserPassword(!showUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                        {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <input type={showUserPassword ? 'text' : 'password'} value={confirmUserPassword} onChange={e => setConfirmUserPassword(e.target.value)}
                      placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'}
                      className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  {userPassword && (
                    <div className="mt-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${userPwdStrength.color}`}
                            style={{ width: `${(userPwdStrength.score / 4) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-300">{userPwdStrength.label}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1">
                        {isEs ? 'Usa 8+ caracteres con mayúsculas, números y símbolos' : 'Use 8+ chars with uppercase, numbers & symbols'}
                      </p>
                    </div>
                  )}
                </div>

                {/* === CONTRASEÑA DE PROPIETARIO (Owner Password) === */}
                <div className="mb-5 bg-zinc-950/60 border border-white/8 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      {isEs ? 'Contraseña de Propietario' : 'Owner Password (Permissions)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3 font-sans leading-relaxed">
                    {isEs ? 'Contraseña maestra para restringir permisos sin impedir la lectura. Si no se establece, se genera una automáticamente.' : 'Master password to restrict permissions without blocking reading. Auto-generated if left blank.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input type={showOwnerPassword ? 'text' : 'password'} value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)}
                        placeholder={isEs ? 'Contraseña maestra (opcional)' : 'Owner password (optional)'}
                        className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors pr-9 font-mono"
                      />
                      <button type="button" onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                        {showOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <input type={showOwnerPassword ? 'text' : 'password'} value={confirmOwnerPassword} onChange={e => setConfirmOwnerPassword(e.target.value)}
                      placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'}
                      className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* === PANEL DE POLÍTICAS DE SEGURIDAD (PERMISOS GRANULARES) === */}
                <div className="mb-5 bg-zinc-950/60 border border-white/8 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                        {isEs ? 'Políticas de Seguridad' : 'Security Policies'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={applyReadOnly}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all font-mono cursor-pointer">
                        {isEs ? 'Solo lectura' : 'Read-only'}
                      </button>
                      <button onClick={applyMaxProtection}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all font-mono cursor-pointer">
                        {isEs ? 'Máxima protección' : 'Max protection'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* IMPRESIÓN */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{isEs ? 'Permitir impresión' : 'Allow printing'}</p>
                          <p className="text-[10px] text-zinc-500">{isEs ? 'El usuario puede imprimir el documento' : 'User can print the document'}</p>
                        </div>
                        <div onClick={() => { setAllowPrinting(!allowPrinting); if (!allowPrinting) setAllowHighQualityPrint(false); }}
                          className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowPrinting ? 'bg-white' : 'bg-zinc-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowPrinting ? 'left-4' : 'left-0.5'}`} />
                        </div>
                      </div>
                      {allowPrinting && (
                        <div className="mt-2 pl-2 border-l-2 border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400">{isEs ? 'Alta calidad' : 'High quality'}</span>
                            <div onClick={() => setAllowHighQualityPrint(!allowHighQualityPrint)}
                              className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowHighQualityPrint ? 'bg-white' : 'bg-zinc-700'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowHighQualityPrint ? 'left-4' : 'left-0.5'}`} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COPIA */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{isEs ? 'Permitir copia de texto/imágenes' : 'Allow copying text/images'}</p>
                        <p className="text-[10px] text-zinc-500">{isEs ? 'Ctrl+C / clic derecho sobre contenido' : 'Ctrl+C / right-click on content'}</p>
                      </div>
                      <div onClick={() => { setAllowCopying(!allowCopying); setAllowExtraction(!allowCopying); }}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowCopying ? 'bg-white' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowCopying ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>

                    {/* MODIFICACIÓN */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{isEs ? 'Permitir modificación de páginas' : 'Allow page modification'}</p>
                        <p className="text-[10px] text-zinc-500">{isEs ? 'Rotar, eliminar, insertar páginas' : 'Rotate, delete, insert pages'}</p>
                      </div>
                      <div onClick={() => { setAllowModifying(!allowModifying); setAllowAssembly(!allowModifying); }}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowModifying ? 'bg-white' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowModifying ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>

                    {/* FORMULARIOS */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{isEs ? 'Permitir llenado de formularios' : 'Allow form filling'}</p>
                        <p className="text-[10px] text-zinc-500">{isEs ? 'Campos de formulario interactivos' : 'Interactive form fields'}</p>
                      </div>
                      <div onClick={() => setAllowFillingForms(!allowFillingForms)}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowFillingForms ? 'bg-white' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowFillingForms ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>

                    {/* ANOTACIONES */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{isEs ? 'Permitir anotaciones/comentarios' : 'Allow annotations/comments'}</p>
                        <p className="text-[10px] text-zinc-500">{isEs ? 'Resaltar, subrayar, notas adhesivas' : 'Highlight, underline, sticky notes'}</p>
                      </div>
                      <div onClick={() => setAllowAnnotating(!allowAnnotating)}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowAnnotating ? 'bg-white' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowAnnotating ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Resumen de restricciones activas */}
                  {hasAnyRestriction && (
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-[10px] text-amber-300 font-mono">
                      <span className="font-bold">{isEs ? 'Restricciones activas:' : 'Active restrictions:'}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {!allowPrinting && <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">{isEs ? 'Impresión' : 'Print'}</span>}
                        {!allowCopying && <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">{isEs ? 'Copia' : 'Copy'}</span>}
                        {!allowModifying && <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">{isEs ? 'Edición' : 'Edit'}</span>}
                        {!allowFillingForms && <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">{isEs ? 'Formularios' : 'Forms'}</span>}
                        {!allowAnnotating && <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">{isEs ? 'Anotaciones' : 'Annotations'}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* === OPCIONES AVANZADAS === */}
                <div className="mb-5">
                  <button onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer">
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider">
                      <Settings className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-4 bg-zinc-950/60 border border-white/8 rounded-xl p-4">
                      <div onClick={() => setEnableRasterize(!enableRasterize)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                        <div>
                          <p className="text-[11px] font-bold text-white">{isEs ? 'Rasterizar contenido (máxima seguridad)' : 'Rasterize content (maximum security)'}</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{isEs ? 'Convierte todo a imagen no editable ni buscable' : 'Converts all to non-editable, non-searchable image'}</p>
                        </div>
                        <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${enableRasterize ? 'bg-white' : 'bg-zinc-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${enableRasterize ? 'left-4' : 'left-0.5'}`} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">{isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}</label>
                        <input type="text" value={customSuffix} onChange={e => setCustomSuffix(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                        />
                        <p className="text-[9px] font-mono text-zinc-600 mt-1">
                          {isEs ? `Ejemplo: archivo${customSuffix}.pdf` : `Example: file${customSuffix}.pdf`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BARRA DE PROGRESO + BOTÓN */}
              <div>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 font-mono">
                      <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
                        <span className="truncate mr-2">{progressMsg}</span>
                        <span className="font-bold tabular-nums">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-white/10">
                        <motion.div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ ease: 'easeInOut', duration: 0.3 }} />
                      </div>
                      {totalFilesCount > 1 && (
                        <p className="text-[9px] text-zinc-500 mt-1 text-center">
                          {isEs ? `Archivo ${currentFileIndex} de ${totalFilesCount}` : `File ${currentFileIndex} of ${totalFilesCount}`}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 pt-2">
                  {!hasResults ? (
                    <button onClick={executeProtect} disabled={isProcessing || files.length === 0}
                      className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin text-black" /><span>{isEs ? 'Cifrando...' : 'Encrypting...'}</span></>
                      ) : (
                        <><Lock className="w-4 h-4 text-black" /><span>{isEs ? (files.length > 1 ? `Proteger ${files.length} archivos` : 'Proteger PDF') : (files.length > 1 ? `Protect ${files.length} files` : 'Protect PDF')}</span></>
                      )}
                    </button>
                  ) : (
                    <button onClick={handleRemoveAllFiles}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isEs ? 'Proteger otros archivos' : 'Protect other files'}</span>
                    </button>
                  )}
                </div>

                {/* INDICADOR WEB WORKER */}
                <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isEs ? 'Web Worker Activo' : 'Web Worker Active'}
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Database className="w-3 h-3" />
                    {isEs ? '100% Local' : '100% Local'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}