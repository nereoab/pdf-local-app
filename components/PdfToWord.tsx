'use client';

import { useState } from 'react';
import { FileText, FileDown, Loader2, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // ⚠️ PEGA TU API SECRET DE CONVERTAPI AQUÍ
  // ⚠️ Llamamos a la variable de entorno segura
const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET; 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setDownloadUrl(null);
        toast.success('Archivo cargado correctamente');
      } else {
        toast.error('Por favor, selecciona un archivo PDF válido');
      }
    }
    e.target.value = '';
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info('Analizando y convirtiendo archivo...');

    try {
      const formData = new FormData();
      formData.append('File', file);
      
      // 🛡️ EL TRUCO DE PRIVACIDAD: Le exigimos a la API que NO guarde el archivo
      formData.append('StoreFile', 'false');

      // Hacemos la petición a ConvertAPI
      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/docx?Secret=${API_SECRET}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.Files && data.Files.length > 0) {
        // Ahora FileData SÍ contiene el documento real
        const base64Data = data.Files[0].FileData;

        // Decodificamos el archivo a bytes de forma estructurada
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Ensamblamos el archivo con la firma oficial de Microsoft Word
        const blob = new Blob([byteArray], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });

        const localUrl = URL.createObjectURL(blob);
        setDownloadUrl(localUrl);
        
        // Forzamos la descarga segura desde la memoria
        const link = document.createElement('a');
        link.href = localUrl;
        link.download = `${file.name.replace(/\.[^/.]+$/, "")}_Editado.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('¡Conversión exitosa! Archivo listo para editar en Word.');
      } else {
        throw new Error(data.Message || 'Error en la conversión');
      }

    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al convertir el documento. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] transition-colors">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-full mb-6">
          <FileText className="w-16 h-16 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">PDF a Word</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
          Convierte tu PDF a un documento de Word (.docx) para editar el texto libremente en Microsoft Word o Google Docs.
        </p>
        
        <label className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95">
          Seleccionar archivo PDF
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* PANEL IZQUIERDO: Archivo */}
      <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col items-center justify-center relative transition-colors">
        <div className="absolute top-4 left-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => {setFile(null); setDownloadUrl(null);}} disabled={isProcessing} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-6 mt-12">
          <div className="flex flex-col items-center">
            <div className="w-24 h-32 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md border border-red-200 dark:border-red-800 flex items-center justify-center mb-4">
              <span className="font-black text-red-500 text-xl">PDF</span>
            </div>
          </div>
          
          <ArrowRight className={`w-8 h-8 ${isProcessing ? 'text-blue-500 animate-pulse' : 'text-slate-300 dark:text-slate-600'}`} />
          
          <div className="flex flex-col items-center">
            <div className={`w-24 h-32 rounded-lg shadow-md border flex items-center justify-center mb-4 transition-colors ${downloadUrl ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <span className={`font-black text-xl ${downloadUrl ? 'text-blue-600' : 'text-slate-300 dark:text-slate-600'}`}>DOCX</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: Controles */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col transition-colors">
          <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-white font-bold text-xl">
            <FileDown className="w-6 h-6 text-blue-500" /> Conversión
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            El archivo será enviado a nuestros servidores seguros para ser convertido a un formato editable de Word.
          </p>
          
          <div className="mt-auto space-y-3">
            {!downloadUrl ? (
              <button 
                onClick={executeConversion} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-base">Convirtiendo...</span>
                  </>
                ) : (
                  'Convertir a Word'
                )}
              </button>
            ) : (
              <a 
                href={downloadUrl}
                download
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <FileDown className="w-6 h-6" />
                Descargar Word
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}