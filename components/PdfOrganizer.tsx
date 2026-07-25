'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { LayoutGrid, X, Loader2, Plus, RotateCw, FilePlus2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

const FILE_COLORS = [
  { border: 'border-red-400', bg: 'bg-red-950/40', text: 'text-red-300' },
  { border: 'border-cyan-400', bg: 'bg-cyan-950/40', text: 'text-cyan-300' },
  { border: 'border-yellow-400', bg: 'bg-yellow-950/40', text: 'text-yellow-300' },
  { border: 'border-emerald-400', bg: 'bg-emerald-950/40', text: 'text-emerald-300' },
  { border: 'border-purple-400', bg: 'bg-purple-950/40', text: 'text-purple-300' },
];

type PageItem = {
  id: string;
  fileIndex: number;
  originalPageNum: number;
  rotation: number;
  isBlank: boolean;
  thumbnailUrl: string | null;
};

export default function PdfOrganizer() {
  const { globalFiles, globalFile, setGlobalFiles } = useFileStore();
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarArchivosPDF = async (selectedFiles: File[]) => {
    setIsProcessing(true);
    setProgressMsg('Iniciando motor PDF...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const newFilesList = [...files, ...selectedFiles];
      let newPages: PageItem[] = [...pages];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileIndex = files.length + i;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        
        for (let p = 1; p <= pageCount; p++) {
          setProgressMsg(`Renderizando ${file.name} (pág ${p}/${pageCount})...`);
          if (p % 3 === 0) await new Promise(r => setTimeout(r, 10)); 

          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 0.3 }); 
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport } as any).promise;
            
            newPages.push({
              id: `${fileIndex}-${p}-${Math.random()}`,
              fileIndex,
              originalPageNum: p,
              rotation: 0,
              isBlank: false,
              thumbnailUrl: canvas.toDataURL('image/jpeg', 0.6) 
            });
          }
        }
      }
      
      setFiles(newFilesList);
      setPages(newPages);
      setGlobalFiles(newFilesList);
      toast.success('Archivos cargados con éxito');
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar el PDF');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Carga inicial si ya existen archivos en el store global
  useEffect(() => {
    const existing = globalFiles && globalFiles.length > 0 ? globalFiles : (globalFile ? [globalFile] : []);
    if (existing.length > 0 && files.length === 0) {
      procesarArchivosPDF(existing);
    }
  }, [globalFiles, globalFile, files.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    await procesarArchivosPDF(selectedFiles);
  };

  const addBlankPage = () => {
    setPages([...pages, {
      id: `blank-${Math.random()}`,
      fileIndex: -1,
      originalPageNum: 0,
      rotation: 0,
      isBlank: true,
      thumbnailUrl: null
    }]);
    toast.info('Página en blanco añadida');
  };

  const rotatePage = (index: number) => {
    setPages(prev => {
      const newPages = [...prev];
      newPages[index].rotation = (newPages[index].rotation + 90) % 360;
      return newPages;
    });
  };

  const removePage = (indexToRemove: number) => {
    setPages(pages.filter((_, i) => i !== indexToRemove));
  };

  const resetAll = () => {
    setFiles([]);
    setPages([]);
    toast.info('Sesión reiniciada');
  };

  const executeOrganize = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    let url: string | null = null;

    try {
      const loadedPdfs = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return await PDFDocument.load(buffer, { ignoreEncryption: true });
        })
      );

      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        setProgressMsg(`Guardando página ${i + 1} de ${pages.length}...`);
        await new Promise(r => setTimeout(r, 10));
        
        const pageItem = pages[i];
        if (pageItem.isBlank) {
          newPdf.addPage([595.28, 841.89]);
        } else {
          const sourcePdf = loadedPdfs[pageItem.fileIndex];
          const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageItem.originalPageNum - 1]);
          if (pageItem.rotation !== 0) {
            copiedPage.setRotation(degrees(copiedPage.getRotation().angle + pageItem.rotation));
          }
          newPdf.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Documento_Editado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('¡Archivo generado!');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el PDF');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Drag & Drop
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setPages(prev => {
      const newPages = [...prev];
      const draggedItem = newPages[draggedIndex];
      newPages.splice(draggedIndex, 1);
      newPages.splice(index, 0, draggedItem);
      return newPages;
    });
    setDraggedIndex(index);
  };

  // VISTA DE CARGA Y SUBIDA
  if (files.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="bg-slate-800 p-5 rounded-full shadow-2xl relative z-10 border border-emerald-500/30">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Procesando documento...</h2>
            <div className="bg-emerald-500/10 px-6 py-2.5 rounded-full border border-emerald-500/30 shadow-inner">
              <p className="text-emerald-400 font-bold text-sm animate-pulse">{progressMsg}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 p-6 rounded-full mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <LayoutGrid className="w-14 h-14 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Ordenar y Rotar PDF</h2>
            <p className="text-slate-400 mb-6 text-center max-w-md leading-relaxed text-sm">Visualiza páginas en miniatura, reordena arrastrando, rota o inserta hojas en blanco de forma totalmente local.</p>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8">
              <ShieldCheck className="w-4 h-4" />
              <span>Procesamiento 100% Local & Seguro</span>
            </div>

            <label className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 border border-emerald-400/30">
              Seleccionar archivo PDF
              <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
            </label>
          </>
        )}
      </motion.div>
    );
  }

  // VISTA DE EDICIÓN (WORKSPACE)
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[500px]">
        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
          {pages.map((page, index) => {
            const colorTheme = page.isBlank ? { border: 'border-slate-300 dark:border-slate-700' } : FILE_COLORS[page.fileIndex % FILE_COLORS.length];
            return (
              <div 
                key={page.id} 
                draggable={!isProcessing}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={() => setDraggedIndex(null)}
                onDragOver={(e) => e.preventDefault()}
                className={`relative group flex flex-col items-center cursor-grab active:cursor-grabbing transition-all ${draggedIndex === index ? 'opacity-40 scale-90' : 'hover:scale-105'}`}
              >
                <div className="absolute -top-3 -right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!page.isBlank && (
                    <button onClick={() => rotatePage(index)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-full hover:bg-blue-500 hover:text-white shadow-sm"><RotateCw className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => removePage(index)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-full hover:bg-red-500 hover:text-white shadow-sm"><X className="w-4 h-4" /></button>
                </div>
                <div className={`w-32 h-44 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-4 ${colorTheme.border} flex items-center justify-center overflow-hidden relative`}>
                  {page.isBlank ? (
                    <span className="text-slate-300 dark:text-slate-600 font-bold text-[10px] uppercase text-center">Blanco</span>
                  ) : (
                    <img src={page.thumbnailUrl!} alt="P" className="w-full h-full object-contain" style={{ transform: `rotate(${page.rotation}deg)` }} draggable={false} />
                  )}
                  {!page.isBlank && <div className="absolute bottom-1 right-1 bg-slate-800/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{page.originalPageNum}</div>}
                </div>
                <span className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{index + 1}</span>
              </div>
            );
          })}
          <div className="flex gap-3">
            <label className="w-32 h-44 flex flex-col items-center justify-center bg-transparent rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
              <Plus className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Añadir PDF</span>
              <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} />
            </label>
            <button onClick={addBlankPage} className="w-32 h-44 flex flex-col items-center justify-center bg-transparent rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
              <FilePlus2 className="w-5 h-5 text-slate-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Blanco</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Archivos</h3>
          <div className="space-y-2 mb-8 max-h-60 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div key={index} className={`flex items-center gap-2 p-2.5 rounded-lg ${FILE_COLORS[index % FILE_COLORS.length].bg} ${FILE_COLORS[index % FILE_COLORS.length].text} border border-white/50 dark:opacity-90`}>
                <span className="font-bold text-sm w-5">{String.fromCharCode(65 + index)}:</span>
                <span className="text-xs font-semibold truncate">{file.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-4">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-medium px-1">
              <span>Total páginas:</span>
              <span className="text-slate-800 dark:text-white font-bold">{pages.length}</span>
            </div>
            <button onClick={executeOrganize} disabled={isProcessing || pages.length === 0} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-all shadow-lg active:scale-95">
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Guardar PDF'}
            </button>
            <button onClick={resetAll} disabled={isProcessing} className="w-full text-xs font-bold text-red-500 hover:underline">Reiniciar todo</button>
          </div>
        </div>
      </div>
    </div>
  );
}