'use client';

import dynamic from 'next/dynamic';
import { Loader2, Image as ImageIcon, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const JpgPdfConverter = dynamic(() => import('@/components/JpgPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor JPG ↔ PDF...</p>
    </div>
  ),
});

export default function JpgToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <JpgPdfConverter defaultMode="jpg-to-pdf" />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de Imagen (JPG/PNG) a PDF' : '1. How to convert Images (JPG/PNG) to PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube una o múltiples imágenes (JPG, PNG, WEBP) a la zona de carga.', en: 'Upload single or multiple images (JPG, PNG, WEBP) to upload zone.' },
                { step: '02', es: 'Reordena las fotos arrastrándolas según la secuencia deseada.', en: 'Reorder photos by dragging according to desired sequence.' },
                { step: '03', es: 'Configura la orientación (vertical/horizontal) y márgenes de página.', en: 'Configure page orientation (portrait/landscape) and margins.' },
                { step: '04', es: 'Haz clic en compilar y descarga tu álbum o documento PDF.', en: 'Click compile and download your PDF album or document.' },
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
                  isEs ? 'Combinar decenas de fotos e imágenes en un único archivo PDF.' : 'Combine dozens of photos and images into a single PDF file.',
                  isEs ? 'Preservar la transparencia en imágenes formato PNG.' : 'Preserve transparency in PNG format images.',
                  isEs ? 'Ajustar la calidad de compresión JPEG para reducir el peso final.' : 'Adjust JPEG compression quality to reduce output file size.',
                  isEs ? 'Definir el tamaño de hoja exacto (A4, Carta o Tamaño Imagen).' : 'Define exact paper size (A4, Letter, or Fit Image Size).',
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
                  isEs ? 'Para escaneos de documentos, usa la opción de auto-ajuste de margen.' : 'For document scans, use the auto-margin fit option.',
                  isEs ? 'El orden de las imágenes en pantalla determina el orden de páginas.' : 'The order of images on screen determines page order.',
                  isEs ? 'Procesamiento en memoria RAM 100% privado y sin servidores.' : '100% private RAM processing with zero servers.',
                  isEs ? 'Soporta fotos tomadas directamente desde teléfonos móviles.' : 'Supports photos taken directly from mobile phones.',
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
                <p className="text-[11px]">{isEs ? 'Las imágenes se incrustan en la RAM de tu navegador sin subirse a la red.' : 'Images embed inside browser RAM without network upload.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖼️ {isEs ? 'Resolución HD preservada' : 'HD resolution preserved'}</strong>
                <p className="text-[11px]">{isEs ? 'Conserva la nitidez original de las fotografías sin compresión forzada.' : 'Retains original photography sharpness without forced compression.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'El archivo PDF combinado se descarga al instante.' : 'The combined PDF file downloads instantly.'}</p>
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
                  qEs: '¿Existe algún límite en la cantidad de fotos que puedo convertir a PDF?',
                  qEn: 'Is there a limit on the number of photos I can convert to PDF?',
                  aEs: 'No hay límite artificial; el proceso depende de la memoria RAM disponible en tu dispositivo.',
                  aEn: 'There is no artificial limit; the process depends on your device\'s available RAM.',
                },
                {
                  qEs: '¿Las imágenes personales o fotos familiares se almacenan en servidores?',
                  qEn: 'Are personal images or family photos stored on servers?',
                  aEs: 'No. El procesamiento es 100% local en tu navegador y los datos se borran al cerrar la pestaña.',
                  aEn: 'No. Processing is 100% local in your browser and data is cleared upon closing the tab.',
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
