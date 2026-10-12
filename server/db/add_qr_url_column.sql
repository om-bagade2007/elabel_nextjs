-- Add qr_url column to products table to permanently store the QR / DPP URL
alter table public.products
  add column if not exists qr_url text;

-- Backfill existing products created on Render with their permanent Render QR code URL
update public.products
  set qr_url = 'https://wine-label-management-system.onrender.com/qr/product/' || id || '?src=qr'
  where qr_url is null or qr_url = '';
