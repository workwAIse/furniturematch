"use client"

import { useState, useEffect, useRef } from "react"
import { X, ArrowLeft, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IframeHeader } from "./iframe-header"
import { IframeContent } from "./iframe-content"
import { IframeFallback } from "./iframe-fallback"

interface IframeModalProps {
  isOpen: boolean
  url: string | null
  onClose: () => void
  onBack: () => void
  productTitle?: string
}

export function IframeModal({ 
  isOpen, 
  url, 
  onClose, 
  onBack, 
  productTitle 
}: IframeModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setIsBlocked(false)
      setError(null)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = (error: any) => {
    console.error("Iframe error:", error)
    setIsLoading(false)
    
    // Check if it's a blocking error
    if (error.message?.includes('X-Frame-Options') || 
        error.message?.includes('blocked') ||
        error.message?.includes('forbidden')) {
      setIsBlocked(true)
    } else {
      setError(error.message || "Failed to load content")
    }
  }

  const handleFallbackToNewTab = () => {
    if (url) {
      window.open(url, '_blank')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="iframe-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <IframeHeader
          productTitle={productTitle}
          url={url}
          onClose={onClose}
          onBack={onBack}
          isLoading={isLoading}
        />

        {/* Content */}
        <div className="flex-1 relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading product page...</p>
              </div>
            </div>
          )}

          {isBlocked ? (
            <IframeFallback
              url={url}
              productTitle={productTitle}
              onOpenInNewTab={handleFallbackToNewTab}
              onClose={onClose}
            />
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6">
                <div className="text-red-500 mb-4">
                  <ExternalLink className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Unable to load content</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button onClick={handleFallbackToNewTab} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button variant="outline" onClick={onClose} className="w-full">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <IframeContent
              url={url}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>
      </div>
    </div>
  )
} 