'use client';

import { useFileStore } from '../store/useFileStore';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, animate, type Variants } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, Edit3, RefreshCw, Zap, FolderOpen, 
  FileText, Clock, HardDrive, Sparkles, X, ArrowRight, UploadCloud, FilePlus,
  Search, FileArchive, Bot, CheckCircle2, Star, Eye, Download, Trash2
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
    id: 'editar', index: '01', titleEs: 'EDITAR PDF', titleEn: 'EDIT PDF',
    descEs: 'Herramientas de edición visual directa sobre tu documento PDF:',
    descEn: 'Direct visual editing tools on your PDF document:',
    toolsListEs: ['1. Añadir Texto', '2. Firmar PDF', '3. Numerar Páginas', '4. Marca de Agua', '5. Dibujar / Anotar', '6. Formas y Figuras'],
    toolsListEn: ['1. Add Text', '2. Sign PDF', '3. Number Pages', '4. Watermark', '5. Draw / Annotate', '6. Shapes & Figures'],
    badgeEs: 'EL MÁS USADO', badgeEn: 'MOST USED',
    icon: Edit3, path: '/editar', color: 'text-[#ff4d00]',
    borderColor: 'border-[#fff0e6]/20',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-[#ff4d00]',
    shadowColorValue: '0 0 15px rgba(255,77,0,0.2)',
    peakShadowValue: '0 0 35px rgba(255,77,0,0.8)',
    borderColorValue: 'rgba(255,77,0,0.4)',
    peakBorderValue: 'rgba(255,77,0,1)'
  },
  {
    id: 'organizar', index: '02', titleEs: 'ORGANIZAR PDF', titleEn: 'ORGANIZE PDF',
    descEs: 'Herramientas de organización de páginas y documentos:',
    descEn: 'Document and page organization tools:',
    toolsListEs: ['1. Unir PDF', '2. Dividir PDF', '3. Eliminar Páginas', '4. Reordenar PDF', '5. Rotar PDF', '6. Recortar PDF'],
    toolsListEn: ['1. Merge PDF', '2. Split PDF', '3. Delete Pages', '4. Reorder PDF', '5. Rotate PDF', '6. Crop PDF'],
    badgeEs: 'INDISPENSABLE', badgeEn: 'ESSENTIAL',
    icon: FolderOpen, path: '/organizar', color: 'text-[#ff4d00]',
    borderColor: 'border-[#fff0e6]/20',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-[#ff4d00]',
    shadowColorValue: '0 0 15px rgba(255,77,0,0.2)',
    peakShadowValue: '0 0 35px rgba(255,77,0,0.8)',
    borderColorValue: 'rgba(255,77,0,0.4)',
    peakBorderValue: 'rgba(255,77,0,1)'
  },
  {
    id: 'convertir', index: '03', titleEs: 'CONVERTIR PDF', titleEn: 'CONVERT PDF',
    descEs: 'Conversiones bidireccionales entre PDF y múltiples formatos:',
    descEn: 'Bidirectional conversion between PDF and formats:',
    toolsListEs: ['1. PDF ↔ Word', '2. PDF ↔ Excel', '3. PDF ↔ PowerPoint', '4. PDF ↔ JPG', '5. PDF ↔ HTML', '6. PDF ↔ Texto'],
    toolsListEn: ['1. PDF ↔ Word', '2. PDF ↔ Excel', '3. PDF ↔ PowerPoint', '4. PDF ↔ JPG', '5. PDF ↔ HTML', '6. PDF ↔ Text'],
    badgeEs: 'ALTA PRECISIÓN', badgeEn: 'HIGH PRECISION',
    icon: RefreshCw, path: '/convertir', color: 'text-[#ff4d00]',
    borderColor: 'border-[#fff0e6]/20',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-[#ff4d00]',
    shadowColorValue: '0 0 15px rgba(255,77,0,0.2)',
    peakShadowValue: '0 0 35px rgba(255,77,0,0.8)',
    borderColorValue: 'rgba(255,77,0,0.4)',
    peakBorderValue: 'rgba(255,77,0,1)'
  },
  {
    id: 'optimizar', index: '04', titleEs: 'OPTIMIZAR PDF', titleEn: 'OPTIMIZE PDF',
    descEs: 'Herramientas de optimización, seguridad y reparación:',
    descEn: 'Optimization, security, and repair tools:',
    toolsListEs: ['1. Comprimir PDF', '2. Reparar PDF', '3. Desbloquear PDF', '4. Proteger PDF', '5. Censurar PDF', '6. Comparar PDF'],
    toolsListEn: ['1. Compress PDF', '2. Repair PDF', '3. Unlock PDF', '4. Protect PDF', '5. Redact PDF', '6. Compare PDF'],
    badgeEs: 'REDUCE 90%', badgeEn: 'SAVE 90%',
    icon: Zap, path: '/optimizar', color: 'text-[#ff4d00]',
    borderColor: 'border-[#fff0e6]/20',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-[#ff4d00]',
    shadowColorValue: '0 0 15px rgba(255,77,0,0.2)',
    peakShadowValue: '0 0 35px rgba(255,77,0,0.8)',
    borderColorValue: 'rgba(255,77,0,0.4)',
    peakBorderValue: 'rgba(255,77,0,1)'
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
              {/* FILA 1: TÍTULO PRINCIPAL NEO-BRUTALIST */}
              <div className="mb-6 text-center md:text-left">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#fff0e6] tracking-tight uppercase leading-none antialiased">
                  {isEs ? 'HERRAMIENTAS PDF DE ALTO NIVEL, ' : 'HIGH-PERFORMANCE PDF TOOLS, '}
                  <span className="text-[#ff4d00]">
                    {isEs ? 'SIN REGISTRO.' : 'NO SIGN-UP.'}
                  </span>
                </h1>
                <p className="text-[#fff0e6]/60 text-xs sm:text-sm font-semibold uppercase tracking-widest mt-3">
                  {isEs ? 'DISEÑADO PARA PROCESAR DOCUMENTOS 100% LOCALMENTE EN TU NAVEGADOR' : 'BUILT TO PROCESS DOCUMENTS 100% LOCALLY IN YOUR BROWSER'}
                </p>
              </div>

              {/* FILA 2: ESTADÍSTICAS KPI */}
              <div className="flex flex-wrap items-center justify-start gap-3 mb-8 mt-5">
                <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={12} tooltip={isEs ? "Tus archivos procesados esta semana" : "Files processed this week"} color="text-[#ff4d00]" />
                <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={1.2} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-[#fff0e6]" />
                <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={45} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-[#ff4d00]" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
                
                {/* LADO IZQUIERDO: Smart Upload o Visor del PDF */}
                <div className="lg:col-span-5 flex flex-col h-full">
                  {!file ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex-1 h-full min-h-[500px] bg-[#0a0400] border border-[#fff0e6]/20 hover:border-[#ff4d00] p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-xl"
                    >
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="bg-[#ff4d00]/10 p-7 rounded-none border border-[#ff4d00]/40 group-hover:scale-110 group-hover:bg-[#ff4d00] transition-all duration-300"
                      >
                        <UploadCloud className="w-16 h-16 text-[#ff4d00] group-hover:text-[#0a0400] transition-colors" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-2">
                        <h3 className="text-xl lg:text-2xl font-black text-[#fff0e6] uppercase tracking-wider group-hover:text-[#ff4d00] transition-colors">
                          {isEs ? "ARRASTRA TU PDF AQUÍ PARA EMPEZAR" : "DROP YOUR PDF HERE TO START"}
                        </h3>
                        <p className="text-[#fff0e6]/60 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
                          {isEs ? "O HAZ CLIC PARA EXPLORAR ARCHIVOS" : "OR CLICK TO BROWSE FILES"}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2.5 bg-[#ff4d00] hover:bg-[#fff0e6] text-[#fff0e6] hover:text-[#0a0400] px-8 py-3.5 font-black text-xs uppercase tracking-widest transition-all mt-2 cursor-pointer border border-[#ff4d00]">
                        <FilePlus className="w-4 h-4" /> {isEs ? "SUBIR ARCHIVO" : "UPLOAD FILE"}
                      </button>

                      {/* LEYENDA DE PRIVACIDAD DENTRO DEL CUADRO DE CARGA */}
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] text-xs font-black uppercase tracking-wider mt-2">
                        <ShieldCheck className="w-4 h-4 text-[#ff4d00]" />
                        <span>{isEs ? 'PRIVACIDAD ABSOLUTA • 100% LOCAL' : 'ABSOLUTE PRIVACY • 100% LOCAL'}</span>
                      </div>
                    </div>
                  ) : (
                    /* VISOR DEL PDF */
                    <div className="w-full flex-1 h-full min-h-[500px] bg-[#0a0400] border border-[#ff4d00]/50 overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative">
                      <div className="bg-[#0a0400] border-b border-[#fff0e6]/15 p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-[#ff4d00]/20 p-2 border border-[#ff4d00]/40 flex-shrink-0">
                            <FileText className="w-4 h-4 text-[#ff4d00]" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[#fff0e6] font-black text-xs uppercase tracking-wider truncate w-32 sm:w-48">{file.name}</span>
                            <span className="text-[#ff4d00] font-black text-[10px] uppercase">{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] text-[10px] font-black uppercase">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#ff4d00]" />
                            <span>100% LOCAL</span>
                          </div>
                          <button 
                            onClick={handleRemoveFile} 
                            className="flex-shrink-0 p-2 bg-[#ff4d00]/10 hover:bg-[#ff4d00] text-[#ff4d00] hover:text-[#0a0400] border border-[#ff4d00]/30 transition-all duration-300 cursor-pointer"
                            title={isEs ? "Quitar archivo" : "Remove file"}
                          >
                            <X className="w-4 h-4 hover:rotate-90 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="w-full flex-1 bg-[#0a0400] relative pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-black/5 z-10"></div>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[75%] aspect-[1/1.414]">
                          <iframe 
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                            className="w-full h-full border-none bg-white shadow-2xl rounded-none" 
                            scrolling="no"
                            title="PDF Preview" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LADO DERECHO: Categorías con Inversión Hover & Índices 01-04 */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {file && (
                    <div className="mb-3 flex items-center gap-2.5 bg-[#ff4d00] text-[#0a0400] border border-[#ff4d00] px-4 py-2.5 shadow-xl animate-pulse">
                      <Zap className="w-5 h-5 text-[#0a0400]" />
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest">
                        {isEs ? '¡ARCHIVO LISTO! SELECCIONA UNA OPCIÓN PARA EMPEZAR:' : 'FILE READY! SELECT AN OPTION TO START:'}
                      </h3>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                    {categories.map((cat, index) => (
                      <Link key={cat.id} href={cat.path} className="outline-none group">
                        <motion.div 
                          className={`bg-[#0a0400] border border-[#fff0e6]/20 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] p-6 lg:p-7 transition-all duration-300 h-full min-h-[295px] flex flex-col justify-between relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(255,77,0,0.3)]`}
                        >
                          <div>
                            <div className="mb-4 flex items-center justify-between">
                              <span className="text-2xl font-black text-[#ff4d00] group-hover:text-[#0a0400] transition-colors tracking-tighter">
                                {cat.index}
                              </span>
                              {cat.badgeEs && (
                                <span className="px-2.5 py-1 text-[10px] font-black uppercase border border-[#fff0e6]/20 group-hover:border-[#0a0400] bg-[#fff0e6]/10 text-[#fff0e6] group-hover:bg-[#0a0400] group-hover:text-[#fff0e6] transition-colors">
                                  {isEs ? cat.badgeEs : cat.badgeEn}
                                </span>
                              )}
                            </div>

                            <h2 className="text-xl font-black text-[#fff0e6] uppercase tracking-wider mb-2 group-hover:text-[#0a0400] transition-colors">
                              {isEs ? cat.titleEs : cat.titleEn}
                            </h2>

                            <p className="text-xs text-[#fff0e6]/70 group-hover:text-[#0a0400]/90 mb-4 font-semibold leading-relaxed transition-colors">
                              {isEs ? cat.descEs : cat.descEn}
                            </p>

                            {/* LISTA DE 6 HERRAMIENTAS EN LA TARJETA */}
                            <div className="grid grid-cols-2 gap-1.5 mb-2">
                              {(isEs ? cat.toolsListEs : cat.toolsListEn).map((toolName, tIdx) => (
                                <div key={tIdx} className="bg-[#fff0e6]/5 border border-[#fff0e6]/15 group-hover:bg-[#0a0400]/20 group-hover:border-[#0a0400]/40 px-2 py-1 text-[10px] font-black uppercase text-[#fff0e6] group-hover:text-[#0a0400] transition-colors truncate">
                                  <span className="truncate">{toolName}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#fff0e6]/15 group-hover:border-[#0a0400]/30 transition-colors">
                            <span className="text-xs font-black uppercase tracking-wider text-[#ff4d00] group-hover:text-[#0a0400] flex items-center justify-between transition-colors">
                              <span>
                                {file 
                                  ? (isEs ? '¡INICIAR AQUÍ!' : 'START HERE!') 
                                  : (isEs ? 'EXPLORAR HERRAMIENTAS' : 'EXPLORE TOOLS')}
                              </span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECCIÓN: 4 PASOS VISUALES NEO-BRUTALIST */}
              {!file && (
                <div className="w-full mt-12 pt-10 border-t border-[#fff0e6]/15 flex flex-col items-center">
                  <div className="text-center mb-8 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] text-xs font-black tracking-widest uppercase mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isEs ? "¿CÓMO FUNCIONA THE NC-PDF?" : "HOW THE NC-PDF WORKS"}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-[#fff0e6] uppercase tracking-tight mb-2">
                      {isEs ? "PROCESA TUS ARCHIVOS EN 4 PASOS" : "PROCESS YOUR FILES IN 4 STEPS"}
                    </h2>
                    <p className="text-[#fff0e6]/70 text-xs sm:text-sm font-semibold uppercase tracking-wider leading-relaxed">
                      {isEs 
                        ? "Nuestra plataforma trabaja 100% local en tu navegador. Tus documentos nunca salen de tu equipo, garantizando máxima velocidad y privacidad absoluta."
                        : "Our platform works 100% locally in your browser. Your documents never leave your device, ensuring maximum speed and absolute privacy."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    {/* PASO 1 */}
                    <div className="flex flex-col items-center text-center p-6 bg-[#0a0400] border border-[#fff0e6]/20 hover:border-[#ff4d00] transition-all group">
                      <div className="w-12 h-12 bg-[#ff4d00] text-[#0a0400] font-black text-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        01
                      </div>
                      <h4 className="text-sm font-black uppercase text-[#fff0e6] mb-2 tracking-wider">
                        {isEs ? "1. SUBE TU PDF" : "1. UPLOAD PDF"}
                      </h4>
                      <p className="text-xs text-[#fff0e6]/60 font-semibold leading-relaxed uppercase">
                        {isEs ? "Arrastra tu archivo PDF al área de carga." : "Drag your PDF file into the upload dropzone."}
                      </p>
                    </div>

                    {/* PASO 2 */}
                    <div className="flex flex-col items-center text-center p-6 bg-[#0a0400] border border-[#fff0e6]/20 hover:border-[#ff4d00] transition-all group">
                      <div className="w-12 h-12 bg-[#ff4d00] text-[#0a0400] font-black text-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        02
                      </div>
                      <h4 className="text-sm font-black uppercase text-[#fff0e6] mb-2 tracking-wider">
                        {isEs ? "2. ELIGE LA HERRAMIENTA" : "2. SELECT TOOL"}
                      </h4>
                      <p className="text-xs text-[#fff0e6]/60 font-semibold leading-relaxed uppercase">
                        {isEs ? "Selecciona la acción requerida de la cuadrícula." : "Select the required action from the grid."}
                      </p>
                    </div>

                    {/* PASO 3 */}
                    <div className="flex flex-col items-center text-center p-6 bg-[#0a0400] border border-[#fff0e6]/20 hover:border-[#ff4d00] transition-all group">
                      <div className="w-12 h-12 bg-[#ff4d00] text-[#0a0400] font-black text-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        03
                      </div>
                      <h4 className="text-sm font-black uppercase text-[#fff0e6] mb-2 tracking-wider">
                        {isEs ? "3. PROCESA AL INSTANTE" : "3. INSTANT PROCESS"}
                      </h4>
                      <p className="text-xs text-[#fff0e6]/60 font-semibold leading-relaxed uppercase">
                        {isEs ? "Visualiza y edita los cambios de inmediato." : "Preview and edit changes immediately."}
                      </p>
                    </div>

                    {/* PASO 4 */}
                    <div className="flex flex-col items-center text-center p-6 bg-[#0a0400] border border-[#fff0e6]/20 hover:border-[#ff4d00] transition-all group">
                      <div className="w-12 h-12 bg-[#ff4d00] text-[#0a0400] font-black text-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        04
                      </div>
                      <h4 className="text-sm font-black uppercase text-[#fff0e6] mb-2 tracking-wider">
                        {isEs ? "4. DESCARGA TU PDF" : "4. DOWNLOAD PDF"}
                      </h4>
                      <p className="text-xs text-[#fff0e6]/60 font-semibold leading-relaxed uppercase">
                        {isEs ? "Obtén tu documento final 100% procesado." : "Get your 100% processed final document."}
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