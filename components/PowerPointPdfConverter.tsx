'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
  Grid,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Cpu,
  HelpCircle,
  Plus,
  FileText,
  Presentation,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  Filter,
  ListChecks,
  Trash2,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { PowerPointIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
import { useUIStore } from '@/store/useUIStore';
import PdfPageViewer from '@/components/PdfPageViewer';
import { convertWithApi } from '@/lib/adobe-api-client';

type ConversionDirection = 'powerpoint-to-pdf' | 'pdf-to-powerpoint';
type AspectRatio = '16:9' | '4:3';
type HandoutLayout = '1_per_page' | '2_per_page' | '4_per_page';
type FitMode = 'contain' | 'cover';
type RenderQuality = 'high' | 'ultra';
type SlideTheme = 'white' | 'dark';
type PageSelectionMode = 'all' | 'range' | 'custom' | 'even' | 'odd';

interface PowerPointPdfConverterProps {
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

interface SlideImageItem {
  dataUrl: string;
  format: 'png' | 'jpeg';
  bytes: Uint8Array;
}

interface PptxSlideData {
  slideNumber: number;
  title: string;
  paragraphs: string[];
  images?: SlideImageItem[];
}

interface ExtractedPdfTextBlock {
  text: string;
  isTitle?: boolean;
  xPct: number;
  yPct: number;
  wPct?: number;
  hPct?: number;
  fontSizePt: number;
  bold?: boolean;
}

function extractStructuredTextFromPdfPage(
  textContent: any,
  viewportWidth: number,
  viewportHeight: number,
): ExtractedPdfTextBlock[] {
  if (!textContent || !textContent.items || textContent.items.length === 0) return [];

  const items = [...textContent.items].filter((it: any) => it.str && it.str.trim().length > 0);
  if (items.length === 0) return [];

  const lines: { y: number; height: number; items: any[] }[] = [];
  for (const item of items) {
    const itemY = item.transform[5];
    const itemH = item.height || Math.abs(item.transform[3]) || 12;
    let foundLine = false;
    for (const line of lines) {
      if (Math.abs(line.y - itemY) < itemH * 0.6) {
        line.items.push(item);
        foundLine = true;
        break;
      }
    }
    if (!foundLine) {
      lines.push({ y: itemY, height: itemH, items: [item] });
    }
  }

  lines.sort((a, b) => b.y - a.y);

  const blocks: ExtractedPdfTextBlock[] = [];

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
    const lineText = line.items
      .map((it) => it.str)
      .join(' ')
      .trim();
    if (!lineText) continue;

    const firstItem = line.items[0];
    const fontSize = Math.abs(firstItem.transform[3]) || line.height || 12;
    const isTitle = fontSize >= 16 || lIdx === 0;
    const isBold = firstItem.fontName ? /bold|black|heavy/i.test(firstItem.fontName) : false;

    const xPct = Math.max(5, Math.min(90, (firstItem.transform[4] / viewportWidth) * 100));
    const yPct = Math.max(5, Math.min(90, ((viewportHeight - line.y) / viewportHeight) * 100));

    blocks.push({
      text: lineText,
      isTitle,
      xPct,
      yPct,
      fontSizePt: Math.min(28, Math.max(10, Math.round(fontSize))),
      bold: isBold,
    });
  }

  return blocks;
}

// ── EXTRACTOR DE TEXTO MEDIANTE OCR (TESSERACT) PARA DIAPOSITIVAS ESCANEADAS ──
async function extractOcrTextBlocksFromCanvas(
  canvas: HTMLCanvasElement,
  lang: string = 'spa+eng',
): Promise<ExtractedPdfTextBlock[]> {
  try {
    const { createWorker } = await import('tesseract.js');
    let worker: any;
    try {
      worker = await createWorker(lang, 1, { workerBlobURL: true });
    } catch {
      worker = await createWorker(lang, 1);
    }

    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const ret = await worker.recognize(dataUrl, {}, { text: true, hocr: true, tsv: true });
      const dataAny = ret.data as any;

      interface WordItem {
        text: string;
        left: number;
        top: number;
        right: number;
        bottom: number;
      }

      const words: WordItem[] = [];

      // 1. Estrategia HOCR
      if (typeof dataAny.hocr === 'string' && dataAny.hocr.length > 0) {
        const wordRegex =
          /class=['"](?:ocrx_word|ocr_word)['"][^>]*title=['"]bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)[^'"]*['"][^>]*>([\s\S]*?)<\/span>/gi;
        let match;
        while ((match = wordRegex.exec(dataAny.hocr)) !== null) {
          const left = parseInt(match[1], 10);
          const top = parseInt(match[2], 10);
          const right = parseInt(match[3], 10);
          const bottom = parseInt(match[4], 10);
          const text = match[5].replace(/<[^>]+>/g, '').trim();
          if (text && right > left && bottom > top) {
            words.push({ text, left, top, right, bottom });
          }
        }
      }

      // 2. Estrategia TSV si HOCR vino vacío
      if (words.length === 0 && typeof dataAny.tsv === 'string' && dataAny.tsv.trim().length > 0) {
        const rows = dataAny.tsv.split('\n');
        for (const row of rows) {
          const parts = row.split('\t');
          if (parts.length < 12) continue;
          const level = parts[0]?.trim();
          const left = parseFloat(parts[6]);
          const top = parseFloat(parts[7]);
          const width = parseFloat(parts[8]);
          const height = parseFloat(parts[9]);
          const wordText = parts[11]?.trim();
          if (level === '5' && wordText && !isNaN(left) && width > 0) {
            words.push({ text: wordText, left, top, right: left + width, bottom: top + height });
          }
        }
      }

      if (words.length === 0) {
        const raw = (ret.data.text || '').trim();
        if (raw) {
          return [
            {
              text: raw,
              xPct: 6,
              yPct: 15,
              wPct: 88,
              hPct: 70,
              fontSizePt: 14,
              isTitle: false,
              bold: false,
            },
          ];
        }
        return [];
      }

      // Agrupar palabras en renglones
      words.sort((a, b) => a.top - b.top || a.left - b.left);
      const lines: WordItem[][] = [];
      for (const w of words) {
        const lastLine = lines[lines.length - 1];
        if (lastLine && lastLine.length > 0) {
          const avgTop = lastLine.reduce((acc, curr) => acc + curr.top, 0) / lastLine.length;
          const avgHeight =
            lastLine.reduce((acc, curr) => acc + (curr.bottom - curr.top), 0) / lastLine.length;
          if (Math.abs(w.top - avgTop) < avgHeight * 0.7) {
            lastLine.push(w);
            continue;
          }
        }
        lines.push([w]);
      }

      const cW = canvas.width;
      const cH = canvas.height;
      const blocks: ExtractedPdfTextBlock[] = [];

      for (const lineWords of lines) {
        lineWords.sort((a, b) => a.left - b.left);
        const lineText = lineWords.map((item) => item.text).join(' ');
        const minLeft = Math.min(...lineWords.map((item) => item.left));
        const maxRight = Math.max(...lineWords.map((item) => item.right));
        const minTop = Math.min(...lineWords.map((item) => item.top));
        const maxBottom = Math.max(...lineWords.map((item) => item.bottom));

        const xPct = (minLeft / cW) * 100;
        const yPct = (minTop / cH) * 100;
        const wPct = ((maxRight - minLeft) / cW) * 100;
        const hPct = ((maxBottom - minTop) / cH) * 100;

        const pxHeight = maxBottom - minTop;
        const fontSizePt = Math.max(
          11,
          Math.min(36, Math.round((pxHeight / cH) * 7.5 * 72 * 0.75)),
        );
        const isTitle = fontSizePt >= 19 || (yPct < 25 && fontSizePt >= 16);

        blocks.push({
          text: lineText,
          xPct,
          yPct,
          wPct,
          hPct,
          fontSizePt,
          isTitle,
          bold: isTitle,
        });
      }

      return blocks;
    } finally {
      try {
        await worker.terminate();
      } catch {}
    }
  } catch (ocrErr) {
    console.warn('Error ejecutando OCR en diapositiva:', ocrErr);
    return [];
  }
}

