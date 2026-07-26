'use client';

import { useState, useRef } from 'react';
import { AlignLeft, FileDown, Loader2, X, ShieldCheck, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function TextToPdf() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setDownloadUrl(null);
      selected.text().then(txt => setManualText(txt)).catch(() => {});
      toast.success(isEs ? 'Archivo de texto cargado' : 'Text file loaded');
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    const textToUse = manualText || (file ? await file.text() : '');
    if (!textToUse.trim()) {
      toast.error(isEs ? 'Escribe o sube un texto para convertir' : 'Write or upload text to convert');
      return;
    }

    setIsProcessing(true);
    toast.info(isEs ? 'Generando PDF...' : 'Generating PDF...');

    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const lines = textToUse.split('\n');
      let page = pdfDoc.addPage([595.28, 841.89]);
      let y = 800;

      lines.forEach((line) => {
        const wrapped = line.match(/.{1,80}/g) || [""];
        wrapped.forEach((subLine) => {
          if (y < 50) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 800;
          }
          page.drawText(subLine, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const filename = file ? file.name.replace(/\.[^/.]+$/, "") : "Texto";
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF generado correctamente desde texto!' : 'PDF generated from text successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al generar el PDF.' : 'Error generating PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 min-h-[440px] flex flex-col relative">
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <AlignLeft className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-sm">
              {file ? file.name : (isEs ? 'Escribe o pega tu texto plano' : 'Type or paste plain text')}
            </span>
          </div>
          {file && (
            <button onClick={() => { setFile(null); setManualText(''); setDownloadUrl(null); }} className="text-slate-400 hover:text-red-400 p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder={isEs ? 'Escribe tu contenido aquí...' : 'Write your content here...'}
          className="flex-1 w-full bg-slate-950 p-4 rounded-2xl border border-white/10 text-white font-mono text-xs outline-none resize-none focus:border-purple-500/50 transition-colors min-h-[280px]"
        />

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border border-white/10 transition-colors">
            <FilePlus className="w-4 h-4 text-purple-400" />
            {isEs ? 'Subir archivo .TXT' : 'Upload .TXT file'}
            <input type="file" accept=".txt" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
          </label>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between h-auto lg:h-[440px]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{isEs ? 'Texto a PDF' : 'Text to PDF'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {isEs ? 'Genera un documento PDF formateado listo a partir de tu texto plano.' : 'Generate a ready formatted PDF from plain text.'}
          </p>
        </div>

        <div className="space-y-3">
          {!downloadUrl ? (
            <button
              onClick={executeConversion}
              disabled={isProcessing || !manualText.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isEs ? 'Generando PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                isEs ? 'Convertir a PDF' : 'Convert to PDF'
              )}
            </button>
          ) : (
            <a
              href={downloadUrl}
              download
              className="w-full flex items-center justify-center gap-2 bg-purple-400 hover:bg-purple-300 text-slate-950 py-4 rounded-xl font-black text-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
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
