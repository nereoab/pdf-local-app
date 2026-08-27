'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  FileDown,
  Loader2,
  X,
  FilePlus,
  RefreshCw,
  UploadCloud,
  Repeat,
  Layout,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Grid,
  Code,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Cpu,
  HelpCircle,
  Plus,
  FileText,
  Check,
  ListChecks,
  Trash2,
} from 'lucide-react';
import { HtmlIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

type ConversionDirection = 'html-to-pdf' | 'pdf-to-html';
type PageSize = 'a4' | 'letter' | 'legal';
type PageOrientation = 'portrait' | 'landscape';
type PageSelectionMode = 'all' | 'range' | 'custom' | 'even' | 'odd';

interface HtmlPdfConverterProps {
  defaultMode?: ConversionDirection;
}

interface CompletedResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  rawBlob: Blob;
  outputFormat: string;
  originalSize?: string;
  itemCount?: number;
}

function parseRangeString(numPages: number, rangeStr: string): Set<number> {
  const set = new Set<number>();
  if (!rangeStr?.trim() || numPages <= 0) return set;
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [sStr, eStr] = trimmed.split('-');
      const s = parseInt(sStr, 10);
      const e = parseInt(eStr, 10);
      if (!isNaN(s) && !isNaN(e)) {
        const start = Math.max(1, Math.min(s, e));
        const end = Math.min(numPages, Math.max(s, e));
        for (let i = start; i <= end; i++) {
          set.add(i);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= numPages) set.add(p);
    }
  }
  return set;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function HtmlPdfConverter({ defaultMode = 'pdf-to-html' }: HtmlPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const cancelRenderRef = useRef<boolean>(false);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);
  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);
  const [file, setFile] = useState<File | null>(() => {
    if (!globalFile) return null;
    const name = globalFile.name.toLowerCase();
    if (defaultMode === 'pdf-to-html' && name.endsWith('.pdf')) return globalFile;
    if (
      defaultMode === 'html-to-pdf' &&
      (name.endsWith('.html') || name.endsWith('.htm') || name.endsWith('.zip'))
    )
      return globalFile;
    return null;
  });

  const pdfUrl = useMemo(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const [htmlTagCount, setHtmlTagCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // SELECCIÓN DE PÁGINAS (PDF -> HTML)
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // OPCIONES AVANZADAS PDF -> HTML
  const [htmlTheme, setHtmlTheme] = useState<'modern_light' | 'modern_dark' | 'minimal'>(
    'modern_light',
  );
  const [includeBase64Images, setIncludeBase64Images] = useState<boolean>(true);
  const [singleHtmlFile, setSingleHtmlFile] = useState<boolean>(true);
  const [responsiveLayout, setResponsiveLayout] = useState<boolean>(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState<boolean>(true);

  // OPCIONES AVANZADAS HTML -> PDF
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [includeBackgrounds, setIncludeBackgrounds] = useState<boolean>(true);

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // CÁLCULO DE PÁGINAS SELECCIONADAS
  const targetPages = useMemo(() => {
    if (totalPages === 0) return [];
    if (pageSelectionMode === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (pageSelectionMode === 'even') {
      return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    }
    if (pageSelectionMode === 'odd') {
      return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    }
    if (pageSelectionMode === 'range') {
      const set = parseRangeString(totalPages, pageRangeInput);
      return Array.from(set).sort((a, b) => a - b);
    }
    if (pageSelectionMode === 'custom') {
      return Array.from(selectedPageSet)
        .filter((p) => p >= 1 && p <= totalPages)
        .sort((a, b) => a - b);
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages, pageSelectionMode, pageRangeInput, selectedPageSet]);

  const targetPageSet = useMemo(() => new Set(targetPages), [targetPages]);

  const parseHtmlContent = async (htmlFile: File): Promise<number> => {
    try {
      const text = await htmlFile.text();
      const tags = text.match(/<[^>]+>/g);
      return tags ? tags.length : 15;
    } catch {
      return 10;
    }
  };

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setSelectedPageSet(new Set());
      return;
    }
    if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
      parseHtmlContent(file).then((count) => setHtmlTagCount(count));
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      cargarMiniaturasPdfUltraFast(file);
    }
  }, [file]);

  // CARGA ULTRA RÁPIDA DE MINIATURAS (ESCALA 0.22 + STREAMING EN SEGUNDO PLANO)
  const cargarMiniaturasPdfUltraFast = async (pdfFile: File) => {
    cancelRenderRef.current = true;
    await new Promise((r) => setTimeout(r, 20));
    cancelRenderRef.current = false;

    setIsRendering(true);
    setPageDataUrls({});

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const count = pdfDoc.numPages;
      setTotalPages(count);
      setSelectedPageSet(new Set(Array.from({ length: count }, (_, i) => i + 1)));
      setPageRangeInput(count > 10 ? `1-${Math.min(10, count)}` : `1-${count}`);

      // Lote inicial rápido (8 páginas en <100ms)
      const initialBatch = Math.min(count, 8);
      const initialUrls: Record<number, string> = {};

      for (let p = 1; p <= initialBatch; p++) {
        if (cancelRenderRef.current) return;
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 0.22 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
              typeof page.render
            >[0]).promise;
            initialUrls[p] = canvas.toDataURL('image/jpeg', 0.65);
          }
        } catch {}
      }

      setPageDataUrls({ ...initialUrls });
      setIsRendering(false);

      // Carga progresiva en segundo plano
      if (initialBatch < count) {
        (async () => {
          const loadedUrls = { ...initialUrls };
          for (let p = initialBatch + 1; p <= count; p++) {
            if (cancelRenderRef.current) return;
            try {
              const page = await pdfDoc.getPage(p);
              const viewport = page.getViewport({ scale: 0.22 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
                  typeof page.render
                >[0]).promise;
                loadedUrls[p] = canvas.toDataURL('image/jpeg', 0.65);
              }
            } catch {}

            if (p % 6 === 0 || p === count) {
              setPageDataUrls({ ...loadedUrls });
              await new Promise((r) => setTimeout(r, 10));
            }
          }
        })();
      }
    } catch (err) {
      console.error(err);
      setIsRendering(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const processSelectedFile = (selected: File) => {
    const name = selected.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isHtml = name.endsWith('.html') || name.endsWith('.htm') || name.endsWith('.zip');

    if (mode === 'html-to-pdf') {
      if (isHtml) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo HTML cargado' : 'HTML file loaded');
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona un archivo HTML (.html/.htm)'
            : 'Please select an HTML file (.html/.htm)',
        );
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(
          isEs ? 'Archivo PDF cargado para exportar a HTML' : 'PDF file loaded for HTML export',
        );
      } else {
        toast.error(
          isEs ? 'Por favor selecciona un archivo PDF (.pdf)' : 'Please select a PDF file (.pdf)',
        );
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSwitchMode = (newMode: ConversionDirection) => {
    cancelRenderRef.current = true;
    setMode(newMode);
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const handleRemoveFile = () => {
    cancelRenderRef.current = true;
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // CONTROLADORES DE SELECCIÓN DE PÁGINAS
  const togglePageSelection = (pageNum: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(targetPages);
    if (newSet.has(pageNum)) {
      newSet.delete(pageNum);
    } else {
      newSet.add(pageNum);
    }
    setSelectedPageSet(newSet);
    setPageSelectionMode('custom');
  };

  const handleSelectAll = () => {
    if (totalPages > 0) {
      setSelectedPageSet(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
      setPageSelectionMode('all');
    }
  };

  const handleDeselectAll = () => {
    setSelectedPageSet(new Set());
    setPageSelectionMode('custom');
  };

  const handleInvertSelection = () => {
    const current = new Set(targetPages);
    const inverted = new Set<number>();
    for (let p = 1; p <= totalPages; p++) {
      if (!current.has(p)) inverted.add(p);
    }
    setSelectedPageSet(inverted);
    setPageSelectionMode('custom');
  };

  const executeConversion = async () => {
    if (!file) return;
    if (mode === 'pdf-to-html' && targetPages.length === 0) {
      toast.error(
        isEs
          ? 'Por favor selecciona al menos una página para exportar a HTML.'
          : 'Please select at least one page to export to HTML.',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    let localUrl: string | null = null;
    let resultBlob: Blob | null = null;

    try {
      if (mode === 'html-to-pdf') {
        setProgressMsg(
          isEs
            ? 'Procesando etiquetas HTML y construyendo PDF...'
            : 'Parsing HTML tags & building PDF...',
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(40);

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let width = orientation === 'landscape' ? 841.89 : 595.28;
        let height = orientation === 'landscape' ? 595.28 : 841.89;

        if (pageSize === 'letter') {
          width = orientation === 'landscape' ? 792 : 612;
          height = orientation === 'landscape' ? 612 : 792;
        } else if (pageSize === 'legal') {
          width = orientation === 'landscape' ? 1008 : 612;
          height = orientation === 'landscape' ? 612 : 1008;
        }

        const page = pdfDoc.addPage([width, height]);
        const docTitle = file.name.replace(/\.[^/.]+$/, '');

        page.drawText(docTitle, {
          x: 45,
          y: height - 50,
          size: 16,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
        });

        page.drawText(
          isEs ? 'Documento compilado a partir de código HTML' : 'Document compiled from HTML code',
          {
            x: 45,
            y: height - 75,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          },
        );

        const rawHtml = await file.text();
        const cleanLines = rawHtml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const words = cleanLines.split(' ');
        let yPos = height - 110;
        let currentLine = '';

        for (const word of words) {
          if ((currentLine + ' ' + word).length > 85) {
            page.drawText(currentLine, {
              x: 45,
              y: yPos,
              size: 10,
              font,
              color: rgb(0.2, 0.2, 0.2),
            });
            currentLine = word;
            yPos -= 16;
            if (yPos < 50) break;
          } else {
            currentLine += (currentLine ? ' ' : '') + word;
          }
        }

        if (currentLine && yPos >= 50) {
          page.drawText(currentLine, {
            x: 45,
            y: yPos,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        }

        const pdfBytes = await pdfDoc.save();
        resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'pdf',
            originalSize: formatFileSize(file.size),
            itemCount: 1,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs ? '¡HTML renderizado a PDF con éxito!' : 'HTML rendered to PDF successfully!',
        );
      } else {
        // MODO PDF A HTML5 DE ALTA FIDELIDAD CON PROCESAMIENTO CLIENT-SIDE
        const totalToConvert = targetPages.length;
        setProgressMsg(
          isEs
            ? `Estructurando ${totalToConvert} páginas en semántica HTML5...`
            : `Structuring ${totalToConvert} pages in HTML5 semantics...`,
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(15);

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        const docTitle = file.name.replace(/\.[^/.]+$/, '');
        const pagesHtml: Array<{ pageNum: number; html: string; imageBase64?: string }> = [];

        for (let idx = 0; idx < totalToConvert; idx++) {
          const pageNum = targetPages[idx];
          setProgressMsg(
            isEs
              ? `Decodificando página ${idx + 1} de ${totalToConvert} (Pág. ${pageNum})...`
              : `Decoding page ${idx + 1} of ${totalToConvert} (Page ${pageNum})...`,
          );
          setProgressPercent(15 + Math.round(((idx + 1) / totalToConvert) * 65));

          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Render de imagen de apoyo si está activado
          let imgDataUrl: string | undefined = undefined;
          if (includeBase64Images) {
            try {
              const viewport = page.getViewport({ scale: 1.2 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
                  typeof page.render
                >[0]).promise;
                imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              }
            } catch {}
          }

          // Agrupar items de texto por coordenadas Y
          const items = textContent.items as Array<{
            str?: string;
            transform?: number[];
            fontName?: string;
          }>;
          const lineMap = new Map<number, string[]>();

          for (const item of items) {
            if (!item.str || !item.transform) continue;
            const yCoord = Math.round(item.transform[5] / 8) * 8;
            if (!lineMap.has(yCoord)) {
              lineMap.set(yCoord, []);
            }
            lineMap.get(yCoord)!.push(item.str);
          }

          const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
          let pageBodyHtml = '';

          sortedY.forEach((y, lineIdx) => {
            const lineText = lineMap.get(y)!.join(' ').trim();
            if (!lineText) return;

            const escaped = escapeHtml(lineText);
            if (lineIdx === 0 && lineText.length < 80) {
              pageBodyHtml += `        <h2 class="pdf-heading">${escaped}</h2>\n`;
            } else if (
              lineText.length < 50 &&
              (lineText.endsWith(':') || lineText.toUpperCase() === lineText)
            ) {
              pageBodyHtml += `        <h3 class="pdf-subheading">${escaped}</h3>\n`;
            } else {
              pageBodyHtml += `        <p class="pdf-paragraph">${escaped}</p>\n`;
            }
          });

          pagesHtml.push({
            pageNum,
            html: pageBodyHtml,
            imageBase64: imgDataUrl,
          });

          await new Promise((r) => setTimeout(r, 10));
        }

        setProgressMsg(
          isEs
            ? 'Compilando paquete HTML5 y estilos responsive...'
            : 'Compiling HTML5 package & responsive styles...',
        );
        setProgressPercent(85);

        const isDark = htmlTheme === 'modern_dark';
        const bgColor = isDark ? '#09090b' : '#f8fafc';
        const cardBg = isDark ? '#121215' : '#ffffff';
        const textColor = isDark ? '#f4f4f5' : '#0f172a';
        const textMuted = isDark ? '#a1a1aa' : '#64748b';
        const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

        const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="PDFBlack Suite - High Fidelity HTML5 Converter">
  <title>${escapeHtml(docTitle)} - HTML5 Document</title>
  <style>
    :root {
      --bg: ${bgColor};
      --card-bg: ${cardBg};
      --text: ${textColor};
      --muted: ${textMuted};
      --border: ${borderColor};
      --primary: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 30px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    header.doc-header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 28px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    h1.doc-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .doc-meta {
      font-size: 13px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    nav.toc {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 28px;
    }
    nav.toc h4 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 12px;
    }
    nav.toc ul {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      list-style: none;
    }
    nav.toc a {
      display: inline-block;
      padding: 6px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      text-decoration: none;
      transition: all 0.2s;
    }
    nav.toc a:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    section.pdf-page {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px;
      margin-bottom: 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      position: relative;
    }
    .page-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      font-family: ui-monospace, monospace;
      color: var(--muted);
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .pdf-heading {
      font-size: 20px;
      font-weight: 700;
      margin: 16px 0 10px 0;
      color: var(--text);
    }
    .pdf-subheading {
      font-size: 16px;
      font-weight: 600;
      margin: 14px 0 8px 0;
      color: var(--text);
    }
    .pdf-paragraph {
      font-size: 14.5px;
      margin-bottom: 12px;
      color: var(--text);
    }
    .page-visual {
      margin-top: 20px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .page-visual img {
      width: 100%;
      height: auto;
      display: block;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      section.pdf-page { page-break-after: always; box-shadow: none; border: none; padding: 20px; }
      nav.toc, .page-badge { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="doc-header">
      <h1 class="doc-title">${escapeHtml(docTitle)}</h1>
      <div class="doc-meta">
        Exportado con PDFBlack Suite • ${totalToConvert} Páginas Seleccionadas • Formato HTML5 Semántico
      </div>
    </header>

    ${
      includeTableOfContents
        ? `
    <nav class="toc">
      <h4>Índice de Páginas Extraídas</h4>
      <ul>
        ${pagesHtml.map((p) => `<li><a href="#page-${p.pageNum}">Pág. ${p.pageNum}</a></li>`).join('\n        ')}
      </ul>
    </nav>`
        : ''
    }

    <main>
      ${pagesHtml
        .map(
          (p) => `
      <section id="page-${p.pageNum}" class="pdf-page">
        <span class="page-badge">PÁGINA ${p.pageNum} DE ${totalPages}</span>
        <div class="page-content">
${p.html}
        </div>
        ${
          p.imageBase64
            ? `
        <div class="page-visual">
          <img src="${p.imageBase64}" alt="Página ${p.pageNum}" loading="lazy" />
        </div>`
            : ''
        }
      </section>`,
        )
        .join('\n')}
    </main>
  </div>
</body>
</html>`;

        resultBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${docTitle}_Web.html`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'html',
            originalSize: formatFileSize(file.size),
            itemCount: totalToConvert,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs
            ? `¡${totalToConvert} páginas convertidas a HTML5 con éxito!`
            : `Successfully converted ${totalToConvert} pages to HTML5!`,
        );
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error en la conversión HTML.' : 'HTML conversion error.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div
      ref={topHeaderRef}
      className="w-full flex flex-col font-mono text-white selection:bg-white selection:text-black"
    >
      <input
        type="file"
        accept={mode === 'html-to-pdf' ? '.html, .htm, .zip, text/html' : '.pdf, application/pdf'}
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <Link
            href="/convertir"
            onClick={() => setHeaderHidden(false)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '005 / CONVERSIÓN DE PÁGINAS HTML Y PDF (CONVERSOR DUAL 2 EN 1)'
                : '005 / HTML & PDF WEB CONVERSION (2-IN-1 DUAL CONVERTER)'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Code className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'html-to-pdf'
                ? isEs
                  ? 'CONVERTIR HTML A PDF'
                  : 'CONVERT HTML TO PDF'
                : isEs
                  ? 'CONVERTIR PDF A HTML5 (CONVERSOR DUAL 2 EN 1)'
                  : 'CONVERT PDF TO HTML5 (2-IN-1 DUAL CONVERTER)'}
            </h1>
          </div>
        </div>

        {(file || completedResult) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {completedResult ? completedResult.filename : file?.name}
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS */}
          <div className="bg-[#09090b] border border-white/20 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs
                      ? '¡Exportación HTML5 completada con éxito!'
                      : 'HTML5 export completed successfully!'}
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

            {/* MÉTRICAS DE LA CONVERSIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono text-xs border-t border-zinc-800 mt-4">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Formato' : 'Format'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5 uppercase">
                  {completedResult.outputFormat}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Resultante' : 'Result Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.fileSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-zinc-300 font-bold text-sm font-mono mt-0.5">
                  {completedResult.itemCount} {isEs ? 'págs' : 'pages'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Procesamiento' : 'Processing'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? '100% Local (RAM)' : '100% Local (RAM)'}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA ÉXITO CON ENCADENAMIENTO DE HERRAMIENTAS */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat={completedResult.outputFormat}
            rawBlob={completedResult.rawBlob}
            currentToolId="html-pdf"
            onReset={handleRemoveFile}
          />
        </motion.div>
      ) : (
        <>
          {/* SELECTOR DUAL DE MODO 2 EN 1 */}
          <div className="flex items-center justify-center mb-6 font-mono">
            <div className="bg-[#09090b] border border-zinc-700 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => handleSwitchMode('html-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'html-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4 text-black" />
                <span>{isEs ? 'HTML a PDF (.html → .pdf)' : 'HTML to PDF (.html → .pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('pdf-to-html')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-html'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a HTML (.pdf → .html)' : 'PDF to HTML (.pdf → .html)'}</span>
              </button>
            </div>
          </div>

          {!file ? (
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
                {mode === 'html-to-pdf'
                  ? isEs
                    ? 'CONVERTIR PÁGINA HTML A PDF'
                    : 'CONVERT HTML PAGE TO PDF'
                  : isEs
                    ? 'CONVERTIR PDF A HTML5 (CONVERSOR DUAL 2 EN 1)'
                    : 'CONVERT PDF TO HTML5 (2-IN-1 DUAL CONVERTER)'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'html-to-pdf'
                  ? isEs
                    ? 'Convierte archivos web (.html) en documentos PDF de alta fidelidad.'
                    : 'Convert web files (.html) into high-fidelity PDF documents.'
                  : isEs
                    ? 'Transforma tu PDF en páginas web HTML5 responsivas con selector de páginas 100% en RAM.'
                    : 'Transform PDF into responsive HTML5 web pages with page selector 100% in RAM.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'html-to-pdf'
                    ? isEs
                      ? 'Seleccionar Archivo HTML (.html)'
                      : 'Select HTML File (.html)'
                    : isEs
                      ? 'Seleccionar Archivo PDF'
                      : 'Select PDF File'}
                </span>
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
            /* VISTA PRINCIPAL CON PREVISUALIZACIÓN Y PANEL DE CONTROL */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
            >
              {/* LADO IZQUIERDO: VISOR SPLIT CON MINIATURAS 1 COLUMNA + VISOR TAMAÑO NORMAL */}
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col lg:h-[780px] lg:max-h-[780px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                    <Code className="w-4 h-4 text-amber-400" />
                    <span>
                      {isEs
                        ? '001 / VISOR Y SELECCIÓN DE PÁGINAS'
                        : '001 / VIEWER & PAGE SELECTION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-amber-400 text-[11px]">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages} {isEs ? 'a HTML' : 'to HTML'}
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT */}
                <div className="w-full flex-1 bg-[#121215] rounded-xl overflow-hidden relative border border-white/5 font-mono min-h-0 flex">
                  {/* COLUMNA IZQUIERDA: MINIATURAS EN 1 COLUMNA CON CHECKBOX */}
                  <div className="w-32 sm:w-36 flex-shrink-0 bg-zinc-950/90 border-r border-white/10 p-2 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="text-[9px] text-zinc-400 font-mono uppercase font-bold">
                        {isEs ? 'PÁGS' : 'PAGES'} ({totalPages})
                      </span>
                      <button
                        type="button"
                        onClick={
                          targetPages.length === totalPages ? handleDeselectAll : handleSelectAll
                        }
                        className="text-[9px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                        title={
                          targetPages.length === totalPages
                            ? isEs
                              ? 'Deseleccionar todas'
                              : 'Deselect all'
                            : isEs
                              ? 'Seleccionar todas'
                              : 'Select all'
                        }
                      >
                        {targetPages.length === totalPages
                          ? isEs
                            ? 'Ninguna'
                            : 'None'
                          : isEs
                            ? 'Todas'
                            : 'All'}
                      </button>
                    </div>

                    {isRendering ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-400 text-[10px]">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>{isEs ? 'Cargando...' : 'Loading...'}</span>
                      </div>
                    ) : totalPages > 0 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isIncluded = targetPageSet.has(pageNum);
                        const isActive = activePage === pageNum;

                        return (
                          <div
                            key={pageNum}
                            onClick={() => setActivePage(pageNum)}
                            className={`w-full bg-zinc-900 border rounded-lg p-1.5 flex flex-col items-center relative transition-all cursor-pointer group ${
                              isActive
                                ? 'border-white ring-2 ring-white/40 bg-zinc-800'
                                : isIncluded
                                  ? 'border-amber-500/50 hover:border-amber-400 bg-zinc-900'
                                  : 'border-white/5 opacity-50 grayscale hover:opacity-80 hover:border-white/20'
                            }`}
                          >
                            {/* Checkbox selector */}
                            <button
                              type="button"
                              onClick={(e) => togglePageSelection(pageNum, e)}
                              className={`absolute top-2 left-2 z-10 p-0.5 rounded transition-all cursor-pointer ${
                                isIncluded
                                  ? 'bg-amber-500 text-black shadow-md font-bold'
                                  : 'bg-black/70 text-zinc-500 hover:text-white border border-white/20'
                              }`}
                              title={
                                isIncluded
                                  ? isEs
                                    ? 'Quitar de la conversión HTML'
                                    : 'Exclude from HTML'
                                  : isEs
                                    ? 'Incluir en la conversión HTML'
                                    : 'Include in HTML'
                              }
                            >
                              {isIncluded ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <div className="w-3 h-3" />
                              )}
                            </button>

                            <div className="w-full bg-white rounded overflow-hidden aspect-[1/1.4] relative flex items-center justify-center">
                              {pageDataUrls[pageNum] ? (
                                <img
                                  src={pageDataUrls[pageNum]}
                                  alt={`Pág ${pageNum}`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-[10px] text-zinc-600 font-mono font-bold">
                                  #{pageNum}
                                </span>
                              )}
                              <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[8px] px-1 py-0.2 rounded font-bold">
                                #{pageNum}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500 text-[10px] text-center">
                        <Code className="w-5 h-5 text-amber-500" />
                        <span>{isEs ? 'Modo HTML' : 'HTML Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF EN TAMAÑO NORMAL */}
                  <div className="flex-1 bg-zinc-950 p-2 relative flex flex-col items-center justify-center overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        src={`${pdfUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-none bg-white rounded-lg shadow-2xl"
                        title="Visor PDF Tamaño Normal"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center p-6 h-full">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                          <Code className="w-16 h-16 text-amber-400" />
                        </div>
                        <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                          ✓ {htmlTagCount || 15} {isEs ? 'etiquetas detectadas' : 'detected tags'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: PANEL DE CONTROL CON SELECCIÓN DE PÁGINAS Y OPCIONES AVANZADAS */}
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-5 lg:h-[780px] lg:max-h-[780px]">
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
                  {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
                  <div className="mb-2 pb-2 border-b border-white/10">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                      {isEs
                        ? '002 / CONFIGURACIÓN Y SELECCIÓN DE PÁGINAS'
                        : '002 / CONFIGURATION & PAGE SELECTION'}
                    </span>
                    <h2 className="text-lg font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                      <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                      <Sliders className="w-4 h-4 text-amber-400" />
                    </h2>
                  </div>

                  {/* SECCIÓN DE SELECCIÓN DE PÁGINAS (MODO PDF A HTML) */}
                  {mode === 'pdf-to-html' && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-amber-400" />
                          <span>
                            {isEs ? 'Páginas a Exportar a HTML5' : 'Pages to Export to HTML5'}
                          </span>
                        </label>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-md">
                          {targetPages.length} {isEs ? 'de' : 'of'} {totalPages}
                        </span>
                      </div>

                      {/* MODOS DE SELECCIÓN */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('all')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'all'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Todas' : 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('range')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'range'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Rango' : 'Range'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('odd')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'odd'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Impares' : 'Odd'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('even')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'even'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Pares' : 'Even'}
                        </button>
                      </div>

                      {/* INPUT DE RANGO */}
                      {pageSelectionMode === 'range' && (
                        <div className="space-y-2 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={pageRangeInput}
                              onChange={(e) => setPageRangeInput(e.target.value)}
                              placeholder={isEs ? 'Ej: 1-5, 8, 11-20' : 'E.g: 1-5, 8, 11-20'}
                              className="flex-1 bg-zinc-900 border border-white/20 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {[
                              { label: isEs ? 'Primeras 5' : 'First 5', range: '1-5' },
                              { label: isEs ? 'Primeras 10' : 'First 10', range: '1-10' },
                              { label: isEs ? 'Primeras 20' : 'First 20', range: '1-20' },
                              { label: isEs ? 'Todas' : 'All', range: `1-${totalPages}` },
                            ].map((chip, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => setPageRangeInput(chip.range)}
                                className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded text-zinc-300 text-[10px] cursor-pointer"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACCIONES RÁPIDAS */}
                      <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400">
                        <span>{isEs ? 'Acciones rápidas:' : 'Quick actions:'}</span>
                        <div className="flex gap-2 font-bold">
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-zinc-300 hover:text-white underline cursor-pointer"
                          >
                            {isEs ? 'Todas' : 'All'}
                          </button>
                          <button
                            type="button"
                            onClick={handleInvertSelection}
                            className="text-zinc-300 hover:text-white underline cursor-pointer"
                          >
                            {isEs ? 'Invertir' : 'Invert'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="text-zinc-300 hover:text-white underline cursor-pointer"
                          >
                            {isEs ? 'Limpiar' : 'Clear'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPCIONES DE FORMATO Y MAQUETACIÓN HTML */}
                  {mode === 'pdf-to-html' ? (
                    <div className="space-y-3 font-mono text-xs">
                      {/* ESTILO Y TEMA VISUAL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-amber-400" />
                            {isEs ? 'Tema Visual HTML5' : 'HTML5 Visual Theme'}
                          </label>
                          <select
                            value={htmlTheme}
                            onChange={(e) =>
                              setHtmlTheme(
                                e.target.value as 'modern_light' | 'modern_dark' | 'minimal',
                              )
                            }
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                          >
                            <option value="modern_light">
                              {isEs ? 'Moderno Claro (Editorial)' : 'Modern Light (Editorial)'}
                            </option>
                            <option value="modern_dark">
                              {isEs ? 'Modo Oscuro (Dark Theme)' : 'Dark Mode (Dark Theme)'}
                            </option>
                            <option value="minimal">
                              {isEs ? 'Mínimo (Solo Marcado Web)' : 'Minimal (Markup Only)'}
                            </option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-amber-400" />
                            {isEs ? 'Estructura de Archivo' : 'File Structure'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSingleHtmlFile(true)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                singleHtmlFile
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? '1 Solo .html' : '1 Single .html'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSingleHtmlFile(false)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                !singleHtmlFile
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Marcado Puro' : 'Clean Markup'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CHECKBOXES DE AJUSTES */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeBase64Images}
                            onChange={(e) => setIncludeBase64Images(e.target.checked)}
                            className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incrustar capturas de página en Base64 (archivo 100% autónomo)'
                              : 'Embed Base64 page renders (100% standalone file)'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeTableOfContents}
                            onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                            className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Generar barra de navegación / índice de páginas al inicio'
                              : 'Generate navigation / page index bar at top'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={responsiveLayout}
                            onChange={(e) => setResponsiveLayout(e.target.checked)}
                            className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Diseño responsivo adaptable a móviles, tablets y escritorio'
                              : 'Responsive layout adaptable to mobile, tablet & desktop'}
                          </span>
                        </label>
                      </div>

                      {/* INFO BOX COMPATIBILIDAD */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          {isEs
                            ? 'HTML5 Autónomo sin Dependencias Externas'
                            : 'Standalone HTML5 with No External Dependencies'}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {isEs
                            ? 'El archivo .html descargado abre en cualquier navegador moderno sin necesidad de conexión a internet ni carpetas anexas.'
                            : 'Downloaded .html opens in any browser without internet or extra folders.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* OPCIONES MODO HTML A PDF */
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-amber-400" />
                            {isEs ? 'Orientación de Página' : 'Page Orientation'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setOrientation('portrait')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'portrait'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Vertical' : 'Portrait'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrientation('landscape')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'landscape'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Horizontal' : 'Landscape'}
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-amber-400" />
                            {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value as PageSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                          >
                            <option value="a4">A4 (Estándar)</option>
                            <option value="letter">Carta / Letter</option>
                            <option value="legal">Oficio / Legal</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
                <div className="pt-3 border-t border-white/10 font-sans">
                  {isProcessing && (
                    <div className="mb-3 space-y-1.5 font-mono">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                        <span className="truncate max-w-[200px]">{progressMsg}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className="h-full bg-amber-400 transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executeConversion}
                    disabled={
                      isProcessing || !file || (mode === 'pdf-to-html' && targetPages.length === 0)
                    }
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-3.5 rounded-2xl font-sans font-bold text-sm sm:text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-black" />
                    )}
                    <span>
                      {isProcessing
                        ? progressMsg
                        : !file
                          ? isEs
                            ? 'Selecciona un archivo'
                            : 'Select a file'
                          : mode === 'html-to-pdf'
                            ? isEs
                              ? 'Convertir HTML a PDF →'
                              : 'Convert HTML to PDF →'
                            : isEs
                              ? targetPages.length === 0
                                ? 'Selecciona al menos 1 página'
                                : `Convertir ${targetPages.length} Página${targetPages.length === 1 ? '' : 's'} a HTML5 →`
                              : targetPages.length === 0
                                ? 'Select at least 1 page'
                                : `Convert ${targetPages.length} Page${targetPages.length === 1 ? '' : 's'} to HTML5 →`}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
