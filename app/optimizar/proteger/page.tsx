'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  HardDrive,
  KeyRound,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfProtector = dynamic(() => import('@/components/PdfProtector'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor criptográfico AES-256 de protección de PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function ProtegerPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const faqs = isEs
    ? [
        {
          q: '¿Qué diferencia hay entre la Contraseña de Apertura (User) y la de Permisos (Owner)?',
          a: 'La Contraseña de Apertura (User Password) exige ingresar la clave para poder abrir y leer el documento. La Contraseña de Permisos (Owner Password) permite abrir el archivo libremente para lectura, pero bloquea acciones específicas como la impresión de alta resolución, la copia de texto y vectores, o la modificación del contenido.',
        },
        {
          q: '¿Qué algoritmo de cifrado utiliza PDFBlack para asegurar los documentos?',
          a: 'PDFBlack implementa el estándar criptográfico más seguro del mercado: AES-256 (Advanced Encryption Standard con longitud de clave de 256 bits, R=6 acorde a la especificación ISO 32000-2). Este es el estándar aprobado por agencias gubernamentales y entidades financieras internacionales.',
        },
        {
          q: '¿Es seguro escribir contraseñas confidenciales o subir documentos legales?',
          a: 'Totalmente seguro. PDFBlack opera con una arquitectura 100% local en tu navegador mediante la Web Crypto API nativa de JavaScript. Ni tu archivo PDF ni las contraseñas que escribas se transmiten jamás por internet ni quedan almacenados en servidores externos.',
        },
        {
          q: '¿Qué permisos específicos puedo restringir en el archivo PDF?',
          a: 'Puedes controlar de forma granular: permitir o bloquear la impresión (tanto estándar como en alta resolución), la copia de texto y gráficos, la inserción o rotación de páginas, el rellenado de formularios interactivos y la extracción de contenido para tecnologías de asistencia.',
        },
        {
          q: '¿Los documentos protegidos son compatibles con Adobe Acrobat y visores móviles?',
          a: 'Sí, 100% compatibles. Los archivos cifrados por PDFBlack cumplen rigurosamente el estándar PDF 1.7 y 2.0, por lo que solicitan la contraseña de forma nativa en Adobe Acrobat, Foxit Reader, Apple Preview, Google Chrome, Microsoft Edge y dispositivos iOS/Android.',
        },
        {
          q: '¿Puedo proteger múltiples archivos PDF de forma simultánea?',
          a: 'Sí. Puedes añadir múltiples archivos a la cola de procesamiento. El motor aplicará la política de seguridad y contraseñas a cada documento de manera aislada en memoria RAM, permitiéndote descargarlos uno a uno o en un paquete .ZIP consolidado.',
        },
      ]
    : [
        {
          q: 'What is the difference between an Open Password (User) and Permissions Password (Owner)?',
          a: 'The Open Password (User Password) requires users to enter a password to view document contents. The Permissions Password (Owner Password) allows viewing but restricts operations such as high-resolution printing, text/graphics copying, or page editing.',
        },
        {
          q: 'What encryption algorithm does PDFBlack use to secure files?',
          a: 'PDFBlack implements military-grade AES-256 (Advanced Encryption Standard with 256-bit key length, R=6 per ISO 32000-2 standards). This is the recognized benchmark for government, healthcare, and banking compliance worldwide.',
        },
        {
          q: 'Is it safe to type confidential passwords or upload legal documents to PDFBlack?',
          a: '100% safe. PDFBlack operates with client-side architecture in your browser via native Web Crypto API. Neither your PDF file nor your passwords are ever uploaded or transmitted to external servers. Processing occurs purely in local RAM.',
        },
        {
          q: 'Which granular permissions can I restrict on the protected PDF?',
          a: 'You have granular control to allow or block: printing (standard and high quality), copying text and graphics, document modifications, page insertions/deletions, form field completion, and content extraction.',
        },
        {
          q: 'Are protected documents compatible with Adobe Acrobat and mobile readers?',
          a: 'Yes, 100% compatible. Protected PDFs strictly adhere to ISO PDF 1.7/2.0 specifications, seamlessly prompting for passwords in Adobe Acrobat, Foxit, Apple Preview, Google Chrome, Edge, and mobile readers.',
        },
        {
          q: 'Can I protect multiple PDF files at the same time?',
          a: 'Yes. You can queue multiple documents. The engine applies security policies to each file in isolated Web Workers, allowing individual downloads or a combined .ZIP package.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs
      ? 'Proteger PDF con Contraseña Gratis Online — PDFBlack'
      : 'Protect PDF with Password Online Free — PDFBlack',
    url: isEs ? `${SITE_URL}/optimizar/proteger` : `${SITE_URL}/en/protect-pdf`,
    applicationCategory: 'SecurityApplication, UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description: isEs
      ? 'Protege y cifra archivos PDF con contraseña online gratis. Cifrado AES-256 militar y control granular de permisos de impresión y copia. Procesamiento 100% local y privado.'
      : 'Protect and encrypt PDF files with password online free. Military-grade AES-256 encryption and granular print/copy permissions. 100% local private engine.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Cifrado estándar militar AES-256 (R=6 ISO 32000)',
      'Contraseña de apertura (User) y permisos (Owner)',
      'Restricción granular de impresión, copia y edición',
      'Procesamiento 100% local en navegador con Web Crypto API',
      'Compatibilidad universal con Adobe Acrobat y visores móviles',
      'Descarga individual o en paquete ZIP por lotes',
    ],
  };

  const faqStructuredData = {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="w-full max-w-7xl">
        <PdfProtector />

        {/* SECCIÓN DE VALOR TÉCNICO Y CARACTERÍSTICAS */}
        <section className="w-full mt-16 pt-12 border-t border-zinc-800">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'SEGURIDAD CRIPTOGRÁFICA CERTIFICADA' : 'CERTIFIED CRYPTOGRAPHIC SECURITY'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Protección Integral para tus Documentos Confidenciales'
                : 'Complete Protection for Confidential Documents'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-3 max-w-2xl mx-auto leading-relaxed">
              {isEs
                ? 'Cumple con normativas internacionales de protección de datos (RGPD, HIPAA, DPA) cifrando tus archivos en el cliente sin exposición de secretos en la red.'
                : 'Comply with international data regulations (GDPR, HIPAA, DPA) by encrypting files client-side with zero secret transmission.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 uppercase font-sans tracking-tight">
                  {isEs ? 'Cifrado AES-256 Militar' : 'Military AES-256 Encryption'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Aplica el algoritmo estándar de defensa e industria financiera ISO 32000 con derivación de clave PBKDF2 para máxima resistencia contra ataques de fuerza bruta.'
                    : 'Applies ISO 32000 defense and financial industry standard with PBKDF2 key derivation for maximum resistance against brute-force.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Longitud de clave: 256 bits' : 'Key length: 256 bits'}
              </span>
            </div>

            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <KeyRound className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 uppercase font-sans tracking-tight">
                  {isEs ? 'Permisos Granulares' : 'Granular Permissions'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Define independientemente qué usuarios pueden imprimir en alta definición, copiar texto, rellenar formularios o modificar la estructura de las páginas.'
                    : 'Independently control whether users can print in high resolution, copy text, complete forms, or modify page structures.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'User + Owner Passwords' : 'User + Owner Passwords'}
              </span>
            </div>

            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 uppercase font-sans tracking-tight">
                  {isEs ? 'Privacidad Absoluta (Cero Servidores)' : 'Zero-Server Total Privacy'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Todo el cifrado y generación criptográfica ocurre en la memoria RAM de tu dispositivo. Tus archivos y contraseñas jamás viajan por internet.'
                    : 'All cryptographic hashing and encryption occurs in local device RAM. Your files and passwords never travel over the network.'}
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
                ? 'Preguntas Frecuentes sobre la Protección de PDF'
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
