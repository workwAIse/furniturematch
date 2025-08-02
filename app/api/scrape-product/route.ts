import { type NextRequest, NextResponse } from "next/server"
import FirecrawlApp from "firecrawl"

interface ScrapedProduct {
  title: string
  description: string
  image: string
  price?: string
  retailer: string
}

function detectRetailer(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase()
  console.log(`[DETECT_RETAILER] Analyzing hostname: ${hostname}`)
  
  if (hostname.includes("ikea")) return "IKEA"
  if (hostname.includes("wayfair")) return "Wayfair"
  if (hostname.includes("westelm")) return "West Elm"
  if (hostname.includes("cb2")) return "CB2"
  if (hostname.includes("article")) return "Article"
  if (hostname.includes("target")) return "Target"
  if (hostname.includes("amazon")) return "Amazon"
  if (hostname.includes("potterybarn")) return "Pottery Barn"
  if (hostname.includes("crateandbarrel")) return "Crate & Barrel"
  if (hostname.includes("overstock")) return "Overstock"
  if (hostname.includes("homedepot")) return "Home Depot"
  if (hostname.includes("lowes")) return "Lowe's"
  if (hostname.includes("segmueller")) return "Segmüller"
  
  console.log(`[DETECT_RETAILER] No known retailer pattern found, returning "Unknown Retailer"`)
  return "Unknown Retailer"
}

// Enhanced URL analysis for better fallback data
function extractProductInfoFromUrl(url: string): {
  title: string
  retailer: string
  confidence: 'high' | 'medium' | 'low'
} {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname
    
    // Extract retailer
    const retailer = detectRetailer(url)
    
    // Extract product info from URL path
    const segments = pathname.split("/").filter(Boolean)
    let title = "Product"
    let confidence: 'high' | 'medium' | 'low' = 'low'
    
    // Look for product identifiers in URL
    const productPatterns = [
      /\/dp\/([A-Z0-9]{10})/, // Amazon ASIN
      /\/p\/([^\/]+)/, // Generic product pages
      /\/product\/([^\/]+)/, // Product pages
      /\/item\/([^\/]+)/, // Item pages
    ]
    
    for (const pattern of productPatterns) {
      const match = pathname.match(pattern)
      if (match) {
        title = match[1].replace(/[-_]/g, ' ').trim()
        confidence = 'medium'
        break
      }
    }
    
    // Special handling for Amazon URLs - extract from the full path
    if (hostname.includes('amazon')) {
      // Look for product name in the URL path before the ASIN
      const amazonMatch = pathname.match(/\/dp\/[A-Z0-9]{10}\/([^\/\?]+)/)
      if (amazonMatch) {
        title = amazonMatch[1].replace(/[-_]/g, ' ').trim()
        confidence = 'medium'
      } else {
        // Try to extract from segments before the ASIN
        const asinIndex = segments.findIndex(seg => /^[A-Z0-9]{10}$/.test(seg))
        if (asinIndex > 0) {
          const productSegments = segments.slice(0, asinIndex)
          if (productSegments.length > 0) {
            title = productSegments.join(' ').replace(/[-_]/g, ' ').trim()
            confidence = 'medium'
          }
        }
      }
    }
    
    // If no pattern match, use last meaningful segment
    if (confidence === 'low' && segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      if (lastSegment && lastSegment.length > 3) {
        title = lastSegment
          .replace(/[-_]/g, ' ')
          .replace(/\.(html|php|aspx?)$/i, '')
          .split(' ')
          .filter(word => word.length > 2)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .trim()
        confidence = 'medium'
      }
    }
    
    // Clean up title - remove common generic words
    title = title || "Product"
    title = title.replace(/\b(amazon|product|item|page)\b/gi, '').trim()
    title = title.replace(/\s+/g, ' ').trim()
    
    // If title is still too generic, try to extract from URL path more aggressively
    if (title === "Product" || title.length < 3) {
      const allSegments = pathname.split('/').filter(seg => seg.length > 2)
      if (allSegments.length > 0) {
        title = allSegments.join(' ').replace(/[-_]/g, ' ').trim()
        title = title.replace(/\b(amazon|product|item|page)\b/gi, '').trim()
        if (title.length > 3) {
          confidence = 'low'
        }
      }
    }
    
    return { title: title || "Product", retailer, confidence }
  } catch (error) {
    return { title: "Product", retailer: "Unknown", confidence: 'low' }
  }
}

