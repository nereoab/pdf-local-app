'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Check,
  X as XIcon,
  Scale,
  Briefcase,
  Layers,
  Sparkles,
  Sliders,
  PenTool,
  Lock,
  Eraser,
  Filter,
  Search,
  GraduationCap,
  Building2,
  Stamp,
  Fingerprint,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfSigner = dynamic(() => import('@/components/PdfSigner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor enterprise de firma digital PDF en memoria RAM...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function FirmarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Tiene validez jurídica una firma realizada en PDFBlack?',
          a: 'Sí. Las firmas electrónicas creadas en PDFBlack cumplen con las normativas internacionales de firma electrónica simple y avanzada (Reglamento eIDAS en la Unión Europea, ESIGN Act y UETA en Estados Unidos, y leyes homólogas en América Latina como la Ley 27269 en Perú o el Código de Comercio en México). Al registrar la intención indubitada del firmante, la fecha/hora exacta y un hash criptográfico SHA-256 que detecta cualquier alteración posterior, gozan de plena admisibilidad probatoria en sede judicial.',
        },
        {
          q: '¿Por qué PDFBlack es más seguro y privado que iLovePDF o Smallpdf para firmar contratos?',
          a: 'Las plataformas convencionales como iLovePDF o Smallpdf obligan a subir tus archivos a sus servidores en la nube para procesar la firma, lo que expone acuerdos de confidencialidad (NDA), balances financieros y contratos privados a riesgos de filtraciones de datos o accesos no autorizados. En cambio, PDFBlack funciona bajo una estricta arquitectura Zero-Knowledge: todo el renderizado, estampa de firma y cálculo criptográfico ocurren al 100% en la memoria RAM de tu navegador, garantizando que ningún documento salga jamás de tu equipo.',
        },
        {
          q: '¿Cómo funciona el removedor automático de fondo blanco en firmas fotografiadas?',
          a: 'Si firmas sobre una hoja de papel en blanco y le tomas una fotografía con tu teléfono móvil, suele quedar un rectángulo gris o blanco que tapa el texto del contrato al insertarlo. PDFBlack incluye un algoritmo local de visión artificial que detecta automáticamente los píxeles de papel claro y los vuelve 100% transparentes, preservando con nitidez únicamente los trazos de tinta del bolígrafo para que se integren de forma natural sobre el documento.',
        },
        {
          q: '¿Qué es el modo «Expediente + VoBo (Visto Bueno)» y para qué sirve?',
          a: 'En la práctica legal y corporativa, los contratos de varias páginas requieren la firma principal en la última hoja y una rúbrica o «Visto Bueno» en los márgenes de todas las hojas previas para evitar que alguna página intermedia sea sustituida fraudulentamente. PDFBlack automatiza este flujo: te permite estampar la firma completa en la página que elijas y generar de forma instantánea el sello de visto bueno (VoBo) con tus iniciales y fecha en todas las demás páginas del expediente.',
        },
        {
          q: '¿Qué representa el hash SHA-256 impreso en el sello de auditoría?',
          a: 'El hash SHA-256 es una huella dactilar digital criptográfica de 256 bits generada a partir del contenido binario del documento. Garantiza la integridad del archivo: si alguien intenta modificar aunque sea una sola coma, fecha o cláusula en el PDF firmado, el hash resultante cambiará por completo, evidenciando de inmediato la manipulación o adulteración del documento.',
        },
        {
          q: '¿Existe algún límite en la cantidad de firmas o páginas que puedo procesar gratis?',
          a: 'No. No imponemos cuotas diarias de firmas, no solicitamos tarjeta de crédito ni exigimos crear una cuenta. Puedes firmar contratos extensos de cientos de páginas con total libertad y sin marcas de agua publicitarias.',
        },
      ]
    : [
        {
          q: 'Is a digital signature created in PDFBlack legally binding?',
          a: 'Yes. Electronic signatures created in PDFBlack comply with international e-signature frameworks such as the EU eIDAS Regulation, the US ESIGN Act, and UETA. By capturing the unequivocal signer intent, timestamp, and a cryptographic SHA-256 document checksum to detect tampering, signed files are fully admissible in commercial transactions and legal proceedings.',
        },
        {
          q: 'Why is PDFBlack more secure and private than iLovePDF or Smallpdf for signing?',
          a: 'Traditional online tools upload your confidential documents to external cloud servers, exposing NDAs, contracts, and financial statements to third-party data breaches. PDFBlack operates on a strict Zero-Knowledge in-RAM architecture: all rendering, signature stamping, and cryptographic hashing take place directly inside your local browser sandbox.',
        },
        {
          q: 'How does the automatic white background remover work on photographed signatures?',
          a: 'If you sign on paper and snap a photo with your smartphone, PDFBlack uses an in-browser image filter that detects light paper pixels and makes them completely transparent. Only the pristine ink strokes are retained, seamlessly overlaying onto your contract without ugly white patches.',
        },
        {
          q: 'What is the "File + VoBo Initials" multi-page mode?',
          a: 'In corporate and legal practice, multi-page agreements require a full signature on the execution page and initials/VoBo on all other sheets to prevent page substitution. PDFBlack automates this: it stamps your full signature on the designated page and applies auditable initials across every other page with a single click.',
        },
        {
          q: 'What does the SHA-256 checksum on the audit stamp signify?',
          a: 'The SHA-256 hash is a 256-bit cryptographic digest of the document. It certifies document integrity: any subsequent tampering or alteration of even a single character will completely invalidate the checksum, immediately exposing unauthorized modifications.',
        },
        {
          q: 'Are there any limits on signatures or pages in the free version?',
          a: 'None. PDFBlack does not impose daily signing caps, paywalls, or mandatory sign-ups. You can sign contracts with hundreds of pages without evaluation banners or trial restrictions.',
        },
      ];

  // Esquemas JSON-LD
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs
      ? 'PDFBlack Firmar PDF — Motor Enterprise de Firma Digital'
      : 'PDFBlack Sign PDF — Enterprise Digital Signature Engine',
    url: isEs ? `${SITE_URL}/editar/firmar` : `${SITE_URL}/en/sign-pdf`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires modern browser with Web Workers & Web Crypto API support',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Firma manuscrita en lienzo digital con suavizado de trazo',
      'Generación tipográfica caligráfica con múltiples fuentes formales',
      'Subida de sellos e imágenes con eliminación automática de fondo blanco',
      'Sello de auditoría formal con hash criptográfico SHA-256',
      'Modo Expediente Legal con Rúbrica y Visto Bueno (VoBo) multi-página',
      'Procesamiento 100% en memoria RAM local con arquitectura Zero-Knowledge',
      'Sin registro obligatorio, sin marcas de agua publicitarias y sin límites',
    ],
    description:
      'Herramienta enterprise para firmar documentos y contratos PDF online gratis. Soporte para firmas manuscritas, tipográficas, sellos con hash SHA-256 y rúbricas multi-página en memoria RAM.',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEs ? 'Inicio' : 'Home',
        item: isEs ? SITE_URL : `${SITE_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEs ? 'Editar PDF' : 'Edit PDF',
        item: isEs ? `${SITE_URL}/editar` : `${SITE_URL}/en/edit`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Firmar PDF' : 'Sign PDF',
        item: isEs ? `${SITE_URL}/editar/firmar` : `${SITE_URL}/en/sign-pdf`,
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo firmar un documento PDF online gratis y seguro'
      : 'How to sign a PDF document online for free and securely',
    description: isEs
      ? 'Guía paso a paso para firmar digitalmente contratos, actas o expedientes PDF sin subir tus archivos a la nube.'
      : 'Step-by-step guide to digitally sign PDF contracts and records without uploading files to the cloud.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload your PDF document',
        text: isEs
          ? 'Arrastra tu archivo PDF al panel de carga. El archivo se abre instantáneamente en la memoria RAM de tu navegador sin transferirse a internet.'
          : 'Drag your PDF into the workspace. The file opens locally in your browser RAM with zero internet transfer.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Crear o seleccionar tu firma' : 'Create or select your signature',
        text: isEs
          ? 'Elige entre escribir tu nombre con tipografía caligráfica, dibujar tu trazo a mano alzada, subir una foto con transparencia de fondo blanco o generar un sello corporativo.'
          : 'Choose between typing your name in script, drawing your signature by hand, uploading a photo with automatic transparency, or generating an audit seal.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Posicionar y configurar el alcance' : 'Position and configure scope',
        text: isEs
          ? 'Arrastra la firma con el ratón al lugar exacto en la vista previa y selecciona si deseas firmar solo la página activa, todas las hojas o el modo expediente con Visto Bueno.'
          : 'Drag the signature to the exact spot on the wide preview and choose whether to sign the current page, all pages, or enable multi-page initials.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: isEs ? 'Firmar y descargar' : 'Sign and download',
        text: isEs
          ? 'Haz clic en «Firmar Documento PDF» para estampar la firma vectorial y el hash SHA-256. Descarga tu PDF certificado de inmediato.'
          : 'Click "Sign PDF Document" to stamp the vector signature and SHA-256 checksum. Download your certified PDF immediately.',
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="w-full px-3 sm:px-6 lg:px-8 pt-3 pb-16 sm:pt-4 sm:pb-20 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b] text-white">
        <div className="w-full max-w-7xl">
          <PdfSigner />
        </div>

        {/* ── LANDING EDUCATIVA Y CORPORATIVA SEO ENRIQUECIDA ── */}
        <div className="w-full max-w-5xl mt-16 sm:mt-20 space-y-16 sm:space-y-24 font-sans border-t border-zinc-800/80 pt-16">
          {/* 4 PILARES DE SEGURIDAD Y VALIDEZ LEGAL */}
          <section className="space-y-8 text-center">
            <div className="space-y-3 max-w-3xl mx-auto">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {isEs ? 'SEGURIDAD & CONFORMIDAD JURÍDICA' : 'SECURITY & LEGAL COMPLIANCE'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase">
                {isEs
                  ? 'Firma Digital Enterprise con Máxima Privacidad en RAM'
                  : 'Enterprise Digital Signature with In-RAM Zero-Knowledge'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono leading-relaxed">
                {isEs
                  ? 'Diseñado para bufetes de abogados, entidades financieras y corporaciones que no pueden comprometer la confidencialidad de sus contratos subiendo archivos a servidores de terceros.'
                  : 'Engineered for law firms, financial institutions, and enterprises that cannot compromise document confidentiality by transmitting contracts to external cloud servers.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left font-mono">
              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2 hover:border-zinc-600 transition-colors">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 w-fit rounded-xl text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Zero-Knowledge RAM' : 'Zero-Knowledge In-RAM'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Todo el procesamiento ocurre en Web Workers aislados en tu navegador. Los documentos nunca se transfieren a servidores externos.'
                    : 'All signature stamping and parsing execute inside client-side Web Workers. Files never touch third-party servers.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2 hover:border-zinc-600 transition-colors">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 w-fit rounded-xl text-cyan-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Hash Real SHA-256' : 'Real SHA-256 Digest'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Calcula mediante Web Crypto API una huella criptográfica de integridad del archivo, detectando cualquier adulteración posterior.'
                    : 'Computes real cryptographic checksums via Web Crypto API, safeguarding document integrity against post-signature tampering.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2 hover:border-zinc-600 transition-colors">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 w-fit rounded-xl text-emerald-400">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Validez eIDAS & ESIGN' : 'eIDAS & ESIGN Compliant'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Alineado con los estándares internacionales de firma electrónica simple y avanzada para contratos comerciales y acuerdos privados.'
                    : 'Compliant with international electronic signature legal frameworks for binding commercial agreements and private contracts.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2 hover:border-zinc-600 transition-colors">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 w-fit rounded-xl text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Modo Expediente & VoBo' : 'VoBo & Multi-Page Initials'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Estampa la firma en la página de cierre y rubrica con Visto Bueno todas las hojas intermedias para blindar el expediente.'
                    : 'Stamps primary signature on the execution page while initialing all other sheets to prevent page substitution.'}
                </p>
              </div>
            </div>
          </section>

          {/* TABLA COMPARATIVA DE BENCHMARK: PDFBLACK VS ILOVEPDF VS ADOBE ACROBAT SIGN */}
          <section className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'BENCHMARK Y COMPARATIVA TÉCNICA' : 'TECHNICAL BENCHMARK & COMPARISON'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? '¿Por qué PDFBlack Supera a las Soluciones Tradicionales?'
                  : 'Why PDFBlack Outperforms Legacy Signing Tools?'}
              </h2>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-3xl shadow-2xl bg-[#0f0f14] font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#15151c] text-[11px] text-zinc-300 uppercase">
                    <th className="p-4 sm:p-5 font-bold">
                      {isEs ? 'Característica / Capacidad' : 'Feature / Capability'}
                    </th>
                    <th className="p-4 sm:p-5 font-extrabold text-white bg-white/5 border-x border-zinc-800">
                      PDFBlack Enterprise
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-zinc-400">iLovePDF Sign</th>
                    <th className="p-4 sm:p-5 font-bold text-zinc-400">Adobe Acrobat Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Privacidad y Fuga de Contratos'
                        : 'Contract Privacy & Zero-Knowledge'}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold bg-white/5 border-x border-zinc-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? '100% Local en RAM (Zero Fugas)' : '100% Local In-RAM (Zero Leaks)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Sube archivos a servidores nube'
                          : 'Uploads files to cloud servers'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEs ? 'Nube obligatoria de Adobe' : 'Mandatory Adobe Cloud storage'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Filtro Transparente para Firmas en Papel'
                        : 'Auto White Background Transparency'}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold bg-white/5 border-x border-zinc-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Elimina fondo blanco en 1 clic)'
                          : 'Yes (Auto-removes white background)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'No (Crea recuadros blancos opacos)'
                          : 'No (Leaves opaque white boxes)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Solo en aplicación móvil de pago' : 'Paid mobile app only'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Modo Expediente & VoBo Multi-página'
                        : 'Multi-Page VoBo & Initials Workflow'}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold bg-white/5 border-x border-zinc-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Firma + Rúbrica en todas las hojas)'
                          : 'Yes (Full signature + VoBo on rest)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Manual hoja por hoja o plan de pago'
                          : 'Manual per page or paid plan'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEs ? 'Requiere suscripción Enterprise' : 'Requires Enterprise tier'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Sello Criptográfico SHA-256 e Integridad'
                        : 'Cryptographic SHA-256 Audit Seal'}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold bg-white/5 border-x border-zinc-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Calculado y estampado gratis)'
                          : 'Yes (Computed & stamped for free)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>{isEs ? 'No en versión gratuita' : 'Not available on free tier'}</span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Con costo por transacción)'
                          : 'Yes (With per-transaction cost)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Límites de Uso y Registro Obligatorio'
                        : 'Usage Limits & Mandatory Registration'}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold bg-white/5 border-x border-zinc-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Ilimitado • Sin registro • 100% Gratis'
                          : 'Unlimited • No Signup • 100% Free'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Límite diario y registro exigido' : 'Daily caps & forced sign-up'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Suscripción mensual obligatoria'
                          : 'Mandatory monthly subscription'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 CASOS DE USO EMPRESARIAL */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'APLICACIONES PROFESIONALES' : 'PROFESSIONAL USE CASES'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs ? 'Casos de Uso Corporativo y Legal' : 'Corporate & Legal Practice'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase text-white">
                      {isEs
                        ? 'Contratos Comerciales & Acuerdos NDA'
                        : 'Commercial Contracts & NDAs'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Formalización privada sin exposición a terceros'
                        : 'Private execution with zero cloud leaks'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Firma acuerdos de confidencialidad, órdenes de compra y contratos de prestación de servicios con plena validez mercantil y la tranquilidad de que ningún dato estratégico sale de tu ordenador.'
                    : 'Execute non-disclosure agreements, purchase orders, and vendor service contracts with binding enforceability and zero cloud exposure.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase text-white">
                      {isEs
                        ? 'Expedientes Notariales & Judiciales'
                        : 'Notarial & Legal Court Records'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Firma protocolar con rúbrica y VoBo en cada hoja'
                        : 'Protocol signing with initials on each sheet'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Aplica el modo expediente para estampar la firma principal en la foja de otorgamiento y generar automáticamente el sello de visto bueno en los márgenes de todas las hojas previas.'
                    : 'Use the legal file mode to stamp your full signature on the final attestation sheet while applying consistent initials across all preceding exhibits.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase text-white">
                      {isEs
                        ? 'Recursos Humanos & Contratos Laborales'
                        : 'Human Resources & Employment'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Nóminas, altas y finiquitos con sello auditado'
                        : 'Payroll, onboarding & discharge letters'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Agiliza la suscripción de contratos de trabajo, addendums y recibos de salarios incorporando el sello de auditoría con fecha y cargo del responsable de personal.'
                    : 'Accelerate employment agreements, salary receipts, and addendums incorporating auditable timestamp badges and HR title metadata.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase text-white">
                      {isEs
                        ? 'Sector Inmobiliario & Arrendamientos'
                        : 'Real Estate & Lease Agreements'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Contratos de alquiler, arras y reservas'
                        : 'Lease contracts, deposits & property reservations'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Formaliza contratos de arrendamiento y actas de entrega de llaves inmediatamente entre propietarios e inquilinos desde cualquier ordenador o tablet.'
                    : 'Finalize residential lease contracts and handover protocols immediately between owners and tenants across any desktop or tablet.'}
                </p>
              </div>
            </div>
          </section>

          {/* ACORDEÓN INTERACTIVO DE PREGUNTAS FRECUENTES (FAQ) */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center justify-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                {isEs ? 'PREGUNTAS FRECUENTES' : 'FREQUENTLY ASKED QUESTIONS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Todo lo que Necesitas Saber sobre Firmar PDF'
                  : 'Everything You Need to Know About PDF Signatures'}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-3 font-mono">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-[#121217] border border-zinc-800 rounded-2xl overflow-hidden transition-colors hover:border-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-white font-sans">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-zinc-400 font-mono leading-relaxed border-t border-zinc-800/60">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
