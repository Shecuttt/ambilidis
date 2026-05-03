-- ==========================================
-- UPDATE EXISTING STORES WITH GENERATED SLUGS
-- ==========================================

-- Function to generate URL-safe slug from store name (same as in add_store_slug.sql)
CREATE OR REPLACE FUNCTION generate_slug(store_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces with dashes, remove special characters
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(store_name), 
            '[^a-z0-9\s-]', '', 'g'
          ),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    ),
    '[^a-z0-9-]', '', 'g'
  );
END;
$$ LANGUAGE plpgsql;

-- Update all existing stores with generated slugs
-- Use name + random suffix to ensure uniqueness
UPDATE stores 
SET slug = generate_slug(name) || '-' || substr(md5(id::text), 1, 8)
WHERE slug IS NULL;

-- Verify the update
SELECT 
  id, 
  name, 
  slug,
  created_at
FROM stores 
ORDER BY created_at;
