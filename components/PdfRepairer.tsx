'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Activity,
  Loader2,
  X,
  FileText,
  SlidersHorizontal,
  Zap,
  Target,
  Archive,
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
  ShieldCheck,
  Trash2,
  Plus,
  Wrench,
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import JSZip from 'jszip';
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

export interface RepairedItem {
  fileName: string;
  originalSize: number;
  repairedSize: number;
  downloadUrl: string;
  rawBlob?: Blob;
  pagesRecovered: number;
  pagesLost: number;
}

interface SlotItem {
  id: number;
  file: File | null;
}

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

  // Sistema de 3 slots independientes
  const [slots, setSlots] = useState<SlotItem[]>(() => [
    { id: 1, file: globalFile || null },
    { id: 2, file: null },
    { id: 3, file: null },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const slot3InputRef = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (idx: number) => {
    if (idx === 0) return slot1InputRef;
    if (idx === 1) return slot2InputRef;
    return slot3InputRef;
  };

  const activeSlot = slots[activeSlotIndex];
  const activeFile = activeSlot?.file || null;
  const activeFiles = slots.map((s) => s.file).filter(Boolean) as File[];
  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sincronizar activeFile con file y globalFile
  useEffect(() => {
    queueMicrotask(() => {
      setFile(activeFile);
      setGlobalFile(activeFile);
    });
  }, [activeFile, setGlobalFile]);

  const loadSingleFileIntoSlot = (slotIdx: number, newFile: File) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], file: newFile };
      return next;
    });
    setActiveSlotIndex(slotIdx);
    setDiagnostic(null);
    setRecoveryReport(null);
    setCompletedResult(null);
    toast.success(isEs ? `PDF cargado en Caja ${slotIdx + 1}` : `PDF loaded in Box ${slotIdx + 1}`);
  };

  const handleSlotFileChange = (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      loadSingleFileIntoSlot(slotIdx, f);
    }
    e.target.value = '';
  };

  const handleRemoveSlot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], file: null };
      return next;
    });
    if (activeSlotIndex === slotIdx) {
      const remainingIdx = [0, 1, 2].find((i) => i !== slotIdx && slots[i]?.file !== null);
      if (remainingIdx !== undefined) {
        setActiveSlotIndex(remainingIdx);
      } else {
        setFile(null);
        setGlobalFile(null);
      }
    }
  };

  const handleRemoveAllFiles = () => {
    setSlots([
      { id: 1, file: null },
      { id: 2, file: null },
      { id: 3, file: null },
    ]);
    setActiveSlotIndex(0);
    setFile(null);
    setGlobalFile(null);
    setCompletedResult(null);
    setDiagnostic(null);
    setRecoveryReport(null);
  };

  // Modo & opciones
  const [repairMode, setRepairMode] = useState<RepairMode>('smart');
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

  // Diagnóstico previo
  const [diagnostic, setDiagnostic] = useState<DiagnosticDisplay | null>(null);
  const [previewTab, setPreviewTab] = useState<'thumbnails' | 'diagnostic'>('thumbnails');

  // Reporte de recuperación
  const [recoveryReport, setRecoveryReport] = useState<RecoveryReport | null>(null);

  // Estado de éxito para pantalla de descarga
  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize: string;
    rawBlob?: Blob;
    totalOriginalSize: number;
    totalRepairedSize: number;
    pagesRecovered: number;
    pagesLost: number;
    repairMethod: string;
    items: RepairedItem[];
  } | null>(null);
  const [isCreatingZip, setIsCreatingZip] = useState(false);

  // Previsualización Canvas / Miniaturas PDF
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

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
      queueMicrotask(() => {
        setPreviewPageNum(1);
        loadFileThumbnails(file);
      });
    } else {
      queueMicrotask(() => {
        setThumbnails([]);
        setTotalPages(1);
      });
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
      const uploadedFiles = Array.from(e.target.files).slice(0, 3);
      if (uploadedFiles.length === 1) {
        loadSingleFileIntoSlot(activeSlotIndex, uploadedFiles[0]);
      } else {
        setSlots((prev) => {
          const next = [...prev];
          uploadedFiles.forEach((f, idx) => {
            if (idx < 3) {
              next[idx] = { ...next[idx], file: f };
            }
          });
          return next;
        });
        setActiveSlotIndex(0);
        setCompletedResult(null);
        toast.success(
          isEs
            ? `${uploadedFiles.length} archivos PDF cargados`
            : `${uploadedFiles.length} PDF files loaded`,
        );
      }
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, 3);
    if (droppedFiles.length === 0) return;
    if (droppedFiles.length === 1) {
      loadSingleFileIntoSlot(activeSlotIndex, droppedFiles[0]);
    } else {
      setSlots((prev) => {
        const next = [...prev];
        droppedFiles.forEach((f, idx) => {
          if (idx < 3) {
            next[idx] = { ...next[idx], file: f };
          }
        });
        return next;
      });
      setActiveSlotIndex(0);
      setCompletedResult(null);
      toast.success(
        isEs
          ? `${droppedFiles.length} archivos PDF cargados`
          : `${droppedFiles.length} PDF files loaded`,
      );
    }
  };

  // ---------------------------------------------------------------------------
  // DIAGNÓSTICO PREVIO (rápido, sin worker completo — escanea header/EOF/xref/obj en el hilo principal)
  // ---------------------------------------------------------------------------

  const runPreliminaryDiagnosis = async () => {
    if (!file) return;
    setDiagnostic(null);

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
    if (activeFiles.length === 0) {
      toast.error(
        isEs
          ? 'Selecciona al menos un archivo PDF para reparar'
          : 'Select at least one PDF file to repair',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg(
      isEs ? 'Iniciando motor de reparación en Worker...' : 'Starting repair engine in Worker...',
    );
    setRecoveryReport(null);

    const repairedItems: RepairedItem[] = [];
    let totalPagesRecovered = 0;
    let totalPagesLost = 0;
    let totalOriginalSize = 0;
    let totalRepairedSize = 0;

    const suffix = customSuffix || '_Reparado';

    try {
      for (let i = 0; i < activeFiles.length; i++) {
        const currentFile = activeFiles[i];
        const filePrefix =
          activeFiles.length > 1
            ? isEs
              ? `[${i + 1}/${activeFiles.length}] ${currentFile.name}: `
              : `[${i + 1}/${activeFiles.length}] ${currentFile.name}: `
            : '';

        const workerRef = new Worker(new URL('@/workers/pdf-repair.worker.ts', import.meta.url), {
          type: 'module',
        });

        try {
          const fileBuffer = await currentFile.arrayBuffer();
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

          const result = await new Promise<RepairResult>((resolve, reject) => {
            workerRef.onmessage = (event: MessageEvent) => {
              const data = event.data as WorkerMessageFromWorker;
              switch (data.type) {
                case 'diagnostic':
                  if (i === activeSlotIndex) {
                    setDiagnostic({
                      severity: data.severity,
                      summary: data.summary,
                      issues: data.issues.map((iss) => ({
                        category: iss.category,
                        severity: iss.severity,
                        message: iss.message,
                        details: iss.details,
                      })),
                      fileSize: data.fileSize,
                    });
                  }
                  break;

                case 'progress': {
                  const basePercent = (i / activeFiles.length) * 100;
                  const fileShare = 100 / activeFiles.length;
                  const currentPercent = Math.round(
                    basePercent + ((data.percent ?? 0) / 100) * fileShare,
                  );
                  setProgressPercent(Math.min(currentPercent, 99));
                  setProgressMsg(`${filePrefix}${data.message ?? ''}`);
                  setProgressPhase(data.phase ?? '');
                  break;
                }

                case 'report':
                  if (i === activeSlotIndex) setRecoveryReport(data);
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

            workerRef.postMessage({ fileBuffer, fileName: currentFile.name, options });
          });

          const blob = new Blob([result.repairedBytes], { type: 'application/pdf' });
          const localUrl = URL.createObjectURL(blob);
          const originalName = currentFile.name.replace(/\.[^/.]+$/, '');
          const outFilename = `${originalName}${suffix}.pdf`;
          const recovered = result.report?.pagesRecovered ?? 0;
          const lost = result.report?.pagesLost ?? 0;

          totalPagesRecovered += recovered;
          totalPagesLost += lost;
          totalOriginalSize += currentFile.size;
          totalRepairedSize += blob.size;

          repairedItems.push({
            fileName: outFilename,
            originalSize: currentFile.size,
            repairedSize: blob.size,
            downloadUrl: localUrl,
            rawBlob: blob,
            pagesRecovered: recovered,
            pagesLost: lost,
          });
        } finally {
          workerRef.terminate();
        }
      }

      setProgressPercent(100);
      setProgressMsg(isEs ? '¡Reparación completada con éxito!' : 'Repair completed successfully!');

      const first = repairedItems[0];
      setCompletedResult({
        downloadUrl: first.downloadUrl,
        filename: first.fileName,
        fileSize: formatFileSize(first.repairedSize),
        rawBlob: first.rawBlob,
        totalOriginalSize,
        totalRepairedSize,
        pagesRecovered: totalPagesRecovered,
        pagesLost: totalPagesLost,
        repairMethod: repairMode,
        items: repairedItems,
      });

      toast.success(
        isEs
          ? `¡${repairedItems.length} archivo(s) reparado(s) con éxito!`
          : `¡${repairedItems.length} file(s) repaired successfully!`,
      );
    } catch (error) {
      console.error(error);
      const errMsg =
        error instanceof Error ? error.message : isEs ? 'Error desconocido' : 'Unknown error';
      toast.error(isEs ? `Error al reparar: ${errMsg}` : `Repair error: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (!completedResult || !completedResult.items || completedResult.items.length === 0) return;
    setIsCreatingZip(true);
    try {
      const zip = new JSZip();
      completedResult.items.forEach((item) => {
        if (item.rawBlob) {
          zip.file(item.fileName, item.rawBlob);
        }
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `PDFBlack_Reparados_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
      toast.success(
        isEs ? 'Paquete ZIP descargado con éxito' : 'ZIP package downloaded successfully',
      );
    } catch (err) {
      console.error('Error al generar ZIP:', err);
      toast.error(isEs ? 'Error al generar archivo ZIP' : 'Error generating ZIP file');
    } finally {
      setIsCreatingZip(false);
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

        {activeFiles.length > 0 && (
          <div className="flex items-center gap-3 font-mono">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs text-white">
              {activeFiles.length === 1 ? (
                <>
                  <FileText className="w-4 h-4 text-zinc-300" />
                  <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                    {activeFiles[0].name}
                  </span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-zinc-300" />
                  <span className="font-bold">{activeFiles.length}</span>
                  <span>{isEs ? 'archivos cargados' : 'files loaded'}</span>
                </>
              )}
            </div>
            <button
              onClick={handleRemoveAllFiles}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar todos' : 'Remove all'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!slots.some((s) => s.file !== null) ? (
        /* DROPZONE */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[520px] ${
            isDragging
              ? 'border-white ring-4 ring-white/20 bg-zinc-900/90 scale-[1.01]'
              : 'border-zinc-600 hover:border-white'
          }`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <Wrench className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de Reconstrucción Estructural v5.0 • 100% Local'
                : 'Structural Reconstruction Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'REPARA Y RECUPERA CUALQUIER ARCHIVO PDF DAÑADO'
              : 'REPAIR AND RECOVER ANY DAMAGED PDF DOCUMENT'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Reconstruye tablas xref corruptas, recupera flujos de datos stream huérfanos y restaura páginas ilegibles directamente en la memoria de tu navegador sin subir tus archivos a internet.'
              : 'Reconstruct corrupt xref tables, recover orphaned stream objects, and restore unreadable pages directly in browser memory without cloud uploads.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar Archivos PDF Dañados' : 'Select Damaged PDF Files'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Reconstrucción XRef' : '✓ XRef Rebuild'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Repara punteros de tabla y referencias rotas a nivel binario.'
                  : 'Repairs table pointers and broken byte references.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Rescate de Objetos' : '✓ Object Salvage'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Extrae texto, imágenes y vectores de streams desbalanceados.'
                  : 'Extracts text, images, and vectors from orphaned streams.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Estricta' : '✓ Strict Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Procesamiento en memoria RAM local sin enviar datos a servidores.'
                  : 'Local RAM processing without sending data to servers.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO Y DESCARGA UNIFICADA */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans"
        >
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="reparar"
            title={
              completedResult.items.length > 1
                ? isEs
                  ? `¡${completedResult.items.length} documentos reparados con éxito!`
                  : `¡${completedResult.items.length} documents repaired successfully!`
                : isEs
                  ? '¡Documento reparado con éxito!'
                  : 'Document repaired successfully!'
            }
            metrics={{
              categoryTitle: isEs ? 'ESTADO DE LA REPARACIÓN' : 'REPAIR STATUS',
              categorySubtitle: isEs
                ? `Método: ${completedResult.repairMethod === 'smart' ? 'Smart Repair' : completedResult.repairMethod === 'deep' ? 'Deep Rescue' : 'Reparación Estructural'}`
                : `Method: ${completedResult.repairMethod === 'smart' ? 'Smart Repair' : completedResult.repairMethod === 'deep' ? 'Deep Rescue' : 'Structural Repair'}`,
              badgeLabel: isEs ? 'Páginas:' : 'Pages:',
              badgeValue: `${completedResult.pagesRecovered} ${isEs ? 'recuperadas' : 'recovered'}`,
              originalSize: formatFileSize(completedResult.totalOriginalSize),
              compressedSize: formatFileSize(completedResult.totalRepairedSize),
              labelOriginal: isEs ? 'Tamaño Original' : 'Original Size',
              labelCompressed: isEs ? 'Tamaño Reparado' : 'Repaired Size',
              labelSaved: isEs ? 'Páginas Recuperadas' : 'Pages Recovered',
              savedSpace: `${completedResult.pagesRecovered} ${isEs ? 'páginas' : 'pages'}`,
              reductionPercent: 100,
            }}
            batchItems={
              completedResult.items.length > 1
                ? completedResult.items.map((item) => ({
                    fileName: item.fileName,
                    originalSize: item.originalSize,
                    compressedSize: item.repairedSize,
                    downloadUrl: item.downloadUrl,
                    rawBlob: item.rawBlob,
                  }))
                : undefined
            }
            onDownloadAllZip={handleDownloadAllZip}
            isCreatingZip={isCreatingZip}
            onReset={handleRemoveAllFiles}
          />
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO VERTICAL: SECCIÓN 1 (SUPERIOR) + SECCIÓN 2 (INFERIOR) */
        <div className="flex flex-col gap-6 mb-6 font-sans">
          {/* SECCIÓN 1: VISOR INTERACTIVO Y CAJAS DE ARCHIVOS (PARALELOS ARRIBA) */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Cabecera Sección 1 */}
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                  001 / VISOR INTERACTIVO Y DOCUMENTOS
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'PANEL DE VISTA PREVIA' : 'PREVIEW PANEL'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm font-mono">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>
                    {isEs
                      ? `Cajas Activas (${slots.filter((s) => s.file !== null).length}/3)`
                      : `Active Slots (${slots.filter((s) => s.file !== null).length}/3)`}
                  </span>
                </span>
              </div>
            </div>

            {/* Grid 2 Columnas Sección 1: Visor (50%) + 3 Cajas de Archivos (50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LADO IZQUIERDO: VISOR INTERACTIVO (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#0c0c0f] border border-zinc-800/80 rounded-2xl p-4 min-h-[380px]">
                {/* Header Visor con Tabs Miniaturas / Diagnóstico */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs text-zinc-400">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="text-white font-bold truncate max-w-[150px] sm:max-w-[200px]">
                      {activeFile?.name || (isEs ? 'Sin documento' : 'No document')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-full">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('thumbnails')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        previewTab === 'thumbnails'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? `Miniaturas (${totalPages})` : `Thumbnails (${totalPages})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!diagnostic) runPreliminaryDiagnosis();
                        else setPreviewTab('diagnostic');
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                        previewTab === 'diagnostic'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Activity
                        className={`w-3 h-3 ${previewTab === 'diagnostic' ? 'text-black' : 'text-zinc-400'}`}
                      />
                      <span>{isEs ? 'Diagnóstico' : 'Diagnosis'}</span>
                    </button>
                  </div>
                </div>

                {/* Contenido Central del Visor */}
                <div className="flex-1 flex flex-col items-center justify-center my-3 relative min-h-[220px]">
                  {previewTab === 'diagnostic' ? (
                    diagnostic ? (
                      <div className="w-full space-y-3 font-mono max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            {diagnostic.severity === 'critical' ? (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            ) : diagnostic.severity === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
                                  <p className="text-[10px] text-zinc-400 mt-0.5">
                                    {issue.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[220px]">
                        <Loader2 className="w-7 h-7 animate-spin text-white" />
                        <span className="text-xs font-mono">
                          {isEs ? 'Ejecutando diagnóstico...' : 'Running diagnosis...'}
                        </span>
                      </div>
                    )
                  ) : isLoadingThumbnails ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span>{isEs ? 'Renderizando páginas...' : 'Rendering pages...'}</span>
                    </div>
                  ) : thumbnails.length > 0 ? (
                    (() => {
                      const activeThumb =
                        thumbnails.find((t) => t.pageNum === previewPageNum) || thumbnails[0];
                      return (
                        <div className="relative group max-h-[280px] max-w-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeThumb.dataUrl}
                            alt={`Página ${activeThumb.pageNum}`}
                            className="max-h-[260px] w-auto object-contain rounded-lg border border-zinc-700 shadow-xl bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setZoomModalImage(activeThumb.dataUrl)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                            title={isEs ? 'Ver en tamaño completo' : 'Full preview'}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })()
                  ) : pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-full rounded border border-zinc-800 min-h-[260px]"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs text-center p-4">
                      <FileText className="w-8 h-8 text-zinc-600" />
                      <span>{isEs ? 'Sin miniaturas disponibles' : 'No thumbnails available'}</span>
                    </div>
                  )}
                </div>

                {/* Footer del Visor: Paginación y Miniaturas */}
                {previewTab === 'thumbnails' && thumbnails.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80 font-mono">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <button
                        type="button"
                        onClick={() => setPreviewPageNum((p) => Math.max(1, p - 1))}
                        disabled={previewPageNum <= 1}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-zinc-300 disabled:opacity-30 cursor-pointer text-[11px]"
                      >
                        ◀ {isEs ? 'Anterior' : 'Previous'}
                      </button>
                      <span className="text-[11px] font-bold text-white">
                        {previewPageNum} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewPageNum((p) => Math.min(totalPages, p + 1))}
                        disabled={previewPageNum >= totalPages}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-zinc-300 disabled:opacity-30 cursor-pointer text-[11px]"
                      >
                        {isEs ? 'Siguiente' : 'Next'} ▶
                      </button>
                    </div>

                    {/* Fila compacta de miniaturas */}
                    <div className="flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                      {thumbnails.map((thumb) => (
                        <div
                          key={thumb.pageNum}
                          onClick={() => setPreviewPageNum(thumb.pageNum)}
                          className={`flex-shrink-0 w-12 h-16 rounded border overflow-hidden cursor-pointer transition-all ${
                            previewPageNum === thumb.pageNum
                              ? 'border-white ring-2 ring-white/40 scale-105'
                              : 'border-zinc-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb.dataUrl}
                            alt={`Thumb ${thumb.pageNum}`}
                            className="w-full h-full object-cover bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LADO DERECHO: 3 CAJAS INDEPENDIENTES (AISLAMIENTO ESTRICTO) (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3 h-full">
                {slots.map((slot, sIdx) => {
                  const isLoaded = slot.file !== null;
                  const isActive = isLoaded && sIdx === activeSlotIndex;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isLoaded) {
                          setActiveSlotIndex(sIdx);
                        } else {
                          getSlotInputRef(sIdx).current?.click();
                        }
                      }}
                      className={`flex-1 rounded-2xl border-2 transition-all p-3.5 flex items-center justify-between cursor-pointer min-h-[95px] relative group shadow-sm ${
                        isActive
                          ? 'bg-zinc-800/80 border-white shadow-white/10'
                          : isLoaded
                            ? 'bg-[#121217] border-zinc-700/80 hover:border-zinc-500'
                            : 'bg-[#0e0e12] border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-[#121218]'
                      }`}
                    >
                      <input
                        ref={getSlotInputRef(sIdx)}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => handleSlotFileChange(sIdx, e)}
                      />

                      {isLoaded ? (
                        <div className="flex items-center justify-between w-full gap-3 font-mono">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2.5 rounded-xl border flex-shrink-0 ${
                                isActive
                                  ? 'bg-white/20 border-white text-white'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                              }`}
                            >
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                  {isEs ? `Caja ${sIdx + 1}` : `Box ${sIdx + 1}`}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-white/20 text-white rounded border border-white/40 font-bold">
                                    {isEs ? 'Visualizando' : 'Viewing'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px] font-sans">
                                {slot.file!.name}
                              </p>
                              <span className="text-[10px] text-zinc-400">
                                {formatFileSize(slot.file!.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSlot(sIdx, e)}
                              className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-500/30"
                              title={isEs ? 'Eliminar de esta caja' : 'Remove from this box'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full font-mono">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-zinc-300 group-hover:border-zinc-700 transition-colors">
                              <Plus className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors font-sans">
                                {isEs ? `+ Cargar PDF ${sIdx + 1}` : `+ Upload PDF ${sIdx + 1}`}
                              </p>
                              <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                                .pdf
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800/80">
                            {isEs ? 'Disponible' : 'Available'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PANEL DE CONTROL DEBAJO A ANCHO COMPLETO */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sans">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* CABECERA PANEL */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-sans">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                  002 / CONFIGURACIÓN DE REPARACIÓN
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                </h2>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-white shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              {/* BOTÓN DE DIAGNÓSTICO PREVIO */}
              <button
                onClick={runPreliminaryDiagnosis}
                disabled={isProcessing}
                className="w-full mb-3 flex items-center justify-center gap-2 bg-[#121217] hover:bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-all cursor-pointer disabled:opacity-40 font-mono shadow-sm"
              >
                <FileWarning className="w-3.5 h-3.5 text-zinc-400" />
                {isEs ? 'EJECUTAR DIAGNÓSTICO PREVIO' : 'RUN PRELIMINARY DIAGNOSIS'}
              </button>

              {/* RESUMEN DEL DIAGNÓSTICO (INMEDIATO EN PANEL) */}
              {diagnostic && (
                <div className="p-3.5 rounded-2xl border border-zinc-700/80 bg-[#121217] mb-4 font-mono text-xs text-zinc-300 flex flex-col gap-1.5 animate-fadeIn shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{diagnostic.summary}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('diagnostic')}
                      className="text-[10px] text-zinc-300 hover:text-white underline cursor-pointer"
                    >
                      {isEs ? 'Ver en visor ↑' : 'View in viewport ↑'}
                    </button>
                  </div>
                  <p className="text-[10px] opacity-80 text-zinc-400">
                    {diagnostic.issues.length}{' '}
                    {isEs
                      ? 'componentes analizados. Resultados detallados en el panel superior.'
                      : 'scans run. Details displayed in top preview panel.'}
                  </p>
                </div>
              )}

              {/* MODOS DE REPARACIÓN */}
              <div className="mb-4">
                <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                  {isEs ? 'Modo de Reparación' : 'Repair Mode'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setRepairMode('smart')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${repairMode === 'smart' ? 'border-white bg-zinc-800 text-white shadow-md' : 'border-zinc-700/80 bg-[#121217] text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                  >
                    <div className="flex items-center justify-between mb-1 font-bold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-white" />
                        Smart Repair
                      </span>
                      <div
                        className={`w-3 h-3 rounded-full border flex items-center justify-center ${repairMode === 'smart' ? 'border-white bg-white' : 'border-zinc-600'}`}
                      >
                        {repairMode === 'smart' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {isEs ? 'XRef + metadatos (Estructural)' : 'XRef + metadata (Structural)'}
                    </p>
                  </div>
                  <div
                    onClick={() => setRepairMode('deep')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${repairMode === 'deep' ? 'border-white bg-zinc-800 text-white shadow-md' : 'border-zinc-700/80 bg-[#121217] text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                  >
                    <div className="flex items-center justify-between mb-1 font-bold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-white" />
                        Deep Rebuild
                      </span>
                      <div
                        className={`w-3 h-3 rounded-full border flex items-center justify-center ${repairMode === 'deep' ? 'border-white bg-white' : 'border-zinc-600'}`}
                      >
                        {repairMode === 'deep' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {isEs ? 'Render visual avanzado (Visual)' : 'Advanced visual render (Visual)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* REPORTE DE RECUPERACIÓN (SI EXISTE) */}
              <AnimatePresence>
                {recoveryReport && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-4 mb-4 overflow-hidden shadow-2xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                        {isEs ? 'Reporte de Recuperación' : 'Recovery Report'}
                      </h3>
                      <span className="text-[10px] text-zinc-500 ml-auto font-mono">
                        {recoveryReport.repairTimeMs}ms
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-2.5 text-center">
                        <span className="text-[9px] text-zinc-500 font-mono block">
                          {isEs ? 'Método' : 'Method'}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {recoveryReport.repairMethod === 'smart'
                            ? 'Smart Repair'
                            : recoveryReport.repairMethod === 'deep'
                              ? 'Deep Rescue'
                              : 'Parcial'}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-2.5 text-center">
                        <span className="text-[9px] text-zinc-500 font-mono block">
                          {isEs ? 'Págs. Recuperadas' : 'Pages Recovered'}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {recoveryReport.pagesRecovered}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-2.5 text-center">
                        <span className="text-[9px] text-zinc-500 font-mono block">
                          {isEs ? 'Vectores' : 'Vectors'}
                        </span>
                        <span
                          className={`text-xs font-bold ${recoveryReport.vectorPreserved ? 'text-emerald-400' : 'text-amber-400'}`}
                        >
                          {recoveryReport.vectorPreserved ? '✓ Preservados' : '✗ Rasterizados'}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-2.5 text-center">
                        <span className="text-[9px] text-zinc-500 font-mono block">
                          {isEs ? 'Fuentes' : 'Fonts'}
                        </span>
                        <span
                          className={`text-xs font-bold ${recoveryReport.fontsPreserved ? 'text-emerald-400' : 'text-amber-400'}`}
                        >
                          {recoveryReport.fontsPreserved ? '✓ Preservadas' : '✗ Perdidas'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <label className="text-[10px] font-bold text-zinc-400 mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
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
                        {opt === 'texto' ? '📄 Texto' : opt === 'imagenes' ? '🖼️ Imgs' : '⚡ Todo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ALCANCE */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                    <FileCheck2 className="w-3 h-3 text-zinc-400" />
                    {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
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
                  <label className="text-[10px] font-bold text-zinc-400 mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                    <Archive className="w-3 h-3 text-zinc-400" />
                    {isEs ? 'Compresión de Salida' : 'Output Compression'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${compressionLevel === lvl ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACCIÓN EN PÁGINAS DAÑADAS */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
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
                        {isEs ? 'Desbloquea permisos del documento' : 'Unlock document permissions'}
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
                        ? `Salida: ${activeFile?.name?.replace(/\.[^/.]+$/, '') ?? 'archivo'}${customSuffix}.pdf`
                        : `Output: ${activeFile?.name?.replace(/\.[^/.]+$/, '') ?? 'file'}${customSuffix}.pdf`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN DE ACCIÓN PRINCIPAL */}
            <div>
              {/* BARRA DE PROGRESO (cuando está procesando) */}
              {isProcessing && (
                <div className="mb-4 bg-zinc-950 border border-white/10 rounded-xl p-4 font-mono">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="text-[11px] font-bold text-white">
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
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">{progressMsg}</p>
                </div>
              )}

              <button
                onClick={executeRepair}
                disabled={isProcessing || activeFiles.length === 0}
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
                    <span>
                      {activeFiles.length > 1
                        ? isEs
                          ? `Reparar ${activeFiles.length} Archivos PDF`
                          : `Repair ${activeFiles.length} PDF Files`
                        : isEs
                          ? 'Reparar PDF'
                          : 'Repair PDF'}
                    </span>
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
      )}

      {/* MODAL DE ZOOM DE PÁGINA */}
      <AnimatePresence>
        {zoomModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setZoomModalImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-[#121217] border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {isEs ? `Página ${previewPageNum}` : `Page ${previewPageNum}`}
                </span>
                <button
                  onClick={() => setZoomModalImage(null)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-auto flex items-center justify-center bg-black/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomModalImage}
                  alt="Zoom preview"
                  className="max-h-[75vh] w-auto object-contain rounded border border-zinc-800 bg-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
