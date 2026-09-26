'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Scissors,
  FileText,
  X,
  Loader2,
  Sliders,
  Plus,
  Check,
  Trash2,
  Layers3,
  LayoutGrid,
  Maximize2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Split,
  FileArchive,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SplitWorkerMessageIn, SplitWorkerMessageOut } from '@/workers/pdf-split.worker';
import FoliarSuccessView from '@/components/FoliarSuccessView';
import { useUIStore } from '@/store/useUIStore';

type MainTab = 'rango' | 'paginas' | 'tamano';
type RangeSubMode = 'personalizado' | 'fijo' | 'inteligente';
type GridDensity = 'compact' | 'standard' | 'large';

interface RangeItem {
  id: string;
  from: number;
  to: number;
}

interface PageThumbnail {
  pageIndex: number;
  dataUrl: string;
  included: boolean;
}

interface CompletedSplitResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  createdCount: number;
  isZip: boolean;
  rawBlob: Blob;
  originalSize: string;
  totalPages: number;
}

const RANGE_COLORS = [
  {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/40',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300',
  },
  {
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    border: 'border-teal-500/40',
    badge: 'bg-teal-500/20 text-teal-300',
  },
];

export default function PdfSplitter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [totalPages, setTotalPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedResult, setCompletedResult] = useState<CompletedSplitResult | null>(null);
  const [isDropzoneDragging, setIsDropzoneDragging] = useState<boolean>(false);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // PAGE THUMBNAILS & SELECTION
  const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // VISTA PREVIA AMPLIADA (MODAL DE ZOOM)
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  // DENSIDAD DE CUADRÍCULA
  const [gridDensity, setGridDensity] = useState<GridDensity>('standard');

  // TABS Y MODOS DE RANGO
  const [mainTab, setMainTab] = useState<MainTab>('rango');
  const [rangeSubMode, setRangeSubMode] = useState<RangeSubMode>('personalizado');
  const [ranges, setRanges] = useState<RangeItem[]>([{ id: '1', from: 1, to: 1 }]);
  const [mergeAllRanges, setMergeAllRanges] = useState<boolean>(false);

  // OPCIONES AVANZADAS Y METADATOS
  const [extractMode, setExtractMode] = useState<'all' | 'specific' | 'even' | 'odd'>('all');
  const [specificPagesInput, setSpecificPagesInput] = useState<string>('1, 2, 3');
  const [chunkPageCount, setChunkPageCount] = useState<number>(5);
  const [createZip, setCreateZip] = useState<boolean>(true);
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Dividido');
  const [addPageFooterNumbering, setAddPageFooterNumbering] = useState<boolean>(false);

  // METADATOS PERSONALIZADOS (PLEGABLE)
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

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

  // Teclado para modal de zoom (Escape, flechas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomIndex === null) return;
      if (e.key === 'Escape') setZoomIndex(null);
      if (e.key === 'ArrowLeft' && zoomIndex > 0) setZoomIndex(zoomIndex - 1);
      if (e.key === 'ArrowRight' && zoomIndex < pageThumbnails.length - 1)
        setZoomIndex(zoomIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIndex, pageThumbnails.length]);

  // RENDERIZAR MINIATURAS REALES CON PDFJS
  const renderThumbnails = useCallback(
    async (pdfBuffer: ArrayBuffer, pass?: string) => {
      setIsLoadingThumbnails(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(pdfBuffer),
          password: pass,
        });
        const pdfjsDoc = await loadingTask.promise;
        const count = pdfjsDoc.numPages;

        setTotalPages(count);
        const thumbs: PageThumbnail[] = [];

        // Renderizar primeras 24 páginas en miniatura para alta respuesta
        const initialRenderLimit = Math.min(count, 24);
        for (let i = 1; i <= initialRenderLimit; i++) {
          const page = await pdfjsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.55 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport, canvas } as any).promise;
            thumbs.push({
              pageIndex: i - 1,
              dataUrl: canvas.toDataURL('image/jpeg', 0.8),
              included: true,
            });
          }
        }

        // Rellenar placeholders para el resto
        for (let i = initialRenderLimit + 1; i <= count; i++) {
          thumbs.push({
            pageIndex: i - 1,
            dataUrl: '',
            included: true,
          });
        }

        setPageThumbnails(thumbs);
        setIsEncrypted(false);
        setIsUnlocked(true);

        // Renderizar segundo plano para páginas restantes si count > initialRenderLimit
        if (count > initialRenderLimit) {
          (async () => {
            for (let i = initialRenderLimit + 1; i <= count; i++) {
              try {
                const page = await pdfjsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.55 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                if (context) {
                  await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                  const url = canvas.toDataURL('image/jpeg', 0.8);
                  setPageThumbnails((prev) =>
                    prev.map((p) => (p.pageIndex === i - 1 ? { ...p, dataUrl: url } : p)),
                  );
                }
              } catch {
                // skip non-critical bg render
              }
            }
          })();
        }
      } catch (err: any) {
        if (err?.name === 'PasswordException' || err?.code === 1) {
          setIsEncrypted(true);
          setIsUnlocked(false);
          toast.warning(
            isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open',
          );
        } else {
          console.error(err);
          toast.error(
            isEs ? 'Error al procesar las páginas del PDF' : 'Error processing PDF pages',
          );
        }
      } finally {
        setIsLoadingThumbnails(false);
      }
    },
    [isEs],
  );

  // INSPECCIONAR PDF AL CARGAR ARCHIVO
  const inspectPdf = useCallback(
    async (selectedFile: File, pass?: string) => {
      try {
        const buffer = await selectedFile.arrayBuffer();
        setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, ''));

        try {
          const pdfDoc = await PDFDocument.load(buffer, {
            password: pass,
            ignoreEncryption: true,
          } as any);
          const count = pdfDoc.getPageCount();
          setTotalPages(count);
          setRanges([{ id: '1', from: 1, to: count }]);
        } catch {
          // Encriptado
        }

        await renderThumbnails(buffer, pass);
      } catch {
        toast.error(isEs ? 'Error al leer la estructura del PDF' : 'Error reading PDF structure');
      }
    },
    [isEs, renderThumbnails],
  );

  useEffect(() => {
    if (file && totalPages === 0 && !isEncrypted) {
      queueMicrotask(() => {
        inspectPdf(file);
      });
    }
  }, [file, totalPages, isEncrypted, inspectPdf]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
        return;
      }
      setFile(selected);
      setGlobalFile(selected);
      setIsEncrypted(false);
      setIsUnlocked(false);
      setUnlockedPassword(undefined);
      setPasswordInput('');
      setTotalPages(0);
      inspectPdf(selected);
      toast.success(isEs ? 'Archivo cargado con éxito' : 'File loaded successfully');
    }
    e.target.value = '';
  };

  const handleDropzoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneDragging(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneDragging(false);
  };

  const handleDropzoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type !== 'application/pdf' && !dropped.name.toLowerCase().endsWith('.pdf')) {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
        return;
      }
      setFile(dropped);
      setGlobalFile(dropped);
      setIsEncrypted(false);
      setIsUnlocked(false);
      setUnlockedPassword(undefined);
      setPasswordInput('');
      setTotalPages(0);
      inspectPdf(dropped);
      toast.success(isEs ? 'Archivo cargado con éxito' : 'File loaded successfully');
    }
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      const buffer = await file.arrayBuffer();
      await renderThumbnails(buffer, passwordInput);
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
    setFile(null);
    setTotalPages(0);
    setCompletedResult(null);
    setGlobalFile(null);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
    setPageThumbnails([]);
    setZoomIndex(null);
    setRanges([{ id: '1', from: 1, to: 1 }]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setGlobalFile, setHeaderHidden]);

  // TOGGLE INCLUSIÓN DE PÁGINA
  const togglePageIncluded = (index: number) => {
    setPageThumbnails((prev) =>
      prev.map((p) => (p.pageIndex === index ? { ...p, included: !p.included } : p)),
    );
  };

  // ACCIONES MASIVAS DE SELECCIÓN
  const selectAllPages = () => {
    setPageThumbnails((prev) => prev.map((p) => ({ ...p, included: true })));
    toast.success(isEs ? 'Todas las páginas seleccionadas' : 'All pages selected');
  };

  const selectEvenPages = () => {
    setPageThumbnails((prev) => prev.map((p, idx) => ({ ...p, included: (idx + 1) % 2 === 0 })));
    toast.success(isEs ? 'Páginas pares seleccionadas' : 'Even pages selected');
  };

  const selectOddPages = () => {
    setPageThumbnails((prev) => prev.map((p, idx) => ({ ...p, included: (idx + 1) % 2 !== 0 })));
    toast.success(isEs ? 'Páginas impares seleccionadas' : 'Odd pages selected');
  };

  const invertSelection = () => {
    setPageThumbnails((prev) => prev.map((p) => ({ ...p, included: !p.included })));
    toast.success(isEs ? 'Selección invertida' : 'Selection inverted');
  };

  const clearSelection = () => {
    setPageThumbnails((prev) => prev.map((p) => ({ ...p, included: false })));
    toast.success(isEs ? 'Selección limpiada' : 'Selection cleared');
  };

  // SINCRONIZACIÓN DE MODO DE PÁGINAS RÁPIDAS
  const handleExtractModeChange = (mode: 'all' | 'specific' | 'even' | 'odd') => {
    setExtractMode(mode);
    if (mode === 'all') {
      setPageThumbnails((prev) => prev.map((p) => ({ ...p, included: true })));
    } else if (mode === 'even') {
      setPageThumbnails((prev) => prev.map((p, idx) => ({ ...p, included: (idx + 1) % 2 === 0 })));
    } else if (mode === 'odd') {
      setPageThumbnails((prev) => prev.map((p, idx) => ({ ...p, included: (idx + 1) % 2 !== 0 })));
    } else if (mode === 'specific') {
      const indices = new Set(
        specificPagesInput
          .split(',')
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((n) => !isNaN(n) && n >= 0 && n < totalPages),
      );
      setPageThumbnails((prev) => prev.map((p) => ({ ...p, included: indices.has(p.pageIndex) })));
    }
  };

  const handleSpecificPagesInputChange = (val: string) => {
    setSpecificPagesInput(val);
    if (extractMode === 'specific') {
      const indices = new Set(
        val
          .split(',')
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((n) => !isNaN(n) && n >= 0 && n < totalPages),
      );
      setPageThumbnails((prev) => prev.map((p) => ({ ...p, included: indices.has(p.pageIndex) })));
    }
  };

  // MANEJO DE RANGOS
  const handleAddRange = () => {
    if (totalPages === 0) return;
    const lastRange = ranges[ranges.length - 1];
    const newFrom = lastRange ? Math.min(lastRange.to + 1, totalPages) : 1;
    const newTo = totalPages;
    setRanges((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, from: newFrom, to: newTo },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length === 1) return;
    setRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: 'from' | 'to', value: number) => {
    const val = Math.max(1, Math.min(totalPages || 1, value));
    setRanges((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: val };
          if (field === 'from' && updated.from > updated.to) updated.to = updated.from;
          if (field === 'to' && updated.to < updated.from) updated.from = updated.to;
          return updated;
        }
        return r;
      }),
    );
  };

  const handleSplitInHalf = () => {
    if (totalPages <= 1) return;
    const mid = Math.floor(totalPages / 2);
    setRanges([
      { id: `range-1`, from: 1, to: mid },
      { id: `range-2`, from: mid + 1, to: totalPages },
    ]);
    toast.success(
      isEs
        ? `Dividido en 2 mitades (Págs 1-${mid} y ${mid + 1}-${totalPages})`
        : `Split into 2 halves`,
    );
  };

  const handleResetRanges = () => {
    setRanges([{ id: '1', from: 1, to: totalPages || 1 }]);
    toast.success(isEs ? 'Rangos restablecidos a documento completo' : 'Ranges reset');
  };

  // IDENTIFICACIÓN DE RANGO POR PÁGINA (PARA BADGES VISUALES)
  const getPageRangeInfo = useCallback(
    (pageIndex: number) => {
      const pageNum = pageIndex + 1;
      if (mainTab !== 'rango' || rangeSubMode !== 'personalizado') return null;

      const matchedRangeIndex = ranges.findIndex((r) => pageNum >= r.from && pageNum <= r.to);
      if (matchedRangeIndex === -1) return null;

      const color = RANGE_COLORS[matchedRangeIndex % RANGE_COLORS.length];
      return {
        label: `R${matchedRangeIndex + 1}`,
        rangeNumber: matchedRangeIndex + 1,
        color,
      };
    },
    [mainTab, rangeSubMode, ranges],
  );

  // CONTADOR DE PÁGINAS SELECCIONADAS
  const selectedCount = useMemo(() => {
    return pageThumbnails.filter((p) => p.included).length;
  }, [pageThumbnails]);

  // CÁLCULO DE RESUMEN EN TIEMPO REAL (LIVE SPLIT SUMMARY)
  const liveSummary = useMemo(() => {
    if (totalPages === 0) return null;

    let partsCount = 0;
    let includedCount = 0;

    if (mainTab === 'rango') {
      if (rangeSubMode === 'personalizado') {
        if (mergeAllRanges) {
          partsCount = 1;
          const includedIndices = new Set<number>();
          ranges.forEach((r) => {
            for (let i = r.from - 1; i <= r.to - 1; i++) {
              if (pageThumbnails[i]?.included) includedIndices.add(i);
            }
          });
          includedCount = includedIndices.size;
        } else {
          partsCount = ranges.length;
          const includedIndices = new Set<number>();
          ranges.forEach((r) => {
            for (let i = r.from - 1; i <= r.to - 1; i++) {
              if (pageThumbnails[i]?.included) includedIndices.add(i);
            }
          });
          includedCount = includedIndices.size;
        }
      } else if (rangeSubMode === 'fijo') {
        const chunkSize = Math.max(1, chunkPageCount);
        partsCount = Math.ceil(totalPages / chunkSize);
        includedCount = selectedCount;
      } else {
        partsCount = totalPages;
        includedCount = selectedCount;
      }
    } else if (mainTab === 'paginas') {
      if (extractMode === 'all') {
        partsCount = selectedCount;
        includedCount = selectedCount;
      } else if (extractMode === 'even') {
        partsCount = 1;
        includedCount = pageThumbnails.filter((p, i) => (i + 1) % 2 === 0 && p.included).length;
      } else if (extractMode === 'odd') {
        partsCount = 1;
        includedCount = pageThumbnails.filter((p, i) => (i + 1) % 2 !== 0 && p.included).length;
      } else {
        partsCount = 1;
        const indices = new Set(
          specificPagesInput
            .split(',')
            .map((s) => parseInt(s.trim(), 10) - 1)
            .filter((n) => !isNaN(n) && n >= 0 && n < totalPages),
        );
        includedCount = Array.from(indices).filter((i) => pageThumbnails[i]?.included).length;
      }
    } else {
      const size = Math.max(1, chunkPageCount);
      partsCount = Math.ceil(totalPages / size);
      includedCount = selectedCount;
    }

    const willBeZip = createZip && partsCount > 1 && !mergeAllRanges;

    return {
      partsCount: Math.max(1, partsCount),
      includedCount,
      willBeZip,
      outputDescription: willBeZip
        ? `${partsCount} archivos PDF en archivo .ZIP`
        : partsCount === 1
          ? `1 archivo PDF (${includedCount} páginas)`
          : `${partsCount} archivos PDF individuales`,
    };
  }, [
    totalPages,
    mainTab,
    rangeSubMode,
    mergeAllRanges,
    ranges,
    pageThumbnails,
    chunkPageCount,
    selectedCount,
    extractMode,
    specificPagesInput,
    createZip,
  ]);

  // EXECUTE SPLIT WITH WEB WORKER
  const executeSplit = async () => {
    if (!file || totalPages === 0) {
      toast.error(isEs ? 'Por favor carga un archivo PDF' : 'Please upload a PDF file');
      return;
    }

    if (isEncrypted && !isUnlocked) {
      toast.error(
        isEs
          ? 'Desbloquea el PDF con su contraseña antes de dividir'
          : 'Unlock PDF with password before splitting',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando Web Worker acelerado...' : 'Starting Web Worker...');

    try {
      const buffer = await file.arrayBuffer();

      let pageGroups: number[][] = [];

      if (mainTab === 'rango') {
        if (rangeSubMode === 'personalizado') {
          pageGroups = ranges
            .map((r) => {
              const indices: number[] = [];
              const start = Math.max(0, r.from - 1);
              const end = Math.min(totalPages - 1, r.to - 1);
              for (let i = start; i <= end; i++) {
                if (pageThumbnails[i] ? pageThumbnails[i].included : true) {
                  indices.push(i);
                }
              }
              return indices;
            })
            .filter((g) => g.length > 0);
        } else if (rangeSubMode === 'fijo') {
          const chunkSize = Math.max(1, chunkPageCount);
          for (let i = 0; i < totalPages; i += chunkSize) {
            const chunk: number[] = [];
            for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) {
              if (pageThumbnails[j] ? pageThumbnails[j].included : true) chunk.push(j);
            }
            if (chunk.length > 0) pageGroups.push(chunk);
          }
        } else {
          // Inteligente (divide cada página)
          for (let i = 0; i < totalPages; i++) {
            if (pageThumbnails[i] ? pageThumbnails[i].included : true) pageGroups.push([i]);
          }
        }
      } else if (mainTab === 'paginas') {
        if (extractMode === 'all') {
          for (let i = 0; i < totalPages; i++) {
            if (pageThumbnails[i] ? pageThumbnails[i].included : true) pageGroups.push([i]);
          }
        } else if (extractMode === 'even') {
          const evens: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            if ((i + 1) % 2 === 0 && (pageThumbnails[i] ? pageThumbnails[i].included : true))
              evens.push(i);
          }
          if (evens.length > 0) pageGroups.push(evens);
        } else if (extractMode === 'odd') {
          const odds: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            if ((i + 1) % 2 !== 0 && (pageThumbnails[i] ? pageThumbnails[i].included : true))
              odds.push(i);
          }
          if (odds.length > 0) pageGroups.push(odds);
        } else {
          const indices: Set<number> = new Set();
          specificPagesInput.split(',').forEach((p) => {
            const num = parseInt(p.trim(), 10);
            if (!isNaN(num) && num >= 1 && num <= totalPages) indices.add(num - 1);
          });
          const sorted = Array.from(indices)
            .filter((i) => (pageThumbnails[i] ? pageThumbnails[i].included : true))
            .sort((a, b) => a - b);
          if (sorted.length > 0) pageGroups.push(sorted);
        }
      } else {
        // TAB TAMAÑO
        const size = Math.max(1, chunkPageCount);
        for (let i = 0; i < totalPages; i += size) {
          const chunk: number[] = [];
          for (let j = i; j < Math.min(i + size, totalPages); j++) {
            if (pageThumbnails[j] ? pageThumbnails[j].included : true) chunk.push(j);
          }
          if (chunk.length > 0) pageGroups.push(chunk);
        }
      }

      if (pageGroups.length === 0) {
        toast.error(
          isEs
            ? 'No se seleccionaron páginas válidas para dividir'
            : 'No valid pages selected for splitting',
        );
        setIsProcessing(false);
        return;
      }

      const worker = new Worker(new URL('../workers/pdf-split.worker.ts', import.meta.url), {
        type: 'module',
      });

      const bufferCopy = buffer.slice(0);
      const payload: SplitWorkerMessageIn = {
        action: 'split',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        pageGroups,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Dividido',
          createZip,
          mergeAllRanges,
          addPageFooterNumbering,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          },
        },
      };

      const result = await new Promise<{
        buffer: ArrayBuffer;
        filename: string;
        isZip: boolean;
        createdCount: number;
      }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<SplitWorkerMessageOut>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            setProgressPercent(msg.percent);
            setProgressMsg(msg.message);
          } else if (msg.type === 'result') {
            resolve({
              buffer: msg.buffer,
              filename: msg.filename,
              isZip: msg.isZip,
              createdCount: msg.createdCount,
            });
          } else if (msg.type === 'error') {
            reject(new Error(msg.message));
          }
        };

        worker.onerror = (err) => reject(err);
        worker.postMessage(payload, [bufferCopy]);
      });

      worker.terminate();

      const blob = new Blob([result.buffer], {
        type: result.isZip ? 'application/zip' : 'application/pdf',
      });
      const localUrl = URL.createObjectURL(blob);
      const sizeFormatted = formatFileSize(blob.size);
      const origSizeFormatted = file ? formatFileSize(file.size) : '—';

      setCompletedResult({
        downloadUrl: localUrl,
        filename: result.filename,
        fileSize: sizeFormatted,
        createdCount: result.createdCount,
        isZip: result.isZip,
        rawBlob: blob,
        originalSize: origSizeFormatted,
        totalPages,
      });

      setProgressPercent(100);
      toast.success(isEs ? '¡Documento dividido con éxito!' : 'Document split successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message ||
          (isEs ? 'Error al dividir el documento PDF' : 'Error splitting PDF document'),
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

  // CLASES DE DENSIDAD DE CUADRÍCULA
  const gridClasses = useMemo(() => {
    switch (gridDensity) {
      case 'compact':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5';
      case 'standard':
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
    }
  }, [gridDensity]);

  const cardHeightClass = useMemo(() => {
    switch (gridDensity) {
      case 'compact':
        return 'h-[210px] min-h-[210px] p-2.5';
      case 'large':
        return 'h-[360px] min-h-[360px] p-4';
      case 'standard':
      default:
        return 'h-[280px] min-h-[280px] p-3';
    }
  }, [gridDensity]);

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isProcessing}
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
                ? '002 / ORGANIZACIÓN Y DIVISIÓN DE ARCHIVOS PDF'
                : '002 / PDF SPLITTING & ORGANIZATION'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Scissors className="w-6 h-6 text-white flex-shrink-0" />
              {isEs
                ? 'DIVIDIR ARCHIVOS PDF (EXTRAER PÁGINAS Y SECCIONES)'
                : 'SPLIT PDF FILES (EXTRACT PAGES & SECTIONS)'}
            </h1>
          </div>
        </div>

        {completedResult ? (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="font-bold truncate max-w-[180px] sm:max-w-[280px]">
                {completedResult.filename}
              </span>
            </div>
            <button
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all"
              title={isEs ? 'Dividir otro documento' : 'Split another document'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : file ? (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {file.name}
              </span>
            </div>
            <button
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      {completedResult ? (
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: completedResult.downloadUrl,
              filename: completedResult.filename,
              fileSize: completedResult.fileSize,
              rawBlob: completedResult.rawBlob,
            }}
            totalPages={completedResult.totalPages}
            modeText={
              completedResult.isZip
                ? isEs
                  ? `${completedResult.createdCount} partes en archivo .ZIP`
                  : `${completedResult.createdCount} parts in .ZIP archive`
                : isEs
                  ? 'Páginas extraídas en PDF'
                  : 'Pages extracted in PDF'
            }
            toolName={isEs ? 'Dividir PDF' : 'Split PDF'}
            badgeText={isEs ? 'División Completada' : 'Split Completed'}
            successTitle={isEs ? '¡Documento Dividido con Éxito!' : 'Document Split Successfully!'}
            downloadButtonText={
              completedResult.isZip
                ? isEs
                  ? 'Descargar Archivos en .ZIP'
                  : 'Download Files in .ZIP'
                : isEs
                  ? 'Descargar PDF Extraído'
                  : 'Download Extracted PDF'
            }
            shareSubject={isEs ? 'documento dividido' : 'split document'}
            fallbackUrl="https://pdf-black.com/organizar/dividir"
            metricBadge={
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded font-bold font-mono">
                {completedResult.totalPages} {isEs ? 'págs' : 'pages'} →{' '}
                {completedResult.createdCount}{' '}
                {completedResult.createdCount === 1
                  ? isEs
                    ? 'archivo'
                    : 'file'
                  : isEs
                    ? 'archivos'
                    : 'files'}
              </span>
            }
            onReset={removeFile}
          />
        </div>
      ) : !file ? (
        /* VISTA DROPZONE VACÍA */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneDrop}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
            isDropzoneDragging
              ? 'border-white bg-zinc-900/50'
              : 'border-zinc-600 hover:border-white'
          } rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <Scissors className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de División Vectorial v5.0 • 100% Local'
                : 'Vectorial Split Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? 'DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF' : 'SPLIT OR EXTRACT PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Separa páginas individuales, extrae intervalos específicos o descompone tu PDF en bloques fijos al instante, sin subir datos a la nube ni perder calidad vectorial.'
              : 'Separate individual pages, extract specific intervals, or partition your PDF into equal chunks instantly, without cloud uploads or vector quality loss.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Extracción Vectorial 100%' : '✓ 100% Lossless Vector'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Conserva tipografías incrustadas, hipervínculos y trazos matemáticos sin rasterización.'
                  : 'Preserves embedded fonts, hyperlinks, and vector strokes losslessly without rasterization.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Rangos e Intervalos Flexibles' : '✓ Flexible Ranges & Intervals'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Rangos personalizados, páginas pares/impares, bloques fijos o exportación en archivo ZIP.'
                  : 'Custom ranges, even/odd pages, fixed chunks, or instant ZIP archive packaging.'}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISTA PREVIA DE RANGOS DE HOJAS */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6"
        >
          {/* PANEL SUPERIOR: REJILLA DE MINIATURAS REALES Y VISOR (ANCHO COMPLETO) */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* DESBLOQUEO DE CONTRASEÑA SI ESTÁ CIFRADO */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 mb-4 font-mono text-xs">
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
                    className="flex-1 bg-zinc-900 border border-white/15 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={unlockFileWithPassword}
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                  </button>
                </div>
              </div>
            )}
            {/* CABECERA DE LA VISTA PREVIA CON CONTADOR Y DENSIDAD */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / VISOR Y MINIATURAS (${totalPages} PÁGINAS)`
                    : `001 / THUMBNAILS & PREVIEW (${totalPages} PAGES)`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* BADGE DE PÁGINAS SELECCIONADAS */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-xl text-white font-mono text-[11px] shadow-sm">
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                  <span>
                    {selectedCount} / {totalPages} {isEs ? 'activas' : 'active'}
                  </span>
                </div>

                {/* SELECTOR DE DENSIDAD DE CUADRÍCULA */}
                <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-0.5 gap-0.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setGridDensity('compact')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${gridDensity === 'compact' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                    title={isEs ? 'Vista Compacta' : 'Compact View'}
                  >
                    {isEs ? 'Compacto' : 'Compact'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity('standard')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${gridDensity === 'standard' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                    title={isEs ? 'Vista Estándar' : 'Standard View'}
                  >
                    {isEs ? 'Estándar' : 'Standard'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity('large')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${gridDensity === 'large' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                    title={isEs ? 'Vista Grande' : 'Large View'}
                  >
                    {isEs ? 'Grande' : 'Large'}
                  </button>
                </div>

                {/* BOTÓN SELECCIONAR TODAS / INVERTIR / LIMPIAR */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    {isEs ? 'Todas' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={selectEvenPages}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    {isEs ? 'Pares' : 'Even'}
                  </button>
                  <button
                    type="button"
                    onClick={selectOddPages}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    {isEs ? 'Impares' : 'Odd'}
                  </button>
                  <button
                    type="button"
                    onClick={invertSelection}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    {isEs ? 'Invertir' : 'Invert'}
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    {isEs ? 'Limpiar' : 'Clear'}
                  </button>
                </div>
              </div>
            </div>

            {/* VISUALIZADOR GRÁFICO DE MINIATURAS REALES EN GRILLA */}
            <div className="w-full overflow-y-auto max-h-[580px] pr-2 font-mono custom-scrollbar">
              {isLoadingThumbnails ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="text-xs font-bold">
                    {isEs
                      ? 'Generando vistas previas de páginas...'
                      : 'Generating page previews...'}
                  </span>
                </div>
              ) : (
                <div className={`grid ${gridClasses} p-1`}>
                  {pageThumbnails.map((p) => {
                    const rangeInfo = getPageRangeInfo(p.pageIndex);
                    return (
                      <div
                        key={p.pageIndex}
                        onClick={() => togglePageIncluded(p.pageIndex)}
                        className={`relative w-full ${cardHeightClass} bg-zinc-950 border ${
                          p.included
                            ? rangeInfo
                              ? rangeInfo.color.border
                              : 'border-white/20 hover:border-white/40'
                            : 'border-red-500/30 opacity-40'
                        } rounded-2xl flex flex-col justify-between transition-all cursor-pointer group shadow-lg overflow-hidden`}
                      >
                        {/* CABECERA DE LA TARJETA CON NÚMERO Y RANGO */}
                        <div className="flex items-center justify-between mb-1.5 shrink-0 z-10">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-md">
                              #{p.pageIndex + 1}
                            </span>
                            {rangeInfo && p.included && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${rangeInfo.color.badge} ${rangeInfo.color.border}`}
                              >
                                {rangeInfo.label}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* BOTÓN LUPA / ZOOM */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomIndex(p.pageIndex);
                              }}
                              className="p-1 rounded-md bg-zinc-900/80 hover:bg-white hover:text-black text-zinc-400 border border-white/10 transition-colors"
                              title={isEs ? 'Ampliar página' : 'Zoom page'}
                            >
                              <Eye className="w-3 h-3" />
                            </button>

                            {/* CHECK DE INCLUSIÓN */}
                            <div
                              className={`p-1 rounded-lg border transition-all ${p.included ? 'bg-white text-black border-white shadow-sm' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}
                            >
                              {p.included ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* LIENZO DE LA MINIATURA */}
                        <div className="w-full flex-1 min-h-0 bg-zinc-900/90 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 relative p-1.5 shadow-inner">
                          {p.dataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.dataUrl}
                              alt={`Página ${p.pageIndex + 1}`}
                              className="max-w-full max-h-full object-contain rounded drop-shadow-md transition-transform group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                              <FileText className="w-6 h-6" />
                              <span className="text-[9px]">Pág. {p.pageIndex + 1}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PANEL INFERIOR: PANEL DE CONTROL Y PARÁMETROS DE CORTE (ANCHO COMPLETO) */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* HEADER DEL PANEL DE CONTROL */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN DE CORTE' : '002 / SPLIT CONFIGURATION'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 font-sans uppercase tracking-tight">
                  <Sliders className="w-5 h-5 text-white" />
                  <span>
                    {isEs
                      ? 'PARÁMETROS Y MODALIDADES DE DIVISIÓN'
                      : 'SPLIT PARAMETERS & MODALITIES'}
                  </span>
                </h2>
              </div>

              {/* SELECTOR DE TABS DE MODO PRINCIPAL: RANGO / PÁGINAS / BLOQUES */}
              <div className="flex items-center border border-zinc-800 bg-[#121217] rounded-2xl p-1 gap-1 font-mono shadow-inner">
                <button
                  type="button"
                  onClick={() => setMainTab('rango')}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    mainTab === 'rango'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers3 className="w-4 h-4" />
                  <span>{isEs ? 'Por Rangos' : 'By Range'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainTab('paginas')}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    mainTab === 'paginas'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{isEs ? 'Por Páginas' : 'By Pages'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainTab('tamano')}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    mainTab === 'tamano'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>{isEs ? 'Bloques Fijos' : 'Fixed Chunks'}</span>
                </button>
              </div>
            </div>

            {/* CUERPO DEL PANEL DE CONTROL EN 3 COLUMNAS ENTERPRISE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
              {/* COLUMNA 1: CONFIGURACIÓN DE MODALIDAD */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">
                      {isEs ? '1. Modalidad y Selección' : '1. Modality & Selection'}
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {mainTab === 'rango'
                        ? isEs
                          ? 'Rangos específicos'
                          : 'Specific ranges'
                        : mainTab === 'paginas'
                          ? isEs
                            ? 'Filtro de hojas'
                            : 'Page filter'
                          : isEs
                            ? 'Partición por tamaño'
                            : 'Chunk partition'}
                    </span>
                  </div>

                  {/* CONTENIDO TAB 1: RANGO */}
                  {mainTab === 'rango' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRangeSubMode('personalizado')}
                          className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            rangeSubMode === 'personalizado'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Personalizado' : 'Custom'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRangeSubMode('fijo')}
                          className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            rangeSubMode === 'fijo'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Bloques Fijos' : 'Fixed Blocks'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRangeSubMode('inteligente')}
                          className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            rangeSubMode === 'inteligente'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isEs ? '1 pág / PDF' : '1 pg / PDF'}
                        </button>
                      </div>

                      {rangeSubMode === 'personalizado' && (
                        <div className="space-y-3">
                          {/* CONTROLES DE RANGOS PERSONALIZADOS */}
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {ranges.map((r, idx) => {
                              const color = RANGE_COLORS[idx % RANGE_COLORS.length];
                              return (
                                <div
                                  key={r.id}
                                  className={`bg-zinc-950 border ${color.border} p-2.5 rounded-xl space-y-1.5 transition-all`}
                                >
                                  <div className="flex items-center justify-between text-[11px] font-bold text-white">
                                    <span className="flex items-center gap-1.5">
                                      <span
                                        className={`w-2 h-2 rounded-full ${color.bg} border ${color.border}`}
                                      />
                                      {isEs ? `Rango ${idx + 1}` : `Range ${idx + 1}`}
                                    </span>
                                    {ranges.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveRange(r.id)}
                                        className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                                        title={isEs ? 'Eliminar este rango' : 'Remove range'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-zinc-300 gap-2">
                                    <span className="text-[10px] text-zinc-400">
                                      {isEs ? 'Desde pág.' : 'From pg.'}
                                    </span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={totalPages || 100}
                                      value={r.from}
                                      onChange={(e) =>
                                        handleUpdateRange(
                                          r.id,
                                          'from',
                                          parseInt(e.target.value, 10) || 1,
                                        )
                                      }
                                      className="w-16 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                                    />
                                    <span className="text-[10px] text-zinc-400">
                                      {isEs ? 'hasta' : 'to'}
                                    </span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={totalPages || 100}
                                      value={r.to}
                                      onChange={(e) =>
                                        handleUpdateRange(
                                          r.id,
                                          'to',
                                          parseInt(e.target.value, 10) || 1,
                                        )
                                      }
                                      className="w-16 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* BOTONES DE ACCIONES RÁPIDAS PARA RANGOS */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={handleAddRange}
                              className="border border-white/20 hover:border-white/40 bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isEs ? 'Añadir' : 'Add'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSplitInHalf}
                              className="border border-white/10 hover:border-white/30 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                              title={
                                isEs ? 'Dividir exactamente en 2 mitades' : 'Split into 2 halves'
                              }
                            >
                              <Split className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{isEs ? 'Mitad' : 'Half'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleResetRanges}
                              className="border border-white/10 hover:border-white/30 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                              title={isEs ? 'Restablecer a 1 rango completo' : 'Reset ranges'}
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>{isEs ? 'Reset' : 'Reset'}</span>
                            </button>
                          </div>

                          <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-bold text-zinc-300 pt-1">
                            <input
                              type="checkbox"
                              checked={mergeAllRanges}
                              onChange={(e) => setMergeAllRanges(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Unir todos los rangos en un único PDF.'
                                : 'Merge all ranges into single PDF.'}
                            </span>
                          </label>
                        </div>
                      )}

                      {rangeSubMode === 'fijo' && (
                        <div className="bg-zinc-950 border border-white/10 p-3.5 rounded-xl space-y-2.5">
                          <label className="text-[11px] text-zinc-300 font-bold block">
                            {isEs ? 'Bloques de páginas por PDF:' : 'Page block size per PDF:'}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">
                              {isEs ? 'Dividir cada' : 'Split every'}
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={totalPages || 100}
                              value={chunkPageCount}
                              onChange={(e) =>
                                setChunkPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                              className="w-20 bg-zinc-900 border border-white/20 rounded-lg p-1.5 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                            />
                            <span className="text-xs text-zinc-400">
                              {isEs ? 'página(s)' : 'page(s)'}
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-400 font-mono">
                            {isEs
                              ? `✓ Se generarán ${Math.ceil((totalPages || 1) / Math.max(1, chunkPageCount))} archivos PDF (${createZip ? 'empaquetados en .ZIP' : 'descarga directa'})`
                              : `✓ Will generate ${Math.ceil((totalPages || 1) / Math.max(1, chunkPageCount))} PDF files (${createZip ? 'packaged in .ZIP' : 'direct download'})`}
                          </p>
                        </div>
                      )}

                      {rangeSubMode === 'inteligente' && (
                        <div className="bg-zinc-950 border border-white/10 p-3.5 rounded-xl space-y-2">
                          <span className="text-xs font-bold text-white block">
                            🧠{' '}
                            {isEs
                              ? 'División Individual (1 pág / PDF)'
                              : 'Individual Split (1 pg / PDF)'}
                          </span>
                          <p className="text-[11px] text-zinc-400">
                            {isEs
                              ? `Cada una de las ${totalPages} páginas del documento se extraerá como un archivo PDF independiente (total: ${totalPages} PDFs en 1 archivo .ZIP).`
                              : `Each of the ${totalPages} pages will be automatically split into an independent PDF file (total: ${totalPages} PDFs in 1 .ZIP file).`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTENIDO TAB 2: PÁGINAS */}
                  {mainTab === 'paginas' && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                          <input
                            type="radio"
                            name="extractMode"
                            checked={extractMode === 'all'}
                            onChange={() => handleExtractModeChange('all')}
                            className="accent-white cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Extraer todas las páginas (1 PDF / pág)'
                              : 'Extract every page (1 PDF / page)'}
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                          <input
                            type="radio"
                            name="extractMode"
                            checked={extractMode === 'even'}
                            onChange={() => handleExtractModeChange('even')}
                            className="accent-white cursor-pointer"
                          />
                          <span>
                            {isEs ? 'Extraer solo páginas pares' : 'Extract even pages only'}
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                          <input
                            type="radio"
                            name="extractMode"
                            checked={extractMode === 'odd'}
                            onChange={() => handleExtractModeChange('odd')}
                            className="accent-white cursor-pointer"
                          />
                          <span>
                            {isEs ? 'Extraer solo páginas impares' : 'Extract odd pages only'}
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                          <input
                            type="radio"
                            name="extractMode"
                            checked={extractMode === 'specific'}
                            onChange={() => handleExtractModeChange('specific')}
                            className="accent-white cursor-pointer"
                          />
                          <span>
                            {isEs ? 'Extraer páginas específicas' : 'Extract specific pages'}
                          </span>
                        </label>
                      </div>

                      {extractMode === 'specific' && (
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                            {isEs
                              ? 'Lista de páginas (separadas por coma):'
                              : 'Pages list (comma-separated):'}
                          </label>
                          <input
                            type="text"
                            value={specificPagesInput}
                            onChange={(e) => handleSpecificPagesInputChange(e.target.value)}
                            placeholder="1, 3, 5"
                            className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-white/50"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTENIDO TAB 3: TAMAÑO */}
                  {mainTab === 'tamano' && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="bg-zinc-950 border border-white/10 p-3.5 rounded-xl space-y-2.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                          {isEs ? 'Dividir cada N páginas:' : 'Chunk every N pages:'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={totalPages || 100}
                          value={chunkPageCount}
                          onChange={(e) =>
                            setChunkPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-white/50"
                        />
                        <p className="text-[10px] text-emerald-400 font-mono">
                          {isEs
                            ? `✓ Generará ${Math.ceil((totalPages || 1) / Math.max(1, chunkPageCount))} partes de ${chunkPageCount} página(s)`
                            : `✓ Will generate ${Math.ceil((totalPages || 1) / Math.max(1, chunkPageCount))} parts of ${chunkPageCount} page(s)`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA 2: OPCIONES DE SALIDA Y EMPAQUETADO */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">
                      {isEs ? '2. Empaquetado y Exportación' : '2. Packaging & Export'}
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {isEs ? 'Formato de entrega' : 'Delivery format'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                        {isEs ? 'Prefijo de Archivos:' : 'Output File Prefix:'}
                      </label>
                      <input
                        type="text"
                        value={filePrefix}
                        onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Corte"
                        className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                      />
                    </div>

                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createZip}
                          onChange={(e) => setCreateZip(e.target.checked)}
                          className="accent-white w-4 h-4 rounded cursor-pointer"
                        />
                        <span>
                          {isEs
                            ? 'Empaquetar en archivo .ZIP (2+ partes)'
                            : 'Package into .ZIP file'}
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPageFooterNumbering}
                          onChange={(e) => setAddPageFooterNumbering(e.target.checked)}
                          className="accent-white w-4 h-4 rounded cursor-pointer"
                        />
                        <span>
                          {isEs
                            ? 'Re-numerar páginas en pie de página'
                            : 'Re-number pages in footer'}
                        </span>
                      </label>
                    </div>

                    {/* TARJETA INFORMATIVA DE SALIDA ESTIMADA */}
                    <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <FileArchive className="w-4 h-4 text-sky-400" />
                        <span className="text-[11px]">
                          {createZip
                            ? isEs
                              ? 'Contenedor ZIP activado'
                              : 'ZIP archive enabled'
                            : isEs
                              ? 'Descarga directa PDF'
                              : 'Direct PDF download'}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        {isEs ? '100% Vectorial' : '100% Vector'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA 3: METADATOS FORMALES Y GARANTÍAS */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">
                      {isEs ? '3. Metadatos del Documento' : '3. Document Metadata'}
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {isEs ? 'Opcional corporativo' : 'Optional corporate'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">
                        {isEs ? 'Título del PDF:' : 'PDF Title:'}
                      </label>
                      <input
                        type="text"
                        placeholder={isEs ? 'Ej: Contrato_Fragmentado' : 'Ex: Split_Contract'}
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/30 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">
                        {isEs ? 'Autor / Organización:' : 'Author / Organization:'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          isEs ? 'Ej: Despacho Legal o Empresa' : 'Ex: Legal Firm or Company'
                        }
                        value={docAuthor}
                        onChange={(e) => setDocAuthor(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/30 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">
                        {isEs ? 'Asunto / Expediente:' : 'Subject / File Ref:'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          isEs ? 'Ej: Autos Procesales EXP-2026' : 'Ex: Case File REF-2026'
                        }
                        value={docSubject}
                        onChange={(e) => setDocSubject(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/30 font-mono"
                      />
                    </div>

                    {/* BADGES INSTITUCIONALES */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ISO 32000-1
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-950/30 border border-sky-500/20 px-2 py-1 rounded-lg">
                        <Zap className="w-3.5 h-3.5 text-sky-400" /> Zero-Knowledge (RAM)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ÁREA INFERIOR: RESUMEN EN VIVO, BARRA DE PROGRESO Y BOTÓN ACCIÓN A ANCHO COMPLETO */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              {/* TARJETA DE RESUMEN EN VIVO */}
              {liveSummary && (
                <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                      {isEs ? 'Resumen de Partición' : 'Split Summary'}
                    </span>
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {liveSummary.outputDescription}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-200 bg-zinc-800 border border-zinc-600 px-3.5 py-1.5 rounded-xl font-bold shadow-sm">
                      {liveSummary.partsCount}{' '}
                      {liveSummary.partsCount === 1
                        ? isEs
                          ? 'parte'
                          : 'part'
                        : isEs
                          ? 'partes'
                          : 'parts'}
                    </span>
                  </div>
                </div>
              )}

              {/* BARRA DE PROGRESO */}
              {isProcessing && (
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                    <span className="truncate max-w-[280px]">{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-white transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              {/* BOTÓN PRINCIPAL DE EJECUCIÓN A ANCHO COMPLETO */}
              <button
                type="button"
                onClick={executeSplit}
                disabled={isProcessing || !file || (isEncrypted && !isUnlocked)}
                className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 py-4 px-6 rounded-2xl font-sans font-bold text-base transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-5 h-5 text-black" />
                )}
                <span>
                  {isProcessing
                    ? progressMsg
                    : !file
                      ? isEs
                        ? 'Selecciona un archivo PDF'
                        : 'Select a PDF file'
                      : isEs
                        ? `Dividir Archivo PDF (${liveSummary ? liveSummary.partsCount : 1} ${liveSummary && liveSummary.partsCount === 1 ? 'Parte' : 'Partes'}) →`
                        : `Split PDF File (${liveSummary ? liveSummary.partsCount : 1} ${liveSummary && liveSummary.partsCount === 1 ? 'Part' : 'Parts'}) →`}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── MODAL DE ZOOM / VISTA PREVIA AMPLIADA DE PÁGINA ── */}
      <AnimatePresence>
        {zoomIndex !== null && pageThumbnails[zoomIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setZoomIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#09090b] border border-white/20 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl font-mono"
            >
              {/* CABECERA DEL MODAL */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-zinc-400 font-bold bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-lg">
                    {isEs
                      ? `Página ${zoomIndex + 1} de ${totalPages}`
                      : `Page ${zoomIndex + 1} of ${totalPages}`}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border ${pageThumbnails[zoomIndex].included ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                  >
                    {pageThumbnails[zoomIndex].included
                      ? isEs
                        ? '✓ Incluida en corte'
                        : '✓ Included'
                      : isEs
                        ? '✗ Excluida'
                        : '✗ Excluded'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePageIncluded(zoomIndex)}
                    className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs border border-white/10 transition-colors cursor-pointer"
                  >
                    {pageThumbnails[zoomIndex].included
                      ? isEs
                        ? 'Excluir'
                        : 'Exclude'
                      : isEs
                        ? 'Incluir'
                        : 'Include'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomIndex(null)}
                    className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* IMAGEN DE ALTA RESOLUCIÓN */}
              <div className="flex-1 min-h-[350px] max-h-[60vh] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center p-3 border border-white/10 relative shadow-inner">
                {pageThumbnails[zoomIndex].dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pageThumbnails[zoomIndex].dataUrl}
                    alt={`Página ${zoomIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg drop-shadow-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <FileText className="w-12 h-12" />
                    <span>{isEs ? 'Vista previa no disponible' : 'Preview not available'}</span>
                  </div>
                )}
              </div>

              {/* CONTROLES DE NAVEGACIÓN ANTERIOR / SIGUIENTE */}
              <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10 text-xs">
                <button
                  type="button"
                  disabled={zoomIndex === 0}
                  onClick={() => setZoomIndex(zoomIndex - 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white rounded-xl border border-white/10 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isEs ? 'Anterior' : 'Previous'}</span>
                </button>

                <span className="text-[11px] text-zinc-500">
                  {isEs
                    ? 'Usa las flechas ← → para navegar o Esc para cerrar'
                    : 'Use ← → keys to navigate or Esc to close'}
                </span>

                <button
                  type="button"
                  disabled={zoomIndex === totalPages - 1}
                  onClick={() => setZoomIndex(zoomIndex + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white rounded-xl border border-white/10 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>{isEs ? 'Siguiente' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
