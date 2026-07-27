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
    <div className="flex min-h-screen flex-col transition-colors duration-700 selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden font-sans text-slate-200 bg-black">
      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* ENCABEZADO GLOBAL SAAS */}
      <header className="w-full bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 transition-all duration-500">
        {/* AÑADIDO: gap-4 para que los 3 bloques principales nunca se toquen */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-10">
          
          {/* AÑADIDO: flex-shrink-0 para que el logo no se aplaste */}
          <Link href="/" className="flex-shrink-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-3 cursor-pointer group">
              <div className="bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 p-2.5 rounded-xl shadow-lg transition-all">
                <Spade className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-3xl tracking-tight text-white font-light whitespace-nowrap">
                PDF<span className="font-black">Black</span>
              </span>
            </motion.div>
          </Link>

          {/* AÑADIDO: gap-4 xl:gap-8 para que sea responsivo en laptops */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8">
            <DropdownMenu 
              title={isEs ? 'Editar PDF' : 'Edit PDF'} 
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
              title={isEs ? 'Organizar PDF' : 'Organize PDF'} 
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
              title={isEs ? 'Convertir PDF' : 'Convert PDF'} 
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
              title={isEs ? 'Optimizar PDF' : 'Optimize PDF'} 
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

          {/* AÑADIDO: flex-shrink-0 para que los botones de la derecha no se aplasten */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            
            <AnimatePresence mode="wait">
              {!isHome && (
                <Link href="/">
                  <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 px-4 py-2 rounded-lg transition-all backdrop-blur-md border border-white/5 hover:border-white/10 whitespace-nowrap">
                    <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver al Inicio' : 'Back to Home'}
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>

            {/* MOSTRAR BOTÓN 'NUEVO' SOLO EN LA PÁGINA INICIAL Y OCULTARLO EN LAS SUBPÁGINAS */}
            {isHome && (
              <div className="relative group cursor-pointer hidden sm:block">
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black px-4 py-2 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> {isEs ? 'Nuevo' : 'New'}
                </motion.button>
                
                <div className="absolute right-0 top-10 pt-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                  <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isEs ? 'Selecciona una acción' : 'Select an action'}</p>
                    </div>
                    <Link href="/editar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-500/10 rounded-lg group/item transition-colors">
                      <Edit3 className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-slate-300 group-hover/item:text-blue-400">{isEs ? 'Editar PDF' : 'Edit PDF'}</span>
                    </Link>
                    <Link href="/organizar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-500/10 rounded-lg group/item transition-colors">
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300 group-hover/item:text-emerald-400">{isEs ? 'Organizar PDF' : 'Organize PDF'}</span>
                    </Link>
                    <Link href="/convertir" className="flex items-center gap-3 px-3 py-2.5 hover:bg-orange-500/10 rounded-lg group/item transition-colors">
                      <RefreshCw className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-slate-300 group-hover/item:text-orange-400">{isEs ? 'Convertir PDF' : 'Convert PDF'}</span>
                    </Link>
                    <Link href="/optimizar" className="flex items-center gap-3 px-3 py-2.5 hover:bg-purple-500/10 rounded-lg group/item transition-colors">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-slate-300 group-hover/item:text-purple-400">{isEs ? 'Optimizar PDF' : 'Optimize PDF'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <motion.button onClick={toggleLanguage} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-full font-semibold text-xs transition-all border border-white/5 flex-shrink-0">
              <Globe className="w-4 h-4" /> {lang === 'es' ? 'EN' : 'ES'}
            </motion.button>

            <div className="relative group cursor-pointer flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 p-[2px]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">JD</span>
                </div>
              </div>
              <div className="absolute right-0 top-10 pt-4 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-sm font-bold text-white">John Doe</p>
                    <p className="text-xs text-gray-500">Plan Gratuito</p>
                  </div>
                  <button className="flex items-center gap-2 text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><Settings className="w-4 h-4"/> Configuración</button>
                  <button className="flex items-center gap-2 text-left px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"><LogOut className="w-4 h-4"/> Cerrar Sesión</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[100%] mx-auto flex flex-col z-10 relative">
        {children}
      </main>

      <footer className="w-full border-t border-white/5 py-8 z-10 mt-auto bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Spade className="w-5 h-5 text-slate-500" fill="currentColor" />
            <span className="font-medium text-slate-400 text-sm">PDFBlack © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isEs ? 'Procesamiento 100% Local & Privado en tu Navegador' : '100% Local & Private Browser Processing'}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacidad" className="text-slate-400 hover:text-white transition-colors font-medium">
              {isEs ? 'Privacidad' : 'Privacy'}
            </Link>
            <Link href="/terminos" className="text-slate-400 hover:text-white transition-colors font-medium">
              {isEs ? 'Términos' : 'Terms'}
            </Link>
            <Link href="/faq" className="text-slate-400 hover:text-white transition-colors font-medium">
              {isEs ? 'FAQ' : 'FAQ'}
            </Link>
            <Link href="/contacto" className="text-slate-400 hover:text-white transition-colors font-medium">
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
      <Link href={basePath} className="flex items-center gap-1 py-6 outline-none">
        {/* AÑADIDO: whitespace-nowrap AQUÍ ES LA CLAVE PARA QUE NO SE ROMPA EL TEXTO */}
        <span className={`
          whitespace-nowrap font-black text-[15px] tracking-wide drop-shadow-sm transition-all
          ${isActive ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent' : 'bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent group-hover:from-white group-hover:via-white group-hover:to-slate-200'}
        `}>
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-180 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`} />
      </Link>
      
      <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50">
        <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
          {items.map((item: any) => {
            const isItemActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isItemActive ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}