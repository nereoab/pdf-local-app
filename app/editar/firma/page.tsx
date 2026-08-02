'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, PenTool, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfSigner = dynamic(() => import('@/components/PdfSigner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para firmar PDF...</p>
    </div>
  )
});

export default function FirmaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfSigner />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
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
                {
                  step: '01',
                  es: 'Sube tu archivo PDF. Las miniaturas se cargarán en una cuadrícula adaptativa de 4 columnas.',
                  en: 'Upload your PDF. Page thumbnails will load in a 4-column adaptive grid.'
                },
                {
                  step: '02',
                  es: 'Crea tu firma: dibújala libremente, escribe tu nombre con fuente cursiva o sube un sello/imagen PNG.',
                  en: 'Create your signature: draw freehand, type your name in cursive font, or upload a stamp/PNG image.'
                },
                {
                  step: '03',
                  es: 'Arrastra y posiciona la firma en el lienzo interactivo del visor. Puedes ajustar escala, cargo y fecha.',
                  en: 'Drag and position the signature on the interactive viewer canvas. Adjust scale, role, and date.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Estampar Firma Digital →" (o usa certificado PAdES) para descargar el documento.',
                  en: 'Click "Stamp Digital Signature →" (or use PAdES certificate) to download document.'
                }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs ? item.es : item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: LIMITACIONES Y CONSEJOS ÚTILES */}
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
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  ✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
                </h4>
                {[
                  isEs ? 'Dibujar firma manuscrita con trazo suave y nítido.' : 'Draw handwritten signature with smooth crisp strokes.',
                  isEs ? 'Incrustar sellos de imagen PNG con transparencia.' : 'Embed PNG image stamps with transparency.',
                  isEs ? 'Firmar criptográficamente con certificados PAdES (.p12/.pfx) y firma por lotes.' : 'Sign cryptographically with PAdES (.p12/.pfx) certificates and batch signing.',
                  isEs ? 'Incluir sello de fecha/hora y código hash de verificación de auditoría.' : 'Include date/time stamp and audit verification hash code.',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de firmar.' : 'Unlock password-protected PDFs before signing.'
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
                  isEs ? 'Para valor legal avanzado e inalterable, utiliza el modo Firma PAdES con certificado digital.' : 'For unalterable legal value, use PAdES Signature mode with digital certificate.',
                  isEs ? 'Arrastra libremente el sello sobre la hoja antes de presionar el botón de firmar.' : 'Drag stamp freely on page before clicking sign button.',
                  isEs ? 'Ajusta la escala de la firma (50% a 200%) según el tamaño del recuadro.' : 'Adjust signature scale (50% to 200%) to fit signature box.',
                  isEs ? 'Estampa metadatos de Título y Autor en las Opciones Avanzadas.' : 'Stamp Title and Author metadata in Advanced Options.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ¿QUÉ SUCEDE CON TU DOCUMENTO? */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al firmarlo?' : '3. What happens to your document when signing?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento Local o PAdES Seguro' : 'Local or Secure PAdES Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Las firmas locales se trazan en tu navegador sin enviar datos. Las firmas PAdES se procesan en API cifrada.' : 'Local signatures run in browser without sending data. PAdES signatures process via encrypted API.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">✍️ {isEs ? 'Firma Vectorial e Integrada' : 'Embedded Vector Signature'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'La firma se incrusta como objeto vectorial nítido con metadatos de fecha y hash de verificación.' : 'The signature is embedded as a sharp vector object with date and hash audit metadata.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Privacidad e Integridad Garantizada' : 'Privacy & Integrity Guaranteed'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tu archivo original nunca es modificado ni sobrescrito. La descarga genera un nuevo PDF firmado al instante.' : 'Your original file is never modified or overwritten. Download generates a clean signed PDF.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: PREGUNTAS FRECUENTES (FAQ) - ACORDEÓN INTERACTIVO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas frecuentes (FAQ)' : '4. Frequently Asked Questions (FAQ)'}
              </h2>
            </div>

            <div className="space-y-3 font-sans">
              {[
                {
                  q: isEs ? '¿Cuál es la diferencia entre firma simple y firma PAdES?' : 'What is the difference between simple signature and PAdES signature?',
                  a: isEs 
                    ? 'La firma simple o visual estampa el trazo/imagen de la firma en la página. La firma PAdES inyecta una firma criptográfica con certificado PKCS#12 (.p12/.pfx), garantizando validez jurídica e inalterabilidad del PDF.'
                    : 'Simple/visual signature stamps signature image/trace on page. PAdES signature injects a cryptographic PKCS#12 (.p12/.pfx) certificate, guaranteeing legal validity.'
                },
                {
                  q: isEs ? '¿Puedo firmar múltiples archivos PDF a la vez?' : 'Can I sign multiple PDF files at once?',
                  a: isEs
                    ? 'Sí. Activa el modo Firma PAdES y habilita el interruptor "Firma por Lotes" para firmar múltiples documentos simultáneamente.'
                    : 'Yes. Activate PAdES Signature mode and turn on "Batch Signing" toggle to sign multiple documents simultaneously.'
                },
                {
                  q: isEs ? '¿Mis firmas manuscritas se envían a servidores?' : 'Are my handwritten signatures sent to servers?',
                  a: isEs
                    ? 'No en el modo local. La captura del trazo y el estampado en el PDF se realizan 100% en la memoria RAM de tu navegador.'
                    : 'Not in local mode. Trace capture and PDF stamping happen 100% inside your browser RAM.'
                },
                {
                  q: isEs ? '¿Puedo firmar un PDF protegido con contraseña?' : 'Can I sign a password-protected PDF?',
                  a: isEs
                    ? 'Sí. Al cargar un PDF encriptado, aparecerá un widget inline de clave. Ingresa la contraseña de apertura una vez para desbloquear el visor y proceder.'
                    : 'Yes. Upon loading an encrypted PDF, an inline key widget will appear. Enter the open password once to unlock the viewer and proceed.'
                }
              ].map((faq, idx) => (
                <details 
                  key={idx} 
                  className="group bg-zinc-900/60 border border-white/5 rounded-xl transition-all duration-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-xs sm:text-sm text-white select-none group-hover:text-zinc-200">
                    <span>{faq.q}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0 ml-2" />
                  </summary>
                  <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3 font-sans">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}