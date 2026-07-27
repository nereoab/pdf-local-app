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
        className="w-full max-w-3xl bg-[#0a0400] border border-[#fff0e6]/20 hover:border-[#ff4d00] p-8 lg:p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[440px] relative overflow-hidden"
      >
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="bg-[#ff4d00]/10 p-6 rounded-none border border-[#ff4d00]/30 group-hover:scale-110 group-hover:bg-[#ff4d00] transition-all duration-300"
        >
          <UploadCloud className="w-16 h-16 text-[#ff4d00] group-hover:text-[#0a0400] transition-colors" />
        </motion.div>

        <div className="text-center flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-black text-[#fff0e6] uppercase tracking-wider group-hover:text-[#ff4d00] transition-colors">
            {isEs ? "UNIR ARCHIVOS PDF" : "MERGE PDF FILES"}
          </h2>
          <p className="text-[#fff0e6]/60 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
            {isEs ? "Arrastra múltiples archivos PDF aquí o haz clic para explorar" : "Drag multiple PDF files here or click to browse"}
          </p>
        </div>

        <label className="flex items-center justify-center gap-2.5 bg-[#ff4d00] hover:bg-[#fff0e6] text-[#fff0e6] hover:text-[#0a0400] px-8 py-3.5 font-black text-xs uppercase tracking-widest transition-all mt-1 cursor-pointer border border-[#ff4d00]">
          <FilePlus className="w-4 h-4" /> {isEs ? "SELECCIONAR PDFS" : "SELECT PDFS"}
          <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
        </label>

        {/* LEYENDA DE PRIVACIDAD DENTRO DEL CUADRO DE CARGA */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] text-xs font-black uppercase tracking-wider mt-1">
          <ShieldCheck className="w-4 h-4 text-[#ff4d00]" />
          <span>{isEs ? 'PRIVACIDAD ABSOLUTA • 100% LOCAL' : 'ABSOLUTE PRIVACY • 100% LOCAL'}</span>
        </div>
      </motion.div>
    );
  }

  // VISTA 2: Espacio de trabajo (Estilo iLovePDF)
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      
      {/* PANEL IZQUIERDO: Cuadrícula de archivos (Workspace) */}
      <div className="flex-1 bg-[#0a0400] p-6 border border-[#fff0e6]/20 min-h-[400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              draggable={!isProcessing}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`relative group flex flex-col items-center p-4 bg-[#0a0400] border transition-all cursor-grab active:cursor-grabbing
                ${draggedIndex === index ? 'opacity-50 border-[#ff4d00] scale-95' : 'border-[#fff0e6]/20 hover:border-[#ff4d00] shadow-sm'}
              `}
            >
              {/* Botón de eliminar (Aparece al hacer hover) */}
              <button 
                onClick={() => removeFile(index)}
                disabled={isProcessing}
                className="absolute -top-2 -right-2 bg-[#ff4d00] text-[#0a0400] p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm disabled:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icono de Documento */}
              <div className="w-16 h-20 bg-[#ff4d00]/10 border border-[#ff4d00]/30 flex items-center justify-center mb-3 relative overflow-hidden">
                <FileText className="w-8 h-8 text-[#ff4d00]" />
              </div>

              {/* Nombre del archivo */}
              <span className="text-xs font-black uppercase text-[#fff0e6] text-center w-full truncate px-1" title={file.name}>
                {file.name}
              </span>
              
              {/* Número de orden */}
              <div className="absolute bottom-2 left-2 bg-[#ff4d00] text-[#0a0400] text-[10px] font-black px-2 py-0.5">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Botón para añadir más archivos a la cuadrícula */}
          <label className="flex flex-col items-center justify-center p-4 bg-transparent border-2 border-dashed border-[#fff0e6]/20 hover:border-[#ff4d00] transition-all cursor-pointer min-h-[140px] group">
            <div className="bg-[#ff4d00]/10 p-2 border border-[#ff4d00]/30 group-hover:bg-[#ff4d00] transition-colors mb-2">
              <Plus className="w-6 h-6 text-[#ff4d00] group-hover:text-[#0a0400]" />
            </div>
            <span className="text-xs font-black uppercase text-[#fff0e6]/60 group-hover:text-[#ff4d00]">{isEs ? "Añadir más" : "Add more"}</span>
            <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
          </label>

        </div>
      </div>

      {/* PANEL DERECHO: Acciones (Sidebar) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-[#0a0400] p-6 border border-[#fff0e6]/20 flex-1 flex flex-col">
          <h3 className="text-lg font-black uppercase text-[#fff0e6] mb-4 tracking-wider">{isEs ? "UNIR PDF" : "MERGE PDF"}</h3>
          
          <div className="bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] p-4 text-xs font-semibold uppercase leading-relaxed flex gap-3 mb-6">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{isEs ? "Para cambiar el orden de tus PDFs, arrastra y suelta los archivos como quieras." : "To change the order of your PDFs, drag and drop the files as you wish."}</p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex justify-between text-xs font-black uppercase text-[#fff0e6]/60 px-1">
              <span>{isEs ? "Total archivos:" : "Total files:"}</span>
              <span className="text-[#ff4d00]">{files.length}</span>
            </div>
            
            <button 
              onClick={mergePdfs} 
              disabled={isProcessing || files.length < 2} 
              className="w-full flex items-center justify-center gap-2 bg-[#ff4d00] text-[#fff0e6] hover:bg-[#fff0e6] hover:text-[#0a0400] py-4 font-black text-sm uppercase tracking-widest border border-[#ff4d00] disabled:bg-[#fff0e6]/10 disabled:text-[#fff0e6]/40 disabled:border-[#fff0e6]/10 transition-all shadow-lg active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">{progressMsg || (isEs ? 'PROCESANDO...' : 'PROCESSING...')}</span>
                </>
              ) : (
                isEs ? 'UNIR PDF' : 'MERGE PDF'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}