'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Eye, CheckCircle2, Lock, Sparkles, KeyRound, FileCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfUnlocker = dynamic(() => import('@/components/PdfUnlocker'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para desbloquear archivos PDF...</p>
    </div>
  ),
});

export default function DesbloquearPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfUnlocker />

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
                  {isEs ? '¿Qué sucede exactamente al desbloquear un archivo PDF?' : 'What exactly happens when unlocking a PDF file?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 DESCIFRADO 100% LOCAL • SIN SERVIDORES • MEMORIA PRIVADA' : '🔒 100% LOCAL DECRYPTION • ZERO SERVERS • PRIVATE MEMORY'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Cero transmisión de claves o documentos' : 'Zero transmission of keys or documents'}
                </strong>
                <p>
                  {isEs
                    ? 'Todo el procedimiento criptográfico para resolver contraseñas de usuario o remover banderas de permisos `/P` se procesa de forma nativa dentro de la memoria RAM del navegador. Ninguna clave, texto o contenido del PDF abandona jamás tu dispositivo local.'
                    : 'All cryptographic procedures resolving user passwords or clearing `/P` permission flags run natively inside browser RAM. Zero passwords or PDF bytes ever leave your local device.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Eliminación del diccionario de cifrado' : 'Removal of the encryption dictionary'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor escanea el trailer del documento PDF, desvincula el objeto `/Encrypt` y recompila un nuevo binario 100% libre. El resultado es un documento PDF estándar 1.7 sin restricciones para imprimir, copiar o editar desde cualquier visor.'
                    : 'The engine parses the PDF trailer, detaches the `/Encrypt` object, and recompiles a brand-new 100% free binary. The result is a standard PDF 1.7 with no printing, copying, or editing restrictions.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO CRIPTOGRÁFICO PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento criptográfico paso a paso' : 'Step-by-step cryptographic procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor descifra y libera la seguridad de tu PDF sin comprometer datos' : 'How our engine decrypts and releases your PDF security without compromising data'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / LECTURA</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Detección /Encrypt' : '1. /Encrypt Detection'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Analizamos el objeto trailer del PDF buscando el diccionario `/Encrypt`. Identificamos la versión del cifrado `/V`, el tamaño de clave `/Length` y los hashes de usuario `/U` y propietario `/O`.'
                      : 'Parses the PDF trailer object for the `/Encrypt` dictionary. Identifies encryption version `/V`, key size `/Length`, user hash `/U`, and owner hash `/O`.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / DESCIFRADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Algoritmo AES-256 / RC4' : '2. AES-256 / RC4 Algorithm'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Ejecutamos el descifrado simétrico de todas las corrientes de datos, imágenes y fuentes directamente en la RAM usando la Web Crypto API nativa del navegador, sin librerías externas.'
                      : 'Executes symmetric decryption of all data streams, images, and fonts directly in RAM using the browser native Web Crypto API, without external libraries.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / PERMISOS</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Reset de Banderas /P' : '3. Reset /P Permission Flags'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Reasignamos el valor total de permisos en la bandera `/P` para habilitar la edición sin restricciones, impresión en alta calidad y extracción de texto e imágenes del documento.'
                      : 'Resets all permission bits in the `/P` flag to enable unrestricted editing, high-resolution printing, and full text and image extraction.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">04 / EMPAQUETADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '4. PDF Libre Resultante' : '4. Unlocked Output PDF'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Generamos un nuevo documento PDF 1.7 estándar sin objeto `/Encrypt` ni diccionario de seguridad, listo para descargar, imprimir y editar libremente en cualquier visor compatible.'
                      : 'Generates a new standard PDF 1.7 without any `/Encrypt` object or security dictionary, ready to download, print, and edit freely in any compatible viewer.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: TIPOS DE PROTECCIÓN QUE SE ELIMINAN */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué tipos de protección elimina esta herramienta?' : 'What types of protection does this tool remove?'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Protecciones y restricciones compatibles con el motor de descifrado' : 'Protections and restrictions compatible with the decryption engine'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Restricciones de Impresión' : 'Print Restrictions'}
                </strong>
                <p>
                  {isEs
                    ? 'Elimina la bandera de impresión denegada (`/Print` = false) para que puedas imprimir el documento en cualquier impresora, incluyendo en alta resolución o en PDF virtual.'
                    : 'Removes the print-denied flag (`/Print` = false) so you can print the document on any printer, including high-resolution or virtual PDF printers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-white" />
                  {isEs ? 'Bloqueo de Copia de Texto' : 'Text Copy Lock'}
                </strong>
                <p>
                  {isEs
                    ? 'Restablece los permisos de extracción de texto para que puedas copiar, pegar y buscar contenido dentro del documento usando cualquier visor, editor o herramienta OCR compatible.'
                    : 'Restores text extraction permissions so you can copy, paste, and search content inside the document using any compatible viewer, editor, or OCR tool.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-white" />
                  {isEs ? 'Contraseña de Propietario' : 'Owner Password'}
                </strong>
                <p>
                  {isEs
                    ? 'Separa y elimina el hash `/O` del propietario del documento. Esto libera la capacidad de modificar campos de formulario, añadir anotaciones, insertar páginas y editar el documento en Adobe Acrobat Pro u otros editores.'
                    : 'Separates and removes the owner hash `/O` from the document. This unlocks the ability to modify form fields, add annotations, insert pages, and edit in Adobe Acrobat Pro or other editors.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS DEL PDF DESBLOQUEADO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios del PDF desbloqueado resultante' : 'Benefits of the resulting unlocked PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Capacidades restauradas en el documento libre de restricciones' : 'Restored capabilities in the restriction-free document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Impresión en Alta Resolución' : 'High-Resolution Printing'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Imprime a cualquier DPI sin restricción en impresoras físicas o virtuales.' : 'Print at any DPI without restriction on physical or virtual printers.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Copiar y Pegar Texto' : 'Copy and Paste Text'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Extrae fragmentos de texto directamente al portapapeles con total libertad.' : 'Extract text fragments directly to clipboard with complete freedom.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Edición Completa del Documento' : 'Full Document Editing'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Modifica formularios, añade anotaciones e inserta páginas en cualquier editor.' : 'Modify forms, add annotations, and insert pages in any editor.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Funciona en Adobe, Foxit, Chrome, Edge, iOS, Android y Linux sin errores.' : 'Works in Adobe, Foxit, Chrome, Edge, iOS, Android, and Linux without errors.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Indexable por Google' : 'Google Indexable'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'El texto queda accesible para motores de búsqueda y herramientas OCR externas.' : 'Text becomes accessible to search engines and external OCR tools.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Privacidad Corporativa Total' : 'Total Corporate Privacy'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Cero bytes subidos a servidores. Cumplimiento GDPR y normativas de confidencialidad.' : 'Zero bytes uploaded to servers. Full GDPR and confidentiality compliance.'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
