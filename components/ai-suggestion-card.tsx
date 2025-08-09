import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Search } from 'lucide-react'
import { OpenLinkControl } from '@/components/ui/open-link-control'

interface AISuggestionCardProps {
  suggestion: {
    id: string
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
  }
  onAccept: () => void
  onReject: () => void
  onViewProduct?: (url: string, title: string) => void
  isLoading?: boolean
}

export function AISuggestionCard({ 
  suggestion, 
  onAccept, 
  onReject, 
  onViewProduct,
  isLoading = false 
}: AISuggestionCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {suggestion.suggested_product.title}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground">
                {suggestion.suggested_product.retailer}
              </span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {Math.round(suggestion.confidence_score * 100)}% match
              </Badge>
            </div>
          </div>
          {onViewProduct && (
            <OpenLinkControl
              url={suggestion.suggested_product.url}
              title={suggestion.suggested_product.title}
              onOpenModal={onViewProduct}
              size="sm"
              label="View"
            />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {suggestion.suggested_product.description}
        </p>
        
        <div className="bg-muted p-4 rounded-lg mb-4">
          <p className="text-sm">
            <strong className="text-primary">Why this fits:</strong> {suggestion.reasoning}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={onAccept} 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <Check className="w-4 h-4 mr-2" />
            Add to Collection
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const q = `${suggestion.suggested_product.title} kaufen`
              const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            disabled={isLoading}
            className="px-4"
          >
            <Search className="w-4 h-4 mr-1" />
            Google
          </Button>
          <Button 
            variant="outline" 
            onClick={onReject}
            disabled={isLoading}
            className="px-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 