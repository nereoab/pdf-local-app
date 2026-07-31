'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Scissors, CheckCircle2, Lock, Sparkles, Layers, FileText } from 'lucide-react';
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

export default function DividirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfSplitter />

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
                  {isEs ? '¿Qué sucede exactamente con tu PDF al dividirlo en partes?' : 'What exactly happens to your PDF when splitting it into parts?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • DIVISIÓN SIN PÉRDIDA DE CALIDAD • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • LOSSLESS SPLIT • 100% LOCAL'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tu documento nunca sale de tu dispositivo' : 'Your document never leaves your device'}
                </strong>
                <p>
                  {isEs
                    ? 'La división del PDF se ejecuta completamente en la memoria RAM de tu navegador mediante pdf-lib. Tus documentos confidenciales — contratos extensos, expedientes médicos, informes financieros — se dividen localmente sin ser enviados a ningún servidor externo. Privacidad y seguridad absolutas.'
                    : 'PDF splitting runs entirely in your browser RAM using pdf-lib. Your confidential documents — lengthy contracts, medical records, financial reports — are split locally without being sent to any external server. Absolute privacy and security.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'División lossless: solo se reorganizan punteros de páginas' : 'Lossless split: only page pointers are reorganized'}
                </strong>
                <p>
                  {isEs
                    ? 'Al dividir, pdf-lib copia los streams de páginas seleccionadas al nuevo documento usando `copyPages()`. Las imágenes, fuentes y vectores se transfieren directamente sin recodificación — la calidad de cada página del resultado es bit a bit idéntica a la original, sin degradación alguna.'
                    : 'When splitting, pdf-lib copies selected page streams to the new document using `copyPages()`. Images, fonts, and vectors are transferred directly without re-encoding — the quality of each result page is bit-for-bit identical to the original, with zero degradation.'}
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
                  {isEs ? 'El procedimiento técnico de división de PDF paso a paso' : 'Step-by-step technical PDF split procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor extrae y empaqueta rangos de páginas en documentos separados' : 'How the engine extracts and packages page ranges into separate documents'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / ANÁLISIS', title: isEs ? '1. Lectura del PageTree' : '1. PageTree Reading', desc: isEs ? 'pdf-lib deserializa el PDF y mapea el árbol de páginas completo. Se obtiene el total de páginas, dimensiones de cada MediaBox y los recursos compartidos (fuentes, imágenes) entre páginas.' : 'pdf-lib deserializes the PDF and maps the complete page tree. Total pages, each MediaBox dimensions, and shared resources (fonts, images) across pages are obtained.' },
                { step: '02 / DEFINICIÓN', title: isEs ? '2. Rangos de División' : '2. Split Range Definition', desc: isEs ? 'El usuario define los rangos de extracción — por ejemplo "1-5", "6-12", "13-fin" — o usa el modo automático para dividir en documentos de N páginas cada uno. El motor valida los rangos contra el total de páginas.' : 'The user defines extraction ranges — e.g. "1-5", "6-12", "13-end" — or uses automatic mode to split into documents of N pages each. The engine validates ranges against total page count.' },
                { step: '03 / EXTRACCIÓN', title: isEs ? '3. Copia de Páginas' : '3. Page Copy', desc: isEs ? 'Para cada rango, pdf-lib crea un nuevo PDFDocument vacío y copia las páginas del rango con `copyPages()`, transfiriendo cada stream de contenido y los recursos referenciados sin ningún proceso de recodificación.' : 'For each range, pdf-lib creates an empty PDFDocument and copies range pages with `copyPages()`, transferring each content stream and referenced resources with no re-encoding process.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. Archivos ZIP Descargables' : '4. Downloadable ZIP Files', desc: isEs ? 'Cada fragmento se serializa como un PDF 1.7 estándar independiente. Si son múltiples fragmentos, se empacan en un archivo ZIP usando JSZip para descarga en un solo clic.' : 'Each fragment is serialized as an independent standard PDF 1.7. If multiple fragments, they are packed into a ZIP file using JSZip for single-click download.' },
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

          {/* BLOQUE 3: MODOS DE DIVISIÓN */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Modos de división disponibles para cada caso de uso' : 'Available split modes for each use case'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Flexibilidad completa para documentos de cualquier estructura y tamaño' : 'Complete flexibility for documents of any structure and size'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'División por Rangos de Páginas' : 'Split by Page Ranges'}
                </strong>
                <p>
                  {isEs
                    ? 'Define rangos de páginas exactos con formato flexible — "1-10", "15, 20-25, 30" — para extraer secciones específicas como capítulos, anexos o apartados concretos de un documento extenso. Ideal para dividir informes anuales o manuales técnicos por secciones.'
                    : 'Define exact page ranges with flexible format — "1-10", "15, 20-25, 30" — to extract specific sections like chapters, appendices, or concrete sections of an extended document. Ideal for splitting annual reports or technical manuals by sections.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  {isEs ? 'División por Número de Páginas' : 'Split by Page Count'}
                </strong>
                <p>
                  {isEs
                    ? 'Divide automáticamente el documento en fragmentos de N páginas cada uno — por ejemplo, fragmentos de 10 páginas. El motor calcula el número total de archivos resultantes y asigna las páginas restantes al último fragmento. Ideal para lotes de documentos uniformes.'
                    : 'Automatically split the document into fragments of N pages each — for example, 10-page fragments. The engine calculates the total number of resulting files and assigns remaining pages to the last fragment. Ideal for uniform document batches.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Extracción de Página Individual' : 'Single Page Extraction'}
                </strong>
                <p>
                  {isEs
                    ? 'Extrae páginas individuales como documentos PDF separados — útil para compartir solo la página de firma de un contrato, exportar una sola hoja de un plano técnico o aislar un certificado específico de un expediente multi-página.'
                    : 'Extract individual pages as separate PDF documents — useful for sharing only the signature page of a contract, exporting a single sheet from a technical blueprint, or isolating a specific certificate from a multi-page record.'}
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
                  {isEs ? 'Beneficios de los PDFs divididos resultantes' : 'Benefits of the resulting split PDFs'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad lossless y compatibilidad garantizadas en cada fragmento' : 'Lossless quality and compatibility guaranteed in each fragment'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Calidad Bit a Bit Idéntica' : 'Bit-for-Bit Identical Quality', desc: isEs ? 'Cada página del resultado es idéntica en calidad al original — sin recodificación de imágenes ni texto.' : 'Each result page is identical in quality to the original — no image or text re-encoding.' },
                { title: isEs ? 'Descarga en ZIP' : 'ZIP Download', desc: isEs ? 'Múltiples fragmentos se empaquetan automáticamente en un ZIP para descarga en un solo clic.' : 'Multiple fragments are automatically packaged in a ZIP for single-click download.' },
                { title: isEs ? 'Fuentes Preservadas' : 'Fonts Preserved', desc: isEs ? 'Las fuentes tipográficas de cada página se transfieren al fragmento sin sustituciones ni alteraciones.' : 'Typography fonts of each page are transferred to the fragment without substitutions.' },
                { title: isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible', desc: isEs ? 'Cada PDF fragmento abre correctamente en Adobe, Chrome, Edge, Foxit, iOS y Android.' : 'Each fragment PDF opens correctly in Adobe, Chrome, Edge, Foxit, iOS, and Android.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Divide documentos de cualquier tamaño — desde 2 hasta miles de páginas — sin restricciones.' : 'Split documents of any size — from 2 to thousands of pages — without restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. Toda la división ocurre en tu RAM local de forma privada.' : 'Zero bytes sent to servers. All splitting happens privately in your local RAM.' },
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
