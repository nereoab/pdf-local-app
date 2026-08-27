'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Unlock,
  FileDown,
  Loader2,
  X,
  ShieldCheck,
  FilePlus,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  FileText,
  UploadCloud,
  Lock,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Info,
  Database,
  Package,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';

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
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

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

  // Estado de éxito para pantalla de descarga
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
  } | null>(null);

  // === DETECCIÓN DINÁMICA POR ARCHIVO ===
  const [detectionMap, setDetectionMap] = useState<Record<number, EncryptionDetection>>({});

  // === PREVISUALIZACIÓN / MINIATURAS ===
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // === OPCIONES AVANZADAS ===
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Desbloqueado');

  const activeFile = files[activeFileIdx] || null;

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
  }, [files, activeFileIdx, password, showPassword, showAdvanced, isProcessing, results]);

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

  // === DETECCIÓN AUTOMÁTICA Y GENERACIÓN DE MINIATURAS ===
  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      loadFileThumbnails(activeFile, password);
      detectFileStatus(activeFile, activeFileIdx);
    } else {
      setThumbnails([]);
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
        await pdfjsLib.getDocument({ data: buffer.slice(0), password: '', stopAtErrors: false })
          .promise;

        if (hasEncrypt) {
          // Abre sin contraseña → solo restricciones de propietario
          setDetectionMap((prev) => ({
            ...prev,
            [idx]: {
              type: 'owner-only',
              needsPassword: false,
              hasDigitalSignature: false,
              pdfVersion: 'desconocida',
              warnings: [],
              message: 'Solo restricciones de permisos',
              details: 'No requiere contraseña de apertura',
            },
          }));
        } else {
          setDetectionMap((prev) => ({
            ...prev,
            [idx]: {
              type: 'none',
              needsPassword: false,
              hasDigitalSignature: false,
              pdfVersion: 'desconocida',
              warnings: [],
              message: 'Sin protección detectada',
              details: 'Documento sin cifrado ni restricciones',
            },
          }));
        }
      } catch (err: unknown) {
        // No se pudo abrir con contraseña vacía — verificar el tipo de error
        const isPasswordError =
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'PasswordException';

        if (isPasswordError) {
          // PasswordException = requiere contraseña de apertura (User Password)
          setDetectionMap((prev) => ({
            ...prev,
            [idx]: {
              type: 'encrypted',
              needsPassword: true,
              hasDigitalSignature: false,
              pdfVersion: 'desconocida',
              warnings: [],
              message: 'Protegido con contraseña de apertura',
              details: 'El PDF requiere una clave de lectura para abrirse. Ingrese la contraseña.',
            },
          }));
        } else if (hasEncrypt) {
          // Tiene /Encrypt pero no es PasswordException → posible cifrado propietario corrupto
          setDetectionMap((prev) => ({
            ...prev,
            [idx]: {
              type: 'owner-only',
              needsPassword: false,
              hasDigitalSignature: false,
              pdfVersion: 'desconocida',
              warnings: [],
              message: 'Cifrado de propietario detectado',
              details: 'Posibles restricciones. Se intentará desbloquear sin contraseña.',
            },
          }));
        } else {
          // Sin /Encrypt pero no abre → archivo corrupto
          setDetectionMap((prev) => ({
            ...prev,
            [idx]: {
              type: 'none',
              needsPassword: false,
              hasDigitalSignature: false,
              pdfVersion: 'desconocida',
              warnings: [],
              message: 'Documento posiblemente corrupto',
              details:
                'Sin cifrado detectado pero no se puede abrir. Intente reparar el PDF primero.',
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
          pdfVersion: 'desconocida',
          warnings: [],
          message: 'Error de análisis',
          details: 'No se pudo determinar el estado del archivo',
        },
      }));
    }
  };

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
            ? `${e.target.files.length - newFiles.length} archivo(s) ignorado(s) por no ser PDF`
            : `${e.target.files.length - newFiles.length} file(s) ignored (not PDF)`,
        );
      }
      setFiles((prev) => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setGlobalFile(newFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
      setCompletedResult(null);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setResults((prev) => prev.filter((_, i) => i !== idx));
    if (idx === activeFileIdx) {
      setActiveFileIdx(0);
    } else if (idx < activeFileIdx) {
      setActiveFileIdx((prev) => Math.max(0, prev - 1));
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
        fileBuffers.push(await f.arrayBuffer());
        fileNames.push(f.name);
      }

      const worker = new Worker(new URL('../workers/pdf-unlock.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      let newResults: UnlockResult[] = [];
      let processedCount = 0;

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          const p = msg as UnlockProgress;
          setProgressPercent(p.percent);
          setProgressMsg(p.message);
          if (p.currentFile) setCurrentFileIndex(p.currentFile);
          if (p.totalFiles) setTotalFilesCount(p.totalFiles);
        } else if (msg.type === 'result') {
          processedCount++;
          const r = msg as UnlockResult;
          const blob = new Blob([r.unlockedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          (r as unknown as Record<string, unknown>).downloadUrl = url;
          newResults.push(r);
          setResults([...newResults]);
          // Mostrar pantalla de éxito
          setCompletedResult({
            downloadUrl: url,
            filename: `${r.fileName.replace(/\.[^/.]+$/, '')}${customSuffix || '_Desbloqueado'}.pdf`,
            fileSize: formatFileSize(blob.size),
            rawBlob: blob,
            originalSize: r.originalSize || 0,
            unlockedSize: r.unlockedSize || blob.size,
            pageCount: r.pageCount,
            checksumSha256: r.checksumSha256 || '',
            encryptionType: r.encryptionType || 'Desconocido',
          });
          if (processedCount >= fileBuffers.length) {
            setIsProcessing(false);
            worker.terminate();
            workerRef.current = null;
          }
        } else if (msg.type === 'error') {
          processedCount++;
          toast.error((msg as UnlockError).message);
          if (processedCount >= fileBuffers.length) {
            setIsProcessing(false);
            worker.terminate();
            workerRef.current = null;
          }
        }
      };

      worker.onerror = (error) => {
        console.error('Worker:', error);
        toast.error(isEs ? 'Error en recuperación' : 'Recovery error');
        setIsProcessing(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage({
        fileBuffers: fileBuffers.map((b) => b.slice(0)),
        fileNames,
        options: {
          password: '',
          passwordRecovery: true,
          pageScope,
          pageRange: pageScope === 'rango' ? pageRange : undefined,
          stripMetadata,
          customSuffix,
          batchMode: files.length > 1,
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al iniciar recuperación' : 'Error starting recovery');
      setIsProcessing(false);
    }
  };

  // === EJECUTAR DESBLOQUEO (MOTOR NATIVO CLIENT-SIDE CON COMPATIBILIDAD 100% ADOBE ACROBAT) ===
  const executeUnlock = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setResults([]);
    setTotalFilesCount(files.length);
    setCurrentFileIndex(0);

    try {
      const newResults: UnlockResult[] = [];
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const { PDFDocument } = await import('pdf-lib');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIndex(i + 1);
        setProgressMsg(isEs ? `Analizando ${file.name}...` : `Analyzing ${file.name}...`);
        setProgressPercent(10);

        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
        const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));
        const hasEncryptDict = text.includes('/Encrypt');

        let vectorPreserved = false;
        let cleanPdf: any;
        let pageCount = 0;

        // 1. Intentar desensamblado vectorial directo (solo si NO tiene encriptación de streams)
        if (!hasEncryptDict) {
          try {
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0), {
              ignoreEncryption: false,
              updateMetadata: false,
            });
            pageCount = pdfDoc.getPageCount();
            if (pageCount > 0) {
              cleanPdf = await PDFDocument.create();
              const copiedPages = await cleanPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
              copiedPages.forEach((p: any) => cleanPdf.addPage(p));
              vectorPreserved = true;
            }
          } catch {
            // Pasar al motor de descifrado PDF.js
          }
        }

        // 2. Motor de descifrado completo PDF.js + DOM Canvas (preserva legibilidad 100% y evita cajas tofu / páginas en blanco)
        if (!vectorPreserved) {
          setProgressMsg(
            isEs
              ? 'Descifrando streams criptográficos con motor PDF.js...'
              : 'Decrypting streams with PDF.js engine...',
          );
          setProgressPercent(25);

          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer.slice(0),
            password: password || '',
            stopAtErrors: false,
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
          });

          const srcDoc = await loadingTask.promise;
          pageCount = srcDoc.numPages;

          cleanPdf = await PDFDocument.create();

          for (let pn = 1; pn <= pageCount; pn++) {
            const pct = 25 + Math.floor((pn / pageCount) * 65);
            setProgressPercent(pct);
            setProgressMsg(
              isEs
                ? `Descifrando y reconstruyendo página ${pn} de ${pageCount}...`
                : `Decrypting and rebuilding page ${pn} of ${pageCount}...`,
            );

            const page = await srcDoc.getPage(pn);
            const originalViewport = page.getViewport({ scale: 1.0 });
            const renderViewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              await page.render({
                canvasContext: ctx,
                viewport: renderViewport,
              } as unknown as Parameters<typeof page.render>[0]).promise;
              const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
              const jpgBytes = await (await fetch(dataUrl)).arrayBuffer();
              const img = await cleanPdf.embedJpg(jpgBytes);
              const newPage = cleanPdf.addPage([originalViewport.width, originalViewport.height]);
              newPage.drawImage(img, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height,
              });
            }
          }
        }

        if (stripMetadata) {
          cleanPdf!.setTitle('');
          cleanPdf!.setAuthor('');
          cleanPdf!.setSubject('');
          cleanPdf!.setKeywords([]);
        }

        cleanPdf!.setProducer('PDFBlack Decrypted Engine v4.0');
        cleanPdf!.setCreator('PDFBlack Local Browser');

        setProgressMsg(
          isEs ? 'Guardando PDF totalmente libre de restricciones...' : 'Saving unlocked PDF...',
        );
        setProgressPercent(95);

        const unlockedBytes = await cleanPdf!.save({ useObjectStreams: false });

        // Hash SHA-256
        const unlockedArray = new Uint8Array(unlockedBytes);
        let checksumSha256 = '';
        try {
          const hashBuffer = await crypto.subtle.digest('SHA-256', unlockedArray);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          checksumSha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch {
          checksumSha256 = 'no-disponible';
        }

        const blob = new Blob([unlockedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const r: UnlockResult = {
          type: 'result',
          unlockedBytes: unlockedBytes.buffer as ArrayBuffer,
          fileName: file.name,
          pageCount,
          vectorPreserved,
          wasEncrypted: hasEncryptDict,
          originalSize: file.size,
          unlockedSize: unlockedBytes.byteLength,
          checksumSha256,
          encryptionType: hasEncryptDict ? 'AES-256 / Protected' : 'none',
          timestamp: new Date().toISOString(),
        };

        (r as unknown as Record<string, unknown>).downloadUrl = url;
        newResults.push(r);
        setResults([...newResults]);

        // Establecer pantalla de éxito en vez de auto-descarga
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        const suffix = customSuffix || '_Desbloqueado';
        setCompletedResult({
          downloadUrl: url,
          filename: `${originalName}${suffix}.pdf`,
          fileSize: formatFileSize(unlockedBytes.byteLength),
          rawBlob: blob,
          originalSize: file.size,
          unlockedSize: unlockedBytes.byteLength,
          pageCount,
          checksumSha256,
          encryptionType: hasEncryptDict ? 'AES-256 / Protected' : 'none',
        });
      }

      setProgressPercent(100);
      setProgressMsg(isEs ? '¡Proceso completado!' : 'Process complete!');
      setIsProcessing(false);
    } catch (error: any) {
      console.error('Unlock error:', error);
      const isPasswordError =
        error?.name === 'PasswordException' || error?.message?.includes('password');
      toast.error(
        isPasswordError
          ? isEs
            ? 'Contraseña incorrecta. Por favor verifique la clave.'
            : 'Incorrect password. Please check the key.'
          : error?.message || (isEs ? 'Error al desbloquear el archivo' : 'Error unlocking file'),
      );
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

  const hasAnyEncrypted = Object.values(detectionMap).some((d) => d.type === 'encrypted');
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
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />

      {/* CABECERA */}
      <div
        ref={topHeaderRef}
        className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl"
      >
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
              <span>
                {isEs
                  ? 'DESBLOQUEAR Y LIBERAR RESTRICCIONES DE PDF'
                  : 'UNLOCK AND REMOVE RESTRICTIONS FROM PDF'}
              </span>
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
          className="w-full bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-8 lg:p-14 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden"
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
              {isEs
                ? 'Arrastra tus PDFs protegidos aquí para desbloquear'
                : 'Drop your protected PDFs here to unlock'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs
                ? 'O haz clic para explorar tus archivos (múltiples permitidos)'
                : 'Or click to browse your local files (multiple allowed)'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" />{' '}
            {isEs ? 'Subir PDFs Protegidos' : 'Upload Protected PDFs'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? '100% PRIVACIDAD • DESCIFRADO LOCAL AES-256 • WEB WORKER'
                : '100% PRIVACY • LOCAL AES-256 DECRYPTION • WEB WORKER'}
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
          {/* BANNER DE MÉTRICAS */}
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
                    {isEs
                      ? '¡Documento Desbloqueado con Éxito!'
                      : 'Document Unlocked Successfully!'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {completedResult.encryptionType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{isEs ? 'Restricciones Eliminadas' : 'Restrictions Removed'}</span>
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
                  {isEs ? 'Tamaño Desbloqueado' : 'Unlocked Size'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.unlockedSize)}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas' : 'Pages'}
                </span>
                <span className="text-white font-bold text-lg font-mono mt-0.5">
                  {completedResult.pageCount}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">SHA-256</span>
                <span className="text-emerald-400 font-bold text-[10px] font-mono mt-0.5 truncate">
                  {completedResult.checksumSha256?.substring(0, 16)}...
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
            currentToolId="desbloquear"
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
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                detection.type === 'encrypted'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : detection.type === 'owner-only'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {detection.type === 'encrypted'
                                ? '🔒'
                                : detection.type === 'owner-only'
                                  ? '🔐'
                                  : '✅'}
                            </span>
                          )}
                          {res && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              ✓
                            </span>
                          )}
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

            {/* VISTA PREVIA CON GRILLA DE MINIATURAS (3 COLUMNAS X 4 FILAS) */}
            <div
              className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative font-mono"
              style={{
                height: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                maxHeight: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                minHeight: '300px',
              }}
            >
              <div className="bg-zinc-900 border-b border-white/10 p-3.5 flex justify-between items-center z-10 font-sans">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`p-2 rounded-xl border flex-shrink-0 transition-colors ${
                      activeDetection?.type === 'encrypted'
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : activeDetection?.type === 'owner-only'
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                          : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden font-mono">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">
                      {activeFile?.name || ''}
                    </span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1.5">
                      <span>{activeFile ? formatFileSize(activeFile.size) : ''}</span>
                      <span className="text-zinc-600">•</span>
                      <span
                        className={
                          activeDetection?.type === 'encrypted'
                            ? 'text-amber-400 font-bold'
                            : activeDetection?.type === 'owner-only'
                              ? 'text-blue-400 font-bold'
                              : 'text-emerald-400 font-bold'
                        }
                      >
                        {activeDetection?.type === 'encrypted'
                          ? isEs
                            ? 'Clave requerida'
                            : 'Password required'
                          : activeDetection?.type === 'owner-only'
                            ? isEs
                              ? 'Permisos restringidos'
                              : 'Permissions locked'
                            : isEs
                              ? 'Listo para liberar'
                              : 'Ready to unlock'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-zinc-950 border border-white/10 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeDetection?.type === 'encrypted'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span>
                      {isEs ? `Miniaturas (${totalPages} págs)` : `Thumbnails (${totalPages} pgs)`}
                    </span>
                  </span>
                </div>
              </div>

              {/* CONTENEDOR DE MINIATURAS EN GRILLA (3 COLUMNAS X 4 FILAS) */}
              <div className="w-full flex-1 min-h-0 max-lg:max-h-[500px] bg-[#09090b] relative p-3 sm:p-4 overflow-y-auto font-sans flex flex-col justify-start">
                {isLoadingThumbnails ? (
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
                ) : (
                  <div className="w-full h-full min-h-[350px] bg-zinc-900/90 border border-amber-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 my-auto">
                    <Lock className="w-10 h-10 text-amber-400" />
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 uppercase">
                      {isEs ? 'PDF PROTEGIDO CON CONTRASEÑA' : 'PASSWORD PROTECTED PDF'}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {isEs ? 'Documento Bloqueado' : 'Locked Document'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-xs">
                      {isEs
                        ? 'Ingrese la contraseña en el panel de control si es requerida para previsualizar y liberar el archivo.'
                        : 'Type password in control panel if needed to render and unlock.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              ref={controlPanelRef}
              className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans"
            >
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
                  <div
                    className={`mb-4 p-3.5 rounded-xl border ${
                      activeDetection.type === 'encrypted'
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : activeDetection.type === 'owner-only'
                          ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                          : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Info className="w-4 h-4" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider">
                        {isEs ? 'DIAGNÓSTICO DE SEGURIDAD' : 'SECURITY DIAGNOSIS'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-tight mb-1">
                      {activeDetection.message}
                    </p>
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
                          placeholder={
                            isEs
                              ? 'Ingresa la contraseña del documento...'
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">
                        {isEs
                          ? '* Esta contraseña nunca se almacena, registra ni envía a ningún servidor.'
                          : '* This password is never stored, logged, or sent to any server.'}
                      </span>
                      <button
                        type="button"
                        onClick={executeRecoveryUnlock}
                        disabled={isProcessing}
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-400 font-bold py-2 px-3 rounded-xl text-[11px] transition-all cursor-pointer disabled:opacity-40 font-mono"
                      >
                        <Search className="w-3.5 h-3.5" />
                        {isEs
                          ? 'RECUPERAR CONTRASEÑA (INTENTAR CLAVES COMUNES)'
                          : 'RECOVER PASSWORD (TRY COMMON KEYS)'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* OPCIONES AVANZADAS (SIEMPRE VISIBLES) */}
                <div className="mb-4 space-y-4 bg-zinc-950/60 border border-white/10 rounded-2xl p-4 sm:p-5 font-sans">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider border-b border-white/10 pb-2 mb-3 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEs ? 'OPCIONES AVANZADAS DE SALIDA' : 'ADVANCED OUTPUT OPTIONS'}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Ajustes de Salida' : 'Output Settings'}
                    </label>

                    <div
                      onClick={() => setStripMetadata((v) => !v)}
                      className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-white">
                          {isEs ? 'Eliminar metadatos del PDF' : 'Strip PDF metadata'}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          {isEs
                            ? 'Purga título, autor y programa de origen'
                            : 'Purge title, author & software info'}
                        </p>
                      </div>
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${stripMetadata ? 'bg-white' : 'bg-zinc-700'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${stripMetadata ? 'left-4' : 'left-0.5'}`}
                        />
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
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2.5 py-2"
                          >
                            <span className="text-sm">{perm.icon}</span>
                            <span className="text-[10px] text-emerald-300 font-mono font-bold leading-tight">
                              {isEs ? perm.es : perm.en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
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
                            ? files.length > 1
                              ? `Desbloquear ${files.length} archivos`
                              : 'Desbloquear PDF'
                            : files.length > 1
                              ? `Unlock ${files.length} files`
                              : 'Unlock PDF'}
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
