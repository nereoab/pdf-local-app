'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFStream, PDFRawStream } from 'pdf-lib';
import { 
  Sparkles, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, 
  FileText, Trash2, Plus, LayoutGrid, CheckCircle2, Eraser, Layers, RefreshCw, Search 
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';

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

  // Opciones de Limpieza
  const [cleanMode, setCleanMode] = useState<'smart' | 'layers'>('smart');
  const [removeAnnots, setRemoveAnnots] = useState<boolean>(true);
  const [removeBackgrounds, setRemoveBackgrounds] = useState<boolean>(true);
  const [targetText, setTargetText] = useState<string>('');

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

        // 2. Identificar y VACIAR los contenidos de XObjects de marcas de agua
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

        // 3. Limpieza profunda en flujos de contenido (Content Streams)
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
            <Sparkles className="w-5 h-5 text-pink-400" />
            {isEs ? "Quitar Sello de Agua de PDF" : "Remove Watermark from PDF"}
          </h1>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-pink-500/30 px-4 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
              <FileText className="w-4 h-4 text-pink-400" />
              <span className="text-white font-extrabold text-xs truncate max-w-[180px] sm:max-w-[280px]">{file.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all" title={isEs ? "Quitar archivo" : "Remove file"}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        <div className="flex-1 border-2 border-dashed border-pink-500/40 hover:border-pink-400 rounded-3xl p-16 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_rgba(236,72,153,0.15)] min-h-[500px]">
          <div className="bg-gradient-to-tr from-pink-500/20 to-rose-500/20 p-6 rounded-full border border-pink-500/30 mb-6 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
            <Sparkles className="w-16 h-16 text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{isEs ? "Arrastra tu PDF para remover sellos de agua" : "Drop your PDF to remove watermarks"}</h2>
          <p className="text-slate-400 text-sm mb-8 text-center max-w-md">{isEs ? "Elimina marcas de agua, sellos de fondo y textos superpuestos de tu documento PDF." : "Remove watermarks and background stamps 100% locally."}</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-300 hover:to-rose-300 text-slate-950 px-10 py-4 rounded-full font-black text-sm transition-all shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5 text-slate-950" /> {isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}
          </button>
        </div>
      ) : (
        /* VISTA ILOVEPDF: GRILLA A LA IZQUIERDA + OPCIONES A LA DERECHA */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* LADO IZQUIERDO: GRILLA VISUAL DE PÁGINAS */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-pink-400" />
                <span>{isEs ? `Páginas a procesar (${totalPages} páginas)` : `Pages to process (${totalPages} pages)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-400 text-[10px] font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-pink-400" />
                <p className="text-slate-400 text-xs font-semibold">{isEs ? "Generando vista previa..." : "Generating preview..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isSelected = selectedPagesSet.has(pageNum);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-slate-900 border-2 ${isSelected ? 'border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-slate-800 opacity-40'} rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
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

                      {isSelected && (
                        <div className="absolute bottom-3 right-3 z-30 bg-pink-500/30 border border-pink-400 p-1.5 rounded-full shadow-[0_0_12px_rgba(236,72,153,0.8)]">
                          <Eraser className="w-3.5 h-3.5 text-pink-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LADO DERECHO: BARRA LATERAL DE OPCIONES */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-5 pb-3 border-b border-white/10 flex items-center gap-2">
                <Eraser className="w-5 h-5 text-pink-400" />
                {isEs ? "Opciones de Remoción" : "Removal options"}
              </h2>

              {/* MODO DE LIMPIEZA */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Limpieza" : "Cleaning mode"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" onClick={() => setCleanMode('smart')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${cleanMode === 'smart' ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <Sparkles className="w-4 h-4" /> {isEs ? "Inteligente" : "Smart"}
                  </button>
                  <button 
                    type="button" onClick={() => setCleanMode('layers')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${cleanMode === 'layers' ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <Layers className="w-4 h-4" /> {isEs ? "Por Capas" : "By Layers"}
                  </button>
                </div>
              </div>

              {/* TEXTO A BUSCAR Y ELIMINAR */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>{isEs ? "Texto a Buscar y Eliminar:" : "Text to Search & Remove:"}</span>
                  <Search className="w-3.5 h-3.5 text-pink-400" />
                </label>
                <input 
                  type="text" 
                  value={targetText} 
                  onChange={e => setTargetText(e.target.value)}
                  placeholder={isEs ? "Opcional: Escribe el texto o marca a eliminar..." : "Optional: Type text to remove..."}
                  className="w-full p-3 bg-slate-900 border border-pink-500/30 rounded-xl text-xs font-bold text-pink-300 outline-none focus:border-pink-400 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">{isEs ? "Separa por comas las palabras clave que forman la marca de agua." : "Separate watermark keywords by commas."}</span>
              </div>

              {/* FILTROS DE CAPAS */}
              <div className="mb-5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEs ? "ELEMENTOS A ELIMINAR" : "ELEMENTS TO REMOVE"}</label>
                
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" checked={removeAnnots} onChange={e => setRemoveAnnots(e.target.checked)}
                    className="accent-pink-400 w-4 h-4 rounded"
                  />
                  <span>{isEs ? "Remover Sellos y Anotaciones" : "Remove Stamps & Annotations"}</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" checked={removeBackgrounds} onChange={e => setRemoveBackgrounds(e.target.checked)}
                    className="accent-pink-400 w-4 h-4 rounded"
                  />
                  <span>{isEs ? "Limpiar Marcas de Fondo Translúcidas" : "Clean Translucent Background Stamps"}</span>
                </label>
              </div>

              {/* SELECCIÓN DE PÁGINAS */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas a limpiar:" : "Pages to clean:"}</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input 
                      type="radio" name="remover-scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')}
                      className="accent-pink-400"
                    />
                    <span>{isEs ? "Todo el documento (Todas las páginas)" : "All pages"}</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input 
                      type="radio" name="remover-scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')}
                      className="accent-pink-400"
                    />
                    <span>{isEs ? "Páginas específicas (Ej: 1, 3-5)" : "Specific pages (e.g. 1, 3-5)"}</span>
                  </label>
                </div>

                {pageScope === 'custom' && (
                  <input 
                    type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)}
                    placeholder="1, 3-5"
                    className="w-full mt-2.5 p-3 bg-slate-900 border border-pink-500/30 rounded-xl text-xs font-bold text-white outline-none focus:border-pink-400"
                  />
                )}
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={executeRemoveWatermark} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 hover:from-pink-300 hover:to-amber-300 text-slate-950 py-4.5 rounded-2xl font-black text-base transition-all shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:shadow-[0_0_45px_rgba(236,72,153,0.7)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eraser className="w-5 h-5 text-slate-950" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Quitar Sello de Agua →' : 'Remove Watermark →')}</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
