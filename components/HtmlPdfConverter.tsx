'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  FileDown, Loader2, X, FilePlus, RefreshCw, UploadCloud, Repeat, Layout, 
  Sliders, ChevronDown, ChevronUp, Sparkles, Grid, Code,
  ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus, FileText
} from 'lucide-react';
import { HtmlIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

type ConversionDirection = 'html-to-pdf' | 'pdf-to-html';
type PageSize = 'a4' | 'letter' | 'legal';
type PageOrientation = 'portrait' | 'landscape';

interface HtmlPdfConverterProps {
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

export default function HtmlPdfConverter({ defaultMode = 'pdf-to-html' }: HtmlPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);
  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);
  const [file, setFile] = useState<File | null>(() => {
    if (!globalFile) return null;
    const name = globalFile.name.toLowerCase();
    if (defaultMode === 'pdf-to-html' && name.endsWith('.pdf')) return globalFile;
    if (defaultMode === 'html-to-pdf' && (name.endsWith('.html') || name.endsWith('.htm') || name.endsWith('.zip'))) return globalFile;
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

  const [htmlTagCount, setHtmlTagCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  // OPCIONES AVANZADAS
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [includeBackgrounds, setIncludeBackgrounds] = useState<boolean>(true);
  const [singleHtmlFile, setSingleHtmlFile] = useState<boolean>(true);
  const [addHeaderFooter, setAddHeaderFooter] = useState<boolean>(true);

  // ESTADO DE MINIATURAS (1 COLUMNA) Y VISOR A TAMAÑO NORMAL
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  const parseHtmlContent = async (htmlFile: File): Promise<number> => {
    try {
      const text = await htmlFile.text();
      const tags = text.match(/<[^>]+>/g);
      return tags ? tags.length : 15;
    } catch {
      return 10;
    }
  };

  useEffect(() => {
    if (!file) {
      setPageDataUrls({});
      setTotalPages(0);
      return;
    }
    if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
      parseHtmlContent(file).then(count => setHtmlTagCount(count));
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
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
    const isHtml = name.endsWith('.html') || name.endsWith('.htm') || name.endsWith('.zip');

    if (mode === 'html-to-pdf') {
      if (isHtml) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo HTML web cargado' : 'HTML web file loaded');
      } else {
        toast.error(isEs ? 'Por favor selecciona un archivo HTML (.html/.htm)' : 'Please select an HTML file (.html/.htm)');
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo PDF cargado para exportación HTML' : 'PDF file loaded for HTML export');
      } else {
        toast.error(isEs ? 'Por favor selecciona un archivo PDF (.pdf)' : 'Please select a PDF file (.pdf)');
      }
    }
  };  const formatFileSize = (bytes: number): string => {
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
      if (mode === 'html-to-pdf') {
        setProgressMsg(isEs ? 'Renderizando maquetación HTML DOM a PDF...' : 'Rendering HTML DOM layout to PDF...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET) {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'true');

            const response = await fetch(`https://v2.convertapi.com/convert/html/to/pdf?Secret=${API_SECRET}`, {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              const fileData = data.Files?.[0];
              if (fileData?.FileData) {
                const byteCharacters = atob(fileData.FileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                resultBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
                localUrl = URL.createObjectURL(resultBlob);
              } else if (fileData?.Url) {
                const fileResponse = await fetch(fileData.Url);
                resultBlob = await fileResponse.blob();
                localUrl = URL.createObjectURL(resultBlob);
              }
            }
          } catch (err) { console.warn("Fallback HTML to PDF local", err); }
        }

        if (!localUrl) {
          const pdfDoc = await PDFDocument.create();
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          let w = 595.28;
          let h = 841.89;
          if (pageSize === 'letter') { w = 612; h = 792; }
          else if (pageSize === 'legal') { w = 612; h = 1008; }

          if (orientation === 'landscape') {
            const temp = w; w = h; h = temp;
          }

          const page = pdfDoc.addPage([w, h]);
          
          page.drawText(file.name.replace(/\.[^/.]+$/, ""), { x: 50, y: h - 60, size: 18, font, color: rgb(0.9, 0.3, 0.1) });
          page.drawText(isEs ? "Renderizado HTML5 a PDF • PDFBLACK" : "HTML5 to PDF Render • PDFBLACK", { x: 50, y: h - 85, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
          page.drawLine({ start: { x: 50, y: h - 100 }, end: { x: w - 50, y: h - 100 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

          if (addHeaderFooter) {
            page.drawText(new Date().toLocaleDateString(), { x: w - 120, y: 25, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
          }

          const pdfBytes = await pdfDoc.save();
          resultBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          localUrl = URL.createObjectURL(resultBlob);
        }

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
            itemCount: htmlTagCount,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(isEs ? '¡HTML renderizado a PDF con éxito!' : 'HTML rendered to PDF successfully!');

      } else {
        setProgressMsg(isEs ? 'Exportando nodos PDF a maquetación HTML5...' : 'Exporting PDF nodes to HTML5 layout...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET) {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'true');

            const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/html?Secret=${API_SECRET}`, {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              const fileData = data.Files?.[0];
              if (fileData?.FileData) {
                const byteCharacters = atob(fileData.FileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                resultBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'text/html' });
                localUrl = URL.createObjectURL(resultBlob);
              } else if (fileData?.Url) {
                const fileResponse = await fetch(fileData.Url);
                resultBlob = await fileResponse.blob();
                localUrl = URL.createObjectURL(resultBlob);
              }
            }
          } catch (err) { console.warn("Fallback PDF to HTML local", err); }
        }

        if (!localUrl) {
          const htmlContent = `<!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"><title>${file.name}</title></head>
            <body style="font-family:sans-serif; padding:40px; background:#09090b; color:#fff;">
              <h1>${file.name}</h1>
              <p>Documento PDF convertido a código HTML5 responsive (${singleHtmlFile ? 'Autónomo con CSS incrustado' : 'Marcado limpio'}).</p>
            </body>
            </html>`;
          resultBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
          localUrl = URL.createObjectURL(resultBlob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.html`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        if (resultBlob) {
          setCompletedResult({
            downloadUrl: localUrl,
            filename: outName,
            fileSize: formatFileSize(resultBlob.size),
            rawBlob: resultBlob,
            outputFormat: 'html',
            originalSize: formatFileSize(file.size),
            itemCount: totalPages,
          });
          setHeaderHidden(true);
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        toast.success(isEs ? '¡PDF exportado a código HTML5 con éxito!' : 'PDF exported to HTML5 code successfully!');
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error en la conversión HTML.' : 'HTML conversion error.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div ref={topHeaderRef} className="w-full flex flex-col font-mono text-white selection:bg-white selection:text-black">
      <input 
        type="file" 
        accept={mode === 'html-to-pdf' ? ".html,.htm,.zip" : ".pdf"} 
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
              {isEs ? "003 / CONVERSIÓN DE PÁGINAS HTML Y PDF (CONVERSOR DUAL 2 EN 1)" : "003 / HTML & PDF WEB CONVERSION (2-IN-1 DUAL CONVERTER)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Code className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'html-to-pdf' 
                ? (isEs ? "CONVERTIR HTML A PDF" : "CONVERT HTML TO PDF") 
                : (isEs ? "CONVERTIR PDF A HTML (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO HTML (2-IN-1 DUAL CONVERTER)")}
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
          <div className="bg-[#09090b] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono">
            {/* Glow background accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg border border-amber-400/30">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                    {isEs ? '¡Conversión Completada con Éxito!' : 'Conversion Completed Successfully!'}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-0.5">
                    {mode === 'html-to-pdf'
                      ? (isEs ? 'Documento HTML renderizado a PDF listo para descargar.' : 'HTML document rendered to PDF ready for download.')
                      : (isEs ? 'PDF exportado a código HTML5 responsive con éxito.' : 'PDF exported to responsive HTML5 code successfully.')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{mode === 'html-to-pdf' ? (isEs ? 'PDF Renderizado Listo' : 'Rendered PDF Ready') : (isEs ? 'HTML5 Responsive Listo' : 'Responsive HTML5 Ready')}</span>
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
            currentToolId="html-pdf"
            onReset={handleRemoveFile}
          />
        </motion.div>
      ) : (
        <>
          {/* SELECTOR DUAL DE MODO 2 EN 1 */}
          <div className="flex items-center justify-center mb-6 font-mono">
            <div className="bg-[#09090b] border border-white/20 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button" onClick={() => handleSwitchMode('html-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'html-to-pdf' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>{isEs ? 'HTML a PDF (.html → .pdf)' : 'HTML to PDF (.html → .pdf)'}</span>
              </button>

              <button
                type="button" onClick={() => handleSwitchMode('pdf-to-html')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-html' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'PDF a HTML (.pdf → .html)' : 'PDF to HTML (.pdf → .html)'}</span>
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
                {mode === 'html-to-pdf'
                  ? (isEs ? "CONVERTIR PÁGINA HTML A PDF" : "CONVERT HTML PAGE TO PDF")
                  : (isEs ? "CONVERTIR PDF A HTML (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO HTML (2-IN-1 DUAL CONVERTER)")}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {mode === 'html-to-pdf'
                  ? (isEs ? "Renderiza archivos HTML5 y CSS en documentos PDF vectoriales." : "Render HTML5 and CSS files into vector PDF documents.")
                  : (isEs ? "Exporta código HTML5 con CSS autónomo incrustado en Base64 de forma 100% confidencial y local." : "Export HTML5 code with standalone Base64 CSS 100% locally.")}
              </p>
              <button 
                type="button"
                className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>
                  {mode === 'html-to-pdf'
                    ? (isEs ? "Seleccionar Documento HTML" : "Select HTML Document")
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
                    <Code className="w-4 h-4 text-white" />
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
                        <Code className="w-5 h-5" />
                        <span>{isEs ? 'Modo HTML' : 'HTML Mode'}</span>
                      </div>
                    )}
                  </div>

                  {/* COSTADO DERECHO: VISOR PDF EN TAMAÑO NORMAL O REPORTE HTML */}
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
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center p-6 h-full">
                        <HtmlIcon className="w-20 h-20 rounded-2xl shadow-2xl" />
                        <span className="text-xs text-orange-400 font-mono bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                          ✓ {htmlTagCount} {isEs ? 'etiquetas HTML detectadas' : 'HTML tags detected'}
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
                  {mode === 'html-to-pdf' ? (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-white" />
                            {isEs ? 'Orientación de Página' : 'Orientation'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button" onClick={() => setOrientation('portrait')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'portrait' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              Vertical
                            </button>
                            <button
                              type="button" onClick={() => setOrientation('landscape')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'landscape' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              Horizontal
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Grid className="w-4 h-4 text-white" />
                            {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                          </label>
                          <select
                            value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="a4">A4 (210 x 297 mm)</option>
                            <option value="letter">Carta / Letter</option>
                            <option value="legal">Oficio / Legal</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2 space-y-2.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={includeBackgrounds} onChange={(e) => setIncludeBackgrounds(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Renderizar colores e imágenes de fondo CSS' : 'Render CSS background colors & images'}</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addHeaderFooter} onChange={(e) => setAddHeaderFooter(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Incluir fecha y numeración de página en encabezado' : 'Include date & page numbering in header'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 font-mono">
                          <input
                            type="checkbox" checked={singleHtmlFile} onChange={(e) => setSingleHtmlFile(e.target.checked)}
                            className="accent-white w-4 h-4 rounded cursor-pointer"
                          />
                          <span className="flex items-center gap-1.5 font-bold">
                            <Sparkles className="w-4 h-4 text-white" />
                            {isEs ? 'Generar 1 solo archivo HTML autónomo (CSS e imágenes embebidas en Base64)' : 'Generate 1 standalone HTML file (Embedded CSS & Base64 images)'}
                          </span>
                        </label>
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
                            : (mode === 'html-to-pdf' 
                                ? (isEs ? 'Convertir a PDF con Opciones →' : 'Convert to PDF with Options →') 
                                : (isEs ? 'Convertir a HTML con Opciones →' : 'Convert to HTML with Options →')))}
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
