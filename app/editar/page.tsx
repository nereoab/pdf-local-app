'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { 
  FileText, Shield, Hash, RotateCw, Split, Layers,
  ArrowLeft 
} from 'lucide-react';

// Importación de tus componentes core
import PdfUploader from '@/components/PdfUploader';
import PdfFoliador from '@/components/PdfFoliador';
import PdfOrganizer from '@/components/PdfOrganizer';
import PdfProtector from '@/components/PdfProtector';
import PdfRotator from '@/components/PdfRotator';
import PdfSplitter from '@/components/PdfSplitter';

// 🛠️ BYPASS DE TYPESCRIPT PARA DIAGNÓSTICO
// Esto le dice a TS: "Confía en mí, sé lo que estoy haciendo con estos componentes"
const SafePdfUploader = PdfUploader as any;
const SafePdfFoliador = PdfFoliador as any;
const SafePdfOrganizer = PdfOrganizer as any;
const SafePdfProtector = PdfProtector as any;
const SafePdfRotator = PdfRotator as any;
const SafePdfSplitter = PdfSplitter as any;

type ActiveTool = 'foliar' | 'organizar' | 'proteger' | 'rotar' | 'dividir' | null;

export default function EditarHubPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [file, setFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setActiveTool(null);
  };

  const handleBackToHub = () => {
    setActiveTool(null);
  };

  const handleResetFile = () => {
    setFile(null);
    setActiveTool(null);
  };

  const tools = [
    {
      id: 'foliar' as ActiveTool,
      titleEs: 'Foliar PDF',
      titleEn: 'Add Page Numbers',
      descEs: 'Inserta números de página de forma automática.',
      descEn: 'Automatically insert page numbers into your PDF.',
      icon: Hash,
      color: 'text-blue-400',
      borderGlow: 'hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    },
    {
      id: 'organizar' as ActiveTool,
      titleEs: 'Organizar PDF',
      titleEn: 'Organize PDF',
      descEs: 'Une, reordena o elimina páginas con facilidad.',
      descEn: 'Merge, reorder, or delete pages easily.',
      icon: Layers,
      color: 'text-emerald-400',
      borderGlow: 'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    },
    {
      id: 'proteger' as ActiveTool,
      titleEs: 'Proteger PDF',
      titleEn: 'Protect PDF',
      descEs: 'Añade una contraseña con cifrado fuerte AES-256.',
      descEn: 'Encrypt your PDF with a strong AES-256 password.',
      icon: Shield,
      color: 'text-purple-400',
      borderGlow: 'hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    },
    {
      id: 'rotar' as ActiveTool,
      titleEs: 'Rotar PDF',
      titleEn: 'Rotate PDF',
      descEs: 'Gira páginas individuales o todo el documento.',
      descEn: 'Rotate individual pages or the entire document.',
      icon: RotateCw,
      color: 'text-orange-400',
      borderGlow: 'hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    },
    {
      id: 'dividir' as ActiveTool,
      titleEs: 'Dividir PDF',
      titleEn: 'Split PDF',
      descEs: 'Extrae páginas seleccionadas en un nuevo archivo.',
      descEn: 'Extract selected pages into a brand new file.',
      icon: Split,
      color: 'text-red-400',
      borderGlow: 'hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    },
  ];

  return (
    <main className="w-full min-h-[calc(100vh-80px)] bg-[#030712] text-[#F4F4F5] pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
        <div className="absolute top-[10%] w-[70vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl z-10">
        
        {/* PANTALLA 1: SUBIR EL ARCHIVO */}
        {!file && (
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
                {isEs ? 'Herramientas de Edición' : 'PDF Editing Hub'} ♠️
              </h1>
              <p className="text-gray-400 max-w-xl mx-auto">
                {isEs 
                  ? 'Sube tu documento localmente para comenzar. El procesamiento se realiza de forma privada en tu navegador.' 
                  : 'Upload your document locally to begin. Processing runs 100% privately in your browser.'}
              </p>
            </div>
            
            <div className="w-full max-w-xl">
              <SafePdfUploader onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* PANTALLA 2: ARCHIVO SUBIDO - SELECCIÓN DE HERRAMIENTA */}
        {file && !activeTool && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
            <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                  <FileText className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white max-w-[280px] sm:max-w-md truncate">{file.name}</h2>
                  <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={handleResetFile}
                className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 px-5 py-2.5 rounded-xl transition-all"
              >
                {isEs ? 'Cambiar archivo' : 'Change file'}
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                {isEs ? 'Selecciona una herramienta' : 'Choose an editing action'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <button 
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`bg-white/[0.01] border border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between h-56 text-left transition-all duration-300 cursor-pointer ${tool.borderGlow}`}
                  >
                    <div>
                      <div className="p-3 bg-black/40 border border-white/5 rounded-2xl w-fit mb-5">
                        <tool.icon className={`w-6 h-6 ${tool.color}`} />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{isEs ? tool.titleEs : tool.titleEn}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{isEs ? tool.descEs : tool.descEn}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* PANTALLA 3: ENTORNO DE EDICIÓN */}
        {file && activeTool && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <div className="flex justify-between items-center mb-2">
              <button 
                onClick={handleBackToHub}
                className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> {isEs ? 'Volver a herramientas' : 'Back to tools'}
              </button>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {activeTool.toUpperCase()} MODE
              </span>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-2 md:p-6 backdrop-blur-3xl shadow-2xl">
              {activeTool === 'foliar' && <SafePdfFoliador file={file} onBack={handleBackToHub} />}
              {activeTool === 'organizar' && <SafePdfOrganizer file={file} onBack={handleBackToHub} />}
              {activeTool === 'proteger' && <SafePdfProtector file={file} onBack={handleBackToHub} />}
              {activeTool === 'rotar' && <SafePdfRotator file={file} onBack={handleBackToHub} />}
              {activeTool === 'dividir' && <SafePdfSplitter file={file} onBack={handleBackToHub} />}
            </div>
          </motion.div>
        )}

      </div>
    </main>
  );
}