'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Activity, FileDown, Loader2, X, ShieldCheck, FilePlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

export default function PdfRepairer() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recoveredPages, setRecoveredPages] = useState<number | null>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setRecoveredPages(null);
      toast.success(isEs ? 'Archivo PDF cargado para reparación' : 'PDF file loaded for repair');
    }
    e.target.value = '';
  };

  const executeRepair = async () => {
    if (!file) return;

    setIsProcessing(true);
    let localUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Analizando estructura del documento corrupto...' : 'Analyzing corrupt document structure...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();

      // Carga forzada ignorando errores de encriptación o corrupción XRef
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false
      });

      const pageCount = pdfDoc.getPageCount();
      setProgressMsg(isEs ? `Reconstruyendo ${pageCount} página(s)...` : `Rebuilding ${pageCount} page(s)...`);

      // Re-guardamos en un nuevo documento PDF limpio
      const cleanPdf = await PDFDocument.create();
      const pageIndices = pdfDoc.getPageIndices();
      const copiedPages = await cleanPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => cleanPdf.addPage(page));

      const repairedBytes = await cleanPdf.save();
      const blob = new Blob([repairedBytes as any], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);

      setRecoveredPages(pageCount);
      setDownloadUrl(localUrl);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${originalName}_Reparado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Documento PDF recuperado y reparado!' : 'PDF document recovered and repaired!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'No se pudo reparar el archivo automáticamente.' : 'Unable to repair file automatically.');
    } finally {
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
        className="w-full max-w-3xl mx-auto bg-cyan-950/10 hover:bg-cyan-950/30 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] min-h-[440px] relative overflow-hidden"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-6 rounded-full border border-cyan-500/30 group-hover:scale-110 group-hover:bg-cyan-500/30 group-hover:border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300"
        >
          <Activity className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-cyan-200 transition-colors">
            {isEs ? 'Reparar archivo PDF' : 'Repair PDF file'}
          </h2>
          <p className="text-cyan-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Sube un PDF dañado o corrupto e intentaremos reparar y recuperar sus datos' : 'Upload a corrupt PDF and we will try to fix and recover it'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all mt-1 cursor-pointer border border-cyan-300/40">
          <FilePlus className="w-4 h-4 text-slate-950" /> {isEs ? 'Seleccionar PDF dañado' : 'Select corrupt PDF'}
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
            <Activity className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="w-36 h-48 bg-cyan-950/60 rounded-2xl border-2 border-cyan-500/40 flex flex-col items-center justify-center p-4 shadow-xl mb-4">
            <Activity className="w-14 h-14 text-cyan-400 mb-2" />
            <span className="text-xs font-bold text-cyan-300 uppercase">REPARADOR PDF</span>
          </div>

          {recoveredPages !== null && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEs ? `${recoveredPages} páginas recuperadas` : `${recoveredPages} pages recovered`}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Reparación de PDF' : 'PDF Repair'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs
              ? 'Reconstruiremos la tabla de objetos del documento para arreglar archivos corruptos o ilegibles.'
              : 'We will rebuild document object structure to fix unreadable or damaged files.'}
          </p>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeRepair}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{progressMsg || 'Reparando...'}</span>
                </>
              ) : (
                isEs ? 'Reparar PDF' : 'Repair PDF'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar PDF Reparado' : 'Download Repaired PDF'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
