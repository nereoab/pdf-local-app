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
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import { useUIStore } from '@/store/useUIStore';
import PdfPageViewer from '@/components/PdfPageViewer';

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

interface SlotItem {
  id: string;
  file: File | null;
  thumbnailUrl?: string;
  pageDataUrls: Record<number, string>;
  totalPages: number;
  htmlSnippet?: string;
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
  // ── ESTADO DE 3 SLOTS INDEPENDIENTES (AISLAMIENTO ESTRICTO) ──
  const [slots, setSlots] = useState<SlotItem[]>([
    { id: 'slot-1', file: null, pageDataUrls: {}, totalPages: 0 },
    { id: 'slot-2', file: null, pageDataUrls: {}, totalPages: 0 },
    { id: 'slot-3', file: null, pageDataUrls: {}, totalPages: 0 },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const inputRef0 = useRef<HTMLInputElement>(null);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (index: number) => {
    if (index === 0) return inputRef0;
    if (index === 1) return inputRef1;
    return inputRef2;
  };

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

  // MOTOR DE CONVERSIÓN
  const [conversionEngine, setConversionEngine] = useState<
    'adobe' | 'cloudconvert' | 'local' | 'dom'
  >('adobe');

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

  // CARGA AISLADA DE UN ARCHIVO EN UNA CAJA ESPECÍFICA (SIN DUPLICAR)
  const loadSingleFileIntoSlot = async (slotIdx: number, newFile: File) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = {
        ...next[slotIdx],
        file: newFile,
        pageDataUrls: {},
        totalPages: 0,
      };
      return next;
    });
    setActiveSlotIndex(slotIdx);

