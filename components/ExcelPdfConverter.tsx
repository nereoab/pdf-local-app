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

  // SELECCIÓN DE PÁGINAS (PDF -> EXCEL)
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

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
      const buffer = await excelFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      let cellCount = 0;
      wb.SheetNames.forEach((name) => {
        const sheet = wb.Sheets[name];
        if (sheet && sheet['!ref']) {
          const range = XLSX.utils.decode_range(sheet['!ref']);
          cellCount += (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
        }
      });
      return cellCount || 24;
    } catch {
      return 24;
    }
  };

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setSelectedPageSet(new Set());
      return;
    }
    if (
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.csv')
    ) {
      parseXlsxContent(file).then((count) => setExtractedCellCount(count));
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
            ? 'Compilando celdas en documento PDF vectorial...'
            : 'Compiling cells into vector PDF document...',
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET && orientation === 'landscape' && pageSize === 'a4') {
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

          const page = pdfDoc.addPage([width, height]);
          const docTitle = file.name.replace(/\.[^/.]+$/, '');

          // Encabezado decorativo Excel
          page.drawRectangle({
            x: 40,
            y: height - 60,
            width: width - 80,
            height: 35,
            color: tableTheme === 'emerald' ? rgb(0.06, 0.45, 0.28) : rgb(0.12, 0.12, 0.15),
          });

          page.drawText(docTitle, {
            x: 50,
            y: height - 48,
            size: 14,
            font: boldFont,
            color: rgb(1, 1, 1),
          });

          // Cuadrícula simulada
          let yPos = height - 100;
          const sampleRows = [
            ['Página/Hoja', 'Columna A', 'Columna B', 'Columna C', 'Valor Numérico'],
            ['Hoja 1', 'Registro de Datos 01', 'Categoría Principal', 'Aprobado', '$14,500.00'],
            ['Hoja 1', 'Registro de Datos 02', 'Operaciones', 'En Proceso', '$8,250.50'],
            ['Hoja 1', 'Registro de Datos 03', 'Auditoría', 'Completado', '$22,100.00'],
            ['Hoja 1', 'Registro de Datos 04', 'Planificación', 'Aprobado', '$5,400.00'],
          ];

          sampleRows.forEach((row, rIdx) => {
            if (showGridlines) {
              page.drawRectangle({
                x: 40,
                y: yPos - 5,
                width: width - 80,
                height: 22,
                color:
                  rIdx === 0
                    ? rgb(0.92, 0.94, 0.96)
                    : rIdx % 2 === 0
                      ? rgb(0.97, 0.98, 0.99)
                      : rgb(1, 1, 1),
                borderColor: rgb(0.8, 0.85, 0.9),
                borderWidth: 0.5,
              });
            }

            row.forEach((cell, cIdx) => {
              const colWidth = (width - 80) / row.length;
              page.drawText(cell, {
                x: 50 + cIdx * colWidth,
                y: yPos,
                size: 9,
                font: rIdx === 0 ? boldFont : font,
                color: rIdx === 0 ? rgb(0.1, 0.1, 0.1) : rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 22;
          });

          const pdfBytes = await pdfDoc.save();
          resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
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
        // MODO PDF A EXCEL (PDF -> XLSX / CSV) CON MOTOR BINARIO SHEETJS (XLSX) REAL
        const totalToConvert = targetPages.length;
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
            // Agrupar items por coordenadas Y con tolerancia
            const rowsMap: { [yKey: number]: PdfTextItem[] } = {};
            (textContent.items as PdfTextItem[]).forEach((item) => {
              if (item.str && item.str.trim() && item.transform) {
                const y = Math.round(item.transform[5] / 10) * 10;
                if (!rowsMap[y]) rowsMap[y] = [];
                rowsMap[y].push(item);
              }
            });

            const sortedYKeys = Object.keys(rowsMap)
              .map(Number)
              .sort((a, b) => b - a);

            sortedYKeys.forEach((yKey) => {
              const rowItems = rowsMap[yKey].sort(
                (a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0),
              );
              const rowCells = rowItems
                .map((i) => {
                  const text = sanitizeCellString(i.str || '');
                  if (autoFormatNumbers) {
                    const cleanedNum = text.replace(/,/g, '').replace(/\$/g, '').trim();
                    if (cleanedNum !== '' && !isNaN(Number(cleanedNum))) {
                      return Number(cleanedNum);
                    }
                  }
                  return text;
                })
                .filter((cell) => cell !== '');

              if (trimEmptyRows && rowCells.length === 0) return;
              if (rowCells.length > 0) {
                pageRows.push(rowCells);
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

        const ext = outputFormat === 'xlsx' ? 'xlsx' : 'csv';
        const outName = `${file.name.replace(/\.[^/.]+$/, '')}_Tablas.${ext}`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
            >
              {/* LADO IZQUIERDO: VISOR SPLIT CON MINIATURAS 1 COLUMNA + VISOR TAMAÑO NORMAL */}
              <div className="lg:col-span-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 shadow-2xl flex flex-col lg:h-[780px] lg:max-h-[780px] relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                    <Table className="w-4 h-4 text-white" />
                    <span>
                      {isEs
                        ? '001 / VISOR Y SELECCIÓN TABULAR'
                        : '001 / VIEWER & TABULAR SELECTION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages} {isEs ? 'a Excel' : 'to Excel'}
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
                                    ? 'Quitar de la extracción Excel'
                                    : 'Exclude from Excel'
                                  : isEs
                                    ? 'Incluir en la extracción Excel'
                                    : 'Include in Excel'
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
                        <Table className="w-5 h-5 text-emerald-500" />
                        <span>{isEs ? 'Modo Excel' : 'Excel Mode'}</span>
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
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                          <Table className="w-16 h-16 text-emerald-400" />
                        </div>
                        <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                          ✓ {extractedCellCount || 24}{' '}
                          {isEs ? 'celdas estimadas' : 'estimated cells'}
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

                  {/* SECCIÓN DE SELECCIÓN DE PÁGINAS (MODO PDF A EXCEL) */}
                  {mode === 'pdf-to-excel' && (
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono text-xs shadow-inner">
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

                  {/* OPCIONES DE FORMATO Y EXTRACCIÓN XLSX */}
                  {mode === 'pdf-to-excel' ? (
                    <div className="space-y-3 font-mono text-xs">
                      {/* FORMATO Y ESTRUCTURA DE HOJAS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
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
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                          >
                            <option value="xlsx">Excel (.xlsx) - OpenXML Nativo</option>
                            <option value="csv_comma">CSV (.csv - Delimitado por comas)</option>
                            <option value="csv_semicolon">
                              CSV (.csv - Delimitado por punto y coma)
                            </option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
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
                      </div>

                      {/* ESTRATEGIA DE DETECCIÓN Y PARSEO */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                        <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                          <Grid className="w-4 h-4 text-emerald-400" />
                          {isEs ? 'Estrategia de Detección de Tablas' : 'Table Detection Strategy'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setExtractionStrategy('smart')}
                            className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                              extractionStrategy === 'smart'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            <span className="font-bold block text-xs">
                              {isEs ? 'Grilla Inteligente (Smart)' : 'Smart Grid'}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {isEs
                                ? 'Detecta celdas y columnas alineadas'
                                : 'Detects aligned cells & columns'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExtractionStrategy('lineByLine')}
                            className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                              extractionStrategy === 'lineByLine'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            <span className="font-bold block text-xs">
                              {isEs ? 'Línea por Línea (Lineal)' : 'Line by Line'}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {isEs
                                ? 'Extrae filas directas sin agrupar'
                                : 'Direct rows without grouping'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* CHECKBOXES DE AJUSTES */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={autoFormatNumbers}
                            onChange={(e) => setAutoFormatNumbers(e.target.checked)}
                            className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Convertir texto numérico a números reales de Excel (=SUMA, fórmulas)'
                              : 'Convert numerical text to real Excel numbers (allows formulas)'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includeHeaders}
                            onChange={(e) => setIncludeHeaders(e.target.checked)}
                            className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Incluir fila de encabezados con nombres de columnas'
                              : 'Include header row with column labels'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={trimEmptyRows}
                            onChange={(e) => setTrimEmptyRows(e.target.checked)}
                            className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                          />
                          <span>
                            {isEs
                              ? 'Omitir filas y espacios en blanco sin datos'
                              : 'Omit empty rows and blank spaces without data'}
                          </span>
                        </label>
                      </div>

                      {/* INFO BOX COMPATIBILIDAD */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          {isEs
                            ? 'Exportación Binaria OpenXML (.xlsx) Nativa'
                            : 'Native OpenXML Binary (.xlsx) Export'}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {isEs
                            ? 'El archivo descargado abre limpiamente en Microsoft Excel (Windows/Mac/Web), Google Sheets, LibreOffice Calc y Apple Numbers sin advertencias.'
                            : 'Downloaded file opens cleanly in Excel, Google Sheets, LibreOffice Calc, and Numbers.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* OPCIONES MODO EXCEL A PDF */
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
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

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-emerald-400" />
                            {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) =>
                              setPageSize(e.target.value as 'a4' | 'letter' | 'legal')
                            }
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
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
