"use client"
import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getUserStats } from '@/lib/gamification'

export function StreakBadge({ userId }: { userId: string }) {
  const [streak, setStreak] = useState<number>(0)
  useEffect(() => {
    if (!userId) return
    getUserStats(userId).then(s => setStreak(s.current_streak)).catch(() => {})
  }, [userId])
  if (!userId) return null
  return (
    <Badge className="gap-1 bg-orange-500/90 text-white">
      <Flame className="h-3.5 w-3.5" /> {streak} day{streak === 1 ? '' : 's'}
    </Badge>
  )
}


