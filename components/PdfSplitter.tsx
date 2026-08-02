'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  Scissors, FileText, X, Loader2, FilePlus, Sliders, 
  FileDown, UploadCloud, Layers, Archive, 
  Plus, Check, Trash2, CheckSquare, Square, Layers3, LayoutGrid, Maximize2,
  ChevronDown, ChevronUp, Type, Sparkles, Filter, ShieldCheck, ArrowLeft, Zap, Cpu
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type MainTab = 'rango' | 'paginas' | 'tamano';
type RangeSubMode = 'personalizado' | 'fijo' | 'inteligente';

interface RangeItem {
  id: string;
  from: number;
  to: number;
}

export default function PdfSplitter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => {
    if (globalFile && globalFile.type === 'application/pdf') return globalFile;
    return null;
  });

  const [totalPages, setTotalPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // RESULTADOS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [createdCount, setCreatedCount] = useState<number>(0);

  // ESTADO DE LA INTERFAZ Y TABS
  const [mainTab, setMainTab] = useState<MainTab>('rango');
  const [rangeSubMode, setRangeSubMode] = useState<RangeSubMode>('personalizado');
  const [ranges, setRanges] = useState<RangeItem[]>([
    { id: '1', from: 1, to: 1 }
  ]);
  const [mergeAllRanges, setMergeAllRanges] = useState<boolean>(false);

  // OPCIONES AVANZADAS
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [extractMode, setExtractMode] = useState<'all' | 'specific' | 'even' | 'odd'>('all');
  const [specificPagesInput, setSpecificPagesInput] = useState<string>('1, 2, 3');
  const [chunkPageCount, setChunkPageCount] = useState<number>(5);
  const [createZip, setCreateZip] = useState<boolean>(true);
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Dividido');
  const [skipBlankPages, setSkipBlankPages] = useState<boolean>(false);
  const [addPageFooterNumbering, setAddPageFooterNumbering] = useState<boolean>(false);

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

  // Cargar información de páginas al seleccionar archivo
  const inspectPdfPages = useCallback(async (selectedFile: File) => {
    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setTotalPages(count);
      setRanges([{ id: '1', from: 1, to: count }]);
      setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, ""));
    } catch {
      toast.error(isEs ? 'Error al leer la estructura de páginas del PDF' : 'Error reading PDF page structure');
    }
  }, [isEs]);

  useEffect(() => {
    if (file && totalPages === 0) {
      let isMounted = true;
      (async () => {
        try {
          const buffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const count = pdfDoc.getPageCount();
          if (isMounted) {
            setTotalPages(count);
            setRanges([{ id: '1', from: 1, to: count }]);
            setFilePrefix(file.name.replace(/\.[^/.]+$/, ""));
          }
        } catch {
          // ignore
        }
      })();
      return () => { isMounted = false; };
    }
  }, [file, totalPages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
        return;
      }
      setFile(selected);
      setGlobalFile(selected);
      setDownloadUrl(null);
      setCreatedCount(0);
      inspectPdfPages(selected);
      toast.success(isEs ? 'Archivo cargado con éxito' : 'File loaded successfully');
    }
    e.target.value = '';
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setDownloadUrl(null);
    setGlobalFile(null);
    setCreatedCount(0);
    setRanges([{ id: '1', from: 1, to: 1 }]);
  }, [setGlobalFile]);

  // MANEJO DE RANGOS MÚLTIPLES
  const handleAddRange = () => {
    if (totalPages === 0) return;
    const lastRange = ranges[ranges.length - 1];
    const newFrom = lastRange ? Math.min(lastRange.to + 1, totalPages) : 1;
    const newTo = totalPages;
    setRanges(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, from: newFrom, to: newTo }]);
    setDownloadUrl(null);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length === 1) return;
    setRanges(prev => prev.filter(r => r.id !== id));
    setDownloadUrl(null);
  };

  const handleUpdateRange = (id: string, field: 'from' | 'to', value: number) => {
    const val = Math.max(1, Math.min(totalPages || 1, value));
    setRanges(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: val };
        if (field === 'from' && updated.from > updated.to) updated.to = updated.from;
        if (field === 'to' && updated.to < updated.from) updated.from = updated.to;
        return updated;
      }
      return r;
    }));
    setDownloadUrl(null);
  };

  const executeSplit = async () => {
    if (!file || totalPages === 0) {
      toast.error(isEs ? 'Por favor carga un archivo PDF' : 'Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Procesando páginas vectoriales...' : 'Processing vector pages...');

    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      let pageGroups: number[][] = [];

      if (mainTab === 'rango') {
        if (rangeSubMode === 'personalizado') {
          pageGroups = ranges.map(r => {
            const indices: number[] = [];
            const start = Math.max(0, r.from - 1);
            const end = Math.min(totalPages - 1, r.to - 1);
            for (let i = start; i <= end; i++) indices.push(i);
            return indices;
          }).filter(g => g.length > 0);
        } else if (rangeSubMode === 'fijo') {
          const chunkSize = Math.max(1, chunkPageCount);
          for (let i = 0; i < totalPages; i += chunkSize) {
            const chunk: number[] = [];
            for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) chunk.push(j);
            pageGroups.push(chunk);
          }
        } else {
          // Inteligente (divide cada 10 páginas)
          const chunkSize = 10;
          for (let i = 0; i < totalPages; i += chunkSize) {
            const chunk: number[] = [];
            for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) chunk.push(j);
            pageGroups.push(chunk);
          }
        }
      } else if (mainTab === 'paginas') {
        if (extractMode === 'all') {
          for (let i = 0; i < totalPages; i++) pageGroups.push([i]);
        } else if (extractMode === 'even') {
          const evens: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            if ((i + 1) % 2 === 0) evens.push(i);
          }
          pageGroups.push(evens);
        } else if (extractMode === 'odd') {
          const odds: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            if ((i + 1) % 2 !== 0) odds.push(i);
          }
          pageGroups.push(odds);
        } else {
          const indices: Set<number> = new Set();
          specificPagesInput.split(',').forEach(p => {
            const num = parseInt(p.trim(), 10);
            if (!isNaN(num) && num >= 1 && num <= totalPages) indices.add(num - 1);
          });
          if (indices.size > 0) pageGroups.push(Array.from(indices).sort((a, b) => a - b));
        }
      } else {
        // TAB TAMAÑO
        const size = Math.max(1, chunkPageCount);
        for (let i = 0; i < totalPages; i += size) {
          const chunk: number[] = [];
          for (let j = i; j < Math.min(i + size, totalPages); j++) chunk.push(j);
          pageGroups.push(chunk);
        }
      }

      if (pageGroups.length === 0) {
        toast.error(isEs ? 'No se generaron grupos de páginas válidos' : 'No valid page groups generated');
        setIsProcessing(false);
        return;
      }

      // SI SE SELECCIONÓ UNIR TODOS LOS RANGOS EN UN SOLO PDF
      if (mainTab === 'rango' && mergeAllRanges) {
        setProgressMsg(isEs ? 'Uniendo todos los rangos en un solo PDF...' : 'Merging all ranges into single PDF...');
        const newPdf = await PDFDocument.create();
        const font = await newPdf.embedFont(StandardFonts.Helvetica);
        const allIndices = pageGroups.flat();
        const copied = await newPdf.copyPages(srcDoc, allIndices);

        copied.forEach((p, idx) => {
          if (addPageFooterNumbering) {
            const { width } = p.getSize();
            p.drawText(`Página ${idx + 1} de ${copied.length}`, {
              x: width / 2 - 30,
              y: 15,
              size: 9,
              font,
              color: rgb(0.5, 0.5, 0.5),
            });
          }
          newPdf.addPage(p);
        });

        const bytes = await newPdf.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const localUrl = URL.createObjectURL(blob);
        const outName = `${filePrefix}_Rangos_Unidos.pdf`;

        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        setCreatedCount(1);
        triggerDownload(localUrl, outName);
        setProgressPercent(100);
        toast.success(isEs ? '¡Rangos unidos en un único PDF!' : 'Ranges merged into a single PDF!');
      } else if (pageGroups.length === 1) {
        const newPdf = await PDFDocument.create();
        const font = await newPdf.embedFont(StandardFonts.Helvetica);
        const copied = await newPdf.copyPages(srcDoc, pageGroups[0]);

        copied.forEach((p, idx) => {
          if (addPageFooterNumbering) {
            const { width } = p.getSize();
            p.drawText(`Página ${idx + 1} de ${copied.length}`, {
              x: width / 2 - 30,
              y: 15,
              size: 9,
              font,
              color: rgb(0.5, 0.5, 0.5),
            });
          }
          newPdf.addPage(p);
        });

        const bytes = await newPdf.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const localUrl = URL.createObjectURL(blob);
        const outName = `${filePrefix}_Rango_1.pdf`;

        setDownloadFilename(outName);
        setDownloadUrl(localUrl);
        setCreatedCount(1);
        triggerDownload(localUrl, outName);
        setProgressPercent(100);
        toast.success(isEs ? '¡PDF dividido con éxito!' : 'PDF split successfully!');
      } else {
        if (createZip) {
          setProgressMsg(isEs ? 'Empaquetando en archivo .ZIP...' : 'Packaging into .ZIP file...');
          const zip = new JSZip();

          for (let i = 0; i < pageGroups.length; i++) {
            setProgressPercent(20 + Math.floor((i / pageGroups.length) * 70));
            const newPdf = await PDFDocument.create();
            const font = await newPdf.embedFont(StandardFonts.Helvetica);
            const copied = await newPdf.copyPages(srcDoc, pageGroups[i]);

            copied.forEach((p, pIdx) => {
              if (addPageFooterNumbering) {
                const { width } = p.getSize();
                p.drawText(`Página ${pIdx + 1} de ${copied.length}`, {
                  x: width / 2 - 30,
                  y: 15,
                  size: 9,
                  font,
                  color: rgb(0.5, 0.5, 0.5),
                });
              }
              newPdf.addPage(p);
            });

            const bytes = await newPdf.save();
            const partName = `${filePrefix}_Rango_${i + 1}.pdf`;
            zip.file(partName, bytes);
          }

          const zipContent = await zip.generateAsync({ type: 'blob' });
          const localUrl = URL.createObjectURL(zipContent);
          const zipName = `${filePrefix}_Dividido.zip`;

          setDownloadFilename(zipName);
          setDownloadUrl(localUrl);
          setCreatedCount(pageGroups.length);
          triggerDownload(localUrl, zipName);
          setProgressPercent(100);
          toast.success(isEs ? `¡${pageGroups.length} rangos empaquetados en .ZIP!` : `¡${pageGroups.length} ranges packaged into .ZIP!`);
        } else {
          const newPdf = await PDFDocument.create();
          const copied = await newPdf.copyPages(srcDoc, pageGroups[0]);
          copied.forEach(p => newPdf.addPage(p));

          const bytes = await newPdf.save();
          const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
          const localUrl = URL.createObjectURL(blob);
          const outName = `${filePrefix}_Rango_1.pdf`;

          setDownloadFilename(outName);
          setDownloadUrl(localUrl);
          setCreatedCount(pageGroups.length);
          triggerDownload(localUrl, outName);
          setProgressPercent(100);
          toast.success(isEs ? `Descargado rango 1 de ${pageGroups.length}` : `Downloaded range 1 of ${pageGroups.length}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al procesar la división' : 'Error processing split');
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
              {isEs ? "002 / CORTE Y DIVISIÓN DE DOCUMENTOS PDF" : "002 / PDF CUTTING & SPLITTING"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Scissors className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF" : "SPLIT OR EXTRACT PDF PAGES"}
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
            {isEs ? "DIVIDIR O EXTRAER PÁGINAS DE DOCUMENTOS PDF" : "SPLIT OR EXTRACT PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Separa o extrae rangos de páginas de tu PDF de forma 100% confidencial y local." : "Split or extract ranges of pages from your PDF 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y VISTA PREVIA DE RANGOS DE HOJAS */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: VISTA PREVIA Y RANGOS DE HOJAS */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / VISTA PREVIA Y RANGOS DE HOJAS (${totalPages} PÁGINAS)` : `001 / PREVIEW & PAGE RANGES (${totalPages} PAGES)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local
              </div>
            </div>

            {/* DETALLES DEL ARCHIVO CARGADO */}
            <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl mb-4 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-white font-bold block truncate">{file.name}</span>
                  <span className="text-[10px] text-zinc-400">{formatFileSize(file.size)} • {totalPages} {isEs ? 'páginas en total' : 'total pages'}</span>
                </div>
              </div>
              <button onClick={removeFile} className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* VISUALIZADOR GRAFICO DE MINIATURAS DE RANGOS */}
            <div className="flex-1 overflow-y-auto max-h-[580px] pr-2 space-y-6">
              {ranges.map((r, idx) => (
                <div key={r.id} className="flex flex-col items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {isEs ? `Rango ${idx + 1}` : `Range ${idx + 1}`}
                  </span>

                  {/* CUADRO DE VISTA PREVIA DEL RANGO */}
                  <div className="w-full bg-zinc-950/80 border border-dashed border-white/20 hover:border-rose-400/40 rounded-2xl p-6 flex items-center justify-center gap-6 shadow-inner transition-colors">
                    
                    {/* MINIATURA PÁGINA INICIO (FROM) */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-28 sm:w-36 h-36 sm:h-48 bg-white rounded-xl shadow-2xl border border-zinc-300 p-3 flex flex-col justify-between text-zinc-800 relative overflow-hidden group">
                        <div className="space-y-1.5 opacity-60">
                          <div className="h-2 w-3/4 bg-zinc-400 rounded"></div>
                          <div className="h-1.5 w-full bg-zinc-300 rounded"></div>
                          <div className="h-1.5 w-5/6 bg-zinc-300 rounded"></div>
                          <div className="h-1.5 w-4/6 bg-zinc-300 rounded"></div>
                          <div className="h-1.5 w-full bg-zinc-300 rounded"></div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 font-mono text-center">
                          Pág. {r.from}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-white font-mono">{r.from}</span>
                    </div>

                    {/* PUNTOS SUSPENSIVOS SI HAY MÁS DE 1 PÁGINA EN EL RANGO */}
                    {r.to > r.from && (
                      <div className="flex items-center justify-center font-extrabold text-zinc-500 text-2xl tracking-widest">
                        ...
                      </div>
                    )}

                    {/* MINIATURA PÁGINA FIN (TO) */}
                    {r.to > r.from && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-28 sm:w-36 h-36 sm:h-48 bg-white rounded-xl shadow-2xl border border-zinc-300 p-3 flex flex-col justify-between text-zinc-800 relative overflow-hidden group">
                          <div className="space-y-1.5 opacity-60">
                            <div className="h-1.5 w-full bg-zinc-300 rounded"></div>
                            <div className="h-1.5 w-4/5 bg-zinc-300 rounded"></div>
                            <div className="h-1.5 w-full bg-zinc-300 rounded"></div>
                            <div className="h-1.5 w-2/3 bg-zinc-300 rounded"></div>
                            <div className="h-2 w-1/2 bg-zinc-400 rounded mt-4"></div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 font-mono text-center">
                            Pág. {r.to}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-white font-mono">{r.to}</span>
                      </div>
                    )}

                  </div>
                </div>
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

              {/* TABS SUPERIORES [0-0] RANGO, PÁGINAS, TAMAÑO */}
              <div className="grid grid-cols-3 border border-white/10 bg-zinc-950 rounded-xl overflow-hidden mb-5 p-1 gap-1 font-mono">
                <button
                  onClick={() => setMainTab('rango')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'rango' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers3 className="w-4 h-4" />
                  <span>{isEs ? 'Rango' : 'Range'}</span>
                </button>

                <button
                  onClick={() => setMainTab('paginas')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'paginas' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{isEs ? 'Páginas' : 'Pages'}</span>
                </button>

                <button
                  onClick={() => setMainTab('tamano')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative ${
                    mainTab === 'tamano' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>{isEs ? 'Tamaño' : 'Size'}</span>
                </button>
              </div>

              {/* CONTENIDO TAB 1: RANGO */}
              {mainTab === 'rango' && (
                <div className="space-y-4 font-mono">
                  <div>
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Rango:" : "Range Mode:"}</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setRangeSubMode('personalizado')}
                        className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          rangeSubMode === 'personalizado' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Personalizado' : 'Custom'}
                      </button>

                      <button
                        onClick={() => setRangeSubMode('fijo')}
                        className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          rangeSubMode === 'fijo' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Fijo' : 'Fixed'}
                      </button>

                      <button
                        onClick={() => setRangeSubMode('inteligente')}
                        className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          rangeSubMode === 'inteligente' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? 'Inteligente' : 'Smart'}
                      </button>
                    </div>
                  </div>

                  {/* CONTROLES DE RANGOS */}
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {ranges.map((r, idx) => (
                      <div key={r.id} className="bg-zinc-950 border border-white/10 p-2.5 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-white">
                          <span>{isEs ? `Rango ${idx + 1}` : `Range ${idx + 1}`}</span>
                          {ranges.length > 1 && (
                            <button onClick={() => handleRemoveRange(r.id)} className="text-zinc-400 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-300">
                          <span className="text-[10px] text-zinc-400">{isEs ? "de la página" : "from page"}</span>
                          <input
                            type="number" min={1} max={totalPages || 100} value={r.from}
                            onChange={(e) => handleUpdateRange(r.id, 'from', parseInt(e.target.value, 10) || 1)}
                            className="w-14 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                          />
                          <span className="text-[10px] text-zinc-400">{isEs ? "a" : "to"}</span>
                          <input
                            type="number" min={1} max={totalPages || 100} value={r.to}
                            onChange={(e) => handleUpdateRange(r.id, 'to', parseInt(e.target.value, 10) || 1)}
                            className="w-14 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddRange}
                    className="w-full border border-white/20 hover:border-white/40 bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Añadir Rango' : 'Add Range'}</span>
                  </button>

                  <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-bold text-zinc-300 pt-1">
                    <input
                      type="checkbox" checked={mergeAllRanges} onChange={(e) => setMergeAllRanges(e.target.checked)}
                      className="accent-white w-4 h-4 rounded"
                    />
                    <span>{isEs ? 'Unir todos los rangos en un único PDF.' : 'Merge all ranges into single PDF.'}</span>
                  </label>
                </div>
              )}

              {/* CONTENIDO TAB 2: PÁGINAS */}
              {mainTab === 'paginas' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'all'} onChange={() => setExtractMode('all')} className="accent-white" />
                      <span>{isEs ? 'Extraer todas las páginas (1 PDF / pág)' : 'Extract every page (1 PDF / page)'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'even'} onChange={() => setExtractMode('even')} className="accent-white" />
                      <span>{isEs ? 'Extraer solo páginas pares' : 'Extract even pages only'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'odd'} onChange={() => setExtractMode('odd')} className="accent-white" />
                      <span>{isEs ? 'Extraer solo páginas impares' : 'Extract odd pages only'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[11px]">
                      <input type="radio" name="extractMode" checked={extractMode === 'specific'} onChange={() => setExtractMode('specific')} className="accent-white" />
                      <span>{isEs ? 'Extraer páginas específicas' : 'Extract specific pages'}</span>
                    </label>
                  </div>

                  {extractMode === 'specific' && (
                    <input
                      type="text" value={specificPagesInput} onChange={(e) => setSpecificPagesInput(e.target.value)}
                      placeholder="1, 3, 5"
                      className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-white/50"
                    />
                  )}
                </div>
              )}

              {/* CONTENIDO TAB 3: TAMAÑO */}
              {mainTab === 'tamano' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">{isEs ? "Dividir cada N páginas:" : "Chunk every N pages:"}</label>
                    <input
                      type="number" min={1} max={totalPages || 100} value={chunkPageCount}
                      onChange={(e) => setChunkPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-white/50"
                    />
                  </div>
                </div>
              )}

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
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo de Archivos:" : "Output File Prefix:"}</label>
                      <input
                        type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Corte"
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "OPCIONES DE SALIDA" : "OUTPUT OPTIONS"}</label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={createZip} onChange={(e) => setCreateZip(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Empaquetar en archivo .ZIP (2+ partes)" : "Package into .ZIP file"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={skipBlankPages} onChange={(e) => setSkipBlankPages(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Omitir páginas en blanco vacías" : "Filter blank empty pages"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={addPageFooterNumbering} onChange={(e) => setAddPageFooterNumbering(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Re-numerar páginas en pie de página" : "Re-number pages in footer"}</span>
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
                onClick={executeSplit} 
                disabled={isProcessing || !file} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (!file ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') : (isEs ? 'Dividir Documento (Corte) →' : 'Split Document (Cut) →'))}
                </span>
              </button>
            </div>

          </div>
        </motion.div>
      )}

      
    </div>
  );
}