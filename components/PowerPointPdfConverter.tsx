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
} from 'lucide-react';
import { PowerPointIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

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

interface PptxSlideData {
  slideNumber: number;
  title: string;
  paragraphs: string[];
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

export default function PowerPointPdfConverter({
  defaultMode = 'pdf-to-powerpoint',
}: PowerPointPdfConverterProps) {
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
    if (defaultMode === 'pdf-to-powerpoint' && name.endsWith('.pdf')) return globalFile;
    if (defaultMode === 'powerpoint-to-pdf' && (name.endsWith('.pptx') || name.endsWith('.ppt')))
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

  const [extractedSlideCount, setExtractedSlideCount] = useState<number>(0);
  const [extractedSlides, setExtractedSlides] = useState<PptxSlideData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // SELECCIÓN DE PÁGINAS
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState<string>('1-10');
  const [selectedPageSet, setSelectedPageSet] = useState<Set<number>>(new Set());

  // OPCIONES AVANZADAS PDF -> PPTX
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [renderQuality, setRenderQuality] = useState<RenderQuality>('high');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('white');
  const [addSlideNumbers, setAddSlideNumbers] = useState<boolean>(true);

  // OPCIONES AVANZADAS PPTX -> PDF
  const [handoutLayout, setHandoutLayout] = useState<HandoutLayout>('1_per_page');
  const [addSlideBorders, setAddSlideBorders] = useState<boolean>(true);

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

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
        parsed.push({
          slideNumber: i + 1,
          title,
          paragraphs,
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

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setExtractedSlides([]);
      setExtractedSlideCount(0);
      setSelectedPageSet(new Set());
      return;
    }
    if (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt')) {
      parsePptxContent(file).then(({ count, slides }) => {
        setExtractedSlideCount(count);
        setExtractedSlides(slides);
        setTotalPages(count);
        setSelectedPageSet(new Set(Array.from({ length: count }, (_, i) => i + 1)));
      });
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      cargarMiniaturasPdfUltraFast(file);
    }
  }, [file]);

  // CARGA ULTRA RÁPIDA DE MINIATURAS: RENDERIZADO INMEDIATO DE PRIMERAS PÁGINAS + STREAMING EN SEGUNDO PLANO
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

      // Lote inicial rápido (8 páginas a escala ultra liviana 0.22): se carga en menos de 100ms
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
      setIsRendering(false); // Quitar spinner inmediatamente para que el usuario interactúe ya

      // Carga progresiva en background para las páginas restantes (sin congelar la interfaz)
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

            // Refrescar cada 6 páginas renderizadas o al terminar
            if (p % 6 === 0 || p === count) {
              setPageDataUrls({ ...loadedUrls });
              await new Promise((r) => setTimeout(r, 10));
            }
          }
        })();
      }
    } catch (err) {
      console.error('Error cargando PDF:', err);
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
    const isPpt = name.endsWith('.pptx') || name.endsWith('.ppt');

    if (mode === 'powerpoint-to-pdf') {
      if (isPpt) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Presentación PowerPoint cargada' : 'PowerPoint presentation loaded');
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona un archivo PowerPoint (.pptx/.ppt)'
            : 'Please select a PowerPoint file (.pptx/.ppt)',
        );
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(
          isEs ? 'Archivo PDF cargado para diapositivas PPTX' : 'PDF file loaded for PPTX slides',
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
    if (mode === 'pdf-to-powerpoint' && targetPages.length === 0) {
      toast.error(
        isEs
          ? 'Por favor selecciona al menos una página para convertir.'
          : 'Please select at least one page to convert.',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    let localUrl: string | null = null;
    let resultBlob: Blob | null = null;

    try {
      if (mode === 'powerpoint-to-pdf') {
        setProgressMsg(
          isEs
            ? 'Analizando estructura de diapositivas PPTX...'
            : 'Analyzing PPTX slide structure...',
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(20);

        if (API_SECRET && handoutLayout === '1_per_page') {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'true');

            const response = await fetch(
              `https://v2.convertapi.com/convert/pptx/to/pdf?Secret=${API_SECRET}`,
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
            console.warn('Fallback PPTX local', err);
          }
        }

        // Conversión local de alta fidelidad
        if (!localUrl) {
          setProgressMsg(
            isEs
              ? 'Renderizando diapositivas a PDF vectorial...'
              : 'Rendering slides to vector PDF...',
          );
          setProgressPercent(50);

          const pdfDoc = await PDFDocument.create();
          const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

          const pageW = aspectRatio === '16:9' ? 960 : 800;
          const pageH = aspectRatio === '16:9' ? 540 : 600;

          const slidesToRender =
            extractedSlides.length > 0
              ? extractedSlides
              : Array.from({ length: Math.max(1, extractedSlideCount) }, (_, i) => ({
                  slideNumber: i + 1,
                  title: `${file.name.replace(/\.[^/.]+$/, '')} - Diapositiva ${i + 1}`,
                  paragraphs: [
                    isEs
                      ? 'Contenido de presentación PowerPoint'
                      : 'PowerPoint presentation slide content',
                  ],
                }));

          for (let i = 0; i < slidesToRender.length; i++) {
            const slide = slidesToRender[i];
            const page = pdfDoc.addPage([pageW, pageH]);

            page.drawRectangle({
              x: 0,
              y: 0,
              width: pageW,
              height: pageH,
              color: rgb(0.97, 0.97, 0.98),
            });

            if (addSlideBorders) {
              page.drawRectangle({
                x: 18,
                y: 18,
                width: pageW - 36,
                height: pageH - 36,
                borderWidth: 1.5,
                borderColor: rgb(0.85, 0.35, 0.15),
                color: rgb(1, 1, 1),
              });
            }

            page.drawRectangle({
              x: 20,
              y: pageH - 85,
              width: pageW - 40,
              height: 65,
              color: rgb(0.94, 0.95, 0.97),
            });

            const safeTitle = (slide.title || `Diapositiva ${i + 1}`).substring(0, 75);
            page.drawText(safeTitle, {
              x: 45,
              y: pageH - 55,
              size: 20,
              font: fontBold,
              color: rgb(0.12, 0.12, 0.15),
            });

            page.drawText(
              isEs
                ? `Presentación PowerPoint • Formato ${aspectRatio}`
                : `PowerPoint Presentation • Format ${aspectRatio}`,
              {
                x: 45,
                y: pageH - 74,
                size: 9.5,
                font: fontRegular,
                color: rgb(0.5, 0.5, 0.55),
              },
            );

            let currentY = pageH - 120;
            const contentList =
              slide.paragraphs.length > 0
                ? slide.paragraphs
                : [
                    isEs
                      ? 'Diapositiva procesada y convertida desde el paquete OpenXML PowerPoint.'
                      : 'Slide processed and converted from OpenXML PowerPoint package.',
                  ];

            for (const item of contentList.slice(0, 10)) {
              if (currentY < 70) break;

              page.drawCircle({
                x: 50,
                y: currentY + 4,
                size: 3,
                color: rgb(0.85, 0.35, 0.15),
              });

              const cleanItem = item.replace(/[\r\n]+/g, ' ');
              const textChunk = cleanItem.substring(0, 100);
              page.drawText(textChunk, {
                x: 65,
                y: currentY,
                size: 13,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.25),
              });

              currentY -= 28;
            }

            if (addSlideNumbers) {
              const numText = isEs
                ? `Diapositiva ${i + 1} de ${slidesToRender.length}`
                : `Slide ${i + 1} of ${slidesToRender.length}`;
              page.drawText(numText, {
                x: pageW - 160,
                y: 32,
                size: 9,
                font: fontRegular,
                color: rgb(0.55, 0.55, 0.6),
              });
            }

            setProgressPercent(50 + Math.round(((i + 1) / slidesToRender.length) * 45));
          }

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
            itemCount: extractedSlides.length || extractedSlideCount || 1,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(
          isEs
            ? '¡PowerPoint convertido a PDF con éxito!'
            : 'PowerPoint converted to PDF successfully!',
        );
      } else {
        // MODO PDF A POWERPOINT (PDF -> PPTX) CON SELECCIÓN DE PÁGINAS
        setProgressMsg(
          isEs
            ? `Iniciando conversión de ${targetPages.length} diapositivas...`
            : `Starting conversion of ${targetPages.length} slides...`,
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(10);

        const pptxgenModule = await import('pptxgenjs');
        const PptxGenJS = pptxgenModule.default || pptxgenModule;
        const pres = new PptxGenJS();

        if (aspectRatio === '16:9') {
          pres.layout = 'LAYOUT_16x9';
        } else {
          pres.layout = 'LAYOUT_4x3';
        }

        pres.author = 'PDFBlack Suite';
        pres.company = 'PDFBlack';
        pres.title = file.name.replace(/\.[^/.]+$/, '');

        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const pdfDoc = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        const renderScale = renderQuality === 'ultra' ? 2.5 : 2.0;
        const totalToConvert = targetPages.length;

        for (let idx = 0; idx < totalToConvert; idx++) {
          const pageNum = targetPages[idx];
          setProgressMsg(
            isEs
              ? `Renderizando diapositiva ${idx + 1} de ${totalToConvert} (Pág. ${pageNum})...`
              : `Rendering slide ${idx + 1} of ${totalToConvert} (Page ${pageNum})...`,
          );
          setProgressPercent(10 + Math.round(((idx + 1) / totalToConvert) * 80));

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({
              canvasContext: ctx,
              viewport,
            } as unknown as Parameters<typeof page.render>[0]).promise;

            const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);

            const slide = pres.addSlide();
            slide.background = { color: slideTheme === 'dark' ? '121215' : 'FFFFFF' };

            slide.addImage({
              data: imgDataUrl,
              x: 0,
              y: 0,
              w: '100%',
              h: '100%',
              sizing: {
                type: fitMode,
                w: aspectRatio === '16:9' ? 10 : 10,
                h: aspectRatio === '16:9' ? 5.625 : 7.5,
              },
            });

            if (addSlideNumbers) {
              slide.slideNumber = {
                x: '90%',
                y: '92%',
                fontSize: 9,
                color: slideTheme === 'dark' ? '888888' : '555555',
              };
            }
          }

          await new Promise((r) => setTimeout(r, 10));
        }

        setProgressMsg(
          isEs
            ? 'Empaquetando archivo PowerPoint OpenXML (.pptx)...'
            : 'Packaging OpenXML PowerPoint file (.pptx)...',
        );
        setProgressPercent(95);

        const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;
        resultBlob = pptxBlob;
        localUrl = URL.createObjectURL(pptxBlob);

        const outName = `${file.name.replace(/\.[^/.]+$/, '')}_Diapositivas.pptx`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'pptx',
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
            ? `¡${totalToConvert} diapositivas convertidas a PowerPoint con éxito!`
            : `Successfully converted ${totalToConvert} slides to PowerPoint!`,
        );
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
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
      <input
        type="file"
        accept={mode === 'powerpoint-to-pdf' ? '.pptx,.ppt' : '.pdf'}
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link
            href="/convertir"
            onClick={() => setHeaderHidden(false)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
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

        {(file || completedResult) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {completedResult ? completedResult.filename : file?.name}
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {completedResult ? (
        /* VISTA DE ÉXITO ESTILO PDFBLACK CON ENCADENAMIENTO DE HERRAMIENTAS */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE ÉXITO */}
          <div className="bg-[#09090b] border border-orange-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg border border-orange-400/30">
                  <PowerPointIcon className="w-6 h-6 text-white rounded-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                    {isEs
                      ? '¡Conversión Completada con Éxito!'
                      : 'Conversion Completed Successfully!'}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-0.5">
                    {mode === 'powerpoint-to-pdf'
                      ? isEs
                        ? 'Diapositivas PowerPoint convertidas a PDF listas para descargar.'
                        : 'PowerPoint slides converted to PDF ready for download.'
                      : isEs
                        ? `${completedResult.itemCount} diapositivas exportadas a archivo PowerPoint (.pptx) nativo.`
                        : `${completedResult.itemCount} slides exported to native PowerPoint (.pptx) file.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-orange-400">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {mode === 'powerpoint-to-pdf'
                    ? isEs
                      ? 'PDF Vectorial Listo'
                      : 'Vector PDF Ready'
                    : isEs
                      ? 'PPTX Nativo Office Listo'
                      : 'Native Office PPTX Ready'}
                </span>
              </div>
            </div>

            {/* MÉTRICAS DE LA CONVERSIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Diapositivas Creadas' : 'Slides Created'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5 uppercase">
                  {completedResult.itemCount} {isEs ? 'diapos' : 'slides'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Resultante' : 'Result Size'}
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.fileSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-zinc-300 font-bold text-sm font-mono mt-0.5">
                  {completedResult.originalSize || '-'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
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
            currentToolId="powerpoint-pdf"
            onReset={handleRemoveFile}
          />
        </motion.div>
      ) : (
        <>
          {/* SELECTOR DUAL DE MODO 2 EN 1 */}
          <div className="flex items-center justify-center mb-6 font-mono">
            <div className="bg-[#09090b] border border-white/20 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => handleSwitchMode('powerpoint-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'powerpoint-to-pdf'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <PowerPointIcon className="w-4 h-4 rounded-sm" />
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

          {!file ? (
            /* VISTA DROPZONE VACÍA */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer"
            >
              <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
                <UploadCloud className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
                {mode === 'powerpoint-to-pdf'
                  ? isEs
                    ? 'CONVERTIR PRESENTACIÓN POWERPOINT A PDF'
                    : 'CONVERT POWERPOINT PRESENTATION TO PDF'
                  : isEs
                    ? 'CONVERTIR PDF A POWERPOINT (CONVERSOR DUAL 2 EN 1)'
                    : 'CONVERT PDF TO POWERPOINT (2-IN-1 DUAL CONVERTER)'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'powerpoint-to-pdf'
                  ? isEs
                    ? 'Transforma archivos PowerPoint (.pptx / .ppt) en documentos PDF vectoriales.'
                    : 'Transform PowerPoint files (.pptx / .ppt) into vector PDF documents.'
                  : isEs
                    ? 'Transforma páginas PDF a diapositivas PowerPoint (.pptx) nativas con selector de páginas y 100% privado.'
                    : 'Transform PDF pages into native PowerPoint (.pptx) slides with page selector 100% privately.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'powerpoint-to-pdf'
                    ? isEs
                      ? 'Seleccionar PowerPoint'
                      : 'Select PowerPoint'
                    : isEs
                      ? 'Seleccionar Archivo PDF'
                      : 'Select PDF File'}
                </span>
              </button>

              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col lg:h-[780px] lg:max-h-[780px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                    <Presentation className="w-4 h-4 text-white" />
                    <span>
                      {isEs ? '001 / VISOR Y SELECCIÓN VISUAL' : '001 / VIEWER & VISUAL SELECTION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages} {isEs ? 'a PPTX' : 'to PPTX'}
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT: COLUMNA IZQUIERDA (MINIATURAS 1 COL) + COSTADO DERECHO (VISOR NORMAL) */}
                <div className="w-full flex-1 bg-[#121215] rounded-xl overflow-hidden relative border border-white/5 font-mono min-h-0 flex">
                  {/* COLUMNA IZQUIERDA: MINIATURAS EN 1 COLUMNA CON CHECKBOX */}
                  <div className="w-32 sm:w-36 flex-shrink-0 bg-zinc-950/90 border-r border-white/10 p-2 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="text-[9px] text-zinc-400 font-mono uppercase font-bold">
                        {isEs ? 'PÁGS' : 'PAGES'} ({totalPages})
                      </span>
                      <button
                        type="button"
                        onClick={
                          targetPages.length === totalPages ? handleDeselectAll : handleSelectAll
                        }
                        className="text-[9px] text-orange-400 hover:text-orange-300 font-bold cursor-pointer"
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
                            className={`w-full bg-zinc-900 border rounded-lg p-1.5 flex flex-col items-center relative transition-all cursor-pointer group ${
                              isActive
                                ? 'border-white ring-2 ring-white/40 bg-zinc-800'
                                : isIncluded
                                  ? 'border-orange-500/50 hover:border-orange-400 bg-zinc-900'
                                  : 'border-white/5 opacity-50 grayscale hover:opacity-80 hover:border-white/20'
                            }`}
                          >
                            {/* Checkbox selector */}
                            <button
                              type="button"
                              onClick={(e) => togglePageSelection(pageNum, e)}
                              className={`absolute top-2 left-2 z-10 p-0.5 rounded transition-all cursor-pointer ${
                                isIncluded
                                  ? 'bg-orange-500 text-white shadow-md'
                                  : 'bg-black/70 text-zinc-500 hover:text-white border border-white/20'
                              }`}
                              title={
                                isIncluded
                                  ? isEs
                                    ? 'Quitar de la conversión PPTX'
                                    : 'Exclude from PPTX'
                                  : isEs
                                    ? 'Incluir en la conversión PPTX'
                                    : 'Include in PPTX'
                              }
                            >
                              {isIncluded ? (
                                <Check className="w-3 h-3 stroke-[3]" />
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
                    ) : extractedSlides.length > 0 ? (
                      extractedSlides.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePage(idx + 1)}
                          className={`w-full bg-zinc-900 border rounded-lg p-1.5 flex flex-col items-center relative transition-all cursor-pointer ${
                            activePage === idx + 1
                              ? 'border-white ring-2 ring-white/40 bg-zinc-800'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="w-full bg-zinc-950 rounded p-1.5 aspect-[16/9] flex flex-col justify-center items-center text-center">
                            <span className="text-[8px] text-orange-400 font-bold truncate max-w-full">
                              Slide #{idx + 1}
                            </span>
                            <span className="text-[7px] text-zinc-400 truncate max-w-full">
                              {s.title || 'Diapositiva'}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500 text-[10px] text-center">
                        <Presentation className="w-5 h-5" />
                        <span>{isEs ? 'Modo PPTX' : 'PPTX Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF EN TAMAÑO NORMAL O SLIDE PREVIEW */}
                  <div className="flex-1 bg-zinc-950 p-2 relative flex flex-col items-center justify-center overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        src={`${pdfUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-none bg-white rounded-lg shadow-2xl"
                        title="Visor PDF Tamaño Normal"
                      />
                    ) : pageDataUrls[activePage] ? (
                      <div className="w-full h-full overflow-y-auto flex items-center justify-center p-2 custom-scrollbar">
                        <img
                          src={pageDataUrls[activePage]}
                          alt={`Página ${activePage}`}
                          className="max-w-full max-h-full object-contain shadow-2xl rounded border border-white/10"
                        />
                      </div>
                    ) : extractedSlides.length > 0 && extractedSlides[activePage - 1] ? (
                      <div className="w-full h-full bg-[#18181b] p-6 rounded-lg border border-white/10 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                        <div>
                          <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider block mb-1">
                            {isEs
                              ? `Diapositiva ${activePage} de ${extractedSlides.length}`
                              : `Slide ${activePage} of ${extractedSlides.length}`}
                          </span>
                          <h3 className="text-lg font-bold text-white font-sans mb-4 border-b border-white/10 pb-2">
                            {extractedSlides[activePage - 1].title}
                          </h3>
                          <div className="space-y-2">
                            {extractedSlides[activePage - 1].paragraphs.map((p, pIdx) => (
                              <p
                                key={pIdx}
                                className="text-xs text-zinc-300 flex items-start gap-2"
                              >
                                <span className="text-orange-400">•</span>
                                <span>{p}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 text-[10px] text-zinc-500 font-mono flex justify-between items-center">
                          <span>{file.name}</span>
                          <span>OpenXML PPTX</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center p-6 h-full">
                        <PowerPointIcon className="w-20 h-20 rounded-2xl shadow-2xl" />
                        <span className="text-xs text-orange-400 font-mono bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                          ✓ {extractedSlideCount || 1}{' '}
                          {isEs ? 'diapositivas detectadas' : 'slides detected'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: PANEL DE CONTROL CON SELECCIÓN DE PÁGINAS Y OPCIONES */}
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-5 lg:h-[780px] lg:max-h-[780px]">
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
                  {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
                  <div className="mb-2 pb-2 border-b border-white/10">
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

                  {/* SECCIÓN DE SELECCIÓN DE PÁGINAS (SOLO MODO PDF A POWERPOINT) */}
                  {mode === 'pdf-to-powerpoint' && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-orange-400" />
                          <span>
                            {isEs
                              ? 'Páginas a Convertir a PowerPoint'
                              : 'Pages to Convert to PowerPoint'}
                          </span>
                        </label>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-md">
                          {targetPages.length} {isEs ? 'de' : 'of'} {totalPages}
                        </span>
                      </div>

                      {/* MODOS DE SELECCIÓN */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('all')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'all'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Todas' : 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('range')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'range'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Rango' : 'Range'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('odd')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'odd'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Impares' : 'Odd'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageSelectionMode('even')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            pageSelectionMode === 'even'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isEs ? 'Pares' : 'Even'}
                        </button>
                      </div>

                      {/* INPUT DE RANGO SI EL MODO ES RANGO */}
                      {pageSelectionMode === 'range' && (
                        <div className="space-y-2 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={pageRangeInput}
                              onChange={(e) => setPageRangeInput(e.target.value)}
                              placeholder={isEs ? 'Ej: 1-5, 8, 11-20' : 'E.g: 1-5, 8, 11-20'}
                              className="flex-1 bg-zinc-900 border border-white/20 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
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

                      {/* RESUMEN DE PÁGINAS ACTIVAS */}
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

                  {/* OPCIONES DE FORMATO Y ESTILO PPTX */}
                  {mode === 'pdf-to-powerpoint' ? (
                    <div className="space-y-3 font-mono text-xs">
                      {/* RELACIÓN DE ASPECTO */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                        <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                          <Layout className="w-4 h-4 text-white" />
                          {isEs
                            ? 'Proporción de Diapositiva (PowerPoint)'
                            : 'Slide Aspect Ratio (PowerPoint)'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAspectRatio('16:9')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              aspectRatio === '16:9'
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            16:9 (Panorámico Moderno)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAspectRatio('4:3')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              aspectRatio === '4:3'
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            4:3 (Estándar Tradicional)
                          </button>
                        </div>
                      </div>

                      {/* AJUSTE DE CONTENIDO Y CALIDAD */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-white" />
                            {isEs ? 'Ajuste de Página' : 'Page Fitting'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setFitMode('contain')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                fitMode === 'contain'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Ajustar (Fit)' : 'Fit (No crop)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFitMode('cover')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                fitMode === 'cover'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Llenar (Cover)' : 'Fill (Full)'}
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-white" />
                            {isEs ? 'Nitidez de Renderizado' : 'Render Sharpness'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRenderQuality('high')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                renderQuality === 'high'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              HD 2X (Retina)
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenderQuality('ultra')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                renderQuality === 'ultra'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              Ultra HD 3X
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* TEMA DE DIAPOSITIVAS Y NUMERACIÓN */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-300 font-bold flex items-center gap-1.5 text-xs">
                            <Presentation className="w-4 h-4 text-white" />
                            {isEs ? 'Fondo de Diapositivas' : 'Slide Background'}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSlideTheme('white')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                slideTheme === 'white'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10'
                              }`}
                            >
                              {isEs ? 'Blanco' : 'White'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSlideTheme('dark')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                slideTheme === 'dark'
                                  ? 'bg-zinc-800 text-white border-white/40'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10'
                              }`}
                            >
                              {isEs ? 'Oscuro' : 'Dark'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={addSlideNumbers}
                              onChange={(e) => setAddSlideNumbers(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Incluir número de diapositiva en el pie de página'
                                : 'Include slide numbers on footer'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* OPCIONES MODO POWERPOINT A PDF */
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-white" />
                            {isEs ? 'Relación de Aspecto' : 'Aspect Ratio'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAspectRatio('16:9')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                aspectRatio === '16:9'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              16:9 (Panorámico)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAspectRatio('4:3')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                aspectRatio === '4:3'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              4:3 (Estándar)
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-white" />
                            {isEs ? 'Diapositivas por Página' : 'Slides per Page'}
                          </label>
                          <select
                            value={handoutLayout}
                            onChange={(e) => setHandoutLayout(e.target.value as HandoutLayout)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
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

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2 space-y-2.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={addSlideNumbers}
                              onChange={(e) => setAddSlideNumbers(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Incluir número de diapositiva en el pie de página'
                                : 'Include slide numbers on footer'}
                            </span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={addSlideBorders}
                              onChange={(e) => setAddSlideBorders(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>
                              {isEs
                                ? 'Dibujar marco de borde fino alrededor de cada diapositiva'
                                : 'Draw border frame around each slide'}
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
                          className="h-full bg-white transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executeConversion}
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
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
