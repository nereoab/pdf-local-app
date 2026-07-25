'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { 
  ShieldAlert, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, Check, Image as ImageIcon, Type, Sliders 
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';

type WatermarkType = 'text' | 'image';
type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export default function PdfWatermark() {
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

  // Opciones de Marca de Agua
  const [wmType, setWmType] = useState<WatermarkType>('text');
  const [wmText, setWmText] = useState<string>('CONFIDENCIAL');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [position, setPosition] = useState<Position9>('center');
  const [rotation, setRotation] = useState<number>(-45);
  const [opacity, setOpacity] = useState<number>(30); // 10% a 100%
  const [fontSize, setFontSize] = useState<number>(42);
  const [fontColor, setFontColor] = useState<string>('red');

  // Selección de Páginas
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
            await page.render({ canvasContext: context, viewport, canvas } as any).promise;
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
  };

  // Helper para verificar qué páginas deben recibir el sello de agua
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

  // Aplicar Sello de Agua en PDF
  const executeWatermark = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first.");
      return;
    }

    if (wmType === 'text' && !wmText.trim()) {
      toast.error(isEs ? "Ingresa el texto para la marca de agua." : "Enter watermark text.");
      return;
    }

    if (wmType === 'image' && !imageFile) {
      toast.error(isEs ? "Selecciona una imagen de logotipo." : "Select a logo image.");
      return;
    }

    setIsProcessing(true);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Procesando documento...' : 'Processing document...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const targetPages = parseSelectedPages();

      let colorRgb = rgb(0.85, 0.1, 0.1); // Rojo por defecto
      if (fontColor === 'dark') colorRgb = rgb(0.15, 0.15, 0.15);
      if (fontColor === 'blue') colorRgb = rgb(0.1, 0.35, 0.85);
      if (fontColor === 'emerald') colorRgb = rgb(0.05, 0.65, 0.35);

      let embeddedImg: any = null;
      if (wmType === 'image' && imageFile) {
        const imgBytes = await imageFile.arrayBuffer();
        if (imageFile.type === 'image/png') {
          embeddedImg = await pdfDoc.embedPng(imgBytes);
        } else {
          embeddedImg = await pdfDoc.embedJpg(imgBytes);
        }
      }

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        if (!targetPages.has(pageNum)) continue;

        if (i % 4 === 0) {
          setProgressMsg(isEs ? `Estampando página ${pageNum} de ${pages.length}...` : `Stamping page ${pageNum} of ${pages.length}...`);
          await new Promise(r => setTimeout(r, 10));
        }

        const page = pages[i];
        const { width, height } = page.getSize();

        if (wmType === 'text') {
          const textWidth = font.widthOfTextAtSize(wmText, fontSize);
          let x = (width / 2) - (textWidth / 2);
          let y = (height / 2) - (fontSize / 2);

          if (position === 'top-left') { x = 40; y = height - 60; }
          if (position === 'top-center') { x = (width / 2) - (textWidth / 2); y = height - 60; }
          if (position === 'top-right') { x = width - textWidth - 40; y = height - 60; }
          if (position === 'bottom-left') { x = 40; y = 40; }
          if (position === 'bottom-center') { x = (width / 2) - (textWidth / 2); y = 40; }
          if (position === 'bottom-right') { x = width - textWidth - 40; y = 40; }

          page.drawText(wmText, {
            x,
            y,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: opacity / 100,
            rotate: degrees(rotation),
          });
        } else if (wmType === 'image' && embeddedImg) {
          const imgScaled = embeddedImg.scale(0.35);
          let x = (width / 2) - (imgScaled.width / 2);
          let y = (height / 2) - (imgScaled.height / 2);

          if (position === 'top-left') { x = 40; y = height - imgScaled.height - 40; }
          if (position === 'top-center') { x = (width / 2) - (imgScaled.width / 2); y = height - imgScaled.height - 40; }
          if (position === 'top-right') { x = width - imgScaled.width - 40; y = height - imgScaled.height - 40; }
          if (position === 'bottom-left') { x = 40; y = 40; }
          if (position === 'bottom-center') { x = (width / 2) - (imgScaled.width / 2); y = 40; }
          if (position === 'bottom-right') { x = width - imgScaled.width - 40; y = 40; }

          page.drawImage(embeddedImg, {
            x,
            y,
            width: imgScaled.width,
            height: imgScaled.height,
            opacity: opacity / 100,
            rotate: degrees(rotation),
          });
        }
      }

      setProgressMsg(isEs ? 'Generando PDF final...' : 'Generating final PDF...');
      await new Promise(r => setTimeout(r, 10));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_SelloAgua.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Sello de agua estampado y descargado!' : 'Watermark stamped and downloaded!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al aplicar marca de agua.' : 'Failed to apply watermark.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  return (
    <div className="w-full max-w-[1550px] mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/png, image/jpeg" className="hidden" ref={imageInputRef} onChange={handleImageChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
            <ArrowLeft className="w-4 h-4" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            {isEs ? "Poner Sello de Agua en PDF" : "Add Watermark to PDF"}
          </h1>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-amber-500/30 px-4 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-white font-extrabold text-xs truncate max-w-[180px] sm:max-w-[280px]">{file.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all" title={isEs ? "Quitar archivo" : "Remove file"}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        <div className="flex-1 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-3xl p-16 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] min-h-[500px]">
          <div className="bg-gradient-to-tr from-amber-500/20 to-orange-500/20 p-6 rounded-full border border-amber-500/30 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-16 h-16 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{isEs ? "Arrastra tu PDF para aplicar sello de agua" : "Drop your PDF to add watermark"}</h2>
          <p className="text-slate-400 text-sm mb-8 text-center max-w-md">{isEs ? "Estampa logotipos, sellos de 'Confidencial' o marcas de propiedad en todo el documento o páginas específicas." : "Stamp logos or 'Confidential' watermarks across the document 100% locally."}</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 px-10 py-4 rounded-full font-black text-sm transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5 text-slate-950" /> {isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}
          </button>
        </div>
      ) : (
        /* ESTRUCTURA ILOVEPDF: GRILLA A LA IZQUIERDA + BARRA DE OPCIONES A LA DERECHA */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS CON STAMP DE VISTA PREVIA */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-amber-400" />
                <span>{isEs ? `Vista previa del sello (${totalPages} páginas)` : `Watermark preview (${totalPages} pages)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-[10px] font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
                <p className="text-slate-400 text-xs font-semibold">{isEs ? "Generando vista previa..." : "Generating page preview..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isStamped = selectedPagesSet.has(pageNum);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-slate-900 border-2 ${isStamped ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-slate-800 opacity-40'} rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                    >
                      <span className="absolute top-2 left-2 z-20 bg-slate-950/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                        {pageNum}
                      </span>

                      {typeof thumb === 'string' ? (
                        <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-lg bg-white shadow-inner" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs font-bold">
                          {pageNum}
                        </div>
                      )}

                      {/* STAMP OVERLAY EN TIEMPO REAL */}
                      {isStamped && (
                        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden p-4">
                          {wmType === 'text' && (
                            <span 
                              style={{ 
                                transform: `rotate(${rotation}deg)`, 
                                opacity: opacity / 100 
                              }}
                              className="font-black text-red-600 text-sm tracking-widest uppercase border-2 border-red-600 px-2 py-0.5 rounded shadow-lg text-center break-all select-none"
                            >
                              {wmText || 'CONFIDENCIAL'}
                            </span>
                          )}
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
                <Settings2 className="w-5 h-5 text-amber-400" />
                {isEs ? "Opciones del Sello" : "Watermark options"}
              </h2>

              {/* TIPO: TEXTO O IMAGEN */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Tipo de Sello" : "Stamp Type"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" onClick={() => setWmType('text')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${wmType === 'text' ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <Type className="w-4 h-4" /> {isEs ? "Texto" : "Text"}
                  </button>
                  <button 
                    type="button" onClick={() => setWmType('image')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${wmType === 'image' ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> {isEs ? "Imagen / Logo" : "Image / Logo"}
                  </button>
                </div>
              </div>

              {wmType === 'text' ? (
                <div className="mb-5 space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">{isEs ? "Texto del Sello:" : "Watermark text:"}</label>
                  <input 
                    type="text" value={wmText} onChange={e => setWmText(e.target.value)}
                    placeholder="CONFIDENCIAL"
                    className="w-full p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-sm font-black text-white outline-none focus:border-amber-400"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['CONFIDENCIAL', 'BORRADOR', 'COPIA', 'RESERVADO'].map(preset => (
                      <button 
                        key={preset} type="button" onClick={() => setWmText(preset)}
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Seleccionar Logotipo:" : "Select Logo Image:"}</label>
                  <button 
                    type="button" onClick={() => imageInputRef.current?.click()}
                    className="w-full p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-center gap-2 hover:bg-slate-800"
                  >
                    <ImageIcon className="w-4 h-4" /> {imageFile ? imageFile.name : (isEs ? "Cargar imagen PNG/JPG" : "Upload PNG/JPG image")}
                  </button>
                </div>
              )}

              {/* ROTACIÓN Y OPACIDAD */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isEs ? "Ángulo" : "Angle"}</label>
                    <span className="text-xs font-bold text-amber-300">{rotation}°</span>
                  </div>
                  <input 
                    type="range" min={-90} max={90} step={15} value={rotation} onChange={e => setRotation(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isEs ? "Opacidad" : "Opacity"}</label>
                    <span className="text-xs font-bold text-amber-300">{opacity}%</span>
                  </div>
                  <input 
                    type="range" min={10} max={100} step={5} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* SELECCIÓN DE PÁGINAS OBJETIVO */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas a estampar:" : "Pages to stamp:"}</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input 
                      type="radio" name="scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')}
                      className="accent-amber-400"
                    />
                    <span>{isEs ? "Todo el documento (Todas las páginas)" : "All pages"}</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input 
                      type="radio" name="scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')}
                      className="accent-amber-400"
                    />
                    <span>{isEs ? "Páginas específicas (Ej: 1, 3-5, 8)" : "Specific pages (e.g. 1, 3-5, 8)"}</span>
                  </label>
                </div>

                {pageScope === 'custom' && (
                  <input 
                    type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)}
                    placeholder="1, 3-5, 8"
                    className="w-full mt-2.5 p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-400"
                  />
                )}
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={executeWatermark} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 py-4.5 rounded-2xl font-black text-base transition-all shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:shadow-[0_0_45px_rgba(245,158,11,0.7)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-slate-950" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Poner Sello de Agua →' : 'Add Watermark →')}</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
