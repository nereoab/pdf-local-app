'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  FileDown, Loader2, X, FilePlus, RefreshCw, UploadCloud, Repeat, 
  Sliders, ChevronDown, ChevronUp, Sparkles, Grid, Compass, Image as ImageIcon,
  ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus, FileText
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

export default function JpgPdfConverter({ defaultMode = 'pdf-to-jpg' }: JpgPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
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
    if (defaultMode === 'jpg-to-pdf' && (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp'))) return globalFile;
    return null;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  // OPCIONES AVANZADAS
  const [imgFormat, setImgFormat] = useState<ImageFormat>('jpeg');
  const [dpiQuality, setDpiQuality] = useState<DpiQuality>('150dpi');
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

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      return;
    }
    if (file.name.toLowerCase().endsWith('.pdf')) {
      cargarMiniaturasPdf(file);
    }
  }, [file]);

  const cargarMiniaturasPdf = async (pdfFile: File) => {
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

      setTotalPages(pdfDoc.numPages);
      const urls: Record<number, string> = {};
      for (let p = 1; p <= pdfDoc.numPages; p++) {
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
            urls[p] = canvas.toDataURL('image/jpeg', 0.8);
          }
        } catch {}
      }
      setPageDataUrls(urls);
    } catch (err) {
      console.error(err);
    } finally {
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
    const isImage = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');

    if (mode === 'jpg-to-pdf') {
      if (isImage) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Imagen cargada para empaquetado PDF' : 'Image loaded for PDF bundling');
      } else {
        toast.error(isEs ? 'Por favor selecciona una imagen JPG, PNG o WebP' : 'Please select a JPG, PNG, or WebP image');
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo PDF cargado para extracción HD JPG' : 'PDF file loaded for HD JPG extraction');
      } else {
        toast.error(isEs ? 'Por favor selecciona un archivo PDF (.pdf)' : 'Please select a PDF file (.pdf)');
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
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(15);
    let localUrl: string | null = null;
    let resultBlob: Blob | null = null;

    try {
      if (mode === 'jpg-to-pdf') {
        setProgressMsg(isEs ? 'Incrustando mapa de píxeles HD en lienzo PDF...' : 'Embedding HD pixel map into PDF canvas...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.create();
        
        let embeddedImage;
        const name = file.name.toLowerCase();
        if (name.endsWith('.png')) {
          embeddedImage = await pdfDoc.embedPng(arrayBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
        }

        const dims = embeddedImage.scale(1);
        const marginPx = marginOption === 'small' ? 20 : (marginOption === 'big' ? 40 : 0);
        
        const pageW = dims.width + marginPx * 2;
        const pageH = dims.height + marginPx * 2;

        const page = pdfDoc.addPage([pageW, pageH]);
        page.drawImage(embeddedImage, {
          x: marginPx,
          y: marginPx,
          width: dims.width,
          height: dims.height,
        });

        const pdfBytes = await pdfDoc.save();
        resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        localUrl = URL.createObjectURL(resultBlob);

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
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
        toast.success(isEs ? '¡Imagen convertida a PDF con éxito!' : 'Image converted to PDF successfully!');

      } else {
        setProgressMsg(isEs ? 'Iniciando motor de renderizado PDF...' : 'Starting PDF rendering engine...');
        setProgressPercent(20);

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const scaleVal = dpiQuality === '300dpi' ? 3.0 : (dpiQuality === '72dpi' ? 1.0 : 2.0);
        const mimeType = imgFormat === 'png' ? 'image/png' : (imgFormat === 'webp' ? 'image/webp' : 'image/jpeg');
        const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;
        const baseName = file.name.replace(/\.[^/.]+$/, "");

        if (numPages === 1) {
          setProgressMsg(isEs ? 'Renderizando lámina en alta resolución...' : 'Rendering high resolution page...');
          setProgressPercent(50);

          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: scaleVal });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
            
            resultBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), mimeType, 0.95);
            });
            if (!resultBlob) {
              const dataUrl = canvas.toDataURL(mimeType, 0.95);
              const res = await fetch(dataUrl);
              resultBlob = await res.blob();
            }
            localUrl = URL.createObjectURL(resultBlob);
          }

          const outName = `${baseName}_Pagina1.${ext}`;
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
          toast.success(isEs ? `¡Lámina PDF convertida a ${ext.toUpperCase()} con éxito!` : `PDF page converted to ${ext.toUpperCase()} successfully!`);

        } else {
          // Multi-page PDF: render each page and bundle into a ZIP
          const zip = new JSZip();
          const imgFolder = zip.folder("imagenes") || zip;

          for (let p = 1; p <= numPages; p++) {
            const pct = Math.round(20 + ((p / numPages) * 70));
            setProgressPercent(pct);
            setProgressMsg(isEs ? `Renderizando página ${p} de ${numPages} (${ext.toUpperCase()})...` : `Rendering page ${p} of ${numPages} (${ext.toUpperCase()})...`);

            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: scaleVal });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
              const pageBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), mimeType, 0.95);
              });

              if (pageBlob) {
                const padNum = String(p).padStart(String(numPages).length, '0');
                imgFolder.file(`${baseName}_Pagina_${padNum}.${ext}`, pageBlob);
              }
            }
          }

          setProgressMsg(isEs ? 'Empaquetando archivo ZIP con todas las imágenes...' : 'Packaging ZIP archive with all images...');
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
              itemCount: numPages,
            });
            setHeaderHidden(true);
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }
          toast.success(isEs ? `¡${numPages} páginas extraídas y empaquetadas en ZIP con éxito!` : `Successfully extracted and zipped ${numPages} pages!`);
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
    <div ref={topHeaderRef} className="w-full flex flex-col font-mono text-white selection:bg-white selection:text-black">
      <input 
        type="file" 
        accept={mode === 'jpg-to-pdf' ? ".jpg,.jpeg,.png,.webp" : ".pdf"} 
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
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "003 / CONVERSIÓN DE IMÁGENES Y PDF (CONVERSOR DUAL 2 EN 1)" : "003 / IMAGE & PDF CONVERSION (2-IN-1 DUAL CONVERTER)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ImageIcon className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'jpg-to-pdf' 
                ? (isEs ? "CONVERTIR JPG A PDF" : "CONVERT JPG TO PDF") 
                : (isEs ? "CONVERTIR PDF A JPG (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO JPG (2-IN-1 DUAL CONVERTER)")}
            </h1>
          </div>
        </div>

        {(file || completedResult) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{completedResult ? completedResult.filename : file?.name}</span>
            </div>
            <button 
              onClick={handleRemoveFile} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Quitar archivo" : "Remove file"}
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
          <div className="bg-[#09090b] border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono">
            {/* Glow background accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg border border-indigo-400/30">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                    {isEs ? '¡Conversión Completada con Éxito!' : 'Conversion Completed Successfully!'}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-0.5">
                    {mode === 'jpg-to-pdf'
                      ? (isEs ? 'Imagen empaquetada en PDF de alta resolución listo para descargar.' : 'Image packaged into high-resolution PDF ready for download.')
                      : (isEs ? 'Lámina PDF renderizada a imagen de alta definición con éxito.' : 'PDF page rendered into high-definition image successfully.')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{mode === 'jpg-to-pdf' ? (isEs ? 'PDF HD Listo' : 'HD PDF Ready') : (isEs ? 'Imagen 300 DPI Lista' : '300 DPI Image Ready')}</span>
              </div>
            </div>

            {/* MÉTRICAS DE LA CONVERSIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Formato de Salida' : 'Output Format'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5 uppercase">
                  {completedResult.outputFormat}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Tamaño Resultante' : 'Result Size'}</span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {completedResult.fileSize}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Tamaño Original' : 'Original Size'}</span>
                <span className="text-zinc-300 font-bold text-sm font-mono mt-0.5">
                  {completedResult.originalSize || '-'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Procesamiento' : 'Processing'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? '100% Local' : '100% Local'}
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
            <div className="bg-[#09090b] border border-white/20 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button" onClick={() => handleSwitchMode('jpg-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'jpg-to-pdf' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <JpgIcon className="w-4 h-4 rounded-sm" />
                <span>{isEs ? 'JPG a PDF (.jpg → .pdf)' : 'JPG to PDF (.jpg → .pdf)'}</span>
              </button>

              <button
                type="button" onClick={() => handleSwitchMode('pdf-to-jpg')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-jpg' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
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
              className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer"
            >
              <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
                <UploadCloud className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
                {mode === 'jpg-to-pdf'
                  ? (isEs ? "CONVERTIR IMÁGENES A PDF" : "CONVERT IMAGES TO PDF")
                  : (isEs ? "CONVERTIR PDF A JPG (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO JPG (2-IN-1 DUAL CONVERTER)")}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'jpg-to-pdf'
                  ? (isEs ? "Empaqueta imágenes JPG, PNG o WebP en documentos PDF de alta resolución." : "Pack JPG, PNG or WebP images into high resolution PDF documents.")
                  : (isEs ? "Extrae páginas de tu PDF como imágenes HD (JPG, PNG, WebP) de forma 100% confidencial y local." : "Extract PDF pages as HD images 100% locally.")}
              </p>
              <button 
                type="button"
                className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'jpg-to-pdf'
                    ? (isEs ? "Seleccionar Imagen" : "Select Image")
                    : (isEs ? "Seleccionar Archivo PDF" : "Select PDF File")}
                </span>
              </button>

              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span>
              </div>
            </motion.div>
          ) : (
            /* VISTA PRINCIPAL CON PREVISUALIZACIÓN Y PANEL DE CONTROL (ALTURA SIMÉTRICA) */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch"
            >
              {/* LADO IZQUIERDO: VISOR SPLIT CON MINIATURAS 1 COLUMNA + VISOR TAMAÑO NORMAL */}
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col lg:h-[760px] lg:max-h-[760px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                    <ImageIcon className="w-4 h-4 text-white" />
                    <span>{isEs ? `001 / VISOR CON MINIATURAS Y TAMAÑO NORMAL` : `001 / THUMBNAILS & FULL SIZE VIEWER`}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                  </div>
                </div>

                {/* CONTENEDOR PRINCIPAL SPLIT: COLUMNA IZQUIERDA (MINIATURAS 1 COL) + COSTADO DERECHO (VISOR NORMAL) */}
                <div className="w-full flex-1 bg-[#121215] rounded-xl overflow-hidden relative border border-white/5 font-mono min-h-0 flex">
                  {/* COLUMNA IZQUIERDA: MINIATURAS EN 1 COLUMNA */}
                  <div className="w-28 sm:w-32 flex-shrink-0 bg-zinc-950/90 border-r border-white/10 p-2 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                    <span className="text-[9px] text-zinc-400 font-mono uppercase text-center font-bold pb-1 border-b border-white/10">
                      {isEs ? 'PÁGS (1 COL)' : 'PAGES (1 COL)'}
                    </span>
                    {isRendering ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-400 text-[10px]">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>...</span>
                      </div>
                    ) : totalPages > 0 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setActivePage(pageNum)}
                          className={`w-full bg-zinc-900 border rounded-lg p-1.5 flex flex-col items-center relative transition-all cursor-pointer ${
                            activePage === pageNum ? 'border-white ring-2 ring-white/40 bg-zinc-800' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="w-full bg-white rounded overflow-hidden aspect-[1/1.4] relative flex items-center justify-center">
                            {pageDataUrls[pageNum] ? (
                              <img src={pageDataUrls[pageNum]} alt={`Pág ${pageNum}`} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-zinc-500 font-mono">#{pageNum}</span>
                            )}
                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[8px] px-1 py-0.2 rounded">
                              #{pageNum}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500 text-[10px] text-center">
                        <ImageIcon className="w-5 h-5" />
                        <span>{isEs ? 'Modo Imagen' : 'Image Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF EN TAMAÑO NORMAL O PREVIEW DE IMAGEN */}
                  <div className="flex-1 bg-zinc-950 p-2 relative flex flex-col items-center justify-center overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        src={`${pdfUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-none bg-white rounded-lg shadow-2xl"
                        title="Visor PDF Tamaño Normal"
                      />
                    ) : imagePreviewUrl ? (
                      <div className="w-full h-full overflow-y-auto flex items-center justify-center p-2 custom-scrollbar">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreviewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded border border-white/10" />
                      </div>
                    ) : pageDataUrls[activePage] ? (
                      <div className="w-full h-full overflow-y-auto flex items-center justify-center p-2 custom-scrollbar">
                        <img
                          src={pageDataUrls[activePage]}
                          alt={`Página ${activePage}`}
                          className="max-w-full max-h-full object-contain shadow-2xl rounded border border-white/10"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center p-6 h-full">
                        <JpgIcon className="w-20 h-20 rounded-2xl shadow-2xl" />
                        <span className="text-xs text-pink-400 font-mono bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20">
                          ✓ {isEs ? 'Imagen cargada' : 'Image loaded'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: PANEL DE CONTROL */}
              <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6 lg:h-[760px] lg:max-h-[760px]">
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
                  {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
                  <div className="mb-4 pb-3 border-b border-white/10">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                      {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                    </span>
                    <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                      <span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span>
                      <Sliders className="w-5 h-5 text-white" />
                    </h2>
                  </div>

                  {/* OPCIONES SEGÚN EL MODO */}
                  {mode === 'jpg-to-pdf' ? (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-white" />
                            {isEs ? 'Márgenes del PDF' : 'PDF Margins'}
                          </label>
                          <select
                            value={marginOption} onChange={(e) => setMarginOption(e.target.value as MarginOption)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="none">{isEs ? 'Sin márgenes (Sangrado total)' : 'No margins (Full bleed)'}</option>
                            <option value="small">{isEs ? 'Margen pequeño (20px)' : 'Small margin (20px)'}</option>
                            <option value="big">{isEs ? 'Margen amplio (40px)' : 'Big margin (40px)'}</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-white" />
                            {isEs ? 'Ajuste de Orientación' : 'Orientation Adjustment'}
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Auto-detectar relación de aspecto de la foto' : 'Auto-detect photo aspect ratio'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-white" />
                            {isEs ? 'Formato de Imagen' : 'Image Format'}
                          </label>
                          <select
                            value={imgFormat} onChange={(e) => setImgFormat(e.target.value as ImageFormat)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="jpeg">JPG / JPEG (Ligero)</option>
                            <option value="png">PNG (Sin pérdida / Transparente)</option>
                            <option value="webp">WebP (Alta compresión web)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-white" />
                            {isEs ? 'Calidad / Resolución DPI' : 'DPI Quality'}
                          </label>
                          <select
                            value={dpiQuality} onChange={(e) => setDpiQuality(e.target.value as DpiQuality)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="300dpi">{isEs ? '300 DPI (Calidad de Impresión HQ)' : '300 DPI (High Quality Print)'}</option>
                            <option value="150dpi">{isEs ? '150 DPI (Estándar Balanceado)' : '150 DPI (Standard)'}</option>
                            <option value="72dpi">{isEs ? '72 DPI (Optimizado para Web)' : '72 DPI (Web Optimized)'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
                <div className="pt-4 border-t border-white/10 font-sans">
                  {isProcessing && (
                    <div className="mb-3 space-y-1.5 font-mono">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                        <span className="truncate max-w-[200px]">{progressMsg}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                        <div style={{ width: `${progressPercent}%` }} className="h-full bg-white transition-all duration-300" />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={executeConversion} 
                    disabled={isProcessing || !file} 
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <RefreshCw className="w-5 h-5 text-black" />}
                    <span>
                      {isProcessing 
                        ? progressMsg 
                        : (!file 
                            ? (isEs ? 'Selecciona un archivo' : 'Select a file') 
                            : (mode === 'jpg-to-pdf' 
                                ? (isEs ? 'Convertir a PDF con Opciones →' : 'Convert to PDF with Options →') 
                                : (isEs ? 'Convertir a Imagen con Opciones →' : 'Convert to Image with Options →')))}
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
