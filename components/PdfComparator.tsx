'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  GitCompare, FileText, X, ShieldCheck,
  Search, ChevronDown, ChevronUp, ZoomIn, ZoomOut,
  SplitSquareVertical, Database, UploadCloud,
  Hash, Copy, CheckCircle, AlertTriangle, Clock,
  Keyboard, Filter, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompareResult, CompareProgress, StructuralDiff } from '../workers/pdf-compare.worker';

export default function PdfComparator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);

  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [dragOver1, setDragOver1] = useState(false);
  const [dragOver2, setDragOver2] = useState(false);
  const [canvas1Urls, setCanvas1Urls] = useState<Record<number, string>>({});
  const [canvas2Urls, setCanvas2Urls] = useState<Record<number, string>>({});
  const [totalPages1, setTotalPages1] = useState(0);
  const [totalPages2, setTotalPages2] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
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
  const renderedPagesRef = useRef<{ doc1: Set<number>; doc2: Set<number> }>({ doc1: new Set(), doc2: new Set() });

  useEffect(() => { return () => { workerRef.current?.terminate(); }; }, []);

  const handlePanelScroll = useCallback((source: 1 | 2) => {
    if (!scrollSync || isScrollingRef.current) return;
    isScrollingRef.current = true;
    const src = source === 1 ? panel1Ref : panel2Ref;
    const tgt = source === 1 ? panel2Ref : panel1Ref;
    if (src.current && tgt.current) {
      const r = src.current.scrollTop / (src.current.scrollHeight - src.current.clientHeight);
      tgt.current.scrollTop = r * (tgt.current.scrollHeight - tgt.current.clientHeight);
    }
    requestAnimationFrame(() => { isScrollingRef.current = false; });
  }, [scrollSync]);

  const allDiffWords = compareResult ? compareResult.pageDiffs.flatMap(p => p.words.filter(w => w.type !== 'equal')) : [];

  const gotoNextDiff = () => {
    if (allDiffWords.length === 0) return;
    const i = (activeDiffIdx + 1) % allDiffWords.length;
    setActiveDiffIdx(i);
    document.getElementById(`compare-page-${allDiffWords[i].page}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const gotoPrevDiff = () => {
    if (allDiffWords.length === 0) return;
    const i = activeDiffIdx <= 0 ? allDiffWords.length - 1 : activeDiffIdx - 1;
    setActiveDiffIdx(i);
    document.getElementById(`compare-page-${allDiffWords[i].page}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFile1 = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setFile1(e.target.files[0]); setCompareResult(null); } e.target.value = ''; };
  const handleFile2 = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setFile2(e.target.files[0]); setCompareResult(null); } e.target.value = ''; };

  const hdrOver = (e: React.DragEvent, z: 1 | 2) => { e.preventDefault(); e.stopPropagation(); z === 1 ? setDragOver1(true) : setDragOver2(true); };
  const hdrLeave = (e: React.DragEvent, z: 1 | 2) => { e.preventDefault(); e.stopPropagation(); z === 1 ? setDragOver1(false) : setDragOver2(false); };
  const hdrDrop = (e: React.DragEvent, z: 1 | 2) => {
    e.preventDefault(); e.stopPropagation();
    z === 1 ? setDragOver1(false) : setDragOver2(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
      z === 1 ? setFile1(f) : setFile2(f);
      setCompareResult(null);
    } else { toast.error(isEs ? 'Solo PDF' : 'Only PDF'); }
  };

  useEffect(() => { if (!file1 || !file2) return; loadDocs(); }, [file1, file2]);

  const loadDocs = async () => {
    setIsRendering(true); setCompareResult(null); setCanvas1Urls({}); setCanvas2Urls({});
    renderedPagesRef.current = { doc1: new Set(), doc2: new Set() };
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const [b1, b2] = await Promise.all([file1!.arrayBuffer(), file2!.arrayBuffer()]);
      if (!b1.byteLength || !b2.byteLength) { toast.error(isEs ? 'PDF vacio' : 'Empty PDF'); setIsRendering(false); return; }
      const [d1, d2] = await Promise.all([
        pdfjsLib.getDocument({ data: b1.slice(0) }).promise,
        pdfjsLib.getDocument({ data: b2.slice(0) }).promise,
      ]);
      pdfDocRef.current = { doc1: d1, doc2: d2 };
      setTotalPages1(d1.numPages); setTotalPages2(d2.numPages);
    } catch (e: any) {
      const m = e?.message || '';
      if (m.includes('encrypt') || m.includes('password')) toast.error(isEs ? 'PDF cifrado' : 'Encrypted PDF');
      else toast.error(isEs ? 'Error al cargar PDF' : 'PDF load error');
    } finally { setIsRendering(false); }
  };

  const renderPage = useCallback(async (doc: any, n: number, setUrls: any, dk: string) => {
    if (renderedPagesRef.current[dk as 'doc1' | 'doc2'].has(n)) return;
    renderedPagesRef.current[dk as 'doc1' | 'doc2'].add(n);
    try {
      const s = zoomRef.current / 100 * 1.5;
      const pg = await doc.getPage(n); const vp = pg.getViewport({ scale: s });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext('2d');
      if (ctx) { await pg.render({ canvasContext: ctx, viewport: vp } as any).promise; setUrls((prev: any) => ({ ...prev, [n]: c.toDataURL('image/jpeg', 0.85) })); }
    } catch { /* skip */ }
  }, []);

  useEffect(() => {
    if (!pdfDocRef.current) return;
    const obs: IntersectionObserver[] = [];
    const so = (doc: any, su: any, dk: string) => {
      const o = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { const p = parseInt(e.target.getAttribute('data-page') || '1'); renderPage(doc, p, su, dk); o.unobserve(e.target); } });
      }, { rootMargin: '200px 0px' });
      document.querySelectorAll(`[data-observe="${dk}"]`).forEach(el => o.observe(el));
      obs.push(o);
    };
    so(pdfDocRef.current.doc1, setCanvas1Urls, 'doc1');
    so(pdfDocRef.current.doc2, setCanvas2Urls, 'doc2');
    return () => obs.forEach(o => o.disconnect());
  }, [totalPages1, totalPages2]);

  useEffect(() => {
    if (!pdfDocRef.current || !totalPages1) return;
    renderedPagesRef.current = { doc1: new Set(), doc2: new Set() };
    setCanvas1Urls({}); setCanvas2Urls({});
    zoomRef.current = zoomLevel;
    setTimeout(() => document.querySelectorAll('[data-observe]').forEach(el => el.dispatchEvent(new Event('reobserve', { bubbles: true }))), 50);
  }, [zoomLevel]);

  const cancel = () => {
    workerRef.current?.postMessage({ type: 'cancel' }); workerRef.current?.terminate(); workerRef.current = null;
    setIsComparing(false); setProgressPercent(0); setProgressMsg('');
    toast.info(isEs ? 'Cancelado' : 'Cancelled');
  };

  const executeCompare = async () => {
    if (!file1 || !file2) { toast.error(isEs ? 'Selecciona ambos PDF' : 'Select both PDFs'); return; }
    workerRef.current?.terminate();
    setIsComparing(true); setProgressPercent(0); setProgressPhase('hashing'); setActiveDiffIdx(-1);
    const [b1, b2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]);
    const w = new Worker(new URL('../workers/pdf-compare.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') { setProgressPercent(m.percent); setProgressMsg(m.message); setProgressPhase(m.phase); }
      else if (m.type === 'result') { setCompareResult(m); setProgressPercent(100); setIsComparing(false); toast.success(m.summary); w.terminate(); workerRef.current = null; }
      else if (m.type === 'error') { toast.error(m.message); setIsComparing(false); w.terminate(); workerRef.current = null; }
      else if (m.type === 'cancelled') { setIsComparing(false); w.terminate(); workerRef.current = null; }
    };
    w.onerror = () => { toast.error(isEs ? 'Error motor' : 'Engine error'); setIsComparing(false); };
    w.postMessage({ buffer1: b1.slice(0), buffer2: b2.slice(0), fileName1: file1.name, fileName2: file2.name });
  };

  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const c = e.ctrlKey || e.metaKey;
      if (c && e.key === 'Enter') { e.preventDefault(); if (!isComparing && file1 && file2) executeCompare(); }
      else if (e.key === 'Escape') { if (isComparing) { e.preventDefault(); cancel(); } }
      else if (e.key === 'ArrowLeft' && c) { e.preventDefault(); gotoPrevDiff(); }
      else if (e.key === 'ArrowRight' && c) { e.preventDefault(); gotoNextDiff(); }
      else if (c && e.key === 'd') { e.preventDefault(); if (compareResult) downloadReport(); }
      else if (c && (e.key === '+' || e.key === '=')) { e.preventDefault(); setZoomLevel(p => Math.min(p + 25, 300)); }
      else if (c && e.key === '-') { e.preventDefault(); setZoomLevel(p => Math.max(p - 25, 25)); }
      else if (c && e.key === '0') { e.preventDefault(); setZoomLevel(100); }
      else if (c && e.key === 'f') { e.preventDefault(); document.getElementById('cmp-search')?.focus(); }
      else if (c && e.key === 's') { e.preventDefault(); setScrollSync(p => !p); }
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [isComparing, file1, file2, compareResult, activeDiffIdx, allDiffWords]);

  const reset = () => {
    setFile1(null); setFile2(null); setCanvas1Urls({}); setCanvas2Urls({});
    setTotalPages1(0); setTotalPages2(0); setCompareResult(null);
    setShowOnlyChanges(false); setActiveDiffIdx(-1); setSearchQuery('');
  };

  const downloadReport = () => {
    if (!compareResult) return;
    const l: string[] = [];
    l.push('PDFBLACK - COMPARISON REPORT', '='.repeat(60), `Date: ${new Date().toISOString().split('T')[0]}`);
    l.push(`A: ${compareResult.fileName1} (${compareResult.totalPages1} p.)`, `B: ${compareResult.fileName2} (${compareResult.totalPages2} p.)`);
    l.push('', `SHA-256 A: ${compareResult.checksum1}`, `SHA-256 B: ${compareResult.checksum2}`, '', compareResult.summary, '');
    if (compareResult.structuralDiffs.length) {
      l.push('STRUCTURAL CHANGES:', '-'.repeat(40));
      compareResult.structuralDiffs.forEach(sd => l.push(`  [${sd.category}] ${sd.description}`));
      l.push('');
    }
    l.push('PAGE DETAILS:', '-'.repeat(60));
    compareResult.pageDiffs.forEach(pd => {
      if (!pd.removedCount && !pd.addedCount) return;
      l.push(`\n[Page ${pd.page}] Sim: ${pd.similarityPercent}% | -${pd.removedCount} / +${pd.addedCount}`);
      (pd.blocks?.length ? pd.blocks.slice(0, 10) : pd.words.filter(w => w.type !== 'equal').slice(0, 10)).forEach((b: any) => {
        const t = b.text || b;
        const ty = b.type || (typeof b === 'object' ? (b.type) : 'removed');
        l.push(`  ${ty === 'removed' ? '-' : '+'} ${typeof t === 'string' ? t.slice(0, 100) : t}`);
      });
      if (pd.hasVisualChanges) l.push(`  Visual: ${(pd.visualDiffRatio * 100).toFixed(1)}% diff`);
      if (pd.fontChanges?.length) l.push(`  Fonts: ${pd.fontChanges.join(', ')}`);
    });
    const b = new Blob([l.join('\n')], { type: 'text/plain;charset=utf-8' });
    const u = URL.createObjectURL(b); const a = document.createElement('a');
    a.href = u; a.download = `Report_${file1?.name?.replace('.pdf', '') || 'PDF'}.txt`;
    a.click(); URL.revokeObjectURL(u);
    toast.success(isEs ? 'Descargado' : 'Downloaded');
  };

  const downloadPdfReport = async () => {
    if (!compareResult) return;
    setIsGeneratingPdfReport(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      let pg = doc.addPage([612, 792]);
      const { height } = pg.getSize();
      const m = 50; let y = height - m; const lh = 14;
      const f = await doc.embedFont(StandardFonts.Helvetica);
      const fb = await doc.embedFont(StandardFonts.HelveticaBold);

      const sanitize = (t: string): string => {
        let s = '';
        for (let i = 0; i < t.length; i++) {
          const cp = t.codePointAt(i);
          if (cp === undefined) continue;
          if (cp <= 0xFF) {
            if (cp === 0x09 || cp === 0x0A || cp === 0x0D || (cp >= 0x20 && cp <= 0x7E) || cp >= 0xA0) s += String.fromCodePoint(cp);
            if (cp > 0xFFFF) i++;
          } else {
            if (cp >= 0x2500 && cp <= 0x257F) s += '-';
            else if (cp === 0x2212) s += '-';
            else if (cp === 0xA9) s += '(c)';
            if (cp > 0xFFFF) i++;
          }
        }
        return s.replace(/\s+/g, ' ').trim();
      };

      const dt = (t: string, o?: { sz?: number; clr?: [number, number, number]; bld?: boolean }) => {
        const st = sanitize(t); if (!st) return;
        if (y < m + 30) { pg = doc.addPage([612, 792]); y = height - m; }
        pg.drawText(st, { x: m, y, size: o?.sz || 10, font: o?.bld ? fb : f, color: rgb(o?.clr?.[0] || 0, o?.clr?.[1] || 0, o?.clr?.[2] || 0) });
        y -= lh;
      };
      const dl = (ch: string, n: number, clr?: [number, number, number]) => dt(ch.repeat(n), { sz: 8, clr: clr || [0.7, 0.7, 0.7] });
      const cpb = (n: number) => { if (y < m + n) { pg = doc.addPage([612, 792]); y = height - m; } };

      dt('PDFBLACK', { sz: 28, bld: true, clr: [0.05, 0.05, 0.05] }); y -= 8;
      dl('-', 60, [0.9, 0.3, 0.3]); y -= 4;
      dt(isEs ? 'REPORTE DE COMPARACION PDF' : 'PDF COMPARISON REPORT', { sz: 18, bld: true, clr: [0.15, 0.15, 0.15] }); y -= 8;
      dt(`Date: ${new Date().toISOString().split('T')[0]}`, { sz: 9, clr: [0.4, 0.4, 0.4] }); y -= 16;
      dl('-', 60, [0.2, 0.2, 0.2]); y -= 10;
      dt('COMPARED DOCUMENTS', { sz: 11, bld: true });
      dt(`A: ${compareResult.fileName1} (${compareResult.totalPages1} p.)`, { sz: 9 });
      dt(`B: ${compareResult.fileName2} (${compareResult.totalPages2} p.)`, { sz: 9 }); y -= 8;
      dt('SHA-256 CHECKSUMS', { sz: 10, bld: true, clr: [0.3, 0.3, 0.3] });
      dt(`A: ${compareResult.checksum1}`, { sz: 7, clr: [0.5, 0.5, 0.5] });
      dt(`B: ${compareResult.checksum2}`, { sz: 7, clr: [0.5, 0.5, 0.5] });
      cpb(100); y -= 16;
      dl('=', 60, [0.9, 0.3, 0.3]);
      dt('EXECUTIVE SUMMARY', { sz: 14, bld: true }); dl('=', 60, [0.9, 0.3, 0.3]); y -= 6;
      dt(compareResult.summary, { sz: 10 }); y -= 4;
      dt(`Similarity: ${compareResult.globalSimilarityPercent}%`, { sz: 10, bld: true });
      dt(`Changes: ${compareResult.totalRemovals + compareResult.totalAdditions} (${compareResult.totalRemovals} removals, ${compareResult.totalAdditions} additions)`, { sz: 10 });
      dt(`Modified Pages: ${compareResult.pageDiffs.filter(p => p.removedCount + p.addedCount > 0).length}`, { sz: 10 });
      dt(`Visual Changes: ${compareResult.pagesWithVisualChanges} pages`, { sz: 10 });
      if (compareResult.structuralDiffs.length) {
        cpb(80); y -= 16; dl('-', 60, [0.95, 0.6, 0.2]);
        dt('STRUCTURAL CHANGES', { sz: 12, bld: true, clr: [0.8, 0.5, 0.1] }); dl('-', 60, [0.95, 0.6, 0.2]);
        compareResult.structuralDiffs.forEach(sd => dt(`[${sd.category}] ${sd.description}`, { sz: 9, clr: [0.3, 0.3, 0.3] }));
      }
      cpb(100); y -= 16; dl('=', 60, [0.2, 0.6, 0.2]);
      dt('PAGE DETAILS', { sz: 14, bld: true }); dl('=', 60, [0.2, 0.6, 0.2]);
      compareResult.pageDiffs.forEach(pd => {
        if (!pd.removedCount && !pd.addedCount) return;
        cpb(60); y -= 6;
        dt(`Page ${pd.page} - Sim: ${pd.similarityPercent}% | -${pd.removedCount} / +${pd.addedCount}`, { sz: 10, bld: true });
        if (pd.hasVisualChanges) dt(`Visual change: ${(pd.visualDiffRatio * 100).toFixed(1)}%`, { sz: 8, clr: [0.8, 0.5, 0.1] });
        (pd.blocks?.length ? pd.blocks.slice(0, 5) : pd.words.filter(w => w.type !== 'equal').slice(0, 5)).forEach((b: any) => {
          cpb(20);
          const t = b.text || b;
          const ty = b.type || (typeof b === 'object' ? b.type : 'removed');
          const c: [number, number, number] = ty === 'removed' ? [0.9, 0.3, 0.3] : [0.2, 0.7, 0.3];
          dt(`${ty === 'removed' ? '-' : '+'} ${typeof t === 'string' ? t.slice(0, 120) : t}`, { sz: 8, clr: c });
        });
      });
      y = m + 20;
      dt('PDFBLACK (c) - Local SHA-256 encrypted report', { sz: 7, clr: [0.6, 0.6, 0.6] });
      const pBytes = await doc.save();
      const ab = pBytes.buffer.slice(pBytes.byteOffset, pBytes.byteOffset + pBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([ab], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Report_${file1?.name?.replace('.pdf', '') || 'PDF'}_PDF.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(isEs ? 'PDF descargado' : 'PDF downloaded');
    } catch (e: any) {
      toast.error(isEs ? `Error PDF: ${e?.message || ''}` : `PDF error: ${e?.message || ''}`);
    } finally { setIsGeneratingPdfReport(false); }
  };

  const fmtSize = (b: number) => { if (!b) return '0 KB'; const s = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(b) / Math.log(1024)); return (b / Math.pow(1024, i)).toFixed(1) + ' ' + s[i]; };
  const estSeconds = file1 && file2 ? Math.ceil(((file1.size + file2.size) / 1e6) * 0.3 + (totalPages1 + totalPages2) * 0.15) : 0;
  const filtDiffs = compareResult ? compareResult.pageDiffs.filter(pd => {
    if (showOnlyChanges && !pd.removedCount && !pd.addedCount) return false;
    if (!searchQuery.trim()) return true;
    return pd.words.some(w => w.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }) : [];
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
    <div className="w-full font-sans">
      <input type="file" accept=".pdf" className="hidden" ref={file1InputRef} onChange={handleFile1} />
      <input type="file" accept=".pdf" className="hidden" ref={file2InputRef} onChange={handleFile2} />
      {(!file1 || !file2) ? (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
          <div className="text-center flex flex-col items-center gap-3">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-white/10 shadow-2xl"><GitCompare className="w-10 h-10 text-white" /></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{isEs ? 'Comparar PDFs' : 'Compare PDFs'}</h2>
            <p className="text-zinc-400 text-xs max-w-md font-mono">{isEs ? 'Sube dos PDFs para detectar diferencias.' : 'Upload two PDFs to detect differences.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div onClick={() => file1InputRef.current?.click()} onDragOver={e => hdrOver(e, 1)} onDragLeave={e => hdrLeave(e, 1)} onDrop={e => hdrDrop(e, 1)}
              className={`bg-[#09090b] border-2 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px] group shadow-2xl ${dragOver1 ? 'border-red-400 border-solid bg-red-500/5 scale-[1.02]' : file1 ? 'border-white' : 'border-dashed border-white/10 hover:border-white/30'}`}>
              {file1 ? <div className="flex flex-col items-center gap-3 text-center font-mono"><FileText className="w-12 h-12 text-white" /><span className="text-white font-bold text-sm truncate max-w-[220px]">{file1.name}</span><span className="text-zinc-400 text-[10px]">{fmtSize(file1.size)}</span><span className="text-emerald-400 text-xs">Doc A</span></div>
                : <><div className={`p-4 rounded-xl border transition-all ${dragOver1 ? 'bg-red-500/10 border-red-400 scale-110' : 'bg-zinc-900 border-white/10'}`}><UploadCloud className={`w-8 h-8 ${dragOver1 ? 'text-red-400' : 'text-white'}`} /></div><div className="text-center"><h3 className="text-white font-bold text-base">{isEs ? 'A. Original' : 'A. Original'}</h3><p className="text-zinc-400 text-xs mt-1">{dragOver1 ? (isEs ? 'Suelta aqui' : 'Drop here') : (isEs ? 'Click o arrastra' : 'Click or drag')}</p></div></>}
            </div>
            <div onClick={() => file2InputRef.current?.click()} onDragOver={e => hdrOver(e, 2)} onDragLeave={e => hdrLeave(e, 2)} onDrop={e => hdrDrop(e, 2)}
              className={`bg-[#09090b] border-2 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px] group shadow-2xl ${dragOver2 ? 'border-emerald-400 border-solid bg-emerald-500/5 scale-[1.02]' : file2 ? 'border-white' : 'border-dashed border-white/10 hover:border-white/30'}`}>
              {file2 ? <div className="flex flex-col items-center gap-3 text-center font-mono"><FileText className="w-12 h-12 text-white" /><span className="text-white font-bold text-sm truncate max-w-[220px]">{file2.name}</span><span className="text-zinc-400 text-[10px]">{fmtSize(file2.size)}</span><span className="text-emerald-400 text-xs">Doc B</span></div>
                : <><div className={`p-4 rounded-xl border transition-all ${dragOver2 ? 'bg-emerald-500/10 border-emerald-400 scale-110' : 'bg-zinc-900 border-white/10'}`}><UploadCloud className={`w-8 h-8 ${dragOver2 ? 'text-emerald-400' : 'text-white'}`} /></div><div className="text-center"><h3 className="text-white font-bold text-base">{isEs ? 'B. Modificado' : 'B. Modified'}</h3><p className="text-zinc-400 text-xs mt-1">{dragOver2 ? (isEs ? 'Suelta aqui' : 'Drop here') : (isEs ? 'Click o arrastra' : 'Click or drag')}</p></div></>}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full"><ShieldCheck className="w-3.5 h-3.5" /><span>{isEs ? '100% LOCAL' : '100% LOCAL'}</span></div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* TOOLBAR */}
              <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 font-mono">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <button onClick={() => file1InputRef.current?.click()} className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-xl text-white transition-all cursor-pointer"><FileText className="w-4 h-4 text-red-400" /><span className="font-bold truncate max-w-[140px]">{file1?.name}</span></button>
                  <span className="text-zinc-500 font-bold">VS</span>
                  <button onClick={() => file2InputRef.current?.click()} className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-xl text-white transition-all cursor-pointer"><FileText className="w-4 h-4 text-emerald-400" /><span className="font-bold truncate max-w-[140px]">{file2?.name}</span></button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setZoomLevel(p => Math.min(p + 25, 300))} title="Zoom in" className="p-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
                  <span className="text-[10px] text-zinc-400 min-w-[40px] text-center font-mono">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(p => Math.max(p - 25, 25))} title="Zoom out" className="p-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setShowOnlyChanges(!showOnlyChanges)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${showOnlyChanges ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'}`}><Filter className="w-3 h-3" /><span>{isEs ? 'Solo cambios' : 'Changes only'}</span></button>
                  <button onClick={() => setScrollSync(!scrollSync)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${scrollSync ? 'bg-zinc-900 border-white text-white font-bold' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'}`}><SplitSquareVertical className="w-3.5 h-3.5" /><span className="text-xs">Sync</span></button>
                  <button onClick={() => setShowShortcuts(!showShortcuts)} title="Shortcuts" className="p-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"><Keyboard className="w-3.5 h-3.5" /></button>
                  <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-red-500/50 text-xs text-zinc-300 hover:text-red-400 rounded-full transition-all cursor-pointer"><X className="w-3.5 h-3.5" /><span>{isEs ? 'Reset' : 'Reset'}</span></button>
                </div>
              </div>
              <AnimatePresence>{showShortcuts && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full bg-[#09090b] border border-white/10 rounded-xl p-4 font-mono text-xs"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Ctrl+Enter', isEs ? 'Comparar' : 'Compare'], ['Esc', isEs ? 'Cancelar' : 'Cancel'], ['Ctrl+Left/Right', isEs ? 'Navegar' : 'Navigate'], ['Ctrl++/-/0', isEs ? 'Zoom' : 'Zoom'], ['Ctrl+S', isEs ? 'Scroll sync' : 'Scroll sync'], ['Ctrl+F', isEs ? 'Buscar' : 'Search'], ['Ctrl+D', isEs ? 'Descargar TXT' : 'Download TXT']].map(([k, d]) => (<div key={k} className="flex items-center gap-2"><kbd className="bg-zinc-800 border border-white/10 px-2 py-0.5 rounded text-white font-bold text-[10px]">{k}</kbd><span className="text-zinc-400">{d}</span></div>))}</div></motion.div>)}</AnimatePresence>
              <div className="flex items-center gap-4 flex-wrap">
                {!isComparing ? (
                  <button onClick={executeCompare} disabled={isRendering} className="bg-white text-black hover:bg-zinc-200 font-bold py-2.5 px-6 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"><GitCompare className="w-4 h-4" /><span>{compareResult ? (isEs ? 'Re-comparar' : 'Re-compare') : (isEs ? 'Comparar' : 'Compare')}</span></button>
                ) : (<>
                  <div className="flex-1 bg-zinc-900 border border-white/10 rounded-full h-2.5 overflow-hidden"><motion.div className="h-full bg-white rounded-full" animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} /></div>
                  <span className="text-xs text-zinc-400 font-mono min-w-[60px]">{progressPercent}%</span>
                  <button onClick={cancel} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2 px-4 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer"><X className="w-3.5 h-3.5" /><span>{isEs ? 'Cancelar' : 'Cancel'}</span></button>
                </>)}
                {estSeconds > 0 && !isComparing && !compareResult && (<span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Clock className="w-3 h-3" />~{estSeconds}s</span>)}
              </div>
              {isComparing && (<div className="flex items-center gap-2 text-xs font-mono text-zinc-400"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /><span>{phaseLabels[progressPhase] || progressMsg}</span></div>)}
              {compareResult && allDiffWords.length > 0 && (
                <div className="flex items-center gap-3 bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs">
                  <button onClick={gotoPrevDiff} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer" title="Prev (Ctrl+Left)"><ChevronUp className="w-4 h-4" /></button>
                  <span className="text-white font-bold">{activeDiffIdx >= 0 ? `Change ${activeDiffIdx + 1}/${allDiffWords.length}` : `${allDiffWords.length} changes`}</span>
                  <button onClick={gotoNextDiff} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer" title="Next (Ctrl+Right)"><ChevronDown className="w-4 h-4" /></button>
                  {activeWord && (<span className={`px-2 py-0.5 rounded font-bold ${activeWord.type === 'removed' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{activeWord.type === 'removed' ? '-' : '+'} {activeWord.text.slice(0, 30)}</span>)}
                  <span className="text-zinc-500 text-[10px] ml-auto">Page {activeWord?.page || '-'}</span>
                </div>
              )}
              {compareResult && (<span className="text-xs text-zinc-400 font-mono">{compareResult.summary}</span>)}

              {/* SIDE-BY-SIDE PANELS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[70vh] shadow-2xl">
                  <div className="bg-zinc-900 border-b border-white/10 px-3 py-2 flex items-center gap-2 flex-shrink-0"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs font-bold text-red-400 font-mono uppercase">{isEs ? 'Original' : 'Original'}</span><span className="text-[10px] text-zinc-500 ml-auto">{totalPages1}p</span></div>
                  <div ref={panel1Ref} onScroll={() => handlePanelScroll(1)} className="flex-1 bg-[#121215] overflow-y-auto p-3 flex flex-col items-center gap-3">
                    {Array.from({ length: maxPages }, (_, i) => i + 1).filter(p => !showOnlyChanges || (compareResult?.pageDiffs.find(pd => pd.page === p)?.removedCount || 0) + (compareResult?.pageDiffs.find(pd => pd.page === p)?.addedCount || 0) > 0).map(pageNum => (
                      <div key={pageNum} id={`compare-page-${pageNum}`} className="w-full relative flex flex-col items-center" data-observe="doc1" data-page={pageNum}>
                        {compareResult && pageNum <= totalPages1 && (() => {
                          const wds = compareResult.pageDiffs.find(pd => pd.page === pageNum)?.words.filter(w => w.type === 'removed') || [];
                          return wds.length > 0 ? (<div className="absolute inset-0 z-10 pointer-events-none">{wds.map((w, idx) => (<div key={idx} className={`absolute bg-red-500/40 border border-red-400/60 rounded-sm transition-all ${activeDiffIdx >= 0 && allDiffWords[activeDiffIdx] === w ? 'ring-2 ring-red-400 bg-red-500/70 scale-105 z-20' : ''}`} style={w.bbox ? { left: w.bbox.x * (zoomLevel / 100), top: w.bbox.y * (zoomLevel / 100), width: w.bbox.width * (zoomLevel / 100), height: w.bbox.height * (zoomLevel / 100) } : { left: '5%', top: `${5 + (idx % 8) * 10}%`, width: '90%', height: '8%' }} title={w.text} />))}</div>) : null;
                        })()}
                        {canvas1Urls[pageNum] ? <img src={canvas1Urls[pageNum]} className="w-full h-auto rounded shadow-sm border border-gray-700 bg-white" /> : pageNum <= totalPages1 ? <div className="w-full h-64 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 text-xs">Loading...</div> : null}
                        <span className="text-[9px] text-zinc-600 mt-1 font-mono">Pg {pageNum}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[70vh] shadow-2xl">
                  <div className="bg-zinc-900 border-b border-white/10 px-3 py-2 flex items-center gap-2 flex-shrink-0"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs font-bold text-emerald-400 font-mono uppercase">{isEs ? 'Modificado' : 'Modified'}</span><span className="text-[10px] text-zinc-500 ml-auto">{totalPages2}p</span></div>
                  <div ref={panel2Ref} onScroll={() => handlePanelScroll(2)} className="flex-1 bg-[#121215] overflow-y-auto p-3 flex flex-col items-center gap-3">
                    {Array.from({ length: maxPages }, (_, i) => i + 1).filter(p => !showOnlyChanges || (compareResult?.pageDiffs.find(pd => pd.page === p)?.removedCount || 0) + (compareResult?.pageDiffs.find(pd => pd.page === p)?.addedCount || 0) > 0).map(pageNum => (
                      <div key={pageNum} className="w-full relative flex flex-col items-center" data-observe="doc2" data-page={pageNum}>
                        {compareResult && pageNum <= totalPages2 && (() => {
                          const wds = compareResult.pageDiffs.find(pd => pd.page === pageNum)?.words.filter(w => w.type === 'added') || [];
                          return wds.length > 0 ? (<div className="absolute inset-0 z-10 pointer-events-none">{wds.map((w, idx) => (<div key={idx} className={`absolute bg-emerald-500/40 border border-emerald-400/60 rounded-sm transition-all ${activeDiffIdx >= 0 && allDiffWords[activeDiffIdx] === w ? 'ring-2 ring-emerald-400 bg-emerald-500/70 scale-105 z-20' : ''}`} style={w.bbox ? { left: w.bbox.x * (zoomLevel / 100), top: w.bbox.y * (zoomLevel / 100), width: w.bbox.width * (zoomLevel / 100), height: w.bbox.height * (zoomLevel / 100) } : { left: '5%', top: `${5 + (idx % 8) * 10}%`, width: '90%', height: '8%' }} title={w.text} />))}</div>) : null;
                        })()}
                        {canvas2Urls[pageNum] ? <img src={canvas2Urls[pageNum]} className="w-full h-auto rounded shadow-sm border border-gray-700 bg-white" /> : pageNum <= totalPages2 ? <div className="w-full h-64 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 text-xs">Loading...</div> : null}
                        <span className="text-[9px] text-zinc-600 mt-1 font-mono">Pg {pageNum}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* SIDEBAR */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 flex flex-col shadow-2xl min-h-[400px]">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3"><div><span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block mb-1">002 / REPORT</span><h2 className="text-xl font-bold text-white uppercase">{isEs ? 'RESULTADOS' : 'RESULTS'}</h2></div><div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><GitCompare className="w-5 h-5 text-white" /></div></div>
                {compareResult ? (<>
                  <div className="mb-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono"><Hash className="w-3 h-3 text-red-400" /><span className="text-zinc-500">A:</span><span className="text-red-400 font-bold">{compareResult.checksum1.slice(0, 12)}...</span><button onClick={() => { navigator.clipboard.writeText(compareResult.checksum1); toast.success('Copied'); }} className="ml-auto text-zinc-500 hover:text-white cursor-pointer"><Copy className="w-3 h-3" /></button></div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono"><Hash className="w-3 h-3 text-emerald-400" /><span className="text-zinc-500">B:</span><span className="text-emerald-400 font-bold">{compareResult.checksum2.slice(0, 12)}...</span><button onClick={() => { navigator.clipboard.writeText(compareResult.checksum2); toast.success('Copied'); }} className="ml-auto text-zinc-500 hover:text-white cursor-pointer"><Copy className="w-3 h-3" /></button></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
                    <div className={`rounded-lg p-2.5 text-center border ${compareResult.globalSimilarityPercent >= 95 ? 'bg-emerald-500/10 border-emerald-500/20' : compareResult.globalSimilarityPercent >= 70 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}><span className={`font-bold text-lg block ${compareResult.globalSimilarityPercent >= 95 ? 'text-emerald-400' : compareResult.globalSimilarityPercent >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{compareResult.globalSimilarityPercent}%</span><span className="text-zinc-400 text-[10px]">{isEs ? 'Similitud' : 'Similarity'}</span></div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center"><span className="text-red-400 font-bold text-lg block">{compareResult.totalRemovals + compareResult.totalAdditions}</span><span className="text-red-300 text-[10px]">{isEs ? 'Cambios' : 'Changes'}</span></div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center"><span className="text-emerald-400 font-bold text-lg block">{compareResult.pageDiffs.filter(p => p.removedCount + p.addedCount > 0).length}</span><span className="text-emerald-300 text-[10px]">{isEs ? 'Pags Modif' : 'Mod Pages'}</span></div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center"><span className="text-blue-400 font-bold text-lg block">{compareResult.pagesWithVisualChanges || 0}</span><span className="text-blue-300 text-[10px]">{isEs ? 'Cambios Visuales' : 'Visual Changes'}</span></div>
                  </div>
                  {compareResult.structuralDiffs.length > 0 && (<div className="mb-4"><button onClick={() => setShowStructuralDiffs(!showStructuralDiffs)} className="w-full flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"><span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{isEs ? 'Cambios Estructurales' : 'Structural Changes'} ({compareResult.structuralDiffs.length})</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStructuralDiffs ? 'rotate-180' : ''}`} /></button><AnimatePresence>{showStructuralDiffs && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">{compareResult.structuralDiffs.map((sd, i) => (<div key={i} className="text-[9px] font-mono text-zinc-300 bg-zinc-950/60 border border-white/5 rounded px-2 py-1"><span className={`font-bold ${sd.category === 'fonts' ? 'text-purple-400' : sd.category === 'images' ? 'text-blue-400' : sd.category === 'pages' ? 'text-amber-400' : 'text-zinc-400'}`}>[{sd.category}]</span> {sd.description}</div>))}</div></motion.div>)}</AnimatePresence></div>)}
                  <div className="relative mb-4 font-mono"><Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" /><input id="cmp-search" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isEs ? 'Filtrar...' : 'Filter...'} className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30" /></div>
                  <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-2 pr-1"><span className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase mb-2">Changes ({filtDiffs.filter(p => p.removedCount + p.addedCount > 0).length})</span>
                    {filtDiffs.filter(p => p.removedCount + p.addedCount > 0).slice(0, 30).map(pd => (
                      <div key={pd.page} className="bg-zinc-950/60 border border-white/8 rounded-lg p-2.5 text-[10px]"><div className="flex items-center justify-between mb-1"><span className="text-white font-bold font-mono">Page {pd.page}</span><div className="flex gap-1.5">{pd.removedCount > 0 && <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">-{pd.removedCount}</span>}{pd.addedCount > 0 && <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">+{pd.addedCount}</span>}{pd.hasVisualChanges && <span className="text-amber-400 text-[8px]">IMG</span>}</div></div><div className="space-y-0.5 max-h-[80px] overflow-y-auto">{(pd.blocks?.length ? pd.blocks : pd.words.filter(w => w.type !== 'equal')).slice(0, 3).map((b: any, bi: number) => (<div key={bi} className="flex items-start gap-1"><span className={`flex-shrink-0 mt-0.5 font-bold ${(b.type || 'removed') === 'removed' ? 'text-red-400' : 'text-emerald-400'}`}>{(b.type || 'removed') === 'removed' ? '-' : '+'}</span><span className="text-zinc-300 truncate">{(b.text || b).toString().slice(0, 40)}</span></div>))}</div></div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-4 flex flex-col gap-2">
                    <button onClick={downloadReport} className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl"><span>{isEs ? 'Descargar TXT' : 'Download TXT'}</span><span className="text-[10px] text-zinc-500 font-mono">Ctrl+D</span></button>
                    <button onClick={downloadPdfReport} disabled={isGeneratingPdfReport} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 text-white font-bold text-sm py-2.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50">{isGeneratingPdfReport ? (<><span className="w-3 h-3 rounded-full bg-white animate-pulse" /><span>Generating...</span></>) : (<><FileDown className="w-4 h-4" /><span>{isEs ? 'Descargar PDF' : 'Download PDF'}</span></>)}</button>
                  </div>
                </>) : (<div className="flex-1 flex items-center justify-center text-center"><div className="text-zinc-500 font-mono text-xs space-y-2"><GitCompare className="w-8 h-8 mx-auto text-zinc-600" /><p>{isEs ? 'Click en Comparar para iniciar.' : 'Click Compare to start.'}</p><p className="text-[10px] text-zinc-600">Ctrl+Enter</p></div></div>)}
              </div>
              <div className="pt-2 flex items-center justify-between font-mono text-xs text-zinc-400 mt-2"><span className="flex items-center gap-1.5 text-[10px]"><span className={`w-1.5 h-1.5 rounded-full ${isComparing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />{isComparing ? (isEs ? 'Procesando...' : 'Processing...') : (isEs ? 'Activo' : 'Active')}</span><span className="flex items-center gap-1 text-white"><Database className="w-3 h-3" />100% Local</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}