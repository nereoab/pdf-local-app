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

  'bajarle-el-peso-a-un-pdf': {
    slug: 'bajarle-el-peso-a-un-pdf',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Reducción Inteligente de Megas',
    h1: 'Cómo Bajarle el Peso a un PDF sin Perder Calidad — Gratis Online',
    subtitle:
      'Reduce megabytes en tus archivos PDF pesados en segundos. Nuestro motor optimiza imágenes y flujos internos manteniendo tipografía vectorial nítida y firmas perfectamente legibles sin subir nada a la nube.',
    metaTitle: 'Cómo Bajarle el Peso a un PDF Gratis Online — Reducir Megabytes | PDFBlack',
    metaDescription:
      '¿Quieres saber cómo bajarle el peso a un PDF? Reduce megabytes al instante gratis sin perder nitidez en textos o firmas. 100% privado en tu navegador, sin límites ni registro.',
    keywords: [
      'como bajarle el peso a un pdf',
      'bajarle peso a un pdf',
      'bajar el peso de un pdf',
      'como reducir el peso a un pdf',
      'bajar peso pdf online gratis',
      'reducir megas a un pdf',
      'bajarle el tamano a un pdf',
    ],
    parentPath: '/optimizar/comprimir',
    parentName: 'Comprimir PDF',
    specifications: [
      {
        feature: 'Privacidad',
        value: '100% Local en RAM',
        note: 'Tus documentos confidenciales nunca tocan un servidor externo',
      },
      {
        feature: 'Tecnología',
        value: 'Resampling Inteligente + Deflate Nivel 9',
        note: 'Equilibrio perfecto entre ligereza y nitidez visual',
      },
      {
        feature: 'Tipografía y Firmas',
        value: 'Vectorial intacta',
        note: 'Textos y sellos conservan definición impecable',
      },
      {
        feature: 'Compatibilidad',
        value: 'Estándar ISO 32000-1',
        note: 'Aceptado en juzgados, SAT, mesas de partes y correos',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento pesado',
        desc: 'Arrastra tu archivo PDF de 20 MB, 50 MB o más sin límites de subida.',
      },
      {
        step: 2,
        title: 'Selecciona nivel de optimización',
        desc: 'Elige compresión recomendada para mantener nitidez o compresión extrema para máximo ahorro.',
      },
      {
        step: 3,
        title: 'Descarga tu PDF optimizado',
        desc: 'Obtén tu archivo con megabytes reducidos listo para enviar por correo o subir a portales.',
      },
    ],
    benefits: [
      {
        title: 'Aprobación Inmediata en Plataformas Web',
        desc: 'Olvídate de errores que rechazan archivos por superar el peso permitido.',
      },
      {
        title: 'Cero Riesgo de Fugas de Información',
        desc: 'Al procesarse íntegramente en la memoria de tu dispositivo, tus datos bancarios y personales quedan a salvo.',
      },
    ],
    faqs: [
      {
        q: '¿Cómo bajarle el peso a un PDF sin que se vuelva borroso?',
        a: 'PDFBlack preserva la capa vectorial de las fuentes y el texto. Solo aplica remuestreo y compresión con pérdida controlada a imágenes embebidas de alta densidad.',
      },
      {
        q: '¿Existe límite en la cantidad de páginas o megas que puedo reducir?',
        a: 'No. Como el procesamiento se realiza en tu propio equipo mediante WebAssembly, no hay cuotas diarias ni restricciones de tamaño.',
      },
    ],
    relatedSolutions: [
      'comprimir-pdf-a-200kb',
      'comprimir-pdf-a-1mb',
      'comprimir-pdf-para-correo-gmail',
    ],
    esEquivalentSlug: 'bajarle-el-peso-a-un-pdf',
    enEquivalentSlug: 'reduce-pdf-file-size-without-losing-quality',
  },

  'comprimir-pdf-a-500kb': {
    slug: 'comprimir-pdf-a-500kb',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Límite Portales y SAT',
    h1: 'Comprimir PDF a 500 KB o menos — Bajar Peso para Trámites Oficiales',
    subtitle:
      'Ajusta el tamaño de tus archivos PDF para que no superen el límite estricto de 500 KB requerido por el SAT, mesas de partes, sistemas consulares y plataformas de contratación pública.',
    metaTitle: 'Comprimir PDF a 500 KB Online Gratis — Bajar Peso al Máximo | PDFBlack',
    metaDescription:
      'Comprime tu PDF a menos de 500 KB online gratis. Cumple con los topes de subida de SAT, juzgados y visas con total privacidad en tu navegador.',
    keywords: [
      'comprimir pdf a 500 kb',
      'comprimir pdf a 500kb',
      'reducir pdf a 500 kb',
      'bajar peso pdf a 500kb',
      'comprimir pdf menos de 500kb',
      'comprimir pdf sat 500kb',
    ],
    parentPath: '/optimizar/comprimir',
    parentName: 'Comprimir PDF',
    specifications: [
      {
        feature: 'Límite objetivo',
        value: '≤ 500 KB',
        note: 'Pasa las validaciones más estrictas de portales gubernamentales',
      },
      {
        feature: 'Procesamiento',
        value: '100% en Navegador (WASM)',
        note: 'Sin colas de espera en servidores externos',
      },
      {
        feature: 'Nitidez',
        value: '150 DPI Balanceado',
        note: 'Lectura perfecta en pantalla e impresión estándar',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecciona tu archivo PDF',
        desc: 'Carga el documento que supera el tope de 500 KB permitido por el portal.',
      },
      {
        step: 2,
        title: 'Aplica compresión calibrada',
        desc: 'El algoritmo descarta metadatos y optimiza imágenes para aproximarse a los 500 KB.',
      },
      {
        step: 3,
        title: 'Descarga y envía',
        desc: 'Tu documento queda validado y listo para ser admitido en el sistema oficial.',
      },
    ],
    benefits: [
      {
        title: 'Aceptación Garantizada en Formularios',
        desc: 'Evita frustrantes errores de rechazo en convocatorias públicas y solicitudes de visa.',
      },
      {
        title: 'Confidencialidad Absoluta',
        desc: 'Extractos tributarios y declaraciones juradas permanecen 100% privados.',
      },
    ],
    faqs: [
      {
        q: '¿Por qué las entidades oficiales fijan un límite de 500 KB?',
        a: 'Para optimizar el almacenamiento masivo en sus servidores y asegurar descargas instantáneas para los funcionarios revisores.',
      },
      {
        q: '¿Se alteran las firmas digitales o sellos?',
        a: 'No. Las firmas conservan su integridad vectorial para no invalidar el documento.',
      },
    ],
    relatedSolutions: [
      'comprimir-pdf-a-200kb',
      'comprimir-pdf-a-1mb',
      'comprimir-pdf-para-correo-gmail',
    ],
    esEquivalentSlug: 'comprimir-pdf-a-500kb',
    enEquivalentSlug: 'compress-pdf-to-500kb',
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

  'reduce-pdf-file-size-without-losing-quality': {
    slug: 'reduce-pdf-file-size-without-losing-quality',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Lossless Visual Quality',
    h1: 'How to Reduce PDF File Size Without Losing Quality — Free Online',
    subtitle:
      'Shrink heavy PDF megabytes in seconds. Our engine selectively optimizes high-DPI image assets and compacts structural data streams while keeping vector text and scanned signatures razor-sharp.',
    metaTitle: 'Reduce PDF File Size Without Losing Quality Online Free | PDFBlack',
    metaDescription:
      'Learn how to reduce PDF file size without losing quality. Compress megabytes for free in your browser with 100% client-side privacy, zero watermarks, and no sign-up.',
    keywords: [
      'reduce pdf file size without losing quality',
      'compress pdf without losing quality',
      'how to reduce pdf size without blur',
      'shrink pdf keep high quality',
      'compress pdf free online no quality loss',
      'reduce mb of pdf file free',
    ],
    parentPath: '/en/compress-pdf',
    parentName: 'Compress PDF',
    specifications: [
      {
        feature: 'Privacy',
        value: '100% In-Browser RAM',
        note: 'Zero server uploads; your data never leaves your device',
      },
      {
        feature: 'Optimization',
        value: 'Smart Resampling + Deflate 9',
        note: 'Up to 85% file size reduction',
      },
      {
        feature: 'Typography & Signatures',
        value: 'Lossless Vector',
        note: 'Text glyphs and stamp vectors retain pixel-perfect sharpness',
      },
      {
        feature: 'Compliance',
        value: 'ISO 32000-1 Compliant',
        note: 'Guaranteed valid for court filings, job portals, and emails',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload large PDF file',
        desc: 'Drag and drop your 20MB, 50MB, or large document with no initial cap.',
      },
      {
        step: 2,
        title: 'Choose compression level',
        desc: 'Select recommended balance to maintain visual fidelity or extreme mode for maximum shrink.',
      },
      {
        step: 3,
        title: 'Instant local download',
        desc: 'Save your compressed PDF right away without email verification or server queues.',
      },
    ],
    benefits: [
      {
        title: 'Pass Portal & Email Size Filters',
        desc: 'Never suffer file attachment bounces or upload rejections on strict enterprise portals.',
      },
      {
        title: 'Confidentiality By Architecture',
        desc: 'Because execution runs in local WebAssembly, proprietary contracts and bank statements stay confidential.',
      },
    ],
    faqs: [
      {
        q: 'How does it compress without making text blurry?',
        a: 'Unlike naive tools that rasterize entire pages into low-res JPEG, PDFBlack leaves text vectors untouched and targets only embedded heavy image streams.',
      },
      {
        q: 'Is there a limit on daily conversions or file size?',
        a: 'No limits whatsoever. The processing leverages your local CPU hardware, making it free and unlimited.',
      },
    ],
    relatedSolutions: [
      'compress-pdf-to-200kb',
      'compress-pdf-to-1mb',
      'compress-pdf-for-email-attachment',
    ],
    esEquivalentSlug: 'bajarle-el-peso-a-un-pdf',
    enEquivalentSlug: 'reduce-pdf-file-size-without-losing-quality',
  },

  'compress-pdf-to-500kb': {
    slug: 'compress-pdf-to-500kb',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: '500 KB Portal Threshold',
    h1: 'Compress PDF to 500 KB or Less Online Free — Fast & Lossless',
    subtitle:
      'Downsize oversized PDF documents to comply with strict 500 KB upload thresholds enforced by visa application systems, tax agencies, and public tender portals.',
    metaTitle: 'Compress PDF to 500 KB or Less Online Free | PDFBlack',
    metaDescription:
      'Compress PDF to under 500 KB online free for tax filings, government forms, and job submissions. 100% private in-browser processing with zero server leaks.',
    keywords: [
      'compress pdf to 500 kb',
      'compress pdf to 500kb',
      'reduce pdf size below 500kb',
      'shrink pdf under 500kb online free',
      'compress pdf 500kb free',
    ],
    parentPath: '/en/compress-pdf',
    parentName: 'Compress PDF',
    specifications: [
      {
        feature: 'Target File Size',
        value: '≤ 500 KB',
        note: 'Passes rigid automated size checks on public submission portals',
      },
      {
        feature: 'Processing Mode',
        value: '100% Client-Side WebAssembly',
        note: 'Zero server queues and zero data transmission',
      },
      {
        feature: 'Image Clarity',
        value: '150 DPI Balanced',
        note: 'Clear display across monitors and standard office printers',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload your document',
        desc: 'Drag your PDF file that exceeds the 500 KB limit.',
      },
      {
        step: 2,
        title: 'Apply targeted compression',
        desc: 'Algorithms strip redundant metadata and recompress image rasters down toward 500 KB.',
      },
      {
        step: 3,
        title: 'Download and submit',
        desc: 'Submit your compliant file directly to government portals without errors.',
      },
    ],
    benefits: [
      {
        title: 'Guaranteed Acceptance on Public Forms',
        desc: 'Bypass the frustration of rejection messages on government and consular portals.',
      },
      {
        title: 'Zero Privacy Risk',
        desc: 'Tax records, identity scans, and salary slips remain exclusively on your computer.',
      },
    ],
    faqs: [
      {
        q: 'Why do official systems enforce a 500 KB cap?',
        a: 'To manage database footprints and ensure that civil servants can open incoming claims instantly.',
      },
      {
        q: 'Will electronic certificates or digital signatures be broken?',
        a: 'No. Visual signatures and text formatting are preserved intact.',
      },
    ],
    relatedSolutions: [
      'compress-pdf-to-200kb',
      'compress-pdf-to-1mb',
      'compress-pdf-for-email-attachment',
    ],
    esEquivalentSlug: 'comprimir-pdf-a-500kb',
    enEquivalentSlug: 'compress-pdf-to-500kb',
  },
};

export const OPTIMIZAR_PAIRS: Record<string, string> = {
  'comprimir-pdf-para-correo-gmail': 'compress-pdf-for-email-attachment',
  'proteger-pdf-con-contrasena-sin-subir-a-nube': 'encrypt-confidential-pdf-aes256-offline',
  'desbloquear-pdf-para-imprimir-o-copiar': 'unlock-pdf-print-copy-permissions',
  'comparar-dos-versiones-contrato-pdf': 'compare-two-pdf-contract-versions',
  'bajarle-el-peso-a-un-pdf': 'reduce-pdf-file-size-without-losing-quality',
  'comprimir-pdf-a-500kb': 'compress-pdf-to-500kb',
};
