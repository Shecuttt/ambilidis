-- Create order status logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by order_id
CREATE INDEX IF NOT EXISTS order_status_logs_order_id_idx ON order_status_logs(order_id);

-- Enable RLS
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view logs of their own orders" ON order_status_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_status_logs.order_id 
        AND (orders.buyer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
        ))
    )
);

-- Trigger to automatically log status changes in orders table
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO order_status_logs (order_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON orders;
CREATE TRIGGER trg_log_order_status_change
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Initial logs for existing orders
INSERT INTO order_status_logs (order_id, status, created_at)
SELECT id, status, updated_at FROM orders
ON CONFLICT DO NOTHING;
