CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Contact form and live chat messages.
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  subject TEXT,
  sender TEXT NOT NULL DEFAULT 'client' CHECK (sender IN ('client', 'admin')),
  content TEXT NOT NULL,
  read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  read_by_client BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_session_created_idx
  ON public.messages (session_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage messages" ON public.messages;
DROP POLICY IF EXISTS "Public insert client messages" ON public.messages;
DROP POLICY IF EXISTS "Public read chat messages" ON public.messages;

CREATE POLICY "Admin manage messages" ON public.messages
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Public insert client messages" ON public.messages
  FOR INSERT TO anon
  WITH CHECK (
    sender = 'client'
    AND char_length(client_name) BETWEEN 1 AND 100
    AND char_length(content) BETWEEN 1 AND 1200
  );

-- The current browser chat client is anonymous and filters by session_id.
-- A stricter owner-bound read policy needs a server-issued session token.
CREATE POLICY "Public read chat messages" ON public.messages
  FOR SELECT TO anon
  USING (TRUE);

-- Business settings used by the dashboard plus key/value operational counters.
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL DEFAULT 'default',
  value TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage settings" ON public.business_settings;
DROP POLICY IF EXISTS "Public read settings" ON public.business_settings;

CREATE POLICY "Admin manage settings" ON public.business_settings
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Public read settings" ON public.business_settings
  FOR SELECT TO anon, authenticated
  USING (TRUE);

INSERT INTO public.business_settings (key, settings)
VALUES (
  'default',
  jsonb_build_object(
    'companyFullName', 'Aluminium Space',
    'phone1', '(+216) 53 186 611',
    'phone2', '(+216) 57 099 070',
    'whatsapp', '21657099070',
    'email', 'contact@aluminiumspace.com',
    'address', '125 lot Laaroussi, Mghira',
    'city', 'Tunis, Tunisie',
    'matriculeFiscal', '1651250W/A/M/000',
    'rib', '11 05500 01215002788 56',
    'tvaPercent', 19,
    'fodecPercent', 1,
    'timbreFiscal', 1,
    'validityDays', 10
  )
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.business_settings (key, value) VALUES
  ('business_name', 'Aluminium Space'),
  ('phone_1', '+216 53 186 611'),
  ('phone_2', '+216 57 099 070'),
  ('email', 'contact@aluminiumspace.com'),
  ('address', '125 lot Laaroussi, Mghira, Tunis'),
  ('matricule_fiscal', '1651250W/A/M/000'),
  ('rib', '11 05500 01215002788 56'),
  ('website', 'https://aluminiumspace.pro/'),
  ('last_facture_number', '20260018')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_next_facture_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_val INTEGER;
BEGIN
  SELECT CAST(value AS INTEGER)
    INTO current_val
  FROM public.business_settings
  WHERE key = 'last_facture_number'
  FOR UPDATE;

  IF current_val IS NULL THEN
    current_val := 20260018;
    INSERT INTO public.business_settings (key, value)
    VALUES ('last_facture_number', CAST(current_val AS TEXT))
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  current_val := current_val + 1;

  UPDATE public.business_settings
  SET value = CAST(current_val AS TEXT),
      updated_at = NOW()
  WHERE key = 'last_facture_number';

  RETURN CAST(current_val AS TEXT);
END;
$$;

REVOKE ALL ON FUNCTION public.get_next_facture_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_facture_number() TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique_idx
  ON public.orders (order_number)
  WHERE order_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.public_order_lookup_attempts (
  id BIGSERIAL PRIMARY KEY,
  client_key TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS public_order_lookup_attempts_key_time_idx
  ON public.public_order_lookup_attempts (client_key, attempted_at DESC);

ALTER TABLE public.public_order_lookup_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_lookup_client_key()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  WITH headers AS (
    SELECT COALESCE(NULLIF(current_setting('request.headers', TRUE), ''), '{}')::jsonb AS value
  )
  SELECT COALESCE(
    NULLIF(value ->> 'cf-connecting-ip', ''),
    NULLIF(value ->> 'x-forwarded-for', ''),
    NULLIF(value ->> 'x-real-ip', ''),
    'unknown'
  )
  FROM headers;
$$;

CREATE OR REPLACE FUNCTION public.get_public_order_by_number(lookup_order_number TEXT)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lookup_client_key TEXT;
  recent_attempts INTEGER;
BEGIN
  lookup_client_key := public.get_lookup_client_key();

  DELETE FROM public.public_order_lookup_attempts
  WHERE attempted_at < NOW() - INTERVAL '10 minutes';

  SELECT COUNT(*)
    INTO recent_attempts
  FROM public.public_order_lookup_attempts
  WHERE public_order_lookup_attempts.client_key = lookup_client_key
    AND attempted_at >= NOW() - INTERVAL '10 minutes';

  IF recent_attempts >= 10 THEN
    RAISE EXCEPTION 'Order lookup temporarily unavailable';
  END IF;

  INSERT INTO public.public_order_lookup_attempts (client_key)
  VALUES (lookup_client_key);

  RETURN QUERY
  SELECT *
  FROM public.orders
  WHERE order_number = lookup_order_number
    AND lookup_order_number ~ '^AS-[A-Z2-9]{6}$'
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order_by_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_by_number(TEXT) TO anon, authenticated;
