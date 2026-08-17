'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock, FileText } from 'lucide-react';
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
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function renderPageThumbnail() {
      if (!file) {
        setThumbnailUrl(null);
        setIsLoading(false);
        setIsLocked(false);
        return;
      }

      setIsLoading(true);
      setIsLocked(false);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const arrayBuffer = await file.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        loadingTask.promise.then(async (pdfDoc) => {
          if (isCancelled) return;
          try {
            const page = await pdfDoc.getPage(1);
            if (isCancelled) return;

            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({
                canvasContext: context,
                viewport,
                canvas
              } as any).promise;

              if (!isCancelled) {
                setThumbnailUrl(canvas.toDataURL('image/webp', 0.9));
                setIsLoading(false);
              }
            }
          } catch (renderErr) {
            console.warn('Error al renderizar página 1 del PDF:', renderErr);
            if (!isCancelled) setIsLoading(false);
          }
        }).catch((docErr: any) => {
          if (isCancelled) return;
          if (docErr?.name === 'PasswordException' || docErr?.code === 1) {
            setIsLocked(true);
          }
          setIsLoading(false);
        });
      } catch (err) {
        console.warn('Error al procesar miniatura PDF:', err);
        if (!isCancelled) setIsLoading(false);
      }
    }

    renderPageThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className={`w-full h-full flex items-center justify-center p-3 sm:p-5 relative ${className}`}>
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
        <div className="relative flex items-center justify-center max-h-full max-w-full">
          <img
            src={thumbnailUrl}
            alt={file.name}
            className="max-h-[340px] sm:max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/10 select-none pointer-events-none"
          />
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
