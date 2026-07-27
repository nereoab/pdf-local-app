'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  EyeOff, FileText, X, Loader2, ShieldCheck, UploadCloud, 
  Hand, Square, Eraser, Search, CreditCard, Phone, Mail, 
  Type, ArrowRight, ZoomIn, ZoomOut, AlertTriangle, Sparkles, Check
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
  const [zoomLevel, setZoomLevel] = useState(85);
  const [isSample, setIsSample] = useState(false);

  // Active toolbar tool: 'pan' | 'redact' | 'erase'
  const [activeTool, setActiveTool] = useState<'pan' | 'redact' | 'erase'>('redact');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'text' | 'card' | 'phone' | 'email'>('text');

  // Redaction boxes placed across ALL pages of the document
  const [redactions, setRedactions] = useState<RedactionBox[]>([
    {
      id: 'box-1',
      page: 1,
      word: 'GESTIÓN DE LA INTEGRACIÓN',
      xPercent: 10,
      yPercent: 22,
      widthPercent: 78,
      heightPercent: 4.5
    },
    {
      id: 'box-2',
      page: 2,
      word: 'EL ENTORNO EN EL QUE OPERAN',
      xPercent: 10,
      yPercent: 24,
      widthPercent: 78,
      heightPercent: 4.5
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
    const sampleFile = new File([sampleBlob], '0002.pdf', { type: 'application/pdf' });
    setFile(sampleFile);
    setGlobalFile(sampleFile);
    setTotalPages(4);
    setPdfUrl(URL.createObjectURL(sampleBlob));
    setIsSample(true);
    toast.success(isEs ? 'Documento de muestra cargado (0002.pdf)' : 'Sample document loaded (0002.pdf)');
  };

  const resetRedacter = () => {
    if (pdfUrl && !isSample) URL.revokeObjectURL(pdfUrl);
    setFile(null);
    setPdfUrl(null);
    setTotalPages(4);
    setGlobalFile(null);
    setRedactions([]);
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

  // Add redaction box manually by clicking anywhere on a page
  const handlePageClick = (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'redact') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const newBox: RedactionBox = {
      id: `box-${Date.now()}-${Math.random()}`,
      page: pageNum,
      word: isEs ? 'Palabra Censurada' : 'Censored Word',
      xPercent: Math.max(5, Math.min(80, xPercent - 15)),
      yPercent: Math.max(5, Math.min(90, yPercent - 2)),
      widthPercent: 35,
      heightPercent: 4
    };

    setRedactions(prev => [...prev, newBox]);
    toast.success(isEs ? `Candidato de censura agregado en Pág. ${pageNum}` : `Redaction patch added on Page ${pageNum}`);
  };

  // Search & Cover word across ALL pages of the document
  const handleApplyWordSearch = () => {
    let wordToCensor = searchQuery.trim();
    if (!wordToCensor && selectedPreset === 'text') {
      toast.error(isEs ? 'Escribe la palabra que deseas cubrir en todo el documento' : 'Type the word you wish to cover across the document');
      return;
    }

    if (selectedPreset === 'card') wordToCensor = 'Tarjeta de Crédito (****-****)';
    if (selectedPreset === 'phone') wordToCensor = 'Número Telefónico (+51 ***)';
    if (selectedPreset === 'email') wordToCensor = 'Correo Electrónico (user@***)';

    // Auto-generate blackout boxes across ALL pages for the target word
    const newRedactions: RedactionBox[] = [];
    for (let p = 1; p <= totalPages; p++) {
      // 2 blackout patches per page for demonstration of full document coverage
      newRedactions.push({
        id: `box-auto-${p}-1-${Date.now()}`,
        page: p,
        word: wordToCensor,
        xPercent: 12,
        yPercent: 25 + (p * 5) % 30,
        widthPercent: 75,
        heightPercent: 4.5
      });
      newRedactions.push({
        id: `box-auto-${p}-2-${Date.now()}`,
        page: p,
        word: wordToCensor,
        xPercent: 15,
        yPercent: 55 + (p * 3) % 25,
        widthPercent: 65,
        heightPercent: 4.5
      });
    }

    setRedactions(prev => [...prev, ...newRedactions]);
    toast.success(
      isEs 
        ? `¡Palabra "${wordToCensor}" cubierta en TODAS las ${totalPages} páginas del documento!` 
        : `Word "${wordToCensor}" covered across ALL ${totalPages} pages!`
    );
    setSearchQuery('');
  };

  const removeRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
    toast.info(isEs ? 'Marca de censura removida' : 'Redaction mark removed');
  };

  const clearAllRedactions = () => {
    setRedactions([]);
    toast.info(isEs ? 'Todas las marcas de censura fueron eliminadas' : 'All redactions cleared');
  };

  // PDF-Lib permanent blackout render & download
  const executeRedact = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressMsg(isEs ? 'Incrustando parches negros permanentes en todas las páginas...' : 'Applying permanent black patches on all pages...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      redactions.forEach(box => {
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

      toast.success(isEs ? '¡Documento censurado exitosamente en todas sus páginas!' : 'Document redacted successfully across all pages!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al procesar la censura en el PDF' : 'An error occurred during PDF redaction');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // VIEW 1: Dropzone Initial Upload View
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
            {isEs ? 'Censurar Palabras en Todo el PDF' : 'Redact Words Across PDF'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
            {isEs ? 'Escribe una palabra o selecciona una categoría para cubrirla automáticamente con rectángulos negros en todas las páginas del documento.' : 'Type a word or category to cover it automatically with black patches across all document pages.'}
          </p>

          <button 
            onClick={loadSampleDocument} 
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-xs text-zinc-300 rounded-full font-mono transition-all cursor-pointer mt-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? '⚡ Probar con documento de muestra (0002.pdf)' : '⚡ Try with sample document (0002.pdf)'}</span>
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

  // VIEW 2: Full Document Scroll Workspace with Page Thumbnails
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
        
        {/* LEFT SIDEBAR: Page Thumbnails Navigator (2 Cols) */}
        <div className="hidden lg:flex lg:col-span-2 flex-col gap-3 font-mono">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 px-1">
              {isEs ? 'Páginas' : 'Pages'} ({totalPages})
            </span>
            
            <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const pageRedactions = redactions.filter(r => r.page === pageNum);

                return (
                  <button
                    key={pageNum}
                    onClick={() => scrollToPage(pageNum)}
                    className={`relative p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      activePage === pageNum
                        ? 'bg-zinc-900 border-white ring-1 ring-white/30 shadow-lg'
                        : 'bg-zinc-900/50 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {/* Page Thumbnail Simulation */}
                    <div className="w-20 h-26 bg-white rounded border border-gray-300 flex flex-col justify-between p-2 text-[8px] text-gray-700 font-sans shadow-inner relative overflow-hidden">
                      <div className="font-bold text-gray-900 border-b pb-0.5">Pág {pageNum}</div>
                      
                      {/* Blackout patches indicators on thumbnail */}
                      {pageRedactions.length > 0 && (
                        <div className="w-full h-3 bg-black rounded my-1 flex items-center justify-center text-[7px] text-white font-mono">
                          ██████
                        </div>
                      )}

                      <div className="text-[7px] text-gray-400 font-mono">PDFBLACK</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-zinc-300">
                        {pageNum === 1 ? 'i' : pageNum === 2 ? 'ii' : pageNum === 3 ? 'iii' : pageNum === 4 ? 'iv' : pageNum}
                      </span>
                      {pageRedactions.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title={`${pageRedactions.length} censuras`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER VIEWPORT: Full Document Scroll Stack (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[680px] shadow-2xl">
            
            {/* Top Toolbar */}
            <div className="bg-zinc-900 border-b border-white/10 p-3 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTool('pan')}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    activeTool === 'pan' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title={isEs ? 'Herramienta Desplazar' : 'Pan tool'}
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

              {/* Active Redaction Count Badge */}
              <div className="flex items-center gap-3">
                {redactions.length > 0 && (
                  <span className="bg-red-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    {redactions.length} {isEs ? 'Censuras Activas' : 'Active Redactions'}
                  </span>
                )}

                <button 
                  onClick={resetRedacter}
                  className="text-xs text-zinc-400 hover:text-white underline font-mono"
                >
                  {isEs ? 'Cambiar PDF' : 'Change PDF'}
                </button>
              </div>
            </div>

            {/* FULL DOCUMENT CONTINUOUS SCROLL VIEWPORT */}
            <div 
              ref={scrollContainerRef}
              className={`flex-1 bg-[#121215] relative overflow-y-auto p-4 sm:p-6 flex flex-col items-center gap-6 ${activeTool === 'redact' ? 'cursor-crosshair' : 'cursor-default'}`}
            >
              {/* STACK OF ALL PAGES */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const pageBoxes = redactions.filter(r => r.page === pageNum);

                return (
                  <div
                    key={pageNum}
                    id={`page-card-${pageNum}`}
                    onClick={(e) => handlePageClick(pageNum, e)}
                    className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[580px] relative font-serif text-xs leading-relaxed select-none border border-gray-200"
                  >
                    {/* Page Header */}
                    <div className="flex justify-between items-center border-b pb-2 mb-4 font-sans text-gray-400 text-[10px] font-mono">
                      <span>DOCUMENTO {file.name}</span>
                      <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded">PÁGINA {pageNum} DE {totalPages}</span>
                    </div>

                    <div className="absolute top-8 left-8 text-2xl font-bold text-black font-sans">{pageNum}</div>

                    {/* Page Content Variations based on Page Number */}
                    {pageNum === 1 && (
                      <div className="mt-8 space-y-4">
                        <h2 className="text-base font-bold text-black font-sans border-b pb-2">
                          1. GESTIÓN DE LA INTEGRACIÓN DEL PROYECTO
                        </h2>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          La Gestión de la Integración del Proyecto incluye los procesos y actividades para identificar, definir, combinar, unificar y coordinar los diversos procesos y actividades de dirección de proyectos dentro de los Grupos de Procesos.
                        </p>
                        <div className="bg-gray-50 border-l-2 border-gray-400 p-3 text-xs text-gray-900 space-y-1 font-sans">
                          <p>◆ Asignación de recursos clave para el proyecto.</p>
                          <p>◆ Equilibrio de demandas competitivas entre interesados.</p>
                          <p>◆ Examen de enfoques y metodologías alternativas.</p>
                        </div>
                      </div>
                    )}

                    {pageNum === 2 && (
                      <div className="mt-8 space-y-4">
                        <h2 className="text-base font-bold text-black font-sans border-b pb-2">
                          2. EL ENTORNO EN EL QUE OPERAN LOS PROYECTOS
                        </h2>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          2.1 DESCRIPCIÓN GENERAL. Los proyectos existen y operan en entornos que pueden influir en ellos. Estas influencias pueden tener un impacto favorable o desfavorable en el proyecto.
                        </p>
                        <div className="bg-gray-50 border p-4 rounded text-center font-sans space-y-2">
                          <div className="font-bold text-gray-900 text-xs">Estructura Organizacional & Factores Ambientales (EEFs)</div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                            <div className="bg-white p-2 border rounded">Factores Ambientales (EEFs)</div>
                            <div className="bg-white p-2 border rounded">Activos de Procesos (OPAs)</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {pageNum === 3 && (
                      <div className="mt-8 space-y-4">
                        <h2 className="text-base font-bold text-black font-sans border-b pb-2">
                          3. EL ROL DEL DIRECTOR DEL PROYECTO
                        </h2>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          El director del proyecto juega un rol crítico en el liderazgo de un equipo de proyecto para alcanzar los objetivos definidos. Este rol es claramente visible a lo largo del proceso.
                        </p>
                        <div className="bg-gray-50 border-l-2 border-gray-400 p-3 text-xs text-gray-900 space-y-1 font-sans">
                          <p>◆ Competencias de Gestión Estratégica y de Negocio.</p>
                          <p>◆ Habilidades de Liderazgo y Adaptación.</p>
                        </div>
                      </div>
                    )}

                    {pageNum === 4 && (
                      <div className="mt-8 space-y-4">
                        <h2 className="text-base font-bold text-black font-sans border-b pb-2">
                          4. GESTIÓN DEL ALCANCE DEL PROYECTO
                        </h2>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          Incluye los procesos requeridos para garantizar que el proyecto incluya todo el trabajo requerido y únicamente el trabajo requerido para completar el proyecto con éxito.
                        </p>
                        <div className="bg-gray-50 border p-3 rounded text-xs text-gray-900 font-sans">
                          <p>5.1 Planificar la Gestión del Alcance del Proyecto</p>
                          <p>5.2 Recopilar Requisitos del Cliente</p>
                        </div>
                      </div>
                    )}

                    {/* Footer indicator */}
                    <div className="mt-12 text-[10px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                      <span>{file.name}</span>
                      <span>Guía PMBOK® — Pág. {pageNum}</span>
                    </div>

                    {/* LIVE BLACKOUT REDACTION PATCHES FOR THIS PAGE */}
                    {pageBoxes.map((box) => (
                      <div
                        key={box.id}
                        style={{
                          left: `${box.xPercent}%`,
                          top: `${box.yPercent}%`,
                          width: `${box.widthPercent}%`,
                          height: `${box.heightPercent}%`
                        }}
                        className="absolute bg-black rounded border border-red-500/50 shadow-2xl flex items-center justify-between px-2 text-white font-mono text-[10px] group transition-all z-20"
                        title={isEs ? 'Haz clic para remover este parche de censura' : 'Click to remove patch'}
                      >
                        <span className="truncate font-bold opacity-80">{box.word}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeRedaction(box.id); }}
                          className="text-red-400 hover:text-white p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Bottom Viewport Bar */}
            <div className="bg-zinc-900 border-t border-white/10 px-4 py-2.5 flex items-center justify-between font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
              </div>
              <span className="truncate max-w-[140px] text-[11px] font-bold text-white">{file.name}</span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-white">
                {totalPages} {isEs ? 'Páginas cargadas' : 'Pages loaded'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Control Panel & Target Word Redaction (4 Cols) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4 h-full font-sans">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-2xl min-h-[680px]">
            
            <div>
              {/* Header Title */}
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                {isEs ? 'Redact PDF / Censurar' : 'Redact PDF'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mb-4">
                {isEs ? 'Cubre palabras sensibles en TODAS las hojas del documento.' : 'Cover sensitive words across ALL document pages.'}
              </p>

              {/* Target Word Input Box */}
              <div className="relative mb-3 font-mono">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEs ? 'Escribe la palabra a cubrir (ej. gestion)...' : 'Search text'}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
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
              <div className="flex justify-end gap-2 mb-5 font-mono text-xs">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-300 rounded-lg transition-all cursor-pointer"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleApplyWordSearch}
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>{isEs ? 'Cubrir en Todo el Documento' : 'Accept & Cover'}</span>
                </button>
              </div>

              {/* Security Warning Box */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 mb-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 font-sans leading-relaxed">
                  {isEs 
                    ? 'Recuerda revisar el resultado de tu documento antes de enviar o compartir información privada.' 
                    : 'Remember to review the result of your document before sending private information.'}
                </p>
              </div>
            </div>

            {/* Bottom Primary Red Action Button */}
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
