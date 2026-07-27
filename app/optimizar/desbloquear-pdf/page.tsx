'use client';

import { useLanguage } from '../../../context/LanguageContext';
import Link from 'next/link';
import { Unlock, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PdfUnlocker from '../../../components/PdfUnlocker';

export default function DesbloquearPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-200 px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO Y NAVEGACIÓN */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/optimizar" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {isEs ? 'Volver a Herramientas de Optimizar' : 'Back to Optimization Tools'}
          </Link>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Unlock className="w-3.5 h-3.5" />
            {isEs ? 'SEO / Desbloquear PDF' : 'SEO / Unlock PDF'}
          </span>
        </div>

        {/* HERO SEO TITLE & SUBTITLE */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEs ? 'DESBLOQUEO SEGURO Y LOCAL' : 'SECURE & LOCAL UNLOCK'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            {isEs ? 'Desbloquear PDF - Quitar Contraseña y Permisos de Lectura' : 'Unlock PDF - Remove Password & Restrictions'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed">
            {isEs 
              ? 'Elimina contraseñas y restricciones de edición o impresión de tus archivos PDF. Proceso 100% privado en tu dispositivo.'
              : 'Remove passwords and editing or printing restrictions from your PDF files. 100% private processing on your device.'}
          </p>
        </div>

        {/* COMPONENTE INTERACTIVO DE DESBLOQUEO */}
        <div className="mb-12">
          <PdfUnlocker />
        </div>

        {/* SECCIÓN SEO TEXTO Y BENEFICIOS */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            {isEs ? '¿Cómo funciona el desbloqueo de PDF en PDFBlack?' : 'How does PDF unlocking work in PDFBlack?'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <strong className="text-white block mb-1">🔓 {isEs ? 'Liberación de Permisos' : 'Permission Release'}</strong>
              {isEs ? 'Habilita funciones de copia de texto, impresión en alta definición y edición que se encontraban restringidas.' : 'Enable copying text, HD printing, and editing features that were restricted.'}
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <strong className="text-white block mb-1">🛡️ {isEs ? 'Protección Cero Fugas' : 'Zero Leakage Guarantee'}</strong>
              {isEs ? 'Tus credenciales y claves no se envían a ningún servidor externo. Todo la desencripción es local.' : 'Your credentials and keys are never sent to external servers. All decryption is local.'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
