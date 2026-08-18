'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SpotlightCard from '@/components/SpotlightCard';

export default function NotFound() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <SpotlightCard className="max-w-lg w-full bg-[#09090b] border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative z-10 flex flex-col items-center font-mono">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>

        <span className="text-6xl font-bold text-white tracking-tighter mb-2">404</span>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-3 font-sans">
          {isEs ? 'Página no encontrada' : 'Page not found'}
        </h1>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-8">
          {isEs
            ? 'La dirección ingresada no existe o ha sido trasladada a otro módulo.'
            : 'The address entered does not exist or has been moved.'}
        </p>

        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans font-semibold text-xs transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            {isEs ? 'Regresar al inicio' : 'Back to Home'}
          </motion.button>
        </Link>
      </SpotlightCard>
    </div>
  );
}
