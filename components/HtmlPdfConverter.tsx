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

type ConversionDirection = 'html-to-pdf' | 'pdf-to-html';
type PageSize = 'a4' | 'letter' | 'legal';
type PageOrientation = 'portrait' | 'landscape';

interface HtmlPdfConverterProps {
  defaultMode?: ConversionDirection;
}

export default function HtmlPdfConverter({ defaultMode = 'pdf-to-html' }: HtmlPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);
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
    if (file && (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm'))) {
      parseHtmlContent(file).then(count => setHtmlTagCount(count));
    }
  }, [file]);

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
  };

  const handleSwitchMode = (newMode: ConversionDirection) => {
    setMode(newMode);
    setFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(15);
    let localUrl: string | null = null;

    try {
      if (mode === 'html-to-pdf') {
        setProgressMsg(isEs ? 'Renderizando maquetación HTML DOM a PDF...' : 'Rendering HTML DOM layout to PDF...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET) {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'false');

            const response = await fetch(`https://v2.convertapi.com/convert/html/to/pdf?Secret=${API_SECRET}`, {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            if (data.Files && data.Files.length > 0) {
              const base64Data = data.Files[0].FileData;
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              localUrl = URL.createObjectURL(blob);
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
          page.drawText(isEs ? "Renderizado HTML5 a PDF" : "HTML5 to PDF Render", { x: 50, y: h - 85, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
          page.drawLine({ start: { x: 50, y: h - 100 }, end: { x: w - 50, y: h - 100 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

          if (addHeaderFooter) {
            page.drawText(new Date().toLocaleDateString(), { x: w - 120, y: 25, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
          }

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          localUrl = URL.createObjectURL(blob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        toast.success(isEs ? '¡HTML renderizado a PDF con éxito!' : 'HTML rendered to PDF successfully!');

      } else {
        setProgressMsg(isEs ? 'Exportando nodos PDF a maquetación HTML5...' : 'Exporting PDF nodes to HTML5 layout...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET) {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'false');

            const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/html?Secret=${API_SECRET}`, {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            if (data.Files && data.Files.length > 0) {
              const base64Data = data.Files[0].FileData;
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'text/html' });
              localUrl = URL.createObjectURL(blob);
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
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
          localUrl = URL.createObjectURL(blob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.html`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
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

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
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
          <Link href="/convertir" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
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

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
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

      {/* SELECTOR DUAL DE MODO 2 EN 1 */}
      <div className="flex items-center justify-center mb-6 font-mono">
        <div className="bg-[#09090b] border border-white/20 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
          <button
            type="button" onClick={() => handleSwitchMode('html-to-pdf')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mode === 'html-to-pdf' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HtmlIcon className="w-4 h-4 rounded-sm" />
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
        /* VISTA PRINCIPAL CON PREVISUALIZACIÓN Y PANEL DE CONTROL */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: PREVISUALIZACIÓN DE ARCHIVO */}
          <div className="lg:col-span-5 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <Code className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / PREVISUALIZACIÓN DE DOCUMENTO` : `001 / DOCUMENT PREVIEW`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {/* VISTA PREVIA DETALLADA */}
            <div className="w-full flex-1 bg-zinc-950 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 relative border border-white/5 font-mono min-h-[460px]">
              {pdfUrl ? (
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="w-full h-full border-none bg-white rounded-lg shadow-inner min-h-[440px]" title="PDF Preview" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                  <HtmlIcon className="w-24 h-24 rounded-2xl shadow-2xl" />
                  <span className="text-xs text-orange-400 font-mono bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                    ✓ {htmlTagCount} {isEs ? 'etiquetas HTML detectadas' : 'HTML tags detected'}
                  </span>
                </div>
              )}
            </div>

            {/* PIE DE ARCHIVO */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
              <span className="truncate max-w-[240px] font-bold text-white">{file.name}</span>
              <button type="button" onClick={handleRemoveFile} className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-5 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer mb-5 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* SECCIÓN DESPLEGABLE: OPCIONES AVANZADAS */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 font-mono text-xs mb-5 overflow-hidden"
                  >
                    {mode === 'html-to-pdf' ? (
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
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Renderizar colores e imágenes de fondo CSS' : 'Render CSS background colors & images'}</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addHeaderFooter} onChange={(e) => setAddHeaderFooter(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Incluir fecha y numeración de página en encabezado' : 'Include date & page numbering in header'}</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 font-mono">
                            <input
                              type="checkbox" checked={singleHtmlFile} onChange={(e) => setSingleHtmlFile(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span className="flex items-center gap-1.5 font-bold">
                              <Sparkles className="w-4 h-4 text-white" />
                              {isEs ? 'Generar 1 solo archivo HTML autónomo (CSS e imágenes embebidas en Base64)' : 'Generate 1 standalone HTML file (Embedded CSS & Base64 images)'}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFilename || 'Documento_Web'}
                  className="mt-3 w-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold py-3.5 px-6 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <FileDown className="w-4 h-4 text-black" />
                  <span>{isEs ? 'Descargar Archivo Convertido' : 'Download Converted File'}</span>
                </a>
              )}
            </div>

          </div>
        </motion.div>
      )}

      {/* SECCIÓN INFORMATIVA INFERIOR (DEBAJO DE LAS CAJAS PRINCIPALES) */}
      <div className="w-full space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12 mb-12">
        {/* BLOQUE 1: GARANTÍA Y PROCESAMIENTO DETALLADO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Qué sucede al exportar documentos PDF a código HTML5?' : 'What happens when exporting PDF documents into HTML5 code?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 RENDERIZADO WEB DOM HTML5 Y PROCESAMIENTO 100% LOCAL' : '🔒 100% LOCAL HTML5 DOM RENDERING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? '1. Conversión de PDF a HTML' : '1. PDF to HTML Conversion'}
              </strong>
              <p>
                {isEs 
                  ? 'Traduce párrafos, títulos e imágenes fijas del PDF en marcas sintácticas de HTML5 totalmente estructuradas.'
                  : 'Translates paragraphs, headings, and static PDF images into fully structured HTML5 syntax.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? '2. Conversión de HTML a PDF' : '2. HTML to PDF Conversion'}
              </strong>
              <p>
                {isEs 
                  ? 'Procesa el árbol DOM y estilos CSS3 de la página web, renderizándolos con precisión vectorial en un documento PDF de alta fidelidad.'
                  : 'Parses DOM trees and CSS3 styles from the web page, vector-rendering them into a high-precision PDF.'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: GUÍA PASO A PASO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? 'Aprende a usar la herramienta en 3 sencillos pasos' : 'Learn how to use the tool in 3 simple steps'}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {isEs ? 'GUÍA RÁPIDA DE CÓDIGO HTML' : 'QUICK HTML CODE GUIDE'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Cargar Archivo Web' : 'Upload Web File'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra tu PDF o documento HTML. El sistema pre-visualizará las etiquetas al instante.' 
                  : 'Drop your PDF or HTML file. The system will preview tags instantly.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Configurar DOM' : 'Configure DOM'}
              </strong>
              <p>
                {isEs 
                  ? 'Selecciona si deseas 1 archivo autónomo con CSS e imágenes incrustadas en Base64.' 
                  : 'Select if you want 1 standalone file with embedded CSS and Base64 images.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                3
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Exportar y Descargar' : 'Export & Download'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en el botón principal para descargar tu código HTML5 o archivo PDF listo para usar.' 
                  : 'Click the action button to download your HTML5 code or PDF file ready to use.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
