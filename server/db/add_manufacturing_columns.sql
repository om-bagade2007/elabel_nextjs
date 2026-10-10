-- Add manufacturing location and coordinates columns to products table
alter table public.products
  add column if not exists manufacturing_location text,
  add column if not exists manufacturing_address text,
  add column if not exists manufacturing_city text,
  add column if not exists manufacturing_state text,
  add column if not exists manufacturing_country text,
  add column if not exists manufacturing_postal_code text,
  add column if not exists manufacturing_latitude text,
  add column if not exists manufacturing_longitude text,
  add column if not exists latitude text,
  add column if not exists longitude text;
