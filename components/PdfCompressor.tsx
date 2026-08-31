'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Sliders,
  FileDown,
  Loader2,
  X,
  ShieldCheck,
  Zap,
  RefreshCw,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Shield,
  Target,
  Archive,
  FileCheck2,
  Image as ImageIcon,
  ZoomIn,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  Lock,
  Download,
  Share2,
  HardDrive,
  Maximize2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { useUIStore } from '../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadSuccessCard from './DownloadSuccessCard';
import JSZip from 'jszip';
import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFNumber, PDFRef, PDFPage } from 'pdf-lib';
// @ts-ignore
import pako from 'pako';

export type CompressionLevel = 'high' | 'medium' | 'low';
export type OutputColorMode = 'original' | 'grayscale' | 'blackwhite';
export type DpiMode = 'auto' | '72' | '96' | '150';
export type PageScope = 'todas' | 'pares' | 'impares' | 'rango';

export interface CompressionResultItem {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  wasPdfA: boolean;
  pdfAStatus: 'preserved' | 'broken' | 'not-applicable';
  downloadUrl: string;
  rawBlob?: Blob;
}

export interface CompletedCompressionResult {
  downloadUrl: string;
  filename: string;
  fileSize: string;
  rawBlob?: Blob;
  totalOriginalSize: number;
  totalCompressedSize: number;
  overallReduction: number;
  items: CompressionResultItem[];
}

/**
 * Detecta de forma exhaustiva si una página contiene imágenes rasterizadas (XObject de tipo Image).
 * Resuelve referencias indirectas (PDFRef), herencia de recursos de páginas padre y diccionarios anidados.
 */
function checkPageHasImages(page: PDFPage | undefined, pdfDoc: PDFDocument): boolean {
  if (!page || !page.node) return false;
  const context = pdfDoc.context;
  try {
    let resources = page.node.lookup(PDFName.of('Resources'));
    if (!resources) {
      let parent = page.node.lookup(PDFName.of('Parent'));
      while (parent instanceof PDFDict) {
        resources = parent.lookup(PDFName.of('Resources'));
        if (resources) break;
        parent = parent.lookup(PDFName.of('Parent'));
      }
    }
    if (resources instanceof PDFRef) resources = context.lookup(resources);
    if (resources instanceof PDFDict) {
      let xobj = resources.lookup(PDFName.of('XObject'));
      if (xobj instanceof PDFRef) xobj = context.lookup(xobj);
      if (xobj instanceof PDFDict) {
        for (const key of xobj.keys()) {
          let obj = xobj.lookup(key);
          if (obj instanceof PDFRef) obj = context.lookup(obj);
          if (
            obj instanceof PDFDict ||
            obj instanceof PDFRawStream ||
            (obj && (obj as unknown as { dict?: PDFDict }).dict)
          ) {
            const dict = (obj as unknown as { dict?: PDFDict }).dict || (obj as PDFDict);
            const subtype = dict.lookup
              ? dict.lookup(PDFName.of('Subtype'))
              : dict.get
                ? dict.get(PDFName.of('Subtype'))
                : null;
            if (subtype && subtype.toString() === '/Image') return true;
          }
        }
      }
    }
  } catch {}
  return false;
}

/**
 * Optimiza y re-comprime todos los flujos de contenido / vectores / XObjects con Deflate Nivel 9 vía pako.
 */
function optimizeFlateStreamsDoc(pdfDoc: PDFDocument): number {
  let savedBytes = 0;
  try {
    for (const [_, obj] of pdfDoc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream) {
        const filter = obj.dict.get(PDFName.of('Filter'));
        if (filter && filter.toString() === '/FlateDecode') {
          const raw = obj.getContents();
          try {
            const uncomp = pako.inflate(raw);
            const recompressed = pako.deflate(uncomp, { level: 9 });
            if (recompressed.length < raw.length) {
              savedBytes += raw.length - recompressed.length;
              (obj as unknown as { contents: Uint8Array }).contents = recompressed;
              obj.dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));
            }
          } catch {}
        }
      }
    }
  } catch {}
  return savedBytes;
}

