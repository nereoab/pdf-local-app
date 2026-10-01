/**
 * Generador de sellos oficiales de alta resolución para documentos PDF
 */

export function createStampDataUrl(
  type: 'APPROVED' | 'CONFIDENTIAL' | 'REVIEWED' | 'DRAFT' | 'PAID',
  lang: 'es' | 'en' = 'es',
): string {
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Configuración según tipo
  const configs: Record<string, { text: string; subtext: string; color: string; angle: number }> = {
    APPROVED: {
      text: lang === 'es' ? 'APROBADO' : 'APPROVED',
      subtext: lang === 'es' ? 'DOCUMENTO OFICIAL' : 'OFFICIAL DOCUMENT',
      color: '#16A34A', // Emerald/Green
      angle: -0.12,
    },
    CONFIDENTIAL: {
      text: lang === 'es' ? 'CONFIDENCIAL' : 'CONFIDENTIAL',
      subtext: lang === 'es' ? 'USO RESTRINGIDO' : 'RESTRICTED USE',
      color: '#DC2626', // Red
      angle: -0.12,
    },
    REVIEWED: {
      text: lang === 'es' ? 'REVISADO' : 'REVIEWED',
      subtext: lang === 'es' ? 'CONTROL DE CALIDAD' : 'QUALITY AUDITED',
      color: '#2563EB', // Blue
      angle: -0.1,
    },
    DRAFT: {
      text: lang === 'es' ? 'BORRADOR' : 'DRAFT',
      subtext: lang === 'es' ? 'NO VINCULANTE' : 'NOT FINAL',
      color: '#D97706', // Amber
      angle: -0.14,
    },
    PAID: {
      text: lang === 'es' ? 'PAGADO' : 'PAID',
      subtext: lang === 'es' ? 'COMPROBANTE VÁLIDO' : 'VALID RECEIPT',
      color: '#059669', // Teal
      angle: -0.08,
    },
  };

  const cfg = configs[type] || configs.APPROVED;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(cfg.angle);

  const rectW = 320;
  const rectH = 95;
  const x = -rectW / 2;
  const y = -rectH / 2;

  // Marco exterior
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(x, y, rectW, rectH, 12);
  ctx.stroke();

  // Marco interior doble
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 6, rectW - 12, rectH - 12, 8);
  ctx.stroke();

  // Texto principal
  ctx.fillStyle = cfg.color;
  ctx.font = '900 36px "Courier New", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText(cfg.text, 0, -8);

  // Subtexto
  ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(cfg.subtext, 0, 22);

  ctx.restore();

  return canvas.toDataURL('image/png');
}
