'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function CookieConsent() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si ya se ha dado consentimiento — diferido para evitar cascading renders
    const id = setTimeout(() => {
      try {
        const stored = localStorage.getItem('pdfblack-cookie-consent');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < 365 * 24 * 60 * 60 * 1000) {
            // Consentimiento vigente (< 1 año)
            return;
          }
        }
      } catch {
        // ignorar
      }
      setIsVisible(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const saveConsent = (essential: boolean, analytics: boolean, functional: boolean) => {
    const consent = { essential, analytics, functional, timestamp: Date.now() };
    localStorage.setItem('pdfblack-cookie-consent', JSON.stringify(consent));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true, true, true);
  };

  const handleAcceptEssential = () => {
    saveConsent(true, false, false);
  };

  const handleCustomize = () => {
    // Mostrar panel de preferencias (simplificado)
    saveConsent(
      true,
      window.confirm(isEs
        ? '¿Permitir cookies analíticas anónimas para mejorar el servicio?'
        : 'Allow anonymous analytics cookies to improve the service?'),
      window.confirm(isEs
        ? '¿Permitir cookies funcionales (idioma, preferencias de tema)?'
        : 'Allow functional cookies (language, theme preferences)?')
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cookie-consent-modal"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[150] p-3 sm:p-4"
        >
          <div className="max-w-4xl mx-auto bg-[#0a0a0e] border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icono y texto */}
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 flex-shrink-0 mt-0.5" aria-hidden="true">
                  <Cookie className="w-5 h-5 text-white" />
                </div>
                <div className="font-sans">
                  <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    {isEs ? 'Este sitio usa cookies mínimas' : 'This site uses minimal cookies'}
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    {isEs
                      ? 'Solo utilizamos cookies esenciales para el funcionamiento (idioma, sesión local) y cookies analíticas opcionales y anónimas. No compartimos datos con terceros. Todo el procesamiento PDF es 100% local en tu navegador.'
                      : 'We only use essential cookies for functionality (language, local session) and optional anonymous analytics cookies. We do not share data with third parties. All PDF processing is 100% local in your browser.'}
                    {' '}
                    <Link href="/privacidad" className="text-white underline hover:text-zinc-300 transition-colors inline-flex items-center gap-1">
                      {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto font-mono text-xs">
                <button
                  onClick={handleCustomize}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-white/20 text-zinc-300 hover:text-white hover:border-white/40 transition-all whitespace-nowrap"
                >
                  {isEs ? 'Personalizar' : 'Customize'}
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-white/20 text-zinc-300 hover:text-white hover:border-white/40 transition-all whitespace-nowrap"
                >
                  {isEs ? 'Solo Esenciales' : 'Essential Only'}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all whitespace-nowrap shadow-md"
                >
                  {isEs ? 'Aceptar Todas' : 'Accept All'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}