// Smoke check for product ingredients + scans storage. Run against a TEST database only:
//   DATABASE_URL=postgresql://postgres:test@localhost:55432/elabel npm run check:storage
// (It creates and deletes one product.)
import assert from 'node:assert';
import { insertProductSchema, insertScanSchema } from '../shared/schema';

const { storage } = await import('../server/storage');
const owner = '00000000-0000-0000-0000-000000000001';

const body = insertProductSchema
  .omit({ createdBy: true, ownerId: true })
  .parse({ name: 'Storage check', ingredientIds: [3, 1] });
const created = await storage.createProduct({ ...body, ownerId: owner });
assert.deepStrictEqual(created.ingredientIds, [3, 1]);

const update = insertProductSchema.partial().omit({ createdBy: true, ownerId: true }).parse({ ingredientIds: [2, 1] });
const updated = await storage.updateProduct(created.id, owner, update);
assert.deepStrictEqual(updated?.ingredientIds, [2, 1]);
assert.deepStrictEqual(await storage.getLabelIngredients(null), []);

assert.throws(() => insertScanSchema.parse({ productId: created.id, lat: 91, lng: 0 }));
const scan = await storage.createScan({
  source: null,
  ...insertScanSchema.parse({ productId: created.id, lat: 1.5, lng: 2.5 }),
});
assert.ok((await storage.getScans()).some((s) => s.id === scan.id));

await storage.deleteProduct(created.id, owner);
console.log('storage checks passed');
process.exit(0);
