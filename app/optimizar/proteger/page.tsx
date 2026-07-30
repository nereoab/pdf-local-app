'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Lock, CheckCircle2, Sparkles, KeyRound, Shield, FileCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfProtector = dynamic(() => import('@/components/PdfProtector'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para proteger archivos PDF...</p>
    </div>
  ),
});

export default function ProtegerPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfProtector />

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12">

          {/* BLOQUE 1: PRIVACIDAD Y QUÉ SUCEDE CON SUS ARCHIVOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tus archivos al protegerlos?' : 'What exactly happens to your files when protected?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 CIFRADO 100% LOCAL • SIN SERVIDORES • AES-256 BITS' : '🔒 100% LOCAL ENCRYPTION • ZERO SERVERS • AES-256 BITS'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tu clave nunca abandona tu dispositivo' : 'Your key never leaves your device'}
                </strong>
                <p>
                  {isEs
                    ? 'El proceso de cifrado AES-256 se ejecuta de forma completamente nativa dentro de la memoria RAM de tu navegador. Tu contraseña, la clave de cifrado derivada y el contenido del documento NUNCA se transmiten a servidores externos ni se almacenan en la nube bajo ninguna circunstancia.'
                    : 'The AES-256 encryption process runs completely natively inside your browser RAM. Your password, derived encryption key, and document content are NEVER transmitted to external servers or stored in the cloud under any circumstance.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Purga de memoria al finalizar' : 'Memory purge on completion'}
                </strong>
                <p>
                  {isEs
                    ? 'Una vez que el PDF cifrado ha sido descargado, toda la memoria utilizada se libera automáticamente. Al cerrar la pestaña o refrescar la página, el navegador elimina por completo el buffer en memoria, sin dejar rastro de la clave de cifrado ni del contenido procesado.'
                    : 'Once the encrypted PDF has been downloaded, all memory used is automatically released. Closing the tab or refreshing the page completely eliminates the in-memory buffer, leaving no trace of the encryption key or processed content.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO DE CIFRADO PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento de cifrado AES-256 paso a paso' : 'Step-by-step AES-256 encryption procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor aplica cifrado militar a tu documento PDF' : 'How our engine applies military-grade encryption to your PDF document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / DERIVACIÓN</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Derivación de Clave RC4/AES' : '1. RC4/AES Key Derivation'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'La contraseña de usuario se procesa mediante el algoritmo de derivación de clave PDF estándar (MD5 + SHA-256) para generar la clave de cifrado maestra de 256 bits requerida por el estándar PDF.'
                      : 'The user password is processed via the standard PDF key derivation algorithm (MD5 + SHA-256) to generate the 256-bit master encryption key required by the PDF standard.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / CIFRADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Cifrado AES-256 de Streams' : '2. AES-256 Stream Encryption'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Cada objeto del PDF (corrientes de texto, imágenes, fuentes embebidas) se cifra individualmente con AES-256 en modo CBC con vector de inicialización (IV) único por objeto para máxima entropía.'
                      : 'Each PDF object (text streams, images, embedded fonts) is individually encrypted with AES-256 in CBC mode with a unique initialization vector (IV) per object for maximum entropy.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / PERMISOS</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Escritura de Banderas /P' : '3. /P Permission Flags Write'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Se construye el diccionario `/Encrypt` con las banderas de permiso `/P` configuradas según tus selecciones: bloqueo de impresión, restricción de copia de texto, prevención de modificación y nivel de impresión permitido.'
                      : 'Builds the `/Encrypt` dictionary with `/P` permission flags configured per your selections: print lock, text copy restriction, modification prevention, and allowed print quality level.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">04 / EMPAQUETADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '4. PDF Cifrado Resultante' : '4. Encrypted PDF Output'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Se genera un nuevo documento PDF 1.7 con el diccionario `/Encrypt` firmado, todos los streams cifrados y los hashes de usuario `/U` y propietario `/O` correctamente embebidos en el trailer.'
                      : 'Generates a new PDF 1.7 document with signed `/Encrypt` dictionary, all streams encrypted, and user `/U` and owner `/O` hashes correctly embedded in the trailer.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: NIVELES DE PROTECCIÓN Y OPCIONES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Niveles de protección y opciones de seguridad avanzada' : 'Protection levels and advanced security options'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Control granular sobre quién puede abrir, imprimir y editar tu documento' : 'Granular control over who can open, print, and edit your document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-white" />
                  {isEs ? 'Contraseña de Apertura (Usuario)' : 'Open Password (User)'}
                </strong>
                <p>
                  {isEs
                    ? 'Establece una contraseña de apertura que el destinatario deberá ingresar para visualizar el documento. Esta contraseña queda codificada en el hash `/U` del diccionario de cifrado, impidiendo cualquier apertura no autorizada.'
                    : 'Sets an open password the recipient must enter to view the document. This password is encoded in the `/U` hash of the encryption dictionary, preventing any unauthorized access.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-white" />
                  {isEs ? 'Control Granular de Permisos' : 'Granular Permission Control'}
                </strong>
                <p>
                  {isEs
                    ? 'Configura de forma independiente: bloquear impresión, prohibir copia de texto, deshabilitar modificación del formulario, impedir inserción de páginas y controlar el nivel de resolución de impresión permitida (baja vs alta calidad).'
                    : 'Configure independently: block printing, prohibit text copying, disable form modification, prevent page insertion, and control allowed print resolution level (low vs. high quality).'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Rasterizado Anti-Extracción' : 'Anti-Extraction Rasterization'}
                </strong>
                <p>
                  {isEs
                    ? 'La opción de rasterizado convierte cada página del PDF en una imagen de alta resolución antes de cifrarla. Esto elimina cualquier posibilidad de extraer texto vectorial, fórmulas o datos ocultos del documento, incluso con herramientas forenses avanzadas.'
                    : 'Rasterization converts each PDF page to a high-resolution image before encrypting it. This eliminates any possibility of extracting vector text, formulas, or hidden data from the document, even with advanced forensic tools.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS DEL PDF PROTEGIDO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios y garantías del PDF protegido resultante' : 'Benefits and guarantees of the resulting protected PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Estándares de seguridad y compatibilidad del documento cifrado' : 'Security standards and compatibility of the encrypted document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Cifrado AES-256 Militar' : 'AES-256 Military Encryption'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'El mismo estándar de cifrado usado por gobiernos y bancos internacionales.' : 'The same encryption standard used by governments and international banks.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Compatible con Adobe Acrobat' : 'Adobe Acrobat Compatible'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'El PDF cifrado se abre correctamente en Adobe, Foxit, Chrome, iOS y Android.' : 'The encrypted PDF opens correctly in Adobe, Foxit, Chrome, iOS and Android.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Control Total de Permisos' : 'Total Permission Control'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Configura impresión, copia, edición y acceso de forma completamente independiente.' : 'Configure printing, copying, editing, and access completely independently.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Rasterizado Anti-Copia' : 'Anti-Copy Rasterization'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Opción de aplanar contenido en imagen para bloquear extracción de texto vectorial.' : 'Option to flatten content to image to block vector text extraction.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Cumplimiento GDPR / Legal' : 'GDPR / Legal Compliance'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Protección legal de datos personales y documentos confidenciales sin servidor.' : 'Legal protection for personal data and confidential documents without servers.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Privacidad Corporativa Total' : 'Total Corporate Privacy'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Cero bytes enviados a servidores remotos. Tu clave nunca sale de tu navegador.' : 'Zero bytes sent to remote servers. Your key never leaves your browser.'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
