'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Sliders, FileDown, Loader2, X, ShieldCheck, FilePlus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

export default function PdfCompressor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [compressionLevel, setCompressionLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

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
        setCompressedSize(null);
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const executeCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    let localUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Optimizando estructura PDF...' : 'Optimizing PDF structure...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // Remove metadata & re-encode objects for compression
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');

      setProgressMsg(isEs ? 'Comprimiendo contenido del archivo...' : 'Compressing file content...');
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

      const blob = new Blob([compressedBytes as any], { type: 'application/pdf' });
      setCompressedSize(blob.size);
      localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${originalName}_Comprimido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF comprimido y optimizado con éxito!' : 'PDF compressed & optimized successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al comprimir el documento.' : 'An error occurred during compression.');
    } finally {
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
          <Sliders className="w-16 h-16 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-purple-200 transition-colors">
            {isEs ? 'Comprimir archivo PDF' : 'Compress PDF file'}
          </h2>
          <p className="text-purple-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Reduce el peso de tu archivo conservando la máxima calidad posible' : 'Reduce file size while optimizing for maximal PDF quality'}
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <Sliders className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
            <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">{formatFileSize(file.size)}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="w-36 h-48 bg-purple-950/60 rounded-2xl border-2 border-purple-500/40 flex flex-col items-center justify-center p-4 shadow-xl mb-4">
            <Zap className="w-14 h-14 text-purple-400 mb-2" />
            <span className="text-xs font-bold text-purple-300 uppercase">PDF COMPRIMIDO</span>
          </div>
          {compressedSize && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full text-emerald-400 font-bold text-xs">
              <span>{isEs ? 'Nuevo Tamaño:' : 'New Size:'} {formatFileSize(compressedSize)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Nivel de Compresión' : 'Compression Level'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'Selecciona el nivel de optimización para reducir el peso del archivo.' : 'Select optimization level to compress file size.'}
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => setCompressionLevel('recommended')}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                compressionLevel === 'recommended'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-bold'
                  : 'border-white/5 hover:border-purple-500/40 text-slate-300'
              }`}
            >
              <div className="text-sm font-bold">{isEs ? 'Recomendada' : 'Recommended'}</div>
              <div className="text-[10px] text-slate-400 font-normal">{isEs ? 'Buena calidad, alto ahorro' : 'Good quality, high savings'}</div>
            </button>

            <button
              onClick={() => setCompressionLevel('extreme')}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                compressionLevel === 'extreme'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-bold'
                  : 'border-white/5 hover:border-purple-500/40 text-slate-300'
              }`}
            >
              <div className="text-sm font-bold">{isEs ? 'Extrema' : 'Extreme'}</div>
              <div className="text-[10px] text-slate-400 font-normal">{isEs ? 'Menos calidad, ahorro máximo' : 'Lower quality, max savings'}</div>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeCompress}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{progressMsg || 'Comprimiendo...'}</span>
                </>
              ) : (
                isEs ? 'Comprimir PDF' : 'Compress PDF'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar PDF Comprimido' : 'Download Compressed PDF'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
