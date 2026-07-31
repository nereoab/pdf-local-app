'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, RotateCw, CheckCircle2, Lock, Sparkles, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfRotator = dynamic(() => import('@/components/PdfRotator'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para rotar páginas PDF...</p>
    </div>
  ),
});

export default function RotarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfRotator />

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12">

          {/* BLOQUE 1: PRIVACIDAD */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tu PDF al rotar sus páginas?' : 'What exactly happens to your PDF when rotating its pages?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • ROTACIÓN SIN RECODIFICACIÓN • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • ROTATION WITHOUT RE-ENCODING • 100% LOCAL'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tu documento nunca sale de tu dispositivo' : 'Your document never leaves your device'}
                </strong>
                <p>
                  {isEs
                    ? 'La rotación de páginas se ejecuta completamente en la memoria RAM de tu navegador usando pdf-lib. Ningún byte de tu documento — planos técnicos, contratos, expedientes — se transmite a servidores externos. Todo el procesamiento es instantáneo, privado y 100% local en tu equipo.'
                    : 'Page rotation runs entirely in your browser RAM using pdf-lib. Not a single byte of your document — blueprints, contracts, dossiers — is transmitted to external servers. All processing is instant, private, and 100% local on your machine.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Rotación lossless: sin recodificación ni pérdida de calidad' : 'Lossless rotation: no re-encoding or quality loss'}
                </strong>
                <p>
                  {isEs
                    ? 'La rotación modifica únicamente el valor del campo `/Rotate` en el diccionario de la página — un campo entero de la especificación PDF que acepta valores 0, 90, 180 y 270 grados. No se recodifican imágenes, fuentes ni vectores: cero pérdida de calidad, sin importar cuántas veces se rote el documento.'
                    : 'Rotation only modifies the `/Rotate` field value in the page dictionary — an integer field in the PDF spec accepting values 0, 90, 180, and 270 degrees. Images, fonts, and vectors are never re-encoded: zero quality loss, regardless of how many times the document is rotated.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de rotación de páginas paso a paso' : 'Step-by-step technical page rotation procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor modifica el ángulo de orientación de cada página en el PDF' : 'How the engine modifies the orientation angle of each page in the PDF'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / CARGA', title: isEs ? '1. Deserialización del PDF' : '1. PDF Deserialization', desc: isEs ? 'pdf-lib deserializa el archivo PDF cargado en memoria, reconstruyendo su árbol de objetos (páginas, recursos, fuentes, imágenes) en estructuras JavaScript manejables en tiempo real.' : 'pdf-lib deserializes the loaded PDF file in memory, reconstructing its object tree (pages, resources, fonts, images) into manageable JavaScript structures in real time.' },
                { step: '02 / SELECCIÓN', title: isEs ? '2. Marcado de Páginas' : '2. Page Selection', desc: isEs ? 'El usuario selecciona páginas individuales o rangos completos usando miniaturas interactivas. Cada página marcada se registra con su número de índice para aplicar la rotación correspondiente.' : 'The user selects individual pages or complete ranges using interactive thumbnails. Each marked page is registered with its index number to apply the corresponding rotation.' },
                { step: '03 / ROTACIÓN', title: isEs ? '3. Modificación del Campo /Rotate' : '3. /Rotate Field Modification', desc: isEs ? 'pdf-lib actualiza el campo `/Rotate` en el diccionario de cada página seleccionada con el ángulo elegido (90°, 180°, 270°). Este es el único cambio binario aplicado — cero recodificación de contenido.' : 'pdf-lib updates the `/Rotate` field in each selected page dictionary with the chosen angle (90°, 180°, 270°). This is the only binary change applied — zero content re-encoding.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. PDF Rotado Listo' : '4. Rotated PDF Ready', desc: isEs ? 'Se serializa un nuevo PDF 1.7 estándar con los valores de rotación actualizados. El documento resultante abre correctamente en cualquier visor sin señales de degradación en imágenes ni texto.' : 'A new standard PDF 1.7 is serialized with updated rotation values. The resulting document opens correctly in any viewer with no image or text degradation signals.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">{item.step}</span>
                    <h3 className="font-bold text-white text-sm mb-2 font-sans">{item.title}</h3>
                    <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOQUE 3: OPCIONES DE ROTACIÓN */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <RotateCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Opciones de rotación y selección de páginas' : 'Rotation options and page selection'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Control completo sobre el ángulo y las páginas a rotar en el documento' : 'Complete control over the rotation angle and pages to rotate in the document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Ángulos de Rotación Disponibles' : 'Available Rotation Angles'}
                </strong>
                <p>
                  {isEs
                    ? 'Rota páginas exactamente 90° (sentido horario), 180° (inversión completa) o 270° (sentido antihorario). Los cuatro ángulos admitidos por la especificación PDF — 0°, 90°, 180° y 270° — se aplican directamente mediante el campo `/Rotate` sin interpolación de píxeles.'
                    : 'Rotate pages exactly 90° (clockwise), 180° (full inversion), or 270° (counterclockwise). All four angles supported by the PDF spec — 0°, 90°, 180°, and 270° — are applied directly via the `/Rotate` field without pixel interpolation.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Selección Granular de Páginas' : 'Granular Page Selection'}
                </strong>
                <p>
                  {isEs
                    ? 'Elige rotar todas las páginas a la vez, seleccionar páginas individuales mediante miniaturas interactivas, aplicar rotación solo a páginas pares o impares, o definir rangos específicos como "3-7, 12, 15-20" para documentos con orientación mixta.'
                    : 'Choose to rotate all pages at once, select individual pages via interactive thumbnails, apply rotation to even or odd pages only, or define specific ranges like "3-7, 12, 15-20" for documents with mixed orientation.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-white" />
                  {isEs ? 'Vista Previa en Tiempo Real' : 'Real-Time Preview'}
                </strong>
                <p>
                  {isEs
                    ? 'Las miniaturas de página reflejan la rotación aplicada en tiempo real antes de generar el PDF final. Puedes ajustar y corregir la orientación de cada página individualmente desde el visor interactivo sin necesidad de procesar el documento cada vez.'
                    : 'Page thumbnails reflect the applied rotation in real time before generating the final PDF. You can individually adjust and correct each page orientation from the interactive viewer without processing the document each time.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios del PDF con páginas rotadas' : 'Benefits of the PDF with rotated pages'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad lossless y compatibilidad garantizadas' : 'Lossless quality and compatibility guaranteed'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Calidad Lossless (Sin Pérdida)' : 'Lossless Quality (No Loss)', desc: isEs ? 'Solo el campo /Rotate cambia. Imágenes, vectores y texto permanecen bit a bit idénticos al original.' : 'Only the /Rotate field changes. Images, vectors, and text remain bit-for-bit identical to the original.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Rota cualquier número de páginas en documentos de cualquier tamaño sin restricciones.' : 'Rotate any number of pages in documents of any size without restrictions.' },
                { title: isEs ? 'Compatible con Adobe' : 'Adobe Compatible', desc: isEs ? 'El PDF resultante abre correctamente en Adobe Acrobat, Chrome, Edge, Foxit, iOS y Android.' : 'The resulting PDF opens correctly in Adobe Acrobat, Chrome, Edge, Foxit, iOS, and Android.' },
                { title: isEs ? 'Rotación Acumulable' : 'Stackable Rotation', desc: isEs ? 'Puedes volver a rotar el documento resultante sin ninguna degradación adicional.' : 'You can rotate the resulting document again without any additional degradation.' },
                { title: isEs ? 'Planos y Documentos Técnicos' : 'Blueprints & Technical Docs', desc: isEs ? 'Ideal para corregir la orientación de planos escaneados en A3/A0 o fotos de documentos.' : 'Ideal for correcting orientation of scanned A3/A0 blueprints or document photos.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. Toda la rotación ocurre en tu RAM local.' : 'Zero bytes sent to servers. All rotation happens in your local RAM.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold text-xs block mb-1 font-sans">{item.title}</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
