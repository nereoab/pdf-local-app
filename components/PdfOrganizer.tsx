'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import { 
  LayoutGrid, FileText, X, Loader2, FilePlus, Sliders, ChevronDown, ChevronUp, 
  FileDown, UploadCloud, Layers, Sparkles, CheckSquare, 
  Square, ZoomIn, RotateCw, Copy, Trash2, ArrowLeftRight, Plus, 
  RotateCcw, Compass, ListOrdered, ShieldCheck, ArrowLeft, Zap, Cpu, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type PageItem = {
  id: string;
  fileIndex: number;
  originalPageNum: number;
  rotation: number;
  isBlank: boolean;
  thumbnailUrl: string | null;
};

export default function PdfOrganizer() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const { globalFiles, globalFile, setGlobalFiles } = useFileStore();

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // RESULTADOS
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // ESTADO DE ARRASTRE Y SELECCIÓN
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [previewZoomPage, setPreviewZoomPage] = useState<PageItem | null>(null);

  // OPCIONES AVANZADAS PDFBLACK
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Reordenado');
  const [renumberPages, setRenumberPages] = useState<boolean>(true);
  const [insertBlankPosition, setInsertBlankPosition] = useState<number>(1);
  const [moveFromPage, setMoveFromPage] = useState<number>(1);
  const [moveToPos, setMoveToPos] = useState<number>(1);

  // PROCESAR ARCHIVOS PDF Y CREADOR DE MINIATURAS
  const procesarArchivosPDF = useCallback(async (selectedFiles: File[]) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando mesa de montaje...' : 'Starting workspace...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const newFilesList = [...files, ...selectedFiles];
      const newPages: PageItem[] = [...pages];

      for (let i = 0; i < selectedFiles.length; i++) {
        const currentFile = selectedFiles[i];
        const fileIndex = files.length + i;

        const arrayBuffer = await currentFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        for (let p = 1; p <= pageCount; p++) {
          setProgressMsg(isEs ? `Renderizando ${currentFile.name} (pág ${p}/${pageCount})...` : `Rendering ${currentFile.name} (pág ${p}/${pageCount})...`);
          setProgressPercent(10 + Math.floor((p / pageCount) * 80));
          if (p % 3 === 0) await new Promise(r => setTimeout(r, 5));

          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport } as unknown as Parameters<typeof page.render>[0]).promise;

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
      if (selectedFiles[0]) {
        setFilePrefix(selectedFiles[0].name.replace(/\.[^/.]+$/, "") + '_Reordenado');
      }
      setProgressPercent(100);
      toast.success(isEs ? 'Páginas cargadas en la mesa de montaje' : 'Pages loaded into workspace');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al procesar el archivo PDF' : 'Error processing PDF');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  }, [files, pages, isEs, setGlobalFiles]);

  useEffect(() => {
    const existing = globalFiles && globalFiles.length > 0 ? globalFiles : (globalFile ? [globalFile] : []);
    if (existing.length > 0 && files.length === 0) {
      let isMounted = true;
      (async () => {
        if (isMounted) {
          await procesarArchivosPDF(existing);
        }
      })();
      return () => { isMounted = false; };
    }
  }, [globalFiles, globalFile, files.length, procesarArchivosPDF]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (selected.length > 0) {
        setDownloadUrl(null);
        await procesarArchivosPDF(selected);
      }
    }
    e.target.value = '';
  };

  const removeFile = useCallback(() => {
    setFiles([]);
    setPages([]);
    setDownloadUrl(null);
  }, []);

  // ACCIONES INDIVIDUALES SOBRE TARJETAS
  const handleRotatePage = (index: number) => {
    setPages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rotation: (updated[index].rotation + 90) % 360 };
      return updated;
    });
    setDownloadUrl(null);
  };

  const handleDuplicatePage = (index: number) => {
    setPages(prev => {
      const updated = [...prev];
      const target = updated[index];
      const clone: PageItem = {
        ...target,
        id: `${target.id}-copy-${Math.random()}`
      };
      updated.splice(index + 1, 0, clone);
      return updated;
    });
    setDownloadUrl(null);
    toast.success(isEs ? 'Página duplicada' : 'Page duplicated');
  };

  const handleDeletePage = (index: number) => {
    if (pages.length === 1) {
      toast.error(isEs ? 'No puedes eliminar la única página del PDF' : 'Cannot delete the only page');
      return;
    }
    setPages(prev => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
  };

  // PATRONES DE REORDENAMIENTO EN 1-CLIC (PANEL DE CONTROL)
  const handleInvertOrder = () => {
    setPages(prev => [...prev].reverse());
    setDownloadUrl(null);
    toast.success(isEs ? 'Secuencia de páginas invertida' : 'Page sequence reversed');
  };

  const handleGroupEvensOdds = (oddsFirst = true) => {
    setPages(prev => {
      const odds = prev.filter((_, i) => (i + 1) % 2 !== 0);
      const evens = prev.filter((_, i) => (i + 1) % 2 === 0);
      return oddsFirst ? [...odds, ...evens] : [...evens, ...odds];
    });
    setDownloadUrl(null);
    toast.success(isEs ? 'Páginas agrupadas por paridad' : 'Pages grouped by parity');
  };

  const handleRotateAll = (degreesToAdd: number) => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + degreesToAdd) % 360 })));
    setDownloadUrl(null);
    toast.success(isEs ? `Todas las páginas rotadas ${degreesToAdd}°` : `All pages rotated ${degreesToAdd}°`);
  };

  const handleResetRotations = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: 0 })));
    setDownloadUrl(null);
  };

  const handleInsertBlankPage = () => {
    const pos = Math.max(1, Math.min(pages.length + 1, insertBlankPosition));
    const blankItem: PageItem = {
      id: `blank-${Date.now()}-${Math.random()}`,
      fileIndex: -1,
      originalPageNum: 0,
      rotation: 0,
      isBlank: true,
      thumbnailUrl: null
    };

    setPages(prev => {
      const updated = [...prev];
      updated.splice(pos - 1, 0, blankItem);
      return updated;
    });
    setDownloadUrl(null);
    toast.success(isEs ? `Hoja en blanco insertada en la posición #${pos}` : `Blank page inserted at position #${pos}`);
  };

  const handleMovePageCommand = () => {
    const fromIdx = moveFromPage - 1;
    const toIdx = moveToPos - 1;

    if (fromIdx < 0 || fromIdx >= pages.length || toIdx < 0 || toIdx >= pages.length) {
      toast.error(isEs ? 'Posiciones de mover no válidas' : 'Invalid move positions');
      return;
    }

    setPages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
    setDownloadUrl(null);
    toast.success(isEs ? `Página #${moveFromPage} movida a la posición #${moveToPos}` : `Page #${moveFromPage} moved to #${moveToPos}`);
  };

  // MANEJO DE DRAG & DROP MANUAL EN LA MESA DE MONTAJE
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setPages(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, dragged);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDownloadUrl(null);
  };

  // EXECUTAR Y ENSAMBLAR PDF REORDENADO
  const executeReorder = async () => {
    if (pages.length === 0 || files.length === 0) {
      toast.error(isEs ? 'Carga al menos un archivo PDF' : 'Upload at least one PDF file');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Reconstruyendo árbol de páginas...' : 'Rebuilding page tree...');

    try {
      const fileDocs: PDFDocument[] = [];
      for (const f of files) {
        const buffer = await f.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        fileDocs.push(doc);
      }

      const mergedPdf = await PDFDocument.create();
      const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pages.length; i++) {
        setProgressMsg(isEs ? `Ensamblando página ${i + 1} de ${pages.length}...` : `Assembling page ${i + 1} of ${pages.length}...`);
        setProgressPercent(10 + Math.floor(((i + 1) / pages.length) * 80));

        const item = pages[i];

        if (item.isBlank) {
          mergedPdf.addPage([595.28, 841.89]);
        } else {
          const sourceDoc = fileDocs[item.fileIndex];
          const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [item.originalPageNum - 1]);

          if (item.rotation !== 0) {
            const currentRot = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
          }

          if (renumberPages) {
            const { width } = copiedPage.getSize();
            copiedPage.drawText(`Página ${i + 1} de ${pages.length}`, {
              x: width / 2 - 30,
              y: 15,
              size: 9,
              font: helveticaFont,
              color: rgb(0.5, 0.5, 0.5),
            });
          }

          mergedPdf.addPage(copiedPage);
        }
      }

      setProgressMsg(isEs ? 'Compilando documento final...' : 'Compiling final document...');
      setProgressPercent(95);

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix}.pdf`;

      setDownloadFilename(outName);
      setDownloadUrl(localUrl);
      triggerDownload(localUrl, outName);
      setProgressPercent(100);
      toast.success(isEs ? '¡Documento PDF reordenado con éxito!' : 'PDF document reordered successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al guardar el documento reordenado' : 'Error saving reordered document');
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
      <input type="file" accept=".pdf" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />
      <input type="file" accept=".pdf" multiple className="hidden" ref={addMoreInputRef} onChange={handleFileChange} disabled={isProcessing} />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/organizar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "002 / REORDENAMIENTO Y MONTAJE DE DOCUMENTOS PDF" : "002 / PDF REORDERING & ASSEMBLY"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <LayoutGrid className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "ORDENAR Y REORGANIZAR PÁGINAS PDF" : "REORDER PDF PAGES"}
            </h1>
          </div>
        </div>

        {pages.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {files.length} {isEs ? 'archivo(s)' : 'file(s)'} ({pages.length} {isEs ? 'páginas' : 'pages'})
              </span>
            </div>
            <button 
              onClick={removeFile} 
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? "Limpiar mesa" : "Clear deck"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {pages.length === 0 ? (
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
            {isEs ? "ORDENAR Y REORGANIZAR PÁGINAS PDF" : "REORDER PDF PAGES"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Cambia el orden, rota, duplica e intercala hojas de tu PDF de forma 100% confidencial y local." : "Reorder, rotate, duplicate, and interleave pages from your PDF 100% locally."}
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
        /* VISTA PRINCIPAL CON PANEL DE CONTROL Y MESA DE MONTAJE REORDENABLE */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: MESA DE MONTAJE Y REORDENAMIENTO */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-white" />
                <span>{isEs ? `001 / MESA DE MONTAJE Y REORDENAMIENTO (${pages.length} HOJAS)` : `001 / WORKSPACE & REORDERING (${pages.length} SHEETS)`}</span>
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

            {/* INSTRUCCIÓN DE DRAG & DROP */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-[11px] text-zinc-300 mb-4">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                {isEs ? 'Arrastra cualquier tarjeta para cambiar su posición en vivo' : 'Drag any card to change position in real time'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">{pages.length} {isEs ? 'tarjetas' : 'cards'}</span>
            </div>

            {/* GRID REORDENABLE DRAG & DROP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[560px] overflow-y-auto pr-1">
              {pages.map((p, idx) => (
                <motion.div
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  className={`relative rounded-xl border p-2 flex flex-col items-center justify-between cursor-grab active:cursor-grabbing transition-all duration-200 group overflow-hidden bg-zinc-950 hover:bg-zinc-900 ${
                    dragOverIndex === idx ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* BADGES DE POSICIÓN */}
                  <div className="w-full flex items-center justify-between mb-1.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-white text-black">
                      #{idx + 1}
                    </span>
                    {p.isBlank ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                        {isEs ? 'Blanca' : 'Blank'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">
                        Orig: {p.originalPageNum}
                      </span>
                    )}
                  </div>

                  {/* TARJETA DE CANVAS / MINIATURA */}
                  <div 
                    className="w-full h-36 bg-white rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner"
                    style={{ transform: `rotate(${p.rotation}deg)`, transition: 'transform 0.2s ease' }}
                  >
                    {p.isBlank ? (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-[10px] font-mono">
                        {isEs ? 'PÁGINA EN BLANCO' : 'BLANK PAGE'}
                      </div>
                    ) : p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnailUrl} alt={`Página ${idx + 1}`} className="w-full h-full object-contain" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* BOTONES DE HERRAMIENTAS INDIVIDUALES */}
                  <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-white/10 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button" onClick={(e) => { e.stopPropagation(); handleRotatePage(idx); }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors"
                        title={isEs ? "Rotar 90°" : "Rotate 90°"}
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button" onClick={(e) => { e.stopPropagation(); handleDuplicatePage(idx); }}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors"
                        title={isEs ? "Duplicar" : "Duplicate"}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {!p.isBlank && (
                        <button
                          type="button" onClick={(e) => { e.stopPropagation(); setPreviewZoomPage(p); }}
                          className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors"
                          title={isEs ? "Zoom" : "Zoom"}
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button" onClick={(e) => { e.stopPropagation(); handleDeletePage(idx); }}
                        className="p-1 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-colors"
                        title={isEs ? "Eliminar" : "Delete"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
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

              {/* PATRONES DE ORDEN AUTOMÁTICO EN 1-CLIC */}
              <div className="space-y-3 font-mono text-xs mb-5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Patrones de Orden Automático:" : "Automated Patterns:"}</span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={handleInvertOrder} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Invertir Orden' : 'Reverse Order'}</span>
                  </button>

                  <button
                    type="button" onClick={() => handleGroupEvensOdds(true)} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Impares Primero' : 'Odds First'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={() => handleRotateAll(90)} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Girar Todo 90°' : 'Rotate All 90°'}</span>
                  </button>

                  <button
                    type="button" onClick={handleResetRotations} disabled={pages.length === 0}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Reset Rotación' : 'Reset Rotation'}</span>
                  </button>
                </div>

                {/* CONTROLES DE PRECISIÓN DE POSICIÓN */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2 mt-3">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "MOVER PÁGINA DE PRECISIÓN" : "PRECISION MOVE PAGE"}</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[10px]">{isEs ? "Mover pág" : "Move p."}</span>
                    <input
                      type="number" min={1} max={pages.length || 1} value={moveFromPage}
                      onChange={(e) => setMoveFromPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                    />
                    <span className="text-zinc-400 text-[10px]">{isEs ? "a pos #" : "to pos #"}</span>
                    <input
                      type="number" min={1} max={pages.length || 1} value={moveToPos}
                      onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                    />
                    <button
                      type="button" onClick={handleMovePageCommand} disabled={pages.length === 0}
                      className="px-2.5 py-1 bg-white text-black font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {isEs ? 'Mover' : 'Move'}
                    </button>
                  </div>
                </div>

                {/* INSERTAR HOJA EN BLANCO */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[10px]">{isEs ? "Insertar blanca en pos #" : "Insert blank at pos #"}</span>
                    <input
                      type="number" min={1} max={pages.length + 1 || 1} value={insertBlankPosition}
                      onChange={(e) => setInsertBlankPosition(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 bg-zinc-900 border border-white/20 rounded-lg p-1 text-center text-white font-bold text-xs outline-none focus:border-white/50"
                    />
                  </div>
                  <button
                    type="button" onClick={handleInsertBlankPage} disabled={pages.length === 0}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-white/10 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isEs ? '+ Insertar' : '+ Insert'}
                  </button>
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
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Nomenclatura / Prefijo Resultante:" : "Output File Prefix:"}</label>
                      <input
                        type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                        placeholder="Documento_Reordenado"
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
                onClick={executeReorder} 
                disabled={isProcessing || pages.length === 0} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>
                  {isProcessing 
                    ? progressMsg 
                    : (pages.length === 0 ? (isEs ? 'Selecciona un archivo PDF' : 'Select a PDF file') : (isEs ? 'Guardar Nuevo Orden del PDF →' : 'Save New PDF Order →'))}
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
              {isEs ? `Previsualización - Página Original #${previewZoomPage.originalPageNum}` : `Preview - Original Page #${previewZoomPage.originalPageNum}`}
            </h4>
            <div className="w-full max-h-[70vh] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center shadow-inner">
              {previewZoomPage.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewZoomPage.thumbnailUrl} alt="Preview Zoom" className="max-h-[65vh] object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

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
                {isEs ? '¿Cómo utilizar el Panel de Montaje e Intercalado?' : 'How to use the Workspace & Interleaving Console?'}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {isEs ? 'GUÍA PASO A PASO PARA REORGANIZAR TUS DOCUMENTOS' : 'STEP-BY-STEP GUIDE TO REORDERING YOUR DOCUMENTS'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                1
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Carga y Visualización' : 'Upload & View'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra tu archivo PDF a la mesa de trabajo. Cada página se renderizará automáticamente en una tarjeta visual editable.' 
                  : 'Drop your PDF file into the workspace deck. Each page will render automatically into an editable visual card.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                2
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Reordenamiento Táctil o Automático' : 'Tactile or Automated Reorder'}
              </strong>
              <p>
                {isEs 
                  ? 'Arrastra y suelta las tarjetas para cambiar su orden en vivo, o usa los atajos del panel derecho para invertir la secuencia, agrupar impares/pares o rotar hojas.' 
                  : 'Drag & drop cards to change position live, or use right panel shortcuts to reverse sequence, group odds/evens, or rotate pages.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono font-bold flex items-center justify-center text-xs mb-1">
                3
              </div>
              <strong className="text-white font-bold text-sm block">
                {isEs ? 'Compilación y Descarga' : 'Compilation & Download'}
              </strong>
              <p>
                {isEs 
                  ? 'Haz clic en "Guardar Nuevo Orden del PDF". El sistema compilará el archivo reestructurado manteniendo la calidad original para su descarga.' 
                  : 'Click "Save New PDF Order". The system will compile the restructured file keeping original quality for download.'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: PRIVACIDAD Y PROCESAMIENTO */}
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
                {isEs ? '🔒 PROCESAMIENTO BINARIO 100% LOCAL EN MEMORIA RAM' : '🔒 100% LOCAL RAM BINARY PROCESSING'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans mt-4">
            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Zero Transmisión a Servidores' : 'Zero Server Transmission'}
              </strong>
              <p>
                {isEs 
                  ? 'Tus documentos NUNCA viajan por internet. La manipulación del árbol de páginas (PageTree) se realiza dentro del motor V8 de tu navegador en memoria volátil.' 
                  : 'Your documents NEVER travel over the internet. PageTree manipulation occurs inside your browser V8 engine in volatile RAM.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Fidelidad Vectorial 1:1' : '1:1 Vector Fidelity'}
              </strong>
              <p>
                {isEs 
                  ? 'No es una conversión que degrada la resolución. Las páginas originales son copiadas objeto por objeto manteniendo capas vectoriales, fuentes incrustadas e imágenes sin pérdida.' 
                  : 'No resolution loss conversion. Original pages are copied object by object keeping vector layers, embedded fonts & lossless images.'}
              </p>
            </div>

            <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
              <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Privacidad Corporativa Absoluta' : 'Absolute Corporate Privacy'}
              </strong>
              <p>
                {isEs 
                  ? 'Al cerrar o refrescar la pestaña, la memoria cargada se libera inmediatamente. No queda rastro o copia de tus archivos en ningún disco o caché remoto.' 
                  : 'Closing or refreshing the tab clears loaded memory immediately. No trace or copy of your files remains on any remote disk or cache.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}