import React, { useState } from 'react'
import { Edit2, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductTypeDetector } from '@/lib/product-type-detector'
import { DatabaseService } from '@/lib/database'

interface ProductTypeEditorProps {
  productId: string
  currentType: string
  onTypeChange: (newType: string) => void
  className?: string
}

export function ProductTypeEditor({ 
  productId, 
  currentType, 
  onTypeChange, 
  className = "" 
}: ProductTypeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedType, setSelectedType] = useState(currentType)
  const [isLoading, setIsLoading] = useState(false)
  
  const productTypes = ProductTypeDetector.getAllProductTypes()

  const handleSave = async () => {
    if (selectedType === currentType) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      // Update the product type in the database
      await DatabaseService.updateProductType(productId, selectedType)
      
      // Call the callback to update the UI
      onTypeChange(selectedType)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating product type:', error)
      // Reset to original type on error
      setSelectedType(currentType)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedType(currentType)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => setIsEditing(true)}
        className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-1 py-0.5 rounded transition-colors cursor-pointer"
      >
        {ProductTypeDetector.getProductTypeName(currentType)}
      </button>
    </div>
  )
} 