'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, HardDrive, Lock, Cpu, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PrivacidadPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-200 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO Y REGRESO */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isEs ? 'Garantía 100% Local' : '100% Local Guarantee'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-wider uppercase mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Lock className="w-3.5 h-3.5" />
            {isEs ? 'POLÍTICA DE PRIVACIDAD' : 'PRIVACY POLICY'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            {isEs ? 'Tus archivos nunca salen de tu dispositivo' : 'Your files never leave your device'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isEs 
              ? 'En PDFBlack la privacidad no es un compromiso comercial; es la arquitectura fundamental de nuestro software. Todo el procesamiento ocurre de forma local en la memoria RAM de tu propio navegador.'
              : 'At PDFBlack privacy is not a commercial commitment; it is the core architecture of our software. All processing takes place locally inside your browser RAM.'}
          </p>
        </motion.div>

        {/* 3 PILARES DE SEGURIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#0b1120]/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white mb-2">{isEs ? 'Procesamiento en RAM' : 'RAM-Only Processing'}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEs 
                ? 'Los PDF se leen y transforman usando bibliotecas de JavaScript locales (PDF.js, WebAssembly) directamente en tu memoria RAM.'
                : 'PDFs are read and transformed using local JavaScript libraries (PDF.js, WebAssembly) directly in your RAM memory.'}
            </p>
          </div>

          <div className="bg-[#0b1120]/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white mb-2">{isEs ? 'Cero Carga a Servidores' : 'Zero Server Uploads'}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEs 
                ? 'No tenemos servidores de almacenamiento ni bases de datos donde guardar tus documentos. No podemos ver ni copiar tus archivos.'
                : 'We have no storage servers or databases to hold your documents. We cannot view or copy your files.'}
            </p>
          </div>

          <div className="bg-[#0b1120]/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white mb-2">{isEs ? 'Seguridad Profesional' : 'Professional Security'}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEs 
                ? 'Ideal para expedientes técnicos, presupuestos, firmas, contratos confidenciales y planillas sin riesgo de filtraciones.'
                : 'Ideal for technical dossiers, budgets, signatures, confidential contracts, and sheets without leakage risks.'}
            </p>
          </div>
        </div>

        {/* ARTÍCULO DETALLADO */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              {isEs ? '1. ¿Qué significa "Procesamiento 100% Local"?' : '1. What does "100% Local Processing" mean?'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'A diferencia de las herramientas convencionales de conversión que requieren enviar tus archivos a servidores en la nube para procesarlos, PDFBlack ejecuta todas las operaciones criptográficas, de manipulación de páginas y conversión dentro de tu propio navegador web (Google Chrome, Firefox, Safari, Edge, etc.).'
                : 'Unlike conventional conversion tools that require sending your files to cloud servers to process them, PDFBlack executes all cryptographic, page manipulation, and conversion operations directly inside your own web browser.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {isEs ? '2. Protección de Documentos Críticos y Confidenciales' : '2. Protection of Critical & Confidential Documents'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Sabemos que los profesionales manipulan planos estructurales, cronogramas de obras, planillas salariales, presupuestos detallados y firmas digitales. Con PDFBlack, puedes trabajar con la tranquilidad absoluta de que tu información cumple con las normativas más estrictas de protección de datos (GDPR y regulaciones locales), ya que tus datos nunca abandonan tu computadora o dispositivo móvil.'
                : 'We understand professionals manage structural blueprints, project schedules, payroll sheets, detailed budgets, and digital signatures. With PDFBlack, you can work with complete confidence that your information complies with strict data protection regulations (GDPR and local laws), as your data never leaves your computer or mobile device.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              {isEs ? '3. Archivos Temporales y Caché del Navegador' : '3. Temporary Files & Browser Cache'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Cuando seleccionas un archivo en PDFBlack, este permanece únicamente en el estado local de la sesión de tu pestaña activa. En cuanto cierras o recargas la pestaña, cualquier rastro del archivo procesado se elimina automáticamente de la memoria RAM de tu navegador.'
                : 'When you select a file in PDFBlack, it remains solely in the active tab local state. As soon as you close or reload the tab, any trace of the processed file is automatically purged from your browser RAM.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-400" />
              {isEs ? '4. Cookies y Métricas de Uso Anónimas' : '4. Cookies & Anonymous Usage Analytics'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
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
