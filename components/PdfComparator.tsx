'use client';

import { useState, useRef } from 'react';
import { 
  GitCompare, FileText, X, ShieldCheck, FilePlus, 
  Layers, Search, ZoomIn, ZoomOut, ArrowRight,
  SplitSquareVertical, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

interface DiffItem {
  id: string;
  page: number;
  oldText: string;
  newText: string;
  oldCount: number;
  newCount: number;
  type: 'edit' | 'add' | 'delete';
}

export default function PdfComparator() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [url1, setUrl1] = useState<string | null>(null);
  const [url2, setUrl2] = useState<string | null>(null);

  // Settings & mode states
  const [compareMode, setCompareMode] = useState<'semantic' | 'overlay'>('semantic');
  const [scrollSync, setScrollSync] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(81);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample report items matching the model screenshot
  const [diffItems] = useState<DiffItem[]>([
    {
      id: 'diff-1',
      page: 1,
      oldText: 'GESTIÓN DEL ALCANCE DEL PROYECTO. Incluye los procesos requeridos para garantizar que el proyecto incluya todo el trabajo.',
      newText: 'GESTIÓN DE LA INTEGRACIÓN DEL PROYECTO. Incluye los procesos y actividades para identificar, definir, combinar y coordinar.',
      oldCount: -5,
      newCount: +4,
      type: 'edit'
    },
    {
      id: 'diff-2',
      page: 1,
      oldText: '5.1 Planificar la Gestión del Alcance — Es el proceso de crear un plan de gestión.',
      newText: '★ Asignación de recursos. Equilibrio de demandas competitivas y enfoque.',
      oldCount: -12,
      newCount: +8,
      type: 'edit'
    },
    {
      id: 'diff-3',
      page: 2,
      oldText: 'Requisitos del cliente y de los interesados para cumplir con los objetivos.',
      newText: 'Adaptación de los procesos para cumplir con los objetivos del proyecto y la dirección.',
      oldCount: -3,
      newCount: +6,
      type: 'add'
    },
    {
      id: 'diff-4',
      page: 3,
      oldText: 'Crear la EDT/WBS — Descomposición jerárquica del alcance total.',
      newText: 'Gestión de las interdependencias entre las áreas de conocimiento de la dirección.',
      oldCount: -8,
      newCount: +2,
      type: 'delete'
    }
  ]);

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile1(selected);
        setUrl1(URL.createObjectURL(selected));
        toast.success(isEs ? 'PDF 1 (Original) cargado' : 'PDF 1 (Original) loaded');
      } else {
        toast.error(isEs ? 'Por favor sube un archivo PDF válido' : 'Please upload a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile2(selected);
        setUrl2(URL.createObjectURL(selected));
        toast.success(isEs ? 'PDF 2 (Modificado) cargado' : 'PDF 2 (Modified) loaded');
      } else {
        toast.error(isEs ? 'Por favor sube un archivo PDF válido' : 'Please upload a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const loadSampleComparison = () => {
    const sampleBlob1 = new Blob(['%PDF-1.4 Sample PDF 1'], { type: 'application/pdf' });
    const sampleBlob2 = new Blob(['%PDF-1.4 Sample PDF 2'], { type: 'application/pdf' });
    const fileA = new File([sampleBlob1], '0005_Original.pdf', { type: 'application/pdf' });
    const fileB = new File([sampleBlob2], '0004_Modificado.pdf', { type: 'application/pdf' });
    setFile1(fileA);
    setFile2(fileB);
    setUrl1(URL.createObjectURL(sampleBlob1));
    setUrl2(URL.createObjectURL(sampleBlob2));
    toast.success(isEs ? 'Modo de prueba activado con 2 documentos de muestra' : 'Demo mode activated with 2 sample PDFs');
  };

  const resetComparator = () => {
    if (url1) URL.revokeObjectURL(url1);
    if (url2) URL.revokeObjectURL(url2);
    setFile1(null);
    setFile2(null);
    setUrl1(null);
    setUrl2(null);
  };

  const downloadReport = () => {
    const reportText = `PDFBLACK - REPORTE DE COMPARACIÓN PDF
=========================================
Archivo 1: ${file1?.name || '0005_Original.pdf'}
Archivo 2: ${file2?.name || '0004_Modificado.pdf'}
Modo: ${compareMode === 'semantic' ? 'Texto Semántico' : 'Superposición Visual'}
Total Cambios Detectados: ${diffItems.length}

DETALLE DE CAMBIOS POR PÁGINA:
${diffItems.map(item => `
[Página ${item.page}]
- ANTES (${item.oldCount}): ${item.oldText}
+ DESPUÉS (+${item.newCount}): ${item.newText}
-----------------------------------------`).join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Reporte_Comparacion_${file1?.name || 'PDF'}.txt`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
    toast.success(isEs ? 'Reporte de comparación descargado exitosamente' : 'Comparison report downloaded successfully');
  };

  const filteredDiffs = diffItems.filter(item => 
    item.oldText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.newText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initial View when files aren't uploaded yet
  if (!file1 || !file2) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 font-sans">
        <input type="file" accept=".pdf" className="hidden" ref={file1InputRef} onChange={handleFile1Change} />
        <input type="file" accept=".pdf" className="hidden" ref={file2InputRef} onChange={handleFile2Change} />

        <div className="text-center flex flex-col items-center gap-3">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-white/10 shadow-2xl">
            <GitCompare className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isEs ? 'Comparar 2 Archivos PDF' : 'Compare 2 PDF Files'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
            {isEs ? 'Detecta visual y semánticamente las diferencias, cambios y ediciones entre dos versiones de un documento.' : 'Detect visual and semantic differences, edits, and changes between two document versions.'}
          </p>

          <button 
            onClick={loadSampleComparison} 
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-xs text-zinc-300 rounded-full font-mono transition-all cursor-pointer mt-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? '⚡ Probar con documentos de muestra' : '⚡ Try with sample documents'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Dropzone 1 */}
          <div
            onClick={() => file1InputRef.current?.click()}
            className={`bg-[#09090b] border-2 ${file1 ? 'border-white' : 'border-dashed border-white/10 hover:border-white/30'} rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px] group shadow-2xl`}
          >
            {file1 ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <FileText className="w-12 h-12 text-white" />
                <span className="text-white font-bold text-sm truncate max-w-[220px]">{file1.name}</span>
                <span className="text-emerald-400 text-xs font-mono font-semibold">{isEs ? '✓ Documento 1 Listo' : '✓ Document 1 Ready'}</span>
              </div>
            ) : (
              <>
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors">
                  <FilePlus className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-bold text-base">{isEs ? '1. PDF Original (Antes)' : '1. Original PDF (Before)'}</h3>
                  <p className="text-zinc-400 text-xs font-mono mt-1">{isEs ? 'Haz clic o arrastra el primer archivo' : 'Click or drag the first file'}</p>
                </div>
                <span className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold mt-2">{isEs ? 'Seleccionar PDF 1' : 'Select PDF 1'}</span>
              </>
            )}
          </div>

          {/* Dropzone 2 */}
          <div
            onClick={() => file2InputRef.current?.click()}
            className={`bg-[#09090b] border-2 ${file2 ? 'border-white' : 'border-dashed border-white/10 hover:border-white/30'} rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px] group shadow-2xl`}
          >
            {file2 ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <FileText className="w-12 h-12 text-white" />
                <span className="text-white font-bold text-sm truncate max-w-[220px]">{file2.name}</span>
                <span className="text-emerald-400 text-xs font-mono font-semibold">{isEs ? '✓ Documento 2 Listo' : '✓ Document 2 Ready'}</span>
              </div>
            ) : (
              <>
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors">
                  <FilePlus className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-bold text-base">{isEs ? '2. PDF Modificado (Después)' : '2. Modified PDF (After)'}</h3>
                  <p className="text-zinc-400 text-xs font-mono mt-1">{isEs ? 'Haz clic o arrastra el segundo archivo' : 'Click or drag the second file'}</p>
                </div>
                <span className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold mt-2">{isEs ? 'Seleccionar PDF 2' : 'Select PDF 2'}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-zinc-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Procesamiento 100% Local • Tus archivos no tocan servidores' : '100% Local Processing • Files never leave your browser'}</span>
        </div>
      </div>
    );
  }

  // Active Comparison Workspace View
  return (
    <div className="w-full flex flex-col gap-4 font-sans">
      {/* Top Toolbar */}
      <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 p-2 rounded-xl border border-white/10 text-white">
            <GitCompare className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white font-bold truncate max-w-[150px] sm:max-w-[200px]">{file1.name}</span>
            <span className="text-zinc-500">VS</span>
            <span className="text-white font-bold truncate max-w-[150px] sm:max-w-[200px]">{file2.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll Sync Button */}
          <button
            onClick={() => setScrollSync(!scrollSync)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer ${
              scrollSync 
                ? 'bg-zinc-900 border-white text-white font-bold' 
                : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{isEs ? 'Sincronizar Scroll' : 'Scroll Sync'}</span>
            <span className={`w-2 h-2 rounded-full ${scrollSync ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </button>

          {/* Reset / Change files button */}
          <button
            onClick={resetComparator}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-red-500/50 text-xs text-zinc-300 hover:text-red-400 rounded-full transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isEs ? 'Cambiar PDFs' : 'Change PDFs'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left & Middle Viewports Column (8 Cols) */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Viewport 1 (Original PDF) */}
            <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[650px] shadow-2xl">
              {/* Header */}
              <div className="bg-zinc-900 border-b border-white/10 px-4 py-2.5 flex justify-between items-center font-mono">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  {isEs ? 'ORIGINAL' : 'ORIGINAL'}
                </span>
                <span className="text-xs text-zinc-400 truncate max-w-[180px]">{file1.name}</span>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center">
                <div className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[580px] relative font-serif text-xs leading-relaxed select-text">
                  <div className="absolute top-4 left-6 text-xl font-bold text-red-500 font-sans">5</div>

                  <h2 className="text-sm font-bold text-black mb-3 font-sans border-b pb-1 mt-6">
                    GESTIÓN DEL <mark className="bg-red-200 text-red-900 px-1 rounded font-bold">ALCANCE</mark> DEL PROYECTO
                  </h2>

                  <p className="mb-3 text-[11px] text-gray-800 leading-normal">
                    La Gestión del Alcance del Proyecto incluye los procesos <mark className="bg-red-200 text-red-900 px-1 rounded">requeridos para garantizar</mark> que el proyecto incluya todo el trabajo requerido, y únicamente el trabajo requerido, para completar el proyecto con éxito.
                  </p>

                  <div className="bg-red-50 border-l-2 border-red-400 p-2.5 mb-3 text-[10px] text-red-900 rounded font-sans">
                    <strong>Los procesos de Gestión del Alcance del Proyecto son:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li><mark className="bg-red-200">5.1 Planificar la Gestión del Alcance</mark> — Es el proceso de crear un plan de gestión del alcance.</li>
                      <li><mark className="bg-red-200">5.2 Recopilar Requisitos</mark> — Es el proceso de determinar, documentar y gestionar las necesidades.</li>
                      <li><mark className="bg-red-200">5.3 Definir el Alcance</mark> — Es el proceso de desarrollar una descripción detallada.</li>
                      <li><mark className="bg-red-200">5.4 Crear la EDT/WBS</mark> — Es el proceso de subdividir los entregables.</li>
                    </ul>
                  </div>

                  <div className="mt-8 text-[9px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                    <span>Guía PMBOK®</span>
                    <span>Pág. 1</span>
                  </div>
                </div>
              </div>

              {/* Bottom Viewer Toolbar */}
              <div className="bg-zinc-900 border-t border-white/10 px-4 py-2 flex items-center justify-between font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                  <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
                </div>
                <span className="truncate max-w-[120px] text-[11px]">{file1.name}</span>
                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-white">0005.pdf</span>
              </div>
            </div>

            {/* Viewport 2 (Modified PDF) */}
            <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[650px] shadow-2xl">
              {/* Header */}
              <div className="bg-zinc-900 border-b border-white/10 px-4 py-2.5 flex justify-between items-center font-mono">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isEs ? 'MODIFICADO' : 'MODIFIED'}
                </span>
                <span className="text-xs text-zinc-400 truncate max-w-[180px]">{file2.name}</span>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center">
                <div className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[580px] relative font-serif text-xs leading-relaxed select-text">
                  <div className="absolute top-4 left-6 text-xl font-bold text-emerald-600 font-sans">4</div>

                  <h2 className="text-sm font-bold text-black mb-3 font-sans border-b pb-1 mt-6">
                    GESTIÓN DE <mark className="bg-emerald-200 text-emerald-900 px-1 rounded font-bold">LA INTEGRACIÓN</mark> DEL PROYECTO
                  </h2>

                  <p className="mb-3 text-[11px] text-gray-800 leading-normal">
                    La Gestión de la Integración del Proyecto incluye los procesos <mark className="bg-emerald-200 text-emerald-900 px-1 rounded">y actividades para identificar, definir, combinar</mark> y coordinar los diversos procesos y actividades de dirección de proyectos.
                  </p>

                  <div className="bg-emerald-50 border-l-2 border-emerald-400 p-2.5 mb-3 text-[10px] text-emerald-900 rounded font-sans">
                    <strong>La Gestión de la Integración del Proyecto incluye:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li><mark className="bg-emerald-200">◆ Asignación de recursos.</mark></li>
                      <li><mark className="bg-emerald-200">◆ Equilibrio de demandas que compiten entre sí.</mark></li>
                      <li><mark className="bg-emerald-200">◆ Examen de enfoques alternativos.</mark></li>
                      <li><mark className="bg-emerald-200">◆ Adaptación de los procesos para cumplir con los objetivos.</mark></li>
                    </ul>
                  </div>

                  <div className="mt-8 text-[9px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                    <span>Guía PMBOK®</span>
                    <span className="text-emerald-700 font-bold">69</span>
                  </div>
                </div>
              </div>

              {/* Bottom Viewer Toolbar */}
              <div className="bg-zinc-900 border-t border-white/10 px-4 py-2 flex items-center justify-between font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                  <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
                </div>
                <span className="truncate max-w-[120px] text-[11px]">{file2.name}</span>
                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-white">0004.pdf</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar Control & Report Panel (4 Cols) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4 h-full">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-2xl min-h-[650px]">
            
            <div>
              {/* Header Title */}
              <h3 className="text-xl font-bold text-white mb-4 font-sans tracking-tight">
                {isEs ? 'Compare PDF' : 'Compare PDF'}
              </h3>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-white/10 mb-4 font-mono text-xs">
                <button
                  onClick={() => setCompareMode('semantic')}
                  className={`py-2.5 px-3 rounded-lg flex flex-col items-center gap-1 font-semibold transition-all cursor-pointer ${
                    compareMode === 'semantic'
                      ? 'bg-[#09090b] text-white border border-white/20 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isEs ? 'Texto Semántico' : 'Semantic Text'}</span>
                </button>

                <button
                  onClick={() => setCompareMode('overlay')}
                  className={`py-2.5 px-3 rounded-lg flex flex-col items-center gap-1 font-semibold transition-all cursor-pointer ${
                    compareMode === 'overlay'
                      ? 'bg-[#09090b] text-white border border-white/20 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{isEs ? 'Superposición' : 'Content Overlay'}</span>
                </button>
              </div>

              {/* Mode Description Box */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3.5 mb-5">
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {compareMode === 'semantic'
                    ? (isEs ? 'Compara las modificaciones de texto y contenido entre los dos archivos PDF.' : 'Compare text changes and edits between two PDF files.')
                    : (isEs ? 'Superpone las capas de ambos documentos para resaltar diferencias gráficas y de maquetación.' : 'Overlays visual layers of both documents to highlight layout and graphic differences.')
                  }
                </p>
              </div>

              {/* Search Box */}
              <div className="relative mb-5 font-mono">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEs ? 'Buscar texto en el reporte...' : 'Search text'}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Change Report List */}
              <div className="flex flex-col gap-3 max-h-[290px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">
                    {isEs ? `Reporte de Cambios (${filteredDiffs.length})` : `Change report (${filteredDiffs.length})`}
                  </span>
                  <span className="text-zinc-500 text-[11px]">Pág 1</span>
                </div>

                {filteredDiffs.map((item) => (
                  <div key={item.id} className="bg-zinc-900/80 border border-white/10 hover:border-white/30 rounded-xl p-3 flex flex-col gap-2 transition-all">
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                      <span className="font-bold text-zinc-300">Página {item.page}</span>
                      <span className="uppercase font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{item.type}</span>
                    </div>

                    {/* Old text block */}
                    <div className="bg-red-950/30 border border-red-500/20 p-2 rounded-lg flex justify-between items-start gap-2">
                      <p className="text-[11px] text-red-200 font-sans leading-tight line-clamp-2">
                        {item.oldText}
                      </p>
                      <span className="text-xs font-mono font-bold text-red-400 flex-shrink-0 bg-red-900/50 px-1.5 py-0.5 rounded">
                        {item.oldCount}
                      </span>
                    </div>

                    {/* New text block */}
                    <div className="bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg flex justify-between items-start gap-2">
                      <p className="text-[11px] text-emerald-200 font-sans leading-tight line-clamp-2">
                        {item.newText}
                      </p>
                      <span className="text-xs font-mono font-bold text-emerald-400 flex-shrink-0 bg-emerald-900/50 px-1.5 py-0.5 rounded">
                        +{item.newCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action Button (Model Primary Action Button) */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={downloadReport}
                className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl group"
              >
                <span>{isEs ? 'Descargar Reporte' : 'Download report'}</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
