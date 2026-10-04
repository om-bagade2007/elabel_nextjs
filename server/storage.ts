import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import {
  users,
  products,
  ingredients,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Ingredient,
  type InsertIngredient,
} from '@shared/schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: number, ownerId: string): Promise<Product | undefined>;
  getPublicProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, ownerId: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number, ownerId: string): Promise<boolean>;

  // Ingredient methods
  getIngredients(ownerId: string): Promise<Ingredient[]>;
  getIngredient(id: number, ownerId: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(
    id: number,
    ownerId: string,
    ingredient: Partial<InsertIngredient>,
  ): Promise<Ingredient | undefined>;
  deleteIngredient(id: number, ownerId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number, ownerId: string): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.ownerId, ownerId)))
      .limit(1);
    return result[0];
  }

  async getPublicProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(
    id: number,
    ownerId: string,
    product: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set(product)
      .where(and(eq(products.id, id), eq(products.ownerId, ownerId)))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number, ownerId: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.ownerId, ownerId)))
      .returning();
    return result.length > 0;
  }

  // Ingredient methods
  async getIngredients(ownerId: string): Promise<Ingredient[]> {
    return await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.ownerId, ownerId))
      .orderBy(ingredients.name);
  }

  async getIngredient(id: number, ownerId: string): Promise<Ingredient | undefined> {
    const result = await db
      .select()
      .from(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.ownerId, ownerId)))
      .limit(1);
    return result[0];
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const result = await db.insert(ingredients).values(ingredient).returning();
    return result[0];
  }

  async updateIngredient(
    id: number,
    ownerId: string,
    ingredient: Partial<InsertIngredient>,
  ): Promise<Ingredient | undefined> {
    const result = await db
      .update(ingredients)
      .set(ingredient)
      .where(and(eq(ingredients.id, id), eq(ingredients.ownerId, ownerId)))
      .returning();
    return result[0];
  }

  async deleteIngredient(id: number, ownerId: string): Promise<boolean> {
    const result = await db
      .delete(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.ownerId, ownerId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
