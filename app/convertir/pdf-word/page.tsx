'use client';

import PdfToWord from '../../../components/PdfToWord';
import { useLanguage } from '../../../context/LanguageContext';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function PdfToWordPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="bg-gradient-to-tr from-blue-500/30 to-cyan-500/20 p-3 rounded-2xl border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <FileText className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/convertir" className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-blue-400 text-xs font-bold">{isEs ? 'PDF a Word' : 'PDF to Word'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEs ? 'CONVERTIR PDF A WORD' : 'CONVERT PDF TO WORD'}
            </h1>
          </div>
        </div>

        <PdfToWord />
      </div>
    </div>
  );
}
