'use client';

import { useState } from 'react';
import PdfUploader from '../components/PdfUploader';
import PdfSplitter from '../components/PdfSplitter';
import PdfFoliador from '../components/PdfFoliador';
import PdfOrganizer from '../components/PdfOrganizer';
import PdfProtector from '../components/PdfProtector'; // IMPORTAMOS LA NUEVA HERRAMIENTA
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { Layers, Scissors, Hash, ArrowLeft, ShieldCheck, RotateCw, LayoutGrid, Globe } from 'lucide-react';
import { Toaster } from 'sonner'; // IMPORTAMOS EL TOASTER

type ToolType = 'unir' | 'dividir' | 'foliar' | 'ordenar' | 'proteger' | null;

export default function Page() {
  return (
    <LanguageProvider>
      {/* Agregamos el Toaster aquí para que esté disponible en toda la app */}
      <Toaster position="bottom-right" richColors closeButton />
      <MainApp />
    </LanguageProvider>
  );
}

function MainApp() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const { t, lang, toggleLanguage } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 selection:bg-red-100 selection:text-red-900">
      
      <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTool(null)}
          >
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans text-2xl font-extrabold tracking-tight text-slate-800">
              PDF<span className="text-red-600">Local</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {activeTool && (
              <button 
                onClick={() => setActiveTool(null)}
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t.nav.back}
              </button>
            )}

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col">
        
        {!activeTool ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mb-12">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                {t.hero.title}
              </h1>
              <p className="text-lg text-slate-600">
                {t.hero.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
              <ToolCard 
                icon={<LayoutGrid className="w-8 h-8 text-rose-600" />}
                title={t.tools.organize.title}
                description={t.tools.organize.desc}
                onClick={() => setActiveTool('ordenar')}
                hoverColor="hover:border-rose-300 hover:shadow-rose-100"
              />
              <ToolCard 
                icon={<Layers className="w-8 h-8 text-blue-600" />}
                title={t.tools.merge.title}
                description={t.tools.merge.desc}
                onClick={() => setActiveTool('unir')}
                hoverColor="hover:border-blue-300 hover:shadow-blue-100"
              />
              <ToolCard 
                icon={<Scissors className="w-8 h-8 text-indigo-600" />}
                title={t.tools.split.title}
                description={t.tools.split.desc}
                onClick={() => setActiveTool('dividir')}
                hoverColor="hover:border-indigo-300 hover:shadow-indigo-100"
              />
              <ToolCard 
                icon={<Hash className="w-8 h-8 text-emerald-600" />}
                title={t.tools.number.title}
                description={t.tools.number.desc}
                onClick={() => setActiveTool('foliar')}
                hoverColor="hover:border-emerald-300 hover:shadow-emerald-100"
              />
              <ToolCard 
                icon={<ShieldCheck className="w-8 h-8 text-slate-700" />}
                title={t.tools.protect.title}
                description={t.tools.protect.desc}
                onClick={() => setActiveTool('proteger')} // YA NO DICE PRONTO, AHORA ABRE LA HERRAMIENTA
                hoverColor="hover:border-slate-400 hover:shadow-slate-200"
              />
              <ToolCard 
                icon={<RotateCw className="w-8 h-8 text-amber-600" />}
                title={t.tools.rotate.title}
                description={t.tools.rotate.desc}
                onClick={() => {}}
                hoverColor="hover:border-amber-300 hover:shadow-amber-100"
                isComingSoon={true}
                soonText={t.soon}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full animate-in fade-in zoom-in-95 duration-300">
            {activeTool === 'unir' && <PdfUploader />}
            {activeTool === 'dividir' && <PdfSplitter />}
            {activeTool === 'foliar' && <PdfFoliador />}
            {activeTool === 'ordenar' && <PdfOrganizer />}
            {activeTool === 'proteger' && <PdfProtector />}
          </div>
        )}

      </div>

      <footer className="w-full border-t border-slate-200 bg-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <ShieldCheck className="w-6 h-6 text-emerald-500 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{t.footer.title}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            {t.footer.desc}
          </p>
        </div>
      </footer>
    </main>
  );
}

function ToolCard({ icon, title, description, onClick, hoverColor, isComingSoon = false, soonText = 'Pronto' }: any) {
  return (
    <div 
      onClick={!isComingSoon ? onClick : undefined}
      className={`relative bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm transition-all duration-300 flex flex-col items-start text-left
        ${isComingSoon ? 'opacity-60 cursor-not-allowed' : `cursor-pointer hover:-translate-y-1 hover:shadow-lg ${hoverColor}`}
      `}
    >
      {isComingSoon && (
        <span className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
          {soonText}
        </span>
      )}
      <div className="bg-slate-50 p-3 rounded-xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}