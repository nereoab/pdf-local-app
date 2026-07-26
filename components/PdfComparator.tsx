'use client';

import { useState, useRef } from 'react';
import { GitCompare, FileText, X, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function PdfComparator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [url1, setUrl1] = useState<string | null>(null);
  const [url2, setUrl2] = useState<string | null>(null);

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile1(selected);
        setUrl1(URL.createObjectURL(selected));
        toast.success(isEs ? 'PDF 1 cargado' : 'PDF 1 loaded');
      }
    }
    e.target.value = '';
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile2(selected);
        setUrl2(URL.createObjectURL(selected));
        toast.success(isEs ? 'PDF 2 cargado' : 'PDF 2 loaded');
      }
    }
    e.target.value = '';
  };

  const resetComparator = () => {
    if (url1) URL.revokeObjectURL(url1);
    if (url2) URL.revokeObjectURL(url2);
    setFile1(null);
    setFile2(null);
    setUrl1(null);
    setUrl2(null);
  };

  if (!file1 || !file2) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
        <input type="file" accept=".pdf" className="hidden" ref={file1InputRef} onChange={handleFile1Change} />
        <input type="file" accept=".pdf" className="hidden" ref={file2InputRef} onChange={handleFile2Change} />

        <div className="text-center flex flex-col items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 p-5 rounded-full border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <GitCompare className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isEs ? 'Comparar 2 archivos PDF' : 'Compare 2 PDF files'}
          </h2>
          <p className="text-slate-400 text-sm max-w-md">
            {isEs ? 'Muestra fácilmente las diferencias entre dos archivos para revisar cambios y versiones' : 'Easily display differences between two files to review changes'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Tarjeta Documento 1 */}
          <div
            onClick={() => file1InputRef.current?.click()}
            className={`bg-slate-900/80 border-2 ${file1 ? 'border-blue-500' : 'border-dashed border-slate-800 hover:border-blue-500/50'} rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px]`}
          >
            {file1 ? (
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-blue-400" />
                <span className="text-white font-bold text-sm truncate max-w-[200px]">{file1.name}</span>
                <span className="text-emerald-400 text-xs font-semibold">{isEs ? '✓ Listo para comparar' : '✓ Ready to compare'}</span>
              </div>
            ) : (
              <>
                <FilePlus className="w-10 h-10 text-blue-400" />
                <span className="text-white font-bold text-base">{isEs ? '1. Primer Documento PDF' : '1. First PDF Document'}</span>
                <span className="text-slate-400 text-xs">{isEs ? 'Haz clic para seleccionar' : 'Click to select'}</span>
              </>
            )}
          </div>

          {/* Tarjeta Documento 2 */}
          <div
            onClick={() => file2InputRef.current?.click()}
            className={`bg-slate-900/80 border-2 ${file2 ? 'border-blue-500' : 'border-dashed border-slate-800 hover:border-blue-500/50'} rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px]`}
          >
            {file2 ? (
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-indigo-400" />
                <span className="text-white font-bold text-sm truncate max-w-[200px]">{file2.name}</span>
                <span className="text-emerald-400 text-xs font-semibold">{isEs ? '✓ Listo para comparar' : '✓ Ready to compare'}</span>
              </div>
            ) : (
              <>
                <FilePlus className="w-10 h-10 text-indigo-400" />
                <span className="text-white font-bold text-base">{isEs ? '2. Segundo Documento PDF' : '2. Second PDF Document'}</span>
                <span className="text-slate-400 text-xs">{isEs ? 'Haz clic para seleccionar' : 'Click to select'}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-extrabold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-blue-400" />
          <span className="text-white font-bold text-sm">{isEs ? 'Comparación Lado a Lado' : 'Side by Side Comparison'}</span>
        </div>
        <button onClick={resetComparator} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300">
          <X className="w-4 h-4" /> {isEs ? 'Limpiar documentos' : 'Clear documents'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
        {/* PDF 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col">
          <div className="pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
            <span className="text-blue-400 font-bold text-xs uppercase">{isEs ? 'Documento Original' : 'Original Document'}</span>
            <span className="text-white text-xs font-semibold truncate max-w-[200px]">{file1.name}</span>
          </div>
          {url1 && (
            <iframe src={`${url1}#toolbar=0&view=Fit`} className="w-full flex-1 rounded-xl border border-white/10 min-h-[440px] bg-white" title="PDF 1" />
          )}
        </div>

        {/* PDF 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col">
          <div className="pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
            <span className="text-indigo-400 font-bold text-xs uppercase">{isEs ? 'Documento Modificado' : 'Modified Document'}</span>
            <span className="text-white text-xs font-semibold truncate max-w-[200px]">{file2.name}</span>
          </div>
          {url2 && (
            <iframe src={`${url2}#toolbar=0&view=Fit`} className="w-full flex-1 rounded-xl border border-white/10 min-h-[440px] bg-white" title="PDF 2" />
          )}
        </div>
      </div>
    </div>
  );
}
