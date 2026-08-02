'use client';

import { useState } from 'react';
import { 
  Download, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, RotateCcw,
  Zap, Lock, PenTool, ScanText, RefreshCw, FolderOpen, Trash2, FileText, FileCode, FileSearch, Layers
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFileStore } from '@/store/useFileStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export interface DownloadSuccessCardProps {
  downloadUrl: string | null;
  filename: string;
  fileSize?: string;
  outputFormat?: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'txt' | 'json' | 'zip';
  onReset?: () => void;
  rawBlob?: Blob;
}

export default function DownloadSuccessCard({
  downloadUrl,
  filename,
  fileSize,
  outputFormat = 'pdf',
  onReset,
  rawBlob,
}: DownloadSuccessCardProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const router = useRouter();
  const setGlobalFile = useFileStore(s => s.setGlobalFile);

  const [downloaded, setDownloaded] = useState(false);

  const handleManualDownload = () => {
    if (!downloadUrl) return;
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
        toast.info(isEs ? `Cargando ${filename} en la siguiente herramienta...` : `Loading ${filename} into next tool...`);
      }
      router.push(targetPath);
    } catch (err) {
      console.error(err);
      router.push(targetPath);
    }
  };

  const recommendedTools = [
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
      titleEs: 'Unir / Organizar',
      titleEn: 'Merge / Organize',
      descEs: 'Combinar con otros PDFs',
      descEn: 'Merge with other PDFs',
      icon: FolderOpen,
      path: '/organizar/unir',
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#09090b] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 font-sans relative overflow-hidden"
    >
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: SUCCESS ANNOUNCEMENT */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
                {isEs ? '✓ PROCESO COMPLETADO' : '✓ PROCESS COMPLETED'}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Local
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isEs ? '¡Tu archivo está listo para descargar!' : 'Your file is ready for download!'}
            </h2>
          </div>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono border border-white/10 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEs ? 'Procesar otro archivo' : 'Process another file'}</span>
          </button>
        )}
      </div>

      {/* FILE INFO CARD + MANUAL DOWNLOAD BUTTON */}
      <div className="bg-zinc-950/80 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl flex-shrink-0">
            {outputFormat === 'pdf' && <FileText className="w-6 h-6 text-white" />}
            {outputFormat === 'txt' && <FileSearch className="w-6 h-6 text-white" />}
            {outputFormat === 'json' && <FileCode className="w-6 h-6 text-white" />}
            {outputFormat !== 'pdf' && outputFormat !== 'txt' && outputFormat !== 'json' && <Layers className="w-6 h-6 text-white" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-sm truncate max-w-[280px] sm:max-w-[400px] font-mono">
              {filename}
            </span>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
              <span>{outputFormat.toUpperCase()}</span>
              {fileSize && <span>• {fileSize}</span>}
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {isEs ? 'Sin carga a servidor' : 'Zero server upload'}
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY DOWNLOAD BUTTON */}
        <button
          onClick={handleManualDownload}
          className={`flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-sans font-bold text-sm transition-all shadow-lg cursor-pointer flex-shrink-0 ${
            downloaded
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-98'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>
            {downloaded
              ? (isEs ? '¡Descargado! Descargar de nuevo' : 'Downloaded! Download again')
              : (isEs ? 'Descargar Archivo Listo ↓' : 'Download Ready File ↓')}
          </span>
        </button>
      </div>

      {/* RECOMMENDED NEXT TOOLS SECTION */}
      {outputFormat === 'pdf' && (
        <div className="pt-2 border-t border-white/10 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-300" />
              {isEs ? '¿DESEAS CONTINUAR EDITANDO ESTE DOCUMENTO?' : 'WANT TO KEEP EDITING THIS DOCUMENT?'}
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline-block">
              {isEs ? 'Selecciona una herramienta para encadenar acciones:' : 'Select a tool to chain actions:'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {recommendedTools.map(tool => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleNavigateToTool(tool.path)}
                  className="bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-white/30 rounded-xl p-3 flex flex-col items-start justify-between gap-2.5 transition-all group text-left cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1.5 bg-zinc-950 rounded-lg border border-white/10 group-hover:border-white/30 transition-colors">
                      <IconComp className="w-4 h-4 text-white" />
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-white transition-colors">
                      {isEs ? tool.titleEs : tool.titleEn}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-sans block leading-tight mt-0.5">
                      {isEs ? tool.descEs : tool.descEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
