"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Eye, ExternalLink } from 'lucide-react'

interface OpenLinkControlProps {
  url: string
  title?: string
  onOpenModal?: (url: string, title?: string) => void
  className?: string
  size?: 'sm' | 'default'
  label?: string
}

export function OpenLinkControl({ url, title, onOpenModal, className = '', size = 'default', label = 'View' }: OpenLinkControlProps) {
  const handlePrimary = (e: React.MouseEvent<HTMLButtonElement>) => {
    // One-click modal. Modifier-click opens a new tab for power users
    if (e.metaKey || e.ctrlKey) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    onOpenModal?.(url, title)
  }

  const handleOpenNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Button onClick={handlePrimary} className="bg-purple-600 hover:bg-purple-700 text-white" size={size}>
        <Eye className="h-4 w-4 mr-2" /> {label}
      </Button>
      <Button
        variant="outline"
        size={size}
        className="px-2"
        onClick={handleOpenNewTab}
        aria-label="Open in new tab"
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  )
}


