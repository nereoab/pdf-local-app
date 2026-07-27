'use client';

import { useLanguage } from '../../../context/LanguageContext';
import Link from 'next/link';
import { Lock, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PdfProtector from '../../../components/PdfProtector';

export default function ProtegerPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-200 px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO Y NAVEGACIÓN */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/optimizar" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {isEs ? 'Volver a Herramientas de Optimizar' : 'Back to Optimization Tools'}
          </Link>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Lock className="w-3.5 h-3.5" />
            {isEs ? 'SEO / Proteger PDF' : 'SEO / Protect PDF'}
          </span>
        </div>

        {/* HERO SEO TITLE & SUBTITLE */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEs ? 'CIFRADO AES-256 LOCAL' : 'LOCAL AES-256 ENCRYPTION'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            {isEs ? 'Proteger PDF con Contraseña - Encriptación de Seguridad' : 'Protect PDF with Password - Encryption Security'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed">
            {isEs 
              ? 'Encripta tus documentos PDF con contraseña de apertura. Protege contratos, presupuestos e información confidencial con cifrado directo en tu navegador.'
              : 'Encrypt your PDF documents with an open password. Protect contracts, budgets, and confidential info with direct encryption in your browser.'}
          </p>
        </div>

        {/* COMPONENTE INTERACTIVO DE PROTECCIÓN */}
        <div className="mb-12">
          <PdfProtector />
        </div>

        {/* SECCIÓN SEO TEXTO Y BENEFICIOS */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {isEs ? '¿Por qué cifrar tus archivos en PDFBlack?' : 'Why encrypt your files in PDFBlack?'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <strong className="text-white block mb-1">🔐 {isEs ? 'Protección con Clave Robusta' : 'Robust Password Protection'}</strong>
              {isEs ? 'Asigna contraseñas secretas para bloquear el acceso no autorizado a tus documentos personales o empresariales.' : 'Assign secret passwords to prevent unauthorized access to your personal or business documents.'}
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <strong className="text-white block mb-1">⚡ {isEs ? 'Sin Envío a Nube' : 'No Cloud Upload'}</strong>
              {isEs ? 'El cifrado se realiza con la clave especificada de manera local. Nadie más podrá conocer tu contraseña.' : 'Encryption is performed locally with the specified key. No one else can know your password.'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
