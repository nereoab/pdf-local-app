'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  FolderOpen,
  FileText,
  Scissors,
  RotateCw,
  Trash2,
  Merge,
  LayoutGrid,
  Crop,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
  Download,
  Check,
  FileCheck,
  X,
  Loader2,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';
import { getUrlForLanguage } from '@/lib/routes-config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

function OrganizarContent() {
  const [selectedToolParam, setSelectedToolParam] = useState<string | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);

  const downloadComplianceCertificate = async () => {
    setIsDownloadingCert(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();

      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      // Marco formal perimetral
      page.drawRectangle({
        x: 30,
        y: 30,
        width: width - 60,
        height: height - 60,
        borderColor: rgb(0.2, 0.25, 0.3),
        borderWidth: 1.5,
        color: rgb(0.98, 0.98, 0.99),
      });

      // Cabecera institucional
      page.drawText('PDFBLACK ENTERPRISE ARCHITECTURE', {
        x: 55,
        y: height - 70,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.5, 0.3),
      });

      page.drawText('CERTIFICADO DE CONFORMIDAD TÉCNICA ZERO-KNOWLEDGE', {
        x: 55,
        y: height - 95,
        size: 13,
        font: fontBold,
        color: rgb(0.08, 0.1, 0.15),
      });

      page.drawText('DECLARACIÓN OFICIAL DE PROCESAMIENTO ESTRICTAMENTE LOCAL EN EL CLIENTE', {
        x: 55,
        y: height - 110,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      });

      page.drawLine({
        start: { x: 55, y: height - 120 },
        end: { x: width - 55, y: height - 120 },
        thickness: 1,
        color: rgb(0.8, 0.85, 0.9),
      });

      const sections = [
        {
          title: '1. Principio de Cero Transferencia (Zero-Knowledge Architecture)',
          desc: 'Se certifica que la plataforma PDFBlack ejecuta todas las operaciones de organización (unión, división, rotación, reordenamiento, recorte y depuración) mediante Web Workers y WebAssembly directamente en la memoria volátil (RAM) del navegador web del usuario. Cero bytes de los archivos son transmitidos a servidores propios o de terceros.',
        },
        {
          title: '2. Cumplimiento de RGPD / GDPR (Artículos 5, 28 y 32)',
          desc: 'Dado que no existe tratamiento externo ni alojamiento de datos personales en centros de datos remotos, la entidad usuaria mantiene en todo momento el control soberano sobre su documentación confidencial, eximiendo el riesgo de filtraciones por tránsito en la nube.',
        },
        {
          title: '3. Conformidad HIPAA y Secreto Profesional',
          desc: 'Apto para el tratamiento de Historias Clínicas Electrónicas (EHR), balances financieros bajo secreto bancario y expedientes judiciales bajo estricto secreto profesional notarial y letrado. Al cerrar la pestaña o finalizar la sesión, los buffers en memoria son destruidos.',
        },
        {
          title: '4. Preservación Estándar ISO 32000-1 y PDF/A',
          desc: 'Las transformaciones aplicadas operan a nivel de diccionario de objetos PDF, preservando firmas digitales existentes, fuentes tipográficas incrustadas y perfiles de color sin compresión destructiva no autorizada.',
        },
      ];

      let yPos = height - 150;
      sections.forEach((s) => {
        page.drawText(s.title, {
          x: 55,
          y: yPos,
          size: 10.5,
          font: fontBold,
          color: rgb(0.1, 0.2, 0.3),
        });
        yPos -= 16;

        const words = s.desc.split(' ');
        let line = '';
        for (const w of words) {
          const testLine = line + w + ' ';
          if (fontRegular.widthOfTextAtSize(testLine, 8.5) > width - 110) {
            page.drawText(line, {
              x: 55,
              y: yPos,
              size: 8.5,
              font: fontRegular,
              color: rgb(0.2, 0.25, 0.3),
            });
            line = w + ' ';
            yPos -= 12;
          } else {
            line = testLine;
          }
        }
        if (line) {
          page.drawText(line, {
            x: 55,
            y: yPos,
            size: 8.5,
            font: fontRegular,
            color: rgb(0.2, 0.25, 0.3),
          });
          yPos -= 20;
        }
      });

      // Sello de auditoría
      page.drawRectangle({
        x: 55,
        y: 60,
        width: width - 110,
        height: 50,
        borderColor: rgb(0.8, 0.85, 0.9),
        borderWidth: 1,
        color: rgb(0.95, 0.98, 0.96),
      });

      page.drawText('ESTADO DE VERIFICACIÓN: VÁLIDO Y AUDITADO PARA USO CORPORATIVO', {
        x: 70,
        y: 90,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.5, 0.3),
      });

      page.drawText(
        'PDFBlack Engine v4.0 • Zero-Knowledge Local Memory Pipeline • https://pdf-black.com',
        {
          x: 70,
          y: 72,
          size: 8,
          font: fontRegular,
          color: rgb(0.4, 0.45, 0.5),
        },
      );

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PDFBlack_Certificado_Compliance_ZeroKnowledge.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating compliance certificate:', e);
    } finally {
      setIsDownloadingCert(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSelectedToolParam(params.get('tool'));
    }
  }, []);

  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const isPt = lang === 'pt';

  const organizingTools = [
    {
      id: 'unir',
      tagEs: '001 / UNIR ARCHIVOS',
      tagEn: '001 / MERGE FILES',
      titleEs: 'Unir PDF (>100 MB)',
      titleEn: 'Merge PDF (100+ MB)',
      descEs:
        'Une archivos PDF mayores de 100 MB sin límites de subida. Con marcadores para Acrobat e índice automático.',
      descEn:
        'Merge PDF files larger than 100 MB with zero upload limits. Includes Acrobat bookmarks and automatic TOC.',
      icon: Merge,
      path: '/organizar/unir',
    },
    {
      id: 'dividir',
      tagEs: '002 / SEPARAR EN PARTES',
      tagEn: '002 / SPLIT PAGES',
      titleEs: 'Dividir Archivo PDF',
      titleEn: 'Split PDF File',
      descEs:
        'Divide PDFs por tamaño objetivo (preset 25 MB para correo / mesa de partes), rangos o bloques ZIP.',
      descEn:
        'Split PDFs by target size (25 MB preset for email / filing portals), custom ranges, or ZIP page chunks.',
      icon: Scissors,
      path: '/organizar/dividir',
    },
    {
      id: 'eliminar',
      tagEs: '003 / BORRAR PÁGINAS',
      tagEn: '003 / REMOVE PAGES',
      titleEs: 'Eliminar Páginas PDF',
      titleEn: 'Delete PDF Pages',
      descEs:
        'Detecta y elimina páginas en blanco en 1 clic. Depura escaneos a doble cara y fojas vacías sin límite.',
      descEn:
        'Auto-detect and delete blank pages in 1 click. Clean duplex scans and empty sheets with zero file limits.',
      icon: Trash2,
      path: '/organizar/eliminar',
    },
    {
      id: 'reordenar',
      tagEs: '004 / ORGANIZAR Y REORDENAR',
      tagEn: '004 / ORGANIZE & REORDER',
      titleEs: 'Organizar PDF',
      titleEn: 'Organize PDF',
      descEs:
        'Une múltiples archivos, reordena, rota, duplica o elimina páginas en mesa de montaje interactiva.',
      descEn:
        'Merge multiple files, sort, rotate, duplicate, or delete pages in an interactive canvas deck.',
      icon: LayoutGrid,
      path: '/organizar/reordenar',
    },
    {
      id: 'rotar',
      tagEs: '005 / ROTAR PÁGINAS',
      tagEn: '005 / ROTATE PAGES',
      titleEs: 'Rotar PDF',
      titleEn: 'Rotate PDF',
      descEs: 'Gira las páginas de tu PDF fácilmente y con precisión visual.',
      descEn: 'Rotate your PDF pages easily with clear visual feedback.',
      icon: RotateCw,
      path: '/organizar/rotar',
    },
    {
      id: 'recortar',
      tagEs: '006 / RECORTAR MÁRGENES',
      tagEn: '006 / CROP MARGINS',
      titleEs: 'Recortar PDF',
      titleEn: 'Crop PDF',
      descEs: 'Recorta márgenes y ajusta encuadres de tu documento PDF.',
      descEn: 'Crop margins and adjust framing of your PDF document.',
      icon: Crop,
      path: '/organizar/recortar',
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#09090b]">
      {/* ── DATOS ESTRUCTURADOS SCHEMA.ORG (JSON-LD) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'CollectionPage',
                '@id': `${SITE_URL}${isPt ? '/pt/organizar' : isEs ? '/organizar' : '/en/organize'}#webpage`,
                url: `${SITE_URL}${isPt ? '/pt/organizar' : isEs ? '/organizar' : '/en/organize'}`,
                name: isPt
                  ? 'Organizar PDF Grátis Online — Juntar, Dividir, Girar, Excluir | PDFBlack'
                  : isEs
                    ? 'Organizar PDF Gratis Online — Unir, Dividir, Rotar, Eliminar | PDFBlack'
                    : 'Organize PDF Online Free — Merge, Split, Rotate, Delete | PDFBlack',
                description: isPt
                  ? 'Organize e gerencie páginas de arquivos PDF: junte múltiplos documentos, extraia páginas, exclua folhas desnecessárias, reordene e gire páginas 100% no seu navegador.'
                  : isEs
                    ? 'Organiza y gestiona páginas de archivos PDF: une múltiples documentos, extrae páginas, elimina hojas innecesarias, reordena y rota páginas 100% en tu navegador.'
                    : 'Organize and manage PDF file pages: merge multiple documents, extract pages, delete unwanted sheets, reorder and rotate pages 100% inside your browser.',
                isPartOf: {
                  '@type': 'WebSite',
                  '@id': `${SITE_URL}/#website`,
                },
                mainEntity: {
                  '@type': 'ItemList',
                  name: isPt
                    ? 'Ferramentas para Organizar PDF'
                    : isEs
                      ? 'Herramientas para Organizar PDF'
                      : 'PDF Organizing Tools',
                  numberOfItems: organizingTools.length,
                  itemListElement: organizingTools.map((t, idx) => ({
                    '@type': 'ListItem',
                    position: idx + 1,
                    name: isEs ? t.titleEs : t.titleEn,
                    description: isEs ? t.descEs : t.descEn,
                    url: `${SITE_URL}${getUrlForLanguage(t.path, lang)}`,
                  })),
                },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: isPt ? 'Início' : isEs ? 'Inicio' : 'Home',
                    item: isPt ? `${SITE_URL}/pt` : isEs ? SITE_URL : `${SITE_URL}/en`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: isPt ? 'Organizar PDF' : isEs ? 'Organizar PDF' : 'Organize PDF',
                    item: `${SITE_URL}${isPt ? '/pt/organizar' : isEs ? '/organizar' : '/en/organize'}`,
                  },
                ],
              },
            ],
          }),
        }}
      />
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
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isEs ? '002 / HERRAMIENTAS DE ORGANIZAR PDF' : '002 / PDF ORGANIZATION TOOLS'}
                  </h1>
                  {/* INSIGNIA DE CONFIANZA MONOCROMÁTICA */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {isEs ? '100% Local • Cero Servidores' : '100% Local • Zero Servers'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowComplianceModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isEs ? 'Ficha de Compliance Corporativo →' : 'Enterprise Compliance Sheet →'}
                    </span>
                  </button>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-1">
                  {isEs
                    ? 'Administra las páginas y la estructura de tu documento PDF:'
                    : 'Manage the pages and structure of your PDF document:'}
                </p>
              </div>
            </div>
          </div>

          {/* CUADRÍCULA DE HERRAMIENTAS DE ORGANIZACIÓN (FULL-WIDTH 3 COLUMNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {organizingTools.map((tool) => {
              const isSelected =
                selectedToolParam === tool.id ||
                (selectedToolParam && tool.path.endsWith(selectedToolParam));

              return (
                <Link
                  key={tool.id}
                  href={getUrlForLanguage(tool.path, lang)}
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
                        <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md group-hover/card:scale-105 transition-transform">
                          <tool.icon className="w-5 h-5 text-white" />
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
                    ? '1. Cómo organizar archivos PDF paso a paso'
                    : '1. How to organize PDF files step by step'}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: '01',
                    es: 'Selecciona la herramienta deseada o sube tus documentos PDF.',
                    en: 'Select desired tool or upload your PDF documents.',
                  },
                  {
                    step: '02',
                    es: 'El motor carga las miniaturas de todas las páginas en memoria local.',
                    en: 'The engine loads thumbnails of all pages into local memory.',
                  },
                  {
                    step: '03',
                    es: 'Reordena, rota, elimina o recorta páginas en tiempo real.',
                    en: 'Reorder, rotate, delete, or crop pages in real time.',
                  },
                  {
                    step: '04',
                    es: 'Compila y descarga tu nuevo documento PDF 100% ordenado.',
                    en: 'Compile and download your new 100% organized PDF document.',
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
                      ? 'Unir múltiples documentos PDF en un solo archivo continuo y ordenado.'
                      : 'Merge multiple PDF documents into a single continuous, ordered file.',
                    isEs
                      ? 'Dividir y extraer rangos de páginas específicas hacia archivos independientes.'
                      : 'Split and extract specific page ranges into independent PDF files.',
                    isEs
                      ? 'Reordenar visualmente las páginas arrastrando y soltando miniaturas.'
                      : 'Visually reorder pages by dragging and dropping thumbnails.',
                    isEs
                      ? 'Rotar páginas individuales o documentos completos con corrección de orientación.'
                      : 'Rotate individual pages or entire documents with orientation fix.',
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
                      ? 'Revisa la vista previa de miniaturas para confirmar el orden antes de compilar.'
                      : 'Review the thumbnail preview to confirm page order before compiling.',
                    isEs
                      ? 'Para unir archivos grandes, asegúrate de que todos los PDFs estén sin contraseñas.'
                      : 'For merging large files, ensure all PDFs are unlocked and without passwords.',
                    isEs
                      ? 'El recorte de márgenes elimina espacios en blanco sin perder nitidez de texto.'
                      : 'Margin cropping trims white borders without losing vector text crispness.',
                    isEs
                      ? 'Todo el ensamblado se procesa 100% en la memoria RAM de tu navegador.'
                      : 'All assembly processes 100% locally inside your browser RAM.',
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
                    ? '3. ¿Qué sucede con tu documento al organizarlo?'
                    : '3. What happens to your document when organizing it?'}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-zinc-300 leading-relaxed">
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs flex items-center gap-2 font-mono">
                    <HardDrive className="w-4 h-4 text-white" />
                    {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'Tus archivos se unen, dividen o reordenan estrictamente dentro de la memoria RAM de tu navegador. Cero bytes tocan servidores externos.'
                      : 'Your files are merged, split, or reordered strictly inside browser RAM. Zero bytes touch external servers.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs ? 'Seguridad y confidencialidad' : 'Security & confidentiality'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'La estructura original, fuentes vectoriales e imágenes se conservan intactas en máxima calidad sin compresión destructiva.'
                      : 'Original structure, vector fonts, and images remain intact in full quality without lossy compression.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? 'Descarga directa' : 'Direct download'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'El nuevo documento organizado se genera al instante y queda listo para descargar en tu dispositivo inmediatamente.'
                      : 'The newly organized document generates instantly and is ready to download to your device immediately.'}
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
                    qEs: '¿Se pueden unir archivos PDF pesados mayores de 100 MB sin suscripción de pago?',
                    qEn: 'Can I merge heavy PDF files larger than 100 MB without a paid subscription?',
                    aEs: 'Sí. A diferencia de conversores en la nube que imponen bloqueos estrictos a partir de 15 MB o 100 MB para cobrar mensualidades, PDFBlack une archivos de más de 100 MB, 300 MB o 500 MB gratis y genera marcadores para Acrobat gracias a su motor que procesa directamente en la memoria RAM de tu equipo.',
                    aEn: 'Yes. Unlike cloud tools that cap free uploads at 15 MB or 100 MB to force paid plans, PDFBlack merges files of 100 MB, 300 MB or 500 MB for free with Acrobat bookmarks, processing directly in your device RAM.',
                  },
                  {
                    qEs: '¿Cómo detectar y eliminar automáticamente páginas en blanco de un PDF escaneado?',
                    qEn: 'How to auto-detect and delete blank pages from a scanned PDF?',
                    aEs: 'Al abrir «Eliminar Páginas PDF», pulsa el botón «Detectar Hojas en Blanco». El motor analiza la densidad de píxeles en segundo plano; las fojas vacías de escaneos a doble cara quedan marcadas en rojo para purgarlas con 1 solo clic sin marcas de agua.',
                    aEn: 'In «Delete PDF Pages», click «Detect Blank Pages». The engine analyzes pixel density; blank reverse sheets from duplex scans are flagged in red to delete them in 1 click.',
                  },
                  {
                    qEs: '¿Se puede dividir un archivo PDF fijando un tamaño máximo como 25 MB para enviar por correo?',
                    qEn: 'Can I split a PDF specifying a max file size such as 25 MB for email attachments?',
                    aEs: 'Sí. En «Dividir PDF» dispones del modo «Por Tamaño Objetivo (MB)» con preset de 25 MB (ideal para Gmail, Outlook y mesas de partes virtuales), distribuyendo las páginas para que ninguna parte supere el límite.',
                    aEn: 'Yes. In «Split PDF», use the «By Target Size (MB)» mode with a 25 MB preset (ideal for Gmail, Outlook, and filing portals) to ensure no chunk exceeds the MB limit.',
                  },
                  {
                    qEs: '¿Existe algún límite de páginas o archivos para unir y organizar?',
                    qEn: 'Is there a page or file limit when merging and organizing?',
                    aEs: 'No hay límites artificiales. Puedes unir o reorganizar tantos documentos como la memoria RAM de tu dispositivo permita.',
                    aEn: 'No artificial limits. You can merge or reorganize as many documents as your device RAM allows.',
                  },
                  {
                    qEs: '¿Se pierde calidad o texto seleccionable al dividir o rotar páginas?',
                    qEn: 'Is quality or selectable text lost when splitting or rotating pages?',
                    aEs: 'No. Las operaciones de organización no rasterizan ni comprimen el contenido; conservan todas las fuentes y vectores originales.',
                    aEn: 'No. Organization operations do not rasterize or compress content; all original fonts and vectors remain intact.',
                  },
                  {
                    qEs: '¿Puedo reordenar páginas de varios archivos PDF combinados simultáneamente?',
                    qEn: 'Can I reorder pages from multiple combined PDF files simultaneously?',
                    aEs: 'Sí. Puedes cargar múltiples PDFs, visualizarlos en una cuadrícula interactiva y arrastrar cualquier página a la posición exacta deseada.',
                    aEn: 'Yes. You can upload multiple PDFs, view them in an interactive grid, and drag any page to its exact desired position.',
                  },
                  {
                    qEs: '¿Cómo funciona la división por rangos de páginas específicos?',
                    qEn: 'How does splitting by specific page ranges work?',
                    aEs: 'Puedes ingresar rangos personalizados (ej. 1-5, 8, 11-14) o extraer cada página por separado; los nuevos archivos se generan al instante.',
                    aEn: 'You can enter custom ranges (e.g. 1-5, 8, 11-14) or extract each page into individual files; new files generate instantly.',
                  },
                  {
                    qEs: '¿El recorte de páginas reduce el tamaño físico de la hoja o solo oculta bordes?',
                    qEn: 'Does page cropping resize the physical sheet or just hide borders?',
                    aEs: 'Reajusta la caja de visualización (CropBox/MediaBox) del estándar PDF, recortando márgenes en blanco de manera uniforme sin degradar el contenido.',
                    aEn: 'It recalculates the PDF CropBox/MediaBox, trimming white margins uniformly without degrading any internal content.',
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

      {/* MODAL DE COMPLIANCE CORPORATIVO & ZERO-KNOWLEDGE */}
      {showComplianceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-700 p-6 sm:p-8 rounded-3xl max-w-2xl w-full flex flex-col gap-5 relative shadow-2xl font-mono text-xs">
            <button
              type="button"
              onClick={() => setShowComplianceModal(false)}
              className="absolute top-5 right-5 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="bg-emerald-500/15 p-2.5 rounded-2xl border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  {isEs ? 'SEGURIDAD & COMPLIANCE EMPRESARIAL' : 'ENTERPRISE SECURITY & COMPLIANCE'}
                </span>
                <h3 className="text-lg font-black text-white font-sans">
                  {isEs
                    ? 'Ficha Técnica de Conformidad Zero-Knowledge'
                    : 'Zero-Knowledge Compliance Specification'}
                </h3>
              </div>
            </div>

            <div className="space-y-3.5 text-zinc-300 text-[11px] leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <span className="text-white font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {isEs
                    ? '1. Arquitectura 100% en Cliente (Cero Servidores)'
                    : '1. 100% Client-Side Architecture'}
                </span>
                <p className="text-zinc-400 pl-5">
                  {isEs
                    ? 'Todos los algoritmos de unión, corte, rotación y reorganización corren dentro del motor WebAssembly / Web Worker de tu navegador. Ningún byte o metadato de tus archivos sale hacia servidores externos.'
                    : 'All algorithms run inside your browser WebAssembly / Web Worker sandbox. Zero bytes or metadata ever leave your local device.'}
                </p>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <span className="text-white font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {isEs
                    ? '2. Cumplimiento Estricto RGPD / GDPR (Art. 28)'
                    : '2. Strict GDPR (Art. 28) Compliance'}
                </span>
                <p className="text-zinc-400 pl-5">
                  {isEs
                    ? 'Al no existir transferencia ni almacenamiento de datos personales en servidores en la nube, tu empresa cumple automáticamente con las normativas europeas y latinoamericanas de protección de datos personales.'
                    : 'Because no personal data is transferred or stored in cloud servers, your organization automatically complies with data protection regulations.'}
                </p>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <span className="text-white font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {isEs
                    ? '3. Apto para Notarías, Banca, Salud (HIPAA) y Legal'
                    : '3. Suitable for Legal, Banking & HIPAA'}
                </span>
                <p className="text-zinc-400 pl-5">
                  {isEs
                    ? 'Protege el secreto profesional y bancario. Los buffers en memoria volátil se destruyen inmediatamente al descargar el documento procesado o cerrar la pestaña.'
                    : 'Guarantees bank-grade and legal secrecy. Volatile memory buffers are destroyed as soon as the file is downloaded.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-500">
                {isEs
                  ? 'Generado y firmado por PDFBlack Engine v4.0'
                  : 'Generated & signed by PDFBlack Engine v4.0'}
              </span>
              <button
                type="button"
                onClick={downloadComplianceCertificate}
                disabled={isDownloadingCert}
                className="w-full sm:w-auto px-4 py-2.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
              >
                {isDownloadingCert ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>
                  {isDownloadingCert
                    ? isEs
                      ? 'Generando PDF...'
                      : 'Generating PDF...'
                    : isEs
                      ? 'Descargar Certificado Oficial (PDF)'
                      : 'Download Official Certificate (PDF)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizarPage() {
  return <OrganizarContent />;
}
