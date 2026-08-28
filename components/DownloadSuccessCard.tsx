'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  Lock,
  PenTool,
  ScanText,
  RefreshCw,
  FolderOpen,
  Trash2,
  FileText,
  FileCode,
  FileSearch,
  Layers,
  Eraser,
  Copy,
  EyeOff,
} from 'lucide-react';
import {
  AnimatedCheckmark,
  triggerLuxuryConfetti,
  triggerButtonSparkles,
} from '@/components/ui/AnimatedSuccessCheck';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export interface DownloadSuccessCardProps {
  downloadUrl: string | null;
  filename: string;
  fileSize?: string;
  outputFormat?: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'txt' | 'json' | 'zip' | string;
  onReset?: () => void;
  rawBlob?: Blob;
  currentToolId?: string;
}

export default function DownloadSuccessCard({
  downloadUrl,
  filename,
  fileSize,
  outputFormat = 'pdf',
  onReset,
  rawBlob,
  currentToolId,
}: DownloadSuccessCardProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const router = useRouter();
  const setGlobalFile = useFileStore((s) => s.setGlobalFile);

  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    // Celebración monocromática elegante al montarse la pantalla de éxito
    triggerLuxuryConfetti();
  }, []);

  const handleManualDownload = (e?: React.MouseEvent) => {
    if (!downloadUrl) return;
    triggerButtonSparkles(e);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    toast.success(isEs ? '¡Descarga iniciada!' : 'Download started!');
  };

  const handleNavigateToTool = async (targetPath: string) => {
    try {
      if (outputFormat === 'pdf' && (downloadUrl || rawBlob)) {
        let fileToPass: File;
        if (rawBlob) {
          fileToPass = new File([rawBlob], filename, { type: 'application/pdf' });
        } else if (downloadUrl) {
          const res = await fetch(downloadUrl);
          const blob = await res.blob();
          fileToPass = new File([blob], filename, { type: 'application/pdf' });
        } else {
          fileToPass = new File([], filename, { type: 'application/pdf' });
        }
        setGlobalFile(fileToPass);
        toast.info(
          isEs
            ? `Cargando ${filename} en la siguiente herramienta...`
            : `Loading ${filename} into next tool...`,
        );
      }
      router.push(targetPath);
    } catch (err) {
      console.error(err);
      router.push(targetPath);
    }
  };

  const allTools = [
    {
      id: 'quitar-marca-agua',
      titleEs: 'Quitar Sello de Agua',
      titleEn: 'Remove Watermark',
      descEs: 'Eliminar sellos o marcas',
      descEn: 'Remove stamps or marks',
      icon: Eraser,
      path: '/editar/quitar-marca-agua',
    },
    {
      id: 'comprimir',
      titleEs: 'Comprimir PDF',
      titleEn: 'Compress PDF',
      descEs: 'Reducir peso hasta 90%',
      descEn: 'Reduce file size up to 90%',
      icon: Zap,
      path: '/optimizar/comprimir',
    },
    {
      id: 'proteger',
      titleEs: 'Proteger con Clave',
      titleEn: 'Protect with Password',
      descEs: 'Cifrado local AES-256',
      descEn: 'AES-256 local encryption',
      icon: Lock,
      path: '/optimizar/proteger',
    },
    {
      id: 'firma',
      titleEs: 'Firmar PDF',
      titleEn: 'Sign PDF',
      descEs: 'Añadir firma o sello',
      descEn: 'Add signature or stamp',
      icon: PenTool,
      path: '/editar/firma',
    },
    {
      id: 'censurar',
      titleEs: 'Censurar PDF',
      titleEn: 'Redact PDF',
      descEs: 'Ocultar datos sensibles',
      descEn: 'Hide sensitive data',
      icon: EyeOff,
      path: '/optimizar/censurar',
    },
    {
      id: 'ocr',
      titleEs: 'Reconocimiento OCR',
      titleEn: 'OCR Text Recognition',
      descEs: 'Hacer texto seleccionable',
      descEn: 'Make text searchable',
      icon: ScanText,
      path: '/editar/ocr',
    },
    {
      id: 'convertir-word',
      titleEs: 'Convertir a Word',
      titleEn: 'Convert to Word',
      descEs: 'Exportar a formato DOCX',
      descEn: 'Export to DOCX format',
      icon: RefreshCw,
      path: '/convertir/pdf-word',
    },
    {
      id: 'unir',
      titleEs: 'Unir PDF',
      titleEn: 'Merge PDF',
      descEs: 'Combinar varios archivos',
      descEn: 'Combine multiple files',
      icon: Layers,
      path: '/organizar/unir',
    },
  ];

  const recommendedTools = allTools
    .filter((tool) => !currentToolId || tool.id !== currentToolId)
    .slice(0, 6);
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-3xl p-[1.5px] overflow-hidden shadow-2xl transition-all duration-300"
    >
      {/* HAZ DE LUZ LÁSER PERIMETRAL RUBIO PLATINADO (BORDER BEAM) */}
      <div className="absolute -inset-[150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_310deg,#FAF6EE_345deg,#E8DFCF_360deg)] pointer-events-none opacity-90" />

      {/* RESPLANDOR AMBIENTAL EN PLATINO CHAMPAGNE */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#E8DFCF]/15 via-[#FAF6EE]/10 to-[#DFD5C2]/15 rounded-3xl blur-2xl pointer-events-none" />

      {/* CONTENEDOR PRINCIPAL DE LA TARJETA */}
      <div className="relative w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] rounded-3xl p-6 sm:p-8 space-y-6 font-sans">
        {/* Línea de brillo superior en platino */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/40 to-transparent pointer-events-none" />

        {/* TOP HEADER: ANUNCIO DE ÉXITO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-900 p-3.5 rounded-2xl border border-[#E8DFCF]/40 shadow-[0_0_20px_rgba(232,223,207,0.2)] flex-shrink-0 flex items-center justify-center">
              <AnimatedCheckmark size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF6EE]/10 border border-[#E8DFCF]/30 text-[#E8DFCF] font-bold text-xs font-mono rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#FAF6EE]" />
                  {isEs ? 'PROCESO COMPLETADO' : 'PROCESS COMPLETED'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-[#E8DFCF]/30 rounded-full text-[#E8DFCF] text-xs font-mono shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FAF6EE] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FAF6EE]"></span>
                  </span>
                  {isEs ? '100% Local • Privado' : '100% Local • Private'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? '¡Tu archivo está listo para descargar!'
                  : 'Your file is ready to download!'}
              </h2>
            </div>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono border border-zinc-700 hover:border-[#E8DFCF]/50 transition-all cursor-pointer shadow-sm flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>{isEs ? 'Procesar otro archivo' : 'Process another file'}</span>
            </button>
          )}
        </div>

        {/* FILE INFO CARD + BOTÓN PRINCIPAL DE DESCARGA */}
        <div className="bg-[#121217] border border-zinc-700/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative z-10 overflow-hidden shadow-inner">
          <div className="flex items-center gap-4 overflow-hidden min-w-0">
            <div className="bg-zinc-800 border border-zinc-600 p-3.5 rounded-2xl flex-shrink-0 shadow-md">
              {outputFormat === 'pdf' && <FileText className="w-7 h-7 text-white" />}
              {outputFormat === 'txt' && <FileSearch className="w-7 h-7 text-white" />}
              {outputFormat === 'json' && <FileCode className="w-7 h-7 text-white" />}
              {outputFormat !== 'pdf' && outputFormat !== 'txt' && outputFormat !== 'json' && (
                <Layers className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base truncate max-w-[240px] sm:max-w-[400px] font-mono">
                  {filename}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(filename);
                    toast.success(isEs ? 'Nombre copiado' : 'Filename copied');
                  }}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                  title={isEs ? 'Copiar nombre' : 'Copy filename'}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold uppercase">
                  {outputFormat}
                </span>
                {fileSize && <span>• {fileSize}</span>}
                <span className="text-[#E8DFCF] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FAF6EE]" />
                  {isEs ? 'Sin carga a servidor' : 'Zero server upload'}
                </span>
              </div>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL DE DESCARGA (RUBIO PLATINADO / WHITE GOLD EDITION) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => handleManualDownload(e)}
            className={`relative overflow-hidden flex items-center justify-center gap-3 px-8 py-4 rounded-full font-sans font-extrabold text-sm sm:text-base transition-all cursor-pointer flex-shrink-0 group ${
              downloaded
                ? 'bg-gradient-to-r from-[#FAF6EE] to-[#E8DFCF] text-black border border-[#FAF6EE] shadow-[0_0_35px_rgba(250,246,238,0.5)]'
                : 'bg-gradient-to-r from-[#FAF6EE] via-[#E8DFCF] to-[#DFD5C2] text-black shadow-[0_0_30px_rgba(232,223,207,0.35)] hover:shadow-[0_0_40px_rgba(250,246,238,0.6)] border border-[#FAF6EE]/80'
            }`}
          >
            {/* Shimmer sweep infinito de luz platino */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            {downloaded ? (
              <CheckCircle2 className="w-5 h-5 text-black" />
            ) : (
              <Download className="w-5 h-5 text-black group-hover:translate-y-0.5 transition-transform" />
            )}
            <span>
              {downloaded
                ? isEs
                  ? '¡Descargado! Descargar de nuevo'
                  : 'Downloaded! Download again'
                : isEs
                  ? 'Descargar Archivo Listo'
                  : 'Download Ready File'}
            </span>
          </motion.button>
        </div>

        {/* SECCIÓN DE ENCADENAMIENTO DE HERRAMIENTAS RECOMENDADAS */}
        <div className="pt-3 border-t border-zinc-800 space-y-3 font-mono relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-sans">
              <Sparkles className="w-4 h-4 text-[#FAF6EE]" />
              {isEs
                ? '002 / ¿DESEAS CONTINUAR EDITANDO ESTE DOCUMENTO?'
                : '002 / WANT TO KEEP EDITING THIS DOCUMENT?'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {isEs
                ? 'Encadena otra acción sin recargar el archivo:'
                : 'Chain another action without reloading:'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recommendedTools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleNavigateToTool(tool.path)}
                  className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] hover:from-[#22222c] hover:to-[#141419] border border-zinc-700/80 hover:border-[#E8DFCF]/50 rounded-2xl p-3.5 flex flex-col items-start justify-between gap-3 transition-all duration-300 group text-left cursor-pointer hover:scale-[1.03] shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FAF6EE]/30 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white group-hover:border-[#E8DFCF]/50 group-hover:text-[#FAF6EE] group-hover:scale-105 transition-all shadow-sm">
                      <IconComp className="w-4 h-4 text-white group-hover:text-[#FAF6EE]" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#FAF6EE] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-[#FAF6EE] transition-colors font-sans">
                      {isEs ? tool.titleEs : tool.titleEn}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block leading-tight mt-1">
                      {isEs ? tool.descEs : tool.descEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
