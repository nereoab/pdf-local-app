'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Eye,
  X,
  RotateCcw,
  Sparkles,
  Loader2,
  ShieldCheck,
  Pencil,
  FileText,
  Layers,
  Lock,
  PenTool,
  Zap,
  Globe,
  Monitor,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import {
  WhatsAppIcon,
  TelegramIcon,
  GoogleDriveIcon,
  FacebookIcon,
  GmailIcon,
  QrBrandIcon,
  SystemShareBrandIcon,
  CopyFileBrandIcon,
} from '@/components/ShareBrandIcons';
import { AnimatedCheckmark, triggerLuxuryConfetti } from '@/components/ui/AnimatedSuccessCheck';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createShareLink } from '@/lib/share-service';
import {
  requestDriveAccessToken,
  uploadFileToDrive,
  type DriveUploadResult,
} from '@/lib/google-drive';

export interface FoliarSuccessViewProps {
  completedResult: {
    downloadUrl: string;
    filename: string;
    fileSize?: string;
    rawBlob?: Blob;
  };
  totalPages: number;
  numberedCount: number;
  modeText?: string;
  onReset: () => void;
}

export default function FoliarSuccessView({
  completedResult,
  totalPages,
  numberedCount,
  modeText,
  onReset,
}: FoliarSuccessViewProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const router = useRouter();
  const setGlobalFile = useFileStore((s) => s.setGlobalFile);

  // Estados interactivos
  const [downloaded, setDownloaded] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customFilename, setCustomFilename] = useState(completedResult.filename);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploadingShare, setIsUploadingShare] = useState<boolean>(false);

  // Google Drive modal states
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'auth' | 'uploading' | 'success' | 'error'>(
    'auth',
  );
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveResult, setDriveResult] = useState<DriveUploadResult | null>(null);

  const activeFilename = customFilename.trim() || completedResult.filename;

  // Disparar confetti inicial al montar
  useEffect(() => {
    try {
      triggerLuxuryConfetti();
    } catch {
      // no-op si no está disponible
    }
  }, []);

  // Generar o recuperar enlace de descarga oficial de PDFBlack
  const getOrCreateShareLink = async (): Promise<string> => {
    if (shareUrl) return shareUrl;
    if (!completedResult.rawBlob) {
      return 'https://pdf-black.com/editar/foliar';
    }

    try {
      setIsUploadingShare(true);
      toast.loading(
        isEs ? 'Generando enlace seguro con tu marca...' : 'Generating secure brand link...',
        { id: 'share-link-gen' },
      );
      const res = await createShareLink(completedResult.rawBlob, activeFilename, 'Foliado de PDF');
      setShareUrl(res.shareUrl);
      toast.success(
        isEs ? '¡Enlace oficial generado con éxito!' : 'Official link generated successfully!',
        { id: 'share-link-gen' },
      );
      return res.shareUrl;
    } catch (err) {
      console.warn('Share link generation error', err);
      toast.dismiss('share-link-gen');
      return 'https://pdf-black.com/editar/foliar';
    } finally {
      setIsUploadingShare(false);
    }
  };

  // Generar QR dinámico para el modal apuntando al enlace oficial del documento
  useEffect(() => {
    if (!showQRModal) return;

    let isMounted = true;
    (async () => {
      try {
        const QRCode = await import('qrcode');
        const targetUrl = await getOrCreateShareLink();
        const url = await QRCode.toDataURL(targetUrl, {
          width: 280,
          margin: 1.5,
          color: {
            dark: '#000000',
            light: '#FAF6EE',
          },
        });
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.warn('QR Code load fallback', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [showQRModal]);

  // 1. Descarga manual con confetti
  const handleManualDownload = () => {
    if (!completedResult.downloadUrl) return;
    const link = document.createElement('a');
    link.href = completedResult.downloadUrl;
    link.download = activeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    triggerLuxuryConfetti();
    toast.success(isEs ? '¡Descarga iniciada con éxito!' : 'Download started successfully!');
  };

  // 2. Copiar enlace oficial al portapapeles
  const handleCopyShareLink = async () => {
    try {
      const link = await getOrCreateShareLink();
      await navigator.clipboard.writeText(link);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 3000);
      toast.success(
        isEs
          ? '¡Enlace oficial de PDFBlack copiado al portapapeles!'
          : 'Official PDFBlack link copied to clipboard!',
      );
    } catch (err) {
      console.warn('Clipboard write error', err);
    }
  };

  // 3. Compartir en WhatsApp - Abrir selector Web vs Escritorio
  const handleShareWhatsApp = () => {
    setShowWhatsAppModal(true);
    // Pre-generar enlace en segundo plano para que esté listo al instante
    getOrCreateShareLink().catch(() => {});
  };

  const handleLaunchWhatsAppWeb = async () => {
    const link = await getOrCreateShareLink();
    const text = encodeURIComponent(
      isEs
        ? `📄 Hola, te comparto el documento foliado: *${activeFilename}*\n\n🔗 Puedes descargarlo o verlo aquí:\n${link}\n\n✨ Procesado con PDFBlack: https://pdf-black.com`
        : `📄 Hi, sharing the numbered document: *${activeFilename}*\n\n🔗 View and download it here:\n${link}\n\n✨ Processed with PDFBlack: https://pdf-black.com`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
    setShowWhatsAppModal(false);
    toast.success(
      isEs
        ? '¡Elige tu contacto en WhatsApp para enviarle el enlace!'
        : 'Choose your contact in WhatsApp to send the link!',
      { duration: 6000 },
    );
  };

  const handleLaunchWhatsAppDesktop = async () => {
    const link = await getOrCreateShareLink();
    const text = encodeURIComponent(
      isEs
        ? `📄 Hola, te comparto el documento foliado: *${activeFilename}*\n\n🔗 Puedes descargarlo o verlo aquí:\n${link}\n\n✨ Procesado con PDFBlack: https://pdf-black.com`
        : `📄 Hi, sharing the numbered document: *${activeFilename}*\n\n🔗 View and download it here:\n${link}\n\n✨ Processed with PDFBlack: https://pdf-black.com`,
    );
    window.location.href = `whatsapp://send?text=${text}`;
    setShowWhatsAppModal(false);
    toast.success(
      isEs
        ? '¡Elige tu contacto en WhatsApp para enviarle el enlace!'
        : 'Choose your contact in WhatsApp to send the link!',
      { duration: 6000 },
    );
  };

  const handleDirectMobileShareWhatsApp = async () => {
    const link = await getOrCreateShareLink();
    if (completedResult.rawBlob && typeof navigator !== 'undefined' && navigator.canShare) {
      const file = new File([completedResult.rawBlob], activeFilename, {
        type: 'application/pdf',
      });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: activeFilename,
            url: link,
            text: isEs
              ? `Te comparto el documento foliado: ${activeFilename} (${link})`
              : `Sharing numbered document: ${activeFilename} (${link})`,
          });
          setShowWhatsAppModal(false);
          toast.success(isEs ? '¡Archivo enviado a WhatsApp!' : 'File sent to WhatsApp!');
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
        }
      }
    }
    handleLaunchWhatsAppDesktop();
  };

  // 4. Compartir en Telegram
  const handleShareTelegram = async () => {
    const link = await getOrCreateShareLink();
    const text = encodeURIComponent(
      isEs
        ? `📄 Documento foliado con PDFBlack: ${activeFilename}`
        : `📄 Numbered document via PDFBlack: ${activeFilename}`,
    );
    const url = encodeURIComponent(link);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
    toast.success(isEs ? 'Abriendo Telegram...' : 'Opening Telegram...');
  };

  // 5. Guardar en Google Drive (OAuth + Upload directo)
  const handleShareGoogleDrive = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // Fallback: si no hay Client ID configurado, usa el método manual
    if (!clientId) {
      handleManualDownload();
      toast.info(
        isEs
          ? 'Descarga iniciada. Abriendo Google Drive para que arrastres tu archivo...'
          : 'Download started. Opening Google Drive to drop your file...',
        { duration: 5000 },
      );
      window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
      return;
    }

    if (!completedResult.rawBlob) {
      toast.error(
        isEs
          ? 'No se encontró el archivo para subir. Intenta descargar primero.'
          : 'File not found for upload. Try downloading first.',
      );
      return;
    }

    // Abrir modal y comenzar flujo OAuth
    setShowDriveModal(true);
    setDriveStatus('auth');
    setDriveError(null);
    setDriveResult(null);

    try {
      // Paso 1: OAuth popup — el usuario elige su cuenta de Google
      const accessToken = await requestDriveAccessToken(clientId);

      // Paso 2: Subir archivo
      setDriveStatus('uploading');
      const result = await uploadFileToDrive(completedResult.rawBlob, activeFilename, accessToken);

      // Paso 3: ¡Éxito!
      setDriveResult(result);
      setDriveStatus('success');
      toast.success(
        isEs
          ? '¡Archivo guardado en Google Drive con éxito!'
          : 'File saved to Google Drive successfully!',
      );
    } catch (err) {
      console.error('[Google Drive] Upload error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';

      // Si el usuario cerró el popup de OAuth, cerrar modal silenciosamente
      if (message.includes('popup') || message.includes('closed') || message.includes('blocked')) {
        setShowDriveModal(false);
        return;
      }

      setDriveError(message);
      setDriveStatus('error');
    }
  }, [completedResult.rawBlob, activeFilename, isEs]);

  // 6. Compartir en Facebook
  const handleShareFacebook = async () => {
    const link = await getOrCreateShareLink();
    const url = encodeURIComponent(link);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'noopener,noreferrer,width=600,height=500',
    );
  };

  // 7. Enviar por Correo / Gmail
  const handleShareEmail = async () => {
    const link = await getOrCreateShareLink();
    const subject = encodeURIComponent(
      isEs
        ? `Documento Foliado: ${activeFilename} - PDFBlack`
        : `Numbered Document: ${activeFilename} - PDFBlack`,
    );
    const body = encodeURIComponent(
      isEs
        ? `Hola,\n\nTe comparto el documento "${activeFilename}" foliado y procesado de forma segura mediante PDFBlack.\n\nPuedes previsualizarlo o descargarlo directamente aquí:\n${link}\n\nSaludos,\nPDFBlack Suite`
        : `Hi,\n\nSharing the document "${activeFilename}" numbered securely with PDFBlack.\n\nYou can preview or download it directly here:\n${link}\n\nRegards,\nPDFBlack Suite`,
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    toast.success(isEs ? 'Abriendo Gmail...' : 'Opening Gmail...');
  };

  // 8. Compartir del Sistema / Más Apps (AirDrop, Bluetooth, etc.)
  const handleNativeShare = async () => {
    if (completedResult.rawBlob && typeof navigator !== 'undefined' && navigator.canShare) {
      const file = new File([completedResult.rawBlob], activeFilename, {
        type: 'application/pdf',
      });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: activeFilename,
            text: isEs ? `Documento foliado: ${activeFilename}` : `Numbered PDF: ${activeFilename}`,
          });
          toast.success(isEs ? '¡Compartido!' : 'Shared successfully!');
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
        }
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeFilename,
          text: `Documento foliado: ${activeFilename}`,
          url: 'https://pdf-black.com',
        });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }

    handleCopyShareLink();
  };

  // 9. Encadenamiento suave hacia otra herramienta
  const handleNavigateToTool = async (targetPath: string) => {
    try {
      if (completedResult.rawBlob) {
        const fileToPass = new File([completedResult.rawBlob], activeFilename, {
          type: 'application/pdf',
        });
        setGlobalFile(fileToPass);
        toast.info(
          isEs
            ? `Cargando ${activeFilename} en la siguiente herramienta...`
            : `Loading ${activeFilename} into next tool...`,
        );
      }
      router.push(targetPath);
    } catch (err) {
      console.error(err);
      router.push(targetPath);
    }
  };

  const chainTools = [
    {
      id: 'comprimir',
      name: isEs ? 'Comprimir PDF' : 'Compress PDF',
      icon: Zap,
      path: '/optimizar/comprimir',
    },
    { id: 'firma', name: isEs ? 'Firmar PDF' : 'Sign PDF', icon: PenTool, path: '/editar/firma' },
    {
      id: 'proteger',
      name: isEs ? 'Proteger' : 'Protect',
      icon: Lock,
      path: '/optimizar/proteger',
    },
    { id: 'unir', name: isEs ? 'Unir PDF' : 'Merge PDF', icon: Layers, path: '/organizar/unir' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto my-6 font-sans space-y-4"
    >
      {/* ── 1. CABECERA SUPERIOR LIMPIA CON ESTADO Y RESET ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111116]/90 border border-zinc-700/80 rounded-2xl px-5 py-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-zinc-900 border border-[#E8DFCF]/40 rounded-xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
            <AnimatedCheckmark size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FAF6EE]/10 border border-[#E8DFCF]/30 text-[#E8DFCF] font-bold text-[10px] font-mono rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#FAF6EE]" />
                {isEs ? 'Foliado Completado' : 'Numbering Completed'}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 text-[10px] font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {isEs ? '100% Local & Privado' : '100% Local & Private'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight uppercase">
              {isEs ? '¡Documento Foliado con Éxito!' : 'Document Numbered Successfully!'}
            </h2>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono border border-zinc-700 hover:border-[#E8DFCF]/50 transition-all cursor-pointer shadow-sm self-stretch sm:self-auto justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-white" />
          <span>{isEs ? 'Procesar otro archivo' : 'Process another file'}</span>
        </button>
      </div>

      {/* ── 2. METADATOS DEL ARCHIVO Y ACCIONES RÁPIDAS ── */}
      <div className="bg-[#14141b] border border-zinc-700/70 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5 min-w-0 max-w-full">
          <div className="bg-zinc-800 border border-zinc-600 p-2.5 rounded-xl flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="bg-black/60 border border-[#E8DFCF] rounded-lg px-2.5 py-1 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#FAF6EE]"
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-emerald-400"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base truncate max-w-[240px] sm:max-w-[420px] font-mono">
                  {activeFilename}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={isEs ? 'Renombrar archivo' : 'Rename file'}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-1 flex-wrap">
              <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold uppercase">
                PDF
              </span>
              {completedResult.fileSize && <span>• {completedResult.fileSize}</span>}
              <span className="px-2 py-0.5 bg-[#FAF6EE]/10 border border-[#E8DFCF]/20 text-[#FAF6EE] rounded font-bold">
                {numberedCount} {isEs ? 'de' : 'of'} {totalPages}{' '}
                {isEs ? 'págs foliadas' : 'pages numbered'}
              </span>
              <span className="text-zinc-500 hidden sm:inline">
                • {modeText || (isEs ? 'Motor Notarial' : 'Notarial Engine')}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción rápida secundaria */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-shrink-0">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-mono border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer shadow-sm"
          >
            <Eye className="w-4 h-4 text-[#FAF6EE]" />
            <span>{isEs ? 'Vista Previa' : 'Preview'}</span>
          </button>
          <button
            onClick={handleCopyShareLink}
            disabled={isUploadingShare}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-mono border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer shadow-sm"
          >
            {copiedFile ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-[#FAF6EE]" />
            )}
            <span>
              {copiedFile ? (isEs ? '¡Copiado!' : 'Copied!') : isEs ? 'Copiar Enlace' : 'Copy Link'}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. EL CUADRO DE LA SOLUCIÓN (DESCARGA ARRIBA + COMPARTIR DEBAJO) ── */}
      <div className="relative w-full rounded-3xl p-[1.5px] overflow-hidden shadow-2xl">
        {/* Haz de luz láser perimetral animado */}
        <div className="absolute -inset-[150%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_310deg,#FAF6EE_345deg,#E8DFCF_360deg)] pointer-events-none opacity-85" />
        {/* Resplandor ambiental de lujo */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#E8DFCF]/15 via-[#FAF6EE]/10 to-[#DFD5C2]/15 rounded-3xl blur-2xl pointer-events-none" />

        {/* Contenedor principal de acción */}
        <div className="relative w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-6">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/40 to-transparent pointer-events-none" />

          {/* ── A) BOTÓN DE DESCARGA PRINCIPAL (ARRIBA) ── */}
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleManualDownload}
              className={`w-full relative overflow-hidden flex flex-col sm:flex-row items-center justify-center gap-3 px-6 py-4.5 sm:py-5 rounded-2xl font-sans font-extrabold text-base sm:text-lg transition-all cursor-pointer shadow-xl group border ${
                downloaded
                  ? 'bg-gradient-to-r from-[#FAF6EE] to-[#E8DFCF] text-black border-[#FAF6EE] shadow-[0_0_35px_rgba(250,246,238,0.5)]'
                  : 'bg-gradient-to-r from-[#FAF6EE] via-[#E8DFCF] to-[#DFD5C2] text-black shadow-[0_0_30px_rgba(232,223,207,0.35)] hover:shadow-[0_0_45px_rgba(250,246,238,0.65)] border-[#FAF6EE]'
              }`}
            >
              {/* Shimmer sweep infinito */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="flex items-center gap-2.5">
                {downloaded ? (
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 stroke-[2.5]" />
                ) : (
                  <Download className="w-6 h-6 text-black group-hover:translate-y-0.5 transition-transform flex-shrink-0 stroke-[2.5]" />
                )}
                <span className="tracking-tight uppercase">
                  {downloaded
                    ? isEs
                      ? '¡Descargado con éxito! Descargar de nuevo'
                      : 'Downloaded! Download again'
                    : isEs
                      ? 'Descargar Documento Foliado'
                      : 'Download Numbered PDF'}
                </span>
              </div>

              {completedResult.fileSize && (
                <span className="text-xs font-mono font-bold bg-black/15 px-2.5 py-1 rounded-full text-black/90">
                  {completedResult.fileSize} • {isEs ? 'Listo para imprimir' : 'Ready to print'}
                </span>
              )}
            </motion.button>
          </div>

          {/* ── B) BOTONES PARA COMPARTIR EL ARCHIVO (MISMO PROTAGONISMO) ── */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-sans">
                <Share2 className="w-3.5 h-3.5 text-[#FAF6EE]" />
                {isEs
                  ? 'COMPARTIR ARCHIVO AL INSTANTE (100% PRIVADO)'
                  : 'INSTANT SHARE (100% PRIVATE)'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {isEs
                  ? 'Transferencia directa sin guardar en la nube'
                  : 'Direct transfer without cloud storage'}
              </span>
            </div>

            {/* CUADRÍCULA DE BOTONES DE COMPARTIR CON EL MISMO PROTAGONISMO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* 1. WhatsApp Oficial */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareWhatsApp}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#15241b] hover:to-[#0c1810] border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <WhatsAppIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(37,211,102,0.45)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 block font-sans">
                    WhatsApp
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'Chat o Web' : 'Chat or Web'}
                  </span>
                </div>
              </motion.button>

              {/* 2. Telegram Oficial */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareTelegram}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#13222d] hover:to-[#0b151d] border border-sky-500/40 hover:border-sky-400 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <TelegramIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(34,158,217,0.45)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-sky-300 block font-sans">
                    Telegram
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'Canal o grupo' : 'Channel or group'}
                  </span>
                </div>
              </motion.button>

              {/* 3. Google Drive Oficial */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareGoogleDrive}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#232014] hover:to-[#141209] border border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <GoogleDriveIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(255,186,0,0.4)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block font-sans">
                    Google Drive
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'Guardar en nube' : 'Save to cloud'}
                  </span>
                </div>
              </motion.button>

              {/* 4. Facebook Oficial */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareFacebook}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#141a29] hover:to-[#0a101b] border border-blue-500/40 hover:border-blue-400 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <FacebookIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(24,119,242,0.45)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-blue-300 block font-sans">
                    Facebook
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'Messenger o feed' : 'Messenger or feed'}
                  </span>
                </div>
              </motion.button>

              {/* 5. Código QR Móvil */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowQRModal(true)}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#262420] hover:to-[#171614] border border-[#E8DFCF]/40 hover:border-[#FAF6EE] rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <QrBrandIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(250,246,238,0.35)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-[#FAF6EE] block font-sans">
                    {isEs ? 'Código QR' : 'QR Code'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'Escanear con móvil' : 'Scan with mobile'}
                  </span>
                </div>
              </motion.button>

              {/* 6. Correo / Gmail Oficial */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareEmail}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#251818] hover:to-[#160c0c] border border-rose-500/40 hover:border-rose-400 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <GmailIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(234,67,53,0.4)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-rose-300 block font-sans">
                    {isEs ? 'Correo / Gmail' : 'Email / Gmail'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'Redactar mensaje' : 'Compose email'}
                  </span>
                </div>
              </motion.button>

              {/* 7. Más Apps (AirDrop / Compartir Sistema) */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNativeShare}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#211628] hover:to-[#120b17] border border-purple-500/40 hover:border-purple-400 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <SystemShareBrandIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(168,85,247,0.45)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-purple-300 block font-sans">
                    {isEs ? 'Más Apps' : 'More Apps'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 font-mono block leading-tight mt-0.5">
                    {isEs ? 'AirDrop o Sistema' : 'AirDrop or System'}
                  </span>
                </div>
              </motion.button>

              {/* 8. Copiar Enlace Oficial */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCopyShareLink}
                disabled={isUploadingShare}
                className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#1f2027] hover:to-[#111216] border border-zinc-600 hover:border-[#E8DFCF]/50 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="p-1 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <CopyFileBrandIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(148,163,184,0.35)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-[#FAF6EE] block font-sans">
                    {copiedFile
                      ? isEs
                        ? '¡Copiado!'
                        : 'Copied!'
                      : isEs
                        ? 'Copiar Enlace'
                        : 'Copy Link'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-[#FAF6EE] font-mono block leading-tight mt-0.5 truncate max-w-[110px]">
                    pdf-black.com
                  </span>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. TIRA DISCRETA DE ENCADENAMIENTO DE OTRAS HERRAMIENTAS ── */}
      <div className="bg-[#111116] border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md font-mono text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-[#FAF6EE]" />
          <span>
            {isEs ? '¿Deseas continuar editando este archivo?' : 'Continue editing this file?'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          {chainTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleNavigateToTool(tool.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-[#E8DFCF]/60 rounded-xl transition-all cursor-pointer text-xs"
              >
                <Icon className="w-3.5 h-3.5 text-[#FAF6EE]" />
                <span>{tool.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MODAL FLOTANTE 1: VISTA PREVIA RÁPIDA ── */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl h-[85vh] bg-[#121217] border border-[#E8DFCF]/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Barra superior del modal */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#FAF6EE]" />
                  <span className="text-white text-xs sm:text-sm font-mono font-bold truncate">
                    {activeFilename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EE] text-black rounded-lg text-xs font-bold hover:bg-[#E8DFCF] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Descargar' : 'Download'}</span>
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Visor de PDF embebido */}
              <div className="flex-1 w-full bg-zinc-950 relative">
                {completedResult.downloadUrl ? (
                  <iframe
                    src={completedResult.downloadUrl}
                    title="PDF Preview"
                    className="w-full h-full border-none"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
                    {isEs ? 'No se pudo cargar la vista previa' : 'Could not load preview'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL FLOTANTE 2: CÓDIGO QR PARA TRANSFERIR AL MÓVIL ── */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-[#121217] border border-[#E8DFCF]/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 font-sans"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-2 bg-zinc-900 border border-[#E8DFCF]/30 rounded-2xl text-[#FAF6EE] shadow-[0_0_15px_rgba(232,223,207,0.2)]">
                <QrBrandIcon className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight uppercase">
                  {isEs ? 'Transferir a tu Smartphone' : 'Transfer to your Smartphone'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  {isEs
                    ? 'Escanea con la cámara para abrir en tu móvil'
                    : 'Scan with camera to open on your phone'}
                </p>
              </div>

              {/* Contenedor del QR */}
              <div className="p-3.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-black font-mono text-xs">
                    <QrBrandIcon className="w-16 h-16 animate-pulse text-zinc-400" />
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-400 font-mono space-y-1">
                <p className="text-emerald-400 font-bold">
                  ✓ {isEs ? '100% Directo y Privado' : '100% Direct and Private'}
                </p>
                <p>
                  {isEs
                    ? 'También puedes enviártelo directo por WhatsApp Web a tu chat personal.'
                    : 'You can also send it to your personal chat on WhatsApp Web.'}
                </p>
              </div>

              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>{isEs ? 'Enviar a mi WhatsApp' : 'Send to my WhatsApp'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL FLOTANTE 3: GUARDAR EN GOOGLE DRIVE ── */}
      <AnimatePresence>
        {showDriveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#121217] border border-[#E8DFCF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5 font-sans"
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setShowDriveModal(false)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Título con ícono de Drive */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-900 border border-amber-500/40 rounded-2xl">
                  <GoogleDriveIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  {isEs ? 'Guardar en Drive' : 'Save to Drive'}
                </h3>
              </div>

              {/* Estados del flujo */}
              {(driveStatus === 'auth' || driveStatus === 'uploading') && (
                <div className="flex flex-col items-center gap-4 py-4">
                  {/* Spinner animado estilo iLovePDF */}
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-700" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E8DFCF] border-r-[#FAF6EE] animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-amber-500/60 animate-[spin_1.5s_linear_infinite_reverse]" />
                  </div>
                  <p className="text-sm text-zinc-300 font-mono">
                    {driveStatus === 'auth'
                      ? isEs
                        ? 'Esperando autorización de Google...'
                        : 'Waiting for Google authorization...'
                      : isEs
                        ? 'Subiendo archivo a Google Drive...'
                        : 'Uploading file to Google Drive...'}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {isEs ? 'Un momento por favor...' : 'Wait a moment, please...'}
                  </p>
                </div>
              )}

              {driveStatus === 'success' && driveResult && (
                <div className="flex flex-col items-center gap-4 py-4">
                  {/* Check animado */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 stroke-[2.5]" />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">
                      {isEs ? '¡Guardado con éxito!' : 'Saved successfully!'}
                    </p>
                    <p className="text-xs text-zinc-400 font-mono">{driveResult.fileName}</p>
                  </div>
                  {/* Abrir en Drive */}
                  <button
                    onClick={() =>
                      window.open(
                        `https://drive.google.com/file/d/${driveResult.fileId}/view`,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-[#E8DFCF]/50 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  >
                    <GoogleDriveIcon className="w-4 h-4" />
                    <span>{isEs ? 'Abrir en Google Drive' : 'Open in Google Drive'}</span>
                  </button>
                  {/* Botón Ok principal */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDriveModal(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#FAF6EE] via-[#E8DFCF] to-[#DFD5C2] text-black font-extrabold rounded-2xl text-sm uppercase tracking-wide shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Ok
                  </motion.button>
                </div>
              )}

              {driveStatus === 'error' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 rounded-full bg-rose-500/15 border-2 border-rose-400 flex items-center justify-center">
                    <X className="w-10 h-10 text-rose-400 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">
                      {isEs ? 'Error al guardar' : 'Save failed'}
                    </p>
                    <p className="text-xs text-rose-400 font-mono max-w-[300px] break-words">
                      {driveError}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        setShowDriveModal(false);
                        setTimeout(() => handleShareGoogleDrive(), 300);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-mono transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isEs ? 'Reintentar' : 'Retry'}</span>
                    </button>
                    <button
                      onClick={() => setShowDriveModal(false)}
                      className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-mono transition-all cursor-pointer"
                    >
                      {isEs ? 'Cerrar' : 'Close'}
                    </button>
                  </div>
                </div>
              )}

              {/* Nota de seguridad */}
              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>
                  {isEs
                    ? 'Solo se accede a guardar este archivo. No leemos tu Drive.'
                    : 'Only saves this file. We never read your Drive.'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL FLOTANTE 4: SELECTOR DE WHATSAPP WEB VS ESCRITORIO ── */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#121217] border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col space-y-5 font-sans"
            >
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex-shrink-0">
                  <WhatsAppIcon className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(37,211,102,0.45)]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight uppercase">
                    {isEs ? 'Compartir por WhatsApp' : 'Share via WhatsApp'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {isEs
                      ? 'Elige cómo prefieres enviar tu enlace de PDFBlack:'
                      : 'Choose how you prefer to send your PDFBlack link:'}
                  </p>
                </div>
              </div>

              {/* Caja de Enlace PDFBlack */}
              <div className="p-3 bg-black/60 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-2.5 font-mono text-xs shadow-inner">
                <div className="min-w-0 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-sans">
                      {isEs ? 'Enlace con tu marca:' : 'Link with your brand:'}
                    </span>
                    <span className="text-[#FAF6EE] font-bold truncate text-[11px] block">
                      {shareUrl || 'https://pdf-black.com/share/...'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopyShareLink}
                  disabled={isUploadingShare}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[#FAF6EE] rounded-xl text-[10px] font-bold transition-all cursor-pointer flex-shrink-0 border border-zinc-700 hover:border-[#E8DFCF]/50"
                >
                  {copiedFile
                    ? isEs
                      ? '¡Copiado!'
                      : 'Copied!'
                    : isEs
                      ? 'Copiar Enlace'
                      : 'Copy Link'}
                </button>
              </div>

              {/* Opciones de apertura */}
              <div className="space-y-2.5 pt-0.5">
                {/* Opción A: WhatsApp Web */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLaunchWhatsAppWeb}
                  disabled={isUploadingShare}
                  className="w-full bg-gradient-to-r from-[#17231b] via-[#121c15] to-[#0c140f] hover:from-[#1d2f23] hover:to-[#111e15] border border-emerald-500/40 hover:border-emerald-400 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3.5 transition-all text-left cursor-pointer group shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-300">
                          WhatsApp Web
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-mono font-bold">
                          {isEs ? 'Navegador' : 'Browser'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5 leading-snug">
                        {isEs
                          ? 'Abre WhatsApp Web con el enlace de descarga de PDFBlack listo para enviar a tu contacto.'
                          : 'Opens WhatsApp Web with your official PDFBlack link ready to send.'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.button>

                {/* Opción B: WhatsApp App de Escritorio */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLaunchWhatsAppDesktop}
                  disabled={isUploadingShare}
                  className="w-full bg-gradient-to-r from-[#17231b] via-[#121c15] to-[#0c140f] hover:from-[#1d2f23] hover:to-[#111e15] border border-emerald-500/40 hover:border-emerald-400 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3.5 transition-all text-left cursor-pointer group shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-300">
                          {isEs ? 'App de Escritorio' : 'Desktop App'}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-mono font-bold">
                          Windows / Mac
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5 leading-snug">
                        {isEs
                          ? 'Abre la app de escritorio en búsqueda de contactos con el enlace de PDFBlack listo.'
                          : 'Opens the desktop app with the PDFBlack link ready to send.'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.button>

                {/* Opción C: Compartir directo (Móvil / Tablet) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDirectMobileShareWhatsApp}
                  disabled={isUploadingShare}
                  className="w-full bg-gradient-to-r from-[#17231b] via-[#121c15] to-[#0c140f] hover:from-[#1d2f23] hover:to-[#111e15] border border-emerald-500/30 hover:border-emerald-400 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3.5 transition-all text-left cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                          {isEs ? 'Compartir directo al móvil' : 'Direct mobile share'}
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-bold">
                          Android / iOS
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-snug">
                        {isEs
                          ? 'Abre WhatsApp en el celular con el enlace y el archivo PDF adjunto.'
                          : 'Opens WhatsApp on mobile with link and PDF attached.'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.button>
              </div>

              {/* Guía explicativa: ¿Dónde y cómo se carga el archivo? */}
              <div className="bg-[#18181f] border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 font-mono text-xs shadow-inner">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {isEs ? 'Beneficio de compartir con PDFBlack' : 'PDFBlack Share Benefits'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-xl">
                    <span className="text-[#FAF6EE] font-bold block">
                      {isEs ? '1. Enlace Oficial' : '1. Official Link'}
                    </span>
                    <span className="text-zinc-400 block mt-0.5 leading-relaxed">
                      {isEs
                        ? 'Tu contacto recibe el link con la dirección oficial de la web.'
                        : 'Your contact receives the link showing the official web address.'}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-xl">
                    <span className="text-[#FAF6EE] font-bold block">
                      {isEs ? '2. Descarga en 1 Clic' : '2. 1-Click Download'}
                    </span>
                    <span className="text-zinc-400 block mt-0.5 leading-relaxed">
                      {isEs
                        ? 'Abre el visor del PDF y permite descargarlo sin registros.'
                        : 'Opens the PDF viewer and allows direct download without sign-up.'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
