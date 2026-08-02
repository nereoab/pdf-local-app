'use client';

import dynamic from 'next/dynamic';
import { Loader2, Presentation, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PowerPointPdfConverter = dynamic(() => import('@/components/PowerPointPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PowerPoint ↔ PDF...</p>
    </div>
  ),
});

export default function PowerpointPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PowerPointPdfConverter defaultMode="powerpoint-to-pdf" />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Presentation className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de PowerPoint a PDF' : '1. How to convert PowerPoint to PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu presentación PowerPoint (.pptx/.ppt) a la zona de carga.', en: 'Upload your PowerPoint presentation (.pptx/.ppt) to upload zone.' },
                { step: '02', es: 'El motor analiza las diapositivas, textos y relaciones de aspecto.', en: 'The engine analyzes slides, text, and aspect ratios.' },
                { step: '03', es: 'Configura la proporción (16:9 widescreen o 4:3 estándar).', en: 'Configure aspect ratio (16:9 widescreen or 4:3 standard).' },
                { step: '04', es: 'Haz clic en convertir y descarga tu presentación en formato PDF.', en: 'Click convert and download your presentation in PDF format.' },
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
                  isEs ? 'Convertir presentaciones a PDF apaisado manteniendo la maquetación.' : 'Convert presentations to landscape PDF keeping layout.',
                  isEs ? 'Preservar colores de tema, gráficos vectoriales e imágenes embebidas.' : 'Preserve theme colors, vector graphics, and embedded images.',
                  isEs ? 'Exportar cada diapositiva en una página independiente de alta nitidez.' : 'Export each slide onto an independent high-sharpness page.',
                  isEs ? 'Añadir bordes sutiles o marcas de agua corporativas.' : 'Add subtle borders or corporate watermarks.',
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
                  isEs ? 'Las animaciones de PowerPoint no se transfieren al formato estático PDF.' : 'PowerPoint animations do not transfer to static PDF format.',
                  isEs ? 'Usa fuentes estándar de sistema para garantizar fidelidad en cualquier pantalla.' : 'Use standard system fonts to ensure fidelity on any screen.',
                  isEs ? 'Procesamiento en memoria RAM 100% privado y sin servidores.' : '100% private RAM processing with zero servers.',
                  isEs ? 'Ideal para compartir presentaciones de venta sin posibilidad de alteración.' : 'Ideal for sharing sales presentations without alteration risks.',
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
                <p className="text-[11px]">{isEs ? 'Tus diapositivas se procesan en la RAM sin salir a ningún servidor.' : 'Your slides process in RAM without leaving to any server.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📽️ {isEs ? 'Formato inmutable' : 'Immutable format'}</strong>
                <p className="text-[11px]">{isEs ? 'Congela la maquetación visual para proteger tu diseño corporativo.' : 'Freezes visual layout to protect corporate design.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'El archivo PDF resultante está listo al instante.' : 'Resulting PDF file is ready instantly.'}</p>
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
                  qEs: '¿La conversión respeta la proporción 16:9 panorámica de PowerPoint?',
                  qEn: 'Does conversion respect PowerPoint widescreen 16:9 ratio?',
                  aEs: 'Sí, el motor ajusta las dimensiones de la página PDF para coincidir exactamente con el formato de la diapositiva.',
                  aEn: 'Yes, the engine adjusts PDF page dimensions to match the slide aspect ratio exactly.',
                },
                {
                  qEs: '¿Mis presentaciones corporativas o lanzamientos de producto se guardan en la nube?',
                  qEn: 'Are my corporate presentations or product launches saved on cloud?',
                  aEs: 'No. El procesamiento es estrictamente local en tu navegador sin registro alguno.',
                  aEn: 'No. Processing is strictly local in your browser with zero logging.',
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
