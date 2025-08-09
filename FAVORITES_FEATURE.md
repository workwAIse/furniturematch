# Favorites, Conflicts, and Compare Overlay (Collaboration Board)

## Overview
Introduce Favorites on the Collaboration Board with automatic category grouping, conflict surfacing, and a 1-vs-1 "winner-stays" CompareOverlay. Persist progress locally so users can resume comparisons across sessions. Toggle between Board and Moodboard views without losing state.

### Decisions (confirmed)
- Use category as saved in the product table (`product.product_type`).
- Challenger ordering: use the simplest deterministic approach (stable by created date or current list order).
- No tie/skip option in CompareOverlay.
- Reopen decision: clears the favorite and restarts a fresh bracket with all matched items in that category (including the previous favorite) – winner-stays anew.
- Persistence in DB and per-user: favorites and compare progress are stored per user.

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
- Persist in DB per user (with optional local caching for UX). Proposed tables:
  - `favorites(user_id, category, product_id, created_at, updated_at)` – unique on `(user_id, category)`
  - `compare_states(user_id, category, current_winner_id, queue UUID[], updated_at)` – unique on `(user_id, category)`
- Resume logic:
  - If `compare_states.queue` not empty, CompareOverlay continues where left off.
  - If `current_winner_id` exists and `queue` is empty, that item becomes Favorite.

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
Resolved:
1) Category source: use `product.product_type` as-is.
2) Ordering: simplest deterministic approach.
3) Tie/skip: No skip option.
4) Reopen scope: include all matched items (including previous favorite), start anew.
5) Persistence: in DB, per user.

Remaining:
6) Moodboard content layout guidance (if any beyond grouping + pinned favorites).
7) Conflict badge exact placement and copy.
8) Badge style details to match design system.
9) Mobile gestures beyond tap (stick to tap-only unless specified).
10) Simultaneous edits: if both collaborators can set their own favorites independently (per-user), no conflict; shared favorite behavior is out of scope.

## DB Persistence Plan (DDL Sketch)
```sql
-- Favorites: per-user favorite per category
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('user1','user2')),
  category VARCHAR(50) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category)
);

-- Compare state: resume in-progress comparisons per user/category
CREATE TABLE IF NOT EXISTS compare_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('user1','user2')),
  category VARCHAR(50) NOT NULL,
  current_winner_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  queue UUID[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category)
);

-- Triggers to maintain updated_at (reuses update_updated_at_column())
CREATE TRIGGER update_favorites_updated_at 
  BEFORE UPDATE ON favorites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compare_states_updated_at 
  BEFORE UPDATE ON compare_states 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## Acceptance Criteria (MVP)
- Category groups render for matched items; conflicts show a badge with count > 1.
- Clicking a conflict opens CompareOverlay with exactly two items.
- Selecting winners advances until a single Favorite remains; favorite is pinned and visible in Moodboard; losers remain visible.
- Board ↔ Moodboard toggles persist across reloads; compare/favorite state resumes after reload.
- Reopening a decision clears the favorite and restarts the compare flow for that category.
- Basic accessibility and mobile-first interaction are implemented.
