-- Run once in the Supabase SQL editor (additive, safe to re-run)
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredient_ids integer[];

CREATE TABLE IF NOT EXISTS scans (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  source text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scans_product_id_idx ON scans(product_id);
