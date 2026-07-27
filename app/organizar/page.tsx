'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowRight, FolderOpen, Merge, Scissors, Trash2, LayoutGrid, RotateCw, Crop,
  FileText, UploadCloud, FilePlus, X, ShieldCheck, HardDrive, Clock, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

function OrganizarContent() {
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

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error(isEs ? 'Por favor sube solo archivos PDF' : 'Please upload PDF files only');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setGlobalFile(file);
            toast.success(isEs ? `Archivo "${file.name}" cargado exitosamente.` : `File "${file.name}" uploaded successfully.`);
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 60);
  };

  const handleRemoveFile = () => {
    setGlobalFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const organizingTools = [
    { 
      id: 'unir', 
      tagEs: '🧩 FUSIONAR PDFS', tagEn: '🧩 MERGE PDFS', 
      titleEs: 'Unir Archivos PDF', titleEn: 'Merge PDF Files', 
      descEs: 'Une múltiples archivos PDF en un solo documento organizado en segundos.', 
      descEn: 'Combine multiple PDF files into one organized document in seconds.', 
      icon: Merge, path: '/organizar/unir',
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
      id: 'dividir', 
      tagEs: '✂️ SEPARAR EN PARTES', tagEn: '✂️ SPLIT PAGES', 
      titleEs: 'Dividir Archivo PDF', titleEn: 'Split PDF File', 
      descEs: 'Separa un PDF en varias partes de una o varias páginas según necesites.', 
      descEn: 'Extract one or multiple pages into separate PDF files as needed.', 
      icon: Scissors, path: '/organizar/dividir',
      borderColor: 'border-teal-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(20,184,166,0.2)]',
      hoverBorder: 'group-hover/card:border-teal-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(20,184,166,0.35)]',
      hoverBg: 'group-hover/card:from-teal-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
      btnGradient: 'from-teal-400 to-cyan-500 group-hover/card:from-teal-300 group-hover/card:to-cyan-400',
      iconBg: 'from-teal-500/30 to-cyan-500/20 border-teal-400/50 text-teal-300'
    },
    { 
      id: 'eliminar', 
      tagEs: '🗑️ BORRAR PÁGINAS', tagEn: '🗑️ REMOVE PAGES', 
      titleEs: 'Eliminar Páginas PDF', titleEn: 'Delete PDF Pages', 
      descEs: 'Selecciona y elimina las páginas no deseadas de tu archivo PDF fácilmente.', 
      descEn: 'Select and remove unwanted pages from your PDF file easily.', 
      icon: Trash2, path: '/organizar/eliminar',
      borderColor: 'border-rose-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]',
      hoverBorder: 'group-hover/card:border-rose-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(244,63,94,0.35)]',
      hoverBg: 'group-hover/card:from-rose-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      btnGradient: 'from-red-400 to-rose-500 group-hover/card:from-red-300 group-hover/card:to-rose-400',
      iconBg: 'from-red-500/30 to-rose-500/20 border-red-400/50 text-red-300'
    },
    { 
      id: 'reordenar', 
      tagEs: '🔄 REORDENAR', tagEn: '🔄 REORDER', 
      titleEs: 'Reordenar PDF', titleEn: 'Reorder PDF', 
      descEs: 'Arrastra y suelta páginas para cambiar su orden en el documento.', 
      descEn: 'Drag and drop pages to change their order in the document.', 
      icon: LayoutGrid, path: '/organizar/reordenar',
      borderColor: 'border-blue-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      hoverBorder: 'group-hover/card:border-blue-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(59,130,246,0.35)]',
      hoverBg: 'group-hover/card:from-blue-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      btnGradient: 'from-blue-400 to-indigo-500 group-hover/card:from-blue-300 group-hover/card:to-indigo-400',
      iconBg: 'from-blue-500/30 to-indigo-500/20 border-blue-400/50 text-blue-300'
    },
    { 
      id: 'rotar', 
      tagEs: '↻ ROTAR', tagEn: '↻ ROTATE', 
      titleEs: 'Rotar PDF', titleEn: 'Rotate PDF', 
      descEs: 'Gira las páginas de tu PDF fácilmente.', 
      descEn: 'Rotate your PDF pages easily.', 
      icon: RotateCw, path: '/organizar/rotar',
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
      id: 'recortar', 
      tagEs: '📐 RECORTAR', tagEn: '📐 CROP', 
      titleEs: 'Recortar PDF', titleEn: 'Crop PDF', 
      descEs: 'Recorta márgenes de tu documento PDF.', 
      descEn: 'Crop margins from your PDF document.', 
      icon: Crop, path: '/organizar/recortar',
      borderColor: 'border-purple-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      hoverBorder: 'group-hover/card:border-purple-400',
      hoverGlow: 'group-hover/card:shadow-[0_0_30px_rgba(168,85,247,0.35)]',
      hoverBg: 'group-hover/card:from-purple-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      btnGradient: 'from-purple-400 to-violet-500 group-hover/card:from-purple-300 group-hover/card:to-violet-400',
      iconBg: 'from-purple-500/30 to-violet-500/20 border-purple-400/50 text-purple-300'
    }
  ];

  if (!mounted) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#0a0400]">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
        <motion.div animate={{ opacity: [0.03, 0.05, 0.03] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[15%] w-[60vw] h-[40vw] rounded-full bg-emerald-500 blur-[130px]" />
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
          accept="application/pdf" 
          className="hidden" 
        />

        <AnimatePresence mode="wait">
          {isUploading && (
            <motion.div key="uploading-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-[450px] bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="p-4 bg-emerald-500/20 rounded-full border border-emerald-400/50">
                <FolderOpen className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">{isEs ? "Cargando tu archivo PDF..." : "Loading your PDF file..."}</h3>
                <p className="text-emerald-400 text-sm font-medium">{isEs ? "Procesando en tu navegador de forma 100% segura" : "Processing safely in your browser"}</p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>{isEs ? "Progreso de carga" : "Upload progress"}</span>
                  <span className="text-emerald-400 font-bold text-3xl tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full relative" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear", duration: 0.1 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {!isUploading && (
            <motion.div key="workspace-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {isEs ? "002 / HERRAMIENTAS DE ORGANIZAR PDF" : "002 / PDF ORGANIZATION TOOLS"}
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1">
                      {isEs ? "Administra las páginas y la estructura de tu documento PDF:" : "Manage the pages and structure of your PDF document:"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={18} tooltip={isEs ? "Tus archivos organizados esta semana" : "Files organized this week"} color="text-white" />
                  <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={2.4} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-zinc-300" />
                  <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={60} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-zinc-400" />
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
                          {isEs ? "Arrastra tu PDF aquí para organizar" : "Drop your PDF here to organize"}
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
                        <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex-1 h-full min-h-[500px] bg-emerald-950/20 hover:bg-emerald-950/30 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all duration-300 flex flex-col relative">
                      <div className="bg-[#030712] border-b border-white/[0.06] p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 flex-shrink-0">
                            <FileText className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{globalFile.name}</span>
                            <span className="text-emerald-400/80 text-[10px] font-medium">{formatFileSize(globalFile.size)}</span>
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
                    {organizingTools.map((tool) => {
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
                          <div className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border-2 ${isSelected ? 'border-emerald-400 ring-4 ring-emerald-400/50 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-[1.02]' : `${tool.borderColor} ${tool.shadowColor}`} ${tool.hoverBorder} ${tool.hoverBg} rounded-2xl p-3.5 lg:p-4 transition-all duration-300 flex flex-col justify-between group-hover/card:-translate-y-1 ${tool.hoverGlow} relative overflow-hidden h-full`}>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover/card:bg-white/15 transition-all duration-500 pointer-events-none" />

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`bg-gradient-to-tr ${tool.iconBg} p-2.5 rounded-2xl border shadow-md group-hover/card:scale-110 transition-transform duration-300`}>
                                  <tool.icon className="w-4.5 h-4.5 drop-shadow-[0_0_8px_currentColor]" />
                                </div>

                                <div className={`bg-gradient-to-r ${isSelected ? 'from-emerald-300 to-teal-400 animate-pulse' : tool.btnGradient} text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-md group-hover/card:scale-105 group-hover/card:shadow-lg flex items-center gap-1.5 transition-all duration-300`}>
                                  <span>{isSelected ? (isEs ? "SELECCIONADO" : "SELECTED") : (isEs ? "Usar Ahora" : "Use Now")}</span>
                                  <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition-transform" />
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${tool.badgeBg} border shadow-sm`}>
                                  {isEs ? tool.tagEs : tool.tagEn}
                                </span>
                                {isSelected && (
                                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-md animate-pulse">
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

                              <span className="text-[10px] font-extrabold text-slate-400 group-hover/card:text-white transition-colors flex items-center gap-1">
                                {isEs ? "Iniciar" : "Start"}
                                <ArrowRight className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" />
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
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isEs ? "Solo 3 pasos para organizar tu PDF" : "Only 3 steps to organize your PDF"}
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
                  <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-[#0b1120]/80 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                      2
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-2 flex items-center gap-1.5">
                      🛠️ {isEs ? "2. Usa la herramienta" : "2. Use the tool"}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {isEs ? "En la página especializada, elige la función exacta (Unir, Dividir, Foliar, etc.)." : "In the specialized page, select the exact function (Merge, Split, Reorder, etc.)."}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function KpiPill({ icon: Icon, title, value, decimals = 0, suffix = "", tooltip, color }: any) {
  return (
    <div title={tooltip} className="flex items-center gap-2 bg-slate-900/90 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all cursor-default group">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div className="flex items-baseline gap-1">
        <span className="text-white font-extrabold text-xs">{value}{suffix}</span>
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{title}</span>
      </div>
    </div>
  );
}

export default function OrganizarPage() {
  return (
    <Suspense fallback={null}>
      <OrganizarContent />
    </Suspense>
  );
}