import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test basic Supabase connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    // Test sign in with one of the mapped users
    const testEmail = 'alexander.buechel@posteo.de'
    const testPassword = 'test123' // This should fail, but we want to see the error
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    return NextResponse.json({
      success: true,
      session: {
        hasSession: !!sessionData.session,
        error: sessionError?.message || null
      },
      signIn: {
        success: !!signInData.user,
        error: signInError?.message || null,
        errorCode: signInError?.status || null
      },
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "..."
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
} 