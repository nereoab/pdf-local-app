'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowRight, Zap, Sliders, Activity, EyeOff, Lock, Unlock, GitCompare,
  FileText, UploadCloud, FilePlus, X, ShieldCheck, HardDrive, Clock, CheckCircle2, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

function OptimizarContent() {
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

  const optimizationTools = [
    { 
      id: 'comprimir', 
      tagEs: '001 / COMPRIMIR TAMAÑO', tagEn: '001 / COMPRESS SIZE', 
      titleEs: 'Comprimir PDF', titleEn: 'Compress PDF', 
      descEs: 'Reduce el peso de tu archivo optimizando la calidad máxima del documento.', 
      descEn: 'Reduce file size while optimizing for maximal PDF quality.', 
      icon: Sliders, path: '/optimizar/comprimir',
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
      id: 'reparar', 
      tagEs: '002 / REPARAR Y RECUPERAR', tagEn: '002 / REPAIR RECOVERY', 
      titleEs: 'Reparar PDF', titleEn: 'Repair PDF', 
      descEs: 'Sube un PDF dañado o corrupto e intentaremos reparar e integrar sus datos.', 
      descEn: 'Upload a corrupt PDF and we will try to fix and recover it.', 
      icon: Activity, path: '/optimizar/reparar',
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
      id: 'desbloquear', 
      tagEs: '003 / DESBLOQUEAR ACCESO', tagEn: '003 / UNLOCK ACCESS', 
      titleEs: 'Desbloquear PDF', titleEn: 'Unlock PDF', 
      descEs: 'Remueve la seguridad y contraseñas para usar y copiar tus PDFs libremente.', 
      descEn: 'Remove PDF password security, giving freedom to use your PDFs.', 
      icon: Unlock, path: '/optimizar/desbloquear',
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
      id: 'proteger', 
      tagEs: '004 / PROTEGER CIFRADO', tagEn: '004 / PROTECT ENCRYPTION', 
      titleEs: 'Proteger PDF', titleEn: 'Protect PDF', 
      descEs: 'Encripta tu archivo PDF con contraseña para proteger datos confidenciales.', 
      descEn: 'Encrypt your PDF with a password to keep sensitive data confidential.', 
      icon: Lock, path: '/optimizar/proteger',
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
      id: 'censurar', 
      tagEs: '005 / CENSURAR PRIVADO', tagEn: '005 / REDACT SENSITIVE', 
      titleEs: 'Censurar PDF', titleEn: 'Redact PDF', 
      descEs: 'Remueve contenido confidencial o sensible de las páginas de tu PDF.', 
      descEn: 'Remove sensitive content and text from PDF documents.', 
      icon: EyeOff, path: '/optimizar/censurar',
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
      id: 'comparar', 
      tagEs: '006 / COMPARAR DIFERENCIAS', tagEn: '006 / COMPARE DIFFERENCES', 
      titleEs: 'Comparar PDF', titleEn: 'Compare PDF', 
      descEs: 'Muestra fácilmente las diferencias y cambios entre dos archivos PDF similares.', 
      descEn: 'Easily display the differences between two similar PDF files.', 
      icon: GitCompare, path: '/optimizar/comparar',
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

  if (!mounted) return null;

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
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {isEs ? "004 / HERRAMIENTAS DE OPTIMIZAR PDF" : "004 / PDF OPTIMIZATION TOOLS"}
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1">
                      {isEs ? "Reduce el peso o repara la integridad de tu archivo PDF:" : "Reduce file size or repair the integrity of your PDF file:"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <KpiPill icon={FileText} title={isEs ? "Archivos" : "Files"} value={15} tooltip={isEs ? "Tus archivos optimizados esta semana" : "Files optimized this week"} color="text-white" />
                  <KpiPill icon={HardDrive} title={isEs ? "Ahorrado" : "Saved"} value={4.8} decimals={1} suffix=" GB" tooltip={isEs ? "Espacio en disco comprimido" : "Compressed disk space"} color="text-zinc-300" />
                  <KpiPill icon={Clock} title={isEs ? "Tiempo" : "Time"} value={35} suffix=" min" tooltip={isEs ? "Tiempo ahorrado en tu sesión actual" : "Time saved in current session"} color="text-zinc-400" />
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
                          {isEs ? "Arrastra tu PDF aquí para optimizar" : "Drop your PDF here to optimize"}
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
                      
                      <div className="w-full flex-1 bg-[#09090b] relative pointer-events-none overflow-hidden">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 h-full">
                    {optimizationTools.map((tool) => {
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
                  {isEs ? "000 / PASOS DE OPTIMIZACIÓN" : "000 / OPTIMIZATION STEPS"}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-8 font-sans">
                  {isEs ? "Solo 3 pasos para optimizar tu PDF" : "Only 3 steps to optimize your PDF"}
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
                      {isEs ? "En la página especializada, elige la función exacta (Comprimir, Reparar, Desproteger, etc.)." : "In the specialized page, select the exact function (Compress, Repair, Unlock, Protect, etc.)."}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function OptimizarPage() {
  return (
    <Suspense fallback={null}>
      <OptimizarContent />
    </Suspense>
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