// Generic error detection for any blocked site
function detectScrapingFailure(extraction: any): {
  isBlocked: boolean
  reason: string
  canRetry: boolean
  hasGenericData: boolean
} {
  const error = extraction.error || ''
  const data = extraction.data || {}
  
  // Check for empty or invalid data
  if (!data || Object.keys(data).length === 0) {
    return { isBlocked: true, reason: 'No data extracted', canRetry: false, hasGenericData: false }
  }
  
  // Check for generic/empty data that indicates blocking
  const title = data.title || ''
  const description = data.description || ''
  const image = data.image || ''
  
  // Detect generic data patterns
  const isGenericTitle = title === 'Amazon.de' || title === 'Amazon.com' || 
                        title === 'Product' || title === 'Furniture Item' ||
                        title.toLowerCase().includes('amazon')
  
  const isEmptyData = !description.trim() && !image.trim() && (isGenericTitle || !title.trim())
  
  if (isEmptyData || isGenericTitle) {
    return { 
      isBlocked: true, 
      reason: 'Generic/empty data extracted - likely blocked', 
      canRetry: false, 
      hasGenericData: true 
    }
  }
  
  // Check for generic error messages
  if (error.includes('blocked') || error.includes('forbidden') || 
      error.includes('403') || error.includes('429')) {
    return { isBlocked: true, reason: 'Access blocked', canRetry: false, hasGenericData: false }
  }
  
  // Check for timeout errors
  if (error.includes('timeout') || error.includes('timed out')) {
    return { isBlocked: false, reason: 'Connection timeout', canRetry: true, hasGenericData: false }
  }
  
  // Check for network errors
  if (error.includes('network') || error.includes('connection')) {
    return { isBlocked: false, reason: 'Network error', canRetry: true, hasGenericData: false }
  }
  
  return { isBlocked: false, reason: 'Unknown error', canRetry: true, hasGenericData: false }
}

