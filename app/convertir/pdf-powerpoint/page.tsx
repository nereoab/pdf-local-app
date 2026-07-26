'use client';

import PdfToPowerPoint from '../../../components/PdfToPowerPoint';
import { useLanguage } from '../../../context/LanguageContext';
import { Presentation } from 'lucide-react';
import Link from 'next/link';

export default function PdfToPowerPointPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#030712]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="bg-gradient-to-tr from-orange-500/30 to-amber-500/20 p-3 rounded-2xl border border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <Presentation className="w-7 h-7 text-orange-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/convertir" className="text-xs font-bold text-slate-400 hover:text-orange-400 transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-orange-400 text-xs font-bold">{isEs ? 'PDF a PowerPoint' : 'PDF to PowerPoint'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEs ? 'CONVERTIR PDF A POWERPOINT' : 'CONVERT PDF TO POWERPOINT'}
            </h1>
          </div>
        </div>

        <PdfToPowerPoint />
      </div>
    </div>
  );
}
