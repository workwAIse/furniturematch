import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qzrvspbihukeohsgikuh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client if the key is missing (for build time)
const createSupabaseClient = () => {
  if (!supabaseKey) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    // Return a mock client for build time
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') })
      }
    } as any
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export const supabase = createSupabaseClient()

// User types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

// Database types
export interface DatabaseProduct {
  id: string
  url: string
  image: string
  title: string
  description: string
  price?: string
  retailer?: string
  uploaded_by: string // Changed from "user1" | "user2" to string (user ID)
  swipes: {
    [userId: string]: boolean
  }
  product_type: string
  created_at: string
  updated_at: string
}

export interface DatabaseComment {
  id: string
  product_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export type Product = Omit<DatabaseProduct, 'created_at' | 'updated_at'>
export type Comment = DatabaseComment

// User mapping for easy identification
export const USER_MAPPING = {
  'alexander.buechel@posteo.de': { name: 'Alex', avatar: '👨‍💻', color: 'bg-blue-500' },
  'moritz.thiel@outlook.de': { name: 'Moritz', avatar: '👩‍💻', color: 'bg-pink-500' }
} as const

export type UserEmail = keyof typeof USER_MAPPING 