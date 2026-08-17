'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Loader2, ShieldCheck, FileText, X, Save, 
  ArrowLeft, Plus, UploadCloud, Type, Trash2,
  Lock, Unlock, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';
import type { EditWorkerMessageIn, EditWorkerMessageOut } from '@/workers/pdf-edit.worker';

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
  const [isDragging, setIsDragging] = useState(false);
  
  const [, setViewerInstance] = useState<any>(null);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);
  const [editedBlob, setEditedBlob] = useState<Blob | null>(null);

  // OPCIONES AVANZADAS Y METADATOS
  const [filePrefix, setFilePrefix] = useState<string>(globalFile ? globalFile.name.replace(/\.[^/.]+$/, "") + '_Editado' : 'Documento_Editado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const isEsRef = useRef(isEs);
  isEsRef.current = isEs;

  // Sincronización continua y fiable con el store global de Zustand (inicio -> /editar -> /editar/texto)
  useEffect(() => {
    if (globalFile) {
      setFile(globalFile);
      setFilePrefix(globalFile.name.replace(/\.[^/.]+$/, "") + '_Editado');
      setStep('edit');
    } else {
      setFile(null);
      setStep('upload');
    }
  }, [globalFile]);

  const processSelectedFile = useCallback((selected: File) => {
    if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(selected);
      setGlobalFile(selected);
      setFilePrefix(selected.name.replace(/\.[^/.]+$/, "") + '_Editado');
      setStep('edit');
    } else {
      toast.error(isEs ? 'Por favor, sube un archivo con formato PDF válido' : 'Please upload a valid PDF file');
    }
  }, [isEs, setGlobalFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Inicializar WebViewer de forma directa y estable cuando estamos en 'edit'
  useEffect(() => {
    if (step !== 'edit' || !file) return;

    let isDisposed = false;

    async function loadViewer() {
      if (!viewer.current || isDisposed) return;

      // Limpiar contenedor previo
      viewer.current.innerHTML = '';
      setIsLoaded(false);

      try {
        const module = await import('@pdftron/webviewer');
        if (isDisposed || !viewer.current) return;

        const WebViewer = module.default;
        const effectiveLicense = process.env.NEXT_PUBLIC_PDFTRON_LICENSE || 'demo:1785371416175:63a1e8a503000000006760d2ccf8c0f171ee4085a462864d5cc7028d9d';

        const webviewerOptions: any = {
          path: '/webviewer',
          forceClientSideInit: true,
          enableCompositionInput: true,
          licenseKey: effectiveLicense,
        };

        const instance = await WebViewer(webviewerOptions, viewer.current);
        if (isDisposed) {
          try { instance.UI?.dispose?.(); } catch (e) {}
          return;
        }

        viewerInstanceRef.current = instance;
        setViewerInstance(instance);

        const { UI, Core } = instance;
        UI.setLanguage(isEsRef.current ? 'es' : 'en');
        
        UI.enableFeatures([
          UI.Feature.ContentEdit,
          UI.Feature.Annotations,
          UI.Feature.FilePicker,
          UI.Feature.Print,
          UI.Feature.Download
        ]);
        
        UI.openElements(['leftPanel']);
        UI.setTheme('dark');

        if (!file || isDisposed) return;

        const arrayBuffer = await file.arrayBuffer();
        if (isDisposed) return;
        
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const loadOptions: any = { filename: file.name, extension: 'pdf' };

        Core.documentViewer.addEventListener('documentLoaded', () => {
          if (!isDisposed) {
            setIsLoaded(true);
            try {
              UI.setToolbarGroup('toolbarGroup-Edit');
            } catch (e) {
              try {
                UI.setToolbarGroup('toolbarGroup-Annotate');
              } catch (e2) {}
            }
            toast.success(isEsRef.current ? '¡Documento abierto y listo para editar!' : 'Document loaded and ready to edit!');
          }
        });

        await UI.loadDocument(pdfBlob, loadOptions);

        if (!isDisposed) {
          setIsLoaded(true);
          try {
            UI.setToolbarGroup('toolbarGroup-Edit');
          } catch (e) {}
        }
      } catch (err: any) {
        if (!isDisposed) {
          console.error('WebViewer init error:', err);
          setIsLoaded(false);
          setViewerInstance(null);
          viewerInstanceRef.current = null;
          setStep('upload');
          toast.error(isEsRef.current
            ? 'Error al cargar el motor de edición. Verifica tu conexión o intenta con otro PDF.'
            : 'Failed to load editing engine. Check your connection or try with another PDF.');
        }
      }
    }

    loadViewer();

    return () => {
      isDisposed = true;
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.UI?.dispose?.();
        } catch (e) {}
        viewerInstanceRef.current = null;
      }
    };
  }, [step, file]);

  const handleFinishEditing = async () => {
    const instance = viewerInstanceRef.current;
    if (!instance) return;
    
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Confirmando y aplicando ediciones de texto...' : 'Committing text edits...');

    try {
      const { documentViewer, annotationManager } = instance.Core;
      const doc = documentViewer.getDocument();

      // ── PASO 0: Forzar desenfoque (blur) del campo activo y finalizar modo de edición para consolidar el texto ──
      try {
        if (instance.UI && instance.UI.iframeWindow) {
          const activeEl = instance.UI.iframeWindow.document?.activeElement as HTMLElement;
          if (activeEl && typeof activeEl.blur === 'function') {
            activeEl.blur();
          }
        }
      } catch (blurErr) {
        console.warn('Error al desenfocar elemento activo:', blurErr);
      }

      try {
        const contentEditManager = documentViewer?.getContentEditManager?.();
        if (contentEditManager && typeof contentEditManager.endContentEditMode === 'function') {
          contentEditManager.endContentEditMode();
        }
      } catch (ceErr) {
        console.warn('Error al finalizar ContentEditManager:', ceErr);
      }

      // Esperar brevemente a que el motor WASM consolide las capas de texto
      await new Promise((resolve) => setTimeout(resolve, 250));

      setProgressPercent(30);
      setProgressMsg(isEs ? 'Consolidando capas y anotaciones del PDF...' : 'Consolidating PDF layers and annotations...');

      // ── PASO 1: Exportar anotaciones (textos agregados, notas, firmas, sellos) en formato XFDF ──
      let xfdfString = '';
      try {
        if (annotationManager && typeof annotationManager.exportAnnotations === 'function') {
          xfdfString = await annotationManager.exportAnnotations();
        }
      } catch (errXfdf) {
        console.warn('Anotaciones XFDF no disponibles o vacías:', errXfdf);
      }

      setProgressPercent(50);
      setProgressMsg(isEs ? 'Exportando bytes del documento editado...' : 'Exporting edited document bytes...');

      // ── PASO 2: Obtener buffer con ediciones de texto nativas y anotaciones fusionadas ──
      const data = await doc.getFileData({ xfdfString, downloadType: 'pdf' });
      
      let rawBuffer: ArrayBuffer;
      if (data instanceof ArrayBuffer) {
        rawBuffer = data;
      } else if (data && data.buffer) {
        rawBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
        rawBuffer = new Uint8Array(data).buffer;
      }
      const bufferCopy = rawBuffer.slice(0);

      const hasMetadata = Boolean(docTitle.trim() || docAuthor.trim() || docSubject.trim());
      const needsPostProcessing = renumberPages || hasMetadata;

      let finalBuffer = bufferCopy;

      if (needsPostProcessing) {
        setProgressPercent(65);
        setProgressMsg(isEs ? 'Aplicando opciones de salida en Web Worker...' : 'Applying output options in Web Worker...');

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
        finalBuffer = result.buffer;
      }

      // ── PASO 3: Generar archivo final y URL para descarga ──
      setProgressPercent(100);

      const blob = new Blob([finalBuffer], { type: 'application/pdf' });
      if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);
      setEditedBlob(blob);
      
      toast.success(isEs ? '¡Modificaciones grabadas correctamente!' : 'Changes saved successfully!');
      setStep('download');
    } catch (error: any) {
      console.error('Error al guardar:', error);
      toast.error(error?.message || (isEs ? 'Error al grabar el documento.' : 'Failed to save document.'));
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hacia el inicio de la herramienta (debajo del Navbar global)
  useEffect(() => {
    if (step === 'download') {
      const timer = setTimeout(() => {
        if (topContainerRef.current) {
          topContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleStartOver = () => {
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    setFile(null);
    setGlobalFile(null);
    setIsLoaded(false);
    setViewerInstance(null);
    setEditedPdfUrl(null);
    setEditedBlob(null);
    setStep('upload');
    setDocTitle('');
    setDocAuthor('');
    setDocSubject('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div ref={topContainerRef} className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
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
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all cursor-pointer"
              title={isEs ? "Quitar archivo" : "Remove file"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* PANTALLA 1: SUBIDA (DROPZONE CON DRAG AND DROP) */}
      {step === 'upload' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border ${isDragging ? 'border-white bg-zinc-900/80 scale-[1.005]' : 'border-white/10 hover:border-white/30 bg-[#09090b]'} rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-200 min-h-[500px] group cursor-pointer`}
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
      {step === 'edit' && (
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

          {/* OPCIONES AVANZADAS PERMANENTEMENTE VISIBLES */}
          <div className="w-full bg-[#09090b] border border-white/10 p-4 rounded-2xl mt-4 font-mono text-xs space-y-3">
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
        </motion.div>
      )}

      {/* PANTALLA 3: DESCARGA FINAL DEDICADA CON BANNER DE RESULTADOS Y ENCADENAMIENTO */}
      {step === 'download' && (
        <motion.div 
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-4xl mx-auto my-6 font-sans space-y-6"
        >
          {/* BANNER DE RESULTADO Y MÉTRICAS DE EDICIÓN */}
          <div className="bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Type className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA EDICIÓN DE TEXTO' : 'TEXT EDITING RESULT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans">
                    {isEs ? '¡Documento modificado con éxito!' : 'Document edited successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold">{isEs ? 'Estado del proceso' : 'Process status'}</div>
                  <div className="text-emerald-400 font-extrabold text-sm sm:text-base flex items-center gap-1">
                    ✓ {isEs ? '100% Local & Privado' : '100% Local & Private'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Tamaño Original' : 'Original Size'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {file ? formatFileSize(file.size) : '—'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Tamaño Editado' : 'Edited Size'}</span>
                <span className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                  {editedBlob ? formatFileSize(editedBlob.size) : '—'}
                </span>
              </div>
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? 'Modo de Procesamiento' : 'Processing Mode'}</span>
                <span className="text-white font-bold text-sm font-mono mt-0.5">
                  {isEs ? 'Vectorial Nativo' : 'Native Vector'}
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE DESCARGA ÉXITO CON ENCADENAMIENTO DE HERRAMIENTAS */}
          <DownloadSuccessCard
            downloadUrl={editedPdfUrl}
            filename={`${filePrefix.trim() || 'Documento_Editado'}.pdf`}
            fileSize={editedBlob ? formatFileSize(editedBlob.size) : undefined}
            outputFormat="pdf"
            rawBlob={editedBlob || undefined}
            onReset={handleStartOver}
          />
        </motion.div>
      )}

    </div>
  );
}