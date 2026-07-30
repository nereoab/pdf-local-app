'use client';

import { useState, useRef } from 'react';
import { 
  FileDown, Loader2, X, FilePlus, 
  Sliders, ChevronDown, ChevronUp, Grid, Type 
} from 'lucide-react';
import { TextIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

type PageSize = 'a4' | 'letter' | 'legal';
type FontFamily = 'helvetica' | 'courier' | 'times';

export default function TextToPdf() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<FontFamily>('helvetica');
  const [fontSize, setFontSize] = useState<number>(10);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setDownloadUrl(null);
      selected.text().then(txt => setManualText(txt)).catch(() => {});
      toast.success(isEs ? 'Archivo de texto cargado' : 'Text file loaded');
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    const textToUse = manualText || (file ? await file.text() : '');
    if (!textToUse.trim()) {
      toast.error(isEs ? 'Escribe o sube un texto para convertir' : 'Write or upload text to convert');
      return;
    }

    setIsProcessing(true);
    toast.info(isEs ? 'Generando PDF con formato personalizado...' : 'Generating PDF with custom format...');

    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      let fontSymbol = StandardFonts.Helvetica;
      if (fontFamily === 'courier') fontSymbol = StandardFonts.Courier;
      else if (fontFamily === 'times') fontSymbol = StandardFonts.TimesRoman;

      const font = await pdfDoc.embedFont(fontSymbol);

      let w = 595.28;
      let h = 841.89;
      if (pageSize === 'letter') { w = 612; h = 792; }
      else if (pageSize === 'legal') { w = 612; h = 1008; }

      const margin = 50;
      const maxChars = Math.floor((w - margin * 2) / (fontSize * 0.6));
      const lineHeight = fontSize * lineSpacing;

      const lines = textToUse.split('\n');
      let page = pdfDoc.addPage([w, h]);
      let y = h - margin;

      lines.forEach((line) => {
        const regex = new RegExp(`.{1,${maxChars}}`, 'g');
        const wrapped = line.match(regex) || [""];
        wrapped.forEach((subLine) => {
          if (y < margin + 20) {
            page = pdfDoc.addPage([w, h]);
            y = h - margin;
          }
          page.drawText(subLine, { x: margin, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
          y -= lineHeight;
        });
      });

      if (addPageNumbers) {
        const pages = pdfDoc.getPages();
        pages.forEach((p, idx) => {
          p.drawText(`Página ${idx + 1} de ${pages.length}`, {
            x: w / 2 - 35,
            y: 20,
            size: 9,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const filename = file ? file.name.replace(/\.[^/.]+$/, "") : "Texto";
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF generado correctamente!' : 'PDF generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al generar el PDF.' : 'Error generating PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 font-sans">
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col relative w-full">
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <TextIcon className="w-5 h-5 rounded-sm" />
            <span className="font-bold text-white text-sm">
              {file ? file.name : (isEs ? 'Escribe o pega tu texto plano' : 'Type or paste plain text')}
            </span>
          </div>
          {file && (
            <button onClick={() => { setFile(null); setManualText(''); setDownloadUrl(null); }} className="text-slate-400 hover:text-red-400 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder={isEs ? 'Escribe tu contenido aquí...' : 'Write your content here...'}
          className="flex-1 w-full bg-slate-950 p-4 rounded-2xl border border-white/10 text-white font-mono text-xs outline-none resize-none focus:border-indigo-500/50 transition-colors min-h-[280px]"
        />

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border border-white/10 transition-colors">
            <FilePlus className="w-4 h-4 text-indigo-400" />
            {isEs ? 'Subir archivo .TXT' : 'Upload .TXT file'}
            <input type="file" accept=".txt" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
          </label>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Texto a PDF' : 'Text to PDF'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Personaliza tipografía, tamaño e interlineado del PDF.' : 'Customize font, size & line spacing.'}
          </p>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mb-6 border-t border-slate-800 pt-4 text-xs"
              >
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    {isEs ? 'Tipografía' : 'Font Family'}
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="helvetica">Helvetica (Sans-Serif Moderno)</option>
                    <option value="courier">Courier (Monoespaciado / Código)</option>
                    <option value="times">Times New Roman (Serif Clásico)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      {isEs ? 'Tamaño Fuente' : 'Font Size'}
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                    >
                      <option value={9}>9 pt</option>
                      <option value={10}>10 pt (Estándar)</option>
                      <option value={12}>12 pt</option>
                      <option value={14}>14 pt (Grande)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      {isEs ? 'Interlineado' : 'Line Spacing'}
                    </label>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                    >
                      <option value={1.0}>1.0 (Sencillo)</option>
                      <option value={1.5}>1.5 (Estándar)</option>
                      <option value={2.0}>2.0 (Doble)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-indigo-400" />
                    {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSize)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="letter">Carta / Letter</option>
                    <option value="legal">Oficio / Legal</option>
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={addPageNumbers}
                      onChange={(e) => setAddPageNumbers(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-indigo-500"
                    />
                    <span>{isEs ? 'Numeración de páginas en pie de página' : 'Footer page numbers'}</span>
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
              disabled={isProcessing || !manualText.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
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
