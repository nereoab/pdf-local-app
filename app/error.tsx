'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  useEffect(() => {
    // Registrar error para monitoreo en consola de cliente
    console.error('[PDFBlack Runtime Error]:', error);
  }, [error]);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full bg-[#09090b] border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative z-10 flex flex-col items-center font-mono"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">
          {isEs ? 'Aviso del Sistema' : 'System Notice'}
        </span>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-3 font-sans">
          {isEs ? 'Ocurrió un problema inesperado' : 'An unexpected error occurred'}
        </h1>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-8">
          {isEs
            ? 'No te preocupes, tus archivos no han sido comprometidos. Puedes reintentar la operación o volver a la página principal.'
            : 'Do not worry, your files have not been compromised. You can retry the operation or return to the home page.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black" />
            {isEs ? 'Reintentar operación' : 'Try again'}
          </motion.button>

          <Link href="/" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 px-6 py-2.5 rounded-full font-sans font-medium text-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
              {isEs ? 'Volver al inicio' : 'Back to Home'}
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
