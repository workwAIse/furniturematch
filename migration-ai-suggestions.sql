-- AI suggestions table migration
CREATE TABLE ai_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('user1', 'user2')),
  category VARCHAR(50) NOT NULL,
  suggested_product JSONB NOT NULL, -- Full product data matching Product interface
  reasoning TEXT NOT NULL, -- AI explanation for the suggestion
  confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.00 to 1.00
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_ai_suggestions_user_status ON ai_suggestions(user_id, status);
CREATE INDEX idx_ai_suggestions_category ON ai_suggestions(category); 