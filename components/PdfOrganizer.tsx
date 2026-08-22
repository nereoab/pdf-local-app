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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedResult, setCompletedResult] = useState<CompletedReorderResult | null>(null);

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
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const newFilesList = [...files, ...selectedFiles];
        const newPages: PageItem[] = [...pages];

        for (let i = 0; i < selectedFiles.length; i++) {
          const currentFile = selectedFiles[i];
          const fileIndex = files.length + i;

          const arrayBuffer = await currentFile.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer.slice(0));
          const loadingTask = pdfjsLib.getDocument({ data: uint8, password: pass });
          const pdf = await loadingTask.promise;
          const pageCount = pdf.numPages;

          for (let p = 1; p <= pageCount; p++) {
            setProgressMsg(
              isEs
                ? `Renderizando ${currentFile.name} (pág ${p}/${pageCount})...`
                : `Rendering ${currentFile.name} (page ${p}/${pageCount})...`,
            );
            setProgressPercent(10 + Math.floor((p / pageCount) * 80));
            if (p % 4 === 0) await new Promise((r) => setTimeout(r, 5));

            let thumbUrl: string | null = null;
            try {
              const page = await pdf.getPage(p);
              const viewport = page.getViewport({ scale: 0.5 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                thumbUrl = canvas.toDataURL('image/jpeg', 0.6);
              }
            } catch (renderErr) {
              console.warn(`Could not render thumbnail for page ${p}:`, renderErr);
            }

            newPages.push({
              id: `${fileIndex}-${p}-${Date.now()}-${Math.random()}`,
              fileIndex,
              originalPageNum: p,
              rotation: 0,
              isBlank: false,
              thumbnailUrl: thumbUrl,
            });
          }
        }

        setFiles(newFilesList);
        setPages(newPages);
        setGlobalFiles(newFilesList);
        setIsEncrypted(false);
        setIsUnlocked(true);

        if (selectedFiles[0]) {
          setFilePrefix(selectedFiles[0].name.replace(/\.[^/.]+$/, '') + '_Reordenado');
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
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rotation: (updated[index].rotation + 90) % 360 };
      return updated;
    });
    setDownloadUrl(null);
  };

  const handleDuplicatePage = (index: number) => {
    setPages((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const clone: PageItem = {
        ...target,
        id: `${target.id}-copy-${Math.random()}`,
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
    setPages((prev) => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
  };

  // PATRONES DE REORDENAMIENTO EN 1-CLIC (PANEL DE CONTROL)
  const handleInvertOrder = () => {
    setPages((prev) => [...prev].reverse());
    setDownloadUrl(null);
    toast.success(isEs ? 'Secuencia de páginas invertida' : 'Page sequence reversed');
  };

  const handleGroupEvensOdds = (oddsFirst = true) => {
    setPages((prev) => {
      const odds = prev.filter((_, i) => (i + 1) % 2 !== 0);
      const evens = prev.filter((_, i) => (i + 1) % 2 === 0);
      return oddsFirst ? [...odds, ...evens] : [...evens, ...odds];
    });
    setDownloadUrl(null);
    toast.success(isEs ? 'Páginas agrupadas por paridad' : 'Pages grouped by parity');
  };

  const handleRotateAll = (degreesToAdd: number) => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + degreesToAdd) % 360 })));
    setDownloadUrl(null);
    toast.success(
      isEs ? `Todas las páginas rotadas ${degreesToAdd}°` : `All pages rotated ${degreesToAdd}°`,
    );
  };

  const handleResetRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
    setDownloadUrl(null);
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
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/organizar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
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
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-xs font-mono text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {completedResult.filename}
            </span>
          </div>
        ) : pages.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {files.length} {isEs ? 'archivo(s)' : 'file(s)'} ({pages.length}{' '}
                {isEs ? 'páginas' : 'pages'})
              </span>
            </div>
            <button
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
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
          <div className="bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <LayoutGrid className="w-6 h-6" />
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
              <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-emerald-400 font-extrabold text-sm sm:text-base flex items-center gap-1">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.originalSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Totales' : 'Total Pages'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Modo de Procesamiento' : 'Processing Mode'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Reordenamiento Local Nativo' : 'Native Local Reorder'}
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
          className={`w-full border rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer ${
            isDragging
              ? 'border-white bg-zinc-900/60 scale-[1.01]'
              : 'border-white/10 hover:border-white/30'
          }`}
        >
          <div
            className={`p-6 rounded-2xl border transition-colors mb-6 ${
              isDragging
                ? 'bg-white/10 border-white'
                : 'bg-zinc-900 border-white/10 group-hover:border-white/30'
            }`}
          >
            <UploadCloud
              className={`w-12 h-12 ${isDragging ? 'text-emerald-400 animate-bounce' : 'text-white'}`}
            />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? 'ORDENAR Y REORGANIZAR PÁGINAS PDF' : 'REORDER PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Cambia el orden, rota, duplica e intercala hojas de tu PDF de forma 100% confidencial y local.'
              : 'Reorder, rotate, duplicate, and interleave pages from your PDF 100% locally.'}
          </p>
          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
          {/* LADO IZQUIERDO: MESA DE MONTAJE Y REORDENAMIENTO EN CUADRÍCULA 4x4 */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col lg:h-[760px] lg:max-h-[760px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / MESA DE MONTAJE Y REORDENAMIENTO (${pages.length} HOJAS)`
                    : `001 / WORKSPACE & REORDERING (${pages.length} SHEETS)`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addMoreInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer font-mono"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  {isEs ? 'Añadir más' : 'Add more'}
                </button>
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
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-[11px] text-zinc-300 mb-4">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                {isEs
                  ? 'Arrastra cualquier tarjeta para cambiar su posición en vivo'
                  : 'Drag any card to change position in real time'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {pages.length} {isEs ? 'tarjetas' : 'cards'}
              </span>
            </div>

            {/* GRID REORDENABLE DRAG & DROP EN CUADRÍCULA ESPACIOSA Y PROPORCIONAL */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 p-1">
              {pages.map((p, idx) => (
                <motion.div
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  className={`relative w-full h-[280px] min-h-[280px] rounded-2xl border p-3 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all duration-200 group overflow-hidden bg-zinc-950 hover:bg-zinc-900 ${
                    dragOverIndex === idx
                      ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* BADGES DE POSICIÓN */}
                  <div className="w-full flex items-center justify-between mb-2 font-mono text-[10px] shrink-0">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-white text-black">
                      #{idx + 1}
                    </span>
                    {p.isBlank ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                        {isEs ? 'Blanca' : 'Blank'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Orig: {p.originalPageNum} {p.rotation !== 0 && `(${p.rotation}°)`}
                      </span>
                    )}
                  </div>

                  {/* TARJETA DE CANVAS / MINIATURA PROPORCIONAL */}
                  <div
                    className="w-full flex-1 min-h-0 bg-zinc-900/90 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner border border-white/5 p-2"
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
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* BOTONES DE HERRAMIENTAS INDIVIDUALES */}
                  <div className="w-full flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
                        title={isEs ? 'Rotar 90°' : 'Rotate 90°'}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePage(idx);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
                        title={isEs ? 'Duplicar página' : 'Duplicate page'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors border border-white/10"
                        title={isEs ? 'Eliminar página' : 'Delete page'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!p.isBlank && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewZoomPage(p);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
                        title={isEs ? 'Zoom' : 'Zoom'}
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6 lg:h-[760px] lg:max-h-[760px]">
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-4 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* PATRONES DE ORDEN AUTOMÁTICO EN 1-CLIC */}
              <div className="space-y-3 font-mono text-xs mb-5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">
                  {isEs ? 'Patrones de Orden Automático:' : 'Automated Patterns:'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleInvertOrder}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Invertir Orden' : 'Reverse Order'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGroupEvensOdds(true)}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Impares Primero' : 'Odds First'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotateAll(90)}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar Todo 90°' : 'Rotate All 90°'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetRotations}
                    disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Reset Rotación' : 'Reset Rotation'}</span>
                  </button>
                </div>

                {/* CONTROLES DE PRECISIÓN DE POSICIÓN */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2 mt-3">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'MOVER PÁGINA DE PRECISIÓN' : 'PRECISION MOVE PAGE'}
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[10px]">
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
                      className="w-12 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                    />
                    <span className="text-zinc-400 text-[10px]">
                      {isEs ? 'a pos #' : 'to pos #'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={pages.length || 1}
                      value={moveToPos}
                      onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
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
                </div>

                {/* INSERTAR HOJA EN BLANCO */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[10px]">
                      {isEs ? 'Insertar blanca en pos #' : 'Insert blank at pos #'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={pages.length + 1 || 1}
                      value={insertBlankPosition}
                      onChange={(e) =>
                        setInsertBlankPosition(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-12 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertBlankPage}
                    disabled={pages.length === 0}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? '+ Insertar' : '+ Insert'}
                  </button>
                </div>
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-3 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Sliders className="w-4 h-4 text-white" />
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
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'AJUSTES DE NUMERACIÓN' : 'NUMBERING SETTINGS'}
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={renumberPages}
                      onChange={(e) => setRenumberPages(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>
                      {isEs
                        ? 'Re-numerar páginas en pie de página (Página N / M)'
                        : 'Re-number footer pages (Page N / M)'}
                    </span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">
                    {isEs ? 'METADATOS DEL PDF REORDENADO' : 'REORDERED PDF METADATA'}
                  </label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isEs ? 'Título:' : 'Title:'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isEs ? 'Ej: Documento_Ordenado_2026' : 'Ex: Reordered_Document_2026'
                      }
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isEs ? 'Autor / Organización:' : 'Author / Organization:'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEs ? 'Ej: Mi Empresa S.A.' : 'Ex: Company Inc.'}
                      value={docAuthor}
                      onChange={(e) => setDocAuthor(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isEs ? 'Asunto / Descripción:' : 'Subject / Description:'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEs ? 'Ej: Reordenamiento de páginas' : 'Ex: Page reordering'}
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
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
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
