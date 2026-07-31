// Script de prueba para verificar si tesseract-wasm devuelve coordenadas bbox
import { createOCREngine } from 'tesseract-wasm';
import { readFileSync, writeFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

async function main() {
  console.log('⏳ Inicializando Tesseract WASM...');
  const engine = await createOCREngine({ language: 'spa' });
  console.log('✅ Tesseract WASM inicializado.');

  // Cargar PDF igual que en la app
  const pdfPath = process.argv[2] || 'c:/Users/Nereo/Downloads/11- ANALISIS DE PRECIOS UNITARIOS_organized.pdf';
  console.log(`📄 Cargando PDF: ${pdfPath}`);
  const pdfBuffer = readFileSync(pdfPath);

  const pdfjsLib = getDocument;
  const doc = await pdfjsLib({ data: pdfBuffer }).promise;
  console.log(`📑 ${doc.numPages} páginas detectadas.`);

  // Procesar solo página 1
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  console.log('🖼️  Página 1 renderizada.');

  // Pasar imagen a Tesseract
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  console.log(`📊 Tamaño de imagen: ${canvas.width}x${canvas.height}`);

  await engine.loadImage(imageData);
  const text = engine.getText();
  console.log(`📝 Texto extraído: ${text.length} caracteres`);
  console.log(`📝 Primeras 100 letras: "${text.substring(0, 100)}"`);

  // Verificar si hay coordenadas
  const words = engine.getWords ? engine.getWords() : [];
  const lines = engine.getLines ? engine.getLines() : [];

  console.log(`\n🔍 [RESULTADO CLAVE]`);
  console.log(`   getWords(): ${words.length} palabras con coordenadas`);
  console.log(`   getLines(): ${lines.length} líneas con coordenadas`);

  if (words.length > 0) {
    console.log(`\n✅ ¡Tesseract WASM SÍ devuelve coordenadas de palabras!`);
    console.log(`   Primera palabra:`, JSON.stringify(words[0]));
    console.log(`   Segunda palabra:`, JSON.stringify(words[1]));
    console.log(`   Última palabra:`, JSON.stringify(words[words.length - 1]));
  } else if (lines.length > 0) {
    console.log(`\n⚠️  Tesseract WASM devuelve líneas (no palabras). Datos de la primera línea:`);
    console.log(JSON.stringify(lines[0]));
    if (lines[0].words) {
      console.log(`   Palabras dentro de la línea: ${lines[0].words.length}`);
      console.log(`   Primera palabra de la línea:`, JSON.stringify(lines[0].words[0]));
    }
  } else {
    console.log(`\n❌ Tesseract WASM NO devuelve coordenadas.`);
    console.log(`   Métodos disponibles en el engine:`);
    console.log(`   ${Object.getOwnPropertyNames(Object.getPrototypeOf(engine)).join(', ')}`);
  }

  // Verificar la estructura completa del engine
  console.log(`\n📋 Keys del engine: ${Object.keys(engine).join(', ')}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});