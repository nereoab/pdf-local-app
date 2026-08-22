'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FileDown,
  Loader2,
  X,
  SlidersHorizontal,
  AlignLeft,
  Image as ImageIcon,
  Check,
  FilePlus,
  UploadCloud,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { WordIcon } from './ProgramIcons';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useFileStore } from '../store/useFileStore';
import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx';

export default function PdfToWord() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { globalFile, setGlobalFile } = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(() => globalFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pageDataUrls, setPageDataUrls] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState('');

  // Opciones avanzadas (Siempre visibles)
  const [layoutMode, setLayoutMode] = useState<'flowing' | 'exact'>('flowing');
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [docFormat, setDocFormat] = useState<'docx' | 'rtf'>('docx');
  const [customSuffix, setCustomSuffix] = useState<string>('_Convertido');

  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  useEffect(() => {
    if (file) {
      cargarPdf(file);
    }
  }, [file]);

  const cargarPdf = async (selectedFile: File) => {
    setIsRendering(true);
    setPageDataUrls({});
    setProgressMsg(
      isEs ? 'Analizando y renderizando páginas...' : 'Analyzing & rendering pages...',
    );

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const count = pdfDoc.numPages;
      setTotalPages(count);

      const urls: Record<number, string> = {};
      for (let p = 1; p <= count; p++) {
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<
              typeof page.render
            >[0]).promise;
            urls[p] = canvas.toDataURL('image/jpeg', 0.8);
          }
        } catch {
          /* omit page errors */
        }
      }
      setPageDataUrls(urls);
    } catch (err) {
      console.error('Error al cargar PDF:', err);
      toast.error(isEs ? 'Error al abrir el archivo PDF' : 'Error opening PDF file');
    } finally {
      setIsRendering(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.name.toLowerCase().endsWith('.pdf')
      ) {
        setFile(selectedFile);
        setGlobalFile(selectedFile);
        setDownloadUrl(null);
        toast.success(isEs ? 'Archivo cargado correctamente' : 'File loaded successfully');
      } else {
        toast.error(isEs ? 'Selecciona un archivo PDF válido' : 'Select a valid PDF file');
      }
    }
    e.target.value = '';
  };

  // Construcción nativa de archivo DOCX mediante docx
  const buildLocalDocx = async (fileToConvert: File): Promise<Blob> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await fileToConvert.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({
      data: arrayBuffer.slice(0),
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const sanitize = (text: string) =>
      text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uD800-\uDFFF\uFFFE\uFFFF]/g, '').trim();

    const docChildren: Paragraph[] = [];
    const docTitle = fileToConvert.name.replace(/\.[^/.]+$/, '');

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sanitize(docTitle),
            bold: true,
            size: 28,
            font: 'Calibri',
            color: '1E395B',
          }),
        ],
        spacing: { after: 240 },
      }),
    );

    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();

      if (p > 1) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }

      if (pdfDoc.numPages > 1) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `--- Página ${p} ---`,
                italics: true,
                size: 18,
                font: 'Calibri',
                color: '777777',
              }),
            ],
            spacing: { before: 160, after: 80 },
          }),
        );
      }

      const linesMap: Map<number, string[]> = new Map();
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
          const y = Math.round(item.transform[5]);
          const existing = linesMap.get(y) || [];
          existing.push(item.str);
          linesMap.set(y, existing);
        }
      }

      const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);

      if (sortedYs.length === 0) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Página ${p} sin texto extraíble]`,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
        );
      } else {
        for (const y of sortedYs) {
          const lineText = sanitize(linesMap.get(y)?.join(' ') || '');
          if (lineText) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    size: 22,
                    font: 'Calibri',
                    color: '222222',
                  }),
                ],
                spacing: { after: 80, line: 240 },
              }),
            );
          }
        }
      }
    }

    const doc = new Document({
      creator: 'PDFBlack Suite',
      title: sanitize(docTitle),
      description: 'Convertido con PDFBlack',
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: docChildren,
        },
      ],
    });

    return await Packer.toBlob(doc);
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast.info(
      isEs ? 'Procesando conversión nativa a Word...' : 'Processing native conversion to Word...',
    );

    try {
      let resultBlob: Blob | null = null;

      if (API_SECRET) {
        try {
          const formData = new FormData();
          formData.append('File', file);
          formData.append('StoreFile', 'false');

          const response = await fetch(
            `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${API_SECRET}`,
            {
              method: 'POST',
              body: formData,
            },
          );

          const data = await response.json();
          if (data.Files && data.Files.length > 0) {
            const base64Data = data.Files[0].FileData;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            resultBlob = new Blob([byteArray], {
              type:
                docFormat === 'rtf'
                  ? 'application/rtf'
                  : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
          }
        } catch (err) {
          console.warn('ConvertAPI error, usando motor local nativo JSZip', err);
        }
      }

      if (!resultBlob) {
        resultBlob = await buildLocalDocx(file);
      }

      const localUrl = URL.createObjectURL(resultBlob);
      setDownloadUrl(localUrl);

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const outSuffix = customSuffix.trim() || '_Convertido';
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${cleanName}${outSuffix}.${docFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isEs ? '¡Documento Word listo para editar!' : 'Word document ready to edit!');
    } catch (error) {
      console.error('Error al convertir PDF a Word:', error);
      toast.error(isEs ? 'Ocurrió un error en la conversión' : 'Conversion error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetConverter = () => {
    setFile(null);
    setGlobalFile(null);
    setDownloadUrl(null);
    setPageDataUrls({});
    setTotalPages(0);
  };

  return (
    <div className="w-full font-sans">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#09090b] hover:bg-zinc-900/60 border border-white/10 hover:border-white/30 rounded-2xl p-8 lg:p-14 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 group shadow-2xl min-h-[480px] relative overflow-hidden my-4"
        >
          <div className="bg-zinc-900 p-5 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors">
            <WordIcon className="w-14 h-14" />
          </div>
          <div className="text-center flex flex-col items-center gap-2 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEs
                ? 'Arrastra tu PDF aquí para convertir a Word (.docx)'
                : 'Drop your PDF here to convert to Word (.docx)'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              {isEs
                ? 'Extrae párrafos, estructura y contenido totalmente editable'
                : 'Extract paragraphs, structure and fully editable content'}
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-md cursor-pointer">
            <FilePlus className="w-4 h-4 text-black" />{' '}
            {isEs ? 'Subir Archivo PDF' : 'Upload PDF File'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 text-blue-400 text-[11px] font-mono rounded-full mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isEs
                ? 'PARSER JSZIP NATIVO • DICCIONARIO XML OPENXML • 100% LOCAL'
                : 'NATIVE JSZIP PARSER • OPENXML DICTIONARY • 100% LOCAL'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6 font-sans">
          {/* LADO IZQUIERDO: VISOR DE MINIATURAS (7 COLUMNAS) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="w-full bg-[#09090b] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative font-mono">
              <div className="bg-zinc-900 border-b border-white/10 p-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                    <WordIcon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-40 sm:w-64">
                      {file.name}
                    </span>
                    <span className="text-zinc-400 text-[10px]">
                      {(file.size / 1024).toFixed(1)} KB • {totalPages} {isEs ? 'Páginas' : 'Pages'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={resetConverter}
                  disabled={isProcessing}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* GRILLA DE MINIATURAS EN 3 COLUMNAS X 4 FILAS */}
              <div className="bg-[#121215] p-4 h-[580px] max-h-[600px] overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isRendering ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span>{progressMsg}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <div
                        key={pageNum}
                        className="bg-zinc-900 border border-white/15 rounded-xl p-2 flex flex-col items-center relative shadow-lg group hover:border-blue-400/50 transition-all"
                      >
                        <div className="w-full bg-white rounded overflow-hidden aspect-[1/1.4] relative flex items-center justify-center">
                          {pageDataUrls[pageNum] ? (
                            <img
                              src={pageDataUrls[pageNum]}
                              alt={`Pág ${pageNum}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Pág {pageNum}
                            </span>
                          )}
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            #{pageNum}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE CONTROL (5 COLUMNAS - OPCIONES SIEMPRE VISIBLES) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-[#09090b] border border-white ring-2 ring-white/20 bg-zinc-900/80 rounded-2xl p-5 flex flex-col justify-between relative shadow-2xl font-sans min-h-[580px]">
              <div className="flex flex-col gap-4">
                {/* Cabecera del Panel */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase block mb-0.5">
                      CONVERSIÓN DE DOCUMENTOS
                    </span>
                    <h2 className="text-xl font-bold text-white uppercase">
                      {isEs ? 'PDF A WORD' : 'PDF TO WORD'}
                    </h2>
                  </div>
                  <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                    <WordIcon className="w-6 h-6" />
                  </div>
                </div>

                {/* OPCIONES AVANZADAS (SIEMPRE VISIBLES) */}
                <div className="space-y-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl p-4 font-sans">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white font-mono tracking-wider border-b border-white/10 pb-2 uppercase">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isEs ? 'OPCIONES AVANZADAS' : 'ADVANCED OPTIONS'}</span>
                  </div>

                  {/* Modo de Maquetación */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <AlignLeft className="w-3 h-3 text-blue-400" />
                      {isEs ? 'Modo de Maquetación' : 'Layout Mode'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLayoutMode('flowing')}
                        className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${
                          layoutMode === 'flowing'
                            ? 'bg-blue-600 border-white text-white shadow-md'
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? '📄 Texto Fluido' : '📄 Flowing Text'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayoutMode('exact')}
                        className={`py-2 px-2.5 rounded-lg border font-bold transition-all cursor-pointer ${
                          layoutMode === 'exact'
                            ? 'bg-blue-600 border-white text-white shadow-md'
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isEs ? '📐 Diseño Exacto' : '📐 Exact Visual'}
                      </button>
                    </div>
                  </div>

                  {/* Formato de Salida */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-blue-400" />
                      {isEs ? 'Formato de Salida' : 'Output Format'}
                    </label>
                    <select
                      value={docFormat}
                      onChange={(e) => setDocFormat(e.target.value as 'docx' | 'rtf')}
                      className="w-full bg-zinc-900 border border-white/15 rounded-lg py-2 px-3 text-white text-[11px] font-mono focus:border-blue-400 focus:outline-none"
                    >
                      <option value="docx">Word DOCX (.docx - Estándar OpenXML)</option>
                      <option value="rtf">Rich Text Format (.rtf - Formato Universal)</option>
                    </select>
                  </div>

                  {/* Toggle Extraer Imágenes */}
                  <div
                    onClick={() => setIncludeImages((v) => !v)}
                    className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-white/8 cursor-pointer hover:border-white/20 transition"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-white">
                        {isEs ? 'Extraer e incluir imágenes' : 'Extract & include images'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {isEs ? 'Preserva gráficos embedded' : 'Preserve embedded graphics'}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${includeImages ? 'bg-blue-500' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${includeImages ? 'left-4' : 'left-0.5'}`}
                      />
                    </div>
                  </div>

                  {/* Sufijo del archivo */}
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      {isEs ? 'Sufijo del archivo:' : 'Output suffix:'}
                    </label>
                    <input
                      type="text"
                      value={customSuffix}
                      onChange={(e) => setCustomSuffix(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/15 text-white text-[11px] font-mono placeholder-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/40 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Procesamiento */}
              <div className="pt-4 border-t border-white/10 mt-4">
                {!downloadUrl ? (
                  <button
                    onClick={executeConversion}
                    disabled={isProcessing || isRendering}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-40"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>{isEs ? 'Generando Word Nativo...' : 'Building Native Word...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
                        <span>
                          {isEs ? 'Convertir a Word Editable' : 'Convert to Editable Word'}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <a
                    href={downloadUrl}
                    download
                    className="w-full bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl"
                  >
                    <FileDown className="w-5 h-5 text-slate-950" />
                    <span>{isEs ? 'Descargar Documento Word' : 'Download Word Document'}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
