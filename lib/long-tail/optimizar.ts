import { LongTailSolution } from './types';

export const OPTIMIZAR_SOLUTIONS_ES: Record<string, LongTailSolution> = {
  'comprimir-pdf-para-correo-gmail': {
    slug: 'comprimir-pdf-para-correo-gmail',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Límite 25 MB de Correo',
    h1: 'Comprimir PDF para Enviar por Correo o Gmail — Menos de 5 MB o 10 MB',
    subtitle:
      'Reduce archivos PDF pesados para que no reboten en Gmail, Outlook o Yahoo Mail. Optimiza imágenes y flujos internos manteniendo texto y firmas perfectamente legibles.',
    metaTitle: 'Comprimir PDF para Enviar por Correo o Gmail Online Gratis | PDFBlack',
    metaDescription:
      'Reduce el tamaño de tu PDF para adjuntarlo sin problemas en Gmail, Outlook o webmail. 100% privado en tu navegador, sin límites de subida.',
    keywords: [
      'comprimir pdf para enviar por correo',
      'reducir pdf para gmail',
      'comprimir pdf para outlook',
      'bajar peso a pdf para adjuntar',
      'comprimir pdf a menos de 10mb',
    ],
    parentPath: '/optimizar/comprimir',
    parentName: 'Comprimir PDF',
    specifications: [
      {
        feature: 'Límite estándar',
        value: '≤ 10 MB / 5 MB',
        note: 'Pasa holgadamente el tope de 25 MB de Gmail',
      },
      {
        feature: 'Tecnología',
        value: 'Deflate Nivel 9 + Resampling',
        note: 'Equilibrio perfecto entre nitidez y ligereza',
      },
      {
        feature: 'Seguridad',
        value: '100% Local en RAM',
        note: 'Adjuntos confidenciales nunca tocan la nube',
      },
      {
        feature: 'Compatibilidad',
        value: 'Móviles y computadoras',
        note: 'Se visualiza perfecto en la app de correo',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Arrastra tu PDF pesado',
        desc: 'Carga el documento de 20 MB o más que fue rechazado por el correo.',
      },
      {
        step: 2,
        title: 'Selecciona compresión recomendada',
        desc: 'El algoritmo ajusta la densidad de imágenes sin degradar el texto.',
      },
      {
        step: 3,
        title: 'Descarga y adjunta',
        desc: 'Obtén un archivo ligero listo para enviar sin recurrir a enlaces de Google Drive.',
      },
    ],
    benefits: [
      {
        title: 'Evita Enlaces Externos de Drive o WeTransfer',
        desc: 'Tus destinatarios recibirán el archivo adjunto directamente en su bandeja.',
      },
      {
        title: 'Apertura Rápida en Celulares',
        desc: 'Permite que clientes con redes móviles descarguen el documento en un segundo.',
      },
    ],
    faqs: [
      {
        q: '¿Cuánto puede reducirse el tamaño de un documento típico?',
        a: 'En documentos con imágenes escaneadas o catálogos, la reducción suele ser del 60% al 85%.',
      },
      {
        q: '¿El texto o las firmas escaneadas se vuelven borrosos?',
        a: 'No. El texto vectorial no se altera y las firmas se preservan con contraste nítido.',
      },
    ],
    relatedSolutions: ['comprimir-pdf-a-200kb', 'comprimir-pdf-a-1mb', 'reparar-pdf-danado'],
    esEquivalentSlug: 'comprimir-pdf-para-correo-gmail',
    enEquivalentSlug: 'compress-pdf-for-email-attachment',
  },

  'proteger-pdf-con-contrasena-sin-subir-a-nube': {
    slug: 'proteger-pdf-con-contrasena-sin-subir-a-nube',
    category: 'optimizar',
    toolKey: 'proteger',
    badge: 'Cifrado Grado Militar AES-256',
    h1: 'Proteger PDF con Contraseña sin Subir Archivos a Servidores — 100% Offline',
    subtitle:
      'Cifra estados de cuenta, nóminas, contratos o datos personales con el estándar bancario AES-256 conforme a ISO 32000-2. Máxima privacidad garantizada por Web Crypto API.',
    metaTitle: 'Proteger PDF con Contraseña Online Gratis y Seguro | PDFBlack',
    metaDescription:
      'Bloquea y cifra tus archivos PDF con contraseña segura AES-256. Todo se procesa en la memoria RAM de tu navegador, garantizando confidencialidad absoluta.',
    keywords: [
      'proteger pdf con contrasena',
      'cifrar pdf aes 256 gratis',
      'poner clave a pdf sin subir a internet',
      'proteger documento pdf confidencial',
      'bloquear apertura de pdf',
    ],
    parentPath: '/optimizar/proteger',
    parentName: 'Proteger PDF',
    specifications: [
      {
        feature: 'Algoritmo de cifrado',
        value: 'AES-256 bits (V=5 R=6)',
        note: 'Conforme a especificación ISO 32000-2 (PDF 2.0)',
      },
      {
        feature: 'Derivación de clave',
        value: 'Algoritmo 2.B Hardened',
        note: 'Protegido contra ataques de fuerza bruta',
      },
      {
        feature: 'Almacenamiento',
        value: 'Cero retención en servidores',
        note: 'Tu contraseña nunca viaja por internet',
      },
      {
        feature: 'Compatibilidad',
        value: 'Adobe Acrobat, Foxit, Visores OS',
        note: 'Exige clave de apertura en cualquier plataforma',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento a proteger',
        desc: 'Arrastra el balance, nómina o contrato sensible.',
      },
      {
        step: 2,
        title: 'Define una contraseña segura',
        desc: 'Escribe tu clave de apertura con letras, números y símbolos.',
      },
      {
        step: 3,
        title: 'Descarga el PDF cifrado',
        desc: 'Obtén tu documento protegido con candado criptográfico inviolable.',
      },
    ],
    benefits: [
      {
        title: 'Cumplimiento Legal y RGPD',
        desc: 'Envía información bancaria o médica cumpliendo estrictas regulaciones de privacidad.',
      },
      {
        title: 'Inmune a Filtraciones en la Nube',
        desc: 'A diferencia de otros convertidores, ningún hacker puede interceptar el archivo en servidores ajenos.',
      },
    ],
    faqs: [
      {
        q: '¿Qué pasa si olvido la contraseña asignada?',
        a: 'Debido a la seguridad criptográfica de AES-256, no existe puerta trasera. Guarda tu clave en un lugar seguro.',
      },
      {
        q: '¿Se requiere software especial para abrir el archivo protegido?',
        a: 'No. Se abre con cualquier lector de PDF estándar (Chrome, Edge, Adobe Acrobat, iPhone, Android) solicitando la clave.',
      },
    ],
    relatedSolutions: [
      'desbloquear-pdf-para-imprimir-o-copiar',
      'censurar-datos-personales-pdf',
      'firmar-pdf-sin-imprimir',
    ],
    esEquivalentSlug: 'proteger-pdf-con-contrasena-sin-subir-a-nube',
    enEquivalentSlug: 'encrypt-confidential-pdf-aes256-offline',
  },

  'desbloquear-pdf-para-imprimir-o-copiar': {
    slug: 'desbloquear-pdf-para-imprimir-o-copiar',
    category: 'optimizar',
    toolKey: 'desbloquear',
    badge: 'Liberación de Permisos',
    h1: 'Desbloquear PDF para Imprimir o Copiar Texto — Quitar Restricciones',
    subtitle:
      'Elimina restricciones de impresión deshabilitada, bloqueo de selección de texto y permisos de edición en documentos PDF cuando conoces la clave o el archivo tiene bloqueo de propietario.',
    metaTitle: 'Desbloquear PDF para Imprimir y Copiar Texto Online Gratis | PDFBlack',
    metaDescription:
      'Quita restricciones de impresión y copiado en archivos PDF protegidos al instante. Procesamiento 100% privado en tu navegador sin registro.',
    keywords: [
      'desbloquear pdf para imprimir',
      'quitar proteccion de impresion pdf',
      'habilitar copiado de texto en pdf',
      'quitar contrasena de permisos pdf',
      'desbloquear pdf protegido online',
    ],
    parentPath: '/optimizar/desbloquear',
    parentName: 'Desbloquear PDF',
    specifications: [
      {
        feature: 'Permisos habilitados',
        value: 'Impresión + Copia de texto',
        note: 'Restaura acceso completo al contenido',
      },
      {
        feature: 'Ejecución',
        value: 'En memoria local (WASM)',
        note: 'Sin transferir documentos a servidores externos',
      },
      {
        feature: 'Velocidad',
        value: 'Instantáneo (< 2 segundos)',
        note: 'Sin tiempos de espera ni límites por hora',
      },
      {
        feature: 'Integridad',
        value: '100% Conservado',
        note: 'No se altera el formateo ni los gráficos originales',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Sube tu documento restringido',
        desc: 'Arrastra el PDF que no te permite imprimir o seleccionar texto.',
      },
      {
        step: 2,
        title: 'Autentica permisos si aplica',
        desc: 'Ingresa la clave si el archivo cuenta con cifrado estándar.',
      },
      {
        step: 3,
        title: 'Descarga el PDF liberado',
        desc: 'Imprime, copia fragmentos de texto o anota en el archivo sin trabas.',
      },
    ],
    benefits: [
      {
        title: 'Impresión Inmediata de Guías y Facturas',
        desc: 'Soluciona documentos de bancos o proveedores que bloquean el botón de impresión.',
      },
      {
        title: 'Extracción Fácil de Citas y Datos',
        desc: 'Copia tablas y párrafos para elaborar informes sin tener que transcribirlos a mano.',
      },
    ],
    faqs: [
      {
        q: '¿Es legal desbloquear restricciones de un PDF?',
        a: 'Sí, siempre que seas el propietario del documento o cuentes con autorización para utilizar su contenido.',
      },
      {
        q: '¿Se deteriora la calidad visual al quitar la protección?',
        a: 'No. El documento conserva la resolución y tipografía exacta original.',
      },
    ],
    relatedSolutions: [
      'proteger-pdf-con-contrasena-sin-subir-a-nube',
      'editar-texto-pdf-sin-desconfigurar',
      'convertir-pdf-a-word-editable',
    ],
    esEquivalentSlug: 'desbloquear-pdf-para-imprimir-o-copiar',
    enEquivalentSlug: 'unlock-pdf-print-copy-permissions',
  },

  'comparar-dos-versiones-contrato-pdf': {
    slug: 'comparar-dos-versiones-contrato-pdf',
    category: 'optimizar',
    toolKey: 'comparar',
    badge: 'Auditoría Legal de Cláusulas',
    h1: 'Comparar Dos Versiones de un Contrato en PDF — Detectar Diferencias',
    subtitle:
      'Encuentra al instante cláusulas añadidas, textos eliminados o cambios numéricos sutiles entre dos versiones de contratos, términos de servicio o especificaciones técnicas.',
    metaTitle: 'Comparar Dos Archivos PDF Online Gratis — Diferencias de Contratos | PDFBlack',
    metaDescription:
      'Compara dos documentos PDF lado a lado y resalta cambios en el texto y formato al instante. 100% privado para contratos y acuerdos confidenciales.',
    keywords: [
      'comparar dos versiones contrato pdf',
      'comparar dos pdf online diferencias',
      'resaltar cambios entre dos pdf',
      'comparador de contratos pdf gratis',
      'encontrar diferencias en documentos pdf',
    ],
    parentPath: '/optimizar/comparar',
    parentName: 'Comparar PDF',
    specifications: [
      {
        feature: 'Modo de comparación',
        value: 'Visual lado a lado + Overlay',
        note: 'Detecta modificaciones tipográficas y espaciales',
      },
      {
        feature: 'Privacidad',
        value: 'Zero-Trust client-side',
        note: 'Acuerdos NDA y contratos protegidos contra miradas ajenas',
      },
      {
        feature: 'Sensibilidad',
        value: 'Modificación de caracteres y cifras',
        note: 'Identifica cambios en precios, fechas y nombres',
      },
      {
        feature: 'Navegación',
        value: 'Desplazamiento sincronizado',
        note: 'Permite auditar ambas versiones simultáneamente',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga la versión original',
        desc: 'Arrastra el borrador inicial o contrato previo.',
      },
      {
        step: 2,
        title: 'Carga la versión modificada',
        desc: 'Arrastra el nuevo documento remitido por la contraparte.',
      },
      {
        step: 3,
        title: 'Revisa las diferencias resaltadas',
        desc: 'Visualiza rápidamente qué cláusulas o montos sufrieron variaciones.',
      },
    ],
    benefits: [
      {
        title: 'Evita Sorpresas de Última Hora',
        desc: 'Detecta párrafos modificados maliciosamente antes de firmar un acuerdo legal.',
      },
      {
        title: 'Ahorro de Horas de Lectura',
        desc: 'Enfoca la revisión exclusivamente en los cambios reales en vez de releer 50 páginas.',
      },
    ],
    faqs: [
      {
        q: '¿Se detectan cambios si se modificó el espaciado o salto de línea?',
        a: 'Sí. El motor de comparación geométrica y textual identifica reacomodos de párrafo.',
      },
      {
        q: '¿Es seguro para contratos con acuerdos de confidencialidad (NDA)?',
        a: 'Totalmente seguro. Ningún byte abandona tu computadora; el análisis ocurre en memoria local.',
      },
    ],
    relatedSolutions: [
      'censurar-datos-personales-pdf',
      'firmar-pdf-sin-imprimir',
      'editar-texto-pdf-sin-desconfigurar',
    ],
    esEquivalentSlug: 'comparar-dos-versiones-contrato-pdf',
    enEquivalentSlug: 'compare-two-pdf-contract-versions',
  },
};

