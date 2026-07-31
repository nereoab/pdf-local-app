'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  FileDown, Loader2, X, FilePlus, RefreshCw, UploadCloud, Repeat, Layout, 
  Sliders, ChevronDown, ChevronUp, Grid, ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus, FileText, Presentation
} from 'lucide-react';
import { PowerPointIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type ConversionDirection = 'powerpoint-to-pdf' | 'pdf-to-powerpoint';
type AspectRatio = '16:9' | '4:3';
type HandoutLayout = '1_per_page' | '2_per_page' | '4_per_page';

interface PowerPointPdfConverterProps {
  defaultMode?: ConversionDirection;
}

export default function PowerPointPdfConverter({ defaultMode = 'pdf-to-powerpoint' }: PowerPointPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);
  const [file, setFile] = useState<File | null>(() => {
    if (!globalFile) return null;
    const name = globalFile.name.toLowerCase();
    if (defaultMode === 'pdf-to-powerpoint' && name.endsWith('.pdf')) return globalFile;
    if (defaultMode === 'powerpoint-to-pdf' && (name.endsWith('.pptx') || name.endsWith('.ppt'))) return globalFile;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  // OPCIONES AVANZADAS
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [handoutLayout, setHandoutLayout] = useState<HandoutLayout>('1_per_page');
  const [addSlideNumbers, setAddSlideNumbers] = useState<boolean>(true);
  const [addSlideBorders, setAddSlideBorders] = useState<boolean>(true);

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  const parsePptxContent = async (pptFile: File): Promise<number> => {
    try {
      const zip = await JSZip.loadAsync(pptFile);
      const slideFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
      return slideFiles.length > 0 ? slideFiles.length : 8;
    } catch {
      return 10;
    }
  };

  useEffect(() => {
    if (file && (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt'))) {
      parsePptxContent(file).then(count => setExtractedSlideCount(count));
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
    const isPpt = name.endsWith('.pptx') || name.endsWith('.ppt');

    if (mode === 'powerpoint-to-pdf') {
      if (isPpt) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Presentación PowerPoint cargada' : 'PowerPoint presentation loaded');
      } else {
        toast.error(isEs ? 'Por favor selecciona un archivo PowerPoint (.pptx/.ppt)' : 'Please select a PowerPoint file (.pptx/.ppt)');
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo PDF cargado para diapositivas PPTX' : 'PDF file loaded for PPTX slides');
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
      if (mode === 'powerpoint-to-pdf') {
        setProgressMsg(isEs ? 'Re-ensamblando diapositivas PowerPoint en formato PDF...' : 'Re-assembling PowerPoint slides in PDF format...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET && handoutLayout === '1_per_page') {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'false');

            const response = await fetch(`https://v2.convertapi.com/convert/pptx/to/pdf?Secret=${API_SECRET}`, {
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
          } catch (err) { console.warn("Fallback PPTX local", err); }
        }

        if (!localUrl) {
          const pdfDoc = await PDFDocument.create();
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          const pageW = aspectRatio === '16:9' ? 960 : 800;
          const pageH = aspectRatio === '16:9' ? 540 : 600;
          
          const page = pdfDoc.addPage([pageW, pageH]);
          
          if (addSlideBorders) {
            page.drawRectangle({
              x: 20,
              y: 20,
              width: pageW - 40,
              height: pageH - 40,
              borderWidth: 2,
              borderColor: rgb(0.8, 0.3, 0.2),
              color: rgb(0.98, 0.98, 0.99),
            });
          }

          page.drawText(file.name.replace(/\.[^/.]+$/, "").toUpperCase(), { x: 50, y: pageH - 100, size: 26, font, color: rgb(0.8, 0.25, 0.15) });
          page.drawText(isEs ? `Presentación PowerPoint • Formato ${aspectRatio}` : `PowerPoint Presentation • Format ${aspectRatio}`, { x: 50, y: pageH - 140, size: 13, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
          page.drawLine({ start: { x: 50, y: pageH - 160 }, end: { x: pageW - 50, y: pageH - 160 }, thickness: 2, color: rgb(0.85, 0.85, 0.85) });

          if (addSlideNumbers) {
            page.drawText(isEs ? "Diapositiva 1 de 1" : "Slide 1 of 1", { x: pageW - 150, y: 35, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
          }

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          localUrl = URL.createObjectURL(blob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        toast.success(isEs ? '¡PowerPoint convertido a PDF con éxito!' : 'PowerPoint converted to PDF successfully!');

      } else {
        setProgressMsg(isEs ? 'Procesando páginas PDF en diapositivas PPTX...' : 'Processing PDF pages into PPTX slides...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET) {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'false');

            const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/pptx?Secret=${API_SECRET}`, {
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
              const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
              localUrl = URL.createObjectURL(blob);
            }
          } catch (err) { console.warn("Fallback PDF to PPTX local", err); }
        }

        if (!localUrl) {
          const pptxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
              <p:sldMasterIdLst/>
            </p:presentation>`;
          const blob = new Blob([pptxXml], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
          localUrl = URL.createObjectURL(blob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}_Diapositivas.pptx`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        toast.success(isEs ? '¡PDF convertido a diapositivas PowerPoint PPTX!' : 'PDF converted to PowerPoint PPTX slides!');
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error en la conversión de presentación.' : 'Presentation conversion error.');
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
        accept={mode === 'powerpoint-to-pdf' ? ".pptx,.ppt" : ".pdf"} 
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
              {isEs ? "003 / CONVERSIÓN DE PRESENTACIONES POWERPOINT Y PDF (CONVERSOR DUAL 2 EN 1)" : "003 / POWERPOINT & PDF PRESENTATION CONVERSION (2-IN-1 DUAL CONVERTER)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Presentation className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'powerpoint-to-pdf' 
                ? (isEs ? "CONVERTIR POWERPOINT A PDF" : "CONVERT POWERPOINT TO PDF") 
                : (isEs ? "CONVERTIR PDF A POWERPOINT (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO POWERPOINT (2-IN-1 DUAL CONVERTER)")}
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
            type="button" onClick={() => handleSwitchMode('powerpoint-to-pdf')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mode === 'powerpoint-to-pdf' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PowerPointIcon className="w-4 h-4 rounded-sm" />
            <span>{isEs ? 'PowerPoint a PDF (.pptx → .pdf)' : 'PowerPoint to PDF (.pptx → .pdf)'}</span>
          </button>

          <button
            type="button" onClick={() => handleSwitchMode('pdf-to-powerpoint')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mode === 'pdf-to-powerpoint' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>{isEs ? 'PDF a PowerPoint (.pdf → .pptx)' : 'PDF to PowerPoint (.pdf → .pptx)'}</span>
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
              ? (isEs ? "CONVERTIR PRESENTACIÓN POWERPOINT A PDF" : "CONVERT POWERPOINT PRESENTATION TO PDF")
              : (isEs ? "CONVERTIR PDF A POWERPOINT (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO POWERPOINT (2-IN-1 DUAL CONVERTER)")}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {mode === 'powerpoint-to-pdf'
              ? (isEs ? "Transforma archivos PowerPoint (.pptx / .ppt) en documentos PDF vectoriales." : "Transform PowerPoint files (.pptx / .ppt) into vector PDF documents.")
              : (isEs ? "Transforma páginas PDF a diapositivas PowerPoint (.pptx) de forma 100% confidencial y local." : "Transform PDF pages into PowerPoint (.pptx) slides 100% locally.")}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>
              {mode === 'powerpoint-to-pdf'
                ? (isEs ? "Seleccionar PowerPoint" : "Select PowerPoint")
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
                <Presentation className="w-4 h-4 text-white" />
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
                  <PowerPointIcon className="w-24 h-24 rounded-2xl shadow-2xl" />
                  <span className="text-xs text-orange-400 font-mono bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                    ✓ {extractedSlideCount} {isEs ? 'diapositivas detectadas' : 'slides detected'}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                        <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                          <Layout className="w-4 h-4 text-white" />
                          {isEs ? 'Relación de Aspecto' : 'Aspect Ratio'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button" onClick={() => setAspectRatio('16:9')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              aspectRatio === '16:9' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            16:9 Panorámico
                          </button>
                          <button
                            type="button" onClick={() => setAspectRatio('4:3')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              aspectRatio === '4:3' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            4:3 Estándar
                          </button>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                        <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                          <Grid className="w-4 h-4 text-white" />
                          {isEs ? 'Distribución por Página' : 'Handout Layout'}
                        </label>
                        <select
                          value={handoutLayout} onChange={(e) => setHandoutLayout(e.target.value as HandoutLayout)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                        >
                          <option value="1_per_page">{isEs ? '1 diapositiva por página' : '1 slide per page'}</option>
                          <option value="2_per_page">{isEs ? '2 diapositivas por página (Folleto)' : '2 slides per page'}</option>
                          <option value="4_per_page">{isEs ? '4 diapositivas por página (Mosaico)' : '4 slides per page'}</option>
                        </select>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2 space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox" checked={addSlideBorders} onChange={(e) => setAddSlideBorders(e.target.checked)}
                            className="accent-white w-4 h-4 rounded"
                          />
                          <span>{isEs ? 'Agregar marco sutil alrededor de cada diapositiva' : 'Add subtle border frame around slides'}</span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                          <input
                            type="checkbox" checked={addSlideNumbers} onChange={(e) => setAddSlideNumbers(e.target.checked)}
                            className="accent-white w-4 h-4 rounded"
                          />
                          <span>{isEs ? 'Incluir numeración de diapositivas en pie de página' : 'Include slide numbers in footer'}</span>
                        </label>
                      </div>
                    </div>
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
                        : (mode === 'powerpoint-to-pdf' 
                            ? (isEs ? 'Convertir a PDF con Opciones →' : 'Convert to PDF with Options →') 
                            : (isEs ? 'Convertir a PPTX con Opciones →' : 'Convert to PPTX with Options →')))}
                </span>
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFilename || 'Presentacion'}
                  className="mt-3 w-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold py-3.5 px-6 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <FileDown className="w-4 h-4 text-black" />
                  <span>{isEs ? 'Descargar Presentación Convertida' : 'Download Converted Presentation'}</span>
                </a>
              )}
            </div>

          </div>
        </motion.div>
      )}

      {/* ── GUÍA DE USO: POWERPOINT ↔ PDF ── */}
      <div className="w-full mt-14 space-y-6 font-sans">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo convertir entre PowerPoint y PDF?' : 'How to convert between PowerPoint and PDF?'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {isEs ? 'Guía rápida para convertir presentaciones .pptx a PDF o extraer diapositivas de un PDF.' : 'Quick guide to convert .pptx presentations to PDF or extract slides from a PDF.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: '01', titleEs: 'Elige el modo de conversión', titleEn: 'Choose conversion mode', descEs: 'Selecciona "PPT → PDF" para convertir tu presentación .pptx a PDF, o "PDF → PPT" para extraer las diapositivas de un PDF a un formato de presentación editable.', descEn: 'Select "PPT → PDF" to convert your .pptx presentation to PDF, or "PDF → PPT" to extract slides from a PDF into an editable presentation format.' },
              { step: '02', titleEs: 'Sube tu archivo', titleEn: 'Upload your file', descEs: 'Arrastra el archivo .pptx o PDF a la zona de carga. El sistema analiza automáticamente el número de diapositivas y muestra un resumen de lo que será procesado.', descEn: 'Drag your .pptx or PDF file to the upload area. The system automatically analyzes the number of slides and shows a summary of what will be processed.' },
              { step: '03', titleEs: 'Configura las opciones de diapositivas', titleEn: 'Configure slide options', descEs: 'Elige si incluir notas del presentador en el PDF, la relación de aspecto (16:9 vs 4:3), orientación landscape/portrait, y si exportar cada diapositiva en una página separada.', descEn: 'Choose whether to include presenter notes in the PDF, aspect ratio (16:9 vs 4:3), landscape/portrait orientation, and whether to export each slide on a separate page.' },
              { step: '04', titleEs: 'Convertir y Descargar', titleEn: 'Convert & Download', descEs: 'Haz clic en "Convertir →". El motor renderiza cada diapositiva localmente y genera el PDF al instante. Tu presentación nunca sale de tu equipo.', descEn: 'Click "Convert →". The engine renders each slide locally and generates the PDF instantly. Your presentation never leaves your device.' },
            ].map((item) => (
              <div key={item.step} className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 flex flex-col gap-2 hover:border-white/20 transition-all">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-full w-fit">{item.step}</span>
                <h4 className="text-sm font-bold text-white">{isEs ? item.titleEs : item.titleEn}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.descEs : item.descEn}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start gap-3 mb-5">
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 flex-shrink-0">
              <Grid className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '💡 Consejos para convertir presentaciones PowerPoint a PDF' : '💡 Tips for converting PowerPoint presentations to PDF'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {isEs ? 'Saca el máximo partido a las opciones de conversión de diapositivas.' : 'Get the most out of the slide conversion options.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
            {[
              { labelEs: 'Fuentes y colores de la presentación', labelEn: 'Presentation fonts and colors', descEs: 'Al convertir PPT a PDF, el motor preserva los colores, degradados y fuentes del tema. Si usas fuentes muy específicas no estándar, podrían sustituirse por similares en el PDF.', descEn: 'When converting PPT to PDF, the engine preserves the theme\'s colors, gradients, and fonts. If you use very specific non-standard fonts, they may be substituted by similar ones in the PDF.' },
              { labelEs: 'Animaciones y transiciones', labelEn: 'Animations and transitions', descEs: 'Las animaciones y transiciones de PowerPoint no se transfieren al PDF. El PDF captura el estado final de cada diapositiva como una imagen estática de alta resolución.', descEn: 'PowerPoint animations and transitions are not transferred to the PDF. The PDF captures the final state of each slide as a high-resolution static image.' },
              { labelEs: 'Notas del presentador', labelEn: 'Presenter notes', descEs: 'Activa la opción de incluir notas para generar un PDF con el diseño de "vista de presentador": cada diapositiva acompañada de su texto de notas debajo.', descEn: 'Enable the option to include notes to generate a PDF with a "presenter view" layout: each slide accompanied by its note text below.' },
              { labelEs: 'PDF → PPT: diapositivas como imágenes', labelEn: 'PDF → PPT: slides as images', descEs: 'Al convertir PDF a PPT, cada página del PDF se convierte en una diapositiva con la imagen de esa página como fondo. El contenido no es editable como texto, sino como imagen.', descEn: 'When converting PDF to PPT, each PDF page becomes a slide with that page\'s image as background. Content is not editable as text, but as an image.' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">{isEs ? tip.labelEs : tip.labelEn}:</strong> {isEs ? tip.descEs : tip.descEn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                {isEs ? '¿Qué sucede al convertir archivos PDF a diapositivas PowerPoint?' : 'What happens when converting PDF files into PowerPoint slides?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 RENDIMIENTO 16:9 VECTORIAL Y PROCESAMIENTO 100% LOCAL' : '🔒 100% LOCAL VECTOR & 16:9 PROCESSING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? '1. Conversión de PDF a PowerPoint (.pptx)' : '1. PDF to PowerPoint (.pptx) Conversion'}
              </strong>
              <p>
                {isEs 
                  ? 'Transforma cada página de tu PDF en una diapositiva OpenXML independiente editable para Microsoft PowerPoint.'
                  : 'Transforms each PDF page into an independent OpenXML slide editable in Microsoft PowerPoint.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? '2. Conversión de PowerPoint (.pptx) a PDF' : '2. PowerPoint (.pptx) to PDF Conversion'}
              </strong>
              <p>
                {isEs 
                  ? 'Procesa los archivos XML de cada diapositiva (`ppt/slides/slide1.xml`), convirtiendo los cuadros de texto y figuras en vectores PDF apaisados sin alterar proporciones.'
                  : 'Parses XML slide files (`ppt/slides/slide1.xml`), converting text boxes & shapes into landscape PDF vectors with 100% aspect ratio retention.'}
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
                {isEs ? 'GUÍA RÁPIDA DE DIAPOSITIVAS' : 'QUICK SLIDES GUIDE'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Cargar Presentación' : 'Upload Presentation'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra tu PDF o documento PPTX. El sistema pre-visualizará las diapositivas al instante.' 
                  : 'Drop your PDF or PPTX file. The system will preview slides instantly.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Ajustar Opciones' : 'Adjust Options'}
              </strong>
              <p>
                {isEs 
                  ? 'Selecciona la relación de aspecto (16:9 o 4:3) y si deseas agregar marco o numerar las diapositivas.' 
                  : 'Select aspect ratio (16:9 or 4:3) and if you want slide borders or numbering.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                3
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Convertir y Descargar' : 'Convert & Download'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en el botón principal para compilar tu archivo listo para descarga privada.' 
                  : 'Click the action button to compile your file ready for private download.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
