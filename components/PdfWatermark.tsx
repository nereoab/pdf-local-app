'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { 
  ShieldAlert, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, Check, Image as ImageIcon, Type, Sliders,
  ChevronDown, ChevronUp, UploadCloud
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Opciones de Marca de Agua Principales
  const [wmType, setWmType] = useState<WatermarkType>('text');
  const [wmText, setWmText] = useState<string>('CONFIDENCIAL');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
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

  // Helpers para el color del overlay de previsualización
  const getOverlayColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      dark: '#1a1a1a',
      blue: '#3b82f6',
      emerald: '#10b981',
      white: '#f5f5f5',
    };
    return colorMap[color] || '#ef4444';
  };

  const getOverlayTextColorClass = (color: string): string => {
    const classMap: Record<string, string> = {
      red: 'text-red-500 border-red-500',
      dark: 'text-gray-900 border-gray-800',
      blue: 'text-blue-400 border-blue-400',
      emerald: 'text-emerald-400 border-emerald-400',
      white: 'text-white border-white',
    };
    return classMap[color] || 'text-red-500 border-red-500';
  };

  const getPositionClasses = (pos: Position9): string => {
    const posMap: Record<Position9, string> = {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      'center': 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-left': 'items-end justify-start',
      'bottom-center': 'items-end justify-center',
      'bottom-right': 'items-end justify-end',
    };
    return posMap[pos] || 'items-center justify-center';
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
      if (fontColor === 'white') colorRgb = rgb(0.95, 0.95, 0.95);

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

      toast.success(isEs ? '¡Sello de agua estampado con éxito!' : 'Watermark stamped successfully!');
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
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/png, image/jpeg" className="hidden" ref={imageInputRef} onChange={handleImageChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "003 / SELLO DE AGUA Y MARCAS DE PROPIEDAD" : "003 / WATERMARK & BRANDING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <ShieldAlert className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "PONER SELLO DE AGUA EN DOCUMENTOS PDF" : "ADD WATERMARK TO PDF DOCUMENTS"}
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
            {isEs ? "PONER SELLO DE AGUA EN DOCUMENTOS PDF" : "ADD WATERMARK TO PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Estampa logotipos, sellos de 'Confidencial' o marcas de propiedad 100% de forma local." : "Stamp logos or 'Confidential' watermarks across the document 100% locally."}
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
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold font-mono">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA DEL SELLO (${totalPages} PÁGINAS)` : `001 / WATERMARK PREVIEW (${totalPages} PAGES)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">{isEs ? "Generando vista previa de miniaturas..." : "Generating page preview..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isStamped = selectedPagesSet.has(pageNum);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-zinc-950 border ${isStamped ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 opacity-30'} rounded-xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
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

          {/* STAMP OVERLAY EN TIEMPO REAL */}
          <div className={`absolute inset-0 z-30 pointer-events-none overflow-hidden p-1 flex ${getPositionClasses(position)}`}>
            {wmType === 'text' && (
              <span 
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  opacity: opacity / 100,
                  fontSize: `${Math.max(Math.min(fontSize * 0.28, 22), 6)}px`,
                  color: getOverlayColor(fontColor),
                }}
                className={`font-black tracking-widest uppercase px-1 py-0.5 rounded select-none font-mono text-center break-all leading-tight ${getOverlayTextColorClass(fontColor)}`}
              >
                {wmText || 'CONFIDENCIAL'}
              </span>
            )}
            {wmType === 'image' && imageFile && (
              <div 
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  opacity: opacity / 100,
                }}
                className="flex items-center justify-center"
              >
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Watermark"
                  style={{ maxWidth: '70%', maxHeight: '70%' }}
                  className="object-contain"
                />
              </div>
            )}
            {wmType === 'image' && !imageFile && (
              <div 
                style={{ opacity: 0.35 }}
                className="flex items-center justify-center text-zinc-400 text-[8px] font-mono"
              >
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
          </div>
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

              {/* 1. TIPO DE SELLO (TEXTO O IMAGEN) */}
              <div className="mb-5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Tipo de Sello" : "Stamp Type"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" onClick={() => setWmType('text')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${wmType === 'text' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Type className="w-4 h-4" /> {isEs ? "Texto" : "Text"}
                  </button>
                  <button 
                    type="button" onClick={() => setWmType('image')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${wmType === 'image' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> {isEs ? "Imagen / Logo" : "Image / Logo"}
                  </button>
                </div>
              </div>

              {wmType === 'text' ? (
                <div className="mb-5 space-y-3 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">{isEs ? "Texto del Sello:" : "Watermark text:"}</label>
                  <input 
                    type="text" value={wmText} onChange={e => setWmText(e.target.value)}
                    placeholder="CONFIDENCIAL"
                    className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['CONFIDENCIAL', 'BORRADOR', 'COPIA', 'RESERVADO'].map(preset => (
                      <button 
                        key={preset} type="button" onClick={() => setWmText(preset)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-5 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Seleccionar Logotipo:" : "Select Logo Image:"}</label>
                  <button 
                    type="button" onClick={() => imageInputRef.current?.click()}
                    className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-zinc-400" /> {imageFile ? imageFile.name : (isEs ? "Cargar imagen PNG/JPG" : "Upload PNG/JPG image")}
                  </button>
                </div>
              )}

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
                    {/* A. MATRIZ 3x3 DE POSICIÓN */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] text-zinc-400 uppercase tracking-wider">{isEs ? "Posición:" : "Position:"}</label>
                        <span className="text-[10px] text-zinc-300 font-bold">{position.replace('-', ' ').toUpperCase()}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 border border-white/10 rounded-xl shadow-inner">
                        {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position9[]).map((pos) => {
                          const isSelected = position === pos;
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => setPosition(pos)}
                              className={`h-10 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full transition-transform ${isSelected ? 'bg-red-600 scale-110' : 'bg-zinc-600'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* B. ROTACIÓN Y OPACIDAD */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider">{isEs ? "Ángulo" : "Angle"}</label>
                          <span className="text-xs font-bold text-white">{rotation}°</span>
                        </div>
                        <input 
                          type="range" min={-90} max={90} step={15} value={rotation} onChange={e => setRotation(Number(e.target.value))}
                          className="w-full accent-white cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider">{isEs ? "Opacidad" : "Opacity"}</label>
                          <span className="text-xs font-bold text-white">{opacity}%</span>
                        </div>
                        <input 
                          type="range" min={10} max={100} step={5} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
                          className="w-full accent-white cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* C. TAMAÑO Y COLOR DE TEXTO */}
                    {wmType === 'text' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Tamaño Letra:" : "Font Size:"}</label>
                          <input 
                            type="number" min={12} max={120} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                            className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Color Texto:" : "Text Color:"}</label>
                          <select 
                            value={fontColor} onChange={e => setFontColor(e.target.value)}
                            className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-white/30"
                          >
                            <option value="red">{isEs ? "Rojo" : "Red"}</option>
                            <option value="dark">{isEs ? "Negro / Oscuro" : "Dark / Black"}</option>
                            <option value="blue">{isEs ? "Azul" : "Blue"}</option>
                            <option value="emerald">{isEs ? "Verde Esmeralda" : "Emerald"}</option>
                            <option value="white">{isEs ? "Blanco" : "White"}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* D. SELECCIÓN DE PÁGINAS OBJETIVO */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas a estampar:" : "Pages to stamp:"}</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                          <input 
                            type="radio" name="scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')}
                            className="accent-white"
                          />
                          <span>{isEs ? "Todo el documento (Todas)" : "All pages"}</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                          <input 
                            type="radio" name="scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')}
                            className="accent-white"
                          />
                          <span>{isEs ? "Páginas específicas (Ej: 1, 3-5, 8)" : "Specific pages (e.g. 1, 3-5, 8)"}</span>
                        </label>
                      </div>

                      {pageScope === 'custom' && (
                        <input 
                          type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)}
                          placeholder="1, 3-5, 8"
                          className="w-full mt-2.5 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:border-white/50"
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10 font-sans">
              <button 
                onClick={executeWatermark} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Poner Sello de Agua →' : 'Add Watermark →')}</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}

