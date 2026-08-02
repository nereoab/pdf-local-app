'use client';

import dynamic from 'next/dynamic';
import { Loader2, Scissors, AlertTriangle, ShieldCheck, HelpCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfSplitter = dynamic(() => import('@/components/PdfSplitter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para dividir archivos PDF...</p>
    </div>
  ),
});

export default function Page() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfSplitter />

        {/* ── SECCIONES DE INFORMACIÓN EN ESTILO EXACTO DE COMPRIMIR ── */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* ── SECCIÓN 1: CÓMO DIVIDIR UN PDF ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo dividir un PDF' : '1. How to split a PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              {[
                {
                  step: '01',
                  es: 'Sube tu archivo PDF a la zona de carga.',
                  en: 'Upload your PDF to the upload zone.'
                },
                {
                  step: '02',
                  es: 'Selecciona la pestaña de división: por Rangos, Páginas o Tamaño.',
                  en: 'Select the split mode tab: by Ranges, Pages, or Size.'
                },
                {
                  step: '03',
                  es: 'Configura los intervalos, prefijos de archivo o empaquetado en .ZIP.',
                  en: 'Configure intervals, file prefixes, or .ZIP packaging.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Dividir Documento →" y descarga las partes generadas.',
                  en: 'Click "Split Document →" and download the generated parts.'
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
                  isEs ? 'Extraer páginas específicas para crear nuevos documentos independientes.' : 'Extract specific pages to create independent new documents.',
                  isEs ? 'Dividir automáticamente cada N páginas o por intervalos personalizados.' : 'Split automatically every N pages or by custom intervals.',
                  isEs ? 'Empaquetar múltiples archivos extraídos en un paquete comprimido .ZIP.' : 'Package multiple extracted files into a compressed .ZIP archive.',
                  isEs ? 'Re-numerar las páginas resultantes en el pie de página de forma automática.' : 'Automatically re-number resulting pages in the page footer.',
                  isEs ? 'Personalizar metadatos (Título, Autor, Asunto) en cada archivo dividido.' : 'Customize metadata (Title, Author, Subject) in each split file.'
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
                  isEs ? 'Ideal para separar capítulos, contratos o facturas individuales de un lote.' : 'Ideal for separating chapters, contracts, or individual invoices from a batch.',
                  isEs ? 'Las páginas extraídas conservan la calidad vectorial original sin recodificación.' : 'Extracted pages retain original vector quality without re-encoding.',
                  isEs ? 'Usa formato .ZIP para descargar múltiples partes en un único clic.' : 'Use .ZIP format to download multiple parts in a single click.',
                  isEs ? 'Si tu PDF tiene clave, puedes ingresarla inline en la tarjeta para desbloquearlo.' : 'If your PDF has a password, enter it inline on the card to unlock it.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: ¿QUÉ SUCEDE CON TU DOCUMENTO AL DIVIDIRLO? ── */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al dividirlo?' : '3. What happens to your document when splitting it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">💻 {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'La extracción se ejecuta en la RAM de tu navegador usando Web Workers. Tus documentos nunca salen de tu equipo.' : 'Extraction runs inside your browser RAM using Web Workers. Your documents never leave your device.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">✂️ {isEs ? 'Extracción nativa sin pérdida' : 'Lossless native extraction'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Páginas extraídas directamente con copyPages(). Calidad, texto vectorial y resolución permanecen 100% intactos.' : 'Pages extracted directly with copyPages(). Quality, vector text, and resolution remain 100% intact.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Los fragmentos PDF o archivos .ZIP se compilan localmente. Tu documento original nunca se altera.' : 'PDF fragments or .ZIP files are compiled locally. Your original document is never altered.'}
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
                    ? 'Respuestas detalladas sobre la división de PDF, descarga en .ZIP y seguridad de datos en Web Worker'
                    : 'Detailed answers about PDF splitting, .ZIP downloads, and Web Worker data security'}
                </p>
              </div>
            </div>

            <div className="space-y-3 font-sans">
              {[
                {
                  qEs: '¿Cómo funciona la división de PDF por rangos de páginas?',
                  qEn: 'How does page range PDF splitting work?',
                  aEs: 'Puedes definir intervalos exactos (por ejemplo, página 1 a 5, página 6 a 12). El motor generará un archivo PDF independiente por cada rango o unificará todos los rangos en un solo PDF segun lo indiques.',
                  aEn: 'You can specify exact intervals (e.g. page 1 to 5, page 6 to 12). The engine generates an independent PDF file for each range or merges all ranges into a single PDF as requested.'
                },
                {
                  qEs: '¿Se reduce la nitidez del texto o gráficos al dividir las páginas?',
                  qEn: 'Does text or graphic sharpness degrade when splitting pages?',
                  aEs: 'No. El proceso de corte copia nativamente los objetos vectoriales de las páginas seleccionadas (copyPages), por lo que las fuentes, líneas e imágenes conservan la misma calidad original sin compresión destructiva.',
                  aEn: 'No. The splitting process natively copies vector objects of selected pages (copyPages), so fonts, lines, and images maintain the exact original quality without destructive compression.'
                },
                {
                  qEs: '¿Mis archivos PDF se envían a servidores remotos al dividir?',
                  qEn: 'Are my PDF files sent to remote servers when splitting?',
                  aEs: 'No. Toda la extracción de páginas, empaquetado .ZIP y estampado de metadatos se ejecuta 100% localmente en tu propio dispositivo utilizando un Web Worker en segundo plano. Privacidad total garantizada.',
                  aEn: 'No. All page extraction, .ZIP packaging, and metadata stamping run 100% locally inside your device using a background Web Worker. Total privacy guaranteed.'
                },
                {
                  qEs: '¿Qué puedo hacer si el PDF que quiero dividir tiene contraseña?',
                  qEn: 'What can I do if the PDF I want to split is password protected?',
                  aEs: 'La herramienta detectará automáticamente la protección e indicará una alerta. Ingresa la contraseña en la tarjeta del archivo para desbloquear la vista previa y proceder a dividir las páginas normalmente.',
                  aEn: 'The tool will automatically detect protection and display an alert. Enter the password on the file card to unlock the preview and proceed with page splitting normally.'
                },
                {
                  qEs: '¿Puedo empaquetar todas las partes divididas en un archivo .ZIP?',
                  qEn: 'Can I package all split parts into a single .ZIP file?',
                  aEs: 'Sí. En las Opciones Avanzadas del panel de control puedes marcar la opción de empaquetar en .ZIP para descargar todas las partes generadas en un único archivo comprimido.',
                  aEn: 'Yes. In the Advanced Options of the control panel you can check the .ZIP packaging option to download all generated parts in a single compressed archive.'
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