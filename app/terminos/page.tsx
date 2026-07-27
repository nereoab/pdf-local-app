'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, FileText, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TerminosPage() {
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
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <FileText className="w-3.5 h-3.5" />
            {isEs ? 'Vigencia 2026' : 'Effective 2026'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black tracking-wider uppercase mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <ShieldAlert className="w-3.5 h-3.5" />
            {isEs ? 'TÉRMINOS Y CONDICIONES DE USO' : 'TERMS AND CONDITIONS OF USE'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            {isEs ? 'Condiciones de uso del software PDFBlack' : 'PDFBlack software terms of use'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isEs 
              ? 'Bienvenido a PDFBlack. Al acceder o utilizar nuestras herramientas de manipulación de archivos PDF, aceptas estar sujeto a las siguientes reglas de uso y exenciones de responsabilidad.'
              : 'Welcome to PDFBlack. By accessing or using our PDF manipulation tools, you agree to be bound by the following rules of use and disclaimers.'}
          </p>
        </motion.div>

        {/* CONTENIDO DE TÉRMINOS */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              {isEs ? '1. Licencia de Uso y Provisión "Tal Cual"' : '1. License of Use & "As Is" Provision'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'PDFBlack se proporciona de forma gratuita y "tal cual" (AS IS), sin garantías explícitas o implícitas de ningún tipo respecto al rendimiento, comerciabilidad o idoneidad para un propósito específico. El software ejecuta código de procesamiento en el cliente dentro del navegador web del usuario.'
                : 'PDFBlack is provided free of charge and "AS IS", without express or implied warranties of any kind regarding performance, merchantability, or fitness for a specific purpose. The software executes client-side processing code directly in the user browser.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {isEs ? '2. Limitación de Responsabilidad' : '2. Limitation of Liability'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Bajo ninguna circunstancia los desarrolladores o propietarios de PDFBlack serán responsables por pérdidas indirectas, daños incidentales, corrupción de datos, archivos corruptos preexistentes o interrupción de flujos de trabajo derivados del uso o la imposibilidad de uso del software.'
                : 'Under no circumstances shall the developers or owners of PDFBlack be held liable for indirect losses, incidental damages, data corruption, pre-existing corrupt files, or workflow disruptions resulting from the use or inability to use the software.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {isEs ? '3. Responsabilidad del Usuario sobre el Contenido' : '3. User Responsibility for Content'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'El usuario declara ser el propietario legítimo o tener la autorización correspondiente para manipular, editar, firmar, desbloquear o convertir los archivos PDF procesados. Queda estrictamente prohibido utilizar la herramienta para desbloquear o manipular archivos de origen ilícito o sin la correspondiente propiedad intelectual.'
                : 'The user represents being the rightful owner or having authorization to manipulate, edit, sign, unlock, or convert processed PDF files. It is strictly prohibited to use the tool to unlock or alter documents of illegal origin or without proper intellectual property authorization.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              {isEs ? '4. Modificaciones a los Términos' : '4. Terms Modifications'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Nos reservamos el derecho de actualizar o cambiar estos Términos y Condiciones en cualquier momento sin previo aviso. La fecha de última actualización reflejada en esta página indicará la versión vigente.'
                : 'We reserve the right to update or modify these Terms and Conditions at any time without prior notice. The last updated date shown on this page reflects the current version.'}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
