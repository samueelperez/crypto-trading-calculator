"use client"

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { createClientBrowser } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: Error | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  resendVerificationEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  signOut: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  refreshSession: async () => {},
  resendVerificationEmail: async () => {},
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
  initialSession?: Session | null
}

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClientBrowser()

    setIsLoading(true)

    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          setError(error)
          console.error('Error al obtener la sesión:', error)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [initialSession])

  const signOut = async () => {
    setIsLoading(true)
    try {
      const supabase = createClientBrowser()
      await supabase.auth.signOut()
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    error,
    signOut,
    signIn: async (email: string, password: string) => {
      try {
        let result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (result.error && 
            (result.error.message.includes('Email not confirmed') || 
             result.error.message.includes('email not confirmed'))) {
          
          console.log('Detectado error de email no confirmado, intentando método alternativo para desarrollo');
          
          const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
          
          if (!userError && userData) {
            console.log('Usuario encontrado, generando una sesión para desarrollo');
            
            result = await supabase.auth.signInWithPassword({
              email,
              password,
              options: {
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
          
          throw new Error(
            'Email no verificado. En entorno de desarrollo, deberías desactivar la verificación de email en el panel de Supabase: Authentication > Email Templates > Disable email confirmation'
          );
        }
        
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
        
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Error detallado al iniciar sesión:', error);
        throw error;
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este email ya está registrado. Por favor, inicia sesión.');
        }
        
        if (data.user && !data.session) {
          console.log('Usuario registrado pero necesita verificación. En entorno de desarrollo, considera desactivar la verificación de email en el panel de Supabase.');
          
          return {
            requiresEmailConfirmation: true,
            user: data.user,
            devModeMessage: 'Para omitir la verificación en desarrollo, desactiva "Email confirmation" en Supabase Authentication > Email Templates'
          };
        }
        
        if (data.session) {
          console.log('Registro exitoso con inicio de sesión automático');
          router.push('/dashboard');
        }
        
        return data;
      } catch (error: any) {
        console.error('Error detallado al registrarse:', error);
        throw error;
      }
    },
    refreshSession: async () => {
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
    },
    resendVerificationEmail: async (email: string) => {
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
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider 