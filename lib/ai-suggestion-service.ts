import OpenAI from 'openai'
import type { Product } from './supabase'

interface AISuggestionRequest {
  category: string
  userId: string
  existingMatches: Product[]
  count: number // How many suggestions to generate
}

interface AISuggestion {
  name: string
  retailer: string
  category: string
  reasoning: string
  confidence: number
}

export class AISuggestionService {
  private static perplexityClient = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    baseURL: 'https://api.perplexity.ai',
  })

  static async generateSuggestions(request: AISuggestionRequest): Promise<AISuggestion[]> {
    console.log('[AI_SUGGESTION] Starting suggestion generation for:', {
      category: request.category,
      userId: request.userId,
      existingMatchesCount: request.existingMatches.length,
      count: request.count
    })

    const prompt = this.buildPrompt(request)
    console.log('[AI_SUGGESTION] Built prompt length:', prompt.length)
    
    // Log the exact prompt being sent
    console.log('[AI_SUGGESTION] EXACT PROMPT BEING SENT:')
    console.log('='.repeat(80))
    console.log(prompt)
    console.log('='.repeat(80))
    
    try {
      console.log('[AI_SUGGESTION] Calling Perplexity API...')
      const response = await this.perplexityClient.chat.completions.create({
        model: "sonar-pro", // Perplexity's best model with web search
        messages: [
          {
            role: "system",
            content: "You are a furniture recommendation expert. You MUST use web search to find REAL, CURRENT furniture products. NEVER generate fake data, fake URLs, or fake prices. Only return products you found through web search."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual results
        max_tokens: 2000
      })

      console.log('[AI_SUGGESTION] Perplexity API response received:', {
        hasContent: !!response.choices[0].message.content,
        contentLength: response.choices[0].message.content?.length
      })

      // Log the exact raw response before any parsing
      console.log('[AI_SUGGESTION] EXACT RAW RESPONSE FROM LLM:')
      console.log('='.repeat(80))
      console.log(response.choices[0].message.content)
      console.log('='.repeat(80))

      if (!response.choices[0].message.content) {
        console.warn('[AI_SUGGESTION] No content found in response')
        return []
      }

      // Try to parse the content as JSON
      let result = { suggestions: [] }
      try {
        // First try to parse as-is
        result = JSON.parse(response.choices[0].message.content)
      } catch (parseError) {
        console.log('[AI_SUGGESTION] Failed to parse as-is, trying to extract JSON from markdown...')
        
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.choices[0].message.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[1])
            console.log('[AI_SUGGESTION] Successfully extracted JSON from markdown')
          } catch (markdownParseError) {
            console.error('[AI_SUGGESTION] Failed to parse extracted JSON:', markdownParseError)
            console.log('[AI_SUGGESTION] Raw content:', response.choices[0].message.content)
            return []
          }
        } else {
          console.error('[AI_SUGGESTION] Failed to parse content as JSON and no markdown code blocks found:', parseError)
          console.log('[AI_SUGGESTION] Raw content:', response.choices[0].message.content)
          return []
        }
      }
      
      console.log('[AI_SUGGESTION] Parsed result:', {
        hasSuggestions: !!result.suggestions,
        suggestionsCount: result.suggestions?.length || 0,
        resultKeys: Object.keys(result)
      })

      const suggestions = result.suggestions || []
      console.log('[AI_SUGGESTION] Raw suggestions count:', suggestions.length)
      
      if (suggestions.length === 0) {
        console.warn('[AI_SUGGESTION] No suggestions returned from AI')
        return []
      }

      console.log('[AI_SUGGESTION] Final suggestions count:', suggestions.length)
      
      // Validate suggestions have required fields
      const validatedSuggestions = suggestions.filter((suggestion: any) => {
        const hasRequiredFields = suggestion.name && suggestion.retailer && suggestion.category
        if (!hasRequiredFields) {
          console.warn(`[AI_SUGGESTION] Missing required fields:`, suggestion)
        }
        return hasRequiredFields
      })
      
      console.log('[AI_SUGGESTION] Validated suggestions count:', validatedSuggestions.length)
      return validatedSuggestions
    } catch (error) {
      console.error('[AI_SUGGESTION] Error generating AI suggestions:', error)
      console.error('[AI_SUGGESTION] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      })
      throw new Error('Failed to generate AI suggestions')
    }
  }

  // This method is no longer needed in the hybrid approach
  // URL validation is now handled by the SearchService

  private static buildPrompt(request: AISuggestionRequest): string {
    const matches = request.existingMatches.map(m => 
      `${m.title} (${m.product_type}) - ${m.retailer || 'Unknown retailer'}`
    ).join('\n')

    return `Suggest ${request.category} products from German furniture retailers. Focus on well-known, popular products that are likely to be available for purchase online.

Format the output as follows (array of maximum 5 results):

{
  "suggestions": [
    {
      "name": "[Product name/model - e.g., 'KIVIK sofa', 'Eames Chair', 'Malm bed']",
      "retailer": "[Retailer name - e.g., 'IKEA', 'Hülsta', 'Thonet', 'COR']",
      "category": "${request.category}",
      "reasoning": "Why this product fits the user's style based on their existing furniture preferences",
      "confidence": "from 0 to 100"
    }
  ]
}

Focus on:
- Popular, well-known furniture products that are CURRENTLY AVAILABLE FOR PURCHASE
- Major German retailers with online stores (IKEA, Hülsta, Thonet, COR, etc.)
- Products that match the user's existing style preferences
- Products that have dedicated product pages on retailer websites

Do NOT include:
- URLs (we'll find those separately)
- Prices (we'll get those from the actual product pages)
- Images (we'll get those from the actual product pages)
- Descriptions (we'll get those from the actual product pages)

Just suggest the product name and retailer. We'll handle finding the actual product pages and details separately.

User's existing furniture preferences:
${matches}
`
  }
}