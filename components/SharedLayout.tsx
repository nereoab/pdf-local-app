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
    <div className="flex min-h-screen flex-col transition-colors duration-700 selection:bg-[#ff4d00]/30 selection:text-[#fff0e6] relative overflow-x-hidden font-sans text-[#fff0e6] bg-[#0a0400]">
      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* ENCABEZADO NEO-BRUTALIST */}
      <header className="w-full bg-[#0a0400]/95 backdrop-blur-2xl border-b border-[#fff0e6]/15 sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-10">
          
          {/* LOGO NEO-BRUTALIST */}
          <Link href="/" className="flex-shrink-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2.5 cursor-pointer group">
              <div className="bg-[#fff0e6] text-[#0a0400] border border-[#fff0e6] p-2 rounded-lg transition-transform group-hover:rotate-6">
                <Spade className="w-4 h-4" fill="currentColor" />
              </div>
              <span className="text-xl tracking-wider text-[#fff0e6] font-black uppercase">
                THE NC-PDF
              </span>
            </motion.div>
          </Link>

          {/* MENÚ DE NAVEGACIÓN */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8">
            <DropdownMenu 
              title={isEs ? 'EDITAR PDF' : 'EDIT PDF'} 
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
              title={isEs ? 'ORGANIZAR PDF' : 'ORGANIZE PDF'} 
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
              title={isEs ? 'CONVERTIR PDF' : 'CONVERT PDF'} 
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
              title={isEs ? 'OPTIMIZAR PDF' : 'OPTIMIZE PDF'} 
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

          {/* ACCIONES DE LA DERECHA */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            
            <AnimatePresence mode="wait">
              {!isHome && (
                <Link href="/">
                  <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="hidden sm:flex items-center gap-2 text-xs font-black uppercase text-[#fff0e6] hover:text-[#0a0400] bg-[#fff0e6]/10 hover:bg-[#fff0e6] px-4 py-2 rounded-none transition-all border border-[#fff0e6]/20 whitespace-nowrap">
                    <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? 'INICIO' : 'HOME'}
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>

            {/* BOTÓN NUEVO CON ESTILO NARANJA ELÉCTRICO */}
            {isHome && (
              <div className="relative group cursor-pointer hidden sm:block">
                <motion.button 
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-[#ff4d00] hover:bg-[#fff0e6] text-[#fff0e6] hover:text-[#0a0400] border border-[#ff4d00] px-4 py-2 rounded-none font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> {isEs ? 'NUEVO' : 'NEW'}
                </motion.button>
                
                <div className="absolute right-0 top-10 pt-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                  <div className="bg-[#0a0400] border border-[#fff0e6]/30 p-2 flex flex-col gap-1 shadow-2xl">
                    <div className="px-3 py-2 border-b border-[#fff0e6]/15 mb-1">
                      <p className="text-[10px] font-black text-[#ff4d00] uppercase tracking-widest">{isEs ? 'ACCIONES RÁPIDAS' : 'QUICK ACTIONS'}</p>
                    </div>
                    <Link href="/editar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#ff4d00] hover:text-[#0a0400] group/item transition-colors">
                      <Edit3 className="w-4 h-4 text-[#ff4d00] group-hover/item:text-[#0a0400]" />
                      <span className="text-xs font-black uppercase text-[#fff0e6] group-hover/item:text-[#0a0400]">{isEs ? 'Editar PDF' : 'Edit PDF'}</span>
                    </Link>
                    <Link href="/organizar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#ff4d00] hover:text-[#0a0400] group/item transition-colors">
                      <FolderOpen className="w-4 h-4 text-[#ff4d00] group-hover/item:text-[#0a0400]" />
                      <span className="text-xs font-black uppercase text-[#fff0e6] group-hover/item:text-[#0a0400]">{isEs ? 'Organizar PDF' : 'Organize PDF'}</span>
                    </Link>
                    <Link href="/convertir" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#ff4d00] hover:text-[#0a0400] group/item transition-colors">
                      <RefreshCw className="w-4 h-4 text-[#ff4d00] group-hover/item:text-[#0a0400]" />
                      <span className="text-xs font-black uppercase text-[#fff0e6] group-hover/item:text-[#0a0400]">{isEs ? 'Convertir PDF' : 'Convert PDF'}</span>
                    </Link>
                    <Link href="/optimizar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#ff4d00] hover:text-[#0a0400] group/item transition-colors">
                      <Zap className="w-4 h-4 text-[#ff4d00] group-hover/item:text-[#0a0400]" />
                      <span className="text-xs font-black uppercase text-[#fff0e6] group-hover/item:text-[#0a0400]">{isEs ? 'Optimizar PDF' : 'Optimize PDF'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <motion.button onClick={toggleLanguage} className="flex items-center gap-2 bg-[#fff0e6]/5 hover:bg-[#fff0e6] text-[#fff0e6] hover:text-[#0a0400] px-3 py-2 rounded-none font-black text-xs tracking-wider transition-all border border-[#fff0e6]/15 flex-shrink-0 uppercase">
              <Globe className="w-3.5 h-3.5" /> {lang === 'es' ? 'EN' : 'ES'}
            </motion.button>

            <div className="relative group cursor-pointer flex-shrink-0">
              <div className="w-9 h-9 bg-[#ff4d00] text-[#0a0400] border border-[#ff4d00] flex items-center justify-center font-black text-xs">
                JD
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[100%] mx-auto flex flex-col z-10 relative">
        {children}
      </main>

      <footer className="w-full border-t border-[#fff0e6]/15 py-8 z-10 mt-auto bg-[#0a0400]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Spade className="w-4 h-4 text-[#ff4d00]" fill="currentColor" />
            <span className="font-black text-[#fff0e6]/60 text-xs uppercase tracking-widest">THE NC-PDF © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#ff4d00]" />
            <span>{isEs ? 'Procesamiento 100% Local & Privado' : '100% Local & Private Processing'}</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider">
            <Link href="/privacidad" className="text-[#fff0e6]/60 hover:text-[#ff4d00] transition-colors">
              {isEs ? 'Privacidad' : 'Privacy'}
            </Link>
            <Link href="/terminos" className="text-[#fff0e6]/60 hover:text-[#ff4d00] transition-colors">
              {isEs ? 'Términos' : 'Terms'}
            </Link>
            <Link href="/faq" className="text-[#fff0e6]/60 hover:text-[#ff4d00] transition-colors">
              {isEs ? 'FAQ' : 'FAQ'}
            </Link>
            <Link href="/contacto" className="text-[#fff0e6]/60 hover:text-[#ff4d00] transition-colors">
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
      <Link href={basePath} className="flex items-center gap-1.5 py-5 outline-none">
        <span className={`
          whitespace-nowrap font-black text-xs tracking-widest uppercase transition-all
          ${isActive ? 'text-[#ff4d00]' : 'text-[#fff0e6]/80 group-hover:text-[#ff4d00]'}
        `}>
          {title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 flex-shrink-0 ${isActive ? 'text-[#ff4d00]' : 'text-[#fff0e6]/60 group-hover:text-[#ff4d00]'}`} />
      </Link>
      
      <div className="absolute top-[58px] left-1/2 -translate-x-1/2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50">
        <div className="bg-[#0a0400] border border-[#fff0e6]/30 p-1.5 flex flex-col gap-0.5 shadow-2xl">
          {items.map((item: any) => {
            const isItemActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`text-left px-3 py-2 text-xs font-black uppercase transition-colors ${isItemActive ? 'bg-[#ff4d00] text-[#0a0400]' : 'text-[#fff0e6]/80 hover:bg-[#ff4d00] hover:text-[#0a0400]'}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}