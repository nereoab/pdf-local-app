'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, Lock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PdfPreviewThumbnailProps {
  file: File | null;
  className?: string;
}

export default function PdfPreviewThumbnail({ file, className = '' }: PdfPreviewThumbnailProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageRendering, setIsPageRendering] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const pdfDocRef = useRef<any>(null);

  // Renderiza una página específica usando el documento PDF ya cargado en memoria
  const renderPage = useCallback(async (pdfDoc: any, pageNum: number) => {
    if (!pdfDoc) return;
    setIsPageRendering(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        } as any).promise;

        setThumbnailUrl(canvas.toDataURL('image/webp', 0.95));
      }
    } catch (err) {
      console.warn(`Error al renderizar la página ${pageNum}:`, err);
    } finally {
      setIsPageRendering(false);
      setIsLoading(false);
    }
  }, []);

  // Carga inicial del documento PDF
  useEffect(() => {
    let isCancelled = false;

    async function loadPdfDocument() {
      if (!file) {
        setThumbnailUrl(null);
        setIsLoading(false);
        setIsLocked(false);
        setNumPages(1);
        setCurrentPage(1);
        pdfDocRef.current = null;
        return;
      }

      setIsLoading(true);
      setIsLocked(false);
      setCurrentPage(1);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const arrayBuffer = await file.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        loadingTask.promise
          .then(async (pdfDoc) => {
            if (isCancelled) return;
            pdfDocRef.current = pdfDoc;
            setNumPages(pdfDoc.numPages || 1);
            await renderPage(pdfDoc, 1);
          })
          .catch((docErr: any) => {
            if (isCancelled) return;
            if (docErr?.name === 'PasswordException' || docErr?.code === 1) {
              setIsLocked(true);
            }
            setIsLoading(false);
          });
      } catch (err) {
        console.warn('Error al procesar archivo PDF:', err);
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadPdfDocument();

    return () => {
      isCancelled = true;
      pdfDocRef.current = null;
    };
  }, [file, renderPage]);

  // Cambiar a la página anterior
  const handlePrevPage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentPage > 1 && pdfDocRef.current) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      renderPage(pdfDocRef.current, prev);
    }
  };

  // Cambiar a la página siguiente
  const handleNextPage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentPage < numPages && pdfDocRef.current) {
      const next = currentPage + 1;
      setCurrentPage(next);
      renderPage(pdfDocRef.current, next);
    }
  };

  // Soporte de navegación por teclado (Flechas Izquierda / Derecha)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfDocRef.current || numPages <= 1) return;
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  if (!file) return null;

  return (
    <div className={`w-full h-full flex-1 flex flex-col items-center justify-center p-1.5 sm:p-2 relative group select-none ${className}`}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2.5 text-zinc-500 font-mono text-xs">
          <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
          <span>{isEs ? 'Cargando vista previa...' : 'Loading preview...'}</span>
        </div>
      ) : isLocked ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/80 border border-amber-500/30 rounded-2xl text-center max-w-[280px]">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-white font-bold text-xs font-sans">
              {isEs ? 'Documento Protegido' : 'Protected Document'}
            </span>
            <span className="text-zinc-400 text-[11px] font-mono leading-relaxed">
              {isEs ? 'El archivo requiere contraseña para visualizarse' : 'File requires password to view'}
            </span>
          </div>
        </div>
      ) : thumbnailUrl ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* IMAGEN DE LA PÁGINA ACTUAL */}
          <img
            src={thumbnailUrl}
            alt={`${file.name} - ${isEs ? 'Página' : 'Page'} ${currentPage}`}
            className="w-full h-full max-h-[580px] object-contain rounded-xl shadow-2xl border border-white/10 select-none pointer-events-none transition-all duration-200"
          />

          {/* INDICADOR DE CARGA DE PÁGINA */}
          {isPageRendering && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-20">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}

          {/* BOTONES LATERALES DE NAVEGACIÓN (FLOTANTES) */}
          {numPages > 1 && (
            <>
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isPageRendering}
                className={`absolute left-3 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 shadow-2xl transition-all z-20 cursor-pointer backdrop-blur-md ${
                  currentPage <= 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100 hover:scale-110'
                }`}
                aria-label={isEs ? 'Página anterior' : 'Previous page'}
                title={isEs ? 'Página anterior (←)' : 'Previous page (←)'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages || isPageRendering}
                className={`absolute right-3 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 shadow-2xl transition-all z-20 cursor-pointer backdrop-blur-md ${
                  currentPage >= numPages ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100 hover:scale-110'
                }`}
                aria-label={isEs ? 'Página siguiente' : 'Next page'}
                title={isEs ? 'Página siguiente (→)' : 'Next page (→)'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* BARRA INFERIOR DE PAGINACIÓN */}
          {numPages > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/90 border border-white/20 rounded-full shadow-2xl backdrop-blur-md z-20 font-mono text-xs text-white">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isPageRendering}
                className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                aria-label={isEs ? 'Página anterior' : 'Previous page'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-medium text-[11px] whitespace-nowrap px-1">
                {isEs ? `Página ${currentPage} de ${numPages}` : `Page ${currentPage} of ${numPages}`}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages || isPageRendering}
                className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                aria-label={isEs ? 'Página siguiente' : 'Next page'}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs">
          <FileText className="w-10 h-10 text-zinc-600" />
          <span>{isEs ? 'Vista previa no disponible' : 'Preview not available'}</span>
        </div>
      )}
    </div>
  );
}

