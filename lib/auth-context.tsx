"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type User, USER_MAPPING, type UserEmail } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getUserInfo: (email: string) => { name: string; avatar: string; color: string } | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userInfo = getUserInfo(session.user.email!)
        if (userInfo) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: userInfo.name,
            avatar: userInfo.avatar
          })
        }
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (session?.user) {
          const userInfo = getUserInfo(session.user.email!)
          if (userInfo) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: userInfo.name,
              avatar: userInfo.avatar
            })
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const getUserInfo = (email: string) => {
    return USER_MAPPING[email as UserEmail] || null
  }

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.warn('Session check error:', error)
        return null
      }
      return session
    } catch (error) {
      console.warn('Session check failed:', error)
      return null
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    console.log('Starting sign out process...')
    setLoading(true)
    
    try {
      // Check if there's an active session before attempting to sign out
      const session = await checkSession()
      
      if (session) {
        console.log('Active session found, attempting to sign out...')
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.warn('Sign out error:', error)
        } else {
          console.log('Successfully signed out from server')
        }
      } else {
        console.log('No active session found, clearing local state only')
      }
      
      // Always clear the local user state, regardless of server response
      setUser(null)
      console.log('Local user state cleared')
    } catch (error) {
      // If there's an error (like "Auth session missing"), just clear the local state
      console.warn('Sign out error:', error)
      setUser(null)
      console.log('Local user state cleared after error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut, 
      getUserInfo,
      isAuthenticated: !!user 
    }}>
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