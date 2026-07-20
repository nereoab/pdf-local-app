'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowLeft, ShieldCheck, Layers, ChevronDown, Spade } from 'lucide-react';
import { Toaster } from 'sonner';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const isEs = lang === 'es';
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col transition-colors duration-700 selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden font-sans text-slate-200 bg-black">
      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* ENCABEZADO GLOBAL */}
      <header className="w-full bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          
          <Link href="/">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-3 cursor-pointer group">
              <div className="bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 p-2.5 rounded-xl shadow-lg transition-all">
                <Spade className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-3xl tracking-tight text-white font-light">
                PDF<span className="font-black">Black</span>
              </span>
            </motion.div>
          </Link>

          {/* MENÚS DESPLEGABLES CON RUTAS REALES */}
          <div className="hidden lg:flex items-center gap-8">
            <DropdownMenu 
              title={isEs ? 'Editar PDF' : 'Edit PDF'} basePath="/editar"
              items={[
                { label: t.tools.edit.title, path: '/editar/texto' },
                { label: t.tools.number.title, path: '/editar/foliar' }
              ]} 
            />
            <DropdownMenu 
              title={isEs ? 'Organizar PDF' : 'Organize PDF'} basePath="/organizar"
              items={[
                { label: t.tools.organize.title, path: '/organizar/ordenar' },
                { label: t.tools.merge.title, path: '/organizar/unir' },
                { label: t.tools.split.title, path: '/organizar/dividir' },
                { label: t.tools.rotate.title, path: '/organizar/rotar' }
              ]} 
            />
            <DropdownMenu 
              title={isEs ? 'Convertir PDF' : 'Convert PDF'} basePath="/convertir"
              items={[
                { label: 'Ver todos los conversores', path: '/convertir' }
              ]} 
            />
            <DropdownMenu 
              title={isEs ? 'Optimizar PDF' : 'Optimize PDF'} basePath="/optimizar"
              items={[
                { label: t.tools.protect.title, path: '/optimizar/proteger' }
              ]} 
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <AnimatePresence mode="wait">
              {!isHome && (
                <Link href="/">
                  <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 px-4 py-2 rounded-lg transition-all backdrop-blur-md border border-white/5 hover:border-white/10">
                    <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver al Inicio' : 'Back to Home'}
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleLanguage} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all backdrop-blur-md border border-white/5">
              <Globe className="w-4 h-4" />
              {lang === 'es' ? 'EN' : 'ES'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* CONTENIDO DINÁMICO DE CADA PÁGINA */}
      <main className="flex-1 w-full max-w-[100%] mx-auto flex flex-col z-10 relative">
        {children}
      </main>

      {/* PIE DE PÁGINA GLOBAL */}
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

function DropdownMenu({ title, basePath, items }: any) {
  return (
    <div className="relative group">
      <Link href={basePath} className="flex items-center gap-1 py-6 outline-none">
        <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-black text-[15px] tracking-wide drop-shadow-sm group-hover:from-white group-hover:via-white group-hover:to-slate-200 transition-all">
          {title}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-white" />
      </Link>
      <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50">
        <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
          {items.map((item: any) => (
            <Link key={item.path} href={item.path} className="text-left px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}