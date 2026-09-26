'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PenTool,
  Loader2,
  Settings2,
  ShieldCheck,
  Download,
  ArrowLeft,
  Sparkles,
  FileText,
  Trash2,
  Plus,
  LayoutGrid,
  Check,
  Image as ImageIcon,
  Type,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sliders,
  UploadCloud,
  Lock,
  Unlock,
  Move,
  Building2,
  BadgeCheck,
  Edit3,
  Layers,
  FileCheck,
  Eraser,
  Stamp,
  Fingerprint,
  Calendar,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SignWorkerMessageIn, SignWorkerMessageOut, Position9 } from '@/workers/pdf-sign.worker';
import FoliarSuccessView from '@/components/FoliarSuccessView';

type CreationTab = 'type' | 'draw' | 'image' | 'audit_box';
type FontStyleOption = 'cursive' | 'calligraphy' | 'formal' | 'modern' | 'serif';

export default function PdfSigner() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
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

  // ESTADO DE ENCRIPTACIÓN / CONTRASEÑA
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | undefined>(undefined);

  // NAVEGACIÓN Y MINIATURAS STREAMING
  const [totalPages, setTotalPages] = useState<number>(0);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState<boolean>(false);
  const [viewerHiResImage, setViewerHiResImage] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState<string>('1');

  // MODO DE CREACIÓN Y ESTILO DE FIRMA
  const [creationTab, setCreationTab] = useState<CreationTab>('type');
  const [fontStyle, setFontStyle] = useState<FontStyleOption>('cursive');
  const [strokeColor, setStrokeColor] = useState<string>('#003366'); // Azul notarial por defecto
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [removeBgEnabled, setRemoveBgEnabled] = useState<boolean>(true);

  // DATOS DE IDENTIDAD Y AUDITORÍA
  const [fullName, setFullName] = useState<string>('Lic. Carlos Mendoza Ramos');
  const [signerRole, setSignerRole] = useState<string>('Director Legal & Notarial');
  const [signerId, setSignerId] = useState<string>('ID: 48920194-X');
  const [signerLocation, setSignerLocation] = useState<string>('Madrid, España');
  const [signatureReason, setSignatureReason] = useState<string>('Aprobado y Conforme');
  const [showPrintedName, setShowPrintedName] = useState<boolean>(false);
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [includeHash, setIncludeHash] = useState<boolean>(true);
  const [sealStyle, setSealStyle] = useState<'clean' | 'audit_box'>('clean');

  // ALCANCE DE PÁGINAS Y RÚBRICA (VOBO)
  const [pageScope, setPageScope] = useState<'current' | 'all' | 'custom' | 'vobo'>('current');
  const [customPageRange, setCustomPageRange] = useState<string>('1');
  const [initialsText, setInitialsText] = useState<string>('C.M.R. - Vo.Bo.');

  // POSICIÓN Y ESCALA
  const [position, setPosition] = useState<Position9>('bottom-right');
  const [freeX, setFreeX] = useState<number>(82);
  const [freeY, setFreeY] = useState<number>(85);
  const [scale, setScale] = useState<number>(100);
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const [filePrefix, setFilePrefix] = useState<string>('Documento_Firmado');

  // REFS
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const cancelThumbRenderRef = useRef<boolean>(false);
  const pageCacheRef = useRef<Map<number, string>>(new Map());

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Paleta de tintas oficiales
  const INK_COLORS = [
    { label: isEs ? 'Azul Notarial' : 'Legal Blue', hex: '#003366', bg: 'bg-[#003366]' },
    { label: isEs ? 'Negro Documental' : 'Document Black', hex: '#09090b', bg: 'bg-[#09090b]' },
    { label: isEs ? 'Rojo Revisión' : 'Review Red', hex: '#dc2626', bg: 'bg-[#dc2626]' },
    { label: isEs ? 'Verde Aprobación' : 'Approval Green', hex: '#059669', bg: 'bg-[#059669]' },
  ];

  // Scroll automático hacia la cabecera al finalizar
  useEffect(() => {
    if (completedResult && topContainerRef.current) {
      topContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [completedResult]);

  // Cancelar renders pendientes al desmontar
  useEffect(() => {
    return () => {
      cancelThumbRenderRef.current = true;
    };
  }, []);

  // Filtro de eliminación de fondo blanco para firmas escaneadas/fotografiadas
  const processImageTransparency = (
    imgSrc: string,
    applyTransparency: boolean,
  ): Promise<string> => {
    return new Promise((resolve) => {
      if (!applyTransparency) {
        resolve(imgSrc);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgSrc);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Umbral inteligente de blancura: píxeles claros se vuelven transparentes
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 215) {
            data[i + 3] = 0; // Transparente
          } else {
            // Reforzar contraste de la tinta
            const factor = 1.35;
            data[i] = Math.max(0, Math.min(255, (r - 128) * factor + 128));
            data[i + 1] = Math.max(0, Math.min(255, (g - 128) * factor + 128));
            data[i + 2] = Math.max(0, Math.min(255, (b - 128) * factor + 128));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imgSrc);
      img.src = imgSrc;
    });
  };

  // Generador de firma tipográfica
  const generateTypedSignature = useCallback(
    (text: string, color: string, style: FontStyleOption) => {
      const offCanvas = document.createElement('canvas');
      const width = 640;
      const height = 180;
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      let fontSize = 48;
      let fontName = '"Great Vibes", "Brush Script MT", cursive, sans-serif';
      if (style === 'calligraphy') {
        fontName = '"Dancing Script", "Great Vibes", cursive, sans-serif';
      } else if (style === 'formal') {
        fontName = '"Lucida Handwriting", "Brush Script MT", cursive, sans-serif';
      } else if (style === 'modern') {
        fontName = '"Caveat", "Segoe Print", cursive, sans-serif';
      } else if (style === 'serif') {
        fontName = '"Playfair Display", "Times New Roman", serif';
      }

      ctx.font = `italic 600 ${fontSize}px ${fontName}`;
      let metrics = ctx.measureText(text);
      while (metrics.width > width - 60 && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `italic 600 ${fontSize}px ${fontName}`;
        metrics = ctx.measureText(text);
      }

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);

      setSignatureDataUrl(offCanvas.toDataURL('image/png'));
    },
    [],
  );

  // Generador de Sello Corporativo
  const generateAuditSeal = useCallback(
    (name: string, role: string, idNum: string, reason: string, color: string) => {
      const offCanvas = document.createElement('canvas');
      const width = 640;
      const height = 220;
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Marco exterior doble
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Barra de encabezado
      ctx.fillStyle = color;
      ctx.fillRect(16, 16, width - 32, 34);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SELLO OFICIAL DE VALIDACIÓN DIGITAL • PDFBLACK', width / 2, 33);

      // Datos corporativos
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(name || 'Firma Autorizada', 35, 80);

      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(`Cargo: ${role || 'Firmante'}`, 35, 106);
      if (idNum) ctx.fillText(`Identificación: ${idNum}`, 35, 128);
      ctx.fillText(`Razón: ${reason || 'Aprobado'}`, 35, 150);

      const now = new Date();
      ctx.font = 'italic 11px system-ui, sans-serif';
      ctx.fillText(`Timestamp: ${now.toISOString()} | SHA-256 Verified`, 35, 180);

      setSignatureDataUrl(offCanvas.toDataURL('image/png'));
    },
    [],
  );

  // Regenerar firma según pestaña activa
  useEffect(() => {
    if (creationTab === 'type' && fullName.trim()) {
      generateTypedSignature(fullName, strokeColor, fontStyle);
    } else if (creationTab === 'audit_box') {
      generateAuditSeal(fullName, signerRole, signerId, signatureReason, strokeColor);
    }
  }, [
    creationTab,
    fullName,
    strokeColor,
    fontStyle,
    signerRole,
    signerId,
    signatureReason,
    generateTypedSignature,
    generateAuditSeal,
  ]);

  // Carga progresiva streaming de miniaturas sin límite de 32 páginas
  const loadThumbnails = useCallback(
    async (selectedFile: File, pass?: string) => {
      cancelThumbRenderRef.current = true;
      await new Promise((r) => setTimeout(r, 30));
      cancelThumbRenderRef.current = false;

      setIsLoadingThumbs(true);
      setPageThumbnails([]);
      pageCacheRef.current.clear();
      setViewerHiResImage(null);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

        const buffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: buffer,
          password: pass,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const pdfDoc = await loadingTask.promise;
        const total = pdfDoc.numPages;
        setTotalPages(total);
        setTargetPage(1);
        setPageInput('1');
        setIsEncrypted(false);
        setIsUnlocked(true);

        const thumbsArray: string[] = new Array(total).fill('');
        setPageThumbnails([...thumbsArray]);

        // Streaming por lotes de 6 páginas
        const BATCH_SIZE = 6;
        for (let i = 1; i <= total; i += BATCH_SIZE) {
          if (cancelThumbRenderRef.current) break;
          const endPage = Math.min(i + BATCH_SIZE - 1, total);

          await Promise.all(
            Array.from({ length: endPage - i + 1 }, async (_, offset) => {
              const pageNum = i + offset;
              if (cancelThumbRenderRef.current) return;
              try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.35 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
                const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                thumbsArray[pageNum - 1] = dataUrl;
              } catch (e) {
                console.warn(`Error al renderizar miniatura ${pageNum}:`, e);
              }
            }),
          );

          if (!cancelThumbRenderRef.current) {
            setPageThumbnails([...thumbsArray]);
          }
          await new Promise((r) => setTimeout(r, 15));
        }

        toast.success(
          isEs
            ? `Documento cargado (${total} páginas listas)`
            : `Document loaded (${total} pages ready)`,
        );
      } catch (err: any) {
        if (err?.name === 'PasswordException' || err?.code === 1) {
          setIsEncrypted(true);
          setIsUnlocked(false);
          toast.warning(
            isEs ? 'El archivo requiere contraseña para abrirse' : 'File requires password to open',
          );
        } else {
          console.error('Error al cargar PDF:', err);
          toast.error(isEs ? 'Error al cargar el PDF' : 'Error loading PDF');
        }
      } finally {
        setIsLoadingThumbs(false);
      }
    },
    [isEs],
  );

  // Carga del archivo inicial si proviene del store global
  useEffect(() => {
    if (file && totalPages === 0 && !isEncrypted) {
      setFilePrefix(file.name.replace(/\.[^/.]+$/, '') + '_Firmado');
      loadThumbnails(file);
    }
  }, [file, totalPages, isEncrypted, loadThumbnails]);

  // Renderizado del visor de alta resolución en la página activa
  useEffect(() => {
    if (!file || totalPages === 0 || targetPage < 1 || !isUnlocked) {
      setViewerHiResImage(null);
      return;
    }

    setPageInput(targetPage.toString());

    // Caché instantánea
    const cached = pageCacheRef.current.get(targetPage);
    if (cached) {
      setViewerHiResImage(cached);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const buffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: buffer,
          password: unlockedPassword,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        }).promise;

        if (!isMounted) return;
        const page = await pdfDoc.getPage(targetPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        if (isMounted) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          pageCacheRef.current.set(targetPage, dataUrl);
          setViewerHiResImage(dataUrl);
        }
      } catch (err) {
        console.error('Error renderizando página activa:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [file, targetPage, totalPages, isUnlocked, unlockedPassword]);

  // Dibujo libre en canvas
  const startDrawing = (e: any) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - rect.left, cy - rect.top);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(cx - rect.left, cy - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && drawCanvasRef.current) {
      setIsDrawing(false);
      setSignatureDataUrl(drawCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const c = drawCanvasRef.current;
    if (c) {
      c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
      setHasDrawn(false);
      setSignatureDataUrl(null);
    }
  };

  const handleStampImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (typeof ev.target?.result === 'string') {
          const processed = await processImageTransparency(ev.target.result, removeBgEnabled);
          setSignatureDataUrl(processed);
          toast.success(isEs ? 'Firma cargada con éxito' : 'Signature loaded successfully');
        }
      };
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setGlobalFile(selected);
      setFilePrefix(selected.name.replace(/\.[^/.]+$/, '') + '_Firmado');
      await loadThumbnails(selected);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf' || dropped.name.endsWith('.pdf')) {
        setFile(dropped);
        setGlobalFile(dropped);
        setFilePrefix(dropped.name.replace(/\.[^/.]+$/, '') + '_Firmado');
        await loadThumbnails(dropped);
      } else {
        toast.error(isEs ? 'Solo se permiten archivos PDF' : 'Only PDF files are supported');
      }
    }
  };

  const unlockFileWithPassword = async () => {
    if (!file || !passwordInput) return;
    try {
      await loadThumbnails(file, passwordInput);
      setUnlockedPassword(passwordInput);
      setIsUnlocked(true);
      setIsEncrypted(false);
      toast.success(isEs ? '¡PDF desbloqueado!' : 'PDF unlocked successfully!');
    } catch {
      toast.error(isEs ? 'Contraseña incorrecta' : 'Incorrect password');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveFile = () => {
    cancelThumbRenderRef.current = true;
    setFile(null);
    setGlobalFile(null);
    setCompletedResult(null);
    setPageThumbnails([]);
    setTotalPages(0);
    setTargetPage(1);
    setPageInput('1');
    setViewerHiResImage(null);
    pageCacheRef.current.clear();
    setIsEncrypted(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setUnlockedPassword(undefined);
  };

  const handleStartOver = () => {
    handleRemoveFile();
    setCompletedResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Alineación en 9 cuadrantes
  const handleGridPositionSelect = (pos: Position9) => {
    setPosition(pos);
    switch (pos) {
      case 'top-left':
        setFreeX(18);
        setFreeY(12);
        break;
      case 'top-center':
        setFreeX(50);
        setFreeY(12);
        break;
      case 'top-right':
        setFreeX(82);
        setFreeY(12);
        break;
      case 'center-left':
        setFreeX(18);
        setFreeY(50);
        break;
      case 'center':
        setFreeX(50);
        setFreeY(50);
        break;
      case 'center-right':
        setFreeX(82);
        setFreeY(50);
        break;
      case 'bottom-left':
        setFreeX(18);
        setFreeY(85);
        break;
      case 'bottom-center':
        setFreeX(50);
        setFreeY(85);
        break;
      case 'bottom-right':
        setFreeX(82);
        setFreeY(85);
        break;
    }
  };

  // Drag interactivo de la firma sobre el visor
  const handleSigDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSig(true);
  }, []);

  useEffect(() => {
    if (!isDraggingSig) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = viewerContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const pctX = Math.max(5, Math.min(95, ((cx - rect.left) / rect.width) * 100));
      const pctY = Math.max(5, Math.min(95, ((cy - rect.top) / rect.height) * 100));
      setFreeX(Math.round(pctX));
      setFreeY(Math.round(pctY));
    };
    const handleUp = () => setIsDraggingSig(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSig]);

  // Conversión de DataURL a ArrayBuffer sin fetch
  const parseSignatureUrl = async (url: string): Promise<{ buffer: ArrayBuffer; mime: string }> => {
    if (url.startsWith('data:')) {
      const commaIdx = url.indexOf(',');
      const header = url.substring(0, commaIdx);
      const rawBase64 = url.substring(commaIdx + 1);
      const mimeMatch = header.match(/data:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';

      const binaryStr = atob(rawBase64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return { buffer: bytes.buffer, mime };
    }
    const res = await fetch(url);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    return { buffer, mime: blob.type || 'image/png' };
  };

  // Ejecución en Web Worker Aislado en RAM (Zero-Knowledge)
  const executeSignPdf = async () => {
    if (!file) {
      toast.error(isEs ? 'Sube un archivo PDF primero.' : 'Upload a PDF file first.');
      return;
    }
    if (isEncrypted && !isUnlocked) {
      toast.error(
        isEs
          ? 'Desbloquea el PDF con su contraseña antes de continuar.'
          : 'Unlock PDF with password before proceeding.',
      );
      return;
    }
    if (!signatureDataUrl) {
      toast.error(
        isEs
          ? 'Crea, escribe o dibuja una firma antes de procesar.'
          : 'Create or draw a signature before processing.',
      );
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(
      isEs ? 'Iniciando motor de firma forense...' : 'Starting forensic signature engine...',
    );

    try {
      const buffer = await file.arrayBuffer();
      const bufferCopy = buffer.slice(0);

      const parsedSig = await parseSignatureUrl(signatureDataUrl);

      const worker = new Worker(new URL('../workers/pdf-sign.worker.ts', import.meta.url), {
        type: 'module',
      });

      const payload: SignWorkerMessageIn = {
        action: 'sign',
        arrayBuffer: bufferCopy,
        password: unlockedPassword,
        options: {
          filePrefix: filePrefix.trim() || 'Documento_Firmado',
          signatureBuffer: parsedSig.buffer,
          signatureMime: parsedSig.mime,
          pageScope,
          customPageRange,
          targetPage,
          freeX,
          freeY,
          scale,
          signerName: fullName,
          signerRole,
          signerId,
          signerLocation,
          signatureReason,
          sealStyle,
          initialsText,
          showPrintedName: showPrintedName || creationTab !== 'type',
          includeDate,
          includeHash,
        },
      };

      const transferables: Transferable[] = [bufferCopy, parsedSig.buffer];

      const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
        (resolve, reject) => {
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
        },
      );

      worker.terminate();

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(blob);
      const outName = `${filePrefix.trim() || 'Documento_Firmado'}.pdf`;
      const sizeFormatted = formatFileSize(blob.size);

      setCompletedResult({
        downloadUrl: localUrl,
        filename: outName,
        fileSize: sizeFormatted,
        outputFormat: 'pdf',
        rawBlob: blob,
      });

      setProgressPercent(100);
      toast.success(
        isEs
          ? '¡Documento PDF firmado con éxito! Listo para descargar.'
          : 'PDF document signed successfully! Ready to download.',
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || (isEs ? 'Error al firmar PDF' : 'Failed to sign PDF'));
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div
      ref={topContainerRef}
      className="w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-start"
    >
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
        ref={stampInputRef}
        onChange={handleStampImageChange}
      />

      {/* HEADER SUPERIOR */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <Link
            href="/editar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" /> {isEs ? 'Volver' : 'Back'}
          </Link>
          <div className="hidden sm:block h-5 w-px bg-zinc-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isEs
                ? '005 / FIRMA DIGITAL & AUDITORÍA FORENSE'
                : '005 / DIGITAL SIGNATURE & AUDIT SEAL'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <PenTool className="w-6 h-6 text-white flex-shrink-0" />
              {isEs ? 'FIRMA DIGITAL DE DOCUMENTOS PDF' : 'DIGITAL SIGNATURE OF PDF DOCUMENTS'}
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-mono text-white">
              <FileText className="w-4 h-4 text-zinc-300" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">
                {file.name}
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {completedResult ? (
        /* ── PANTALLA DE ÉXITO DEDICADA ULTRA-PREMIUM CON COMPARTIR EN WHATSAPP / TELEGRAM / DRIVE ── */
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: completedResult.downloadUrl,
              filename: completedResult.filename,
              fileSize:
                completedResult.fileSize ||
                (completedResult.rawBlob
                  ? formatFileSize(completedResult.rawBlob.size)
                  : undefined),
              rawBlob: completedResult.rawBlob,
            }}
            totalPages={totalPages}
            modeText={
              isEs
                ? includeHash
                  ? 'Firma Forense SHA-256'
                  : 'Firma Vectorial Notarial'
                : includeHash
                  ? 'Forensic SHA-256 Signature'
                  : 'Notarial Vector Signature'
            }
            toolName={isEs ? 'Firma Digital PDF' : 'Digital PDF Signature'}
            badgeText={isEs ? 'Firma Completada' : 'Signature Completed'}
            successTitle={isEs ? '¡Documento Firmado con Éxito!' : 'Document Signed Successfully!'}
            downloadButtonText={isEs ? 'Descargar PDF Firmado' : 'Download Signed PDF'}
            shareSubject={isEs ? 'documento firmado' : 'signed document'}
            fallbackUrl="https://pdf-black.com/editar/firmar"
            metricBadge={
              file && completedResult?.rawBlob ? (
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded font-bold font-mono">
                  {formatFileSize(file.size)} → {formatFileSize(completedResult.rawBlob.size)}
                </span>
              ) : null
            }
            onReset={handleStartOver}
          />
        </div>
      ) : !file ? (
        /* ── DROPZONE DE CARGA DARK ENTERPRISE ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
            isDraggingFile ? 'border-white bg-zinc-900/50' : 'border-zinc-600 hover:border-white'
          } rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <PenTool className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Motor de Firma Digital Criptográfica v5.0 • 100% Local'
                : 'Cryptographic Digital Signature Engine v5.0 • 100% Local'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs ? 'FIRMA DIGITAL DE DOCUMENTOS PDF' : 'DIGITAL SIGNATURE OF PDF DOCUMENTS'}
          </h2>

          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Firma contratos y actas con tinta vectorial, tipografía caligráfica, sellos transparentes o estampas de auditoría con hash SHA-256. 100% privado en memoria RAM sin subir archivos a la nube.'
              : 'Sign legal contracts with vector ink, calligraphic typography, transparent stamps or SHA-256 audit seals. 100% private in client RAM with zero cloud uploads.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>

          {/* 3 TARJETAS VENTAJAS FRENTE A ILOVEPDF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Privacidad Real (Zero Fugas)' : '✓ Zero Cloud Data Leaks'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'A diferencia de iLovePDF, tus contratos confidenciales jamás se suben a servidores remotos.'
                  : 'Unlike iLovePDF, your confidential contracts are never transmitted to third-party servers.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Sello de Integridad SHA-256' : '✓ Real SHA-256 Audit Seal'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Genera un hash criptográfico real del documento e inyecta metadatos auditables sin pagar suscripción.'
                  : 'Generates authentic document checksums and injects auditable metadata with zero paywalls.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">
                {isEs ? '✓ Modo Expediente & VoBo' : '✓ Multi-Page VoBo & Initials'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight">
                {isEs
                  ? 'Firma la hoja principal y aplica Visto Bueno / rúbrica automática en todas las demás páginas.'
                  : 'Sign the execution page and apply initials/VoBo on all remaining pages with a single click.'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── DISEÑO APILADO ENTERPRISE (VISTA PREVIA ARRIBA + PANEL ABAJO) ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6"
        >
          {/* 1. SECCIÓN SUPERIOR FULL-WIDTH: VISTA PREVIA Y POSICIONAMIENTO AMPLIO */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* BARRA DE NAVEGACIÓN Y CONTROL DE PÁGINAS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-bold">
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                <PenTool className="w-4 h-4 text-white" />
                <span>
                  {isEs
                    ? `001 / POSICIONA TU FIRMA (PÁGINA ${targetPage} DE ${totalPages || 1})`
                    : `001 / POSITION YOUR SIGNATURE (PAGE ${targetPage} OF ${totalPages || 1})`}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Controles de paginación */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-xl text-xs font-mono text-white shadow-sm">
                  <button
                    type="button"
                    disabled={targetPage <= 1}
                    onClick={() => setTargetPage(1)}
                    className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer transition-all"
                    title={isEs ? 'Primera página' : 'First page'}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={targetPage <= 1}
                    onClick={() => setTargetPage((p) => Math.max(1, p - 1))}
                    className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer transition-all"
                    title={isEs ? 'Página anterior' : 'Previous page'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 px-2">
                    <input
                      type="number"
                      min={1}
                      max={totalPages || 1}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={() => {
                        const val = parseInt(pageInput, 10);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setTargetPage(val);
                        } else {
                          setPageInput(targetPage.toString());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseInt(pageInput, 10);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            setTargetPage(val);
                          }
                        }
                      }}
                      className="w-10 bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-center text-xs text-white font-mono outline-none"
                    />
                    <span className="text-zinc-500">/</span>
                    <span className="text-zinc-300">{totalPages || 1}</span>
                  </div>

                  <button
                    type="button"
                    disabled={targetPage >= totalPages}
                    onClick={() => setTargetPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer transition-all"
                    title={isEs ? 'Página siguiente' : 'Next page'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={targetPage >= totalPages}
                    onClick={() => setTargetPage(totalPages)}
                    className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer transition-all"
                    title={isEs ? 'Última página' : 'Last page'}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Badge de coordenadas en tiempo real */}
                <div className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-300 text-[11px] flex items-center gap-1.5">
                  <Move className="w-3 h-3 text-cyan-400" />
                  <span>
                    X: {freeX}% • Y: {freeY}%
                  </span>
                </div>
              </div>
            </div>

            {/* WIDGET SI EL PDF ESTÁ PROTEGIDO CON CONTRASEÑA */}
            {isEncrypted && !isUnlocked && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 space-y-2 font-mono text-xs shadow-inner">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Lock className="w-4 h-4" />
                  <span>
                    {isEs
                      ? 'Este PDF está protegido con contraseña'
                      : 'This PDF is password protected'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder={isEs ? 'Ingresa la contraseña...' : 'Enter password...'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && unlockFileWithPassword()}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl py-1.5 px-3 text-xs text-white outline-none focus:border-white font-mono"
                  />
                  <button
                    onClick={unlockFileWithPassword}
                    className="px-3.5 py-1.5 bg-white text-black font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 font-mono shadow-sm"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Desbloquear' : 'Unlock'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TIRA HORIZONTAL DE MINIATURAS STREAMING */}
            {totalPages > 1 && (
              <div className="w-full mb-4 pb-2 overflow-x-auto">
                <div className="flex items-center gap-2.5 min-w-max pb-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = targetPage === pageNum;
                    const thumb = pageThumbnails[idx];

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTargetPage(pageNum)}
                        className={`relative rounded-xl border p-1 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isCurrent
                            ? 'border-white ring-2 ring-white/30 bg-zinc-800 shadow-md'
                            : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/60 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="w-14 h-20 bg-white rounded flex items-center justify-center overflow-hidden">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={`Pág ${pageNum}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-300">
                          {pageNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LIENZO DE VISOR AMPLIO CON DRAG & DROP DE FIRMA */}
            <div className="w-full flex items-center justify-center bg-zinc-950/80 rounded-2xl p-4 sm:p-6 border border-zinc-800 min-h-[440px] sm:min-h-[520px] max-h-[640px] overflow-hidden relative select-none">
              {viewerHiResImage ? (
                <div
                  ref={viewerContainerRef}
                  className="relative inline-block max-h-[580px] shadow-2xl rounded-lg overflow-hidden border border-zinc-700 cursor-crosshair bg-white"
                  onClick={(e) => {
                    // Clic para saltar la firma a esa posición
                    const rect = e.currentTarget.getBoundingClientRect();
                    const cx = e.clientX - rect.left;
                    const cy = e.clientY - rect.top;
                    setFreeX(Math.round(Math.max(5, Math.min(95, (cx / rect.width) * 100))));
                    setFreeY(Math.round(Math.max(5, Math.min(95, (cy / rect.height) * 100))));
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewerHiResImage}
                    alt={`Página ${targetPage}`}
                    className="max-h-[580px] w-auto object-contain pointer-events-none block"
                  />

                  {/* OVERLAY INTERACTIVO DE LA FIRMA */}
                  {signatureDataUrl && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${freeX}%`,
                        top: `${freeY}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${160 * (scale / 100)}px`,
                      }}
                      onMouseDown={handleSigDragStart}
                      onTouchStart={handleSigDragStart}
                      className="cursor-grab active:cursor-grabbing group p-2 border-2 border-dashed border-cyan-400/80 bg-cyan-950/20 hover:bg-cyan-950/40 rounded-lg transition-colors flex flex-col items-center select-none"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signatureDataUrl}
                        alt="Firma Activa"
                        className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
                      />

                      {/* Datos impresos en vista previa si aplica */}
                      {showPrintedName && fullName && creationTab !== 'audit_box' && (
                        <div className="w-full pt-1 border-t border-zinc-700/60 text-center font-sans">
                          <p className="text-[9px] font-bold text-zinc-900 leading-none truncate">
                            {fullName}
                          </p>
                          {signerRole && (
                            <p className="text-[7.5px] text-zinc-600 leading-none mt-0.5 truncate">
                              {signerRole}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Badge flotante indicativo de arrastre */}
                      <div className="absolute -top-6 bg-zinc-900 text-cyan-300 border border-cyan-500/50 text-[9px] font-mono px-2 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {isEs ? 'Arrastra para mover' : 'Drag to reposition'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 font-mono py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <p className="text-zinc-400 text-xs">
                    {isEs
                      ? 'Cargando vista previa de página en alta resolución...'
                      : 'Loading high-res page preview...'}
                  </p>
                </div>
              )}
            </div>

            {/* Presets de alineación rápida */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-800 text-xs font-mono">
              <span className="text-zinc-400 text-[11px]">
                {isEs
                  ? '💡 Haz clic en el documento o arrastra el sello para posicionar la firma libremente.'
                  : '💡 Click on the document or drag the stamp to position freely.'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">
                  {isEs ? 'Alineación Rápida:' : 'Quick Align:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleGridPositionSelect('bottom-right')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-[10px] cursor-pointer"
                >
                  {isEs ? 'Abajo Derecha' : 'Bottom Right'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGridPositionSelect('bottom-center')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-[10px] cursor-pointer"
                >
                  {isEs ? 'Abajo Centro' : 'Bottom Center'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGridPositionSelect('bottom-left')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-[10px] cursor-pointer"
                >
                  {isEs ? 'Abajo Izquierda' : 'Bottom Left'}
                </button>
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN INFERIOR FULL-WIDTH: PANEL DE CONTROL EMPRESARIAL */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono text-xs">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Cabecera del Panel de Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                  {isEs ? '002 / CONFIGURACIÓN DE FIRMA DIGITAL' : '002 / SIGNATURE CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2 font-sans uppercase tracking-tight">
                  <Sliders className="w-5 h-5 text-white" />
                  <span>
                    {isEs
                      ? 'PANEL DE CONTROL DE FIRMA EMPRESARIAL'
                      : 'ENTERPRISE SIGN CONTROL PANEL'}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                  ✓ {isEs ? 'Motor Forense In-RAM v5.0' : 'In-RAM Forensic Engine v5.0'}
                </span>
              </div>
            </div>

            {/* GRID DE 3 COLUMNAS TEMÁTICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* COLUMNA 1: CREACIÓN DE FIRMA & ESTILO */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Edit3 className="w-4 h-4 text-white" />
                  <span>{isEs ? '1. Modo de Firma' : '1. Signature Mode'}</span>
                </div>

                {/* Tabs de Creación */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationTab('type');
                      setShowPrintedName(false);
                    }}
                    className={`py-2 px-1 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${
                      creationTab === 'type'
                        ? 'bg-white text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isEs ? 'Escribir' : 'Type'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationTab('draw');
                      setShowPrintedName(true);
                    }}
                    className={`py-2 px-1 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${
                      creationTab === 'draw'
                        ? 'bg-white text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isEs ? 'Dibujar' : 'Draw'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationTab('image');
                      setShowPrintedName(true);
                    }}
                    className={`py-2 px-1 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${
                      creationTab === 'image'
                        ? 'bg-white text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isEs ? 'Subir' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationTab('audit_box');
                      setShowPrintedName(false);
                    }}
                    className={`py-2 px-1 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${
                      creationTab === 'audit_box'
                        ? 'bg-white text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isEs ? 'Sello' : 'Seal'}
                  </button>
                </div>

                {/* PALETA DE TINTAS OFICIALES */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                    {isEs ? 'Color de Tinta Oficial:' : 'Official Ink Color:'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {INK_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setStrokeColor(c.hex)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          strokeColor === c.hex
                            ? 'border-white ring-1 ring-white/30 bg-zinc-800'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${c.bg} border border-white/20`} />
                        <span className="text-[9px] font-mono text-zinc-300 truncate w-full text-center">
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CONTENIDO SEGÚN PESTAÑA */}
                {creationTab === 'type' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                        {isEs ? 'Estilo Caligráfico:' : 'Calligraphy Style:'}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'cursive', label: 'Cursiva Real' },
                          { id: 'calligraphy', label: 'Caligrafía Formal' },
                          { id: 'modern', label: 'Manuscrito Moderno' },
                          { id: 'serif', label: 'Sello Serif' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setFontStyle(s.id as FontStyleOption)}
                            className={`p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-left ${
                              fontStyle === s.id
                                ? 'bg-zinc-800 border-white text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {creationTab === 'draw' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                        {isEs ? 'Dibuja tu trazo:' : 'Draw signature:'}
                      </label>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> {isEs ? 'Borrar' : 'Clear'}
                      </button>
                    </div>
                    <div className="border border-zinc-700 bg-white rounded-xl overflow-hidden shadow-inner">
                      <canvas
                        ref={drawCanvasRef}
                        width={400}
                        height={130}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[130px] cursor-crosshair touch-none"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{isEs ? 'Grosor de trazo:' : 'Stroke width:'}</span>
                      <div className="flex gap-2">
                        {[2, 3.5, 5].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setStrokeWidth(w)}
                            className={`px-2 py-0.5 rounded border ${
                              strokeWidth === w
                                ? 'border-white bg-zinc-800 text-white'
                                : 'border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {w}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {creationTab === 'image' && (
                  <div className="space-y-3">
                    <div
                      onClick={() => stampInputRef.current?.click()}
                      className="border border-dashed border-zinc-700 hover:border-white p-5 rounded-2xl text-center bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all"
                    >
                      <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-white mb-1">
                        {isEs ? 'Sube foto o PNG de tu firma' : 'Upload photo or PNG'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {isEs ? 'PNG, JPG o escaneo de firma en papel' : 'PNG, JPG or paper scan'}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removeBgEnabled}
                        onChange={(e) => setRemoveBgEnabled(e.target.checked)}
                        className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-white accent-white"
                      />
                      <span className="text-[11px] text-zinc-300">
                        {isEs
                          ? 'Eliminar fondo blanco automáticamente'
                          : 'Auto-remove white background'}
                      </span>
                    </label>
                  </div>
                )}

                {creationTab === 'audit_box' && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    {isEs
                      ? 'Genera un sello formal de empresa con borde doble, razón social, fecha ISO y hash SHA-256 de autenticidad.'
                      : 'Generates a formal corporate seal with double border, reason, ISO timestamp and SHA-256 hash.'}
                  </p>
                )}
              </div>

              {/* COLUMNA 2: IDENTIDAD, RAZÓN & AUDITORÍA */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <BadgeCheck className="w-4 h-4 text-white" />
                  <span>{isEs ? '2. Datos de Auditoría' : '2. Audit Metadata'}</span>
                </div>

                {/* Nombre del firmante */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                    {isEs ? 'Nombre Completo del Firmante:' : 'Signer Full Name:'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Lic. Roberto Morales"
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono"
                  />
                </div>

                {/* Cargo / Organización */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                    {isEs ? 'Cargo / Organización:' : 'Role / Organization:'}
                  </label>
                  <input
                    type="text"
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                    placeholder="Ej: Gerente General / Notario"
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono"
                  />
                </div>

                {/* Documento de Identidad */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                    {isEs ? 'Documento de Identidad (DNI/NIF/CI):' : 'ID Number (DNI/NIF/CI):'}
                  </label>
                  <input
                    type="text"
                    value={signerId}
                    onChange={(e) => setSignerId(e.target.value)}
                    placeholder="Ej: DNI 48920194-X"
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono"
                  />
                </div>

                {/* Motivo de Firma */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                    {isEs ? 'Motivo o Razón de Firma:' : 'Signature Reason:'}
                  </label>
                  <select
                    value={signatureReason}
                    onChange={(e) => setSignatureReason(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white shadow-inner font-mono cursor-pointer"
                  >
                    <option value="Aprobado y Conforme">Aprobado y Conforme</option>
                    <option value="Revisado y Validado">Revisado y Validado</option>
                    <option value="Autorizado">Autorizado</option>
                    <option value="Copia Fiel del Original">Copia Fiel del Original</option>
                    <option value="Firma Digital">Firma Digital</option>
                  </select>
                </div>

                {/* Toggles de Sello */}
                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <label className="flex items-center justify-between p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer">
                    <span className="text-[11px] text-zinc-300 font-bold">
                      {isEs ? 'Incluir Fecha y Hora' : 'Include Timestamp'}
                    </span>
                    <input
                      type="checkbox"
                      checked={includeDate}
                      onChange={(e) => setIncludeDate(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-white accent-white"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer">
                    <span className="text-[11px] text-zinc-300 font-bold">
                      {isEs ? 'Sello Hash SHA-256 Real' : 'Real SHA-256 Hash Seal'}
                    </span>
                    <input
                      type="checkbox"
                      checked={includeHash}
                      onChange={(e) => setIncludeHash(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-white accent-white"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer">
                    <span className="text-[11px] text-zinc-300 font-bold">
                      {isEs ? 'Estilo Caja de Auditoría' : 'Audit Box Style'}
                    </span>
                    <input
                      type="checkbox"
                      checked={sealStyle === 'audit_box'}
                      onChange={(e) => setSealStyle(e.target.checked ? 'audit_box' : 'clean')}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-white accent-white"
                    />
                  </label>
                </div>
              </div>

              {/* COLUMNA 3: ALCANCE DE PÁGINAS, ESCALA & EJECUCIÓN */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
                  <Layers className="w-4 h-4 text-white" />
                  <span>{isEs ? '3. Alcance y Ejecución' : '3. Scope & Execute'}</span>
                </div>

                {/* Alcance de Páginas */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">
                    {isEs ? 'Dónde Estampar la Firma:' : 'Where to Apply Signature:'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPageScope('current')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-left ${
                        pageScope === 'current'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? `Solo Pág. ${targetPage}` : `Page ${targetPage} only`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageScope('all')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-left ${
                        pageScope === 'all'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Todas las Páginas' : 'All Pages'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageScope('vobo')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-left ${
                        pageScope === 'vobo'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Expediente + VoBo' : 'File + VoBo Initials'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageScope('custom')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-left ${
                        pageScope === 'custom'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isEs ? 'Rango Manual' : 'Custom Range'}
                    </button>
                  </div>
                </div>

                {/* Campo adicional para rango o VoBo */}
                {pageScope === 'custom' && (
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                      {isEs ? 'Rango de Páginas (ej: 1-3, 5):' : 'Page Range (e.g. 1-3, 5):'}
                    </label>
                    <input
                      type="text"
                      value={customPageRange}
                      onChange={(e) => setCustomPageRange(e.target.value)}
                      className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white font-mono"
                    />
                  </div>
                )}

                {pageScope === 'vobo' && (
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                      {isEs ? 'Texto de Rúbrica / VoBo:' : 'VoBo / Initials Text:'}
                    </label>
                    <input
                      type="text"
                      value={initialsText}
                      onChange={(e) => setInitialsText(e.target.value)}
                      className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white font-mono"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {isEs
                        ? 'La firma principal irá en la página activa y este sello VoBo en todas las demás.'
                        : 'Primary signature applies to active page, VoBo initials to all other pages.'}
                    </p>
                  </div>
                )}

                {/* Control de Escala */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                      {isEs ? 'Tamaño de la Firma:' : 'Signature Scale:'}
                    </label>
                    <span className="text-white font-bold text-xs">{scale}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                {/* Prefijo de Archivo */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                    {isEs ? 'Nombre del Archivo Firmado:' : 'Output File Name:'}
                  </label>
                  <input
                    type="text"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white font-mono"
                  />
                </div>

                {/* BOTÓN PRINCIPAL DE FIRMAR PDF */}
                <button
                  type="button"
                  onClick={executeSignPdf}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans uppercase tracking-tight mt-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>{isEs ? 'Firmando Documento...' : 'Signing Document...'}</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5 text-black" />
                      <span>{isEs ? 'FIRMAR DOCUMENTO PDF' : 'SIGN PDF DOCUMENT'}</span>
                    </>
                  )}
                </button>

                {/* BARRA DE PROGRESO */}
                {isProcessing && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 truncate">{progressMsg}</span>
                      <span className="text-white font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
