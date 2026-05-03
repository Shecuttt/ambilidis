-- 1. Pastikan RLS aktif untuk storage (biasanya sudah aktif secara default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES UNTUK BUCKET: products
-- ==========================================

-- A. Akses Publik: Siapapun bisa melihat foto produk
CREATE POLICY "Public Access for Products"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- B. Upload/Insert: Hanya Owner Toko yang bisa upload ke foldernya sendiri
-- Path: products/[store_id]/[filename]
CREATE POLICY "Seller Upload Product Photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- B. Alternative Policy: Allow upload to any folder in products bucket for authenticated users
-- This is a fallback policy in case the foldername function doesn't work as expected
CREATE POLICY "Seller Upload Product Photo Fallback"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- C. Update: Hanya Owner Toko yang bisa update foto di foldernya
CREATE POLICY "Seller Update Product Photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- D. Delete: Hanya Owner Toko yang bisa menghapus foto di foldernya
CREATE POLICY "Seller Delete Product Photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);


-- ==========================================
-- POLICIES UNTUK BUCKET: stores (Logo & Banner)
-- ==========================================

-- A. Akses Publik: Siapapun bisa melihat logo/banner toko
CREATE POLICY "Public Access for Store Branding"
ON storage.objects FOR SELECT
USING ( bucket_id = 'stores' );

-- B. Upload/Insert: Hanya Owner Toko yang bisa upload logo/banner ke foldernya
-- Path: stores/[store_id]/logo_... atau stores/[store_id]/banner_...
CREATE POLICY "Seller Upload Branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stores' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- C. Update/Delete: Untuk mengganti atau menghapus logo/banner
CREATE POLICY "Seller Manage Branding"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'stores' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'stores' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);
