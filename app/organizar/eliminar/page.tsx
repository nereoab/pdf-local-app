'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Trash2, CheckCircle2, Lock, Sparkles, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfPageDeleter = dynamic(() => import('@/components/PdfPageDeleter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para eliminar páginas PDF...</p>
    </div>
  ),
});

export default function EliminarPaginasPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfPageDeleter />

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
                  {isEs ? '¿Qué sucede con tu PDF al eliminar páginas innecesarias?' : 'What happens to your PDF when deleting unnecessary pages?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • ELIMINACIÓN PERMANENTE DEL PAGETR • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • PERMANENT PAGETREE DELETION • 100% LOCAL'}
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
                    ? 'La eliminación de páginas se ejecuta completamente en la memoria RAM de tu navegador usando pdf-lib. Tu documento — con contenido confidencial, páginas en blanco, portadas de fax u hojas duplicadas — se limpia localmente sin ser transmitido a ningún servidor externo. Seguridad y privacidad totales.'
                    : 'Page deletion runs entirely in your browser RAM using pdf-lib. Your document — with confidential content, blank pages, fax cover sheets, or duplicate sheets — is cleaned locally without being transmitted to any external server. Total security and privacy.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Eliminación permanente del PageTree: páginas irrecuperables' : 'Permanent PageTree deletion: pages are unrecoverable'}
                </strong>
                <p>
                  {isEs
                    ? 'Las páginas eliminadas se borran del árbol de páginas (`PageTree`) del PDF y sus recursos referenciados se limpian del catálogo. No es un ocultamiento ni una superposición — el contenido se elimina permanentemente del binario del documento y no puede recuperarse en el archivo final.'
                    : 'Deleted pages are removed from the PDF page tree (`PageTree`) and their referenced resources are cleaned from the catalog. It is not a hiding or overlay — content is permanently deleted from the document binary and cannot be recovered in the final file.'}
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
                  {isEs ? 'El procedimiento técnico de eliminación de páginas paso a paso' : 'Step-by-step technical page deletion procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor borra permanentemente páginas del árbol de objetos del PDF' : 'How the engine permanently removes pages from the PDF object tree'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / CARGA', title: isEs ? '1. Mapa de Páginas' : '1. Page Map', desc: isEs ? 'pdf-lib carga el PDF y construye un mapa completo del árbol de páginas con las referencias de objetos de cada página, su MediaBox y los recursos asociados (imágenes, fuentes, anotaciones).' : 'pdf-lib loads the PDF and builds a complete page tree map with each page object references, MediaBox, and associated resources (images, fonts, annotations).' },
                { step: '02 / SELECCIÓN', title: isEs ? '2. Marcado de Páginas' : '2. Page Marking', desc: isEs ? 'El usuario selecciona páginas a eliminar desde miniaturas interactivas. Pueden marcarse páginas individuales, rangos ("3-7"), páginas pares/impares o utilizar detección automática de páginas en blanco.' : 'The user selects pages to delete from interactive thumbnails. Individual pages, ranges ("3-7"), even/odd pages, or automatic blank page detection can be used.' },
                { step: '03 / ELIMINACIÓN', title: isEs ? '3. Borrado del PageTree' : '3. PageTree Removal', desc: isEs ? 'pdf-lib invoca `removePage()` para cada página marcada, eliminando el nodo del árbol PageTree y desreferenciando los recursos exclusivos de esa página para limpiar el diccionario de recursos.' : 'pdf-lib invokes `removePage()` for each marked page, removing the node from the PageTree and dereferencing resources exclusive to that page to clean the resource dictionary.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. PDF Limpio Resultante' : '4. Clean Resulting PDF', desc: isEs ? 'Se genera un nuevo PDF 1.7 estándar con solo las páginas conservadas, numeración de objetos optimizada y recursos huérfanos eliminados. El resultado es más ligero y perfectamente válido.' : 'A new standard PDF 1.7 is generated with only the kept pages, optimized object numbering, and orphaned resources removed. The result is lighter and perfectly valid.' },
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

          {/* BLOQUE 3: CASOS DE USO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Casos de uso más frecuentes para eliminar páginas de un PDF' : 'Most frequent use cases for deleting PDF pages'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Situaciones prácticas donde la eliminación selectiva de páginas ahorra tiempo' : 'Practical situations where selective page deletion saves time'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Portadas de Fax y Páginas en Blanco' : 'Fax Cover Sheets & Blank Pages'}
                </strong>
                <p>
                  {isEs
                    ? 'Elimina portadas de fax escaneadas, páginas en blanco insertadas por la impresora, hojas de separación de secciones o páginas de publicidad de software que aparecen al guardar desde aplicaciones de terceros — limpiando el documento definitivo.'
                    : 'Remove scanned fax cover sheets, printer-inserted blank pages, section separator sheets, or software advertising pages that appear when saving from third-party applications — cleaning up the final document.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Documentos Combinados con Secciones Irrelevantes' : 'Combined Documents with Irrelevant Sections'}
                </strong>
                <p>
                  {isEs
                    ? 'Cuando combinas varios PDFs y el resultado incluye páginas de índice, legal notices, contraportadas o apéndices que no forman parte del documento final que necesitas compartir — elimínalas en segundos manteniendo el resto intacto.'
                    : 'When combining multiple PDFs and the result includes index pages, legal notices, back covers, or appendices that are not part of the final document you need to share — remove them in seconds keeping everything else intact.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-white" />
                  {isEs ? 'Expedientes con Páginas Duplicadas' : 'Records with Duplicate Pages'}
                </strong>
                <p>
                  {isEs
                    ? 'Expedientes médicos, legales o financieros digitalizados frecuentemente contienen páginas duplicadas por errores de escaneo o fotocopias dobles. El eliminador te permite limpiar estas redundancias page por page desde miniaturas interactivas antes de archivar o enviar.'
                    : 'Digitized medical, legal, or financial records frequently contain duplicate pages from scanning errors or double photocopies. The deleter lets you clean these redundancies page by page from interactive thumbnails before archiving or sending.'}
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
                  {isEs ? 'Beneficios del PDF resultante con páginas eliminadas' : 'Benefits of the resulting PDF with deleted pages'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad perfecta, menor peso y privacidad garantizadas' : 'Perfect quality, reduced size, and guaranteed privacy'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Eliminación Irrecuperable' : 'Unrecoverable Deletion', desc: isEs ? 'Las páginas eliminadas se borran permanentemente del binario. No hay capa oculta ni metadato reversible.' : 'Deleted pages are permanently erased from the binary. No hidden layer or reversible metadata exists.' },
                { title: isEs ? 'Reducción de Tamaño de Archivo' : 'File Size Reduction', desc: isEs ? 'Al eliminar páginas y limpiar recursos huérfanos, el PDF resultante pesa menos que el original.' : 'By deleting pages and cleaning orphaned resources, the resulting PDF weighs less than the original.' },
                { title: isEs ? 'Calidad Lossless en Páginas Conservadas' : 'Lossless Quality on Kept Pages', desc: isEs ? 'Las páginas que permanecen en el documento conservan exactamente la misma calidad que el original.' : 'Pages remaining in the document maintain exactly the same quality as the original.' },
                { title: isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible', desc: isEs ? 'El PDF resultante abre correctamente en Adobe, Chrome, Edge, Foxit, iOS y Android.' : 'The resulting PDF opens correctly in Adobe, Chrome, Edge, Foxit, iOS, and Android.' },
                { title: isEs ? 'Vista Previa de Miniaturas' : 'Thumbnail Preview', desc: isEs ? 'Visualiza todas las páginas como miniaturas antes de eliminar para evitar borrar páginas importantes.' : 'View all pages as thumbnails before deleting to avoid accidentally removing important pages.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. La eliminación ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Deletion happens completely in your local RAM.' },
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
