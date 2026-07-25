'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  Hash, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, FileText, 
  Trash2, Plus, LayoutGrid, Check, FileCheck 
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';

type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

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

  // Opciones de Foliado (Sidebar)
  const [pageMode, setPageMode] = useState<'single' | 'facing'>('single');
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [margin, setMargin] = useState<'small' | 'recommended' | 'big'>('recommended');
  
  const [firstNumber, setFirstNumber] = useState<number>(1);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  
  const [textFormat, setTextFormat] = useState<string>('only-number');
  const [customPrefix, setCustomPrefix] = useState<string>('Folio');
  const [fontColor, setFontColor] = useState<string>('dark');

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

  // Mapeo visual de punto rojo/neón según posición 3x3
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
      const textSize = 13;

      let marginPts = 30;
      if (margin === 'small') marginPts = 15;
      if (margin === 'big') marginPts = 50;

      let colorRgb = rgb(0.1, 0.1, 0.1);
      if (fontColor === 'red') colorRgb = rgb(0.85, 0.1, 0.1);
      if (fontColor === 'blue') colorRgb = rgb(0.1, 0.3, 0.85);

      const fromIndex = Math.max(0, startPage - 1);
      const toIndex = Math.min(pages.length - 1, endPage - 1);

      for (let i = fromIndex; i <= toIndex; i++) {
        if (i % 5 === 0) {
          setProgressMsg(isEs ? `Estampando página ${i + 1} de ${pages.length}...` : `Stamping page ${i + 1} of ${pages.length}...`);
          await new Promise(r => setTimeout(r, 10));
        }

        const page = pages[i];
        const { width, height } = page.getSize();

        let numValue = firstNumber + (i - fromIndex);
        let folioText = `${numValue}`;

        if (textFormat === 'page-n-of-p') {
          folioText = isEs ? `Página ${numValue} de ${pages.length}` : `Page ${numValue} of ${pages.length}`;
        } else if (textFormat === 'folio-n') {
          folioText = `Folio ${numValue}`;
        } else if (textFormat === 'custom' && customPrefix.trim()) {
          folioText = `${customPrefix.trim()} ${numValue}`;
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
    <div className="w-full max-w-[1550px] mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
            <ArrowLeft className="w-4 h-4" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-emerald-400" />
            {isEs ? "Añadir Números de Página a PDF" : "Add Page Numbers to PDF"}
          </h1>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-emerald-500/30 px-4 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-extrabold text-xs truncate max-w-[180px] sm:max-w-[280px]">{file.name}</span>
            </div>
            <button 
              onClick={handleRemoveFile} 
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all"
              title={isEs ? "Quitar archivo" : "Remove file"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* VISTA DROPZONE VACIÁ */
        <div className="flex-1 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-16 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] min-h-[500px]">
          <div className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 p-6 rounded-full border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Hash className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{isEs ? "Arrastra tu PDF aquí para numerar" : "Drop your PDF here to number"}</h2>
          <p className="text-slate-400 text-sm mb-8 text-center max-w-md">{isEs ? "Inserta numeración correlativa y foliados personalizados en segundos de forma local." : "Insert customizable page numbers in seconds 100% locally."}</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 px-10 py-4 rounded-full font-black text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5 text-slate-950" /> {isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}
          </button>
        </div>
      ) : (
        /* VISTA PRINCIPAL ESTILO ILOVEPDF: GRILLA A LA IZQUIERDA + BARRA LATERAL A LA DERECHA */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS Y MINIATURAS CON PUNTO ROJO */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <span>{isEs ? `Vista previa de páginas (${totalPages} páginas)` : `Pages preview (${totalPages} pages)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                <p className="text-slate-400 text-xs font-semibold">{isEs ? "Generando vista previa de miniaturas..." : "Generating page thumbnails preview..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isIncluded = pageNum >= startPage && pageNum <= endPage;

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-slate-900 border-2 ${isIncluded ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-slate-800 opacity-40'} rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                    >
                      {/* Número de página etiqueta top-left */}
                      <span className="absolute top-2 left-2 z-20 bg-slate-950/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                        {pageNum}
                      </span>

                      {/* Imagen miniatura */}
                      {typeof thumb === 'string' ? (
                        <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-lg bg-white shadow-inner" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs font-bold">
                          {pageNum}
                        </div>
                      )}

                      {/* PUNTO ROJO/NEÓN DE POSICIÓN ESTILO ILOVEPDF */}
                      {isIncluded && (
                        <div className={`absolute z-30 ${getDotPositionStyle(position)} transition-all duration-300`}>
                          <span className="relative flex h-5 w-5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-[0_0_12px_rgba(239,68,68,0.9)]"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LADO DERECHO: BARRA LATERAL DE OPCIONES ESTILO ILOVEPDF */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-5 pb-3 border-b border-white/10 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-400" />
                {isEs ? "Opciones de Numeración" : "Page Number options"}
              </h2>

              {/* 1. MODO DE PÁGINA */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Página" : "Page mode"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPageMode('single')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${pageMode === 'single' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${pageMode === 'single' ? 'opacity-100' : 'opacity-0'}`} />
                    {isEs ? "Página suelta" : "Single page"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPageMode('facing')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${pageMode === 'facing' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${pageMode === 'facing' ? 'opacity-100' : 'opacity-0'}`} />
                    {isEs ? "Enfrentadas" : "Facing pages"}
                  </button>
                </div>
              </div>

              {/* 2. MATRIZ 3x3 DE SELECCIÓN DE POSICIÓN */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{isEs ? "Posición:" : "Position:"}</label>
                  <span className="text-[10px] font-bold text-emerald-400">{position.replace('-', ' ').toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
                  {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position9[]).map((pos) => {
                    const isSelected = position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}
                      >
                        <span className={`w-3 h-3 rounded-full transition-transform ${isSelected ? 'bg-red-500 border-2 border-white scale-125 shadow-[0_0_10px_rgba(239,68,68,0.9)]' : 'bg-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. MARGEN */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Margen:" : "Margin:"}</label>
                <select 
                  value={margin} 
                  onChange={e => setMargin(e.target.value as any)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-emerald-500/50"
                >
                  <option value="recommended">{isEs ? "Recomendado (Normal 1 cm)" : "Recommended (1 cm)"}</option>
                  <option value="small">{isEs ? "Pequeño (0.5 cm)" : "Small (0.5 cm)"}</option>
                  <option value="big">{isEs ? "Grande (2 cm)" : "Big (2 cm)"}</option>
                </select>
              </div>

              {/* 4. PÁGINAS A NUMERAR Y NÚMERO INICIAL */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{isEs ? "Primer número:" : "First number:"}</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={firstNumber} 
                    onChange={e => setFirstNumber(Number(e.target.value))} 
                    className="w-24 p-2 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs font-black text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">{isEs ? "Desde pág:" : "From page:"}</span>
                  <input 
                    type="number" min={1} max={totalPages || 1} 
                    value={startPage} 
                    onChange={e => setStartPage(Number(e.target.value))} 
                    className="w-16 p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-center text-white"
                  />
                  <span className="text-slate-400">{isEs ? "hasta:" : "to:"}</span>
                  <input 
                    type="number" min={1} max={totalPages || 1} 
                    value={endPage} 
                    onChange={e => setEndPage(Number(e.target.value))} 
                    className="w-16 p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-center text-white"
                  />
                </div>
              </div>

              {/* 5. FORMATO DE TEXTO */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Formato de Texto:" : "Text format:"}</label>
                <select 
                  value={textFormat} 
                  onChange={e => setTextFormat(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-emerald-500/50"
                >
                  <option value="only-number">{isEs ? "Insertar solo número de página (Recomendado)" : "Insert only page number (recommended)"}</option>
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
                    className="w-full mt-2 p-3 bg-slate-900 border border-emerald-500/30 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-400" 
                  />
                )}
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN (ESTILO ILOVEPDF) */}
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={executeFoliado} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 py-4.5 rounded-2xl font-black text-base transition-all shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_rgba(16,185,129,0.7)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-slate-950" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Añadir números de página →' : 'Add page numbers →')}</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}