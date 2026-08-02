'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PenTool, Loader2, Settings2, ShieldCheck, Download, ArrowLeft, Sparkles, 
  FileText, Trash2, Plus, LayoutGrid, Check, Image as ImageIcon, Type, RotateCcw, 
  ChevronLeft, ChevronRight, Sliders, UploadCloud, Lock, Unlock, Move, FileLock2, Building2, BadgeCheck, Edit3, Layers, FileCheck
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SignWorkerMessageIn, SignWorkerMessageOut, Position9 } from '@/workers/pdf-sign.worker';
import DownloadSuccessCard from '@/components/DownloadSuccessCard';

type CreationTab = 'draw' | 'type' | 'image';
type FontStyleOption = 'cursive' | 'calligraphy' | 'formal' | 'modern' | 'serif';

export default function PdfSigner() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [completedResult, setCompletedResult] = useState<{
    downloadUrl: string;
    filename: string;
    fileSize?: string;
    outputFormat: 'pdf';
    rawBlob?: Blob;
  } | null>(null);

  // ENCRYPTION / PASSWORD STATE
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // ALCANCE DE PÁGINAS (PÁGINA ACTUAL VS TODAS LAS PÁGINAS)
  const [pageScope, setPageScope] = useState<'current' | 'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('1-5');

  // Thumbnails y Páginas
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);
  const [targetPage, setTargetPage] = useState<number>(1);

  // Modo de Creación de Firma
  const [creationTab, setCreationTab] = useState<CreationTab>('type');
  const [fontStyle, setFontStyle] = useState<FontStyleOption>('cursive');

  // Datos de Firma
  const [fullName, setFullName] = useState<string>('Nereo ANAYA BENITES');
  const [strokeColor, setStrokeColor] = useState<string>('#ef4444');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [stampImageFile, setStampImageFile] = useState<File | null>(null);

  // DUPLICIDAD DE NOMBRE: deshabilitado por defecto si es tipo 'Texto' para evitar repetición
  const [showPrintedName, setShowPrintedName] = useState<boolean>(false);

  // Posición y Escala
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [freeX, setFreeX] = useState<number>(85);
  const [freeY, setFreeY] = useState<number>(85);
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const [scale, setScale] = useState<number>(100);

  // Visor
  const [viewerHiResImage, setViewerHiResImage] = useState<string | null>(null);
  const sigOverlayRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Opciones Avanzadas
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Firmado');
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [signerRole, setSignerRole] = useState<string>('Ingeniero Civil');
  const [signerLocation, setSignerLocation] = useState<string>('');
  const [includeHash, setIncludeHash] = useState<boolean>(true);

  // METADATOS PERSONALIZADOS
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  // EMPRESARIAL: Certificado digital
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState<string>('');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [enterpriseMode, setEnterpriseMode] = useState<boolean>(false);
  const [certInfo, setCertInfo] = useState<any>(null);

  // Canvas de Dibujo
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Ajustar showPrintedName automáticamente según la pestaña de creación
  const handleTabChange = (tab: CreationTab) => {
    setCreationTab(tab);
    if (tab === 'type') {
      setShowPrintedName(false); // No duplicar el nombre
    } else {
      setShowPrintedName(true); // Imprimir el nombre en texto bajo la firma dibujada/imagen
    }
  };

  const loadThumbnails = useCallback(async (selectedFile: File, pass?: string) => {
    setIsLoadingThumbs(true);
    setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, "") + '_Firmado');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: buffer, password: pass });
      const pdfDoc = await loadingTask.promise;

      setTotalPages(pdfDoc.numPages);
      setTargetPage(1);

      const thumbs: string[] = [];
      const countToRender = Math.min(pdfDoc.numPages, 32);

      for (let i = 1; i <= countToRender; i++) {
        if (i % 4 === 0) await new Promise(r => setTimeout(r, 5));
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas } as any).promise;
          thumbs.push(canvas.toDataURL());
        }
      }

      for (let i = countToRender + 1; i <= pdfDoc.numPages; i++) {
        thumbs.push('');
      }

      setPageThumbnails(thumbs);
      setIsEncrypted(false);
      setIsUnlocked(true);
      toast.success(isEs ? `${pdfDoc.numPages} páginas listas para firma` : `${pdfDoc.numPages} pages ready for signature`);
    } catch (err: any) {
      if (err?.name === 'PasswordException' || err?.code === 1) {
        setIsEncrypted(true);
        setIsUnlocked(false);
        toast.warning(isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open');
      } else {
        console.error("Error al cargar miniaturas:", err);
        toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
      }
    } finally {
      setIsLoadingThumbs(false);
    }
  }, [isEs]);

  useEffect(() => {
    if (file && pageThumbnails.length === 0 && !isEncrypted) {
      loadThumbnails(file);
    }
  }, [file, pageThumbnails.length, isEncrypted, loadThumbnails]);

  // Visor alta resolución de la página actual
  useEffect(() => {
    if (!file || totalPages === 0 || targetPage < 1 || !isUnlocked) { setViewerHiResImage(null); return; }
    let isMounted = true;
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const buffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer, password: unlockedPassword }).promise;
        if (!isMounted) return;
        const pg = await pdfDoc.getPage(targetPage);
        const vp = pg.getViewport({ scale: 1.5 });
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d'); c.height = vp.height; c.width = vp.width;
        if (ctx) { await pageRenderPromise(pg, ctx, vp, c); if (isMounted) setViewerHiResImage(c.toDataURL()); }
      } catch(e) {}
    })();
    return () => { isMounted = false; };
  }, [file, targetPage, totalPages, isUnlocked, unlockedPassword]);

  const pageRenderPromise = (pg: any, ctx: CanvasRenderingContext2D, vp: any, c: HTMLCanvasElement) => {
    return (pg.render({ canvasContext: ctx, viewport: vp, canvas: c } as any)).promise;
  };

  // Generación de firma por texto con múltiples estilos de fuente
  useEffect(() => {
    if (creationTab === 'type' && fullName.trim()) {
      generateTypedSignature(fullName, strokeColor, fontStyle);
    }
  }, [creationTab, fullName, strokeColor, fontStyle]);

  const generateTypedSignature = (text: string, color: string, style: FontStyleOption) => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 480; offCanvas.height = 140;
    const ctx = offCanvas.getContext('2d');
    if (ctx) {
      let fontStr = 'italic bold 40px "Brush Script MT", "Caveat", cursive, sans-serif';
      if (style === 'calligraphy') {
        fontStr = 'italic bold 38px "Great Vibes", "Dancing Script", cursive, sans-serif';
      } else if (style === 'formal') {
        fontStr = 'italic 36px "Lucida Handwriting", "Dancing Script", cursive, sans-serif';
      } else if (style === 'modern') {
        fontStr = 'bold 36px "Outfit", "Inter", sans-serif';
      } else if (style === 'serif') {
        fontStr = 'bold italic 36px "Playfair Display", "Georgia", serif';
      }

      ctx.font = fontStr; 
      ctx.fillStyle = color; 
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle'; 
      ctx.fillText(text, 240, 70); 
    }
    setSignatureDataUrl(offCanvas.toDataURL('image/png'));
  };

  // Dibujo libre
  const startDrawing = (e: any) => {
    setIsDrawing(true); setHasDrawn(true);
    const canvas = drawCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.strokeStyle = strokeColor; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - rect.left, cy - rect.top);
  };
  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(cx - rect.left, cy - rect.top); ctx.stroke();
  };
  const stopDrawing = () => { if (isDrawing && drawCanvasRef.current) { setIsDrawing(false); setSignatureDataUrl(drawCanvasRef.current.toDataURL('image/png')); } };
  const clearCanvas = () => { const c = drawCanvasRef.current; if (c) { c.getContext('2d')?.clearRect(0,0,c.width,c.height); setHasDrawn(false); setSignatureDataUrl(null); } };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setIsEncrypted(false);
      setIsUnlocked(false);
      setPasswordInput('');
      setUnlockedPassword(undefined);
      await loadThumbnails(selected);
    }
    e.target.value = '';
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      await loadThumbnails(file, passwordInput);
      setUnlockedPassword(passwordInput);
      setIsUnlocked(true);
      setIsEncrypted(false);
      toast.success(isEs ? '¡Archivo PDF desbloqueado correctamente!' : 'PDF unlocked successfully!');
    } catch {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  const handleStampImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { const f = e.target.files[0]; setStampImageFile(f); setSignatureDataUrl(URL.createObjectURL(f)); } e.target.value = '';
  };
  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setCertFile(e.target.files[0]); setCertInfo(null); } e.target.value = '';
  };
  const handleBatchFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFiles(Array.from(e.target.files)); e.target.value = '';
  };
  const handleRemoveFile = () => { setFile(null); setGlobalFile(null); setPageThumbnails([]); setTotalPages(0); setIsEncrypted(false); setIsUnlocked(false); setPasswordInput(''); setUnlockedPassword(undefined); };

  const handleGridPositionSelect = (pos: Position9) => {
    setPosition(pos);
    switch (pos) {
      case 'top-left': setFreeX(8); setFreeY(8); break;
      case 'top-center': setFreeX(50); setFreeY(8); break;
      case 'top-right': setFreeX(92); setFreeY(8); break;
      case 'center-left': setFreeX(8); setFreeY(50); break;
      case 'center': setFreeX(50); setFreeY(50); break;
      case 'center-right': setFreeX(92); setFreeY(50); break;
      case 'bottom-left': setFreeX(8); setFreeY(92); break;
      case 'bottom-center': setFreeX(50); setFreeY(92); break;
      case 'bottom-right': setFreeX(92); setFreeY(92); break;
    }
  };

  // DRAG INTERACTIVO
  const handleSigDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingSig(true); }, []);
  useEffect(() => {
    if (!isDraggingSig) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = viewerContainerRef.current; if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      setFreeX(Math.max(0, Math.min(100, ((cx - rect.left) / rect.width) * 100)));
      setFreeY(Math.max(0, Math.min(100, ((cy - rect.top) / rect.height) * 100)));
    };
    const handleUp = () => setIsDraggingSig(false);
    window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp); };
  }, [isDraggingSig]);

  // EJECUCIÓN CON WEB WORKER DE FIRMA LOCAL O FIRMA PAdES
  const executeSignPdf = async () => {
    if (!file) { toast.error(isEs ? "Sube un archivo PDF primero." : "Upload a PDF file first."); return; }
    if (isEncrypted && !isUnlocked) { toast.error(isEs ? 'Desbloquea el PDF con su contraseña antes de procesar' : 'Unlock PDF with password before processing'); return; }
    if (!signatureDataUrl && !enterpriseMode) { toast.error(isEs ? "Dibuja o ingresa una firma antes de continuar." : "Draw or create a signature first."); return; }
    if (enterpriseMode && !certFile) { toast.error(isEs ? "Carga tu certificado .p12/.pfx" : "Upload your .p12/.pfx certificate"); return; }
    if (enterpriseMode && !certPassword) { toast.error(isEs ? "Ingresa la contraseña del certificado" : "Enter the certificate password"); return; }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando proceso de firma...' : 'Starting signature process...');

    try {
      // ── MODO EMPRESARIAL: Firmar vía API PAdES ──
      if (enterpriseMode && certFile) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
        
        const certBuffer = await certFile.arrayBuffer();
        const certBase64 = Buffer.from(certBuffer).toString('base64');

        let sigBase64: string | undefined;
        if (signatureDataUrl) {
          const sigRes = await fetch(signatureDataUrl);
          const sigBlob = await sigRes.blob();
          sigBase64 = Buffer.from(await sigBlob.arrayBuffer()).toString('base64');
        }

        const apiBody: any = {
          pdfBase64,
          certBase64,
          certPassword,
          position: { x: freeX, y: freeY },
          signatureBase64: sigBase64,
          signerName: fullName,
          signerRole,
          signerLocation,
          includeDate,
          includeHash,
          pageIndex: targetPage - 1,
        };

        if (isBatchMode && files.length > 1) {
          const allBases = await Promise.all(files.map(async f => Buffer.from(await f.arrayBuffer()).toString('base64')));
          apiBody.batchFiles = allBases;
          delete apiBody.pdfBase64;
        }

        setProgressMsg(isEs ? 'Firmando criptográficamente (PAdES)...' : 'Cryptographically signing (PAdES)...');
        const res = await fetch('/api/pdf/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiBody),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error del servidor');

        setCertInfo(json.metadata);

        const results = json.results || [{ signedPdfBase64: json.signedPdfBase64 }];
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const blob = new Blob([Buffer.from(r.signedPdfBase64, 'base64')], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const originalName = (files[i] || file).name.replace(/\.[^/.]+$/, "");
          const outName = `${originalName}_Firmado_PAdES.pdf`;
          const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';

          setCompletedResult({
            downloadUrl: url,
            filename: outName,
            fileSize: sizeMb,
            outputFormat: 'pdf',
            rawBlob: blob,
          });
        }

        setProgressPercent(100);
        toast.success(isEs ? `¡PDF firmado con PAdES listo para descargar!` : `PDF signed with PAdES ready to download!`);
      }
      // ── MODO LOCAL CON WEB WORKER DE FIRMA (SOPORTA ALCANCE DE PÁGINAS) ──
      else {
        const buffer = await file.arrayBuffer();
        const bufferCopy = buffer.slice(0);

        let signatureBuffer: ArrayBuffer | undefined = undefined;
        let signatureMime: string | undefined = undefined;

        if (signatureDataUrl) {
          const sigRes = await fetch(signatureDataUrl);
          const sigBlob = await sigRes.blob();
          signatureBuffer = await sigBlob.arrayBuffer();
          signatureMime = sigBlob.type;
        }

        const worker = new Worker(new URL('../workers/pdf-sign.worker.ts', import.meta.url), { type: 'module' });

        const payload: SignWorkerMessageIn = {
          action: 'sign',
          arrayBuffer: bufferCopy,
          password: unlockedPassword,
          options: {
            filePrefix: filePrefix.trim() || 'Documento_Firmado',
            signatureBuffer,
            signatureMime,
            pageScope,
            customPageRange,
            targetPage,
            freeX,
            freeY,
            scale,
            signerName: fullName,
            signerRole,
            showPrintedName,
            includeDate,
            includeHash,
            metadata: {
              title: docTitle.trim() || undefined,
              author: docAuthor.trim() || undefined,
              subject: docSubject.trim() || undefined,
            }
          }
        };

        const transferables: Transferable[] = [bufferCopy];
        if (signatureBuffer) transferables.push(signatureBuffer);

        const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent<SignWorkerMessageOut>) => {
            const msg = e.data;
            if (msg.type === 'progress') {
              setProgressPercent(msg.percent);
              setProgressMsg(msg.message);
            } else if (msg.type === 'result') {
              resolve({
                buffer: msg.buffer,
                totalPages: msg.totalPages,
              });
            } else if (msg.type === 'error') {
              reject(new Error(msg.message));
            }
          };

          worker.onerror = (err) => reject(err);

          worker.postMessage(payload, transferables);
        });

        worker.terminate();

        const blob = new Blob([result.buffer], { type: 'application/pdf' });
        const localUrl = URL.createObjectURL(blob);
        const outName = `${filePrefix.trim() || 'Documento_Firmado'}.pdf`;
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';

        setCompletedResult({
          downloadUrl: localUrl,
          filename: outName,
          fileSize: sizeMb,
          outputFormat: 'pdf',
          rawBlob: blob,
        });

        setProgressPercent(100);
        toast.success(isEs ? '¡PDF firmado! Tu archivo está listo para descargar.' : 'PDF signed! Your file is ready for download.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || (isEs ? 'Error al firmar el documento.' : 'Failed to sign PDF.'));
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start">
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/png, image/jpeg" className="hidden" ref={stampInputRef} onChange={handleStampImageChange} />
      <input type="file" accept=".p12,.pfx" className="hidden" ref={certInputRef} onChange={handleCertChange} />
      <input type="file" accept=".pdf" multiple className="hidden" ref={batchInputRef} onChange={handleBatchFiles} />

      {/* HEADER */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-white/10 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono">
        <div className="flex items-center gap-4">
          <Link href="/editar" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> {isEs ? "Volver" : "Back"}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs ? "005 / FIRMA DIGITAL Y CERTIFICADOS PAdES" : "005 / DIGITAL SIGNATURE & PAdES"}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <PenTool className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? "FIRMA DIGITAL DE DOCUMENTOS PDF" : "DIGITAL SIGNATURE OF PDF DOCUMENTS"}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white">
              <button 
                onClick={() => setTargetPage(prev => Math.max(1, prev - 1))} 
                className="p-1 hover:bg-white/10 rounded transition-all disabled:opacity-30 cursor-pointer" 
                disabled={targetPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{targetPage} / {totalPages || 1}</span>
              <button 
                onClick={() => setTargetPage(prev => Math.min(totalPages, prev + 1))} 
                className="p-1 hover:bg-white/10 rounded transition-all disabled:opacity-30 cursor-pointer" 
                disabled={targetPage >= totalPages}
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
            {isEs ? "FIRMA DIGITAL DE DOCUMENTOS PDF" : "DIGITAL SIGNATURE OF PDF DOCUMENTS"}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs ? "Firma tus documentos PDF de forma 100% local o con certificado digital PAdES." : "Sign PDF documents 100% locally or with PAdES digital certificates."}
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start"
        >
          {/* LADO IZQUIERDO: MINIATURAS EN UNA SOLA COLUMNA VERTICAL */}
          <div className="lg:col-span-2 xl:col-span-2 bg-[#09090b] border border-white/10 rounded-2xl p-3 shadow-2xl overflow-y-auto max-h-[750px] flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-white" />
                {isEs ? "Páginas" : "Pages"}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">1 Col</span>
            </div>

            {/* PASSWORD WIDGET FOR ENCRYPTED PDF */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isEs ? "PDF Protegido" : "Protected PDF"}</span>
                </div>
                <input
                  type="password"
                  placeholder={isEs ? "Contraseña..." : "Password..."}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && unlockFileWithPassword()}
                  className="w-full bg-zinc-900 border border-white/15 rounded-lg py-1 px-2 text-xs text-white outline-none focus:border-white/40 font-mono"
                />
                <button
                  onClick={unlockFileWithPassword}
                  className="w-full py-1 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1 font-mono"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isEs ? "Desbloquear" : "Unlock"}</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {pageThumbnails.map((thumb, idx) => {
                const pageNum = idx + 1;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setTargetPage(pageNum)} 
                    className={`relative cursor-pointer rounded-xl border p-1.5 transition-all aspect-[1/1.414] flex items-center justify-center overflow-hidden ${pageNum === targetPage ? 'border-white ring-2 ring-white/40 bg-zinc-900 scale-105 shadow-lg' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                  >
                    {typeof thumb === 'string' && thumb.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={`Página ${pageNum}`} className="w-full h-full object-contain rounded-lg bg-white" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-zinc-600 text-xs font-mono font-bold">
                        {pageNum}
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-zinc-900/90 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border border-white/10">
                      {pageNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VISOR CENTRAL CON DRAG & DROP DE FIRMA */}
          <div className="lg:col-span-6 xl:col-span-6 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[750px] relative overflow-hidden">
            {isLoadingThumbs ? (
              <div className="flex flex-col items-center justify-center gap-3 font-mono">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span className="text-xs text-zinc-400">{isEs ? "Cargando visor..." : "Loading viewer..."}</span>
              </div>
            ) : viewerHiResImage || pageThumbnails[targetPage - 1] ? (
              <div ref={viewerContainerRef} className="relative w-full max-w-[500px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewerHiResImage || pageThumbnails[targetPage - 1]} alt="Visualización de página" className="w-full h-full object-contain select-none pointer-events-none" />
                
                {/* DRAG & DROP OVERLAY DE LA FIRMA */}
                <div 
                  ref={sigOverlayRef} 
                  className={`absolute z-30 cursor-grab ${isDraggingSig ? 'cursor-grabbing' : ''}`} 
                  style={{ left: `${freeX}%`, top: `${freeY}%`, transform: 'translate(-50%, -50%)', transition: isDraggingSig ? 'none' : 'left 0.15s ease, top 0.15s ease' }} 
                  onMouseDown={handleSigDragStart} 
                  onTouchStart={handleSigDragStart}
                >
                  <div className="border-2 border-dashed border-zinc-900 bg-zinc-950/90 backdrop-blur-md p-3 rounded-xl shadow-2xl flex flex-col items-center justify-center min-w-[180px] max-w-[240px] font-mono text-center select-none">
                    {/* 1. Imagen / Trazo manuscrito */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {signatureDataUrl ? (
                      <img src={signatureDataUrl} alt="Firma" className="max-h-[55px] object-contain mb-1 pointer-events-none" />
                    ) : (
                      <span className="font-serif italic font-bold text-white text-base mb-1">{fullName}</span>
                    )}
                    
                    {/* 2. Línea divisoria elegante */}
                    <div className="w-full h-px bg-white/20 my-1" />

                    {/* 3. Nombre impreso solo si showPrintedName es true */}
                    {showPrintedName && (
                      <span className="font-bold text-white text-xs block font-sans uppercase tracking-tight mb-0.5">
                        {fullName || 'Firmante'}
                      </span>
                    )}

                    {/* 4. Cargo / Razón social */}
                    {signerRole && <span className="text-[10px] text-zinc-300 font-bold uppercase block">{signerRole}</span>}

                    {/* 5. Fecha y Hora */}
                    {includeDate && <span className="text-[9px] text-zinc-400 mt-0.5 block">{new Date().toLocaleDateString('es-ES')} • {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>}

                    {/* 6. Hash de verificación */}
                    {includeHash && <span className="text-[8px] text-emerald-400 mt-0.5 block font-mono font-bold">HASH: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
              <Move className="w-3.5 h-3.5" />
              <span>{isEs ? 'Arrastra la firma con el ratón para posicionarla libremente' : 'Drag signature with mouse to position it freely'}</span>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-4 xl:col-span-4 bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="mb-5 pb-3 border-b border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN' : '002 / CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center justify-between font-sans uppercase tracking-tight">
                  <span>{isEs ? "PANEL DE CONTROL" : "CONTROL PANEL"}</span>
                  <Sliders className="w-5 h-5 text-white" />
                </h2>
              </div>

              {/* SELECCIÓN DE ALCANCE DE PÁGINAS (PÁGINA ACTUAL VS TODAS) */}
              <div className="mb-5 p-3 rounded-xl border border-white/10 bg-zinc-950 font-mono">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-2 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-white" />
                  {isEs ? "Estampar firma en:" : "Stamp signature on:"}
                </label>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPageScope('all')}
                    className={`py-2 px-1 rounded-lg border font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${pageScope === 'all' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Todas' : 'All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageScope('current')}
                    className={`py-2 px-1 rounded-lg border font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${pageScope === 'current' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Actual' : 'Current'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageScope('custom')}
                    className={`py-2 px-1 rounded-lg border font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${pageScope === 'custom' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Rango' : 'Range'}</span>
                  </button>
                </div>

                {pageScope === 'custom' && (
                  <div className="mt-2.5">
                    <label className="text-[9px] text-zinc-400 block mb-1">{isEs ? "Rango de páginas (ej: 1, 3-5):" : "Page range (e.g. 1, 3-5):"}</label>
                    <input
                      type="text"
                      value={customPageRange}
                      onChange={(e) => setCustomPageRange(e.target.value)}
                      placeholder="1, 3-5"
                      className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Modo Empresarial PAdES */}
              <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 font-mono">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 font-mono uppercase">{isEs ? 'FIRMA PAdES (Certificado)' : 'PAdES SIGNING (Certificate)'}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setEnterpriseMode(!enterpriseMode)} 
                    className={`w-10 h-5 rounded-full transition-all relative ${enterpriseMode ? 'bg-amber-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${enterpriseMode ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </label>
                <p className="text-[10px] text-amber-400/70 mt-2 leading-tight">
                  {isEs ? 'Firma criptográfica PAdES con certificado .p12/.pfx.' : 'PAdES cryptographic signing with .p12/.pfx certificate.'}
                </p>
              </div>

              {enterpriseMode && (
                <div className="mb-4 space-y-3 p-3 rounded-xl border border-amber-500/20 bg-zinc-950 font-mono">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">{isEs ? 'Certificado (.p12/.pfx):' : 'Certificate (.p12/.pfx):'}</label>
                    <button type="button" onClick={() => certInputRef.current?.click()} className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-between hover:bg-zinc-800 transition-colors">
                      <span className="truncate">{certFile ? certFile.name : (isEs ? 'Seleccionar archivo...' : 'Select file...')}</span>
                      <FileLock2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 ml-2" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">{isEs ? 'Contraseña:' : 'Password:'}</label>
                    <input type="password" value={certPassword} onChange={e => setCertPassword(e.target.value)} placeholder="••••••••" className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">{isEs ? 'Ubicación (ciudad/país):' : 'Location (city/country):'}</label>
                    <input type="text" value={signerLocation} onChange={e => setSignerLocation(e.target.value)} placeholder={isEs ? 'Ej: Bogotá, CO' : 'e.g. New York, US'} className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono" />
                  </div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">{isEs ? 'Firma por Lotes' : 'Batch Signing'}</span>
                    <button type="button" onClick={() => { setIsBatchMode(!isBatchMode); if (!isBatchMode) batchInputRef.current?.click(); }} className={`w-10 h-5 rounded-full transition-all relative ${isBatchMode ? 'bg-emerald-500' : 'bg-zinc-700'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isBatchMode ? 'left-5' : 'left-0.5'}`} /></button>
                  </label>
                  {isBatchMode && (
                    <div className="p-2 bg-zinc-900/60 rounded-lg border border-white/5 text-[10px] text-zinc-400 font-mono">
                      {files.length > 0 ? <span>{isEs ? `${files.length} archivos cargados` : `${files.length} files loaded`}</span> : <button onClick={() => batchInputRef.current?.click()} className="text-amber-400 hover:underline">{isEs ? 'Cargar múltiples PDFs' : 'Load multiple PDFs'}</button>}
                    </div>
                  )}
                </div>
              )}

              {/* Cert Info */}
              {certInfo && (
                <div className="mb-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] font-mono">
                  <div className="flex items-center gap-2 mb-1"><BadgeCheck className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 font-bold uppercase">{isEs ? 'Certificado Validado' : 'Certificate Validated'}</span></div>
                  <p className="text-zinc-300"><strong>{certInfo.signerName}</strong></p>
                  <p className="text-zinc-500">{isEs ? 'Emitido por' : 'Issued by'}: {certInfo.issuer}</p>
                  <p className="text-zinc-500">S/N: {certInfo.serialNumber}</p>
                </div>
              )}

              {/* Creación de Firma */}
              <div className="mb-4 font-mono">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Creación de Firma:" : "Signature Creation:"}</label>
                <div className="grid grid-cols-3 gap-1.5 font-mono">
                  <button type="button" onClick={() => handleTabChange('draw')} className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${creationTab === 'draw' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}><Edit3 className="w-3.5 h-3.5" /> {isEs ? "Dibujar" : "Draw"}</button>
                  <button type="button" onClick={() => handleTabChange('type')} className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${creationTab === 'type' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}><Type className="w-3.5 h-3.5" /> {isEs ? "Texto" : "Type"}</button>
                  <button type="button" onClick={() => handleTabChange('image')} className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${creationTab === 'image' ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}><ImageIcon className="w-3.5 h-3.5" /> {isEs ? "Sello" : "Stamp"}</button>
                </div>
              </div>

              {/* Canvas Dibujo */}
              {creationTab === 'draw' && (
                <div className="mb-5 space-y-3 font-mono">
                  <div className="flex justify-between items-center"><label className="text-[11px] text-zinc-400 uppercase tracking-wider">{isEs ? "Trazado:" : "Trace:"}</label><button type="button" onClick={clearCanvas} className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"><RotateCcw className="w-3 h-3" /> {isEs ? "Limpiar" : "Clear"}</button></div>
                  <div className="bg-zinc-950 border border-white/10 rounded-xl p-2 relative shadow-inner">
                    <canvas ref={drawCanvasRef} width={320} height={120} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-[120px] bg-zinc-900/80 rounded-lg cursor-crosshair touch-none" />
                    {!hasDrawn && <span className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs pointer-events-none">{isEs ? "Dibuja tu firma aquí..." : "Draw signature here..."}</span>}
                  </div>
                  <div className="flex items-center justify-between"><span className="text-[10px] text-zinc-400 uppercase">{isEs ? "Color:" : "Color:"}</span><div className="flex items-center gap-2">{[{ name: 'white', hex: '#ffffff' },{ name: 'blue', hex: '#3b82f6' },{ name: 'red', hex: '#ef4444' },{ name: 'dark', hex: '#18181b' }].map(c => (<button key={c.name} type="button" onClick={() => setStrokeColor(c.hex)} className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${strokeColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`} style={{ backgroundColor: c.hex }} />))}</div></div>
                </div>
              )}

              {/* OPCIONES DE TEXTO Y FUENTES DE FIRMA */}
              {creationTab === 'type' && (
                <div className="mb-5 space-y-3 font-mono">
                  <div>
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Nombre del Firmante:" : "Signer Name:"}</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      placeholder="Ej: Lic. Carlos Mendoza" 
                      className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono" 
                    />
                  </div>

                  {/* SELECTOR DE ESTILOS DE FUENTE */}
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Estilo de Fuente de Firma:" : "Signature Font Style:"}</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {[
                        { id: 'cursive', name: '✍️ Cursiva' },
                        { id: 'calligraphy', name: '🖋️ Caligrafía' },
                        { id: 'formal', name: '📜 Formal' },
                        { id: 'modern', name: '🔤 Moderna' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFontStyle(st.id as FontStyleOption)}
                          className={`py-1.5 px-2 rounded-lg border font-semibold text-left transition-all cursor-pointer ${fontStyle === st.id ? 'bg-white text-black border-white font-bold shadow' : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'}`}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase">{isEs ? "Color:" : "Color:"}</span>
                    <div className="flex items-center gap-2">
                      {[{ name: 'red', hex: '#ef4444' },{ name: 'white', hex: '#ffffff' },{ name: 'blue', hex: '#3b82f6' },{ name: 'dark', hex: '#18181b' }].map(c => (
                        <button key={c.name} type="button" onClick={() => setStrokeColor(c.hex)} className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${strokeColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`} style={{ backgroundColor: c.hex }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {creationTab === 'image' && (
                <div className="mb-5 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-2">{isEs ? "Subir Imagen de Firma o Sello:" : "Upload Signature or Stamp Image:"}</label>
                  <button type="button" onClick={() => stampInputRef.current?.click()} className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer font-mono"><ImageIcon className="w-4 h-4 text-zinc-400" /> {stampImageFile ? stampImageFile.name : (isEs ? "Cargar imagen PNG/JPG" : "Upload PNG/JPG image")}</button>
                </div>
              )}

              {/* SECCIÓN DE OPCIONES AVANZADAS SIEMPRE VISIBLE */}
              <div className="pt-4 border-t border-white/10 my-4 space-y-4 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span>{isEs ? "Opciones Avanzadas PDFBLACK" : "PDFBLACK Advanced Options"}</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">{isEs ? "Prefijo del Archivo Resultante:" : "Output File Prefix:"}</label>
                  <input
                    type="text" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Documento_Firmado"
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>

                {/* Posición rápida */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider">{isEs ? "Posición rápida:" : "Quick Position:"}</label>
                    <span className="text-[10px] text-zinc-300 font-bold">({Math.round(freeX)}%, {Math.round(freeY)}%)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 border border-white/10 rounded-xl shadow-inner">
                    {(['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'] as Position9[]).map(pos => (
                      <button key={pos} type="button" onClick={() => handleGridPositionSelect(pos)} className={`h-10 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${position === pos ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full transition-transform ${position === pos ? 'bg-red-600 scale-110' : 'bg-zinc-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider">{isEs ? "Escala / Tamaño Firma" : "Signature Scale"}</label>
                    <span className="text-xs font-bold text-white">{scale}%</span>
                  </div>
                  <input type="range" min={50} max={200} step={10} value={scale} onChange={e => setScale(Number(e.target.value))} className="w-full accent-white cursor-pointer" />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1.5">{isEs ? "Cargo / Razón Social:" : "Role / Title:"}</label>
                  <input type="text" value={signerRole} onChange={e => setSignerRole(e.target.value)} placeholder={isEs ? "Ej: Representante Legal" : "e.g. CEO / Director"} className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono" />
                </div>

                {/* METADATOS EN EL SELLO */}
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">{isEs ? "OPCIONES DEL SELLO VISUAL" : "VISUAL STAMP OPTIONS"}</label>
                  
                  {/* CONTROL DE IMPRESIÓN DE NOMBRE (SOLUCIÓN A NOMBRE REPETIDO) */}
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={showPrintedName} onChange={e => setShowPrintedName(e.target.checked)} className="accent-white w-4 h-4 rounded" />
                    <span>{isEs ? "Imprimir Nombre bajo la línea" : "Print Name under line"}</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={includeDate} onChange={e => setIncludeDate(e.target.checked)} className="accent-white w-4 h-4 rounded" />
                    <span>{isEs ? "Incluir Fecha y Hora de Firma" : "Include Date & Time"}</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={includeHash} onChange={e => setIncludeHash(e.target.checked)} className="accent-white w-4 h-4 rounded" />
                    <span>{isEs ? "Incluir Código Hash de Verificación" : "Include Verification Hash"}</span>
                  </label>
                </div>

                {/* METADATOS DEL DOCUMENTO RESULTANTE */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-2 font-mono">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">{isEs ? "METADATOS DEL PDF FIRMADO" : "SIGNED PDF METADATA"}</label>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Título:" : "Title:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Contrato_Firmado_2026" : "Ex: Signed_Contract_2026"}
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Autor / Organización:" : "Author / Organization:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Mi Empresa S.A." : "Ex: Company Inc."}
                      value={docAuthor}
                      onChange={(e) => setDocAuthor(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">{isEs ? "Asunto / Descripción:" : "Subject / Description:"}</label>
                    <input
                      type="text"
                      placeholder={isEs ? "Ej: Firma de acuerdo legal" : "Ex: Legal agreement signing"}
                      value={docSubject}
                      onChange={(e) => setDocSubject(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN DE ACCIÓN CON BARRA DE PROGRESO */}
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

              {completedResult ? (
                <DownloadSuccessCard
                  downloadUrl={completedResult.downloadUrl}
                  filename={completedResult.filename}
                  fileSize={completedResult.fileSize}
                  outputFormat="pdf"
                  rawBlob={completedResult.rawBlob}
                  onReset={() => setCompletedResult(null)}
                />
              ) : (
                <button 
                  onClick={executeSignPdf} 
                  disabled={isProcessing || !file || (isEncrypted && !isUnlocked)} 
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-sans font-bold text-base transition-all shadow-md hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                  <span>
                    {isProcessing 
                      ? progressMsg 
                      : (enterpriseMode 
                          ? (isEs ? 'Firmar con PAdES →' : 'Sign with PAdES →') 
                          : (isEs ? (pageScope === 'all' ? 'Estampar Firma en Todo el PDF →' : 'Estampar Firma Digital →') : 'Stamp Digital Signature →'))}
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}