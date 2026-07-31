'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  Trash2, FileText, X, Loader2, FilePlus, Sliders, ChevronDown, ChevronUp, 
  FileDown, UploadCloud, Layers, Filter, Sparkles, CheckSquare, 
  Square, ZoomIn, ShieldCheck, ArrowLeft, Zap, Cpu, LayoutGrid, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type PageThumb = {
  pageNum: number; // 1-indexed
  thumbnailUrl: string | null;
  selectedToDelete: boolean;
  isBlank: boolean;
};

export default function PdfPageDeleter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [pages, setPages] = useState<PageThumb[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // RESULTADOS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // OPCIONES AVANZADAS PDFBLACK
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Depurado');
  const [renumberPages, setRenumberPages] = useState<boolean>(true);
  const [previewZoomPage, setPreviewZoomPage] = useState<PageThumb | null>(null);

  const selectedCount = useMemo(() => {
    return pages.filter(p => p.selectedToDelete).length;
  }, [pages]);

  const pdfUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Cargar y renderizar miniaturas Canvas del PDF
  const cargarPdf = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Renderizando páginas...' : 'Rendering pages...');
    setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, "") + '_Depurado');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const count = pdf.numPages;

      const thumbs: PageThumb[] = [];
      for (let p = 1; p <= count; p++) {
        setProgressMsg(isEs ? `Renderizando pág ${p} de ${count}...` : `Rendering page ${p} of ${count}...`);
        setProgressPercent(10 + Math.floor((p / count) * 80));
        if (p % 3 === 0) await new Promise(r => setTimeout(r, 5));

        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        let isBlankPage = false;
        let dataUrl: string | null = null;

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
          dataUrl = canvas.toDataURL('image/jpeg', 0.6);

          // Detección heurística de página en blanco
          const imgData = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let nonWhitePixels = 0;
          for (let i = 0; i < imgData.length; i += 16) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            if (r < 240 || g < 240 || b < 240) {
              nonWhitePixels++;
            }
          }
          if (nonWhitePixels < (imgData.length / 16) * 0.005) {
            isBlankPage = true;
          }
        }

        thumbs.push({
          pageNum: p,
          thumbnailUrl: dataUrl,
          selectedToDelete: false,
          isBlank: isBlankPage
        });
      }

      setPages(thumbs);
      setProgressPercent(100);
      toast.success(isEs ? `${count} páginas cargadas` : `${count} pages loaded`);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
      setFile(null);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  }, [isEs, setGlobalFile]);

  useEffect(() => {
    if (file && pages.length === 0) {
      let isMounted = true;
      (async () => {
        setIsProcessing(true);
        setProgressPercent(10);
        setProgressMsg(isEs ? 'Renderizando páginas...' : 'Rendering pages...');
        setFilePrefix(file.name.replace(/\.[^/.]+$/, "") + '_Depurado');

        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const count = pdf.numPages;

          const thumbs: PageThumb[] = [];
          for (let p = 1; p <= count; p++) {
            if (!isMounted) break;
            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            let isBlankPage = false;
            let dataUrl: string | null = null;

            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
              dataUrl = canvas.toDataURL('image/jpeg', 0.6);

              const imgData = context.getImageData(0, 0, canvas.width, canvas.height).data;
              let nonWhitePixels = 0;
              for (let i = 0; i < imgData.length; i += 16) {
                if (imgData[i] < 240 || imgData[i + 1] < 240 || imgData[i + 2] < 240) nonWhitePixels++;
              }
              if (nonWhitePixels < (imgData.length / 16) * 0.005) isBlankPage = true;
            }

            thumbs.push({ pageNum: p, thumbnailUrl: dataUrl, selectedToDelete: false, isBlank: isBlankPage });
          }

          if (isMounted) {
            setPages(thumbs);
            setProgressPercent(100);
          }
        } catch {
          if (isMounted) setFile(null);
        } finally {
          if (isMounted) {
            setIsProcessing(false);
            setProgressMsg('');
          }
        }
      })();
      return () => { isMounted = false; };
    }
  }, [file, pages.length, isEs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setDownloadUrl(null);
        await cargarPdf(selected);
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setPages([]);
    setDownloadUrl(null);
    setGlobalFile(null);
    setRangeInput('');
  }, [setGlobalFile]);

  const toggleSelectPage = (index: number) => {
    setPages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selectedToDelete: !updated[index].selectedToDelete };
      return updated;
    });
    setDownloadUrl(null);
  };

  const selectEvenPages = () => {
    setPages(prev => prev.map(p => ({ ...p, selectedToDelete: p.pageNum % 2 === 0 })));
    setDownloadUrl(null);
    toast.info(isEs ? 'Páginas pares seleccionadas para eliminar' : 'Even pages selected for deletion');
  };

  const selectOddPages = () => {
    setPages(prev => prev.map(p => ({ ...p, selectedToDelete: p.pageNum % 2 !== 0 })));
    setDownloadUrl(null);
    toast.info(isEs ? 'Páginas impares seleccionadas para eliminar' : 'Odd pages selected for deletion');
  };

  const selectBlankPages = () => {
    const blankCount = pages.filter(p => p.isBlank).length;
    setPages(prev => prev.map(p => ({ ...p, selectedToDelete: p.isBlank })));
    setDownloadUrl(null);
    if (blankCount > 0) {
      toast.success(isEs ? `${blankCount} páginas en blanco detectadas y seleccionadas` : `${blankCount} blank pages detected and selected`);
    } else {
      toast.info(isEs ? 'No se detectaron páginas en blanco' : 'No blank pages detected');
    }
  };

  const clearSelection = () => {
    setPages(prev => prev.map(p => ({ ...p, selectedToDelete: false })));
    setRangeInput('');
    setDownloadUrl(null);
  };

  const invertSelection = () => {
    setPages(prev => prev.map(p => ({ ...p, selectedToDelete: !p.selectedToDelete })));
    setDownloadUrl(null);
  };

  // Sincronizar input de rangos de texto (ej. 2, 5, 8-12) con las miniaturas
  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    if (!val.trim()) {
      setPages(prev => prev.map(p => ({ ...p, selectedToDelete: false })));
      return;
    }

    const indicesToDelete: Set<number> = new Set();
    val.split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= pages.length) indicesToDelete.add(i);
          }
        }
      } else {
        const pNum = parseInt(trimmed, 10);
        if (!isNaN(pNum) && pNum >= 1 && pNum <= pages.length) {
          indicesToDelete.add(pNum);
        }
      }
    });

    setPages(prev => prev.map(p => ({
      ...p,
      selectedToDelete: indicesToDelete.has(p.pageNum)
    })));
  };

  const executeDelete = async () => {
    if (!file) {
      toast.error(isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file');
      return;
    }

    const pagesToKeep = pages.filter(p => !p.selectedToDelete).map(p => p.pageNum - 1);
    if (pagesToKeep.length === 0) {
      toast.error(isEs ? 'No puedes eliminar todas las páginas del PDF' : 'You cannot delete all pages of the PDF');
      return;
    }

    if (selectedCount === 0) {
      toast.error(isEs ? 'Selecciona al menos una página para eliminar' : 'Select at least one page to delete');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Procesando y purgando páginas...' : 'Processing and purging pages...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      const helveticaFont = await newPdf.embedFont(StandardFonts.Helvetica);

      setProgressPercent(40);
      const copiedPages = await newPdf.copyPages(srcDoc, pagesToKeep);

      copiedPages.forEach((p, idx) => {
        if (renumberPages) {
          const { width } = p.getSize();
          p.drawText(`Página ${idx + 1} de ${copiedPages.length}`, {
            x: width / 2 - 30,
            y: 15,
            size: 9,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
        newPdf.addPage(p);
      });

      setProgressPercent(85);
      setProgressMsg(isEs ? 'Generando PDF limpio...' : 'Generating clean PDF...');

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix}.pdf`;

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      triggerDownload(localUrl, outName);
      setProgressPercent(100);
      toast.success(isEs ? `¡${selectedCount} páginas eliminadas con éxito!` : `¡${selectedCount} pages deleted successfully!`);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al eliminar las páginas' : 'Error deleting pages');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/organizar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "002 / PURGA Y ELIMINACIÓN DE PÁGINAS PDF" : "002 / PAGE PURGING & DELETION"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Trash2 className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "ELIMINAR PÁGINAS DE DOCUMENTOS PDF" : "DELETE PDF PAGES"}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button 
              onClick={removeFile} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Quitar archivo" : "Remove file"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* VISTA DROPZONE VACÍA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer"
        >
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? "ELIMINAR PÁGINAS DE DOCUMENTOS PDF" : "DELETE PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Selecciona y remueve hojas no deseadas o detecta páginas en blanco de forma 100% confidencial y local." : "Select and remove unwanted pages or detect blank pages 100% locally."}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y GRID DE PÁGINAS */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: REJILLA INTERACTIVA DE PÁGINAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA Y SELECCIÓN DE PÁGINAS (${pages.length} HOJAS)` : `001 / PREVIEW & PAGE SELECTION (${pages.length} SHEETS)`}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                  {selectedCount} {isEs ? 'marcadas' : 'marked'}
                </span>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* BARRA DE HERRAMIENTAS Y FILTROS RÁPIDOS */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] mb-4">
              <span className="text-zinc-300 font-bold">{isEs ? 'Filtros Masivos:' : 'Mass Filters:'}</span>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button" onClick={selectEvenPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Pares' : 'Evens'}
                </button>
                <button
                  type="button" onClick={selectOddPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Impares' : 'Odds'}
                </button>
                <button
                  type="button" onClick={selectBlankPages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Filter className="w-3 h-3 text-amber-400" />
                  {isEs ? 'Blancas' : 'Blanks'}
                </button>
                <button
                  type="button" onClick={invertSelection}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Invertir' : 'Invert'}
                </button>
                <button
                  type="button" onClick={clearSelection}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Limpiar' : 'Clear'}
                </button>
              </div>
            </div>

            {/* GRID DE MINIATURAS CANVAS DE PÁGINAS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[560px] overflow-y-auto pr-1">
              {pages.map((p, idx) => (
                <motion.div
                  key={p.pageNum}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => toggleSelectPage(idx)}
                  className={`relative rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all duration-200 group overflow-hidden ${
                    p.selectedToDelete
                      ? 'border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                      : 'border-white/10 hover:border-white/30 bg-zinc-950 hover:bg-zinc-900'
                  }`}
                >
                  {/* BADGE DE NÚMERO DE PÁGINA */}
                  <div className="w-full flex items-center justify-between mb-1.5 font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${p.selectedToDelete ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                      Pág. {p.pageNum}
                    </span>
                    {p.isBlank && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                        {isEs ? 'Blanca' : 'Blank'}
                      </span>
                    )}
                  </div>

                  {/* MINIATURA CANVAS / IMAGEN */}
                  <div className="w-full h-36 bg-white rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnailUrl} alt={`Página ${p.pageNum}`} className="w-full h-full object-contain" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    )}

                    {/* OVERLAY SI ESTÁ SELECCIONADA PARA ELIMINAR */}
                    {p.selectedToDelete && (
                      <div className="absolute inset-0 bg-red-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 text-white animate-fade-in font-mono">
                        <X className="w-8 h-8 text-red-300 stroke-[3]" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">
                          {isEs ? 'Eliminada' : 'Deleted'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BOTÓN FLOTANTE DE ZOOM / LUPA EN HOVER */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewZoomPage(p); }}
                    className="absolute bottom-3 right-3 p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title={isEs ? "Previsualizar hoja" : "Zoom page"}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>

          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              {/* TÍTULO PRINCIPAL: PANEL DE CONTROL */}
              <div className="mb-5 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* SELECCIÓN POR TEXTO / RANGO */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Eliminación por Texto / Rango:" : "Range Removal Input:"}</label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => handleRangeInputChange(e.target.value)}
                  placeholder="ej: 2, 5, 8-12"
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {isEs ? 'Escribe páginas o rangos separados por comas para desestimar' : 'Enter pages or ranges separated by commas'}
                </span>
              </div>

              {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer my-4 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* SECCIÓN DESPLEGABLE: OPCIONES AVANZADAS */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-1 border-t border-white/5 font-mono overflow-hidden"
                  >
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo del Archivo Resultante:" : "Output File Prefix:"}</label>
                      <input
                        type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Depurado"
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "AJUSTES DE NUMERACIÓN" : "NUMBERING SETTINGS"}</label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={renumberPages} onChange={(e) => setRenumberPages(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Re-numerar páginas en pie de página (Página N / M)" : "Re-number footer pages (Page N / M)"}</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN CON BARRA DE PROGRESO */}
            <div className="pt-4 border-t border-white/10 font-sans">
              {isProcessing && (
                <div className="mb-3 space-y-1.5 font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-300">
                    <span className="truncate max-w-[200px]">{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div style={{ width: `${progressPercent}%` }} className="h-full bg-white transition-all duration-300" />
                  </div>
                </div>
              )}

              <button 
                onClick={executeDelete} 
                disabled={isProcessing || !file || selectedCount === 0} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (!file 
                        ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file')
                        : (selectedCount === 0 ? (isEs ? 'Selecciona hojas para eliminar' : 'Select pages to delete') : (isEs ? `Eliminar ${selectedCount} Páginas del PDF →` : `Delete ${selectedCount} Pages from PDF →`)))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE PÁGINA */}
      {previewZoomPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/20 p-6 rounded-2xl max-w-xl w-full flex flex-col items-center gap-4 relative shadow-2xl font-mono">
            <button
              type="button" onClick={() => setPreviewZoomPage(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-white font-bold text-sm">
              {isEs ? `Previsualización - Página ${previewZoomPage.pageNum}` : `Preview - Page ${previewZoomPage.pageNum}`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner">
              {previewZoomPage.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewZoomPage.thumbnailUrl} alt={`Página ${previewZoomPage.pageNum}`} className="max-h-[65vh] object-contain" />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                toggleSelectPage(previewZoomPage.pageNum - 1);
                setPreviewZoomPage(null);
              }}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                previewZoomPage.selectedToDelete
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-red-500 text-white hover:bg-red-400'
              }`}
            >
              {previewZoomPage.selectedToDelete ? (isEs ? 'Restaurar Página' : 'Restore Page') : (isEs ? 'Marcar para Eliminar' : 'Mark for Deletion')}
            </button>
          </div>
        </div>
      )}

      {/* ── GUÍA DE USO: CÓMO ELIMINAR PÁGINAS ── */}
      <div className="w-full mt-14 space-y-6 font-sans">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo eliminar páginas de un PDF?' : 'How to delete pages from a PDF?'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {isEs ? 'Guía rápida para seleccionar y borrar páginas no deseadas de un documento PDF.' : 'Quick guide to select and delete unwanted pages from a PDF document.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: '01', titleEs: 'Sube tu PDF', titleEn: 'Upload your PDF', descEs: 'Arrastra el PDF a la zona de carga o haz clic para seleccionarlo. El visor cargará automáticamente las miniaturas de todas las páginas.', descEn: 'Drag the PDF to the upload zone or click to select it. The viewer automatically loads thumbnails of all pages.' },
              { step: '02', titleEs: 'Selecciona las páginas a eliminar', titleEn: 'Select pages to delete', descEs: 'Haz clic sobre las miniaturas de las páginas que quieres eliminar. Las páginas seleccionadas se marcan visualmente. Puedes seleccionar múltiples páginas a la vez.', descEn: 'Click on the thumbnails of pages you want to delete. Selected pages are visually marked. You can select multiple pages at once.' },
              { step: '03', titleEs: 'Revisa la selección', titleEn: 'Review your selection', descEs: 'Verifica el resumen de páginas seleccionadas para asegurarte de que no eliminarás páginas incorrectas. Puedes deseleccionar páginas haciendo clic nuevamente.', descEn: 'Check the summary of selected pages to make sure you won\'t delete the wrong pages. You can deselect pages by clicking again.' },
              { step: '04', titleEs: 'Eliminar páginas', titleEn: 'Delete pages', descEs: 'Haz clic en "Eliminar páginas →". El motor procesa el documento al instante y el PDF resultante (sin las páginas eliminadas) queda listo para descargar.', descEn: 'Click "Delete pages →". The engine processes the document instantly and the resulting PDF (without deleted pages) is ready to download.' },
            ].map((item) => (
              <div key={item.step} className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 flex flex-col gap-2 hover:border-white/20 transition-all">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-full w-fit">{item.step}</span>
                <h4 className="text-sm font-bold text-white">{isEs ? item.titleEs : item.titleEn}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.descEs : item.descEn}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start gap-3 mb-5">
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '💡 Consejos para eliminar páginas correctamente' : '💡 Tips for correctly deleting pages'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {isEs ? 'Evita errores comunes al seleccionar y eliminar páginas de tu PDF.' : 'Avoid common mistakes when selecting and deleting pages from your PDF.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
            {[
              { labelEs: 'La eliminación es permanente', labelEn: 'Deletion is permanent', descEs: 'Las páginas eliminadas se borran definitivamente del nuevo PDF. Guarda siempre una copia del original antes de procesar el documento.', descEn: 'Deleted pages are permanently removed from the new PDF. Always keep a copy of the original before processing.' },
              { labelEs: 'Selección múltiple por clic', labelEn: 'Multiple selection by click', descEs: 'Haz clic en cada miniatura para seleccionarla. Puedes seleccionar páginas no contiguas (ej. páginas 2, 5 y 9) haciendo clic individualmente en cada una.', descEn: 'Click each thumbnail to select it. You can select non-contiguous pages (e.g., pages 2, 5, and 9) by clicking individually on each one.' },
              { labelEs: 'Rango de páginas rápido', labelEn: 'Quick page range', descEs: 'Usa la opción de rango para seleccionar rápidamente un intervalo de páginas consecutivas sin tener que hacer clic en cada miniatura una por una.', descEn: 'Use the range option to quickly select an interval of consecutive pages without having to click each thumbnail one by one.' },
              { labelEs: 'No se puede eliminar la única página', labelEn: 'Cannot delete the only page', descEs: 'Un PDF debe tener al menos 1 página. Si tu documento tiene una sola página, el motor bloqueará la eliminación para evitar crear un PDF vacío inválido.', descEn: 'A PDF must have at least 1 page. If your document has a single page, the engine will block deletion to avoid creating an invalid empty PDF.' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <Sliders className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">{isEs ? tip.labelEs : tip.labelEn}:</strong> {isEs ? tip.descEs : tip.descEn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN INFORMATIVA INFERIOR (DEBAJO DE LAS CAJAS PRINCIPALES) */}
      <div className="w-full space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12 mb-12">
        {/* BLOQUE 1: PRIVACIDAD Y PROCESAMIENTO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Qué sucede exactamente con tus archivos al eliminar páginas?' : 'What exactly happens to your files during PDF page deletion?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 PRIVACIDAD ABSOLUTA • 100% PROCESAMIENTO LOCAL' : '🔒 ABSOLUTE PRIVACY • 100% LOCAL PROCESSING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Tus documentos nunca salen de tu dispositivo' : 'Your documents never leave your device'}
              </strong>
              <p>
                {isEs
                  ? 'A diferencia de otros servicios en línea, tus archivos PDF NUNCA se cargan a ningún servidor ni almacenamiento en la nube. La purga binaria y la re-indexación de objetos se ejecutan en tiempo real dentro de la memoria RAM de tu propio navegador web.'
                  : 'Unlike other online services, your PDF files are NEVER uploaded to any server or cloud storage. Binary purging and object re-indexing run in real time inside your browser RAM.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Destrucción inmediata de memoria' : 'Immediate memory purge'}
              </strong>
              <p>
                {isEs
                  ? 'Una vez eliminadas las hojas seleccionadas y descargado el archivo depurado, no queda ningún rastro en disco ni en servidores. Al cerrar la pestaña o refrescar la página, el navegador purga por completo el espacio en memoria.'
                  : 'Once selected pages are deleted and you download the purged file, no traces remain on disk or servers. Closing the tab purges all memory completely.'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: PASOS TÉCNICOS PASO A PASO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? 'El procedimiento técnico de purga paso a paso' : 'Step-by-step technical page deletion procedure'}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {isEs ? 'Cómo nuestro motor analiza, desestima y re-indexa las páginas retenidas' : 'How our engine analyzes, discards, and re-indexes remaining pages'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">01 / DIAGNÓSTICO</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '1. Renderizado y Detección' : '1. Rendering & Detection'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Generamos las miniaturas en Canvas y ejecutamos un análisis heurístico para detectar hojas en blanco vacías.'
                  : 'Generates Canvas thumbnails and runs heuristic analysis to locate blank empty pages.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">02 / SELECCIÓN</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '2. Filtros e Indicaciones' : '2. Filters & Selection'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Aplicamos tus selecciones visuales o filtros masivos (pares, impares, texto) para marcar las hojas a eliminar.'
                  : 'Applies your visual selections or mass filters (even, odd, text ranges) to mark pages for removal.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">03 / EXTRACCIÓN</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '3. Extracción Retenida' : '3. Retained Extraction'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Copiamos únicamente las páginas no marcadas a un nuevo documento binario, aislando objetos no utilizados.'
                  : 'Copies only unmarked pages into a new binary document, isolating unused objects.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-zinc-500 mb-2 block">04 / COMPILACIÓN</span>
              <h3 className="font-bold text-white text-sm mb-2 font-sans">
                {isEs ? '4. Re-numeración y Guardado' : '4. Re-numbering & Save'}
              </h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {isEs
                  ? 'Actualizamos la foliación continua de las páginas retenidas y compilamos el PDF depurado listo para descarga.'
                  : 'Updates continuous footer page numbers on remaining sheets and compiles the purged PDF ready for download.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
