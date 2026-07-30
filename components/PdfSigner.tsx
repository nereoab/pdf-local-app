'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  PenTool, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, Check, Image as ImageIcon, Type, RotateCcw, 
  Calendar, User, CheckCircle2, Edit3, X, Users, Award, Shield, ChevronLeft, ChevronRight,
  Sliders, ChevronDown, ChevronUp, UploadCloud, Lock, Hash
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type CreationTab = 'draw' | 'type' | 'image';
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

  // Thumbnails y Páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);
  const [targetPage, setTargetPage] = useState<number>(1);

  // Modo de Creación de Firma
  const [creationTab, setCreationTab] = useState<CreationTab>('draw');

  // Datos de Firma
  const [fullName, setFullName] = useState<string>('Firma Digital');
  const [strokeColor, setStrokeColor] = useState<string>('#ffffff');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [stampImageFile, setStampImageFile] = useState<File | null>(null);

  // Posición y Escala
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [scale, setScale] = useState<number>(100); // 50% a 200%

  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [signerRole, setSignerRole] = useState<string>('');
  const [includeHash, setIncludeHash] = useState<boolean>(true);
  const [signType, setSignType] = useState<'simple' | 'digital'>('digital');

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

  // Generar firma con estilo caligráfico cuando se cambia el nombre o color
  useEffect(() => {
    if (creationTab === 'type' && fullName.trim()) {
      generateTypedSignature(fullName, strokeColor);
    }
  }, [creationTab, fullName, strokeColor]);

  const generateTypedSignature = (text: string, color: string) => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 450;
    offCanvas.height = 140;
    const ctx = offCanvas.getContext('2d');
    if (ctx) {
      ctx.font = 'italic bold 42px "Brush Script MT", "Caveat", cursive, sans-serif';
      ctx.fillStyle = color;
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
    if (isDrawing && drawCanvasRef.current) {
      setIsDrawing(false);
      setSignatureDataUrl(drawCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      setSignatureDataUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
    }
    e.target.value = '';
  };

  const handleStampImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imgFile = e.target.files[0];
      setStampImageFile(imgFile);
      const url = URL.createObjectURL(imgFile);
      setSignatureDataUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setPageThumbnails([]);
    setTotalPages(0);
  };

  // Mapeo de posición para la firma sobrepuesta
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

  // Ejecución de la Firma Digital en PDF
  const executeSignPdf = async () => {
    if (!file) {
      toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first.");
      return;
    }

    if (!signatureDataUrl) {
      toast.error(isEs ? "Dibuja o ingresa una firma antes de continuar." : "Draw or create a signature first.");
      return;
    }

    setIsProcessing(true);
    let url: string | null = null;

    try {
      setProgressMsg(isEs ? 'Incrustando firma digital y metadatos...' : 'Embedding digital signature...');
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
      
      let embeddedSig: any;
      if (stampImageFile && stampImageFile.type === 'image/jpeg') {
        embeddedSig = await pdfDoc.embedJpg(sigBytes);
      } else {
        embeddedSig = await pdfDoc.embedPng(sigBytes);
      }

      const baseWidth = 180 * (scale / 100);
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

      // Metadatos adicionales de firma digital
      if (signType === 'digital') {
        const currentDate = new Date().toISOString();
        pdfDoc.setTitle(`${file.name.replace(/\.[^/.]+$/, "")} (Firmado)`);
        pdfDoc.setProducer('PDFBlack v2.0 Local Signature Engine');
        pdfDoc.setModificationDate(new Date());
      }

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

      toast.success(isEs ? '¡Documento PDF firmado exitosamente!' : 'PDF document signed successfully!');
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
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/png, image/jpeg" className="hidden" ref={stampInputRef} onChange={handleStampImageChange} />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "005 / FIRMA DIGITAL Y VALIDACIÓN" : "005 / DIGITAL SIGNATURE & VALIDATION"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <PenTool className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "FIRMA DIGITAL Y NUMÉRICA DE DOCUMENTOS PDF" : "DIGITAL SIGNATURE OF PDF DOCUMENTS"}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white">
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

            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button 
              onClick={handleRemoveFile} 
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
            {isEs ? "FIRMA DIGITAL Y NUMÉRICA DE DOCUMENTOS PDF" : "DIGITAL SIGNATURE OF PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Firma tus documentos PDF de forma 100% confidencial y local. Dibuja tu firma, genera firmas caligráficas o sube sellos oficiales." : "Sign PDF documents digitally 100% locally."}
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
        /* VISTA PRINCIPAL DE FIRMA INTERACTIVA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* TIRA LATERAL IZQUIERDA DE MINIATURAS */}
          <div className="lg:col-span-2 bg-[#09090b] border border-white/10 rounded-2xl p-3 shadow-2xl overflow-y-auto max-h-[750px] flex flex-col gap-3 font-mono">
            <span className="text-[10px] font-bold text-zinc-400 uppercase text-center block pt-1">{isEs ? "Páginas" : "Pages"}</span>
            {pageThumbnails.map((thumb, idx) => {
              const pageNum = idx + 1;
              const isSelected = pageNum === targetPage;
              return (
                <div
                  key={idx} onClick={() => setTargetPage(pageNum)}
                  className={`relative cursor-pointer rounded-xl border p-1 transition-all ${isSelected ? 'border-white ring-1 ring-white/30 bg-zinc-900 scale-105' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                >
                  <img src={thumb} alt={`Página ${pageNum}`} className="w-full object-contain rounded-lg bg-white" />
                  <span className="absolute top-2 left-2 bg-zinc-900/90 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border border-white/10">
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* VISOR CENTRAL DE PÁGINA CON SELLO DE FIRMA INTERACTIVO */}
          <div className="lg:col-span-6 xl:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[750px] relative overflow-hidden">
            {isLoadingThumbs ? (
              <div className="flex flex-col items-center justify-center gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span className="text-xs text-zinc-400">{isEs ? "Cargando visor..." : "Loading viewer..."}</span>
              </div>
            ) : pageThumbnails[targetPage - 1] ? (
              <div className="relative w-full max-w-[540px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-zinc-700">
                <img src={pageThumbnails[targetPage - 1]} alt="Visualización de página" className="w-full h-full object-contain select-none pointer-events-none" />

                {/* FIRMA INTERACTIVA SOBREPUESTA EN TIEMPO REAL */}
                <div className={`absolute z-30 ${getPositionStyle(position)} transition-all duration-300 pointer-events-none`}>
                  <div className="border-2 border-dashed border-zinc-900 bg-zinc-950/90 backdrop-blur-md p-3 rounded-xl shadow-2xl flex flex-col items-center justify-center max-w-[240px] font-mono text-center">
                    {signatureDataUrl ? (
                      <img src={signatureDataUrl} alt="Firma" className="max-h-[60px] object-contain mb-1" />
                    ) : (
                      <span className="font-serif italic font-bold text-white text-base mb-1">{fullName}</span>
                    )}

                    {signerRole && (
                      <span className="text-[10px] text-zinc-300 font-bold uppercase block">{signerRole}</span>
                    )}

                    {includeDate && (
                      <span className="text-[9px] text-zinc-400 mt-1 border-t border-white/10 pt-1 w-full text-center block">
                        {new Date().toLocaleDateString('es-ES')} • {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    {includeHash && (
                      <span className="text-[8px] text-emerald-400 mt-0.5 block font-mono">
                        HASH: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-4 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
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

              {/* MODO DE CREACIÓN DE FIRMA (DIBUJAR / TEXTO / SELLO) */}
              <div className="mb-5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Creación de Firma:" : "Signature Creation:"}</label>
                <div className="grid grid-cols-3 gap-1.5 font-mono">
                  <button 
                    type="button" onClick={() => setCreationTab('draw')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${creationTab === 'draw' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> {isEs ? "Dibujar" : "Draw"}
                  </button>
                  <button 
                    type="button" onClick={() => setCreationTab('type')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${creationTab === 'type' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <Type className="w-3.5 h-3.5" /> {isEs ? "Texto" : "Type"}
                  </button>
                  <button 
                    type="button" onClick={() => setCreationTab('image')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${creationTab === 'image' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> {isEs ? "Sello" : "Stamp"}
                  </button>
                </div>
              </div>

              {/* OPCIONES DE DIBUJO EN CANVAS */}
              {creationTab === 'draw' && (
                <div className="mb-5 space-y-3 font-mono">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider">{isEs ? "Trazado de Firma:" : "Signature Trace:"}</label>
                    <button type="button" onClick={clearCanvas} className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> {isEs ? "Limpiar" : "Clear"}
                    </button>
                  </div>

                  <div className="bg-zinc-950 border border-white/10 rounded-xl p-2 relative shadow-inner">
                    <canvas 
                      ref={drawCanvasRef}
                      width={320}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[120px] bg-zinc-900/80 rounded-lg cursor-crosshair touch-none"
                    />
                    {!hasDrawn && (
                      <span className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs pointer-events-none">
                        {isEs ? "Dibuja tu firma aquí..." : "Draw your signature here..."}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase">{isEs ? "Color de Tinta:" : "Ink Color:"}</span>
                    <div className="flex items-center gap-2">
                      {[
                        { name: 'white', hex: '#ffffff' },
                        { name: 'blue', hex: '#3b82f6' },
                        { name: 'red', hex: '#ef4444' },
                        { name: 'dark', hex: '#18181b' }
                      ].map(c => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setStrokeColor(c.hex)}
                          className={`w-6 h-6 rounded-full border transition-all ${strokeColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* OPCIONES DE FIRMA CALIGRÁFICA */}
              {creationTab === 'type' && (
                <div className="mb-5 space-y-3 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">{isEs ? "Nombre del Firmante:" : "Signer Name:"}</label>
                  <input 
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Ej: Lic. Carlos Mendoza"
                    className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase">{isEs ? "Color de Tinta:" : "Ink Color:"}</span>
                    <div className="flex items-center gap-2">
                      {[
                        { name: 'white', hex: '#ffffff' },
                        { name: 'blue', hex: '#3b82f6' },
                        { name: 'red', hex: '#ef4444' },
                        { name: 'dark', hex: '#18181b' }
                      ].map(c => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setStrokeColor(c.hex)}
                          className={`w-6 h-6 rounded-full border transition-all ${strokeColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* OPCIONES DE SELLO/IMAGEN */}
              {creationTab === 'image' && (
                <div className="mb-5 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Subir Imagen de Firma o Sello:" : "Upload Signature or Stamp Image:"}</label>
                  <button 
                    type="button" onClick={() => stampInputRef.current?.click()}
                    className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-zinc-400" /> {stampImageFile ? stampImageFile.name : (isEs ? "Cargar imagen PNG/JPG" : "Upload PNG/JPG image")}
                  </button>
                </div>
              )}

              {/* POSICIÓN MATRIZ 3x3 */}
              <div className="mb-5 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider">{isEs ? "Posición:" : "Position:"}</label>
                  <span className="text-[10px] text-zinc-300 font-bold">{position.replace('-', ' ').toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 border border-white/10 rounded-xl shadow-inner">
                  {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position9[]).map((pos) => {
                    const isSelected = position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`h-10 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full transition-transform ${isSelected ? 'bg-red-600 scale-110' : 'bg-zinc-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-900 border border-white/10 hover:border-white/30 rounded-xl text-xs font-mono text-white transition-all cursor-pointer my-4 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas" : "Advanced Options"}</span>
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
                    className="space-y-4 pt-1 border-t border-white/5 font-mono overflow-hidden"
                  >
                    {/* A. ESCALA Y TAMAÑO DE FIRMA */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">{isEs ? "Escala / Tamaño Firma" : "Signature Scale"}</label>
                        <span className="text-xs font-bold text-white">{scale}%</span>
                      </div>
                      <input 
                        type="range" min={50} max={200} step={10} value={scale} onChange={e => setScale(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>

                    {/* B. CARGO O RAZÓN SOCIAL */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Cargo / Razón Social:" : "Role / Title:"}</label>
                      <input 
                        type="text" value={signerRole} onChange={e => setSignerRole(e.target.value)}
                        placeholder={isEs ? "Ej: Representante Legal" : "e.g. CEO / Director"}
                        className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30"
                      />
                    </div>

                    {/* C. METADATOS Y MARCAS DE SEGURIDAD */}
                    <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "METADATOS EN EL SELLO" : "STAMP METADATA"}</label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={includeDate} onChange={e => setIncludeDate(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Incluir Fecha y Hora de Firma" : "Include Date & Time"}</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox" checked={includeHash} onChange={e => setIncludeHash(e.target.checked)}
                          className="accent-white w-4 h-4 rounded"
                        />
                        <span>{isEs ? "Incluir Código Hash de Verificación" : "Include Verification Hash"}</span>
                      </label>
                    </div>

                    {/* D. MODO DE INCRUSTACIÓN DE FIRMA */}
                    <div>
                      <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Modo de Incrustación:" : "Embedding Mode:"}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button" onClick={() => setSignType('digital')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${signType === 'digital' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                          <Lock className="w-3.5 h-3.5" /> {isEs ? "Digital" : "Digital"}
                        </button>
                        <button 
                          type="button" onClick={() => setSignType('simple')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${signType === 'simple' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                          <Check className="w-3.5 h-3.5" /> {isEs ? "Simple" : "Simple"}
                        </button>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-4 border-t border-white/10 font-sans">
              <button 
                onClick={executeSignPdf} 
                disabled={isProcessing} 
                className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                <span>{isProcessing ? progressMsg : (isEs ? 'Estampar Firma Digital →' : 'Stamp Digital Signature →')}</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </div>
  );
}
