// Startup migrations bring an old database up to the current schema. Run against a TEST database
// created from an older schema:
//   DATABASE_URL=postgresql://postgres:test@localhost:55432/elabel_old npm run check:migrate
import assert from 'node:assert';
import postgres from 'postgres';
import { ensureSchema } from '../server/migrate';

await ensureSchema();
await ensureSchema(); // re-running must be harmless

// A product saved with a localhost QR address is repaired on the next start
const local = postgres(process.env.DATABASE_URL!, { max: 1 });
const [{ id: localId }] = await local`insert into products (name, qr_url) values ('Local QR', 'http://localhost:5000/qr/product/0?src=qr') returning id`;
await ensureSchema();
const [{ qr_url }] = await local`select qr_url from products where id = ${localId}`;
assert.equal(qr_url, `https://wine-label-management-system.onrender.com/qr/product/${localId}?src=qr`);
await local`delete from products where id = ${localId}`;
await local.end();

const { storage } = await import('../server/storage');
const owner = '00000000-0000-0000-0000-000000000001';
const created = await storage.createProduct({ name: 'Migrate check', ownerId: owner, ingredientIds: [1] });
assert.deepStrictEqual(created.ingredientIds, [1]);
await storage.createScan({ productId: created.id, lat: 1, lng: 2, source: null });
await storage.deleteProduct(created.id, owner);
console.log('migrate checks passed');
process.exit(0);
