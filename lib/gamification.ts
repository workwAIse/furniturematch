import { supabase } from './supabase'

export type GamificationAction = 'add' | 'swipe'

export interface UserStats {
  user_id: string
  current_streak: number
  longest_streak: number
  last_action_date: string | null
  total_adds: number
  total_swipes: number
}

const MS_PER_DAY = 86400000

const startOfUTCDate = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * MS_PER_DAY)
const isSameUTCDate = (a: Date, b: Date) => startOfUTCDate(a).getTime() === startOfUTCDate(b).getTime()

/**
 * Given the last action date (YYYY-MM-DD) and current time, compute next streak state.
 * Returns newCurrent: 1 (reset/start), 'increment' (consecutive), or null (same day no change).
 */
export function computeNewStreak(lastActionDateISO: string | null, now: Date) {
  const today = startOfUTCDate(now)
  if (!lastActionDateISO) return { newCurrent: 1 as const, newLastDateISO: today.toISOString().slice(0, 10) }
  const last = new Date(lastActionDateISO + 'T00:00:00.000Z')
  if (isSameUTCDate(last, today)) return { newCurrent: null as const, newLastDateISO: lastActionDateISO }
  const yesterday = addDays(today, -1)
  if (isSameUTCDate(last, yesterday)) {
    return { newCurrent: 'increment' as const, newLastDateISO: today.toISOString().slice(0, 10) }
  }
  return { newCurrent: 1 as const, newLastDateISO: today.toISOString().slice(0, 10) }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('getUserStats error (reading):', error)
  }

  if (data) return data as UserStats

  const init: UserStats = {
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    last_action_date: null,
    total_adds: 0,
    total_swipes: 0,
  }
  const { error: insertErr } = await supabase.from('user_stats').insert([init])
  if (insertErr) {
    console.warn('getUserStats error (inserting init):', insertErr)
  }
  return init
}

async function upsertStatsForAction(userId: string, action: GamificationAction, productType?: string) {
  const stats = await getUserStats(userId)
  const now = new Date()
  const { newCurrent, newLastDateISO } = computeNewStreak(stats.last_action_date, now)

  let current_streak = stats.current_streak
  if (newCurrent === 1) current_streak = 1
  else if (newCurrent === 'increment') current_streak = stats.current_streak + 1

  const longest_streak = Math.max(stats.longest_streak, current_streak)
  const last_action_date = newLastDateISO ?? stats.last_action_date
  const total_adds = action === 'add' ? stats.total_adds + 1 : stats.total_adds
  const total_swipes = action === 'swipe' ? stats.total_swipes + 1 : stats.total_swipes

  // Event log (best-effort)
  await supabase.from('gamification_events').insert([{ user_id: userId, action, product_type: productType }])

  const updatePayload: Partial<UserStats> = { total_adds, total_swipes }
  if (newCurrent !== null) {
    updatePayload.current_streak = current_streak
    updatePayload.longest_streak = longest_streak
    updatePayload.last_action_date = last_action_date!
  }
  await supabase.from('user_stats').update(updatePayload).eq('user_id', userId)

  return { current_streak, longest_streak, total_adds, total_swipes }
}

async function alreadyHasBadge(userId: string, badgeId: string) {
  const { data } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle()
  return !!data
}

async function award(userId: string, badgeId: string) {
  await supabase.from('user_badges').insert([{ user_id: userId, badge_id: badgeId }])
  const { data } = await supabase.from('badges').select('*').eq('id', badgeId).single()
  return data
}

export async function recordAction(userId: string, action: GamificationAction, productType?: string) {
  const rolled = await upsertStatsForAction(userId, action, productType)
  const newBadges: any[] = []

  // Firsts
  if (action === 'add' && rolled.total_adds === 1 && !(await alreadyHasBadge(userId, 'first_add'))) {
    newBadges.push(await award(userId, 'first_add'))
  }
  if (action === 'swipe' && rolled.total_swipes === 1 && !(await alreadyHasBadge(userId, 'first_swipe'))) {
    newBadges.push(await award(userId, 'first_swipe'))
  }

  // Streak thresholds
  for (const [badgeId, threshold] of [
    ['streak_3', 3],
    ['streak_7', 7],
    ['streak_30', 30],
  ] as const) {
    if (rolled.current_streak >= threshold && !(await alreadyHasBadge(userId, badgeId))) {
      newBadges.push(await award(userId, badgeId))
    }
  }

  // Category explorers
  if (action === 'add' && productType) {
    const badgeId = evaluateCategoryBadge(productType)
    if (badgeId && !(await alreadyHasBadge(userId, badgeId))) {
      newBadges.push(await award(userId, badgeId))
    }
  }

  return { newBadges, stats: rolled }
}

export function evaluateCategoryBadge(productType?: string | null) {
  if (!productType) return null
  if (productType === 'desk') return 'desk_explorer'
  if (productType === 'chair') return 'chair_explorer'
  return null
}

export async function getUserBadges(userId: string) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('id, badge_id, earned_at, badges:badge_id ( id, name, description, icon )')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) {
    console.warn('getUserBadges error:', error)
    return []
  }
  // Normalize nested badge
  return (data || []).map((row: any) => ({
    id: row.id,
    badge_id: row.badge_id,
    earned_at: row.earned_at,
    badge: row.badges ? {
      id: row.badges.id,
      name: row.badges.name,
      description: row.badges.description,
      icon: row.badges.icon,
    } : undefined,
  }))
}


