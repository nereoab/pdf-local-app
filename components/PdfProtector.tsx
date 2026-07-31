'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { 
  ArrowLeft, ShieldCheck, Lock, Loader2, FileText, X, Eye, EyeOff, 
  Settings, ArrowRight, UploadCloud, AlertCircle, ZoomIn, ZoomOut, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';

export default function PdfProtector() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(85);

  // Previsualización Canvas PDF Real
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  const renderPagePreview = useCallback(async (pdfFile: File, pageNum: number) => {
    setIsLoadingPreview(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
    } catch (err) {
      console.warn('Canvas preview fallback:', err);
      setPreviewDataUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      setCurrentPage(1);
      renderPagePreview(file, 1);
    } else {
      setPreviewDataUrl(null);
      setTotalPages(1);
    }
  }, [file, renderPagePreview]);

  // Section 1: Open Password States
  const [openPassword, setOpenPassword] = useState('');
  const [confirmOpenPassword, setConfirmOpenPassword] = useState('');
  const [showOpenPassword, setShowOpenPassword] = useState(false);

  // Section 2: Permissions & Restrictions States
  const [preventPrinting, setPreventPrinting] = useState(false);
  const [preventCopying, setPreventCopying] = useState(false);
  const [preventEditing, setPreventEditing] = useState(false);
  const [permissionsPassword, setPermissionsPassword] = useState('');
  const [confirmPermissionsPassword, setConfirmPermissionsPassword] = useState('');
  const [showPermissionsPassword, setShowPermissionsPassword] = useState(false);

  // Section 3: Optional Settings (Rasterization)
  const [enableRasterize, setEnableRasterize] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setGlobalFile(selectedFile);
        setTotalPages(4);
        toast.success(isEs ? 'Archivo PDF cargado correctamente' : 'PDF file loaded successfully');
      } else {
        toast.error(isEs ? 'Por favor, selecciona un archivo PDF válido' : 'Please select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  const removeFile = () => {
    setFile(null);
    setGlobalFile(null);
    setOpenPassword('');
    setConfirmOpenPassword('');
    setPermissionsPassword('');
    setConfirmPermissionsPassword('');
    setPreventPrinting(false);
    setPreventCopying(false);
    setPreventEditing(false);
    setEnableRasterize(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

/**
 * Garantiza que el trailer del PDF contenga la entrada obligatoria /ID [<hex> <hex>]
 * requerida por la especificación ISO 32000-1 para cifrado AES-256 en Adobe Acrobat Reader.
 * Resuelve el Error (135) de Adobe Acrobat Reader.
 */
function ensureTrailerIdForAdobeAcrobat(encryptedBytes: Uint8Array): Uint8Array {
  const textDecoder = new TextDecoder('latin1');
  const textEncoder = new TextEncoder();
  const pdfStr = textDecoder.decode(encryptedBytes);

  // Si ya posee la etiqueta /ID [, el tráiler está completo
  if (pdfStr.includes('/ID [')) {
    return encryptedBytes;
  }

  // Generar un ID hexadecimal aleatorio de 16 bytes (32 caracteres hex)
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const idEntry = `/ID [<${randomHex}> <${randomHex}>]`;

  // Buscar el cierre '>>' del diccionario trailer
  const trailerKeywordIdx = pdfStr.lastIndexOf('trailer');
  if (trailerKeywordIdx !== -1) {
    const endDictIdx = pdfStr.indexOf('>>', trailerKeywordIdx);
    if (endDictIdx !== -1) {
      const patchedStr = pdfStr.slice(0, endDictIdx) + ` ${idEntry} ` + pdfStr.slice(endDictIdx);
      return textEncoder.encode(patchedStr);
    }
  }

  return encryptedBytes;
}

  const executeProtect = async () => {
    if (!file) {
      toast.error(isEs ? 'Primero debes subir un archivo PDF' : 'You must upload a PDF file first');
      return;
    }

    // Validation for Open Password matching
    if (openPassword && openPassword !== confirmOpenPassword) {
      toast.error(isEs ? 'Las contraseñas para abrir el documento no coinciden' : 'Document open passwords do not match');
      return;
    }

    // Validation for Permissions Password matching
    if (permissionsPassword && permissionsPassword !== confirmPermissionsPassword) {
      toast.error(isEs ? 'Las contraseñas de permisos no coinciden' : 'Permission passwords do not match');
      return;
    }

    if (!openPassword && !permissionsPassword && !preventPrinting && !preventCopying && !preventEditing && !enableRasterize) {
      toast.warning(isEs ? 'Debes establecer al menos una contraseña o regla de protección' : 'Please set at least one password or protection rule');
      return;
    }

    setIsProcessing(true);
    setProgressMsg(isEs ? 'Iniciando proceso de seguridad y cifrado AES-256...' : 'Starting AES-256 security & encryption process...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      let pdfBytesToEncrypt: Uint8Array;

      // 1. Si se activó rasterizado (aplanar a imagen para máxima seguridad dura):
      if (enableRasterize) {
        setProgressMsg(isEs ? 'Rasterizando páginas a capas no editables de alta resolución...' : 'Rasterizing pages into high-resolution non-editable layers...');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const srcDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        const rasterPdf = await PDFDocument.create();

        for (let pageNum = 1; pageNum <= srcDoc.numPages; pageNum++) {
          const page = await srcDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // 300 DPI high resolution
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
            const blobJpeg = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.92));
            if (blobJpeg) {
              const jpegBytes = await blobJpeg.arrayBuffer();
              const embeddedImg = await rasterPdf.embedJpg(jpegBytes);
              const origViewport = page.getViewport({ scale: 1.0 });

              const newPage = rasterPdf.addPage([origViewport.width, origViewport.height]);
              newPage.drawImage(embeddedImg, {
                x: 0,
                y: 0,
                width: origViewport.width,
                height: origViewport.height,
              });
            }
          }
        }
        pdfBytesToEncrypt = new Uint8Array(await rasterPdf.save({ useObjectStreams: false }));
      } else {
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        pdfBytesToEncrypt = new Uint8Array(await pdfDoc.save({ useObjectStreams: false }));
      }

      setProgressMsg(isEs ? 'Aplicando mapa de permisos /P y cifrado AES-256...' : 'Applying /P permissions map and AES-256 encryption...');

      const targetUserPassword = openPassword || '';
      // Garantizar que targetOwnerPassword sea SIEMPRE diferente de targetUserPassword para obligar a Adobe Acrobat a aplicar las restricciones de usuario
      const targetOwnerPassword = permissionsPassword 
        ? permissionsPassword 
        : (openPassword ? `${openPassword}_master_owner_2026` : 'PDFBLACK_PROTECTED_MASTER_KEY_2026');

      const rawEncryptedBytes = await encryptPDF(pdfBytesToEncrypt, targetUserPassword, {
        ownerPassword: targetOwnerPassword,
        algorithm: 'AES-256',
        allowPrinting: !preventPrinting,
        allowHighQualityPrint: !preventPrinting,
        allowModifying: !preventEditing,
        allowCopying: !preventCopying,
        allowExtraction: !preventCopying,
        allowAnnotating: !preventEditing,
        allowFillingForms: !preventEditing,
        allowAssembly: !preventEditing,
      });

      const encryptedBytes = ensureTrailerIdForAdobeAcrobat(rawEncryptedBytes);

      const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_Protegido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(isEs ? '¡Documento PDF protegido con éxito! Restricciones de permisos aplicadas.' : 'PDF protected successfully! Permission restrictions enforced.');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'Ocurrió un error al aplicar la protección al PDF' : 'An error occurred while protecting the PDF');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // INITIAL STATE: File Upload Dropzone
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
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isEs ? 'Proteger y Encriptar PDF' : 'Protect & Encrypt PDF'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
            {isEs ? 'Establece contraseñas de apertura, restringe la impresión o copia y rasteriza el contenido en un archivo seguro.' : 'Set open passwords, restrict printing or copying, and rasterize content into a secure file.'}
          </p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#09090b] border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-10 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[300px]"
        >
          <div className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <div className="text-center font-sans">
            <h3 className="text-lg font-bold text-white tracking-tight">{isEs ? 'Arrastra tu PDF aquí para proteger' : 'Drop your PDF here to protect'}</h3>
            <p className="text-zinc-400 text-xs font-mono mt-1">{isEs ? 'O haz clic para explorar tus archivos' : 'Or click to browse your files'}</p>
          </div>
          <button className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-semibold shadow-md transition-all">
            {isEs ? 'Subir Archivo PDF' : 'Upload PDF File'}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-zinc-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEs ? 'Procesamiento 100% Local • Cifrado AES de 256 Bits en tu navegador' : '100% Local Processing • 256-bit AES encryption in browser'}</span>
        </div>
      </div>
    );
  }

  // DUAL WORKSPACE: LEFT = Document Viewer | RIGHT = Security Options Form
  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

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
              004 / PROTECCIÓN Y CIFRADO DE ARCHIVOS PDF
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
              <Lock className="w-6 h-6 text-white flex-shrink-0" />
              <span>{isEs ? 'PROTEGER Y CIFRAR DOCUMENTOS PDF CON CONTRASEÑA' : 'PROTECT AND ENCRYPT PDF DOCUMENTS WITH PASSWORD'}</span>
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
              onClick={removeFile}
              className="p-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
              title={isEs ? 'Quitar archivo' : 'Remove file'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PDF DOCUMENT VIEWER (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative h-[680px] shadow-2xl">
            {/* Header Toolbar */}
            <div className="bg-zinc-900 border-b border-white/10 px-4 py-3 flex justify-between items-center font-mono">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-[180px]">{file.name}</span>
              </div>

              <button 
                onClick={removeFile}
                className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isEs ? 'Cambiar' : 'Change'}</span>
              </button>
            </div>

            {/* Document Canvas Preview */}
            <div className="flex-1 bg-[#09090b] relative flex items-center justify-center p-3 min-h-[520px]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="text-xs font-mono">{isEs ? "Generando previsualización..." : "Rendering preview..."}</span>
                </div>
              ) : previewDataUrl ? (
                <div className="w-full h-full max-h-[580px] flex items-center justify-center relative">
                  <img 
                    src={previewDataUrl} 
                    alt={`Página ${currentPage}`}
                    className="max-h-[560px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-white/15 bg-white transition-all duration-200"
                  />
                  {/* Security Overlay Badge */}
                  <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AES 256-BIT ENCRYPTION</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <FileText className="w-10 h-10 text-zinc-600" />
                  <span className="text-xs font-mono">{isEs ? "Vista previa no disponible" : "Preview unavailable"}</span>
                </div>
              )}
            </div>

            {/* Bottom Viewer Toolbar */}
            <div className="bg-zinc-900 border-t border-white/10 px-4 py-2.5 flex items-center justify-between font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-white font-bold">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
                <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
              </div>
              <span className="truncate max-w-[120px] text-[11px]">{file.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="hover:text-white text-xs">&larr;</button>
                <span>{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="hover:text-white text-xs">&rarr;</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SECURITY OPTIONS FORM (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          {/* CABECERA CON TÍTULO PANEL DE CONTROL */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-2xl font-sans">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-semibold block mb-1">
                002 / CONFIGURACIÓN
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight font-sans uppercase">
                PANEL DE CONTROL
              </h2>
            </div>
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10 text-white">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
          
          {/* SECCIÓN 1: Establecer contraseña para abrir el documento */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1 font-sans">
                {isEs ? 'Establecer contraseña para abrir el documento' : 'Set password to open the document'}
              </h3>
              <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                {isEs 
                  ? 'Esta contraseña se puede usar para evitar el acceso no deseado al archivo.' 
                  : 'This password can be used to prevent unwanted access to the file.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-semibold">
                  {isEs ? 'Introduce la contraseña para abrir' : 'Enter open password'}
                </label>
                <div className="relative">
                  <input
                    type={showOpenPassword ? 'text' : 'password'}
                    value={openPassword}
                    onChange={(e) => setOpenPassword(e.target.value)}
                    placeholder={isEs ? 'Introduce la contraseña para abrir' : 'Enter open password'}
                    className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenPassword(!showOpenPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showOpenPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-semibold">
                  {isEs ? 'Repite la contraseña para abrir' : 'Confirm open password'}
                </label>
                <input
                  type={showOpenPassword ? 'text' : 'password'}
                  value={confirmOpenPassword}
                  onChange={(e) => setConfirmOpenPassword(e.target.value)}
                  placeholder={isEs ? 'Repite la contraseña para abrir' : 'Repeat open password'}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Establecer contraseña para restringir permisos */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1 font-sans">
                {isEs ? 'Establecer contraseña para restringir permisos' : 'Set password to restrict permissions'}
              </h3>
              <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                {isEs 
                  ? 'Esta contraseña se puede usar para limitar la funcionalidad del PDF.' 
                  : 'This password can be used to limit PDF functionality.'}
              </p>
            </div>

            {/* Note box */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                {isEs 
                  ? 'Si me restringes los derechos de uso y solo especificas una contraseña de permisos, algunos programas podrían ignorar estas restricciones. Elige una contraseña de apertura para cifrar y proteger tu PDF.'
                  : 'If you restrict usage rights and only specify a permissions password, some programs might ignore these restrictions. Choose an open password to encrypt and protect your PDF.'}
              </p>
            </div>

            {/* Permisos Checkboxes */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-white/10 font-sans">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                {isEs ? 'Permisos:' : 'Permissions:'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={preventPrinting}
                    onChange={(e) => setPreventPrinting(e.target.checked)}
                    className="w-4 h-4 accent-white rounded"
                  />
                  <span className="text-zinc-200">{isEs ? 'Evitar impresión:' : 'Prevent printing:'}</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={preventCopying}
                    onChange={(e) => setPreventCopying(e.target.checked)}
                    className="w-4 h-4 accent-white rounded"
                  />
                  <span className="text-zinc-200">{isEs ? 'Evitar copia:' : 'Prevent copying:'}</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={preventEditing}
                    onChange={(e) => setPreventEditing(e.target.checked)}
                    className="w-4 h-4 accent-white rounded"
                  />
                  <span className="text-zinc-200">{isEs ? 'Evitar edición:' : 'Prevent editing:'}</span>
                </label>
              </div>
            </div>

            {/* Permission Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-semibold">
                  {isEs ? 'Introduce la contraseña de permisos' : 'Enter permissions password'}
                </label>
                <div className="relative">
                  <input
                    type={showPermissionsPassword ? 'text' : 'password'}
                    value={permissionsPassword}
                    onChange={(e) => setPermissionsPassword(e.target.value)}
                    placeholder={isEs ? 'Introduce la contraseña de permisos' : 'Enter permissions password'}
                    className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPermissionsPassword(!showPermissionsPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPermissionsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-semibold">
                  {isEs ? 'Repite la contraseña de permisos' : 'Confirm permissions password'}
                </label>
                <input
                  type={showPermissionsPassword ? 'text' : 'password'}
                  value={confirmPermissionsPassword}
                  onChange={(e) => setConfirmPermissionsPassword(e.target.value)}
                  placeholder={isEs ? 'Repite la contraseña de permisos' : 'Repeat permissions password'}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Ajustes opcionales (Rasterizado) */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 shadow-2xl font-sans">
            <div className="flex items-center gap-2 font-mono">
              <Settings className="w-4 h-4 text-white" />
              <h3 className="text-base font-bold text-white tracking-tight">
                {isEs ? 'Ajustes opcionales' : 'Optional settings'}
              </h3>
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex flex-col gap-2.5 font-sans">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                {isEs ? 'Rasterizar:' : 'Rasterize:'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isEs 
                  ? 'Para mayor seguridad, puedes seleccionar esta opción para evitar que otros editen el documento o revelen posibles áreas ocultas, ya que todo el contenido se combinará en una sola capa no editable ni editable mediante búsqueda.'
                  : 'For extra security, select this option to prevent editing or revealing hidden areas, as all content will be combined into a single non-editable, non-searchable layer.'}
              </p>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer font-mono text-xs font-semibold text-white">
                <input
                  type="checkbox"
                  checked={enableRasterize}
                  onChange={(e) => setEnableRasterize(e.target.checked)}
                  className="w-4 h-4 accent-white rounded"
                />
                <span>{isEs ? 'Activar rasterizado' : 'Enable rasterization'}</span>
              </label>
            </div>
          </div>

          {/* SECCIÓN 4: Botón Principal de Acción (INICIAR →) */}
          <div className="flex justify-end pt-1">
            <button
              onClick={executeProtect}
              disabled={isProcessing}
              className="bg-white hover:bg-zinc-200 text-black font-extrabold text-sm sm:text-base py-3.5 px-8 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-2xl group disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{progressMsg || (isEs ? 'Procesando...' : 'Processing...')}</span>
                </>
              ) : (
                <>
                  <span>{isEs ? 'INICIAR' : 'START'}</span>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}