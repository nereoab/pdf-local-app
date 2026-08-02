'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Hash, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfFoliador = dynamic(() => import('@/components/PdfFoliador'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para foliar páginas PDF...</p>
    </div>
  )
});

export default function FoliarPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfFoliador />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo añadir numeración a un PDF' : '1. How to add page numbers'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu archivo PDF arrastrándolo a la zona de carga. Las miniaturas se cargarán en una cuadrícula 4x4.',
                  en: 'Upload your PDF by dragging it to the upload zone. Thumbnails will load in a 4x4 grid.'
                },
                {
                  step: '02',
                  es: 'Selecciona la posición mediante la matriz 3x3 (punto rojo animado en vivo sobre las miniaturas).',
                  en: 'Select position using the 3x3 matrix (live animated red dot over page thumbnails).'
                },
                {
                  step: '03',
                  es: 'Elige el formato de numeración: números arábigos (1, 2), romanos (I, II) o "Página X de N".',
                  en: 'Choose numbering format: arabic (1, 2), roman (I, II), or "Page X of N".'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Añadir números de página →" para procesar con Web Worker y descargar el PDF.',
                  en: 'Click "Add page numbers →" to process with Web Worker and download your PDF.'
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
                  isEs ? 'Numerar todas las páginas o definir un rango específico (ej: 3 a 15).' : 'Number all pages or set a specific range (e.g., 3 to 15).',
                  isEs ? 'Elegir entre números arábigos, romanos (I, II), con ceros (01, 02) o texto libre.' : 'Choose between arabic, roman (I, II), zero-padded (01, 02), or free text.',
                  isEs ? 'Ubicar el número en cualquiera de las 9 posiciones del documento.' : 'Place the number in any of the 9 page positions.',
                  isEs ? 'Omitir automáticamente la numeración en la primera página (Portada).' : 'Skip numbering automatically on page 1 (Cover).',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de foliar.' : 'Unlock password-protected PDFs before numbering.'
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
                  isEs ? 'Ideal para documentos legales, expedientes judiciales y informes corporativos.' : 'Ideal for legal documents, court files, and corporate reports.',
                  isEs ? 'Usa el formato "Página X de N" para expedientes que se imprimirán.' : 'Use "Page X of N" format for files to be printed.',
                  isEs ? 'El archivo original se mantiene seguro e intacto en tu equipo.' : 'Original file stays safe and untouched on your device.',
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
                {isEs ? '3. ¿Qué sucede con tu documento al foliarlo?' : '3. What happens to your document when numbering?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Web Worker' : '100% Local Web Worker Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'El estampado vectorial de folios se ejecuta en la RAM de tu navegador sin subirse a ningún servidor.' : 'Vector folio stamping runs in browser RAM without uploading to servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔢 {isEs ? 'Numeración como Texto Real' : 'Real Vector Text Numbering'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Los números se integran como texto seleccionable y nítido a cualquier nivel de zoom.' : 'Numbers integrate as crisp selectable text at any zoom level.'}
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
                  q: isEs ? '¿Puedo empezar a contar desde un número distinto de 1?' : 'Can I start counting from a number other than 1?',
                  a: isEs 
                    ? 'Sí. En el campo "Primer número" dentro de las Opciones Avanzadas puedes indicar cualquier valor inicial (ej: empezar en el folio 50).'
                    : 'Yes. In the "First number" field in Advanced Options you can set any starting value (e.g. start at folio 50).'
                },
                {
                  q: isEs ? '¿Es posible foliar solo un rango de páginas sin afectar la portada?' : 'Is it possible to number only a page range without touching cover?',
                  a: isEs
                    ? 'Sí. Puedes marcar la opción "Omitir numeración en 1ª página" o especificar un rango como "Desde pág 2 hasta 20".'
                    : 'Yes. You can check "Skip numbering on page 1" or specify a range like "From page 2 to 20".'
                },
                {
                  q: isEs ? '¿Mis documentos o datos se envían a algún servidor?' : 'Are my documents or data sent to any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento se realiza 100% en tu navegador usando Web Workers. Ningún byte sale de tu equipo.'
                    : 'No. All processing happens 100% inside your browser using Web Workers. No bytes leave your machine.'
                },
                {
                  q: isEs ? '¿Puedo foliar un PDF protegido con contraseña?' : 'Can I number a password-protected PDF?',
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