'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Activity,
  FileDown,
  Loader2,
  X,
  FilePlus,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Shield,
  Zap,
  Target,
  Archive,
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Binary,
  FileWarning,
  Database,
  FileCode2,
  Lock,
  Eye,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import type {
  RepairOptions,
  DiagnosticResult,
  RecoveryReport,
  RepairProgress,
  RepairResult,
  RepairError,
} from '@/workers/pdf-repair.worker';

// ---------------------------------------------------------------------------
// TIPOS LOCALES
// ---------------------------------------------------------------------------

type RepairMode = 'smart' | 'deep';
type RecoveryPriority = 'texto' | 'imagenes' | 'todo';
type PageScope = 'todas' | 'pares' | 'impares' | 'rango';
type CompressionLevel = 'none' | 'low' | 'medium' | 'high';
type DamagedPageAction = 'omitir' | 'sustituir' | 'incluir_vacia';

interface DiagnosticDisplay {
  severity: 'ok' | 'warning' | 'critical';
  summary: string;
  issues: { category: string; severity: string; message: string; details?: string }[];
  fileSize: number;
}

// ---------------------------------------------------------------------------
// UNION TYPE PARA MENSAJES DEL WORKER (discriminated union)
// ---------------------------------------------------------------------------

type WorkerMessageFromWorker =
  DiagnosticResult | RepairProgress | RecoveryReport | RepairResult | RepairError;

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------

