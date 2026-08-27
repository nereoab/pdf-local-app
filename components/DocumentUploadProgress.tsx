'use client';

import { motion } from 'framer-motion';
import { FileText, ShieldCheck, CheckCircle2, X, Sparkles, Cpu, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface DocumentUploadProgressProps {
  fileName?: string;
  fileSize?: number | string;
  progress: number;
  onCancel?: () => void;
  title?: string;
}

export default function DocumentUploadProgress({
  fileName,
  fileSize,
  progress,
  onCancel,
  title,
}: DocumentUploadProgressProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const formatSize = (size?: number | string) => {
    if (!size) return '';
    if (typeof size === 'string') return size;
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return `${parseFloat((size / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Mensaje de estado dinámico según el porcentaje
  const getStageInfo = (p: number) => {
    if (p < 25) {
      return {
        text: isEs ? 'Analizando cabecera binaria del PDF...' : 'Analyzing PDF binary header...',
        step: 1,
        icon: FileText,
      };
    }
    if (p < 60) {
      return {
        text: isEs
          ? 'Verificando seguridad e integridad en RAM...'
          : 'Verifying security & integrity in RAM...',
        step: 2,
        icon: ShieldCheck,
      };
    }
    if (p < 90) {
      return {
        text: isEs
          ? 'Indexando páginas y preparando visor...'
          : 'Indexing pages & preparing viewer...',
        step: 3,
        icon: Cpu,
      };
    }
    return {
      text: isEs
        ? '¡Documento listo! Abriendo espacio de trabajo...'
        : 'Document ready! Opening workspace...',
      step: 4,
      icon: Sparkles,
    };
  };

  const currentStage = getStageInfo(progress);
  const StageIcon = currentStage.icon;

  const steps = [
    { num: 1, es: 'Lectura', en: 'Reading' },
    { num: 2, es: 'Seguridad', en: 'Security' },
    { num: 3, es: 'Indexación', en: 'Indexing' },
    { num: 4, es: 'Listo', en: 'Ready' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-full min-h-[320px] sm:min-h-[360px] bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl flex flex-col justify-between relative z-10 font-mono overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Línea de brillo superior tridimensional */}
      <div
        className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Glow ambiental monocromático */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto w-full space-y-6 relative z-10 my-auto">
        {/* ENCABEZADO Y TARJETA DEL ARCHIVO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-700/80">
          <div className="flex items-center gap-4 min-w-0">
            {/* Ícono de documento con efecto láser escáner blanco */}
            <div className="relative p-3 bg-zinc-800 border border-zinc-500 rounded-2xl shadow-xl flex-shrink-0 group overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-30 animate-pulse pointer-events-none" />
              {/* Línea de escaneo láser animada en blanco puro */}
              <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_8px_#ffffff]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <FileText className="w-7 h-7 text-white relative z-10" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold text-white bg-zinc-800 border border-zinc-500 px-2.5 py-0.5 rounded-full font-mono shadow-sm">
                  PDF 100% Local
                </span>
                {fileSize && (
                  <span className="text-[10px] text-zinc-300 font-mono">
                    {formatSize(fileSize)}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md font-sans">
                {fileName || (isEs ? 'Documento PDF' : 'PDF Document')}
              </h3>
            </div>
          </div>

          {/* Botón cancelar si está disponible */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-600 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer font-mono font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isEs ? 'Cancelar' : 'Cancel'}</span>
            </button>
          )}
        </div>

        {/* BARRA DE PROGRESO PRINCIPAL CON PORCENTAJE */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <StageIcon className="w-4 h-4 text-white animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-zinc-200 font-sans">
                {currentStage.text}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight font-mono">
                {progress}
              </span>
              <span className="text-sm font-bold text-zinc-300 font-mono">%</span>
            </div>
          </div>

          {/* CONTENEDOR DE BARRA REFINADA (10px) EN BLANCO Y PLATA */}
          <div className="w-full bg-zinc-950 rounded-full h-2.5 sm:h-3 p-0.5 border border-zinc-700 shadow-inner relative overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-zinc-300 via-white to-zinc-200 relative shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
              transition={{ ease: 'easeOut', duration: 0.15 }}
            >
              {/* Efecto de destello de luz corredizo (Shimmer blanco) */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              {/* Punto de luz brillante en la cabeza de la barra */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
            </motion.div>
          </div>
        </div>

        {/* HITOS DE PROCESAMIENTO (4 PASOS MONOCROMÁTICOS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {steps.map((step) => {
            const isDone = currentStage.step > step.num || progress === 100;
            const isCurrent = currentStage.step === step.num && progress < 100;

            return (
              <div
                key={step.num}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-mono ${
                  isDone
                    ? 'bg-white text-black border-white font-bold shadow-md'
                    : isCurrent
                      ? 'bg-zinc-800 border-white text-white ring-1 ring-white/30 font-bold'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 font-medium'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isDone
                      ? 'bg-black text-white'
                      : isCurrent
                        ? 'bg-white text-black animate-pulse'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {isDone ? '✓' : step.num}
                </div>
                <span className="text-[11px] truncate font-sans">{isEs ? step.es : step.en}</span>
              </div>
            );
          })}
        </div>

        {/* PIE CON GARANTÍA DE PRIVACIDAD */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-700/80 text-[11px] text-zinc-300 font-mono">
          <span className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck className="w-4 h-4 text-white flex-shrink-0" />
            {isEs
              ? '100% Confidencial • Procesado en memoria RAM'
              : '100% Confidential • Processed in RAM'}
          </span>
          <span className="text-zinc-400 text-[10px]">
            {isEs
              ? 'Ningún byte viaja a servidores externos'
              : 'Zero bytes transmitted to external servers'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
