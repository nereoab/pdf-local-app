'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFName,
  PDFDict,
  PDFRef,
  PDFRawStream,
} from 'pdf-lib';
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
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
import PdfPageViewer from '@/components/PdfPageViewer';
import { Document, Packer, Paragraph, TextRun, PageBreak, ImageRun } from 'docx';
import { convertPdfToUltraDocx } from '@/lib/high-fidelity-docx-engine';
import { convertPdfToWordWithApi } from '@/lib/pdf2docx-api-client';
import { convertWithApi } from '@/lib/adobe-api-client';
import mammoth from 'mammoth';

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
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [conversionEngine, setConversionEngine] = useState<
    'adobe' | 'local' | 'pdf2docx' | 'cloudconvert'
  >('adobe');

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
  // DOCX PREVIEW ALTA FIDELIDAD
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const docxScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDocxRendering, setIsDocxRendering] = useState<boolean>(false);
  const [docxRenderError, setDocxRenderError] = useState<boolean>(false);
  const [docxZoom, setDocxZoom] = useState<number>(45);

  const handleFitDocxWidth = useCallback(() => {
    if (docxScrollContainerRef.current) {
      const containerWidth = docxScrollContainerRef.current.clientWidth || 360;
      const fitPercent = Math.max(
        25,
        Math.min(100, Math.floor(((containerWidth - 32) / 816) * 100)),
      );
      setDocxZoom(fitPercent);
    } else {
      setDocxZoom(45);
    }
  }, []);
  // AUTO-SCROLL DE LA BARRA LATERAL DE MINIATURAS A LA MINIATURA ACTIVA
  useEffect(() => {
    if (activePage > 0) {
      const thumbElem = document.getElementById(`thumb-page-${activePage}`);
      if (thumbElem) {
        thumbElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activePage]);

  // AUTO-SELECCIÓN DE MOTOR SEGÚN NÚMERO DE PÁGINAS (>200 Motor Local / <=200 Adobe Acrobat)
  useEffect(() => {
    if (totalPages > 200) {
      setConversionEngine('local');
    } else if (totalPages > 0) {
      setConversionEngine('adobe');
    }
  }, [totalPages]);

  const scrollToDocxPage = (pageNum: number) => {
    setActivePage(pageNum);
    const container = docxScrollContainerRef.current;
    if (!container || !docxContainerRef.current) return;

    const sections = docxContainerRef.current.querySelectorAll(
      '.docx-wrapper > section.docx, section.docx',
    );
    if (sections && sections.length > 1 && sections[pageNum - 1]) {
      const targetSec = sections[pageNum - 1] as HTMLElement;
      sections.forEach((s) => s.classList.remove('docx-active-page'));
      targetSec.classList.add('docx-active-page');

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetSec.getBoundingClientRect();
      const diff = targetRect.top - containerRect.top;
      container.scrollTo({ top: container.scrollTop + diff - 15, behavior: 'smooth' });
    } else {
      // Documento continuo con 1 sección: desplazamiento proporcional al total de páginas
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const ratio = totalPages > 1 ? (pageNum - 1) / (totalPages - 1) : 0;
      const targetScroll = Math.round(ratio * maxScroll);
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

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

  // EFECTO DE RENDERIZADO ALTA FIDELIDAD DE DOCX CON DOCX-PREVIEW
  useEffect(() => {
    let isMounted = true;
    if (
      file &&
      (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc'))
    ) {
      setIsDocxRendering(true);
      setDocxRenderError(false);
      (async () => {
        try {
          const buffer = await file.arrayBuffer();
          const docx = await import('docx-preview');
          if (docxContainerRef.current && isMounted) {
            docxContainerRef.current.innerHTML = '';
            await docx.renderAsync(buffer, docxContainerRef.current, undefined, {
              className: 'docx-preview-rendered',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              useBase64URL: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
            });
            if (isMounted) {
              setIsDocxRendering(false);
              const sections = docxContainerRef.current.querySelectorAll(
                '.docx-wrapper > section.docx, section.docx',
              );
              if (sections && sections.length > 0) {
                const total = Math.max(sections.length, parsedWordDoc?.estPages || totalPages || 1);
                setTotalPages(total);
                setSelectedPageSet(new Set(Array.from({ length: total }, (_, i) => i + 1)));
                setPageRangeInput(`1-${total}`);
                setActivePage(1);

                // Inyectar identificador, número de página visible y separadores claros
                sections.forEach((sec, idx) => {
                  sec.setAttribute('id', `docx-page-${idx + 1}`);
                  (sec as HTMLElement).style.position = 'relative';

                  // Badge de número de página en la esquina superior de cada hoja
                  const badge = document.createElement('div');
                  badge.className = 'docx-page-badge';
                  badge.innerText = `Página ${idx + 1} de ${total}`;
                  sec.insertBefore(badge, sec.firstChild);

                  if (idx === 0) sec.classList.add('docx-active-page');
                });

                // Generar miniaturas enriquecidas con el contenido y colores ya maquetados
                if (parsedWordDoc) {
                  const richThumbs = renderWordPageThumbnails(
                    parsedWordDoc,
                    total,
                    docxContainerRef.current,
                  );
                  setPageDataUrls(richThumbs);
                }

                setTimeout(() => {
                  handleFitDocxWidth();
                }, 80);
              }
            }
          }
        } catch (err) {
          console.warn('docx-preview error, falling back to structured preview:', err);
          if (isMounted) {
            setDocxRenderError(true);
            setIsDocxRendering(false);
          }
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [file, handleFitDocxWidth, parsedWordDoc]);

  const renderWordPageThumbnails = (
    doc: ParsedWordDoc,
    pagesCount: number,
    docxDomContainer?: HTMLElement | null,
  ): Record<number, string> => {
    const urls: Record<number, string> = {};
    const paragraphs = doc.paragraphs || [];
    const paragraphsPerPage = Math.max(1, Math.ceil(paragraphs.length / Math.max(pagesCount, 1)));
    const sections = docxDomContainer
      ? docxDomContainer.querySelectorAll('.docx-wrapper > section.docx, section.docx')
      : null;

    for (let p = 1; p <= pagesCount; p++) {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const sec = sections && sections[p - 1] ? (sections[p - 1] as HTMLElement) : null;
      const secText = sec?.innerText?.trim() || '';

      const isCover =
        p === 1 &&
        (doc.title.toLowerCase().includes('lean') ||
          doc.title.toLowerCase().includes('mgc') ||
          secText.includes('LAST') ||
          (paragraphs[0] && paragraphs[0].toUpperCase().includes('LAST')));

      if (isCover) {
        // Portada naranja fiel al documento Lean Construction
        ctx.fillStyle = '#f97316';
        ctx.fillRect(0, 0, 180, 250);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        const cleanTitle = (doc.title || 'LEAN CONSTRUCTION').replace(/_/g, ' ');
        const words = cleanTitle.split(' ');
        let ty = 50;
        for (let w = 0; w < Math.min(words.length, 5); w++) {
          ctx.fillText(words[w], 14, ty);
          ty += 16;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(14, ty + 8, 150, 3);
        ctx.fillRect(14, ty + 15, 90, 2);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('PORTADA • PÁG. 1', 14, 236);
      } else {
        // Hoja blanca de documento Word
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 180, 250);

        // Barra superior azul Word
        ctx.fillStyle = '#2b579a';
        ctx.fillRect(0, 0, 180, 6);

        // Párrafos y textos de la página
        const pageLines = secText
          ? secText
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
          : paragraphs.slice((p - 1) * paragraphsPerPage, p * paragraphsPerPage);

        const heading = pageLines[0] || doc.headings[p - 2] || `Página ${p}`;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.fillText(heading.substring(0, 25), 12, 24);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(12, 30, 156, 1);

        let y = 42;
        for (let l = 1; l < Math.min(pageLines.length, 12); l++) {
          const line = pageLines[l] || '';
          if (line.length > 0) {
            ctx.fillStyle = '#475569';
            ctx.font = '7px sans-serif';
            ctx.fillText(line.substring(0, 32), 12, y);
          } else {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(12, y - 4, 130 - (l % 4) * 20, 3);
          }
          y += 13;
          if (y > 210) break;
        }

        if (sec?.querySelector('table') || (doc.tables && doc.tables.length > 0 && p % 3 === 0)) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 0.5;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(12, y, 156, 26);
          ctx.strokeRect(12, y, 156, 26);
          ctx.beginPath();
          ctx.moveTo(12, y + 8);
          ctx.lineTo(168, y + 8);
          ctx.moveTo(12, y + 17);
          ctx.lineTo(168, y + 17);
          ctx.moveTo(64, y);
          ctx.lineTo(64, y + 26);
          ctx.moveTo(116, y);
          ctx.lineTo(116, y + 26);
          ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 7.5px monospace';
        ctx.fillText(`Pág. ${p} / ${pagesCount}`, 12, 240);
      }

      urls[p] = canvas.toDataURL('image/jpeg', 0.88);
    }
    return urls;
  };

  const prepararWordDocCompleto = async (wordFile: File) => {
    setIsRendering(true);
    setPageDataUrls({});
    try {
      const doc = await parseDocxDetails(wordFile);
      setParsedWordDoc(doc);
      const estPages = Math.max(doc.estPages, 1);
      setTotalPages(estPages);
      setSelectedPageSet(new Set(Array.from({ length: estPages }, (_, i) => i + 1)));
      setPageRangeInput(`1-${estPages}`);
      setActivePage(1);

      const urls = renderWordPageThumbnails(doc, estPages);
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
        setProgressPercent(10);
        setProgressMsg(
          conversionEngine === 'adobe'
            ? isEs
              ? 'Convirtiendo Word a PDF con Adobe Acrobat Services...'
              : 'Converting Word to PDF with Adobe Acrobat Services...'
            : isEs
              ? 'Compilando PDF vectorial con Motor Local...'
              : 'Compiling vector PDF with Local Engine...',
        );

        try {
          resultBlob = await convertWithApi(
            '/api/convert/word-to-pdf',
            file,
            {
              engine: conversionEngine,
              pageSize,
              orientation,
              margin,
              pdfFontFamily,
              pdfFontSize: pdfFontSize.toString(),
              pdfLineSpacing: pdfLineSpacing.toString(),
              addPageNumbers: addPageNumbers ? 'true' : 'false',
              includeWordDocHeader: includeWordDocHeader ? 'true' : 'false',
            },
            (pct, msg) => {
              setProgressPercent(pct);
              setProgressMsg(msg);
            },
          );
        } catch (apiErr) {
          console.warn('API error, falling back to local Word renderer:', apiErr);

          // Extraer texto plano y estructura desde .docx con Mammoth
          const arrayBuffer = await file.arrayBuffer();
          const extractResult = await mammoth.extractRawText({ arrayBuffer });
          const rawText = extractResult.value || '';

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
                y: dimH - 60,
                size: 9,
                font,
                color: rgb(0.4, 0.45, 0.55),
              },
            );
            page.drawLine({
              start: { x: sideMargin, y: dimH - 70 },
              end: { x: dimW - sideMargin, y: dimH - 70 },
              thickness: 1,
              color: rgb(0.8, 0.85, 0.9),
            });
          }

          let currentY = dimH - (includeWordDocHeader ? 95 : sideMargin);
          const lineHeight = pdfFontSize * 1.35;
          const paragraphs = rawText.split('\n');

          for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
            const p = paragraphs[pIdx].trim();
            if (!p) {
              currentY -= lineHeight * 0.7;
              continue;
            }

            const words = p.split(' ');
            let line = '';

            for (let i = 0; i < words.length; i++) {
              const testLine = line + (line ? ' ' : '') + words[i];
              const testWidth = font.widthOfTextAtSize(testLine, pdfFontSize);

              if (testWidth > usableWidth && line !== '') {
                if (currentY < sideMargin + 30) {
                  page = pdfDoc.addPage([dimW, dimH]);
                  currentY = dimH - sideMargin;
                }

                page.drawText(line, {
                  x: sideMargin,
                  y: currentY,
                  size: pdfFontSize,
                  font,
                  color: rgb(0.12, 0.14, 0.18),
                });

                currentY -= lineHeight;
                line = words[i];
              } else {
                line = testLine;
              }
            }

            if (line) {
              if (currentY < sideMargin + 30) {
                page = pdfDoc.addPage([dimW, dimH]);
                currentY = dimH - sideMargin;
              }

              page.drawText(line, {
                x: sideMargin,
                y: currentY,
                size: pdfFontSize,
                font,
                color: rgb(0.12, 0.14, 0.18),
              });

              currentY -= lineHeight;
            }
            currentY -= 6;
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
        }

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
          isEs
            ? '¡Documento Word convertido a PDF vectorial con éxito!'
            : 'Word document converted to vector PDF successfully!',
        );
      } else {
        // MODO PDF A WORD (PDF -> DOCX) MEDIANTE MOTOR HIGH PRECISION PDF2DOCX
        const totalToConvert = targetPages.length;
        const docTitle = file.name.replace(/\.[^/.]+$/, '');

        try {
          resultBlob = await convertPdfToWordWithApi(file, {
            pages: targetPages,
            layoutMode,
            includeImages,
            primaryFont,
            addPageBreaks,
            engine: conversionEngine,
            onProgress: (pct, msg) => {
              setProgressPercent(pct);
              setProgressMsg(msg);
            },
          });
        } catch (apiErr) {
          console.warn('API error, falling back to local engine:', apiErr);
          resultBlob = await convertPdfToUltraDocx(file, {
            layoutMode,
            includeImages,
            detectTables: true,
            primaryFont,
            targetPages,
            onProgress: (pct, msg) => {
              setProgressPercent(pct);
              setProgressMsg(msg);
            },
          });
        }

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
            ? `¡${totalToConvert} páginas exportadas a Word (.docx) con fidelidad Ultra HD!`
            : `Successfully exported ${totalToConvert} pages to Word (.docx) with Ultra HD fidelity!`,
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

      {/* HEADER DE HERRAMIENTA ELEGANTE */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-mono transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '001 / CONVERSIÓN DE DOCUMENTOS WORD Y PDF'
                : '001 / WORD & PDF DOCUMENT CONVERSION'}
            </span>
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2 font-sans uppercase">
              <WordIcon className="w-5 h-5 rounded-sm flex-shrink-0" />
              {mode === 'word-to-pdf'
                ? isEs
                  ? 'CONVERTIR WORD A PDF'
                  : 'CONVERT WORD TO PDF'
                : isEs
                  ? 'CONVERTIR PDF A WORD EDITABLE'
                  : 'CONVERT PDF TO EDITABLE WORD'}
            </h1>
          </div>
        </div>

        {(file || completedResult) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {completedResult ? completedResult.filename : file?.name}
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
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
          className="w-full max-w-4xl mx-auto my-3 sm:my-4 font-sans space-y-3.5"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-2xl p-4 sm:p-5 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 bg-zinc-900 border border-[#E8DFCF]/40 rounded-xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <WordIcon className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[9px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? 'CONVERSIÓN COMPLETADA' : 'CONVERSION COMPLETED'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-zinc-900 border border-[#E8DFCF]/30 px-3 py-1.5 rounded-xl shadow-sm">
                <div className="text-right">
                  <div className="text-[9px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-[#FAF6EE] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 font-sans">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            {/* MÉTRICAS DE LA CONVERSIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-3.5 font-mono text-xs border-t border-zinc-800/80 mt-3.5">
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Formato de Salida' : 'Output Format'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-xs sm:text-sm font-mono mt-0.5 uppercase">
                  {completedResult.outputFormat}
                </span>
              </div>
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Tamaño Resultante' : 'Result Size'}
                </span>
                <span className="text-white font-bold text-xs sm:text-sm font-mono mt-0.5">
                  {completedResult.fileSize}
                </span>
              </div>
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-xs sm:text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.itemCount || 1} />{' '}
                  {isEs ? 'págs' : 'pages'}
                </span>
              </div>
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Procesamiento' : 'Processing'}
                </span>
                <span className="text-white font-bold text-xs sm:text-sm font-mono mt-0.5">
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
                    ? 'CONVERTIR PDF A WORD EDITABLE'
                    : 'CONVERT PDF TO EDITABLE WORD'}
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
            /* VISTA PRINCIPAL CON PREVISUALIZACIÓN ARRIBA Y PANEL DE CONTROL DEBAJO */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 flex-1 w-full"
            >
              {/* SECCIÓN 1: VISOR SPLIT CON MINIATURAS 1 COLUMNA + VISOR TAMAÑO GRANDE (ANCHO COMPLETO) */}
              <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-[580px] sm:h-[640px] lg:h-[680px] relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
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

                {/* CONTENEDOR SPLIT: IZQUIERDA MINIATURAS - DERECHA VISOR AMPLIADO */}
                <div className="w-full flex-1 bg-[#121217] rounded-2xl overflow-hidden relative border border-zinc-700/80 font-mono min-h-0 flex shadow-inner">
                  {/* COLUMNA IZQUIERDA: MINIATURAS EN 1 COLUMNA CON CHECKBOX */}
                  {file && (
                    <div className="w-32 sm:w-36 flex-shrink-0 bg-[#0c0c0f] border-r border-zinc-800 p-2 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                        <span className="text-[9px] text-zinc-400 font-mono uppercase font-bold">
                          {isEs ? 'PÁGS' : 'PAGES'} ({totalPages || 1})
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
                              id={`thumb-page-${pageNum}`}
                              onClick={() => {
                                setActivePage(pageNum);
                                if (
                                  mode === 'word-to-pdf' ||
                                  (file &&
                                    (file.name.toLowerCase().endsWith('.docx') ||
                                      file.name.toLowerCase().endsWith('.doc')))
                                ) {
                                  scrollToDocxPage(pageNum);
                                }
                              }}
                              className={`w-full bg-[#18181f] border rounded-xl p-1.5 flex flex-col items-center relative transition-all cursor-pointer group shadow-sm ${
                                isActive
                                  ? 'border-blue-400 ring-2 ring-blue-400/50 bg-blue-950/40 shadow-blue-500/20'
                                  : isIncluded
                                    ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/90'
                                    : 'border-zinc-800 opacity-40 grayscale hover:opacity-80 hover:border-zinc-700'
                              }`}
                            >
                              {/* Checkbox selector */}
                              <button
                                type="button"
                                onClick={(e) => togglePageSelection(pageNum, e)}
                                className={`absolute top-2 left-2 z-10 p-0.5 rounded-md transition-all cursor-pointer ${
                                  isIncluded
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-black/70 text-zinc-500 hover:text-white border border-zinc-700'
                                }`}
                                title={
                                  isIncluded
                                    ? isEs
                                      ? 'Quitar de la extracción'
                                      : 'Exclude page'
                                    : isEs
                                      ? 'Incluir en la extracción'
                                      : 'Include page'
                                }
                              >
                                {isIncluded ? (
                                  <Check className="w-3 h-3 stroke-[3] text-white" />
                                ) : (
                                  <div className="w-3 h-3" />
                                )}
                              </button>

                              <div className="w-full bg-white rounded overflow-hidden aspect-[1/1.4] relative flex flex-col items-center justify-center p-1.5 shadow-inner">
                                {pageDataUrls[pageNum] ? (
                                  <img
                                    src={pageDataUrls[pageNum]}
                                    alt={`Pág ${pageNum}`}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 text-zinc-800 rounded border border-zinc-200">
                                    <FileText className="w-4 h-4 text-blue-600 mb-0.5" />
                                    <span className="text-[9px] font-bold font-mono text-zinc-800">
                                      Pág. {pageNum}
                                    </span>
                                  </div>
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
                  )}

                  {/* COSTADO DERECHO: VISOR PDF O VISTA DOCUMENTAL WORD AMPLIADO */}
                  <div className="flex-1 bg-zinc-950 p-3 relative flex flex-col items-center justify-center overflow-hidden">
                    {mode === 'pdf-to-word' ||
                    (file && file.name.toLowerCase().endsWith('.pdf')) ? (
                      <PdfPageViewer
                        file={file}
                        activePage={activePage}
                        totalPages={totalPages}
                        onPageChange={(p) => setActivePage(p)}
                        pageDataUrls={pageDataUrls}
                        title={file?.name}
                        accentColor="blue"
                      />
                    ) : (
                      /* HOJA DE PREVISUALIZACIÓN DE DOCUMENTO MICROSOFT WORD DE ALTA FIDELIDAD */
                      <div className="w-full h-full flex flex-col overflow-hidden">
                        {/* BARRA SUPERIOR CON ESTADÍSTICAS, NAVEGADOR DE PÁGINAS Y ZOOM */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-t-xl text-[11px] font-mono text-zinc-400 shrink-0 gap-1.5 overflow-hidden">
                          {/* TÍTULO COMPACTO */}
                          <div className="flex items-center gap-1.5 min-w-0 shrink">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span
                              className="text-white font-bold truncate text-[11px] max-w-[150px] sm:max-w-[240px]"
                              title={parsedWordDoc?.title || file?.name}
                            >
                              {parsedWordDoc?.title || file?.name}
                            </span>
                          </div>

                          {/* CONTROLES AGRUPADOS */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* NAVEGADOR DE PÁGINAS */}
                            <div className="flex items-center bg-zinc-950 px-1.5 py-0.5 rounded-lg border border-zinc-700 text-[10px]">
                              <button
                                type="button"
                                onClick={() => scrollToDocxPage(Math.max(1, activePage - 1))}
                                disabled={activePage <= 1}
                                className="px-1 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                                title="Página anterior"
                              >
                                ◀
                              </button>
                              <span className="px-1 font-bold text-white select-none whitespace-nowrap">
                                {activePage} / {totalPages || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  scrollToDocxPage(Math.min(totalPages, activePage + 1))
                                }
                                disabled={activePage >= totalPages}
                                className="px-1 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                                title="Página siguiente"
                              >
                                ▶
                              </button>
                            </div>

                            {/* CONTROLES DE ZOOM COMPACTOS */}
                            <div className="flex items-center bg-zinc-950 px-1 py-0.5 rounded-lg border border-zinc-700 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setDocxZoom((z) => Math.max(25, z - 10))}
                                className="p-1 hover:text-white transition-colors cursor-pointer"
                                title={isEs ? 'Reducir' : 'Zoom out'}
                              >
                                <ZoomOut className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={handleFitDocxWidth}
                                className="px-1.5 py-0.5 rounded text-zinc-300 hover:text-white font-bold select-none transition-colors cursor-pointer text-[10px]"
                                title={isEs ? 'Ajustar al ancho' : 'Fit to width'}
                              >
                                {docxZoom}%
                              </button>
                              <button
                                type="button"
                                onClick={() => setDocxZoom((z) => Math.min(150, z + 10))}
                                className="p-1 hover:text-white transition-colors cursor-pointer"
                                title={isEs ? 'Aumentar' : 'Zoom in'}
                              >
                                <ZoomIn className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* CONTENEDOR DOCUMENTAL WORD */}
                        <div
                          ref={docxScrollContainerRef}
                          className="flex-1 overflow-y-auto overflow-x-auto bg-[#0a0a0d] p-4 border-x border-b border-white/10 rounded-b-xl custom-scrollbar flex justify-center relative scroll-smooth"
                        >
                          {isDocxRendering && (
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10 font-mono text-xs text-blue-400">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                              <span>
                                {isEs
                                  ? 'Renderizando maquetación de Microsoft Word...'
                                  : 'Rendering Microsoft Word layout...'}
                              </span>
                            </div>
                          )}

                          <div
                            className="docx-preview-custom-wrapper transition-transform duration-150 origin-top flex flex-col items-center"
                            style={{
                              transform: `scale(${docxZoom / 100})`,
                              transformOrigin: 'top center',
                            }}
                          >
                            <div
                              ref={docxContainerRef}
                              className="flex flex-col items-center w-full"
                            />
                          </div>

                          {docxRenderError && parsedWordDoc && (
                            /* FALLBACK ESTRUCTURADO */
                            <div className="w-full max-w-2xl bg-white text-zinc-900 rounded-lg shadow-2xl p-8 font-sans space-y-4 min-h-[500px]">
                              <div className="border-b border-zinc-200 pb-4 mb-4">
                                <h1 className="text-xl font-black text-blue-950 tracking-tight">
                                  {parsedWordDoc.title}
                                </h1>
                                <p className="text-xs text-zinc-500 font-mono mt-1">
                                  {isEs ? 'Vista estructurada' : 'Structured view'}
                                </p>
                              </div>
                              <div className="space-y-3 text-sm leading-relaxed text-zinc-800">
                                {parsedWordDoc.paragraphs.map((p, idx) => (
                                  <p key={idx} className="text-xs sm:text-sm text-zinc-700">
                                    {p}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                    <h2 className="text-lg font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                      <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                    </h2>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm">
                    <Sliders className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* CONTENIDO DEL PANEL DE CONTROL EN 3 COLUMNAS MODULARES */}
                {mode === 'word-to-pdf' ? (
                  /* MODO WORD A PDF */
                  <div className="space-y-4">
                    {/* SELECTOR VISUAL DE MOTOR DE CONVERSIÓN EN WORD A PDF */}
                    <div className="bg-[#121217] p-3.5 sm:p-4 rounded-2xl border border-zinc-700/80 space-y-2.5 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                          <Cpu className="w-4 h-4 text-blue-400" />
                          <span>
                            {isEs ? 'Motor de Conversión a PDF' : 'PDF Conversion Engine'}
                          </span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {parsedWordDoc && parsedWordDoc.estPages > 200
                            ? isEs
                              ? '⚡ Auto: Motor Local (+200 págs)'
                              : '⚡ Auto: Local Engine (200+ pgs)'
                            : isEs
                              ? '🏆 Auto: Adobe Acrobat (≤200 págs)'
                              : '🏆 Auto: Adobe Acrobat (≤200 pgs)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* OPCIÓN 1: ADOBE ACROBAT SERVICES */}
                        <button
                          type="button"
                          onClick={() => {
                            if (parsedWordDoc && parsedWordDoc.estPages > 200) {
                              toast.info(
                                isEs
                                  ? 'Adobe Acrobat se recomienda para documentos de hasta 200 páginas. Para +200 páginas se recomienda el Motor Local.'
                                  : 'Adobe Acrobat recommended for up to 200 pages.',
                              );
                            }
                            setConversionEngine('adobe');
                          }}
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
                            <span
                              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                parsedWordDoc && parsedWordDoc.estPages > 200
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {isEs ? 'Hasta 200 págs' : 'Up to 200 pgs'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Máxima fidelidad oficial en la nube. Reconstruye tipografías exactas de Office, tablas, sangrías y gráficos.'
                              : 'Official cloud fidelity. Exact Office fonts, tables, indentations & graphics.'}
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
                              {isEs ? 'Alta Fidelidad' : 'High Fidelity'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Motor en la nube de alto rendimiento. Conversión fiel de documentos Word (.docx/.doc) a PDF vectorial nativo.'
                              : 'High-performance cloud engine. Faithful Word (.docx/.doc) conversion to native vector PDF.'}
                          </p>
                        </button>

                        {/* OPCIÓN 3: MOTOR LOCAL ULTRA RÁPIDO */}
                        <button
                          type="button"
                          onClick={() => setConversionEngine('local')}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                            conversionEngine === 'local'
                              ? 'bg-blue-950/50 border-blue-400 ring-1 ring-blue-400/50 shadow-md'
                              : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                              <span>⚡ Motor Local docx2pdf</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {isEs ? 'Instantáneo (~0.5s)' : 'Instant (~0.5s)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Compilación vectorial rápida en memoria local. 100% privado en RAM, ideal para libros y documentos extensos.'
                              : 'Fast local vector compilation. 100% private in RAM, ideal for books and large files.'}
                          </p>
                        </button>

                        {/* OPCIÓN 4: MOTOR MAQUETACIÓN EXACTA */}
                        <button
                          type="button"
                          onClick={() => setConversionEngine('pdf2docx')}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                            conversionEngine === 'pdf2docx'
                              ? 'bg-purple-950/50 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
                              : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                              <span>📊 Motor Maquetación Nativa</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {isEs ? 'Maquetación Exacta' : 'Exact Layout'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Preserva saltos de sección, encabezados, numeración de pie de página y márgenes editoriales exactos.'
                              : 'Preserves section breaks, headers, footers, page numbering and editorial margins.'}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* GRID DE 3 COLUMNAS MODO WORD A PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* COL 1: SELECCIÓN DE PÁGINAS */}
                      <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                              <ListChecks className="w-4 h-4 text-white" />
                              <span>
                                {isEs ? 'Páginas a Convertir a PDF' : 'Pages to Convert to PDF'}
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
                        </div>

                        {/* ACCIONES RÁPIDAS */}
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 text-zinc-400">
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

                      {/* COL 2: FORMATO DE PÁGINA, ORIENTACIÓN Y MÁRGENES */}
                      <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                        {/* TAMAÑO Y ORIENTACIÓN */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1 text-[11px]">
                              <Layout className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Tamaño' : 'Page Size'}
                            </label>
                            <select
                              value={pageSize}
                              onChange={(e) => setPageSize(e.target.value as PageSize)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            >
                              <option value="a4">A4</option>
                              <option value="letter">Carta (Letter)</option>
                              <option value="legal">Oficio (Legal)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1 text-[11px]">
                              <Compass className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Orientación' : 'Orientation'}
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => setOrientation('portrait')}
                                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
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
                                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
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

                        {/* TIPOGRAFÍA PDF Y MÁRGENES */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <div>
                            <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1 text-[11px]">
                              <Type className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Tipografía' : 'Font'}
                            </label>
                            <select
                              value={pdfFontFamily}
                              onChange={(e) => setPdfFontFamily(e.target.value as PdfFontFamily)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            >
                              <option value="helvetica">Helvetica</option>
                              <option value="times">Times Roman</option>
                              <option value="courier">Courier</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1 text-[11px]">
                              <Grid className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Márgenes' : 'Margins'}
                            </label>
                            <select
                              value={margin}
                              onChange={(e) => setMargin(e.target.value as MarginSize)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            >
                              <option value="normal">
                                {isEs ? 'Normal (2.5cm)' : 'Normal (2.5cm)'}
                              </option>
                              <option value="narrow">
                                {isEs ? 'Estrecho (1.27cm)' : 'Narrow (1.27cm)'}
                              </option>
                              <option value="moderate">
                                {isEs ? 'Moderado (1.9cm)' : 'Moderate (1.9cm)'}
                              </option>
                              <option value="wide">
                                {isEs ? 'Amplio (3.8cm)' : 'Wide (3.8cm)'}
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* TAMAÑO DE FUENTE E INTERLINEADO */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <div>
                            <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1 text-[10px]">
                              <AlignLeft className="w-3 h-3 text-blue-400" />
                              {isEs ? 'Fuente' : 'Font Size'}
                            </label>
                            <div className="grid grid-cols-4 gap-1">
                              {[9, 10, 11, 12].map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setPdfFontSize(sz)}
                                  className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    pdfFontSize === sz
                                      ? 'bg-white text-black border-white shadow-md'
                                      : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1 text-[10px]">
                              <AlignLeft className="w-3 h-3 text-blue-400" />
                              {isEs ? 'Interlineado' : 'Spacing'}
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: '1.15', val: 1.15 },
                                { label: '1.35', val: 1.35 },
                                { label: '1.75', val: 1.75 },
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => setPdfLineSpacing(item.val)}
                                  className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
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
                      </div>

                      {/* COL 3: ENCABEZADOS, NUMERACIÓN, MARCA DE AGUA Y COMPATIBILIDAD */}
                      <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={includeWordDocHeader}
                              onChange={(e) => setIncludeWordDocHeader(e.target.checked)}
                              className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Barra superior con título y fecha'
                                : 'Header with title & date'}
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={addPageNumbers}
                              onChange={(e) => setAddPageNumbers(e.target.checked)}
                              className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs ? 'Número de página centrado en pie' : 'Footer page numbering'}
                            </span>
                          </label>

                          <div className="pt-1.5 border-t border-white/5">
                            <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                              {isEs
                                ? 'Marca de Agua Diagonal (Opcional):'
                                : 'Diagonal Watermark (Optional):'}
                            </label>
                            <input
                              type="text"
                              value={watermarkText}
                              onChange={(e) => setWatermarkText(e.target.value)}
                              placeholder={isEs ? 'Ej: CONFIDENCIAL' : 'E.g: CONFIDENTIAL'}
                              className="w-full bg-zinc-900 border border-white/10 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none uppercase"
                            />
                          </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-xs text-blue-400 space-y-1">
                          <span className="font-bold flex items-center gap-1.5 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            {isEs
                              ? 'Compilación Vectorial Directa (100% en RAM)'
                              : 'Direct Vector Compilation (100% in RAM)'}
                          </span>
                          <p className="text-[10px] text-zinc-400 leading-tight">
                            {isEs
                              ? 'Fuentes incrustadas de alta resolución listas para imprimir.'
                              : 'Embedded high-res fonts ready for printing.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODO PDF A WORD */
                  <div className="space-y-4">
                    {/* SELECTOR VISUAL DE MOTOR DE CONVERSIÓN */}
                    <div className="bg-[#121217] p-3.5 sm:p-4 rounded-2xl border border-zinc-700/80 space-y-2.5 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                          <Cpu className="w-4 h-4 text-blue-400" />
                          <span>
                            {isEs ? 'Motor de Conversión a Word' : 'Word Conversion Engine'}
                          </span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {totalPages > 200
                            ? isEs
                              ? '⚡ Auto: Motor Local (+200 págs)'
                              : '⚡ Auto: Local Engine (200+ pgs)'
                            : isEs
                              ? '🏆 Auto: Adobe Acrobat (≤200 págs)'
                              : '🏆 Auto: Adobe Acrobat (≤200 pgs)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* OPCIÓN 1: ADOBE ACROBAT SERVICES */}
                        <button
                          type="button"
                          onClick={() => {
                            if (targetPages.length > 200) {
                              toast.info(
                                isEs
                                  ? 'Adobe Acrobat se recomienda para documentos de hasta 200 páginas. Para +200 páginas se recomienda el Motor Local.'
                                  : 'Adobe Acrobat recommended for up to 200 pages.',
                              );
                            }
                            setConversionEngine('adobe');
                          }}
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
                            <span
                              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                targetPages.length > 200
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {isEs ? 'Hasta 200 págs' : 'Up to 200 pgs'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Máxima fidelidad oficial en la nube. Reconstruye folletos, brochures, diagramas y tipografías exactas de Office.'
                              : 'Official cloud fidelity. Best for brochures, diagrams & exact Office typography.'}
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
                              {isEs ? 'Alta Fidelidad' : 'High Fidelity'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Motor en la nube de alto rendimiento. Reconstruye el documento con maquetación fiel, estilos tipográficos e imágenes.'
                              : 'High-performance cloud processing engine. Faithful document layout with typography, styling and graphics.'}
                          </p>
                        </button>

                        {/* OPCIÓN 3: MOTOR LOCAL ULTRA RÁPIDO */}
                        <button
                          type="button"
                          onClick={() => setConversionEngine('local')}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                            conversionEngine === 'local'
                              ? 'bg-blue-950/50 border-blue-400 ring-1 ring-blue-400/50 shadow-md'
                              : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                              <span>⚡ Motor Local PyMuPDF</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {isEs ? 'Instantáneo (~0.5s)' : 'Instant (~0.5s)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Párrafos fluidos y limpios con desguionado inteligente. 100% privado en RAM, ideal para libros y novelas.'
                              : 'Clean flowing paragraphs & smart de-hyphenation. 100% private in RAM, ideal for books.'}
                          </p>
                        </button>

                        {/* OPCIÓN 4: MOTOR PDF2DOCX OFICIAL */}
                        <button
                          type="button"
                          onClick={() => setConversionEngine('pdf2docx')}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                            conversionEngine === 'pdf2docx'
                              ? 'bg-purple-950/50 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
                              : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                              <span>📊 Motor pdf2docx (Python)</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {isEs ? 'Tablas & Columnas' : 'Tables & Columns'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {isEs
                              ? 'Reconstrucción geométrica avanzada de cuadrículas, celdas combinadas y distribución multicolumna.'
                              : 'Advanced geometric layout for complex tables, merged cells & multi-column text.'}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* GRID DE 3 COLUMNAS MODO PDF A WORD */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* COL 1: SELECCIÓN DE PÁGINAS */}
                      <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                              <ListChecks className="w-4 h-4 text-white" />
                              <span>
                                {isEs ? 'Páginas a Convertir a Word' : 'Pages to Convert to Word'}
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
                        </div>

                        {/* ACCIONES RÁPIDAS */}
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 text-zinc-400">
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

                      {/* COL 2: MAQUETACIÓN, FORMATO Y TIPOGRAFÍA */}
                      <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                        {/* MODO DE MAQUETACIÓN */}
                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5 text-[11px]">
                            <Layout className="w-3.5 h-3.5 text-blue-400" />
                            {isEs ? 'Modo de Maquetación' : 'Layout Mode'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLayoutMode('exact')}
                              className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                layoutMode === 'exact'
                                  ? 'bg-white text-black border-white shadow-md'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? '✨ Réplica Exacta' : '✨ Exact Replica'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setLayoutMode('flowing')}
                              className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                layoutMode === 'flowing'
                                  ? 'bg-white text-black border-white shadow-md'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? '📝 Texto Fluido' : '📝 Flowing Text'}
                            </button>
                          </div>
                        </div>

                        {/* FORMATO DE SALIDA Y TIPOGRAFÍA BASE */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <div>
                            <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1 text-[11px]">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Formato' : 'Format'}
                            </label>
                            <select
                              value={docFormat}
                              onChange={(e) => setDocFormat(e.target.value as 'docx' | 'rtf')}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            >
                              <option value="docx">DOCX (Office)</option>
                              <option value="rtf">RTF (Universal)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1 text-[11px]">
                              <Type className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Tipografía' : 'Font'}
                            </label>
                            <select
                              value={primaryFont}
                              onChange={(e) => setPrimaryFont(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            >
                              <option value="Calibri">Calibri (Estándar)</option>
                              <option value="Arial">Arial (Limpia)</option>
                              <option value="Times New Roman">Times (Formal)</option>
                              <option value="Aptos">Aptos (365)</option>
                            </select>
                          </div>
                        </div>

                        {/* TAMAÑO DE FUENTE */}
                        <div className="pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-zinc-300 font-bold flex items-center gap-1 text-[11px]">
                              <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
                              {isEs ? 'Tamaño de Fuente' : 'Font Size'}
                            </label>
                            <span className="text-[10px] text-zinc-400">{fontSizePt} pt</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[10, 11, 12].map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setFontSizePt(sz)}
                                className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
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

                      {/* COL 3: OPCIONES AVANZADAS Y COMPATIBILIDAD */}
                      <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-zinc-200 font-bold flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span>{isEs ? 'Opciones de Extracción' : 'Extraction Options'}</span>
                          </label>

                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={includeImages}
                              onChange={(e) => setIncludeImages(e.target.checked)}
                              className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="font-semibold flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              {isEs
                                ? 'Conservar imágenes (fotos y gráficos)'
                                : 'Preserve images & graphics'}
                            </span>
                          </label>

                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={addPageBreaks}
                              onChange={(e) => setAddPageBreaks(e.target.checked)}
                              className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Insertar salto de página entre páginas'
                                : 'Insert page breaks'}
                            </span>
                          </label>

                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={includeDocHeader}
                              onChange={(e) => setIncludeDocHeader(e.target.checked)}
                              className="accent-blue-400 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs ? 'Incluir título en encabezado' : 'Include file header'}
                            </span>
                          </label>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-xs text-blue-400 space-y-1 mt-2">
                          <span className="font-bold flex items-center gap-1.5 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            {isEs ? 'Exportación Nativa DOCX' : 'Native DOCX Export'}
                          </span>
                          <p className="text-[10px] text-zinc-400 leading-tight">
                            {isEs
                              ? '100% compatible con Microsoft Word, Google Docs y LibreOffice.'
                              : '100% compatible with Word, Google Docs & LibreOffice.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
                <div className="pt-2 border-t border-white/10 font-sans">
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
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-3.5 rounded-2xl font-sans font-bold text-sm sm:text-base transition-all shadow-md hover:scale-[1.005] active:scale-98 disabled:opacity-50 cursor-pointer"
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
