'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Hash, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfFoliador = dynamic(() => import('@/components/PdfFoliador'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para foliar páginas PDF...</p>
    </div>
  ),
});

export default function FoliarPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfFoliador />

        {/* ══════════════════════════════════════════════
            3 SECCIONES INFORMATIVAS CONSISTENTES
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR LA HERRAMIENTA ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo añadir numeración a un PDF' : '1. How to add page numbers'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', textEs: 'Sube tu archivo PDF arrastrándolo a la zona de carga. El visor mostrará todas las páginas del documento.', textEn: 'Upload your PDF by dragging it to the upload zone. The viewer will show all document pages.' },
                { step: '02', textEs: 'Elige el formato de numeración: números arábigos (1, 2, 3), romanos (I, II, III), letras (A, B, C) o formato "Página X de N".', textEn: 'Choose numbering format: arabic (1, 2, 3), roman (I, II, III), letters (A, B, C), or "Page X of N" format.' },
                { step: '03', textEs: 'Configura la posición del número (encabezado o pie de página, alineación izquierda/centro/derecha) y el rango de páginas a numerar.', textEn: 'Configure number position (header/footer, left/center/right alignment) and page range to number.' },
                { step: '04', textEs: 'Haz clic en "Foliar PDF →" y descarga el documento con la numeración aplicada.', textEn: 'Click "Number Pages →" and download the document with numbering applied.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.textEs : item.textEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 2: LIMITACIONES Y CONSEJOS ── */}
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
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[
                  isEs ? 'Numerar todas las páginas o solo un rango específico (ej: desde la página 3 hasta la 15).' : 'Number all pages or only a specific range (e.g., from page 3 to 15).',
                  isEs ? 'Elegir entre números arábigos, romanos, letras o formato compuesto con total de páginas.' : 'Choose between arabic, roman, letters, or compound format with total page count.',
                  isEs ? 'Colocar el número en el encabezado o pie de página con alineación personalizada.' : 'Place the number in the header or footer with custom alignment.',
                  isEs ? 'Excluir páginas de portada, índices o anexos para que no reciban numeración.' : 'Exclude cover pages, indexes, or appendices from numbering.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[
                  isEs ? 'Ideal para documentos legales, expedientes judiciales, informes corporativos y tesis académicas.' : 'Ideal for legal documents, court files, corporate reports, and academic theses.',
                  isEs ? 'Verifica los márgenes de impresión de tu documento para que los números no queden cortados al imprimir.' : 'Check your document print margins so numbers are not cut off when printing.',
                  isEs ? 'Usa el formato "Página X de N" para documentos que se imprimirán y necesitan referencia del total.' : 'Use "Page X of N" format for documents that will be printed and need total page reference.',
                  isEs ? 'Los números se añaden como texto real seleccionable, no como imágenes, por lo que se ven nítidos a cualquier zoom.' : 'Numbers are added as real selectable text, not images, so they look sharp at any zoom level.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: QUÉ SUCEDE CON TU DOCUMENTO ── */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al foliarlo?' : '3. What happens to your document when numbering it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Tu PDF se procesa completamente en la memoria RAM de tu navegador. No se envía ningún dato a servidores externos.'
                    : 'Your PDF is processed entirely in your browser RAM. No data is sent to external servers.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  🔢 {isEs ? 'Numeración como texto real' : 'Numbering as real text'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Los números se integran como texto vectorial en cada página. Son seleccionables, buscables y se ven perfectos en pantalla e impresos.'
                    : 'Numbers are integrated as vector text on each page. They are selectable, searchable, and look perfect on screen and in print.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El PDF foliado se genera localmente y se descarga directamente a tu equipo. El contenido original del documento no se altera.'
                    : 'The numbered PDF is generated locally and downloads directly to your device. Original document content is not altered.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}