-- Add missing dimension columns to measure_requests
ALTER TABLE measure_requests
  ADD COLUMN IF NOT EXISTS width NUMERIC,
  ADD COLUMN IF NOT EXISTS height NUMERIC;
