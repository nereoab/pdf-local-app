'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Scissors,
  FileText,
  X,
  Loader2,
  Sliders,
  UploadCloud,
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
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Split,
  Info,
  Sparkle,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SplitWorkerMessageIn, SplitWorkerMessageOut } from '@/workers/pdf-split.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
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

  // RESULTADOS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [createdCount, setCreatedCount] = useState<number>(0);

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
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
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
      inspectPdf(file);
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
      setDownloadUrl(null);
      setCreatedCount(0);
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
    setDownloadUrl(null);
    setCompletedResult(null);
    setGlobalFile(null);
    setCreatedCount(0);
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
    setDownloadUrl(null);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length === 1) return;
    setRanges((prev) => prev.filter((r) => r.id !== id));
    setDownloadUrl(null);
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
    setDownloadUrl(null);
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

  const handleOnePagePerRange = () => {
    if (totalPages === 0) return;
    const newRanges: RangeItem[] = [];
    for (let i = 1; i <= totalPages; i++) {
      newRanges.push({ id: `range-${i}`, from: i, to: i });
    }
    setRanges(newRanges);
    toast.success(
      isEs
        ? `Se crearon ${totalPages} rangos (1 página cada uno)`
        : `Created ${totalPages} ranges (1 page each)`,
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

      setDownloadUrl(localUrl);
      setDownloadFilename(result.filename);
      setCreatedCount(result.createdCount);
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
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-5';
      case 'standard':
      default:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4';
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
              {isEs ? '002 / CORTE Y DIVISIÓN DE DOCUMENTOS PDF' : '002 / PDF CUTTING & SPLITTING'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Scissors className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF' : 'SPLIT OR EXTRACT PDF PAGES'}
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
        /* ── PANTALLA DE ÉXITO DEDICADA ── */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE DIVISIÓN (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-2xl text-white shadow-md">
                  <Scissors className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA DIVISIÓN DE PDF' : 'PDF SPLIT RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? '¡Documento dividido con éxito!' : 'Document split successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5 font-sans">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Archivos Generados' : 'Generated Files'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.createdCount} {isEs ? 'Partes' : 'Parts'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Formato de Salida' : 'Output Format'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.isZip
                    ? isEs
                      ? 'PDFs en .ZIP'
                      : 'PDFs in .ZIP'
                    : isEs
                      ? 'PDF extraído'
                      : 'PDF extracted'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Modo de Procesamiento' : 'Processing Mode'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Corte Web Worker Nativo' : 'Native Web Worker Split'}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA ÉXITO CON ENCADENAMIENTO DE HERRAMIENTAS */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat={completedResult.isZip ? 'zip' : 'pdf'}
            rawBlob={completedResult.rawBlob}
            onReset={removeFile}
          />
        </motion.div>
      ) : !file ? (
        /* VISTA DROPZONE VACÍA */
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
            {isEs ? 'DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF' : 'SPLIT OR EXTRACT PDF PAGES'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Separa o extrae rangos de páginas de tu PDF de forma 100% confidencial y local.'
              : 'Split or extract ranges of pages from your PDF 100% locally.'}
          </p>
          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
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
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISTA PREVIA DE RANGOS DE HOJAS */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: REJILLA DE MINIATURAS REALES Y RANGOS DE HOJAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col h-[750px] lg:h-[820px] max-h-[850px] overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

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

                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* DETALLES DEL ARCHIVO CARGADO Y WIDGET DE CONTRASEÑA */}
            <div className="bg-[#121217] border border-zinc-700/80 p-3.5 rounded-2xl mb-3 font-mono text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-5 h-5 text-zinc-300 flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-white font-bold block truncate">{file.name}</span>
                    <span className="text-[10px] text-zinc-400">
                      {formatFileSize(file.size)} • {totalPages}{' '}
                      {isEs ? 'páginas en total' : 'total pages'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUnlocked && (
                    <span className="bg-zinc-800 text-zinc-200 text-[10px] px-2.5 py-1 rounded-xl border border-zinc-600 flex items-center gap-1 shadow-sm font-bold">
                      <Unlock className="w-3 h-3 text-white" /> {isEs ? 'Desbloqueado' : 'Unlocked'}
                    </span>
                  )}
                  <button
                    onClick={removeFile}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ENCRYPTED PASSWORD WIDGET */}
              {isEncrypted && !isUnlocked && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
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
                      onClick={unlockFileWithPassword}
                      className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BARRA DE HERRAMIENTAS DE SELECCIÓN RÁPIDA */}
            <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] mb-4">
              <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-zinc-400" />
                {isEs ? 'Selección Rápida:' : 'Quick Selection:'}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Todas' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={selectEvenPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Pares' : 'Even'}
                </button>
                <button
                  type="button"
                  onClick={selectOddPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Impares' : 'Odd'}
                </button>
                <button
                  type="button"
                  onClick={invertSelection}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
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

            {/* VISUALIZADOR GRÁFICO DE MINIATURAS REALES EN GRILLA */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 font-mono custom-scrollbar">
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

          {/* LADO DERECHO: PANEL DE CONTROL (ALTURA NATURAL SIN SCROLL) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="space-y-4">
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-4 pb-3 border-b border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* TABS SUPERIORES [0-0] RANGO, PÁGINAS, TAMAÑO */}
              <div className="grid grid-cols-3 border border-zinc-800 bg-[#121217] rounded-2xl overflow-hidden mb-5 p-1 gap-1 font-mono shadow-inner">
                <button
                  onClick={() => setMainTab('rango')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'rango'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers3 className="w-4 h-4" />
                  <span>{isEs ? 'Rango' : 'Range'}</span>
                </button>

                <button
                  onClick={() => setMainTab('paginas')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'paginas'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{isEs ? 'Páginas' : 'Pages'}</span>
                </button>

                <button
                  onClick={() => setMainTab('tamano')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'tamano'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>{isEs ? 'Tamaño' : 'Size'}</span>
                </button>
              </div>

              {/* CONTENIDO TAB 1: RANGO */}
              {mainTab === 'rango' && (
                <div className="space-y-4 font-mono">
                  <div>
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">
                      {isEs ? 'Modo de Rango:' : 'Range Mode:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
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
                  </div>

                  {rangeSubMode === 'personalizado' && (
                    <div className="space-y-3">
                      {/* CONTROLES DE RANGOS PERSONALIZADOS */}
                      <div className="space-y-2 pr-0.5">
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
                                    handleUpdateRange(r.id, 'to', parseInt(e.target.value, 10) || 1)
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
                          title={isEs ? 'Dividir exactamente en 2 mitades' : 'Split into 2 halves'}
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
                      <span>{isEs ? 'Extraer solo páginas pares' : 'Extract even pages only'}</span>
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
                      <span>{isEs ? 'Extraer páginas específicas' : 'Extract specific pages'}</span>
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

              {/* OPCIONES AVANZADAS: PREFIJO Y SALIDA */}
              <div className="pt-3 border-t border-white/10 space-y-3 font-mono">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEs ? 'Prefijo de Archivos:' : 'Output File Prefix:'}
                  </label>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Corte"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/10 space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'OPCIONES DE SALIDA' : 'OUTPUT OPTIONS'}
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createZip}
                      onChange={(e) => setCreateZip(e.target.checked)}
                      className="accent-white w-4 h-4 rounded cursor-pointer"
                    />
                    <span>
                      {isEs ? 'Empaquetar en archivo .ZIP (2+ partes)' : 'Package into .ZIP file'}
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
                      {isEs ? 'Re-numerar páginas en pie de página' : 'Re-number pages in footer'}
                    </span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE (PLEGABLE CON ACCORDEON) */}
                <div className="bg-zinc-950/70 rounded-xl border border-white/10 overflow-hidden font-mono">
                  <button
                    type="button"
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      {isEs ? 'Metadatos del PDF (Opcional)' : 'PDF Metadata (Optional)'}
                    </span>
                    {showMetadata ? (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>

                  {showMetadata && (
                    <div className="p-3 pt-1 border-t border-white/5 space-y-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">
                          {isEs ? 'Título:' : 'Title:'}
                        </label>
                        <input
                          type="text"
                          placeholder={isEs ? 'Ej: Documento_Fragmentado' : 'Ex: Split_Document'}
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
                          placeholder={
                            isEs
                              ? 'Ej: División de expedientes corporativos'
                              : 'Ex: Merged corporate records'
                          }
                          value={docSubject}
                          onChange={(e) => setDocSubject(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TARJETA DE RESUMEN EN VIVO & BOTÓN PRINCIPAL */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              {/* TARJETA DE RESUMEN DINÁMICO EN VIVO */}
              {liveSummary && (
                <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 font-mono text-xs flex items-center justify-between shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                      {isEs ? 'Resumen de corte' : 'Split summary'}
                    </span>
                    <span className="text-white font-bold text-xs">
                      {liveSummary.outputDescription}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-200 bg-zinc-800 border border-zinc-600 px-2.5 py-1 rounded-xl font-bold shadow-sm">
                      {liveSummary.partsCount} {liveSummary.partsCount === 1 ? 'parte' : 'partes'}
                    </span>
                  </div>
                </div>
              )}

              {/* BARRA DE PROGRESO */}
              {isProcessing && (
                <div className="space-y-1.5 font-mono">
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
                onClick={executeSplit}
                disabled={isProcessing || !file || (isEncrypted && !isUnlocked)}
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
                    : !file
                      ? isEs
                        ? 'Selecciona un archivo PDF'
                        : 'Select a PDF file'
                      : isEs
                        ? 'Dividir Documento (Corte) →'
                        : 'Split Document (Cut) →'}
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
