-- Draft 2 Migrations for Ambilidis

-- Tambah di orders table
ALTER TABLE orders ADD COLUMN platform_fee NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN buyer_note TEXT;
ALTER TABLE orders ADD COLUMN payment_token TEXT; -- dari Midtrans
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid';

-- Tambah di stores table  
ALTER TABLE stores ADD COLUMN tagline_today TEXT;
ALTER TABLE stores ADD COLUMN operating_hours JSONB;
-- contoh: {"days": [1,2,3,4,5,6], "open": "06:00", "close": "12:00"}

-- Table baru untuk tracking kurir dummy
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  status TEXT CHECK (status IN ('waiting_pickup', 'on_the_way', 'delivered')),
  note TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;

-- Admin bisa update deliveries
CREATE POLICY "Admin can manage deliveries." ON deliveries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Buyer & seller bisa read
CREATE POLICY "Users can read their deliveries." ON deliveries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = deliveries.order_id 
    AND (orders.buyer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
    )
  )
);

-- Tambah field phone di profiles karena buyer login via OTP nomor HP
ALTER TABLE profiles ADD COLUMN phone TEXT UNIQUE;
