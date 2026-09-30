import fs from 'fs';
import path from 'path';

const appDir = path.resolve('app');

function getFiles(dir, exts = ['.tsx', '.ts', '.js', '.mjs', '.json']) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!['node_modules', '.next', '.git', '.firebase', 'scratch'].includes(file)) {
          results = results.concat(getFiles(filePath, exts));
        }
      } else {
        if (exts.some((ext) => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    }
  } catch (e) {}
  return results;
}

// 1. Gather all legitimate routes in Next.js
const knownValidRoutes = new Set();

// Scan app folder for page files
const pageFiles = getFiles(appDir, ['.tsx', '.ts', '.js']).filter((f) =>
  path.basename(f).startsWith('page.'),
);
for (const pf of pageFiles) {
  let rel = path
    .relative(appDir, pf)
    .replace(/\\/g, '/')
    .replace(/\/page\.(tsx|ts|js)$/, '');
  if (rel === 'page.tsx' || rel === 'page.ts' || rel === 'page.js') rel = '';
  rel = '/' + rel;
  knownValidRoutes.add(rel);
}

// Read routes-config.ts
const routesConfigContent = fs.readFileSync(path.resolve('lib/routes-config.ts'), 'utf-8');
const pathEs = [...routesConfigContent.matchAll(/pathEs:\s*'([^']+)'/g)].map((m) => m[1]);
const pathEn = [...routesConfigContent.matchAll(/pathEn:\s*'([^']+)'/g)].map((m) => m[1]);
pathEs.forEach((p) => knownValidRoutes.add(p));
pathEn.forEach((p) => knownValidRoutes.add(p));

// Add sitemap entries
try {
  const sitemap = fs.readFileSync(path.resolve('public/sitemap.xml'), 'utf-8');
  const urls = [...sitemap.matchAll(/<loc>https:\/\/pdf-black\.com([^<]*)<\/loc>/g)].map(
    (m) => m[1] || '/',
  );
  urls.forEach((u) => knownValidRoutes.add(u));
} catch (e) {}

// Read next.config.ts redirects to know which legacy paths are safely redirected
const nextConfigContent = fs.readFileSync(path.resolve('next.config.ts'), 'utf-8');
const redirectSources = [...nextConfigContent.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]);
const redirectMap = new Map();
const redirectMatches = [
  ...nextConfigContent.matchAll(/source:\s*'([^']+)',\s*destination:\s*'([^']+)'/g),
];
for (const m of redirectMatches) {
  redirectMap.set(m[1], m[2]);
}

// Load long-tail registry slugs
const longTailDir = path.resolve('lib/long-tail');
const ltFiles = fs.readdirSync(longTailDir);
const ltSlugs = new Set();
for (const f of ltFiles) {
  const c = fs.readFileSync(path.join(longTailDir, f), 'utf-8');
  const slugs = [...c.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
  slugs.forEach((s) => ltSlugs.add(s));
}
for (const s of ltSlugs) {
  knownValidRoutes.add(`/soluciones/${s}`);
  knownValidRoutes.add(`/en/solutions/${s}`);
}

console.log(`=== BASELINE ROUTE AUDIT ===`);
console.log(`Total confirmed valid routes: ${knownValidRoutes.size}`);
console.log(`Configured 301 redirects in next.config.ts: ${redirectMap.size}`);

// 2. Scan EVERY file in app/, components/, lib/
const scanDirs = [path.resolve('app'), path.resolve('components'), path.resolve('lib')];
let filesToScan = [];
for (const d of scanDirs) {
  filesToScan = filesToScan.concat(getFiles(d, ['.tsx', '.ts', '.js']));
}

// Extraction patterns
const patterns = [
  /(?:href|to|url|path|src)\s*=\s*["'](\/[^"'#? ]*)["'#? ]/g,
  /(?:href|to|url|path|src)\s*=\s*\{\s*["'](\/[^"'#? ]*)["'#? ]\s*\}/g,
  /(?:href|to|url|path|src)\s*=\s*\{`(\/[^`$#? ]*)`\}/g,
  /router\.(?:push|replace)\(["'](\/[^"'#? ]*)["'#? ]\)/g,
  /redirect\(["'](\/[^"'#? ]*)["'#? ]\)/g,
  /path:\s*["'](\/[^"'#? ]*)["'#? ]/g,
  /["'](\/(?:organizar|optimizar|editar|convertir|en|soluciones|glosario|industrias|alternativas|comparar)\/[a-zA-Z0-9_-]+)["']/g,
];

const foundLinks = new Map();

for (const file of filesToScan) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((lineText, idx) => {
    for (const pat of patterns) {
      const matches = [...lineText.matchAll(new RegExp(pat.source, 'g'))];
      for (const m of matches) {
        let link = m[1];
        if (!link) continue;
        if (
          link.startsWith('/api/') ||
          link.startsWith('/_next') ||
          link.startsWith('/favicon') ||
          link.startsWith('/icon') ||
          link.startsWith('/fonts') ||
          link.startsWith('/webviewer') ||
          link === '/' ||
          link === '#'
        ) {
          continue;
        }
        if (link.includes('${') || link.includes('[') || link.includes(']')) {
          continue;
        }
        if (lineText.includes('prefix') && (link === '/soluciones' || link === '/en/solutions')) {
          continue;
        }
        if (link.length > 1 && link.endsWith('/')) {
          link = link.slice(0, -1);
        }

        const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/');
        if (!foundLinks.has(link)) {
          foundLinks.set(link, []);
        }
        foundLinks.get(link).push({ file: relFile, line: idx + 1, snippet: lineText.trim() });
      }
    }
  });
}

console.log(`Discovered ${foundLinks.size} unique internal links referenced in source code.\n`);

const valid = [];
const redirected = [];
const dead404 = [];

for (const [link, occurrences] of foundLinks.entries()) {
  if (knownValidRoutes.has(link)) {
    valid.push({ link, occurrences });
  } else if (redirectMap.has(link)) {
    redirected.push({ link, destination: redirectMap.get(link), occurrences });
  } else {
    dead404.push({ link, occurrences });
  }
}

console.log('===========================================================');
console.log(`✅ VALID DIRECT LINKS:       ${valid.length}`);
console.log(`🔀 301 REDIRECTED LINKS:     ${redirected.length}`);
console.log(`❌ POTENTIAL 404 DEAD LINKS:  ${dead404.length}`);
console.log('===========================================================\n');

if (dead404.length > 0) {
  console.log('--- ❌ DEAD 404 LINKS FOUND ---');
  for (const d of dead404) {
    console.log(`\n❌ ${d.link} (${d.occurrences.length} instances):`);
    for (const occ of d.occurrences.slice(0, 3)) {
      console.log(`   ${occ.file}:${occ.line} -> ${occ.snippet}`);
    }
  }
}

if (redirected.length > 0) {
  console.log('\n--- 🔀 LINKS REQUIRING 301 REDIRECT (suboptimal, should link direct) ---');
  for (const r of redirected) {
    console.log(`⚠️  ${r.link} ➔ ${r.destination} (${r.occurrences.length} instances)`);
    for (const occ of r.occurrences.slice(0, 2)) {
      console.log(`   ${occ.file}:${occ.line}`);
    }
  }
}
