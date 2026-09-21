'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  HardDrive,
  Shield,
  Binary,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfRedacter = dynamic(() => import('@/components/PdfRedacter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor TrueRedact™ de censura permanente y purgado binario...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function CensurarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const faqs = isEs
    ? [
        {
          q: '¿Por qué la censura de PDFBlack es irreversible a diferencia de otros editores?',
          a: 'Muchos programas básicos simplemente dibujan un rectángulo negro sobre el texto, permitiendo que cualquiera copie el texto subyacente o lo extraiga con herramientas forenses. El motor TrueRedact™ de PDFBlack purga físicamente los operadores tipográficos (Tj, TJ), re-codifica los flujos de contenido binario stream y destruye los datos a nivel byte, haciendo imposible cualquier recuperación.',
        },
        {
          q: '¿Qué información detecta automáticamente el escáner con expresiones regulares?',
          a: 'El escáner inteligente analiza patrones estándar de alta sensibilidad: números de tarjetas de crédito (con validación de algoritmo de Luhn para Visa, Mastercard, Amex), números de identificación fiscal (DNI, NIE, SSN), direcciones de correo electrónico, números telefónicos internacionales y búsquedas de términos específicos personalizados.',
        },
        {
          q: '¿Se eliminan también los metadatos ocultos y las capas de texto invisibles?',
          a: 'Sí. Además de purgar el texto visible y gráficos en las páginas, PDFBlack sanitiza los diccionarios de metadatos del documento (Título, Autor, Software creador, fecha de modificación), vacía el árbol XMP XML y purga capas de texto OCR ocultas para garantizar que no existan fugas colaterales.',
        },
        {
          q: '¿Qué es el Certificado Forense de Cadena de Custodia?',
          a: 'Tras completar la censura, puedes generar un certificado de auditoría técnica que incluye los hashes criptográficos SHA-256 del archivo original y del archivo censurado, sello de tiempo, versión del motor y número exacto de parches aplicados. Esto proporciona validez legal para cumplimiento de RGPD, HIPAA o auditorías periciales.',
        },
        {
          q: '¿Puedo censurar imágenes, firmas manuscritas o fotografías de rostros?',
          a: 'Sí. Mediante la herramienta de selección rectangular libre puedes marcar cualquier región visual del documento (firmas, sellos notariales, fotografías, logotipos o códigos de barras). El motor rasteriza y quema permanentemente el parche sobre los datos de imagen subyacentes.',
        },
        {
          q: '¿Es seguro procesar expedientes judiciales o nóminas en PDFBlack?',
          a: 'Absolutamente seguro. La arquitectura de PDFBlack es 100% local en tu navegador. Tus documentos confidenciales se leen y transforman exclusivamente en la memoria RAM de tu equipo, sin enviarse a servidores externos ni almacenarse en ninguna base de datos en la nube.',
        },
      ]
    : [
        {
          q: 'Why is PDFBlack redaction irreversible compared to standard PDF editors?',
          a: 'Many standard tools merely overlay a black box over text, allowing anyone to select, copy, or extract the underlying text. PDFBlack TrueRedact™ physically purges glyph drawing operators (Tj, TJ), re-encodes binary content streams, and destroys data at byte level, ensuring zero chance of recovery.',
        },
        {
          q: 'Which sensitive data types does the automated pattern scanner detect?',
          a: 'The smart scanner searches for critical patterns: credit cards (with Luhn checksum validation for Visa, Mastercard, Amex), national identity numbers (DNI, NIE, SSN), corporate email addresses, phone numbers, and custom keyword queries.',
        },
        {
          q: 'Does it strip hidden document metadata and invisible OCR layers?',
          a: 'Yes. Beyond purging visible page contents, PDFBlack sanitizes standard metadata dictionaries (Title, Author, Producer, Creation Date), wipes XMP XML metadata trees, and cleans hidden OCR text layers to prevent accidental leaks.',
        },
        {
          q: 'What is the Forensic Chain of Custody Certificate?',
          a: 'Upon redaction, you can export an audit certificate featuring cryptographic SHA-256 hashes of the pre- and post-redaction documents, timestamps, engine specs, and patch logs. This provides legal compliance documentation for GDPR, HIPAA, and compliance audits.',
        },
        {
          q: 'Can I redact scanned images, handwritten signatures, or photographs?',
          a: 'Yes. Using the manual rectangular bounding tool, you can select any graphical region (signatures, notarized stamps, face photos, logos, or barcodes). The engine renders and permanently burns the opaque patch over the image bytes.',
        },
        {
          q: 'Is it safe to process court records or payroll documents on PDFBlack?',
          a: '100% safe. PDFBlack is built on client-side browser execution. Your confidential files are parsed and sanitized purely inside your local RAM, with zero transmission to external servers or cloud storage.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs ? 'Censurar PDF Gratis Online — PDFBlack' : 'Redact PDF Online Free — PDFBlack',
    url: isEs ? `${SITE_URL}/optimizar/censurar` : `${SITE_URL}/en/redact-pdf`,
    applicationCategory: 'SecurityApplication, UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description: isEs
      ? 'Censura y oculta información confidencial en archivos PDF online de forma permanente. Purgado binario de texto, sanitización de metadatos y certificado SHA-256 local.'
      : 'Permanently redact and hide sensitive information in PDF files online. True binary text purge, metadata sanitization, and local SHA-256 audit certificate.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Purgado binario real de operadores de texto (irreversible)',
      'Escaneo regex inteligente (tarjetas, DNI, emails, teléfonos)',
      'Sanitización profunda de metadatos XMP y propiedades ocultas',
      'Certificado pericial de custodia con hashes SHA-256',
      'Procesamiento 100% local en navegador sin subida a servidores',
      'Descarga directa del documento censurado sin marcas de agua',
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
        <PdfRedacter />

        {/* SECCIÓN DE VALOR TÉCNICO Y CARACTERÍSTICAS */}
        <section className="w-full mt-16 pt-12 border-t border-zinc-800">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'SEGURIDAD Y COMPLIANCE LEGAL' : 'SECURITY & LEGAL COMPLIANCE'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Censura Binaria Definitiva sin Posibilidad de Fugas'
                : 'Definitive Binary Redaction with Zero Data Leakage'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-3 max-w-2xl mx-auto leading-relaxed">
              {isEs
                ? 'Garantiza la anonimización de expedientes conforme a la normativa RGPD y estándares internacionales eliminando físicamente los datos del documento.'
                : 'Ensure full record anonymization under GDPR and international privacy standards by physically stripping data from file streams.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Purgado Binario y Purga XMP */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Binary className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Purgado Binario y Purga XMP' : 'Binary Purge & XMP Flush'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Elimina físicamente los operadores tipográficos en el stream y purga del catálogo el árbol XML /Metadata y /PieceInfo sin dejar rastro forense.'
                    : 'Physically strips font glyph operators from streams and purges catalog XML /Metadata and /PieceInfo trees cleanly.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Eliminación irreversible' : 'Irreversible deletion'}
              </span>
            </div>

            {/* Card 2: Escáner Inteligente con Luhn */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Auditoría Forense con Algoritmo Luhn' : 'Luhn Algorithm Forensic Audit'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Escanea automáticamente tarjetas con validación matemática de checksum, DNI/NIE, cuentas IBAN, emails, teléfonos y palabras clave.'
                    : 'Auto-scans cards with mathematical checksum validation, national IDs, IBAN accounts, emails, phones, and custom keywords.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Detección precisa sin falsos positivos' : 'Zero false-positive detection'}
              </span>
            </div>

            {/* Card 3: Estampado y Replicación */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs
                    ? 'Estampado y Replicación Multi-Página'
                    : 'Stamping & Multi-Page Replication'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Estampa textos corporativos como [CENSURADO] o [CONFIDENCIAL] y replica membretes o firmas en todas las páginas del documento en 1 clic.'
                    : 'Stamps corporate labels like [REDACTED] or [CONFIDENTIAL] and replicates headers or signature boxes across all pages in 1 click.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Productividad para expedientes' : 'Productivity for bulk dossiers'}
              </span>
            </div>

            {/* Card 4: Privacidad 100% Local */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Privacidad Absoluta (Cero Servidores)' : 'Zero-Server Total Privacy'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Todo el escaneo, dibujo y quema de parches se ejecuta en la memoria RAM de tu navegador. Conforme a RGPD, HIPAA y NIST SP 800-88.'
                    : 'All scanning, drawing, and patch baking runs inside your browser RAM. Compliant with GDPR, HIPAA, and NIST SP 800-88.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Conforme a RGPD, HIPAA y NIST' : 'GDPR, HIPAA & NIST compliant'}
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
              {isEs ? 'Preguntas Frecuentes sobre la Censura de PDF' : 'Frequently Asked Questions'}
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
