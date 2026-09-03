'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import {
  Table,
  Loader2,
  X,
  FilePlus,
  RefreshCw,
  UploadCloud,
  Repeat,
  Layout,
  FileSpreadsheet,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  ListOrdered,
  Grid,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Cpu,
  HelpCircle,
  Plus,
  FileDown,
  FileText,
  Check,
  ListChecks,
  Trash2,
} from 'lucide-react';
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

type ConversionDirection = 'excel-to-pdf' | 'pdf-to-excel';
type PageSelectionMode = 'all' | 'range' | 'custom' | 'even' | 'odd';

interface ExcelPdfConverterProps {
  defaultMode?: ConversionDirection;
}

interface PdfTextItem {
  str?: string;
  transform?: number[];
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

interface ParsedSheet {
  name: string;
  rowCount: number;
  colCount: number;
  rows: (string | number | null)[][];
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

function sanitizeCellString(str: string): string {
  if (!str) return '';
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uD800-\uDFFF\uFFFE\uFFFF]/g, '').trim();
}

interface SlotItem {
  id: string;
  file: File | null;
  thumbnailUrl?: string;
  pageDataUrls: Record<number, string>;
  totalPages: number;
  excelSheets?: ParsedSheet[];
}

export default function ExcelPdfConverter({
  defaultMode = 'pdf-to-excel',
}: ExcelPdfConverterProps) {
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
    { id: 'slot-1', file: null, pageDataUrls: {}, totalPages: 0, excelSheets: [] },
    { id: 'slot-2', file: null, pageDataUrls: {}, totalPages: 0, excelSheets: [] },
    { id: 'slot-3', file: null, pageDataUrls: {}, totalPages: 0, excelSheets: [] },
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
    if (defaultMode === 'pdf-to-excel' && name.endsWith('.pdf')) return globalFile;
    if (
      defaultMode === 'excel-to-pdf' &&
      (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv'))
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

  const [extractedCellCount, setExtractedCellCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // ESTADO DE HOJAS EXCEL (EXCEL -> PDF)
  const [excelSheets, setExcelSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  // SELECCIÓN DE PÁGINAS (PDF -> EXCEL)
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // MOTOR DE CONVERSIÓN
  const [conversionEngine, setConversionEngine] = useState<
    'adobe' | 'cloudconvert' | 'local' | 'gemini'
  >('gemini');

  // Opciones Avanzadas - Excel a PDF
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [tableTheme, setTableTheme] = useState<'emerald' | 'dark' | 'minimal'>('emerald');

  // Opciones Avanzadas - PDF a Excel
  const [outputFormat, setOutputFormat] = useState<'xlsx' | 'csv_comma' | 'csv_semicolon'>('xlsx');
  const [sheetStructure, setSheetStructure] = useState<'single' | 'per_page'>('single');
  const [autoFormatNumbers, setAutoFormatNumbers] = useState<boolean>(true);
  const [trimEmptyRows, setTrimEmptyRows] = useState<boolean>(true);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [extractionStrategy, setExtractionStrategy] = useState<'smart' | 'lineByLine'>('smart');

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

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

  const parseXlsxContent = async (excelFile: File): Promise<number> => {
    try {
      setIsRendering(true);
      const buffer = await excelFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      let cellCount = 0;
      const parsed: ParsedSheet[] = [];

      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        if (ws && ws['!ref']) {
          const range = XLSX.utils.decode_range(ws['!ref']);
          const rowsInSheet = range.e.r - range.s.r + 1;
          const colsInSheet = range.e.c - range.s.c + 1;
          const sheetCellCount = rowsInSheet * colsInSheet;
          cellCount += sheetCellCount;

          const rawData = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
            header: 1,
            defval: '',
            blankrows: true,
          });

          const formattedRows: (string | number | null)[][] = [];
          const maxRows = Math.min(Math.max(rawData.length, rowsInSheet), 100);
          const maxCols = Math.min(Math.max(colsInSheet || 1, 1), 26);

          for (let r = 0; r < maxRows; r++) {
            const row = rawData[r] || [];
            const cleanRow: (string | number | null)[] = [];
            for (let c = 0; c < maxCols; c++) {
              cleanRow.push(row[c] !== undefined && row[c] !== null ? String(row[c]) : '');
            }
            formattedRows.push(cleanRow);
          }

          parsed.push({
            name: sheetName,
            rowCount: rowsInSheet,
            colCount: colsInSheet,
            rows: formattedRows,
          });
        } else {
          parsed.push({
            name: sheetName,
            rowCount: 0,
            colCount: 0,
            rows: [],
          });
        }
      });

      setExcelSheets(parsed);
      setActiveSheetIndex(0);
      setExtractedCellCount(cellCount || 24);
      setTotalPages(parsed.length);
      setSelectedPageSet(new Set(Array.from({ length: parsed.length }, (_, i) => i + 1)));
      setIsRendering(false);
      return cellCount || 24;
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setIsRendering(false);
      return 24;
    }
  };

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setSelectedPageSet(new Set());
      setExcelSheets([]);
      setActiveSheetIndex(0);
      return;
    }
    if (
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.csv')
    ) {
      parseXlsxContent(file);
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      cargarMiniaturasPdfUltraFast(file);
    }
  }, [file]);

  // CARGA ULTRA RÁPIDA DE MINIATURAS (ESCALA LIVIANA 0.22 + STREAMING EN SEGUNDO PLANO)
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
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');

    if (mode === 'excel-to-pdf') {
      if (isExcel) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Hoja de cálculo Excel cargada' : 'Excel spreadsheet loaded');
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona un archivo Excel (.xlsx/.xls/.csv)'
            : 'Please select an Excel file (.xlsx/.xls/.csv)',
        );
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(
          isEs ? 'Archivo PDF cargado para tablas Excel' : 'PDF file loaded for Excel tables',
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
    setExcelSheets([]);
    setActiveSheetIndex(0);
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
        excelSheets: [],
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
      // Archivo Excel / CSV
      try {
        const XLSX = await import('xlsx');
        const buf = await newFile.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheets: ParsedSheet[] = wb.SheetNames.map((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
          const rowCount = rawData.length;
          const colCount = rawData.reduce((acc, row) => Math.max(acc, row.length), 0);
          return {
            name: sheetName,
            rowCount,
            colCount,
            rows: rawData.slice(0, 15),
          };
        });

        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) {
            next[slotIdx] = {
              ...next[slotIdx],
              totalPages: sheets.length,
              excelSheets: sheets,
            };
          }
          return next;
        });
      } catch (err) {
        console.warn('Error previsualizando Excel en slot', slotIdx, err);
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
      next[index] = {
        id: `slot-${index + 1}`,
        file: null,
        pageDataUrls: {},
        totalPages: 0,
        excelSheets: [],
      };
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
      { id: 'slot-1', file: null, pageDataUrls: {}, totalPages: 0, excelSheets: [] },
      { id: 'slot-2', file: null, pageDataUrls: {}, totalPages: 0, excelSheets: [] },
      { id: 'slot-3', file: null, pageDataUrls: {}, totalPages: 0, excelSheets: [] },
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
    setExcelSheets([]);
    setActiveSheetIndex(0);
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
      if (activeSlot.excelSheets && activeSlot.excelSheets.length > 0) {
        setExcelSheets(activeSlot.excelSheets);
      }
    } else {
      const firstLoaded = slots.find((s) => s.file !== null);
      if (firstLoaded && firstLoaded.file) {
        setFile(firstLoaded.file);
        setTotalPages(firstLoaded.totalPages);
        setPageDataUrls(firstLoaded.pageDataUrls);
        if (firstLoaded.excelSheets) setExcelSheets(firstLoaded.excelSheets);
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
    if (mode === 'pdf-to-excel' && targetPages.length === 0) {
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
      if (mode === 'excel-to-pdf') {
        setProgressMsg(
          isEs
            ? 'Procesando Excel a PDF con el motor seleccionado...'
            : 'Processing Excel to PDF with selected engine...',
        );

        if (
          conversionEngine === 'adobe' ||
          conversionEngine === 'cloudconvert' ||
          conversionEngine === 'gemini'
        ) {
          try {
            resultBlob = await convertWithApi(
              '/api/convert/excel-to-pdf',
              file,
              { engine: conversionEngine },
              (pct, msg) => {
                setProgressPercent(pct);
                setProgressMsg(msg);
              },
            );
            localUrl = URL.createObjectURL(resultBlob);
          } catch (apiErr) {
            console.warn('API conversion error, attempting fallback:', apiErr);
          }
        }

        if (!localUrl && API_SECRET && orientation === 'landscape' && pageSize === 'a4') {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'true');

            const response = await fetch(
              `https://v2.convertapi.com/convert/xlsx/to/pdf?Secret=${API_SECRET}`,
              {
                method: 'POST',
                body: formData,
              },
            );

            if (response.ok) {
              const data = await response.json();
              const fileData = data.Files?.[0];
              if (fileData?.FileData) {
                const byteCharacters = atob(fileData.FileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++)
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                resultBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
                localUrl = URL.createObjectURL(resultBlob);
              } else if (fileData?.Url) {
                const fileResponse = await fetch(fileData.Url);
                resultBlob = await fileResponse.blob();
                localUrl = URL.createObjectURL(resultBlob);
              }
            }
          } catch (err) {
            console.warn('ConvertAPI fallback local', err);
          }
        }

        if (!localUrl) {
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

          const sheetsToRender =
            excelSheets.length > 0
              ? excelSheets.filter((_, idx) => targetPageSet.has(idx + 1))
              : [{ name: 'Hoja 1', rowCount: 1, colCount: 1, rows: [['Sin datos']] }];

          const activeSheets = sheetsToRender.length > 0 ? sheetsToRender : excelSheets;
          const sideMargin = 35;
          const usableWidth = width - sideMargin * 2;
          const usableHeight = height - 120; // Espacio para encabezado superior y pie de página
          const rowHeight = 18;
          const rowsPerPage = Math.max(10, Math.floor(usableHeight / rowHeight));

          for (let sIdx = 0; sIdx < activeSheets.length; sIdx++) {
            const currentSheet = activeSheets[sIdx];
            const allRows =
              currentSheet.rows && currentSheet.rows.length > 0 ? currentSheet.rows : [['']];
            const totalRows = allRows.length;
            const maxCols = Math.max(
              1,
              currentSheet.colCount || (allRows[0] ? allRows[0].length : 1),
            );

            // Calcular anchos de columna proporcionales basados en contenido
            const colMaxLens: number[] = new Array(maxCols).fill(4);
            for (let r = 0; r < Math.min(allRows.length, 100); r++) {
              const row = allRows[r] || [];
              for (let c = 0; c < maxCols; c++) {
                const len = row[c] !== undefined && row[c] !== null ? String(row[c]).length : 0;
                if (len > colMaxLens[c]) colMaxLens[c] = Math.min(len, 40);
              }
            }

            const totalWeight = colMaxLens.reduce((sum, l) => sum + Math.max(l, 4), 0);
            const colWidths: number[] = colMaxLens.map((l) =>
              Math.max(
                35,
                Math.min(usableWidth * 0.4, (Math.max(l, 4) / totalWeight) * usableWidth),
              ),
            );

            // Ajustar colWidths para que sumen exactamente usableWidth
            const currentTotalW = colWidths.reduce((sum, w) => sum + w, 0);
            const scaleFactor = usableWidth / Math.max(currentTotalW, 1);
            const adjustedColWidths = colWidths.map((w) => w * scaleFactor);

            let rowPointer = 0;
            let sheetPageNum = 1;
            const totalSheetPages = Math.max(
              1,
              Math.ceil((totalRows - 1) / Math.max(rowsPerPage - 1, 1)) || 1,
            );

            while (rowPointer < totalRows) {
              const page = pdfDoc.addPage([width, height]);
              const sheetTitle = `${file.name.replace(/\.[^/.]+$/, '')} • ${currentSheet.name}`;

              // Encabezado decorativo Excel
              page.drawRectangle({
                x: sideMargin,
                y: height - 50,
                width: usableWidth,
                height: 28,
                color: rgb(0.06, 0.45, 0.28),
              });

              page.drawText(sheetTitle.substring(0, 65), {
                x: sideMargin + 10,
                y: height - 41,
                size: 10.5,
                font: boldFont,
                color: rgb(1, 1, 1),
              });

              page.drawText(`Pág. ${sheetPageNum} de ${totalSheetPages}`, {
                x: width - sideMargin - 90,
                y: height - 41,
                size: 8.5,
                font: font,
                color: rgb(0.9, 0.95, 0.92),
              });

              let yPos = height - 72;

              // Si no es la primera página pero hay encabezados, dibujamos la fila 0 como cabecera repetida
              const isFirstPage = sheetPageNum === 1;
              const rowsToDrawOnThisPage: {
                row: (string | number | null)[];
                isHeader: boolean;
                origIdx: number;
              }[] = [];

              if (isFirstPage) {
                const count = Math.min(rowsPerPage, totalRows - rowPointer);
                for (let i = 0; i < count; i++) {
                  rowsToDrawOnThisPage.push({
                    row: allRows[rowPointer + i] || [],
                    isHeader: rowPointer + i === 0,
                    origIdx: rowPointer + i,
                  });
                }
                rowPointer += count;
              } else {
                // Repetir encabezado de la fila 0 en páginas siguientes
                if (allRows[0]) {
                  rowsToDrawOnThisPage.push({
                    row: allRows[0],
                    isHeader: true,
                    origIdx: 0,
                  });
                }
                const count = Math.min(rowsPerPage - 1, totalRows - rowPointer);
                for (let i = 0; i < count; i++) {
                  rowsToDrawOnThisPage.push({
                    row: allRows[rowPointer + i] || [],
                    isHeader: false,
                    origIdx: rowPointer + i,
                  });
                }
                rowPointer += count;
              }

              rowsToDrawOnThisPage.forEach((item) => {
                if (yPos < 35) return;
                const { row, isHeader } = item;

                if (showGridlines) {
                  page.drawRectangle({
                    x: sideMargin,
                    y: yPos - 3,
                    width: usableWidth,
                    height: rowHeight,
                    color: isHeader
                      ? rgb(0.91, 0.94, 0.96)
                      : item.origIdx % 2 === 0
                        ? rgb(0.98, 0.98, 0.99)
                        : rgb(1, 1, 1),
                    borderColor: rgb(0.82, 0.86, 0.9),
                    borderWidth: 0.5,
                  });
                }

                let currentX = sideMargin + 4;
                for (let cIdx = 0; cIdx < maxCols; cIdx++) {
                  const colW = adjustedColWidths[cIdx] || 40;
                  const rawVal = row[cIdx];
                  const cellText =
                    rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';

                  if (cellText) {
                    // Truncar con seguridad para no desbordar celda
                    const maxCharsInCell = Math.max(3, Math.floor((colW - 8) / 5));
                    const safeText =
                      cellText.length > maxCharsInCell
                        ? `${cellText.substring(0, maxCharsInCell - 1)}…`
                        : cellText;

                    page.drawText(safeText, {
                      x: currentX,
                      y: yPos + 2,
                      size: isHeader ? 7.8 : 7.2,
                      font: isHeader ? boldFont : font,
                      color: isHeader ? rgb(0.08, 0.12, 0.18) : rgb(0.18, 0.2, 0.24),
                    });
                  }
                  currentX += colW;
                }
                yPos -= rowHeight;
              });

              // Pie de página con numeración general
              page.drawText(`${currentSheet.name} • ${totalRows} filas totales`, {
                x: sideMargin,
                y: 18,
                size: 8,
                font,
                color: rgb(0.55, 0.6, 0.65),
              });

              sheetPageNum++;
            }
          }

          const pdfBytes = await pdfDoc.save();
          resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          if (downloadUrl) URL.revokeObjectURL(downloadUrl);
          localUrl = URL.createObjectURL(resultBlob);
        }

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
          isEs ? '¡Excel convertido a PDF con éxito!' : 'Excel converted to PDF successfully!',
        );
      } else {
        // MODO PDF A EXCEL (PDF -> XLSX / CSV)
        const totalToConvert = targetPages.length;
        setProgressMsg(
          isEs
            ? 'Extrayendo tablas con el motor seleccionado...'
            : 'Extracting tables with selected engine...',
        );

        if (
          conversionEngine === 'adobe' ||
          conversionEngine === 'cloudconvert' ||
          conversionEngine === 'gemini'
        ) {
          try {
            resultBlob = await convertWithApi(
              '/api/convert/pdf-to-excel',
              file,
              { engine: conversionEngine },
              (pct, msg) => {
                setProgressPercent(pct);
                setProgressMsg(msg);
              },
            );
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
            localUrl = URL.createObjectURL(resultBlob);
          } catch (apiErr: any) {
            console.warn('API conversion error:', apiErr);
            if (conversionEngine === 'gemini') {
              throw new Error(apiErr?.message || 'Error en la transcripción con Gemini AI.');
            }
          }
        }

        if (!resultBlob) {
          setProgressMsg(
            isEs
              ? `Analizando grilla y tablas de ${totalToConvert} páginas...`
              : `Analyzing grid & tables of ${totalToConvert} pages...`,
          );
          await new Promise((r) => setTimeout(r, 60));
          setProgressPercent(15);

          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer.slice(0),
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
          }).promise;

          const pagesData: Array<{ pageNum: number; rows: Array<Array<string | number>> }> = [];

          for (let idx = 0; idx < totalToConvert; idx++) {
            const pageNum = targetPages[idx];
            setProgressMsg(
              isEs
                ? `Extrayendo tablas de pág. ${idx + 1} de ${totalToConvert} (Pág. ${pageNum})...`
                : `Extracting tables from page ${idx + 1} of ${totalToConvert} (Page ${pageNum})...`,
            );
            setProgressPercent(15 + Math.round(((idx + 1) / totalToConvert) * 65));

            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageRows: Array<Array<string | number>> = [];

            if (extractionStrategy === 'smart') {
              const rawItems = (textContent.items as PdfTextItem[]).filter(
                (it) => it.str && it.str.trim() && it.transform,
              );

              // 1. Detectar rangos de columnas globales en la página (Column Clustering)
              const xPositions: number[] = rawItems
                .map((it) => it.transform![4])
                .sort((a, b) => a - b);

              const columnBins: number[] = [];
              const binTolerance = 22; // tolerancia de agrupación horizontal en pt
              xPositions.forEach((x) => {
                const existing = columnBins.find((bin) => Math.abs(bin - x) <= binTolerance);
                if (existing === undefined) {
                  columnBins.push(x);
                }
              });
              columnBins.sort((a, b) => a - b);

              // 2. Agrupar items por coordenadas Y con tolerancia vertical
              const rowsMap: { [yKey: number]: PdfTextItem[] } = {};
              const yTolerance = 7; // tolerancia vertical de fila

              rawItems.forEach((item) => {
                const rawY = item.transform![5];
                // Encontrar clave Y existente cercana o crear una nueva
                const existingYKey = Object.keys(rowsMap)
                  .map(Number)
                  .find((k) => Math.abs(k - rawY) <= yTolerance);

                const finalYKey = existingYKey !== undefined ? existingYKey : Math.round(rawY);
                if (!rowsMap[finalYKey]) rowsMap[finalYKey] = [];
                rowsMap[finalYKey].push(item);
              });

              const sortedYKeys = Object.keys(rowsMap)
                .map(Number)
                .sort((a, b) => b - a);

              sortedYKeys.forEach((yKey) => {
                const itemsInRow = rowsMap[yKey];
                // Inicializar fila con el número exacto de columnas detectadas (evita desfasamiento)
                const rowCells: Array<string | number> = new Array(
                  Math.max(1, columnBins.length),
                ).fill('');

                itemsInRow.forEach((item) => {
                  const itemX = item.transform![4];
                  // Encontrar la columna más cercana
                  let bestColIdx = 0;
                  let minDiff = Infinity;
                  columnBins.forEach((binX, bIdx) => {
                    const diff = Math.abs(binX - itemX);
                    if (diff < minDiff) {
                      minDiff = diff;
                      bestColIdx = bIdx;
                    }
                  });

                  const cellText = sanitizeCellString(item.str || '');
                  if (!cellText) return;

                  if (autoFormatNumbers) {
                    const cleanedNum = cellText.replace(/,/g, '').replace(/\$/g, '').trim();
                    if (cleanedNum !== '' && !isNaN(Number(cleanedNum))) {
                      rowCells[bestColIdx] = Number(cleanedNum);
                      return;
                    }
                  }

                  const prev = rowCells[bestColIdx];
                  rowCells[bestColIdx] = prev ? `${prev} ${cellText}` : cellText;
                });

                // Limpiar celdas vacías del final de la fila
                let lastNonEmpty = rowCells.length - 1;
                while (
                  lastNonEmpty >= 0 &&
                  (rowCells[lastNonEmpty] === '' || rowCells[lastNonEmpty] === null)
                ) {
                  lastNonEmpty--;
                }

                if (lastNonEmpty >= 0) {
                  const trimmedRow = rowCells.slice(0, lastNonEmpty + 1);
                  if (!trimEmptyRows || trimmedRow.some((c) => c !== '')) {
                    pageRows.push(trimmedRow);
                  }
                }
              });
            } else {
              (textContent.items as PdfTextItem[]).forEach((item) => {
                if (item.str && item.str.trim()) {
                  const text = sanitizeCellString(item.str);
                  if (text) {
                    if (autoFormatNumbers) {
                      const cleanedNum = text.replace(/,/g, '').replace(/\$/g, '').trim();
                      if (cleanedNum !== '' && !isNaN(Number(cleanedNum))) {
                        pageRows.push([Number(cleanedNum)]);
                        return;
                      }
                    }
                    pageRows.push([text]);
                  }
                }
              });
            }

            pagesData.push({
              pageNum,
              rows:
                pageRows.length > 0
                  ? pageRows
                  : [
                      [
                        isEs
                          ? `[Página ${pageNum} sin celdas de datos]`
                          : `[Page ${pageNum} without data cells]`,
                      ],
                    ],
            });

            await new Promise((r) => setTimeout(r, 10));
          }

          setProgressMsg(
            isEs
              ? 'Construyendo libro de Microsoft Excel (.xlsx)...'
              : 'Building Microsoft Excel workbook (.xlsx)...',
          );
          setProgressPercent(85);

          if (outputFormat === 'xlsx') {
            // CREACIÓN DE LIBRO OPENXML BINARIO NATIVO (.xlsx) CON SHEETJS
            const wb = XLSX.utils.book_new();

            if (sheetStructure === 'per_page') {
              // UNA HOJA POR CADA PÁGINA DEL PDF
              pagesData.forEach((pData) => {
                const sheetData: Array<Array<string | number>> = [];
                if (includeHeaders) {
                  sheetData.push([
                    'Fila',
                    'Columna A',
                    'Columna B',
                    'Columna C',
                    'Columna D',
                    'Columna E',
                  ]);
                }
                pData.rows.forEach((row, rIdx) => {
                  sheetData.push([rIdx + 1, ...row]);
                });

                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                // Auto-ajustar anchos de columnas
                ws['!cols'] = [
                  { wch: 8 },
                  { wch: 25 },
                  { wch: 25 },
                  { wch: 20 },
                  { wch: 20 },
                  { wch: 20 },
                ];
                XLSX.utils.book_append_sheet(wb, ws, `Pág ${pData.pageNum}`);
              });
            } else {
              // UNA SOLA HOJA CONSOLIDADA
              const consolidatedData: Array<Array<string | number>> = [];
              if (includeHeaders) {
                consolidatedData.push([
                  'Página PDF',
                  'Fila',
                  'Dato 1',
                  'Dato 2',
                  'Dato 3',
                  'Dato 4',
                  'Dato 5',
                ]);
              }
              pagesData.forEach((pData) => {
                pData.rows.forEach((row, rIdx) => {
                  consolidatedData.push([`Pág ${pData.pageNum}`, rIdx + 1, ...row]);
                });
              });

              const ws = XLSX.utils.aoa_to_sheet(consolidatedData);
              ws['!cols'] = [
                { wch: 12 },
                { wch: 8 },
                { wch: 30 },
                { wch: 25 },
                { wch: 20 },
                { wch: 20 },
                { wch: 20 },
              ];
              XLSX.utils.book_append_sheet(wb, ws, 'Datos Extraídos');
            }

            // Generar buffer binario OpenXML
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            resultBlob = new Blob([wbout], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            localUrl = URL.createObjectURL(resultBlob);
          } else {
            // FORMATO CSV (COMAS O PUNTO Y COMA)
            const delimiter = outputFormat === 'csv_semicolon' ? ';' : ',';
            let csvContent = '\uFEFF'; // BOM para UTF-8 en Excel

            if (includeHeaders) {
              csvContent += `Pagina_PDF${delimiter}Fila${delimiter}Dato_1${delimiter}Dato_2${delimiter}Dato_3\n`;
            }

            pagesData.forEach((pData) => {
              pData.rows.forEach((row, rIdx) => {
                const formattedCells = row.map((cell) => {
                  const str = String(cell).replace(/"/g, '""');
                  return `"${str}"`;
                });
                csvContent += `"${pData.pageNum}"${delimiter}${rIdx + 1}${delimiter}${formattedCells.join(delimiter)}\n`;
              });
            });

            resultBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            localUrl = URL.createObjectURL(resultBlob);
          }
        }

        const ext = outputFormat === 'xlsx' ? 'xlsx' : 'csv';
        const outName =
          conversionEngine === 'gemini' ||
          conversionEngine === 'adobe' ||
          conversionEngine === 'cloudconvert'
            ? `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`
            : `${file.name.replace(/\.[^/.]+$/, '')}_Tablas.${ext}`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl || '',
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: ext,
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
            ? `¡${totalToConvert} páginas extraídas a ${ext.toUpperCase()} con éxito!`
            : `Successfully extracted ${totalToConvert} pages to ${ext.toUpperCase()}!`,
        );
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(
        isEs ? 'Error en la conversión de hoja de cálculo.' : 'Spreadsheet conversion error.',
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
      <input
        type="file"
        accept={
          mode === 'excel-to-pdf'
            ? '.xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
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
                ? '003 / CONVERSIÓN DE TABLAS EXCEL Y PDF (CONVERSOR DUAL 2 EN 1)'
                : '003 / EXCEL & PDF TABLE CONVERSION (2-IN-1 DUAL CONVERTER)'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Table className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'excel-to-pdf'
                ? isEs
                  ? 'CONVERTIR EXCEL A PDF'
                  : 'CONVERT EXCEL TO PDF'
                : isEs
                  ? 'CONVERTIR PDF A EXCEL (CONVERSOR DUAL 2 EN 1)'
                  : 'CONVERT PDF TO EXCEL (2-IN-1 DUAL CONVERTER)'}
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
                  <Table className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Extracción de tablas completada con éxito!'
                      : 'Table extraction completed successfully!'}
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

          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat={completedResult.outputFormat}
            rawBlob={completedResult.rawBlob}
            currentToolId="excel-pdf"
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
                onClick={() => handleSwitchMode('excel-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'excel-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Table className="w-4 h-4 text-black" />
                <span>{isEs ? 'Excel a PDF (.xlsx → .pdf)' : 'Excel to PDF (.xlsx → .pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('pdf-to-excel')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-excel'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a Excel (.pdf → .xlsx)' : 'PDF to Excel (.pdf → .xlsx)'}</span>
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
                {mode === 'excel-to-pdf'
                  ? isEs
                    ? 'CONVERTIR HOJA DE EXCEL A PDF'
                    : 'CONVERT EXCEL SHEET TO PDF'
                  : isEs
                    ? 'EXTRAER TABLAS DE PDF A EXCEL (CONVERSOR DUAL 2 EN 1)'
                    : 'EXTRACT PDF TABLES TO EXCEL (2-IN-1 DUAL CONVERTER)'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'excel-to-pdf'
                  ? isEs
                    ? 'Transforma libros de Excel (.xlsx / .csv) en reportes PDF profesionales.'
                    : 'Transform Excel workbooks (.xlsx / .csv) into professional PDF reports.'
                  : isEs
                    ? 'Extrae tablas vectoriales de tu PDF a Excel (.xlsx) nativo o CSV con selector de páginas 100% en RAM.'
                    : 'Extract vector tables from PDF to native Excel (.xlsx) or CSV with page selector 100% in RAM.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'excel-to-pdf'
                    ? isEs
                      ? 'Seleccionar Hoja Excel'
                      : 'Select Excel Sheet'
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
                        {/* HOJA PDF O HOJA EXCEL EN VISTA PREVIA REDUCIDA AL 50% */}
                        {mode === 'pdf-to-excel' || file.name.toLowerCase().endsWith('.pdf') ? (
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
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
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
                          /* CUADRÍCULA EXCEL COMPACTA AL 50% VISUAL */
                          <div className="relative bg-[#18181f] text-white rounded-xl shadow-2xl border border-emerald-500/40 overflow-hidden flex flex-col p-3 transition-all duration-300 w-[280px] sm:w-[320px] h-[330px] sm:h-[358px] group justify-between">
                            <div className="space-y-2 overflow-hidden flex-1 flex flex-col">
                              <div className="flex items-center justify-between text-emerald-400 font-bold text-xs border-b border-zinc-700/80 pb-1.5 shrink-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Table className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="truncate font-sans font-extrabold text-emerald-300">
                                    {excelSheets[activeSheetIndex]?.name || 'Hoja1'}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-zinc-400 shrink-0">
                                  {excelSheets[activeSheetIndex]?.rowCount || 0} filas
                                </span>
                              </div>

                              {/* TABLA PREVIA MINI */}
                              <div className="flex-1 overflow-hidden rounded border border-zinc-800 bg-[#0e0e12] p-1 text-[9px] font-mono">
                                {excelSheets[activeSheetIndex]?.rows?.length ? (
                                  <div className="space-y-0.5">
                                    {excelSheets[activeSheetIndex].rows
                                      .slice(0, 8)
                                      .map((row: (string | number | null)[], rIdx: number) => (
                                        <div
                                          key={rIdx}
                                          className="flex gap-1 border-b border-zinc-800/60 pb-0.5 truncate text-zinc-300"
                                        >
                                          <span className="text-zinc-600 w-4 select-none shrink-0 font-bold">
                                            {rIdx + 1}
                                          </span>
                                          {row
                                            .slice(0, 4)
                                            .map((cell: string | number | null, cIdx: number) => (
                                              <span
                                                key={cIdx}
                                                className="truncate w-14 text-zinc-400"
                                              >
                                                {String(cell || '-')}
                                              </span>
                                            ))}
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-zinc-600 text-[10px] italic">
                                    {isEs ? 'Sin datos de tabla' : 'No table data'}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-1.5 border-t border-zinc-800 shrink-0">
                              <span className="text-emerald-400 font-bold">
                                {excelSheets.length} {isEs ? 'hoja(s)' : 'sheet(s)'}
                              </span>
                              <span className="bg-black/80 px-2 py-0.5 rounded text-white font-bold border border-white/20">
                                Hoja {activeSheetIndex + 1} / {excelSheets.length || 1}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* CONTROLES COMPACTOS DE PAGINACIÓN */}
                        {totalPages > 1 && (
                          <div className="flex items-center gap-3 mt-3 bg-zinc-900 border border-zinc-700/80 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 shadow-md">
                            <button
                              type="button"
                              onClick={() => {
                                if (mode === 'excel-to-pdf') {
                                  setActiveSheetIndex((i) => Math.max(0, i - 1));
                                } else {
                                  setActivePage((p) => Math.max(1, p - 1));
                                }
                              }}
                              disabled={
                                mode === 'excel-to-pdf' ? activeSheetIndex <= 0 : activePage <= 1
                              }
                              className="px-2 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                              title={isEs ? 'Anterior' : 'Previous'}
                            >
                              ◀
                            </button>
                            <span className="font-bold text-white text-[11px]">
                              {mode === 'excel-to-pdf'
                                ? `Hoja ${activeSheetIndex + 1} / ${excelSheets.length || 1}`
                                : `${activePage} / ${totalPages}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (mode === 'excel-to-pdf') {
                                  setActiveSheetIndex((i) =>
                                    Math.min(excelSheets.length - 1, i + 1),
                                  );
                                } else {
                                  setActivePage((p) => Math.min(totalPages, p + 1));
                                }
                              }}
                              disabled={
                                mode === 'excel-to-pdf'
                                  ? activeSheetIndex >= excelSheets.length - 1
                                  : activePage >= totalPages
                              }
                              className="px-2 py-0.5 hover:text-white disabled:opacity-30 transition-colors font-bold cursor-pointer"
                              title={isEs ? 'Siguiente' : 'Next'}
                            >
                              ▶
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500 font-mono text-xs">
                        <Table className="w-8 h-8 text-zinc-600" />
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
                              ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-500/10'
                              : isLoaded
                                ? 'bg-[#121217] border-zinc-700/80 hover:border-zinc-500'
                                : 'bg-[#0e0e12] border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-[#121218]'
                          }`}
                        >
                          <input
                            ref={getSlotInputRef(sIdx)}
                            type="file"
                            accept={
                              mode === 'excel-to-pdf'
                                ? '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
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
                                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                  }`}
                                >
                                  {mode === 'excel-to-pdf' ? (
                                    <Table className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                      {isEs ? `Caja ${sIdx + 1}` : `Box ${sIdx + 1}`}
                                    </span>
                                    {isActive && (
                                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40 font-bold">
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
                                      ? `+ Cargar ${mode === 'excel-to-pdf' ? 'Excel' : 'PDF'} ${sIdx + 1}`
                                      : `+ Upload ${mode === 'excel-to-pdf' ? 'Excel' : 'PDF'} ${sIdx + 1}`}
                                  </p>
                                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                                    {mode === 'excel-to-pdf' ? '.xlsx / .xls' : '.pdf'}
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
                    <h2 className="text-lg font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                      <span>{isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}</span>
                    </h2>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white shadow-sm">
                    <Sliders className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* SELECTOR VISUAL DE MOTOR DE CONVERSIÓN EN 2X2 */}
                <div className="bg-[#121217] p-3.5 sm:p-4 rounded-2xl border border-zinc-700/80 space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Motor de Conversión de Tablas' : 'Table Conversion Engine'}
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
                          ? 'Máxima precisión en fórmulas, tablas estructuradas y rangos de datos oficiales de Microsoft Excel.'
                          : 'Official Excel fidelity for formulas, structured tables & ranges.'}
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
                          ? 'Motor en la nube de alto rendimiento. Convierte hojas de cálculo complejas en formato XLSX nativo.'
                          : 'High-performance cloud engine. Converts complex spreadsheets to native XLSX.'}
                      </p>
                    </button>

                    {/* OPCIÓN 3: MOTOR LOCAL SHEETJS */}
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
                          <span>⚡ Motor Local SheetJS</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {isEs ? 'Instantáneo (~0.5s)' : 'Instant (~0.5s)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Procesamiento 100% privado en memoria. Convierte tablas y celdas sin enviar datos a servidores externos.'
                          : '100% private in-memory processing. Converts cells without sending data externally.'}
                      </p>
                    </button>

                    {/* OPCIÓN 4: MOTOR GEMINI AI */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('gemini')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'gemini'
                          ? 'bg-purple-950/50 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>🤖 Gemini AI (Reconstructor de Cuadros)</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {isEs ? 'IA Reconstructora' : 'AI Reconstructor'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Reconstruye tablas, balances y cuadrículas complejas desde cero con IA visual de alta precisión.'
                          : 'Rebuilds complex tables, balances & grids from scratch with high-precision visual AI.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* CONTENIDO DEL PANEL DE CONTROL EN 3 COLUMNAS MODULARES */}
                {mode === 'pdf-to-excel' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COL 1: SELECCIÓN DE PÁGINAS */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-white" />
                            <span>
                              {isEs ? 'Páginas a Convertir a Excel' : 'Pages to Convert to Excel'}
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
                                className="flex-1 bg-zinc-900 border border-white/20 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
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
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800 text-zinc-400">
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

                    {/* COL 2: FORMATO, ESTRUCTURA Y ESTRATEGIA */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                      {/* FORMATO Y ESTRUCTURA DE HOJAS */}
                      <div className="space-y-3">
                        <div className="bg-zinc-950 p-3 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            {isEs ? 'Formato de Salida' : 'Output Format'}
                          </label>
                          <select
                            value={outputFormat}
                            onChange={(e) =>
                              setOutputFormat(
                                e.target.value as 'xlsx' | 'csv_comma' | 'csv_semicolon',
                              )
                            }
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 px-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                          >
                            <option value="xlsx">Excel (.xlsx) - OpenXML Nativo</option>
                            <option value="csv_comma">CSV (.csv - Coma)</option>
                            <option value="csv_semicolon">CSV (.csv - Punto y coma)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-3 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-emerald-400" />
                            {isEs ? 'Organización de Hojas' : 'Sheet Organization'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSheetStructure('single')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                sheetStructure === 'single'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? '1 Sola Hoja' : '1 Single Sheet'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSheetStructure('per_page')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                sheetStructure === 'per_page'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Por Página' : 'Per Page'}
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-3 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-emerald-400" />
                            {isEs ? 'Estrategia de Detección' : 'Detection Strategy'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setExtractionStrategy('smart')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                extractionStrategy === 'smart'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Smart Grid' : 'Smart Grid'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExtractionStrategy('lineByLine')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                extractionStrategy === 'lineByLine'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Lineal' : 'Linear'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COL 3: CHECKBOXES DE AJUSTES E INFO COMPATIBILIDAD */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner flex flex-col justify-between">
                      {/* CHECKBOXES DE AJUSTES */}
                      <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2.5">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                          <input
                            type="checkbox"
                            checked={autoFormatNumbers}
                            onChange={(e) => setAutoFormatNumbers(e.target.checked)}
                            className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Convertir texto numérico a números reales'
                              : 'Convert numeric text to real numbers'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeHeaders}
                            onChange={(e) => setIncludeHeaders(e.target.checked)}
                            className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incluir fila de encabezados con nombres'
                              : 'Include header row with column labels'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                          <input
                            type="checkbox"
                            checked={trimEmptyRows}
                            onChange={(e) => setTrimEmptyRows(e.target.checked)}
                            className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Omitir filas y espacios en blanco'
                              : 'Omit empty rows and blank spaces'}
                          </span>
                        </label>
                      </div>

                      {/* INFO BOX COMPATIBILIDAD */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {isEs
                            ? 'Exportación Binaria OpenXML (.xlsx) Nativa'
                            : 'Native OpenXML Binary (.xlsx) Export'}
                        </span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          {isEs
                            ? 'Compatible al 100% con Microsoft Excel, Google Sheets, LibreOffice Calc y Apple Numbers sin advertencias.'
                            : '100% compatible with Microsoft Excel, Google Sheets, LibreOffice Calc and Numbers.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODO EXCEL A PDF */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner">
                      <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                        <Layout className="w-4 h-4 text-emerald-400" />
                        {isEs ? 'Orientación del Reporte' : 'Report Orientation'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
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
                      </div>
                    </div>

                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner">
                      <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                      </label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                      >
                        <option value="a4">A4 (Estándar)</option>
                        <option value="letter">Carta / Letter</option>
                        <option value="legal">Oficio / Legal</option>
                      </select>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 pt-2">
                        <input
                          type="checkbox"
                          checked={showGridlines}
                          onChange={(e) => setShowGridlines(e.target.checked)}
                          className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                        />
                        <span>
                          {isEs
                            ? 'Dibujar líneas de cuadrícula y bordes de celdas'
                            : 'Draw gridlines and cell borders'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

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
                          className="h-full bg-emerald-400 transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executeConversion}
                    disabled={
                      isProcessing || !file || (mode === 'pdf-to-excel' && targetPages.length === 0)
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
                          : mode === 'excel-to-pdf'
                            ? isEs
                              ? 'Convertir Excel a PDF →'
                              : 'Convert Excel to PDF →'
                            : isEs
                              ? targetPages.length === 0
                                ? 'Selecciona al menos 1 página'
                                : `Convertir ${targetPages.length} Página${targetPages.length === 1 ? '' : 's'} a Excel (.${outputFormat === 'xlsx' ? 'xlsx' : 'csv'}) →`
                              : targetPages.length === 0
                                ? 'Select at least 1 page'
                                : `Convert ${targetPages.length} Page${targetPages.length === 1 ? '' : 's'} to Excel (.${outputFormat === 'xlsx' ? 'xlsx' : 'csv'}) →`}
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
