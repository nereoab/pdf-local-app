'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef, Suspense, useMemo, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  RefreshCw,
  FileText,
  UploadCloud,
  FilePlus,
  X,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import PdfPreviewThumbnail from '@/components/PdfPreviewThumbnail';
import SpotlightCard from '@/components/SpotlightCard';
import {
  WordIcon,
  ExcelIcon,
  PowerPointIcon,
  JpgIcon,
  HtmlIcon,
  TextIcon,
} from '../../components/ProgramIcons';
import { toast } from 'sonner';

function ConvertirContent() {
  const searchParams = useSearchParams();
  const selectedToolParam = searchParams.get('tool');

  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const emptySubscribe = () => () => {};
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const globalFile = useFileStore((state) => state.globalFile);
  const setGlobalFile = useFileStore((state) => state.setGlobalFile);

  const pdfUrl = useMemo(() => {
    if (!globalFile) return null;
    return URL.createObjectURL(globalFile);
  }, [globalFile]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarArchivo = (archivoSeleccionado: File) => {
    if (archivoSeleccionado.type !== 'application/pdf') {
      toast.error(
        isEs ? 'Por favor, sube un archivo PDF válido.' : 'Please upload a valid PDF file.',
      );
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setGlobalFile(archivoSeleccionado);
            setIsUploading(false);
            setUploadProgress(0);
            toast.success(isEs ? 'Archivo cargado con éxito.' : 'File successfully loaded.');
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 15;
      });
    }, 100);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) procesarArchivo(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setGlobalFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const conversionTools = [
    {
      id: 'pdf-word',
      tagEs: '001 / PDF ↔ WORD',
      tagEn: '001 / PDF ↔ WORD',
      titleEs: 'PDF y Word',
      titleEn: 'PDF & Word',
      descEs: 'Convierte PDF a Word (.docx) o convierte documentos Word a PDF.',
      descEn: 'Convert PDF to Word (.docx) or convert Word documents to PDF.',
      icon: WordIcon,
      path: '/convertir/pdf-word',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white',
    },
    {
      id: 'pdf-excel',
      tagEs: '002 / PDF ↔ EXCEL',
      tagEn: '002 / PDF ↔ EXCEL',
      titleEs: 'PDF y Excel',
      titleEn: 'PDF & Excel',
      descEs: 'Extrae tablas a Excel (.xlsx) o convierte hojas de cálculo Excel a PDF.',
      descEn: 'Extract tables to Excel (.xlsx) or convert Excel spreadsheets to PDF.',
      icon: ExcelIcon,
      path: '/convertir/pdf-excel',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white',
    },
    {
      id: 'pdf-powerpoint',
      tagEs: '003 / PDF ↔ POWERPOINT',
      tagEn: '003 / PDF ↔ POWERPOINT',
      titleEs: 'PDF y PowerPoint',
      titleEn: 'PDF & PowerPoint',
      descEs: 'Convierte PDF a diapositivas PowerPoint (.pptx) o presentaciones PPT a PDF.',
      descEn: 'Convert PDF into PowerPoint (.pptx) slides or PPT presentations to PDF.',
      icon: PowerPointIcon,
      path: '/convertir/pdf-powerpoint',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white',
    },
    {
      id: 'pdf-jpg',
      tagEs: '004 / PDF ↔ JPG',
      tagEn: '004 / PDF ↔ JPG',
      titleEs: 'PDF e Imágenes JPG',
      titleEn: 'PDF & JPG Images',
      descEs: 'Convierte páginas PDF a imágenes JPG o agrupa fotos JPG/PNG en un documento PDF.',
      descEn: 'Convert PDF pages to JPG images or combine JPG/PNG photos into a PDF.',
      icon: JpgIcon,
      path: '/convertir/pdf-jpg',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white',
    },
    {
      id: 'pdf-html',
      tagEs: '005 / PDF ↔ HTML',
      tagEn: '005 / PDF ↔ HTML',
      titleEs: 'PDF y HTML',
      titleEn: 'PDF & HTML',
      descEs: 'Convierte archivos PDF a código HTML estructurado o genera PDF a partir de HTML.',
      descEn: 'Convert PDF files into structured HTML code or generate PDF from HTML.',
      icon: HtmlIcon,
      path: '/convertir/pdf-html',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white',
    },
    {
      id: 'pdf-texto',
      tagEs: '006 / PDF ↔ TEXTO',
      tagEn: '006 / PDF ↔ TEXT',
      titleEs: 'PDF y Texto Plano',
      titleEn: 'PDF & Plain Text',
      descEs: 'Extrae todo el texto plano (.txt) de un PDF o convierte archivos de texto a PDF.',
      descEn: 'Extract plain text (.txt) from a PDF or convert text files into a PDF.',
      icon: TextIcon,
      path: '/convertir/pdf-texto',
      borderColor: 'border-white/10',
      shadowColor: 'shadow-lg',
      hoverBorder: 'group-hover/card:border-white/30',
      hoverGlow: 'group-hover/card:shadow-xl',
      hoverBg: 'group-hover/card:bg-zinc-900/60',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-white/10 font-mono',
      btnGradient: 'bg-white text-black font-semibold',
      iconBg: 'bg-zinc-900 border-white/10 text-white',
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl relative z-10">
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInput}
        />

        <AnimatePresence mode="wait">
          {isUploading && (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-12 shadow-2xl mt-10 font-mono"
            >
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2 font-sans">
                    {isEs ? 'Cargando documento...' : 'Loading document...'}
                  </h3>
                  <span className="text-white font-bold text-3xl tabular-nums">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-white/10">
                  <motion.div
                    className="bg-white h-full rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: 'linear', duration: 0.1 }}
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {!isUploading && (
            <motion.div
              key="workspace-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {/* TÍTULO DE PÁGINA Y KPI STATS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {isEs ? '003 / HERRAMIENTAS DE CONVERTIR PDF' : '003 / PDF CONVERSION TOOLS'}
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1">
                      {isEs
                        ? 'Exporta y transforma tu PDF a múltiples formatos estándar:'
                        : 'Export and transform your PDF into multiple standard formats:'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <KpiPill
                    icon={FileText}
                    title={isEs ? 'Archivos' : 'Files'}
                    value={24}
                    tooltip={
                      isEs ? 'Tus archivos convertidos esta semana' : 'Files converted this week'
                    }
                    color="text-white"
                  />
                  <KpiPill
                    icon={HardDrive}
                    title={isEs ? 'Ahorrado' : 'Saved'}
                    value={3.6}
                    decimals={1}
                    suffix=" GB"
                    tooltip={
                      isEs ? 'Almacenamiento optimizado localmente' : 'Locally optimized storage'
                    }
                    color="text-zinc-300"
                  />
                  <KpiPill
                    icon={Clock}
                    title={isEs ? 'Tiempo' : 'Time'}
                    value={50}
                    suffix=" min"
                    tooltip={
                      isEs ? 'Tiempo ahorrado en tu sesión actual' : 'Time saved in current session'
                    }
                    color="text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
                <div className="lg:col-span-5 flex flex-col h-full">
                  {!globalFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex-1 h-full min-h-[480px] bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors"
                      >
                        <UploadCloud className="w-12 h-12 text-white" />
                      </motion.div>

                      <div className="text-center flex flex-col items-center gap-2 font-sans">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {isEs
                            ? 'Arrastra tu PDF aquí para convertir'
                            : 'Drop your PDF here to convert'}
                        </h3>
                        <p className="text-zinc-400 text-xs font-mono">
                          {isEs
                            ? 'O haz clic para explorar tus archivos'
                            : 'Or click to browse your files'}
                        </p>
                      </div>

                      <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all mt-2 cursor-pointer shadow-md">
                        <FilePlus className="w-4 h-4 text-black" />{' '}
                        {isEs ? 'Subir Archivo' : 'Upload File'}
                      </button>

                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-emerald-400 text-[11px] font-mono rounded-full mt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {isEs
                            ? '100% GRATIS • SIN REGISTRO • SIN TARJETA'
                            : '100% FREE • NO SIGN-UP • NO CREDIT CARD'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex-1 h-full min-h-[500px] bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative font-mono">
                      <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex-shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white font-bold text-xs truncate w-32 sm:w-48">
                              {globalFile.name}
                            </span>
                            <span className="text-zinc-400 text-[10px]">
                              {formatFileSize(globalFile.size)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
                          title={isEs ? 'Quitar archivo' : 'Remove file'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-full flex-1 bg-[#09090b] relative overflow-hidden flex items-center justify-center">
                        <PdfPreviewThumbnail file={globalFile} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 flex flex-col h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 h-full">
                    {conversionTools.map((tool) => {
                      const isSelected =
                        selectedToolParam === tool.id ||
                        (selectedToolParam && tool.path.endsWith(selectedToolParam));

                      return (
                        <Link
                          key={tool.id}
                          href={globalFile ? tool.path : '#'}
                          onClick={(e) => {
                            if (!globalFile) {
                              e.preventDefault();
                              toast.error(
                                isEs
                                  ? 'Sube un archivo en la casilla de la izquierda para usar esta herramienta.'
                                  : 'Upload a file in the left dropzone first to use this tool.',
                              );
                            }
                          }}
                          className="outline-none group/card block h-full"
                        >
                          <SpotlightCard
                            className={`bg-[#09090b] border ${isSelected ? 'border-white ring-2 ring-white/20 bg-zinc-900/80' : 'border-white/10 hover:border-white/30'} rounded-2xl p-5 lg:p-6 transition-all duration-300 flex flex-col justify-between group-hover/card:bg-zinc-900/40 relative overflow-hidden h-full shadow-2xl`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="p-0.5 rounded-xl group-hover/card:scale-105 transition-transform">
                                  <tool.icon className="w-8 h-8 rounded-xl shadow-md" />
                                </div>

                                <div className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-3.5 py-1 rounded-full font-sans flex items-center gap-1.5 transition-all shadow-md">
                                  <span>
                                    {isSelected
                                      ? isEs
                                        ? 'SELECCIONADO'
                                        : 'SELECTED'
                                      : isEs
                                        ? 'Usar Ahora'
                                        : 'Use Now'}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover/card:translate-x-1 transition-transform" />
                                </div>
                              </div>

                              <div className="mb-2 font-mono">
                                <span className="text-xs text-zinc-400 font-medium">
                                  {isEs ? tool.tagEs : tool.tagEn}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-white mb-1.5 tracking-tight font-sans">
                                {isEs ? tool.titleEs : tool.titleEn}
                              </h3>
                              <p className="text-zinc-400 text-xs font-normal leading-relaxed font-sans line-clamp-2">
                                {isEs ? tool.descEs : tool.descEn}
                              </p>
                            </div>

                            <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-zinc-400">
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {isEs ? '100% Local' : '100% Local'}
                              </span>
                              <span className="text-white group-hover/card:translate-x-0.5 transition-transform flex items-center gap-1">
                                {isEs ? 'Iniciar →' : 'Start →'}
                              </span>
                            </div>
                          </SpotlightCard>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECCIÓN: 3 PASOS PARA TRABAJAR PDF */}
              <div className="w-full mt-12 pt-10 border-t border-white/10 flex flex-col items-center font-mono">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                  {isEs ? '000 / PASOS DE CONVERSIÓN' : '000 / CONVERSION STEPS'}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-8 font-sans">
                  {isEs ? 'Solo 3 pasos para convertir tu PDF' : 'Only 3 steps to convert your PDF'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {/* PASO 1 */}
                  <SpotlightCard className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group font-mono">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm flex items-center justify-center mb-3">
                      1
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {isEs ? '1. Sube tu PDF' : '1. Upload your PDF'}
                    </h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {isEs
                        ? 'Arrastra o selecciona tu archivo PDF en el recuadro principal.'
                        : 'Drag or select your PDF file in the main dropzone box.'}
                    </p>
                  </SpotlightCard>

                  {/* PASO 2 */}
                  <SpotlightCard className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group font-mono">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm flex items-center justify-center mb-3">
                      2
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {isEs ? '2. Usa la herramienta' : '2. Use the tool'}
                    </h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {isEs
                        ? 'En la página especializada, elige la función exacta (PDF a Word, Excel, JPG, etc.).'
                        : 'In the specialized page, select the exact function (PDF to Word, Excel, JPG, etc.).'}
                    </p>
                  </SpotlightCard>

                  {/* PASO 3 */}
                  <SpotlightCard className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group font-mono">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm flex items-center justify-center mb-3">
                      3
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {isEs ? '3. Descarga lista' : '3. Download ready'}
                    </h4>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {isEs
                        ? 'Obtén tu documento final 100% procesado de forma local en tu navegador.'
                        : 'Get your final document 100% processed locally in your browser.'}
                    </p>
                  </SpotlightCard>
                </div>
              </div>

              {/* SECCIÓN DE 4 PUNTOS ESTANDARIZADA */}
              <div className="w-full mt-12 space-y-8 font-sans">
                {/* 1. CÓMO FUNCIONA PASO A PASO */}
                <SpotlightCard className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {isEs
                        ? '1. Cómo convertir archivos PDF y documentos paso a paso'
                        : '1. How to convert PDF files & documents step by step'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        step: '01',
                        es: 'Selecciona la herramienta deseada o sube tu documento PDF.',
                        en: 'Select desired tool or upload your PDF document.',
                      },
                      {
                        step: '02',
                        es: 'El motor decodifica la estructura de texto, tablas e imágenes.',
                        en: 'The engine decodes text, table, and image structure.',
                      },
                      {
                        step: '03',
                        es: 'Ajusta los parámetros avanzados según el formato de salida.',
                        en: 'Adjust advanced parameters according to output format.',
                      },
                      {
                        step: '04',
                        es: 'Haz clic en convertir y descarga tu archivo 100% procesado.',
                        en: 'Click convert and download your 100% processed file.',
                      },
                    ].map((item, i) => (
                      <SpotlightCard
                        key={i}
                        className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2"
                      >
                        <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                          Paso {item.step}
                        </span>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {isEs ? item.es : item.en}
                        </p>
                      </SpotlightCard>
                    ))}
                  </div>
                </SpotlightCard>

                {/* 2. LIMITACIONES Y CONSEJOS ÚTILES */}
                <SpotlightCard className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                        ✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
                      </h4>
                      {[
                        isEs
                          ? 'Exportar PDF a Word, Excel, PowerPoint, imágenes y texto.'
                          : 'Export PDF to Word, Excel, PowerPoint, images and text.',
                        isEs
                          ? 'Convertir formatos Microsoft Office hacia PDF vectorial de alta calidad.'
                          : 'Convert Microsoft Office formats to high quality vector PDF.',
                        isEs
                          ? 'Configurar maquetación, orientación de hoja y marcas de agua.'
                          : 'Configure page layout, orientation and watermarks.',
                        isEs
                          ? 'Extraer elementos gráficos e imágenes sin pérdida de resolución.'
                          : 'Extract graphic elements and images without resolution loss.',
                      ].map((t, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                        💡 {isEs ? 'CONSEJOS' : 'TIPS'}
                      </h4>
                      {[
                        isEs
                          ? 'Asegúrate de que tus archivos PDF no contengan contraseñas de apertura.'
                          : 'Ensure your PDF files do not contain open passwords.',
                        isEs
                          ? 'Aplica OCR a documentos escaneados para permitir extracción de texto.'
                          : 'Run OCR on scanned documents to enable text extraction.',
                        isEs
                          ? 'Utiliza navegadores modernos para obtener el máximo rendimiento de conversión.'
                          : 'Use modern browsers for maximum conversion performance.',
                        isEs
                          ? 'Todo el procesamiento se completa localmente en memoria RAM.'
                          : 'All processing completes locally in RAM memory.',
                      ].map((t, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>

                {/* 3. PRIVACIDAD Y PROCESAMIENTO LOCAL */}
                <SpotlightCard className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {isEs
                        ? '3. ¿Qué sucede con tu documento al convertirlo?'
                        : '3. What happens to your document when converting it?'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
                    <SpotlightCard className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <strong className="text-white font-bold text-xs block">
                        🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                      </strong>
                      <p className="text-[11px]">
                        {isEs
                          ? 'El procesamiento se realiza en tu navegador. Tus archivos nunca tocan servidores externos.'
                          : 'Processing runs in your browser. Your files never touch external servers.'}
                      </p>
                    </SpotlightCard>
                    <SpotlightCard className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <strong className="text-white font-bold text-xs block">
                        🔒 {isEs ? 'Seguridad y confidencialidad' : 'Security & confidentiality'}
                      </strong>
                      <p className="text-[11px]">
                        {isEs
                          ? 'Tus contratos y datos empresariales se mantienen privados sin rastreadores.'
                          : 'Your contracts and enterprise data stay private with zero trackers.'}
                      </p>
                    </SpotlightCard>
                    <SpotlightCard className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <strong className="text-white font-bold text-xs block">
                        📥 {isEs ? 'Descarga directa' : 'Direct download'}
                      </strong>
                      <p className="text-[11px]">
                        {isEs
                          ? 'Archivos resultantes disponibles al instante en tu equipo.'
                          : 'Resulting files available instantly on your device.'}
                      </p>
                    </SpotlightCard>
                  </div>
                </SpotlightCard>

                {/* 4. PREGUNTAS FRECUENTES */}
                <SpotlightCard className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                      <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        qEs: '¿Necesito instalar software adicional o plugins para convertir mis archivos?',
                        qEn: 'Do I need to install extra software or plugins to convert my files?',
                        aEs: 'No. Todas las herramientas de conversión funcionan de manera autónoma en cualquier navegador moderno mediante WebAssembly y JavaScript local.',
                        aEn: 'No. All conversion tools run autonomously in any modern browser using local WebAssembly and JavaScript.',
                      },
                      {
                        qEs: '¿Existe algún límite de tamaño de archivo para la conversión local?',
                        qEn: 'Is there any file size limit for local conversion?',
                        aEs: 'El único límite depende de la memoria RAM disponible en tu dispositivo. Puedes procesar documentos extensos sin restricciones artificiales.',
                        aEn: "The only limit depends on your device's available RAM. You can process extensive documents with no artificial restrictions.",
                      },
                    ].map((faq, i) => (
                      <SpotlightCard
                        key={i}
                        className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-1.5"
                      >
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="text-emerald-400 font-mono">Q:</span>{' '}
                          {isEs ? faq.qEs : faq.qEn}
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed pl-5">
                          {isEs ? faq.aEs : faq.aEn}
                        </p>
                      </SpotlightCard>
                    ))}
                  </div>
                </SpotlightCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ConvertirPage() {
  return (
    <Suspense fallback={null}>
      <ConvertirContent />
    </Suspense>
  );
}

function KpiPill({
  icon: Icon,
  title,
  value,
  decimals = 0,
  suffix = '',
  tooltip,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tooltip: string;
  color: string;
}) {
  return (
    <div
      title={tooltip}
      className="flex items-center gap-2 bg-slate-900/90 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all cursor-default group"
    >
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div className="flex items-baseline gap-1">
        <span className="text-white font-extrabold text-xs">
          {value.toFixed(decimals)}
          {suffix}
        </span>
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
          {title}
        </span>
      </div>
    </div>
  );
}
