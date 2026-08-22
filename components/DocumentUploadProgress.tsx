'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  Cpu,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.25 }}
      className="w-full bg-[#09090b] border border-white/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl mt-8 relative z-[50] font-mono overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Glow ambiental de fondo */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-emerald-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* ENCABEZADO Y TARJETA DEL ARCHIVO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4 min-w-0">
            {/* Ícono de documento con efecto láser escáner */}
            <div className="relative p-3.5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/20 rounded-2xl shadow-xl flex-shrink-0 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-transparent opacity-40 animate-pulse pointer-events-none" />
              {/* Línea de escaneo láser animada */}
              <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_8px_#f97316]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <FileText className="w-8 h-8 text-white relative z-10" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono">
                  PDF 100% Local
                </span>
                {fileSize && (
                  <span className="text-[10px] text-zinc-400 font-mono">
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
              className="px-3 py-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isEs ? 'Cancelar' : 'Cancel'}</span>
            </button>
          )}
        </div>

        {/* BARRA DE PROGRESO PRINCIPAL CON PORCENTAJE */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <StageIcon className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-zinc-200 font-sans">
                {currentStage.text}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight font-mono">
                {progress}
              </span>
              <span className="text-sm font-bold text-zinc-400 font-mono">%</span>
            </div>
          </div>

          {/* CONTENEDOR DE BARRA GLOSSY CON GRADIENTE Y BRILLO */}
          <div className="w-full bg-zinc-950 rounded-full h-4 sm:h-5 p-1 border border-white/15 shadow-inner relative overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 relative shadow-[0_0_15px_rgba(249,115,22,0.5)]"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
              transition={{ ease: 'easeOut', duration: 0.15 }}
            >
              {/* Efecto de destello de luz corredizo (Shimmer) */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              {/* Punto de luz brillante en la cabeza de la barra */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
            </motion.div>
          </div>
        </div>

        {/* HITOS DE PROCESAMIENTO (4 PASOS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {steps.map((step) => {
            const isDone = currentStage.step > step.num || progress === 100;
            const isCurrent = currentStage.step === step.num && progress < 100;

            return (
              <div
                key={step.num}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-mono ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                      ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 ring-1 ring-orange-500/30'
                      : 'bg-zinc-950/60 border-white/5 text-zinc-500'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isDone
                      ? 'bg-emerald-400 text-black'
                      : isCurrent
                        ? 'bg-orange-400 text-black animate-pulse'
                        : 'bg-zinc-900 text-zinc-600 border border-white/10'
                  }`}
                >
                  {isDone ? '✓' : step.num}
                </div>
                <span className="font-semibold text-[11px] truncate">
                  {isEs ? step.es : step.en}
                </span>
              </div>
            );
          })}
        </div>

        {/* PIE CON GARANTÍA DE PRIVACIDAD */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-[11px] text-zinc-400 font-mono">
          <span className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {isEs
              ? '100% Confidencial • Procesado en memoria RAM'
              : '100% Confidential • Processed in RAM'}
          </span>
          <span className="text-zinc-500 text-[10px]">
            {isEs
              ? 'Ningún byte viaja a servidores externos'
              : 'Zero bytes transmitted to external servers'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
