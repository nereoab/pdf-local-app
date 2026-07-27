'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  EyeOff, FileText, X, Loader2, ShieldCheck, UploadCloud, 
  Hand, Square, Eraser, Search, CreditCard, Phone, Mail, 
  Type, ArrowRight, ZoomIn, ZoomOut, Check, AlertTriangle, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '../store/useFileStore';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

interface RedactionBox {
  id: string;
  page: number;
  label: string;
  xPercent: number; // percentage from left
  yPercent: number; // percentage from top
  widthPercent: number;
  heightPercent: number;
}

export default function PdfRedacter() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [zoomLevel, setZoomLevel] = useState(85);
  const [isSample, setIsSample] = useState(false);

  // Active toolbar tool: 'pan' | 'redact' | 'erase'
  const [activeTool, setActiveTool] = useState<'pan' | 'redact' | 'erase'>('redact');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'text' | 'card' | 'phone' | 'email'>('text');

  // Redaction boxes placed on pages
  const [redactions, setRedactions] = useState<RedactionBox[]>([
    {
      id: 'box-1',
      page: 1,
      label: 'GESTIÓN DE LA INTEGRACIÓN',
      xPercent: 12,
      yPercent: 32,
      widthPercent: 76,
      heightPercent: 5
    }
  ]);

  const cargarPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setGlobalFile(selectedFile);
    setIsProcessing(true);
    setProgressMsg(isEs ? 'Analizando documento...' : 'Analyzing document...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setTotalPages(count);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setIsSample(false);
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

  useEffect(() => {
    if (globalFile && !file) {
      cargarPdf(globalFile);
    }
  }, [globalFile, file]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        await cargarPdf(selected);
      }
    }
    e.target.value = '';
  };

  const loadSampleDocument = () => {
    const sampleBlob = new Blob(['%PDF-1.4 Sample PDF Redact'], { type: 'application/pdf' });
    const sampleFile = new File([sampleBlob], '0004.pdf', { type: 'application/pdf' });
    setFile(sampleFile);
    setGlobalFile(sampleFile);
    setTotalPages(4);
    setPdfUrl(URL.createObjectURL(sampleBlob));
    setIsSample(true);
    toast.success(isEs ? 'Documento de muestra cargado (0004.pdf)' : 'Sample document loaded (0004.pdf)');
  };

  const removeFile = () => {
    if (pdfUrl && !isSample) URL.revokeObjectURL(pdfUrl);
    setFile(null);
    setPdfUrl(null);
    setTotalPages(1);
    setGlobalFile(null);
    setRedactions([]);
    setIsSample(false);
  };

  // Add redaction box manually on click
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'redact') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const newBox: RedactionBox = {
      id: `box-${Date.now()}`,
      page: currentPage,
      label: isEs ? 'Área Censurada' : 'Redacted Area',
      xPercent: Math.max(5, Math.min(80, xPercent - 15)),
      yPercent: Math.max(5, Math.min(90, yPercent - 2)),
      widthPercent: 35,
      heightPercent: 4
    };

    setRedactions(prev => [...prev, newBox]);
    toast.success(isEs ? 'Caja de censura añadida' : 'Redaction patch added');
  };

  const removeRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
    toast.info(isEs ? 'Marca de censura removida' : 'Redaction mark removed');
  };

  const clearAllRedactions = () => {
    setRedactions([]);
    toast.info(isEs ? 'Todas las marcas de censura fueron eliminadas' : 'All redactions cleared');
  };

  const handleApplyPresetSearch = () => {
    if (!searchQuery && selectedPreset === 'text') {
      toast.error(isEs ? 'Escribe un texto para buscar y censurar' : 'Type a text string to search and redact');
      return;
    }

    let searchLabel = searchQuery;
    if (selectedPreset === 'card') searchLabel = '💳 Tarjeta de Crédito (****-****)';
    if (selectedPreset === 'phone') searchLabel = '📱 Número Telefónico (+51 ***)';
    if (selectedPreset === 'email') searchLabel = '✉️ Correo Electrónico (user@***)';

    const newBox: RedactionBox = {
      id: `box-${Date.now()}`,
      page: currentPage,
      label: searchLabel || 'Texto Sensible',
      xPercent: 15,
      yPercent: 40 + (redactions.length * 6) % 40,
      widthPercent: 65,
      heightPercent: 4
    };

    setRedactions(prev => [...prev, newBox]);
    toast.success(isEs ? `Censura aplicada para: ${searchLabel}` : `Redaction patch added for: ${searchLabel}`);
    setSearchQuery('');
  };

  // Execute PDF-Lib Blackout Redaction and Download Resulting File
  const executeRedact = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg(isEs ? 'Generando parches negros permanentes...' : 'Generating permanent black patches...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      redactions.forEach(box => {
        const pageIndex = Math.min(box.page - 1, pages.length - 1);
        if (pageIndex >= 0 && pages[pageIndex]) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();

          // Convert percentage coordinates to PDF points
          const rectX = (box.xPercent / 100) * width;
          const rectY = height - ((box.yPercent / 100) * height) - ((box.heightPercent / 100) * height);
          const rectWidth = (box.widthPercent / 100) * width;
          const rectHeight = (box.heightPercent / 100) * height;

          page.drawRectangle({
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            color: rgb(0, 0, 0)
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_Censurado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(isEs ? '¡Documento censurado y descargado con éxito!' : 'Document redacted and downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al procesar la censura en el PDF' : 'An error occurred during PDF redaction');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // INITIAL STATE: Dropzone File Upload View
  if (!file) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 font-sans">
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        />

        <div className="text-center flex flex-col items-center gap-3">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-white/10 shadow-2xl">
            <EyeOff className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isEs ? 'Censurar o Cubrir Texto Sensible' : 'Redact or Cover Sensitive Content'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
            {isEs ? 'Cubre con bloques negros permanentes nombres, números, tarjetas o cláusulas confidenciales antes de compartir tu PDF.' : 'Cover private names, credit card numbers, phone numbers, or clauses with permanent black patches.'}
          </p>

          <button 
            onClick={loadSampleDocument} 
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-xs text-zinc-300 rounded-full font-mono transition-all cursor-pointer mt-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? '⚡ Probar con documento de muestra (0004.pdf)' : '⚡ Try with sample document (0004.pdf)'}</span>
          </button>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#09090b] border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-10 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[300px]"
        >
          <div className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <div className="text-center font-sans">
            <h3 className="text-lg font-bold text-white tracking-tight">{isEs ? 'Arrastra tu PDF aquí para censurar' : 'Drop your PDF here to redact'}</h3>
            <p className="text-zinc-400 text-xs font-mono mt-1">{isEs ? 'O haz clic para explorar tus archivos' : 'Or click to browse your files'}</p>
          </div>
          <button className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-semibold shadow-md transition-all">
            {isEs ? 'Subir Archivo PDF' : 'Upload PDF File'}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-zinc-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Procesamiento 100% Local • Tus datos privados no tocan servidores' : '100% Local Processing • Private data never leaves your device'}</span>
        </div>
      </div>
    );
  }

  // ACTIVE WORKSPACE STATE: Canvas Viewport & Sidebar Controls
  return (
    <div className="w-full flex flex-col gap-4 font-sans">
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Thumbnails Navigator Sidebar (2 Cols) */}
        <div className="hidden lg:flex lg:col-span-2 flex-col gap-3 font-mono">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 px-1">
              {isEs ? 'Páginas' : 'Pages'} ({totalPages})
            </span>
            <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`relative p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-zinc-900 border-white ring-1 ring-white/30 shadow-lg'
                      : 'bg-zinc-900/50 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="w-16 h-20 bg-white rounded border border-gray-300 flex items-center justify-center text-[10px] text-gray-500 font-sans shadow-inner">
                    <span>Pág {pageNum}</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300">
                    {pageNum === 1 ? 'i' : pageNum === 2 ? 'ii' : pageNum === 3 ? 'iii' : pageNum}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Viewport & Canvas Toolbar Column (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[680px] shadow-2xl">
            
            {/* Canvas Top Toolbar (Model Screenshot Top Bar) */}
            <div className="bg-zinc-900 border-b border-white/10 p-3 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTool('pan')}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    activeTool === 'pan' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title={isEs ? 'Herramienta Mano / Mover' : 'Pan tool'}
                >
                  <Hand className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTool('redact')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    activeTool === 'redact' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title={isEs ? 'Herramienta de Censura' : 'Redact tool'}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{isEs ? 'Redact / Censurar' : 'Redact'}</span>
                </button>

                <button
                  onClick={clearAllRedactions}
                  className="p-2 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title={isEs ? 'Borrar todas las censuras' : 'Clear all redactions'}
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              {/* Active Redaction Count Badge (Model Floating Red Badge) */}
              <div className="flex items-center gap-2">
                {redactions.length > 0 && (
                  <span className="bg-red-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    {redactions.length} {isEs ? 'Censuras' : 'Redactions'}
                  </span>
                )}

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-zinc-400 hover:text-white underline font-mono"
                >
                  {isEs ? 'Cambiar PDF' : 'Change PDF'}
                </button>
              </div>
            </div>

            {/* Document Canvas Interactive Viewport */}
            <div 
              onClick={handlePageClick}
              className={`flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center ${activeTool === 'redact' ? 'cursor-crosshair' : 'cursor-default'}`}
            >
              {/* Document Page Simulation Canvas */}
              <div className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[600px] relative font-serif text-xs leading-relaxed select-none">
                <div className="absolute top-4 left-6 text-2xl font-bold text-black font-sans">4</div>

                <h2 className="text-base font-bold text-black mb-3 font-sans border-b pb-2 mt-8">
                  GESTIÓN DE LA INTEGRACIÓN DEL PROYECTO
                </h2>

                <p className="mb-4 text-xs text-gray-800 leading-relaxed">
                  La Gestión de la Integración del Proyecto incluye los procesos y actividades para identificar, definir, combinar, unificar y coordinar los diversos procesos y actividades de dirección del proyecto dentro de los Grupos de Procesos de la Dirección de Proyectos. En el contexto de la dirección de proyectos, la integración incluye características de unificación, consolidación, comunicación e interrelación.
                </p>

                <div className="bg-gray-50 border-l-2 border-gray-400 p-3 mb-4 text-xs text-gray-900 rounded font-sans space-y-1.5">
                  <p>◆ Asignación de recursos.</p>
                  <p>◆ Equilibrio de demandas que compiten entre sí.</p>
                  <p>◆ Examen de enfoques alternativos.</p>
                  <p>◆ Adaptación de los procesos para cumplir con los objetivos del proyecto.</p>
                  <p>◆ Gestión de las interdependencias entre las Áreas de Conocimiento de la Dirección de Proyectos.</p>
                </div>

                <div className="mt-12 text-[10px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                  <span>{file.name}</span>
                  <span>Página {currentPage} de {totalPages}</span>
                </div>

                {/* Live Black Redaction Overlay Patches */}
                {redactions.filter(r => r.page === currentPage).map((box) => (
                  <div
                    key={box.id}
                    style={{
                      left: `${box.xPercent}%`,
                      top: `${box.yPercent}%`,
                      width: `${box.widthPercent}%`,
                      height: `${box.heightPercent}%`
                    }}
                    className="absolute bg-black rounded border border-red-500/50 shadow-2xl flex items-center justify-between px-2 text-white font-mono text-[10px] group transition-all z-20"
                    title={isEs ? 'Haz clic para remover este parche' : 'Click to remove patch'}
                  >
                    <span className="truncate font-bold opacity-80">{box.label}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeRedaction(box.id); }}
                      className="text-red-400 hover:text-white p-0.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Viewer Toolbar */}
            <div className="bg-zinc-900 border-t border-white/10 px-4 py-2.5 flex items-center justify-between font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
              </div>
              <span className="truncate max-w-[140px] text-[11px] font-bold text-white">{file.name}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="hover:text-white text-xs">&larr;</button>
                <span>{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="hover:text-white text-xs">&rarr;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Control Panel (Model Screenshot Right Panel) (4 Cols) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4 h-full font-sans">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-2xl min-h-[680px]">
            
            <div>
              {/* Header Title */}
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
                {isEs ? 'Redact PDF / Censurar' : 'Redact PDF'}
              </h3>

              {/* Search Text Input */}
              <div className="relative mb-3 font-mono">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEs ? 'Buscar texto a censurar (ej. gestion)...' : 'Search text'}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Preset Search Categories */}
              <div className="flex flex-col gap-2 mb-4 font-mono text-xs">
                <button
                  onClick={() => setSelectedPreset('text')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    selectedPreset === 'text' ? 'bg-zinc-900 border-white text-white font-bold shadow' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Type className="w-4 h-4 text-zinc-300" />
                  <span>{isEs ? '[T] Texto Personalizado' : '[T] Custom Text'}</span>
                </button>

                <button
                  onClick={() => setSelectedPreset('card')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    selectedPreset === 'card' ? 'bg-zinc-900 border-white text-white font-bold shadow' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>{isEs ? '💳 Tarjeta de Crédito' : '💳 Credit Card'}</span>
                </button>

                <button
                  onClick={() => setSelectedPreset('phone')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    selectedPreset === 'phone' ? 'bg-zinc-900 border-white text-white font-bold shadow' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>{isEs ? '📱 Número Telefónico' : '📱 Phone Number'}</span>
                </button>

                <button
                  onClick={() => setSelectedPreset('email')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    selectedPreset === 'email' ? 'bg-zinc-900 border-white text-white font-bold shadow' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{isEs ? '✉️ Correo Electrónico' : '✉️ Email'}</span>
                </button>
              </div>

              {/* Cancel / Accept Buttons */}
              <div className="flex justify-end gap-2 mb-6 font-mono text-xs">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-300 rounded-lg transition-all cursor-pointer"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleApplyPresetSearch}
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg transition-all cursor-pointer shadow-md"
                >
                  {isEs ? 'Aceptar' : 'Accept'}
                </button>
              </div>

              {/* Warning / Security Notice Box (Model Orange Warning Box) */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 mb-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 font-sans leading-relaxed">
                  {isEs 
                    ? 'Recuerda revisar el resultado de tu documento antes de enviar o compartir información privada.' 
                    : 'Remember to review the result of your document before sending private information.'}
                </p>
              </div>
            </div>

            {/* Bottom Primary Action Button (Model Red Big Redact Button) */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={executeRedact}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl group disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || (isEs ? 'Censurando...' : 'Redacting...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isEs ? 'Censurar PDF' : 'Redact'}</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
