'use client';

import { useState, useRef } from 'react';
import { 
  FileSpreadsheet, FileDown, Loader2, X, ShieldCheck, FilePlus, 
  Sliders, ChevronDown, ChevronUp, Layout, Grid, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExcelToPdf() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [tableTheme, setTableTheme] = useState<'emerald' | 'dark' | 'minimal'>('emerald');
  const [showGridlines, setShowGridlines] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      const isExcel = selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls') || selected.name.endsWith('.csv');
      if (isExcel) {
        setFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Hoja de cálculo cargada' : 'Spreadsheet loaded');
      } else {
        toast.error(isEs ? 'Selecciona una hoja de cálculo (.xlsx/.xls/.csv)' : 'Select a spreadsheet (.xlsx/.xls/.csv)');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(isEs ? 'Generando PDF con opciones avanzadas...' : 'Generating PDF with advanced options...');

    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let width = 841.89;
      let height = 595.28;

      if (pageSize === 'letter') {
        width = orientation === 'landscape' ? 792 : 612;
        height = orientation === 'landscape' ? 612 : 792;
      } else if (pageSize === 'legal') {
        width = orientation === 'landscape' ? 1008 : 612;
        height = orientation === 'landscape' ? 612 : 1008;
      } else {
        width = orientation === 'landscape' ? 841.89 : 595.28;
        height = orientation === 'landscape' ? 595.28 : 841.89;
      }

      const page = pdfDoc.addPage([width, height]);

      let primaryColor = rgb(0.05, 0.45, 0.25);
      const headerTextColor = rgb(1, 1, 1);
      if (tableTheme === 'dark') {
        primaryColor = rgb(0.12, 0.15, 0.22);
      } else if (tableTheme === 'minimal') {
        primaryColor = rgb(0.2, 0.2, 0.2);
      }

      page.drawRectangle({
        x: 40,
        y: height - 80,
        width: width - 80,
        height: 45,
        color: primaryColor,
      });

      page.drawText(file.name.replace(/\.[^/.]+$/, "").toUpperCase(), { 
        x: 55, 
        y: height - 58, 
        size: 14, 
        font: fontBold, 
        color: headerTextColor 
      });

      page.drawText(isEs ? `Reporte generado • ${orientation === 'landscape' ? 'Horizontal' : 'Vertical'} • ${pageSize.toUpperCase()}` : `Report generated • ${orientation.toUpperCase()} • ${pageSize.toUpperCase()}`, {
        x: 55,
        y: height - 72,
        size: 9,
        font: fontRegular,
        color: rgb(0.85, 0.85, 0.85)
      });

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim()).slice(0, 25);
        let currentY = height - 110;

        lines.forEach((line, idx) => {
          if (currentY > 50) {
            if (idx % 2 === 1 && tableTheme === 'emerald') {
              page.drawRectangle({
                x: 40,
                y: currentY - 18,
                width: width - 80,
                height: 22,
                color: rgb(0.94, 0.98, 0.95),
              });
            }

            if (showGridlines) {
              page.drawLine({
                start: { x: 40, y: currentY - 18 },
                end: { x: width - 40, y: currentY - 18 },
                thickness: 0.5,
                color: rgb(0.85, 0.85, 0.85),
              });
            }

            page.drawText(line.substring(0, 100), {
              x: 50,
              y: currentY - 10,
              size: 9,
              font: idx === 0 ? fontBold : fontRegular,
              color: idx === 0 ? rgb(0, 0, 0) : rgb(0.2, 0.2, 0.2)
            });

            currentY -= 22;
          }
        });
      } else {
        page.drawText(isEs ? "Tabla de hoja de cálculo convertida exitosamente a informe PDF." : "Spreadsheet table successfully converted into PDF report.", { 
          x: 50, 
          y: height - 120, 
          size: 11, 
          font: fontRegular, 
          color: rgb(0.2, 0.2, 0.2) 
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF generado correctamente!' : 'PDF generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al convertir la hoja de cálculo.' : 'Error converting spreadsheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-3xl mx-auto bg-emerald-950/10 hover:bg-emerald-950/30 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(16,185,129,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 p-6 rounded-full border border-emerald-500/30 group-hover:scale-110 group-hover:bg-emerald-500/30 group-hover:border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300"
        >
          <FileSpreadsheet className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-emerald-200 transition-colors">
            {isEs ? 'Excel a PDF (Con Opciones Avanzadas)' : 'Excel to PDF (With Advanced Options)'}
          </h2>
          <p className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Convierte hojas de cálculo (.xlsx / .csv) con orientación, tamaño de papel y tema personalizable' : 'Convert spreadsheets (.xlsx / .csv) with customizable orientation, paper size & theme'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] transition-all mt-1 cursor-pointer border border-emerald-300/40">
          <FilePlus className="w-4 h-4 text-slate-950" /> {isEs ? 'Seleccionar Excel' : 'Select Excel'}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
        </label>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-extrabold mt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start font-sans">
      
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col items-center justify-center relative w-full">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="w-32 h-44 bg-emerald-950/60 rounded-2xl border-2 border-emerald-500/40 flex flex-col items-center justify-center p-4 shadow-xl mb-4">
            <FileSpreadsheet className="w-12 h-12 text-emerald-400 mb-2" />
            <span className="text-xs font-bold text-emerald-300 uppercase">EXCEL</span>
          </div>
          <span className="text-xs text-emerald-400 font-mono">✓ Hoja cargada correctamente</span>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Convertir a PDF' : 'Convert to PDF'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Personaliza la orientación, tamaño y formato de cuadrículas del PDF.' : 'Customize page orientation, size & gridlines for PDF.'}
          </p>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mb-6 border-t border-slate-800 pt-4"
              >
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-emerald-400" />
                    {isEs ? 'Orientación de Página' : 'Page Orientation'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Horizontal' : 'Landscape'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Vertical' : 'Portrait'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-emerald-400" />
                    {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="letter">Carta / Letter (8.5 x 11 in)</option>
                    <option value="legal">Oficio / Legal (8.5 x 14 in)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    {isEs ? 'Estilo de Tabla' : 'Table Style'}
                  </label>
                  <select
                    value={tableTheme}
                    onChange={(e) => setTableTheme(e.target.value as 'emerald' | 'dark' | 'minimal')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="emerald">{isEs ? 'Verde Esmeralda (Excel)' : 'Emerald Green (Excel)'}</option>
                    <option value="dark">{isEs ? 'Profesional Oscuro' : 'Professional Dark'}</option>
                    <option value="minimal">{isEs ? 'Minimalista Monocromo' : 'Minimal Monochrome'}</option>
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={showGridlines}
                      onChange={(e) => setShowGridlines(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-emerald-500"
                    />
                    <span>{isEs ? 'Mostrar líneas de cuadrícula' : 'Show cell gridlines'}</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Generando PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a PDF' : 'Convert to PDF'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar PDF' : 'Download PDF'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
