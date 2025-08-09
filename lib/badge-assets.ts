export interface BadgeImage {
  src: string
  alt: string
}

const STATIC_BADGE_MAP: Record<string, BadgeImage> = {
  first_add: { src: '/badges/first_add.png', alt: 'First Add' },
  first_swipe: { src: '/badges/first_swipe.png', alt: 'First Swipe' },
  first_chair: { src: '/badges/first_chair.png', alt: 'First Chair' },
  first_table: { src: '/badges/first_table.png', alt: 'First Table' },
  first_lamp: { src: '/badges/first_lamp.png', alt: 'First Lamp' },
  first_bed: { src: '/badges/first_bed.png', alt: 'First Bed' },
  '5_swipes': { src: '/badges/5_swipes.png', alt: '5 Swipes' },
  streak_1: { src: '/badges/1_day_streak.png', alt: '1 Day Streak' },
  streak_3: { src: '/badges/3_day_streak.png', alt: '3 Day Streak' },
  streak_7: { src: '/badges/7_day_streak.png', alt: '7 Day Streak' },
  streak_30: { src: '/badges/30_day_streak.png', alt: '30 Day Streak' },
  // Map explorer-type ids to the closest available assets
  chair_explorer: { src: '/badges/first_chair.png', alt: 'Chair Explorer' },
}

export function getBadgeImage(badgeId: string | undefined | null): BadgeImage | undefined {
  if (!badgeId) return undefined
  if (STATIC_BADGE_MAP[badgeId]) return STATIC_BADGE_MAP[badgeId]

  // Handle generic patterns
  const streakMatch = /^streak_(\d+)$/.exec(badgeId)
  if (streakMatch) {
    const n = streakMatch[1]
    const candidate = STATIC_BADGE_MAP[`streak_${n}`]
    if (candidate) return candidate
    // Fallback to 1-day if specific asset missing
    return STATIC_BADGE_MAP['streak_1']
  }

  const firstType = /^first_(\w+)$/.exec(badgeId)
  if (firstType) {
    const type = firstType[1]
    const candidate = STATIC_BADGE_MAP[`first_${type}`]
    if (candidate) return candidate
  }

  return undefined
}

export function getBestStreakBadgeId(streak: number): string | undefined {
  if (streak >= 30) return 'streak_30'
  if (streak >= 7) return 'streak_7'
  if (streak >= 3) return 'streak_3'
  if (streak >= 1) return 'streak_1'
  return undefined
}


