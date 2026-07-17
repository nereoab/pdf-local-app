'use client';

import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { RotateCw, RotateCcw, FileText, X, Loader2, ArrowDownUp } from 'lucide-react';
import { toast } from 'sonner';

export default function PdfRotator() {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90); // Por defecto 90 grados a la derecha
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        toast.success('Archivo cargado correctamente');
      } else {
        toast.error('Por favor, selecciona un archivo PDF válido');
      }
    }
    e.target.value = '';
  };

  const executeRotate = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    let url: string | null = null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      const pages = pdfDoc.getPages();
      
      // Rotamos todas las páginas del documento
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotationAngle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_Rotado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('¡PDF rotado y descargado con éxito!');
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al intentar rotar el documento.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-3xl bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-amber-50 p-6 rounded-full mb-6">
          <RotateCw className="w-16 h-16 text-amber-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Rotar PDF</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Gira todas las páginas de tu documento PDF al instante. Ideal para documentos escaneados al revés.
        </p>
        
        <label className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95">
          Seleccionar archivo PDF
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* PANEL IZQUIERDO: Archivo */}
      <div className="flex-1 bg-slate-100/50 p-6 rounded-3xl border border-slate-200 min-h-[400px] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="font-semibold text-slate-700 truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} disabled={isProcessing} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div 
            className="w-32 h-44 bg-white rounded-lg shadow-md border-2 border-amber-200 flex items-center justify-center relative overflow-hidden mb-6 transition-transform duration-500"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          >
            <FileText className="w-12 h-12 text-amber-200" />
            <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full"></div>
          </div>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Previsualización</span>
        </div>
      </div>

      {/* PANEL DERECHO: Controles de Rotación */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-xl">
            <RotateCw className="w-6 h-6 text-amber-500" /> Dirección
          </div>
          
          <div className="space-y-3 mb-8">
            <button 
              onClick={() => setRotationAngle(90)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${rotationAngle === 90 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-amber-200 text-slate-600'}`}
            >
              <RotateCw className="w-5 h-5" />
              <span className="font-bold">Derecha (90°)</span>
            </button>

            <button 
              onClick={() => setRotationAngle(-90)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${rotationAngle === -90 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-amber-200 text-slate-600'}`}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="font-bold">Izquierda (-90°)</span>
            </button>

            <button 
              onClick={() => setRotationAngle(180)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${rotationAngle === 180 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-amber-200 text-slate-600'}`}
            >
              <ArrowDownUp className="w-5 h-5" />
              <span className="font-bold">Al revés (180°)</span>
            </button>
          </div>
          
          <div className="mt-auto">
            <button 
              onClick={executeRotate} 
              disabled={isProcessing} 
              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base">Rotando...</span>
                </>
              ) : (
                'Rotar PDF'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}