interface FileSlot {
  id: number;
  file: File | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  totalPages: number;
  activePage: number;
  pageDataUrls: Record<number, string>;
  isRendering?: boolean;
  extractedSlideCount?: number;
  extractedSlides?: PptxSlideData[];
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

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function PowerPointPdfConverter({
  defaultMode = 'pdf-to-powerpoint',
}: PowerPointPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const cancelRenderRef = useRef<boolean>(false);
  const { globalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  // 3 CAJAS / RANURAS INDEPENDIENTES PARA PROCESAR HASTA 3 ARCHIVOS
  const [slots, setSlots] = useState<FileSlot[]>([
    {
      id: 0,
      file: null,
      previewUrl: null,
      thumbnailUrl: null,
      totalPages: 0,
      activePage: 1,
      pageDataUrls: {},
      extractedSlideCount: 0,
      extractedSlides: [],
    },
    {
      id: 1,
      file: null,
      previewUrl: null,
      thumbnailUrl: null,
      totalPages: 0,
      activePage: 1,
      pageDataUrls: {},
      extractedSlideCount: 0,
      extractedSlides: [],
    },
    {
      id: 2,
      file: null,
      previewUrl: null,
      thumbnailUrl: null,
      totalPages: 0,
      activePage: 1,
      pageDataUrls: {},
      extractedSlideCount: 0,
      extractedSlides: [],
    },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const slotInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // ARCHIVO Y METADATOS DE LA CAJA ACTIVA
  const activeSlot = slots[activeSlotIndex] || slots[0];
  const file = activeSlot?.file || null;
  const totalPages = activeSlot?.totalPages || 0;
  const activePage = activeSlot?.activePage || 1;
  const setActivePage = (p: number) => {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === activeSlotIndex ? { ...s, activePage: p } : s)),
    );
  };
  const pageDataUrls = activeSlot?.pageDataUrls || {};
  const isRendering = activeSlot?.isRendering || false;
  const extractedSlides = activeSlot?.extractedSlides || [];
  const extractedSlideCount = activeSlot?.extractedSlideCount || 0;
  const loadedSlots = useMemo(() => slots.filter((s) => s.file !== null), [slots]);

  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // SELECCIÓN DE PÁGINAS
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // MOTOR DE CONVERSIÓN
  const [conversionEngine, setConversionEngine] = useState<
    'adobe' | 'cloudconvert' | 'local' | 'ocr'
  >(() => (defaultMode === 'powerpoint-to-pdf' ? 'local' : 'adobe'));

  useEffect(() => {
    if (defaultMode === 'powerpoint-to-pdf') {
      setConversionEngine('local');
    }
  }, [defaultMode]);

  // MODO DE TEXTO PARA PDF A POWERPOINT (LOCAL)
  const [pptxTextMode, setPptxTextMode] = useState<'hybrid' | 'native' | 'raster'>('hybrid');

  // OPCIONES AVANZADAS PDF -> PPTX
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [renderQuality, setRenderQuality] = useState<RenderQuality>('high');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('white');
  const [addSlideNumbers, setAddSlideNumbers] = useState<boolean>(true);

  // OPCIONES AVANZADAS PPTX -> PDF
  const [handoutLayout, setHandoutLayout] = useState<HandoutLayout>('1_per_page');
  const [addSlideBorders, setAddSlideBorders] = useState<boolean>(true);

  // CÁLCULO DE PÁGINAS DESTINO PARA CONVERSIÓN
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

  // Sincronizar selección de páginas al cambiar de caja activa o totalPages
  useEffect(() => {
    if (totalPages > 0) {
      setSelectedPageSet(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
      setPageRangeInput(totalPages > 10 ? `1-${Math.min(10, totalPages)}` : `1-${totalPages}`);
    }
  }, [activeSlotIndex, totalPages]);

  const parsePptxContent = async (
    pptFile: File,
  ): Promise<{ count: number; slides: PptxSlideData[] }> => {
    try {
      const zip = await JSZip.loadAsync(pptFile);
      const slideKeys = Object.keys(zip.files)
        .filter((k) => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'))
        .sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, '') || '0', 10);
          const numB = parseInt(b.replace(/[^0-9]/g, '') || '0', 10);
          return numA - numB;
        });

      const parsed: PptxSlideData[] = [];

      for (let i = 0; i < slideKeys.length; i++) {
        const key = slideKeys[i];
        const text = await zip.files[key].async('text');
        const matches = Array.from(text.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g))
          .map((m) => m[1].trim())
          .filter(Boolean);
        const title = matches[0] || (isEs ? `Diapositiva ${i + 1}` : `Slide ${i + 1}`);
        const paragraphs = matches.slice(1);

        // Extraer imágenes asociadas a esta diapositiva
        const slideBasename = key.split('/').pop() || `slide${i + 1}.xml`;
        const relsKey = `ppt/slides/_rels/${slideBasename}.rels`;
        const slideImages: SlideImageItem[] = [];

        if (zip.files[relsKey]) {
          try {
            const relsText = await zip.files[relsKey].async('text');
            const targetMatches = Array.from(
              relsText.matchAll(/Target="(?:\.\.\/)?media\/([^"]+)"/g),
            );
            for (const tMatch of targetMatches) {
              const mediaFilename = tMatch[1];
              const mediaKey = `ppt/media/${mediaFilename}`;
              if (zip.files[mediaKey]) {
                const isPng = mediaFilename.toLowerCase().endsWith('.png');
                const isJpg =
                  mediaFilename.toLowerCase().endsWith('.jpg') ||
                  mediaFilename.toLowerCase().endsWith('.jpeg');
                if (isPng || isJpg) {
                  const format = isPng ? 'png' : 'jpeg';
                  const imgBytes = await zip.files[mediaKey].async('uint8array');
                  const base64 = await zip.files[mediaKey].async('base64');
                  slideImages.push({
                    dataUrl: `data:image/${format};base64,${base64}`,
                    format,
                    bytes: imgBytes,
                  });
                }
              }
            }
          } catch (relErr) {
            console.warn('Error al extraer relaciones de imagen:', relErr);
          }
        }

