'use client';

import { useState } from 'react';
import { 
  AlignLeft, FileDown, Loader2, X, Sliders, ChevronDown, ChevronUp, Sparkles 
} from 'lucide-react';
import { TextIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfToText() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [addPageSeparators, setAddPageSeparators] = useState<boolean>(true);
  const [preserveLayout, setPreserveLayout] = useState<boolean>(true);
  const [encoding, setEncoding] = useState<'utf-8' | 'ascii'>('utf-8');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        setExtractedText('');
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(isEs ? 'Extrayendo texto plano con opciones...' : 'Extracting plain text with options...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let textOutput = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        
        if (addPageSeparators) {
          textOutput += `=== ${isEs ? 'PÁGINA' : 'PAGE'} ${p} DE ${pdf.numPages} ===\n\n`;
        }

        if (preserveLayout) {
          // Agrupamiento por coordenadas Y
          const rows: { [yKey: number]: { x: number; text: string }[] } = {};
          textContent.items.forEach((item: any) => {
            if (item.str && item.transform) {
              const y = Math.round(item.transform[5]);
              const x = Math.round(item.transform[4]);
              if (!rows[y]) rows[y] = [];
              rows[y].push({ x, text: item.str });
            }
          });

          const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);
          sortedYs.forEach(y => {
            const lineItems = rows[y].sort((a, b) => a.x - b.x);
            textOutput += lineItems.map(i => i.text).join('  ') + '\n';
          });
          textOutput += '\n';
        } else {
          textContent.items.forEach((item: any) => {
            if (item.str) textOutput += `${item.str}\n`;
          });
          textOutput += '\n';
        }
      }

      setExtractedText(textOutput);

      const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8;' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Texto extraído con éxito!' : 'Text extracted successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al extraer texto del PDF.' : 'Error extracting text from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] text-center font-sans">
        <div className="p-4 rounded-2xl mb-4">
          <TextIcon className="w-16 h-16 rounded-2xl shadow-xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{isEs ? 'PDF a Texto Plano (Con Opciones Avanzadas)' : 'PDF to Plain Text (With Advanced Options)'}</h2>
        <p className="text-slate-400 text-xs mb-6 max-w-md">
          {isEs ? 'Extrae todo el texto de tu PDF manteniendo alineación espacial o separadores de página.' : 'Extract all text from your PDF maintaining spatial alignment or page separators.'}
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
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col relative w-full">
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <TextIcon className="w-5 h-5 rounded-sm" />
            <span className="font-semibold text-white truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => { setFile(null); setDownloadUrl(null); setExtractedText(''); }} disabled={isProcessing} className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {extractedText ? (
          <textarea
            readOnly
            value={extractedText}
            className="flex-1 w-full bg-slate-950 p-4 rounded-2xl border border-white/10 text-slate-300 font-mono text-xs outline-none resize-none overflow-y-auto min-h-[300px]"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <TextIcon className="w-16 h-16 rounded-2xl shadow-2xl mb-3" />
            <span className="text-slate-400 text-xs font-mono">{isEs ? 'Haz clic en Extraer Texto para comenzar' : 'Click Extract Text to start'}</span>
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{isEs ? 'Extraer Texto' : 'Extract Text'}</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {isEs ? 'Configura la estructura y formato del archivo .txt final.' : 'Configure file structure & formatting of final .txt file.'}
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
                    <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
                    {isEs ? 'Codificación' : 'Encoding'}
                  </label>
                  <select
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value as 'utf-8' | 'ascii')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="utf-8">UTF-8 (Soporta acentos y símbolos)</option>
                    <option value="ascii">ASCII Estándar</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={addPageSeparators}
                      onChange={(e) => setAddPageSeparators(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-indigo-500"
                    />
                    <span>{isEs ? 'Incluir marcas === PÁGINA N ===' : 'Include === PAGE N === marks'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={preserveLayout}
                      onChange={(e) => setPreserveLayout(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-indigo-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      {isEs ? 'Agrupar líneas por coordenada Y (Diseño espacial)' : 'Cluster lines by Y coordinate (Spatial layout)'}
                    </span>
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Extrayendo...' : 'Extracting...'}</span>
                </>
              ) : (
                isEs ? 'Extraer Texto (.txt)' : 'Extract Text (.txt)'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {isEs ? 'Descargar Archivo .TXT' : 'Download .TXT File'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
