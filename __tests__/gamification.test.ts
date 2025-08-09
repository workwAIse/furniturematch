import { computeNewStreak, evaluateCategoryBadge } from '@/lib/gamification'

describe('computeNewStreak', () => {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  it('starts at 1 when no previous', () => {
    const r = computeNewStreak(null, new Date('2025-01-10T12:00:00Z'))
    expect(r.newCurrent).toBe(1)
    expect(r.newLastDateISO).toBe('2025-01-10')
  })
  it('increments on consecutive day', () => {
    const today = new Date('2025-01-10T12:00:00Z')
    const yesterday = new Date('2025-01-09T12:00:00Z')
    const r = computeNewStreak(iso(yesterday), today)
    expect(r.newCurrent).toBe('increment')
    expect(r.newLastDateISO).toBe('2025-01-10')
  })
  it('resets if gap > 1 day', () => {
    const r = computeNewStreak('2025-01-07', new Date('2025-01-10T12:00:00Z'))
    expect(r.newCurrent).toBe(1)
  })
  it('does not double-count same day', () => {
    const r = computeNewStreak('2025-01-10', new Date('2025-01-10T18:00:00Z'))
    expect(r.newCurrent).toBeNull()
  })
})

describe('evaluateCategoryBadge', () => {
  it('maps desk/chair badges and returns null for others', () => {
    expect(evaluateCategoryBadge('desk')).toBe('desk_explorer')
    expect(evaluateCategoryBadge('chair')).toBe('chair_explorer')
    expect(evaluateCategoryBadge('sofa')).toBeNull()
    expect(evaluateCategoryBadge(undefined)).toBeNull()
  })
})


