-- Complete Product Type Categories Migration Script
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Add product_type column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'other';

-- Step 2: Create product_types table for reference
CREATE TABLE IF NOT EXISTS product_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  keywords TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Insert predefined product types (will skip if already exists)
INSERT INTO product_types (id, name, keywords) VALUES
('sofa', 'Sofa', ARRAY['sofa', 'couch', 'canapé', 'sofa bed', 'sofabett', 'settee', 'divan']),
('table', 'Table', ARRAY['table', 'tisch', 'coffee table', 'couchtisch', 'dining table', 'esstisch', 'side table', 'beistelltisch', 'end table', 'console table']),
('chair', 'Chair', ARRAY['chair', 'stuhl', 'armchair', 'sessel', 'dining chair', 'esstuhl', 'office chair', 'recliner', 'rocking chair']),
('bed', 'Bed', ARRAY['bed', 'bett', 'bed frame', 'bettgestell', 'mattress', 'matratze', 'platform bed', 'daybed']),
('lamp', 'Lamp', ARRAY['lamp', 'lampe', 'ceiling lamp', 'deckenlampe', 'table lamp', 'tischlampe', 'floor lamp', 'stehlampe', 'pendant lamp', 'wall lamp']),
('shelf', 'Shelf', ARRAY['shelf', 'regal', 'bookshelf', 'bücherregal', 'wall shelf', 'wandregal', 'floating shelf', 'corner shelf']),
('cabinet', 'Cabinet', ARRAY['cabinet', 'schrank', 'kitchen cabinet', 'bathroom cabinet', 'curio cabinet', 'display cabinet']),
('desk', 'Desk', ARRAY['desk', 'schreibtisch', 'writing desk', 'computer desk', 'office desk', 'study desk']),
('mirror', 'Mirror', ARRAY['mirror', 'spiegel', 'wall mirror', 'wandspiegel', 'floor mirror', 'dressing mirror']),
('rug', 'Rug', ARRAY['rug', 'teppich', 'carpet', 'area rug', 'runner', 'doormat']),
('ottoman', 'Ottoman', ARRAY['ottoman', 'footstool', 'pouf', 'hassock', 'footrest', 'hocker']),
('bench', 'Bench', ARRAY['bench', 'bank', 'sitzbank', 'garden bench', 'entry bench', 'storage bench']),
('stool', 'Stool', ARRAY['stool', 'bar stool', 'hocker', 'tabouret', 'kitchen stool', 'counter stool']),
('nightstand', 'Nightstand', ARRAY['nightstand', 'bedside table', 'nachttisch', 'bedside cabinet', 'bedside drawer']),
('dresser', 'Dresser', ARRAY['dresser', 'chest of drawers', 'kommode', 'commode', 'chest', 'drawer unit']),
('wardrobe', 'Wardrobe', ARRAY['wardrobe', 'armoire', 'kleiderschrank', 'garderobe', 'closet', 'clothes cabinet']),
('bookcase', 'Bookcase', ARRAY['bookcase', 'bookshelf', 'bücherregal', 'library', 'book storage', 'display case']),
('tv_stand', 'TV Stand', ARRAY['tv stand', 'tv unit', 'fernsehschrank', 'entertainment center', 'media console', 'tv cabinet']),
('sideboard', 'Sideboard', ARRAY['sideboard', 'buffet', 'anrichte', 'credenza', 'server', 'dining storage']),
('plant_stand', 'Plant Stand', ARRAY['plant stand', 'flower stand', 'pflanzenständer', 'plant holder', 'flower pot stand']),
('coat_rack', 'Coat Rack', ARRAY['coat rack', 'coat stand', 'garderobe', 'hall tree', 'hat stand', 'coat hanger']),
('wine_rack', 'Wine Rack', ARRAY['wine rack', 'weinregal', 'wine storage', 'wine holder', 'bottle rack']),
('umbrella_stand', 'Umbrella Stand', ARRAY['umbrella stand', 'schirmständer', 'umbrella holder', 'parasol stand']),
('magazine_rack', 'Magazine Rack', ARRAY['magazine rack', 'zeitschriftenhalter', 'newspaper holder', 'magazine holder']),
('shoe_rack', 'Shoe Rack', ARRAY['shoe rack', 'schuhregal', 'shoe storage', 'shoe organizer', 'boot rack']),
('other', 'Other', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create index on product_type for better performance
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Step 5: Update existing products to have 'other' as default product_type
UPDATE products SET product_type = 'other' WHERE product_type IS NULL;

-- Migration completed successfully!
-- The app will automatically detect and update product types for existing products
-- when it loads for the first time after this migration. 