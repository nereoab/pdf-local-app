import fs from 'fs';
import path from 'path';
import { getServerShareMetadata } from '@/lib/share-server';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Documento Compartido en PDFBlack';

interface Props {
  params: Promise<{ id: string }>;
}

function getToolOgFilename(toolName: string): string {
  const t = (toolName || '').toLowerCase();
  if (t.includes('comprim') || t.includes('compress')) return 'og_compress.png';
  if (t.includes('unir') || t.includes('merge') || t.includes('combin')) return 'og_merge.png';
  if (t.includes('divid') || t.includes('split')) return 'og_split.png';
  if (t.includes('word') && t.includes('pdf')) {
    if (t.startsWith('word') || t.includes('to-pdf')) return 'og_word_to_pdf.png';
    return 'og_pdf_to_word.png';
  }
  if (t.includes('excel')) {
    if (t.startsWith('excel')) return 'og_excel_to_pdf.png';
    return 'og_pdf_to_excel.png';
  }
  if (t.includes('powerpoint') || t.includes('pptx')) {
    if (t.startsWith('powerpoint') || t.startsWith('pptx')) return 'og_pptx_to_pdf.png';
    return 'og_pdf_to_pptx.png';
  }
  if (t.includes('jpg') || t.includes('imagen') || t.includes('image')) {
    if (t.startsWith('jpg') || t.startsWith('image')) return 'og_jpg_to_pdf.png';
    return 'og_pdf_to_jpg.png';
  }
  if (t.includes('text') || t.includes('texto')) {
    if (t.startsWith('text')) return 'og_text_to_pdf.png';
    return 'og_pdf_to_text.png';
  }
  if (t.includes('ocr')) return 'og_ocr.png';
  if (t.includes('proteger') || t.includes('protect') || t.includes('lock'))
    return 'og_protect.png';
  if (t.includes('desbloquear') || t.includes('unlock')) return 'og_unlock.png';
  if (t.includes('firm') || t.includes('sign')) return 'og_sign.png';
  if (t.includes('repar') || t.includes('repair')) return 'og_repair.png';
  if (t.includes('censur') || t.includes('redact')) return 'og_censor.png';
  if (t.includes('compar') || t.includes('compare')) return 'og_compare.png';
  if (t.includes('rotar') || t.includes('rotate')) return 'og_rotate.png';
  if (t.includes('reorden') || t.includes('reorder')) return 'og_reorder.png';
  if (t.includes('elimin') || t.includes('remove') || t.includes('delete'))
    return 'og_remove_pages.png';
  if (t.includes('foliar') || t.includes('bates') || t.includes('numer'))
    return 'og_bates_numbering.png';
  if (t.includes('marca') || t.includes('watermark')) return 'og_watermark.png';
  if (t.includes('blanco') || t.includes('negro') || t.includes('grayscale'))
    return 'og_pdf_grayscale.png';
  return 'og_home.png';
}

export default async function Image({ params }: Props) {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;
  const meta = await getServerShareMetadata(shareId);

  const toolName = meta?.tool || 'Comprimir PDF';
  const ogFilename = getToolOgFilename(toolName);
  const filePath = path.join(process.cwd(), 'public', 'og', ogFilename);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err) {
    console.error('[Share OG Image] Error reading card:', err);
    const fallbackPath = path.join(process.cwd(), 'public', 'og', 'og_home.png');
    const fallbackBuffer = fs.readFileSync(fallbackPath);
    return new Response(fallbackBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
}
