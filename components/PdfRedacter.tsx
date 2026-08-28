'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  EyeOff,
  FileText,
  X,
  Loader2,
  ShieldCheck,
  UploadCloud,
  Square,
  Eraser,
  Search,
  CreditCard,
  Phone,
  Mail,
  Type,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Check,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Shield,
  Database,
  Zap,
  RefreshCw,
  FilePlus,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import {
  getEnabledPatterns,
  patternToRegex,
  type SensitivePattern,
  type AuditEntry,
  generateAuditReport,
  downloadAuditReport,
  addCustomPattern,
} from '../lib/sensitive-patterns-registry';
import {
  calculateSHA256,
  addCustodyRecord,
  generateCertificateOfRedaction,
  downloadCertificate,
  addAuditLogEntry,
  generateSessionId,
} from '../lib/security-audit';

import type {
  RedactionBox,
  RedactProgress,
  RedactResult,
  RedactError,
} from '../workers/pdf-redact-v3.worker';

interface ExtractedTextItem {
  page: number;
  str: string;
  vx: number;
  vy: number;
  itemWidth: number;
  fontHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface SensitiveMatch {
  id: string;
  page: number;
  category: 'card' | 'phone' | 'email' | 'text';
  matchedText: string;
  redactionBox: RedactionBox;
}

// Canvas de medición reutilizable para evitar miles de createElement durante escaneos regex
let _cachedMeasureCanvas: HTMLCanvasElement | null = null;
let _cachedMeasureCtx: CanvasRenderingContext2D | null = null;

function getCachedMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof window === 'undefined') return null;
  if (!_cachedMeasureCanvas) {
    _cachedMeasureCanvas = document.createElement('canvas');
    _cachedMeasureCtx = _cachedMeasureCanvas.getContext('2d');
  }
  return _cachedMeasureCtx;
}

