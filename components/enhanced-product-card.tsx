"use client"

import React from "react"
import { Heart, ExternalLink, Trash2, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductComments } from "@/components/product-comments"
import type { Product } from "@/lib/supabase"

interface EnhancedProductCardProps {
  product: Product
  currentUserId: string
  onViewProduct: (url: string, title: string) => void
  onDelete?: (productId: string) => void
  onSwipe?: (productId: string, liked: boolean) => void
  variant?: "compact" | "detailed" | "swipe"
  showActions?: boolean
  className?: string
}

export function EnhancedProductCard({
  product,
  currentUserId,
  onViewProduct,
  onDelete,
  onSwipe,
  variant = "detailed",
  showActions = true,
  className = ""
}: EnhancedProductCardProps) {
  const isOwner = product.uploaded_by === currentUserId
  const hasSwiped = product.swipes[currentUserId] !== undefined
  const liked = product.swipes[currentUserId] === true

  const getStatusBadge = () => {
    if (hasSwiped) {
      return (
        <Badge
          variant={liked ? "default" : "destructive"}
          className="text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white border-0"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          You: {liked ? "❤️" : "❌"}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs font-medium border-yellow-300 text-yellow-700 bg-yellow-50">
        <Clock className="h-3 w-3 mr-1" />
        Waiting for review
      </Badge>
    )
  }

  const getOwnerBadge = () => {
    return (
      <Badge 
        variant="secondary" 
        className="text-xs font-medium bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700"
      >
        {isOwner ? "You" : "Partner"}
      </Badge>
    )
  }

  if (variant === "compact") {
    return (
      <Card className={`group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm ${className}`}>
        <CardContent className="p-3">
          <div className="flex gap-3">
            {/* Image Section */}
            <div className="relative flex-shrink-0">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer hover:opacity-90 transition-all duration-300 group-hover:scale-105"
                onClick={() => onViewProduct(product.url, product.title)}
                onError={(e) => {
                  console.error("Image failed to load:", product.image)
                  e.currentTarget.src = "/placeholder.svg?height=64&width=64&query=furniture"
                }}
              />
              {product.price && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg">
                  {product.price}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors flex-1 mr-2">
                  {product.title}
                </h3>
                {onDelete && isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {product.description}
              </p>

              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {getOwnerBadge()}
              </div>

              {showActions && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onViewProduct(product.url, product.title)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs h-7"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {onSwipe && !hasSwiped && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwipe(product.id, true)}
                        className="px-3 h-7 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwipe(product.id, false)}
                        className="px-3 h-7 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <ProductComments 
              productId={product.id} 
              currentUserId={currentUserId} 
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant (default)
  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Image Section with Enhanced Visual Appeal */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => onViewProduct(product.url, product.title)}
          onError={(e) => {
            console.error("Image failed to load:", product.image)
            e.currentTarget.src = "/placeholder.svg?height=400&width=300&query=furniture"
          }}
        />
        
        {/* Status Badge with Better Positioning */}
        <div className="absolute top-3 left-3">
          {getOwnerBadge()}
        </div>
        
        {/* Price Tag Overlay */}
        {product.price && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
              {product.price}
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section with Better Typography */}
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Status Indicator with Visual Enhancement */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>

        {/* Action Buttons with Better Styling */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewProduct(product.url, product.title)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Product
            </Button>
            {onDelete && isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(product.id)}
                className="px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onSwipe && !hasSwiped && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwipe(product.id, true)}
                className="px-3 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <ProductComments 
            productId={product.id} 
            currentUserId={currentUserId} 
          />
        </div>
      </CardContent>
    </Card>
  )
} 