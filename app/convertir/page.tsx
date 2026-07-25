'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft, RefreshCw, FileText, FileSpreadsheet, Image as ImageIcon, FileCode, Upload,
  UploadCloud, FilePlus, X 
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
    { id: 'pdf-word', titleEs: 'PDF a Word', titleEn: 'PDF to Word', descEs: 'Convierte tus documentos PDF a archivos editables .docx conservando el formato.', descEn: 'Convert your PDF documents into editable .docx files while preserving layout.', icon: FileText, path: '/convertir/pdf-a-word' },
    { id: 'pdf-excel', titleEs: 'PDF a Excel', titleEn: 'PDF to Excel', descEs: 'Extrae tablas de datos estructuradas de tu PDF directamente a hojas de cálculo .xlsx.', descEn: 'Extract structured tables from your PDF directly into .xlsx spreadsheets.', icon: FileSpreadsheet, path: '/convertir/pdf-a-excel' },
    { id: 'pdf-jpg', titleEs: 'PDF a JPG', titleEn: 'PDF to JPG', descEs: 'Extrae y guarda cada página del documento como imágenes individuales de alta resolución.', descEn: 'Extract and save each document page as high-resolution individual images.', icon: ImageIcon, path: '/convertir/pdf-a-jpg' },
    { id: 'word-pdf', titleEs: 'Word a PDF', titleEn: 'Word to PDF', descEs: 'Transforma tus archivos de Microsoft Word a formato PDF estandarizado.', descEn: 'Transform your Microsoft Word files into standardized PDF format.', icon: FileCode, path: '/convertir/word-a-pdf' },
    { id: 'imagen-pdf', titleEs: 'Imagen a PDF', titleEn: 'Image to PDF', descEs: 'Combina tus fotos en JPG, PNG o WebP en un único archivo PDF consolidado.', descEn: 'Combine your JPG, PNG, or WebP photos into a single consolidated PDF file.', icon: Upload, path: '/convertir/imagen-a-pdf' }
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
              <div className="mb-6">
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  {isEs ? "Volver al Inicio" : "Back to Home"}
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-5 flex flex-col">
                  {!globalFile ? (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-orange-500/50 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-[0_0_30px_rgba(0,0,0,0.5)] min-h-[540px]">
                      <div className="bg-orange-500/10 p-4 rounded-full group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                        <UploadCloud className="w-8 h-8 text-orange-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1">{isEs ? "Sube un archivo para comenzar" : "Upload a file to start"}</h3>
                        <p className="text-gray-400 text-sm">{isEs ? "Arrastra tu PDF aquí o haz clic para explorar." : "Drop your PDF here or click to browse."}</p>
                      </div>
                      <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                        <FilePlus className="w-4 h-4" /> {isEs ? "Seleccionar PDF" : "Select PDF"}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white/[0.02] border border-orange-500/20 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.1)] flex flex-col relative min-h-[540px]">
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

                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-orange-400" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400">{isEs ? "Convertir Documento" : "Convert Document"}</h2>
                    </div>
                    <p className="text-neutral-400 text-sm mb-6">{isEs ? "Exporta y transforma tu PDF a múltiples formatos estándar:" : "Export and transform your PDF into multiple standard formats:"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                    {conversionTools.map((tool) => (
                      <Link key={tool.id} href={globalFile ? tool.path : "#"} onClick={(e) => { if (!globalFile) { e.preventDefault(); toast.error(isEs ? "Sube un archivo primero para usar las herramientas." : "Upload a file first to use the tools."); } }} className={`outline-none group block ${!globalFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 transition-all duration-500 h-full min-h-[180px] flex flex-col justify-between hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <div>
                            <div className="mb-4 relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all" />
                              <div className="relative bg-black/50 border border-white/10 p-2.5 rounded-xl w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-500">
                                <tool.icon className="w-5 h-5 text-orange-400" />
                              </div>
                            </div>
                            <h3 className="text-md font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">{isEs ? tool.titleEs : tool.titleEn}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{isEs ? tool.descEs : tool.descEn}</p>
                          </div>
                          {globalFile && (
                            <div className="mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1">{isEs ? 'Configurar' : 'Configure'} <ArrowLeft className="w-3 h-3 rotate-180" /></span>
                            </div>
                          )}
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