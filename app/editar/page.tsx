'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { animate } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Edit3, Type, PenTool, Hash, ShieldAlert, Lock, 
  FileText, UploadCloud, FilePlus, X, Zap, HardDrive, Clock, Search, Star, Eye, 
  Download, Trash2, Bot, CheckCircle2, FolderOpen, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

function EditarContent() {
  const searchParams = useSearchParams();
  const selectedToolParam = searchParams.get('tool');

  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [mounted, setMounted] = useState(false);

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (globalFile) {
      const url = URL.createObjectURL(globalFile);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
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
      tagEs: '✏️ TEXTO E IMÁGENES', tagEn: '✏️ TEXT & IMAGES', 
      titleEs: 'Editar Texto e Imágenes', titleEn: 'Edit Text & Images', 
      descEs: 'Edita texto e imágenes directamente en tu PDF sin perder el formato original del documento.', 
      descEn: 'Edit text and images directly in your PDF without losing original layout.', 
      icon: Type, path: '/editar/texto',
      borderColor: 'border-cyan-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      hoverBorder: 'group-hover/card:border-cyan-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(6,182,212,0.35)]',
      hoverBg: 'group-hover/card:from-cyan-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      btnGradient: 'from-cyan-400 to-blue-500 group-hover/card:from-cyan-300 group-hover/card:to-blue-400',
      iconBg: 'from-cyan-500/30 to-blue-500/20 border-cyan-400/50 text-cyan-300'
    },
    { 
      id: 'foliado', 
      tagEs: '🔢 FOLIADO Y NÚMEROS', tagEn: '🔢 PAGE NUMBERS', 
      titleEs: 'Poner Números a Páginas (Foliado)', titleEn: 'Add Page Numbers (Folios)', 
      descEs: 'Añade números correlativos y foliados personalizados en el encabezado o pie de página.', 
      descEn: 'Add consecutive page numbers and customized folios in headers or footers.', 
      icon: Hash, path: '/editar/foliar',
      borderColor: 'border-emerald-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      hoverBorder: 'group-hover/card:border-emerald-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(16,185,129,0.35)]',
      hoverBg: 'group-hover/card:from-emerald-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      btnGradient: 'from-emerald-400 to-teal-500 group-hover/card:from-emerald-300 group-hover/card:to-teal-400',
      iconBg: 'from-emerald-500/30 to-teal-500/20 border-emerald-400/50 text-emerald-300'
    },
    { 
      id: 'poner-marca-agua', 
      tagEs: '🛡️ SELLO DE AGUA', tagEn: '🛡️ ADD WATERMARK', 
      titleEs: 'Poner Sello de Agua', titleEn: 'Add Watermark', 
      descEs: 'Inserta sellos de agua personalizados en texto o imagen en todo el documento PDF.', 
      descEn: 'Insert customized text or image watermarks across the entire PDF document.', 
      icon: ShieldAlert, path: '/editar/marca-agua',
      borderColor: 'border-amber-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      hoverBorder: 'group-hover/card:border-amber-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(245,158,11,0.35)]',
      hoverBg: 'group-hover/card:from-amber-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      btnGradient: 'from-amber-400 to-yellow-500 group-hover/card:from-amber-300 group-hover/card:to-yellow-400',
      iconBg: 'from-amber-500/30 to-yellow-500/20 border-amber-400/50 text-amber-300'
    },
    { 
      id: 'quitar-marca-agua', 
      tagEs: '🧹 QUITAR SELLO DE AGUA', tagEn: '🧹 REMOVE WATERMARK', 
      titleEs: 'Quitar Sello de Agua', titleEn: 'Remove Watermark', 
      descEs: 'Detecta y remueve sellos o marcas de agua existentes de un documento PDF.', 
      descEn: 'Detect and remove existing watermarks or stamps from a PDF document.', 
      icon: Sparkles, path: '/editar/quitar-marca-agua',
      borderColor: 'border-pink-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]',
      hoverBorder: 'group-hover/card:border-pink-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(236,72,153,0.35)]',
      hoverBg: 'group-hover/card:from-pink-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
      btnGradient: 'from-pink-400 to-rose-500 group-hover/card:from-pink-300 group-hover/card:to-rose-400',
      iconBg: 'from-pink-500/30 to-rose-500/20 border-pink-400/50 text-pink-300'
    },
    { 
      id: 'firmar', 
      tagEs: '🖋️ FIRMA DIGITAL', tagEn: '🖋️ DIGITAL SIGNATURE', 
      titleEs: 'Firmar PDF', titleEn: 'Sign PDF', 
      descEs: 'Dibuja, escribe o sube una imagen de tu firma para estamparla en el documento.', 
      descEn: 'Draw, type, or upload an image of your signature to stamp on the document.', 
      icon: PenTool, path: '/editar/firma',
      borderColor: 'border-purple-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      hoverBorder: 'group-hover/card:border-purple-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(168,85,247,0.35)]',
      hoverBg: 'group-hover/card:from-purple-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      btnGradient: 'from-purple-400 to-violet-500 group-hover/card:from-purple-300 group-hover/card:to-violet-400',
      iconBg: 'from-purple-500/30 to-violet-500/20 border-purple-400/50 text-purple-300'
    },
    { 
      id: 'ocr', 
      tagEs: '🔍 OCR RECONOCIMIENTO', tagEn: '🔍 SEARCHABLE OCR', 
      titleEs: 'OCR PDF (Texto Seleccionable)', titleEn: 'OCR PDF (Selectable Text)', 
      descEs: 'Convierte un PDF escaneado o imágenes en un documento PDF con texto seleccionable.', 
      descEn: 'Convert scanned PDF or images into a PDF with selectable text.', 
      icon: Search, path: '/editar/ocr',
      borderColor: 'border-indigo-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]',
      hoverBorder: 'group-hover/card:border-indigo-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(99,102,241,0.35)]',
      hoverBg: 'group-hover/card:from-indigo-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      btnGradient: 'from-indigo-400 to-blue-600 group-hover/card:from-indigo-300 group-hover/card:to-blue-500',
      iconBg: 'from-indigo-500/30 to-blue-500/20 border-indigo-400/50 text-indigo-300'
    }
  ];

  if (!mounted) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#030712]">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
        <motion.div animate={{ opacity: [0.03, 0.05, 0.03] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[15%] w-[60vw] h-[40vw] rounded-full bg-blue-500 blur-[130px]" />
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileInput} />

        <AnimatePresence mode="wait">
          {isUploading && (
            <motion.div key="loading-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full bg-black/60 border border-blue-500/30 rounded-3xl p-12 shadow-[0_0_40px_rgba(59,130,246,0.15)] mt-10">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2">Cargando documento...</h3>
                  <span className="text-blue-400 font-bold text-3xl tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full relative" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear", duration: 0.1 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {!isUploading && (
            <motion.div key="workspace-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
              {/* TÍTULO DE PÁGINA Y KPI STATS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3.5">
                  <div className="bg-gradient-to-tr from-blue-500/30 to-cyan-500/20 p-3 sm:p-3.5 rounded-2xl border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Edit3 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {isEs ? "HERRAMIENTAS DE EDICIÓN PDF" : "PDF EDITING TOOLS"}
                    </h1>
                    <p className="text-neutral-400 text-xs sm:text-sm font-medium">
                      {isEs ? "Selecciona el módulo de edición que deseas aplicar sobre tu documento:" : "Select the editing module you wish to apply to your document:"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={12} tooltip={isEs ? "Tus archivos procesados esta semana" : "Files processed this week"} color="text-blue-400" />
                  <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={1.2} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-emerald-400" />
                  <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={45} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-orange-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
                <div className="lg:col-span-5 flex flex-col h-full">
                  {!globalFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex-1 h-full min-h-[500px] bg-cyan-950/10 hover:bg-cyan-950/30 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]"
                    >
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 p-7 rounded-full border border-blue-500/30 group-hover:scale-110 group-hover:bg-blue-500/30 group-hover:border-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.25)] transition-all duration-300"
                      >
                        <UploadCloud className="w-20 h-20 text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-2">
                        <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight group-hover:text-blue-200 transition-colors">
                          {isEs ? "Arrastra tu PDF aquí para editar" : "Drop your PDF here to edit"}
                        </h3>
                        <p className="text-blue-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                          {isEs ? "O haz clic para explorar tus archivos" : "Or click to browse your files"}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-9 py-4 rounded-full font-black text-base shadow-[0_0_25px_rgba(6,182,212,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all mt-2 cursor-pointer border border-cyan-300/40">
                        <FilePlus className="w-5 h-5 text-slate-950" /> {isEs ? "Subir Archivo" : "Upload File"}
                      </button>

                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-extrabold mt-2">
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                        <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex-1 h-full min-h-[500px] bg-cyan-950/20 hover:bg-cyan-950/30 border-2 border-blue-500/40 hover:border-blue-400 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.25)] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] transition-all duration-300 flex flex-col relative">
                      <div className="bg-[#030712] border-b border-white/[0.06] p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30 flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{globalFile.name}</span>
                            <span className="text-blue-400/80 text-[10px] font-medium">{formatFileSize(globalFile.size)}</span>
                          </div>
                        </div>
                        <button onClick={handleRemoveFile} className="flex-shrink-0 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300" title={isEs ? "Quitar archivo" : "Remove file"}>
                          <X className="w-4 h-4 hover:rotate-90 transition-transform duration-300" />
                        </button>
                      </div>
                      
                      <div className="w-full flex-1 bg-[#0a0a0a] relative pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-black/5 z-10" />
                        {pdfUrl && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[75%] aspect-[1/1.414]">
                            <iframe 
                              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                              className="w-full h-full border-none bg-white shadow-2xl rounded-md" 
                              scrolling="no"
                              title="PDF Preview" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 flex flex-col h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 h-full group/grid">
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
                          className={`outline-none group/card block h-full ${!globalFile ? 'opacity-85 hover:opacity-100 cursor-pointer' : 'transition-opacity duration-300 group-hover/grid:opacity-65 hover:!opacity-100'}`}
                        >
                          <div className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border-2 ${isSelected ? 'border-cyan-400 ring-4 ring-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.8)] scale-[1.02]' : `${tool.borderColor} ${tool.shadowColor}`} ${tool.hoverBorder} ${tool.hoverBg} rounded-2xl p-3.5 lg:p-4 transition-all duration-300 flex flex-col justify-between group-hover/card:-translate-y-1 ${tool.hoverGlow} relative overflow-hidden h-full`}>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover/card:bg-white/15 transition-all duration-500 pointer-events-none" />

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`bg-gradient-to-tr ${tool.iconBg} p-2.5 rounded-2xl border shadow-md group-hover/card:scale-110 transition-transform duration-300`}>
                                  <tool.icon className="w-4.5 h-4.5 drop-shadow-[0_0_8px_currentColor]" />
                                </div>

                                <div className={`bg-gradient-to-r ${isSelected ? 'from-cyan-300 to-blue-400 animate-pulse text-slate-950' : tool.btnGradient} font-black text-xs px-3.5 py-1 rounded-full shadow-md group-hover/card:scale-105 group-hover/card:shadow-lg flex items-center gap-1.5 transition-all duration-300`}>
                                  <span>{isSelected ? (isEs ? "SELECCIONADO" : "SELECTED") : (isEs ? "Usar Ahora" : "Use Now")}</span>
                                  <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition-transform" />
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${tool.badgeBg} border shadow-sm`}>
                                  {isEs ? tool.tagEs : tool.tagEn}
                                </span>
                                {isSelected && (
                                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 flex items-center gap-1 shadow-md animate-pulse">
                                    <CheckCircle2 className="w-3 h-3" /> {isEs ? 'ELEGIDO EN MENÚ' : 'MENU SELECTED'}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm font-black text-white mb-0.5 tracking-tight group-hover/card:text-white transition-colors">
                                {isEs ? tool.titleEs : tool.titleEn}
                              </h3>
                              <p className="text-slate-300 text-[11px] font-medium leading-normal line-clamp-2">
                                {isEs ? tool.descEs : tool.descEn}
                              </p>
                            </div>

                            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                {isEs ? "100% Local" : "100% Local"}
                              </span>
                              <span className="text-[11px] font-black text-white group-hover/card:translate-x-0.5 transition-transform flex items-center gap-1">
                                {isEs ? "Iniciar" : "Start"} &rarr;
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
              <div className="w-full mt-10 pt-8 border-t border-white/10 flex flex-col items-center">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {isEs ? "Solo 3 pasos para editar tu PDF" : "Only 3 steps to edit your PDF"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {/* PASO 1 */}
                  <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-[#0b1120]/80 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] group">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                      1
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-2 flex items-center gap-1.5">
                      📁 {isEs ? "1. Sube tu PDF" : "1. Upload your PDF"}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {isEs ? "Arrastra o selecciona tu archivo PDF en el recuadro principal." : "Drag or select your PDF file in the main dropzone box."}
                    </p>
                  </div>

                  {/* PASO 2 */}
                  <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-[#0b1120]/80 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                      2
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-2 flex items-center gap-1.5">
                      🛠️ {isEs ? "2. Usa la herramienta" : "2. Use the tool"}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {isEs ? "En la página especializada, elige la función exacta (Unir, Dividir, Foliar, etc.)." : "In the specialized page, select the exact function (Text edit, Watermark, Sign, etc.)."}
                    </p>
                  </div>

                  {/* PASO 3 */}
                  <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-[#0b1120]/80 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] group">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                      3
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-2 flex items-center gap-1.5">
                      ⬇️ {isEs ? "3. Descarga lista" : "3. Download ready"}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {isEs ? "Obtén tu documento final 100% procesado de forma local en tu navegador." : "Get your final document 100% processed locally in your browser."}
                    </p>
                  </div>
                </div>
              </div>

              {/* TABLA DE ARCHIVOS RECIENTES */}
              <div className="relative z-10 mt-12 sm:mt-16">
                <div className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl mb-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-blue-400" /> {isEs ? 'Archivos Recientes' : 'Recent Files'}
                    </h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" placeholder={isEs ? "Buscar archivos..." : "Search files..."} className="w-full bg-black/50 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="pb-4 font-bold text-[11px] uppercase tracking-wider text-gray-500 pl-2">{isEs ? 'Nombre del Archivo' : 'File Name'}</th>
                          <th className="pb-4 font-bold text-[11px] uppercase tracking-wider text-gray-500">{isEs ? 'Tamaño' : 'Size'}</th>
                          <th className="pb-4 font-bold text-[11px] uppercase tracking-wider text-gray-500">{isEs ? 'Acción Realizada' : 'Action Performed'}</th>
                          <th className="pb-4 font-bold text-[11px] uppercase tracking-wider text-gray-500">{isEs ? 'Estado' : 'Status'}</th>
                          <th className="pb-4 font-bold text-[11px] uppercase tracking-wider text-gray-500 text-right pr-2">{isEs ? 'Acciones' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <TableRow name="Documento_Editado_v1.pdf" size="3.1 MB" action={isEs ? "Texto & Firma Editados" : "Text & Signature Edited"} status={isEs ? "Completado" : "Completed"} icon={FileText} color="text-blue-400" />
                        <TableRow name="Expediente_Foliado.pdf" size="8.4 MB" action={isEs ? "Folios Agregados (1-42)" : "Page Numbers Added (1-42)"} status={isEs ? "Completado" : "Completed"} icon={Hash} color="text-cyan-400" />
                        <TableRow name="Contrato_Protegido.pdf" size="1.2 MB" action={isEs ? "Cifrado con Contraseña" : "Encrypted with Password"} status={isEs ? "Completado" : "Completed"} icon={ShieldCheck} color="text-emerald-400" />
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="mb-4 w-80 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">{isEs ? 'Asistente PDFBlack' : 'PDFBlack Assistant'}</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
              <div className="p-4 h-48 flex flex-col justify-end bg-black/50">
                <div className="bg-white/10 p-3 rounded-xl rounded-bl-none w-[85%] mb-2">
                  <p className="text-xs text-gray-200">{isEs ? '¡Hola! Estoy listo para ayudarte a editar tus archivos PDF de forma 100% local.' : 'Hello! I am ready to help you edit your PDF files 100% locally.'}</p>
                </div>
              </div>
              <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
                <input type="text" placeholder={isEs ? "Escribe tu consulta..." : "Type your query..."} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative group">
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black border border-white/10 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isEs ? 'Asistente IA' : 'AI Assistant'}
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsAiOpen(!isAiOpen)} className="bg-blue-500 hover:bg-blue-400 text-white p-3.5 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-colors flex items-center justify-center">
            <Bot className="w-5 h-5" />
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
        onUpdate(value) { node.textContent = value.toFixed(decimals) + suffix; },
      });
      return () => controls.stop();
    }
  }, [from, to, decimals, suffix]);
  return <span ref={nodeRef}>{from.toFixed(decimals)}{suffix}</span>;
}

function KpiPill({ icon: Icon, title, value, decimals, suffix, tooltip, color }: any) {
  return (
    <div className="relative group/kpi">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.08] hover:border-cyan-500/40 rounded-full hover:bg-white/[0.06] transition-all cursor-help shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs font-black text-white">
          <AnimatedCounter to={value} decimals={decimals} suffix={suffix} />
        </span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</span>
      </div>

      {tooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-[10px] font-semibold text-cyan-300 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function TableRow({ name, size, action, status, icon: Icon, color }: any) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      <td className="py-4 pl-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black/50 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{name}</span>
        </div>
      </td>
      <td className="py-4 text-gray-400">{size}</td>
      <td className="py-4 text-gray-400">{action}</td>
      <td className="py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-transparent border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" /> {status}
        </span>
      </td>
      <td className="py-4 pr-2 text-right">
        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
          <button className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-white/10 rounded-md transition-colors" title={isEs ? "Favorito" : "Favorite"}><Star className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded-md transition-colors" title={isEs ? "Vista Previa" : "Preview"}><Eye className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-md transition-colors" title={isEs ? "Descargar" : "Download"}><Download className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors" title={isEs ? "Eliminar" : "Delete"}><Trash2 className="w-4 h-4" /></button>
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