'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Lock, AlertTriangle, HelpCircle } from 'lucide-react';
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

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><Lock className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'1. Cómo proteger un PDF':'1. How to protect a PDF'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[{step:'01',es:'Sube tu archivo PDF a la zona de carga.',en:'Upload your PDF to the upload zone.'},{step:'02',es:'Establece una contraseña de apertura y configura los permisos.',en:'Set an open password and configure permissions.'},{step:'03',es:'Elige bloquear impresión, copia, edición y controlar resolución.',en:'Choose to block printing, copying, editing, and control resolution.'},{step:'04',es:'Haz clic en "Proteger PDF →" y descarga el PDF cifrado con AES-256.',en:'Click "Protect PDF →" and download the AES-256 encrypted PDF.'}].map((item,i)=>(<div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2"><span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span><p className="text-xs text-zinc-400 leading-relaxed">{isEs?item.es:item.en}</p></div>))}
            </div>
          </div>
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'2. Limitaciones y consejos útiles':'2. Limitations & useful tips'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3"><h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs?'LO QUE PUEDES HACER':'WHAT YOU CAN DO'}</h4>
                {[isEs?'Cifrar tu PDF con contraseña usando AES-256 de grado militar.':'Encrypt your PDF with a password using military-grade AES-256.',isEs?'Configurar bloqueo de impresión, copia de texto y edición de formularios.':'Configure blocking of printing, text copying, and form editing.',isEs?'Controlar el nivel de resolución de impresión permitida.':'Control the allowed print resolution level.',isEs?'Aplicar rasterizado anti-extracción para convertir páginas en imágenes.':'Apply anti-extraction rasterization to convert pages to images.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span><span>{t}</span></div>))}
              </div>
              <div className="space-y-3"><h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs?'CONSEJOS':'TIPS'}</h4>
                {[isEs?'Guarda la contraseña en un lugar seguro. Si la pierdes, no podrás recuperar el acceso.':'Save the password safely. If you lose it, you cannot recover access.',isEs?'Usa contraseñas robustas (8+ caracteres, mayúsculas, números y símbolos).':'Use strong passwords (8+ characters, uppercase, numbers, and symbols).',isEs?'El rasterizado elimina texto vectorial — ideal para documentos muy sensibles.':'Rasterization removes vector text — ideal for highly sensitive documents.',isEs?'El cifrado AES-256 es compatible con todos los visores PDF modernos.':'AES-256 encryption is compatible with all modern PDF viewers.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-amber-400 flex-shrink-0 mt-0.5">→</span><span>{t}</span></div>))}
              </div>
            </div>
          </div>
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'3. ¿Qué sucede con tu documento al protegerlo?':'3. What happens to your document when protecting it?'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🖥️ {isEs?'Procesamiento 100% local':'100% local processing'}</strong><p className="text-[11px]">{isEs?'El cifrado AES-256 se ejecuta en tu RAM. Tu contraseña nunca sale de tu equipo.':'AES-256 encryption runs in your RAM. Your password never leaves your device.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🔐 {isEs?'Cifrado AES-256 de grado militar':'Military-grade AES-256 encryption'}</strong><p className="text-[11px]">{isEs?'Cada stream se cifra individualmente con AES-256 CBC e IV único. Se construye /Encrypt.':'Each stream is individually encrypted with AES-256 CBC and unique IV. /Encrypt is built.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">📥 {isEs?'Descarga directa y segura':'Direct & secure download'}</strong><p className="text-[11px]">{isEs?'El PDF se genera localmente. Solo quien tenga la contraseña podrá abrirlo.':'The PDF is generated locally. Only those with the password can open it.'}</p></div>
            </div>
          </div>
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><HelpCircle className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'4. Preguntas Frecuentes':'4. Frequently Asked Questions'}</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  qEs: '¿Es realmente seguro el cifrado AES-256 que utiliza la herramienta?',
                  qEn: 'Is the AES-256 encryption used by the tool really secure?',
                  aEs: 'Sí. AES-256 (Advanced Encryption Standard con clave de 256 bits) es el estándar de cifrado aprobado por el gobierno de EE.UU. para información clasificada TOP SECRET. Es el mismo algoritmo utilizado por bancos, ejércitos y agencias de inteligencia. Nuestra implementación cifra cada stream del PDF individualmente con AES-256 en modo CBC (Cipher Block Chaining) y un vector de inicialización (IV) único por stream, cumpliendo con la especificación PDF 2.0 (ISO 32000-2:2020).',
                  aEn: 'Yes. AES-256 (Advanced Encryption Standard with 256-bit key) is the encryption standard approved by the U.S. government for TOP SECRET classified information. It is the same algorithm used by banks, militaries, and intelligence agencies. Our implementation encrypts each PDF stream individually with AES-256 in CBC mode (Cipher Block Chaining) and a unique initialization vector (IV) per stream, complying with the PDF 2.0 specification (ISO 32000-2:2020).',
                },
                {
                  qEs: '¿Mis contraseñas y documentos salen de mi computadora durante el proceso?',
                  qEn: 'Do my passwords and documents leave my computer during the process?',
                  aEs: 'No. Todo el procesamiento se ejecuta 100% en tu navegador mediante un Web Worker dedicado. El archivo PDF se carga en RAM, las contraseñas se procesan en buffers locales del worker, se aplica el cifrado y se genera el archivo protegido — todo localmente. Las contraseñas no se registran en logs, no se almacenan en localStorage, no se transmiten por red y se destruyen cuando el worker termina. La herramienta funciona completamente offline una vez cargada la página.',
                  aEn: 'No. All processing runs 100% in your browser via a dedicated Web Worker. The PDF file is loaded into RAM, passwords are processed in local worker buffers, encryption is applied, and the protected file is generated — all locally. Passwords are not logged, not stored in localStorage, not transmitted over the network, and are destroyed when the worker terminates. The tool works completely offline once the page is loaded.',
                },
                {
                  qEs: '¿Qué sucede si pierdo u olvido la contraseña de apertura?',
                  qEn: 'What happens if I lose or forget the open password?',
                  aEs: 'Si pierdes la contraseña de apertura (user password), no podrás recuperar el acceso al documento. El cifrado AES-256 no tiene puertas traseras ni mecanismos de recuperación — esa es precisamente su fortaleza de seguridad. Te recomendamos: (1) guardar la contraseña en un gestor de contraseñas seguro, (2) conservar siempre una copia sin cifrar del documento original en un lugar seguro, y (3) utilizar la contraseña de propietario como respaldo si solo necesitas restringir permisos sin bloquear la apertura.',
                  aEn: 'If you lose the open password (user password), you will not be able to recover access to the document. AES-256 encryption has no backdoors or recovery mechanisms — that is precisely its security strength. We recommend: (1) saving the password in a secure password manager, (2) always keeping an unencrypted copy of the original document in a safe place, and (3) using the owner password as a backup if you only need to restrict permissions without blocking opening.',
                },
                {
                  qEs: '¿El PDF protegido es compatible con todos los visores y dispositivos?',
                  qEn: 'Is the protected PDF compatible with all viewers and devices?',
                  aEs: 'Sí. El cifrado AES-256 cumple con el estándar PDF 2.0 (ISO 32000-2:2020) y es compatible con todos los visores PDF modernos: Adobe Acrobat Reader DC (v9.0+), Foxit Reader, navegadores web (Chrome, Edge, Firefox, Safari), Preview en macOS, y visores móviles en iOS y Android. Además, nuestro worker aplica automáticamente un parche de compatibilidad con Adobe Acrobat inyectando el trailer /ID requerido. Si un visor antiguo no soporta AES-256, se mostrará un mensaje solicitando actualizar el software.',
                  aEn: 'Yes. AES-256 encryption complies with the PDF 2.0 standard (ISO 32000-2:2020) and is compatible with all modern PDF viewers: Adobe Acrobat Reader DC (v9.0+), Foxit Reader, web browsers (Chrome, Edge, Firefox, Safari), Preview on macOS, and mobile viewers on iOS and Android. Additionally, our worker automatically applies an Adobe Acrobat compatibility patch by injecting the required trailer /ID. If an older viewer does not support AES-256, a message will appear asking to update the software.',
                },
                {
                  qEs: '¿Puedo proteger varios archivos PDF simultáneamente?',
                  qEn: 'Can I protect multiple PDF files simultaneously?',
                  aEs: 'Sí. La herramienta soporta procesamiento por lotes (batch). Puedes subir múltiples archivos PDF y aplicar la misma configuración de seguridad —contraseñas, permisos y opciones avanzadas— a todos ellos en una sola operación. El Web Worker procesa cada archivo secuencialmente, mostrando el progreso individual y global. Cada PDF protegido se descarga automáticamente al completarse, permitiéndote procesar grandes volúmenes de documentos de forma eficiente.',
                  aEn: 'Yes. The tool supports batch processing. You can upload multiple PDF files and apply the same security configuration —passwords, permissions, and advanced options— to all of them in a single operation. The Web Worker processes each file sequentially, showing individual and global progress. Each protected PDF is automatically downloaded upon completion, allowing you to efficiently process large volumes of documents.',
                },
                {
                  qEs: '¿Qué diferencia hay entre la contraseña de apertura y la contraseña de propietario?',
                  qEn: 'What is the difference between the user password and the owner password?',
                  aEs: 'La contraseña de apertura (user password) controla quién puede abrir y leer el documento. Si se establece, el PDF solicitará esta contraseña antes de mostrar su contenido. La contraseña de propietario (owner password) es una contraseña maestra que controla los permisos del documento (impresión, copia, edición, etc.) sin necesariamente impedir la apertura. Puedes usar: (a) solo contraseña de apertura para máxima confidencialidad, (b) solo contraseña de propietario para restringir qué pueden hacer los lectores sin bloquear la apertura, o (c) ambas para máxima seguridad. Si no estableces contraseña de propietario, se genera una automáticamente.',
                  aEn: 'The user password controls who can open and read the document. If set, the PDF will request this password before displaying its content. The owner password is a master password that controls document permissions (printing, copying, editing, etc.) without necessarily blocking opening. You can use: (a) only user password for maximum confidentiality, (b) only owner password to restrict what readers can do without blocking opening, or (c) both for maximum security. If you do not set an owner password, one is generated automatically.',
                },
                {
                  qEs: '¿La opción de rasterizado reduce la calidad del documento?',
                  qEn: 'Does the rasterization option reduce document quality?',
                  aEs: 'La rasterización convierte cada página del PDF en una imagen JPEG de alta calidad (92% de calidad), lo que implica que el texto deja de ser vectorial y no será seleccionable ni buscable. La calidad visual es excelente para lectura e impresión — usamos un escalado 2x y compresión JPEG de alta fidelidad. Sin embargo, el tamaño del archivo puede aumentar significativamente (especialmente en documentos con muchas páginas) y el texto no podrá ser indexado por motores de búsqueda. Esta opción es ideal para documentos extremadamente sensibles donde se requiere una capa adicional de seguridad anti-extracción. Para la mayoría de casos, recomendamos usar solo el cifrado AES-256 sin rasterizar, que preserva la calidad vectorial original.',
                  aEn: 'Rasterization converts each PDF page into a high-quality JPEG image (92% quality), which means text is no longer vector-based and will not be selectable or searchable. Visual quality is excellent for reading and printing — we use 2x scaling and high-fidelity JPEG compression. However, file size may increase significantly (especially for documents with many pages) and text cannot be indexed by search engines. This option is ideal for extremely sensitive documents requiring an additional anti-extraction security layer. For most cases, we recommend using only AES-256 encryption without rasterization, which preserves the original vector quality.',
                },
                {
                  qEs: '¿La herramienta cumple con normativas de protección de datos como GDPR?',
                  qEn: 'Does the tool comply with data protection regulations such as GDPR?',
                  aEs: 'Sí. Al procesar todo 100% localmente sin transmisión de datos a servidores externos, la herramienta es inherentemente compatible con GDPR (Reglamento General de Protección de Datos de la UE), CCPA (California Consumer Privacy Act), HIPAA (en conjunto con políticas organizacionales adecuadas), y otras regulaciones de privacidad. El procesamiento local elimina la exposición de datos sensibles y contraseñas a terceros. El cifrado AES-256 cumple con los requisitos de "medidas técnicas y organizativas apropiadas" exigidos por el Artículo 32 del GDPR. No obstante, recomendamos validar con tu oficial de cumplimiento normativo para casos de uso específicos en tu organización.',
                  aEn: 'Yes. By processing everything 100% locally without data transmission to external servers, the tool is inherently compatible with GDPR (EU General Data Protection Regulation), CCPA (California Consumer Privacy Act), HIPAA (in conjunction with appropriate organizational policies), and other privacy regulations. Local processing eliminates exposure of sensitive data and passwords to third parties. AES-256 encryption meets the "appropriate technical and organizational measures" requirements of GDPR Article 32. However, we recommend validating with your compliance officer for specific use cases in your organization.',
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
