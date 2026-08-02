'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Loader2, ShieldCheck, FileText, X, Save, Download, 
  CheckCircle2, ArrowLeft, Plus, UploadCloud, Type, Sparkles, Trash2,
  Lock, Unlock, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EditWorkerMessageIn, EditWorkerMessageOut } from '@/workers/pdf-edit.worker';

type Step = 'upload' | 'edit' | 'download';

export default function PdfEditor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const viewer = useRef<HTMLDivElement>(null);
  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [step, setStep] = useState<Step>(globalFile ? 'edit' : 'upload');
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // OPCIONES AVANZADAS Y METADATOS
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Editado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
      setStep('edit');
    }
  }, [globalFile, file]);

  // Detección inicial de encriptación con pdfjs-dist
  const checkEncryption = useCallback(async (selectedFile: File, pass?: string) => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: pass });
      await loadingTask.promise;
      setIsEncrypted(false);
      setIsUnlocked(true);
      return true;
    } catch (error: any) {
      if (error?.name === 'PasswordException' || error?.code === 1) {
        setIsEncrypted(true);
        setIsUnlocked(false);
        toast.warning(isEs ? 'El archivo requiere contraseña para editarse' : 'File requires password to edit');
        return false;
      }
      return true;
    }
  }, [isEs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setFilePrefix(selected.name.replace(/\.[^/.]+$/, "") + '_Editado');
      setIsEncrypted(false);
      setIsUnlocked(false);
      setPasswordInput('');
      setUnlockedPassword(undefined);
      
      const canProceed = await checkEncryption(selected);
      if (canProceed) {
        setStep('edit');
      }
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    const ok = await checkEncryption(file, passwordInput);
    if (ok) {
      setUnlockedPassword(passwordInput);
      setIsUnlocked(true);
      setIsEncrypted(false);
      setStep('edit');
      toast.success(isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF unlocked successfully!');
    } else {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  // Inicializar el motor de Apryse cuando estamos en el paso 'edit'
  useEffect(() => {
    let activeInstance: any = null;

    if (step === 'edit' && file && viewer.current && !isLoaded && !isInitializing.current && (!isEncrypted || isUnlocked)) {
      isInitializing.current = true;
      if (viewer.current) {
        viewer.current.innerHTML = '';
      }

      import('@pdftron/webviewer').then((module) => {
        const WebViewer = module.default;

        WebViewer(
          {
            path: '/webviewer',
            licenseKey: process.env.NEXT_PUBLIC_PDFTRON_LICENSE || 'demo:1785371416175:63a1e8a503000000006760d2ccf8c0f171ee4085a462864d5cc7028d9d',
          },
          viewer.current!
        ).then((instance) => {
          activeInstance = instance;
          setIsLoaded(true);
          setViewerInstance(instance);
          
          const { UI } = instance;
          UI.setLanguage(isEs ? 'es' : 'en');
          UI.enableFeatures([UI.Feature.ContentEdit]);
          UI.openElements(['leftPanel']); 
          UI.setTheme('dark');

          // Cargar el archivo PDF en WebViewer con clave si aplica
          const loadOptions: any = { filename: file.name };
          if (unlockedPassword) {
            loadOptions.password = unlockedPassword;
          }
          UI.loadDocument(file, loadOptions);

          toast.success(isEs ? '¡Documento abierto y listo para editar!' : 'Document loaded and ready to edit!');
        }).catch(err => {
          console.error(err);
          isInitializing.current = false;
          toast.error(isEs ? 'Error al cargar el motor de edición.' : 'Failed to load editing engine.');
        });
      });
    }

    return () => {
      if (activeInstance && activeInstance.UI && typeof activeInstance.UI.dispose === 'function') {
        try {
          activeInstance.UI.dispose();
        } catch (e) {}
      }
    };
  }, [step, file, isLoaded, isEs, isEncrypted, isUnlocked, unlockedPassword]);

  const handleFinishEditing = async () => {
    if (!viewerInstance) return;
    
    setIsProcessing(true);
    setProgressPercent(20);
    setProgressMsg(isEs ? 'Extrayendo buffer modificado...' : 'Extracting modified buffer...');

    try {
      const docViewer = viewerInstance.Core.documentViewer;
      const doc = docViewer.getDocument();

      const data = await doc.getFileData();
      const rawBuffer = data.buffer || data;

      setProgressPercent(50);
      setProgressMsg(isEs ? 'Ejecutando Web Worker de metadatos...' : 'Running metadata Web Worker...');

      const bufferCopy = rawBuffer.slice(0);

      const worker = new Worker(new URL('../workers/pdf-edit.worker.ts', import.meta.url), { type: 'module' });

      const payload: EditWorkerMessageIn = {
        action: 'process',
        arrayBuffer: bufferCopy,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Editado',
          renumberPages,
          metadata: {
            title: docTitle.trim() || undefined,
            author: docAuthor.trim() || undefined,
            subject: docSubject.trim() || undefined,
          }
        }
      };

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<EditWorkerMessageOut>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            setProgressPercent(msg.percent);
            setProgressMsg(msg.message);
          } else if (msg.type === 'result') {
            resolve({
              buffer: msg.buffer,
              totalPages: msg.totalPages,
            });
          } else if (msg.type === 'error') {
            reject(new Error(msg.message));
          }
        };

        worker.onerror = (err) => reject(err);

        worker.postMessage(payload, [bufferCopy]);
      });

      worker.terminate();

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);
      
      setProgressPercent(100);
      toast.success(isEs ? '¡Modificaciones grabadas correctamente!' : 'Changes saved successfully!');
      setStep('download');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || (isEs ? 'Error al grabar el documento.' : 'Failed to save document.'));
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!editedPdfUrl) return;
    
    const link = document.createElement('a');
    link.href = editedPdfUrl;
    link.download = `${filePrefix.trim() || 'Documento_Editado'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartOver = () => {
    if (viewerInstance && viewerInstance.UI && typeof viewerInstance.UI.dispose === 'function') {
      try {
        viewerInstance.UI.dispose();
      } catch (e) {}
    }
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    isInitializing.current = false;
    setFile(null);
    setGlobalFile(null);
    setIsLoaded(false);
    setViewerInstance(null);
    setEditedPdfUrl(null);
    setIsEncrypted(false);
    setIsUnlocked(false);
    setUnlockedPassword(undefined);
    setPasswordInput('');
    setStep('upload');
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "001 / EDICIÓN NATIVA DE TEXTO E IMÁGENES" : "001 / NATIVE TEXT & IMAGE EDITING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Type className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "MODIFICAR O EDITAR TEXTO DE DOCUMENTOS PDF" : "EDIT TEXT & IMAGES OF PDF DOCUMENTS"}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button 
              onClick={handleStartOver} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Quitar archivo" : "Remove file"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* PASSWORD WIDGET FOR ENCRYPTED PDF */}
      {file && isEncrypted && !isUnlocked && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-6 space-y-3 font-mono text-xs max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <span>{isEs ? "Este PDF está protegido con contraseña" : "This PDF is password protected"}</span>
          </div>
          <p className="text-zinc-400 text-xs font-sans">
            {isEs ? "Ingresa la contraseña de apertura para desbloquear el visor e iniciar la edición nativa." : "Enter open password to unlock the viewer and start editing."}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={isEs ? "Ingresa la contraseña de apertura..." : "Enter open password..."}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlockFileWithPassword()}
              className="flex-1 bg-zinc-900 border border-white/15 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/40 font-mono"
            />
            <button
              onClick={unlockFileWithPassword}
              className="px-4 py-2 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 font-mono"
            >
              <Unlock className="w-4 h-4" />
              <span>{isEs ? "Desbloquear" : "Unlock"}</span>
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 1: SUBIDA (DROPZONE VACÍA) */}
      {step === 'upload' && (!isEncrypted || isUnlocked) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer"
        >
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? "MODIFICAR O EDITAR TEXTO DE DOCUMENTOS PDF" : "EDIT TEXT & IMAGES OF PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Edita el texto e imágenes de tu PDF directamente en tu navegador de forma 100% privada." : "Edit text and images directly in your browser 100% privately."}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • EDICIÓN LOCAL • SIN SERVIDORES EXTERNOS' : '100% FREE • LOCAL EDITING • NO EXTERNAL SERVERS'}</span>
          </div>
        </motion.div>
      )}

      {/* PANTALLA 2: EDICIÓN (MOTOR NATIVO WEBVIEWER CON OPCIONES AVANZADAS) */}
      {step === 'edit' && (!isEncrypted || isUnlocked) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col">
          {/* BARRA SUPERIOR DE ACCIONES */}
          <div className="w-full mb-4 flex justify-between items-center bg-[#09090b] border border-white/10 p-4 rounded-2xl shadow-2xl font-mono">
            <div className="flex items-center gap-3 font-bold text-xs text-white">
              <FileText className="w-4 h-4 text-white" />
              <span className="truncate max-w-[200px] sm:max-w-md">{file?.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleStartOver} 
                className="flex items-center gap-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> <span>{isEs ? "Cancelar" : "Cancel"}</span>
              </button>

              <button 
                onClick={handleFinishEditing} 
                disabled={!isLoaded || isProcessing}
                className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
                <span>{isProcessing ? progressMsg || (isEs ? 'Grabando...' : 'Saving...') : (isEs ? 'Terminar y Grabar →' : 'Finish & Save →')}</span>
              </button>
            </div>
          </div>

          {/* OPCIONES AVANZADAS PERMANENTEMENTE VISIBLES */}
          <div className="w-full bg-[#09090b] border border-white/10 p-4 rounded-2xl mb-4 font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <Sliders className="w-4 h-4 text-white" />
              <span>{isEs ? "Opciones Avanzadas de Salida PDFBLACK" : "PDFBLACK Advanced Output Options"}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo del Archivo Resultante:" : "Output File Prefix:"}</label>
                <input
                  type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                  placeholder="Documento_Editado"
                  className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer bg-zinc-950 p-2.5 rounded-xl border border-white/10 w-full">
                  <input 
                    type="checkbox" checked={renumberPages} onChange={(e) => setRenumberPages(e.target.checked)}
                    className="accent-white w-4 h-4 rounded"
                  />
                  <span>{isEs ? "Re-numerar páginas en pie de página (Página N / M)" : "Re-number footer pages (Page N / M)"}</span>
                </label>
              </div>
            </div>

            {/* METADATOS DEL DOCUMENTO RESULTANTE */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">{isEs ? "METADATOS DEL PDF EDITADO" : "EDITED PDF METADATA"}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Título:" : "Title:"}</label>
                  <input
                    type="text"
                    placeholder={isEs ? "Ej: Documento_Modificado_2026" : "Ex: Edited_Document_2026"}
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Autor / Organización:" : "Author / Organization:"}</label>
                  <input
                    type="text"
                    placeholder={isEs ? "Ej: Mi Empresa S.A." : "Ex: Company Inc."}
                    value={docAuthor}
                    onChange={(e) => setDocAuthor(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Asunto / Descripción:" : "Subject / Description:"}</label>
                  <input
                    type="text"
                    placeholder={isEs ? "Ej: Modificación de texto e imágenes" : "Ex: Text and image edit"}
                    value={docSubject}
                    onChange={(e) => setDocSubject(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* CONTENEDOR DEL VISOR WEBVIEWER */}
          <div className="w-full h-[80vh] min-h-[650px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative bg-[#09090b]">
            {!isLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b] z-10 font-mono gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
                <span className="text-white font-bold text-base font-sans">{isEs ? "Iniciando Motor Avanzado de Edición..." : "Starting Advanced Editing Engine..."}</span>
                <span className="text-zinc-400 text-xs">{isEs ? "Extrayendo capas de texto y tipografías del PDF" : "Extracting text layers and fonts from PDF"}</span>
              </div>
            )}
            <div ref={viewer} className="w-full h-full"></div>
          </div>
        </motion.div>
      )}

      {/* PANTALLA 3: DESCARGA FINAL */}
      {step === 'download' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-2xl mx-auto bg-[#09090b] border border-white/10 p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] text-center font-sans"
        >
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-full mb-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            {isEs ? "¡Modificaciones Grabadas con Éxito!" : "Changes Saved Successfully!"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? `Tu archivo ` : `Your file `}<b className="text-white">{file?.name}</b>{isEs ? ` ha sido procesado localmente. Ya puedes descargar la versión final.` : ` was processed locally. You can download the final version.`}
          </p>
          
          <div className="flex flex-col sm:flex-row w-full gap-4 justify-center font-mono">
            <button 
              onClick={handleStartOver}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> {isEs ? "Editar otro archivo" : "Edit another file"}
            </button>

            <button 
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-3.5 rounded-2xl font-sans font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" /> {isEs ? "Descargar PDF →" : "Download PDF →"}
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}