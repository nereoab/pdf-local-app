'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Loader2,
  FileText,
  X,
  Save,
  ArrowLeft,
  Plus,
  Type,
  Trash2,
  Sliders,
  Sparkles,
  Zap,
  Cpu,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  PenTool,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileStore } from '@/store/useFileStore';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FoliarSuccessView from '@/components/FoliarSuccessView';
import type { EditWorkerMessageIn, EditWorkerMessageOut } from '@/workers/pdf-edit.worker';
import NativePdfEditor from '@/components/NativePdfEditor';
import FabricPdfEditor from '@/components/FabricPdfEditor';

type Step = 'upload' | 'edit' | 'download';

export default function PdfEditor() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const viewer = useRef<HTMLDivElement>(null);
  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const [file, setFile] = useState<File | null>(globalFile);
  const [step, setStep] = useState<Step>(globalFile ? 'edit' : 'upload');

  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [, setProgressPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [, setViewerInstance] = useState<any>(null);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);
  const [editedBlob, setEditedBlob] = useState<Blob | null>(null);
  const [docTotalPages, setDocTotalPages] = useState<number>(1);

  // MOTOR ACTIVO: 'native' (In-Situ) | 'fabric' (Vectorial Canva) | 'apryse' (WebAssembly)
  const [activeEngine, setActiveEngine] = useState<'native' | 'fabric' | 'apryse'>('fabric');
  const [apryseActiveTool, setApryseActiveTool] = useState<'contentEdit' | 'addParagraph'>(
    'contentEdit',
  );
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  // OPCIONES AVANZADAS Y METADATOS
  const [filePrefix, setFilePrefix] = useState<string>(
    globalFile ? globalFile.name.replace(/\.[^/.]+$/, '') + '_Editado' : 'Documento_Editado',
  );
  const [renumberPages, setRenumberPages] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docSubject, setDocSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const isEsRef = useRef(isEs);
  useEffect(() => {
    isEsRef.current = isEs;
  }, [isEs]);

  // Sincronización continua y fiable con el store global de Zustand (inicio -> /editar -> /editar/texto)
  useEffect(() => {
    queueMicrotask(() => {
      if (globalFile) {
        setFile(globalFile);
        setFilePrefix(globalFile.name.replace(/\.[^/.]+$/, '') + '_Editado');
        setStep('edit');

        (async () => {
          try {
            const { PDFDocument } = await import('pdf-lib');
            const arrayBuffer = await globalFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            setDocTotalPages(pdfDoc.getPageCount());
          } catch {
            // No bloqueante
          }
        })();
      } else {
        setFile(null);
        setStep('upload');
      }
    });
  }, [globalFile]);

  const processSelectedFile = useCallback(
    (selected: File) => {
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
        setFile(selected);
        setGlobalFile(selected);
        setFilePrefix(selected.name.replace(/\.[^/.]+$/, '') + '_Editado');
        setStep('edit');

        (async () => {
          try {
            const { PDFDocument } = await import('pdf-lib');
            const arrayBuffer = await selected.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            setDocTotalPages(pdfDoc.getPageCount());
          } catch {
            // No bloqueante
          }
        })();
      } else {
        toast.error(
          isEs
            ? 'Por favor, sube un archivo con formato PDF válido'
            : 'Please upload a valid PDF file',
        );
      }
    },
    [isEs, setGlobalFile],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

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
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Inicializar WebViewer de forma directa y estable cuando estamos en 'edit' y el motor activo es Apryse
  useEffect(() => {
    if (step !== 'edit' || !file || activeEngine !== 'apryse') return;

    let isDisposed = false;

    async function loadViewer() {
      if (!viewer.current || isDisposed) return;

      // Limpiar contenedor previo
      viewer.current.innerHTML = '';
      setIsLoaded(false);

      try {
        const webViewerModule = await import('@pdftron/webviewer');
        if (isDisposed || !viewer.current) return;

        const WebViewer = webViewerModule.default;
        const effectiveLicense =
          process.env.NEXT_PUBLIC_PDFTRON_LICENSE?.trim() ||
          'demo:1785371416175:63a1e8a503000000006760d2ccf8c0f171ee4085a462864d5cc7028d9d';

        const webviewerOptions: any = {
          path: '/webviewer',
          fullAPI: true,
          preloadWorker: 'contentEdit',
          enableCompositionInput: true,
          ...(effectiveLicense ? { licenseKey: effectiveLicense } : {}),
        };

        const initViewer = (WebViewer as any).Iframe || WebViewer;
        const instance = await initViewer(webviewerOptions, viewer.current);
        if (isDisposed) {
          try {
            instance.UI?.dispose?.();
          } catch {}
          return;
        }

        viewerInstanceRef.current = instance;
        setViewerInstance(instance);

        const { UI, Core } = instance;
        UI.setLanguage(isEsRef.current ? 'es' : 'en');

        UI.enableFeatures([
          UI.Feature.ContentEdit,
          UI.Feature.Annotations,
          UI.Feature.FilePicker,
          UI.Feature.Print,
          UI.Feature.Download,
        ]);

        UI.enableElements([
          'contentEditButton',
          'addParagraphToolGroupButton',
          'addImageContentToolGroupButton',
          'toolbarGroup-EditText',
        ]);

        UI.setTheme('dark');

        // Aislar errores dentro de iframeWindow si aplica
        if (UI?.iframeWindow) {
          try {
            UI.iframeWindow.addEventListener(
              'error',
              (e: any) => {
                const msg = String(e?.message || '');
                if (
                  msg.includes('getPageMatrix') ||
                  msg.includes('replace is not a function') ||
                  msg.includes('qAt') ||
                  msg.includes('getViewerCoordinates') ||
                  msg.includes('xwt') ||
                  msg.includes('trial')
                ) {
                  e.preventDefault?.();
                  e.stopImmediatePropagation?.();
                  console.warn(
                    '[PDFBLACK] Excepción interna de WebViewer prevenida en iframe:',
                    msg,
                  );
                }
              },
              true,
            );
          } catch {}
        }

        // Protección segura en borrado de anotaciones sin interferir con cajas de texto
        if (Core?.annotationManager) {
          try {
            const originalDelete = Core.annotationManager.deleteAnnotations.bind(
              Core.annotationManager,
            );
            Core.annotationManager.deleteAnnotations = function (
              annotations: any[],
              ...args: any[]
            ) {
              try {
                if (annotations != null) {
                  return originalDelete(annotations, ...args);
                }
                return Promise.resolve();
              } catch (delErr) {
                console.warn(
                  '[PDFBLACK] Excepción prevenida en deleteAnnotations de WebViewer:',
                  delErr,
                );
                return Promise.resolve();
              }
            };
          } catch (patchErr) {
            console.warn('[PDFBLACK] No se pudo envolver deleteAnnotations:', patchErr);
          }
        }

        if (!file || isDisposed) return;

        const loadOptions: any = { filename: file.name, extension: 'pdf', password: '' };

        Core.documentViewer.addEventListener('documentLoaded', async () => {
          if (!isDisposed) {
            setIsLoaded(true);
            try {
              UI.openElements(['leftPanel']);
            } catch {}
            try {
              if (UI.ToolbarGroup?.EDIT_TEXT) {
                UI.setToolbarGroup(UI.ToolbarGroup.EDIT_TEXT);
              } else {
                UI.setToolbarGroup('toolbarGroup-EditText');
              }
            } catch {
              try {
                UI.setToolbarGroup('toolbarGroup-Annotate');
              } catch {}
            }

            // Activar automáticamente el modo de edición de contenido de Apryse (cajas delimitadoras sobre texto)
            try {
              const contentEditManager = Core.documentViewer.getContentEditManager();
              if (contentEditManager) {
                try {
                  await Core.ContentEdit?.preloadWorker?.(contentEditManager);
                } catch {}
                await contentEditManager.startContentEditMode();
                const editTool = Core.documentViewer.getTool(Core.Tools.ToolNames.CONTENT_EDIT);
                if (editTool) {
                  Core.documentViewer.setToolMode(editTool);
                }
              }
            } catch (ceErr) {
              console.warn('[PDFBLACK] Inicialización de ContentEdit:', ceErr);
            }

            toast.success(
              isEsRef.current
                ? '¡Documento listo! Haz doble clic en el texto para editarlo o pulsa en "+ Añadir Texto".'
                : 'Document ready! Double-click text to edit or click "+ Add Text".',
            );
          }
        });

        await UI.loadDocument(file, loadOptions);

        if (!isDisposed) {
          setIsLoaded(true);
        }
      } catch (err: any) {
        if (!isDisposed) {
          console.error('WebViewer init error:', err);
          setIsLoaded(false);
          setViewerInstance(null);
          viewerInstanceRef.current = null;
          setStep('upload');
          toast.error(
            isEsRef.current
              ? 'Error al cargar el motor de edición. Verifica tu conexión o intenta con otro PDF.'
              : 'Failed to load editing engine. Check your connection or try with another PDF.',
          );
        }
      }
    }

    // Interceptor global sincrónico para evitar que errores del visor muestren el overlay rojo de desarrollo
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = String(event.message || '');
      const filename = String(event.filename || '');
      if (
        msg.includes('getPageMatrix') ||
        msg.includes('replace is not a function') ||
        msg.includes('qAt') ||
        msg.includes('getViewerCoordinates') ||
        msg.includes("reading 'id'") ||
        msg.includes("reading 'xwt'") ||
        msg.includes('webviewer') ||
        filename.includes('webviewer') ||
        filename.includes('chunk')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn('[PDFBLACK] Error interno de WebViewer prevenido con éxito:', msg);
      }
    };

    // Interceptor global asíncrono para promesas rechazadas dentro de WebViewer / WebAssembly
    const handleGlobalRejection = (e: PromiseRejectionEvent) => {
      const reason = String(e.reason?.message || e.reason || '');
      const stack = String(e.reason?.stack || '');
      if (
        reason.includes('getPageMatrix') ||
        reason.includes('replace is not a function') ||
        reason.includes('qAt') ||
        reason.includes('xwt') ||
        reason.includes('Kwt') ||
        reason.includes('getViewerCoordinates') ||
        reason.includes("reading 'id'") ||
        reason.includes("reading 'xwt'") ||
        reason.includes('removeContentBox') ||
        reason.includes('handleKeyboardCommandQueue') ||
        stack.includes('webviewer')
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.warn('[PDFBLACK] Excepción asíncrona de WebViewer prevenida con éxito:', reason);
      }
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleGlobalRejection);

    loadViewer();

    return () => {
      isDisposed = true;
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleGlobalRejection);
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.UI?.dispose?.();
        } catch {}
        viewerInstanceRef.current = null;
      }
    };
  }, [step, file, activeEngine]);

  const handleNativeFinish = async (blob: Blob) => {
    const hasMetadata = Boolean(docTitle.trim() || docAuthor.trim() || docSubject.trim());
    const needsPostProcessing = renumberPages || hasMetadata;

    if (needsPostProcessing) {
      setIsProcessing(true);
      setProgressPercent(40);
      setProgressMsg(
        isEs
          ? 'Aplicando metadatos y opciones de salida...'
          : 'Applying metadata and output options...',
      );

      try {
        const bufferCopy = await blob.arrayBuffer();
        const worker = new Worker(new URL('../workers/pdf-edit.worker.ts', import.meta.url), {
          type: 'module',
        });

        const payload: EditWorkerMessageIn = {
          action: 'process',
          arrayBuffer: bufferCopy,
          options: {
            filePrefix: filePrefix.trim() || 'Documento_Editado',
            renumberPages,
            metadata: {
              title: docTitle.trim() || undefined,
              author: docAuthor.trim() || undefined,
              subject: docSubject.trim() || undefined,
            },
          },
        };

        const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
          (resolve, reject) => {
            worker.onmessage = (e: MessageEvent<EditWorkerMessageOut>) => {
              const msg = e.data;
              if (msg.type === 'progress') {
                setProgressPercent(msg.percent);
                setProgressMsg(msg.message);
              } else if (msg.type === 'result') {
                resolve({ buffer: msg.buffer, totalPages: msg.totalPages });
              } else if (msg.type === 'error') {
                reject(new Error(msg.message));
              }
            };
            worker.onerror = (err) => reject(err);
            worker.postMessage(payload, [bufferCopy]);
          },
        );

        worker.terminate();
        if (result.totalPages) setDocTotalPages(result.totalPages);
        const finalBlob = new Blob([result.buffer], { type: 'application/pdf' });
        if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
        const url = URL.createObjectURL(finalBlob);
        setEditedPdfUrl(url);
        setEditedBlob(finalBlob);
        setStep('download');
      } catch (e) {
        console.error(e);
        if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
        const url = URL.createObjectURL(blob);
        setEditedPdfUrl(url);
        setEditedBlob(blob);
        setStep('download');
      } finally {
        setIsProcessing(false);
        setProgressMsg('');
      }
    } else {
      if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);
      setEditedBlob(blob);
      setStep('download');
    }
  };

  const handleFinishEditing = async () => {
    const instance = viewerInstanceRef.current;
    if (!instance) return;

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(
      isEs ? 'Confirmando y aplicando ediciones de texto...' : 'Committing text edits...',
    );

    try {
      const { documentViewer, annotationManager } = instance.Core;
      const doc = documentViewer.getDocument();

      // ── PASO 0: Forzar desenfoque y consolidación de cajas de texto activas en Apryse ──
      try {
        if (instance.UI && instance.UI.iframeWindow) {
          const win = instance.UI.iframeWindow;
          const activeEl = win.document?.activeElement as HTMLElement;
          if (activeEl && typeof activeEl.blur === 'function') {
            activeEl.blur();
          }
          const shadowEl = (activeEl as any)?.shadowRoot?.activeElement;
          if (shadowEl && typeof shadowEl.blur === 'function') {
            shadowEl.blur();
          }
        }
      } catch (blurErr) {
        console.warn('Error al desenfocar elemento activo:', blurErr);
      }

      // Detener cualquier ContentBox que se encuentre en modo de edición para que vuelque su texto al motor
      try {
        const contentEditManager = documentViewer?.getContentEditManager?.();
        if (contentEditManager) {
          const tSt = (contentEditManager as any).tSt;
          if (tSt && typeof tSt === 'object') {
            for (const box of Object.values(tSt) as any[]) {
              if (box && typeof box.isEditing === 'function' && box.isEditing()) {
                if (typeof box.stopContentEditing === 'function') {
                  box.stopContentEditing();
                }
              }
            }
          }
        }
      } catch (boxErr) {
        console.warn('Error al confirmar cajas de edición de texto:', boxErr);
      }

      // Deseleccionar todas las anotaciones para disparar los listeners internos de commit de texto
      try {
        if (annotationManager && typeof annotationManager.deselectAllAnnotations === 'function') {
          annotationManager.deselectAllAnnotations();
        }
      } catch (deselErr) {
        console.warn('Error al deseleccionar anotaciones:', deselErr);
      }

      // Pausa indispensable para que el worker WebAssembly (Infix) termine de procesar
      // las modificaciones vectoriales y reescribir los streams de texto en el PDF
      await new Promise((resolve) => setTimeout(resolve, 600));

      setProgressPercent(35);
      setProgressMsg(
        isEs
          ? 'Consolidando capas y anotaciones del PDF...'
          : 'Consolidating PDF layers and annotations...',
      );

      // ── PASO 1: Exportar anotaciones (textos agregados, notas, firmas, sellos) en formato XFDF ──
      let xfdfString: string | undefined = undefined;
      try {
        if (annotationManager && typeof annotationManager.exportAnnotations === 'function') {
          const exported = await annotationManager.exportAnnotations({
            links: true,
            widgets: true,
            fields: true,
          });
          if (exported && typeof exported === 'string' && exported.trim().length > 0) {
            xfdfString = exported;
          }
        }
      } catch (errXfdf) {
        console.warn('Anotaciones XFDF no disponibles o vacías:', errXfdf);
      }

      setProgressPercent(55);
      setProgressMsg(
        isEs ? 'Exportando bytes del documento editado...' : 'Exporting edited document bytes...',
      );

      // ── PASO 2: Obtener buffer con ediciones de texto nativas y anotaciones fusionadas ──
      const saveOptions: Record<string, any> = {
        downloadType: 'pdf',
        includeAnnotations: true,
      };
      if (xfdfString) {
        saveOptions.xfdfString = xfdfString;
      }
      if (instance.Core?.SaveOptions?.REMOVE_UNUSED) {
        saveOptions.flags = instance.Core.SaveOptions.REMOVE_UNUSED;
      }

      const data = await doc.getFileData(saveOptions);

      let rawBuffer: ArrayBuffer;
      if (data instanceof ArrayBuffer) {
        rawBuffer = data;
      } else if (data && data.buffer) {
        rawBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
        rawBuffer = new Uint8Array(data).buffer;
      }
      const bufferCopy = rawBuffer.slice(0);

      const hasMetadata = Boolean(docTitle.trim() || docAuthor.trim() || docSubject.trim());
      const needsPostProcessing = renumberPages || hasMetadata;

      let finalBuffer = bufferCopy;

      if (needsPostProcessing) {
        setProgressPercent(65);
        setProgressMsg(
          isEs
            ? 'Aplicando opciones de salida en Web Worker...'
            : 'Applying output options in Web Worker...',
        );

        const worker = new Worker(new URL('../workers/pdf-edit.worker.ts', import.meta.url), {
          type: 'module',
        });

        const payload: EditWorkerMessageIn = {
          action: 'process',
          arrayBuffer: bufferCopy,
          options: {
            filePrefix: filePrefix.trim() || 'Documento_Editado',
            renumberPages,
            metadata: {
              title: docTitle.trim() || undefined,
              author: docAuthor.trim() || undefined,
              subject: docSubject.trim() || undefined,
            },
          },
        };

        const result = await new Promise<{ buffer: ArrayBuffer; totalPages: number }>(
          (resolve, reject) => {
            worker.onmessage = (e: MessageEvent<EditWorkerMessageOut>) => {
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
            worker.postMessage(payload, [bufferCopy]);
          },
        );

        worker.terminate();
        if (result.totalPages) setDocTotalPages(result.totalPages);
        finalBuffer = result.buffer;
      }

      // ── PASO 3: Generar archivo final y URL para descarga ──
      setProgressPercent(100);

      const blob = new Blob([finalBuffer], { type: 'application/pdf' });
      if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);
      setEditedBlob(blob);

      toast.success(
        isEs ? '¡Modificaciones grabadas correctamente!' : 'Changes saved successfully!',
      );
      setStep('download');
    } catch (error: any) {
      console.error('Error al guardar:', error);
      toast.error(
        error?.message || (isEs ? 'Error al grabar el documento.' : 'Failed to save document.'),
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const topContainerRef = useRef<HTMLDivElement>(null);
  const successContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hacia el inicio de la herramienta (debajo del Navbar global)
  useEffect(() => {
    if (step === 'download') {
      const timer = setTimeout(() => {
        if (topContainerRef.current) {
          topContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleStartOver = () => {
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    setFile(null);
    setGlobalFile(null);
    setIsLoaded(false);
    setViewerInstance(null);
    setEditedPdfUrl(null);
    setEditedBlob(null);
    setStep('upload');
    setDocTitle('');
    setDocAuthor('');
    setDocSubject('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                ? '001 / EDICIÓN NATIVA DE TEXTO E IMÁGENES'
                : '001 / NATIVE TEXT & IMAGE EDITING'}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Type className="w-6 h-6 text-white flex-shrink-0" />
              {isEs
                ? 'EDITAR TEXTO E IMÁGENES DE DOCUMENTOS PDF'
                : 'EDIT TEXT & IMAGES OF PDF DOCUMENTS'}
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
              onClick={handleStartOver}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-xl transition-all cursor-pointer"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* PANTALLA 1: SUBIDA (DROPZONE EMPRESARIAL CON DRAG AND DROP) */}
      {step === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
            isDragging ? 'border-white bg-zinc-900/50' : 'border-zinc-600 hover:border-white'
          } rounded-3xl p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[500px]`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 group-hover:border-white group-hover:scale-105 transition-all text-white mb-6 shadow-md">
            <Type className="w-12 h-12 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-700 rounded-full text-zinc-300 text-xs font-mono mb-4 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEs
                ? 'Arquitectura Dual: Motor In-Situ Nativo + Motor Apryse WASM'
                : 'Dual Architecture: Native In-Situ Engine + Apryse WASM Engine'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 font-sans max-w-3xl leading-tight uppercase">
            {isEs
              ? 'EDITAR TEXTO E IMÁGENES DE DOCUMENTOS PDF'
              : 'EDIT TEXT & IMAGES OF PDF DOCUMENTS'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8 max-w-xl leading-relaxed">
            {isEs
              ? 'Modifica texto existente, añade párrafos, inserta imágenes o incorpora firmas al instante, con la opción de elegir entre 3 motores de procesamiento.'
              : 'Modify existing text, insert paragraphs, add images or signatures instantly, with the flexibility to choose between 3 processing engines.'}
          </p>

          <button
            type="button"
            className="bg-white text-black hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-full font-sans text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>{isEs ? 'Seleccionar Archivo PDF' : 'Select PDF File'}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl font-mono text-left">
            <div className="bg-[#121217] p-3.5 rounded-xl border border-blue-900/40 hover:border-blue-700 transition-all">
              <span className="text-blue-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5" />
                {isEs ? 'Motor In-Situ Nativo' : 'Native In-Situ Engine'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight block">
                {isEs
                  ? 'Instantáneo y en memoria RAM. Corrige cifras, fechas o datos directamente con doble clic sin esperas.'
                  : 'Instant and in local RAM. Edit figures, dates or text by double-clicking with zero wait.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-emerald-900/40 hover:border-emerald-700 transition-all">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                <PenTool className="w-3.5 h-3.5" />
                {isEs ? 'Motor Vectorial (Canva)' : 'Vector Engine (Canva)'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight block">
                {isEs
                  ? '100% Libre y visual. Arrastra texto libremente, rótalo, redimensiónalo con las 4 esquinas y dibuja firmas.'
                  : '100% Free and visual. Drag text freely, rotate, resize with 4 corners, and draw signatures.'}
              </span>
            </div>
            <div className="bg-[#121217] p-3.5 rounded-xl border border-purple-900/40 hover:border-purple-700 transition-all">
              <span className="text-purple-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                {isEs ? 'Motor Avanzado Apryse' : 'Apryse Advanced Engine'}
              </span>
              <span className="text-zinc-400 text-[11px] leading-tight block">
                {isEs
                  ? 'Suite profesional WebAssembly para documentos complejos, reflujo tipográfico y anotaciones avanzadas.'
                  : 'Professional WebAssembly suite for complex documents, typography reflow, and advanced annotations.'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* PANTALLA 2: EDICIÓN CON ARQUITECTURA DUAL DE MOTORES */}
      {step === 'edit' && file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col"
        >
          {/* SELECTOR DUAL DE MOTORES DESTACADO */}
          <div className="w-full mb-6 bg-gradient-to-b from-[#181820] via-[#111117] to-[#0a0a0e] border border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Encabezado del selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-emerald-400 shadow-sm flex-shrink-0">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase tracking-tight font-sans">
                      {isEs
                        ? 'Arquitectura Triple de Edición PDF'
                        : 'Triple PDF Editing Architecture'}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold uppercase">
                      {isEs ? '3 Motores Disponibles' : '3 Engines Available'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {isEs
                      ? 'Selecciona el motor ideal para tu tarea. Puedes alternar entre ellos libremente en cualquier momento.'
                      : 'Choose the engine that best fits your workflow. You can switch between them at any time.'}
                  </p>
                </div>
              </div>

              {/* Botones de acción del encabezado */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setShowComparisonModal(true)}
                  className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isEs ? '¿Cuál elegir?' : 'Which to choose?'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCompactMode(!isCompactMode)}
                  className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm"
                  title={
                    isCompactMode
                      ? isEs
                        ? 'Ver detalles'
                        : 'Show details'
                      : isEs
                        ? 'Modo compacto'
                        : 'Compact mode'
                  }
                >
                  {isCompactMode ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isEs ? 'Detalles' : 'Details'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isEs ? 'Compacto' : 'Compact'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MODO DETALLADO: 3 TARJETAS GRANDES INTERACTIVAS */}
            {!isCompactMode ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* TARJETA MOTOR 1: IN-SITU NATIVO */}
                <div
                  onClick={() => setActiveEngine('native')}
                  className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    activeEngine === 'native'
                      ? 'bg-gradient-to-br from-blue-950/40 via-[#0d1424] to-[#080d17] border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
                      : 'bg-[#101015] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  <div>
                    {/* Badge superior */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            activeEngine === 'native'
                              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-white'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-sans">
                            {isEs ? 'Motor In-Situ Nativo' : 'Native In-Situ Engine'}
                          </h3>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            PDFBLACK Core • 100% Client-Side
                          </span>
                        </div>
                      </div>

                      {activeEngine === 'native' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                          {isEs ? 'ACTIVO' : 'ACTIVE'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 group-hover:text-blue-400 transition-colors font-mono">
                          {isEs ? 'Activar →' : 'Activate →'}
                        </span>
                      )}
                    </div>

                    {/* Características */}
                    <ul className="space-y-2 text-xs text-zinc-300 font-mono mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">⚡</span>
                        <span>
                          <strong className="text-white">
                            {isEs ? 'Instantáneo:' : 'Instant:'}
                          </strong>{' '}
                          {isEs
                            ? 'Abre en 0 segundos en memoria local.'
                            : 'Opens in 0 seconds in local memory.'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">✍️</span>
                        <span>
                          <strong className="text-white">
                            {isEs ? 'Doble Clic:' : 'Double Click:'}
                          </strong>{' '}
                          {isEs
                            ? 'Modifica textos existentes sobre la misma línea.'
                            : 'Edit existing text in-place on the same line.'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Pie de tarjeta */}
                  <div
                    className={`mt-2 pt-3 border-t text-xs font-mono font-bold flex items-center justify-between ${
                      activeEngine === 'native'
                        ? 'border-blue-500/20 text-blue-300'
                        : 'border-zinc-800/80 text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    <span className="text-[11px]">
                      {activeEngine === 'native'
                        ? isEs
                          ? '✓ En uso actualmente'
                          : '✓ Currently in use'
                        : isEs
                          ? 'Activar In-Situ'
                          : 'Activate In-Situ'}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {isEs ? '100% Libre' : '100% Free'}
                    </span>
                  </div>
                </div>

                {/* TARJETA MOTOR 2: VECTORIAL FABRIC (ESTILO CANVA) */}
                <div
                  onClick={() => setActiveEngine('fabric')}
                  className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    activeEngine === 'fabric'
                      ? 'bg-gradient-to-br from-emerald-950/40 via-[#0a1a14] to-[#06110d] border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                      : 'bg-[#101015] border border-zinc-800 hover:border-emerald-800/50 hover:bg-emerald-950/10'
                  }`}
                >
                  <div>
                    {/* Badge superior */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            activeEngine === 'fabric'
                              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-emerald-300'
                          }`}
                        >
                          <PenTool className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-sans">
                            {isEs ? 'Motor Vectorial (Canva)' : 'Vector Engine (Canva)'}
                          </h3>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Fabric.js • Arrastre Libre & Formas
                          </span>
                        </div>
                      </div>

                      {activeEngine === 'fabric' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {isEs ? 'ACTIVO' : 'ACTIVE'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 group-hover:text-emerald-400 transition-colors font-mono">
                          {isEs ? 'Activar →' : 'Activate →'}
                        </span>
                      )}
                    </div>

                    {/* Características */}
                    <ul className="space-y-2 text-xs text-zinc-300 font-mono mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">🎯</span>
                        <span>
                          <strong className="text-white">
                            {isEs ? 'Control Total:' : 'Full Control:'}
                          </strong>{' '}
                          {isEs
                            ? 'Rotación, redimensión con 4 esquinas y arrastre libre.'
                            : 'Rotation, 4-corner scaling, and free drag & drop.'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">🖍️</span>
                        <span>
                          <strong className="text-white">
                            {isEs ? 'Firmas y Formas:' : 'Signatures & Shapes:'}
                          </strong>{' '}
                          {isEs
                            ? 'Dibujo a mano alzada, borrador, resaltador y rectángulos.'
                            : 'Freehand signatures, whiteout, highlighter & shapes.'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Pie de tarjeta */}
                  <div
                    className={`mt-2 pt-3 border-t text-xs font-mono font-bold flex items-center justify-between ${
                      activeEngine === 'fabric'
                        ? 'border-emerald-500/20 text-emerald-300'
                        : 'border-zinc-800/80 text-zinc-400 group-hover:text-emerald-300'
                    }`}
                  >
                    <span className="text-[11px]">
                      {activeEngine === 'fabric'
                        ? isEs
                          ? '✓ En uso actualmente'
                          : '✓ Currently in use'
                        : isEs
                          ? 'Activar Motor Vectorial'
                          : 'Activate Vector Engine'}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {isEs ? '100% Libre' : '100% Free'}
                    </span>
                  </div>
                </div>

                {/* TARJETA MOTOR 3: APRYSE WEBASSEMBLY */}
                <div
                  onClick={() => setActiveEngine('apryse')}
                  className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    activeEngine === 'apryse'
                      ? 'bg-gradient-to-br from-purple-950/40 via-[#190e2b] to-[#0b0614] border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                      : 'bg-[#101015] border border-zinc-800 hover:border-purple-800/50 hover:bg-purple-950/10'
                  }`}
                >
                  <div>
                    {/* Badge superior */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            activeEngine === 'apryse'
                              ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-purple-300'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-sans">
                            {isEs ? 'Motor Avanzado Apryse' : 'Apryse Advanced Engine'}
                          </h3>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            WebAssembly Suite • Desktop Class
                          </span>
                        </div>
                      </div>

                      {activeEngine === 'apryse' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                          {isEs ? 'ACTIVO' : 'ACTIVE'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 group-hover:text-purple-400 transition-colors font-mono">
                          {isEs ? 'Activar →' : 'Activate →'}
                        </span>
                      )}
                    </div>

                    {/* Características */}
                    <ul className="space-y-2 text-xs text-zinc-300 font-mono mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">🚀</span>
                        <span>
                          <strong className="text-white">
                            {isEs ? 'Suite Profesional:' : 'Pro Suite:'}
                          </strong>{' '}
                          {isEs
                            ? 'Motor WebAssembly con reflujo de párrafos complejos.'
                            : 'WebAssembly engine with complex paragraph reflow.'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-fuchsia-400 font-bold">🎨</span>
                        <span>
                          <strong className="text-white">
                            {isEs ? 'Anotaciones Pro:' : 'Pro Annotations:'}
                          </strong>{' '}
                          {isEs
                            ? 'Sellos empresariales, formularios y gestión de capas.'
                            : 'Corporate stamps, forms, and layer management.'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Pie de tarjeta */}
                  <div
                    className={`mt-2 pt-3 border-t text-xs font-mono font-bold flex items-center justify-between ${
                      activeEngine === 'apryse'
                        ? 'border-purple-500/20 text-purple-300'
                        : 'border-zinc-800/80 text-zinc-400 group-hover:text-purple-300'
                    }`}
                  >
                    <span className="text-[11px]">
                      {activeEngine === 'apryse'
                        ? isEs
                          ? '✓ En uso actualmente'
                          : '✓ Currently in use'
                        : isEs
                          ? 'Activar Apryse'
                          : 'Activate Apryse'}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      WASM PRO
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO COMPACTO: TOGGLE HORIZONTAL DE 3 MOTORES */
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/60 p-2 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveEngine('native')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeEngine === 'native'
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-300" />
                    <span>{isEs ? 'In-Situ' : 'In-Situ'}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded-full uppercase">
                      {isEs ? 'Rápido' : 'Fast'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEngine('fabric')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeEngine === 'fabric'
                        ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isEs ? 'Vectorial (Canva)' : 'Vector (Canva)'}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded-full uppercase">
                      Libre
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEngine('apryse')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeEngine === 'apryse'
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                    <span>{isEs ? 'Apryse' : 'Apryse'}</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded-full uppercase">
                      Pro
                    </span>
                  </button>
                </div>

                <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    {activeEngine === 'native'
                      ? isEs
                        ? 'Modo: Edición In-Situ ligera'
                        : 'Mode: Lightweight In-Situ'
                      : activeEngine === 'fabric'
                        ? isEs
                          ? 'Modo: Edición Vectorial libre estilo Canva'
                          : 'Mode: Freeform Canva-style Vector Editor'
                        : isEs
                          ? 'Modo: Suite WebAssembly completa'
                          : 'Mode: Full WebAssembly Suite'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RENDERIZADO CONDICIONAL DEL MOTOR ACTIVO (3 MOTORES) */}
          {activeEngine === 'native' ? (
            <NativePdfEditor
              file={file}
              filePrefix={filePrefix}
              onFinish={handleNativeFinish}
              onSwitchToApryse={() => setActiveEngine('apryse')}
            />
          ) : activeEngine === 'fabric' ? (
            <FabricPdfEditor
              file={file}
              filePrefix={filePrefix}
              onFinish={handleNativeFinish}
              onSwitchToApryse={() => setActiveEngine('apryse')}
              onSwitchToNative={() => setActiveEngine('native')}
            />
          ) : (
            <>
              {/* BARRA SUPERIOR DE ACCIONES (MOTOR APRYSE) */}
              <div className="w-full mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl font-mono relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 font-bold text-xs text-white">
                  <div className="p-2 bg-purple-900/30 border border-purple-700/40 rounded-xl text-purple-300 shadow-sm">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate max-w-[180px] sm:max-w-xs">{file?.name}</span>
                    <span className="text-[10px] text-purple-400 font-normal">
                      {isEs
                        ? 'Editando con Motor Avanzado Apryse'
                        : 'Editing with Apryse Advanced Engine'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  {/* Botón 1: Editar Texto Existente (ContentEdit) */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const instance = viewerInstanceRef.current;
                        if (instance) {
                          if (instance.UI?.ToolbarGroup?.EDIT_TEXT) {
                            instance.UI.setToolbarGroup(instance.UI.ToolbarGroup.EDIT_TEXT);
                          } else {
                            instance.UI?.setToolbarGroup('toolbarGroup-EditText');
                          }
                          const cem = instance.Core?.documentViewer?.getContentEditManager();
                          if (cem) {
                            if (!cem.isInContentEditMode || !cem.isInContentEditMode()) {
                              await cem.startContentEditMode();
                            }
                            const editTool = instance.Core.documentViewer.getTool(
                              instance.Core.Tools.ToolNames.CONTENT_EDIT,
                            );
                            if (editTool) {
                              instance.Core.documentViewer.setToolMode(editTool);
                            }
                          }
                          setApryseActiveTool('contentEdit');
                          toast.info(
                            isEs
                              ? 'Modo Edición: Haz doble clic sobre cualquier texto del PDF para editarlo.'
                              : 'Edit Mode: Double-click any text in the PDF to edit it.',
                          );
                        }
                      } catch (err) {
                        console.error('Error al activar modo texto en Apryse:', err);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm ${
                      apryseActiveTool === 'contentEdit'
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/60 hover:border-purple-400'
                    }`}
                    title={
                      isEs
                        ? 'Hacer doble clic sobre texto existente para modificarlo'
                        : 'Double-click existing text to modify'
                    }
                  >
                    <Type className="w-3.5 h-3.5 text-purple-300" />
                    <span>{isEs ? 'Editar Texto Existente' : 'Edit Existing Text'}</span>
                  </button>

                  {/* Botón 2: Añadir Nuevo Texto / Párrafo (Add Paragraph) */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const instance = viewerInstanceRef.current;
                        if (instance) {
                          if (instance.UI?.ToolbarGroup?.EDIT_TEXT) {
                            instance.UI.setToolbarGroup(instance.UI.ToolbarGroup.EDIT_TEXT);
                          } else {
                            instance.UI?.setToolbarGroup('toolbarGroup-EditText');
                          }
                          const cem = instance.Core?.documentViewer?.getContentEditManager();
                          if (cem) {
                            if (!cem.isInContentEditMode || !cem.isInContentEditMode()) {
                              await cem.startContentEditMode();
                            }
                            const addTool = instance.Core.documentViewer.getTool(
                              instance.Core.Tools.ToolNames.ADD_PARAGRAPH,
                            );
                            if (addTool) {
                              instance.Core.documentViewer.setToolMode(addTool);
                            }
                          }
                          setApryseActiveTool('addParagraph');
                          toast.success(
                            isEs
                              ? 'Nuevo Texto: Haz clic o arrastra un recuadro en la página para escribir.'
                              : 'New Text: Click or drag a box on the page to type.',
                          );
                        }
                      } catch (err) {
                        console.error('Error al activar herramienta nuevo texto en Apryse:', err);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm ${
                      apryseActiveTool === 'addParagraph'
                        ? 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/60 hover:border-emerald-400'
                    }`}
                    title={
                      isEs
                        ? 'Crear un recuadro nuevo y escribir texto directamente en el PDF'
                        : 'Create new box and type text directly into PDF'
                    }
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isEs ? '+ Añadir Nuevo Texto' : '+ Add New Text'}</span>
                  </button>

                  {/* Botón Cancelar y Botón Principal Grabar */}

                  <button
                    onClick={handleStartOver}
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" /> <span>{isEs ? 'Cancelar' : 'Cancel'}</span>
                  </button>

                  <button
                    onClick={handleFinishEditing}
                    disabled={!isLoaded || isProcessing}
                    className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Save className="w-4 h-4 text-black" />
                    )}
                    <span>
                      {isProcessing
                        ? progressMsg || (isEs ? 'Grabando...' : 'Saving...')
                        : isEs
                          ? 'Terminar y Grabar →'
                          : 'Finish & Save →'}
                    </span>
                  </button>
                </div>
              </div>

              {/* CONTENEDOR DEL VISOR WEBVIEWER */}
              <div className="w-full h-[80vh] min-h-[650px] border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl relative bg-[#09090b]">
                {!isLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b] z-10 font-mono gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-white" />
                    <span className="text-white font-bold text-base font-sans">
                      {isEs
                        ? 'Iniciando Motor Avanzado de Edición...'
                        : 'Starting Advanced Editing Engine...'}
                    </span>
                    <span className="text-zinc-400 text-xs">
                      {isEs
                        ? 'Extrayendo capas de texto y tipografías del PDF'
                        : 'Extracting text layers and fonts from PDF'}
                    </span>
                  </div>
                )}
                <div ref={viewer} className="w-full h-full"></div>
              </div>
            </>
          )}

          {/* OPCIONES AVANZADAS PERMANENTEMENTE VISIBLES */}
          <div className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 p-6 rounded-3xl mt-4 font-mono text-xs space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <Sliders className="w-4 h-4 text-white" />
              <span>
                {isEs
                  ? 'Opciones Avanzadas de Salida PDFBLACK'
                  : 'PDFBLACK Advanced Output Options'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                  {isEs ? 'Prefijo del Archivo Resultante:' : 'Output File Prefix:'}
                </label>
                <input
                  type="text"
                  value={filePrefix}
                  onChange={(e) => setFilePrefix(e.target.value)}
                  placeholder="Documento_Editado"
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 font-mono shadow-inner"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer bg-[#121217] p-3 rounded-2xl border border-zinc-700/80 w-full shadow-inner">
                  <input
                    type="checkbox"
                    checked={renumberPages}
                    onChange={(e) => setRenumberPages(e.target.checked)}
                    className="accent-white w-4 h-4 rounded"
                  />
                  <span>
                    {isEs
                      ? 'Re-numerar páginas en pie de página (Página N / M)'
                      : 'Re-number footer pages (Page N / M)'}
                  </span>
                </label>
              </div>
            </div>

            {/* METADATOS DEL DOCUMENTO RESULTANTE */}
            <div className="bg-[#121217] p-4 rounded-2xl border border-zinc-700/80 space-y-3 font-mono shadow-inner">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1">
                {isEs ? 'METADATOS DEL PDF EDITADO' : 'EDITED PDF METADATA'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    {isEs ? 'Título:' : 'Title:'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isEs ? 'Ej: Documento_Modificado_2026' : 'Ex: Edited_Document_2026'
                    }
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    {isEs ? 'Autor / Organización:' : 'Author / Organization:'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEs ? 'Ej: Mi Empresa S.A.' : 'Ex: Company Inc.'}
                    value={docAuthor}
                    onChange={(e) => setDocAuthor(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">
                    {isEs ? 'Asunto / Descripción:' : 'Subject / Description:'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isEs ? 'Ej: Modificación de texto e imágenes' : 'Ex: Text and image edit'
                    }
                    value={docSubject}
                    onChange={(e) => setDocSubject(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* PANTALLA 3: DESCARGA FINAL DEDICADA ULTRA-PREMIUM CON COMPARTIR EN WHATSAPP / TELEGRAM / DRIVE */}
      {step === 'download' && editedPdfUrl && (
        <div ref={successContainerRef} className="w-full">
          <FoliarSuccessView
            completedResult={{
              downloadUrl: editedPdfUrl,
              filename: `${filePrefix.trim() || 'Documento_Editado'}.pdf`,
              fileSize: editedBlob ? formatFileSize(editedBlob.size) : undefined,
              rawBlob: editedBlob || undefined,
            }}
            totalPages={docTotalPages}
            modeText={
              isEs
                ? activeEngine === 'native'
                  ? 'Motor In-Situ Nativo'
                  : activeEngine === 'fabric'
                    ? 'Motor Vectorial (Canva)'
                    : 'Motor Apryse WASM'
                : activeEngine === 'native'
                  ? 'Native In-Situ Engine'
                  : activeEngine === 'fabric'
                    ? 'Vector Engine (Canva)'
                    : 'Apryse WASM Engine'
            }
            toolName={isEs ? 'Edición de Texto PDF' : 'PDF Text Editing'}
            badgeText={isEs ? 'Edición Completada' : 'Editing Completed'}
            successTitle={
              isEs ? '¡Documento Modificado con Éxito!' : 'Document Edited Successfully!'
            }
            downloadButtonText={isEs ? 'Descargar PDF Editado' : 'Download Edited PDF'}
            shareSubject={isEs ? 'documento editado' : 'edited document'}
            fallbackUrl="https://pdf-black.com/editar/texto"
            metricBadge={
              file && editedBlob ? (
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded font-bold font-mono">
                  {formatFileSize(file.size)} → {formatFileSize(editedBlob.size)}
                </span>
              ) : null
            }
            onReset={handleStartOver}
          />
        </div>
      )}

      {/* MODAL DE COMPARATIVA DE 3 MOTORES */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-zinc-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl font-mono text-xs relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowComparisonModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans">
                  {isEs
                    ? 'Comparativa de Motores: ¿Cuál debes usar?'
                    : 'Engine Comparison: Which one should you use?'}
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {isEs
                    ? 'Puedes alternar entre los 3 motores en cualquier momento sin perder tu documento.'
                    : 'You can switch between all 3 engines at any time without losing your document.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-5">
              {/* Columna 1: Nativo */}
              <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white text-sm">
                      {isEs ? 'Motor In-Situ' : 'In-Situ Engine'}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] mb-3">
                    {isEs
                      ? 'Recomendado para corrección rápida de datos, nombres e importes sin alterar la estructura.'
                      : 'Recommended for quick edits of numbers, dates and names on the original line.'}
                  </p>
                  <ul className="space-y-2 text-[11px] text-zinc-400 border-t border-blue-900/40 pt-3">
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Velocidad:' : 'Speed:'}</strong>{' '}
                      Instantánea (0s)
                    </li>
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Uso:' : 'Usage:'}</strong> Doble
                      clic en el texto
                    </li>
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Licencia:' : 'License:'}</strong>{' '}
                      100% Libre
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveEngine('native');
                    setShowComparisonModal(false);
                  }}
                  className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeEngine === 'native'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {activeEngine === 'native'
                    ? isEs
                      ? '✓ Motor Actual'
                      : '✓ Current Engine'
                    : isEs
                      ? 'Activar este Motor'
                      : 'Select this Engine'}
                </button>
              </div>

              {/* Columna 2: Fabric Vectorial */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PenTool className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">
                      {isEs ? 'Motor Vectorial' : 'Vector Engine'}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] mb-3">
                    {isEs
                      ? 'Estilo Canva: mueve texto a cualquier posición, rótalo, redimensiónalo con las esquinas y firma libremente.'
                      : 'Canva style: drag text anywhere, rotate, resize with 4 corners, and sign freely.'}
                  </p>
                  <ul className="space-y-2 text-[11px] text-zinc-400 border-t border-emerald-900/40 pt-3">
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Velocidad:' : 'Speed:'}</strong>{' '}
                      Instantánea (0s)
                    </li>
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Uso:' : 'Usage:'}</strong> Arrastre
                      libre y formas
                    </li>
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Licencia:' : 'License:'}</strong>{' '}
                      100% Libre (MIT)
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveEngine('fabric');
                    setShowComparisonModal(false);
                  }}
                  className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeEngine === 'fabric'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {activeEngine === 'fabric'
                    ? isEs
                      ? '✓ Motor Actual'
                      : '✓ Current Engine'
                    : isEs
                      ? 'Activar este Motor'
                      : 'Select this Engine'}
                </button>
              </div>

              {/* Columna 3: Apryse */}
              <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-sm">
                      {isEs ? 'Motor Apryse' : 'Apryse Engine'}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] mb-3">
                    {isEs
                      ? 'Recomendado para documentos maquetados complejos, reflujo de párrafos enteros y suite de escritorio.'
                      : 'Recommended for complex documents, full paragraph reflow, and desktop-class suite.'}
                  </p>
                  <ul className="space-y-2 text-[11px] text-zinc-400 border-t border-purple-900/40 pt-3">
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Velocidad:' : 'Speed:'}</strong>{' '}
                      ~2s carga inicial
                    </li>
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Uso:' : 'Usage:'}</strong> Suite
                      WebAssembly
                    </li>
                    <li>
                      <strong className="text-zinc-200">{isEs ? 'Licencia:' : 'License:'}</strong>{' '}
                      Comercial / Trial
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveEngine('apryse');
                    setShowComparisonModal(false);
                  }}
                  className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeEngine === 'apryse'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {activeEngine === 'apryse'
                    ? isEs
                      ? '✓ Motor Actual'
                      : '✓ Current Engine'
                    : isEs
                      ? 'Activar este Motor'
                      : 'Select this Engine'}
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="text-zinc-400 hover:text-white text-xs underline cursor-pointer"
              >
                {isEs ? 'Cerrar ventana' : 'Close window'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
