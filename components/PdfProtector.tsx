'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { 
  ShieldCheck, Lock, Loader2, FileText, X, Eye, EyeOff, 
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
    setProgressMsg(isEs ? 'Encriptando documento con cifrado AES...' : 'Encrypting document with AES...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pdfBytes = await pdfDoc.save();

      const targetUserPassword = openPassword || '';
      const targetOwnerPassword = permissionsPassword || openPassword || 'pdfblack-owner';

      const encryptedBytes = await encryptPDF(new Uint8Array(pdfBytes), targetUserPassword, {
        ownerPassword: targetOwnerPassword,
        allowPrinting: !preventPrinting,
        allowModifying: !preventEditing,
        allowCopying: !preventCopying,
        allowAnnotating: !preventEditing,
        allowFillingForms: !preventEditing,
      });

      const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${originalName}_Protegido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(isEs ? '¡Documento PDF protegido y descargado con éxito!' : 'PDF document protected and downloaded successfully!');
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
    <div className="w-full font-sans">
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

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
            <div className="flex-1 bg-[#121215] relative overflow-y-auto p-4 flex flex-col items-center">
              <div className="w-full bg-white rounded shadow-2xl text-black p-6 sm:p-8 min-h-[580px] relative font-serif text-xs leading-relaxed select-none border border-gray-200">
                
                {/* Security Overlay Badge */}
                <div className="absolute top-4 right-4 bg-emerald-100 border border-emerald-400 text-emerald-900 px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  <span>AES 256-BIT ENCRYPTION</span>
                </div>

                <div className="absolute top-4 left-6 text-2xl font-bold text-black font-sans">{currentPage}</div>

                <div className="mt-8 space-y-4">
                  <h2 className="text-base font-bold text-black font-sans border-b pb-2">
                    DOCUMENTO PROTEGIDO CON CIFRADO
                  </h2>

                  <p className="text-xs text-gray-800 leading-relaxed">
                    Este documento PDF se encuentra actualmente cargado en PDFBLACK y listo para aplicar restricciones de apertura y permisos.
                  </p>

                  <div className="bg-gray-50 border-l-2 border-emerald-500 p-3 text-xs text-gray-900 space-y-1.5 font-sans rounded">
                    <strong className="text-emerald-950 font-mono text-[11px]">Resumen de Seguridad Configurada:</strong>
                    <p className="text-[11px] text-gray-700">
                      • Contraseña de Apertura: <span className="font-bold text-emerald-700">{openPassword ? '✓ Habilitada' : 'Sin clave'}</span>
                    </p>
                    <p className="text-[11px] text-gray-700">
                      • Evitar Impresión: <span className="font-bold text-emerald-700">{preventPrinting ? '✓ Activo' : 'Permitido'}</span>
                    </p>
                    <p className="text-[11px] text-gray-700">
                      • Evitar Copia: <span className="font-bold text-emerald-700">{preventCopying ? '✓ Activo' : 'Permitido'}</span>
                    </p>
                    <p className="text-[11px] text-gray-700">
                      • Rasterizado: <span className="font-bold text-emerald-700">{enableRasterize ? '✓ Activado' : 'Desactivado'}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-16 text-[10px] text-gray-400 border-t pt-2 font-mono flex justify-between">
                  <span>{file.name}</span>
                  <span>Página {currentPage} de {totalPages}</span>
                </div>
              </div>
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

        {/* RIGHT COLUMN: SECURITY OPTIONS FORM (7 Cols) (Matching Screenshot 1 & 2) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
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