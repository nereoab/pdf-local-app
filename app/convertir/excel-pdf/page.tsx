'use client';

import dynamic from 'next/dynamic';
import { Loader2, Table, ShieldCheck, AlertTriangle, HelpCircle, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const ExcelPdfConverter = dynamic(() => import('@/components/ExcelPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor Excel ↔ PDF...</p>
    </div>
  ),
});

export default function ExcelToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <ExcelPdfConverter defaultMode="excel-to-pdf" />

        {/* SECCIÓN INFORMATIVA DE 4 PUNTOS (ESTÁNDAR MÓDULO CONVERTIR) */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* 1. CÓMO FUNCIONA PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de Excel a PDF' : '1. How to convert Excel to PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu archivo de hoja de cálculo (.xlsx/.xls) a la zona de carga.', en: 'Upload your spreadsheet file (.xlsx/.xls) to the upload zone.' },
                { step: '02', es: 'El motor decodifica la estructura OpenXML de celdas y hojas.', en: 'The engine decodes OpenXML cell and worksheet structures.' },
                { step: '03', es: 'Configura la orientación (vertical/horizontal) y ajuste de columnas.', en: 'Configure orientation (portrait/landscape) and column fitting.' },
                { step: '04', es: 'Haz clic en convertir y descarga tu reporte PDF vectorial.', en: 'Click convert and download your vector PDF report.' },
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
                  isEs ? 'Convertir múltiples hojas (worksheets) de un libro en un solo PDF.' : 'Convert multiple worksheets from a workbook into one PDF.',
                  isEs ? 'Usar orientación horizontal para tablas con alto número de columnas.' : 'Use landscape orientation for tables with high column count.',
                  isEs ? 'Ajustar escala e incluir encabezados de tabla en cada página.' : 'Adjust scale and include table headers on each page.',
                  isEs ? 'Preservar formatos numéricos, moneda y colores de celda.' : 'Preserve numeric formatting, currency and cell colors.',
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
                  isEs ? 'Las fórmulas se convierten a sus valores calculados finales en PDF.' : 'Formulas convert to their final calculated values in PDF.',
                  isEs ? 'Ajusta los márgenes antes de exportar para evitar cortes de celda.' : 'Adjust margins before exporting to prevent cell clipping.',
                  isEs ? 'Procesamiento en memoria RAM 100% privado y sin servidores.' : '100% private RAM processing with zero servers.',
                  isEs ? 'Compatible con libros generados en Excel, LibreOffice y Google Sheets.' : 'Compatible with workbooks from Excel, LibreOffice, and Google Sheets.',
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
                <p className="text-[11px]">{isEs ? 'Tus balances e informes financieros se procesan en la RAM sin subir datos.' : 'Your financial statements process in RAM without uploading data.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📊 {isEs ? 'Estructura vectorial' : 'Vector structure'}</strong>
                <p className="text-[11px]">{isEs ? 'Genera documentos PDF de alta precisión imprimibles sin pérdida.' : 'Generates printable high-precision PDF documents with zero loss.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa' : 'Direct download'}</strong>
                <p className="text-[11px]">{isEs ? 'El archivo PDF resultante está listo al instante sin esperas.' : 'The resulting PDF file is ready instantly with no waiting.'}</p>
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
                  qEs: '¿Se mantienen los colores de celdas y bordes de la hoja de cálculo?',
                  qEn: 'Are cell colors and borders preserved from the spreadsheet?',
                  aEs: 'Sí, el motor de renderizado respeta la paleta de colores, estilos de fuente y bordes de celdas de la hoja original.',
                  aEn: 'Yes, the rendering engine respects color palette, font styles, and cell borders from the original sheet.',
                },
                {
                  qEs: '¿Es seguro procesar planillas con datos financieros confidenciales?',
                  qEn: 'Is it safe to process spreadsheets with confidential financial data?',
                  aEs: 'Totalmente. Al ejecutarse 100% en la memoria RAM del navegador, ninguna cifra sale de tu dispositivo.',
                  aEn: 'Totally. By running 100% inside browser RAM, no number ever leaves your device.',
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
