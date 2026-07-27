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
    id: 'editar', index: '001 / Direct visual editing', titleEs: 'Editar PDF', titleEn: 'Edit PDF',
    descEs: 'Edición directa de texto, firmas digitales, folios correlativos y marcas de agua sobre el documento.',
    descEn: 'Direct text editing, digital signatures, page numbering, and watermarks.',
    toolsListEs: ['1. Añadir Texto', '2. Firmar PDF', '3. Numerar Páginas', '4. Marca de Agua', '5. Dibujar / Anotar', '6. Formas y Figuras'],
    toolsListEn: ['1. Add Text', '2. Sign PDF', '3. Number Pages', '4. Watermark', '5. Draw / Annotate', '6. Shapes & Figures'],
    badgeEs: 'MÁS USADO', badgeEn: 'MOST USED',
    icon: Edit3, path: '/editar', color: 'text-white',
    borderColor: 'border-white/10 hover:border-white/40',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-white/40',
    shadowColorValue: '0 0 15px rgba(255,255,255,0.05)',
    peakShadowValue: '0 0 35px rgba(255,255,255,0.15)',
    borderColorValue: 'rgba(255,255,255,0.1)',
    peakBorderValue: 'rgba(255,255,255,0.4)'
  },
  {
    id: 'organizar', index: '002 / Structure & page builder', titleEs: 'Organizar PDF', titleEn: 'Organize PDF',
    descEs: 'Gestión completa de estructura: unir múltiples archivos, dividir por rangos, rotar y recortar.',
    descEn: 'Full structure management: merge multiple files, split by range, rotate and crop.',
    toolsListEs: ['1. Unir PDF', '2. Dividir PDF', '3. Eliminar Páginas', '4. Reordenar PDF', '5. Rotar PDF', '6. Recortar PDF'],
    toolsListEn: ['1. Merge PDF', '2. Split PDF', '3. Delete Pages', '4. Reorder PDF', '5. Rotate PDF', '6. Crop PDF'],
    badgeEs: 'INDISPENSABLE', badgeEn: 'ESSENTIAL',
    icon: FolderOpen, path: '/organizar', color: 'text-white',
    borderColor: 'border-white/10 hover:border-white/40',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-white/40',
    shadowColorValue: '0 0 15px rgba(255,255,255,0.05)',
    peakShadowValue: '0 0 35px rgba(255,255,255,0.15)',
    borderColorValue: 'rgba(255,255,255,0.1)',
    peakBorderValue: 'rgba(255,255,255,0.4)'
  },
  {
    id: 'convertir', index: '003 / High precision conversion', titleEs: 'Convertir PDF', titleEn: 'Convert PDF',
    descEs: 'Conversión bidireccional de alta precisión entre PDF y formatos Word, Excel, PowerPoint e imágenes.',
    descEn: 'High-precision bidirectional conversion between PDF and Word, Excel, PowerPoint, and images.',
    toolsListEs: ['1. PDF ↔ Word', '2. PDF ↔ Excel', '3. PDF ↔ PowerPoint', '4. PDF ↔ JPG', '5. PDF ↔ HTML', '6. PDF ↔ Texto'],
    toolsListEn: ['1. PDF ↔ Word', '2. PDF ↔ Excel', '3. PDF ↔ PowerPoint', '4. PDF ↔ JPG', '5. PDF ↔ HTML', '6. PDF ↔ Text'],
    badgeEs: 'ALTA PRECISIÓN', badgeEn: 'HIGH PRECISION',
    icon: RefreshCw, path: '/convertir', color: 'text-white',
    borderColor: 'border-white/10 hover:border-white/40',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-white/40',
    shadowColorValue: '0 0 15px rgba(255,255,255,0.05)',
    peakShadowValue: '0 0 35px rgba(255,255,255,0.15)',
    borderColorValue: 'rgba(255,255,255,0.1)',
    peakBorderValue: 'rgba(255,255,255,0.4)'
  },
  {
    id: 'optimizar', index: '004 / Local security & compression', titleEs: 'Optimizar PDF', titleEn: 'Optimize PDF',
    descEs: 'Algoritmos locales de compresión de tamaño, cifrado de seguridad, censura y reparación.',
    descEn: 'Local algorithms for size compression, security encryption, redaction, and repair.',
    toolsListEs: ['1. Comprimir PDF', '2. Reparar PDF', '3. Desbloquear PDF', '4. Proteger PDF', '5. Censurar PDF', '6. Comparar PDF'],
    toolsListEn: ['1. Compress PDF', '2. Repair PDF', '3. Unlock PDF', '4. Protect PDF', '5. Redact PDF', '6. Compare PDF'],
    badgeEs: 'REDUCE HASTA 90%', badgeEn: 'SAVE UP TO 90%',
    icon: Zap, path: '/optimizar', color: 'text-white',
    borderColor: 'border-white/10 hover:border-white/40',
    shadowColor: 'shadow-lg',
    hoverGlow: 'group-hover:border-white/40',
    shadowColorValue: '0 0 15px rgba(255,255,255,0.05)',
    peakShadowValue: '0 0 35px rgba(255,255,255,0.15)',
    borderColorValue: 'rgba(255,255,255,0.1)',
    peakBorderValue: 'rgba(255,255,255,0.4)'
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
      className={`w-full px-4 sm:px-6 lg:px-8 pb-10 flex flex-col items-center justify-start relative min-h-[calc(100vh-64px)] bg-[#09090b] transition-all duration-700 ${file ? 'pt-6' : 'pt-8 sm:pt-10'}`}
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
              {/* HERO CONTENT ARCHITECTURE STYLING */}
              <div className="mb-6 text-center md:text-left">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] antialiased">
                  {isEs ? 'Procesamiento PDF local. ' : 'Local PDF engine. '}
                  <span className="text-zinc-400 font-light">
                    {isEs ? 'Sin servidores, privacidad total.' : 'Zero servers, absolute privacy.'}
                  </span>
                </h1>
                
                {/* SUBTÍTULO RESUMIDO EN UNA SOLA LÍNEA */}
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-4 leading-normal truncate">
                  {isEs 
                    ? '100% Gratis • Sin tarjeta de crédito • Sin registro • Procesamiento 100% local en tu navegador.' 
                    : '100% Free • No credit card needed • No sign-up • 100% local browser engine.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
                
                {/* DROPZONE / FILE PREVIEW */}
                <div className="lg:col-span-5 flex flex-col h-full">
                  {!file ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex-1 h-full min-h-[480px] bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl relative overflow-hidden"
                    >
                      <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
                      >
                        <UploadCloud className="w-12 h-12 text-white" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-2">
                        <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight">
                          {isEs ? "Arrastra tu archivo PDF aquí" : "Drop your PDF file here"}
                        </h3>
                        <p className="text-zinc-400 text-xs font-mono flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                          {isEs ? "o haz clic para explorar en tu equipo" : "or click to browse local files"}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all mt-2 cursor-pointer shadow-md">
                        <FilePlus className="w-4 h-4 text-black" /> {isEs ? "Seleccionar PDF" : "Select PDF"}
                      </button>

                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isEs ? '100% GRATIS • SIN REGISTRO • SIN TARJETA' : '100% FREE • NO SIGN-UP • NO CREDIT CARD'}</span>
                      </div>
                    </div>
                  ) : (
                    /* VISOR DEL PDF */
                    <div className="w-full flex-1 h-full min-h-[480px] bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative">
                      <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center z-10 font-mono">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-white/10 p-2 border border-white/10 rounded-lg flex-shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{file.name}</span>
                            <span className="text-zinc-400 text-[10px]">{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>LOCAL</span>
                          </div>
                          <button 
                            onClick={handleRemoveFile} 
                            className="flex-shrink-0 p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-all cursor-pointer"
                            title={isEs ? "Quitar archivo" : "Remove file"}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="w-full flex-1 bg-[#09090b] relative pointer-events-none overflow-hidden">
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

                {/* TARJETAS DE MÓDULOS 001 - 004 */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {file && (
                    <div className="mb-3 flex items-center gap-2.5 bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl shadow-lg font-mono">
                      <Zap className="w-4 h-4 text-white" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        {isEs ? 'DOCUMENTO CARGADO. SELECCIONA EL MÓDULO A EJECUTAR:' : 'DOCUMENT LOADED. SELECT MODULE TO EXECUTE:'}
                      </h3>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                    {categories.map((cat, index) => (
                      <Link key={cat.id} href={cat.path} className="outline-none group">
                        <motion.div 
                          className={`bg-[#09090b] border border-white/10 group-hover:border-white/30 rounded-2xl p-6 transition-all duration-300 h-full min-h-[285px] flex flex-col justify-between relative overflow-hidden group-hover:bg-zinc-900/40`}
                        >
                          <div>
                            <div className="mb-3 flex items-center justify-between font-mono">
                              <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium">
                                {cat.index}
                              </span>
                              {cat.badgeEs && (
                                <span className="px-2 py-0.5 text-[9px] font-semibold border border-white/10 bg-zinc-900 text-zinc-400 rounded-full">
                                  {isEs ? cat.badgeEs : cat.badgeEn}
                                </span>
                              )}
                            </div>

                            <h2 className="text-lg font-bold text-white tracking-tight mb-2 group-hover:text-white transition-colors">
                              {isEs ? cat.titleEs : cat.titleEn}
                            </h2>

                            <p className="text-xs text-zinc-400 mb-4 font-normal leading-relaxed">
                              {isEs ? cat.descEs : cat.descEn}
                            </p>

                            {/* LISTA DE FUNCIONES DE CADA HERRAMIENTA */}
                            <div className="grid grid-cols-2 gap-1.5 mb-2 font-mono">
                              {(isEs ? cat.toolsListEs : cat.toolsListEn).map((toolName, tIdx) => (
                                <div key={tIdx} className="bg-zinc-900/80 border border-white/5 rounded-md px-2 py-1 text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                                  <span className="truncate">{toolName}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/10 font-mono">
                            <span className="text-xs text-white group-hover:text-zinc-200 flex items-center justify-between transition-colors">
                              <span>
                                {file 
                                  ? (isEs ? 'Iniciar módulo →' : 'Start module →') 
                                  : (isEs ? 'Explorar herramientas →' : 'Explore tools →')}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              {/* CÁPSULAS Y KPIS UBICADOS DEBAJO DE LA CAJA DE CARGA Y DE LOS 4 BOTONES PRINCIPALES */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 my-6 font-mono">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-zinc-300 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{isEs ? '001 / Arquitectura PDF local 100% gratuita' : '001 / 100% Free local PDF engine'}</span>
                </div>
                <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={12} tooltip={isEs ? "Tus archivos procesados esta semana" : "Files processed this week"} color="text-white" />
                <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={1.2} decimals={1} suffix=" GB" tooltip={isEs ? "Almacenamiento optimizado localmente" : "Locally optimized storage"} color="text-zinc-300" />
                <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={45} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-zinc-400" />
              </div>

              {/* SECCIÓN 4 PASOS STYLE CONTENT ARCHITECTURE */}
              {!file && (
                <div className="w-full mt-14 pt-12 border-t border-white/10 flex flex-col items-center font-mono">
                  <div className="text-center mb-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                      {isEs ? "000 / WORKFLOW_INGESTION" : "000 / WORKFLOW_INGESTION"}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2 font-sans">
                      {isEs ? "Procesamiento en 4 etapas locales" : "4-Stage local processing"}
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
                      {isEs 
                        ? "Garantía absoluta de privacidad. Tus documentos nunca salen de tu equipo ni tocan servidores."
                        : "Absolute privacy guarantee. Your documents never leave your device."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    {/* PASO 1 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">001 / INPUT</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "1. Ingesta de Archivo" : "1. File Ingestion"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs ? "Carga del buffer PDF en la memoria local." : "Load PDF buffer into local memory."}
                      </p>
                    </div>

                    {/* PASO 2 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">002 / MODULE</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "2. Selección de Módulo" : "2. Module Selection"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs ? "Elección del transformador requerido." : "Selection of the required transformer."}
                      </p>
                    </div>

                    {/* PASO 3 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">003 / TRANSFORM</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "3. Transformación WASM" : "3. WASM Transform"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs ? "Ejecución visual de cambios en vivo." : "Live visual execution of changes."}
                      </p>
                    </div>

                    {/* PASO 4 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">004 / EXPORT</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "4. Exportación Final" : "4. Final Export"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs ? "Descarga inmediata del PDF optimizado." : "Instant download of optimized PDF."}
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

        {/* TABLA DE ARCHIVOS RECIENTES */}
        <div className="relative z-10 mt-12 sm:mt-16 font-sans">
          <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
                  <span>005 /</span> {isEs ? 'ARCHIVOS RECIENTES' : 'RECENT FILES'}
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
                  <TableRow name="CAO_Presupuesto_Final.pdf" size="2.4 MB" action={isEs ? "Convertido a Excel" : "Converted to Excel"} status={isEs ? "Completado" : "Completed"} icon={FileText} />
                  <TableRow name="Planos_Estructurales_v2.pdf" size="15.1 MB" action={isEs ? "Comprimido (-45%)" : "Compressed (-45%)"} status={isEs ? "Completado" : "Completed"} icon={FileArchive} />
                  <TableRow name="Contrato_Firmado.pdf" size="840 KB" action={isEs ? "Protegido (AES-256)" : "Protected (AES-256)"} status={isEs ? "Completado" : "Completed"} icon={ShieldCheck} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

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
                  <span className="font-bold text-white text-xs tracking-wider">{isEs ? '006 / ASISTENTE LOCAL' : '006 / LOCAL ASSISTANT'}</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
              </div>
              <div className="p-4 h-44 flex flex-col justify-end bg-[#09090b]">
                <div className="bg-zinc-900 border border-white/10 p-3.5 rounded-xl rounded-bl-none w-[90%] mb-2">
                  <p className="text-xs text-zinc-300 font-sans">{isEs ? '¡Hola! Todo el procesamiento es local. ¿Qué necesitas transformar hoy?' : 'Hello! All processing is local. What do you need to transform today?'}</p>
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

function KpiPill({ icon: Icon, title, value, decimals, suffix, tooltip }: any) {
  return (
    <div className="relative group/kpi">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-full transition-all cursor-help font-mono">
        <Icon className="w-3.5 h-3.5 text-white" />
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

function TableRow({ name, size, action, status, icon: Icon }: any) {
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