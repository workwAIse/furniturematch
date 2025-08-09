# Favorites, Conflicts, and Compare Overlay (Collaboration Board)

## Overview
Introduce Favorites on the Collaboration Board with automatic category grouping, conflict surfacing, and a 1-vs-1 "winner-stays" CompareOverlay. Persist progress locally so users can resume comparisons across sessions. Toggle between Board and Moodboard views without losing state.

## Goals (Must-Have)
- Board ↔ Moodboard toggle on the Collaboration Board; state persists across reloads.
- Auto category grouping for matched items (e.g., Chair, Sofa, Table).
- Conflict surfacing: if a category has >1 matched item, show a subtle conflict badge (count).
- 1-vs-1 CompareOverlay (started from a conflict badge):
  - Exactly two items on screen at any time.
  - Tap to choose winner; winner stays, next challenger appears.
  - Continue until one Favorite remains for that category.
- Favorites category pinned on top of the board and visible in Moodboard.
- Losers remain in Matched (not archived/deleted). They simply aren’t the current Favorite.
- Persist state (local-first); resume ongoing comparisons across sessions.
- Accessible + mobile-first UX with smooth micro-animations.
- Reopen decision: via favorite item menu; on reopen, favorite is cleared and bracket re-created (winner-stays anew).

## Definitions
- Matched items: Products both users liked (existing logic).
- Category: Product type (e.g., chair/sofa/table) from `product.product_type`.
- Conflict: A category with >1 matched item.
- Favorite: The single, current winner for a category after comparison.
- CompareOverlay: Fullscreen/mobile-first overlay that runs a winner-stays tournament among items of a conflicted category until one remains.

## UX Scope
### 1) Board ↔ Moodboard Toggle
- Toggle control at the top of the Collaboration Board. Persist the last selected view in local storage.
- Switching views must not reset compare progress or favorites.

### 2) Auto Category Grouping
- Group matched items by `product_type`.
- Show a small category header with badge
  - If count > 1: show conflict badge with count; clicking opens CompareOverlay.

### 3) Conflict Badge
- Subtle, compact badge (e.g., "Conflict: 3") next to the category header.
- Badge opens the CompareOverlay for that category.

### 4) CompareOverlay (Winner-Stays)
- Always display exactly two items on screen.
- User taps an item to choose the winner.
- Winner remains; next challenger auto-loads.
- When one remains, that item becomes the Favorite for the category and compare ends.
- Accessible:
  - Keyboard focus trap, Enter/Space select, Arrow keys to move focus.
  - Screen-reader labels announce "Choose winner" with product title.
- Mobile-first:
  - Fullscreen overlay, large tap targets, smooth transitions.

### 5) Favorites Pinned Row
- Favorites render in a pinned row at the top across Board and appear in Moodboard.
- When a Favorite exists, the conflict badge for that category disappears.

### 6) Reopen Decision
- Kebab/menu on a favorite item: "Reopen decision".
- On confirm: clear favorite for that category, rebuild compare bracket from all matched items in that category, and reopen CompareOverlay.

### 7) Losers Remain in Matched
- Non-winning items remain visible in their category and in Moodboard; they are not deleted/archived.

## State & Persistence
- Local-first persistence via `localStorage` (MVP) with optional upgrade path to IndexedDB.
- Suggested keys (namespaced):
  - `fm:view` → "board" | "moodboard"
  - `fm:favorites` → `{ [categoryId: string]: productId }`
  - `fm:compareQueue:{categoryId}` → `string[]` remaining challenger product IDs (head-to-head order)
  - `fm:currentWinner:{categoryId}` → `string | null` (null if starting fresh)
  - `fm:lastUpdated` → ISO timestamp for basic staleness checks
- Resume logic:
  - If `compareQueue` not empty, CompareOverlay continues where left off.
  - If a `currentWinner` exists and queue is empty, set Favorite.

## Data Model Additions (App State)
- In `app/page.tsx` (or extracted store):
  - `view: 'board' | 'moodboard'`
  - `favoritesByCategory: Record<string, string /*productId*/>`
  - `compareStateByCategory: { [categoryId: string]: { currentWinner: string | null; queue: string[] } }`
- No DB schema changes required for MVP (local-first). Potential server sync can be added later.

## Interaction Flows
1) Enter Board → categories grouped → badges indicate conflicts.
2) Tap conflict badge → CompareOverlay opens with two items.
3) User picks winner → winner stays; next challenger loads from queue.
4) Queue empty → winner becomes Favorite → pinned row updates → conflict badge disappears.
5) Reopen decision on a Favorite → clear favorite → rebuild queue from all matched in category → overlay opens.
6) Toggle to Moodboard → all state persists; favorites shown; losers still visible.

## Accessibility & Motion
- Keyboard: Tab/Shift+Tab cycle, Arrow keys to move selection; Enter/Space to choose.
- ARIA: role="dialog" for overlay, aria-labelledby, aria-describedby, focus trap.
- Motion: 150–250ms scale/slide transitions, prefers-reduced-motion respected.

## Testing (Must Add)
- Unit: grouping by category; conflict detection; winner-stays logic (queue progression); reopen resets state.
- Integration: CompareOverlay interaction; pinned favorites; toggle persistence across reloads.
- E2E (if available): multi-session resume, mobile tap targets, accessibility checks.

## Open Questions
1) Category source of truth: use existing `product.product_type` as-is, or normalize to a canonical set (e.g., via `ProductTypeDetector`)?
2) Ordering of challengers: deterministic (e.g., stable sort by added date/price/title) or random?
3) Tie-handling: If a user wants to skip/undecide between two items—should we support a "skip" or "compare later"?
4) Reopen scope: When reopening, include all matched items for that category (including the last favorite) or exclude the last favorite until the end?
5) Persistence scope: strictly local-only for now, or mirror to DB for cross-device continuity? If mirrored, whose favorite is it (per-user vs shared)?
6) Moodboard content: Should Moodboard show all matched items (grouped) plus the pinned favorites on top, or a curated layout? Any layout guidelines?
7) Conflict badge placement: at category header only, or also inline per-card?
8) Badge style: desired exact copy/colors to match current design system?
9) Mobile gestures: Allow swipe-to-select in CompareOverlay, or tap-only?
10) Permission model: Can both collaborators set favorites, or is there a single shared favorite per category? How to resolve simultaneous decisions?

## Acceptance Criteria (MVP)
- Category groups render for matched items; conflicts show a badge with count > 1.
- Clicking a conflict opens CompareOverlay with exactly two items.
- Selecting winners advances until a single Favorite remains; favorite is pinned and visible in Moodboard; losers remain visible.
- Board ↔ Moodboard toggles persist across reloads; compare/favorite state resumes after reload.
- Reopening a decision clears the favorite and restarts the compare flow for that category.
- Basic accessibility and mobile-first interaction are implemented.
