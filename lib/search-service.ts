interface SearchResult {
  url: string
  title: string
  snippet: string
}

interface SerpAPIResponse {
  organic_results?: Array<{
    link: string
    title: string
    snippet: string
  }>
  error?: string
}

export class SearchService {
  private static readonly API_KEY = process.env.SEARCHAPI_API_KEY || process.env.SERPAPI_API_KEY
  private static readonly BASE_URL = 'https://www.searchapi.io/api/v1/search'

  /**
   * Find a product URL using SerpAPI
   * @param productName - The name of the product (e.g., "KIVIK sofa")
   * @param retailer - The retailer name (e.g., "IKEA")
   * @param category - The furniture category (e.g., "sofa")
   * @returns Promise<string | null> - The found URL or null if not found
   */
  static async findProductURL(
    productName: string, 
    retailer: string, 
    category: string
  ): Promise<string | null> {
    const traceId = this.generateTraceId()
    const startTime = Date.now()
    
    console.log(`[SEARCH:${traceId}] Starting product search:`, {
      productName,
      retailer,
      category,
      timestamp: new Date().toISOString()
    })

    try {
      // Debug environment variables
      console.log(`[SEARCH:${traceId}] Environment variables check:`, {
        SEARCHAPI_API_KEY: process.env.SEARCHAPI_API_KEY ? 'SET' : 'NOT SET',
        SERPAPI_API_KEY: process.env.SERPAPI_API_KEY ? 'SET' : 'NOT SET',
        hasApiKey: !!this.API_KEY
      })
      
      if (!this.API_KEY) {
        console.error(`[SEARCH:${traceId}] Missing SearchAPI key`)
        throw new Error('SearchAPI key not configured')
      }

      // Build search query
      const searchQuery = this.buildSearchQuery(productName, retailer, category)
      console.log(`[SEARCH:${traceId}] Search query: "${searchQuery}"`)

      // Make API request
      const response = await this.makeSearchRequest(searchQuery, traceId)
      
      const responseTime = Date.now() - startTime
      console.log(`[SEARCH:${traceId}] Search completed in ${responseTime}ms`)

      if (!response || !response.organic_results || response.organic_results.length === 0) {
        console.warn(`[SEARCH:${traceId}] No search results found`)
        return null
      }

      // Find the best matching URL
      const bestUrl = this.findBestMatch(response.organic_results, retailer, category, traceId)
      
      if (bestUrl) {
        console.log(`[SEARCH:${traceId}] Found URL: ${bestUrl}`)
      } else {
        console.warn(`[SEARCH:${traceId}] No suitable URL found in search results`)
      }

      return bestUrl

    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error(`[SEARCH:${traceId}] Search failed after ${responseTime}ms:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        productName,
        retailer,
        category
      })
      throw error
    }
  }

  /**
   * Build search query for SerpAPI
   */
  private static buildSearchQuery(productName: string, retailer: string, category: string): string {
    // Clean up retailer name for search
    const cleanRetailer = retailer.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Build site-specific search with product page focus
    let siteFilter = ''
    if (cleanRetailer.includes('ikea')) {
      siteFilter = 'site:ikea.de'
    } else if (cleanRetailer.includes('wayfair')) {
      siteFilter = 'site:wayfair.de'
    } else if (cleanRetailer.includes('amazon')) {
      siteFilter = 'site:amazon.de'
    } else if (cleanRetailer.includes('otto')) {
      siteFilter = 'site:otto.de'
    } else if (cleanRetailer.includes('hoeffner')) {
      siteFilter = 'site:hoeffner.de'
    } else if (cleanRetailer.includes('moebel')) {
      siteFilter = 'site:moebel.de'
    } else if (cleanRetailer.includes('home24')) {
      siteFilter = 'site:home24.de'
    } else {
      // Default to German furniture sites
      siteFilter = 'site:*.de'
    }

    // Add product page indicators to focus on actual product pages
    const productPageTerms = 'kaufen bestellen produkt artikel'
    
    return `${retailer} ${productName} ${category} ${productPageTerms} ${siteFilter}`
  }

  /**
   * Make the actual API request to SerpAPI
   */
  private static async makeSearchRequest(searchQuery: string, traceId: string): Promise<SerpAPIResponse> {
    const params = new URLSearchParams({
      q: searchQuery,
      api_key: this.API_KEY!,
      engine: 'google',
      gl: 'de', // Germany
      hl: 'de', // German language
      num: '5' // Limit to 5 results
    })

    const url = `${this.BASE_URL}?${params.toString()}`
    
    // Debug: Log API key (masked) and URL
    const maskedKey = this.API_KEY ? `${this.API_KEY.substring(0, 8)}...` : 'NOT SET'
    console.log(`[SEARCH:${traceId}] API Key: ${maskedKey}`)
    console.log(`[SEARCH:${traceId}] Making API request to SearchAPI`)
    console.log(`[SEARCH:${traceId}] URL: ${this.BASE_URL}?q=${encodeURIComponent(searchQuery)}&api_key=${maskedKey}&engine=google&gl=de&hl=de&num=5`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`SearchAPI request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`SearchAPI error: ${data.error}`)
    }

    console.log(`[SEARCH:${traceId}] Received ${data.organic_results?.length || 0} search results`)
    return data
  }

