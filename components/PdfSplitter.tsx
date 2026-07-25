'use client';

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { Scissors, FileText, X, Loader2, Settings2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

export default function PdfSplitter() {
  const { globalFile, setGlobalFile } = useFileStore();
  const [file, setFile] = useState<File | null>(globalFile);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'custom' | 'fixed'>('custom');
  
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [fixedPages, setFixedPages] = useState<number>(1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const cargarPdfGlobal = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg('Leyendo documento...');
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false, ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setTotalPages(count);
      setStartPage(1);
      setEndPage(count);
      setFixedPages(1);
      setGlobalFile(selectedFile);
    } catch (error) {
      console.error(error);
      setFile(null);
      alert('Error al leer el PDF. Verifica que no tenga contraseña.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        await cargarPdfGlobal(selectedFile);
      }
    }
    e.target.value = '';
  };

  const removeFile = () => {
    setFile(null); setTotalPages(0); setStartPage(1); setEndPage(1); setFixedPages(1);
    setGlobalFile(null);
  };

  // Sincronización automática con Zustand si ya hay un archivo cargado globalmente
  useEffect(() => {
    if (globalFile && !file) {
      cargarPdfGlobal(globalFile);
    }
  }, [globalFile, file]);

  // Escuchador de atajos de teclado (Esc para cerrar, Ctrl+A para seleccionar todo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!file) return;
      if (e.key === 'Escape') {
        removeFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && splitMode === 'custom') {
        e.preventDefault();
        setStartPage(1);
        setEndPage(totalPages);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, totalPages, splitMode]);

  const handleStartPageChange = (val: number) => {
    if (val < 1) val = 1;
    if (val > totalPages) val = totalPages;
    setStartPage(val);
    if (val > endPage) setEndPage(val);
  };

  const handleEndPageChange = (val: number) => {
    if (val < 1) val = 1;
    if (val > totalPages) val = totalPages;
    setEndPage(val);
    if (val < startPage) setStartPage(val);
  };

  const executeSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    let url: string | null = null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const originalName = file.name.replace(/\.[^/.]+$/, "");

      if (splitMode === 'custom') {
        setProgressMsg('Extrayendo páginas...');
        await new Promise(r => setTimeout(r, 10));

        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const splitPdfBytes = await newPdf.save();
        const blob = new Blob([splitPdfBytes as any], { type: 'application/pdf' });
        url = URL.createObjectURL(blob);
        
        const link = document.createElement('a'); 
        link.href = url; 
        link.download = `${originalName}_Pag_${startPage}_a_${endPage}.pdf`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        
      } else if (splitMode === 'fixed') {
        const chunk = fixedPages;
        if (chunk < 1) throw new Error('Cantidad inválida');
        
        const zip = new JSZip();
        const totalPdfs = Math.ceil(totalPages / chunk);

        for (let i = 0; i < totalPages; i += chunk) {
          const currentPart = Math.floor(i / chunk) + 1;
          setProgressMsg(`Generando parte ${currentPart} de ${totalPdfs}...`);
          await new Promise(r => setTimeout(r, 10)); 

          const newPdf = await PDFDocument.create();
          const end = Math.min(i + chunk, totalPages);
          const pageIndices = Array.from({ length: end - i }, (_, idx) => i + idx);
          
          const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page) => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          const partString = currentPart.toString().padStart(totalPdfs.toString().length, '0');
          zip.file(`${originalName}_Parte_${partString}.pdf`, pdfBytes);
        }

        setProgressMsg('Comprimiendo archivo ZIP (0%)...');
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
          setProgressMsg(`Comprimiendo ZIP (${metadata.percent.toFixed(0)}%)...`);
        });

        url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a'); 
        link.href = url; 
        link.download = `${originalName}_Dividido.zip`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error durante la extracción.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  if (!file) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 p-6 rounded-full mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <Scissors className="w-14 h-14 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Dividir archivo PDF</h2>
        <p className="text-slate-400 mb-6 text-center max-w-md leading-relaxed text-sm">
          Extrae rangos específicos o divide tu PDF en múltiples archivos de tamaño fijo de forma local y segura.
        </p>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8">
          <ShieldCheck className="w-4 h-4" />
          <span>Procesamiento 100% Local & Seguro</span>
        </div>
        
        <label className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-4 rounded-xl cursor-pointer font-bold text-lg transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 border border-indigo-400/30">
          Seleccionar archivo PDF
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
        </label>
        {isProcessing && <p className="mt-4 text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> {progressMsg}</p>}
      </motion.div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      
      <div className="flex-1 bg-slate-100/50 p-6 rounded-3xl border border-slate-200 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        
        <div className="absolute top-4 left-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <span className="font-semibold text-slate-700 truncate text-sm">{file.name}</span>
            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-md font-bold">{totalPages} págs</span>
          </div>
          <button onClick={removeFile} disabled={isProcessing} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-12 w-full flex flex-col items-center justify-center">
          <h4 className="text-slate-400 font-medium mb-6 uppercase tracking-widest text-sm">
            {splitMode === 'custom' ? 'Rango a extraer' : 'División por bloques'}
          </h4>
          
          {splitMode === 'custom' ? (
            <div className="border-2 border-dashed border-slate-300 p-8 rounded-3xl flex items-center gap-4 sm:gap-8 bg-white shadow-sm">
              <PageThumbnail pageNum={startPage} />
              {startPage !== endPage && (
                <>
                  <span className="text-3xl text-slate-300 font-black tracking-[0.3em]">...</span>
                  <PageThumbnail pageNum={endPage} />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 max-w-lg">
              {Array.from({ length: Math.min(Math.ceil(totalPages / fixedPages), 4) }).map((_, i) => {
                const start = (i * fixedPages) + 1;
                const end = Math.min(start + fixedPages - 1, totalPages);
                return (
                  <div key={i} className="border-2 border-dashed border-slate-300 p-4 rounded-2xl bg-white shadow-sm flex flex-col items-center">
                    <div className="w-12 h-16 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center mb-2">
                      <FileText className="w-6 h-6 text-indigo-300" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{start} - {end}</span>
                  </div>
                );
              })}
              {Math.ceil(totalPages / fixedPages) > 4 && (
                <div className="flex items-center justify-center p-4">
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-full">
                    + {Math.ceil(totalPages / fixedPages) - 4} partes más
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-xl">
            <Settings2 className="w-6 h-6 text-indigo-600" /> Opciones
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setSplitMode('custom')} 
              disabled={isProcessing} 
              className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${splitMode === 'custom' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Rango
            </button>
            <button 
              onClick={() => setSplitMode('fixed')} 
              disabled={isProcessing} 
              className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${splitMode === 'fixed' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Fijo
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {splitMode === 'custom' ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Desde pág.</label>
                  <input 
                    type="number" min={1} max={totalPages} 
                    value={startPage} 
                    onChange={e => handleStartPageChange(Number(e.target.value))} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-semibold text-slate-700 bg-slate-50" 
                    disabled={isProcessing}
                  />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 mt-5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Hasta pág.</label>
                  <input 
                    type="number" min={1} max={totalPages} 
                    value={endPage} 
                    onChange={e => handleEndPageChange(Number(e.target.value))} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-semibold text-slate-700 bg-slate-50" 
                    disabled={isProcessing}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Páginas por documento</label>
                <input 
                  type="number" min={1} max={totalPages}
                  value={fixedPages} 
                  onChange={e => setFixedPages(Math.max(1, Number(e.target.value)))} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 bg-slate-50" 
                  disabled={isProcessing}
                />
                <p className="text-xs text-slate-400 mt-2">
                  Se generarán <strong>{Math.ceil(totalPages / fixedPages)}</strong> archivos PDF.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <button 
              onClick={executeSplit} 
              disabled={isProcessing} 
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base">{progressMsg || 'Procesando...'}</span>
                </>
              ) : (
                splitMode === 'fixed' ? 'Descargar ZIP' : 'Dividir PDF'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function PageThumbnail({ pageNum }: { pageNum: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-24 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex flex-col overflow-hidden relative">
        <div className="h-3 w-full bg-red-500"></div>
        <div className="flex-1 p-3 flex flex-col gap-2 opacity-30">
          <div className="h-1.5 w-3/4 bg-slate-400 rounded-full"></div>
          <div className="h-1.5 w-full bg-slate-400 rounded-full"></div>
          <div className="h-1.5 w-5/6 bg-slate-400 rounded-full"></div>
          <div className="h-1.5 w-full bg-slate-400 rounded-full"></div>
          <div className="h-1.5 w-2/3 bg-slate-400 rounded-full"></div>
        </div>
      </div>
      <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full">
        Pág. {pageNum}
      </span>
    </div>
  );
}