'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, FileType, CheckCircle2, Lock, Sparkles, Layers, FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const WordPdfConverter = dynamic(() => import('@/components/WordPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ Word...</p>
    </div>
  ),
});

export default function PdfWordPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <WordPdfConverter />

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
                  {isEs ? '¿Qué sucede con tu archivo al convertir entre PDF y Word?' : 'What happens to your file when converting between PDF and Word?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • CONVERSIÓN LOCAL BIDIRECCIONAL • 100% SIN SERVIDOR' : '🔒 ABSOLUTE PRIVACY • LOCAL BIDIRECTIONAL CONVERSION • 100% SERVER-FREE'}
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
                    ? 'La conversión bidireccional entre PDF y Word se ejecuta completamente en la memoria RAM de tu navegador. Tus documentos confidenciales — contratos legales, informes financieros, propuestas comerciales — nunca se transmiten a APIs externas ni servicios en la nube. Todo el procesamiento es local, privado e instantáneo.'
                    : 'Bidirectional PDF and Word conversion runs entirely in your browser RAM. Your confidential documents — legal contracts, financial reports, commercial proposals — are never transmitted to external APIs or cloud services. All processing is local, private, and instant.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Conversión mediante análisis de estructura semántica del PDF' : 'Conversion via PDF semantic structure analysis'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor de conversión analiza la estructura semántica del PDF — coordenadas de texto, tamaños de fuente, jerarquías de párrafos, tablas y posiciones de imágenes — para reconstruir un documento DOCX con el formato más cercano posible al original. La conversión inversa DOCX→PDF renderiza el documento Word como vectores PDF nativos.'
                    : 'The conversion engine analyzes the PDF semantic structure — text coordinates, font sizes, paragraph hierarchies, tables, and image positions — to reconstruct a DOCX document as close to the original format as possible. Reverse DOCX→PDF conversion renders the Word document as native PDF vectors.'}
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
                  {isEs ? 'El procedimiento técnico de conversión PDF ↔ Word paso a paso' : 'Step-by-step PDF ↔ Word conversion technical procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor analiza la maquetación del PDF y la reconstruye en formato DOCX editable' : 'How the engine analyzes the PDF layout and rebuilds it into editable DOCX format'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / ANÁLISIS', title: isEs ? '1. Extracción de Texto y Layout' : '1. Text & Layout Extraction', desc: isEs ? 'pdf.js extrae los operadores de texto de cada página — posición X/Y, fuente, tamaño y contenido de cada fragmento — junto con las dimensiones del MediaBox para reconstruir la maquetación espacial del documento.' : 'pdf.js extracts text operators from each page — X/Y position, font, size, and content of each fragment — along with MediaBox dimensions to reconstruct the document spatial layout.' },
                { step: '02 / ESTRUCTURA', title: isEs ? '2. Reconstrucción de Párrafos' : '2. Paragraph Reconstruction', desc: isEs ? 'El motor agrupa los fragmentos de texto en líneas y párrafos según su proximidad vertical y sangría horizontal. Detecta jerarquías de títulos por tamaño de fuente y reconstruye tablas identificando alineación columnar de texto.' : 'The engine groups text fragments into lines and paragraphs based on vertical proximity and horizontal indent. Detects title hierarchies by font size and reconstructs tables by identifying column text alignment.' },
                { step: '03 / GENERACIÓN', title: isEs ? '3. Escritura del DOCX (OpenXML)' : '3. DOCX Writing (OpenXML)', desc: isEs ? 'docx.js o una implementación equivalente genera el archivo DOCX escribiendo la estructura OpenXML — párrafos `<w:p>`, fragmentos de texto `<w:r>`, tablas `<w:tbl>` y propiedades de fuente `<w:rPr>` — con las imágenes extraídas incrustadas.' : 'docx.js or equivalent implementation generates the DOCX writing the OpenXML structure — paragraphs `<w:p>`, text runs `<w:r>`, tables `<w:tbl>`, and font properties `<w:rPr>` — with extracted images embedded.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. Archivo DOCX Descargable' : '4. Downloadable DOCX File', desc: isEs ? 'El archivo DOCX generado se empaqueta como un ZIP con la estructura OpenXML correcta y se ofrece para descarga directa desde el navegador, completamente editable en Microsoft Word, LibreOffice y Google Docs.' : 'The generated DOCX file is packaged as a ZIP with correct OpenXML structure and offered for direct browser download, fully editable in Microsoft Word, LibreOffice, and Google Docs.' },
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

          {/* BLOQUE 3: CAPACIDADES DE CONVERSIÓN */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <FileType className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Capacidades de conversión bidireccional PDF ↔ Word' : 'Bidirectional PDF ↔ Word conversion capabilities'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Elementos del documento preservados en cada dirección de conversión' : 'Document elements preserved in each conversion direction'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'PDF → Word: Elementos Recuperados' : 'PDF → Word: Recovered Elements'}
                </strong>
                <p>
                  {isEs
                    ? 'El conversor recupera y traslada al DOCX: párrafos de texto con sus propiedades de fuente (familia, tamaño, negrita, cursiva), jerarquías de títulos (H1-H6), tablas con estructura de celdas, imágenes incrustadas en posición relativa y saltos de página explícitos.'
                    : 'The converter recovers and transfers to DOCX: text paragraphs with font properties (family, size, bold, italic), title hierarchies (H1-H6), tables with cell structure, relatively positioned embedded images, and explicit page breaks.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  {isEs ? 'Word → PDF: Conversión de Alta Fidelidad' : 'Word → PDF: High-Fidelity Conversion'}
                </strong>
                <p>
                  {isEs
                    ? 'La conversión DOCX→PDF renderiza el documento Word en un PDF de alta fidelidad preservando estilos de párrafo, fuentes embebidas, tablas, encabezados y pies de página, imágenes en posición exacta, numeración de páginas y la paginación original del documento.'
                    : 'DOCX→PDF conversion renders the Word document into a high-fidelity PDF preserving paragraph styles, embedded fonts, tables, headers and footers, images in exact position, page numbering, and the original document pagination.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Compatibilidad con Microsoft Word' : 'Microsoft Word Compatibility'}
                </strong>
                <p>
                  {isEs
                    ? 'El DOCX resultante es 100% compatible con Microsoft Word 2016/2019/365, LibreOffice Writer 7.x y Google Docs. Puedes editar el texto, cambiar estilos, añadir contenido y guardar el documento sin ningún error de compatibilidad de formato.'
                    : 'The resulting DOCX is 100% compatible with Microsoft Word 2016/2019/365, LibreOffice Writer 7.x, and Google Docs. You can edit text, change styles, add content, and save without any format compatibility errors.'}
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
                  {isEs ? 'Beneficios de la conversión PDF ↔ Word' : 'Benefits of PDF ↔ Word conversion'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Precisión, compatibilidad y privacidad garantizadas en ambas direcciones' : 'Precision, compatibility, and privacy guaranteed in both directions'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Texto Completamente Editable' : 'Fully Editable Text', desc: isEs ? 'El DOCX resultante tiene todo el texto editable — puedes modificar, corregir y reformatear sin restricciones.' : 'The resulting DOCX has all text editable — you can modify, correct, and reformat without restrictions.' },
                { title: isEs ? 'Imágenes Preservadas' : 'Images Preserved', desc: isEs ? 'Las imágenes del PDF se extraen e insertan en el DOCX en sus posiciones relativas originales.' : 'PDF images are extracted and inserted in the DOCX at their original relative positions.' },
                { title: isEs ? 'Tablas Reconstruidas' : 'Tables Reconstructed', desc: isEs ? 'Las tablas del PDF se reconstruyen como tablas editables de Word con su estructura de filas y columnas.' : 'PDF tables are reconstructed as editable Word tables with their row and column structure.' },
                { title: isEs ? 'Compatible con Word 365' : 'Word 365 Compatible', desc: isEs ? 'El DOCX es abierto y editado sin errores en Microsoft Word 2016-365, LibreOffice y Google Docs.' : 'The DOCX opens and edits without errors in Microsoft Word 2016-365, LibreOffice, and Google Docs.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Convierte documentos de cualquier extensión sin restricciones de número de páginas.' : 'Convert documents of any length without page count restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. La conversión ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Conversion happens completely in your local RAM.' },
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
