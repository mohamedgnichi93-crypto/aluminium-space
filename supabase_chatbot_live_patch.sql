BEGIN;

UPDATE products
SET image_url = '/images/elba-v2.webp',
    updated_at = now()
WHERE slug = 'elba';

UPDATE products
SET min_width = 125,
    min_height = 120,
    updated_at = now()
WHERE slug = 'plisse31';

COMMIT;

SELECT slug, image_url, min_width, min_height
FROM products
WHERE slug IN ('elba', 'plisse31')
ORDER BY slug;
