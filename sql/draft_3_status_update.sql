-- File ini digunakan untuk mengupdate constraint status pada tabel orders
-- agar mendukung status 'canceled' (oleh buyer) dan 'expired' (timeout oleh sistem)

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'in_delivery', 'completed', 'canceled', 'expired'));