    const name = newFile.name.toLowerCase();
    if (name.endsWith('.pdf')) {
      try {
        const arrayBuffer = await newFile.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        const count = pdf.numPages;
        const pageUrls: Record<number, string> = {};
        const maxPagesToRender = Math.min(count, 5);

        for (let p = 1; p <= maxPagesToRender; p++) {
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport: vp } as unknown as Parameters<
              typeof page.render
            >[0]).promise;
            pageUrls[p] = canvas.toDataURL('image/png', 0.85);
          }
        }

        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) {
            next[slotIdx] = {
              ...next[slotIdx],
              pageDataUrls: pageUrls,
              totalPages: count,
              thumbnailUrl: pageUrls[1] || '',
            };
          }
          return next;
        });
      } catch (err) {
        console.warn('Error previsualizando PDF en slot', slotIdx, err);
      }
    } else {
      // Archivo HTML (.html / .htm)
      try {
        const text = await newFile.text();
        const estP = Math.max(1, Math.ceil(text.length / 3000));
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) {
            next[slotIdx] = {
              ...next[slotIdx],
              totalPages: estP,
              htmlSnippet: text.slice(0, 1000),
            };
          }
          return next;
        });
      } catch (err) {
        console.warn('Error previsualizando HTML en slot', slotIdx, err);
      }
    }
  };

  const handleSlotFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selectedFile = files[0];
    e.target.value = '';
    loadSingleFileIntoSlot(index, selectedFile);
  };

  const handleRemoveSlot = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { id: `slot-${index + 1}`, file: null, pageDataUrls: {}, totalPages: 0 };
      return next;
    });
    const remaining = slots
      .map((s, idx) => ({ s, idx }))
      .filter((item) => item.idx !== index && item.s.file !== null);
    if (remaining.length > 0) {
      setActiveSlotIndex(remaining[0].idx);
    } else {
      setActiveSlotIndex(0);
      setFile(null);
    }
  };

  const handleClearAllSlots = () => {
    setSlots([
      { id: 'slot-1', file: null, pageDataUrls: {}, totalPages: 0 },
      { id: 'slot-2', file: null, pageDataUrls: {}, totalPages: 0 },
      { id: 'slot-3', file: null, pageDataUrls: {}, totalPages: 0 },
    ]);
    setActiveSlotIndex(0);
    setFile(null);
    setCompletedResult(null);
  };

  const loadFilesIntoSlots = (fileList: FileList | File[]) => {
    const arr = Array.from(fileList).slice(0, 3);
    arr.forEach((f, idx) => {
      loadSingleFileIntoSlot(idx, f);
    });
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

  // Sincronizar slot activo con estado de archivo y previsualización
  const loadedSlots = slots.filter((s) => s.file !== null);
  const activeSlot = slots[activeSlotIndex] || slots[0];

  useEffect(() => {
    if (activeSlot && activeSlot.file) {
      setFile(activeSlot.file);
      if (activeSlot.totalPages > 0) {
        setTotalPages(activeSlot.totalPages);
      }
      if (Object.keys(activeSlot.pageDataUrls).length > 0) {
        setPageDataUrls(activeSlot.pageDataUrls);
      }
    } else {
      const firstLoaded = slots.find((s) => s.file !== null);
      if (firstLoaded && firstLoaded.file) {
        setFile(firstLoaded.file);
        setTotalPages(firstLoaded.totalPages);
        setPageDataUrls(firstLoaded.pageDataUrls);
      } else {
        setFile(null);
      }
    }
  }, [slots, activeSlotIndex]);

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

        const rawHtml = await file.text();
        const pdfDoc = await PDFDocument.create();

        let width = orientation === 'landscape' ? 841.89 : 595.28;
        let height = orientation === 'landscape' ? 595.28 : 841.89;

        if (pageSize === 'letter') {
          width = orientation === 'landscape' ? 792 : 612;
          height = orientation === 'landscape' ? 612 : 792;
        } else if (pageSize === 'legal') {
          width = orientation === 'landscape' ? 1008 : 612;
          height = orientation === 'landscape' ? 612 : 1008;
        }

        // 1. Intentar renderizado gráfico de alta fidelidad con Sandbox DOM & SVG ForeignObject
        let renderSuccess = false;
        try {
          const domWidthPx = Math.round(width * 1.333); // Convertir pt a px de pantalla (96 DPI)
          const domHeightPx = Math.round(height * 1.333);

          // Extraer contenido limpio o body
          let bodyContent = rawHtml;
          const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            bodyContent = bodyMatch[1];
          }

          // Extraer estilos <style>
          const styleMatches = rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
          const stylesBlock = styleMatches.join('\n');

          const sandboxWrapper = document.createElement('div');
          sandboxWrapper.style.position = 'fixed';
          sandboxWrapper.style.left = '-99999px';
          sandboxWrapper.style.top = '0';
          sandboxWrapper.style.width = `${domWidthPx}px`;
          sandboxWrapper.style.background = '#ffffff';
          sandboxWrapper.style.color = '#111827';
          sandboxWrapper.style.fontFamily =
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
          sandboxWrapper.style.fontSize = '14px';
          sandboxWrapper.style.lineHeight = '1.6';
          sandboxWrapper.style.padding = '36px 40px';
          sandboxWrapper.style.boxSizing = 'border-box';
          sandboxWrapper.innerHTML = `
            ${stylesBlock}
            <div class="html-pdf-render-root">
              ${bodyContent}
            </div>
          `;

          document.body.appendChild(sandboxWrapper);
          await new Promise((r) => setTimeout(r, 80));

          const totalContentHeightPx = Math.max(sandboxWrapper.scrollHeight, domHeightPx);
          const totalPagesNeeded = Math.max(1, Math.ceil(totalContentHeightPx / domHeightPx));

          // Renderizar mediante SVG ForeignObject
          const serializedHtml = new XMLSerializer().serializeToString(sandboxWrapper);
          document.body.removeChild(sandboxWrapper);

          const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${domWidthPx}" height="${totalContentHeightPx}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff; color:#111827; font-family:sans-serif;">
                ${serializedHtml}
              </div>
            </foreignObject>
          </svg>`;

          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);

          const fullImg = new Image();
          await new Promise<void>((resolve, reject) => {
            fullImg.onload = () => resolve();
            fullImg.onerror = () => reject(new Error('SVG ForeignObject render failed'));
            fullImg.src = svgUrl;
          });

          URL.revokeObjectURL(svgUrl);

          const scale = 2.0; // Renderizado Ultra HD 2x
          for (let p = 0; p < totalPagesNeeded; p++) {
            setProgressMsg(
              isEs
                ? `Compilando página ${p + 1} de ${totalPagesNeeded}...`
                : `Compiling page ${p + 1} of ${totalPagesNeeded}...`,
            );
            setProgressPercent(40 + Math.round(((p + 1) / totalPagesNeeded) * 45));

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(domWidthPx * scale);
            canvas.height = Math.round(domHeightPx * scale);
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.scale(scale, scale);

              const sourceY = p * domHeightPx;
              const sourceH = Math.min(domHeightPx, totalContentHeightPx - sourceY);

              ctx.drawImage(fullImg, 0, sourceY, domWidthPx, sourceH, 0, 0, domWidthPx, sourceH);

              const pageBlob = await new Promise<Blob | null>((res) =>
                canvas.toBlob(res, 'image/jpeg', 0.92),
              );

              if (pageBlob) {
                const pageImgBytes = new Uint8Array(await pageBlob.arrayBuffer());
                const embeddedPage = await pdfDoc.embedJpg(pageImgBytes);
                const newPdfPage = pdfDoc.addPage([width, height]);
                newPdfPage.drawImage(embeddedPage, {
                  x: 0,
                  y: 0,
                  width,
                  height,
                });
              }
            }
          }
          renderSuccess = true;
        } catch (svgErr) {
          console.warn('Fallo en SVG ForeignObject, aplicando motor estructurado DOM:', svgErr);
        }

        // 2. Fallback estructurado de alta fidelidad si ForeignObject no fue permitido por el navegador
        if (!renderSuccess || pdfDoc.getPageCount() === 0) {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const sideMargin = 45;
          const usableWidth = width - sideMargin * 2;
          let currentPage = pdfDoc.addPage([width, height]);
          let yPos = height - 55;

          const parser = new DOMParser();
          const doc = parser.parseFromString(rawHtml, 'text/html');
          const title = doc.title || file.name.replace(/\.[^/.]+$/, '');

          currentPage.drawText(title.substring(0, 60), {
            x: sideMargin,
            y: yPos,
            size: 16,
            font: boldFont,
            color: rgb(0.08, 0.12, 0.2),
          });
          yPos -= 25;

          currentPage.drawLine({
            start: { x: sideMargin, y: yPos },
            end: { x: width - sideMargin, y: yPos },
            thickness: 1,
            color: rgb(0.85, 0.88, 0.92),
          });
          yPos -= 25;

          const elements = doc.body
            ? Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, p, li, tr, pre, code'))
            : [];
          const textBlocks: {
            text: string;
            isHeading: boolean;
            isCode: boolean;
            fontSize: number;
          }[] = [];

          if (elements.length > 0) {
            elements.forEach((el) => {
              const tag = el.tagName.toLowerCase();
              const text = el.textContent?.trim() || '';
              if (!text) return;

              if (tag === 'h1')
                textBlocks.push({ text, isHeading: true, isCode: false, fontSize: 15 });
              else if (tag === 'h2')
                textBlocks.push({ text, isHeading: true, isCode: false, fontSize: 13 });
              else if (tag === 'h3' || tag === 'h4')
                textBlocks.push({ text, isHeading: true, isCode: false, fontSize: 11.5 });
              else if (tag === 'pre' || tag === 'code')
                textBlocks.push({ text, isHeading: false, isCode: true, fontSize: 8.5 });
              else textBlocks.push({ text, isHeading: false, isCode: false, fontSize: 9.5 });
            });
          } else {
            const fallbackText = rawHtml
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            textBlocks.push({ text: fallbackText, isHeading: false, isCode: false, fontSize: 9.5 });
          }

          for (const block of textBlocks) {
            const chosenFont = block.isHeading ? boldFont : font;
            const lineHeight = block.fontSize * 1.35;
            const words = block.text.split(' ');
            let line = '';

            for (let i = 0; i < words.length; i++) {
              const testLine = line + (line ? ' ' : '') + words[i];
              let testWidth = testLine.length * (block.fontSize * 0.52);
              try {
                testWidth = chosenFont.widthOfTextAtSize(testLine, block.fontSize);
              } catch {}

              if (testWidth > usableWidth && line !== '') {
                if (yPos < sideMargin + 30) {
                  currentPage = pdfDoc.addPage([width, height]);
                  yPos = height - sideMargin;
                }

                try {
                  currentPage.drawText(line, {
                    x: sideMargin,
                    y: yPos,
                    size: block.fontSize,
                    font: chosenFont,
                    color: block.isHeading ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.22, 0.26),
                  });
                } catch {}

                yPos -= lineHeight;
                line = words[i];
              } else {
                line = testLine;
              }
            }

            if (line) {
              if (yPos < sideMargin + 30) {
                currentPage = pdfDoc.addPage([width, height]);
                yPos = height - sideMargin;
              }

              try {
                currentPage.drawText(line, {
                  x: sideMargin,
                  y: yPos,
                  size: block.fontSize,
                  font: chosenFont,
                  color: block.isHeading ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.22, 0.26),
                });
              } catch {}

              yPos -= lineHeight + (block.isHeading ? 6 : 3);
            }
          }
        }

        const pdfBytes = await pdfDoc.save();
        resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl || '',
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'pdf',
            originalSize: formatFileSize(file.size),
            itemCount: pdfDoc.getPageCount(),
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

        {(loadedSlots.length > 0 || completedResult) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {completedResult
                  ? completedResult.filename
                  : file?.name ||
                    (isEs
                      ? `${loadedSlots.length} archivos cargados`
                      : `${loadedSlots.length} files loaded`)}
              </span>
            </div>
            <button
              onClick={handleClearAllSlots}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Limpiar archivos' : 'Clear files'}
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
          {/* BANNER DE RESULTADO Y MÉTRICAS (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <Code className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Exportación HTML5 completada con éxito!'
                      : 'HTML5 export completed successfully!'}
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

            {/* MÉTRICAS DE LA CONVERSIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono text-xs border-t border-zinc-800 mt-5">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Formato' : 'Format'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5 uppercase">
                  {completedResult.outputFormat}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Resultante' : 'Result Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.fileSize}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.itemCount || 1} />{' '}
                  {isEs ? 'págs' : 'pages'}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
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

          {loadedSlots.length === 0 ? (
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
              className="flex flex-col gap-6 w-full items-center"
            >
              {/* ═════════════════════════════════════════════════════════════════════════════
                  SECCIÓN 1: VISTA PREVIA AL 50% (IZQUIERDA) + 3 CAJAS INDEPENDIENTES (DERECHA)
                 ═════════════════════════════════════════════════════════════════════════════ */}
              <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* BARRA SUPERIOR DE LA SECCIÓN 1 */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                      {isEs ? '001 / VISTA PREVIA (50%) Y ARCHIVOS' : '001 / PREVIEW (50%) & FILES'}
                    </span>
                    <div className="hidden sm:block h-3.5 w-px bg-zinc-700" />
                    <span className="text-xs text-zinc-300 font-bold font-sans truncate max-w-[200px] sm:max-w-[400px]">
                      {file ? file.name : isEs ? 'Sin archivo seleccionado' : 'No file selected'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                      <span className="font-bold font-mono text-white">{loadedSlots.length}</span> /
                      3 {isEs ? 'cargados' : 'loaded'}
                    </div>

                    {loadedSlots.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSlots}
                        className="text-zinc-500 hover:text-red-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1 ml-2"
                        title={isEs ? 'Limpiar todas las cajas' : 'Clear all boxes'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">
                          {isEs ? 'Limpiar todo' : 'Clear all'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT: IZQUIERDA AL 50% | DERECHA 3 CAJAS */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[420px] overflow-hidden">
                  {/* ── LADO IZQUIERDO: VISOR COMPACTO A MITAD DE TAMAÑO (50% VISUAL) ── */}
                  <div className="lg:col-span-6 bg-[#0c0c10] rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner min-h-[380px]">
                    {file ? (
                      <div className="flex flex-col items-center justify-center w-full h-full py-1">
                        {/* HOJA PDF O VISTA HTML EN VISTA PREVIA REDUCIDA AL 50% */}
                        {mode === 'pdf-to-html' || file.name.toLowerCase().endsWith('.pdf') ? (
                          <div className="relative bg-white rounded-xl shadow-2xl border border-zinc-400/80 overflow-hidden flex items-center justify-center transition-all duration-300 w-[240px] sm:w-[260px] h-[330px] sm:h-[358px] group">
                            {activeSlot.pageDataUrls[activePage] ? (
                              <img
                                src={activeSlot.pageDataUrls[activePage]}
                                alt={`Pág ${activePage}`}
                                className="w-full h-full object-contain select-none"
                              />
                            ) : activeSlot.thumbnailUrl ? (
                              <img
                                src={activeSlot.thumbnailUrl}
                                alt="Pág 1"
                                className="w-full h-full object-contain select-none"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                <span className="text-[11px] font-mono font-bold">
                                  Pág. {activePage}
                                </span>
                              </div>
                            )}

                            {totalPages > 0 && (
                              <div className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                                #{activePage} / {totalPages}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* FRAME WEB HTML AL 50% VISUAL */
                          <div className="relative bg-[#18181f] text-white rounded-xl shadow-2xl border border-amber-500/40 overflow-hidden flex flex-col p-4 transition-all duration-300 w-[260px] sm:w-[280px] h-[330px] sm:h-[358px] group justify-between">
                            <div className="space-y-2 overflow-hidden flex-1 flex flex-col">
                              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-zinc-700/80 pb-1.5 shrink-0">
                                <Code className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="truncate font-sans font-extrabold text-amber-300">
                                  {file.name}
                                </span>
                              </div>

                              {/* CONTENIDO PREVIO DE CÓDIGO HTML */}
                              <div className="flex-1 overflow-hidden rounded border border-zinc-800 bg-[#0e0e12] p-2.5 text-[10px] font-mono text-zinc-300 leading-relaxed overflow-y-auto custom-scrollbar">
                                {activeSlot.htmlSnippet ? (
                                  <pre className="whitespace-pre-wrap font-mono text-amber-200/90 text-[9px]">
                                    {activeSlot.htmlSnippet}
                                  </pre>
                                ) : (
                                  <p className="text-zinc-500 italic">
                                    {isEs
                                      ? 'Documento web HTML (.html/.htm)'
                                      : 'HTML web document (.html/.htm)'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-1.5 border-t border-zinc-800 shrink-0">
                              <span className="text-amber-400 font-bold">
                                {htmlTagCount ? `${htmlTagCount} etiquetas` : 'HTML5'}
                              </span>
                              <span className="bg-black/80 px-2 py-0.5 rounded text-white font-bold border border-white/20">
                                #{activePage} / {totalPages || 1}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* CONTROLES COMPACTOS DE PAGINACIÓN */}
                        {totalPages > 1 && (
                          <div className="flex items-center gap-3 mt-3 bg-zinc-900 border border-zinc-700/80 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 shadow-md">
                            <button
                              type="button"
                              onClick={() => setActivePage(Math.max(1, activePage - 1))}
                              disabled={activePage <= 1}
                              className="px-2 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                              title={isEs ? 'Página anterior' : 'Previous page'}
                            >
                              ◀
                            </button>
                            <span className="font-bold text-white text-[11px]">
                              {activePage} / {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
                              disabled={activePage >= totalPages}
                              className="px-2 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                              title={isEs ? 'Página siguiente' : 'Next page'}
                            >
                              ▶
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500 font-mono text-xs">
                        <Code className="w-8 h-8 text-zinc-600" />
                        <span>
                          {isEs ? 'Sin archivo para previsualizar' : 'No file to preview'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── LADO DERECHO: 3 CAJAS INDEPENDIENTES (AISLAMIENTO ESTRICTO) ── */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-3 h-full">
                    {slots.map((slot, sIdx) => {
                      const isLoaded = slot.file !== null;
                      const isActive = isLoaded && sIdx === activeSlotIndex;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            if (isLoaded) {
                              setActiveSlotIndex(sIdx);
                            } else {
                              getSlotInputRef(sIdx).current?.click();
                            }
                          }}
                          className={`flex-1 rounded-2xl border-2 transition-all p-3.5 flex items-center justify-between cursor-pointer min-h-[95px] relative group shadow-sm ${
                            isActive
                              ? 'bg-amber-950/40 border-amber-500 shadow-amber-500/10'
                              : isLoaded
                                ? 'bg-[#121217] border-zinc-700/80 hover:border-zinc-500'
                                : 'bg-[#0e0e12] border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-[#121218]'
                          }`}
                        >
                          <input
                            ref={getSlotInputRef(sIdx)}
                            type="file"
                            accept={
                              mode === 'html-to-pdf'
                                ? '.html,.htm,text/html'
                                : '.pdf,application/pdf'
                            }
                            className="hidden"
                            onChange={(e) => handleSlotFileChange(sIdx, e)}
                          />

                          {isLoaded ? (
                            <div className="flex items-center justify-between w-full gap-3 font-mono">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`p-2.5 rounded-xl border flex-shrink-0 ${
                                    isActive
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                  }`}
                                >
                                  {mode === 'html-to-pdf' ? (
                                    <Code className="w-5 h-5 text-amber-400" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-amber-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                      {isEs ? `Caja ${sIdx + 1}` : `Box ${sIdx + 1}`}
                                    </span>
                                    {isActive && (
                                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 font-bold">
                                        {isEs ? 'Visualizando' : 'Viewing'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px] font-sans">
                                    {slot.file!.name}
                                  </p>
                                  <span className="text-[10px] text-zinc-400">
                                    {formatFileSize(slot.file!.size)}
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
                                      ? `+ Cargar ${mode === 'html-to-pdf' ? 'HTML' : 'PDF'} ${sIdx + 1}`
                                      : `+ Upload ${mode === 'html-to-pdf' ? 'HTML' : 'PDF'} ${sIdx + 1}`}
                                  </p>
                                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                                    {mode === 'html-to-pdf' ? '.html / .htm' : '.pdf'}
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
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: PANEL DE CONTROL DEBAJO EN CUADRÍCULA HORIZONTAL */}
              <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                      {isEs
                        ? '002 / CONFIGURACIÓN Y SELECCIÓN DE PÁGINAS'
                        : '002 / CONFIGURATION & PAGE SELECTION'}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white font-sans uppercase tracking-tight">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                    <Sliders className="w-4 h-4" />
                  </div>
                </div>

                {/* SELECTOR VISUAL DE MOTOR DE CONVERSIÓN EN 2X2 */}
                <div className="bg-[#121217] p-3.5 sm:p-4 rounded-2xl border border-zinc-700/80 space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEs ? 'Motor de Conversión HTML5 / PDF' : 'HTML5 / PDF Conversion Engine'}
                      </span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {isEs ? '4 Motores Disponibles' : '4 Engines Available'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* OPCIÓN 1: ADOBE ACROBAT SERVICES */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('adobe')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'adobe'
                          ? 'bg-blue-950/50 border-blue-400 ring-1 ring-blue-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>🏆 Adobe Acrobat Pro (Nube)</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          {isEs ? 'Alta Fidelidad' : 'High Fidelity'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Máxima fidelidad oficial en conversión de documentos web y estructuras CSS/HTML5 complejas.'
                          : 'Official cloud fidelity for complex web documents and CSS/HTML5 layouts.'}
                      </p>
                    </button>

                    {/* OPCIÓN 2: CLOUDCONVERT API */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('cloudconvert')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'cloudconvert'
                          ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>🌐 CloudConvert (Nube)</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {isEs ? 'Procesamiento Cloud' : 'Cloud Engine'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Motor en la nube de alta disponibilidad. Genera código HTML limpio, semántico y responsivo.'
                          : 'High-performance cloud engine. Generates clean, semantic and responsive HTML.'}
                      </p>
                    </button>

                    {/* OPCIÓN 3: MOTOR LOCAL PDF.JS */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('local')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'local'
                          ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>⚡ Motor Local PDF.js</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {isEs ? 'Instantáneo (~0.5s)' : 'Instant (~0.5s)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Extracción vectorial y de texto 100% privada en memoria del navegador sin dependencias externas.'
                          : '100% private in-browser vector & text extraction without external dependencies.'}
                      </p>
                    </button>

                    {/* OPCIÓN 4: MOTOR DOM SEMÁNTICO */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('dom')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'dom'
                          ? 'bg-purple-950/50 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>📊 DOM Semántico (HTML5)</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {isEs ? 'HTML5 / CSS3' : 'HTML5 / CSS3'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Maquetación semántica estructurada con soporte para tablas, encabezados y diseño responsivo.'
                          : 'Structured semantic layout with support for tables, headers & responsive design.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* GRID DE OPCIONES MODULARES EN 3 COLUMNAS */}
                {mode === 'pdf-to-html' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COLUMNA 1: SELECCIÓN DE PÁGINAS */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-amber-400" />
                            <span>{isEs ? 'Páginas a Exportar' : 'Pages to Export'}</span>
                          </label>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-zinc-800 border border-zinc-600 text-zinc-200 rounded-lg shadow-sm">
                            {targetPages.length} {isEs ? 'de' : 'of'} {totalPages}
                          </span>
                        </div>

                        {/* MODOS DE SELECCIÓN */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode('all')}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              pageSelectionMode === 'all'
                                ? 'bg-amber-500 text-black border-amber-500 shadow-md font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Todas' : 'All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode('range')}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              pageSelectionMode === 'range'
                                ? 'bg-amber-500 text-black border-amber-500 shadow-md font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Rango' : 'Range'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode('odd')}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              pageSelectionMode === 'odd'
                                ? 'bg-amber-500 text-black border-amber-500 shadow-md font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Impares' : 'Odd'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageSelectionMode('even')}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              pageSelectionMode === 'even'
                                ? 'bg-amber-500 text-black border-amber-500 shadow-md font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Pares' : 'Even'}
                          </button>
                        </div>

                        {/* INPUT DE RANGO */}
                        {pageSelectionMode === 'range' && (
                          <div className="space-y-2 pt-1 border-t border-zinc-800">
                            <input
                              type="text"
                              value={pageRangeInput}
                              onChange={(e) => setPageRangeInput(e.target.value)}
                              placeholder={isEs ? 'Ej: 1-5, 8, 11-20' : 'E.g: 1-5, 8, 11-20'}
                              className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                            />
                            <div className="flex flex-wrap gap-1 text-[10px]">
                              {[
                                { label: isEs ? '1-5' : '1-5', range: '1-5' },
                                { label: isEs ? '1-10' : '1-10', range: '1-10' },
                                { label: isEs ? '1-20' : '1-20', range: '1-20' },
                                { label: isEs ? 'Todas' : 'All', range: `1-${totalPages}` },
                              ].map((chip, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => setPageRangeInput(chip.range)}
                                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-[10px] cursor-pointer"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCIONES RÁPIDAS */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800/80 text-zinc-400">
                        <span>{isEs ? 'Acciones:' : 'Actions:'}</span>
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

                    {/* COLUMNA 2: TEMA VISUAL Y ESTRUCTURA */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
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
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
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

                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-amber-400" />
                            {isEs ? 'Estructura de Archivo' : 'File Structure'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSingleHtmlFile(true)}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                singleHtmlFile
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              {isEs ? '1 Solo .html' : '1 Single .html'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSingleHtmlFile(false)}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                !singleHtmlFile
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Marcado Puro' : 'Clean Markup'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 3: AJUSTES AVANZADOS Y CHECKBOXES */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeBase64Images}
                            onChange={(e) => setIncludeBase64Images(e.target.checked)}
                            className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span className="text-[11px] leading-tight">
                            {isEs
                              ? 'Incrustar capturas Base64 (autónomo)'
                              : 'Embed Base64 renders (standalone)'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeTableOfContents}
                            onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                            className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span className="text-[11px] leading-tight">
                            {isEs
                              ? 'Generar barra de navegación / índice'
                              : 'Generate navigation / page index'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={responsiveLayout}
                            onChange={(e) => setResponsiveLayout(e.target.checked)}
                            className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span className="text-[11px] leading-tight">
                            {isEs ? 'Diseño responsivo adaptable' : 'Responsive adaptive layout'}
                          </span>
                        </label>
                      </div>

                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                        <p className="text-[10px] text-zinc-300 leading-snug">
                          {isEs
                            ? 'HTML5 autónomo compatible con todos los navegadores.'
                            : 'Standalone HTML5 compatible with all browsers.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODO HTML A PDF EN 3 COLUMNAS */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COLUMNA 1: ORIENTACIÓN */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                          <Layout className="w-4 h-4 text-amber-400" />
                          {isEs ? 'Orientación de Página' : 'Page Orientation'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOrientation('portrait')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              orientation === 'portrait'
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Vertical' : 'Portrait'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrientation('landscape')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              orientation === 'landscape'
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Horizontal' : 'Landscape'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: TAMAÑO DE PAPEL */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-amber-400" />
                          {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                        </label>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(e.target.value as PageSize)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        >
                          <option value="a4">A4 (Estándar)</option>
                          <option value="letter">Carta / Letter</option>
                          <option value="legal">Oficio / Legal</option>
                        </select>
                      </div>
                    </div>

                    {/* COLUMNA 3: COMPATIBILIDAD */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-[10px] text-zinc-300 font-mono">
                          {isEs
                            ? 'Compilación vectorial estándar PDF/A de alta nitidez'
                            : 'Standard high-sharpness PDF/A vector compilation'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
                <div className="pt-3 border-t border-zinc-800 font-sans">
                  {isProcessing && (
                    <div className="mb-3 space-y-1.5 font-mono">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                        <span className="truncate max-w-[200px]">{progressMsg}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
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
