'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface PdfPageViewerProps {
  file: File | null;
  activePage: number;
  totalPages: number;
  onPageChange?: (pageNum: number) => void;
  pageDataUrls?: Record<number, string>;
  title?: string;
  className?: string;
  defaultZoom?: number;
  accentColor?: 'blue' | 'orange' | 'emerald' | 'cyan' | 'purple' | 'amber';
}

const ACCENT_STYLES = {
  blue: {
    icon: 'text-blue-400',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    hoverText: 'hover:text-blue-300',
    ring: 'ring-blue-400/40',
    loader: 'text-blue-400',
  },
  orange: {
    icon: 'text-orange-400',
    activeBg: 'bg-orange-600',
    activeText: 'text-white',
    hoverText: 'hover:text-orange-300',
    ring: 'ring-orange-400/40',
    loader: 'text-orange-400',
  },
  emerald: {
    icon: 'text-emerald-400',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    hoverText: 'hover:text-emerald-300',
    ring: 'ring-emerald-400/40',
    loader: 'text-emerald-400',
  },
  cyan: {
    icon: 'text-cyan-400',
    activeBg: 'bg-cyan-600',
    activeText: 'text-white',
    hoverText: 'hover:text-cyan-300',
    ring: 'ring-cyan-400/40',
    loader: 'text-cyan-400',
  },
  purple: {
    icon: 'text-purple-400',
    activeBg: 'bg-purple-600',
    activeText: 'text-white',
    hoverText: 'hover:text-purple-300',
    ring: 'ring-purple-400/40',
    loader: 'text-purple-400',
  },
  amber: {
    icon: 'text-amber-400',
    activeBg: 'bg-amber-600',
    activeText: 'text-white',
    hoverText: 'hover:text-amber-300',
    ring: 'ring-amber-400/40',
    loader: 'text-amber-400',
  },
};

