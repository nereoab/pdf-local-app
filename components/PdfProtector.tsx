'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt'; // IMPORTAMOS EL MOTOR DE ENCRIPTACIÓN
import { ShieldCheck, Lock, Loader2, FileText, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function PdfProtector() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const executeProtect = async () => {
    if (!file || !password) {
      toast.warning('Debes subir un archivo y escribir una contraseña');
      return;
    }
    
    setIsProcessing(true);
    let url: string | null = null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      // 1. Guardamos el PDF de forma normal (sin encriptar aún)
      const pdfBytes = await pdfDoc.save();

      // 2. Aplicamos la encriptación AES-256 con la nueva librería
      const encryptedBytes = await encryptPDF(new Uint8Array(pdfBytes), password, {
        ownerPassword: password,
        allowPrinting: true,
        allowModifying: false,
        allowCopying: false,
        allowAnnotating: false,
        allowFillingForms: false,
      });

      const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_Protegido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('¡PDF protegido y descargado con éxito!');
      setPassword(''); // Limpiamos la contraseña por seguridad
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al intentar proteger el documento.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-3xl bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
          <ShieldCheck className="w-16 h-16 text-slate-700" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Proteger PDF</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Añade una contraseña a tu documento PDF para evitar accesos no autorizados. Encriptación segura y 100% local.
        </p>
        
        <label className="bg-slate-800 hover:bg-slate-900 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-slate-800/20 hover:scale-105 active:scale-95">
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
            <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <span className="font-semibold text-slate-700 truncate text-sm">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} disabled={isProcessing} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-12">
          <div className="w-32 h-44 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center relative overflow-hidden mb-6">
            <Lock className="w-12 h-12 text-slate-300" />
            <div className="absolute bottom-0 w-full h-2 bg-slate-800"></div>
          </div>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Documento Listo</span>
        </div>
      </div>

      {/* PANEL DERECHO: Contraseña */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-xl">
            <ShieldCheck className="w-6 h-6 text-slate-700" /> Seguridad
          </div>
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Establecer Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Escribe una contraseña segura..."
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-3.5 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none font-medium text-slate-700 bg-slate-50 transition-all" 
                  disabled={isProcessing}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Esta contraseña será requerida para abrir, imprimir o copiar el contenido del documento.
              </p>
            </div>
          </div>
          
          <div className="mt-auto">
            <button 
              onClick={executeProtect} 
              disabled={isProcessing || !password} 
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-lg shadow-slate-800/20 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base">Encriptando...</span>
                </>
              ) : (
                'Proteger PDF'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}