"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { getUserStats } from '@/lib/gamification'
import { getBestStreakBadgeId, getBadgeImage } from '@/lib/badge-assets'

export function StreakBadge({ userId }: { userId: string }) {
  const [streak, setStreak] = useState<number>(0)
  useEffect(() => {
    if (!userId) return
    getUserStats(userId).then(s => setStreak(s.current_streak)).catch(() => {})
  }, [userId])
  if (!userId) return null
  const streakBadgeId = getBestStreakBadgeId(streak)
  const streakImg = getBadgeImage(streakBadgeId)
  return streakImg ? (
    <div className="flex items-center gap-1">
      <Image src={streakImg.src} alt={streakImg.alt} width={20} height={20} />
      <Badge className="bg-orange-500/90 text-white">{streak} day{streak === 1 ? '' : 's'}</Badge>
    </div>
  ) : (
    <Badge className="gap-1 bg-orange-500/90 text-white">{streak} day{streak === 1 ? '' : 's'}</Badge>
  )
}


