'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Table, CheckCircle2, Lock, Sparkles, Layers, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const ExcelPdfConverter = dynamic(() => import('@/components/ExcelPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para convertir PDF a Excel / Excel a PDF...</p>
    </div>
  ),
});

export default function PdfToExcelPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <ExcelPdfConverter defaultMode="pdf-to-excel" />

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
                  {isEs ? '¿Qué sucede al convertir entre PDF y Excel?' : 'What happens when converting between PDF and Excel?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • EXTRACCIÓN DE TABLAS LOCAL • 100% SIN SERVIDOR' : '🔒 ABSOLUTE PRIVACY • LOCAL TABLE EXTRACTION • 100% SERVER-FREE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tus datos financieros nunca salen de tu dispositivo' : 'Your financial data never leaves your device'}
                </strong>
                <p>
                  {isEs
                    ? 'La conversión entre PDF y Excel se ejecuta completamente en la memoria RAM de tu navegador. Tus estados de cuenta, balances contables, hojas de cálculo y tablas de datos confidenciales nunca se transmiten a APIs externas ni servicios en la nube. Todo el procesamiento es local, privado y seguro.'
                    : 'PDF and Excel conversion runs entirely in your browser RAM. Your bank statements, accounting balances, spreadsheets, and confidential data tables are never transmitted to external APIs or cloud services. All processing is local, private, and secure.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Extracción de tablas por análisis columnar de coordenadas' : 'Table extraction via columnar coordinate analysis'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor de conversión analiza las coordenadas X/Y de cada fragmento de texto en el PDF para detectar alineación columnar típica de tablas. Los datos detectados se agrupan en filas y columnas y se escriben directamente en celdas XLSX usando SheetJS, preservando los valores numéricos como datos editables.'
                    : 'The conversion engine analyzes X/Y coordinates of each text fragment in the PDF to detect typical table columnar alignment. Detected data is grouped into rows and columns and written directly into XLSX cells using SheetJS, preserving numeric values as editable data.'}
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
                  {isEs ? 'El procedimiento técnico de conversión PDF ↔ Excel paso a paso' : 'Step-by-step PDF ↔ Excel conversion technical procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor detecta y extrae tablas del PDF para escribirlas en hojas XLSX' : 'How the engine detects and extracts tables from the PDF to write them into XLSX sheets'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / ANÁLISIS', title: isEs ? '1. Extracción de Operadores' : '1. Operator Extraction', desc: isEs ? 'pdf.js extrae todos los fragmentos de texto de cada página junto con sus coordenadas X/Y, tamaño de fuente y el índice de página. Esta información es el insumo crudo para el algoritmo de detección de tablas.' : 'pdf.js extracts all text fragments from each page along with their X/Y coordinates, font size, and page index. This information is the raw input for the table detection algorithm.' },
                { step: '02 / DETECCIÓN', title: isEs ? '2. Análisis Columnar' : '2. Columnar Analysis', desc: isEs ? 'El motor detecta columnas agrupando fragmentos de texto con coordenadas X similares (tolerancia configurable). Las filas se detectan agrupando fragmentos con coordenadas Y similares, construyendo la matriz de celdas de la tabla.' : 'The engine detects columns by grouping text fragments with similar X coordinates (configurable tolerance). Rows are detected by grouping fragments with similar Y coordinates, building the table cell matrix.' },
                { step: '03 / ESCRITURA', title: isEs ? '3. Generación con SheetJS' : '3. Generation with SheetJS', desc: isEs ? 'SheetJS (xlsx.js) escribe los datos de cada celda en la hoja de cálculo XLSX, detectando automáticamente si el valor es numérico, fecha o texto para asignar el tipo de celda correcto que permite operaciones matemáticas nativas en Excel.' : 'SheetJS (xlsx.js) writes each cell data into the XLSX spreadsheet, automatically detecting if the value is numeric, date, or text to assign the correct cell type enabling native math operations in Excel.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. Archivo XLSX Descargable' : '4. Downloadable XLSX File', desc: isEs ? 'El XLSX se serializa como un archivo binario y se ofrece para descarga directa. El resultado es completamente compatible con Microsoft Excel, LibreOffice Calc y Google Sheets — listo para análisis, filtros y fórmulas.' : 'The XLSX is serialized as a binary file and offered for direct download. The result is fully compatible with Microsoft Excel, LibreOffice Calc, and Google Sheets — ready for analysis, filters, and formulas.' },
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

          {/* BLOQUE 3: CAPACIDADES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Table className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Capacidades de extracción y preservación de datos tabulares' : 'Tabular data extraction and preservation capabilities'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Qué tipos de datos y estructuras se preservan en la conversión' : 'What data types and structures are preserved in the conversion'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Datos Numéricos y Fechas' : 'Numeric Data & Dates'}
                </strong>
                <p>
                  {isEs
                    ? 'Los valores numéricos — montos monetarios, porcentajes, cifras de inventario — se detectan y guardan como datos numéricos nativos en Excel, no como texto. Las fechas en formatos comunes (DD/MM/AAAA, MM-DD-YYYY) se convierten a datos de fecha Excel permitiendo ordenación y cálculos temporales.'
                    : 'Numeric values — monetary amounts, percentages, inventory figures — are detected and saved as native Excel numeric data, not text. Dates in common formats (DD/MM/YYYY, MM-DD-YYYY) are converted to Excel date data enabling sorting and time calculations.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-white" />
                  {isEs ? 'Múltiples Tablas por Página' : 'Multiple Tables per Page'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor detecta múltiples tablas independientes en la misma página — por ejemplo, una tabla de resumen arriba y un detalle de líneas abajo — y las escribe en hojas separadas o en rangos separados de la misma hoja según la configuración elegida.'
                    : 'The engine detects multiple independent tables on the same page — for example, a summary table above and a line detail below — and writes them in separate sheets or separate ranges in the same sheet according to the chosen configuration.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Excel → PDF de Alta Fidelidad' : 'Excel → PDF High-Fidelity'}
                </strong>
                <p>
                  {isEs
                    ? 'La conversión inversa XLSX→PDF renderiza la hoja de cálculo como un PDF paginado de alta fidelidad, preservando los estilos de celda, bordes de tabla, colores de relleno, fuentes y la paginación configurada en la hoja. Ideal para generar reportes PDF directamente desde datos Excel.'
                    : 'Reverse XLSX→PDF conversion renders the spreadsheet as a high-fidelity paginated PDF, preserving cell styles, table borders, fill colors, fonts, and the configured sheet pagination. Ideal for generating PDF reports directly from Excel data.'}
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
                  {isEs ? 'Beneficios de la conversión PDF ↔ Excel' : 'Benefits of PDF ↔ Excel conversion'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Precisión en la extracción de datos y compatibilidad garantizadas' : 'Data extraction precision and compatibility guaranteed'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Datos Numéricos Nativos' : 'Native Numeric Data', desc: isEs ? 'Los números se guardan como datos numéricos reales — aplicables en fórmulas SUM, AVERAGE, VLOOKUP.' : 'Numbers are saved as real numeric data — applicable in SUM, AVERAGE, VLOOKUP formulas.' },
                { title: isEs ? 'Múltiples Hojas' : 'Multiple Sheets', desc: isEs ? 'PDFs de múltiples páginas generan hojas de cálculo separadas para cada sección de tabla detectada.' : 'Multi-page PDFs generate separate spreadsheet sheets for each detected table section.' },
                { title: isEs ? 'Compatible con Excel 365' : 'Excel 365 Compatible', desc: isEs ? 'El XLSX es abierto sin errores en Microsoft Excel 2016-365, LibreOffice Calc y Google Sheets.' : 'The XLSX opens without errors in Microsoft Excel 2016-365, LibreOffice Calc, and Google Sheets.' },
                { title: isEs ? 'Filtros y Tablas Dinámicas' : 'Filters & Pivot Tables', desc: isEs ? 'Los datos numéricos exportados son compatibles con filtros automáticos y tablas dinámicas de Excel.' : 'Exported numeric data is compatible with Excel auto-filters and pivot tables.' },
                { title: isEs ? 'Sin Límite de Filas' : 'No Row Limit', desc: isEs ? 'Extrae tablas de cualquier tamaño — desde decenas hasta miles de filas — sin restricciones.' : 'Extract tables of any size — from tens to thousands of rows — without restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes de tus datos financieros enviados a servidores externos. Todo ocurre en tu RAM.' : 'Zero bytes of your financial data sent to external servers. Everything happens in your RAM.' },
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
