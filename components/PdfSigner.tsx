'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  PenTool, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, Check, Image as ImageIcon, Type, RotateCcw, 
  Calendar, User, CheckCircle2, Edit3, X, Users, Award, Shield, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';

type SignType = 'simple' | 'digital';
type DetailsTab = 'signature' | 'initials' | 'stamp';
type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export default function PdfSigner() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Modales Estilo iLovePDF
  const [showWhoModal, setShowWhoModal] = useState<boolean>(true); // Captura 1: ¿Quién firmará?
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false); // Captura 3: Detalle de Firma

  // Thumbnails y Páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);
  const [targetPage, setTargetPage] = useState<number>(1);

  // Opciones de Firma
  const [signType, setSignType] = useState<SignType>('simple');
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('signature');
  
  // Datos de Firma (Modal Captura 3)
  const [fullName, setFullName] = useState<string>('BUDDHA MUSIC');
  const [initials, setInitials] = useState<string>('BM');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');

  // Firma generada / guardada
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [stampImage, setStampImage] = useState<File | null>(null);

  // Opciones de Campos
  const [includeInitials, setIncludeInitials] = useState<boolean>(false);
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [scale, setScale] = useState<number>(100);

  // Canvas de Dibujo
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  // Generar firma por defecto en texto al iniciar
  useEffect(() => {
    if (!signatureDataUrl && fullName) {
      generateTypedSignature(fullName);
    }
  }, [fullName, signatureDataUrl]);

  // Carga de Miniaturas PDF mediante pdfjs-dist
  useEffect(() => {
    if (!file) {
      setPageThumbnails([]);
      setTotalPages(0);
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
        setTargetPage(1);

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

  // Generar firma con estilo caligráfico
  const generateTypedSignature = (text: string) => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 450;
    offCanvas.height = 140;
    const ctx = offCanvas.getContext('2d');
    if (ctx) {
      ctx.font = 'italic bold 44px "Brush Script MT", "Caveat", cursive, sans-serif';
      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 225, 70);
    }
    setSignatureDataUrl(offCanvas.toDataURL('image/png'));
  };

  // Manejo de Dibujo en Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Aplicar cambios del Modal "Set your signature details" (Captura 3)
  const applySignatureDetails = () => {
    if (detailsTab === 'signature') {
      if (hasDrawn && drawCanvasRef.current) {
        setSignatureDataUrl(drawCanvasRef.current.toDataURL('image/png'));
      } else if (fullName.trim()) {
        generateTypedSignature(fullName);
      }
    }
    setShowDetailsModal(false);
    toast.success(isEs ? "Firma configurada correctamente." : "Signature set successfully.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setShowWhoModal(true);
    }
    e.target.value = '';
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStampImage(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
  };

  // Mapeo visual del stamp sobre el visor principal de PDF
  const getPositionStyle = (pos: Position9) => {
    switch (pos) {
      case 'top-left': return 'top-6 left-6';
      case 'top-center': return 'top-6 left-1/2 -translate-x-1/2';
      case 'top-right': return 'top-6 right-6';
      case 'center-left': return 'top-1/2 -translate-y-1/2 left-6';
      case 'center': return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
      case 'center-right': return 'top-1/2 -translate-y-1/2 right-6';
      case 'bottom-left': return 'bottom-6 left-6';
      case 'bottom-center': return 'bottom-6 left-1/2 -translate-x-1/2';
      case 'bottom-right': return 'bottom-6 right-6';
      default: return 'bottom-6 right-6';
    }
  };

  // Ejecución de la Firma en PDF
  const executeSignPdf = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first.");
      return;
    }

    if (!signatureDataUrl) {
      toast.error(isEs ? "Configura tu firma antes de estampar." : "Configure your signature first.");
      return;
    }

    setIsProcessing(true);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Incrustando firma digital en el documento...' : 'Embedding digital signature...');
      await new Promise(r => setTimeout(r, 10));

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      const pageIdx = Math.max(0, Math.min(pages.length - 1, targetPage - 1));
      const page = pages[pageIdx];
      const { width, height } = page.getSize();

      const sigRes = await fetch(signatureDataUrl);
      const sigBlob = await sigRes.blob();
      const sigBytes = new Uint8Array(await sigBlob.arrayBuffer());
      const embeddedSig = await pdfDoc.embedPng(sigBytes);

      const baseWidth = 185 * (scale / 100);
      const baseHeight = (embeddedSig.height / embeddedSig.width) * baseWidth;

      let x = width - baseWidth - 40;
      let y = 40;

      switch (position) {
        case 'top-left': x = 40; y = height - baseHeight - 40; break;
        case 'top-center': x = (width / 2) - (baseWidth / 2); y = height - baseHeight - 40; break;
        case 'top-right': x = width - baseWidth - 40; y = height - baseHeight - 40; break;
        case 'center-left': x = 40; y = (height / 2) - (baseHeight / 2); break;
        case 'center': x = (width / 2) - (baseWidth / 2); y = (height / 2) - (baseHeight / 2); break;
        case 'center-right': x = width - baseWidth - 40; y = (height / 2) - (baseHeight / 2); break;
        case 'bottom-left': x = 40; y = 40; break;
        case 'bottom-center': x = (width / 2) - (baseWidth / 2); y = 40; break;
        case 'bottom-right': x = width - baseWidth - 40; y = 40; break;
      }

      page.drawImage(embeddedSig, {
        x,
        y,
        width: baseWidth,
        height: baseHeight,
      });

      setProgressMsg(isEs ? 'Guardando PDF firmado...' : 'Saving signed PDF...');
      await new Promise(r => setTimeout(r, 10));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_Firmado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Documento PDF firmado y descargado exitosamente!' : 'PDF document signed successfully!');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Error al firmar el PDF.' : 'Failed to sign PDF.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" ref={stampInputRef} onChange={handleStampChange} />

      {/* HEADER SUPERIOR CON NAVEGACIÓN DE PÁGINAS Y ARCHIVO */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
            <ArrowLeft className="w-4 h-4" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="h-5 w-px bg-white/10" />

          {file && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
              <button 
                onClick={() => setTargetPage(prev => Math.max(1, prev - 1))}
                className="p-1 hover:bg-white/10 rounded transition-all disabled:opacity-30" disabled={targetPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{targetPage} / {totalPages || 1}</span>
              <button 
                onClick={() => setTargetPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 hover:bg-white/10 rounded transition-all disabled:opacity-30" disabled={targetPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-purple-500/30 px-4 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-white font-extrabold text-xs truncate max-w-[180px] sm:max-w-[280px]">{file.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all" title={isEs ? "Quitar archivo" : "Remove file"}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        <div className="flex-1 border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-3xl p-16 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] min-h-[500px]">
          <div className="bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 p-6 rounded-full border border-purple-500/30 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <PenTool className="w-16 h-16 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{isEs ? "Arrastra tu PDF para firmar" : "Drop your PDF to sign"}</h2>
          <p className="text-slate-400 text-sm mb-8 text-center max-w-md">{isEs ? "Firma digitalmente con firma simple o digital de forma 100% confidencial." : "Sign PDF documents digitally 100% locally."}</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-300 hover:to-indigo-300 text-slate-950 px-10 py-4 rounded-full font-black text-sm transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5 text-slate-950" /> {isEs ? "Seleccionar Archivo PDF" : "Select PDF File"}
          </button>
        </div>
      ) : (
        /* VISTA PRINCIPAL ILOVEPDF: TIRA LATERAL IZQUIERDA + VISOR CENTRAL + OPCIONES DERECHA */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* TIRA DE MINIATURAS A LA IZQUIERDA (Captura 2) */}
          <div className="lg:col-span-2 bg-slate-950/80 border border-white/10 rounded-3xl p-3 shadow-2xl overflow-y-auto max-h-[750px] flex flex-col gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase text-center block pt-1">{isEs ? "Páginas" : "Pages"}</span>
            {pageThumbnails.map((thumb, idx) => {
              const pageNum = idx + 1;
              const isSelected = pageNum === targetPage;
              return (
                <div
                  key={idx} onClick={() => setTargetPage(pageNum)}
                  className={`relative cursor-pointer rounded-2xl border-2 p-1 transition-all ${isSelected ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'}`}
                >
                  <img src={thumb} alt={`Página ${pageNum}`} className="w-full object-contain rounded-xl bg-white" />
                  <span className="absolute top-2 left-2 bg-slate-950/90 text-white font-black text-[9px] px-1.5 py-0.5 rounded border border-white/10">
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* VISOR CENTRAL DE LA PÁGINA CON LA FIRMA SOBREPUESTA INTERACTIVA */}
          <div className="lg:col-span-6 bg-slate-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[750px] relative overflow-hidden">
            {isLoadingThumbs ? (
              <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            ) : pageThumbnails[targetPage - 1] ? (
              <div className="relative w-full max-w-[560px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-slate-700">
                <img src={pageThumbnails[targetPage - 1]} alt="Visualización de página" className="w-full h-full object-contain select-none pointer-events-none" />

                {/* STAMP DE FIRMA INTERACTIVO SOBREPUESTO */}
                <div className={`absolute z-30 ${getPositionStyle(position)} transition-all duration-300 pointer-events-none`}>
                  <div className="border-2 border-dashed border-red-500 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center max-w-[220px]">
                    {signatureDataUrl ? (
                      <img src={signatureDataUrl} alt="Firma" className="max-h-[65px] object-contain" />
                    ) : (
                      <span className="font-serif italic font-black text-slate-900 text-lg">{fullName}</span>
                    )}
                    {includeDate && (
                      <span className="text-[9px] font-bold text-slate-500 mt-1 border-t border-slate-300 pt-0.5 w-full text-center">
                        {new Date().toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* BARRA LATERAL DERECHA (Signing Options - Captura 2) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-5 pb-3 border-b border-white/10 flex items-center justify-between">
                <span>{isEs ? "Opciones de Firma" : "Signing options"}</span>
                <PenTool className="w-5 h-5 text-purple-400" />
              </h2>

              {/* TIPO DE FIRMA (Captura 2) */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Tipo de Firma:" : "Type:"}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" onClick={() => setSignType('simple')}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${signType === 'simple' ? 'border-red-500 bg-red-500/10 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-800 bg-slate-900 text-slate-400'}`}
                  >
                    <Edit3 className="w-5 h-5 text-red-400" />
                    <span className="text-xs font-black">{isEs ? "Firma Simple" : "Simple Signature"}</span>
                  </button>
                  <button 
                    type="button" onClick={() => setSignType('digital')}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${signType === 'digital' ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800 bg-slate-900 text-slate-400'}`}
                  >
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black">{isEs ? "Firma Digital" : "Digital Signature"}</span>
                  </button>
                </div>
              </div>

              {/* CAMPOS OBLIGATORIOS / REQUIRED FIELDS (Captura 2) */}
              <div className="mb-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">{isEs ? "Campos requeridos:" : "Required fields:"}</label>
                <div className="bg-slate-900 border border-purple-500/40 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-purple-500/20 p-2 rounded-xl text-purple-300">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Signature</span>
                      <span className="font-serif italic font-extrabold text-sm text-purple-300 truncate">{fullName}</span>
                    </div>
                  </div>
                  <button 
                    type="button" onClick={() => setShowDetailsModal(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
                    title={isEs ? "Editar Firma" : "Edit Signature"}
                  >
                    <Edit3 className="w-4 h-4 text-purple-300" />
                  </button>
                </div>
              </div>

              {/* CAMPOS OPCIONALES / OPTIONAL FIELDS (Captura 2) */}
              <div className="mb-5 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">{isEs ? "Campos opcionales:" : "Optional fields:"}</label>
                
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>{isEs ? "Iniciales (" + initials + ")" : "Initials (" + initials + ")"}</span>
                  </div>
                  <input type="checkbox" checked={includeInitials} onChange={e => setIncludeInitials(e.target.checked)} className="accent-purple-400 w-4 h-4 rounded" />
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>{isEs ? "Fecha de firma" : "Date"}</span>
                  </div>
                  <input type="checkbox" checked={includeDate} onChange={e => setIncludeDate(e.target.checked)} className="accent-purple-400 w-4 h-4 rounded" />
                </div>
              </div>

              {/* POSICIÓN 3x3 */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isEs ? "Posición:" : "Position:"}</label>
                  <span className="text-[10px] font-bold text-purple-400">{position.replace('-', ' ').toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
                  {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position9[]).map((pos) => {
                    const isSelected = position === pos;
                    return (
                      <button
                        key={pos} type="button" onClick={() => setPosition(pos)}
                        className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full transition-transform ${isSelected ? 'bg-red-500 border-2 border-white scale-125' : 'bg-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN (Captura 2) */}
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={executeSignPdf} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-500 via-rose-500 to-purple-500 hover:from-red-400 hover:to-purple-400 text-white py-4 rounded-2xl font-black text-base transition-all shadow-[0_0_35px_rgba(239,68,68,0.5)] hover:shadow-[0_0_45px_rgba(239,68,68,0.7)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-white" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Firmar →' : 'Sign →')}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: ¿QUIÉN FIRMARÁ ESTE DOCUMENTO? (Captura 1) */}
      {showWhoModal && file && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-8 max-w-2xl w-full shadow-2xl text-center relative overflow-hidden">
            <h3 className="text-2xl font-black text-white mb-2">{isEs ? "¿Quién firmará este documento?" : "Who will sign this document?"}</h3>
            <p className="text-slate-400 text-xs mb-8">{isEs ? "Selecciona la modalidad de firma para continuar." : "Select signing mode to continue."}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Opción 1: Solo yo */}
              <div 
                onClick={() => setShowWhoModal(false)}
                className="bg-slate-950 border-2 border-purple-500/30 hover:border-purple-400 p-6 rounded-2xl flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-105 shadow-xl group"
              >
                <div className="bg-purple-500/20 p-4 rounded-full mb-4 group-hover:bg-purple-500/30 transition-all">
                  <PenTool className="w-10 h-10 text-purple-400" />
                </div>
                <button type="button" className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md">
                  {isEs ? "Solo yo" : "Only me"}
                </button>
                <span className="text-[10px] text-slate-400 mt-2">{isEs ? "Firmar este documento" : "Sign this document"}</span>
              </div>

              {/* Opción 2: Varias personas */}
              <div 
                onClick={() => { setShowWhoModal(false); toast.info(isEs ? "Modo de invitación a terceros activado." : "Invitation mode enabled."); }}
                className="bg-slate-950 border-2 border-slate-800 hover:border-slate-700 p-6 rounded-2xl flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-105 shadow-xl group opacity-85 hover:opacity-100"
              >
                <div className="bg-slate-800 p-4 rounded-full mb-4">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <button type="button" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all">
                  {isEs ? "Varias personas" : "Several people"}
                </button>
                <span className="text-[10px] text-slate-400 mt-2">{isEs ? "Invitar a otros a firmar" : "Invite others to sign"}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-slate-400 text-xs">
              <span>{isEs ? "Documento cargado:" : "Uploaded document:"} </span>
              <strong className="text-white">{file.name}</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURAR DETALLES DE FIRMA / SET YOUR SIGNATURE DETAILS (Captura 3) */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-8 max-w-xl w-full shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="text-xl font-black text-white">{isEs ? "Configurar detalles de firma" : "Set your signature details"}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INPUTS DE NOMBRE E INICIALES (Captura 3) */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{isEs ? "Nombre completo:" : "Full name:"}</label>
                <input 
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{isEs ? "Iniciales:" : "Initials:"}</label>
                <input 
                  type="text" value={initials} onChange={e => setInitials(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* TABS DE FIRMA / INICIALES / SELLO (Captura 3) */}
            <div className="flex border-b border-white/10 mb-6">
              <button 
                onClick={() => setDetailsTab('signature')}
                className={`flex-1 py-3 text-xs font-black border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${detailsTab === 'signature' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400'}`}
              >
                <PenTool className="w-4 h-4" /> {isEs ? "Firma" : "Signature"}
              </button>
              <button 
                onClick={() => setDetailsTab('initials')}
                className={`flex-1 py-3 text-xs font-black border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${detailsTab === 'initials' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400'}`}
              >
                <User className="w-4 h-4" /> {isEs ? "Iniciales" : "Initials"}
              </button>
              <button 
                onClick={() => setDetailsTab('stamp')}
                className={`flex-1 py-3 text-xs font-black border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${detailsTab === 'stamp' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400'}`}
              >
                <ImageIcon className="w-4 h-4" /> {isEs ? "Sello de Empresa" : "Company Stamp"}
              </button>
            </div>

            {/* CONTENIDO TAB FIRMA */}
            {detailsTab === 'signature' && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{isEs ? "Dibuja tu firma:" : "Draw signature:"}</span>
                  <button onClick={clearCanvas} className="text-[10px] text-red-400 font-extrabold flex items-center gap-1 hover:underline">
                    <RotateCcw className="w-3 h-3" /> {isEs ? "Limpiar" : "Clear"}
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-2 border-2 border-purple-500/40 shadow-inner flex items-center justify-center">
                  <canvas 
                    ref={drawCanvasRef} width={450} height={140}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    className="touch-none cursor-crosshair bg-white w-full h-[140px] rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* CONTENIDO TAB SELLO */}
            {detailsTab === 'stamp' && (
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center mb-6 bg-slate-950">
                <button 
                  type="button" onClick={() => stampInputRef.current?.click()}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-xl font-bold text-xs"
                >
                  {stampImage ? stampImage.name : (isEs ? "Cargar sello de empresa" : "Upload company stamp")}
                </button>
                <span className="text-[10px] text-slate-500 block mt-2">{isEs ? "Formatos aceptados: PNG, JPG, SVG" : "Accepted formats: PNG, JPG, SVG"}</span>
              </div>
            )}

            {/* ACCIONES DEL MODAL (Captura 3) */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </button>
              <button 
                onClick={applySignatureDetails}
                className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
              >
                {isEs ? "Aplicar" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
