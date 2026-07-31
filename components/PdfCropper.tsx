'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  Crop, FileText, X, Loader2, FilePlus, Sliders, ChevronDown, ChevronUp, 
  FileDown, UploadCloud, Layers, Sparkles, CheckSquare, 
  Square, ZoomIn, Compass, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw,
  ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle, Plus, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type CropScope = 'all' | 'even' | 'odd' | 'current';

export default function PdfCropper() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // MÁRGENES DE RECORTE EN MM
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [marginLeft, setMarginLeft] = useState<number>(10);
  const [marginRight, setMarginRight] = useState<number>(10);
  const [cropScope, setCropScope] = useState<CropScope>('all');

  // RESULTADOS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // OPCIONES AVANZADAS PDFBLACK
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Recortado');
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<boolean>(false);

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

  // Cargar PDF y renderizar vista previa de la página actual
  const renderCurrentPage = useCallback(async (selectedFile: File, pageNum: number) => {
    setIsProcessing(true);
    setProgressMsg(isEs ? `Cargando vista previa pág ${pageNum}...` : `Loading preview page ${pageNum}...`);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      const targetPageNum = Math.max(1, Math.min(pdf.numPages, pageNum));
      const page = await pdf.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: 0.8 });

      setPageSize({ width: Math.round(viewport.width), height: Math.round(viewport.height) });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        setPageDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      }
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al renderizar página del PDF' : 'Error rendering PDF page');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  }, [isEs]);

  useEffect(() => {
    if (file) {
      let isMounted = true;
      (async () => {
        if (isMounted) {
          await renderCurrentPage(file, currentPage);
        }
      })();
      return () => { isMounted = false; };
    }
  }, [file, currentPage, renderCurrentPage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setCurrentPage(1);
        setDownloadUrl(null);
        setFilePrefix(selected.name.replace(/\.[^/.]+$/, "") + '_Recortado');
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setPageDataUrl(null);
    setDownloadUrl(null);
    setGlobalFile(null);
  }, [setGlobalFile]);

  const applyPreset = (mm: number) => {
    setMarginTop(mm);
    setMarginBottom(mm);
    setMarginLeft(mm);
    setMarginRight(mm);
    setDownloadUrl(null);
    toast.info(isEs ? `Márgenes ajustados a ${mm} mm` : `Margins adjusted to ${mm} mm`);
  };

  const resetMargins = () => {
    setMarginTop(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setMarginRight(0);
    setDownloadUrl(null);
  };

  const executeCrop = async () => {
    if (!file) {
      toast.error(isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Aplicando recortado vectorial CropBox...' : 'Applying vector CropBox crop...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pdfPages = pdfDoc.getPages();

      // Convertir mm a puntos PDF (1 mm = 2.83465 pt)
      const mmToPoints = (mm: number) => mm * 2.83465;

      const topPt = mmToPoints(marginTop);
      const bottomPt = mmToPoints(marginBottom);
      const leftPt = mmToPoints(marginLeft);
      const rightPt = mmToPoints(marginRight);

      pdfPages.forEach((page, idx) => {
        const pageNum = idx + 1;
        let shouldCrop = false;

        if (cropScope === 'all') shouldCrop = true;
        else if (cropScope === 'even' && pageNum % 2 === 0) shouldCrop = true;
        else if (cropScope === 'odd' && pageNum % 2 !== 0) shouldCrop = true;
        else if (cropScope === 'current' && pageNum === currentPage) shouldCrop = true;

        if (shouldCrop) {
          const { width, height } = page.getSize();
          const newX = Math.max(0, leftPt);
          const newY = Math.max(0, bottomPt);
          const newW = Math.max(10, width - leftPt - rightPt);
          const newH = Math.max(10, height - topPt - bottomPt);

          page.setCropBox(newX, newY, newW, newH);
        }

        if (renumberPages) {
          const { width } = page.getSize();
          page.drawText(`Página ${pageNum} de ${pdfPages.length}`, {
            x: width / 2 - 30,
            y: 15,
            size: 9,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      });

      setProgressPercent(85);
      setProgressMsg(isEs ? 'Compilando documento recortado...' : 'Compiling cropped document...');

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix}.pdf`;

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      triggerDownload(localUrl, outName);
      setProgressPercent(100);
      toast.success(isEs ? '¡Márgenes del PDF recortados con éxito!' : 'PDF margins cropped successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al recortar los márgenes del PDF' : 'Error cropping PDF margins');
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
              {isEs ? "002 / RECORTE Y AJUSTE DE MÁRGENES PDF" : "002 / PDF MARGIN CROPPING & ADJUSTMENT"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Crop className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "RECORTAR MÁRGENES DE DOCUMENTOS PDF" : "CROP PDF MARGINS"}
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
              <X className="w-4 h-4" />
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
            {isEs ? "RECORTAR MÁRGENES DE DOCUMENTOS PDF" : "CROP PDF MARGINS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Recorta los márgenes superior, inferior y laterales de tu PDF de forma 100% confidencial y local." : "Crop top, bottom, left, and right margins of your PDF 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISOR DE PÁGINA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: VISOR INTERACTIVO CROP BOX */}
          <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA Y ÁREA CONSERVADA` : `001 / PREVIEW & CONSERVED AREA`}</span>
              </div>

              {/* NAVEGADOR DE PÁGINAS Y CONTROLES */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 px-2 py-1 rounded-xl text-xs font-mono">
                  <button
                    type="button" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white font-bold text-[11px]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            {/* DETALLES DEL ARCHIVO CARGADO */}
            <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl mb-4 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-white flex-shrink-0" />
                <div className="truncate">
                  <span className="text-white font-bold block truncate">{file.name}</span>
                  <span className="text-[10px] text-zinc-400">{formatFileSize(file.size)} • {pageSize.width}x{pageSize.height}px • {totalPages} {isEs ? 'páginas en total' : 'total pages'}</span>
                </div>
              </div>
              <button type="button" onClick={removeFile} className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CONTENEDOR CANVAS DE PÁGINA CON OVERLAY DE MÁRGENES DE RECORTE (CROP BOX) */}
            <div className="relative w-full flex-1 min-h-[460px] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center p-4 shadow-inner border border-white/5 font-mono">
              {pageDataUrl ? (
                <div className="relative inline-block max-h-full max-w-full shadow-2xl rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pageDataUrl} alt={`Página ${currentPage}`} className="max-h-[440px] max-w-full object-contain block rounded" />

                  {/* OVERLAY VISUAL DE MÁRGENES DE RECORTE (CROP BOX DESTELLANTE) */}
                  <div 
                    className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none transition-all duration-200 rounded shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    style={{
                      top: `${(marginTop / 297) * 100}%`,
                      bottom: `${(marginBottom / 297) * 100}%`,
                      left: `${(marginLeft / 210) * 100}%`,
                      right: `${(marginRight / 210) * 100}%`,
                    }}
                  >
                    <span className="absolute top-1 left-2 text-[9px] font-mono font-bold bg-white text-black px-1.5 py-0.5 rounded shadow uppercase">
                      Área Conservada
                    </span>
                  </div>

                  <button
                    type="button" onClick={() => setPreviewZoom(true)}
                    className="absolute bottom-2 right-2 p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-white/20"
                    title={isEs ? "Zoom" : "Zoom"}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              )}
            </div>

          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
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

              {/* MODO DE ALCANCE DEL RECORTE */}
              <div className="space-y-4 font-mono text-xs mb-5">
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Alcance del Recorte:" : "Crop Scope:"}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button" onClick={() => setCropScope('all')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'all' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Todas' : 'All'}
                    </button>

                    <button
                      type="button" onClick={() => setCropScope('even')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'even' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Pares' : 'Evens'}
                    </button>

                    <button
                      type="button" onClick={() => setCropScope('odd')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'odd' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Impares' : 'Odds'}
                    </button>

                    <button
                      type="button" onClick={() => setCropScope('current')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        cropScope === 'current' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Actual' : 'Current'}
                    </button>
                  </div>
                </div>

                {/* MÁRGENES DE RECORTE (MM) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white">
                    <span>{isEs ? 'Márgenes de Recorte (mm):' : 'Crop Margins (mm):'}</span>
                    <button type="button" onClick={resetMargins} className="text-zinc-400 hover:text-white transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Superior (Top):' : 'Top:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginTop}
                        onChange={(e) => setMarginTop(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Inferior (Bottom):' : 'Bottom:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginBottom}
                        onChange={(e) => setMarginBottom(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Izquierdo (Left):' : 'Left:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginLeft}
                        onChange={(e) => setMarginLeft(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 block">{isEs ? 'Derecho (Right):' : 'Right:'}</span>
                      <input
                        type="number" min={0} max={100} value={marginRight}
                        onChange={(e) => setMarginRight(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-900 border border-white/20 rounded-xl py-2 px-3 text-white font-bold text-xs outline-none focus:border-white/50"
                      />
                    </div>
                  </div>
                </div>

                {/* PREAJUSTES RÁPIDOS EN 1-CLIC */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? 'Preajustes Rápido:' : 'Quick Presets:'}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button" onClick={() => applyPreset(0)}
                      className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer text-center"
                    >
                      0 mm
                    </button>
                    <button
                      type="button" onClick={() => applyPreset(10)}
                      className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer text-center"
                    >
                      10 mm
                    </button>
                    <button
                      type="button" onClick={() => applyPreset(20)}
                      className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 text-xs transition-colors cursor-pointer text-center"
                    >
                      20 mm
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
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo de Salida:" : "Output File Prefix:"}</label>
                      <input
                        type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Recortado"
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
                onClick={executeCrop} 
                disabled={isProcessing || !file} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (!file 
                        ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') 
                        : (isEs ? 'Recortar Márgenes del PDF →' : 'Crop PDF Margins →'))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* MODAL ZOOM DE PREVISUALIZACIÓN DE HOJA CON CROP BOX */}
      {previewZoom && pageDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-zinc-900 border border-white/20 p-6 rounded-2xl max-w-xl w-full flex flex-col items-center gap-4 relative shadow-2xl">
            <button
              type="button" onClick={() => setPreviewZoom(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-white font-bold text-sm">
              {isEs ? `Previsualización Recorte - Página ${currentPage}` : `Crop Preview - Page ${currentPage}`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pageDataUrl} alt="Preview Zoom" className="max-h-[65vh] object-contain block rounded" />
              <div 
                className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none rounded"
                style={{
                  top: `${(marginTop / 297) * 100}%`,
                  bottom: `${(marginBottom / 297) * 100}%`,
                  left: `${(marginLeft / 210) * 100}%`,
                  right: `${(marginRight / 210) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── GUÍA DE USO: CÓMO RECORTAR MÁRGENES DE UN PDF ── */}
      <div className="w-full mt-14 space-y-6 font-sans">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
              <Crop className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isEs ? '¿Cómo recortar o ajustar los márgenes de un PDF?' : 'How to crop or adjust the margins of a PDF?'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {isEs ? 'Guía rápida para eliminar márgenes, espacios en blanco o recortar el área visible de tu PDF.' : 'Quick guide to remove margins, white space, or crop the visible area of your PDF.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: '01', titleEs: 'Sube tu PDF', titleEn: 'Upload your PDF', descEs: 'Arrastra el PDF a la zona de carga o haz clic para seleccionarlo. El visor mostrará las miniaturas de todas las páginas del documento.', descEn: 'Drag the PDF to the upload zone or click to select it. The viewer shows thumbnails of all document pages.' },
              { step: '02', titleEs: 'Define el área de recorte', titleEn: 'Define the crop area', descEs: 'Ajusta los márgenes usando los controles deslizantes (superior, inferior, izquierdo, derecho) o ingresa valores numéricos exactos en puntos o centímetros.', descEn: 'Adjust margins using the sliders (top, bottom, left, right) or enter exact numerical values in points or centimeters.' },
              { step: '03', titleEs: 'Selecciona las páginas a recortar', titleEn: 'Select pages to crop', descEs: 'Elige si aplicar el recorte a todas las páginas, solo a la página actual, páginas pares, impares, o a un rango específico del documento.', descEn: 'Choose whether to apply the crop to all pages, only the current page, even pages, odd pages, or a specific range of the document.' },
              { step: '04', titleEs: 'Recortar PDF', titleEn: 'Crop PDF', descEs: 'Haz clic en "Recortar PDF →". El motor ajusta el MediaBox de cada página al instante. El PDF resultante se descarga directamente a tu equipo.', descEn: 'Click "Crop PDF →". The engine instantly adjusts the MediaBox of each page. The resulting PDF downloads directly to your device.' },
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
                {isEs ? '💡 ¿Qué hace exactamente el Recortador de PDF?' : '💡 What does the PDF Cropper exactly do?'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {isEs ? 'Entiende cómo funciona el recorte a nivel técnico y cuándo usarlo.' : 'Understand how cropping works at a technical level and when to use it.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
            {[
              { labelEs: 'El recorte ajusta el MediaBox del PDF', labelEn: 'Cropping adjusts the PDF MediaBox', descEs: 'El recortador modifica el MediaBox (y/o CropBox) de cada página PDF, que define el área visible. El contenido fuera del área recortada no se elimina del binario pero queda oculto.', descEn: 'The cropper modifies the MediaBox (and/or CropBox) of each PDF page, which defines the visible area. Content outside the cropped area is not removed from the binary but is hidden.' },
              { labelEs: 'El contenido NO se destruye permanentemente', labelEn: 'Content is NOT permanently destroyed', descEs: 'A diferencia de editar el contenido, el recorte solo ajusta los límites visibles. Con un editor avanzado se podría restaurar el área original. Para borrar contenido, usa la herramienta de Censurar PDF.', descEn: 'Unlike editing content, cropping only adjusts the visible boundaries. With an advanced editor the original area could be restored. To destroy content, use the Redact PDF tool.' },
              { labelEs: 'Eliminar márgenes blancos', labelEn: 'Remove white margins', descEs: 'El uso más común es eliminar los márgenes en blanco excesivos de escaneos o documentos generados automáticamente, haciendo que el contenido ocupe toda la página.', descEn: 'The most common use is removing excessive white margins from scans or auto-generated documents, making content fill the entire page.' },
              { labelEs: 'Recorte simétrico vs. personalizado', labelEn: 'Symmetric vs. custom crop', descEs: 'Usa el recorte simétrico para aplicar el mismo margen en todos los lados de forma rápida, o el personalizado para especificar valores diferentes en cada borde.', descEn: 'Use symmetric cropping to apply the same margin on all sides quickly, or custom to specify different values for each edge.' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
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
                {isEs ? '¿Cómo utilizar la Consola de Recorte de Márgenes?' : 'How to use the Margin Crop Console?'}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {isEs ? 'GUÍA PASO A PASO PARA AJUSTAR MÁRGENES EN MILÍMETROS' : 'STEP-BY-STEP GUIDE TO ADJUSTING MARGINS IN MILLIMETERS'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Cargar PDF' : 'Upload PDF'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra tu archivo PDF. La vista previa interactiva renderizará la primera página con el recuadro de recorte (Crop Box).' 
                  : 'Drop your PDF file. The interactive preview will render the first page with the Crop Box overlay.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Ajustar Márgenes y Alcance' : 'Adjust Margins & Scope'}
              </strong>
              <p>
                {isEs 
                  ? 'Ajusta los valores en mm (Superior, Inferior, Izquierdo, Derecho) o usa los preajustes rápidos (0mm, 10mm, 20mm). Selecciona si deseas aplicar a todo el PDF, pares o impares.' 
                  : 'Adjust values in mm (Top, Bottom, Left, Right) or use quick presets (0mm, 10mm, 20mm). Choose whether to apply to all PDF, evens or odds.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                3
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Recortar y Descargar' : 'Crop & Download'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en "Recortar Márgenes del PDF". El motor binario recortará el archivo conservando la resolución original para su descarga.' 
                  : 'Click "Crop PDF Margins". The binary engine will crop the file keeping original resolution for download.'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: PRIVACIDAD Y PROCESAMIENTO CROPBOX */}
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
                {isEs ? '🔒 AJUSTE BINARIO DE VISTA CROPBOX EN MEMORIA RAM LOCAL' : '🔒 LOCAL RAM BINARY CROPBOX VIEWPORT ADJUSTMENT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Modificación de Etiqueta Binaria /CropBox' : 'Binary /CropBox Tag Modification'}
              </strong>
              <p>
                {isEs 
                  ? 'En lugar de recortar imágenes rasterizadas con pérdida de calidad, nosotros modificamos las coordenadas binarias `/CropBox` del estándar PDF. El contenido gráfico se mantiene 100% vectorial y nítido.' 
                  : 'Instead of cropping rasterized images with quality loss, we modify binary `/CropBox` coordinates in PDF standard. Graphic content stays 100% vector & crisp.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Búsqueda de Texto e Hipervínculos Intactos' : 'Text Search & Hyperlinks Intact'}
              </strong>
              <p>
                {isEs 
                  ? 'El texto retenido en el área visual sigue siendo totalmente seleccionable y copiable. Ninguna fuente se degrada o rasteriza.' 
                  : 'Text retained within visual area remains fully selectable & copyable. No font gets degraded or rasterized.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Seguridad y Privacidad Corporativa' : 'Corporate Security & Privacy'}
              </strong>
              <p>
                {isEs 
                  ? 'Todo el proceso ocurre localmente en el motor V8 del navegador del usuario. Cero bytes subidos a servidores remotos o nubes de terceros.' 
                  : 'Entire process happens locally inside user browser V8 engine. Zero bytes uploaded to remote servers or third-party clouds.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
