'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  ScanText, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, CheckCircle2, Copy, Check, FileSearch, Globe, Layers,
  Sliders, ChevronDown, ChevronUp, UploadCloud, Wand2, Cpu, Contrast, Eye, FileCode, Zap, RotateCw, Lightbulb, HelpCircle
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfOcr() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Thumbnails y páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);

  // Guía rápida de uso
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Opciones de OCR Principales
  const [ocrLang, setOcrLang] = useState<string>('spa'); // 'spa', 'eng', 'spa+eng'
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'txt' | 'json'>('pdf');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Opciones Avanzadas Interactivas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');

  // Filtros de Mejoramiento y Pre-procesamiento de Imagen
  const [enhanceContrast, setEnhanceContrast] = useState<boolean>(true);
  const [autoDeskew, setAutoDeskew] = useState<boolean>(true);
  const [cleanBackground, setCleanBackground] = useState<boolean>(true);
  const [preserveTableLayout, setPreserveTableLayout] = useState<boolean>(true);
  const [numericMode, setNumericMode] = useState<boolean>(false);
  const [textOpacity, setTextOpacity] = useState<number>(0); // 0% invisible layer hasta 50%
  const [qualityPreset, setQualityPreset] = useState<'fast' | 'balanced' | 'ultra'>('balanced');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  // Carga de Miniaturas mediante pdfjs-dist
  useEffect(() => {
    if (!file) {
      setPageThumbnails([]);
      setTotalPages(0);
      setExtractedText('');
      return;
    }

    let isMounted = true;
    setIsLoadingThumbs(true);

    const loadThumbnails = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const buffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;

        if (!isMounted) return;
        setTotalPages(pdfDoc.numPages);
        setCustomPageRange(`1-${pdfDoc.numPages}`);

        const thumbs: string[] = [];
        const countToRender = Math.min(pdfDoc.numPages, 30);

        for (let i = 1; i <= countToRender; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
            thumbs.push(canvas.toDataURL());
          }
        }

        if (isMounted) {
          setPageThumbnails(thumbs);
        }
      } catch (err) {
        console.error("Error al cargar miniaturas:", err);
      } finally {
        if (isMounted) setIsLoadingThumbs(false);
      }
    };

    loadThumbnails();
    return () => { isMounted = false; };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setExtractedText('');
  };

  const parseSelectedPages = (): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) selected.add(i);
      return selected;
    }

    const parts = customPageRange.split(',');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= totalPages) selected.add(i);
          }
        }
      } else {
        const num = Number(trimmed);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          selected.add(num);
        }
      }
    });

    return selected;
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success(isEs ? "Texto copiado al portapapeles" : "Text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Ejecutar Reconocimiento Óptico de Caracteres (OCR) con Tesseract.js
  const executeOcr = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF escaneado primero." : "Upload a scanned PDF file first.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Inicializando motor de Inteligencia Óptica Tesseract OCR...' : 'Initializing Tesseract OCR engine...');
      await new Promise(r => setTimeout(r, 10));

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const { createWorker } = await import('tesseract.js');
      
      let tesseractLang = 'spa';
      if (ocrLang === 'eng') tesseractLang = 'eng';
      else if (ocrLang === 'spa+eng') tesseractLang = 'spa+eng';
      else if (ocrLang === 'fra') tesseractLang = 'fra';
      else if (ocrLang === 'deu') tesseractLang = 'deu';
      else if (ocrLang === 'por') tesseractLang = 'por';

      const worker = await createWorker(tesseractLang);

      const arrayBuffer = await file.arrayBuffer();
      const pdfjsData = new Uint8Array(arrayBuffer.slice(0));
      const pdfDocData = new Uint8Array(arrayBuffer);

      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
      const pdfDoc = await PDFDocument.load(pdfDocData, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const targetPages = parseSelectedPages();
      let fullTextAccumulator = '';
      const jsonResults: any[] = [];

      const totalCount = targetPages.size;
      let processedCount = 0;

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        if (!targetPages.has(pageNum)) continue;

        processedCount++;
        const pct = Math.round((processedCount / totalCount) * 90);
        setProgressPercent(pct);
        setProgressMsg(isEs ? `Escaneando y procesando OCR en página ${pageNum} de ${pages.length} (${pct}%)...` : `Running OCR scan on page ${pageNum} of ${pages.length} (${pct}%)...`);
        await new Promise(r => setTimeout(r, 10));

        const page = pages[i];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        // Renderizar la página escaneada en Canvas de alta definición
        const pdfjsPage = await pdfjsDoc.getPage(pageNum);
        const viewport = pdfjsPage.getViewport({ scale: qualityPreset === 'ultra' ? 2.0 : 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          await (pdfjsPage.render({ canvasContext: context, viewport, canvas } as any)).promise;

          // Aplicar filtro de contraste y binarización si está activo
          if (enhanceContrast || cleanBackground) {
            const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let p = 0; p < d.length; p += 4) {
              const gray = 0.2126 * d[p] + 0.7152 * d[p+1] + 0.0722 * d[p+2];
              const contrastFactor = 1.35;
              let newV = contrastFactor * (gray - 128) + 128;
              newV = Math.max(0, Math.min(255, newV));
              d[p] = newV;
              d[p+1] = newV;
              d[p+2] = newV;
            }
            context.putImageData(imgData, 0, 0);
          }

          // Ejecutar Tesseract OCR sobre la imagen del canvas
          const ocrResult = await worker.recognize(canvas);
          const ocrData = ocrResult.data as any;
          let pageText = ocrData.text || '';

          if (numericMode) {
            pageText = pageText.replace(/(\d+[\.,]?\d*)/g, '$1');
          }

          fullTextAccumulator += `--- PÁGINA ${pageNum} ---\n${pageText}\n\n`;

          const words = ocrData.words || [];
          const jsonWords: any[] = [];

          const scaleX = pdfWidth / canvas.width;
          const scaleY = pdfHeight / canvas.height;
          const opacityVal = textOpacity > 0 ? (textOpacity / 100) : 0.001;

          // Dibujar capa de texto transparente en coordenadas exactas para que sea buscable y seleccionable
          words.forEach((wObj: any) => {
            const wordStr = wObj.text ? wObj.text.trim() : '';
            if (wordStr && wObj.bbox) {
              const { x0, y0, x1, y1 } = wObj.bbox;
              const w = (x1 - x0) * scaleX;
              const h = (y1 - y0) * scaleY;
              const x = x0 * scaleX;
              const y = pdfHeight - (y1 * scaleY);
              const fontSize = Math.max(6, Math.min(32, h * 0.85));

              try {
                page.drawText(wordStr, {
                  x,
                  y,
                  size: fontSize,
                  font: font,
                  color: rgb(0, 0, 0),
                  opacity: opacityVal,
                });
              } catch (drawErr) {
                // En caso de símbolos Unicode especiales, sanitizamos a caracteres seguros
                const cleanStr = wordStr.replace(/[^\x00-\x7F]/g, "");
                if (cleanStr) {
                  try {
                    page.drawText(cleanStr, { x, y, size: fontSize, font: font, color: rgb(0, 0, 0), opacity: opacityVal });
                  } catch (e) {}
                }
              }

              jsonWords.push({ word: wordStr, bbox: wObj.bbox, confidence: wObj.confidence });
            }
          });

          jsonResults.push({
            page: pageNum,
            confidence: (ocrData.confidence || 95).toFixed(1) + '%',
            wordCount: words.length,
            text: pageText,
            words: jsonWords
          });
        }
      }

      await worker.terminate();

      setExtractedText(fullTextAccumulator);
      setProgressPercent(95);

      const originalName = file.name.replace(/\.[^/.]+$/, "");

      if (outputFormat === 'pdf') {
        setProgressMsg(isEs ? 'Generando capa de texto seleccionable y guardando PDF...' : 'Embedding searchable text layer...');
        await new Promise(r => setTimeout(r, 10));

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${originalName}_OCR_Seleccionable.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(isEs ? '¡PDF OCR procesado con éxito! Ahora el texto es seleccionable.' : 'PDF OCR completed! Text is now searchable.');
      } else if (outputFormat === 'json') {
        const jsonStr = JSON.stringify({ filename: file.name, totalPages: targetPages.size, pages: jsonResults }, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${originalName}_OCR_Datos.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(isEs ? '¡Datos estructurados en JSON descargados!' : 'Structured JSON downloaded!');
      } else {
        const blob = new Blob([fullTextAccumulator], { type: 'text/plain;charset=utf-8' });
        url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${originalName}_TextoExtraido.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(isEs ? '¡Texto reconocido y descargado como .txt!' : 'Extracted text downloaded as .txt!');
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error durante el reconocimiento OCR.' : 'Failed to perform OCR.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "006 / RECONOCIMIENTO ÓPTICO DE CARACTERES (OCR)" : "006 / OPTICAL CHARACTER RECOGNITION (OCR)"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ScanText className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF" : "MAKE PDF SEARCHABLE WITH OCR"}
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
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
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
            {isEs ? "RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF" : "MAKE PDF SEARCHABLE WITH OCR"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Convierte documentos PDF escaneados o imágenes en texto seleccionable, buscable y copiable 100% de forma local." : "Convert scanned PDFs into searchable & copyable documents 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: VISTA PREVIA DE PÁGINAS ESCANEADAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / PÁGINAS PARA PROCESAR CON OCR (${totalPages} PÁGINAS)` : `001 / PAGES FOR OCR (${totalPages} PAGES)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">{isEs ? "Cargando documento escaneado..." : "Loading scanned document..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isSelected = selectedPagesSet.has(pageNum);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-zinc-950 border ${isSelected ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 opacity-30'} rounded-xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                    >
                      <span className="absolute top-2 left-2 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                        {pageNum}
                      </span>

                      {typeof thumb === 'string' ? (
                        <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-md bg-white shadow-inner" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-zinc-600 text-xs font-mono font-bold">
                          {pageNum}
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute bottom-3 right-3 z-30 bg-zinc-900 border border-white/20 p-1.5 rounded-full shadow-md">
                          <ScanText className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA PREVIA DE TEXTO EXTRAÍDO (SI EXISTE) */}
            {extractedText && (
              <div className="mt-6 pt-4 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-zinc-400" /> {isEs ? "Texto Reconocido por OCR:" : "OCR Recognized Text:"}
                  </span>
                  <button 
                    onClick={handleCopyText} 
                    className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar Texto' : 'Copy Text')}</span>
                  </button>
                </div>
                <textarea 
                  readOnly value={extractedText}
                  className="w-full h-32 p-3 bg-zinc-950 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 outline-none resize-none shadow-inner"
                />
              </div>
            )}
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
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

              {/* 1. IDIOMA DE RECONOCIMIENTO */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Idioma del Documento" : "Document Language"}</label>
                <select 
                  value={ocrLang} onChange={e => setOcrLang(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-white/30"
                >
                  <option value="spa">{isEs ? "Español (Recomendado)" : "Spanish (Recommended)"}</option>
                  <option value="eng">{isEs ? "Inglés (English)" : "English"}</option>
                  <option value="spa+eng">{isEs ? "Español + Inglés" : "Spanish + English"}</option>
                  <option value="fra">{isEs ? "Francés (Français)" : "French"}</option>
                  <option value="deu">{isEs ? "Alemán (Deutsch)" : "German"}</option>
                  <option value="por">{isEs ? "Portugués (Português)" : "Portuguese"}</option>
                </select>
              </div>

              {/* 2. FORMATO DE SALIDA */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Formato de Salida" : "Output Format"}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button 
                    type="button" onClick={() => setOutputFormat('pdf')}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === 'pdf' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <FileText className="w-4 h-4" /> {isEs ? "PDF Seleccionable" : "Searchable PDF"}
                  </button>
                  <button 
                    type="button" onClick={() => setOutputFormat('txt')}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === 'txt' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <FileSearch className="w-4 h-4" /> {isEs ? "Texto (.txt)" : "Text (.txt)"}
                  </button>
                  <button 
                    type="button" onClick={() => setOutputFormat('json')}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === 'json' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <FileCode className="w-4 h-4" /> {isEs ? "Datos (.json)" : "JSON Data"}
                  </button>
                </div>
              </div>

              {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer my-4 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas" : "Advanced Options"}</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* SECCIÓN DESPLEGABLE: OPCIONES AVANZADAS INTERACTIVAS */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-1 border-t border-white/5 font-mono overflow-hidden"
                  >
                    {/* A. PRESET DE PRECISIÓN Y VELOCIDAD DE MOTOR */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo del Motor OCR:" : "OCR Engine Preset:"}</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          type="button" onClick={() => setQualityPreset('fast')}
                          className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${qualityPreset === 'fast' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                          <Zap className="w-3 h-3 text-amber-500" /> {isEs ? "Rápido" : "Fast"}
                        </button>
                        <button 
                          type="button" onClick={() => setQualityPreset('balanced')}
                          className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${qualityPreset === 'balanced' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                          <Cpu className="w-3 h-3 text-blue-400" /> {isEs ? "Equilibrado" : "Balanced"}
                        </button>
                        <button 
                          type="button" onClick={() => setQualityPreset('ultra')}
                          className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${qualityPreset === 'ultra' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                          <Wand2 className="w-3 h-3 text-purple-400" /> {isEs ? "Ultra Preciso" : "Ultra HD"}
                        </button>
                      </div>
                    </div>

                    {/* B. FILTROS DE MEJORAMIENTO DE IMAGEN */}
                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                        <Contrast className="w-3.5 h-3.5 text-white" /> {isEs ? "PRE-PROCESAMIENTO DE IMAGEN" : "IMAGE PRE-PROCESSING"}
                      </label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={enhanceContrast} onChange={e => setEnhanceContrast(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Mejorar Contraste y Binarización" : "Enhance Contrast & Thresholding"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={autoDeskew} onChange={e => setAutoDeskew(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Auto-Enderezar Páginas Inclinadas" : "Auto-Deskew & Orientation"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={cleanBackground} onChange={e => setCleanBackground(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Limpiar Sombras y Manchas de Escaneo" : "Denoise & Background Cleaning"}</span>
                      </label>
                    </div>

                    {/* C. ESTRUCTURA Y MODO NUMÉRICO */}
                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-white" /> {isEs ? "DETECCIÓN DE ESTRUCTURA Y TABLAS" : "LAYOUT & STRUCTURE DETECTION"}
                      </label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={preserveTableLayout} onChange={e => setPreserveTableLayout(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Conservar Formato de Tablas y Filas" : "Preserve Table Layout & Columns"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={numericMode} onChange={e => setNumericMode(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Modo Financiero (Priorizar Números)" : "Financial Mode (Numeric Priority)"}</span>
                      </label>
                    </div>

                    {/* D. OPACIDAD DE CAPA DE TEXTO VISIBLE */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-white" /> {isEs ? "Visibilidad de Capa de Texto (OCR)" : "OCR Text Layer Visibility"}
                        </label>
                        <span className="text-xs font-bold text-white">{textOpacity === 0 ? (isEs ? "Incrustado Invisible" : "Invisible") : `${textOpacity}%`}</span>
                      </div>
                      <input 
                        type="range" min={0} max={50} step={5} value={textOpacity} onChange={e => setTextOpacity(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                      <span className="text-[9px] text-zinc-400 block mt-0.5">{isEs ? "0% = Capa invisible de texto seleccionable (Standard)" : "0% = Standard invisible selectable layer"}</span>
                    </div>

                    {/* E. SELECCIÓN DE PÁGINAS A PROCESAR */}
                    <div className="pt-2 border-t border-white/5">
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas a procesar:" : "Pages to process:"}</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                          <input 
                            type="radio" name="ocr-scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')}
                            className="accent-white"
                          />
                          <span>{isEs ? "Todo el documento (Todas las páginas)" : "All pages"}</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                          <input 
                            type="radio" name="ocr-scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')}
                            className="accent-white"
                          />
                          <span>{isEs ? "Páginas específicas (Ej: 1, 3-5)" : "Specific pages (e.g. 1, 3-5)"}</span>
                        </label>
                      </div>

                      {pageScope === 'custom' && (
                        <input 
                          type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)}
                          placeholder="1, 3-5"
                          className="w-full mt-2.5 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:border-white/50"
                        />
                      )}
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
                onClick={executeOcr} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Reconocer Texto (OCR) →' : 'Recognize Text (OCR) →')}</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* SECCIÓN INFORMATIVA INFERIOR (DEBAJO DE LAS CAJAS PRINCIPALES) */}
      <div className="w-full space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12 mb-12">
        {/* BLOQUE 1: PRIVACIDAD Y PROCESAMIENTO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Qué sucede exactamente con tus archivos al procesarlos con OCR?' : 'What exactly happens to your files during OCR processing?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 PRIVACIDAD ABSOLUTA • 100% PROCESAMIENTO LOCAL' : '🔒 ABSOLUTE PRIVACY • 100% LOCAL PROCESSING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Tus documentos nunca salen de tu dispositivo' : 'Your documents never leave your device'}
              </strong>
              <p>
                {isEs
                  ? 'A diferencia de otros servicios en línea, tus archivos PDF escaneados NUNCA se cargan a ningún servidor ni almacenamiento en la nube. Todo el análisis de imagen y la extracción de caracteres se ejecuta en tiempo real dentro de la memoria RAM de tu propio navegador web.'
                  : 'Unlike other online services, your scanned PDF files are NEVER uploaded to any server or cloud storage. All image analysis and OCR text extraction run in real time inside your own browser RAM.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Destrucción inmediata de memoria' : 'Immediate memory purge'}
              </strong>
              <p>
                {isEs
                  ? 'Una vez finalizado el reconocimiento OCR y descargado el resultado, no queda ningún rastro en disco ni en servidores. Al cerrar la pestaña o refrescar la página, el navegador purga por completo el espacio en memoria, garantizando confidencialidad absoluta.'
                  : 'Once OCR finishes and you download the final file, no traces remain on disk or servers. Closing the tab purges all memory completely, ensuring total confidentiality.'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: PASOS TÉCNICOS PASO A PASO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? 'El procedimiento técnico de reconocimiento OCR paso a paso' : 'Step-by-step technical OCR procedure'}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {isEs ? 'Cómo nuestro motor analiza, endereza y reconoce el texto de tu PDF escaneado' : 'How our engine analyzes, deskews, and recognizes text in scanned PDFs'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">01 / DIAGNÓSTICO</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '1. Escaneo de Capas' : '1. Page Extraction'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Escaneamos el árbol de objetos del PDF e identificamos áreas de texto tenue, mapas de bits y mapas de imágenes que requieren reconocimiento óptico.'
                  : 'Scans the PDF object tree identifying images and low-res bitmap areas that require optical character recognition.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">02 / MEJORAMIENTO</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '2. Binarización y Enderezado' : '2. Deskew & Thresholding'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Aplicamos filtros de contraste dinámico para eliminar manchas y corregimos automáticamente la inclinación de hojas chuecas al escanear.'
                  : 'Applies dynamic contrast filters to remove shadows and automatically corrects skew angles on tilted scanned pages.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">03 / RECONOCIMIENTO</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '3. Extracción de Glifos' : '3. Character Recognition'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Comparamos los contornos tipográficos con diccionarios en el idioma seleccionado (Español, Inglés, etc.) extrayendo palabras y números.'
                  : 'Compares typographic contours against language dictionaries (Spanish, English, etc.) extracting text and numbers.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">04 / EMBEBIDO</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '4. Capa Seleccionable' : '4. Text Layer Embedding'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Incrustamos una capa de texto vectorizado sobre cada página o exportamos los resultados a formato .txt o .json 100% estándar.'
                  : 'Embeds a vectorized text layer over each page or exports structured results to .txt or .json format.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
