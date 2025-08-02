"use client"

import { ExternalLink, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IframeFallbackProps {
  url: string | null
  productTitle?: string
  onOpenInNewTab: () => void
  onClose: () => void
}

export function IframeFallback({ 
  url, 
  productTitle, 
  onOpenInNewTab, 
  onClose 
}: IframeFallbackProps) {
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'Unknown site'
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Content Blocked
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            This website doesn't allow embedding in iframes for security reasons. 
            You can still view the product by opening it in a new tab.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExternalLink className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {productTitle || (url ? getDomainFromUrl(url) : 'Product Page')}
              </h4>
              {url && (
                <p className="text-xs text-gray-500 truncate mt-1">
                  {url}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onOpenInNewTab} 
            className="w-full"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Close
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Why is this blocked?</strong> Some websites use security headers 
              to prevent embedding in iframes. This is a common security practice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 