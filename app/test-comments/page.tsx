"use client"

import { useState, useEffect } from "react"
import { ProductComments } from "@/components/product-comments"
import { DatabaseService } from "@/lib/database"
import type { Product } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestCommentsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await DatabaseService.getProducts()
        setProducts(products)
        if (products.length > 0) {
          setSelectedProductId(products[0].id)
        }
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    loadProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-center mb-6">Test Comments</h1>
        
        {/* Product Selector */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Select a Product</h2>
            <div className="space-y-2">
              {products.map((product) => (
                <Button
                  key={product.id}
                  variant={selectedProductId === product.id ? "default" : "outline"}
                  onClick={() => setSelectedProductId(product.id)}
                  className="w-full justify-start text-left"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      className="w-8 h-8 object-contain rounded bg-gray-100"
                    />
                    <span className="truncate">{product.title}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments Component */}
        {selectedProductId && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">Comments</h2>
              <ProductComments 
                productId={selectedProductId} 
                currentUserId="user1" 
              />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Test Instructions</h2>
            <div className="text-sm space-y-2 text-gray-600">
              <p>1. Select a product from the list above</p>
              <p>2. Click "Comments" to expand the comments section</p>
              <p>3. Add a new comment using the input field</p>
              <p>4. Test editing and deleting comments (only your own)</p>
              <p>5. Switch between products to see different comments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 