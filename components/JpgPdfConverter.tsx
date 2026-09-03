'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import {
  FileDown,
  Loader2,
  X,
  FilePlus,
  RefreshCw,
  UploadCloud,
  Repeat,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Grid,
  Compass,
  Image as ImageIcon,
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
  Eye,
  Layers,
} from 'lucide-react';
import { JpgIcon } from './ProgramIcons';
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

type ConversionDirection = 'jpg-to-pdf' | 'pdf-to-jpg';
type ImageFormat = 'jpeg' | 'png' | 'webp';
type DpiQuality = '300dpi' | '150dpi' | '72dpi';
type MarginOption = 'none' | 'small' | 'big';
type PageSelectionMode = 'all' | 'range' | 'custom' | 'even' | 'odd';

interface JpgPdfConverterProps {
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

interface FileSlot {
  id: number;
  file: File | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  totalPages: number;
  activePage: number;
  pageDataUrls: Record<number, string>;
  isRendering?: boolean;
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

async function getEmbeddableImageBytes(
  file: File,
): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg' }> {
  const isPng = file.name.toLowerCase().endsWith('.png');
  const isJpg =
    file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
  const arrayBuffer = await file.arrayBuffer();

  if (isPng) return { bytes: new Uint8Array(arrayBuffer), format: 'png' };
  if (isJpg) return { bytes: new Uint8Array(arrayBuffer), format: 'jpg' };

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ bytes: new Uint8Array(arrayBuffer), format: 'png' });
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve({ bytes: new Uint8Array(arrayBuffer), format: 'png' });
          return;
        }
        const buf = await blob.arrayBuffer();
        resolve({ bytes: new Uint8Array(buf), format: 'png' });
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ bytes: new Uint8Array(arrayBuffer), format: 'png' });
    };
    img.src = url;
  });
}

