"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IframeContentProps {
  url: string | null
  onLoad: () => void
  onError: (error: any) => void
}

export function IframeContent({ url, onLoad, onError }: IframeContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [proxyContent, setProxyContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    const loadContent = async () => {
      setIsLoading(true)
      setError(null)
      setProxyContent(null)
      try {
        const response = await fetch('/api/proxy-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        const data = await response.json()
        if (data.success && data.content) {
          setProxyContent(data.content)
          onLoad()
        } else {
          setError(data.error || "Failed to load content")
          onError(new Error(data.error || "Failed to load content"))
        }
      } catch (err) {
        const errorMsg = "Failed to load content"
        setError(errorMsg)
        onError(new Error(errorMsg))
      } finally {
        setIsLoading(false)
      }
    }
    loadContent()
  }, [url, onLoad, onError])

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">No URL provided</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 overflow-hidden">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading product page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-6">
          <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load content</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.open(url, '_blank')} 
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    )
  }

  if (proxyContent) {
    return (
      <iframe
        ref={iframeRef}
        srcDoc={proxyContent}
        className="w-full h-full border-0 overflow-auto"
        title="Product page"
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    )
  }

  return null
} 