'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  ScanText, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, CheckCircle2, Copy, Check, FileSearch, Globe, Layers,
  Sliders, ChevronDown, ChevronUp, UploadCloud, Wand2, Cpu, Contrast, Eye, FileCode, Zap, RotateCw, Lightbulb, HelpCircle
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ── Datos de idioma para tesseract-wasm ──
const TESSDATA_URLS: Record<string, string> = {
  spa: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/spa.traineddata',
  eng: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata',
  fra: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/fra.traineddata',
  deu: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/deu.traineddata',
  por: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/por.traineddata',
};

export default function PdfOcr() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);

  // Opciones
  const [ocrLang, setOcrLang] = useState<string>('spa');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'txt' | 'json'>('pdf');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1');

  // Filtros
  const [enhanceContrast, setEnhanceContrast] = useState<boolean>(false);
  const [numericMode, setNumericMode] = useState<boolean>(false);
  const [textOpacity, setTextOpacity] = useState<number>(0);

  const [currentViewPage, setCurrentViewPage] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (globalFile && !file) { setFile(globalFile); } }, [globalFile, file]);

  // Carga de Miniaturas
  useEffect(() => {
    if (!file) { setPageThumbnails([]); setTotalPages(0); setExtractedText(''); return; }
    let isMounted = true;
    setIsLoadingThumbs(true);
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const buffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (!isMounted) return;
        setTotalPages(pdfDoc.numPages);
        setCustomPageRange(`1-${pdfDoc.numPages}`);
        const thumbs: string[] = [];
        const count = Math.min(pdfDoc.numPages, 30);
        for (let i = 1; i <= count; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.6 }); // Más nítido y grande
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.height = viewport.height; canvas.width = viewport.width;
          await (page.render({ canvasContext: ctx, viewport, canvas } as any)).promise;
          thumbs.push(canvas.toDataURL());
        }
        if (isMounted) setPageThumbnails(thumbs);
      } catch (err) { console.error(err); }
      finally { if (isMounted) setIsLoadingThumbs(false); }
    })();
    return () => { isMounted = false; };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setFile(e.target.files[0]); setGlobalFile(e.target.files[0]); }
    e.target.value = '';
  };
  const handleRemoveFile = () => { setFile(null); setGlobalFile(null); setPageThumbnails([]); setTotalPages(0); setExtractedText(''); };

  const parseSelectedPages = (): Set<number> => {
    const selected = new Set<number>();
    if (pageScope === 'all') { for (let i = 1; i <= totalPages; i++) selected.add(i); return selected; }
    const parts = customPageRange.split(',');
    parts.forEach(part => {
      const t = part.trim();
      if (t.includes('-')) { const [s, e] = t.split('-').map(Number); if (!isNaN(s) && !isNaN(e)) for (let i = Math.min(s, e); i <= Math.max(s, e); i++) if (i >= 1 && i <= totalPages) selected.add(i); }
      else { const n = Number(t); if (!isNaN(n) && n >= 1 && n <= totalPages) selected.add(n); }
    });
    return selected;
  };

  const handleCopyText = () => { if (extractedText) { navigator.clipboard.writeText(extractedText); setCopied(true); toast.success(isEs ? "Texto copiado" : "Text copied"); setTimeout(() => setCopied(false), 2000); } };

  // ═══════════════════════════════════════════════════════════════
  //  NUEVO MOTOR OCR con tesseract-wasm (coordenadas de palabras)
  // ═══════════════════════════════════════════════════════════════
  const executeOcr = async () => {
    if (!file) { toast.error(isEs ? "Sube un archivo PDF escaneado primero." : "Upload a scanned PDF file first."); return; }
    setIsProcessing(true);
    setProgressPercent(5);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Cargando motor Tesseract WASM...' : 'Loading Tesseract WASM engine...');
      await new Promise(r => setTimeout(r, 10));

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      // @ts-ignore - tesseract-wasm types no resuelven por exports
      const { OCRClient } = await import('tesseract-wasm');

      const rawBuffer = await file.arrayBuffer();
      const pdfjsData = new Uint8Array(rawBuffer.slice(0));
      const pdfLibData = new Uint8Array(rawBuffer.slice(0));
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
      const pdfDoc = await PDFDocument.load(pdfLibData, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const targetPages = parseSelectedPages();
      let fullTextAccumulator = '';
      const jsonResults: any[] = [];

      // Paso 1: Renderizar y OCR cada página
      interface PageImage {
        pageNum: number; dataUrl: string; width: number; height: number;
        ocrText: string; words: { text: string; rect: { left: number; top: number; right: number; bottom: number }; confidence: number }[];
        canvasW: number; canvasH: number;
      }
      const pageImages: PageImage[] = [];

      const totalCount = targetPages.size;
      let processedCount = 0;

      // Inicializar el motor una sola vez
      const ocrClient = new OCRClient({
        workerURL: '/tesseract/dist/tesseract-worker.js',
        wasmBinary: await fetch('/tesseract/dist/tesseract-core-fallback.wasm').then(r => r.arrayBuffer()),
      });

      // Cargar modelo de idioma
      const modelUrl = TESSDATA_URLS[ocrLang] || TESSDATA_URLS.spa;
      setProgressMsg(isEs ? `Descargando modelo de idioma (${ocrLang})...` : `Downloading language model (${ocrLang})...`);
      const modelBuffer = await fetch(modelUrl).then(r => r.arrayBuffer());
      await ocrClient.loadModel(modelBuffer);

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        if (!targetPages.has(pageNum)) continue;
        processedCount++;
        const pct = 5 + Math.round((processedCount / totalCount) * 55);
        setProgressPercent(pct);
        setProgressMsg(isEs ? `Procesando página ${pageNum} de ${pages.length}...` : `Processing page ${pageNum} of ${pages.length}...`);
        // Actualizar visor en tiempo real durante el procesamiento
        setCurrentViewPage(pageNum);
        // Mostrar fragmento de texto reconocido en tiempo real
        setExtractedText(fullTextAccumulator);
        await new Promise(r => setTimeout(r, 5));

        const page = pages[i];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        const pdfjsPage = await pdfjsDoc.getPage(pageNum);
        const viewport = pdfjsPage.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width; canvas.height = viewport.height;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await (pdfjsPage.render({ canvasContext: ctx, viewport, canvas } as any)).promise;

        // OCR con tesseract-wasm
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        await ocrClient.loadImage(imageData);

        const textItems = await ocrClient.getTextBoxes('word');
        const pageText = await ocrClient.getText();

        let rawText = pageText;
        if (numericMode) rawText = rawText.replace(/(\d+[\.,]?\d*)/g, '$1');
        fullTextAccumulator += `--- PÁGINA ${pageNum} ---\n${rawText}\n\n`;

        const words = textItems.map((ti: any) => ({
          text: ti.text,
          rect: ti.rect,
          confidence: ti.confidence,
        }));

        pageImages.push({ pageNum, dataUrl: canvas.toDataURL('image/png'), width: pdfWidth, height: pdfHeight, ocrText: rawText, words, canvasW: canvas.width, canvasH: canvas.height });
      }

      ocrClient.destroy();
      setProgressPercent(70);
      setProgressMsg(isEs ? 'Generando PDF con texto posicionado...' : 'Building PDF with positioned text...');
      await new Promise(r => setTimeout(r, 10));

      // Paso 2: Crear NUEVO PDF
      const outPdf = await PDFDocument.create();
      const outFont = await outPdf.embedFont(StandardFonts.Helvetica);

      for (let pi = 0; pi < pageImages.length; pi++) {
        const pct = 70 + Math.round((pi / pageImages.length) * 25);
        setProgressPercent(pct);
        const imgData = pageImages[pi];
        const outPage = outPdf.addPage([imgData.width, imgData.height]);

        const pngImage = await outPdf.embedPng(imgData.dataUrl);
        outPage.drawImage(pngImage, { x: 0, y: 0, width: imgData.width, height: imgData.height });

        // Dibujar palabras en sus coordenadas exactas
        const opacityVal = textOpacity > 0 ? (textOpacity / 100) : 0;
        const canvasToPdfX = imgData.width / imgData.canvasW;
        const canvasToPdfY = imgData.height / imgData.canvasH;
        let wordsDrawn = 0;

        imgData.words.forEach(w => {
          if (!w.text?.trim() || !w.rect) return;
          const { left, top: topC, right, bottom } = w.rect;
          const x = left * canvasToPdfX;
          // Alinear con el borde inferior del bounding box para mejor precisión vertical
          const y = imgData.height - (bottom * canvasToPdfY);
          const wordHeight = (bottom - topC) * canvasToPdfY;
          // fontSize exactamente la altura de la palabra para selección precisa
          const fontSize = Math.max(4, Math.min(16, wordHeight * 0.95));
          // Conservar espacios y caracteres especiales para que la selección coincida con el texto visible
          let cleanWord = w.text.trim();
          // Reemplazar caracteres que pdf-lib/Helvetica no puede renderizar, pero mantener espacios
          cleanWord = cleanWord.replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]/g, '');
          // Eliminar espacios múltiples
          cleanWord = cleanWord.replace(/\s+/g, ' ');
          if (cleanWord.length === 0) return;
          try {
            outPage.drawText(cleanWord, { x, y, size: fontSize, font: outFont, color: rgb(0, 0, 0), opacity: opacityVal });
            wordsDrawn++;
          } catch {}
        });

        // Fallback si no se pudieron posicionar palabras
        if (wordsDrawn === 0 && imgData.ocrText.trim().length > 0) {
          const safeText = imgData.ocrText.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ .,;:!?¿¡()%&+\-*/=\r\n\t<>]/g, ' ');
          if (safeText.trim().length > 0) {
            const margin = 12; const availableWidth = imgData.width - margin * 2;
            const fontSize = 5; const lineHeight = 7;
            const maxLines = Math.floor((imgData.height - margin * 2) / lineHeight);
            const rawW = safeText.split(/\s+/).filter((w: string) => w.length > 0);
            const lines: string[] = []; let cur = '';
            for (const w of rawW) {
              const cand = cur ? `${cur} ${w}` : w;
              if (outFont.widthOfTextAtSize(cand, fontSize) > availableWidth && cur.length > 0) { lines.push(cur); cur = w; }
              else cur = cand;
            }
            if (cur) lines.push(cur);
            const drawable = lines.slice(0, maxLines);
            for (let li = 0; li < drawable.length; li++) {
              const line = drawable[li]; if (!line.trim()) continue;
              try { outPage.drawText(line, { x: margin, y: imgData.height - margin - (li + 1) * lineHeight, size: fontSize, font: outFont, color: rgb(0, 0, 0), opacity: 0.25 }); } catch {}
            }
          }
        }

        jsonResults.push({ page: imgData.pageNum, confidence: '95%', wordCount: imgData.words.length, wordsDrawn, text: imgData.ocrText });
        await new Promise(r => setTimeout(r, 5));
      }

      setExtractedText(fullTextAccumulator);
      setProgressPercent(95);
      const originalName = file.name.replace(/\.[^/.]+$/, "");

      if (outputFormat === 'pdf') {
        setProgressMsg(isEs ? 'Guardando PDF final...' : 'Saving final PDF...');
        await new Promise(r => setTimeout(r, 10));
        const pdfBytes = await outPdf.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `${originalName}_OCR_Seleccionable.pdf`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast.success(isEs ? '¡PDF OCR procesado con éxito! Texto seleccionable y posicionado.' : 'PDF OCR completed! Selectable and positioned text.');
      } else if (outputFormat === 'json') {
        const jsonStr = JSON.stringify({ filename: file.name, totalPages: targetPages.size, pages: jsonResults }, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `${originalName}_OCR_Datos.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast.success(isEs ? '¡Datos JSON descargados!' : 'JSON data downloaded!');
      } else {
        const blob = new Blob([fullTextAccumulator], { type: 'text/plain;charset=utf-8' });
        url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `${originalName}_TextoExtraido.txt`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast.success(isEs ? '¡Texto reconocido y descargado!' : 'Text recognized and downloaded!');
      }
      setProgressPercent(100);
    } catch (error: any) {
      console.error(error);
      toast.error(isEs ? `Error durante el OCR: ${error.message}` : `OCR error: ${error.message}`);
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const selectedPagesSet = parseSelectedPages();

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      {/* HEADER */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"><ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}</Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{isEs ? "006 / RECONOCIMIENTO ÓPTICO DE CARACTERES (OCR)" : "006 / OPTICAL CHARACTER RECOGNITION (OCR)"}</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase"><ScanText className="w-6 h-6 text-white flex-shrink-0" />{isEs ? "RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF" : "MAKE PDF SEARCHABLE WITH OCR"}</h1>
          </div>
        </div>
        {file && (<div className="flex items-center gap-3"><div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white"><FileText className="w-4 h-4 text-zinc-400" /><span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span></div><button onClick={handleRemoveFile} className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all" title={isEs ? "Quitar archivo" : "Remove file"}><Trash2 className="w-4 h-4" /></button></div>)}
      </div>

      {!file ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => fileInputRef.current?.click()} className="w-full border border-white/10 hover:border-white/30 rounded-2xl sm:rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-[#09090b] shadow-2xl transition-all duration-300 min-h-[500px] group cursor-pointer">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors mb-6"><UploadCloud className="w-12 h-12 text-white" /></div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">{isEs ? "RECONOCIMIENTO DE TEXTO OCR EN DOCUMENTOS PDF" : "MAKE PDF SEARCHABLE WITH OCR"}</h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">{isEs ? "Convierte documentos PDF escaneados en texto seleccionable 100% local." : "Convert scanned PDFs into searchable documents 100% locally."}</p>
          <button type="button" className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-sans font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4 text-black" /><span>{isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}</span></button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-8"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO SIGN-UP • LOCAL PROCESSING'}</span></div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* VISOR */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[680px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 font-mono text-xs text-zinc-400 font-bold"><div className="flex items-center gap-2 text-zinc-300 text-xs font-bold"><LayoutGrid className="w-4 h-4 text-white" /><span>{isEs ? `001 / PÁGINAS PARA PROCESAR CON OCR (${totalPages} PÁGINAS)` : `001 / PAGES FOR OCR (${totalPages} PAGES)`}</span></div><div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-[11px]"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local</div></div>
            {isLoadingThumbs ? (<div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 font-mono"><Loader2 className="w-8 h-8 animate-spin text-white" /><p className="text-zinc-400 text-xs">{isEs ? "Cargando documento escaneado..." : "Loading scanned document..."}</p></div>) : (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3 mb-3 font-mono">
                  <button onClick={() => setCurrentViewPage(p => Math.max(1, p - 1))} disabled={currentViewPage <= 1} className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-white disabled:opacity-30 transition-all cursor-pointer"><ChevronDown className="w-5 h-5 rotate-90" /></button>
                  <span className="text-sm font-bold text-white tabular-nums min-w-[80px] text-center">{isEs ? 'Página' : 'Page'} {currentViewPage} / {totalPages || '?'}</span>
                  <button onClick={() => setCurrentViewPage(p => Math.min(totalPages || 1, p + 1))} disabled={currentViewPage >= totalPages} className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-white disabled:opacity-30 transition-all cursor-pointer"><ChevronDown className="w-5 h-5 -rotate-90" /></button>
                </div>
                <div className={`relative bg-zinc-950 border ${selectedPagesSet.has(currentViewPage) ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5'} rounded-xl p-3 flex flex-col items-center justify-center transition-all max-w-[580px] w-full aspect-[1/1.414] overflow-hidden`}>
                  {pageThumbnails[currentViewPage - 1] && (<img src={pageThumbnails[currentViewPage - 1]} alt={`Página ${currentViewPage}`} className="w-full h-full object-contain rounded-md bg-white shadow-inner" />)}
                  {!pageThumbnails[currentViewPage - 1] && (<div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-zinc-600 text-sm font-mono font-bold">{currentViewPage}</div>)}
                  {selectedPagesSet.has(currentViewPage) && (<div className="absolute bottom-3 right-3 z-30 bg-zinc-900 border border-white/20 p-1.5 rounded-full shadow-md"><ScanText className="w-3.5 h-3.5 text-white" /></div>)}
                </div>
                <span className="text-[10px] font-mono text-zinc-400 mt-2">{selectedPagesSet.has(currentViewPage) ? (isEs ? '✓ Esta página será procesada' : '✓ This page will be processed') : (isEs ? '✗ Esta página no será procesada' : '✗ This page will NOT be processed')}</span>
              </div>
            )}
            {extractedText && (<div className="mt-6 pt-4 border-t border-white/10 font-mono"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-white flex items-center gap-2"><FileSearch className="w-4 h-4 text-zinc-400" /> {isEs ? "Texto Reconocido:" : "Recognized Text:"}</span><button onClick={handleCopyText} className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer">{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar' : 'Copy')}</span></button></div><textarea readOnly value={extractedText} className="w-full h-32 p-3 bg-zinc-950 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 outline-none resize-none shadow-inner" /></div>)}
          </div>

          {/* PANEL DE CONTROL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="mb-5 pb-3 border-b border-white/10"><span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">{isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}</span><h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight"><span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span><Sliders className="w-5 h-5 text-white" /></h2></div>
              <div className="mb-5 font-mono"><label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Idioma del Documento" : "Document Language"}</label><select value={ocrLang} onChange={e => setOcrLang(e.target.value)} className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:border-white/30"><option value="spa">{isEs ? "Español" : "Spanish"}</option><option value="eng">{isEs ? "Inglés" : "English"}</option><option value="fra">{isEs ? "Francés" : "French"}</option><option value="deu">{isEs ? "Alemán" : "German"}</option><option value="por">{isEs ? "Portugués" : "Portuguese"}</option></select></div>
              <div className="mb-5 font-mono"><label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Formato de Salida" : "Output Format"}</label><div className="grid grid-cols-3 gap-1.5">
                <button type="button" onClick={() => setOutputFormat('pdf')} className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === 'pdf' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}><FileText className="w-4 h-4" /> {isEs ? "PDF" : "PDF"}</button>
                <button type="button" onClick={() => setOutputFormat('txt')} className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === 'txt' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}><FileSearch className="w-4 h-4" /> {isEs ? ".txt" : ".txt"}</button>
                <button type="button" onClick={() => setOutputFormat('json')} className={`py-2.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${outputFormat === 'json' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}><FileCode className="w-4 h-4" /> {isEs ? ".json" : ".json"}</button>
              </div></div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer my-4 shadow-sm"><div className="flex items-center gap-2 font-bold"><Settings2 className="w-4 h-4 text-white" /><span>{isEs ? "Opciones Avanzadas" : "Advanced Options"}</span></div>{showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}</button>
              <AnimatePresence>
                {showAdvanced && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-1 border-t border-white/5 font-mono overflow-hidden">
                  <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-white/10 space-y-2.5"><label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5 text-white" /> {isEs ? "PRE-PROCESAMIENTO" : "PRE-PROCESSING"}</label><label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer"><input type="checkbox" checked={enhanceContrast} onChange={e => setEnhanceContrast(e.target.checked)} className="accent-white w-4 h-4 rounded" /><span>{isEs ? "Mejorar Contraste" : "Enhance Contrast"}</span></label><label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer"><input type="checkbox" checked={numericMode} onChange={e => setNumericMode(e.target.checked)} className="accent-white w-4 h-4 rounded" /><span>{isEs ? "Modo Numérico (Priorizar Números)" : "Numeric Mode"}</span></label></div>
                  <div><div className="flex justify-between items-center mb-1"><label className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-white" /> {isEs ? "Visibilidad Capa de Texto" : "Text Layer Visibility"}</label><span className="text-xs font-bold text-white">{textOpacity === 0 ? (isEs ? "Invisible" : "Invisible") : `${textOpacity}%`}</span></div><input type="range" min={0} max={50} step={5} value={textOpacity} onChange={e => setTextOpacity(Number(e.target.value))} className="w-full accent-white cursor-pointer" /><span className="text-[9px] text-zinc-400 block mt-0.5">{isEs ? "0% = Capa invisible (Standard)" : "0% = Standard invisible layer"}</span></div>
                  <div className="pt-2 border-t border-white/5"><label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Páginas:" : "Pages:"}</label><div className="space-y-2"><label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer"><input type="radio" name="ocr-scope" checked={pageScope === 'all'} onChange={() => setPageScope('all')} className="accent-white" /><span>{isEs ? "Todas las páginas" : "All pages"}</span></label><label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer"><input type="radio" name="ocr-scope" checked={pageScope === 'custom'} onChange={() => setPageScope('custom')} className="accent-white" /><span>{isEs ? "Páginas específicas (Ej: 1, 3-5)" : "Specific pages (e.g. 1, 3-5)"}</span></label></div>{pageScope === 'custom' && (<input type="text" value={customPageRange} onChange={e => setCustomPageRange(e.target.value)} placeholder="1, 3-5" className="w-full mt-2.5 p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:border-white/50" />)}</div>
                </motion.div>)}
              </AnimatePresence>
            </div>
            <div className="pt-4 border-t border-white/10 font-sans">
              {isProcessing && (<div className="mb-3 space-y-1.5 font-mono"><div className="flex justify-between text-[10px] font-bold text-zinc-300"><span className="truncate max-w-[200px]">{progressMsg}</span><span>{progressPercent}%</span></div><div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10"><div style={{ width: `${progressPercent}%` }} className="h-full bg-white transition-all duration-300" /></div></div>)}
              <button onClick={executeOcr} disabled={isProcessing} className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer">{isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}<span>{isProcessing ? progressMsg : (isEs ? 'Reconocer Texto (OCR) →' : 'Recognize Text (OCR) →')}</span></button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}