'use client';

import { Suspense, useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  RefreshCw,
  FileText,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';
import {
  WordIcon,
  ExcelIcon,
  PowerPointIcon,
  JpgIcon,
  HtmlIcon,
  TextIcon,
} from '../../components/ProgramIcons';

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
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl relative z-10">
        <motion.div
          key="workspace-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* TÍTULO DE PÁGINA Y KPI STATS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2 pb-6 border-b border-zinc-700/80">
            <div className="flex items-center gap-3.5">
              <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isEs ? '003 / HERRAMIENTAS DE CONVERTIR PDF' : '003 / PDF CONVERSION TOOLS'}
                  </h1>
                  {/* INSIGNIA DE CONFIANZA MONOCROMÁTICA */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {isEs ? '100% Local • Cero Servidores' : '100% Local • Zero Servers'}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-1">
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
                color="text-zinc-200"
              />
              <KpiPill
                icon={Clock}
                title={isEs ? 'Tiempo' : 'Time'}
                value={50}
                suffix=" min"
                tooltip={
                  isEs ? 'Tiempo ahorrado en tu sesión actual' : 'Time saved in current session'
                }
                color="text-zinc-200"
              />
            </div>
          </div>

          {/* CUADRÍCULA DE HERRAMIENTAS DE CONVERSIÓN (FULL-WIDTH 3 COLUMNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {conversionTools.map((tool) => {
              const isSelected =
                selectedToolParam === tool.id ||
                (selectedToolParam && tool.path.endsWith(selectedToolParam));

              return (
                <Link
                  key={tool.id}
                  href={tool.path}
                  className="outline-none group/card block h-full"
                >
                  <SpotlightCard
                    className={`h-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30 bg-zinc-900/90'
                        : 'border-zinc-600 hover:border-white'
                    } rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group-hover/card:shadow-2xl relative overflow-hidden`}
                  >
                    {/* Línea reflectiva superior */}
                    <div
                      className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                      aria-hidden="true"
                    />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-zinc-800 p-2 rounded-2xl border border-zinc-500 text-white shadow-md group-hover/card:scale-105 transition-transform flex items-center justify-center">
                          <tool.icon className="w-7 h-7 rounded-xl shadow-sm" />
                        </div>

                        <div className="bg-white text-black hover:bg-zinc-100 font-bold text-xs px-4 py-1.5 rounded-full font-sans flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover/card:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
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
                        <span className="text-xs text-zinc-300 font-bold tracking-wider">
                          {isEs ? tool.tagEs : tool.tagEn}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-white mb-2 tracking-tight font-sans group-hover/card:text-white">
                        {isEs ? tool.titleEs : tool.titleEn}
                      </h2>
                      <p className="text-zinc-300 text-xs font-normal leading-relaxed font-sans line-clamp-3">
                        {isEs ? tool.descEs : tool.descEn}
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-zinc-700/80 flex items-center justify-between font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-200 text-[10px] font-bold shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        {isEs ? '100% Local' : '100% Local'}
                      </span>
                      <span className="text-zinc-300 group-hover/card:text-white font-bold group-hover/card:translate-x-0.5 transition-all flex items-center gap-1">
                        {isEs ? 'Iniciar →' : 'Start →'}
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              );
            })}
          </div>

          {/* ENCABEZADO DE GUÍA TÉCNICA Y PRIVACIDAD */}
          <div className="w-full mt-14 mb-8 pt-8 border-t border-zinc-800 flex flex-col items-center text-center font-mono">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-full mb-3 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              {isEs ? '100% SEGURO • CERO SERVIDORES' : '100% SECURE • ZERO SERVERS'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2 font-sans">
              {isEs
                ? 'Cómo funciona el procesamiento local de tus archivos'
                : 'How local file processing works'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 font-mono max-w-2xl">
              {isEs
                ? 'Conoce el flujo de trabajo, consejos prácticos, protección de datos y preguntas frecuentes.'
                : 'Learn about the workflow, practical tips, data protection, and frequently asked questions.'}
            </p>
          </div>

          {/* SECCIÓN DE 4 PUNTOS ESTANDARIZADA MONOCROMÁTICA */}
          <div className="w-full space-y-8 font-sans">
            {/* 1. CÓMO FUNCIONA PASO A PASO */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
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
                    className="bg-zinc-800/80 border border-zinc-600 rounded-2xl p-5 flex flex-col gap-2.5 shadow-md"
                  >
                    <span className="text-[10px] font-mono font-bold text-white bg-zinc-800 border border-zinc-500 px-2.5 py-0.5 rounded-full w-fit shadow-sm">
                      Paso {item.step}
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {isEs ? item.es : item.en}
                    </p>
                  </SpotlightCard>
                ))}
              </div>
            </SpotlightCard>

            {/* 2. LIMITACIONES Y CONSEJOS ÚTILES */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3 bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 shadow-md">
                  <h4 className="text-xs font-mono text-white font-bold uppercase tracking-wider border-b border-zinc-700 pb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
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
                      <span className="text-white font-bold flex-shrink-0 mt-0.5">•</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 shadow-md">
                  <h4 className="text-xs font-mono text-zinc-200 font-bold uppercase tracking-wider border-b border-zinc-700 pb-2.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-white" />
                    {isEs ? 'CONSEJOS RECOMENDADOS' : 'RECOMMENDED TIPS'}
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
                      <span className="text-zinc-200 flex-shrink-0 mt-0.5">→</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* 3. PRIVACIDAD Y PROCESAMIENTO LOCAL */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs
                    ? '3. ¿Qué sucede con tu documento al convertirlo?'
                    : '3. What happens to your document when converting it?'}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-zinc-300 leading-relaxed">
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <HardDrive className="w-4 h-4 text-white" />
                    {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'El procesamiento se realiza en tu navegador. Tus archivos nunca tocan servidores externos.'
                      : 'Processing runs in your browser. Your files never touch external servers.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs ? 'Seguridad y confidencialidad' : 'Security & confidentiality'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'Tus contratos y datos empresariales se mantienen privados sin rastreadores.'
                      : 'Your contracts and enterprise data stay private with zero trackers.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? 'Descarga directa' : 'Direct download'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'Archivos resultantes disponibles al instante en tu equipo.'
                      : 'Resulting files available instantly on your device.'}
                  </p>
                </SpotlightCard>
              </div>
            </SpotlightCard>

            {/* 4. PREGUNTAS FRECUENTES */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <HardDrive className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
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
                    className="bg-zinc-800/80 border border-zinc-600 rounded-2xl p-5 space-y-2 shadow-md"
                  >
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-white font-mono font-bold">Q:</span>{' '}
                      {isEs ? faq.qEs : faq.qEn}
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed pl-5 font-normal">
                      {isEs ? faq.aEs : faq.aEn}
                    </p>
                  </SpotlightCard>
                ))}
              </div>
            </SpotlightCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AnimatedCounter({
  from = 0,
  to,
  decimals = 0,
  suffix = '',
}: {
  from?: number;
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(from, to, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(value: number) {
          node.textContent = value.toFixed(decimals) + suffix;
        },
      });
      return () => controls.stop();
    }
  }, [from, to, decimals, suffix]);
  return (
    <span ref={nodeRef}>
      {from.toFixed(decimals)}
      {suffix}
    </span>
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
  tooltip?: string;
  color?: string;
}) {
  return (
    <div className="relative group/kpi">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 hover:border-white rounded-full transition-all cursor-help font-mono shadow-sm">
        <Icon className={`w-3.5 h-3.5 ${color || 'text-white'}`} />
        <span className="text-xs font-bold text-white">
          <AnimatedCounter to={value} decimals={decimals} suffix={suffix} />
        </span>
        <span className="text-[10px] text-zinc-300 font-bold uppercase">{title}</span>
      </div>

      {tooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-xl text-[10px] font-mono text-zinc-100 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-200 pointer-events-none shadow-2xl whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
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
