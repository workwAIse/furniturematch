# Gamification: Streaks and Badges

## Overview

Add a lightweight gamification layer to FurnitureMatch to increase daily engagement and reward key behaviors. The system tracks daily activity streaks and awards badges for milestones (first actions, streak thresholds) and category-specific achievements (e.g., first desk, chair).

## Goals

- Encourage daily interaction via visible streaks
- Reward meaningful actions with badges
- Keep implementation minimal, reliable, and non-intrusive

## Core Concepts

- **Actions**: `add` (adding a product) and `swipe` (like/dislike)
- **Streak**: Count of consecutive active days (UTC-based) across either action
- **Badges**: One-time achievements unlocked by defined criteria

## Database Schema

Create `migration-gamification.sql` and run it in Supabase.

```sql
-- Gamification: events (audit), stats (rollup), badges (catalog), user_badges (earned)
CREATE TABLE IF NOT EXISTS gamification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('user1','user2')),
  action TEXT NOT NULL CHECK (action IN ('add','swipe')),
  product_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_g_events_user_date ON gamification_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY CHECK (user_id IN ('user1','user2')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_action_date DATE,
  total_adds INTEGER NOT NULL DEFAULT 0,
  total_swipes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB
);

INSERT INTO badges (id, name, description, icon) VALUES
('first_add','First Add','Added your first item','🏁'),
('first_swipe','First Swipe','Swiped your first item','👉'),
('streak_3','3-Day Streak','Active 3 days in a row','🔥'),
('streak_7','7-Day Streak','Active 7 days in a row','🔥'),
('streak_30','30-Day Streak','Active 30 days in a row','🔥'),
('desk_explorer','Desk Explorer','Added your first desk','🖥️'),
('chair_explorer','Chair Explorer','Added your first chair','🪑')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('user1','user2')),
  badge_id VARCHAR(64) NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  UNIQUE (user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
```

## App Integration

### Library

Create `lib/gamification.ts` with:

- Pure helpers to compute streak updates (UTC-day)
- `recordAction(userId, action, productType?)` to:
  - insert into `gamification_events`
  - update `user_stats` (current/longest streak, totals)
  - award badges idempotently and return newly unlocked ones

### UI Hooks

- In `app/page.tsx`:
  - On successful product add: `recordAction(userId, 'add', product_type)`; toast new badge if any
  - On successful swipe: `recordAction(userId, 'swipe')`; toast new badge if any
  - Optional: small `StreakBadge` component showing current streak next to top controls

## Badge Rules (MVP)

- **Firsts**: `first_add`, `first_swipe`
- **Streaks**: `streak_3`, `streak_7`, `streak_30`
- **Categories**: `desk_explorer`, `chair_explorer` on first add of that type

## User Experience

- Subtle toasts on unlock: "Badge unlocked: {name} — {description}"
- Tiny streak badge (e.g., flame icon) in the header; no intrusive modals

## Timezone & Counting

- Streak is based on UTC dates for simplicity and determinism
- Multiple actions in one day do not increase streak more than once

## Testing

- Unit tests for streak math and category mapping
- Integration via add/swipe tests to assert `recordAction` is called and toasts are fired

## Files to Add/Change

- `migration-gamification.sql` (new)
- `lib/gamification.ts` (new)
- `components/streak-badge.tsx` (new, optional)
- `app/page.tsx` (wire-in calls + optional streak badge)
- `__tests__/gamification.test.ts` (new)

## Rollout Plan

1. Run migration in Supabase
2. Deploy code
3. Verify streak increments across days in staging
4. Iterate on badge catalog and UI polish later

## Future Enhancements

- Badge gallery modal and share cards
- Local timezone support per user
- Weekly missions/quests
- Leaderboard between partners


