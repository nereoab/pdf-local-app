import { IndustryPageData } from './types';

export const INDUSTRIES_DATA: Record<string, IndustryPageData> = {
  legal: {
    slug: 'legal',
    slugEn: 'legal',
    name: 'Sector Jurídico y Litigios',
    nameEn: 'Legal & Judicial Practice',
    heroBadge: 'SECRETO PROFESIONAL & LITIGIOS',
    h1: 'Software PDF para Despachos de Abogados y Litigios',
    h1En: 'Secure PDF Software for Law Firms & Legal Practice',
    subtitle:
      'Garantiza el Secreto Profesional y la cadena de custodia probatoria con procesamiento 100% local en tu navegador. Foliado Bates, censura forense permanente y compilación de expedientes sin subir documentos a la nube.',
    subtitleEn:
      'Uphold attorney-client privilege and evidentiary chain of custody with 100% local in-browser processing. Bates stamping, permanent forensic redaction, and trial binder merging without cloud uploads.',
    metaTitle: 'PDF para Abogados y Litigios: Secreto Profesional y Cero Nube | PDFBlack',
    metaTitleEn: 'PDF for Law Firms & Litigation: Zero Cloud & Privilege Compliance | PDFBlack',
    metaDescription:
      'Herramientas PDF especializadas para el sector legal. Aplica numeración Bates judicial, censura forense irreversible y une pruebas probatorias con cumplimiento estricto del Secreto Profesional.',
    metaDescriptionEn:
      'Specialized PDF tools for legal professionals. Apply judicial Bates numbering, permanent redaction, and combine evidence binders in compliance with attorney-client privilege.',
    keywords: [
      'pdf para abogados',
      'software pdf despachos juridicos',
      'secreto profesional pdf',
      'foliado bates judicial',
      'censurar pdf litigios sin nube',
      'herramientas pdf confidenciales legal',
    ],
    keywordsEn: [
      'pdf for lawyers',
      'law firm pdf software',
      'attorney client privilege pdf',
      'bates stamping legal discovery',
      'private pdf redaction court',
      'confidential litigation pdf tools',
    ],
    complianceStandards: [
      {
        name: 'Secreto Profesional & Privilege',
        badge: 'CONFIDENCIALIDAD ESTRICTA',
        description:
          'Al procesar los archivos en memoria RAM local mediante WebAssembly, ningún tercero ni servidor externo tiene acceso a los escritos, acuerdos o pruebas procesales.',
        authority: 'Código Deontológico de la Abogacía / ABA Model Rules',
      },
      {
        name: 'Federal Rules of Civil Procedure (FRCP)',
        badge: 'REGLA 34 & E-DISCOVERY',
        description:
          'Generación de foliado Bates secuencial e inmutable para el descubrimiento probatorio digital sin alterar el árbol de objetos vectorial.',
        authority: 'FRCP Rule 34 / ISO 32000-1',
      },
      {
        name: 'NIST SP 800-88 & Sanitización Forense',
        badge: 'DESTRUCCIÓN BINARIA',
        description:
          'Eliminación física de texto, imágenes y metadatos clasificados en documentos de prueba, evitando la recuperación por peritaje informático.',
        authority: 'National Institute of Standards and Technology (NIST)',
      },
    ],
    challenges: [
      {
        problem: 'Fuga de secretos de clientes al usar herramientas web comerciales',
        risk: 'Subir documentos a nubes de terceros vulnera el secreto profesional y expone acuerdos de fusión o demandas a accesos indebidos.',
        solution:
          'PDFBlack compila los archivos en la memoria local de tu equipo; las peticiones HTTP con datos de archivo son matemáticamente cero.',
      },
      {
        problem: 'Rechazo judicial de expedientes por foliación inconsistente',
        risk: 'Los juzgados rechazan escritos de prueba que no sigan una secuencia unívoca o que reinicien el conteo de folios entre anexos.',
        solution:
          'Módulo de foliado Bates con prefijos de caso, sufijos, relleno de ceros y numeración continua a través de múltiples PDFs.',
      },
      {
        problem: 'Censura visual deficiente (rectángulos negros no destructivos)',
        risk: 'Colocar cajas negras encima del texto permite a la contraparte copiar el texto subyacente con un simple Ctrl+C.',
        solution:
          'Censura binaria real que purga y desvincula los streams de texto confidencial del árbol PDF de manera definitiva.',
      },
    ],
    challengesEn: [
      {
        problem: 'Client confidentiality breach when using public cloud editors',
        risk: 'Uploading confidential discovery files to cloud servers violates attorney-client privilege and risks enterprise NDA breaches.',
        solution:
          'PDFBlack operates exclusively in local browser RAM; outbound file upload network requests are mathematically zero.',
      },
      {
        problem: 'Court rejection of trial binders due to pagination flaws',
        risk: 'Courts frequently reject electronic filings that lack persistent sequential numbering across disparate evidentiary exhibits.',
        solution:
          'Integrated Bates stamping engine supporting case prefixes, zero-padding, and cross-document continuous pagination.',
      },
      {
        problem: 'Defective visual masking (black rectangles that fail to redact)',
        risk: 'Drawing black boxes over text leaves underlying digital characters intact, allowing opposing counsel to copy sensitive data.',
        solution:
          'Forensic binary sanitization that physically removes and destroys targeted characters and image streams.',
      },
    ],
    keyBenefits: [
      {
        title: 'Cumplimiento Deontológico sin Contratos de Nube',
        desc: 'No requieres firmar acuerdos de tratamiento de datos con proveedores de almacenamiento remoto, ya que el documento nunca sale de tu PC.',
      },
      {
        title: 'Foliado Bates Compatible con Litigios Internacionales',
        desc: 'Inserta identificadores de página normalizados requeridos en Cortes civiles, mercantiles y arbitrajes comerciales.',
      },
      {
        title: 'Operatividad sin Conexión en Juicios',
        desc: 'Una vez cargada la aplicación web, funciona sin conexión a Internet en salas de audiencia o durante viajes.',
      },
    ],
    keyBenefitsEn: [
      {
        title: 'Privilege Compliance with Zero Vendor Risk',
        desc: 'Eliminates third-party data processing risks and DPAs because your sensitive files never transit through or touch any external server.',
      },
      {
        title: 'Court-Admissible Bates Pagination',
        desc: 'Embed durable identifiers meeting international procedural requirements for civil, criminal, and commercial arbitration exhibits.',
      },
      {
        title: 'Offline In-Court Execution',
        desc: 'Once cached in your browser, the WebAssembly engine operates seamlessly offline without internet in judicial courtrooms.',
      },
    ],
    recommendedTools: [
      {
        name: 'Foliar PDF (Numeración Bates)',
        nameEn: 'Bates Numbering',
        pathEs: '/editar/foliar',
        pathEn: '/en/bates-numbering',
        badge: 'REQUERIMIENTO JUDICIAL',
        reason: 'Inserta prefijos de expediente y folios correlativos en todas las pruebas.',
        reasonEn: 'Apply matter prefixes and continuous page sequencing across discovery.',
      },
      {
        name: 'Censurar PDF (Sanitización)',
        nameEn: 'Redact PDF',
        pathEs: '/optimizar/censurar',
        pathEn: '/en/redact-pdf',
        badge: 'SEGURIDAD FORENSE',
        reason: 'Elimina de forma irreversible nombres protegidos, DNI y cuentas bancarias.',
        reasonEn:
          'Permanently purge protected names, social security numbers, and banking details.',
      },
      {
        name: 'Unir PDF',
        nameEn: 'Merge PDF',
        pathEs: '/organizar/unir',
        pathEn: '/en/merge-pdf',
        badge: 'COMPILACIÓN DE EXPEDIENTES',
        reason: 'Consolida demandas, alegaciones y documentos de prueba en un solo archivo.',
        reasonEn: 'Compile pleadings, affidavits, and exhibits into a single binder.',
      },
      {
        name: 'Firmar PDF',
        nameEn: 'Sign PDF',
        pathEs: '/editar/firmar',
        pathEn: '/en/sign-pdf',
        badge: 'FIRMA PRIVADA',
        reason: 'Estampa rúbricas y firmas digitales sin almacenar trazos en servidores.',
        reasonEn: 'Affix handwritten and cryptographic signatures with local privacy.',
      },
    ],
    faqs: [
      {
        q: '¿Por qué PDFBlack es más seguro para un despacho que iLovePDF o Adobe Online?',
        a: 'Porque las herramientas convencionales suben tus PDFs a servidores en la nube para procesarlos, creando copias intermedias y riesgos de acceso por terceros. En PDFBlack, el motor WebAssembly ejecuta toda la lógica en tu propia memoria RAM: ningún byte del expediente sale de tu ordenador.',
      },
      {
        q: '¿Cumple la numeración Bates de PDFBlack con los requerimientos judiciales?',
        a: 'Sí. Permite definir prefijos alfanuméricos de caso (ej. EXP-2026-), número inicial, relleno con ceros a la izquierda y posición exacta con márgenes de seguridad para no tapar texto ni firmas.',
      },
      {
        q: '¿Puedo usar PDFBlack sin acceso a Internet durante un juicio oral?',
        a: 'Sí. Tras la primera carga, la aplicación web queda en la memoria caché de tu navegador y permite unir, censurar, foliar y proteger documentos de forma offline.',
      },
    ],
    faqsEn: [
      {
        q: 'Why is PDFBlack safer for law firms than cloud tools like iLovePDF or Adobe Web?',
        a: 'Traditional cloud PDF services require transmitting your confidential briefs to remote servers, creating data exposure and retention risks. PDFBlack processes files purely inside local browser RAM via WebAssembly, guaranteeing zero file uploads.',
      },
      {
        q: 'Is Bates stamping in PDFBlack court-admissible?',
        a: 'Yes. It allows complete customization of matter prefixes (e.g., CASE-2026-), sequential starting numbers, zero padding, and precise placement with margin safety zones.',
      },
      {
        q: 'Can I use PDFBlack offline during a court hearing?',
        a: 'Yes. Once cached in your browser, the client-side WebAssembly engine operates completely offline without an active internet connection.',
      },
    ],
    stats: [
      {
        value: '0 bytes',
        label: 'Archivos enviados a la nube',
        labelEn: 'Files sent to cloud servers',
      },
      { value: '100%', label: 'Privacidad en memoria RAM', labelEn: 'Client-side RAM execution' },
      {
        value: 'NIST',
        label: 'Estándar de sanitización',
        labelEn: 'Forensic sanitization standard',
      },
    ],
  },
  salud: {
    slug: 'salud',
    slugEn: 'healthcare',
    name: 'Sector Salud y Sanidad',
    nameEn: 'Healthcare & Medical Practice',
    heroBadge: 'CUMPLIMIENTO HIPAA & RGPD SALUD',
    h1: 'Procesamiento PDF para Hospitales y Clínicas Médicas',
    h1En: 'HIPAA & Healthcare Compliant PDF Processing',
    subtitle:
      'Protege historiales clínicos, resultados de laboratorio y datos de pacientes. Cumple con la normativa HIPAA y el RGPD (Art. 9) sin requerir contratos de tratamiento de datos con nubes externas.',
    subtitleEn:
      'Safeguard medical records, diagnostic reports, and protected health information (PHI). Comply with HIPAA and GDPR Article 9 without requiring cloud Business Associate Agreements.',
    metaTitle: 'PDF para Salud y Clínicas: Cumplimiento HIPAA y Cero Nube | PDFBlack',
    metaTitleEn: 'HIPAA Compliant PDF Software: Zero Upload Healthcare Security | PDFBlack',
    metaDescription:
      'Herramientas PDF para hospitales y sector sanitario. Anonimiza historiales clínicos, protege diagnósticos con AES-256 y procesa datos de pacientes con 100% privacidad local.',
    metaDescriptionEn:
      'Private PDF tools for hospitals and healthcare providers. Anonymize patient charts, encrypt diagnostic reports with AES-256, and process health records locally.',
    keywords: [
      'pdf cumplimiento hipaa',
      'software pdf hospitales clinicas',
      'anonimizar historias clinicas pdf',
      'rgpd datos de salud pdf',
      'pdf privado sector medico',
    ],
    keywordsEn: [
      'hipaa compliant pdf',
      'healthcare pdf software',
      'anonymize patient records pdf',
      'gdpr health data pdf editor',
      'private medical pdf tools',
    ],
    complianceStandards: [
      {
        name: 'HIPAA Security Rule (45 CFR § 164.312)',
        badge: 'PROTECCIÓN DE PHI',
        description:
          'Al ejecutarse 100% en el dispositivo del profesional de salud, no existe transmisión ni almacenamiento de información médica protegida (PHI) en infraestructura externa.',
        authority: 'U.S. Department of Health and Human Services (HHS)',
      },
      {
        name: 'RGPD Artículo 9 (Datos de Salud)',
        badge: 'DATOS DE CATEGORÍA ESPECIAL',
        description:
          'Cumplimiento del principio de privacidad desde el diseño (Art. 25). Los datos biométricos y de salud nunca salen del perímetro del centro médico.',
        authority: 'Reglamento General de Protección de Datos (UE)',
      },
      {
        name: 'Sin Necesidad de BAA (Business Associate Agreement)',
        badge: 'ARQUITECTURA CLIENT-SIDE',
        description:
          'Dado que PDFBlack nunca almacena ni tiene acceso a los documentos, se elimina la carga administrativa y legal de firmar contratos de proveedor externo.',
        authority: 'HIPAA Compliance Architecture',
      },
    ],
    challenges: [
      {
        problem: 'Infracciones graves de HIPAA por usar convertidores online gratuitos',
        risk: 'Subir historiales clínicos a servicios en la nube sin BAA acarrea multas federales y sanciones regulatorias severas.',
        solution:
          'PDFBlack procesa los análisis clínicos en local; no hay servidor intermediario ni riesgo de fuga de datos de pacientes.',
      },
      {
        problem: 'Anonimización de historiales para ensayos clínicos e investigación',
        risk: 'Eliminar datos de pacientes de forma deficiente puede permitir la reidentificación en estudios médicos publicados.',
        solution:
          'Herramienta de censura binaria que purga de forma irreversible nombres, fechas de nacimiento, números de póliza y metadatos DICOM.',
      },
      {
        problem: 'Archivos de diagnóstico pesados difíciles de compartir entre facultativos',
        risk: 'Superar los límites de tamaño en correos hospitalarios o pasarelas seguras retrasa la interconsulta médica.',
        solution:
          'Compresión inteligente que reduce el peso de escaneos médicos manteniendo la legibilidad diagnóstica de las imágenes.',
      },
    ],
    challengesEn: [
      {
        problem: 'Severe HIPAA violations from using consumer cloud PDF converters',
        risk: 'Uploading protected health information (PHI) to cloud tools without a signed BAA triggers severe regulatory penalties.',
        solution:
          'PDFBlack runs purely in local browser RAM, completely eliminating cloud vendor exposure and audit liabilities.',
      },
      {
        problem: 'De-identification of medical records for clinical research and trials',
        risk: 'Incomplete anonymization allows patient re-identification, breaching patient privacy statutes and IRB protocols.',
        solution:
          'Binary redaction removes all patient identifiers, admission dates, and embedded metadata permanently.',
      },
      {
        problem: 'Oversized diagnostic scans that exceed hospital email limits',
        risk: 'Exceeding attachment limits delays critical clinical peer consultations and patient referrals.',
        solution:
          'Local compression reduces medical PDF file size while preserving high-resolution diagnostic legibility.',
      },
    ],
    keyBenefits: [
      {
        title: 'Protección Absoluta de Historias Clínicas (PHI)',
        desc: 'Los datos de salud nunca abandonan el ordenador del facultativo o del centro médico.',
      },
      {
        title: 'Anonimización Irreversible para Docencia e Investigación',
        desc: 'Censura datos personales en informes de laboratorio y casos clínicos antes de compartirlos.',
      },
      {
        title: 'Cifrado Militar AES-256 para Envío a Pacientes',
        desc: 'Protege informes de alta y resultados con contraseña antes de enviarlos por canales externos.',
      },
    ],
    keyBenefitsEn: [
      {
        title: 'Absolute Protected Health Information (PHI) Security',
        desc: 'Patient records and medical charts never leave the practitioner or hospital workstation.',
      },
      {
        title: 'Irreversible De-identification for Clinical Research',
        desc: 'Redact names, ID numbers, and medical record numbers prior to sharing case studies or research.',
      },
      {
        title: 'Military-Grade AES-256 Patient Encryption',
        desc: 'Apply secure passwords to discharge summaries and lab reports before transmitting to patients.',
      },
    ],
    recommendedTools: [
      {
        name: 'Censurar PDF (Anonimizar)',
        nameEn: 'Redact PDF',
        pathEs: '/optimizar/censurar',
        pathEn: '/en/redact-pdf',
        badge: 'ANONIMIZACIÓN PHI',
        reason: 'Oculta y destruye datos de filiación del paciente de forma definitiva.',
        reasonEn: 'Permanently remove patient names, dates, and medical record numbers.',
      },
      {
        name: 'Proteger PDF con Contraseña',
        nameEn: 'Protect PDF',
        pathEs: '/optimizar/proteger',
        pathEn: '/en/protect-pdf',
        badge: 'CIFRADO AES-256',
        reason: 'Cifra resultados de análisis clínicos antes de su envío por correo.',
        reasonEn: 'Encrypt diagnostic results with military-grade passwords before email.',
      },
      {
        name: 'Comprimir PDF',
        nameEn: 'Compress PDF',
        pathEs: '/optimizar/comprimir',
        pathEn: '/en/compress-pdf',
        badge: 'OPTIMIZACIÓN CLÍNICA',
        reason: 'Reduce el tamaño de tomografías y escaneos para agilizar el envío.',
        reasonEn: 'Reduce heavy diagnostic scan sizes for rapid clinical sharing.',
      },
      {
        name: 'OCR en PDF',
        nameEn: 'OCR PDF',
        pathEs: '/editar/ocr',
        pathEn: '/en/ocr-pdf',
        badge: 'DIGITALIZACIÓN',
        reason: 'Convierte volantes y recetas escaneadas en texto seleccionable y legible.',
        reasonEn: 'Convert physical paper charts into searchable medical digital text.',
      },
    ],
    faqs: [
      {
        q: '¿Por qué PDFBlack no requiere firmar un BAA (Business Associate Agreement) bajo HIPAA?',
        a: 'Un BAA es obligatorio cuando un proveedor externo recibe, almacena o transmite Información Médica Protegida (PHI). Como PDFBlack funciona 100% dentro de tu propio navegador web mediante WebAssembly, ningún archivo ni dato viaja a servidores externos, eximiendo la necesidad de un BAA y eliminando el riesgo de auditoría.',
      },
      {
        q: '¿Es seguro censurar los nombres de pacientes con la herramienta de Censurar de PDFBlack?',
        a: 'Sí. A diferencia de programas que solo pintan un rectángulo negro sobre el texto, PDFBlack elimina físicamente los caracteres del código fuente del PDF, impidiendo cualquier intento de recuperación mediante selección o ingeniería inversa.',
      },
      {
        q: '¿Se pueden comprimir análisis médicos sin perder nitidez en los gráficos?',
        a: 'Sí. Nuestro algoritmo de compresión preserva la resolución requerida en curvas de laboratorio y tablas diagnósticas, reduciendo drásticamente el peso de los flujos de imagen.',
      },
    ],
    faqsEn: [
      {
        q: 'Why does PDFBlack not require a Business Associate Agreement (BAA) under HIPAA?',
        a: 'A BAA is legally required when a third-party vendor creates, receives, maintains, or transmits PHI on your behalf. Because PDFBlack executes 100% in your local browser using client-side WebAssembly, your documents never touch an external server, eliminating the need for a BAA.',
      },
      {
        q: 'Is redacting patient names in PDFBlack truly irreversible?',
        a: 'Yes. Unlike tools that merely draw an opaque overlay, PDFBlack physically purges character glyphs and raster data from the PDF stream, ensuring permanent data destruction.',
      },
      {
        q: 'Can medical records be compressed without compromising chart clarity?',
        a: 'Yes. Our local optimization algorithms downsample redundant image bloat while maintaining diagnostic clarity across medical charts and clinical tables.',
      },
    ],
    stats: [
      { value: 'HIPAA', label: 'Cumplimiento sin BAA', labelEn: 'Compliant without BAA' },
      { value: '100% Local', label: 'Procesamiento en el equipo', labelEn: 'On-device execution' },
      { value: 'AES-256', label: 'Cifrado de grado militar', labelEn: 'Military-grade cipher' },
    ],
  },
  finanzas: {
    slug: 'finanzas',
    slugEn: 'finance',
    name: 'Finanzas, Contabilidad y Auditoría',
    nameEn: 'Finance, Accounting & Audit',
    heroBadge: 'CUMPLIMIENTO SOX & PCI-DSS',
    h1: 'Software PDF Seguro para Finanzas, Contabilidad y Auditoría',
    h1En: 'Secure PDF Software for Accounting, Finance & Audit',
    subtitle:
      'Procesa estados financieros no públicos, balances contables y auditorías de Due Diligence sin riesgo de filtración. Extrae tablas a Excel (.xlsx), compara borradores contractuales y cifra documentos localmente.',
    subtitleEn:
      'Process non-public financial reports, general ledgers, and M&A due diligence without data leak risks. Extract pristine Excel tables, compare contract revisions, and encrypt sensitive filings locally.',
    metaTitle: 'PDF para Finanzas y Auditoría: Cumplimiento SOX y Cero Nube | PDFBlack',
    metaTitleEn: 'PDF for Finance & Accounting: SOX Compliance & Zero Cloud | PDFBlack',
    metaDescription:
      'Herramientas PDF confidenciales para firmas de auditoría y directores financieros. Extrae tablas a Excel, cifra con AES-256 y compara versiones de contratos con 100% privacidad local.',
    metaDescriptionEn:
      'Confidential PDF tools for accounting firms and CFOs. Extract clean Excel spreadsheets, encrypt financial statements with AES-256, and compare audit drafts privately.',
    keywords: [
      'pdf para contadores y auditores',
      'cumplimiento sox pdf',
      'extraer tablas pdf a excel privado',
      'seguridad pdf sector financiero',
      'comparar contratos financieros pdf',
    ],
    keywordsEn: [
      'pdf for accountants and auditors',
      'sox compliant pdf editor',
      'extract pdf tables to excel privately',
      'financial services pdf security',
      'compare financial contract pdfs',
    ],
    complianceStandards: [
      {
        name: 'Sarbanes-Oxley Act (SOX Section 404)',
        badge: 'CONTROL INTERNO FINANCIERO',
        description:
          'Garantiza la integridad y no divulgación de estados financieros no públicos durante su preparación, auditoría y presentación.',
        authority: 'U.S. Securities and Exchange Commission (SEC)',
      },
      {
        name: 'Gramm-Leach-Bliley Act (GLBA Safeguards)',
        badge: 'PROTECCIÓN FINANCIERA',
        description:
          'Salvaguarda la información financiera no pública de clientes (NPI) frente a accesos no autorizados o almacenamiento en nubes públicas no auditadas.',
        authority: 'Federal Trade Commission (FTC)',
      },
      {
        name: 'PCI-DSS & Datos de Pago',
        badge: 'SEGURIDAD DE TRANSACCIONES',
        description:
          'Los números de cuenta y extractos bancarios se procesan sin persistencia en servidores ni registros en logs de terceros.',
        authority: 'PCI Security Standards Council',
      },
    ],
    challenges: [
      {
        problem: 'Fuga de información previa a resultados trimestrales (Insider Trading)',
        risk: 'Subir borradores de resultados o auditorías de M&A a herramientas gratuitas expone datos bursátiles ultrasensibles.',
        solution:
          'Procesamiento en memoria RAM local: el informe financiero nunca transita fuera de la red de la empresa.',
      },
      {
        problem: 'Pérdida de horas transcribiendo balances de PDF a hojas de Excel',
        risk: 'El copiado manual de cifras contables genera errores de digitación en balances y auditorías tributarias.',
        solution:
          'Extractor local que detecta la estructura de tablas y exporta archivos .xlsx nativos con columnas exactas.',
      },
      {
        problem: 'Discrepancias inadvertidas entre versiones de contratos financieros',
        risk: 'Modificaciones sutiles en tasas de interés o cláusulas de amortización pueden pasar desapercibidas en revisiones manuales.',
        solution:
          'Comparador semántico y visual que resalta en color cualquier adición o supresión de texto entre dos versiones.',
      },
    ],
    challengesEn: [
      {
        problem: 'Material non-public information (MNPI) leaks prior to earnings release',
        risk: 'Uploading quarterly earnings drafts or M&A audits to public online tools exposes high-stakes financial data.',
        solution:
          '100% local RAM execution: sensitive financial ledgers never leave the enterprise workstation perimeter.',
      },
      {
        problem: 'Wasted billable hours manually transcribing PDF tables into Excel',
        risk: 'Manual data re-entry introduces critical arithmetic errors and discrepancies during tax audits and statutory reporting.',
        solution:
          'Algorithmic table detection extracting native .xlsx spreadsheets with aligned numerical columns.',
      },
      {
        problem: 'Overlooked alterations across complex loan covenants and contracts',
        risk: 'Undetected subtle modifications in interest rate basis points or indemnity clauses introduce major enterprise liabilities.',
        solution:
          'Semantic and visual comparison engine highlighting exact discrepancies across draft revisions in seconds.',
      },
    ],
    keyBenefits: [
      {
        title: 'Extracción Impecable a Microsoft Excel (.xlsx)',
        desc: 'Convierte tablas de balances, estados de pérdidas y ganancias y carteras de inversión a hojas editables con alineación de celdas.',
      },
      {
        title: 'Cifrado AES-256 de Grado Bancario',
        desc: 'Protege las nóminas salariales y auditorías tributarias con contraseñas seguras antes de distribuirlas internamente.',
      },
      {
        title: 'Auditoría Visual de Cambios entre Borradores',
        desc: 'Detecta en segundos cualquier alteración en cláusulas contractuales o cifras contables entre dos versiones del mismo PDF.',
      },
    ],
    keyBenefitsEn: [
      {
        title: 'Pristine Extraction to Microsoft Excel (.xlsx)',
        desc: 'Convert complex balance sheets, P&L statements, and portfolio schedules into fully formatted spreadsheets.',
      },
      {
        title: 'Banking-Grade AES-256 Encryption',
        desc: 'Lock employee payrolls and internal audit documentation with robust passwords prior to internal distribution.',
      },
      {
        title: 'Visual Audit of Contract Revisions',
        desc: 'Detect subtle textual or numerical alterations between draft agreements in seconds with side-by-side highlighting.',
      },
    ],
    recommendedTools: [
      {
        name: 'Convertir PDF a Excel',
        nameEn: 'PDF to Excel',
        pathEs: '/convertir/pdf-excel',
        pathEn: '/en/pdf-to-excel',
        badge: 'EXTRACCIÓN DE TABLAS',
        reason: 'Exporta balances y estados de cuenta a hojas .xlsx perfectamente editables.',
        reasonEn: 'Extract financial statements and invoices into editable .xlsx spreadsheets.',
      },
      {
        name: 'Proteger PDF',
        nameEn: 'Protect PDF',
        pathEs: '/optimizar/proteger',
        pathEn: '/en/protect-pdf',
        badge: 'SEGURIDAD FINANCIERA',
        reason: 'Cifra nóminas y estados de cuenta con contraseñas maestras y de usuario.',
        reasonEn: 'Apply owner and user passwords to sensitive payroll ledgers and audits.',
      },
      {
        name: 'Comparar PDF',
        nameEn: 'Compare PDF',
        pathEs: '/optimizar/comparar',
        pathEn: '/en/compare-pdf',
        badge: 'AUDITORÍA DE CONTRATOS',
        reason: 'Compara dos contratos y resalta diferencias en tasas, montos o cláusulas.',
        reasonEn: 'Highlight discrepancies between loan agreements and audit revisions.',
      },
      {
        name: 'Reparar PDF',
        nameEn: 'Repair PDF',
        pathEs: '/optimizar/reparar',
        pathEn: '/en/repair-pdf',
        badge: 'RECUPERACIÓN DE DATOS',
        reason: 'Restaura archivos dañados o corruptos para recuperar informes financieros.',
        reasonEn: 'Rebuild corrupted or truncated financial reports from damaged PDFs.',
      },
    ],
    faqs: [
      {
        q: '¿Es seguro procesar nóminas salariales y estados contables en PDFBlack?',
        a: 'Es 100% seguro. A diferencia de servicios en la nube que almacenan copias temporales en sus servidores, PDFBlack opera exclusivamente dentro del entorno protegido de tu navegador web mediante WebAssembly. Tus balances nunca se envían a ningún servidor externo.',
      },
      {
        q: '¿Cómo funciona la extracción de tablas a Excel sin enviar los datos a un servidor?',
        a: 'Utilizamos un motor de análisis vectorial en WebAssembly que detecta las coordenadas de las líneas de tabla, bordes y celdas directamente en el cliente, estructurando un archivo .xlsx nativo descargable en tu ordenador.',
      },
      {
        q: '¿Permite cumplir con los controles internos de SOX?',
        a: 'Sí, porque evita la dispersión de datos confidenciales en infraestructuras no homologadas o proveedores SaaS que no cuentan con certificación SOC2 en tu empresa.',
      },
    ],
    faqsEn: [
      {
        q: 'Is it safe to process employee payroll and ledger PDFs on PDFBlack?',
        a: 'Yes, 100% safe. While conventional online utilities retain copies on remote infrastructure, PDFBlack processes files exclusively within your local browser sandbox via WebAssembly. Your numbers never leave your machine.',
      },
      {
        q: 'How does client-side PDF to Excel conversion work without cloud processing?',
        a: 'Our WebAssembly engine parses vector glyph coordinates and boundary lines directly inside local RAM, compiling a pristine .xlsx file ready for instant download without network transfers.',
      },
      {
        q: 'Does using PDFBlack satisfy SOX 404 internal control policies?',
        a: 'Yes, because it eliminates unauthorized third-party SaaS shadow-IT data leakage by executing all document tasks locally on the corporate endpoint.',
      },
    ],
    stats: [
      {
        value: 'SOX 404',
        label: 'Cumplimiento de control interno',
        labelEn: 'Internal control compliance',
      },
      { value: '.XLSX', label: 'Tablas nativas editables', labelEn: 'Native editable tables' },
      {
        value: '0 Riesgos',
        label: 'Sin fugas de datos bursátiles',
        labelEn: 'No financial data leakage',
      },
    ],
  },
  gobierno: {
    slug: 'gobierno',
    slugEn: 'government',
    name: 'Sector Público, Gobierno y Defensa',
    nameEn: 'Public Sector & Government',
    heroBadge: 'SOBERANÍA DE DATOS & ZERO-CLOUD',
    h1: 'Gestión Documental PDF para la Administración Pública',
    h1En: 'Sovereign PDF Management for Public Sector & Government',
    subtitle:
      'Garantiza la soberanía digital de los datos públicos y expedientes administrativos. Procesa licitaciones, pliegos técnicos y documentos clasificados sin dependencia de servidores cloud en jurisdicciones extranjeras.',
    subtitleEn:
      'Ensure data sovereignty across public records and procurement files. Process tenders, official gazettes, and classified documents without dependency on foreign cloud servers.',
    metaTitle: 'PDF para el Sector Público y Gobierno: Soberanía de Datos | PDFBlack',
    metaTitleEn: 'Government & Public Sector PDF Software: Data Sovereignty | PDFBlack',
    metaDescription:
      'Soluciones PDF para la administración pública y organismos estatales. Sanitización de información clasificada, foliado de expedientes y preservación PDF/A con 100% soberanía local.',
    metaDescriptionEn:
      'Sovereign PDF solutions for government agencies and public institutions. Classified data sanitization, official record numbering, and PDF/A archiving with zero cloud transit.',
    keywords: [
      'pdf para administracion publica',
      'soberania de datos pdf gobierno',
      'esquema nacional de seguridad pdf',
      'censurar documentos clasificados pdf',
      'foliar expedientes contratacion publica',
    ],
    keywordsEn: [
      'government pdf software',
      'public sector data sovereignty pdf',
      'air-gapped pdf processing',
      'redact classified government pdf',
      'public procurement pdf numbering',
    ],
    complianceStandards: [
      {
        name: 'Soberanía Digital de Datos',
        badge: 'ZERO EXTERNAL CLOUD',
        description:
          'Los expedientes de licitación, datos de ciudadanos y documentos de defensa nunca cruzan fronteras nacionales ni se almacenan en centros de datos comerciales.',
        authority: 'Directiva Europea de Gobernanza de Datos (DGA)',
      },
      {
        name: 'Esquema Nacional de Seguridad (ENS)',
        badge: 'ALTA SEGURIDAD',
        description:
          'Cumplimiento de medidas de seguridad en el tratamiento de la información pública mediante aislamiento en el puesto de trabajo del funcionario.',
        authority: 'Centro Criptológico Nacional (CCN-CERT)',
      },
      {
        name: 'Preservación a Largo Plazo (ISO 19005 / PDF/A)',
        badge: 'ARCHIVÍSTICA ESTATAL',
        description:
          'Garantiza que las disposiciones y resoluciones públicas permanezcan legibles e inmutables durante décadas conforme a los estándares de archivo histórico.',
        authority: 'Organización Internacional de Normalización (ISO)',
      },
    ],
    challenges: [
      {
        problem:
          'Prohibición legal de transferir datos públicos a servidores extranjeros (Cloud Act)',
        risk: 'El uso de herramientas cloud estándar aloja datos en nubes sujetas a leyes de acceso foráneo incompatibles con la soberanía estatal.',
        solution:
          'PDFBlack funciona de manera autónoma en el navegador; no hay envío transfronterizo de datos de ciudadanos.',
      },
      {
        problem: 'Filtración de secretos de Estado o datos reservados en boletines oficiales',
        risk: 'Publicar pliegos con texto censurado mediante herramientas básicas permite desocultar datos de seguridad nacional.',
        solution:
          'Censura forense que suprime los objetos del PDF antes de su publicación en sedes electrónicas o boletines oficiales.',
      },
      {
        problem: 'Expedientes de licitación masivos con folios desordenados',
        risk: 'La interpolación o desorden de ofertas en licitaciones públicas puede anular adjudicaciones millonarias.',
        solution:
          'Foliado correlativo Bates y reordenación de páginas que aseguran la trazabilidad administrativa estricta.',
      },
    ],
    challengesEn: [
      {
        problem: 'Statutory prohibition against foreign cloud data transfers (Cloud Act risks)',
        risk: 'Utilizing commercial SaaS products exposes public sector records to extraterritorial jurisdiction and subpoena risks.',
        solution:
          'PDFBlack operates autonomously on endpoint browser hardware; cross-border file transmission is eliminated.',
      },
      {
        problem: 'Classified or sensitive information leaked in public gazette releases',
        risk: 'Publishing official tenders with superficial redactions allows investigative discovery of confidential state data.',
        solution:
          'Binary sanitization destroying sensitive text vectors prior to official electronic portal publication.',
      },
      {
        problem: 'Massive procurement tender submissions requiring verifiable pagination',
        risk: 'Mishandling page sequences in multi-vendor public tenders can invalidate competitive bidding processes.',
        solution:
          'Strict sequential Bates numbering and page structuring preserving evidentiary procedural integrity.',
      },
    ],
    keyBenefits: [
      {
        title: 'Soberanía Absoluta en el Puesto de Trabajo',
        desc: 'Los datos administrativos se procesan exclusivamente en los ordenadores de los funcionarios públicos sin salir a la red.',
      },
      {
        title: 'Sanitización Homologable de Documentos Clasificados',
        desc: 'Elimina de forma irreversible información reservada antes de su publicación en portales de transparencia.',
      },
      {
        title: 'Preparación para Archivo Digital a Largo Plazo',
        desc: 'Convierte documentos con fidelidad exacta a especificaciones de preservación permanente.',
      },
    ],
    keyBenefitsEn: [
      {
        title: 'Complete Workstation Data Sovereignty',
        desc: 'Administrative files and citizen data are processed exclusively inside agency endpoint workstations.',
      },
      {
        title: 'Irreversible Sanitization for Freedom of Information (FOIA)',
        desc: 'Purge restricted and secret details prior to releasing documents to transparency portals or the press.',
      },
      {
        title: 'Long-Term Digital Preservation Compliance',
        desc: 'Structure and compile official state documentation to archival-grade preservation standards.',
      },
    ],
    recommendedTools: [
      {
        name: 'Censurar PDF (Sanitización)',
        nameEn: 'Redact PDF',
        pathEs: '/optimizar/censurar',
        pathEn: '/en/redact-pdf',
        badge: 'TRANSPARENCIA & FOIA',
        reason:
          'Elimina información clasificada antes de publicar acuerdos en portales de transparencia.',
        reasonEn: 'Purge classified intelligence prior to releasing files under FOIA requests.',
      },
      {
        name: 'Foliar PDF (Expedientes)',
        nameEn: 'Bates Numbering',
        pathEs: '/editar/foliar',
        pathEn: '/en/bates-numbering',
        badge: 'PROCEDIMIENTO ADMINISTRATIVO',
        reason: 'Folia expedientes de contratación pública y pliegos técnicos de licitación.',
        reasonEn: 'Number public procurement tenders and administrative dossiers.',
      },
      {
        name: 'Convertir Word a PDF',
        nameEn: 'Word to PDF',
        pathEs: '/convertir/word-pdf',
        pathEn: '/en/word-to-pdf',
        badge: 'PUBLICACIÓN OFICIAL',
        reason: 'Convierte decretos y resoluciones a PDF con tipografías y vectores fijos.',
        reasonEn: 'Convert decrees and resolutions into fixed-layout official PDFs.',
      },
      {
        name: 'Dividir PDF',
        nameEn: 'Split PDF',
        pathEs: '/organizar/dividir',
        pathEn: '/en/split-pdf',
        badge: 'GESTIÓN DE LEGAJOS',
        reason: 'Separa legajos administrativos pesados en expedientes individuales.',
        reasonEn: 'Extract individual administrative dossiers from bulky multi-part files.',
      },
    ],
    faqs: [
      {
        q: '¿Cómo garantiza PDFBlack que ningún dato público salga de la red de la administración?',
        a: 'Al abrir PDFBlack en el navegador del funcionario, los módulos WebAssembly se cargan una sola vez en memoria. Desde ese instante, cualquier archivo que abras se manipula exclusivamente dentro de la memoria RAM del ordenador local. Ningún servidor recibe los bytes ni almacena copias temporales.',
      },
      {
        q: '¿Se puede utilizar en entornos desconectados de Internet (Air-Gapped)?',
        a: 'Sí. Una vez cargada la aplicación en el navegador, el sistema puede funcionar de forma 100% autónoma sin conexión a Internet o en redes internas cerradas.',
      },
      {
        q: '¿Cumple la función de censura con las directivas de transparencia y protección de datos?',
        a: 'Sí. Cumple con los criterios de sanitización del NIST SP 800-88, eliminando el texto subyacente y reconstruyendo los objetos para evitar la recuperación de datos mediante ingeniería inversa.',
      },
    ],
    faqsEn: [
      {
        q: 'How does PDFBlack ensure public sector files never leave agency networks?',
        a: 'When an official accesses PDFBlack, the WebAssembly binaries load into browser cache once. From then on, every document operation executes entirely within the workstation volatile RAM. Zero bytes are uploaded to any external server.',
      },
      {
        q: 'Can PDFBlack be deployed in air-gapped government environments?',
        a: 'Yes. Once cached, the client-side WebAssembly engine operates 100% autonomously without active internet or within isolated intranet perimeters.',
      },
      {
        q: 'Does the redaction feature satisfy Freedom of Information (FOIA) sanitization standards?',
        a: 'Yes. It adheres to NIST SP 800-88 forensic sanitization guidelines, permanently destroying targeted vectors and metadata before release.',
      },
    ],
    stats: [
      { value: '100%', label: 'Soberanía digital local', labelEn: 'Local data sovereignty' },
      {
        value: 'Air-Gapped',
        label: 'Operativo sin conexión',
        labelEn: 'Offline air-gapped support',
      },
      { value: 'NIST', label: 'Sanitización de secretos', labelEn: 'Secret sanitization standard' },
    ],
  },
};

export const ALL_INDUSTRY_SLUGS_ES = Object.keys(INDUSTRIES_DATA);
export const ALL_INDUSTRY_SLUGS_EN = Object.values(INDUSTRIES_DATA).map((item) => item.slugEn);

export function getIndustryData(
  slug: string,
  lang: 'es' | 'en' = 'es',
): IndustryPageData | undefined {
  if (lang === 'es') {
    return INDUSTRIES_DATA[slug];
  } else {
    return Object.values(INDUSTRIES_DATA).find((item) => item.slugEn === slug);
  }
}

export function getAllIndustries(): IndustryPageData[] {
  return Object.values(INDUSTRIES_DATA);
}

export function getEquivalentIndustrySlug(slug: string, currentLang: 'es' | 'en'): string {
  if (currentLang === 'es') {
    const item = INDUSTRIES_DATA[slug];
    return item ? item.slugEn : slug;
  } else {
    const item = Object.values(INDUSTRIES_DATA).find((i) => i.slugEn === slug);
    return item ? item.slug : slug;
  }
}
