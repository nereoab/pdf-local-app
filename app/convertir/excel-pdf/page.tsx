'use client';

import ExcelPdfConverter from '../../../components/ExcelPdfConverter';
import { useLanguage } from '../../../context/LanguageContext';
import { Table, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ExcelToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        
        {/* ENCABEZADO DE NAVEGACIÓN Y TÍTULO */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
            <Table className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <Link href="/convertir" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-white text-xs font-bold">{isEs ? 'Excel a PDF / PDF a Excel (2 en 1)' : 'Excel to PDF / PDF to Excel (2 in 1)'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEs ? 'CONVERTIR EXCEL Y PDF (CONVERSOR DUAL 2 EN 1)' : 'CONVERT EXCEL & PDF (2-IN-1 DUAL CONVERTER)'}
            </h1>
          </div>
        </div>

        {/* HERRAMIENTA INTERACTIVA 2 EN 1 */}
        <div className="mb-16">
          <ExcelPdfConverter defaultMode="excel-to-pdf" />
        </div>

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12">
          
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede con tus hojas de cálculo durante la conversión?' : 'What happens to your spreadsheets during conversion?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 EXTRACCIÓN Y RENDERIZADO VECTORIAL 100% LOCAL' : '🔒 100% LOCAL VECTOR EXTRACTION & RENDERING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? '1. Conversión de Excel (.xlsx) a PDF' : '1. Excel (.xlsx) to PDF Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Procesa el árbol OpenXML de la hoja de cálculo (`xl/worksheets/sheet1.xml`), ajustando los anchos de columna y márgenes de impresión para generar un reporte PDF limpio y apaisado.'
                    : 'Parses spreadsheet OpenXML trees (`xl/worksheets/sheet1.xml`), fitting column widths and print margins to generate a clean landscape PDF report.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  {isEs ? '2. Conversión de PDF a Excel (.xlsx)' : '2. PDF to Excel (.xlsx) Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Identifica las fronteras vectoriales y celdas de las tablas dentro del PDF, transponiendo los valores numéricos y campos de texto directamente a filas y columnas de Excel.'
                    : 'Identifies vector borders & table cells inside the PDF, transposing numeric values and text directly into Excel rows and columns.'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
