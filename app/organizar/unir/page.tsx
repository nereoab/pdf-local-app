'use client';

import PdfMerger from '../../../components/PdfMerger';
import { useLanguage } from '../../../context/LanguageContext';
import { Merge } from 'lucide-react';
import Link from 'next/link';

export default function UnirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/10">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
            <Merge className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-xs mb-1">
              <Link href="/organizar" className="text-zinc-400 hover:text-white transition-colors">
                {isEs ? '002 / Organizar PDF' : '002 / Organize PDF'}
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-white font-bold">{isEs ? 'Unir PDFs' : 'Merge PDFs'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              {isEs ? 'UNIR ARCHIVOS PDF' : 'MERGE PDF FILES'}
            </h1>
          </div>
        </div>

        <PdfMerger />
      </div>
    </div>
  );
}