  /**
   * Find the best matching URL from search results
   */
  private static findBestMatch(
    results: Array<{ link: string; title: string; snippet: string }>, 
    retailer: string, 
    category: string,
    traceId: string
  ): string | null {
    console.log(`[SEARCH:${traceId}] Analyzing ${results.length} search results`)

    for (const result of results) {
      const url = result.link
      const title = result.title.toLowerCase()
      const snippet = result.snippet.toLowerCase()
      
      console.log(`[SEARCH:${traceId}] Analyzing result:`, {
        url,
        title: result.title,
        snippet: result.snippet.substring(0, 100) + '...'
      })

      // Basic URL validation
      if (!this.isValidProductURL(url, retailer, category)) {
        console.log(`[SEARCH:${traceId}] URL validation failed: ${url}`)
        continue
      }

      // Check if it looks like a product page
      if (this.looksLikeProductPage(url, title, snippet, category)) {
        console.log(`[SEARCH:${traceId}] Found product page: ${url}`)
        return url
      }
    }

    return null
  }

  /**
   * Basic URL validation
   */
  private static isValidProductURL(url: string, retailer: string, category: string): boolean {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      // Must be a German domain
      if (!hostname.endsWith('.de') && !hostname.includes('amazon.de')) {
        return false
      }

      // Must not be a generic page
      const path = urlObj.pathname.toLowerCase()
      const genericPaths = ['/search', '/category', '/catalog', '/products', '/shop']
      if (genericPaths.some(generic => path.includes(generic))) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Check if URL looks like a product page
   */
  private static looksLikeProductPage(
    url: string, 
    title: string, 
    snippet: string, 
    category: string
  ): boolean {
    // Check for product indicators in URL
    const urlLower = url.toLowerCase()
    const productIndicators = [
      '/p/', '/product/', '/artikel/', '/produkt/', '/item/', 
      '/dp/', '/gp/product/', '/kaufen/', '/bestellen/'
    ]
    const hasProductPath = productIndicators.some(indicator => urlLower.includes(indicator))

    // Check for category keywords in title/snippet
    const categoryKeywords = {
      'chair': ['stuhl', 'chair', 'sessel'],
      'sofa': ['sofa', 'couch', 'ecke', 'eck'],
      'table': ['tisch', 'table'],
      'bed': ['bett', 'bed'],
      'desk': ['schreibtisch', 'desk'],
      'shelf': ['regal', 'shelf', 'bord'],
      'lamp': ['lampe', 'lamp', 'leuchte']
    }

    const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || []
    const hasCategoryKeywords = keywords.some(keyword => 
      title.includes(keyword) || snippet.includes(keyword)
    )

    // Additional checks for product page indicators
    const hasProductTerms = title.toLowerCase().includes('kaufen') || 
                           title.toLowerCase().includes('bestellen') ||
                           snippet.toLowerCase().includes('kaufen') ||
                           snippet.toLowerCase().includes('bestellen')

    // Exclude category/listing pages
    const isCategoryPage = urlLower.includes('/category/') || 
                          urlLower.includes('/kategorie/') ||
                          urlLower.includes('/search') ||
                          urlLower.includes('/suche') ||
                          title.toLowerCase().includes('alle ') ||
                          title.toLowerCase().includes('category')

    return (hasProductPath || hasCategoryKeywords || hasProductTerms) && !isCategoryPage
  }

  /**
   * Generate a unique trace ID for logging
   */
  private static generateTraceId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
} 