export const OPTIMIZAR_SOLUTIONS_EN: Record<string, LongTailSolution> = {
  'compress-pdf-for-email-attachment': {
    slug: 'compress-pdf-for-email-attachment',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: '25 MB Email Size Cap',
    h1: 'Compress PDF for Email & Gmail — Reduce Below 5 MB or 10 MB',
    subtitle:
      'Downsize bulky PDF documents to bypass attachment rejection on Gmail, Outlook, or Yahoo Mail. Optimizes images and internal streams while keeping text and signatures razor-sharp.',
    metaTitle: 'Compress PDF for Email and Gmail Online Free | PDFBlack',
    metaDescription:
      'Reduce PDF file size to attach easily in Gmail, Outlook, or webmail. 100% client-side privacy in your browser with zero upload limits.',
    keywords: [
      'compress pdf for email',
      'reduce pdf size for gmail',
      'compress pdf for outlook attachment',
      'shrink pdf for email free',
      'compress pdf below 10mb',
    ],
    parentPath: '/en/compress-pdf',
    parentName: 'Compress PDF',
    specifications: [
      {
        feature: 'Target File Size',
        value: '≤ 10 MB / 5 MB',
        note: 'Easily complies with Gmail’s 25 MB hard limit',
      },
      {
        feature: 'Technology',
        value: 'Deflate Level 9 + Resampling',
        note: 'Optimal balance between sharpness and small footprint',
      },
      {
        feature: 'Privacy',
        value: '100% Local in RAM',
        note: 'Confidential attachments never touch remote servers',
      },
      {
        feature: 'Compatibility',
        value: 'Desktops, tablets & mobile',
        note: 'Renders immediately in default email viewer apps',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload your heavy PDF',
        desc: 'Drop the 20 MB+ file that was rejected by your email client.',
      },
      {
        step: 2,
        title: 'Choose recommended compression',
        desc: 'The algorithm adjusts image density without degrading vector text.',
      },
      {
        step: 3,
        title: 'Download and attach',
        desc: 'Get a lightweight PDF ready to send directly as an inline attachment.',
      },
    ],
    benefits: [
      {
        title: 'Skip External Google Drive / WeTransfer Links',
        desc: 'Recipients get the file directly in their inbox without third-party download links.',
      },
      {
        title: 'Instant Mobile Downloads',
        desc: 'Enables mobile colleagues to open attachments on cellular data in under a second.',
      },
    ],
    faqs: [
      {
        q: 'How much size reduction can I expect?',
        a: 'Documents with scanned graphics or high-res photos typically shrink by 60% to 85%.',
      },
      {
        q: 'Will signatures or small legal text become blurry?',
        a: 'No. Vector typography remains unrasterized and signatures retain crisp contrast.',
      },
    ],
    relatedSolutions: ['compress-pdf-to-200kb', 'compress-pdf-to-1mb', 'repair-corrupted-pdf-file'],
    esEquivalentSlug: 'comprimir-pdf-para-correo-gmail',
    enEquivalentSlug: 'compress-pdf-for-email-attachment',
  },

  'encrypt-confidential-pdf-aes256-offline': {
    slug: 'encrypt-confidential-pdf-aes256-offline',
    category: 'optimizar',
    toolKey: 'proteger',
    badge: 'Military-Grade AES-256 Encryption',
    h1: 'Password Protect PDF Without Uploading to Cloud — 100% Offline Security',
    subtitle:
      'Lock bank statements, payroll rosters, trade secrets, or client files with banking-grade AES-256 encryption compliant with ISO 32000-2. Maximum privacy guaranteed via Web Crypto API.',
    metaTitle: 'Password Protect PDF Online Free & Secure | PDFBlack',
    metaDescription:
      'Encrypt and lock PDF documents with military-grade AES-256 passwords. 100% private in-browser execution with zero cloud storage.',
    keywords: [
      'password protect pdf offline',
      'encrypt pdf aes 256 free',
      'secure pdf without cloud upload',
      'lock confidential pdf file',
      'add open password to pdf',
    ],
    parentPath: '/en/protect-pdf',
    parentName: 'Protect PDF',
    specifications: [
      {
        feature: 'Cipher Algorithm',
        value: 'AES-256 bits (V=5 R=6)',
        note: 'Compliant with ISO 32000-2 (PDF 2.0) specifications',
      },
      {
        feature: 'Key Derivation',
        value: 'Hardened Algorithm 2.B',
        note: 'Resistant against brute-force and dictionary attacks',
      },
      {
        feature: 'Storage Security',
        value: 'Zero server retention',
        note: 'Your passphrase never travels over the web',
      },
      {
        feature: 'Compatibility',
        value: 'Adobe Acrobat, Foxit, OS Viewers',
        note: 'Enforces password prompt across all platforms',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Load file to protect',
        desc: 'Drag the sensitive balance sheet, contract, or payroll file.',
      },
      {
        step: 2,
        title: 'Set strong password',
        desc: 'Choose a robust passphrase with numbers, letters, and symbols.',
      },
      {
        step: 3,
        title: 'Download encrypted PDF',
        desc: 'Save your file locked with unyielding cryptographic protection.',
      },
    ],
    benefits: [
      {
        title: 'HIPAA & GDPR Compliance',
        desc: 'Share medical or financial records while strictly meeting regulatory obligations.',
      },
      {
        title: 'Immune to Cloud Breaches',
        desc: 'Unlike cloud tools, no hacker can intercept your files from third-party servers.',
      },
    ],
    faqs: [
      {
        q: 'What happens if I forget the password?',
        a: 'Because AES-256 encryption has no backdoor, keep your password in a secure password manager.',
      },
      {
        q: 'Does the recipient need special software to open the file?',
        a: 'No. Any standard PDF reader (Chrome, Edge, Adobe Acrobat, iOS, Android) prompts for the password natively.',
      },
    ],
    relatedSolutions: [
      'unlock-pdf-print-copy-permissions',
      'redact-pdf-free-permanently',
      'sign-pdf-online-without-printing',
    ],
    esEquivalentSlug: 'proteger-pdf-con-contrasena-sin-subir-a-nube',
    enEquivalentSlug: 'encrypt-confidential-pdf-aes256-offline',
  },

  'unlock-pdf-print-copy-permissions': {
    slug: 'unlock-pdf-print-copy-permissions',
    category: 'optimizar',
    toolKey: 'desbloquear',
    badge: 'Permission Restriction Removal',
    h1: 'Unlock PDF to Print & Copy Text — Remove Owner Restrictions',
    subtitle:
      'Remove disabled print buttons, text copy restrictions, and editing lockouts from PDF documents when you know the password or when restricted by owner permissions.',
    metaTitle: 'Unlock PDF for Printing and Copying Text Online Free | PDFBlack',
    metaDescription:
      'Remove print and copy restrictions from secured PDF documents instantly. 100% private in-browser processing with zero account signup.',
    keywords: [
      'unlock pdf to print',
      'remove pdf print restrictions',
      'enable text copying in pdf',
      'remove owner password from pdf',
      'unlock secured pdf online free',
    ],
    parentPath: '/en/unlock-pdf',
    parentName: 'Unlock PDF',
    specifications: [
      {
        feature: 'Permissions Restored',
        value: 'High-res printing + Text copy',
        note: 'Restores complete control over content',
      },
      {
        feature: 'Processing',
        value: 'Client-side RAM (WASM)',
        note: 'No data transmitted to external servers',
      },
      {
        feature: 'Speed',
        value: 'Sub-second (< 2 seconds)',
        note: 'Zero waiting queues or hourly limits',
      },
      {
        feature: 'Integrity',
        value: '100% Preserved',
        note: 'Layout, typography, and graphics remain unchanged',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload restricted PDF',
        desc: 'Drop the document that prevents you from printing or selecting text.',
      },
      {
        step: 2,
        title: 'Authenticate if required',
        desc: 'Provide the password if the file uses standard password protection.',
      },
      {
        step: 3,
        title: 'Download unlocked file',
        desc: 'Print, copy quotes, or annotate freely without software restrictions.',
      },
    ],
    benefits: [
      {
        title: 'Immediate Printing of Invoices & Tickets',
        desc: 'Print banking records or airline tickets that gray out your print menu.',
      },
      {
        title: 'Extract Citations Without Retyping',
        desc: 'Copy tables and paragraphs directly into your research documents.',
      },
    ],
    faqs: [
      {
        q: 'Is it legal to remove restrictions from a PDF?',
        a: 'Yes, provided you own the document or have permission from the author to use its content.',
      },
      {
        q: 'Does unlocking degrade visual document quality?',
        a: 'No. Font definitions and image streams remain completely unaltered.',
      },
    ],
    relatedSolutions: [
      'encrypt-confidential-pdf-aes256-offline',
      'edit-pdf-text-without-formatting-loss',
      'convert-pdf-to-editable-word-doc',
    ],
    esEquivalentSlug: 'desbloquear-pdf-para-imprimir-o-copiar',
    enEquivalentSlug: 'unlock-pdf-print-copy-permissions',
  },

  'compare-two-pdf-contract-versions': {
    slug: 'compare-two-pdf-contract-versions',
    category: 'optimizar',
    toolKey: 'comparar',
    badge: 'Legal Contract Audit',
    h1: 'Compare Two PDF Contract Versions — Instantly Spot Differences',
    subtitle:
      'Instantly detect added clauses, removed conditions, or subtle numerical discrepancies between two revisions of legal contracts, terms of service, or technical specs.',
    metaTitle: 'Compare Two PDF Files Online Free — Contract Diff Tool | PDFBlack',
    metaDescription:
      'Compare two PDF documents side by side and highlight textual and layout differences instantly. 100% confidential for legal agreements.',
    keywords: [
      'compare two pdf contract versions',
      'compare two pdf files online free',
      'highlight differences between two pdfs',
      'contract diff tool online',
      'spot changes in legal pdf',
    ],
    parentPath: '/en/compare-pdf',
    parentName: 'Compare PDF',
    specifications: [
      {
        feature: 'Comparison Mode',
        value: 'Side-by-side + Overlay',
        note: 'Spots typographical and spatial alterations',
      },
      {
        feature: 'Confidentiality',
        value: 'Zero-Trust client-side',
        note: 'NDAs and contracts protected from prying eyes',
      },
      {
        feature: 'Precision',
        value: 'Character & numeral sensitivity',
        note: 'Identifies changes in pricing, dates, and names',
      },
      {
        feature: 'Navigation',
        value: 'Synchronized dual-scroll',
        note: 'Audit both document versions simultaneously',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload original revision',
        desc: 'Drop the initial draft or previously signed agreement.',
      },
      {
        step: 2,
        title: 'Upload modified version',
        desc: 'Drop the counterparty’s newly submitted revision.',
      },
      {
        step: 3,
        title: 'Review highlighted diffs',
        desc: 'Spot altered clauses, modified liability caps, and date changes.',
      },
    ],
    benefits: [
      {
        title: 'Prevent Sneaky Contract Alterations',
        desc: 'Ensure no unexpected modifications were snuck into final signing drafts.',
      },
      {
        title: 'Save Hours of Tedious Proofreading',
        desc: 'Focus review exclusively on altered lines rather than re-reading 50 pages.',
      },
    ],
    faqs: [
      {
        q: 'Are changes spotted if line breaks or margins shifted?',
        a: 'Yes. The geometric and textual comparison engine detects real text modifications.',
      },
      {
        q: 'Is it safe for documents covered by Non-Disclosure Agreements (NDA)?',
        a: '100% safe. Zero bytes leave your browser; all analysis executes strictly in local RAM.',
      },
    ],
    relatedSolutions: [
      'redact-pdf-free-permanently',
      'sign-pdf-online-without-printing',
      'edit-pdf-text-without-formatting-loss',
    ],
    esEquivalentSlug: 'comparar-dos-versiones-contrato-pdf',
    enEquivalentSlug: 'compare-two-pdf-contract-versions',
  },
};

export const OPTIMIZAR_PAIRS: Record<string, string> = {
  'comprimir-pdf-para-correo-gmail': 'compress-pdf-for-email-attachment',
  'proteger-pdf-con-contrasena-sin-subir-a-nube': 'encrypt-confidential-pdf-aes256-offline',
  'desbloquear-pdf-para-imprimir-o-copiar': 'unlock-pdf-print-copy-permissions',
  'comparar-dos-versiones-contrato-pdf': 'compare-two-pdf-contract-versions',
};
