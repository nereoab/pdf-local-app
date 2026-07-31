'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, LayoutGrid, CheckCircle2, Lock, Sparkles, Layers, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfOrganizer = dynamic(() => import('@/components/PdfOrganizer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para reordenar páginas PDF...</p>
    </div>
  ),
});

export default function ReordenarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfOrganizer />

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
                  {isEs ? '¿Qué sucede con tu PDF al reordenar sus páginas?' : 'What happens to your PDF when reordering its pages?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • REORDENACIÓN SIN PÉRDIDA • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • LOSSLESS REORDERING • 100% LOCAL'}
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
                    ? 'La reordenación de páginas se ejecuta completamente en la memoria RAM de tu navegador usando pdf-lib. Tus documentos confidenciales — presentaciones corporativas, expedientes, informes de auditoría — se reorganizan localmente sin transmisión alguna a servidores externos. Privacidad garantizada.'
                    : 'Page reordering runs entirely in your browser RAM using pdf-lib. Your confidential documents — corporate presentations, records, audit reports — are reorganized locally without any transmission to external servers. Privacy guaranteed.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Reorganización del PageTree: cero recodificación de contenido' : 'PageTree reorganization: zero content re-encoding'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor reordena las páginas reorganizando únicamente los punteros de objetos en el árbol de páginas (`PageTree`) del PDF. Los streams de contenido — imágenes, texto vectorial, fuentes — nunca se recodifican ni modifican. La calidad de cada página permanece bit a bit idéntica al original.'
                    : 'The engine reorders pages by only reorganizing object pointers in the PDF page tree (`PageTree`). Content streams — images, vector text, fonts — are never re-encoded or modified. Each page quality remains bit-for-bit identical to the original.'}
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
                  {isEs ? 'El procedimiento técnico de reordenación de páginas paso a paso' : 'Step-by-step technical page reordering procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor reorganiza el árbol de páginas del PDF mediante arrastrar y soltar' : 'How the engine reorganizes the PDF page tree through drag-and-drop'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / RENDERIZADO', title: isEs ? '1. Generación de Miniaturas' : '1. Thumbnail Generation', desc: isEs ? 'pdf.js renderiza cada página como miniatura Canvas de alta resolución para el panel de reordenación. Las miniaturas son representaciones visuales en memoria — no archivos temporales en disco.' : 'pdf.js renders each page as a high-resolution Canvas thumbnail for the reorder panel. Thumbnails are in-memory visual representations — not temporary files on disk.' },
                { step: '02 / ARRASTRAR', title: isEs ? '2. Drag & Drop Interactivo' : '2. Interactive Drag & Drop', desc: isEs ? 'El usuario arrastra las miniaturas al nuevo orden deseado. El motor registra en tiempo real la secuencia de índices de página resultante — sin tocar aún la estructura del PDF cargado.' : 'The user drags thumbnails to the desired new order. The engine records in real time the resulting page index sequence — without yet touching the loaded PDF structure.' },
                { step: '03 / REORDENACIÓN', title: isEs ? '3. Reorganización del PageTree' : '3. PageTree Reorganization', desc: isEs ? 'pdf-lib crea un nuevo PDFDocument y copia las páginas en el orden definido por el usuario con `copyPages()`, escribiendo la nueva secuencia de nodos en el árbol de páginas del documento destino.' : 'pdf-lib creates a new PDFDocument and copies pages in user-defined order with `copyPages()`, writing the new node sequence into the destination document page tree.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. PDF Reordenado Listo' : '4. Reordered PDF Ready', desc: isEs ? 'Se serializa un nuevo PDF 1.7 estándar con las páginas en el orden definido por el usuario. El documento es 100% compatible con cualquier visor y mantiene calidad perfecta en todas las páginas.' : 'A new standard PDF 1.7 is serialized with pages in the user-defined order. The document is 100% compatible with any viewer and maintains perfect quality across all pages.' },
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

          {/* BLOQUE 3: FUNCIONES DEL ORGANIZADOR */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Funciones del organizador visual de páginas' : 'Visual page organizer functions'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Capacidades avanzadas del panel de reordenación interactivo' : 'Advanced capabilities of the interactive reordering panel'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Panel de Miniaturas Interactivo' : 'Interactive Thumbnail Panel'}
                </strong>
                <p>
                  {isEs
                    ? 'Visualiza todas las páginas del documento como miniaturas de alta resolución en un panel de cuadrícula. Cada miniatura muestra el número de página actual y el orden nuevo al arrastrarla a otra posición. Las miniaturas se actualizan en tiempo real al reordenar.'
                    : 'View all document pages as high-resolution thumbnails in a grid panel. Each thumbnail shows the current page number and new order when dragged to another position. Thumbnails update in real time when reordering.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-white" />
                  {isEs ? 'Inversión y Acciones Rápidas' : 'Inversion & Quick Actions'}
                </strong>
                <p>
                  {isEs
                    ? 'Invierte el orden de todas las páginas con un solo clic — ideal para documentos escaneados en orden inverso. También puedes mover páginas seleccionadas al inicio o al final del documento con botones de acción rápida sin necesidad de arrastrar manualmente.'
                    : 'Invert the order of all pages in one click — ideal for documents scanned in reverse order. You can also move selected pages to the beginning or end of the document with quick action buttons without manual dragging.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Reordenación + Eliminación Simultánea' : 'Simultaneous Reorder + Delete'}
                </strong>
                <p>
                  {isEs
                    ? 'Desde el mismo panel de organización puedes tanto reordenar como eliminar páginas en una sola operación — arrastras las páginas al orden correcto y eliminas las que no necesitas — generando un único PDF final limpio y perfectamente organizado.'
                    : 'From the same organization panel you can both reorder and delete pages in a single operation — drag pages to the correct order and remove the ones you do not need — generating a single clean and perfectly organized final PDF.'}
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
                  {isEs ? 'Beneficios del PDF reordenado resultante' : 'Benefits of the resulting reordered PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad lossless, privacidad y compatibilidad en el documento reorganizado' : 'Lossless quality, privacy, and compatibility in the reorganized document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Cero Pérdida de Calidad' : 'Zero Quality Loss', desc: isEs ? 'Solo se reorganizan punteros de páginas. Imágenes y texto son bit a bit idénticos al original.' : 'Only page pointers are reorganized. Images and text are bit-for-bit identical to the original.' },
                { title: isEs ? 'Vista Previa en Tiempo Real' : 'Real-Time Preview', desc: isEs ? 'Las miniaturas muestran el orden actualizado instantáneamente mientras arrastras las páginas.' : 'Thumbnails show the updated order instantly as you drag pages.' },
                { title: isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible', desc: isEs ? 'El PDF reordenado abre correctamente en Adobe, Chrome, Edge, Foxit, iOS y Android.' : 'Reordered PDF opens correctly in Adobe, Chrome, Edge, Foxit, iOS, and Android.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Reorganiza documentos de cualquier número de páginas sin restricciones artificiales.' : 'Reorganize documents of any page count without artificial restrictions.' },
                { title: isEs ? 'Acciones Rápidas' : 'Quick Actions', desc: isEs ? 'Invierte el orden total, mueve al inicio o al final con un solo clic desde el panel.' : 'Invert total order, move to beginning or end with a single click from the panel.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. La reordenación ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Reordering happens completely in your local RAM.' },
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
