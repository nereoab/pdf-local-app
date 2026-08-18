'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  FileDown, Loader2, X, FilePlus, RefreshCw, UploadCloud, Repeat, Layout, 
  Sliders, ChevronDown, ChevronUp, Sparkles, Grid, AlignLeft, Type, FileText,
  ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus
} from 'lucide-react';
import { TextIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import { useUIStore } from '@/store/useUIStore';

type ConversionDirection = 'pdf-to-text' | 'text-to-pdf';
type PageSize = 'a4' | 'letter' | 'legal';
type FontFamily = 'helvetica' | 'courier' | 'times';

interface TextPdfConverterProps {
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

export default function TextPdfConverter({ defaultMode = 'pdf-to-text' }: TextPdfConverterProps) {
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
    if (defaultMode === 'pdf-to-text' && name.endsWith('.pdf')) return globalFile;
    if (defaultMode === 'text-to-pdf' && (name.endsWith('.txt') || name.endsWith('.text'))) return globalFile;
    return null;
  });

  const [manualText, setManualText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  // OPCIONES AVANZADAS PDF -> TEXTO
  const [preserveLayout, setPreserveLayout] = useState<boolean>(true);
  const [addPageSeparators, setAddPageSeparators] = useState<boolean>(true);
  const [encoding, setEncoding] = useState<'utf-8' | 'ascii'>('utf-8');
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState<boolean>(false);

  // OPCIONES AVANZADAS TEXTO -> PDF
  const [fontFamily, setFontFamily] = useState<FontFamily>('helvetica');
  const [fontSize, setFontSize] = useState<number>(10);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);

  const pdfUrl = useMemo(() => {
    if (file && file.type === 'application/pdf') {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

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
    setManualText('');
    setExtractedText('');
    setDownloadUrl(null);
    setDownloadFilename('');
    setCompletedResult(null);
    setHeaderHidden(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setExtractedText('');
      setCompletedResult(null);
      
      if (mode === 'text-to-pdf') {
        selected.text().then(txt => setManualText(txt)).catch(() => {});
      }
      toast.success(isEs ? 'Archivo cargado con éxito' : 'File loaded successfully');
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setManualText('');
    setExtractedText('');
    setDownloadUrl(null);
    setDownloadFilename('');
    setGlobalFile(null);
    setCompletedResult(null);
    setHeaderHidden(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeConversion = async () => {
    if (mode === 'pdf-to-text') {
      if (!file) {
        toast.error(isEs ? 'Por favor selecciona un archivo PDF' : 'Please select a PDF file');
        return;
      }
      setIsProcessing(true);
      setProgressMsg(isEs ? 'Extrayendo texto...' : 'Extracting text...');
      setProgressPercent(20);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let textOutput = '';
        for (let p = 1; p <= pdf.numPages; p++) {
          setProgressPercent(20 + Math.floor((p / pdf.numPages) * 70));
          const page = await pdf.getPage(p);
          const textContent = await page.getTextContent();
          if (addPageSeparators) textOutput += `=== ${isEs ? 'PÁGINA' : 'PAGE'} ${p} ===\n\n`;
          if (preserveLayout) {
            const rows: { [yKey: number]: { x: number; text: string }[] } = {};
            textContent.items.forEach((item: Record<string, unknown>) => {
              const strVal = item.str;
              const transformVal = item.transform;
              if (typeof strVal === 'string' && Array.isArray(transformVal) && transformVal.length >= 6) {
                const y = Math.round(Number(transformVal[5]));
                const x = Math.round(Number(transformVal[4]));
                if (!rows[y]) rows[y] = [];
                rows[y].push({ x, text: strVal });
              }
            });
            const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);
            sortedYs.forEach(y => {
              const lineItems = rows[y].sort((a, b) => a.x - b.x);
              textOutput += lineItems.map(i => i.text).join('  ') + '\n';
            });
            textOutput += '\n';
          } else {
            textContent.items.forEach((item: Record<string, unknown>) => {
              if (typeof item.str === 'string') textOutput += `${item.str}\n`;
            });
            textOutput += '\n';
          }
        }
        if (removeExtraSpaces) textOutput = textOutput.replace(/\n{3,}/g, '\n\n');
        if (encoding === 'ascii') textOutput = textOutput.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8;' });
        const localUrl = URL.createObjectURL(blob);
        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.txt`;

        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        setCompletedResult({
          downloadUrl: localUrl,
          filename: outName,
          fileSize: formatFileSize(blob.size),
          rawBlob: blob,
          outputFormat: 'txt',
          originalSize: formatFileSize(file.size),
          itemCount: pdf.numPages,
        });
        setHeaderHidden(true);
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setProgressPercent(100);
        toast.success(isEs ? '¡Texto extraído correctamente!' : 'Text extracted successfully!');
      } catch (error) {
        toast.error(isEs ? 'Error al extraer texto.' : 'Error extracting text.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const textToUse = manualText || (file ? await file.text() : '');
      if (!textToUse.trim()) {
        toast.error(isEs ? 'Escribe o sube un archivo' : 'Enter text or upload file');
        return;
      }

      setIsProcessing(true);
      try {
        const pdfDoc = await PDFDocument.create();
        let fontSymbol = StandardFonts.Helvetica;
        if (fontFamily === 'courier') fontSymbol = StandardFonts.Courier;
        else if (fontFamily === 'times') fontSymbol = StandardFonts.TimesRoman;
        const font = await pdfDoc.embedFont(fontSymbol);

        let w = 595.28;
        let h = 841.89;
        if (pageSize === 'letter') { w = 612; h = 792; }
        else if (pageSize === 'legal') { w = 612; h = 1008; }

        const margin = 50;
        const maxChars = Math.floor((w - margin * 2) / (fontSize * 0.6));
        const lines = textToUse.split('\n');
        let page = pdfDoc.addPage([w, h]);
        let y = h - margin;

        lines.forEach((line) => {
          const regex = new RegExp(`.{1,${maxChars}}`, 'g');
          const wrapped = line.match(regex) || [""];
          wrapped.forEach((subLine) => {
            if (y < margin + 20) {
              page = pdfDoc.addPage([w, h]);
              y = h - margin;
            }
            page.drawText(subLine, { x: margin, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
            y -= (fontSize * lineSpacing);
          });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        const localUrl = URL.createObjectURL(blob);
        const outName = file ? `${file.name.replace(/\.[^/.]+$/, "")}.pdf` : "Documento.pdf";

        setCompletedResult({
          downloadUrl: localUrl,
          filename: outName,
          fileSize: formatFileSize(blob.size),
          rawBlob: blob,
          outputFormat: 'pdf',
          originalSize: file ? formatFileSize(file.size) : formatFileSize(new Blob([textToUse]).size),
          itemCount: pdfDoc.getPageCount(),
        });
        setHeaderHidden(true);
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setProgressPercent(100);
        toast.success(isEs ? '¡PDF generado!' : 'PDF generated!');
      } catch (error) {
        toast.error(isEs ? 'Error al generar el PDF.' : 'Error generating PDF.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div ref={topHeaderRef} className="w-full flex flex-col font-mono text-white selection:bg-white selection:text-black">
      <input 
        type="file" 
        accept={mode === 'pdf-to-text' ? ".pdf" : ".txt,.text"} 
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
              {isEs ? "003 / CONVERSIÓN DE TEXTO Y PDF (CONVERSOR DUAL 2 EN 1)" : "003 / TEXT & PDF CONVERSION (2-IN-1 DUAL CONVERTER)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Type className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'pdf-to-text' 
                ? (isEs ? "CONVERTIR PDF A TEXTO PLANO (TXT)" : "CONVERT PDF TO PLAIN TEXT (TXT)") 
                : (isEs ? "CONVERTIR TEXTO A PDF (TXT → PDF)" : "CONVERT TEXT TO PDF (TXT → PDF)")}
            </h1>
          </div>
        </div>

        {(file || completedResult || manualText) && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{completedResult ? completedResult.filename : (file?.name || (isEs ? 'Texto en edición' : 'Editing text'))}</span>
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
          <div className="bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono">
            {/* Glow background accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-400/30">
                  <AlignLeft className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                    {isEs ? '¡Conversión Completada con Éxito!' : 'Conversion Completed Successfully!'}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-0.5">
                    {mode === 'pdf-to-text'
                      ? (isEs ? 'Texto plano extraído y estructurado con éxito.' : 'Plain text extracted and structured successfully.')
                      : (isEs ? 'Documento PDF maquetado a partir de texto con éxito.' : 'PDF document generated from text successfully.')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{mode === 'pdf-to-text' ? (isEs ? 'TXT Estructurado Listo' : 'Structured TXT Ready') : (isEs ? 'PDF Maquetado Listo' : 'Formatted PDF Ready')}</span>
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
            currentToolId="texto-pdf"
            onReset={handleRemoveFile}
          />
        </motion.div>
      ) : (
        <>
          {/* SELECTOR DUAL DE MODO 2 EN 1 */}
          <div className="flex items-center justify-center mb-6 font-mono">
            <div className="bg-[#09090b] border border-white/20 p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
              <button
                type="button" onClick={() => handleSwitchMode('pdf-to-text')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'pdf-to-text' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                <span>{isEs ? 'PDF a Texto (.pdf → TXT)' : 'PDF to Text (.pdf → TXT)'}</span>
              </button>

              <button
                type="button" onClick={() => handleSwitchMode('text-to-pdf')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mode === 'text-to-pdf' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{isEs ? 'Texto a PDF (TXT → .pdf)' : 'Text to PDF (TXT → .pdf)'}</span>
              </button>
            </div>
          </div>

          {!file && mode === 'pdf-to-text' ? (
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
                {isEs ? "CONVERTIR PDF A TEXTO PLANO (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO PLAIN TEXT (2-IN-1 DUAL CONVERTER)"}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
                {isEs ? "Extrae texto plano preservando alineación espacial y marcas de página de forma 100% confidencial y local." : "Extract plain text preserving spatial layout and page headers 100% locally."}
              </p>
              <button 
                type="button"
                className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>{isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}</span>
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
                    <AlignLeft className="w-4 h-4 text-white" />
                    <span>{mode === 'pdf-to-text' ? (isEs ? `001 / VISOR CON MINIATURAS Y TAMAÑO NORMAL` : `001 / THUMBNAILS & FULL SIZE VIEWER`) : (isEs ? '001 / EDITOR / VISOR DE TEXTO FUENTE' : '001 / SOURCE TEXT EDITOR')}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                  </div>
                </div>

                {mode === 'pdf-to-text' ? (
                  /* CONTENEDOR PRINCIPAL SPLIT: COLUMNA IZQUIERDA (MINIATURAS 1 COL) + COSTADO DERECHO (VISOR NORMAL) */
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
                        <div className="text-[10px] text-zinc-500 text-center py-4">1 pág</div>
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
                          <TextIcon className="w-20 h-20 rounded-2xl shadow-2xl" />
                          <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                            ✓ {isEs ? 'Archivo cargado' : 'File loaded'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* VISOR / EDITOR DE TEXTO EN MODO TEXT-TO-PDF */
                  <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 rounded-xl border border-white/10 p-4">
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder={isEs ? "Escribe o pega aquí el contenido de texto que deseas convertir en documento PDF..." : "Write or paste the text content here..."}
                      className="w-full flex-1 bg-transparent text-zinc-200 text-xs font-mono resize-none focus:outline-none custom-scrollbar p-2"
                    />
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{manualText.length} {isEs ? 'caracteres' : 'chars'} • {manualText.split(/\s+/).filter(Boolean).length} {isEs ? 'palabras' : 'words'}</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-white hover:underline cursor-pointer"
                      >
                        {isEs ? 'Cargar archivo .TXT' : 'Load .TXT file'}
                      </button>
                    </div>
                  </div>
                )}
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
                  {mode === 'pdf-to-text' ? (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-white" />
                            {isEs ? 'Codificación' : 'Encoding'}
                          </label>
                          <select
                            value={encoding} onChange={(e) => setEncoding(e.target.value as 'utf-8' | 'ascii')}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="utf-8">UTF-8 (Universal / Tildes y Caracteres)</option>
                            <option value="ascii">ASCII Plano (Sin acentos)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-white" />
                            {isEs ? 'Alineación Espacial' : 'Spatial Layout'}
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={preserveLayout} onChange={(e) => setPreserveLayout(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Conservar estructura visual 2D' : 'Preserve 2D visual structure'}</span>
                          </label>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2 space-y-2.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addPageSeparators} onChange={(e) => setAddPageSeparators(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Incluir separadores visuales entre páginas' : 'Include visual page separators'}</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={removeExtraSpaces} onChange={(e) => setRemoveExtraSpaces(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Limpiar saltos de línea y espacios redundantes' : 'Clean redundant line breaks'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Type className="w-4 h-4 text-white" />
                            {isEs ? 'Tipografía' : 'Font Family'}
                          </label>
                          <select
                            value={fontFamily} onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="helvetica">Helvetica (Sans-Serif)</option>
                            <option value="courier">Courier (Monospace / Código)</option>
                            <option value="times">Times New Roman (Serif)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-white" />
                            {isEs ? 'Tamaño de Hoja' : 'Page Size'}
                          </label>
                          <select
                            value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="a4">A4 (210 × 297 mm)</option>
                            <option value="letter">Carta / Letter</option>
                            <option value="legal">Oficio / Legal</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addPageNumbers} onChange={(e) => setAddPageNumbers(e.target.checked)}
                              className="accent-white w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{isEs ? 'Incluir numeración de páginas en el pie del documento' : 'Include page numbering in footer'}</span>
                          </label>
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
                    disabled={isProcessing || (mode === 'pdf-to-text' ? !file : (!manualText.trim() && !file))} 
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <RefreshCw className="w-5 h-5 text-black" />}
                    <span>
                      {isProcessing 
                        ? progressMsg 
                        : (mode === 'pdf-to-text' 
                            ? (!file ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') : (isEs ? 'Extraer Texto con Opciones →' : 'Extract Text with Options →'))
                            : (!manualText.trim() && !file ? (isEs ? 'Escribe texto o sube archivo' : 'Type text or upload file') : (isEs ? 'Convertir a PDF con Opciones →' : 'Convert to PDF with Options →')))}
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
