'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { 
  Merge, FileText, Trash2, Loader2, ArrowUp, ArrowDown, Plus, 
  Sliders, ChevronDown, ChevronUp, Download, UploadCloud, ShieldCheck, 
  ArrowLeft, Sparkles, LayoutGrid, CheckCircle2, Compass, Grid, Layers, Zap, Cpu, Settings2, GripVertical,
  Eye, RotateCw, X, CheckSquare, Square, Lock, Unlock, KeyRound, List, ArrowDownAZ, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

type PageOrientation = 'original' | 'portrait' | 'landscape';
type PageSizeOption = 'original' | 'a4' | 'letter';
type SeparatorOption = 'none' | 'blank' | 'title_page';

import type { WorkerMessageOut } from '../workers/pdf-merge.worker';

export interface PageDetail {
  pageIndex: number;
  rotation: number;
  included: boolean;
  thumbnailUrl?: string;
}

interface FileItem {
  id: string;
  file: File;
  pageCount: number;
  pageRange: string; // e.g. "all" or "1-3, 5"
  thumbnailUrl?: string;
  pagesDetail?: PageDetail[];
  isEncrypted?: boolean;
  needsPassword?: boolean;
  password?: string;
}

interface CompletedMergeResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  filesCount: number;
  totalPages: number;
  rawBlob: Blob;
}

