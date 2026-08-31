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

  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);
  const [file, setFile] = useState<File | null>(() => {
    if (!globalFile) return null;
    const name = globalFile.name.toLowerCase();
    if (defaultMode === 'pdf-to-jpg' && name.endsWith('.pdf')) return globalFile;
    if (
      defaultMode === 'jpg-to-pdf' &&
      (name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp'))
    )
      return globalFile;
    return null;
  });

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

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);

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
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      setSelectedPageSet(new Set());
      return;
    }
    if (file.name.toLowerCase().endsWith('.pdf')) {
      cargarMiniaturasPdfUltraFast(file);
    } else {
      setTotalPages(1);
    }
  }, [file]);

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

      // Lote inicial rápido (8 páginas en <100ms)
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
    const isImage =
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.png') ||
      name.endsWith('.webp');

    if (mode === 'jpg-to-pdf') {
      if (isImage) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(
          isEs ? 'Imagen cargada para empaquetado PDF' : 'Image loaded for PDF bundling',
        );
      } else {
        toast.error(
          isEs
            ? 'Por favor selecciona una imagen JPG, PNG o WebP'
            : 'Please select a JPG, PNG, or WebP image',
        );
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(
          isEs
            ? 'Archivo PDF cargado para extracción de imágenes'
            : 'PDF file loaded for image extraction',
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
            ? 'Procesando imagen a PDF con el motor seleccionado...'
            : 'Processing image to PDF with selected engine...',
        );

        if (conversionEngine === 'adobe' || conversionEngine === 'cloudconvert') {
          try {
            resultBlob = await convertWithApi(
              '/api/convert/jpg-to-pdf',
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
            setProgressPercent(40);
          }
        }

        if (!localUrl) {
          const pdfDoc = await PDFDocument.create();
          const arrayBuffer = await file.arrayBuffer();
          const isPng = file.name.toLowerCase().endsWith('.png');

          let embeddedImage;
          if (isPng) {
            embeddedImage = await pdfDoc.embedPng(arrayBuffer);
          } else {
            embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
          }

          const imgWidth = embeddedImage.width;
          const imgHeight = embeddedImage.height;

          let margin = 0;
          if (marginOption === 'small') margin = 20;
          if (marginOption === 'big') margin = 40;

          let page;
          if (autoRotate && imgWidth > imgHeight) {
            page = pdfDoc.addPage([imgWidth + margin * 2, imgHeight + margin * 2]);
          } else {
            page = pdfDoc.addPage([imgWidth + margin * 2, imgHeight + margin * 2]);
          }

          page.drawImage(embeddedImage, {
            x: margin,
            y: margin,
            width: imgWidth,
            height: imgHeight,
          });

          setProgressPercent(85);
          const pdfBytes = await pdfDoc.save();
          resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          localUrl = URL.createObjectURL(resultBlob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);

        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl || '',
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
          isEs ? '¡Imagen convertida a PDF con éxito!' : 'Image converted to PDF successfully!',
        );
      } else {
        // MODO PDF A IMÁGENES (JPG / PNG / WEBP) CON SELECTOR DE PÁGINAS
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

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        const scaleVal = dpiQuality === '300dpi' ? 3.0 : dpiQuality === '72dpi' ? 1.0 : 2.0;
        const mimeType =
          imgFormat === 'png' ? 'image/png' : imgFormat === 'webp' ? 'image/webp' : 'image/jpeg';
        const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        if (totalToConvert === 1) {
          // SOLO 1 PÁGINA SELECCIONADA -> DESCARGA DIRECTA DE LA IMAGEN
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
              ? `¡Página ${pageNum} exportada a ${ext.toUpperCase()} con éxito!`
              : `Page ${pageNum} exported to ${ext.toUpperCase()} successfully!`,
          );
        } else {
          // MÚLTIPLES PÁGINAS SELECCIONADAS -> EMPAQUETADO EN ARCHIVO ZIP
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

              const pageBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), mimeType, imageQuality);
              });

              if (pageBlob) {
                const padNum = String(pageNum).padStart(String(totalPages).length, '0');
                imgFolder.file(`${baseName}_Pagina_${padNum}.${ext}`, pageBlob);
              }
            }
            await new Promise((r) => setTimeout(r, 10));
          }

          setProgressMsg(
            isEs
              ? 'Empaquetando archivo ZIP con todas las imágenes...'
              : 'Packaging ZIP archive with all images...',
          );
          setProgressPercent(95);

          resultBlob = await zip.generateAsync({ type: 'blob' });
          localUrl = URL.createObjectURL(resultBlob);

          const outName = `${baseName}_Imagenes_${ext.toUpperCase()}.zip`;
          setDownloadFilename(outName);
          setDownloadUrl(localUrl);

          if (resultBlob && localUrl) {
            setCompletedResult({
              downloadUrl: localUrl,
              filename: outName,
              fileSize: formatFileSize(resultBlob.size),
              rawBlob: resultBlob,
              outputFormat: 'zip',
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
              ? `¡${totalToConvert} páginas exportadas y empaquetadas en ZIP con éxito!`
              : `Successfully exported and zipped ${totalToConvert} pages!`,
          );
        }
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error en la conversión de imagen.' : 'Image conversion error.');
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
          mode === 'jpg-to-pdf'
            ? '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
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
                ? '006 / EXTRACCIÓN Y CONVERSIÓN DE IMÁGENES JPG Y PDF (CONVERSOR DUAL 2 EN 1)'
                : '006 / JPG & PDF IMAGE EXTRACTION & CONVERSION (2-IN-1 DUAL CONVERTER)'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ImageIcon className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'jpg-to-pdf'
                ? isEs
                  ? 'CONVERTIR IMAGEN A PDF'
                  : 'CONVERT IMAGE TO PDF'
                : isEs
                  ? 'CONVERTIR PDF A JPG (CONVERSOR DUAL 2 EN 1)'
                  : 'CONVERT PDF TO JPG (2-IN-1 DUAL CONVERTER)'}
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
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-sm font-mono mt-0.5">
                  <AnimatedNumber value={completedResult.itemCount || 1} />{' '}
                  {isEs ? 'archivos' : 'files'}
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
            currentToolId="jpg-pdf"
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
                onClick={() => handleSwitchMode('jpg-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-jpg'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a JPG (.pdf → .jpg)' : 'PDF to JPG (.pdf → .jpg)'}</span>
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
                {mode === 'jpg-to-pdf'
                  ? isEs
                    ? 'CONVERTIR IMÁGENES A PDF'
                    : 'CONVERT IMAGES TO PDF'
                  : isEs
                    ? 'CONVERTIR PDF A IMÁGENES JPG (CONVERSOR DUAL 2 EN 1)'
                    : 'CONVERT PDF TO JPG IMAGES (2-IN-1 DUAL CONVERTER)'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'jpg-to-pdf'
                  ? isEs
                    ? 'Transforma imágenes (JPG, PNG, WebP) en documentos PDF optimizados.'
                    : 'Transform images (JPG, PNG, WebP) into optimized PDF documents.'
                  : isEs
                    ? 'Extrae y renderiza cada página de tu PDF como imagen JPG/PNG/WebP en alta resolución con selector de páginas 100% en RAM.'
                    : 'Extract and render PDF pages as high-resolution JPG/PNG/WebP images with page selector 100% in RAM.'}
              </p>
              <button
                type="button"
                className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'jpg-to-pdf'
                    ? isEs
                      ? 'Seleccionar Imagen (.jpg/.png/.webp)'
                      : 'Select Image (.jpg/.png/.webp)'
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
              {/* SECCIÓN 1: VISOR SUPERIOR SPLIT CON MINIATURAS 1 COLUMNA + VISOR TAMAÑO NORMAL */}
              <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 relative overflow-hidden h-[540px] max-h-[540px]">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                      {isEs
                        ? '001 / VISOR Y SELECCIÓN DE PÁGINAS'
                        : '001 / VIEWER & PAGE SELECTION'}
                    </span>
                    <div className="hidden sm:block h-3.5 w-px bg-zinc-700" />
                    <span className="text-xs text-zinc-300 font-bold font-sans truncate max-w-[200px] sm:max-w-[400px]">
                      {file?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[11px] shadow-sm">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages}{' '}
                    {mode === 'jpg-to-pdf'
                      ? isEs
                        ? 'a PDF'
                        : 'to PDF'
                      : isEs
                        ? 'a Imagen'
                        : 'to Image'}
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT */}
                <div className="flex-1 flex flex-row gap-4 min-h-0 overflow-hidden bg-[#121217] rounded-2xl border border-zinc-700/80 shadow-inner">
                  {/* COLUMNA IZQUIERDA: MINIATURAS EN 1 COLUMNA CON CHECKBOX */}
                  <div className="w-28 sm:w-36 md:w-44 flex-shrink-0 bg-[#0c0c0f] border-r border-zinc-800 p-2 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
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
                                ? 'border-purple-400 ring-2 ring-purple-400/40 bg-zinc-800'
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
                                  ? 'bg-purple-500 text-white shadow-md'
                                  : 'bg-black/70 text-zinc-500 hover:text-white border border-zinc-700'
                              }`}
                              title={
                                isIncluded
                                  ? isEs
                                    ? 'Quitar de la conversión'
                                    : 'Exclude from conversion'
                                  : isEs
                                    ? 'Incluir en la conversión'
                                    : 'Include in conversion'
                              }
                            >
                              {isIncluded ? (
                                <Check className="w-3 h-3 stroke-[3] text-white" />
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
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        <span>{isEs ? 'Modo Imagen' : 'Image Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF O IMAGEN EN TAMAÑO NORMAL */}
                  <div className="flex-1 bg-zinc-950 p-2 relative flex flex-col items-center justify-center overflow-hidden">
                    {mode === 'pdf-to-jpg' || (file && file.name.toLowerCase().endsWith('.pdf')) ? (
                      <PdfPageViewer
                        file={file}
                        activePage={activePage}
                        totalPages={totalPages}
                        onPageChange={(p) => setActivePage(p)}
                        pageDataUrls={pageDataUrls}
                        title={file?.name}
                        accentColor="purple"
                      />
                    ) : imagePreviewUrl ? (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                      </div>
                    ) : null}
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

                  <button
                    onClick={executeConversion}
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
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
