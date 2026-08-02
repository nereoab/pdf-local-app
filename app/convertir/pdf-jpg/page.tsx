'use client';

import dynamic from 'next/dynamic';
import { Loader2, Image as ImageIcon, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const JpgPdfConverter = dynamic(() => import('@/components/JpgPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ JPG...</p>
    </div>
  ),
});

export default function PdfJpgPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <JpgPdfConverter defaultMode="pdf-to-jpg" />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo extraer imágenes de un PDF a JPG' : '1. How to extract images from PDF to JPG'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu archivo PDF a la zona de carga interactiva.', en: 'Upload your PDF file to the interactive upload zone.' },
                { step: '02', es: 'El motor analiza las páginas y la resolución de gráficos.', en: 'The engine analyzes pages and graphic resolution.' },
                { step: '03', es: 'Selecciona el formato (JPG/PNG/WEBP) y densidad DPI.', en: 'Select format (JPG/PNG/WEBP) and DPI density.' },
                { step: '04', es: 'Haz clic en exportar y descarga las imágenes en un paquete ZIP.', en: 'Click export and download images in a ZIP package.' },
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
                  isEs ? 'Exportar cada página del PDF como una imagen independiente de alta definición.' : 'Export each PDF page as an independent HD image.',
                  isEs ? 'Extraer únicamente las fotos e ilustraciones contenidas dentro del PDF.' : 'Extract only photos and illustrations inside the PDF.',
                  isEs ? 'Elegir resoluciones desde 72 DPI (web) hasta 300 DPI (impresión).' : 'Choose resolutions from 72 DPI (web) up to 300 DPI (print).',
                  isEs ? 'Descargar todas las páginas empacadas automáticamente en formato ZIP.' : 'Download all pages automatically packaged in ZIP format.',
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
                  isEs ? 'Usa 300 DPI si planeas imprimir las imágenes extraídas.' : 'Use 300 DPI if you plan to print extracted images.',
                  isEs ? 'Usa formato PNG si el PDF contiene gráficos con fondo transparente.' : 'Use PNG format if the PDF contains graphics with transparent backgrounds.',
                  isEs ? 'Procesamiento en memoria RAM 100% privado y sin servidores.' : '100% private RAM processing with zero servers.',
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
                <p className="text-[11px]">{isEs ? 'El renderizado mediante Canvas se ejecuta en tu RAM sin enviar fotos a la nube.' : 'Canvas rendering runs in RAM without sending photos to the cloud.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🎨 {isEs ? 'Fidelidad de color' : 'Color fidelity'}</strong>
                <p className="text-[11px]">{isEs ? 'Conserva la fidelidad cromática RGB original del documento.' : 'Retains original RGB color fidelity of the document.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga en ZIP' : 'ZIP Download'}</strong>
                <p className="text-[11px]">{isEs ? 'Todas las imágenes resultantes se descargan ordenadas en un archivo comprimido.' : 'All resulting images download organized inside a compressed file.'}</p>
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
                  qEs: '¿La calidad de la imagen exportada es idéntica a la del PDF original?',
                  qEn: 'Is the quality of the exported image identical to the original PDF?',
                  aEs: 'Sí, la escala de renderizado a 2.0x o 3.0x garantiza máxima nitidez en los textos e ilustraciones.',
                  aEn: 'Yes, rendering scale at 2.0x or 3.0x guarantees maximum sharpness on text and illustrations.',
                },
                {
                  qEs: '¿Es posible extraer imágenes de un PDF de varias páginas?',
                  qEn: 'Is it possible to extract images from a multi-page PDF?',
                  aEs: 'Sí, cada página se procesa en secuencia y el resultado completo se agrupa en un archivo ZIP descargable.',
                  aEn: 'Yes, each page processes in sequence and the complete result packages into a downloadable ZIP file.',
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
