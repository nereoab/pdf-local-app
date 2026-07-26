'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Trash2, FileText, X, Loader2, ShieldCheck, FilePlus, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

type PageThumb = {
  pageNum: number; // 1-indexed
  thumbnailUrl: string | null;
  selectedToDelete: boolean;
};

export default function PdfPageDeleter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(isEs ? 'Renderizando páginas...' : 'Rendering pages...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const count = pdf.numPages;

      const thumbs: PageThumb[] = [];
      for (let p = 1; p <= count; p++) {
        setProgressMsg(isEs ? `Cargando pág ${p} de ${count}...` : `Loading page ${p} of ${count}...`);
        if (p % 3 === 0) await new Promise(r => setTimeout(r, 5));

        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as any).promise;
          thumbs.push({
            pageNum: p,
            thumbnailUrl: canvas.toDataURL('image/jpeg', 0.6),
            selectedToDelete: false
          });
        }
      }

      setPages(thumbs);
      toast.success(isEs ? 'Páginas cargadas con éxito' : 'Pages loaded successfully');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
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
    setPages([]);
    setGlobalFile(null);
  };

  const toggleSelectPage = (index: number) => {
    setPages(prev => {
      const updated = [...prev];
      updated[index].selectedToDelete = !updated[index].selectedToDelete;
      return updated;
    });
  };

  const selectAll = (status: boolean) => {
    setPages(prev => prev.map(p => ({ ...p, selectedToDelete: status })));
  };

  const executeDeletePages = async () => {
    if (!file || pages.length === 0) return;

    const toKeep = pages.filter(p => !p.selectedToDelete);
    if (toKeep.length === 0) {
      toast.error(isEs ? 'No puedes eliminar todas las páginas del documento.' : 'You cannot delete all pages from the document.');
      return;
    }

    if (toKeep.length === pages.length) {
      toast.info(isEs ? 'Selecciona al menos una página para eliminar.' : 'Select at least one page to delete.');
      return;
    }

    setIsProcessing(true);
    let downloadUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Generando nuevo PDF...' : 'Generating new PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      const newPdf = await PDFDocument.create();
      const keepIndices = toKeep.map(p => p.pageNum - 1);
      const copiedPages = await newPdf.copyPages(pdfDoc, keepIndices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_SinPaginas.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Páginas eliminadas correctamente!' : 'Pages deleted successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al eliminar páginas' : 'Error deleting pages');
    } finally {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedCount = pages.filter(p => p.selectedToDelete).length;

  if (!file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-3xl mx-auto bg-red-950/10 hover:bg-red-950/30 border-2 border-dashed border-red-500/30 hover:border-red-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-red-500/20 to-rose-500/20 p-6 rounded-full border border-red-500/30 group-hover:scale-110 group-hover:bg-red-500/30 group-hover:border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all duration-300"
        >
          <Trash2 className="w-16 h-16 text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-red-200 transition-colors">
            {isEs ? 'Eliminar páginas de PDF' : 'Delete pages from PDF'}
          </h2>
          <p className="text-red-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Haz clic en las páginas que quieras eliminar de tu documento' : 'Click the pages you want to remove from your document'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-red-500 hover:bg-red-400 text-white px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(239,68,68,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(239,68,68,0.7)] transition-all mt-1 cursor-pointer border border-red-300/40">
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col min-h-[500px]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-red-400" />
            <span className="text-white font-bold text-sm truncate max-w-xs">{file.name}</span>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full border border-white/10 font-medium">
              {pages.length} {isEs ? 'páginas' : 'pages'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAll(true)}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5 text-red-400" /> {isEs ? 'Marcar todas' : 'Select all'}
            </button>
            <button
              onClick={() => selectAll(false)}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Square className="w-3.5 h-3.5" /> {isEs ? 'Desmarcar' : 'Deselect'}
            </button>
            <button onClick={removeFile} className="text-slate-400 hover:text-red-400 p-1.5 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isProcessing && pages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
            <p className="text-red-400 text-sm font-semibold animate-pulse">{progressMsg}</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[500px] p-2">
            {pages.map((p, index) => (
              <div
                key={p.pageNum}
                onClick={() => toggleSelectPage(index)}
                className={`relative group flex flex-col items-center p-2 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                  p.selectedToDelete
                    ? 'border-red-500 bg-red-950/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-95'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="absolute top-3 right-3 z-10">
                  {p.selectedToDelete ? (
                    <div className="bg-red-500 text-white p-1 rounded-full shadow-md">
                      <Trash2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-500 bg-slate-900/80 group-hover:border-white" />
                  )}
                </div>

                <div className="w-full aspect-[1/1.414] bg-white rounded-lg overflow-hidden flex items-center justify-center relative">
                  {p.thumbnailUrl && <img src={p.thumbnailUrl} alt={`Page ${p.pageNum}`} className="w-full h-full object-contain" />}
                  {p.selectedToDelete && (
                    <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-red-300 font-black text-xs uppercase tracking-widest bg-red-900/80 px-2 py-1 rounded">
                        {isEs ? 'Eliminar' : 'Delete'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="mt-2 text-xs font-bold text-slate-400">{isEs ? `Pág. ${p.pageNum}` : `Page ${p.pageNum}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[500px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Eliminar Páginas' : 'Delete Pages'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs
              ? 'Haz clic en las miniaturas para seleccionar las páginas que deseas descartar.'
              : 'Click thumbnails to select pages you want to remove.'}
          </p>

          <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-3 mb-6">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{isEs ? 'Páginas totales:' : 'Total pages:'}</span>
              <span className="text-white font-bold">{pages.length}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{isEs ? 'Páginas a eliminar:' : 'Pages to delete:'}</span>
              <span className="text-red-400 font-bold">{selectedCount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300 font-medium pt-2 border-t border-white/5">
              <span>{isEs ? 'Páginas resultantes:' : 'Resulting pages:'}</span>
              <span className="text-emerald-400 font-bold">{pages.length - selectedCount}</span>
            </div>
          </div>
        </div>

        <button
          onClick={executeDeletePages}
          disabled={isProcessing || selectedCount === 0 || selectedCount === pages.length}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{progressMsg || 'Procesando...'}</span>
            </>
          ) : (
            isEs ? `Eliminar ${selectedCount} página(s)` : `Delete ${selectedCount} page(s)`
          )}
        </button>
      </div>
    </div>
  );
}