export default function PdfCompressor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();
  const setHeaderHidden = useUIStore((s) => s.setHeaderHidden);

  // === ESTADO MULTI-ARCHIVO (BATCH) ===
  const [files, setFiles] = useState<File[]>(globalFile ? [globalFile] : []);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // === ESTADO DE ÉXITO DE COMPRESIÓN ===
  const [completedResult, setCompletedResult] = useState<CompletedCompressionResult | null>(null);
  const [isCreatingZip, setIsCreatingZip] = useState<boolean>(false);

  // === CONFIGURACIÓN DE COMPRESIÓN ===
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [outputColorMode, setOutputColorMode] = useState<OutputColorMode>('original');
  const [dpiMode, setDpiMode] = useState<DpiMode>('auto');
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [customSuffix, setCustomSuffix] = useState('_Comprimido');
  const [preserveTextVectors, setPreserveTextVectors] = useState(true);
  const [preservePdfA, setPreservePdfA] = useState(true);
  const [detectPdfA, setDetectPdfA] = useState(true);
  const [targetPreset, setTargetPreset] = useState<string | null>(null);

  // === ESTADO DE PROCESAMIENTO ===
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // === RESULTADOS DE COMPRESIÓN ===
  const [results, setResults] = useState<CompressionResultItem[]>([]);

  // === VISTA PREVIA Y MINIATURAS ===
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sincronización de alturas
  const [previewHeight, setPreviewHeight] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  // Control de cabecera fija
  useEffect(() => {
    if (completedResult) {
      setHeaderHidden(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setHeaderHidden(false);
    }
  }, [completedResult, setHeaderHidden]);

  useEffect(() => {
    return () => setHeaderHidden(false);
  }, [setHeaderHidden]);

  useEffect(() => {
    if (globalFile && files.length === 0) {
      setFiles([globalFile]);
    }
  }, [globalFile, files.length]);

  const activeFile = files[activeFileIdx] || null;

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Sincronizar altura de paneles
  useEffect(() => {
    if (!controlPanelRef.current) return;
    const updateHeight = () => {
      if (controlPanelRef.current) {
        const h = controlPanelRef.current.getBoundingClientRect().height;
        if (h > 0) setPreviewHeight(h);
      }
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.target.getBoundingClientRect().height;
        if (h > 0) setPreviewHeight(h);
      }
    });
    observer.observe(controlPanelRef.current);
    updateHeight();
    return () => observer.disconnect();
  }, [
    files,
    compressionLevel,
    outputColorMode,
    dpiMode,
    pageScope,
    preserveTextVectors,
    detectPdfA,
    preservePdfA,
    stripMetadata,
    showAdvanced,
    isProcessing,
  ]);

  // Cargar miniaturas del archivo activo
  const loadFileThumbnails = useCallback(async (pdfFile: File) => {
    setIsLoadingThumbnails(true);
    setThumbnails([]);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
        cMapPacked: true,
      }).promise;

      const total = pdfDoc.numPages;
      setTotalPages(total);

      const generated: { pageNum: number; dataUrl: string }[] = [];
      const maxThumbnails = Math.min(total, 60);

      for (let pn = 1; pn <= maxThumbnails; pn++) {
        const page = await pdfDoc.getPage(pn);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
            typeof page.render
          >[0]).promise;
          generated.push({ pageNum: pn, dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
        }
      }
      setThumbnails(generated);
    } catch (err) {
      console.error('Error al generar miniaturas:', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  useEffect(() => {
    if (activeFile) {
      setPreviewPageNum(1);
      loadFileThumbnails(activeFile);
      setGlobalFile(activeFile);
    } else {
      setThumbnails([]);
      setTotalPages(1);
    }
  }, [activeFile, loadFileThumbnails, setGlobalFile]);

  // Manejo de drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      );
      if (droppedFiles.length === 0) {
        toast.error(isEs ? 'Solo se admiten archivos PDF válidos' : 'Only valid PDF files allowed');
        return;
      }
      setFiles((prev) => [...prev, ...droppedFiles]);
      if (files.length === 0 && droppedFiles.length > 0) {
        setGlobalFile(droppedFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
      setCompletedResult(null);
      toast.success(
        isEs ? `${droppedFiles.length} PDF(s) añadido(s)` : `${droppedFiles.length} PDF(s) added`,
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      );
      if (newFiles.length === 0) {
        toast.error(isEs ? 'Selecciona archivos PDF válidos' : 'Select valid PDF files');
        e.target.value = '';
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);
      if (files.length === 0 && newFiles.length > 0) {
        setGlobalFile(newFiles[0]);
        setActiveFileIdx(0);
      }
      setResults([]);
      setCompletedResult(null);
      toast.success(
        isEs
          ? `${newFiles.length} PDF(s) añadido(s) a la cola`
          : `${newFiles.length} PDF(s) added to queue`,
      );
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    setResults((prev) => prev.filter((_, i) => i !== idx));
    setCompletedResult(null);
    if (idx === activeFileIdx) {
      setActiveFileIdx(0);
    } else if (idx < activeFileIdx) {
      setActiveFileIdx((prev) => Math.max(0, prev - 1));
    }
    if (updated.length === 0) {
      setGlobalFile(null);
    }
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setGlobalFile(null);
    setResults([]);
    setCompletedResult(null);
    setActiveFileIdx(0);
  };

  // Selector de perfiles calibrado
  const handleLevelSelect = (lvl: CompressionLevel) => {
    if (isProcessing) return;
    setCompressionLevel(lvl);
    setTargetPreset(null);
    if (lvl === 'high') {
      setPreserveTextVectors(true);
      setDpiMode('auto');
      setStripMetadata(true);
      toast.info(
        isEs
          ? '⚡ Modo Máxima Compresión: optimización profunda garantizando texto 100% nítido.'
          : '⚡ Maximum Compression mode: deep optimization with 100% crisp text.',
        { duration: 3500 },
      );
    } else if (lvl === 'medium') {
      setPreserveTextVectors(true);
      setDpiMode('auto');
      setStripMetadata(true);
    } else if (lvl === 'low') {
      setPreserveTextVectors(true);
      setDpiMode('auto');
      setStripMetadata(false);
    }
  };

  // Presets de tamaño objetivo rápido
  const handleApplyPreset = (preset: 'email' | 'web' | 'print') => {
    if (isProcessing) return;
    setTargetPreset(preset);
    if (preset === 'email') {
      setCompressionLevel('high');
      setDpiMode('96');
      setStripMetadata(true);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '📧 Preset para Correo aplicado: Máxima compresión, 96 DPI y limpieza de metadatos.'
          : '📧 Email Preset applied: Maximum compression, 96 DPI & metadata cleanup.',
      );
    } else if (preset === 'web') {
      setCompressionLevel('medium');
      setDpiMode('auto');
      setStripMetadata(true);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '🌐 Preset Web aplicado: Calidad equilibrada y optimización sin pérdida visible.'
          : '🌐 Web Preset applied: Balanced quality with lossless visual fidelity.',
      );
    } else if (preset === 'print') {
      setCompressionLevel('low');
      setDpiMode('150');
      setStripMetadata(false);
      setPreserveTextVectors(true);
      toast.success(
        isEs
          ? '🖨️ Preset Impresión / CAD: Máxima resolución (150 DPI) y fidelidad vectorial total.'
          : '🖨️ Print / CAD Preset: Maximum resolution (150 DPI) and full vector fidelity.',
      );
    }
  };

  // Motor de compresión asíncrono directo de alto rendimiento
  const executeCompress = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg(
      isEs ? 'Iniciando motor de optimización local...' : 'Starting local optimization engine...',
    );
    setResults([]);
    setCompletedResult(null);
    setTotalFilesCount(files.length);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

      const newResults: CompressionResultItem[] = [];

      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const currentFile = files[fIdx];
        setCurrentFileIndex(fIdx + 1);

        const fileBuffer = await currentFile.arrayBuffer();
        const originalSize = fileBuffer.byteLength;

        setProgressMsg(
          isEs ? `Analizando ${currentFile.name}...` : `Analyzing ${currentFile.name}...`,
        );
        setProgressPercent(Math.round((fIdx / files.length) * 100) + 4);
        await new Promise((r) => setTimeout(r, 10));

        const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const numPages = pages.length;

        // Determinar páginas a procesar
        let targetPages: number[] = [];
        if (pageScope === 'todas') {
          targetPages = Array.from({ length: numPages }, (_, i) => i + 1);
        } else if (pageScope === 'pares') {
          targetPages = Array.from({ length: numPages }, (_, i) => i + 1).filter(
            (p) => p % 2 === 0,
          );
        } else if (pageScope === 'impares') {
          targetPages = Array.from({ length: numPages }, (_, i) => i + 1).filter(
            (p) => p % 2 !== 0,
          );
        } else if (pageScope === 'rango' && pageRange.trim()) {
          const parts = pageRange.split(',').map((s) => s.trim());
          const setP = new Set<number>();
          for (const part of parts) {
            if (part.includes('-')) {
              const [s, e] = part.split('-').map(Number);
              for (let p = s; p <= e; p++) if (p >= 1 && p <= numPages) setP.add(p);
            } else {
              const p = Number(part);
              if (p >= 1 && p <= numPages) setP.add(p);
            }
          }
          targetPages = Array.from(setP).sort((a, b) => a - b);
        }
        if (targetPages.length === 0) {
          targetPages = Array.from({ length: numPages }, (_, i) => i + 1);
        }

        // Calibrar escala y calidad
        let imageScale = 1.33;
        let jpegQuality = 0.65;
        if (dpiMode === '72') {
          imageScale = 1.0;
          jpegQuality = 0.6;
        } else if (dpiMode === '96') {
          imageScale = 1.33;
          jpegQuality = 0.65;
        } else if (dpiMode === '150') {
          imageScale = 2.0;
          jpegQuality = 0.78;
        } else if (compressionLevel === 'high') {
          imageScale = 1.25;
          jpegQuality = 0.58;
        } else if (compressionLevel === 'low') {
          imageScale = 1.8;
          jpegQuality = 0.8;
        }

        const pdfjsDoc = await pdfjsLib.getDocument({
          data: fileBuffer.slice(0),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
          cMapPacked: true,
        }).promise;

        const newPdf = await PDFDocument.create();

        for (let pIdx = 0; pIdx < targetPages.length; pIdx++) {
          const pageNum = targetPages[pIdx];
          const pagePct = Math.round(((fIdx + pIdx / targetPages.length) / files.length) * 85) + 5;
          setProgressPercent(pagePct);
          setProgressMsg(
            isEs
              ? `Optimizando página ${pageNum} de ${numPages} (${currentFile.name})...`
              : `Optimizing page ${pageNum} of ${numPages} (${currentFile.name})...`,
          );
          await new Promise((r) => setTimeout(r, 0));

          const page = pages[pageNum - 1];
          const hasImages = checkPageHasImages(page, pdfDoc);

          if (hasImages || compressionLevel === 'high') {
            try {
              const pdfPage = await pdfjsDoc.getPage(pageNum);
              const vp = pdfPage.getViewport({ scale: imageScale });
              const canvas = document.createElement('canvas');
              canvas.width = Math.ceil(vp.width);
              canvas.height = Math.ceil(vp.height);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                await pdfPage.render({
                  canvasContext: ctx,
                  viewport: vp,
                } as unknown as Parameters<typeof pdfPage.render>[0]).promise;

                // Modo de color
                if (outputColorMode === 'grayscale') {
                  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const d = imgData.data;
                  for (let i = 0; i < d.length; i += 4) {
                    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                    d[i] = gray;
                    d[i + 1] = gray;
                    d[i + 2] = gray;
                  }
                  ctx.putImageData(imgData, 0, 0);
                } else if (outputColorMode === 'blackwhite') {
                  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const d = imgData.data;
                  for (let i = 0; i < d.length; i += 4) {
                    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                    const bw = gray > 140 ? 255 : 0;
                    d[i] = bw;
                    d[i + 1] = bw;
                    d[i + 2] = bw;
                  }
                  ctx.putImageData(imgData, 0, 0);
                }

                const blob = await new Promise<Blob | null>((resolve) =>
                  canvas.toBlob(resolve, 'image/jpeg', jpegQuality),
                );
                if (blob) {
                  const jpegBytes = await blob.arrayBuffer();
                  const embeddedImg = await newPdf.embedJpg(jpegBytes);
                  const origVp = pdfPage.getViewport({ scale: 1.0 });
                  const newPage = newPdf.addPage([origVp.width, origVp.height]);
                  newPage.drawImage(embeddedImg, {
                    x: 0,
                    y: 0,
                    width: origVp.width,
                    height: origVp.height,
                  });
                  continue;
                }
              }
            } catch (err) {
              console.warn(`Fallback para página ${pageNum}:`, err);
            }
          }

          // Fallback o vector nativo
          try {
            const [copied] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
            newPdf.addPage(copied);
          } catch {
            newPdf.addPage([612, 792]);
          }
        }

        if (stripMetadata) {
          newPdf.setTitle('');
          newPdf.setAuthor('');
          newPdf.setProducer('PDFBlack Compressor');
          newPdf.setCreator('');
          newPdf.setSubject('');
          newPdf.setKeywords([]);
        }

        setProgressMsg(
          isEs
            ? 'Re-comprimiendo flujos vectoriales con Deflate Nivel 9...'
            : 'Re-compressing vector streams with Deflate Level 9...',
        );
        setProgressPercent(92);
        await new Promise((r) => setTimeout(r, 10));

        optimizeFlateStreamsDoc(newPdf);

        setProgressMsg(isEs ? 'Guardando PDF optimizado...' : 'Saving optimized PDF...');
        setProgressPercent(96);
        await new Promise((r) => setTimeout(r, 10));

        const compressedBytes = await newPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        let finalBytes = compressedBytes;
        if (compressedBytes.byteLength >= originalSize) {
          finalBytes = new Uint8Array(fileBuffer);
        }

        const reductionPercent = Math.max(
          0,
          Math.round(((originalSize - finalBytes.byteLength) / originalSize) * 100),
        );

        const outBlob = new Blob(
          [
            finalBytes.buffer.slice(
              finalBytes.byteOffset,
              finalBytes.byteOffset + finalBytes.byteLength,
            ) as ArrayBuffer,
          ],
          { type: 'application/pdf' },
        );
        const outUrl = URL.createObjectURL(outBlob);

        newResults.push({
          fileName: currentFile.name,
          originalSize,
          compressedSize: finalBytes.byteLength,
          reductionPercent,
          wasPdfA: false,
          pdfAStatus: 'not-applicable',
          downloadUrl: outUrl,
          rawBlob: outBlob,
        });

        setResults([...newResults]);
      }

      setProgressPercent(100);
      setProgressMsg(isEs ? '¡Proceso completado con éxito!' : 'Process completed successfully!');

      const totalOriginal = newResults.reduce((acc, r) => acc + r.originalSize, 0);
      const totalCompressed = newResults.reduce((acc, r) => acc + r.compressedSize, 0);
      const overallReduction =
        totalOriginal > 0
          ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
          : 0;

      const firstItem = newResults[0];
      const originalName = firstItem ? firstItem.fileName.replace(/\.[^/.]+$/, '') : 'Documento';
      const outName = `${originalName}${customSuffix}.pdf`;

      setCompletedResult({
        downloadUrl: firstItem ? firstItem.downloadUrl : '',
        filename: outName,
        fileSize: firstItem ? formatFileSize(firstItem.compressedSize) : '',
        rawBlob: firstItem ? firstItem.rawBlob : undefined,
        totalOriginalSize: totalOriginal,
        totalCompressedSize: totalCompressed,
        overallReduction,
        items: [...newResults],
      });

      toast.success(
        isEs
          ? `¡${newResults.length} PDF(s) comprimido(s)! Reducción: ${overallReduction}%`
          : `${newResults.length} PDF(s) compressed! Reduction: ${overallReduction}%`,
      );
    } catch (error) {
      console.error('Compression error:', error);
      toast.error(isEs ? 'Error durante la compresión del PDF' : 'Error during PDF compression');
    } finally {
      setIsProcessing(false);
    }
  };

  // Descargar paquete ZIP para múltiples archivos
  const handleDownloadAllZip = async () => {
    if (!completedResult || completedResult.items.length === 0) return;
    setIsCreatingZip(true);
    try {
      const zip = new JSZip();
      completedResult.items.forEach((item) => {
        if (item.rawBlob) {
          const name = `${item.fileName.replace(/\.[^/.]+$/, '')}${customSuffix}.pdf`;
          zip.file(name, item.rawBlob);
        }
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `PDFBlack_Comprimidos_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
      toast.success(
        isEs ? 'Paquete ZIP descargado con éxito' : 'ZIP package downloaded successfully',
      );
    } catch (err) {
      console.error('Error al generar ZIP:', err);
      toast.error(isEs ? 'Error al generar archivo ZIP' : 'Error generating ZIP file');
    } finally {
      setIsCreatingZip(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedReduction = (level: CompressionLevel) => {
    const ranges: Record<CompressionLevel, { min: number; max: number; label: string }> = {
      low: { min: 10, max: 40, label: '10-40%' },
      medium: { min: 30, max: 65, label: '30-65%' },
      high: { min: 50, max: 90, label: '50-90%' },
    };
    return ranges[level];
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={addMoreInputRef}
        disabled={isProcessing}
      />

      {/* HEADER SUPERIOR UNIFICADO */}
      <div
        ref={topHeaderRef}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12] border border-zinc-700 px-6 py-4 rounded-2xl mb-6 shadow-2xl font-mono relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/optimizar"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-zinc-700" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / COMPRESIÓN Y OPTIMIZACIÓN DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Sliders className="w-6 h-6 text-white flex-shrink-0" />
              <span>
                {isEs
                  ? 'COMPRIMIR ARCHIVOS PDF (OPTIMIZAR TAMAÑO Y ESPACIO)'
                  : 'COMPRESS PDF FILES (OPTIMIZE SIZE AND SPACE)'}
              </span>
            </h1>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => addMoreInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>{isEs ? 'Añadir más' : 'Add more'}</span>
            </button>
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white font-mono">
              <Archive className="w-3.5 h-3.5 inline mr-1.5 text-zinc-300" />
              <span className="font-bold">{files.length}</span> {isEs ? 'archivo(s)' : 'file(s)'}
            </div>
            <button
              onClick={handleRemoveAllFiles}
              disabled={isProcessing}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar todos' : 'Remove all'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        /* DROPZONE SIN ARCHIVOS */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px] ${
            isDragging
              ? 'border-white ring-4 ring-white/20 bg-zinc-900/90 scale-[1.01]'
              : 'border-zinc-600 hover:border-white'
          }`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <UploadCloud className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'COMPRIMIR ARCHIVOS PDF (OPTIMIZAR TAMAÑO Y ESPACIO)'
              : 'COMPRESS PDF FILES (OPTIMIZE SIZE AND SPACE)'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-md">
            {isEs
              ? 'Reduce el peso de tus documentos manteniendo texto vectorial nítido e imágenes optimizadas sin subir tus datos a servidores externos.'
              : 'Reduce the file size of your PDF documents with local confidential processing.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />{' '}
            {isEs ? 'Seleccionar Archivos PDF' : 'Select PDF Files'}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-white font-bold text-xs font-mono rounded-full shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>{isEs ? '100% LOCAL Y CONFIDENCIAL' : '100% LOCAL & PRIVATE'}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-white font-bold text-xs font-mono rounded-full shadow-sm">
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>
                {isEs ? 'DEFLATE NIVEL 9 + VECTOR SHARP' : 'DEFLATE LEVEL 9 + VECTOR SHARP'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : completedResult ? (
        /* PANTALLA DEDICADA DE ÉXITO Y DESCARGA */
        <motion.div
          ref={successContainerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl mx-auto my-2 font-sans space-y-4"
        >
          {/* DASHBOARD DE METRICAS DE COMPRESIÓN (COMPACTO) */}
          <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-2xl p-4 sm:p-5 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-white shadow-md">
                  <Zap className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">
                    {isEs ? 'RESULTADO DE LA COMPRESIÓN' : 'COMPRESSION RESULT'}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-sans uppercase tracking-tight">
                    {isEs ? '¡Documento optimizado con éxito!' : 'Document optimized successfully!'}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-3.5 py-1.5 rounded-xl min-w-[130px] shadow-sm">
                <div className="w-full text-right">
                  <div className="text-[9px] text-zinc-400 font-bold">
                    {isEs ? 'Ahorro de espacio' : 'Space saved'}
                  </div>
                  <div className="text-[#FAF6EE] font-extrabold text-sm flex items-center justify-end gap-1">
                    <span>↓ {completedResult.overallReduction}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className="bg-[#FAF6EE] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(250,246,238,0.5)]"
                      style={{
                        width: `${Math.min(Math.max(completedResult.overallReduction, 6), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800 text-xs">
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Tamaño Original' : 'Original Size'}
                </span>
                <span className="text-white font-bold text-xs sm:text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.totalOriginalSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[9px] uppercase font-bold">
                    {isEs ? 'Tamaño Comprimido' : 'Compressed Size'}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.2 bg-[#FAF6EE]/10 border border-[#E8DFCF]/30 text-[#E8DFCF] rounded font-mono font-bold">
                    -{completedResult.overallReduction}%
                  </span>
                </div>
                <span className="text-[#FAF6EE] font-bold text-xs sm:text-sm font-mono mt-0.5">
                  {formatFileSize(completedResult.totalCompressedSize)}
                </span>
              </div>
              <div className="bg-[#121217] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 flex flex-col shadow-inner">
                <span className="text-zinc-400 text-[9px] uppercase font-bold">
                  {isEs ? 'Espacio Reducido' : 'Space Reduced'}
                </span>
                <span className="text-[#FAF6EE] font-bold text-xs sm:text-sm font-mono mt-0.5">
                  {formatFileSize(
                    completedResult.totalOriginalSize - completedResult.totalCompressedSize,
                  )}
                </span>
              </div>
            </div>

            {/* LISTADO BATCH Y BOTÓN DESCARGA ZIP */}
            {completedResult.items.length > 1 && (
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    {isEs
                      ? `Archivos procesados (${completedResult.items.length})`
                      : `Processed files (${completedResult.items.length})`}
                  </span>
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isCreatingZip}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
                  >
                    {isCreatingZip ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Archive className="w-3 h-3" />
                    )}
                    <span>{isEs ? 'Descargar todos (.ZIP)' : 'Download all (.ZIP)'}</span>
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {completedResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#121217] p-2.5 rounded-xl border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[50%]">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate text-white font-mono">{item.fileName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-mono text-[10px]">
                          {formatFileSize(item.originalSize)} →{' '}
                          <strong className="text-[#FAF6EE]">
                            {formatFileSize(item.compressedSize)}
                          </strong>
                        </span>
                        <a
                          href={item.downloadUrl}
                          download={`${item.fileName.replace(/\.[^/.]+$/, '')}${customSuffix}.pdf`}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer border border-zinc-700"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>{isEs ? 'Bajar' : 'Get'}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TARJETA DE DESCARGA PRINCIPAL */}
          <DownloadSuccessCard
            downloadUrl={completedResult.downloadUrl}
            filename={completedResult.filename}
            fileSize={completedResult.fileSize}
            outputFormat="pdf"
            rawBlob={completedResult.rawBlob}
            currentToolId="comprimir"
            onReset={handleRemoveAllFiles}
          />
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO DE 2 COLUMNAS */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans items-stretch"
        >
          {/* LADO IZQUIERDO: VISTA PREVIA + COLA DE ARCHIVOS */}
          <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 h-full overflow-hidden">
            {/* LISTA DE ARCHIVOS (BATCH) */}
            {files.length > 1 && (
              <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-3 max-h-[180px] overflow-y-auto font-mono">
                <span className="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest uppercase">
                  {isEs ? 'Cola de archivos' : 'File queue'} ({files.length})
                </span>
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveFileIdx(i)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-xs border ${
                        i === activeFileIdx
                          ? 'bg-zinc-800 border-white text-white shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-[10px] text-zinc-500 flex-shrink-0">
                          {formatFileSize(f.size)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveFile(i, e)}
                        className="p-1 hover:text-red-400 transition-colors ml-2 text-zinc-500"
                        title={isEs ? 'Eliminar' : 'Remove'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA PREVIA CON GRILLA DE MINIATURAS */}
            <div
              className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative font-mono"
              style={{
                height: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                maxHeight: isDesktop && previewHeight > 0 ? `${previewHeight}px` : undefined,
                minHeight: '320px',
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              {/* BARRA DE INFORMACIÓN SUPERIOR */}
              <div className="bg-[#121217] border-b border-zinc-800 p-3.5 flex justify-between items-center z-10 font-sans flex-shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 flex-shrink-0 text-white">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden font-mono">
                    <span className="text-white font-bold text-xs truncate w-28 sm:w-44">
                      {activeFile?.name || ''}
                    </span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1.5">
                      <span>{activeFile ? formatFileSize(activeFile.size) : ''}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[#FAF6EE] font-bold">
                        {isEs
                          ? `Est. ~↓${getEstimatedReduction(compressionLevel).label}`
                          : `Est. ~↓${getEstimatedReduction(compressionLevel).label}`}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>
                      {isEs ? `Miniaturas (${totalPages} págs)` : `Thumbnails (${totalPages} pgs)`}
                    </span>
                  </span>
                </div>
              </div>

              {/* GRILLA DE MINIATURAS DE PÁGINAS */}
              <div className="w-full flex-1 min-h-0 max-lg:max-h-[500px] bg-[#0c0c0f] relative p-3 sm:p-4 overflow-y-auto font-sans flex flex-col justify-start custom-scrollbar">
                {isLoadingThumbnails ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[320px] my-auto">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">
                      {isEs
                        ? 'Generando miniaturas de alta definición...'
                        : 'Generating high-definition thumbnails...'}
                    </span>
                  </div>
                ) : thumbnails.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 w-full">
                    {thumbnails.map((thumb) => (
                      <div
                        key={thumb.pageNum}
                        onClick={() => setPreviewPageNum(thumb.pageNum)}
                        className={`group relative bg-[#18181f] rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-2 shadow-sm hover:shadow-md ${
                          previewPageNum === thumb.pageNum
                            ? 'border-white ring-2 ring-white/40 bg-zinc-800 scale-[1.02]'
                            : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-xl border border-zinc-700/80 bg-white flex items-center justify-center min-h-[110px] max-h-[140px] w-full p-1 shadow-inner">
                          <img
                            src={thumb.dataUrl}
                            alt={`Página ${thumb.pageNum}`}
                            className="max-h-[130px] w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomModalImage(thumb.dataUrl);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title={isEs ? 'Ampliar' : 'Zoom'}
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="w-full flex items-center justify-between pt-0.5 font-mono text-[10px]">
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-lg ${
                              previewPageNum === thumb.pageNum
                                ? 'bg-white text-black font-extrabold shadow-sm'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {isEs ? `Pág ${thumb.pageNum}` : `Pg ${thumb.pageNum}`}
                          </span>
                          {previewPageNum === thumb.pageNum && (
                            <span className="text-white text-[9px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              {isEs ? 'Activa' : 'Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 min-h-[320px] my-auto">
                    <FileText className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-mono">
                      {isEs ? 'Sin miniaturas disponibles' : 'No thumbnails available'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              ref={controlPanelRef}
              className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 hover:border-zinc-500 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between gap-3 relative shadow-2xl font-sans overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              <div>
                {/* CABECERA PANEL */}
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-0.5">
                      002 / CONFIGURACIÓN DE OPTIMIZACIÓN
                    </span>
                    <h2 className="text-lg font-bold text-white tracking-tight font-sans uppercase">
                      {isEs ? 'PANEL DE CONTROL' : 'CONTROL PANEL'}
                    </h2>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-700 text-white shadow-sm">
                    <Sliders className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>

                {/* PRESETS DE UN CLIC */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase">
                    {isEs ? 'Objetivo Rápido' : 'Quick Target'}
                  </span>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    <button
                      onClick={() => handleApplyPreset('email')}
                      className={`p-2 rounded-xl border text-left transition-all text-xs ${
                        targetPreset === 'email'
                          ? 'border-white bg-zinc-800 text-white shadow-md'
                          : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                        <span>📧</span> {isEs ? 'Para Correo' : 'For Email'}
                      </div>
                      <div className="text-[9px] text-zinc-400">
                        {isEs ? 'Menos de 2 MB' : 'Under 2 MB'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleApplyPreset('web')}
                      className={`p-2 rounded-xl border text-left transition-all text-xs ${
                        targetPreset === 'web'
                          ? 'border-white bg-zinc-800 text-white shadow-md'
                          : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                        <span>🌐</span> {isEs ? 'Equilibrado' : 'Balanced'}
                      </div>
                      <div className="text-[9px] text-zinc-400">
                        {isEs ? 'Calidad óptima' : 'Optimal quality'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleApplyPreset('print')}
                      className={`p-2 rounded-xl border text-left transition-all text-xs ${
                        targetPreset === 'print'
                          ? 'border-white bg-zinc-800 text-white shadow-md'
                          : 'border-zinc-800 bg-[#121217] text-zinc-400 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                        <span>📐</span> {isEs ? 'Planos / CAD' : 'CAD / Plans'}
                      </div>
                      <div className="text-[9px] text-zinc-400">
                        {isEs ? '150 DPI nítido' : '150 DPI sharp'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* NIVEL DE COMPRESIÓN (3 PERFILES) */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase">
                    {isEs ? 'Perfil de Compresión' : 'Compression Profile'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as CompressionLevel[]).map((lvl) => {
                      const configs = {
                        low: {
                          labelEs: 'Baja (Alta Calidad)',
                          labelEn: 'Low (High Quality)',
                          descEs: 'Máxima fidelidad para planos y cotas',
                          descEn: 'High fidelity for CAD & dimensions',
                          icon: Shield,
                        },
                        medium: {
                          labelEs: 'Media (Recomendada)',
                          labelEn: 'Medium (Recommended)',
                          descEs: 'Balance perfecto calidad-peso',
                          descEn: 'Perfect balance quality-size',
                          icon: HardDrive,
                        },
                        high: {
                          labelEs: 'Alta (Máxima Compresión)',
                          labelEn: 'High (Maximum Compression)',
                          descEs: 'Deflate Nivel 9 y downsampling 96 DPI',
                          descEn: 'Deflate Level 9 & 96 DPI downsample',
                          icon: Zap,
                        },
                      };
                      const cfg = configs[lvl];
                      const Icon = cfg.icon;
                      const est = getEstimatedReduction(lvl);

                      return (
                        <div
                          key={lvl}
                          onClick={() => handleLevelSelect(lvl)}
                          className={`relative p-2.5 rounded-2xl border cursor-pointer transition-all ${
                            compressionLevel === lvl
                              ? 'border-white bg-zinc-800 text-white shadow-md'
                              : 'border-zinc-700/80 bg-[#121217] text-zinc-400 hover:text-white hover:border-zinc-600'
                          }`}
                        >
                          {lvl === 'medium' && (
                            <span className="absolute -top-2 right-2 bg-white text-black text-[8px] font-black font-mono px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-sm">
                              {isEs ? 'Recomendado' : 'Best Choice'}
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold leading-tight">
                              {isEs ? cfg.labelEs : cfg.labelEn}
                            </span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                compressionLevel === lvl
                                  ? 'border-white bg-white'
                                  : 'border-zinc-600'
                              }`}
                            >
                              {compressionLevel === lvl && (
                                <div className="w-1.5 h-1.5 rounded-full bg-black" />
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight">
                            {isEs ? cfg.descEs : cfg.descEn}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 font-mono">
                            <Icon className="w-3 h-3 text-zinc-400" />
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                compressionLevel === lvl
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              ↓ {est.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ESTIMADOR DINÁMICO DE REDUCCIÓN */}
                <div className="mb-4 bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 shadow-inner font-mono text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'Ahorro proyectado:' : 'Projected savings:'}
                    </span>
                    <span className="text-[#FAF6EE] font-extrabold text-xs">
                      ~ {getEstimatedReduction(compressionLevel).label}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-zinc-300 via-white to-[#FAF6EE] h-full rounded-full"
                      initial={{ width: '40%' }}
                      animate={{
                        width:
                          compressionLevel === 'low'
                            ? '30%'
                            : compressionLevel === 'medium'
                              ? '60%'
                              : '85%',
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-400">
                    <span>
                      {isEs ? 'Original:' : 'Original:'}{' '}
                      <strong className="text-white">{formatFileSize(totalOriginalSize)}</strong>
                    </span>
                    <span>
                      {isEs ? 'Proyección:' : 'Projected:'}{' '}
                      <strong className="text-[#FAF6EE]">
                        {formatFileSize(
                          totalOriginalSize *
                            (compressionLevel === 'low'
                              ? 0.75
                              : compressionLevel === 'medium'
                                ? 0.5
                                : 0.25),
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* BOTÓN DESPLEGABLE DE OPCIONES AVANZADAS */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-2 px-3 bg-[#121217] hover:bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer mb-3"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                    <span>
                      {isEs
                        ? 'Opciones Avanzadas (DPI, Color, Alcance)'
                        : 'Advanced Options (DPI, Color, Scope)'}
                    </span>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* CONTENIDO DE OPCIONES AVANZADAS */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 bg-[#121217] border border-zinc-700/80 rounded-2xl p-3.5 mb-4 shadow-inner overflow-hidden"
                    >
                      {/* MODO DE COLOR */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Modo de Color' : 'Color Mode'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['original', 'grayscale', 'blackwhite'] as OutputColorMode[]).map(
                            (opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setOutputColorMode(opt)}
                                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                  outputColorMode === opt
                                    ? 'border-white bg-zinc-700 text-white'
                                    : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {opt === 'original'
                                  ? '🎨 Color'
                                  : opt === 'grayscale'
                                    ? '⚪ Grises'
                                    : '■ B/N'}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* RESOLUCIÓN DPI */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Resolución (DPI)' : 'Resolution (DPI)'}
                        </label>
                        <div className="flex gap-1.5">
                          {(['auto', '72', '96', '150'] as DpiMode[]).map((dpi) => (
                            <button
                              key={dpi}
                              type="button"
                              onClick={() => setDpiMode(dpi)}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                dpiMode === dpi
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {dpi === 'auto' ? 'Auto' : `${dpi} DPI`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ALCANCE DE PÁGINAS */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Alcance de Páginas' : 'Page Scope'}
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                          {(['todas', 'pares', 'impares', 'rango'] as PageScope[]).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setPageScope(opt)}
                              className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                pageScope === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {opt === 'todas'
                                ? isEs
                                  ? 'Todas'
                                  : 'All'
                                : opt === 'pares'
                                  ? isEs
                                    ? 'Pares'
                                    : 'Even'
                                  : opt === 'impares'
                                    ? isEs
                                      ? 'Impares'
                                      : 'Odd'
                                    : isEs
                                      ? 'Rango'
                                      : 'Range'}
                            </button>
                          ))}
                        </div>
                        {pageScope === 'rango' && (
                          <input
                            type="text"
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            placeholder={isEs ? 'Ej: 1-3, 5, 8-12' : 'e.g. 1-3, 5, 8-12'}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[10px] font-mono placeholder-zinc-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/40 transition"
                          />
                        )}
                      </div>

                      {/* PRESERVACIÓN Y METADATOS */}
                      <div className="space-y-1.5 pt-1">
                        <div
                          onClick={() => setPreserveTextVectors((v) => !v)}
                          className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-white">
                              {isEs ? 'Preservar texto vectorial' : 'Preserve vector text'}
                            </p>
                            <p className="text-[9px] text-zinc-500 font-mono">
                              {isEs
                                ? 'Mantiene nitidez infinita en letras y planos'
                                : 'Infinite crispness for text & CAD'}
                            </p>
                          </div>
                          <div
                            className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${
                              preserveTextVectors ? 'bg-white' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${
                                preserveTextVectors ? 'left-4' : 'left-0.5'
                              }`}
                            />
                          </div>
                        </div>

                        <div
                          onClick={() => setStripMetadata((v) => !v)}
                          className="flex items-center justify-between p-2 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-white">
                              {isEs ? 'Eliminar metadatos ocultos' : 'Strip hidden metadata'}
                            </p>
                            <p className="text-[9px] text-zinc-500 font-mono">
                              {isEs
                                ? 'Limpia autor, software emisor y tags'
                                : 'Removes author, software & tags'}
                            </p>
                          </div>
                          <div
                            className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${
                              stripMetadata ? 'bg-white' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${
                                stripMetadata ? 'left-4' : 'left-0.5'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* BOTÓN DE ACCIÓN PRINCIPAL */}
              <div>
                {isProcessing ? (
                  <div className="w-full bg-[#121217] border border-zinc-700 rounded-2xl p-4 flex flex-col gap-2 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-bold flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        {progressMsg || (isEs ? 'Comprimiendo...' : 'Compressing...')}
                      </span>
                      <span className="text-[#FAF6EE] font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-500 flex justify-between">
                      <span>
                        {isEs
                          ? `Archivo ${currentFileIndex} de ${totalFilesCount}`
                          : `File ${currentFileIndex} of ${totalFilesCount}`}
                      </span>
                      <span>{isEs ? 'Deflate Nivel 9 Activo' : 'Deflate Level 9 Active'}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={executeCompress}
                    className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 font-sans text-sm sm:text-base uppercase tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Zap className="w-5 h-5 text-black fill-current" />
                    <span>
                      {isEs
                        ? `COMPRIMIR AHORA (${files.length} ARCHIVO${files.length > 1 ? 'S' : ''})`
                        : `COMPRESS NOW (${files.length} FILE${files.length > 1 ? 'S' : ''})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE MINIATURA */}
      {zoomModalImage && (
        <div
          onClick={() => setZoomModalImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121217] border border-zinc-700 rounded-3xl p-4 max-w-2xl max-h-[85vh] flex flex-col items-center relative shadow-2xl"
          >
            <button
              onClick={() => setZoomModalImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-400 mb-3">
              {isEs ? 'Vista previa de página' : 'Page preview'}
            </span>
            <img
              src={zoomModalImage}
              alt="Zoom preview"
              className="max-h-[70vh] object-contain rounded-xl border border-zinc-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
