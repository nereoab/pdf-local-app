import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/Nereo/.gemini/antigravity-ide/brain';
const outputRule = 'd:/PROYECTO_PDF/my-app/.agents/rules/project-history-and-memory.md';
const outputFullIndex = 'd:/PROYECTO_PDF/my-app/.agents/PROJECT_MEMORY_INDEX.md';

function getWalkthroughs() {
  if (!fs.existsSync(brainDir)) return [];
  const entries = fs.readdirSync(brainDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const wtPath = path.join(brainDir, entry.name, 'walkthrough.md');
    if (fs.existsSync(wtPath)) {
      const stats = fs.statSync(wtPath);
      const content = fs.readFileSync(wtPath, 'utf8');

      // Filter only walkthroughs that mention PDF, PDFBlack, Word, OCR, or are part of this project
      const isRelevant = /pdf|black|docx|ocr|watermark|foliar|convertir|optimizar/i.test(content);
      if (!isRelevant) continue;

      const lines = content.split('\n');
      const titleLine = lines.find((l) => l.startsWith('# ')) || lines[0] || 'Sin título';
      const cleanTitle = titleLine.replace(/^#+\s*/, '').trim();

      // Extract a 3-line summary
      const summaryLines = lines
        .filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'))
        .slice(0, 3)
        .map((l) => l.replace(/[*_`]/g, '').trim())
        .join(' ');

      results.push({
        id: entry.name,
        date: stats.mtime.toISOString().split('T')[0],
        time: stats.mtime.toISOString().split('T')[1].substring(0, 5),
        title: cleanTitle,
        summary: summaryLines.substring(0, 200),
        filePath: wtPath,
        content: content,
      });
    }
  }

  // Sort chronologically descending
  results.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return results;
}

const sessions = getWalkthroughs();
console.log(`Found ${sessions.length} relevant project sessions.`);

// Build Categorized Index
const categories = {
  'SEO, Indexación, Favicons y Backlinks': [],
  'Herramientas de Conversión (Word, Excel, PPT, Blanco y Negro)': [],
  'Herramientas de Edición (Foliar, Marca de Agua, OCR, Firmar, Texto)': [],
  'Organización y Optimización (Unir, Dividir, Comprimir, Recortar, Proteger)': [],
  'Infraestructura, Firebase, Cloud Run y UI/UX Global': [],
};

for (const s of sessions) {
  const text = (s.title + ' ' + s.summary).toLowerCase();
  if (/backlink|seo|sitemap|meta|bilingüe|hreflang|ranking|google|favicon/i.test(text)) {
    categories['SEO, Indexación, Favicons y Backlinks'].push(s);
  } else if (/convert|word|docx|excel|powerpoint|blanco y negro|grayscale|jpg/i.test(text)) {
    categories['Herramientas de Conversión (Word, Excel, PPT, Blanco y Negro)'].push(s);
  } else if (/ocr|foliar|marca de agua|watermark|firmar|firma|editar texto/i.test(text)) {
    categories['Herramientas de Edición (Foliar, Marca de Agua, OCR, Firmar, Texto)'].push(s);
  } else if (/unir|dividir|comprimir|recortar|proteger|desbloquear|reparar|organizar/i.test(text)) {
    categories['Organización y Optimización (Unir, Dividir, Comprimir, Recortar, Proteger)'].push(
      s,
    );
  } else {
    categories['Infraestructura, Firebase, Cloud Run y UI/UX Global'].push(s);
  }
}

// Write the Full Master Memory Index
let indexMd = `# Índice Maestro de Memoria Histórica del Proyecto PDFBlack ♠️\n\n`;
indexMd += `Este archivo consolida todas las sesiones de trabajo, decisiones técnicas, backlinks, arquitectura e historial de conversaciones de PDFBlack registradas en el entorno local.\n\n`;
indexMd += `> Total de sesiones históricas indexadas: **${sessions.length} sesiones** (Julio 2026 – Septiembre 2026).\n\n---\n\n`;

for (const [catName, list] of Object.entries(categories)) {
  indexMd += `## 📂 ${catName} (${list.length} sesiones)\n\n`;
  indexMd += `| Fecha | Título del Trabajo | Resumen / Logros Clave | ID Sesión |\n`;
  indexMd += `| :--- | :--- | :--- | :--- |\n`;
  for (const item of list) {
    indexMd += `| **${item.date}** | ${item.title} | ${item.summary}... | \`${item.id.substring(0, 8)}\` |\n`;
  }
  indexMd += `\n---\n\n`;
}

fs.writeFileSync(outputFullIndex, indexMd, 'utf8');
console.log(`Wrote full master index to: ${outputFullIndex}`);

// Also update .agents/rules/project-history-and-memory.md with the latest active summary
let ruleMd = fs.readFileSync(outputRule, 'utf8');
if (!ruleMd.includes('## 5. Cronología Resumida de Sesiones Anteriores')) {
  ruleMd += `\n\n## 5. Cronología Resumida de Sesiones Anteriores\n\n`;
  ruleMd += `El proyecto cuenta con más de ${sessions.length} sesiones previas documentadas en \`.agents/PROJECT_MEMORY_INDEX.md\`. Los hitos más recientes son:\n\n`;
  for (const item of sessions.slice(0, 10)) {
    ruleMd += `* **${item.date} (${item.title}):** ${item.summary}...\n`;
  }
  fs.writeFileSync(outputRule, ruleMd, 'utf8');
  console.log(`Updated rule file: ${outputRule}`);
}
