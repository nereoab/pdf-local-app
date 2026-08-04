'use client';

import { useState } from 'react';
import { Cloud, CloudOff, ShieldCheck, AlertTriangle, HardDrive, UploadCloud } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { uploadBackupPdf, CloudBackupFile } from '../lib/firebase/storage';
import { toast } from 'sonner';

export interface CloudBackupToggleProps {
  /** Blob o File del PDF a respaldar */
  pdfBlob: Blob | File | null;
  /** Nombre del archivo para el backup */
  fileName?: string;
  /** Callback cuando se completa el backup */
  onBackupComplete?: (result: CloudBackupFile) => void;
  /** Callback cuando hay error */
  onBackupError?: (error: string) => void;
}

/**
 * Componente de toggle para backup en la nube (opt-in).
 * 
 * El usuario debe activar EXPLÍCITAMENTE el backup. 
 * Por defecto está DESACTIVADO (respetando la filosofía de privacidad).
 */
export default function CloudBackupToggle({
  pdfBlob,
  fileName = 'documento.pdf',
  onBackupComplete,
  onBackupError,
}: CloudBackupToggleProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { user } = useFirebaseAuth();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  // Si no hay usuario autenticado o no hay PDF, no mostrar nada
  if (!user || !pdfBlob) {
    return null;
  }

  const handleToggle = () => {
    if (!isEnabled) {
      // Mostrar diálogo de consentimiento antes de activar
      setShowConsent(true);
    } else {
      setIsEnabled(false);
      setUploaded(false);
    }
  };

  const handleAcceptConsent = async () => {
    setShowConsent(false);
    setIsEnabled(true);

    if (!pdfBlob) return;

    setIsUploading(true);
    const result = await uploadBackupPdf(user.uid, pdfBlob, fileName);

    if (result.success && result.file) {
      setUploaded(true);
      onBackupComplete?.(result.file);
      toast.success(
        isEs ? 'Backup guardado en la nube correctamente.' : 'Cloud backup saved successfully.'
      );
    } else {
      setIsEnabled(false);
      onBackupError?.(result.error || 'Error desconocido');
      toast.error(
        isEs
          ? `Error al guardar backup: ${result.message}`
          : `Backup error: ${result.message}`
      );
    }

    setIsUploading(false);
  };

  const handleDeclineConsent = () => {
    setShowConsent(false);
    setIsEnabled(false);
  };

  return (
    <>
      {/* Toggle principal */}
      <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-white/10 rounded-xl">
        {/* Icono */}
        <div
          className={`p-2 rounded-lg transition-colors ${
            uploaded
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : isEnabled
              ? 'bg-blue-500/10 border border-blue-500/20'
              : 'bg-zinc-800 border border-white/10'
          }`}
        >
          {uploaded ? (
            <Cloud className="w-4 h-4 text-emerald-400" />
          ) : isEnabled ? (
            <UploadCloud className="w-4 h-4 text-blue-400 animate-pulse" />
          ) : (
            <CloudOff className="w-4 h-4 text-zinc-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-zinc-300">
              {isEs ? 'Backup en la Nube' : 'Cloud Backup'}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                uploaded
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isEnabled
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-zinc-800 text-zinc-500 border border-white/5'
              }`}
            >
              {uploaded
                ? isEs
                  ? 'GUARDADO'
                  : 'SAVED'
                : isEnabled
                ? isEs
                  ? 'ACTIVADO'
                  : 'ENABLED'
                : isEs
                ? 'DESACTIVADO'
                : 'DISABLED'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
            {uploaded
              ? isEs
                ? 'Backup guardado exitosamente.'
                : 'Backup saved successfully.'
              : isEnabled
              ? isEs
                ? 'Tu PDF se guardará en Firebase Storage.'
                : 'Your PDF will be saved to Firebase Storage.'
              : isEs
                ? 'Activa para guardar una copia en la nube (opcional).'
                : 'Enable to save a copy in the cloud (optional).'}
          </p>
        </div>

        {/* Toggle switch */}
        {!uploaded && (
          <button
            onClick={handleToggle}
            disabled={isUploading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 ${
              isEnabled ? 'bg-blue-500' : 'bg-zinc-700'
            }`}
            role="switch"
            aria-checked={isEnabled}
            aria-label={isEs ? 'Activar backup en la nube' : 'Enable cloud backup'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )}

        {uploaded && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Modal de consentimiento (opt-in) */}
      {showConsent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-[#09090b] border border-white/15 rounded-2xl shadow-2xl p-6 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label={isEs ? 'Consentimiento de backup en la nube' : 'Cloud backup consent'}
          >
            {/* Icono de advertencia */}
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  {isEs ? '¿Activar backup en la nube?' : 'Enable cloud backup?'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {isEs ? 'Firebase Storage • Cifrado en tránsito' : 'Firebase Storage • Encrypted in transit'}
                </p>
              </div>
            </div>

            {/* Explicación */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  {isEs
                    ? 'Tu PDF se subirá a Firebase Storage con cifrado en tránsito (TLS 1.3). Solo tú podrás acceder a él mediante tu cuenta autenticada. No compartimos tus archivos con terceros.'
                    : 'Your PDF will be uploaded to Firebase Storage with TLS 1.3 encryption. Only you can access it through your authenticated account. We do not share your files with third parties.'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <HardDrive className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {isEs
                    ? 'El procesamiento del PDF sigue siendo 100% local en tu navegador. El backup es una copia adicional que se guarda en la nube para tu comodidad.'
                    : 'PDF processing remains 100% local in your browser. The backup is an additional copy stored in the cloud for your convenience.'}
                </p>
              </div>
            </div>

            {/* Aviso de privacidad */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3">
              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                {isEs
                  ? '⚡ Puedes eliminar este backup en cualquier momento. Tu archivo original permanece en tu equipo. El procesamiento local no envía datos a ningún servidor sin tu consentimiento explícito.'
                  : '⚡ You can delete this backup at any time. Your original file remains on your device. Local processing never sends data to any server without your explicit consent.'}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleDeclineConsent}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 font-sans text-xs font-semibold transition-all cursor-pointer"
              >
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleAcceptConsent}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-sans text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Cloud className="w-3.5 h-3.5" />
                {isEs ? 'Sí, guardar backup' : 'Yes, save backup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}