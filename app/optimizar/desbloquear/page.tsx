'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Unlock, AlertTriangle, HelpCircle } from 'lucide-react';
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

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><Unlock className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '1. Cómo desbloquear un PDF' : '1. How to unlock a PDF'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {step:'01',es:'Sube tu PDF protegido con contraseña a la zona de carga.',en:'Upload your password-protected PDF to the upload zone.'},
                {step:'02',es:'Si tiene contraseña de usuario, ingrésala para descifrar el documento.',en:'If it has a user password, enter it to decrypt the document.'},
                {step:'03',es:'El motor detecta /Encrypt, descifra con AES-256/RC4 y restablece permisos /P.',en:'The engine detects /Encrypt, decrypts with AES-256/RC4, and resets /P permissions.'},
                {step:'04',es:'Haz clic en "Desbloquear PDF →" y descarga el documento sin restricciones.',en:'Click "Unlock PDF →" and download the unrestricted document.'},
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[isEs?'Eliminar contraseña de apertura para ver el PDF sin clave.':'Remove open password to view the PDF without a key.',isEs?'Restablecer permisos de impresión, copia y edición.':'Restore printing, copying, and editing permissions.',isEs?'Eliminar contraseña de propietario que bloquea modificación de formularios.':'Remove owner password that blocks form modification.',isEs?'Generar un PDF 1.7 sin /Encrypt ni restricciones.':'Generate a PDF 1.7 without /Encrypt or restrictions.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span><span>{t}</span></div>))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[isEs?'Solo funciona con archivos de los que eres propietario o tienes autorización.':'Only works with files you own or have authorization for.',isEs?'Si no conoces la contraseña de usuario, el motor no puede descifrar el PDF.':'If you don\'t know the user password, the engine cannot decrypt the PDF.',isEs?'Todo el proceso criptográfico usa la Web Crypto API nativa del navegador.':'The entire cryptographic process uses the browser\'s native Web Crypto API.',isEs?'El PDF desbloqueado permite búsqueda de texto e indexación.':'The unlocked PDF allows text search and indexing.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-amber-400 flex-shrink-0 mt-0.5">→</span><span>{t}</span></div>))}
              </div>
            </div>
          </div>
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'3. ¿Qué sucede con tu documento al desbloquearlo?':'3. What happens to your document when unlocking it?'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🖥️ {isEs?'Procesamiento 100% local':'100% local processing'}</strong><p className="text-[11px]">{isEs?'El descifrado se ejecuta en la RAM. Ninguna clave sale de tu dispositivo.':'Decryption runs in RAM. No key leaves your device.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🔓 {isEs?'Eliminación del diccionario de cifrado':'Encryption dictionary removal'}</strong><p className="text-[11px]">{isEs?'Desvincula /Encrypt del trailer, descifra streams y restablece banderas /P.':'Detaches /Encrypt from the trailer, decrypts streams, and resets /P flags.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">📥 {isEs?'Descarga directa y segura':'Direct & secure download'}</strong><p className="text-[11px]">{isEs?'El PDF se genera localmente. Tu archivo original no se modifica.':'The PDF is generated locally. Your original file is not modified.'}</p></div>
            </div>
          </div>

          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><HelpCircle className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  qEs: '¿Es legal desbloquear un archivo PDF con esta herramienta?',
                  qEn: 'Is it legal to unlock a PDF file with this tool?',
                  aEs: 'Sí, siempre que seas el propietario legítimo del documento o cuentes con la autorización explícita para modificar sus permisos de acceso y uso. Esta herramienta está concebida para la recuperación legítima de archivos propios, liberación de restricciones de impresión en documentos de trabajo y auditoría de archivos organizacionales.',
                  aEn: 'Yes, provided you are the legitimate owner of the document or have explicit authorization to modify its access and usage permissions. This tool is designed for legitimate recovery of personal files, removal of printing restrictions on work documents, and organizational file auditing.',
                },
                {
                  qEs: '¿Mis contraseñas o archivos se transmiten a servidores externos?',
                  qEn: 'Are my passwords or files transmitted to external servers?',
                  aEs: 'No. Todo el análisis, descifrado y generación del nuevo PDF se ejecuta 100% en tu navegador a través de un Web Worker aislado. Las contraseñas se procesan en la memoria RAM de tu dispositivo y se eliminan inmediatamente al finalizar el proceso. Ningún dato viaja por Internet.',
                  aEn: 'No. All analysis, decryption, and PDF generation run 100% in your browser via an isolated Web Worker. Passwords are processed in your device\'s RAM and deleted immediately after the process ends. No data travels over the Internet.',
                },
                {
                  qEs: '¿Qué diferencia hay entre la contraseña de apertura y la de propietario?',
                  qEn: 'What is the difference between the open password and the owner password?',
                  aEs: 'La contraseña de apertura (User Password) bloquea completamente la lectura del documento. Para desbloquearlo se requiere la clave o usar la función de recuperación automática. La contraseña de propietario (Owner Password) solo restringe funciones como copiar texto, imprimir o editar formularios; este tipo de restricciones de propietario se eliminan automáticamente sin requerir clave.',
                  aEn: 'The open password (User Password) completely blocks reading the document. Unlocking it requires the key or using the automatic recovery feature. The owner password only restricts features like copying text, printing, or editing forms; these owner restrictions are automatically removed without requiring a password.',
                },
                {
                  qEs: '¿Cómo funciona la opción de "Recuperar Contraseña" automática?',
                  qEn: 'How does the automatic "Recover Password" option work?',
                  aEs: 'El motor ejecuta una búsqueda heurística en segundo plano probando candidatos derivados del nombre del archivo, metadatos no cifrados, diccionarios de claves corporativas comunes, patrones de fechas y barridos numéricos de 4 dígitos (0000-9999). Esta función se ejecuta con un límite de tiempo (max 15s) para garantizar un rendimiento fluido.',
                  aEn: 'The engine executes a background heuristic search testing candidates derived from the file name, unencrypted metadata, common corporate dictionaries, date patterns, and 4-digit numeric sweeps (0000-9999). This process runs with a time limit (max 15s) to guarantee smooth performance.',
                },
                {
                  qEs: '¿El PDF desbloqueado pierde calidad vectorial, imágenes o fuentes?',
                  qEn: 'Does the unlocked PDF lose vector quality, images, or fonts?',
                  aEs: 'No. El motor realiza un desbloqueo estructural (utilizando pdf-lib) reconstruyendo el PDF y desvinculando el diccionario /Encrypt. Esto preserva de manera exacta todas las fuentes tipográficas incrustadas, vectores, imágenes de alta resolución y la maquetación original.',
                  aEn: 'No. The engine performs a structural unlock (using pdf-lib) rebuilding the PDF and detaching the /Encrypt dictionary. This preserves exact embedded fonts, vectors, high-resolution images, and original layout.',
                },
                {
                  qEs: '¿Qué ocurre con las firmas digitales al desbloquear el documento?',
                  qEn: 'What happens to digital signatures when unlocking the document?',
                  aEs: 'De acuerdo con la especificación ISO 32000, cualquier modificación en la estructura o en el diccionario de cifrado de un PDF firmado digitalmente anulará la validez criptográfica de las firmas incrustadas. La herramienta te advertirá si detecta firmas digitales (/Sig) antes de proceder.',
                  aEn: 'According to the ISO 32000 specification, any modification to the structure or encryption dictionary of a digitally signed PDF will invalidate the cryptographic validity of embedded signatures. The tool will warn you if it detects digital signatures (/Sig) before proceeding.',
                },
                {
                  qEs: '¿Puedo generar reportes de auditoría de los documentos desbloqueados?',
                  qEn: 'Can I generate audit reports of the unlocked documents?',
                  aEs: 'Sí. Una vez completado el desbloqueo, puedes presionar Ctrl + S o pulsar el botón de descarga de reporte para obtener un archivo JSON con los hashes criptográficos SHA-256 de los documentos, timestamps ISO 8601 y métricas de tamaño, útil para auditorías de seguridad de TI.',
                  aEn: 'Yes. Once unlocking is complete, press Ctrl + S or click the download report button to obtain a JSON file with SHA-256 cryptographic hashes, ISO 8601 timestamps, and file size metrics, useful for IT security auditing.',
                },
              ].map((faq, i) => (
                <details key={i} className="group bg-zinc-900/60 border border-white/5 rounded-xl overflow-hidden transition-all duration-200">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/40 transition-colors list-none marker:content-none">
                    <span className="text-xs sm:text-sm font-bold text-white pr-4 leading-snug">{isEs ? faq.qEs : faq.qEn}</span>
                    <span className="flex-shrink-0 text-zinc-400 group-open:rotate-180 transition-transform duration-200">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">{isEs ? faq.aEs : faq.aEn}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}