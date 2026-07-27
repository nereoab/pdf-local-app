'use client';

import PdfComparator from '../../../components/PdfComparator';
import { useLanguage } from '../../../context/LanguageContext';
import { GitCompare, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CompararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b] font-sans">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 font-mono">
          <div className="flex items-center gap-3.5">
            <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Link href="/optimizar" className="hover:text-white transition-colors">
                  {isEs ? '004 / OPTIMIZAR' : '004 / OPTIMIZE'}
                </Link>
                <span>/</span>
                <span className="text-white font-bold">{isEs ? 'COMPARAR PDF' : 'COMPARE PDF'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                {isEs ? '006 / COMPARAR 2 ARCHIVOS PDF' : '006 / COMPARE 2 PDF FILES'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? 'Detección Visual & Semántica' : 'Visual & Semantic Detection'}</span>
          </div>
        </div>

        <PdfComparator />
      </div>
    </div>
  );
}
