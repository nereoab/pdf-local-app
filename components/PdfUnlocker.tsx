'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Unlock,
  Loader2,
  X,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  Zap,
  Database,
  Package,
  Search,
  Trash2,
  Plus,
  Maximize2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import FoliarSuccessView from './FoliarSuccessView';
import type { BatchDownloadItem } from './DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';

import type {
  EncryptionDetection,
  UnlockProgress,
  UnlockResult,
  BatchReport,
  UnlockError,
} from '../workers/pdf-unlock.worker';

export default function PdfUnlocker() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  // === SISTEMA DE SLOTS FLEXIBLES CON MODO LOTE ===
  interface SlotItem {
    id: string;
    file: File | null;
  }

  const [slots, setSlots] = useState<SlotItem[]>([
    { id: 'slot-1', file: globalFile || null },
    { id: 'slot-2', file: null },
    { id: 'slot-3', file: null },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const slot3InputRef = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (index: number) => {
    if (index === 0) return slot1InputRef;
    if (index === 1) return slot2InputRef;
    return slot3InputRef;
  };

  const files = slots.map((s) => s.file).filter(Boolean) as File[];
  const activeFile = slots[activeSlotIndex]?.file || files[0] || null;

  // === CONTRASEÑA (SEGURA: procesada 100% en memoria RAM del worker) ===
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // === ESTADO DE PROCESAMIENTO ===
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [recoveryKeysPerSec, setRecoveryKeysPerSec] = useState<number>(0);
  const [recoveryTestedKeys, setRecoveryTestedKeys] = useState<number>(0);

  // === RESULTADOS Y DESCARGA ===
  const [, setResults] = useState<UnlockResult[]>([]);
  const [batchZipBlob, setBatchZipBlob] = useState<Blob | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize: string;
    rawBlob?: Blob;
    originalSize: number;
    unlockedSize: number;
    pageCount: number;
    checksumSha256: string;
    encryptionType: string;
    batchItems?: BatchDownloadItem[];
  } | null>(null);

  // === DETECCIÓN DINÁMICA POR ARCHIVO ===
  const [detectionMap, setDetectionMap] = useState<Record<number, EncryptionDetection>>({});

  // === PREVISUALIZACIÓN / MINIATURAS ===
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  // === OPCIONES AVANZADAS ===
  const [stripMetadata, setStripMetadata] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Desbloqueado');

  // Control panel height ref
  const controlPanelRef = useRef<HTMLDivElement>(null);

  // === EFECTOS DE UI ===
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  useEffect(() => {
    return () => {
      setHeaderHidden(false);
      workerRef.current?.terminate();
    };
  }, [setHeaderHidden]);

  useEffect(() => {
    if (globalFile && !slots.some((s) => s.file !== null)) {
      queueMicrotask(() => {
        setSlots([
          { id: 'slot-1', file: globalFile },
          { id: 'slot-2', file: null },
          { id: 'slot-3', file: null },
        ]);
        setActiveSlotIndex(0);
      });
    }
  }, [globalFile, slots]);

  const detectFileStatus = useCallback(
    async (f: File, idx: number) => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const buffer = await f.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
        const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));
        const hasEncrypt = text.includes('/Encrypt');

        let algorithm = 'Sin Cifrado';
        let pValue: number | undefined;
        const pMatch = text.match(/\/P\s+(-?\d+)/);
        if (pMatch) pValue = parseInt(pMatch[1], 10);

        if (text.includes('/R 6') || text.includes('/R 5')) {
          algorithm = 'AES-256 (ISO 32000-2 / R=6)';
        } else if (text.includes('/AESV3')) {
          algorithm = 'AES-256 (ISO 32000-1 Extension 3)';
        } else if (text.includes('/AESV2') || text.includes('/R 4')) {
          algorithm = 'AES-128 (Crypt Filter / R=4)';
        } else if (text.includes('/R 3')) {
          algorithm = 'RC4 128-bit (Standard R=3)';
        } else if (text.includes('/R 2')) {
          algorithm = 'RC4 40-bit (Standard R=2)';
        }

        const permissions =
          pValue !== undefined
            ? {
                printing: (pValue & 4) !== 0,
                modifying: (pValue & 8) !== 0,
                copying: (pValue & 16) !== 0,
                annotating: (pValue & 32) !== 0,
                fillingForms: (pValue & 256) !== 0,
                extraction: (pValue & 512) !== 0,
                assembly: (pValue & 1024) !== 0,
                highQualityPrint: (pValue & 2048) !== 0,
              }
            : {
                printing: false,
                highQualityPrint: false,
                copying: false,
                modifying: false,
                annotating: false,
                fillingForms: false,
                extraction: false,
                assembly: false,
              };

        try {
          await pdfjsLib.getDocument({ data: buffer.slice(0), password: '', stopAtErrors: false })
            .promise;

          if (hasEncrypt) {
            setDetectionMap((prev) => ({
              ...prev,
              [idx]: {
                type: 'owner-only',
                needsPassword: false,
                hasDigitalSignature: text.includes('/Sig'),
                pdfVersion: text.match(/%PDF-(\d+\.\d+)/)?.[1] || '1.7',
                encryptionAlgorithm: algorithm,
                permissions,
                warnings: [],
                message: isEs
                  ? 'Solo restricciones de permisos (Owner Password)'
                  : 'Permissions restrictions only (Owner Password)',
                details: isEs
                  ? 'El archivo abre libremente pero tiene bloqueada la copia/impresión/edición. ¡Listo para desbloqueo instantáneo con 1 clic!'
                  : 'Opens freely but copy/print/edit is locked. Ready for instant 1-click unlock!',
              },
            }));
          } else {
            setDetectionMap((prev) => ({
              ...prev,
              [idx]: {
                type: 'none',
                needsPassword: false,
                hasDigitalSignature: text.includes('/Sig'),
                pdfVersion: text.match(/%PDF-(\d+\.\d+)/)?.[1] || '1.7',
                encryptionAlgorithm: 'Sin Cifrado',
                permissions: {
                  printing: true,
                  highQualityPrint: true,
                  copying: true,
                  modifying: true,
                  annotating: true,
                  fillingForms: true,
                  extraction: true,
                  assembly: true,
                },
                warnings: [],
                message: isEs ? 'Sin protección detectada' : 'No protection detected',
                details: isEs
                  ? 'Documento sin restricciones ni cifrado activo.'
                  : 'Document without restrictions or active encryption.',
              },
            }));
          }
        } catch (err: unknown) {
          const isPasswordError =
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name: string }).name === 'PasswordException';

          if (isPasswordError) {
            setDetectionMap((prev) => ({
              ...prev,
              [idx]: {
                type: 'encrypted',
                needsPassword: true,
                hasDigitalSignature: text.includes('/Sig'),
                pdfVersion: text.match(/%PDF-(\d+\.\d+)/)?.[1] || '1.7',
                encryptionAlgorithm: algorithm,
                permissions,
                warnings: [],
                message: isEs
                  ? 'Protegido con Contraseña de Apertura'
                  : 'Protected with Opening Password',
                details: isEs
                  ? 'Requiere contraseña de lectura para desencriptar los flujos de datos.'
                  : 'Requires opening password to decrypt data streams.',
              },
            }));
          } else {
            setDetectionMap((prev) => ({
              ...prev,
              [idx]: {
                type: 'owner-only',
                needsPassword: false,
                hasDigitalSignature: text.includes('/Sig'),
                pdfVersion: text.match(/%PDF-(\d+\.\d+)/)?.[1] || '1.7',
                encryptionAlgorithm: algorithm,
                permissions,
                warnings: [],
                message: isEs ? 'Cifrado de restricciones' : 'Permissions encryption',
                details: isEs
                  ? 'Se intentará desbloqueo estructural inmediato en Web Worker.'
                  : 'Will attempt immediate structural unlock in Web Worker.',
              },
            }));
          }
        }
      } catch {
        setDetectionMap((prev) => ({
          ...prev,
          [idx]: {
            type: 'none',
            needsPassword: false,
            hasDigitalSignature: false,
            pdfVersion: '1.7',
            encryptionAlgorithm: 'Estándar',
            permissions: {
              printing: true,
              highQualityPrint: true,
              copying: true,
              modifying: true,
              annotating: true,
              fillingForms: true,
              extraction: true,
              assembly: true,
            },
            warnings: [],
            message: isEs ? 'Análisis completado' : 'Analysis complete',
            details: '',
          },
        }));
      }
    },
    [isEs],
  );

  // === GENERACIÓN DE MINIATURAS ===
  const loadFileThumbnails = useCallback(async (pdfFile: File, pwd: string) => {
    setIsLoadingThumbnails(true);
    setThumbnails([]);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        password: pwd,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const total = pdfDoc.numPages;
      setTotalPages(total);

      const generated: { pageNum: number; dataUrl: string }[] = [];
      const maxThumbnails = Math.min(total, 60);

      for (let pn = 1; pn <= maxThumbnails; pn++) {
        const page = await pdfDoc.getPage(pn);
        const viewport = page.getViewport({ scale: 0.45 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
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

  // === DETECCIÓN AUTOMÁTICA Y GENERACIÓN DE MINIATURAS ===
  useEffect(() => {
    if (activeFile) {
      queueMicrotask(() => {
        setPreviewPageNum(1);
        loadFileThumbnails(activeFile, password);
        detectFileStatus(activeFile, activeSlotIndex);
      });
    } else {
      queueMicrotask(() => {
        setThumbnails([]);
        setTotalPages(1);
      });
    }
  }, [activeFile, password, activeSlotIndex, loadFileThumbnails, detectFileStatus]);

  // === GESTIÓN DE ARCHIVOS Y SLOTS ===
  const loadSingleFileIntoSlot = (slotIdx: number, newFile: File) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], file: newFile };
      return next;
    });
    setActiveSlotIndex(slotIdx);
  };

  const handleSlotFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    const selected = uploadedFiles[0];
    e.target.value = '';
    loadSingleFileIntoSlot(index, selected);
  };

  const handleRemoveSlot = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], file: null };
      return next;
    });
    setDetectionMap((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    const remaining = slots
      .map((s, idx) => ({ s, idx }))
      .filter((item) => item.idx !== index && item.s.file !== null);
    if (remaining.length > 0) {
      setActiveSlotIndex(remaining[0].idx);
    } else {
      setActiveSlotIndex(0);
      setGlobalFile(null);
    }
  };

  const handleRemoveAllFiles = () => {
    setSlots([
      { id: 'slot-1', file: null },
      { id: 'slot-2', file: null },
      { id: 'slot-3', file: null },
    ]);
    setActiveSlotIndex(0);
    setCompletedResult(null);
    setResults([]);
    setDetectionMap({});
    setGlobalFile(null);
    setBatchZipBlob(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type === 'application/pdf');
      if (newFiles.length === 0) {
        toast.error(isEs ? 'Selecciona archivos PDF válidos' : 'Select valid PDF files');
        e.target.value = '';
        return;
      }
      setSlots((prev) => {
        const next = [...prev];
        let addedIdx = 0;
        for (let i = 0; i < next.length && addedIdx < newFiles.length; i++) {
          if (!next[i].file) {
            next[i] = { ...next[i], file: newFiles[addedIdx++] };
          }
        }
        // Si hay más de 3 archivos, expandir los slots dinámicamente
        while (addedIdx < newFiles.length) {
          next.push({ id: `slot-${next.length + 1}`, file: newFiles[addedIdx++] });
        }
        return next;
      });
      setResults([]);
      setCompletedResult(null);
      toast.success(
        isEs ? `${newFiles.length} PDF(s) añadido(s)` : `${newFiles.length} PDF(s) added`,
      );
    }
    e.target.value = '';
  };

  // === EJECUCIÓN DEL MOTOR DE DESBLOQUEO EN WEB WORKER (CERO LAG EN HILO PRINCIPAL) ===
  const startWorkerExecution = async (isRecovery = false) => {
    if (files.length === 0) return;

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setIsProcessing(true);
    setProgressPercent(2);
    setProgressMsg(
      isEs ? 'Iniciando Web Worker criptográfico...' : 'Initializing cryptographic Web Worker...',
    );
    setResults([]);
    setBatchZipBlob(null);
    setTotalFilesCount(files.length);
    setCurrentFileIndex(1);
    setRecoveryKeysPerSec(0);
    setRecoveryTestedKeys(0);

    try {
      const fileBuffers: ArrayBuffer[] = [];
      const fileNames: string[] = [];
      for (const f of files) {
        fileBuffers.push(await f.arrayBuffer());
        fileNames.push(f.name);
      }

      const worker = new Worker(new URL('../workers/pdf-unlock.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      const collectedResults: UnlockResult[] = [];

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;

        if (msg.type === 'progress') {
          const p = msg as UnlockProgress;
          setProgressPercent(p.percent);
          setProgressMsg(p.message);
          if (p.currentFile) setCurrentFileIndex(p.currentFile);
          if (p.totalFiles) setTotalFilesCount(p.totalFiles);
          if (p.keysPerSec !== undefined) setRecoveryKeysPerSec(p.keysPerSec);
          if (p.testedKeys !== undefined) setRecoveryTestedKeys(p.testedKeys);
        } else if (msg.type === 'result') {
          const r = msg as UnlockResult;
          const blob = new Blob([r.unlockedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          (r as any).downloadUrl = url;
          collectedResults.push(r);
          setResults([...collectedResults]);
        } else if (msg.type === 'batch-complete') {
          const b = msg as BatchReport;
          setIsProcessing(false);
          worker.terminate();
          workerRef.current = null;

          if (b.zipBytes) {
            const zipBlob = new Blob([b.zipBytes], { type: 'application/zip' });
            setBatchZipBlob(zipBlob);
          }

          if (collectedResults.length > 0) {
            const first = collectedResults[0];
            const suffix = customSuffix || '_Desbloqueado';
            const firstBlob = new Blob([first.unlockedBytes], { type: 'application/pdf' });
            const firstUrl = (first as any).downloadUrl || URL.createObjectURL(firstBlob);

            const batchItems: BatchDownloadItem[] = collectedResults.map((item) => {
              const itemBlob = new Blob([item.unlockedBytes], { type: 'application/pdf' });
              return {
                fileName: `${item.fileName.replace(/\.[^/.]+$/, '')}${suffix}.pdf`,
                originalSize: item.originalSize,
                compressedSize: item.unlockedSize,
                downloadUrl: (item as any).downloadUrl || URL.createObjectURL(itemBlob),
                rawBlob: itemBlob,
              };
            });

            setCompletedResult({
              downloadUrl: firstUrl,
              filename: `${first.fileName.replace(/\.[^/.]+$/, '')}${suffix}.pdf`,
              fileSize: formatFileSize(first.unlockedSize),
              rawBlob: firstBlob,
              originalSize: first.originalSize,
              unlockedSize: first.unlockedSize,
              pageCount: first.pageCount,
              checksumSha256: first.checksumSha256,
              encryptionType: first.encryptionType || 'AES-256 / Protegido',
              batchItems: collectedResults.length > 1 ? batchItems : undefined,
            });

            toast.success(
              isEs
                ? `¡${collectedResults.length} documento(s) desbloqueado(s) con éxito!`
                : `Successfully unlocked ${collectedResults.length} document(s)!`,
            );
          }
        } else if (msg.type === 'error') {
          toast.error((msg as UnlockError).message);
        }
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        toast.error(isEs ? 'Error en el motor de desbloqueo' : 'Error in unlock engine');
        setIsProcessing(false);
        worker.terminate();
        workerRef.current = null;
      };

      // Enviar buffers y opciones al Web Worker
      worker.postMessage({
        fileBuffers,
        fileNames,
        options: {
          password: isRecovery ? '' : password,
          passwordRecovery: isRecovery,
          stripMetadata,
          customSuffix,
          batchMode: files.length > 1,
          createZip: files.length > 1,
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al iniciar el desbloqueo' : 'Error starting unlock');
      setIsProcessing(false);
    }
  };

  const executeUnlock = () => startWorkerExecution(false);
  const executeRecoveryUnlock = () => startWorkerExecution(true);

  // === UTILIDADES ===
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeDetection = detectionMap[activeSlotIndex] || null;
  const isOwnerOnly = activeDetection?.type === 'owner-only';
  const isEncryptedWithOpenPassword = activeDetection?.type === 'encrypted';
  const hasAnyEncrypted = Object.values(detectionMap).some((d) => d.type === 'encrypted');

  const executeUnlockRef = useRef(executeUnlock);
  const executeRecoveryUnlockRef = useRef(executeRecoveryUnlock);
  useEffect(() => {
    executeUnlockRef.current = executeUnlock;
    executeRecoveryUnlockRef.current = executeRecoveryUnlock;
  });

  // Atajos de teclado (Ctrl+Enter = Desbloquear, Ctrl+R = Recuperar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing && files.length > 0 && !completedResult) executeUnlockRef.current();
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (!isProcessing && files.length > 0 && !completedResult)
          executeRecoveryUnlockRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, files.length, completedResult]);

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

      {/* HEADER SUPERIOR UNIFICADO DE HERRAMIENTA PRINCIPAL */}
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
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                {isEs
                  ? '004 / DESBLOQUEO Y LIBERACIÓN DE ARCHIVOS PDF'
                  : '004 / PDF UNLOCKING & RESTRICTION REMOVAL'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Unlock className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'DESBLOQUEAR PDF Y QUITAR RESTRICCIONES'
                  : 'UNLOCK PDF AND REMOVE RESTRICTIONS'}
              </span>
            </h1>
          </div>
        </div>

        {completedResult && (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-xs font-mono text-white">
            <Unlock className="w-4 h-4 text-zinc-300" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {completedResult.filename}
            </span>
            <button
              onClick={() => {
                setCompletedResult(null);
                setResults([]);
                handleRemoveAllFiles();
              }}
              className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {files.length > 0 && !completedResult && (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white font-mono flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-zinc-300" />
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
        /* DROPZONE INICIAL VACÍA */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[520px]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <Unlock className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor Criptográfico Vectorial v5.0 • 100% Local'
                : 'Vector Crypto Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'DESBLOQUEA Y LIBERA CUALQUIER ARCHIVO PDF'
              : 'UNLOCK AND LIBERATE ANY PDF DOCUMENT'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Elimina al instante restricciones de impresión, copia de texto y edición sin perder calidad vectorial ni fuentes. Descifra contraseñas AES-256 localmente sin subir tus archivos a internet.'
              : 'Instantly remove print, copy, and edit restrictions without losing vector quality. Decrypt AES-256 passwords locally without cloud uploads.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar Archivos PDF Protegidos' : 'Select Protected PDF Files'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ 1-Clic Sin Clave' : '✓ 1-Click No Password'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Para el 85% de PDFs con solo restricciones de copia o impresión.'
                  : 'For 85% of PDFs with owner copy or print restrictions.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Texto 100% Seleccionable' : '✓ 100% Selectable Text'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Preserva Ctrl+F, selección de texto y fuentes originales.'
                  : 'Preserves Ctrl+F search, text selection, and native fonts.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Estricta' : '✓ Strict Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Procesado con Web Crypto API en la RAM de tu navegador.'
                  : 'Processed with Web Crypto API in local browser RAM.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO ULTRA-PREMIUM CON COMPARTIR EN WHATSAPP / TELEGRAM / DRIVE */
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: completedResult.downloadUrl,
              filename: completedResult.filename,
              fileSize: completedResult.fileSize,
              rawBlob: completedResult.rawBlob,
            }}
            totalPages={completedResult.pageCount || 1}
            modeText={
              isEs
                ? 'Motor Criptográfico Vectorial de Desbloqueo'
                : 'Vector Cryptographic Unlocking Engine'
            }
            toolName={isEs ? 'Desbloquear PDF' : 'Unlock PDF'}
            badgeText={isEs ? 'Desbloqueo Completado' : 'Unlock Completed'}
            successTitle={
              completedResult.batchItems && completedResult.batchItems.length > 1
                ? isEs
                  ? `¡${completedResult.batchItems.length} Documentos Desbloqueados con Éxito!`
                  : `¡${completedResult.batchItems.length} Documents Unlocked Successfully!`
                : isEs
                  ? '¡Documento Desbloqueado con Éxito!'
                  : 'Document Unlocked Successfully!'
            }
            downloadButtonText={
              completedResult.batchItems && completedResult.batchItems.length > 1
                ? isEs
                  ? `Descargar Primer Archivo (${completedResult.filename})`
                  : `Download First File (${completedResult.filename})`
                : isEs
                  ? 'Descargar PDF Desbloqueado'
                  : 'Download Unlocked PDF'
            }
            shareSubject={isEs ? 'documento desbloqueado' : 'unlocked document'}
            fallbackUrl="https://pdf-black.com/optimizar/desbloquear"
            metricBadge={
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-bold font-mono text-xs">
                  {completedResult.encryptionType ||
                    (isEs ? 'Sin Restricciones' : 'No Restrictions')}
                </span>
                <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-md font-bold font-mono text-xs">
                  {completedResult.pageCount} {isEs ? 'páginas' : 'pages'}
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md font-mono text-xs">
                  {formatFileSize(completedResult.unlockedSize)}
                </span>
              </div>
            }
            extraActions={
              completedResult.batchItems && completedResult.batchItems.length > 1 ? (
                <div className="space-y-3">
                  {batchZipBlob && (
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        const url = URL.createObjectURL(batchZipBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `PDFs_Desbloqueados_${Date.now()}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-sans font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg transition-all cursor-pointer border border-emerald-400/40"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>
                        {isEs
                          ? `Descargar los ${completedResult.batchItems.length} archivos desbloqueados (.ZIP)`
                          : `Download all ${completedResult.batchItems.length} unlocked files (.ZIP)`}
                      </span>
                    </motion.button>
                  )}

                  <div className="bg-[#121217] border border-zinc-800 rounded-xl p-3 space-y-2">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-bold px-1">
                      {isEs ? 'Archivos individuales disponibles:' : 'Individual files available:'}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {completedResult.batchItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="truncate text-zinc-200 font-medium">
                              {item.fileName}
                            </span>
                          </div>
                          <a
                            href={item.downloadUrl}
                            download={item.fileName}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded border border-zinc-700 text-[11px] font-bold transition-colors flex items-center gap-1.5 flex-shrink-0"
                          >
                            <Download className="w-3 h-3" />
                            <span>{isEs ? 'Descargar' : 'Download'}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : undefined
            }
            onReset={() => {
              setCompletedResult(null);
              setResults([]);
              handleRemoveAllFiles();
            }}
          />
        </div>
      ) : (
        /* ÁREA DE TRABAJO PRINCIPAL: VISOR + SLOTS + PANEL DE CONTROL */
        <div className="flex flex-col gap-6 mb-6 font-sans">
          {/* SECCIÓN 1: VISOR INTERACTIVO Y CAJAS DE ARCHIVOS */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                  001 / VISOR INTERACTIVO Y ARCHIVOS CARGADOS
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'DOCUMENTOS SELECCIONADOS' : 'SELECTED DOCUMENTS'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm font-mono">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>{isEs ? `Archivos (${files.length})` : `Files (${files.length})`}</span>
                </span>
              </div>
            </div>

            {/* Grid 2 Columnas: Visor (50%) + Cajas de Archivos (50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* VISOR (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#0c0c0f] border border-zinc-800/80 rounded-2xl p-4 min-h-[380px]">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs text-zinc-400">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="text-white font-bold truncate max-w-[180px]">
                      {activeFile?.name || (isEs ? 'Sin documento' : 'No document')}
                    </span>
                  </div>
                  {activeFile && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      {formatFileSize(activeFile.size)}
                    </span>
                  )}
                </div>

                {/* Contenido Central del Visor */}
                <div className="flex-1 flex flex-col items-center justify-center my-3 relative min-h-[240px]">
                  {isLoadingThumbnails ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span>{isEs ? 'Analizando estructura...' : 'Analyzing structure...'}</span>
                    </div>
                  ) : thumbnails.length > 0 ? (
                    (() => {
                      const activeThumb =
                        thumbnails.find((t) => t.pageNum === previewPageNum) || thumbnails[0];
                      return (
                        <div className="relative group max-h-[300px] max-w-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeThumb.dataUrl}
                            alt={`Página ${activeThumb.pageNum}`}
                            className="max-h-[290px] w-auto object-contain rounded-lg border border-zinc-700 shadow-xl bg-white"
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
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs text-center p-4">
                      <Lock className="w-8 h-8 text-amber-400" />
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase">
                        {isEs ? 'DOCUMENTO BLOQUEADO' : 'LOCKED DOCUMENT'}
                      </span>
                      <p className="text-zinc-400 text-[11px] max-w-xs">
                        {isEs
                          ? isOwnerOnly
                            ? 'Este archivo solo tiene restricciones de edición/impresión. ¡Listo para desbloquear sin clave!'
                            : 'Ingresa la contraseña en el Panel de Control inferior para descifrar.'
                          : 'Enter password in the Control Panel below to decrypt.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Paginación */}
                {thumbnails.length > 0 && (
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

              {/* LISTA DE ARCHIVOS / CAJAS (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-start gap-3 h-full overflow-y-auto max-h-[480px] custom-scrollbar pr-1">
                {slots.map((slot, sIdx) => {
                  const isLoaded = slot.file !== null;
                  const isActive = isLoaded && sIdx === activeSlotIndex;
                  const detection = detectionMap[sIdx];

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
                      className={`rounded-2xl border-2 transition-all p-3.5 flex items-center justify-between cursor-pointer min-h-[95px] relative group shadow-sm ${
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                  {isEs ? `Archivo ${sIdx + 1}` : `File ${sIdx + 1}`}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-white/20 text-white rounded border border-white/40 font-bold">
                                    {isEs ? 'Activo' : 'Active'}
                                  </span>
                                )}
                                {detection && (
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                      detection.type === 'encrypted'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : detection.type === 'owner-only'
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                    }`}
                                  >
                                    {detection.type === 'encrypted' ? (
                                      <>
                                        <Lock className="w-2.5 h-2.5" />
                                        {isEs ? 'Requiere Clave' : 'Needs Password'}
                                      </>
                                    ) : detection.type === 'owner-only' ? (
                                      <>
                                        <Zap className="w-2.5 h-2.5" />
                                        {isEs ? '1-Clic Listo' : '1-Click Ready'}
                                      </>
                                    ) : isEs ? (
                                      'Sin Candado'
                                    ) : (
                                      'Unlocked'
                                    )}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[240px] font-sans mt-0.5">
                                {slot.file!.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                <span>{formatFileSize(slot.file!.size)}</span>
                                {detection?.encryptionAlgorithm && (
                                  <span className="text-zinc-500">
                                    • {detection.encryptionAlgorithm}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSlot(sIdx, e)}
                              className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title={isEs ? 'Eliminar de la lista' : 'Remove from list'}
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
                                {isEs
                                  ? `+ Añadir otro PDF (${sIdx + 1})`
                                  : `+ Add another PDF (${sIdx + 1})`}
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

          {/* SECCIÓN 2: PANEL DE CONTROL Y CONFIGURACIÓN CRIPTOGRÁFICA */}
          <div
            ref={controlPanelRef}
            className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sans"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-sans">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                  002 / PARÁMETROS CRIPTOGRÁFICOS Y ACCIONES
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'PANEL DE CONTROL DE DESBLOQUEO' : 'UNLOCK CONTROL PANEL'}
                </h2>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-white shadow-sm">
                <Unlock className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* CALLOUT DE 1-CLIC SI EL ARCHIVO NO TIENE USER PASSWORD */}
            {isOwnerOnly && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-zinc-200 flex items-start gap-3.5 shadow-inner font-mono"
              >
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide mb-1 font-sans">
                    {isEs
                      ? '¡DESBLOQUEO INSTANTÁNEO EN 1-CLIC DISPONIBLE!'
                      : 'INSTANT 1-CLICK UNLOCK AVAILABLE!'}
                  </h4>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {isEs
                      ? 'Este documento solo tiene candados de permisos (impresión, copia o edición). NO requiere contraseña para abrirse. Al pulsar el botón inferior se eliminará toda restricción conservando el 100% de vectores, texto y fuentes sin pérdida.'
                      : 'This document only has permissions locks (printing, copying, or editing). NO open password required. Clicking below will remove all locks preserving 100% of vectors, text, and fonts losslessly.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* INSPECTOR DE SEGURIDAD DETALLADO */}
            {activeDetection && (
              <div className="p-4 rounded-2xl border border-zinc-700/80 bg-[#121217] text-zinc-300 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      {isEs ? 'INSPECCIÓN CRIPTOGRÁFICA' : 'CRYPTOGRAPHIC INSPECTION'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
                    {activeDetection.encryptionAlgorithm}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-tight text-zinc-200 mb-1">
                  {activeDetection.message}
                </p>
                <p className="text-[10px] opacity-70 font-mono text-zinc-400">
                  {activeDetection.details}
                </p>

                {/* MATRIZ DE PERMISOS ANTES VS DESPUÉS */}
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block mb-2">
                    {isEs
                      ? 'MATRIZ DE PERMISOS (ANTES ➔ DESPUÉS)'
                      : 'PERMISSIONS MATRIX (BEFORE ➔ AFTER)'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                    {[
                      {
                        label: isEs ? 'Impresión Alta Resolución' : 'High-Res Print',
                        before: activeDetection.permissions?.printing,
                      },
                      {
                        label: isEs ? 'Copiar Texto e Imágenes' : 'Copy Text/Images',
                        before: activeDetection.permissions?.copying,
                      },
                      {
                        label: isEs ? 'Modificar Documento' : 'Modify Document',
                        before: activeDetection.permissions?.modifying,
                      },
                      {
                        label: isEs ? 'Rellenar Formularios' : 'Fill Forms',
                        before: activeDetection.permissions?.fillingForms,
                      },
                    ].map((perm, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 flex flex-col gap-1"
                      >
                        <span className="text-zinc-400 truncate">{perm.label}</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={perm.before ? 'text-emerald-400' : 'text-red-400'}>
                            {perm.before ? '✓' : '✗'}
                          </span>
                          <span className="text-zinc-600">➔</span>
                          <span className="text-emerald-400 font-bold">
                            ✓ {isEs ? 'LIBRE' : 'FREE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ENTRADA DE CONTRASEÑA (SI REQUIERE CLAVE DE APERTURA) */}
            <AnimatePresence>
              {(isEncryptedWithOpenPassword || hasAnyEncrypted) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10"
                >
                  <label className="text-xs font-bold text-amber-300 block mb-2 font-mono flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    {isEs ? 'CONTRASEÑA DE APERTURA DEL DOCUMENTO:' : 'DOCUMENT OPENING PASSWORD:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={
                        isEs
                          ? 'Escribe la contraseña para desbloquear...'
                          : 'Type document password...'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isProcessing}
                      className="w-full p-3.5 pr-10 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl text-white text-xs outline-none focus:border-white transition-colors font-mono placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono mt-1.5 block">
                    {isEs
                      ? '🔒 Esta clave solo se procesa localmente en la memoria RAM del Web Worker.'
                      : '🔒 This password is only processed in Web Worker RAM.'}
                  </span>

                  <button
                    type="button"
                    onClick={executeRecoveryUnlock}
                    disabled={isProcessing}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 font-mono shadow-sm"
                  >
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>
                      {isEs
                        ? '¿OLVIDASTE LA CLAVE? PROBAR RECUPERACIÓN INTELIGENTE (PINS & PATRONES)'
                        : 'FORGOT PASSWORD? TRY SMART RECOVERY (PINS & PATTERNS)'}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OPCIONES DE SALIDA */}
            <div className="p-4 bg-zinc-950/60 border border-white/10 rounded-2xl font-mono text-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span className="font-bold text-white uppercase">
                    {isEs ? 'Ajustes de Guardado' : 'Save Settings'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setStripMetadata((v) => !v)}
                  className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition"
                >
                  <div>
                    <p className="text-[11px] font-bold text-white">
                      {isEs ? 'Eliminar metadatos ocultos' : 'Strip hidden metadata'}
                    </p>
                    <p className="text-[9px] text-zinc-500">
                      {isEs
                        ? 'Limpia creador, autor y fecha de origen'
                        : 'Clears creator, author & dates'}
                    </p>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative transition-all ${
                      stripMetadata ? 'bg-white' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${
                        stripMetadata ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    {isEs ? 'Sufijo para los archivos desbloqueados:' : 'Unlocked file suffix:'}
                  </label>
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={(e) => setCustomSuffix(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-white/40 transition"
                  />
                </div>
              </div>
            </div>

            {/* PROGRESO EN VIVO (CON VELOCÍMETRO DE RECUPERACIÓN) */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="font-mono bg-zinc-900/80 p-4 rounded-2xl border border-zinc-700"
                >
                  <div className="flex justify-between items-center text-xs text-zinc-300 mb-2">
                    <span className="truncate mr-2 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      {progressMsg}
                    </span>
                    <span className="font-bold tabular-nums text-white text-sm">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/10">
                    <motion.div
                      className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-white h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ ease: 'easeInOut', duration: 0.2 }}
                    />
                  </div>

                  {recoveryKeysPerSec > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2.5 pt-2 border-t border-zinc-800">
                      <span>
                        {isEs ? 'Claves probadas: ' : 'Tested keys: '}
                        <strong className="text-white">{recoveryTestedKeys}</strong>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        ⚡ {recoveryKeysPerSec} {isEs ? 'claves/segundo' : 'keys/second'}
                      </span>
                    </div>
                  )}

                  {totalFilesCount > 1 && (
                    <p className="text-[10px] text-zinc-400 mt-2 text-center">
                      {isEs
                        ? `Procesando archivo ${currentFileIndex} de ${totalFilesCount}`
                        : `Processing file ${currentFileIndex} of ${totalFilesCount}`}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div>
              <button
                onClick={executeUnlock}
                disabled={isProcessing || files.length === 0}
                className={`w-full font-bold py-4 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  isOwnerOnly
                    ? 'bg-gradient-to-r from-emerald-400 to-white text-black hover:opacity-90 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>
                      {isEs ? 'Desbloqueando documento(s)...' : 'Unlocking document(s)...'}
                    </span>
                  </>
                ) : isOwnerOnly ? (
                  <>
                    <Zap className="w-4 h-4 text-black" />
                    <span>
                      {isEs
                        ? files.length > 1
                          ? `DESBLOQUEAR ${files.length} ARCHIVOS (1-CLIC)`
                          : 'DESBLOQUEAR AHORA (1-CLIC SIN CONTRASEÑA)'
                        : files.length > 1
                          ? `UNLOCK ${files.length} FILES (1-CLICK)`
                          : 'UNLOCK NOW (1-CLICK NO PASSWORD)'}
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-black" />
                    <span>
                      {isEs
                        ? files.length > 1
                          ? `DESBLOQUEAR ${files.length} ARCHIVOS`
                          : 'DESBLOQUEAR PDF'
                        : files.length > 1
                          ? `UNLOCK ${files.length} FILES`
                          : 'UNLOCK PDF'}
                    </span>
                  </>
                )}
              </button>

              <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isEs
                    ? 'Motor Web Worker Activo • Sin Bloqueo de Interfaz'
                    : 'Web Worker Active • Non-blocking'}
                </span>
                <span className="flex items-center gap-1 text-white text-[11px]">
                  <Database className="w-3.5 h-3.5" />
                  {isEs ? '100% Seguro en RAM' : '100% RAM Secure'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE MINIATURA */}
      <AnimatePresence>
        {zoomModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
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
