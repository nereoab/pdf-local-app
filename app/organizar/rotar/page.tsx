'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, RotateCw, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfRotator = dynamic(() => import('@/components/PdfRotator'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para rotar páginas PDF...</p>
    </div>
  )
});

export default function RotarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfRotator />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <RotateCw className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo rotar páginas de un PDF' : '1. How to rotate PDF pages'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu documento PDF. Las miniaturas se cargarán en una cuadrícula 4x4 interactiva.',
                  en: 'Upload your PDF document. Thumbnails will load in an interactive 4x4 grid.'
                },
                {
                  step: '02',
                  es: 'Usa los botones de rotación individual (+90°, -90°) en cada tarjeta o la rotación masiva.',
                  en: 'Use individual rotation buttons (+90°, -90°) on each card or mass rotation.'
                },
                {
                  step: '03',
                  es: 'Aplica el filtro "Normalizar Horizontales" para orientar automáticamente planos o escaneos A3.',
                  en: 'Apply "Normalize Landscapes" filter to auto-orient blueprints or A3 scans.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Guardar Cambios y Rotar PDF →" para procesar y descargar tu documento.',
                  en: 'Click "Save Changes & Rotate PDF →" to process and download your document.'
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
                  isEs ? 'Rotar hojas individualmente a 90°, 180° y 270°.' : 'Rotate sheets individually to 90°, 180°, and 270°.',
                  isEs ? 'Girar todo el documento con rotación unificada masiva.' : 'Rotate the whole document with mass unified rotation.',
                  isEs ? 'Filtrar y rotar solo páginas impares, pares u horizontales.' : 'Filter and rotate only odd, even, or landscape pages.',
                  isEs ? 'Normalizar hojas horizontales automáticamente en 1-clic.' : 'Normalize landscape sheets automatically in 1-click.',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de rotar.' : 'Unlock password-protected PDFs before rotating.'
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
                  isEs ? 'Ideal para corregir escaneos al revés o planos horizontales.' : 'Ideal for fixing upside-down scans or landscape blueprints.',
                  isEs ? 'La rotación modifica el parámetro /Rotate (100% sin pérdida).' : 'Rotation modifies the /Rotate parameter (100% lossless).',
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
                {isEs ? '3. ¿Qué sucede con tu documento al rotarlo?' : '3. What happens to your document when rotating?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Web Worker' : '100% Local Web Worker Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'La modificación del diccionario del PDF se ejecuta en la RAM de tu navegador sin subirse a ningún servidor.' : 'PDF dictionary modification runs in browser RAM without uploading to servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔄 {isEs ? 'Rotación Lossless Sin Pérdida' : 'Lossless Zero-Quality Loss Rotation'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'No se recodifican imágenes ni texto; únicamente se actualiza el ángulo binario /Rotate de cada página.' : 'Images and text are never re-encoded; only the binary /Rotate angle is updated.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Privacidad e Integridad Garantizada' : 'Privacy & Integrity Guaranteed'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tu archivo original nunca es modificado ni sobrescrito. La descarga genera un nuevo PDF limpio al instante.' : 'Your original file is never modified or overwritten. Download generates a clean new PDF.'}
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
                  q: isEs ? '¿Rotar las páginas afecta la calidad de las imágenes o fuentes?' : 'Does rotating pages affect image or font quality?',
                  a: isEs 
                    ? 'No. La rotación modifica únicamente la etiqueta binaria /Rotate en las especificaciones PDF. No se recodifican vectores ni imágenes, por lo que la calidad es 100% exacta al original.'
                    : 'No. Rotation only modifies the binary /Rotate tag in the PDF spec. Vectors and images are not re-encoded, keeping quality 100% exact.'
                },
                {
                  q: isEs ? '¿Puedo rotar solo páginas específicas usando rangos?' : 'Can I rotate only specific pages using ranges?',
                  a: isEs
                    ? 'Sí. En el campo "Rotación por Texto / Rango" puedes escribir listas como "1, 3, 5-8" para seleccionar solo esas páginas y aplicarles la rotación deseada.'
                    : 'Yes. In the "Range Selection Input" field you can type lists like "1, 3, 5-8" to select those pages and apply rotation.'
                },
                {
                  q: isEs ? '¿Mis documentos o datos se envían a algún servidor?' : 'Are my documents or data sent to any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento se realiza 100% en tu navegador usando Web Workers. Ningún byte sale de tu equipo.'
                    : 'No. All processing happens 100% inside your browser using Web Workers. No bytes leave your machine.'
                },
                {
                  q: isEs ? '¿Puedo rotar páginas de un PDF protegido con contraseña?' : 'Can I rotate pages from a password-protected PDF?',
                  a: isEs
                    ? 'Sí. Al cargar un PDF encriptado, aparecerá un widget inline de clave. Ingresa la contraseña de apertura una vez para desbloquear el visor y proceder.'
                    : 'Yes. Upon loading an encrypted PDF, an inline key widget will appear. Enter the open password once to unlock the viewer and proceed.'
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
