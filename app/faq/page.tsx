'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { HelpCircle, ArrowLeft, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';

export default function FaqPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      qEs: '1. ¿Mis archivos se suben a algún servidor externo?',
      qEn: '1. Are my files uploaded to any external server?',
      aEs: 'No. Absolutamente ningún archivo se sube a servidores de internet. PDFBlack utiliza bibliotecas avanzadas de JavaScript y WebAssembly que procesan tus documentos en la memoria RAM local de tu propio navegador web (Chrome, Edge, Firefox, Safari).',
      aEn: 'No. Absolutely no files are uploaded to internet servers. PDFBlack uses advanced JavaScript and WebAssembly libraries to process your documents locally inside your browser RAM.'
    },
    {
      qEs: '2. ¿Existe algún límite de tamaño o cantidad de archivos?',
      qEn: '2. Is there any file size or quantity limit?',
      aEs: 'Al procesarse todo en tu propio dispositivo, el límite depende únicamente de la memoria RAM disponible en tu computadora o teléfono móvil. Puedes procesar archivos pesados de más de 500 MB o miles de páginas sin restricciones de pago.',
      aEn: 'Since processing takes place on your own device, the limit depends solely on the available RAM memory of your computer or phone. You can process heavy files over 500 MB without paywalls.'
    },
    {
      qEs: '3. ¿PDFBlack funciona sin conexión a internet?',
      qEn: '3. Does PDFBlack work without internet connection?',
      aEs: '¡Sí! Una vez que la página carga en tu navegador, puedes desconectarte de internet y continuar uniendo, dividiendo, comprimiendo, firmando y convirtiendo tus PDFs de manera 100% offline.',
      aEn: 'Yes! Once the page loads in your browser, you can disconnect from the internet and continue merging, splitting, compressing, signing, and converting PDFs 100% offline.'
    },
    {
      qEs: '4. ¿Por qué mi archivo comprimido pierde nitidez o se ve borroso?',
      qEn: '4. Why does my compressed file lose crispness or look blurry?',
      aEs: 'La compresión reduce la resolución de las imágenes internas del PDF para disminuir su tamaño en megabytes. Si necesitas mantener alta calidad para impresión de planos o fotografía, selecciona un nivel de compresión moderado.',
      aEn: 'Compression reduces the resolution of internal PDF images to save size in MB. If you need high quality for printing blueprints or photos, select moderate compression level.'
    },
    {
      qEs: '5. ¿PDFBlack es 100% gratuito o requiere registro?',
      qEn: '5. Is PDFBlack 100% free or does it require registration?',
      aEs: 'PDFBlack es totalmente gratuito, sin tarjetas de crédito, sin suscripciones y sin necesidad de crear una cuenta de usuario.',
      aEn: 'PDFBlack is completely free, with no credit cards, no subscriptions, and no registration required.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-200 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO Y REGRESO */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isEs ? 'Soporte y Respuestas' : 'Support & Answers'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-wider uppercase mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <HelpCircle className="w-3.5 h-3.5" />
            {isEs ? 'PREGUNTAS FRECUENTES (FAQ)' : 'FREQUENTLY ASKED QUESTIONS'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            {isEs ? 'Resolvemos tus dudas en segundos' : 'We answer your questions in seconds'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isEs 
              ? 'Conoce todos los detalles técnicos sobre cómo PDFBlack garantiza tu privacidad, funcionamiento sin conexión y rendimiento de archivos.'
              : 'Discover all technical details about how PDFBlack ensures your privacy, offline operation, and file performance.'}
          </p>
        </motion.div>

        {/* LISTADO ACORDEÓN DE PREGUNTAS FRECUENTES */}
        <div className="space-y-4 mb-12">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div 
                key={idx} 
                className="bg-[#0b1120]/90 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl transition-all"
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-extrabold text-base text-white focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    {isEs ? faq.qEs : faq.qEn}
                  </span>
                  <div className={`p-2 rounded-full bg-white/5 border border-white/10 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 pt-1 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-white/5 bg-slate-950/40"
                    >
                      {isEs ? faq.aEs : faq.aEn}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