export default function JpgPdfConverter({ defaultMode = 'pdf-to-jpg' }: JpgPdfConverterProps) {
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
    },
    {
      id: 1,
      file: null,
      previewUrl: null,
      thumbnailUrl: null,
      totalPages: 0,
      activePage: 1,
      pageDataUrls: {},
    },
    {
      id: 2,
      file: null,
      previewUrl: null,
      thumbnailUrl: null,
      totalPages: 0,
      activePage: 1,
      pageDataUrls: {},
    },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const slotInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // ARCHIVO Y METADATOS DE LA CAJA ACTIVA (SE VINCULAN CON LA SECCIÓN 2 INTACTA)
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
  const loadedSlots = useMemo(() => slots.filter((s) => s.file !== null), [slots]);

  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // SELECCIÓN DE PÁGINAS (PDF -> JPG)
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // MOTOR DE CONVERSIÓN
  const [conversionEngine, setConversionEngine] = useState<
    'adobe' | 'cloudconvert' | 'local' | 'hd'
  >('adobe');

  // OPCIONES AVANZADAS PDF -> JPG
  const [imgFormat, setImgFormat] = useState<ImageFormat>('jpeg');
  const [dpiQuality, setDpiQuality] = useState<DpiQuality>('150dpi');
  const [imageQuality, setImageQuality] = useState<number>(0.92);

  // OPCIONES AVANZADAS JPG -> PDF
  const [marginOption, setMarginOption] = useState<MarginOption>('none');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const pdfUrl = useMemo(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const imagePreviewUrl = useMemo(() => {
    if (!file || file.name.toLowerCase().endsWith('.pdf')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [pdfUrl, imagePreviewUrl]);

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
    if (totalPages > 0) {
      setSelectedPageSet(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
      setPageRangeInput(totalPages > 10 ? `1-${Math.min(10, totalPages)}` : `1-${totalPages}`);
    }
  }, [activeSlotIndex, totalPages]);

  // CARGA DE METADATOS Y MINIATURA (ESCALA 0.5) PARA UNA CAJA ESPECÍFICA
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

      // Render de la página 1 a escala 0.50 (súper miniatura a mitad de tamaño)
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

      if (slotIndex === activeSlotIndex) {
        setSelectedPageSet(new Set(Array.from({ length: count }, (_, i) => i + 1)));
        setPageRangeInput(count > 10 ? `1-${Math.min(10, count)}` : `1-${count}`);
      }
    } catch (err) {
      console.error('Error al cargar metadatos de PDF:', err);
    }
  };

  // RENDERIZA LA PÁGINA ACTIVA A ESCALA 0.5 CUANDO SE CAMBIA DE PÁGINA
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

  // CARGA DE ARCHIVOS EN LAS CAJAS
  const loadFilesIntoSlots = (fileList: File[] | FileList, specificSlotIndex?: number) => {
    const validFiles: File[] = [];
    const filesArray = Array.from(fileList);

    for (const f of filesArray) {
      const name = f.name.toLowerCase();
      const isPdf = name.endsWith('.pdf');
      const isImg =
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp');

      if (mode === 'jpg-to-pdf' && isImg) {
        validFiles.push(f);
      } else if (mode === 'pdf-to-jpg' && isPdf) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      toast.error(
        mode === 'jpg-to-pdf'
          ? isEs
            ? 'Por favor selecciona imágenes válidas (JPG, PNG, WebP)'
            : 'Please select valid images (JPG, PNG, WebP)'
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
        if (prevUrl && !next[specificSlotIndex].file?.name.toLowerCase().endsWith('.pdf')) {
          URL.revokeObjectURL(prevUrl);
        }

        const newPreviewUrl = f.name.toLowerCase().endsWith('.pdf') ? null : URL.createObjectURL(f);
        next[specificSlotIndex] = {
          id: specificSlotIndex,
          file: f,
          previewUrl: newPreviewUrl,
          thumbnailUrl: newPreviewUrl,
          totalPages: 1,
          activePage: 1,
          pageDataUrls: {},
          isRendering: f.name.toLowerCase().endsWith('.pdf'),
        };

        if (f.name.toLowerCase().endsWith('.pdf')) {
          loadPdfMetadataForSlot(specificSlotIndex, f);
        }
      } else {
        let validIdx = 0;
        for (let i = 0; i < 3; i++) {
          if (validIdx >= validFiles.length) break;
          if (!next[i].file) {
            const f = validFiles[validIdx];
            const prevUrl = next[i].previewUrl;
            if (prevUrl && !next[i].file?.name.toLowerCase().endsWith('.pdf')) {
              URL.revokeObjectURL(prevUrl);
            }

            const newPreviewUrl = f.name.toLowerCase().endsWith('.pdf')
              ? null
              : URL.createObjectURL(f);
            next[i] = {
              id: i,
              file: f,
              previewUrl: newPreviewUrl,
              thumbnailUrl: newPreviewUrl,
              totalPages: 1,
              activePage: 1,
              pageDataUrls: {},
              isRendering: f.name.toLowerCase().endsWith('.pdf'),
            };

            if (f.name.toLowerCase().endsWith('.pdf')) {
              loadPdfMetadataForSlot(i, f);
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
        ? `${validFiles.length} archivo(s) listo(s) en las cajas`
        : `${validFiles.length} file(s) ready in boxes`,
    );
  };

  const initialGlobalFileLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!globalFile || initialGlobalFileLoadedRef.current) return;
    const name = globalFile.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isImg =
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.png') ||
      name.endsWith('.webp');

    if ((defaultMode === 'pdf-to-jpg' && isPdf) || (defaultMode === 'jpg-to-pdf' && isImg)) {
      initialGlobalFileLoadedRef.current = true;
      loadFilesIntoSlots([globalFile], 0);
    }
  }, [globalFile, defaultMode]);

  useEffect(() => {
    return () => {
      slots.forEach((s) => {
        if (s.previewUrl && !s.file?.name.toLowerCase().endsWith('.pdf')) {
          URL.revokeObjectURL(s.previewUrl);
        }
      });
    };
  }, [slots]);

  const handleClearSlot = (slotIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      if (
        next[slotIndex].previewUrl &&
        !next[slotIndex].file?.name.toLowerCase().endsWith('.pdf')
      ) {
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
      if (s.previewUrl && !s.file?.name.toLowerCase().endsWith('.pdf')) {
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
      },
      {
        id: 1,
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        totalPages: 0,
        activePage: 1,
        pageDataUrls: {},
      },
      {
        id: 2,
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        totalPages: 0,
        activePage: 1,
        pageDataUrls: {},
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
    setFileInput(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const setFileInput = (_: unknown) => {};

  const handleRemoveFile = () => {
    handleClearAllSlots();
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

  const executeConversion = async (onlyActiveFile: boolean = false) => {
    const readySlots =
      onlyActiveFile && file
        ? slots.filter((s) => s.id === activeSlotIndex && s.file !== null)
        : slots.filter((s) => s.file !== null);
    if (readySlots.length === 0) return;
    if (mode === 'pdf-to-jpg' && targetPages.length === 0) {
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
      if (mode === 'jpg-to-pdf') {
        setProgressMsg(
          isEs
            ? `Procesando ${readySlots.length} imagen(es) a PDF con el motor seleccionado...`
            : `Processing ${readySlots.length} image(s) to PDF with selected engine...`,
        );

        if (
          readySlots.length === 1 &&
          (conversionEngine === 'adobe' || conversionEngine === 'cloudconvert')
        ) {
          try {
            resultBlob = await convertWithApi(
              '/api/convert/jpg-to-pdf',
              readySlots[0].file!,
              { engine: conversionEngine },
              (pct, msg) => {
                setProgressPercent(pct);
                setProgressMsg(msg);
              },
            );
            localUrl = URL.createObjectURL(resultBlob);
          } catch (apiErr) {
            console.warn('API conversion error, attempting fallback:', apiErr);
            setProgressPercent(40);
          }
        }

        if (!localUrl) {
          const pdfDoc = await PDFDocument.create();
          let margin = 0;
          if (marginOption === 'small') margin = 20;
          if (marginOption === 'big') margin = 40;

          for (let i = 0; i < readySlots.length; i++) {
            const currentFile = readySlots[i].file!;
            const pct = Math.round(15 + ((i + 1) / readySlots.length) * 70);
            setProgressPercent(pct);
            setProgressMsg(
              isEs
                ? `Incrustando imagen ${i + 1} de ${readySlots.length} (${currentFile.name})...`
                : `Embedding image ${i + 1} of ${readySlots.length} (${currentFile.name})...`,
            );

            const { bytes, format } = await getEmbeddableImageBytes(currentFile);
            let embeddedImage;
            if (format === 'png') {
              embeddedImage = await pdfDoc.embedPng(bytes);
            } else {
              embeddedImage = await pdfDoc.embedJpg(bytes);
            }

            const imgWidth = embeddedImage.width;
            const imgHeight = embeddedImage.height;

            const page = pdfDoc.addPage([imgWidth + margin * 2, imgHeight + margin * 2]);
            page.drawImage(embeddedImage, {
              x: margin,
              y: margin,
              width: imgWidth,
              height: imgHeight,
            });
          }

          setProgressPercent(85);
          const pdfBytes = await pdfDoc.save();
          resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          localUrl = URL.createObjectURL(resultBlob);
        }

        const baseName = readySlots[0].file!.name.replace(/\.[^/.]+$/, '');
        const outName =
          readySlots.length === 1
            ? `${baseName}.pdf`
            : `${baseName}_Combinado_${readySlots.length}_imagenes.pdf`;

        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl || '',
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'pdf',
            originalSize: formatFileSize(
              readySlots.reduce((acc, s) => acc + (s.file?.size || 0), 0),
            ),
            itemCount: readySlots.length,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs ? '¡Imagen convertida a PDF con éxito!' : 'Image converted to PDF successfully!',
        );
      } else {
        // MODO PDF A IMÁGENES (HASTA 3 PDFs)
        if (readySlots.length === 1) {
          // Si solo hay 1 PDF cargado, usamos el flujo exacto original
          const currentFile = readySlots[0].file!;
          const totalToConvert = targetPages.length;
          setProgressMsg(
            isEs
              ? `Inicializando renderizado de ${totalToConvert} páginas...`
              : `Initializing render for ${totalToConvert} pages...`,
          );
          await new Promise((r) => setTimeout(r, 60));
          setProgressPercent(15);

          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const arrayBuffer = await currentFile.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({
            data: arrayBuffer.slice(0),
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
          }).promise;

          const scaleVal = dpiQuality === '300dpi' ? 3.0 : dpiQuality === '72dpi' ? 1.0 : 2.0;
          const mimeType =
            imgFormat === 'png' ? 'image/png' : imgFormat === 'webp' ? 'image/webp' : 'image/jpeg';
          const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;
          const baseName = currentFile.name.replace(/\.[^/.]+$/, '');

          if (totalToConvert === 1) {
            const pageNum = targetPages[0];
            setProgressMsg(
              isEs
                ? `Renderizando página ${pageNum} a ${dpiQuality}...`
                : `Rendering page ${pageNum} at ${dpiQuality}...`,
            );
            setProgressPercent(60);

            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: scaleVal });
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

              resultBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), mimeType, imageQuality);
              });
              if (resultBlob) {
                localUrl = URL.createObjectURL(resultBlob);
              }
            }

            const outName = `${baseName}_Pagina_${pageNum}.${ext}`;
            setDownloadFilename(outName);
            setDownloadUrl(localUrl);

            if (resultBlob && localUrl) {
              setCompletedResult({
                downloadUrl: localUrl,
                filename: outName,
                fileSize: formatFileSize(resultBlob.size),
                rawBlob: resultBlob,
                outputFormat: ext,
                originalSize: formatFileSize(currentFile.size),
                itemCount: 1,
              });
              setHeaderHidden(true);
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }
            toast.success(
              isEs
                ? `¡Página ${pageNum} exportada a ${ext.toUpperCase()} con éxito!`
                : `Page ${pageNum} exported to ${ext.toUpperCase()} successfully!`,
            );
          } else {
            const zip = new JSZip();
            const imgFolder = zip.folder('imagenes') || zip;

            for (let idx = 0; idx < totalToConvert; idx++) {
              const pageNum = targetPages[idx];
              const pct = Math.round(15 + ((idx + 1) / totalToConvert) * 75);
              setProgressPercent(pct);
              setProgressMsg(
                isEs
                  ? `Renderizando pág. ${idx + 1} de ${totalToConvert} (Pág. ${pageNum} a ${dpiQuality})...`
                  : `Rendering page ${idx + 1} of ${totalToConvert} (Page ${pageNum} at ${dpiQuality})...`,
              );

              const page = await pdfDoc.getPage(pageNum);
              const viewport = page.getViewport({ scale: scaleVal });
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

                const blob = await new Promise<Blob | null>((resolve) => {
                  canvas.toBlob((b) => resolve(b), mimeType, imageQuality);
                });
                if (blob) {
                  const arrayBuf = await blob.arrayBuffer();
                  imgFolder.file(`${baseName}_Pagina_${pageNum}.${ext}`, arrayBuf);
                }
              }
            }

            setProgressPercent(95);
            setProgressMsg(
              isEs ? 'Generando paquete ZIP descargable...' : 'Packaging downloadable ZIP...',
            );
            const zipBlob = await zip.generateAsync({
              type: 'blob',
              compression: 'DEFLATE',
              compressionOptions: { level: 6 },
            });
            localUrl = URL.createObjectURL(zipBlob);
            resultBlob = zipBlob;

            const outName = `${baseName}_Imagenes_${totalToConvert}_Pags.zip`;
            setDownloadFilename(outName);
            setDownloadUrl(localUrl);

            setCompletedResult({
              downloadUrl: localUrl,
              filename: outName,
              fileSize: formatFileSize(zipBlob.size),
              rawBlob: zipBlob,
              outputFormat: 'zip',
              originalSize: formatFileSize(currentFile.size),
              itemCount: totalToConvert,
            });
            setHeaderHidden(true);
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            toast.success(
              isEs
                ? `¡${totalToConvert} páginas exportadas a ZIP con éxito!`
                : `${totalToConvert} pages exported to ZIP successfully!`,
            );
          }
        } else {
          // Múltiples PDFs en paralelo
          const zip = new JSZip();
          let totalRendered = 0;
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const scaleVal = dpiQuality === '300dpi' ? 3.0 : dpiQuality === '72dpi' ? 1.0 : 2.0;
          const mimeType =
            imgFormat === 'png' ? 'image/png' : imgFormat === 'webp' ? 'image/webp' : 'image/jpeg';
          const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;

          for (let sIdx = 0; sIdx < readySlots.length; sIdx++) {
            const currentSlot = readySlots[sIdx];
            const currentFile = currentSlot.file!;
            const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
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

            const targetFolder = zip.folder(baseName) || zip;

            for (let pIdx = 0; pIdx < pagesToExport.length; pIdx++) {
              const pNum = pagesToExport[pIdx];
              totalRendered++;
              const pct = Math.min(
                92,
                Math.round(20 + (totalRendered / (readySlots.length * 4)) * 70),
              );
              setProgressPercent(pct);
              setProgressMsg(
                isEs
                  ? `[${currentFile.name}] Exportando pág. ${pNum}...`
                  : `[${currentFile.name}] Exporting page ${pNum}...`,
              );

              const page = await pdfDoc.getPage(pNum);
              const viewport = page.getViewport({ scale: scaleVal });
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
              }

              const imgBlob: Blob | null = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), mimeType, imageQuality);
              });

              if (imgBlob) {
                const imgBytes = await imgBlob.arrayBuffer();
                targetFolder.file(`Pagina_${pNum}.${ext}`, imgBytes);
              }
            }
          }

          setProgressPercent(95);
          setProgressMsg(isEs ? 'Comprimiendo archivo ZIP...' : 'Compressing ZIP package...');
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          localUrl = URL.createObjectURL(zipBlob);

          const outName = `Imagenes_Exportadas_${readySlots.length}_PDFs.zip`;
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
            itemCount: totalRendered,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);

          toast.success(
            isEs
              ? `¡${totalRendered} imágenes exportadas a ZIP con éxito!`
              : `${totalRendered} images exported to ZIP successfully!`,
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(isEs ? 'Error en la conversión.' : 'Conversion error.');
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full font-sans">
      {/* INPUTS ESPECÍFICOS PARA LAS 3 CAJAS INDEPENDIENTES */}
      {slots.map((s, idx) => (
        <input
          key={s.id}
          type="file"
          accept={mode === 'jpg-to-pdf' ? '.jpg,.jpeg,.png,.webp' : '.pdf'}
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
        accept={mode === 'jpg-to-pdf' ? '.jpg,.jpeg,.png,.webp' : '.pdf'}
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
          {/* SECCIÓN SUPERIOR CON BOTÓN VOLVER Y NOMBRE DE LA HERRAMIENTA (COMO EN LA SEGUNDA IMAGEN) */}
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
                  {mode === 'pdf-to-jpg'
                    ? isEs
                      ? '001 / EXTRACCIÓN Y RASTERIZADO'
                      : '001 / EXTRACTION & RASTER'
                    : isEs
                      ? '001 / EMPAQUETADO VECTORIAL'
                      : '001 / VECTOR PACKAGING'}
                </span>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
                  <Sparkles className="w-6 h-6 text-white flex-shrink-0" />
                  {mode === 'pdf-to-jpg'
                    ? isEs
                      ? 'CONVERTIR PDF A IMAGEN'
                      : 'CONVERT PDF TO IMAGE'
                    : isEs
                      ? 'CONVERTIR IMAGEN A PDF'
                      : 'CONVERT IMAGE TO PDF'}
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
                  <ImageIcon className="w-7 h-7 text-[#FAF6EE] drop-shadow-[0_0_10px_rgba(250,246,238,0.4)]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#E8DFCF]/90 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs
                      ? '¡Conversión completada con éxito!'
                      : 'Conversion completed successfully!'}
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
                  {isEs ? 'Archivos Procesados' : 'Processed Files'}
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
            currentToolId="jpg-pdf"
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
                  {mode === 'pdf-to-jpg'
                    ? isEs
                      ? '001 / EXTRACCIÓN Y RASTERIZADO (CONVERSOR DUAL 2 EN 1)'
                      : '001 / EXTRACTION & RASTER (2-IN-1 DUAL CONVERTER)'
                    : isEs
                      ? '001 / EMPAQUETADO VECTORIAL (CONVERSOR DUAL 2 EN 1)'
                      : '001 / VECTOR PACKAGING (2-IN-1 DUAL CONVERTER)'}
                </span>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
                  {mode === 'pdf-to-jpg' ? (
                    <JpgIcon className="w-6 h-6 rounded-sm flex-shrink-0" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white rounded-sm flex-shrink-0" />
                  )}
                  {mode === 'pdf-to-jpg'
                    ? isEs
                      ? 'CONVERTIR PDF A IMAGEN (CONVERSOR DUAL 2 EN 1)'
                      : 'CONVERT PDF TO IMAGE (2-IN-1 DUAL CONVERTER)'
                    : isEs
                      ? 'CONVERTIR IMAGEN A PDF (CONVERSOR DUAL 2 EN 1)'
                      : 'CONVERT IMAGE TO PDF (2-IN-1 DUAL CONVERTER)'}
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

          {/* SELECTOR DE MODO EN CÁPSULAS */}
          <div className="flex items-center justify-center mb-6 font-mono text-center">
            <div className="bg-[#09090b] border border-zinc-700 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => handleSwitchMode('jpg-to-pdf')}
                className={`px-5 sm:px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'jpg-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-black" />
                <span>{isEs ? 'Imagen a PDF (.jpg → .pdf)' : 'Image to PDF (.jpg → .pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('pdf-to-jpg')}
                className={`px-5 sm:px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-jpg'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a Imagen (.pdf → .jpg)' : 'PDF to JPG (.pdf → .jpg)'}</span>
              </button>
            </div>
          </div>
          {/* ZONA DE CARGA INICIAL (SI NINGUNA CAJA TIENE ARCHIVO) */}
          {loadedSlots.length === 0 ? (
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
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700 hover:border-zinc-500 rounded-3xl p-10 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[460px]"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              <div className="p-6 bg-zinc-900 border border-zinc-700 rounded-2xl text-purple-400 group-hover:scale-110 group-hover:border-purple-400/50 transition-all duration-300 shadow-xl mb-4">
                {mode === 'jpg-to-pdf' ? (
                  <ImageIcon className="w-12 h-12 text-purple-400" />
                ) : (
                  <JpgIcon className="w-12 h-12" />
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                {mode === 'jpg-to-pdf'
                  ? isEs
                    ? 'Arrastra hasta 3 imágenes aquí'
                    : 'Drop up to 3 images here'
                  : isEs
                    ? 'Arrastra hasta 3 PDFs aquí'
                    : 'Drop up to 3 PDFs here'}
              </h2>

              <p className="text-zinc-400 text-xs sm:text-sm font-mono max-w-md mb-6">
                {mode === 'jpg-to-pdf'
                  ? isEs
                    ? 'Admite imágenes JPG, PNG o WebP. Se habilitarán 3 cajas independientes para procesar tus archivos a la vez.'
                    : 'Supports JPG, PNG, or WebP images. 3 independent boxes will be available to process at once.'
                  : isEs
                    ? 'Sube hasta 3 archivos PDF. Previsualiza la página a mitad de tamaño y exporta a JPG/PNG.'
                    : 'Upload up to 3 PDF files. Preview pages at half size and export to JPG/PNG.'}
              </p>

              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-full font-sans text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/20 cursor-pointer"
              >
                <FilePlus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'jpg-to-pdf'
                    ? isEs
                      ? 'Seleccionar Imágenes (Hasta 3)'
                      : 'Select Images (Up to 3)'
                    : isEs
                      ? 'Seleccionar PDFs (Hasta 3)'
                      : 'Select PDFs (Up to 3)'}
                </span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700/80 text-zinc-400 text-[11px] font-mono rounded-full mt-6 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {isEs
                    ? '3 CAJAS INDEPENDIENTES • VISTA AL 50% • 100% LOCAL'
                    : '3 INDEPENDENT BOXES • 50% PREVIEW • 100% LOCAL'}
                </span>
              </div>
            </motion.div>
          ) : (
            /* ── PANTALLA PRINCIPAL: VISTA PREVIA (SECCIÓN 1) + PANEL DE CONTROL (SECCIÓN 2) ── */
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
                        {/* HOJA EN VISTA PREVIA REDUCIDA AL 50% (SÚPER MINIATURA COMPACTA) */}
                        <div className="relative bg-white rounded-xl shadow-2xl border border-zinc-400/80 overflow-hidden flex items-center justify-center transition-all duration-300 w-[240px] sm:w-[260px] h-[330px] sm:h-[358px] group">
                          {mode === 'pdf-to-jpg' || file.name.toLowerCase().endsWith('.pdf') ? (
                            activeSlot.pageDataUrls[activePage] ? (
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
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                <span className="text-[11px] font-mono font-bold">
                                  Pág. {activePage}
                                </span>
                              </div>
                            )
                          ) : activeSlot.previewUrl ? (
                            <img
                              src={activeSlot.previewUrl}
                              alt="Vista previa"
                              className="w-full h-full object-contain select-none"
                            />
                          ) : null}

                          {/* INDICADOR DE PÁGINA EN LA ESQUINA */}
                          {totalPages > 0 && (
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                              #{activePage} / {totalPages}
                            </div>
                          )}
                        </div>

                        {/* CONTROLES COMPACTOS DE PAGINACIÓN DEBAJO DE LA HOJA (SI MULTIPÁGINA) */}
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
                        <div className="w-[200px] h-[280px] border-2 border-dashed border-zinc-700/80 rounded-xl flex flex-col items-center justify-center gap-3 group-hover:border-purple-400/80 group-hover:bg-zinc-900/30 transition-all">
                          <UploadCloud className="w-8 h-8 text-zinc-600 group-hover:text-purple-400 transition-colors" />
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
                              ? 'bg-[#181824] border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                              : isFilled
                                ? 'bg-[#121217] border-zinc-700 hover:border-zinc-500'
                                : 'bg-[#0e0e12]/60 border-dashed border-zinc-700/80 hover:border-purple-400 hover:bg-zinc-900/40'
                          }`}
                        >
                          {isFilled ? (
                            <>
                              {/* Miniatura cuadrada de la caja */}
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
                                ) : (
                                  <FileText className="w-7 h-7 text-purple-600" />
                                )}
                              </div>

                              {/* Información del archivo */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-purple-300 border border-zinc-700">
                                    {isEs ? `Caja ${idx + 1}` : `Box ${idx + 1}`}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800">
                                      {isEs ? 'En Pantalla (50%)' : 'On Screen (50%)'}
                                    </span>
                                  )}
                                </div>
                                <p
                                  onClick={() => setActiveSlotIndex(idx)}
                                  className="text-white text-xs font-bold truncate cursor-pointer hover:text-purple-300 transition-colors"
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
                                        {slot.totalPages} {isEs ? 'págs' : 'pages'}
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
                                      ? 'bg-purple-600 text-white shadow-md'
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
                              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-purple-400 group-hover:border-purple-400/40 transition-all">
                                <FilePlus className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-zinc-300 group-hover:text-white font-mono block">
                                  {mode === 'jpg-to-pdf'
                                    ? isEs
                                      ? `+ Cargar Imagen ${idx + 1}`
                                      : `+ Load Image ${idx + 1}`
                                    : isEs
                                      ? `+ Cargar PDF ${idx + 1}`
                                      : `+ Load PDF ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {mode === 'jpg-to-pdf' ? 'JPG, PNG, WebP' : 'Archivo PDF'}
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
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span>
                        {isEs ? 'Motor de Procesamiento de Imagen' : 'Image Processing Engine'}
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
                          ? 'Máxima fidelidad oficial en rasterizado y conversión de imágenes vectoriales y fotografías.'
                          : 'Official cloud fidelity for vector rasterization & photographic images.'}
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
                          ? 'Motor en la nube de alta disponibilidad. Procesamiento limpio y optimizado para cualquier formato gráfico.'
                          : 'High-performance cloud processing for clean graphics and photos.'}
                      </p>
                    </button>

                    {/* OPCIÓN 3: MOTOR LOCAL PDF.JS */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('local')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'local'
                          ? 'bg-purple-950/50 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
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
                          ? 'Renderizado directo en memoria del navegador sin subir imágenes ni documentos a servidores externos.'
                          : 'Direct in-browser memory rendering without uploading files externally.'}
                      </p>
                    </button>

                    {/* OPCIÓN 4: MOTOR RENDER ULTRA HD */}
                    <button
                      type="button"
                      onClick={() => setConversionEngine('hd')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        conversionEngine === 'hd'
                          ? 'bg-pink-950/50 border-pink-400 ring-1 ring-pink-400/50 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <span>📊 Render Ultra HD (300 DPI)</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {isEs ? '300 DPI Vector' : '300 DPI Vector'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {isEs
                          ? 'Extracción y rasterizado en alta resolución gráfica para impresiones y diseño editorial.'
                          : 'High-resolution graphic rasterization for print & editorial design.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* GRID DE OPCIONES MODULARES EN 3 COLUMNAS */}
                {mode === 'pdf-to-jpg' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COLUMNA 1: SELECCIÓN DE PÁGINAS */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-purple-400" />
                            <span>{isEs ? 'Páginas a Renderizar' : 'Pages to Render'}</span>
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
                                ? 'bg-purple-500 text-white border-purple-500 shadow-md'
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
                                ? 'bg-purple-500 text-white border-purple-500 shadow-md'
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
                                ? 'bg-purple-500 text-white border-purple-500 shadow-md'
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
                                ? 'bg-purple-500 text-white border-purple-500 shadow-md'
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
                              className="w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
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

                    {/* COLUMNA 2: FORMATO DE IMAGEN Y RESOLUCIÓN DPI */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-purple-400" />
                            {isEs ? 'Formato de Imagen' : 'Image Format'}
                          </label>
                          <select
                            value={imgFormat}
                            onChange={(e) => setImgFormat(e.target.value as ImageFormat)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                          >
                            <option value="jpeg">JPG / JPEG (Ligero y Universal)</option>
                            <option value="png">PNG (Máxima Nitidez / Gráficos)</option>
                            <option value="webp">WebP (Compresión Web Moderna)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            {isEs ? 'Densidad y Resolución' : 'DPI Density'}
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDpiQuality('72dpi')}
                              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                dpiQuality === '72dpi'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              72 DPI
                            </button>
                            <button
                              type="button"
                              onClick={() => setDpiQuality('150dpi')}
                              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                dpiQuality === '150dpi'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              150 DPI
                            </button>
                            <button
                              type="button"
                              onClick={() => setDpiQuality('300dpi')}
                              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                dpiQuality === '300dpi'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                              }`}
                            >
                              300 DPI
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 3: COMPRESIÓN E INFORMACIÓN DE EMPAQUETADO */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                          <span>{isEs ? 'Calidad de Compresión' : 'Visual Quality'}</span>
                          <span className="text-purple-400 font-mono">
                            {Math.round(imageQuality * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.0"
                          step="0.05"
                          value={imageQuality}
                          onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{isEs ? 'Ligero' : 'Light'}</span>
                          <span>{isEs ? 'Equilibrado' : 'Balanced'}</span>
                          <span>{isEs ? 'Ultra' : 'Ultra'}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {targetPages.length === 1
                            ? isEs
                              ? 'Descarga Directa de Imagen'
                              : 'Single Direct Image Download'
                            : isEs
                              ? `Empaquetado ZIP (${targetPages.length} imágenes)`
                              : `ZIP Package (${targetPages.length} images)`}
                        </span>
                        <p className="text-[10px] text-zinc-400 leading-snug">
                          {isEs
                            ? targetPages.length === 1
                              ? 'Exportación directa de 1 archivo de imagen.'
                              : 'Todas las páginas se renderizan y descargan en un ZIP ordenado.'
                            : 'All pages render directly into an organized ZIP archive.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODO JPG A PDF EN 3 COLUMNAS */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* COLUMNA 1: MÁRGENES DE PÁGINA */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                          <Grid className="w-4 h-4 text-purple-400" />
                          {isEs ? 'Márgenes de Página' : 'Page Margins'}
                        </label>
                        <select
                          value={marginOption}
                          onChange={(e) => setMarginOption(e.target.value as MarginOption)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                        >
                          <option value="none">
                            {isEs ? 'Sin márgenes (Ajuste Completo)' : 'No margins (Full Fit)'}
                          </option>
                          <option value="small">
                            {isEs ? 'Márgenes pequeños (20px)' : 'Small margins (20px)'}
                          </option>
                          <option value="big">
                            {isEs ? 'Márgenes amplios (40px)' : 'Big margins (40px)'}
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* COLUMNA 2: ORIENTACIÓN AUTOMÁTICA */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-zinc-300 font-bold block mb-1.5 flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-purple-400" />
                          {isEs ? 'Orientación de Página' : 'Orientation'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAutoRotate(true)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              autoRotate
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Automática' : 'Automatic'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAutoRotate(false)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              !autoRotate
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {isEs ? 'Fija' : 'Fixed'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 3: COMPATIBILIDAD */}
                    <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 shadow-inner flex flex-col justify-between">
                      <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-[10px] text-zinc-300 font-mono">
                          {isEs
                            ? 'Conversión sin pérdida de píxeles a formato estándar PDF/A'
                            : 'Lossless pixel conversion to standard PDF/A'}
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
                          className="h-full bg-purple-500 transition-all duration-300"
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
                        className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white py-3.5 px-4 rounded-2xl font-sans font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-purple-600/30 hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                        )}
                        <span>
                          {isProcessing
                            ? progressMsg
                            : mode === 'jpg-to-pdf'
                              ? isEs
                                ? `⚡ Convertir los ${loadedSlots.length} Archivos a PDF (Combinado) →`
                                : `⚡ Convert all ${loadedSlots.length} Files to PDF →`
                              : isEs
                                ? `⚡ Convertir los ${loadedSlots.length} Archivos a la vez (ZIP) →`
                                : `⚡ Convert all ${loadedSlots.length} Files at once (ZIP) →`}
                        </span>
                      </button>

                      {/* BOTÓN SECUNDARIO: CONVERTIR SOLO EL ARCHIVO ACTIVO */}
                      <button
                        type="button"
                        onClick={() => executeConversion(true)}
                        disabled={
                          isProcessing ||
                          !file ||
                          (mode === 'pdf-to-jpg' && targetPages.length === 0)
                        }
                        className="sm:w-auto px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-2xl font-sans font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        title={isEs ? `Procesar solo ${file?.name}` : `Process only ${file?.name}`}
                      >
                        <Eye className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[240px]">
                          {isEs
                            ? mode === 'jpg-to-pdf'
                              ? `Solo esta imagen →`
                              : `Solo archivo activo (${targetPages.length} pág${targetPages.length === 1 ? '' : 's'}) →`
                            : mode === 'jpg-to-pdf'
                              ? `Only this image →`
                              : `Only active file (${targetPages.length} pg${targetPages.length === 1 ? '' : 's'}) →`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => executeConversion(false)}
                      disabled={
                        isProcessing || !file || (mode === 'pdf-to-jpg' && targetPages.length === 0)
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
                            : mode === 'jpg-to-pdf'
                              ? isEs
                                ? 'Convertir Imagen a PDF →'
                                : 'Convert Image to PDF →'
                              : isEs
                                ? targetPages.length === 0
                                  ? 'Selecciona al menos 1 página'
                                  : targetPages.length === 1
                                    ? `Exportar 1 Página a .${imgFormat === 'jpeg' ? 'jpg' : imgFormat} →`
                                    : `Exportar ${targetPages.length} Páginas a ZIP (.${imgFormat === 'jpeg' ? 'jpg' : imgFormat}) →`
                                : targetPages.length === 0
                                  ? 'Select at least 1 page'
                                  : targetPages.length === 1
                                    ? `Export 1 Page to .${imgFormat === 'jpeg' ? 'jpg' : imgFormat} →`
                                    : `Export ${targetPages.length} Pages to ZIP (.${imgFormat === 'jpeg' ? 'jpg' : imgFormat}) →`}
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
