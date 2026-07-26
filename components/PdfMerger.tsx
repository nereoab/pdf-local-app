'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Merge, FileText, X, Loader2, ArrowUp, ArrowDown, Plus, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfMerger() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (selected.length === 0) {
        toast.error(isEs ? 'Por favor, selecciona archivos PDF válidos' : 'Please select valid PDF files');
        return;
      }
      setFiles(prev => [...prev, ...selected]);
      toast.success(isEs ? `${selected.length} archivo(s) añadido(s)` : `${selected.length} file(s) added`);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    setFiles(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const executeMerge = async () => {
    if (files.length < 2) {
      toast.error(isEs ? 'Debes agregar al menos 2 archivos PDF para unirlos.' : 'You must add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    let downloadUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Creando documento unificado...' : 'Creating unified document...');
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressMsg(isEs ? `Procesando ${file.name} (${i + 1}/${files.length})...` : `Processing ${file.name} (${i + 1}/${files.length})...`);
        await new Promise(r => setTimeout(r, 10));

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageIndices = pdfDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);

        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      setProgressMsg(isEs ? 'Guardando PDF final...' : 'Saving final PDF...');
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as any], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'Documento_Unificado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Archivos PDF unidos con éxito!' : 'PDF files merged successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al unir los archivos.' : 'An error occurred while merging files.');
    } finally {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
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
          <Merge className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-emerald-200 transition-colors">
            {isEs ? 'Unir archivos PDF' : 'Merge PDF files'}
          </h2>
          <p className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Selecciona varios PDF para unirlos en un solo documento' : 'Select multiple PDFs to merge into a single document'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] transition-all mt-1 cursor-pointer border border-emerald-300/40">
          <FilePlus className="w-4 h-4 text-slate-950" /> {isEs ? 'Seleccionar archivos PDF' : 'Select PDF files'}
          <input
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={handleFilesSelected}
            ref={fileInputRef}
            disabled={isProcessing}
          />
        </label>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-extrabold mt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-6">
      <input type="file" multiple accept=".pdf" className="hidden" ref={addMoreInputRef} onChange={handleFilesSelected} />

      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col min-h-[440px]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            {isEs ? 'Archivos a unir' : 'Files to merge'} ({files.length})
          </h3>
          <button
            onClick={() => addMoreInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEs ? 'Añadir más' : 'Add more'}
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-white/10 rounded-2xl hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white text-sm font-semibold truncate max-w-xs sm:max-w-md">{file.name}</span>
                    <span className="text-slate-400 text-xs">{formatFileSize(file.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0 || isProcessing}
                    className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg transition-colors"
                    title={isEs ? 'Mover arriba' : 'Move up'}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1 || isProcessing}
                    className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg transition-colors"
                    title={isEs ? 'Mover abajo' : 'Move down'}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-1"
                    title={isEs ? 'Quitar archivo' : 'Remove file'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Resumen de Unión' : 'Merge Summary'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs
              ? 'Los archivos se combinarán en el orden exacto que ves en la lista.'
              : 'The files will be merged in the exact order shown on the list.'}
          </p>

          <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-3 mb-6">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{isEs ? 'Total de archivos:' : 'Total files:'}</span>
              <span className="text-emerald-400 font-bold">{files.length}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{isEs ? 'Privacidad:' : 'Privacy:'}</span>
              <span className="text-emerald-400 font-bold">{isEs ? '100% Local' : '100% Local'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={executeMerge}
            disabled={isProcessing || files.length < 2}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">{progressMsg || 'Uniendo...'}</span>
              </>
            ) : (
              isEs ? 'Unir PDFs' : 'Merge PDFs'
            )}
          </button>

          <button
            onClick={() => setFiles([])}
            disabled={isProcessing}
            className="w-full text-xs font-bold text-slate-400 hover:text-red-400 py-1 transition-colors"
          >
            {isEs ? 'Limpiar lista' : 'Clear list'}
          </button>
        </div>
      </div>
    </div>
  );
}
