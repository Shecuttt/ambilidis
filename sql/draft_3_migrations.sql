-- =============================================
-- DRAFT 3 MIGRATIONS - Ambilidis
-- Jalankan di Supabase SQL Editor
-- =============================================

-- -----------------------------------------------
-- Section 1: Dashboard & Pengaturan Toko (Seller)
-- -----------------------------------------------

-- 1.3 Alasan Penolakan Order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- -----------------------------------------------
-- Section 3: Discovery & Belanja (Buyer)
-- -----------------------------------------------

-- Koordinat toko (sebagai NUMERIC biasa, bukan PostGIS)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Terakhir update stok (untuk ditampilkan di halaman detail toko buyer)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------
-- Verifikasi: Pastikan kolom tagline_today sudah ada
-- (Sudah ditambahkan di draft_2_migrations.sql)
-- ALTER TABLE stores ADD COLUMN IF NOT EXISTS tagline_today TEXT;
-- -----------------------------------------------

-- -----------------------------------------------
-- Section 4: Keranjang & Checkout (Buyer)
-- -----------------------------------------------

-- Catatan buyer untuk seller
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_note TEXT;

-- Ongkir berbasis jarak (disimpan saat checkout agar audit trail jelas)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;

-- =============================================
-- PASTIKAN JUGA draft_3_status_update.sql SUDAH DIJALANKAN
-- untuk menambahkan status 'canceled' dan 'expired' pada orders
-- =============================================

-- -----------------------------------------------
-- Section 5: Post-Delivery & Ulasan
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  buyer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  complaints  TEXT[],               -- array: ['basi', 'salah_item', ...]
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id)                 -- 1 rating per order
);

-- RLS: buyer hanya bisa insert rating miliknya sendiri
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer can insert own rating"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);
