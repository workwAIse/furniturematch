import { Badge } from "@/components/ui/badge"
import { ProductTypeDetector } from "@/lib/product-type-detector"
import { X, CheckCircle, XCircle, Clock } from "lucide-react"

interface UnifiedFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  selectedOwner: 'all' | 'me' | 'partner';
  onOwnerChange: (owner: 'all' | 'me' | 'partner') => void;
  selectedState?: 'all' | 'match' | 'rejected' | 'pending';
  onStateChange?: (state: 'all' | 'match' | 'rejected' | 'pending') => void;
  className?: string;
  // Context-aware props
  context?: 'matches' | 'yours' | 'partners';
  availableProductTypes?: Record<string, number>;
}

export function UnifiedFilter({ 
  selectedType, 
  onTypeChange, 
  selectedOwner,
  onOwnerChange,
  selectedState = 'all',
  onStateChange,
  className = "",
  context = 'matches',
  availableProductTypes = {}
}: UnifiedFilterProps) {
  const allProductTypes = ProductTypeDetector.getAllProductTypes()
    .filter(type => type.id !== 'other') // Don't show "Other" as a filter option
  
  // Only show product types that have actual data in the current context
  const productTypes = availableProductTypes && Object.keys(availableProductTypes).length > 0
    ? allProductTypes.filter(type => availableProductTypes[type.id] > 0)
    : allProductTypes

  const handleTypeChipClick = (typeId: string) => {
    onTypeChange(selectedType === typeId ? null : typeId)
  }

  const handleOwnerChipClick = (owner: 'all' | 'me' | 'partner') => {
    onOwnerChange(owner)
  }

  const handleStateChipClick = (state: 'all' | 'match' | 'rejected' | 'pending') => {
    onStateChange?.(state)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Owner Filter Chips - Only show when relevant */}
      {context === 'matches' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Filter by owner:</label>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant={selectedOwner === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedOwner === 'all' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''
              }`}
              onClick={() => handleOwnerChipClick('all')}
            >
              All
            </Badge>
            <Badge 
              variant={selectedOwner === 'me' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedOwner === 'me' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
              }`}
              onClick={() => handleOwnerChipClick('me')}
            >
              Me
            </Badge>
            <Badge 
              variant={selectedOwner === 'partner' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedOwner === 'partner' ? 'bg-green-600 text-white hover:bg-green-700' : ''
              }`}
              onClick={() => handleOwnerChipClick('partner')}
            >
              Partner
            </Badge>
          </div>
        </div>
      )}

      {/* Product Type Filter Chips */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Filter by type:</label>
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={selectedType === null ? 'default' : 'outline'}
            className={`cursor-pointer hover:bg-gray-100 transition-colors ${
              selectedType === null ? 'bg-purple-600 text-white hover:bg-purple-700' : ''
            }`}
            onClick={() => onTypeChange(null)}
          >
            All types
          </Badge>
          {productTypes.map((type) => (
            <Badge 
              key={type.id}
              variant={selectedType === type.id ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedType === type.id ? 'bg-purple-600 text-white hover:bg-purple-700' : ''
              }`}
              onClick={() => handleTypeChipClick(type.id)}
            >
              {type.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* State Filter Chips - Only show for yours and partners tabs */}
      {(context === 'yours' || context === 'partners') && onStateChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Filter by state:</label>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant={selectedState === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedState === 'all' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''
              }`}
              onClick={() => handleStateChipClick('all')}
            >
              All
            </Badge>
            <Badge 
              variant={selectedState === 'match' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedState === 'match' ? 'bg-green-600 text-white hover:bg-green-700' : ''
              }`}
              onClick={() => handleStateChipClick('match')}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Matches
            </Badge>
            <Badge 
              variant={selectedState === 'rejected' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedState === 'rejected' ? 'bg-red-600 text-white hover:bg-red-700' : ''
              }`}
              onClick={() => handleStateChipClick('rejected')}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>
            <Badge 
              variant={selectedState === 'pending' ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedState === 'pending' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : ''
              }`}
              onClick={() => handleStateChipClick('pending')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </div>
      )}



      {/* Active Filters Display */}
      {(selectedType || selectedOwner !== 'all' || (selectedState && selectedState !== 'all')) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Active filters:</label>
          <div className="flex gap-2 flex-wrap">
            {selectedType && (
              <Badge 
                variant="default" 
                className="bg-purple-600 text-white"
              >
                {ProductTypeDetector.getProductTypeName(selectedType)}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:bg-purple-700 rounded-full p-0.5" 
                  onClick={() => onTypeChange(null)}
                />
              </Badge>
            )}
            {selectedOwner !== 'all' && (
              <Badge 
                variant="default" 
                className={`${
                  selectedOwner === 'me' ? 'bg-blue-600' : 'bg-green-600'
                } text-white`}
              >
                {selectedOwner === 'me' ? 'Me' : 'Partner'}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:opacity-80 rounded-full p-0.5" 
                  onClick={() => onOwnerChange('all')}
                />
              </Badge>
            )}
            {selectedState && selectedState !== 'all' && onStateChange && (
              <Badge 
                variant="default" 
                className={`${
                  selectedState === 'match' ? 'bg-green-600' : 
                  selectedState === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                } text-white`}
              >
                {selectedState === 'match' ? 'Matches' : 
                 selectedState === 'rejected' ? 'Rejected' : 'Pending'}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:opacity-80 rounded-full p-0.5" 
                  onClick={() => onStateChange('all')}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 