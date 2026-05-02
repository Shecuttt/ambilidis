-- Enable PostGIS extension for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('seller', 'buyer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stores Table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS point for [longitude, latitude]
  address TEXT,
  is_open BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast nearest neighbor search
CREATE INDEX stores_location_idx ON stores USING GIST (location);

-- 3. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- e.g., 'kg', 'pcs', 'bungkus'
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'in_delivery', 'completed')) DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL, -- Price at the time of order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies (can be refined later)
-- Public read access to stores and products
CREATE POLICY "Public stores are viewable by everyone." ON stores FOR SELECT USING (true);
CREATE POLICY "Public products are viewable by everyone." ON products FOR SELECT USING (true);

-- Sellers can manage their own store and products
CREATE POLICY "Users can manage their own store." ON stores FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their store's products." ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid())
);

-- Buyers can read their own orders, sellers can read orders for their store
CREATE POLICY "Users can read their own orders." ON orders FOR SELECT USING (
  auth.uid() = buyer_id OR 
  EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
);

-- Buyers can create orders
CREATE POLICY "Buyers can insert orders." ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update orders for their store (status, payment_status, rejection_reason)
CREATE POLICY "Sellers can update orders." ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
);

-- Buyers can update orders (specifically to 'completed' or 'canceled')
CREATE POLICY "Buyers can update their own orders." ON orders FOR UPDATE USING (
  auth.uid() = buyer_id
) WITH CHECK (
  auth.uid() = buyer_id AND (status IN ('completed', 'canceled'))
);

-- Order items matching policies
CREATE POLICY "Users can read order items of their orders." ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (
    orders.buyer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
  ))
);
CREATE POLICY "Buyers can insert order items." ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