export default function PdfMerger() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [controlPanelHeight, setControlPanelHeight] = useState<number | null>(null);
  const [completedResult, setCompletedResult] = useState<CompletedMergeResult | null>(null);

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

  // Sincronizar altura exacta del panel de vista previa con el panel de control
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && entry.contentRect.height > 0) {
          const fullH = controlPanelRef.current?.offsetHeight || entry.contentRect.height;
          setControlPanelHeight(fullH);
        }
      }
    });
    ro.observe(controlPanelRef.current);
    return () => ro.disconnect();
  }, [files.length]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [passwordsMap, setPasswordsMap] = useState<Record<string, string>>({});

  // METADATA STATE
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  // QUICK SORT ACTIONS
  const sortFilesAz = () => {
    setFiles(prev => [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })));
    toast.success(isEs ? 'Archivos ordenados A-Z' : 'Files sorted A-Z');
  };

  const reverseFilesOrder = () => {
    setFiles(prev => [...prev].reverse());
    toast.success(isEs ? 'Orden de archivos invertido' : 'Files order inverted');
  };

  // TOTAL PAGES CALCULATION
  const totalMergedPages = files.reduce((acc, f) => {
    if (f.pagesDetail && f.pagesDetail.length > 0) {
      return acc + f.pagesDetail.filter(p => p.included).length;
    }
    return acc + (f.pageCount || 1);
  }, 0);

  // DRAG AND DROP REORDERING STATE
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFiles(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDownloadUrl(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.info(isEs ? 'Orden de unión actualizado' : 'Merge order updated');
  };

  // PAGE INSPECTION MODAL STATE
  const [inspectingFileId, setInspectingFileId] = useState<string | null>(null);
  const [isLoadingInspectorPages, setIsLoadingInspectorPages] = useState<boolean>(false);

  const openPageInspector = async (item: FileItem) => {
    setInspectingFileId(item.id);
    if (!item.pagesDetail || item.pagesDetail.length === 0) {
      setIsLoadingInspectorPages(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const buffer = await item.file.arrayBuffer();
        const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;

        const details: PageDetail[] = [];
        for (let i = 1; i <= item.pageCount; i++) {
          let thumbUrl: string | undefined = undefined;
          try {
            const page = await pdfjsDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.25 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
              thumbUrl = canvas.toDataURL();
            }
          } catch (e) {
            console.warn(`Could not render thumbnail for page ${i}`);
          }

          details.push({
            pageIndex: i - 1,
            rotation: 0,
            included: true,
            thumbnailUrl: thumbUrl,
          });
        }

        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, pagesDetail: details } : f));
      } catch (e) {
        toast.error(isEs ? 'Error al cargar páginas del documento' : 'Error loading document pages');
      } finally {
        setIsLoadingInspectorPages(false);
      }
    }
  };

  const togglePageIncluded = (fileId: string, pageIndex: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId || !f.pagesDetail) return f;
      const updatedDetails = f.pagesDetail.map(p => p.pageIndex === pageIndex ? { ...p, included: !p.included } : p);
      return { ...f, pagesDetail: updatedDetails };
    }));
  };

  const rotatePageClockwise = (fileId: string, pageIndex: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId || !f.pagesDetail) return f;
      const updatedDetails = f.pagesDetail.map(p => p.pageIndex === pageIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p);
      return { ...f, pagesDetail: updatedDetails };
    }));
  };

  const toggleAllPages = (fileId: string, includeAll: boolean) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId || !f.pagesDetail) return f;
      const updatedDetails = f.pagesDetail.map(p => ({ ...p, included: includeAll }));
      return { ...f, pagesDetail: updatedDetails };
    }));
  };

  // OPCIONES AVANZADAS DE UNIÓN
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<PageOrientation>('original');
  const [pageSize, setPageSize] = useState<PageSizeOption>('original');
  const [separatorMode, setSeparatorMode] = useState<SeparatorOption>('none');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);
  const [duplexMode, setDuplexMode] = useState<boolean>(false);

  const { globalFiles, globalFile } = useFileStore();
  const loadedFromStoreRef = useRef(false);

  const unlockFileWithPassword = async (id: string, passwordInput: string) => {
    const item = files.find(f => f.id === id);
    if (!item) return;

    try {
      const buffer = await item.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { password: passwordInput, ignoreEncryption: true } as any);
      const count = pdfDoc.getPageCount();

      let thumbUrl: string | undefined = undefined;
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)), password: passwordInput }).promise;
        const page = await pdfjsDoc.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        if (context) {
          await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
          thumbUrl = canvas.toDataURL();
        }
      } catch (e) {
        console.warn("Could not generate thumbnail after unlock:", item.file.name);
      }

      setFiles(prev => prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            isEncrypted: true,
            needsPassword: false,
            password: passwordInput,
            pageCount: count,
            thumbnailUrl: thumbUrl
          };
        }
        return f;
      }));

      toast.success(isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF file unlocked successfully!');
    } catch (err) {
      toast.error(isEs ? 'Contraseña incorrecta. Inténtalo de nuevo.' : 'Incorrect password. Please try again.');
    }
  };

  const processAndAddFileList = async (fileList: File[]) => {
    const selected = fileList.filter(f => f.type === 'application/pdf');
    if (selected.length === 0) return;

    const newItems: FileItem[] = [];
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    for (const f of selected) {
      try {
        const buffer = await f.arrayBuffer();
        
        let isEncrypted = false;
        let needsPassword = false;

        try {
          await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)), password: '' }).promise;
        } catch (err: any) {
          if (err?.name === 'PasswordException' || err?.code === 1) {
            isEncrypted = true;
            needsPassword = true;
          }
        }

        if (needsPassword) {
          newItems.push({
            id: `${f.name}-${Date.now()}-${Math.random()}`,
            file: f,
            pageCount: 1,
            pageRange: 'all',
            isEncrypted: true,
            needsPassword: true
          });
          continue;
        }

        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const count = doc.getPageCount();

        let thumbUrl: string | undefined = undefined;
        try {
          const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
          const page = await pdfjsDoc.getPage(1);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          if (context) {
            await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
            thumbUrl = canvas.toDataURL();
          }
        } catch (e) {
          console.warn("Could not generate thumbnail for file:", f.name);
        }

        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          pageCount: count,
          pageRange: 'all',
          thumbnailUrl: thumbUrl,
          isEncrypted
        });
      } catch {
        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          pageCount: 1,
          pageRange: 'all'
        });
      }
    }

    setFiles(prev => [...prev, ...newItems]);
    setDownloadUrl(null);
  };

  useEffect(() => {
    if (!loadedFromStoreRef.current && files.length === 0) {
      const filesToLoad = globalFiles && globalFiles.length > 0 
        ? globalFiles 
        : (globalFile ? [globalFile] : []);

      if (filesToLoad.length > 0) {
        loadedFromStoreRef.current = true;
        processAndAddFileList(filesToLoad);
      }
    }
  }, [globalFiles, globalFile, files.length]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (selected.length === 0) {
        toast.error(isEs ? 'Por favor, selecciona archivos PDF válidos' : 'Please select valid PDF files');
        return;
      }

      toast.info(isEs ? 'Analizando páginas de los archivos...' : 'Analyzing file pages...');
      await processAndAddFileList(selected);
      toast.success(isEs ? `${selected.length} archivo(s) añadido(s)` : `${selected.length} file(s) added`);
    }
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(item => item.id !== id));
    setDownloadUrl(null);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setDownloadUrl(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    setFiles(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setDownloadUrl(null);
  };

  const updatePageRange = (id: string, range: string) => {
    setFiles(prev => prev.map(item => item.id === id ? { ...item, pageRange: range } : item));
  };

  const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const indices: Set<number> = new Set();
    const parts = rangeStr.split(',');

    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = Math.max(1, parseInt(startStr, 10) || 1);
        const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          indices.add(p - 1);
        }
      }
    });

    return Array.from(indices).sort((a, b) => a - b);
  };

  const executeMerge = async () => {
    if (files.length < 2) {
      toast.error(isEs ? 'Debes agregar al menos 2 archivos PDF para unirlos.' : 'You must add at least 2 PDF files to merge.');
      return;
    }

    const lockedFile = files.find(f => f.needsPassword);
    if (lockedFile) {
      toast.error(isEs ? `Por favor ingresa la contraseña de "${lockedFile.file.name}" antes de unir.` : `Please enter password for "${lockedFile.file.name}" before merging.`);
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressMsg(isEs ? 'Iniciando Web Worker...' : 'Starting Web Worker...');

    try {
      const worker = new Worker(new URL('../workers/pdf-merge.worker.ts', import.meta.url), { type: 'module' });

      const filePayloads = await Promise.all(
        files.map(async (item) => ({
          id: item.id,
          name: item.file.name,
          size: item.file.size,
          arrayBuffer: await item.file.arrayBuffer(),
          pageCount: item.pageCount,
          pageRange: item.pageRange,
          password: item.password,
          pagesDetail: item.pagesDetail ? item.pagesDetail.map(p => ({
            pageIndex: p.pageIndex,
            rotation: p.rotation,
            included: p.included
          })) : undefined
        }))
      );

      const transferableBuffers = filePayloads.map(f => f.arrayBuffer);

      const mergedBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<WorkerMessageOut>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            setProgressPercent(msg.percent);
            setProgressMsg(msg.message);
          } else if (msg.type === 'result') {
            resolve(msg.mergedBytes);
          } else if (msg.type === 'error') {
            reject(new Error(msg.message));
          }
        };

        worker.onerror = (err) => {
          reject(err);
        };

        worker.postMessage(
          {
            action: 'merge',
            files: filePayloads,
            options: {
              orientation,
              pageSize,
              separatorMode,
              addPageNumbers,
              duplexMode,
              metadata: {
                title: docTitle.trim() || undefined,
                author: docAuthor.trim() || undefined,
                subject: docSubject.trim() || undefined,
              }
            },
          },
          transferableBuffers
        );
      });

      worker.terminate();

      const blob = new Blob([mergedBuffer], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const finalName = docTitle.trim() ? `${docTitle.trim().replace(/\s+/g, '_')}.pdf` : 'Documento_Unificado.pdf';
      const sizeFormatted = formatFileSize(blob.size);

      setDownloadUrl(localUrl);
      setCompletedResult({
        downloadUrl: localUrl,
        filename: finalName,
        fileSize: sizeFormatted,
        filesCount: files.length,
        totalPages: totalMergedPages,
        rawBlob: blob,
      });

      setProgressPercent(100);
      toast.success(isEs ? '¡Archivos PDF unidos con éxito!' : 'PDF files merged successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(isEs ? `Error al unir los archivos: ${error?.message || 'Error desconocido'}` : `Error merging files: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleReset = () => {
    setCompletedResult(null);
    setDownloadUrl(null);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
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
      <input type="file" accept=".pdf" multiple className="hidden" ref={fileInputRef} onChange={handleFilesSelected} disabled={isProcessing} />
      <input type="file" accept=".pdf" multiple className="hidden" ref={addMoreInputRef} onChange={handleFilesSelected} disabled={isProcessing} />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div ref={topHeaderRef} className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/organizar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "002 / FUSIÓN Y COMBINACIÓN DE DOCUMENTOS" : "002 / DOCUMENT FUSION & MERGING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Merge className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "UNIR O COMBINAR DOCUMENTOS PDF" : "MERGE PDF DOCUMENTS"}
            </h1>
          </div>
        </div>

        {completedResult && (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-xs font-mono text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">{completedResult.filename}</span>
          </div>
        )}

        {files.length > 0 && !completedResult && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold">{files.length} {isEs ? 'Archivos seleccionados' : 'Files selected'}</span>
            </div>
            <button 
              onClick={handleRemoveAllFiles} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Limpiar todos los archivos" : "Remove all files"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA (ESTILO EXACTO /EDITAR/TEXTO) ── */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE FUSIÓN */}
          <div className="bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Merge className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA FUSIÓN DE DOCUMENTOS' : 'DOCUMENT MERGE RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs ? '¡Documentos combinados con éxito!' : 'Documents merged successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">{isEs ? 'Estado del proceso' : 'Process status'}</div>
                  <div className="text-emerald-400 font-extrabold text-sm sm:text-base flex items-center gap-1">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Documentos Unidos' : 'Merged Documents'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.filesCount} {isEs ? 'Archivos PDF' : 'PDF Files'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Páginas Totales' : 'Total Pages'}</span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.totalPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Modo de Procesamiento' : 'Processing Mode'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Fusión Local Nativa' : 'Native Local Merge'}
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
            onReset={handleReset}
          />
        </motion.div>
      ) : files.length === 0 ? (
        /* VISTA DROPZONE VACÍA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer"
        >
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? "UNIR O COMBINAR DOCUMENTOS PDF" : "MERGE PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Combina dos o más archivos PDF en un único documento de forma 100% confidencial y local." : "Combine two or more PDF files into a single document 100% locally."}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? "Seleccionar Archivos PDF" : "Select PDF Files"}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISTA PREVIA DE ARCHIVOS */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
        >
          {/* LADO IZQUIERDO: REJILLA DE ARCHIVOS Y MINIATURAS DE UNIÓN (ALTURA SIMÉTRICA) */}
          <div 
            className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col lg:h-[760px] lg:max-h-[760px]"
          >
            {/* BARRA SUPERIOR DE HERRAMIENTAS Y ORDENAMIENTO */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-300 font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / ARCHIVOS A UNIR` : `001 / FILES TO MERGE`}</span>
                <span className="bg-white/10 text-white text-[11px] px-2 py-0.5 rounded-full border border-white/10 font-mono">
                  {files.length} {isEs ? 'Archivos' : 'Files'} • ~{totalMergedPages} {isEs ? 'Páginas' : 'Pages'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* BOTONES DE ORDENAMIENTO RÁPIDO */}
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={sortFilesAz}
                    className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                    title={isEs ? "Ordenar alfabéticamente A-Z" : "Sort files A-Z"}
                  >
                    <ArrowDownAZ className="w-3 h-3 text-zinc-400" />
                    <span>A-Z</span>
                  </button>
                  <button
                    type="button"
                    onClick={reverseFilesOrder}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title={isEs ? "Invertir orden de los archivos" : "Invert files order"}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SELECTOR DE VISTA (CUADRÍCULA / LISTA) */}
                <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'}`}
                    title={isEs ? "Vista en Cuadrícula" : "Grid View"}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'}`}
                    title={isEs ? "Vista en Lista Compacta" : "Compact List View"}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => addMoreInputRef.current?.click()}
                  className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  {isEs ? 'Añadir más' : 'Add more'}
                </button>
              </div>
            </div>

            <div className="mb-3 px-3 py-1.5 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-zinc-300" />
                <span>{isEs ? 'Arrastra y suelta los documentos para cambiar el orden de unión' : 'Drag and drop documents to change merge order'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-[10px]">
                <ShieldCheck className="w-3 h-3" /> 100% Local
              </div>
            </div>

            {/* CONTENEDOR CON SCROLL INTERNO DINÁMICO */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3 custom-scrollbar">
              {viewMode === 'grid' ? (
                /* ── MODO 1: CUADRÍCULA DE TARJETAS ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  <AnimatePresence>
                    {files.map((item, index) => {
                      const isDraggingThis = draggedIndex === index;
                      const isDragOverThis = dragOverIndex === index && draggedIndex !== index;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ 
                            opacity: isDraggingThis ? 0.4 : 1, 
                            scale: isDragOverThis ? 1.03 : 1,
                            borderColor: isDragOverThis ? '#3b82f6' : undefined
                          }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable={!isProcessing}
                          onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                          onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                          className={`relative group bg-zinc-950 border ${isDragOverThis ? 'border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/30' : 'border-white/10 hover:border-white/30'} rounded-2xl p-3.5 flex flex-col justify-between transition-all shadow-xl font-mono cursor-grab active:cursor-grabbing`}
                        >
                          {/* ORDEN DE UNIÓN Y ARRASTRE HEADER */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1">
                              <span className="cursor-grab active:cursor-grabbing text-zinc-500 group-hover:text-zinc-300 p-0.5 rounded hover:bg-white/10 transition-colors" title={isEs ? "Arrastra para reordenar" : "Drag to reorder"}>
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <span className="bg-white/10 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-lg border border-white/10">
                                #{index + 1}
                              </span>
                              {item.password && (
                                <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1" title={isEs ? "PDF desbloqueado" : "PDF unlocked"}>
                                  <Unlock className="w-2.5 h-2.5" /> {isEs ? "Desbloqueado" : "Unlocked"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button" onClick={() => moveFile(index, 'up')} disabled={index === 0}
                                className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 rounded-lg border border-white/10 transition-colors cursor-pointer"
                                title={isEs ? "Mover arriba" : "Move up"}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button" onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1}
                                className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 rounded-lg border border-white/10 transition-colors cursor-pointer"
                                title={isEs ? "Mover abajo" : "Move down"}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button" onClick={() => removeFile(item.id)}
                                className="p-1 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors cursor-pointer"
                                title={isEs ? "Eliminar" : "Remove"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* VISTA PREVIA O WIDGET DE CONTRASEÑA */}
                          <div className="w-full aspect-[4/3] bg-zinc-900/80 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden border border-white/5 relative">
                            {item.needsPassword ? (
                              <div className="flex flex-col items-center justify-center p-2 text-center gap-1 bg-amber-950/20 rounded-xl border border-amber-500/30 w-full h-full">
                                <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
                                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">{isEs ? "PDF Protegido" : "Protected"}</span>
                                <div className="flex items-center gap-1 w-full mt-0.5">
                                  <input
                                    type="password"
                                    placeholder={isEs ? "Clave..." : "Password..."}
                                    value={passwordsMap[item.id] || ''}
                                    onChange={(e) => setPasswordsMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') unlockFileWithPassword(item.id, passwordsMap[item.id] || '');
                                    }}
                                    className="w-full bg-zinc-900 border border-amber-500/30 rounded px-1.5 py-0.5 text-white text-[9px] outline-none focus:border-amber-400 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => unlockFileWithPassword(item.id, passwordsMap[item.id] || '')}
                                    className="bg-amber-500 hover:bg-amber-400 text-black px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex-shrink-0 flex items-center"
                                  >
                                    <Unlock className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            ) : item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.file.name} className="w-full h-full object-contain p-1.5 rounded-xl bg-white select-none pointer-events-none" />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-zinc-500 font-mono select-none">
                                <FileText className="w-8 h-8 text-zinc-400" />
                                <span className="text-[9px] font-bold uppercase">{item.pageCount} {isEs ? 'Págs' : 'Pages'}</span>
                              </div>
                            )}
                          </div>

                          {/* NOMBRE Y DETALLES */}
                          <div className="space-y-1.5">
                            <h4 className="text-white font-bold text-xs truncate max-w-full font-sans" title={item.file.name}>{item.file.name}</h4>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400">
                              <span>{formatFileSize(item.file.size)}</span>
                              <span>{item.pageCount} {isEs ? 'páginas' : 'pages'}</span>
                            </div>

                            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => openPageInspector(item)}
                                className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded-lg border border-white/10 text-[9px] font-mono transition-colors cursor-pointer"
                                title={isEs ? "Inspeccionar y organizar páginas individuales" : "Inspect and organize individual pages"}
                              >
                                <Eye className="w-3 h-3 text-zinc-400" />
                                <span>{isEs ? "Páginas" : "Pages"}</span>
                                {item.pagesDetail && (
                                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-bold">
                                    {item.pagesDetail.filter(p => p.included).length}/{item.pagesDetail.length}
                                  </span>
                                )}
                              </button>

                              <div className="flex items-center gap-1">
                                <span className="text-zinc-500 text-[9px]">{isEs ? 'Rango:' : 'Range:'}</span>
                                <input
                                  type="text"
                                  placeholder="all"
                                  value={item.pageRange}
                                  onChange={(e) => updatePageRange(item.id, e.target.value)}
                                  className="w-14 bg-zinc-900 border border-white/10 rounded-lg py-0.5 px-1.5 text-white text-[9px] font-mono outline-none focus:border-white/30"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── MODO 2: LISTA COMPACTA CON FILAS REORDENABLES ── */
                <div className="space-y-2">
                  <AnimatePresence>
                    {files.map((item, index) => {
                      const isDraggingThis = draggedIndex === index;
                      const isDragOverThis = dragOverIndex === index && draggedIndex !== index;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ 
                            opacity: isDraggingThis ? 0.4 : 1, 
                            scale: isDragOverThis ? 1.01 : 1,
                            borderColor: isDragOverThis ? '#3b82f6' : undefined
                          }}
                          exit={{ opacity: 0, y: -5 }}
                          draggable={!isProcessing}
                          onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                          onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                          className={`relative group bg-zinc-950 border ${isDragOverThis ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/10 hover:border-white/30'} rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all shadow-lg font-mono cursor-grab active:cursor-grabbing`}
                        >
                          {/* GRIP + ÍNDICE + MINIATURA + NOMBRE */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-zinc-600 group-hover:text-zinc-300 cursor-grab" title={isEs ? "Arrastrar para reordenar" : "Drag to reorder"}>
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <span className="bg-white/10 text-white font-mono font-bold text-xs px-2 py-1 rounded-lg border border-white/10 flex-shrink-0">
                              #{index + 1}
                            </span>
                            <div className="w-10 h-10 bg-zinc-900 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0">
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt={item.file.name} className="w-full h-full object-contain bg-white" />
                              ) : (
                                <FileText className="w-5 h-5 text-zinc-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white font-bold text-xs truncate max-w-full font-sans" title={item.file.name}>{item.file.name}</h4>
                              <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                                <span>{formatFileSize(item.file.size)}</span>
                                <span>•</span>
                                <span>{item.pageCount} {isEs ? 'páginas' : 'pages'}</span>
                                {item.password && (
                                  <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] px-1 rounded border border-emerald-500/30 flex items-center gap-1">
                                    <Unlock className="w-2.5 h-2.5" /> {isEs ? "Desbloqueado" : "Unlocked"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ACCIONES Y BOTONES DE FILA */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => openPageInspector(item)}
                              className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded-lg border border-white/10 text-[10px] font-mono transition-colors cursor-pointer"
                              title={isEs ? "Inspeccionar páginas" : "Inspect pages"}
                            >
                              <Eye className="w-3 h-3 text-zinc-400" />
                              <span className="hidden sm:inline">{isEs ? "Páginas" : "Pages"}</span>
                            </button>

                            <div className="hidden sm:flex items-center gap-1">
                              <span className="text-zinc-500 text-[9px]">{isEs ? 'Rango:' : 'Range:'}</span>
                              <input
                                type="text"
                                placeholder="all"
                                value={item.pageRange}
                                onChange={(e) => updatePageRange(item.id, e.target.value)}
                                className="w-14 bg-zinc-900 border border-white/10 rounded-lg py-1 px-1.5 text-white text-[10px] font-mono outline-none focus:border-white/30"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button" onClick={() => moveFile(index, 'up')} disabled={index === 0}
                                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 rounded-lg border border-white/10 transition-colors cursor-pointer"
                                title={isEs ? "Mover arriba" : "Move up"}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button" onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1}
                                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 rounded-lg border border-white/10 transition-colors cursor-pointer"
                                title={isEs ? "Mover abajo" : "Move down"}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button" onClick={() => removeFile(item.id)}
                                className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors cursor-pointer"
                                title={isEs ? "Eliminar" : "Remove"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL DE UNIÓN */}
          <div ref={controlPanelRef} className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6 lg:h-[760px] lg:max-h-[760px]">
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-4 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* 1. SEPARADORES ENTRE DOCUMENTOS */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Separadores entre Documentos" : "Document Separators"}</label>
                <select
                  value={separatorMode} onChange={(e) => setSeparatorMode(e.target.value as SeparatorOption)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-white/30"
                >
                  <option value="none">{isEs ? "Sin separadores (Directo)" : "None (Direct)"}</option>
                  <option value="blank">{isEs ? "Insertar página en blanco" : "Insert blank page"}</option>
                  <option value="title_page">{isEs ? "Insertar carátula con nombre" : "Insert title page"}</option>
                </select>
              </div>

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-4 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas" : "Advanced Options"}</span>
                </div>

                {/* ORIENTACIÓN Y TAMAÑO DE PAPEL */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Orientación:" : "Orientation:"}</label>
                    <select
                      value={orientation} onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                      className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-white outline-none cursor-pointer focus:border-white/30"
                    >
                      <option value="original">{isEs ? "Original" : "Original"}</option>
                      <option value="portrait">{isEs ? "Vertical" : "Portrait"}</option>
                      <option value="landscape">{isEs ? "Horizontal" : "Landscape"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Papel:" : "Paper Size:"}</label>
                    <select
                      value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                      className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-white outline-none cursor-pointer focus:border-white/30"
                    >
                      <option value="original">{isEs ? "Original" : "Original"}</option>
                      <option value="a4">A4</option>
                      <option value="letter">Carta</option>
                    </select>
                  </div>
                </div>

                {/* METADATOS Y NUMERACIÓN CONTINUA */}
                <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "AJUSTES DE NUMERACIÓN Y PÁGINAS" : "NUMBERING & PAGE SETTINGS"}</label>
                  
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" checked={addPageNumbers} onChange={(e) => setAddPageNumbers(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>{isEs ? "Numeración continua (Página N / M)" : "Continuous numbering (Page N / M)"}</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" checked={duplexMode} onChange={(e) => setDuplexMode(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>{isEs ? "Modo Dúplex (Inicio en página impar)" : "Duplex mode (Start on odd page)"}</span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">{isEs ? "METADATOS DEL PDF RESULTANTE" : "OUTPUT PDF METADATA"}</label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Título:" : "Title:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Documento_Unificado_2026" : "Ex: Unified_Document_2026"}
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Autor / Organización:" : "Author / Organization:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Mi Empresa S.A." : "Ex: Company Inc."}
                      value={docAuthor}
                      onChange={(e) => setDocAuthor(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Asunto / Descripción:" : "Subject / Description:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Fusión de expedientes corporativos" : "Ex: Merged corporate records"}
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
                    <div style={{ width: `${progressPercent}%` }} className="h-full bg-white transition-all duration-300" />
                  </div>
                </div>
              )}

              <button 
                onClick={executeMerge} 
                disabled={isProcessing || files.length < 2} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (files.length < 2 ? (isEs ? 'Selecciona 2 o más archivos' : 'Select 2 or more files') : (isEs ? `Unir ${files.length} Archivos PDF →` : `Merge ${files.length} PDF Files →`))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
      {/* MODAL DE INSPECCIÓN Y ORGANIZACIÓN DE PÁGINAS */}
      <AnimatePresence>
        {inspectingFileId && (() => {
          const activeItem = files.find(f => f.id === inspectingFileId);
          if (!activeItem) return null;

          const details = activeItem.pagesDetail || [];
          const includedCount = details.filter(p => p.included).length;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono"
              onClick={() => setInspectingFileId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[85vh] bg-[#09090b] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
              >
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white truncate max-w-md font-sans">{activeItem.file.name}</h3>
                      <p className="text-xs text-zinc-400">
                        {isEs ? `Organizando páginas (${includedCount} de ${activeItem.pageCount} incluidas)` : `Organizing pages (${includedCount} of ${activeItem.pageCount} included)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAllPages(activeItem.id, true)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
                    >
                      {isEs ? "Incluir todas" : "Include all"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllPages(activeItem.id, false)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
                    >
                      {isEs ? "Excluir todas" : "Exclude all"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectingFileId(null)}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* MODAL BODY: PAGE THUMBNAILS GRID */}
                <div className="flex-1 overflow-y-auto py-6 my-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-1">
                  {isLoadingInspectorPages ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                      <span className="text-xs font-bold">{isEs ? 'Generando vista previa de páginas...' : 'Generating page preview...'}</span>
                    </div>
                  ) : (
                    details.map((page) => (
                      <div
                        key={page.pageIndex}
                        className={`relative bg-zinc-950 border ${page.included ? 'border-white/15' : 'border-red-500/30 opacity-40'} rounded-2xl p-3 flex flex-col justify-between transition-all`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-md">
                            #{page.pageIndex + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => rotatePageClockwise(activeItem.id, page.pageIndex)}
                              className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md border border-white/10 transition-colors cursor-pointer"
                              title={isEs ? "Rotar 90°" : "Rotate 90°"}
                            >
                              <RotateCw className="w-3 h-3 text-white" />
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePageIncluded(activeItem.id, page.pageIndex)}
                              className={`p-1 ${page.included ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} rounded-md border transition-colors cursor-pointer`}
                              title={page.included ? (isEs ? "Excluir página" : "Exclude page") : (isEs ? "Incluir página" : "Include page")}
                            >
                              {page.included ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="w-full aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 mb-2 relative">
                          {page.thumbnailUrl ? (
                            <img
                              src={page.thumbnailUrl}
                              alt={`Página ${page.pageIndex + 1}`}
                              style={{ transform: `rotate(${page.rotation}deg)` }}
                              className="w-full h-full object-contain p-1 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-bold">{page.pageIndex + 1}</span>
                          )}

                          {page.rotation > 0 && (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                              {page.rotation}°
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className={page.included ? 'text-emerald-400 font-bold' : 'text-red-400 line-through'}>
                            {page.included ? (isEs ? 'Incluida' : 'Included') : (isEs ? 'Excluida' : 'Excluded')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* MODAL FOOTER */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {isEs ? `${includedCount} páginas seleccionadas para la fusión` : `${includedCount} pages selected for merging`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectingFileId(null)}
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer"
                  >
                    {isEs ? "Aplicar y Cerrar" : "Apply & Close"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}