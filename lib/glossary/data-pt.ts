import { GlossaryTerm } from './types';

export const GLOSSARY_TERMS_PT: Record<string, GlossaryTerm> = {
  'numeracion-bates': {
    slug: 'numeracion-bates',
    slugEn: 'bates-numbering',
    term: 'Numeração Bates',
    termEn: 'Bates Numbering',
    category: 'legal',
    categoryLabel: 'Prática Jurídica e Processual',
    badge: 'PADRÃO DE PROCEDIMENTO JUDICIAL',
    metaTitle: 'O que é a numeração Bates em PDF? Guia técnico e jurídico | PDFBlack',
    metaDescription:
      'Descubra o que é a numeração Bates em documentos PDF, como ela é estruturada em disputas legais e como paginar arquivos com prefixos alfanuméricos de forma 100% privada.',
    keywords: [
      'O que é numeração Bates?',
      'numeração bates pdf',
      'O que é a marcação Bates?',
      'foliar expediente judicial bates',
      'Como adicionar morcegos a um PDF',
      'numeração bates legal',
    ],
    blufDefinition:
      'A numeração Bates é um sistema sequencial de indexação e paginação alfanumérica usado em processos judiciais, auditorias e acordos corporativos para identificar, rastrear e citar de forma única cada página individual dentro de um registro de evidências.',
    standardReference: 'Federal Rules of Civil Procedure (FRCP Rule 34) & ISO 32000-1',
    fullExplanation:
      'Inventado no final do século XIX por Edwin G. Bates como um dispositivo de selagem mecânica, o sistema de numeração Bates tornou-se o padrão global na descoberta de provas digitais (e-Discovery). No formato PDF digital, o selo Bates insere um identificador persistente (normalmente composto por um prefixo alfanumérico que indica maiúsculas e minúsculas, seguido por zeros à esquerda e um número sequencial, por exemplo, `EXP-2026-000042`) em margens predefinidas, sem alterar o fluxo tipográfico ou os hiperlinks do documento original.',
    specifications: [
      {
        label: 'Estrutura usual',
        value: '[Prefixo de maiúsculas e minúsculas]-[Número preenchido com zeros à esquerda]',
      },
      {
        label: 'Posição padrão',
        value: 'canto inferior direito ou margem superior direita',
      },
      {
        label: 'Tipografia recomendada',
        value: 'Monospace o Sans-Serif nítida (Helvetica, Arial, Courier)',
      },
      {
        label: 'Impacto no objeto PDF',
        value: 'Inserção direta de vetores no fluxo de conteúdo da página',
      },
    ],
    practicalApplication: {
      title: 'Aplicações práticas da numeração de Bates',
      description:
        'A descrição de Bates é um requisito obrigatório na maioria dos tribunais internacionais, tribunais arbitrais e empresas de auditoria.',
      useCases: [
        'Apresentação de provas documentais em processos cíveis, criminais e contenciosos.',
        'Requisitos para auditorias e inspeções fiscais.',
        'Processos de Due Diligence em fusões e aquisições (M&A).',
        'Organização de prontuários médicos hospitalares para exames forenses.',
      ],
    },
    commonPitfalls: [
      'Use a numeração de páginas básica (1, 2, 3) em vez do formato contínuo para evitar a interpolação do texto.',
      'Sobreposição do selo Bates sobre assinaturas existentes, selos notariais ou texto legal, sem definir margens de segurança.',
    ],
    faqs: [
      {
        q: 'Qual a diferença entre a numeração Bates e a numeração de páginas normal?',
        a: 'A numeração padrão indica apenas a sequência de leitura dentro de um documento (Página 1 de 10). A numeração Bates fornece uma identificação legal única e contínua em vários documentos independentes (por exemplo, se você combinar cinco PDFs de 20 páginas, o sistema Bates atribui números de página de 0001 a 0100 sem reiniciar a contagem).',
      },
      {
        q: 'É possível aplicar a numeração Bates a um PDF digitalizado?',
        a: 'Sim. No PDFBlack, você pode importar documentos digitalizados ou vetoriais; o selo Bates é incorporado como uma camada vetorial limpa sobreposta nas coordenadas exatas escolhidas.',
      },
    ],
    relatedTool: {
      name: 'Numerar PDF (Numeração Bates)',
      slug: 'numerar-paginas',
      path: '/pt/numerar-paginas',
      desc: 'Insira prefixos, sufixos e números correlativos em seus processos diretamente no navegador.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'censura-binaria-pdf'],
  },
  'pdf-a-vs-pdf-estandar': {
    slug: 'pdf-a-vs-pdf-estandar',
    slugEn: 'pdf-a-vs-standard-pdf',
    term: 'PDF/A vs PDF padrão (Preservação digital a longo prazo)',
    termEn: 'PDF/A vs Standard PDF',
    category: 'estandares',
    categoryLabel: 'Normas Internacionais ISO',
    badge: 'NORMA ISO 19005',
    metaTitle: 'PDF/A vs. PDF Standard: Diferenças, Níveis e Requisitos ISO | PDFBlack',
    metaDescription:
      'Diferenças técnicas entre os formatos PDF/A e PDF padrão. Saiba mais sobre os perfis PDF/A-1b e PDF/A-2b, quais elementos são proibidos e como cumprir as exigências legais para arquivos permanentes.',
    keywords: [
      'pdf a vs pdf',
      'diferenças entre PDF e PDF',
      'O que é PDF?',
      'formato pdf de longo prazo',
      'ISO 19005',
      'pdf a 1b pdf a 2b',
    ],
    blufDefinition:
      'O PDF/A é um subconjunto estritamente padronizado do PDF (ISO 19005) projetado especificamente para arquivamento digital de longo prazo. Ele proíbe elementos que dependem de software externo — como fontes não incorporadas, criptografia e JavaScript — garantindo que o arquivo seja exibido exatamente da mesma forma daqui a décadas.',
    standardReference:
      'ISO 19005-1:2005 (PDF/A-1), ISO 19005-2:2011 (PDF/A-2), ISO 19005-3:2012 (PDF/A-3)',
    fullExplanation:
      'Um PDF convencional prioriza a flexibilidade interativa: ele pode conter código JavaScript dinâmico, links para fontes instaladas no sistema do usuário, áudio, vídeo e algoritmos de compressão proprietários. Com o tempo, se essas fontes desaparecerem ou se o visualizador deixar de suportar um plugin, o documento fica corrompido. O PDF/A resolve esse problema forçando a incorporação de 100% das fontes, metadados estruturados em XMP e perfis de cores ICC calibrados, garantindo reprodutibilidade visual infinita.',
    specifications: [
      {
        label: 'Incorporação de fontes',
        value: '100% obrigatório (todas as fontes e glifos devem estar incluídos no arquivo)',
      },
      {
        label: 'JavaScript e código executável',
        value: 'Estritamente proibido',
      },
      {
        label: 'Criptografia e senhas',
        value: 'Não permitido (impede o salvamento automático de arquivos)',
      },
      {
        label: 'Espaços de cor',
        value: 'Definido obrigatoriamente usando perfis ICC independentes de dispositivo.',
      },
    ],
    practicalApplication: {
      title: 'Quando o uso de PDF/A é obrigatório?',
      description:
        'Governos e instituições públicas exigem o PDF/A como o único formato válido para preservação de documentos.',
      useCases: [
        'Cadastro nos órgãos eletrônicos da administração pública e nos boletins oficiais do Estado.',
        'Depósito de teses de doutorado e publicações acadêmicas em repositórios universitários.',
        'Preservação de escrituras notariais e registros de imóveis.',
        'Arquivo histórico de projetos arquitetônicos e de engenharia civil.',
      ],
    },
    commonPitfalls: [
      'Salvar um documento com proteção por senha e esperar que ele esteja em conformidade com o padrão PDF/A (a criptografia invalida o padrão).',
      'Utilizar fontes com licenças proprietárias que proíbem sua incorporação no arquivo.',
    ],
    faqs: [
      {
        q: 'O que significa a letra em PDF/A (por exemplo, PDF/A-1b vs PDF/A-1a)?',
        a: 'O "b" significa "Básico" (garante apenas fidelidade visual idêntica). O "a" significa "Acessível" (além da fidelidade visual, exige a rotulagem semântica da ordem de leitura para leitores de tela destinados a pessoas com deficiência visual).',
      },
      {
        q: 'Posso converter um arquivo digitalizado do Word ou PDF para um formato que possa ser preservado?',
        a: 'Sim. Ao converter um documento do Word para PDF ou aplicar OCR a uma digitalização no PDFBlack, as fontes e as camadas de texto são incorporadas como vetores limpos no corpo do documento.',
      },
    ],
    relatedTool: {
      name: 'Converter Word para PDF',
      slug: 'word-para-pdf',
      path: '/pt/word-para-pdf',
      desc: 'Gere documentos vetoriais com tipografia incorporada de acordo com padrões de preservação.',
    },
    relatedTerms: ['numeracion-bates', 'cifrado-aes-256-pdf'],
  },
  'cifrado-aes-256-pdf': {
    slug: 'cifrado-aes-256-pdf',
    slugEn: 'aes-256-pdf-encryption',
    term: 'Cifrado AES-256 en PDF (Seguridad Criptográfica)',
    termEn: 'AES-256 PDF Encryption',
    category: 'seguridad',
    categoryLabel: 'Criptografia e Segurança Cibernética',
    badge: 'PADRÃO MILITAR E ISO 32000-2',
    metaTitle: 'Criptografia AES-256 em PDFs: O que é e como protege seus documentos | PDFBlack',
    metaDescription:
      'Aprenda como funciona a criptografia simétrica AES de 256 bits em arquivos PDF. Discuta as diferenças em relação a algoritmos obsoletos (RC4 de 40 bits e 128 bits) e sua compatibilidade técnica.',
    keywords: [
      'cifrado aes 256 pdf',
      'encriptar pdf aes 256',
      'PDF criptografado seguro',
      'diferença entre aes e rc4 pdf',
      'contrasena militar pdf',
      'iso 32000 2 cifrado',
    ],
    blufDefinition:
      'A criptografia AES-256 em PDFs é o padrão criptográfico mais avançado para proteção de documentos (especificado na norma ISO 32000-2). Ela utiliza uma chave simétrica de 256 bits e 14 rodadas de transformação matemática, tornando sua descriptografia computacionalmente inviável por meio de ataques de força bruta.',
    standardReference: 'FIPS PUB 197 & ISO 32000-2:2020 (PDF 2.0 Encryption Handler Extension)',
    fullExplanation:
      'Durante as primeiras versões da especificação PDF na década de 1990, a segurança dependia do algoritmo RC4 com chaves fracas de 40 ou 128 bits. Hoje, um computador convencional consegue quebrar uma chave RC4 em questão de minutos. A introdução do algoritmo AES (Advanced Encryption Standard) no modo CBC com chaves de 256 bits transformou a segurança de documentos: o número de combinações possíveis é 2^256 (aproximadamente 1,15 x 10^77), um número maior que o número de átomos no universo observável.',
    specifications: [
      {
        label: 'Comprimento da tecla',
        value: '256 bits (32 bytes)',
      },
      {
        label: 'Rodadas de criptografia',
        value: '14 rodadas de substituição e permutação',
      },
      {
        label: 'Função de derivação chave',
        value: 'SASLprep + SHA-256 com salt de 32 bytes',
      },
      {
        label: 'Compatibilidade do visualizador',
        value: 'Adobe Acrobat 9+, navegadores modernos e leitores de ISO.',
      },
    ],
    practicalApplication: {
      title: 'Onde é utilizada a criptografia AES-256?',
      description:
        'Qualquer documento que contenha propriedade intelectual ou segredos comerciais deve ser protegido pelo protocolo AES-256.',
      useCases: [
        'Proteção das demonstrações financeiras e folhas de pagamento da empresa antes do envio.',
        'Criptografia de acordos de confidencialidade (NDAs) e fórmulas de patentes industriais.',
        'Prevenção da cópia, modificação ou impressão não autorizada de manuais e contratos.',
        'Transmissão de registros médicos confidenciais em estrita conformidade com a lei HIPAA.',
      ],
    },
    commonPitfalls: [
      'O uso de senhas curtas ou previsíveis, como "123456", permite ataques de dicionário, apesar da robustez do algoritmo.',
      'Utilizar software desatualizado que usa a versão obsoleta RC4, rotulando-o falsamente como de "alta segurança".',
    ],
    faqs: [
      {
        q: 'Existe alguma diferença entre a senha de login e a senha de permissões?',
        a: 'Sim. A senha do usuário criptografa toda a estrutura binária e é necessária para abrir e visualizar o arquivo. A senha do proprietário não impede a leitura, mas bloqueia ações específicas, como copiar texto para a área de transferência, imprimir em alta resolução ou extrair páginas.',
      },
      {
        q: 'O PDFBlack envia minha senha ou documento para um servidor para criptografá-lo?',
        a: 'Nunca. No PDFBlack, a criptografia AES-256 é compilada e executada localmente na memória RAM do seu navegador usando módulos WebAssembly. Sua senha e seus arquivos nunca chegam a nenhum servidor externo.',
      },
    ],
    relatedTool: {
      name: 'Proteger PDF com Senha',
      slug: 'proteger-pdf',
      path: '/pt/proteger-pdf',
      desc: 'Aplique criptografia militar AES-256 aos seus arquivos sem enviá-los para a nuvem.',
    },
    relatedTerms: ['censura-binaria-pdf', 'procesamiento-zero-knowledge-pdf'],
  },
  'censura-binaria-pdf': {
    slug: 'censura-binaria-pdf',
    slugEn: 'binary-pdf-redaction',
    term: 'Censura binária em PDF (higienização real vs. mascaramento visual)',
    termEn: 'Binary PDF Redaction',
    category: 'seguridad',
    categoryLabel: 'Privacidade e Sanitização Forense',
    badge: 'SEGURANÇA FORENSE',
    metaTitle: 'Censura binária em PDF: por que desenhar retângulos pretos é perigoso | PDFBlack',
    metaDescription:
      'Aprenda o que é censura binária real em PDFs. Entenda o perigo das máscaras pretas visuais que deixam o texto subjacente copiável e como higienizar documentos.',
    keywords: [
      'censura binária pdf',
      'escrever pdf que é',
      'remover dados confidenciais pdf',
      'retângulo preto de perigo pdf',
      'sanitizar documento pdf',
    ],
    blufDefinition:
      'A censura binária é o processo forense de remoção física de fluxos de texto, vetores e imagens confidenciais do código-fonte de um PDF, reconstruindo a árvore de objetos de forma que os dados censurados sejam irrecuperáveis por qualquer técnica de extração.',
    standardReference: 'NSA Document Redaction Best Practices & ISO 32000-1 (Section 14.8.4)',
    fullExplanation:
      'Um dos erros mais comuns e dispendiosos em escritórios de advocacia e agências governamentais é "encobrir" texto confidencial desenhando um retângulo preto com um editor gráfico. Visualmente, o texto parece oculto, mas os bytes subjacentes permanecem intactos no fluxo do PDF: qualquer pessoa pode selecioná-lo, copiá-lo para a área de transferência ou extraí-lo usando scripts automatizados. A verdadeira censura binária intercepta as coordenadas da área, remove os glifos tipográficos e gera um novo fluxo de página limpo.',
    specifications: [
      {
        label: 'Mecanismo de ação',
        value: 'Destruição física de bytes no fluxo de conteúdo da página',
      },
      {
        label: 'Metadados associados',
        value: 'Sanitização automática de propriedades XML/XMP, autor e data.',
      },
      {
        label: 'Reversibilidade',
        value: 'Absolutamente irreversível (os dados não existem no arquivo baixado)',
      },
      {
        label: 'resistência OCR',
        value: 'Impossível de recuperar por meio de análise de imagem ou texto.',
      },
    ],
    practicalApplication: {
      title: 'Casos críticos de censura binária',
      description:
        'Evite multas milionárias por violar a proteção de dados pessoais e segredos de Estado.',
      useCases: [
        'Ocultação de números de Segurança Social, cartões de identidade e cartões bancários em registos públicos.',
        'Proteção da identidade de testemunhas protegidas e menores em decisões judiciais.',
        'Higienização de contratos comerciais através da eliminação de margens de lucro e preços unitários confidenciais.',
        'Anonimização de registros médicos para estudos epidemiológicos e pesquisa médica.',
      ],
    },
    commonPitfalls: [
      'Desenhe formas pretas usando as ferramentas básicas de desenho do leitor de PDF.',
      'Altere a cor da fonte para branco (o texto permanece indexável e selecionável).',
      'Esquecer de remover os metadados do documento, onde o nome do autor ou o título sensível às vezes são duplicados.',
    ],
    faqs: [
      {
        q: 'Como posso verificar se a censura foi feita corretamente?',
        a: 'Abra o PDF em qualquer visualizador da web, pressione Ctrl+A (selecionar tudo) e tente copiar e colar o texto sobre a área censurada no Bloco de Notas. Se o texto censurado aparecer na área de transferência, o documento foi ocultado visualmente, e não censurado binariamente.',
      },
      {
        q: 'O PDFBlack também remove metadados ocultos ao censurar?',
        a: 'Sim. Ao aplicar censura no PDFBlack, o mecanismo higieniza a estrutura do objeto removendo o histórico de revisões, metadados XMP legados e anotações ocultas.',
      },
    ],
    relatedTool: {
      name: 'Censurar PDF',
      slug: 'proteger-pdf',
      path: '/pt/proteger-pdf',
      desc: 'Elimine dados confidenciais de forma permanente e irrecuperável na memória RAM.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'procesamiento-zero-knowledge-pdf'],
  },
  'ocr-reconocimiento-optico-pdf': {
    slug: 'ocr-reconocimiento-optico-pdf',
    slugEn: 'ocr-optical-character-recognition-pdf',
    term: 'OCR em PDF (Reconhecimento Óptico de Caracteres)',
    termEn: 'OCR (Optical Character Recognition) in PDF',
    category: 'tecnologia',
    categoryLabel: 'Inteligência Artificial e Processamento de Imagens',
    badge: 'IA E VISÃO COMPUTACIONAL',
    metaTitle: 'O que é OCR em PDF? Como funciona o reconhecimento óptico de caracteres | PDFBlack',
    metaDescription:
      'Descubra o que é OCR (Reconhecimento Óptico de Caracteres) em documentos PDF. Aprenda como ele transforma imagens e digitalizações em texto selecionável e pesquisável.',
    keywords: [
      'O que é OCR em PDF?',
      'reconhecimento óptico de caracteres',
      'Criar PDFs OCR pesquisáveis',
      'Como funciona o OCR?',
      'tesseract wasm ocr',
      'Converter imagem PDF em texto',
    ],
    blufDefinition:
      'OCR (Reconhecimento Óptico de Caracteres) é uma tecnologia que analisa imagens digitais de texto dentro de um arquivo PDF digitalizado e as traduz em caracteres tipográficos reais, inserindo uma camada de texto invisível que permite pesquisar palavras, selecionar e copiar conteúdo.',
    standardReference: 'ISO 32000-1 (Hidden Text Layer Specification)',
    fullExplanation:
      'Ao digitalizar um documento impresso ou fotografar uma folha de papel, o PDF resultante é simplesmente um conjunto de bitmaps (pixels). Para o computador, não existem palavras ou letras, apenas uma imagem gráfica. O mecanismo de OCR processa a imagem usando algoritmos de visão computacional e redes neurais: ele detecta linhas de texto, segmenta palavras e reconhece os padrões geométricos de cada letra. Em seguida, gera um PDF pesquisável, preservando a imagem digitalizada original em primeiro plano e posicionando o texto reconhecido precisamente atrás de cada palavra.',
    specifications: [
      {
        label: 'Estrutura técnica',
        value:
          'Imagem original no plano frontal + Camada de texto invisível com modo de renderização 3 (Modo de renderização de texto 3)',
      },
      {
        label: 'Resoluç��o recomendada',
        value: '300 DPI em tons de cinza ou em cores para máxima precisão.',
      },
      {
        label: 'Motor utilizado',
        value: 'Tesseract v5 compilado para WebAssembly (WASM) para execução local.',
      },
      {
        label: 'Compatibilidade de pesquisa',
        value:
          'Totalmente indexável pelo Google, Spotlight, Pesquisa do Windows e visualizadores de PDF.',
      },
    ],
    practicalApplication: {
      title: 'Benefícios e casos de uso do OCR',
      description:
        'Transforme montanhas de papel físico em ativos digitais dinâmicos e pesquisáveis em milissegundos.',
      useCases: [
        'Digitalização de faturas e recibos em papel para processamento contábil automático.',
        'Pesquisa por palavras-chave específicas (Ctrl + F) em livros e arquivos com centenas de páginas.',
        'Extrair citações e trechos de texto de documentos digitalizados sem precisar transcrevê-los manualmente.',
        'Cumprimento dos requisitos judiciais para a entrega de documentos eletrônicos indexáveis.',
      ],
    },
    commonPitfalls: [
      'A digitalização com resolução inferior a 150 DPI reduz drasticamente a taxa de acerto do mecanismo OCR.',
      'Documentos com distorção (viés) excessiva sem aplicação prévia de normalização de rotação.',
    ],
    faqs: [
      {
        q: 'Por que meu PDF digitalizado não me permite pesquisar palavras com Ctrl+F?',
        a: 'Como seu PDF contém apenas uma fotografia das páginas e não possui uma camada de texto digital incorporada, você precisa usar uma ferramenta de OCR para que o documento reconheça os caracteres e crie a camada pesquisável.',
      },
      {
        q: 'O OCR do PDFBlack envia meus documentos digitalizados para servidores de IA na nuvem?',
        a: 'Não. O modelo de reconhecimento do PDFBlack funciona inteiramente no seu navegador através do WebAssembly. As imagens dos seus documentos nunca trafegam pela internet.',
      },
    ],
    relatedTool: {
      name: 'OCR PDF Online',
      slug: 'ocr-pdf',
      path: '/pt/ocr-pdf',
      desc: 'Converta documentos digitalizados em texto selecionável e pesquisável sem upload.',
    },
    relatedTerms: ['numeracion-bates', 'pdf-a-vs-pdf-estandar'],
  },
  'procesamiento-zero-knowledge-pdf': {
    slug: 'procesamiento-zero-knowledge-pdf',
    slugEn: 'zero-knowledge-pdf-processing',
    term: 'Processamento de PDF com conhecimento zero (arquitetura sem servidor)',
    termEn: 'Zero-Knowledge PDF Processing',
    category: 'tecnologia',
    categoryLabel: 'Arquitetura de Software e Privacidade',
    badge: 'ARQUITETURA DE PRIVACIDADE PURA',
    metaTitle: 'O que é Processamento de Conhecimento Zero em PDF? | PDFBlack',
    metaDescription:
      'Aprenda sobre a arquitetura de conhecimento zero aplicada à manipulação de documentos PDF. Descubra como a computação do lado do cliente em WebAssembly garante total privacidade matemática.',
    keywords: [
      'Processamento de conhecimento zero em PDF',
      'arquitetura de conhecimento zero',
      'processamento no cliente wasm',
      'editor pdf sin servidores',
      'privacidade matemática pdf',
      'webassembly pdf local',
    ],
    blufDefinition:
      'O processamento de conhecimento zero em software de documentos é um paradigma de projeto arquitetônico onde todas as operações no arquivo são realizadas exclusivamente no hardware local do usuário (navegador WebAssembly), de forma que os servidores do fornecedor nunca saibam, recebam ou processem o conteúdo dos documentos.',
    standardReference: 'Privacy by Design (GDPR Article 25) & W3C WebAssembly Standard',
    fullExplanation:
      'Na arquitetura web tradicional baseada em nuvem, quando um usuário clica em "comprimir" ou "mesclar", o arquivo viaja pela internet até um servidor remoto, é processado no centro de dados do provedor e enviado de volta. Durante esse processo, o provedor tem acesso técnico ao documento. Em contraste, a arquitetura de conhecimento zero do PDFBlack baixa os binários de computação WebAssembly compilados para o navegador do usuário apenas uma vez. A partir desse momento, a RAM e o processador do seu dispositivo realizam todo o trabalho computacional. Sem pacotes de rede contendo o conteúdo do seu arquivo, o provedor literalmente não tem conhecimento algum sobre seus documentos.',
    specifications: [
      {
        label: 'Solicitações de rede com dados do PDF',
        value: '0 requisições HTTP (verificável na rede F12)',
      },
      {
        label: 'Ambiente de execução',
        value: 'RAM volátil e Web Workers isolados do navegador',
      },
      {
        label: 'persistência de disco do servidor',
        value: '0 bytes (nada armazenado)',
      },
      {
        label: 'Conformidade regulamentar',
        value: 'Conformidade automática com GDPR, CCPA, HIPAA e sigilo profissional.',
      },
    ],
    practicalApplication: {
      title: 'Importância no ecossistema corporativo moderno',
      description: 'A única garantia real de segurança é não fornecer as informações a terceiros.',
      useCases: [
        'Trabalho com segredos comerciais e propriedade intelectual protegidos por rigorosos acordos de confidencialidade.',
        'Gerenciamento da folha de pagamento e dos registros contábeis dos funcionários sem a necessidade de contratos de processamento de dados (DPA).',
        'Operações documentais em organizações militares, de defesa ou governamentais com políticas de zero nuvem.',
      ],
    },
    commonPitfalls: [
      'Confundir "conexão HTTPS" com "privacidade de conhecimento zero": o HTTPS protege a transmissão de informações, mas o servidor remoto ainda pode receber e ler o arquivo. Já a privacidade de conhecimento zero não envia o arquivo em primeiro lugar.',
    ],
    faqs: [
      {
        q: 'Como posso provar ao meu departamento de segurança que o PDFBlack é de conhecimento zero?',
        a: 'Abra as ferramentas de desenvolvedor do seu navegador (pressione F12), acesse a aba "Rede" e processe qualquer documento. Você verá que nenhuma chamada HTTP é feita para os servidores que contêm o conteúdo do seu PDF. Toda a atividade ocorre dentro da memória do seu computador.',
      },
      {
        q: 'Funciona se eu não tiver conexão com a internet?',
        a: 'Sim. Assim que a página carrega no navegador, o código WebAssembly é armazenado em cache localmente, e você pode continuar trabalhando com PDFs mesmo sem acesso à internet ou em modo avião.',
      },
    ],
    relatedTool: {
      name: 'Política de Privacidade e Arquitetura',
      slug: 'privacidade',
      path: '/pt',
      desc: 'Conheça os fundamentos técnicos da nossa arquitetura de processamento local sem servidor.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'censura-binaria-pdf'],
  },
};
