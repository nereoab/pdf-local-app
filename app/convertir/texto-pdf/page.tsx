'use client';

import TextPdfConverter from '../../../components/TextPdfConverter';
import { useLanguage } from '../../../context/LanguageContext';
import { AlignLeft, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import Link from 'next/link';

export default function TextToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        
        {/* ENCABEZADO DE NAVEGACIÓN Y TÍTULO */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
            <AlignLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <Link href="/convertir" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-white text-xs font-bold">{isEs ? 'Texto a PDF / PDF a Texto (2 en 1)' : 'Text to PDF / PDF to Text (2 in 1)'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEs ? 'CONVERTIR TEXTO PLANO Y PDF (CONVERSOR DUAL 2 EN 1)' : 'CONVERT PLAIN TEXT & PDF (2-IN-1 DUAL CONVERTER)'}
            </h1>
          </div>
        </div>

        {/* HERRAMIENTA INTERACTIVA 2 EN 1 */}
        <div className="mb-16">
          <TextPdfConverter defaultMode="text-to-pdf" />
        </div>

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/30">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Cómo se genera tu documento PDF desde texto plano?' : 'How is your PDF document generated from plain text?'}
                </h2>
                <span className="text-xs font-mono text-purple-400 font-semibold">
                  {isEs ? '🔒 CONVERSIÓN VECTORIAL Y TIPOGRÁFICA 100% LOCAL' : '🔒 100% LOCAL VECTOR & TYPOGRAPHIC CONVERSION'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  {isEs ? 'Configuración de Estilos' : 'Style Customization'}
                </strong>
                <p>
                  {isEs 
                    ? 'Selecciona tipografía (Helvetica, Courier o Times), ajusta el tamaño del papel (A4, Carta, Oficio), tamaño de fuente e interlineado en tiempo real.' 
                    : 'Choose fonts (Helvetica, Courier, or Times), adjust page size (A4, Letter, Legal), font size, and line spacing in real time.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  {isEs ? 'Numeración y Paginación' : 'Page Numbering'}
                </strong>
                <p>
                  {isEs 
                    ? 'Genera encabezados y pies de página vectoriales automatizados con numeración continua de páginas sin subir ningún dato a la red.' 
                    : 'Generate automated vector headers and footers with page numbering without uploading data to the network.'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
