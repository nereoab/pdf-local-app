'use client';

import dynamic from 'next/dynamic';
import { Loader2, Table, ShieldCheck, AlertTriangle, HelpCircle, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const ExcelPdfConverter = dynamic(() => import('@/components/ExcelPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ Excel...</p>
    </div>
  ),
});

export default function PdfExcelPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <ExcelPdfConverter defaultMode="pdf-to-excel" />

        {/* SECCIÓN INFORMATIVA DE 4 PUNTOS (ESTÁNDAR MÓDULO CONVERTIR) */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* 1. CÓMO FUNCIONA PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo extraer tablas de PDF a Excel' : '1. How to extract PDF tables to Excel'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu documento PDF con tablas o datos financieros.', en: 'Upload your PDF document with tables or financial data.' },
                { step: '02', es: 'El motor detecta la grilla de celdas y fronteras vectoriales.', en: 'The engine detects cell grids and vector boundaries.' },
                { step: '03', es: 'Configura la separación por hojas o auto-formato numérico.', en: 'Configure sheet separation or numeric auto-formatting.' },
                { step: '04', es: 'Haz clic en extraer y descarga tu libro .xlsx editable.', en: 'Click extract and download your editable .xlsx workbook.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. LIMITACIONES Y CONSEJOS ÚTILES */}
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
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  ✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
                </h4>
                {[
                  isEs ? 'Extraer filas y columnas directamente a celdas editables.' : 'Extract rows and columns directly into editable cells.',
                  isEs ? 'Reconocer separadores decimales y miles automáticamente.' : 'Automatically recognize decimal and thousand separators.',
                  isEs ? 'Separar páginas del PDF en hojas independientes de Excel.' : 'Separate PDF pages into independent Excel sheets.',
                  isEs ? 'Exportar como empaquetado OpenXML (.xlsx) 100% compatible.' : 'Export as 100% compatible OpenXML (.xlsx) package.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  💡 {isEs ? 'CONSEJOS' : 'TIPS'}
                </h4>
                {[
                  isEs ? 'Para PDFs escaneados (imágenes), aplica OCR antes de extraer celdas.' : 'For scanned PDFs (images), run OCR before extracting cells.',
                  isEs ? 'Verifica el formato de celdas en Excel para realizar cálculos o sumas.' : 'Verify cell format in Excel to perform calculations or sums.',
                  isEs ? 'Procesamiento en memoria RAM 100% confidencial y sin servidores.' : '100% confidential RAM processing with zero servers.',
                  isEs ? 'Preserva el archivo PDF original sin modificar ningún byte.' : 'Preserves original PDF file without altering any byte.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. PRIVACIDAD Y SEGURIDAD */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al convertirlo?' : '3. What happens to your document when converting it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">{isEs ? 'El análisis de celdas se ejecuta en la RAM. Ninguna cifra sale de tu dispositivo.' : 'Cell analysis runs in RAM. No figure ever leaves your device.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📊 {isEs ? 'Estructura tabular limpia' : 'Clean tabular structure'}</strong>
                <p className="text-[11px]">{isEs ? 'Genera un archivo Excel listo para editar y analizar sin basura HTML.' : 'Generates an Excel file ready to edit & analyze without HTML junk.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'El libro .xlsx se genera e inicia descarga de forma inmediata.' : 'The .xlsx workbook generates and begins download immediately.'}</p>
              </div>
            </div>
          </div>

          {/* 4. PREGUNTAS FRECUENTES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  qEs: '¿Las tablas extraídas a Excel permiten ejecutar fórmulas sumatorias?',
                  qEn: 'Do extracted Excel tables allow executing sum formulas?',
                  aEs: 'Sí, los números se convierten a tipos de datos numéricos nativos en Excel para que puedas aplicar fórmulas de inmediato.',
                  aEn: 'Yes, numbers convert to native numeric data types in Excel so you can apply formulas immediately.',
                },
                {
                  qEs: '¿Es seguro extraer estados de cuenta o reportes corporativos?',
                  qEn: 'Is it safe to extract bank statements or corporate reports?',
                  aEs: 'Totalmente. El procesamiento es estrictamente local en el navegador, sin almacenamiento ni servidores intermediarios.',
                  aEn: 'Totally. Processing is strictly local in your browser, with zero intermediate storage or servers.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-1.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="text-blue-400 font-mono">Q:</span> {isEs ? faq.qEs : faq.qEn}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-5">
                    {isEs ? faq.aEs : faq.aEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
