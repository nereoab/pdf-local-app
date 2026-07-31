'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, FileText, CheckCircle2, Lock, Sparkles, Layers, AlignLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const TextPdfConverter = dynamic(() => import('@/components/TextPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para convertir PDF a Texto / Texto a PDF...</p>
    </div>
  ),
});

export default function PdfToTextPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <TextPdfConverter defaultMode="pdf-to-text" />

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
                  {isEs ? '¿Qué sucede al extraer el texto de un PDF a formato TXT?' : 'What happens when extracting text from a PDF to TXT format?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • EXTRACCIÓN DE OPERADORES PDF NATIVA • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • NATIVE PDF OPERATOR EXTRACTION • 100% LOCAL'}
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
                    ? 'La extracción de texto a TXT/PDF se ejecuta completamente en la memoria RAM de tu navegador mediante pdf.js. Tus documentos — reportes jurídicos, transcripciones, manuales técnicos — se procesan localmente sin ser enviados a ningún servidor externo. Todo el procesamiento es instantáneo y completamente privado.'
                    : 'Text-to-TXT/PDF extraction runs entirely in your browser RAM using pdf.js. Your documents — legal reports, transcripts, technical manuals — are processed locally without being sent to any external server. All processing is instant and completely private.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Extracción directa de operadores de texto PDF (`Tj`, `TJ`, `\'`)' : 'Direct extraction from PDF text operators (`Tj`, `TJ`, `\'`)'}
                </strong>
                <p>
                  {isEs
                    ? 'pdf.js accede al stream de contenido de cada página y evalúa los operadores de texto PDF (`Tj`, `TJ`, `\'` y `"`) que definen cada fragmento de texto con sus coordenadas de posición. El texto se extrae en el orden de renderizado natural de la página — de arriba a abajo y de izquierda a derecha — y se concatena respetando saltos de línea y párrafo.'
                    : 'pdf.js accesses each page content stream and evaluates PDF text operators (`Tj`, `TJ`, `\'` and `"`) that define each text fragment with its position coordinates. Text is extracted in the natural page render order — top to bottom and left to right — and concatenated respecting line breaks and paragraphs.'}
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
                  {isEs ? 'El procedimiento técnico de extracción y conversión de texto paso a paso' : 'Step-by-step text extraction and conversion technical procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo pdf.js evalúa los operadores PDF y reconstruye el flujo de texto del documento' : 'How pdf.js evaluates PDF operators and reconstructs the document text flow'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / ANÁLISIS', title: isEs ? '1. Deserialización del PDF' : '1. PDF Deserialization', desc: isEs ? 'pdf.js carga el documento PDF en memoria y deserializa el árbol de objetos, accediendo al stream de contenido de cada página para leer los operadores de renderizado incluyendo los de texto (`BT...ET`).' : 'pdf.js loads the PDF document into memory and deserializes the object tree, accessing each page content stream to read rendering operators including text operators (`BT...ET`).' },
                { step: '02 / EXTRACCIÓN', title: isEs ? '2. Evaluación de Operadores' : '2. Operator Evaluation', desc: isEs ? 'El evaluador de operadores de pdf.js procesa cada instrucción de texto: `Tf` (fuente/tamaño), `Td`/`TD`/`Tm` (posición), `Tj`/`TJ` (contenido de texto). Cada fragmento se registra con sus coordenadas Y para ordenación vertical.' : 'The pdf.js operator evaluator processes each text instruction: `Tf` (font/size), `Td`/`TD`/`Tm` (position), `Tj`/`TJ` (text content). Each fragment is recorded with its Y coordinates for vertical ordering.' },
                { step: '03 / RECONSTRUCCIÓN', title: isEs ? '3. Orden Natural de Lectura' : '3. Natural Reading Order', desc: isEs ? 'Los fragmentos se ordenan por coordenada Y (línea de texto) y X (posición horizontal) para reconstruir el flujo de lectura natural. Se detectan párrafos midiendo la distancia vertical entre líneas consecutivas — distancias mayores indican salto de párrafo.' : 'Fragments are sorted by Y coordinate (text line) and X coordinate (horizontal position) to reconstruct the natural reading flow. Paragraphs are detected by measuring vertical distance between consecutive lines — greater distances indicate paragraph break.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. TXT o PDF de Texto Plano' : '4. TXT or Plain Text PDF', desc: isEs ? 'El texto reconstruido se exporta como archivo TXT con codificación UTF-8, o como nuevo PDF de texto puro usando pdf-lib — generando un documento ligero, buscable, con fuente monoespacio estándar para archivado limpio.' : 'Reconstructed text is exported as UTF-8 encoded TXT file, or as a new pure text PDF using pdf-lib — generating a lightweight, searchable document with standard monospace font for clean archiving.' },
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

          {/* BLOQUE 3: FORMATOS Y OPCIONES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <AlignLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Formatos de exportación y opciones de texto' : 'Export formats and text options'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Configuraciones disponibles para adaptar la extracción a cada caso de uso' : 'Available configurations to adapt extraction to each use case'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Exportación como TXT (UTF-8)' : 'Export as TXT (UTF-8)'}
                </strong>
                <p>
                  {isEs
                    ? 'Extrae el texto completo del PDF a un archivo TXT con codificación UTF-8 — compatible con todos los editores de texto (VS Code, Notepad++, Sublime Text), herramientas de análisis de datos, scripts Python, pipelines NLP y motores de búsqueda de texto completo.'
                    : 'Extract complete PDF text to a UTF-8 encoded TXT file — compatible with all text editors (VS Code, Notepad++, Sublime Text), data analysis tools, Python scripts, NLP pipelines, and full-text search engines.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  {isEs ? 'Texto → PDF de Alta Legibilidad' : 'Text → High-Readability PDF'}
                </strong>
                <p>
                  {isEs
                    ? 'Convierte archivos TXT o texto pegado a un PDF limpio y buscable con tipografía monoespacio, márgenes estándar y paginación automática. Ideal para archivar logs de sistema, transcripciones de reuniones, notas técnicas o cualquier texto plano en formato PDF profesional.'
                    : 'Convert TXT files or pasted text to a clean searchable PDF with monospace typography, standard margins, and automatic pagination. Ideal for archiving system logs, meeting transcripts, technical notes, or any plain text in professional PDF format.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Extracción por Rango de Páginas' : 'Page Range Extraction'}
                </strong>
                <p>
                  {isEs
                    ? 'Extrae el texto de todas las páginas o define un rango específico — por ejemplo, solo el capítulo 3 de un libro o los artículos 5-12 de un contrato extenso. El texto resultante incluye separadores de página para identificar el origen de cada sección en el documento original.'
                    : 'Extract text from all pages or define a specific range — for example, only chapter 3 of a book or articles 5-12 of an extensive contract. Resulting text includes page separators to identify the origin of each section in the original document.'}
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
                  {isEs ? 'Beneficios de la conversión PDF ↔ Texto' : 'Benefits of PDF ↔ Text conversion'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Utilidad, compatibilidad y privacidad del texto extraído o del PDF generado' : 'Utility, compatibility, and privacy of extracted text or generated PDF'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Texto UTF-8 Puro' : 'Pure UTF-8 Text', desc: isEs ? 'El TXT resultante es texto plano UTF-8 universal — compatible con cualquier sistema operativo, editor o herramienta de análisis.' : 'The resulting TXT is universal UTF-8 plain text — compatible with any OS, editor, or analysis tool.' },
                { title: isEs ? 'Ideal para NLP y IA' : 'Ideal for NLP & AI', desc: isEs ? 'El texto extraído es perfecto como insumo para modelos de lenguaje, análisis de sentimientos y pipelines de procesamiento NLP.' : 'Extracted text is perfect as input for language models, sentiment analysis, and NLP processing pipelines.' },
                { title: isEs ? 'Texto Completo Multi-Página' : 'Full Multi-Page Text', desc: isEs ? 'Extrae el texto completo de documentos de cientos de páginas en un único archivo TXT estructurado.' : 'Extract complete text from documents with hundreds of pages into a single structured TXT file.' },
                { title: isEs ? 'Preservación de Párrafos' : 'Paragraph Preservation', desc: isEs ? 'El algoritmo de extracción respeta los saltos de párrafo y línea naturales del documento original.' : 'The extraction algorithm respects the natural paragraph and line breaks of the original document.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Extrae el texto de documentos de cualquier extensión sin restricciones artificiales de tamaño.' : 'Extract text from documents of any length without artificial size restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. La extracción ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Extraction happens completely in your local RAM.' },
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
