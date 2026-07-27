'use client';

import { useLanguage } from '../../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PdfCompressor from '../../../components/PdfCompressor';

export default function ComprimirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-200 px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO Y NAVEGACIÓN */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/optimizar" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-purple-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {isEs ? 'Volver a Herramientas de Optimizar' : 'Back to Optimization Tools'}
          </Link>
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Zap className="w-3.5 h-3.5" />
            {isEs ? 'SEO / Comprimir PDF Gratis' : 'SEO / Free PDF Compressor'}
          </span>
        </div>

        {/* HERO SEO TITLE & SUBTITLE */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEs ? 'COMPRESIÓN 100% LOCAL SIN SERVIDORES' : '100% LOCAL COMPRESSION NO SERVERS'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            {isEs ? 'Comprimir PDF Gratis - Reducir Tamaño de PDF Pesado' : 'Compress PDF Free - Reduce PDF File Size'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed">
            {isEs 
              ? 'Reduce el peso de tus archivos PDF manteniendo la máxima calidad visual. Todo el proceso de compresión se ejecuta en la RAM de tu navegador sin subir tus documentos a la nube.'
              : 'Reduce PDF size while keeping maximal visual quality. The entire compression runs locally inside your browser RAM without uploading files to the cloud.'}
          </p>
        </div>

        {/* COMPONENTE INTERACTIVO DE COMPRESIÓN */}
        <div className="mb-12">
          <PdfCompressor />
        </div>

        {/* SECCIÓN SEO TEXTO Y BENEFICIOS */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            {isEs ? '¿Por qué comprimir archivos PDF con PDFBlack?' : 'Why compress PDF files with PDFBlack?'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <strong className="text-white block mb-1">⚡ {isEs ? 'Reducción de hasta un 90%' : 'Up to 90% Reduction'}</strong>
              {isEs ? 'Optimiza imágenes integradas y descarta metadatos innecesarios para enviar PDFs por correo electrónico sin rebasar límites de peso.' : 'Optimize embedded images and discard redundant metadata to email PDFs easily.'}
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <strong className="text-white block mb-1">🔒 {isEs ? 'Máxima Privacidad Local' : 'Maximum Local Privacy'}</strong>
              {isEs ? 'Tus expedientes, planos o presupuestos nunca se suben a servidores externos. Cumplimiento legal garantizado.' : 'Your dossiers, blueprints, or budgets are never sent to external servers.'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
