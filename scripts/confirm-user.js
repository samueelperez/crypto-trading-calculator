#!/usr/bin/env node

/**
 * Script para confirmar manualmente un usuario en Supabase sin verificación de email
 * 
 * Uso: 
 * 1. Asegúrate de tener las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas
 * 2. Ejecuta: node confirm-user.js tu@email.com
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Validar argumentos
const email = process.argv[2];
if (!email) {
  console.error('Por favor proporciona un email como argumento');
  console.error('Uso: node confirm-user.js tu@email.com');
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

async function confirmUser(email) {
  try {
    console.log(`Buscando usuario con email: ${email}`);
    
    // Buscar el usuario por email
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (userError) {
      console.error('Error al buscar usuario:', userError.message);
      process.exit(1);
    }
    
    if (!user) {
      console.error('No se encontró ningún usuario con ese email');
      process.exit(1);
    }
    
    console.log(`Usuario encontrado: ${user.id}`);
    
    // Actualizar el usuario para marcar el email como confirmado
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Error al confirmar el email:', updateError.message);
      process.exit(1);
    }
    
    console.log(`✅ Email confirmado exitosamente para ${email}`);
    
    // También podemos actualizar otros datos si es necesario
    console.log('Actualizando perfil del usuario...');
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: user.id,
        email: email,
        updated_at: new Date(),
        created_at: new Date()
      });
    
    if (profileError) {
      console.warn('Advertencia: No se pudo actualizar el perfil del usuario:', profileError.message);
    } else {
      console.log('✅ Perfil actualizado correctamente');
    }
    
  } catch (error) {
    console.error('Error inesperado:', error.message);
    process.exit(1);
  }
}

confirmUser(email); 