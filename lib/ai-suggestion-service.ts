import OpenAI from 'openai'

interface AISuggestionRequest {
  category: string
  userId: string
  count: number // How many suggestions to generate
  // Richer context
  liked?: Array<{ title: string; retailer?: string; price?: string; description: string }>
  disliked?: Array<{ title: string; retailer?: string; price?: string; description: string }>
  rejectedAISuggestions?: Array<{ title: string; retailer?: string; reasoning?: string; confidence?: number }>
  priceRange?: { min?: number; max?: number }
  // Back-compat (unused now)
  existingMatches?: any[]
}

interface AISuggestion {
  name: string
  retailer: string
  category: string
  reasoning: string
  confidence: number | string
}

// Exported for tests
export function buildAISuggestionPrompt(request: AISuggestionRequest): string {
  const fmtMoney = (v?: string) => (v && v.trim() ? v : 'N/A')

  const liked = (request.liked || [])
    .map(i => `- Product: ${i.title}\n  Brand: ${i.retailer || 'Unknown'}\n  Price: ${fmtMoney(i.price)}\n  Description: ${i.description}`)
    .join('\n')

  const disliked = (request.disliked || [])
    .map(i => `- Product: ${i.title}\n  Brand: ${i.retailer || 'Unknown'}\n  Price: ${fmtMoney(i.price)}\n  Description: ${i.description}`)
    .join('\n')

  const rejected = (request.rejectedAISuggestions || [])
    .map(i => `- Product: ${i.title}\n  Brand: ${i.retailer || 'Unknown'}\n  AI justification: ${i.reasoning || 'N/A'}\n  Confidence: ${typeof i.confidence === 'number' ? Math.round(i.confidence * 100) + '%' : (i.confidence ?? 'N/A')}`)
    .join('\n')

  const priceRange = request.priceRange
  const priceLine = priceRange && (priceRange.min !== undefined || priceRange.max !== undefined)
    ? `Price range (EUR): ${priceRange.min !== undefined ? priceRange.min : 'any'} - ${priceRange.max !== undefined ? priceRange.max : 'any'}`
    : 'Price range (EUR): not specified'

  return `Suggest ${request.category} products from German furniture retailers. Focus on products that can be found and bought online.

User preference context:

Your past matches (liked):
${liked || '- None'}

No matches (disliked real items):
${disliked || '- None'}

No matches (discarded AI suggestions):
${rejected || '- None'}

${priceLine}

Instructions:
- Use the above preferences to infer the user's current design style and what to avoid. Consider themes across liked items (materials, colors, shapes, scale) and contrasts in dislikes.
- Write the justification in a friendly, expert, and personal tone (address the user as "you").
- Make the justification explanatory and specific: reference style fit (e.g., materials, color palette, form factor, dimensions/scale, brand continuity) and call out why it avoids the user's past dislikes.
- Keep justification to 1–3 concise sentences.
- STRICTLY respect the price range if provided. If a product family spans prices, choose a configuration that typically falls within the range. If you cannot confidently find an item within range, skip it and return fewer suggestions.
- Return ONLY product names and retailers (no URLs/prices/images); we'll find URLs separately.
- Provide a brief reasoning (personalized justification) and a confidence score (0-100).
Format response as:
{
  "suggestions": [
    { "name": "Product name", "retailer": "Retailer", "category": "${request.category}", "reasoning": "Personal, explanatory why it fits the current design and avoids past dislikes", "confidence": 85 }
  ]
}`
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
      count: request.count
    })

    const prompt = buildAISuggestionPrompt(request)
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
            content: "You are an interior designer and furniture expert. You MUST use web search to find REAL, CURRENT furniture products. NEVER generate fake data, fake URLs, or fake prices. Only return products you found through web search."
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
      let result = { suggestions: [] as any[] }
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

  // Previous buildPrompt removed; using buildAISuggestionPrompt instead
}