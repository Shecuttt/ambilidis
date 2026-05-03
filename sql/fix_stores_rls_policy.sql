-- ==========================================
-- FIX STORES RLS POLICY FOR SELLERS WITHOUT STORES
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public stores are viewable by everyone." ON stores;
DROP POLICY IF EXISTS "Users can manage their own store." ON stores;

-- Create new policies that work for sellers without stores

-- 1. Public read access for buyers (stores that are open)
CREATE POLICY "Open stores are viewable by everyone." ON stores FOR SELECT USING (
  is_open = true
);

-- 2. Sellers can view their own stores (even if none exist)
CREATE POLICY "Sellers can view their own stores." ON stores FOR SELECT USING (
  auth.uid() = owner_id
);

-- 3. Sellers can manage their own store (UPDATE/DELETE)
CREATE POLICY "Users can manage their own store." ON stores FOR UPDATE USING (
  auth.uid() = owner_id
);

CREATE POLICY "Users can delete their own store." ON stores FOR DELETE USING (
  auth.uid() = owner_id
);

-- 4. Sellers can create stores (with proper owner_id check)
CREATE POLICY "Sellers can create stores." ON stores FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);

-- Note: This allows:
-- - Buyers to see open stores
-- - Sellers to query their own stores (returns empty if none exist)
-- - Sellers to manage their stores when they have one
