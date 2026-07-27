'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, Loader2, Plus, Info, ShieldCheck, FilePlus } from 'lucide-react';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function PdfUploader() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { globalFiles, setGlobalFiles, removeGlobalFile } = useFileStore();
  const [files, setFiles] = useState<File[]>(globalFiles || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  
  // Estados para el Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalFiles && globalFiles.length > 0) {
      setFiles(globalFiles);
    }
  }, [globalFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      const updated = [...files, ...selectedFiles];
      setFiles(updated);
      setGlobalFiles(updated);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    const updated = files.filter((_, i) => i !== indexToRemove);
    setFiles(updated);
    removeGlobalFile(indexToRemove);
  };

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const draggedFile = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(index, 0, draggedFile);
      setGlobalFiles(newFiles);
      return newFiles;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  // -----------------------------

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    let url: string | null = null;

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgressMsg(`Procesando archivo ${i + 1} de ${files.length}...`);
        await new Promise(resolve => setTimeout(resolve, 10)); // Yield

        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true }); 
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
        }
      }

      setProgressMsg('Ensamblando documento final...');
      await new Promise(resolve => setTimeout(resolve, 10));

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'expediente_unido.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error uniendo PDFs:', error);
      alert('Hubo un error al procesar los archivos. Verifica que no estén protegidos con contraseña.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // VISTA 1: Cuando no hay archivos (Dropzone gigante)
  if (files.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-3xl bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[440px] relative overflow-hidden font-mono"
      >
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
        >
          <UploadCloud className="w-12 h-12 text-white" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5 font-sans">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEs ? "Unir archivos PDF" : "Merge PDF files"}
          </h2>
          <p className="text-zinc-400 text-xs font-mono flex items-center justify-center gap-1.5">
            {isEs ? "Arrastra múltiples archivos PDF aquí o haz clic para explorar" : "Drag multiple PDF files here or click to browse"}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all mt-1 cursor-pointer shadow-md">
          <FilePlus className="w-4 h-4 text-black" /> {isEs ? "Seleccionar PDFs" : "Select PDFs"}
          <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
        </label>

        {/* LEYENDA DE PRIVACIDAD DENTRO DEL CUADRO DE CARGA */}
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isEs ? '100% LOCAL • SIN SERVIDORES' : '100% LOCAL • ZERO SERVERS'}</span>
        </div>
      </motion.div>
    );
  }

  // VISTA 2: Espacio de trabajo (Content Architecture Workspace)
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 font-mono">
      
      {/* PANEL IZQUIERDO: Cuadrícula de archivos (Workspace) */}
      <div className="flex-1 bg-[#09090b] p-6 border border-white/10 rounded-2xl min-h-[400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              draggable={!isProcessing}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`relative group flex flex-col items-center p-4 bg-zinc-900/60 border rounded-2xl transition-all cursor-grab active:cursor-grabbing
                ${draggedIndex === index ? 'opacity-50 border-white scale-95' : 'border-white/10 hover:border-white/30 shadow-sm'}
              `}
            >
              {/* Botón de eliminar (Aparece al hacer hover) */}
              <button 
                onClick={() => removeFile(index)}
                disabled={isProcessing}
                className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 border border-red-500/30 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm disabled:hidden"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Icono de Documento */}
              <div className="w-16 h-20 bg-zinc-950 border border-white/10 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
                <FileText className="w-8 h-8 text-white" />
              </div>

              {/* Nombre del archivo */}
              <span className="text-xs font-mono text-zinc-300 text-center w-full truncate px-1" title={file.name}>
                {file.name}
              </span>
              
              {/* Número de orden */}
              <div className="absolute bottom-2 left-2 bg-zinc-950 border border-white/10 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                0{index + 1}
              </div>
            </div>
          ))}

          {/* Botón para añadir más archivos a la cuadrícula */}
          <label className="flex flex-col items-center justify-center p-4 bg-transparent border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl transition-all cursor-pointer min-h-[140px] group">
            <div className="bg-zinc-900 p-2 border border-white/10 rounded-xl group-hover:border-white/30 transition-colors mb-2">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-mono text-zinc-400 group-hover:text-white">{isEs ? "+ Añadir" : "+ Add"}</span>
            <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
          </label>

        </div>
      </div>

      {/* PANEL DERECHO: Acciones (Sidebar) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-[#09090b] p-6 border border-white/10 rounded-2xl flex-1 flex flex-col">
          <h3 className="text-sm font-mono font-bold text-white mb-4 tracking-wider uppercase">{isEs ? "002 / UNIR_PDF" : "002 / MERGE_PDF"}</h3>
          
          <div className="bg-zinc-900 border border-white/10 text-zinc-400 p-4 text-xs font-mono leading-relaxed flex gap-3 mb-6 rounded-xl">
            <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            <p>{isEs ? "Arrastra y reordena los archivos en la cuadrícula para definir la secuencia final." : "Drag and reorder files in grid to arrange final sequence."}</p>
          </div>

          <div className="mt-auto space-y-4 font-mono">
            <div className="flex justify-between text-xs text-zinc-400 px-1">
              <span>{isEs ? "Total archivos:" : "Total files:"}</span>
              <span className="text-white font-bold">{files.length}</span>
            </div>
            
            <button 
              onClick={mergePdfs} 
              disabled={isProcessing || files.length < 2} 
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 py-3 rounded-full font-sans text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span className="text-xs">{progressMsg || (isEs ? 'PROCESANDO...' : 'PROCESSING...')}</span>
                </>
              ) : (
                isEs ? 'Unir PDF' : 'Merge PDF'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}