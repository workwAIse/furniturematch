"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
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
import { IframeModal } from "@/components/iframe-modal"
import { ProductComments } from "@/components/product-comments"
import { EnhancedProductCard } from "@/components/enhanced-product-card"
import { ProductTypeDetector } from "@/lib/product-type-detector"
import { ProductTypeBadge } from "@/components/product-type-badge"
import { UnifiedFilter } from "@/components/unified-filter"

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
  const [recentlyAddedProduct, setRecentlyAddedProduct] = useState<Product | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [lastSwipeTime, setLastSwipeTime] = useState(0)
  // Separate filter states for each tab
  const [matchesProductType, setMatchesProductType] = useState<string | null>(null)
  const [matchesOwner, setMatchesOwner] = useState<'all' | 'me' | 'partner'>('all')
  const [yoursProductType, setYoursProductType] = useState<string | null>(null)
  const [yoursState, setYoursState] = useState<'all' | 'match' | 'rejected' | 'pending'>('all')
  const [partnersProductType, setPartnersProductType] = useState<string | null>(null)
  const [partnersState, setPartnersState] = useState<'all' | 'match' | 'rejected' | 'pending'>('all')
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'matches' | 'yours' | 'partners'>('matches')
  const [swipeGesture, setSwipeGesture] = useState<SwipeGesture>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
  })

  // Iframe modal state
  const [iframeState, setIframeState] = useState({
    isOpen: false,
    url: null as string | null,
    productTitle: null as string | null,
  })

  // Load data from database on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await DatabaseService.getProducts()
        setProducts(products)
        
        // One-time migration: update product types for existing products
        try {
          await DatabaseService.updateProductTypes()
          // Reload products after migration
          const updatedProducts = await DatabaseService.getProducts()
          setProducts(updatedProducts)
        } catch (migrationError) {
          console.error('Error during product type migration:', migrationError)
        }
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
        product_type: ProductTypeDetector.detectProductType(url, data.title || "", data.description || ""),
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
          product_type: ProductTypeDetector.detectProductType(url, title, `Product from ${retailer}`),
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
          product_type: "other",
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
        product_type: productInfo.product_type || "other",
        uploaded_by: databaseUserId,
        swipes: {
          [databaseUserId]: true // Creator automatically likes their own product
        },
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
      setRecentlyAddedProduct(savedProduct)
      setShowSuccess(true)
      console.log(`[ADD_PRODUCT] Product successfully added, showing success message`)
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
        product_type: "other",
        uploaded_by: databaseUserId,
        swipes: {
          [databaseUserId]: true // Creator automatically likes their own product
        },
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

  // Helper function to determine product state
  const getProductState = (product: Product, currentUserId: string): 'match' | 'rejected' | 'pending' => {
    const otherUserId = currentUserId === 'user1' ? 'user2' : 'user1'
    
    // Check if it's a match (both users like the same product)
    const isMatch = (product.uploaded_by === currentUserId && product.swipes[otherUserId] === true) ||
                   (product.uploaded_by === otherUserId && product.swipes[currentUserId] === true)
    
    if (isMatch) {
      return 'match'
    }
    
    // Check if current user has swiped
    const hasSwiped = product.swipes[currentUserId] !== undefined
    if (hasSwiped) {
      return product.swipes[currentUserId] === true ? 'match' : 'rejected'
    }
    
    return 'pending'
  }

  // Filter products by state
  const filterProductsByState = (products: Product[], state: 'all' | 'match' | 'rejected' | 'pending', currentUserId: string) => {
    if (state === 'all') return products
    
    return products.filter(product => {
      const productState = getProductState(product, currentUserId)
      return productState === state
    })
  }

  // Product filtering functions
  const getFilteredProducts = () => {
    let filtered = products
    
    // This function is used for the swipe view, so we'll use matches filters
    // Filter by owner
    if (matchesOwner !== 'all') {
      const databaseUserId = mapUserToDatabaseId(user?.email || "")
      if (matchesOwner === 'me') {
        filtered = filtered.filter(product => product.uploaded_by === databaseUserId)
      } else if (matchesOwner === 'partner') {
        filtered = filtered.filter(product => product.uploaded_by !== databaseUserId)
      }
    }
    
    // Filter by product type
    if (matchesProductType) {
      filtered = filtered.filter(product => product.product_type === matchesProductType)
    }
    
    return filtered
  }

  const getFilteredMatches = () => {
    const matches = getMatchedProducts()
    let filtered = matches
    
    // Filter by owner
    if (matchesOwner !== 'all') {
      const databaseUserId = mapUserToDatabaseId(user?.email || "")
      if (matchesOwner === 'me') {
        filtered = filtered.filter(product => product.uploaded_by === databaseUserId)
      } else if (matchesOwner === 'partner') {
        filtered = filtered.filter(product => product.uploaded_by !== databaseUserId)
      }
    }
    
    // Filter by product type
    if (matchesProductType) {
      filtered = filtered.filter(product => product.product_type === matchesProductType)
    }
    
    return filtered
  }

  // Context-aware filtering functions
  const getContextualProductTypes = (productList: Product[]) => {
    const typeCounts: Record<string, number> = {}
    productList.forEach(product => {
      typeCounts[product.product_type] = (typeCounts[product.product_type] || 0) + 1
    })
    return typeCounts
  }

  const getContextualMatchingTypes = (productList: Product[]) => {
    const user1Types = getYourProducts().map(p => p.product_type)
    const user2Types = getPartnerProducts().map(p => p.product_type)
    const commonTypes = user1Types.filter(type => user2Types.includes(type))
    
    // Only return types that exist in the current product list
    return commonTypes.filter(type => 
      productList.some(product => product.product_type === type)
    )
  }

  const getContextualTypeStats = (productList: Product[]) => {
    const stats: Record<string, number> = {}
    productList.forEach(product => {
      stats[product.product_type] = (stats[product.product_type] || 0) + 1
    })
    return stats
  }

  // Product type statistics
  const getProductTypeStats = () => {
    const stats: Record<string, number> = {}
    const matches = getMatchedProducts()
    
    matches.forEach(product => {
      stats[product.product_type] = (stats[product.product_type] || 0) + 1
    })
    
    return stats
  }

  const getMatchingProductTypes = () => {
    const user1Types = getYourProducts().map(p => p.product_type)
    const user2Types = getPartnerProducts().map(p => p.product_type)
    return user1Types.filter(type => user2Types.includes(type))
  }

  // Iframe handlers
  const openIframe = (url: string, productTitle?: string) => {
    setIframeState({
      isOpen: true,
      url,
      productTitle: productTitle || null,
    })
  }

  const openExternal = (url: string) => {
    window.open(url, '_blank')
  }

  const closeIframe = () => {
    setIframeState({
      isOpen: false,
      url: null,
      productTitle: null,
    })
  }

  const goBackFromIframe = () => {
    setIframeState({
      isOpen: false,
      url: null,
      productTitle: null,
    })
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

  const handleProductTypeChange = async (productId: string, newType: string) => {
    try {
      // Update local state immediately for better UX
      setProducts((prev) => 
        prev.map((product) => 
          product.id === productId 
            ? { ...product, product_type: newType }
            : product
        )
      )
      
      console.log(`Product ${productId} type updated to ${newType}`)
    } catch (error) {
      console.error('Error updating product type:', error)
      // Revert the local state change on error
      setProducts((prev) => 
        prev.map((product) => 
          product.id === productId 
            ? { ...product, product_type: product.product_type }
            : product
        )
      )
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
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Product Added! 🎉
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Your furniture item has been added successfully and is now waiting for your partner's review!
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
          <Button
            onClick={() => {
              setNewProductUrl("")
              setShowSuccess(false)
              setRecentlyAddedProduct(null)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            Add Another Item
          </Button>
          {recentlyAddedProduct && (
            <Button
              variant="outline"
              onClick={() => {
                openIframe(recentlyAddedProduct.url, recentlyAddedProduct.title)
              }}
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-medium"
            >
              View Item
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  const MatchCelebration = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
          <Heart className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          It's a Match! 💕
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          You both liked the same furniture! Check your matches to see it.
        </p>
        <Button
          onClick={() => {
            setShowMatch(false)
            setCurrentView("matched")
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          View Matches
        </Button>
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
              className={`absolute inset-0 ${index === 0 ? "z-10" : "z-0"} shadow-2xl no-select touch-manipulation border-0 bg-white/90 backdrop-blur-sm overflow-hidden`}
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
                {/* Enhanced Image Section */}
                <div className="relative flex-1 min-h-0 bg-gradient-to-br from-gray-50 to-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300"
                    onClick={() => openIframe(product.url, product.title)}
                    onError={(e) => {
                      console.error("Image failed to load:", product.image)
                      e.currentTarget.src = "/placeholder.svg?height=400&width=300&query=furniture"
                    }}
                  />
                  
                  {/* Enhanced Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant="secondary" 
                      className="text-xs font-medium bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700"
                    >
                      {product.uploaded_by === "user1" ? "You" : "Partner"}
                    </Badge>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Enhanced Content Section */}
                <div className="p-4 flex-shrink-0 bg-white space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg leading-tight flex-1 mr-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.title}
                      </h3>
                      {product.retailer && (
                        <Badge variant="outline" className="text-xs flex-shrink-0 bg-purple-50 border-purple-200 text-purple-700">
                          {product.retailer}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>

                  {/* Enhanced View Product Button */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openIframe(product.url, product.title)}
                      className="w-full h-9 text-sm border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                    >
                      View Product
                    </Button>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 bg-transparent h-10 active:bg-red-100 touch-manipulation hover:border-red-300"
                      onClick={(e) => handleButtonClick(product.id, false, e)}
                      onTouchEnd={(e) => handleButtonTouch(product.id, false, e)}
                    >
                      <X className="h-5 w-5 mr-2" />
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 h-10 active:bg-green-800 touch-manipulation shadow-lg"
                      onClick={(e) => handleButtonClick(product.id, true, e)}
                      onTouchEnd={(e) => handleButtonTouch(product.id, true, e)}
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      Like
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-4">
          <div className="text-6xl mb-4">🪑</div>
          <h3 className="text-lg font-semibold mb-3">No items to review</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {products.length === 0
              ? "Add some furniture items to get started!"
              : "You've reviewed all available items!"}
          </p>
          <Button
            onClick={() => setCurrentView("add")}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 shadow-lg"
            size="sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Furniture Item
          </Button>
        </div>
      )}
    </div>
  )

  const MatchesView = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const filteredMatches = useMemo(() => getFilteredMatches(), [products, matchesProductType, matchesOwner])
    
    // Context-aware data for matches tab
    const matchesProductTypes = useMemo(() => getContextualProductTypes(filteredMatches), [filteredMatches])
    
    // Filtered products for each tab
    const filteredYourProducts = useMemo(() => {
      let filtered = getYourProducts()
      if (yoursProductType) {
        filtered = filtered.filter(product => product.product_type === yoursProductType)
      }
      if (yoursState !== 'all') {
        filtered = filterProductsByState(filtered, yoursState, mapUserToDatabaseId(user?.email || ""))
      }
      return filtered
    }, [products, yoursProductType, yoursState, user?.email])
    
    const filteredPartnerProducts = useMemo(() => {
      let filtered = getPartnerProducts()
      if (partnersProductType) {
        filtered = filtered.filter(product => product.product_type === partnersProductType)
      }
      if (partnersState !== 'all') {
        filtered = filterProductsByState(filtered, partnersState, mapUserToDatabaseId(user?.email || ""))
      }
      return filtered
    }, [products, partnersProductType, partnersState, user?.email])
    
    // Preserve scroll position when products change
    useEffect(() => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollTop
          }
        })
      }
    }, [products])
    
    return (
      <div className="max-w-sm mx-auto h-full overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'matches' | 'yours' | 'partners')} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="matches" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Matches ({filteredMatches.length})
            </TabsTrigger>
            <TabsTrigger 
              value="yours" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Yours ({filteredYourProducts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Partners ({filteredPartnerProducts.length})
            </TabsTrigger>
          </TabsList>

        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <TabsContent value="matches" className="space-y-4 mt-0 pb-4">
            {filteredMatches.length > 0 ? (
              <div className="space-y-4">
                {/* Unified Filter */}
                <UnifiedFilter
                  selectedType={matchesProductType}
                  onTypeChange={setMatchesProductType}
                  selectedOwner={matchesOwner}
                  onOwnerChange={setMatchesOwner}
                  context="matches"
                  availableProductTypes={matchesProductTypes}
                  className="mb-4 p-3 bg-gray-50 rounded-lg"
                />
                
                {/* Filtered Products */}
                {filteredMatches.map((product) => (
                  <EnhancedProductCard
                    key={product.id}
                    product={product}
                    currentUserId={mapUserToDatabaseId(user?.email || "")}
                    onViewProduct={openIframe}
                    onDelete={handleDeleteProduct}
                    onTypeChange={handleProductTypeChange}
                    variant="compact"
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">💕</div>
                <h3 className="text-base font-semibold mb-2">
                  {matchesProductType ? 'No matches for this type' : 'No matches yet'}
                </h3>
                <p className="text-gray-600 px-4 text-sm">
                  {matchesProductType 
                    ? 'Try selecting a different product type or keep swiping to find more matches!'
                    : 'Keep swiping to find items you both love!'
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="yours" className="space-y-4 mt-0 pb-4">
            {filteredYourProducts.length > 0 ? (
              <div className="space-y-4">
                {/* Unified Filter for Yours tab */}
                <UnifiedFilter
                  selectedType={yoursProductType}
                  onTypeChange={setYoursProductType}
                  selectedOwner="all"
                  onOwnerChange={() => {}} // No-op since owner filter doesn't apply to "yours" tab
                  selectedState={yoursState}
                  onStateChange={setYoursState}
                  context="yours"
                  availableProductTypes={getContextualProductTypes(filteredYourProducts)}
                  className="mb-4 p-3 bg-gray-50 rounded-lg"
                />
                
                                {filteredYourProducts.map((product) => (
                  <EnhancedProductCard
                    key={product.id}
                    product={product}
                    currentUserId={mapUserToDatabaseId(user?.email || "")}
                    onViewProduct={openIframe}
                    onDelete={handleDeleteProduct}
                    onTypeChange={handleProductTypeChange}
                    variant="compact"
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📦</div>
                <h3 className="text-base font-semibold mb-2">No items added yet</h3>
                <p className="text-gray-600 px-4 text-sm">Add some furniture items to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-4 mt-0 pb-4">
            {filteredPartnerProducts.length > 0 ? (
              <div className="space-y-4">
                {/* Unified Filter for Partners tab */}
                <UnifiedFilter
                  selectedType={partnersProductType}
                  onTypeChange={setPartnersProductType}
                  selectedOwner="all"
                  onOwnerChange={() => {}} // No-op since owner filter doesn't apply to "partners" tab
                  selectedState={partnersState}
                  onStateChange={setPartnersState}
                  context="partners"
                  availableProductTypes={getContextualProductTypes(filteredPartnerProducts)}
                  className="mb-4 p-3 bg-gray-50 rounded-lg"
                />
                
                                {filteredPartnerProducts.map((product) => (
                  <EnhancedProductCard
                    key={product.id}
                    product={product}
                    currentUserId={mapUserToDatabaseId(user?.email || "")}
                    onViewProduct={openIframe}
                    onSwipe={handleSwipe}
                    onTypeChange={handleProductTypeChange}
                    variant="compact"
                    showActions={true}
                  />
                ))}
              </div>
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
  }

  return (
    <ProtectedRoute>
      <div className="h-mobile-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col overflow-hidden">
        {/* Enhanced Header - Fixed */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 flex-shrink-0 safe-area-top">
          <div className="flex items-center justify-between p-3">
            {currentView !== "swipe" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setCurrentView("swipe")
                  setShowSuccess(false)
                  setRecentlyAddedProduct(null)
                }} 
                className="p-2 hover:bg-purple-50 text-purple-600"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-800 text-base">FurnitureMatch</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="text-xs h-8 px-3 border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600"
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
              <div className="max-w-sm mx-auto pt-6">
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">Add Furniture Item</h2>
                      <p className="text-gray-600 text-sm">Share a furniture item with your partner</p>
                    </div>
                    
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : showSuccess ? (
                      <ProductAddedMessage />
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Product URL</label>
                          <Input
                            type="url"
                            placeholder="https://example.com/furniture-item"
                            value={newProductUrl}
                            onChange={(e) => setNewProductUrl(e.target.value)}
                            className="w-full h-12 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
                          />
                          <p className="text-xs text-gray-500 mt-1">Paste a link to any furniture item you'd like to share</p>
                        </div>
                        <Button
                          onClick={addProduct}
                          disabled={!newProductUrl.trim() || isLoading}
                          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg"
                          size="sm"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </>
                          )}
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

          {/* Enhanced Bottom Navigation - Fixed */}
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg flex-shrink-0 safe-area-bottom">
            <div className="flex justify-center gap-2 p-3 max-w-sm mx-auto">
              <Button
                variant={currentView === "swipe" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setCurrentView("swipe")
                  setShowSuccess(false)
                  setRecentlyAddedProduct(null)
                }}
                className={`flex-1 h-12 text-sm font-medium transition-all duration-200 ${
                  currentView === "swipe" 
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg" 
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <Heart className={`h-4 w-4 mr-2 ${currentView === "swipe" ? "text-white" : "text-gray-500"}`} />
                Swipe
              </Button>
              <Button
                variant={currentView === "add" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setCurrentView("add")
                  setShowSuccess(false)
                  setRecentlyAddedProduct(null)
                }}
                className={`flex-1 h-12 text-sm font-medium transition-all duration-200 ${
                  currentView === "add" 
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg" 
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <Plus className={`h-4 w-4 mr-2 ${currentView === "add" ? "text-white" : "text-gray-500"}`} />
                Add Item
              </Button>
              <Button
                variant={currentView === "matched" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setCurrentView("matched")
                  setShowSuccess(false)
                  setRecentlyAddedProduct(null)
                }}
                className={`flex-1 h-12 text-sm font-medium transition-all duration-200 ${
                  currentView === "matched" 
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg" 
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <List className={`h-4 w-4 mr-2 ${currentView === "matched" ? "text-white" : "text-gray-500"}`} />
                Matches
              </Button>
            </div>
          </div>
        </div>

        {/* Iframe Modal */}
        <IframeModal
          isOpen={iframeState.isOpen}
          url={iframeState.url}
          productTitle={iframeState.productTitle || undefined}
          onClose={closeIframe}
          onBack={goBackFromIframe}
          onViewExternal={openExternal}
        />
      </div>
    </ProtectedRoute>
  )
}
