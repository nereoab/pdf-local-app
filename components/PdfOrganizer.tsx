'use client';

import { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { LayoutGrid, X, Loader2, Plus, RotateCw, FilePlus2 } from 'lucide-react';

// ELIMINAMOS la importación global de pdfjs-dist de aquí arriba.

const FILE_COLORS = [
  { border: 'border-red-400', bg: 'bg-red-100', text: 'text-red-700' },
  { border: 'border-cyan-400', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { border: 'border-yellow-400', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { border: 'border-emerald-400', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-700' },
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
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessing(true);
    setProgressMsg('Cargando motor de renderizado...');

    try {
      // SOLUCIÓN: Importación Dinámica (Lazy Load). 
      // Esto solo se ejecuta en el navegador, evitando el error DOMMatrix en el servidor.
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      const newFilesList = [...files, ...selectedFiles];
      let newPages: PageItem[] = [...pages];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileIndex = files.length + i;
        
        setProgressMsg(`Renderizando ${file.name}...`);
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        
        for (let p = 1; p <= pageCount; p++) {
          if (p % 5 === 0) {
            setProgressMsg(`Generando miniatura ${p} de ${pageCount}...`);
            await new Promise(r => setTimeout(r, 10)); 
          }

          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 0.3 }); 
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            // Mantenemos el "as any" para evitar el error estricto de TypeScript
            await page.render({ canvasContext: context, viewport } as any).promise;
            
            newPages.push({
              id: `${fileIndex}-${p}-${Date.now()}`,
              fileIndex: fileIndex,
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
    } catch (error) {
      console.error(error);
      alert('Error al leer el PDF. Verifica que no tenga contraseña.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addBlankPage = () => {
    setPages([...pages, {
      id: `blank-${Date.now()}`,
      fileIndex: -1,
      originalPageNum: 0,
      rotation: 0,
      isBlank: true,
      thumbnailUrl: null
    }]);
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
  };

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
  const handleDragEnd = () => setDraggedIndex(null);

  const executeOrganize = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    let url: string | null = null;

    try {
      setProgressMsg('Preparando documentos...');
      await new Promise(r => setTimeout(r, 10));

      const loadedPdfs = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return await PDFDocument.load(buffer, { ignoreEncryption: true });
        })
      );

      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        if (i % 10 === 0) {
          setProgressMsg(`Ensamblando página ${i + 1} de ${pages.length}...`);
          await new Promise(r => setTimeout(r, 10));
        }
        
        const pageItem = pages[i];
        
        if (pageItem.isBlank) {
          newPdf.addPage([595.28, 841.89]);
        } else {
          const sourcePdf = loadedPdfs[pageItem.fileIndex];
          const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageItem.originalPageNum - 1]);
          
          if (pageItem.rotation !== 0) {
            const currentRotation = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees(currentRotation + pageItem.rotation));
          }
          
          newPdf.addPage(copiedPage);
        }
      }

      setProgressMsg('Guardando archivo final...');
      await new Promise(r => setTimeout(r, 10));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PDF_Ordenado_y_Rotado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al generar el PDF.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  if (files.length === 0) {
    return (
      <div className="w-full max-w-3xl bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-rose-50 p-6 rounded-full mb-6">
          <LayoutGrid className="w-16 h-16 text-rose-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Ordenar y Rotar PDF</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Visualiza el contenido real de tus páginas. Ordénalas, gíralas o inserta hojas en blanco fácilmente.
        </p>
        
        <label className="bg-rose-600 hover:bg-rose-700 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-rose-600/20 hover:scale-105 active:scale-95">
          Seleccionar archivo PDF
          <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      
      <div className="flex-1 bg-slate-100/50 p-6 rounded-3xl border border-slate-200 min-h-[500px]">
        {isProcessing && progressMsg.includes('Renderizando') ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-rose-500" />
            <p className="font-medium">{progressMsg}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {pages.map((page, index) => {
              const colorTheme = page.isBlank ? { border: 'border-slate-300' } : FILE_COLORS[page.fileIndex % FILE_COLORS.length];
              
              return (
                <div 
                  key={page.id}
                  draggable={!isProcessing}
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative group flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform
                    ${draggedIndex === index ? 'opacity-40 scale-95' : 'hover:scale-105'}
                  `}
                >
                  <div className="absolute -top-3 -right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!page.isBlank && (
                      <button 
                        onClick={() => rotatePage(index)}
                        className="bg-white border border-slate-200 text-slate-600 p-1.5 rounded-full hover:bg-blue-500 hover:text-white hover:border-blue-500 shadow-sm"
                        title="Rotar página"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => removePage(index)}
                      className="bg-white border border-slate-200 text-slate-600 p-1.5 rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm"
                      title="Eliminar página"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-32 h-44 bg-white rounded-lg shadow-sm border-4 ${colorTheme.border} flex items-center justify-center overflow-hidden relative`}>
                    {page.isBlank ? (
                      <span className="text-slate-300 font-bold text-xs text-center px-2">Página en blanco</span>
                    ) : (
                      <img 
                        src={page.thumbnailUrl!} 
                        alt={`Página ${page.originalPageNum}`}
                        className="w-full h-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        draggable={false}
                      />
                    )}
                    
                    {!page.isBlank && (
                      <div className="absolute bottom-1 right-1 bg-slate-800/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {page.originalPageNum}
                      </div>
                    )}
                  </div>
                  
                  <span className="mt-2 text-xs font-bold text-slate-500">
                    {index + 1}
                  </span>
                </div>
              );
            })}

            <div className="flex gap-3">
              <label className="w-32 h-44 flex flex-col items-center justify-center bg-transparent rounded-lg border-2 border-dashed border-slate-300 hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer group">
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
                  <Plus className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-600 uppercase text-center px-2">Añadir PDF</span>
                <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />
              </label>

              <button onClick={addBlankPage} disabled={isProcessing} className="w-32 h-44 flex flex-col items-center justify-center bg-transparent rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
                  <FilePlus2 className="w-5 h-5 text-slate-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 uppercase text-center px-2">Hoja en Blanco</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Archivos</h3>
            <button onClick={resetAll} disabled={isProcessing} className="text-xs font-bold text-red-500 hover:underline">
              Restablecer
            </button>
          </div>
          
          <div className="space-y-2 mb-8 max-h-60 overflow-y-auto pr-2">
            {files.map((file, index) => {
              const colorTheme = FILE_COLORS[index % FILE_COLORS.length];
              return (
                <div key={index} className={`flex items-center gap-2 p-2.5 rounded-lg ${colorTheme.bg} ${colorTheme.text} border border-white/50`}>
                  <span className="font-bold text-sm w-5">{String.fromCharCode(65 + index)}:</span>
                  <span className="text-xs font-semibold truncate">{file.name}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Total páginas:</span>
              <span className="text-slate-800 font-bold">{pages.length}</span>
            </div>
            
            <button 
              onClick={executeOrganize} 
              disabled={isProcessing || pages.length === 0} 
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base">{progressMsg || 'Procesando...'}</span>
                </>
              ) : (
                'Guardar PDF'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}