// Simple retry logic
async function scrapeWithRetry(url: string, maxAttempts = 2): Promise<ScrapedProduct> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[SCRAPE] Attempt ${attempt}/${maxAttempts}`)
      const result = await scrapeProductInfoWithFirecrawl(url)
      
      // Check if we got meaningful data
      if (result.title && result.title !== 'Product') {
        return result
      }
      
      // If we got generic data, try again
      if (attempt < maxAttempts) {
        console.log(`[SCRAPE] Got generic data, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    } catch (error) {
      console.log(`[SCRAPE] Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error))
      if (attempt === maxAttempts) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw new Error('All scraping attempts failed')
}

async function scrapeProductInfoWithFirecrawl(url: string): Promise<ScrapedProduct> {
  console.log(`[FIRECRAWL] Starting extraction for URL: ${url}`)
  
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.error(`[FIRECRAWL] No API key available`)
    const fallback = extractProductInfoFromUrl(url)
    return {
      title: fallback.title,
      description: `Product from ${fallback.retailer}. Information extracted from URL.`,
      image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(fallback.title)}`,
      price: undefined,
      retailer: fallback.retailer
    }
  }
  
  console.log(`[FIRECRAWL] API key found: ${apiKey.substring(0, 8)}...`)
  
  const firecrawl = new FirecrawlApp({ apiKey })
  
  try {
    console.log(`[FIRECRAWL] Initializing extraction with schema...`)
    
    const extraction = await firecrawl.extract([url], {
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          price: { type: "string" },
          image: { type: "string" },
          retailer: { type: "string" }
        },
        required: ["title", "description", "image", "retailer"]
      }
    })
    
    console.log(`[FIRECRAWL] Extraction response received:`, {
      success: 'success' in extraction ? extraction.success : 'unknown',
      hasData: 'data' in extraction && extraction.data && Object.keys(extraction.data).length > 0,
      dataKeys: 'data' in extraction ? Object.keys(extraction.data || {}) : [],
      error: 'error' in extraction ? extraction.error : null,
      fullResponse: extraction
    })
    
    // Check for scraping failure
    const failure = detectScrapingFailure(extraction)
    
    if (failure.isBlocked || failure.hasGenericData) {
      console.log(`[FIRECRAWL] Site blocked or generic data: ${failure.reason}`)
      const fallback = extractProductInfoFromUrl(url)
      return {
        title: fallback.title,
        description: `Product from ${fallback.retailer}. Limited information available - site blocks automated access.`,
        image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(fallback.title)}`,
        price: undefined,
        retailer: fallback.retailer
      }
    }
    
    if ('success' in extraction && extraction.success && extraction.data) {
      const data = extraction.data
      const fallback = extractProductInfoFromUrl(url)
      
      // Check if the scraped data is meaningful
      const hasMeaningfulData = data.title && 
                               data.title !== 'Amazon.de' && 
                               data.title !== 'Amazon.com' &&
                               data.title !== 'Product' &&
                               (data.description || data.image)
      
      if (hasMeaningfulData) {
        return {
          title: data.title || fallback.title,
          description: data.description || `Product from ${fallback.retailer}. Information extracted from URL.`,
          image: data.image || `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(data.title || fallback.title)}`,
          price: data.price || undefined,
          retailer: data.retailer || fallback.retailer
        }
      } else {
        // Use fallback if scraped data is not meaningful
        console.log(`[FIRECRAWL] Scraped data not meaningful, using fallback`)
        return {
          title: fallback.title,
          description: `Product from ${fallback.retailer}. Information extracted from URL.`,
          image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(fallback.title)}`,
          price: undefined,
          retailer: fallback.retailer
        }
      }
    }
    
    // If extraction failed but not blocked, use fallback
    const fallback = extractProductInfoFromUrl(url)
    return {
      title: fallback.title,
      description: `Product from ${fallback.retailer}. Information extracted from URL.`,
      image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(fallback.title)}`,
      price: undefined,
      retailer: fallback.retailer
    }
    
  } catch (error: unknown) {
    console.error(`[FIRECRAWL] Exception:`, error)
    const fallback = extractProductInfoFromUrl(url)
    return {
      title: fallback.title,
      description: `Product from ${fallback.retailer}. Information extracted from URL.`,
      image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(fallback.title)}`,
      price: undefined,
      retailer: fallback.retailer
    }
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 15)
  console.log(`[API:${requestId}] Starting product scraping request`)
  
  try {
    const body = await request.json()
    const { url } = body
    
    console.log(`[API:${requestId}] Request body:`, { url: url ? `${url.substring(0, 50)}...` : 'undefined' })
    
    if (!url) {
      console.error(`[API:${requestId}] ERROR: URL is required`)
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    console.log(`[API:${requestId}] Validating URL format...`)
    try {
      new URL(url)
      console.log(`[API:${requestId}] URL format is valid`)
    } catch (urlError) {
      console.error(`[API:${requestId}] ERROR: Invalid URL format:`, urlError)
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }
    
    console.log(`[API:${requestId}] Starting Firecrawl extraction with retry...`)
    try {
      // Use retry logic
      const productData = await scrapeWithRetry(url)
      console.log(`[API:${requestId}] Successfully extracted product data:`, {
        title: productData.title,
        retailer: productData.retailer,
        hasImage: !!productData.image,
        hasPrice: !!productData.price
      })
      return NextResponse.json(productData)
    } catch (firecrawlError) {
      console.error(`[API:${requestId}] All scraping attempts failed:`, firecrawlError)
      
      // Even if all attempts fail, return fallback data
      const fallback = extractProductInfoFromUrl(url)
      return NextResponse.json({
        title: fallback.title,
        description: `Product from ${fallback.retailer}. Limited information available.`,
        image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(fallback.title)}`,
        price: undefined,
        retailer: fallback.retailer,
        error: firecrawlError instanceof Error ? firecrawlError.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error(`[API:${requestId}] Unexpected error in API handler:`, error)
    console.error(`[API:${requestId}] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({
      error: "Failed to scrape product information",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
      requestId: requestId
    }, { status: 500 })
  }
}
