#!/usr/bin/env node

/**
 * Herramienta para depurar problemas de autenticación en Supabase
 * 
 * Uso:
 * 1. node scripts/debug-auth.js check-user user@example.com
 * 2. node scripts/debug-auth.js confirm-email user@example.com
 * 3. node scripts/debug-auth.js login user@example.com password123
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Validar argumentos
const command = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];

if (!command || !param1) {
  console.error('Uso: node scripts/debug-auth.js [comando] [parámetro1] [parámetro2]');
  console.error('Comandos disponibles:');
  console.error('  check-user [email] - Verificar si un usuario existe y su estado');
  console.error('  confirm-email [email] - Confirmar el email de un usuario para desarrollo');
  console.error('  login [email] [password] - Probar inicio de sesión');
  process.exit(1);
}

// Crear cliente de Supabase con la clave de servicio para acceso administrativo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // IMPORTANTE: Esta es la clave de rol de servicio, no la clave anónima
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Funciones principales
async function checkUser(email) {
  try {
    console.log(`Buscando usuario con email: ${email}`);
    
    // Buscar el usuario por email usando la API administrativa
    const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (error) {
      console.error('Error al buscar usuario:', error.message);
      return;
    }
    
    if (!data) {
      console.log('No se encontró ningún usuario con ese email');
      return;
    }
    
    // Mostrar información del usuario
    console.log('\nInformación del usuario:');
    console.log('------------------------');
    console.log(`ID: ${data.id}`);
    console.log(`Email: ${data.email}`);
    console.log(`Email confirmado: ${data.email_confirmed_at ? 'Sí' : 'No'}`);
    console.log(`Último inicio de sesión: ${data.last_sign_in_at || 'Nunca'}`);
    console.log(`Creado: ${data.created_at}`);
    console.log(`Actualizado: ${data.updated_at}`);
    console.log(`Factores de autenticación: ${data.factors?.length || 0}`);
    
    return data;
  } catch (error) {
    console.error('Error al verificar usuario:', error.message);
  }
}

async function confirmEmail(email) {
  try {
    // Primero obtener el usuario
    const user = await checkUser(email);
    
    if (!user) {
      console.error('No se puede confirmar email: Usuario no encontrado');
      return;
    }
    
    if (user.email_confirmed_at) {
      console.log('El email ya está confirmado.');
      return;
    }
    
    console.log(`\nConfirmando email para el usuario: ${user.id}`);
    
    // Método 1: Usar la función RPC personalizada
    try {
      const { data, error } = await supabaseAdmin.rpc('confirm_user_email_by_address', {
        user_email: email
      });
      
      if (error) {
        console.log('Método RPC falló:', error.message);
        console.log('Intentando método alternativo...');
      } else if (data) {
        console.log('✅ Email confirmado exitosamente mediante RPC');
        return;
      }
    } catch (e) {
      console.log('Función RPC no disponible, intentando método alternativo...');
    }
    
    // Método 2: Actualizar directamente (solo funciona con clave de servicio)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirmed_at: new Date().toISOString() }
    );
    
    if (updateError) {
      console.error('Error al confirmar el email:', updateError.message);
      return;
    }
    
    console.log('✅ Email confirmado exitosamente mediante API de admin');
    
  } catch (error) {
    console.error('Error inesperado al confirmar email:', error.message);
  }
}

async function testLogin(email, password) {
  if (!password) {
    console.error('Se requiere una contraseña para probar el inicio de sesión');
    return;
  }
  
  try {
    console.log(`Probando inicio de sesión para: ${email}`);
    
    // Crear un cliente normal (no admin) para probar el inicio de sesión
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Intentar inicio de sesión
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error al iniciar sesión:', error.message);
      
      // Si el error es de email no confirmado, ofrecer confirmarlo
      if (error.message.includes('Email not confirmed')) {
        console.log('\n¿Deseas confirmar este email automáticamente? (Sólo para desarrollo)');
        console.log('Ejecuta: node scripts/debug-auth.js confirm-email', email);
      }
      
      return;
    }
    
    console.log('✅ Inicio de sesión exitoso');
    console.log('Sesión generada para:', data.user?.email);
    console.log('Expira:', new Date(data.session?.expires_at * 1000).toLocaleString());
  } catch (error) {
    console.error('Error inesperado al probar inicio de sesión:', error.message);
  }
}

// Ejecutar el comando especificado
async function main() {
  switch (command) {
    case 'check-user':
      await checkUser(param1);
      break;
    case 'confirm-email':
      await confirmEmail(param1);
      break;
    case 'login':
      await testLogin(param1, param2);
      break;
    default:
      console.error('Comando desconocido:', command);
      break;
  }
}

main()
  .catch(error => console.error('Error:', error))
  .finally(() => process.exit(0)); 