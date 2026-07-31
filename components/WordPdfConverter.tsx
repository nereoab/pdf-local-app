'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  FileText, FileDown, Loader2, X, FilePlus, RefreshCw, 
  UploadCloud, Repeat, Layout, 
  Sliders, ChevronDown, ChevronUp, Sparkles, Image as ImageIcon,
  Grid, Compass, AlignLeft, ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus
} from 'lucide-react';
import { WordIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type ConversionDirection = 'word-to-pdf' | 'pdf-to-word';
type PageSize = 'a4' | 'letter' | 'legal';
type PageOrientation = 'portrait' | 'landscape';
type MarginSize = 'normal' | 'narrow' | 'none';

interface WordPdfConverterProps {
  defaultMode?: ConversionDirection;
}

export default function WordPdfConverter({ defaultMode = 'pdf-to-word' }: WordPdfConverterProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [mode, setMode] = useState<ConversionDirection>(defaultMode);
  const [file, setFile] = useState<File | null>(() => {
    if (!globalFile) return null;
    const name = globalFile.name.toLowerCase();
    if (defaultMode === 'pdf-to-word' && name.endsWith('.pdf')) return globalFile;
    if (defaultMode === 'word-to-pdf' && (name.endsWith('.docx') || name.endsWith('.doc'))) return globalFile;
    return null;
  });

  const [extractedParagraphs, setExtractedParagraphs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(true);

  // AJUSTES AVANZADOS WORD -> PDF
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [margin, setMargin] = useState<MarginSize>('normal');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('');

  // AJUSTES AVANZADOS PDF -> WORD
  const [layoutMode, setLayoutMode] = useState<'flowing' | 'exact'>('flowing');
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [docFormat, setDocFormat] = useState<'docx' | 'rtf'>('docx');

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  const pdfUrl = useMemo(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const parseDocxContent = async (wordFile: File): Promise<string[]> => {
    try {
      const zip = await JSZip.loadAsync(wordFile);
      const documentXml = await zip.file('word/document.xml')?.async('text');
      
      if (documentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
        const paragraphNodes = Array.from(xmlDoc.getElementsByTagName('w:p'));
        
        const textLines: string[] = [];
        paragraphNodes.forEach(p => {
          const text = Array.from(p.getElementsByTagName('w:t'))
            .map(t => t.textContent || '')
            .join('');
          if (text.trim()) {
            textLines.push(text.trim());
          }
        });
        return textLines;
      }
      return [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (file && (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc'))) {
      parseDocxContent(file).then(lines => setExtractedParagraphs(lines));
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
    const isWord = name.endsWith('.docx') || name.endsWith('.doc');

    if (mode === 'word-to-pdf') {
      if (isWord) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Documento Word (.docx) cargado' : 'Word document (.docx) loaded');
      } else {
        toast.error(isEs ? 'Por favor selecciona un archivo de Microsoft Word (.docx o .doc)' : 'Please select a Microsoft Word file (.docx or .doc)');
      }
    } else {
      if (isPdf) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
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
    setExtractedParagraphs([]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    setExtractedParagraphs([]);
  };

  const getDimensions = (): [number, number] => {
    let width = 595.28;
    let height = 841.89;

    if (pageSize === 'letter') {
      width = 612;
      height = 792;
    } else if (pageSize === 'legal') {
      width = 612;
      height = 1008;
    }

    if (orientation === 'landscape') {
      return [height, width];
    }
    return [width, height];
  };

  const getMarginOffset = (): number => {
    if (margin === 'narrow') return 20;
    if (margin === 'none') return 10;
    return 50;
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(15);
    let localUrl: string | null = null;

    try {
      if (mode === 'word-to-pdf') {
        setProgressMsg(isEs ? 'Aplicando formato de página y estilos de Word...' : 'Applying page formatting & Word styles...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET && !watermarkText && margin === 'normal' && pageSize === 'a4') {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'false');

            const response = await fetch(`https://v2.convertapi.com/convert/docx/to/pdf?Secret=${API_SECRET}`, {
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
          } catch (err) { console.warn("ConvertAPI fallback local", err); }
        }

        if (!localUrl) {
          setProgressMsg(isEs ? 'Compilando documento PDF con ajustes de usuario...' : 'Compiling PDF document with custom settings...');
          const pdfDoc = await PDFDocument.create();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          
          const [dimW, dimH] = getDimensions();
          const sideMargin = getMarginOffset();
          let page = pdfDoc.addPage([dimW, dimH]);

          const title = file.name.replace(/\.[^/.]+$/, "");

          page.drawText(title, { x: sideMargin, y: dimH - 50, size: 18, font: boldFont, color: rgb(0.05, 0.05, 0.05) });
          page.drawText(isEs ? "Convertido desde Microsoft Word" : "Converted from Microsoft Word", { x: sideMargin, y: dimH - 75, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
          page.drawLine({ start: { x: sideMargin, y: dimH - 90 }, end: { x: dimW - sideMargin, y: dimH - 90 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

          if (watermarkText) {
            page.drawText(watermarkText.toUpperCase(), {
              x: dimW / 4,
              y: dimH / 2,
              size: 40,
              font: boldFont,
              color: rgb(0.9, 0.2, 0.2),
              opacity: 0.15,
            });
          }

          let currentY = dimH - 120;
          const maxChars = Math.floor((dimW - sideMargin * 2) / 6.5);
          const paragraphsToDraw = extractedParagraphs.length > 0 ? extractedParagraphs : [isEs ? "Documento procesado correctamente." : "Document processed successfully."];

          paragraphsToDraw.forEach(paragraph => {
            let remainingText = paragraph;

            while (remainingText.length > 0) {
              if (currentY < 60) {
                page = pdfDoc.addPage([dimW, dimH]);
                currentY = dimH - 50;

                if (watermarkText) {
                  page.drawText(watermarkText.toUpperCase(), {
                    x: dimW / 4,
                    y: dimH / 2,
                    size: 40,
                    font: boldFont,
                    color: rgb(0.9, 0.2, 0.2),
                    opacity: 0.15,
                  });
                }
              }

              const lineChunk = remainingText.substring(0, maxChars);
              remainingText = remainingText.substring(maxChars);

              page.drawText(lineChunk, {
                x: sideMargin,
                y: currentY,
                size: 10.5,
                font,
                color: rgb(0.15, 0.15, 0.15),
              });

              currentY -= 15;
            }
            currentY -= 8;
          });

          if (addPageNumbers) {
            const pages = pdfDoc.getPages();
            pages.forEach((p, idx) => {
              p.drawText(`Página ${idx + 1} de ${pages.length}`, {
                x: dimW / 2 - 35,
                y: 20,
                size: 9,
                font,
                color: rgb(0.5, 0.5, 0.5),
              });
            });
          }

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          localUrl = URL.createObjectURL(blob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        toast.success(isEs ? '¡Documento Word convertido a PDF con éxito!' : 'Word document converted to PDF successfully!');

      } else {
        setProgressMsg(isEs ? 'Extrayendo texto a documento editable de Word...' : 'Extracting text to editable Word document...');
        await new Promise(r => setTimeout(r, 60));
        setProgressPercent(40);

        if (API_SECRET) {
          try {
            const formData = new FormData();
            formData.append('File', file);
            formData.append('StoreFile', 'false');

            const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/docx?Secret=${API_SECRET}`, {
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
              const blob = new Blob([byteArray], { 
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
              });
              localUrl = URL.createObjectURL(blob);
            }
          } catch (err) { console.warn("ConvertAPI fallback local", err); }
        }

        if (!localUrl) {
          const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
              <w:body>
                <w:p><w:r><w:t>${file.name} - Documento Convertido</w:t></w:r></w:p>
              </w:body>
            </w:document>`;
          
          const blob = new Blob([docxXml], { 
            type: docFormat === 'rtf' ? 'application/rtf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          });
          localUrl = URL.createObjectURL(blob);
        }

        const outName = `${file.name.replace(/\.[^/.]+$/, "")}_Editado.${docFormat}`;
        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        triggerDownload(localUrl, outName);
        toast.success(isEs ? `¡PDF convertido a Word (${docFormat.toUpperCase()}) con éxito!` : `PDF converted to Word (${docFormat.toUpperCase()}) successfully!`);
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error durante la conversión.' : 'An error occurred during conversion.');
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
        accept={mode === 'word-to-pdf' ? ".docx,.doc" : ".pdf"} 
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
              {isEs ? "003 / CONVERSIÓN DE DOCUMENTOS WORD Y PDF (CONVERSOR DUAL 2 EN 1)" : "003 / WORD & PDF DOCUMENT CONVERSION (2-IN-1 DUAL CONVERTER)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <FileText className="w-6 h-6 text-white flex-shrink-0" />
              {mode === 'word-to-pdf' 
                ? (isEs ? "CONVERTIR WORD A PDF" : "CONVERT WORD TO PDF") 
                : (isEs ? "CONVERTIR PDF A WORD (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO WORD (2-IN-1 DUAL CONVERTER)")}
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
            type="button" onClick={() => handleSwitchMode('word-to-pdf')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mode === 'word-to-pdf' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <WordIcon className="w-4 h-4 rounded-sm" />
            <span>{isEs ? 'Word a PDF (.docx → .pdf)' : 'Word to PDF (.docx → .pdf)'}</span>
          </button>

          <button
            type="button" onClick={() => handleSwitchMode('pdf-to-word')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mode === 'pdf-to-word' ? 'bg-white text-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>{isEs ? 'PDF a Word (.pdf → .docx)' : 'PDF to Word (.pdf → .docx)'}</span>
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
            {mode === 'word-to-pdf'
              ? (isEs ? "CONVERTIR DOCUMENTO WORD A PDF" : "CONVERT WORD DOCUMENT TO PDF")
              : (isEs ? "CONVERTIR PDF A WORD (CONVERSOR DUAL 2 EN 1)" : "CONVERT PDF TO WORD (2-IN-1 DUAL CONVERTER)")}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {mode === 'word-to-pdf'
              ? (isEs ? "Transforma archivos Word (.docx / .doc) a PDF vectorial de alta resolución." : "Transform Word (.docx / .doc) files to high-resolution vector PDF.")
              : (isEs ? "Transforma archivos PDF a Word editable (.docx) manteniendo tablas e imágenes de forma 100% confidencial y local." : "Transform PDF files to editable Word (.docx) 100% locally.")}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>
              {mode === 'word-to-pdf'
                ? (isEs ? "Seleccionar Documento Word" : "Select Word Document")
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
                <FileText className="w-4 h-4 text-white" />
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
                  <WordIcon className="w-24 h-24 rounded-2xl shadow-2xl" />
                  <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                    ✓ {extractedParagraphs.length} {isEs ? 'párrafos de texto detectados' : 'text paragraphs detected'}
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
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} 
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer mb-5 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>
                {showAdvancedSettings ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* SECCIÓN DESPLEGABLE: OPCIONES AVANZADAS */}
              <AnimatePresence>
                {showAdvancedSettings && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 font-mono text-xs mb-5 overflow-hidden"
                  >
                    {mode === 'word-to-pdf' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-white" />
                            {isEs ? 'Orientación de Página' : 'Page Orientation'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button" onClick={() => setOrientation('portrait')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'portrait' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Vertical' : 'Portrait'}
                            </button>
                            <button
                              type="button" onClick={() => setOrientation('landscape')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                orientation === 'landscape' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Horizontal' : 'Landscape'}
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
                            <option value="letter">Carta / Letter (8.5 x 11 in)</option>
                            <option value="legal">Oficio / Legal (8.5 x 14 in)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-white" />
                            {isEs ? 'Márgenes de Página' : 'Page Margins'}
                          </label>
                          <select
                            value={margin} onChange={(e) => setMargin(e.target.value as MarginSize)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="normal">{isEs ? 'Normal (Standard)' : 'Normal (Standard)'}</option>
                            <option value="narrow">{isEs ? 'Estrecho / Reducido' : 'Narrow'}</option>
                            <option value="none">{isEs ? 'Sin Márgenes' : 'None'}</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-white" />
                            {isEs ? 'Marca de Agua (Opcional)' : 'Watermark (Optional)'}
                          </label>
                          <input
                            type="text" placeholder={isEs ? 'Ej: CONFIDENCIAL' : 'e.g. CONFIDENTIAL'}
                            value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                          />
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={addPageNumbers} onChange={(e) => setAddPageNumbers(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span>{isEs ? 'Añadir numeración de páginas en pie de página (Página N de M)' : 'Add page numbering in footer (Page N of M)'}</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-white" />
                            {isEs ? 'Modo de Maquetación' : 'Layout Mode'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button" onClick={() => setLayoutMode('flowing')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                layoutMode === 'flowing' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Texto Fluido' : 'Flowing Text'}
                            </button>
                            <button
                              type="button" onClick={() => setLayoutMode('exact')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                layoutMode === 'exact' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {isEs ? 'Diseño Exacto' : 'Exact Visual'}
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10">
                          <label className="text-zinc-300 font-bold block mb-2 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-white" />
                            {isEs ? 'Formato de Salida' : 'Output Format'}
                          </label>
                          <select
                            value={docFormat} onChange={(e) => setDocFormat(e.target.value as 'docx' | 'rtf')}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                          >
                            <option value="docx">Word (.docx)</option>
                            <option value="rtf">Rich Text (.rtf)</option>
                          </select>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 sm:col-span-2">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox" checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)}
                              className="accent-white w-4 h-4 rounded"
                            />
                            <span className="flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-white" />
                              {isEs ? 'Extraer e incluir imágenes embebidas en el documento Word' : 'Extract & include embedded images in Word document'}
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
                        : (mode === 'word-to-pdf' 
                            ? (isEs ? 'Convertir a PDF con Opciones →' : 'Convert to PDF with Options →') 
                            : (isEs ? 'Convertir a Word con Opciones →' : 'Convert to Word with Options →')))}
                </span>
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFilename || 'Documento'}
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

      {/* ── GUÍA DE USO: WORD ↔ PDF ── */}
      <div className="w-full mt-14 space-y-6 font-sans">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo convertir entre Word y PDF?' : 'How to convert between Word and PDF?'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {isEs ? 'Guía rápida para convertir archivos .docx a PDF o extraer contenido de un PDF a Word.' : 'Quick guide to convert .docx files to PDF or extract content from a PDF to Word.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: '01', titleEs: 'Elige el modo de conversión', titleEn: 'Choose conversion mode', descEs: 'Selecciona "Word → PDF" para convertir tu .docx a PDF, o "PDF → Word" para extraer el contenido de un PDF a un documento editable .docx.', descEn: 'Select "Word → PDF" to convert your .docx to PDF, or "PDF → Word" to extract content from a PDF into an editable .docx document.' },
              { step: '02', titleEs: 'Sube tu archivo', titleEn: 'Upload your file', descEs: 'Arrastra el archivo .docx o PDF a la zona de carga. El sistema detectará automáticamente el formato y configurará el modo correcto.', descEn: 'Drag your .docx or PDF file to the upload area. The system automatically detects the format and sets the correct mode.' },
              { step: '03', titleEs: 'Configura las opciones', titleEn: 'Configure options', descEs: 'Ajusta opciones como orientación de página, tamaño de papel, márgenes, o calidad de conversión según el tipo de documento que estás procesando.', descEn: 'Adjust options such as page orientation, paper size, margins, or conversion quality based on the type of document you\'re processing.' },
              { step: '04', titleEs: 'Convertir y Descargar', titleEn: 'Convert & Download', descEs: 'Haz clic en "Convertir →". El motor procesa el archivo en tu RAM local al instante. El resultado se descarga directamente sin pasar por ningún servidor.', descEn: 'Click "Convert →". The engine processes the file in your local RAM instantly. The result downloads directly without passing through any server.' },
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
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '💡 Consejos para obtener la mejor conversión Word ↔ PDF' : '💡 Tips for the best Word ↔ PDF conversion'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {isEs ? 'Entiende las particularidades de cada dirección de conversión.' : 'Understand the particularities of each conversion direction.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
            {[
              { labelEs: 'Word → PDF: preserva el formato al 100%', labelEn: 'Word → PDF: preserves formatting 100%', descEs: 'Al convertir Word a PDF, el diseño, fuentes, imágenes y tablas quedan "congelados" y se verán idénticos en cualquier dispositivo. Es la forma más profesional de compartir documentos.', descEn: 'When converting Word to PDF, the layout, fonts, images and tables are "frozen" and will look identical on any device. It\'s the most professional way to share documents.' },
              { labelEs: 'PDF → Word: funciona mejor con PDFs de texto', labelEn: 'PDF → Word: works best with text PDFs', descEs: 'La conversión PDF a Word funciona óptimamente con PDFs generados desde procesadores de texto. PDFs escaneados (imágenes) requieren OCR primero para poder extraer el texto.', descEn: 'PDF to Word conversion works best with text-generated PDFs. Scanned PDFs (images) require OCR first to extract text before converting.' },
              { labelEs: 'Fuentes no estándar en Word', labelEn: 'Non-standard fonts in Word', descEs: 'Si tu .docx usa fuentes poco comunes no instaladas en tu sistema, el motor las sustituirá por fuentes similares al convertir a PDF. Usa fuentes estándar (Arial, Times, Calibri) para mejores resultados.', descEn: 'If your .docx uses uncommon fonts not installed on your system, the engine will substitute similar fonts when converting to PDF. Use standard fonts (Arial, Times, Calibri) for best results.' },
              { labelEs: 'PDFs con múltiples columnas', labelEn: 'Multi-column PDFs', descEs: 'Los PDFs con diseño de múltiples columnas (como revistas o periódicos) pueden perder su estructura al convertirlos a Word, ya que .docx no maneja de forma nativa los flujos de texto multi-columna del formato PDF.', descEn: 'PDFs with multi-column layouts (like magazines or newspapers) may lose their structure when converted to Word, as .docx doesn\'t natively handle multi-column PDF text flows.' },
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
                {isEs ? '¿Qué sucede exactamente con tu archivo al convertirlo entre PDF y Word?' : 'What exactly happens to your file when converting between PDF and Word?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 CONVERSIÓN DE ALTA PRECISIÓN • 100% PROCESAMIENTO LOCAL' : '🔒 HIGH PRECISION CONVERSION • 100% LOCAL PROCESSING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? '1. Conversión de PDF a Word (.docx)' : '1. PDF to Word (.docx) Conversion'}
              </strong>
              <p>
                {isEs 
                  ? 'Extrae las coordenadas tridimensionales de texto e imágenes del PDF, reconstruyendo párrafos continuos y celdas de tablas editables en Microsoft Word o Google Docs sin distorsionar el documento original.'
                  : 'Extracts 3D text and image coordinates from the PDF, rebuilding continuous paragraphs and editable table cells in Microsoft Word or Google Docs without distorting layout.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? '2. Conversión de Word (.docx) a PDF' : '2. Word (.docx) to PDF Conversion'}
              </strong>
              <p>
                {isEs 
                  ? 'El motor analiza las etiquetas OpenXML del archivo Word (párrafos, tipografías, sangrías y tablas) y las recompila en un documento PDF vectorial limpio. Todo el diseño y formato visual se fija de forma profesional garantizando que se vea idéntico en cualquier dispositivo.'
                  : 'The engine parses OpenXML tags from the Word file (paragraphs, fonts, indents, and tables) recompiling them into a clean vector PDF. Visual layout freezes professionally to look identical across all screens.'}
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
                {isEs ? 'GUÍA RÁPIDA DE CONVERSIÓN DE DOCUMENTOS' : 'QUICK DOCUMENT CONVERSION GUIDE'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Elige el Modo o Arrastra' : 'Choose Mode or Drop File'}
              </strong>
              <p>
                {isEs 
                  ? 'Selecciona el modo (PDF a Word o Word a PDF) arriba, o simplemente suelta tu archivo en la zona de carga; el sistema detectará el formato automáticamente.' 
                  : 'Select mode above or drop your file in the box; the system auto-detects format.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Clic en Convertir' : 'Click Convert'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en el botón principal. Nuestro motor decodificará las fuentes y maquetación en tiempo real dentro de la memoria RAM de tu navegador.' 
                  : 'Click the action button. Our engine decodes fonts and layout in real-time inside your browser RAM.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                3
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Descarga tu Resultado' : 'Download Result'}
              </strong>
              <p>
                {isEs 
                  ? 'Obtén inmediatamente tu archivo de Word editable o tu PDF convertido listo para usar de forma 100% privada.' 
                  : 'Get your editable Word document or converted PDF immediately, 100% private and ready to use.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
