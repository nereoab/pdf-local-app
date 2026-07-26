'use client';

import { useState, useRef, useEffect } from 'react';
import { FileCode, FileDown, Loader2, X, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

export default function PdfToHtml() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
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
    toast.info(isEs ? 'Generando código HTML...' : 'Generating HTML code...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let htmlBody = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        htmlBody += `  <section class="pdf-page" id="page-${p}">\n    <h2>Página ${p}</h2>\n`;
        textContent.items.forEach((item: any) => {
          if (item.str && item.str.trim()) {
            htmlBody += `    <p>${item.str}</p>\n`;
          }
        });
        htmlBody += `  </section>\n<hr/>\n`;
      }

      const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${file.name.replace(/\.[^/.]+$/, "")}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; background-color: #f8fafc; }
    .pdf-page { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 24px; }
    h2 { color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    p { margin-bottom: 12px; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Archivo HTML generado con éxito!' : 'HTML file generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al convertir PDF a HTML.' : 'Error converting PDF to HTML.');
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
        className="w-full max-w-3xl mx-auto bg-cyan-950/10 hover:bg-cyan-950/30 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 p-6 rounded-full border border-cyan-500/30 group-hover:scale-110 group-hover:bg-cyan-500/30 group-hover:border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300"
        >
          <FileCode className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-cyan-200 transition-colors">
            {isEs ? 'PDF a HTML' : 'PDF to HTML'}
          </h2>
          <p className="text-cyan-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Exporta el contenido de tu PDF a un archivo web HTML estructurado' : 'Export your PDF content into structured web HTML'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all mt-1 cursor-pointer border border-cyan-300/40">
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
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileCode className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="w-32 h-44 bg-cyan-950/60 rounded-2xl border-2 border-cyan-500/40 flex flex-col items-center justify-center p-4 shadow-xl mb-4">
            <FileCode className="w-12 h-12 text-cyan-400 mb-2" />
            <span className="text-xs font-bold text-cyan-300 uppercase">HTML WEB</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Convertir a HTML' : 'Convert to HTML'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'El contenido del PDF se transformará en código y estructura web.' : 'PDF content will be transformed into web structure and code.'}
          </p>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Generando...' : 'Generating...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a HTML' : 'Convert to HTML'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar HTML' : 'Download HTML'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
