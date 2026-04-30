-- Jalankan script ini di menu SQL Editor pada Supabase Dashboard Anda
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'transfer';
