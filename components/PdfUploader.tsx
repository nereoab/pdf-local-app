'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, Loader2, Plus, Info } from 'lucide-react';

export default function PdfUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  
  // Estados para el Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      setFiles(prev => [...prev, ...selectedFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, i) => i !== indexToRemove));
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
      newFiles.splice(draggedIndex, 1); // Quita el elemento de su posición original
      newFiles.splice(index, 0, draggedFile); // Lo inserta en la nueva posición
      return newFiles;
    });
    setDraggedIndex(index); // Actualiza el índice actual del elemento arrastrado
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
      <div className="w-full max-w-3xl bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-blue-50 p-6 rounded-full mb-6">
          <UploadCloud className="w-16 h-16 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Unir archivos PDF</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Une PDFs y ponlos en el orden que prefieras. Rápido, seguro y sin necesidad de internet.
        </p>
        
        <label className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95">
          Seleccionar archivos PDF
          <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
        </label>
      </div>
    );
  }

  // VISTA 2: Espacio de trabajo (Estilo iLovePDF)
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      
      {/* PANEL IZQUIERDO: Cuadrícula de archivos (Workspace) */}
      <div className="flex-1 bg-slate-100/50 p-6 rounded-3xl border border-slate-200 min-h-[400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              draggable={!isProcessing}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()} // Necesario para permitir el drop
              className={`relative group flex flex-col items-center p-4 bg-white rounded-2xl border-2 transition-all cursor-grab active:cursor-grabbing
                ${draggedIndex === index ? 'opacity-50 border-blue-400 scale-95' : 'border-transparent hover:border-blue-200 shadow-sm hover:shadow-md'}
              `}
            >
              {/* Botón de eliminar (Aparece al hacer hover) */}
              <button 
                onClick={() => removeFile(index)}
                disabled={isProcessing}
                className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm disabled:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icono de Documento */}
              <div className="w-16 h-20 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center mb-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-red-100 border-l-[16px] border-l-transparent"></div>
                <FileText className="w-8 h-8 text-red-500" />
              </div>

              {/* Nombre del archivo */}
              <span className="text-xs font-medium text-slate-700 text-center w-full truncate px-1" title={file.name}>
                {file.name}
              </span>
              
              {/* Número de orden */}
              <div className="absolute bottom-2 left-2 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Botón para añadir más archivos a la cuadrícula */}
          <label className="flex flex-col items-center justify-center p-4 bg-transparent rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer min-h-[140px] group">
            <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600">Añadir más</span>
            <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
          </label>

        </div>
      </div>

      {/* PANEL DERECHO: Acciones (Sidebar) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Unir PDF</h3>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3 mb-6">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Para cambiar el orden de tus PDFs, <strong>arrastra y suelta</strong> los archivos como quieras.</p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Total archivos:</span>
              <span className="text-slate-800">{files.length}</span>
            </div>
            
            <button 
              onClick={mergePdfs} 
              disabled={isProcessing || files.length < 2} 
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base">{progressMsg || 'Procesando...'}</span>
                </>
              ) : (
                'Unir PDF'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}