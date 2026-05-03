-- ==========================================
-- ADD SLUG COLUMN TO STORES TABLE
-- ==========================================

-- Add slug column (TEXT) for URL-friendly store identifiers
ALTER TABLE stores 
ADD COLUMN slug TEXT;

-- Create unique index on slug to ensure uniqueness
CREATE UNIQUE INDEX stores_slug_idx ON stores (slug);

-- Function to generate URL-safe slug from store name
CREATE OR REPLACE FUNCTION generate_slug(store_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  s TEXT;
BEGIN
  s := lower(store_name);

  -- remove special characters except alnum, space, dash
  s := regexp_replace(s, '[^a-z0-9\s-]', '', 'g');

  -- collapse whitespace to single dash
  s := regexp_replace(s, '\s+', '-', 'g');

  -- collapse multiple dashes
  s := regexp_replace(s, '-+', '-', 'g');

  -- trim leading/trailing dashes
  s := regexp_replace(s, '^-|-$', '', 'g');

  -- remove any remaining non alnum/dash (safety pass)
  s := regexp_replace(s, '[^a-z0-9-]', '', 'g');

  -- final collapse just in case
  s := regexp_replace(s, '--+', '-', 'g');

  RETURN s;
END;
$$;

-- Update existing stores with generated slugs
UPDATE stores 
SET slug = generate_slug(name) || '-' || substr(md5(id::text), 1, 8)
WHERE slug IS NULL;

-- Add trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION generate_store_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug = generate_slug(NEW.name) || '-' || substr(md5(NEW.id::text), 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug when store is created
CREATE TRIGGER store_slug_trigger
BEFORE INSERT ON stores
FOR EACH ROW
EXECUTE FUNCTION generate_store_slug();

-- Add trigger to update slug when name changes
CREATE OR REPLACE FUNCTION update_store_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug = generate_slug(NEW.name) || '-' || substr(md5(NEW.id::text), 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_slug_update_trigger
BEFORE UPDATE ON stores
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION update_store_slug();
