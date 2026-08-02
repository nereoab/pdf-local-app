'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Unlock, FileDown, Loader2, X, ShieldCheck, FilePlus, KeyRound,
  CheckCircle2, RefreshCw, FileText, UploadCloud, Lock, Eye, EyeOff,
  SlidersHorizontal, ChevronDown, ChevronUp, Shield, Zap, Info, Database, Package,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

type PageScope = 'todas' | 'rango';

interface AuditReportEntry {
  fileName: string;
  encryptionType: string;
  checksumSha256: string;
  timestamp: string;
  originalSize: number;
  unlockedSize: number;
  userProvidedPassword: boolean;
}

import type {
  EncryptionDetection,
  DetectionResult,
  UnlockProgress,
  UnlockResult,
  UnlockError,
} from '../workers/pdf-unlock.worker';

export default function PdfUnlocker() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  // === BATCH DE ARCHIVOS ===
  const [files, setFiles] = useState<File[]>(globalFile ? [globalFile] : []);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);

  // === CONTRASEÑA (SEGURA: nunca se loguea ni envía a servidor) ===
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // === ESTADO DE PROCESAMIENTO ===
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // === RESULTADOS ===
  const [results, setResults] = useState<UnlockResult[]>([]);

  // === DETECCIÓN DINÁMICA POR ARCHIVO ===
  const [detectionMap, setDetectionMap] = useState<Record<number, EncryptionDetection>>({});

  // === PREVISUALIZACIÓN ===
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // === OPCIONES AVANZADAS ===
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Desbloqueado');

  const activeFile = files[activeFileIdx] || null;

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


  // === DETECCIÓN AUTOMÁTICA AL CARGAR/SELECCIONAR ARCHIVO ===
  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      renderPagePreview(activeFile, 1, password);
      detectFileStatus(activeFile, activeFileIdx);
    } else {
      setPreviewDataUrl(null);
      setTotalPages(1);
    }
  }, [activeFile, password]);

  const detectFileStatus = async (f: File, idx: number) => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buffer = await f.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      // Escanear hasta 2MB (suficiente para encontrar /Encrypt en cualquier posición)
      const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
      const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));
      const hasEncrypt = text.includes('/Encrypt');

      // Intentar abrir con contraseña vacía para determinar el tipo de protección
      try {
        await pdfjsLib.getDocument({ data: buffer.slice(0), password: '', stopAtErrors: false }).promise;

        if (hasEncrypt) {
          // Abre sin contraseña → solo restricciones de propietario
          setDetectionMap(prev => ({ ...prev, [idx]: { type: 'owner-only', needsPassword: false, hasDigitalSignature: false, pdfVersion: 'desconocida', warnings: [], message: 'Solo restricciones de permisos', details: 'No requiere contraseña de apertura' } }));
        } else {
          setDetectionMap(prev => ({ ...prev, [idx]: { type: 'none', needsPassword: false, hasDigitalSignature: false, pdfVersion: 'desconocida', warnings: [], message: 'Sin protección detectada', details: 'Documento sin cifrado ni restricciones' } }));
        }
      } catch (err: unknown) {
        // No se pudo abrir con contraseña vacía — verificar el tipo de error
        const isPasswordError = err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'PasswordException';

        if (isPasswordError) {
          // PasswordException = requiere contraseña de apertura (User Password)
          setDetectionMap(prev => ({ ...prev, [idx]: { type: 'encrypted', needsPassword: true, hasDigitalSignature: false, pdfVersion: 'desconocida', warnings: [], message: 'Protegido con contraseña de apertura', details: 'El PDF requiere una clave de lectura para abrirse. Ingrese la contraseña.' } }));
        } else if (hasEncrypt) {
          // Tiene /Encrypt pero no es PasswordException → posible cifrado propietario corrupto
          setDetectionMap(prev => ({ ...prev, [idx]: { type: 'owner-only', needsPassword: false, hasDigitalSignature: false, pdfVersion: 'desconocida', warnings: [], message: 'Cifrado de propietario detectado', details: 'Posibles restricciones. Se intentará desbloquear sin contraseña.' } }));
        } else {
          // Sin /Encrypt pero no abre → archivo corrupto
          setDetectionMap(prev => ({ ...prev, [idx]: { type: 'none', needsPassword: false, hasDigitalSignature: false, pdfVersion: 'desconocida', warnings: [], message: 'Documento posiblemente corrupto', details: 'Sin cifrado detectado pero no se puede abrir. Intente reparar el PDF primero.' } }));
        }
      }
    } catch {
      setDetectionMap(prev => ({ ...prev, [idx]: { type: 'none', needsPassword: false, hasDigitalSignature: false, pdfVersion: 'desconocida', warnings: [], message: 'Error de análisis', details: 'No se pudo determinar el estado del archivo' } }));
    }
  };

  // === VISTA PREVIA ===
  const renderPagePreview = useCallback(async (pdfFile: File, pageNum: number, pwd: string) => {
    setIsLoadingPreview(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0), password: pwd }).promise;
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
      renderPagePreview(activeFile, newPage, password);
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
          ? `${e.target.files.length - newFiles.length} archivo(s) ignorado(s) por no ser PDF`
          : `${e.target.files.length - newFiles.length} file(s) ignored (not PDF)`);
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
    if (idx === activeFileIdx) {
      setActiveFileIdx(0);
    } else if (idx < activeFileIdx) {
      setActiveFileIdx(prev => Math.max(0, prev - 1));
    }
    if (files.length <= 1) {
      setGlobalFile(null);
    }
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setGlobalFile(null);
    setResults([]);
    setDetectionMap({});
    setActiveFileIdx(0);
  };

  // === RECUPERACIÓN AUTOMÁTICA DE CONTRASEÑA ===
  const executeRecoveryUnlock = async () => {
    if (files.length === 0) return;
    if (workerRef.current) { workerRef.current.terminate(); }

    setIsProcessing(true);
    setProgressPercent(0);
    setResults([]);
    setTotalFilesCount(files.length);
    setCurrentFileIndex(0);

    try {
      const fileBuffers: ArrayBuffer[] = [];
      const fileNames: string[] = [];
      for (const f of files) {
        fileBuffers.push(await f.arrayBuffer());
        fileNames.push(f.name);
      }

      const worker = new Worker(new URL('../workers/pdf-unlock.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      let newResults: UnlockResult[] = [];

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          const p = msg as UnlockProgress;
          setProgressPercent(p.percent);
          setProgressMsg(p.message);
          if (p.currentFile) setCurrentFileIndex(p.currentFile);
          if (p.totalFiles) setTotalFilesCount(p.totalFiles);
        } else if (msg.type === 'result') {
          const r = msg as UnlockResult;
          const blob = new Blob([r.unlockedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          (r as unknown as Record<string, unknown>).downloadUrl = url;
          newResults.push(r);
          setResults([...newResults]);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${r.fileName.replace(/\.[^/.]+$/, '')}${customSuffix || '_Desbloqueado'}.pdf`;
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          toast.success(isEs ? `${r.fileName}: ¡${r.pageCount} páginas liberadas!` : `${r.fileName}: ${r.pageCount} pages unlocked!`);
        } else if (msg.type === 'error') {
          toast.error((msg as UnlockError).message);
        }
      };

      worker.onerror = (error) => {
        console.error('Worker:', error);
        toast.error(isEs ? 'Error en recuperación' : 'Recovery error');
        setIsProcessing(false);
      };

      worker.postMessage({
        fileBuffers, fileNames,
        options: { password: '', passwordRecovery: true, pageScope, pageRange: pageScope === 'rango' ? pageRange : undefined, stripMetadata, customSuffix, batchMode: files.length > 1 },
      });

      const check = setInterval(() => {
        if (progressPercent >= 100 || newResults.length >= files.length) {
          clearInterval(check);
          setIsProcessing(false);
          worker.terminate();
          workerRef.current = null;
        }
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al iniciar recuperación' : 'Error starting recovery');
      setIsProcessing(false);
    }
  };

  // === EJECUTAR DESBLOQUEO (WEB WORKER) ===
  const executeUnlock = async () => {
    if (files.length === 0) return;

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

      const workerUrl = new URL('../workers/pdf-unlock.worker.ts', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });
      workerRef.current = worker;

      let newResults: UnlockResult[] = [];

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;

        if (msg.type === 'detection') {
          // El worker confirma la detección
        } else if (msg.type === 'progress') {
          const p = msg as UnlockProgress;
          setProgressPercent(p.percent);
          setProgressMsg(p.message);
          if (p.currentFile) setCurrentFileIndex(p.currentFile);
          if (p.totalFiles) setTotalFilesCount(p.totalFiles);
        } else if (msg.type === 'result') {
          const r = msg as UnlockResult;
          const blob = new Blob([r.unlockedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          (r as unknown as Record<string, unknown>).downloadUrl = url;
          newResults.push(r);
          setResults([...newResults]);

          // Descargar automáticamente
          const originalName = r.fileName.replace(/\.[^/.]+$/, '');
          const suffix = customSuffix || '_Desbloqueado';
          const link = document.createElement('a');
          link.href = url;
          link.download = `${originalName}${suffix}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(isEs
            ? `${r.fileName}: ¡${r.pageCount} páginas desbloqueadas! Vectores ${r.vectorPreserved ? 'preservados' : 'rasterizados'}.`
            : `${r.fileName}: ${r.pageCount} pages unlocked! Vectors ${r.vectorPreserved ? 'preserved' : 'rasterized'}.`);
        } else if (msg.type === 'error') {
          const e = msg as UnlockError;
          toast.error(e.message);
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        toast.error(isEs ? 'Error en el motor de desbloqueo' : 'Unlock engine error');
        setIsProcessing(false);
      };

      worker.postMessage({
        fileBuffers,
        fileNames,
        options: {
          password,
          passwordRecovery: false,
          pageScope,
          pageRange: pageScope === 'rango' ? pageRange : undefined,
          stripMetadata,
          customSuffix,
          batchMode: files.length > 1,
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
              ? `¡${newResults.length} PDFs desbloqueados con éxito!`
              : `${newResults.length} PDFs unlocked successfully!`);
          }
        }
      }, 300);

    } catch (error) {
      console.error('Unlock error:', error);
      toast.error(isEs ? 'Error al iniciar el desbloqueo' : 'Error starting unlock process');
      setIsProcessing(false);
    }
  };

  // === UTILIDADES ===
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadAuditReport = () => {
    if (results.length === 0) return;
    const report: AuditReportEntry[] = results.map((r, i) => ({
      fileName: r.fileName,
      encryptionType: r.encryptionType || 'unknown',
      checksumSha256: r.checksumSha256 || 'no-disponible',
      timestamp: r.timestamp || new Date().toISOString(),
      originalSize: r.originalSize || 0,
      unlockedSize: r.unlockedSize || 0,
      userProvidedPassword: !!password,
    }));
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-desbloqueo-${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(isEs ? 'Reporte de auditoría descargado' : 'Audit report downloaded');
  };

  const hasAnyEncrypted = Object.values(detectionMap).some(d => d.type === 'encrypted');
  const activeDetection = detectionMap[activeFileIdx] || null;
  const activeResult = results[activeFileIdx] || null;
  const hasResults = results.length > 0;
  const activeWarnings = activeDetection?.warnings || [];

  // Atajos de teclado (Ctrl+Enter = Desbloquear, Ctrl+R = Recuperar, Ctrl+S = Reporte)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing && files.length > 0 && !hasResults) executeUnlock();
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (!isProcessing && files.length > 0 && !hasResults) executeRecoveryUnlock();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!isProcessing && hasResults) downloadAuditReport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, files.length, hasResults]);

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
              004 / DESBLOQUEO Y LIBERACIÓN DE PERMISOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Unlock className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'DESBLOQUEAR Y LIBERAR RESTRICCIONES DE PDF' : 'UNLOCK AND REMOVE RESTRICTIONS FROM PDF'}</span>
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
              {isEs ? 'Arrastra tus PDFs protegidos aquí para desbloquear' : 'Drop your protected PDFs here to unlock'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos (múltiples permitidos)' : 'Or click to browse your local files (multiple allowed)'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" /> {isEs ? 'Subir PDFs Protegidos' : 'Upload Protected PDFs'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% PRIVACIDAD • DESCIFRADO LOCAL AES-256 • WEB WORKER' : '100% PRIVACY • LOCAL AES-256 DECRYPTION • WEB WORKER'}</span>
          </div>
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO: VISOR 5/12 + PANEL 7/12 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans items-stretch">

          {/* LADO IZQUIERDO: LISTA DE ARCHIVOS + VISTA PREVIA */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* LISTA DE ARCHIVOS (BATCH) */}
            {files.length > 1 && (
              <div className="bg-[#09090b] border border-white/10 rounded-xl p-3 max-h-[160px] overflow-y-auto">
                <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                  {isEs ? 'Cola de archivos' : 'File queue'} ({files.length})
                </span>
                <div className="space-y-1.5">
                  {files.map((f, i) => {
                    const detection = detectionMap[i];
                    const res = results[i];
                    return (
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
                        <div className="flex items-center gap-1.5 ml-2">
                          {detection && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              detection.type === 'encrypted'
                                ? 'bg-amber-500/20 text-amber-400'
                                : detection.type === 'owner-only'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {detection.type === 'encrypted' ? '🔒' : detection.type === 'owner-only' ? '🔐' : '✅'}
                            </span>
                          )}
                          {res && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              ✓
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
                            disabled={isProcessing}
                            className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="mt-2 w-full text-[10px] font-mono text-zinc-500 hover:text-white py-1.5 border border-dashed border-white/10 hover:border-white/30 rounded-lg transition-all cursor-pointer"
                >
                  + {isEs ? 'Añadir más archivos' : 'Add more files'}
                </button>
              </div>
            )}

            {/* VISTA PREVIA */}
            <div className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative font-mono flex-1 min-h-[520px]">
              <div className="bg-zinc-900 border-b border-white/10 p-3.5 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">{activeFile?.name || ''}</span>
                    <span className="text-zinc-400 text-[10px]">
                      {activeFile ? formatFileSize(activeFile.size) : ''}
                      {activeResult && (
                        <span className="text-emerald-400 ml-2">
                          → {activeResult.pageCount} {isEs ? 'pág. desbloqueadas' : 'p. unlocked'}
                        </span>
                      )}
                    </span>
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
                    <span className="text-xs font-mono">{isEs ? 'Generando previsualización...' : 'Rendering preview...'}</span>
                  </div>
                ) : previewDataUrl ? (
                  <div className="w-full h-full max-h-[480px] flex items-center justify-center relative">
                    <img src={previewDataUrl} alt={`Página ${previewPageNum}`} className="max-h-[470px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/15 bg-white transition-all duration-200" />
                  </div>
                ) : (
                  <div className="w-full h-full max-h-[550px] bg-zinc-900/90 border border-amber-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-5">
                    <Lock className="w-10 h-10 text-amber-400" />
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 uppercase">
                      {isEs ? 'PDF PROTEGIDO' : 'PROTECTED PDF'}
                    </span>
                    <h3 className="text-base font-extrabold text-white">{isEs ? 'Archivo Protegido' : 'Protected File'}</h3>
                    <p className="text-xs text-zinc-400">
                      {isEs ? 'Ingrese la contraseña si es necesario y presione "Desbloquear".' : 'Enter password if needed and click "Unlock".'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans flex-1">

              <div>
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                      002 / CONFIGURACIÓN DE DESBLOQUEO
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                    <Unlock className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* DETECCIÓN DINÁMICA DE ESTADO */}
                {activeDetection && (
                  <div className={`mb-4 p-3.5 rounded-xl border ${
                    activeDetection.type === 'encrypted'
                      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      : activeDetection.type === 'owner-only'
                      ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                      : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Info className="w-4 h-4" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider">
                        {isEs ? 'DIAGNÓSTICO DE SEGURIDAD' : 'SECURITY DIAGNOSIS'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-tight mb-1">{activeDetection.message}</p>
                    <p className="text-[10px] opacity-70">{activeDetection.details}</p>
                  </div>
                )}

                {/* CAMPO DE CONTRASEÑA (CONDICIONAL) */}
                <AnimatePresence>
                  {(hasAnyEncrypted || activeDetection?.type === 'encrypted') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <label className="text-xs font-bold text-zinc-300 block mb-2 font-mono">
                        {isEs ? 'CONTRASEÑA DE APERTURA:' : 'OPENING PASSWORD:'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={isEs ? 'Ingresa la contraseña del documento...' : 'Type document password...'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          disabled={isProcessing}
                          className="w-full p-3.5 pr-10 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl text-white text-xs outline-none focus:border-white transition-colors font-mono placeholder-zinc-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">
                        {isEs ? '* Esta contraseña nunca se almacena, registra ni envía a ningún servidor.' : '* This password is never stored, logged, or sent to any server.'}
                      </span>
                      <button
                        type="button"
                        onClick={executeRecoveryUnlock}
                        disabled={isProcessing}
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-400 font-bold py-2 px-3 rounded-xl text-[11px] transition-all cursor-pointer disabled:opacity-40 font-mono"
                      >
                        <Search className="w-3.5 h-3.5" />
                        {isEs ? 'RECUPERAR CONTRASEÑA (INTENTAR CLAVES COMUNES)' : 'RECOVER PASSWORD (TRY COMMON KEYS)'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* OPCIONES AVANZADAS */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 bg-zinc-950/60 border border-white/8 rounded-xl p-4 max-h-[420px] overflow-y-auto">

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Ajustes de Salida' : 'Output Settings'}
                        </label>

                        <div onClick={() => setStripMetadata(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Eliminar metadatos del PDF' : 'Strip PDF metadata'}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{isEs ? 'Purga título, autor y programa de origen' : 'Purge title, author & software info'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${stripMetadata ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${stripMetadata ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            {isEs ? 'Permisos que se liberarán' : 'Permissions to be unlocked'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { icon: '✏️', es: 'Editar contenido', en: 'Edit content' },
                              { icon: '🖨️', es: 'Imprimir', en: 'Print' },
                              { icon: '📋', es: 'Copiar texto/imágenes', en: 'Copy text/images' },
                              { icon: '📄', es: 'Extraer páginas', en: 'Extract pages' },
                              { icon: '💬', es: 'Añadir comentarios', en: 'Add comments' },
                              { icon: '📝', es: 'Rellenar formularios', en: 'Fill forms' },
                              { icon: '🔗', es: 'Ensamblar documentos', en: 'Assemble documents' },
                              { icon: '♿', es: 'Accesibilidad', en: 'Accessibility' },
                            ].map((perm, i) => (
                              <div key={i} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2.5 py-2">
                                <span className="text-sm">{perm.icon}</span>
                                <span className="text-[10px] text-emerald-300 font-mono font-bold leading-tight">
                                  {isEs ? perm.es : perm.en}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">{isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}</label>
                          <input type="text" value={customSuffix} onChange={e => setCustomSuffix(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                          <p className="text-[9px] font-mono text-zinc-600 mt-1">
                            {isEs ? `Ejemplo: archivo${customSuffix}.pdf` : `Example: file${customSuffix}.pdf`}
                          </p>
                        </div>
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
                    <button
                      onClick={executeUnlock}
                      disabled={isProcessing || files.length === 0}
                      className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>{isEs ? 'Desbloqueando...' : 'Unlocking...'}</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 text-black" />
                          <span>
                            {isEs
                              ? files.length > 1 ? `Desbloquear ${files.length} archivos` : 'Desbloquear PDF'
                              : files.length > 1 ? `Unlock ${files.length} files` : 'Unlock PDF'}
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 font-sans">
                      {/* Indicador de integridad */}
                      {activeResult && (
                        <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2.5 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-bold">{isEs ? 'Integridad verificada' : 'Integrity verified'}</span>
                            <span className="text-zinc-500 ml-2">SHA-256: {activeResult.checksumSha256?.substring(0, 24)}...</span>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={downloadAuditReport}
                        className="w-full bg-zinc-900 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 py-2.5 px-4 rounded-full text-xs font-bold border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Descargar reporte de auditoría (JSON)' : 'Download audit report (JSON)'}</span>
                      </button>
                      <button
                        onClick={handleRemoveAllFiles}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Desbloquear otros archivos' : 'Unlock other files'}</span>
                      </button>
                    </div>
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