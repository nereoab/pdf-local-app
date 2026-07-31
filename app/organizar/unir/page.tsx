'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Merge, CheckCircle2, Lock, Sparkles, Layers, FileText } from 'lucide-react';
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

export default function UnirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfMerger />

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12">

          {/* BLOQUE 1: PRIVACIDAD */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tus PDFs al unirlos en un solo archivo?' : 'What exactly happens to your PDFs when merging them into one file?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • FUSIÓN SIN PÉRDIDA DE CALIDAD • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • LOSSLESS MERGE • 100% LOCAL'}
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
                    ? 'La fusión de PDFs se ejecuta completamente en la memoria RAM de tu navegador usando pdf-lib. Todos los archivos que cargues — facturas, expedientes, contratos, planos — se procesan localmente sin ser transmitidos a ningún servidor externo. La operación es instantánea y 100% privada.'
                    : 'PDF merging runs entirely in your browser RAM using pdf-lib. All files you load — invoices, records, contracts, blueprints — are processed locally without being transmitted to any external server. The operation is instant and 100% private.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Fusión a nivel de árbol de páginas: cero recodificación' : 'Merge at page tree level: zero re-encoding'}
                </strong>
                <p>
                  {isEs
                    ? 'pdf-lib fusiona los documentos combinando sus árboles de páginas (`PageTree`) y diccionarios de recursos en un nuevo documento unificado. Los streams de imágenes, fuentes y vectores se transfieren sin recodificación — garantizando nitidez perfecta en planos, fotos y texto a cualquier zoom.'
                    : 'pdf-lib merges documents by combining their page trees (`PageTree`) and resource dictionaries into a new unified document. Image, font, and vector streams are transferred without re-encoding — guaranteeing perfect sharpness in blueprints, photos, and text at any zoom.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de fusión de PDFs paso a paso' : 'Step-by-step technical PDF merge procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor combina múltiples documentos en un único PDF unificado de alta calidad' : 'How the engine combines multiple documents into a single high-quality unified PDF'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / CARGA', title: isEs ? '1. Deserialización Múltiple' : '1. Multiple Deserialization', desc: isEs ? 'pdf-lib carga y deserializa cada PDF en paralelo en memoria, reconstruyendo los árboles de objetos individuales de cada documento para acceder a sus páginas y recursos.' : 'pdf-lib loads and deserializes each PDF in parallel in memory, reconstructing individual object trees of each document to access its pages and resources.' },
                { step: '02 / ORDENAMIENTO', title: isEs ? '2. Definición del Orden' : '2. Order Definition', desc: isEs ? 'El usuario define el orden de los PDFs mediante arrastrar y soltar en la interfaz. El motor registra la secuencia de documentos y el rango de páginas de cada uno a incluir en el resultado final.' : 'The user defines PDF order by drag-and-drop in the interface. The engine records the document sequence and page range from each one to include in the final result.' },
                { step: '03 / FUSIÓN', title: isEs ? '3. Combinación de PageTrees' : '3. PageTree Combination', desc: isEs ? 'pdf-lib copia las páginas de cada documento al nuevo PDF de destino usando `copyPages()`, que transfiere los streams de contenido, fuentes e imágenes directamente sin ninguna recodificación intermedia.' : 'pdf-lib copies pages from each document to the new destination PDF using `copyPages()`, transferring content streams, fonts, and images directly with no intermediate re-encoding.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. PDF Unificado Listo' : '4. Unified PDF Ready', desc: isEs ? 'Se serializa un nuevo PDF 1.7 estándar con todos los documentos integrados en secuencia. El resultado abre perfectamente en cualquier visor sin pérdida de resolución en ninguna página.' : 'A new standard PDF 1.7 is serialized with all documents integrated in sequence. The result opens perfectly in any viewer with no resolution loss on any page.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">{item.step}</span>
                    <h3 className="font-bold text-white text-sm mb-2 font-sans">{item.title}</h3>
                    <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOQUE 3: CAPACIDADES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Merge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Capacidades avanzadas de fusión de documentos PDF' : 'Advanced PDF document merging capabilities'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Funciones adicionales del motor de fusión para casos de uso complejos' : 'Additional merge engine functions for complex use cases'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Ordenación por Arrastrar y Soltar' : 'Drag-and-Drop Ordering'}
                </strong>
                <p>
                  {isEs
                    ? 'Arrastra los documentos cargados en la lista para definir el orden exacto de combinación. Puedes reordenar en cualquier momento antes de generar el PDF final sin necesidad de volver a cargar los archivos.'
                    : 'Drag loaded documents in the list to define the exact merge order. You can reorder at any time before generating the final PDF without reloading the files.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  {isEs ? 'Selección de Páginas por Archivo' : 'Per-File Page Selection'}
                </strong>
                <p>
                  {isEs
                    ? 'Para cada PDF cargado, puedes seleccionar qué páginas incluir en el resultado final — por ejemplo, tomar solo las páginas 1-3 del primer documento y las páginas 5-10 del segundo, combinando fragmentos específicos en un nuevo archivo.'
                    : 'For each loaded PDF, you can select which pages to include in the final result — for example, taking only pages 1-3 from the first document and pages 5-10 from the second, combining specific fragments into a new file.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Sin Límite de Archivos' : 'No File Limit'}
                </strong>
                <p>
                  {isEs
                    ? 'Une tantos PDFs como necesites en un solo resultado — desde 2 hasta cientos de documentos. El límite práctico lo define la memoria RAM disponible en tu equipo, no restricciones artificiales del servicio.'
                    : 'Merge as many PDFs as you need into a single result — from 2 to hundreds of documents. The practical limit is defined by the available RAM on your machine, not artificial service restrictions.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios del PDF unificado resultante' : 'Benefits of the resulting unified PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad, privacidad y compatibilidad garantizadas en el archivo fusionado' : 'Quality, privacy, and compatibility guaranteed in the merged file'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Nitidez 100% Preservada' : '100% Sharpness Preserved', desc: isEs ? 'Imágenes, planos y texto preservan exactamente la misma resolución que los originales.' : 'Images, blueprints, and text preserve exactly the same resolution as the originals.' },
                { title: isEs ? 'Fuentes y Tipografías Intactas' : 'Fonts & Typography Intact', desc: isEs ? 'Las fuentes de cada PDF se transfieren directamente sin sustituirlas por alternativas similares.' : 'Fonts from each PDF are transferred directly without substituting similar alternatives.' },
                { title: isEs ? 'Marcadores y Metadatos' : 'Bookmarks & Metadata', desc: isEs ? 'Se preservan los marcadores de capítulos y el metadato de título de cada documento original.' : 'Chapter bookmarks and title metadata of each original document are preserved.' },
                { title: isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible', desc: isEs ? 'El PDF unificado abre correctamente en Adobe, Chrome, Edge, Foxit, iOS y Android.' : 'The unified PDF opens correctly in Adobe, Chrome, Edge, Foxit, iOS, and Android.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Fusiona documentos de cualquier tamaño y número de páginas sin restricciones artificiales.' : 'Merge documents of any size and page count without artificial restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. La fusión ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Merging happens completely in your local RAM.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold text-xs block mb-1 font-sans">{item.title}</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
