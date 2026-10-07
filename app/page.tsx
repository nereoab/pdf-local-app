'use client';

import { useFileStore } from '../store/useFileStore';
import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage, type Language } from '../context/LanguageContext';
import {
  ShieldCheck,
  Edit3,
  RefreshCw,
  Zap,
  FolderOpen,
  FileText,
  Clock,
  HardDrive,
  Sparkles,
  X,
  ArrowRight,
  UploadCloud,
  FilePlus,
  Search,
  FileArchive,
  CheckCircle2,
  Star,
  Eye,
  Download,
  Trash2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActivityStore } from '../store/useActivityStore';
import { SkeletonTableRow } from '../components/Skeleton';
import PdfPreviewThumbnail from '@/components/PdfPreviewThumbnail';
import SpotlightCard from '@/components/SpotlightCard';
import DocumentUploadProgress from '@/components/DocumentUploadProgress';
import CategoryQuickTools from '@/components/CategoryQuickTools';
import { getEnglishUrlForSpanish, getUrlForLanguage } from '@/lib/routes-config';

// ─── JSON-LD Structured Data (Rich Snippets) ───
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

function getFileIcon(toolId: string): React.ElementType {
  if (toolId.includes('compress') || toolId.includes('comprimir')) return FileArchive;
  if (toolId.includes('protect') || toolId.includes('proteger')) return ShieldCheck;
  if (toolId.includes('sign') || toolId.includes('firma')) return ShieldCheck;
  if (toolId.includes('convert') || toolId.includes('convertir')) return RefreshCw;
  if (toolId.includes('edit') || toolId.includes('texto')) return Edit3;
  if (toolId.includes('merge') || toolId.includes('unir')) return FolderOpen;
  return FileText;
}

