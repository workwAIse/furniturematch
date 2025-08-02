import { NextResponse } from "next/server"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  
  return NextResponse.json({
    supabaseUrl: {
      value: supabaseUrl,
      length: supabaseUrl?.length,
      startsWithQuote: supabaseUrl?.startsWith('"'),
      endsWithQuote: supabaseUrl?.endsWith('"'),
      trimmed: supabaseUrl?.replace(/^"|"$/g, '')
    },
    supabaseKey: {
      value: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : null,
      length: supabaseKey?.length,
      startsWithQuote: supabaseKey?.startsWith('"'),
      endsWithQuote: supabaseKey?.endsWith('"'),
      trimmed: supabaseKey?.replace(/^"|"$/g, '') ? `${supabaseKey.replace(/^"|"$/g, '').substring(0, 20)}...` : null
    },
    firecrawlKey: {
      value: firecrawlKey ? `${firecrawlKey.substring(0, 10)}...` : null,
      length: firecrawlKey?.length,
      startsWithQuote: firecrawlKey?.startsWith('"'),
      endsWithQuote: firecrawlKey?.endsWith('"')
    }
  })
} 