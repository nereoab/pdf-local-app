'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowLeft, ShieldCheck, Spade, Plus, Settings, LogOut, Edit3, FolderOpen, RefreshCw, Zap, ChevronDown } from 'lucide-react';
import { Toaster } from 'sonner';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const isEs = lang === 'es';
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col transition-colors duration-500 selection:bg-white/20 selection:text-white relative overflow-x-hidden font-sans text-white bg-[#09090b]">
      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* ENCABEZADO CONTENT ARCHITECTURE STYLING */}
      <header className="w-full bg-[#09090b]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-10">
          
          {/* LOGO TECHNICAL - AS DE ESPADAS */}
          <Link href="/" className="flex-shrink-0">
            <motion.div whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-3 cursor-pointer group">
              <div className="bg-white text-black p-2 rounded-xl flex items-center justify-center shadow-md border border-white/20">
                <Spade className="w-5 h-5 text-black fill-black" />
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-base tracking-tight text-white font-bold">
                  PDF<span className="text-zinc-400 font-light">BLACK</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-medium hidden sm:inline-block">
                  v2.0
                </span>
              </div>
            </motion.div>
          </Link>

          {/* MENÚ DE NAVEGACIÓN */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-mono text-xs">
            <DropdownMenu 
              title={isEs ? '01 / EDITAR' : '01 / EDIT'} 
              basePath="/editar" 
              items={[
                { label: isEs ? 'Editar Texto e Imágenes' : 'Edit Text & Images', path: '/editar?tool=texto' },
                { label: isEs ? 'Poner Números a Páginas (Foliado)' : 'Add Page Numbers', path: '/editar?tool=foliado' },
                { label: isEs ? 'Poner Sello de Agua' : 'Add Watermark', path: '/editar?tool=poner-marca-agua' },
                { label: isEs ? 'Quitar Sello de Agua' : 'Remove Watermark', path: '/editar?tool=quitar-marca-agua' },
                { label: isEs ? 'Firmar PDF' : 'Sign PDF', path: '/editar?tool=firmar' },
                { label: isEs ? 'OCR PDF (Texto Seleccionable)' : 'OCR PDF (Searchable Text)', path: '/editar?tool=ocr' }
              ]} 
            />
            <DropdownMenu 
              title={isEs ? '02 / ORGANIZAR' : '02 / ORGANIZE'} 
              basePath="/organizar" 
              items={[
                { label: isEs ? 'Unir PDF' : 'Merge PDF', path: '/organizar?tool=unir' },
                { label: isEs ? 'Dividir PDF' : 'Split PDF', path: '/organizar?tool=dividir' },
                { label: isEs ? 'Eliminar Páginas' : 'Delete Pages', path: '/organizar?tool=eliminar' },
                { label: isEs ? 'Ordenar PDF' : 'Reorder PDF', path: '/organizar?tool=reordenar' },
                { label: isEs ? 'Rotar PDF' : 'Rotate PDF', path: '/organizar?tool=rotar' },
                { label: isEs ? 'Recortar PDF' : 'Crop PDF', path: '/organizar?tool=recortar' }
              ]} 
            />
            <DropdownMenu 
              title={isEs ? '03 / CONVERTIR' : '03 / CONVERT'} 
              basePath="/convertir" 
              items={[
                { label: isEs ? 'PDF ↔ Word' : 'PDF ↔ Word', path: '/convertir?tool=pdf-word' },
                { label: isEs ? 'PDF ↔ Excel' : 'PDF ↔ Excel', path: '/convertir?tool=pdf-excel' },
                { label: isEs ? 'PDF ↔ PowerPoint' : 'PDF ↔ PowerPoint', path: '/convertir?tool=pdf-powerpoint' },
                { label: isEs ? 'PDF ↔ JPG / Imagen' : 'PDF ↔ JPG / Image', path: '/convertir?tool=pdf-jpg' },
                { label: isEs ? 'PDF ↔ HTML' : 'PDF ↔ HTML', path: '/convertir?tool=pdf-html' },
                { label: isEs ? 'PDF ↔ Texto' : 'PDF ↔ Text', path: '/convertir?tool=pdf-texto' }
              ]} 
            />
            <DropdownMenu 
              title={isEs ? '04 / OPTIMIZAR' : '04 / OPTIMIZE'} 
              basePath="/optimizar" 
              items={[
                { label: isEs ? 'Comprimir PDF' : 'Compress PDF', path: '/optimizar?tool=comprimir' },
                { label: isEs ? 'Reparar PDF' : 'Repair PDF', path: '/optimizar?tool=reparar' },
                { label: isEs ? 'Desbloquear PDF' : 'Unlock PDF', path: '/optimizar?tool=desbloquear' },
                { label: isEs ? 'Proteger PDF' : 'Protect PDF', path: '/optimizar?tool=proteger' },
                { label: isEs ? 'Censurar PDF' : 'Redact PDF', path: '/optimizar?tool=censurar' },
                { label: isEs ? 'Comparar PDF' : 'Compare PDF', path: '/optimizar?tool=comparar' }
              ]} 
            />
          </div>

          {/* ACCIONES DERECHA */}
          <div className="flex items-center gap-3 font-mono">
            
            <AnimatePresence mode="wait">
              {!isHome && (
                <Link href="/">
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:flex items-center gap-2 text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap">
                    <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? 'INICIO' : 'HOME'}
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>

            {/* BOTÓN BLANCO TIPO CONTENT ARCHITECTURE (GET ACCESS / NUEVO) */}
            {isHome && (
              <div className="relative group cursor-pointer hidden sm:block">
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full font-sans font-semibold text-xs transition-all shadow-md whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-black" /> {isEs ? 'NUEVO ARCHIVO' : 'NEW FILE'}
                </motion.button>
                
                <div className="absolute right-0 top-9 pt-3 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                  <div className="bg-[#09090b] border border-white/10 rounded-xl p-2 flex flex-col gap-1 shadow-2xl">
                    <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{isEs ? 'ACCIONES RÁPIDAS' : 'QUICK ACTIONS'}</p>
                    </div>
                    <Link href="/editar" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg group/item transition-colors">
                      <Edit3 className="w-4 h-4 text-zinc-400 group-hover/item:text-white" />
                      <span className="text-xs font-mono text-zinc-300 group-hover/item:text-white">{isEs ? '01 / Editar PDF' : '01 / Edit PDF'}</span>
                    </Link>
                    <Link href="/organizar" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg group/item transition-colors">
                      <FolderOpen className="w-4 h-4 text-zinc-400 group-hover/item:text-white" />
                      <span className="text-xs font-mono text-zinc-300 group-hover/item:text-white">{isEs ? '02 / Organizar PDF' : '02 / Organize PDF'}</span>
                    </Link>
                    <Link href="/convertir" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg group/item transition-colors">
                      <RefreshCw className="w-4 h-4 text-zinc-400 group-hover/item:text-white" />
                      <span className="text-xs font-mono text-zinc-300 group-hover/item:text-white">{isEs ? '03 / Convertir PDF' : '03 / Convert PDF'}</span>
                    </Link>
                    <Link href="/optimizar" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg group/item transition-colors">
                      <Zap className="w-4 h-4 text-zinc-400 group-hover/item:text-white" />
                      <span className="text-xs font-mono text-zinc-300 group-hover/item:text-white">{isEs ? '04 / Optimizar PDF' : '04 / Optimize PDF'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <motion.button onClick={toggleLanguage} className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-mono transition-all border border-white/10 flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-zinc-400" /> {lang === 'es' ? 'EN' : 'ES'}
            </motion.button>

            <div className="relative group cursor-pointer flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 text-white flex items-center justify-center font-mono text-xs font-semibold">
                JD
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[100%] mx-auto flex flex-col z-10 relative">
        {children}
      </main>

      <footer className="w-full border-t border-white/10 py-10 z-10 mt-auto bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Spade className="w-4 h-4 text-white" fill="currentColor" />
            <span className="text-zinc-400">PDFBLACK © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? 'ENGINE: 100% LOCAL BROWSER PROCESSING' : 'ENGINE: 100% LOCAL BROWSER PROCESSING'}</span>
          </div>

          <div className="flex items-center gap-5 text-zinc-400">
            <Link href="/privacidad" className="hover:text-white transition-colors">
              {isEs ? 'Privacidad' : 'Privacy'}
            </Link>
            <Link href="/terminos" className="hover:text-white transition-colors">
              {isEs ? 'Términos' : 'Terms'}
            </Link>
            <Link href="/faq" className="hover:text-white transition-colors">
              {isEs ? 'FAQ' : 'FAQ'}
            </Link>
            <Link href="/contacto" className="hover:text-white transition-colors">
              {isEs ? 'Contacto' : 'Contact'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DropdownMenu({ title, basePath, items }: any) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(basePath);

  return (
    <div className="relative group">
      <Link href={basePath} className="flex items-center gap-1 py-5 outline-none">
        <span className={`
          whitespace-nowrap transition-colors
          ${isActive ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-white'}
        `}>
          {title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
      </Link>
      
      <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50">
        <div className="bg-[#09090b] border border-white/10 rounded-xl p-1.5 flex flex-col gap-0.5 shadow-2xl">
          {items.map((item: any) => {
            const isItemActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`text-left px-3 py-2 text-xs font-mono transition-colors rounded-lg ${isItemActive ? 'bg-white/10 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}