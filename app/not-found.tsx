'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Spade, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* GLOW DE FONDO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative z-10 flex flex-col items-center"
      >
        {/* LOGO BADGE */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse">
          <AlertCircle className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
        </div>

        {/* CÓDIGO 404 GRANDE */}
        <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tighter mb-2">
          404
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          {isEs ? "Oops, esta página no existe" : "Oops, page not found"}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed mb-8">
          {isEs 
            ? "La dirección web que ingresaste no se encuentra disponible o ha sido movida a otra ubicación."
            : "The web address you entered is unavailable or has been moved to another location."}
        </p>

        {/* BOTÓN REGRESO AL INICIO */}
        <Link href="/">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEs ? "Regresar al inicio de PDFBlack" : "Back to PDFBlack Home"}
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
