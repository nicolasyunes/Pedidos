import { createContext, useContext, useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from '@/lib/supabase/client'

interface AuthUser {
  id: string
  email: string
}

const DEMO_USER_KEY = 'pedidos3d_demo_user'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      const raw = window.localStorage.getItem(DEMO_USER_KEY)
      if (raw) {
        try {
          setUser(JSON.parse(raw) as AuthUser)
        } catch {
          window.localStorage.removeItem(DEMO_USER_KEY)
        }
      }
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { id: user.id, email: user.email ?? '' } : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!hasSupabaseConfig || !supabase) {
      if (!email.trim() || !password.trim()) {
        throw new Error('Credenciales requeridas')
      }

      const demoUser = { id: crypto.randomUUID(), email: email.trim() }
      window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (!hasSupabaseConfig || !supabase) {
      window.localStorage.removeItem(DEMO_USER_KEY)
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
