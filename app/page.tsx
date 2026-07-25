'use client';

import { useFileStore } from '../store/useFileStore';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, animate, Variants } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, Edit3, RefreshCw, Zap, FolderOpen, 
  FileText, CheckCircle2, FileArchive, Download, Trash2, Search, Star, 
  Clock, HardDrive, Bot, Eye, Sparkles, X, ArrowRight, UploadCloud, FilePlus
} from 'lucide-react';
import { toast } from 'sonner';

function AnimatedCounter({ from = 0, to, decimals = 0, suffix = '' }: { from?: number, to: number, decimals?: number, suffix?: string }) {
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

const categories = [
  {
    id: 'editar', titleEs: 'Editar PDF', titleEn: 'Edit PDF',
    descEs: 'Añade texto real, firmas, folios, marcas de agua o protege con contraseña.',
    descEn: 'Add real text, signatures, page numbers, watermarks, or password protection.',
    badgeEs: '🔥 El Más Usado', badgeEn: '🔥 Most Used',
    badgeStyle: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    icon: Edit3, path: '/editar', color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    shadowColor: 'shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    hoverGlow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.45)] group-hover:border-blue-400',
    shadowColorValue: '0 0 25px rgba(59,130,246,0.2)',
    peakShadowValue: '0 0 50px rgba(59,130,246,0.95)',
    borderColorValue: 'rgba(59,130,246,0.4)',
    peakBorderValue: 'rgba(96,165,250,1)'
  },
  {
    id: 'organizar', titleEs: 'Organizar PDF', titleEn: 'Organize PDF',
    descEs: 'Une múltiples archivos, divide páginas, extrae secciones o reordena tu documento.',
    descEn: 'Merge multiple files, split pages, extract sections, or reorder your document.',
    badgeEs: '⚡ Indispensable', badgeEn: '⚡ Essential',
    badgeStyle: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    icon: FolderOpen, path: '/organizar', color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    shadowColor: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    hoverGlow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.45)] group-hover:border-emerald-400',
    shadowColorValue: '0 0 25px rgba(16,185,129,0.2)',
    peakShadowValue: '0 0 50px rgba(16,185,129,0.95)',
    borderColorValue: 'rgba(16,185,129,0.4)',
    peakBorderValue: 'rgba(52,211,153,1)'
  },
  {
    id: 'convertir', titleEs: 'Convertir PDF', titleEn: 'Convert PDF',
    descEs: 'Transforma, extrae texto o convierte a formatos editables como Word, Excel o JPG.',
    descEn: 'Transform, extract text, or convert to editable formats like Word, Excel, or JPG.',
    badgeEs: '🎯 Alta Precisión', badgeEn: '🎯 High Precision',
    badgeStyle: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    icon: RefreshCw, path: '/convertir', color: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    shadowColor: 'shadow-[0_0_25px_rgba(249,115,22,0.2)]',
    hoverGlow: 'group-hover:shadow-[0_0_40px_rgba(249,115,22,0.45)] group-hover:border-orange-400',
    shadowColorValue: '0 0 25px rgba(249,115,22,0.2)',
    peakShadowValue: '0 0 50px rgba(249,115,22,0.95)',
    borderColorValue: 'rgba(249,115,22,0.4)',
    peakBorderValue: 'rgba(251,146,60,1)'
  },
  {
    id: 'optimizar', titleEs: 'Optimizar PDF', titleEn: 'Optimize PDF',
    descEs: 'Comprime el tamaño de tus archivos pesados sin perder calidad visual para compartirlos.',
    descEn: 'Compress heavy files without losing visual quality for fast and easy sharing.',
    badgeEs: '📉 Reduce hasta 90%', badgeEn: '📉 Save up to 90%',
    badgeStyle: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    icon: Zap, path: '/optimizar', color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    shadowColor: 'shadow-[0_0_25px_rgba(168,85,247,0.2)]',
    hoverGlow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.45)] group-hover:border-purple-400',
    shadowColorValue: '0 0 25px rgba(168,85,247,0.2)',
    peakShadowValue: '0 0 50px rgba(168,85,247,0.95)',
    borderColorValue: 'rgba(168,85,247,0.4)',
    peakBorderValue: 'rgba(192,132,252,1)'
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.6 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};

