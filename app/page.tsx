"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Heart, X, List, Users, ArrowLeft, Loader2, LogOut, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatabaseService } from "@/lib/database"
import type { Product } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import Confetti from "@/components/confetti"

interface SwipeGesture {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isDragging: boolean
}

// Function to map user email to database user ID
const mapUserToDatabaseId = (email: string): string => {
  const userMapping: { [key: string]: string } = {
    'alexander.buechel@posteo.de': 'user1',
    'moritz.thiel@outlook.de': 'user2'
  }
  return userMapping[email] || 'user1' // Default to user1 if email not found
}

export default function FurnitureMatcher() {
  const { user, signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [currentView, setCurrentView] = useState<"swipe" | "matched" | "add">("swipe")
  const [newProductUrl, setNewProductUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [lastSwipeTime, setLastSwipeTime] = useState(0)
  const [swipeGesture, setSwipeGesture] = useState<SwipeGesture>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
  })

  // Load data from database on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await DatabaseService.getProducts()
        setProducts(products)
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    loadProducts()
  }, [])

  const extractProductInfo = async (url: string): Promise<Partial<Product>> => {
    console.log(`[EXTRACT_PRODUCT] Starting extraction for URL: ${url}`)
    
    try {
      console.log(`[EXTRACT_PRODUCT] Calling scrape API with URL:`, url)

      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      console.log(`[EXTRACT_PRODUCT] API response status:`, response.status)
      console.log(`[EXTRACT_PRODUCT] API response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[EXTRACT_PRODUCT] API error response:`, errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[EXTRACT_PRODUCT] API response data:`, data)

      if (data.error) {
        console.error(`[EXTRACT_PRODUCT] API returned error in data:`, data.error)
        throw new Error(data.error)
      }

      // Ensure we're properly using all the scraped data
      const result = {
        image:
          data.image || `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(data.title || "furniture")}`,
        title: data.title || "Furniture Item",
        description: data.description || "No description available",
        price: data.price || undefined,
        retailer: data.retailer || "Unknown",
      }
      
      console.log(`[EXTRACT_PRODUCT] Successfully extracted product info:`, {
        title: result.title,
        retailer: result.retailer,
        hasImage: !!result.image,
        hasPrice: !!result.price,
        descriptionLength: result.description?.length || 0
      })
      
      return result
    } catch (error) {
      console.error(`[EXTRACT_PRODUCT] Error extracting product info:`, error)
      console.error(`[EXTRACT_PRODUCT] Error details:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })

      // Enhanced fallback extraction from URL
      console.log(`[EXTRACT_PRODUCT] Attempting fallback extraction from URL...`)
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.toLowerCase()
        const urlPath = urlObj.pathname
        const segments = urlPath.split("/").filter(Boolean)
        const lastSegment = segments[segments.length - 1] || "furniture-item"

        console.log(`[EXTRACT_PRODUCT] Fallback - hostname: ${hostname}, path: ${urlPath}, segments:`, segments)

        // Detect retailer from hostname
        let retailer = "Unknown"
        if (hostname.includes("ikea")) retailer = "IKEA"
        else if (hostname.includes("wayfair")) retailer = "Wayfair"
        else if (hostname.includes("westelm")) retailer = "West Elm"
        else if (hostname.includes("cb2")) retailer = "CB2"
        else if (hostname.includes("article")) retailer = "Article"
        else if (hostname.includes("target")) retailer = "Target"
        else if (hostname.includes("amazon")) retailer = "Amazon"
        else if (hostname.includes("segmueller")) retailer = "Segmüller"

        console.log(`[EXTRACT_PRODUCT] Fallback - detected retailer: ${retailer}`)

        // Clean up URL segment for title
        const title =
          lastSegment
            .replace(/[-_]/g, " ")
            .replace(/\.(html|php|aspx?)$/i, "")
            .replace(/\d+/g, "")
            .split(" ")
            .filter((word) => word.length > 2)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
            .trim() || "Furniture Item"

        console.log(`[EXTRACT_PRODUCT] Fallback - extracted title: "${title}"`)

        const fallbackResult = {
          image: `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(title)}`,
          title,
          description: `Product from ${retailer}. Automatic extraction failed, but you can still add this item.`,
          retailer,
        }
        
        console.log(`[EXTRACT_PRODUCT] Fallback extraction successful:`, fallbackResult)
        return fallbackResult
      } catch (fallbackError) {
        console.error(`[EXTRACT_PRODUCT] Fallback extraction also failed:`, fallbackError)
        console.error(`[EXTRACT_PRODUCT] Fallback error details:`, {
          name: fallbackError instanceof Error ? fallbackError.name : 'Unknown',
          message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          stack: fallbackError instanceof Error ? fallbackError.stack : undefined
        })

        const finalFallback = {
          image: `/placeholder.svg?height=400&width=300&query=furniture`,
          title: "Furniture Item",
          description: "Product information could not be extracted. Please check the URL and try again.",
          retailer: "Unknown",
        }
        
        console.log(`[EXTRACT_PRODUCT] Using final fallback:`, finalFallback)
        return finalFallback
      }
    }
  }

  const addProduct = async () => {
    if (!newProductUrl.trim() || !user?.email) return

    console.log(`[ADD_PRODUCT] Starting product addition for URL: ${newProductUrl}`)
    console.log(`[ADD_PRODUCT] Current user email: ${user.email}`)
    
    setIsLoading(true)
    try {
      console.log(`[ADD_PRODUCT] Calling extractProductInfo...`)
      const productInfo = await extractProductInfo(newProductUrl)

      console.log(`[ADD_PRODUCT] Product info received:`, productInfo)

      // Map user email to database user ID
      const databaseUserId = mapUserToDatabaseId(user.email)
      console.log(`[ADD_PRODUCT] Mapped user email ${user.email} to database ID: ${databaseUserId}`)

      const newProduct = {
        url: newProductUrl,
        image: productInfo.image || `/placeholder.svg?height=400&width=300&query=furniture`,
        title: productInfo.title || "Furniture Item",
        description: productInfo.description || "No description available",
        price: productInfo.price,
        retailer: productInfo.retailer,
        uploaded_by: databaseUserId,
        swipes: {},
      }

      console.log(`[ADD_PRODUCT] New product being added:`, {
        title: newProduct.title,
        retailer: newProduct.retailer,
        hasImage: !!newProduct.image,
        hasPrice: !!newProduct.price,
        uploaded_by: newProduct.uploaded_by
      })

      // Save to database
      const savedProduct = await DatabaseService.addProduct(newProduct)
      console.log(`[ADD_PRODUCT] Product saved to database:`, savedProduct)

      // Update local state
      setProducts((prev) => {
        const updatedProducts = [...prev, savedProduct]
        console.log(`[ADD_PRODUCT] Updated products list length: ${updatedProducts.length}`)
        return updatedProducts
      })
      
      setNewProductUrl("")
      setShowSuccess(true)
      console.log(`[ADD_PRODUCT] Product successfully added, showing success message`)
      
      // Show success message for 2 seconds, then switch to swipe view
      setTimeout(() => {
        setShowSuccess(false)
        setCurrentView("swipe")
        console.log(`[ADD_PRODUCT] Success message hidden, switched to swipe view`)
      }, 2000)
    } catch (error) {
      console.error(`[ADD_PRODUCT] Error adding product:`, error)
      console.error(`[ADD_PRODUCT] Error details:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })

      // More user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.log(`[ADD_PRODUCT] Showing error alert to user: ${errorMessage}`)
      alert(`Failed to add product: ${errorMessage}\n\nThe item was still added with basic information.`)

      // Still add the product with fallback data
      const databaseUserId = mapUserToDatabaseId(user.email)
      const fallbackProduct = {
        url: newProductUrl,
        image: `/placeholder.svg?height=400&width=300&query=furniture`,
        title: "Furniture Item",
        description: "Product added manually - information extraction failed",
        uploaded_by: databaseUserId,
        swipes: {},
      }

      console.log(`[ADD_PRODUCT] Adding fallback product due to error:`, {
        title: fallbackProduct.title,
        uploaded_by: fallbackProduct.uploaded_by
      })

      try {
        const savedFallbackProduct = await DatabaseService.addProduct(fallbackProduct)
        setProducts((prev) => {
          const updatedProducts = [...prev, savedFallbackProduct]
          console.log(`[ADD_PRODUCT] Updated products list length (fallback): ${updatedProducts.length}`)
          return updatedProducts
        })
      } catch (fallbackError) {
        console.error(`[ADD_PRODUCT] Failed to save fallback product:`, fallbackError)
      }
      
      setNewProductUrl("")
      setCurrentView("swipe")
      console.log(`[ADD_PRODUCT] Fallback product added and view switched to swipe`)
    } finally {
      setIsLoading(false)
      console.log(`[ADD_PRODUCT] Loading state set to false`)
    }
  }

  const handleSwipe = async (productId: string, liked: boolean) => {
    if (!user?.email) return
    
    // Prevent rapid successive swipes
    const now = Date.now()
    if (now - lastSwipeTime < 500) {
      console.log('Swipe blocked - too soon after last swipe')
      return
    }
    setLastSwipeTime(now)
    
    const databaseUserId = mapUserToDatabaseId(user.email)
    
    try {
      // Update in database
      const updatedProduct = await DatabaseService.updateProductSwipes(productId, {
        ...products.find(p => p.id === productId)?.swipes,
        [databaseUserId]: liked,
      })

      // Update local state
      setProducts((prev) =>
        prev.map((product) => {
          if (product.id === productId) {
            return updatedProduct
          }
          return product
        }),
      )

      // Check if this creates a match
      const otherUserId = getOtherUserId()
      
      if (otherUserId && updatedProduct.swipes[otherUserId] === true && liked === true) {
        // It's a match!
        setShowMatch(true)
        setTimeout(() => {
          setShowMatch(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Error updating swipe:', error)
      // Fallback to local state only
      setProducts((prev) =>
        prev.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              swipes: {
                ...product.swipes,
                [databaseUserId]: liked,
              },
            }
          }
          return product
        }),
      )
    }
  }

  const getProductsToSwipe = () => {
    if (!user?.email) return []
    const databaseUserId = mapUserToDatabaseId(user.email)
    return products.filter((product) => product.uploaded_by !== databaseUserId && product.swipes[databaseUserId] === undefined)
  }

  const getMatchedProducts = () => {
    if (!user?.email) return []
    const databaseUserId = mapUserToDatabaseId(user.email)
    const otherUserId = getOtherUserId()
    
    if (!otherUserId) return []
    
    return products.filter((product) => {
      // A match occurs when both users like the same product
      // Case 1: You uploaded it and your partner liked it
      if (product.uploaded_by === databaseUserId) {
        return product.swipes[otherUserId] === true
      }
      // Case 2: Your partner uploaded it and you liked it
      else if (product.uploaded_by === otherUserId) {
        return product.swipes[databaseUserId] === true
      }
      
      return false
    })
  }

  const getYourProducts = () => {
    if (!user?.email) return []
    const databaseUserId = mapUserToDatabaseId(user.email)
    return products.filter((product) => product.uploaded_by === databaseUserId)
  }

  const getPartnerProducts = () => {
    if (!user?.email) return []
    const databaseUserId = mapUserToDatabaseId(user.email)
    return products.filter((product) => product.uploaded_by !== databaseUserId)
  }

  const getOtherUserId = () => {
    if (!user?.email) return null
    const databaseUserId = mapUserToDatabaseId(user.email)
    return databaseUserId === 'user1' ? 'user2' : 'user1'
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!user?.email) return
    
    const databaseUserId = mapUserToDatabaseId(user.email)
    const product = products.find(p => p.id === productId)
    
    // Only allow deletion if the user uploaded the product
    if (!product || product.uploaded_by !== databaseUserId) {
      console.error('User not authorized to delete this product')
      return
    }
    
    try {
      // Delete from database
      await DatabaseService.deleteProduct(productId)
      
      // Update local state
      setProducts((prev) => prev.filter((product) => product.id !== productId))
      
      console.log(`Product ${productId} deleted successfully`)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setSwipeGesture({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeGesture.isDragging) return
    e.preventDefault()
    
    const touch = e.touches[0]
    setSwipeGesture((prev) => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }))
  }

  const handleTouchEnd = (productId: string) => {
    if (!swipeGesture.isDragging) return

    const deltaX = swipeGesture.currentX - swipeGesture.startX
    const deltaY = Math.abs(swipeGesture.currentY - swipeGesture.startY)

    // Only trigger swipe if horizontal movement is greater than vertical and significant enough
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > deltaY) {
      handleSwipe(productId, deltaX > 0)
    }

    setSwipeGesture({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
    })
  }

  // Improved button touch handling
  const handleButtonTouch = (productId: string, liked: boolean, e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Reset swipe gesture to prevent conflicts
    setSwipeGesture({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
    })
    
    // Add a small delay to prevent accidental triggers
    setTimeout(() => {
      handleSwipe(productId, liked)
    }, 50)
  }

  const handleButtonClick = (productId: string, liked: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSwipe(productId, liked)
  }

  const productsToSwipe = getProductsToSwipe()
  const matchedProducts = getMatchedProducts()

  const getSwipeTransform = () => {
    if (!swipeGesture.isDragging) return "translateX(0px) rotate(0deg)"

    const deltaX = swipeGesture.currentX - swipeGesture.startX
    const rotation = deltaX * 0.1
    return `translateX(${deltaX}px) rotate(${rotation}deg)`
  }

  const getSwipeOpacity = () => {
    if (!swipeGesture.isDragging) return 1

    const deltaX = Math.abs(swipeGesture.currentX - swipeGesture.startX)
    return Math.max(0.5, 1 - deltaX / 300)
  }

  const LoadingSpinner = () => {
    const [loadingText, setLoadingText] = useState(0)
    
    useEffect(() => {
      const interval = setInterval(() => {
        setLoadingText((prev) => (prev + 1) % 4)
      }, 1500)
      
      return () => clearInterval(interval)
    }, [])
    
    const loadingMessages = [
      { text: "🪑 Finding the perfect chair...", emoji: "🪑" },
      { text: "🛋️ Couch surfing through products...", emoji: "🛋️" },
      { text: "🛏️ Making the bed for your furniture...", emoji: "🛏️" },
      { text: "🪞 Reflecting on your style...", emoji: "🪞" }
    ]
    
    const currentMessage = loadingMessages[loadingText]
    
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">
            {currentMessage.emoji}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {currentMessage.text}
          </h3>
          <p className="text-gray-600 text-sm">
            Extracting product details...
          </p>
        </div>
      </div>
    )
  }

  const ProductAddedMessage = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <div className="text-6xl mb-6 text-green-600">
          ✓
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Product Added! 🎉
        </h3>
        <p className="text-gray-600">
          Your furniture item has been added successfully!
        </p>
      </div>
    </div>
  )

  const MatchCelebration = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <div className="text-6xl mb-6 text-green-600">
          ✓
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          It's a Match! 🎉
        </h3>
        <p className="text-gray-600">
          You both liked the same furniture!
        </p>
      </div>
      <Confetti />
    </div>
  )

  const SwipeView = () => (
    <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto">
      {productsToSwipe.length > 0 ? (
        <div className="relative w-full" style={{ height: "min(65vh, 450px)" }}>
          {productsToSwipe.slice(0, 2).map((product, index) => (
            <Card
              key={product.id}
              className={`absolute inset-0 ${index === 0 ? "z-10" : "z-0"} shadow-xl no-select touch-manipulation`}
              style={{
                transform: index === 0 ? getSwipeTransform() : "scale(0.95)",
                opacity: index === 0 ? getSwipeOpacity() : 0.8,
                transition: swipeGesture.isDragging ? "none" : "all 0.3s ease",
              }}
              onTouchStart={(e) => {
                if (index === 0) {
                  // Check if touch is on a button area
                  const target = e.target as HTMLElement
                  if (target.closest('button')) {
                    return // Don't start swipe gesture if touching a button
                  }
                  e.preventDefault()
                  handleTouchStart(e)
                }
              }}
              onTouchMove={(e) => {
                if (index === 0 && swipeGesture.isDragging) {
                  e.preventDefault()
                  handleTouchMove(e)
                }
              }}
              onTouchEnd={(e) => {
                if (index === 0 && swipeGesture.isDragging) {
                  e.preventDefault()
                  handleTouchEnd(product.id)
                }
              }}
            >
              <CardContent className="p-0 h-full flex flex-col">
                {/* Image Section */}
                <div className="relative flex-1 min-h-0">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-contain rounded-t-lg bg-gray-50"
                    onError={(e) => {
                      console.error("Image failed to load:", product.image)
                      e.currentTarget.src = "/placeholder.svg?height=400&width=300&query=furniture"
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.uploaded_by === "user1" ? "You" : "Partner"}
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3 flex-shrink-0 bg-white rounded-b-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base leading-tight flex-1 mr-2 line-clamp-2">
                      {product.title}
                    </h3>
                    {product.retailer && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {product.retailer}
                      </Badge>
                    )}
                  </div>
                  {product.price && <p className="text-base font-bold text-green-600 mb-2">{product.price}</p>}
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{product.description}</p>

                  {/* View Product Button */}
                  <div className="mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(product.url, "_blank")}
                      className="w-full h-7 text-xs"
                    >
                      View Product
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 bg-transparent h-9 active:bg-red-100 touch-manipulation"
                      onClick={(e) => handleButtonClick(product.id, false, e)}
                      onTouchEnd={(e) => handleButtonTouch(product.id, false, e)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 h-9 active:bg-green-800 touch-manipulation"
                      onClick={(e) => handleButtonClick(product.id, true, e)}
                      onTouchEnd={(e) => handleButtonTouch(product.id, true, e)}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Like
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-4">
          <div className="text-5xl mb-3">🪑</div>
          <h3 className="text-base font-semibold mb-2">No items to review</h3>
          <p className="text-gray-600 mb-4 text-sm">
            {products.length === 0
              ? "Add some furniture items to get started!"
              : "You've reviewed all available items!"}
          </p>
          <Button
            onClick={() => setCurrentView("add")}
            className="w-full h-10"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Furniture Item
          </Button>
        </div>
      )}
    </div>
  )

  const MatchesView = () => (
    <div className="max-w-sm mx-auto h-full overflow-hidden flex flex-col">
      <Tabs defaultValue="matches" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-3 flex-shrink-0">
          <TabsTrigger value="matches" className="text-xs">
            Matches ({matchedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="yours" className="text-xs">
            Yours ({getYourProducts().length})
          </TabsTrigger>
          <TabsTrigger value="partners" className="text-xs">
            Partners ({getPartnerProducts().length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="matches" className="space-y-3 mt-0 pb-4">
            {matchedProducts.length > 0 ? (
              <div className="space-y-3">
                {matchedProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-3">
                      <div className="flex gap-2">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.title}
                          className="w-16 h-16 object-contain rounded-lg flex-shrink-0 bg-gray-50"
                          onError={(e) => {
                            console.error("Image failed to load:", product.image)
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64&query=furniture"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold line-clamp-2 text-sm flex-1 mr-2">{product.title}</h3>
                            {product.uploaded_by === mapUserToDatabaseId(user?.email || "") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {product.price && <p className="text-sm font-bold text-green-600 mb-1">{product.price}</p>}
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(product.url, "_blank")}
                              className="h-7 text-xs"
                            >
                              View Product
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">💕</div>
                <h3 className="text-base font-semibold mb-2">No matches yet</h3>
                <p className="text-gray-600 px-4 text-sm">Keep swiping to find items you both love!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="yours" className="space-y-3 mt-0 pb-4">
            {getYourProducts().length > 0 ? (
              getYourProducts().map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        className="w-14 h-14 object-contain rounded-lg flex-shrink-0 bg-gray-50"
                        onError={(e) => {
                          console.error("Image failed to load:", product.image)
                          e.currentTarget.src = "/placeholder.svg?height=56&width=56&query=furniture"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold line-clamp-1 text-sm flex-1 mr-2">{product.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {product.price && <p className="text-sm font-bold text-green-600 mb-1">{product.price}</p>}
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const otherUserId = getOtherUserId()
                            if (!otherUserId) {
                              return (
                                <Badge variant="outline" className="text-xs">
                                  Waiting for partner&apos;s review
                                </Badge>
                              )
                            }
                            const hasSwiped = product.swipes[otherUserId] !== undefined
                            const liked = product.swipes[otherUserId] === true
                            return hasSwiped ? (
                              <Badge
                                variant={liked ? "default" : "destructive"}
                                className="text-xs"
                              >
                                Partner: {liked ? "❤️" : "❌"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Waiting for partner&apos;s review
                              </Badge>
                            )
                          })()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(product.url, "_blank")}
                          className="h-7 text-xs"
                        >
                          View Product
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📦</div>
                <h3 className="text-base font-semibold mb-2">No items added yet</h3>
                <p className="text-gray-600 px-4 text-sm">Add some furniture items to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-3 mt-0 pb-4">
            {getPartnerProducts().length > 0 ? (
              getPartnerProducts().map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        className="w-14 h-14 object-contain rounded-lg flex-shrink-0 bg-gray-50"
                        onError={(e) => {
                          console.error("Image failed to load:", product.image)
                          e.currentTarget.src = "/placeholder.svg?height=56&width=56&query=furniture"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 line-clamp-1 text-sm">{product.title}</h3>
                        {product.price && <p className="text-sm font-bold text-green-600 mb-1">{product.price}</p>}
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const currentUserId = mapUserToDatabaseId(user?.email || "")
                            const hasSwiped = product.swipes[currentUserId] !== undefined
                            const liked = product.swipes[currentUserId] === true
                            return hasSwiped ? (
                              <Badge
                                variant={liked ? "default" : "destructive"}
                                className="text-xs"
                              >
                                You: {liked ? "❤️" : "❌"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Waiting for your review
                              </Badge>
                            )
                          })()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(product.url, "_blank")}
                          className="h-7 text-xs"
                        >
                          View Product
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">👥</div>
                <h3 className="text-base font-semibold mb-2">No partner items yet</h3>
                <p className="text-gray-600 px-4 text-sm">Your partner hasn&apos;t added any items yet.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="h-mobile-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-white shadow-sm border-b flex-shrink-0 safe-area-top">
          <div className="flex items-center justify-between p-2">
            {currentView !== "swipe" && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("swipe")} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-gray-800 text-sm">FurnitureMatch</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="text-xs h-8 px-2"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Log Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Content */}
          <div className="flex-1 p-3 pb-0 overflow-hidden">
            {currentView === "swipe" && <SwipeView />}

            {currentView === "add" && (
              <div className="max-w-sm mx-auto pt-4">
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-3">Add Furniture Item</h2>
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : showSuccess ? (
                      <ProductAddedMessage />
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Product URL</label>
                          <Input
                            type="url"
                            placeholder="https://example.com/furniture-item"
                            value={newProductUrl}
                            onChange={(e) => setNewProductUrl(e.target.value)}
                            className="w-full h-10"
                          />
                        </div>
                        <Button
                          onClick={addProduct}
                          disabled={!newProductUrl.trim() || isLoading}
                          className="w-full h-10"
                          size="sm"
                        >
                          {isLoading ? "Adding..." : "Add Item"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === "matched" && <MatchesView />}

            {/* Match Celebration Overlay */}
            {showMatch && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
                  <MatchCelebration />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation - Fixed */}
          <div className="bg-white border-t shadow-lg flex-shrink-0 safe-area-bottom">
            <div className="flex justify-center gap-1 p-2 max-w-sm mx-auto">
              <Button
                variant={currentView === "swipe" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("swipe")}
                className="flex-1 h-10 text-xs"
              >
                <Heart className="h-3 w-3 mr-1" />
                Swipe
              </Button>
              <Button
                variant={currentView === "add" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("add")}
                className="flex-1 h-10 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
              <Button
                variant={currentView === "matched" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("matched")}
                className="flex-1 h-10 text-xs"
              >
                <List className="h-3 w-3 mr-1" />
                Matches
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
