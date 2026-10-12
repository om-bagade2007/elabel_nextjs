-- QR codes must never point to localhost (they are printed and scanned by phones).
-- Re-point any saved localhost QR address to the live site. Safe to re-run.
update public.products
  set qr_url = 'https://wine-label-management-system.onrender.com/qr/product/' || id || '?src=qr'
  where qr_url ~* '^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$)';