export default function DashboardPage() {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const isEs = lang === 'es';

  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragCounter, setDragCounter] = useState(0); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setDragCounter(prev => prev + 1); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragCounter(prev => prev - 1); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(0);
    if (isUploading || file) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) procesarArchivo(e.target.files[0]);
  };

  const procesarArchivo = (archivoSeleccionado: File) => {
    if (archivoSeleccionado.type !== "application/pdf") {
      toast.error(isEs ? "Por favor, sube un archivo PDF válido." : "Please upload a valid PDF file.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    
    const url = URL.createObjectURL(archivoSeleccionado);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPdfUrl(url); 
            setFile(archivoSeleccionado);
            setGlobalFile(archivoSeleccionado); 
            setIsUploading(false);
            setUploadProgress(0);
            toast.success(isEs ? "Archivo cargado. ¿Qué deseas hacer con él?" : "File loaded. What do you want to do?");
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 15; 
      });
    }, 100);
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    setGlobalFile(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
      className={`w-full px-4 sm:px-6 lg:px-8 pb-10 flex flex-col items-center justify-start relative min-h-[calc(100vh-64px)] bg-[#030712] transition-all duration-700 ${file ? 'pt-6' : 'pt-8 sm:pt-10'}`}
    >
      {/* OVERLAY DE MODO ENFOQUE */}
      <AnimatePresence>
        {file && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[40] bg-black/70 backdrop-blur-sm pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* OVERLAY OMNIPRESENTE (Drag & Drop) */}
      <AnimatePresence>
        {dragCounter > 0 && !file && !isUploading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full h-full max-w-5xl max-h-[80vh] border-4 border-cyan-500/50 border-dashed rounded-[3rem] flex flex-col items-center justify-center bg-cyan-500/5 pointer-events-none">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <UploadCloud className="w-32 h-32 text-cyan-400 mb-6 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                {isEs ? "Suelta tu PDF en cualquier lugar" : "Drop your PDF anywhere"}
              </h2>
              <p className="text-cyan-400 text-xl font-medium">{isEs ? "Para empezar a trabajar al instante" : "To start working instantly"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
          <motion.div animate={{ opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[5%] w-[80vw] h-[50vw] rounded-full bg-cyan-500 blur-[150px]" />
          <motion.div animate={{ opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-[15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500 blur-[150px]" />
        </div>
      )}

      <div className="w-full max-w-7xl relative">
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileInput} />

        <AnimatePresence mode="wait">
          
          {/* VISTA PRINCIPAL */}
          {!isUploading && (
            <motion.div 
              key="main-view" 
              exit={{ opacity: 0, y: -20 }} 
              transition={{ duration: 0.3 }} 
              className={`relative ${file ? 'z-[50]' : 'z-10'}`}
            >
              {/* FILA 1: TÍTULO Y SUBTÍTULO PRINCIPAL */}
              <div className="mb-4 text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F4F4F5] tracking-tight drop-shadow-lg leading-[1.25] antialiased">
                  {isEs ? 'Herramientas PDF gratuitas, ' : 'Completely free PDF tools, '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    {isEs ? 'sin tarjeta, sin registro.' : 'no credit card, no sign-up.'}
                  </span>
                </h1>
              </div>

              {/* FILA 2: ESTADÍSTICAS KPI */}
              <div className="flex flex-wrap items-center justify-start gap-3 mb-8 mt-5">
                <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={12} tooltip={isEs ? "Tus archivos procesados esta semana" : "Files processed this week"} color="text-blue-400" />
                <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={1.2} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-emerald-400" />
                <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={45} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-orange-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
                
                {/* LADO IZQUIERDO: Smart Upload o Visor del PDF */}
                <div className="lg:col-span-5 flex flex-col">
                  {!file ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full bg-cyan-950/10 hover:bg-cyan-950/30 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] min-h-[440px]"
                    >
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-6 rounded-full border border-cyan-500/30 group-hover:scale-110 group-hover:bg-cyan-500/30 group-hover:border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300"
                      >
                        <UploadCloud className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-1.5">
                        <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-cyan-200 transition-colors">
                          {isEs ? "Arrastra tu PDF aquí para empezar" : "Drop your PDF here to start"}
                        </h3>
                        <p className="text-cyan-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                          {isEs ? "O haz clic para explorar" : "Or click to browse"}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-8 py-3.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all mt-1 cursor-pointer border border-cyan-300/40">
                        <FilePlus className="w-4 h-4 text-slate-950" /> {isEs ? "Subir Archivo" : "Upload File"}
                      </button>

                      {/* LEYENDA DE PRIVACIDAD DENTRO DEL CUADRO DE CARGA */}
                      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-extrabold mt-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}</span>
                      </div>
                    </div>
                  ) : (
                    /* VISOR DEL PDF: Conserva el fondo cian, el borde de 2px y la luz neón de la caja original */
                    <div className="w-full h-full bg-cyan-950/20 hover:bg-cyan-950/30 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all duration-300 flex flex-col relative min-h-[440px]">
                      <div className="bg-cyan-950/80 backdrop-blur-xl border-b border-cyan-500/30 p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/40 flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                            <FileText className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-extrabold text-xs truncate w-32 sm:w-48">{file.name}</span>
                            <span className="text-cyan-400 font-semibold text-[10px]">{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>100% Local</span>
                          </div>
                          <button 
                            onClick={handleRemoveFile} 
                            className="flex-shrink-0 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 cursor-pointer"
                            title={isEs ? "Quitar archivo" : "Remove file"}
                          >
                            <X className="w-4 h-4 hover:rotate-90 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="w-full flex-1 bg-[#0a0a0a]/90 relative pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-black/5 z-10"></div>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[75%] aspect-[1/1.414]">
                          <iframe 
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                            className="w-full h-full border-none bg-white shadow-2xl rounded-md" 
                            scrolling="no"
                            title="PDF Preview" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LADO DERECHO: Botones de herramientas */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {file && (
                    <div className="mb-3 flex items-center gap-2.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/40 px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse">
                      <Zap className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        {isEs ? '¡Archivo listo! Selecciona una opción para empezar:' : 'File ready! Select an option to start:'}
                      </h3>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                    {categories.map((cat, index) => (
                      <Link key={cat.id} href={cat.path} className="outline-none group">
                        <motion.div 
                          animate={file ? {
                            scale: [1, 1.03, 1],
                            boxShadow: [
                              cat.shadowColorValue,
                              cat.peakShadowValue,
                              cat.shadowColorValue
                            ],
                            borderColor: [
                              cat.borderColorValue,
                              cat.peakBorderValue,
                              cat.borderColorValue
                            ]
                          } : {}}
                          transition={file ? {
                            repeat: Infinity,
                            duration: 1.6,
                            delay: index * 0.4,
                            ease: "easeInOut"
                          } : {}}
                          className={`bg-white/[0.02] backdrop-blur-2xl border ${cat.borderColor} ${cat.shadowColor} rounded-3xl p-7 lg:p-8 transition-all duration-500 h-full min-h-[265px] flex flex-col justify-between relative overflow-hidden ${cat.hoverGlow}`}
                        >
                          <div>
                            <div className="mb-4 flex items-center justify-between">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all"></div>
                                <div className={`relative bg-black/50 border ${cat.borderColor} p-3 rounded-xl w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                                  <cat.icon className={`w-7 h-7 ${cat.color} drop-shadow-[0_0_8px_currentColor]`} />
                                </div>
                              </div>
                              {cat.badgeEs && (
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-sm ${cat.badgeStyle}`}>
                                  {isEs ? cat.badgeEs : cat.badgeEn}
                                </span>
                              )}
                            </div>
                            <h2 className="text-lg font-extrabold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">{isEs ? cat.titleEs : cat.titleEn}</h2>
                            <p className="text-xs text-gray-400 leading-relaxed">{isEs ? cat.descEs : cat.descEn}</p>
                          </div>
                          <div className={`mt-4 ${file ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'} transition-all duration-300`}>
                            <span className="text-xs font-black text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                              {file 
                                ? (isEs ? '¡Haz clic para iniciar aquí!' : 'Click to start here!') 
                                : (isEs ? 'Explorar' : 'Explore')}{' '}
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECCIÓN: 4 PASOS VISUALES (Ancho Completo sin título redundante) */}
              {!file && (
                <div className="w-full mt-10 pt-8 border-t border-white/5 flex flex-col items-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    {/* PASO 1 */}
                    <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] group">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-110 transition-transform">
                        1
                      </div>
                      <h4 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-1.5">
                        📁 {isEs ? '1. Sube tu PDF' : '1. Upload your PDF'}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {isEs 
                          ? 'Arrastra o selecciona tu archivo PDF en el recuadro principal.' 
                          : 'Drag or select your PDF file in the main dropzone box.'}
                      </p>
                    </div>

                    {/* PASO 2 */}
                    <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(59,130,246,0.25)] group-hover:scale-110 transition-transform">
                        2
                      </div>
                      <h4 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-1.5">
                        ⚡ {isEs ? '2. Elige la categoría' : '2. Choose category'}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {isEs 
                          ? 'Haz clic en uno de los 4 botones: Editar, Organizar, Convertir u Optimizar.' 
                          : 'Click one of the 4 main buttons: Edit, Organize, Convert, or Optimize.'}
                      </p>
                    </div>

                    {/* PASO 3 */}
                    <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-110 transition-transform">
                        3
                      </div>
                      <h4 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-1.5">
                        🛠️ {isEs ? '3. Usa la herramienta' : '3. Use the tool'}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {isEs 
                          ? 'En la página especializada, elige la función exacta (Unir, Dividir, Foliar, etc.).' 
                          : 'On the specialized page, select the exact function (Merge, Split, Page numbers, etc.).'}
                      </p>
                    </div>

                    {/* PASO 4 */}
                    <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] group">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-black text-lg mb-3 shadow-[0_0_15px_rgba(168,85,247,0.25)] group-hover:scale-110 transition-transform">
                        4
                      </div>
                      <h4 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-1.5">
                        ⬇️ {isEs ? '4. Descarga lista' : '4. Instant download'}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {isEs 
                          ? 'Obtén tu documento final 100% procesado de forma local en tu navegador.' 
                          : 'Get your final document 100% processed locally in your browser.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ESTADO 2: CARGANDO */}
          {isUploading && (
            <motion.div key="uploading-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full bg-black/60 border border-cyan-500/30 rounded-3xl p-12 shadow-[0_0_40px_rgba(6,182,212,0.15)] mt-10 relative z-[50]">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2">Cargando documento...</h3>
                  <span className="text-cyan-400 font-bold text-3xl tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full relative" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear", duration: 0.1 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLA DE ARCHIVOS RECIENTES (Con separación amplia respecto a "Cómo Funciona") */}
        <div className="relative z-10 mt-12 sm:mt-16">
          <div className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl mb-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-cyan-400" /> {isEs ? 'Archivos Recientes' : 'Recent Files'}
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder={isEs ? "Buscar archivos..." : "Search files..."} className="w-full bg-black/50 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
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
                  <TableRow name="CAO_Presupuesto_Final.pdf" size="2.4 MB" action={isEs ? "Convertido a Excel" : "Converted to Excel"} status={isEs ? "Completado" : "Completed"} icon={FileText} color="text-blue-400" />
                  <TableRow name="Planos_Estructurales_v2.pdf" size="15.1 MB" action={isEs ? "Comprimido (-45%)" : "Compressed (-45%)"} status={isEs ? "Completado" : "Completed"} icon={FileArchive} color="text-amber-400" />
                  <TableRow name="Contrato_Firmado.pdf" size="840 KB" action={isEs ? "Protegido (AES-256)" : "Protected (AES-256)"} status={isEs ? "Completado" : "Completed"} icon={ShieldCheck} color="text-emerald-400" />
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ASISTENTE IA */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="mb-4 w-80 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-sm">{isEs ? 'Asistente PDFBlack' : 'PDFBlack Assistant'}</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
              <div className="p-4 h-48 flex flex-col justify-end bg-black/50">
                <div className="bg-white/10 p-3 rounded-xl rounded-bl-none w-[85%] mb-2">
                  <p className="text-xs text-gray-200">{isEs ? '¡Hola! Todo el procesamiento es local. ¿Qué necesitas hacer hoy?' : 'Hello! All processing is local. What do you need to do today?'}</p>
                </div>
              </div>
              <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
                <input type="text" placeholder={isEs ? "Escribe tu consulta..." : "Type your query..."} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative group">
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black border border-white/10 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isEs ? 'Asistente IA' : 'AI Assistant'}
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsAiOpen(!isAiOpen)} className="bg-cyan-500 hover:bg-cyan-400 text-black p-3.5 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-colors flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

    </div>
  );
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