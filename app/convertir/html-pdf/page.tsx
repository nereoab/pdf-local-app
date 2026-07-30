'use client';

import HtmlPdfConverter from '../../../components/HtmlPdfConverter';
import { useLanguage } from '../../../context/LanguageContext';
import { Code, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import Link from 'next/link';

export default function HtmlToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <Link href="/convertir" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-white text-xs font-bold">{isEs ? 'HTML a PDF / PDF a HTML (2 en 1)' : 'HTML to PDF / PDF to HTML (2 in 1)'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEs ? 'CONVERTIR HTML Y PDF (CONVERSOR DUAL 2 EN 1)' : 'CONVERT HTML & PDF (2-IN-1 DUAL CONVERTER)'}
            </h1>
          </div>
        </div>

        <div className="mb-16">
          <HtmlPdfConverter defaultMode="html-to-pdf" />
        </div>

        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede durante el renderizado entre HTML y PDF?' : 'What happens during rendering between HTML and PDF?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 RENDERIZADO WEB DOM HTML5 Y PROCESAMIENTO 100% LOCAL' : '🔒 100% LOCAL HTML5 DOM RENDERING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? '1. Conversión de HTML a PDF' : '1. HTML to PDF Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Procesa el árbol DOM y estilos CSS3 de la página web, renderizándolos con precisión vectorial en un documento PDF de alta fidelidad.'
                    : 'Parses DOM trees and CSS3 styles from the web page, vector-rendering them into a high-precision PDF.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  {isEs ? '2. Conversión de PDF a HTML' : '2. PDF to HTML Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Traduce párrafos, títulos e imágenes fijas del PDF en marcas sintácticas de HTML5 totalmente estructuradas.'
                    : 'Translates paragraphs, headings, and static PDF images into fully structured HTML5 syntax.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