function AnimatedCounter({
  from = 0,
  to,
  decimals = 0,
  suffix = '',
}: {
  from?: number;
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(from, to, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(value) {
          node.textContent = value.toFixed(decimals) + suffix;
        },
      });
      return () => controls.stop();
    }
  }, [from, to, decimals, suffix]);
  return (
    <span ref={nodeRef} aria-live="polite">
      {from.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const categories = [
  {
    id: 'editar',
    indexEs: '001 / Edición visual directa',
    indexEn: '001 / Direct visual editing',
    indexPt: '001 / Edição visual direta',
    indexFr: '001 / Édition visuelle directe',
    titleEs: 'Editar PDF',
    titleEn: 'Edit PDF',
    titlePt: 'Editar PDF',
    titleFr: 'Éditer PDF',
    descEs:
      'Edición directa de texto, firmas digitales, folios correlativos y marcas de agua sobre el documento.',
    descEn: 'Direct text editing, digital signatures, page numbering, and watermarks.',
    descPt: 'Edição direta de texto, assinaturas digitais, numeração de páginas e marcas d’água.',
    descFr:
      'Édition directe de texte, signatures numériques, numérotation de pages et filigranes sur le document.',
    tools: [
      {
        nameEs: '1. Editar Texto',
        nameEn: '1. Edit Text',
        namePt: '1. Editar Texto',
        nameFr: '1. Modifier Texte',
        path: '/editar/texto',
      },
      {
        nameEs: '2. Foliar Páginas',
        nameEn: '2. Page Numbers',
        namePt: '2. Numerar Páginas',
        nameFr: '2. Numéroter Pages',
        path: '/editar/foliar',
      },
      {
        nameEs: '3. Poner Marca Agua',
        nameEn: '3. Add Watermark',
        namePt: "3. Marca d'Água",
        nameFr: '3. Ajouter Filigrane',
        path: '/editar/marca-agua',
      },
      {
        nameEs: '4. Quitar Marca Agua',
        nameEn: '4. Remove Watermark',
        namePt: "4. Remover Marca d'Água",
        nameFr: '4. Supprimer Filigrane',
        path: '/editar/quitar-marca-agua',
      },
      {
        nameEs: '5. Firmar PDF',
        nameEn: '5. Sign PDF',
        namePt: '5. Assinar PDF',
        nameFr: '5. Signer PDF',
        path: '/editar/firmar',
      },
      {
        nameEs: '6. OCR PDF',
        nameEn: '6. OCR PDF',
        namePt: '6. OCR em PDF',
        nameFr: '6. OCR PDF',
        path: '/editar/ocr',
      },
    ],
    badgeEs: 'MÁS USADO',
    badgeEn: 'MOST USED',
    badgePt: 'MAIS USADO',
    badgeFr: 'LE PLUS UTILISÉ',
    icon: Edit3,
    path: '/editar',
  },
  {
    id: 'organizar',
    indexEs: '002 / Estructura y organizador',
    indexEn: '002 / Structure & page builder',
    indexPt: '002 / Estrutura e organizador',
    indexFr: '002 / Structure & gestion de pages',
    titleEs: 'Organizar PDF',
    titleEn: 'Organize PDF',
    titlePt: 'Organizar PDF',
    titleFr: 'Organiser PDF',
    descEs:
      'Gestión completa de estructura: unir múltiples archivos, dividir por rangos, rotar y recortar.',
    descEn: 'Full structure management: merge multiple files, split by range, rotate and crop.',
    descPt: 'Gestão completa: juntar vários arquivos, dividir por intervalos, girar e recortar.',
    descFr:
      'Gestion complète de structure : fusionner plusieurs fichiers, diviser par plages, pivoter et rogner.',
    tools: [
      {
        nameEs: '1. Unir PDF',
        nameEn: '1. Merge PDF',
        namePt: '1. Juntar PDF',
        nameFr: '1. Fusionner PDF',
        path: '/organizar/unir',
      },
      {
        nameEs: '2. Dividir PDF',
        nameEn: '2. Split PDF',
        namePt: '2. Dividir PDF',
        nameFr: '2. Diviser PDF',
        path: '/organizar/dividir',
      },
      {
        nameEs: '3. Eliminar Páginas',
        nameEn: '3. Delete Pages',
        namePt: '3. Excluir Páginas',
        nameFr: '3. Supprimer Pages',
        path: '/organizar/eliminar',
      },
      {
        nameEs: '4. Reordenar PDF',
        nameEn: '4. Reorder PDF',
        namePt: '4. Organizar PDF',
        nameFr: '4. Réorganiser PDF',
        path: '/organizar/reordenar',
      },
      {
        nameEs: '5. Rotar PDF',
        nameEn: '5. Rotate PDF',
        namePt: '5. Girar PDF',
        nameFr: '5. Pivoter PDF',
        path: '/organizar/rotar',
      },
      {
        nameEs: '6. Recortar PDF',
        nameEn: '6. Crop PDF',
        namePt: '6. Recortar PDF',
        nameFr: '6. Rogner PDF',
        path: '/organizar/recortar',
      },
    ],
    badgeEs: 'INDISPENSABLE',
    badgeEn: 'ESSENTIAL',
    badgePt: 'INDISPENSÁVEL',
    badgeFr: 'INDISPENSABLE',
    icon: FolderOpen,
    path: '/organizar',
  },
  {
    id: 'convertir',
    indexEs: '003 / Conversión de alta precisión',
    indexEn: '003 / High precision conversion',
    indexPt: '003 / Conversão de alta precisão',
    indexFr: '003 / Conversion haute précision',
    titleEs: 'Convertir PDF',
    titleEn: 'Convert PDF',
    titlePt: 'Converter PDF',
    titleFr: 'Convertir PDF',
    descEs:
      'Conversión bidireccional de alta precisión entre PDF y formatos Word, Excel, PowerPoint e imágenes.',
    descEn:
      'High-precision bidirectional conversion between PDF and Word, Excel, PowerPoint, and images.',
    descPt: 'Conversão de alta precisão entre PDF e formatos Word, Excel, PowerPoint e imagens.',
    descFr:
      'Conversion bidirectionnelle de haute précision entre PDF et formats Word, Excel, PowerPoint et images.',
    tools: [
      {
        nameEs: '1. PDF ↔ Word',
        nameEn: '1. PDF ↔ Word',
        namePt: '1. PDF ↔ Word',
        nameFr: '1. PDF ↔ Word',
        path: '/convertir/pdf-word',
      },
      {
        nameEs: '2. PDF ↔ Excel',
        nameEn: '2. PDF ↔ Excel',
        namePt: '2. PDF ↔ Excel',
        nameFr: '2. PDF ↔ Excel',
        path: '/convertir/pdf-excel',
      },
      {
        nameEs: '3. PDF ↔ PowerPoint',
        nameEn: '3. PDF ↔ PowerPoint',
        namePt: '3. PDF ↔ PowerPoint',
        nameFr: '3. PDF ↔ PowerPoint',
        path: '/convertir/pdf-powerpoint',
      },
      {
        nameEs: '4. PDF ↔ JPG',
        nameEn: '4. PDF ↔ JPG',
        namePt: '4. PDF ↔ JPG',
        nameFr: '4. PDF ↔ JPG',
        path: '/convertir/pdf-jpg',
      },
      {
        nameEs: '5. PDF ↔ Blanco y Negro',
        nameEn: '5. PDF ↔ Black & White',
        namePt: '5. PDF ↔ Preto e Branco',
        nameFr: '5. PDF ↔ Noir et Blanc',
        path: '/convertir/pdf-blanco-negro',
      },
      {
        nameEs: '6. PDF ↔ Texto',
        nameEn: '6. PDF ↔ Text',
        namePt: '6. PDF ↔ Texto',
        nameFr: '6. PDF ↔ Texte',
        path: '/convertir/pdf-texto',
      },
    ],
    badgeEs: 'ALTA PRECISIÓN',
    badgeEn: 'HIGH PRECISION',
    badgePt: 'ALTA PRECISÃO',
    badgeFr: 'HAUTE PRÉCISION',
    icon: RefreshCw,
    path: '/convertir',
  },
  {
    id: 'optimizar',
    indexEs: '004 / Seguridad local y compresión',
    indexEn: '004 / Local security & compression',
    indexPt: '004 / Segurança local e compressão',
    indexFr: '004 / Sécurité locale et compression',
    titleEs: 'Optimizar PDF',
    titleEn: 'Optimize PDF',
    titlePt: 'Otimizar PDF',
    titleFr: 'Optimiser PDF',
    descEs:
      'Algoritmos locales de compresión de tamaño, cifrado de seguridad, censura y reparación.',
    descEn: 'Local algorithms for size compression, security encryption, redaction, and repair.',
    descPt: 'Algoritmos locais de compressão de tamanho, segurança, criptografia, tarja e reparo.',
    descFr:
      'Algorithmes locaux de compression de taille, chiffrement de sécurité, biffure et réparation.',
    tools: [
      {
        nameEs: '1. Comprimir PDF',
        nameEn: '1. Compress PDF',
        namePt: '1. Comprimir PDF',
        nameFr: '1. Compresser PDF',
        path: '/optimizar/comprimir',
      },
      {
        nameEs: '2. Reparar PDF',
        nameEn: '2. Repair PDF',
        namePt: '2. Reparar PDF',
        nameFr: '2. Réparer PDF',
        path: '/optimizar/reparar',
      },
      {
        nameEs: '3. Desbloquear PDF',
        nameEn: '3. Unlock PDF',
        namePt: '3. Desbloquear PDF',
        nameFr: '3. Déverrouiller PDF',
        path: '/optimizar/desbloquear',
      },
      {
        nameEs: '4. Proteger PDF',
        nameEn: '4. Protect PDF',
        namePt: '4. Proteger PDF',
        nameFr: '4. Protéger PDF',
        path: '/optimizar/proteger',
      },
      {
        nameEs: '5. Censurar PDF',
        nameEn: '5. Redact PDF',
        namePt: '5. Tarjar PDF',
        nameFr: '5. Censurer PDF',
        path: '/optimizar/censurar',
      },
      {
        nameEs: '6. Comparar PDF',
        nameEn: '6. Compare PDF',
        namePt: '6. Comparar PDF',
        nameFr: '6. Comparer PDF',
        path: '/optimizar/comparar',
      },
    ],
    badgeEs: 'REDUCE HASTA 90%',
    badgeEn: 'SAVE UP TO 90%',
    badgePt: 'REDUZ ATÉ 90%',
    badgeFr: 'RÉDUIT JUSQU’À 90%',
    icon: Zap,
    path: '/optimizar',
  },
];

function CategoryCard({
  cat,
  file,
  lang = 'es',
}: {
  cat: (typeof categories)[0];
  file: File | null;
  lang?: Language;
}) {
  const isEs = lang === 'es';
  const isPt = lang === 'pt';
  const isFr = lang === 'fr';
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const IconComponent = cat.icon;

  const getLocalizedTitle = () =>
    isFr ? cat.titleFr : isPt ? cat.titlePt : isEs ? cat.titleEs : cat.titleEn;
  const getLocalizedBadge = () =>
    isFr ? cat.badgeFr : isPt ? cat.badgePt : isEs ? cat.badgeEs : cat.badgeEn;
  const getLocalizedDesc = () =>
    isFr ? cat.descFr : isPt ? cat.descPt : isEs ? cat.descEs : cat.descEn;
  const getLocalizedIndex = () =>
    isFr ? cat.indexFr : isPt ? cat.indexPt : isEs ? cat.indexEs : cat.indexEn;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-6 sm:p-7 transition-all duration-300 h-full min-h-[330px] flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:shadow-[0_0_45px_rgba(255,255,255,0.12)]"
    >
      {/* Línea de brillo superior para efecto 3D pulido */}
      <div
        className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Glow Spotlight Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.12), transparent 80%)`,
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-500 text-white shadow-md group-hover:border-zinc-300 transition-colors">
              <IconComponent className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-xs text-zinc-300 group-hover:text-white transition-colors font-bold tracking-wider">
              {getLocalizedIndex()}
            </span>
          </div>
          {getLocalizedBadge() && (
            <span
              className="px-3 py-1 text-[10px] font-bold border border-zinc-500 bg-zinc-800 text-white rounded-full shadow-sm"
              aria-label={getLocalizedBadge()}
            >
              {getLocalizedBadge()}
            </span>
          )}
        </div>

        <Link href={getUrlForLanguage(cat.path, lang)} className="group/title block">
          <h3 className="text-2xl font-black text-white tracking-tight mb-2 group-hover/title:text-zinc-200 transition-colors flex items-center gap-2">
            <span>{getLocalizedTitle()}</span>
          </h3>
        </Link>

        <p className="text-xs text-zinc-300 mb-5 font-normal leading-relaxed">
          {getLocalizedDesc()}
        </p>

        {/* LISTA DE FUNCIONES INTERACTIVAS (ENLACES DIRECTOS) */}
        <div
          className="grid grid-cols-2 gap-2.5 mb-2 font-mono relative z-20"
          role="list"
          aria-label={
            isFr
              ? 'Outils disponibles'
              : isPt
                ? 'Ferramentas disponíveis'
                : isEs
                  ? 'Herramientas disponibles'
                  : 'Available tools'
          }
        >
          {cat.tools.map((tool, tIdx) => {
            const toolName = isFr
              ? tool.nameFr
              : isPt
                ? tool.namePt
                : isEs
                  ? tool.nameEs
                  : tool.nameEn;
            return (
              <Link
                key={tIdx}
                href={getUrlForLanguage(tool.path, lang)}
                className="bg-[#181822] hover:bg-white hover:text-black border border-zinc-600 hover:border-white rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 hover:text-black font-semibold transition-all duration-200 truncate flex items-center justify-between group/tool shadow-md active:scale-[0.98]"
                role="listitem"
                title={
                  isEs
                    ? `Ir a ${tool.nameEs}`
                    : isPt
                      ? `Ir para ${tool.namePt}`
                      : isFr
                        ? `Aller à ${tool.nameFr}`
                        : `Go to ${tool.nameEn}`
                }
              >
                <span className="truncate font-semibold">{toolName}</span>
                <ArrowRight
                  className="w-3.5 h-3.5 opacity-0 group-hover/tool:opacity-100 -translate-x-1 group-hover/tool:translate-x-0 transition-all flex-shrink-0 ml-1 text-black"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-700 font-mono relative z-10">
        <Link
          href={getUrlForLanguage(cat.path, lang)}
          className="text-xs font-bold text-white hover:text-zinc-200 flex items-center justify-between transition-colors group/link py-1"
        >
          <span>
            {file
              ? isFr
                ? 'Démarrer le module complet →'
                : isPt
                  ? 'Iniciar módulo completo →'
                  : isEs
                    ? 'Iniciar módulo completo →'
                    : 'Start full module →'
              : isFr
                ? 'Explorer les outils →'
                : isPt
                  ? 'Explorar ferramentas →'
                  : isEs
                    ? 'Explorar herramientas →'
                    : 'Explore tools →'}
          </span>
          <ArrowRight
            className="w-4 h-4 group-hover/link:translate-x-1 transition-transform text-white"
            aria-hidden="true"
          />
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { lang } = useLanguage();
  const emptySubscribe = () => () => {};
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const isEs = lang === 'es';
  const isPt = lang === 'pt';
  const isFr = lang === 'fr';

  // ── Redirección inteligente de portada raíz (fallback cliente): respeta cookie o idioma del navegador ──
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      try {
        const stored = localStorage.getItem('pdfblack-lang');
        if (
          stored === 'es' ||
          stored === 'en' ||
          stored === 'zh' ||
          stored === 'pt' ||
          stored === 'fr'
        ) {
          window.location.replace(`/${stored}`);
          return;
        }
        const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
        if (browserLang === 'es') {
          window.location.replace('/es');
          return;
        }
        if (browserLang === 'pt') {
          window.location.replace('/pt');
          return;
        }
        if (browserLang === 'fr') {
          window.location.replace('/fr');
          return;
        }
        if (browserLang === 'zh') {
          window.location.replace('/zh');
          return;
        }
      } catch {
        // fallback
      }
      window.location.replace('/en');
    }
  }, []);

  const setGlobalFile = useFileStore((state) => state.setGlobalFile);
  const { filesProcessed, bytesSaved, timeSavedMinutes, recentFiles } = useActivityStore();
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => prev + 1);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => prev - 1);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(0);
    if (isUploading || file) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) procesarArchivo(e.target.files[0]);
  };

  const procesarArchivo = (archivoSeleccionado: File) => {
    if (archivoSeleccionado.type !== 'application/pdf') {
      toast.error(
        isFr
          ? 'Veuillez télécharger un fichier PDF valide.'
          : isPt
            ? 'Por favor, envie um arquivo PDF válido.'
            : isEs
              ? 'Por favor, sube un archivo PDF válido.'
              : 'Please upload a valid PDF file.',
      );
      return;
    }
    setUploadingFile(archivoSeleccionado);
    setIsUploading(true);
    setUploadProgress(12);

    const url = URL.createObjectURL(archivoSeleccionado);

    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);

    uploadTimerRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
          setTimeout(() => {
            setPdfUrl(url);
            setFile(archivoSeleccionado);
            setGlobalFile(archivoSeleccionado);
            setIsUploading(false);
            setUploadingFile(null);
            setUploadProgress(0);
            toast.success(
              isFr
                ? 'Fichier chargé. Que souhaitez-vous faire avec ?'
                : isPt
                  ? 'Arquivo carregado. O que você deseja fazer com ele?'
                  : isEs
                    ? 'Archivo cargado. ¿Qué deseas hacer con él?'
                    : 'File loaded. What do you want to do?',
            );
          }, 350);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 12;
      });
    }, 90);
  };

  const handleCancelUpload = () => {
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    setGlobalFile(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Simular carga del historial (en producción vendría de localStorage o API)
  useEffect(() => {
    const timer = setTimeout(() => setIsHistoryLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full px-4 sm:px-6 lg:px-8 pb-10 flex flex-col items-center justify-start relative min-h-[calc(100vh-64px)] bg-[var(--background)] transition-all duration-700 ${file ? 'pt-6' : 'pt-8 sm:pt-10'}`}
      aria-label={
        isFr
          ? 'Tableau de bord principal de PDFBlack'
          : isPt
            ? 'Painel principal do PDFBlack'
            : isEs
              ? 'Panel principal de PDFBlack'
              : 'PDFBlack main dashboard'
      }
    >
      {/* ── DATOS ESTRUCTURADOS SCHEMA.ORG (JSON-LD) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: 'PDFBlack',
                description: isFr
                  ? 'Outils PDF Gratuits, Privés et 100% Locaux dans votre navigateur'
                  : isPt
                    ? 'Ferramentas PDF Gratuitas, Privadas e 100% Locais no seu navegador'
                    : isEs
                      ? 'Herramientas PDF Gratuitas, Privadas y 100% Locales en tu navegador'
                      : 'Free, Private & 100% Local PDF Tools in your browser',
                inLanguage: isFr ? 'fr-FR' : isPt ? 'pt-BR' : isEs ? 'es-ES' : 'en-US',
              },
              {
                '@type': ['WebApplication', 'SoftwareApplication'],
                '@id': `${SITE_URL}/#webapp`,
                name: isFr
                  ? 'PDFBlack — Outils PDF Gratuits, Privés et Locaux'
                  : isPt
                    ? 'PDFBlack — Ferramentas PDF Gratuitas, Privadas e Locais'
                    : isEs
                      ? 'PDFBlack — Herramientas PDF Gratuitas, Privadas y Locales'
                      : 'PDFBlack — Free, Private & Local PDF Tools',
                url: isEs ? SITE_URL : `${SITE_URL}/${lang}`,
                description: isFr
                  ? 'Modifiez, organisez, convertissez et optimisez vos PDF 100% gratuit et sans inscription. Traitement local dans votre navigateur.'
                  : isPt
                    ? 'Edite, organize, converta e otimize arquivos PDF 100% grátis e sem cadastro. Processamento local no seu navegador.'
                    : isEs
                      ? 'Edita, organiza, convierte y optimiza archivos PDF 100% gratis y sin registro. Procesamiento local en tu navegador.'
                      : 'Edit, organize, convert and optimize PDF files 100% free and without registration. Local processing in your browser.',
                applicationCategory: 'UtilitiesApplication, BusinessApplication',
                operatingSystem: 'All',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                author: { '@type': 'Organization', name: 'PDFBlack', url: SITE_URL },
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.9',
                  ratingCount: '1540',
                  bestRating: '5',
                  worstRating: '1',
                },
                browserRequirements:
                  'Requires modern browser with WebAssembly and Web Workers support',
                featureList: isFr
                  ? [
                      'Modifier le PDF et le texte natif',
                      'Compresser le PDF en réduisant sa taille',
                      'Fusionner et Diviser des PDF sans limites',
                      'Signer des PDF avec certificats numériques',
                      'OCR PDF avec IA locale',
                      'Protéger et Déverrouiller le PDF (AES-256)',
                      'Convertir le PDF en Word, Excel et PowerPoint',
                    ]
                  : isPt
                    ? [
                        'Editar PDF e modificar texto nativo',
                        'Comprimir PDF reduzindo o tamanho',
                        'Juntar e Dividir PDF sem limites',
                        'Assinar PDF com certificados digitais',
                        'OCR PDF com IA Local',
                        'Proteger e Desbloquear PDF (AES-256)',
                        'Converter PDF para Word, Excel e PowerPoint',
                      ]
                    : isEs
                      ? [
                          'Editar PDF y modificar texto nativo',
                          'Comprimir PDF reduciendo tamaño',
                          'Unir y Dividir PDF sin límites',
                          'Firmar PDF con certificados PKCS#12',
                          'OCR PDF con IA Local',
                          'Proteger y Desbloquear PDF (AES-256)',
                          'Convertir PDF a Word, Excel y PowerPoint',
                        ]
                      : [
                          'Edit PDF and modify native text',
                          'Compress PDF reducing file size',
                          'Merge and Split PDF without limits',
                          'Sign PDF with PKCS#12 digital certificates',
                          'OCR PDF with Local AI',
                          'Protect and Unlock PDF (AES-256)',
                          'Convert PDF to Word, Excel and PowerPoint',
                        ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: isFr
                      ? 'PDFBlack est-il vraiment gratuit ?'
                      : isPt
                        ? 'O PDFBlack é realmente gratuito?'
                        : isEs
                          ? '¿PDFBlack es realmente gratis?'
                          : 'Is PDFBlack really free?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: isFr
                        ? 'Oui, PDFBlack est 100% gratuit. Aucune inscription, carte de crédit ni abonnement requis. Tous les outils PDF fonctionnent sans limites directement dans votre navigateur.'
                        : isPt
                          ? 'Sim, o PDFBlack é 100% gratuito. Não requer cadastro, cartão de crédito ou assinatura. Todas as ferramentas funcionam sem limites diretamente no navegador.'
                          : isEs
                            ? 'Sí, PDFBlack es 100% gratuito. No requiere registro, tarjeta de crédito ni suscripción. Todas las herramientas de PDF funcionan sin límites directamente en tu navegador.'
                            : 'Yes, PDFBlack is 100% free. No registration, credit card, or subscription required. All PDF tools work without limits directly in your browser.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: isFr
                      ? 'Mes fichiers PDF sont-ils téléversés sur un serveur ?'
                      : isPt
                        ? 'Meus arquivos PDF são enviados para algum servidor?'
                        : isEs
                          ? '¿Mis archivos PDF se suben a algún servidor?'
                          : 'Are my PDF files uploaded to any server?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: isFr
                        ? 'Non. PDFBlack traite vos fichiers PDF à 100% localement dans votre navigateur à l’aide de WebAssembly et Web Workers. Vos documents ne quittent jamais votre appareil.'
                        : isPt
                          ? 'Não. O PDFBlack processa seus arquivos PDF 100% localmente no navegador usando WebAssembly e Web Workers. Seus documentos nunca saem do seu dispositivo.'
                          : isEs
                            ? 'No. PDFBlack procesa tus archivos PDF 100% localmente en tu navegador usando WebAssembly y Web Workers. Tus documentos nunca abandonan tu dispositivo.'
                            : 'No. PDFBlack processes your PDF files 100% locally in your browser using WebAssembly and Web Workers. Your documents never leave your device.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: isFr
                      ? 'Quels outils PDF sont proposés par PDFBlack ?'
                      : isPt
                        ? 'Quais ferramentas PDF o PDFBlack oferece?'
                        : isEs
                          ? '¿Qué herramientas PDF ofrece PDFBlack?'
                          : 'What PDF tools does PDFBlack offer?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: isFr
                        ? 'PDFBlack propose 24 outils répartis en 4 catégories : Éditer (texte, filigranes, signatures, OCR), Organiser (fusionner, diviser, pivoter, recadrer), Convertir (Word, Excel, PowerPoint, JPG) et Optimiser (compresser, protéger, censurer, réparer).'
                        : isPt
                          ? 'O PDFBlack oferece 24 ferramentas em 4 categorias: Editar (texto, marcas d’água, assinaturas, OCR), Organizar (juntar, dividir, girar, cortar), Converter (Word, Excel, PowerPoint, JPG) e Otimizar (comprimir, proteger, tarjar, reparar).'
                          : isEs
                            ? 'PDFBlack ofrece 24 herramientas organizadas en 4 categorías: Editar (texto, marcas de agua, firmas, OCR), Organizar (unir, dividir, rotar, recortar), Convertir (Word, Excel, PowerPoint, JPG) y Optimizar (comprimir, proteger, censurar, reparar).'
                            : 'PDFBlack offers 24 tools across 4 categories: Edit (text, watermarks, signatures, OCR), Organize (merge, split, rotate, crop), Convert (Word, Excel, PowerPoint, JPG), and Optimize (compress, protect, redact, repair).',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
      {/* OVERLAY DE MODO ENFOQUE */}
      <AnimatePresence>
        {file && (
          <motion.div
            key="focus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[40] bg-black/70 backdrop-blur-sm pointer-events-none"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* OVERLAY OMNIPRESENTE (Drag & Drop) */}
      <AnimatePresence>
        {dragCounter > 0 && !file && !isUploading && (
          <motion.div
            key="drag-drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            role="alert"
            aria-live="assertive"
          >
            <div className="w-full h-full max-w-5xl max-h-[80vh] border-2 border-white/30 border-dashed rounded-3xl flex flex-col items-center justify-center bg-zinc-900/60 pointer-events-none shadow-2xl">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <UploadCloud
                  className="w-24 h-24 text-white mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  aria-hidden="true"
                />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center tracking-tight font-sans">
                {isFr
                  ? 'Déposez votre PDF n’importe où'
                  : isPt
                    ? 'Solte seu PDF em qualquer lugar'
                    : isEs
                      ? 'Suelta tu PDF en cualquier lugar'
                      : 'Drop your PDF anywhere'}
              </h2>
              <p className="text-zinc-400 text-sm font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300" aria-hidden="true" />
                {isFr
                  ? 'Pour charger et commencer à travailler instantanément'
                  : isPt
                    ? 'Para carregar e começar a trabalhar instantaneamente'
                    : isEs
                      ? 'Para cargar y empezar a trabajar al instante'
                      : 'To load and start working instantly'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMounted && (
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start"
          aria-hidden="true"
        >
          <motion.div
            animate={{ opacity: [0.02, 0.04, 0.02] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[5%] w-[80vw] h-[50vw] rounded-full bg-zinc-400 blur-[160px]"
          />
        </div>
      )}

      <div className="w-full max-w-7xl relative">
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInput}
          aria-label={
            isFr
              ? 'Sélectionner un fichier PDF'
              : isPt
                ? 'Selecionar arquivo PDF'
                : isEs
                  ? 'Seleccionar archivo PDF'
                  : 'Select PDF file'
          }
        />

        <div className={`relative ${file ? 'z-[50]' : 'z-10'}`}>
          {/* HERO CONTENT ARCHITECTURE STYLING */}
          <div className="mb-8 flex flex-col items-center md:items-start gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-zinc-900 dark:text-white tracking-tight leading-[1.05] antialiased">
                <span className="block">
                  {isFr
                    ? 'Moteur PDF local. '
                    : isPt
                      ? 'Processamento PDF local. '
                      : isEs
                        ? 'Procesamiento PDF local. '
                        : 'Local PDF engine. '}
                </span>
                <span className="text-zinc-400 dark:text-zinc-300 font-light block">
                  {isFr
                    ? 'Zéro serveur, confidentialité absolue.'
                    : isPt
                      ? 'Sem servidores, privacidade total.'
                      : isEs
                        ? 'Sin servidores, privacidad total.'
                        : 'Zero servers, absolute privacy.'}
                </span>
              </h1>
            </div>

            {/* BARRA DE 4 ACCESOS DIRECTOS EN UNA SOLA LÍNEA */}
            <div className="w-full max-w-4xl">
              <CategoryQuickTools layout="row" />
            </div>
          </div>

          {/* DROPZONE / FILE PREVIEW / UPLOAD PROGRESS - FULL WIDTH */}
          <div className="w-full mb-8 relative group">
            {/* Glow ambiental perimetral */}
            {!file && !isUploading && (
              <div
                className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-white/10 via-zinc-400/20 to-white/10 opacity-40 group-hover:opacity-80 blur-xl transition-all duration-500 pointer-events-none"
                aria-hidden="true"
              />
            )}

            <AnimatePresence mode="wait">
              {isUploading ? (
                <DocumentUploadProgress
                  key="uploading-view"
                  fileName={uploadingFile?.name}
                  fileSize={uploadingFile?.size}
                  progress={uploadProgress}
                  onCancel={handleCancelUpload}
                />
              ) : !file ? (
                <div
                  key="dropzone-view"
                  ref={dropzoneRef}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={
                    isFr
                      ? 'Zone de dépôt de fichiers PDF. Cliquez ou glissez un fichier.'
                      : isPt
                        ? 'Zona de upload de arquivos PDF. Clique ou arraste um arquivo.'
                        : isEs
                          ? 'Zona de carga de archivos PDF. Haz clic o arrastra un archivo.'
                          : 'PDF upload area. Click or drag a file.'
                  }
                  aria-describedby="dropzone-instructions"
                  className="w-full min-h-[320px] sm:min-h-[360px] bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border-2 border-dashed border-zinc-600 group-hover:border-white rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 shadow-2xl relative overflow-hidden"
                >
                  <span id="dropzone-instructions" className="sr-only">
                    {isFr
                      ? 'Glissez un fichier PDF dans cette zone ou cliquez pour sélectionner un fichier de votre appareil. Seuls les fichiers PDF sont acceptés.'
                      : isPt
                        ? 'Arraste um arquivo PDF para esta área ou clique para selecionar um arquivo do seu dispositivo. Apenas arquivos PDF são aceitos.'
                        : isEs
                          ? 'Arrastra un archivo PDF a esta zona o haz clic para seleccionar un archivo de tu equipo. Solo se aceptan archivos PDF.'
                          : 'Drag a PDF file to this area or click to select a file from your device. Only PDF files are accepted.'}
                  </span>

                  {/* Efecto Spotlight dinámico en hover */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent"
                    aria-hidden="true"
                  />

                  {/* Icono de carga con relieve y brillo */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="bg-zinc-800 p-5 rounded-2xl border border-zinc-500 shadow-[0_4px_20px_rgba(0,0,0,0.5)] group-hover:border-zinc-300 group-hover:scale-110 transition-all duration-300 relative z-10"
                    aria-hidden="true"
                  >
                    <UploadCloud className="w-12 h-12 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
                  </motion.div>

                  <div className="text-center flex flex-col items-center gap-2 relative z-10">
                    <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {isFr
                        ? 'Glissez votre fichier PDF ici'
                        : isPt
                          ? 'Arraste seu arquivo PDF aqui'
                          : isEs
                            ? 'Arrastra tu archivo PDF aquí'
                            : 'Drop your PDF file here'}
                    </p>
                    <p className="text-zinc-300 text-xs sm:text-sm font-mono flex items-center justify-center gap-1.5 font-medium">
                      <Sparkles className="w-4 h-4 text-zinc-300" aria-hidden="true" />
                      {isFr
                        ? 'ou cliquez pour parcourir vos fichiers'
                        : isPt
                          ? 'ou clique para explorar seus arquivos locais'
                          : isEs
                            ? 'o haz clic para explorar en tu equipo'
                            : 'or click to browse local files'}
                    </p>
                  </div>

                  {/* Botón CTA principal */}
                  <span className="flex items-center justify-center gap-2.5 bg-white text-black hover:bg-zinc-100 px-8 py-3.5 rounded-full font-sans text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 relative z-10">
                    <FilePlus className="w-4 h-4 text-black" aria-hidden="true" />{' '}
                    {isFr
                      ? 'Sélectionner un PDF'
                      : isPt
                        ? 'Selecionar PDF'
                        : isEs
                          ? 'Seleccionar PDF'
                          : 'Select PDF'}
                  </span>

                  <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-mono rounded-full mt-1 relative z-10 shadow-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    <span className="font-semibold tracking-wide">
                      {isFr
                        ? '100% GRATUIT • SANS INSCRIPTION • SANS CARTE'
                        : isPt
                          ? '100% GRATUITO • SEM CADASTRO • SEM CARTÃO'
                          : isEs
                            ? '100% GRATIS • SIN REGISTRO • SIN TARJETA'
                            : '100% FREE • NO SIGN-UP • NO CREDIT CARD'}
                    </span>
                  </div>
                </div>
              ) : (
                /* VISOR DEL PDF */
                <div
                  key="viewer-view"
                  className="w-full min-h-[440px] sm:min-h-[520px] bg-[#09090b] border border-zinc-600 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col relative"
                  role="region"
                  aria-label={
                    isFr
                      ? 'Aperçu du PDF chargé'
                      : isPt
                        ? 'Pré-visualização do PDF carregado'
                        : isEs
                          ? 'Vista previa del PDF cargado'
                          : 'Loaded PDF preview'
                  }
                >
                  <div className="bg-zinc-900 border-b border-zinc-700 p-4 flex justify-between items-center z-10 font-mono">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className="bg-zinc-800 p-2 border border-zinc-700 rounded-lg flex-shrink-0"
                        aria-hidden="true"
                      >
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-white font-bold text-xs truncate max-w-xs sm:max-w-md">
                          {file.name}
                        </span>
                        <span className="text-zinc-300 text-[10px]">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-white text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-white" aria-hidden="true" />
                        <span>LOCAL</span>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="flex-shrink-0 p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-md transition-all cursor-pointer"
                        aria-label={
                          isFr
                            ? `Supprimer le fichier ${file.name}`
                            : isPt
                              ? `Remover arquivo ${file.name}`
                              : isEs
                                ? `Quitar archivo ${file.name}`
                                : `Remove file ${file.name}`
                        }
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full flex-1 min-h-[380px] bg-[#09090b] relative overflow-hidden flex items-center justify-center p-4">
                    <PdfPreviewThumbnail file={file} />
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* TARJETAS DE MÓDULOS 001 - 004 */}
          <div className="w-full mb-8">
            {file && (
              <div
                className="mb-4 flex items-center gap-2.5 bg-white/10 border border-white/20 text-white px-4 py-3 rounded-xl shadow-lg font-mono"
                role="status"
                aria-live="polite"
              >
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  {isFr
                    ? 'DOCUMENT CHARGÉ. SÉLECTIONNEZ LE MODULE À EXÉCUTER :'
                    : isPt
                      ? 'DOCUMENTO CARREGADO. SELECIONE O MÓDULO A EXECUTAR:'
                      : isEs
                        ? 'DOCUMENTO CARREGADO. SELECCIONA EL MÓDULO A EJECUTAR:'
                        : 'DOCUMENT LOADED. SELECT MODULE TO EXECUTE:'}
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} file={file} lang={lang} />
              ))}
            </div>
          </div>

          {/* SECCIÓN 4 PASOS STYLE CONTENT ARCHITECTURE */}
          {!file && (
            <section
              className="w-full mt-14 pt-12 border-t border-zinc-800 flex flex-col items-center font-mono"
              aria-label={
                isFr
                  ? 'Comment fonctionne PDFBlack'
                  : isPt
                    ? 'Como funciona o PDFBlack'
                    : isEs
                      ? 'Cómo funciona PDFBlack'
                      : 'How PDFBlack works'
              }
            >
              <div className="text-center mb-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-full mb-3 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  {isFr
                    ? '000 / COMMENT FONCTIONNE PDFBLACK ?'
                    : isPt
                      ? '000 / COMO FUNCIONA O PDFBLACK?'
                      : isEs
                        ? '000 / ¿CÓMO FUNCIONA PDFBLACK?'
                        : '000 / HOW PDFBLACK WORKS'}
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2 font-sans">
                  {isFr
                    ? 'Traitement en 4 étapes simples'
                    : isPt
                      ? 'Processamento em 4 passos simples'
                      : isEs
                        ? 'Procesamiento en 4 pasos sencillos'
                        : 'Simple 4-Step Process'}
                </h2>
                <p className="text-zinc-300 text-xs sm:text-sm font-sans leading-relaxed">
                  {isFr
                    ? 'Garantie absolue de confidentialité. Vos documents ne quittent jamais votre appareil et ne touchent aucun serveur externe.'
                    : isPt
                      ? 'Garantia absoluta de privacidade. Seus documentos nunca saem do seu dispositivo nem tocam servidores externos.'
                      : isEs
                        ? 'Garantía absoluta de privacidad. Tus documentos nunca salen de tu equipo ni tocan servidores externos.'
                        : 'Absolute privacy guarantee. Your documents never leave your device or touch external servers.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                {/* PASO 1 */}
                <SpotlightCard
                  className="flex flex-col items-start p-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl transition-all group shadow-xl"
                  aria-labelledby="step-1-title"
                >
                  <span className="text-xs text-zinc-300 font-bold mb-3 block font-mono">
                    001 / {isFr ? 'CHARGER' : isPt ? 'CARREGAR' : isEs ? 'CARGAR' : 'UPLOAD'}
                  </span>
                  <h3 id="step-1-title" className="text-base font-bold text-white mb-2 font-sans">
                    {isFr
                      ? '1. Chargez votre PDF'
                      : isPt
                        ? '1. Envie seu Arquivo PDF'
                        : isEs
                          ? '1. Carga tu Archivo PDF'
                          : '1. Upload your PDF File'}
                  </h3>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {isFr
                      ? 'Glissez votre document dans la zone de dépôt ou sélectionnez-le sur votre appareil. Sans inscription ni carte.'
                      : isPt
                        ? 'Arraste seu documento para a área de upload ou selecione do seu dispositivo. Sem cadastro nem cartão.'
                        : isEs
                          ? 'Arrastra tu documento a la zona de carga o selecciónalo de tu equipo. Sin registro ni tarjeta de crédito.'
                          : 'Drag your document into the dropzone or select it from your device. No sign-up or credit card needed.'}
                  </p>
                </SpotlightCard>

                {/* PASO 2 */}
                <SpotlightCard
                  className="flex flex-col items-start p-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl transition-all group shadow-xl"
                  aria-labelledby="step-2-title"
                >
                  <span className="text-xs text-zinc-300 font-bold mb-3 block font-mono">
                    002 /{' '}
                    {isFr ? 'CATÉGORIE' : isPt ? 'CATEGORIA' : isEs ? 'CATEGORÍA' : 'CATEGORY'}
                  </span>
                  <h3 id="step-2-title" className="text-base font-bold text-white mb-2 font-sans">
                    {isFr
                      ? '2. Choisissez la Catégorie'
                      : isPt
                        ? '2. Selecione a Categoria'
                        : isEs
                          ? '2. Selecciona la Categoría'
                          : '2. Choose your Category'}
                  </h3>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {isFr
                      ? 'Choisissez l’une des 4 catégories principales (Éditer, Organiser, Convertir ou Optimiser) selon vos besoins.'
                      : isPt
                        ? 'Escolha um dos 4 módulos principais (Editar, Organizar, Converter ou Otimizar) conforme a ferramenta necessária.'
                        : isEs
                          ? 'Elige uno de los 4 botones principales (Editar, Organizar, Convertir u Optimizar) según la herramienta que necesites.'
                          : 'Select one of the 4 main buttons (Edit, Organize, Convert, or Optimize) depending on the tool group you need.'}
                  </p>
                </SpotlightCard>

                {/* PASO 3 */}
                <SpotlightCard
                  className="flex flex-col items-start p-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl transition-all group shadow-xl"
                  aria-labelledby="step-3-title"
                >
                  <span className="text-xs text-zinc-300 font-bold mb-3 block font-mono">
                    003 / {isFr ? 'ÉDITION' : isPt ? 'EDIÇÃO' : isEs ? 'EDICIÓN' : 'EDITING'}
                  </span>
                  <h3 id="step-3-title" className="text-base font-bold text-white mb-2 font-sans">
                    {isFr
                      ? '3. Travaillez sur la Page Outil'
                      : isPt
                        ? '3. Trabalhe na Página da Ferramenta'
                        : isEs
                          ? '3. Trabaja en la Sub-Página'
                          : '3. Work in Tool Sub-Page'}
                  </h3>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {isFr
                      ? 'Accédez directement à la page de l’outil pour personnaliser, modifier et traiter votre PDF en direct.'
                      : isPt
                        ? 'Você será levado para a página específica da ferramenta para personalizar e processar seu PDF ao vivo.'
                        : isEs
                          ? 'Serás llevado a la página específica de la herramienta para personalizar, modificar y procesar tu PDF en vivo.'
                          : 'You will be taken to your selected tool sub-page to customize, modify, and process your PDF live.'}
                  </p>
                </SpotlightCard>

                {/* PASO 4 */}
                <SpotlightCard
                  className="flex flex-col items-start p-6 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl transition-all group shadow-xl"
                  aria-labelledby="step-4-title"
                >
                  <span className="text-xs text-zinc-300 font-bold mb-3 block font-mono">
                    004 / {isFr ? 'TÉLÉCHARGER' : isPt ? 'BAIXAR' : isEs ? 'DESCARGAR' : 'DOWNLOAD'}
                  </span>
                  <h3 id="step-4-title" className="text-base font-bold text-white mb-2 font-sans">
                    {isFr
                      ? '4. Téléchargez votre PDF Prêt'
                      : isPt
                        ? '4. Baixe seu PDF Pronto'
                        : isEs
                          ? '4. Descarga tu PDF Listo'
                          : '4. Download your Ready PDF'}
                  </h3>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {isFr
                      ? 'Obtenez votre document modifié immédiatement en un seul clic, 100% privé et prêt à l’emploi.'
                      : isPt
                        ? 'Obtenha seu documento modificado instantaneamente com um clique, 100% privado e pronto para uso.'
                        : isEs
                          ? 'Obtén tu documento modificado inmediatamente con un solo clic, 100% privado y listo para usar.'
                          : 'Get your modified document immediately with a single click, 100% private and ready to use.'}
                  </p>
                </SpotlightCard>
              </div>

              {/* SECCIÓN DETALLADA DE GRUPOS DE HERRAMIENTAS: EDITAR, ORGANIZAR, CONVERTIR, OPTIMIZAR */}
              <section
                className="w-full mt-14 pt-12 border-t border-zinc-800 font-sans"
                aria-label={
                  isFr
                    ? 'Guide technique des groupes d’outils'
                    : isPt
                      ? 'Guia técnico de ferramentas'
                      : isEs
                        ? 'Guía técnica de grupos de herramientas'
                        : 'Technical tool group guide'
                }
              >
                <div className="text-center mb-10 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-full mb-3 font-mono shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    {isFr
                      ? 'GUIDE TECHNIQUE ET DE SÉCURITÉ'
                      : isPt
                        ? 'GUIA TÉCNICO E DE SEGURANÇA'
                        : isEs
                          ? 'GUÍA TÉCNICA Y DE SEGURIDAD'
                          : 'TECHNICAL & SECURITY GUIDE'}
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                    {isFr
                      ? 'Que se passe-t-il avec votre fichier PDF dans chaque groupe d’outils ?'
                      : isPt
                        ? 'O que acontece com seu arquivo PDF em cada grupo de ferramentas?'
                        : isEs
                          ? '¿Qué le sucede a tu archivo PDF en cada grupo de herramientas?'
                          : 'What happens to your PDF in each tool group?'}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm font-mono leading-relaxed">
                    {isFr
                      ? 'Transparence absolue. Découvrez en détail ce qui se passe dans votre navigateur lors du traitement de vos documents.'
                      : isPt
                        ? 'Transparência total. Descubra em detalhes o que acontece no seu navegador ao processar documentos.'
                        : isEs
                          ? 'Transparencia absoluta. Conoce en detalle qué ocurre dentro de tu navegador al procesar tus documentos.'
                          : 'Absolute transparency. Discover in detail what happens inside your browser when processing documents.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                  {/* GRUPO 1: EDITAR */}
                  <SpotlightCard
                    className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between"
                    aria-labelledby="group-edit-title"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md"
                            aria-hidden="true"
                          >
                            <Edit3 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-zinc-300 font-bold block">
                              001 /{' '}
                              {isFr
                                ? 'ÉDITION DIRECTE'
                                : isPt
                                  ? 'EDIÇÃO DIRETA'
                                  : isEs
                                    ? 'EDICIÓN DIRECTA'
                                    : 'DIRECT EDITING'}
                            </span>
                            <h4
                              id="group-edit-title"
                              className="text-xl font-bold text-white tracking-tight"
                            >
                              {isFr
                                ? 'Groupe ÉDITER PDF'
                                : isPt
                                  ? 'Grupo EDITAR PDF'
                                  : isEs
                                    ? 'Grupo EDITAR PDF'
                                    : 'EDIT PDF Group'}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-800 border border-zinc-600 text-white rounded-full font-bold">
                          {isFr
                            ? 'Édition Visuelle'
                            : isPt
                              ? 'Edição Visual'
                              : isEs
                                ? 'Edición Visual'
                                : 'Visual Editing'}
                        </span>
                      </div>

                      {/* QUÉ SUCEDE A TU ARCHIVO */}
                      <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-4 mb-4 font-mono text-xs text-zinc-200 space-y-2 shadow-sm">
                        <strong className="text-white font-sans font-bold text-xs flex items-center gap-1.5 border-b border-zinc-700 pb-2">
                          <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                          {isFr
                            ? 'Processus Binaire et Sécurité dans ÉDITER :'
                            : isPt
                              ? 'Processo Binário e Segurança em EDITAR:'
                              : isEs
                                ? 'Proceso Binario y Seguridad en EDITAR:'
                                : 'Binary Process & Security in EDIT:'}
                        </strong>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Lors de l’édition, le fichier PDF est décomposé en objets dans la mémoire RAM isolée de votre navigateur. Les modifications de texte, filigranes, numérotations ou signatures sont injectées sous forme de couches vectorielles natives selon la norme PDF 1.7 sans réencodage destructif.'
                            : isPt
                              ? 'Ao editar, o PDF é decodificado em objetos na memória RAM isolada do navegador. Modificações de texto, marcas d’água, numerações ou assinaturas são injetadas como camadas vetoriais nativas no padrão PDF 1.7 sem sobrescrever destrutivamente o arquivo.'
                              : isEs
                                ? 'Al editar un documento, el archivo PDF se descompone en objetos en la memoria RAM aislada de tu navegador. Las modificaciones de texto, marcas de agua, números de folio o firmas trazadas no sobreescriben destructivamente el archivo; se inyectan como capas vectoriales nativas bajo la especificación PDF 1.7.'
                                : 'When editing, the PDF decodes into objects inside isolated browser RAM. Text edits, watermarks, page numbers, or drawn signatures embed as clean native vector streams under PDF 1.7 standard.'}
                        </p>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Pour l’OCR, la reconnaissance des caractères s’exécute via des modèles WebAssembly locaux analysant les pixels sans aucune requête API externe. Votre document original reste 100% intact sur votre disque.'
                            : isPt
                              ? 'No OCR, o reconhecimento de texto roda via modelos locais WebAssembly que analisam pixels sem chamadas a servidores externos. Seu arquivo original permanece 100% intacto no seu computador.'
                              : isEs
                                ? 'En OCR, el reconocimiento de caracteres se ejecuta mediante modelos WebAssembly locales que analizan píxeles sin transmitir ninguna imagen a servidores externos. Tu archivo original permanece 100% intacto en tu equipo.'
                                : 'In OCR, character recognition runs via local WebAssembly models analyzing image pixels with zero external API calls. Your original file remains untouched on your drive.'}
                        </p>
                      </div>

                      <ul
                        className="space-y-2.5 text-xs text-zinc-200 font-mono mb-6"
                        aria-label={
                          isFr
                            ? 'Outils d’édition'
                            : isPt
                              ? 'Ferramentas de edição'
                              : isEs
                                ? 'Herramientas de edición'
                                : 'Editing tools'
                        }
                      >
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Modifier Texte :'
                                : isPt
                                  ? 'Editar Texto:'
                                  : isEs
                                    ? 'Editar Texto:'
                                    : 'Edit Text:'}
                            </strong>{' '}
                            {isFr
                              ? 'Insère du texte natif en ajustant polices et alignement.'
                              : isPt
                                ? 'Insere texto nativo ajustando fontes e alinhamento.'
                                : isEs
                                  ? 'Inserta texto nativo ajustando fuentes y alineación.'
                                  : 'Inserts native text adjusting fonts and alignment.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Numéroter Pages :'
                                : isPt
                                  ? 'Numerar Páginas:'
                                  : isEs
                                    ? 'Foliar Páginas:'
                                    : 'Page Numbers:'}
                            </strong>{' '}
                            {isFr
                              ? 'Ajoute une numérotation séquentielle automatisée.'
                              : isPt
                                ? 'Adiciona numeração sequencial automatizada.'
                                : isEs
                                  ? 'Agrega numeración correlativa automatizada.'
                                  : 'Adds automated sequential page numbers.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Filigranes :'
                                : isPt
                                  ? 'Marcas d’Água:'
                                  : isEs
                                    ? 'Marcas de Agua:'
                                    : 'Watermarks:'}
                            </strong>{' '}
                            {isFr
                              ? 'Applique des tampons ou mentions de sécurité sur chaque page.'
                              : isPt
                                ? 'Aplica carimbos ou textos de segurança nas páginas.'
                                : isEs
                                  ? 'Aplica sellos o textos de seguridad sobre cada página.'
                                  : 'Applies security stamps or text across pages.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Signer & OCR :'
                                : isPt
                                  ? 'Assinar & OCR:'
                                  : isEs
                                    ? 'Firmar & OCR:'
                                    : 'Sign & OCR:'}
                            </strong>{' '}
                            {isFr
                              ? 'Appose des signatures tracées et convertit les images scannées en texte.'
                              : isPt
                                ? 'Aplica assinaturas desenhadas e converte páginas escaneadas em texto.'
                                : isEs
                                  ? 'Estampa firmas trazadas y convierte imágenes escaneadas en texto.'
                                  : 'Stamps drawn signatures and turns scanned images into text.'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href={getUrlForLanguage('/editar', lang)}
                      className="inline-flex items-center justify-between bg-zinc-800 hover:bg-white hover:text-black border border-zinc-600 hover:border-white text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group font-bold shadow-md"
                      aria-label={
                        isFr
                          ? 'Voir tous les outils d’édition'
                          : isPt
                            ? 'Ver todas as ferramentas de edição'
                            : isEs
                              ? 'Ver todas las herramientas de editar PDF'
                              : 'View all edit PDF tools'
                      }
                    >
                      <span>
                        {isFr
                          ? 'Voir outils Éditer →'
                          : isPt
                            ? 'Ver ferramentas de Edição →'
                            : isEs
                              ? 'Ver herramientas de Editar →'
                              : 'View Edit tools →'}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    </Link>
                  </SpotlightCard>

                  {/* GRUPO 2: ORGANIZAR */}
                  <SpotlightCard
                    className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between"
                    aria-labelledby="group-organize-title"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md"
                            aria-hidden="true"
                          >
                            <FolderOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-zinc-300 font-bold block">
                              002 /{' '}
                              {isFr
                                ? 'STRUCTURE'
                                : isPt
                                  ? 'ESTRUTURA'
                                  : isEs
                                    ? 'ESTRUCTURA'
                                    : 'STRUCTURE'}
                            </span>
                            <h4
                              id="group-organize-title"
                              className="text-xl font-bold text-white tracking-tight"
                            >
                              {isFr
                                ? 'Groupe ORGANISER PDF'
                                : isPt
                                  ? 'Grupo ORGANIZAR PDF'
                                  : isEs
                                    ? 'Grupo ORGANIZAR PDF'
                                    : 'ORGANIZE PDF Group'}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-800 border border-zinc-600 text-white rounded-full font-bold">
                          {isFr
                            ? 'Gestionnaire de Pages'
                            : isPt
                              ? 'Gerenciador de Páginas'
                              : isEs
                                ? 'Gestor de Páginas'
                                : 'Page Builder'}
                        </span>
                      </div>

                      {/* QUÉ SUCEDE A TU ARCHIVO */}
                      <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-4 mb-4 font-mono text-xs text-zinc-200 space-y-2 shadow-sm">
                        <strong className="text-white font-sans font-bold text-xs flex items-center gap-1.5 border-b border-zinc-700 pb-2">
                          <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                          {isFr
                            ? 'Processus Binaire et Sécurité dans ORGANISER :'
                            : isPt
                              ? 'Processo Binário e Segurança em ORGANIZAR:'
                              : isEs
                                ? 'Proceso Binario y Seguridad en ORGANIZAR:'
                                : 'Binary Process & Security in ORGANIZE:'}
                        </strong>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Le moteur d’organisation manipule directement le dictionnaire hiérarchique de pages (`PageTree`) dans la RAM. Lors de la réorganisation, rotation, rognage ou division, seuls les pointeurs logiques de la table de références croisées sont modifiés sans altérer la qualité vectorielle.'
                            : isPt
                              ? 'O motor de organização manipula a estrutura `PageTree` diretamente na RAM. Ao reordenar, girar, recortar ou dividir, apenas os ponteiros lógicos são atualizados sem re-codificar imagens ou perder nitidez.'
                              : isEs
                                ? 'El motor de organización manipula directamente el diccionario jerárquico de páginas (`PageTree`) en la RAM. Al reordenar, rotar, recortar o dividir, el navegador no recodifica las imágenes ni los textos; únicamente reorganiza los punteros lógicos en la tabla de referencias cruzadas.'
                                : 'Organize tools modify the document PageTree catalog in RAM. When reordering, rotating, cropping, or splitting, only logical pointers update without re-encoding images or reducing vector quality.'}
                        </p>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Lors de la fusion de fichiers, le système regroupe les dictionnaires de ressources partagées dans un conteneur PDF unifié à vitesse locale maximale, garantissant une netteté totale pour plans et graphiques.'
                            : isPt
                              ? 'Ao juntar múltiplos arquivos, o sistema une os dicionários de recursos em um PDF unificado na velocidade máxima do seu processador local, mantendo 100% de nitidez.'
                              : isEs
                                ? 'Al unir múltiples archivos, el sistema fusiona las tablas de recursos compartidas en un nuevo contenedor PDF unificado a máxima velocidad local, garantizando que planos técnicos, imágenes y documentos conserven 100% su nitidez.'
                                : 'When merging multiple files, shared resource tables merge into a unified PDF container at max local CPU speed, ensuring blueprints and images retain 100% sharpness.'}
                        </p>
                      </div>

                      <ul
                        className="space-y-2.5 text-xs text-zinc-200 font-mono mb-6"
                        aria-label={
                          isFr
                            ? 'Outils d’organisation'
                            : isPt
                              ? 'Ferramentas de organização'
                              : isEs
                                ? 'Herramientas de organización'
                                : 'Organization tools'
                        }
                      >
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Fusionner PDF :'
                                : isPt
                                  ? 'Juntar PDF:'
                                  : isEs
                                    ? 'Unir PDF:'
                                    : 'Merge PDF:'}
                            </strong>{' '}
                            {isFr
                              ? 'Combine les arbres de pages de plusieurs PDF sans perte de qualité.'
                              : isPt
                                ? 'Combina páginas de vários PDFs sem perda de qualidade.'
                                : isEs
                                  ? 'Combina árboles de páginas de varios PDFs sin pérdida de nitidez.'
                                  : 'Merges page trees from multiple PDFs without resolution loss.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Diviser & Supprimer :'
                                : isPt
                                  ? 'Dividir & Excluir:'
                                  : isEs
                                    ? 'Dividir & Eliminar:'
                                    : 'Split & Delete:'}
                            </strong>{' '}
                            {isFr
                              ? 'Découpe par plages exactes ou supprime les pages superflues.'
                              : isPt
                                ? 'Divide por intervalos exatos ou exclui páginas desnecessárias.'
                                : isEs
                                  ? 'Corta por rangos exactos o quita páginas descartables.'
                                  : 'Splits by exact page ranges or removes unnecessary pages.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Réorganiser & Pivoter :'
                                : isPt
                                  ? 'Reordenar & Girar:'
                                  : isEs
                                    ? 'Reordenar & Rotar:'
                                    : 'Reorder & Rotate:'}
                            </strong>{' '}
                            {isFr
                              ? 'Glissez les miniatures et ajustez les angles à 90°/180°.'
                              : isPt
                                ? 'Arraste miniaturas e ajuste ângulos em 90°/180°.'
                                : isEs
                                  ? 'Arrastra miniaturas e invierte ángulos a 90°/180°.'
                                  : 'Drag page thumbnails and adjust angles to 90°/180°.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Rogner Marges :'
                                : isPt
                                  ? 'Recortar Margens:'
                                  : isEs
                                    ? 'Recortar Márgenes:'
                                    : 'Crop Margins:'}
                            </strong>{' '}
                            {isFr
                              ? 'Rogne les marges selon des dimensions standardisées.'
                              : isPt
                                ? 'Recorta as margens para formatos padronizados.'
                                : isEs
                                  ? 'Recorta los bordes a dimensiones estandarizadas.'
                                  : 'Crops document margins to standard dimensions.'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href={getUrlForLanguage('/organizar', lang)}
                      className="inline-flex items-center justify-between bg-zinc-800 hover:bg-white hover:text-black border border-zinc-600 hover:border-white text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group font-bold shadow-md"
                      aria-label={
                        isFr
                          ? 'Voir tous les outils d’organisation'
                          : isPt
                            ? 'Ver todas as ferramentas de organização'
                            : isEs
                              ? 'Ver todas las herramientas de organizar PDF'
                              : 'View all organize PDF tools'
                      }
                    >
                      <span>
                        {isFr
                          ? 'Voir outils Organiser →'
                          : isPt
                            ? 'Ver ferramentas de Organização →'
                            : isEs
                              ? 'Ver herramientas de Organizar →'
                              : 'View Organize tools →'}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    </Link>
                  </SpotlightCard>

                  {/* GRUPO 3: CONVERTIR */}
                  <SpotlightCard
                    className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between"
                    aria-labelledby="group-convert-title"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md"
                            aria-hidden="true"
                          >
                            <RefreshCw className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-zinc-300 font-bold block">
                              003 /{' '}
                              {isFr
                                ? 'CONVERSION'
                                : isPt
                                  ? 'CONVERSÃO'
                                  : isEs
                                    ? 'CONVERSIÓN'
                                    : 'CONVERSION'}
                            </span>
                            <h4
                              id="group-convert-title"
                              className="text-xl font-bold text-white tracking-tight"
                            >
                              {isFr
                                ? 'Groupe CONVERTIR PDF'
                                : isPt
                                  ? 'Grupo CONVERTER PDF'
                                  : isEs
                                    ? 'Grupo CONVERTIR PDF'
                                    : 'CONVERT PDF Group'}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-800 border border-zinc-600 text-white rounded-full font-bold">
                          {isFr
                            ? 'Haute Précision'
                            : isPt
                              ? 'Alta Fidelidade'
                              : isEs
                                ? 'Alta Fidelidad'
                                : 'High Precision'}
                        </span>
                      </div>

                      {/* QUÉ SUCEDE A TU ARCHIVO */}
                      <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-4 mb-4 font-mono text-xs text-zinc-200 space-y-2 shadow-sm">
                        <strong className="text-white font-sans font-bold text-xs flex items-center gap-1.5 border-b border-zinc-700 pb-2">
                          <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                          {isFr
                            ? 'Processus Binaire et Sécurité dans CONVERTIR :'
                            : isPt
                              ? 'Processo Binário e Segurança em CONVERTER:'
                              : isEs
                                ? 'Proceso Binario y Seguridad en CONVERTIR:'
                                : 'Binary Process & Security in CONVERT:'}
                        </strong>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Le moteur de conversion côté client analyse les coordonnées spatiales (`x, y, z`) des paragraphes, tableaux et images du PDF. Il reconstruit instantanément le document en structures XML compatibles Word (DOCX), Excel (XLSX) ou PowerPoint (PPTX).'
                            : isPt
                              ? 'O motor cliente de conversão analisa as coordenadas (`x, y, z`) de textos, tabelas e imagens no PDF, reconstruindo o documento em estruturas OpenXML nativas (DOCX, XLSX, PPTX) em tempo real.'
                              : isEs
                                ? 'El motor cliente de conversión analiza las coordenadas tridimensionales (`x, y, z-index`) de párrafos, tablas de datos e imágenes en el PDF. Reconstruye el documento traduciendo su maquetación a estructuras de archivos XML compatibles con Word (DOCX), Excel (XLSX) o PowerPoint (PPTX) de forma instantánea.'
                                : 'The client-side conversion engine parses spatial coordinates (`x, y, z`) of text, table cells, and images from the PDF, recompiling them into OpenXML structures (DOCX, XLSX, PPTX) in real-time.'}
                        </p>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Aucun serveur intermédiaire ni API tierce ne traite vos données financières, bilans ou contrats. L’analyse syntaxique et la génération ZIP s’exécutent dans la mémoire isolée de votre navigateur.'
                            : isPt
                              ? 'Nenhum servidor intermediário ou API de terceiros processa seus dados financeiros ou contratos. A análise e geração do pacote ZIP ocorrem dentro da memória do navegador.'
                              : isEs
                                ? 'No existen servidores intermedios ni APIs de terceros procesando tus estados financieros, contratos o presentaciones comerciales. Todo el análisis sintáctico y empaquetado comprimido se realiza dentro de la memoria privada de tu navegador.'
                                : 'No intermediate cloud servers or third-party APIs process your financial sheets or contracts. Parsing and ZIP generation happen inside private browser memory.'}
                        </p>
                      </div>

                      <ul
                        className="space-y-2.5 text-xs text-zinc-200 font-mono mb-6"
                        aria-label={
                          isFr
                            ? 'Outils de conversion'
                            : isPt
                              ? 'Ferramentas de conversão'
                              : isEs
                                ? 'Herramientas de conversión'
                                : 'Conversion tools'
                        }
                      >
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">PDF ↔ Word:</strong>{' '}
                            {isFr
                              ? 'Convertit paragraphes et styles en format éditable DOCX.'
                              : isPt
                                ? 'Converte parágrafos e estilos em formato editável DOCX.'
                                : isEs
                                  ? 'Convierte párrafos y estilos a formato editable DOCX.'
                                  : 'Converts paragraphs and formatting into editable DOCX.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">PDF ↔ Excel:</strong>{' '}
                            {isFr
                              ? 'Extrait les tableaux de données directement en feuilles XLSX.'
                              : isPt
                                ? 'Extrai tabelas de dados diretamente em planilhas XLSX.'
                                : isEs
                                  ? 'Extrae tablas de datos directamente a hojas XLSX.'
                                  : 'Extracts data tables directly into XLSX spreadsheets.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">PDF ↔ PowerPoint:</strong>{' '}
                            {isFr
                              ? 'Transforme les pages en diapositives éditables PPTX.'
                              : isPt
                                ? 'Transforma páginas em slides PPTX.'
                                : isEs
                                  ? 'Transforma páginas en diapositivas PPTX.'
                                  : 'Transforms pages into PPTX slides.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">PDF ↔ Images / HTML / TXT:</strong>{' '}
                            {isFr
                              ? 'Exporte les pages en images HD, code web ou texte brut.'
                              : isPt
                                ? 'Exporta páginas para imagens HD, código web ou texto simples.'
                                : isEs
                                  ? 'Exporta láminas a imágenes HD, código web o texto plano.'
                                  : 'Exports pages into HD images, web code, or text.'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href={getUrlForLanguage('/convertir', lang)}
                      className="inline-flex items-center justify-between bg-zinc-800 hover:bg-white hover:text-black border border-zinc-600 hover:border-white text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group font-bold shadow-md"
                      aria-label={
                        isFr
                          ? 'Voir tous les outils de conversion'
                          : isPt
                            ? 'Ver todas as ferramentas de conversão'
                            : isEs
                              ? 'Ver todas las herramientas de convertir PDF'
                              : 'View all convert PDF tools'
                      }
                    >
                      <span>
                        {isFr
                          ? 'Voir outils Convertir →'
                          : isPt
                            ? 'Ver ferramentas de Conversão →'
                            : isEs
                              ? 'Ver herramientas de Convertir →'
                              : 'View Convert tools →'}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    </Link>
                  </SpotlightCard>

                  {/* GRUPO 4: OPTIMIZAR */}
                  <SpotlightCard
                    className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-white rounded-3xl p-6 lg:p-8 transition-all shadow-2xl flex flex-col justify-between"
                    aria-labelledby="group-optimize-title"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md"
                            aria-hidden="true"
                          >
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-zinc-300 font-bold block">
                              004 /{' '}
                              {isFr
                                ? 'OPTIMISATION'
                                : isPt
                                  ? 'OTIMIZAÇÃO'
                                  : isEs
                                    ? 'OPTIMIZACIÓN'
                                    : 'OPTIMIZATION'}
                            </span>
                            <h4
                              id="group-optimize-title"
                              className="text-xl font-bold text-white tracking-tight"
                            >
                              {isFr
                                ? 'Groupe OPTIMISER PDF'
                                : isPt
                                  ? 'Grupo OTIMIZAR PDF'
                                  : isEs
                                    ? 'Grupo OPTIMIZAR PDF'
                                    : 'OPTIMIZE PDF Group'}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 bg-zinc-800 border border-zinc-600 text-white rounded-full font-bold">
                          {isFr
                            ? 'Sécurité & Poids'
                            : isPt
                              ? 'Segurança e Tamanho'
                              : isEs
                                ? 'Seguridad & Peso'
                                : 'Security & Size'}
                        </span>
                      </div>

                      {/* QUÉ SUCEDE A TU ARCHIVO */}
                      <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-4 mb-4 font-mono text-xs text-zinc-200 space-y-2 shadow-sm">
                        <strong className="text-white font-sans font-bold text-xs flex items-center gap-1.5 border-b border-zinc-700 pb-2">
                          <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                          {isFr
                            ? 'Processus Binaire et Sécurité dans OPTIMISER :'
                            : isPt
                              ? 'Processo Binário e Segurança em OTIMIZAR:'
                              : isEs
                                ? 'Proceso Binario y Seguridad en OPTIMIZAR:'
                                : 'Binary Process & Security in OPTIMIZE:'}
                        </strong>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Optimise et recompresse les flux binaires de données. Lors de la compression, réencode les images JPEG lourdes par rééchantillonnage Canvas et purge les métadonnées XRef superflues. Lors du chiffrement ou déverrouillage, exécute les algorithmes natifs AES-256 (`crypto.subtle`) sans transmettre de mots de passe en ligne.'
                            : isPt
                              ? 'Otimiza fluxos de dados binários na memória. A compressão re-codifica imagens pesadas via amostragem Canvas e limpa metadados redundantes da tabela XRef. A criptografia roda algoritmos nativos AES-256 (`crypto.subtle`) sem enviar senhas online.'
                              : isEs
                                ? 'Optimiza y re-comprime las fuentes de datos primarias. Al comprimir, re-codifica imágenes JPEG pesadas mediante resampling Canvas y elimina metadados redundantes de la tabla XRef. Al cifrar o desbloquear, ejecuta algoritmos criptográficos nativos **AES-256** (`crypto.subtle`) sin enviar jamás tus contraseñas a la red.'
                                : 'Optimizes binary data streams in memory. Compression re-encodes heavy JPEG images via Canvas resampling and purges redundant XRef metadata. Encryption runs native **AES-256** cryptography (`crypto.subtle`) without sending passwords online.'}
                        </p>
                        <p className="text-zinc-300 text-[11.5px] font-sans leading-relaxed">
                          {isFr
                            ? 'Pour la biffure confidentielle, les informations sélectionnées sont effacées physiquement du code binaire (contrairement aux simples rectangles noirs superposés). Pour la réparation, reconstitue les en-têtes `%PDF-` et structures corrompues.'
                            : isPt
                              ? 'Na tarja de dados confidenciais, a informação é fisicamente apagada do código binário do arquivo (diferente de colocar caixas pretas visuais editáveis). No reparo, reconstrói cabeçalhos `%PDF-` e tabelas corrompidas.'
                              : isEs
                                ? 'En censura confidencial, la información seleccionada se borra físicamente del código binario del archivo (a diferencia de marcar con recuadros negros editables). En reparación, se reconstruyen cabeceras `%PDF-` y estructuras dañadas.'
                                : 'In redaction, confidential text is permanently erased from the document binary code (unlike overlaying editable black boxes). Repair rebuilds corrupt headers and dictionaries.'}
                        </p>
                      </div>

                      <ul
                        className="space-y-2.5 text-xs text-zinc-200 font-mono mb-6"
                        aria-label={
                          isFr
                            ? 'Outils d’optimisation'
                            : isPt
                              ? 'Ferramentas de otimização'
                              : isEs
                                ? 'Herramientas de optimización'
                                : 'Optimization tools'
                        }
                      >
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Compresser PDF :'
                                : isPt
                                  ? 'Comprimir PDF:'
                                  : isEs
                                    ? 'Comprimir PDF:'
                                    : 'Compress PDF:'}
                            </strong>{' '}
                            {isFr
                              ? 'Réduit jusqu’à 90% le poids en conservant des textes nets.'
                              : isPt
                                ? 'Reduz até 90% do tamanho mantendo textos nítidos.'
                                : isEs
                                  ? 'Reduce hasta un 90% el peso manteniendo textos legibles.'
                                  : 'Reduces file size up to 90% keeping text clear.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Réparer PDF :'
                                : isPt
                                  ? 'Reparar PDF:'
                                  : isEs
                                    ? 'Reparar PDF:'
                                    : 'Repair PDF:'}
                            </strong>{' '}
                            {isFr
                              ? 'Reconstruit les tables XRef et répare les fichiers corrompus.'
                              : isPt
                                ? 'Reconstrói tabelas XRef e conserta arquivos danificados.'
                                : isEs
                                  ? 'Reconstruye tablas XRef y arregla archivos corruptos.'
                                  : 'Rebuilds XRef tables and fixes corrupt files.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Protéger & Déverrouiller :'
                                : isPt
                                  ? 'Proteger & Desbloquear:'
                                  : isEs
                                    ? 'Proteger & Desbloquear:'
                                    : 'Protect & Unlock:'}
                            </strong>{' '}
                            {isFr
                              ? 'Chiffre avec mot de passe ou retire la protection locale.'
                              : isPt
                                ? 'Criptografa com senha ou remove senhas localmente.'
                                : isEs
                                  ? 'Cifra con contraseña o remueve contraseñas locales.'
                                  : 'Encrypts with password or removes local passwords.'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-white">
                              {isFr
                                ? 'Censurer & Comparer :'
                                : isPt
                                  ? 'Tarjar & Comparar:'
                                  : isEs
                                    ? 'Censurar & Comparar:'
                                    : 'Redact & Compare:'}
                            </strong>{' '}
                            {isFr
                              ? 'Masque les données confidentielles ou compare visuellement deux PDF.'
                              : isPt
                                ? 'Oculta dados confidenciais ou compara visualmente PDFs.'
                                : isEs
                                  ? 'Oculta datos confidenciales o compara visualmente PDFs.'
                                  : 'Redacts private data or compares PDFs visually.'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href={getUrlForLanguage('/optimizar', lang)}
                      className="inline-flex items-center justify-between bg-zinc-800 hover:bg-white hover:text-black border border-zinc-600 hover:border-white text-white font-mono text-xs px-4 py-2.5 rounded-xl transition-all group font-bold shadow-md"
                      aria-label={
                        isFr
                          ? 'Voir tous les outils d’optimisation'
                          : isPt
                            ? 'Ver todas as ferramentas de otimização'
                            : isEs
                              ? 'Ver todas las herramientas de optimizar PDF'
                              : 'View all optimize PDF tools'
                      }
                    >
                      <span>
                        {isFr
                          ? 'Voir outils Optimiser →'
                          : isPt
                            ? 'Ver ferramentas de Otimização →'
                            : isEs
                              ? 'Ver herramientas de Optimizar →'
                              : 'View Optimize tools →'}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    </Link>
                  </SpotlightCard>
                </div>
              </section>
            </section>
          )}
        </div>

        {/* TABLA DE ARCHIVOS RECIENTES */}
        <section
          className="relative z-10 mt-12 sm:mt-16 font-sans"
          aria-label={
            isFr
              ? 'Fichiers récents'
              : isPt
                ? 'Arquivos recentes'
                : isEs
                  ? 'Archivos recientes'
                  : 'Recent files'
          }
        >
          <SpotlightCard className="w-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-zinc-700 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md"
                  aria-hidden="true"
                >
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
                  <span>005 /</span>{' '}
                  {isFr
                    ? 'FICHIERS RÉCENTS'
                    : isPt
                      ? 'ARQUIVOS RECENTES'
                      : isEs
                        ? 'ARCHIVOS RECIENTES'
                        : 'RECENT FILES'}
                </h2>
              </div>

              <div className="relative w-full sm:w-72 font-mono">
                <Search
                  className="w-3.5 h-3.5 text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <label htmlFor="file-search" className="sr-only">
                  {isFr
                    ? 'Rechercher des fichiers'
                    : isPt
                      ? 'Buscar arquivos'
                      : isEs
                        ? 'Buscar archivos'
                        : 'Search files'}
                </label>
                <input
                  id="file-search"
                  type="text"
                  placeholder={
                    isFr
                      ? 'Rechercher des fichiers...'
                      : isPt
                        ? 'Buscar arquivos...'
                        : isEs
                          ? 'Buscar archivos...'
                          : 'Search files...'
                  }
                  className="w-full bg-zinc-900 border border-zinc-600 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div
              className="overflow-x-auto"
              role="table"
              aria-label={
                isFr
                  ? 'Liste des fichiers récents'
                  : isPt
                    ? 'Lista de arquivos recentes'
                    : isEs
                      ? 'Lista de archivos recientes'
                      : 'Recent files list'
              }
            >
              <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th
                      scope="col"
                      className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider pl-2"
                    >
                      {isFr
                        ? 'NOM DU FICHIER'
                        : isPt
                          ? 'NOME DO ARQUIVO'
                          : isEs
                            ? 'NOMBRE DEL ARCHIVO'
                            : 'FILE NAME'}
                    </th>
                    <th
                      scope="col"
                      className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider"
                    >
                      {isFr ? 'TAILLE' : isPt ? 'TAMANHO' : isEs ? 'TAMAÑO' : 'SIZE'}
                    </th>
                    <th
                      scope="col"
                      className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider"
                    >
                      {isFr
                        ? 'ACTION EFFECTUÉE'
                        : isPt
                          ? 'AÇÃO REALIZADA'
                          : isEs
                            ? 'ACCIÓN REALIZADA'
                            : 'ACTION PERFORMED'}
                    </th>
                    <th
                      scope="col"
                      className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider"
                    >
                      {isFr ? 'ÉTAT' : isPt ? 'STATUS' : isEs ? 'ESTADO' : 'STATUS'}
                    </th>
                    <th
                      scope="col"
                      className="pb-3 font-semibold text-zinc-300 uppercase tracking-wider text-right pr-2"
                    >
                      {isFr ? 'ACTIONS' : isPt ? 'AÇÕES' : isEs ? 'ACCIONES' : 'ACTIONS'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700 text-zinc-200">
                  {!isHistoryLoaded ? (
                    <>
                      <SkeletonTableRow key="skel-row-1" />
                      <SkeletonTableRow key="skel-row-2" />
                      <SkeletonTableRow key="skel-row-3" />
                    </>
                  ) : recentFiles.length > 0 ? (
                    recentFiles.map((entry) => (
                      <TableRow
                        key={entry.id}
                        name={entry.name}
                        size={formatFileSize(entry.size)}
                        action={entry.action}
                        status={
                          isFr ? 'Terminé' : isPt ? 'Concluído' : isEs ? 'Completado' : 'Completed'
                        }
                        icon={getFileIcon(entry.toolId)}
                      />
                    ))
                  ) : (
                    <>
                      <TableRow
                        key="demo-row-1"
                        name="CAO_Presupuesto_Final.pdf"
                        size="2.4 MB"
                        action={
                          isFr
                            ? 'Converti en Excel'
                            : isPt
                              ? 'Convertido para Excel'
                              : isEs
                                ? 'Convertido a Excel'
                                : 'Converted to Excel'
                        }
                        status={
                          isFr ? 'Terminé' : isPt ? 'Concluído' : isEs ? 'Completado' : 'Completed'
                        }
                        icon={FileText}
                      />
                      <TableRow
                        key="demo-row-2"
                        name="Planos_Estructurales_v2.pdf"
                        size="15.1 MB"
                        action={
                          isFr
                            ? 'Compressé (-45%)'
                            : isPt
                              ? 'Comprimido (-45%)'
                              : isEs
                                ? 'Comprimido (-45%)'
                                : 'Compressed (-45%)'
                        }
                        status={
                          isFr ? 'Terminé' : isPt ? 'Concluído' : isEs ? 'Completado' : 'Completed'
                        }
                        icon={FileArchive}
                      />
                      <TableRow
                        key="demo-row-3"
                        name="Contrato_Firmado.pdf"
                        size="840 KB"
                        action={
                          isFr
                            ? 'Protégé (AES-256)'
                            : isPt
                              ? 'Protegido (AES-256)'
                              : isEs
                                ? 'Protegido (AES-256)'
                                : 'Protected (AES-256)'
                        }
                        status={
                          isFr ? 'Terminé' : isPt ? 'Concluído' : isEs ? 'Completado' : 'Completed'
                        }
                        icon={ShieldCheck}
                      />
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </section>

        {/* GARANTÍAS DE CONFIANZA, PRIVACIDAD Y ESTADÍSTICAS - FINAL DE LA PÁGINA (CENTRADO) */}
        <section
          className="relative z-10 w-full mt-4 mb-8 flex flex-col items-center justify-center gap-5 font-mono"
          aria-label={
            isFr
              ? 'Garanties et statistiques de la plateforme'
              : isPt
                ? 'Garantias e estatísticas da plataforma'
                : isEs
                  ? 'Garantías y estadísticas de la plataforma'
                  : 'Platform guarantees and statistics'
          }
        >
          {/* TARJETA DE CONFIANZA Y PRIVACIDAD TOTAL (CENTRADA) */}
          <div className="w-full max-w-5xl flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 p-5 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-400 rounded-3xl shadow-2xl transition-all duration-300 text-center">
            {/* INSIGNIA DE CONFIANZA Y PRIVACIDAD TOTAL */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs shadow-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <ShieldCheck className="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />
              <span className="font-bold tracking-wide">
                {isFr
                  ? 'BADGE DE CONFIANCE : 100% LOCAL ET PRIVÉ'
                  : isPt
                    ? 'SELO DE CONFIANÇA: 100% LOCAL E PRIVADO'
                    : isEs
                      ? 'INSIGNIA DE CONFIANZA: 100% LOCAL Y PRIVADO'
                      : 'TRUST BADGE: 100% LOCAL & PRIVATE'}
              </span>
              <span className="text-zinc-300 text-xs hidden md:inline-block font-normal">
                •{' '}
                {isFr
                  ? 'Vos fichiers ne quittent jamais votre navigateur'
                  : isPt
                    ? 'Seus arquivos nunca saem do seu navegador'
                    : isEs
                      ? 'Tus archivos nunca salen de tu navegador'
                      : 'Your files never leave your browser'}
              </span>
            </div>

            {/* LAS 4 CÁPSULAS CENTRADAS */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-200 font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                {isFr
                  ? 'Zéro Serveur'
                  : isPt
                    ? 'Zero Servidores'
                    : isEs
                      ? 'Cero Servidores'
                      : 'Zero Servers'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-200 font-bold shadow-sm">
                <Zap className="w-3.5 h-3.5 text-zinc-200" />
                {isFr ? '100% Gratuit' : isPt ? '100% Grátis' : isEs ? '100% Gratis' : '100% Free'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-200 font-bold shadow-sm">
                <Lock className="w-3.5 h-3.5 text-white" />
                {isFr
                  ? 'Sans Inscription'
                  : isPt
                    ? 'Sem Cadastro'
                    : isEs
                      ? 'Sin Registro'
                      : 'No Sign-up'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-200 font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                {isFr
                  ? '24 Outils'
                  : isPt
                    ? '24 Ferramentas'
                    : isEs
                      ? '24 Herramientas'
                      : '24 Tools'}
              </span>
            </div>
          </div>

          {/* KPIS DE SESIÓN CENTRADOS */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 font-mono"
            role="region"
            aria-label={
              isFr
                ? 'Statistiques de session'
                : isPt
                  ? 'Estatísticas da sessão'
                  : isEs
                    ? 'Estadísticas de sesión'
                    : 'Session statistics'
            }
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-200 text-xs font-mono font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white" aria-hidden="true"></span>
              <span>
                {isFr
                  ? '001 / Moteur PDF local 100% gratuit'
                  : isPt
                    ? '001 / Motor PDF local 100% gratuito'
                    : isEs
                      ? '001 / Arquitectura PDF local 100% gratuita'
                      : '001 / 100% Free local PDF engine'}
              </span>
            </div>
            <KpiPill
              icon={FileText}
              title={isFr ? 'Fichiers' : isPt ? 'Arquivos' : isEs ? 'Archivos' : 'Files'}
              value={filesProcessed}
              tooltip={
                isFr
                  ? 'Vos fichiers traités cette semaine'
                  : isPt
                    ? 'Seus arquivos processados esta semana'
                    : isEs
                      ? 'Tus archivos procesados esta semana'
                      : 'Files processed this week'
              }
              color="text-white"
            />
            <KpiPill
              icon={HardDrive}
              title={isFr ? 'Économisé' : isPt ? 'Economizado' : isEs ? 'Ahorrado' : 'Saved'}
              value={bytesSaved / (1024 * 1024)}
              decimals={1}
              suffix=" MB"
              tooltip={
                isFr
                  ? 'Stockage optimisé localement'
                  : isPt
                    ? 'Armazenamento otimizado localmente'
                    : isEs
                      ? 'Almacenamiento optimizado localmente'
                      : 'Locally optimized storage'
              }
              color="text-zinc-200"
            />
            <KpiPill
              icon={Clock}
              title={isFr ? 'Temps' : isPt ? 'Tempo' : isEs ? 'Tiempo' : 'Time'}
              value={timeSavedMinutes}
              suffix=" min"
              tooltip={
                isFr
                  ? 'Temps économisé dans votre session actuelle'
                  : isPt
                    ? 'Tempo economizado na sua sessão atual'
                    : isEs
                      ? 'Tiempo ahorrado en tu sesión actual'
                      : 'Time saved in current session'
              }
              color="text-zinc-200"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function KpiPill({
  icon: Icon,
  title,
  value,
  decimals = 0,
  suffix = '',
  tooltip,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tooltip?: string;
  color?: string;
}) {
  return (
    <div className="relative group/kpi">
      <div
        className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 hover:border-white rounded-full transition-all cursor-help font-mono shadow-sm"
        role="status"
        aria-label={`${title}: ${value}${suffix}${tooltip ? ` — ${tooltip}` : ''}`}
      >
        <Icon className={`w-3.5 h-3.5 ${color || 'text-white'}`} aria-hidden="true" />
        <span className="text-xs font-bold text-white">
          <AnimatedCounter to={value} decimals={decimals} suffix={suffix} />
        </span>
        <span className="text-[10px] text-zinc-300 font-bold uppercase">{title}</span>
      </div>

      {tooltip && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-xl text-[10px] font-mono text-zinc-100 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-200 pointer-events-none shadow-2xl whitespace-nowrap z-50"
          aria-hidden="true"
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

function TableRow({
  name,
  size,
  action,
  status,
  icon: Icon,
}: {
  name: string;
  size: string;
  action: string;
  status: string;
  icon: React.ElementType;
}) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const isPt = lang === 'pt';
  const isFr = lang === 'fr';

  return (
    <tr className="border-b border-zinc-700/80 hover:bg-zinc-800/40 transition-colors group">
      <td className="py-3.5 pl-2">
        <div className="flex items-center gap-3">
          <div
            className="p-2 bg-zinc-800 rounded-xl border border-zinc-600 group-hover:border-zinc-400 transition-colors text-white shadow-sm"
            aria-hidden="true"
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans font-semibold text-xs text-white group-hover:text-white transition-colors">
            {name}
          </span>
        </div>
      </td>
      <td className="py-3.5 text-zinc-300 text-xs font-mono">{size}</td>
      <td className="py-3.5 text-zinc-300 text-xs font-mono">{action}</td>
      <td className="py-3.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-white" aria-hidden="true" /> {status}
        </span>
      </td>
      <td className="py-3.5 pr-2 text-right">
        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label={
              isFr
                ? `Ajouter ${name} aux favoris`
                : isPt
                  ? `Adicionar ${name} aos favoritos`
                  : isEs
                    ? `Añadir ${name} a favoritos`
                    : `Add ${name} to favorites`
            }
          >
            <Star className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label={
              isFr
                ? `Aperçu de ${name}`
                : isPt
                  ? `Pré-visualização de ${name}`
                  : isEs
                    ? `Vista previa de ${name}`
                    : `Preview ${name}`
            }
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label={
              isFr
                ? `Télécharger ${name}`
                : isPt
                  ? `Baixar ${name}`
                  : isEs
                    ? `Descargar ${name}`
                    : `Download ${name}`
            }
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label={
              isFr
                ? `Supprimer ${name}`
                : isPt
                  ? `Excluir ${name}`
                  : isEs
                    ? `Eliminar ${name}`
                    : `Delete ${name}`
            }
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
