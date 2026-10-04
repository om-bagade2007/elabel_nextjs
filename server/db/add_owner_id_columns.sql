-- Add the ownership columns required by the authenticated product/ingredient APIs.
-- Nullable columns preserve existing rows while new records receive an owner UUID.
alter table public.products
  add column if not exists owner_id uuid;

alter table public.ingredients
  add column if not exists owner_id uuid;
