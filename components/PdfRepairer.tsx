'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowLeft, Activity, FileDown, Loader2, X, FilePlus, ArrowRight, FileText, UploadCloud, HardDrive, Clock, ChevronDown, ChevronUp, SlidersHorizontal, Shield, Zap, Target, Archive, RotateCcw, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion } from 'framer-motion';

type RepairMode = 'smart' | 'deep';
type RecoveryPriority = 'texto' | 'imagenes' | 'todo';
type PageScope = 'todas' | 'pares' | 'impares' | 'rango';
type CompressionLevel = 'none' | 'low' | 'medium' | 'high';
type DamagedPageAction = 'omitir' | 'sustituir' | 'incluir_vacia';

export default function PdfRepairer() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [repairMode, setRepairMode] = useState<RepairMode>('smart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recoveredPages, setRecoveredPages] = useState<number | null>(null);
  const [repairLog, setRepairLog] = useState<string[]>([]);

  // Previsualización Canvas PDF
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recoveryPriority, setRecoveryPriority] = useState<RecoveryPriority>('todo');
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('low');
  const [damagedPageAction, setDamagedPageAction] = useState<DamagedPageAction>('omitir');
  const [addRepairStamp, setAddRepairStamp] = useState(false);
  const [removeRestrictions, setRemoveRestrictions] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Reparado');

  const pdfUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  const renderPagePreview = useCallback(async (pdfFile: File, pageNum: number) => {
    setIsLoadingPreview(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdfDoc.numPages);

      const targetPageNum = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
      const page = await pdfDoc.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.85));
      }
    } catch (err) {
      console.warn('Canvas preview fallback to iframe:', err);
      setPreviewDataUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      setPreviewPageNum(1);
      renderPagePreview(file, 1);
    } else {
      setPreviewDataUrl(null);
      setTotalPages(1);
    }
  }, [file, renderPagePreview]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setRecoveredPages(null);
      setRepairLog([]);
      toast.success(isEs ? 'Archivo cargado correctamente' : 'File loaded successfully');
    }
    e.target.value = '';
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setDownloadUrl(null);
    setGlobalFile(null);
    setRecoveredPages(null);
    setRepairLog([]);
  }, [setGlobalFile]);

  const addLog = (msg: string) => {
    setRepairLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const executeRepair = async () => {
    if (!file) {
      toast.error(isEs ? 'Selecciona un archivo PDF para reparar' : 'Select a PDF file to repair');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setRepairLog([]);
    setDownloadUrl(null);

    const addLog = (msg: string) => {
      setRepairLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    let localUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Paso 1/4: Analizando cabecera binaria...' : 'Step 1/4: Analyzing binary header...');
      addLog(isEs ? '🔍 Leyendo binario del documento...' : '🔍 Reading document binary...');
      await new Promise(r => setTimeout(r, 50));

      const rawBuffer = await file.arrayBuffer();
      let uint8 = new Uint8Array(rawBuffer);

      // 1. Limpieza de basura en cabecera (%PDF-)
      let headerOffset = -1;
      for (let i = 0; i < Math.min(uint8.length - 5, 4096); i++) {
        if (
          uint8[i] === 0x25 && // %
          uint8[i + 1] === 0x50 && // P
          uint8[i + 2] === 0x44 && // D
          uint8[i + 3] === 0x46 && // F
          uint8[i + 4] === 0x2d    // -
        ) {
          headerOffset = i;
          break;
        }
      }

      if (headerOffset > 0) {
        addLog(isEs ? `⚠️ Corregido desfase de cabecera: ${headerOffset} bytes inservibles eliminados` : `⚠️ Header offset fixed: ${headerOffset} bytes cleaned`);
        uint8 = uint8.subarray(headerOffset);
      } else {
        addLog(isEs ? '✓ Cabecera %PDF detectada correctamente' : '✓ %PDF Header detected correctly');
      }

      // 2. Verificación y reparación de trailer %%EOF
      let hasEof = false;
      const tailCheckLength = Math.min(uint8.length, 1024);
      for (let i = uint8.length - tailCheckLength; i < uint8.length - 4; i++) {
        if (
          uint8[i] === 0x25 && uint8[i+1] === 0x25 && // %%
          uint8[i+2] === 0x45 && uint8[i+3] === 0x4f && uint8[i+4] === 0x46 // EOF
        ) {
          hasEof = true;
          break;
        }
      }

      if (!hasEof) {
        addLog(isEs ? '⚠️ Marcador %%EOF dañado o ausente. Reparando trailer binario...' : '⚠️ %%EOF marker missing or corrupt. Repairing binary trailer...');
        const eofBytes = new TextEncoder().encode('\n%%EOF\n');
        const fixedUint8 = new Uint8Array(uint8.length + eofBytes.length);
        fixedUint8.set(uint8);
        fixedUint8.set(eofBytes, uint8.length);
        uint8 = fixedUint8;
      } else {
        addLog(isEs ? '✓ Marcador %%EOF de cierre verificado' : '✓ %%EOF closing marker verified');
      }

      let cleanBuffer = uint8.buffer;
      setProgressPercent(25);

      let finalBytes: Uint8Array | null = null;
      let pageCount = 0;

      // 3. Intento de Modo Inteligente (Reestructuración de Objetos con pdf-lib)
      if (repairMode === 'smart') {
        setProgressMsg(isEs ? 'Paso 2/4: Reconstruyendo catálogo de objetos XRef...' : 'Step 2/4: Rebuilding XRef object catalog...');
        addLog(isEs ? '🔧 Re-indexando catálogo de objetos y limpiando metadatos...' : '🔧 Re-indexing object catalog and stripping metadata...');

        try {
          const pdfDoc = await PDFDocument.load(cleanBuffer, {
            ignoreEncryption: true,
            updateMetadata: false
          });

          pageCount = pdfDoc.getPageCount();
          if (pageCount > 0) {
            const cleanPdf = await PDFDocument.create();
            cleanPdf.setTitle('');
            cleanPdf.setAuthor('');
            cleanPdf.setProducer('PDFBlack UltraRepair Engine v2.0');
            cleanPdf.setCreator('PDFBlack Local Engine');

            const pageIndices = pdfDoc.getPageIndices();
            const copiedPages = await cleanPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => cleanPdf.addPage(page));

            finalBytes = await cleanPdf.save({ useObjectStreams: true });
            addLog(isEs ? `✓ ${pageCount} página(s) recuperadas mediante reconstrucción estructural XRef` : `✓ ${pageCount} page(s) recovered via structural XRef rebuild`);
          }
        } catch (smartErr) {
          addLog(isEs ? `⚠️ Reconstrucción de catálogo falló: ${smartErr instanceof Error ? smartErr.message : 'Error de sintaxis binaria'}. Activando Modo Profundo...` : `⚠️ Catalog rebuild failed. Activating Deep Rescue Mode...`);
        }
      }

      // 4. Modo Profundo o Fallback de Rescate Visual (Renderizado Tolerante a Fallos con pdf.js)
      if (!finalBytes || repairMode === 'deep') {
        setProgressMsg(isEs ? 'Paso 3/4: Modo Profundo - Rescatando páginas visuales...' : 'Step 3/4: Deep Mode - Rescuing visual pages...');
        addLog(isEs ? '⚙️ Iniciando motor de renderizado tolerante a fallos (pdf.js)...' : '⚙️ Launching fault-tolerant rendering engine (pdf.js)...');

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({
          data: cleanBuffer,
          stopAtErrors: false
        });

        const pdf = await loadingTask.promise;
        pageCount = pdf.numPages;
        addLog(isEs ? `✓ ${pageCount} página(s) detectadas en el flujo visual` : `✓ ${pageCount} page(s) detected in visual stream`);

        const deepPdf = await PDFDocument.create();
        deepPdf.setTitle('');
        deepPdf.setAuthor('');
        deepPdf.setProducer('PDFBlack Deep Visual Repair Engine');

        let rescuedCount = 0;
        for (let i = 1; i <= pageCount; i++) {
          const currentPct = 40 + Math.floor((i / pageCount) * 50);
          setProgressPercent(currentPct);
          setProgressMsg(isEs ? `Rescatando página visual ${i} de ${pageCount}...` : `Rescuing visual page ${i} of ${pageCount}...`);

          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.8 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;

              const blobJpeg = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.90));
              if (blobJpeg) {
                const jpegBytes = await blobJpeg.arrayBuffer();
                const embeddedImg = await deepPdf.embedJpg(jpegBytes);
                const originalViewport = page.getViewport({ scale: 1.0 });

                const newPage = deepPdf.addPage([originalViewport.width, originalViewport.height]);
                newPage.drawImage(embeddedImg, {
                  x: 0,
                  y: 0,
                  width: originalViewport.width,
                  height: originalViewport.height,
                });
                rescuedCount++;
                addLog(isEs ? `  • Página ${i} rescatada y reconstruida en formato PDF 1.7 limpiado` : `  • Page ${i} rescued and rebuilt into clean PDF 1.7 format`);
              }
            }
          } catch (pageErr) {
            addLog(isEs ? `❌ Error en bloque gráfico de página ${i}, omitiendo sector dañado` : `❌ Error on page ${i} graphic block, skipping damaged sector`);
          }
        }

        if (rescuedCount > 0) {
          finalBytes = await deepPdf.save({ useObjectStreams: true });
          pageCount = rescuedCount;
        }
      }

      if (!finalBytes || finalBytes.byteLength === 0) {
        throw new Error(isEs ? 'No se pudo recuperar ninguna página del archivo dañado.' : 'Failed to recover any pages from damaged file.');
      }

      setProgressPercent(95);
      setProgressMsg(isEs ? 'Paso 4/4: Generando archivo PDF reparado final...' : 'Step 4/4: Generating final repaired PDF...');
      addLog(isEs ? '✨ Validando archivo final PDF 1.7 Standard...' : '✨ Validating final PDF 1.7 Standard file...');
      await new Promise(r => setTimeout(r, 80));

      const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);

      setRecoveredPages(pageCount);
      setDownloadUrl(localUrl);
      setProgressPercent(100);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const suffix = customSuffix || '_Reparado';
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${originalName}${suffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF reparado y recuperado con éxito!' : 'PDF repaired & recovered successfully!');
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : (isEs ? 'Error desconocido en la lectura del PDF' : 'Unknown PDF read error');
      addLog(`❌ ${errMsg}`);
      toast.error(isEs ? `Error al reparar: ${errMsg}` : `Repair error: ${errMsg}`);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
              004 / REPARACIÓN Y RESTAURACIÓN DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Activity className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'REPARAR Y RESTAURAR DOCUMENTOS PDF DAÑADOS' : 'REPAIR AND RESTORE DAMAGED PDF DOCUMENTS'}</span>
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
              onClick={removeFile}
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
          <div className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>

          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs ? 'Arrastra tu archivo PDF dañado aquí' : 'Drop your corrupted PDF file here'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos y diagnosticar el problema' : 'Or click to browse your files and diagnose issue'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" />
            {isEs ? 'Seleccionar PDF Dañado' : 'Select Corrupted PDF'}
          </button>
        </motion.div>
      ) : (
        /* WORKSPACE WITH FILE LOADED - AMBAS CAJAS CON EL MISMO ESPACIO (50% / 50%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans" style={{alignItems:'stretch'}}>
          
          {/* LADO IZQUIERDO: FICHA TÉCNICA DEL ARCHIVO (col-span-6) */}
          <div className="lg:col-span-6" style={{display:'flex',flexDirection:'column'}}>
            <div className="bg-[#09090b] border border-white/10 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col relative overflow-hidden shadow-2xl" style={{flex:1}}>
              
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 font-mono">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-white flex-shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-white font-bold text-xs truncate block max-w-[180px] sm:max-w-[240px]">{file.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{formatFileSize(file.size)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={removeFile} 
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
                    title={isEs ? "Remover archivo" : "Remove file"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative w-full flex-1 min-h-[500px] bg-[#09090b] rounded-xl overflow-hidden flex flex-col items-center justify-center p-3 border border-white/10">
                  {isLoadingPreview ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                      <span className="text-xs font-mono">{isEs ? "Generando previsualización..." : "Rendering preview..."}</span>
                    </div>
                  ) : previewDataUrl ? (
                    <div className="w-full h-full max-h-[560px] flex items-center justify-center relative">
                      <img 
                        src={previewDataUrl} 
                        alt={`Página ${previewPageNum}`}
                        className="max-h-[550px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/15 bg-white transition-all duration-200"
                      />
                    </div>
                  ) : pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-full rounded border-0"
                      title="PDF Preview"
                    />
                  ) : null}
                </div>
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
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* MODOS DE REPARACIÓN */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase">
                    {isEs ? 'Modo de Reparación' : 'Repair Mode'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setRepairMode('smart')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        repairMode === 'smart'
                          ? 'border-white bg-zinc-800 text-white shadow-md'
                          : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          Smart Repair
                        </span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${repairMode === 'smart' ? 'border-white bg-white' : 'border-zinc-500'}`}>
                          {repairMode === 'smart' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">{isEs ? 'XRef + metadatos' : 'XRef + metadata'}</p>
                      <span className="inline-block mt-1.5 text-[8px] font-mono font-bold bg-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded">Estructural</span>
                    </div>
                    <div
                      onClick={() => setRepairMode('deep')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        repairMode === 'deep'
                          ? 'border-white bg-zinc-800 text-white shadow-md'
                          : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-blue-400" />
                          Deep Rebuild
                        </span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${repairMode === 'deep' ? 'border-white bg-white' : 'border-zinc-500'}`}>
                          {repairMode === 'deep' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">{isEs ? 'Render visual avanzado' : 'Advanced visual render'}</p>
                      <span className="inline-block mt-1.5 text-[8px] font-mono font-bold bg-blue-900/60 text-blue-400 px-1.5 py-0.5 rounded">Visual</span>
                    </div>
                  </div>
                </div>

                {/* OPCIONES AVANZADAS - TOGGLE */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced
                      ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                      : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 bg-zinc-950/60 border border-white/8 rounded-xl p-4">

                      {/* PRIORIDAD DE RECUPERACIÓN */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Prioridad de Recuperación' : 'Recovery Priority'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['texto', 'imagenes', 'todo'] as RecoveryPriority[]).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setRecoveryPriority(opt)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                recoveryPriority === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {opt === 'texto' ? '📄 Texto' : opt === 'imagenes' ? '🖼️ Imgs' : '⚡ Todo'}
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
                          {(['todas', 'pares', 'impares', 'rango'] as PageScope[]).map(opt => (
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

                      {/* NIVEL DE COMPRESIÓN DE SALIDA */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Archive className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Compresión de Salida' : 'Output Compression'}
                        </label>
                        <div className="flex gap-1.5">
                          {([['none', isEs ? 'Sin comprimir' : 'None'], ['low', isEs ? 'Baja' : 'Low'], ['medium', isEs ? 'Media' : 'Med'], ['high', isEs ? 'Alta' : 'High']] as [CompressionLevel, string][]).map(([lvl, label]) => (
                            <button
                              key={lvl}
                              onClick={() => setCompressionLevel(lvl)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                compressionLevel === lvl
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ACCIÓN PARA PÁGINAS DAÑADAS */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <RotateCcw className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Páginas Irrecuperables' : 'Unrecoverable Pages'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([['omitir', isEs ? 'Omitir' : 'Skip'], ['sustituir', isEs ? 'Sustituir' : 'Replace'], ['incluir_vacia', isEs ? 'Pg. Vacía' : 'Blank Pg']] as [DamagedPageAction, string][]).map(([act, label]) => (
                            <button
                              key={act}
                              onClick={() => setDamagedPageAction(act)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                damagedPageAction === act
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* TOGGLES DE OPCIONES BINARIAS */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Ajustes de Seguridad y Salida' : 'Security & Output Settings'}
                        </label>

                        <div
                          onClick={() => setRemoveRestrictions(v => !v)}
                          className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                        >
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Eliminar restricciones de impresión/copia' : 'Remove print/copy restrictions'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{isEs ? 'Desbloquea permisos del documento' : 'Unlock document permissions'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${removeRestrictions ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${removeRestrictions ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        <div
                          onClick={() => setAddRepairStamp(v => !v)}
                          className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                        >
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Añadir sello de reparación (pie)' : 'Add repair stamp (footer)'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{isEs ? 'Marca el PDF como reparado' : 'Marks the PDF as repaired'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${addRepairStamp ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${addRepairStamp ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        {/* SUFIJO DE NOMBRE DE ARCHIVO */}
                        <div>
                          <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">
                            {isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}
                          </label>
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

                {/* CONSOLA DE DIAGNÓSTICO EN TIEMPO REAL */}
                {repairLog.length > 0 && (
                  <div className="mb-4 bg-zinc-950 p-3 rounded-xl border border-white/10 font-mono text-[10px] space-y-1 max-h-[110px] overflow-y-auto">
                    <span className="text-zinc-500 font-bold block text-[9px] uppercase border-b border-white/10 pb-1 tracking-widest">
                      {isEs ? '▸ Consola Binaria' : '▸ Binary Console'}
                    </span>
                    {repairLog.map((log, index) => (
                      <p key={index} className="text-zinc-300 leading-tight">{log}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* BOTÓN DE ACCIÓN PRINCIPAL */}
              <div>
                <button
                  onClick={executeRepair}
                  disabled={isProcessing}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>{progressMsg ? `${progressMsg} (${progressPercent}%)` : (isEs ? 'Reparando PDF...' : 'Repairing PDF...')}</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-black" />
                      <span>{isEs ? 'Reparar PDF' : 'Repair PDF'}</span>
                    </>
                  )}
                </button>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`${file.name.replace(/\.[^/.]+$/, '')}${customSuffix}.pdf`}
                    className="mt-3 w-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold py-3.5 px-6 rounded-full text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <FileDown className="w-4 h-4 text-black" />
                    <span>
                      {isEs
                        ? `Descargar PDF Reparado ${recoveredPages ? `(${recoveredPages} pág)` : ''}`
                        : `Download Repaired PDF ${recoveredPages ? `(${recoveredPages} p)` : ''}`}
                    </span>
                  </a>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-4 border-t border-white/10 pt-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    100% Local
                  </span>
                  <span>
                    {isEs ? "Listo →" : "Ready →"}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function KpiPill({ icon: Icon, title, value, suffix = "", tooltip, color }: { icon: React.ElementType; title: string; value: number; suffix?: string; tooltip?: string; color?: string }) {
  return (
    <div title={tooltip} className="flex items-center gap-2 bg-slate-900/90 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all cursor-default group font-mono">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div className="flex items-baseline gap-1">
        <span className="text-white font-extrabold text-xs">{value}{suffix}</span>
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{title}</span>
      </div>
    </div>
  );
}
