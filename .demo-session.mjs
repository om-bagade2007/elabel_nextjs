// Local demo only: a visible Chrome window with a fake signed-in session and sample data.
import { chromium } from 'playwright';
const BASE = 'http://localhost:5001';
const product = await (await fetch(`${BASE}/api/public/products/1`)).json();
const minimal = await (await fetch(`${BASE}/api/public/products/2`)).json();
const ingredients = [
  { id: 1, name: 'Grapes', eNumber: null, allergens: [], category: 'Raw material' },
  { id: 2, name: 'Tartaric acid', eNumber: 'E334', allergens: [], category: 'Acidity regulator' },
  { id: 3, name: 'Sulphur dioxide', eNumber: 'E220', allergens: ['Sulphites'], category: 'Preservative' },
  { id: 4, name: 'Egg white', eNumber: null, allergens: ['Eggs'], category: 'Fining agent' },
];
const ref = new URL((await (await fetch(`${BASE}/api/config`)).json()).supabaseUrl).hostname.split('.')[0];
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] }).catch(() => chromium.launch({ channel: 'chromium', headless: false }));
const ctx = await browser.newContext({ viewport: null });
await ctx.addInitScript((ref) => {
  const user = { id: 'demo', email: 'demo@winery.test', aud: 'authenticated', role: 'authenticated' };
  localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({ access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, user }));
  localStorage.setItem('auth-storage', JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }));
}, ref);
await ctx.route(/\/api\/(products|ingredients)(\/\d+)?$/, (r) => {
  const u = r.request().url(), m = r.request().method();
  if (m !== 'GET') return r.fulfill({ status: 403, json: { error: 'Demo window: saving is disabled' } });
  if (/products\/1$/.test(u)) return r.fulfill({ json: { ...product, canEdit: true } });
  if (/products\/2$/.test(u)) return r.fulfill({ json: { ...minimal, canEdit: true } });
  if (/products$/.test(u)) return r.fulfill({ json: [{ ...product, canEdit: true }, { ...minimal, canEdit: true }] });
  if (/ingredients$/.test(u)) return r.fulfill({ json: ingredients });
  if (/ingredients\/\d+$/.test(u)) return r.fulfill({ json: ingredients[0] });
  return r.continue();
});
const page = await ctx.newPage();
await page.goto(`${BASE}/products/create`);
console.log('DEMO WINDOW OPEN');
await new Promise((res) => browser.on('disconnected', res));
console.log('demo window closed');
