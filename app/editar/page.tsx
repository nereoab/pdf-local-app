'use client';

import { useFileStore } from '../../store/useFileStore';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  ShieldCheck,
  Edit3,
  Type,
  PenTool,
  Hash,
  ShieldAlert,
  FileText,
  X,
  HardDrive,
  Clock,
  Search,
  Star,
  Eye,
  Download,
  Trash2,
  Bot,
  CheckCircle2,
  FolderOpen,
  Sparkles,
  Lock,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

function EditarContent() {
  const searchParams = useSearchParams();
  const selectedToolParam = searchParams.get('tool');

  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [isAiOpen, setIsAiOpen] = useState(false);

  const editingTools = [
    {
      id: 'texto',
      tagEs: '001 / TEXTO E IMÁGENES',
      tagEn: '001 / TEXT & IMAGES',
      titleEs: 'Editar Texto e Imágenes',
      titleEn: 'Edit Text & Images',
      descEs:
        'Edita texto e imágenes directamente en tu PDF sin perder el formato original del documento.',
      descEn: 'Edit text and images directly in your PDF without losing original layout.',
      icon: Type,
      path: '/editar/texto',
    },
    {
      id: 'foliado',
      tagEs: '002 / FOLIADO Y NÚMEROS',
      tagEn: '002 / PAGE NUMBERS',
      titleEs: 'Poner Números a Páginas (Foliado)',
      titleEn: 'Add Page Numbers (Folios)',
      descEs:
        'Añade números correlativos y foliados personalizados en el encabezado o pie de página.',
      descEn: 'Add consecutive page numbers and customized folios in headers or footers.',
      icon: Hash,
      path: '/editar/foliar',
    },
    {
      id: 'poner-marca-agua',
      tagEs: '003 / SELLO DE AGUA',
      tagEn: '003 / ADD WATERMARK',
      titleEs: 'Poner Sello de Agua',
      titleEn: 'Add Watermark',
      descEs: 'Inserta sellos de agua personalizados en texto o imagen en todo el documento PDF.',
      descEn: 'Insert customized text or image watermarks across the entire PDF document.',
      icon: ShieldAlert,
      path: '/editar/marca-agua',
    },
    {
      id: 'quitar-marca-agua',
      tagEs: '004 / QUITAR SELLO DE AGUA',
      tagEn: '004 / REMOVE WATERMARK',
      titleEs: 'Quitar Sello de Agua',
      titleEn: 'Remove Watermark',
      descEs: 'Detecta y remueve sellos o marcas de agua existentes de un documento PDF.',
      descEn: 'Detect and remove existing watermarks or stamps from a PDF document.',
      icon: Sparkles,
      path: '/editar/quitar-marca-agua',
    },
    {
      id: 'firmar',
      tagEs: '005 / FIRMA DIGITAL',
      tagEn: '005 / DIGITAL SIGNATURE',
      titleEs: 'Firmar PDF',
      titleEn: 'Sign PDF',
      descEs: 'Dibuja, escribe o sube una imagen de tu firma para estamparla en el documento.',
      descEn: 'Draw, type, or upload an image of your signature to stamp on the document.',
      icon: PenTool,
      path: '/editar/firma',
    },
    {
      id: 'ocr',
      tagEs: '006 / OCR RECONOCIMIENTO',
      tagEn: '006 / SEARCHABLE OCR',
      titleEs: 'OCR PDF (Texto Seleccionable)',
      titleEn: 'OCR PDF (Selectable Text)',
      descEs: 'Convierte un PDF escaneado o imágenes en un documento PDF con texto seleccionable.',
      descEn: 'Convert scanned PDF or images into a PDF with selectable text.',
      icon: Search,
      path: '/editar/ocr',
    },
  ];

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
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isEs ? '001 / HERRAMIENTAS DE EDICIÓN PDF' : '001 / PDF EDITING TOOLS'}
                  </h1>
                  {/* INSIGNIA DE CONFIANZA MONOCROMÁTICA */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {isEs ? '100% Local • Cero Servidores' : '100% Local • Zero Servers'}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-1">
                  {isEs
                    ? 'Selecciona el módulo de edición que deseas aplicar sobre tu documento:'
                    : 'Select the editing module you wish to apply to your document:'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono">
              <KpiPill
                icon={FileText}
                title={isEs ? 'Archivos' : 'Files'}
                value={12}
                tooltip={isEs ? 'Tus archivos procesados esta semana' : 'Files processed this week'}
                color="text-white"
              />
              <KpiPill
                icon={HardDrive}
                title={isEs ? 'Ahorrado' : 'Saved'}
                value={1.2}
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
                value={45}
                suffix=" min"
                tooltip={
                  isEs ? 'Tiempo ahorrado en tu sesión actual' : 'Time saved in current session'
                }
                color="text-zinc-200"
              />
            </div>
          </div>

          {/* CUADRÍCULA DE HERRAMIENTAS DE EDICIÓN (FULL-WIDTH 3 COLUMNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {editingTools.map((tool) => {
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

          {/* SECCIÓN: 3 PASOS PARA TRABAJAR PDF */}
          <div className="w-full mt-14 pt-10 border-t border-zinc-800 flex flex-col items-center font-mono">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-full mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              {isEs ? '000 / PASOS DE EDICIÓN' : '000 / EDITING STEPS'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-8 font-sans">
              {isEs ? 'Solo 3 pasos para editar tu PDF' : 'Only 3 steps to edit your PDF'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* PASO 1 */}
              <SpotlightCard className="flex flex-col items-start p-6 sm:p-7 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-300 rounded-3xl transition-all shadow-xl font-mono">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-md">
                  1
                </div>
                <h4 className="text-sm font-bold text-white mb-2 font-sans">
                  {isEs ? '1. Elige una herramienta' : '1. Select a tool'}
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed font-normal">
                  {isEs
                    ? 'Selecciona la función que necesitas: Texto, Foliar, Firmar, Sello o OCR.'
                    : 'Choose the function you need: Text, Folios, Sign, Watermark, or OCR.'}
                </p>
              </SpotlightCard>

              {/* PASO 2 */}
              <SpotlightCard className="flex flex-col items-start p-6 sm:p-7 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-300 rounded-3xl transition-all shadow-xl font-mono">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-md">
                  2
                </div>
                <h4 className="text-sm font-bold text-white mb-2 font-sans">
                  {isEs ? '2. Personaliza tu PDF' : '2. Customize your PDF'}
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed font-normal">
                  {isEs
                    ? 'Aplica tus cambios directamente en el visor de edición con procesamiento local.'
                    : 'Apply your changes directly in the editing viewer with local execution.'}
                </p>
              </SpotlightCard>

              {/* PASO 3 */}
              <SpotlightCard className="flex flex-col items-start p-6 sm:p-7 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-300 rounded-3xl transition-all shadow-xl font-mono">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-md">
                  3
                </div>
                <h4 className="text-sm font-bold text-white mb-2 font-sans">
                  {isEs ? '3. Descarga instantánea' : '3. Instant download'}
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed font-normal">
                  {isEs
                    ? 'Obtén tu documento final 100% procesado de forma privada en tu navegador.'
                    : 'Get your final document 100% processed privately in your browser.'}
                </p>
              </SpotlightCard>
            </div>
          </div>

          {/* SECCIÓN DETALLADA: ¿QUÉ SUCEDE CON TU ARCHIVO PDF Y EXPLICACIÓN DE HERRAMIENTAS DE EDICIÓN */}
          <div className="w-full mt-12 space-y-8 font-sans">
            {/* BLOQUE 1: ¿QUÉ SUCEDE CON TU ARCHIVO PDF? (PRIVACIDAD Y SEGURIDAD LOCAL) */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {isEs
                      ? '¿Qué sucede exactamente con tu archivo PDF al editarlo?'
                      : 'What exactly happens to your PDF file when edited?'}
                  </h3>
                  <span className="text-xs font-mono text-zinc-200 font-bold flex items-center gap-1.5 mt-0.5">
                    <Lock className="w-3.5 h-3.5 text-white" />
                    {isEs
                      ? 'PRIVACIDAD ABSOLUTA • PROCESAMIENTO 100% LOCAL EN RAM • SIN SERVIDORES'
                      : 'ABSOLUTE PRIVACY • 100% LOCAL RAM PROCESSING • ZERO SERVERS'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                    <HardDrive className="w-4 h-4 text-white" />
                    {isEs ? '1. Ejecución Local en tu Navegador' : '1. Local Browser Execution'}
                  </strong>
                  <p className="font-normal text-zinc-300">
                    {isEs
                      ? 'Tu documento PDF se carga y procesa exclusivamente dentro de la memoria RAM de tu propio navegador. Ningún byte o página de tu archivo se envía a servidores externos ni a almacenamiento en la nube.'
                      : 'Your PDF document is loaded and processed exclusively within your browser RAM. Zero bytes or pages are uploaded to external servers or cloud storage.'}
                  </p>
                </SpotlightCard>

                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs
                      ? '2. Conservación de Formato y Estructura'
                      : '2. Format & Layout Integrity'}
                  </strong>
                  <p className="font-normal text-zinc-300">
                    {isEs
                      ? 'La edición modifica únicamente las capas de contenido seleccionadas (texto, foliado, sellos de agua o firmas). El documento conserva intacta su resolución original, fuentes vectoriales y maquetación.'
                      : 'Editing only alters the selected content layers (text, folios, watermarks, or signatures). The document preserves its original resolution, vector fonts, and layout.'}
                  </p>
                </SpotlightCard>

                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? '3. Purga Automática de Memoria' : '3. Automatic Memory Purge'}
                  </strong>
                  <p className="font-normal text-zinc-300">
                    {isEs
                      ? 'Una vez descargado el PDF editado o al cerrar la ventana, la memoria RAM libera automáticamente todos los datos procesados, garantizando la confidencialidad de tus contratos, facturas o archivos personales.'
                      : 'Once the edited PDF is downloaded or the tab is closed, browser RAM automatically purges all processed buffers, guaranteeing privacy for confidential files.'}
                  </p>
                </SpotlightCard>
              </div>
            </SpotlightCard>

            {/* BLOQUE 2: GUÍA EXPLICATIVA DE TODAS LAS HERRAMIENTAS DE EDICIÓN */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight font-sans">
                    {isEs
                      ? 'Herramientas disponibles en el Módulo de Edición'
                      : 'Available Tools in the Editing Module'}
                  </h3>
                  <p className="text-xs text-zinc-300 font-mono">
                    {isEs
                      ? 'Conoce en detalle las 6 funciones avanzadas para personalizar tus documentos PDF.'
                      : 'Learn in detail about the 6 advanced functions to customize your PDF documents.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
                {editingTools.map((tool) => (
                  <SpotlightCard
                    key={tool.id}
                    className="bg-zinc-800/80 border border-zinc-600 hover:border-white rounded-2xl p-5 transition-all flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-500 text-white">
                          <tool.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-300 font-bold tracking-wider">
                          {isEs ? tool.tagEs : tool.tagEn}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">
                        {isEs ? tool.titleEs : tool.titleEn}
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {isEs ? tool.descEs : tool.descEn}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-700 flex items-center justify-between text-[11px] font-mono text-zinc-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" /> 100% Local
                      </span>
                      <span className="text-zinc-400 font-sans font-normal">
                        {isEs ? 'Sin Servidores' : 'No Servers'}
                      </span>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </SpotlightCard>
          </div>

          {/* TABLA DE ARCHIVOS RECIENTES */}
          <div className="relative z-10 mt-12 sm:mt-16 font-sans">
            <SpotlightCard className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl mb-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-zinc-700 pb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                    <FolderOpen className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
                    <span>007 /</span> {isEs ? 'ARCHIVOS RECIENTES' : 'RECENT FILES'}
                  </h3>
                </div>

                <div className="relative w-full sm:w-72 font-mono">
                  <Search className="w-3.5 h-3.5 text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isEs ? 'Buscar archivos...' : 'Search files...'}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider pl-2">
                        {isEs ? 'NOMBRE DEL ARCHIVO' : 'FILE NAME'}
                      </th>
                      <th className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider">
                        {isEs ? 'TAMAÑO' : 'SIZE'}
                      </th>
                      <th className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider">
                        {isEs ? 'ACCIÓN REALIZADA' : 'ACTION PERFORMED'}
                      </th>
                      <th className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider">
                        {isEs ? 'ESTADO' : 'STATUS'}
                      </th>
                      <th className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider text-right pr-2">
                        {isEs ? 'ACCIONES' : 'ACTIONS'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/80 text-zinc-200">
                    <TableRow
                      name="Documento_Editado_v1.pdf"
                      size="3.1 MB"
                      action={isEs ? 'Texto & Firma Editados' : 'Text & Signature Edited'}
                      status={isEs ? 'Completado' : 'Completed'}
                      icon={FileText}
                    />
                    <TableRow
                      name="Expediente_Foliado.pdf"
                      size="8.4 MB"
                      action={isEs ? 'Folios Agregados (1-42)' : 'Page Numbers Added (1-42)'}
                      status={isEs ? 'Completado' : 'Completed'}
                      icon={Hash}
                    />
                    <TableRow
                      name="Contrato_Protegido.pdf"
                      size="1.2 MB"
                      action={isEs ? 'Cifrado con Contraseña' : 'Encrypted with Password'}
                      status={isEs ? 'Completado' : 'Completed'}
                      icon={ShieldCheck}
                    />
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          </div>
        </motion.div>
      </div>

      {/* ASISTENTE IA */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 w-80 sm:w-96 bg-[#0a0a0d] border border-zinc-600 rounded-3xl shadow-2xl overflow-hidden font-mono"
            >
              <div className="bg-zinc-900 p-4 border-b border-zinc-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="font-bold text-white text-xs tracking-wider">
                    {isEs ? '008 / ASISTENTE LOCAL' : '008 / LOCAL ASSISTANT'}
                  </span>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 h-44 flex flex-col justify-end bg-[#0a0a0d]">
                <div className="bg-zinc-800 border border-zinc-600 p-3.5 rounded-2xl rounded-bl-none w-[90%] mb-2 shadow-md">
                  <p className="text-xs text-zinc-200 font-sans">
                    {isEs
                      ? '¡Hola! Estoy listo para ayudarte a editar tus archivos PDF de forma 100% local.'
                      : 'Hello! I am ready to help you edit your PDF files 100% locally.'}
                  </p>
                </div>
              </div>
              <div className="p-3 border-t border-zinc-700 bg-zinc-900">
                <input
                  type="text"
                  placeholder={isEs ? '$ Escribe una consulta...' : '$ Type a command...'}
                  className="w-full bg-zinc-950 border border-zinc-600 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-400 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-xs font-mono text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
            {isEs ? '$ asistente-local' : '$ local-assistant'}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="bg-white text-black hover:bg-zinc-200 p-3.5 rounded-full shadow-2xl transition-all cursor-pointer border border-white"
          >
            <Bot className="w-5 h-5 text-black" />
          </motion.button>
        </div>
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

function TableRow({
  name,
  size,
  action,
  status,
  icon: Icon,
}: {
  name: string;
  size: string;
  action: string;
  status: string;
  icon: React.ElementType;
}) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <tr className="border-b border-zinc-700/80 hover:bg-zinc-800/40 transition-colors group">
      <td className="py-3.5 pl-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 rounded-xl border border-zinc-600 group-hover:border-zinc-400 transition-colors text-white shadow-sm">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans font-semibold text-xs text-white group-hover:text-white transition-colors">
            {name}
          </span>
        </div>
      </td>
      <td className="py-3.5 text-zinc-300 text-xs font-mono">{size}</td>
      <td className="py-3.5 text-zinc-300 text-xs font-mono">{action}</td>
      <td className="py-3.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-white" /> {status}
        </span>
      </td>
      <td className="py-3.5 pr-2 text-right">
        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={isEs ? 'Favorito' : 'Favorite'}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={isEs ? 'Vista Previa' : 'Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={isEs ? 'Descargar' : 'Download'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={isEs ? 'Eliminar' : 'Delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function EditarPage() {
  return (
    <Suspense fallback={null}>
      <EditarContent />
    </Suspense>
  );
}
