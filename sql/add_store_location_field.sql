-- ==========================================
-- ADD LOCATION COLUMN TO STORES TABLE
-- ==========================================

-- Add location column (GEOGRAPHY POINT) for storing coordinates
ALTER TABLE stores 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Create index for faster location-based queries
CREATE INDEX stores_location_idx ON stores USING GIST (location);

-- Update existing stores to set location from latitude/longitude columns
UPDATE stores 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- Note: Stores with missing latitude/longitude will have NULL location
-- These will need to be updated via the store settings interface
