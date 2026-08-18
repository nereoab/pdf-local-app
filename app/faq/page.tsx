'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { HelpCircle, ArrowLeft, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

export default function FaqPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      qEs: '1. ¿Mis archivos se suben a algún servidor externo?',
      qEn: '1. Are my files uploaded to any external server?',
      aEs: 'No. Absolutamente ningún archivo se sube a servidores de internet. PDFBlack utiliza bibliotecas avanzadas de JavaScript y WebAssembly que procesan tus documentos en la memoria RAM local de tu propio navegador web (Chrome, Edge, Firefox, Safari).',
      aEn: 'No. Absolutely no files are uploaded to internet servers. PDFBlack uses advanced JavaScript and WebAssembly libraries to process your documents locally inside your browser RAM.',
    },
    {
      qEs: '2. ¿Existe algún límite de tamaño o cantidad de archivos?',
      qEn: '2. Is there any file size or quantity limit?',
      aEs: 'Al procesarse todo en tu propio dispositivo, el límite depende únicamente de la memoria RAM disponible en tu computadora o teléfono móvil. Puedes procesar archivos pesados de más de 500 MB o miles de páginas sin restricciones de pago.',
      aEn: 'Since processing takes place on your own device, the limit depends solely on the available RAM memory of your computer or phone. You can process heavy files over 500 MB without paywalls.',
    },
    {
      qEs: '3. ¿PDFBlack funciona sin conexión a internet?',
      qEn: '3. Does PDFBlack work without internet connection?',
      aEs: '¡Sí! Una vez que la página carga en tu navegador, puedes desconectarte de internet y continuar uniendo, dividiendo, comprimiendo, firmando y convirtiendo tus PDFs de manera 100% offline.',
      aEn: 'Yes! Once the page loads in your browser, you can disconnect from the internet and continue merging, splitting, compressing, signing, and converting PDFs 100% offline.',
    },
    {
      qEs: '4. ¿Por qué mi archivo comprimido pierde nitidez o se ve borroso?',
      qEn: '4. Why does my compressed file lose crispness or look blurry?',
      aEs: 'La compresión reduce la resolución de las imágenes internas del PDF para disminuir su tamaño en megabytes. Si necesitas mantener alta calidad para impresión de planos o fotografía, selecciona un nivel de compresión moderado.',
      aEn: 'Compression reduces the resolution of internal PDF images to save size in MB. If you need high quality for printing blueprints or photos, select moderate compression level.',
    },
    {
      qEs: '5. ¿PDFBlack es 100% gratuito o requiere registro?',
      qEn: '5. Is PDFBlack 100% free or does it require registration?',
      aEs: 'PDFBlack es totalmente gratuito, sin tarjetas de crédito, sin suscripciones y sin necesidad de crear una cuenta de usuario.',
      aEn: 'PDFBlack is completely free, with no credit cards, no subscriptions, and no registration required.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* ENCABEZADO Y REGRESO */}
        <div className="mb-8 flex items-center justify-between font-mono">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-full border border-white/10 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEs ? 'Soporte y Respuestas' : 'Support & Answers'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 font-mono"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            {isEs ? '006 / PREGUNTAS FRECUENTES (FAQ)' : '006 / FREQUENTLY ASKED QUESTIONS'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Resolvemos tus dudas en segundos' : 'We answer your questions in seconds'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs
              ? 'Conoce todos los detalles técnicos sobre cómo PDFBlack garantiza tu privacidad, funcionamiento sin conexión y rendimiento de archivos.'
              : 'Discover all technical details about how PDFBlack ensures your privacy, offline operation, and file performance.'}
          </p>
        </motion.div>

        {/* LISTADO ACORDEÓN DE PREGUNTAS FRECUENTES */}
        <div className="space-y-4 mb-12 font-mono">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <SpotlightCard
                key={idx}
                className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden shadow-xl transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-white flex-shrink-0" />
                    {isEs ? faq.qEs : faq.qEn}
                  </span>
                  <div
                    className={`p-1.5 rounded-full bg-zinc-900 border border-white/10 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-zinc-400'}`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5 pt-3 text-zinc-300 text-xs font-sans leading-relaxed border-t border-white/10 bg-zinc-900/40"
                    >
                      {isEs ? faq.aEs : faq.aEn}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
