'use client';

import PowerPointPdfConverter from '../../../components/PowerPointPdfConverter';
import { useLanguage } from '../../../context/LanguageContext';
import { Presentation, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PowerPointToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
            <Presentation className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <Link href="/convertir" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-white text-xs font-bold">{isEs ? 'PowerPoint a PDF / PDF a PowerPoint (2 en 1)' : 'PowerPoint to PDF / PDF to PowerPoint (2 in 1)'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEs ? 'CONVERTIR POWERPOINT Y PDF (CONVERSOR DUAL 2 EN 1)' : 'CONVERT POWERPOINT & PDF (2-IN-1 DUAL CONVERTER)'}
            </h1>
          </div>
        </div>

        <div className="mb-16">
          <PowerPointPdfConverter defaultMode="powerpoint-to-pdf" />
        </div>

        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede con tus presentaciones durante la conversión?' : 'What happens to your presentations during conversion?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 RENDIMIENTO 16:9 VECTORIAL Y PROCESAMIENTO 100% LOCAL' : '🔒 100% LOCAL VECTOR & 16:9 PROCESSING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? '1. Conversión de PowerPoint (.pptx) a PDF' : '1. PowerPoint (.pptx) to PDF Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Procesa los archivos XML de cada diapositiva (`ppt/slides/slide1.xml`), convirtiendo los cuadros de texto y figuras en vectores PDF apaisados sin alterar proporciones.'
                    : 'Parses XML slide files (`ppt/slides/slide1.xml`), converting text boxes & shapes into landscape PDF vectors with 100% aspect ratio retention.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  {isEs ? '2. Conversión de PDF a PowerPoint (.pptx)' : '2. PDF to PowerPoint (.pptx) Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Transforma cada página de tu PDF en una diapositiva OpenXML independiente editable para Microsoft PowerPoint.'
                    : 'Transforms each PDF page into an independent OpenXML slide editable in Microsoft PowerPoint.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
