'use client';

import { useState, useEffect } from 'react';
import PdfUploader from '../components/PdfUploader';
import PdfSplitter from '../components/PdfSplitter';
import PdfFoliador from '../components/PdfFoliador';
import PdfOrganizer from '../components/PdfOrganizer';
import PdfProtector from '../components/PdfProtector';
import PdfRotator from '../components/PdfRotator';
import PdfToWord from '../components/PdfToWord';
import PdfEditor from '../components/PdfEditor';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Layers, Scissors, Hash, ArrowLeft, ShieldCheck, RotateCw, LayoutGrid, 
  Globe, Moon, Sun, FileText, FileEdit, Edit3, RefreshCw, Zap, FolderOpen 
} from 'lucide-react';
import { Toaster } from 'sonner';

type CategoryType = 'editar' | 'convertir' | 'optimizar' | 'organizar' | null;
type ToolType = 'unir' | 'dividir' | 'foliar' | 'ordenar' | 'proteger' | 'rotar' | 'word' | 'editor' | null;

export default function Page() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

function MainApp() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isEs = lang === 'es';

  // Función para volver al inicio absoluto
  const goHome = () => {
    setActiveTool(null);
    setActiveCategory(null);
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">
      
      <Toaster position="bottom-right" richColors closeButton theme={theme === 'dark' ? 'dark' : 'light'} />

      {/* EFECTOS DE FONDO ANIMADOS (AURORA) - Solo visibles en la Portada */}
      {!activeCategory && !activeTool && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-rose-400/20 dark:bg-rose-900/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        </div>
      )}

      {/* NAVBAR */}
      <nav className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer group" onClick={goHome}>
            <div className="bg-indigo-600 group-hover:bg-indigo-500 p-2 rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="font-sans text-2xl font-black tracking-tight text-slate-800 dark:text-white transition-colors">
              PDF<span className="text-indigo-600 dark:text-indigo-400">Local</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Botones de Navegación Contextual */}
            {activeTool ? (
              <button onClick={() => setActiveTool(null)} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all">
                <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver a Categoría' : 'Back to Category'}
              </button>
            ) : activeCategory ? (
              <button onClick={goHome} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all">
                <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver al Inicio' : 'Back to Home'}
              </button>
            ) : null}

            {/* Selector de Idioma */}
            <button onClick={toggleLanguage} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
              <Globe className="w-4 h-4 text-slate-500" />
              {lang === 'es' ? 'EN' : 'ES'}
            </button>

            {/* Tema Oscuro */}
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shadow-sm">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 w-full max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 flex flex-col z-10">
        
        {/* NIVEL 1: LA PORTADA (LANDING PAGE) */}
        {!activeCategory && !activeTool && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center max-w-3xl mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                {isEs ? 'Procesamiento 100% Local y Seguro' : '100% Local & Secure Processing'}
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tight leading-tight transition-colors">
                {isEs ? 'El poder de editar PDFs' : 'The power to edit PDFs'} <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">
                  {isEs ? 'sin límites.' : 'without limits.'}
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 transition-colors">
                {isEs 
                  ? 'Selecciona una categoría para empezar. Modifica, organiza y asegura tus documentos de ingeniería o universidad directamente en tu navegador.' 
                  : 'Select a category to start. Modify, organize, and secure your engineering or university documents directly in your browser.'}
              </p>
            </div>

            {/* LAS 4 CATEGORÍAS GIGANTES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
              
              {/* 1. EDITAR PDF */}
              <CategoryCard 
                icon={<Edit3 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />}
                title={isEs ? "Editar PDF" : "Edit PDF"}
                desc={isEs ? "Modifica el texto real, añade numeración o llena formularios." : "Modify real text, add numbering, or fill out forms."}
                color="from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20"
                borderColor="hover:border-indigo-400 dark:hover:border-indigo-600"
                onClick={() => setActiveCategory('editar')}
              />

              {/* 2. ORGANIZAR PDF */}
              <CategoryCard 
                icon={<FolderOpen className="w-10 h-10 text-rose-600 dark:text-rose-400" />}
                title={isEs ? "Organizar PDF" : "Organize PDF"}
                desc={isEs ? "Une, divide, ordena y rota las páginas de tus expedientes." : "Merge, split, sort, and rotate pages of your files."}
                color="from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20"
                borderColor="hover:border-rose-400 dark:hover:border-rose-600"
                onClick={() => setActiveCategory('organizar')}
              />

              {/* 3. CONVERTIR PDF */}
              <CategoryCard 
                icon={<RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400" />}
                title={isEs ? "Convertir PDF" : "Convert PDF"}
                desc={isEs ? "Transforma tus PDFs a formatos editables como Word (.docx)." : "Transform your PDFs into editable formats like Word (.docx)."}
                color="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
                borderColor="hover:border-blue-400 dark:hover:border-blue-600"
                onClick={() => setActiveCategory('convertir')}
              />

              {/* 4. OPTIMIZAR PDF */}
              <CategoryCard 
                icon={<Zap className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />}
                title={isEs ? "Optimizar PDF" : "Optimize PDF"}
                desc={isEs ? "Añade contraseñas de seguridad o reduce el peso del archivo." : "Add security passwords or reduce file weight."}
                color="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
                borderColor="hover:border-emerald-400 dark:hover:border-emerald-600"
                onClick={() => setActiveCategory('optimizar')}
              />

            </div>
          </div>
        )}

        {/* NIVEL 2: VISTA DE CATEGORÍA (Muestra las herramientas de esa categoría) */}
        {activeCategory && !activeTool && (
          <div className="flex-1 w-full max-w-6xl mx-auto animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-black text-slate-800 dark:text-white capitalize mb-3">
                {activeCategory} PDF
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {isEs ? 'Selecciona la herramienta que deseas usar:' : 'Select the tool you want to use:'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Renderizamos condicionalmente según la categoría */}
              {activeCategory === 'editar' && (
                <>
                  <ToolCard icon={<FileEdit className="w-8 h-8 text-indigo-600" />} title={t.tools.edit.title} description={t.tools.edit.desc} onClick={() => setActiveTool('editor')} hoverColor="hover:border-indigo-400" />
                  <ToolCard icon={<Hash className="w-8 h-8 text-emerald-600" />} title={t.tools.number.title} description={t.tools.number.desc} onClick={() => setActiveTool('foliar')} hoverColor="hover:border-emerald-400" />
                </>
              )}
              {activeCategory === 'organizar' && (
                <>
                  <ToolCard icon={<LayoutGrid className="w-8 h-8 text-rose-600" />} title={t.tools.organize.title} description={t.tools.organize.desc} onClick={() => setActiveTool('ordenar')} hoverColor="hover:border-rose-400" />
                  <ToolCard icon={<Layers className="w-8 h-8 text-blue-600" />} title={t.tools.merge.title} description={t.tools.merge.desc} onClick={() => setActiveTool('unir')} hoverColor="hover:border-blue-400" />
                  <ToolCard icon={<Scissors className="w-8 h-8 text-indigo-600" />} title={t.tools.split.title} description={t.tools.split.desc} onClick={() => setActiveTool('dividir')} hoverColor="hover:border-indigo-400" />
                  <ToolCard icon={<RotateCw className="w-8 h-8 text-amber-600" />} title={t.tools.rotate.title} description={t.tools.rotate.desc} onClick={() => setActiveTool('rotar')} hoverColor="hover:border-amber-400" />
                </>
              )}
              {activeCategory === 'convertir' && (
                <>
                  <ToolCard icon={<FileText className="w-8 h-8 text-blue-500" />} title={t.tools.word.title} description={t.tools.word.desc} onClick={() => setActiveTool('word')} hoverColor="hover:border-blue-400" />
                </>
              )}
              {activeCategory === 'optimizar' && (
                <>
                  <ToolCard icon={<ShieldCheck className="w-8 h-8 text-slate-700" />} title={t.tools.protect.title} description={t.tools.protect.desc} onClick={() => setActiveTool('proteger')} hoverColor="hover:border-slate-400" />
                  {/* Tarjeta de Próximamente para Comprimir */}
                  <ToolCard icon={<Zap className="w-8 h-8 text-amber-500" />} title={isEs ? 'Comprimir PDF' : 'Compress PDF'} description={isEs ? 'Reduce el peso de tu PDF sin perder calidad.' : 'Reduce the weight of your PDF without losing quality.'} onClick={() => {}} hoverColor="hover:border-amber-300" isComingSoon soonText={isEs ? 'Pronto' : 'Soon'} />
                </>
              )}
            </div>
          </div>
        )}

        {/* NIVEL 3: VISTA DE HERRAMIENTA (El espacio de trabajo) */}
        {activeTool && (
          <div className="flex-1 w-full animate-in zoom-in-95 fade-in duration-300">
            {activeTool === 'unir' && <PdfUploader />}
            {activeTool === 'dividir' && <PdfSplitter />}
            {activeTool === 'foliar' && <PdfFoliador />}
            {activeTool === 'ordenar' && <PdfOrganizer />}
            {activeTool === 'proteger' && <PdfProtector />}
            {activeTool === 'rotar' && <PdfRotator />}
            {activeTool === 'editor' && <PdfEditor />}
            {activeTool === 'word' && <PdfToWord />}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 mt-auto z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <Layers className="w-8 h-8 text-indigo-500 mb-4 opacity-50" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.footer.title}</p>
          <p className="text-xs text-slate-500 mt-2 max-w-md">{t.footer.desc}</p>
        </div>
      </footer>
    </main>
  );
}

// NUEVO COMPONENTE: Las 4 Tarjetas Gigantes de la Portada
function CategoryCard({ icon, title, desc, color, borderColor, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-start p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden text-left ${borderColor}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10 bg-white dark:bg-slate-800 p-4 rounded-2xl mb-6 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h2 className="relative z-10 text-2xl font-black text-slate-800 dark:text-white mb-3">{title}</h2>
      <p className="relative z-10 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </button>
  );
}

// COMPONENTE EXISTENTE: Las tarjetas de herramientas individuales
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
      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
        {description}
      </p>
    </div>
  );
}