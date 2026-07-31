'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfWatermarkRemover = dynamic(() => import('@/components/PdfWatermarkRemover'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para quitar marca de agua de PDF...</p>
    </div>
  ),
});

export default function QuitarMarcaAguaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfWatermarkRemover />

        {/* ══════════════════════════════════════════════
            3 SECCIONES INFORMATIVAS CONSISTENTES
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR LA HERRAMIENTA ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo quitar un sello de agua' : '1. How to remove a watermark'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', textEs: 'Sube tu archivo PDF que contiene marcas de agua arrastrándolo a la zona de carga o haciendo clic para seleccionarlo.', textEn: 'Upload your PDF containing watermarks by dragging it to the upload zone or clicking to select it.' },
                { step: '02', textEs: 'El motor analizará automáticamente el documento en busca de marcas de agua de texto, imágenes repetidas o capas semitransparentes.', textEn: 'The engine will automatically scan the document for text watermarks, repeated images, or semi-transparent layers.' },
                { step: '03', textEs: 'Revisa la vista previa para confirmar qué marcas de agua se eliminarán. Puedes ajustar la selección si es necesario.', textEn: 'Review the preview to confirm which watermarks will be removed. You can adjust the selection if needed.' },
                { step: '04', textEs: 'Haz clic en "Quitar Marca de Agua →" y descarga el PDF limpio sin los sellos.', textEn: 'Click "Remove Watermark →" and download the clean PDF without the stamps.' },
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
                  isEs ? 'Eliminar marcas de agua de texto (como "CONFIDENCIAL" o "BORRADOR") que aparecen repetidas en cada página.' : 'Remove text watermarks (like "CONFIDENTIAL" or "DRAFT") that appear repeated on each page.',
                  isEs ? 'Eliminar sellos de imagen (logos, firmas de propiedad) que se repiten en múltiples páginas.' : 'Remove image stamps (logos, ownership seals) that repeat across multiple pages.',
                  isEs ? 'Eliminar capas opcionales (OCG) que contienen marcas de agua que aparecen/desaparecen en ciertos visores PDF.' : 'Remove optional content layers (OCG) containing watermarks that appear/disappear in certain PDF viewers.',
                  isEs ? 'El contenido original del PDF (texto, imágenes, tablas) permanece intacto tras la eliminación.' : 'The original PDF content (text, images, tables) remains intact after removal.',
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
                  isEs ? 'La herramienta detecta marcas añadidas digitalmente. Marcas de agua impresas físicamente en el papel y luego escaneadas no se pueden eliminar automáticamente.' : 'The tool detects digitally added marks. Watermarks physically printed on paper and then scanned cannot be automatically removed.',
                  isEs ? 'Si el PDF está protegido con contraseña de edición, primero debes usar la herramienta "Desbloquear PDF".' : 'If the PDF is protected with an edit password, first use the "Unlock PDF" tool.',
                  isEs ? 'Haz una copia de seguridad del PDF original antes de eliminar marcas, por si necesitas revertir el cambio.' : 'Make a backup of the original PDF before removing watermarks, in case you need to revert the change.',
                  isEs ? 'Marcas de agua complejas (degradados, patrones entrelazados con el texto) pueden no eliminarse completamente. Revisa el resultado final.' : 'Complex watermarks (gradients, patterns intertwined with text) may not be completely removed. Review the final result.',
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
                {isEs ? '3. ¿Qué sucede con tu documento al quitar marcas de agua?' : '3. What happens to your document when removing watermarks?'}
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
                  🧹 {isEs ? 'Eliminación selectiva y segura' : 'Selective & safe removal'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Solo se eliminan los objetos de marca de agua detectados. El texto, imágenes y tablas del documento original no se modifican.'
                    : 'Only detected watermark objects are removed. The original document text, images, and tables remain unmodified.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El PDF limpio se genera localmente y se descarga directamente a tu equipo. Tu archivo original permanece sin modificar.'
                    : 'The clean PDF is generated locally and downloads directly to your device. Your original file remains unmodified.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}