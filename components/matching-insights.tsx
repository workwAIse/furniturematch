import { Badge } from "@/components/ui/badge"
import { ProductTypeDetector } from "@/lib/product-type-detector"

interface MatchingInsightsProps {
  matchingTypes: string[];
  typeStats: Record<string, number>;
  className?: string;
}

export function MatchingInsights({ 
  matchingTypes, 
  typeStats, 
  className = "" 
}: MatchingInsightsProps) {
  if (matchingTypes.length === 0 && Object.keys(typeStats).length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900">Matching Insights</h3>
      
      {matchingTypes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            You both like: {matchingTypes.map(type => 
              ProductTypeDetector.getProductTypeName(type)
            ).join(', ')}
          </p>
        </div>
      )}
      
      {Object.keys(typeStats).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Matched products by type:</p>
          <div className="flex gap-1 flex-wrap">
            {Object.entries(typeStats)
              .filter(([type]) => type !== 'other')
              .map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {ProductTypeDetector.getProductTypeName(type)}: {count}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  )
} 