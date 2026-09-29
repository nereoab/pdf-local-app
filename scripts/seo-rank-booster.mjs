#!/usr/bin/env node
/**
 * SEO Rank Booster & Striking Distance Engine ♠️
 * Identifica oportunidades inmediatas de Primera Página en Google Search Console
 * para PDFBlack (sc-domain:pdf-black.com).
 *
 * Filtra queries en posiciones 1-20 (Primera/Segunda página), detecta anomalías
 * de canibalización de idiomas y calcula el potencial de CTR.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDENTIALS_PATH = path.resolve(__dirname, '../gsc-credentials.json');

async function run() {
  console.log('♠️ Conectando con Google Search Console API...');

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ No se encontró gsc-credentials.json en la raíz del proyecto.');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2); // 2 días atrás (datos consolidados)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const res = await searchconsole.searchanalytics.query({
    siteUrl: 'sc-domain:pdf-black.com',
    requestBody: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query', 'page'],
      rowLimit: 100,
      searchType: 'web',
    },
  });

  const rows = res.data.rows || [];
  console.log(`✅ Obtenidas ${rows.length} combinaciones query/URL de los últimos 28 días.\n`);

  // Clasificar oportunidades
  const page1 = []; // Posición 1-10
  const strikingDistance = []; // Posición 11-25 (a un paso de página 1)
  const languageMismatches = [];

  for (const row of rows) {
    const query = row.keys[0];
    const page = row.keys[1];
    const pos = Math.round(row.position * 10) / 10;
    const clicks = row.clicks;
    const impressions = row.impressions;
    const ctr = (row.ctr * 100).toFixed(1) + '%';

    // Detección de canibalización idiomática (Query española en URL inglesa o viceversa)
    const isSpanishQuery =
      /[áéíóúñ]|como|bajar|quitar|unir|comprimir|editar|convertir|archivo/i.test(query);
    const isEnglishUrl = page.includes('/en/');

    if (isSpanishQuery && isEnglishUrl) {
      languageMismatches.push({ query, page, pos, impressions, ctr });
    }

    if (pos <= 10) {
      page1.push({ query, page, pos, clicks, impressions, ctr });
    } else if (pos <= 25) {
      strikingDistance.push({ query, page, pos, clicks, impressions, ctr });
    }
  }

  console.log('================================================================');
  console.log('  🎯 OPORTUNIDADES EN PRIMERA PÁGINA (TOP 1-10 DE GOOGLE)');
  console.log('================================================================');
  if (page1.length === 0) {
    console.log('No se registraron keywords en Top 10 en la muestra.');
  } else {
    page1.sort((a, b) => b.impressions - a.impressions);
    page1.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. [Pos: ${item.pos}] "${item.query}"`);
      console.log(`   URL: ${item.page}`);
      console.log(
        `   Métricas: ${item.impressions} imp | ${item.clicks} clics | CTR: ${item.ctr}\n`,
      );
    });
  }

  console.log('================================================================');
  console.log('  🚀 DISTANCIA DE TIRO (POSICIONES 11-25 - CANDIDATAS A PÁGINA 1)');
  console.log('================================================================');
  if (strikingDistance.length === 0) {
    console.log('No se registraron keywords en posiciones 11-25.');
  } else {
    strikingDistance.sort((a, b) => b.impressions - a.impressions);
    strikingDistance.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. [Pos: ${item.pos}] "${item.query}"`);
      console.log(`   URL: ${item.page}`);
      console.log(
        `   Métricas: ${item.impressions} imp | ${item.clicks} clics | CTR: ${item.ctr}\n`,
      );
    });
  }

  if (languageMismatches.length > 0) {
    console.log('================================================================');
    console.log('  ⚠️  ALERTA CRÍTICA: CANIBALIZACIÓN IDIOMÁTICA DETECTADA');
    console.log('================================================================');
    console.log('Consultas en español que Google está enviando a URLs /en/:\n');
    languageMismatches.slice(0, 5).forEach((item) => {
      console.log(`- Query: "${item.query}" (Posición: ${item.pos})`);
      console.log(`  URL indexada incorrecta: ${item.page}`);
      console.log(
        '  Solución: Revisar hreflang bidireccional y canonicals en next-sitemap.config.js\n',
      );
    });
  }
}

run().catch((err) => {
  console.error('Error al ejecutar Rank Booster:', err.message);
});
