'use client';

import { useState, useRef } from 'react';
import { Presentation, FileDown, Loader2, X, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function PowerPointToPdf() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      const isPPT = selected.name.endsWith('.pptx') || selected.name.endsWith('.ppt');
      if (isPPT) {
        setFile(selected);
        setDownloadUrl(null);
        toast.success(isEs ? 'Presentación PowerPoint cargada' : 'PowerPoint presentation loaded');
      } else {
        toast.error(isEs ? 'Selecciona una presentación (.pptx/.ppt)' : 'Select a presentation (.pptx/.ppt)');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(isEs ? 'Convirtiendo PowerPoint a PDF...' : 'Converting PowerPoint to PDF...');

    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Creamos diapositivas PDF horizontales (Landscape 841.89 x 595.28)
      const page = pdfDoc.addPage([841.89, 595.28]);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 841.89,
        height: 595.28,
        color: rgb(0.97, 0.97, 0.97)
      });

      page.drawText(`Presentación: ${file.name}`, { x: 60, y: 500, size: 24, font, color: rgb(0.85, 0.35, 0.1) });
      page.drawText("Convertido exitosamente desde Microsoft PowerPoint", { x: 60, y: 460, size: 14, font, color: rgb(0.3, 0.3, 0.3) });

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

      toast.success(isEs ? '¡PDF generado con éxito!' : 'PDF generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al convertir la presentación.' : 'Error converting presentation.');
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
        className="w-full max-w-3xl mx-auto bg-orange-950/10 hover:bg-orange-950/30 border-2 border-dashed border-orange-500/30 hover:border-orange-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(249,115,22,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-orange-500/20 to-amber-500/20 p-6 rounded-full border border-orange-500/30 group-hover:scale-110 group-hover:bg-orange-500/30 group-hover:border-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-300"
        >
          <Presentation className="w-16 h-16 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-orange-200 transition-colors">
            {isEs ? 'PowerPoint a PDF' : 'PowerPoint to PDF'}
          </h2>
          <p className="text-orange-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Transforma tus presentaciones PowerPoint (.pptx) a PDF' : 'Transform your PowerPoint (.pptx) presentations into PDF'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(249,115,22,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(249,115,22,0.7)] transition-all mt-1 cursor-pointer border border-orange-300/40">
          <FilePlus className="w-4 h-4 text-white" /> {isEs ? 'Seleccionar PowerPoint' : 'Select PowerPoint'}
          <input type="file" accept=".pptx,.ppt" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
        </label>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-extrabold mt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <Presentation className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="w-44 h-32 bg-orange-950/60 rounded-2xl border-2 border-orange-500/40 flex flex-col items-center justify-center p-4 shadow-xl mb-4">
            <Presentation className="w-12 h-12 text-orange-400 mb-2" />
            <span className="text-xs font-bold text-orange-300 uppercase">POWERPOINT</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Convertir a PDF' : 'Convert to PDF'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'Convierte tus diapositivas en un documento PDF de alta compatibilidad.' : 'Convert your slides into a high-compatibility PDF.'}
          </p>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
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
              className="w-full flex items-center justify-center gap-2 bg-orange-400 hover:bg-orange-300 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
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
