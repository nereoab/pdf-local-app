'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import { 
  RotateCw, RotateCcw, FileText, X, Loader2, FilePlus, Sliders, ChevronDown, ChevronUp, 
  FileDown, UploadCloud, Layers, Filter, Sparkles, CheckSquare, 
  Square, ZoomIn, Compass, RefreshCw, ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus, LayoutGrid, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type PageThumb = {
  pageNum: number; // 1-indexed
  thumbnailUrl: string | null;
  rotation: number; // 0, 90, 180, 270
  isLandscape: boolean;
  selected: boolean;
};

export default function PdfRotator() {
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
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Rotado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [previewZoomPage, setPreviewZoomPage] = useState<PageThumb | null>(null);

  const rotatedCount = useMemo(() => {
    return pages.filter(p => p.rotation !== 0).length;
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
    setProgressMsg(isEs ? 'Cargando y analizando páginas...' : 'Loading and analyzing pages...');
    setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, "") + '_Rotado');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const count = pdf.numPages;

      const thumbs: PageThumb[] = [];
      for (let p = 1; p <= count; p++) {
        setProgressMsg(isEs ? `Procesando pág ${p} de ${count}...` : `Processing page ${p} of ${count}...`);
        setProgressPercent(10 + Math.floor((p / count) * 80));
        if (p % 3 === 0) await new Promise(r => setTimeout(r, 5));

        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        let dataUrl: string | null = null;
        const isLandscape = viewport.width > viewport.height;

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
          dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        }

        thumbs.push({
          pageNum: p,
          thumbnailUrl: dataUrl,
          rotation: 0,
          isLandscape,
          selected: false
        });
      }

      setPages(thumbs);
      setProgressPercent(100);
      toast.success(isEs ? `${count} páginas listas para rotación` : `${count} pages ready for rotation`);
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
        setProgressMsg(isEs ? 'Cargando y analizando páginas...' : 'Loading and analyzing pages...');
        setFilePrefix(file.name.replace(/\.[^/.]+$/, "") + '_Rotado');

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

            let dataUrl: string | null = null;
            const isLandscape = viewport.width > viewport.height;

            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
              dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            }

            thumbs.push({
              pageNum: p,
              thumbnailUrl: dataUrl,
              rotation: 0,
              isLandscape,
              selected: false
            });
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

  // ROTACIÓN DE PÁGINAS INDIVIDUALES
  const rotateSinglePage = (index: number, degreesToAdd: number) => {
    setPages(prev => {
      const updated = [...prev];
      const newRotation = (updated[index].rotation + degreesToAdd + 360) % 360;
      updated[index] = { ...updated[index], rotation: newRotation };
      return updated;
    });
    setDownloadUrl(null);
  };

  // ROTACIÓN MASIVA O POR FILTROS
  const rotateAllPages = (degreesToAdd: number) => {
    setPages(prev => prev.map(p => ({
      ...p,
      rotation: (p.rotation + degreesToAdd + 360) % 360
    })));
    setDownloadUrl(null);
    toast.success(isEs ? `Todas las páginas giradas ${degreesToAdd}°` : `All pages rotated ${degreesToAdd}°`);
  };

  const resetAllRotations = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: 0 })));
    setDownloadUrl(null);
    toast.info(isEs ? 'Rotaciones restablecidas a 0°' : 'Rotations reset to 0°');
  };

  const normalizeLandscapePages = () => {
    let count = 0;
    setPages(prev => prev.map(p => {
      if (p.isLandscape && p.rotation === 0) {
        count++;
        return { ...p, rotation: 90 };
      }
      return p;
    }));
    setDownloadUrl(null);
    if (count > 0) {
      toast.success(isEs ? `${count} páginas horizontales normalizadas a 90°` : `${count} landscape pages normalized to 90°`);
    } else {
      toast.info(isEs ? 'No se encontraron páginas horizontales sin rotar' : 'No unrotated landscape pages found');
    }
  };

  const toggleSelectPage = (index: number) => {
    setPages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const selectEvenPages = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: p.pageNum % 2 === 0 })));
  };

  const selectOddPages = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: p.pageNum % 2 !== 0 })));
  };

  const selectLandscapePages = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: p.isLandscape })));
  };

  const clearSelection = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const rotateSelectedPages = (degreesToAdd: number) => {
    const selectedCount = pages.filter(p => p.selected).length;
    if (selectedCount === 0) {
      toast.error(isEs ? 'Selecciona al menos una página primero' : 'Select at least one page first');
      return;
    }

    setPages(prev => prev.map(p => {
      if (p.selected) {
        return { ...p, rotation: (p.rotation + degreesToAdd + 360) % 360 };
      }
      return p;
    }));
    setDownloadUrl(null);
    toast.success(isEs ? `${selectedCount} páginas seleccionadas giradas ${degreesToAdd}°` : `${selectedCount} selected pages rotated ${degreesToAdd}°`);
  };

  // SINCRONIZAR ENTRADA DE RANGOS DE TEXTO CON SELECCIÓN DE ROTACIÓN
  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    if (!val.trim()) return;

    const indicesToSelect: Set<number> = new Set();
    val.split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= pages.length) indicesToSelect.add(i);
          }
        }
      } else {
        const pNum = parseInt(trimmed, 10);
        if (!isNaN(pNum) && pNum >= 1 && pNum <= pages.length) {
          indicesToSelect.add(pNum);
        }
      }
    });

    setPages(prev => prev.map(p => ({
      ...p,
      selected: indicesToSelect.has(p.pageNum)
    })));
  };

  const executeRotate = async () => {
    if (!file || pages.length === 0) {
      toast.error(isEs ? 'Carga un archivo PDF' : 'Upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Aplicando matriz de rotación vectorial...' : 'Applying vector rotation matrix...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pdfPages = pdfDoc.getPages();

      pdfPages.forEach((page, idx) => {
        const pageMeta = pages[idx];
        if (pageMeta && pageMeta.rotation !== 0) {
          const currentRot = page.getRotation().angle;
          page.setRotation(degrees((currentRot + pageMeta.rotation) % 360));
        }

        if (renumberPages) {
          const { width } = page.getSize();
          page.drawText(`Página ${idx + 1} de ${pdfPages.length}`, {
            x: width / 2 - 30,
            y: 15,
            size: 9,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      });

      setProgressPercent(85);
      setProgressMsg(isEs ? 'Compilando PDF rotado...' : 'Compiling rotated PDF...');

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix}.pdf`;

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      triggerDownload(localUrl, outName);
      setProgressPercent(100);
      toast.success(isEs ? '¡Documento PDF rotado con éxito!' : 'PDF document rotated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al guardar la rotación del documento' : 'Error saving document rotation');
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
              {isEs ? "002 / ROTACIÓN Y ORIENTACIÓN DE DOCUMENTOS PDF" : "002 / PDF ROTATION & ORIENTATION"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <RotateCw className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "ROTAR O CAMBIAR ORIENTACIÓN DE PÁGINAS PDF" : "ROTATE PDF PAGES"}
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
            {isEs ? "ROTAR O CAMBIAR ORIENTACIÓN DE PÁGINAS PDF" : "ROTATE PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Gira hojas individuales o masivamente a 90°, 180° o 270° de forma 100% confidencial y local." : "Rotate single pages or entire documents to 90°, 180°, or 270° 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y GRID DE PÁGINAS ROTABLES */
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
                <span>{isEs ? `001 / VISTA PREVIA Y ORIENTACIÓN DE PÁGINAS (${pages.length} HOJAS)` : `001 / PREVIEW & PAGE ORIENTATION (${pages.length} SHEETS)`}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                  {rotatedCount} {isEs ? 'rotadas' : 'rotated'}
                </span>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* BARRA DE SELECCIÓN RÁPIDA DE FILTROS */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] mb-4">
              <span className="text-zinc-300 font-bold">{isEs ? 'Selección Rápida:' : 'Quick Select:'}</span>

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
                  type="button" onClick={selectLandscapePages}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Filter className="w-3 h-3 text-white" />
                  {isEs ? 'Horizontales' : 'Landscapes'}
                </button>
                <button
                  type="button" onClick={clearSelection}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {isEs ? 'Limpiar' : 'Clear'}
                </button>
              </div>
            </div>

            {/* GRID DE MINIATURAS CANVAS CON ROTACIÓN VISUAL */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[560px] overflow-y-auto pr-1">
              {pages.map((p, idx) => (
                <motion.div
                  key={p.pageNum}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => toggleSelectPage(idx)}
                  className={`relative rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all duration-200 group overflow-hidden ${
                    p.selected
                      ? 'border-white bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                      : p.rotation !== 0
                      ? 'border-white/40 bg-zinc-950'
                      : 'border-white/10 hover:border-white/30 bg-zinc-950'
                  }`}
                >
                  {/* BADGES DE PÁGINA Y ROTACIÓN */}
                  <div className="w-full flex items-center justify-between mb-1.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-300">
                      Pág. {p.pageNum}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${p.rotation !== 0 ? 'bg-white text-black' : 'text-zinc-500'}`}>
                      {p.rotation}°
                    </span>
                  </div>

                  {/* MINIATURA CANVAS ROTADA VISUALMENTE EN TIEMPO REAL */}
                  <div className="w-full h-36 bg-white rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner p-1">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={p.thumbnailUrl} 
                        alt={`Página ${p.pageNum}`} 
                        className="w-full h-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* CONTROLES FLOTANTES INDIVIDUALES */}
                  <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button" onClick={(e) => { e.stopPropagation(); rotateSinglePage(idx, 90); }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors"
                        title={isEs ? "Girar 90° Derecha" : "Rotate 90° CW"}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button" onClick={(e) => { e.stopPropagation(); rotateSinglePage(idx, -90); }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors"
                        title={isEs ? "Girar 90° Izquierda" : "Rotate 90° CCW"}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button" onClick={(e) => { e.stopPropagation(); setPreviewZoomPage(p); }}
                      className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors"
                      title={isEs ? "Zoom" : "Zoom"}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

              {/* BOTONES DE ROTACIÓN MASIVA UNIFICADA */}
              <div className="space-y-3 font-mono text-xs mb-5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Rotación Masiva de Todo el Documento:" : "Mass Full Document Rotation:"}</span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={() => rotateAllPages(90)} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar 90° Derecha' : 'Rotate 90° CW'}</span>
                  </button>

                  <button
                    type="button" onClick={() => rotateAllPages(-90)} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar 90° Izquierda' : 'Rotate 90° CCW'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={() => rotateAllPages(180)} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar 180° (Invertir)' : 'Rotate 180°'}</span>
                  </button>

                  <button
                    type="button" onClick={resetAllRotations} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEs ? 'Restablecer (0°)' : 'Reset (0°)'}</span>
                  </button>
                </div>

                {/* NORMALIZAR HORIZONTALES AUTOMÁTICO */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold">{isEs ? "Normalización Inteligente:" : "Smart Normalization:"}</span>
                  <button
                    type="button" onClick={normalizeLandscapePages} disabled={pages.length === 0}
                    className="px-3 py-1.5 bg-white text-black font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? 'Normalizar Horizontales' : 'Normalize Landscapes'}
                  </button>
                </div>

                {/* APLICAR ROTACIÓN A SELECCIÓN */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">{isEs ? "Girar Páginas Seleccionadas:" : "Rotate Selected Pages:"}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button" onClick={() => rotateSelectedPages(90)} disabled={pages.length === 0}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      +90° Derecha
                    </button>
                    <button
                      type="button" onClick={() => rotateSelectedPages(-90)} disabled={pages.length === 0}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      -90° Izquierda
                    </button>
                  </div>
                </div>
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
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Rotación por Texto / Rango:" : "Range Selection Input:"}</label>
                      <input
                        type="text" value={rangeInput} onChange={(e) => handleRangeInputChange(e.target.value)}
                        placeholder="ej: 1, 3, 5-8"
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo de Salida:" : "Output File Prefix:"}</label>
                      <input
                        type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Rotado"
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
                onClick={executeRotate} 
                disabled={isProcessing || pages.length === 0} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (pages.length === 0 
                        ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') 
                        : (isEs ? `Guardar Cambios y Rotar PDF (${rotatedCount} rotadas) →` : `Save Changes & Rotate PDF (${rotatedCount} rotated) →`))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA */}
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
              {isEs ? `Previsualización - Página #${previewZoomPage.pageNum} (${previewZoomPage.rotation}°)` : `Preview - Page #${previewZoomPage.pageNum} (${previewZoomPage.rotation}°)`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner">
              {previewZoomPage.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={previewZoomPage.thumbnailUrl} 
                  alt="Preview Zoom" 
                  className="max-h-[65vh] object-contain transition-transform duration-300"
                  style={{ transform: `rotate(${previewZoomPage.rotation}deg)` }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GUÍA DE USO: CÓMO ROTAR PÁGINAS DE PDF ── */}
      <div className="w-full mt-14 space-y-6 font-sans">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
              <RotateCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo rotar páginas de un PDF?' : 'How to rotate pages of a PDF?'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {isEs ? 'Guía rápida para corregir la orientación de páginas en documentos PDF.' : 'Quick guide to fix the orientation of pages in PDF documents.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: '01', titleEs: 'Sube tu PDF', titleEn: 'Upload your PDF', descEs: 'Arrastra el PDF a la zona de carga o haz clic para seleccionarlo. El visor mostrará las miniaturas de todas las páginas con su orientación actual.', descEn: 'Drag the PDF to the upload zone or click to select it. The viewer shows thumbnails of all pages with their current orientation.' },
              { step: '02', titleEs: 'Selecciona las páginas a rotar', titleEn: 'Select pages to rotate', descEs: 'Haz clic en las miniaturas para seleccionar qué páginas quieres rotar. Puedes seleccionar todas, páginas pares, impares, o páginas individuales.', descEn: 'Click on thumbnails to select which pages you want to rotate. You can select all, even, odd, or individual pages.' },
              { step: '03', titleEs: 'Elige el ángulo de rotación', titleEn: 'Choose rotation angle', descEs: 'Selecciona el ángulo: 90° a la derecha, 90° a la izquierda, o 180° (voltear). Puedes aplicar diferentes rotaciones a diferentes grupos de páginas.', descEn: 'Select the angle: 90° clockwise, 90° counter-clockwise, or 180° (flip). You can apply different rotations to different page groups.' },
              { step: '04', titleEs: 'Rotar y Descargar', titleEn: 'Rotate & Download', descEs: 'Haz clic en "Aplicar Rotación →". El motor aplica las rotaciones a las páginas seleccionadas al instante y el PDF queda listo para descargar.', descEn: 'Click "Apply Rotation →". The engine instantly applies rotations to selected pages and the PDF is ready to download.' },
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
                {isEs ? '💡 Consejos y casos de uso comunes de la rotación' : '💡 Tips and common use cases for rotation'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {isEs ? 'Aprende a sacar el máximo provecho de la herramienta de rotación.' : 'Learn to get the most out of the rotation tool.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
            {[
              { labelEs: 'Corrección de escaneos volcados', labelEn: 'Fix rotated scans', descEs: 'El caso más común: una hoja se escaneó de lado (landscape) cuando debería ser vertical (portrait). Selecciona esas páginas y aplica 90° en la dirección correcta.', descEn: 'The most common case: a sheet was scanned sideways (landscape) when it should be vertical (portrait). Select those pages and apply 90° in the correct direction.' },
              { labelEs: 'Rotar todas las páginas a la vez', labelEn: 'Rotate all pages at once', descEs: 'Usa el botón "Seleccionar todas" para aplicar la misma rotación a todo el documento de una sola vez, sin necesidad de seleccionarlas manualmente.', descEn: 'Use the "Select all" button to apply the same rotation to the entire document at once, without manually selecting them.' },
              { labelEs: 'Rotación 180°: documentos invertidos', labelEn: '180° rotation: inverted documents', descEs: 'Si el documento fue escaneado completamente al revés (boca abajo), aplica 180° para voltearlo correctamente sin tener que re-escanear.', descEn: 'If the document was scanned completely upside down, apply 180° to flip it correctly without needing to re-scan.' },
              { labelEs: 'Las rotaciones son permanentes en el PDF', labelEn: 'Rotations are permanent in the PDF', descEs: 'A diferencia de la rotación de visualización de un visor PDF, esta herramienta graba la rotación de forma permanente en el metadata de orientación de página del binario PDF.', descEn: 'Unlike the display rotation in a PDF viewer, this tool permanently records the rotation in the page orientation metadata of the PDF binary.' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">{isEs ? tip.labelEs : tip.labelEn}:</strong> {isEs ? tip.descEs : tip.descEn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN INFORMATIVA INFERIOR (DEBAJO DE LAS CAJAS PRINCIPALES) */}
      <div className="w-full space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12 mb-12">
        {/* BLOQUE 1: PASO A PASO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo utilizar la Consola de Rotación PDF?' : 'How to use the PDF Rotation Console?'}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {isEs ? 'GUÍA PASO A PASO PARA ROTAR HASTA 360° TUS HOJAS' : 'STEP-BY-STEP GUIDE TO ROTATING YOUR PAGES UP TO 360°'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Cargar Documento' : 'Upload Document'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra tu archivo PDF o selecciónalo de tus carpetas. Las miniaturas en alta definición se renderizarán al instante.' 
                  : 'Drop your PDF file or select it from your folders. High definition thumbnails will render instantly.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Rotar Individual o Masivamente' : 'Rotate Individually or Massively'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en los íconos de giro de cada tarjeta o usa los botones del panel derecho para girar 90°, 180° o normalizar automáticamente hojas horizontales.' 
                  : 'Click card rotation icons or use right panel buttons to rotate 90°, 180° or automatically normalize landscape pages.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                3
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Guardar y Descargar' : 'Save & Download'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en "Guardar Cambios y Rotar PDF". El motor binario compilará el documento en milisegundos listo para su descarga.' 
                  : 'Click "Save Changes & Rotate PDF". The binary engine will compile the document in milliseconds ready for download.'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: PRIVACIDAD Y PROCESAMIENTO BINARIO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Qué sucede internamente con tu archivo PDF?' : 'What happens internally with your PDF file?'}
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isEs ? '🔒 AJUSTE BINARIO DE DICCIONARIOS EN MEMORIA RAM LOCAL' : '🔒 LOCAL RAM BINARY DICTIONARY ADJUSTMENT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Rotación de Propiedad Binaria (/Rotate)' : 'Binary Property Rotation (/Rotate)'}
              </strong>
              <p>
                {isEs 
                  ? 'A diferencia de herramientas básicas que convierten las páginas en imágenes degradadas, nosotros ajustamos la etiqueta `/Rotate` del diccionario binario del PDF. Cero pérdida de calidad gráfica.' 
                  : 'Unlike basic tools converting pages into lossy images, we adjust the `/Rotate` binary tag of the PDF dictionary. Zero graphics loss.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Búsqueda de Texto e Hipervínculos Retenidos' : 'Text Search & Hyperlinks Retained'}
              </strong>
              <p>
                {isEs 
                  ? 'El texto editable permanece 100% buscable y seleccionable, y las capas de vectores e imágenes se mantienen intactas en su formato original.' 
                  : 'Editable text remains 100% searchable & selectable, and vector/image layers stay intact in their original format.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Privacidad Corporativa Total' : 'Total Corporate Privacy'}
              </strong>
              <p>
                {isEs 
                  ? 'Todo el cálculo ocurre en el motor V8 del navegador. Ningún dato o archivo se envía a servidores externos ni queda almacenado en la nube.' 
                  : 'All computation occurs inside browser V8 engine. No data or file is sent to external servers or stored in the cloud.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}