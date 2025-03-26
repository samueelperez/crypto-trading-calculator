#!/usr/bin/env node

/**
 * Script para limpiar todas las cookies de autenticación de Supabase
 * Útil para resolver problemas de tokens inválidos o expirados
 * 
 * Uso:
 * node scripts/clear-auth-cookies.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Rutas comunes donde se almacenan las cookies en diferentes navegadores
const browserCookiePaths = {
  chrome: {
    darwin: '~/Library/Application Support/Google/Chrome/Default/Cookies',
    linux: '~/.config/google-chrome/Default/Cookies',
    win32: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cookies'
  },
  firefox: {
    darwin: '~/Library/Application Support/Firefox/Profiles/*.default/cookies.sqlite',
    linux: '~/.mozilla/firefox/*.default/cookies.sqlite',
    win32: '%APPDATA%\\Mozilla\\Firefox\\Profiles\\*.default\\cookies.sqlite'
  }
};

// Instrucciones para limpiar manualmente
function showManualInstructions() {
  console.log('\n========== INSTRUCCIONES MANUALES ==========');
  console.log('Para resolver el error 400 con tokens inválidos:');
  console.log('\n1. LIMPIAR COOKIES DEL NAVEGADOR:');
  console.log('   a. Abre DevTools (F12 o Cmd+Opt+I)');
  console.log('   b. Ve a la pestaña "Application" o "Aplicación"');
  console.log('   c. Expande "Cookies" en el panel izquierdo y selecciona tu sitio');
  console.log('   d. Busca y elimina estas cookies:');
  console.log('      - sb-[proyecto-id]-auth-token');
  console.log('      - supabase-auth-token');
  console.log('      - __session');
  console.log('\n2. BORRAR ALMACENAMIENTO LOCAL:');
  console.log('   a. En la misma pestaña "Application"');
  console.log('   b. Expande "Local Storage" y selecciona tu sitio');
  console.log('   c. Elimina cualquier clave relacionada con "supabase" o "auth"');
  console.log('\n3. REINICIAR SERVIDOR DE DESARROLLO:');
  console.log('   a. Detén el servidor Next.js (Ctrl+C)');
  console.log('   b. Inicia de nuevo con "npm run dev" o "yarn dev"');
  console.log('\n4. SOLUCIÓN ALTERNATIVA - MODO INCÓGNITO:');
  console.log('   Prueba a abrir la aplicación en una ventana de incógnito');
  console.log('===================================================');
}

// Intento de limpiar las cookies programáticamente (aviso: limitado)
function tryProgrammaticCleanup() {
  console.log('NOTA: La limpieza programática de cookies tiene limitaciones de seguridad.');
  console.log('En la mayoría de los casos, deberás seguir las instrucciones manuales.');
  
  if (process.platform === 'darwin') {
    console.log('\nPara macOS, puedes intentar:');
    console.log('defaults write com.apple.Safari WebKitStorageBlockingPolicy -int 1');
    console.log('defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2StorageBlockingPolicy -int 1');
  }
}

// Función principal
function main() {
  console.log('=== UTILIDAD DE LIMPIEZA DE TOKENS DE AUTENTICACIÓN ===');
  console.log('Esta herramienta te ayudará a resolver problemas de tokens inválidos');
  console.log('que causan errores 400 en la autenticación de Supabase.');
  
  rl.question('\n¿Quieres ver instrucciones para limpiar cookies manualmente? (s/n): ', (answer) => {
    if (answer.toLowerCase() === 's') {
      showManualInstructions();
    }
    
    rl.question('\n¿Quieres intentar una limpieza programática (experimental)? (s/n): ', (answer2) => {
      if (answer2.toLowerCase() === 's') {
        tryProgrammaticCleanup();
      }
      
      console.log('\nPara resolver problemas persistentes, también puedes probar:');
      console.log('1. node scripts/debug-auth.js check-user tu@email.com');
      console.log('2. node scripts/debug-auth.js confirm-email tu@email.com');
      console.log('3. node scripts/debug-auth.js login tu@email.com password123');
      
      rl.close();
    });
  });
}

main(); 