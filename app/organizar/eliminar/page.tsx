'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Trash2, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfPageDeleter = dynamic(() => import('@/components/PdfPageDeleter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando eliminador de páginas PDF...</p>
    </div>
  )
});

export default function Page() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfPageDeleter />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo eliminar páginas de un PDF' : '1. How to delete PDF pages'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu documento PDF. El visor interactivo cargará las miniaturas visuales en cuadrícula 4x4.',
                  en: 'Upload your PDF document. The interactive viewer will render 4x4 visual thumbnails.'
                },
                {
                  step: '02',
                  es: 'Haz clic en cada miniatura para marcar las páginas que deseas eliminar o usa la entrada por rango.',
                  en: 'Click on each thumbnail to mark pages for removal or use the range input.'
                },
                {
                  step: '03',
                  es: 'Utiliza filtros masivos como "Blancas", "Pares" o "Impares" para una selección rápida.',
                  en: 'Use bulk filters like "Blanks", "Evens" or "Odds" for quick page selection.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Eliminar Páginas del PDF →" para procesar y descargar tu archivo depurado.',
                  en: 'Click "Delete Pages from PDF →" to process and download your purged file.'
                }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs ? item.es : item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: LIMITACIONES Y CONSEJOS ÚTILES */}
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
                  isEs ? 'Purga visual de páginas no deseadas sin límite de archivos.' : 'Visual purge of unwanted pages with unlimited files.',
                  isEs ? 'Filtro inteligente de detección automática de páginas en blanco.' : 'Smart automatic blank page detection filter.',
                  isEs ? 'Entrada flexible por rangos de texto (ej. 2, 5, 8-12).' : 'Flexible text range input (e.g. 2, 5, 8-12).',
                  isEs ? 'Re-numerar automáticamente el pie de página ("Página N / M").' : 'Auto re-number footer pages ("Page N / M").',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de purgar.' : 'Unlock password-protected PDFs before purging.'
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
                  isEs ? 'Usa la lupa para previsualizar la hoja en alta resolución antes de marcarla.' : 'Use the zoom icon to preview the sheet in high resolution before marking.',
                  isEs ? 'Debes conservar al menos 1 página para generar un documento PDF válido.' : 'You must keep at least 1 page to generate a valid PDF document.',
                  isEs ? 'El archivo original se mantiene seguro e intacto en tu dispositivo.' : 'The original file remains safe and untouched on your device.',
                  isEs ? 'Estampa metadatos de Título y Autor en las Opciones Avanzadas.' : 'Stamp Title and Author metadata in Advanced Options.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ¿QUÉ SUCEDE CON TU DOCUMENTO? */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al eliminar páginas?' : '3. What happens to your document when deleting pages?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Web Worker' : '100% Local Web Worker Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tanto el análisis de miniaturas como la purga de vectores corren en la memoria RAM de tu navegador sin subirse a servidores externos.' : 'Thumbnail analysis and vector purging run in browser RAM without external servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🗑️ {isEs ? 'Remoción sin Pérdida de Calidad' : 'Quality Preservation Page Purge'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Las páginas conservadas mantienen exactamente la misma resolución de fuentes, imágenes y firmas que el documento original.' : 'Preserved pages retain the exact resolution of fonts, images, and signatures.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Privacidad e Integridad Garantizada' : 'Privacy & Integrity Guaranteed'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tu archivo original nunca es modificado ni sobrescrito. La descarga genera una copia depurada limpia al instante.' : 'Your original file is never modified or overwritten. Download generates a clean purged copy.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: PREGUNTAS FRECUENTES (FAQ) - ACORDEÓN INTERACTIVO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas frecuentes (FAQ)' : '4. Frequently Asked Questions (FAQ)'}
              </h2>
            </div>

            <div className="space-y-3 font-sans">
              {[
                {
                  q: isEs ? '¿Puedo recuperar una página si la eliminé por accidente?' : 'Can I recover a page if I deleted it by accident?',
                  a: isEs 
                    ? 'Sí, mientras estés en el visor interactivo puedes volver a hacer clic sobre la página marcada o pulsar en "Restaurar Página" dentro del modal de zoom antes de hacer clic en el botón de proceso.'
                    : 'Yes, while in the interactive viewer you can click again on the marked thumbnail or click "Restore Page" in the zoom modal before processing.'
                },
                {
                  q: isEs ? '¿Cómo funciona la detección de páginas en blanco?' : 'How does blank page detection work?',
                  a: isEs
                    ? 'Nuestra herramienta examina la densidad de píxeles no blancos en cada canvas renderizado. Si el contenido detectable es inferior al 0.5%, se marca automáticamente con la etiqueta "Blanca".'
                    : 'Our tool analyzes non-white pixel density on each rendered canvas. If detectable content is below 0.5%, it is tagged as "Blank".'
                },
                {
                  q: isEs ? '¿Mis documentos o datos se guardan en algún servidor?' : 'Are my documents or data stored on any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento de lectura de páginas y empaquetado del PDF depurado se ejecuta 100% en tu propio navegador mediante Web Workers. Ningún archivo sale de tu dispositivo.'
                    : 'No. All page parsing and PDF compilation happens 100% inside your own browser using Web Workers. No file leaves your device.'
                },
                {
                  q: isEs ? '¿Puedo eliminar páginas de un PDF protegido con contraseña?' : 'Can I delete pages from a password-protected PDF?',
                  a: isEs
                    ? 'Sí. Al cargar un PDF encriptado, aparecerá un widget inline de clave. Ingresa la contraseña de apertura una vez para desbloquear el visor y proceder con la eliminación.'
                    : 'Yes. Upon loading an encrypted PDF, an inline key widget will appear. Enter the open password once to unlock the viewer and proceed with deletion.'
                }
              ].map((faq, idx) => (
                <details 
                  key={idx} 
                  className="group bg-zinc-900/60 border border-white/5 rounded-xl transition-all duration-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-xs sm:text-sm text-white select-none group-hover:text-zinc-200">
                    <span>{faq.q}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0 ml-2" />
                  </summary>
                  <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3 font-sans">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}