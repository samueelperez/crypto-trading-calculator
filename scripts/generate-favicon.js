#!/usr/bin/env node

/**
 * Script para generar un favicon.ico a partir del icon.svg existente
 * 
 * Ejecución: node scripts/generate-favicon.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verifica si ImageMagick está instalado
function checkImageMagick() {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Función para crear un favicon básico como alternativa
function createBasicFavicon() {
  console.log('Creando un favicon básico predeterminado...');
  
  // Crear un pequeño archivo ICO de 16x16 píxeles con el color #2563EB (azul)
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  
  // Un archivo ICO básico en formato hexadecimal (16x16 azul)
  const basicIconHex = 
    '00000100010010001000100000000000' +
    '2800000010000000200000000100200000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500' +
    'eb632500eb632500eb632500eb632500eb632500eb632500eb632500eb632500';
  
  // Convertir el hexadecimal a un buffer binario
  const buffer = Buffer.from(basicIconHex, 'hex');
  
  // Escribir el archivo
  fs.writeFileSync(faviconPath, buffer);
  console.log(`Favicon básico creado en: ${faviconPath}`);
}

// Función principal
function main() {
  console.log('Generando favicon.ico...');
  
  const publicDir = path.join(__dirname, '../public');
  const iconSvgPath = path.join(publicDir, 'icon.svg');
  const faviconPath = path.join(publicDir, 'favicon.ico');
  
  // Verificar que existe el icon.svg
  if (!fs.existsSync(iconSvgPath)) {
    console.error('Error: No se encontró el archivo icon.svg en la carpeta public');
    process.exit(1);
  }
  
  // Generar el favicon con ImageMagick si está disponible
  if (checkImageMagick()) {
    console.log('Usando ImageMagick para convertir SVG a ICO...');
    try {
      // Convertir SVG a ICO con tamaños 16x16, 32x32, 48x48
      execSync(`convert -background transparent "${iconSvgPath}" -define icon:auto-resize=16,32,48 "${faviconPath}"`);
      console.log(`Favicon generado exitosamente en: ${faviconPath}`);
    } catch (error) {
      console.error('Error al generar el favicon con ImageMagick:', error.message);
      createBasicFavicon();
    }
  } else {
    console.log('ImageMagick no está instalado. Recomendado para mejor calidad.');
    createBasicFavicon();
  }
}

// Ejecutar el script
main(); 