'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { 
  Merge, FileText, Trash2, Loader2, ArrowUp, ArrowDown, Plus, 
  Sliders, ChevronDown, ChevronUp, Download, UploadCloud, ShieldCheck, 
  ArrowLeft, Sparkles, LayoutGrid, CheckCircle2, Compass, Grid, Layers, Zap, Cpu, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type PageOrientation = 'original' | 'portrait' | 'landscape';
type PageSizeOption = 'original' | 'a4' | 'letter';
type SeparatorOption = 'none' | 'blank' | 'title_page';

interface FileItem {
  id: string;
  file: File;
  pageCount: number;
  pageRange: string; // e.g. "all" or "1-3, 5"
  thumbnailUrl?: string;
}

export default function PdfMerger() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // OPCIONES AVANZADAS DE UNIÓN
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<PageOrientation>('original');
  const [pageSize, setPageSize] = useState<PageSizeOption>('original');
  const [separatorMode, setSeparatorMode] = useState<SeparatorOption>('none');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);
  const [duplexMode, setDuplexMode] = useState<boolean>(false);

  const { globalFiles, globalFile } = useFileStore();
  const loadedFromStoreRef = useRef(false);

  const processAndAddFileList = async (fileList: File[]) => {
    const selected = fileList.filter(f => f.type === 'application/pdf');
    if (selected.length === 0) return;

    const newItems: FileItem[] = [];
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    for (const f of selected) {
      try {
        const buffer = await f.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const count = doc.getPageCount();

        let thumbUrl: string | undefined = undefined;
        try {
          const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
          const page = await pdfjsDoc.getPage(1);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          if (context) {
            await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
            thumbUrl = canvas.toDataURL();
          }
        } catch (e) {
          console.warn("Could not generate thumbnail for file:", f.name);
        }

        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          pageCount: count,
          pageRange: 'all',
          thumbnailUrl: thumbUrl
        });
      } catch {
        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          pageCount: 1,
          pageRange: 'all'
        });
      }
    }

    setFiles(prev => [...prev, ...newItems]);
    setDownloadUrl(null);
  };

  useEffect(() => {
    if (!loadedFromStoreRef.current && files.length === 0) {
      const filesToLoad = globalFiles && globalFiles.length > 0 
        ? globalFiles 
        : (globalFile ? [globalFile] : []);

      if (filesToLoad.length > 0) {
        loadedFromStoreRef.current = true;
        processAndAddFileList(filesToLoad);
      }
    }
  }, [globalFiles, globalFile, files.length]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (selected.length === 0) {
        toast.error(isEs ? 'Por favor, selecciona archivos PDF válidos' : 'Please select valid PDF files');
        return;
      }

      toast.info(isEs ? 'Analizando páginas de los archivos...' : 'Analyzing file pages...');
      await processAndAddFileList(selected);
      toast.success(isEs ? `${selected.length} archivo(s) añadido(s)` : `${selected.length} file(s) added`);
    }
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(item => item.id !== id));
    setDownloadUrl(null);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setDownloadUrl(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    setFiles(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setDownloadUrl(null);
  };

  const updatePageRange = (id: string, range: string) => {
    setFiles(prev => prev.map(item => item.id === id ? { ...item, pageRange: range } : item));
  };

  const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const indices: Set<number> = new Set();
    const parts = rangeStr.split(',');

    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = Math.max(1, parseInt(startStr, 10) || 1);
        const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          indices.add(p - 1);
        }
      }
    });

    return Array.from(indices).sort((a, b) => a - b);
  };

  const executeMerge = async () => {
    if (files.length < 2) {
      toast.error(isEs ? 'Debes agregar al menos 2 archivos PDF para unirlos.' : 'You must add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    let localUrl: string | null = null;

    try {
      setProgressMsg(isEs ? 'Creando documento unificado...' : 'Creating unified document...');
      const mergedPdf = await PDFDocument.create();
      const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgressMsg(isEs ? `Procesando ${item.file.name} (${i + 1}/${files.length})...` : `Processing ${item.file.name} (${i + 1}/${files.length})...`);
        setProgressPercent(10 + Math.floor(((i + 1) / files.length) * 75));
        await new Promise(r => setTimeout(r, 10));

        // 1. CARÁTULA SEPARADORA SI APLICA
        if (separatorMode === 'title_page') {
          const sepPage = mergedPdf.addPage([595.28, 841.89]);
          sepPage.drawText(`DOCUMENTO ${i + 1}`, {
            x: 50,
            y: 750,
            size: 12,
            font: helveticaBold,
            color: rgb(0.6, 0.4, 1.0)
          });
          sepPage.drawText(item.file.name, {
            x: 50,
            y: 710,
            size: 20,
            font: helveticaBold,
            color: rgb(1, 1, 1)
          });
          sepPage.drawText(`${item.pageCount} ${isEs ? 'páginas en original' : 'pages in original'}`, {
            x: 50,
            y: 680,
            size: 11,
            font: helveticaFont,
            color: rgb(0.7, 0.7, 0.7)
          });
        } else if (separatorMode === 'blank' && i > 0) {
          mergedPdf.addPage([595.28, 841.89]);
        }

        // 2. CARGAR Y COPIAR PÁGINAS DEL ARCHIVO
        const arrayBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const total = pdfDoc.getPageCount();
        const selectedIndices = parsePageRange(item.pageRange, total);

        if (selectedIndices.length === 0) continue;

        const copiedPages = await mergedPdf.copyPages(pdfDoc, selectedIndices);

        copiedPages.forEach(page => {
          if (orientation === 'portrait') {
            page.setRotation(degrees(0));
          } else if (orientation === 'landscape') {
            page.setRotation(degrees(90));
          }

          if (pageSize === 'a4') {
            page.setSize(595.28, 841.89);
          } else if (pageSize === 'letter') {
            page.setSize(612, 792);
          }

          mergedPdf.addPage(page);
        });

        if (duplexMode && (selectedIndices.length % 2 !== 0)) {
          mergedPdf.addPage([595.28, 841.89]);
        }
      }

      if (addPageNumbers) {
        const pages = mergedPdf.getPages();
        const totalNumPages = pages.length;
        pages.forEach((p, idx) => {
          const { width } = p.getSize();
          p.drawText(`${idx + 1} / ${totalNumPages}`, {
            x: width / 2 - 15,
            y: 18,
            size: 9,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        });
      }

      setProgressMsg(isEs ? 'Compilando documento final...' : 'Compiling final document...');
      setProgressPercent(95);

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = 'Documento_Unificado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgressPercent(100);
      toast.success(isEs ? '¡Archivos PDF unidos con éxito!' : 'PDF files merged successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al unir los archivos.' : 'An error occurred while merging files.');
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
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" multiple className="hidden" ref={fileInputRef} onChange={handleFilesSelected} disabled={isProcessing} />
      <input type="file" accept=".pdf" multiple className="hidden" ref={addMoreInputRef} onChange={handleFilesSelected} disabled={isProcessing} />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/organizar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "002 / FUSIÓN Y COMBINACIÓN DE DOCUMENTOS" : "002 / DOCUMENT FUSION & MERGING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Merge className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "UNIR O COMBINAR DOCUMENTOS PDF" : "MERGE PDF DOCUMENTS"}
            </h1>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold">{files.length} {isEs ? 'Archivos seleccionados' : 'Files selected'}</span>
            </div>
            <button 
              onClick={handleRemoveAllFiles} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Limpiar todos los archivos" : "Remove all files"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {files.length === 0 ? (
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
            {isEs ? "UNIR O COMBINAR DOCUMENTOS PDF" : "MERGE PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Combina dos o más archivos PDF en un único documento de forma 100% confidencial y local." : "Combine two or more PDF files into a single document 100% locally."}
          </p>
          <button 
            type="button"
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? "Seleccionar Archivos PDF" : "Select PDF Files"}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span>
          </div>
        </motion.div>
      ) : (
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISTA PREVIA DE ARCHIVOS */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: REJILLA DE ARCHIVOS Y MINIATURAS DE UNIÓN */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / ARCHIVOS A UNIR (${files.length} DOCUMENTOS)` : `001 / FILES TO MERGE (${files.length} DOCS)`}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addMoreInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  {isEs ? 'Añadir más' : 'Add more'}
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {files.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative group bg-zinc-950 border border-white/10 hover:border-white/30 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xl font-mono"
                  >
                    {/* ORDEN DE UNIÓN PAGO TOP LEFT */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-white/10 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-white/10">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button" onClick={() => moveFile(index, 'up')} disabled={index === 0}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 rounded-lg border border-white/10 transition-colors cursor-pointer"
                          title={isEs ? "Mover arriba" : "Move up"}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button" onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 rounded-lg border border-white/10 transition-colors cursor-pointer"
                          title={isEs ? "Mover abajo" : "Move down"}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button" onClick={() => removeFile(item.id)}
                          className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors cursor-pointer"
                          title={isEs ? "Eliminar" : "Remove"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* VISTA PREVIA O ICONO DE PDF */}
                    <div className="w-full aspect-[4/3] bg-zinc-900/80 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-white/5 relative">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.file.name} className="w-full h-full object-contain p-2 rounded-xl bg-white" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono">
                          <FileText className="w-10 h-10 text-zinc-400" />
                          <span className="text-[10px] font-bold uppercase">{item.pageCount} {isEs ? 'Páginas' : 'Pages'}</span>
                        </div>
                      )}
                    </div>

                    {/* NOMBRE Y DETALLES */}
                    <div className="space-y-2">
                      <h4 className="text-white font-bold text-xs truncate max-w-full font-sans" title={item.file.name}>{item.file.name}</h4>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{formatFileSize(item.file.size)}</span>
                        <span>{item.pageCount} {isEs ? 'páginas' : 'pages'}</span>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px]">
                        <span className="text-zinc-400 flex-shrink-0">{isEs ? 'Rango:' : 'Range:'}</span>
                        <input
                          type="text"
                          placeholder="all (ej: 1-3, 5)"
                          value={item.pageRange}
                          onChange={(e) => updatePageRange(item.id, e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-white text-[10px] font-mono outline-none focus:border-white/30"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL DE UNIÓN */}
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

              {/* 1. SEPARADORES ENTRE DOCUMENTOS */}
              <div className="mb-5 font-mono">
                <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Separadores entre Documentos" : "Document Separators"}</label>
                <select
                  value={separatorMode} onChange={(e) => setSeparatorMode(e.target.value as SeparatorOption)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-white/30"
                >
                  <option value="none">{isEs ? "Sin separadores (Directo)" : "None (Direct)"}</option>
                  <option value="blank">{isEs ? "Insertar página en blanco" : "Insert blank page"}</option>
                  <option value="title_page">{isEs ? "Insertar carátula con nombre" : "Insert title page"}</option>
                </select>
              </div>

              {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer my-4 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas" : "Advanced Options"}</span>
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
                    className="space-y-4 pt-1 border-t border-white/5 font-mono overflow-hidden"
                  >
                    {/* ORIENTACIÓN Y TAMAÑO DE PAPEL */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Orientación:" : "Orientation:"}</label>
                        <select
                          value={orientation} onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                          className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-white outline-none cursor-pointer focus:border-white/30"
                        >
                          <option value="original">{isEs ? "Original" : "Original"}</option>
                          <option value="portrait">{isEs ? "Vertical" : "Portrait"}</option>
                          <option value="landscape">{isEs ? "Horizontal" : "Landscape"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Papel:" : "Paper Size:"}</label>
                        <select
                          value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                          className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-white outline-none cursor-pointer focus:border-white/30"
                        >
                          <option value="original">{isEs ? "Original" : "Original"}</option>
                          <option value="a4">A4</option>
                          <option value="letter">Carta</option>
                        </select>
                      </div>
                    </div>

                    {/* METADATOS Y NUMERACIÓN CONTINUA */}
                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "AJUSTES DE NUMERACIÓN Y PÁGINAS" : "NUMBERING & PAGE SETTINGS"}</label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={addPageNumbers} onChange={(e) => setAddPageNumbers(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Numeración continua (Página N / M)" : "Continuous numbering (Page N / M)"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={duplexMode} onChange={(e) => setDuplexMode(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Modo Dúplex (Inicio en página impar)" : "Duplex mode (Start on odd page)"}</span>
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
                onClick={executeMerge} 
                disabled={isProcessing || files.length < 2} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (files.length < 2 ? (isEs ? 'Selecciona 2 o más archivos' : 'Select 2 or more files') : (isEs ? `Unir ${files.length} Archivos PDF →` : `Merge ${files.length} PDF Files →`))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      
    </div>
  );
}