'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, PenTool, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfSigner = dynamic(() => import('@/components/PdfSigner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para firmar PDF...</p>
    </div>
  ),
});

export default function FirmaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfSigner />

        {/* ══════════════════════════════════════════════
            3 SECCIONES INFORMATIVAS CONSISTENTES
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR LA HERRAMIENTA ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo firmar un PDF' : '1. How to sign a PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', textEs: 'Sube tu archivo PDF arrastrándolo a la zona de carga o haciendo clic para seleccionarlo.', textEn: 'Upload your PDF by dragging it to the upload zone or clicking to select it.' },
                { step: '02', textEs: 'Elige cómo firmar: dibuja tu firma con el ratón o dedo, escribe tu nombre y elige un estilo, o sube una imagen de tu firma escaneada.', textEn: 'Choose how to sign: draw your signature with mouse or finger, type your name and pick a style, or upload a scanned signature image.' },
                { step: '03', textEs: 'Arrastra y coloca la firma en la posición exacta sobre la página del PDF usando el visor interactivo.', textEn: 'Drag and place the signature at the exact position on the PDF page using the interactive viewer.' },
                { step: '04', textEs: 'Haz clic en "Firmar PDF →" y descarga el documento con la firma estampada.', textEn: 'Click "Sign PDF →" and download the document with the signature stamped.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.textEs : item.textEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 2: LIMITACIONES Y CONSEJOS ── */}
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[
                  isEs ? 'Dibujar tu firma manuscrita directamente en el panel de dibujo con trazo libre.' : 'Draw your handwritten signature directly on the drawing panel with free stroke.',
                  isEs ? 'Escribir tu nombre y aplicar estilos de firma predefinidos (cursiva, formal, etc.).' : 'Type your name and apply predefined signature styles (cursive, formal, etc.).',
                  isEs ? 'Subir una imagen PNG/JPG de tu firma escaneada con fondo transparente.' : 'Upload a PNG/JPG image of your scanned signature with transparent background.',
                  isEs ? 'Posicionar la firma en cualquier página del documento con coordenadas ajustables.' : 'Position the signature on any document page with adjustable coordinates.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[
                  isEs ? 'Esta firma es una representación gráfica, no una firma digital con certificado criptográfico. Para usos legales avanzados, consulta con un notario.' : 'This signature is a graphic representation, not a digital signature with cryptographic certificate. For advanced legal use, consult a notary.',
                  isEs ? 'Para mejor calidad, usa una imagen PNG de tu firma con fondo transparente escaneada a 300 DPI.' : 'For best quality, use a PNG image of your signature with transparent background scanned at 300 DPI.',
                  isEs ? 'Puedes estampar la misma firma en múltiples páginas con un solo clic usando la opción de replicar en todo el documento.' : 'You can stamp the same signature on multiple pages with one click using the replicate across document option.',
                  isEs ? 'La firma queda integrada permanentemente en el PDF. No se puede editar o eliminar con herramientas básicas.' : 'The signature is permanently embedded in the PDF. It cannot be edited or removed with basic tools.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: QUÉ SUCEDE CON TU DOCUMENTO ── */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al firmarlo?' : '3. What happens to your document when you sign it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Tu firma se captura y procesa completamente en tu navegador. No se envía a ningún servidor externo.'
                    : 'Your signature is captured and processed entirely in your browser. It is never sent to any external server.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  ✍️ {isEs ? 'Firma vectorial de alta calidad' : 'High-quality vector signature'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'La firma se convierte en gráficos vectoriales integrados en el PDF. Se ve nítida a cualquier tamaño y no se pixela al hacer zoom o imprimir.'
                    : 'The signature is converted into vector graphics embedded in the PDF. It looks sharp at any size and does not pixelate when zooming or printing.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El PDF firmado se genera localmente y se descarga directamente a tu equipo. Tu archivo original permanece sin modificar.'
                    : 'The signed PDF is generated locally and downloads directly to your device. Your original file remains unmodified.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}