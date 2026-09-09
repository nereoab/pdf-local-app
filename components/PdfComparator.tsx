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
  UploadCloud,
  Hash,
  Copy,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Keyboard,
  Filter,
  FileDown,
  SlidersHorizontal,
  ArrowLeft,
  Trash2,
  Maximize2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import type { CompareResult, CompareProgress, StructuralDiff } from '../workers/pdf-compare.worker';

// Sistema de slots unificado
interface SlotItem {
  id: number;
  file: File | null;
}

export default function PdfComparator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);

  const { globalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  // Sistema de 3 slots independientes
  const [slots, setSlots] = useState<SlotItem[]>(() => [
    { id: 1, file: globalFile || null },
    { id: 2, file: null },
    { id: 3, file: null },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'doc1' | 'doc2'>('split');

  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const slot3InputRef = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (idx: number) => {
    if (idx === 0) return slot1InputRef;
    if (idx === 1) return slot2InputRef;
    return slot3InputRef;
  };

  const [file1, setFile1] = useState<File | null>(() => globalFile || null);
  const [file2, setFile2] = useState<File | null>(null);

  // Sincronizar slots con file1 y file2 para el motor de comparación
  useEffect(() => {
    const f1 = slots[0]?.file || null;
    const f2 = slots[1]?.file || slots[2]?.file || null;
    setFile1(f1);
    setFile2(f2);
  }, [slots]);

  const loadSingleFileIntoSlot = (slotIdx: number, newFile: File) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], file: newFile };
      return next;
    });
    setActiveSlotIndex(slotIdx);
    setCompareResult(null);
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
    setCompareResult(null);
    setCompletedResult(null);
    if (activeSlotIndex === slotIdx) {
      const remainingIdx = [0, 1, 2].find((i) => i !== slotIdx && slots[i]?.file !== null);
      if (remainingIdx !== undefined) {
        setActiveSlotIndex(remainingIdx);
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
    reset();
  };

  const [dragOver1, setDragOver1] = useState(false);
  const [dragOver2, setDragOver2] = useState(false);
  const [canvas1Urls, setCanvas1Urls] = useState<Record<number, string>>({});
  const [canvas2Urls, setCanvas2Urls] = useState<Record<number, string>>({});
  const [totalPages1, setTotalPages1] = useState(0);
  const [totalPages2, setTotalPages2] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  // Estado de éxito para pantalla de descarga (como las otras herramientas)
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
  // Estado para banner de descarga completada
  const [downloadBanner, setDownloadBanner] = useState<'txt' | 'pdf' | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressPhase, setProgressPhase] = useState('');
  const [scrollSync, setScrollSync] = useState(true);
  const isScrollingRef = useRef(false);
  const [activeDiffIdx, setActiveDiffIdx] = useState(-1);
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const zoomRef = useRef(100);
  const [showStructuralDiffs, setShowStructuralDiffs] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isGeneratingPdfReport, setIsGeneratingPdfReport] = useState(false);
  const pdfDocRef = useRef<{ doc1: any; doc2: any } | null>(null);
  const renderedPagesRef = useRef<{ doc1: Set<number>; doc2: Set<number> }>({
    doc1: new Set(),
    doc2: new Set(),
  });

  // === OPCIONES AVANZADAS DE COMPARACIÓN (SIEMPRE VISIBLES) ===
  const [compareSensitivity, setCompareSensitivity] = useState<'strict' | 'normal' | 'loose'>(
    'normal',
  );
  const [enableVisualDiff, setEnableVisualDiff] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignorePunctuation, setIgnorePunctuation] = useState(false);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handlePanelScroll = useCallback(
    (source: 1 | 2) => {
      if (!scrollSync || isScrollingRef.current) return;
      isScrollingRef.current = true;
      const src = source === 1 ? panel1Ref : panel2Ref;
      const tgt = source === 1 ? panel2Ref : panel1Ref;
      if (src.current && tgt.current) {
        const r = src.current.scrollTop / (src.current.scrollHeight - src.current.clientHeight);
        tgt.current.scrollTop = r * (tgt.current.scrollHeight - tgt.current.clientHeight);
      }
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    },
    [scrollSync],
  );

  const allDiffWords = compareResult
    ? compareResult.pageDiffs.flatMap((p) => p.words.filter((w) => w.type !== 'equal'))
    : [];

  const gotoNextDiff = () => {
    if (allDiffWords.length === 0) return;
    const i = (activeDiffIdx + 1) % allDiffWords.length;
    setActiveDiffIdx(i);
    document
      .getElementById(`compare-page-${allDiffWords[i].page}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const gotoPrevDiff = () => {
    if (allDiffWords.length === 0) return;
    const i = activeDiffIdx <= 0 ? allDiffWords.length - 1 : activeDiffIdx - 1;
    setActiveDiffIdx(i);
    document
      .getElementById(`compare-page-${allDiffWords[i].page}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFile1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile1(e.target.files[0]);
      setCompareResult(null);
      setCompletedResult(null);
    }
    e.target.value = '';
  };
  const handleFile2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile2(e.target.files[0]);
      setCompareResult(null);
      setCompletedResult(null);
    }
    e.target.value = '';
  };

  const hdrOver = (e: React.DragEvent, z: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    z === 1 ? setDragOver1(true) : setDragOver2(true);
  };
  const hdrLeave = (e: React.DragEvent, z: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    z === 1 ? setDragOver1(false) : setDragOver2(false);
  };
  const hdrDrop = (e: React.DragEvent, z: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    z === 1 ? setDragOver1(false) : setDragOver2(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
      z === 1 ? setFile1(f) : setFile2(f);
      setCompareResult(null);
      setCompletedResult(null);
    } else {
      toast.error(isEs ? 'Solo PDF' : 'Only PDF');
    }
  };

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
    if (!file1 || !file2) return;
    loadDocs();
  }, [file1, file2]);

  const loadDocs = async () => {
    setIsRendering(true);
    setCompareResult(null);
    setCanvas1Urls({});
    setCanvas2Urls({});
    renderedPagesRef.current = { doc1: new Set(), doc2: new Set() };
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const [b1, b2] = await Promise.all([file1!.arrayBuffer(), file2!.arrayBuffer()]);
      if (!b1.byteLength || !b2.byteLength) {
        toast.error(isEs ? 'PDF vacio' : 'Empty PDF');
        setIsRendering(false);
        return;
      }
      const [d1, d2] = await Promise.all([
        pdfjsLib.getDocument({ data: b1.slice(0) }).promise,
        pdfjsLib.getDocument({ data: b2.slice(0) }).promise,
      ]);
      pdfDocRef.current = { doc1: d1, doc2: d2 };
      setTotalPages1(d1.numPages);
      setTotalPages2(d2.numPages);
    } catch (e: any) {
      const m = e?.message || '';
      if (m.includes('encrypt') || m.includes('password'))
        toast.error(isEs ? 'PDF cifrado' : 'Encrypted PDF');
      else toast.error(isEs ? 'Error al cargar PDF' : 'PDF load error');
    } finally {
      setIsRendering(false);
    }
  };

  const renderPage = useCallback(async (doc: any, n: number, setUrls: any, dk: string) => {
    if (renderedPagesRef.current[dk as 'doc1' | 'doc2'].has(n)) return;
    renderedPagesRef.current[dk as 'doc1' | 'doc2'].add(n);
    try {
      const s = (zoomRef.current / 100) * 1.5;
      const pg = await doc.getPage(n);
      const vp = pg.getViewport({ scale: s });
      const c = document.createElement('canvas');
      c.width = vp.width;
      c.height = vp.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        await pg.render({ canvasContext: ctx, viewport: vp } as any).promise;
        setUrls((prev: any) => ({ ...prev, [n]: c.toDataURL('image/jpeg', 0.85) }));
      }
    } catch {
      /* skip */
    }
  }, []);

  useEffect(() => {
    if (!pdfDocRef.current) return;
    const obs: IntersectionObserver[] = [];
    const so = (doc: any, su: any, dk: string) => {
      const o = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const p = parseInt(e.target.getAttribute('data-page') || '1');
              renderPage(doc, p, su, dk);
              o.unobserve(e.target);
            }
          });
        },
        { rootMargin: '200px 0px' },
      );
      document.querySelectorAll(`[data-observe="${dk}"]`).forEach((el) => o.observe(el));
      obs.push(o);
    };
    so(pdfDocRef.current.doc1, setCanvas1Urls, 'doc1');
    so(pdfDocRef.current.doc2, setCanvas2Urls, 'doc2');
    return () => obs.forEach((o) => o.disconnect());
  }, [totalPages1, totalPages2]);

  useEffect(() => {
    if (!pdfDocRef.current || !totalPages1) return;
    renderedPagesRef.current = { doc1: new Set(), doc2: new Set() };
    setCanvas1Urls({});
    setCanvas2Urls({});
    zoomRef.current = zoomLevel;
    setTimeout(
      () =>
        document
          .querySelectorAll('[data-observe]')
          .forEach((el) => el.dispatchEvent(new Event('reobserve', { bubbles: true }))),
      50,
    );
  }, [zoomLevel]);

  const cancel = () => {
    workerRef.current?.postMessage({ type: 'cancel' });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsComparing(false);
    setProgressPercent(0);
    setProgressMsg('');
    toast.info(isEs ? 'Cancelado' : 'Cancelled');
  };

  const executeCompare = async () => {
    if (!file1 || !file2) {
      toast.error(isEs ? 'Selecciona ambos PDF' : 'Select both PDFs');
      return;
    }
    workerRef.current?.terminate();
    setIsComparing(true);
    setProgressPercent(0);
    setProgressPhase('hashing');
    setActiveDiffIdx(-1);
    const [b1, b2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]);
    const w = new Worker(new URL('../workers/pdf-compare.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = w;
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') {
        setProgressPercent(m.percent);
        setProgressMsg(m.message);
        setProgressPhase(m.phase);
      } else if (m.type === 'result') {
        setCompareResult(m);
        setProgressPercent(100);
        setIsComparing(false);
        toast.success(m.summary);
        w.terminate();
        workerRef.current = null;
      } else if (m.type === 'error') {
        toast.error(m.message);
        setIsComparing(false);
        w.terminate();
        workerRef.current = null;
      } else if (m.type === 'cancelled') {
        setIsComparing(false);
        w.terminate();
        workerRef.current = null;
      }
    };
    w.onerror = () => {
      toast.error(isEs ? 'Error motor' : 'Engine error');
      setIsComparing(false);
    };
    w.postMessage({
      buffer1: b1.slice(0),
      buffer2: b2.slice(0),
      fileName1: file1.name,
      fileName2: file2.name,
    });
  };

  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const c = e.ctrlKey || e.metaKey;
      if (c && e.key === 'Enter') {
        e.preventDefault();
        if (!isComparing && file1 && file2) executeCompare();
      } else if (e.key === 'Escape') {
        if (isComparing) {
          e.preventDefault();
          cancel();
        }
      } else if (e.key === 'ArrowLeft' && c) {
        e.preventDefault();
        gotoPrevDiff();
      } else if (e.key === 'ArrowRight' && c) {
        e.preventDefault();
        gotoNextDiff();
      } else if (c && e.key === 'd') {
        e.preventDefault();
        if (compareResult) downloadReport();
      } else if (c && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoomLevel((p) => Math.min(p + 25, 300));
      } else if (c && e.key === '-') {
        e.preventDefault();
        setZoomLevel((p) => Math.max(p - 25, 25));
      } else if (c && e.key === '0') {
        e.preventDefault();
        setZoomLevel(100);
      } else if (c && e.key === 'f') {
        e.preventDefault();
        document.getElementById('cmp-search')?.focus();
      } else if (c && e.key === 's') {
        e.preventDefault();
        setScrollSync((p) => !p);
      }
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [isComparing, file1, file2, compareResult, activeDiffIdx, allDiffWords]);

  const reset = () => {
    setSlots([
      { id: 1, file: null },
      { id: 2, file: null },
      { id: 3, file: null },
    ]);
    setActiveSlotIndex(0);
    setFile1(null);
    setFile2(null);
    setCanvas1Urls({});
    setCanvas2Urls({});
    setTotalPages1(0);
    setTotalPages2(0);
    setCompareResult(null);
    setCompletedResult(null);
    setShowOnlyChanges(false);
    setActiveDiffIdx(-1);
    setSearchQuery('');
  };

  const downloadReport = () => {
    if (!compareResult) return;
    const l: string[] = [];
    l.push(
      'PDFBLACK - COMPARISON REPORT',
      '='.repeat(60),
      `Date: ${new Date().toISOString().split('T')[0]}`,
    );
    l.push(
      `A: ${compareResult.fileName1} (${compareResult.totalPages1} p.)`,
      `B: ${compareResult.fileName2} (${compareResult.totalPages2} p.)`,
    );
    l.push(
      '',
      `SHA-256 A: ${compareResult.checksum1}`,
      `SHA-256 B: ${compareResult.checksum2}`,
      '',
      compareResult.summary,
      '',
    );
    if (compareResult.structuralDiffs.length) {
      l.push('STRUCTURAL CHANGES:', '-'.repeat(40));
      compareResult.structuralDiffs.forEach((sd) => l.push(`  [${sd.category}] ${sd.description}`));
      l.push('');
    }
    l.push('PAGE DETAILS:', '-'.repeat(60));
    compareResult.pageDiffs.forEach((pd) => {
      if (!pd.removedCount && !pd.addedCount) return;
      l.push(
        `\n[Page ${pd.page}] Sim: ${pd.similarityPercent}% | -${pd.removedCount} / +${pd.addedCount}`,
      );
      (pd.blocks?.length
        ? pd.blocks.slice(0, 10)
        : pd.words.filter((w) => w.type !== 'equal').slice(0, 10)
      ).forEach((b: any) => {
        const t = b.text || b;
        const ty = b.type || (typeof b === 'object' ? b.type : 'removed');
        l.push(`  ${ty === 'removed' ? '-' : '+'} ${typeof t === 'string' ? t.slice(0, 100) : t}`);
      });
      if (pd.hasVisualChanges) l.push(`  Visual: ${(pd.visualDiffRatio * 100).toFixed(1)}% diff`);
      if (pd.fontChanges?.length) l.push(`  Fonts: ${pd.fontChanges.join(', ')}`);
    });
    const b = new Blob([l.join('\n')], { type: 'text/plain;charset=utf-8' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u;
    a.download = `Report_${file1?.name?.replace('.pdf', '') || 'PDF'}.txt`;
    a.click();
    URL.revokeObjectURL(u);
    setDownloadBanner('txt');
    setTimeout(() => setDownloadBanner(null), 4000);
    toast.success(isEs ? 'Reporte TXT descargado' : 'TXT report downloaded');
  };

  const downloadPdfReport = async () => {
    if (!compareResult) return;
    setIsGeneratingPdfReport(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      let pg = doc.addPage([612, 792]);
      const { height } = pg.getSize();
      const m = 50;
      let y = height - m;
      const lh = 14;
      const f = await doc.embedFont(StandardFonts.Helvetica);
      const fb = await doc.embedFont(StandardFonts.HelveticaBold);

      const sanitize = (t: string): string => {
        let s = '';
        for (let i = 0; i < t.length; i++) {
          const cp = t.codePointAt(i);
          if (cp === undefined) continue;
          if (cp <= 0xff) {
            if (
              cp === 0x09 ||
              cp === 0x0a ||
              cp === 0x0d ||
              (cp >= 0x20 && cp <= 0x7e) ||
              cp >= 0xa0
            )
              s += String.fromCodePoint(cp);
            if (cp > 0xffff) i++;
          } else {
            if (cp >= 0x2500 && cp <= 0x257f) s += '-';
            else if (cp === 0x2212) s += '-';
            else if (cp === 0xa9) s += '(c)';
            if (cp > 0xffff) i++;
          }
        }
        return s.replace(/\s+/g, ' ').trim();
      };

      const dt = (
        t: string,
        o?: { sz?: number; clr?: [number, number, number]; bld?: boolean },
      ) => {
        const st = sanitize(t);
        if (!st) return;
        if (y < m + 30) {
          pg = doc.addPage([612, 792]);
          y = height - m;
        }
        pg.drawText(st, {
          x: m,
          y,
          size: o?.sz || 10,
          font: o?.bld ? fb : f,
          color: rgb(o?.clr?.[0] || 0, o?.clr?.[1] || 0, o?.clr?.[2] || 0),
        });
        y -= lh;
      };
      const dl = (ch: string, n: number, clr?: [number, number, number]) =>
        dt(ch.repeat(n), { sz: 8, clr: clr || [0.7, 0.7, 0.7] });
      const cpb = (n: number) => {
        if (y < m + n) {
          pg = doc.addPage([612, 792]);
          y = height - m;
        }
      };

      dt('PDFBLACK', { sz: 28, bld: true, clr: [0.05, 0.05, 0.05] });
      y -= 8;
      dl('-', 60, [0.9, 0.3, 0.3]);
      y -= 4;
      dt(isEs ? 'REPORTE DE COMPARACION PDF' : 'PDF COMPARISON REPORT', {
        sz: 18,
        bld: true,
        clr: [0.15, 0.15, 0.15],
      });
      y -= 8;
      dt(`Date: ${new Date().toISOString().split('T')[0]}`, { sz: 9, clr: [0.4, 0.4, 0.4] });
      y -= 16;
      dl('-', 60, [0.2, 0.2, 0.2]);
      y -= 10;
      dt('COMPARED DOCUMENTS', { sz: 11, bld: true });
      dt(`A: ${compareResult.fileName1} (${compareResult.totalPages1} p.)`, { sz: 9 });
      dt(`B: ${compareResult.fileName2} (${compareResult.totalPages2} p.)`, { sz: 9 });
      y -= 8;
      dt('SHA-256 CHECKSUMS', { sz: 10, bld: true, clr: [0.3, 0.3, 0.3] });
      dt(`A: ${compareResult.checksum1}`, { sz: 7, clr: [0.5, 0.5, 0.5] });
      dt(`B: ${compareResult.checksum2}`, { sz: 7, clr: [0.5, 0.5, 0.5] });
      cpb(100);
      y -= 16;
      dl('=', 60, [0.9, 0.3, 0.3]);
      dt('EXECUTIVE SUMMARY', { sz: 14, bld: true });
      dl('=', 60, [0.9, 0.3, 0.3]);
      y -= 6;
      dt(compareResult.summary, { sz: 10 });
      y -= 4;
      dt(`Similarity: ${compareResult.globalSimilarityPercent}%`, { sz: 10, bld: true });
      dt(
        `Changes: ${compareResult.totalRemovals + compareResult.totalAdditions} (${compareResult.totalRemovals} removals, ${compareResult.totalAdditions} additions)`,
        { sz: 10 },
      );
      dt(
        `Modified Pages: ${compareResult.pageDiffs.filter((p) => p.removedCount + p.addedCount > 0).length}`,
        { sz: 10 },
      );
      dt(`Visual Changes: ${compareResult.pagesWithVisualChanges} pages`, { sz: 10 });
      if (compareResult.structuralDiffs.length) {
        cpb(80);
        y -= 16;
        dl('-', 60, [0.95, 0.6, 0.2]);
        dt('STRUCTURAL CHANGES', { sz: 12, bld: true, clr: [0.8, 0.5, 0.1] });
        dl('-', 60, [0.95, 0.6, 0.2]);
        compareResult.structuralDiffs.forEach((sd) =>
          dt(`[${sd.category}] ${sd.description}`, { sz: 9, clr: [0.3, 0.3, 0.3] }),
        );
      }
      cpb(100);
      y -= 16;
      dl('=', 60, [0.2, 0.6, 0.2]);
      dt('PAGE DETAILS', { sz: 14, bld: true });
      dl('=', 60, [0.2, 0.6, 0.2]);
      compareResult.pageDiffs.forEach((pd) => {
        if (!pd.removedCount && !pd.addedCount) return;
        cpb(60);
        y -= 6;
        dt(
          `Page ${pd.page} - Sim: ${pd.similarityPercent}% | -${pd.removedCount} / +${pd.addedCount}`,
          { sz: 10, bld: true },
        );
        if (pd.hasVisualChanges)
          dt(`Visual change: ${(pd.visualDiffRatio * 100).toFixed(1)}%`, {
            sz: 8,
            clr: [0.8, 0.5, 0.1],
          });
        (pd.blocks?.length
          ? pd.blocks.slice(0, 5)
          : pd.words.filter((w) => w.type !== 'equal').slice(0, 5)
        ).forEach((b: any) => {
          cpb(20);
          const t = b.text || b;
          const ty = b.type || (typeof b === 'object' ? b.type : 'removed');
          const c: [number, number, number] = ty === 'removed' ? [0.9, 0.3, 0.3] : [0.2, 0.7, 0.3];
          dt(`${ty === 'removed' ? '-' : '+'} ${typeof t === 'string' ? t.slice(0, 120) : t}`, {
            sz: 8,
            clr: c,
          });
        });
      });
      y = m + 20;
      dt('PDFBLACK (c) - Local SHA-256 encrypted report', { sz: 7, clr: [0.6, 0.6, 0.6] });
      const pBytes = await doc.save();
      const ab = pBytes.buffer.slice(
        pBytes.byteOffset,
        pBytes.byteOffset + pBytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([ab], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const filename = `Reporte_Comparacion_${file1?.name?.replace('.pdf', '') || 'DocA'}_vs_${file2?.name?.replace('.pdf', '') || 'DocB'}.pdf`;
      setCompletedResult({
        downloadUrl: url,
        filename: filename,
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
      toast.success(isEs ? '¡Reporte PDF listo para descargar!' : 'PDF Report ready for download!');
    } catch (e: any) {
      toast.error(isEs ? `Error PDF: ${e?.message || ''}` : `PDF error: ${e?.message || ''}`);
    } finally {
      setIsGeneratingPdfReport(false);
    }
  };

  const fmtSize = (b: number) => {
    if (!b) return '0 KB';
    const s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + s[i];
  };
  const estSeconds =
    file1 && file2
      ? Math.ceil(((file1.size + file2.size) / 1e6) * 0.3 + (totalPages1 + totalPages2) * 0.15)
      : 0;
  const filtDiffs = compareResult
    ? compareResult.pageDiffs.filter((pd) => {
        if (showOnlyChanges && !pd.removedCount && !pd.addedCount) return false;
        if (!searchQuery.trim()) return true;
        return pd.words.some((w) => w.text.toLowerCase().includes(searchQuery.toLowerCase()));
      })
    : [];
  const activeWord = allDiffWords[activeDiffIdx] || null;
  const maxPages = Math.max(totalPages1, totalPages2);
  const phaseLabels: Record<string, string> = {
    hashing: isEs ? 'Checksums...' : 'Checksums...',
    extracting1: isEs ? 'Texto A...' : 'Text A...',
    extracting2: isEs ? 'Texto B...' : 'Text B...',
    structural: isEs ? 'Estructura...' : 'Structure...',
    diffing: isEs ? 'Diferencias...' : 'Diffing...',
    visual: isEs ? 'Visual...' : 'Visual...',
    packaging: isEs ? 'Reporte...' : 'Report...',
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={file1InputRef}
        onChange={handleFile1}
      />
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={file2InputRef}
        onChange={handleFile2}
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
        {slots.some((s) => s.file !== null) && (
          <div className="flex items-center gap-2 font-mono">
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white">
              <FileText className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold">
                {slots.filter((s) => s.file !== null).length} / 3 docs
              </span>
            </div>
            <button
              onClick={handleRemoveAllFiles}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Eliminar todos los archivos' : 'Remove all files'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!slots.some((s) => s.file !== null) ? (
        /* DROPZONE INICIAL DE PANTALLA COMPLETA */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => slot1InputRef.current?.click()}
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
            if (dropped.length > 0) {
              setSlots([
                { id: 1, file: dropped[0] || null },
                { id: 2, file: dropped[1] || null },
                { id: 3, file: dropped[2] || null },
              ]);
              setActiveSlotIndex(0);
              setCompareResult(null);
              setCompletedResult(null);
              toast.success(
                isEs
                  ? `${dropped.length} archivo(s) cargado(s)`
                  : `${dropped.length} file(s) loaded`,
              );
            } else {
              toast.error(isEs ? 'Solo archivos PDF' : 'Only PDF files');
            }
          }}
          className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'COMPARAR Y DETECTAR DIFERENCIAS EN DOCUMENTOS PDF'
              : 'COMPARE AND DETECT DIFFERENCES IN PDF DOCUMENTS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Sube dos versiones de un PDF para detectar automáticamente texto modificado, añadido o eliminado de forma 100% local.'
              : 'Upload two versions of a PDF to automatically detect modified, added or removed text 100% locally.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar Documentos PDF' : 'Select PDF Documents'}
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
      ) : completedResult ? (
        /* PANTALLA DE ÉXITO Y DESCARGA */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE COMPARACIÓN */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-2xl text-white shadow-md">
                  <CheckCircle2 className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA COMPARACIÓN' : 'COMPARISON RESULT'}
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
                <span>{isEs ? 'Reporte Listo' : 'Report Ready'}</span>
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
                <span className="text-zinc-200 font-bold text-xl font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.totalRemovals} prefix="-" />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Palabras Añadidas' : 'Words Added'}
                </span>
                <span className="text-white font-bold text-xl font-mono mt-0.5">
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

          {/* TARJETA DE DESCARGA ÉXITO (DownloadSuccessCard) */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="comparar"
            onReset={() => {
              setCompletedResult(null);
              reset();
            }}
          />
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO VERTICAL: SECCIÓN 1 (SUPERIOR) + SECCIÓN 2 (INFERIOR) */
        <div className="flex flex-col gap-6 mb-6 font-sans">
          {/* BANNER DE DESCARGA COMPLETADA */}
          <AnimatePresence>
            {downloadBanner && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {downloadBanner === 'pdf'
                        ? isEs
                          ? '¡Reporte PDF descargado con éxito!'
                          : 'PDF Report downloaded successfully!'
                        : isEs
                          ? '¡Reporte TXT descargado con éxito!'
                          : 'TXT Report downloaded successfully!'}
                    </p>
                    <p className="text-xs text-emerald-300 font-mono mt-0.5">
                      {isEs
                        ? 'El archivo se guardó en tu carpeta de descargas'
                        : 'File saved to your downloads folder'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDownloadBanner(null)}
                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
              {/* LADO IZQUIERDO: VISOR INTERACTIVO COMPARATIVO (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#0c0c0f] border border-zinc-800/80 rounded-2xl p-4 min-h-[460px]">
                {/* Header Visor con Tabs de Vista y Controles de Zoom */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs text-zinc-400 flex-wrap gap-2">
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-full">
                    {file1 && file2 && (
                      <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                          viewMode === 'split'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Dividida (A vs B)' : 'Split (A vs B)'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewMode('doc1')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        viewMode === 'doc1' || (!file2 && file1)
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Doc A {file1 ? `(${totalPages1}p)` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('doc2')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        viewMode === 'doc2' || (!file1 && file2)
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Doc B {file2 ? `(${totalPages2}p)` : ''}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((p) => Math.max(p - 25, 25))}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title={isEs ? 'Reducir zoom' : 'Zoom out'}
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-400 min-w-[36px] text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((p) => Math.min(p + 25, 300))}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title={isEs ? 'Aumentar zoom' : 'Zoom in'}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrollSync(!scrollSync)}
                      className={`p-1.5 rounded border transition-all cursor-pointer ${
                        scrollSync
                          ? 'bg-white/10 border-white text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={isEs ? 'Sincronizar scroll' : 'Sync scroll'}
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url =
                          viewMode === 'doc2'
                            ? canvas2Urls[1] || null
                            : canvas1Urls[1] || canvas2Urls[1] || null;
                        if (url) setZoomModalImage(url);
                      }}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title={isEs ? 'Zoom pantalla completa' : 'Fullscreen preview'}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contenido Central del Visor */}
                <div className="flex-1 my-3 relative min-h-[300px]">
                  {file1 && file2 && viewMode === 'split' ? (
                    /* VISTA DIVIDIDA (SIDE-BY-SIDE) */
                    <div className="grid grid-cols-2 gap-3 h-[52vh]">
                      {/* PANEL DOC A */}
                      <div className="bg-[#09090b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-full shadow-inner">
                        <div className="bg-zinc-900 border-b border-white/10 px-2.5 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-[11px] font-bold text-red-400 font-mono uppercase truncate">
                            {isEs ? 'Doc A (Original)' : 'Doc A (Original)'}
                          </span>
                          <span className="text-[10px] text-zinc-500 ml-auto font-mono">
                            {totalPages1}p
                          </span>
                        </div>
                        <div
                          ref={panel1Ref}
                          onScroll={() => handlePanelScroll(1)}
                          className="flex-1 bg-[#121215] overflow-y-auto p-2 flex flex-col items-center gap-2.5 custom-scrollbar"
                        >
                          {Array.from({ length: maxPages }, (_, i) => i + 1)
                            .filter(
                              (p) =>
                                !showOnlyChanges ||
                                (compareResult?.pageDiffs.find((pd) => pd.page === p)
                                  ?.removedCount || 0) +
                                  (compareResult?.pageDiffs.find((pd) => pd.page === p)
                                    ?.addedCount || 0) >
                                  0,
                            )
                            .map((pageNum) => (
                              <div
                                key={pageNum}
                                id={`compare-page-${pageNum}`}
                                className="w-full relative flex flex-col items-center"
                                data-observe="doc1"
                                data-page={pageNum}
                              >
                                {compareResult &&
                                  pageNum <= totalPages1 &&
                                  (() => {
                                    const wds =
                                      compareResult.pageDiffs
                                        .find((pd) => pd.page === pageNum)
                                        ?.words.filter((w) => w.type === 'removed') || [];
                                    return wds.length > 0 ? (
                                      <div className="absolute inset-0 z-10 pointer-events-none">
                                        {wds.map((w, idx) => (
                                          <div
                                            key={idx}
                                            className={`absolute bg-red-500/40 border border-red-400/60 rounded-sm transition-all ${activeDiffIdx >= 0 && allDiffWords[activeDiffIdx] === w ? 'ring-2 ring-red-400 bg-red-500/70 scale-105 z-20' : ''}`}
                                            style={
                                              w.bbox
                                                ? {
                                                    left: w.bbox.x * (zoomLevel / 100),
                                                    top: w.bbox.y * (zoomLevel / 100),
                                                    width: w.bbox.width * (zoomLevel / 100),
                                                    height: w.bbox.height * (zoomLevel / 100),
                                                  }
                                                : {
                                                    left: '5%',
                                                    top: `${5 + (idx % 8) * 10}%`,
                                                    width: '90%',
                                                    height: '8%',
                                                  }
                                            }
                                            title={w.text}
                                          />
                                        ))}
                                      </div>
                                    ) : null;
                                  })()}
                                {canvas1Urls[pageNum] ? (
                                  <img
                                    src={canvas1Urls[pageNum]}
                                    alt={`Doc A Page ${pageNum}`}
                                    className="w-full h-auto rounded shadow-sm border border-gray-700 bg-white"
                                  />
                                ) : pageNum <= totalPages1 ? (
                                  <div className="w-full h-48 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 text-xs font-mono">
                                    {isEs ? 'Cargando...' : 'Loading...'}
                                  </div>
                                ) : null}
                                <span className="text-[9px] text-zinc-600 mt-1 font-mono">
                                  Pág. {pageNum}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* PANEL DOC B */}
                      <div className="bg-[#09090b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-full shadow-inner">
                        <div className="bg-zinc-900 border-b border-white/10 px-2.5 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase truncate">
                            {isEs ? 'Doc B (Modificado)' : 'Doc B (Modified)'}
                          </span>
                          <span className="text-[10px] text-zinc-500 ml-auto font-mono">
                            {totalPages2}p
                          </span>
                        </div>
                        <div
                          ref={panel2Ref}
                          onScroll={() => handlePanelScroll(2)}
                          className="flex-1 bg-[#121215] overflow-y-auto p-2 flex flex-col items-center gap-2.5 custom-scrollbar"
                        >
                          {Array.from({ length: maxPages }, (_, i) => i + 1)
                            .filter(
                              (p) =>
                                !showOnlyChanges ||
                                (compareResult?.pageDiffs.find((pd) => pd.page === p)
                                  ?.removedCount || 0) +
                                  (compareResult?.pageDiffs.find((pd) => pd.page === p)
                                    ?.addedCount || 0) >
                                  0,
                            )
                            .map((pageNum) => (
                              <div
                                key={pageNum}
                                className="w-full relative flex flex-col items-center"
                                data-observe="doc2"
                                data-page={pageNum}
                              >
                                {compareResult &&
                                  pageNum <= totalPages2 &&
                                  (() => {
                                    const wds =
                                      compareResult.pageDiffs
                                        .find((pd) => pd.page === pageNum)
                                        ?.words.filter((w) => w.type === 'added') || [];
                                    return wds.length > 0 ? (
                                      <div className="absolute inset-0 z-10 pointer-events-none">
                                        {wds.map((w, idx) => (
                                          <div
                                            key={idx}
                                            className={`absolute bg-emerald-500/40 border border-emerald-400/60 rounded-sm transition-all ${activeDiffIdx >= 0 && allDiffWords[activeDiffIdx] === w ? 'ring-2 ring-emerald-400 bg-emerald-500/70 scale-105 z-20' : ''}`}
                                            style={
                                              w.bbox
                                                ? {
                                                    left: w.bbox.x * (zoomLevel / 100),
                                                    top: w.bbox.y * (zoomLevel / 100),
                                                    width: w.bbox.width * (zoomLevel / 100),
                                                    height: w.bbox.height * (zoomLevel / 100),
                                                  }
                                                : {
                                                    left: '5%',
                                                    top: `${5 + (idx % 8) * 10}%`,
                                                    width: '90%',
                                                    height: '8%',
                                                  }
                                            }
                                            title={w.text}
                                          />
                                        ))}
                                      </div>
                                    ) : null;
                                  })()}
                                {canvas2Urls[pageNum] ? (
                                  <img
                                    src={canvas2Urls[pageNum]}
                                    alt={`Doc B Page ${pageNum}`}
                                    className="w-full h-auto rounded shadow-sm border border-gray-700 bg-white"
                                  />
                                ) : pageNum <= totalPages2 ? (
                                  <div className="w-full h-48 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 text-xs font-mono">
                                    {isEs ? 'Cargando...' : 'Loading...'}
                                  </div>
                                ) : null}
                                <span className="text-[9px] text-zinc-600 mt-1 font-mono">
                                  Pág. {pageNum}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : viewMode === 'doc2' || (!file1 && file2) ? (
                    /* VISTA INDIVIDUAL DOC B */
                    <div className="bg-[#09090b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[52vh] shadow-inner">
                      <div className="bg-zinc-900 border-b border-white/10 px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 font-mono uppercase">
                          {isEs ? 'Doc B (Modificado)' : 'Doc B (Modified)'}
                        </span>
                        <span className="text-[10px] text-zinc-400 ml-auto font-mono">
                          {totalPages2} {isEs ? 'páginas' : 'pages'}
                        </span>
                      </div>
                      <div className="flex-1 bg-[#121215] overflow-y-auto p-4 flex flex-col items-center gap-4 custom-scrollbar">
                        {Array.from({ length: totalPages2 || 1 }, (_, i) => i + 1).map(
                          (pageNum) => (
                            <div
                              key={pageNum}
                              className="w-full max-w-md relative flex flex-col items-center"
                              data-observe="doc2"
                              data-page={pageNum}
                            >
                              {canvas2Urls[pageNum] ? (
                                <img
                                  src={canvas2Urls[pageNum]}
                                  alt={`Doc B Page ${pageNum}`}
                                  className="w-full h-auto rounded shadow-sm border border-gray-700 bg-white"
                                />
                              ) : (
                                <div className="w-full h-64 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 text-xs font-mono">
                                  {isEs ? 'Cargando...' : 'Loading...'}
                                </div>
                              )}
                              <span className="text-[9px] text-zinc-600 mt-1 font-mono">
                                Pág. {pageNum}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    /* VISTA INDIVIDUAL DOC A */
                    <div className="bg-[#09090b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[52vh] shadow-inner">
                      <div className="bg-zinc-900 border-b border-white/10 px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-xs font-bold text-red-400 font-mono uppercase">
                          {isEs ? 'Doc A (Original)' : 'Doc A (Original)'}
                        </span>
                        <span className="text-[10px] text-zinc-400 ml-auto font-mono">
                          {totalPages1} {isEs ? 'páginas' : 'pages'}
                        </span>
                      </div>
                      <div className="flex-1 bg-[#121215] overflow-y-auto p-4 flex flex-col items-center gap-4 custom-scrollbar">
                        {Array.from({ length: totalPages1 || 1 }, (_, i) => i + 1).map(
                          (pageNum) => (
                            <div
                              key={pageNum}
                              className="w-full max-w-md relative flex flex-col items-center"
                              data-observe="doc1"
                              data-page={pageNum}
                            >
                              {canvas1Urls[pageNum] ? (
                                <img
                                  src={canvas1Urls[pageNum]}
                                  alt={`Doc A Page ${pageNum}`}
                                  className="w-full h-auto rounded shadow-sm border border-gray-700 bg-white"
                                />
                              ) : (
                                <div className="w-full h-64 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 text-xs font-mono">
                                  {isEs ? 'Cargando...' : 'Loading...'}
                                </div>
                              )}
                              <span className="text-[9px] text-zinc-600 mt-1 font-mono">
                                Pág. {pageNum}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer del visor */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="truncate max-w-[160px] sm:max-w-[200px]">
                      A: {file1 ? file1.name : isEs ? 'Pendiente' : 'Pending'}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[160px] sm:max-w-[200px]">
                      B: {file2 ? file2.name : isEs ? 'Pendiente' : 'Pending'}
                    </span>
                  </div>
                  {compareResult && (
                    <span className="text-white font-bold bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                      {compareResult.globalSimilarityPercent}% {isEs ? 'similitud' : 'similarity'}
                    </span>
                  )}
                </div>
              </div>

              {/* LADO DERECHO: 3 CAJAS INDEPENDIENTES (AISLAMIENTO ESTRICTO) (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3 h-full">
                {slots.map((slot, sIdx) => {
                  const isLoaded = slot.file !== null;
                  const isActive = isLoaded && sIdx === activeSlotIndex;
                  const slotLabel =
                    sIdx === 0
                      ? isEs
                        ? 'Doc A (Original)'
                        : 'Doc A (Original)'
                      : sIdx === 1
                        ? isEs
                          ? 'Doc B (Modificado)'
                          : 'Doc B (Modified)'
                        : isEs
                          ? 'Doc C (Adicional)'
                          : 'Doc C (Additional)';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isLoaded) {
                          setActiveSlotIndex(sIdx);
                          if (sIdx === 0) setViewMode('doc1');
                          else if (sIdx === 1) setViewMode('doc2');
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
                                  {isEs ? `Caja ${sIdx + 1}` : `Box ${sIdx + 1}`} • {slotLabel}
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
                                {fmtSize(slot.file!.size)}
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
                                {isEs
                                  ? `+ Cargar PDF ${sIdx + 1} (${slotLabel})`
                                  : `+ Upload PDF ${sIdx + 1} (${slotLabel})`}
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

                {/* Botón Eliminar Todos y Badges */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleRemoveAllFiles}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 font-mono transition-colors cursor-pointer px-2 py-1 rounded hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Eliminar todos los archivos' : 'Remove all files'}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEs ? '100% Local y Seguro' : '100% Local & Secure'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONFIGURACIÓN Y ACCIÓN (PANEL DE CONTROL INFERIOR A ANCHO COMPLETO 100%) */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Cabecera Sección 2 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                  002 / CONFIGURACIÓN Y ACCIÓN
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-white" />
                  <span>
                    {isEs ? 'PANEL DE CONTROL DE COMPARACIÓN' : 'COMPARISON CONTROL PANEL'}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isComparing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`}
                  />
                  {isComparing
                    ? isEs
                      ? 'Comparando...'
                      : 'Comparing...'
                    : isEs
                      ? 'Motor Listo'
                      : 'Engine Ready'}
                </span>
                <span className="flex items-center gap-1 text-white ml-3">
                  <Database className="w-3 h-3" />
                  100% Local
                </span>
              </div>
            </div>

            {/* RESULTADOS SI EXISTE COMPARACIÓN */}
            {compareResult && (
              <div className="mb-6 space-y-4">
                {/* Hashes SHA-256 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 font-mono text-xs shadow-inner">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-500">Doc A:</span>
                    <span className="text-zinc-200 font-bold truncate">
                      {compareResult.checksum1.slice(0, 16)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(compareResult.checksum1);
                        toast.success('SHA-256 A copiado');
                      }}
                      className="ml-auto text-zinc-500 hover:text-white cursor-pointer"
                      title="Copiar Hash A"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-500">Doc B:</span>
                    <span className="text-zinc-200 font-bold truncate">
                      {compareResult.checksum2.slice(0, 16)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(compareResult.checksum2);
                        toast.success('SHA-256 B copiado');
                      }}
                      className="ml-auto text-zinc-500 hover:text-white cursor-pointer"
                      title="Copiar Hash B"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Métricas en Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
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
                      {compareResult.pagesWithVisualChanges || 0}
                    </span>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                      {isEs ? 'Cambios Visuales' : 'Visual Changes'}
                    </span>
                  </div>
                </div>

                {/* Barra de Navegación entre diferencias */}
                {allDiffWords.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121217] border border-zinc-700/80 rounded-2xl px-4 py-3 font-mono text-xs shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={gotoPrevDiff}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer"
                          title="Anterior (Ctrl+Left)"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">
                            {isEs ? 'Anterior' : 'Previous'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={gotoNextDiff}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer"
                          title="Siguiente (Ctrl+Right)"
                        >
                          <span className="text-[11px] font-bold">
                            {isEs ? 'Siguiente' : 'Next'}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-white font-bold bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/10">
                        {activeDiffIdx >= 0
                          ? `${isEs ? 'Diferencia' : 'Diff'} ${activeDiffIdx + 1} / ${allDiffWords.length}`
                          : `${allDiffWords.length} ${isEs ? 'diferencias' : 'differences'}`}
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
                      {isEs ? 'Página' : 'Page'} {activeWord?.page || '1'}
                    </span>
                  </div>
                )}

                {/* Desplegable de Cambios Estructurales */}
                {compareResult.structuralDiffs.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowStructuralDiffs(!showStructuralDiffs)}
                      className="w-full flex items-center justify-between bg-[#121217] border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer shadow-inner"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-zinc-400" />
                        <span className="font-bold">
                          {isEs
                            ? 'Cambios Estructurales Detectados'
                            : 'Structural Changes Detected'}
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
                          <div className="mt-2 space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                            {compareResult.structuralDiffs.map((sd, i) => (
                              <div
                                key={i}
                                className="text-[10px] font-mono text-zinc-300 bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2"
                              >
                                <span className="font-bold text-white">[{sd.category}]</span>{' '}
                                {sd.description}
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

            {/* GRID DE CONFIGURACIÓN Y PARÁMETROS AVANZADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* OPCIONES AVANZADAS DE COMPARACIÓN */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-5 font-sans space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono tracking-wider border-b border-zinc-800 pb-3 uppercase">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                  <span>{isEs ? 'OPCIONES AVANZADAS DE COMPARACIÓN' : 'ADVANCED OPTIONS'}</span>
                </div>

                {/* Sensibilidad */}
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

                {/* Toggles de configuración */}
                <div className="space-y-2.5 text-xs font-sans">
                  <div
                    onClick={() => setEnableVisualDiff((v) => !v)}
                    className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isEs ? 'Detección visual de imágenes' : 'Visual pixel diff'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {isEs
                          ? 'Compara capas gráficas y fotos'
                          : 'Compare graphics & photo layers'}
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
                        {isEs
                          ? 'No resalta diferencias de capitalización'
                          : 'Disregard letter casing'}
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
                        {isEs ? 'Ignorar signos de puntuación' : 'Ignore punctuation'}
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

              {/* BÚSQUEDA Y LISTA DE CAMBIOS DETALLADOS */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-5 font-sans space-y-4 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white font-mono tracking-wider uppercase">
                      <Search className="w-4 h-4 text-white" />
                      <span>{isEs ? 'EXPLORADOR DE CAMBIOS' : 'CHANGES EXPLORER'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOnlyChanges(!showOnlyChanges)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${
                        showOnlyChanges
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>{isEs ? 'Solo cambios' : 'Changes only'}</span>
                    </button>
                  </div>

                  {/* Input de Búsqueda */}
                  <div className="relative mb-3 font-mono">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="cmp-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isEs ? 'Buscar texto o cambio...' : 'Search text or diff...'}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Lista de páginas con cambios */}
                  <div className="overflow-y-auto max-h-[190px] space-y-2 pr-1 custom-scrollbar">
                    {compareResult ? (
                      filtDiffs.filter((p) => p.removedCount + p.addedCount > 0).length > 0 ? (
                        filtDiffs
                          .filter((p) => p.removedCount + p.addedCount > 0)
                          .slice(0, 30)
                          .map((pd) => (
                            <div
                              key={pd.page}
                              className="bg-zinc-950/60 border border-white/8 rounded-xl p-2.5 text-[10px] font-mono"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-bold">
                                  {isEs ? 'Página' : 'Page'} {pd.page}
                                </span>
                                <div className="flex gap-1.5">
                                  {pd.removedCount > 0 && (
                                    <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                      -{pd.removedCount}
                                    </span>
                                  )}
                                  {pd.addedCount > 0 && (
                                    <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      +{pd.addedCount}
                                    </span>
                                  )}
                                  {pd.hasVisualChanges && (
                                    <span className="text-amber-400 text-[8px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      IMG
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-0.5 max-h-[70px] overflow-y-auto custom-scrollbar">
                                {(pd.blocks?.length
                                  ? pd.blocks
                                  : pd.words.filter((w) => w.type !== 'equal')
                                )
                                  .slice(0, 3)
                                  .map((b: any, bi: number) => (
                                    <div key={bi} className="flex items-start gap-1">
                                      <span
                                        className={`flex-shrink-0 mt-0.5 font-bold ${(b.type || 'removed') === 'removed' ? 'text-red-400' : 'text-emerald-400'}`}
                                      >
                                        {(b.type || 'removed') === 'removed' ? '-' : '+'}
                                      </span>
                                      <span className="text-zinc-300 truncate">
                                        {(b.text || b).toString().slice(0, 50)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                          {isEs ? 'Sin diferencias coincidentes' : 'No matching differences'}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-6 text-zinc-500 font-mono text-xs space-y-1">
                        <p>
                          {isEs
                            ? 'Inicia la comparación para ver los cambios página por página.'
                            : 'Start comparison to view page by page changes.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Atajos de teclado */}
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Ver atajos de teclado' : 'View keyboard shortcuts'}</span>
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
                            ['Ctrl+D', isEs ? 'Descargar TXT' : 'Download TXT'],
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

            {/* BARRA DE PROGRESO */}
            {isComparing && (
              <div className="mb-6 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="font-bold">
                      {phaseLabels[progressPhase] ||
                        progressMsg ||
                        (isEs ? 'Comparando documentos...' : 'Comparing documents...')}
                    </span>
                  </div>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={cancel}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-1.5 px-4 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Cancelar' : 'Cancel'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ZONA DE BOTONES DE ACCIÓN PRINCIPALES */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={executeCompare}
                  disabled={!file1 || !file2 || isRendering || isComparing}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-bold py-3 px-8 rounded-full text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg disabled:opacity-40"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>
                    {compareResult
                      ? isEs
                        ? 'Re-comparar Documentos'
                        : 'Re-compare Documents'
                      : isEs
                        ? 'Comparar Documentos'
                        : 'Compare Documents'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                  title={isEs ? 'Reiniciar' : 'Reset'}
                >
                  <X className="w-4 h-4" />
                  <span>{isEs ? 'Reiniciar' : 'Reset'}</span>
                </button>
              </div>

              {/* Botones de Descarga cuando hay resultados */}
              {compareResult && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={downloadReport}
                    className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 text-zinc-200 hover:text-white font-bold text-xs py-3 px-5 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer font-mono"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{isEs ? 'Descargar TXT' : 'Download TXT'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadPdfReport}
                    disabled={isGeneratingPdfReport}
                    className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-black font-extrabold text-xs py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-50 font-mono"
                  >
                    {isGeneratingPdfReport ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>{isEs ? 'Generando PDF...' : 'Generating PDF...'}</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4 text-black" />
                        <span>{isEs ? 'Descargar Reporte PDF' : 'Download PDF Report'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PREVIEW EN PANTALLA COMPLETA (ZOOM MODAL) */}
      {zoomModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-700 rounded-2xl p-2 overflow-auto shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomModalImage(null)}
              className="absolute top-3 right-3 p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-700 transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomModalImage}
              alt="Zoom Preview"
              className="max-h-[80vh] w-auto object-contain rounded-lg bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
