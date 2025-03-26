#!/usr/bin/env node

/**
 * Script para configurar Supabase en modo de desarrollo
 * - Deshabilita temporalmente la confirmación de email
 * - Soluciona problemas de registro con errores 500
 * 
 * IMPORTANTE: Solo para uso en desarrollo. No usar en producción.
 * 
 * Uso:
 * 1. Asegúrate de tener configuradas las variables de entorno en .env:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY (la clave de servicio, no la anon key)
 * 
 * 2. Ejecuta: node scripts/disable-email-confirmation.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// URL y clave de servicio desde variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: Variables de entorno no configuradas.');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  process.exit(1);
}

// Función para obtener la configuración actual de autenticación
async function getAuthSettings() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener configuración: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al consultar configuración:', error);
    return null;
  }
}

// Función para actualizar la configuración de autenticación
async function updateAuthSettings(config) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error(`Error al actualizar configuración: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return null;
  }
}

// Función para crear una SQL personalizada que confirma automáticamente los emails
async function createAutoConfirmTrigger() {
  const sql = `
-- Trigger para confirmar automáticamente los emails de nuevos usuarios
-- SOLO PARA ENTORNOS DE DESARROLLO

-- Primero comprobamos si la función ya existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_confirm_email') THEN
    -- Crear la función que actualizará email_confirmed_at
    CREATE OR REPLACE FUNCTION public.auto_confirm_email()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Confirmar el email automáticamente solo si aún no está confirmado
      UPDATE auth.users
      SET email_confirmed_at = NOW()
      WHERE id = NEW.id AND email_confirmed_at IS NULL;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Crear el trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_confirm_email();
      
    RAISE NOTICE 'Trigger de auto-confirmación de email creado correctamente';
  ELSE
    RAISE NOTICE 'El trigger de auto-confirmación ya existe';
  END IF;
END
$$;
  `;
  
  try {
    // Esta parte requeriría acceso a la base de datos directamente
    // lo cual no es posible desde la API REST de Supabase
    console.log('Para crear el trigger SQL, sigue estos pasos:');
    console.log('1. Ve al panel de Supabase (https://app.supabase.com)');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a "SQL Editor"');
    console.log('4. Crea una nueva consulta y pega el siguiente SQL:');
    console.log('\n----------------------------');
    console.log(sql);
    console.log('----------------------------\n');
    console.log('5. Ejecuta la consulta');
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('=== Herramienta de configuración de Supabase para desarrollo ===');
  console.log('Esta herramienta te ayudará a resolver problemas de registro (errores 500)');
  console.log('al deshabilitar temporalmente requisitos de confirmación de email.\n');
  
  // Advertencia importante
  console.log('⚠️  ADVERTENCIA: SOLO PARA ENTORNOS DE DESARROLLO');
  console.log('   No utilices esta configuración en producción ya que reduce la seguridad.\n');
  
  // Obtener configuración actual
  console.log('Obteniendo configuración actual de autenticación...');
  const currentConfig = await getAuthSettings();
  
  if (!currentConfig) {
    console.error('No se pudo obtener la configuración actual. Verifica tus credenciales.');
    process.exit(1);
  }
  
  console.log('\nConfiguración actual:');
  console.log(`- Confirmación de email requerida: ${currentConfig.MAILER_AUTOCONFIRM ? 'No' : 'Sí'}`);
  console.log(`- Proveedor de correo: ${currentConfig.MAILER_PROVIDER || 'No configurado'}`);
  console.log(`- URL de redirección: ${currentConfig.SITE_URL || 'No configurado'}`);
  
  if (currentConfig.MAILER_AUTOCONFIRM) {
    console.log('\n✅ La confirmación de email ya está deshabilitada.');
    console.log('Si sigues teniendo problemas, puede ser necesario:');
    console.log('1. Verificar la configuración del proveedor de correo');
    console.log('2. Crear un trigger SQL para confirmar automáticamente los emails');
  } else {
    rl.question('\n¿Quieres deshabilitar la confirmación de email para desarrollo? (s/n): ', async (answer) => {
      if (answer.toLowerCase() === 's') {
        // Crear una copia del objeto de configuración
        const newConfig = { ...currentConfig };
        
        // Cambiar a modo auto-confirmación
        newConfig.MAILER_AUTOCONFIRM = true;
        
        console.log('\nActualizando configuración...');
        const result = await updateAuthSettings(newConfig);
        
        if (result) {
          console.log('✅ Configuración actualizada correctamente');
          console.log('Ahora los usuarios se registrarán sin necesidad de confirmar email');
        } else {
          console.error('❌ Error al actualizar la configuración');
        }
      }
      
      // Ofrecer crear el trigger SQL
      rl.question('\n¿Quieres ver el SQL para crear un trigger de auto-confirmación? (s/n): ', async (answer) => {
        if (answer.toLowerCase() === 's') {
          await createAutoConfirmTrigger();
        }
        
        console.log('\nResumen de acciones recomendadas para resolver errores 500:');
        console.log('1. Verifica que tu proyecto tenga un proveedor de correo configurado en Supabase');
        console.log('2. Si estás en desarrollo, deshabilita la confirmación de email como se indicó');
        console.log('3. Alternativamente, confirma manualmente los emails con:');
        console.log('   node scripts/debug-auth.js confirm-email usuario@example.com');
        console.log('4. Si el problema persiste, contacta al soporte de Supabase');
        
        rl.close();
      });
    });
  }
}

// Ejecutar el script
main().catch(error => {
  console.error('Error inesperado:', error);
  process.exit(1);
}); 