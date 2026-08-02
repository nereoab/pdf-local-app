'use client';

import dynamic from 'next/dynamic';
import { Loader2, Code, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const HtmlPdfConverter = dynamic(() => import('@/components/HtmlPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ HTML...</p>
    </div>
  ),
});

export default function PdfHtmlPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <HtmlPdfConverter defaultMode="pdf-to-html" />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de PDF a HTML' : '1. How to convert PDF to HTML'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu documento PDF a la zona de carga interactiva.', en: 'Upload your PDF document to the interactive upload zone.' },
                { step: '02', es: 'El motor decodifica la jerarquía de texto e imágenes.', en: 'The engine decodes text hierarchy and images.' },
                { step: '03', es: 'Selecciona si empaquetar en 1 archivo HTML5 con imágenes Base64.', en: 'Select whether to package into 1 HTML5 file with Base64 images.' },
                { step: '04', es: 'Haz clic en convertir y descarga tu código HTML5 editable.', en: 'Click convert and download your editable HTML5 code.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  ✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
                </h4>
                {[
                  isEs ? 'Extraer etiquetas semánticas (<h1>, <p>, <table>, <img>).' : 'Extract semantic tags (<h1>, <p>, <table>, <img>).',
                  isEs ? 'Generar código estructurado listo para publicar en sitios web.' : 'Generate structured code ready for website publishing.',
                  isEs ? 'Incrustar imágenes en Base64 para evitar enlaces rotos.' : 'Embed Base64 images to prevent broken links.',
                  isEs ? 'Preservar párrafos e hipervínculos de forma responsiva.' : 'Preserve paragraphs & hyperlinks responsively.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  💡 {isEs ? 'CONSEJOS' : 'TIPS'}
                </h4>
                {[
                  isEs ? 'Ideal para reutilizar informes PDF como artículos o entradas de blog.' : 'Ideal for reusing PDF reports as articles or blog posts.',
                  isEs ? 'Aplica OCR previo si el PDF fue generado a partir de un escaneo.' : 'Apply OCR first if the PDF was generated from a scan.',
                  isEs ? 'Procesamiento en memoria RAM 100% confidencial y sin servidores.' : '100% confidential RAM processing with zero servers.',
                  isEs ? 'Preserva el archivo PDF original sin modificar ningún byte.' : 'Preserves original PDF file without altering any byte.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al convertirlo?' : '3. What happens to your document when converting it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">{isEs ? 'La conversión se ejecuta en la RAM. Ningún dato se sube a la nube.' : 'Conversion runs in RAM. No data is uploaded to the cloud.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🌐 {isEs ? 'Código HTML5 estándar' : 'Standard HTML5 code'}</strong>
                <p className="text-[11px]">{isEs ? 'Genera marcas de código sintácticamente válidas para la web.' : 'Generates syntactically valid web markup.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'El archivo .html o paquete se descarga al instante.' : 'The .html file or package downloads instantly.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  qEs: '¿El código HTML resultante incluye imágenes incrustadas?',
                  qEn: 'Does the resulting HTML code include embedded images?',
                  aEs: 'Sí, las imágenes contenidas en el PDF se codifican en Base64 para que el archivo HTML sea autónomo y no requiera carpetas anexas.',
                  aEn: 'Yes, images inside the PDF are encoded in Base64 so the HTML file is self-contained without needing extra folders.',
                },
                {
                  qEs: '¿Se mantiene el formato de los textos y encabezados?',
                  qEn: 'Is text formatting and headings preserved?',
                  aEs: 'Sí, las fuentes, tamaños y jerarquías de título (H1-H6) se traducen en marcas HTML y CSS nativos.',
                  aEn: 'Yes, fonts, sizes, and heading hierarchies (H1-H6) translate into native HTML and CSS markup.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-1.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="text-blue-400 font-mono">Q:</span> {isEs ? faq.qEs : faq.qEn}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-5">
                    {isEs ? faq.aEs : faq.aEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
