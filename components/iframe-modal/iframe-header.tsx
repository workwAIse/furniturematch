"use client"

import { ArrowLeft, X, ExternalLink, Eye, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IframeHeaderProps {
  productTitle?: string
  url: string | null
  onClose: () => void
  onBack: () => void
  onViewExternal?: () => void
  isLoading?: boolean
}

export function IframeHeader({ 
  productTitle, 
  url, 
  onClose, 
  onBack, 
  onViewExternal,
  isLoading = false 
}: IframeHeaderProps) {
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'Unknown site'
    }
  }

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank')
    }
    if (onViewExternal) {
      onViewExternal()
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
      {/* Left side - Back button and title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0 flex-shrink-0"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to FurnitureMatch</span>
        </Button>
        
        <div className="flex-1 min-w-0">
          <h2 
            id="iframe-modal-title"
            className="text-sm font-semibold text-gray-900 truncate"
          >
            {productTitle || (url ? getDomainFromUrl(url) : 'Product Page')}
          </h2>
          {url && (
            <p className="text-xs text-gray-500 truncate">
              {url}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* View Product (iframe) - Current view */}
        <Button
          variant="default"
          size="sm"
          className="h-8 px-3 text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          View Product
        </Button>

        {/* View External (new tab) */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleOpenInNewTab}
        >
          <Globe className="h-3 w-3 mr-1" />
          View External
        </Button>

        {/* Close */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </div>
  )
} 