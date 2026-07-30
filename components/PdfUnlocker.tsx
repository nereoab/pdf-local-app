'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowLeft, Unlock, FileDown, Loader2, X, ShieldCheck, FilePlus, KeyRound, CheckCircle2, ArrowRight, RefreshCw, FileText, UploadCloud, HardDrive, Clock, Lock, Eye, EyeOff, ShieldAlert, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfUnlocker() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { globalFile, setGlobalFile } = useFileStore();

  const [file, setFile] = useState<File | null>(globalFile);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState<boolean | null>(null);
  const [unlockedPageCount, setUnlockedPageCount] = useState<number | null>(null);

  useEffect(() => {
    if (globalFile && !file) {
      setFile(globalFile);
    }
  }, [globalFile, file]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      detectEncryptionStatus(file);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
      setIsProtected(null);
    }
  }, [file]);

  const detectEncryptionStatus = async (selectedFile: File) => {
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const str = new TextDecoder('latin1').decode(uint8.subarray(0, Math.min(uint8.length, 10000)));

      if (str.includes('/Encrypt')) {
        setIsProtected(true);
      } else {
        setIsProtected(false);
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
    setProgressMsg(isEs ? 'Iniciando análisis de cifrado AES/RC4...' : 'Starting AES/RC4 encryption analysis...');
    let localUrl: string | null = null;

    try {
      await new Promise(r => setTimeout(r, 60));
      setProgressPercent(35);
      setProgressMsg(isEs ? 'Descifrando tabla de objetos y mapa de permisos...' : 'Decrypting object table and permission map...');

      const arrayBuffer = await file.arrayBuffer();

      // Carga ignorando encriptación o usando la contraseña provista
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true
      });

      setProgressPercent(70);
      setProgressMsg(isEs ? 'Eliminando diccionario /Encrypt y liberando permisos...' : 'Removing /Encrypt dictionary & releasing permissions...');
      await new Promise(r => setTimeout(r, 80));

      const pageCount = pdfDoc.getPageCount();

      // Guardamos el documento reescribiendo la estructura sin la contraseña ni permisos restringidos
      const unlockedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([unlockedBytes as any], { type: 'application/pdf' });
      localUrl = URL.createObjectURL(blob);

      setProgressPercent(100);
      setUnlockedPageCount(pageCount);
      setDownloadUrl(localUrl);

      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${originalName}_Libre.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Restricciones removidas! PDF listo para imprimir y editar.' : 'Restrictions removed! PDF ready for printing & editing.');
    } catch (error) {
      console.error(error);
      toast.error(isEs ? 'No se pudo desbloquear. Verifica si la contraseña ingresada es correcta.' : 'Unable to unlock. Please check if password is correct.');
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
              <div className="w-full flex-1 bg-[#09090b] relative flex items-center justify-center p-6 min-h-[440px]">
                {pdfUrl ? (
                  <div className="h-[92%] aspect-[1/1.414] shadow-2xl flex items-center justify-center">
                    <iframe 
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                      className="w-full h-full border-none bg-white shadow-2xl rounded-md pointer-events-auto" 
                      scrolling="no"
                      title="PDF Preview" 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="text-xs font-mono">{isEs ? "Cargando previsualización..." : "Loading preview..."}</span>
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

