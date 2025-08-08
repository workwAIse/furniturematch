import { NextRequest, NextResponse } from 'next/server'
import { AISuggestionService } from '@/lib/ai-suggestion-service'
import { SearchService } from '@/lib/search-service'
import { ScrapingService } from '@/lib/scraping-service'
import { DatabaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  console.log('[AI_SUGGESTIONS_API] POST request received')
  
  try {
    const body = await request.json()
    console.log('[AI_SUGGESTIONS_API] Request body:', body)
    
    const { category, userId, count = 3 } = body
    
    if (!category || !userId) {
      console.error('[AI_SUGGESTIONS_API] Missing required fields:', { category, userId })
      return NextResponse.json(
        { error: 'Missing required fields: category and userId' }, 
        { status: 400 }
      )
    }
    
    console.log('[AI_SUGGESTIONS_API] Valid request:', { category, userId, count })
    
    // Get user's existing matches
    console.log('[AI_SUGGESTIONS_API] Fetching user matches...')
    const matches = await DatabaseService.getMatchedProducts()
    const userMatches = matches.filter(m => 
      m.uploaded_by === userId || 
      (m.swipes[userId] === true)
    )
    console.log('[AI_SUGGESTIONS_API] User matches found:', userMatches.length)

    // Generate AI suggestions (product names only)
    console.log('[AI_SUGGESTIONS_API] Calling AI service...')
    const aiSuggestions = await AISuggestionService.generateSuggestions({
      category,
      userId,
      existingMatches: userMatches,
      count
    })
    console.log('[AI_SUGGESTIONS_API] AI suggestions generated:', aiSuggestions.length)

    if (aiSuggestions.length === 0) {
      console.warn('[AI_SUGGESTIONS_API] No suggestions returned from AI service')
      return NextResponse.json({ suggestions: [] })
    }

    // Process each suggestion through search and scraping
    console.log('[AI_SUGGESTIONS_API] Processing suggestions through search and scraping...')
    const processedSuggestions = []
    
    for (const aiSuggestion of aiSuggestions) {
      try {
        console.log(`[AI_SUGGESTIONS_API] Processing suggestion: ${aiSuggestion.name} from ${aiSuggestion.retailer}`)
        
        // Step 1: Search for product URL
        const productUrl = await SearchService.findProductURL(
          aiSuggestion.name,
          aiSuggestion.retailer,
          aiSuggestion.category
        )
        
        if (!productUrl) {
          console.warn(`[AI_SUGGESTIONS_API] No URL found for: ${aiSuggestion.name}`)
          continue
        }
        
        // Step 2: Scrape product details
        const scrapedProduct = await ScrapingService.scrapeProduct(productUrl, aiSuggestion.retailer)
        
        // Step 3: Combine AI suggestion with scraped data
        const fullSuggestion = {
          ...scrapedProduct,
          reasoning: aiSuggestion.reasoning,
          confidence: aiSuggestion.confidence
        }
        
        processedSuggestions.push(fullSuggestion)
        console.log(`[AI_SUGGESTIONS_API] Successfully processed: ${fullSuggestion.title}`)
        
      } catch (error) {
        console.error(`[AI_SUGGESTIONS_API] Failed to process suggestion ${aiSuggestion.name}:`, error)
        // Continue with next suggestion (don't fail completely)
      }
    }
    
    console.log('[AI_SUGGESTIONS_API] Successfully processed suggestions:', processedSuggestions.length)

    if (processedSuggestions.length === 0) {
      console.warn('[AI_SUGGESTIONS_API] No suggestions could be processed successfully')
      return NextResponse.json({ suggestions: [] })
    }

    // Save to database
    console.log('[AI_SUGGESTIONS_API] Saving suggestions to database...')
    const savedSuggestions = await Promise.all(
      processedSuggestions.map(suggestion => {
        // Convert confidence from percentage (0-100) to decimal (0.00-1.00)
        let confidenceScore = 0.0
        if (typeof suggestion.confidence === 'string') {
          const confidenceNum = parseFloat(suggestion.confidence)
          confidenceScore = confidenceNum / 100.0
        } else if (typeof suggestion.confidence === 'number') {
          confidenceScore = suggestion.confidence / 100.0
        }
        
        // Ensure confidence is within valid range (0.00 to 1.00)
        confidenceScore = Math.max(0.0, Math.min(1.0, confidenceScore))
        
        console.log(`[AI_SUGGESTIONS_API] Converting confidence: ${suggestion.confidence} -> ${confidenceScore}`)
        
        return DatabaseService.saveAISuggestion({
          user_id: userId,
          category,
          suggested_product: suggestion,
          reasoning: suggestion.reasoning,
          confidence_score: confidenceScore
        })
      })
    )
    console.log('[AI_SUGGESTIONS_API] Suggestions saved to database:', savedSuggestions.length)

    return NextResponse.json({ suggestions: savedSuggestions })
  } catch (error) {
    console.error('[AI_SUGGESTIONS_API] Error:', error)
    console.error('[AI_SUGGESTIONS_API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { error: 'Failed to generate suggestions' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' }, 
        { status: 400 }
      )
    }
    
    const suggestions = await DatabaseService.getAISuggestions(userId, status || undefined)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' }, 
      { status: 500 }
    )
  }
} 