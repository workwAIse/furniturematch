import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.SEARCHAPI_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'SEARCHAPI_API_KEY not set',
      status: 'error'
    }, { status: 500 })
  }

  // Test with a simple search
  const testQuery = 'test furniture'
  const params = new URLSearchParams({
    q: testQuery,
    api_key: apiKey,
    engine: 'google',
    gl: 'de',
    hl: 'de',
    num: '1'
  })

  const url = `https://www.searchapi.io/api/v1/search?${params.toString()}`
  
  try {
    console.log(`[TEST_SEARCHAPI] Testing API key: ${apiKey.substring(0, 8)}...`)
    console.log(`[TEST_SEARCHAPI] Test URL: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[TEST_SEARCHAPI] API request failed: ${response.status} ${response.statusText}`)
      console.error(`[TEST_SEARCHAPI] Error response: ${errorText}`)
      
      return NextResponse.json({
        error: `SearchAPI request failed: ${response.status} ${response.statusText}`,
        details: errorText,
        status: 'error'
      }, { status: response.status })
    }

    const data = await response.json()
    
    if (data.error) {
      console.error(`[TEST_SEARCHAPI] SearchAPI error: ${data.error}`)
      return NextResponse.json({
        error: `SearchAPI error: ${data.error}`,
        status: 'error'
      }, { status: 400 })
    }

    console.log(`[TEST_SEARCHAPI] Success! Received ${data.organic_results?.length || 0} results`)
    
    return NextResponse.json({
      success: true,
      results: data.organic_results?.length || 0,
      sampleResult: data.organic_results?.[0] || null,
      status: 'success'
    })

  } catch (error) {
    console.error(`[TEST_SEARCHAPI] Exception:`, error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 })
  }
} 