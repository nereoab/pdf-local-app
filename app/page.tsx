'use client';

import { useFileStore } from '../store/useFileStore';
import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
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
    id: 'editar', indexEs: '001 / Edición visual directa', indexEn: '001 / Direct visual editing', titleEs: 'Editar PDF', titleEn: 'Edit PDF',
    descEs: 'Edición directa de texto, firmas digitales, folios correlativos y marcas de agua sobre el documento.',
    descEn: 'Direct text editing, digital signatures, page numbering, and watermarks.',
    toolsListEs: ['1. Editar Texto', '2. Foliar Páginas', '3. Poner Marca Agua', '4. Quitar Marca Agua', '5. Firmar PDF', '6. OCR PDF'],
    toolsListEn: ['1. Edit Text', '2. Page Numbers', '3. Add Watermark', '4. Remove Watermark', '5. Sign PDF', '6. OCR PDF'],
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
    id: 'organizar', indexEs: '002 / Estructura y organizador', indexEn: '002 / Structure & page builder', titleEs: 'Organizar PDF', titleEn: 'Organize PDF',
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
    id: 'convertir', indexEs: '003 / Conversión de alta precisión', indexEn: '003 / High precision conversion', titleEs: 'Convertir PDF', titleEn: 'Convert PDF',
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
    id: 'optimizar', indexEs: '004 / Seguridad local y compresión', indexEn: '004 / Local security & compression', titleEs: 'Optimizar PDF', titleEn: 'Optimize PDF',
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

