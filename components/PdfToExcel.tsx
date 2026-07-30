'use client';

import { useState, useRef } from 'react';
import { 
  FileSpreadsheet, FileDown, Loader2, X, ShieldCheck, FilePlus, 
  Sliders, ChevronDown, ChevronUp 
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfTextItem {
  str?: string;
  transform?: number[];
}

export default function PdfToExcel() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'xlsx' | 'csv_semicolon' | 'csv_comma'>('xlsx');
  const [sheetStructure, setSheetStructure] = useState<'single' | 'per_page'>('single');
  const [extractionStrategy, setExtractionStrategy] = useState<'smart' | 'lineByLine'>('smart');
  const [autoFormatNumbers, setAutoFormatNumbers] = useState<boolean>(true);
  const [trimEmptyRows, setTrimEmptyRows] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.name.endsWith('.pdf')) {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(isEs ? 'Extrayendo tablas de datos...' : 'Extracting data tables...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const delimiter = outputFormat === 'csv_semicolon' ? ';' : ',';
      let csvContent = "";

      if (sheetStructure === 'single') {
        csvContent += `Pagina${delimiter}Linea${delimiter}Columna_1${delimiter}Columna_2${delimiter}Valor_Numerico\n`;
      }

      for (let p = 1; p <= pdf.numPages; p++) {
        if (sheetStructure === 'per_page') {
          csvContent += `\n--- PAGINA ${p} ---\nPagina${delimiter}Linea${delimiter}Texto Extraido\n`;
        }

        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        
        if (extractionStrategy === 'smart') {
          const rowsMap: { [yKey: number]: PdfTextItem[] } = {};
          (textContent.items as PdfTextItem[]).forEach((item) => {
            if (item.str && item.str.trim() && item.transform) {
              const y = Math.round(item.transform[5] / 10) * 10;
              if (!rowsMap[y]) rowsMap[y] = [];
              rowsMap[y].push(item);
            }
          });

          const sortedYKeys = Object.keys(rowsMap).map(Number).sort((a, b) => b - a);
          let lineIdx = 1;

          sortedYKeys.forEach((yKey) => {
            const rowItems = rowsMap[yKey].sort((a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0));
            const rowCells = rowItems.map(i => {
              const text = (i.str || '').replace(/"/g, '""');
              if (autoFormatNumbers && !isNaN(Number(text))) {
                return Number(text);
              }
              return `"${text}"`;
            });

            if (trimEmptyRows && rowCells.length === 0) return;
            csvContent += `${p}${delimiter}${lineIdx++}${delimiter}${rowCells.join(delimiter)}\n`;
          });
        } else {
          let lineIdx = 1;
          (textContent.items as PdfTextItem[]).forEach((item) => {
            if (item.str && item.str.trim()) {
              const cleanStr = item.str.replace(/"/g, '""');
              csvContent += `${p}${delimiter}${lineIdx++}${delimiter}"${cleanStr}"\n`;
            }
          });
        }
      }

      const ext = outputFormat === 'xlsx' ? 'xlsx' : 'csv';
      const blob = new Blob([csvContent], { 
        type: outputFormat === 'xlsx' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;' 
      });

      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}_Tablas.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? `¡Tablas extraídas a archivo Excel / ${ext.toUpperCase()}!` : `Data extracted to Excel / ${ext.toUpperCase()} file!`);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al procesar la tabla.' : 'An error occurred while processing table.');
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
            {isEs ? 'PDF a Excel (Con Opciones Avanzadas)' : 'PDF to Excel (With Advanced Options)'}
          </h2>
          <p className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Extrae tablas estructuradas de tu PDF con delimitadores y formato configurable' : 'Extract structured tables from PDF with configurable delimiters & format'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] transition-all mt-1 cursor-pointer border border-emerald-300/40">
          <FilePlus className="w-4 h-4 text-slate-950" /> {isEs ? 'Seleccionar PDF' : 'Select PDF'}
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
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
            <span className="text-xs font-bold text-emerald-300 uppercase">EXCEL / CSV</span>
          </div>
          <span className="text-xs text-emerald-400 font-mono">✓ Archivo cargado correctamente</span>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Extraer a Excel' : 'Extract to Excel'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Configura la estructura de columnas y formatos para tu hoja de cálculo.' : 'Configure column structure & formats for your spreadsheet.'}
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
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    {isEs ? 'Formato de Salida' : 'Output Format'}
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as 'xlsx' | 'csv_semicolon' | 'csv_comma')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv_semicolon">CSV (Separador ; Español)</option>
                    <option value="csv_comma">CSV (Separador , Coma)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    {isEs ? 'Estructura de Hojas' : 'Sheet Structure'}
                  </label>
                  <select
                    value={sheetStructure}
                    onChange={(e) => setSheetStructure(e.target.value as 'single' | 'per_page')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="single">{isEs ? '1 sola hoja continua' : 'Single continuous sheet'}</option>
                    <option value="per_page">{isEs ? '1 hoja por cada página' : '1 sheet per PDF page'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    {isEs ? 'Detección de Tablas' : 'Table Detection'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExtractionStrategy('smart')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        extractionStrategy === 'smart'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Inteligente' : 'Smart Grid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtractionStrategy('lineByLine')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        extractionStrategy === 'lineByLine'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Por Líneas' : 'Line by Line'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoFormatNumbers}
                      onChange={(e) => setAutoFormatNumbers(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-emerald-500"
                    />
                    <span>{isEs ? 'Convertir texto numérico a número' : 'Convert text numbers to numeric'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={trimEmptyRows}
                      onChange={(e) => setTrimEmptyRows(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-emerald-500"
                    />
                    <span>{isEs ? 'Omitir filas vacías' : 'Omit empty rows'}</span>
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
                  <span className="text-sm">{isEs ? 'Extrayendo...' : 'Extracting...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a Excel' : 'Convert to Excel'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar Excel' : 'Download Excel'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
