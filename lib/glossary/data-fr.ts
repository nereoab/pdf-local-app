import { GlossaryTerm } from './types';

export const GLOSSARY_TERMS_FR: Record<string, GlossaryTerm> = {
  'numeracion-bates': {
    slug: 'numeracion-bates',
    slugEn: 'bates-numbering',
    term: 'Numérotation Bates',
    termEn: 'Bates Numbering',
    category: 'legal',
    categoryLabel: 'Pratique juridique et procédurale',
    badge: 'NORMES DE PROCÉDURE JUDICIAIRE',
    metaTitle:
      'Qu’est-ce que la numérotation Bates dans les PDF ? Guide technique et juridique | PDFBlack',
    metaDescription:
      "Découvrez ce qu'est la numérotation Bates dans les documents PDF, comment elle est structurée dans les litiges juridiques et comment paginer des fichiers avec des préfixes alphanumériques de manière 100 % privée.",
    keywords: [
      "Qu'est-ce que la numérotation Bates ?",
      'numérotation bates pdf',
      "Le marquage Bates, qu'est-ce que c'est ?",
      'feuilleter les documents judiciaires bat',
      'Comment ajouter des chauves-souris à un PDF',
      'numéracie bates légal',
    ],
    blufDefinition:
      "La numérotation Bates est un système d'indexation et de pagination alphanumérique séquentiel utilisé dans les procédures judiciaires, les audits et les règlements d'entreprises pour identifier, suivre et citer de manière unique chaque page d'un dossier de preuves.",
    standardReference: 'Federal Rules of Civil Procedure (FRCP Rule 34) & ISO 32000-1',
    fullExplanation:
      "Inventé à la fin du XIXe siècle par Edwin G. Bates comme dispositif de scellage mécanique, le marquage Bates est devenu la norme internationale en matière de recherche de preuves numériques (e-Discovery). Dans les documents PDF, le marquage Bates insère un identifiant permanent (généralement composé d'un préfixe alphanumérique, suivi de zéros et d'un numéro séquentiel, par exemple « EXP-2026-000042 ») dans des marges prédéfinies, sans altérer la mise en page ni les liens hypertextes du document original.",
    specifications: [
      {
        label: 'Structure habituelle',
        value: '[Préfixe de casse]-[Nombre complété par des zéros]',
      },
      {
        label: 'Position standard',
        value: 'coin inférieur droit ou marge supérieure droite',
      },
      {
        label: 'Typographie recommandée',
        value: 'Polices à chasse fixe ou sans empattement (Helvetica, Arial, Courier)',
      },
      {
        label: "Impact sur l'objet PDF",
        value: 'Insertion directe de vecteurs dans le flux de contenu de la page',
      },
    ],
    practicalApplication: {
      title: 'Applications pratiques de la numérotation Bates',
      description:
        "La foliation Bates est une exigence obligatoire dans la plupart des tribunaux internationaux, des tribunaux d'arbitrage et des cabinets d'audit.",
      useCases: [
        'Présentation des dossiers de preuve dans les procès civils, pénaux et contentieux.',
        "Exigences en matière de vérification et d'inspection fiscales.",
        'Processus de diligence raisonnable dans les fusions et acquisitions (F&A).',
        "Organisation des dossiers médicaux hospitaliers en vue d'examens médico-légaux.",
      ],
    },
    commonPitfalls: [
      "Utilisez une numérotation de page de base (1, 2, 3) au lieu d'un format continu pour éviter l'interpolation du texte.",
      'Superposition du sceau Bates sur des signatures, des sceaux notariés ou des textes juridiques existants sans définir de marges de sécurité.',
    ],
    faqs: [
      {
        q: 'En quoi la numérotation Bates diffère-t-elle de la numérotation de page normale ?',
        a: "La numérotation standard indique uniquement l'ordre de lecture au sein d'un document (Page 1 sur 10). La numérotation Bates fournit une empreinte juridique unique et continue pour plusieurs documents indépendants (par exemple, si vous combinez cinq fichiers PDF de 20 pages, Bates attribue les numéros de page de 0001 à 0100 sans recommencer le comptage).",
      },
      {
        q: 'La numérotation Bates peut-elle être appliquée à un PDF numérisé ?',
        a: 'Oui. Avec PDFBlack, vous pouvez importer des documents numérisés ou vectoriels ; le sceau Bates est intégré sous forme de calque vectoriel net superposé aux coordonnées exactes choisies.',
      },
    ],
    relatedTool: {
      name: 'Foliar PDF (Numeración Bates)',
      slug: 'foliar',
      path: '/fr',
      desc: 'Outil 100% prive et securise sans televersement.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'censura-binaria-pdf'],
  },
  'pdf-a-vs-pdf-estandar': {
    slug: 'pdf-a-vs-pdf-estandar',
    slugEn: 'pdf-a-vs-standard-pdf',
    term: 'PDF/A vs PDF standard (Conservation numérique à long terme)',
    termEn: 'PDF/A vs Standard PDF',
    category: 'estandares',
    categoryLabel: 'Normes internationales ISO',
    badge: 'NORME ISO 19005',
    metaTitle: 'PDF/A vs PDF Standard : Différences, niveaux et exigences ISO | PDFBlack',
    metaDescription:
      "Différences techniques entre les formats PDF/A et PDF standard. Découvrez les profils PDF/A-1b et PDF/A-2b, les éléments interdits et comment se conformer aux exigences légales en matière d'archivage permanent.",
    keywords: [
      'pdf a vs pdf',
      'différences entre PDF et PDF',
      "Qu'est-ce qu'un PDF ?",
      'format PDF à long terme',
      'ISO 19005',
      'pdf a 1b pdf a 2b',
    ],
    blufDefinition:
      "Le format PDF/A est un sous-ensemble strictement normalisé du format PDF (ISO 19005), conçu spécifiquement pour l'archivage numérique à long terme. Il interdit les éléments qui dépendent de logiciels externes, tels que les polices non intégrées, le chiffrement et JavaScript, garantissant ainsi que le fichier s'affichera exactement de la même manière dans plusieurs décennies.",
    standardReference:
      'ISO 19005-1:2005 (PDF/A-1), ISO 19005-2:2011 (PDF/A-2), ISO 19005-3:2012 (PDF/A-3)',
    fullExplanation:
      "Un PDF classique privilégie l'interactivité : il peut contenir du code JavaScript dynamique, des liens vers des polices installées sur le système de l'utilisateur, de l'audio, de la vidéo et des algorithmes de compression propriétaires. Avec le temps, si ces polices disparaissent ou si le lecteur ne prend plus en charge un module d'extension, le document devient corrompu. PDF/A résout ce problème en imposant l'intégration de 100 % des polices, des métadonnées structurées dans XMP et des profils de couleur ICC calibrés, garantissant ainsi une reproductibilité visuelle infinie.",
    specifications: [
      {
        label: 'Incorporation de polices',
        value:
          '100% Obligatoire (toutes les polices et tous les glyphes doivent être inclus dans le fichier)',
      },
      {
        label: 'JavaScript et code exécutable',
        value: 'Strictement interdit',
      },
      {
        label: 'Chiffrement et mots de passe',
        value: 'Non autorisé (empêche la sauvegarde automatique des fichiers)',
      },
      {
        label: 'Espaces colorés',
        value: "Définis obligatoirement à l'aide de profils ICC indépendants du dispositif",
      },
    ],
    practicalApplication: {
      title: "Quand l'utilisation du format PDF/A est-elle obligatoire ?",
      description:
        'Les gouvernements et les institutions publiques exigent le format PDF/A comme seul format valable pour la conservation des documents.',
      useCases: [
        "Inscription aux services électroniques de l'administration publique et aux bulletins officiels de l'État.",
        'Dépôt des thèses de doctorat et des publications académiques dans les archives universitaires.',
        'Conservation des actes notariés et des inscriptions au registre foncier.',
        "Archives historiques de plans d'architecture et de génie civil.",
      ],
    },
    commonPitfalls: [
      "Enregistrez un document protégé par mot de passe et attendez-vous à ce qu'il soit conforme à la norme PDF/A (le chiffrement invalide la norme).",
      'Utiliser des polices de caractères avec des licences propriétaires qui interdisent leur intégration dans le fichier.',
    ],
    faqs: [
      {
        q: 'Que signifie la lettre dans PDF/A (par exemple, PDF/A-1b vs PDF/A-1a) ?',
        a: 'Le « b » signifie « Basique » (il garantit uniquement une fidélité visuelle identique). Le « a » signifie « Accessible » (en plus de la fidélité visuelle, il exige un étiquetage sémantique de l’ordre de lecture pour les lecteurs d’écran destinés aux personnes malvoyantes).',
      },
      {
        q: 'Puis-je convertir un fichier Word ou PDF numérisé en un format exploitable ?',
        a: "Oui. Lors de la conversion d'un document Word en PDF ou de l'application d'une reconnaissance optique de caractères (OCR) à une numérisation dans PDFBlack, les polices et les calques de texte sont intégrés sous forme de vecteurs nets dans le corps du document.",
      },
    ],
    relatedTool: {
      name: 'Convertir Word a PDF',
      slug: 'word-pdf',
      path: '/fr',
      desc: 'Outil 100% prive et securise sans televersement.',
    },
    relatedTerms: ['numeracion-bates', 'cifrado-aes-256-pdf'],
  },
  'cifrado-aes-256-pdf': {
    slug: 'cifrado-aes-256-pdf',
    slugEn: 'aes-256-pdf-encryption',
    term: 'PDF chiffré AES-256 (Sécurité cryptographique)',
    termEn: 'AES-256 PDF Encryption',
    category: 'seguridad',
    categoryLabel: 'Cryptographie et cybersécurité',
    badge: 'NORME MILITAIRE ET ISO 32000-2',
    metaTitle:
      'Chiffrement AES-256 dans les PDF : définition et protection de vos documents | PDFBlack',
    metaDescription:
      'Découvrez le fonctionnement du chiffrement symétrique AES 256 bits appliqué aux fichiers PDF. Comparez-le aux algorithmes obsolètes (RC4 40 bits et 128 bits) et abordez leur compatibilité technique.',
    keywords: [
      'PDF chiffré AES 256',
      "chiffrer un PDF avec l'AES-256",
      'PDF chiffré et sécurisé',
      'différence entre les fichiers PDF AES et RC4',
      'scène militaire pdf',
      'ISO 32000 2 chiffré',
    ],
    blufDefinition:
      'Le chiffrement AES-256 des fichiers PDF est la norme cryptographique la plus avancée pour la protection des documents (spécifiée dans la norme ISO 32000-2). Il utilise une clé symétrique de 256 bits et 14 étapes de transformation mathématique, ce qui rend le déchiffrement par force brute pratiquement impossible.',
    standardReference: 'FIPS PUB 197 & ISO 32000-2:2020 (PDF 2.0 Encryption Handler Extension)',
    fullExplanation:
      "Dans les premières versions de la spécification PDF, dans les années 1990, la sécurité reposait sur l'algorithme RC4 avec des clés faibles de 40 ou 128 bits. Aujourd'hui, un ordinateur classique peut casser une clé RC4 en quelques minutes. L'introduction de l'algorithme AES (Advanced Encryption Standard) en mode CBC avec des clés de 256 bits a révolutionné la sécurité des documents : le nombre de combinaisons possibles est de 2^256 (environ 1,15 × 10^77), un chiffre supérieur au nombre d'atomes dans l'univers observable.",
    specifications: [
      {
        label: 'Longueur de la clé',
        value: '256 bits (32 octets)',
      },
      {
        label: 'Tours de chiffrement',
        value: '14 tours de substitution et de permutation',
      },
      {
        label: 'Fonction de dérivation clé',
        value: 'SASLprep + SHA-256 avec un sel de 32 octets',
      },
      {
        label: 'Compatibilité du visualiseur',
        value: 'Adobe Acrobat 9+, navigateurs modernes et lecteurs ISO',
      },
    ],
    practicalApplication: {
      title: 'Où le chiffrement AES-256 est-il utilisé ?',
      description:
        'Tout document contenant des droits de propriété intellectuelle ou des secrets commerciaux doit être protégé par la norme AES-256.',
      useCases: [
        "Protection des états financiers et des fiches de paie de l'entreprise avant envoi.",
        'Cryptage des accords de confidentialité (NDA) et des formules de brevets industriels.',
        "Prévention de la copie, de la modification ou de l'impression non autorisées des manuels et des contrats.",
        'Transmission de dossiers médicaux confidentiels dans le strict respect de la loi HIPAA.',
      ],
    },
    commonPitfalls: [
      "L'utilisation de mots de passe courts ou prévisibles comme « 123456 » permet des attaques par dictionnaire malgré la robustesse de l'algorithme.",
      "S'appuyant sur un logiciel obsolète utilisant la version RC4, faussement qualifiée de « haute sécurité ».",
    ],
    faqs: [
      {
        q: "Existe-t-il une différence entre le mot de passe de connexion et le mot de passe d'autorisation ?",
        a: "Oui. Le mot de passe utilisateur chiffre l'intégralité de la structure binaire et est requis pour ouvrir et consulter le fichier. Le mot de passe propriétaire n'empêche pas la lecture, mais bloque certaines actions comme la copie de texte dans le presse-papiers, l'impression en haute résolution ou l'extraction de pages.",
      },
      {
        q: 'Est-ce que PDFBlack télécharge mon mot de passe ou mon document sur un serveur pour le chiffrer ?',
        a: 'Jamais. Chez PDFBlack, le chiffrement AES-256 est compilé et exécuté localement dans la mémoire vive de votre navigateur grâce à des modules WebAssembly. Vos mots de passe et vos fichiers ne transitent jamais par un serveur externe.',
      },
    ],
    relatedTool: {
      name: 'Proteger PDF con Contraseña',
      slug: 'proteger',
      path: '/fr',
      desc: 'Outil 100% prive et securise sans televersement.',
    },
    relatedTerms: ['censura-binaria-pdf', 'procesamiento-zero-knowledge-pdf'],
  },
  'censura-binaria-pdf': {
    slug: 'censura-binaria-pdf',
    slugEn: 'binary-pdf-redaction',
    term: 'Censure binaire dans les PDF (Nettoyage réel vs Masquage visuel)',
    termEn: 'Binary PDF Redaction',
    category: 'seguridad',
    categoryLabel: 'Confidentialité et assainissement médico-légal',
    badge: 'SÉCURITÉ MÉDICO-LÉGALE',
    metaTitle:
      'Censure binaire dans les PDF : pourquoi dessiner des rectangles noirs est dangereux | PDFBlack',
    metaDescription:
      "Découvrez ce qu'est la véritable censure binaire dans les fichiers PDF. Comprenez le danger des masques noirs visuels qui laissent le texte sous-jacent copiable et apprenez �� assainir les documents.",
    keywords: [
      'censure binaire pdf',
      'écrire un pdf qui est',
      'supprimer les données confidentielles (pdf)',
      'danger rectangle noir pdf',
      'nettoyer un document PDF',
    ],
    blufDefinition:
      "La censure binaire est le processus d'analyse forensique consistant à supprimer physiquement les flux de texte confidentiels, les vecteurs et les images du code source PDF, en reconstruisant l'arbre d'objets de manière à ce que les données censurées soient irrécupérables par toute technique d'extraction.",
    standardReference: 'NSA Document Redaction Best Practices & ISO 32000-1 (Section 14.8.4)',
    fullExplanation:
      "L'une des erreurs les plus fréquentes et les plus coûteuses dans les cabinets d'avocats et les administrations consiste à « masquer » des textes confidentiels en traçant un rectangle noir à l'aide d'un logiciel de traitement d'images. Visuellement, le texte apparaît invisible, mais les données sous-jacentes restent intactes dans le flux PDF : n'importe qui peut les sélectionner, les copier dans le presse-papiers ou les extraire à l'aide de scripts automatisés. La véritable censure binaire intercepte les coordonnées de la zone masquée, supprime les caractères typographiques et génère une nouvelle page vierge.",
    specifications: [
      {
        label: "Mécanisme d'action",
        value: 'Destruction physique des octets dans le flux de contenu de la page',
      },
      {
        label: 'Métadonnées associées',
        value: 'Nettoyage automatique des propriétés XML/XMP, auteur et date',
      },
      {
        label: 'Réversibilité',
        value: "Absolument irréversible (les données n'existent pas dans le fichier téléchargé)",
      },
      {
        label: "résistance à l'OCR",
        value: "Impossible à récupérer par analyse d'image ou de texte",
      },
    ],
    practicalApplication: {
      title: 'Cas critiques de censure binaire',
      description:
        "Évitez les amendes de plusieurs millions de dollars pour violation de la protection des données personnelles et des secrets d'État.",
      useCases: [
        "Dissimulation des numéros de sécurité sociale, des cartes d'identité et des cartes bancaires dans les registres publics.",
        "Protection de l'identité des témoins protégés et des mineurs dans les décisions de justice.",
        'Assainir les contrats commerciaux en éliminant les marges bénéficiaires et les prix unitaires confidentiels.',
        'Anonymisation des dossiers médicaux pour les études épidémiologiques et la recherche médicale.',
      ],
    },
    commonPitfalls: [
      "Dessinez des formes noires à l'aide des outils de dessin de base d'un lecteur PDF.",
      'Changez la couleur de la police en blanc (le texte reste indexable et sélectionnable).',
      "Oublier de supprimer les métadonnées du document lorsque le nom de l'auteur ou un titre sensible est parfois dupliqué.",
    ],
    faqs: [
      {
        q: 'Comment puis-je vérifier si la censure est effectuée correctement ?',
        a: 'Ouvrez le PDF dans un visualiseur web, appuyez sur Ctrl+A (tout sélectionner), puis essayez de copier-coller le texte par-dessus la zone censur��e dans le Bloc-notes. Si le texte censuré apparaît dans le presse-papiers, cela signifie que le document a été masqué visuellement et non censuré au niveau binaire.',
      },
      {
        q: 'PDFBlack supprime-t-il également les métadonnées cachées lors de la censure ?',
        a: "Oui. Lors de l'application de la censure dans PDFBlack, le moteur assainit la structure de l'objet en supprimant l'historique des révisions, les métadonnées XMP héritées et les annotations cachées.",
      },
    ],
    relatedTool: {
      name: 'Censurar PDF',
      slug: 'censurar',
      path: '/fr',
      desc: 'Outil 100% prive et securise sans televersement.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'procesamiento-zero-knowledge-pdf'],
  },
  'ocr-reconocimiento-optico-pdf': {
    slug: 'ocr-reconocimiento-optico-pdf',
    slugEn: 'ocr-optical-character-recognition-pdf',
    term: 'OCR dans PDF (Reconnaissance optique de caractères)',
    termEn: 'OCR (Optical Character Recognition) in PDF',
    category: 'tecnologia',
    categoryLabel: "Intelligence artificielle et traitement d'images",
    badge: 'IA ET VISION PAR ORDINATEUR',
    metaTitle:
      'Qu’est-ce que la reconnaissance optique de caractères (OCR) dans les PDF ? Comment fonctionne la reconnaissance optique de caractères ? | PDFBlack',
    metaDescription:
      "Découvrez ce qu'est la reconnaissance optique de caractères (OCR) dans les documents PDF. Apprenez comment elle transforme les images et les numérisations en texte sélectionnable et consultable.",
    keywords: [
      "Qu'est-ce que la reconnaissance optique de caractères (OCR) dans un PDF ?",
      'reconnaissance optique de caractères',
      'Créer des PDF OCR consultables',
      'Comment fonctionne la reconnaissance optique de caractères (OCR) ?',
      'tesseract wasm ocr',
      'Convertir une image PDF en texte',
    ],
    blufDefinition:
      'La ROC (reconnaissance optique de caractères) est une technologie qui analyse les images numériques de texte contenues dans un fichier PDF numérisé et les traduit en caractères typographiques réels, en insérant une couche de texte invisible qui permet de rechercher des mots, de sélectionner et de copier du contenu.',
    standardReference: 'ISO 32000-1 (Hidden Text Layer Specification)',
    fullExplanation:
      "Lorsque vous numérisez un document imprimé ou photographiez une feuille de papier, le PDF obtenu est simplement un ensemble d'images bitmap (pixels). Pour l'ordinateur, il ne contient ni mots ni lettres, mais uniquement une image. Le moteur de reconnaissance optique de caractères (OCR) traite cette image à l'aide d'algorithmes de vision par ordinateur et de réseaux neuronaux : il détecte les lignes de texte, segmente les mots et reconnaît la géométrie de chaque lettre. Il génère ensuite un PDF consultable, en conservant l'image numérisée originale au premier plan et en positionnant le texte reconnu précisément derrière chaque mot.",
    specifications: [
      {
        label: 'structure technique',
        value:
          'Image originale en plan frontal + Calque de texte invisible avec mode de rendu 3 (Mode de rendu du texte 3)',
      },
      {
        label: 'Résolution recommandée',
        value: '300 DPI en niveaux de gris ou en couleur pour une précision maximale',
      },
      {
        label: 'Moteur utilisé',
        value: 'Tesseract v5 compilé en WebAssembly (WASM) pour une exécution locale',
      },
      {
        label: 'Compatibilité de recherche',
        value:
          'Entièrement indexable par Google, Spotlight, la recherche Windows et les visionneuses PDF',
      },
    ],
    practicalApplication: {
      title: "Avantages et cas d'utilisation de la reconnaissance optique de caractères (OCR)",
      description:
        'Transformez des montagnes de papier en ressources numériques interactives et consultables en quelques millisecondes.',
      useCases: [
        'Numérisation des factures et reçus papier pour le traitement comptable automatisé.',
        'Recherche de mots-clés spécifiques (Ctrl + F) dans des livres et des fichiers de centaines de pages.',
        'Extraction de citations et de fragments de texte à partir de documents numérisés sans avoir à les transcrire manuellement.',
        'Respect des exigences judiciaires relatives à la remise de documents électroniques indexables.',
      ],
    },
    commonPitfalls: [
      'La numérisation à une résolution inférieure à 150 DPI dégrade considérablement le taux de réussite du moteur OCR.',
      'Documents présentant une asymétrie excessive (biais) sans application préalable de normalisation de rotation.',
    ],
    faqs: [
      {
        q: 'Pourquoi mon PDF scanné ne me permet-il pas de rechercher des mots avec Ctrl+F ?',
        a: "Votre PDF ne contient qu'une photo des pages et ne possède pas de couche de texte numérique intégrée. Pour résoudre ce problème, vous devez utiliser un logiciel de reconnaissance optique de caractères (OCR) afin qu'il puisse identifier les caractères et créer la couche de texte consultable.",
      },
      {
        q: "Le système OCR de PDFBlack envoie-t-il mes documents numérisés à des serveurs d'IA dans le cloud ?",
        a: 'Non. Le modèle de reconnaissance de PDFBlack fonctionne entièrement dans votre navigateur via WebAssembly. Les images de vos documents ne transitent jamais par Internet.',
      },
    ],
    relatedTool: {
      name: 'OCR PDF en Línea',
      slug: 'ocr',
      path: '/fr',
      desc: 'Outil 100% prive et securise sans televersement.',
    },
    relatedTerms: ['numeracion-bates', 'pdf-a-vs-pdf-estandar'],
  },
  'procesamiento-zero-knowledge-pdf': {
    slug: 'procesamiento-zero-knowledge-pdf',
    slugEn: 'zero-knowledge-pdf-processing',
    term: 'Traitement PDF à connaissance nulle (architecture sans serveur)',
    termEn: 'Zero-Knowledge PDF Processing',
    category: 'tecnologia',
    categoryLabel: 'Architecture logicielle et confidentialité',
    badge: 'ARCHITECTURE DE LA PURE INTIMITÉ',
    metaTitle: 'Qu’est-ce que le traitement à connaissance nulle dans les PDF ? | PDFBlack',
    metaDescription:
      "Découvrez l'architecture à divulgation nulle de connaissance appliquée à la manipulation de documents PDF. Apprenez comment le calcul côté client en WebAssembly garantit une confidentialité mathématique totale.",
    keywords: [
      'traitement à connaissance nulle (pdf)',
      'architecture à connaissance nulle',
      'traitement sur le client wasm',
      'éditeur pdf sans serveurs',
      'confidentialité mathématique (pdf)',
      'WebAssembly PDF local',
    ],
    blufDefinition:
      "Le traitement à connaissance nulle dans les logiciels de traitement de texte est un paradigme de conception architecturale où toutes les opérations sur le fichier sont effectuées exclusivement sur le matériel local de l'utilisateur (navigateur WebAssembly), de sorte que les serveurs du fournisseur ne connaissent, ne reçoivent ni ne traitent jamais le contenu des documents.",
    standardReference: 'Privacy by Design (GDPR Article 25) & W3C WebAssembly Standard',
    fullExplanation:
      "Dans une architecture web traditionnelle basée sur le cloud, lorsqu'un utilisateur clique sur « Compresser » ou « Fusionner », le fichier transite par Internet vers un serveur distant, est traité dans le centre de données du fournisseur, puis renvoyé. Durant ce processus, le fournisseur a un accès technique au document. À l'inverse, l'architecture Zero-Knowledge de PDFBlack télécharge les binaires de calcul WebAssembly compilés sur le navigateur de l'utilisateur une seule fois. Dès lors, la mémoire vive et le processeur de votre appareil effectuent tous les calculs. Sans aucun paquet réseau contenant le contenu de votre fichier, le fournisseur n'a littéralement « aucune connaissance » de vos documents.",
    specifications: [
      {
        label: 'Requêtes réseau avec des données provenant du PDF',
        value: '0 requêtes HTTP (vérifiable sur le réseau F12)',
      },
      {
        label: "Environnement d'exécution",
        value: 'RAM volatile et Web Workers isolés du navigateur',
      },
      {
        label: 'persistance du disque du serveur',
        value: "0 octet (rien n'est stocké)",
      },
      {
        label: 'Conformité réglementaire',
        value: "Conformité automatique au RGPD, au CCPA, à l'HIPAA et au secret professionnel",
      },
    ],
    practicalApplication: {
      title: "Importance dans l'écosystème des entreprises modernes",
      description:
        'La seule véritable garantie de sécurité est de ne pas communiquer ces informations à des tiers.',
      useCases: [
        'Je travaille avec des secrets commerciaux et de la propriété intellectuelle protégés par des accords de confidentialité stricts.',
        "Gestion de la paie et des dossiers comptables des employés sans nécessiter d'accords de traitement des données (DPA).",
        "Opérations documentaires au sein d'organisations militaires, de défense ou gouvernementales appliquant une politique de cloud zéro.",
      ],
    },
    commonPitfalls: [
      'Confusion entre « connexion HTTPS » et « confidentialité à connaissance nulle » : HTTPS protège la transmission des informations, mais le serveur distant peut toujours recevoir et lire le fichier. La confidentialité à connaissance nulle, quant à elle, n’envoie pas le fichier.',
    ],
    faqs: [
      {
        q: 'Comment puis-je prouver à mon service de sécurité que PDFBlack est une technologie à connaissance nulle ?',
        a: "Ouvrez les outils de développement de votre navigateur (appuyez sur F12), accédez à l'onglet « Réseau » et traitez un document quelconque. Vous constaterez qu'aucune requête HTTP n'est envoyée aux serveurs hébergeant le contenu de votre PDF. Toute l'activité se déroule dans la mémoire de votre ordinateur.",
      },
      {
        q: "Est-ce que ça fonctionne si je n'ai pas de connexion internet ?",
        a: 'Oui. Une fois la page chargée dans le navigateur, le code WebAssembly est mis en cache localement et vous pouvez continuer à travailler avec les PDF même sans accès à Internet ou en mode avion.',
      },
    ],
    relatedTool: {
      name: 'Política de Privacidad y Arquitectura',
      slug: 'privacidad',
      path: '/fr',
      desc: 'Outil 100% prive et securise sans televersement.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'censura-binaria-pdf'],
  },
};
