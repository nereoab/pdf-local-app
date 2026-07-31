'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowRight, ShieldCheck, Edit3, Type, PenTool, Hash, ShieldAlert, 
  FileText, UploadCloud, FilePlus, X, HardDrive, Clock, Search, Star, Eye, 
  Download, Trash2, Bot, CheckCircle2, FolderOpen, Sparkles, Lock 
} from 'lucide-react';
import { toast } from 'sonner';

function EditarContent() {
  const searchParams = useSearchParams();
  const selectedToolParam = searchParams.get('tool');

  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfUrl = useMemo(() => {
    return globalFile ? URL.createObjectURL(globalFile) : null;
  }, [globalFile]);

  const procesarArchivo = (archivoSeleccionado: File) => {
    if (archivoSeleccionado.type !== "application/pdf") {
      toast.error(isEs ? "Por favor, sube un archivo PDF válido." : "Please upload a valid PDF file.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setGlobalFile(archivoSeleccionado); 
            setIsUploading(false);
            setUploadProgress(0);
            toast.success(isEs ? "Archivo cargado en el editor." : "File loaded into the editor.");
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 15; 
      });
    }, 100);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) procesarArchivo(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setGlobalFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const editingTools = [
    { 
      id: 'texto', 
      tagEs: '001 / TEXTO E IMÁGENES', tagEn: '001 / TEXT & IMAGES', 
      titleEs: 'Editar Texto e Imágenes', titleEn: 'Edit Text & Images', 
      descEs: 'Edita texto e imágenes directamente en tu PDF sin perder el formato original del documento.', 
      descEn: 'Edit text and images directly in your PDF without losing original layout.', 
      icon: Type, path: '/editar/texto',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white'
    },
    { 
      id: 'foliado', 
      tagEs: '002 / FOLIADO Y NÚMEROS', tagEn: '002 / PAGE NUMBERS', 
      titleEs: 'Poner Números a Páginas (Foliado)', titleEn: 'Add Page Numbers (Folios)', 
      descEs: 'Añade números correlativos y foliados personalizados en el encabezado o pie de página.', 
      descEn: 'Add consecutive page numbers and customized folios in headers or footers.', 
      icon: Hash, path: '/editar/foliar',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white'
    },
    { 
      id: 'poner-marca-agua', 
      tagEs: '003 / SELLO DE AGUA', tagEn: '003 / ADD WATERMARK', 
      titleEs: 'Poner Sello de Agua', titleEn: 'Add Watermark', 
      descEs: 'Inserta sellos de agua personalizados en texto o imagen en todo el documento PDF.', 
      descEn: 'Insert customized text or image watermarks across the entire PDF document.', 
      icon: ShieldAlert, path: '/editar/marca-agua',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white'
    },
    { 
      id: 'quitar-marca-agua', 
      tagEs: '004 / QUITAR SELLO DE AGUA', tagEn: '004 / REMOVE WATERMARK', 
      titleEs: 'Quitar Sello de Agua', titleEn: 'Remove Watermark', 
      descEs: 'Detecta y remueve sellos o marcas de agua existentes de un documento PDF.', 
      descEn: 'Detect and remove existing watermarks or stamps from a PDF document.', 
      icon: Sparkles, path: '/editar/quitar-marca-agua',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white'
    },
    { 
      id: 'firmar', 
      tagEs: '005 / FIRMA DIGITAL', tagEn: '005 / DIGITAL SIGNATURE', 
      titleEs: 'Firmar PDF', titleEn: 'Sign PDF', 
      descEs: 'Dibuja, escribe o sube una imagen de tu firma para estamparla en el documento.', 
      descEn: 'Draw, type, or upload an image of your signature to stamp on the document.', 
      icon: PenTool, path: '/editar/firma',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white'
    },
    { 
      id: 'ocr', 
      tagEs: '006 / OCR RECONOCIMIENTO', tagEn: '006 / SEARCHABLE OCR', 
      titleEs: 'OCR PDF (Texto Seleccionable)', titleEn: 'OCR PDF (Selectable Text)', 
      descEs: 'Convierte un PDF escaneado o imágenes en un documento PDF con texto seleccionable.', 
      descEn: 'Convert scanned PDF or images into a PDF with selectable text.', 
      icon: Search, path: '/editar/ocr',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white'
    }
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#09090b]">

      <div className="w-full max-w-7xl relative z-10">
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileInput} />

        <AnimatePresence mode="wait">
          {isUploading && (
            <motion.div key="loading-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-12 shadow-2xl mt-10 font-mono">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2 font-sans">{isEs ? "Cargando documento..." : "Loading document..."}</h3>
                  <span className="text-white font-bold text-3xl tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div className="bg-white h-full rounded-full relative" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear", duration: 0.1 }}>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {!isUploading && (
            <motion.div key="workspace-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
              {/* TÍTULO DE PÁGINA Y KPI STATS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {isEs ? "001 / HERRAMIENTAS DE EDICIÓN PDF" : "001 / PDF EDITING TOOLS"}
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1">
                      {isEs ? "Selecciona el módulo de edición que deseas aplicar sobre tu documento:" : "Select the editing module you wish to apply to your document:"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={12} tooltip={isEs ? "Tus archivos procesados esta semana" : "Files processed this week"} color="text-white" />
                  <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={1.2} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-zinc-300" />
                  <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={45} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-zinc-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
                <div className="lg:col-span-5 flex flex-col h-full">
                  {!globalFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex-1 h-full min-h-[480px] bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl"
                    >
                      <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
                      >
                        <UploadCloud className="w-12 h-12 text-white" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-2 font-sans">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {isEs ? "Arrastra tu PDF aquí para editar" : "Drop your PDF here to edit"}
                        </h3>
                        <p className="text-zinc-400 text-xs font-mono">
                          {isEs ? "O haz clic para explorar tus archivos" : "Or click to browse your files"}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all mt-2 cursor-pointer shadow-md">
                        <FilePlus className="w-4 h-4 text-black" /> {isEs ? "Subir Archivo" : "Upload File"}
                      </button>

                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isEs ? '100% GRATIS • SIN REGISTRO • SIN TARJETA' : '100% FREE • NO SIGN-UP • NO CREDIT CARD'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex-1 h-full min-h-[500px] bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative font-mono">
                      <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{globalFile.name}</span>
                            <span className="text-zinc-400 text-[10px]">{formatFileSize(globalFile.size)}</span>
                          </div>
                        </div>
                        <button onClick={handleRemoveFile} className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all" title={isEs ? "Quitar archivo" : "Remove file"}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                       <div className="w-full flex-1 bg-[#09090b] relative overflow-hidden rounded-b-2xl">
                         {pdfUrl && (
                           <div className="absolute inset-2 flex items-center justify-center">
                             <div className="relative w-full h-full max-w-[95%] max-h-[95%]">
                               <iframe 
                                 src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitV`} 
                                 className="w-full h-full border-none bg-white shadow-2xl rounded-lg" 
                                 title="PDF Preview"
                                 style={{ minHeight: '400px' }}
                               />
                               {/* Barra sutil inferior con acciones */}
                               <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none rounded-b-lg" />
                             </div>
                           </div>
                         )}
                       </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 flex flex-col h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 h-full">
                    {editingTools.map((tool) => {
                      const isSelected = selectedToolParam === tool.id || (selectedToolParam && tool.path.endsWith(selectedToolParam));

                      return (
                        <Link 
                          key={tool.id} 
                          href={globalFile ? tool.path : "#"} 
                          onClick={(e) => { 
                            if (!globalFile) { 
                              e.preventDefault(); 
                              toast.error(isEs ? "Sube un archivo en la casilla de la izquierda para usar esta herramienta." : "Upload a file in the left dropzone first to use this tool."); 
                            } 
                          }} 
                          className="outline-none group/card block h-full"
                        >
                          <div className={`bg-[#09090b] border ${isSelected ? 'border-white ring-2 ring-white/20 bg-zinc-900/80' : 'border-white/10 hover:border-white/30'} rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between group-hover/card:bg-zinc-900/40 relative overflow-hidden h-full shadow-2xl`}>

                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                                  <tool.icon className="w-5 h-5 text-white" />
                                </div>

                                <div className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-3.5 py-1 rounded-full font-sans flex items-center gap-1.5 transition-all shadow-md">
                                  <span>{isSelected ? (isEs ? "SELECCIONADO" : "SELECTED") : (isEs ? "Usar Ahora" : "Use Now")}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover/card:translate-x-1 transition-transform" />
                                </div>
                              </div>

                              <div className="mb-2 font-mono">
                                <span className="text-xs text-zinc-400 font-medium">
                                  {isEs ? tool.tagEs : tool.tagEn}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-white mb-1.5 tracking-tight font-sans">
                                {isEs ? tool.titleEs : tool.titleEn}
                              </h3>
                              <p className="text-zinc-400 text-xs font-normal leading-relaxed font-sans line-clamp-2">
                                {isEs ? tool.descEs : tool.descEn}
                              </p>
                            </div>

                            <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {isEs ? "100% Local" : "100% Local"}
                              </span>
                              <span className="text-white group-hover/card:translate-x-0.5 transition-transform flex items-center gap-1">
                                {isEs ? "Iniciar →" : "Start →"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECCIÓN: 3 PASOS PARA TRABAJAR PDF */}
              <div className="w-full mt-12 pt-10 border-t border-white/10 flex flex-col items-center font-mono">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                  {isEs ? "000 / PASOS DE EDICIÓN" : "000 / EDITING STEPS"}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-8 font-sans">
                  {isEs ? "Solo 3 pasos para editar tu PDF" : "Only 3 steps to edit your PDF"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {/* PASO 1 */}
                  <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group font-mono">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm flex items-center justify-center mb-3">
                      1
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {isEs ? "1. Sube tu PDF" : "1. Upload your PDF"}
                    </h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {isEs ? "Arrastra o selecciona tu archivo PDF en el recuadro principal." : "Drag or select your PDF file in the main dropzone box."}
                    </p>
                  </div>

                  {/* PASO 2 */}
                  <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group font-mono">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm flex items-center justify-center mb-3">
                      2
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {isEs ? "2. Usa la herramienta" : "2. Use the tool"}
                    </h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {isEs ? "En la página especializada, elige la función exacta (Texto, Foliar, Firma, etc.)." : "In the specialized page, select the exact function (Text, Folio, Signature, etc.)."}
                    </p>
                  </div>

                  {/* PASO 3 */}
                  <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group font-mono">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm flex items-center justify-center mb-3">
                      3
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {isEs ? "3. Descarga lista" : "3. Download ready"}
                    </h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {isEs ? "Obtén tu documento final 100% procesado de forma local en tu navegador." : "Get your final document 100% processed locally in your browser."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DETALLADA: ¿QUÉ SUCEDE CON TU ARCHIVO PDF Y EXPLICACIÓN DE HERRAMIENTAS DE EDICIÓN */}
              <div className="w-full mt-12 space-y-8 font-sans">
                
                {/* BLOQUE 1: ¿QUÉ SUCEDE CON TU ARCHIVO PDF? (PRIVACIDAD Y SEGURIDAD LOCAL) */}
                <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {isEs ? '¿Qué sucede exactamente con tu archivo PDF al editarlo?' : 'What exactly happens to your PDF file when edited?'}
                      </h3>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        {isEs ? '🔒 PRIVACIDAD ABSOLUTA • PROCESAMIENTO 100% LOCAL EN RAM • SIN SERVIDORES' : '🔒 ABSOLUTE PRIVACY • 100% LOCAL RAM PROCESSING • ZERO SERVERS'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                    <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                      <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                        {isEs ? '1. Ejecución Local en tu Navegador' : '1. Local Browser Execution'}
                      </strong>
                      <p>
                        {isEs
                          ? 'Tu documento PDF se carga y procesa exclusivamente dentro de la memoria RAM de tu propio navegador. Ningún byte o página de tu archivo se envía a servidores externos ni a almacenamiento en la nube.'
                          : 'Your PDF document is loaded and processed exclusively within your browser RAM. Zero bytes or pages are uploaded to external servers or cloud storage.'}
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                      <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        {isEs ? '2. Conservación de Formato y Estructura' : '2. Format & Layout Integrity'}
                      </strong>
                      <p>
                        {isEs
                          ? 'La edición modifica únicamente las capas de contenido seleccionadas (texto, foliado, sellos de agua o firmas). El documento conserva intacta su resolución original, fuentes vectoriales y maquetación.'
                          : 'Editing only alters the selected content layers (text, folios, watermarks, or signatures). The document preserves its original resolution, vector fonts, and layout.'}
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                      <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        {isEs ? '3. Purga Automática de Memoria' : '3. Automatic Memory Purge'}
                      </strong>
                      <p>
                        {isEs
                          ? 'Una vez descargado el PDF editado o al cerrar la ventana, la memoria RAM libera automáticamente todos los datos procesados, garantizando la confidencialidad de tus contratos, facturas o archivos personales.'
                          : 'Once the edited PDF is downloaded or the tab is closed, browser RAM automatically purges all processed buffers, guaranteeing privacy for confidential files.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: GUÍA EXPLICATIVA DE TODAS LAS HERRAMIENTAS DE EDICIÓN */}
                <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                        {isEs ? 'Herramientas disponibles en el Módulo de Edición' : 'Available Tools in the Editing Module'}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        {isEs ? 'Conoce en detalle las 6 funciones avanzadas para personalizar tus documentos PDF.' : 'Learn in detail about the 6 advanced functions to customize your PDF documents.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
                    {editingTools.map((tool) => (
                      <div key={tool.id} className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-white">
                              <tool.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-wider">
                              {isEs ? tool.tagEs : tool.tagEn}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2">{isEs ? tool.titleEs : tool.titleEn}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? tool.descEs : tool.descEn}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                          <span>✓ 100% Local</span>
                          <span className="text-zinc-500 font-sans">{isEs ? 'Sin Servidores' : 'No Servers'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* TABLA DE ARCHIVOS RECIENTES */}
              <div className="relative z-10 mt-12 sm:mt-16 font-sans">
                <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl mb-12">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                        <FolderOpen className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
                        <span>007 /</span> {isEs ? 'ARCHIVOS RECIENTES' : 'RECENT FILES'}
                      </h3>
                    </div>
                    
                    <div className="relative w-full sm:w-72 font-mono">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder={isEs ? "Buscar archivos..." : "Search files..."} 
                        className="w-full bg-zinc-900 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider pl-2">{isEs ? 'NOMBRE DEL ARCHIVO' : 'FILE NAME'}</th>
                          <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'TAMAÑO' : 'SIZE'}</th>
                          <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'ACCIÓN REALIZADA' : 'ACTION PERFORMED'}</th>
                          <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'ESTADO' : 'STATUS'}</th>
                          <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider text-right pr-2">{isEs ? 'ACCIONES' : 'ACTIONS'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        <TableRow name="Documento_Editado_v1.pdf" size="3.1 MB" action={isEs ? "Texto & Firma Editados" : "Text & Signature Edited"} status={isEs ? "Completado" : "Completed"} icon={FileText} />
                        <TableRow name="Expediente_Foliado.pdf" size="8.4 MB" action={isEs ? "Folios Agregados (1-42)" : "Page Numbers Added (1-42)"} status={isEs ? "Completado" : "Completed"} icon={Hash} />
                        <TableRow name="Contrato_Protegido.pdf" size="1.2 MB" action={isEs ? "Cifrado con Contraseña" : "Encrypted with Password"} status={isEs ? "Completado" : "Completed"} icon={ShieldCheck} />
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ASISTENTE IA */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="mb-4 w-80 sm:w-96 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-mono">
              <div className="bg-zinc-900 p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="font-bold text-white text-xs tracking-wider">{isEs ? '008 / ASISTENTE LOCAL' : '008 / LOCAL ASSISTANT'}</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
              </div>
              <div className="p-4 h-44 flex flex-col justify-end bg-[#09090b]">
                <div className="bg-zinc-900 border border-white/10 p-3.5 rounded-xl rounded-bl-none w-[90%] mb-2">
                  <p className="text-xs text-zinc-300 font-sans">{isEs ? '¡Hola! Estoy listo para ayudarte a editar tus archivos PDF de forma 100% local.' : 'Hello! I am ready to help you edit your PDF files 100% locally.'}</p>
                </div>
              </div>
              <div className="p-3 border-t border-white/10 bg-zinc-900">
                <input type="text" placeholder={isEs ? "$ Escribe una consulta..." : "$ Type a command..."} className="w-full bg-[#09090b] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative group">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-xs font-mono text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isEs ? '$ asistente-local' : '$ local-assistant'}
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAiOpen(!isAiOpen)} className="bg-white text-black hover:bg-zinc-200 p-3.5 rounded-full shadow-2xl transition-all cursor-pointer border border-white/20">
            <Bot className="w-5 h-5 text-black" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({ from = 0, to, decimals = 0, suffix = "" }: { from?: number; to: number; decimals?: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(from, to, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(value: number) { node.textContent = value.toFixed(decimals) + suffix; },
      });
      return () => controls.stop();
    }
  }, [from, to, decimals, suffix]);
  return <span ref={nodeRef}>{from.toFixed(decimals)}{suffix}</span>;
}

function KpiPill({ icon: Icon, title, value, decimals = 0, suffix = '', tooltip, color }: { icon: React.ElementType; title: string; value: number; decimals?: number; suffix?: string; tooltip?: string; color?: string }) {
  return (
    <div className="relative group/kpi">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-full transition-all cursor-help font-mono">
        <Icon className={`w-3.5 h-3.5 ${color || 'text-white'}`} />
        <span className="text-xs font-bold text-white">
          <AnimatedCounter to={value} decimals={decimals} suffix={suffix} />
        </span>
        <span className="text-[10px] text-zinc-400 font-semibold uppercase">{title}</span>
      </div>

      {tooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-mono text-zinc-300 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-200 pointer-events-none shadow-2xl whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function TableRow({ name, size, action, status, icon: Icon }: { name: string; size: string; action: string; status: string; icon: React.ElementType }) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <tr className="border-b border-white/10 hover:bg-zinc-900/40 transition-colors group">
      <td className="py-3.5 pl-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans font-medium text-xs text-white group-hover:text-white transition-colors">{name}</span>
        </div>
      </td>
      <td className="py-3.5 text-zinc-400 text-xs font-mono">{size}</td>
      <td className="py-3.5 text-zinc-400 text-xs font-mono">{action}</td>
      <td className="py-3.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-emerald-400 text-xs font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {status}
        </span>
      </td>
      <td className="py-3.5 pr-2 text-right">
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title={isEs ? "Favorito" : "Favorite"}><Star className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title={isEs ? "Vista Previa" : "Preview"}><Eye className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title={isEs ? "Descargar" : "Download"}><Download className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title={isEs ? "Eliminar" : "Delete"}><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  );
}

export default function EditarPage() {
  return (
    <Suspense fallback={null}>
      <EditarContent />
    </Suspense>
  );
}