"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Layers, Scissors, LayoutGrid, FileOutput, Trash2,
  UploadCloud, FilePlus, FileText, X, Home, ShieldCheck, Zap, ArrowRight
} from "lucide-react";
import { useFileStore } from "../../store/useFileStore"; 

const herramientasOrganizar = [
  { id: "unir", nombre: "Unir PDF", descripcion: "Combina múltiples archivos PDF en un solo documento de forma rápida.", icono: Layers, href: "/organizar/unir", color: "text-blue-400", glow: "bg-blue-500/20" },
  { id: "dividir", nombre: "Dividir PDF", descripcion: "Extrae páginas específicas o divide un documento grande en varios.", icono: Scissors, href: "/organizar/dividir", color: "text-emerald-400", glow: "bg-emerald-500/20" },
  { id: "ordenar", nombre: "Ordenar y Rotar", descripcion: "Reorganiza visualmente las páginas o rótalas a tu gusto.", icono: LayoutGrid, href: "/organizar/ordenar", color: "text-orange-400", glow: "bg-orange-500/20" },
  { id: "extraer", nombre: "Extraer Páginas", descripcion: "Saca solo las páginas que necesitas para crear un nuevo PDF.", icono: FileOutput, href: "/organizar/extraer", color: "text-purple-400", glow: "bg-purple-500/20" },
  { id: "eliminar", nombre: "Eliminar Páginas", descripcion: "Quita las páginas en blanco o que no necesitas del documento.", icono: Trash2, href: "/organizar/eliminar", color: "text-red-400", glow: "bg-red-500/20" }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.6 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};

export default function OrganizarPage() {
  const { globalFile, clearGlobalFile } = useFileStore();
  const [file, setFile] = useState<File | null>(globalFile);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [file]);

  const procesarArchivoLocal = (archivoSeleccionado: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFile(archivoSeleccionado);
            setIsUploading(false);
            setUploadProgress(0);
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 10; 
      });
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!isUploading && !file) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (isUploading || file) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") procesarArchivoLocal(droppedFile);
      else alert("Por favor, sube un archivo PDF válido.");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) procesarArchivoLocal(e.target.files[0]);
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    clearGlobalFile();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 pb-24 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#030712] transition-all duration-700 ${file ? 'pt-8' : 'pt-32'}`}>
      
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[40] bg-black/70 backdrop-blur-sm pointer-events-none" />
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl relative">
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileInput} />

        <AnimatePresence mode="wait">
          {!file && !isUploading && (
            <motion.div key="home-view" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="relative z-10">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  Organizar <span className="text-emerald-400">PDF</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Une, divide y reordena las páginas de tus expedientes fácilmente.
                </p>
              </div>

              <div onClick={() => fileInputRef.current?.click()} className="w-full mb-12 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-emerald-500/50 border-dashed rounded-3xl p-12 md:p-20 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="bg-emerald-500/10 p-6 rounded-full mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <UploadCloud className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Arrastra y suelta tu PDF aquí</h2>
                <p className="text-gray-400 mb-8 text-lg">o haz clic para explorar en tu dispositivo</p>
                <button className="bg-white text-black hover:bg-gray-200 transition-all font-bold rounded-xl px-8 py-4 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] text-lg pointer-events-none">
                  <FilePlus className="w-6 h-6" /> Seleccionar Archivo
                </button>
              </div>
            </motion.div>
          )}

          {isUploading && (
            <motion.div key="uploading-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full bg-black/60 border border-emerald-500/30 rounded-3xl p-12 shadow-[0_0_40px_rgba(16,185,129,0.15)] mt-10 relative z-[50]">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4">
                  <div className="text-left">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">Procesando documento...</h3>
                    <p className="text-emerald-400/80 text-sm flex items-center gap-1 mt-1"><ShieldCheck className="w-4 h-4" /> Entorno local seguro</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-3xl tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-white/10 shadow-inner">
                  <motion.div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full relative" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear", duration: 0.1 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {file && pdfUrl && !isUploading && (
            <motion.div key="preview-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col items-center relative z-[50]">
              
              <div className="w-48 sm:w-56 bg-white/[0.02] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] mb-6 flex flex-col relative group">
                <div className="bg-emerald-950/60 backdrop-blur-xl border-b border-emerald-500/30 p-2 flex justify-between items-center z-10">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30 flex-shrink-0">
                      <FileText className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-white font-bold text-[10px] truncate w-20 sm:w-28">{file.name}</span>
                      <span className="text-emerald-400/80 text-[8px] font-medium">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button onClick={handleRemoveFile} className="flex-shrink-0 p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all duration-300">
                    <X className="w-3 h-3 hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
                <div className="w-full aspect-[1/1.4] bg-[#0a0a0a] relative pointer-events-none">
                  <div className="absolute inset-0 bg-black/5 z-10"></div>
                  <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="w-full h-full border-none" title="PDF Preview" />
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                <h3 className="text-lg font-bold uppercase tracking-widest text-emerald-400">¿Qué deseas hacer con este archivo?</h3>
              </motion.div>

              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-16">
                {herramientasOrganizar.map((cat) => (
                  <motion.div key={cat.id} variants={itemVariants}>
                    <Link href={cat.href} className="outline-none group block h-full">
                      <div className={`bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-3xl p-8 transition-all duration-500 h-full min-h-[240px] flex flex-col justify-between ${cat.glow}`}>
                        <div>
                          <div className="mb-6 relative flex justify-between items-start">
                            <div className="relative">
                              <div className={`absolute inset-0 ${cat.glow} blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
                              <div className="relative bg-black/50 border border-white/10 p-3.5 rounded-xl w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                <cat.icono className={`w-8 h-8 ${cat.color} drop-shadow-[0_0_8px_currentColor]`} />
                              </div>
                            </div>
                          </div>
                          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{cat.nombre}</h2>
                          <p className="text-sm text-gray-400 leading-relaxed">{cat.descripcion}</p>
                        </div>
                        <div className="mt-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                            Usar archivo aquí <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 flex justify-center relative z-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg">
          <Home className="w-4 h-4" /> <span className="text-sm font-medium">Volver al Inicio</span>
        </Link>
      </motion.div>
    </div>
  );
}