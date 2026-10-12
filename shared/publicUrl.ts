// Printed QR codes must open on a phone, so they never contain localhost. Every copy of the app
// shares one Supabase database, so a QR made on a local copy still opens on the live site.
export const PRODUCTION_URL = 'https://wine-label-management-system.onrender.com';

export const isLocalUrl = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url.trim());

/** First public address among the candidates, else the live site. No trailing slash. */
export function publicBase(...candidates: (string | null | undefined)[]) {
  const base = candidates.find((u) => u && u.trim() && !isLocalUrl(u)) || PRODUCTION_URL;
  return base.trim().replace(/\/$/, '');
}

/** A stored QR address, unless it points to localhost (then callers build a public one). */
export const usableQrUrl = (stored?: string | null) => (stored && !isLocalUrl(stored) ? stored : null);

export const qrUrlFor = (base: string, productId: number) => `${base}/qr/product/${productId}?src=qr`;
