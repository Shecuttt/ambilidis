-- Add shipping_address and buyer_name snapshot to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

-- Update existing orders with data from profiles
UPDATE orders o
SET 
  shipping_address = p.address,
  buyer_name = p.full_name,
  buyer_phone = p.phone
FROM profiles p
WHERE o.buyer_id = p.id
AND o.shipping_address IS NULL;
