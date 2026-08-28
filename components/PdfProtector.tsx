'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Loader2,
  FileText,
  X,
  Eye,
  EyeOff,
  Settings,
  UploadCloud,
  Shield,
  KeyRound,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Database,
  Package,
  FilePlus,
  RefreshCw,
  Sparkles,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';

import type { ProtectProgress, ProtectResult, ProtectError } from '../workers/pdf-protect.worker';

export default function PdfProtector() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  // === BATCH DE ARCHIVOS ===
  const [files, setFiles] = useState<File[]>(globalFile ? [globalFile] : []);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);

  // === PREVISUALIZACIÓN / MINIATURAS ===
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

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
    setAllowCopying(false);
    setAllowExtraction(false);
    setAllowModifying(false);
    setAllowAnnotating(false);
    setAllowFillingForms(false);
    setAllowAssembly(false);
    toast.info(
      isEs ? 'Perfil aplicado: Solo Lectura + Impresión' : 'Profile applied: Read Only + Print',
    );
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserPassword(pwd);
    setConfirmUserPassword(pwd);
    setShowUserPassword(true);
    navigator.clipboard.writeText(pwd);
    toast.success(
      isEs
        ? '¡Contraseña generada y copiada al portapapeles!'
        : 'Password generated and copied to clipboard!',
    );
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

  // Estado de éxito para pantalla de descarga
  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize: string;
    rawBlob?: Blob;
    originalSize: number;
    protectedSize: number;
    pageCount: number;
    restrictions: string[];
  } | null>(null);

  const activeFile = files[activeFileIdx] || null;
  const hasResults = results.length > 0;

  // Altura sincronizada para igualar panel de vista previa al panel de control
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Sincronizar altura del panel de vista previa con la del panel de control
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const updateHeight = () => {
      if (controlPanelRef.current) {
        const h = controlPanelRef.current.getBoundingClientRect().height;
        if (h > 0) setPreviewHeight(h);
      }
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.target.getBoundingClientRect().height;
        if (h > 0) {
          setPreviewHeight(h);
        }
      }
    });
    observer.observe(controlPanelRef.current);
    updateHeight();
    return () => observer.disconnect();
  }, [files, activeFileIdx, userPassword, ownerPassword, showAdvanced, isProcessing, results]);

  // === EFECTOS ===
  // Ocultar barra superior global y posicionar la vista en el tope de la página
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);

      // Posicionar en el tope absoluto (y = 0) para mantener el margen y vista completa del título
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const raf = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      });

      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 50);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  // Restaurar barra superior al desmontar
  useEffect(() => {
    return () => {
      setHeaderHidden(false);
    };
  }, [setHeaderHidden]);

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

  // === GENERACIÓN DE MINIATURAS ===
  const loadFileThumbnails = useCallback(async (pdfFile: File) => {
    setIsLoadingThumbnails(true);
    setThumbnails([]);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const total = pdfDoc.numPages;
      setTotalPages(total);

      const generated: { pageNum: number; dataUrl: string }[] = [];
      const maxThumbnails = Math.min(total, 60);

      for (let pn = 1; pn <= maxThumbnails; pn++) {
        const page = await pdfDoc.getPage(pn);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
            typeof page.render
          >[0]).promise;
          generated.push({ pageNum: pn, dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
        }
      }
      setThumbnails(generated);
    } catch {
      setThumbnails([]);
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      loadFileThumbnails(activeFile);
    } else {
      setThumbnails([]);
      setTotalPages(1);
    }
  }, [activeFile, loadFileThumbnails]);

  // === MANEJO DE ARCHIVOS (BATCH) ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type === 'application/pdf');
      if (newFiles.length === 0) {
        toast.error(isEs ? 'Selecciona archivos PDF válidos' : 'Select valid PDF files');
        e.target.value = '';
        return;
      }
      if (newFiles.length !== e.target.files.length) {
        toast.warning(
          isEs
            ? `${e.target.files.length - newFiles.length} archivo(s) ignorado(s)`
            : `${e.target.files.length - newFiles.length} file(s) ignored`,
        );
      }
      setFiles((prev) => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setGlobalFile(newFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setResults((prev) => prev.filter((_, i) => i !== idx));
    if (idx === activeFileIdx) setActiveFileIdx(0);
    else if (idx < activeFileIdx) setActiveFileIdx((prev) => Math.max(0, prev - 1));
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

  const hasAnyRestriction =
    !allowPrinting ||
    !allowHighQualityPrint ||
    !allowCopying ||
    !allowExtraction ||
    !allowModifying ||
    !allowAnnotating ||
    !allowFillingForms ||
    !allowAssembly;

  // === EJECUTAR PROTECCIÓN (WEB WORKER) ===
  const executeProtect = async () => {
    if (files.length === 0) {
      toast.error(isEs ? 'Selecciona al menos un archivo PDF' : 'Select at least one PDF file');
      return;
    }

    if (userPassword && userPassword !== confirmUserPassword) {
      toast.error(
        isEs ? 'Las contraseñas de apertura no coinciden' : 'User passwords do not match',
      );
      return;
    }

    if (ownerPassword && ownerPassword !== confirmOwnerPassword) {
      toast.error(
        isEs ? 'Las contraseñas de propietario no coinciden' : 'Owner passwords do not match',
      );
      return;
    }

    if (!userPassword && !ownerPassword && !hasAnyRestriction && !enableRasterize) {
      toast.warning(
        isEs
          ? 'Debes establecer al menos una contraseña o restricción'
          : 'Set at least one password or restriction',
      );
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

          // Mostrar pantalla de éxito
          const originalName = r.fileName.replace(/\.[^/.]+$/, '');
          const suffix = customSuffix || '_Protegido';
          setCompletedResult({
            downloadUrl: url,
            filename: `${originalName}${suffix}.pdf`,
            fileSize: formatFileSize(blob.size),
            rawBlob: blob,
            originalSize: files.find((f) => f.name === r.fileName)?.size || 0,
            protectedSize: blob.size,
            pageCount: r.pageCount,
            restrictions: r.restrictions,
          });

          toast.success(
            isEs
              ? `${r.fileName}: ¡Protegido con AES-256! ${r.restrictions.length} restricciones aplicadas.`
              : `${r.fileName}: Protected with AES-256! ${r.restrictions.length} restrictions applied.`,
          );
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
            toast.success(
              isEs
                ? `¡${newResults.length} PDFs protegidos con éxito!`
                : `${newResults.length} PDFs protected successfully!`,
            );
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
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/optimizar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-zinc-700" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / PROTECCIÓN Y CIFRADO DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Lock className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'PROTEGER Y CIFRAR DOCUMENTOS PDF CON CONTRASEÑA'
                  : 'PROTECT AND ENCRYPT PDF DOCUMENTS WITH PASSWORD'}
              </span>
            </h1>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <Package className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold">{files.length}</span> {isEs ? 'archivo(s)' : 'file(s)'}
            </div>
            <button
              onClick={handleRemoveAllFiles}
              disabled={isProcessing}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar todos' : 'Remove all'}
            >
              <Trash2 className="w-4 h-4" />
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
          className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'PROTEGER Y CIFRAR DOCUMENTOS PDF CON CONTRASEÑA'
              : 'PROTECT AND ENCRYPT PDF DOCUMENTS WITH PASSWORD'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Añade contraseñas de apertura y restringe permisos de copia, edición o impresión con cifrado AES-256 100% local.'
              : 'Add passwords and restrict permissions with AES-256 encryption 100% locally.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />{' '}
            {isEs ? 'Seleccionar Archivos PDF' : 'Select PDF Files'}
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
      ) : completedResult ? (
        /* PANTALLA DE ÉXITO Y DESCARGA */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <Lock className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA PROTECCIÓN' : 'PROTECTION RESULT'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans uppercase">
                    {isEs ? '¡PDF Protegido con Éxito!' : 'PDF Protected Successfully!'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {isEs
                      ? `Cifrado AES-256 · ${completedResult.restrictions.length} restricciones activas`
                      : `AES-256 Encryption · ${completedResult.restrictions.length} active restrictions`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-[#E8DFCF]/30 rounded-2xl text-xs text-[#E8DFCF] shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#FAF6EE]" />
                <span>{isEs ? 'Cifrado AES-256 Activo' : 'AES-256 Encrypted'}</span>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.originalSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Protegido' : 'Protected Size'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.protectedSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas' : 'Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-base font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.pageCount} />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Restricciones' : 'Restrictions'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-base font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.restrictions.length} />
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="proteger"
            onReset={() => {
              setCompletedResult(null);
              setResults([]);
              handleRemoveAllFiles();
            }}
          />
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(i);
                        }}
                        disabled={isProcessing}
                        className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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

            {/* VISTA PREVIA CON GRILLA DE MINIATURAS (3 COLUMNAS X 4 FILAS) */}
            <div
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative font-mono"
              style={{
                height: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                maxHeight: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                minHeight: '300px',
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="bg-[#121217] border-b border-zinc-800 p-3.5 flex justify-between items-center z-10 font-sans">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-2xl border border-zinc-700 bg-zinc-800 text-white flex-shrink-0 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden font-mono">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">
                      {activeFile?.name || ''}
                    </span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1.5">
                      <span>{activeFile ? formatFileSize(activeFile.size) : ''}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-300 font-bold">
                        {userPassword || ownerPassword
                          ? isEs
                            ? 'AES-256 Configurado'
                            : 'AES-256 Set'
                          : isEs
                            ? 'Sin Cifrado'
                            : 'Unencrypted'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span
                      className={`w-2 h-2 rounded-full ${userPassword || ownerPassword ? 'bg-white animate-pulse' : 'bg-zinc-500'}`}
                    />
                    <span>
                      {isEs ? `Miniaturas (${totalPages} págs)` : `Thumbnails (${totalPages} pgs)`}
                    </span>
                  </span>
                </div>
              </div>

              {/* GRILLA DE MINIATURAS */}
              <div className="w-full flex-1 min-h-0 max-lg:max-h-[500px] bg-[#0c0c0f] relative p-3 sm:p-4 overflow-y-auto font-sans flex flex-col justify-start custom-scrollbar">
                {isLoadingThumbnails ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[320px] my-auto">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">
                      {isEs ? 'Generando miniaturas...' : 'Generating thumbnails...'}
                    </span>
                  </div>
                ) : thumbnails.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 w-full">
                    {thumbnails.map((thumb) => (
                      <div
                        key={thumb.pageNum}
                        onClick={() => setPreviewPageNum(thumb.pageNum)}
                        className={`group relative bg-[#18181f] rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-2 shadow-sm hover:shadow-md ${
                          previewPageNum === thumb.pageNum
                            ? 'border-white ring-2 ring-white/40 bg-zinc-800 scale-[1.02]'
                            : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-xl border border-zinc-700/80 bg-white flex items-center justify-center min-h-[110px] max-h-[140px] w-full p-1 shadow-inner">
                          <img
                            src={thumb.dataUrl}
                            alt={`Página ${thumb.pageNum}`}
                            className="max-h-[130px] w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <div className="w-full flex items-center justify-between pt-0.5 font-mono text-[10px]">
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-lg ${
                              previewPageNum === thumb.pageNum
                                ? 'bg-white text-black font-extrabold shadow-sm'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {isEs ? `Pág ${thumb.pageNum}` : `Pg ${thumb.pageNum}`}
                          </span>
                          {previewPageNum === thumb.pageNum && (
                            <span className="text-white text-[9px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              {isEs ? 'Seleccionada' : 'Selected'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[320px] my-auto">
                    <FileText className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-mono">
                      {isEs ? 'Sin miniaturas disponibles' : 'No thumbnails available'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              ref={controlPanelRef}
              className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div>
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                      002 / CONFIGURACIÓN DE SEGURIDAD
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-white shadow-sm">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* === CONTRASEÑA DE APERTURA (User Password) === */}
                <div className="mb-5 bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                        {isEs ? 'Contraseña de Apertura' : 'User Password (Open)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-[11px] font-mono transition-all cursor-pointer shadow-sm"
                      title={
                        isEs
                          ? 'Generar y copiar contraseña segura aleatoria'
                          : 'Generate and copy random strong password'
                      }
                    >
                      <Sparkles className="w-3 h-3 text-black" />
                      <span>{isEs ? 'Generar Clave' : 'Generate'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3 font-sans leading-relaxed">
                    {isEs
                      ? 'Restringe quién puede abrir y leer el documento. Déjalo en blanco si solo deseas restricciones de permisos.'
                      : 'Restricts who can open and read the document. Leave blank for permission-only restrictions.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder={isEs ? 'Contraseña de apertura' : 'User password'}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword(!showUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showUserPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      value={confirmUserPassword}
                      onChange={(e) => setConfirmUserPassword(e.target.value)}
                      placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  {userPassword && (
                    <div className="mt-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${userPwdStrength.color}`}
                            style={{ width: `${(userPwdStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-300">
                          {userPwdStrength.label}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                        {isEs
                          ? 'Usa 8+ caracteres con mayúsculas, números y símbolos'
                          : 'Use 8+ chars with uppercase, numbers & symbols'}
                      </p>
                    </div>
                  )}
                </div>

                {/* === CONTRASEÑA DE PROPIETARIO (Owner Password) === */}
                <div className="mb-5 bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      {isEs ? 'Contraseña de Propietario' : 'Owner Password (Permissions)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3 font-sans leading-relaxed">
                    {isEs
                      ? 'Contraseña maestra para restringir permisos sin impedir la lectura. Si no se establece, se genera una automáticamente.'
                      : 'Master password to restrict permissions without blocking reading. Auto-generated if left blank.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type={showOwnerPassword ? 'text' : 'password'}
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        placeholder={
                          isEs ? 'Contraseña maestra (opcional)' : 'Owner password (optional)'
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showOwnerPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <input
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={confirmOwnerPassword}
                      onChange={(e) => setConfirmOwnerPassword(e.target.value)}
                      placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* === PANEL DE POLÍTICAS DE SEGURIDAD (PERMISOS GRANULARES) === */}
                <div className="mb-5 bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                        {isEs ? 'Políticas de Seguridad' : 'Security Policies'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={applyReadOnly}
                        className="text-[9px] font-bold px-2.5 py-1 rounded-xl bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 transition-all font-mono cursor-pointer shadow-sm"
                      >
                        {isEs ? 'Solo lectura' : 'Read-only'}
                      </button>
                      <button
                        onClick={applyMaxProtection}
                        className="text-[9px] font-bold px-2.5 py-1 rounded-xl bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 transition-all font-mono cursor-pointer shadow-sm"
                      >
                        {isEs ? 'Máxima protección' : 'Max protection'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* IMPRESIÓN */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">
                            {isEs ? 'Permitir impresión' : 'Allow printing'}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {isEs
                              ? 'El usuario puede imprimir el documento'
                              : 'User can print the document'}
                          </p>
                        </div>
                        <div
                          onClick={() => {
                            setAllowPrinting(!allowPrinting);
                            if (!allowPrinting) setAllowHighQualityPrint(false);
                          }}
                          className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowPrinting ? 'bg-white' : 'bg-zinc-700'}`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowPrinting ? 'left-4' : 'left-0.5'}`}
                          />
                        </div>
                      </div>
                      {allowPrinting && (
                        <div className="mt-2 pl-2 border-l-2 border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400">
                              {isEs ? 'Alta calidad' : 'High quality'}
                            </span>
                            <div
                              onClick={() => setAllowHighQualityPrint(!allowHighQualityPrint)}
                              className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowHighQualityPrint ? 'bg-white' : 'bg-zinc-700'}`}
                            >
                              <div
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowHighQualityPrint ? 'left-4' : 'left-0.5'}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COPIA */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isEs ? 'Permitir copia de texto/imágenes' : 'Allow copying text/images'}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {isEs
                            ? 'Ctrl+C / clic derecho sobre contenido'
                            : 'Ctrl+C / right-click on content'}
                        </p>
                      </div>
                      <div
                        onClick={() => {
                          setAllowCopying(!allowCopying);
                          setAllowExtraction(!allowCopying);
                        }}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowCopying ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowCopying ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    {/* MODIFICACIÓN */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isEs ? 'Permitir modificación de páginas' : 'Allow page modification'}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {isEs
                            ? 'Rotar, eliminar, insertar páginas'
                            : 'Rotate, delete, insert pages'}
                        </p>
                      </div>
                      <div
                        onClick={() => {
                          setAllowModifying(!allowModifying);
                          setAllowAssembly(!allowModifying);
                        }}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowModifying ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowModifying ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    {/* FORMULARIOS */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isEs ? 'Permitir llenado de formularios' : 'Allow form filling'}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {isEs ? 'Campos de formulario interactivos' : 'Interactive form fields'}
                        </p>
                      </div>
                      <div
                        onClick={() => setAllowFillingForms(!allowFillingForms)}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowFillingForms ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowFillingForms ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    {/* ANOTACIONES */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isEs ? 'Permitir anotaciones/comentarios' : 'Allow annotations/comments'}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {isEs
                            ? 'Resaltar, subrayar, notas adhesivas'
                            : 'Highlight, underline, sticky notes'}
                        </p>
                      </div>
                      <div
                        onClick={() => setAllowAnnotating(!allowAnnotating)}
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${allowAnnotating ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${allowAnnotating ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumen de restricciones activas */}
                  {hasAnyRestriction && (
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-[10px] text-amber-300 font-mono">
                      <span className="font-bold">
                        {isEs ? 'Restricciones activas:' : 'Active restrictions:'}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {!allowPrinting && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">
                            {isEs ? 'Impresión' : 'Print'}
                          </span>
                        )}
                        {!allowCopying && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">
                            {isEs ? 'Copia' : 'Copy'}
                          </span>
                        )}
                        {!allowModifying && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">
                            {isEs ? 'Edición' : 'Edit'}
                          </span>
                        )}
                        {!allowFillingForms && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">
                            {isEs ? 'Formularios' : 'Forms'}
                          </span>
                        )}
                        {!allowAnnotating && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">
                            {isEs ? 'Anotaciones' : 'Annotations'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* === OPCIONES AVANZADAS (SIEMPRE VISIBLES) === */}
                <div className="mb-5 bg-zinc-950/60 border border-white/10 rounded-2xl p-4 sm:p-5 font-sans space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider border-b border-white/10 pb-2 uppercase">
                    <Settings className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}</span>
                  </div>

                  <div
                    onClick={() => setEnableRasterize(!enableRasterize)}
                    className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-white">
                        {isEs
                          ? 'Rasterizar contenido (máxima seguridad)'
                          : 'Rasterize content (maximum security)'}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-mono">
                        {isEs
                          ? 'Convierte todo a imagen no editable ni buscable'
                          : 'Converts all to non-editable, non-searchable image'}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${enableRasterize ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${enableRasterize ? 'left-4' : 'left-0.5'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">
                      {isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}
                    </label>
                    <input
                      type="text"
                      value={customSuffix}
                      onChange={(e) => setCustomSuffix(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                    />
                    <p className="text-[9px] font-mono text-zinc-600 mt-1">
                      {isEs
                        ? `Ejemplo: archivo${customSuffix}.pdf`
                        : `Example: file${customSuffix}.pdf`}
                    </p>
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESO + BOTÓN */}
              <div>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 font-mono"
                    >
                      <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
                        <span className="truncate mr-2">{progressMsg}</span>
                        <span className="font-bold tabular-nums">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-white/10">
                        <motion.div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ ease: 'easeInOut', duration: 0.3 }}
                        />
                      </div>
                      {totalFilesCount > 1 && (
                        <p className="text-[9px] text-zinc-500 mt-1 text-center">
                          {isEs
                            ? `Archivo ${currentFileIndex} de ${totalFilesCount}`
                            : `File ${currentFileIndex} of ${totalFilesCount}`}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={executeProtect}
                    disabled={isProcessing || files.length === 0}
                    className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>{isEs ? 'Cifrando...' : 'Encrypting...'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-black" />
                        <span>
                          {isEs
                            ? files.length > 1
                              ? `Proteger ${files.length} archivos`
                              : 'Proteger PDF'
                            : files.length > 1
                              ? `Protect ${files.length} files`
                              : 'Protect PDF'}
                        </span>
                      </>
                    )}
                  </button>
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
