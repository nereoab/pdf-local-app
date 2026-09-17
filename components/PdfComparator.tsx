'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  GitCompare,
  FileText,
  X,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  SplitSquareVertical,
  Database,
  Hash,
  Copy,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ArrowLeft,
  Trash2,
  Maximize2,
  Plus,
  ArrowLeftRight,
  Sliders,
  Layers,
  FileDown,
  Keyboard,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import type { CompareResult, CompareOptions, DiffWord } from '../workers/pdf-compare.worker';

export default function PdfComparator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // Refs para inputs ocultos de archivos
  const fileAInputRef = useRef<HTMLInputElement>(null);
  const fileBInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const { globalFile } = useFileStore();

  // ============================================================
  // ESTADO ESTRICTO DE 2 ARCHIVOS (DOCUMENTO A vs DOCUMENTO B)
  // ============================================================
  const [fileA, setFileA] = useState<File | null>(() => globalFile || null);
  const [fileB, setFileB] = useState<File | null>(null);

  // Modos de visualización
  // 'split': Lado a Lado con sincronización
  // 'slider': Cortina Deslizante interactiva
  // 'heatmap': Capa de Diferencia Visual
  // 'docA': Solo Original
  // 'docB': Solo Modificado
  const [viewMode, setViewMode] = useState<'split' | 'slider' | 'heatmap' | 'docA' | 'docB'>(
    'split',
  );
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  // Estados de cortina deslizante
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [sliderPage, setSliderPage] = useState<number>(1);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // URLs de canvas renderizados por página
  const [canvas1Urls, setCanvas1Urls] = useState<Record<number, string>>({});
  const [canvas2Urls, setCanvas2Urls] = useState<Record<number, string>>({});
  const [totalPages1, setTotalPages1] = useState(0);
  const [totalPages2, setTotalPages2] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  // Estado del proceso de comparación
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [, setProgressPhase] = useState('');

  // Sincronización y navegación
  const [scrollSync, setScrollSync] = useState(true);
  const isScrollingRef = useRef(false);
  const [activeDiffIdx, setActiveDiffIdx] = useState(-1);
  const [filterType, setFilterType] = useState<'all' | 'removed' | 'added' | 'visual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const zoomRef = useRef(100);
  const [showStructuralDiffs, setShowStructuralDiffs] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isGeneratingPdfReport, setIsGeneratingPdfReport] = useState(false);

  // Opciones de comparación empresarial
  const [compareSensitivity, setCompareSensitivity] = useState<'strict' | 'normal' | 'loose'>(
    'normal',
  );
  const [enableVisualDiff, setEnableVisualDiff] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignorePunctuation, setIgnorePunctuation] = useState(false);

  // Pantalla de éxito y descarga
  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize: string;
    rawBlob?: Blob;
    globalSimilarityPercent: number;
    totalRemovals: number;
    totalAdditions: number;
    totalUnchanged: number;
    modifiedPages: number;
    visualChanges: number;
    structuralChanges: number;
    summary: string;
  } | null>(null);

  const [downloadBanner, setDownloadBanner] = useState<'txt' | 'json' | 'pdf' | null>(null);
  const [showSuccessView, setShowSuccessView] = useState<boolean>(false);

  const pdfDocRef = useRef<{ doc1: any; doc2: any } | null>(null);
  const renderedPagesRef = useRef<{ doc1: Set<number>; doc2: Set<number> }>({
    doc1: new Set(),
    doc2: new Set(),
  });

  // Limpieza de worker al desmontar
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Formato de tamaño legible
  const fmtSize = (b: number) => {
    if (!b) return '0 KB';
    const s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + s[i];
  };

  // Intercambiar archivos A y B
  const handleSwap = () => {
    if (!fileA && !fileB) return;
    const tempA = fileA;
    const tempB = fileB;
    setFileA(tempB);
    setFileB(tempA);
    setCompareResult(null);
    setCompletedResult(null);
    setShowSuccessView(false);
    toast.success(isEs ? 'Archivos intercambiados: Doc A ⇄ Doc B' : 'Files swapped: Doc A ⇄ Doc B');
  };

  // Reset total
  const resetAll = () => {
    setFileA(null);
    setFileB(null);
    setCanvas1Urls({});
    setCanvas2Urls({});
    setTotalPages1(0);
    setTotalPages2(0);
    setCompareResult(null);
    setCompletedResult(null);
    setShowSuccessView(false);
    setActiveDiffIdx(-1);
    setSearchQuery('');
    setSliderPage(1);
    toast.info(isEs ? 'Archivos eliminados' : 'Files cleared');
  };

  const loadPdfDocs = async () => {
    setIsRendering(true);
    setCompareResult(null);
    setCompletedResult(null);
    setShowSuccessView(false);
    renderedPagesRef.current = { doc1: new Set(), doc2: new Set() };

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      let d1: any = null;
      let d2: any = null;

      if (fileA) {
        const b1 = await fileA.arrayBuffer();
        if (b1.byteLength > 0) {
          d1 = await pdfjsLib.getDocument({ data: b1.slice(0) }).promise;
          setTotalPages1(d1.numPages);
        }
      } else {
        setTotalPages1(0);
        setCanvas1Urls({});
      }

      if (fileB) {
        const b2 = await fileB.arrayBuffer();
        if (b2.byteLength > 0) {
          d2 = await pdfjsLib.getDocument({ data: b2.slice(0) }).promise;
          setTotalPages2(d2.numPages);
        }
      } else {
        setTotalPages2(0);
        setCanvas2Urls({});
      }

      pdfDocRef.current = { doc1: d1, doc2: d2 };
    } catch (e: any) {
      const m = e?.message || '';
      if (m.includes('encrypt') || m.includes('password')) {
        toast.error(
          isEs
            ? 'Uno de los PDFs está protegido con contraseña'
            : 'One of the PDFs is password protected',
        );
      } else {
        toast.error(isEs ? 'Error al cargar los documentos' : 'Error loading documents');
      }
    } finally {
      setIsRendering(false);
    }
  };

  // Carga de Documentos en PDF.js para renderizado de vistas previas
  useEffect(() => {
    if (!fileA && !fileB) {
      queueMicrotask(() => {
        setCanvas1Urls({});
        setCanvas2Urls({});
        setTotalPages1(0);
        setTotalPages2(0);
      });
      return;
    }
    queueMicrotask(() => {
      loadPdfDocs();
    });
  }, [fileA, fileB]);

  // Renderizar página individual bajo demanda
  const renderPage = useCallback(
    async (doc: any, pageNum: number, setUrls: any, docKey: 'doc1' | 'doc2') => {
      if (!doc || renderedPagesRef.current[docKey].has(pageNum)) return;
      renderedPagesRef.current[docKey].add(pageNum);

      try {
        const s = (zoomRef.current / 100) * 1.5;
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale: s });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          setUrls((prev: any) => ({
            ...prev,
            [pageNum]: canvas.toDataURL('image/jpeg', 0.88),
          }));
        }
      } catch {
        // Ignorar fallos de renderizado de páginas individuales
      }
    },
    [],
  );

  // IntersectionObserver para renderizado bajo demanda (virtualización)
  useEffect(() => {
    if (!pdfDocRef.current) return;
    const observers: IntersectionObserver[] = [];

    const observeKey = (doc: any, setUrls: any, key: 'doc1' | 'doc2') => {
      if (!doc) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const p = parseInt(e.target.getAttribute('data-page') || '1');
              renderPage(doc, p, setUrls, key);
              obs.unobserve(e.target);
            }
          });
        },
        { rootMargin: '250px 0px' },
      );
      document.querySelectorAll(`[data-observe="${key}"]`).forEach((el) => obs.observe(el));
      observers.push(obs);
    };

    observeKey(pdfDocRef.current.doc1, setCanvas1Urls, 'doc1');
    observeKey(pdfDocRef.current.doc2, setCanvas2Urls, 'doc2');

    return () => observers.forEach((o) => o.disconnect());
  }, [totalPages1, totalPages2, viewMode, renderPage]);

  // Actualizar zoom
  useEffect(() => {
    if (!pdfDocRef.current || (!totalPages1 && !totalPages2)) return;
    renderedPagesRef.current = { doc1: new Set(), doc2: new Set() };
    setCanvas1Urls({});
    setCanvas2Urls({});
    zoomRef.current = zoomLevel;

    const t = setTimeout(() => {
      document.querySelectorAll('[data-observe]').forEach((el) => {
        el.dispatchEvent(new Event('reobserve', { bubbles: true }));
      });
    }, 50);

    return () => clearTimeout(t);
  }, [zoomLevel]);

  // Desplazamiento sincronizado
  const handlePanelScroll = useCallback(
    (source: 1 | 2) => {
      if (!scrollSync || isScrollingRef.current) return;
      isScrollingRef.current = true;
      const src = source === 1 ? panel1Ref : panel2Ref;
      const tgt = source === 1 ? panel2Ref : panel1Ref;
      if (src.current && tgt.current) {
        const ratio =
          src.current.scrollTop / (src.current.scrollHeight - src.current.clientHeight || 1);
        tgt.current.scrollTop = ratio * (tgt.current.scrollHeight - tgt.current.clientHeight);
      }
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    },
    [scrollSync],
  );

  // Manejo interactivo de la cortina deslizante (Slider)
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) handleSliderMove(e.clientX);
    };
    const onMouseUp = () => setIsDraggingSlider(false);
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches[0]) handleSliderMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingSlider]);

  // Palabras con diferencias
  const allDiffWords: DiffWord[] = compareResult
    ? compareResult.pageDiffs.flatMap((p) => p.words.filter((w) => w.type !== 'equal'))
    : [];

  const filteredDiffWords = allDiffWords.filter((w) => {
    if (filterType === 'removed') return w.type === 'removed';
    if (filterType === 'added') return w.type === 'added';
    if (!searchQuery.trim()) return true;
    return w.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Navegación entre diferencias
  const gotoNextDiff = () => {
    if (filteredDiffWords.length === 0) return;
    const nextIdx = (activeDiffIdx + 1) % filteredDiffWords.length;
    setActiveDiffIdx(nextIdx);
    const target = filteredDiffWords[nextIdx];
    document
      .getElementById(`compare-page-${target.page}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (viewMode === 'slider' || viewMode === 'heatmap') {
      setSliderPage(target.page);
    }
  };

  const gotoPrevDiff = () => {
    if (filteredDiffWords.length === 0) return;
    const prevIdx = activeDiffIdx <= 0 ? filteredDiffWords.length - 1 : activeDiffIdx - 1;
    setActiveDiffIdx(prevIdx);
    const target = filteredDiffWords[prevIdx];
    document
      .getElementById(`compare-page-${target.page}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (viewMode === 'slider' || viewMode === 'heatmap') {
      setSliderPage(target.page);
    }
  };

  // Cancelar proceso
  const cancel = () => {
    workerRef.current?.postMessage({ type: 'cancel' });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsComparing(false);
    setProgressPercent(0);
    setProgressMsg('');
    toast.info(isEs ? 'Comparación cancelada' : 'Comparison cancelled');
  };

  // EJECUTAR COMPARACIÓN EMPRESARIAL
  const executeCompare = async () => {
    if (!fileA || !fileB) {
      toast.error(
        isEs
          ? 'Debes cargar ambos documentos (A y B) para iniciar la comparación'
          : 'Please load both documents (A and B) to start comparison',
      );
      return;
    }

    workerRef.current?.terminate();
    setIsComparing(true);
    setProgressPercent(0);
    setProgressPhase('hashing');
    setActiveDiffIdx(-1);

    const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);

    const worker = new Worker(new URL('../workers/pdf-compare.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    const options: CompareOptions = {
      sensitivity: compareSensitivity,
      ignoreCase,
      ignorePunctuation,
      enableVisualDiff,
    };

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgressPercent(msg.percent);
        setProgressMsg(msg.message);
        setProgressPhase(msg.phase);
      } else if (msg.type === 'result') {
        setCompareResult(msg);
        setProgressPercent(100);
        setIsComparing(false);
        toast.success(msg.summary);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === 'error') {
        toast.error(msg.message);
        setIsComparing(false);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === 'cancelled') {
        setIsComparing(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.postMessage({
      buffer1: bufA,
      buffer2: bufB,
      fileName1: fileA.name,
      fileName2: fileB.name,
      options,
    });
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (fileA && fileB && !isComparing) executeCompare();
      } else if (e.key === 'Escape') {
        if (isComparing) cancel();
        else if (zoomModalImage) setZoomModalImage(null);
      } else if (isCtrl && e.key === 'ArrowRight') {
        e.preventDefault();
        gotoNextDiff();
      } else if (isCtrl && e.key === 'ArrowLeft') {
        e.preventDefault();
        gotoPrevDiff();
      } else if (isCtrl && e.key === 's') {
        e.preventDefault();
        setScrollSync((prev) => !prev);
      } else if (isCtrl && e.key === 'f') {
        e.preventDefault();
        document.getElementById('cmp-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [fileA, fileB, isComparing, zoomModalImage, activeDiffIdx, filteredDiffWords]);

  // Descargar Reporte TXT
  const downloadTxtReport = () => {
    if (!compareResult) return;
    const lines: string[] = [
      'PDFBLACK - INFORME FORENSE DE COMPARACIÓN DE DOCUMENTOS PDF',
      '='.repeat(70),
      `Fecha de auditoría: ${new Date().toLocaleString()}`,
      `Documento Base (A): ${compareResult.fileName1} (${compareResult.totalPages1} págs.)`,
      `Documento Modificado (B): ${compareResult.fileName2} (${compareResult.totalPages2} págs.)`,
      '',
      'HASHES CRIPTOGRÁFICOS SHA-256 (INTEGRIDAD LEGAL)',
      '-'.repeat(70),
      `SHA-256 Doc A: ${compareResult.checksum1}`,
      `SHA-256 Doc B: ${compareResult.checksum2}`,
      '',
      'RESUMEN EJECUTIVO',
      '-'.repeat(70),
      compareResult.summary,
      `Similitud Global: ${compareResult.globalSimilarityPercent}%`,
      `Palabras Eliminadas: ${compareResult.totalRemovals}`,
      `Palabras Añadidas: ${compareResult.totalAdditions}`,
      `Palabras Sin Cambios: ${compareResult.totalUnchanged}`,
      `Páginas con Modificaciones Visuales: ${compareResult.pagesWithVisualChanges}`,
      '',
    ];

    if (compareResult.structuralDiffs.length > 0) {
      lines.push('ALTERACIONES ESTRUCTURALES Y METADATOS:', '-'.repeat(70));
      compareResult.structuralDiffs.forEach((sd) => {
        lines.push(
          `  [${sd.category.toUpperCase()}] ${sd.description} ${sd.detail ? `(${sd.detail})` : ''}`,
        );
      });
      lines.push('');
    }

    lines.push('DETALLE PÁGINA POR PÁGINA:', '-'.repeat(70));
    compareResult.pageDiffs.forEach((pd) => {
      if (!pd.removedCount && !pd.addedCount && !pd.hasVisualChanges) return;
      lines.push(
        `\n[Página ${pd.page}] Similitud: ${pd.similarityPercent}% | -${pd.removedCount} / +${pd.addedCount}`,
      );
      if (pd.dimensionChange) lines.push(`  Dimensión alterada: ${pd.dimensionChange}`);
      if (pd.hasVisualChanges)
        lines.push(`  Diferencia visual estimada: ${(pd.visualDiffRatio * 100).toFixed(1)}%`);
      if (pd.fontChanges?.length) lines.push(`  Fuentes: ${pd.fontChanges.join(', ')}`);

      const sampleWords = pd.words.filter((w) => w.type !== 'equal').slice(0, 15);
      sampleWords.forEach((w) => {
        lines.push(`    ${w.type === 'removed' ? '[-]' : '[+]'} ${w.text}`);
      });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Comparacion_${fileA?.name.replace('.pdf', '') || 'DocA'}_vs_${fileB?.name.replace('.pdf', '') || 'DocB'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadBanner('txt');
    setTimeout(() => setDownloadBanner(null), 4000);
    toast.success(isEs ? 'Reporte de auditoría TXT descargado' : 'Audit TXT report downloaded');
  };

  // Descargar Reporte JSON
  const downloadJsonReport = () => {
    if (!compareResult) return;
    const jsonStr = JSON.stringify(
      {
        generator: 'PDFBlack Enterprise Comparison Engine v4.0',
        generatedAt: new Date().toISOString(),
        documentA: {
          name: compareResult.fileName1,
          pages: compareResult.totalPages1,
          sha256: compareResult.checksum1,
        },
        documentB: {
          name: compareResult.fileName2,
          pages: compareResult.totalPages2,
          sha256: compareResult.checksum2,
        },
        metrics: {
          globalSimilarityPercent: compareResult.globalSimilarityPercent,
          totalRemovals: compareResult.totalRemovals,
          totalAdditions: compareResult.totalAdditions,
          totalUnchanged: compareResult.totalUnchanged,
          pagesWithVisualChanges: compareResult.pagesWithVisualChanges,
        },
        structuralChanges: compareResult.structuralDiffs,
        pageBreakdown: compareResult.pageDiffs.map((p) => ({
          page: p.page,
          similarityPercent: p.similarityPercent,
          removedCount: p.removedCount,
          addedCount: p.addedCount,
          hasVisualChanges: p.hasVisualChanges,
          visualDiffRatio: p.visualDiffRatio,
          dimensionChange: p.dimensionChange,
          fontChanges: p.fontChanges,
        })),
      },
      null,
      2,
    );

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_${fileA?.name.replace('.pdf', '') || 'DocA'}_vs_${fileB?.name.replace('.pdf', '') || 'DocB'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadBanner('json');
    setTimeout(() => setDownloadBanner(null), 4000);
    toast.success(
      isEs ? 'Reporte JSON estructurado descargado' : 'Structured JSON report downloaded',
    );
  };

  // Descargar Reporte PDF Ejecutivo
  const downloadPdfReport = async () => {
    if (!compareResult) return;
    setIsGeneratingPdfReport(true);

    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      let page = doc.addPage([612, 792]); // Carta Portrait
      const { height } = page.getSize();
      const margin = 45;
      let y = height - margin;
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      const checkPageBreak = (neededHeight: number) => {
        if (y - neededHeight < margin) {
          page = doc.addPage([612, 792]);
          y = height - margin;
        }
      };

      // Sanitizador universal para StandardFonts.Helvetica (WinAnsi encoding)
      const sanitizeForPdf = (input: string): string => {
        if (!input) return '';
        // 1. Reemplazar saltos de línea y tabulaciones con espacios limpios
        let str = input.replace(/[\r\n\t]+/g, ' ');
        // 2. Mapear flechas, viñetas y caracteres no-ASCII comunes
        str = str
          .replace(/→/g, '->')
          .replace(/←/g, '<-')
          .replace(/↔/g, '<->')
          .replace(/⇒/g, '=>')
          .replace(/[•●▪]/g, '*')
          .replace(/[—–]/g, '-')
          .replace(/[“”]/g, '"')
          .replace(/[‘’]/g, "'")
          .replace(/≠/g, '!=')
          .replace(/≤/g, '<=')
          .replace(/≥/g, '>=')
          .replace(/±/g, '+/-')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/');

        // 3. Filtrar cualquier carácter incompatible con WinAnsi
        let safe = '';
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          try {
            font.encodeText(ch);
            safe += ch;
          } catch {
            safe += ' ';
          }
        }
        return safe.trim();
      };

      const drawText = (
        text: string,
        opts: { size?: number; isBold?: boolean; color?: [number, number, number] } = {},
      ) => {
        const clean = sanitizeForPdf(text);
        if (!clean) return;
        const sz = opts.size || 9;
        const f = opts.isBold ? fontBold : font;
        const clr = opts.color
          ? rgb(opts.color[0], opts.color[1], opts.color[2])
          : rgb(0.1, 0.1, 0.1);
        try {
          page.drawText(clean, { x: margin, y, size: sz, font: f, color: clr });
        } catch {
          const ultraSafe = clean.replace(/[^\x20-\x7E]/g, ' ');
          page.drawText(ultraSafe, { x: margin, y, size: sz, font: f, color: clr });
        }
        y -= sz + 4;
      };

      // Título
      drawText('PDFBLACK ENTERPRISE - INFORME DE COMPARACION FORENSE', {
        size: 14,
        isBold: true,
        color: [0, 0, 0],
      });
      drawText(`Fecha de emision: ${new Date().toLocaleString()}`, {
        size: 8,
        color: [0.4, 0.4, 0.4],
      });
      y -= 8;

      // Resumen Documentos
      drawText('1. IDENTIFICACION Y REGISTRO DE INTEGRIDAD (SHA-256)', {
        size: 10,
        isBold: true,
      });
      drawText(`Doc A (Base): ${compareResult.fileName1} (${compareResult.totalPages1} paginas)`, {
        size: 8,
      });
      drawText(`Hash SHA-256 A: ${compareResult.checksum1}`, {
        size: 7,
        color: [0.3, 0.3, 0.3],
      });
      y -= 3;
      drawText(
        `Doc B (Modificado): ${compareResult.fileName2} (${compareResult.totalPages2} paginas)`,
        {
          size: 8,
        },
      );
      drawText(`Hash SHA-256 B: ${compareResult.checksum2}`, {
        size: 7,
        color: [0.3, 0.3, 0.3],
      });
      y -= 10;

      // Métricas Ejecutivas
      drawText('2. RESUMEN EJECUTIVO DE CAMBIOS', { size: 10, isBold: true });
      drawText(`Similitud Global: ${compareResult.globalSimilarityPercent}%`, {
        size: 9,
        isBold: true,
      });
      drawText(
        `Discrepancias lexicas: -${compareResult.totalRemovals} palabras eliminadas / +${compareResult.totalAdditions} palabras anadidas`,
        { size: 8 },
      );
      drawText(`Palabras identicas sin cambio: ${compareResult.totalUnchanged}`, { size: 8 });
      drawText(`Paginas con variaciones visuales: ${compareResult.pagesWithVisualChanges}`, {
        size: 8,
      });
      y -= 10;

      // Estructurales
      if (compareResult.structuralDiffs.length > 0) {
        checkPageBreak(80);
        drawText('3. ALTERACIONES ESTRUCTURALES DETECTADAS', { size: 10, isBold: true });
        compareResult.structuralDiffs.forEach((sd) => {
          checkPageBreak(16);
          drawText(`* [${sd.category.toUpperCase()}] ${sd.description}`, { size: 8 });
        });
        y -= 10;
      }

      // Detalle páginas
      checkPageBreak(60);
      drawText('4. REGISTRO DETALLADO POR PAGINA', { size: 10, isBold: true });
      compareResult.pageDiffs.forEach((pd) => {
        if (!pd.removedCount && !pd.addedCount && !pd.hasVisualChanges) return;
        checkPageBreak(35);
        drawText(
          `Pag. ${pd.page}: Similitud ${pd.similarityPercent}% | -${pd.removedCount} / +${pd.addedCount} ${pd.hasVisualChanges ? '* [CAMBIO VISUAL]' : ''}`,
          { size: 8, isBold: true },
        );

        const sampleWords = pd.words.filter((w) => w.type !== 'equal').slice(0, 4);
        sampleWords.forEach((w) => {
          checkPageBreak(14);
          drawText(`   ${w.type === 'removed' ? '[-]' : '[+]'} ${w.text.slice(0, 95)}`, {
            size: 7,
            color: w.type === 'removed' ? [0.8, 0.2, 0.2] : [0.1, 0.6, 0.2],
          });
        });
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const safeNameA = (fileA?.name || 'DocA').replace(/\.pdf$/i, '').replace(/[^\w.-]/g, '_');
      const safeNameB = (fileB?.name || 'DocB').replace(/\.pdf$/i, '').replace(/[^\w.-]/g, '_');
      const filename = `Reporte_Comparacion_${safeNameA}_vs_${safeNameB}.pdf`;

      // 1. Disparo directo de descarga en el navegador
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 2. Banner de confirmación visual
      setDownloadBanner('pdf');
      setTimeout(() => setDownloadBanner(null), 5000);

      // 3. Guardar estado de resultado completo y transicionar a pantalla de éxito
      setCompletedResult({
        downloadUrl: url,
        filename,
        fileSize: fmtSize(blob.size),
        rawBlob: blob,
        globalSimilarityPercent: compareResult.globalSimilarityPercent,
        totalRemovals: compareResult.totalRemovals,
        totalAdditions: compareResult.totalAdditions,
        totalUnchanged: compareResult.totalUnchanged,
        modifiedPages: compareResult.pageDiffs.filter((p) => p.removedCount + p.addedCount > 0)
          .length,
        visualChanges: compareResult.pagesWithVisualChanges,
        structuralChanges: compareResult.structuralDiffs.length,
        summary: compareResult.summary,
      });

      // Llevar de inmediato al usuario a la pantalla de éxito
      setShowSuccessView(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        successContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);

      toast.success(
        isEs
          ? '¡Reporte PDF ejecutivo descargado con éxito!'
          : 'Executive PDF report downloaded successfully!',
      );
    } catch (e: any) {
      console.error('Error generating PDF comparison report:', e);
      toast.error(
        isEs
          ? `Error al generar PDF: ${e?.message || 'Error desconocido'}`
          : `PDF error: ${e?.message || 'Unknown error'}`,
      );
    } finally {
      setIsGeneratingPdfReport(false);
    }
  };

  const maxPages = Math.max(totalPages1, totalPages2);
  const activeWord = filteredDiffWords[activeDiffIdx] || null;

  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      {/* Inputs ocultos para carga de archivos */}
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        ref={fileAInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFileA(e.target.files[0]);
            setCompareResult(null);
            setCompletedResult(null);
            setShowSuccessView(false);
          }
          e.target.value = '';
        }}
      />
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        ref={fileBInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFileB(e.target.files[0]);
            setCompareResult(null);
            setCompletedResult(null);
            setShowSuccessView(false);
          }
          e.target.value = '';
        }}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700/80 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
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
              004 / COMPARACIÓN Y CONTROL DE DIFERENCIAS EN PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <GitCompare className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'COMPARAR Y DETECTAR DIFERENCIAS EN PDF'
                  : 'COMPARE AND DETECT DIFFERENCES IN PDF'}
              </span>
            </h1>
          </div>
        </div>

        {(fileA || fileB) && (
          <div className="flex items-center gap-2 font-mono">
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white">
              <FileText className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold">
                {[fileA, fileB].filter(Boolean).length} / 2 {isEs ? 'documentos' : 'docs'}
              </span>
            </div>
            <button
              onClick={handleSwap}
              disabled={!fileA || !fileB}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl transition-all cursor-pointer disabled:opacity-40"
              title={isEs ? 'Intercambiar Documento A y B' : 'Swap Document A & B'}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <button
              onClick={resetAll}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Eliminar ambos archivos' : 'Clear both files'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* CASO 1: NINGÚN ARCHIVO CARGADO (DROPZONE INICIAL DUAL) */}
      {!fileA && !fileB ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileAInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dropped = Array.from(e.dataTransfer.files).filter(
              (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
            );
            if (dropped.length >= 2) {
              setFileA(dropped[0]);
              setFileB(dropped[1]);
              setCompareResult(null);
              setCompletedResult(null);
              if (dropped.length > 2) {
                toast.info(
                  isEs
                    ? 'Solo se comparan 2 documentos. Se han asignado los dos primeros.'
                    : 'Only 2 documents can be compared. The first two have been assigned.',
                );
              } else {
                toast.success(
                  isEs
                    ? '2 documentos cargados: Doc A y Doc B listos para comparar'
                    : '2 documents loaded: Doc A & Doc B ready for comparison',
                );
              }
            } else if (dropped.length === 1) {
              setFileA(dropped[0]);
              toast.success(
                isEs
                  ? 'Documento A cargado. Ahora carga el Documento B.'
                  : 'Document A loaded. Now upload Document B.',
              );
            } else {
              toast.error(isEs ? 'Solo se permiten archivos PDF' : 'Only PDF files are allowed');
            }
          }}
          className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[520px]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <GitCompare className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de Comparación Forense v4.0 • 100% Local'
                : 'Forensic Comparison Engine v4.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'COMPARA Y DETECTA DIFERENCIAS EN CUALQUIER PDF'
              : 'COMPARE AND DETECT DIFFERENCES IN ANY PDF'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Analiza dos versiones de un PDF al instante: texto añadido, eliminado, alteraciones visuales y cambios estructurales. Procesamiento forense seguro en la RAM de tu navegador sin subir tus archivos a internet.'
              : 'Analyze two versions of a PDF instantly: added text, deleted text, visual shifts and structural changes. Secure forensic processing in local RAM without cloud uploads.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar Dos Archivos PDF (A y B)' : 'Select Two PDF Files (A & B)'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Lado a Lado & Cortina' : '✓ Split & Curtain Slider'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Desplazamiento sincronizado y cortina deslizante antes/después.'
                  : 'Synchronized scrolling and before/after curtain slider.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Myers Diff & Heatmap' : '✓ Myers Diff & Heatmap'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Detección exacta de palabras y mapa de calor visual pixel a pixel.'
                  : 'Exact word diff and pixel-by-pixel visual heatmap overlay.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Auditoría SHA-256' : '✓ SHA-256 Audit'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Hashes criptográficos para validez pericial y compliance legal.'
                  : 'Cryptographic hashes for legal compliance and forensic trails.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult && showSuccessView ? (
        /* CASO 2: PANTALLA DE ÉXITO CON DESCARGA DE REPORTE */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BOTÓN SUPERIOR PARA VOLVER AL VISUALIZADOR DE DIFERENCIAS */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowSuccessView(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-mono text-xs transition cursor-pointer shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 text-[#FAF6EE] group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-bold">
                {isEs
                  ? '← Volver al Visualizador de Diferencias (Doc A vs Doc B)'
                  : '← Back to Difference Viewer (Doc A vs Doc B)'}
              </span>
            </button>
          </div>

          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-2xl text-white shadow-md">
                  <CheckCircle2 className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE COMPARACIÓN FORENSE' : 'FORENSIC COMPARISON RESULT'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans uppercase">
                    {isEs ? '¡Reporte de Comparación Generado!' : 'Comparison Report Generated!'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {completedResult.summary}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-zinc-300 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <span>{isEs ? 'Auditoría Certificada' : 'Certified Audit'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Similitud Global' : 'Global Similarity'}
                </span>
                <span className="text-white font-bold text-xl font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.globalSimilarityPercent} suffix="%" />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Palabras Eliminadas' : 'Words Removed'}
                </span>
                <span className="text-red-400 font-bold text-xl font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.totalRemovals} prefix="-" />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Palabras Añadidas' : 'Words Added'}
                </span>
                <span className="text-emerald-400 font-bold text-xl font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.totalAdditions} prefix="+" />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Sin Cambios' : 'Unchanged'}
                </span>
                <span className="text-zinc-300 font-bold text-xl font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.totalUnchanged} />
                </span>
              </div>
            </div>
          </div>

          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            rawBlob={completedResult.rawBlob}
            outputFormat="pdf"
            onReset={resetAll}
            title={isEs ? '¡Reporte PDF de Comparación Listo!' : 'PDF Comparison Report Ready!'}
            currentToolId="comparar"
          />
        </motion.div>
      ) : (
        /* CASO 3: PANEL OPERATIVO CON 2 DOCUMENTOS (DOC A vs DOC B) */
        <div className="space-y-6">
          {/* BANNER INFORMATIVO DE DESCARGAS */}
          <AnimatePresence>
            {downloadBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-400 font-mono shadow-lg"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    {downloadBanner === 'txt'
                      ? isEs
                        ? 'Informe TXT descargado con éxito.'
                        : 'TXT audit report downloaded successfully.'
                      : downloadBanner === 'json'
                        ? isEs
                          ? 'Informe JSON estructurado descargado con éxito.'
                          : 'Structured JSON report downloaded successfully.'
                        : isEs
                          ? 'Reporte PDF ejecutivo descargado con éxito.'
                          : 'Executive PDF report downloaded successfully.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {completedResult && (
                    <button
                      type="button"
                      onClick={() => setShowSuccessView(true)}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-lg text-[11px] transition cursor-pointer"
                    >
                      {isEs ? 'Ver Certificado' : 'View Certificate'}
                    </button>
                  )}
                  <button
                    onClick={() => setDownloadBanner(null)}
                    className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECCIÓN 1: TARJETAS DUALES DE DOCUMENTOS A Y B */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* TARJETA DOCUMENTO A (BASE / ORIGINAL) */}
            <div
              onClick={() => {
                if (!fileA) fileAInputRef.current?.click();
                else setViewMode('docA');
              }}
              className={`md:col-span-5 rounded-2xl border-2 p-4 transition-all relative overflow-hidden cursor-pointer ${
                fileA
                  ? 'bg-[#121217] border-red-500/40 hover:border-red-400 shadow-md'
                  : 'bg-[#0e0e12] border-dashed border-zinc-800 hover:border-red-400/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                  {isEs ? 'Doc A (Versión Base / Original)' : 'Doc A (Base / Original)'}
                </span>
                {fileA && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {totalPages1} {isEs ? 'págs.' : 'pages'}
                  </span>
                )}
              </div>

              {fileA ? (
                <div className="flex items-center justify-between gap-3 font-mono">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[240px] font-sans">
                        {fileA.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">{fmtSize(fileA.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileAInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 transition"
                      title={isEs ? 'Cambiar archivo' : 'Change file'}
                    >
                      {isEs ? 'Cambiar' : 'Change'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileA(null);
                        setCanvas1Urls({});
                        setTotalPages1(0);
                        setCompareResult(null);
                      }}
                      className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition"
                      title={isEs ? 'Quitar archivo' : 'Remove file'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center flex flex-col items-center justify-center gap-1">
                  <Plus className="w-6 h-6 text-zinc-500 mb-1" />
                  <p className="text-xs font-bold text-zinc-400 font-sans">
                    {isEs ? '+ Cargar Documento Base (A)' : '+ Upload Base Document (A)'}
                  </p>
                  <span className="text-[10px] text-zinc-600 font-mono">.pdf</span>
                </div>
              )}
            </div>

            {/* BOTÓN CENTRAL DE INTERCAMBIO (SWAP ⇄) */}
            <div className="md:col-span-2 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                disabled={!fileA || !fileB}
                className="p-3 bg-[#18181f] hover:bg-zinc-800 text-white rounded-2xl border border-zinc-700 hover:border-white shadow-xl transition-all cursor-pointer flex flex-col items-center gap-1 group disabled:opacity-40"
                title={isEs ? 'Intercambiar Documento A y B' : 'Swap Document A & B'}
              >
                <ArrowLeftRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300 text-white" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  {isEs ? 'Swap A ⇄ B' : 'Swap A ⇄ B'}
                </span>
              </button>
            </div>

            {/* TARJETA DOCUMENTO B (MODIFICADO / REVISADO) */}
            <div
              onClick={() => {
                if (!fileB) fileBInputRef.current?.click();
                else setViewMode('docB');
              }}
              className={`md:col-span-5 rounded-2xl border-2 p-4 transition-all relative overflow-hidden cursor-pointer ${
                fileB
                  ? 'bg-[#121217] border-emerald-500/40 hover:border-emerald-400 shadow-md'
                  : 'bg-[#0e0e12] border-dashed border-zinc-800 hover:border-emerald-400/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  {isEs ? 'Doc B (Versión Modificada / Revisada)' : 'Doc B (Modified / Revised)'}
                </span>
                {fileB && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {totalPages2} {isEs ? 'págs.' : 'pages'}
                  </span>
                )}
              </div>

              {fileB ? (
                <div className="flex items-center justify-between gap-3 font-mono">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[240px] font-sans">
                        {fileB.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">{fmtSize(fileB.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileBInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 transition"
                      title={isEs ? 'Cambiar archivo' : 'Change file'}
                    >
                      {isEs ? 'Cambiar' : 'Change'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileB(null);
                        setCanvas2Urls({});
                        setTotalPages2(0);
                        setCompareResult(null);
                      }}
                      className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition"
                      title={isEs ? 'Quitar archivo' : 'Remove file'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center flex flex-col items-center justify-center gap-1">
                  <Plus className="w-6 h-6 text-zinc-500 mb-1" />
                  <p className="text-xs font-bold text-zinc-400 font-sans">
                    {isEs ? '+ Cargar Documento Modificado (B)' : '+ Upload Modified Document (B)'}
                  </p>
                  <span className="text-[10px] text-zinc-600 font-mono">.pdf</span>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: VISOR COMPARATIVO MULTI-MODAL */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Barra Superior del Visor */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800 font-mono text-xs">
              {/* Selector de Modo de Visualización */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-full overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'split'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Lado a Lado' : 'Split View'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'slider'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Cortina Deslizante' : 'Curtain Slider'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('heatmap')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'heatmap'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Mapa de Calor' : 'Heatmap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('docA')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === 'docA'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isEs ? 'Solo Doc A' : 'Doc A Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('docB')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === 'docB'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isEs ? 'Solo Doc B' : 'Doc B Only'}
                </button>
              </div>

              {/* Controles de Zoom y Sincronización */}
              <div className="flex items-center gap-2">
                {viewMode === 'split' && (
                  <button
                    type="button"
                    onClick={() => setScrollSync(!scrollSync)}
                    className={`p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      scrollSync
                        ? 'bg-white/10 border-white text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={isEs ? 'Sincronizar desplazamiento' : 'Sync scroll'}
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px]">
                      {isEs ? 'Scroll Sincronizado' : 'Sync Scroll'}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((p) => Math.max(p - 25, 25))}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition"
                    title={isEs ? 'Reducir zoom' : 'Zoom out'}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400 min-w-[36px] text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((p) => Math.min(p + 25, 250))}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition"
                    title={isEs ? 'Aumentar zoom' : 'Zoom in'}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const url = canvas1Urls[1] || canvas2Urls[1] || null;
                    if (url) setZoomModalImage(url);
                  }}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title={isEs ? 'Pantalla completa' : 'Fullscreen preview'}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR CENTRAL DEL VISOR SEGÚN MODO */}
            <div className="relative min-h-[460px]">
              {/* MODO 1: LADO A LADO (SPLIT VIEW) */}
              {viewMode === 'split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[55vh]">
                  {/* PANEL DOCUMENTO A */}
                  <div className="bg-[#09090b] border border-red-500/20 rounded-2xl overflow-hidden flex flex-col h-full shadow-inner">
                    <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="text-xs font-bold text-red-400 font-mono uppercase">
                          {isEs ? 'Doc A (Base - Eliminaciones)' : 'Doc A (Base - Removals)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {totalPages1} {isEs ? 'págs.' : 'pages'}
                      </span>
                    </div>

                    <div
                      ref={panel1Ref}
                      onScroll={() => handlePanelScroll(1)}
                      className="flex-1 bg-[#121215] overflow-y-auto p-4 flex flex-col items-center gap-4 custom-scrollbar"
                    >
                      {Array.from({ length: maxPages }, (_, i) => i + 1).map((pNum) => (
                        <div
                          key={pNum}
                          id={`compare-page-${pNum}`}
                          className="w-full max-w-lg relative flex flex-col items-center"
                          data-observe="doc1"
                          data-page={pNum}
                        >
                          {/* Resaltado de eliminaciones en rojo sobre la página */}
                          {compareResult &&
                            pNum <= totalPages1 &&
                            (() => {
                              const removedWords =
                                compareResult.pageDiffs
                                  .find((pd) => pd.page === pNum)
                                  ?.words.filter((w) => w.type === 'removed') || [];

                              return removedWords.length > 0 ? (
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                  {removedWords.map((w, idx) => (
                                    <div
                                      key={idx}
                                      className={`absolute bg-red-500/40 border border-red-400/60 rounded-sm transition-all ${
                                        activeDiffIdx >= 0 && filteredDiffWords[activeDiffIdx] === w
                                          ? 'ring-2 ring-red-400 bg-red-500/70 scale-105 z-20 shadow-lg'
                                          : ''
                                      }`}
                                      style={
                                        w.bbox
                                          ? {
                                              left: `${w.bbox.x * (zoomLevel / 100)}px`,
                                              top: `${w.bbox.y * (zoomLevel / 100)}px`,
                                              width: `${w.bbox.width * (zoomLevel / 100)}px`,
                                              height: `${w.bbox.height * (zoomLevel / 100)}px`,
                                            }
                                          : {
                                              left: '5%',
                                              top: `${5 + (idx % 10) * 8}%`,
                                              width: '90%',
                                              height: '6%',
                                            }
                                      }
                                      title={`Eliminado: ${w.text}`}
                                    />
                                  ))}
                                </div>
                              ) : null;
                            })()}

                          {canvas1Urls[pNum] ? (
                            <img
                              src={canvas1Urls[pNum]}
                              alt={`Doc A Page ${pNum}`}
                              className="w-full h-auto rounded-xl shadow-lg border border-zinc-800 bg-white"
                            />
                          ) : pNum <= totalPages1 ? (
                            <div className="w-full h-72 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 text-xs font-mono">
                              {isEs ? 'Cargando página A...' : 'Loading page A...'}
                            </div>
                          ) : (
                            <div className="w-full h-72 bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-xs font-mono">
                              {isEs
                                ? 'Página no existente en Documento A'
                                : 'Page does not exist in Document A'}
                            </div>
                          )}
                          <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                            {isEs ? 'Página' : 'Page'} {pNum}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PANEL DOCUMENTO B */}
                  <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl overflow-hidden flex flex-col h-full shadow-inner">
                    <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 font-mono uppercase">
                          {isEs
                            ? 'Doc B (Modificado - Inserciones)'
                            : 'Doc B (Modified - Additions)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {totalPages2} {isEs ? 'págs.' : 'pages'}
                      </span>
                    </div>

                    <div
                      ref={panel2Ref}
                      onScroll={() => handlePanelScroll(2)}
                      className="flex-1 bg-[#121215] overflow-y-auto p-4 flex flex-col items-center gap-4 custom-scrollbar"
                    >
                      {Array.from({ length: maxPages }, (_, i) => i + 1).map((pNum) => (
                        <div
                          key={pNum}
                          className="w-full max-w-lg relative flex flex-col items-center"
                          data-observe="doc2"
                          data-page={pNum}
                        >
                          {/* Resaltado de adiciones en verde sobre la página */}
                          {compareResult &&
                            pNum <= totalPages2 &&
                            (() => {
                              const addedWords =
                                compareResult.pageDiffs
                                  .find((pd) => pd.page === pNum)
                                  ?.words.filter((w) => w.type === 'added') || [];

                              return addedWords.length > 0 ? (
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                  {addedWords.map((w, idx) => (
                                    <div
                                      key={idx}
                                      className={`absolute bg-emerald-500/40 border border-emerald-400/60 rounded-sm transition-all ${
                                        activeDiffIdx >= 0 && filteredDiffWords[activeDiffIdx] === w
                                          ? 'ring-2 ring-emerald-400 bg-emerald-500/70 scale-105 z-20 shadow-lg'
                                          : ''
                                      }`}
                                      style={
                                        w.bbox
                                          ? {
                                              left: `${w.bbox.x * (zoomLevel / 100)}px`,
                                              top: `${w.bbox.y * (zoomLevel / 100)}px`,
                                              width: `${w.bbox.width * (zoomLevel / 100)}px`,
                                              height: `${w.bbox.height * (zoomLevel / 100)}px`,
                                            }
                                          : {
                                              left: '5%',
                                              top: `${5 + (idx % 10) * 8}%`,
                                              width: '90%',
                                              height: '6%',
                                            }
                                      }
                                      title={`Añadido: ${w.text}`}
                                    />
                                  ))}
                                </div>
                              ) : null;
                            })()}

                          {canvas2Urls[pNum] ? (
                            <img
                              src={canvas2Urls[pNum]}
                              alt={`Doc B Page ${pNum}`}
                              className="w-full h-auto rounded-xl shadow-lg border border-zinc-800 bg-white"
                            />
                          ) : pNum <= totalPages2 ? (
                            <div className="w-full h-72 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 text-xs font-mono">
                              {isEs ? 'Cargando página B...' : 'Loading page B...'}
                            </div>
                          ) : (
                            <div className="w-full h-72 bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-xs font-mono">
                              {isEs
                                ? 'Página no existente en Documento B'
                                : 'Page does not exist in Document B'}
                            </div>
                          )}
                          <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                            {isEs ? 'Página' : 'Page'} {pNum}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODO 2: CORTINA DESLIZANTE (INTERACTIVE DIFF SLIDER) */}
              {viewMode === 'slider' && (
                <div className="flex flex-col items-center gap-4">
                  {/* Selector de página para la cortina */}
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl font-mono text-xs">
                    <button
                      type="button"
                      disabled={sliderPage <= 1}
                      onClick={() => setSliderPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300"
                    >
                      <ChevronUp className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-white font-bold">
                      {isEs ? 'Página' : 'Page'} {sliderPage} / {maxPages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={sliderPage >= maxPages}
                      onClick={() => setSliderPage((p) => Math.min(maxPages, p + 1))}
                      className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-[10px] text-zinc-400 border-l border-zinc-700 pl-3">
                      {isEs ? 'Arrastra la barra vertical para comparar' : 'Drag slider to compare'}
                    </span>
                  </div>

                  {/* Contenedor del Slider con clipPath */}
                  <div
                    ref={sliderContainerRef}
                    onMouseDown={() => setIsDraggingSlider(true)}
                    onTouchStart={() => setIsDraggingSlider(true)}
                    className="relative max-w-2xl w-full select-none cursor-ew-resize overflow-hidden rounded-2xl shadow-2xl border border-zinc-700 bg-zinc-950"
                  >
                    {/* Capa Inferior: Documento A */}
                    {canvas1Urls[sliderPage] ? (
                      <img
                        src={canvas1Urls[sliderPage]}
                        alt={`Doc A Page ${sliderPage}`}
                        className="w-full h-auto block pointer-events-none bg-white"
                      />
                    ) : (
                      <div className="w-full h-96 flex items-center justify-center text-zinc-500 font-mono text-xs">
                        {isEs ? 'Cargando Documento A...' : 'Loading Document A...'}
                      </div>
                    )}

                    {/* Capa Superior: Documento B (con clip-path recortado) */}
                    {canvas2Urls[sliderPage] && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                        }}
                      >
                        <img
                          src={canvas2Urls[sliderPage]}
                          alt={`Doc B Page ${sliderPage}`}
                          className="w-full h-auto block bg-white"
                        />
                      </div>
                    )}

                    {/* Línea divisoria y tirador del slider */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-xl flex items-center justify-center border-2 border-black/20">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Etiquetas indicadoras */}
                    <div className="absolute top-3 left-3 bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none font-mono">
                      Doc A (Original)
                    </div>
                    <div className="absolute top-3 right-3 bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none font-mono">
                      Doc B (Modificado)
                    </div>
                  </div>
                </div>
              )}

              {/* MODO 3: MAPA DE CALOR (HEATMAP OVERLAY) */}
              {viewMode === 'heatmap' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl font-mono text-xs">
                    <button
                      type="button"
                      disabled={sliderPage <= 1}
                      onClick={() => setSliderPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300"
                    >
                      <ChevronUp className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-white font-bold">
                      {isEs ? 'Página' : 'Page'} {sliderPage} / {maxPages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={sliderPage >= maxPages}
                      onClick={() => setSliderPage((p) => Math.min(maxPages, p + 1))}
                      className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-[10px] text-zinc-400 border-l border-zinc-700 pl-3">
                      {isEs ? 'Píxeles rojos = alteración visual' : 'Red pixels = visual diff'}
                    </span>
                  </div>

                  <div className="relative max-w-2xl w-full rounded-2xl shadow-2xl border border-zinc-700 bg-zinc-950 overflow-hidden">
                    {canvas2Urls[sliderPage] || canvas1Urls[sliderPage] ? (
                      <img
                        src={canvas2Urls[sliderPage] || canvas1Urls[sliderPage]}
                        alt={`Heatmap Page ${sliderPage}`}
                        className="w-full h-auto block bg-white opacity-90"
                      />
                    ) : (
                      <div className="w-full h-96 flex items-center justify-center text-zinc-500 font-mono text-xs">
                        {isEs ? 'Cargando página...' : 'Loading page...'}
                      </div>
                    )}

                    {/* Capa de heatmap si está disponible */}
                    {compareResult?.pageDiffs.find((p) => p.page === sliderPage)
                      ?.heatmapDataUrl && (
                      <img
                        src={
                          compareResult.pageDiffs.find((p) => p.page === sliderPage)!
                            .heatmapDataUrl!
                        }
                        alt="Heatmap overlay"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-multiply pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* MODO 4: SOLO DOCUMENTO A */}
              {viewMode === 'docA' && (
                <div className="flex flex-col items-center gap-4 max-h-[55vh] overflow-y-auto custom-scrollbar p-2">
                  {Array.from({ length: totalPages1 || 1 }, (_, i) => i + 1).map((pNum) => (
                    <div key={pNum} className="w-full max-w-xl flex flex-col items-center">
                      {canvas1Urls[pNum] ? (
                        <img
                          src={canvas1Urls[pNum]}
                          alt={`Doc A Page ${pNum}`}
                          className="w-full h-auto rounded-xl shadow-lg border border-zinc-800 bg-white"
                        />
                      ) : (
                        <div className="w-full h-80 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 font-mono text-xs">
                          {isEs ? 'Cargando...' : 'Loading...'}
                        </div>
                      )}
                      <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {isEs ? 'Página' : 'Page'} {pNum}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* MODO 5: SOLO DOCUMENTO B */}
              {viewMode === 'docB' && (
                <div className="flex flex-col items-center gap-4 max-h-[55vh] overflow-y-auto custom-scrollbar p-2">
                  {Array.from({ length: totalPages2 || 1 }, (_, i) => i + 1).map((pNum) => (
                    <div key={pNum} className="w-full max-w-xl flex flex-col items-center">
                      {canvas2Urls[pNum] ? (
                        <img
                          src={canvas2Urls[pNum]}
                          alt={`Doc B Page ${pNum}`}
                          className="w-full h-auto rounded-xl shadow-lg border border-zinc-800 bg-white"
                        />
                      ) : (
                        <div className="w-full h-80 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 font-mono text-xs">
                          {isEs ? 'Cargando...' : 'Loading...'}
                        </div>
                      )}
                      <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {isEs ? 'Página' : 'Page'} {pNum}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie del Visor con Nombres de Archivos y Similitud */}
            <div className="pt-3 mt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="text-red-400 font-bold truncate max-w-[200px]">
                  A: {fileA ? fileA.name : isEs ? 'Pendiente' : 'Pending'}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold truncate max-w-[200px]">
                  B: {fileB ? fileB.name : isEs ? 'Pendiente' : 'Pending'}
                </span>
              </div>
              {compareResult && (
                <span className="text-white font-bold bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full">
                  {compareResult.globalSimilarityPercent}%{' '}
                  {isEs ? 'similitud global' : 'similarity'}
                </span>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: PANEL DE CONTROL DE COMPARACIÓN Y OPCIONES AVANZADAS */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                  002 / CONTROL FORENSE Y PARÁMETROS DE COMPARACIÓN
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-white" />
                  <span>
                    {isEs ? 'MOTOR DE COMPARACIÓN EMPRESARIAL' : 'ENTERPRISE COMPARISON ENGINE'}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span
                    className={`w-2 h-2 rounded-full ${isComparing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`}
                  />
                  {isComparing
                    ? isEs
                      ? 'Procesando Myers Diff...'
                      : 'Processing Myers Diff...'
                    : isEs
                      ? 'Motor Listo'
                      : 'Engine Ready'}
                </span>
                <span className="flex items-center gap-1 text-white ml-3">
                  <Database className="w-3.5 h-3.5" />
                  100% Local (RAM)
                </span>
              </div>
            </div>

            {/* SI HAY RESULTADOS DE COMPARACIÓN: MÉTRICAS Y HASHES */}
            {compareResult && (
              <div className="mb-6 space-y-4 font-mono">
                {/* Hashes Criptográficos SHA-256 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 text-xs shadow-inner">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-500 font-bold">SHA-256 A:</span>
                    <span className="text-zinc-200 truncate">
                      {compareResult.checksum1.slice(0, 20)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(compareResult.checksum1);
                        toast.success('SHA-256 A copiado');
                      }}
                      className="ml-auto p-1 text-zinc-500 hover:text-white"
                      title="Copiar Hash A"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-500 font-bold">SHA-256 B:</span>
                    <span className="text-zinc-200 truncate">
                      {compareResult.checksum2.slice(0, 20)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(compareResult.checksum2);
                        toast.success('SHA-256 B copiado');
                      }}
                      className="ml-auto p-1 text-zinc-500 hover:text-white"
                      title="Copiar Hash B"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Métricas Numéricas Principales */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-2xl p-3.5 text-center border border-zinc-700/80 bg-[#121217] shadow-inner">
                    <span className="font-bold text-2xl block text-white">
                      {compareResult.globalSimilarityPercent}%
                    </span>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                      {isEs ? 'Similitud Global' : 'Global Similarity'}
                    </span>
                  </div>
                  <div className="rounded-2xl p-3.5 text-center border border-zinc-700/80 bg-[#121217] shadow-inner">
                    <span className="text-white font-bold text-2xl block">
                      {compareResult.totalRemovals + compareResult.totalAdditions}
                    </span>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                      {isEs ? 'Cambios Totales' : 'Total Changes'}
                    </span>
                  </div>
                  <div className="rounded-2xl p-3.5 text-center border border-zinc-700/80 bg-[#121217] shadow-inner">
                    <span className="text-white font-bold text-2xl block">
                      {
                        compareResult.pageDiffs.filter((p) => p.removedCount + p.addedCount > 0)
                          .length
                      }
                    </span>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                      {isEs ? 'Páginas Modificadas' : 'Modified Pages'}
                    </span>
                  </div>
                  <div className="rounded-2xl p-3.5 text-center border border-zinc-700/80 bg-[#121217] shadow-inner">
                    <span className="text-white font-bold text-2xl block">
                      {compareResult.pagesWithVisualChanges}
                    </span>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                      {isEs ? 'Cambios Visuales' : 'Visual Changes'}
                    </span>
                  </div>
                </div>

                {/* Barra de Navegación Rápida entre Diferencias */}
                {filteredDiffWords.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121217] border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={gotoPrevDiff}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Anterior (Ctrl+←)"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">
                            {isEs ? 'Anterior' : 'Previous'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={gotoNextDiff}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Siguiente (Ctrl+→)"
                        >
                          <span className="text-[11px] font-bold">
                            {isEs ? 'Siguiente' : 'Next'}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-white font-bold bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/10">
                        {activeDiffIdx >= 0
                          ? `${isEs ? 'Cambio' : 'Diff'} ${activeDiffIdx + 1} / ${filteredDiffWords.length}`
                          : `${filteredDiffWords.length} ${isEs ? 'cambios' : 'diffs'}`}
                      </span>
                    </div>

                    {activeWord && (
                      <span
                        className={`px-3 py-1.5 rounded-xl font-bold truncate max-w-[280px] sm:max-w-[400px] ${
                          activeWord.type === 'removed'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {activeWord.type === 'removed' ? '- ' : '+ '}
                        {activeWord.text}
                      </span>
                    )}

                    <span className="text-zinc-500 text-[11px]">
                      {isEs ? 'Pág.' : 'Page'} {activeWord?.page || '1'}
                    </span>
                  </div>
                )}

                {/* Desplegable de Cambios Estructurales */}
                {compareResult.structuralDiffs.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowStructuralDiffs(!showStructuralDiffs)}
                      className="w-full flex items-center justify-between bg-[#121217] border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs text-zinc-300 hover:text-white transition cursor-pointer shadow-inner"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-bold">
                          {isEs
                            ? 'Alteraciones Estructurales y Metadatos Detectados'
                            : 'Structural & Metadata Alterations Detected'}
                        </span>{' '}
                        ({compareResult.structuralDiffs.length})
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showStructuralDiffs ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {showStructuralDiffs && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                            {compareResult.structuralDiffs.map((sd, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-zinc-300 bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-start gap-2"
                              >
                                <span className="font-bold text-amber-400 flex-shrink-0">
                                  [{sd.category.toUpperCase()}]
                                </span>
                                <div>
                                  <p className="text-white">{sd.description}</p>
                                  {sd.detail && (
                                    <p className="text-zinc-500 text-[10px] mt-0.5">{sd.detail}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* GRID DE PARÁMETROS Y BUSCADOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Opciones avanzadas de normalización */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono tracking-wider border-b border-zinc-800 pb-3 uppercase">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                  <span>{isEs ? 'OPCIONES DE ANÁLISIS FORENSE' : 'FORENSIC ANALYSIS OPTIONS'}</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                    {isEs ? 'Sensibilidad de Análisis' : 'Analysis Sensitivity'}
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {(['strict', 'normal', 'loose'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCompareSensitivity(s)}
                        className={`py-2 px-3 rounded-xl border font-bold transition-all cursor-pointer text-center ${
                          compareSensitivity === s
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-zinc-600'
                        }`}
                      >
                        {s === 'strict'
                          ? isEs
                            ? 'Estricta'
                            : 'Strict'
                          : s === 'normal'
                            ? isEs
                              ? 'Normal'
                              : 'Normal'
                            : isEs
                              ? 'Flexible'
                              : 'Loose'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-sans">
                  <div
                    onClick={() => setEnableVisualDiff((v) => !v)}
                    className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isEs ? 'Detección visual pixel a pixel' : 'Visual pixel diff'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {isEs
                          ? 'Compara imágenes, sellos y firmas'
                          : 'Compare graphics & signature shifts'}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${enableVisualDiff ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${enableVisualDiff ? 'left-4' : 'left-0.5'}`}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => setIgnoreCase((v) => !v)}
                    className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isEs ? 'Ignorar mayúsculas / minúsculas' : 'Ignore case differences'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {isEs ? 'Omite diferencias de capitalización' : 'Disregard letter casing'}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${ignoreCase ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${ignoreCase ? 'left-4' : 'left-0.5'}`}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => setIgnorePunctuation((v) => !v)}
                    className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isEs ? 'Ignorar puntuación' : 'Ignore punctuation'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {isEs ? 'Omite comas, puntos y guiones' : 'Skip commas, periods & hyphens'}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${ignorePunctuation ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${ignorePunctuation ? 'left-4' : 'left-0.5'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explorador reactivo de diferencias */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-5 space-y-4 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white font-mono tracking-wider uppercase">
                      <Search className="w-4 h-4 text-white" />
                      <span>{isEs ? 'EXPLORADOR DE CAMBIOS' : 'CHANGES EXPLORER'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFilterType('all')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                          filterType === 'all'
                            ? 'bg-white text-black font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isEs ? 'Todos' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('removed')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                          filterType === 'removed'
                            ? 'bg-red-500/20 border-red-500/40 text-red-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        - Del
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('added')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                          filterType === 'added'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Input de Búsqueda */}
                  <div className="relative mb-3 font-mono">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="cmp-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        isEs ? 'Buscar palabra o cláusula modificada...' : 'Search word or diff...'
                      }
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Lista de páginas y discrepancias */}
                  <div className="overflow-y-auto max-h-[190px] space-y-2 pr-1 custom-scrollbar">
                    {compareResult ? (
                      filteredDiffWords.length > 0 ? (
                        filteredDiffWords.slice(0, 35).map((w, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setActiveDiffIdx(i);
                              document
                                .getElementById(`compare-page-${w.page}`)
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              if (viewMode === 'slider' || viewMode === 'heatmap') {
                                setSliderPage(w.page);
                              }
                            }}
                            className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-between cursor-pointer transition ${
                              w.type === 'removed'
                                ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/50 text-red-300'
                                : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50 text-emerald-300'
                            }`}
                          >
                            <span className="truncate max-w-[280px]">
                              <span className="font-bold mr-1.5">
                                {w.type === 'removed' ? '[-]' : '[+]'}
                              </span>
                              {w.text}
                            </span>
                            <span className="text-[10px] text-zinc-500 flex-shrink-0">
                              {isEs ? 'Pág.' : 'Pg.'} {w.page}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                          {isEs
                            ? 'No se encontraron diferencias con ese filtro'
                            : 'No differences match filter'}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-zinc-500 font-mono text-xs">
                        {isEs
                          ? 'Inicia la comparación para explorar las discrepancias'
                          : 'Start comparison to explore differences'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Atajos de teclado desplegables */}
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-[11px] font-mono transition"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Ver atajos de teclado' : 'Keyboard shortcuts'}</span>
                  </button>
                  <AnimatePresence>
                    {showShortcuts && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2"
                      >
                        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono text-[10px]">
                          {[
                            ['Ctrl+Enter', isEs ? 'Comparar' : 'Compare'],
                            ['Esc', isEs ? 'Cancelar' : 'Cancel'],
                            ['Ctrl+←/→', isEs ? 'Navegar diffs' : 'Navigate diffs'],
                            ['Ctrl+S', isEs ? 'Sync scroll' : 'Sync scroll'],
                            ['Ctrl+F', isEs ? 'Buscar' : 'Search'],
                          ].map(([k, d]) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <kbd className="bg-zinc-800 border border-white/10 px-1.5 py-0.5 rounded text-white font-bold text-[9px]">
                                {k}
                              </kbd>
                              <span className="text-zinc-400">{d}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* BARRA DE PROGRESO DE COMPARACIÓN */}
            {isComparing && (
              <div className="mb-6 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="font-bold">
                      {progressMsg ||
                        (isEs ? 'Comparando documentos...' : 'Comparing documents...')}
                    </span>
                  </div>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={cancel}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-1.5 px-4 rounded-full text-xs transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Cancelar' : 'Cancel'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN PRINCIPALES Y DESCARGA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={executeCompare}
                  disabled={!fileA || !fileB || isRendering || isComparing}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-8 rounded-full text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg disabled:opacity-40"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>
                    {compareResult
                      ? isEs
                        ? 'Re-analizar Documentos'
                        : 'Re-analyze Documents'
                      : isEs
                        ? 'Comparar Documentos (A vs B)'
                        : 'Compare Documents (A vs B)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-full text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
                  title={isEs ? 'Reiniciar' : 'Reset'}
                >
                  <X className="w-4 h-4" />
                  <span>{isEs ? 'Reiniciar' : 'Reset'}</span>
                </button>
              </div>

              {compareResult && (
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={downloadTxtReport}
                    className="flex-1 sm:flex-initial bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 text-zinc-200 hover:text-white font-bold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-1.5 transition font-mono"
                    title={isEs ? 'Exportar auditoría en texto plano' : 'Export TXT audit'}
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadJsonReport}
                    className="flex-1 sm:flex-initial bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 text-zinc-200 hover:text-white font-bold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-1.5 transition font-mono"
                    title={isEs ? 'Exportar datos JSON estructurados' : 'Export JSON report'}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadPdfReport}
                    disabled={isGeneratingPdfReport}
                    className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-black font-extrabold text-xs py-3 px-6 rounded-full flex items-center justify-center gap-2 transition shadow-xl disabled:opacity-50 font-mono cursor-pointer"
                  >
                    {isGeneratingPdfReport ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>{isEs ? 'Generando PDF...' : 'Generating PDF...'}</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4 text-black" />
                        <span>
                          {isEs
                            ? 'Descargar Reporte PDF Ejecutivo'
                            : 'Download Executive PDF Report'}
                        </span>
                      </>
                    )}
                  </button>

                  {completedResult && (
                    <button
                      type="button"
                      onClick={() => setShowSuccessView(true)}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-[#E8DFCF]/30 hover:border-[#FAF6EE]/60 text-[#FAF6EE] font-bold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-1.5 transition font-mono cursor-pointer shadow-md"
                      title={
                        isEs
                          ? 'Ver certificado forense de auditoría'
                          : 'View forensic audit certificate'
                      }
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#FAF6EE]" />
                      <span>{isEs ? 'Ver Certificado' : 'View Certificate'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PREVIEW EN PANTALLA COMPLETA (ZOOM MODAL) */}
      {zoomModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-700 rounded-2xl p-2 overflow-auto shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomModalImage(null)}
              className="absolute top-3 right-3 p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-700 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomModalImage}
              alt="Zoom Preview"
              className="max-h-[82vh] w-auto object-contain rounded-lg bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
