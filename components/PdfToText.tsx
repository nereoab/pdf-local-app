'use client';

import { useState, useRef, useEffect } from 'react';
import { AlignLeft, FileDown, Loader2, X, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

export default function PdfToText() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

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
        setExtractedText('');
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
    toast.info(isEs ? 'Extrayendo texto plano...' : 'Extracting plain text...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let textOutput = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        textOutput += `=== Página ${p} ===\n\n`;
        textContent.items.forEach((item: any) => {
          if (item.str) textOutput += `${item.str}\n`;
        });
        textOutput += `\n`;
      }

      setExtractedText(textOutput);

      const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8;' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Texto extraído con éxito!' : 'Text extracted successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al extraer texto del PDF.' : 'Error extracting text from PDF.');
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
        className="w-full max-w-3xl mx-auto bg-purple-950/10 hover:bg-purple-950/30 border-2 border-dashed border-purple-500/30 hover:border-purple-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-purple-500/20 to-violet-500/20 p-6 rounded-full border border-purple-500/30 group-hover:scale-110 group-hover:bg-purple-500/30 group-hover:border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-300"
        >
          <AlignLeft className="w-16 h-16 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-purple-200 transition-colors">
            {isEs ? 'PDF a Texto Plano (.txt)' : 'PDF to Plain Text (.txt)'}
          </h2>
          <p className="text-purple-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Extrae todo el texto seleccionable de tu PDF a un archivo plano de texto' : 'Extract all selectable text from your PDF into a plain text file'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-purple-500 hover:bg-purple-400 text-white px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(168,85,247,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] transition-all mt-1 cursor-pointer border border-purple-300/40">
          <FilePlus className="w-4 h-4 text-white" /> {isEs ? 'Seleccionar PDF' : 'Select PDF'}
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col relative">
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <AlignLeft className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); setExtractedText(''); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {extractedText ? (
          <textarea
            readOnly
            value={extractedText}
            className="flex-1 w-full bg-slate-950 p-4 rounded-2xl border border-white/10 text-slate-300 font-mono text-xs outline-none resize-none overflow-y-auto min-h-[300px]"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <AlignLeft className="w-14 h-14 text-purple-400/40 mb-3" />
            <span className="text-slate-400 text-xs">{isEs ? 'Haz clic en Extraer Texto para comenzar' : 'Click Extract Text to start'}</span>
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Extraer Texto' : 'Extract Text'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'Extrae el contenido textual de tu PDF a un archivo (.txt) editable.' : 'Extract textual content from PDF into editable (.txt) file.'}
          </p>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Extrayendo...' : 'Extracting...'}</span>
                </>
              ) : (
                isEs ? 'Extraer Texto (.txt)' : 'Extract Text (.txt)'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-purple-400 hover:bg-purple-300 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar Archivo .TXT' : 'Download .TXT File'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
