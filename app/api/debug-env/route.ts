import { NextResponse } from "next/server"

export async function GET() {
  const firecrawlApiKey = !!process.env.FIRECRAWL_API_KEY
  const nodeEnv = process.env.NODE_ENV || "development"
  
  console.log(`[DEBUG_ENV] Environment check:`, {
    firecrawlApiKey: firecrawlApiKey,
    nodeEnv: nodeEnv,
    hasApiKey: firecrawlApiKey,
    apiKeyPrefix: firecrawlApiKey ? process.env.FIRECRAWL_API_KEY?.substring(0, 8) + "..." : "not set"
  })
  
  return NextResponse.json({
    firecrawlApiKey,
    nodeEnv,
    timestamp: new Date().toISOString()
  })
} 