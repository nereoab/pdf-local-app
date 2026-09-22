'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  PenTool,
  Lock,
  Zap,
  Loader2,
  Maximize2,
} from 'lucide-react';
import { getShareDetails, ShareMetadata } from '@/lib/share-service';
import { triggerLuxuryConfetti } from '@/components/ui/AnimatedSuccessCheck';
import { toast } from 'sonner';
import PdfPageViewer from '@/components/PdfPageViewer';

interface SharedDocViewProps {
  shareId: string;
}

export default function SharedDocView({ shareId }: SharedDocViewProps) {
  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState<ShareMetadata | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  // Estados para el visor de PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const data = await getShareDetails(shareId);
      if (isMounted) {
        setDocData(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [shareId]);

  // Cargar el archivo PDF en un objeto File para renderizado en Canvas de alta definición
  useEffect(() => {
    let isMounted = true;
    if (!docData?.shareId) return;

    (async () => {
      setLoadingPdf(true);
      try {
        const streamUrl = `/api/share?id=${encodeURIComponent(docData.shareId)}&stream=1`;
        const res = await fetch(streamUrl);
        if (!res.ok) throw new Error('Error al obtener flujo PDF');
        const blob = await res.blob();
        const file = new File([blob], docData.originalName, { type: 'application/pdf' });

        const pdfjsLib = await import('pdfjs-dist');
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        } catch {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        }

        const buffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({
          data: buffer.slice(0),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise;

        if (isMounted) {
          setTotalPages(doc.numPages || 1);
          setPdfFile(file);
          setLoadingPdf(false);
        }
      } catch (err) {
        console.warn('Fallo renderizado canvas, usando modo iframe seguro:', err);
        if (isMounted) {
          setUseIframeFallback(true);
          setLoadingPdf(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [docData?.shareId, docData?.originalName]);

  const handleDownload = () => {
    if (!docData?.shareId) return;
    // Descarga directa a través de nuestro endpoint con cabeceras de adjunto y nombre original
    const downloadEndpoint = `/api/share?id=${encodeURIComponent(docData.shareId)}&download=1`;
    const link = document.createElement('a');
    link.href = downloadEndpoint;
    link.download = docData.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    try {
      triggerLuxuryConfetti();
    } catch {
      // no-op
    }
    toast.success('¡Descarga iniciada con éxito!');
  };

  const showcaseTools = [
    { name: 'Foliar PDF', path: '/editar/foliar', icon: Layers, desc: 'Numeración notarial' },
    {
      name: 'Comprimir PDF',
      path: '/optimizar/comprimir-pdf',
      icon: Zap,
      desc: 'Reduce tamaño sin perder calidad',
    },
    {
      name: 'Firmar PDF',
      path: '/editar/firmar',
      icon: PenTool,
      desc: 'Firma digital en segundos',
    },
    { name: 'Proteger PDF', path: '/optimizar/proteger', icon: Lock, desc: 'Cifra con contraseña' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080A] text-zinc-200 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FAF6EE]/20 to-[#E8DFCF]/5 border border-[#E8DFCF]/30 flex items-center justify-center animate-spin">
          <Sparkles className="w-6 h-6 text-[#FAF6EE]" />
        </div>
        <p className="mt-4 text-xs font-mono text-zinc-400">
          Cargando documento seguro de PDFBlack...
        </p>
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="min-h-screen bg-[#08080A] text-zinc-200 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Documento No Disponible</h1>
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            Este enlace ha expirado o el archivo fue eliminado por políticas de privacidad. Los
            documentos compartidos en PDFBlack se eliminan automáticamente tras 24 horas.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[#FAF6EE] text-black font-bold text-xs hover:bg-[#E8DFCF] transition-colors"
            >
              <span>Ir al inicio de PDFBlack</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-200 flex flex-col justify-between selection:bg-[#FAF6EE]/20 selection:text-white font-sans">
      {/* ── BARRA SUPERIOR BRANDED ── */}
      <header className="border-b border-zinc-800/80 bg-[#0d0d12]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FAF6EE] to-[#E8DFCF] flex items-center justify-center text-black font-black text-xs shadow-[0_0_10px_rgba(250,246,238,0.4)]">
              P
            </div>
            <span className="text-base font-extrabold tracking-tight text-white group-hover:text-[#FAF6EE] transition-colors">
              PDF<span className="text-[#FAF6EE]">Black</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verificado • Expira en 24h</span>
            </span>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <span>Crear PDFs gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL ── */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6 flex-1">
        {/* Tarjeta de Descarga de Lujo */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-b from-[#13131a] via-[#0f0f14] to-[#0a0a0d] border border-[#E8DFCF]/35 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Resplandor decorativo de fondo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FAF6EE]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-3.5 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-[#E8DFCF]/30 rounded-2xl flex-shrink-0 text-[#FAF6EE] shadow-lg">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF6EE]/10 border border-[#FAF6EE]/20 text-[#FAF6EE] text-[10px] font-mono font-bold uppercase tracking-wider">
                    {docData.tool}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    {docData.formattedSize}
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate max-w-md sm:max-w-lg">
                  {docData.originalName}
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compartido temporalmente a través de PDFBlack</span>
                </p>
              </div>
            </div>

            {/* Botón de Descarga Principal */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              className="w-full md:w-auto flex-shrink-0 relative group overflow-hidden bg-gradient-to-r from-[#FAF6EE] via-[#F3EDE2] to-[#E8DFCF] hover:from-white hover:to-[#FAF6EE] text-[#0A0A0C] font-extrabold px-7 py-4 rounded-2xl shadow-[0_4px_25px_rgba(250,246,238,0.3)] hover:shadow-[0_6px_35px_rgba(250,246,238,0.5)] transition-all cursor-pointer flex items-center justify-center gap-3 text-sm sm:text-base"
            >
              {/* Barrido brillante continuo */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <Download className="w-5 h-5 text-black group-hover:translate-y-0.5 transition-transform" />
              <span>{downloaded ? '¡Descargar de Nuevo!' : 'Descargar Documento PDF'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── VISOR EMBEBIDO DEL PDF ── */}
        <div className="bg-[#101015] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#FAF6EE]" />
              <span>Vista Previa del Documento</span>
            </span>
            <div className="flex items-center gap-3">
              <a
                href={`/api/share?id=${encodeURIComponent(docData.shareId)}&stream=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Abrir en pestaña nueva"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Pantalla completa</span>
              </a>
              <button
                onClick={handleDownload}
                className="text-[11px] font-bold text-[#FAF6EE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          <div className="w-full h-[65vh] sm:h-[75vh] bg-[#0a0a0d] relative flex flex-col items-center justify-center">
            {loadingPdf ? (
              <div className="flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-[#FAF6EE]" />
                <span>Cargando vista previa en alta definición...</span>
              </div>
            ) : pdfFile && !useIframeFallback ? (
              <PdfPageViewer
                file={pdfFile}
                activePage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
                title={docData.originalName}
                accentColor="amber"
                defaultZoom={85}
              />
            ) : (
              <iframe
                src={`/api/share?id=${encodeURIComponent(docData.shareId)}&stream=1`}
                title="PDF Preview"
                className="w-full h-full border-none"
              />
            )}
          </div>
        </div>

        {/* ── VITRINA DE HERRAMIENTAS DE PDFBLACK (VIRAL ACQUISITION) ── */}
        <div className="bg-gradient-to-r from-[#121217] via-[#0f0f14] to-[#121217] border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[#FAF6EE] font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>¿Trabajas con documentos PDF?</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                Edita, numera, comprime y firma tus PDFs 100% gratis en PDFBlack
              </h2>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FAF6EE] hover:text-white transition-colors"
            >
              <span>Ver todas las herramientas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {showcaseTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.name}
                  href={tool.path}
                  className="bg-black/40 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-[#E8DFCF]/40 p-3 rounded-2xl transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform text-[#FAF6EE]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-[#FAF6EE] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-[#FAF6EE]">
                      {tool.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono mt-0.5 leading-tight">
                      {tool.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── FOOTER DISCRETO ── */}
      <footer className="border-t border-zinc-800/80 bg-[#08080A] py-6 text-center text-xs text-zinc-500 font-mono">
        <p>PDFBlack • La suite premium de edición y conversión de PDF 100% privada y segura.</p>
      </footer>
    </div>
  );
}
