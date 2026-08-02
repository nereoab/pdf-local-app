'use client';

import dynamic from 'next/dynamic';
import { Loader2, Merge, AlertTriangle, ShieldCheck, HelpCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfMerger = dynamic(() => import('@/components/PdfMerger'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para unir archivos PDF...</p>
    </div>
  ),
});

export default function Page() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfMerger />

        {/* ── SECCIONES DE INFORMACIÓN EN ESTILO EXACTO ── */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* ── SECCIÓN 1: CÓMO UNIR AN PDF ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Merge className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo unir un PDF' : '1. How to merge a PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              {[
                {
                  step: '01',
                  es: 'Sube tus archivos PDF a la zona de carga.',
                  en: 'Upload your PDF files to the upload zone.'
                },
                {
                  step: '02',
                  es: 'Arrastra y suelta documentos en la lista para definir el orden.',
                  en: 'Drag and drop documents in the list to define the order.'
                },
                {
                  step: '03',
                  es: 'Configura separadores, numeración, rotación y metadatos.',
                  en: 'Configure separators, numbering, rotation, and metadata.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Unir PDFs →" y descarga el archivo unificado.',
                  en: 'Click "Merge PDFs →" and download the unified file.'
                }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {isEs ? item.es : item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 2: LIMITACIONES Y CONSEJOS ÚTILES ── */}
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
                  isEs ? 'Unir múltiples archivos PDF en un solo documento.' : 'Merge multiple PDF files into one document.',
                  isEs ? 'Reordenar documentos arrastrando y soltando en la cuadrícula.' : 'Reorder documents by dragging and dropping in the grid.',
                  isEs ? 'Inspeccionar páginas individuales para rotar (90°) o excluirlas.' : 'Inspect individual pages to rotate (90°) or exclude them.',
                  isEs ? 'Insertar páginas en blanco o carátulas como separadores.' : 'Insert blank pages or cover sheets as separators.',
                  isEs ? 'Añadir numeración continua, modo dúplex y personalizar metadatos.' : 'Add continuous numbering, duplex mode, and customize metadata.'
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
                  isEs ? 'Ideal para combinar facturas, expedientes o informes en un solo archivo.' : 'Ideal for combining invoices, records, or reports into one file.',
                  isEs ? 'Sin límite de archivos. El límite lo define la RAM de tu equipo.' : 'No file limit. The limit is defined by your device RAM.',
                  isEs ? 'La fusión preserva calidad original vectorial sin recodificación destructiva.' : 'Merging preserves original vector quality without destructive re-encoding.',
                  isEs ? 'Si un PDF tiene contraseña, puedes desbloquearlo inline ingresando la clave.' : 'If a PDF has a password, you can unlock it inline by entering the key.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: ¿QUÉ SUCEDE CON TU DOCUMENTO AL UNIRLO? ── */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al unirlo?' : '3. What happens to your document when merging it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">💻 {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'La fusión se ejecuta en la RAM de tu navegador mediante Web Worker. Tus documentos nunca salen de tu equipo.' : 'Merging runs inside your browser RAM via Web Worker. Your documents never leave your device.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📄 {isEs ? 'Fusión sin pérdida de calidad' : 'Lossless page merge'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Documentos combinados con copyPages(). Imágenes, fuentes y vectores permanecen 100% intactos.' : 'Documents combined with copyPages(). Images, fonts, and vectors remain 100% intact.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'El PDF unificado se genera localmente. Tus archivos originales no se modifican ni almacenan.' : 'The unified PDF is generated locally. Your original files are not modified or stored.'}
                </p>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: PREGUNTAS FRECUENTES (FAQ) ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isEs ? '4. Preguntas frecuentes (FAQ)' : '4. Frequently Asked Questions (FAQ)'}
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {isEs
                    ? 'Respuestas claras sobre la unión de documentos, privacidad local y rendimiento con Web Workers'
                    : 'Clear answers about document merging, local privacy, and performance with Web Workers'}
                </p>
              </div>
            </div>

            <div className="space-y-3 font-sans">
              {[
                {
                  qEs: '¿Existe un límite de archivos o peso para unir PDFs?',
                  qEn: 'Is there a file count or size limit for merging PDFs?',
                  aEs: 'No imponemos límites arbitrarios. Puedes unir cuantos PDFs necesites en un solo proceso. El único límite es la memoria RAM disponible en tu navegador web.',
                  aEn: 'We impose no arbitrary limits. You can merge as many PDFs as needed in a single run. The only limit is your browser available RAM.'
                },
                {
                  qEs: '¿La calidad del texto o imágenes disminuye al combinar los documentos?',
                  qEn: 'Does text or image quality decrease when combining documents?',
                  aEs: 'No. El proceso de unión extrae y copia directamente la estructura vectorial nativa de cada página (copyPages), conservando al 100% la nitidez de fuentes, gráficos e imágenes originales.',
                  aEn: 'No. The merging process directly extracts and copies the native vector structure of each page (copyPages), keeping 100% original sharpness of fonts, graphics, and images.'
                },
                {
                  qEs: '¿Mis archivos PDF se envían a algún servidor externo durante la unión?',
                  qEn: 'Are my PDF files sent to any external server during merging?',
                  aEs: 'No. Toda la combinación de páginas, estampado de numeración y generación del archivo se ejecuta 100% localmente en tu propio dispositivo mediante un Web Worker de segundo plano. Tus documentos nunca viajan por Internet.',
                  aEn: 'No. All page combining, page numbering, and file generation run 100% locally inside your device using a background Web Worker. Your documents never travel over the Internet.'
                },
                {
                  qEs: '¿Qué puedo hacer si uno de mis PDFs tiene contraseña de protección?',
                  qEn: 'What can I do if one of my PDFs has open password protection?',
                  aEs: 'La herramienta detectará automáticamente el bloqueo y mostrará una alerta en la tarjeta del archivo. Puedes ingresar la contraseña en el campo inline para desbloquearlo y añadirlo a la fusión inmediatamente.',
                  aEn: 'The tool will automatically detect the lock and show an alert on the file card. You can enter the password in the inline field to unlock and include it in the merge immediately.'
                },
                {
                  qEs: '¿Puedo elegir o rotar páginas específicas de un archivo antes de unirlos?',
                  qEn: 'Can I pick or rotate specific pages from a file before merging?',
                  aEs: 'Sí. Haz clic en el botón "Páginas" de cualquier tarjeta para abrir el visor interactivo. Allí podrás rotar páginas a 90° o desmarcar las páginas que desees excluir de la combinación final.',
                  aEn: 'Yes. Click the "Pages" button on any card to open the interactive inspector. There you can rotate pages by 90° or uncheck pages you wish to exclude from the final merge.'
                }
              ].map((faq, i) => (
                <details key={i} className="group bg-zinc-900/60 border border-white/5 rounded-xl transition-all duration-200 hover:border-white/15">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-xs font-bold text-white select-none">
                    <span className="flex items-center gap-2.5">
                      <span className="text-zinc-400 font-mono text-[11px] font-normal">0{i + 1}.</span>
                      {isEs ? faq.qEs : faq.qEn}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform duration-200 group-open:rotate-180 flex-shrink-0" />
                  </summary>
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 border-t border-white/5 leading-relaxed font-sans mt-1">
                    {isEs ? faq.aEs : faq.aEn}
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