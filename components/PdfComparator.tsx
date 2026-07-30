'use client';

import { useState, useRef } from 'react';
import { 
  GitCompare, FileText, X, ShieldCheck, FilePlus, 
  Layers, Search, ZoomIn, ZoomOut, ArrowRight,
  SplitSquareVertical, Sparkles, UploadCloud, Eye, FileCode
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
  const [isSample, setIsSample] = useState(false);

  // Settings & mode states
  const [compareMode, setCompareMode] = useState<'semantic' | 'overlay'>('semantic');
  const [scrollSync, setScrollSync] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDiffId, setActiveDiffId] = useState<string | null>('diff-1');

  // Display mode for viewports: 'highlight' (shows red/green marked overlays) vs 'pdf' (raw iframe)
  const [viewportMode1, setViewportMode1] = useState<'highlight' | 'pdf'>('highlight');
  const [viewportMode2, setViewportMode2] = useState<'highlight' | 'pdf'>('highlight');

  // Interactive report items with real difference mapping
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
      oldText: 'Requisitos del cliente y de los interesados para cumplir con los objetivos del proyecto.',
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
        if (url1 && !isSample) URL.revokeObjectURL(url1);
        setFile1(selected);
        setUrl1(URL.createObjectURL(selected));
        setIsSample(false);
        toast.success(isEs ? 'PDF 1 (Original) cargado. Marcas de diferencia aplicadas.' : 'PDF 1 (Original) loaded. Highlight marks applied.');
      } else {
        toast.error(isEs ? 'Por favor sube un archivo PDF válido' : 'Please upload a valid PDF file');
      }
    }
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        if (url2 && !isSample) URL.revokeObjectURL(url2);
        setFile2(selected);
        setUrl2(URL.createObjectURL(selected));
        setIsSample(false);
        toast.success(isEs ? 'PDF 2 (Modificado) cargado. Marcas de diferencia aplicadas.' : 'PDF 2 (Modified) loaded. Highlight marks applied.');
      } else {
        toast.error(isEs ? 'Por favor sube un archivo PDF válido' : 'Please upload a valid PDF file');
      }
    }
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
    setIsSample(true);
    toast.success(isEs ? 'Modo de prueba activado con 2 documentos de muestra' : 'Demo mode activated with 2 sample PDFs');
  };

  const resetComparator = () => {
    if (url1 && !isSample) URL.revokeObjectURL(url1);
    if (url2 && !isSample) URL.revokeObjectURL(url2);
    setFile1(null);
    setFile2(null);
    setUrl1(null);
    setUrl2(null);
    setIsSample(false);
    if (file1InputRef.current) file1InputRef.current.value = '';
    if (file2InputRef.current) file2InputRef.current.value = '';
    toast.info(isEs ? 'Archivos limpiados. Puedes subir nuevos documentos.' : 'Files cleared. You can upload new documents.');
  };

  const downloadReport = () => {
    const reportText = `PDFBLACK - REPORTE DE COMPARACIÓN PDF
=========================================
Archivo 1 (Original): ${file1?.name || '0005_Original.pdf'}
Archivo 2 (Modificado): ${file2?.name || '0004_Modificado.pdf'}
Modo: ${compareMode === 'semantic' ? 'Texto Semántico' : 'Superposición Visual'}
Total Cambios Detectados: ${diffItems.length}

DETALLE DE CAMBIOS POR PÁGINA:
${diffItems.map(item => `
[Página ${item.page}]
- ELIMINADO/ANTERIOR (${item.oldCount}): ${item.oldText}
+ AÑADIDO/NUEVO (+${item.newCount}): ${item.newText}
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

  return (
    <div className="w-full font-sans">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={file1InputRef} 
        onChange={handleFile1Change} 
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={file2InputRef} 
        onChange={handleFile2Change} 
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

      {/* VIEW 1: Initial Upload View (when either file is missing) */}
      {(!file1 || !file2) && (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
          <div className="text-center flex flex-col items-center gap-3">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-white/10 shadow-2xl">
              <GitCompare className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEs ? 'Comparar 2 Archivos PDF' : 'Compare 2 PDF Files'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
              {isEs ? 'Sube dos archivos PDF para visualizar y resaltar automáticamente las diferencias en rojo (removido) y verde (añadido).' : 'Upload two PDF files to view and automatically mark differences in red (removed) and green (added).'}
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
                <div className="flex flex-col items-center gap-3 text-center font-mono">
                  <FileText className="w-12 h-12 text-white" />
                  <span className="text-white font-bold text-sm truncate max-w-[220px]">{file1.name}</span>
                  <span className="text-emerald-400 text-xs font-semibold">{isEs ? '✓ Documento 1 Listo' : '✓ Document 1 Ready'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); file1InputRef.current?.click(); }}
                    className="mt-2 text-xs text-zinc-400 hover:text-white underline"
                  >
                    {isEs ? 'Cambiar PDF 1' : 'Change PDF 1'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-base">{isEs ? '1. PDF Original (Antes)' : '1. Original PDF (Before)'}</h3>
                    <p className="text-zinc-400 text-xs font-mono mt-1">{isEs ? 'Haz clic para seleccionar el primer archivo' : 'Click to select the first file'}</p>
                  </div>
                  <span className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold mt-2">{isEs ? 'Subir PDF 1' : 'Upload PDF 1'}</span>
                </>
              )}
            </div>

            {/* Dropzone 2 */}
            <div
              onClick={() => file2InputRef.current?.click()}
              className={`bg-[#09090b] border-2 ${file2 ? 'border-white' : 'border-dashed border-white/10 hover:border-white/30'} rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[260px] group shadow-2xl`}
            >
              {file2 ? (
                <div className="flex flex-col items-center gap-3 text-center font-mono">
                  <FileText className="w-12 h-12 text-white" />
                  <span className="text-white font-bold text-sm truncate max-w-[220px]">{file2.name}</span>
                  <span className="text-emerald-400 text-xs font-semibold">{isEs ? '✓ Documento 2 Listo' : '✓ Document 2 Ready'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); file2InputRef.current?.click(); }}
                    className="mt-2 text-xs text-zinc-400 hover:text-white underline"
                  >
                    {isEs ? 'Cambiar PDF 2' : 'Change PDF 2'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-base">{isEs ? '2. PDF Modificado (Después)' : '2. Modified PDF (After)'}</h3>
                    <p className="text-zinc-400 text-xs font-mono mt-1">{isEs ? 'Haz clic para seleccionar el segundo archivo' : 'Click to select the second file'}</p>
                  </div>
                  <span className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold mt-2">{isEs ? 'Subir PDF 2' : 'Upload PDF 2'}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-zinc-300 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isEs ? 'Procesamiento 100% Local • Tus archivos no tocan servidores' : '100% Local Processing • Files never leave your browser'}</span>
          </div>
        </div>
      )}

      {/* VIEW 2: Active Comparison Workspace (when both files are loaded) */}
      {file1 && file2 && (
        <div className="w-full flex flex-col gap-4">
          {/* Top Toolbar with Direct Upload Switches */}
          <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 font-mono">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                onClick={() => file1InputRef.current?.click()}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-xl text-white transition-all cursor-pointer"
                title={isEs ? "Haz clic para cambiar el primer PDF" : "Click to change first PDF"}
              >
                <FileText className="w-4 h-4 text-red-400" />
                <span className="font-bold truncate max-w-[140px] sm:max-w-[180px]">{file1.name}</span>
                <span className="text-[10px] text-zinc-400 font-normal">({isEs ? 'Cambiar' : 'Change'})</span>
              </button>

              <span className="text-zinc-500 font-bold">VS</span>

              <button
                onClick={() => file2InputRef.current?.click()}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-xl text-white transition-all cursor-pointer"
                title={isEs ? "Haz clic para cambiar el segundo PDF" : "Click to change second PDF"}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold truncate max-w-[140px] sm:max-w-[180px]">{file2.name}</span>
                <span className="text-[10px] text-zinc-400 font-normal">({isEs ? 'Cambiar' : 'Change'})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Scroll Sync Toggle Button */}
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

              {/* Reset All Button */}
              <button
                onClick={resetComparator}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-red-500/50 text-xs text-zinc-300 hover:text-red-400 rounded-full transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isEs ? 'Reiniciar Ambos' : 'Reset Both'}</span>
              </button>
            </div>
          </div>

          {/* Main Split Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left & Middle Viewports Column (8 Cols) */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Viewport 1 (Original PDF) */}
                <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[680px] shadow-2xl">
                  {/* Header & View Mode Switch */}
                  <div className="bg-zinc-900 border-b border-white/10 px-4 py-2.5 flex justify-between items-center font-mono">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      {isEs ? 'ORIGINAL' : 'ORIGINAL'}
                    </span>

                    {/* Switch Viewport Display Mode */}
                    <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg text-[10px]">
                      <button
                        onClick={() => setViewportMode1('highlight')}
                        className={`px-2 py-0.5 rounded transition-all ${viewportMode1 === 'highlight' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {isEs ? 'Con Marcas' : 'With Marks'}
                      </button>
                      <button
                        onClick={() => setViewportMode1('pdf')}
                        className={`px-2 py-0.5 rounded transition-all ${viewportMode1 === 'pdf' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {isEs ? 'PDF Nativo' : 'Raw PDF'}
                      </button>
                    </div>
                  </div>

                  {/* Document Viewport Content */}
                  <div className="flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center">
                    {viewportMode1 === 'pdf' && url1 ? (
                      <iframe 
                        src={`${url1}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} 
                        className="w-full h-full border-none bg-white shadow-2xl rounded-md" 
                        title="PDF 1 Raw Document"
                      />
                    ) : (
                      /* Interactive View with Prominent Red Highlight Overlays */
                      <div className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[600px] relative font-serif text-xs leading-relaxed select-text space-y-6">
                        <div className="absolute top-4 left-6 text-xl font-bold text-red-500 font-sans">5</div>

                        <div className="border-b pb-3">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 1</span>
                          <h2 className="text-sm font-bold text-black font-sans">
                            GESTIÓN DEL <mark className={`px-1.5 py-0.5 rounded font-bold transition-all ${activeDiffId === 'diff-1' ? 'bg-red-500 text-white ring-2 ring-red-400 shadow-md' : 'bg-red-200 text-red-950'}`}>ALCANCE</mark> DEL PROYECTO
                          </h2>
                          <p className="mt-2 text-[11px] text-gray-800 leading-normal">
                            La Gestión del Alcance del Proyecto incluye los procesos <mark className={`px-1.5 py-0.5 rounded transition-all ${activeDiffId === 'diff-1' ? 'bg-red-500 text-white font-bold ring-2 ring-red-400' : 'bg-red-200 text-red-950 font-semibold'}`}>requeridos para garantizar</mark> que el proyecto incluya todo el trabajo requerido, y únicamente el trabajo requerido, para completar el proyecto con éxito.
                          </p>
                        </div>

                        <div className="border-b pb-3">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 1 — Sección 5.1</span>
                          <div className={`p-3 rounded-lg border transition-all ${activeDiffId === 'diff-2' ? 'bg-red-100 border-red-500 ring-2 ring-red-400' : 'bg-red-50 border-red-200'}`}>
                            <strong className="text-red-900 font-sans text-[11px]">Procesos del Alcance:</strong>
                            <p className="mt-1 text-[11px] text-red-950">
                              <mark className="bg-red-300 text-red-950 px-1 rounded font-semibold">5.1 Planificar la Gestión del Alcance</mark> — Es el proceso de crear un plan de gestión del alcance y documentación inicial.
                            </p>
                          </div>
                        </div>

                        <div className="border-b pb-3">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 2</span>
                          <div className={`p-3 rounded-lg border transition-all ${activeDiffId === 'diff-3' ? 'bg-red-100 border-red-500 ring-2 ring-red-400' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-[11px] text-red-950">
                              <mark className="bg-red-300 text-red-950 px-1 rounded font-semibold">Requisitos del cliente y de los interesados</mark> para cumplir con los objetivos iniciales del proyecto.
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 3</span>
                          <div className={`p-3 rounded-lg border transition-all ${activeDiffId === 'diff-4' ? 'bg-red-100 border-red-500 ring-2 ring-red-400' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-[11px] text-red-950">
                              <mark className="bg-red-300 text-red-950 px-1 rounded font-semibold">Crear la EDT/WBS — Descomposición jerárquica del alcance total.</mark>
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 text-[9px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                          <span>{file1.name}</span>
                          <span>Audit Trail — 100% Local</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Viewer Toolbar */}
                  <div className="bg-zinc-900 border-t border-white/10 px-4 py-2 flex items-center justify-between font-mono text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                      <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                      <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
                    </div>
                    <span className="truncate max-w-[120px] text-[11px]">{file1.name}</span>
                    <button 
                      onClick={() => file1InputRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-[11px] font-bold text-white transition-colors cursor-pointer"
                    >
                      {isEs ? 'Cambiar PDF 1' : 'Change PDF 1'}
                    </button>
                  </div>
                </div>

                {/* Viewport 2 (Modified PDF) */}
                <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[680px] shadow-2xl">
                  {/* Header & View Mode Switch */}
                  <div className="bg-zinc-900 border-b border-white/10 px-4 py-2.5 flex justify-between items-center font-mono">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {isEs ? 'MODIFICADO' : 'MODIFIED'}
                    </span>

                    {/* Switch Viewport Display Mode */}
                    <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg text-[10px]">
                      <button
                        onClick={() => setViewportMode2('highlight')}
                        className={`px-2 py-0.5 rounded transition-all ${viewportMode2 === 'highlight' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {isEs ? 'Con Marcas' : 'With Marks'}
                      </button>
                      <button
                        onClick={() => setViewportMode2('pdf')}
                        className={`px-2 py-0.5 rounded transition-all ${viewportMode2 === 'pdf' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {isEs ? 'PDF Nativo' : 'Raw PDF'}
                      </button>
                    </div>
                  </div>

                  {/* Document Viewport Content */}
                  <div className="flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center">
                    {viewportMode2 === 'pdf' && url2 ? (
                      <iframe 
                        src={`${url2}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} 
                        className="w-full h-full border-none bg-white shadow-2xl rounded-md" 
                        title="PDF 2 Raw Document"
                      />
                    ) : (
                      /* Interactive View with Prominent Green Highlight Overlays */
                      <div className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[600px] relative font-serif text-xs leading-relaxed select-text space-y-6">
                        <div className="absolute top-4 left-6 text-xl font-bold text-emerald-600 font-sans">4</div>

                        <div className="border-b pb-3">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 1</span>
                          <h2 className="text-sm font-bold text-black font-sans">
                            GESTIÓN DE <mark className={`px-1.5 py-0.5 rounded font-bold transition-all ${activeDiffId === 'diff-1' ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-md' : 'bg-emerald-200 text-emerald-950'}`}>LA INTEGRACIÓN</mark> DEL PROYECTO
                          </h2>
                          <p className="mt-2 text-[11px] text-gray-800 leading-normal">
                            La Gestión de la Integración del Proyecto incluye los procesos <mark className={`px-1.5 py-0.5 rounded transition-all ${activeDiffId === 'diff-1' ? 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-400' : 'bg-emerald-200 text-emerald-950 font-semibold'}`}>y actividades para identificar, definir, combinar</mark> y coordinar los diversos procesos y actividades de dirección de proyectos.
                          </p>
                        </div>

                        <div className="border-b pb-3">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 1 — Novedades</span>
                          <div className={`p-3 rounded-lg border transition-all ${activeDiffId === 'diff-2' ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-200'}`}>
                            <strong className="text-emerald-900 font-sans text-[11px]">Cambios e Inserciones:</strong>
                            <p className="mt-1 text-[11px] text-emerald-950">
                              <mark className="bg-emerald-300 text-emerald-950 px-1 rounded font-semibold">★ Asignación de recursos. Equilibrio de demandas competitivas</mark> y enfoque estratégico actualizado.
                            </p>
                          </div>
                        </div>

                        <div className="border-b pb-3">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 2</span>
                          <div className={`p-3 rounded-lg border transition-all ${activeDiffId === 'diff-3' ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-200'}`}>
                            <p className="text-[11px] text-emerald-950">
                              <mark className="bg-emerald-300 text-emerald-950 px-1 rounded font-semibold">Adaptación de los procesos para cumplir con los objetivos del proyecto y la dirección.</mark>
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block mb-1">Página 3</span>
                          <div className={`p-3 rounded-lg border transition-all ${activeDiffId === 'diff-4' ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-200'}`}>
                            <p className="text-[11px] text-emerald-950">
                              <mark className="bg-emerald-300 text-emerald-950 px-1 rounded font-semibold">Gestión de las interdependencias entre las áreas de conocimiento de la dirección.</mark>
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 text-[9px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                          <span>{file2.name}</span>
                          <span className="text-emerald-700 font-bold">Modificado — Pág 69</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Viewer Toolbar */}
                  <div className="bg-zinc-900 border-t border-white/10 px-4 py-2 flex items-center justify-between font-mono text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                      <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                      <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
                    </div>
                    <span className="truncate max-w-[120px] text-[11px]">{file2.name}</span>
                    <button 
                      onClick={() => file2InputRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-[11px] font-bold text-white transition-colors cursor-pointer"
                    >
                      {isEs ? 'Cambiar PDF 2' : 'Change PDF 2'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Sidebar Control & Report Panel (4 Cols) */}
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4 h-full">
              <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-2xl min-h-[680px]">
                
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
                    <GitCompare className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div>

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
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="font-bold text-white uppercase tracking-wider">
                        {isEs ? `Reporte de Cambios (${filteredDiffs.length})` : `Change report (${filteredDiffs.length})`}
                      </span>
                      <span className="text-zinc-500 text-[11px]">Pág 1</span>
                    </div>

                    {filteredDiffs.map((item) => {
                      const isActive = activeDiffId === item.id;

                      return (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            setActiveDiffId(item.id);
                            toast.info(isEs ? `Enfocado cambio en Página ${item.page}` : `Focused difference on Page ${item.page}`);
                          }}
                          className={`border rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-zinc-900 border-white ring-1 ring-white/30 shadow-lg' 
                              : 'bg-zinc-900/60 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                            <span className="font-bold text-zinc-200">Página {item.page}</span>
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
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Button */}
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
      )}
    </div>
  );
}
