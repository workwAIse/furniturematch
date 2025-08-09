"use client"

import { useState, useEffect, useRef } from "react"
import { IframeHeader } from "./iframe-header"
import { IframeContent } from "./iframe-content"

interface IframeModalProps {
  isOpen: boolean
  url: string | null
  onClose: () => void
  onBack: () => void
  onViewExternal?: (url: string) => void
  productTitle?: string
}

export function IframeModal({ 
  isOpen, 
  url, 
  onClose, 
  onBack, 
  onViewExternal,
  productTitle 
}: IframeModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
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
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 overscroll-contain">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div
        ref={modalRef}
        className="relative w-full h-[100svh] md:h-auto md:max-h-[90svh] max-w-6xl bg-white rounded-none md:rounded-lg shadow-2xl overflow-hidden flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <IframeHeader
          productTitle={productTitle}
          url={url}
          onClose={onClose}
          onBack={onBack}
          isLoading={isLoading}
          onViewExternal={onViewExternal ? () => url && onViewExternal(url) : undefined}
        />

        <div className="flex-1 relative min-h-0">
          <IframeContent
            url={url}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  )
} 