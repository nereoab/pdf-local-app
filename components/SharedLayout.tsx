'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Globe, ArrowLeft, ShieldCheck, Spade, ChevronDown, User, LogOut, Sun, Moon } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import AuthModal from './AuthModal';
import CookieConsent from './CookieConsent';
import Breadcrumbs from './Breadcrumbs';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const pathname = usePathname();
  const isEs = lang === 'es';
  const isZh = lang === 'zh';
  const isHome = pathname === '/';
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { currentUser, logout, hydrate: hydrateAuth, isHydrated } = useAuthStore();
  const isHeaderHidden = useUIStore((s) => s.isHeaderHidden);
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  useEffect(() => {
    setHeaderHidden(false);
  }, [pathname, setHeaderHidden]);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (!currentUser) return '';
    const parts = currentUser.email.split('@')[0].split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return currentUser.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen flex-col transition-colors duration-500 selection:bg-foreground/20 selection:text-foreground relative overflow-x-hidden font-sans text-foreground bg-background">
      <Toaster position="bottom-right" richColors closeButton theme={theme === 'dark' ? 'dark' : 'light'} />

      {/* ENCABEZADO CONTENT ARCHITECTURE STYLING */}
      {!isHeaderHidden && (
        <header className="w-full bg-background/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 sticky top-0 z-50 transition-all duration-300" role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-10">
            
            {/* LOGO TECHNICAL - AS DE ESPADAS */}
            <Link href="/" className="flex-shrink-0" aria-label={isEs ? 'PDFBlack — Ir al inicio' : 'PDFBlack — Go to homepage'}>
              <motion.div whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-3 cursor-pointer group">
                <div className="bg-zinc-800 dark:bg-white text-white dark:text-black p-2 rounded-xl flex items-center justify-center shadow-md border border-white/20" aria-hidden="true">
                  <Spade className="w-5 h-5 text-white dark:text-black fill-current" />
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-base tracking-tight text-zinc-900 dark:text-white font-bold">
                    PDF<span className="text-zinc-500 dark:text-zinc-400 font-light">BLACK</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium hidden sm:inline-block" aria-label="Versión 2.0">
                    v2.0
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* MENÚ DE NAVEGACIÓN */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 font-mono text-xs" aria-label={isZh ? '主导航' : isEs ? 'Navegación principal' : 'Main navigation'}>
              <DropdownMenu 
                title={isZh ? '01 / 编辑' : isEs ? '01 / EDITAR' : '01 / EDIT'} 
                basePath="/editar" 
                items={[
                  { label: isZh ? '编辑文本与图片' : isEs ? 'Editar Texto e Imágenes' : 'Edit Text & Images', path: '/editar?tool=texto' },
                  { label: isZh ? '添加页码' : isEs ? 'Poner Números a Páginas (Foliado)' : 'Add Page Numbers', path: '/editar?tool=foliado' },
                  { label: isZh ? '添加水印' : isEs ? 'Poner Sello de Agua' : 'Add Watermark', path: '/editar?tool=poner-marca-agua' },
                  { label: isZh ? '移除水印' : isEs ? 'Quitar Sello de Agua' : 'Remove Watermark', path: '/editar?tool=quitar-marca-agua' },
                  { label: isZh ? 'PDF 签名' : isEs ? 'Firmar PDF' : 'Sign PDF', path: '/editar?tool=firmar' },
                  { label: isZh ? 'OCR 文字识别' : isEs ? 'OCR PDF (Texto Seleccionable)' : 'OCR PDF (Searchable Text)', path: '/editar?tool=ocr' }
                ]} 
              />
              <DropdownMenu 
                title={isZh ? '02 / 排列' : isEs ? '02 / ORGANIZAR' : '02 / ORGANIZE'} 
                basePath="/organizar" 
                items={[
                  { label: isZh ? '合并 PDF' : isEs ? 'Unir PDF' : 'Merge PDF', path: '/organizar?tool=unir' },
                  { label: isZh ? '拆分 PDF' : isEs ? 'Dividir PDF' : 'Split PDF', path: '/organizar?tool=dividir' },
                  { label: isZh ? '删除页面' : isEs ? 'Eliminar Páginas' : 'Delete Pages', path: '/organizar?tool=eliminar' },
                  { label: isZh ? '重新排序' : isEs ? 'Ordenar PDF' : 'Reorder PDF', path: '/organizar?tool=reordenar' },
                  { label: isZh ? '旋转 PDF' : isEs ? 'Rotar PDF' : 'Rotate PDF', path: '/organizar?tool=rotar' },
                  { label: isZh ? '裁剪 PDF' : isEs ? 'Recortar PDF' : 'Crop PDF', path: '/organizar?tool=recortar' }
                ]} 
              />
              <DropdownMenu 
                title={isZh ? '03 / 转换' : isEs ? '03 / CONVERTIR' : '03 / CONVERT'} 
                basePath="/convertir" 
                items={[
                  { label: 'PDF ↔ Word', path: '/convertir?tool=pdf-word' },
                  { label: 'PDF ↔ Excel', path: '/convertir?tool=pdf-excel' },
                  { label: 'PDF ↔ PowerPoint', path: '/convertir?tool=pdf-powerpoint' },
                  { label: isZh ? 'PDF ↔ JPG / 图片' : isEs ? 'PDF ↔ JPG / Imagen' : 'PDF ↔ JPG / Image', path: '/convertir?tool=pdf-jpg' },
                  { label: 'PDF ↔ HTML', path: '/convertir?tool=pdf-html' },
                  { label: isZh ? 'PDF ↔ 纯文本' : isEs ? 'PDF ↔ Texto' : 'PDF ↔ Text', path: '/convertir?tool=pdf-texto' }
                ]} 
              />
              <DropdownMenu 
                title={isZh ? '04 / 优化' : isEs ? '04 / OPTIMIZAR' : '04 / OPTIMIZE'} 
                basePath="/optimizar" 
                items={[
                  { label: isZh ? '压缩 PDF' : isEs ? 'Comprimir PDF' : 'Compress PDF', path: '/optimizar?tool=comprimir' },
                  { label: isZh ? '修复 PDF' : isEs ? 'Reparar PDF' : 'Repair PDF', path: '/optimizar?tool=reparar' },
                  { label: isZh ? '解密 PDF' : isEs ? 'Desbloquear PDF' : 'Unlock PDF', path: '/optimizar?tool=desbloquear' },
                  { label: isZh ? '加密 PDF' : isEs ? 'Proteger PDF' : 'Protect PDF', path: '/optimizar?tool=proteger' },
                  { label: isZh ? '涂黑遮蔽' : isEs ? 'Censurar PDF' : 'Redact PDF', path: '/optimizar?tool=censurar' },
                  { label: isZh ? '对比 PDF' : isEs ? 'Comparar PDF' : 'Compare PDF', path: '/optimizar?tool=comparar' }
                ]} 
              />
            </nav>

            {/* ACCIONES DERECHA */}
            <div className="flex items-center gap-3 font-mono" role="toolbar" aria-label={isEs ? 'Acciones de usuario' : 'User actions'}>
              
              <AnimatePresence mode="wait">
                {!isHome && (
                  <Link key="home-nav-link" href="/">
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="hidden sm:flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap"
                      aria-label={isEs ? 'Volver al inicio' : 'Back to home'}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {isEs ? 'INICIO' : 'HOME'}
                    </motion.button>
                  </Link>
                )}
              </AnimatePresence>



              <motion.button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full text-xs font-mono transition-all border border-zinc-200 dark:border-white/10 flex-shrink-0 cursor-pointer"
                aria-label="Cambiar idioma / Switch language / 切换语言"
                title="Español / English / 中文"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                {lang === 'es' ? 'ES' : lang === 'en' ? 'EN' : '中文'}
              </motion.button>

              {/* TEMA — Toggle oscuro/claro */}
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-lg transition-all border border-zinc-200 dark:border-white/10 flex-shrink-0"
                aria-label={isEs ? 'Cambiar tema' : 'Toggle theme'}
                title={isEs ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : (theme === 'dark' ? 'Light mode' : 'Dark mode')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.button>

              {/* BOTÓN DE REGISTRO / CUENTA */}
              {isHydrated && currentUser ? (
                <div className="relative group cursor-pointer flex-shrink-0">
                  <button
                    onClick={() => {
                      const confirmed = confirm(isEs
                        ? `¿Cerrar sesión de ${currentUser.email}?`
                        : `Log out from ${currentUser.email}?`);
                      if (confirmed) logout();
                    }}
                    className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/30 px-3 py-1.5 rounded-full text-xs font-mono transition-all group"
                    aria-label={isEs ? `Cerrar sesión de ${currentUser.email}` : `Log out from ${currentUser.email}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/20 text-zinc-600 dark:text-white flex items-center justify-center font-mono text-[10px] font-bold" aria-hidden="true">
                      {getUserInitials()}
                    </div>
                    <span className="text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white hidden sm:inline-block max-w-[100px] truncate">
                      {currentUser.email.split('@')[0]}
                    </span>
                    <LogOut className="w-3 h-3 text-zinc-500 dark:text-zinc-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full font-sans font-semibold text-xs transition-all shadow-md whitespace-nowrap flex-shrink-0 cursor-pointer"
                  aria-label={isEs ? 'Abrir formulario de registro' : 'Open sign up form'}
                >
                  <User className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                  {isEs ? 'REGISTRARSE' : 'SIGN UP'}
                </motion.button>
              )}

            </div>
          </div>
        </header>
      )}

      {/* MODAL DE AUTENTICACIÓN */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* BREADCRUMBS — Navegación jerárquica */}
      {!isHeaderHidden && <Breadcrumbs />}

      <main className="flex-1 w-full max-w-[100%] mx-auto flex flex-col z-10 relative" id="main-content" tabIndex={-1}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>

      {/* BANNER DE COOKIES — GDPR/ePrivacy Compliance */}
      <CookieConsent />

      <footer className="w-full border-t border-zinc-200 dark:border-white/10 py-10 z-10 mt-auto bg-background" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Spade className="w-4 h-4 text-zinc-700 dark:text-white" fill="currentColor" aria-hidden="true" />
            <span className="text-zinc-500 dark:text-zinc-400">PDFBLACK © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>{isEs ? 'MOTOR: PROCESAMIENTO 100% LOCAL EN NAVEGADOR' : 'ENGINE: 100% LOCAL BROWSER PROCESSING'}</span>
          </div>

          <nav className="flex items-center gap-5 text-zinc-400" aria-label={isEs ? 'Enlaces legales' : 'Legal links'}>
            <Link href="/privacidad" className="hover:text-zinc-700 dark:hover:text-white transition-colors">
              {isEs ? 'Privacidad' : 'Privacy'}
            </Link>
            <Link href="/terminos" className="hover:text-zinc-700 dark:hover:text-white transition-colors">
              {isEs ? 'Términos' : 'Terms'}
            </Link>
            <Link href="/faq" className="hover:text-zinc-700 dark:hover:text-white transition-colors">
              {isEs ? 'FAQ' : 'FAQ'}
            </Link>
            <Link href="/contacto" className="hover:text-zinc-700 dark:hover:text-white transition-colors">
              {isEs ? 'Contacto' : 'Contact'}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

interface DropdownItem {
  path: string;
  label: string;
}

function DropdownMenu({ title, basePath, items }: { title: string; basePath: string; items: DropdownItem[] }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(basePath);

  return (
    <div className="relative group">
      <Link href={basePath} className="flex items-center gap-1 py-5 outline-none" aria-haspopup="true" aria-expanded={undefined}>
        <span className={`
          whitespace-nowrap transition-colors
          ${isActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}
        `}>
          {title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 flex-shrink-0 ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} aria-hidden="true" />
      </Link>
      
      <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50" role="menu" aria-label={title}>
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-xl p-1.5 flex flex-col gap-0.5 shadow-2xl">
          {items.map((item, idx) => {
            const isItemActive = pathname === item.path;
            return (
              <Link key={`${item.path}-${idx}`} href={item.path} className={`text-left px-3 py-2 text-xs font-mono transition-colors rounded-lg ${isItemActive ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`} role="menuitem">
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}