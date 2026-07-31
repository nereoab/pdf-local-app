'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  ArrowLeft, EyeOff, FileText, X, Loader2, ShieldCheck, UploadCloud, 
  Hand, Square, Eraser, Search, CreditCard, Phone, Mail, 
  Type, ArrowRight, ZoomIn, ZoomOut, AlertTriangle, Sparkles, Check, SlidersHorizontal,
  ChevronDown, ChevronUp, Shield, FileCheck2
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';

interface RedactionBox {
  id: string;
  page: number;
  word: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

interface ExtractedTextItem {
  page: number;
  str: string;
  vx: number;         // Viewport X baseline start (from left)
  vy: number;         // Viewport Y baseline start (from top)
  itemWidth: number;  // Viewport width of string
  fontHeight: number; // Viewport font height
  viewportWidth: number;
  viewportHeight: number;
}

export default function PdfRedacter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(4);
  const [activePage, setActivePage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [zoomLevel, setZoomLevel] = useState(115);
  const [isSample, setIsSample] = useState(false);

  // Sync file state with globalFile from store
  useEffect(() => {
    if (globalFile && !file) {
      cargarPdf(globalFile);
    }
  }, [globalFile]);

  // Active toolbar tool: 'draw' | 'erase'
  const [activeTool, setActiveTool] = useState<'draw' | 'erase'>('draw');

  // Rectangle drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ xPercent: number; yPercent: number; pageNum: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{ page: number; xPercent: number; yPercent: number; widthPercent: number; heightPercent: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'text' | 'card' | 'phone' | 'email'>('text');

  // Redaction boxes state (manual & automatic)
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [autoRedactions, setAutoRedactions] = useState<RedactionBox[]>([]);
  const [extractedTextItems, setExtractedTextItems] = useState<ExtractedTextItem[]>([]);
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});

  // Advanced options state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [redactionStyle, setRedactionStyle] = useState<'black' | 'gray'>('black');
  const [customSuffix, setCustomSuffix] = useState('_Censurado');

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(isEs ? 'Analizando y renderizando páginas...' : 'Analyzing & rendering pages...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const count = pdfDoc.numPages;
      setTotalPages(count);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setIsSample(false);

      const urls: Record<number, string> = {};
      const extracted: ExtractedTextItem[] = [];

      for (let p = 1; p <= count; p++) {
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 3.2 });
          const textViewport = page.getViewport({ scale: 1.0 });

          // Extract text items with exact PDF.js viewport coordinates
          const textContent = await page.getTextContent();
          for (const item of textContent.items) {
            if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
              const tx = item.transform[4];
              const ty = item.transform[5];
              const rawWidth = item.width > 0 ? item.width : item.str.length * 6;
              const fontHeight = item.height > 0 ? item.height : (Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 11);

              // Convert PDF coordinates (bottom-left origin) to Viewport coordinates (top-left origin) using PDF.js engine
              const [vx, vy] = textViewport.convertToViewportPoint(tx, ty);

              extracted.push({
                page: p,
                str: item.str,
                vx,
                vy,
                itemWidth: rawWidth,
                fontHeight,
                viewportWidth: textViewport.width,
                viewportHeight: textViewport.height
              });
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
            urls[p] = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (err) {
          console.warn(`Error rendering page ${p}:`, err);
        }
      }
      setExtractedTextItems(extracted);
      setPageDataUrls(urls);
      toast.success(isEs ? 'Documento cargado exitosamente' : 'Document loaded successfully');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al leer el archivo PDF' : 'Error reading PDF file');
      setFile(null);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Canvas Font-Metric helper to measure exact pixel width of text substrings
  const measureTextWidth = (text: string, fontSize: number): number => {
    if (typeof window === 'undefined') return text.length * fontSize * 0.55;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return text.length * fontSize * 0.55;
    ctx.font = `${fontSize}px sans-serif, Arial, "Times New Roman"`;
    return ctx.measureText(text).width;
  };

  // Regex patterns for preset categories
  const getPresetRegex = (preset: 'card' | 'phone' | 'email'): RegExp => {
    switch (preset) {
      case 'card':
        // Matches common credit/debit card number formats (13-19 digits with optional separators)
        return /\b(?:\d[ -]*?){12,18}\d\b/g;
      case 'phone':
        // Matches international and local phone number formats
        return /(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/g;
      case 'email':
        // Matches email addresses (RFC 5322 simplified)
        return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      default:
        return /(?:)/g;
    }
  };

  // Build all matches for a given regex pattern across extracted text items
  const getRegexMatches = (regex: RegExp, textItems: ExtractedTextItem[]): RedactionBox[] => {
    const matches: RedactionBox[] = [];

    textItems.forEach((item, idx) => {
      const textStr = item.str;
      let match: RegExpExecArray | null;
      // Reset regex state
      regex.lastIndex = 0;

      while ((match = regex.exec(textStr)) !== null) {
        const matchedText = match[0];
        const matchPos = match.index;
        if (matchPos === undefined || matchedText.length === 0) continue;

        const fullTextWidth = measureTextWidth(textStr, item.fontHeight);
        const prefixTextWidth = measureTextWidth(textStr.slice(0, matchPos), item.fontHeight);
        const wordTextWidth = measureTextWidth(matchedText, item.fontHeight);

        const scaleRatio = fullTextWidth > 0 ? item.itemWidth / fullTextWidth : 1;

        const wordVx = item.vx + (prefixTextWidth * scaleRatio);
        const wordWidth = Math.max(wordTextWidth * scaleRatio, 8);
        const wordVyTop = item.vy - (item.fontHeight * 0.82);

        const xPct = (wordVx / item.viewportWidth) * 100;
        const yPct = (wordVyTop / item.viewportHeight) * 100;
        const wPct = (wordWidth / item.viewportWidth) * 100;
        const hPct = Math.max(1.5, ((item.fontHeight * 1.15) / item.viewportHeight) * 100);

        matches.push({
          id: `auto-${item.page}-${idx}-${matchPos}-${matchedText.slice(0, 8)}`,
          page: item.page,
          word: matchedText.length > 20 ? matchedText.slice(0, 18) + '…' : matchedText,
          xPercent: Math.max(0, Math.min(98, xPct)),
          yPercent: Math.max(0, Math.min(98, yPct)),
          widthPercent: Math.min(100 - xPct, wPct),
          heightPercent: Math.min(100 - yPct, hPct)
        });
      }
    });

    return matches;
  };

  // Calculate exact sub-word matches in text items using Canvas measureText typography scaling
  const getSubWordMatches = (queryStr: string, textItems: ExtractedTextItem[], isExact: boolean): RedactionBox[] => {
    const query = queryStr.trim();
    if (!query) return [];

    const matches: RedactionBox[] = [];
    const queryLower = query.toLowerCase();

    textItems.forEach((item, idx) => {
      const textStr = item.str;
      const textLower = textStr.toLowerCase();

      let startIndex = 0;
      let matchPos = isExact 
        ? textStr.indexOf(query, startIndex) 
        : textLower.indexOf(queryLower, startIndex);

      while (matchPos !== -1) {
        const fullTextWidth = measureTextWidth(textStr, item.fontHeight);
        const prefixTextWidth = measureTextWidth(textStr.slice(0, matchPos), item.fontHeight);
        const wordTextWidth = measureTextWidth(textStr.slice(matchPos, matchPos + query.length), item.fontHeight);

        const scaleRatio = fullTextWidth > 0 ? item.itemWidth / fullTextWidth : 1;

        const wordVx = item.vx + (prefixTextWidth * scaleRatio);
        const wordWidth = Math.max(wordTextWidth * scaleRatio, 8);
        const wordVyTop = item.vy - (item.fontHeight * 0.82);

        const xPct = (wordVx / item.viewportWidth) * 100;
        const yPct = (wordVyTop / item.viewportHeight) * 100;
        const wPct = (wordWidth / item.viewportWidth) * 100;
        const hPct = Math.max(1.5, ((item.fontHeight * 1.15) / item.viewportHeight) * 100);

        matches.push({
          id: `auto-${item.page}-${idx}-${matchPos}-${query}`,
          page: item.page,
          word: textStr.slice(matchPos, matchPos + query.length) || query,
          xPercent: Math.max(0, Math.min(98, xPct)),
          yPercent: Math.max(0, Math.min(98, yPct)),
          widthPercent: Math.min(100 - xPct, wPct),
          heightPercent: Math.min(100 - yPct, hPct)
        });

        startIndex = matchPos + query.length;
        matchPos = isExact 
          ? textStr.indexOf(query, startIndex) 
          : textLower.indexOf(queryLower, startIndex);
      }
    });

    return matches;
  };

  // LIVE AUTOMATIC REDACTION SEARCH EFFECT (FIRES IMMEDIATELY AS USER TYPES)
  useEffect(() => {
    const matches = getSubWordMatches(searchQuery, extractedTextItems, exactMatch);
    setAutoRedactions(matches);
  }, [searchQuery, extractedTextItems, exactMatch, totalPages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        await cargarPdf(selected);
      }
    }
    e.target.value = '';
  };

  const loadSampleDocument = async () => {
    // Create a minimal valid PDF v1.4 with 1 blank page (A4 size) encoded in Latin1
    const samplePdfStr = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n4 0 obj\n<</Length 44>>\nstream\nBT /F1 12 Tf 100 700 Td (Sample 0002) Tj ET\nendstream\nendobj\n5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000360 00000 n \ntrailer\n<</Size 6/Root 1 0 R>>\nstartxref\n423\n%%EOF\n';
    const sampleBlob = new Blob([samplePdfStr], { type: 'application/pdf' });
    const sampleFile = new File([sampleBlob], '0002.pdf', { type: 'application/pdf' });
    await cargarPdf(sampleFile);
  };

  const resetRedacter = () => {
    if (pdfUrl && !isSample) URL.revokeObjectURL(pdfUrl);
    setFile(null);
    setPdfUrl(null);
    setTotalPages(4);
    setGlobalFile(null);
    setRedactions([]);
    setAutoRedactions([]);
    setExtractedTextItems([]);
    setIsSample(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Scroll smooth to page container
  const scrollToPage = (pageNum: number) => {
    setActivePage(pageNum);
    const element = document.getElementById(`page-card-${pageNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // RECTANGLE DRAWING TOOL: mousedown → drag → mouseup
  const getPercentCoords = (pageNum: number, e: React.MouseEvent): { xPercent: number; yPercent: number } | null => {
    // Find the image wrapper inside the page card
    const imgWrapper = (e.currentTarget as HTMLElement).querySelector('[data-img-wrapper]');
    if (!imgWrapper) return null;
    const rect = imgWrapper.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    return { xPercent, yPercent };
  };

  const handleMouseDown = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'draw') return;
    const coords = getPercentCoords(pageNum, e);
    if (!coords) return;
    setIsDrawing(true);
    setDrawStart({ xPercent: coords.xPercent, yPercent: coords.yPercent, pageNum });
    setDrawPreview({
      page: pageNum,
      xPercent: coords.xPercent,
      yPercent: coords.yPercent,
      widthPercent: 0,
      heightPercent: 0
    });
  };

  const handleMouseMove = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || drawStart.pageNum !== pageNum) return;
    const coords = getPercentCoords(pageNum, e);
    if (!coords) return;

    const x1 = drawStart.xPercent;
    const y1 = drawStart.yPercent;
    const x2 = coords.xPercent;
    const y2 = coords.yPercent;

    setDrawPreview({
      page: pageNum,
      xPercent: Math.min(x1, x2),
      yPercent: Math.min(y1, y2),
      widthPercent: Math.abs(x2 - x1),
      heightPercent: Math.abs(y2 - y1)
    });
  };

  const handleMouseUp = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'draw') {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawPreview(null);
      return;
    }

    const coords = getPercentCoords(pageNum, e);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawPreview(null);

    if (!coords) return;

    const x1 = drawStart!.xPercent;
    const y1 = drawStart!.yPercent;
    const x2 = coords.xPercent;
    const y2 = coords.yPercent;

    const widthPct = Math.abs(x2 - x1);
    const heightPct = Math.abs(y2 - y1);

    // Minimum size threshold to avoid accidental tiny boxes
    if (widthPct < 1.5 && heightPct < 0.8) return;

    const newBox: RedactionBox = {
      id: `box-${Date.now()}-${Math.random()}`,
      page: pageNum,
      word: isEs ? 'Censura Manual' : 'Manual Redaction',
      xPercent: Math.max(0, Math.min(x1, x2)),
      yPercent: Math.max(0, Math.min(y1, y2)),
      widthPercent: widthPct,
      heightPercent: heightPct
    };

    setRedactions(prev => [...prev, newBox]);
    toast.success(isEs ? `Parche de censura agregado en Pág. ${pageNum}` : `Redaction patch added on Page ${pageNum}`);
  };

  // ERASE TOOL: click a box to delete it
  const handleEraseClick = (boxId: string) => {
    if (activeTool !== 'erase') return;
    removeRedaction(boxId);
  };

  // Apply current search/preset to find and add redaction boxes
  const handleApplyWordSearch = () => {
    let newRedactions: RedactionBox[] = [];

    if (selectedPreset !== 'text') {
      // Use regex-based detection for preset categories
      const regex = getPresetRegex(selectedPreset);
      newRedactions = getRegexMatches(regex, extractedTextItems);

      if (newRedactions.length === 0) {
        const label = selectedPreset === 'card' ? (isEs ? 'tarjetas de crédito' : 'credit cards')
          : selectedPreset === 'phone' ? (isEs ? 'números de teléfono' : 'phone numbers')
          : (isEs ? 'correos electrónicos' : 'email addresses');
        toast.info(isEs ? `No se encontraron ${label} en el documento.` : `No ${label} found in the document.`);
      } else {
        const label = selectedPreset === 'card' ? (isEs ? 'números de tarjeta' : 'card numbers')
          : selectedPreset === 'phone' ? (isEs ? 'números telefónicos' : 'phone numbers')
          : (isEs ? 'direcciones de correo' : 'email addresses');
        toast.success(isEs ? `¡Se detectaron y cubrieron ${newRedactions.length} ${label}!` : `Detected & covered ${newRedactions.length} ${label}!`);
      }
    } else {
      // Free-text search
      const wordToCensor = searchQuery.trim();
      if (!wordToCensor) {
        toast.error(isEs ? 'Escribe la palabra o patrón que deseas cubrir en el documento' : 'Type the word or pattern you wish to cover in document');
        return;
      }

      newRedactions = getSubWordMatches(wordToCensor, extractedTextItems, exactMatch);

      if (newRedactions.length === 0) {
        toast.info(isEs ? `No se encontraron coincidencias para "${wordToCensor}".` : `No matches found for "${wordToCensor}".`);
      } else {
        toast.success(isEs ? `¡Se encontraron y cubrieron ${newRedactions.length} ocurrencias de "${wordToCensor}"!` : `Found & covered ${newRedactions.length} occurrences of "${wordToCensor}"!`);
      }
    }

    if (newRedactions.length > 0) {
      setRedactions(prev => [...prev, ...newRedactions]);
    }
    setSearchQuery('');
  };

  const removeRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
    setAutoRedactions(prev => prev.filter(r => r.id !== id));
    toast.info(isEs ? 'Marca de censura removida' : 'Redaction mark removed');
  };

  const clearAllRedactions = () => {
    setRedactions([]);
    setAutoRedactions([]);
    toast.info(isEs ? 'Todas las marcas de censura fueron eliminadas' : 'All redactions cleared');
  };

  // PDF-Lib permanent blackout render & download
  const executeRedact = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg(isEs ? 'Incrustando parches de censura permanentes en todas las páginas...' : 'Applying permanent redaction patches on all pages...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      const boxColor = redactionStyle === 'gray' 
        ? rgb(0.25, 0.25, 0.25) 
        : rgb(0, 0, 0);

      const allBoxes = [...redactions, ...autoRedactions];

      allBoxes.forEach(box => {
        const pageIndex = Math.min(box.page - 1, pages.length - 1);
        if (pageIndex >= 0 && pages[pageIndex]) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();

          const rectX = (box.xPercent / 100) * width;
          const rectY = height - ((box.yPercent / 100) * height) - ((box.heightPercent / 100) * height);
          const rectWidth = (box.widthPercent / 100) * width;
          const rectHeight = (box.heightPercent / 100) * height;

          page.drawRectangle({
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            color: boxColor
          });
        }
      });

      const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const suffix = customSuffix || '_Censurado';
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}${suffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(isEs ? '¡Documento censurado exitosamente en todas sus páginas!' : 'Document redacted successfully across all pages!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al procesar la censura en el PDF' : 'An error occurred during PDF redaction');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 font-sans">
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

      {/* CONTENEDOR SUPERIOR DE TÍTULO Y HERRAMIENTA */}
      <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
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
              004 / CENSURA Y REDACCIÓN PERMANENTE DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <EyeOff className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'CENSURAR Y OCULTAR INFORMACIÓN SENSIBLE EN PDF' : 'REDACT AND HIDE SENSITIVE INFORMATION IN PDF'}</span>
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
              onClick={resetRedacter}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* DROPZONE ESTÁNDAR PDFBLACK CUANDO NO HAY ARCHIVO CARGADO */
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-14 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden my-4"
        >
          <div className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>

          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs ? 'Arrastra tu PDF aquí para censurar información sensible' : 'Drop your PDF here to redact sensitive info'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos localmente' : 'Or click to browse your local files'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
              <UploadCloud className="w-4 h-4 text-black" /> {isEs ? 'Subir Archivo PDF' : 'Upload PDF File'}
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% GRATIS • SIN REGISTRO • PROCESAMIENTO LOCAL' : '100% FREE • NO REGISTRATION • LOCAL PROCESSING'}</span>
          </div>
        </div>
      ) : (
        /* WORKSPACE EN 2 COLUMNAS SIMÉTRICAS DE ALTURA FIJA (810PX) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6 font-sans">
          
          {/* LADO IZQUIERDO: VISOR DE PDF (MAS ANCHO - 8 COLUMNAS) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative font-mono h-[92vh] min-h-[860px]">
              
              {/* BARRA SUPERIOR DE ARCHIVO */}
              <div className="bg-zinc-900 border-b border-white/10 p-3 flex justify-between items-center z-10 flex-shrink-0">
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
                  onClick={resetRedacter} 
                  disabled={isProcessing}
                  className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer" 
                  title={isEs ? "Quitar archivo" : "Remove file"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* FULL DOCUMENT CONTINUOUS SCROLL VIEWPORT */}
              <div 
                ref={scrollContainerRef}
                className={`flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center gap-4 ${activeTool === 'draw' ? 'cursor-crosshair' : activeTool === 'erase' ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* STACK OF ALL PAGES */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const manualBoxes = redactions.filter(r => r.page === pageNum);
                  const liveAutoBoxes = autoRedactions.filter(r => r.page === pageNum);

                  return (
                    <div
                      key={pageNum}
                      id={`page-card-${pageNum}`}
                      onMouseDown={(e) => handleMouseDown(pageNum, e)}
                      onMouseMove={(e) => handleMouseMove(pageNum, e)}
                      onMouseUp={(e) => handleMouseUp(pageNum, e)}
                      className="w-full bg-white rounded shadow-2xl text-black p-4 min-h-[900px] relative font-serif text-xs leading-relaxed select-none border border-gray-200"
                    >
                      {/* Page Header */}
                      <div className="flex justify-between items-center border-b pb-1.5 mb-3 font-sans text-gray-400 text-[10px] font-mono">
                        <span>DOCUMENTO {file.name}</span>
                        <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded">PÁGINA {pageNum} DE {totalPages}</span>
                      </div>

                      <div className="absolute top-5 left-5 text-lg font-bold text-black font-sans">{pageNum}</div>

                      {/* Real PDF Page Render or Fallback */}
                      {pageDataUrls[pageNum] ? (
                        <div className="mt-1 w-full flex justify-center relative">
                          <div className="relative w-full max-w-full" data-img-wrapper>
                            <img 
                              src={pageDataUrls[pageNum]} 
                              alt={`Página ${pageNum}`}
                              className="w-full h-auto rounded shadow-sm border border-gray-200 block"
                            />
                            {/* 1. LIVE AUTOMATIC SEARCH HIGHLIGHTS (VIBRANT INDIGO HIGH-VISIBILITY HIGHLIGHT) */}
                            {liveAutoBoxes.map((box) => (
                              <div
                                key={box.id}
                                style={{
                                  left: `${box.xPercent}%`,
                                  top: `${box.yPercent}%`,
                                  width: `${box.widthPercent}%`,
                                  height: `${box.heightPercent}%`
                                }}
                                className="absolute bg-indigo-600/80 border-2 border-indigo-300 rounded-sm shadow-xl flex items-center justify-between px-1 text-white font-mono text-[9px] group transition-all z-20 cursor-pointer animate-pulse ring-2 ring-indigo-500/50"
                                title={isEs ? `Coincidencia resaltada: "${box.word}"` : `Highlighted match: "${box.word}"`}
                              >
                                <span className="truncate font-extrabold text-[9px] text-white drop-shadow-md select-none">{box.word}</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeRedaction(box.id); }}
                                  className="text-white hover:text-red-300 p-0.5 opacity-80 group-hover:opacity-100 transition-opacity ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* 2. CONFIRMED SEMI-TRANSPARENT MANUAL REDACTION PATCHES */}
                            {manualBoxes.map((box) => (
                              <div
                                key={box.id}
                                style={{
                                  left: `${box.xPercent}%`,
                                  top: `${box.yPercent}%`,
                                  width: `${box.widthPercent}%`,
                                  height: `${box.heightPercent}%`
                                }}
                                onClick={(e) => {
                                  if (activeTool === 'erase') {
                                    e.stopPropagation();
                                    handleEraseClick(box.id);
                                  }
                                }}
                                className={`absolute bg-black/70 border border-white/30 rounded-sm shadow-2xl flex items-center justify-end px-1 text-white font-mono text-[9px] group transition-all z-30 hover:border-red-500 ${
                                  activeTool === 'erase' ? 'cursor-pointer ring-2 ring-red-500/60 ring-offset-1 ring-offset-transparent' : 'cursor-default'
                                }`}
                                title={isEs ? 'Parche de censura semitransparente' : 'Semi-transparent redaction patch'}
                              >
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeRedaction(box.id); }}
                                  className="text-red-400 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* 3. DRAWING PREVIEW (LIVE RECTANGLE WHILE DRAGGING) */}
                            {drawPreview && drawPreview.page === pageNum && (
                              <div
                                style={{
                                  left: `${drawPreview.xPercent}%`,
                                  top: `${drawPreview.yPercent}%`,
                                  width: `${drawPreview.widthPercent}%`,
                                  height: `${drawPreview.heightPercent}%`
                                }}
                                className="absolute bg-black/40 border-2 border-dashed border-white rounded-sm z-40 pointer-events-none"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          <h2 className="text-xs font-bold text-black font-sans border-b pb-1">
                            PÁGINA {pageNum} - {file.name}
                          </h2>
                          <p className="text-[11px] text-gray-800 leading-relaxed font-mono">
                            Cargando representación gráfica de la página {pageNum}...
                          </p>
                        </div>
                      )}

                      {/* Footer indicator */}
                      <div className="mt-6 text-[10px] text-gray-400 border-t pt-1 font-mono flex justify-between">
                        <span>{file.name}</span>
                        <span>Pág. {pageNum}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Viewport Bar with Tool Selector */}
              <div className="bg-zinc-900 border-t border-white/10 px-3.5 py-1.5 flex items-center justify-between font-mono text-xs text-zinc-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* DRAW TOOL */}
                  <button
                    onClick={() => setActiveTool('draw')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      activeTool === 'draw' ? 'bg-white text-black border-white font-bold' : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                    }`}
                    title={isEs ? 'Herramienta de dibujo: arrastra para crear un rectángulo de censura' : 'Draw tool: drag to create a redaction rectangle'}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">{isEs ? 'Dibujar' : 'Draw'}</span>
                  </button>

                  {/* ERASE TOOL */}
                  <button
                    onClick={() => setActiveTool('erase')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      activeTool === 'erase' ? 'bg-red-500 text-white border-red-500 font-bold' : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                    }`}
                    title={isEs ? 'Herramienta de borrado: haz clic en un parche para eliminarlo' : 'Erase tool: click a patch to remove it'}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">{isEs ? 'Borrar' : 'Erase'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                  <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="truncate max-w-[120px] text-[11px] font-bold text-white">{file.name}</span>
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-white">
                    {totalPages} {isEs ? 'Páginas' : 'Pages'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL (REDUCIDO EN ANCHO - 4 COLUMNAS) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 flex flex-col justify-between relative shadow-2xl font-sans h-[92vh] min-h-[860px]">
              
              {/* CABECERA FIJA DEL PANEL */}
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3 flex-shrink-0">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-0.5">
                    002 / CONFIGURACIÓN
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                    PANEL DE CONTROL
                  </h2>
                </div>
                <div className="bg-zinc-900 p-2 rounded-xl border border-white/10 text-white">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* CUERPO CON DESPLAZAMIENTO INTERNO (SIN BARRA DE DESPLAZAMIENTO VISIBLE) */}
              <div className="flex-1 overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-3 font-sans">
                <div className="font-mono">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    003 / CENSURA Y BÚSQUEDA DE TEXTO
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight font-sans mt-0.5">
                    {isEs ? 'Censura Automática en Todo el Documento' : 'Automatic Document Redaction'}
                  </h3>
                </div>

                {/* Target Word Input Box */}
                <div className="relative font-mono">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyWordSearch();
                      }
                    }}
                    placeholder={isEs ? 'Escribe la palabra a cubrir en todo el documento...' : 'Type word to cover across entire document...'}
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                {/* Preset Search Categories */}
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase">
                    {isEs ? 'Categorías Rápidas de Censura' : 'Quick Redaction Categories'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <button
                      onClick={() => setSelectedPreset('text')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedPreset === 'text' ? 'bg-zinc-800 border-white text-white font-bold shadow' : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5 text-zinc-300" />
                      <span className="truncate">{isEs ? '[T] Texto Libre' : '[T] Custom Text'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedPreset('card')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedPreset === 'card' ? 'bg-zinc-800 border-white text-white font-bold shadow' : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">{isEs ? '💳 Tarjeta Crédito' : '💳 Credit Card'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedPreset('phone')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedPreset === 'phone' ? 'bg-zinc-800 border-white text-white font-bold shadow' : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate">{isEs ? '📱 Telefónico' : '📱 Phone'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedPreset('email')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedPreset === 'email' ? 'bg-zinc-800 border-white text-white font-bold shadow' : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{isEs ? '✉️ Correo Elec.' : '✉️ Email'}</span>
                    </button>
                  </div>
                </div>

                {/* Cancel / Accept Buttons */}
                <div className="flex justify-end gap-2 font-mono text-xs">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-300 rounded-xl transition-all cursor-pointer text-[11px]"
                  >
                    {isEs ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleApplyWordSearch}
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-[11px]"
                  >
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>{isEs ? 'Cubrir en Todo el Documento' : 'Accept & Cover'}</span>
                  </button>
                </div>

                {/* OPCIONES AVANZADAS TOGGLE */}
                <div className="mt-1">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer font-mono"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-2.5 space-y-3.5 bg-zinc-950/60 border border-white/8 rounded-xl p-3.5 font-sans">
                      
                      {/* ESTILO DE PARCHE DE CENSURA */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <EyeOff className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Estilo de Parche de Censura' : 'Redaction Patch Style'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                          <button
                            onClick={() => setRedactionStyle('black')}
                            className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${
                              redactionStyle === 'black' ? 'bg-black border-white text-white shadow' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isEs ? '⬛ Negro Sólido' : '⬛ Solid Black'}
                          </button>

                          <button
                            onClick={() => setRedactionStyle('gray')}
                            className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${
                              redactionStyle === 'gray' ? 'bg-zinc-700 border-white text-white shadow' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isEs ? '🩶 Gris / Difuminado' : '🩶 Dark Gray'}
                          </button>
                        </div>
                      </div>

                      {/* COINCIDENCIA DE BÚSQUEDA */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Configuración de Búsqueda' : 'Search Rules'}
                        </label>

                        <div onClick={() => setExactMatch(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Coincidencia exacta de mayúsculas' : 'Exact Case Matching'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{isEs ? 'Sensible a mayúsculas y minúsculas' : 'Case-sensitive match'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${exactMatch ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${exactMatch ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-zinc-400 block mb-1">{isEs ? 'Sufijo del archivo censurado:' : 'Redacted output suffix:'}</label>
                          <input
                            type="text"
                            value={customSuffix}
                            onChange={e => setCustomSuffix(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/40 transition"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Security Warning Box */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200 font-sans leading-snug">
                    {isEs 
                      ? 'Recuerda revisar el resultado de tu documento antes de enviar o compartir información privada.' 
                      : 'Remember to review the result of your document before sending private information.'}
                  </p>
                </div>
              </div>

              {/* BOTÓN DE ACCIÓN FIJO EN LA PARTE INFERIOR */}
              <div className="pt-3 border-t border-white/10 mt-2 flex-shrink-0">
                <button
                  onClick={executeRedact}
                  disabled={isProcessing}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl group disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>{progressMsg || (isEs ? 'Censurando...' : 'Redacting...')}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-black" />
                      <span>{isEs ? 'Censurar PDF' : 'Redact PDF'}</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
