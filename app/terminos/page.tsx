'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, FileText, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TerminosPage() {
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
            <FileText className="w-3.5 h-3.5 text-white" />
            {isEs ? 'Vigencia 2026' : 'Effective 2026'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            {isEs ? '008 / TÉRMINOS Y CONDICIONES' : '008 / TERMS AND CONDITIONS'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Condiciones de uso del software PDFBlack' : 'PDFBlack software terms of use'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs 
              ? 'Bienvenido a PDFBlack. Al acceder o utilizar nuestras herramientas de manipulación de archivos PDF, aceptas estar sujeto a las siguientes reglas de uso y exenciones de responsabilidad.'
              : 'Welcome to PDFBlack. By accessing or using our PDF manipulation tools, you agree to be bound by the following rules of use and disclaimers.'}
          </p>
        </motion.div>

        {/* CONTENIDO DE TÉRMINOS */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '1. Licencia de Uso y Provisión "Tal Cual"' : '1. License of Use & "As Is" Provision'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'PDFBlack se proporciona de forma gratuita y "tal cual" (AS IS), sin garantías explícitas o implícitas de ningún tipo respecto al rendimiento, comerciabilidad o idoneidad para un propósito específico. El software ejecuta código de procesamiento en el cliente dentro del navegador web del usuario.'
                : 'PDFBlack is provided free of charge and "AS IS", without express or implied warranties of any kind regarding performance, merchantability, or fitness for a specific purpose. The software executes client-side processing code directly in the user browser.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {isEs ? '2. Limitación de Responsabilidad' : '2. Limitation of Liability'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'Bajo ninguna circunstancia los desarrolladores o propietarios de PDFBlack serán responsables por pérdidas indirectas, daños incidentales, corrupción de datos, archivos corruptos preexistentes o interrupción de flujos de trabajo derivados del uso o la imposibilidad de uso del software.'
                : 'Under no circumstances shall the developers or owners of PDFBlack be held liable for indirect losses, incidental damages, data corruption, pre-existing corrupt files, or workflow disruptions resulting from the use or inability to use the software.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '3. Responsabilidad del Usuario sobre el Contenido' : '3. User Responsibility for Content'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs 
                ? 'El usuario declara ser el propietario legítimo o tener la autorización correspondiente para manipular, editar, firmar, desbloquear o convertir los archivos PDF procesados. Queda estrictamente prohibido utilizar la herramienta para desbloquear o manipular archivos de origen ilícito o sin la correspondiente propiedad intelectual.'
                : 'The user represents being the rightful owner or having authorization to manipulate, edit, sign, unlock, or convert processed PDF files. It is strictly prohibited to use the tool to unlock or alter documents of illegal origin or without proper intellectual property authorization.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? '4. Modificaciones a los Términos' : '4. Terms Modifications'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
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
