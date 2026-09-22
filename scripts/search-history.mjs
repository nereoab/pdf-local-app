import fs from 'fs';
import path from 'path';

const query = process.argv.slice(2).join(' ');
if (!query) {
  console.log('Uso: node scripts/search-history.mjs "<termino_a_buscar>"');
  process.exit(1);
}

const brainDir = 'C:/Users/Nereo/.gemini/antigravity-ide/brain';
const regex = new RegExp(query, 'i');

console.log(`Buscando "${query}" en el historial de sesiones...`);

const entries = fs.readdirSync(brainDir, { withFileTypes: true });
let matches = 0;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const wtPath = path.join(brainDir, entry.name, 'walkthrough.md');
  if (fs.existsSync(wtPath)) {
    const content = fs.readFileSync(wtPath, 'utf8');
    if (regex.test(content)) {
      matches++;
      const stats = fs.statSync(wtPath);
      const lines = content.split('\n');
      const matchingLines = lines
        .filter((l) => regex.test(l))
        .slice(0, 3)
        .map((l) => '   -> ' + l.trim());

      console.log(
        `\n📅 [${stats.mtime.toISOString().split('T')[0]}] Sesión: ${entry.name.substring(0, 8)}`,
      );
      console.log(matchingLines.join('\n'));
    }
  }
}

console.log(`\nTotal de sesiones coincidentes: ${matches}`);