export default function PdfPageViewer({
  file,
  activePage,
  totalPages,
  onPageChange,
  pageDataUrls,
  title,
  className = '',
  defaultZoom = 85,
  accentColor = 'blue',
}: PdfPageViewerProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const accent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.blue;

  const [zoom, setZoom] = useState<number>(defaultZoom);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });

  // Referencias para el documento PDF cargado y la tarea de renderizado
  const pdfDocRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRenderTaskRef = useRef<any>(null);
  const currentFileRef = useRef<File | null>(null);

  // 1. Cargar el PDF Document una sola vez cuando cambie el archivo
  useEffect(() => {
    let isCancelled = false;

    if (!file) {
      pdfDocRef.current = null;
      currentFileRef.current = null;
      return;
    }

    if (currentFileRef.current === file && pdfDocRef.current) {
      return;
    }

    currentFileRef.current = file;
    setIsLoadingDoc(true);

    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        } catch {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        }

        const doc = await pdfjsLib.getDocument({
          data: buffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        if (!isCancelled) {
          pdfDocRef.current = doc;
          setIsLoadingDoc(false);
          renderPage(doc, activePage, zoom);
        }
      } catch (err) {
        console.error('Error loading PDF document in PdfPageViewer:', err);
        if (!isCancelled) {
          setIsLoadingDoc(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // 2. Función para renderizar la página activa en el canvas a alta definición
  const renderPage = useCallback(async (doc: any, pageNum: number, currentZoom: number) => {
    if (!doc || pageNum < 1 || pageNum > doc.numPages) return;

    // Cancelar cualquier tarea de renderizado previa en vuelo
    if (currentRenderTaskRef.current) {
      try {
        currentRenderTaskRef.current.cancel();
      } catch {
        // ignore
      }
      currentRenderTaskRef.current = null;
    }

    setIsRenderingPage(true);

    try {
      const page = await doc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsRenderingPage(false);
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        setIsRenderingPage(false);
        return;
      }

      // Factor de escala HiDPI para nitidez total
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const scaleFactor = (currentZoom / 100) * 1.35;
      const viewport = page.getViewport({ scale: scaleFactor * dpr });
      const displayViewport = page.getViewport({ scale: scaleFactor });

      setPageSize({
        width: Math.round(displayViewport.width),
        height: Math.round(displayViewport.height),
      });

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      canvas.style.width = `${Math.round(displayViewport.width)}px`;
      canvas.style.height = `${Math.round(displayViewport.height)}px`;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      currentRenderTaskRef.current = renderTask;

      await renderTask.promise;
      currentRenderTaskRef.current = null;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page in PdfPageViewer:', err);
      }
    } finally {
      setIsRenderingPage(false);
    }
  }, []);

  // 3. Renderizar cuando cambie la página activa o el nivel de zoom
  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(pdfDocRef.current, activePage, zoom);
    }
  }, [activePage, zoom, renderPage]);

  const handlePrevPage = () => {
    if (activePage > 1 && onPageChange) {
      onPageChange(activePage - 1);
    }
  };

  const handleNextPage = () => {
    if (activePage < totalPages && onPageChange) {
      onPageChange(activePage + 1);
    }
  };

  const currentThumbUrl = pageDataUrls ? pageDataUrls[activePage] : undefined;

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden select-none ${className}`}>
      {/* BARRA SUPERIOR CON NAVEGADOR DE PÁGINAS Y CONTROLES DE ZOOM */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-white/10 rounded-t-xl text-[11px] font-mono text-zinc-400 shrink-0 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className={`w-3.5 h-3.5 ${accent.icon} shrink-0`} />
          <span className="text-white font-bold truncate max-w-[120px] sm:max-w-[180px]">
            {title || file?.name || (isEs ? 'Documento PDF' : 'PDF Document')}
          </span>
        </div>

        {/* NAVEGADOR DE PÁGINAS */}
        <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-700 text-[10px]">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={activePage <= 1}
            className="px-1.5 py-0.5 hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed font-bold"
            title={isEs ? 'Página anterior' : 'Previous page'}
          >
            ◀
          </button>
          <span className="px-1.5 font-bold text-white select-none">
            {activePage} / {totalPages || 1}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={activePage >= totalPages}
            className="px-1.5 py-0.5 hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed font-bold"
            title={isEs ? 'Página siguiente' : 'Next page'}
          >
            ▶
          </button>
        </div>

        {/* CONTROLES DE ZOOM INTERACTIVO */}
        <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-700 text-[10px]">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(35, z - 10))}
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title={isEs ? 'Reducir zoom' : 'Zoom out'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(85)}
            className={`px-1.5 py-0.5 rounded font-bold select-none transition-colors cursor-pointer ${
              zoom === 85
                ? `${accent.activeBg} ${accent.activeText}`
                : 'text-zinc-400 hover:text-white'
            }`}
            title={isEs ? 'Ajustar al ancho' : 'Fit to width'}
          >
            {isEs ? 'Ajustar' : 'Fit'}
          </button>
          <span className="px-1 text-zinc-300 font-bold min-w-[32px] text-center select-none">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(160, z + 10))}
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title={isEs ? 'Aumentar zoom' : 'Zoom in'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className={`px-1.5 py-0.5 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer ${
              zoom === 100 ? `${accent.icon} font-bold` : ''
            }`}
            title="100%"
          >
            100%
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL VISOR DE PÁGINA */}
      <div className="flex-1 overflow-y-auto overflow-x-auto bg-[#0a0a0d] p-4 border-x border-b border-white/10 rounded-b-xl custom-scrollbar flex items-start justify-center relative">
        {/* Indicador de carga inicial del PDF */}
        {isLoadingDoc && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 font-mono text-xs text-zinc-300">
            <Loader2 className={`w-6 h-6 animate-spin ${accent.loader}`} />
            <span>{isEs ? 'Cargando documento PDF...' : 'Loading PDF document...'}</span>
          </div>
        )}

        {/* Tarjeta de la Página */}
        <div
          className="relative transition-all duration-150 flex flex-col items-center justify-center my-auto"
          style={{ minWidth: `${pageSize.width}px`, minHeight: `${pageSize.height}px` }}
        >
          {/* Placeholder rápido de la miniatura mientras termina de renderizar el canvas */}
          {currentThumbUrl && (
            <img
              src={currentThumbUrl}
              alt={`Página ${activePage}`}
              className={`absolute inset-0 w-full h-full object-contain rounded-sm shadow-2xl transition-opacity duration-200 pointer-events-none ${
                isRenderingPage ? 'opacity-80' : 'opacity-0'
              }`}
            />
          )}

          {/* Canvas de renderizado en alta resolución */}
          <canvas
            ref={canvasRef}
            className="bg-white rounded-sm shadow-2xl ring-1 ring-white/15 block"
          />

          {/* Badge flotante de número de página */}
          <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs border border-white/20 text-white font-mono text-[9px] px-2 py-0.5 rounded shadow-lg font-bold">
            {isEs ? `Página ${activePage} de ${totalPages}` : `Page ${activePage} of ${totalPages}`}
          </div>

          {/* Pequeño spinner sutil durante re-renderizado */}
          {isRenderingPage && !isLoadingDoc && (
            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs border border-white/20 text-zinc-300 font-mono text-[9px] px-2 py-0.5 rounded flex items-center gap-1.5 shadow-lg">
              <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
              <span>{isEs ? 'Renderizando...' : 'Rendering...'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
