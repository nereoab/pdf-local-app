'use client';

import dynamic from 'next/dynamic';
import { Loader2, Code, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const HtmlPdfConverter = dynamic(() => import('@/components/HtmlPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor HTML ↔ PDF...</p>
    </div>
  ),
});

export default function HtmlToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <HtmlPdfConverter defaultMode="html-to-pdf" />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de HTML a PDF' : '1. How to convert HTML to PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu archivo .html/.htm o pega código HTML en el editor.', en: 'Upload your .html/.htm file or paste HTML code in the editor.' },
                { step: '02', es: 'El motor analiza el árbol DOM, estilos CSS e imágenes.', en: 'The engine parses the DOM tree, CSS styles, and images.' },
                { step: '03', es: 'Configura el tamaño de papel, márgenes y nivel de zoom.', en: 'Configure paper size, margins, and zoom level.' },
                { step: '04', es: 'Haz clic en convertir y descarga tu documento PDF vectorial.', en: 'Click convert and download your vector PDF document.' },
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
                  isEs ? 'Renderizar maquetas HTML5 complejas con CSS Flexbox y Grid.' : 'Render complex HTML5 layouts with CSS Flexbox & Grid.',
                  isEs ? 'Incrustar imágenes locales o en código Base64 directamente.' : 'Embed local images or Base64 code directly.',
                  isEs ? 'Controlar saltos de página con la regla CSS "page-break-before".' : 'Control page breaks with CSS "page-break-before" rule.',
                  isEs ? 'Exportar boletines, facturas web y reportes formateados.' : 'Export newsletters, web invoices, and formatted reports.',
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
                  isEs ? 'Utiliza rutas de imágenes absolutas o cadenas Data URI en Base64.' : 'Use absolute image paths or Base64 Data URIs.',
                  isEs ? 'El JavaScript dinámico no se ejecuta durante la conversión estática.' : 'Dynamic JavaScript does not execute during static conversion.',
                  isEs ? 'Procesamiento en memoria RAM 100% privado y sin servidores.' : '100% private RAM processing with zero servers.',
                  isEs ? 'Prueba la vista previa previa antes de compilar el PDF definitivo.' : 'Test preview before compiling final PDF.',
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
                <p className="text-[11px]">{isEs ? 'El HTML se procesa con el motor local de tu navegador sin enviar datos.' : 'HTML processes with browser local engine without sending data.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🌐 {isEs ? 'Fidelidad DOM' : 'DOM fidelity'}</strong>
                <p className="text-[11px]">{isEs ? 'Traducción directa de etiquetas HTML5 a primitivas vectoriales PDF.' : 'Direct translation of HTML5 tags into vector PDF primitives.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'El archivo PDF resultante está listo al instante para descargar.' : 'Resulting PDF file is ready instantly for download.'}</p>
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
                  qEs: '¿Puedo convertir código HTML con estilos CSS personalizados?',
                  qEn: 'Can I convert HTML code with custom CSS styles?',
                  aEs: 'Sí, el motor procesa CSS inline y bloques de estilos `<style>` para preservar la tipografía, colores y márgenes.',
                  aEn: 'Yes, the engine processes inline CSS and `<style>` blocks to preserve typography, colors, and margins.',
                },
                {
                  qEs: '¿Se mantiene la privacidad de mis plantillas web o facturas?',
                  qEn: 'Is the privacy of my web templates or invoices maintained?',
                  aEs: 'Totalmente. El documento nunca se sube a Internet; la conversión ocurre en la RAM de tu propio navegador.',
                  aEn: 'Totally. The document is never uploaded to the Internet; conversion happens in your browser RAM.',
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
