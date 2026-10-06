const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

function getAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Firebase tools config not found at: ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error('No access_token found in firebase-tools.json');
  }
  return token;
}

async function translateTexts(texts, targetLang = 'pt') {
  const token = getAccessToken();
  const body = JSON.stringify({
    q: texts,
    target: targetLang,
    format: 'text',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://translation.googleapis.com/language/translate/v2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Goog-User-Project': 'pdfblack-proy',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const results = parsed.data.translations.map((t) => t.translatedText);
              resolve(results);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`GCP Translate API Error HTTP ${res.statusCode}: ${data}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('--- Probando Google Cloud Translation API en proyecto pdfblack-proy ---');
  const sample = [
    'Unir PDF para Licitaciones y Trámites Públicos — Gratis y 100% Local',
    'Consolida ofertas técnicas, declaraciones juradas, anexos y garantías en un único expediente PDF continuo conforme a los requisitos de contratación pública.',
    '100% Memoria RAM local. Propuestas comerciales nunca salen de tu PC.',
    '¿Se pueden foliar las páginas después de unirlas?',
  ];

  const translated = await translateTexts(sample, 'pt');
  console.log('Resultados traducidos al Portugués (PT-BR):');
  translated.forEach((t, i) => {
    console.log(`[${i + 1}] Original:   ${sample[i]}`);
    console.log(`    Traducido:  ${t}\n`);
  });
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
