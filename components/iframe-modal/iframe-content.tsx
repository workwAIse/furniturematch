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
  const [attempt, setAttempt] = useState(0)

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
  }, [url, onLoad, onError, hasLoaded, loadTimeout, attempt])

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">No URL provided</p>
      </div>
    )
  }

  // Try different approaches based on attempt number
  const getIframeProps = () => {
    const baseProps = {
      ref: iframeRef,
      className: "w-full h-full border-0",
      title: "Product page",
      loading: "lazy" as const,
      onError: (e: any) => {
        console.error("Iframe onError event:", e)
        onError(new Error("Iframe failed to load"))
      }
    }

    // First attempt: Standard iframe
    if (attempt === 0) {
      return {
        ...baseProps,
        src: url,
        sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
        referrerPolicy: "no-referrer" as const
      }
    }

    // Second attempt: Try with different referrer policy
    if (attempt === 1) {
      return {
        ...baseProps,
        src: url,
        sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
        referrerPolicy: "origin" as const
      }
    }

    // Third attempt: Minimal sandbox
    if (attempt === 2) {
      return {
        ...baseProps,
        src: url,
        sandbox: "allow-scripts allow-forms",
        referrerPolicy: "no-referrer" as const
      }
    }

    // Default fallback
    return {
      ...baseProps,
      src: url,
      sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
      referrerPolicy: "no-referrer" as const
    }
  }

  return (
    <iframe {...getIframeProps()} />
  )
} 