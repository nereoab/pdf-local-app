'use client';

import PdfSplitter from '../../../components/PdfSplitter';
import { useLanguage } from '../../../context/LanguageContext';
import { Scissors } from 'lucide-react';
import Link from 'next/link';

export default function DividirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#030712]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="bg-gradient-to-tr from-teal-500/30 to-cyan-500/20 p-3 rounded-2xl border border-teal-400/40 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            <Scissors className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/organizar" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors">
                {isEs ? 'Organizar PDF' : 'Organize PDF'}
              </Link>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-teal-400 text-xs font-bold">{isEs ? 'Dividir PDF' : 'Split PDF'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEs ? 'DIVIDIR ARCHIVO PDF' : 'SPLIT PDF FILE'}
            </h1>
          </div>
        </div>

        <PdfSplitter />
      </div>
    </div>
  );
}
