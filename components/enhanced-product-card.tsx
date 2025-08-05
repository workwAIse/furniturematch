"use client"

import React from "react"
import { Heart, ExternalLink, Trash2, Clock, CheckCircle, XCircle, X, MessageCircle } from "lucide-react"
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
  const otherUserId = currentUserId === 'user1' ? 'user2' : 'user1'

  const getStatusBadge = () => {
    // Check if this is a match (non-uploader liked the uploader's item)
    const isMatch = (product.uploaded_by === currentUserId && product.swipes[otherUserId] === true) ||
                   (product.uploaded_by === otherUserId && product.swipes[currentUserId] === true)
    
    if (isMatch) {
      return (
        <Badge
          variant="default"
          className="text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Match! ❤️
        </Badge>
      )
    }
    
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

  const isMatch = (product.uploaded_by === currentUserId && product.swipes[otherUserId] === true) ||
                   (product.uploaded_by === otherUserId && product.swipes[currentUserId] === true)

  if (variant === "compact") {
    return (
      <Card className={`group hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm ${className}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image Section */}
            <div className="relative flex-shrink-0">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.title}
                className="w-20 h-20 object-cover rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer hover:opacity-90 transition-all duration-300 group-hover:scale-105"
                onClick={() => onViewProduct(product.url, product.title)}
                onError={(e) => {
                  console.error("Image failed to load:", product.image)
                  e.currentTarget.src = "/placeholder.svg?height=80&width=80&query=furniture"
                }}
              />
              {/* Match indicator overlay */}
              {isMatch && (
                <div className="absolute -top-1 -right-1 bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header with title and delete */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {product.retailer}
                  </p>
                </div>
                {onDelete && isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Description */}
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {product.description}
              </p>

              {/* Bottom section: Price, status, and actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  {/* Price */}
                  {product.price && (
                    <span className="text-sm font-semibold text-green-600">
                      {product.price}
                    </span>
                  )}
                  
                  {/* Status indicator - simplified */}
                  {!isMatch && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      hasSwiped 
                        ? liked 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {hasSwiped ? (liked ? 'Liked' : 'Disliked') : 'Pending'}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onViewProduct(product.url, product.title)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3"
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
                        className="h-8 w-8 p-0 border-green-300 text-green-600 hover:bg-green-50"
                      >
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwipe(product.id, false)}
                        className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-3 border-t border-gray-100">
                <ProductComments 
                  productId={product.id} 
                  currentUserId={currentUserId} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant (default)
  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/90 backdrop-blur-sm overflow-hidden ${className}`}>
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
        
        {/* Match indicator overlay */}
        {isMatch && (
          <div className="absolute top-3 right-3 bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
        
        {/* Price Tag Overlay */}
        {product.price && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
              {product.price}
            </div>
          </div>
        )}

        {/* Delete button overlay */}
        {onDelete && isOwner && (
          <div className="absolute top-3 left-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(product.id)}
              className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section with Better Typography */}
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-purple-600 transition-colors">
            {product.title}
          </h3>
          <p className="text-sm text-gray-500">
            {product.retailer}
          </p>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {product.description}
        </p>

        {/* Status and Actions */}
        <div className="flex items-center justify-between pt-2">
          {/* Status indicator - simplified */}
          {!isMatch && (
            <span className={`text-sm px-3 py-1.5 rounded-full ${
              hasSwiped 
                ? liked 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {hasSwiped ? (liked ? 'Liked' : 'Disliked') : 'Pending Review'}
            </span>
          )}
          
          {isMatch && (
            <span className="text-sm px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
              Match! ❤️
            </span>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => onViewProduct(product.url, product.title)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Product
            </Button>
            {onSwipe && !hasSwiped && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSwipe(product.id, true)}
                  className="h-10 w-10 p-0 border-green-300 text-green-600 hover:bg-green-50"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSwipe(product.id, false)}
                  className="h-10 w-10 p-0 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

                 {/* Comments Section */}
         <div className="border-t border-gray-100 pt-4">
           <ProductComments 
             productId={product.id} 
             currentUserId={currentUserId} 
           />
         </div>
      </CardContent>
    </Card>
  )
} 