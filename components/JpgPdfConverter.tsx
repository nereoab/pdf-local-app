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
import { useUIStore } from '@/store/useUIStore';

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
            ? 'Optimizando imagen y compilando PDF vectorial...'
            : 'Optimizing image & compiling vector PDF...',
        );
        await new Promise((r) => setTimeout(r, 60));
        setProgressPercent(40);

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

        const pdfBytes = await pdfDoc.save();
        resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
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
          {/* BANNER DE RESULTADO Y MÉTRICAS */}
          <div className="bg-[#09090b] border border-white/20 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA CONVERSIÓN' : 'CONVERSION RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs
                      ? '¡Conversión completada con éxito!'
                      : 'Conversion completed successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {isEs ? 'Estado del proceso' : 'Process status'}
                  </div>
                  <div className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            {/* MÉTRICAS DE LA CONVERSIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono text-xs border-t border-zinc-800 mt-4">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Formato' : 'Format'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5 uppercase">
                  {completedResult.outputFormat}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Tamaño Resultante' : 'Result Size'}
                </span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {completedResult.fileSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">
                  {isEs ? 'Páginas Procesadas' : 'Processed Pages'}
                </span>
                <span className="text-zinc-300 font-bold text-sm font-mono mt-0.5">
                  {completedResult.itemCount} {isEs ? 'archivos' : 'files'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex flex-col">
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
            >
              {/* LADO IZQUIERDO: VISOR SPLIT CON MINIATURAS 1 COLUMNA + VISOR TAMAÑO NORMAL */}
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col lg:h-[780px] lg:max-h-[780px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                    <ImageIcon className="w-4 h-4 text-yellow-400" />
                    <span>
                      {isEs
                        ? '001 / VISOR Y SELECCIÓN DE PÁGINAS'
                        : '001 / VIEWER & PAGE SELECTION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-yellow-400 text-[11px]">
                    <span className="font-bold font-mono text-white">{targetPages.length}</span> /{' '}
                    {totalPages} {isEs ? 'a Imagen' : 'to Image'}
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT */}
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
                        className="text-[9px] text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer"
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
                                  ? 'border-yellow-500/50 hover:border-yellow-400 bg-zinc-900'
                                  : 'border-white/5 opacity-50 grayscale hover:opacity-80 hover:border-white/20'
                            }`}
                          >
                            {/* Checkbox selector */}
                            <button
                              type="button"
                              onClick={(e) => togglePageSelection(pageNum, e)}
                              className={`absolute top-2 left-2 z-10 p-0.5 rounded transition-all cursor-pointer ${
                                isIncluded
                                  ? 'bg-yellow-500 text-black shadow-md font-bold'
                                  : 'bg-black/70 text-zinc-500 hover:text-white border border-white/20'
                              }`}
                              title={
                                isIncluded
                                  ? isEs
                                    ? 'Quitar de la extracción de imagen'
                                    : 'Exclude from images'
                                  : isEs
                                    ? 'Incluir en la extracción de imagen'
                                    : 'Include in images'
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
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500 text-[10px] text-center">
                        <ImageIcon className="w-5 h-5 text-yellow-500" />
                        <span>{isEs ? 'Modo Imagen' : 'Image Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF O IMAGEN EN TAMAÑO NORMAL */}
                  <div className="flex-1 bg-zinc-950 p-2 relative flex flex-col items-center justify-center overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        src={`${pdfUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-none bg-white rounded-lg shadow-2xl"
                        title="Visor PDF Tamaño Normal"
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

              {/* LADO DERECHO: PANEL DE CONTROL CON SELECCIÓN DE PÁGINAS Y OPCIONES AVANZADAS */}
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
                      <Sliders className="w-4 h-4 text-yellow-400" />
                    </h2>
                  </div>

                  {/* SECCIÓN DE SELECCIÓN DE PÁGINAS (MODO PDF A JPG) */}
                  {mode === 'pdf-to-jpg' && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-yellow-400" />
                          <span>
                            {isEs ? 'Páginas a Renderizar a Imagen' : 'Pages to Render to Image'}
                          </span>
                        </label>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-md">
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

                      {/* INPUT DE RANGO */}
                      {pageSelectionMode === 'range' && (
                        <div className="space-y-2 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={pageRangeInput}
                              onChange={(e) => setPageRangeInput(e.target.value)}
                              placeholder={isEs ? 'Ej: 1-5, 8, 11-20' : 'E.g: 1-5, 8, 11-20'}
                              className="flex-1 bg-zinc-900 border border-white/20 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
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

                  {/* OPCIONES DE FORMATO Y CALIDAD DE IMAGEN */}
                  {mode === 'pdf-to-jpg' ? (
                    <div className="space-y-3 font-mono text-xs">
                      {/* FORMATO DE IMAGEN Y RESOLUCIÓN DPI */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-yellow-400" />
                            {isEs ? 'Formato de Imagen' : 'Image Format'}
                          </label>
                          <select
                            value={imgFormat}
                            onChange={(e) => setImgFormat(e.target.value as ImageFormat)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-yellow-500"
                          >
                            <option value="jpeg">JPG / JPEG (Ligero y Universal)</option>
                            <option value="png">PNG (Máxima Nitidez / Gráficos)</option>
                            <option value="webp">WebP (Compresión Web Moderna)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            {isEs ? 'Densidad y Resolución' : 'DPI Density'}
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDpiQuality('72dpi')}
                              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                dpiQuality === '72dpi'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              72 DPI
                            </button>
                            <button
                              type="button"
                              onClick={() => setDpiQuality('150dpi')}
                              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                dpiQuality === '150dpi'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              150 DPI
                            </button>
                            <button
                              type="button"
                              onClick={() => setDpiQuality('300dpi')}
                              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                dpiQuality === '300dpi'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              300 DPI
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* COMPRESIÓN Y CALIDAD */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                          <span>{isEs ? 'Calidad de Compresión Visual' : 'Visual Quality'}</span>
                          <span className="text-yellow-400 font-mono">
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
                          className="w-full accent-yellow-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{isEs ? 'Archivo Más Ligero' : 'Smaller File'}</span>
                          <span>{isEs ? 'Equilibrado' : 'Balanced'}</span>
                          <span>{isEs ? 'Ultra Nitidez' : 'Ultra Sharp'}</span>
                        </div>
                      </div>

                      {/* INFO BOX EMPAQUETADO */}
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3.5 text-xs text-yellow-400 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          {targetPages.length === 1
                            ? isEs
                              ? 'Descarga Directa de Imagen Única'
                              : 'Single Direct Image Download'
                            : isEs
                              ? `Empaquetado Automático en ZIP (${targetPages.length} imágenes)`
                              : `Automatic ZIP Bundling (${targetPages.length} images)`}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {isEs
                            ? targetPages.length === 1
                              ? 'Al exportar una sola página, se descargará directamente el archivo de imagen (.jpg/.png/.webp).'
                              : 'Las páginas seleccionadas se renderizarán a máxima resolución y se empaquetarán en un archivo comprimido .zip.'
                            : 'Selected pages render at full resolution and package into a clean .zip archive.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* OPCIONES MODO JPG A PDF */
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-yellow-400" />
                            {isEs ? 'Márgenes de Página' : 'Page Margins'}
                          </label>
                          <select
                            value={marginOption}
                            onChange={(e) => setMarginOption(e.target.value as MarginOption)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-yellow-500"
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

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-yellow-400" />
                            {isEs ? 'Orientación Automática' : 'Auto Orientation'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAutoRotate(true)}
                              className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                autoRotate
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Automática' : 'Automatic'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAutoRotate(false)}
                              className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                !autoRotate
                                  ? 'bg-white text-black border-white'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Fija' : 'Fixed'}
                            </button>
                          </div>
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
                          className="h-full bg-yellow-400 transition-all duration-300"
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
