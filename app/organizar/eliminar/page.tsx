'use client';

import PdfPageDeleter from '../../../components/PdfPageDeleter';
import { useLanguage } from '../../../context/LanguageContext';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EliminarPaginasPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="bg-gradient-to-tr from-red-500/30 to-rose-500/20 p-3 rounded-2xl border border-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Trash2 className="w-7 h-7 text-red-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/organizar" className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors">
                {isEs ? 'Organizar PDF' : 'Organize PDF'}
              </Link>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-red-400 text-xs font-bold">{isEs ? 'Eliminar Páginas' : 'Delete Pages'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEs ? 'ELIMINAR PÁGINAS DEL PDF' : 'DELETE PAGES FROM PDF'}
            </h1>
          </div>
        </div>

        <PdfPageDeleter />
      </div>
    </div>
  );
}
