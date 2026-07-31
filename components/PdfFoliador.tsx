'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  Hash, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, FileText, 
  Trash2, Plus, LayoutGrid, Check, FileCheck, UploadCloud, Sliders, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// Conversor a números romanos para opciones avanzadas
const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  let n = num;
  for (let i in lookup) {
    while (n >= lookup[i]) {
      roman += i;
      n -= lookup[i];
    }
  }
  return roman || `${num}`;
};

export default function PdfFoliador() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Thumbnails y páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);

  // Opciones Principales de Foliado
  const [pageMode, setPageMode] = useState<'single' | 'facing'>('single');
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [textFormat, setTextFormat] = useState<string>('only-number');
  const [customPrefix, setCustomPrefix] = useState<string>('Folio');

  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [margin, setMargin] = useState<'small' | 'recommended' | 'big'>('recommended');
  const [fontSizeOption, setFontSizeOption] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontColor, setFontColor] = useState<string>('dark');
  const [numberStyle, setNumberStyle] = useState<'arabic' | 'padded' | 'roman'>('arabic');
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  const [firstNumber, setFirstNumber] = useState<number>(1);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  // Carga de Miniaturas PDF mediante pdfjs-dist
  useEffect(() => {
    if (!file) {
      setPageThumbnails([]);
      setTotalPages(0);
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
        setStartPage(1);
        setEndPage(pdfDoc.numPages);

        const thumbs: string[] = [];
        const countToRender = Math.min(pdfDoc.numPages, 40);

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
  };

  // Mapeo visual de punto rojo de posición según matriz 3x3
  const getDotPositionStyle = (pos: Position9) => {
    switch (pos) {
      case 'top-left': return 'top-3 left-3';
      case 'top-center': return 'top-3 left-1/2 -translate-x-1/2';
      case 'top-right': return 'top-3 right-3';
      case 'center-left': return 'top-1/2 -translate-y-1/2 left-3';
      case 'center': return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
      case 'center-right': return 'top-1/2 -translate-y-1/2 right-3';
      case 'bottom-left': return 'bottom-3 left-3';
      case 'bottom-center': return 'bottom-3 left-1/2 -translate-x-1/2';
      case 'bottom-right': return 'bottom-3 right-3';
      default: return 'bottom-3 right-3';
    }
  };

  // Ejecución del Foliado
  const executeFoliado = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first.");
      return;
    }

    setIsProcessing(true);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Cargando estructura...' : 'Loading structure...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let textSize = 13;
      if (fontSizeOption === 'small') textSize = 10;
      if (fontSizeOption === 'large') textSize = 16;

      let marginPts = 30;
      if (margin === 'small') marginPts = 15;
      if (margin === 'big') marginPts = 50;

      let colorRgb = rgb(0.1, 0.1, 0.1);
      if (fontColor === 'red') colorRgb = rgb(0.85, 0.1, 0.1);
      if (fontColor === 'blue') colorRgb = rgb(0.1, 0.3, 0.85);
      if (fontColor === 'white') colorRgb = rgb(0.95, 0.95, 0.95);

      const fromIndex = Math.max(0, startPage - 1);
      const toIndex = Math.min(pages.length - 1, endPage - 1);

      for (let i = fromIndex; i <= toIndex; i++) {
        if (skipFirstPage && i === 0) {
          continue;
        }

        if (i % 5 === 0) {
          setProgressMsg(isEs ? `Estampando página ${i + 1} de ${pages.length}...` : `Stamping page ${i + 1} of ${pages.length}...`);
          await new Promise(r => setTimeout(r, 10));
        }

        const page = pages[i];
        const { width, height } = page.getSize();

        const rawNum = firstNumber + (i - fromIndex);
        let numValueStr = `${rawNum}`;

        if (numberStyle === 'padded') {
          numValueStr = String(rawNum).padStart(2, '0');
        } else if (numberStyle === 'roman') {
          numValueStr = toRoman(rawNum);
        }

        let folioText = numValueStr;
        if (textFormat === 'page-n-of-p') {
          folioText = isEs ? `Página ${numValueStr} de ${pages.length}` : `Page ${numValueStr} of ${pages.length}`;
        } else if (textFormat === 'folio-n') {
          folioText = `Folio ${numValueStr}`;
        } else if (textFormat === 'custom' && customPrefix.trim()) {
          folioText = `${customPrefix.trim()} ${numValueStr}`;
        }

        const textWidth = font.widthOfTextAtSize(folioText, textSize);

        let x = width - textWidth - marginPts;
        let y = marginPts;

        switch (position) {
          case 'top-left': x = marginPts; y = height - marginPts - textSize; break;
          case 'top-center': x = (width / 2) - (textWidth / 2); y = height - marginPts - textSize; break;
          case 'top-right': x = width - textWidth - marginPts; y = height - marginPts - textSize; break;
          case 'center-left': x = marginPts; y = (height / 2) - (textSize / 2); break;
          case 'center': x = (width / 2) - (textWidth / 2); y = (height / 2) - (textSize / 2); break;
          case 'center-right': x = width - textWidth - marginPts; y = (height / 2) - (textSize / 2); break;
          case 'bottom-left': x = marginPts; y = marginPts; break;
          case 'bottom-center': x = (width / 2) - (textWidth / 2); y = marginPts; break;
          case 'bottom-right': x = width - textWidth - marginPts; y = marginPts; break;
        }

        page.drawText(folioText, { x, y, size: textSize, font, color: colorRgb });
      }

      setProgressMsg(isEs ? 'Guardando PDF final...' : 'Saving final PDF...');
      await new Promise(r => setTimeout(r, 10));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_Foliado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Números de página añadidos con éxito!' : 'Page numbers added successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al foliar el documento.' : 'Failed to number PDF.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

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
              {isEs ? "002 / FOLIADO Y NUMERACIÓN DE PÁGINAS" : "002 / PAGE NUMBERING & FOLIOS"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Hash className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "NUMERACIÓN O FOLIADO DE PÁGINAS DE DOCUMENTOS PDF" : "NUMBERING OR FOLIOS OF PDF PAGES"}
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight">
            {isEs ? "NUMERACIÓN O FOLIADO DE PÁGINAS DE DOCUMENTOS PDF" : "NUMBERING OR FOLIOS OF PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Inserta numeración correlativa y foliados personalizados 100% de forma local." : "Insert customizable page numbers 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL DE OPCIONES */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA (${totalPages} PÁGINAS)` : `001 / PAGES PREVIEW (${totalPages} PAGES)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">{isEs ? "Generando vista previa de miniaturas..." : "Generating page thumbnails..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isIncluded = pageNum >= startPage && pageNum <= endPage && !(skipFirstPage && pageNum === 1);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-zinc-950 border ${isIncluded ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 opacity-30'} rounded-xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                    >
                      {/* Número de página etiqueta top-left */}
                      <span className="absolute top-2 left-2 z-20 bg-zinc-900/90 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                        {pageNum}
                      </span>

                      {/* Imagen miniatura */}
                      {typeof thumb === 'string' ? (
                        <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-md bg-white shadow-inner" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-zinc-600 text-xs font-mono font-bold">
                          {pageNum}
                        </div>
                      )}

                      {/* PUNTO ROJO DE POSICIÓN DE NUMERACIÓN */}
                      {isIncluded && (
                        <div className={`absolute z-30 ${getDotPositionStyle(position)} transition-all duration-300`}>
                          <span className="relative flex h-4 w-4 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border border-white shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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

              {/* 1. MODO DE PÁGINA */}
              <div className="mb-5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Página" : "Page mode"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPageMode('single')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${pageMode === 'single' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${pageMode === 'single' ? 'opacity-100' : 'opacity-0'}`} />
                    {isEs ? "Página suelta" : "Single page"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPageMode('facing')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${pageMode === 'facing' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${pageMode === 'facing' ? 'opacity-100' : 'opacity-0'}`} />
                    {isEs ? "Enfrentadas" : "Facing pages"}
                  </button>
                </div>
              </div>

              {/* 2. MATRIZ 3x3 DE SELECCIÓN DE POSICIÓN */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">{isEs ? "Posición:" : "Position:"}</label>
                  <span className="text-[10px] font-mono text-zinc-300 font-bold">{position.replace('-', ' ').toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 border border-white/10 rounded-xl shadow-inner">
                  {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position9[]).map((pos) => {
                    const isSelected = position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`h-11 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}
                      >
                        <span className={`w-3 h-3 rounded-full transition-transform ${isSelected ? 'bg-red-600 border-2 border-white scale-110 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'bg-zinc-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. FORMATO DE TEXTO */}
              <div className="mb-5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Formato de Texto:" : "Text format:"}</label>
                <select 
                  value={textFormat} 
                  onChange={e => setTextFormat(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-mono text-white outline-none cursor-pointer focus:border-white/30"
                >
                  <option value="only-number">{isEs ? "Solo número de página (Recomendado)" : "Only page number (Recommended)"}</option>
                  <option value="page-n-of-p">{isEs ? "Página {n} de {p}" : "Page {n} of {p}"}</option>
                  <option value="folio-n">{isEs ? "Folio {n}" : "Folio {n}"}</option>
                  <option value="custom">{isEs ? "Texto personalizado..." : "Custom text..."}</option>
                </select>

                {textFormat === 'custom' && (
                  <input 
                    type="text" 
                    placeholder="Ej: Expediente 2026" 
                    value={customPrefix} 
                    onChange={e => setCustomPrefix(e.target.value)} 
                    className="w-full mt-2 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-mono text-white outline-none focus:border-white/50" 
                  />
                )}
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

              {/* SECCIÓN DESPLEGABLE: OPCIONES AVANZADAS */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-1 border-t border-white/5 font-mono overflow-hidden"
                  >
                    {/* A. ESTILO DE NUMERACIÓN */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Estilo de Numeración:" : "Numbering Style:"}</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          type="button" 
                          onClick={() => setNumberStyle('arabic')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all ${numberStyle === 'arabic' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'}`}
                        >
                          1, 2, 3
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setNumberStyle('padded')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all ${numberStyle === 'padded' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'}`}
                        >
                          01, 02, 03
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setNumberStyle('roman')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all ${numberStyle === 'roman' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'}`}
                        >
                          I, II, III
                        </button>
                      </div>
                    </div>

                    {/* B. MARGEN */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Margen del Foliado:" : "Margin:"}</label>
                      <select 
                        value={margin} 
                        onChange={e => setMargin(e.target.value as any)}
                        className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30"
                      >
                        <option value="recommended">{isEs ? "Recomendado (1 cm)" : "Recommended (1 cm)"}</option>
                        <option value="small">{isEs ? "Pequeño (0.5 cm)" : "Small (0.5 cm)"}</option>
                        <option value="big">{isEs ? "Grande (2 cm)" : "Big (2 cm)"}</option>
                      </select>
                    </div>

                    {/* C. TAMAÑO DE LETRA Y COLOR DEL TEXTO */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Tamaño Letra:" : "Font Size:"}</label>
                        <select 
                          value={fontSizeOption} 
                          onChange={e => setFontSizeOption(e.target.value as any)}
                          className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30"
                        >
                          <option value="small">{isEs ? "Pequeño (10pt)" : "Small (10pt)"}</option>
                          <option value="medium">{isEs ? "Normal (13pt)" : "Normal (13pt)"}</option>
                          <option value="large">{isEs ? "Grande (16pt)" : "Large (16pt)"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Color Texto:" : "Text Color:"}</label>
                        <select 
                          value={fontColor} 
                          onChange={e => setFontColor(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30"
                        >
                          <option value="dark">{isEs ? "Negro / Oscuro" : "Dark / Black"}</option>
                          <option value="red">{isEs ? "Rojo" : "Red"}</option>
                          <option value="blue">{isEs ? "Azul" : "Blue"}</option>
                          <option value="white">{isEs ? "Blanco" : "White"}</option>
                        </select>
                      </div>
                    </div>

                    {/* D. OMITIR PRIMERA PÁGINA (PORTADA) */}
                    <div 
                      onClick={() => setSkipFirstPage(!skipFirstPage)}
                      className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-all"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${skipFirstPage ? 'bg-white border-white text-black' : 'border-zinc-600'}`}>
                        {skipFirstPage && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </div>
                      <span className="text-xs text-zinc-300 font-semibold">{isEs ? "Omitir numeración en 1ª página (Portada)" : "Skip numbering on page 1 (Cover)"}</span>
                    </div>

                    {/* E. PRIMER NÚMERO Y RANGO */}
                    <div className="space-y-2.5 pt-1">
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">{isEs ? "Primer Número y Rango:" : "First number & Range:"}</label>
                      
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-white/10 text-xs">
                        <span className="text-zinc-400">{isEs ? "Primer número:" : "First number:"}</span>
                        <input 
                          type="number" 
                          min={1} 
                          value={firstNumber} 
                          onChange={e => setFirstNumber(Number(e.target.value))} 
                          className="w-20 p-1.5 bg-zinc-950 border border-white/10 rounded-lg text-center text-xs font-bold text-white outline-none focus:border-white/30"
                        />
                      </div>

                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{isEs ? "Desde pág:" : "From page:"}</span>
                        <input 
                          type="number" min={1} max={totalPages || 1} 
                          value={startPage} 
                          onChange={e => setStartPage(Number(e.target.value))} 
                          className="w-16 p-1.5 bg-zinc-950 border border-white/10 rounded-lg text-center text-white outline-none focus:border-white/30"
                        />
                        <span className="text-zinc-400">{isEs ? "hasta:" : "to:"}</span>
                        <input 
                          type="number" min={1} max={totalPages || 1} 
                          value={endPage} 
                          onChange={e => setEndPage(Number(e.target.value))} 
                          className="w-16 p-1.5 bg-zinc-950 border border-white/10 rounded-lg text-center text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10 font-sans">
              <button 
                onClick={executeFoliado} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Añadir números de página →' : 'Add page numbers →')}</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}