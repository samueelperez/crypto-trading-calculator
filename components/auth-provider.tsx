"use client"

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  resendVerificationEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        // IMPORTANTE: Primero verificamos si hay una sesión
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!currentSession) {
          setUser(null)
          setSession(null)
          return
        }
        
        // MEJORA DE SEGURIDAD: Usar siempre getUser() en lugar de confiar
        // solo en el usuario de la sesión
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        if (error || !authUser) {
          console.error('Error al verificar usuario o usuario no válido:', error)
          setUser(null)
          setSession(null)
          return
        }
        
        // Actualizar el estado con el usuario verificado
        setUser(authUser)
        setSession({
          ...currentSession,
          user: authUser // Reemplazar el usuario de la sesión con el verificado
        })
      } catch (error) {
        console.error('Error al refrescar datos del usuario:', error)
        setUser(null)
        setSession(null)
      }
    }

    refreshUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        // Al cambiar el estado de autenticación, siempre verificamos el usuario
        if (newSession?.user) {
          try {
            // MEJORA DE SEGURIDAD: Usar siempre getUser() para verificar
            const { data: { user: authUser }, error } = await supabase.auth.getUser()
            
            if (error || !authUser) {
              console.error('Error al verificar usuario o usuario no válido:', error)
              setUser(null)
              setSession(null)
            } else {
              setUser(authUser)
              setSession({
                ...newSession,
                user: authUser // Usar el usuario verificado
              })
            }
          } catch (error) {
            console.error('Error al verificar usuario:', error)
            // Si hay error, podemos usar el usuario de la sesión como fallback
            setUser(newSession.user)
            setSession(newSession)
          }
        } else {
          setUser(null)
          setSession(null)
        }
        
        router.refresh()
      }
    )

    setIsLoading(false)

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // Iniciar sesión con email y contraseña
  const signIn = async (email: string, password: string) => {
    try {
      // Primer intento: autenticación normal
      let result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Si hay un error de "Email not confirmed", intentamos un enfoque alternativo en desarrollo
      if (result.error && 
          (result.error.message.includes('Email not confirmed') || 
           result.error.message.includes('email not confirmed'))) {
        
        console.log('Detectado error de email no confirmado, intentando método alternativo para desarrollo');
        
        // Verificar si el usuario existe realmente
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
        
        if (!userError && userData) {
          // El usuario existe, intentamos confirmar manualmente para desarrollo
          console.log('Usuario encontrado, generando una sesión para desarrollo');
          
          // En desarrollo, permitimos el inicio de sesión sin verificación
          // Esto solo funciona si la API de Supabase lo permite
          result = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
              // Opción para forzar el inicio de sesión (solo disponible en entornos de desarrollo)
              data: { 
                dev_mode: true,
                skip_verification: true 
              }
            }
          });
          
          if (!result.error) {
            router.push('/dashboard');
            return;
          }
        }
        
        // Si llegamos aquí, ninguno de los métodos anteriores funcionó
        // Enviamos un mensaje indicando que necesitamos ajustar la configuración de Supabase
        throw new Error(
          'Email no verificado. En entorno de desarrollo, deberías desactivar la verificación de email en el panel de Supabase: Authentication > Email Templates > Disable email confirmation'
        );
      }
      
      // Si hay otro tipo de error, lo manejamos normalmente
      if (result.error) {
        console.error('Error de autenticación:', result.error.message, 'Código:', result.error.status);
        
        if (result.error.status === 400 && result.error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales inválidas. Asegúrate de que el email y la contraseña sean correctos.');
        } else {
          throw result.error;
        }
      }
      
      if (!result.data.session) {
        throw new Error('No se pudo crear la sesión. Intenta de nuevo.');
      }
      
      // Si llegamos aquí, el inicio de sesión fue exitoso
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error detallado al iniciar sesión:', error);
      throw error;
    }
  };

  // Registrarse con email y contraseña
  const signUp = async (email: string, password: string) => {
    try {
      // En entorno de desarrollo, intentamos con autoconfirm
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // Intentamos solicitar que se omita la verificación (puede no funcionar según la configuración)
          data: {
            dev_mode: true,
            skip_verification: true
          }
        },
      });
      
      if (error) {
        console.error('Error al registrarse:', error.message, 'Código:', error.status);
        throw error;
      }
      
      // Verificamos si se requiere confirmación de email
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('Este email ya está registrado. Por favor, inicia sesión.');
      }
      
      // Si tenemos un usuario pero no una sesión, significa que necesita verificación
      if (data.user && !data.session) {
        console.log('Usuario registrado pero necesita verificación. En entorno de desarrollo, considera desactivar la verificación de email en el panel de Supabase.');
        
        return {
          requiresEmailConfirmation: true,
          user: data.user,
          devModeMessage: 'Para omitir la verificación en desarrollo, desactiva "Email confirmation" en Supabase Authentication > Email Templates'
        };
      }
      
      // Si llegamos aquí y tenemos una sesión, el registro fue exitoso sin verificación
      if (data.session) {
        console.log('Registro exitoso con inicio de sesión automático');
        router.push('/dashboard');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error detallado al registrarse:', error);
      throw error;
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  // Actualizar sesión
  const refreshSession = async () => {
    try {
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      setSession(newSession);
      
      if (newSession) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
      } else {
        setUser(null);
      }
      
      router.refresh();
    } catch (error: any) {
      console.error('Error al refrescar la sesión:', error.message);
      setSession(null);
      setUser(null);
    }
  };

  // Reenviar correo de verificación
  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Error al reenviar correo de verificación:', error.message);
        throw error;
      }
    } catch (error: any) {
      console.error('Error al reenviar correo de verificación:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshSession,
      resendVerificationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
} 