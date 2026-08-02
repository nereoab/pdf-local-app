'use client';

import dynamic from 'next/dynamic';
import { Loader2, Presentation, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PowerPointPdfConverter = dynamic(() => import('@/components/PowerPointPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ PowerPoint...</p>
    </div>
  ),
});

export default function PdfPowerpointPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PowerPointPdfConverter defaultMode="pdf-to-powerpoint" />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Presentation className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de PDF a PowerPoint' : '1. How to convert PDF to PowerPoint'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu documento PDF a la zona de carga interactiva.', en: 'Upload your PDF document to the interactive upload zone.' },
                { step: '02', es: 'El motor analiza las páginas y la jerarquía de láminas.', en: 'The engine analyzes pages and slide hierarchy.' },
                { step: '03', es: 'Selecciona la proporción de diapositivas de salida (16:9).', en: 'Select output slide aspect ratio (16:9).' },
                { step: '04', es: 'Haz clic en convertir y descarga tu archivo .pptx editable.', en: 'Click convert and download your editable .pptx file.' },
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
                  isEs ? 'Convertir cada página de tu PDF en una diapositiva individual.' : 'Convert each page of your PDF into an individual slide.',
                  isEs ? 'Preservar títulos, párrafos e ilustraciones del documento.' : 'Preserve document titles, paragraphs, and illustrations.',
                  isEs ? 'Exportar como estándar OpenXML (.pptx) ejecutable en PowerPoint.' : 'Export as standard OpenXML (.pptx) executable in PowerPoint.',
                  isEs ? 'Reorganizar y reordenar diapositivas en Microsoft Office.' : 'Reorganize and reorder slides inside Microsoft Office.',
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
                  isEs ? 'Funciona mejor con PDFs creados desde software de presentaciones.' : 'Works best with PDFs created from presentation software.',
                  isEs ? 'Aplica OCR previo si el PDF proviene de diapositivas escaneadas.' : 'Apply OCR first if the PDF comes from scanned slides.',
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
                <p className="text-[11px]">{isEs ? 'La conversión corre en la RAM. Ninguna diapositiva viaja por Internet.' : 'Conversion runs in RAM. No slide travels over the Internet.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📽️ {isEs ? 'Formato PPTX limpio' : 'Clean PPTX format'}</strong>
                <p className="text-[11px]">{isEs ? 'Genera un empaquetado XML compatible con Office 365 y Google Slides.' : 'Generates XML package compatible with Office 365 and Google Slides.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'La presentación .pptx se descarga inmediatamente en tu equipo.' : 'The .pptx presentation downloads immediately to your device.'}</p>
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
                  qEs: '¿El archivo PowerPoint generado se puede editar en Google Slides?',
                  qEn: 'Can the generated PowerPoint file be edited in Google Slides?',
                  aEs: 'Sí, la estructura .pptx generada es 100% compatible con Microsoft PowerPoint, Google Slides y Keynote.',
                  aEn: 'Yes, the generated .pptx structure is 100% compatible with Microsoft PowerPoint, Google Slides, and Keynote.',
                },
                {
                  qEs: '¿Mis diapositivas quedan almacenadas en algún servidor?',
                  qEn: 'Are my slides stored on any server?',
                  aEs: 'No. Todo se compila dentro del navegador mediante librerías de empaquetado local en tu dispositivo.',
                  aEn: 'No. Everything compiles inside the browser via local packaging libraries on your device.',
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
