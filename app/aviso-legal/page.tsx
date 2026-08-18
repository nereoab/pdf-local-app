'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, ShieldCheck, FileText } from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

export default function AvisoLegalPage() {
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
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            {isEs ? 'Conforme a Ley 34/2002' : 'Per Law 34/2002 (LSSI-CE)'}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 font-mono"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <Globe className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            {isEs ? '009 / AVISO LEGAL' : '009 / LEGAL NOTICE'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Aviso Legal — LSSI-CE' : 'Legal Notice — Information Society Services'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs
              ? 'En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa al usuario de los siguientes datos generales del sitio web.'
              : 'In compliance with Law 34/2002, of July 11, on Information Society Services and Electronic Commerce (LSSI-CE), the user is informed of the following general website details.'}
          </p>
        </motion.div>

        {/* CONTENIDO LEGAL */}
        <SpotlightCard
          className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans"
          role="article"
          aria-label={isEs ? 'Aviso legal completo' : 'Full legal notice'}
        >
          <section className="space-y-3" aria-labelledby="legal-1">
            <h2
              id="legal-1"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '1. Titularidad del Sitio Web' : '1. Website Ownership'}
            </h2>
            <div className="space-y-2 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                {isEs
                  ? 'El presente sitio web, accesible a través del nombre de dominio pdf-black.com, es titularidad de PDFBlack.'
                  : 'This website, accessible through the domain name pdf-black.com, is owned by PDFBlack.'}
              </p>
              <ul
                className="list-disc pl-5 space-y-1 text-xs sm:text-sm"
                aria-label={isEs ? 'Datos del titular' : 'Owner details'}
              >
                <li>{isEs ? 'Denominación comercial: PDFBlack' : 'Trade name: PDFBlack'}</li>
                <li>
                  {isEs
                    ? 'Correo electrónico de contacto: contacto@pdf-black.com'
                    : 'Contact email: contacto@pdf-black.com'}
                </li>
                <li>
                  {isEs
                    ? 'Actividad: Herramientas de procesamiento de archivos PDF en línea'
                    : 'Activity: Online PDF file processing tools'}
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="legal-2">
            <h2
              id="legal-2"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '2. Condiciones Generales de Uso' : '2. General Terms of Use'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El acceso y uso de este sitio web atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal, en los Términos y Condiciones, y en la Política de Privacidad. El usuario se compromete a utilizar el sitio web, sus servicios y contenidos de conformidad con la ley, la moral, el orden público y las presentes condiciones.'
                : 'Access and use of this website confers the status of user and implies full and unreserved acceptance of all provisions included in this Legal Notice, the Terms and Conditions, and the Privacy Policy. The user undertakes to use the website, its services, and contents in accordance with the law, morality, public order, and these conditions.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="legal-3">
            <h2
              id="legal-3"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '3. Propiedad Intelectual e Industrial'
                : '3. Intellectual and Industrial Property'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Todos los contenidos del sitio web (textos, gráficos, imágenes, diseño, código fuente, estructura de navegación, bases de datos, y demás elementos) son propiedad exclusiva de PDFBlack o de terceros que han autorizado su uso. Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otra actividad no autorizada expresamente por escrito. PDFBlack y su logotipo son marcas registradas. El nombre de dominio pdf-black.com es propiedad exclusiva de PDFBlack.'
                : 'All website content (texts, graphics, images, design, source code, navigation structure, databases, and other elements) is the exclusive property of PDFBlack or third parties who have authorized their use. Reproduction, distribution, public communication, transformation, or any other activity not expressly authorized in writing is prohibited. PDFBlack and its logo are registered trademarks. The domain name pdf-black.com is the exclusive property of PDFBlack.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="legal-4">
            <h2
              id="legal-4"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '4. Legislación Aplicable y Jurisdicción'
                : '4. Applicable Law and Jurisdiction'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia que pudiera derivarse del acceso o uso de este sitio web, PDFBlack y el usuario se someten, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, a los Juzgados y Tribunales de la ciudad de Madrid, España. Esta cláusula no afecta a los derechos que la legislación vigente reconoce al consumidor.'
                : 'These conditions are governed by Spanish law. For the resolution of any dispute that may arise from access or use of this website, PDFBlack and the user submit, with express waiver of any other jurisdiction that may correspond to them, to the Courts and Tribunals of the city of Madrid, Spain. This clause does not affect the rights recognized by current legislation to the consumer.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="legal-5">
            <h2
              id="legal-5"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '5. Exclusión de Garantías y Responsabilidad'
                : '5. Exclusion of Warranties and Liability'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'PDFBlack no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal, transmisión de virus o programas maliciosos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo. El servicio de herramientas PDF se proporciona "tal cual" (AS IS), sin garantías de ningún tipo. El usuario es el único responsable del uso que haga de los archivos procesados y de cumplir con la legislación de propiedad intelectual aplicable.'
                : 'PDFBlack is not responsible, under any circumstances, for damages of any nature that may be caused by, including but not limited to: errors or omissions in the content, lack of portal availability, transmission of viruses or malicious programs in the content, despite having adopted all necessary technological measures to avoid it. The PDF tools service is provided "AS IS", without warranties of any kind. The user is solely responsible for the use made of processed files and for complying with applicable intellectual property legislation.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="legal-6">
            <h2
              id="legal-6"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '6. Política de Enlaces (Links)' : '6. Links Policy'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El sitio web puede contener enlaces a sitios web de terceros. PDFBlack no asume ninguna responsabilidad sobre el contenido, políticas de privacidad o prácticas de sitios de terceros. La inclusión de enlaces no implica la aprobación, respaldo o recomendación de dichos sitios por parte de PDFBlack.'
                : 'The website may contain links to third-party websites. PDFBlack assumes no responsibility for the content, privacy policies, or practices of third-party sites. The inclusion of links does not imply approval, endorsement, or recommendation of such sites by PDFBlack.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="legal-7">
            <h2
              id="legal-7"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '7. Protección de Datos Personales' : '7. Personal Data Protection'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'De conformidad con el Reglamento General de Protección de Datos (GDPR) y la Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales (LOPDGDD), toda la información relativa al tratamiento de datos personales se encuentra detallada en nuestra Política de Privacidad, accesible desde el pie de página de este sitio web.'
                : 'In accordance with the General Data Protection Regulation (GDPR) and applicable data protection laws, all information relating to the processing of personal data is detailed in our Privacy Policy, accessible from the footer of this website.'}
            </p>
          </section>
        </SpotlightCard>

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
              href="/terminos"
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all"
            >
              {isEs ? 'Términos y Condiciones' : 'Terms & Conditions'}
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
