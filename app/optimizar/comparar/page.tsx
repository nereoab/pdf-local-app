'use client';

import PdfComparator from '../../../components/PdfComparator';
import { useLanguage } from '../../../context/LanguageContext';
import { GitCompare, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CompararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b] font-sans">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 font-mono">
          <div className="flex items-center gap-3.5">
            <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Link href="/optimizar" className="hover:text-white transition-colors">
                  {isEs ? '004 / OPTIMIZAR' : '004 / OPTIMIZE'}
                </Link>
                <span>/</span>
                <span className="text-white font-bold">{isEs ? 'COMPARAR PDF' : 'COMPARE PDF'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                {isEs ? '006 / COMPARAR 2 ARCHIVOS PDF' : '006 / COMPARE 2 PDF FILES'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? 'Detección Visual & Semántica' : 'Visual & Semantic Detection'}</span>
          </div>
        </div>

        <PdfComparator />

        {/* SECCIÓN GUÍA DETALLADA DE USO */}
        <div className="w-full mt-16 pt-12 border-t border-white/10 flex flex-col items-center font-mono">
          <div className="text-center mb-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              {isEs ? "000 / GUÍA DE USO DETALLADA" : "000 / DETAILED USER GUIDE"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3 font-sans">
              {isEs ? "¿Cómo usar la herramienta Comparar PDF?" : "How to use the PDF Compare tool?"}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
              {isEs 
                ? "Sigue estos 4 pasos sencillos para auditar contratos, revisar versiones y detectar cambios de texto o diseño de forma automática."
                : "Follow these 4 simple steps to audit contracts, review versions, and automatically detect text or layout changes."}
            </p>
          </div>

          {/* TARJETAS DE 4 PASOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-12">
            {/* PASO 1 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">001 / PASO 01</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "1. Carga los 2 Archivos PDF" : "1. Upload 2 PDF Files"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Selecciona el PDF Original (antes) en la casilla izquierda y el PDF Modificado (después) en la derecha. También puedes probar con los PDFs de muestra." 
                  : "Select the Original PDF (before) in the left dropzone and Modified PDF (after) in the right dropzone. You can also try sample PDFs."}
              </p>
            </div>

            {/* PASO 2 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">002 / PASO 02</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "2. Elige el Modo de Análisis" : "2. Choose Analysis Mode"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Elige 'Texto Semántico' para detectar palabras, cláusulas y párrafos modificados, o 'Superposición' para comparar diferencias de diseño o imágenes." 
                  : "Choose 'Semantic Text' to detect changed words, clauses, and paragraphs, or 'Overlay' to compare layout and graphic differences."}
              </p>
            </div>

            {/* PASO 3 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">003 / PASO 03</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "3. Inspecciona con Scroll Sincronizado" : "3. Inspect with Scroll Sync"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Desplázate verticalmente por los visores. La función 'Sincronizar Scroll' mantendrá ambas versiones alineadas en la misma página." 
                  : "Scroll vertically through the viewports. 'Scroll Sync' keeps both document versions aligned at the exact same page height."}
              </p>
            </div>

            {/* PASO 4 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">004 / PASO 04</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "4. Exporta el Reporte de Auditoría" : "4. Export Audit Report"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Revisa el desglose de cambios en el panel derecho y haz clic en 'Descargar Reporte' para obtener un historial completo en tu equipo." 
                  : "Review the difference breakdown on the right panel and click 'Download report' to save a complete audit trail on your device."}
              </p>
            </div>
          </div>

          {/* TARJETAS DE CARACTERÍSTICAS Y CONSEJOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Resaltado Rojo (Eliminado)' : 'Red Highlight (Deleted)'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Señala automáticamente las palabras, oraciones, montos o cláusulas que existían en el documento original pero fueron eliminadas o modificadas.'
                  : 'Automatically marks words, sentences, amounts, or clauses present in the original file that were deleted or modified.'}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Resaltado Verde (Añadido)' : 'Green Highlight (Added)'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Destaca las adiciones de texto, nuevas condiciones, datos insertados o correcciones incluidas en la versión reciente del PDF.'
                  : 'Highlights text additions, new terms, inserted data, or corrections added into the recent version of the PDF.'}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Privacidad 100% Local' : '100% Local Privacy'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Toda la comparación se ejecuta dentro del motor WebAssembly/JS de tu navegador. Ningún documento sale de tu computadora ni toca servidores.'
                  : 'All comparison processing runs inside your browser. No documents ever leave your computer or touch external servers.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
