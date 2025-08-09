"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { AISuggestionCard } from '@/components/ai-suggestion-card'
import { DatabaseService } from '@/lib/database'
import { ProductTypeDetector } from '@/lib/product-type-detector'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'

// Function to map user email to database user ID
const mapUserToDatabaseId = (email: string): string => {
  const userMapping: { [key: string]: string } = {
    'alexander.buechel@posteo.de': 'user1',
    'moritz.thiel@outlook.de': 'user2'
  }
  return userMapping[email] || 'user1'
}

interface AISuggestion {
  id: string
  user_id: string
  category: string
  suggested_product: {
    title: string
    description: string
    image: string
    price?: string
    retailer: string
    url: string
  }
  reasoning: string
  confidence_score: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface AISuggestionsTabProps {
  onViewProduct?: (url: string, title: string) => void
  onAddToCollection?: (url: string) => void
}

export function AISuggestionsTab({ onViewProduct, onAddToCollection }: AISuggestionsTabProps = {}) {
  const [category, setCategory] = useState('')
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAccepting, setIsAccepting] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const { user } = useAuth()
  const { toast } = useToast()

  // Load existing suggestions on mount
  useEffect(() => {
    if (user?.email) {
      loadExistingSuggestions()
    }
  }, [user?.email])

  const loadExistingSuggestions = async () => {
    if (!user?.email) return
    
    try {
      const response = await fetch(`/api/ai-suggestions?userId=${mapUserToDatabaseId(user.email)}&status=pending`)
      const data = await response.json()
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Failed to load existing suggestions:', error)
    }
  }

  const generateSuggestions = async () => {
    if (!category || !user?.email) return
    
    console.log('[AI_SUGGESTIONS_TAB] Starting suggestion generation:', {
      category,
      userEmail: user.email,
      mappedUserId: mapUserToDatabaseId(user.email)
    })
    
    setIsLoading(true)
    try {
      const requestBody: any = {
        category,
        userId: mapUserToDatabaseId(user.email),
        count: 3
      }
      if (minPrice || maxPrice) {
        requestBody.priceRange = {
          ...(minPrice ? { min: Number(minPrice) } : {}),
          ...(maxPrice ? { max: Number(maxPrice) } : {}),
        }
      }
      console.log('[AI_SUGGESTIONS_TAB] Request body:', requestBody)
      
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('[AI_SUGGESTIONS_TAB] Response status:', response.status)
      console.log('[AI_SUGGESTIONS_TAB] Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AI_SUGGESTIONS_TAB] Response not ok:', errorText)
        throw new Error(`Failed to generate suggestions: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('[AI_SUGGESTIONS_TAB] Response data:', data)
      console.log('[AI_SUGGESTIONS_TAB] Suggestions count:', data.suggestions?.length || 0)
      
      setSuggestions(prev => [...data.suggestions, ...prev])
      
      toast({
        title: "Suggestions Generated!",
        description: `Generated ${data.suggestions.length} new furniture suggestions for ${category}.`,
      })
    } catch (error) {
      console.error('[AI_SUGGESTIONS_TAB] Failed to generate suggestions:', error)
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const acceptSuggestion = async (suggestion: AISuggestion) => {
    if (!user?.email) return
    
    setIsAccepting(suggestion.id)
    try {
      // Mark suggestion as accepted
      await DatabaseService.updateAISuggestionStatus(suggestion.id, 'accepted')
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
      
      // Call the callback to add to collection (this will populate the Add tab)
      if (onAddToCollection) {
        onAddToCollection(suggestion.suggested_product.url)
      }
      
      toast({
        title: "Suggestion Accepted!",
        description: `${suggestion.suggested_product.title} has been added to the Add tab for you to review.`,
      })
    } catch (error) {
      console.error('Failed to accept suggestion:', error)
      toast({
        title: "Error",
        description: "Failed to accept suggestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(null)
    }
  }

  const rejectSuggestion = async (suggestion: AISuggestion) => {
    try {
      // Mark suggestion as rejected
      await DatabaseService.updateAISuggestionStatus(suggestion.id, 'rejected')
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
      
      toast({
        title: "Suggestion Rejected",
        description: "The suggestion has been removed.",
      })
    } catch (error) {
      console.error('Failed to reject suggestion:', error)
      toast({
        title: "Error",
        description: "Failed to reject suggestion. Please try again.",
        variant: "destructive",
      })
    }
  }

  const productTypes = ProductTypeDetector.getAllProductTypes()

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">AI Furniture Suggestions</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Get personalized furniture recommendations based on your existing matches and style preferences.
          </p>
          
          <div className="flex flex-col gap-3 mb-6">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select furniture category" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min €"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                type="number"
                min={0}
                placeholder="Max €"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={generateSuggestions}
              disabled={!category || isLoading}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {suggestions.length === 0 && !isLoading && (
        <Card className="p-6 text-center">
          <CardContent>
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-base font-semibold mb-2">No Suggestions Yet</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Select a furniture category and generate AI-powered suggestions based on your style.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>AI will analyze your existing matches to provide personalized recommendations</span>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Your Suggestions ({suggestions.length})
            </h3>
            <Badge variant="secondary">
              {suggestions.filter(s => s.status === 'pending').length} pending
            </Badge>
          </div>
          
          <div className="grid gap-4 grid-cols-1">
            {suggestions.map(suggestion => (
              <AISuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => acceptSuggestion(suggestion)}
                onReject={() => rejectSuggestion(suggestion)}
                onViewProduct={onViewProduct}
                isLoading={isAccepting === suggestion.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 