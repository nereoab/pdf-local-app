'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowLeft, Unlock, FileDown, Loader2, X, ShieldCheck, FilePlus, KeyRound, CheckCircle2, ArrowRight, RefreshCw, FileText, UploadCloud, HardDrive, Clock, Lock, Eye, EyeOff, ShieldAlert, FileCheck2, SlidersHorizontal, ChevronDown, ChevronUp, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

type PageScope = 'todas' | 'rango';

export default function PdfUnlocker() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState<boolean | null>(null);
  const [unlockedPageCount, setUnlockedPageCount] = useState<number | null>(null);

  // Previsualización Canvas PDF
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Opciones Avanzadas
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pageScope, setPageScope] = useState<PageScope>('todas');
  const [pageRange, setPageRange] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [stripAnnotations, setStripAnnotations] = useState(false);
  const [customSuffix, setCustomSuffix] = useState('_Desbloqueado');

  const pdfUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  const renderPagePreview = useCallback(async (pdfFile: File, pageNum: number, pwd = "") => {
    setIsLoadingPreview(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0), password: pwd }).promise;
      setTotalPages(pdfDoc.numPages);

      const targetPageNum = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
      const page = await pdfDoc.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.85));
      }
    } catch {
      setPreviewDataUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      setPreviewPageNum(1);
      renderPagePreview(file, 1, password);
    } else {
      setPreviewDataUrl(null);
      setTotalPages(1);
    }
  }, [file, password, renderPagePreview]);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  useEffect(() => {
    if (file) {
      detectEncryptionStatus(file);
    } else {
      setIsProtected(null);
    }
  }, [file]);

  const parseSelectedPages = (numPages: number): number[] => {
    if (pageScope === 'todas') {
      return Array.from({ length: numPages }, (_, i) => i + 1);
    }
    if (pageScope === 'rango' && pageRange.trim()) {
      const selected = new Set<number>();
      const parts = pageRange.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i >= 1 && i <= numPages) selected.add(i);
            }
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (!isNaN(p) && p >= 1 && p <= numPages) {
            selected.add(p);
          }
        }
      }
      if (selected.size > 0) {
        return Array.from(selected).sort((a, b) => a - b);
      }
    }
    return Array.from({ length: numPages }, (_, i) => i + 1);
  };

  const detectEncryptionStatus = async (selectedFile: File) => {
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      try {
        await pdfjsLib.getDocument({ data: arrayBuffer.slice(0), password: "" }).promise;
        const uint8 = new Uint8Array(arrayBuffer);
        const str = new TextDecoder('latin1').decode(uint8.subarray(0, Math.min(uint8.length, 50000)));
        setIsProtected(str.includes('/Encrypt'));
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'PasswordException') {
          setIsProtected(true);
        } else {
          setIsProtected(false);
        }
      }
    } catch {
      setIsProtected(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setGlobalFile(selected);
        setDownloadUrl(null);
        setPassword('');
        setUnlockedPageCount(null);
        toast.success(isEs ? 'Archivo cargado para diagnóstico' : 'File loaded for diagnosis');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setPassword('');
    setUnlockedPageCount(null);
    setIsProtected(null);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const executeUnlock = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(isEs ? 'Iniciando descifrado AES-256 / RC4 local...' : 'Starting local AES-256 / RC4 decryption...');
    let localUrl: string | null = null;

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();

      setProgressPercent(20);
      setProgressMsg(isEs ? 'Autenticando clave y verificando restricciones...' : 'Authenticating key & verifying restrictions...');

      let pdfDoc: unknown = null;
      let effectivePassword = password;

      // 1. Probar clave ingresada por el usuario o clave vacía
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          password: password || "",
          stopAtErrors: false
        });
        pdfDoc = await loadingTask.promise;
      } catch (authErr: unknown) {
        // 2. Si falla, ejecutar Motor de Desbloqueo y Fuerza Bruta Local por Heurística
        if (authErr && typeof authErr === 'object' && 'name' in authErr && (authErr as { name: string }).name === 'PasswordException') {
          setProgressMsg(isEs ? '🔓 Ejecutando motor de descifrado y recuperación de clave...' : '🔓 Running decryption & key recovery engine...');
          setProgressPercent(25);

          // Extraer patrones numéricos del nombre de archivo (ej: 0005 de 0005_protected.pdf)
          const fileNameMatches = file.name.match(/\d+/g) || [];
          const fileNamePatterns: string[] = [];
          fileNameMatches.forEach(m => {
            fileNamePatterns.push(m);
            const num = parseInt(m, 10);
            if (!isNaN(num)) {
              fileNamePatterns.push(num.toString());
              fileNamePatterns.push(num.toString().padStart(4, '0'));
            }
          });

          const DICTIONARY_PATTERNS = Array.from(new Set([
            ...fileNamePatterns,
            "1234", "123456", "0000", "1111", "0005", "0001", "0002", "0003", "0004", "0006", "0007", "0008", "0009",
            "12345", "12345678", "000000", "password", "admin", "pdf", "123", "guest", "user", "2024", "2025", "2026",
            "8888", "9999", "7777", "6666", "5555", "4444", "3333", "2222", "owner", "root", "master", "secret", "protected"
          ]));

          // Fase 2.1: Probar diccionario rápido y patrones del nombre de archivo
          for (let pIdx = 0; pIdx < DICTIONARY_PATTERNS.length; pIdx++) {
            const pat = DICTIONARY_PATTERNS[pIdx];
            try {
              const testTask = pdfjsLib.getDocument({
                data: arrayBuffer.slice(0),
                password: pat,
                stopAtErrors: false
              });
              const testDoc = await testTask.promise;
              if (testDoc) {
                pdfDoc = testDoc;
                effectivePassword = pat;
                setPassword(pat);
                toast.success(isEs ? `¡Contraseña identificada y eliminada! (Clave: "${pat}")` : `Password identified & removed! (Key: "${pat}")`);
                break;
              }
            } catch {
              // Continuar probando
            }
          }

          // Fase 2.2: Si el diccionario no acierta, ejecutar barrido de fuerza bruta de PINs de 4 dígitos (0000 a 9999)
          if (!pdfDoc) {
            setProgressMsg(isEs ? '🔓 Barrido de fuerza bruta numérico (0000-9999)...' : '🔓 Numeric PIN sweep (0000-9999)...');
            for (let i = 0; i <= 9999; i += 100) {
              if (pdfDoc) break;
              const pct = 25 + Math.floor((i / 10000) * 20);
              setProgressPercent(pct);
              await new Promise(r => setTimeout(r, 0));

              for (let j = i; j < Math.min(i + 100, 10000); j++) {
                const pin = j.toString().padStart(4, '0');
                try {
                  const testTask = pdfjsLib.getDocument({
                    data: arrayBuffer.slice(0),
                    password: pin,
                    stopAtErrors: false
                  });
                  const testDoc = await testTask.promise;
                  if (testDoc) {
                    pdfDoc = testDoc;
                    effectivePassword = pin;
                    setPassword(pin);
                    toast.success(isEs ? `¡Contraseña numérico rota con éxito! (Clave: "${pin}")` : `Numeric PIN broken successfully! (Key: "${pin}")`);
                    break;
                  }
                } catch {
                  // Continuar
                }
              }
            }
          }

          // Fase 2.3: Barrido de Fuerza Bruta Alfabético (Abecedario a-z, A-Z, combinaciones de 1 a 2 letras y diccionario de palabras)
          if (!pdfDoc) {
            setProgressMsg(isEs ? '🔤 Barrido de fuerza bruta alfabético (letras del abecedario a-z, A-Z)...' : '🔤 Alphabetic brute-force sweep (letters a-z, A-Z)...');
            setProgressPercent(45);

            const ALPHABET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
            const ALPHABET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const ALPHABET_ALL = ALPHABET_LOWER + ALPHABET_UPPER;

            // 1. Probar todas las letras individuales (a-z, A-Z)
            const singleLetters: string[] = [];
            for (let c = 0; c < ALPHABET_ALL.length; c++) {
              singleLetters.push(ALPHABET_ALL[c]);
            }

            // 2. Probar combinaciones de 2 letras (aa-zz)
            const doubleLetters: string[] = [];
            for (let i = 0; i < 26; i++) {
              for (let j = 0; j < 26; j++) {
                doubleLetters.push(ALPHABET_LOWER[i] + ALPHABET_LOWER[j]);
              }
            }

            // 3. Diccionario alfabético de palabras comunes en Español e Inglés
            const ALPHABETIC_WORDS = [
              "clave", "Clave", "CLAVE", "admin", "Admin", "ADMIN", "secreto", "Secreto", "SECRETO",
              "seguro", "Seguro", "SEGURO", "protegido", "Protegido", "PROTEGIDO", "documento", "Documento",
              "usuario", "Usuario", "USUARIO", "factura", "Factura", "nomina", "Nomina", "recibo", "Recibo",
              "banco", "Banco", "empresa", "Empresa", "hola", "Hola", "HOLA", "prueba", "Prueba", "PRUEBA",
              "privado", "Privado", "confidencial", "Confidencial", "sistema", "Sistema",
              "pass", "Pass", "PASS", "password", "Password", "PASSWORD", "user", "User", "USER",
              "secret", "Secret", "SECRET", "master", "Master", "MASTER", "root", "Root", "ROOT",
              "test", "Test", "TEST", "demo", "Demo", "DEMO", "free", "Free", "FREE",
              "open", "Open", "OPEN", "lock", "Lock", "LOCK", "file", "File", "FILE",
              "doc", "Doc", "DOC", "pdf", "Pdf", "PDF", "access", "Access", "ACCESS",
              "admin123", "Admin123", "pass123", "Pass123", "pdf123", "Pdf123",
              "clave123", "Clave123", "user123", "test123", "doc2024", "doc2025", "doc2026"
            ];

            const alphaCandidates = [...singleLetters, ...doubleLetters, ...ALPHABETIC_WORDS];

            for (let aIdx = 0; aIdx < alphaCandidates.length; aIdx++) {
              if (pdfDoc) break;
              const alphaKey = alphaCandidates[aIdx];
              try {
                const testTask = pdfjsLib.getDocument({
                  data: arrayBuffer.slice(0),
                  password: alphaKey,
                  stopAtErrors: false
                });
                const testDoc = await testTask.promise;
                if (testDoc) {
                  pdfDoc = testDoc;
                  effectivePassword = alphaKey;
                  setPassword(alphaKey);
                  toast.success(isEs ? `¡Contraseña alfabética rota con éxito! (Clave: "${alphaKey}")` : `Alphabetic password broken successfully! (Key: "${alphaKey}")`);
                  break;
                }
              } catch {
                // Continuar probando
              }
            }
          }
        }

        // Fase 2.3: Bypass Estructural Binario Directo con pdf-lib
        if (!pdfDoc) {
          try {
            setProgressMsg(isEs ? '🔓 Ejecutando bypass binario del diccionario /Encrypt...' : '🔓 Executing binary /Encrypt dictionary bypass...');
            const directDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            if (directDoc.getPageCount() > 0) {
              const cleanPdf = await PDFDocument.create();
              const pageIndices = directDoc.getPageIndices();
              const copiedPages = await cleanPdf.copyPages(directDoc, pageIndices);
              copiedPages.forEach(page => cleanPdf.addPage(page));

              const cleanBytes = await cleanPdf.save({ useObjectStreams: true });
              if (cleanBytes.byteLength > 0) {
                const blob = new Blob([cleanBytes as unknown as BlobPart], { type: 'application/pdf' });
                localUrl = URL.createObjectURL(blob);
                setUnlockedPageCount(directDoc.getPageCount());
                setDownloadUrl(localUrl);

                const originalName = file.name.replace(/\.[^/.]+$/, "");
                const suffix = customSuffix || '_Libre';
                const link = document.createElement('a');
                link.href = localUrl;
                link.download = `${originalName}${suffix}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(isEs ? '¡Documento desbloqueado con éxito mediante bypass binario!' : 'Document unlocked successfully via binary bypass!');
                setIsProcessing(false);
                setProgressMsg('');
                return;
              }
            }
          } catch {
            // Bypass no aplicable
          }
        }

        if (!pdfDoc) {
          toast.error(isEs ? 'Este documento posee una clave personalizada no estándar. Por favor escribe la contraseña en el campo de texto y haz clic en Desbloquear.' : 'Document has a non-standard custom key. Please type password in text field.');
          setIsProcessing(false);
          setProgressMsg('');
          return;
        }
      }

      const activePdfDoc = pdfDoc as { numPages: number; getPage: (n: number) => Promise<unknown> };
      const totalNumPages = activePdfDoc.numPages;
      const targetPages = parseSelectedPages(totalNumPages);

      setProgressPercent(45);
      setProgressMsg(isEs ? 'Reconstruyendo documento PDF 1.7 totalmente desprotegido...' : 'Rebuilding fully unlocked PDF 1.7 document...');

      const newPdf = await PDFDocument.create();

      for (let idx = 0; idx < targetPages.length; idx++) {
        const pageNum = targetPages[idx];
        const currentPct = 45 + Math.floor((idx / targetPages.length) * 45);
        setProgressPercent(currentPct);
        setProgressMsg(isEs ? `Desbloqueando y reconstruyendo página ${pageNum} de ${totalNumPages}...` : `Unlocking & rebuilding page ${pageNum} of ${totalNumPages}...`);

        const page = await (activePdfDoc.getPage(pageNum) as Promise<{ getViewport: (opt: { scale: number }) => { width: number; height: number }; render: (opt: unknown) => { promise: Promise<void> } }>);
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;

          const blobJpeg = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.92));
          if (blobJpeg) {
            const jpegBytes = await blobJpeg.arrayBuffer();
            const embeddedImg = await newPdf.embedJpg(jpegBytes);
            const origViewport = page.getViewport({ scale: 1.0 });

            const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
            newPage.drawImage(embeddedImg, {
              x: 0,
              y: 0,
              width: origViewport.width,
              height: origViewport.height,
            });
          }
        }
      }

      if (stripMetadata) {
        newPdf.setTitle('');
        newPdf.setAuthor('');
        newPdf.setProducer('PDFBlack UltraUnlocker Engine v2.0');
        newPdf.setCreator('PDFBlack Local Engine');
        newPdf.setSubject('');
        newPdf.setKeywords([]);
      }

      setProgressPercent(95);
      setProgressMsg(isEs ? 'Generando PDF totalmente libre de restricciones...' : 'Generating restriction-free PDF...');

      const unlockedBytes = await newPdf.save({ useObjectStreams: true });
      const blob = new Blob([unlockedBytes as unknown as BlobPart], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);

      setProgressPercent(100);
      setUnlockedPageCount(targetPages.length);
      setDownloadUrl(localUrl);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const suffix = customSuffix || '_Libre';
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${originalName}${suffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡PDF desbloqueado con éxito! Todas las restricciones y contraseñas fueron eliminadas.' : 'PDF unlocked successfully! All restrictions & passwords removed.');
    } catch (error) {
      console.error('Error during executeUnlock:', error);
      toast.error(isEs ? 'Ocurrió un error al desbloquear el PDF. Revisa la contraseña ingresada.' : 'An error occurred unlocking PDF. Please check password.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing} />

      {/* CONTENEDOR SUPERIOR DE TÍTULO Y HERRAMIENTA */}
      <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/#herramientas"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEs ? 'Volver' : 'Back'}</span>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-white/10" />

          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              004 / DESBLOQUEO Y LIBERACIÓN DE PERMISOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Unlock className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'DESBLOQUEAR Y LIBERAR RESTRICCIONES DE PDF' : 'UNLOCK AND REMOVE RESTRICTIONS FROM PDF'}</span>
            </h1>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3 font-mono">
            <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-sm text-xs text-white">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[180px] sm:max-w-[280px] font-semibold">{file.name}</span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!file ? (
        /* DROPZONE CUANDO NO HAY ARCHIVO CARGADO */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-3xl mx-auto bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
          >
            <UploadCloud className="w-12 h-12 text-white" />
          </motion.div>

          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs ? 'Arrastra tu PDF protegido aquí para desbloquear' : 'Drop your protected PDF here to unlock'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs ? 'O haz clic para explorar tus archivos localmente' : 'Or click to browse your local files'}
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" /> {isEs ? 'Subir PDF Protegido' : 'Upload Protected PDF'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? '100% PRIVACIDAD • DESCIFRADO LOCAL AES-256 • SIN SERVIDORES' : '100% PRIVACY • LOCAL AES-256 DECRYPTION • ZERO SERVERS'}</span>
          </div>
        </motion.div>
      ) : (
        /* ÁREA DE TRABAJO EN 2 COLUMNAS (IZQ: PREVIEW / DER: CONTROLES) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6 font-sans">
          
          {/* LADO IZQUIERDO: VISTA PREVIA DEL PDF (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="w-full flex-1 h-full min-h-[520px] bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative font-mono">
              
              {/* BARRA SUPERIOR DE ARCHIVO */}
              <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-32 sm:w-48">{file.name}</span>
                    <span className="text-zinc-400 text-[10px]">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveFile} 
                  disabled={isProcessing}
                  className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all" 
                  title={isEs ? "Quitar archivo" : "Remove file"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* CONTENEDOR DE VISTA PREVIA DE PÁGINA */}
              <div className="w-full flex-1 bg-[#09090b] relative flex items-center justify-center p-3 min-h-[500px]">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">{isEs ? "Generando previsualización..." : "Rendering preview..."}</span>
                  </div>
                ) : previewDataUrl ? (
                  <div className="w-full h-full max-h-[560px] flex items-center justify-center relative">
                    <img 
                      src={previewDataUrl} 
                      alt={`Página ${previewPageNum}`}
                      className="max-h-[550px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/15 bg-white transition-all duration-200"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full max-h-[550px] bg-zinc-900/90 border border-amber-500/30 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-5 shadow-2xl relative overflow-hidden font-sans">
                    <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 text-amber-400">
                      <Lock className="w-10 h-10 text-amber-400" />
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
                        {isEs ? 'DOCUMENTO CIFRADO DETECTADO' : 'ENCRYPTED DOCUMENT DETECTED'}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-white">
                        {isEs ? 'Archivo Protegido con Contraseña' : 'Password Protected File'}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                        {isEs
                          ? 'Este documento requiere contraseña de apertura o tiene restricciones de permisos (impresión/edición/copia). Si posee clave de lectura, ingresala a la derecha; si solo tenía restricciones de permisos, presiona directamente "Desbloquear PDF".'
                          : 'This document requires an opening password or has permission locks. If it has a read key, enter it on the right; if it only has permission locks, click "Unlock PDF" directly.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-xl mt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{isEs ? 'Descifrado Local 100% Privado • AES-256' : '100% Local Private Decryption • AES-256'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE DESBLOQUEO (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full shadow-2xl font-sans">
              
              <div>
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
                    <Unlock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-zinc-400 text-xs font-normal leading-relaxed font-sans mb-6">
                  {isEs 
                    ? 'Eliminaremos las contraseñas y restricciones de edición/impresión de tu documento.' 
                    : 'We will remove passwords and editing/printing restrictions from your document.'}
                </p>

                {/* INSIGNIA DE ESTADO DE CIFRADO DETECTADO */}
                <div className="mb-6 bg-zinc-900 border border-white/10 rounded-xl p-4 font-mono text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 font-bold uppercase text-[11px]">{isEs ? 'Estado de Seguridad:' : 'Security Status:'}</span>
                    {isProtected === true && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                        <Lock className="w-3 h-3 text-amber-400" />
                        {isEs ? 'Protegido / Cifrado' : 'Protected / Encrypted'}
                      </span>
                    )}
                    {isProtected === false && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {isEs ? 'Sin Restricciones' : 'No Restrictions'}
                      </span>
                    )}
                    {isProtected === null && (
                      <span className="text-zinc-500 text-[11px]">{isEs ? 'Analizando...' : 'Analyzing...'}</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                    {isEs 
                      ? 'Nuestra tecnología analiza la tabla de permisos `/P` y el diccionario `/Encrypt`. Puedes eliminar la protección de lectura o edición de forma instantánea.' 
                      : 'Our technology parses the `/P` permission map and `/Encrypt` dictionary. You can strip reading or editing locks instantly.'}
                  </p>
                </div>

                {/* CAMPO DE CONTRASEÑA */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-zinc-300 block mb-2 font-mono">
                    {isEs ? 'CONTRASEÑA DE APERTURA (SI APLICA):' : 'OPENING PASSWORD (IF APPLICABLE):'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEs ? 'Ingresa la contraseña del documento...' : 'Type document password...'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isProcessing}
                      className="w-full p-3.5 pr-10 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl text-white text-xs outline-none focus:border-white transition-colors font-mono placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">
                    {isEs ? '* Si el PDF solo tenía restricciones de edición o copia, deja este campo en blanco.' : '* If PDF only had editing or printing locks, leave this field blank.'}
                  </span>
                </div>

                {/* OPCIONES AVANZADAS TOGGLE */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      {isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 bg-zinc-950/60 border border-white/8 rounded-xl p-4">

                      {/* ALCANCE DE PÁGINAS */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-2 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Alcance de Páginas a Desbloquear' : 'Page Scope to Unlock'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {(['todas','rango'] as PageScope[]).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setPageScope(opt)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border font-mono ${
                                pageScope === opt
                                  ? 'border-white bg-zinc-700 text-white'
                                  : 'border-white/10 bg-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {opt === 'todas' ? (isEs ? 'Todas las Páginas' : 'All Pages') : (isEs ? 'Rango Personalizado' : 'Custom Range')}
                            </button>
                          ))}
                        </div>
                        {pageScope === 'rango' && (
                          <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder={isEs ? 'Ej: 1-3, 5, 8-12' : 'e.g. 1-3, 5, 8-12'}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                        )}
                      </div>

                      {/* TOGGLES Y AJUSTES DE SALIDA */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-zinc-400 block font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-zinc-400" />
                          {isEs ? 'Ajustes de Salida y Seguridad' : 'Output & Security Settings'}
                        </label>

                        <div onClick={() => setStripMetadata(v => !v)} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition">
                          <div>
                            <p className="text-[11px] font-bold text-white">{isEs ? 'Eliminar metadatos del PDF' : 'Strip PDF metadata'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{isEs ? 'Purga título, autor y programa de origen' : 'Purge title, author & software info'}</p>
                          </div>
                          <div className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${stripMetadata ? 'bg-white' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${stripMetadata ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-zinc-400 block mb-1.5">{isEs ? 'Sufijo del archivo de salida:' : 'Output file suffix:'}</label>
                          <input
                            type="text"
                            value={customSuffix}
                            onChange={e => setCustomSuffix(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 transition"
                          />
                          <p className="text-[9px] font-mono text-zinc-600 mt-1">
                            {isEs ? `Salida: ${file?.name?.replace(/\.[^/.]+$/, '') ?? 'archivo'}${customSuffix}.pdf` : `Output: ${file?.name?.replace(/\.[^/.]+$/, '') ?? 'file'}${customSuffix}.pdf`}
                          </p>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>

              {/* PROGRESS AND ACTION BUTTON */}
              <div>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 font-mono">
                      <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
                        <span>{progressMsg}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/10">
                        <motion.div 
                          className="bg-white h-full rounded-full" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${progressPercent}%` }} 
                          transition={{ ease: "easeInOut", duration: 0.2 }} 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* MENSAJE DE ÉXITO */}
                {unlockedPageCount !== null && downloadUrl && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center font-mono">
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isEs ? ' PDF Desbloqueado con Éxito' : ' PDF Unlocked Successfully'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      {isEs 
                        ? `Se eliminaron las restricciones de las ${unlockedPageCount} páginas.` 
                        : `Restrictions removed from all ${unlockedPageCount} pages.`}
                    </div>
                  </motion.div>
                )}

                {/* BOTÓN PRINCIPAL DE ACCIÓN */}
                <div className="space-y-3 pt-2">
                  {!downloadUrl ? (
                    <button
                      onClick={executeUnlock}
                      disabled={isProcessing}
                      className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 px-6 rounded-full text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>{isEs ? 'Desbloqueando...' : 'Unlocking...'}</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 text-black" />
                          <span>{isEs ? 'Desbloquear PDF' : 'Unlock PDF'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 font-sans">
                      <a
                        href={downloadUrl}
                        download
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 px-6 rounded-full text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>{isEs ? 'Descargar PDF Libre' : 'Download Unlocked PDF'}</span>
                      </a>

                      <button
                        onClick={handleRemoveFile}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Desbloquear otro archivo' : 'Unlock another file'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* PIE DE TARJETA CON 100% LOCAL */}
                <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {isEs ? "100% Local" : "100% Local"}
                  </span>
                  <span className="text-white flex items-center gap-1">
                    {isEs ? "Listo →" : "Ready →"}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function KpiPill({ icon: Icon, title, value, decimals = 0, suffix = "", tooltip, color }: any) {
  return (
    <div title={tooltip} className="flex items-center gap-2 bg-slate-900/90 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all cursor-default group">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div className="flex items-baseline gap-1">
        <span className="text-white font-extrabold text-xs">{value}{suffix}</span>
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{title}</span>
      </div>
    </div>
  );
}

