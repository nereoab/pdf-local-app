'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
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
  Globe, FileText, FileEdit, Edit3, RefreshCw, Zap, FolderOpen, ChevronDown, Spade
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

  const goHome = () => {
    setActiveTool(null);
    setActiveCategory(null);
  };

  const navigateToCategory = (category: CategoryType) => {
    setActiveTool(null);
    setActiveCategory(category);
  };

  // 🔥 1. CONFIGURACIÓN DE LA ENTRADA EN CASCADA (STAGGER)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } // Curva de animación suave y lujosa
    }
  };

  return (
    <div className="flex min-h-screen flex-col transition-colors duration-700 selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden font-sans text-slate-200 bg-black">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black pointer-events-none z-0"></div>

      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* ==========================================
          ENCABEZADO OFICIAL (HEADER)
      ========================================== */}
      <header className="w-full bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-3 cursor-pointer group" onClick={goHome}>
            <div className="bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 p-2.5 rounded-xl shadow-lg transition-all">
              <Spade className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-3xl tracking-tight text-white font-light">
              PDF<span className="font-black">Black</span>
            </span>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8">
            <DropdownMenu title={isEs ? 'Editar PDF' : 'Edit PDF'} category="editar" navigate={navigateToCategory} t={t} isEs={isEs} setActiveTool={setActiveTool} />
            <DropdownMenu title={isEs ? 'Organizar PDF' : 'Organize PDF'} category="organizar" navigate={navigateToCategory} t={t} isEs={isEs} setActiveTool={setActiveTool} />
            <DropdownMenu title={isEs ? 'Convertir PDF' : 'Convert PDF'} category="convertir" navigate={navigateToCategory} t={t} isEs={isEs} setActiveTool={setActiveTool} />
            <DropdownMenu title={isEs ? 'Optimizar PDF' : 'Optimize PDF'} category="optimizar" navigate={navigateToCategory} t={t} isEs={isEs} setActiveTool={setActiveTool} />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <AnimatePresence mode="wait">
              {activeTool ? (
                <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={() => setActiveTool(null)} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 px-4 py-2 rounded-lg transition-all backdrop-blur-md border border-white/5 hover:border-white/10">
                  <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver a Categoría' : 'Back to Category'}
                </motion.button>
              ) : activeCategory ? (
                <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={goHome} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 px-4 py-2 rounded-lg transition-all backdrop-blur-md border border-white/5 hover:border-white/10">
                  <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver al Inicio' : 'Back to Home'}
                </motion.button>
              ) : null}
            </AnimatePresence>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleLanguage} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all backdrop-blur-md border border-white/5">
              <Globe className="w-4 h-4" />
              {lang === 'es' ? 'EN' : 'ES'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* ==========================================
          CUERPO PRINCIPAL (MAIN CONTENT)
      ========================================== */}
      <main className="flex-1 w-full max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col z-10 relative">
        
        {/* LA PORTADA */}
        {!activeCategory && !activeTool && (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="flex-1 flex flex-col items-center justify-start pt-2 pb-8"
          >
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none z-0"></div>

            <div className="text-center max-w-4xl mb-8 relative z-10">
              {/* Título Blanco (Entra primero) */}
              <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2 leading-tight">
                {isEs ? 'Herramientas PDF gratuitas,' : 'Completely free PDF tools,'} <br className="hidden sm:block"/> 
              </motion.h1>
              
              {/* 🔥 3. TEXTO GRADIENTE FLUIDO (Entra segundo y se mueve infinitamente) */}
              <motion.div variants={itemVariants}>
                <motion.span 
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: '200% auto' }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight inline-block pb-2"
                >
                  {isEs ? 'sin tarjeta, sin registro.' : 'no credit card, no sign-up.'}
                </motion.span>
              </motion.div>
            </div>

            {/* TARJETAS (Entran en cascada una por una) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl mb-12 relative z-10">
              <CategoryCard variants={itemVariants} icon={<Edit3 className="w-7 h-7 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Editar PDF" : "Edit PDF"} desc={isEs ? "Modifica el texto real, añade numeración o llena formularios interactivos." : "Modify real text, add numbering, or fill out forms."} onClick={() => setActiveCategory('editar')} />
              <CategoryCard variants={itemVariants} icon={<FolderOpen className="w-7 h-7 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Organizar PDF" : "Organize PDF"} desc={isEs ? "Une, divide, ordena y rota las páginas de tus expedientes con Drag & Drop." : "Merge, split, sort, and rotate pages of your files."} onClick={() => setActiveCategory('organizar')} />
              <CategoryCard variants={itemVariants} icon={<RefreshCw className="w-7 h-7 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Convertir PDF" : "Convert PDF"} desc={isEs ? "Transforma tus PDFs a formatos editables como Microsoft Word (.docx)." : "Transform your PDFs into editable formats like Word (.docx)."} onClick={() => setActiveCategory('convertir')} />
              <CategoryCard variants={itemVariants} icon={<Zap className="w-7 h-7 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Optimizar PDF" : "Optimize PDF"} desc={isEs ? "Añade contraseñas de seguridad AES-256 o reduce el peso del archivo." : "Add security passwords or reduce file weight."} onClick={() => setActiveCategory('optimizar')} />
            </div>

            {/* TEXTO TÉCNICO SECUNDARIO (Entra al final) */}
            <motion.div variants={itemVariants} className="text-center max-w-3xl w-full relative z-10 pt-10 border-t border-white/5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] text-slate-300 font-medium text-xs sm:text-sm mb-6 mt-2 border border-white/5 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-blue-500" strokeWidth={2} />
                {isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}
              </div>
              
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 tracking-tight">
                {isEs ? 'Todo tu flujo de trabajo, ' : 'Your entire workflow, '} <span className="text-slate-400">{isEs ? 'cero servidores.' : 'zero servers.'}</span>
              </h2>
              <p className="text-sm sm:text-base text-[#A1A1AA] font-normal leading-relaxed max-w-2xl mx-auto mb-4">
                {isEs 
                  ? 'Edita, organiza y optimiza tus documentos con total confidencialidad. Todo el procesamiento ocurre directamente en tu dispositivo, garantizando que tus archivos nunca abandonen tu control.' 
                  : 'Edit, organize, and optimize your documents with total confidentiality. All processing happens directly on your device, ensuring your files never leave your control.'}
              </p>
            </motion.div>

          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeCategory && !activeTool && (
            <motion.div key="category" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="flex-1 w-full max-w-6xl mx-auto">
              <div className="mb-10 text-center">
                <h2 className="text-4xl font-bold text-white capitalize mb-3 tracking-tight">{activeCategory} PDF</h2>
                <p className="text-[#A1A1AA]">{isEs ? 'Selecciona una herramienta para comenzar:' : 'Select a tool to start:'}</p>
              </div>
              
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeCategory === 'editar' && (
                  <>
                    <ToolCard variants={itemVariants} icon={<FileEdit className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.edit.title} description={t.tools.edit.desc} onClick={() => setActiveTool('editor')} />
                    <ToolCard variants={itemVariants} icon={<Hash className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.number.title} description={t.tools.number.desc} onClick={() => setActiveTool('foliar')} />
                  </>
                )}
                {activeCategory === 'organizar' && (
                  <>
                    <ToolCard variants={itemVariants} icon={<LayoutGrid className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.organize.title} description={t.tools.organize.desc} onClick={() => setActiveTool('ordenar')} />
                    <ToolCard variants={itemVariants} icon={<Layers className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.merge.title} description={t.tools.merge.desc} onClick={() => setActiveTool('unir')} />
                    <ToolCard variants={itemVariants} icon={<Scissors className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.split.title} description={t.tools.split.desc} onClick={() => setActiveTool('dividir')} />
                    <ToolCard variants={itemVariants} icon={<RotateCw className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.rotate.title} description={t.tools.rotate.desc} onClick={() => setActiveTool('rotar')} />
                  </>
                )}
                {activeCategory === 'convertir' && (
                  <>
                    <ToolCard variants={itemVariants} icon={<FileText className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.word.title} description={t.tools.word.desc} onClick={() => setActiveTool('word')} />
                  </>
                )}
                {activeCategory === 'optimizar' && (
                  <>
                    <ToolCard variants={itemVariants} icon={<ShieldCheck className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={t.tools.protect.title} description={t.tools.protect.desc} onClick={() => setActiveTool('proteger')} />
                    <ToolCard variants={itemVariants} icon={<Zap className="w-6 h-6 text-slate-500" strokeWidth={1.5} />} title={isEs ? 'Comprimir PDF' : 'Compress PDF'} description={isEs ? 'Reduce el peso de tu PDF sin perder calidad.' : 'Reduce the weight of your PDF without losing quality.'} onClick={() => {}} isComingSoon soonText={isEs ? 'Pronto' : 'Soon'} />
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTool && (
            <motion.div key="tool" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="flex-1 w-full relative z-10">
              {activeTool === 'unir' && <PdfUploader />}
              {activeTool === 'dividir' && <PdfSplitter />}
              {activeTool === 'foliar' && <PdfFoliador />}
              {activeTool === 'ordenar' && <PdfOrganizer />}
              {activeTool === 'proteger' && <PdfProtector />}
              {activeTool === 'rotar' && <PdfRotator />}
              {activeTool === 'editor' && <PdfEditor />}
              {activeTool === 'word' && <PdfToWord />}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ==========================================
          PIE DE PÁGINA OFICIAL (FOOTER)
      ========================================== */}
      <footer className="w-full border-t border-white/5 py-8 z-10 mt-auto bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-2">
            <Spade className="w-5 h-5 text-slate-500" fill="currentColor" />
            <span className="font-medium text-slate-400 text-sm">PDFBlack © {new Date().getFullYear()}</span>
          </div>

          <div className="flex gap-6">
            <button className="text-xs text-slate-500 hover:text-white transition-colors">API</button>
            <button className="text-xs text-slate-500 hover:text-white transition-colors">{isEs ? 'Privacidad' : 'Privacy'}</button>
            <button className="text-xs text-slate-500 hover:text-white transition-colors">{isEs ? 'Términos' : 'Terms'}</button>
          </div>

        </div>
      </footer>
    </div>
  );
}

// 🚀 COMPONENTE: MENÚ DESPLEGABLE DEL HEADER
function DropdownMenu({ title, category, navigate, t, isEs, setActiveTool }: any) {
  return (
    <div className="relative group">
      <button onClick={() => navigate(category)} className="flex items-center gap-1 py-6 outline-none">
        <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-black text-[15px] tracking-wide drop-shadow-sm group-hover:from-white group-hover:via-white group-hover:to-slate-200 transition-all">
          {title}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-white" />
      </button>
      
      <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50">
        <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
          {category === 'editar' && (
            <>
              <button onClick={() => { navigate('editar'); setActiveTool('editor'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.edit.title}</button>
              <button onClick={() => { navigate('editar'); setActiveTool('foliar'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.number.title}</button>
            </>
          )}
          {category === 'organizar' && (
            <>
              <button onClick={() => { navigate('organizar'); setActiveTool('ordenar'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.organize.title}</button>
              <button onClick={() => { navigate('organizar'); setActiveTool('unir'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.merge.title}</button>
              <button onClick={() => { navigate('organizar'); setActiveTool('dividir'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.split.title}</button>
              <button onClick={() => { navigate('organizar'); setActiveTool('rotar'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.rotate.title}</button>
            </>
          )}
          {category === 'convertir' && (
            <>
              <button onClick={() => { navigate('convertir'); setActiveTool('word'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.word.title}</button>
            </>
          )}
          {category === 'optimizar' && (
            <>
              <button onClick={() => { navigate('optimizar'); setActiveTool('proteger'); }} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">{t.tools.protect.title}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 🔥 2. y 4. TARJETAS PREMIUM CON MICRO-INTERACCIONES (Hover, Sombra, Escala de Ícono)
function CategoryCard({ icon, title, desc, onClick, variants }: any) {
  return (
    <motion.button 
      variants={variants}
      whileHover={{ 
        y: -4, 
        borderColor: 'rgba(59, 130, 246, 0.4)', 
        boxShadow: '0 12px 30px -10px rgba(59, 130, 246, 0.25)',
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col items-start p-6 sm:p-8 bg-[#121212] rounded-3xl border border-white/10 shadow-xl text-left w-full outline-none overflow-hidden"
    >
      <motion.div 
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-20 bg-slate-900 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 shadow-sm border border-slate-800 group-hover:border-slate-700 transition-colors"
      >
        {icon}
      </motion.div>
      <h2 className="relative z-20 text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{title}</h2>
      <p className="relative z-20 text-[#A1A1AA] font-medium leading-relaxed text-xs sm:text-sm">{desc}</p>
    </motion.button>
  );
}

function ToolCard({ icon, title, description, onClick, isComingSoon = false, soonText = 'Pronto', variants }: any) {
  return (
    <motion.div 
      variants={variants} 
      whileHover={!isComingSoon ? { 
        y: -4, 
        borderColor: 'rgba(59, 130, 246, 0.4)', 
        boxShadow: '0 12px 30px -10px rgba(59, 130, 246, 0.25)',
        transition: { duration: 0.3, ease: "easeInOut" }
      } : {}} 
      whileTap={!isComingSoon ? { scale: 0.98 } : {}} 
      onClick={!isComingSoon ? onClick : undefined} 
      className={`relative bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-lg flex flex-col items-start text-left w-full ${isComingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {isComingSoon && <span className="absolute top-5 right-5 bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{soonText}</span>}
      <motion.div 
        whileHover={!isComingSoon ? { scale: 1.08 } : {}}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-slate-900 p-3 rounded-xl mb-5 border border-slate-800 group-hover:border-slate-700 transition-colors"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-[#A1A1AA] text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}