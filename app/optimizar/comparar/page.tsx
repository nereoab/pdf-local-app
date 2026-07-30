'use client';

import PdfComparator from '../../../components/PdfComparator';
import { useLanguage } from '../../../context/LanguageContext';
import { ShieldCheck, Cpu, GitCompare, CheckCircle2, Lock, Sparkles, Layers, FileCheck } from 'lucide-react';

export default function CompararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">

        {/* HERRAMIENTA INTERACTIVA */}
        <div className="mb-16">
          <PdfComparator />
        </div>

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12">

          {/* BLOQUE 1: PRIVACIDAD Y QUÉ SUCEDE CON SUS ARCHIVOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tus archivos al compararlos?' : 'What exactly happens to your files when compared?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • COMPARACIÓN 100% LOCAL • SIN SERVIDORES' : '🔒 ABSOLUTE PRIVACY • 100% LOCAL COMPARISON • ZERO SERVERS'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tus documentos nunca salen de tu dispositivo' : 'Your documents never leave your device'}
                </strong>
                <p>
                  {isEs
                    ? 'Ambos archivos PDF se cargan y procesan exclusivamente en la memoria RAM de tu navegador. El análisis semántico de texto, la extracción de páginas y la generación del reporte de diferencias ocurren en tiempo real sin que ningún byte de tus documentos abandone tu equipo local.'
                    : 'Both PDF files are loaded and processed exclusively in your browser RAM. Semantic text analysis, page extraction, and difference report generation happen in real time without any document bytes leaving your local machine.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Análisis sin rastro — memoria purga al cerrar' : 'Traceless analysis — memory purges on close'}
                </strong>
                <p>
                  {isEs
                    ? 'Una vez completado el análisis y descargado el reporte, toda la memoria se libera. Al cerrar la pestaña, el navegador elimina completamente los buffers de ambos documentos, garantizando que contratos confidenciales, versiones de documentos legales o archivos financieros no dejen ningún rastro.'
                    : 'Once analysis completes and the report is downloaded, all memory is freed. Closing the tab completely purges both document buffers, ensuring confidential contracts, legal document versions, or financial files leave no trace.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de comparación paso a paso' : 'Step-by-step technical comparison procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor detecta y visualiza diferencias entre dos versiones de un PDF' : 'How our engine detects and visualizes differences between two PDF versions'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / EXTRACCIÓN</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Extracción de Texto por Página' : '1. Per-Page Text Extraction'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Usamos pdfjs-dist para extraer el texto de cada página de ambos documentos en estructuras de tokens con posición, fuente y tamaño, preservando el orden de lectura real para una comparación semántica precisa.'
                      : 'Uses pdfjs-dist to extract text from each page of both documents into token structures with position, font, and size, preserving actual reading order for precise semantic comparison.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / DIFF</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Algoritmo Diff Semántico' : '2. Semantic Diff Algorithm'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Aplicamos el algoritmo diff de Myers (O(ND)) sobre los tokens de texto extraídos para identificar adiciones, eliminaciones y sustituciones de palabras, oraciones y párrafos enteros entre las dos versiones.'
                      : 'Applies the Myers O(ND) diff algorithm on extracted text tokens to identify additions, deletions, and substitutions of words, sentences, and entire paragraphs between both versions.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / VISUALIZACIÓN</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Resaltado Rojo / Verde' : '3. Red / Green Highlight'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Las diferencias detectadas se visualizan con resaltado rojo (contenido eliminado en el original) y verde (contenido nuevo en la versión modificada), con scroll sincronizado entre ambos visores para una auditoría ágil.'
                      : 'Detected differences are visualized with red highlights (content deleted from original) and green (new content in modified version), with synced scroll between both viewers for fast auditing.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">04 / REPORTE</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '4. Exportación del Reporte de Auditoría' : '4. Audit Report Export'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Genera un reporte estructurado con el desglose por página de cada cambio detectado — inserción, eliminación o sustitución — con contexto de texto, número de página y tipo de modificación.'
                      : 'Generates a structured report with a per-page breakdown of each detected change — insertion, deletion, or substitution — with text context, page number, and modification type.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* BLOQUE 3: EL MOTOR DE COMPARACIÓN VISUAL */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El Motor Visual: ¿Cómo detecta cambios de diseño y superposición?' : 'The Visual Engine: How does it detect layout and overlay changes?'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Tecnología de comparación por Canvas 2D y diferencia de píxeles entre páginas renderizadas' : 'Canvas 2D comparison and pixel-difference technology between rendered pages'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-white" />
                  {isEs ? 'Renderizado Canvas de Alta Definición' : 'High-Definition Canvas Rendering'}
                </strong>
                <p>
                  {isEs
                    ? 'Cada página de ambos PDFs se renderiza sobre un Canvas 2D a escala 2.0x DPI usando pdfjs-dist. Esto garantiza que diferencias sutiles en imágenes, logotipos, esquemas técnicos o firmas digitalizadas sean visibles con máxima nitidez.'
                    : 'Each page from both PDFs is rendered onto a 2D Canvas at 2.0x DPI scale via pdfjs-dist. This ensures subtle differences in images, logos, technical schematics, or scanned signatures are visible with maximum sharpness.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-white" />
                  {isEs ? 'Modo Superposición con Opacidad' : 'Overlay Mode with Opacity'}
                </strong>
                <p>
                  {isEs
                    ? 'En modo superposición, el motor dibuja el PDF original con 50% de opacidad sobre el modificado, generando un efecto de "fantasma" que hace inmediatamente visibles los desplazamientos de márgenes, cambios de maquetación o elementos añadidos/removidos.'
                    : 'In overlay mode, the engine draws the original PDF at 50% opacity over the modified one, creating a ghost effect that immediately reveals margin shifts, layout changes, or added/removed elements.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Scroll Sincronizado entre Paneles' : 'Synchronized Scroll Between Panels'}
                </strong>
                <p>
                  {isEs
                    ? 'La función de sincronización de scroll alinea automáticamente la posición vertical de ambos visores, de modo que puedes comparar página por página manteniendo la misma posición de lectura en ambos documentos de forma simultánea.'
                    : 'The scroll synchronization feature automatically aligns the vertical position of both viewers, so you can compare page by page while keeping the same reading position in both documents simultaneously.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS DEL ANÁLISIS DE COMPARACIÓN */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <GitCompare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios del análisis de comparación de PDFs' : 'Benefits of the PDF comparison analysis'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Usos y ventajas del motor de auditoría de documentos' : 'Uses and advantages of the document audit engine'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Auditoría de Contratos' : 'Contract Auditing'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Detecta cláusulas modificadas, montos alterados o condiciones insertadas en contratos.' : 'Detects modified clauses, altered amounts, or inserted conditions in contracts.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Control de Versiones de Documentos' : 'Document Version Control'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Compara revisiones de manuales técnicos, normativas o especificaciones de producto.' : 'Compare revisions of technical manuals, regulations, or product specifications.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Reporte Estructurado Descargable' : 'Downloadable Structured Report'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Exporta un historial completo de cambios por página para revisión o firma.' : 'Export a complete per-page change history for review or signature.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Detección de Cambios Visuales' : 'Visual Change Detection'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Modo superposición detecta alteraciones en imágenes, logotipos o diseño de página.' : 'Overlay mode detects alterations in images, logos, or page layout.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Scroll Sincronizado' : 'Synchronized Scroll'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Ambos visores se mueven juntos para una revisión fluida página por página.' : 'Both viewers scroll together for smooth page-by-page review.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Privacidad Corporativa Total' : 'Total Corporate Privacy'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Cero bytes enviados a servidores. Ambos documentos se comparan en tu RAM local.' : 'Zero bytes sent to servers. Both documents are compared in your local RAM.'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