        parsed.push({
          slideNumber: i + 1,
          title,
          paragraphs,
          images: slideImages,
        });
      }

      return {
        count: parsed.length > 0 ? parsed.length : 1,
        slides: parsed,
      };
    } catch {
      return { count: 1, slides: [] };
    }
  };

  const loadPdfMetadataForSlot = async (slotIndex: number, pdfFile: File) => {
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

      let page1DataUrl: string | null = null;
      try {
        const page1 = await pdfDoc.getPage(1);
        const viewport = page1.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page1.render({ canvasContext: ctx, viewport } as unknown as Parameters<
            typeof page1.render
          >[0]).promise;
          page1DataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {}

      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIndex
            ? {
                ...s,
                totalPages: count,
                thumbnailUrl: page1DataUrl,
                previewUrl: page1DataUrl,
                activePage: 1,
                pageDataUrls: page1DataUrl ? { 1: page1DataUrl } : {},
                isRendering: false,
              }
            : s,
        ),
      );
    } catch (err) {
      console.error('Error al cargar metadatos de PDF:', err);
    }
  };

  const loadPptxMetadataForSlot = async (slotIndex: number, pptFile: File) => {
    try {
      const { count, slides } = await parsePptxContent(pptFile);
      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIndex
            ? {
                ...s,
                totalPages: count,
                extractedSlideCount: count,
                extractedSlides: slides,
                activePage: 1,
                isRendering: false,
              }
            : s,
        ),
      );
    } catch (err) {
      console.error('Error al cargar metadatos de PPTX:', err);
    }
  };

  const renderActivePdfPage = async (slotIndex: number, pageNum: number) => {
    const currentSlot = slots[slotIndex];
    if (!currentSlot?.file || !currentSlot.file.name.toLowerCase().endsWith('.pdf')) return;
    if (currentSlot.pageDataUrls[pageNum]) return;

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await currentSlot.file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.5 });
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setSlots((prev) =>
          prev.map((s, idx) =>
            idx === slotIndex
              ? { ...s, pageDataUrls: { ...s.pageDataUrls, [pageNum]: dataUrl } }
              : s,
          ),
        );
      }
    } catch (e) {
      console.error('Error al renderizar página:', e);
    }
  };

  useEffect(() => {
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      renderActivePdfPage(activeSlotIndex, activePage);
    }
  }, [activeSlotIndex, activePage, file]);

  // CARGA DE ARCHIVOS EN LAS CAJAS CON AISLAMIENTO ESTRICTO
  const loadFilesIntoSlots = (fileList: File[] | FileList, specificSlotIndex?: number) => {
    const validFiles: File[] = [];
    const filesArray = Array.from(fileList);

    for (const f of filesArray) {
      const name = f.name.toLowerCase();
      const isPdf = name.endsWith('.pdf');
      const isPpt = name.endsWith('.pptx') || name.endsWith('.ppt');

      if (mode === 'powerpoint-to-pdf' && isPpt) {
        validFiles.push(f);
      } else if (mode === 'pdf-to-powerpoint' && isPdf) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      toast.error(
        mode === 'powerpoint-to-pdf'
          ? isEs
            ? 'Por favor selecciona archivos PowerPoint (.pptx/.ppt)'
            : 'Please select PowerPoint files (.pptx/.ppt)'
          : isEs
            ? 'Por favor selecciona archivos PDF (.pdf)'
            : 'Please select PDF files (.pdf)',
      );
      return;
    }

    setSlots((prev) => {
      const next = [...prev];
      if (specificSlotIndex !== undefined && specificSlotIndex >= 0 && specificSlotIndex < 3) {
        const f = validFiles[0];
        const prevUrl = next[specificSlotIndex].previewUrl;
        if (prevUrl) URL.revokeObjectURL(prevUrl);

        next[specificSlotIndex] = {
          id: specificSlotIndex,
          file: f,
          previewUrl: null,
          thumbnailUrl: null,
          totalPages: 1,
          activePage: 1,
          pageDataUrls: {},
          extractedSlideCount: 0,
          extractedSlides: [],
          isRendering: true,
        };

        if (f.name.toLowerCase().endsWith('.pdf')) {
          loadPdfMetadataForSlot(specificSlotIndex, f);
        } else {
          loadPptxMetadataForSlot(specificSlotIndex, f);
        }
      } else {
        let validIdx = 0;
        for (let i = 0; i < 3; i++) {
          if (validIdx >= validFiles.length) break;
          if (!next[i].file) {
            const f = validFiles[validIdx];
            const prevUrl = next[i].previewUrl;
            if (prevUrl) URL.revokeObjectURL(prevUrl);

            next[i] = {
              id: i,
              file: f,
              previewUrl: null,
              thumbnailUrl: null,
              totalPages: 1,
              activePage: 1,
              pageDataUrls: {},
              extractedSlideCount: 0,
              extractedSlides: [],
              isRendering: true,
            };

            if (f.name.toLowerCase().endsWith('.pdf')) {
              loadPdfMetadataForSlot(i, f);
            } else {
              loadPptxMetadataForSlot(i, f);
            }
            validIdx++;
          }
        }
      }
      return next;
    });

    if (specificSlotIndex !== undefined) {
      setActiveSlotIndex(specificSlotIndex);
    } else {
      setActiveSlotIndex(0);
    }

    setDownloadUrl(null);
    setCompletedResult(null);

    toast.success(
      isEs
        ? `${validFiles.length} presentación(es) lista(s) en las cajas`
        : `${validFiles.length} presentation(s) ready in boxes`,
    );
  };

  const initialGlobalFileLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!globalFile || initialGlobalFileLoadedRef.current) return;
    const name = globalFile.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isPpt = name.endsWith('.pptx') || name.endsWith('.ppt');

    if (
      (defaultMode === 'pdf-to-powerpoint' && isPdf) ||
      (defaultMode === 'powerpoint-to-pdf' && isPpt)
    ) {
      initialGlobalFileLoadedRef.current = true;
      loadFilesIntoSlots([globalFile], 0);
    }
  }, [globalFile, defaultMode]);

  const handleClearSlot = (slotIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      if (next[slotIndex].previewUrl) {
        URL.revokeObjectURL(next[slotIndex].previewUrl);
      }
      next[slotIndex] = {
        id: slotIndex,
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        totalPages: 0,
        activePage: 1,
        pageDataUrls: {},
        extractedSlideCount: 0,
        extractedSlides: [],
      };
      return next;
    });

    if (activeSlotIndex === slotIndex) {
      const otherSlot = slots.find((s, idx) => idx !== slotIndex && s.file !== null);
      if (otherSlot) {
        setActiveSlotIndex(otherSlot.id);
      }
    }
  };

  const handleClearAllSlots = () => {
    slots.forEach((s) => {
      if (s.previewUrl) {
        URL.revokeObjectURL(s.previewUrl);
      }
    });
    setSlots([
      {
        id: 0,
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        totalPages: 0,
        activePage: 1,
        pageDataUrls: {},
        extractedSlideCount: 0,
        extractedSlides: [],
      },
      {
        id: 1,
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        totalPages: 0,
        activePage: 1,
        pageDataUrls: {},
        extractedSlideCount: 0,
        extractedSlides: [],
      },
      {
        id: 2,
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        totalPages: 0,
        activePage: 1,
        pageDataUrls: {},
        extractedSlideCount: 0,
        extractedSlides: [],
      },
    ]);
    setActiveSlotIndex(0);
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const handleSwitchMode = (newMode: ConversionDirection) => {
    cancelRenderRef.current = true;
    handleClearAllSlots();
    setMode(newMode);
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const handleRemoveFile = () => {
    handleClearAllSlots();
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

  const executeConversion = async (onlyActiveFile: boolean = false) => {
    const readySlots =
      onlyActiveFile && file
        ? slots.filter((s) => s.id === activeSlotIndex && s.file !== null)
        : slots.filter((s) => s.file !== null);

    if (readySlots.length === 0) return;
    if (mode === 'pdf-to-powerpoint' && targetPages.length === 0) {
      toast.error(
        isEs
          ? 'Por favor selecciona al menos una página para exportar.'
          : 'Please select at least one page to export.',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    let localUrl: string | null = null;
    let resultBlob: Blob | null = null;

    try {
      if (mode === 'powerpoint-to-pdf') {
        setProgressMsg(
          isEs
            ? `Procesando ${readySlots.length} presentación(es) a PDF...`
            : `Processing ${readySlots.length} presentation(s) to PDF...`,
        );

        if (readySlots.length === 1) {
          const currentFile = readySlots[0].file!;
          // 1. Ejecutar conversión de alta fidelidad (Motor Local Nativo de PowerPoint en servidor o Adobe/CloudConvert)
          try {
            resultBlob = await convertWithApi(
              '/api/convert/powerpoint-to-pdf',
              currentFile,
              { engine: conversionEngine, aspectRatio },
              (pct, msg) => {
                setProgressPercent(pct);
                setProgressMsg(msg);
              },
            );
            if (resultBlob) {
              localUrl = URL.createObjectURL(resultBlob);
            }
          } catch (apiErr) {
            console.warn('API conversion failed, attempting local fallback:', apiErr);
          }

          // 2. Si falló la API, fallback con pdf-lib enriquecido con imágenes de cada slide
          if (!resultBlob) {
            const pdfDoc = await PDFDocument.create();
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const { count, slides } = await parsePptxContent(currentFile);
            const slidesToRender =
              slides.length > 0
                ? slides
                : [{ slideNumber: 1, title: currentFile.name, paragraphs: [] }];

            for (let i = 0; i < slidesToRender.length; i++) {
              const slide = slidesToRender[i];
              const pageWidth = aspectRatio === '4:3' ? 792 : 842;
              const pageHeight = aspectRatio === '4:3' ? 612 : 595;
              const page = pdfDoc.addPage([pageWidth, pageHeight]);

              page.drawRectangle({
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
                color: rgb(0.97, 0.97, 0.98),
              });

              if (addSlideBorders) {
                page.drawRectangle({
                  x: 20,
                  y: 20,
                  width: pageWidth - 40,
                  height: pageHeight - 40,
                  borderColor: rgb(0.8, 0.8, 0.85),
                  borderWidth: 1.5,
                });
              }

              let embeddedImg: any = null;
              if (slide.images && slide.images.length > 0) {
                const firstImg = slide.images[0];
                try {
                  if (firstImg.format === 'png') {
                    embeddedImg = await pdfDoc.embedPng(firstImg.bytes);
                  } else {
                    embeddedImg = await pdfDoc.embedJpg(firstImg.bytes);
                  }
                } catch (imgErr) {
                  console.warn('No se pudo incrustar imagen en diapositiva:', imgErr);
                }
              }

              const hasImg = embeddedImg !== null;

              page.drawText(slide.title.substring(0, 60), {
                x: 50,
                y: pageHeight - 75,
                size: 22,
                font: fontBold,
                color: rgb(0.12, 0.12, 0.18),
              });

              let yOffset = pageHeight - 125;
              const maxParas = hasImg ? 7 : 9;
              for (const para of slide.paragraphs.slice(0, maxParas)) {
                if (yOffset < 75) break;
                page.drawText(`• ${para.substring(0, hasImg ? 55 : 110)}`, {
                  x: 60,
                  y: yOffset,
                  size: 13,
                  font: fontRegular,
                  color: rgb(0.25, 0.25, 0.3),
                });
                yOffset -= 26;
              }

              if (hasImg && embeddedImg) {
                const imgDims = embeddedImg.scaleToFit(pageWidth * 0.42, pageHeight * 0.65);
                page.drawImage(embeddedImg, {
                  x: pageWidth - imgDims.width - 45,
                  y: (pageHeight - imgDims.height) / 2 - 15,
                  width: imgDims.width,
                  height: imgDims.height,
                });
              }

              page.drawText(
                `${isEs ? 'Diapositiva' : 'Slide'} ${i + 1} de ${slidesToRender.length}`,
                {
                  x: pageWidth - 160,
                  y: 32,
                  size: 9,
                  font: fontRegular,
                  color: rgb(0.55, 0.55, 0.6),
                },
              );

              setProgressPercent(30 + Math.round(((i + 1) / slidesToRender.length) * 60));
            }

            const pdfBytes = await pdfDoc.save();
            resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
            localUrl = URL.createObjectURL(resultBlob);
          }

          const outName = `${currentFile.name.replace(/\.[^/.]+$/, '')}.pdf`;
          setDownloadFilename(outName);
          setDownloadUrl(localUrl);

          if (resultBlob) {
            setCompletedResult({
              downloadUrl: localUrl || '',
              filename: outName,
              fileSize: formatFileSize(resultBlob.size),
              rawBlob: resultBlob,
              outputFormat: 'pdf',
              originalSize: formatFileSize(currentFile.size),
              itemCount: readySlots[0].extractedSlideCount || 1,
            });
            setHeaderHidden(true);
            window.scrollTo(0, 0);
          }
        } else {
          // Lote de múltiples presentaciones PPTX -> Conversión REAL de cada una con el motor nativo y empaquetado en ZIP
          const zip = new JSZip();
          for (let sIdx = 0; sIdx < readySlots.length; sIdx++) {
            const currentFile = readySlots[sIdx].file!;
            const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
            setProgressMsg(
              isEs
                ? `Convirtiendo presentación ${sIdx + 1} de ${readySlots.length} (${currentFile.name})...`
                : `Converting presentation ${sIdx + 1} of ${readySlots.length}...`,
            );
            setProgressPercent(10 + Math.round((sIdx / readySlots.length) * 80));

            let pdfBlobItem: Blob | null = null;
            try {
              pdfBlobItem = await convertWithApi('/api/convert/powerpoint-to-pdf', currentFile, {
                engine: conversionEngine,
                aspectRatio,
              });
            } catch (itemErr) {
              console.warn(`Error converting ${currentFile.name} with API:`, itemErr);
            }

            if (pdfBlobItem) {
              const pdfArrayBuf = await pdfBlobItem.arrayBuffer();
              zip.file(`${baseName}.pdf`, pdfArrayBuf);
            } else {
              // Fallback local para este archivo si la API falló
              const pdfDoc = await PDFDocument.create();
              const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
              const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
              const { count, slides } = await parsePptxContent(currentFile);
              const slidesToRender =
                slides.length > 0
                  ? slides
                  : [{ slideNumber: 1, title: currentFile.name, paragraphs: [] }];

              for (let i = 0; i < slidesToRender.length; i++) {
                const slide = slidesToRender[i];
                const pageWidth = 842;
                const pageHeight = 595;
                const page = pdfDoc.addPage([pageWidth, pageHeight]);

                page.drawRectangle({
                  x: 0,
                  y: 0,
                  width: pageWidth,
                  height: pageHeight,
                  color: rgb(0.97, 0.97, 0.98),
                });
                page.drawText(slide.title.substring(0, 70), {
                  x: 50,
                  y: pageHeight - 75,
                  size: 20,
                  font: fontBold,
                  color: rgb(0.12, 0.12, 0.18),
                });
                let yOffset = pageHeight - 120;
                for (const para of slide.paragraphs.slice(0, 8)) {
                  if (yOffset < 60) break;
                  page.drawText(`• ${para.substring(0, 110)}`, {
                    x: 60,
                    y: yOffset,
                    size: 12,
                    font: fontRegular,
                    color: rgb(0.25, 0.25, 0.3),
                  });
                  yOffset -= 24;
                }
              }
              const pdfBytes = await pdfDoc.save();
              zip.file(`${baseName}.pdf`, pdfBytes);
            }
          }

          setProgressPercent(95);
          setProgressMsg(isEs ? 'Comprimiendo archivo ZIP...' : 'Compressing ZIP package...');
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          localUrl = URL.createObjectURL(zipBlob);
          resultBlob = zipBlob;

          const outName = `Presentaciones_PDF_${readySlots.length}_Archivos.zip`;
          setDownloadFilename(outName);
          setDownloadUrl(localUrl);

          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(zipBlob.size),
            rawBlob: zipBlob,
            outputFormat: 'zip',
            originalSize: formatFileSize(
              readySlots.reduce((acc, s) => acc + (s.file?.size || 0), 0),
            ),
            itemCount: readySlots.length,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
        }
        toast.success(isEs ? '¡Conversión a PDF completada!' : 'Conversion to PDF completed!');
      } else {
        // MODO PDF A POWERPOINT (PDF -> PPTX)
        if (readySlots.length === 1) {
          const currentFile = readySlots[0].file!;
          const totalToConvert = targetPages.length;
          setProgressMsg(
            isEs ? 'Procesando PDF a PowerPoint...' : 'Processing PDF to PowerPoint...',
          );

          if (conversionEngine === 'adobe' || conversionEngine === 'cloudconvert') {
            try {
              resultBlob = await convertWithApi(
                '/api/convert/pdf-to-powerpoint',
                currentFile,
                { engine: conversionEngine },
                (pct, msg) => {
                  setProgressPercent(pct);
                  setProgressMsg(msg);
                },
              );
              localUrl = URL.createObjectURL(resultBlob);
            } catch (apiErr) {
              console.warn('API error fallback to local PPTX builder:', apiErr);
            }
          }

          if (!resultBlob) {
            const pptxgenModule = await import('pptxgenjs');
            const PptxGenJS = pptxgenModule.default || pptxgenModule;
            const pres = new PptxGenJS();
            pres.layout = aspectRatio === '16:9' ? 'LAYOUT_16x9' : 'LAYOUT_4x3';
            pres.title = currentFile.name.replace(/\.[^/.]+$/, '');

            const arrayBuffer = await currentFile.arrayBuffer();
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
            const pdfDoc = await pdfjsLib.getDocument({
              data: arrayBuffer.slice(0),
              cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            }).promise;

            const renderScale = renderQuality === 'ultra' ? 2.5 : 2.0;
            const slideW = aspectRatio === '4:3' ? 10.0 : 13.33;
            const slideH = aspectRatio === '4:3' ? 7.5 : 7.5;

            for (let idx = 0; idx < totalToConvert; idx++) {
              const pageNum = targetPages[idx];
              setProgressMsg(
                conversionEngine === 'ocr'
                  ? isEs
                    ? `Escaneando OCR diapositiva ${idx + 1} de ${totalToConvert}...`
                    : `OCR scanning slide ${idx + 1} of ${totalToConvert}...`
                  : isEs
                    ? `Generando diapositiva ${idx + 1} de ${totalToConvert}...`
                    : `Generating slide ${idx + 1} of ${totalToConvert}...`,
              );
              setProgressPercent(10 + Math.round(((idx + 1) / totalToConvert) * 80));

              const page = await pdfDoc.getPage(pageNum);
              const viewport = page.getViewport({ scale: renderScale });

              const slide = pres.addSlide();
              slide.background = { color: slideTheme === 'dark' ? '111116' : 'FFFFFF' };

              // Renderizar canvas para imagen de fondo y/o OCR
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
                const imgData = canvas.toDataURL('image/png', 0.95);
                slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              }

              // Si es Motor OCR, extraer palabras por visión con Tesseract
              if (conversionEngine === 'ocr') {
                const ocrBlocks = await extractOcrTextBlocksFromCanvas(canvas);
                for (const block of ocrBlocks) {
                  const xIn = Math.max(0.4, (block.xPct / 100) * slideW);
                  const yIn = Math.max(0.4, (block.yPct / 100) * slideH);
                  const wIn = Math.min(
                    slideW - xIn - 0.4,
                    Math.max(1.5, ((block.wPct ?? 50) / 100) * slideW),
                  );
                  const hIn = 0.55;

                  slide.addText(block.text, {
                    x: xIn,
                    y: yIn,
                    w: wIn,
                    h: hIn,
                    fontSize: block.fontSizePt,
                    fontFace: 'Calibri',
                    bold: block.bold || block.isTitle,
                    color: slideTheme === 'dark' ? 'FFFFFF' : '111116',
                    transparency: 95, // Editable al hacer doble clic sin duplicar la imagen de fondo
                  });
                }
              } else {
                // Modo PptxGen Local: extracción semántica de PDF.js
                const textContent = await page.getTextContent();
                const textBlocks = extractStructuredTextFromPdfPage(
                  textContent,
                  viewport.width,
                  viewport.height,
                );

                if (pptxTextMode === 'hybrid' || pptxTextMode === 'native') {
                  for (const block of textBlocks) {
                    const xIn = Math.max(0.4, (block.xPct / 100) * slideW);
                    const yIn = Math.max(0.4, (block.yPct / 100) * slideH);
                    const wIn = Math.min(slideW - xIn - 0.4, block.isTitle ? 11 : 8.5);
                    const hIn = 0.55;

                    slide.addText(block.text, {
                      x: xIn,
                      y: yIn,
                      w: wIn,
                      h: hIn,
                      fontSize: block.fontSizePt,
                      fontFace: 'Calibri',
                      bold: block.bold || block.isTitle,
                      color:
                        pptxTextMode === 'hybrid'
                          ? slideTheme === 'dark'
                            ? 'FFFFFF'
                            : '111116'
                          : slideTheme === 'dark'
                            ? 'F0F0F5'
                            : '1A1A24',
                      transparency: pptxTextMode === 'hybrid' ? 95 : 0,
                    });
                  }
                }
              }
            }

            setProgressPercent(95);
            const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;
            resultBlob = pptxBlob;
            localUrl = URL.createObjectURL(pptxBlob);
          }

          const outName = `${currentFile.name.replace(/\.[^/.]+$/, '')}_Diapositivas.pptx`;
          setDownloadFilename(outName);
          setDownloadUrl(localUrl);

          if (resultBlob) {
            setCompletedResult({
              downloadUrl: localUrl || '',
              filename: outName,
              fileSize: formatFileSize(resultBlob.size),
              rawBlob: resultBlob,
              outputFormat: 'pptx',
              originalSize: formatFileSize(currentFile.size),
              itemCount: totalToConvert,
            });
            setHeaderHidden(true);
            window.scrollTo(0, 0);
          }
        } else {
          // Lote de múltiples PDFs -> ZIP de PPTX
          const zip = new JSZip();
          const pptxgenModule = await import('pptxgenjs');
          const PptxGenJS = pptxgenModule.default || pptxgenModule;
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          for (let sIdx = 0; sIdx < readySlots.length; sIdx++) {
            const currentSlot = readySlots[sIdx];
            const currentFile = currentSlot.file!;
            const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
            setProgressMsg(
              isEs ? `Procesando ${currentFile.name}...` : `Processing ${currentFile.name}...`,
            );
            setProgressPercent(10 + Math.round((sIdx / readySlots.length) * 80));

            const pres = new PptxGenJS();
            pres.layout = aspectRatio === '16:9' ? 'LAYOUT_16x9' : 'LAYOUT_4x3';
            const arrayBuffer = await currentFile.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({
              data: arrayBuffer.slice(0),
              cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            }).promise;

            const docTotalPages = pdfDoc.numPages;
            const pagesToExport =
              currentSlot.id === activeSlotIndex && targetPages.length > 0
                ? targetPages
                : Array.from({ length: docTotalPages }, (_, i) => i + 1);

            for (let pIdx = 0; pIdx < pagesToExport.length; pIdx++) {
              const pNum = pagesToExport[pIdx];
              const page = await pdfDoc.getPage(pNum);
              const viewport = page.getViewport({ scale: 2.0 });
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
                const imgData = canvas.toDataURL('image/png', 0.9);
                const slide = pres.addSlide();
                slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              }
            }

            const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;
            const pptxBuf = await pptxBlob.arrayBuffer();
            zip.file(`${baseName}_Diapositivas.pptx`, pptxBuf);
          }

          setProgressPercent(95);
          setProgressMsg(isEs ? 'Comprimiendo archivo ZIP...' : 'Compressing ZIP package...');
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          localUrl = URL.createObjectURL(zipBlob);
          resultBlob = zipBlob;

          const outName = `Presentaciones_PPTX_${readySlots.length}_Archivos.zip`;
          setDownloadFilename(outName);
          setDownloadUrl(localUrl);

          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(zipBlob.size),
            rawBlob: zipBlob,
            outputFormat: 'zip',
            originalSize: formatFileSize(
              readySlots.reduce((acc, s) => acc + (s.file?.size || 0), 0),
            ),
            itemCount: readySlots.length,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
        }
        toast.success(
          isEs ? '¡Conversión a PowerPoint completada!' : 'Conversion to PowerPoint completed!',
        );
      }
      setProgressPercent(100);
    } catch (err) {
      console.error(err);
      toast.error(
        isEs ? 'Error en la conversión de presentación.' : 'Presentation conversion error.',
      );
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
      {/* INPUTS ESPECÍFICOS PARA LAS 3 CAJAS INDEPENDIENTES */}
      {slots.map((s, idx) => (
        <input
          key={s.id}
          type="file"
          accept={mode === 'powerpoint-to-pdf' ? '.pptx,.ppt' : '.pdf'}
          className="hidden"
          ref={slotInputRefs[idx]}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              loadFilesIntoSlots(e.target.files, idx);
            }
            e.target.value = '';
          }}
        />
      ))}

      {/* INPUT FILE GLOBAL */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={mode === 'powerpoint-to-pdf' ? '.pptx,.ppt' : '.pdf'}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            loadFilesIntoSlots(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* SECCIÓN SUPERIOR CON BOTÓN VOLVER Y NOMBRE DE LA HERRAMIENTA */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4 font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <Link
                href="/convertir"
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
              </Link>
              <div className="hidden sm:block h-5 w-px bg-zinc-700" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                  {isEs
                    ? '003 / CONVERSIÓN DE PRESENTACIONES POWERPOINT Y PDF (CONVERSOR DUAL 2 EN 1)'
                    : '003 / POWERPOINT & PDF PRESENTATION CONVERSION (2-IN-1 DUAL CONVERTER)'}
                </span>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
                  <Presentation className="w-6 h-6 text-white flex-shrink-0" />
                  {mode === 'powerpoint-to-pdf'
                    ? isEs
                      ? 'CONVERTIR POWERPOINT A PDF'
                      : 'CONVERT POWERPOINT TO PDF'
                    : isEs
                      ? 'CONVERTIR PDF A POWERPOINT (CONVERSOR DUAL 2 EN 1)'
                      : 'CONVERT PDF TO POWERPOINT (2-IN-1 DUAL CONVERTER)'}
                </h1>
              </div>
            </div>
          </div>

          {/* BANNER DE RESULTADO Y MÉTRICAS */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <PowerPointIcon className="w-7 h-7 rounded-sm drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Conversión de presentación completada con éxito!'
                      : 'Presentation conversion completed successfully!'}
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
                  {isEs ? 'Presentaciones Procesadas' : 'Processed Files'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.itemCount || 1} />{' '}
                  {isEs ? 'elemento(s)' : 'file(s)'}
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

          {/* TARJETA DE DESCARGA ÉXITO */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat={completedResult.outputFormat}
            rawBlob={completedResult.rawBlob}
            currentToolId="powerpoint-pdf"
            onReset={handleClearAllSlots}
          />
        </motion.div>
      ) : (
        <>
          {/* HEADER SUPERIOR UNIFICADO (COMO EN PDF-TEXTO) */}
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
                    ? '003 / CONVERSIÓN DE PRESENTACIONES POWERPOINT Y PDF (CONVERSOR DUAL 2 EN 1)'
                    : '003 / POWERPOINT & PDF PRESENTATION CONVERSION (2-IN-1 DUAL CONVERTER)'}
                </span>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
                  <Presentation className="w-6 h-6 text-white flex-shrink-0" />
                  {mode === 'powerpoint-to-pdf'
                    ? isEs
                      ? 'CONVERTIR POWERPOINT A PDF'
                      : 'CONVERT POWERPOINT TO PDF'
                    : isEs
                      ? 'CONVERTIR PDF A POWERPOINT (CONVERSOR DUAL 2 EN 1)'
                      : 'CONVERT PDF TO POWERPOINT (2-IN-1 DUAL CONVERTER)'}
                </h1>
              </div>
            </div>

            {loadedSlots.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
                  <FileText className="w-4 h-4 text-zinc-300" />
                  <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                    {file?.name ||
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

          {/* SELECTOR DE MODO EN CÁPSULAS LIMPIAS (SIN TEXTO ENCIMA NI DEBAJO) */}
          <div className="flex items-center justify-center mb-6 font-mono">
            <div className="bg-[#09090b] border border-zinc-700 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => handleSwitchMode('powerpoint-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'powerpoint-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Presentation className="w-4 h-4 text-black" />
                <span>
                  {isEs ? 'PowerPoint a PDF (.pptx → .pdf)' : 'PowerPoint to PDF (.pptx → .pdf)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('pdf-to-powerpoint')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-powerpoint'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>
                  {isEs ? 'PDF a PowerPoint (.pdf → .pptx)' : 'PDF to PowerPoint (.pdf → .pptx)'}
                </span>
              </button>
            </div>
          </div>

          {loadedSlots.length === 0 ? (
            /* VISTA DROPZONE VACÍA */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  loadFilesIntoSlots(e.dataTransfer.files);
                }
              }}
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
                {mode === 'powerpoint-to-pdf' ? (
                  <PowerPointIcon className="w-12 h-12" />
                ) : (
                  <UploadCloud className="w-12 h-12 text-white" />
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
                {mode === 'powerpoint-to-pdf'
                  ? isEs
                    ? 'Arrastra hasta 3 archivos PowerPoint (.pptx)'
                    : 'Drop up to 3 PowerPoint files (.pptx)'
                  : isEs
                    ? 'Arrastra hasta 3 archivos PDF aquí'
                    : 'Drop up to 3 PDF files here'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'powerpoint-to-pdf'
                  ? isEs
                    ? 'Transforma archivos PowerPoint en documentos PDF vectoriales. 3 cajas independientes para procesar a la vez.'
                    : 'Transform PowerPoint files into vector PDF documents. 3 independent boxes to process at once.'
                  : isEs
                    ? 'Transforma páginas PDF a diapositivas PowerPoint (.pptx). Previsualiza al 50% y procesa hasta 3 archivos.'
                    : 'Transform PDF pages into PowerPoint slides (.pptx). Preview at 50% and process up to 3 files.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'powerpoint-to-pdf'
                    ? isEs
                      ? 'Seleccionar PowerPoint (Hasta 3)'
                      : 'Select PowerPoint (Up to 3)'
                    : isEs
                      ? 'Seleccionar PDFs (Hasta 3)'
                      : 'Select PDFs (Up to 3)'}
                </span>
              </button>

              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-white font-bold text-xs font-mono rounded-full mt-8 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>
                  {isEs
                    ? '3 CAJAS INDEPENDIENTES • VISTA AL 50% • 100% LOCAL'
                    : '3 INDEPENDENT BOXES • 50% PREVIEW • 100% LOCAL'}
                </span>
              </div>
            </motion.div>
          ) : (
            /* VISTA PRINCIPAL: SECCIÓN 1 (SPLIT 50% Y 3 CAJAS) + SECCIÓN 2 (PANEL INTACTO) */
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
                        {/* HOJA O DIAPOSITIVA EN VISTA PREVIA REDUCIDA AL 50% */}
                        {mode === 'pdf-to-powerpoint' ||
                        file.name.toLowerCase().endsWith('.pdf') ? (
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
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
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
                          /* DIAPOSITIVA 16:9 AL 50% VISUAL CON SOPORTE DE IMÁGENES EMBEBIDAS */
                          <div className="relative bg-[#1e1e28] text-white rounded-xl shadow-2xl border border-orange-500/40 overflow-hidden flex flex-col p-4 transition-all duration-300 w-[300px] sm:w-[330px] h-[170px] sm:h-[188px] group justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs border-b border-zinc-700/80 pb-1.5">
                                <Presentation className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                <span className="truncate">
                                  {extractedSlides[activePage - 1]?.title ||
                                    `${isEs ? 'Diapositiva' : 'Slide'} ${activePage}`}
                                </span>
                              </div>
                              <div className="flex gap-2.5 items-start">
                                <div className="flex-1 space-y-1 text-[11px] text-zinc-300 font-sans line-clamp-3">
                                  {extractedSlides[activePage - 1]?.paragraphs?.length ? (
                                    extractedSlides[activePage - 1].paragraphs
                                      .slice(0, 3)
                                      .map((p, pIdx) => (
                                        <p
                                          key={pIdx}
                                          className="truncate text-zinc-400 text-[10px]"
                                        >
                                          • {p}
                                        </p>
                                      ))
                                  ) : (
                                    <p className="text-zinc-500 italic text-[10px]">
                                      {isEs
                                        ? 'Contenido de diapositiva vectorial'
                                        : 'Vector slide presentation content'}
                                    </p>
                                  )}
                                </div>
                                {extractedSlides[activePage - 1]?.images &&
                                  extractedSlides[activePage - 1].images!.length > 0 && (
                                    <div className="w-20 h-16 rounded-lg overflow-hidden border border-orange-500/40 flex-shrink-0 bg-black/50 shadow-md">
                                      <img
                                        src={extractedSlides[activePage - 1].images![0].dataUrl}
                                        alt="Slide media"
                                        className="w-full h-full object-cover select-none"
                                      />
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-1 border-t border-zinc-800">
                              <span className="text-orange-300 font-bold">
                                {extractedSlides[activePage - 1]?.images?.length
                                  ? `✓ ${extractedSlides[activePage - 1].images!.length} Img`
                                  : '16:9 Widescreen'}
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
                              className="hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
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
                              className="hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              title={isEs ? 'Página siguiente' : 'Next page'}
                            >
                              ▶
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ESTADO VACÍO CUANDO LA CAJA ACTIVA NO TIENE ARCHIVO */
                      <div
                        onClick={() => slotInputRefs[activeSlotIndex]?.current?.click()}
                        className="flex flex-col items-center justify-center text-center p-6 cursor-pointer group"
                      >
                        <div className="w-[240px] h-[200px] border-2 border-dashed border-zinc-700/80 rounded-xl flex flex-col items-center justify-center gap-3 group-hover:border-orange-400/80 group-hover:bg-zinc-900/30 transition-all">
                          <UploadCloud className="w-8 h-8 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                          <span className="text-zinc-500 group-hover:text-zinc-300 text-xs font-mono px-4">
                            {isEs
                              ? `Cargar archivo en Caja ${activeSlotIndex + 1} para ver aquí al 50%`
                              : `Upload file in Box ${activeSlotIndex + 1} to view here at 50%`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── LADO DERECHO: 3 CAJAS INDEPENDIENTES PARA PROCESAR A LA VEZ ── */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-3 h-full">
                    {slots.map((slot, idx) => {
                      const isFilled = slot.file !== null;
                      const isActive = activeSlotIndex === idx;

                      return (
                        <div
                          key={slot.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              loadFilesIntoSlots(e.dataTransfer.files, idx);
                            }
                          }}
                          className={`flex-1 min-h-[105px] rounded-2xl p-3 transition-all duration-200 border flex items-center justify-between gap-3 relative ${
                            isActive && isFilled
                              ? 'bg-[#181824] border-orange-500 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/10'
                              : isFilled
                                ? 'bg-[#121217] border-zinc-700 hover:border-zinc-500'
                                : 'bg-[#0e0e12]/60 border-dashed border-zinc-700/80 hover:border-orange-400 hover:bg-zinc-900/40'
                          }`}
                        >
                          {isFilled ? (
                            <>
                              {/* Miniatura de la caja */}
                              <div
                                onClick={() => setActiveSlotIndex(idx)}
                                className="w-16 h-20 bg-white rounded-lg overflow-hidden border border-zinc-300 flex-shrink-0 flex items-center justify-center cursor-pointer relative shadow group"
                              >
                                {slot.thumbnailUrl ? (
                                  <img
                                    src={slot.thumbnailUrl}
                                    alt={`Miniatura ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform select-none"
                                  />
                                ) : slot.file?.name.toLowerCase().endsWith('.pdf') ? (
                                  <FileText className="w-7 h-7 text-orange-600" />
                                ) : (
                                  <PowerPointIcon className="w-7 h-7" />
                                )}
                              </div>

                              {/* Información del archivo */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-orange-300 border border-zinc-700">
                                    {isEs ? `Caja ${idx + 1}` : `Box ${idx + 1}`}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] font-mono text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800">
                                      {isEs ? 'En Pantalla (50%)' : 'On Screen (50%)'}
                                    </span>
                                  )}
                                </div>
                                <p
                                  onClick={() => setActiveSlotIndex(idx)}
                                  className="text-white text-xs font-bold truncate cursor-pointer hover:text-orange-300 transition-colors"
                                  title={slot.file?.name}
                                >
                                  {slot.file?.name}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                                  <span>{formatFileSize(slot.file?.size || 0)}</span>
                                  {slot.totalPages > 1 && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {slot.totalPages}{' '}
                                        {mode === 'powerpoint-to-pdf'
                                          ? isEs
                                            ? 'diaps'
                                            : 'slides'
                                          : isEs
                                            ? 'págs'
                                            : 'pages'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Acciones de la caja */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setActiveSlotIndex(idx)}
                                  className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-orange-600 text-white shadow-md'
                                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                  }`}
                                  title={isEs ? 'Ver en miniatura al 50%' : 'View at 50%'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => slotInputRefs[idx]?.current?.click()}
                                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                                  title={isEs ? 'Cambiar archivo' : 'Change file'}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleClearSlot(idx, e)}
                                  className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                                  title={isEs ? 'Quitar archivo' : 'Remove file'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            /* ESTADO VACÍO DE LA CAJA */
                            <div
                              onClick={() => slotInputRefs[idx]?.current?.click()}
                              className="w-full h-full flex items-center justify-center gap-3 cursor-pointer group py-2"
                            >
                              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-orange-400 group-hover:border-orange-400/40 transition-all">
                                <FilePlus className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-zinc-300 group-hover:text-white font-mono block">
                                  {mode === 'powerpoint-to-pdf'
                                    ? isEs
                                      ? `+ Cargar PPTX ${idx + 1}`
                                      : `+ Load PPTX ${idx + 1}`
                                    : isEs
                                      ? `+ Cargar PDF ${idx + 1}`
                                      : `+ Load PDF ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {mode === 'powerpoint-to-pdf' ? '.pptx / .ppt' : 'Archivo PDF'}
                                </span>
                              </div>
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
                      <Cpu className="w-4 h-4 text-orange-400" />
                      <span>
                        {isEs
                          ? 'Motor de Presentaciones PowerPoint'
                          : 'PowerPoint Presentation Engine'}
                      </span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {isEs ? '4 Motores Disponibles' : '4 Engines Available'}
                    </span>
                  </div>

                  {/* MODO DE TEXTO EDITABLE EN POWERPOINT (CUANDO SE CONVIERTE PDF -> PPTX) */}
                  {mode === 'pdf-to-powerpoint' && (
                    <div className="bg-[#121217] border border-orange-500/30 rounded-2xl p-3.5 mb-2 shadow-inner">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                          <Sparkles className="w-4 h-4 text-orange-400" />
                          {isEs
                            ? 'Modo de Texto en PowerPoint (Motor Local)'
                            : 'PowerPoint Text Mode (Local Engine)'}
                        </span>
                        <span className="text-[10px] text-orange-300 font-mono bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/80">
                          {isEs ? 'Texto Editable con Clic' : 'Editable Text on Click'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPptxTextMode('hybrid')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            pptxTextMode === 'hybrid'
                              ? 'bg-orange-950/60 border-orange-400 text-white shadow-sm'
                              : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-bold block">
                            ✨ {isEs ? 'Híbrido Inteligente' : 'Smart Hybrid'}
                          </span>
                          <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                            {isEs
                              ? 'Fondo HD + Cajas editables nativas'
                              : 'HD Background + Native editable boxes'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPptxTextMode('native')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            pptxTextMode === 'native'
                              ? 'bg-orange-950/60 border-orange-400 text-white shadow-sm'
                              : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-bold block">
                            📄 {isEs ? 'Nativo Vectorial' : 'Native Vector'}
                          </span>
                          <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                            {isEs
                              ? 'Cajas limpias y viñetas (peso pluma)'
                              : 'Clean text boxes & bullets (lightweight)'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPptxTextMode('raster')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            pptxTextMode === 'raster'
                              ? 'bg-orange-950/60 border-orange-400 text-white shadow-sm'
                              : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-bold block">
                            🖼️ {isEs ? 'Lámina HD' : 'HD Slide'}
                          </span>
                          <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                            {isEs
                              ? 'Fidelidad visual 100% pixel a pixel'
                              : '100% pixel-perfect raster'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

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
                          ? 'Máxima fidelidad oficial de Adobe en diapositivas, textos vectoriales, fuentes y gráficos.'
                          : 'Official Adobe fidelity for slides, vector texts, fonts & graphics.'}
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
                          ? 'Motor en la nube de alto rendimiento. Convierte presentaciones con maquetación fiel en PPTX.'
                          : 'High-performance cloud engine. Faithful presentation layout into PPTX.'}
                      </p>
                    </button>

                    {/* OPCIÓN 3: MOTOR LOCAL NATIVO */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('local')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'local'
                          ? 'bg-orange-950/50 border-orange-400 ring-1 ring-orange-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>
                            {mode === 'pdf-to-powerpoint'
                              ? '⚡ Motor Local PptxGen'
                              : '⚡ Motor Local Nativo Office'}
                          </span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {mode === 'pdf-to-powerpoint'
                            ? isEs
                              ? 'Instantáneo (~0.5s)'
                              : 'Instant (~0.5s)'
                            : isEs
                              ? 'Nativo Windows'
                              : 'Native Windows'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {mode === 'pdf-to-powerpoint'
                          ? isEs
                            ? 'Compilación directa en memoria 100% privada sin subir datos a servidores externos.'
                            : '100% private in-memory compilation without uploading files externally.'
                          : isEs
                            ? 'Conversión ultrarrápida con 100% fidelidad de Microsoft PowerPoint en tu equipo.'
                            : 'Ultra-fast conversion with 100% Microsoft PowerPoint fidelity on your machine.'}
                      </p>
                    </button>

                    {/* OPCIÓN 4: MOTOR OCR RECONSTRUCTOR DE ESCANEADOS */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('ocr')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'ocr'
                          ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>🔍 Motor OCR Escaneados</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Tesseract OCR
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {mode === 'pdf-to-powerpoint'
                          ? isEs
                            ? 'Reconoce y extrae texto de fotos, capturas o PDFs escaneados para crear diapositivas editables.'
                            : 'Recognizes & extracts text from photos, screenshots & scanned PDFs into editable slides.'
                          : isEs
                            ? 'Genera PDF con indexación de búsqueda OCR completa en diagramas y capturas de diapositivas.'
                            : 'Generates PDF with full OCR search indexing for slide diagrams & screenshots.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* GRID DE OPCIONES MODULARES EN 3 COLUMNAS */}
                {mode === 'pdf-to-powerpoint' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COLUMNA 1: SELECCIÓN DE PÁGINAS / DIAPOSITIVAS */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-orange-400" />
                            <span>{isEs ? 'Páginas a Convertir' : 'Pages to Convert'}</span>
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
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
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
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
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
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
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
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
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
                              className="w-full bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
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

                      {/* RESUMEN DE ACCIONES RÁPIDAS */}
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

                    {/* COLUMNA 2: PROPORCIÓN Y AJUSTE */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-orange-400" />
                            {isEs ? 'Proporción de Diapositiva' : 'Slide Aspect Ratio'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAspectRatio('16:9')}
                              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                aspectRatio === '16:9'
                                  ? 'bg-white text-black border-white shadow-md'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              16:9 Panorámico
                            </button>
                            <button
                              type="button"
                              onClick={() => setAspectRatio('4:3')}
                              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                aspectRatio === '4:3'
                                  ? 'bg-white text-black border-white shadow-md'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              4:3 Estándar
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-orange-400" />
                            {isEs ? 'Ajuste de Página' : 'Page Fitting'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFitMode('contain')}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                fitMode === 'contain'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Ajustar (Fit)' : 'Fit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFitMode('cover')}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                fitMode === 'cover'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Llenar (Cover)' : 'Fill'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 3: NITIDEZ, TEMA Y NUMERACIÓN */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-orange-400" />
                            {isEs ? 'Nitidez / Calidad' : 'Sharpness'}
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRenderQuality('high')}
                              className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                renderQuality === 'high'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              HD 2X
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenderQuality('ultra')}
                              className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                renderQuality === 'ultra'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              Ultra HD
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                            <Presentation className="w-4 h-4 text-orange-400" />
                            {isEs ? 'Fondo Slide' : 'Slide Theme'}
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSlideTheme('white')}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                slideTheme === 'white'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {isEs ? 'Blanco' : 'White'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSlideTheme('dark')}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                slideTheme === 'dark'
                                  ? 'bg-zinc-800 text-white border-zinc-600'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {isEs ? 'Oscuro' : 'Dark'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={addSlideNumbers}
                              onChange={(e) => setAddSlideNumbers(e.target.checked)}
                              className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs ? 'Incluir número de diapositiva' : 'Include slide numbers'}
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="text-[10px] text-zinc-300 font-mono">
                          {isEs
                            ? 'Compatible con Microsoft PowerPoint & 365'
                            : 'Compatible with PowerPoint & 365'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODO POWERPOINT A PDF EN 3 COLUMNAS */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COLUMNA 1: RELACIÓN DE ASPECTO */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                          <Layout className="w-4 h-4 text-orange-400" />
                          {isEs ? 'Relación de Aspecto' : 'Aspect Ratio'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAspectRatio('16:9')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              aspectRatio === '16:9'
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            16:9 (Panorámico)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAspectRatio('4:3')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              aspectRatio === '4:3'
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            4:3 (Estándar)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: DIAPOSITIVAS POR PÁGINA */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                          <Grid className="w-4 h-4 text-orange-400" />
                          {isEs ? 'Diapositivas por Página' : 'Slides per Page'}
                        </label>
                        <select
                          value={handoutLayout}
                          onChange={(e) => setHandoutLayout(e.target.value as HandoutLayout)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                        >
                          <option value="1_per_page">
                            {isEs
                              ? '1 por página (Diapositiva Completa)'
                              : '1 per page (Full Slide)'}
                          </option>
                          <option value="2_per_page">
                            {isEs ? '2 por página (Folleto / Handout)' : '2 per page (Handout)'}
                          </option>
                          <option value="4_per_page">
                            {isEs ? '4 por página (Cuadrícula 2x2)' : '4 per page (2x2 Grid)'}
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* COLUMNA 3: CHECKBOXES Y COMPATIBILIDAD */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={addSlideNumbers}
                            onChange={(e) => setAddSlideNumbers(e.target.checked)}
                            className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs ? 'Incluir número de diapositiva' : 'Include slide numbers'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={addSlideBorders}
                            onChange={(e) => setAddSlideBorders(e.target.checked)}
                            className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>{isEs ? 'Dibujar marco de borde fino' : 'Draw border frame'}</span>
                        </label>
                      </div>

                      <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="text-[10px] text-zinc-300 font-mono">
                          {isEs ? 'Estándar ISO PDF/A compatible' : 'ISO PDF/A compliant standard'}
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
                          className="h-full bg-orange-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  {loadedSlots.length > 1 ? (
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      {/* BOTÓN PRINCIPAL: CONVERTIR LOS 3 ARCHIVOS A LA VEZ */}
                      <button
                        type="button"
                        onClick={() => executeConversion(false)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white py-3.5 px-4 rounded-2xl font-sans font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-orange-600/30 hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                        )}
                        <span>
                          {isProcessing
                            ? progressMsg
                            : mode === 'powerpoint-to-pdf'
                              ? isEs
                                ? `⚡ Convertir los ${loadedSlots.length} Archivos a PDF (ZIP) →`
                                : `⚡ Convert all ${loadedSlots.length} Presentations to PDF (ZIP) →`
                              : isEs
                                ? `⚡ Convertir los ${loadedSlots.length} Archivos a PowerPoint (ZIP) →`
                                : `⚡ Convert all ${loadedSlots.length} Presentations to PPTX (ZIP) →`}
                        </span>
                      </button>

                      {/* BOTÓN SECUNDARIO: CONVERTIR SOLO EL ARCHIVO ACTIVO */}
                      <button
                        type="button"
                        onClick={() => executeConversion(true)}
                        disabled={
                          isProcessing ||
                          !file ||
                          (mode === 'pdf-to-powerpoint' && targetPages.length === 0)
                        }
                        className="sm:w-auto px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-2xl font-sans font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        title={isEs ? `Procesar solo ${file?.name}` : `Process only ${file?.name}`}
                      >
                        <Eye className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="truncate max-w-[240px]">
                          {isEs
                            ? `Solo archivo activo (${targetPages.length} pág${targetPages.length === 1 ? '' : 's'}) →`
                            : `Only active file (${targetPages.length} slide${targetPages.length === 1 ? '' : 's'}) →`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => executeConversion(false)}
                      disabled={
                        isProcessing ||
                        !file ||
                        (mode === 'pdf-to-powerpoint' && targetPages.length === 0)
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
                            : mode === 'powerpoint-to-pdf'
                              ? isEs
                                ? 'Convertir PowerPoint a PDF →'
                                : 'Convert PowerPoint to PDF →'
                              : isEs
                                ? targetPages.length === 0
                                  ? 'Selecciona al menos 1 página'
                                  : `Convertir ${targetPages.length} Diapositiva${targetPages.length === 1 ? '' : 's'} a PPTX →`
                                : targetPages.length === 0
                                  ? 'Select at least 1 page'
                                  : `Convert ${targetPages.length} Slide${targetPages.length === 1 ? '' : 's'} to PPTX →`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
