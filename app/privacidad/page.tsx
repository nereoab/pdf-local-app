'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, HardDrive, Lock, Cpu, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PrivacidadPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO Y REGRESO */}
        <div className="mb-8 flex items-center justify-between font-mono">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEs ? 'Garantía 100% Local' : '100% Local Guarantee'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <Lock className="w-3.5 h-3.5 text-white" />
            {isEs ? '007 / POLÍTICA DE PRIVACIDAD' : '007 / PRIVACY POLICY'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Tus archivos nunca salen de tu dispositivo' : 'Your files never leave your device'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs 
              ? 'En PDFBlack la privacidad no es un compromiso comercial; es la arquitectura fundamental de nuestro software. Todo el procesamiento ocurre de forma local en la memoria RAM de tu propio navegador.'
              : 'At PDFBlack privacy is not a commercial commitment; it is the core architecture of our software. All processing takes place locally inside your browser RAM.'}
          </p>
        </motion.div>

        {/* 3 PILARES DE SEGURIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-mono">
          <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all">
            <div className="p-3 rounded-2xl bg-zinc-900 text-white border border-white/10 mb-4">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2 font-sans">{isEs ? 'Procesamiento en RAM' : 'RAM-Only Processing'}</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isEs 
                ? 'Los PDF se leen y transforman usando bibliotecas de JavaScript locales (PDF.js, WebAssembly) directamente en tu memoria RAM.'
                : 'PDFs are read and transformed using local JavaScript libraries (PDF.js, WebAssembly) directly in your RAM memory.'}
            </p>
          </div>

          <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all">
            <div className="p-3 rounded-2xl bg-zinc-900 text-emerald-400 border border-white/10 mb-4">
              <EyeOff className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2 font-sans">{isEs ? 'Cero Carga a Servidores' : 'Zero Server Uploads'}</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isEs 
                ? 'No tenemos servidores de almacenamiento ni bases de datos donde guardar tus documentos. No podemos ver ni copiar tus archivos.'
                : 'We have no storage servers or databases to hold your documents. We cannot view or copy your files.'}
            </p>
          </div>

          <div className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all">
            <div className="p-3 rounded-2xl bg-zinc-900 text-white border border-white/10 mb-4">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2 font-sans">{isEs ? 'Seguridad Profesional' : 'Professional Security'}</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isEs 
                ? 'Ideal para expedientes técnicos, presupuestos, firmas, contratos confidenciales y planillas sin riesgo de filtraciones.'
                : 'Ideal for technical dossiers, budgets, signatures, confidential contracts, and sheets without leakage risks.'}
            </p>
          </div>
        </div>

        {/* ARTÍCULO DETALLADO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '1. ¿Qué significa "Procesamiento 100% Local"?' : '1. What does "100% Local Processing" mean?'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'A diferencia de las herramientas convencionales de conversión que requieren enviar tus archivos a servidores en la nube para procesarlos, PDFBlack ejecuta todas las operaciones criptográficas, de manipulación de páginas y conversión dentro de tu propio navegador web (Google Chrome, Firefox, Safari, Edge, etc.).'
                : 'Unlike conventional conversion tools that require sending your files to cloud servers to process them, PDFBlack executes all cryptographic, page manipulation, and conversion operations directly inside your own web browser.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '2. Protección de Documentos Críticos y Confidenciales' : '2. Protection of Critical & Confidential Documents'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Sabemos que los profesionales manipulan planos estructurales, cronogramas de obras, planillas salariales, presupuestos detallados y firmas digitales. Con PDFBlack, puedes trabajar con la tranquilidad absoluta de que tu información cumple con las normativas más estrictas de protección de datos (GDPR y regulaciones locales), ya que tus datos nunca abandonan tu computadora o dispositivo móvil.'
                : 'We understand professionals manage structural blueprints, project schedules, payroll sheets, detailed budgets, and digital signatures. With PDFBlack, you can work with complete confidence that your information complies with strict data protection regulations (GDPR and local laws), as your data never leaves your computer or mobile device.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '3. Archivos Temporales y Caché del Navegador' : '3. Temporary Files & Browser Cache'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Cuando seleccionas un archivo en PDFBlack, este permanece únicamente en el estado local de la sesión de tu pestaña activa. En cuanto cierras o recargas la pestaña, cualquier rastro del archivo procesado se elimina automáticamente de la memoria RAM de tu navegador.'
                : 'When you select a file in PDFBlack, it remains solely in the active tab local state. As soon as you close or reload the tab, any trace of the processed file is automatically purged from your browser RAM.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '4. Cookies y Métricas de Uso Anónimas' : '4. Cookies & Anonymous Usage Analytics'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'No utilizamos cookies de seguimiento publicitario ni rastreamos la identidad de los usuarios. Únicamente guardamos en la memoria local de tu navegador (LocalStorage) tus preferencias de interfaz, como el idioma seleccionado (Español o Inglés).'
                : 'We do not use advertising tracking cookies nor trace user identities. We only store your interface preferences in local storage (LocalStorage), such as selected language (Spanish or English).'}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
