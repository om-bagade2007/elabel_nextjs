// QR addresses never contain localhost. No database needed:
//   npm run check:qr
import assert from 'node:assert';
import { PRODUCTION_URL as P, publicBase, usableQrUrl, qrUrlFor } from '../shared/publicUrl';

process.env.DATABASE_URL ||= 'postgresql://unused@localhost/unused'; // routes imports storage; nothing connects
const { getRequestBaseUrl } = await import('../server/routes');

const R = 'https://wine-label-management-system.onrender.com';
const req = (baseUrl?: string, origin?: string) => ({ body: { baseUrl }, headers: { origin } }) as any;

// shared rule
assert.equal(publicBase('http://localhost:5000', 'http://127.0.0.1:3000'), P);
assert.equal(publicBase('http://192.168.1.20:5000', R), 'http://192.168.1.20:5000'); // Docker on a LAN keeps its address
assert.equal(publicBase(R + '/'), R);
assert.equal(publicBase('https://localhost.example.com'), 'https://localhost.example.com'); // not actually local
assert.equal(usableQrUrl('http://localhost:5000/qr/product/3?src=qr'), null);
assert.equal(usableQrUrl(`${R}/qr/product/3?src=qr`), `${R}/qr/product/3?src=qr`);
assert.equal(qrUrlFor(R, 7), `${R}/qr/product/7?src=qr`);

// server: what gets saved when a product is created
delete process.env.BASE_URL;
delete process.env.RENDER_EXTERNAL_URL;
assert.equal(getRequestBaseUrl(req('http://localhost:5000', 'http://localhost:5000')), P); // the reported bug
assert.equal(getRequestBaseUrl(req(R, R)), R);
process.env.BASE_URL = 'http://localhost:5000'; // Render's example value
process.env.RENDER_EXTERNAL_URL = R;
assert.equal(getRequestBaseUrl(req(undefined, 'http://localhost:3000')), R);

console.log('qr url checks passed');
process.exit(0);
