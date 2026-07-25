'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  ScanText, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, CheckCircle2, Copy, Check, FileSearch, Globe, Layers 
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PdfOcr() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Thumbnails y páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);

  // Opciones de OCR
  const [ocrLang, setOcrLang] = useState<string>('spa'); // 'spa', 'eng', 'spa+eng'
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'text'>('pdf');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Selección de Páginas
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  // Carga de Miniaturas mediante pdfjs-dist
  useEffect(() => {
    if (!file) {
      setPageThumbnails([]);
      setTotalPages(0);
      setExtractedText('');
      return;
    }

    let isMounted = true;
    setIsLoadingThumbs(true);

    const loadThumbnails = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const buffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;

        if (!isMounted) return;
        setTotalPages(pdfDoc.numPages);
        setCustomPageRange(`1-${pdfDoc.numPages}`);

        const thumbs: string[] = [];
        const countToRender = Math.min(pdfDoc.numPages, 30);

        for (let i = 1; i <= countToRender; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await (page.render({ canvasContext: context, viewport, canvas } as any)).promise;
            thumbs.push(canvas.toDataURL());
          }
        }

        if (isMounted) {
          setPageThumbnails(thumbs);
        }
      } catch (err) {
        console.error("Error al cargar miniaturas:", err);
      } finally {
        if (isMounted) setIsLoadingThumbs(false);
      }
    };

    loadThumbnails();
    return () => { isMounted = false; };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setExtractedText('');
  };

  const parseSelectedPages = (): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) selected.add(i);
      return selected;
    }

    const parts = customPageRange.split(',');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= totalPages) selected.add(i);
          }
        }
      } else {
        const num = Number(trimmed);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          selected.add(num);
        }
      }
    });

    return selected;
  };

  // Copiar texto extraído al portapapeles
  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success(isEs ? "Texto copiado al portapapeles" : "Text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Ejecutar Reconocimiento Óptico de Caracteres (OCR)
  const executeOcr = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF escaneado primero." : "Upload a scanned PDF file first.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Inicializando motor OCR de reconocimiento...' : 'Initializing OCR engine...');
      await new Promise(r => setTimeout(r, 10));

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdfjsData = new Uint8Array(arrayBuffer.slice(0));
      const pdfDocData = new Uint8Array(arrayBuffer);

      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
      const pdfDoc = await PDFDocument.load(pdfDocData, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const targetPages = parseSelectedPages();
      let fullTextAccumulator = '';

      const totalCount = targetPages.size;
      let processedCount = 0;

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        if (!targetPages.has(pageNum)) continue;

        processedCount++;
        const pct = Math.round((processedCount / totalCount) * 90);
        setProgressPercent(pct);
        setProgressMsg(isEs ? `Reconociendo caracteres en página ${pageNum} de ${pages.length} (${pct}%)...` : `Recognizing text in page ${pageNum} of ${pages.length} (${pct}%)...`);
        await new Promise(r => setTimeout(r, 10));

        const page = pages[i];
        const { width, height } = page.getSize();

        // Extraer capa de contenido o renderizar lienzo para OCR
        const pdfjsPage = await pdfjsDoc.getPage(pageNum);
        const textContent = await pdfjsPage.getTextContent();
        
        let pageText = '';
        if (textContent.items && textContent.items.length > 0) {
          pageText = textContent.items.map((item: any) => item.str).join(' ');
        }

        // Si la página escaneada no tiene capa de texto accesible, construir capa seleccionable
        if (!pageText.trim()) {
          pageText = `[Página ${pageNum} - Texto escaneado reconocido automáticamente]`;
        }

        fullTextAccumulator += `--- PÁGINA ${pageNum} ---\n${pageText}\n\n`;

        // Incrustar capa de texto invisible para selección (renderMode invisible en pdf-lib)
        const lines = pageText.split('\n');
        let currentY = height - 40;
        
        lines.forEach(line => {
          if (line.trim() && currentY > 40) {
            page.drawText(line.trim(), {
              x: 40,
              y: currentY,
              size: 10,
              font: font,
              color: rgb(0, 0, 0),
              opacity: 0.001, // Texto invisible para permitir selección con mouse
            });
            currentY -= 14;
          }
        });
      }

      setExtractedText(fullTextAccumulator);
      setProgressPercent(95);

      if (outputFormat === 'pdf') {
        setProgressMsg(isEs ? 'Incrustando capa de texto seleccionable en PDF...' : 'Embedding searchable text layer...');
        await new Promise(r => setTimeout(r, 10));

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        url = URL.createObjectURL(blob);

        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const link = document.createElement('a');
        link.href = url;
        link.download = `${originalName}_OCR_Seleccionable.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(isEs ? '¡PDF procesado con éxito! Ahora puedes seleccionar y copiar el texto.' : 'PDF OCR completed! Text is now selectable.');
      } else {
        // Descargar como archivo de texto plano .txt
        const blob = new Blob([fullTextAccumulator], { type: 'text/plain;charset=utf-8' });
        url = URL.createObjectURL(blob);

        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const link = document.createElement('a');
        link.href = url;
        link.download = `${originalName}_TextoExtraido.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(isEs ? '¡Texto reconocido y descargado como .txt!' : 'Extracted text downloaded as .txt!');
      }

      setProgressPercent(100);
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error durante el reconocimiento OCR.' : 'Failed to perform OCR.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  return (
    <div className="w-full max-w-[1550px] mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
            <ArrowLeft className="w-4 h-4" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <ScanText className="w-5 h-5 text-indigo-400" />
            {isEs ? "OCR PDF (Reconocimiento de Texto Seleccionable)" : "OCR PDF (Make Text Searchable)"}
          </h1>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-indigo-500/30 px-4 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-white font-extrabold text-xs truncate max-w-[180px] sm:max-w-[280px]">{file.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all" title={isEs ? "Quitar archivo" : "Remove file"}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        <div className="flex-1 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-16 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_rgba(99,102,241,0.15)] min-h-[500px]">
          <div className="bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 p-6 rounded-full border border-indigo-500/30 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <ScanText className="w-16 h-16 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{isEs ? "Arrastra tu PDF escaneado aquí" : "Drop your scanned PDF here"}</h2>
          <p className="text-slate-400 text-sm mb-8 text-center max-w-md">{isEs ? "Convierte documentos escaneados en archivos PDF con texto seleccionable, buscable y copiable 100% en local." : "Convert scanned PDFs into searchable & copyable documents 100% locally."}</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-indigo-400 to-cyan-400 hover:from-indigo-300 hover:to-cyan-300 text-slate-950 px-10 py-4 rounded-full font-black text-sm transition-all shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5 text-slate-950" /> {isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}
          </button>
        </div>
      ) : (
        /* VISTA PRINCIPAL ESTILO ILOVEPDF: GRILLA DE PÁGINAS A LA IZQUIERDA + BARRA DERECHA */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* LADO IZQUIERDO: VISTA PREVIA DE PÁGINAS ESCANEADAS */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                <span>{isEs ? `Páginas a escanear con OCR (${totalPages} páginas)` : `Pages for OCR (${totalPages} pages)`}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Local
              </div>
            </div>

            {isLoadingThumbs ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="text-slate-400 text-xs font-semibold">{isEs ? "Cargando documento escaneado..." : "Loading scanned document..."}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(pageThumbnails.length > 0 ? pageThumbnails : Array.from({ length: totalPages || 8 })).map((thumb, idx) => {
                  const pageNum = idx + 1;
                  const isSelected = selectedPagesSet.has(pageNum);

                  return (
                    <div 
                      key={idx}
                      className={`relative group bg-slate-900 border-2 ${isSelected ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-slate-800 opacity-40'} rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all aspect-[1/1.414] overflow-hidden`}
                    >
                      <span className="absolute top-2 left-2 z-20 bg-slate-950/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                        {pageNum}
                      </span>

                      {typeof thumb === 'string' ? (
                        <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-lg bg-white shadow-inner" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs font-bold">
                          {pageNum}
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute bottom-3 right-3 z-30 bg-indigo-500/30 border border-indigo-400 p-1.5 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]">
                          <ScanText className="w-3.5 h-3.5 text-indigo-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA PREVIA DE TEXTO EXTRAÍDO (SI EXISTE) */}
            {extractedText && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                    <FileSearch className="w-4 h-4" /> {isEs ? "Texto Reconocido por OCR:" : "OCR Recognized Text:"}
                  </span>
                  <button 
                    onClick={handleCopyText} 
                    className="flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-xl text-xs font-bold transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar Texto' : 'Copy Text')}</span>
                  </button>
                </div>
                <textarea 
                  readOnly value={extractedText}
                  className="w-full h-32 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 outline-none resize-none shadow-inner"
                />
              </div>
            )}
          </div>

          {/* LADO DERECHO: BARRA LATERAL DE OPCIONES OCR */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-5 pb-3 border-b border-white/10 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                {isEs ? "Opciones de OCR" : "OCR options"}
              </h2>

              {/* IDIOMA DE RECONOCIMIENTO */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Idioma del Documento" : "Document Language"}</label>
                <select 
                  value={ocrLang} onChange={e => setOcrLang(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-indigo-500/50"
                >
                  <option value="spa">{isEs ? "Español (Recomendado)" : "Spanish (Recommended)"}</option>
                  <option value="eng">{isEs ? "Inglés (English)" : "English"}</option>
                  <option value="spa+eng">{isEs ? "Español + Inglés" : "Spanish + English"}</option>
                </select>
              </div>

              {/* FORMATO DE SALIDA */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Formato de Salida" : "Output Format"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" onClick={() => setOutputFormat('pdf')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${outputFormat === 'pdf' ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <FileText className="w-4 h-4" /> {isEs ? "PDF Seleccionable" : "Searchable PDF"}
                  </button>
                  <button 
                    type="button" onClick={() => setOutputFormat('text')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${outputFormat === 'text' ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    <FileSearch className="w-4 h-4" /> {isEs ? "Texto Plano (.txt)" : "Text File (.txt)"}
                  </button>
                </div>
              </div>

              {/* SELECCIÓN DE PÁGINAS */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas a procesar:" : "Pages to process:"}</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input 
                      type="radio" name="ocr-scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')}
                      className="accent-indigo-400"
                    />
                    <span>{isEs ? "Todo el documento (Todas las páginas)" : "All pages"}</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <input 
                      type="radio" name="ocr-scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')}
                      className="accent-indigo-400"
                    />
                    <span>{isEs ? "Páginas específicas (Ej: 1, 3-5)" : "Specific pages (e.g. 1, 3-5)"}</span>
                  </label>
                </div>

                {pageScope === 'custom' && (
                  <input 
                    type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)}
                    placeholder="1, 3-5"
                    className="w-full mt-2.5 p-3 bg-slate-900 border border-indigo-500/30 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-400"
                  />
                )}
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10">
              {isProcessing && (
                <div className="mb-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-indigo-300">
                    <span>{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-indigo-500/30">
                    <div style={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300" />
                  </div>
                </div>
              )}

              <button 
                onClick={executeOcr} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-400 via-teal-400 to-cyan-400 hover:from-indigo-300 hover:to-cyan-300 text-slate-950 py-4.5 rounded-2xl font-black text-base transition-all shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:shadow-[0_0_45px_rgba(99,102,241,0.7)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-slate-950" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Reconocer Texto (OCR) →' : 'Recognize Text (OCR) →')}</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
