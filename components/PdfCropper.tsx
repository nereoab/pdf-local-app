'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Crop, FileText, X, Loader2, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function PdfCropper() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Márgenes de recorte en milímetros (mm)
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [marginLeft, setMarginLeft] = useState<number>(10);
  const [marginRight, setMarginRight] = useState<number>(10);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(isEs ? 'Leyendo documento...' : 'Reading document...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setTotalPages(pdfDoc.getPageCount());
      toast.success(isEs ? 'Documento cargado correctamente' : 'Document loaded successfully');
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

  const applyPreset = (mm: number) => {
    setMarginTop(mm);
    setMarginBottom(mm);
    setMarginLeft(mm);
    setMarginRight(mm);
  };

  const executeCrop = async () => {
    if (!file) return;

    setIsProcessing(true);
    let downloadUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Recortando márgenes...' : 'Cropping margins...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      // Convertir mm a puntos PDF (1 mm = 2.83465 pt)
      const mmToPoints = (mm: number) => mm * 2.83465;

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const topPt = mmToPoints(marginTop);
        const bottomPt = mmToPoints(marginBottom);
        const leftPt = mmToPoints(marginLeft);
        const rightPt = mmToPoints(marginRight);

        const newX = leftPt;
        const newY = bottomPt;
        const newWidth = Math.max(10, width - leftPt - rightPt);
        const newHeight = Math.max(10, height - topPt - bottomPt);

        // Establecemos CropBox y MediaBox
        page.setCropBox(newX, newY, newWidth, newHeight);
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_Recortado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF recortado con éxito!' : 'PDF cropped successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al recortar el PDF.' : 'An error occurred while cropping the PDF.');
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
        className="w-full max-w-3xl mx-auto bg-purple-950/10 hover:bg-purple-950/30 border-2 border-dashed border-purple-500/30 hover:border-purple-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-purple-500/20 to-violet-500/20 p-6 rounded-full border border-purple-500/30 group-hover:scale-110 group-hover:bg-purple-500/30 group-hover:border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-300"
        >
          <Crop className="w-16 h-16 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-purple-200 transition-colors">
            {isEs ? 'Recortar PDF' : 'Crop PDF'}
          </h2>
          <p className="text-purple-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Ajusta y recorta los márgenes de tus páginas PDF en segundos' : 'Adjust and trim the margins of your PDF pages in seconds'}
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative min-h-[440px]">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
            <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">{totalPages} págs</span>
          </div>
          <button onClick={removeFile} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vista previa simulada de la página con los márgenes de recorte */}
        <div className="mt-12 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            {isEs ? 'Vista previa de márgenes' : 'Margins preview'}
          </span>

          <div className="relative w-48 h-64 bg-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden flex items-center justify-center">
            {/* Zona de recorte (recuadro interior) */}
            <div
              className="absolute border-2 border-dashed border-purple-500 bg-purple-500/10 transition-all duration-300 flex items-center justify-center"
              style={{
                top: `${Math.min(30, marginTop * 1.5)}%`,
                bottom: `${Math.min(30, marginBottom * 1.5)}%`,
                left: `${Math.min(30, marginLeft * 1.5)}%`,
                right: `${Math.min(30, marginRight * 1.5)}%`
              }}
            >
              <span className="text-[10px] font-black text-purple-400 bg-slate-900/80 px-2 py-0.5 rounded border border-purple-500/40">
                {isEs ? 'Área visible' : 'Visible area'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Márgenes de Recorte' : 'Crop Margins'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Especifica cuántos milímetros (mm) deseas recortar de cada borde.' : 'Specify how many millimeters (mm) to crop from each edge.'}
          </p>

          <div className="flex gap-2 mb-6">
            <button onClick={() => applyPreset(5)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors">
              5 mm
            </button>
            <button onClick={() => applyPreset(10)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors">
              10 mm
            </button>
            <button onClick={() => applyPreset(20)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors">
              20 mm
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{isEs ? 'Superior (Top)' : 'Top (mm)'}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={marginTop}
                onChange={e => setMarginTop(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-white font-semibold text-center outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{isEs ? 'Inferior (Bottom)' : 'Bottom (mm)'}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={marginBottom}
                onChange={e => setMarginBottom(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-white font-semibold text-center outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{isEs ? 'Izquierdo (Left)' : 'Left (mm)'}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={marginLeft}
                onChange={e => setMarginLeft(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-white font-semibold text-center outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{isEs ? 'Derecho (Right)' : 'Right (mm)'}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={marginRight}
                onChange={e => setMarginRight(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-white font-semibold text-center outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        <button
          onClick={executeCrop}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{progressMsg || 'Recortando...'}</span>
            </>
          ) : (
            isEs ? 'Recortar PDF' : 'Crop PDF'
          )}
        </button>
      </div>
    </div>
  );
}
