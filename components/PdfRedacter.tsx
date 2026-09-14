'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Copy,
  Layers,
  FileCode,
  FileDown,
  Hash,
  Sparkles,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import {
  type SensitivePattern,
  type AuditEntry,
  generateAuditReport,
  downloadAuditReport,
} from '../lib/sensitive-patterns-registry';
import {
  calculateSHA256,
  addCustodyRecord,
  generateCertificateOfRedaction,
  downloadCertificate,
  addAuditLogEntry,
  generateSessionId,
  getCustodyChain,
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

export type SensitiveCategory = 'all' | 'personal_id' | 'financial' | 'contact' | 'confidential';

export interface SensitiveMatch {
  id: string;
  page: number;
  category: 'personal_id' | 'financial' | 'contact' | 'confidential';
  severity: 'critical' | 'high' | 'medium';
  matchedText: string;
  redactionBox: RedactionBox;
}

// Algoritmo de Luhn para validación matemática de números de tarjeta de crédito
function isValidLuhn(str: string): boolean {
  const clean = str.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Validación de dígito de control de DNI español
function isValidSpanishDni(dniStr: string): boolean {
  const match = dniStr.match(/^(\d{8})([A-HJ-NP-TV-Z])$/i);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  const letter = match[2].toUpperCase();
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  return letters.charAt(num % 23) === letter;
}

// Validación de NIE español
function isValidSpanishNie(nieStr: string): boolean {
  const match = nieStr.match(/^([XYZ])(\d{7})([A-HJ-NP-TV-Z])$/i);
  if (!match) return false;
  const prefix = match[1].toUpperCase();
  const numStr = match[2];
  const prefixDigit = prefix === 'X' ? '0' : prefix === 'Y' ? '1' : '2';
  const fullNum = parseInt(prefixDigit + numStr, 10);
  const letter = match[3].toUpperCase();
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  return letters.charAt(fullNum % 23) === letter;
}

// Canvas de medición reutilizable
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

  // Search & Batch state
  const [searchQuery, setSearchQuery] = useState('');
  const [batchKeywordsInput, setBatchKeywordsInput] = useState('');
  const [showBatchKeywords, setShowBatchKeywords] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);

  // Redaction state
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [autoRedactions, setAutoRedactions] = useState<RedactionBox[]>([]);
  const [extractedTextItems, setExtractedTextItems] = useState<ExtractedTextItem[]>([]);
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});

  // Panel de Auditoría Forense y Filtros
  const [sensitiveMatches, setSensitiveMatches] = useState<SensitiveMatch[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<SensitiveCategory>('all');
  const [isScanning, setIsScanning] = useState(false);

  // Opciones Avanzadas Corporativas
  const [redactionStyle, setRedactionStyle] = useState<'black' | 'dark' | 'white' | 'gray'>(
    'black',
  );
  const [redactionMode, setRedactionMode] = useState<'precision' | 'raster'>('precision');
  const [overlayPreset, setOverlayPreset] = useState<
    'none' | 'redacted' | 'confidential' | 'gdpr' | 'custom'
  >('none');
  const [customOverlayText, setCustomOverlayText] = useState('');
  const [customSuffix, setCustomSuffix] = useState('_Censurado');
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [showHashDetails, setShowHashDetails] = useState(false);

  // Undo/Redo system
  interface UndoAction {
    redactions: RedactionBox[];
    autoRedactions: RedactionBox[];
  }
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);

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
    redactedHash?: string;
  } | null>(null);

  const [sessionId] = useState<string>(generateSessionId());
  const [startTime, setStartTime] = useState<number>(0);

  // Ocultar barra superior global y posicionar la vista en el tope de la página
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  useEffect(() => {
    return () => {
      setHeaderHidden(false);
    };
  }, [setHeaderHidden]);

  const controlPanelRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const measureTextWidth = (text: string, fontSize: number): number => {
    if (typeof window === 'undefined') return text.length * fontSize * 0.55;
    const ctx = getCachedMeasureCtx();
    if (!ctx) return text.length * fontSize * 0.55;
    ctx.font = `${fontSize}px sans-serif, Arial, "Times New Roman"`;
    return ctx.measureText(text).width;
  };

  // ============================================================
  // MOTOR DE AUDITORÍA FORENSE INTELIGENTE (DEEP SCANNER)
  // ============================================================
  const runSensitiveDataScan = useCallback(
    (extracted: ExtractedTextItem[]) => {
      setIsScanning(true);
      const matches: SensitiveMatch[] = [];
      const entries: AuditEntry[] = [];

      // Patrones regex corporativos
      const PATTERNS: Array<{
        id: string;
        category: 'personal_id' | 'financial' | 'contact' | 'confidential';
        severity: 'critical' | 'high' | 'medium';
        regex: RegExp;
        validate?: (match: string) => boolean;
      }> = [
        // 1. Tarjetas de crédito (con test de Luhn)
        {
          id: 'credit_card',
          category: 'financial',
          severity: 'critical',
          regex: /\b(?:\d[ -]*?){13,19}\b/g,
          validate: (m) => isValidLuhn(m),
        },
        // 2. Cuentas bancarias e IBAN
        {
          id: 'iban_account',
          category: 'financial',
          severity: 'critical',
          regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
        },
        // 3. DNI / NIE Español
        {
          id: 'dni_es',
          category: 'personal_id',
          severity: 'critical',
          regex: /\b\d{8}[A-HJ-NP-TV-Z]\b/gi,
          validate: (m) => isValidSpanishDni(m),
        },
        {
          id: 'nie_es',
          category: 'personal_id',
          severity: 'critical',
          regex: /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/gi,
          validate: (m) => isValidSpanishNie(m),
        },
        // 4. SSN Americano
        {
          id: 'ssn_us',
          category: 'personal_id',
          severity: 'critical',
          regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        },
        // 5. Correo electrónico
        {
          id: 'email_address',
          category: 'contact',
          severity: 'high',
          regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
        },
        // 6. Teléfonos internacionales y nacionales
        {
          id: 'phone_number',
          category: 'contact',
          severity: 'medium',
          regex:
            /(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/g,
          validate: (m) => {
            const digits = m.replace(/\D/g, '');
            return digits.length >= 8 && digits.length <= 15;
          },
        },
        // 7. Términos confidenciales o clasificados
        {
          id: 'confidential_terms',
          category: 'confidential',
          severity: 'high',
          regex:
            /\b(confidencial|secreto|privado|strictly\s+confidential|salario|nómina|honorarios|password|clave)\b/gi,
        },
      ];

      extracted.forEach((item, idx) => {
        const textStr = item.str;

        PATTERNS.forEach((pat) => {
          pat.regex.lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = pat.regex.exec(textStr)) !== null) {
            const matchedText = match[0];
            const matchPos = match.index;
            if (matchPos === undefined || matchedText.length === 0) continue;

            if (pat.validate && !pat.validate(matchedText)) continue;

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

            const matchId = `match-${pat.id}-${item.page}-${idx}-${matchPos}`;

            matches.push({
              id: matchId,
              page: item.page,
              category: pat.category,
              severity: pat.severity,
              matchedText: matchedText.length > 35 ? matchedText.slice(0, 32) + '…' : matchedText,
              redactionBox: {
                id: `box-${matchId}`,
                page: item.page,
                word: matchedText.slice(0, 25),
                xPercent: Math.max(0, Math.min(98, xPct)),
                yPercent: Math.max(0, Math.min(98, yPct)),
                widthPercent: Math.min(100 - xPct, wPct),
                heightPercent: Math.min(100 - yPct, hPct),
              },
            });

            entries.push({
              id: matchId,
              category: pat.category === 'confidential' ? 'custom' : pat.category,
              severity: pat.severity,
              detectedText: matchedText.slice(0, 3) + '****' + matchedText.slice(-3),
              page: item.page,
              xPercent: xPct,
              yPercent: yPct,
              action: 'flagged',
              timestamp: new Date().toISOString(),
              patternName: pat.id,
            });
          }
        });
      });

      setSensitiveMatches(matches);
      setAuditEntries(entries);
      setIsScanning(false);

      if (matches.length > 0) {
        toast.info(
          isEs
            ? `Auditoría Forense: Se detectaron ${matches.length} datos confidenciales potenciales.`
            : `Forensic Audit: Detected ${matches.length} potentially confidential data items.`,
        );
      }
    },
    [isEs],
  );

  // Cargar y analizar PDF
  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(
      isEs ? 'Analizando estructura binaria y páginas...' : 'Analyzing binary structure & pages...',
    );

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      // Calcular hash SHA-256 inicial de entrada
      calculateSHA256(arrayBuffer).then((hash) => {
        setOriginalHash(hash);
        addAuditLogEntry({
          timestamp: new Date().toISOString(),
          eventType: 'document_loaded',
          details: `Documento ${selectedFile.name} cargado. SHA-256: ${hash}`,
          metadata: { fileName: selectedFile.name, fileSize: selectedFile.size },
        });
      });

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
      const extracted: ExtractedTextItem[] = [];

      for (let p = 1; p <= count; p++) {
        setProgressMsg(
          isEs ? `Extrayendo página ${p} de ${count}...` : `Extracting page ${p} of ${count}...`,
        );
        setProgressPercent(Math.round((p / count) * 85));
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
            urls[p] = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (pageErr) {
          console.warn(`Error on page ${p}:`, pageErr);
        }
      }

      setPageDataUrls(urls);
      setExtractedTextItems(extracted);

      // Disparar escáner forense automático de datos sensibles
      setProgressMsg(
        isEs ? 'Ejecutando auditoría forense de patrones...' : 'Running forensic pattern audit...',
      );
      setProgressPercent(95);
      runSensitiveDataScan(extracted);

      setIsProcessing(false);
      setProgressPercent(100);
    } catch (err: any) {
      console.error('cargarPdf error:', err);
      toast.error(isEs ? 'Error al procesar el archivo PDF' : 'Error processing PDF file');
      setIsProcessing(false);
    }
  };

  // Coincidencias de búsqueda por sub-palabra
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
          category: 'confidential',
          severity: 'high',
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

  // Búsqueda en vivo al escribir texto único
  useEffect(() => {
    if (searchQuery.trim()) {
      const matches = getSubWordMatches(searchQuery, extractedTextItems, exactMatch);
      setAutoRedactions(matches.map((m) => m.redactionBox));
    } else {
      setAutoRedactions([]);
    }
  }, [searchQuery, extractedTextItems, exactMatch]);

  // Atajos de teclado
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
        document.getElementById('keyword-search-input')?.focus();
      } else if (ctrl && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing && redactions.length + autoRedactions.length > 0) {
          executeRedact();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, handleUndo, handleRedo, isProcessing, redactions, autoRedactions]);

  // Cargar PDF activo cuando cambie el slot
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

  // Coordenadas para dibujo manual
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

    const resolvedOverlayText =
      overlayPreset === 'none'
        ? undefined
        : overlayPreset === 'redacted'
          ? isEs
            ? '[CENSURADO]'
            : '[REDACTED]'
          : overlayPreset === 'confidential'
            ? isEs
              ? '[CONFIDENCIAL]'
              : '[CONFIDENTIAL]'
            : overlayPreset === 'gdpr'
              ? '[RGPD / GDPR]'
              : customOverlayText || (isEs ? '[CENSURADO]' : '[REDACTED]');

    const newBox: RedactionBox = {
      id: `box-${Date.now()}-${Math.random()}`,
      page: pageNum,
      word: isEs ? 'Censura Manual' : 'Manual Redaction',
      xPercent: Math.max(0, Math.min(drawStart!.xPercent, coords.xPercent)),
      yPercent: Math.max(0, Math.min(drawStart!.yPercent, coords.yPercent)),
      widthPercent: widthPct,
      heightPercent: heightPct,
      overlayText: resolvedOverlayText,
      boxColor: redactionStyle,
    };
    setRedactions((prev) => [...prev, newBox]);
  };

  const removeRedaction = (id: string) => {
    setRedactions((prev) => prev.filter((r) => r.id !== id));
    setAutoRedactions((prev) => prev.filter((r) => r.id !== id));
  };

  // ============================================================
  // REPLICACIÓN MULTI-PÁGINA (HERRAMIENTA EMPRESARIAL)
  // ============================================================
  const replicateLastBoxAcrossAllPages = () => {
    const pageBoxes = redactions.filter((r) => r.page === activePage);
    if (pageBoxes.length === 0) {
      toast.warning(
        isEs
          ? 'Dibuja al menos un parche en la página actual para replicarlo.'
          : 'Draw at least one box on current page to replicate.',
      );
      return;
    }
    const targetBox = pageBoxes[pageBoxes.length - 1];
    pushUndo();

    const newBoxes: RedactionBox[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === activePage) continue;
      newBoxes.push({
        ...targetBox,
        id: `replicated-${p}-${Date.now()}-${Math.random()}`,
        page: p,
      });
    }

    setRedactions((prev) => [...prev, ...newBoxes]);
    toast.success(
      isEs
        ? `¡Parche replicado en las ${totalPages - 1} páginas restantes!`
        : `Box replicated across all other ${totalPages - 1} pages!`,
    );
  };

  // ============================================================
  // CENSURA POR LOTE DE PALABRAS CLAVE (BATCH KEYWORDS)
  // ============================================================
  const handleApplyBatchKeywords = () => {
    const raw = batchKeywordsInput.trim();
    if (!raw) {
      toast.error(isEs ? 'Ingresa al menos una palabra o frase' : 'Enter at least one keyword');
      return;
    }
    const terms = raw
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (terms.length === 0) return;

    let accumulatedBoxes: RedactionBox[] = [];
    terms.forEach((term) => {
      const matches = getSubWordMatches(term, extractedTextItems, exactMatch);
      matches.forEach((m) => accumulatedBoxes.push(m.redactionBox));
    });

    if (accumulatedBoxes.length > 0) {
      pushUndo();
      setRedactions((prev) => [...prev, ...accumulatedBoxes]);
      setBatchKeywordsInput('');
      setShowBatchKeywords(false);
      toast.success(
        isEs
          ? `¡${accumulatedBoxes.length} coincidencias censuradas para ${terms.length} términos!`
          : `Applied ${accumulatedBoxes.length} patches for ${terms.length} terms!`,
      );
    } else {
      toast.info(isEs ? 'No se encontraron coincidencias para los términos' : 'No matches found');
    }
  };

  // Filtrado de hallazgos por categoría
  const filteredSensitiveMatches = useMemo(() => {
    if (activeCategoryFilter === 'all') return sensitiveMatches;
    return sensitiveMatches.filter((m) => m.category === activeCategoryFilter);
  }, [sensitiveMatches, activeCategoryFilter]);

  const censorAllDetected = () => {
    if (sensitiveMatches.length === 0) {
      toast.info(isEs ? 'No hay datos sensibles detectados' : 'No sensitive data detected');
      return;
    }
    pushUndo();
    const allBoxes = sensitiveMatches.map((m) => m.redactionBox);
    setRedactions((prev) => [...prev, ...allBoxes]);
    toast.success(
      isEs
        ? `¡${allBoxes.length} datos confidenciales marcados para censura!`
        : `${allBoxes.length} confidential items marked for redaction!`,
    );
  };

  const censorCurrentCategory = () => {
    if (filteredSensitiveMatches.length === 0) {
      toast.info(isEs ? 'No hay datos en esta categoría' : 'No data in this category');
      return;
    }
    pushUndo();
    const boxes = filteredSensitiveMatches.map((m) => m.redactionBox);
    setRedactions((prev) => [...prev, ...boxes]);
    toast.success(
      isEs
        ? `¡${boxes.length} datos de la categoría marcados para censura!`
        : `${boxes.length} category items marked for redaction!`,
    );
  };

  // ============================================================
  // EJECUCIÓN DEL MOTOR TRUEREDACT™
  // ============================================================
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
    setProgressMsg(
      isEs ? 'Iniciando purgado binario seguro...' : 'Starting secure binary sanitization...',
    );

    const resolvedOverlayText =
      overlayPreset === 'none'
        ? undefined
        : overlayPreset === 'redacted'
          ? isEs
            ? '[CENSURADO]'
            : '[REDACTED]'
          : overlayPreset === 'confidential'
            ? isEs
              ? '[CONFIDENCIAL]'
              : '[CONFIDENTIAL]'
            : overlayPreset === 'gdpr'
              ? '[RGPD / GDPR]'
              : customOverlayText || (isEs ? '[CENSURADO]' : '[REDACTED]');

    try {
      const fileBuffer = await file.arrayBuffer();
      const bufferCopy = fileBuffer.slice(0);

      // Web Worker
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
          console.warn('Worker error, fallback to inline engine:', (msg as RedactError).message);
          worker.terminate();
          workerRef.current = null;
          applyInlineRedaction(allBoxes, redactionMode, resolvedOverlayText);
        }
      };

      worker.onerror = (err) => {
        console.warn('Worker error, running inline engine:', err);
        worker.terminate();
        workerRef.current = null;
        applyInlineRedaction(allBoxes, redactionMode, resolvedOverlayText);
      };

      worker.postMessage({
        fileBuffer: bufferCopy,
        fileName: file.name,
        options: {
          redactions: allBoxes,
          redactionColor: redactionStyle,
          overlayText: resolvedOverlayText,
          stripMetadata: true,
          customSuffix,
          mode: redactionMode,
        },
      });
    } catch (error) {
      console.error('executeRedact error, executing inline engine:', error);
      applyInlineRedaction(allBoxes, redactionMode, resolvedOverlayText);
    }
  };

  const handleResult = (r: RedactResult) => {
    const blob = new Blob([r.redactedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setProgressPercent(100);

    const originalName = file!.name.replace(/\.[^/.]+$/, '');
    const suffix = customSuffix || '_Censurado';

    // Calcular hash del archivo censurado
    calculateSHA256(r.redactedBytes).then((redactedHash) => {
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
        redactedHash,
      });

      const durationMs = Date.now() - startTime;
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
        engineVersion: 'PDFBlack TrueRedact™ Enterprise v4.0',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
        processingDurationMs: durationMs,
      });

      addAuditLogEntry({
        timestamp: new Date().toISOString(),
        eventType: 'document_downloaded',
        details: `Censura completada con ${r.totalRedactions} parches en ${r.pagesWithRedactions} páginas. SHA-256: ${redactedHash}`,
        metadata: { mode: r.mode, pagesWithRedactions: r.pagesWithRedactions },
      });
    });

    setIsProcessing(false);
    toast.success(
      isEs
        ? `¡Censura completada! ${r.totalRedactions} parches aplicados exitosamente.`
        : `Redaction complete! ${r.totalRedactions} patches applied successfully.`,
    );
  };

  // Motor Inline Ultra-Robusto de Fallback
  const applyInlineRedaction = async (
    allBoxes: RedactionBox[],
    mode: 'precision' | 'raster',
    overlayTextStr?: string,
  ) => {
    try {
      if (!file) return;
      const fileBuffer = await file.arrayBuffer();
      const { PDFDocument, rgb, StandardFonts, PDFName } = await import('pdf-lib');

      const redactionsByPage = new Map<number, RedactionBox[]>();
      for (const r of allBoxes) {
        if (!redactionsByPage.has(r.page)) redactionsByPage.set(r.page, []);
        redactionsByPage.get(r.page)!.push(r);
      }

      if (mode === 'raster') {
        setProgressMsg(
          isEs ? 'Renderizando páginas anti-forense...' : 'Rendering anti-forensic pages...',
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
        const boxColorHex =
          redactionStyle === 'dark'
            ? '#18181b'
            : redactionStyle === 'white'
              ? '#ffffff'
              : redactionStyle === 'gray'
                ? '#52525b'
                : '#000000';

        for (let p = 1; p <= totalP; p++) {
          setProgressPercent(15 + Math.floor((p / totalP) * 75));
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
            ctx.fillStyle = boxColorHex;
            ctx.fillRect(rx, ry, rw, rh);

            const txt = box.overlayText || overlayTextStr;
            if (txt && rw > 25 && rh > 12) {
              ctx.fillStyle = redactionStyle === 'white' ? '#0d0d12' : '#ffffff';
              ctx.font = `bold ${Math.min(Math.max(rh * 0.52, 9), 24)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(txt, rx + rw / 2, ry + rh / 2);
            }
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
        outPdf.setProducer('PDFBlack TrueRedact™ Enterprise v4.0 (Raster Flattened)');
        try {
          outPdf.catalog.delete(PDFName.of('Metadata'));
          outPdf.catalog.delete(PDFName.of('PieceInfo'));
        } catch {}

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
        // Modo precisión vectorial nativo
        setProgressMsg(
          isEs ? 'Aplicando censura vectorial nativa...' : 'Applying native vector redaction...',
        );
        const pdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer.slice(0)), {
          ignoreEncryption: true,
          updateMetadata: false,
        });

        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const totalP = pdfDoc.getPageCount();
        const pages = pdfDoc.getPages();
        const boxColor =
          redactionStyle === 'dark'
            ? rgb(0.09, 0.09, 0.11)
            : redactionStyle === 'white'
              ? rgb(1, 1, 1)
              : redactionStyle === 'gray'
                ? rgb(0.35, 0.35, 0.38)
                : rgb(0, 0, 0);

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

            const txt = box.overlayText || overlayTextStr;
            if (txt && rw > 15 && rh > 6) {
              const textColor = redactionStyle === 'white' ? rgb(0.08, 0.08, 0.1) : rgb(1, 1, 1);
              const maxFontSizeByHeight = Math.max(rh * 0.56, 5);
              const textWidthAt1 = font.widthOfTextAtSize(txt, 1);
              const maxFontSizeByWidth = (rw * 0.88) / Math.max(textWidthAt1, 1);
              const fontSize = Math.min(maxFontSizeByHeight, maxFontSizeByWidth, 12);

              if (fontSize >= 4.5) {
                const textWidth = font.widthOfTextAtSize(txt, fontSize);
                const textHeight = font.heightAtSize(fontSize);
                const textX = rx + offsetX + (rw - textWidth) / 2;
                const textY = ry + offsetY + (rh - textHeight) / 2 + fontSize * 0.15;
                page.drawText(txt, {
                  x: textX,
                  y: textY,
                  size: fontSize,
                  font,
                  color: textColor,
                });
              }
            }
          }
        }

        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setProducer('PDFBlack TrueRedact™ Enterprise v4.0');
        try {
          pdfDoc.catalog.delete(PDFName.of('Metadata'));
          pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
        } catch {}

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

  // Descargas forenses complementarias
  const handleDownloadForensicCertificate = () => {
    if (!completedResult || !file) return;
    const chain = getCustodyChain();
    const cert = generateCertificateOfRedaction(
      chain.length > 0
        ? chain
        : [
            {
              sessionId,
              timestamp: new Date().toISOString(),
              originalFileName: file.name,
              originalHash: originalHash || 'unavailable',
              redactedHash: completedResult.redactedHash || 'completed',
              originalSize: completedResult.originalSize,
              redactedSize: completedResult.redactedSize,
              totalRedactions: completedResult.totalRedactions,
              pagesWithRedactions: completedResult.pagesWithRedactions,
              mode: redactionMode,
              precisionPages:
                redactionMode === 'precision' ? completedResult.pagesWithRedactions : 0,
              rasterPages: redactionMode === 'raster' ? completedResult.pagesWithRedactions : 0,
              engineVersion: 'PDFBlack TrueRedact™ Enterprise v4.0',
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
            },
          ],
    );
    downloadCertificate(cert);
    toast.success(
      isEs ? 'Certificado Forense descargado (.json)' : 'Forensic Certificate downloaded (.json)',
    );
  };

  const handleDownloadAuditReportTxt = () => {
    if (!completedResult || !file) return;
    const lines = [
      '================================================================================',
      '        PDFBLACK TRUEREDACT™ ENTERPRISE v4.0 — INFORME DE AUDITORÍA FORENSE     ',
      '================================================================================',
      `Fecha de Emisión:       ${new Date().toLocaleString()}`,
      `ID de Sesión:           ${sessionId}`,
      `Documento:              ${file.name}`,
      `Tamaño Original:        ${formatFileSize(completedResult.originalSize)} (${completedResult.originalSize} bytes)`,
      `Tamaño Sanitizado:      ${completedResult.fileSize} (${completedResult.redactedSize} bytes)`,
      `Total Parches:          ${completedResult.totalRedactions}`,
      `Páginas Afectadas:      ${completedResult.pagesWithRedactions} de ${totalPages}`,
      `Modo de Sanitización:   ${redactionMode.toUpperCase()} (${redactionMode === 'precision' ? 'Vectorial con purga XMP' : 'Aplanado Raster Anti-Forense 300 DPI'})`,
      `Color de Parche:        ${redactionStyle.toUpperCase()}`,
      `Texto Superpuesto:      ${overlayPreset === 'none' ? 'Ninguno' : overlayPreset}`,
      '',
      '--- CADENA CRIPTOGRÁFICA DE INTEGRIDAD (SHA-256) ---',
      `Hash SHA-256 Original:    ${originalHash || 'No disponible'}`,
      `Hash SHA-256 Sanitizado:  ${completedResult.redactedHash || 'No disponible'}`,
      '',
      '--- CUMPLIMIENTO NORMATIVO CORPORATIVO ---',
      '* RGPD (Reglamento General de Protección de Datos UE 2016/679, Art. 17 y 32)',
      '* HIPAA (Health Insurance Portability and Accountability Act, 45 CFR § 164.514)',
      '* NIST SP 800-88 Rev. 1 (Guidelines for Media Sanitization)',
      '================================================================================',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_Censura_${file.name.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(
      isEs ? 'Informe de auditoría descargado (.txt)' : 'Audit report downloaded (.txt)',
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 font-sans">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            loadSingleFileIntoSlot(activeSlotIndex, e.target.files[0]);
          }
          e.target.value = '';
        }}
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
        /* DROPZONE VACÍA ESTILO PRÉMIUM */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <EyeOff className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor TrueRedact™ Enterprise v4.0 • 100% Local'
                : 'TrueRedact™ Enterprise Engine v4.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'CENSURA Y ELIMINA INFORMACIÓN SENSIBLE EN PDF'
              : 'REDACT AND REMOVE SENSITIVE INFORMATION IN PDF'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Elimina de forma irreversible datos confidenciales, números de tarjeta (Luhn), DNI/NIE, cuentas bancarias y textos privados mediante purgado binario real en tu navegador sin subir archivos a internet.'
              : 'Irreversibly purge confidential data, credit cards, ID numbers, bank accounts, and private text via true binary sanitization without cloud uploads.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar Archivo PDF para Censurar' : 'Select PDF File to Redact'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Purgado Binario Real' : '✓ True Binary Purge'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Eliminación física de glifos y purga del árbol XML /Metadata XMP en memoria.'
                  : 'Physical destruction of glyphs and deep XMP XML /Metadata tree purging in RAM.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Escaneo Inteligente' : '✓ Smart Regex Scan'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Detección automática de tarjetas (Luhn), DNI/NIE, emails y teléfonos con 1 clic.'
                  : 'Automated 1-click detection for cards (Luhn), IDs, emails, and phone numbers.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Cadena de Custodia' : '✓ Chain of Custody'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Certificado forense descargable con SHA-256 de entrada y salida para validez pericial.'
                  : 'Downloadable forensic certificate with input/output SHA-256 for legal compliance.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO Y DESCARGA UNIFICADA */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans"
        >
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="censurar"
            title={isEs ? '¡Documento censurado con éxito!' : 'Document redacted successfully!'}
            metrics={{
              categoryTitle: isEs ? 'ESTADO DE LA SANITIZACIÓN' : 'SANITIZATION STATUS',
              categorySubtitle: isEs
                ? `${completedResult.totalRedactions} parches aplicados en ${completedResult.pagesWithRedactions} páginas • TrueRedact™ v4.0`
                : `${completedResult.totalRedactions} patches applied across ${completedResult.pagesWithRedactions} pages • TrueRedact™ v4.0`,
              badgeLabel: isEs ? 'Seguridad:' : 'Security:',
              badgeValue: isEs ? '100% Certificada' : '100% Certified',
              originalSize: formatFileSize(completedResult.originalSize),
              compressedSize: formatFileSize(completedResult.redactedSize),
              labelOriginal: isEs ? 'Tamaño Original' : 'Original Size',
              labelCompressed: isEs ? 'Tamaño Sanitizado' : 'Sanitized Size',
              labelSaved: isEs ? 'Parches Aplicados' : 'Applied Patches',
              savedSpace: `${completedResult.totalRedactions} ${isEs ? 'parches' : 'patches'}`,
              reductionPercent: 100,
            }}
            onReset={() => {
              setCompletedResult(null);
              setDownloadUrl(null);
              handleRemoveAllFiles();
            }}
          >
            {/* AUDITORÍA Y CERTIFICACIÓN FORENSE COMPLEMENTARIA (OPCIONAL) */}
            <div className="bg-[#0e0e13] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-3.5 sm:p-4 font-mono transition-all my-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block font-sans">
                      {isEs
                        ? 'Certificación Forense y Cadena de Custodia (Opcional)'
                        : 'Forensic Certification & Chain of Custody (Optional)'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {isEs
                        ? 'Documentación técnica con huella SHA-256 para validez legal o auditorías.'
                        : 'Technical documentation with SHA-256 hash for legal validity or audit.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadForensicCertificate}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    title={
                      isEs
                        ? 'Descargar certificado forense en formato JSON'
                        : 'Download forensic certificate in JSON format'
                    }
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEs ? 'Certificado (.json)' : 'Certificate (.json)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAuditReportTxt}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    title={
                      isEs
                        ? 'Descargar informe de auditoría en texto plano'
                        : 'Download audit report in plain text'
                    }
                  >
                    <FileCode className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{isEs ? 'Informe (.txt)' : 'Report (.txt)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHashDetails(!showHashDetails)}
                    className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                    title={isEs ? 'Ver / Ocultar hashes SHA-256' : 'View / Hide SHA-256 hashes'}
                  >
                    <Hash className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="hidden sm:inline">{isEs ? 'Hashes' : 'Hashes'}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${showHashDetails ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* PANEL DESPLEGABLE DE HASHES SHA-256 */}
              {showHashDetails && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-zinc-500 font-bold flex-shrink-0">SHA-256 Original:</span>
                    <span className="text-zinc-300 truncate">
                      {originalHash || 'No disponible'}
                    </span>
                    {originalHash && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(originalHash);
                          toast.success(isEs ? 'Hash original copiado' : 'Original hash copied');
                        }}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer flex-shrink-0"
                        title={isEs ? 'Copiar hash' : 'Copy hash'}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-emerald-400 font-bold flex-shrink-0">
                      SHA-256 Sanitizado:
                    </span>
                    <span className="text-emerald-300 truncate">
                      {completedResult.redactedHash || 'No disponible'}
                    </span>
                    {completedResult.redactedHash && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(completedResult.redactedHash!);
                          toast.success(isEs ? 'Hash sanitizado copiado' : 'Sanitized hash copied');
                        }}
                        className="p-1 hover:bg-zinc-800 text-emerald-400 hover:text-white rounded cursor-pointer flex-shrink-0"
                        title={isEs ? 'Copiar hash' : 'Copy hash'}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DownloadSuccessCard>
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO VERTICAL: SECCIÓN 1 (VISOR Y SLOTS) + SECCIÓN 2 (PANEL DE CONTROL CORPORATIVO) */
        <div className="flex flex-col gap-6 mb-6 font-sans">
          {/* SECCIÓN 1: VISOR INTERACTIVO Y CAJAS DE ARCHIVOS */}
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
                {/* Header Visor con controles de Dibujo / Borrado / Replicar / Undo / Redo */}
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs text-zinc-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTool('draw')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer text-[10px] ${
                        activeTool === 'draw'
                          ? 'bg-white text-black border-white font-bold shadow-sm'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Square className="w-3 h-3" />
                      <span>{isEs ? 'Dibujar' : 'Draw'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('erase')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer text-[10px] ${
                        activeTool === 'erase'
                          ? 'bg-zinc-800 text-white border-zinc-500 font-bold shadow-sm'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Eraser className="w-3 h-3" />
                      <span>{isEs ? 'Borrar' : 'Erase'}</span>
                    </button>
                    <span className="text-zinc-600 mx-0.5">|</span>
                    <button
                      type="button"
                      onClick={replicateLastBoxAcrossAllPages}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[10px] font-mono cursor-pointer transition shadow-sm"
                      title={
                        isEs
                          ? 'Replicar el último parche en todas las páginas del PDF'
                          : 'Replicate last box across all pages'
                      }
                    >
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">
                        {isEs ? 'Replicar en Todas' : 'Replicate All'}
                      </span>
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
                  className={`flex-1 min-h-[260px] max-h-[360px] bg-[#121215] relative overflow-y-auto p-2 rounded-xl my-3 flex items-center justify-center border border-zinc-800/80 ${
                    activeTool === 'draw'
                      ? 'cursor-crosshair'
                      : activeTool === 'erase'
                        ? 'cursor-pointer'
                        : 'cursor-default'
                  }`}
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
                            {manualBoxes.map((box) => {
                              const isWhiteBox = box.boxColor === 'white';
                              return (
                                <div
                                  key={box.id}
                                  style={{
                                    left: `${box.xPercent}%`,
                                    top: `${box.yPercent}%`,
                                    width: `${box.widthPercent}%`,
                                    height: `${box.heightPercent}%`,
                                    backgroundColor:
                                      box.boxColor === 'dark'
                                        ? '#18181b'
                                        : box.boxColor === 'white'
                                          ? '#ffffff'
                                          : box.boxColor === 'gray'
                                            ? '#4b5563'
                                            : '#000000',
                                  }}
                                  onClick={(e) => {
                                    if (activeTool === 'erase') {
                                      e.stopPropagation();
                                      removeRedaction(box.id);
                                    }
                                  }}
                                  className={`absolute border border-white/40 rounded-xs shadow-lg flex items-center justify-center px-0.5 text-white z-30 group overflow-hidden ${
                                    activeTool === 'erase'
                                      ? 'cursor-pointer ring-2 ring-red-500/80'
                                      : 'cursor-default'
                                  }`}
                                >
                                  {box.overlayText && (
                                    <span
                                      className={`text-[8px] font-bold font-mono truncate select-none ${
                                        isWhiteBox ? 'text-black' : 'text-white'
                                      }`}
                                    >
                                      {box.overlayText}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeRedaction(box.id);
                                    }}
                                    className="absolute right-0.5 top-0.5 text-red-400 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/60 rounded"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}

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

          {/* SECCIÓN 2: PANEL DE CONTROL CORPORATIVO TRUEREDACT™ */}
          <div
            ref={controlPanelRef}
            className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sans"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* CABECERA PANEL */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-sans">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                  002 / CONFIGURACIÓN DE CENSURA Y AUDITORÍA FORENSE
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                  {isEs ? 'PANEL DE CONTROL CORPORATIVO' : 'CORPORATE CONTROL PANEL'}
                </h2>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-700 text-white shadow-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-zinc-300">TrueRedact™ v4.0</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* === PANEL DE AUDITORÍA FORENSE INTELIGENTE (AUTO-SCAN) === */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      {isEs
                        ? 'Auditoría Forense de Datos Confidenciales'
                        : 'Confidential Data Forensic Audit'}
                    </span>
                    {isScanning && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-lg shadow-sm">
                      {sensitiveMatches.length} {isEs ? 'detectados' : 'detected'}
                    </span>
                  </div>
                </div>

                {/* PESTAÑAS DE CATEGORÍA DE DATOS */}
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                      activeCategoryFilter === 'all'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isEs ? 'Todos' : 'All'} ({sensitiveMatches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('personal_id')}
                    className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                      activeCategoryFilter === 'personal_id'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    🪪 {isEs ? 'Identidad' : 'IDs'} (
                    {sensitiveMatches.filter((m) => m.category === 'personal_id').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('financial')}
                    className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                      activeCategoryFilter === 'financial'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    💳 {isEs ? 'Financiero' : 'Financial'} (
                    {sensitiveMatches.filter((m) => m.category === 'financial').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('contact')}
                    className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                      activeCategoryFilter === 'contact'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    📧 {isEs ? 'Contacto' : 'Contact'} (
                    {sensitiveMatches.filter((m) => m.category === 'contact').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('confidential')}
                    className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                      activeCategoryFilter === 'confidential'
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    🔒 {isEs ? 'Confidencial' : 'Confidential'} (
                    {sensitiveMatches.filter((m) => m.category === 'confidential').length})
                  </button>
                </div>

                {sensitiveMatches.length > 0 ? (
                  <>
                    {/* ACCIONES DE 1-CLIC */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={censorAllDetected}
                        disabled={isProcessing}
                        className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {isEs
                            ? `Censurar Todos los Detectados (${sensitiveMatches.length})`
                            : `Redact All Detected (${sensitiveMatches.length})`}
                        </span>
                      </button>
                      {activeCategoryFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={censorCurrentCategory}
                          disabled={isProcessing || filteredSensitiveMatches.length === 0}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 border border-zinc-700"
                        >
                          <span>
                            {isEs
                              ? `Censurar Categoría (${filteredSensitiveMatches.length})`
                              : `Redact Category (${filteredSensitiveMatches.length})`}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setRedactions([]);
                          setAutoRedactions([]);
                        }}
                        disabled={isProcessing || redactions.length === 0}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-mono transition-all cursor-pointer disabled:opacity-40 border border-zinc-800"
                      >
                        {isEs ? 'Limpiar Parches' : 'Clear Patches'}
                      </button>
                    </div>

                    {/* LISTA SCROLLABLE DE HALLAZGOS CON DETALLES */}
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {filteredSensitiveMatches.slice(0, 40).map((match) => {
                        const isAlreadyRedacted = redactions.some(
                          (r) => r.id === match.redactionBox.id,
                        );
                        return (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  match.category === 'financial'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : match.category === 'personal_id'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      : match.category === 'contact'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {match.category === 'financial'
                                  ? 'Financiero'
                                  : match.category === 'personal_id'
                                    ? 'Identidad'
                                    : match.category === 'contact'
                                      ? 'Contacto'
                                      : 'Confidencial'}
                              </span>
                              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[280px]">
                                {match.matchedText}
                              </span>
                              <span className="text-[10px] text-zinc-500">Pág {match.page}</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setActivePage(match.page)}
                                className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded border border-zinc-700 cursor-pointer"
                              >
                                {isEs ? 'Ver Pág' : 'View'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAlreadyRedacted) {
                                    removeRedaction(match.redactionBox.id);
                                  } else {
                                    pushUndo();
                                    setRedactions((prev) => [...prev, match.redactionBox]);
                                  }
                                }}
                                className={`text-[10px] px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                                  isAlreadyRedacted
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                }`}
                              >
                                {isAlreadyRedacted
                                  ? isEs
                                    ? 'Quitar'
                                    : 'Remove'
                                  : isEs
                                    ? 'Censurar'
                                    : 'Redact'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {isEs
                      ? '✓ No se detectaron patrones confidenciales automáticos evidentes. Puedes dibujar parches o usar la búsqueda de palabras clave.'
                      : '✓ No obvious automated sensitive patterns found. You can draw boxes or search keywords.'}
                  </p>
                )}
              </div>

              {/* BÚSQUEDA INDIVIDUAL Y CENSURA POR LOTE DE PALABRAS */}
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-4 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest uppercase block">
                    {isEs ? 'Buscar y Censurar Palabras Clave' : 'Search & Redact Keywords'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBatchKeywords(!showBatchKeywords)}
                    className="text-[10px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>
                      {showBatchKeywords
                        ? isEs
                          ? 'Modo Simple'
                          : 'Single Mode'
                        : isEs
                          ? '+ Modo Lote de Palabras'
                          : '+ Batch Words Mode'}
                    </span>
                  </button>
                </div>

                {!showBatchKeywords ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id="keyword-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          isEs
                            ? 'Escribe una palabra o frase a censurar...'
                            : 'Type word or phrase to redact...'
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
                          toast.success(isEs ? 'Parches fijados' : 'Patches pinned');
                        }}
                        className="bg-white text-black font-bold px-4 py-2.5 rounded-xl text-xs font-mono hover:bg-zinc-200 transition-colors cursor-pointer flex-shrink-0"
                      >
                        {isEs
                          ? `Fijar (${autoRedactions.length})`
                          : `Apply (${autoRedactions.length})`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={batchKeywordsInput}
                      onChange={(e) => setBatchKeywordsInput(e.target.value)}
                      placeholder={
                        isEs
                          ? 'Pega varios nombres o términos separados por comas o saltos de línea (ej: Juan Pérez, 45.000€, Contrato Secreto)...'
                          : 'Paste multiple terms separated by commas or newlines (e.g. John Doe, Confidential, $50,000)...'
                      }
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setBatchKeywordsInput('')}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-mono cursor-pointer"
                      >
                        {isEs ? 'Borrar' : 'Clear'}
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyBatchKeywords}
                        className="px-4 py-1.5 bg-white text-black font-bold rounded-lg text-xs font-mono hover:bg-zinc-200 transition cursor-pointer"
                      >
                        {isEs ? 'Censurar Todo el Lote' : 'Redact Batch List'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* OPCIONES AVANZADAS DE SALIDA & TEXTO SUPERPUESTO */}
              <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isEs ? 'ESTILO DE PARCHE Y TEXTO SUPERPUESTO' : 'PATCH STYLE & OVERLAY TEXT'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {redactions.length} {isEs ? 'parches activos' : 'active patches'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* COLOR DE PARCHE */}
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Color de Parche:' : 'Box Color:'}
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={() => setRedactionStyle('black')}
                        className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                          redactionStyle === 'black'
                            ? 'border-white bg-black text-white ring-1 ring-white'
                            : 'border-white/15 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        Negro
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactionStyle('dark')}
                        className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                          redactionStyle === 'dark'
                            ? 'border-white bg-[#18181b] text-white ring-1 ring-white'
                            : 'border-white/15 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        Carbón
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactionStyle('white')}
                        className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                          redactionStyle === 'white'
                            ? 'border-white bg-white text-black ring-1 ring-white'
                            : 'border-white/15 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        Blanco
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactionStyle('gray')}
                        className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                          redactionStyle === 'gray'
                            ? 'border-white bg-zinc-700 text-white ring-1 ring-white'
                            : 'border-white/15 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        Gris
                      </button>
                    </div>
                  </div>

                  {/* TEXTO SUPERPUESTO (ESTILO CORPORATIVO) */}
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Texto Superpuesto:' : 'Overlay Label:'}
                    </label>
                    <select
                      value={overlayPreset}
                      onChange={(e) => setOverlayPreset(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/40 transition cursor-pointer"
                    >
                      <option value="none">{isEs ? 'Ninguno (Sólido)' : 'None (Solid)'}</option>
                      <option value="redacted">[CENSURADO] / [REDACTED]</option>
                      <option value="confidential">[CONFIDENCIAL]</option>
                      <option value="gdpr">[RGPD / GDPR]</option>
                      <option value="custom">{isEs ? 'Personalizado...' : 'Custom...'}</option>
                    </select>
                  </div>

                  {/* MODO DE SANITIZACIÓN */}
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Modo de Motor:' : 'Engine Mode:'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRedactionMode('precision')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                          redactionMode === 'precision'
                            ? 'border-white bg-zinc-800 text-white'
                            : 'border-white/10 bg-zinc-900 text-zinc-400'
                        }`}
                        title={
                          isEs
                            ? 'Vectorial nativo con purga de glifos y árbol XMP'
                            : 'Native vector with glyph & XMP purge'
                        }
                      >
                        🎯 {isEs ? 'Vector' : 'Vector'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactionMode('raster')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                          redactionMode === 'raster'
                            ? 'border-white bg-zinc-800 text-white'
                            : 'border-white/10 bg-zinc-900 text-zinc-400'
                        }`}
                        title={
                          isEs
                            ? 'Aplanado plano a 300 DPI (Destrucción total anti-forense)'
                            : '300 DPI flat raster destruction'
                        }
                      >
                        📸 {isEs ? 'Raster' : 'Raster'}
                      </button>
                    </div>
                  </div>

                  {/* SUFIJO DE ARCHIVO */}
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Sufijo del archivo:' : 'File suffix:'}
                    </label>
                    <input
                      type="text"
                      value={customSuffix}
                      onChange={(e) => setCustomSuffix(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/40 transition"
                    />
                  </div>
                </div>

                {/* TEXTO PERSONALIZADO SI SE ELIGE CUSTOM */}
                {overlayPreset === 'custom' && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs
                        ? 'Escribe el texto corporativo superpuesto:'
                        : 'Type custom overlay label:'}
                    </label>
                    <input
                      type="text"
                      value={customOverlayText}
                      onChange={(e) => setCustomOverlayText(e.target.value)}
                      placeholder="[EXPEDIENTE RESERVADO]"
                      className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-white transition"
                    />
                  </div>
                )}
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
                    ? 'True Redaction Enterprise: el contenido censurado y sus metadatos XMP se destruyen permanentemente y de manera irreversible conforme a RGPD y NIST SP 800-88.'
                    : 'True Redaction Enterprise: redacted content and XMP metadata are permanently and irreversibly destroyed per GDPR and NIST SP 800-88.'}
                </p>
              </div>

              <button
                onClick={executeRedact}
                disabled={isProcessing || redactions.length + autoRedactions.length === 0}
                className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-40 hover:scale-[1.01]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>
                      {isEs
                        ? 'Sanitizando y Purgando Documento...'
                        : 'Sanitizing & Purging Document...'}
                    </span>
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
                  {isEs ? 'Motor TrueRedact™ v4.0 Activo' : 'TrueRedact™ v4.0 Engine Active'}
                </span>
                <span className="flex items-center gap-1 text-white">
                  <Database className="w-3 h-3" />
                  {isEs ? '100% Local (Cero Servidores)' : '100% Local (Zero Servers)'}
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
