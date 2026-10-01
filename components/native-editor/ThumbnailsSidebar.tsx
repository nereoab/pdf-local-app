'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layers, ChevronLeft } from 'lucide-react';

interface ThumbnailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  currentPage: number;
  onSelectPage: (page: number) => void;
  pdfDoc: any;
  lang?: 'es' | 'en';
}

export default function ThumbnailsSidebar({
  isOpen,
  onClose,
  totalPages,
  currentPage,
  onSelectPage,
  pdfDoc,
  lang = 'es',
}: ThumbnailsSidebarProps) {
  const isEs = lang === 'es';
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!isOpen || !pdfDoc || totalPages <= 0) return;

    let isMounted = true;

    const renderThumbnails = async () => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (!isMounted) break;
        if (thumbnails[pageNum]) continue;

        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.22 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            if (isMounted) {
              setThumbnails((prev) => ({
                ...prev,
                [pageNum]: canvas.toDataURL('image/jpeg', 0.7),
              }));
            }
          }
        } catch (err) {
          console.warn(`Error al renderizar miniatura ${pageNum}:`, err);
        }
      }
    };

    renderThumbnails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfDoc, totalPages, thumbnails]);

  if (!isOpen) return null;

  return (
    <aside className="w-52 bg-[#0e0e13] border-r border-zinc-800 flex flex-col h-full flex-shrink-0 z-20 animate-in slide-in-from-left duration-200">
      {/* Cabecera del Sidebar */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>{isEs ? 'Páginas' : 'Thumbnails'}</span>
          <span className="text-[10px] text-zinc-400 font-mono">({totalPages})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
          title={isEs ? 'Ocultar miniaturas' : 'Close sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Miniaturas con Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isActive = pageNum === currentPage;
          const thumbUrl = thumbnails[pageNum];

          return (
            <div
              key={pageNum}
              onClick={() => onSelectPage(pageNum)}
              className={`group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
              }`}
            >
              <div className="w-full aspect-[1/1.414] bg-white rounded-md overflow-hidden shadow-sm flex items-center justify-center relative">
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbUrl}
                    alt={`Página ${pageNum}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center animate-pulse">
                    <span className="text-[10px] font-mono text-zinc-500">{pageNum}</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-mono mt-1.5 ${
                  isActive ? 'text-blue-400 font-bold' : 'text-zinc-400 group-hover:text-white'
                }`}
              >
                {pageNum}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
