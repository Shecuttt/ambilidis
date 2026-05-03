-- ==========================================
-- ADD LOCATION FIELDS TO PROFILES TABLE
-- ==========================================

-- Add address column (TEXT) for storing delivery address
ALTER TABLE profiles 
ADD COLUMN address TEXT;

-- Add location column (GEOGRAPHY POINT) for storing coordinates
ALTER TABLE profiles 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Create index for faster location-based queries
CREATE INDEX profiles_location_idx ON profiles USING GIST (location);

-- Update existing profiles to set default address if empty
UPDATE profiles 
SET address = 'Alamat belum diatur' 
WHERE address IS NULL;
