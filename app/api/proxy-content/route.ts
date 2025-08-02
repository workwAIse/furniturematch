import { type NextRequest, NextResponse } from "next/server"
import * as puppeteer from "puppeteer"

interface ProxyResponse {
  success: boolean
  content?: string
  contentType?: string
  error?: string
  isBlocked?: boolean
  fallbackData?: {
    title: string
    retailer: string
    url: string
  }
  method?: 'fetch' | 'puppeteer' | 'fallback'
}

// Enhanced retailer detection for better user agent selection
function getOptimalUserAgent(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase()
  
  // Mobile user agents that are more likely to be allowed
  const mobileUserAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  ]
  
  // Desktop user agents for sites that prefer desktop
  const desktopUserAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]
  
  // Sites that typically work better with mobile user agents
  const mobileFriendlySites = ['ikea', 'wayfair', 'amazon', 'target', 'kare']
  
  if (mobileFriendlySites.some(site => hostname.includes(site))) {
    return mobileUserAgents[Math.floor(Math.random() * mobileUserAgents.length)]
  }
  
  return desktopUserAgents[Math.floor(Math.random() * desktopUserAgents.length)]
}

// Enhanced headers for different retailers
function getCustomHeaders(url: string): Record<string, string> {
  const hostname = new URL(url).hostname.toLowerCase()
  
  const baseHeaders = {
    'User-Agent': getOptimalUserAgent(url),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
  
  // Retailer-specific headers
  if (hostname.includes('ikea')) {
    return {
      ...baseHeaders,
      'Referer': 'https://www.google.com/',
      'Sec-Fetch-Site': 'cross-site'
    }
  }
  
  if (hostname.includes('kare')) {
    return {
      ...baseHeaders,
      'Referer': 'https://www.google.com/',
      'Sec-Fetch-Site': 'cross-site',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    }
  }
  
  if (hostname.includes('wayfair')) {
    return {
      ...baseHeaders,
      'Referer': 'https://www.google.com/',
      'X-Requested-With': 'XMLHttpRequest'
    }
  }
  
  if (hostname.includes('amazon')) {
    return {
      ...baseHeaders,
      'Referer': 'https://www.amazon.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    }
  }
  
  return baseHeaders
}

// Process HTML content to make it iframe-friendly
function processHtmlContent(html: string, originalUrl: string): string {
  const url = new URL(originalUrl)
  const baseUrl = `${url.protocol}//${url.host}`
  
  // Remove problematic meta tags and scripts
  let processedHtml = html
    .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '')
    .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
    .replace(/<script[^>]*src=["']\/\//gi, '<script src="https://')
    .replace(/<link[^>]*href=["']\/\//gi, '<link href="https://')
    .replace(/<img[^>]*src=["']\/\//gi, '<img src="https://')
  
  // Add base tag to resolve relative URLs
  if (!processedHtml.includes('<base')) {
    processedHtml = processedHtml.replace(
      '<head>',
      `<head><base href="${baseUrl}/">`
    )
  }
  
  // Remove any remaining CSP headers
  processedHtml = processedHtml.replace(
    /content-security-policy[^>]*>/gi,
    ''
  )
  
  return processedHtml
}

// Puppeteer browser automation
async function fetchWithPuppeteer(url: string): Promise<{ success: boolean; content?: string; error?: string }> {
  let browser: puppeteer.Browser | null = null
  
  try {
    console.log(`[PUPPETEER] Starting browser automation for: ${url}`)
    
    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      ]
    })
    
    const page = await browser.newPage()
    
    // Set viewport to mobile size for better compatibility
    await page.setViewport({ width: 375, height: 667, isMobile: true })
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    })
    
    // Navigate to the page with timeout
    console.log(`[PUPPETEER] Navigating to page...`)
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    })
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get the page content
    const content = await page.content()
    
    console.log(`[PUPPETEER] Successfully fetched content (${content.length} chars)`)
    
    return { success: true, content }
    
  } catch (error) {
    console.error(`[PUPPETEER] Error:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Puppeteer failed' 
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function fetchWithRetry(url: string, maxAttempts = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[FETCH] Attempt ${attempt}/${maxAttempts} for ${url}`)
      
      const headers = getCustomHeaders(url)
      const response = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })
      
      if (response.ok) {
        return response
      }
      
      // If we get a 403/429, try with different headers
      if (response.status === 403 || response.status === 429) {
        console.log(`[FETCH] Got ${response.status}, trying different approach...`)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
      }
      
      return response
    } catch (error) {
      console.log(`[FETCH] Attempt ${attempt} failed:`, error)
      if (attempt === maxAttempts) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw new Error('All fetch attempts failed')
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 15)
  console.log(`[PROXY:${requestId}] Starting enhanced proxy request`)
  
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }
    
    console.log(`[PROXY:${requestId}] Processing URL: ${url}`)
    
    // Method 1: Try regular fetch first
    try {
      console.log(`[PROXY:${requestId}] Attempting regular fetch...`)
      const response = await fetchWithRetry(url)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        const content = await response.text()
        
        // Check if content is meaningful
        if (content.length >= 1000) {
          // Process HTML content
          const processedContent = contentType.includes('text/html') 
            ? processHtmlContent(content, url)
            : content
          
          console.log(`[PROXY:${requestId}] Fetch successful (${processedContent.length} chars)`)
          
          return NextResponse.json({
            success: true,
            content: processedContent,
            contentType: contentType,
            method: 'fetch'
          })
        }
      }
      
      console.log(`[PROXY:${requestId}] Fetch failed or content too short, trying Puppeteer...`)
    } catch (fetchError) {
      console.log(`[PROXY:${requestId}] Fetch error:`, fetchError)
    }
    
    // Method 2: Try Puppeteer browser automation
    try {
      console.log(`[PROXY:${requestId}] Attempting Puppeteer...`)
      const puppeteerResult = await fetchWithPuppeteer(url)
      
      if (puppeteerResult.success && puppeteerResult.content) {
        const processedContent = processHtmlContent(puppeteerResult.content, url)
        
        console.log(`[PROXY:${requestId}] Puppeteer successful (${processedContent.length} chars)`)
        
        return NextResponse.json({
          success: true,
          content: processedContent,
          contentType: 'text/html; charset=utf-8',
          method: 'puppeteer'
        })
      } else {
        console.log(`[PROXY:${requestId}] Puppeteer failed:`, puppeteerResult.error)
      }
    } catch (puppeteerError) {
      console.error(`[PROXY:${requestId}] Puppeteer error:`, puppeteerError)
    }
    
    // Method 3: Fallback to basic data extraction
    console.log(`[PROXY:${requestId}] All methods failed, using fallback`)
    const fallback = {
      title: "Product",
      retailer: new URL(url).hostname,
      url: url
    }
    
    return NextResponse.json({
      success: false,
      isBlocked: true,
      error: "All proxy methods failed",
      fallbackData: fallback,
      method: 'fallback'
    })
    
  } catch (error) {
    console.error(`[PROXY:${requestId}] Unexpected error:`, error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      requestId: requestId
    }, { status: 500 })
  }
} 