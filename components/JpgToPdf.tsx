'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Image as ImageIcon, FileDown, Loader2, X, ShieldCheck, FilePlus, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function JpgToPdf() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      if (selected.length > 0) {
        setFiles(prev => [...prev, ...selected]);
        setDownloadUrl(null);
        toast.success(isEs ? `${selected.length} imagen(es) añadida(s)` : `${selected.length} image(s) added`);
      } else {
        toast.error(isEs ? 'Selecciona archivos de imagen (JPG, PNG, WebP)' : 'Select image files (JPG, PNG, WebP)');
      }
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

  const executeConversion = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    let localUrl: string | null = null;

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();

        let image;
        if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          image = await pdfDoc.embedPng(arrayBuffer);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = 'Imagenes_Consolidadas.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF generado con éxito desde imágenes!' : 'PDF generated successfully from images!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al convertir imágenes a PDF.' : 'Error converting images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (files.length === 0) {
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
          <ImageIcon className="w-16 h-16 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-amber-200 transition-colors">
            {isEs ? 'Imagen a PDF (JPG / PNG)' : 'Image to PDF (JPG / PNG)'}
          </h2>
          <p className="text-amber-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            {isEs ? 'Combina tus imágenes JPG, PNG o WebP en un único archivo PDF' : 'Combine your JPG, PNG, or WebP images into a single PDF'}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] transition-all mt-1 cursor-pointer border border-amber-300/40">
          <FilePlus className="w-4 h-4 text-slate-950" /> {isEs ? 'Seleccionar imágenes' : 'Select images'}
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFilesChange} ref={fileInputRef} disabled={isProcessing} />
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col min-h-[440px]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            {isEs ? 'Imágenes a consolidar' : 'Images to consolidate'} ({files.length})
          </h3>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-white/10 rounded-2xl hover:border-amber-500/40 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-white text-sm font-semibold truncate max-w-xs sm:max-w-md">{file.name}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => moveFile(index, 'up')} disabled={index === 0 || isProcessing} className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg transition-colors">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1 || isProcessing} className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg transition-colors">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeFile(index)} disabled={isProcessing} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-1">
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
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Generar PDF' : 'Generate PDF'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'Cada imagen se convertirá en una página del PDF final.' : 'Each image will become a page in the output PDF.'}
          </p>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing || files.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Generando...' : 'Generating...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a PDF' : 'Convert to PDF'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar PDF' : 'Download PDF'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
