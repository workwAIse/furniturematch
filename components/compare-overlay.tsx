"use client"

import React, { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

interface CompareOverlayProps {
  isOpen: boolean
  category: string
  currentWinner: Product | undefined
  challenger: Product | undefined
  onPickWinner: (productId: string) => void
  onClose: () => void
}

export function CompareOverlay({ isOpen, category, currentWinner, challenger, onPickWinner, onClose }: CompareOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentWinner) onPickWinner(currentWinner.id)
      if (e.key === 'ArrowRight' && challenger) onPickWinner(challenger.id)
      if ((e.key === 'Enter' || e.key === ' ') && currentWinner) onPickWinner(currentWinner.id)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, currentWinner, challenger, onPickWinner, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={dialogRef} className="relative w-full h-[100svh] md:h-auto md:max-h-[90svh] max-w-6xl bg-white rounded-none md:rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-semibold">Choose your favorite • {category}</h2>
          <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 flex-1 overflow-y-auto">
          {[currentWinner, challenger].filter(Boolean).map((item) => (
            <button
              key={(item as Product).id}
              onClick={() => onPickWinner((item as Product).id)}
              className="text-left group"
              aria-label={`Choose ${item?.title ?? 'item'}`}
            >
              <Card className="overflow-hidden group-hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-gray-50 relative">
                    <img src={(item as Product).image} alt={(item as Product).title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-white font-semibold text-sm line-clamp-2">{(item as Product).title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="text-center text-xs text-gray-500 mt-2">Tap to choose</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


