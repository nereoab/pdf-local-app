'use client';

import PdfUnlocker from '../../../components/PdfUnlocker';
import { useLanguage } from '../../../context/LanguageContext';
import { Unlock } from 'lucide-react';
import Link from 'next/link';

export default function DesbloquearPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#030712]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="bg-gradient-to-tr from-amber-500/30 to-yellow-500/20 p-3 rounded-2xl border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Unlock className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/optimizar" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors">
                {isEs ? 'Optimizar PDF' : 'Optimize PDF'}
              </Link>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-amber-400 text-xs font-bold">{isEs ? 'Desbloquear PDF' : 'Unlock PDF'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEs ? 'DESBLOQUEAR ARCHIVO PDF' : 'UNLOCK PDF FILE'}
            </h1>
          </div>
        </div>

        <PdfUnlocker />
      </div>
    </div>
  );
}
