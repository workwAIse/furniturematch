"use client"

import { useEffect, useRef } from "react"

interface IframeContentProps {
  url: string | null
  onLoad: () => void
  onError: (error: any) => void
}

export function IframeContent({ url, onLoad, onError }: IframeContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!url) return

    const iframe = iframeRef.current
    if (!iframe) return

    // Set up load handler
    const handleLoad = () => {
      onLoad()
    }

    // Set up error handler
    const handleError = (event: Event) => {
      console.error("Iframe load error:", event)
      onError(new Error("Failed to load iframe content"))
    }

    // Add event listeners
    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    // Clean up
    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [url, onLoad, onError])

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
    />
  )
} 