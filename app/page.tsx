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
    icon: Edit3, path: '/editar', color: 'text-blue-400',
    glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] group-hover:border-blue-400/60'
  },
  {
    id: 'organizar', titleEs: 'Organizar PDF', titleEn: 'Organize PDF',
    descEs: 'Une múltiples archivos, divide páginas, extrae secciones o reordena tu documento.',
    descEn: 'Merge multiple files, split pages, extract sections, or reorder your document.',
    icon: FolderOpen, path: '/organizar', color: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:border-emerald-500/50'
  },
  {
    id: 'convertir', titleEs: 'Convertir PDF', titleEn: 'Convert PDF',
    descEs: 'Transforma, extrae texto o convierte a formatos editables como Word, Excel o JPG.',
    descEn: 'Transform, extract text, or convert to editable formats like Word, Excel, or JPG.',
    icon: RefreshCw, path: '/convertir', color: 'text-orange-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] group-hover:border-orange-500/50'
  },
  {
    id: 'optimizar', titleEs: 'Optimizar PDF', titleEn: 'Optimize PDF',
    descEs: 'Comprime el tamaño de tus archivos pesados sin perder calidad visual para compartirlos.',
    descEn: 'Compress heavy files without losing visual quality for fast and easy sharing.',
    icon: Zap, path: '/optimizar', color: 'text-purple-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] group-hover:border-purple-500/50'
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
      className={`w-full px-4 sm:px-6 lg:px-8 pb-12 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#030712] transition-all duration-700 ${file ? 'pt-8' : 'pt-24'}`}
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
          
          {/* ESTADO 1: INICIO NORMAL */}
          {!file && !isUploading && (
            <motion.div key="home-view" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="relative z-10">
              <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F4F4F5] tracking-tight drop-shadow-lg mb-3 leading-[1.15] text-balance antialiased">
                    {isEs ? 'Herramientas PDF gratuitas, ' : 'Completely free PDF tools, '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                      {isEs ? 'sin tarjeta, sin registro.' : 'no credit card, no sign-up.'}
                    </span>
                  </h1>
                  <p className="text-gray-400 text-sm md:text-base flex items-center gap-2 justify-center md:justify-start">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> {isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-10">
                <KpiPill icon={FileText} title={isEs ? "Procesados" : "Processed"} value={12} color="text-blue-400" />
                <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={1.2} decimals={1} suffix=" GB" color="text-emerald-400" />
                <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={45} suffix=" min" color="text-orange-400" />
                
                {/* CÁPSULA RESTAURADA: Motor Local Activo */}
                <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full shadow-[inset_0_1px_0_rgba(6,182,212,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    {isEs ? 'Motor Local Activo' : 'Local Engine Active'}
                  </span>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-12 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-cyan-500/50 border-dashed rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              >
                <div className="bg-cyan-500/10 p-4 rounded-full group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                  <UploadCloud className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white mb-1">{isEs ? "Arrastra tu PDF aquí para empezar" : "Drop your PDF here to start"}</h3>
                  <p className="text-gray-400 text-sm">{isEs ? "O haz clic para explorar. Procesamiento 100% local." : "Or click to browse. 100% local processing."}</p>
                </div>
                <button className="hidden sm:flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors ml-auto">
                  <FilePlus className="w-4 h-4" /> {isEs ? "Subir Archivo" : "Upload File"}
                </button>
              </div>

              <div className="mb-5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-gray-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">{isEs ? 'Inicio Rápido' : 'Quick Start'}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {categories.map((cat, index) => {
                  const isFirst = index === 0;
                  const defaultStyles = isFirst 
                    ? 'border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.15)]' 
                    : 'border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

                  return (
                    <Link key={cat.id} href={cat.path} className="outline-none group">
                      <div className={`bg-white/[0.02] backdrop-blur-2xl border rounded-3xl p-8 transition-all duration-500 h-full min-h-[240px] flex flex-col justify-between ${defaultStyles} ${cat.glow}`}>
                        <div>
                          <div className="mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all"></div>
                            <div className={`relative bg-black/50 border p-3.5 rounded-xl w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ${isFirst ? 'border-blue-500/30' : 'border-white/10'}`}>
                              <cat.icon className={`w-8 h-8 ${cat.color} drop-shadow-[0_0_8px_currentColor]`} />
                            </div>
                          </div>
                          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{isEs ? cat.titleEs : cat.titleEn}</h2>
                          <p className="text-sm text-gray-400 leading-relaxed">{isEs ? cat.descEs : cat.descEn}</p>
                        </div>
                        <div className="mt-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <span className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                            {isEs ? 'Explorar' : 'Explore'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
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

          {/* ESTADO 3: VISOR EN MINIATURA Y BOTONES */}
          {file && pdfUrl && !isUploading && (
            <motion.div key="preview-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col items-center relative z-[50]">
              
              {/* VISOR DEL PDF (Formato Miniatura Vertical) */}
              <div className="w-48 sm:w-56 bg-white/[0.02] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] mb-6 flex flex-col relative group">
                <div className="bg-cyan-950/60 backdrop-blur-xl border-b border-cyan-500/30 p-2 flex justify-between items-center z-10">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-cyan-500/20 p-1.5 rounded-lg border border-cyan-500/30 flex-shrink-0">
                      <FileText className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-white font-bold text-[10px] truncate w-20 sm:w-28">{file.name}</span>
                      <span className="text-cyan-400/80 text-[8px] font-medium">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemoveFile} 
                    className="flex-shrink-0 p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all duration-300"
                    title={isEs ? "Quitar archivo" : "Remove file"}
                  >
                    <X className="w-3 h-3 hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
                <div className="w-full aspect-[1/1.4] bg-[#0a0a0a] relative pointer-events-none">
                  <div className="absolute inset-0 bg-black/5 z-10"></div>
                  <iframe 
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                    className="w-full h-full border-none" 
                    title="PDF Preview" 
                  />
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-cyan-400 fill-cyan-400/20" />
                <h3 className="text-lg font-bold uppercase tracking-widest text-cyan-400">
                  {isEs ? '¿Qué deseas hacer con este archivo?' : 'What do you want to do with this file?'}
                </h3>
              </motion.div>

              {/* TARJETAS CON EL DISEÑO ORIGINAL EXACTO */}
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-16">
                {categories.map((cat, index) => {
                  const isFirst = index === 0;
                  const defaultStyles = isFirst 
                    ? 'border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.15)]' 
                    : 'border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

                  return (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <Link href={cat.path} className="outline-none group block h-full">
                        <div className={`bg-white/[0.02] backdrop-blur-2xl border rounded-3xl p-8 transition-all duration-500 h-full min-h-[240px] flex flex-col justify-between ${defaultStyles} ${cat.glow}`}>
                          <div>
                            <div className="mb-6 relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all"></div>
                              <div className={`relative bg-black/50 border p-3.5 rounded-xl w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ${isFirst ? 'border-blue-500/30' : 'border-white/10'}`}>
                                <cat.icon className={`w-8 h-8 ${cat.color} drop-shadow-[0_0_8px_currentColor]`} />
                              </div>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{isEs ? cat.titleEs : cat.titleEn}</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">{isEs ? cat.descEs : cat.descEn}</p>
                          </div>
                          <div className="mt-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            <span className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                              {isEs ? 'Usar archivo aquí' : 'Use file here'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLA DE ARCHIVOS RECIENTES */}
        <div className="relative z-10">
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

function KpiPill({ icon: Icon, title, value, decimals, suffix, color }: any) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-full hover:bg-white/[0.04] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-sm font-bold text-white">
        <AnimatedCounter to={value} decimals={decimals} suffix={suffix} />
      </span>
      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{title}</span>
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