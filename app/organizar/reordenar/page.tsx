'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, LayoutGrid, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfOrganizer = dynamic(() => import('@/components/PdfOrganizer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando organizador de páginas PDF...</p>
    </div>
  )
});

export default function Page() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfOrganizer />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo organizar y reordenar un PDF' : '1. How to reorder PDF pages'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu documento PDF. La mesa de montaje cargará las tarjetas en cuadrícula 4x4.',
                  en: 'Upload your PDF document. The workspace will load cards in a 4x4 grid.'
                },
                {
                  step: '02',
                  es: 'Arrastra y suelta cualquier tarjeta para moverla a una nueva posición en tiempo real.',
                  en: 'Drag and drop any card to move it to a new position in real time.'
                },
                {
                  step: '03',
                  es: 'Aplica herramientas por página (rotar 90°, duplicar, eliminar, insertar blanca) o patrones en 1-clic.',
                  en: 'Apply per-page tools (rotate 90°, duplicate, delete, insert blank) or 1-click patterns.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Guardar Nuevo Orden del PDF →" para descargar el documento reordenado.',
                  en: 'Click "Save New PDF Order →" to download the reordered document.'
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
                  isEs ? 'Reordenar libremente mediante arrastrar y soltar (Drag & Drop).' : 'Reorder freely using Drag & Drop.',
                  isEs ? 'Invertir la secuencia completa o agrupar por impares/pares en 1-clic.' : 'Reverse the entire sequence or group by odds/evens in 1-click.',
                  isEs ? 'Duplicar páginas específicas e insertar hojas en blanco adicionales.' : 'Duplicate specific pages and insert extra blank sheets.',
                  isEs ? 'Mover páginas a posiciones de precisión exactas (#From → #To).' : 'Move pages to exact precision positions (#From → #To).',
                  isEs ? 'Re-numerar automáticamente el pie de página ("Página N / M").' : 'Auto re-number footer pages ("Page N / M").'
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
                  isEs ? 'Ideal para corregir escaneos desordenados o armar compendios.' : 'Ideal for fixing scrambled scans or assembling compendiums.',
                  isEs ? 'Gira todas las páginas simultáneamente con la opción "Girar Todo 90°".' : 'Rotate all pages simultaneously with "Rotate All 90°".',
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
                {isEs ? '3. ¿Qué sucede con tu documento al reordenarlo?' : '3. What happens to your document when reordering?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Web Worker' : '100% Local Web Worker Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'El ensamblado de páginas y rotaciones corren en la memoria RAM de tu navegador sin subirse a ningún servidor.' : 'Page assembly and rotations run in browser RAM without uploading to servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔄 {isEs ? 'Copia Vectorial de Alta Fidelidad' : 'High-Fidelity Vector Copying'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Cada hoja se transfiere mediante copyPages(), preservando nitidez de fuentes, gráficos y firmas intactos.' : 'Each sheet is copied via copyPages(), preserving sharpness of fonts and signatures.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Privacidad e Integridad Garantizada' : 'Privacy & Integrity Guaranteed'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tu archivo original nunca es modificado ni sobrescrito. La descarga genera un nuevo documento limpio al instante.' : 'Your original file is never modified or overwritten. Download generates a clean new document.'}
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
                  q: isEs ? '¿Puedo combinar varios archivos PDF y reordenar sus páginas?' : 'Can I merge multiple PDF files and reorder their pages?',
                  a: isEs 
                    ? 'Sí. Puedes hacer clic en "Añadir más" en la mesa de montaje para cargar archivos PDF adicionales y reorganizar todas sus hojas en un único documento.'
                    : 'Yes. You can click "Add more" on the workspace to upload extra PDF files and reorder all sheets into a single document.'
                },
                {
                  q: isEs ? '¿Cómo funciona la re-numeración automática en el pie de página?' : 'How does automatic footer page re-numbering work?',
                  a: isEs
                    ? 'Si activas la casilla "Re-numerar páginas" en Opciones Avanzadas, cada página del PDF final llevará una marca de agua discreta en el pie con el número consecutivo actualizado.'
                    : 'If you check "Re-number pages" in Advanced Options, each final page will feature a discrete footer watermark with the updated sequence number.'
                },
                {
                  q: isEs ? '¿Mis documentos se almacenan en algún servidor?' : 'Are my documents stored on any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento se ejecuta 100% en tu propio navegador mediante Web Workers. Ningún archivo sale de tu dispositivo.'
                    : 'No. All processing happens 100% inside your own browser using Web Workers. No file leaves your device.'
                },
                {
                  q: isEs ? '¿Puedo reordenar páginas de un PDF protegido con contraseña?' : 'Can I reorder pages from a password-protected PDF?',
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