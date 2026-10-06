import { IndustryPageData } from './types';

export const INDUSTRIES_DATA_PT: Record<string, IndustryPageData> = {
  legal: {
    slug: 'legal',
    slugEn: 'legal',
    name: 'Setor Jurídico e Litígios',
    nameEn: 'Legal & Judicial Practice',
    heroBadge: 'SIGILO PROFISSIONAL E LITÍGIOS',
    h1: 'Software PDF para escritórios de advocacia e litígios',
    h1En: 'Secure PDF Software for Law Firms & Legal Practice',
    subtitle:
      'Garante sigilo profissional e a cadeia de custódia das provas com processamento 100% local no seu navegador. Paginação Bates, redação forense permanente e compilação de arquivos de casos sem necessidade de enviar documentos para a nuvem.',
    subtitleEn:
      'Uphold attorney-client privilege and evidentiary chain of custody with 100% local in-browser processing. Bates stamping, permanent forensic redaction, and trial binder merging without cloud uploads.',
    metaTitle: 'PDF para Advogados e Litígios: Sigilo Profissional e Nuvem Zero | PDFBlack',
    metaTitleEn: 'PDF for Law Firms & Litigation: Zero Cloud & Privilege Compliance | PDFBlack',
    metaDescription:
      'Ferramentas especializadas em PDF para o setor jurídico. Aplica a numeração judicial Bates, redação forense irreversível e mescla materiais probatórios com estrita observância ao sigilo profissional.',
    metaDescriptionEn:
      'Specialized PDF tools for legal professionals. Apply judicial Bates numbering, permanent redaction, and combine evidence binders in compliance with attorney-client privilege.',
    keywords: [
      'PDF para advogados',
      'Software PDF para escritórios de advocacia',
      'sigilo profissional pdf',
      'foliado bates judicial',
      'censurar litígios em PDF sem nuvem',
      'ferramentas PDF legais confidenciais',
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
        name: 'Sigilo e privilégio profissional',
        badge: 'ESTRITA CONFIDENCIALIDADE',
        description:
          'Ao processar arquivos na memória RAM local usando WebAssembly, nenhum terceiro ou servidor externo tem acesso aos documentos, contratos ou evidências processuais.',
        authority: 'Código de Ética para Advogados / Regras Modelo da ABA',
      },
      {
        name: 'Regras Federais de Processo Civil (FRCP)',
        badge: 'REGLA 34 & E-DISCOVERY',
        description:
          'Geração de foliação Bates sequencial e imutável para descoberta de evidências digitais sem alterar a árvore de objetos vetoriais.',
        authority: 'Regra 34 das Regras Federais de Processo Civil / ISO 32000-1',
      },
      {
        name: 'NIST SP 800-88 e Sanitização Forense',
        badge: 'DESTRUIÇÃO BINÁRIA',
        description:
          'Remoção física de texto, imagens e metadados classificados de documentos de evidência, impedindo a recuperação por meio de perícia forense digital.',
        authority: 'Instituto Nacional de Padrões e Tecnologia (NIST)',
      },
    ],
    challenges: [
      {
        problem: 'Vazamento de segredos de clientes ao usar ferramentas comerciais da web',
        risk: 'O envio de documentos para nuvens de terceiros viola o sigilo profissional e expõe acordos de fusão ou processos judiciais a acessos não autorizados.',
        solution:
          'O PDFBlack compila arquivos na memória local do seu computador; as requisições HTTP com dados de arquivo são matematicamente zero.',
      },
      {
        problem: 'Rejeição judicial de processos devido à paginação inconsistente.',
        risk: 'Os tribunais rejeitam documentos probatórios que não seguem uma sequência única ou que reiniciam a contagem de páginas entre os anexos.',
        solution:
          'Módulo de foliação Bates com prefixos de maiúsculas e minúsculas, sufixos, preenchimento com zeros e numeração contínua em vários PDFs.',
      },
      {
        problem: 'Censura visual deficiente (retângulos pretos não destrutivos)',
        risk: 'Ao sobrepor caixas pretas ao texto, a outra pessoa pode copiar o texto subjacente com um simples Ctrl+C.',
        solution:
          'Censura binária real que elimina e desvincula permanentemente fluxos de texto confidenciais da árvore do PDF.',
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
        title: 'Conformidade ética sem contratos em nuvem',
        desc: 'Você não precisa assinar contratos de processamento de dados com provedores de armazenamento remoto, pois o documento nunca sai do seu computador.',
      },
      {
        title: 'Bates Folio compatível com litígios internacionais',
        desc: 'Inserir identificadores de página padronizados exigidos em tribunais cíveis, comerciais e de arbitragem comercial.',
      },
      {
        title: 'Operação offline em testes',
        desc: 'Uma vez que o aplicativo web é carregado, ele funciona sem conexão com a internet, seja em tribunais ou durante viagens.',
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
        name: 'PDF Folio (Numeração Bates)',
        nameEn: 'Bates Numbering',
        pathEs: '/editar/foliar',
        pathEn: '/en/bates-numbering',
        pathPt: '/pt/numerar-paginas-pdf',
        badge: 'PEDIDO JUDICIAL',
        reason:
          'Inserir prefixos de arquivo e números de fólio sequenciais em todas as evidências.',
        reasonEn: 'Apply matter prefixes and continuous page sequencing across discovery.',
      },
      {
        name: 'Censurar PDF (Sanitização)',
        nameEn: 'Redact PDF',
        pathEs: '/optimizar/censurar',
        pathEn: '/en/redact-pdf',
        pathPt: '/pt/ocultar-texto-pdf',
        badge: 'SEGURANÇA FORENSE',
        reason:
          'Remove de forma irreversível nomes protegidos, números de identificação e contas bancárias.',
        reasonEn:
          'Permanently purge protected names, social security numbers, and banking details.',
      },
      {
        name: 'Unir PDF',
        nameEn: 'Merge PDF',
        pathEs: '/organizar/unir',
        pathEn: '/en/merge-pdf',
        pathPt: '/pt/juntar-pdf',
        badge: 'COMPILAÇÃO DE ARQUIVOS',
        reason:
          'Consolide as reivindicações, alegações e documentos comprobatórios em um único arquivo.',
        reasonEn: 'Compile pleadings, affidavits, and exhibits into a single binder.',
      },
      {
        name: 'Assinar PDF',
        nameEn: 'Sign PDF',
        pathEs: '/editar/firmar',
        pathEn: '/en/sign-pdf',
        pathPt: '/pt/assinar-pdf',
        badge: 'EMPRESA PRIVADA',
        reason: 'Imprima assinaturas e marcas digitais sem armazenar traços em servidores.',
        reasonEn: 'Affix handwritten and cryptographic signatures with local privacy.',
      },
    ],
    faqs: [
      {
        q: 'Por que o PDFBlack é mais seguro para um escritório de advocacia do que o iLovePDF ou o Adobe Online?',
        a: 'Como as ferramentas convencionais enviam seus PDFs para servidores na nuvem para processamento, criando cópias intermediárias e aumentando os riscos de acesso não autorizado, no PDFBlack, o mecanismo WebAssembly executa toda a lógica na sua própria RAM: nenhum byte do arquivo sai do seu computador.',
      },
      {
        q: 'A numeração Bates do PDFBlack está em conformidade com os requisitos legais?',
        a: 'Sim. Permite definir prefixos alfanuméricos (por exemplo, EXP-2026-), número inicial, preenchimento com zeros à esquerda e posição exata com margens de segurança para evitar sobrepor texto ou assinaturas.',
      },
      {
        q: 'Posso usar o PDFBlack sem acesso à internet durante o período de avaliação?',
        a: 'Sim. Após o primeiro carregamento, o aplicativo web permanece no cache do seu navegador e permite mesclar, ocultar, numerar e proteger documentos offline.',
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
        label: 'Arquivos enviados para a nuvem',
        labelEn: 'Files sent to cloud servers',
      },
      {
        value: '100%',
        label: 'Privacidade na RAM',
        labelEn: 'Client-side RAM execution',
      },
      {
        value: 'NIST',
        label: 'Padrão de saneamento',
        labelEn: 'Forensic sanitization standard',
      },
    ],
  },
  salud: {
    slug: 'salud',
    slugEn: 'healthcare',
    name: 'Setor de Saúde e Assistência Médica',
    nameEn: 'Healthcare & Medical Practice',
    heroBadge: 'CONFORMIDADE COM HIPAA E GDPR NA ÁREA DA SAÚDE',
    h1: 'Processamento de PDFs para hospitais e clínicas médicas',
    h1En: 'HIPAA & Healthcare Compliant PDF Processing',
    subtitle:
      'Protege registros médicos, resultados de exames e dados de pacientes. Em conformidade com as normas HIPAA e GDPR (Art. 9) sem a necessidade de contratos de processamento de dados com provedores de nuvem externos.',
    subtitleEn:
      'Safeguard medical records, diagnostic reports, and protected health information (PHI). Comply with HIPAA and GDPR Article 9 without requiring cloud Business Associate Agreements.',
    metaTitle:
      'PDF para profissionais de saúde e clínicas: Conformidade com a HIPAA e Zero Cloud | PDFBlack',
    metaTitleEn: 'HIPAA Compliant PDF Software: Zero Upload Healthcare Security | PDFBlack',
    metaDescription:
      'Ferramentas em PDF para hospitais e o setor de saúde. Anonimize registros médicos, proteja diagnósticos com AES-256 e processe dados de pacientes com 100% de privacidade local.',
    metaDescriptionEn:
      'Private PDF tools for hospitals and healthcare providers. Anonymize patient charts, encrypt diagnostic reports with AES-256, and process health records locally.',
    keywords: [
      'PDF Conformidade com a HIPAA',
      'Software de PDF para hospitais e clínicas',
      'anonimizar registros médicos em PDF',
      'Dados de saúde do RGPD (PDF)',
      'setor médico privado pdf',
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
        name: 'Regra de segurança HIPAA (45 CFR § 164.312)',
        badge: 'PROTEÇÃO DE INFORMAÇÕES DE SAÚDE PROTEGIDAS',
        description:
          'Como o sistema funciona 100% no dispositivo do profissional de saúde, não há transmissão ou armazenamento de informações de saúde protegidas (PHI, na sigla em inglês) em infraestrutura externa.',
        authority: 'Departamento de Saúde e Serviços Humanos dos EUA (HHS)',
      },
      {
        name: 'Artigo 9 do RGPD (Dados de Saúde)',
        badge: 'DADOS DE CATEGORIA ESPECIAL',
        description:
          'Em conformidade com o princípio da privacidade desde a concepção (Art. 25). Os dados biométricos e de saúde nunca saem do perímetro do centro médico.',
        authority: 'Regulamento Geral de Proteção de Dados (UE)',
      },
      {
        name: 'Não é necessário um BAA (Acordo de Parceiro Comercial).',
        badge: 'ARQUITECTURA CLIENT-SIDE',
        description:
          'Como o PDFBlack nunca armazena nem tem acesso a documentos, elimina-se o ônus administrativo e legal de assinar contratos com fornecedores terceirizados.',
        authority: 'Arquitetura de Conformidade com a HIPAA',
      },
    ],
    challenges: [
      {
        problem: 'Violações graves da HIPAA pelo uso de conversores online gratuitos',
        risk: 'O envio de registros médicos para serviços em nuvem sem um Acordo de Associação Comercial (BAA) acarreta multas federais e severas penalidades regulatórias.',
        solution:
          'A PDFBlack processa as análises clínicas localmente; não há servidor intermediário e nenhum risco de vazamento de dados do paciente.',
      },
      {
        problem: 'Anonimização de históricos médicos para ensaios clínicos e pesquisa',
        risk: 'A exclusão inadequada de dados de pacientes pode permitir a reidentificação em estudos médicos publicados.',
        solution:
          'Ferramenta de censura binária que apaga irreversivelmente nomes, datas de nascimento, números de apólices e metadados DICOM.',
      },
      {
        problem: 'Arquivos de diagnóstico extensos e difíceis de compartilhar entre médicos.',
        risk: 'Exceder os limites de tamanho em e-mails hospitalares ou gateways seguros atrasa a consulta médica.',
        solution:
          'Compressão inteligente que reduz o tamanho de exames médicos, mantendo a legibilidade diagnóstica das imagens.',
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
        title: 'Proteção absoluta de registros médicos (PHI)',
        desc: 'Os dados de saúde nunca saem do computador do médico ou do centro médico.',
      },
      {
        title: 'Anonimização irreversível para ensino e pesquisa',
        desc: 'Censurar dados pessoais em relatórios de laboratório e casos clínicos antes de compartilhá-los.',
      },
      {
        title: 'Cifra militar AES-256 para entrega de pacientes',
        desc: 'Proteja com senha relatórios e resultados de alto nível antes de enviá-los por canais externos.',
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
        pathPt: '/pt/ocultar-texto-pdf',
        badge: 'ANONIMIZAÇÃO PHI',
        reason: 'O sistema oculta e destrói permanentemente os dados pessoais do paciente.',
        reasonEn: 'Permanently remove patient names, dates, and medical record numbers.',
      },
      {
        name: 'Proteja seu PDF com senha.',
        nameEn: 'Protect PDF',
        pathEs: '/optimizar/proteger',
        pathEn: '/en/protect-pdf',
        pathPt: '/pt/proteger-pdf',
        badge: 'CIFRADO AES-256',
        reason: 'Digitalize os resultados das análises clínicas antes de enviá-los pelo correio.',
        reasonEn: 'Encrypt diagnostic results with military-grade passwords before email.',
      },
      {
        name: 'Comprimir PDF',
        nameEn: 'Compress PDF',
        pathEs: '/optimizar/comprimir',
        pathEn: '/en/compress-pdf',
        pathPt: '/pt/comprimir-pdf',
        badge: 'Otimização Clínica',
        reason:
          'Reduzir o tamanho das tomografias computadorizadas e de outros exames de imagem para agilizar o envio.',
        reasonEn: 'Reduce heavy diagnostic scan sizes for rapid clinical sharing.',
      },
      {
        name: 'OCR em PDF',
        nameEn: 'OCR PDF',
        pathEs: '/editar/ocr',
        pathEn: '/en/ocr-pdf',
        pathPt: '/pt/ocr-pdf',
        badge: 'DIGITALIZAÇÃO',
        reason: 'Converta folhetos e receitas digitalizadas em texto selecionável e legível.',
        reasonEn: 'Convert physical paper charts into searchable medical digital text.',
      },
    ],
    faqs: [
      {
        q: 'Por que a PDFBlack não exige a assinatura de um BAA (Business Associate Agreement) de acordo com a HIPAA?',
        a: 'Um Acordo de Aceitação Comercial (BAA, na sigla em inglês) é necessário quando um provedor terceirizado recebe, armazena ou transmite Informações de Saúde Protegidas (PHI, na sigla em inglês). Como o PDFBlack opera inteiramente dentro do seu navegador usando WebAssembly, nenhum arquivo ou dado é transferido para servidores externos, eliminando a necessidade de um BAA e o risco de auditoria.',
      },
      {
        q: 'É seguro censurar nomes de pacientes usando a ferramenta Censor do PDFBlack?',
        a: 'Sim. Ao contrário de programas que simplesmente desenham um retângulo preto sobre o texto, o PDFBlack remove fisicamente os caracteres do código-fonte do PDF, impedindo qualquer tentativa de recuperação por meio de seleção ou engenharia reversa.',
      },
      {
        q: 'É possível compactar análises médicas sem perder a clareza dos gráficos?',
        a: 'Sim. Nosso algoritmo de compressão preserva a resolução necessária em curvas de laboratório e tabelas de diagnóstico, reduzindo drasticamente o tamanho dos fluxos de imagens.',
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
      {
        value: 'HIPAA',
        label: 'Conformidade sem BAA',
        labelEn: 'Compliant without BAA',
      },
      {
        value: '100% Local',
        label: 'Processamento no equipamento',
        labelEn: 'On-device execution',
      },
      {
        value: 'AES-256',
        label: 'Cifra de nível militar',
        labelEn: 'Military-grade cipher',
      },
    ],
  },
  finanzas: {
    slug: 'finanzas',
    slugEn: 'finance',
    name: 'Finanças, Contabilidade e Auditoria',
    nameEn: 'Finance, Accounting & Audit',
    heroBadge: 'CONFORMIDADE COM SOX E PCI-DSS',
    h1: 'Software seguro para criação de PDFs nas áreas de finanças, contabilidade e auditoria.',
    h1En: 'Secure PDF Software for Accounting, Finance & Audit',
    subtitle:
      'Processa demonstrações financeiras não públicas, balanços patrimoniais e auditorias de due diligence sem risco de vazamentos. Extrai tabelas para o Excel (.xlsx), compara contratos preliminares e criptografa documentos localmente.',
    subtitleEn:
      'Process non-public financial reports, general ledgers, and M&A due diligence without data leak risks. Extract pristine Excel tables, compare contract revisions, and encrypt sensitive filings locally.',
    metaTitle:
      'PDF para Finanças e Auditoria: Conformidade com a Lei Sarbanes-Oxley e Nuvem Zero | PDFBlack',
    metaTitleEn: 'PDF for Finance & Accounting: SOX Compliance & Zero Cloud | PDFBlack',
    metaDescription:
      'Ferramentas confidenciais em PDF para empresas de auditoria e diretores financeiros. Extraia tabelas para o Excel, criptografe com AES-256 e compare versões de contratos com 100% de privacidade local.',
    metaDescriptionEn:
      'Confidential PDF tools for accounting firms and CFOs. Extract clean Excel spreadsheets, encrypt financial statements with AES-256, and compare audit drafts privately.',
    keywords: [
      'PDF para contabilistas e auditores',
      'PDF de conformidade com a SOX',
      'Extrair tabelas de PDF para Excel privado',
      'segurança pdf setor financeiro',
      'comparar contratos financeiros pdf',
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
        name: 'Lei Sarbanes-Oxley (Seção 404 da SOX)',
        badge: 'CONTROLE INTERNO FINANCEIRO',
        description:
          'Garante a integridade e a confidencialidade das demonstrações financeiras não públicas durante sua preparação, auditoria e apresentação.',
        authority: 'Comissão de Valores Mobiliários dos Estados Unidos (SEC)',
      },
      {
        name: 'Lei Gramm-Leach-Bliley (Salvaguardas da GLBA)',
        badge: 'PROTEÇÃO FINANCEIRA',
        description:
          'Proteja as informações financeiras não públicas (NPI) dos clientes contra acesso ou armazenamento não autorizados em nuvens públicas não auditadas.',
        authority: 'Comissão Federal de Comércio (FTC)',
      },
      {
        name: 'Detalhes de pagamento e conformidade com PCI-DSS',
        badge: 'SEGURANÇA DA TRANSAÇÃO',
        description:
          'Os números de conta e os extratos bancários são processados sem serem armazenados em servidores ou registrados em logs de terceiros.',
        authority: 'Conselho de Padrões de Segurança PCI',
      },
    ],
    challenges: [
      {
        problem:
          'Vazamento de informações antes da divulgação dos resultados trimestrais (uso de informação privilegiada)',
        risk: 'O envio de resultados preliminares ou auditorias de fusões e aquisições para ferramentas gratuitas expõe dados altamente sensíveis do mercado de ações.',
        solution:
          'Processamento local na RAM: o relatório financeiro nunca sai da rede da empresa.',
      },
      {
        problem: 'Perder horas transcrevendo balanços patrimoniais em PDF para planilhas do Excel.',
        risk: 'A cópia manual de dados contábeis leva a erros de digitação em balanços patrimoniais e auditorias fiscais.',
        solution:
          'Extrator local que detecta a estrutura da tabela e exporta arquivos .xlsx nativos com as colunas exatas.',
      },
      {
        problem: 'Discrepâncias não detectadas entre versões de contratos financeiros',
        risk: 'Alterações sutis nas taxas de juros ou nas cláusulas de amortização podem passar despercebidas em revisões manuais.',
        solution:
          'Comparador semântico e visual que destaca em cores qualquer adição ou exclusão de texto entre duas versões.',
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
        title: 'Extração perfeita para o Microsoft Excel (.xlsx)',
        desc: 'Converta balanços patrimoniais, demonstrações de resultados e carteiras de investimento em planilhas editáveis com alinhamento de células.',
      },
      {
        title: 'Criptografia AES-256 de nível bancário',
        desc: 'Proteja as auditorias de folha de pagamento e fiscais com senhas fortes antes de distribuí-las internamente.',
      },
      {
        title: 'Auditoria visual das alterações entre versões preliminares',
        desc: 'Detecta em segundos qualquer alteração nas cláusulas contratuais ou nos valores contábeis entre duas versões do mesmo PDF.',
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
        pathPt: '/pt/pdf-para-excel',
        badge: 'EXTRAÇÃO DE TABELA',
        reason:
          'Exporte balanços patrimoniais e extratos de contas para planilhas .xlsx totalmente editáveis.',
        reasonEn: 'Extract financial statements and invoices into editable .xlsx spreadsheets.',
      },
      {
        name: 'Proteger PDF',
        nameEn: 'Protect PDF',
        pathEs: '/optimizar/proteger',
        pathEn: '/en/protect-pdf',
        pathPt: '/pt/proteger-pdf',
        badge: 'SEGURANÇA FINANCEIRA',
        reason:
          'Criptografe a folha de pagamento e os extratos bancários com senhas mestras e de usuário.',
        reasonEn: 'Apply owner and user passwords to sensitive payroll ledgers and audits.',
      },
      {
        name: 'Comparar PDF',
        nameEn: 'Compare PDF',
        pathEs: '/optimizar/comparar',
        pathEn: '/en/compare-pdf',
        pathPt: '/pt/comparar-pdf',
        badge: 'AUDITORIA DE CONTRATOS',
        reason: 'Compare dois contratos e destaque as diferenças em taxas, valores ou cláusulas.',
        reasonEn: 'Highlight discrepancies between loan agreements and audit revisions.',
      },
      {
        name: 'Reparar PDF',
        nameEn: 'Repair PDF',
        pathEs: '/optimizar/reparar',
        pathEn: '/en/repair-pdf',
        pathPt: '/pt/reparar-pdf',
        badge: 'RECUPERAÇÃO DE DADOS',
        reason:
          'Restaura arquivos danificados ou corrompidos para recuperar relatórios financeiros.',
        reasonEn: 'Rebuild corrupted or truncated financial reports from damaged PDFs.',
      },
    ],
    faqs: [
      {
        q: 'É seguro processar folhas de pagamento e demonstrações financeiras no PDFBlack?',
        a: 'É 100% seguro. Ao contrário dos serviços em nuvem que armazenam cópias temporárias em seus servidores, o PDFBlack opera exclusivamente no ambiente protegido do seu navegador, utilizando WebAssembly. Seus saldos nunca são enviados para nenhum servidor externo.',
      },
      {
        q: 'Como funciona a extração de tabelas para o Excel sem enviar os dados para um servidor?',
        a: 'Utilizamos um mecanismo de análise vetorial em WebAssembly que detecta as coordenadas das linhas, bordas e células da tabela diretamente no cliente, estruturando um arquivo .xlsx nativo que pode ser baixado para o seu computador.',
      },
      {
        q: 'Isso permite a conformidade com os controles internos da Lei Sarbanes-Oxley (SOX)?',
        a: 'Sim, porque impede a dispersão de dados confidenciais em infraestruturas não certificadas ou em fornecedores de SaaS que não possuam a certificação SOC2 em sua empresa.',
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
        label: 'conformidade com os controles internos',
        labelEn: 'Internal control compliance',
      },
      {
        value: '.XLSX',
        label: 'tabelas nativas editáveis',
        labelEn: 'Native editable tables',
      },
      {
        value: '0 Riesgos',
        label: 'Sem vazamentos de dados do mercado de ações',
        labelEn: 'No financial data leakage',
      },
    ],
  },
  gobierno: {
    slug: 'gobierno',
    slugEn: 'government',
    name: 'Setor público, governo e defesa',
    nameEn: 'Public Sector & Government',
    heroBadge: 'SOBERANIA DE DADOS E ZERO-CLOUD',
    h1: 'Gestão de Documentos em PDF para Administração Pública',
    h1En: 'Sovereign PDF Management for Public Sector & Government',
    subtitle:
      'Garante a soberania digital dos dados públicos e dos registros administrativos. Processa licitações, especificações técnicas e documentos confidenciais sem depender de servidores em nuvem em jurisdições estrangeiras.',
    subtitleEn:
      'Ensure data sovereignty across public records and procurement files. Process tenders, official gazettes, and classified documents without dependency on foreign cloud servers.',
    metaTitle: 'PDF para o Setor Público e Governo: Soberania de Dados | PDFBlack',
    metaTitleEn: 'Government & Public Sector PDF Software: Data Sovereignty | PDFBlack',
    metaDescription:
      'Soluções em PDF para administração pública e órgãos estatais. Higienização de informações confidenciais, paginação de arquivos e preservação de PDF/A com 100% de soberania local.',
    metaDescriptionEn:
      'Sovereign PDF solutions for government agencies and public institutions. Classified data sanitization, official record numbering, and PDF/A archiving with zero cloud transit.',
    keywords: [
      'PDF para administração pública',
      'soberania de dados pdf governo',
      'esquema de segurança nacional pdf',
      'censurar documentos classificados em PDF',
      'criar dossiês foliares para contratação pública',
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
        name: 'Soberania de Dados Digitais',
        badge: 'NUVEM EXTERNA ZERO',
        description:
          'Os processos de licitação, os dados dos cidadãos e os documentos de defesa nunca cruzam fronteiras nacionais nem são armazenados em centros de dados comerciais.',
        authority: 'Diretiva Europeia de Governança de Dados (DGA)',
      },
      {
        name: 'Plano Nacional de Segurança (ENS)',
        badge: 'ALTA SEGURANÇA',
        description:
          'Cumprimento das medidas de segurança no tratamento de informações públicas por meio do isolamento no local de trabalho do funcionário.',
        authority: 'Centro Nacional de Criptologia (CCN-CERT)',
      },
      {
        name: 'Preservação a Longo Prazo (ISO 19005 / PDF/A)',
        badge: 'ARQUIVOS ESTADUAIS',
        description:
          'Isso garante que as disposições e resoluções públicas permaneçam legíveis e inalteradas por décadas, de acordo com os padrões de arquivamento histórico.',
        authority: 'Organização Internacional de Normalização (ISO)',
      },
    ],
    challenges: [
      {
        problem:
          'Proibição legal de transferência de dados públicos para servidores estrangeiros (Lei da Nuvem)',
        risk: 'A utilização de ferramentas padrão em nuvem hospeda dados em nuvens sujeitas a leis de acesso estrangeiro incompatíveis com a soberania do Estado.',
        solution:
          'O PDFBlack funciona de forma independente no navegador; não há transmissão transfronteiriça de dados dos cidadãos.',
      },
      {
        problem: 'Vazamento de segredos de Estado ou dados confidenciais em boletins oficiais.',
        risk: 'A publicação de documentos com texto censurado usando ferramentas básicas permite a descoberta de dados de segurança nacional.',
        solution:
          'Censura forense que remove objetos do PDF antes de sua publicação em sites eletrônicos ou boletins oficiais.',
      },
      {
        problem: 'Arquivos de licitação enormes com páginas desorganizadas',
        risk: 'A interpolação ou a desordem das propostas em concursos públicos podem invalidar contratos multimilionários.',
        solution:
          'Numeração sequencial Bates e reordenação de páginas que garantem rastreabilidade administrativa rigorosa.',
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
        title: 'Soberania absoluta no local de trabalho',
        desc: 'Os dados administrativos são processados exclusivamente nos computadores dos funcionários públicos, sem serem acessados pela rede.',
      },
      {
        title: 'Higienização certificada de documentos confidenciais',
        desc: 'Remove de forma irreversível as informações confidenciais antes de sua publicação em portais de transparência.',
      },
      {
        title: 'Preparação para o arquivamento digital de longo prazo',
        desc: 'Converter documentos com fidelidade exata às especificações de preservação permanente.',
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
        name: 'Censurar PDF (Sanitização)',
        nameEn: 'Redact PDF',
        pathEs: '/optimizar/censurar',
        pathEn: '/en/redact-pdf',
        pathPt: '/pt/ocultar-texto-pdf',
        badge: 'TRANSPARÊNCIA E ACESSO À INFORMAÇÃO',
        reason:
          'Remova as informações confidenciais antes de publicar os acordos nos portais de transparência.',
        reasonEn: 'Purge classified intelligence prior to releasing files under FOIA requests.',
      },
      {
        name: 'Foliar PDF (Expedientes)',
        nameEn: 'Bates Numbering',
        pathEs: '/editar/foliar',
        pathEn: '/en/bates-numbering',
        pathPt: '/pt/numerar-paginas-pdf',
        badge: 'PROCEDIMENTO ADMINISTRATIVO',
        reason: 'Arquivos de contratação pública Folia e especificações técnicas de licitação.',
        reasonEn: 'Number public procurement tenders and administrative dossiers.',
      },
      {
        name: 'Convertir Word a PDF',
        nameEn: 'Word to PDF',
        pathEs: '/convertir/word-pdf',
        pathEn: '/en/word-to-pdf',
        pathPt: '/pt/word-para-pdf',
        badge: 'PUBLICAÇÃO OFICIAL',
        reason: 'Converter decretos e resoluções para PDF com fontes e vetores fixos.',
        reasonEn: 'Convert decrees and resolutions into fixed-layout official PDFs.',
      },
      {
        name: 'Dividir PDF',
        nameEn: 'Split PDF',
        pathEs: '/organizar/dividir',
        pathEn: '/en/split-pdf',
        pathPt: '/pt/dividir-pdf',
        badge: 'GESTÃO DE ARQUIVOS',
        reason: 'Separe os arquivos administrativos pesados em pastas individuais.',
        reasonEn: 'Extract individual administrative dossiers from bulky multi-part files.',
      },
    ],
    faqs: [
      {
        q: 'Como a PDFBlack garante que nenhum dado público saia da rede governamental?',
        a: 'Quando o PDFBlack é aberto no navegador oficial, os módulos WebAssembly são carregados na memória apenas uma vez. A partir desse momento, qualquer arquivo aberto é gerenciado exclusivamente na memória RAM do computador local. Nenhum servidor recebe os bytes ou armazena cópias temporárias.',
      },
      {
        q: 'Pode ser usado em ambientes desconectados da Internet (Air-Gapped)?',
        a: 'Sim. Uma vez que o aplicativo é carregado no navegador, o sistema pode funcionar de forma 100% autônoma, sem conexão com a internet ou em redes internas fechadas.',
      },
      {
        q: 'A função de censura está em conformidade com as diretivas de transparência e proteção de dados?',
        a: 'Sim. Atende aos critérios de sanitização da NIST SP 800-88, removendo o texto subjacente e reconstruindo os objetos para impedir a recuperação de dados por meio de engenharia reversa.',
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
      {
        value: '100%',
        label: 'Soberania digital local',
        labelEn: 'Local data sovereignty',
      },
      {
        value: 'Air-Gapped',
        label: 'Operação offline',
        labelEn: 'Offline air-gapped support',
      },
      {
        value: 'NIST',
        label: 'Higienização de segredos',
        labelEn: 'Secret sanitization standard',
      },
    ],
  },
};
