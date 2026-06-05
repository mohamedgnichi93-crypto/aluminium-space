-- Add remise_tiers to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS remise_tiers JSONB DEFAULT '[]';

-- Update each product with remise tiers
UPDATE products SET remise_tiers = '[
  {"min_qty": 1,  "max_qty": 2,  "remise_pct": 15},
  {"min_qty": 3,  "max_qty": 5,  "remise_pct": 30},
  {"min_qty": 6,  "max_qty": 10, "remise_pct": 40},
  {"min_qty": 11, "max_qty": 999,"remise_pct": 50}
]'::jsonb
WHERE is_active = true;

-- Add custom_size_available to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS custom_size_available BOOLEAN DEFAULT true;

UPDATE products SET custom_size_available = true WHERE is_active = true;

-- Add order_process to business_settings  
UPDATE business_settings SET settings = settings || '{
  "orderProcess": "devis_form",
  "devisUrl": "/produits",
  "customSizes": true,
  "installationAvailable": true
}'::jsonb;

-- Verify queries
SELECT slug, remise_tiers, custom_size_available FROM products;
SELECT settings FROM business_settings;
