"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Smartphone, Monitor, Globe } from "lucide-react"

interface IframeAlternativesProps {
  url: string
  productTitle?: string
  onOpenInNewTab: () => void
  onClose: () => void
}

export function IframeAlternatives({ 
  url, 
  productTitle, 
  onOpenInNewTab, 
  onClose 
}: IframeAlternativesProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const alternatives = [
    {
      id: "new-tab",
      title: "Open in New Tab",
      description: "Traditional approach - opens the product page in a new browser tab",
      icon: ExternalLink,
      action: onOpenInNewTab,
      color: "bg-blue-500"
    },
    {
      id: "mobile-view",
      title: "Mobile View",
      description: "Try to load as mobile browser (like Instagram's in-app browser)",
      icon: Smartphone,
      action: () => {
        // This would require a proxy service or server-side rendering
        console.log("Mobile view approach - would need proxy service")
        onOpenInNewTab()
      },
      color: "bg-green-500"
    },
    {
      id: "desktop-view",
      title: "Desktop View",
      description: "Load with desktop user agent (some sites allow this)",
      icon: Monitor,
      action: () => {
        // This would also need server-side handling
        console.log("Desktop view approach - would need server-side proxy")
        onOpenInNewTab()
      },
      color: "bg-purple-500"
    },
    {
      id: "web-view",
      title: "Web View Component",
      description: "Native WebView approach (like mobile apps use)",
      icon: Globe,
      action: () => {
        console.log("WebView approach - requires native app or Electron")
        onOpenInNewTab()
      },
      color: "bg-orange-500"
    }
  ]

  return (
    <div className="flex items-center justify-center h-full bg-gray-50 p-6">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Globe className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Content Blocked by Website
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            This website doesn't allow iframe embedding for security reasons. 
            Here are alternative ways to view the content:
          </p>
          
          {productTitle && (
            <div className="bg-white rounded-lg border p-4 mb-6">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {productTitle}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-1">
                {url}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3 mb-6">
          {alternatives.map((alt) => {
            const Icon = alt.icon
            return (
              <div
                key={alt.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === alt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedMethod(alt.id)
                  alt.action()
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alt.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {alt.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {alt.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onOpenInNewTab} 
            className="w-full"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab (Recommended)
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Close
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">Why is this blocked?</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <strong>X-Frame-Options:</strong> Website sets headers to prevent iframe embedding</p>
            <p>• <strong>Content Security Policy:</strong> frame-ancestors directive blocks embedding</p>
            <p>• <strong>Security:</strong> Prevents clickjacking and other attacks</p>
            <p>• <strong>Analytics:</strong> Website wants to track direct visits</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">How Social Media Apps Handle This:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>Instagram:</strong> Uses native WebView with custom headers</p>
            <p>• <strong>Facebook:</strong> Server-side proxy with user agent spoofing</p>
            <p>• <strong>Twitter:</strong> Custom browser component with special permissions</p>
            <p>• <strong>Mobile Apps:</strong> Native WebView bypasses some restrictions</p>
          </div>
        </div>
      </div>
    </div>
  )
} 