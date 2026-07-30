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

type ConversionDirection = 'pdf-to-text' | 'text-to-pdf';
type PageSize = 'a4' | 'letter' | 'legal';
type FontFamily = 'helvetica' | 'courier' | 'times';

interface TextPdfConverterProps {
  defaultMode?: ConversionDirection;
}

export default function TextPdfConverter({ defaultMode = 'pdf-to-text' }: TextPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);
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

  useEffect(() => {
    if (file && mode === 'text-to-pdf') {
      file.text().then(txt => setManualText(txt)).catch(() => {});
    }
  }, [file, mode]);

  const handleSwitchMode = (newMode: ConversionDirection) => {
    setMode(newMode);
    setFile(null);
    setManualText('');
    setExtractedText('');
    setDownloadUrl(null);
    setDownloadFilename('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setExtractedText('');
      
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
  };

  const executeConversion = async () => {
    if (mode === 'pdf-to-text') {
      if (!file) {
        toast.error(isEs ? 'Por favor selecciona un archivo PDF' : 'Please select a PDF file');
        return;
      }
      setIsProcessing(true);
      setProgressMsg(isEs ? 'Extrayendo texto con formato...' : 'Extracting formatted text...');
      setProgressPercent(20);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let textOutput = '';
        for (let p = 1; p <= pdf.numPages; p++) {
          setProgressMsg(isEs ? `Extrayendo página ${p} de ${pdf.numPages}...` : `Extracting page ${p} of ${pdf.numPages}...`);
          setProgressPercent(20 + Math.floor((p / pdf.numPages) * 70));

          const page = await pdf.getPage(p);
          const textContent = await page.getTextContent();

          if (addPageSeparators) {
            textOutput += `=== ${isEs ? 'PÁGINA' : 'PAGE'} ${p} DE ${pdf.numPages} ===\n\n`;
          }

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

        if (removeExtraSpaces) {
          textOutput = textOutput.replace(/\n{3,}/g, '\n\n');
        }

        if (encoding === 'ascii') {
          textOutput = textOutput.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        setExtractedText(textOutput);

        const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8;' });
        const localUrl = URL.createObjectURL(blob);
        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.txt`;

        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        setProgressPercent(100);
        toast.success(isEs ? '¡Texto extraído correctamente!' : 'Text extracted successfully!');
      } catch (error) {
        console.error(error);
        toast.error(isEs ? 'Error al extraer texto del PDF.' : 'Error extracting text from PDF.');
      } finally {
        setIsProcessing(false);
        setProgressMsg('');
      }
    } else {
      // TEXTO -> PDF
      const textToUse = manualText || (file ? await file.text() : '');
      if (!textToUse.trim()) {
        toast.error(isEs ? 'Escribe o sube un archivo de texto para convertir' : 'Type or upload a text file to convert');
        return;
      }

      setIsProcessing(true);
      setProgressMsg(isEs ? 'Generando PDF con maquetación...' : 'Generating PDF layout...');
      setProgressPercent(30);

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
        const lineHeight = fontSize * lineSpacing;

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
            y -= lineHeight;
          });
        });

        if (addPageNumbers) {
          const pages = pdfDoc.getPages();
          pages.forEach((p, idx) => {
            p.drawText(`Página ${idx + 1} de ${pages.length}`, {
              x: w / 2 - 35,
              y: 20,
              size: 9,
              font,
              color: rgb(0.5, 0.5, 0.5),
            });
          });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        const localUrl = URL.createObjectURL(blob);
        const outName = file ? `${file.name.replace(/\.[^/.]+$/, "")}.pdf` : "Documento.pdf";

        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        setProgressPercent(100);
        toast.success(isEs ? '¡PDF generado con éxito!' : 'PDF generated successfully!');
      } catch (error) {
        console.error(error);
        toast.error(isEs ? 'Error al generar el PDF.' : 'Error generating PDF.');
      } finally {
        setIsProcessing(false);
        setProgressMsg('');
      }
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
        accept={mode === 'pdf-to-text' ? ".pdf" : ".txt,.text"} 
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
              {isEs ? "003 / CONVERSIÓN DE TEXTO PLANO Y PDF (CONVERSOR DUAL 2 EN 1)" : "003 / PLAIN TEXT & PDF CONVERSION (2-IN-1 DUAL CONVERTER)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <AlignLeft className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'pdf-to-text' 
                ? (isEs ? "CONVERTIR PDF A TEXTO PLANO" : "CONVERT PDF TO PLAIN TEXT") 
                : (isEs ? "CONVERTIR TEXTO PLANO A PDF (CONVERSOR DUAL 2 EN 1)" : "CONVERT PLAIN TEXT TO PDF (2-IN-1 DUAL CONVERTER)")}
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
        /* VISTA PRINCIPAL CON PREVISUALIZACIÓN Y PANEL DE CONTROL */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: PREVISUALIZACIÓN DE ARCHIVO O ÁREA DE TEXTO */}
          <div className="lg:col-span-5 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <AlignLeft className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / PREVISUALIZACIÓN DE DOCUMENTO` : `001 / DOCUMENT PREVIEW`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {/* VISTA PREVIA DETALLADA O EDITOR */}
            <div className="w-full flex-1 bg-zinc-950 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 relative border border-white/5 font-mono min-h-[460px]">
              {mode === 'pdf-to-text' ? (
                pdfUrl ? (
                  <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="w-full h-full border-none bg-white rounded-lg shadow-inner min-h-[440px]" title="PDF Preview" />
                ) : (
                  <textarea
                    value={extractedText} readOnly
                    placeholder={isEs ? 'El texto extraído aparecerá aquí...' : 'Extracted text will appear here...'}
                    className="w-full h-full min-h-[440px] bg-zinc-950 p-4 rounded-xl border border-white/10 text-zinc-200 font-mono text-xs outline-none resize-none"
                  />
                )
              ) : (
                <textarea
                  value={manualText} onChange={(e) => setManualText(e.target.value)}
                  placeholder={isEs ? 'Escribe, pega o carga un texto plano para convertir a PDF...' : 'Write, paste, or upload plain text to convert to PDF...'}
                  className="w-full h-full min-h-[440px] bg-zinc-950 p-4 rounded-xl border border-white/10 text-zinc-200 font-mono text-xs outline-none resize-none focus:border-white/30 transition-colors"
                />
              )}
            </div>

            {/* PIE DE ARCHIVO */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
              <span className="truncate max-w-[240px] font-bold text-white">{file ? file.name : (isEs ? 'Edición de texto plano' : 'Plain text editor')}</span>
              {file && (
                <button type="button" onClick={handleRemoveFile} className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
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
                  <span>{isEs ? "Opciones Avanzadas de Maquetación" : "Advanced Layout Options"}</span>
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
                    {mode === 'pdf-to-text' ? (
                      <div className="space-y-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-white" />
                            {isEs ? 'Codificación de Texto' : 'Text Encoding'}
                          </label>
                          <select
                            value={encoding} onChange={(e) => setEncoding(e.target.value as 'utf-8' | 'ascii')}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="utf-8">UTF-8 (Soporte completo de acentos y ñ)</option>
                            <option value="ascii">ASCII Estándar (Sin caracteres especiales)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-2.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={preserveLayout} onChange={(e) => setPreserveLayout(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Preservar alineación espacial (agrupar filas y columnas)' : 'Preserve spatial layout (group rows & columns)'}</span>
                          </label>

                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addPageSeparators} onChange={(e) => setAddPageSeparators(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Añadir marcas de separación de página (=== PÁGINA N ===)' : 'Add page separator headers (=== PAGE N ===)'}</span>
                          </label>

                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={removeExtraSpaces} onChange={(e) => setRemoveExtraSpaces(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Limpiar saltos de línea sobrantes y espacios vacíos' : 'Clean redundant line breaks & extra spaces'}</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
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
                              <option value="courier">Courier (Monospaced)</option>
                              <option value="times">Times Roman (Serif)</option>
                            </select>
                          </div>

                          <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                            <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                              <Grid className="w-4 h-4 text-white" />
                              {isEs ? 'Papel' : 'Page Size'}
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                            <label className="text-zinc-300 font-bold block mb-2">
                              {isEs ? 'Tamaño de Fuente' : 'Font Size'}
                            </label>
                            <select
                              value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                            >
                              <option value={9}>9 pt</option>
                              <option value={10}>10 pt (Estándar)</option>
                              <option value={12}>12 pt</option>
                              <option value={14}>14 pt</option>
                            </select>
                          </div>

                          <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                            <label className="text-zinc-300 font-bold block mb-2">
                              {isEs ? 'Interlineado' : 'Line Spacing'}
                            </label>
                            <select
                              value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value))}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                            >
                              <option value={1.0}>1.0 (Sencillo)</option>
                              <option value={1.5}>1.5 (Estándar)</option>
                              <option value={2.0}>2.0 (Doble)</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addPageNumbers} onChange={(e) => setAddPageNumbers(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Numeración de páginas en pie de página' : 'Footer page numbering'}</span>
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
                disabled={isProcessing || (mode === 'pdf-to-text' ? !file : (!manualText.trim() && !file))} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <RefreshCw className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (mode === 'pdf-to-text' 
                        ? (isEs ? 'Extraer Texto con Opciones →' : 'Extract Text with Options →') 
                        : (isEs ? 'Convertir a PDF con Opciones →' : 'Convert to PDF with Options →'))}
                </span>
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFilename || (mode === 'pdf-to-text' ? 'Texto_Extraido.txt' : 'Documento.pdf')}
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
            <div className="bg-[#09090b] p-3 rounded-xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo funciona la extracción de texto plano?' : 'How does plain text extraction work?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 PROCESAMIENTO Y AGRUPAMIENTO ESPACIAL 100% LOCAL' : '🔒 100% LOCAL SPATIAL GROUPING & EXTRACTION'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Preservación de Maquetación' : 'Layout Preservation'}
              </strong>
              <p>
                {isEs 
                  ? 'Nuestra tecnología analiza la posición espacial (coordenadas X e Y) de cada carácter para mantener tablas, columnas y párrafos intactos.' 
                  : 'Our technology analyzes the spatial position (X & Y coordinates) of every character to keep tables, columns, and paragraphs intact.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Privacidad y Codificación' : 'Privacy & Encoding'}
              </strong>
              <p>
                {isEs 
                  ? 'Tus datos nunca salen del navegador. Soporta codificación UTF-8 para tildes y caracteres especiales sin depender de un servidor.' 
                  : 'Your data never leaves your browser. Supports UTF-8 encoding for special accents without reliance on any external server.'}
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
                {isEs ? 'GUÍA RÁPIDA DE TEXTO PLANO' : 'QUICK PLAIN TEXT GUIDE'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Cargar o Escribir Texto' : 'Upload or Type Text'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra tu PDF, carga un archivo .TXT o escribe directamente en el editor.' 
                  : 'Drop your PDF, upload a .TXT file or type directly in the editor.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Configurar Maquetación' : 'Configure Layout'}
              </strong>
              <p>
                {isEs 
                  ? 'Ajusta codificación UTF-8, alineación espacial, tipografía e interlineado.' 
                  : 'Adjust UTF-8 encoding, spatial alignment, font family and line spacing.'}
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
                  ? 'Haz clic en el botón principal para compilar y descargar tu documento final.' 
                  : 'Click the action button to compile and download your final document.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
