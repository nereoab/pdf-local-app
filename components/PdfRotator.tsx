'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { RotateCw, RotateCcw, FileText, X, Loader2, ArrowDownUp, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function PdfRotator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

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
        toast.success(isEs ? 'Archivo cargado correctamente' : 'File loaded successfully');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const executeRotate = async () => {
    if (!file) return;

    setIsProcessing(true);
    let downloadUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Girando páginas...' : 'Rotating pages...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotationAngle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_Rotado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF rotado y descargado con éxito!' : 'PDF rotated and downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al rotar el documento.' : 'An error occurred while rotating.');
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
        className="w-full max-w-3xl mx-auto bg-amber-950/10 hover:bg-amber-950/30 border-2 border-dashed border-amber-500/30 hover:border-amber-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 p-6 rounded-full border border-amber-500/30 group-hover:scale-110 group-hover:bg-amber-500/30 group-hover:border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300"
        >
          <RotateCw className="w-16 h-16 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-amber-200 transition-colors">
            {isEs ? 'Rotar documento PDF' : 'Rotate PDF document'}
          </h2>
          <p className="text-amber-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Gira todas las páginas de tu documento PDF al instante' : 'Rotate all pages of your PDF document instantly'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] transition-all mt-1 cursor-pointer border border-amber-300/40">
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
            <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div
            className="w-36 h-48 bg-white rounded-xl shadow-2xl border-2 border-amber-400 flex items-center justify-center relative overflow-hidden mb-6 transition-transform duration-500"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          >
            <FileText className="w-14 h-14 text-amber-300" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-amber-500 rounded-full shadow-md" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {isEs ? 'Vista previa de rotación' : 'Rotation preview'} ({rotationAngle}°)
          </span>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <div className="flex items-center gap-2 mb-6 text-white font-bold text-xl">
            <RotateCw className="w-6 h-6 text-amber-400" /> {isEs ? 'Orientación' : 'Orientation'}
          </div>

          <div className="space-y-3 mb-8">
            <button
              onClick={() => setRotationAngle(90)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                rotationAngle === 90
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-white/5 hover:border-amber-500/40 text-slate-300'
              }`}
            >
              <RotateCw className="w-5 h-5 text-amber-400" />
              <span>{isEs ? 'Derecha (90°)' : 'Right (90°)'}</span>
            </button>

            <button
              onClick={() => setRotationAngle(-90)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                rotationAngle === -90
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-white/5 hover:border-amber-500/40 text-slate-300'
              }`}
            >
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>{isEs ? 'Izquierda (-90°)' : 'Left (-90°)'}</span>
            </button>

            <button
              onClick={() => setRotationAngle(180)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                rotationAngle === 180
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-white/5 hover:border-amber-500/40 text-slate-300'
              }`}
            >
              <ArrowDownUp className="w-5 h-5 text-amber-400" />
              <span>{isEs ? 'Al revés (180°)' : 'Upside down (180°)'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={executeRotate}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{progressMsg || 'Rotando...'}</span>
            </>
          ) : (
            isEs ? 'Rotar PDF' : 'Rotate PDF'
          )}
        </button>
      </div>
    </div>
  );
}