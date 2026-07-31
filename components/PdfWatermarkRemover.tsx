'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFStream, PDFRawStream } from 'pdf-lib';
import { 
  Sparkles, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, 
  FileText, Trash2, Plus, LayoutGrid, CheckCircle2, Eraser, Layers, RefreshCw, Search,
  Sliders, ChevronDown, ChevronUp, UploadCloud
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfWatermarkRemover() {
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

  // Opciones de Limpieza Principales
  const [cleanMode, setCleanMode] = useState<'smart' | 'layers'>('smart');
  const [targetText, setTargetText] = useState<string>('');

  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [removeAnnots, setRemoveAnnots] = useState<boolean>(true);
  const [removeBackgrounds, setRemoveBackgrounds] = useState<boolean>(true);

  // Selección de Páginas
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');

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

  // Algoritmo de Remoción de Marcas de Agua Ultra-Eficiente 100% Local
  const executeRemoveWatermark = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first.");
      return;
    }

    setIsProcessing(true);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Escaneando estructuras y capas del PDF...' : 'Scanning PDF structures...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // 1. Limpieza de capas globales OCG y metadatos de marcas en el Catálogo
      if (pdfDoc.catalog.has(PDFName.of('OCProperties'))) {
        pdfDoc.catalog.delete(PDFName.of('OCProperties'));
      }
      if (pdfDoc.catalog.has(PDFName.of('PieceInfo'))) {
        pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
      }

      const pages = pdfDoc.getPages();
      const targetPages = parseSelectedPages();

      // Palabras clave a buscar y eliminar
      const keywords = targetText
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        if (!targetPages.has(pageNum)) continue;

        if (i % 3 === 0) {
          setProgressMsg(isEs ? `Depurando marcas en página ${pageNum} de ${pages.length}...` : `Cleaning page ${pageNum} of ${pages.length}...`);
          await new Promise(r => setTimeout(r, 10));
        }

        const page = pages[i];
        const node = page.node;

        // 2. Eliminar anotaciones y marcas de metadatos (/Annots y /PieceInfo)
        if (removeAnnots) {
          if (node.has(PDFName.of('Annots'))) node.delete(PDFName.of('Annots'));
          if (node.has(PDFName.of('PieceInfo'))) node.delete(PDFName.of('PieceInfo'));
        }

        // 3. Identificar y VACIAR los contenidos de XObjects de marcas de agua
        if (node.has(PDFName.of('Resources'))) {
          const resources = node.lookup(PDFName.of('Resources'), PDFDict);
          if (resources && resources.has(PDFName.of('XObject'))) {
            const xObjectDict = resources.lookup(PDFName.of('XObject'), PDFDict);
            if (xObjectDict) {
              xObjectDict.entries().forEach(([key, ref]) => {
                const keyStr = key.decodeText().toLowerCase();
                const obj = pdfDoc.context.lookup(ref);

                if (obj instanceof PDFStream || obj instanceof PDFRawStream) {
                  try {
                    const streamBytes = obj.getContents();
                    const streamText = new TextDecoder('latin1').decode(streamBytes).toLowerCase();

                    const isMatch = 
                      keywords.some(kw => keyStr.includes(kw) || streamText.includes(kw)) ||
                      keyStr.includes('watermark') || keyStr.includes('wm') || keyStr.includes('apryse') || keyStr.includes('fm') ||
                      streamText.includes('apryse') || streamText.includes('watermark') ||
                      (removeBackgrounds && (keyStr.includes('fm') || keyStr.includes('res') || streamText.includes('/ca')));

                    if (isMatch) {
                      if ('setContents' in obj && typeof (obj as any).setContents === 'function') {
                        (obj as any).setContents(new Uint8Array(0));
                      } else {
                        (obj as any).contents = new Uint8Array(0);
                      }
                    }
                  } catch (e) {
                    if (keywords.some(kw => keyStr.includes(kw)) || keyStr.includes('apryse') || keyStr.includes('wm')) {
                      if ('setContents' in obj && typeof (obj as any).setContents === 'function') {
                        (obj as any).setContents(new Uint8Array(0));
                      }
                    }
                  }
                }
              });
            }
          }
        }

        // 4. Limpieza profunda en flujos de contenido (Content Streams)
        const contentsRef = node.get(PDFName.of('Contents'));
        const streams: (PDFStream | PDFRawStream)[] = [];

        if (contentsRef instanceof PDFRef) {
          const streamObj = pdfDoc.context.lookup(contentsRef);
          if (streamObj instanceof PDFStream || streamObj instanceof PDFRawStream) {
            streams.push(streamObj);
          }
        } else if (contentsRef instanceof PDFArray) {
          for (let idx = 0; idx < contentsRef.size(); idx++) {
            const ref = contentsRef.get(idx);
            const streamObj = pdfDoc.context.lookup(ref);
            if (streamObj instanceof PDFStream || streamObj instanceof PDFRawStream) {
              streams.push(streamObj);
            }
          }
        }

        streams.forEach(stream => {
          try {
            const bytes = stream.getContents();
            let contents = new TextDecoder('latin1').decode(bytes);
            let modified = false;

            // Filtrar texto de marcas según palabras clave
            keywords.forEach(kw => {
              if (contents.toLowerCase().includes(kw)) {
                const regexTj = new RegExp(`\\([^)]*${kw}[^)]*\\)\\s*(?:Tj|TJ|tj)`, 'gi');
                const regexArrayTJ = new RegExp(`\\[[^\\]]*${kw}[^\\]]*\\]\\s*TJ`, 'gi');
                
                contents = contents.replace(regexTj, '() Tj');
                contents = contents.replace(regexArrayTJ, '() Tj');
                modified = true;
              }
            });

            if (modified) {
              const newBytes = new TextEncoder().encode(contents);
              if ('setContents' in stream && typeof (stream as any).setContents === 'function') {
                (stream as any).setContents(newBytes);
              } else {
                (stream as any).contents = newBytes;
              }
            }
          } catch (e) {
            console.warn("Warn al limpiar flujo de contenido:", e);
          }
        });
      }

      setProgressMsg(isEs ? 'Generando PDF limpio...' : 'Generating clean PDF...');
      await new Promise(r => setTimeout(r, 10));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_SinSello.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Sellos de agua removidos y PDF descargado con éxito!' : 'Watermarks removed successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al limpiar el documento.' : 'Failed to clean document.');
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
              {isEs ? "004 / ELIMINACIÓN Y DEPURACIÓN DE MARCAS" : "004 / WATERMARK REMOVAL & CLEANING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Sparkles className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "REMOVER SELLO DE AGUA DE DOCUMENTOS PDF" : "REMOVE WATERMARK FROM PDF DOCUMENTS"}
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
            {isEs ? "REMOVER SELLO DE AGUA DE DOCUMENTOS PDF" : "REMOVE WATERMARK FROM PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Elimina marcas de agua, sellos de fondo y textos superpuestos de tu documento 100% de forma local." : "Remove watermarks and background stamps 100% locally."}
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
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / PÁGINAS A PROCESAR (${totalPages} PÁGINAS)` : `001 / PAGES TO PROCESS (${totalPages} PAGES)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400 text-xs">{isEs ? "Generando vista previa..." : "Generating preview..."}</p>
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
                          <Eraser className="w-3.5 h-3.5 text-white" />
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

              {/* 1. MODO DE LIMPIEZA */}
              <div className="mb-5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Limpieza" : "Cleaning mode"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" onClick={() => setCleanMode('smart')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${cleanMode === 'smart' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Sparkles className="w-4 h-4" /> {isEs ? "Inteligente" : "Smart"}
                  </button>
                  <button 
                    type="button" onClick={() => setCleanMode('layers')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${cleanMode === 'layers' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                  >
                    <Layers className="w-4 h-4" /> {isEs ? "Por Capas" : "By Layers"}
                  </button>
                </div>
              </div>

              {/* 2. TEXTO A BUSCAR Y ELIMINAR */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>{isEs ? "Texto a Buscar y Eliminar:" : "Text to Search & Remove:"}</span>
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                </label>
                <input 
                  type="text" 
                  value={targetText} 
                  onChange={e => setTargetText(e.target.value)}
                  placeholder={isEs ? "Ej: CONFIDENCIAL, BORRADOR, Marca" : "e.g. CONFIDENTIAL, DRAFT, Stamp"}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">{isEs ? "Separa por comas las palabras clave que forman la marca de agua." : "Separate watermark keywords by commas."}</span>
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
                    {/* A. ELEMENTOS A ELIMINAR */}
                    <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "ELEMENTOS A ELIMINAR" : "ELEMENTS TO REMOVE"}</label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={removeAnnots} onChange={e => setRemoveAnnots(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Remover Sellos y Anotaciones" : "Remove Stamps & Annotations"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={removeBackgrounds} onChange={e => setRemoveBackgrounds(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Limpiar Marcas de Fondo Translúcidas" : "Clean Background Stamps"}</span>
                      </label>
                    </div>

                    {/* B. SELECCIÓN DE PÁGINAS A LIMPIAR */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas a limpiar:" : "Pages to clean:"}</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                          <input 
                            type="radio" name="remover-scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')}
                            className="accent-white"
                          />
                          <span>{isEs ? "Todo el documento (Todas las páginas)" : "All pages"}</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                          <input 
                            type="radio" name="remover-scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')}
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

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10 font-sans">
              <button 
                onClick={executeRemoveWatermark} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Eraser className="w-5 h-5 text-black" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Quitar Sello de Agua →' : 'Remove Watermark →')}</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}

