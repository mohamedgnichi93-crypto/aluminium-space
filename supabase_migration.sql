-- 1. Alter orders table to match app needs
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS client_info JSONB,
  ADD COLUMN IF NOT EXISTS items JSONB,
  ADD COLUMN IF NOT EXISTS total_ht NUMERIC,
  ADD COLUMN IF NOT EXISTS net_ht NUMERIC,
  ADD COLUMN IF NOT EXISTS remise_percent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remise NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fodec_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tva_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_for_tva NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ttc NUMERIC,
  ADD COLUMN IF NOT EXISTS timbre NUMERIC DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Alter measure_requests to support camelCase fields
ALTER TABLE measure_requests
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Fix RLS policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
DROP POLICY IF EXISTS "allow_anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "allow_anon_select_orders" ON orders;
DROP POLICY IF EXISTS "allow_auth_all_orders" ON orders;
CREATE POLICY "allow_anon_insert_orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_auth_all_orders" ON orders FOR ALL TO authenticated USING (true);

CREATE OR REPLACE FUNCTION get_public_order_by_number(lookup_order_number TEXT)
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM orders
  WHERE order_number = lookup_order_number
    AND lookup_order_number ~ '^AS-[A-Z2-9]{6}$'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_public_order_by_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_order_by_number(TEXT) TO anon, authenticated;

-- 4. Fix RLS policies for measure_requests  
ALTER TABLE measure_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_measure" ON measure_requests;
DROP POLICY IF EXISTS "allow_anon_insert_measure" ON measure_requests;
DROP POLICY IF EXISTS "allow_anon_select_measure" ON measure_requests;
DROP POLICY IF EXISTS "allow_auth_all_measure" ON measure_requests;
CREATE POLICY "allow_anon_insert_measure" ON measure_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_auth_all_measure" ON measure_requests FOR ALL TO authenticated USING (true);

-- 5. Add tva_percent and fodec_percent to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tva_percent NUMERIC DEFAULT 19,
  ADD COLUMN IF NOT EXISTS fodec_percent NUMERIC DEFAULT 1;

