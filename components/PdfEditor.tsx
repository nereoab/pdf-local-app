'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldCheck, FileEdit, FileText, X, Save, Download, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '@/store/useFileStore';

type Step = 'upload' | 'edit' | 'download';

export default function PdfEditor() {
  const viewer = useRef<HTMLDivElement>(null);
  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [step, setStep] = useState<Step>(globalFile ? 'edit' : 'upload');
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
      setStep('edit');
    }
  }, [globalFile, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStep('edit'); // Pasamos a la pantalla de edición
    }
  };

  // Inicializar el motor de Apryse solo cuando estamos en el paso 'edit'
  useEffect(() => {
    if (step === 'edit' && file && viewer.current && !isLoaded) {
      import('@pdftron/webviewer').then((module) => {
        const WebViewer = module.default;

        WebViewer(
          {
            path: '/webviewer',
            fullAPI: true,
          },
          viewer.current!
        ).then((instance) => {
          setIsLoaded(true);
          setViewerInstance(instance);
          
          const { UI } = instance;
          UI.setLanguage('es');
          UI.enableFeatures([UI.Feature.ContentEdit]);
          UI.openElements(['leftPanel']); 
          
          if (document.documentElement.classList.contains('dark')) {
            UI.setTheme('dark');
          }
          
          UI.loadDocument(file, { filename: file.name });
          toast.success('¡Documento abierto y listo para editar!');
        }).catch(err => {
          console.error(err);
          toast.error('Error al cargar el motor de edición.');
        });
      });
    }
  }, [step, file, isLoaded]);

  // 🔥 BOTÓN 1: "OK, Terminé de editar" (Guarda los cambios y pasa a la pantalla final)
  const handleFinishEditing = async () => {
    if (!viewerInstance) return;
    
    setIsProcessing(true);
    toast.info('Grabando modificaciones...');

    try {
      const docViewer = viewerInstance.Core.documentViewer;
      const doc = docViewer.getDocument();

      // Extraemos el código fuente modificado
      const data = await doc.getFileData();
      const arr = new Uint8Array(data);
      const blob = new Blob([arr], { type: 'application/pdf' });
      
      // Creamos la URL para descargar
      if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl); // Limpieza de memoria
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);
      
      toast.success('¡Modificaciones grabadas correctamente!');
      setStep('download'); // Pasamos a la pantalla de descarga
    } catch (error) {
      console.error(error);
      toast.error('Error al grabar el documento.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔥 BOTÓN 2: "Descargar Archivo Modificado"
  const handleDownload = () => {
    if (!editedPdfUrl) return;
    
    const link = document.createElement('a');
    link.href = editedPdfUrl;
    link.download = `${file?.name.replace('.pdf', '')}_Editado.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartOver = () => {
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    setFile(null);
    setIsLoaded(false);
    setViewerInstance(null);
    setEditedPdfUrl(null);
    setStep('upload');
  };

  // ==========================================
  // PANTALLA 1: SUBIDA
  // ==========================================
  if (step === 'upload') {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] transition-colors">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-full mb-6">
          <FileEdit className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 text-center">Edición Nativa de PDF</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
          Sube tu PDF. Nuestro motor de nivel empresarial extraerá las fuentes originales para que edites el texto respetando el formato.
        </p>
        
        <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg active:scale-95">
          Seleccionar archivo PDF
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
    );
  }

  // ==========================================
  // PANTALLA 2: EDICIÓN (MOTOR APRYSE)
  // ==========================================
  if (step === 'edit') {
    return (
      <div className="w-full flex flex-col animate-in fade-in duration-500">
        <div className="w-full mb-4 flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200">
            <FileText className="w-5 h-5 text-indigo-500" />
            <span className="truncate max-w-[200px] sm:max-w-md">{file?.name}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleStartOver} 
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" /> <span className="hidden sm:inline">Cancelar</span>
            </button>

            {/* BOTÓN 1: TERMINAR Y GRABAR */}
            <button 
              onClick={handleFinishEditing} 
              disabled={!isLoaded || isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:bg-slate-400 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isProcessing ? 'Grabando...' : 'Terminar Edición'}
            </button>
          </div>
        </div>
        
        <div className="w-full h-[85vh] min-h-[700px] border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xl relative z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <span className="text-slate-800 dark:text-white font-bold text-lg mb-2">Iniciando Motor Avanzado...</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">Extrayendo tipografías del PDF</span>
            </div>
          )}
          <div ref={viewer} className="w-full h-full"></div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA 3: DESCARGA FINAL
  // ==========================================
  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
      
      <div className="bg-emerald-50 dark:bg-emerald-900/30 p-5 rounded-full mb-6">
        <CheckCircle className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-center">¡Modificaciones Grabadas!</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">
        Tu archivo <b>{file?.name}</b> ha sido procesado exitosamente. Ya puedes descargar la versión final.
      </p>
      
      <div className="flex flex-col sm:flex-row w-full gap-4 justify-center">
        <button 
          onClick={handleStartOver}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-4 rounded-xl font-bold text-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Editar otro archivo
        </button>

        {/* BOTÓN 2: DESCARGAR ARCHIVO */}
        <button 
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Download className="w-5 h-5" /> Descargar PDF
        </button>
      </div>

    </div>
  );
}