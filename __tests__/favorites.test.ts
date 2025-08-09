import { buildInitialCompareState, advanceComparison, groupMatchedByCategory, getConflictCounts } from '../lib/favorites'

const mk = (id: string, type = 'chair') => ({
  id,
  url: '',
  image: '',
  title: id,
  description: '',
  uploaded_by: 'user1',
  swipes: { user1: true, user2: true },
  product_type: type,
})

describe('favorites utilities', () => {
  test('groupMatchedByCategory groups by product_type', () => {
    const items = [mk('a', 'chair'), mk('b', 'chair'), mk('c', 'table')]
    const grouped = groupMatchedByCategory(items as any)
    expect(Object.keys(grouped)).toEqual(['chair', 'table'])
    expect(grouped['chair'].length).toBe(2)
    expect(grouped['table'].length).toBe(1)
  })

  test('getConflictCounts detects categories with >1 items', () => {
    const items = [mk('a', 'chair'), mk('b', 'chair'), mk('c', 'table')]
    const grouped = groupMatchedByCategory(items as any)
    const conflicts = getConflictCounts(grouped)
    expect(conflicts['chair']).toBe(2)
    expect(conflicts['table']).toBeUndefined()
  })

  test('buildInitialCompareState sets first as current winner and rest as queue', () => {
    const items = [mk('a'), mk('b'), mk('c')]
    const state = buildInitialCompareState(items as any)
    expect(state.currentWinnerId).toBeDefined()
    expect(state.queue.length).toBe(2)
  })

  test('advanceComparison advances winner-stays until done', () => {
    const items = [mk('a'), mk('b'), mk('c')]
    let state = buildInitialCompareState(items as any)
    const firstWinner = state.currentWinnerId!
    // first matchup: pick current winner
    let res = advanceComparison(state, firstWinner)
    state = res.state
    // second matchup: pick (current or challenger)
    const secondPick = state.currentWinnerId!
    res = advanceComparison(state, secondPick)
    expect(res.done).toBe(true)
    expect(res.state.queue.length).toBe(0)
    expect(res.state.currentWinnerId).toBeDefined()
  })
})


