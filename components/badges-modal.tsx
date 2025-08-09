"use client"
import { useEffect, useState } from 'react'
import { Award, Flame } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge as UIBadge } from '@/components/ui/badge'
import { getUserStats, getUserBadges } from '@/lib/gamification'

interface BadgesModalProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EarnedBadge {
  id: string
  badge_id: string
  earned_at: string
  badge?: { id: string; name: string; description: string; icon?: string }
}

export function BadgesModal({ userId, open, onOpenChange }: BadgesModalProps) {
  const [stats, setStats] = useState<{ current_streak: number; longest_streak: number } | null>(null)
  const [badges, setBadges] = useState<EarnedBadge[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      getUserStats(userId),
      getUserBadges(userId)
    ]).then(([s, b]) => {
      if (cancelled) return
      setStats({ current_streak: s.current_streak, longest_streak: s.longest_streak })
      setBadges(b)
    }).finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [open, userId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Your Badges
          </DialogTitle>
          <DialogDescription>
            Keep your streak alive and unlock new achievements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Flame className="h-4 w-4 text-orange-500" /> Current Streak
            </div>
            <UIBadge className="bg-orange-500/90 text-white">{stats?.current_streak ?? 0} days</UIBadge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Flame className="h-4 w-4 text-purple-600" /> Longest Streak
            </div>
            <UIBadge className="bg-purple-600/90 text-white">{stats?.longest_streak ?? 0} days</UIBadge>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Unlocked Badges</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No badges yet. Start by adding or swiping items.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3">
                {badges.map(b => (
                  <li key={b.id} className="flex items-center justify-between rounded-md border p-3 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="text-xl" aria-hidden>{b.badge?.icon ?? '🏅'}</div>
                      <div>
                        <div className="text-sm font-medium">{b.badge?.name ?? b.badge_id}</div>
                        <div className="text-xs text-muted-foreground">{b.badge?.description}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(b.earned_at).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


