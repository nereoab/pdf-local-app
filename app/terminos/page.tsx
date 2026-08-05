'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Info,
} from 'lucide-react';

export default function TerminosPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div
          className="mb-8 flex items-center justify-between font-mono"
          role="navigation"
          aria-label={isEs ? 'Navegación de documento' : 'Document navigation'}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-full border border-white/10 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            {isEs ? 'Vigencia 2026' : 'Effective 2026'}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 font-mono"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <ShieldAlert className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            {isEs ? '008 / TÉRMINOS Y CONDICIONES' : '008 / TERMS AND CONDITIONS'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Términos y Condiciones de Uso' : 'Terms and Conditions of Use'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs
              ? 'Bienvenido a PDFBlack. Al acceder o utilizar nuestras herramientas de manipulación de archivos PDF, aceptas estar sujeto a las siguientes reglas de uso y exenciones de responsabilidad. Si no estás de acuerdo, no utilices el servicio.'
              : 'Welcome to PDFBlack. By accessing or using our PDF manipulation tools, you agree to be bound by the following rules of use and disclaimers. If you do not agree, do not use the service.'}
          </p>
        </motion.div>

        <div
          className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans"
          role="article"
          aria-label={isEs ? 'Términos y condiciones completos' : 'Full terms and conditions'}
        >
          <section className="space-y-3" aria-labelledby="terms-1">
            <h2
              id="terms-1"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '1. Aceptación de los Términos' : '1. Acceptance of Terms'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El acceso y uso del sitio web pdf-black.com (en adelante, "el Sitio") y de cualquiera de sus herramientas de procesamiento de archivos PDF (en adelante, "el Servicio") atribuye la condición de usuario y implica la aceptación plena y sin reservas de todas las disposiciones incluidas en estos Términos y Condiciones, en la Política de Privacidad, en el Aviso Legal, y en el Acuerdo de Procesamiento de Datos (DPA).'
                : 'Access and use of the website pdf-black.com (hereinafter, "the Site") and any of its PDF file processing tools (hereinafter, "the Service") confers the status of user and implies full and unreserved acceptance of all provisions included in these Terms and Conditions, the Privacy Policy, the Legal Notice, and the Data Processing Agreement (DPA).'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-2">
            <h2
              id="terms-2"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <Scale className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '2. Licencia de Uso y Provisión "Tal Cual" (AS IS)'
                : '2. License of Use & "As Is" Provision'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'PDFBlack se proporciona de forma gratuita y "tal cual" (AS IS), sin garantías explícitas o implícitas de ningún tipo respecto al rendimiento, comerciabilidad, idoneidad para un propósito específico, o no infracción de derechos de terceros. El software ejecuta código de procesamiento en el cliente dentro del navegador web del usuario. PDFBlack no garantiza que el Servicio sea ininterrumpido, seguro o libre de errores, ni que los defectos sean corregidos.'
                : 'PDFBlack is provided free of charge and "AS IS", without express or implied warranties of any kind regarding performance, merchantability, fitness for a specific purpose, or non-infringement of third-party rights. The software executes client-side processing code directly in the user web browser. PDFBlack does not warrant that the Service will be uninterrupted, secure, or error-free, or that defects will be corrected.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-3">
            <h2
              id="terms-3"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
              {isEs ? '3. Limitación de Responsabilidad' : '3. Limitation of Liability'}
            </h2>
            <div className="space-y-2 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                {isEs
                  ? 'Bajo ninguna circunstancia los desarrolladores, propietarios, administradores o afiliados de PDFBlack serán responsables por:'
                  : 'Under no circumstances shall the developers, owners, administrators, or affiliates of PDFBlack be held liable for:'}
              </p>
              <ul
                className="list-disc pl-5 space-y-1 text-xs sm:text-sm"
                aria-label={
                  isEs ? 'Lista de exclusiones de responsabilidad' : 'List of liability exclusions'
                }
              >
                <li>
                  {isEs
                    ? 'Pérdidas indirectas, daños incidentales, especiales, punitivos o consecuentes.'
                    : 'Indirect, incidental, special, punitive, or consequential damages.'}
                </li>
                <li>
                  {isEs
                    ? 'Corrupción de datos o archivos corruptos preexistentes.'
                    : 'Data corruption or pre-existing corrupt files.'}
                </li>
                <li>
                  {isEs
                    ? 'Interrupción de flujos de trabajo o pérdida de productividad.'
                    : 'Workflow disruption or loss of productivity.'}
                </li>
                <li>
                  {isEs
                    ? 'Pérdida de beneficios, ingresos, datos, fondo de comercio o ahorros anticipados.'
                    : 'Loss of profits, revenue, data, goodwill, or anticipated savings.'}
                </li>
                <li>
                  {isEs
                    ? 'Daños resultantes de la imposibilidad de uso del Servicio.'
                    : 'Damages resulting from the inability to use the Service.'}
                </li>
                <li>
                  {isEs
                    ? 'Reclamaciones de terceros relacionadas con el contenido de los archivos procesados.'
                    : 'Third-party claims related to the content of processed files.'}
                </li>
              </ul>
              <p className="text-zinc-500 text-[11px] italic mt-2">
                {isEs
                  ? 'Algunas jurisdicciones no permiten la exclusión de garantías implícitas o la limitación de daños incidentales. En dichos casos, las exclusiones y limitaciones anteriores pueden no aplicarse en su totalidad.'
                  : 'Some jurisdictions do not allow the exclusion of implied warranties or the limitation of incidental damages. In such cases, the above exclusions and limitations may not fully apply.'}
              </p>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-4">
            <h2
              id="terms-4"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '4. Responsabilidad del Usuario sobre el Contenido'
                : '4. User Responsibility for Content'}
            </h2>
            <div className="space-y-2 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                {isEs
                  ? 'El usuario declara y garantiza que:'
                  : 'The user represents and warrants that:'}
              </p>
              <ul
                className="list-disc pl-5 space-y-1 text-xs sm:text-sm"
                aria-label={isEs ? 'Declaraciones del usuario' : 'User representations'}
              >
                <li>
                  {isEs
                    ? 'Es el propietario legítimo o tiene la autorización correspondiente para manipular, editar, firmar, desbloquear o convertir los archivos PDF procesados.'
                    : 'Is the rightful owner or has proper authorization to manipulate, edit, sign, unlock, or convert processed PDF files.'}
                </li>
                <li>
                  {isEs
                    ? 'No utilizará el Servicio para desbloquear o manipular archivos de origen ilícito o sin la correspondiente autorización de propiedad intelectual.'
                    : 'Will not use the Service to unlock or manipulate files of illegal origin or without proper intellectual property authorization.'}
                </li>
                <li>
                  {isEs
                    ? 'No utilizará el Servicio para procesar material ilegal, difamatorio, obsceno, o que viole derechos de terceros.'
                    : 'Will not use the Service to process illegal, defamatory, obscene material, or content that violates third-party rights.'}
                </li>
                <li>
                  {isEs
                    ? 'Es responsable de mantener copias de seguridad de sus archivos originales antes de procesarlos.'
                    : 'Is responsible for maintaining backups of original files before processing.'}
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-5">
            <h2
              id="terms-5"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <Info className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '5. Propiedad Intelectual del Servicio'
                : '5. Intellectual Property of the Service'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El código fuente, diseño, logotipos, marcas, nombres de dominio, y cualquier otro elemento del Servicio son propiedad exclusiva de PDFBlack y están protegidos por las leyes de propiedad intelectual e industrial aplicables. Queda prohibida la copia, modificación, distribución, ingeniería inversa, descompilación, o cualquier otra actividad no autorizada expresamente por escrito. El usuario no adquiere ningún derecho de propiedad sobre el Servicio por el mero uso del mismo.'
                : 'The source code, design, logos, trademarks, domain names, and any other elements of the Service are the exclusive property of PDFBlack and are protected by applicable intellectual and industrial property laws. Copying, modification, distribution, reverse engineering, decompilation, or any other activity not expressly authorized in writing is prohibited. The user acquires no ownership rights over the Service by mere use thereof.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-6">
            <h2
              id="terms-6"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '6. Servicios de Terceros' : '6. Third-Party Services'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El Servicio puede incluir bibliotecas de código abierto y dependencias de terceros (PDF.js, pdf-lib, Tesseract WASM, node-forge, Syncfusion, etc.) que se rigen por sus propias licencias. PDFBlack no asume responsabilidad por el funcionamiento o posibles vulnerabilidades de dichas bibliotecas de terceros. El usuario acepta que el uso de estas bibliotecas está sujeto a sus respectivos términos de licencia.'
                : 'The Service may include open-source libraries and third-party dependencies (PDF.js, pdf-lib, Tesseract WASM, node-forge, Syncfusion, etc.) governed by their own licenses. PDFBlack assumes no responsibility for the operation or potential vulnerabilities of such third-party libraries. The user agrees that the use of these libraries is subject to their respective license terms.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-7">
            <h2
              id="terms-7"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '7. Indemnización' : '7. Indemnification'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El usuario se compromete a indemnizar y eximir de responsabilidad a PDFBlack, sus propietarios, desarrolladores, y afiliados frente a cualquier reclamación, daño, pérdida, o gasto (incluidos honorarios legales razonables) que surja del uso indebido del Servicio por parte del usuario, de la violación de estos Términos, o de la infracción de derechos de terceros mediante los archivos procesados.'
                : 'The user agrees to indemnify and hold harmless PDFBlack, its owners, developers, and affiliates from any claim, damage, loss, or expense (including reasonable legal fees) arising from the user misuse of the Service, violation of these Terms, or infringement of third-party rights through processed files.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-8">
            <h2
              id="terms-8"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <Info className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '8. Ley Aplicable y Jurisdicción' : '8. Governing Law and Jurisdiction'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Estos Términos y Condiciones se rigen e interpretan de conformidad con la legislación española. Para la resolución de cualquier controversia que pudiera derivarse del acceso o uso del Servicio, las partes se someten, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, a los Juzgados y Tribunales de la ciudad de Madrid, España. Esta cláusula no afecta a los derechos irrenunciables que la legislación vigente reconoce a los consumidores.'
                : 'These Terms and Conditions are governed by and construed in accordance with Spanish law. For the resolution of any dispute that may arise from access or use of the Service, the parties submit, with express waiver of any other jurisdiction that may correspond to them, to the Courts and Tribunals of the city of Madrid, Spain. This clause does not affect the non-waivable rights recognized by current legislation to consumers.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-9">
            <h2
              id="terms-9"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '9. Modificaciones a los Términos' : '9. Modifications to the Terms'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'PDFBlack se reserva el derecho de actualizar, modificar o reemplazar estos Términos y Condiciones en cualquier momento sin previo aviso. La fecha de última actualización reflejada en esta página indicará la versión vigente. El uso continuado del Servicio después de la publicación de cambios constituye la aceptación de los nuevos términos. Se recomienda al usuario revisar periódicamente esta página.'
                : 'PDFBlack reserves the right to update, modify, or replace these Terms and Conditions at any time without prior notice. The last updated date shown on this page reflects the current version. Continued use of the Service after the posting of changes constitutes acceptance of the new terms. Users are advised to periodically review this page.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="terms-10">
            <h2
              id="terms-10"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '10. Contacto' : '10. Contact'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Para cualquier pregunta, reclamación o consulta relacionada con estos Términos y Condiciones, puedes contactarnos a través del correo electrónico contacto@pdf-black.com o mediante el formulario de contacto disponible en la página /contacto del Sitio.'
                : 'For any questions, claims, or inquiries related to these Terms and Conditions, you can contact us via email at contacto@pdf-black.com or through the contact form available on the /contacto page of the Site.'}
            </p>
          </section>
        </div>

        {/* ENLACES RELACIONADOS */}
        <div className="mt-10 text-center font-mono">
          <p className="text-zinc-500 text-xs mb-3">
            {isEs ? 'Documentos legales relacionados:' : 'Related legal documents:'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/privacidad"
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all"
            >
              {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
            </Link>
            <Link
              href="/aviso-legal"
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all"
            >
              {isEs ? 'Aviso Legal' : 'Legal Notice'}
            </Link>
            <Link
              href="/dpa"
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all"
            >
              {isEs ? 'DPA (Acuerdo de Procesamiento)' : 'DPA (Data Processing Agreement)'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
