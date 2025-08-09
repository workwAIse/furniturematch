"use client"

import { useEffect, useState, useCallback } from 'react'

export type LinkOpenPreference = 'modal' | 'new-tab'

const STORAGE_KEY = 'fm.linkOpenPreference'

export function useLinkOpen() {
  const [preference, setPreferenceState] = useState<LinkOpenPreference>('modal')

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? (window.localStorage.getItem(STORAGE_KEY) as LinkOpenPreference | null) : null
      if (saved === 'modal' || saved === 'new-tab') {
        setPreferenceState(saved)
      }
    } catch {}
  }, [])

  const setPreference = useCallback((pref: LinkOpenPreference) => {
    setPreferenceState(pref)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, pref)
      }
    } catch {}
  }, [])

  const open = useCallback(
    (url: string, title: string | undefined, opts: { onOpenModal?: (url: string, title?: string) => void } = {}) => {
      if (preference === 'modal') {
        opts.onOpenModal?.(url, title)
      } else {
        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      }
    },
    [preference]
  )

  return { preference, setPreference, open }
}


