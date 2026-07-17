'use client';

import { useState, useEffect } from 'react';
import PdfUploader from '../components/PdfUploader';
import PdfSplitter from '../components/PdfSplitter';
import PdfFoliador from '../components/PdfFoliador';
import PdfOrganizer from '../components/PdfOrganizer';
import PdfProtector from '../components/PdfProtector';
import PdfRotator from '../components/PdfRotator';
import PdfToWord from '../components/PdfToWord';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { Layers, Scissors, Hash, ArrowLeft, ShieldCheck, RotateCw, LayoutGrid, Globe, Moon, Sun, FileText } from 'lucide-react';
import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

type ToolType = 'unir' | 'dividir' | 'foliar' | 'ordenar' | 'proteger' | 'rotar' | 'word' | null;

export default function Page() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

function MainApp() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita errores de hidratación en Next.js al cargar el tema
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 selection:bg-red-100 selection:text-red-900">
      
      {/* Toaster dinámico que cambia a oscuro/claro */}
      <Toaster position="bottom-right" richColors closeButton theme={theme === 'dark' ? 'dark' : 'light'} />

      {/* NAVBAR SUPERIOR */}
      <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTool(null)}
          >
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white transition-colors">
              PDF<span className="text-red-600">Local</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {activeTool && (
              <button 
                onClick={() => setActiveTool(null)}
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t.nav.back}
              </button>
            )}

            {/* BOTÓN DE IDIOMA */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              {lang === 'es' ? 'EN' : 'ES'}
            </button>

            {/* BOTÓN MODO OSCURO */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col">
        
        {!activeTool ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mb-12">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight transition-colors">
                {t.hero.title}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 transition-colors">
                {t.hero.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
              <ToolCard 
                icon={<LayoutGrid className="w-8 h-8 text-rose-600 dark:text-rose-400" />}
                title={t.tools.organize.title}
                description={t.tools.organize.desc}
                onClick={() => setActiveTool('ordenar')}
                hoverColor="hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-rose-100 dark:hover:shadow-rose-900/20"
              />
              <ToolCard 
                icon={<Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                title={t.tools.merge.title}
                description={t.tools.merge.desc}
                onClick={() => setActiveTool('unir')}
                hoverColor="hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-blue-100 dark:hover:shadow-blue-900/20"
              />
              <ToolCard 
                icon={<Scissors className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
                title={t.tools.split.title}
                description={t.tools.split.desc}
                onClick={() => setActiveTool('dividir')}
                hoverColor="hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20"
              />
              <ToolCard 
                icon={<Hash className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
                title={t.tools.number.title}
                description={t.tools.number.desc}
                onClick={() => setActiveTool('foliar')}
                hoverColor="hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20"
              />
              <ToolCard 
                icon={<ShieldCheck className="w-8 h-8 text-slate-700 dark:text-slate-300" />}
                title={t.tools.protect.title}
                description={t.tools.protect.desc}
                onClick={() => setActiveTool('proteger')}
                hoverColor="hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-slate-200 dark:hover:shadow-slate-800/20"
              />
              <ToolCard 
                icon={<RotateCw className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
                title={t.tools.rotate.title}
                description={t.tools.rotate.desc}
                onClick={() => setActiveTool('rotar')}
                hoverColor="hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-amber-100 dark:hover:shadow-amber-900/20"
              />
              <ToolCard 
                icon={<FileText className="w-8 h-8 text-blue-500 dark:text-blue-400" />}
                title={t.tools.word.title}
                description={t.tools.word.desc}
                onClick={() => setActiveTool('word')}
                hoverColor="hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-blue-100 dark:hover:shadow-blue-900/20"
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
            {activeTool === 'rotar' && <PdfRotator />}
            {activeTool === 'word' && <PdfToWord />}
          </div>
        )}

      </div>

      {/* FOOTER UNIVERSAL */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors">{t.footer.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md transition-colors">
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
      className={`relative bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 flex flex-col items-start text-left
        ${isComingSoon ? 'opacity-60 cursor-not-allowed' : `cursor-pointer hover:-translate-y-1 hover:shadow-lg ${hoverColor}`}
      `}
    >
      {isComingSoon && (
        <span className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
          {soonText}
        </span>
      )}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
        {description}
      </p>
    </div>
  );
}