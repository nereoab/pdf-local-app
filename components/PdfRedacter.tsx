'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { EyeOff, FileText, X, Loader2, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function PdfRedacter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Configuración de censura por zonas
  const [redactHeader, setRedactHeader] = useState(true);
  const [redactFooter, setRedactFooter] = useState(false);

  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(isEs ? 'Analizando documento...' : 'Analyzing document...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setTotalPages(pdfDoc.getPageCount());
      toast.success(isEs ? 'Documento listo para censura' : 'Document ready for redaction');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al leer el archivo PDF' : 'Error reading PDF file');
      setFile(null);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  useEffect(() => {
    if (globalFile && !file) {
      cargarPdf(globalFile);
    }
  }, [globalFile, file]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        await cargarPdf(selected);
      }
    }
    e.target.value = '';
  };

  const removeFile = () => {
    setFile(null);
    setTotalPages(0);
    setGlobalFile(null);
  };

  const executeRedact = async () => {
    if (!file) return;

    setIsProcessing(true);
    let downloadUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Aplicando parches de censura...' : 'Applying redaction patches...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        // Parche negro en encabezado si está activado
        if (redactHeader) {
          page.drawRectangle({
            x: 0,
            y: height - 50,
            width,
            height: 50,
            color: rgb(0, 0, 0)
          });
        }

        // Parche negro en pie de página si está activado
        if (redactFooter) {
          page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height: 50,
            color: rgb(0, 0, 0)
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_Censurado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Contenido privado censurado con éxito!' : 'Sensitive content redacted successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al aplicar la censura.' : 'An error occurred during redaction.');
    } finally {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  if (!file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-3xl mx-auto bg-rose-950/10 hover:bg-rose-950/30 border-2 border-dashed border-rose-500/30 hover:border-rose-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(244,63,94,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-rose-500/20 to-red-500/20 p-6 rounded-full border border-rose-500/30 group-hover:scale-110 group-hover:bg-rose-500/30 group-hover:border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)] transition-all duration-300"
        >
          <EyeOff className="w-16 h-16 text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-rose-200 transition-colors">
            {isEs ? 'Censurar contenido PDF' : 'Redact PDF content'}
          </h2>
          <p className="text-rose-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Tapa y remueve información sensible o datos privados de tu PDF' : 'Black out and remove sensitive or private data from your PDF'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-rose-500 hover:bg-rose-400 text-white px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(244,63,94,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(244,63,94,0.7)] transition-all mt-1 cursor-pointer border border-rose-300/40">
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
            <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">{totalPages} págs</span>
          </div>
          <button onClick={removeFile} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="relative w-44 h-60 bg-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col items-center justify-between p-3">
            {redactHeader && <div className="w-full h-8 bg-black rounded flex items-center justify-center text-[9px] text-white font-bold">CENSURADO</div>}
            <div className="flex-1 flex flex-col items-center justify-center">
              <EyeOff className="w-10 h-10 text-rose-400/40" />
            </div>
            {redactFooter && <div className="w-full h-8 bg-black rounded flex items-center justify-center text-[9px] text-white font-bold">CENSURADO</div>}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Zonas a Censurar' : 'Redaction Zones'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'Selecciona las secciones donde deseas ocultar la información.' : 'Select sections where you want to conceal information.'}
          </p>

          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-3 bg-slate-800/80 border border-white/10 rounded-xl cursor-pointer hover:border-rose-500/40 transition-colors">
              <input
                type="checkbox"
                checked={redactHeader}
                onChange={e => setRedactHeader(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
              <span className="text-sm font-semibold text-white">{isEs ? 'Censurar Encabezado (Header)' : 'Redact Header'}</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/80 border border-white/10 rounded-xl cursor-pointer hover:border-rose-500/40 transition-colors">
              <input
                type="checkbox"
                checked={redactFooter}
                onChange={e => setRedactFooter(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
              <span className="text-sm font-semibold text-white">{isEs ? 'Censurar Pie de Página (Footer)' : 'Redact Footer'}</span>
            </label>
          </div>
        </div>

        <button
          onClick={executeRedact}
          disabled={isProcessing || (!redactHeader && !redactFooter)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-rose-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{progressMsg || 'Censurando...'}</span>
            </>
          ) : (
            isEs ? 'Censurar PDF' : 'Redact PDF'
          )}
        </button>
      </div>
    </div>
  );
}
