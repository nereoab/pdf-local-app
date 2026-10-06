'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowLeft, ShieldCheck, Spade, ChevronDown, User, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import AuthModal from './AuthModal';
import CookieConsent from './CookieConsent';
import Breadcrumbs from './Breadcrumbs';
import {
  getEnglishUrlForSpanish,
  getSpanishUrlForEnglish,
  getPortugueseUrlForSpanish,
  getSpanishUrlForPortuguese,
  getLanguageSwitchUrl,
  getUrlForLanguage,
} from '@/lib/routes-config';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isEnRoute = pathname?.startsWith('/en');
  const isPtRoute = pathname?.startsWith('/pt');
  const isEs = !isEnRoute && !isPtRoute && lang === 'es';
  const isPt = isPtRoute || lang === 'pt';
  const isZh = lang === 'zh';
  const isHome = pathname === '/' || pathname === '/en' || pathname === '/es' || pathname === '/pt';
  const getNavUrl = (path: string) => {
    if (isPtRoute || lang === 'pt') return getPortugueseUrlForSpanish(path);
    if (isEnRoute || lang === 'en') return getEnglishUrlForSpanish(path);
    return path;
  };
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

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (pathname === '/' || pathname === '/en' || pathname === '/es' || pathname === '/pt') {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col selection:bg-white/20 selection:text-white relative overflow-x-hidden font-sans text-white bg-[#09090b]">
      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* ENCABEZADO CONTENT ARCHITECTURE STYLING */}
      {!isHeaderHidden && (
        <header
          className="w-full bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-50 transition-all duration-300"
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-10">
            {/* LOGO TECHNICAL - AS DE ESPADAS */}
            <Link
              href={isPtRoute ? '/pt' : isEnRoute ? '/en' : '/es'}
              onClick={handleLogoClick}
              className="flex-shrink-0"
              aria-label={
                isPt
                  ? 'PDFBlack — Ir para o início'
                  : isEs
                    ? 'PDFBlack — Ir al inicio'
                    : 'PDFBlack — Go to homepage'
              }
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className="bg-white text-black p-2 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.25)] border border-white group-hover:scale-105 transition-transform"
                  aria-hidden="true"
                >
                  <Spade className="w-5 h-5 text-black fill-current" />
                </div>
                <div className="flex items-center font-mono">
                  <span className="text-lg tracking-tight text-white font-black flex items-center">
                    PDF<span className="text-zinc-200 font-bold ml-0.5">BLACK</span>
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* MENÚ DE NAVEGACIÓN */}
            <nav
              className="hidden lg:flex items-center gap-4 xl:gap-6 font-mono text-xs"
              aria-label={
                isZh
                  ? '主导航'
                  : isPt
                    ? 'Navegação principal'
                    : isEs
                      ? 'Navegación principal'
                      : 'Main navigation'
              }
            >
              <DropdownMenu
                title={
                  isZh ? '01 / 编辑' : isPt ? '01 / EDITAR' : isEs ? '01 / EDITAR' : '01 / EDIT'
                }
                basePath="/editar"
                items={[
                  {
                    label: isZh
                      ? '编辑文本与图片'
                      : isPt
                        ? 'Editar Texto e Imagens'
                        : isEs
                          ? 'Editar Texto e Imágenes'
                          : 'Edit Text & Images',
                    path: '/editar/texto',
                  },
                  {
                    label: isZh
                      ? '添加页码'
                      : isPt
                        ? 'Numerar Páginas (Foliação)'
                        : isEs
                          ? 'Poner Números a Páginas (Foliado)'
                          : 'Add Page Numbers',
                    path: '/editar/foliar',
                  },
                  {
                    label: isZh
                      ? '添加水印'
                      : isPt
                        ? 'Marca-d’água no PDF'
                        : isEs
                          ? 'Poner Sello de Agua'
                          : 'Add Watermark',
                    path: '/editar/marca-agua',
                  },
                  {
                    label: isZh
                      ? '移除水印'
                      : isPt
                        ? 'Remover Marca-d’água'
                        : isEs
                          ? 'Quitar Sello de Agua'
                          : 'Remove Watermark',
                    path: '/editar/quitar-marca-agua',
                  },
                  {
                    label: isZh
                      ? 'PDF 签名'
                      : isPt
                        ? 'Assinar PDF Online'
                        : isEs
                          ? 'Firmar PDF'
                          : 'Sign PDF',
                    path: '/editar/firmar',
                  },
                  {
                    label: isZh
                      ? 'OCR 文字识别'
                      : isPt
                        ? 'OCR PDF (Texto Pesquisável)'
                        : isEs
                          ? 'OCR PDF (Texto Seleccionable)'
                          : 'OCR PDF (Searchable Text)',
                    path: '/editar/ocr',
                  },
                ]}
              />
              <DropdownMenu
                title={
                  isZh
                    ? '02 / 排列'
                    : isPt
                      ? '02 / ORGANIZAR'
                      : isEs
                        ? '02 / ORGANIZAR'
                        : '02 / ORGANIZE'
                }
                basePath="/organizar"
                items={[
                  {
                    label: isZh
                      ? '合并 PDF'
                      : isPt
                        ? 'Juntar PDF'
                        : isEs
                          ? 'Unir PDF'
                          : 'Merge PDF',
                    path: '/organizar/unir',
                  },
                  {
                    label: isZh
                      ? '拆分 PDF'
                      : isPt
                        ? 'Dividir PDF'
                        : isEs
                          ? 'Dividir PDF'
                          : 'Split PDF',
                    path: '/organizar/dividir',
                  },
                  {
                    label: isZh
                      ? '删除页面'
                      : isPt
                        ? 'Excluir Páginas'
                        : isEs
                          ? 'Eliminar Páginas'
                          : 'Delete Pages',
                    path: '/organizar/eliminar',
                  },
                  {
                    label: isZh
                      ? '重新排序'
                      : isPt
                        ? 'Organizar Páginas'
                        : isEs
                          ? 'Ordenar PDF'
                          : 'Reorder PDF',
                    path: '/organizar/reordenar',
                  },
                  {
                    label: isZh
                      ? '旋转 PDF'
                      : isPt
                        ? 'Girar PDF'
                        : isEs
                          ? 'Rotar PDF'
                          : 'Rotate PDF',
                    path: '/organizar/rotar',
                  },
                  {
                    label: isZh
                      ? '裁剪 PDF'
                      : isPt
                        ? 'Recortar PDF'
                        : isEs
                          ? 'Recortar PDF'
                          : 'Crop PDF',
                    path: '/organizar/recortar',
                  },
                ]}
              />
              <DropdownMenu
                title={
                  isZh
                    ? '03 / 转换'
                    : isPt
                      ? '03 / CONVERTER'
                      : isEs
                        ? '03 / CONVERTIR'
                        : '03 / CONVERT'
                }
                basePath="/convertir"
                items={[
                  { label: 'PDF ↔ Word', path: '/convertir/pdf-word' },
                  { label: 'PDF ↔ Excel', path: '/convertir/pdf-excel' },
                  { label: 'PDF ↔ PowerPoint', path: '/convertir/pdf-powerpoint' },
                  {
                    label: isZh
                      ? 'PDF ↔ JPG / 图片'
                      : isPt
                        ? 'PDF ↔ JPG / Imagem'
                        : isEs
                          ? 'PDF ↔ JPG / Imagen'
                          : 'PDF ↔ JPG / Image',
                    path: '/convertir/pdf-jpg',
                  },
                  {
                    label: isZh
                      ? 'PDF ↔ 黑白 / 灰度'
                      : isPt
                        ? 'PDF ↔ Preto e Branco'
                        : isEs
                          ? 'PDF ↔ Blanco y Negro'
                          : 'PDF ↔ Black & White',
                    path: '/convertir/pdf-blanco-negro',
                  },
                  {
                    label: isZh
                      ? 'PDF ↔ 纯文本'
                      : isPt
                        ? 'PDF ↔ Texto'
                        : isEs
                          ? 'PDF ↔ Texto'
                          : 'PDF ↔ Text',
                    path: '/convertir/pdf-texto',
                  },
                ]}
              />
              <DropdownMenu
                title={
                  isZh
                    ? '04 / 优化'
                    : isPt
                      ? '04 / OTIMIZAR'
                      : isEs
                        ? '04 / OPTIMIZAR'
                        : '04 / OPTIMIZE'
                }
                basePath="/optimizar"
                items={[
                  {
                    label: isZh
                      ? '压缩 PDF'
                      : isPt
                        ? 'Comprimir PDF'
                        : isEs
                          ? 'Comprimir PDF'
                          : 'Compress PDF',
                    path: '/optimizar/comprimir',
                  },
                  {
                    label: isZh
                      ? '修复 PDF'
                      : isPt
                        ? 'Reparar PDF'
                        : isEs
                          ? 'Reparar PDF'
                          : 'Repair PDF',
                    path: '/optimizar/reparar',
                  },
                  {
                    label: isZh
                      ? '解密 PDF'
                      : isPt
                        ? 'Desbloquear PDF'
                        : isEs
                          ? 'Desbloquear PDF'
                          : 'Unlock PDF',
                    path: '/optimizar/desbloquear',
                  },
                  {
                    label: isZh
                      ? '加密 PDF'
                      : isPt
                        ? 'Proteger PDF'
                        : isEs
                          ? 'Proteger PDF'
                          : 'Protect PDF',
                    path: '/optimizar/proteger',
                  },
                  {
                    label: isZh
                      ? '涂黑遮蔽'
                      : isPt
                        ? 'Ocultar Texto / Censurar'
                        : isEs
                          ? 'Censurar PDF'
                          : 'Redact PDF',
                    path: '/optimizar/censurar',
                  },
                  {
                    label: isZh
                      ? '对比 PDF'
                      : isPt
                        ? 'Comparar PDFs'
                        : isEs
                          ? 'Comparar PDF'
                          : 'Compare PDF',
                    path: '/optimizar/comparar',
                  },
                ]}
              />
            </nav>

            {/* ACCIONES DERECHA */}
            <div
              className="flex items-center gap-3 font-mono"
              role="toolbar"
              aria-label={isEs ? 'Acciones de usuario' : 'User actions'}
            >
              <AnimatePresence mode="wait">
                {!isHome && (
                  <Link key="home-nav-link" href={isPtRoute ? '/pt' : isEnRoute ? '/en' : '/'}>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                      aria-label={
                        isPt ? 'Voltar ao início' : isEs ? 'Volver al inicio' : 'Back to home'
                      }
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                      {isPt ? 'INÍCIO' : isEs ? 'INICIO' : 'HOME'}
                    </motion.button>
                  </Link>
                )}
              </AnimatePresence>

              {/* SELECTOR DE IDIOMA — SEGMENTED PILL [ ES | EN | PT ] */}
              <div
                className="flex items-center bg-zinc-900 border border-zinc-700 p-0.5 rounded-full font-mono text-xs flex-shrink-0 shadow-inner"
                role="group"
                aria-label={
                  isPt ? 'Selecionar idioma' : isEs ? 'Seleccionar idioma' : 'Select language'
                }
              >
                <button
                  onClick={() => {
                    setLang('es');
                    const target = getLanguageSwitchUrl(pathname || '/', 'es');
                    router.push(target);
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all text-xs font-bold cursor-pointer ${
                    !isEnRoute && !isPtRoute && lang === 'es'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                  aria-pressed={!isEnRoute && !isPtRoute && lang === 'es'}
                  title="Español"
                >
                  ES
                </button>
                <button
                  onClick={() => {
                    setLang('en');
                    const target = getLanguageSwitchUrl(pathname || '/', 'en');
                    router.push(target);
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all text-xs font-bold cursor-pointer ${
                    isEnRoute || lang === 'en'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                  aria-pressed={isEnRoute || lang === 'en'}
                  title="English"
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setLang('pt');
                    const target = getLanguageSwitchUrl(pathname || '/', 'pt');
                    router.push(target);
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all text-xs font-bold cursor-pointer ${
                    isPtRoute || lang === 'pt'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                  aria-pressed={isPtRoute || lang === 'pt'}
                  title="Português (Brasil)"
                >
                  PT
                </button>
              </div>

              {/* BOTÓN DE REGISTRO / CUENTA */}
              {isHydrated && currentUser ? (
                <div className="relative group cursor-pointer flex-shrink-0">
                  <button
                    onClick={() => {
                      const confirmed = confirm(
                        isEs
                          ? `¿Cerrar sesión de ${currentUser.email}?`
                          : `Log out from ${currentUser.email}?`,
                      );
                      if (confirmed) logout();
                    }}
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all group"
                    aria-label={
                      isEs
                        ? `Cerrar sesión de ${currentUser.email}`
                        : `Log out from ${currentUser.email}`
                    }
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white/20 border border-white/40 text-white flex items-center justify-center font-mono text-[10px] font-bold"
                      aria-hidden="true"
                    >
                      {getUserInitials()}
                    </div>
                    <span className="text-zinc-200 group-hover:text-white hidden sm:inline-block max-w-[100px] truncate font-medium">
                      {currentUser.email.split('@')[0]}
                    </span>
                    <LogOut
                      className="w-3 h-3 text-zinc-400 group-hover:text-red-400 transition-colors"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full font-sans font-bold text-xs transition-all shadow-md whitespace-nowrap flex-shrink-0 cursor-pointer"
                  aria-label={isEs ? 'Abrir formulario de registro' : 'Open sign up form'}
                >
                  <User className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                  {isEs ? 'REGISTRO' : 'SIGN UP'}
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

      <main
        className="flex-1 w-full max-w-[100%] mx-auto flex flex-col z-10 relative"
        id="main-content"
        tabIndex={-1}
      >
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

      <footer
        className="w-full border-t border-zinc-800 pt-12 pb-10 z-10 mt-auto bg-[#09090b]"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* SEO INTERNAL LINKING DIRECTORY GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 pb-12 border-b border-zinc-800/80 text-xs">
            {/* 01: EDITAR */}
            <div>
              <div className="font-mono font-bold text-white tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {isEs ? 'Editar PDF' : 'Edit PDF'}
              </div>
              <ul className="space-y-2 text-zinc-400 font-sans">
                <li>
                  <Link
                    href={getNavUrl('/editar/texto')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Editar Texto e Imágenes' : 'Edit Text & Images'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/editar/foliar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Foliar PDF (Páginas)' : 'Add Page Numbers'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/editar/marca-agua')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Poner Marca de Agua' : 'Add Watermark'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/editar/quitar-marca-agua')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Quitar Marca de Agua' : 'Remove Watermark'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/editar/firmar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Firmar PDF' : 'Sign PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/editar/ocr')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'OCR (Reconocer Texto)' : 'OCR Searchable PDF'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 02: ORGANIZAR */}
            <div>
              <div className="font-mono font-bold text-white tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {isEs ? 'Organizar PDF' : 'Organize PDF'}
              </div>
              <ul className="space-y-2 text-zinc-400 font-sans">
                <li>
                  <Link
                    href={getNavUrl('/organizar/unir')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Unir PDF' : 'Merge PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/organizar/dividir')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Dividir PDF' : 'Split PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/organizar/eliminar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Eliminar Páginas' : 'Delete Pages'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/organizar/reordenar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Ordenar Páginas' : 'Reorder Pages'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/organizar/rotar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Rotar PDF' : 'Rotate PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/organizar/recortar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Recortar PDF' : 'Crop PDF'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 03: OPTIMIZAR */}
            <div>
              <div className="font-mono font-bold text-white tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {isEs ? 'Optimizar PDF' : 'Optimize PDF'}
              </div>
              <ul className="space-y-2 text-zinc-400 font-sans">
                <li>
                  <Link
                    href={getNavUrl('/optimizar/comprimir')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Comprimir PDF' : 'Compress PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/optimizar/reparar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Reparar PDF' : 'Repair PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/optimizar/proteger')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Proteger PDF' : 'Protect PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/optimizar/desbloquear')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Desbloquear PDF' : 'Unlock PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/optimizar/censurar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Censurar PDF' : 'Redact PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/optimizar/comparar')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Comparar PDFs' : 'Compare PDFs'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 04: CONVERTIR A PDF */}
            <div>
              <div className="font-mono font-bold text-white tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {isEs ? 'Convertir a PDF' : 'Convert to PDF'}
              </div>
              <ul className="space-y-2 text-zinc-400 font-sans">
                <li>
                  <Link
                    href={getNavUrl('/convertir/word-pdf')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Word a PDF' : 'Word to PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/excel-pdf')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Excel a PDF' : 'Excel to PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/powerpoint-pdf')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PowerPoint a PDF' : 'PowerPoint to PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/jpg-pdf')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'JPG / Imagen a PDF' : 'JPG to PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/html-pdf')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'HTML a PDF' : 'HTML to PDF'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/texto-pdf')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'Texto TXT a PDF' : 'Text to PDF'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 05: CONVERTIR DESDE PDF */}
            <div>
              <div className="font-mono font-bold text-white tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {isEs ? 'Desde PDF' : 'From PDF'}
              </div>
              <ul className="space-y-2 text-zinc-400 font-sans">
                <li>
                  <Link
                    href={getNavUrl('/convertir/pdf-word')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PDF a Word (DOCX)' : 'PDF to Word'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/pdf-excel')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PDF a Excel (XLSX)' : 'PDF to Excel'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/pdf-powerpoint')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PDF a PowerPoint' : 'PDF to PowerPoint'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/pdf-jpg')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PDF a JPG / PNG' : 'PDF to JPG'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/pdf-blanco-negro')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PDF a Blanco y Negro' : 'PDF to Black & White'}
                  </Link>
                </li>
                <li>
                  <Link
                    href={getNavUrl('/convertir/pdf-texto')}
                    className="hover:text-white transition-colors"
                  >
                    {isEs ? 'PDF a Texto Plano' : 'PDF to Text'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* BARRA INFERIOR DE LEGALIDAD & COPYRIGHT */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs">
            <Link
              href={isPtRoute ? '/pt' : isEnRoute ? '/en' : '/'}
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              aria-label={
                isPt
                  ? 'PDFBlack — Ir para o início'
                  : isEs
                    ? 'PDFBlack — Ir al inicio'
                    : 'PDFBlack — Go to homepage'
              }
            >
              <Spade className="w-4 h-4 text-white" fill="currentColor" aria-hidden="true" />
              <span className="text-zinc-400 font-medium">
                PDFBLACK © {new Date().getFullYear()}
              </span>
            </Link>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              <span>
                {isPt
                  ? 'MOTOR: PROCESSAMENTO 100% LOCAL NO NAVEGADOR (LGPD)'
                  : isEs
                    ? 'MOTOR: PROCESAMIENTO 100% LOCAL EN NAVEGADOR'
                    : 'ENGINE: 100% LOCAL BROWSER PROCESSING'}
              </span>
            </div>

            <nav
              className="flex flex-wrap items-center gap-4 sm:gap-5 text-zinc-400"
              aria-label={
                isPt
                  ? 'Links legais e comparativas'
                  : isEs
                    ? 'Enlaces legales y comparativas'
                    : 'Legal and comparison links'
              }
            >
              <Link
                href={isEnRoute ? '/en/industries' : '/industrias'}
                className="hover:text-emerald-400 text-zinc-300 font-medium transition-colors"
              >
                {isPt ? 'Indústrias' : isEs ? 'Industrias' : 'Industries'}
              </Link>
              <Link
                href={isEnRoute ? '/en/glossary' : '/glosario'}
                className="hover:text-emerald-400 text-zinc-300 font-medium transition-colors"
              >
                {isPt ? 'Glossário Técnico' : isEs ? 'Glosario Técnico' : 'Technical Glossary'}
              </Link>
              <Link
                href={
                  isEnRoute ? '/en/compare/pdfblack-vs-ilovepdf' : '/comparar/pdfblack-vs-ilovepdf'
                }
                className="hover:text-emerald-400 text-zinc-300 font-medium transition-colors"
              >
                {isPt ? 'vs iLovePDF' : isEs ? 'vs iLovePDF' : 'vs iLovePDF'}
              </Link>
              <Link
                href={
                  isEnRoute ? '/en/compare/pdfblack-vs-smallpdf' : '/comparar/pdfblack-vs-smallpdf'
                }
                className="hover:text-emerald-400 text-zinc-300 font-medium transition-colors"
              >
                {isPt ? 'vs Smallpdf' : isEs ? 'vs Smallpdf' : 'vs Smallpdf'}
              </Link>
              <Link
                href={
                  isEnRoute
                    ? '/en/alternatives/private-ilovepdf-alternative'
                    : '/alternativas/alternativa-privada-a-ilovepdf'
                }
                className="hover:text-emerald-400 text-zinc-300 font-medium transition-colors"
              >
                {isPt
                  ? 'Alternativa Privada'
                  : isEs
                    ? 'Alternativa Privada'
                    : 'Private Alternative'}
              </Link>
              <Link
                href={isEnRoute ? '/en/privacy' : '/privacidad'}
                className="hover:text-white transition-colors"
              >
                {isPt ? 'Privacidade' : isEs ? 'Privacidad' : 'Privacy'}
              </Link>
              <Link
                href={isEnRoute ? '/en/terms' : '/terminos'}
                className="hover:text-white transition-colors"
              >
                {isPt ? 'Termos' : isEs ? 'Términos' : 'Terms'}
              </Link>
              <Link
                href={isEnRoute ? '/en/faq' : '/faq'}
                className="hover:text-white transition-colors"
              >
                {isPt ? 'FAQ' : isEs ? 'FAQ' : 'FAQ'}
              </Link>
              <Link
                href={isEnRoute ? '/en/contact' : '/contacto'}
                className="hover:text-white transition-colors"
              >
                {isPt ? 'Contato' : isEs ? 'Contacto' : 'Contact'}
              </Link>
              <Link
                href={isEnRoute ? '/en/legal-notice' : '/aviso-legal'}
                className="hover:text-white transition-colors"
              >
                {isPt ? 'Aviso Legal' : isEs ? 'Aviso Legal' : 'Legal Notice'}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface DropdownItem {
  path: string;
  label: string;
}

function DropdownMenu({
  title,
  basePath,
  items,
}: {
  title: string;
  basePath: string;
  items: DropdownItem[];
}) {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const isPt = pathname?.startsWith('/pt');
  const resolvedBasePath = isPt
    ? getPortugueseUrlForSpanish(basePath)
    : isEn
      ? getEnglishUrlForSpanish(basePath)
      : basePath;
  const isActive = pathname.startsWith(resolvedBasePath) || pathname.startsWith(basePath);

  return (
    <div className="relative group">
      <Link
        href={resolvedBasePath}
        className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-white/10 outline-none transition-colors"
        aria-haspopup="true"
        aria-expanded={undefined}
      >
        <span
          className={`
          whitespace-nowrap transition-colors text-xs font-bold tracking-wide
          ${isActive ? 'text-white' : 'text-zinc-200 group-hover:text-white'}
        `}
        >
          {title}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}
          aria-hidden="true"
        />
      </Link>

      <div
        className="absolute top-[42px] left-1/2 -translate-x-1/2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50 pt-2"
        role="menu"
        aria-label={title}
      >
        <div className="bg-[#0d0d12] border border-zinc-700 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl backdrop-blur-xl">
          {items.map((item, idx) => {
            const resolvedPath = isPt
              ? getPortugueseUrlForSpanish(item.path)
              : isEn
                ? getEnglishUrlForSpanish(item.path)
                : item.path;
            const isItemActive = pathname === resolvedPath;
            return (
              <Link
                key={`${item.path}-${idx}`}
                href={resolvedPath}
                className={`text-left px-3 py-2 text-xs font-mono transition-colors rounded-lg font-medium ${isItemActive ? 'bg-white text-black font-bold' : 'text-zinc-200 hover:text-white hover:bg-zinc-800'}`}
                role="menuitem"
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
