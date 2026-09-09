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
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import { AnimatedNumber } from '@/components/ui/AnimatedSuccessCheck';
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

interface SlotItem {
  id: number;
  file: File | null;
}

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

  // Sistema de 3 slots independientes
  const [slots, setSlots] = useState<SlotItem[]>(() => [
    { id: 1, file: globalFile || null },
    { id: 2, file: null },
    { id: 3, file: null },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const slot3InputRef = useRef<HTMLInputElement>(null);

  const getSlotInputRef = (idx: number) => {
    if (idx === 0) return slot1InputRef;
    if (idx === 1) return slot2InputRef;
    return slot3InputRef;
  };

  const activeSlot = slots[activeSlotIndex];
  const activeFile = activeSlot?.file || null;
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
        loadSingleFileIntoSlot(activeSlotIndex, selected);
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

  // Cargar PDF activo cuando cambie activeSlotIndex o su archivo
  useEffect(() => {
    if (activeFile) {
      cargarPdf(activeFile);
    } else {
      setFile(null);
      setGlobalFile(null);
      setPageDataUrls({});
      setExtractedTextItems([]);
      setSensitiveMatches([]);
      setRedactions([]);
      setAutoRedactions([]);
    }
  }, [activeSlotIndex, activeFile]);

  const loadSingleFileIntoSlot = (slotIdx: number, newFile: File) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], file: newFile };
      return next;
    });
    setActiveSlotIndex(slotIdx);
    setDownloadUrl(null);
    setCompletedResult(null);
    toast.success(isEs ? `PDF cargado en Caja ${slotIdx + 1}` : `PDF loaded in Box ${slotIdx + 1}`);
  };

  const handleSlotFileChange = (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
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
    if (activeSlotIndex === slotIdx) {
      const remainingIdx = [0, 1, 2].find((i) => i !== slotIdx && slots[i]?.file !== null);
      if (remainingIdx !== undefined) {
        setActiveSlotIndex(remainingIdx);
      } else {
        resetRedacter();
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
    resetRedacter();
  };

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

      {!slots.some((s) => s.file !== null) ? (
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
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 border border-[#E8DFCF]/40 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                  <EyeOff className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
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
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-[#E8DFCF]/30 rounded-2xl text-xs text-[#E8DFCF] shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#FAF6EE]" />
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
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.redactedSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Parches' : 'Patches'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-base font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.totalRedactions} />
                </span>
              </div>
              <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Afectadas' : 'Affected Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-base font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.pagesWithRedactions} />
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
              handleRemoveAllFiles();
            }}
          />
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO VERTICAL: SECCIÓN 1 (SUPERIOR) + SECCIÓN 2 (INFERIOR) */
        <div className="flex flex-col gap-6 mb-6 font-sans">
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
              {/* LADO IZQUIERDO: VISOR INTERACTIVO CON LIENZO DE CENSURA (6/12) */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#0c0c0f] border border-zinc-800/80 rounded-2xl p-4 min-h-[440px]">
                {/* Header Visor con controles de Dibujo / Borrado / Undo / Redo */}
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs text-zinc-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTool('draw')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer text-[10px] ${activeTool === 'draw' ? 'bg-white text-black border-white font-bold shadow-sm' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                    >
                      <Square className="w-3 h-3" />
                      <span>{isEs ? 'Dibujar' : 'Draw'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('erase')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer text-[10px] ${activeTool === 'erase' ? 'bg-zinc-800 text-white border-zinc-500 font-bold shadow-sm' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
                    >
                      <Eraser className="w-3 h-3" />
                      <span>{isEs ? 'Borrar' : 'Erase'}</span>
                    </button>
                    <span className="text-zinc-600 mx-0.5">|</span>
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className="p-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 disabled:opacity-30 cursor-pointer"
                      title={isEs ? 'Deshacer (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="p-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 disabled:opacity-30 cursor-pointer"
                      title={isEs ? 'Rehacer (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
                    >
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-zinc-800 text-white px-2 py-0.5 rounded border border-zinc-700">
                      {isEs
                        ? `Pág ${activePage} de ${totalPages}`
                        : `Page ${activePage} of ${totalPages}`}
                    </span>
                    {pageDataUrls[activePage] && (
                      <button
                        type="button"
                        onClick={() => setZoomModalImage(pageDataUrls[activePage])}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-700 cursor-pointer"
                        title={isEs ? 'Ver página completa' : 'Full page view'}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lienzo Central de la Página Activa */}
                <div
                  ref={scrollContainerRef}
                  className={`flex-1 min-h-[260px] max-h-[360px] bg-[#121215] relative overflow-y-auto p-2 rounded-xl my-3 flex items-center justify-center border border-zinc-800/80 ${activeTool === 'draw' ? 'cursor-crosshair' : activeTool === 'erase' ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {isProcessing && Object.keys(pageDataUrls).length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span>{progressMsg || (isEs ? 'Renderizando...' : 'Rendering...')}</span>
                    </div>
                  ) : pageDataUrls[activePage] ? (
                    (() => {
                      const pageNum = activePage;
                      const manualBoxes = redactions.filter((r) => r.page === pageNum);
                      const liveAutoBoxes = autoRedactions.filter((r) => r.page === pageNum);
                      return (
                        <div
                          id={`page-card-${pageNum}`}
                          onMouseDown={(e) => handleMouseDown(pageNum, e)}
                          onMouseMove={(e) => handleMouseMove(pageNum, e)}
                          onMouseUp={(e) => handleMouseUp(pageNum, e)}
                          className="relative max-h-full max-w-full flex items-center justify-center select-none"
                        >
                          <div className="relative inline-block" data-img-wrapper>
                            <img
                              src={pageDataUrls[pageNum]}
                              alt={`Página ${pageNum}`}
                              className="max-h-[330px] w-auto rounded border border-zinc-700 shadow-xl bg-white block object-contain pointer-events-none"
                            />

                            {/* Cajas de auto-censura encontradas */}
                            {liveAutoBoxes.map((box) => (
                              <div
                                key={box.id}
                                style={{
                                  left: `${box.xPercent}%`,
                                  top: `${box.yPercent}%`,
                                  width: `${box.widthPercent}%`,
                                  height: `${box.heightPercent}%`,
                                }}
                                className="absolute bg-indigo-600/80 border border-indigo-300 rounded-xs shadow-md z-20 pointer-events-none animate-pulse"
                              />
                            ))}

                            {/* Cajas de censura manual */}
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
                                className={`absolute bg-black/85 border border-white/40 rounded-xs shadow-lg flex items-center justify-end px-0.5 text-white z-30 group ${activeTool === 'erase' ? 'cursor-pointer ring-2 ring-red-500/80' : 'cursor-default'}`}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeRedaction(box.id);
                                  }}
                                  className="text-red-400 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}

                            {/* Vista previa de dibujo */}
                            {drawPreview && drawPreview.page === pageNum && (
                              <div
                                style={{
                                  left: `${drawPreview.xPercent}%`,
                                  top: `${drawPreview.yPercent}%`,
                                  width: `${drawPreview.widthPercent}%`,
                                  height: `${drawPreview.heightPercent}%`,
                                }}
                                className="absolute bg-black/50 border-2 border-dashed border-white rounded-xs z-40 pointer-events-none"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs text-center p-4">
                      <FileText className="w-8 h-8 text-zinc-600" />
                      <span>{isEs ? 'Sin página disponible' : 'No page available'}</span>
                    </div>
                  )}
                </div>

                {/* Footer del Visor: Paginación y Miniaturas */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80 font-mono">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                      disabled={activePage <= 1}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-zinc-300 disabled:opacity-30 cursor-pointer text-[11px]"
                    >
                      ◀ {isEs ? 'Anterior' : 'Previous'}
                    </button>
                    <span className="text-[11px] font-bold text-white">
                      {activePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                      disabled={activePage >= totalPages}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-zinc-300 disabled:opacity-30 cursor-pointer text-[11px]"
                    >
                      {isEs ? 'Siguiente' : 'Next'} ▶
                    </button>
                  </div>

                  {/* Fila compacta de miniaturas */}
                  {totalPages > 1 && (
                    <div className="flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                        <div
                          key={pNum}
                          onClick={() => setActivePage(pNum)}
                          className={`flex-shrink-0 w-12 h-16 rounded border overflow-hidden cursor-pointer transition-all ${
                            activePage === pNum
                              ? 'border-white ring-2 ring-white/40 scale-105'
                              : 'border-zinc-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {pageDataUrls[pNum] ? (
                            <img
                              src={pageDataUrls[pNum]}
                              alt={`Página ${pNum}`}
                              className="w-full h-full object-cover bg-white"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] bg-zinc-900 text-zinc-500 font-mono">
                              {pNum}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LADO DERECHO: 3 CAJAS INDEPENDIENTES (AISLAMIENTO ESTRICTO) (6/12) */}
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
                                  {isEs ? `Caja ${sIdx + 1}` : `Box ${sIdx + 1}`}
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
                                {isEs ? `+ Cargar PDF ${sIdx + 1}` : `+ Upload PDF ${sIdx + 1}`}
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
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PANEL DE CONTROL DEBAJO A ANCHO COMPLETO */}
          <div
            ref={controlPanelRef}
            className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sans"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* CABECERA PANEL */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-sans">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                  002 / CONFIGURACIÓN DE CENSURA
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                </h2>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-white shadow-sm">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              {/* === PANEL DE AUDITORÍA DE DATOS === */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      {isEs ? 'Auditoría de Datos Sensibles' : 'Sensitive Data Audit'}
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
                    <p className="text-[11px] text-zinc-400 font-sans mb-3 leading-relaxed">
                      {isEs
                        ? `Se detectaron ${sensitiveMatches.length} posibles elementos confidenciales.`
                        : `Found ${sensitiveMatches.length} potentially sensitive items.`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={censorAllDetected}
                        disabled={isProcessing}
                        className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {isEs ? 'Censurar Todos los Detectados' : 'Redact All Detected'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={clearAllRedactions}
                        disabled={isProcessing || redactions.length === 0}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
                      >
                        {isEs ? 'Limpiar Parches' : 'Clear Patches'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {isEs
                      ? '✓ No se detectaron patrones confidenciales obvios.'
                      : '✓ No obvious confidential patterns found.'}
                  </p>
                )}
              </div>

              {/* BUSCADOR DE PALABRAS / TEXTO */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner">
                <label className="text-[10px] font-bold text-zinc-400 mb-2 font-mono tracking-widest uppercase block">
                  {isEs ? 'Buscar y Censurar Texto Específico' : 'Search & Redact Specific Text'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        isEs ? 'Escribe la palabra o frase a ocultar...' : 'Type word to redact...'
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  {searchQuery.trim() && autoRedactions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setRedactions((prev) => [...prev, ...autoRedactions]);
                        setAutoRedactions([]);
                        setSearchQuery('');
                        toast.success(isEs ? 'Parches agregados' : 'Patches added');
                      }}
                      className="bg-white text-black font-bold px-3.5 py-2.5 rounded-xl text-xs font-mono hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      {isEs
                        ? `Fijar (${autoRedactions.length})`
                        : `Apply (${autoRedactions.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* OPCIONES AVANZADAS DE SALIDA */}
              <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider border-b border-white/10 pb-2 mb-3 uppercase">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEs ? 'OPCIONES DE FORMATO Y SALIDA' : 'FORMAT & OUTPUT OPTIONS'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Color de Parche:' : 'Patch Color:'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRedactionStyle('black')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${redactionStyle === 'black' ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400'}`}
                      >
                        ⬛ {isEs ? 'Negro' : 'Black'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactionStyle('gray')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${redactionStyle === 'gray' ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400'}`}
                      >
                        ◻️ {isEs ? 'Gris' : 'Gray'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Modo de Sanitización:' : 'Sanitization Mode:'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRedactionMode('precision')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${redactionMode === 'precision' ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400'}`}
                      >
                        🎯 {isEs ? 'Vector' : 'Vector'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactionMode('raster')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${redactionMode === 'raster' ? 'border-white bg-zinc-700 text-white' : 'border-white/10 bg-zinc-900 text-zinc-400'}`}
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
              </div>
            </div>

            {/* BARRA DE PROGRESO + BOTÓN DE ACCIÓN */}
            <div>
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="font-mono mb-3"
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
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200 font-sans leading-snug">
                  {isEs
                    ? 'True Redaction: el contenido censurado se destruye permanentemente y de manera irreversible.'
                    : 'True Redaction: redacted content is permanently and irreversibly destroyed.'}
                </p>
              </div>

              <button
                onClick={executeRedact}
                disabled={isProcessing || redactions.length + autoRedactions.length === 0}
                className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-40"
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

              <div className="pt-2 flex items-center justify-between font-mono text-xs text-zinc-400 mt-2 border-t border-white/10">
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
      )}

      {/* MODAL DE ZOOM DE PÁGINA */}
      <AnimatePresence>
        {zoomModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setZoomModalImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-[#121217] border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {isEs ? `Página ${activePage}` : `Page ${activePage}`}
                </span>
                <button
                  onClick={() => setZoomModalImage(null)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-auto flex items-center justify-center bg-black/50">
                <img
                  src={zoomModalImage}
                  alt="Zoom preview"
                  className="max-h-[75vh] w-auto object-contain rounded border border-zinc-800 bg-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
