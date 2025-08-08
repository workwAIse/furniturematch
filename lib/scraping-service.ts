interface ProductData {
  title: string
  description: string
  image: string
  price?: string
  retailer: string
  url: string
}

interface ScrapedContent {
  title?: string
  description?: string
  image?: string
  price?: string
}

export class ScrapingService {
  private static readonly FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
  private static readonly FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/scrape'

  /**
   * Scrape product details from a URL using Firecrawl
   * @param url - The product URL to scrape
   * @param retailer - The retailer name for context
   * @returns Promise<ProductData> - The scraped product data
   */
  static async scrapeProduct(url: string, retailer: string): Promise<ProductData> {
    const traceId = this.generateTraceId()
    const startTime = Date.now()
    
    console.log(`[SCRAPE:${traceId}] Starting product scraping:`, {
      url,
      retailer,
      timestamp: new Date().toISOString()
    })

    try {
      if (!this.FIRECRAWL_API_KEY) {
        console.error(`[SCRAPE:${traceId}] Missing Firecrawl API key`)
        throw new Error('Firecrawl API key not configured')
      }

      // Scrape the page content
      const scrapedContent = await this.scrapePage(url, traceId)
      
      const responseTime = Date.now() - startTime
      console.log(`[SCRAPE:${traceId}] Scraping completed in ${responseTime}ms`)

      // Extract and validate product data
      const productData = this.extractProductData(scrapedContent, url, retailer, traceId)
      
      console.log(`[SCRAPE:${traceId}] Extracted product data:`, {
        title: productData.title,
        price: productData.price,
        hasImage: !!productData.image,
        hasDescription: !!productData.description
      })

      return productData

    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error(`[SCRAPE:${traceId}] Scraping failed after ${responseTime}ms:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        url,
        retailer
      })
      throw error
    }
  }

  /**
   * Scrape page content using Firecrawl
   */
  private static async scrapePage(url: string, traceId: string): Promise<ScrapedContent> {
    console.log(`[SCRAPE:${traceId}] Making Firecrawl API request`)

    const response = await fetch(this.FIRECRAWL_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        pageOptions: {
          onlyMainContent: true,
          screenshot: false,
          pdf: false
        },
        extractorOptions: {
          mode: "llm-extraction",
          extractionPrompt: `
            Extract the following product information from this furniture product page:
            
            - title: The exact product name/title
            - description: A brief description of the product
            - price: The current price (if available)
            - image: The main product image URL
            
            Return only the extracted information in JSON format:
            {
              "title": "Product Name",
              "description": "Product description",
              "price": "€299.99",
              "image": "https://example.com/image.jpg"
            }
            
            If any information is not available, omit that field from the JSON response.
          `,
          extractionSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              price: { type: "string" },
              image: { type: "string" }
            }
          }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Firecrawl request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Firecrawl error: ${data.error}`)
    }

    console.log(`[SCRAPE:${traceId}] Firecrawl response received:`, {
      success: !!data.data,
      contentLength: data.data?.content?.length || 0,
      extractedData: data.data?.llm_extraction || null
    })

    return data.data?.llm_extraction || {}
  }

  /**
   * Extract and validate product data from scraped content
   */
  private static extractProductData(
    scrapedContent: ScrapedContent, 
    url: string, 
    retailer: string,
    traceId: string
  ): ProductData {
    console.log(`[SCRAPE:${traceId}] Extracting product data from scraped content`)

    // Extract title
    let title = scrapedContent.title || ''
    if (!title) {
      // Fallback: try to extract from URL
      title = this.extractTitleFromURL(url)
    }
    
    if (!title) {
      console.warn(`[SCRAPE:${traceId}] No title found, using fallback`)
      title = `${retailer} Product`
    }

    // Extract description
    let description = scrapedContent.description || ''
    if (!description) {
      description = `Product from ${retailer}`
    }

    // Extract price
    const price = scrapedContent.price || undefined

    // Extract image
    let image = scrapedContent.image || ''
    if (!image) {
      // Fallback: use a placeholder image
      image = '/placeholder.jpg'
    }

    // Validate and clean the data
    const productData: ProductData = {
      title: this.cleanText(title),
      description: this.cleanText(description),
      image: this.validateImageURL(image),
      price: price ? this.cleanPrice(price) : undefined,
      retailer: retailer,
      url: url
    }

    console.log(`[SCRAPE:${traceId}] Product data extracted:`, {
      titleLength: productData.title.length,
      descriptionLength: productData.description.length,
      hasPrice: !!productData.price,
      hasImage: !!productData.image
    })

    return productData
  }

  /**
   * Extract title from URL as fallback
   */
  private static extractTitleFromURL(url: string): string {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname
      
      // Extract product name from URL path
      const pathParts = path.split('/').filter(part => part.length > 0)
      const lastPart = pathParts[pathParts.length - 1]
      
      if (lastPart) {
        // Clean up the product name
        return lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.[a-z]+$/, '') // Remove file extension
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
    } catch {
      // Ignore URL parsing errors
    }
    
    return ''
  }

  /**
   * Clean and validate text content
   */
  private static cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-.,!?()€$]/g, '') // Remove special characters except common ones
      .substring(0, 500) // Limit length
  }

  /**
   * Clean and validate price
   */
  private static cleanPrice(price: string): string {
    // Extract price pattern (€XX.XX or XX,XX €)
    const priceMatch = price.match(/[€$]?\s*[\d.,]+\s*[€$]?/)
    if (priceMatch) {
      return priceMatch[0].trim()
    }
    return price.trim()
  }

  /**
   * Validate image URL
   */
  private static validateImageURL(imageUrl: string): string {
    if (!imageUrl || imageUrl === '/placeholder.jpg') {
      return '/placeholder.jpg'
    }

    try {
      const url = new URL(imageUrl)
      // Only allow http/https protocols
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return '/placeholder.jpg'
      }
      return imageUrl
    } catch {
      return '/placeholder.jpg'
    }
  }

  /**
   * Generate a unique trace ID for logging
   */
  private static generateTraceId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
} 