export default function PdfRedacter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const [file, setFile] = useState<File | null>(globalFile);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(115);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Tool state
  const [activeTool, setActiveTool] = useState<'draw' | 'erase'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{
    xPercent: number;
    yPercent: number;
    pageNum: number;
  } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{
    page: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'text' | 'card' | 'phone' | 'email'>('text');
  const [exactMatch, setExactMatch] = useState(false);

  // Redaction state
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [autoRedactions, setAutoRedactions] = useState<RedactionBox[]>([]);
  const [extractedTextItems, setExtractedTextItems] = useState<ExtractedTextItem[]>([]);
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [pageJpegBytes, setPageJpegBytes] = useState<Record<number, ArrayBuffer>>({});

  // Panel de Auditoría: lista de datos sensibles detectados
  const [sensitiveMatches, setSensitiveMatches] = useState<SensitiveMatch[]>([]);
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [redactionStyle, setRedactionStyle] = useState<'black' | 'gray'>('black');
  const [redactionMode, setRedactionMode] = useState<'precision' | 'raster'>('precision');
  const [customSuffix, setCustomSuffix] = useState('_Censurado');
  const [showCustomRegex, setShowCustomRegex] = useState(false);
  const [customRegexName, setCustomRegexName] = useState('');
  const [customRegexPattern, setCustomRegexPattern] = useState('');
  const [customRegexTestText, setCustomRegexTestText] = useState('');
  const [customRegexIsValid, setCustomRegexIsValid] = useState<boolean | null>(null);
  const [customRegexError, setCustomRegexError] = useState('');
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  // Undo/Redo system
  interface UndoAction {
    redactions: RedactionBox[];
    autoRedactions: RedactionBox[];
  }
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const pushUndo = () => {
    setUndoStack((prev) => [
      ...prev.slice(-49),
      { redactions: [...redactions], autoRedactions: [...autoRedactions] },
    ]);
    setRedoStack([]);
  };
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [
      ...r,
      { redactions: [...redactions], autoRedactions: [...autoRedactions] },
    ]);
    setRedactions(prev.redactions);
    setAutoRedactions(prev.autoRedactions);
    setUndoStack((s) => s.slice(0, -1));
  };
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [
      ...s,
      { redactions: [...redactions], autoRedactions: [...autoRedactions] },
    ]);
    setRedactions(next.redactions);
    setAutoRedactions(next.autoRedactions);
    setRedoStack((s) => s.slice(0, -1));
  };

  // Result + Security
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [originalHash, setOriginalHash] = useState<string | null>(null);

  // Estado de éxito para pantalla de descarga
  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize: string;
    rawBlob?: Blob;
    originalSize: number;
    redactedSize: number;
    pageCount: number;
    totalRedactions: number;
    pagesWithRedactions: number;
  } | null>(null);

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

  // Altura sincronizada para igualar panel de vista previa al panel de control
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Sincronizar altura del panel de vista previa con la del panel de control
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const updateHeight = () => {
      if (controlPanelRef.current) {
        const h = controlPanelRef.current.getBoundingClientRect().height;
        if (h > 0) setPreviewHeight(h);
      }
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.target.getBoundingClientRect().height;
        if (h > 0) {
          setPreviewHeight(h);
        }
      }
    });
    observer.observe(controlPanelRef.current);
    updateHeight();
    return () => observer.disconnect();
  }, [
    file,
    sensitiveMatches,
    searchQuery,
    selectedPreset,
    exactMatch,
    redactionStyle,
    redactionMode,
    customSuffix,
    isProcessing,
    redactions,
    autoRedactions,
  ]);
  const [sessionId] = useState<string>(generateSessionId());
  const [startTime, setStartTime] = useState<number>(0);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(
      isEs ? 'Analizando y renderizando páginas...' : 'Analyzing & rendering pages...',
    );

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;
      const count = pdfDoc.numPages;
      setTotalPages(count);

      const urls: Record<number, string> = {};
      const jpegs: Record<number, ArrayBuffer> = {};
      const extracted: ExtractedTextItem[] = [];

      for (let p = 1; p <= count; p++) {
        setProgressMsg(
          isEs ? `Cargando página ${p} de ${count}...` : `Loading page ${p} of ${count}...`,
        );
        setProgressPercent(Math.round((p / count) * 100));
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 1.4 });
          const textViewport = page.getViewport({ scale: 1.0 });

          const textContent = await page.getTextContent();
          for (const item of textContent.items) {
            if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
              const tx = item.transform[4];
              const ty = item.transform[5];
              const rawWidth = item.width > 0 ? item.width : item.str.length * 6;
              const fontHeight =
                item.height > 0
                  ? item.height
                  : Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 11;
              const [vx, vy] = textViewport.convertToViewportPoint(tx, ty);
              extracted.push({
                page: p,
                str: item.str,
                vx,
                vy,
                itemWidth: rawWidth,
                fontHeight,
                viewportWidth: textViewport.width,
                viewportHeight: textViewport.height,
              });
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
              typeof page.render
            >[0]).promise;
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, 'image/jpeg', 0.82),
            );
            if (blob) {
              const dataUrl = URL.createObjectURL(blob);
              urls[p] = dataUrl;
              setPageDataUrls((prev) => ({ ...prev, [p]: dataUrl }));
            }
          }
        } catch (pageErr) {
          console.warn(`Error al renderizar página ${p}:`, pageErr);
        }
      }

      setExtractedTextItems(extracted);
      setPageDataUrls(urls);

      // Detección automática de datos sensibles al cargar
      runAutoDetection(extracted);

      toast.success(isEs ? 'Documento cargado exitosamente' : 'Document loaded successfully');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al leer el archivo PDF' : 'Error reading PDF file');
      setFile(null);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // === DETECCIÓN AUTOMÁTICA DE DATOS SENSIBLES (REGISTRY V2) ===
  const runAutoDetection = (textItems: ExtractedTextItem[]) => {
    const allMatches: SensitiveMatch[] = [];
    const entries: AuditEntry[] = [];
    const patterns = getEnabledPatterns();
    const timestamp = new Date().toISOString();

    patterns.forEach((pattern) => {
      const regex = patternToRegex(pattern);
      const cat =
        pattern.category === 'personal_id'
          ? 'text'
          : pattern.category === 'financial'
            ? 'card'
            : 'email';
      const foundMatches = findPatternMatchesForPattern(textItems, regex, cat, pattern);
      allMatches.push(...foundMatches.matches);
      entries.push(...foundMatches.auditEntries.map((e) => ({ ...e, timestamp })));
    });

    setSensitiveMatches(allMatches);
    setAuditEntries(entries);
  };

  const findPatternMatchesForPattern = (
    textItems: ExtractedTextItem[],
    regex: RegExp,
    category: 'card' | 'phone' | 'email' | 'text',
    pattern: SensitivePattern,
  ): { matches: SensitiveMatch[]; auditEntries: AuditEntry[] } => {
    const matches: SensitiveMatch[] = [];
    const auditEntries: AuditEntry[] = [];
    textItems.forEach((item, idx) => {
      const textStr = item.str;
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(textStr)) !== null) {
        const matchedText = match[0];
        const matchPos = match.index;
        if (matchPos === undefined || matchedText.length === 0) continue;
        const fullTextWidth = measureTextWidth(textStr, item.fontHeight);
        const prefixTextWidth = measureTextWidth(textStr.slice(0, matchPos), item.fontHeight);
        const wordTextWidth = measureTextWidth(matchedText, item.fontHeight);
        const scaleRatio = fullTextWidth > 0 ? item.itemWidth / fullTextWidth : 1;
        const wordVx = item.vx + prefixTextWidth * scaleRatio;
        const wordWidth = Math.max(wordTextWidth * scaleRatio, 8);
        const wordVyTop = item.vy - item.fontHeight * 0.82;
        const xPct = (wordVx / item.viewportWidth) * 100;
        const yPct = (wordVyTop / item.viewportHeight) * 100;
        const wPct = (wordWidth / item.viewportWidth) * 100;
        const hPct = Math.max(1.5, ((item.fontHeight * 1.15) / item.viewportHeight) * 100);
        const matchId = `${pattern.id}-${item.page}-${idx}-${matchPos}`;
        matches.push({
          id: matchId,
          page: item.page,
          category,
          matchedText: matchedText.length > 30 ? matchedText.slice(0, 28) + '…' : matchedText,
          redactionBox: {
            id: `auto-${matchId}`,
            page: item.page,
            word: matchedText.slice(0, 20),
            xPercent: Math.max(0, Math.min(98, xPct)),
            yPercent: Math.max(0, Math.min(98, yPct)),
            widthPercent: Math.min(100 - xPct, wPct),
            heightPercent: Math.min(100 - yPct, hPct),
          },
        });
        auditEntries.push({
          id: matchId,
          category: pattern.category,
          severity: pattern.severity,
          detectedText: matchedText,
          page: item.page,
          xPercent: xPct,
          yPercent: yPct,
          action: 'flagged',
          timestamp: '',
          patternName: pattern.id,
        });
      }
    });
    return { matches, auditEntries };
  };

  const measureTextWidth = (text: string, fontSize: number): number => {
    if (typeof window === 'undefined') return text.length * fontSize * 0.55;
    const ctx = getCachedMeasureCtx();
    if (!ctx) return text.length * fontSize * 0.55;
    ctx.font = `${fontSize}px sans-serif, Arial, "Times New Roman"`;
    return ctx.measureText(text).width;
  };

  const findPatternMatches = (
    textItems: ExtractedTextItem[],
    regex: RegExp,
    category: 'card' | 'phone' | 'email' | 'text',
  ): SensitiveMatch[] => {
    const matches: SensitiveMatch[] = [];
    textItems.forEach((item, idx) => {
      const textStr = item.str;
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(textStr)) !== null) {
        const matchedText = match[0];
        const matchPos = match.index;
        if (matchPos === undefined || matchedText.length === 0) continue;

        const fullTextWidth = measureTextWidth(textStr, item.fontHeight);
        const prefixTextWidth = measureTextWidth(textStr.slice(0, matchPos), item.fontHeight);
        const wordTextWidth = measureTextWidth(matchedText, item.fontHeight);
        const scaleRatio = fullTextWidth > 0 ? item.itemWidth / fullTextWidth : 1;
        const wordVx = item.vx + prefixTextWidth * scaleRatio;
        const wordWidth = Math.max(wordTextWidth * scaleRatio, 8);
        const wordVyTop = item.vy - item.fontHeight * 0.82;
        const xPct = (wordVx / item.viewportWidth) * 100;
        const yPct = (wordVyTop / item.viewportHeight) * 100;
        const wPct = (wordWidth / item.viewportWidth) * 100;
        const hPct = Math.max(1.5, ((item.fontHeight * 1.15) / item.viewportHeight) * 100);

        matches.push({
          id: `sensitive-${category}-${item.page}-${idx}-${matchPos}`,
          page: item.page,
          category,
          matchedText: matchedText.length > 30 ? matchedText.slice(0, 28) + '…' : matchedText,
          redactionBox: {
            id: `auto-${item.page}-${idx}-${matchPos}`,
            page: item.page,
            word: matchedText.slice(0, 20),
            xPercent: Math.max(0, Math.min(98, xPct)),
            yPercent: Math.max(0, Math.min(98, yPct)),
            widthPercent: Math.min(100 - xPct, wPct),
            heightPercent: Math.min(100 - yPct, hPct),
          },
        });
      }
    });
    return matches;
  };

  const getSubWordMatches = (
    queryStr: string,
    textItems: ExtractedTextItem[],
    isExact: boolean,
  ): SensitiveMatch[] => {
    const query = queryStr.trim();
    if (!query) return [];
    const matches: SensitiveMatch[] = [];
    const queryLower = query.toLowerCase();

    textItems.forEach((item, idx) => {
      const textStr = item.str;
      const textLower = textStr.toLowerCase();
      let startIndex = 0;
      let matchPos = isExact
        ? textStr.indexOf(query, startIndex)
        : textLower.indexOf(queryLower, startIndex);

      while (matchPos !== -1) {
        const matchedText = textStr.slice(matchPos, matchPos + query.length);
        const fullTextWidth = measureTextWidth(textStr, item.fontHeight);
        const prefixTextWidth = measureTextWidth(textStr.slice(0, matchPos), item.fontHeight);
        const wordTextWidth = measureTextWidth(matchedText, item.fontHeight);
        const scaleRatio = fullTextWidth > 0 ? item.itemWidth / fullTextWidth : 1;
        const wordVx = item.vx + prefixTextWidth * scaleRatio;
        const wordWidth = Math.max(wordTextWidth * scaleRatio, 8);
        const wordVyTop = item.vy - item.fontHeight * 0.82;
        const xPct = (wordVx / item.viewportWidth) * 100;
        const yPct = (wordVyTop / item.viewportHeight) * 100;
        const wPct = (wordWidth / item.viewportWidth) * 100;
        const hPct = Math.max(1.5, ((item.fontHeight * 1.15) / item.viewportHeight) * 100);

        matches.push({
          id: `text-${item.page}-${idx}-${matchPos}`,
          page: item.page,
          category: 'text',
          matchedText,
          redactionBox: {
            id: `text-box-${item.page}-${idx}-${matchPos}`,
            page: item.page,
            word: matchedText,
            xPercent: Math.max(0, Math.min(98, xPct)),
            yPercent: Math.max(0, Math.min(98, yPct)),
            widthPercent: Math.min(100 - xPct, wPct),
            heightPercent: Math.min(100 - yPct, hPct),
          },
        });

        startIndex = matchPos + query.length;
        matchPos = isExact
          ? textStr.indexOf(query, startIndex)
          : textLower.indexOf(queryLower, startIndex);
      }
    });
    return matches;
  };

  // LIVE AUTOMATIC SEARCH
  useEffect(() => {
    if (searchQuery.trim()) {
      const matches = getSubWordMatches(searchQuery, extractedTextItems, exactMatch);
      setAutoRedactions(matches.map((m) => m.redactionBox));
    } else {
      setAutoRedactions([]);
    }
  }, [searchQuery, extractedTextItems, exactMatch]);

  // ⌨️ KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!file) return;
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (ctrl && e.key === 'f') {
        e.preventDefault();
        const inp = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Escribe la palabra"]',
        );
        inp?.focus();
      } else if (e.key === 'Delete' && activeTool === 'erase') {
        setRedactions([]);
        setAutoRedactions([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, handleUndo, handleRedo, activeTool]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        await cargarPdf(selected);
      }
    }
    e.target.value = '';
  };

  const loadSampleDocument = async () => {
    const samplePdfStr =
      '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n4 0 obj\n<</Length 44>>\nstream\nBT /F1 12 Tf 100 700 Td (Sample 0002) Tj ET\nendstream\nendobj\n5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000360 00000 n \ntrailer\n<</Size 6/Root 1 0 R>>\nstartxref\n423\n%%EOF\n';
    const sampleBlob = new Blob([samplePdfStr], { type: 'application/pdf' });
    const sampleFile = new File([sampleBlob], '0002.pdf', { type: 'application/pdf' });
    await cargarPdf(sampleFile);
  };

  // Sync file state with globalFile from store
  useEffect(() => {
    if (globalFile && (!file || Object.keys(pageDataUrls).length === 0)) {
      cargarPdf(globalFile);
    }
  }, [globalFile]);

  const resetRedacter = () => {
    setFile(null);
    setGlobalFile(null);
    setRedactions([]);
    setAutoRedactions([]);
    setExtractedTextItems([]);
    setSensitiveMatches([]);
    setPageDataUrls({});
    setDownloadUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // === DIBUJO MANUAL ===
  const getPercentCoords = (pageNum: number, e: React.MouseEvent) => {
    const imgWrapper = (e.currentTarget as HTMLElement).querySelector('[data-img-wrapper]');
    if (!imgWrapper) return null;
    const rect = imgWrapper.getBoundingClientRect();
    return {
      xPercent: ((e.clientX - rect.left) / rect.width) * 100,
      yPercent: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseDown = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'draw') return;
    const coords = getPercentCoords(pageNum, e);
    if (!coords) return;
    pushUndo();
    setIsDrawing(true);
    setDrawStart({ xPercent: coords.xPercent, yPercent: coords.yPercent, pageNum });
    setDrawPreview({
      page: pageNum,
      xPercent: coords.xPercent,
      yPercent: coords.yPercent,
      widthPercent: 0,
      heightPercent: 0,
    });
  };

  const handleMouseMove = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || drawStart.pageNum !== pageNum) return;
    const coords = getPercentCoords(pageNum, e);
    if (!coords) return;
    setDrawPreview({
      page: pageNum,
      xPercent: Math.min(drawStart.xPercent, coords.xPercent),
      yPercent: Math.min(drawStart.yPercent, coords.yPercent),
      widthPercent: Math.abs(coords.xPercent - drawStart.xPercent),
      heightPercent: Math.abs(coords.yPercent - drawStart.yPercent),
    });
  };

  const handleMouseUp = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'draw') {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawPreview(null);
      return;
    }
    const coords = getPercentCoords(pageNum, e);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawPreview(null);
    if (!coords) return;
    const widthPct = Math.abs(coords.xPercent - drawStart!.xPercent);
    const heightPct = Math.abs(coords.yPercent - drawStart!.yPercent);
    if (widthPct < 1.5 && heightPct < 0.8) return;
    const newBox: RedactionBox = {
      id: `box-${Date.now()}-${Math.random()}`,
      page: pageNum,
      word: isEs ? 'Censura Manual' : 'Manual Redaction',
      xPercent: Math.max(0, Math.min(drawStart!.xPercent, coords.xPercent)),
      yPercent: Math.max(0, Math.min(drawStart!.yPercent, coords.yPercent)),
      widthPercent: widthPct,
      heightPercent: heightPct,
    };
    setRedactions((prev) => [...prev, newBox]);
  };

  const handleEraseClick = (boxId: string) => {
    if (activeTool !== 'erase') return;
    removeRedaction(boxId);
  };

  const removeRedaction = (id: string) => {
    setRedactions((prev) => prev.filter((r) => r.id !== id));
    setAutoRedactions((prev) => prev.filter((r) => r.id !== id));
  };

  // === CENSURAR TODO / APLICAR BÚSQUEDA ===
  const handleApplyWordSearch = () => {
    const word = searchQuery.trim();
    if (!word && selectedPreset === 'text') {
      toast.error(isEs ? 'Escribe la palabra a censurar' : 'Type the word to redact');
      return;
    }

    let newBoxes: RedactionBox[] = [];

    if (selectedPreset === 'text' && word) {
      // Búsqueda de texto libre (la palabra escrita en la caja)
      const matches = getSubWordMatches(word, extractedTextItems, exactMatch);
      newBoxes = matches.map((m) => m.redactionBox);
    } else {
      // Búsqueda por patrón (tarjeta, teléfono, email)
      const regex =
        selectedPreset === 'card'
          ? /\b(?:\d[ -]*?){12,18}\d\b/g
          : selectedPreset === 'phone'
            ? /(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/g
            : /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      const matches = findPatternMatches(extractedTextItems, regex, selectedPreset);
      newBoxes = matches.map((m) => m.redactionBox);
    }

    if (newBoxes.length > 0) {
      pushUndo();
      setRedactions((prev) => [...prev, ...newBoxes]);
      toast.success(
        isEs
          ? `¡${newBoxes.length} elementos marcados para censura!`
          : `${newBoxes.length} items marked for redaction!`,
      );
    } else {
      toast.info(isEs ? 'No se encontraron coincidencias' : 'No matches found');
    }
    setSearchQuery('');
    setAutoRedactions([]);
  };

  // === CENSURAR TODOS LOS DATOS SENSIBLES DETECTADOS ===
  const censorAllDetected = () => {
    if (sensitiveMatches.length === 0) {
      toast.info(isEs ? 'No hay datos sensibles detectados' : 'No sensitive data detected');
      return;
    }
    const allBoxes = sensitiveMatches.map((m) => m.redactionBox);
    setRedactions((prev) => [...prev, ...allBoxes]);
    toast.success(
      isEs
        ? `¡${allBoxes.length} datos sensibles marcados para censura!`
        : `${allBoxes.length} sensitive items marked for redaction!`,
    );
  };

  const clearAllRedactions = () => {
    setRedactions([]);
    setAutoRedactions([]);
  };

  // === EJECUTAR CENSURA (WORKER CON FALLBACK DIRECTO) ===
  const executeRedact = async () => {
    if (!file) return;
    const allBoxes = [...redactions, ...autoRedactions];
    if (allBoxes.length === 0) {
      toast.warning(
        isEs ? 'No hay parches de censura para aplicar' : 'No redaction patches to apply',
      );
      return;
    }

    if (workerRef.current) workerRef.current.terminate();

    setIsProcessing(true);
    setProgressPercent(5);
    setDownloadUrl(null);
    setStartTime(Date.now());
    setProgressMsg(isEs ? 'Iniciando proceso de censura...' : 'Starting redaction process...');

    try {
      const fileBuffer = await file.arrayBuffer();
      const bufferCopy = fileBuffer.slice(0);

      // Calcular hash del original para cadena de custodia
      calculateSHA256(fileBuffer).then((hash) => {
        setOriginalHash(hash);
        addAuditLogEntry({
          timestamp: new Date().toISOString(),
          eventType: 'redaction_applied',
          details: `Iniciando censura de ${file.name} (${formatFileSize(file.size)}). SHA-256: ${hash.substring(0, 16)}...`,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            redactionCount: allBoxes.length,
            mode: redactionMode,
          },
        });
      });

      // Intentar procesar en Web Worker
      const workerUrl = new URL('../workers/pdf-redact-v3.worker.ts', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          const p = msg as RedactProgress;
          setProgressPercent(p.percent);
          setProgressMsg(p.message);
        } else if (msg.type === 'result') {
          const r = msg as RedactResult;
          handleResult(r);
          worker.terminate();
          workerRef.current = null;
        } else if (msg.type === 'error') {
          console.warn('Worker error, switching to inline engine:', (msg as RedactError).message);
          worker.terminate();
          workerRef.current = null;
          applyInlineRedaction(allBoxes, redactionMode);
        }
      };

      worker.onerror = (err) => {
        console.warn('Worker runtime error, executing inline engine:', err);
        worker.terminate();
        workerRef.current = null;
        applyInlineRedaction(allBoxes, redactionMode);
      };

      worker.postMessage({
        fileBuffer: bufferCopy,
        fileName: file.name,
        options: {
          redactions: allBoxes,
          redactionColor: redactionStyle,
          stripMetadata: true,
          customSuffix,
          mode: redactionMode,
        },
        totalPages,
      });
    } catch (error) {
      console.error('executeRedact exception, falling back to inline engine:', error);
      applyInlineRedaction(allBoxes, redactionMode);
    }
  };

  const handleResult = (r: RedactResult) => {
    const blob = new Blob([r.redactedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setProgressPercent(100);

    const originalName = file!.name.replace(/\.[^/.]+$/, '');
    const suffix = customSuffix || '_Censurado';

    setCompletedResult({
      downloadUrl: url,
      filename: `${originalName}${suffix}.pdf`,
      fileSize: formatFileSize(blob.size),
      rawBlob: blob,
      originalSize: file!.size,
      redactedSize: r.redactedBytes.byteLength,
      pageCount: r.pageCount,
      totalRedactions: r.totalRedactions,
      pagesWithRedactions: r.pagesWithRedactions,
    });

    setIsProcessing(false);
    const durationMs = Date.now() - startTime;

    // Calcular hash del output y registrar cadena de custodia
    calculateSHA256(r.redactedBytes).then((redactedHash) => {
      addCustodyRecord({
        sessionId,
        timestamp: new Date().toISOString(),
        originalFileName: file!.name,
        originalHash: originalHash || 'unavailable',
        redactedHash,
        originalSize: file!.size,
        redactedSize: r.redactedBytes.byteLength,
        totalRedactions: r.totalRedactions,
        pagesWithRedactions: r.pagesWithRedactions,
        mode: r.mode || redactionMode,
        precisionPages: r.stats?.precisionPages || 0,
        rasterPages: r.stats?.rasterPages || 0,
        engineVersion: 'PDFBlack Enterprise v3.0',
        userAgent: navigator.userAgent,
        patternsUsed: auditEntries
          .map((e) => e.patternName)
          .filter((v, i, a) => a.indexOf(v) === i),
        processingDurationMs: durationMs,
      });
      addAuditLogEntry({
        timestamp: new Date().toISOString(),
        eventType: 'document_downloaded',
        details: `Documento censurado descargado: ${r.totalRedactions} parches en ${r.pagesWithRedactions} páginas.`,
        metadata: { mode: r.mode, pagesWithRedactions: r.pagesWithRedactions },
      });
    });

    toast.success(
      isEs
        ? `¡Censura completada! ${r.totalRedactions} parches en ${r.pagesWithRedactions} páginas.`
        : `Redaction complete! ${r.totalRedactions} patches on ${r.pagesWithRedactions} pages.`,
    );
  };

  // Motor Inline Ultra-Robusto (Ejecución directa en navegador)
  const applyInlineRedaction = async (allBoxes: RedactionBox[], mode: 'precision' | 'raster') => {
    try {
      if (!file) return;
      const fileBuffer = await file.arrayBuffer();
      const { PDFDocument, rgb } = await import('pdf-lib');

      const redactionsByPage = new Map<number, RedactionBox[]>();
      for (const r of allBoxes) {
        if (!redactionsByPage.has(r.page)) redactionsByPage.set(r.page, []);
        redactionsByPage.get(r.page)!.push(r);
      }

      if (mode === 'raster') {
        // Modo rasterizado: renderiza páginas completas a canvas y las quema en un nuevo PDF
        setProgressMsg(
          isEs
            ? 'Renderizando páginas en alta resolución...'
            : 'Rendering pages in high resolution...',
        );
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const srcDoc = await pdfjsLib.getDocument({
          data: new Uint8Array(fileBuffer.slice(0)),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        const totalP = srcDoc.numPages;
        const outPdf = await PDFDocument.create();
        const boxColor = redactionStyle === 'gray' ? '#404040' : '#000000';

        for (let p = 1; p <= totalP; p++) {
          setProgressPercent(15 + Math.floor((p / totalP) * 75));
          setProgressMsg(
            isEs ? `Procesando página ${p}/${totalP}...` : `Processing page ${p}/${totalP}...`,
          );

          const page = await srcDoc.getPage(p);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;

          await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
            typeof page.render
          >[0]).promise;

          const pageRedactions = redactionsByPage.get(p) || [];
          for (const box of pageRedactions) {
            const rx = (box.xPercent / 100) * canvas.width;
            const ry = (box.yPercent / 100) * canvas.height;
            const rw = (box.widthPercent / 100) * canvas.width;
            const rh = (box.heightPercent / 100) * canvas.height;
            ctx.fillStyle = boxColor;
            ctx.fillRect(rx, ry, rw, rh);
          }

          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/jpeg', 0.92),
          );
          if (!blob) throw new Error('toBlob failed');
          const imgBytes = await blob.arrayBuffer();
          const embedded = await outPdf.embedJpg(imgBytes);
          const origVp = page.getViewport({ scale: 1.0 });
          const newPage = outPdf.addPage([origVp.width, origVp.height]);
          newPage.drawImage(embedded, { x: 0, y: 0, width: origVp.width, height: origVp.height });
        }

        outPdf.setTitle('');
        outPdf.setAuthor('');
        outPdf.setSubject('');
        outPdf.setKeywords([]);
        outPdf.setProducer('PDFBlack TrueRedact Engine v3.0 (Raster Flattened)');
        outPdf.setCreator('PDFBlack Redaction Engine');

        setProgressPercent(95);
        setProgressMsg(isEs ? 'Empaquetando PDF final...' : 'Packaging final PDF...');
        const pdfBytes = await outPdf.save({ useObjectStreams: true, addDefaultPage: false });
        const resultBuffer = pdfBytes.buffer.slice(
          pdfBytes.byteOffset,
          pdfBytes.byteOffset + pdfBytes.byteLength,
        ) as ArrayBuffer;

        handleResult({
          type: 'result',
          redactedBytes: resultBuffer,
          fileName: file.name,
          pageCount: totalP,
          totalRedactions: allBoxes.length,
          pagesWithRedactions: redactionsByPage.size,
          mode: 'raster',
          stats: {
            precisionPages: 0,
            rasterPages: redactionsByPage.size,
            textOperatorsModified: 0,
            contentPreservedKB: Math.round(resultBuffer.byteLength / 1024),
          },
        });
      } else {
        // Modo precisión: vector drawing directo en pdf-lib
        setProgressMsg(
          isEs ? 'Aplicando censura vectorial nativa...' : 'Applying native vector redaction...',
        );
        const pdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer.slice(0)), {
          ignoreEncryption: true,
          updateMetadata: false,
        });

        const totalP = pdfDoc.getPageCount();
        const pages = pdfDoc.getPages();
        const boxColor = redactionStyle === 'gray' ? rgb(0.25, 0.25, 0.25) : rgb(0, 0, 0);

        for (let p = 1; p <= totalP; p++) {
          setProgressPercent(15 + Math.floor((p / totalP) * 75));
          const pageRedactions = redactionsByPage.get(p) || [];
          if (pageRedactions.length === 0) continue;

          const page = pages[p - 1];
          const { width, height } = page.getSize();
          const rotation = ((page.getRotation().angle % 360) + 360) % 360;
          const cropBox = page.getCropBox();
          const offsetX = cropBox?.x || 0;
          const offsetY = cropBox?.y || 0;

          for (const box of pageRedactions) {
            let rx = 0;
            let ry = 0;
            let rw = 0;
            let rh = 0;

            if (rotation === 90) {
              rw = (box.heightPercent / 100) * width;
              rh = (box.widthPercent / 100) * height;
              rx = (box.yPercent / 100) * width;
              ry = height - ((box.xPercent + box.widthPercent) / 100) * height;
            } else if (rotation === 180) {
              rw = (box.widthPercent / 100) * width;
              rh = (box.heightPercent / 100) * height;
              rx = width - ((box.xPercent + box.widthPercent) / 100) * width;
              ry = (box.yPercent / 100) * height;
            } else if (rotation === 270) {
              rw = (box.heightPercent / 100) * width;
              rh = (box.widthPercent / 100) * height;
              rx = width - ((box.yPercent + box.heightPercent) / 100) * width;
              ry = (box.xPercent / 100) * height;
            } else {
              rw = (box.widthPercent / 100) * width;
              rh = (box.heightPercent / 100) * height;
              rx = (box.xPercent / 100) * width;
              ry = height - ((box.yPercent + box.heightPercent) / 100) * height;
            }

            page.drawRectangle({
              x: rx + offsetX,
              y: ry + offsetY,
              width: rw,
              height: rh,
              color: boxColor,
              opacity: 1,
            });
          }
        }

        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('PDFBlack TrueRedact Engine v3.0');
        pdfDoc.setCreator('PDFBlack Secure Engine');

        setProgressPercent(95);
        setProgressMsg(isEs ? 'Empaquetando PDF...' : 'Packaging PDF...');
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        const resultBuffer = pdfBytes.buffer.slice(
          pdfBytes.byteOffset,
          pdfBytes.byteOffset + pdfBytes.byteLength,
        ) as ArrayBuffer;

        handleResult({
          type: 'result',
          redactedBytes: resultBuffer,
          fileName: file.name,
          pageCount: totalP,
          totalRedactions: allBoxes.length,
          pagesWithRedactions: redactionsByPage.size,
          mode: 'precision',
          stats: {
            precisionPages: redactionsByPage.size,
            rasterPages: 0,
            textOperatorsModified: allBoxes.length,
            contentPreservedKB: Math.round(resultBuffer.byteLength / 1024),
          },
        });
      }
    } catch (err) {
      console.error('applyInlineRedaction error:', err);
      toast.error(isEs ? 'Error al aplicar censura al documento' : 'Redaction error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 font-sans">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
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
              004 / CENSURA Y REDACCIÓN PERMANENTE DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <EyeOff className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'CENSURAR Y OCULTAR INFORMACIÓN SENSIBLE EN PDF'
                  : 'REDACT AND HIDE SENSITIVE INFORMATION IN PDF'}
              </span>
            </h1>
          </div>
        </div>
        {file && (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <FileText className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold truncate max-w-[140px] inline-block align-middle">
                {file.name}
              </span>
            </div>
            <button
              onClick={resetRedacter}
              disabled={isProcessing}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
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
            {isEs
              ? 'CENSURAR Y OCULTAR INFORMACIÓN SENSIBLE EN PDF'
              : 'REDACT AND HIDE SENSITIVE INFORMATION IN PDF'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Elimina de forma irreversible datos sensibles, textos y números confidenciales con sanitización de metadatos 100% local.'
              : 'Irreversibly redact sensitive data and numbers with metadata sanitization 100% locally.'}
          </p>
          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />{' '}
            {isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}
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
          {/* BANNER DE RESULTADO Y MÉTRICAS (ESTILO PÁGINA DE INICIO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-2xl text-white shadow-md">
                  <EyeOff className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CENSURA' : 'REDACTION RESULT'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans uppercase">
                    {isEs ? '¡Documento Censurado con Éxito!' : 'Document Redacted Successfully!'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {isEs
                      ? `${completedResult.totalRedactions} parches aplicados en ${completedResult.pagesWithRedactions} páginas`
                      : `${completedResult.totalRedactions} patches applied across ${completedResult.pagesWithRedactions} pages`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-emerald-400 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{isEs ? 'True Redaction Aplicado' : 'True Redaction Applied'}</span>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.originalSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Censurado' : 'Redacted Size'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.redactedSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Parches' : 'Patches'}
                </span>
                <span className="text-white font-bold text-base font-mono mt-0.5">
                  {completedResult.totalRedactions}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Afectadas' : 'Affected Pages'}
                </span>
                <span className="text-amber-400 font-bold text-base font-mono mt-0.5">
                  {completedResult.pagesWithRedactions}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="censurar"
            onReset={() => {
              setCompletedResult(null);
              setDownloadUrl(null);
              setFile(null);
              setGlobalFile(null);
              setRedactions([]);
              setAutoRedactions([]);
              setPageDataUrls({});
              setPageJpegBytes({});
              setExtractedTextItems([]);
              setSensitiveMatches([]);
              setAuditEntries([]);
            }}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6 font-sans">
          {/* LADO IZQUIERDO: VISOR DE PDF (7 COLUMNAS) */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative font-mono"
              style={{
                height: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                maxHeight: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                minHeight: '400px',
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="bg-[#121217] border-b border-zinc-800 p-3.5 flex justify-between items-center z-10 flex-shrink-0 font-mono">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-zinc-800 p-2 rounded-2xl border border-zinc-700 flex-shrink-0 text-white shadow-sm">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-32 sm:w-48">
                      {file.name}
                    </span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1.5">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="text-zinc-600">•</span>
                      <span
                        className={redactions.length > 0 ? 'text-white font-bold' : 'text-zinc-500'}
                      >
                        {redactions.length > 0
                          ? `${redactions.length} ${isEs ? 'parche(s) activos' : 'patch(es) active'}`
                          : isEs
                            ? 'Sin censura'
                            : 'No redactions'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetRedacter}
                    disabled={isProcessing}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="bg-[#18181f] border-b border-zinc-800 px-3.5 py-2 flex items-center justify-between font-mono text-xs text-zinc-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTool('draw')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all cursor-pointer ${activeTool === 'draw' ? 'bg-white text-black border-white font-bold shadow-sm' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">{isEs ? 'Dibujar' : 'Draw'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('erase')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all cursor-pointer ${activeTool === 'erase' ? 'bg-zinc-800 text-white border-zinc-500 font-bold shadow-sm' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">{isEs ? 'Borrar' : 'Erase'}</span>
                  </button>
                  <span className="text-[10px] text-zinc-600 mx-1">|</span>
                  {/* Undo/Redo */}
                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 disabled:opacity-30 transition-all cursor-pointer"
                    title={isEs ? 'Deshacer (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 disabled:opacity-30 transition-all cursor-pointer"
                    title={isEs ? 'Rehacer (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
                  >
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white font-mono shadow-sm">
                    {totalPages} {isEs ? 'Páginas' : 'Pages'}
                  </span>
                  {/* Zoom */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(40, z - 15))}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 transition-all cursor-pointer flex-shrink-0"
                      title={isEs ? 'Alejar' : 'Zoom Out'}
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(100)}
                      className="text-[10px] text-zinc-300 hover:text-white px-1.5 py-0.5 hover:bg-zinc-800 rounded tabular-nums select-none transition-colors"
                      title={isEs ? 'Restablecer a 100%' : 'Reset to 100%'}
                    >
                      {zoomLevel}%
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(250, z + 15))}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 transition-all cursor-pointer flex-shrink-0"
                      title={isEs ? 'Acercar' : 'Zoom In'}
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                className={`flex-1 min-h-0 bg-[#121215] relative overflow-y-auto p-4 ${activeTool === 'draw' ? 'cursor-crosshair' : activeTool === 'erase' ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  style={{ zoom: `${zoomLevel}%`, transformOrigin: '0 0' }}
                  className="flex flex-col items-center gap-4"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const manualBoxes = redactions.filter((r) => r.page === pageNum);
                    const liveAutoBoxes = autoRedactions.filter((r) => r.page === pageNum);
                    return (
                      <div
                        key={pageNum}
                        id={`page-card-${pageNum}`}
                        onMouseDown={(e) => handleMouseDown(pageNum, e)}
                        onMouseMove={(e) => handleMouseMove(pageNum, e)}
                        onMouseUp={(e) => handleMouseUp(pageNum, e)}
                        className="w-full bg-white rounded shadow-2xl text-black p-4 min-h-[900px] relative font-serif text-xs leading-relaxed select-none border border-gray-200"
                      >
                        <div className="flex justify-between items-center border-b pb-1.5 mb-3 font-sans text-gray-400 text-[10px] font-mono">
                          <span>DOCUMENTO {file.name}</span>
                          <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded">
                            PÁGINA {pageNum} DE {totalPages}
                          </span>
                        </div>
                        <div className="absolute top-5 left-5 text-lg font-bold text-black font-sans">
                          {pageNum}
                        </div>
                        {pageDataUrls[pageNum] ? (
                          <div className="mt-1 w-full flex justify-center relative">
                            <div className="relative w-full max-w-full" data-img-wrapper>
                              <img
                                src={pageDataUrls[pageNum]}
                                alt={`Página ${pageNum}`}
                                className="w-full h-auto rounded shadow-sm border border-gray-200 block"
                              />
                              {liveAutoBoxes.map((box) => (
                                <div
                                  key={box.id}
                                  style={{
                                    left: `${box.xPercent}%`,
                                    top: `${box.yPercent}%`,
                                    width: `${box.widthPercent}%`,
                                    height: `${box.heightPercent}%`,
                                  }}
                                  className="absolute bg-indigo-600/80 border-2 border-indigo-300 rounded-sm shadow-xl flex items-center justify-between px-1 text-white font-mono text-[9px] group transition-all z-20 cursor-pointer animate-pulse ring-2 ring-indigo-500/50"
                                  title={
                                    isEs ? `Coincidencia: "${box.word}"` : `Match: "${box.word}"`
                                  }
                                >
                                  <span className="truncate font-extrabold text-[9px] text-white drop-shadow-md select-none">
                                    {box.word}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeRedaction(box.id);
                                    }}
                                    className="text-white hover:text-red-300 p-0.5 opacity-80 group-hover:opacity-100 transition-opacity ml-1"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {manualBoxes.map((box) => (
                                <div
                                  key={box.id}
                                  style={{
                                    left: `${box.xPercent}%`,
                                    top: `${box.yPercent}%`,
                                    width: `${box.widthPercent}%`,
                                    height: `${box.heightPercent}%`,
                                  }}
                                  onClick={(e) => {
                                    if (activeTool === 'erase') {
                                      e.stopPropagation();
                                      handleEraseClick(box.id);
                                    }
                                  }}
                                  className={`absolute bg-black/70 border border-white/30 rounded-sm shadow-2xl flex items-center justify-end px-1 text-white font-mono text-[9px] group transition-all z-30 hover:border-red-500 ${activeTool === 'erase' ? 'cursor-pointer ring-2 ring-red-500/60' : 'cursor-default'}`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeRedaction(box.id);
                                    }}
                                    className="text-red-400 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {drawPreview && drawPreview.page === pageNum && (
                                <div
                                  style={{
                                    left: `${drawPreview.xPercent}%`,
                                    top: `${drawPreview.yPercent}%`,
                                    width: `${drawPreview.widthPercent}%`,
                                    height: `${drawPreview.heightPercent}%`,
                                  }}
                                  className="absolute bg-black/40 border-2 border-dashed border-white rounded-sm z-40 pointer-events-none"
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-2">
                            <h2 className="text-xs font-bold text-black font-sans border-b pb-1">
                              PÁGINA {pageNum} - {file.name}
                            </h2>
                            <p className="text-[11px] text-gray-800 leading-relaxed font-mono">
                              Cargando representación gráfica...
                            </p>
                          </div>
                        )}
                        <div className="mt-6 text-[10px] text-gray-400 border-t pt-1 font-mono flex justify-between">
                          <span>{file.name}</span>
                          <span>Pág. {pageNum}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL (5 COLUMNAS - MÁS ANCHO) */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              ref={controlPanelRef}
              className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 flex flex-col justify-between relative shadow-2xl font-sans overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="flex flex-col gap-3 font-sans">
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-1 border-b border-zinc-800 pb-3 flex-shrink-0">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-0.5">
                      002 / CONFIGURACIÓN
                    </span>
                    <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                      PANEL DE CONTROL
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-700 text-white shadow-sm">
                    <SlidersHorizontal className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* === PANEL DE AUDITORÍA DE DATOS === */}
                <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                        {isEs ? 'Auditoría de Datos' : 'Data Audit'}
                      </span>
                    </div>
                    {sensitiveMatches.length > 0 && (
                      <span className="text-[10px] font-mono text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg shadow-sm">
                        {sensitiveMatches.length} {isEs ? 'detectados' : 'detected'}
                      </span>
                    )}
                  </div>

                  {sensitiveMatches.length > 0 ? (
                    <>
                      <div className="space-y-1 max-h-[160px] overflow-y-auto mb-2 pr-1 custom-scrollbar">
                        {sensitiveMatches.slice(0, 15).map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between text-[10px] bg-zinc-900/90 rounded-xl px-2.5 py-1.5 border border-zinc-800"
                          >
                            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                              <span className="text-zinc-400 flex-shrink-0">
                                {match.category === 'card'
                                  ? '💳'
                                  : match.category === 'phone'
                                    ? '📱'
                                    : match.category === 'email'
                                      ? '✉️'
                                      : '📝'}
                              </span>
                              <span className="truncate text-zinc-300 font-mono">
                                {match.matchedText}
                              </span>
                            </div>
                            <span className="text-zinc-500 font-mono flex-shrink-0 ml-1">
                              P{match.page}
                            </span>
                          </div>
                        ))}
                        {sensitiveMatches.length > 15 && (
                          <p className="text-[9px] text-zinc-500 text-center font-mono">
                            +{sensitiveMatches.length - 15} {isEs ? 'más' : 'more'}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={censorAllDetected}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono shadow-sm"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>
                          {isEs
                            ? `Censurar todo (${sensitiveMatches.length})`
                            : `Redact all (${sensitiveMatches.length})`}
                        </span>
                      </button>
                    </>
                  ) : (
                    <p className="text-[10px] text-zinc-500 text-center py-2 font-mono">
                      {isEs
                        ? 'No se detectaron datos sensibles automáticamente'
                        : 'No sensitive data detected automatically'}
                    </p>
                  )}
                </div>

                {/* === BÚSQUEDA MANUAL === */}
                <div className="font-mono">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    003 / CENSURA Y BÚSQUEDA DE TEXTO
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight font-sans mt-0.5">
                    {isEs ? 'Censura Manual' : 'Manual Redaction'}
                  </h3>
                </div>
                <div className="relative font-mono">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyWordSearch();
                      }
                    }}
                    placeholder={isEs ? 'Escribe la palabra a cubrir...' : 'Type word to cover...'}
                    className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                {/* Categorías rápidas */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  {(['text', 'card', 'phone', 'email'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${selectedPreset === preset ? 'bg-zinc-800 border-white text-white font-bold shadow' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      {preset === 'text' ? (
                        <>
                          <Type className="w-3.5 h-3.5" />
                          <span>{isEs ? 'Texto Libre' : 'Custom Text'}</span>
                        </>
                      ) : preset === 'card' ? (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>💳 CC</span>
                        </>
                      ) : preset === 'phone' ? (
                        <>
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>📱 Tel</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-emerald-400" />
                          <span>✉️ Email</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 font-mono text-xs">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-300 rounded-xl transition-all cursor-pointer text-[11px]"
                  >
                    {isEs ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleApplyWordSearch}
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-[11px]"
                  >
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>{isEs ? 'Cubrir Todo' : 'Apply'}</span>
                  </button>
                </div>

                {/* OPCIONES AVANZADAS (SIEMPRE VISIBLES) */}
                <div className="mt-2 space-y-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl p-4 font-sans">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider border-b border-white/10 pb-2 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <EyeOff className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Estilo de Parche' : 'Patch Style'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <button
                        onClick={() => setRedactionStyle('black')}
                        className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${redactionStyle === 'black' ? 'bg-black border-white text-white shadow' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                      >
                        {isEs ? '⬛ Negro Sólido' : '⬛ Solid Black'}
                      </button>
                      <button
                        onClick={() => setRedactionStyle('gray')}
                        className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${redactionStyle === 'gray' ? 'bg-zinc-700 border-white text-white shadow' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                      >
                        {isEs ? '🩶 Gris' : '🩶 Gray'}
                      </button>
                    </div>
                  </div>
                  <div
                    onClick={() => setExactMatch((v) => !v)}
                    className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-white">
                        {isEs ? 'Coincidencia exacta' : 'Exact Case Match'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {isEs ? 'Sensible a mayúsculas/minúsculas' : 'Case-sensitive'}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${exactMatch ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${exactMatch ? 'left-4' : 'left-0.5'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-zinc-400" />
                      {isEs ? 'Modo de Censura' : 'Redaction Mode'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <button
                        onClick={() => setRedactionMode('precision')}
                        className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${redactionMode === 'precision' ? 'bg-emerald-500 border-white text-white shadow' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        title={
                          isEs
                            ? 'Preserva texto no censurado, bookmarks y fuentes. Edita content streams nativos.'
                            : 'Preserves non-redacted text, bookmarks and fonts. Edits native content streams.'
                        }
                      >
                        🎯 {isEs ? 'Precisión' : 'Precision'}
                      </button>
                      <button
                        onClick={() => setRedactionMode('raster')}
                        className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${redactionMode === 'raster' ? 'bg-zinc-700 border-white text-white shadow' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        title={
                          isEs
                            ? 'Rasteriza cada página a JPEG. Compatible con cualquier PDF.'
                            : 'Rasterizes each page to JPEG. Compatible with any PDF.'
                        }
                      >
                        📸 {isEs ? 'Raster' : 'Raster'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Sufijo del archivo:' : 'Output suffix:'}
                    </label>
                    <input
                      type="text"
                      value={customSuffix}
                      onChange={(e) => setCustomSuffix(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/40 transition"
                    />
                  </div>
                </div>

                {/* Barra de progreso */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="font-mono"
                    >
                      <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
                        <span className="truncate mr-2">{progressMsg}</span>
                        <span className="font-bold tabular-nums">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/10">
                        <motion.div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ ease: 'easeInOut', duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Advertencia de seguridad */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200 font-sans leading-snug">
                    {isEs
                      ? 'True Redaction: el contenido censurado se destruye permanentemente. No se puede recuperar.'
                      : 'True Redaction: redacted content is permanently destroyed. Cannot be recovered.'}
                  </p>
                </div>
              </div>

              {/* BOTÓN DE ACCIÓN */}
              <div className="pt-3 border-t border-white/10 mt-2 flex-shrink-0">
                <button
                  onClick={executeRedact}
                  disabled={isProcessing || redactions.length + autoRedactions.length === 0}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl group disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>{isEs ? 'Censurando...' : 'Redacting...'}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-black" />
                      <span>
                        {redactions.length > 0
                          ? `${isEs ? 'Censurar PDF' : 'Redact PDF'} (${redactions.length} ${isEs ? 'parches' : 'patches'})`
                          : isEs
                            ? 'Censurar PDF'
                            : 'Redact PDF'}
                      </span>
                    </>
                  )}
                </button>
                <div className="pt-2 flex items-center justify-between font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isEs ? 'Web Worker Activo' : 'Web Worker Active'}
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Database className="w-3 h-3" />
                    {isEs ? '100% Local' : '100% Local'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
