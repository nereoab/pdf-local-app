'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  LayoutGrid,
  FileText,
  X,
  Loader2,
  Sliders,
  Sparkles,
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
  Undo2,
  Redo2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ReorderWorkerMessageIn, ReorderWorkerMessageOut } from '@/workers/pdf-reorder.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
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
  const [, setDownloadUrl] = useState<string | null>(null);
  const [, setDownloadFilename] = useState<string>('');

  // ZOOM DE CUADRÍCULA (VISTA COMPACTA / ESTÁNDAR / GRANDE)
  const [gridZoom, setGridZoom] = useState<'sm' | 'md' | 'lg'>('md');

  // REGISTRO DE HISTORIAL PARA DESHACER (UNDO) Y REHACER (REDO)
  const redoRef = useRef<PageItem[][]>([]);
  const [redoLength, setRedoLength] = useState(0);

  const pushHistory = useCallback((currentPages: PageItem[]) => {
    historyRef.current.push([...currentPages]);
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    }
    setHistoryLength(historyRef.current.length);
    redoRef.current = [];
    setRedoLength(0);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      const current = [...pages];
      const prev = historyRef.current.pop()!;
      redoRef.current.push(current);
      setRedoLength(redoRef.current.length);
      setHistoryLength(historyRef.current.length);
      setPages(prev);
      toast.info(isEs ? 'Acción deshecha (Ctrl+Z)' : 'Action undone (Ctrl+Z)');
    } else {
      toast.info(isEs ? 'No hay más acciones para deshacer' : 'No more actions to undo');
    }
  }, [isEs, pages]);

  const handleRedo = useCallback(() => {
    if (redoRef.current.length > 0) {
      const next = redoRef.current.pop()!;
      historyRef.current.push([...pages]);
      setHistoryLength(historyRef.current.length);
      setRedoLength(redoRef.current.length);
      setPages(next);
      toast.info(isEs ? 'Acción rehecha (Ctrl+Y)' : 'Action redone (Ctrl+Y)');
    } else {
      toast.info(isEs ? 'No hay más acciones para rehacer' : 'No more actions to redo');
    }
  }, [isEs, pages]);

  // ATAJOS DE TECLADO GLOBALES CTRL+Z Y CTRL+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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
        queueMicrotask(() => {
          procesarArchivosPDF(validPdfs);
        });
      }
    }
  }, [globalFiles, globalFile, files.length, isEncrypted, procesarArchivosPDF]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      );
      if (selected.length > 0) {
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

  const handleQuickInsertBlankPage = () => {
    const blankItem: PageItem = {
      id: `blank-${Date.now()}-${Math.random()}`,
      fileIndex: -1,
      originalPageNum: 0,
      rotation: 0,
      isBlank: true,
      thumbnailUrl: null,
    };
    pushHistory(pages);
    setPages((prev) => [...prev, blankItem]);
    setDownloadUrl(null);
    toast.success(isEs ? 'Hoja en blanco añadida al final' : 'Blank page added at the end');
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
                ? '004 / ORGANIZACIÓN Y SECUENCIACIÓN DE PÁGINAS PDF'
                : '004 / FULL PDF ORGANIZATION & PAGE BUILDER'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <LayoutGrid className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'ORGANIZAR PÁGINAS PDF' : 'ORGANIZE PDF PAGES'}
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
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
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
          {/* BANNER DE RESULTADO Y MÉTRICAS DE REORDENAMIENTO (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <LayoutGrid className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE ORGANIZACIÓN DE PDF' : 'PDF ORGANIZATION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? '¡Documento organizado con éxito!' : 'Document organized successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-[#E8DFCF]/30 px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-[#FAF6EE] font-extrabold text-sm sm:text-base flex items-center gap-1.5 font-sans">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.originalSize}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Totales' : 'Total Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.totalPages} /> {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
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
        /* VISTA DROPZONE VACÍA PREMIUM */
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
            isDragging ? 'border-white bg-zinc-900/50' : 'border-zinc-600 hover:border-white'
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
            <LayoutGrid className="w-12 h-12 text-white" />
          </div>

          {/* BADGE TÉCNICO */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4 relative z-10 pointer-events-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de Organización Vectorial v5.0 • 100% Local'
                : 'Vector Organization Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase relative z-10 pointer-events-none">
            {isEs
              ? 'ORGANIZAR O REORDENAR PÁGINAS DE DOCUMENTOS PDF'
              : 'ORGANIZE OR REORDER PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed relative z-10 pointer-events-none">
            {isEs
              ? 'Une múltiples archivos, reordena páginas arrastrando y soltando, rota hojas o elimina páginas innecesarias al instante, sin subir datos a la nube ni perder calidad vectorial.'
              : 'Merge multiple files, reorder pages by dragging and dropping, rotate sheets, or delete pages instantly, without cloud uploads or vector quality loss.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105 relative z-20 pointer-events-none"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivos PDF' : 'Select PDF Files'}</span>
          </button>

          {/* BENEFICIOS TÉCNICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left relative z-10 pointer-events-none">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Fusión Multi-Documento' : '✓ Multi-Doc Merge'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Importa uno o varios PDFs y combina sus hojas en una sola mesa interactiva.'
                  : 'Import one or more PDFs and combine their sheets into a single interactive deck.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Arrastre y Reorganización' : '✓ Drag & Reorganize'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Cambia el orden, rota 90°, duplica, intercala escaneos dúplex o descarta páginas.'
                  : 'Change sequence, rotate 90°, duplicate, interleave duplex scans, or discard sheets.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Estricta' : '✓ Strict Privacy'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Procesamiento en memoria RAM local sin subir tu información a servidores externos.'
                  : 'Local browser RAM processing without uploading sensitive data to external servers.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON ERGONOMÍA VERTICAL (MESA DE MONTAJE ARRIBA, PANEL DE CONTROL DEBAJO) */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col space-y-6"
        >
          {/* PANEL SUPERIOR: MESA DE MONTAJE Y REORDENAMIENTO A ANCHO COMPLETO */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-[580px] lg:h-[640px] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
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
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed font-mono shadow-sm"
                  title={isEs ? 'Deshacer último cambio (Ctrl+Z)' : 'Undo last action (Ctrl+Z)'}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Deshacer' : 'Undo'}</span>
                </button>

                {/* BOTÓN REHACER (CTRL+Y) */}
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoLength === 0}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed font-mono shadow-sm"
                  title={isEs ? 'Rehacer cambio (Ctrl+Y)' : 'Redo action (Ctrl+Y)'}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Rehacer' : 'Redo'}</span>
                </button>

                <div className="h-4 w-px bg-zinc-700 mx-0.5 hidden sm:block" />

                {/* AÑADIR MÁS ARCHIVOS */}
                <button
                  type="button"
                  onClick={() => addMoreInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer font-mono shadow-sm"
                  title={isEs ? 'Subir y combinar más archivos PDF' : 'Upload & merge more PDFs'}
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>{isEs ? 'Añadir PDFs' : 'Add PDFs'}</span>
                </button>

                {/* AÑADIR PÁGINA EN BLANCO */}
                <button
                  type="button"
                  onClick={handleQuickInsertBlankPage}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-zinc-600 transition-colors cursor-pointer font-mono shadow-sm"
                  title={isEs ? 'Insertar hoja en blanco' : 'Insert blank page'}
                >
                  <FileText className="w-3 h-3 text-amber-300" />
                  <span className="hidden md:inline">{isEs ? '+ Hoja en Blanco' : '+ Blank'}</span>
                </button>

                {/* INVERTIR SECUENCIA RÁPIDA */}
                <button
                  type="button"
                  onClick={handleInvertOrder}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-zinc-600 transition-colors cursor-pointer font-mono shadow-sm"
                  title={isEs ? 'Invertir orden de las páginas' : 'Reverse page order'}
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span className="hidden lg:inline">{isEs ? 'Invertir' : 'Reverse'}</span>
                </button>

                {/* SELECTOR DE ZOOM DE CUADRÍCULA */}
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 text-[10px] font-mono shadow-inner">
                  <button
                    type="button"
                    onClick={() => setGridZoom('sm')}
                    className={`px-2 py-0.5 rounded-lg transition-all font-bold ${
                      gridZoom === 'sm'
                        ? 'bg-white text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Miniaturas pequeñas' : 'Small thumbnails'}
                  >
                    S
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridZoom('md')}
                    className={`px-2 py-0.5 rounded-lg transition-all font-bold ${
                      gridZoom === 'md'
                        ? 'bg-white text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Vista Estándar' : 'Standard View'}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridZoom('lg')}
                    className={`px-2 py-0.5 rounded-lg transition-all font-bold ${
                      gridZoom === 'lg'
                        ? 'bg-white text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={isEs ? 'Miniaturas grandes' : 'Large thumbnails'}
                  >
                    L
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[10px] shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
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
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-white/40 font-mono"
                  />
                  <button
                    onClick={unlockFileWithPassword}
                    className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 font-mono"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* CUADRÍCULA DE MINIATURAS REORDENABLES */}
            <div
              className={`grid gap-3 flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 p-1 ${
                gridZoom === 'sm'
                  ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8'
                  : gridZoom === 'md'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4'
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
                  {/* BADGES DE POSICIÓN Y ARCHIVO */}
                  <div className="w-full flex items-center justify-between mb-1.5 font-mono text-[10px] shrink-0 gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded-md font-bold bg-white text-black text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      {files.length > 1 && files[p.fileIndex] && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-cyan-300 font-mono font-bold truncate max-w-[85px]"
                          title={files[p.fileIndex].name}
                        >
                          {files[p.fileIndex].name.replace(/\.[^/.]+$/, '').slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    {p.isBlank ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        {isEs ? 'Blanca' : 'Blank'}
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400 font-mono truncate shrink-0">
                        Pág {p.originalPageNum} {p.rotation !== 0 && `(${p.rotation}°)`}
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
                    {/* BOTONES FLOTANTES RÁPIDOS EN HOVER ESTILO ILOVEPDF */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        className="p-1.5 bg-black/80 hover:bg-black text-white hover:text-cyan-300 rounded-lg backdrop-blur-sm border border-white/20 transition-all shadow-md cursor-pointer"
                        title={isEs ? 'Rotar 90°' : 'Rotate 90°'}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        className="p-1.5 bg-black/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm border border-white/20 transition-all shadow-md cursor-pointer"
                        title={isEs ? 'Eliminar página' : 'Delete page'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

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

                  {/* BOTONES DE HERRAMIENTAS INFERIORES */}
                  <div className="w-full flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-md transition-colors border border-white/10 cursor-pointer"
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
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-md transition-colors border border-white/10 cursor-pointer"
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
                        className="p-1 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-colors border border-white/10 cursor-pointer"
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
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-md transition-colors border border-white/10 cursor-pointer flex items-center gap-1"
                        title={isEs ? 'Vista previa HD' : 'HD Preview'}
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span className="text-[9px] hidden sm:inline">{isEs ? 'Ver' : 'View'}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* PANEL INFERIOR: PANEL DE CONTROL EN 3 COLUMNAS ERGONÓMICAS */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                  {isEs ? '002 / CONFIGURACIÓN DEL MONTAJE' : '002 / ASSEMBLY CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
                  <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                <span className="text-white font-bold">{pages.length}</span>{' '}
                {isEs ? 'páginas' : 'pages'} •{' '}
                <span className="text-zinc-200 font-bold">
                  {pages.filter((p) => p.rotation !== 0).length}
                </span>{' '}
                {isEs ? 'rotadas' : 'rotated'}
              </div>
            </div>

            {/* CUADRÍCULA DE 3 COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {/* COLUMNA 1: PATRONES DE ORDEN RÁPIDO */}
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-800 font-mono space-y-3 shadow-inner">
                <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider block">
                  {isEs ? 'Patrones de Orden Rápido:' : 'Quick Reorder Patterns:'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleInvertOrder}
                    disabled={pages.length === 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 text-xs"
                    title={isEs ? 'Invertir orden de todas las páginas' : 'Reverse all pages'}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
                    <span>{isEs ? 'Invertir' : 'Reverse'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGroupEvensOdds(true)}
                    disabled={pages.length === 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 text-xs"
                    title={isEs ? 'Agrupar páginas impares primero' : 'Odds first'}
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-white" />
                    <span>{isEs ? 'Impares 1º' : 'Odds 1st'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGroupEvensOdds(false)}
                    disabled={pages.length === 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 text-xs"
                    title={isEs ? 'Agrupar páginas pares primero' : 'Evens first'}
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-white" />
                    <span>{isEs ? 'Pares 1º' : 'Evens 1st'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplexInterleave(true)}
                    disabled={pages.length < 2}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 text-xs"
                    title={
                      isEs
                        ? 'Intercalar escaneo dúplex (impares + pares invertidos)'
                        : 'Interleave duplex scan'
                    }
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-white" />
                    <span>{isEs ? 'Dúplex' : 'Duplex'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRotateAll(90)}
                    disabled={pages.length === 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 text-xs"
                    title={isEs ? 'Girar todo el PDF 90° a la derecha' : 'Rotate all 90°'}
                  >
                    <RotateCw className="w-3.5 h-3.5 text-white" />
                    <span>{isEs ? 'Girar 90°' : 'Rotate 90°'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetInitialOrder}
                    disabled={pages.length === 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 text-xs"
                    title={isEs ? 'Restablecer orden inicial del archivo' : 'Reset original order'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEs ? 'Restablecer' : 'Reset'}</span>
                  </button>
                </div>
              </div>

              {/* COLUMNA 2: CONTROLES DE PRECISIÓN Y NUMERACIÓN */}
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-800 font-mono space-y-3 shadow-inner">
                <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider block">
                  {isEs ? 'Precisión y Salida:' : 'Precision & Output:'}
                </span>

                <div className="flex items-center justify-between gap-1.5 text-xs bg-zinc-900 p-2 rounded-xl border border-zinc-800">
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
                    className="w-11 bg-zinc-950 border border-zinc-700 rounded-lg py-1 text-center text-white font-bold text-xs outline-none focus:border-white/40"
                  />
                  <span className="text-zinc-400 text-[10px] whitespace-nowrap">
                    {isEs ? 'a #' : 'to #'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pages.length || 1}
                    value={moveToPos}
                    onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-11 bg-zinc-950 border border-zinc-700 rounded-lg py-1 text-center text-white font-bold text-xs outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={handleMovePageCommand}
                    disabled={pages.length === 0}
                    className="px-2.5 py-1 bg-white text-black font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? 'Mover' : 'Move'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1.5 text-xs bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 text-[10px] whitespace-nowrap">
                    {isEs ? '+ Blanca en pos' : '+ Blank at'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pages.length + 1 || 1}
                    value={insertBlankPosition}
                    onChange={(e) =>
                      setInsertBlankPosition(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-12 bg-zinc-950 border border-zinc-700 rounded-lg py-1 text-center text-white font-bold text-xs outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={handleInsertBlankPage}
                    disabled={pages.length === 0}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-700 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? 'Insertar' : 'Insert'}
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Reordenado"
                    className="w-full py-1.5 px-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white/40 font-mono"
                  />
                </div>
              </div>

              {/* COLUMNA 3: METADATOS Y NUMERACIÓN */}
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-800 font-mono space-y-2.5 shadow-inner">
                <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider block">
                  {isEs ? 'Numeración y Metadatos:' : 'Numbering & Metadata:'}
                </span>

                <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renumberPages}
                    onChange={(e) => setRenumberPages(e.target.checked)}
                    className="accent-white w-4 h-4 rounded cursor-pointer"
                  />
                  <span>{isEs ? 'Re-numerar pie de página' : 'Re-number footer pages'}</span>
                </label>

                {renumberPages && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <select
                      value={numberingFormat}
                      onChange={(e: any) => setNumberingFormat(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-[10px] text-white outline-none focus:border-white/40 font-mono cursor-pointer"
                    >
                      <option value="page_x_of_y">Pág X de Y</option>
                      <option value="x_slash_y">X / Y</option>
                      <option value="dash_x_dash">— X —</option>
                      <option value="num_only">Solo núm</option>
                    </select>
                    <select
                      value={numberingPosition}
                      onChange={(e: any) => setNumberingPosition(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-[10px] text-white outline-none focus:border-white/40 font-mono cursor-pointer"
                    >
                      <option value="bottom_center">Centro</option>
                      <option value="bottom_right">Derecha</option>
                      <option value="bottom_left">Izquierda</option>
                    </select>
                  </div>
                )}

                <input
                  type="text"
                  placeholder={isEs ? 'Título: Ej. Documento_Ordenado' : 'Title: Ex. Ordered_Doc'}
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-1 px-2.5 text-xs text-white outline-none focus:border-white/40 font-mono"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={isEs ? 'Autor' : 'Author'}
                    value={docAuthor}
                    onChange={(e) => setDocAuthor(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-1 px-2.5 text-xs text-white outline-none focus:border-white/40 font-mono"
                  />
                  <input
                    type="text"
                    placeholder={isEs ? 'Asunto' : 'Subject'}
                    value={docSubject}
                    onChange={(e) => setDocSubject(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-1 px-2.5 text-xs text-white outline-none focus:border-white/40 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* BARRA DE PROGRESO Y BOTÓN PRINCIPAL */}
            <div className="pt-4 border-t border-zinc-800">
              {isProcessing && (
                <div className="mb-3 space-y-1.5 font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                    <span className="truncate max-w-[250px]">{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
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
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-5 h-5 text-black" />
                )}
                <span>
                  {isProcessing
                    ? progressMsg
                    : pages.length === 0
                      ? isEs
                        ? 'Selecciona un archivo PDF'
                        : 'Select a PDF file'
                      : isEs
                        ? 'Organizar y Descargar PDF →'
                        : 'Organize & Download PDF →'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA */}
      <AnimatePresence>
        {previewZoomPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewZoomPage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/20 p-6 rounded-2xl max-w-xl w-full flex flex-col items-center gap-4 relative shadow-2xl font-mono"
            >
              <button
                type="button"
                onClick={() => setPreviewZoomPage(null)}
                className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl cursor-pointer transition-colors"
                title={isEs ? 'Cerrar' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-white font-bold text-sm">
                {isEs
                  ? `Previsualización - Página #${previewZoomPage.originalPageNum}`
                  : `Preview - Page #${previewZoomPage.originalPageNum}`}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
