'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Unlock,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  KeyRound,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfUnlocker = dynamic(() => import('@/components/PdfUnlocker'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor criptográfico de desbloqueo de PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function DesbloquearPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // FAQs data
  const faqs = isEs
    ? [
        {
          q: '¿Cómo puede PDFBlack desbloquear archivos PDF sin pedir contraseña?',
          a: 'Más del 85% de los documentos PDF protegidos utilizan contraseñas de permisos (Owner Password). Estos archivos abren para lectura sin contraseña, pero bloquean la impresión, copia o edición. El motor de PDFBlack elimina el diccionario /Encrypt y normaliza la tabla XRef directamente en la memoria del navegador, liberando todas las funciones en 1 clic y conservando el 100% de vectores y fuentes originales.',
        },
        {
          q: '¿Por qué el archivo desbloqueado no pierde nitidez ni calidad de texto?',
          a: 'A diferencia de conversores básicos que convierten las páginas en imágenes JPEG borrosas, el motor vectorial v5.0 de PDFBlack realiza un desbloqueo estructural in-place. Mantiene los trazados vectoriales, fuentes tipográficas integradas y, en caso de descifrado con contraseña, inyecta una capa de texto de alta fidelidad sincronizada para que la selección con ratón y la búsqueda con Ctrl+F funcionen al 100%.',
        },
        {
          q: '¿Es seguro escribir la contraseña de mi PDF en PDFBlack?',
          a: 'Es totalmente seguro. PDFBlack funciona con arquitectura 100% local (Client-Side) mediante la Web Crypto API nativa de tu navegador y Web Workers dedicados. Ni tu archivo PDF ni la contraseña ingresada son transmitidos por internet ni guardados en ningún servidor. Una vez descifrado el documento, la clave se destruye de la memoria RAM.',
        },
        {
          q: '¿Qué sucede si olvido la contraseña de apertura de mi documento?',
          a: 'PDFBlack incluye un motor de recuperación inteligente que prueba patrones habituales: combinaciones de nombres de archivo, fechas recientes (DDMMAAAA, AAAAMMDD), diccionario hispano corporativo (factura, nómina, clave, admin) y un barrido sistemático de PINs de 4 dígitos (0000 a 9999). Puedes ver el velocímetro de claves/segundo en tiempo real.',
        },
        {
          q: '¿Qué ocurre con las firmas digitales de un PDF al desbloquearlo?',
          a: 'Al desbloquear o remover restricciones de un PDF firmado digitalmente, la firma digital se invalidará intencionalmente. Esto se debe a que cualquier alteración de bytes por seguridad jurídica anula el sello criptográfico original, tal como estipula el estándar ISO 32000.',
        },
        {
          q: '¿Puedo desbloquear múltiples archivos PDF protegidos a la vez?',
          a: 'Sí. Puedes añadir múltiples archivos PDF protegidos a la cola de procesamiento por lotes. El motor desbloqueará cada documento de forma secuencial en el Web Worker y te permitirá descargarlos uno a uno o todos juntos en un único archivo comprimido .ZIP.',
        },
      ]
    : [
        {
          q: 'How can PDFBlack unlock PDF files without requiring a password?',
          a: 'Over 85% of protected PDF files use permissions passwords (Owner Password). These documents open freely for reading, but restrict printing, text copying, or editing. PDFBlack strips the /Encrypt dictionary in your browser memory, freeing all permissions in 1 click while preserving 100% of native vectors and fonts.',
        },
        {
          q: 'Why does the unlocked document not lose text sharpness or resolution?',
          a: 'Unlike basic online tools that rasterize pages into blurry JPEG pictures, PDFBlack vector engine v5.0 performs in-place structural decryption. It preserves vector paths, embedded fonts, and injects a synchronized selectable text layer so cursor selection and Ctrl+F search remain 100% functional.',
        },
        {
          q: 'Is it safe to type my document password into PDFBlack?',
          a: 'Completely safe. PDFBlack runs 100% locally client-side using native Web Crypto API and dedicated Web Workers. Neither your PDF files nor passwords ever touch the internet or remote servers. Once decrypted, keys are discarded from RAM.',
        },
        {
          q: 'What happens if I forget my document opening password?',
          a: 'PDFBlack features a smart recovery engine that sweeps common patterns: filename word combinations, recent dates, dictionary phrases, and a full 4-digit PIN sweep (0000 to 9999) with real-time keys/sec velocity metrics.',
        },
        {
          q: 'What happens to digital signatures after unlocking?',
          a: 'Unlocking or removing restrictions from digitally signed PDFs will invalidate the digital signature. Modifying document bytes legally breaks the cryptographic seal per ISO 32000 standards.',
        },
        {
          q: 'Can I unlock multiple protected PDF documents at once?',
          a: 'Yes. You can queue multiple protected PDFs for batch unlocking. The Web Worker processes them and allows you to download each file individually or packed into a convenient .ZIP archive.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs ? 'Desbloquear PDF Gratis Online — PDFBlack' : 'Unlock PDF Online Free — PDFBlack',
    url: `${SITE_URL}/optimizar/desbloquear`,
    description: isEs
      ? 'Desbloquea archivos PDF protegidos con contraseña y elimina restricciones de impresión, copia y edición online gratis. Procesamiento 100% local en tu navegador sin subir archivos.'
      : 'Unlock password protected PDF files and remove restrictions on printing, copying, and editing online for free. 100% local client-side processing.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Desbloqueo en 1-clic para permisos de impresión y copia',
      'Descifrado con contraseña AES-256 local',
      'Motor de recuperación inteligente de PIN y patrones',
      'Preservación de texto seleccionable (Ctrl+F) y vectores',
      'Procesamiento 100% local y privado sin subida a servidores',
      'Descarga por lotes en archivo ZIP',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="w-full max-w-7xl space-y-12">
        {/* COMPONENTE PRINCIPAL */}
        <PdfUnlocker />

        {/* SECCIÓN INFORMATIVA CORPORATIVA: CARACTERÍSTICAS TÉCNICAS */}
        <section className="w-full border-t border-zinc-800 pt-12">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs
                ? 'INGENIERÍA CRIPTOGRÁFICA DE LIBERACIÓN'
                : 'CRYPTOGRAPHIC LIBERATION ENGINEERING'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Desbloqueo y Remoción de Restricciones en PDF'
                : 'Unlocking and Restriction Removal for PDF'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-2 max-w-2xl mx-auto">
              {isEs
                ? 'Elimina bloqueos de impresión, copia y edición al instante conservando la estructura de páginas original y nitidez vectorial.'
                : 'Instantly eliminate print, copy, and editing restrictions while preserving original page structure and crisp vector graphics.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Desbloqueo In-Place Estructural */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Unlock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Desbloqueo In-Place Estructural' : 'In-Place Structural Unlock'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Elimina el diccionario /Encrypt y normaliza la tabla xref en memoria RAM. Remueve restricciones de copia e impresión en 1 clic sin alterar el diseño.'
                    : 'Strips the /Encrypt dictionary and normalizes xref tables in RAM. Removes copy and print restrictions in 1 click without altering layout.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Sin pérdida de calidad' : 'Lossless unlock'}
              </span>
            </div>

            {/* Card 2: Recuperación Inteligente */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Recuperación Inteligente de Claves' : 'Smart Password Recovery'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Motor de barrido que prueba patrones de nombres, fechas corporativas, palabras frecuentes y PINs de 4 dígitos con velocímetro en tiempo real.'
                    : 'Sweeping engine testing filename patterns, dates, corporate keywords, and 4-digit PINs with real-time velocity metrics.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Velocidad hasta 10k claves/s' : 'Up to 10k keys/s'}
              </span>
            </div>

            {/* Card 3: Preservación Vectorial y OCR */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Preservación Vectorial y OCR' : 'Vector & OCR Preservation'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Mantiene el 100% de trazados vectoriales, definiciones tipográficas e inyecta una capa de texto de alta fidelidad para selección y búsqueda con Ctrl+F.'
                    : 'Preserves 100% of native vectors, typography, and injects a high-fidelity text layer for selection and Ctrl+F search.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Texto 100% seleccionable' : '100% selectable text'}
              </span>
            </div>

            {/* Card 4: Web Crypto 100% Local */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Privacidad Absoluta (Cero Servidores)' : 'Zero-Server Total Privacy'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Todo el descifrado AES-256 se realiza dentro del navegador mediante Web Crypto API. Ni tus archivos ni las contraseñas ingresadas se envían a ningún servidor.'
                    : 'All AES-256 decryption runs entirely client-side via native Web Crypto API. Neither files nor passwords touch external servers.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Conforme a RGPD y DPA' : 'GDPR & DPA compliant'}
              </span>
            </div>
          </div>
        </section>

        {/* SECCIÓN DE PREGUNTAS FRECUENTES (FAQ ACCORDION) */}
        <section className="w-full border-t border-zinc-800 pt-12 pb-8">
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'RESOLUCIÓN DE DUDAS TÉCNICAS' : 'TECHNICAL FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Preguntas Frecuentes sobre el Desbloqueo de PDF'
                : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-3 font-sans">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-white tracking-tight">{faq.q}</span>
                    </div>
                    <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800/60 mt-1">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
