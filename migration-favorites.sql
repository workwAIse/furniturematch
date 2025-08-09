-- Favorites and Compare State migrations

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_category ON favorites(user_id, category);
CREATE INDEX IF NOT EXISTS idx_compare_states_user_category ON compare_states(user_id, category);

-- Triggers to maintain updated_at
CREATE TRIGGER update_favorites_updated_at 
  BEFORE UPDATE ON favorites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compare_states_updated_at 
  BEFORE UPDATE ON compare_states 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();


