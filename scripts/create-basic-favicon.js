#!/usr/bin/env node

/**
 * Script para crear un favicon.ico básico sin dependencias externas
 */

const fs = require('fs');
const path = require('path');

// Crear un pequeño archivo ICO básico (16x16 azul)
const faviconPath = path.join(__dirname, '../public/favicon.ico');

// Generar buffer básico para un favicon
// Cabecera ICO + una imagen de 16x16 en formato BMP con color azul
const buffer = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 
  0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x68, 0x04, 
  0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 
  0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Rellenar el resto del buffer con color azul #2563EB (formato BGRA)
const pixelData = Buffer.alloc(16 * 16 * 4); // 16x16 píxeles, 4 bytes por píxel (RGBA)
for (let i = 0; i < 16 * 16; i++) {
  const offset = i * 4;
  pixelData[offset] = 0xEB; // B
  pixelData[offset + 1] = 0x63; // G
  pixelData[offset + 2] = 0x25; // R
  pixelData[offset + 3] = 0xFF; // A (opacidad)
}

// Combinar cabecera y datos de píxeles
const finalBuffer = Buffer.concat([buffer, pixelData]);

// Escribir el archivo
fs.writeFileSync(faviconPath, finalBuffer);
console.log(`Favicon básico creado en: ${faviconPath}`);

// Ejecuta este script con: node scripts/create-basic-favicon.js 