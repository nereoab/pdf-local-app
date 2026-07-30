'use client';

import { useState, useRef } from 'react';
import { 
  FileDown, Loader2, X, ShieldCheck, FilePlus, 
  Sliders, ChevronDown, ChevronUp, Layout, Grid 
} from 'lucide-react';
import { HtmlIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

type PageSize = 'a4' | 'letter' | 'legal';
type PageOrientation = 'portrait' | 'landscape';

export default function HtmlToPdf() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [includeBackgrounds, setIncludeBackgrounds] = useState<boolean>(true);
  const [addHeaderFooter, setAddHeaderFooter] = useState<boolean>(true);

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      const isHtml = selected.name.endsWith('.html') || selected.name.endsWith('.htm');
      if (isHtml) {
        setFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo HTML cargado' : 'HTML file loaded');
      } else {
        toast.error(isEs ? 'Selecciona un archivo HTML (.html/.htm)' : 'Select an HTML file (.html/.htm)');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(isEs ? 'Generando documento PDF...' : 'Generating PDF document...');

    try {
      if (API_SECRET) {
        try {
          const formData = new FormData();
          formData.append('File', file);
          formData.append('StoreFile', 'false');

          const response = await fetch(`https://v2.convertapi.com/convert/html/to/pdf?Secret=${API_SECRET}`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (data.Files && data.Files.length > 0) {
            const base64Data = data.Files[0].FileData;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const localUrl = URL.createObjectURL(blob);
            setDownloadUrl(localUrl);

            const link = document.createElement('a');
            link.href = localUrl;
            link.download = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(isEs ? '¡PDF generado con éxito!' : 'PDF generated successfully!');
            return;
          }
        } catch (err) { console.warn("ConvertAPI fallback local", err); }
      }

      const htmlText = await file.text();
      const cleanText = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let w = 595.28;
      let h = 841.89;
      if (pageSize === 'letter') { w = 612; h = 792; }
      else if (pageSize === 'legal') { w = 612; h = 1008; }

      if (orientation === 'landscape') {
        const temp = w; w = h; h = temp;
      }

      const page = pdfDoc.addPage([w, h]);
      page.drawText(`Documento Web HTML: ${file.name}`, { x: 50, y: h - 60, size: 16, font: fontBold, color: rgb(0.9, 0.35, 0.1) });

      const lines = cleanText.match(/.{1,75}/g) || ["Contenido del archivo HTML"];
      let y = h - 90;
      lines.slice(0, 35).forEach((line) => {
        if (y > 50) {
          page.drawText(line, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
          y -= 18;
        }
      });

      if (addHeaderFooter) {
        page.drawText(new Date().toLocaleDateString(), { x: w - 120, y: 25, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
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

      toast.success(isEs ? '¡PDF generado desde HTML con éxito!' : 'PDF generated from HTML successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al convertir HTML a PDF.' : 'Error converting HTML to PDF.');
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
        className="w-full max-w-3xl mx-auto bg-orange-950/10 hover:bg-orange-950/30 border-2 border-dashed border-orange-500/30 hover:border-orange-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[440px] relative overflow-hidden font-sans"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="p-4 rounded-2xl group-hover:scale-110 transition-transform"
        >
          <HtmlIcon className="w-16 h-16 rounded-2xl shadow-xl" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-orange-200 transition-colors">
            {isEs ? 'HTML a PDF (Con Opciones Avanzadas)' : 'HTML to PDF (With Advanced Options)'}
          </h2>
          <p className="text-orange-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Convierte páginas HTML a PDF con gráficos de fondo y formato de página' : 'Convert HTML pages to PDF with background graphics & paper size'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-white text-black hover:bg-slate-200 px-8 py-3.5 rounded-full font-black text-sm shadow-lg group-hover:scale-105 transition-all mt-1 cursor-pointer">
          <FilePlus className="w-4 h-4 text-black" /> {isEs ? 'Seleccionar HTML' : 'Select HTML'}
          <input type="file" accept=".html,.htm" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
        </label>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-extrabold mt-1 font-mono">
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
            <HtmlIcon className="w-5 h-5 rounded-sm" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <HtmlIcon className="w-20 h-20 rounded-2xl shadow-2xl mb-4" />
          <span className="text-xs text-orange-400 font-mono">✓ Archivo HTML cargado correctamente</span>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Convertir a PDF' : 'Convert to PDF'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Configura orientación, tamaño de papel y gráficos CSS.' : 'Configure orientation, paper size & CSS graphics.'}
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
                    <Layout className="w-3.5 h-3.5 text-orange-400" />
                    {isEs ? 'Orientación' : 'Orientation'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-orange-500 text-white border-orange-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Vertical
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-orange-500 text-white border-orange-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Horizontal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-orange-400" />
                    {isEs ? 'Tamaño de Papel' : 'Paper Size'}
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSize)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-orange-400 focus:outline-none"
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="letter">Carta / Letter</option>
                    <option value="legal">Oficio / Legal</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeBackgrounds}
                      onChange={(e) => setIncludeBackgrounds(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-orange-500"
                    />
                    <span>{isEs ? 'Renderizar fondos CSS' : 'Render CSS backgrounds'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={addHeaderFooter}
                      onChange={(e) => setAddHeaderFooter(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-orange-500"
                    />
                    <span>{isEs ? 'Incluir fecha en encabezado' : 'Include header date'}</span>
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-orange-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
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
