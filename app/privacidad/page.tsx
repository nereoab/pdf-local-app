'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Cpu, EyeOff, ArrowLeft, CheckCircle2, Globe, Fingerprint } from 'lucide-react';

export default function PrivacidadPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO Y REGRESO */}
        <div className="mb-8 flex items-center justify-between font-mono" role="navigation" aria-label={isEs ? 'Navegación de documento' : 'Document navigation'}>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            {isEs ? 'Última actualización: 2026' : 'Last updated: 2026'}
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            {isEs ? '007 / POLÍTICA DE PRIVACIDAD' : '007 / PRIVACY POLICY'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Política de Privacidad — Cumplimiento GDPR' : 'Privacy Policy — GDPR Compliance'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs 
              ? 'Fecha de entrada en vigor: 1 de enero de 2026. Esta política cumple con el Reglamento General de Protección de Datos (UE) 2016/679 (GDPR) y la Ley de Privacidad del Consumidor de California (CCPA/CPRA).'
              : 'Effective Date: January 1, 2026. This policy complies with the General Data Protection Regulation (EU) 2016/679 (GDPR) and the California Consumer Privacy Act (CCPA/CPRA).'}
          </p>
        </motion.div>

        {/* PILARES DE SEGURIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-mono">
          <article className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all" aria-labelledby="pillar-1-title">
            <div className="p-3 rounded-2xl bg-zinc-900 text-white border border-white/10 mb-4" aria-hidden="true">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 id="pillar-1-title" className="text-sm font-bold text-white mb-2 font-sans">{isEs ? 'Procesamiento en RAM' : 'RAM-Only Processing'}</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isEs 
                ? 'Los PDF se procesan exclusivamente en memoria RAM del navegador con bibliotecas locales (PDF.js, WebAssembly). Ningún dato se persiste en disco ni se transmite.'
                : 'PDFs are processed exclusively in browser RAM using local libraries (PDF.js, WebAssembly). No data persists on disk or is transmitted.'}
            </p>
          </article>

          <article className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all" aria-labelledby="pillar-2-title">
            <div className="p-3 rounded-2xl bg-zinc-900 text-emerald-400 border border-white/10 mb-4" aria-hidden="true">
              <EyeOff className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 id="pillar-2-title" className="text-sm font-bold text-white mb-2 font-sans">{isEs ? 'Cero Retención de Archivos' : 'Zero File Retention'}</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isEs 
                ? 'No operamos servidores de almacenamiento. Los archivos PDF se destruyen de la RAM al cerrar la pestaña del navegador. No mantenemos copias.'
                : 'We operate no storage servers. PDF files are destroyed from RAM upon closing the browser tab. We keep no copies.'}
            </p>
          </article>

          <article className="bg-[#09090b] border border-white/10 hover:border-white/30 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all" aria-labelledby="pillar-3-title">
            <div className="p-3 rounded-2xl bg-zinc-900 text-white border border-white/10 mb-4" aria-hidden="true">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <h3 id="pillar-3-title" className="text-sm font-bold text-white mb-2 font-sans">{isEs ? 'Identidad del Responsable' : 'Data Controller Identity'}</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isEs 
                ? 'El responsable del tratamiento es PDFBlack. Para ejercer tus derechos ARCO (acceso, rectificación, cancelación, oposición), contacta a privacidad@pdfblack.com.'
                : 'The data controller is PDFBlack. To exercise your GDPR rights (access, rectification, erasure, restriction, portability, objection), contact privacy@pdfblack.com.'}
            </p>
          </article>
        </div>

        {/* CONTENIDO LEGAL DETALLADO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans" role="article" aria-label={isEs ? 'Texto completo de la política de privacidad' : 'Full privacy policy text'}>
          
          <section className="space-y-3" aria-labelledby="sec-1">
            <h2 id="sec-1" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '1. Responsable del Tratamiento' : '1. Data Controller'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El responsable del tratamiento de los datos personales recabados a través de este sitio web es PDFBlack. Puedes contactarnos en cualquier momento a través del correo electrónico privacidad@pdfblack.com o mediante el formulario de contacto disponible en la página /contacto.'
                : 'The data controller for personal data collected through this website is PDFBlack. You can contact us at any time via email at privacy@pdfblack.com or through the contact form on the /contacto page.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-2">
            <h2 id="sec-2" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '2. Datos que Recopilamos y Base Legal' : '2. Data We Collect and Legal Basis'}
            </h2>
            <div className="space-y-3 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                <strong className="text-white">
                  {isEs ? '2.1 Datos de registro (base legal: consentimiento explícito, Art. 6(1)(a) GDPR):' : '2.1 Registration data (legal basis: explicit consent, Art. 6(1)(a) GDPR):'}
                </strong>
                {' '}
                {isEs
                  ? 'Al crear una cuenta opcional, almacenamos tu dirección de correo electrónico y una contraseña generada aleatoriamente en el almacenamiento local de tu navegador (LocalStorage). Estos datos nunca se transmiten a nuestros servidores. Puedes eliminar tu cuenta en cualquier momento cerrando sesión.'
                  : 'When creating an optional account, we store your email address and a randomly generated password in your browser local storage (LocalStorage). This data is never transmitted to our servers. You can delete your account at any time by logging out.'}
              </p>
              <p>
                <strong className="text-white">
                  {isEs ? '2.2 Datos técnicos (base legal: interés legítimo, Art. 6(1)(f) GDPR):' : '2.2 Technical data (legal basis: legitimate interest, Art. 6(1)(f) GDPR):'}
                </strong>
                {' '}
                {isEs
                  ? 'No recolectamos direcciones IP, huellas digitales del navegador, ni metadatos de los archivos PDF que procesas. No utilizamos servicios de analítica web que rastreen tu actividad. Todo el procesamiento PDF es 100% local en tu navegador y no abandona tu dispositivo.'
                  : 'We do not collect IP addresses, browser fingerprints, or metadata from PDF files you process. We do not use web analytics services that track your activity. All PDF processing is 100% local in your browser and never leaves your device.'}
              </p>
              <p>
                <strong className="text-white">
                  {isEs ? '2.3 Cookies y almacenamiento local (base legal: consentimiento, Art. 6(1)(a) GDPR):' : '2.3 Cookies and local storage (legal basis: consent, Art. 6(1)(a) GDPR):'}
                </strong>
                {' '}
                {isEs
                  ? 'Utilizamos exclusivamente LocalStorage para almacenar preferencias de usuario (idioma, tema) y estado de sesión. No utilizamos cookies de seguimiento, publicitarias ni de terceros. Al aceptar nuestro banner de cookies, consientes el uso de almacenamiento local para fines funcionales.'
                  : 'We exclusively use LocalStorage to store user preferences (language, theme) and session state. We do not use tracking, advertising, or third-party cookies. By accepting our cookie banner, you consent to the use of local storage for functional purposes.'}
              </p>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-3">
            <h2 id="sec-3" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '3. Procesamiento de Archivos PDF — Cero Transmisión' : '3. PDF File Processing — Zero Transmission'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'PDFBlack ejecuta todas las operaciones de manipulación, edición, conversión, compresión, firma, OCR, y cifrado de archivos PDF exclusivamente dentro del motor JavaScript de tu navegador web (Google Chrome, Firefox, Safari, Edge, etc.) utilizando Web Workers, WebAssembly (WASM), y la API Web Crypto. Tus archivos PDF: (a) no se suben a ningún servidor; (b) no se almacenan en ninguna base de datos externa; (c) no son accesibles por ningún empleado, contratista o tercero; (d) se eliminan automáticamente de la memoria RAM al cerrar o recargar la pestaña del navegador. La excepción única es el servicio de firma digital con certificado PKCS#12, que requiere procesamiento en servidor para operaciones criptográficas con node-forge. En este caso, el archivo se procesa efímeramente y no se almacena.'
                : 'PDFBlack performs all PDF manipulation, editing, conversion, compression, signing, OCR, and encryption operations exclusively within your web browser JavaScript engine (Google Chrome, Firefox, Safari, Edge, etc.) using Web Workers, WebAssembly (WASM), and the Web Crypto API. Your PDF files: (a) are not uploaded to any server; (b) are not stored in any external database; (c) are not accessible by any employee, contractor, or third party; (d) are automatically purged from RAM upon closing or reloading the browser tab. The sole exception is the digital signature service with PKCS#12 certificates, which requires server-side processing via node-forge. In this case, the file is processed ephemerally and not stored.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-4">
            <h2 id="sec-4" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '4. Derechos del Usuario bajo GDPR' : '4. User Rights under GDPR'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Como usuario, tienes los siguientes derechos bajo el GDPR: Derecho de acceso (Art. 15), Derecho de rectificación (Art. 16), Derecho de supresión (Art. 17), Derecho a la limitación del tratamiento (Art. 18), Derecho a la portabilidad de los datos (Art. 20), y Derecho de oposición (Art. 21). Dado que PDFBlack no almacena datos personales en servidores (excepto el correo electrónico en tu LocalStorage local), la mayoría de estos derechos se ejercen automáticamente al cerrar sesión o limpiar el almacenamiento local de tu navegador. Para cualquier solicitud formal, escribe a privacidad@pdfblack.com. Responderemos en un plazo máximo de 30 días naturales.'
                : 'As a user, you have the following rights under GDPR: Right of access (Art. 15), Right to rectification (Art. 16), Right to erasure (Art. 17), Right to restriction of processing (Art. 18), Right to data portability (Art. 20), and Right to object (Art. 21). Since PDFBlack does not store personal data on servers (except your email in local browser LocalStorage), most of these rights are exercised automatically by logging out or clearing your browser local storage. For any formal request, write to privacy@pdfblack.com. We will respond within 30 calendar days.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-5">
            <h2 id="sec-5" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '5. Seguridad de los Datos — Medidas Técnicas y Organizativas' : '5. Data Security — Technical and Organizational Measures'}
            </h2>
            <div className="space-y-3 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                {isEs
                  ? 'PDFBlack implementa las siguientes medidas técnicas de seguridad:'
                  : 'PDFBlack implements the following technical security measures:'}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm" aria-label={isEs ? 'Lista de medidas de seguridad' : 'List of security measures'}>
                <li>{isEs ? 'Cifrado AES-256 para protección de PDFs según ISO 32000-2:2020 (PDF 2.0).' : 'AES-256 encryption for PDF protection per ISO 32000-2:2020 (PDF 2.0).'}</li>
                <li>{isEs ? 'Procesamiento exclusivo en RAM sin persistencia en disco.' : 'RAM-only processing with no disk persistence.'}</li>
                <li>{isEs ? 'Comunicaciones exclusivamente mediante HTTPS/TLS 1.3.' : 'Communications exclusively via HTTPS/TLS 1.3.'}</li>
                <li>{isEs ? 'Headers de seguridad HTTP: Content-Security-Policy, X-Frame-Options, HSTS, X-Content-Type-Options.' : 'HTTP security headers: Content-Security-Policy, X-Frame-Options, HSTS, X-Content-Type-Options.'}</li>
                <li>{isEs ? 'Aislamiento de procesos en Web Workers (sin acceso al DOM principal).' : 'Process isolation via Web Workers (no access to main DOM).'}</li>
                <li>{isEs ? 'Censura binaria real (eliminación física del código del documento).' : 'True binary redaction (physical removal from document code).'}</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-6">
            <h2 id="sec-6" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '6. Transferencias Internacionales de Datos' : '6. International Data Transfers'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'PDFBlack no transfiere datos personales fuera del dispositivo del usuario, excepto en el caso del servicio de firma digital. El procesamiento de archivos PDF ocurre 100% en el navegador del usuario, independientemente de su ubicación geográfica. No utilizamos proveedores de nube para el procesamiento de documentos.'
                : 'PDFBlack does not transfer personal data outside the user device, except for the digital signature service. PDF file processing occurs 100% in the user browser, regardless of geographic location. We do not use cloud providers for document processing.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-7">
            <h2 id="sec-7" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Globe className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '7. CCPA/CPRA — Derechos de Privacidad en California' : '7. CCPA/CPRA — California Privacy Rights'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Los residentes de California tienen derecho a: (a) conocer qué información personal se recopila; (b) solicitar la eliminación de datos; (c) optar por no participar en la venta de datos. PDFBlack no vende, alquila ni comparte información personal con terceros. Dado que no recolectamos identificadores personales (excepto correo electrónico en registro opcional), cumplimos automáticamente con estos derechos.'
                : 'California residents have the right to: (a) know what personal information is collected; (b) request deletion of data; (c) opt out of data sales. PDFBlack does not sell, rent, or share personal information with third parties. As we do not collect personal identifiers (except email for optional registration), we automatically comply with these rights.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="sec-8">
            <h2 id="sec-8" className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '8. Cambios a esta Política' : '8. Changes to This Policy'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Los cambios serán efectivos inmediatamente después de su publicación en esta página. La fecha de última actualización se refleja al inicio de este documento. Recomendamos revisar esta página periódicamente.'
                : 'We reserve the right to modify this privacy policy at any time. Changes will be effective immediately upon posting on this page. The last updated date is reflected at the beginning of this document. We recommend reviewing this page periodically.'}
            </p>
          </section>

        </div>

        {/* ENLACES A DOCUMENTOS RELACIONADOS */}
        <div className="mt-10 text-center font-mono">
          <p className="text-zinc-500 text-xs mb-3">
            {isEs ? 'Documentos legales relacionados:' : 'Related legal documents:'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/terminos" className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all">
              {isEs ? 'Términos y Condiciones' : 'Terms & Conditions'}
            </Link>
            <Link href="/aviso-legal" className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all">
              {isEs ? 'Aviso Legal' : 'Legal Notice'}
            </Link>
            <Link href="/dpa" className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all">
              {isEs ? 'DPA (Acuerdo de Procesamiento)' : 'DPA (Data Processing Agreement)'}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}