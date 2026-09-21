import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Tuned spade: scaled to 74% height with perfect centering
// Canvas: 512x512, Center: (256, 256)
const spadePerfect = `
M 256,64
C 244,92 106,220 106,298
C 106,362 160,396 220,378
C 230,375 236,384 234,394
L 212,442
C 209,448 215,454 223,454
L 289,454
C 297,454 303,448 300,442
L 278,394
C 276,384 282,375 292,378
C 352,396 406,362 406,298
C 406,220 268,92 256,64
Z
`.trim();

// 1. Circle design with subtle border for favicons (Google Search, Browser Tabs, Android)
const svgCircleFavicon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="252" fill="#ffffff" stroke="#d4d4d8" stroke-width="8"/>
  <path d="${spadePerfect}" fill="#09090b"/>
</svg>`;

// 2. Full white square design for Apple Touch Icon (iOS requires non-transparent square, iOS rounds the corners automatically)
const svgAppleTouch = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#ffffff"/>
  <path d="${spadePerfect}" fill="#09090b"/>
</svg>`;

// Helper function to build a valid ICO file from an array of PNG buffers with their sizes
function createIco(images) {
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Offset to image data

    offset += img.buffer.length;
    entries.push(entry);
    imageBuffers.push(img.buffer);
  }

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}

async function generateAll() {
  const circleBuf = Buffer.from(svgCircleFavicon);
  const appleBuf = Buffer.from(svgAppleTouch);

  // Generate PNG buffers at various resolutions
  const png16 = await sharp(circleBuf).resize(16, 16).png().toBuffer();
  const png32 = await sharp(circleBuf).resize(32, 32).png().toBuffer();
  const png48 = await sharp(circleBuf).resize(48, 48).png().toBuffer();
  const png192 = await sharp(circleBuf).resize(192, 192).png().toBuffer();
  const png512 = await sharp(circleBuf).resize(512, 512).png().toBuffer();

  // Apple Touch Icon: 180x180 on solid white canvas
  const appleTouchPng = await sharp(appleBuf).resize(180, 180).png().toBuffer();

  // Build ICO containing 16x16, 32x32, 48x48
  const icoBuffer = createIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  // Target paths in public/ and app/
  const targets = [
    { path: 'public/favicon.ico', buffer: icoBuffer },
    { path: 'app/favicon.ico', buffer: icoBuffer },
    { path: 'public/icon.png', buffer: png48 },
    { path: 'app/icon.png', buffer: png48 },
    { path: 'public/icon-192.png', buffer: png192 },
    { path: 'public/icon-512.png', buffer: png512 },
    { path: 'public/apple-touch-icon.png', buffer: appleTouchPng },
  ];

  for (const t of targets) {
    const fullPath = path.resolve(t.path);
    fs.writeFileSync(fullPath, t.buffer);
    console.log(`Updated: ${t.path} (${t.buffer.length} bytes)`);
  }

  console.log('All favicon and app icon files successfully generated!');
}

generateAll().catch(console.error);
