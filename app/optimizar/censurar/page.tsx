'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, EyeOff, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfRedacter = dynamic(() => import('@/components/PdfRedacter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para censurar archivos PDF...</p>
    </div>
  ),
});

export default function CensurarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfRedacter />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><EyeOff className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'1. Cómo censurar un PDF':'1. How to redact a PDF'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[{step:'01',es:'Sube tu archivo PDF a la zona de carga.',en:'Upload your PDF to the upload zone.'},{step:'02',es:'Marca áreas a censurar o usa detección automática (emails, teléfonos, tarjetas).',en:'Mark areas to redact or use automatic detection (emails, phones, cards).'},{step:'03',es:'El motor dibuja rectángulos negros permanentes en el stream de cada página.',en:'The engine draws permanent black rectangles in each page stream.'},{step:'04',es:'Haz clic en "Censurar PDF →" y descarga el documento con parches definitivos.',en:'Click "Redact PDF →" and download the document with permanent patches.'}].map((item,i)=>(<div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2"><span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span><p className="text-xs text-zinc-400 leading-relaxed">{isEs?item.es:item.en}</p></div>))}
            </div>
          </div>
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'2. Limitaciones y consejos útiles':'2. Limitations & useful tips'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3"><h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs?'LO QUE PUEDES HACER':'WHAT YOU CAN DO'}</h4>
                {[isEs?'Censurar permanentemente texto, imágenes y datos sensibles con parches negros.':'Permanently redact text, images, and sensitive data with black patches.',isEs?'Usar detección automática de emails, teléfonos, tarjetas de crédito y palabras clave.':'Use automatic detection of emails, phones, credit cards, and keywords.',isEs?'Los parches sobreescriben permanentemente — no son capas superpuestas reversibles.':'Patches permanently overwrite — not reversible floating overlays.',isEs?'El texto censurado no puede recuperarse con OCR ni análisis forense digital.':'Redacted text cannot be recovered by OCR or digital forensic analysis.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span><span>{t}</span></div>))}
              </div>
              <div className="space-y-3"><h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs?'CONSEJOS':'TIPS'}</h4>
                {[isEs?'Revisa todas las áreas marcadas antes de aplicar — la censura es irreversible.':'Review all marked areas before applying — redaction is irreversible.',isEs?'Usa la detección automática como primer paso, luego revisa manualmente.':'Use automatic detection as a first step, then manually review.',isEs?'Haz una copia de seguridad del original antes de censurar.':'Make a backup of the original before redacting.',isEs?'Verifica que no quede texto visible en márgenes o entre líneas.':'Verify no text remains visible in margins or between lines.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-amber-400 flex-shrink-0 mt-0.5">→</span><span>{t}</span></div>))}
              </div>
            </div>
          </div>
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'3. ¿Qué sucede con tu documento al censurarlo?':'3. What happens to your document when redacting it?'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🖥️ {isEs?'Procesamiento 100% local':'100% local processing'}</strong><p className="text-[11px]">{isEs?'La censura se ejecuta en la RAM. Ningún dato sensible sale de tu equipo.':'Redaction runs in RAM. No sensitive data leaves your device.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🖤 {isEs?'Parches permanentes e irrecuperables':'Permanent & unrecoverable patches'}</strong><p className="text-[11px]">{isEs?'Rectángulos negros incrustados con operadores PDF nativos (re f). El contenido subyacente se sobreescribe.':'Black rectangles embedded with native PDF operators (re f). Underlying content is overwritten.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">📥 {isEs?'Descarga directa y segura':'Direct & secure download'}</strong><p className="text-[11px]">{isEs?'El PDF se genera localmente. Tu archivo original no se modifica.':'The PDF is generated locally. Your original file is not modified.'}</p></div>
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
                  qEs: '¿La censura es realmente permanente e irreversible?',
                  qEn: 'Is the redaction truly permanent and irreversible?',
                  aEs: 'Sí. A diferencia de otras herramientas que solo dibujan una capa encima del PDF, nuestra herramienta modifica directamente el content stream de cada página, incrustando rectángulos negros con operadores nativos PDF (re f). El contenido subyacente se destruye y no puede recuperarse con OCR, editores de texto ni análisis forense digital.',
                  aEn: 'Yes. Unlike other tools that merely draw a layer on top of the PDF, our tool directly modifies the content stream of each page, embedding black rectangles with native PDF operators (re f). The underlying content is destroyed and cannot be recovered by OCR, text editors, or digital forensic analysis.',
                },
                {
                  qEs: '¿Mis documentos salen de mi computadora durante el proceso?',
                  qEn: 'Do my documents leave my computer during the process?',
                  aEs: 'No. Todo el procesamiento se ejecuta 100% en tu navegador mediante Web Workers independientes. El PDF se carga en RAM, se procesa localmente y se descarga directamente. No se envía ningún dato a servidores externos. La herramienta funciona completamente offline.',
                  aEn: 'No. All processing runs 100% in your browser via independent Web Workers. The PDF is loaded into RAM, processed locally, and downloaded directly. No data is sent to external servers. The tool works completely offline.',
                },
                {
                  qEs: '¿Qué tipos de datos sensibles detecta automáticamente?',
                  qEn: 'What types of sensitive data does it automatically detect?',
                  aEs: 'El motor de detección automática identifica: direcciones de correo electrónico, números de teléfono (formatos nacionales e internacionales), números de tarjetas de crédito/débito (12-19 dígitos), documentos de identidad (DNI, NIE, Pasaporte), IBAN y cuentas bancarias, matrículas de vehículos, direcciones IP, y palabras clave personalizadas mediante expresiones regulares configurables.',
                  aEn: 'The automatic detection engine identifies: email addresses, phone numbers (national and international formats), credit/debit card numbers (12-19 digits), identity documents (ID, NIE, Passport), IBAN and bank accounts, vehicle license plates, IP addresses, and custom keywords via configurable regular expressions.',
                },
                {
                  qEs: '¿Puedo censurar solo partes específicas sin afectar el resto del documento?',
                  qEn: 'Can I redact only specific parts without affecting the rest of the document?',
                  aEs: 'Sí. Dispones de dos modos de censura: el modo Precisión edita únicamente los content streams de las páginas afectadas, preservando texto no censurado, marcadores, enlaces y fuentes originales. El modo Raster convierte cada página a imagen, ideal para máxima compatibilidad con cualquier PDF. Puedes dibujar rectángulos manualmente, buscar palabras específicas, o usar la detección automática.',
                  aEn: 'Yes. You have two redaction modes: Precision mode edits only the content streams of affected pages, preserving non-redacted text, bookmarks, links, and original fonts. Raster mode converts each page to an image, ideal for maximum compatibility with any PDF. You can manually draw rectangles, search for specific words, or use automatic detection.',
                },
                {
                  qEs: '¿Queda algún registro o metadato que pueda revelar la información censurada?',
                  qEn: 'Is there any log or metadata that could reveal the redacted information?',
                  aEs: 'No. El proceso incluye sanitización automática de metadatos del PDF (autor, título, historial de modificaciones, coordenadas GPS, etc.). Además, la cadena de custodia con hash SHA-256 se almacena únicamente en tu navegador de forma temporal y no se transmite. El archivo resultante está completamente limpio de información residual.',
                  aEn: 'No. The process includes automatic sanitization of PDF metadata (author, title, modification history, GPS coordinates, etc.). Additionally, the SHA-256 custody chain is stored only temporarily in your browser and is not transmitted. The resulting file is completely clean of residual information.',
                },
                {
                  qEs: '¿Qué navegadores y dispositivos son compatibles?',
                  qEn: 'Which browsers and devices are supported?',
                  aEs: 'La herramienta es compatible con todos los navegadores modernos: Chrome 90+, Firefox 90+, Edge 90+, Safari 15+, Opera 76+, y navegadores móviles en iOS 15+ y Android 10+. Se requiere soporte para Web Workers, OffscreenCanvas (opcional, para rendimiento mejorado) y ECMAScript 2020. Funciona en Windows, macOS, Linux, iOS y Android.',
                  aEn: 'The tool is compatible with all modern browsers: Chrome 90+, Firefox 90+, Edge 90+, Safari 15+, Opera 76+, and mobile browsers on iOS 15+ and Android 10+. Support for Web Workers, OffscreenCanvas (optional, for enhanced performance), and ECMAScript 2020 is required. It works on Windows, macOS, Linux, iOS, and Android.',
                },
                {
                  qEs: '¿Existe algún límite de tamaño de archivo o número de páginas?',
                  qEn: 'Is there any file size or page count limit?',
                  aEs: 'No hay límites estrictos impuestos por la herramienta. El rendimiento depende de la memoria RAM disponible en tu dispositivo y de la capacidad de procesamiento de tu CPU. Para documentos de más de 500 páginas o superiores a 200 MB, se recomienda usar el modo Raster para un rendimiento óptimo. La herramienta ha sido probada exitosamente con documentos de hasta 2,000 páginas en equipos con 16 GB de RAM.',
                  aEn: 'There are no strict limits imposed by the tool. Performance depends on the available RAM on your device and your CPU processing power. For documents with more than 500 pages or larger than 200 MB, using Raster mode is recommended for optimal performance. The tool has been successfully tested with documents up to 2,000 pages on computers with 16 GB of RAM.',
                },
                {
                  qEs: '¿La herramienta cumple con normativas de protección de datos como GDPR?',
                  qEn: 'Does the tool comply with data protection regulations such as GDPR?',
                  aEs: 'Sí. Al procesar todo 100% localmente sin transmisión de datos a servidores, la herramienta es inherentemente compatible con GDPR, CCPA, HIPAA (en conjunto con políticas organizacionales adecuadas), y otras regulaciones de privacidad. El procesamiento local elimina la exposición de datos sensibles a terceros, que es un requisito fundamental de estas normativas. No obstante, recomendamos validar con tu oficial de cumplimiento normativo para casos de uso específicos.',
                  aEn: 'Yes. By processing everything 100% locally without data transmission to servers, the tool is inherently compatible with GDPR, CCPA, HIPAA (in conjunction with appropriate organizational policies), and other privacy regulations. Local processing eliminates exposure of sensitive data to third parties, which is a fundamental requirement of these regulations. However, we recommend validating with your compliance officer for specific use cases.',
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