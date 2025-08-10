"use client"
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { getUserStats } from '@/lib/gamification'
// removed mini image badge for a cleaner UI

export function StreakBadge({ userId, onClick }: { userId: string; onClick?: () => void }) {
  const [streak, setStreak] = useState<number>(0)
  useEffect(() => {
    if (!userId) return
    getUserStats(userId).then(s => setStreak(s.current_streak)).catch(() => {})
  }, [userId])
  if (!userId) return null
  return (
    <button type="button" onClick={onClick} aria-label={`${streak} day streak (view badges)`} className="inline-flex items-center">
      <Badge className="bg-orange-500/90 text-white whitespace-nowrap">{streak} day{streak === 1 ? '' : 's'}</Badge>
    </button>
  )
}


