// Startup migrations bring an old database up to the current schema. Run against a TEST database
// created from an older schema:
//   DATABASE_URL=postgresql://postgres:test@localhost:55432/elabel_old npm run check:migrate
import assert from 'node:assert';
import { ensureSchema } from '../server/migrate';

await ensureSchema();
await ensureSchema(); // re-running must be harmless

const { storage } = await import('../server/storage');
const owner = '00000000-0000-0000-0000-000000000001';
const created = await storage.createProduct({ name: 'Migrate check', ownerId: owner, ingredientIds: [1] });
assert.deepStrictEqual(created.ingredientIds, [1]);
await storage.createScan({ productId: created.id, lat: 1, lng: 2, source: null });
await storage.deleteProduct(created.id, owner);
console.log('migrate checks passed');
process.exit(0);
