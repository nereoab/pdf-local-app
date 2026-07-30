'use client';

import { useState } from 'react';
import { 
  FileDown, Loader2, X, Sliders, ChevronDown, ChevronUp, Grid, Image as ImageIcon 
} from 'lucide-react';
import { JpgIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfToJpg() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [imgFormat, setImgFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [dpiQuality, setDpiQuality] = useState<'300dpi' | '150dpi' | '72dpi'>('150dpi');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setGlobalFile(selectedFile);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo cargado correctamente' : 'File successfully loaded');
      } else {
        toast.error(isEs ? 'Por favor, selecciona un archivo PDF válido' : 'Please select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(isEs ? 'Renderizando páginas PDF a imágenes HD...' : 'Rendering PDF pages to HD images...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const scaleVal = dpiQuality === '300dpi' ? 3.0 : (dpiQuality === '72dpi' ? 1.0 : 2.0);
      const viewport = page.getViewport({ scale: scaleVal });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
        const mimeType = imgFormat === 'png' ? 'image/png' : (imgFormat === 'webp' ? 'image/webp' : 'image/jpeg');
        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const localUrl = URL.createObjectURL(blob);
        setDownloadUrl(localUrl);

        const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;
        const link = document.createElement('a');
        link.href = localUrl;
        link.download = `${file.name.replace(/\.[^/.]+$/, "")}_Pagina1.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(isEs ? `¡Imagen ${ext.toUpperCase()} generada con éxito!` : `Generated ${ext.toUpperCase()} image successfully!`);
      }
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al convertir las imágenes.' : 'An error occurred converting images.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] text-center font-sans">
        <div className="p-4 rounded-2xl mb-4">
          <JpgIcon className="w-16 h-16 rounded-2xl shadow-xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{isEs ? 'PDF a Imagen (Con Opciones Avanzadas)' : 'PDF to Image (With Advanced Options)'}</h2>
        <p className="text-slate-400 text-xs mb-6 max-w-md">
          {isEs ? 'Extrae láminas PDF a formato de imagen (JPG, PNG, WebP) con resolución DPI ajustable.' : 'Extract PDF pages to image format (JPG, PNG, WebP) with adjustable DPI.'}
        </p>
        
        <label className="bg-white text-black hover:bg-slate-200 px-8 py-3.5 rounded-full cursor-pointer font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95">
          {isEs ? 'Seleccionar archivo PDF' : 'Select PDF file'}
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start font-sans">
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col items-center justify-center relative w-full">
        <div className="absolute top-4 left-4 right-4 bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <JpgIcon className="w-5 h-5 rounded-sm" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <JpgIcon className="w-20 h-20 rounded-2xl shadow-2xl mb-4" />
          <span className="text-xs text-pink-400 font-mono">✓ Archivo cargado correctamente</span>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Convertir a Imagen' : 'Convert to Image'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Selecciona formato y resolución de imagen.' : 'Select format & image resolution.'}
          </p>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mb-6 border-t border-slate-800 pt-4"
              >
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    {isEs ? 'Formato de Imagen' : 'Image Format'}
                  </label>
                  <select
                    value={imgFormat}
                    onChange={(e) => setImgFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-pink-400 focus:outline-none"
                  >
                    <option value="jpeg">JPG / JPEG (Standard)</option>
                    <option value="png">PNG (Sin pérdida / Transparencia)</option>
                    <option value="webp">WebP (Compresión Web)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-pink-400" />
                    {isEs ? 'Calidad DPI' : 'DPI Quality'}
                  </label>
                  <select
                    value={dpiQuality}
                    onChange={(e) => setDpiQuality(e.target.value as '300dpi' | '150dpi' | '72dpi')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-pink-400 focus:outline-none"
                  >
                    <option value="300dpi">300 DPI (Alta Definición Imprimible)</option>
                    <option value="150dpi">150 DPI (Estándar Balanceado)</option>
                    <option value="72dpi">72 DPI (Optimizado para Pantalla)</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-pink-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Generando imágenes...' : 'Generating images...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a Imagen' : 'Convert to Image'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar Imagen' : 'Download Image'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
