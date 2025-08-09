import type { Product } from './supabase'

export interface CompareState {
  currentWinnerId: string | null
  queue: string[]
}

export interface GroupedByCategory {
  [category: string]: Product[]
}

export function groupMatchedByCategory(products: Product[]): GroupedByCategory {
  return products.reduce<GroupedByCategory>((acc, product) => {
    const category = product.product_type || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {})
}

export function getConflictCounts(grouped: GroupedByCategory): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [category, items] of Object.entries(grouped)) {
    if (items.length > 1) result[category] = items.length
  }
  return result
}

export function buildInitialCompareState(products: Product[], deterministic: boolean = true): CompareState {
  // Deterministic ordering by created_at ascending if present, else stable order
  const ordered = [...products]
  if (deterministic) {
    ordered.sort((a, b) => {
      const aDate = (a as any).created_at ? Date.parse((a as any).created_at as string) : 0
      const bDate = (b as any).created_at ? Date.parse((b as any).created_at as string) : 0
      return aDate - bDate
    })
  }
  const first = ordered[0]
  const rest = ordered.slice(1)
  return {
    currentWinnerId: first ? first.id : null,
    queue: rest.map((p) => p.id),
  }
}

export interface AdvanceResult {
  state: CompareState
  done: boolean
}

export function advanceComparison(state: CompareState, pickedWinnerId: string): AdvanceResult {
  const { currentWinnerId, queue } = state
  if (!currentWinnerId) {
    // No current winner, pick becomes current
    if (queue.length === 0) {
      return { state: { currentWinnerId: pickedWinnerId, queue: [] }, done: true }
    }
    return { state: { currentWinnerId: pickedWinnerId, queue: [...queue] }, done: false }
  }

  // Next challenger is head of queue
  const [challengerId, ...rest] = queue
  if (!challengerId) {
    // No challenger; selecting winner finalizes
    return { state: { currentWinnerId: pickedWinnerId, queue: [] }, done: true }
  }

  const winnerStays = pickedWinnerId === currentWinnerId || pickedWinnerId === challengerId
  if (!winnerStays) {
    // Invalid pick; keep state
    return { state, done: queue.length === 0 }
  }

  const nextWinner = pickedWinnerId
  const nextQueue = rest
  const done = nextQueue.length === 0
  return { state: { currentWinnerId: nextWinner, queue: nextQueue }, done }
}

export function findProductById(products: Product[], id: string | null): Product | undefined {
  if (!id) return undefined
  return products.find((p) => p.id === id)
}


