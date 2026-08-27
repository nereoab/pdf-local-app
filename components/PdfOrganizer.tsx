'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  LayoutGrid,
  FileText,
  X,
  Loader2,
  Sliders,
  UploadCloud,
  Sparkles,
  ZoomIn,
  RotateCw,
  Copy,
  Trash2,
  ArrowLeftRight,
  Plus,
  RotateCcw,
  ListOrdered,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Unlock,
  ChevronDown,
  Undo2,
  RefreshCw,
  Grid,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReorderWorkerMessageIn, ReorderWorkerMessageOut } from '@/workers/pdf-reorder.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

type PageItem = {
  id: string;
  fileIndex: number;
  originalPageNum: number;
  rotation: number;
  isBlank: boolean;
  thumbnailUrl: string | null;
};

interface CompletedReorderResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  totalPages: number;
  rawBlob: Blob;
  originalSize: string;
}

export default function PdfOrganizer() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const { globalFiles, globalFile, setGlobalFiles } = useFileStore();

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const initialPagesRef = useRef<PageItem[]>([]);
  const historyRef = useRef<PageItem[][]>([]);
  const [historyLength, setHistoryLength] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedResult, setCompletedResult] = useState<CompletedReorderResult | null>(null);

  // ZOOM DE CUADRÍCULA (VISTA COMPACTA / ESTÁNDAR / GRANDE)
  const [gridZoom, setGridZoom] = useState<'sm' | 'md' | 'lg'>('md');

  // REGISTRO DE HISTORIAL PARA DESHACER (UNDO)
  const pushHistory = useCallback((currentPages: PageItem[]) => {
    historyRef.current.push([...currentPages]);
    if (historyRef.current.length > 25) {
      historyRef.current.shift();
    }
    setHistoryLength(historyRef.current.length);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop()!;
      setHistoryLength(historyRef.current.length);
      setPages(prev);
      toast.info(isEs ? 'Acción deshecha (Ctrl+Z)' : 'Action undone (Ctrl+Z)');
    } else {
      toast.info(isEs ? 'No hay más acciones para deshacer' : 'No more actions to undo');
    }
  }, [isEs]);

  // ATAJO DE TECLADO GLOBAL CTRL+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Ocultar barra superior global y scroll automático suave hacia la cabecera de la herramienta
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      const timer = setTimeout(() => {
        if (topHeaderRef.current) {
          topHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  // Asegurar restauración de barra superior al desmontar
  useEffect(() => {
    return () => {
      setHeaderHidden(false);
    };
  }, [setHeaderHidden]);

  const [isDragging, setIsDragging] = useState(false);
  const loadedStoreRef = useRef(false);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // RESULTADOS Y PREVIAS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // ESTADO DE ARRASTRE Y SELECCIÓN
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [previewZoomPage, setPreviewZoomPage] = useState<PageItem | null>(null);

  // OPCIONES AVANZADAS Y METADATOS
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Reordenado');
  const [renumberPages, setRenumberPages] = useState<boolean>(true);
  const [numberingFormat, setNumberingFormat] = useState<
    'page_x_of_y' | 'x_slash_y' | 'dash_x_dash' | 'num_only'
  >('page_x_of_y');
  const [numberingPosition, setNumberingPosition] = useState<
    'bottom_center' | 'bottom_right' | 'bottom_left'
  >('bottom_center');

  const [insertBlankPosition, setInsertBlankPosition] = useState<number>(1);
  const [moveFromPage, setMoveFromPage] = useState<number>(1);
  const [moveToPos, setMoveToPos] = useState<number>(1);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  // PROCESAR ARCHIVOS PDF Y CREADOR DE MINIATURAS
  const procesarArchivosPDF = useCallback(
    async (selectedFiles: File[], pass?: string) => {
      if (!selectedFiles || selectedFiles.length === 0) return;
      setIsProcessing(true);
      setProgressPercent(10);
      setProgressMsg(isEs ? 'Iniciando mesa de montaje...' : 'Starting workspace...');

      try {
        const newFilesList = [...files, ...selectedFiles];
        const newPages: PageItem[] = [...pages];

        // PASO 1: Análisis instantáneo de páginas con PDFDocument
        for (let i = 0; i < selectedFiles.length; i++) {
          const currentFile = selectedFiles[i];
          const fileIndex = files.length + i;
          const arrayBuffer = await currentFile.arrayBuffer();

          let pageCount = 1;
          try {
            const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0), {
              ignoreEncryption: true,
              password: pass,
            } as any);
            pageCount = pdfDoc.getPageCount();
          } catch (pdfDocErr: any) {
            if (
              pdfDocErr?.message?.includes('password') ||
              pdfDocErr?.name === 'PasswordException'
            ) {
              setIsEncrypted(true);
              setIsUnlocked(false);
              toast.warning(
                isEs
                  ? 'El archivo requiere contraseña para abrirse'
                  : 'File requires password to open',
              );
              setIsProcessing(false);
              return;
            }
          }

          for (let p = 1; p <= pageCount; p++) {
            newPages.push({
              id: `${fileIndex}-${p}-${Date.now()}-${Math.random()}`,
              fileIndex,
              originalPageNum: p,
              rotation: 0,
              isBlank: false,
              thumbnailUrl: null,
            });
          }
        }

        // Mostrar de inmediato la mesa de montaje con las tarjetas
        setFiles(newFilesList);
        setPages(newPages);
        initialPagesRef.current = [...newPages];
        historyRef.current = [];
        setHistoryLength(0);
        setGlobalFiles(newFilesList);
        setIsEncrypted(false);
        setIsUnlocked(true);

        if (selectedFiles[0]) {
          setFilePrefix(selectedFiles[0].name.replace(/\.[^/.]+$/, '') + '_Reordenado');
        }
        setProgressPercent(40);
        setProgressMsg(isEs ? 'Renderizando miniaturas...' : 'Rendering thumbnails...');

        // PASO 2: Renderizar miniaturas progresivamente con PDF.js
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

          for (let i = 0; i < selectedFiles.length; i++) {
            const currentFile = selectedFiles[i];
            const fileIndex = files.length + i;
            const arrayBuffer = await currentFile.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer.slice(0));

            try {
              const pdf = await pdfjsLib.getDocument({ data: uint8, password: pass }).promise;
              const count = pdf.numPages;

              for (let p = 1; p <= count; p++) {
                setProgressMsg(
                  isEs
                    ? `Renderizando miniatura (pág ${p}/${count})...`
                    : `Rendering thumbnail (page ${p}/${count})...`,
                );
                setProgressPercent(40 + Math.floor((p / count) * 60));
                if (p % 4 === 0) await new Promise((r) => setTimeout(r, 5));

                try {
                  const page = await pdf.getPage(p);
                  const viewport = page.getViewport({ scale: 0.5 });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');

                  if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                    const thumbUrl = canvas.toDataURL('image/jpeg', 0.6);

                    setPages((prev) =>
                      prev.map((item) =>
                        item.fileIndex === fileIndex && item.originalPageNum === p
                          ? { ...item, thumbnailUrl: thumbUrl }
                          : item,
                      ),
                    );
                  }
                } catch (pageErr) {
                  console.warn(`Could not render thumbnail for page ${p}:`, pageErr);
                }
              }
            } catch (docErr: any) {
              console.warn('PDF.js thumbnail generation error:', docErr);
            }
          }
        } catch (libErr) {
          console.warn('Could not load PDF.js library for thumbnails:', libErr);
        }

        setProgressPercent(100);
        toast.success(
          isEs ? 'Páginas cargadas en la mesa de montaje' : 'Pages loaded into workspace',
        );
      } catch (error: any) {
        if (error?.name === 'PasswordException' || error?.code === 1) {
          setIsEncrypted(true);
          setIsUnlocked(false);
          toast.warning(
            isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open',
          );
        } else {
          console.error(error);
          toast.error(isEs ? 'Error al procesar el archivo PDF' : 'Error processing PDF');
        }
      } finally {
        setIsProcessing(false);
        setProgressMsg('');
      }
    },
    [files, pages, isEs, setGlobalFiles],
  );

  useEffect(() => {
    if (!loadedStoreRef.current && files.length === 0) {
      const existing =
        globalFiles && globalFiles.length > 0 ? globalFiles : globalFile ? [globalFile] : [];
      const validPdfs = existing.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      );
      if (validPdfs.length > 0 && !isEncrypted) {
        loadedStoreRef.current = true;
        procesarArchivosPDF(validPdfs);
      }
    }
  }, [globalFiles, globalFile, files.length, isEncrypted, procesarArchivosPDF]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      );
      if (selected.length > 0) {
        setDownloadUrl(null);
        setIsEncrypted(false);
        setIsUnlocked(false);
        setUnlockedPassword(undefined);
        setPasswordInput('');
        await procesarArchivosPDF(selected);
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona un archivo PDF válido (.pdf)'
            : 'Please select a valid PDF file (.pdf)',
        );
      }
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (files.length === 0 || !passwordInput) return;
    try {
      await procesarArchivosPDF(files, passwordInput);
      setUnlockedPassword(passwordInput);
      setIsUnlocked(true);
      setIsEncrypted(false);
      toast.success(
        isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF unlocked successfully!',
      );
    } catch {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  const removeFile = useCallback(() => {
    setHeaderHidden(false);
    setFiles([]);
    setPages([]);
    initialPagesRef.current = [];
    historyRef.current = [];
    setHistoryLength(0);
    setDownloadUrl(null);
    setCompletedResult(null);
    setGlobalFiles([]);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
  }, [setGlobalFiles, setHeaderHidden]);

  // ACCIONES INDIVIDUALES SOBRE TARJETAS
  const handleRotatePage = (index: number) => {
    pushHistory(pages);
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rotation: (updated[index].rotation + 90) % 360 };
      return updated;
    });
    setDownloadUrl(null);
  };

  const handleDuplicatePage = (index: number) => {
    pushHistory(pages);
    setPages((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const clone: PageItem = {
        ...target,
        id: `${target.id}-copy-${Date.now()}-${Math.random()}`,
      };
      updated.splice(index + 1, 0, clone);
      return updated;
    });
    setDownloadUrl(null);
    toast.success(isEs ? 'Página duplicada' : 'Page duplicated');
  };

  const handleDeletePage = (index: number) => {
    if (pages.length === 1) {
      toast.error(
        isEs ? 'No puedes eliminar la única página del PDF' : 'Cannot delete the only page',
      );
      return;
    }
    pushHistory(pages);
    setPages((prev) => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
  };

  // PATRONES DE REORDENAMIENTO EN 1-CLIC (PANEL DE CONTROL)
  const handleInvertOrder = () => {
    pushHistory(pages);
    setPages((prev) => [...prev].reverse());
    setDownloadUrl(null);
    toast.success(isEs ? 'Secuencia de páginas invertida' : 'Page sequence reversed');
  };

  const handleGroupEvensOdds = (oddsFirst = true) => {
    pushHistory(pages);
    setPages((prev) => {
      const odds = prev.filter((_, i) => (i + 1) % 2 !== 0);
      const evens = prev.filter((_, i) => (i + 1) % 2 === 0);
      return oddsFirst ? [...odds, ...evens] : [...evens, ...odds];
    });
    setDownloadUrl(null);
    toast.success(
      isEs
        ? oddsFirst
          ? 'Impares primero agrupados'
          : 'Pares primero agrupados'
        : oddsFirst
          ? 'Odds first grouped'
          : 'Evens first grouped',
    );
  };

  const handleDuplexInterleave = (reverseSecondHalf = true) => {
    if (pages.length < 2) {
      toast.info(
        isEs ? 'Se necesitan al menos 2 páginas para intercalar' : 'Need at least 2 pages',
      );
      return;
    }
    pushHistory(pages);
    const half = Math.ceil(pages.length / 2);
    const firstHalf = pages.slice(0, half);
    const secondHalf = reverseSecondHalf ? pages.slice(half).reverse() : pages.slice(half);
    const interleaved: PageItem[] = [];
    for (let i = 0; i < half; i++) {
      if (firstHalf[i]) interleaved.push(firstHalf[i]);
      if (secondHalf[i]) interleaved.push(secondHalf[i]);
    }
    setPages(interleaved);
    setDownloadUrl(null);
    toast.success(isEs ? 'Escaneo Dúplex intercalado exitosamente' : 'Duplex scan interleaved');
  };

  const handleResetInitialOrder = () => {
    if (initialPagesRef.current.length > 0) {
      pushHistory(pages);
      setPages([...initialPagesRef.current]);
      setDownloadUrl(null);
      toast.success(isEs ? 'Orden inicial restablecido' : 'Initial order restored');
    }
  };

  const handleRotateAll = (degreesToAdd: number) => {
    pushHistory(pages);
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + degreesToAdd) % 360 })));
    setDownloadUrl(null);
    toast.success(
      isEs ? `Todas las páginas rotadas ${degreesToAdd}°` : `All pages rotated ${degreesToAdd}°`,
    );
  };

  const handleResetRotations = () => {
    pushHistory(pages);
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
    setDownloadUrl(null);
    toast.success(isEs ? 'Rotaciones restablecidas a 0°' : 'Rotations reset to 0°');
  };

  const handleInsertBlankPage = () => {
    const pos = Math.max(1, Math.min(pages.length + 1, insertBlankPosition));
    const blankItem: PageItem = {
      id: `blank-${Date.now()}-${Math.random()}`,
      fileIndex: -1,
      originalPageNum: 0,
      rotation: 0,
      isBlank: true,
      thumbnailUrl: null,
    };

    pushHistory(pages);
    setPages((prev) => {
      const updated = [...prev];
      updated.splice(pos - 1, 0, blankItem);
      return updated;
    });
    setDownloadUrl(null);
    toast.success(
      isEs
        ? `Hoja en blanco insertada en la posición #${pos}`
        : `Blank page inserted at position #${pos}`,
    );
  };

  const handleMovePageCommand = () => {
    const fromIdx = moveFromPage - 1;
    const toIdx = moveToPos - 1;

    if (fromIdx < 0 || fromIdx >= pages.length || toIdx < 0 || toIdx >= pages.length) {
      toast.error(isEs ? 'Posiciones de mover no válidas' : 'Invalid move positions');
      return;
    }

    pushHistory(pages);
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
    setDownloadUrl(null);
    toast.success(
      isEs
        ? `Página #${moveFromPage} movida a la posición #${moveToPos}`
        : `Page #${moveFromPage} moved to #${moveToPos}`,
    );
  };

  // MANEJO DE DRAG & DROP MANUAL EN LA MESA DE MONTAJE
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    pushHistory(pages);
    setPages((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, dragged);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDownloadUrl(null);
  };

  // EJECUCIÓN CON WEB WORKER
  const executeReorder = async () => {
    if (pages.length === 0 || files.length === 0) {
      toast.error(isEs ? 'Carga al menos un archivo PDF' : 'Upload at least one PDF file');
      return;
    }

    if (isEncrypted && !isUnlocked) {
      toast.error(
        isEs
          ? 'Desbloquea el PDF con su contraseña antes de procesar'
          : 'Unlock PDF with password before processing',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando Web Worker acelerado...' : 'Starting Web Worker...');

    try {
      const filesPayload = await Promise.all(
        files.map(async (f) => {
          const buffer = await f.arrayBuffer();
          return {
            arrayBuffer: buffer.slice(0),
            password: unlockedPassword,
          };
        }),
      );

      const pageSequencePayload = pages.map((p) => ({
        fileIndex: p.fileIndex,
        originalPageNum: p.originalPageNum,
        rotation: p.rotation,
        isBlank: p.isBlank,
      }));

      const worker = new Worker(new URL('../workers/pdf-reorder.worker.ts', import.meta.url), {
        type: 'module',
      });

      const transferBuffers = filesPayload.map((f) => f.arrayBuffer);

      const payload: ReorderWorkerMessageIn = {
        action: 'reorder',
        files: filesPayload,
        pageSequence: pageSequencePayload,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Reordenado',
          renumberPages,
          numberingFormat,
          numberingPosition,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
          worker.onmessage = (e: MessageEvent<ReorderWorkerMessageOut>) => {
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

          worker.postMessage(payload, transferBuffers);
        },
      );

      worker.terminate();

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix.trim() || 'Documento_Reordenado'}.pdf`;
      const sizeFormatted = formatFileSize(blob.size);
      const totalOrigBytes = files.reduce((acc, f) => acc + f.size, 0);
      const origSizeFormatted = totalOrigBytes > 0 ? formatFileSize(totalOrigBytes) : '—';

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeFormatted,
        totalPages: result.totalPages,
        rawBlob: blob,
        originalSize: origSizeFormatted,
      });

      setProgressPercent(100);
      toast.success(
        isEs ? '¡Documento PDF reordenado con éxito!' : 'PDF document reordered successfully!',
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message ||
          (isEs ? 'Error al guardar el documento reordenado' : 'Error saving reordered document'),
      );
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
      <input
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        ref={addMoreInputRef}
        onChange={handleFileChange}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <Link
            href="/organizar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '002 / REORDENAMIENTO Y MONTAJE DE DOCUMENTOS PDF'
                : '002 / PDF REORDERING & ASSEMBLY'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <LayoutGrid className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'ORDENAR Y REORGANIZAR PÁGINAS PDF' : 'REORDER PDF PAGES'}
            </h1>
          </div>
        </div>

        {completedResult ? (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-xs font-mono text-white">
            <FileText className="w-4 h-4 text-zinc-300" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {completedResult.filename}
            </span>
          </div>
        ) : pages.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {files.length} {isEs ? 'archivo(s)' : 'file(s)'} ({pages.length}{' '}
                {isEs ? 'páginas' : 'pages'})
              </span>
            </div>
            <button
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all"
              title={isEs ? 'Limpiar mesa' : 'Clear deck'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA ── */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE REORDENAMIENTO */}
          <div className="bg-[#09090b] border border-white/20 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                  <LayoutGrid className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DEL REORDENAMIENTO DE PÁGINAS' : 'PAGE REORDER RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs
                      ? '¡Documento reorganizado con éxito!'
                      : 'Document reordered successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-zinc-800 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.originalSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Totales' : 'Total Pages'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Modo de Procesamiento' : 'Processing Mode'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Vectorial Nativo' : 'Native Vector'}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA ÉXITO CON ENCADENAMIENTO DE HERRAMIENTAS */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            onReset={removeFile}
          />
        </motion.div>
      ) : pages.length === 0 ? (
        /* VISTA DROPZONE VACÍA */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const selected = Array.from(e.dataTransfer.files).filter(
                (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
              );
              if (selected.length > 0) {
                setDownloadUrl(null);
                setIsEncrypted(false);
                setIsUnlocked(false);
                setUnlockedPassword(undefined);
                setPasswordInput('');
                procesarArchivosPDF(selected);
              } else {
                toast.error(
                  isEs
                    ? 'Por favor arrastra un archivo PDF válido (.pdf)'
                    : 'Please drop a valid PDF file (.pdf)',
                );
              }
            }
          }}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer relative overflow-hidden ${
            isDragging ? 'border-white scale-[1.01]' : 'border-zinc-600 hover:border-white'
          }`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          {/* INPUT TRANSPARENTE DE COBERTURA TOTAL NATIVA */}
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            aria-label="Seleccionar Archivos PDF"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
          />

          <div
            className={`p-6 rounded-2xl border transition-all mb-6 relative z-10 pointer-events-none shadow-md ${
              isDragging
                ? 'bg-white/10 border-white'
                : 'bg-zinc-900 border-zinc-700 group-hover:border-white group-hover:scale-105 text-white'
            }`}
          >
            <UploadCloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase relative z-10 pointer-events-none">
            {isEs ? 'ORDENAR Y REORGANIZAR PÁGINAS PDF' : 'REORDER PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md relative z-10 pointer-events-none">
            {isEs
              ? 'Cambia el orden, rota, duplica e intercala hojas de tu PDF de forma 100% confidencial y local.'
              : 'Reorder, rotate, duplicate, and interleave pages from your PDF 100% locally.'}
          </p>
          <div className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer relative z-20 pointer-events-none">
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-white font-bold text-xs font-mono rounded-full mt-8 relative z-10 pointer-events-none shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>
              {isEs
                ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL'
                : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}
            </span>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y MESA DE MONTAJE REORDENABLE */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
        >
          {/* LADO IZQUIERDO: MESA DE MONTAJE Y REORDENAMIENTO */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col min-h-[580px] lg:h-[700px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / MESA DE MONTAJE (${pages.length} HOJAS)`
                    : `001 / WORKSPACE (${pages.length} SHEETS)`}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {/* BOTÓN DESHACER (CTRL+Z) */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyLength === 0}
                  className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-300 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed font-mono"
                  title={isEs ? 'Deshacer último cambio (Ctrl+Z)' : 'Undo last action (Ctrl+Z)'}
                >
                  <Undo2 className="w-3 h-3" />
                  <span>{isEs ? 'Deshacer' : 'Undo'}</span>
                </button>

                {/* SELECTOR DE ZOOM DE CUADRÍCULA */}
                <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setGridZoom('sm')}
                    className={`px-2 py-0.5 rounded transition-all font-bold ${
                      gridZoom === 'sm' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Vista Compacta (Miniaturas pequeñas)' : 'Compact View'}
                  >
                    S
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridZoom('md')}
                    className={`px-2 py-0.5 rounded transition-all font-bold ${
                      gridZoom === 'md' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Vista Estándar' : 'Standard View'}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridZoom('lg')}
                    className={`px-2 py-0.5 rounded transition-all font-bold ${
                      gridZoom === 'lg' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Vista Detalle (Miniaturas grandes)' : 'Large View'}
                  >
                    L
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => addMoreInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer font-mono"
                >
                  <Plus className="w-3 h-3 text-white" />
                  {isEs ? 'Añadir más' : 'Add more'}
                </button>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[10px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* PASSWORD WIDGET FOR ENCRYPTED PDF */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-3 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Lock className="w-4 h-4" />
                  <span>
                    {isEs
                      ? 'Este PDF está protegido con contraseña'
                      : 'This PDF is password protected'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder={
                      isEs ? 'Ingresa la contraseña de apertura...' : 'Enter open password...'
                    }
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
                    <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* INSTRUCCIÓN DE DRAG & DROP */}
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/10 flex items-center justify-between font-mono text-[11px] text-zinc-300 mb-3">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                {isEs
                  ? 'Arrastra cualquier tarjeta para cambiar su posición en vivo'
                  : 'Drag any card to change position in real time'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {pages.length} {isEs ? 'tarjetas' : 'cards'}
              </span>
            </div>

            {/* GRID REORDENABLE DRAG & DROP EN CUADRÍCULA DINÁMICA CON FRAMER MOTION LAYOUT */}
            <div
              className={`grid gap-3.5 flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 p-1 ${
                gridZoom === 'sm'
                  ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  : gridZoom === 'lg'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
              }`}
            >
              {pages.map((p, idx) => (
                <motion.div
                  key={p.id}
                  layout
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  className={`relative w-full rounded-2xl border p-2.5 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all duration-200 group overflow-hidden bg-zinc-950 hover:bg-zinc-900 ${
                    gridZoom === 'sm'
                      ? 'h-[200px] min-h-[200px]'
                      : gridZoom === 'lg'
                        ? 'h-[340px] min-h-[340px]'
                        : 'h-[280px] min-h-[280px]'
                  } ${
                    dragOverIndex === idx
                      ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* BADGES DE POSICIÓN */}
                  <div className="w-full flex items-center justify-between mb-1.5 font-mono text-[10px] shrink-0">
                    <span className="px-1.5 py-0.2 rounded-md font-bold bg-white text-black text-[10px]">
                      #{idx + 1}
                    </span>
                    {p.isBlank ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                        {isEs ? 'Blanca' : 'Blank'}
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400 font-mono">
                        Orig: {p.originalPageNum} {p.rotation !== 0 && `(${p.rotation}°)`}
                      </span>
                    )}
                  </div>

                  {/* TARJETA DE CANVAS / MINIATURA PROPORCIONAL */}
                  <div
                    className="w-full flex-1 min-h-0 bg-zinc-900/90 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner border border-white/5 p-1.5"
                    style={{
                      transform: `rotate(${p.rotation}deg)`,
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {p.isBlank ? (
                      <div className="w-full h-full bg-zinc-950 flex items-center justify-center text-zinc-500 text-[10px] font-mono border border-dashed border-white/10 rounded-xl">
                        {isEs ? 'HOJA EN BLANCO' : 'BLANK PAGE'}
                      </div>
                    ) : p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnailUrl}
                        alt={`Página ${idx + 1}`}
                        className="max-w-full max-h-full object-contain rounded drop-shadow-md"
                      />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* BOTONES DE HERRAMIENTAS INDIVIDUALES */}
                  <div className="w-full flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors border border-white/10"
                        title={isEs ? 'Rotar 90°' : 'Rotate 90°'}
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePage(idx);
                        }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors border border-white/10"
                        title={isEs ? 'Duplicar página' : 'Duplicate page'}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        className="p-1 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-colors border border-white/10"
                        title={isEs ? 'Eliminar página' : 'Delete page'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {!p.isBlank && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewZoomPage(p);
                        }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors border border-white/10"
                        title={isEs ? 'Zoom' : 'Zoom'}
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between min-h-[580px] lg:h-[700px]">
            <div className="space-y-2.5 font-mono">
              {/* TÍTULO PRINCIPAL CON MÉTRICAS EN VIVO */}
              <div className="pb-2 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                    {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                  </span>
                  <h2 className="text-base font-black text-white font-sans uppercase tracking-tight">
                    {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-mono">
                    <span className="text-white font-bold">{pages.length}</span>{' '}
                    {isEs ? 'págs' : 'pgs'} •{' '}
                    <span className="text-amber-400 font-bold">
                      {pages.filter((p) => p.rotation !== 0).length}
                    </span>{' '}
                    {isEs ? 'rot.' : 'rot.'}
                  </div>
                </div>
              </div>

              {/* PATRONES DE ORDEN AUTOMÁTICO EN 1-CLIC */}
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                  {isEs ? 'Patrones de Orden Rápido:' : 'Quick Reorder Patterns:'}
                </span>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={handleInvertOrder}
                    disabled={pages.length === 0}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 text-[11px]"
                    title={isEs ? 'Invertir orden de todas las páginas' : 'Reverse all pages'}
                  >
                    <ArrowLeftRight className="w-3 h-3 text-white" />
                    <span>{isEs ? 'Invertir' : 'Reverse'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGroupEvensOdds(true)}
                    disabled={pages.length === 0}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 text-[11px]"
                    title={isEs ? 'Agrupar páginas impares primero' : 'Odds first'}
                  >
                    <ListOrdered className="w-3 h-3 text-white" />
                    <span>{isEs ? 'Impares 1º' : 'Odds 1st'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGroupEvensOdds(false)}
                    disabled={pages.length === 0}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 text-[11px]"
                    title={isEs ? 'Agrupar páginas pares primero' : 'Evens first'}
                  >
                    <ListOrdered className="w-3 h-3 text-white" />
                    <span>{isEs ? 'Pares 1º' : 'Evens 1st'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplexInterleave(true)}
                    disabled={pages.length < 2}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 text-[11px]"
                    title={
                      isEs
                        ? 'Intercalar escaneo dúplex (impares + pares invertidos)'
                        : 'Interleave duplex scan'
                    }
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>{isEs ? 'Dúplex' : 'Duplex'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRotateAll(90)}
                    disabled={pages.length === 0}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 text-[11px]"
                    title={isEs ? 'Girar todo el PDF 90° a la derecha' : 'Rotate all 90°'}
                  >
                    <RotateCw className="w-3 h-3 text-white" />
                    <span>{isEs ? 'Girar 90°' : 'Rotate 90°'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetInitialOrder}
                    disabled={pages.length === 0}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 text-[11px]"
                    title={isEs ? 'Restablecer orden inicial del archivo' : 'Reset original order'}
                  >
                    <RotateCcw className="w-3 h-3 text-zinc-400" />
                    <span>{isEs ? 'Restablecer' : 'Reset'}</span>
                  </button>
                </div>
              </div>

              {/* CONTROLES DE PRECISIÓN E INSERCIÓN */}
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-white/10 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-zinc-400 text-[10px] whitespace-nowrap">
                    {isEs ? 'Mover pág' : 'Move p.'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pages.length || 1}
                    value={moveFromPage}
                    onChange={(e) =>
                      setMoveFromPage(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-10 bg-zinc-900 border border-white/20 rounded-md py-0.5 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                  />
                  <span className="text-zinc-400 text-[10px] whitespace-nowrap">
                    {isEs ? 'a pos #' : 'to #'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pages.length || 1}
                    value={moveToPos}
                    onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-10 bg-zinc-900 border border-white/20 rounded-md py-0.5 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                  />
                  <button
                    type="button"
                    onClick={handleMovePageCommand}
                    disabled={pages.length === 0}
                    className="px-2 py-1 bg-white text-black font-bold rounded-md text-[11px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? 'Mover' : 'Move'}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5 text-xs">
                  <span className="text-zinc-400 text-[10px] whitespace-nowrap">
                    {isEs ? 'Insertar blanca en pos #' : 'Insert blank at #'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pages.length + 1 || 1}
                    value={insertBlankPosition}
                    onChange={(e) =>
                      setInsertBlankPosition(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-10 bg-zinc-900 border border-white/20 rounded-md py-0.5 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                  />
                  <button
                    type="button"
                    onClick={handleInsertBlankPage}
                    disabled={pages.length === 0}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-md text-[11px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? '+ Insertar' : '+ Insert'}
                  </button>
                </div>
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS PDFBLACK */}
              <div className="pt-2 border-t border-white/10 space-y-2 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span>{isEs ? 'Opciones Avanzadas PDFBLACK' : 'PDFBLACK Advanced Options'}</span>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEs ? 'Nomenclatura / Prefijo Resultante:' : 'Output File Prefix:'}
                  </label>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Reordenado"
                    className="w-full py-1 px-2.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
                {/* Ajustes de numeración con formato y posición */}
                <div className="bg-zinc-950/80 p-2 rounded-lg border border-white/10 space-y-1.5">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={renumberPages}
                      onChange={(e) => setRenumberPages(e.target.checked)}
                      className="accent-white w-3.5 h-3.5 rounded"
                    />
                    <span>{isEs ? 'Re-numerar pie de página' : 'Re-number footer pages'}</span>
                  </label>
                  {renumberPages && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                      <div>
                        <label className="text-[9px] text-zinc-400 block mb-0.5">
                          {isEs ? 'Formato:' : 'Format:'}
                        </label>
                        <select
                          value={numberingFormat}
                          onChange={(e: any) => setNumberingFormat(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded py-0.5 px-1.5 text-[10px] text-white outline-none focus:border-white/30 font-mono cursor-pointer"
                        >
                          <option value="page_x_of_y">Página X de Y</option>
                          <option value="x_slash_y">X / Y</option>
                          <option value="dash_x_dash">— X —</option>
                          <option value="num_only">X (Solo número)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-400 block mb-0.5">
                          {isEs ? 'Posición:' : 'Position:'}
                        </label>
                        <select
                          value={numberingPosition}
                          onChange={(e: any) => setNumberingPosition(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded py-0.5 px-1.5 text-[10px] text-white outline-none focus:border-white/30 font-mono cursor-pointer"
                        >
                          <option value="bottom_center">Inferior Centro</option>
                          <option value="bottom_right">Inferior Derecha</option>
                          <option value="bottom_left">Inferior Izquierda</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                {/* Metadatos del documento */}
                <details className="group bg-zinc-950/80 border border-white/10 rounded-lg overflow-hidden font-mono text-xs">
                  <summary className="flex items-center justify-between p-2 cursor-pointer font-bold text-[10px] uppercase text-zinc-400 hover:text-white select-none">
                    <span>
                      {isEs
                        ? 'Metadatos del PDF (Título, Autor, Asunto)'
                        : 'PDF Metadata (Title, Author, Subject)'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-2 space-y-1.5 border-t border-white/5 text-[11px]">
                    <div>
                      <label className="text-[9px] text-zinc-400 block mb-0.5">
                        {isEs ? 'Título del Documento:' : 'Document Title:'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          isEs ? 'Ej: Documento_Ordenado_2026' : 'Ex: Reordered_Document_2026'
                        }
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded py-1 px-2 text-[10px] text-white outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] text-zinc-400 block mb-0.5">
                          {isEs ? 'Autor / Organización:' : 'Author / Organization:'}
                        </label>
                        <input
                          type="text"
                          placeholder={isEs ? 'Ej: Mi Empresa S.A.' : 'Ex: Company Inc.'}
                          value={docAuthor}
                          onChange={(e) => setDocAuthor(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded py-1 px-2 text-[10px] text-white outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-400 block mb-0.5">
                          {isEs ? 'Asunto / Descripción:' : 'Subject / Description:'}
                        </label>
                        <input
                          type="text"
                          placeholder={isEs ? 'Ej: Reordenamiento' : 'Ex: Reordering'}
                          value={docSubject}
                          onChange={(e) => setDocSubject(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded py-1 px-2 text-[10px] text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
            <div className="pt-2.5 border-t border-white/10 font-sans">
              {isProcessing && (
                <div className="mb-2 space-y-1 font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                    <span className="truncate max-w-[180px]">{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-white transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={executeReorder}
                disabled={isProcessing || pages.length === 0 || (isEncrypted && !isUnlocked)}
                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-sans font-bold text-sm sm:text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-4 h-4 text-black" />
                )}
                <span>
                  {isProcessing
                    ? progressMsg
                    : pages.length === 0
                      ? isEs
                        ? 'Selecciona un archivo PDF'
                        : 'Select a PDF file'
                      : isEs
                        ? 'Guardar Nuevo Orden del PDF →'
                        : 'Save New PDF Order →'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA */}
      {previewZoomPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/20 p-6 rounded-2xl max-w-xl w-full flex flex-col items-center gap-4 relative shadow-2xl font-mono">
            <button
              type="button"
              onClick={() => setPreviewZoomPage(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-white font-bold text-sm">
              {isEs
                ? `Previsualización - Página Original #${previewZoomPage.originalPageNum}`
                : `Preview - Original Page #${previewZoomPage.originalPageNum}`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner">
              {previewZoomPage.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewZoomPage.thumbnailUrl}
                  alt="Preview Zoom"
                  className="max-h-[65vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
