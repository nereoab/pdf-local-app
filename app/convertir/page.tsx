'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowRight, RefreshCw, FileText, FileSpreadsheet, Image as ImageIcon, FileCode, Upload,
  UploadCloud, FilePlus, X, ShieldCheck, HardDrive, Clock 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ConvertirPage() {
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
            toast.success(isEs ? "Archivo cargado con éxito." : "File successfully loaded.");
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

  const conversionTools = [
    { 
      id: 'pdf-word', 
      tagEs: '⭐ MÁS POPULAR', tagEn: '⭐ MOST POPULAR', 
      titleEs: 'PDF a Word', titleEn: 'PDF to Word', 
      descEs: 'Convierte tus documentos PDF a archivos de Microsoft Word (.docx) editables.', 
      descEn: 'Convert your PDF documents into editable Microsoft Word (.docx) files.', 
      icon: FileText, path: '/convertir/pdf-word',
      borderColor: 'border-blue-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      hoverBorder: 'group-hover/card:border-blue-300',
      hoverGlow: 'group-hover/card:shadow-[0_0_40px_rgba(59,130,246,0.9),0_0_15px_rgba(59,130,246,0.5)]',
      hoverBg: 'group-hover/card:from-blue-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      btnGradient: 'from-blue-400 to-cyan-500 group-hover/card:from-blue-300 group-hover/card:to-cyan-400',
      iconBg: 'from-blue-500/30 to-cyan-500/20 border-blue-400/50 text-blue-300'
    },
    { 
      id: 'pdf-excel', 
      tagEs: '📊 MÁXIMA PRECISIÓN', tagEn: '📊 HIGH ACCURACY', 
      titleEs: 'PDF a Excel', titleEn: 'PDF to Excel', 
      descEs: 'Extrae tablas y datos numéricos de tu PDF hacia hojas de cálculo (.xlsx).', 
      descEn: 'Extract tables and numerical data from your PDF to spreadsheets (.xlsx).', 
      icon: FileSpreadsheet, path: '/convertir/pdf-excel',
      borderColor: 'border-emerald-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      hoverBorder: 'group-hover/card:border-emerald-300',
      hoverGlow: 'group-hover/card:shadow-[0_0_40px_rgba(16,185,129,0.9),0_0_15px_rgba(16,185,129,0.5)]',
      hoverBg: 'group-hover/card:from-emerald-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      btnGradient: 'from-emerald-400 to-teal-500 group-hover/card:from-emerald-300 group-hover/card:to-teal-400',
      iconBg: 'from-emerald-500/30 to-teal-500/20 border-emerald-400/50 text-emerald-300'
    },
    { 
      id: 'pdf-jpg', 
      tagEs: '🖼️ ALTA RESOLUCIÓN', tagEn: '🖼️ HIGH RES', 
      titleEs: 'PDF a JPG', titleEn: 'PDF to JPG', 
      descEs: 'Convierte cada página del PDF en imágenes JPG de alta calidad visual.', 
      descEn: 'Convert each PDF page into high quality visual JPG images.', 
      icon: ImageIcon, path: '/convertir/pdf-jpg',
      borderColor: 'border-amber-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      hoverBorder: 'group-hover/card:border-amber-300',
      hoverGlow: 'group-hover/card:shadow-[0_0_40px_rgba(245,158,11,0.9),0_0_15px_rgba(245,158,11,0.5)]',
      hoverBg: 'group-hover/card:from-amber-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      btnGradient: 'from-amber-400 to-yellow-500 group-hover/card:from-amber-300 group-hover/card:to-yellow-400',
      iconBg: 'from-amber-500/30 to-yellow-500/20 border-amber-400/50 text-amber-300'
    },
    { 
      id: 'word-pdf', 
      tagEs: '📄 A FORMATO PDF', tagEn: '📄 TO PDF FORMAT', 
      titleEs: 'Word a PDF', titleEn: 'Word to PDF', 
      descEs: 'Transforma tus archivos .docx a formato PDF estándar con compatibilidad total.', 
      descEn: 'Transform your .docx files into standard PDF format with full compatibility.', 
      icon: FileCode, path: '/convertir/word-pdf',
      borderColor: 'border-indigo-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]',
      hoverBorder: 'group-hover/card:border-indigo-300',
      hoverGlow: 'group-hover/card:shadow-[0_0_40px_rgba(99,102,241,0.9),0_0_15px_rgba(99,102,241,0.5)]',
      hoverBg: 'group-hover/card:from-indigo-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      btnGradient: 'from-indigo-400 to-violet-500 group-hover/card:from-indigo-300 group-hover/card:to-violet-400',
      iconBg: 'from-indigo-500/30 to-violet-500/20 border-indigo-400/50 text-indigo-300'
    },
    { 
      id: 'imagen-pdf', 
      tagEs: '🌄 FOTOS A PDF', tagEn: '🌄 PHOTOS TO PDF',
      titleEs: 'Imagen a PDF', titleEn: 'Image to PDF', 
      descEs: 'Combina tus fotos en JPG, PNG o WebP en un único archivo PDF consolidado.', 
      descEn: 'Combine your JPG, PNG, or WebP photos into a single consolidated PDF file.', 
      icon: Upload, path: '/convertir/imagen-a-pdf',
      borderColor: 'border-pink-500/40',
      shadowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]',
      hoverBorder: 'group-hover/card:border-pink-300',
      hoverGlow: 'group-hover/card:shadow-[0_0_40px_rgba(236,72,153,0.9),0_0_15px_rgba(236,72,153,0.5)]',
      hoverBg: 'group-hover/card:from-pink-950/90 group-hover/card:to-slate-900',
      badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
      btnGradient: 'from-pink-400 to-rose-500 group-hover/card:from-pink-300 group-hover/card:to-rose-400',
      iconBg: 'from-pink-500/30 to-rose-500/20 border-pink-400/50 text-pink-300'
    }
  ];

  if (!mounted) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#030712]">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
        <motion.div animate={{ opacity: [0.03, 0.05, 0.03] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[15%] w-[60vw] h-[40vw] rounded-full bg-orange-500 blur-[130px]" />
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileInput} />

        <AnimatePresence mode="wait">
          {isUploading && (
            <motion.div key="loading-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full bg-black/60 border border-orange-500/30 rounded-3xl p-12 shadow-[0_0_40px_rgba(249,115,22,0.15)] mt-10">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2">Cargando documento...</h3>
                  <span className="text-orange-400 font-bold text-3xl tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full relative" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear", duration: 0.1 }}>
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
                  <div className="bg-gradient-to-tr from-orange-500/30 to-amber-500/20 p-3 sm:p-3.5 rounded-2xl border border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                    <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-orange-300 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {isEs ? "CONVERTIR DOCUMENTO" : "CONVERT DOCUMENT"}
                    </h1>
                    <p className="text-neutral-400 text-xs sm:text-sm font-medium">
                      {isEs ? "Exporta y transforma tu PDF a múltiples formatos estándar:" : "Export and transform your PDF into multiple standard formats:"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={24} tooltip={isEs ? "Tus archivos convertidos esta semana" : "Files converted this week"} color="text-orange-400" />
                  <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={3.6} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-amber-400" />
                  <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={50} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-cyan-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 flex flex-col justify-start">
                  {!globalFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[560px] bg-orange-950/10 hover:bg-orange-950/30 border-2 border-dashed border-orange-500/30 hover:border-orange-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(249,115,22,0.25)]"
                    >
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="bg-gradient-to-tr from-orange-500/20 to-amber-500/20 p-6 rounded-full border border-orange-500/30 group-hover:scale-110 group-hover:bg-orange-500/30 group-hover:border-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-300"
                      >
                        <UploadCloud className="w-16 h-16 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-1.5">
                        <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-orange-200 transition-colors">
                          {isEs ? "Arrastra tu PDF aquí para convertir" : "Drop your PDF here to convert"}
                        </h3>
                        <p className="text-orange-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                          {isEs ? "O haz clic para explorar tus archivos" : "Or click to browse your files"}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(249,115,22,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(249,115,22,0.7)] transition-all mt-1 cursor-pointer border border-orange-300/40">
                        <FilePlus className="w-4 h-4 text-white" /> {isEs ? "Subir Archivo" : "Upload File"}
                      </button>

                      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-extrabold mt-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-[560px] bg-orange-950/20 hover:bg-orange-950/30 border-2 border-orange-500/40 hover:border-orange-400 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.25)] hover:shadow-[0_0_50px_rgba(249,115,22,0.4)] transition-all duration-300 flex flex-col relative">
                      <div className="bg-[#030712] border-b border-white/[0.06] p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-orange-500/20 p-2 rounded-xl border border-orange-500/30 flex-shrink-0">
                            <FileText className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{globalFile.name}</span>
                            <span className="text-orange-400/80 text-[10px] font-medium">{formatFileSize(globalFile.size)}</span>
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

                <div className="lg:col-span-7 flex flex-col justify-between h-[560px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 h-full max-h-[560px] group/grid">
                    {conversionTools.map((tool) => (
                      <Link 
                        key={tool.id} 
                        href={globalFile ? tool.path : "#"} 
                        onClick={(e) => { 
                          if (!globalFile) { 
                            e.preventDefault(); 
                            toast.error(isEs ? "Sube un archivo primero para usar la herramienta." : "Upload a file first to use the tool."); 
                          } 
                        }} 
                        className={`outline-none group/card block h-full ${!globalFile ? 'opacity-85 hover:opacity-100 cursor-pointer' : 'transition-opacity duration-300 group-hover/grid:opacity-65 hover:!opacity-100'}`}
                      >
                        <div className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border-2 ${tool.borderColor} ${tool.shadowColor} ${tool.hoverBorder} ${tool.hoverBg} rounded-2xl p-3.5 lg:p-4 transition-all duration-300 flex flex-col justify-between group-hover/card:-translate-y-1 ${tool.hoverGlow} relative overflow-hidden h-full`}>
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover/card:bg-white/15 transition-all duration-500 pointer-events-none" />

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`bg-gradient-to-tr ${tool.iconBg} p-2.5 rounded-2xl border shadow-md group-hover/card:scale-110 transition-transform duration-300`}>
                                <tool.icon className="w-4.5 h-4.5 drop-shadow-[0_0_8px_currentColor]" />
                              </div>

                              <div className={`bg-gradient-to-r ${tool.btnGradient} text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-md group-hover/card:scale-105 group-hover/card:shadow-lg flex items-center gap-1.5 transition-all duration-300`}>
                                <span>{isEs ? "Usar Ahora" : "Use Now"}</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition-transform" />
                              </div>
                            </div>

                            <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${tool.badgeBg} border mb-1 inline-block shadow-sm`}>
                              {isEs ? tool.tagEs : tool.tagEn}
                            </span>

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
                    ))}
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