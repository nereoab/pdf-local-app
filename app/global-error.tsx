'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PDFBlack Global Crash]:', error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="bg-[#09090b] text-white min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#121215] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400 font-bold text-xl">
            !
          </div>
          <h1 className="text-xl font-bold mb-2">Error de Sistema</h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Se ha producido un error crítico en la carga inicial. Por favor intenta recargar la aplicación.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-white text-black hover:bg-zinc-200 py-2.5 px-6 rounded-full font-semibold text-xs transition-all cursor-pointer"
          >
            Recargar Aplicación
          </button>
        </div>
      </body>
    </html>
  );
}
