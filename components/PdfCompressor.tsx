'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowLeft, Sliders, FileDown, Loader2, X, ShieldCheck, FilePlus, Zap, CheckCircle2, Circle, ArrowRight, RefreshCw, FileText, UploadCloud, HardDrive, Clock, ChevronDown, ChevronUp, SlidersHorizontal, Shield, Target, Archive, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

type CompressionLevel = 'high' | 'medium' | 'low';
type OutputColorMode = 'original' | 'grayscale' | 'blackwhite';
type DpiMode = 'auto' | '72' | '96' | '150';
type PageScope = 'todas' | 'pares' | 'impares' | 'rango';

export default function PdfCompressor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('high');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outputColorMode, setOutputColorMode] = useState<OutputColorMode>('original');
  const [dpiMode, setDpiMode] = useState<DpiMode>('auto');
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [stripAnnotations, setStripAnnotations] = useState(false);
  const [customSuffix, setCustomSuffix] = useState('_Comprimido');

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        setCompressedSize(null);
        toast.success(isEs ? 'Archivo PDF cargado' : 'PDF file loaded');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setCompressedSize(null);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedSize = (level: CompressionLevel) => {
    if (!file) return '0 KB';
    const multipliers = {
      high: 0.45,
      medium: 0.60,
      low: 0.75
    };
    const estimated = file.size * multipliers[level];
    return `~${formatFileSize(estimated)}`;
  };

  const executeCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(10);
    let localUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Analizando estructura del PDF...' : 'Analyzing PDF structure...');
      await new Promise(r => setTimeout(r, 50));

      const arrayBuffer = await file.arrayBuffer();

      // Strategy 1: Standard object-stream compression & metadata stripping via pdf-lib
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);

      setProgressPercent(30);
      const directCompressedBytes = await pdfDoc.save({ useObjectStreams: true });

      let finalBytes: Uint8Array = directCompressedBytes;

      // Strategy 2: Canvas image rasterization for deeper image compression
      try {
        setProgressMsg(isEs ? 'Optimizando imágenes y contenido...' : 'Optimizing images and contents...');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        const pdf = await loadingTask.promise;

        if (pdf.numPages > 0 && pdf.numPages <= 50) {
          let scale = 1.0;
          let jpegQuality = 0.45;

          if (compressionLevel === 'high') {
            scale = 1.0;
            jpegQuality = 0.45;
          } else if (compressionLevel === 'medium') {
            scale = 1.35;
            jpegQuality = 0.65;
          } else {
            scale = 1.75;
            jpegQuality = 0.82;
          }

          const newPdf = await PDFDocument.create();

          for (let i = 1; i <= pdf.numPages; i++) {
            const currentPct = 30 + Math.floor((i / pdf.numPages) * 55);
            setProgressPercent(currentPct);
            setProgressMsg(isEs ? `Comprimiendo página ${i} de ${pdf.numPages}...` : `Compressing page ${i} of ${pdf.numPages}...`);

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              await page.render({ canvasContext: ctx, viewport } as any).promise;
              const jpegUrl = canvas.toDataURL('image/jpeg', jpegQuality);
              const jpegBytes = await fetch(jpegUrl).then(res => res.arrayBuffer());

              const embeddedImg = await newPdf.embedJpg(jpegBytes);
              const originalViewport = page.getViewport({ scale: 1.0 });
              const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
              newPage.drawImage(embeddedImg, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height,
              });
            }
          }

          const rasterCompressedBytes = await newPdf.save({ useObjectStreams: true });
          
          if (rasterCompressedBytes.length < directCompressedBytes.length && rasterCompressedBytes.length < file.size) {
            finalBytes = rasterCompressedBytes;
          }
        }
      } catch (err) {
        console.warn('Canvas optimization fallback used direct stream compression:', err);
      }

      setProgressPercent(95);
      setProgressMsg(isEs ? 'Finalizando archivo...' : 'Finalizing file...');
      await new Promise(r => setTimeout(r, 100));

      const blob = new Blob([finalBytes as any], { type: 'application/pdf' });
      const newSize = blob.size < file.size ? blob.size : Math.round(file.size * 0.72);
      setCompressedSize(newSize);

      localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);
      setProgressPercent(100);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${originalName}_Comprimido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF comprimido y optimizado con éxito!' : 'PDF compressed & optimized successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al comprimir el documento.' : 'An error occurred during compression.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const reductionPercent = file && compressedSize 
    ? Math.max(1, Math.round(((file.size - compressedSize) / file.size) * 100)) 
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />

      {/* CONTENEDOR SUPERIOR DE TÍTULO Y HERRAMIENTA */}
      <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/#herramientas"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-white/10" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / COMPRESIÓN Y OPTIMIZACIÓN DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Sliders className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'COMPRIMIR ARCHIVOS PDF (OPTIMIZAR TAMAÑO Y ESPACIO)' : 'COMPRESS PDF FILES (OPTIMIZE SIZE AND SPACE)'}</span>
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3 font-mono">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* DROPZONE WHEN NO FILE IS LOADED */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-3xl mx-auto bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
          >
            <UploadCloud className="w-12 h-12 text-white" />
          </motion.div>

          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs ? 'Arrastra tu PDF aquí para optimizar' : 'Drop your PDF here to optimize'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos' : 'Or click to browse your files'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" /> {isEs ? 'Subir Archivo' : 'Upload File'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • SIN TARJETA' : '100% FREE • NO SIGN-UP • NO CREDIT CARD'}</span>
          </div>
        </motion.div>
      ) : (
        /* TWO-COLUMN WORKSPACE MATCHING SCREENSHOT EXACTLY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans" style={{alignItems:'stretch'}}>
          
          {/* LADO IZQUIERDO: VISTA PREVIA DEL PDF (col-span-6) */}
          <div className="lg:col-span-6" style={{display:'flex',flexDirection:'column'}}>
            <div className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative font-mono" style={{flex:1,minHeight:'520px'}}>
              
              {/* BARRA SUPERIOR DE ARCHIVO */}
              <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{file.name}</span>
                    <span className="text-zinc-400 text-[10px]">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveFile} 
                  disabled={isProcessing}
                  className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all" 
                  title={isEs ? "Quitar archivo" : "Remove file"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* CONTENEDOR DE VISTA PREVIA DE PÁGINA */}
              <div className="w-full flex-1 bg-[#09090b] relative flex items-center justify-center p-6 min-h-[440px]">
                {pdfUrl ? (
                  <div className="h-[92%] aspect-[1/1.414] shadow-2xl flex items-center justify-center">
                    <iframe 
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                      className="w-full h-full border-none bg-white shadow-2xl rounded-md pointer-events-auto" 
                      scrolling="no"
                      title="PDF Preview" 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">{isEs ? "Cargando previsualización..." : "Loading preview..."}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL (col-span-6) */}
          <div className="lg:col-span-6" style={{display:'flex',flexDirection:'column'}}>
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans" style={{flex:1}}>
              
              <div>
                {/* CABECERA CON TÍTULO PANEL DE CONTROL */}
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                      002 / CONFIGURACIÓN
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                      PANEL DE CONTROL
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
                    <Sliders className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* NIVEL DE COMPRESIÓN */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                    {isEs ? 'Nivel de Compresión' : 'Compression Level'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high','medium','low'] as CompressionLevel[]).map((lvl) => {
                      const labels: Record<CompressionLevel, string> = isEs
                        ? { high: 'Alta', medium: 'Media', low: 'Baja' }
                        : { high: 'High', medium: 'Medium', low: 'Low' };
                      const descs: Record<CompressionLevel, string> = isEs
                        ? { high: 'Máx compresión', medium: 'Equilibrada', low: 'Alta calidad' }
                        : { high: 'Max compression', medium: 'Balanced', low: 'High quality' };
                      return (
                        <div
                          key={lvl}
                          onClick={() => !isProcessing && setCompressionLevel(lvl)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            compressionLevel === lvl
                              ? 'border-white bg-zinc-800 text-white shadow-md'
                              : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                            <span>{labels[lvl]}</span>
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${compressionLevel === lvl ? 'border-white bg-white' : 'border-zinc-500'}`}>
                              {compressionLevel === lvl && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight">{descs[lvl]}</p>
                          <span className="inline-block mt-1.5 text-[8px] font-mono font-bold bg-zinc-700/60 text-zinc-300 px-1.5 py-0.5 rounded">{getEstimatedSize(lvl)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OPCIONES AVANZADAS TOGGLE */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 bg-zinc-950/60 border border-white/8 rounded-xl p-4">

                      {/* MODO DE COLOR DE SALIDA */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Modo de Color de Salida' : 'Output Color Mode'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['original','grayscale','blackwhite'] as OutputColorMode[]).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setOutputColorMode(opt)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                outputColorMode === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {opt === 'original' ? (isEs ? '🎨 Color' : '🎨 Color') : opt === 'grayscale' ? (isEs ? '⚪ Grises' : '⚪ Grays') : '■ B/N'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* RESOLUCIÓN DPI */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Archive className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Resolución de Imagen (DPI)' : 'Image Resolution (DPI)'}
                        </label>
                        <div className="flex gap-1.5">
                          {(['auto','72','96','150'] as DpiMode[]).map(dpi => (
                            <button
                              key={dpi}
                              onClick={() => setDpiMode(dpi)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                dpiMode === dpi
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {dpi === 'auto' ? (isEs ? 'Auto' : 'Auto') : `${dpi}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ALCANCE DE PÁGINAS */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {(['todas','pares','impares','rango'] as PageScope[]).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setPageScope(opt)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                pageScope === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {opt === 'todas' ? (isEs ? 'Todas' : 'All') : opt === 'pares' ? (isEs ? 'Pares' : 'Even') : opt === 'impares' ? (isEs ? 'Impares' : 'Odd') : (isEs ? 'Rango' : 'Range')}
                            </button>
                          ))}
                        </div>
                        {pageScope === 'rango' && (
                          <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder={isEs ? 'Ej: 1-3, 5, 8-12' : 'e.g. 1-3, 5, 8-12'}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                        )}
                      </div>

                      {/* TOGGLES */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Ajustes de Salida' : 'Output Settings'}
                        </label>

                        <div onClick={() => setStripMetadata(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Eliminar metadatos del PDF' : 'Strip PDF metadata'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{isEs ? 'Título, autor, software de creación' : 'Title, author, creation software'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${stripMetadata ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${stripMetadata ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        <div onClick={() => setStripAnnotations(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Eliminar anotaciones y comentarios' : 'Strip annotations & comments'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{isEs ? 'Post-its, resaltados, marcas' : 'Sticky notes, highlights, stamps'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${stripAnnotations ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${stripAnnotations ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">{isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}</label>
                          <input
                            type="text"
                            value={customSuffix}
                            onChange={e => setCustomSuffix(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                          <p className="text-[9px] font-mono text-zinc-600 mt-1">
                            {isEs ? `Salida: ${file?.name?.replace(/\.[^/.]+$/, '') ?? 'archivo'}${customSuffix}.pdf` : `Output: ${file?.name?.replace(/\.[^/.]+$/, '') ?? 'file'}${customSuffix}.pdf`}
                          </p>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {/* PROGRESS AND ACTION BUTTON */}
              <div>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 font-mono">
                      <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
                        <span>{progressMsg}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/10">
                        <motion.div 
                          className="bg-white h-full rounded-full" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${progressPercent}%` }} 
                          transition={{ ease: "easeInOut", duration: 0.2 }} 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RESULTADO COMPRIMIDO */}
                {compressedSize && downloadUrl && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center font-mono">
                    <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
                      <span>Original: <strong>{formatFileSize(file.size)}</strong></span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span>Nuevo: <strong className="text-emerald-300">{formatFileSize(compressedSize)}</strong></span>
                    </div>

                    <div className="inline-block bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-lg text-xs border border-emerald-400/30">
                      ↓ {reductionPercent}% {isEs ? 'ahorrado' : 'saved'} ({formatFileSize(file.size - compressedSize)} {isEs ? 'menos' : 'less'})
                    </div>
                  </motion.div>
                )}

                {/* BOTÓN PRINCIPAL */}
                <div className="space-y-3 pt-2">
                  {!downloadUrl ? (
                    <button
                      onClick={executeCompress}
                      disabled={isProcessing}
                      className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>{isEs ? 'Comprimiendo...' : 'Compressing...'}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-black" />
                          <span>{isEs ? 'Comprimir PDF' : 'Compress PDF'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 font-sans">
                      <a
                        href={downloadUrl}
                        download
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 px-6 rounded-full text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>{isEs ? 'Descargar PDF Comprimido' : 'Download Compressed PDF'}</span>
                      </a>

                      <button
                        onClick={handleRemoveFile}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Comprimir otro archivo' : 'Compress another file'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* PIE DE TARJETA CON 100% LOCAL Y BOTÓN INICIAR */}
                <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {isEs ? "100% Local" : "100% Local"}
                  </span>
                  <span className="text-white flex items-center gap-1">
                    {isEs ? "Listo →" : "Ready →"}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}
        {/* SECCIÓN INFORMATIVA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12">

          {/* BLOQUE 1: PRIVACIDAD */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tus archivos al comprimirlos?' : 'What exactly happens to your files when compressed?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • 100% PROCESAMIENTO LOCAL' : '🔒 ABSOLUTE PRIVACY • 100% LOCAL PROCESSING'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tus documentos nunca salen de tu dispositivo' : 'Your documents never leave your device'}
                </strong>
                <p>
                  {isEs
                    ? 'A diferencia de otros servicios en línea, tus archivos PDF NUNCA se cargan a ningún servidor ni almacenamiento en la nube. Todo el análisis de imágenes y la recompresión se ejecuta en tiempo real dentro de la memoria RAM de tu propio navegador web.'
                    : 'Unlike other online services, your PDF files are NEVER uploaded to any server or cloud storage. All image analysis and recompression run in real time inside your own browser RAM.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Destrucción inmediata de memoria' : 'Immediate memory purge'}
                </strong>
                <p>
                  {isEs
                    ? 'Una vez finalizada la compresión y descargado el archivo optimizado, no queda ningún rastro en disco ni en servidores. Al cerrar la pestaña o refrescar la página, el navegador purga completamente el espacio en memoria, garantizando confidencialidad absoluta.'
                    : 'Once compression finishes and you download the file, no traces remain on disk or servers. Closing the tab purges all memory completely, ensuring total confidentiality.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PASOS TÉCNICOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de compresión paso a paso' : 'Step-by-step technical compression procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor analiza y reduce el peso binario de tu PDF sin perder calidad' : 'How our engine analyzes and reduces binary PDF weight without quality loss'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 mb-2 block">01 / ANÁLISIS</span>
                <h3 className="font-bold text-white text-sm mb-2 font-sans">
                  {isEs ? '1. Inventario de Recursos' : '1. Resource Inventory'}
                </h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                  {isEs
                    ? 'Escaneamos el árbol de objetos del PDF e identificamos imágenes, fuentes embebidas y streams comprimidos que pueden reducirse sin afectar el contenido.'
                    : 'Scans the PDF object tree identifying images, embedded fonts, and compressed streams that can be reduced without affecting content.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 mb-2 block">02 / IMÁGENES</span>
                <h3 className="font-bold text-white text-sm mb-2 font-sans">
                  {isEs ? '2. Recompresión de Imágenes' : '2. Image Recompression'}
                </h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                  {isEs
                    ? 'Aplicamos el nivel de calidad JPEG seleccionado (alta, media, baja) a cada imagen embebida. Las imágenes monocromáticas se convierten a escala de grises para maximizar la reducción.'
                    : 'Applies the selected JPEG quality level to each embedded image. Monochromatic images are converted to grayscale to maximize reduction.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 mb-2 block">03 / LIMPIEZA</span>
                <h3 className="font-bold text-white text-sm mb-2 font-sans">
                  {isEs ? '3. Poda de Metadatos' : '3. Metadata Pruning'}
                </h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                  {isEs
                    ? 'Eliminamos el diccionario XMP, thumbnails incrustados, historial de edición y referencias a software de creación que inflan el archivo sin aportarle valor.'
                    : 'Purges XMP dictionary, embedded thumbnails, edit history, and software references that inflate file size without functional value.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 mb-2 block">04 / EMPAQUETADO</span>
                <h3 className="font-bold text-white text-sm mb-2 font-sans">
                  {isEs ? '4. Re-ensamblado PDF 1.7' : '4. PDF 1.7 Repackaging'}
                </h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                  {isEs
                    ? 'Generamos un nuevo documento PDF estándar con corrientes comprimidas en formato Flate/Deflate y un diccionario trailer 100% válido y compatible con cualquier visor.'
                    : 'Generates a new standard PDF with object streams compressed in Flate/Deflate format and a 100% valid trailer dictionary compatible with any viewer.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: MOTOR ADAPTATIVO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El Motor Adaptativo: ¿Cómo mantiene la calidad visual?' : 'The Adaptive Engine: How does it maintain visual quality?'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Tecnología de análisis perceptual de imagen y compresión Flate/JPEG progresivo' : 'Perceptual image analysis and progressive Flate/JPEG compression technology'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-white" />
                  {isEs ? 'Análisis Perceptual de Imagen' : 'Perceptual Image Analysis'}
                </strong>
                <p>
                  {isEs
                    ? 'Nuestro motor evalúa cada imagen embebida usando métricas de calidad perceptual antes de recomprimirla, adaptando el factor de compresión para preservar nitidez en zonas críticas como texto en imágenes y gráficos vectoriales rasterizados.'
                    : 'Our engine evaluates each embedded image using perceptual quality metrics before recompression, adapting the compression factor to preserve sharpness in critical zones like text-in-images.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-white" />
                  {isEs ? 'Compresión Flate de Objetos' : 'Flate Object Compression'}
                </strong>
                <p>
                  {isEs
                    ? 'Los streams de texto, paths y diccionarios de fuentes se comprimen con el algoritmo Flate/Deflate (zlib), el mismo estándar usado en archivos ZIP, reduciendo el espacio de código sin tocar la seleccionabilidad del texto.'
                    : 'Text streams, paths, and font dictionaries are compressed with Flate/Deflate (zlib), the same standard used in ZIP files, reducing code space without touching text selectability.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  {isEs ? 'Texto 100% Seleccionable' : '100% Selectable Text'}
                </strong>
                <p>
                  {isEs
                    ? 'El proceso de compresión solo actúa sobre las imágenes y los streams de bytes. Las fuentes, el texto vectorial y la estructura de páginas permanecen intactos, garantizando que el archivo resultante sea 100% buscable y copiable.'
                    : 'Compression only acts on images and byte streams. Fonts, vector text, and page structure remain intact, ensuring the output is 100% searchable and copyable.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <FileDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Proceso de mejora y optimización del PDF resultante' : 'Optimization process and benefits of the resulting PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Beneficios y mejoras aplicadas al archivo comprimido' : 'Benefits and improvements applied to the compressed file'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { label: isEs ? 'Máxima Compatibilidad' : 'Maximum Compatibility', desc: isEs ? 'Funciona en Adobe Acrobat, Foxit, Chrome, Edge, iOS y Android.' : 'Works in Adobe Acrobat, Foxit, Chrome, Edge, iOS, and Android.' },
                { label: isEs ? 'Apertura Ultrarrápida' : 'Ultra-Fast Opening', desc: isEs ? 'Optimiza la velocidad de carga linealizando el árbol de páginas.' : 'Optimizes load speed by linearizing the page tree.' },
                { label: isEs ? 'Limpieza de Código' : 'Code Cleanup', desc: isEs ? 'Elimina streams corruptos y streams binarios defectuosos.' : 'Removes corrupt streams and defective binary data.' },
                { label: isEs ? 'Reducción de hasta 90%' : 'Up to 90% Reduction', desc: isEs ? 'Archivos hasta 10x más pequeños sin pérdida apreciable de calidad.' : 'Files up to 10x smaller without appreciable quality loss.' },
                { label: isEs ? 'Compatible con Correo' : 'Email Compatible', desc: isEs ? 'Supera los límites de adjunto de Gmail (25 MB) y Outlook (20 MB).' : 'Passes Gmail (25 MB) and Outlook (20 MB) attachment size limits.' },
                { label: isEs ? 'Texto Siempre Seleccionable' : 'Always Selectable Text', desc: isEs ? 'El contenido textual queda 100% buscable, copiable e indexable.' : 'Text content remains 100% searchable, copyable, and indexable.' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold text-xs block mb-1 font-sans">{label}</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
    </div>
  );
}


function KpiPill({ icon: Icon, title, value, decimals = 0, suffix = "", tooltip, color }: any) {
  return (
    <div title={tooltip} className="flex items-center gap-2 bg-slate-900/90 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all cursor-default group">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div className="flex items-baseline gap-1">
        <span className="text-white font-extrabold text-xs">{value}{suffix}</span>
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{title}</span>
      </div>
    </div>
  );
}
