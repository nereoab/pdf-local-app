'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, EyeOff, CheckCircle2, Lock, Sparkles, Search, FileCheck } from 'lucide-react';
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
                  {isEs ? '¿Qué sucede exactamente con tus archivos al censurarlos?' : 'What exactly happens to your files when redacted?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • CENSURA PERMANENTE • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • PERMANENT REDACTION • 100% LOCAL'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tus documentos nunca salen de tu dispositivo' : 'Your documents never leave your device'}
                </strong>
                <p>
                  {isEs
                    ? 'El proceso de censura se ejecuta completamente dentro de la memoria RAM de tu navegador mediante pdf-lib. Ningún fragmento de texto, imagen o metadato del documento sale de tu equipo local, garantizando confidencialidad absoluta para expedientes médicos, contratos legales o datos financieros.'
                    : 'The redaction process runs entirely inside your browser RAM via pdf-lib. No text fragment, image, or metadata from the document leaves your local machine, ensuring absolute confidentiality for medical records, legal contracts, or financial data.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Parches irrecuperables — no solo ocultos' : 'Unrecoverable patches — not just hidden'}
                </strong>
                <p>
                  {isEs
                    ? 'Los parches negros no son una capa superpuesta ni un simple ocultamiento. Se incrustan directamente en el stream de objetos del PDF, sobreescribiendo permanentemente el contenido subyacente. El texto censurado no puede recuperarse con herramientas de extracción, OCR ni forenses digitales.'
                    : 'Black patches are not a floating overlay or simple hide. They are embedded directly in the PDF object stream, permanently overwriting the underlying content. Redacted text cannot be recovered with extraction tools, OCR, or digital forensics.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de censura paso a paso' : 'Step-by-step technical redaction procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor dibuja parches permanentes sobre el contenido sensible del PDF' : 'How our engine draws permanent patches over sensitive PDF content'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / SELECCIÓN</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Marcado de Áreas Sensibles' : '1. Sensitive Area Marking'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'El usuario marca con el cursor las regiones a censurar sobre el visor del PDF. Cada área se registra con coordenadas precisas de página, origen X/Y, ancho y alto en unidades PDF.'
                      : 'The user marks regions to redact over the PDF viewer. Each area is registered with precise page coordinates, X/Y origin, width, and height in PDF units.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / BÚSQUEDA</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Detección por Categoría' : '2. Category-Based Detection'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'El motor extrae el texto del PDF y aplica expresiones regulares para detectar automáticamente patrones como correos electrónicos, teléfonos, tarjetas de crédito o palabras clave personalizadas.'
                      : 'The engine extracts PDF text and applies regex patterns to automatically detect emails, phone numbers, credit cards, or custom keywords across all pages.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / PINTURA</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Pintado de Rectángulos Negros' : '3. Black Rectangle Painting'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'pdf-lib escribe operadores de dibujo PDF (`re f`) directamente en el stream de contenido de cada página, incrustando rectángulos negros sólidos que sobreescriben el contenido subyacente de forma permanente.'
                      : 'pdf-lib writes PDF drawing operators (`re f`) directly into each page content stream, embedding solid black rectangles that permanently overwrite the underlying content.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">04 / EMPAQUETADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '4. PDF Censurado Resultante' : '4. Redacted PDF Output'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Se genera un nuevo documento PDF 1.7 estándar con los parches negros integrados definitivamente en los streams de cada página, completamente abierto en cualquier visor sin metadatos de censura reversibles.'
                      : 'Generates a new standard PDF 1.7 with black patches permanently integrated into each page stream, fully readable in any viewer with no reversible redaction metadata.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: MOTOR DE DETECCIÓN Y CATEGORÍAS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El Motor de Detección: ¿Cómo identifica datos sensibles automáticamente?' : 'The Detection Engine: How does it identify sensitive data automatically?'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Sistema de expresiones regulares y análisis semántico de patrones privados' : 'Regex system and semantic analysis of private data patterns'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-white" />
                  {isEs ? 'Patrones de Datos Personales' : 'Personal Data Patterns'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor incluye expresiones regulares precompiladas para detectar correos electrónicos (RFC 5322), números de teléfono internacionales (+XX XXX XXX XXXX), NIFs, DNIs, números de pasaporte y fechas de nacimiento en múltiples formatos.'
                    : 'The engine includes precompiled regex patterns to detect RFC 5322 emails, international phone numbers, NIDs, passports, and birth dates in multiple formats across the entire document.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-white" />
                  {isEs ? 'Datos Financieros y Bancarios' : 'Financial & Banking Data'}
                </strong>
                <p>
                  {isEs
                    ? 'Detecta automáticamente números de tarjetas de crédito/débito (Luhn), IBANs bancarios, CVV/CVC, montos monetarios con símbolo de divisa y números de cuenta de 10 a 18 dígitos presentes en extractos, facturas o contratos.'
                    : 'Automatically detects Luhn-valid credit/debit card numbers, IBANs, CVV/CVC codes, monetary amounts with currency symbols, and 10–18 digit account numbers in statements, invoices, or contracts.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Búsqueda por Palabra Clave' : 'Keyword Search Redaction'}
                </strong>
                <p>
                  {isEs
                    ? 'Puedes introducir palabras clave personalizadas — nombres, cargos, números de expediente o términos contractuales — y el motor censurará todas las ocurrencias en el documento completo de forma automática.'
                    : 'Enter custom keywords — names, job titles, dossier numbers, or contractual terms — and the engine will automatically redact all occurrences throughout the entire document.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS DEL PDF CENSURADO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <EyeOff className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios y garantías del PDF censurado resultante' : 'Benefits and guarantees of the resulting redacted PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Estándares de seguridad y permanencia de la censura aplicada' : 'Security standards and permanence of the applied redaction'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Censura Irrecuperable' : 'Unrecoverable Redaction'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Los parches sobreescriben permanentemente el contenido. No hay capa reversible ni metadatos ocultos.' : 'Patches permanently overwrite content. No reversible layer or hidden metadata exists.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Resistente a OCR y Forense' : 'OCR & Forensic Resistant'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'El contenido censurado no puede recuperarse con ninguna herramienta de extracción ni análisis forense.' : 'Redacted content cannot be recovered by any extraction tool or forensic analysis.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'El PDF censurado abre correctamente en Adobe, Chrome, Edge, iOS y Android.' : 'Redacted PDF opens correctly in Adobe, Chrome, Edge, iOS, and Android.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Detección por Categorías' : 'Category Auto-Detection'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Censura automática de emails, teléfonos, tarjetas de crédito y palabras clave.' : 'Automatic redaction of emails, phones, credit cards, and keywords.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Cumplimiento GDPR / HIPAA' : 'GDPR / HIPAA Compliance'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Protección legal de datos personales conforme a normativas europeas y sanitarias.' : 'Legal personal data protection compliant with EU and healthcare regulations.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Privacidad Corporativa Total' : 'Total Corporate Privacy'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Cero bytes enviados a servidores. Todo se procesa en tu RAM local.' : 'Zero bytes sent to servers. Everything is processed in your local RAM.'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
