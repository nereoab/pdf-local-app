'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfWatermark = dynamic(() => import('@/components/PdfWatermark'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para añadir marca de agua a PDF...</p>
    </div>
  ),
});

export default function MarcaAguaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfWatermark />

        {/* ══════════════════════════════════════════════
            3 SECCIONES INFORMATIVAS CONSISTENTES
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR LA HERRAMIENTA ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo poner un sello de agua' : '1. How to add a watermark'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', textEs: 'Sube tu archivo PDF arrastrándolo a la zona de carga o haciendo clic para seleccionarlo. El visor mostrará miniaturas de todas las páginas.', textEn: 'Upload your PDF by dragging it to the upload zone or clicking to select it. The viewer will show thumbnails of all pages.' },
                { step: '02', textEs: 'Elige el tipo de sello: Texto (escribe tu mensaje como "CONFIDENCIAL" o "BORRADOR") o Imagen (sube un logo PNG).', textEn: 'Choose the stamp type: Text (write your message like "CONFIDENTIAL" or "DRAFT") or Image (upload a PNG logo).' },
                { step: '03', textEs: 'Configura las opciones avanzadas: posición en la hoja, opacidad, ángulo de rotación, tamaño y color del texto.', textEn: 'Configure advanced options: position on the page, opacity, rotation angle, text size and color.' },
                { step: '04', textEs: 'Haz clic en "Poner Sello de Agua →" y descarga el PDF con la marca de agua aplicada.', textEn: 'Click "Add Watermark →" and download the PDF with the watermark applied.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.textEs : item.textEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 2: LIMITACIONES Y CONSEJOS ── */}
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
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[
                  isEs ? 'Añadir sellos de texto como "CONFIDENCIAL", "BORRADOR" o "COPIA" en cualquier parte de la hoja.' : 'Add text stamps like "CONFIDENTIAL", "DRAFT", or "COPY" anywhere on the page.',
                  isEs ? 'Usar tu logo corporativo (PNG) como marca de agua en múltiples páginas.' : 'Use your corporate logo (PNG) as a watermark across multiple pages.',
                  isEs ? 'Ajustar la opacidad del sello para que sea visible sin tapar completamente el contenido.' : 'Adjust stamp opacity so it is visible without completely covering content.',
                  isEs ? 'Seleccionar páginas específicas o aplicar el sello a todo el documento.' : 'Select specific pages or apply the stamp to the entire document.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[
                  isEs ? 'Usa una opacidad entre 20% y 40% para que el sello no opaque el texto original del documento.' : 'Use opacity between 20% and 40% so the stamp does not obscure the original document text.',
                  isEs ? 'Para imágenes, usa PNG con fondo transparente para un resultado profesional.' : 'For images, use PNG with transparent background for a professional result.',
                  isEs ? 'La rotación diagonal (-45°) es la más usada para sellos de texto repetidos en cada página.' : 'Diagonal rotation (-45°) is the most common for repeated text stamps on each page.',
                  isEs ? 'Si el PDF tiene páginas en orientación mixta, revisa la vista previa para verificar la posición del sello.' : 'If the PDF has mixed page orientations, check the preview to verify stamp position.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: QUÉ SUCEDE CON TU DOCUMENTO ── */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al sellarlo?' : '3. What happens to your document when you watermark it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Tu PDF se procesa completamente en la memoria RAM de tu navegador. No se envía ningún dato a servidores externos.'
                    : 'Your PDF is processed entirely in your browser RAM. No data is sent to external servers.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  💧 {isEs ? 'Sello integrado como contenido real' : 'Stamp embedded as real content'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El sello se convierte en parte permanente del PDF. Es visible en cualquier lector (Adobe, Chrome, Edge) y no se puede editar por separado.'
                    : 'The stamp becomes a permanent part of the PDF. It is visible in any viewer (Adobe, Chrome, Edge) and cannot be edited separately.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El PDF sellado se genera localmente y se descarga directamente a tu equipo. Tu archivo original no se modifica.'
                    : 'The stamped PDF is generated locally and downloads directly to your device. Your original file is not modified.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}