export default function DashboardPage() {
  const { lang } = useLanguage();
  const emptySubscribe = () => () => {};
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const isEs = lang === 'es';

  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragCounter, setDragCounter] = useState(0); 
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <div className="w-full h-full max-w-5xl max-h-[80vh] border-2 border-white/30 border-dashed rounded-3xl flex flex-col items-center justify-center bg-zinc-900/60 pointer-events-none shadow-2xl">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <UploadCloud className="w-24 h-24 text-white mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center tracking-tight font-sans">
                {isEs ? "Suelta tu PDF en cualquier lugar" : "Drop your PDF anywhere"}
              </h2>
              <p className="text-zinc-400 text-sm font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                {isEs ? "Para cargar y empezar a trabajar al instante" : "To load and start working instantly"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMounted && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
          <motion.div animate={{ opacity: [0.02, 0.04, 0.02] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[5%] w-[80vw] h-[50vw] rounded-full bg-zinc-400 blur-[160px]" />
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
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[90%] aspect-[1/1.414]">
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
                    {categories.map((cat) => (
                      <Link key={cat.id} href={cat.path} className="outline-none group">
                        <motion.div 
                          className={`bg-[#09090b] border border-white/10 group-hover:border-white/30 rounded-2xl p-6 transition-all duration-300 h-full min-h-[285px] flex flex-col justify-between relative overflow-hidden group-hover:bg-zinc-900/40`}
                        >
                          <div>
                            <div className="mb-3 flex items-center justify-between font-mono">
                              <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium">
                                {isEs ? cat.indexEs : cat.indexEn}
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
                      {isEs ? "000 / ¿CÓMO FUNCIONA PDFBLACK?" : "000 / HOW PDFBLACK WORKS"}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2 font-sans">
                      {isEs ? "Procesamiento en 4 pasos sencillos" : "Simple 4-Step Process"}
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
                      {isEs 
                        ? "Garantía absoluta de privacidad. Tus documentos nunca salen de tu equipo ni tocan servidores externos."
                        : "Absolute privacy guarantee. Your documents never leave your device or touch external servers."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    {/* PASO 1 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">001 / CARGAR</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "1. Carga tu Archivo PDF" : "1. Upload your PDF File"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs 
                          ? "Arrastra tu documento a la zona de carga o selecciónalo de tu equipo. Sin registro ni tarjeta de crédito." 
                          : "Drag your document into the dropzone or select it from your device. No sign-up or credit card needed."}
                      </p>
                    </div>

                    {/* PASO 2 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">002 / CATEGORÍA</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "2. Selecciona la Categoría" : "2. Choose your Category"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs 
                          ? "Elige uno de los 4 botones principales (Editar, Organizar, Convertir u Optimizar) según la herramienta que necesites." 
                          : "Select one of the 4 main buttons (Edit, Organize, Convert, or Optimize) depending on the tool group you need."}
                      </p>
                    </div>

                    {/* PASO 3 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">003 / EDICIÓN</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "3. Trabaja en la Sub-Página" : "3. Work in Tool Sub-Page"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs 
                          ? "Serás llevado a la página específica de la herramienta para personalizar, modificar y procesar tu PDF en vivo." 
                          : "You will be taken to your selected tool sub-page to customize, modify, and process your PDF live."}
                      </p>
                    </div>

                    {/* PASO 4 */}
                    <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                      <span className="text-xs text-zinc-500 font-bold mb-3">004 / DESCARGAR</span>
                      <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                        {isEs ? "4. Descarga tu PDF Listo" : "4. Download your Ready PDF"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {isEs 
                          ? "Obtén tu documento modificado inmediatamente con un solo clic, 100% privado y listo para usar." 
                          : "Get your modified document immediately with a single click, 100% private and ready to use."}
                      </p>
                    </div>
                  </div>

                  {/* SECCIÓN DETALLADA DE GRUPOS DE HERRAMIENTAS: EDITAR, ORGANIZAR, CONVERTIR, OPTIMIZAR */}
                  <div className="w-full mt-14 pt-12 border-t border-white/10 font-sans">
                    <div className="text-center mb-10 max-w-3xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-3 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                        {isEs ? "GUÍA TÉCNICA Y DE SEGURIDAD" : "TECHNICAL & SECURITY GUIDE"}
                      </div>
                      <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                        {isEs ? "¿Qué le sucede a tu archivo PDF en cada grupo de herramientas?" : "What happens to your PDF in each tool group?"}
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-sm font-mono leading-relaxed">
                        {isEs 
                          ? "Transparencia absoluta. Conoce en detalle qué ocurre dentro de tu navegador al procesar tus documentos."
                          : "Absolute transparency. Discover in detail what happens inside your browser when processing documents."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                      
                      {/* GRUPO 1: EDITAR */}
                      <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                                <Edit3 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="text-xs font-mono text-zinc-500 font-bold block">001 / EDICIÓN DIRECTA</span>
                                <h4 className="text-xl font-bold text-white tracking-tight">
                                  {isEs ? 'Grupo EDITAR PDF' : 'EDIT PDF Group'}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 rounded-full">
                              {isEs ? 'Edición Visual' : 'Visual Editing'}
                            </span>
                          </div>

                          {/* QUÉ SUCEDE A TU ARCHIVO */}
                          <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-4 mb-4 font-mono text-xs text-zinc-300 space-y-2">
                            <strong className="text-emerald-400 block font-sans font-bold text-xs flex items-center gap-1.5 border-b border-white/10 pb-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              {isEs ? '🔒 Proceso Binario y Seguridad en EDITAR:' : '🔒 Binary Process & Security in EDIT:'}
                            </strong>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'Al editar un documento, el archivo PDF se descompone en objetos en la memoria RAM aislada de tu navegador. Las modificaciones de texto, marcas de agua, números de folio o firmas trazadas no sobreescriben destructivamente el archivo; se inyectan como capas vectoriales nativas bajo la especificación PDF 1.7.' 
                                : 'When editing, the PDF decodes into objects inside isolated browser RAM. Text edits, watermarks, page numbers, or drawn signatures embed as clean native vector streams under PDF 1.7 standard.'}
                            </p>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'En OCR, el reconocimiento de caracteres se ejecuta mediante modelos WebAssembly locales que analizan píxeles sin transmitir ninguna imagen a servidores externos. Tu archivo original permanece 100% intacto en tu equipo.' 
                                : 'In OCR, character recognition runs via local WebAssembly models analyzing image pixels with zero external API calls. Your original file remains untouched on your drive.'}
                            </p>
                          </div>

                          <div className="space-y-2 text-xs text-zinc-300 font-mono mb-6">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Editar Texto:</strong> {isEs ? 'Inserta texto nativo ajustando fuentes y alineación.' : 'Inserts native text adjusting fonts and alignment.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Foliar Páginas:</strong> {isEs ? 'Agrega numeración correlativa automatizada.' : 'Adds automated sequential page numbers.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Marcas de Agua:</strong> {isEs ? 'Aplica sellos o textos de seguridad sobre cada página.' : 'Applies security stamps or text across pages.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Firmar & OCR:</strong> {isEs ? 'Estampa firmas trazadas y convierte imágenes escaneadas en texto.' : 'Stamps drawn signatures and turns scanned images into text.'}</span>
                            </div>
                          </div>
                        </div>

                        <Link href="/editar" className="inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group">
                          <span>{isEs ? 'Ver herramientas de Editar →' : 'View Edit tools →'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* GRUPO 2: ORGANIZAR */}
                      <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                                <FolderOpen className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="text-xs font-mono text-zinc-500 font-bold block">002 / ESTRUCTURA</span>
                                <h4 className="text-xl font-bold text-white tracking-tight">
                                  {isEs ? 'Grupo ORGANIZAR PDF' : 'ORGANIZE PDF Group'}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 rounded-full">
                              {isEs ? 'Gestor de Páginas' : 'Page Builder'}
                            </span>
                          </div>

                          {/* QUÉ SUCEDE A TU ARCHIVO */}
                          <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-4 mb-4 font-mono text-xs text-zinc-300 space-y-2">
                            <strong className="text-emerald-400 block font-sans font-bold text-xs flex items-center gap-1.5 border-b border-white/10 pb-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              {isEs ? '🔒 Proceso Binario y Seguridad en ORGANIZAR:' : '🔒 Binary Process & Security in ORGANIZE:'}
                            </strong>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'El motor de organización manipula directamente el diccionario jerárquico de páginas (`PageTree`) en la RAM. Al reordenar, rotar, recortar o dividir, el navegador no recodifica las imágenes ni los textos; únicamente reorganiza los punteros lógicos en la tabla de referencias cruzadas.' 
                                : 'Organize tools modify the document PageTree catalog in RAM. When reordering, rotating, cropping, or splitting, only logical pointers update without re-encoding images or reducing vector quality.'}
                            </p>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'Al unir múltiples archivos, el sistema fusiona las tablas de recursos compartidas en un nuevo contenedor PDF unificado a máxima velocidad local, garantizando que planos técnicos, imágenes y documentos conserven 100% su nitidez.' 
                                : 'When merging multiple files, shared resource tables merge into a unified PDF container at max local CPU speed, ensuring blueprints and images retain 100% sharpness.'}
                            </p>
                          </div>

                          <div className="space-y-2 text-xs text-zinc-300 font-mono mb-6">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Unir PDF:</strong> {isEs ? 'Combina árboles de páginas de varios PDFs sin pérdida de nitidez.' : 'Merges page trees from multiple PDFs without resolution loss.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Dividir & Eliminar:</strong> {isEs ? 'Corta por rangos exactos o quita páginas descartables.' : 'Splits by exact page ranges or removes unnecessary pages.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Reordenar & Rotar:</strong> {isEs ? 'Arrastra miniaturas e invierte ángulos a 90°/180°.' : 'Drag page thumbnails and adjust angles to 90°/180°.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Recortar Márgenes:</strong> {isEs ? 'Recorta los bordes a dimensiones estandarizadas.' : 'Crops document margins to standard dimensions.'}</span>
                            </div>
                          </div>
                        </div>

                        <Link href="/organizar" className="inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group">
                          <span>{isEs ? 'Ver herramientas de Organizar →' : 'View Organize tools →'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* GRUPO 3: CONVERTIR */}
                      <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                                <RefreshCw className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="text-xs font-mono text-zinc-500 font-bold block">003 / CONVERSIÓN</span>
                                <h4 className="text-xl font-bold text-white tracking-tight">
                                  {isEs ? 'Grupo CONVERTIR PDF' : 'CONVERT PDF Group'}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 rounded-full">
                              {isEs ? 'Alta Fidelidad' : 'High Precision'}
                            </span>
                          </div>

                          {/* QUÉ SUCEDE A TU ARCHIVO */}
                          <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-4 mb-4 font-mono text-xs text-zinc-300 space-y-2">
                            <strong className="text-emerald-400 block font-sans font-bold text-xs flex items-center gap-1.5 border-b border-white/10 pb-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              {isEs ? '🔒 Proceso Binario y Seguridad en CONVERTIR:' : '🔒 Binary Process & Security in CONVERT:'}
                            </strong>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'El motor cliente de conversión analiza las coordenadas tridimensionales (`x, y, z-index`) de párrafos, tablas de datos e imágenes en el PDF. Reconstruye el documento traduciendo su maquetación a estructuras de archivos XML compatibles con Word (DOCX), Excel (XLSX) o PowerPoint (PPTX) de forma instantánea.' 
                                : 'The client-side conversion engine parses spatial coordinates (`x, y, z`) of text, table cells, and images from the PDF, recompiling them into OpenXML structures (DOCX, XLSX, PPTX) in real-time.'}
                            </p>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'No existen servidores intermedios ni APIs de terceros procesando tus estados financieros, contratos o presentaciones comerciales. Todo el análisis sintáctico y empaquetado comprimido se realiza dentro de la memoria privada de tu navegador.' 
                                : 'No intermediate cloud servers or third-party APIs process your financial sheets or contracts. Parsing and ZIP generation happen inside private browser memory.'}
                            </p>
                          </div>

                          <div className="space-y-2 text-xs text-zinc-300 font-mono mb-6">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>PDF ↔ Word:</strong> {isEs ? 'Convierte párrafos y estilos a formato editable DOCX.' : 'Converts paragraphs and formatting into editable DOCX.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>PDF ↔ Excel:</strong> {isEs ? 'Extrae tablas de datos directamente a hojas XLSX.' : 'Extracts data tables directly into XLSX spreadsheets.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>PDF ↔ PowerPoint:</strong> {isEs ? 'Transforma páginas en diapositivas PPTX.' : 'Transforms pages into PPTX slides.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>PDF ↔ JPG / HTML / TXT:</strong> {isEs ? 'Exporta láminas a imágenes HD, código web o texto plano.' : 'Exports pages into HD images, web code, or text.'}</span>
                            </div>
                          </div>
                        </div>

                        <Link href="/convertir" className="inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group">
                          <span>{isEs ? 'Ver herramientas de Convertir →' : 'View Convert tools →'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* GRUPO 4: OPTIMIZAR */}
                      <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="text-xs font-mono text-zinc-500 font-bold block">004 / OPTIMIZACIÓN</span>
                                <h4 className="text-xl font-bold text-white tracking-tight">
                                  {isEs ? 'Grupo OPTIMIZAR PDF' : 'OPTIMIZE PDF Group'}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 rounded-full">
                              {isEs ? 'Seguridad & Peso' : 'Security & Size'}
                            </span>
                          </div>

                          {/* QUÉ SUCEDE A TU ARCHIVO */}
                          <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-4 mb-4 font-mono text-xs text-zinc-300 space-y-2">
                            <strong className="text-emerald-400 block font-sans font-bold text-xs flex items-center gap-1.5 border-b border-white/10 pb-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              {isEs ? '🔒 Proceso Binario y Seguridad en OPTIMIZAR:' : '🔒 Binary Process & Security in OPTIMIZE:'}
                            </strong>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'Optimiza y re-comprime las fuentes de datos primarias. Al comprimir, re-codifica imágenes JPEG pesadas mediante resampling Canvas y elimina metadatos redundantes de la tabla XRef. Al cifrar o desbloquear, ejecuta algoritmos criptográficos nativos **AES-256** (`crypto.subtle`) sin enviar jamás tus contraseñas a la red.' 
                                : 'Optimizes binary data streams in memory. Compression re-encodes heavy JPEG images via Canvas resampling and purges redundant XRef metadata. Encryption runs native **AES-256** cryptography (`crypto.subtle`) without sending passwords online.'}
                            </p>
                            <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                              {isEs 
                                ? 'En censura confidencial, la información seleccionada se borra físicamente del código binario del archivo (a diferencia de marcar con recuadros negros editables). En reparación, se reconstruyen cabeceras `%PDF-` y estructuras dañadas.' 
                                : 'In redaction, confidential text is permanently erased from the document binary code (unlike overlaying editable black boxes). Repair rebuilds corrupt headers and dictionaries.'}
                            </p>
                          </div>

                          <div className="space-y-2 text-xs text-zinc-300 font-mono mb-6">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Comprimir PDF:</strong> {isEs ? 'Reduce hasta un 90% el peso manteniendo textos legibles.' : 'Reduces file size up to 90% keeping text clear.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Reparar PDF:</strong> {isEs ? 'Reconstruye tablas XRef y arregla archivos corruptos.' : 'Rebuilds XRef tables and fixes corrupt files.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Proteger & Desbloquear:</strong> {isEs ? 'Cifra con contraseña o remueve contraseñas locales.' : 'Encrypts with password or removes local passwords.'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span><strong>Censurar & Comparar:</strong> {isEs ? 'Oculta datos confidenciales o compara visualmente PDFs.' : 'Redacts private data or compares PDFs visually.'}</span>
                            </div>
                          </div>
                        </div>

                        <Link href="/optimizar" className="inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group">
                          <span>{isEs ? 'Ver herramientas de Optimizar →' : 'View Optimize tools →'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* ESTADO 2: CARGANDO */}
          {isUploading && (
            <motion.div 
              key="uploading-view" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-10 lg:p-12 shadow-2xl mt-10 relative z-[50] font-mono"
            >
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4 font-sans">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2.5">
                    <UploadCloud className="w-5 h-5 text-white animate-pulse" />
                    {isEs ? "Cargando documento..." : "Loading document..."}
                  </h3>
                  <span className="text-white font-bold text-3xl tabular-nums font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div 
                    className="bg-white h-full rounded-full relative" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${uploadProgress}%` }} 
                    transition={{ ease: "linear", duration: 0.1 }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {isEs ? "Procesamiento 100% Local" : "100% Local Engine"}
                  </span>
                  <span>{isEs ? "Preparando archivo..." : "Preparing file..."}</span>
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