export default function PdfRepairer() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const [file, setFile] = useState<File | null>(() => globalFile || null);

  // Modo & opciones
  const [repairMode, setRepairMode] = useState<RepairMode>('smart');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recoveryPriority, setRecoveryPriority] = useState<RecoveryPriority>('todo');
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('low');
  const [damagedPageAction, setDamagedPageAction] = useState<DamagedPageAction>('omitir');
  const [addRepairStamp, setAddRepairStamp] = useState(false);
  const [removeRestrictions, setRemoveRestrictions] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Reparado');

  // Estado de procesamiento
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPhase, setProgressPhase] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Diagnóstico previo
  const [diagnostic, setDiagnostic] = useState<DiagnosticDisplay | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [previewTab, setPreviewTab] = useState<'thumbnails' | 'diagnostic'>('thumbnails');

  // Reporte de recuperación
  const [recoveryReport, setRecoveryReport] = useState<RecoveryReport | null>(null);

  // Estado de éxito para pantalla de descarga
  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize: string;
    rawBlob?: Blob;
    originalSize: number;
    repairedSize: number;
    pagesRecovered: number;
    pagesLost: number;
    repairMethod: string;
  } | null>(null);

  // Previsualización Canvas / Miniaturas PDF
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

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
  }, [file]);

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

  // ---------------------------------------------------------------------------
  // GENERACIÓN DE MINIATURAS
  // ---------------------------------------------------------------------------

  const pdfUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

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
    } catch (err) {
      console.warn('Fallback al generar miniaturas en PDF:', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      setPreviewPageNum(1);
      loadFileThumbnails(file);
    } else {
      setThumbnails([]);
      setTotalPages(1);
    }
  }, [file, loadFileThumbnails]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // ---------------------------------------------------------------------------
  // MANEJO DE ARCHIVO
  // ---------------------------------------------------------------------------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setDiagnostic(null);
      setShowDiagnostic(false);
      setRecoveryReport(null);
      setCompletedResult(null);
      setProgressPercent(0);
      setProgressMsg('');
      toast.success(isEs ? 'Archivo cargado correctamente' : 'File loaded successfully');
    }
    e.target.value = '';
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setDownloadUrl(null);
    setGlobalFile(null);
    setDiagnostic(null);
    setShowDiagnostic(false);
    setRecoveryReport(null);
    setCompletedResult(null);
    setProgressPercent(0);
    setProgressMsg('');
  }, [setGlobalFile]);

  // ---------------------------------------------------------------------------
  // DIAGNÓSTICO PREVIO (rápido, sin worker completo — escanea header/EOF/xref/obj en el hilo principal)
  // ---------------------------------------------------------------------------

  const runPreliminaryDiagnosis = async () => {
    if (!file) return;
    setDiagnostic(null);
    setShowDiagnostic(true);

    const uint8 = new Uint8Array(await file.arrayBuffer());
    const issues: DiagnosticDisplay['issues'] = [];
    let criticalCount = 0;
    let warningCount = 0;

    // 1. Header
    let headerOffset = -1;
    for (let i = 0; i < Math.min(uint8.length - 5, 8192); i++) {
      if (
        uint8[i] === 0x25 &&
        uint8[i + 1] === 0x50 &&
        uint8[i + 2] === 0x44 &&
        uint8[i + 3] === 0x46 &&
        uint8[i + 4] === 0x2d
      ) {
        headerOffset = i;
        break;
      }
    }
    if (headerOffset < 0) {
      issues.push({
        category: 'header',
        severity: 'critical',
        message: 'Firma %PDF- no encontrada',
        details: 'Archivo severamente corrupto o no es PDF',
      });
      criticalCount++;
    } else if (headerOffset > 0) {
      issues.push({
        category: 'header',
        severity: 'warning',
        message: `${headerOffset} bytes basura antes de %PDF-`,
        details: 'Posible corrupción por descarga interrumpida',
      });
      warningCount++;
    } else {
      issues.push({
        category: 'header',
        severity: 'ok',
        message: 'Cabecera %PDF- en posición correcta',
      });
    }

    // 2. Trailer EOF
    const tailCheck = Math.min(uint8.length, 4096);
    let hasEof = false;
    for (let i = uint8.length - tailCheck; i < uint8.length - 4; i++) {
      if (
        uint8[i] === 0x25 &&
        uint8[i + 1] === 0x25 &&
        uint8[i + 2] === 0x45 &&
        uint8[i + 3] === 0x4f &&
        uint8[i + 4] === 0x46
      ) {
        hasEof = true;
        break;
      }
    }
    if (!hasEof) {
      issues.push({
        category: 'trailer',
        severity: 'critical',
        message: 'Marcador %%EOF ausente o corrupto',
        details: 'El fin de documento no es válido',
      });
      criticalCount++;
    } else {
      issues.push({ category: 'trailer', severity: 'ok', message: 'Marcador %%EOF verificado' });
    }

    // 3. XRef
    const text = new TextDecoder('latin1').decode(
      uint8.slice(0, Math.min(uint8.length, 512 * 1024)),
    );
    const xrefCount = (text.match(/xref\s+/g) || []).length;
    const startxrefCount = (text.match(/startxref\s+\d+/g) || []).length;
    if (xrefCount === 0) {
      issues.push({
        category: 'xref',
        severity: 'critical',
        message: 'Tabla xref no encontrada',
        details: 'Los objetos no pueden localizarse',
      });
      criticalCount++;
    } else if (xrefCount > 3) {
      issues.push({
        category: 'xref',
        severity: 'warning',
        message: `Múltiples tablas xref (${xrefCount})`,
        details: 'Posible fusión incorrecta de documentos',
      });
      warningCount++;
    } else {
      issues.push({
        category: 'xref',
        severity: 'ok',
        message: `Tabla xref presente (${xrefCount} sección)`,
      });
    }
    if (startxrefCount === 0) {
      issues.push({
        category: 'xref',
        severity: 'critical',
        message: 'Puntero startxref no encontrado',
      });
      criticalCount++;
    }

    // 4. Objetos y streams
    const objCount = (text.match(/\d+\s+\d+\s+obj/g) || []).length;
    const endobjCount = (text.match(/endobj/g) || []).length;
    const streamCount = (text.match(/\bstream\b/g) || []).length;
    const endstreamCount = (text.match(/\bendstream\b/g) || []).length;
    if (objCount === 0) {
      issues.push({
        category: 'objects',
        severity: 'critical',
        message: 'No se detectaron objetos PDF',
        details: 'Estructura de objetos ausente',
      });
      criticalCount++;
    } else {
      issues.push({
        category: 'objects',
        severity: 'ok',
        message: `${objCount} objetos PDF detectados`,
      });
    }
    if (objCount !== endobjCount && objCount > 0) {
      issues.push({
        category: 'objects',
        severity: 'warning',
        message: `Desbalance obj/endobj: ${objCount} vs ${endobjCount}`,
      });
      warningCount++;
    }
    if (streamCount !== endstreamCount) {
      issues.push({
        category: 'streams',
        severity: 'warning',
        message: `Desbalance stream/endstream: ${streamCount} vs ${endstreamCount}`,
      });
      warningCount++;
    } else if (streamCount > 0) {
      issues.push({
        category: 'streams',
        severity: 'ok',
        message: `${streamCount} flujos de datos balanceados`,
      });
    }

    // 5. Encriptación
    if (text.includes('/Encrypt')) {
      issues.push({
        category: 'encryption',
        severity: 'warning',
        message: 'Documento cifrado (/Encrypt)',
        details: 'Se intentará ignorar el cifrado',
      });
      warningCount++;
    } else {
      issues.push({ category: 'encryption', severity: 'ok', message: 'Sin cifrado detectado' });
    }

    let severity: 'ok' | 'warning' | 'critical' = 'ok';
    let summary = '';
    if (criticalCount >= 2) {
      severity = 'critical';
      summary = isEs
        ? '🔴 Daño estructural severo. Se requiere Deep Rescue.'
        : '🔴 Severe structural damage. Deep Rescue required.';
    } else if (warningCount >= 2 || criticalCount >= 1) {
      severity = 'warning';
      summary = isEs
        ? '⚠️ Anomalías estructurales detectadas. Se recomienda Smart Repair.'
        : '⚠️ Structural anomalies detected. Smart Repair recommended.';
    } else {
      severity = 'ok';
      summary = isEs
        ? '✅ Estructura PDF sana. Se recomienda reparación ligera.'
        : '✅ PDF structure healthy. Light repair recommended.';
    }

    setDiagnostic({ severity, summary, issues, fileSize: file.size });
    setPreviewTab('diagnostic');
    toast.success(isEs ? '¡Diagnóstico previo completado!' : 'Preliminary diagnosis completed!');
  };

  // ---------------------------------------------------------------------------
  // REPARACIÓN (vía Web Worker)
  // ---------------------------------------------------------------------------

  const executeRepair = async () => {
    if (!file) {
      toast.error(isEs ? 'Selecciona un archivo PDF para reparar' : 'Select a PDF file to repair');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg(
      isEs ? 'Iniciando motor de reparación en Worker...' : 'Starting repair engine in Worker...',
    );
    setRecoveryReport(null);
    setDownloadUrl(null);

    let localUrl: string | null = null;
    const workerRef = new Worker(new URL('@/workers/pdf-repair.worker.ts', import.meta.url), {
      type: 'module',
    });

    try {
      const fileBuffer = await file.arrayBuffer();

      const options: RepairOptions = {
        mode: repairMode,
        recoveryPriority,
        pageScope,
        pageRange: pageRange || undefined,
        compressionLevel,
        damagedPageAction,
        addRepairStamp,
        removeRestrictions,
        customSuffix,
      };

      // Escuchar mensajes del worker (progreso, diagnóstico, reporte, resultado, error)
      const result = await new Promise<RepairResult>((resolve, reject) => {
        workerRef.onmessage = (event: MessageEvent) => {
          const data = event.data as WorkerMessageFromWorker;
          switch (data.type) {
            case 'diagnostic':
              setDiagnostic({
                severity: data.severity,
                summary: data.summary,
                issues: data.issues.map((i) => ({
                  category: i.category,
                  severity: i.severity,
                  message: i.message,
                  details: i.details,
                })),
                fileSize: data.fileSize,
              });
              break;

            case 'progress':
              setProgressPercent(data.percent ?? 0);
              setProgressMsg(data.message ?? '');
              setProgressPhase(data.phase ?? '');
              break;

            case 'report':
              setRecoveryReport(data);
              break;

            case 'result':
              resolve(data);
              break;

            case 'error':
              reject(new Error(data.message));
              break;
          }
        };

        workerRef.onerror = (err) => {
          reject(new Error(`Worker error: ${err.message}`));
        };

        // Enviar datos al worker
        workerRef.postMessage({ fileBuffer, fileName: file.name, options });
      });

      // Procesar resultado
      const blob = new Blob([result.repairedBytes], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);
      setProgressPercent(100);

      const originalName = file.name.replace(/\.[^/.]+$/, '');
      const suffix = customSuffix || '_Reparado';
      const report = recoveryReport || result.report;

      setCompletedResult({
        downloadUrl: localUrl,
        filename: `${originalName}${suffix}.pdf`,
        fileSize: formatFileSize(blob.size),
        rawBlob: blob,
        originalSize: file.size,
        repairedSize: blob.size,
        pagesRecovered: report?.pagesRecovered ?? 0,
        pagesLost: report?.pagesLost ?? 0,
        repairMethod: report?.repairMethod ?? repairMode,
      });
    } catch (error) {
      console.error(error);
      const errMsg =
        error instanceof Error ? error.message : isEs ? 'Error desconocido' : 'Unknown error';
      toast.error(isEs ? `Error al reparar: ${errMsg}` : `Repair error: ${errMsg}`);
    } finally {
      setIsProcessing(false);
      workerRef.terminate();
    }
  };

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const severityColor = (sev: string) => {
    if (sev === 'critical') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (sev === 'warning') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'header':
        return <FileCode2 className="w-3 h-3" />;
      case 'xref':
        return <Database className="w-3 h-3" />;
      case 'trailer':
        return <FileWarning className="w-3 h-3" />;
      case 'objects':
        return <Binary className="w-3 h-3" />;
      case 'streams':
        return <Eye className="w-3 h-3" />;
      case 'encryption':
        return <Lock className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full max-w-7xl mx-auto">
      <input
        type="file"
        accept=".pdf"
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
              004 / REPARACIÓN Y RESTAURACIÓN DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Activity className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'REPARAR Y RESTAURAR DOCUMENTOS PDF DAÑADOS'
                  : 'REPAIR AND RESTORE DAMAGED PDF DOCUMENTS'}
              </span>
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3 font-mono">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {file.name}
              </span>
            </div>
            <button
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* DROPZONE */
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
              ? 'REPARAR Y RESTAURAR DOCUMENTOS PDF DAÑADOS'
              : 'REPAIR AND RESTORE DAMAGED PDF DOCUMENTS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Recupera y repara archivos PDF corruptos o dañados con reconstrucción estructural y renderizado vectorial local.'
              : 'Repair and restore damaged PDF files with structural reconstruction 100% locally.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar PDF Dañado' : 'Select Corrupted PDF'}
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
          {/* BANNER DE MÉTRICAS DE REPARACIÓN */}
          <div className="bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            {/* Glow background accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight font-sans">
                    {isEs ? '¡Documento Reparado con Éxito!' : 'Document Repaired Successfully!'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {isEs
                      ? `Método: ${completedResult.repairMethod === 'smart' ? 'Smart Repair' : completedResult.repairMethod === 'deep' ? 'Deep Rescue' : 'Reparación'}`
                      : `Method: ${completedResult.repairMethod === 'smart' ? 'Smart Repair' : completedResult.repairMethod === 'deep' ? 'Deep Rescue' : 'Repair'}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{isEs ? 'Estructura Reconstruida' : 'Structure Rebuilt'}</span>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.originalSize)}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Reparado' : 'Repaired Size'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.repairedSize)}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Recuperadas' : 'Pages Recovered'}
                </span>
                <span className="text-white font-bold text-lg font-mono mt-0.5">
                  {completedResult.pagesRecovered}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Perdidas' : 'Pages Lost'}
                </span>
                <span
                  className={`font-bold text-lg font-mono mt-0.5 ${completedResult.pagesLost > 0 ? 'text-amber-400' : 'text-emerald-400'}`}
                >
                  {completedResult.pagesLost}
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
            currentToolId="reparar"
            onReset={() => {
              setCompletedResult(null);
              setDownloadUrl(null);
              setFile(null);
              setGlobalFile(null);
              setRecoveryReport(null);
              setDiagnostic(null);
              setShowDiagnostic(false);
              setProgressPercent(0);
              setProgressMsg('');
            }}
          />
        </motion.div>
      ) : (
        /* WORKSPACE */
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans"
          style={{ alignItems: 'stretch' }}
        >
          {/* LADO IZQUIERDO: PREVIEW (MINIATURAS) + DIAGNÓSTICO + REPORTE */}
          <div
            className="lg:col-span-5"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* PREVIEW CON GRILLA DE MINIATURAS */}
            <div
              className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex flex-col shadow-2xl overflow-hidden"
              style={{
                height: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                maxHeight: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                minHeight: '300px',
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 font-mono flex-shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 flex-shrink-0">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-white font-bold text-xs truncate block max-w-[180px] sm:max-w-[240px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="text-zinc-600">•</span>
                      <span
                        className={
                          diagnostic?.severity === 'critical'
                            ? 'text-red-400 font-bold'
                            : diagnostic?.severity === 'warning'
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400 font-bold'
                        }
                      >
                        {diagnostic
                          ? isEs
                            ? 'Diagnóstico listo'
                            : 'Diagnosis ready'
                          : isEs
                            ? 'Listo para reparar'
                            : 'Ready to repair'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <div className="bg-zinc-950 border border-white/10 p-0.5 rounded-full flex items-center gap-1">
                    <button
                      onClick={() => setPreviewTab('thumbnails')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewTab === 'thumbnails'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        {isEs ? `Miniaturas (${totalPages})` : `Thumbnails (${totalPages})`}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (!diagnostic) runPreliminaryDiagnosis();
                        else setPreviewTab('diagnostic');
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewTab === 'diagnostic'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span>{isEs ? 'Diagnóstico' : 'Diagnosis'}</span>
                      {diagnostic && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            diagnostic.severity === 'critical'
                              ? 'bg-red-400'
                              : diagnostic.severity === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                          }`}
                        />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
                    title={isEs ? 'Remover archivo' : 'Remove file'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CONTENEDOR PRINCIPAL DEL VISOR (MINIATURAS O DIAGNÓSTICO) */}
              <div className="relative w-full flex-1 min-h-0 max-lg:max-h-[500px] bg-[#09090b] rounded-xl overflow-y-auto p-3 border border-white/10 font-sans">
                {previewTab === 'diagnostic' ? (
                  diagnostic ? (
                    <div className="space-y-3 font-mono">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          {diagnostic.severity === 'critical' ? (
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          ) : diagnostic.severity === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            {isEs
                              ? 'Informe de Diagnóstico Estructural'
                              : 'Structural Diagnosis Report'}
                          </h3>
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {formatFileSize(diagnostic.fileSize)}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${severityColor(diagnostic.severity)}`}
                      >
                        <p className="text-xs font-bold">{diagnostic.summary}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          {isEs ? 'Análisis de Componentes' : 'Component Breakdown'} (
                          {diagnostic.issues.length})
                        </span>
                        {diagnostic.issues.map((issue, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 text-[11px] px-2.5 py-2 rounded-xl border ${severityColor(issue.severity)}`}
                          >
                            <span className="flex-shrink-0 mt-0.5">
                              {categoryIcon(issue.category)}
                            </span>
                            <div>
                              <span className="font-bold text-zinc-200">{issue.message}</span>
                              {issue.details && (
                                <p className="text-[10px] text-zinc-400 mt-0.5">{issue.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 h-full min-h-[300px]">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      <span className="text-xs font-mono">
                        {isEs
                          ? 'Ejecutando diagnóstico estructural...'
                          : 'Running structural diagnosis...'}
                      </span>
                    </div>
                  )
                ) : isLoadingThumbnails ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 h-full min-h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="text-xs font-mono">
                      {isEs ? 'Generando miniaturas...' : 'Generating thumbnails...'}
                    </span>
                  </div>
                ) : thumbnails.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
                    {thumbnails.map((thumb) => (
                      <div
                        key={thumb.pageNum}
                        onClick={() => setPreviewPageNum(thumb.pageNum)}
                        className={`group relative bg-zinc-900/90 rounded-xl p-1.5 sm:p-2 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-1.5 shadow-md ${
                          previewPageNum === thumb.pageNum
                            ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-zinc-800'
                            : 'border-white/10 hover:border-white/30 hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white flex items-center justify-center h-[110px] sm:h-[125px] w-full p-1">
                          <img
                            src={thumb.dataUrl}
                            alt={`Página ${thumb.pageNum}`}
                            className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <div className="w-full flex items-center justify-between pt-0.5 font-mono text-[9px] sm:text-[10px]">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded-full ${
                              previewPageNum === thumb.pageNum
                                ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                                : 'bg-zinc-800 text-zinc-300 border border-white/10'
                            }`}
                          >
                            {isEs ? `Pág ${thumb.pageNum}` : `Pg ${thumb.pageNum}`}
                          </span>
                          {previewPageNum === thumb.pageNum && (
                            <span className="text-emerald-400 text-[8px] sm:text-[9px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-full rounded border-0 min-h-[300px]"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 h-full min-h-[300px]">
                    <FileText className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-mono">
                      {isEs ? 'Sin miniaturas disponibles' : 'No thumbnails available'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* REPORTE DE RECUPERACIÓN */}
            <AnimatePresence>
              {recoveryReport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-5 overflow-hidden shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      {isEs ? 'Reporte de Recuperación' : 'Recovery Report'}
                    </h3>
                    <span className="text-[10px] text-zinc-500 ml-auto font-mono">
                      {recoveryReport.repairTimeMs}ms
                    </span>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {isEs ? 'Método' : 'Method'}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {recoveryReport.repairMethod === 'smart'
                          ? 'Smart Repair'
                          : recoveryReport.repairMethod === 'deep'
                            ? 'Deep Rescue'
                            : 'Parcial'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {isEs ? 'Págs. Recuperadas' : 'Pages Recovered'}
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {recoveryReport.pagesRecovered}
                      </span>
                    </div>
                    <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {isEs ? 'Vectores' : 'Vectors'}
                      </span>
                      <span
                        className={`text-sm font-bold ${recoveryReport.vectorPreserved ? 'text-emerald-400' : 'text-amber-400'}`}
                      >
                        {recoveryReport.vectorPreserved ? '✓ Preservados' : '✗ Rasterizados'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {isEs ? 'Fuentes' : 'Fonts'}
                      </span>
                      <span
                        className={`text-sm font-bold ${recoveryReport.fontsPreserved ? 'text-emerald-400' : 'text-amber-400'}`}
                      >
                        {recoveryReport.fontsPreserved ? '✓ Preservadas' : '✗ Perdidas'}
                      </span>
                    </div>
                  </div>

                  {/* Detalles */}
                  {recoveryReport.pagesLost > 0 && (
                    <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mb-2 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" />
                      {recoveryReport.pagesLost}{' '}
                      {isEs
                        ? 'página(s) perdida(s) por corrupción irrecuperable'
                        : 'page(s) lost to irrecoverable corruption'}
                      {recoveryReport.lostPageNumbers.length > 0 && (
                        <span className="text-zinc-400 ml-1">
                          ({recoveryReport.lostPageNumbers.join(', ')})
                        </span>
                      )}
                    </div>
                  )}
                  {recoveryReport.blankPageNumbers.length > 0 && (
                    <div className="text-[11px] text-zinc-400 bg-zinc-900/60 border border-white/10 rounded-lg p-2.5 mb-2 font-mono">
                      {recoveryReport.blankPageNumbers.length}{' '}
                      {isEs ? 'página(s) en blanco insertada(s)' : 'blank page(s) inserted'}:{' '}
                      {recoveryReport.blankPageNumbers.join(', ')}
                    </div>
                  )}
                  {recoveryReport.substitutedPageNumbers.length > 0 && (
                    <div className="text-[11px] text-zinc-400 bg-zinc-900/60 border border-white/10 rounded-lg p-2.5 mb-2 font-mono">
                      {recoveryReport.substitutedPageNumbers.length}{' '}
                      {isEs ? 'página(s) sustituida(s) con aviso' : 'page(s) replaced with notice'}:{' '}
                      {recoveryReport.substitutedPageNumbers.join(', ')}
                    </div>
                  )}

                  {/* Issues fixed / unresolved */}
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {recoveryReport.issuesFixed.length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase block mb-1">
                          {isEs ? '✓ Problemas Resueltos' : '✓ Issues Fixed'}
                        </span>
                        {recoveryReport.issuesFixed.map((f, i) => (
                          <p
                            key={i}
                            className="text-[10px] text-zinc-300 font-mono leading-relaxed"
                          >
                            {f}
                          </p>
                        ))}
                      </div>
                    )}
                    {recoveryReport.issuesUnresolved.length > 0 && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
                        <span className="text-[10px] font-bold text-amber-400 font-mono uppercase block mb-1">
                          {isEs ? '⚠ Problemas Sin Resolver' : '⚠ Unresolved Issues'}
                        </span>
                        {recoveryReport.issuesUnresolved.map((u, i) => (
                          <p
                            key={i}
                            className="text-[10px] text-zinc-400 font-mono leading-relaxed"
                          >
                            {u}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {recoveryReport.warnings.length > 0 && (
                    <div className="mt-2 bg-zinc-900/60 border border-white/10 rounded-lg p-2.5">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase block mb-1">
                        {isEs ? 'Avisos' : 'Warnings'}
                      </span>
                      {recoveryReport.warnings.map((w, i) => (
                        <p key={i} className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                          {w}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              ref={controlPanelRef}
              className="bg-[#09090b] border border-white ring-2 ring-white/20 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-2xl font-sans"
            >
              <div>
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                      002 / CONFIGURACIÓN
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                      PANEL DE CONTROL
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* BOTÓN DE DIAGNÓSTICO PREVIO */}
                <button
                  onClick={runPreliminaryDiagnosis}
                  disabled={isProcessing}
                  className="w-full mb-3 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 font-mono shadow-sm"
                >
                  <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                  {isEs ? 'EJECUTAR DIAGNÓSTICO PREVIO' : 'RUN PRELIMINARY DIAGNOSIS'}
                </button>

                {/* RESUMEN DEL DIAGNÓSTICO (INMEDIATO EN PANEL DERECHO) */}
                {diagnostic && (
                  <div
                    className={`p-3 rounded-xl border mb-4 font-mono text-xs ${severityColor(diagnostic.severity)} flex flex-col gap-1.5 animate-fadeIn`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{diagnostic.summary}</span>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('diagnostic')}
                        className="text-[10px] text-zinc-300 hover:text-white underline cursor-pointer"
                      >
                        {isEs ? 'Ver en visor →' : 'View in canvas →'}
                      </button>
                    </div>
                    <p className="text-[10px] opacity-80">
                      {diagnostic.issues.length}{' '}
                      {isEs
                        ? 'componentes analizados. Resultados visibles en el visor izquierdo.'
                        : 'scans run. Details displayed in left viewport.'}
                    </p>
                  </div>
                )}

                {/* MODOS DE REPARACIÓN */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                    {isEs ? 'Modo de Reparación' : 'Repair Mode'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setRepairMode('smart')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${repairMode === 'smart' ? 'border-white bg-zinc-800 text-white shadow-md' : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white'}`}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          Smart Repair
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full border flex items-center justify-center ${repairMode === 'smart' ? 'border-white bg-white' : 'border-zinc-500'}`}
                        >
                          {repairMode === 'smart' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {isEs ? 'XRef + metadatos' : 'XRef + metadata'}
                      </p>
                      <span className="inline-block mt-1.5 text-[8px] font-mono font-bold bg-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded">
                        Estructural
                      </span>
                    </div>
                    <div
                      onClick={() => setRepairMode('deep')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${repairMode === 'deep' ? 'border-white bg-zinc-800 text-white shadow-md' : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white'}`}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-blue-400" />
                          Deep Rebuild
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full border flex items-center justify-center ${repairMode === 'deep' ? 'border-white bg-white' : 'border-zinc-500'}`}
                        >
                          {repairMode === 'deep' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {isEs ? 'Render visual avanzado' : 'Advanced visual render'}
                      </p>
                      <span className="inline-block mt-1.5 text-[8px] font-mono font-bold bg-blue-900/60 text-blue-400 px-1.5 py-0.5 rounded">
                        Visual
                      </span>
                    </div>
                  </div>
                </div>

                {/* BARRA DE PROGRESO (cuando está procesando) */}
                {isProcessing && (
                  <div className="mb-4 bg-zinc-950 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="text-[11px] font-bold text-white font-mono">
                        {progressPhase === 'diagnosis'
                          ? isEs
                            ? '🔍 Diagnóstico'
                            : '🔍 Diagnosis'
                          : progressPhase === 'smart-repair'
                            ? isEs
                              ? '🔧 Smart Repair'
                              : '🔧 Smart Repair'
                            : progressPhase === 'deep-rescue'
                              ? isEs
                                ? '⚙️ Deep Rescue'
                                : '⚙️ Deep Rescue'
                              : progressPhase === 'packaging'
                                ? isEs
                                  ? '📦 Empaquetando'
                                  : '📦 Packaging'
                                : isEs
                                  ? 'Procesando'
                                  : 'Processing'}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-auto font-mono">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono mt-2 leading-relaxed">
                      {progressMsg}
                    </p>
                  </div>
                )}

                {/* OPCIONES AVANZADAS (SIEMPRE VISIBLES Y COMPACTAS) */}
                <div className="mb-4 space-y-4 bg-zinc-950/60 border border-white/10 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider border-b border-white/10 pb-2 mb-3 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isEs ? 'OPCIONES AVANZADAS DE RECUPERACIÓN' : 'ADVANCED RECOVERY OPTIONS'}
                    </span>
                  </div>

                  {/* PRIORIDAD */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Prioridad de Recuperación' : 'Recovery Priority'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['texto', 'imagenes', 'todo'] as RecoveryPriority[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setRecoveryPriority(opt)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${recoveryPriority === opt ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'}`}
                        >
                          {opt === 'texto'
                            ? '📄 Texto'
                            : opt === 'imagenes'
                              ? '🖼️ Imgs'
                              : '⚡ Todo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ALCANCE */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <FileCheck2 className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {(['todas', 'pares', 'impares', 'rango'] as PageScope[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setPageScope(opt)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${pageScope === opt ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'}`}
                        >
                          {opt === 'todas'
                            ? isEs
                              ? 'Todas'
                              : 'All'
                            : opt === 'pares'
                              ? isEs
                                ? 'Pares'
                                : 'Even'
                              : opt === 'impares'
                                ? isEs
                                  ? 'Impares'
                                  : 'Odd'
                                : isEs
                                  ? 'Rango'
                                  : 'Range'}
                        </button>
                      ))}
                    </div>
                    {pageScope === 'rango' && (
                      <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder={isEs ? 'Ej: 1-3, 5, 8-12' : 'e.g. 1-3, 5, 8-12'}
                        className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                      />
                    )}
                  </div>

                  {/* COMPRESIÓN */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Archive className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Compresión de Salida' : 'Output Compression'}
                    </label>
                    <div className="flex gap-1.5">
                      {(
                        [
                          ['none', isEs ? 'Sin comprimir' : 'None'],
                          ['low', isEs ? 'Baja' : 'Low'],
                          ['medium', isEs ? 'Media' : 'Med'],
                          ['high', isEs ? 'Alta' : 'High'],
                        ] as [CompressionLevel, string][]
                      ).map(([lvl, label]) => (
                        <button
                          key={lvl}
                          onClick={() => setCompressionLevel(lvl)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${compressionLevel === lvl ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ACCIÓN EN PÁGINAS DAÑADAS */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Acción ante Páginas Dañadas' : 'Action on Corrupted Pages'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ['omitir', isEs ? 'Omitir' : 'Skip'],
                          ['sustituir', isEs ? 'Sustituir' : 'Replace'],
                          ['incluir_vacia', isEs ? 'Vía en blanco' : 'Blank'],
                        ] as [DamagedPageAction, string][]
                      ).map(([act, label]) => (
                        <button
                          key={act}
                          onClick={() => setDamagedPageAction(act)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${damagedPageAction === act ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* OPCIONES DE SEGURIDAD Y SELLADO */}
                  <div className="space-y-2">
                    <div
                      onClick={() => setRemoveRestrictions((v) => !v)}
                      className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-white">
                          {isEs
                            ? 'Eliminar restricciones de impresión/copia'
                            : 'Remove print/copy restrictions'}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {isEs
                            ? 'Desbloquea permisos del documento'
                            : 'Unlock document permissions'}
                        </p>
                      </div>
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${removeRestrictions ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${removeRestrictions ? 'left-4' : 'left-0.5'}`}
                        />
                      </div>
                    </div>

                    <div
                      onClick={() => setAddRepairStamp((v) => !v)}
                      className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-white">
                          {isEs ? 'Añadir sello de reparación (pie)' : 'Add repair stamp (footer)'}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {isEs ? 'Marca el PDF como reparado' : 'Marks the PDF as repaired'}
                        </p>
                      </div>
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${addRepairStamp ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${addRepairStamp ? 'left-4' : 'left-0.5'}`}
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
                          ? `Salida: ${file?.name?.replace(/\.[^/.]+$/, '') ?? 'archivo'}${customSuffix}.pdf`
                          : `Output: ${file?.name?.replace(/\.[^/.]+$/, '') ?? 'file'}${customSuffix}.pdf`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTÓN DE ACCIÓN PRINCIPAL */}
              <div>
                <button
                  onClick={executeRepair}
                  disabled={isProcessing}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>
                        {progressPercent > 0
                          ? `${progressPercent}%`
                          : isEs
                            ? 'Reparando...'
                            : 'Repairing...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-black" />
                      <span>{isEs ? 'Reparar PDF' : 'Repair PDF'}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-4 border-t border-white/10 pt-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    100% Local · Web Worker
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {isEs ? 'Listo →' : 'Ready →'}
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
