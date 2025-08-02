"use client"

import { useEffect, useRef, useState } from "react"

interface IframeContentProps {
  url: string | null
  onLoad: () => void
  onError: (error: any) => void
}

export function IframeContent({ url, onLoad, onError }: IframeContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!url) return

    const iframe = iframeRef.current
    if (!iframe) return

    // Reset state
    setHasLoaded(false)

    // Set up load handler
    const handleLoad = () => {
      console.log("Iframe loaded successfully")
      setHasLoaded(true)
      if (loadTimeout) {
        clearTimeout(loadTimeout)
        setLoadTimeout(null)
      }
      onLoad()
    }

    // Set up error handler
    const handleError = (event: Event) => {
      console.error("Iframe load error:", event)
      if (loadTimeout) {
        clearTimeout(loadTimeout)
        setLoadTimeout(null)
      }
      onError(new Error("Failed to load iframe content"))
    }

    // Set up timeout to detect connection issues (shorter timeout for better UX)
    const timeout = setTimeout(() => {
      if (!hasLoaded) {
        console.log("Iframe load timeout - likely blocked or connection refused")
        onError(new Error("Connection refused or content blocked"))
      }
    }, 5000) // 5 second timeout for faster fallback

    setLoadTimeout(timeout)

    // Add event listeners
    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    // Clean up
    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
    }
  }, [url, onLoad, onError, hasLoaded, loadTimeout])

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">No URL provided</p>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full h-full border-0"
      title="Product page"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        console.error("Iframe onError event:", e)
        onError(new Error("Iframe failed to load"))
      }}
    />
  )
} 