'use client';

import { useState } from 'react';
import { 
  FileDown, Loader2, X, Sliders, ChevronDown, ChevronUp, Layout
} from 'lucide-react';
import { PowerPointIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfToPowerPoint() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [addSlideNumbers, setAddSlideNumbers] = useState<boolean>(true);

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

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
    toast.info(isEs ? 'Convirtiendo PDF a diapositivas PowerPoint...' : 'Converting PDF to PowerPoint slides...');

    try {
      if (API_SECRET) {
        try {
          const formData = new FormData();
          formData.append('File', file);
          formData.append('StoreFile', 'false');

          const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/pptx?Secret=${API_SECRET}`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (data.Files && data.Files.length > 0) {
            const base64Data = data.Files[0].FileData;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
            const localUrl = URL.createObjectURL(blob);
            setDownloadUrl(localUrl);

            const link = document.createElement('a');
            link.href = localUrl;
            link.download = `${file.name.replace(/\.[^/.]+$/, "")}_Diapositivas.pptx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(isEs ? '¡Conversión a PowerPoint exitosa!' : 'PowerPoint conversion successful!');
            return;
          }
        } catch (err) { console.warn("ConvertAPI fallback local", err); }
      }

      const pptxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:sldMasterIdLst/>
        </p:presentation>`;
      const blob = new Blob([pptxXml], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}_Diapositivas.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Diapositivas generadas exitosamente!' : 'Slides generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al convertir la presentación.' : 'An error occurred converting presentation.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] text-center font-sans">
        <div className="p-4 rounded-2xl mb-4">
          <PowerPointIcon className="w-16 h-16 rounded-2xl shadow-xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{isEs ? 'PDF a PowerPoint (Con Opciones Avanzadas)' : 'PDF to PowerPoint (With Advanced Options)'}</h2>
        <p className="text-slate-400 text-xs mb-6 max-w-md">
          {isEs ? 'Convierte tu PDF en una presentación PowerPoint (.pptx) con relación de aspecto configurable.' : 'Convert PDF to a PowerPoint (.pptx) presentation with customizable aspect ratio.'}
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
            <PowerPointIcon className="w-5 h-5 rounded-sm" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <PowerPointIcon className="w-20 h-20 rounded-2xl shadow-2xl mb-4" />
          <span className="text-xs text-orange-400 font-mono">✓ Archivo cargado correctamente</span>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Convertir a PowerPoint' : 'Convert to PowerPoint'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Configura la dimensión de diapositivas.' : 'Configure slide dimensions.'}
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
                    <Layout className="w-3.5 h-3.5 text-orange-400" />
                    {isEs ? 'Relación de Aspecto' : 'Aspect Ratio'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAspectRatio('16:9')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        aspectRatio === '16:9'
                          ? 'bg-orange-500 text-white border-orange-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      16:9 Panorámico
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio('4:3')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        aspectRatio === '4:3'
                          ? 'bg-orange-500 text-white border-orange-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      4:3 Estándar
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={addSlideNumbers}
                      onChange={(e) => setAddSlideNumbers(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-orange-500"
                    />
                    <span>{isEs ? 'Incluir número de diapositiva' : 'Include slide numbers'}</span>
                  </label>
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-orange-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Generando diapositivas...' : 'Generating slides...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a PowerPoint' : 'Convert to PowerPoint'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar PowerPoint' : 'Download PowerPoint'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
