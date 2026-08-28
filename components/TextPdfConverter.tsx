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
  AlignLeft,
  Type,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Cpu,
  HelpCircle,
  Plus,
  Check,
  ListChecks,
  Trash2,
} from 'lucide-react';
import { TextIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import { useUIStore } from '@/store/useUIStore';

type ConversionDirection = 'pdf-to-text' | 'text-to-pdf';
type PageSize = 'a4' | 'letter' | 'legal';
type FontFamily = 'helvetica' | 'courier' | 'times';
type PageSelectionMode = 'all' | 'range' | 'custom' | 'even' | 'odd';

interface TextPdfConverterProps {
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

function sanitizeText(str: string): string {
  if (!str) return '';
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uD800-\uDFFF\uFFFE\uFFFF]/g, '').trim();
}

export default function TextPdfConverter({ defaultMode = 'pdf-to-text' }: TextPdfConverterProps) {
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
    if (defaultMode === 'pdf-to-text' && name.endsWith('.pdf')) return globalFile;
    if (defaultMode === 'text-to-pdf' && (name.endsWith('.txt') || name.endsWith('.text')))
      return globalFile;
    return null;
  });

  const [manualText, setManualText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // SELECCIÓN DE PÁGINAS (PDF -> TEXTO)
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // OPCIONES AVANZADAS PDF -> TEXTO
  const [preserveLayout, setPreserveLayout] = useState<boolean>(true);
  const [addPageSeparators, setAddPageSeparators] = useState<boolean>(true);
  const [encoding, setEncoding] = useState<'utf-8' | 'ascii'>('utf-8');
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState<boolean>(false);
  const [includeDocHeader, setIncludeDocHeader] = useState<boolean>(true);

  // OPCIONES AVANZADAS TEXTO -> PDF
  const [fontFamily, setFontFamily] = useState<FontFamily>('helvetica');
  const [fontSize, setFontSize] = useState<number>(10);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);

  const pdfUrl = useMemo(() => {
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

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

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setSelectedPageSet(new Set());
      setManualText('');
      setExtractedText('');
      return;
    }
    if (file.name.toLowerCase().endsWith('.pdf')) {
      cargarMiniaturasPdfUltraFast(file);
    } else if (
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.text')
    ) {
      file.text().then((txt) => {
        setManualText(txt);
        setTotalPages(1);
      });
    }
  }, [file]);

  // CARGA ULTRA RÁPIDA DE MINIATURAS (ESCALA 0.22 + STREAMING ASÍNCRONO)
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
    const isText = name.endsWith('.txt') || name.endsWith('.text');

    if (mode === 'text-to-pdf') {
      if (isText) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo de texto (.txt) cargado' : 'Text file (.txt) loaded');
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona un archivo de texto (.txt)'
            : 'Please select a text file (.txt)',
        );
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(
          isEs ? 'Archivo PDF cargado para extraer texto' : 'PDF file loaded for text extraction',
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
    setManualText('');
    setExtractedText('');
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const handleRemoveFile = () => {
    cancelRenderRef.current = true;
    setFile(null);
    setGlobalFile(null);
    setManualText('');
    setExtractedText('');
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
    if (mode === 'pdf-to-text' && !file) return;
    if (mode === 'text-to-pdf' && !file && !manualText.trim()) {
      toast.error(
        isEs ? 'Por favor escribe o sube un archivo de texto.' : 'Please enter or upload text.',
      );
      return;
    }
    if (mode === 'pdf-to-text' && targetPages.length === 0) {
      toast.error(
        isEs
          ? 'Por favor selecciona al menos una página para extraer.'
          : 'Please select at least one page to extract.',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    let localUrl: string | null = null;
    let resultBlob: Blob | null = null;

    try {
      if (mode === 'text-to-pdf') {
        setProgressMsg(
          isEs
            ? 'Formateando tipografía y maquetación PDF...'
            : 'Formatting typography & PDF layout...',
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(40);

        const pdfDoc = await PDFDocument.create();
        let selectedFont = StandardFonts.Helvetica;
        let selectedBoldFont = StandardFonts.HelveticaBold;
        if (fontFamily === 'courier') {
          selectedFont = StandardFonts.Courier;
          selectedBoldFont = StandardFonts.CourierBold;
        } else if (fontFamily === 'times') {
          selectedFont = StandardFonts.TimesRoman;
          selectedBoldFont = StandardFonts.TimesRomanBold;
        }

        const font = await pdfDoc.embedFont(selectedFont);
        const boldFont = await pdfDoc.embedFont(selectedBoldFont);

        let width = 595.28;
        let height = 841.89;
        if (pageSize === 'letter') {
          width = 612;
          height = 792;
        } else if (pageSize === 'legal') {
          width = 612;
          height = 1008;
        }

        const sideMargin = 45;
        let page = pdfDoc.addPage([width, height]);
        let yPos = height - 55;

        const docTitle = file
          ? file.name.replace(/\.[^/.]+$/, '')
          : isEs
            ? 'Documento de Texto'
            : 'Text Document';
        page.drawText(docTitle, {
          x: sideMargin,
          y: yPos,
          size: fontSize + 5,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
        });

        page.drawLine({
          start: { x: sideMargin, y: yPos - 8 },
          end: { x: width - sideMargin, y: yPos - 8 },
          thickness: 1,
          color: rgb(0.85, 0.85, 0.85),
        });

        yPos -= 30;

        const textToRender = manualText || (file ? await file.text() : '');
        const lines = textToRender.split('\n');
        const maxCharsPerLine = Math.floor((width - sideMargin * 2) / (fontSize * 0.55));

        for (const line of lines) {
          let remaining = line;
          if (!remaining.trim()) {
            yPos -= fontSize * lineSpacing;
            continue;
          }

          while (remaining.length > 0) {
            if (yPos < 50) {
              page = pdfDoc.addPage([width, height]);
              yPos = height - 50;
            }

            const chunk = remaining.substring(0, maxCharsPerLine);
            remaining = remaining.substring(maxCharsPerLine);

            page.drawText(chunk, {
              x: sideMargin,
              y: yPos,
              size: fontSize,
              font,
              color: rgb(0.15, 0.15, 0.15),
            });

            yPos -= fontSize * lineSpacing;
          }
        }

        if (addPageNumbers) {
          const pages = pdfDoc.getPages();
          pages.forEach((p, idx) => {
            p.drawText(`Página ${idx + 1} de ${pages.length}`, {
              x: width / 2 - 35,
              y: 20,
              size: 9,
              font,
              color: rgb(0.5, 0.5, 0.5),
            });
          });
        }

        const pdfBytes = await pdfDoc.save();
        resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${(file ? file.name : 'Documento').replace(/\.[^/.]+$/, '')}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'pdf',
            originalSize: file ? formatFileSize(file.size) : `${textToRender.length} chars`,
            itemCount: pdfDoc.getPageCount(),
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs ? '¡Texto convertido a PDF con éxito!' : 'Text converted to PDF successfully!',
        );
      } else {
        // MODO PDF A TEXTO (EXTRAE TEXTO SELECCIONADO EN UTF-8 LIMPIO)
        const totalToConvert = targetPages.length;
        setProgressMsg(
          isEs
            ? `Extrayendo texto de ${totalToConvert} páginas...`
            : `Extracting text from ${totalToConvert} pages...`,
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(20);

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file!.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        let fullExtractedText = '';
        const docTitle = file!.name.replace(/\.[^/.]+$/, '');

        if (includeDocHeader) {
          fullExtractedText += `====================================================\n`;
          fullExtractedText += `${docTitle}\n`;
          fullExtractedText += `${isEs ? 'Extraído con PDFBlack Suite' : 'Extracted with PDFBlack Suite'} - ${new Date().toLocaleDateString()}\n`;
          fullExtractedText += `====================================================\n\n`;
        }

        for (let idx = 0; idx < totalToConvert; idx++) {
          const pageNum = targetPages[idx];
          setProgressMsg(
            isEs
              ? `Procesando página ${idx + 1} de ${totalToConvert} (Pág. ${pageNum})...`
              : `Processing page ${idx + 1} of ${totalToConvert} (Page ${pageNum})...`,
          );
          setProgressPercent(20 + Math.round(((idx + 1) / totalToConvert) * 65));

          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          if (addPageSeparators) {
            fullExtractedText += `\n--- ${isEs ? 'PÁGINA' : 'PAGE'} ${pageNum} ---\n\n`;
          }

          // Agrupar items de texto por coordenadas verticales (Y)
          const items = textContent.items as Array<{ str?: string; transform?: number[] }>;
          const lineMap = new Map<number, string[]>();

          for (const item of items) {
            if (!item.str || !item.transform) continue;
            const yCoord = Math.round(item.transform[5]);
            if (!lineMap.has(yCoord)) {
              lineMap.set(yCoord, []);
            }
            lineMap.get(yCoord)!.push(item.str);
          }

          const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

          if (preserveLayout) {
            sortedY.forEach((y) => {
              let line = lineMap.get(y)!.join(' ').trim();
              if (removeExtraSpaces) {
                line = line.replace(/\s+/g, ' ');
              }
              if (line) {
                fullExtractedText += sanitizeText(line) + '\n';
              }
            });
          } else {
            // Flujo continuo
            let pageBlob = '';
            sortedY.forEach((y) => {
              pageBlob += ' ' + lineMap.get(y)!.join(' ').trim();
            });
            if (removeExtraSpaces) {
              pageBlob = pageBlob.replace(/\s+/g, ' ');
            }
            fullExtractedText += sanitizeText(pageBlob.trim()) + '\n\n';
          }

          await new Promise((r) => setTimeout(r, 10));
        }

        setExtractedText(fullExtractedText);
        setProgressMsg(
          isEs
            ? 'Generando archivo de texto plano UTF-8...'
            : 'Generating UTF-8 plain text file...',
        );
        setProgressPercent(90);

        resultBlob = new Blob([fullExtractedText], { type: 'text/plain;charset=utf-8;' });
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${docTitle}_Texto.txt`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'txt',
            originalSize: formatFileSize(file!.size),
            itemCount: totalToConvert,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs
            ? `¡${totalToConvert} páginas extraídas a texto (.txt) con éxito!`
            : `Successfully extracted ${totalToConvert} pages to text (.txt)!`,
        );
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error en la conversión de texto.' : 'Text conversion error.');
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
        accept={mode === 'text-to-pdf' ? '.txt, .text, text/plain' : '.pdf, application/pdf'}
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
                ? '004 / EXTRACCIÓN Y CONVERSIÓN DE TEXTO PLANO (CONVERSOR DUAL 2 EN 1)'
                : '004 / PLAIN TEXT EXTRACTION & CONVERSION (2-IN-1 DUAL CONVERTER)'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <TextIcon className="w-6 h-6 text-white rounded-sm flex-shrink-0" />
              {mode === 'text-to-pdf'
                ? isEs
                  ? 'CONVERTIR TEXTO A PDF'
                  : 'CONVERT TEXT TO PDF'
                : isEs
                  ? 'CONVERTIR PDF A TEXTO PLANO (CONVERSOR DUAL 2 EN 1)'
                  : 'CONVERT PDF TO PLAIN TEXT (2-IN-1 DUAL CONVERTER)'}
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
          {/* BANNER DE RESULTADO Y MÉTRICAS (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <TextIcon className="w-7 h-7 text-[#FAF6EE] rounded-sm drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Extracción de texto completada con éxito!'
                      : 'Text extraction completed successfully!'}
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
                  {isEs ? 'Formato de Salida' : 'Output Format'}
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
            currentToolId="text-pdf"
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
                onClick={() => handleSwitchMode('text-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'text-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TextIcon className="w-4 h-4 rounded-sm text-black" />
                <span>{isEs ? 'Texto a PDF (.txt → .pdf)' : 'Text to PDF (.txt → .pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('pdf-to-text')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-text'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a Texto (.pdf → .txt)' : 'PDF to Text (.pdf → .txt)'}</span>
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
                {mode === 'text-to-pdf'
                  ? isEs
                    ? 'CONVERTIR ARCHIVO DE TEXTO A PDF'
                    : 'CONVERT TEXT FILE TO PDF'
                  : isEs
                    ? 'CONVERTIR PDF A TEXTO PLANO (CONVERSOR DUAL 2 EN 1)'
                    : 'CONVERT PDF TO PLAIN TEXT (2-IN-1 DUAL CONVERTER)'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'text-to-pdf'
                  ? isEs
                    ? 'Transforma texto plano (.txt) en documentos PDF limpios y paginados.'
                    : 'Transform plain text (.txt) into clean, paginated PDF documents.'
                  : isEs
                    ? 'Extrae todo el contenido textual de tu PDF a formato .txt UTF-8 con selector de páginas y 100% en RAM.'
                    : 'Extract textual content from PDF to clean UTF-8 .txt format with page selector 100% in RAM.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'text-to-pdf'
                    ? isEs
                      ? 'Seleccionar Archivo de Texto (.txt)'
                      : 'Select Text File (.txt)'
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
              <div className="lg:col-span-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col lg:h-[780px] lg:max-h-[780px] relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                    <FileText className="w-4 h-4 text-white" />
                    <span>
                      {isEs
                        ? '001 / VISOR Y SELECCIÓN DE PÁGINAS'
                        : '001 / VIEWER & PAGE SELECTION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages} {isEs ? 'a Texto' : 'to Text'}
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT */}
                <div className="w-full flex-1 bg-[#121217] rounded-2xl overflow-hidden relative border border-zinc-700/80 font-mono min-h-0 flex shadow-inner">
                  {/* COLUMNA IZQUIERDA: MINIATURAS EN 1 COLUMNA CON CHECKBOX */}
                  <div className="w-32 sm:w-36 flex-shrink-0 bg-[#0c0c0f] border-r border-zinc-800 p-2 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                      <span className="text-[9px] text-zinc-400 font-mono uppercase font-bold">
                        {isEs ? 'PÁGS' : 'PAGES'} ({totalPages})
                      </span>
                      <button
                        type="button"
                        onClick={
                          targetPages.length === totalPages ? handleDeselectAll : handleSelectAll
                        }
                        className="text-[9px] text-zinc-300 hover:text-white font-bold cursor-pointer"
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
                            className={`w-full bg-[#18181f] border rounded-xl p-1.5 flex flex-col items-center relative transition-all cursor-pointer group shadow-sm ${
                              isActive
                                ? 'border-white ring-2 ring-white/40 bg-zinc-800'
                                : isIncluded
                                  ? 'border-zinc-600 hover:border-zinc-400 bg-zinc-900'
                                  : 'border-zinc-800 opacity-40 grayscale hover:opacity-80 hover:border-zinc-700'
                            }`}
                          >
                            {/* Checkbox selector */}
                            <button
                              type="button"
                              onClick={(e) => togglePageSelection(pageNum, e)}
                              className={`absolute top-2 left-2 z-10 p-0.5 rounded-md transition-all cursor-pointer ${
                                isIncluded
                                  ? 'bg-white text-black shadow-md'
                                  : 'bg-black/70 text-zinc-500 hover:text-white border border-zinc-700'
                              }`}
                              title={
                                isIncluded
                                  ? isEs
                                    ? 'Quitar de la extracción de texto'
                                    : 'Exclude from text'
                                  : isEs
                                    ? 'Incluir en la extracción de texto'
                                    : 'Include in text'
                              }
                            >
                              {isIncluded ? (
                                <Check className="w-3 h-3 stroke-[3] text-black" />
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
                        <TextIcon className="w-5 h-5" />
                        <span>{isEs ? 'Modo Texto' : 'Text Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF O EDITOR DE TEXTO EN TAMAÑO NORMAL */}
                  <div className="flex-1 bg-zinc-950 p-2 relative flex flex-col items-center justify-center overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        src={`${pdfUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-none bg-white rounded-lg shadow-2xl"
                        title="Visor PDF Tamaño Normal"
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col">
                        <label className="text-xs text-zinc-400 font-mono font-bold mb-2 flex items-center gap-1.5">
                          <AlignLeft className="w-4 h-4 text-cyan-400" />
                          <span>
                            {isEs ? 'Contenido de Texto Editable:' : 'Editable Text Content:'}
                          </span>
                        </label>
                        <textarea
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          placeholder={
                            isEs
                              ? 'Escribe o pega aquí el texto que deseas convertir a PDF...'
                              : 'Type or paste text to convert to PDF...'
                          }
                          className="w-full flex-1 bg-zinc-900/90 border border-white/10 rounded-xl p-4 text-xs font-mono text-white resize-none focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: PANEL DE CONTROL CON SELECCIÓN DE PÁGINAS Y OPCIONES AVANZADAS */}
              <div className="lg:col-span-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-5 lg:h-[780px] lg:max-h-[780px] relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
                  {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
                  <div className="mb-2 pb-2 border-b border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-0.5">
                      {isEs
                        ? '002 / CONFIGURACIÓN Y SELECCIÓN DE PÁGINAS'
                        : '002 / CONFIGURATION & PAGE SELECTION'}
                    </span>
                    <h2 className="text-lg font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                      <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                      <Sliders className="w-4 h-4 text-white" />
                    </h2>
                  </div>

                  {/* SECCIÓN DE SELECCIÓN DE PÁGINAS (MODO PDF A TEXTO) */}
                  {mode === 'pdf-to-text' && (
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-white" />
                          <span>
                            {isEs ? 'Páginas a Extraer a Texto' : 'Pages to Extract to Text'}
                          </span>
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
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'all'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Todas' : 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('range')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'range'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Rango' : 'Range'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('odd')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'odd'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Impares' : 'Odd'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('even')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'even'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
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
                              className="flex-1 bg-zinc-900 border border-white/20 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
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

                  {/* OPCIONES DE FORMATO Y EXTRACCIÓN DE TEXTO */}
                  {mode === 'pdf-to-text' ? (
                    <div className="space-y-3 font-mono text-xs">
                      {/* ESTRUCTURA Y CODIFICACIÓN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-cyan-400" />
                            {isEs ? 'Estructura de Saltos' : 'Line Layout'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreserveLayout(true)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                preserveLayout
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Preservar Líneas' : 'Preserve Lines'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreserveLayout(false)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                !preserveLayout
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Flujo Continuo' : 'Continuous Flow'}
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Type className="w-4 h-4 text-cyan-400" />
                            {isEs ? 'Codificación de Caracteres' : 'Encoding'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEncoding('utf-8')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                encoding === 'utf-8'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              UTF-8 (Universal)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEncoding('ascii')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                encoding === 'ascii'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              ASCII / Plain
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CHECKBOXES DE AJUSTES */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={addPageSeparators}
                            onChange={(e) => setAddPageSeparators(e.target.checked)}
                            className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Insertar marcadores de página (--- PÁGINA X ---)'
                              : 'Insert page separator markers (--- PAGE X ---)'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeDocHeader}
                            onChange={(e) => setIncludeDocHeader(e.target.checked)}
                            className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incluir encabezado con título del archivo y fecha'
                              : 'Include header with file title and date'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={removeExtraSpaces}
                            onChange={(e) => setRemoveExtraSpaces(e.target.checked)}
                            className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Colapsar espacios en blanco y tabulaciones múltiples'
                              : 'Collapse extra whitespace and tabs'}
                          </span>
                        </label>
                      </div>

                      {/* INFO BOX COMPATIBILIDAD */}
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3.5 text-xs text-cyan-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          {isEs
                            ? 'Texto Plano UTF-8 Limpio y Libre de Bloqueos'
                            : 'Clean UTF-8 Plain Text Free of Locks'}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {isEs
                            ? 'El archivo .txt resultante puede abrirse en cualquier bloc de notas, editor de código o importarse a scripts de análisis de datos.'
                            : 'Resulting .txt opens anywhere, code editors, or data analysis scripts.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* OPCIONES MODO TEXTO A PDF */
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Type className="w-4 h-4 text-cyan-400" />
                            {isEs ? 'Tipografía' : 'Font Family'}
                          </label>
                          <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                          >
                            <option value="helvetica">Helvetica (Sans-serif limpia)</option>
                            <option value="courier">Courier (Monoespaciada / Código)</option>
                            <option value="times">Times Roman (Serifa formal)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-cyan-400" />
                            {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value as PageSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                          >
                            <option value="a4">A4 (Estándar)</option>
                            <option value="letter">Carta / Letter</option>
                            <option value="legal">Oficio / Legal</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2 space-y-2.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={addPageNumbers}
                              onChange={(e) => setAddPageNumbers(e.target.checked)}
                              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Incluir número de página en el pie de página'
                                : 'Include page numbers on footer'}
                            </span>
                          </label>
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
                          className="h-full bg-cyan-400 transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executeConversion}
                    disabled={
                      isProcessing ||
                      (mode === 'pdf-to-text' && (!file || targetPages.length === 0)) ||
                      (mode === 'text-to-pdf' && !file && !manualText.trim())
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
                        : mode === 'text-to-pdf'
                          ? isEs
                            ? 'Convertir Texto a PDF →'
                            : 'Convert Text to PDF →'
                          : !file
                            ? isEs
                              ? 'Selecciona un archivo PDF'
                              : 'Select a PDF file'
                            : targetPages.length === 0
                              ? isEs
                                ? 'Selecciona al menos 1 página'
                                : 'Select at least 1 page'
                              : isEs
                                ? `Extraer ${targetPages.length} Página${targetPages.length === 1 ? '' : 's'} a Texto (.txt) →`
                                : `Extract ${targetPages.length} Page${targetPages.length === 1 ? '' : 's'} to Text (.txt) →`}
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
