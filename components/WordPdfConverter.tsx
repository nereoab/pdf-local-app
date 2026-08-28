'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import JSZip from 'jszip';
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
  Compass,
  Type,
  AlignLeft,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Cpu,
  HelpCircle,
  Plus,
  FileText,
  Check,
  ListChecks,
  Table as TableIcon,
  FileSpreadsheet,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { WordIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import { useUIStore } from '@/store/useUIStore';
import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx';

type ConversionDirection = 'word-to-pdf' | 'pdf-to-word';
type PageSize = 'a4' | 'letter' | 'legal';
type PageOrientation = 'portrait' | 'landscape';
type MarginSize = 'normal' | 'narrow' | 'moderate' | 'wide' | 'none';
type PageSelectionMode = 'all' | 'range' | 'custom' | 'even' | 'odd';
type PdfFontFamily = 'helvetica' | 'times' | 'courier';

interface WordPdfConverterProps {
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

interface ParsedWordDoc {
  title: string;
  paragraphs: string[];
  headings: string[];
  tables: string[][][];
  wordCount: number;
  charCount: number;
  estPages: number;
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

function sanitizeDocxText(text: string): string {
  if (!text) return '';
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uD800-\uDFFF\uFFFE\uFFFF]/g, '').trim();
}

export default function WordPdfConverter({ defaultMode = 'word-to-pdf' }: WordPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const cancelRenderRef = useRef<boolean>(false);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);
  const [file, setFile] = useState<File | null>(() => {
    if (!globalFile) return null;
    const name = globalFile.name.toLowerCase();
    if (defaultMode === 'word-to-pdf' && (name.endsWith('.docx') || name.endsWith('.doc')))
      return globalFile;
    if (defaultMode === 'pdf-to-word' && name.endsWith('.pdf')) return globalFile;
    return null;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // SELECCIÓN DE PÁGINAS (PDF -> WORD)
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // OPCIONES AVANZADAS PDF -> WORD
  const [docFormat, setDocFormat] = useState<'docx' | 'rtf'>('docx');
  const [layoutMode, setLayoutMode] = useState<'flowing' | 'exact'>('flowing');
  const [fontSizePt, setFontSizePt] = useState<number>(11);
  const [primaryFont, setPrimaryFont] = useState<string>('Calibri');
  const [addPageBreaks, setAddPageBreaks] = useState<boolean>(true);
  const [includeDocHeader, setIncludeDocHeader] = useState<boolean>(true);

  // OPCIONES AVANZADAS WORD -> PDF (MEJORADAS)
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [margin, setMargin] = useState<MarginSize>('normal');
  const [pdfFontFamily, setPdfFontFamily] = useState<PdfFontFamily>('helvetica');
  const [pdfFontSize, setPdfFontSize] = useState<number>(11);
  const [pdfLineSpacing, setPdfLineSpacing] = useState<number>(1.35);
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);
  const [includeWordDocHeader, setIncludeWordDocHeader] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('');

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [parsedWordDoc, setParsedWordDoc] = useState<ParsedWordDoc | null>(null);

  const pdfUrl = useMemo(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // CÁLCULO DE PÁGINAS SELECCIONADAS A CONVERTIR
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

  // PARSEADOR COMPLETO DE ARCHIVO DOCX
  const parseDocxDetails = async (wordFile: File): Promise<ParsedWordDoc> => {
    const defaultDoc: ParsedWordDoc = {
      title: wordFile.name.replace(/\.[^/.]+$/, ''),
      paragraphs: [],
      headings: [],
      tables: [],
      wordCount: 0,
      charCount: 0,
      estPages: 1,
    };

    try {
      const zip = await JSZip.loadAsync(wordFile);
      const documentXml = await zip.file('word/document.xml')?.async('text');

      if (documentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'text/xml');

        const paragraphs: string[] = [];
        const headings: string[] = [];
        let totalWords = 0;
        let totalChars = 0;

        const pNodes = Array.from(xmlDoc.getElementsByTagName('w:p'));
        pNodes.forEach((p) => {
          const text = Array.from(p.getElementsByTagName('w:t'))
            .map((t) => t.textContent || '')
            .join('');

          const clean = text.trim();
          if (clean) {
            paragraphs.push(clean);
            const words = clean.split(/\s+/).filter(Boolean).length;
            totalWords += words;
            totalChars += clean.length;

            const isHeadingStyle = p
              .getElementsByTagName('w:pStyle')[0]
              ?.getAttribute('w:val')
              ?.toLowerCase()
              .includes('heading');
            const hasBold = p.getElementsByTagName('w:b').length > 0;
            if ((isHeadingStyle || hasBold) && clean.length < 80) {
              headings.push(clean);
            }
          }
        });

        // Extraer tablas si existen
        const tables: string[][][] = [];
        const tblNodes = Array.from(xmlDoc.getElementsByTagName('w:tbl'));
        tblNodes.forEach((tbl) => {
          const rowData: string[][] = [];
          const trNodes = Array.from(tbl.getElementsByTagName('w:tr'));
          trNodes.forEach((tr) => {
            const cellData: string[] = [];
            const tcNodes = Array.from(tr.getElementsByTagName('w:tc'));
            tcNodes.forEach((tc) => {
              const text = Array.from(tc.getElementsByTagName('w:t'))
                .map((t) => t.textContent || '')
                .join(' ')
                .trim();
              cellData.push(text || '-');
            });
            if (cellData.length > 0) rowData.push(cellData);
          });
          if (rowData.length > 0) tables.push(rowData);
        });

        const estPages = Math.max(1, Math.ceil(totalWords / 350));

        return {
          title: wordFile.name.replace(/\.[^/.]+$/, ''),
          paragraphs: paragraphs.length > 0 ? paragraphs : ['Documento sin texto legible.'],
          headings,
          tables,
          wordCount: totalWords,
          charCount: totalChars,
          estPages,
        };
      }
      return defaultDoc;
    } catch {
      return defaultDoc;
    }
  };

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setParsedWordDoc(null);
      setSelectedPageSet(new Set());
      return;
    }

    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) {
      cargarMiniaturasPdfUltraFast(file);
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      prepararWordDocCompleto(file);
    }
  }, [file]);

  const prepararWordDocCompleto = async (wordFile: File) => {
    setIsRendering(true);
    setPageDataUrls({});
    try {
      const doc = await parseDocxDetails(wordFile);
      setParsedWordDoc(doc);
      setTotalPages(doc.estPages);
      setSelectedPageSet(new Set(Array.from({ length: doc.estPages }, (_, i) => i + 1)));
      setPageRangeInput(`1-${doc.estPages}`);

      // Generar miniaturas canvas nítidas para las páginas del Word
      const urls: Record<number, string> = {};
      for (let p = 1; p <= doc.estPages; p++) {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 226;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fondo de papel
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 160, 226);

          // Barra superior decorativa Word
          ctx.fillStyle = '#2b579a';
          ctx.fillRect(0, 0, 160, 14);

          // Título de la página
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 9px sans-serif';
          const titleSnippet = (p === 1 ? doc.title : `${doc.title} (Pág. ${p})`).substring(0, 22);
          ctx.fillText(titleSnippet, 10, 32);

          // Líneas simuladas de texto
          ctx.fillStyle = '#9ca3af';
          let y = 44;
          const startIdx = (p - 1) * 6;
          for (let l = 0; l < 8; l++) {
            const lineText = doc.paragraphs[startIdx + l] || '';
            const width = lineText
              ? Math.min(135, Math.max(60, lineText.length * 2.5))
              : 120 - (l % 3) * 20;
            ctx.fillRect(10, y, width, 5);
            y += 12;
          }

          // Número de página
          ctx.fillStyle = '#6b7280';
          ctx.font = '8px monospace';
          ctx.fillText(`Pág. ${p}`, 65, 215);

          urls[p] = canvas.toDataURL('image/jpeg', 0.85);
        }
      }
      setPageDataUrls(urls);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRendering(false);
    }
  };

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

      // Lote inicial rápido (8 páginas a escala liviana 0.22)
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
      console.error('Error miniaturas PDF:', err);
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
    const isWord = name.endsWith('.docx') || name.endsWith('.doc');

    if (mode === 'word-to-pdf') {
      if (isWord) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Documento Word (.docx) cargado' : 'Word document (.docx) loaded');
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona un archivo de Microsoft Word (.docx o .doc)'
            : 'Please select a Microsoft Word file (.docx or .doc)',
        );
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
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
    setParsedWordDoc(null);
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const handleRemoveFile = () => {
    cancelRenderRef.current = true;
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setParsedWordDoc(null);
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

  const getDimensions = (): [number, number] => {
    let width = 595.28;
    let height = 841.89;

    if (pageSize === 'letter') {
      width = 612;
      height = 792;
    } else if (pageSize === 'legal') {
      width = 612;
      height = 1008;
    }

    if (orientation === 'landscape') {
      return [height, width];
    }
    return [width, height];
  };

  const getMarginOffset = (): number => {
    if (margin === 'narrow') return 28;
    if (margin === 'moderate') return 42;
    if (margin === 'wide') return 70;
    if (margin === 'none') return 15;
    return 50; // Normal
  };

  const executeConversion = async () => {
    if (!file) return;
    if (targetPages.length === 0) {
      toast.error(
        isEs
          ? 'Por favor selecciona al menos una página para convertir.'
          : 'Please select at least one page to convert.',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    let localUrl: string | null = null;
    let resultBlob: Blob | null = null;

    try {
      if (mode === 'word-to-pdf') {
        // MODO WORD A PDF: MOTOR VECTORIAL DE ALTA FIDELIDAD CON PDF-LIB
        setProgressMsg(
          isEs
            ? 'Compilando tipografía y maquetación de Microsoft Word a PDF...'
            : 'Compiling typography & Microsoft Word layout to PDF...',
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(30);

        const pdfDoc = await PDFDocument.create();

        let selectedFont = StandardFonts.Helvetica;
        let selectedBoldFont = StandardFonts.HelveticaBold;
        if (pdfFontFamily === 'times') {
          selectedFont = StandardFonts.TimesRoman;
          selectedBoldFont = StandardFonts.TimesRomanBold;
        } else if (pdfFontFamily === 'courier') {
          selectedFont = StandardFonts.Courier;
          selectedBoldFont = StandardFonts.CourierBold;
        }

        const font = await pdfDoc.embedFont(selectedFont);
        const boldFont = await pdfDoc.embedFont(selectedBoldFont);

        const [dimW, dimH] = getDimensions();
        const sideMargin = getMarginOffset();
        const usableWidth = dimW - sideMargin * 2;

        let page = pdfDoc.addPage([dimW, dimH]);
        const title = file.name.replace(/\.[^/.]+$/, '');

        // Encabezado decorativo de documento si está activo
        if (includeWordDocHeader) {
          page.drawText(title, {
            x: sideMargin,
            y: dimH - 45,
            size: pdfFontSize + 5,
            font: boldFont,
            color: rgb(0.08, 0.12, 0.2),
          });
          page.drawText(
            isEs
              ? 'Documento compilado con PDFBlack Suite'
              : 'Document compiled with PDFBlack Suite',
            {
              x: sideMargin,
              y: dimH - 62,
              size: 9,
              font,
              color: rgb(0.45, 0.5, 0.55),
            },
          );
          page.drawLine({
            start: { x: sideMargin, y: dimH - 72 },
            end: { x: dimW - sideMargin, y: dimH - 72 },
            thickness: 0.8,
            color: rgb(0.85, 0.88, 0.92),
          });
        }

        let currentY = includeWordDocHeader ? dimH - 95 : dimH - sideMargin;
        const lineHeight = pdfFontSize * pdfLineSpacing;
        const maxCharsPerLine = Math.floor(usableWidth / (pdfFontSize * 0.52));

        const paragraphsToDraw =
          parsedWordDoc && parsedWordDoc.paragraphs.length > 0
            ? parsedWordDoc.paragraphs
            : [
                isEs
                  ? 'Documento de texto procesado desde Microsoft Word.'
                  : 'Text document processed from Microsoft Word.',
              ];

        const drawWatermarkOnPage = (targetP: typeof page) => {
          if (!watermarkText?.trim()) return;
          targetP.drawText(watermarkText.toUpperCase(), {
            x: dimW / 2 - watermarkText.length * 12,
            y: dimH / 2,
            size: 44,
            font: boldFont,
            color: rgb(0.85, 0.1, 0.1),
            opacity: 0.12,
            rotate: degrees(35),
          });
        };

        drawWatermarkOnPage(page);

        for (let pIdx = 0; pIdx < paragraphsToDraw.length; pIdx++) {
          const pText = paragraphsToDraw[pIdx];
          const isHeading =
            parsedWordDoc?.headings.includes(pText) ||
            (pText.length < 60 && pText.toUpperCase() === pText);

          let remaining = pText;
          while (remaining.length > 0) {
            if (currentY < sideMargin + 30) {
              page = pdfDoc.addPage([dimW, dimH]);
              currentY = dimH - sideMargin;
              drawWatermarkOnPage(page);
            }

            const chunk = remaining.substring(0, maxCharsPerLine);
            remaining = remaining.substring(maxCharsPerLine);

            page.drawText(chunk, {
              x: sideMargin,
              y: currentY,
              size: isHeading ? pdfFontSize + 2 : pdfFontSize,
              font: isHeading ? boldFont : font,
              color: isHeading ? rgb(0.1, 0.2, 0.4) : rgb(0.15, 0.15, 0.15),
            });

            currentY -= lineHeight;
          }
          currentY -= 6; // Espacio entre párrafos
        }

        if (addPageNumbers) {
          const pages = pdfDoc.getPages();
          pages.forEach((p, idx) => {
            p.drawText(`Página ${idx + 1} de ${pages.length}`, {
              x: dimW / 2 - 35,
              y: 20,
              size: 9,
              font,
              color: rgb(0.5, 0.5, 0.5),
            });
          });
        }

        setProgressPercent(85);
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
            itemCount: pdfDoc.getPageCount(),
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs
            ? '¡Documento Word convertido a PDF vectorial con éxito!'
            : 'Word document converted to vector PDF successfully!',
        );
      } else {
        // MODO PDF A WORD (PDF -> DOCX) MEDIANTE MOTOR OFICIAL DOCX
        const totalToConvert = targetPages.length;
        setProgressMsg(
          isEs
            ? `Extrayendo texto y tablas de ${totalToConvert} páginas...`
            : `Extracting text & tables from ${totalToConvert} pages...`,
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
        const extractedPagesData: Array<{ pageNum: number; lines: string[] }> = [];

        for (let idx = 0; idx < totalToConvert; idx++) {
          const pageNum = targetPages[idx];
          setProgressMsg(
            isEs
              ? `Procesando página ${idx + 1} de ${totalToConvert} (Pág. ${pageNum})...`
              : `Processing page ${idx + 1} of ${totalToConvert} (Page ${pageNum})...`,
          );
          setProgressPercent(15 + Math.round(((idx + 1) / totalToConvert) * 65));

          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();

          const items = textContent.items as Array<{ str?: string; transform?: number[] }>;
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
          const pageLines: string[] = [];

          sortedY.forEach((y) => {
            const line = lineMap.get(y)!.join(' ').trim();
            if (line) pageLines.push(line);
          });

          extractedPagesData.push({
            pageNum,
            lines: pageLines,
          });

          await new Promise((r) => setTimeout(r, 10));
        }

        setProgressMsg(
          isEs
            ? 'Construyendo documento Microsoft OpenXML (.docx)...'
            : 'Building Microsoft OpenXML (.docx) document...',
        );
        setProgressPercent(85);

        const halfFontSize = fontSizePt * 2;
        const docChildren: Paragraph[] = [];

        if (includeDocHeader) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: sanitizeDocxText(docTitle),
                  bold: true,
                  size: halfFontSize + 8,
                  font: primaryFont,
                  color: '1a365d',
                }),
              ],
              spacing: { after: 200 },
            }),
          );
        }

        extractedPagesData.forEach((pageData, pIdx) => {
          if (pIdx > 0 && addPageBreaks) {
            docChildren.push(
              new Paragraph({
                children: [new PageBreak()],
              }),
            );
          }

          if (totalToConvert > 1) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: isEs
                      ? `--- Página ${pageData.pageNum} ---`
                      : `--- Page ${pageData.pageNum} ---`,
                    italics: true,
                    size: Math.max(16, halfFontSize - 4),
                    font: primaryFont,
                    color: '777777',
                  }),
                ],
                spacing: { before: 160, after: 80 },
              }),
            );
          }

          if (layoutMode === 'flowing') {
            let currentParagraph = '';
            pageData.lines.forEach((line) => {
              const cleanLine = sanitizeDocxText(line);
              if (!cleanLine) return;
              if (
                currentParagraph &&
                (cleanLine.length < 40 || cleanLine.endsWith('.') || cleanLine.endsWith(':'))
              ) {
                currentParagraph += ' ' + cleanLine;
                docChildren.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: currentParagraph.trim(),
                        size: halfFontSize,
                        font: primaryFont,
                        color: '222222',
                      }),
                    ],
                    spacing: { after: 120, line: 260 },
                  }),
                );
                currentParagraph = '';
              } else if (currentParagraph) {
                currentParagraph += ' ' + cleanLine;
              } else {
                currentParagraph = cleanLine;
              }
            });

            if (currentParagraph) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: currentParagraph.trim(),
                      size: halfFontSize,
                      font: primaryFont,
                      color: '222222',
                    }),
                  ],
                  spacing: { after: 120, line: 260 },
                }),
              );
            }
          } else {
            pageData.lines.forEach((line) => {
              const cleanLine = sanitizeDocxText(line);
              if (!cleanLine) return;
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cleanLine,
                      size: halfFontSize,
                      font: primaryFont,
                      color: '222222',
                    }),
                  ],
                  spacing: { after: 80, line: 240 },
                }),
              );
            });
          }
        });

        if (docChildren.length === 0) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: isEs ? 'Documento procesado desde PDF' : 'Document processed from PDF',
                  size: halfFontSize,
                  font: primaryFont,
                }),
              ],
            }),
          );
        }

        const doc = new Document({
          creator: 'PDFBlack Suite',
          title: sanitizeDocxText(docTitle),
          description: 'Convertido con PDFBlack',
          sections: [
            {
              properties: {
                page: {
                  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                },
              },
              children: docChildren,
            },
          ],
        });

        resultBlob = await Packer.toBlob(doc);
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${docTitle}_Word.docx`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'docx',
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
            ? `¡${totalToConvert} páginas exportadas a Word (.docx) con éxito!`
            : `Successfully exported ${totalToConvert} pages to Word (.docx)!`,
        );
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error en la conversión de documento.' : 'Document conversion error.');
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
        accept={
          mode === 'word-to-pdf'
            ? '.docx, .doc, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword'
            : '.pdf, application/pdf'
        }
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
                ? '001 / CONVERSIÓN DE DOCUMENTOS WORD Y PDF (CONVERSOR DUAL 2 EN 1)'
                : '001 / WORD & PDF DOCUMENT CONVERSION (2-IN-1 DUAL CONVERTER)'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <WordIcon className="w-6 h-6 rounded-sm flex-shrink-0" />
              {mode === 'word-to-pdf'
                ? isEs
                  ? 'CONVERTIR WORD A PDF'
                  : 'CONVERT WORD TO PDF'
                : isEs
                  ? 'CONVERTIR PDF A WORD EDITABLE (CONVERSOR DUAL 2 EN 1)'
                  : 'CONVERT PDF TO EDITABLE WORD (2-IN-1 DUAL CONVERTER)'}
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
                  <WordIcon className="w-7 h-7 rounded-sm drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Conversión de documento completada con éxito!'
                      : 'Document conversion completed successfully!'}
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
            currentToolId="word-pdf"
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
                onClick={() => handleSwitchMode('word-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'word-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <WordIcon className="w-4 h-4 rounded-sm" />
                <span>{isEs ? 'Word a PDF (.docx → .pdf)' : 'Word to PDF (.docx → .pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('pdf-to-word')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-word'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a Word (.pdf → .docx)' : 'PDF to Word (.pdf → .docx)'}</span>
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
                {mode === 'word-to-pdf'
                  ? isEs
                    ? 'CONVERTIR DOCUMENTO WORD A PDF'
                    : 'CONVERT WORD DOCUMENT TO PDF'
                  : isEs
                    ? 'CONVERTIR PDF A WORD EDITABLE (CONVERSOR DUAL 2 EN 1)'
                    : 'CONVERT PDF TO EDITABLE WORD (2-IN-1 DUAL CONVERTER)'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'word-to-pdf'
                  ? isEs
                    ? 'Transforma documentos de Microsoft Word (.docx/.doc) en PDFs vectoriales con opciones de maquetación y tipografía.'
                    : 'Transform Microsoft Word documents (.docx/.doc) into vector PDFs with typography options.'
                  : isEs
                    ? 'Extrae texto, tablas y maquetación a formato Word (.docx) con selector de páginas y 100% privado.'
                    : 'Extract text, tables, and layout into editable Word (.docx) with page selector 100% privately.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'word-to-pdf'
                    ? isEs
                      ? 'Seleccionar Documento Word'
                      : 'Select Word Document'
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
                      {isEs ? '001 / VISOR Y SELECCIÓN VISUAL' : '001 / VIEWER & VISUAL SELECTION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages}{' '}
                    {mode === 'word-to-pdf'
                      ? isEs
                        ? 'páginas'
                        : 'pages'
                      : isEs
                        ? 'págs a Word'
                        : 'pgs to Word'}
                  </div>
                </div>

                {/* CONTENEDOR SPLIT: IZQUIERDA MINIATURAS - DERECHA VISOR */}
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
                                    ? 'Quitar de la extracción Word'
                                    : 'Exclude from Word'
                                  : isEs
                                    ? 'Incluir en la extracción Word'
                                    : 'Include in Word'
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
                        <WordIcon className="w-5 h-5" />
                        <span>{isEs ? 'Modo Word' : 'Word Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF O VISTA DOCUMENTAL WORD */}
                  <div className="flex-1 bg-zinc-950 p-3 relative flex flex-col items-center justify-center overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        src={`${pdfUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-none bg-white rounded-lg shadow-2xl"
                        title="Visor PDF Tamaño Normal"
                      />
                    ) : parsedWordDoc ? (
                      /* HOJA DE PREVISUALIZACIÓN DE DOCUMENTO MICROSOFT WORD REAL */
                      <div className="w-full h-full flex flex-col overflow-hidden">
                        {/* BARRA DE ESTADO DEL DOCUMENTO */}
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-white/10 rounded-t-xl text-[11px] font-mono text-zinc-400">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-white font-bold truncate max-w-[200px]">
                              {parsedWordDoc.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span>
                              📊 {parsedWordDoc.wordCount} {isEs ? 'palabras' : 'words'}
                            </span>
                            <span>
                              📝 {parsedWordDoc.paragraphs.length}{' '}
                              {isEs ? 'párrafos' : 'paragraphs'}
                            </span>
                            <span className="text-blue-400 font-bold">
                              📄 {parsedWordDoc.estPages} {isEs ? 'págs estimadas' : 'est. pages'}
                            </span>
                          </div>
                        </div>

                        {/* HOJA DE DOCUMENTO WORD CON ESTILO VISUAL REAL */}
                        <div className="flex-1 overflow-y-auto bg-zinc-900/60 p-4 border-x border-b border-white/10 rounded-b-xl custom-scrollbar flex justify-center">
                          <div className="w-full max-w-2xl bg-white text-zinc-900 rounded-lg shadow-2xl p-8 sm:p-10 font-sans space-y-4 min-h-[500px]">
                            {/* ENCABEZADO DE PÁGINA WORD */}
                            <div className="border-b border-zinc-200 pb-4 mb-4">
                              <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                                {parsedWordDoc.title}
                              </h1>
                              <p className="text-xs text-zinc-500 font-mono mt-1">
                                {isEs
                                  ? 'Documento Microsoft Word (.docx) estructurado'
                                  : 'Structured Microsoft Word (.docx) document'}
                              </p>
                            </div>

                            {/* CONTENIDO DE PÁRRAFOS */}
                            <div className="space-y-3 text-sm leading-relaxed text-zinc-800">
                              {parsedWordDoc.paragraphs.slice(0, 25).map((para, pIdx) => {
                                const isHead = parsedWordDoc.headings.includes(para);
                                if (isHead) {
                                  return (
                                    <h3
                                      key={pIdx}
                                      className="text-base font-bold text-blue-900 mt-4 pt-2 border-t border-zinc-100"
                                    >
                                      {para}
                                    </h3>
                                  );
                                }
                                return (
                                  <p key={pIdx} className="text-xs sm:text-sm text-zinc-700">
                                    {para}
                                  </p>
                                );
                              })}
                              {parsedWordDoc.paragraphs.length > 25 && (
                                <div className="text-center py-3 text-xs text-zinc-500 font-mono italic bg-zinc-50 rounded-lg border border-zinc-200">
                                  {isEs
                                    ? `... y ${parsedWordDoc.paragraphs.length - 25} párrafos más (se convertirán al 100% en el PDF) ...`
                                    : `... and ${parsedWordDoc.paragraphs.length - 25} more paragraphs (will convert to 100% in PDF) ...`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center p-6 h-full">
                        <WordIcon className="w-20 h-20 rounded-2xl shadow-2xl" />
                        <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                          {isEs ? 'Cargando documento Word...' : 'Loading Word document...'}
                        </span>
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

                  {/* SECCIÓN DE SELECCIÓN DE PÁGINAS */}
                  <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-white" />
                        <span>
                          {mode === 'word-to-pdf'
                            ? isEs
                              ? 'Páginas a Convertir a PDF'
                              : 'Pages to Convert to PDF'
                            : isEs
                              ? 'Páginas a Convertir a Word'
                              : 'Pages to Convert to Word'}
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
                            className="flex-1 bg-zinc-900 border border-white/20 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
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

                  {/* OPCIONES SEGÚN EL MODO */}
                  {mode === 'word-to-pdf' ? (
                    /* OPCIONES MEJORADAS MODO WORD A PDF */
                    <div className="space-y-3 font-mono text-xs">
                      {/* FORMATO DE PÁGINA Y ORIENTACIÓN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Tamaño de Página' : 'Page Size'}
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value as PageSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                          >
                            <option value="a4">A4 (Estándar Internacional)</option>
                            <option value="letter">Carta / Letter (América)</option>
                            <option value="legal">Oficio / Legal</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Orientación' : 'Orientation'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setOrientation('portrait')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'portrait'
                                  ? 'bg-white text-black border-white shadow-md'
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
                                  ? 'bg-white text-black border-white shadow-md'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Apaisado' : 'Landscape'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* TIPOGRAFÍA Y MÁRGENES */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Type className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Tipografía PDF' : 'PDF Font'}
                          </label>
                          <select
                            value={pdfFontFamily}
                            onChange={(e) => setPdfFontFamily(e.target.value as PdfFontFamily)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                          >
                            <option value="helvetica">Helvetica (Sans-serif moderna)</option>
                            <option value="times">Times Roman (Clásica / Formal)</option>
                            <option value="courier">Courier (Monoespaciada / Código)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Márgenes de Página' : 'Page Margins'}
                          </label>
                          <select
                            value={margin}
                            onChange={(e) => setMargin(e.target.value as MarginSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                          >
                            <option value="normal">
                              {isEs ? 'Normal (2.5 cm)' : 'Normal (2.5 cm)'}
                            </option>
                            <option value="narrow">
                              {isEs ? 'Estrecho (1.27 cm)' : 'Narrow (1.27 cm)'}
                            </option>
                            <option value="moderate">
                              {isEs ? 'Moderado (1.9 cm)' : 'Moderate (1.9 cm)'}
                            </option>
                            <option value="wide">
                              {isEs ? 'Amplio (3.8 cm)' : 'Wide (3.8 cm)'}
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* TAMAÑO DE FUENTE E INTERLINEADO */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Tamaño de Fuente' : 'Font Size'}
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[9, 10, 11, 12].map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setPdfFontSize(sz)}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  pdfFontSize === sz
                                    ? 'bg-white text-black border-white shadow-md'
                                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                                }`}
                              >
                                {sz} pt
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Interlineado' : 'Line Spacing'}
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: '1.15x', val: 1.15 },
                              { label: '1.35x', val: 1.35 },
                              { label: '1.75x', val: 1.75 },
                            ].map((item) => (
                              <button
                                key={item.val}
                                type="button"
                                onClick={() => setPdfLineSpacing(item.val)}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  pdfLineSpacing === item.val
                                    ? 'bg-white text-black border-white shadow-md'
                                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ENCABEZADOS, NUMERACIÓN Y MARCA DE AGUA */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeWordDocHeader}
                            onChange={(e) => setIncludeWordDocHeader(e.target.checked)}
                            className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incluir barra superior con título del archivo y fecha'
                              : 'Include top header with file title and date'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={addPageNumbers}
                            onChange={(e) => setAddPageNumbers(e.target.checked)}
                            className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incluir número de página centrado en el pie ("Página X de Y")'
                              : 'Include page number in footer ("Page X of Y")'}
                          </span>
                        </label>

                        <div className="pt-2 border-t border-white/5">
                          <label className="text-[11px] text-zinc-400 font-bold block mb-1.5">
                            {isEs
                              ? 'Marca de Agua Diagonal (Opcional):'
                              : 'Diagonal Watermark (Optional):'}
                          </label>
                          <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder={
                              isEs
                                ? 'Ej: CONFIDENCIAL, BORRADOR, COPIA'
                                : 'E.g: CONFIDENTIAL, DRAFT, COPY'
                            }
                            className="w-full bg-zinc-900 border border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none uppercase"
                          />
                        </div>
                      </div>

                      {/* INFO BOX COMPATIBILIDAD */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          {isEs
                            ? 'Compilación Vectorial Directa (100% en RAM)'
                            : 'Direct Vector Compilation (100% in RAM)'}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {isEs
                            ? 'El archivo PDF resultante contiene fuentes incrustadas de alta resolución y se puede imprimir o visualizar sin pérdida de calidad.'
                            : 'Resulting PDF contains high-res embedded fonts ready for printing.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* OPCIONES MODO PDF A WORD */
                    <div className="space-y-3 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Modo de Maquetación' : 'Layout Mode'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLayoutMode('flowing')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                layoutMode === 'flowing'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Texto Fluido' : 'Flowing Text'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setLayoutMode('exact')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                layoutMode === 'exact'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Estructura Fija' : 'Exact Lines'}
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Formato de Salida' : 'Output Format'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDocFormat('docx')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                docFormat === 'docx'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              DOCX (Office)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocFormat('rtf')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                docFormat === 'rtf'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              RTF (Universal)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Type className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Tipografía Base' : 'Base Typography'}
                          </label>
                          <select
                            value={primaryFont}
                            onChange={(e) => setPrimaryFont(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                          >
                            <option value="Calibri">Calibri (Estándar Office)</option>
                            <option value="Arial">Arial (Sans-serif limpia)</option>
                            <option value="Times New Roman">Times New Roman (Formal)</option>
                            <option value="Aptos">Aptos (Moderno 365)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-blue-400" />
                            {isEs ? 'Tamaño de Fuente' : 'Font Size'}
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[10, 11, 12].map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setFontSizePt(sz)}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  fontSizePt === sz
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                                }`}
                              >
                                {sz} pt
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={addPageBreaks}
                            onChange={(e) => setAddPageBreaks(e.target.checked)}
                            className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Insertar salto de página entre cada página del PDF'
                              : 'Insert page breaks between PDF pages'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeDocHeader}
                            onChange={(e) => setIncludeDocHeader(e.target.checked)}
                            className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incluir título del archivo en el encabezado de la primera página'
                              : 'Include file title header on first page'}
                          </span>
                        </label>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          {isEs
                            ? 'Exportación Nativa Microsoft OpenXML (.docx)'
                            : 'Native Microsoft OpenXML (.docx) Export'}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {isEs
                            ? 'El documento resultante es 100% compatible con Microsoft Word, Google Docs, Apple Pages y LibreOffice.'
                            : 'The resulting document is 100% compatible with Word, Google Docs, Apple Pages, and LibreOffice.'}
                        </p>
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
                          className="h-full bg-blue-400 transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executeConversion}
                    disabled={isProcessing || !file || targetPages.length === 0}
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
                          : mode === 'word-to-pdf'
                            ? isEs
                              ? targetPages.length === 0
                                ? 'Selecciona al menos 1 página'
                                : `Convertir Documento Word a PDF →`
                              : targetPages.length === 0
                                ? 'Select at least 1 page'
                                : `Convert Word Document to PDF →`
                            : isEs
                              ? targetPages.length === 0
                                ? 'Selecciona al menos 1 página'
                                : `Convertir ${targetPages.length} Página${targetPages.length === 1 ? '' : 's'} a Word (.docx) →`
                              : targetPages.length === 0
                                ? 'Select at least 1 page'
                                : `Convert ${targetPages.length} Page${targetPages.length === 1 ? '' : 's'} to Word (.docx) →`}
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
