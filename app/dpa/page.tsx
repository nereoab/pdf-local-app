'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, FileText, ClipboardCheck, Download } from 'lucide-react';

export default function DPAPage() {
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
            <Download className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            {isEs ? 'Descargable como PDF' : 'Downloadable as PDF'}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 font-mono"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <ClipboardCheck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            {isEs
              ? '010 / ACUERDO DE PROCESAMIENTO DE DATOS (DPA)'
              : '010 / DATA PROCESSING AGREEMENT (DPA)'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? 'Acuerdo de Procesamiento de Datos' : 'Data Processing Agreement'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            {isEs
              ? 'Conforme al Artículo 28 del Reglamento General de Protección de Datos (UE) 2016/679 (GDPR). Este DPA es vinculante para todos los usuarios que utilicen PDFBlack para procesar datos personales contenidos en archivos PDF.'
              : 'Pursuant to Article 28 of the General Data Protection Regulation (EU) 2016/679 (GDPR). This DPA is binding for all users who use PDFBlack to process personal data contained in PDF files.'}
          </p>
        </motion.div>

        <div
          className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans"
          role="article"
          aria-label={
            isEs ? 'Acuerdo de procesamiento de datos completo' : 'Full data processing agreement'
          }
        >
          <section className="space-y-3" aria-labelledby="dpa-1">
            <h2
              id="dpa-1"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '1. Partes del Acuerdo' : '1. Parties to the Agreement'}
            </h2>
            <div className="space-y-2 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                <strong className="text-white">
                  {isEs ? 'Responsable del Tratamiento (Data Controller):' : 'Data Controller:'}
                </strong>{' '}
                {isEs
                  ? 'El usuario de PDFBlack que carga, procesa, o manipula archivos PDF que contienen datos personales.'
                  : 'The PDFBlack user who uploads, processes, or manipulates PDF files containing personal data.'}
              </p>
              <p>
                <strong className="text-white">
                  {isEs ? 'Encargado del Tratamiento (Data Processor):' : 'Data Processor:'}
                </strong>{' '}
                {isEs
                  ? 'PDFBlack, proveedor del servicio de herramientas de procesamiento de PDF en línea.'
                  : 'PDFBlack, provider of the online PDF processing tools service.'}
              </p>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-2">
            <h2
              id="dpa-2"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '2. Objeto y Naturaleza del Tratamiento'
                : '2. Subject Matter and Nature of Processing'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El objeto de este DPA es regular el tratamiento de datos personales que el Responsable introduce en la plataforma PDFBlack. La naturaleza del tratamiento es exclusivamente técnica y automatizada: edición, organización, conversión, compresión, firma digital, OCR, y cifrado de archivos PDF. Todas las operaciones de tratamiento se ejecutan de forma local en el navegador del usuario (cliente), sin transmisión a servidores externos, con la única excepción del servicio de firma digital PKCS#12 que requiere procesamiento efímero en servidor.'
                : 'The purpose of this DPA is to regulate the processing of personal data that the Controller introduces into the PDFBlack platform. The nature of the processing is exclusively technical and automated: editing, organization, conversion, compression, digital signing, OCR, and encryption of PDF files. All processing operations are executed locally in the user browser (client-side), without transmission to external servers, with the sole exception of the PKCS#12 digital signature service which requires ephemeral server-side processing.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-3">
            <h2
              id="dpa-3"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '3. Duración del Tratamiento' : '3. Duration of Processing'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El tratamiento de datos personales tiene una duración igual a la sesión activa del navegador del usuario. Al cerrar o recargar la pestaña, todos los datos se eliminan automáticamente de la memoria RAM. PDFBlack no conserva, archiva, ni realiza copias de seguridad de los archivos PDF procesados. La excepción de firma digital conlleva un tratamiento efímero menor a 60 segundos sin almacenamiento posterior.'
                : 'The processing of personal data lasts for the duration of the user active browser session. Upon closing or reloading the tab, all data is automatically purged from RAM. PDFBlack does not retain, archive, or back up processed PDF files. The digital signature exception involves ephemeral processing of less than 60 seconds without subsequent storage.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-4">
            <h2
              id="dpa-4"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '4. Medidas Técnicas y Organizativas de Seguridad'
                : '4. Technical and Organizational Security Measures'}
            </h2>
            <div className="space-y-2 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                {isEs
                  ? 'PDFBlack implementa las siguientes medidas técnicas y organizativas para garantizar la seguridad de los datos personales tratados, de conformidad con el Artículo 32 del GDPR:'
                  : 'PDFBlack implements the following technical and organizational measures to ensure the security of processed personal data, in accordance with Article 32 of the GDPR:'}
              </p>
              <ul
                className="list-disc pl-5 space-y-1 text-xs sm:text-sm"
                aria-label={
                  isEs ? 'Medidas de seguridad implementadas' : 'Implemented security measures'
                }
              >
                <li>
                  {isEs
                    ? 'Procesamiento 100% local en RAM del navegador (sin persistencia en disco ni transmisión a servidores).'
                    : '100% local processing in browser RAM (no disk persistence or server transmission).'}
                </li>
                <li>
                  {isEs
                    ? 'Cifrado AES-256 conforme a ISO 32000-2:2020 para protección de archivos PDF.'
                    : 'AES-256 encryption per ISO 32000-2:2020 for PDF file protection.'}
                </li>
                <li>
                  {isEs
                    ? 'Aislamiento de procesos mediante Web Workers (sin acceso al DOM principal ni a otras pestañas).'
                    : 'Process isolation via Web Workers (no access to main DOM or other tabs).'}
                </li>
                <li>
                  {isEs
                    ? 'Comunicaciones HTTPS/TLS 1.3 con HSTS y Content Security Policy.'
                    : 'HTTPS/TLS 1.3 communications with HSTS and Content Security Policy.'}
                </li>
                <li>
                  {isEs
                    ? 'Censura binaria real que elimina físicamente los datos del código del documento.'
                    : 'True binary redaction that physically removes data from document code.'}
                </li>
                <li>
                  {isEs
                    ? 'No se utilizan subencargados del tratamiento externos.'
                    : 'No external sub-processors are used.'}
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-5">
            <h2
              id="dpa-5"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs
                ? '5. Obligaciones del Encargado del Tratamiento'
                : '5. Obligations of the Data Processor'}
            </h2>
            <div className="space-y-1 text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <p>
                {isEs
                  ? 'PDFBlack, como Encargado del Tratamiento, se obliga a:'
                  : 'PDFBlack, as Data Processor, undertakes to:'}
              </p>
              <ul
                className="list-disc pl-5 space-y-1 text-xs sm:text-sm"
                aria-label={isEs ? 'Obligaciones del encargado' : 'Processor obligations'}
              >
                <li>
                  {isEs
                    ? 'Tratar los datos personales únicamente según las instrucciones documentadas del Responsable (el usuario).'
                    : 'Process personal data only according to the documented instructions of the Controller (the user).'}
                </li>
                <li>
                  {isEs
                    ? 'No comunicar los datos personales a terceros, salvo obligación legal.'
                    : 'Not disclose personal data to third parties, except by legal obligation.'}
                </li>
                <li>
                  {isEs
                    ? 'Garantizar que las personas autorizadas para tratar datos se han comprometido a respetar la confidencialidad.'
                    : 'Ensure that persons authorized to process data have committed to confidentiality.'}
                </li>
                <li>
                  {isEs
                    ? 'Asistir al Responsable en el cumplimiento de sus obligaciones de seguridad, notificación de brechas y evaluaciones de impacto.'
                    : 'Assist the Controller in fulfilling security, breach notification, and impact assessment obligations.'}
                </li>
                <li>
                  {isEs
                    ? 'Eliminar todos los datos personales al finalizar la sesión de tratamiento (cierre de pestaña).'
                    : 'Delete all personal data upon completion of the processing session (tab closure).'}
                </li>
                <li>
                  {isEs
                    ? 'Notificar al Responsable cualquier violación de seguridad sin dilación indebida (en un plazo máximo de 72 horas).'
                    : 'Notify the Controller of any security breach without undue delay (within 72 hours).'}
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-6">
            <h2
              id="dpa-6"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '6. Subencargados del Tratamiento' : '6. Sub-processors'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'PDFBlack no utiliza subencargados del tratamiento para el procesamiento de archivos PDF. Todo el procesamiento ocurre en el dispositivo del usuario. La excepción de firma digital utiliza exclusivamente la biblioteca criptográfica node-forge en instancias efímeras sin almacenamiento. El Responsable autoriza el uso de estos subencargados mediante la aceptación de este DPA.'
                : 'PDFBlack does not use sub-processors for PDF file processing. All processing occurs on the user device. The digital signature exception exclusively uses the node-forge cryptographic library on ephemeral instances without storage. The Controller authorizes the use of these sub-processors by accepting this DPA.'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-7">
            <h2
              id="dpa-7"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '7. Transferencias Internacionales' : '7. International Transfers'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'Dado que el procesamiento ocurre 100% en el navegador del usuario, no se realiza transferencia internacional de datos personales. Los datos permanecen en el dispositivo del usuario en todo momento. Para el servicio de firma digital, los datos se procesan exclusivamente en servidores ubicados dentro del Espacio Económico Europeo (EEE).'
                : 'Since processing occurs 100% in the user browser, no international transfer of personal data takes place. Data remains on the user device at all times. For the digital signature service, data is processed exclusively on servers located within the European Economic Area (EEA).'}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10" aria-labelledby="dpa-8">
            <h2
              id="dpa-8"
              className="text-lg font-bold text-white flex items-center gap-2 font-mono"
            >
              <FileText className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {isEs ? '8. Aceptación y Vigencia' : '8. Acceptance and Validity'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {isEs
                ? 'El presente DPA entra en vigor en el momento en que el usuario carga un archivo PDF en PDFBlack y permanece vigente mientras dure la sesión de procesamiento. La aceptación de este DPA se produce por el mero uso de la plataforma, sin necesidad de firma adicional. Para obtener una copia firmada, contacta a contacto@pdf-black.com.'
                : 'This DPA enters into force at the moment the user uploads a PDF file to PDFBlack and remains in effect for the duration of the processing session. Acceptance of this DPA occurs by the mere use of the platform, without the need for additional signature. To obtain a signed copy, contact contacto@pdf-black.com.'}
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
              href="/terminos"
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all"
            >
              {isEs ? 'Términos y Condiciones' : 'Terms & Conditions'}
            </Link>
            <Link
              href="/aviso-legal"
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full transition-all"
            >
              {isEs ? 'Aviso Legal' : 'Legal Notice'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
