import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  uuid,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isEmailConfirmed: boolean('is_email_confirmed').default(false).notNull(),
  emailConfirmationToken: varchar('email_confirmation_token', { length: 255 }),
  emailConfirmationTokenExpiry: timestamp('email_confirmation_token_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  netVolume: text('net_volume'),
  vintage: text('vintage'),
  wineType: text('wine_type'),
  sugarContent: text('sugar_content'),
  appellation: text('appellation'),
  alcoholContent: text('alcohol_content'),
  packagingGases: text('packaging_gases'),
  portionSize: text('portion_size'),
  kcal: text('kcal'),
  kj: text('kj'),
  fat: text('fat'),
  carbohydrates: text('carbohydrates'),
  saturates: text('saturates'),
  sugar: text('sugar'),
  protein: text('protein'),
  salt: text('salt'),
  pregnancyWarning: boolean('pregnancy_warning').default(false),
  ageWarning: boolean('age_warning').default(false),
  drivingWarning: boolean('driving_warning').default(false),
  organic: boolean('organic').default(false),
  vegetarian: boolean('vegetarian').default(false),
  vegan: boolean('vegan').default(false),
  operatorType: text('operator_type'),
  operatorName: text('operator_name'),
  operatorAddress: text('operator_address'),
  operatorInfo: text('operator_info'),
  countryOfOrigin: text('country_of_origin'),
  manufacturingLocation: text('manufacturing_location'),
  manufacturingAddress: text('manufacturing_address'),
  manufacturingCity: text('manufacturing_city'),
  manufacturingState: text('manufacturing_state'),
  manufacturingCountry: text('manufacturing_country'),
  manufacturingPostalCode: text('manufacturing_postal_code'),
  manufacturingLatitude: text('manufacturing_latitude'),
  manufacturingLongitude: text('manufacturing_longitude'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  sku: text('sku'),
  ean: text('ean'),
  externalLink: text('external_link'),
  redirectLink: text('redirect_link'),
  imageUrl: text('image_url'),
  ingredientIds: integer('ingredient_ids').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by'),
  ownerId: uuid('owner_id'),
});

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category'),
  eNumber: text('e_number'),
  allergens: text('allergens').array(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by'),
  ownerId: uuid('owner_id'),
});

// One row per QR scan that shared a location (QGIS reads these via /api/scans.geojson)
export const scans = pgTable('scans', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertScanSchema = z.object({
  productId: z.number().int().positive(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  source: z.string().max(50).optional(),
});

export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
} as const);

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const insertProductSchema = z.object({
  name: z.string(),
  brand: z.string().optional(),
  netVolume: z.string().optional(),
  vintage: z.string().optional(),
  wineType: z.string().optional(),
  sugarContent: z.string().optional(),
  appellation: z.string().optional(),
  alcoholContent: z.string().optional(),
  packagingGases: z.string().optional(),
  portionSize: z.string().optional(),
  kcal: z.string().optional(),
  kj: z.string().optional(),
  fat: z.string().optional(),
  carbohydrates: z.string().optional(),
  saturates: z.string().optional(),
  sugar: z.string().optional(),
  protein: z.string().optional(),
  salt: z.string().optional(),
  pregnancyWarning: z.boolean().optional(),
  ageWarning: z.boolean().optional(),
  drivingWarning: z.boolean().optional(),
  organic: z.boolean().optional(),
  vegetarian: z.boolean().optional(),
  vegan: z.boolean().optional(),
  operatorType: z.string().optional(),
  operatorName: z.string().optional(),
  operatorAddress: z.string().optional(),
  operatorInfo: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  manufacturingLocation: z.string().optional(),
  manufacturingAddress: z.string().optional(),
  manufacturingCity: z.string().optional(),
  manufacturingState: z.string().optional(),
  manufacturingCountry: z.string().optional(),
  manufacturingPostalCode: z.string().optional(),
  manufacturingLatitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  manufacturingLongitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  latitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  longitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  externalLink: z.string().optional(),
  redirectLink: z.string().optional(),
  imageUrl: z.string().optional(),
  ingredientIds: z.array(z.number().int()).optional(),
  createdBy: z.number().optional(),
  ownerId: z.string().uuid().optional(),
});

export const importProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().optional(),
  netVolume: z.string().optional(),
  vintage: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  wineType: z.string().optional(),
  sugarContent: z.string().optional(),
  appellation: z.string().optional(),
  alcoholContent: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  packagingGases: z.string().optional(),
  portionSize: z.string().optional(),
  kcal: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  kj: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  fat: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  carbohydrates: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  saturates: z.union([z.string(), z.number()]).transform(String).optional(),
  sugar: z.union([z.string(), z.number()]).transform(String).optional(),
  protein: z.union([z.string(), z.number()]).transform(String).optional(),
  salt: z.union([z.string(), z.number()]).transform(String).optional(),
  pregnancyWarning: z.boolean().default(false),
  ageWarning: z.boolean().default(false),
  drivingWarning: z.boolean().default(false),
  organic: z.boolean().default(false),
  vegetarian: z.boolean().default(false),
  vegan: z.boolean().default(false),
  operatorType: z.string().optional(),
  operatorName: z.string().optional(),
  operatorAddress: z.string().optional(),
  operatorInfo: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  manufacturingLocation: z.string().optional(),
  manufacturingAddress: z.string().optional(),
  manufacturingCity: z.string().optional(),
  manufacturingState: z.string().optional(),
  manufacturingCountry: z.string().optional(),
  manufacturingPostalCode: z.string().optional(),
  manufacturingLatitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  manufacturingLongitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  latitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  longitude: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  sku: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  ean: z.string().optional(),
  externalLink: z.string().optional(),
  redirectLink: z.string().optional(),
  imageUrl: z.string().optional(),
  createdBy: z.number().optional(),
  ownerId: z.string().uuid().optional(),
});

export const insertIngredientSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  eNumber: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  details: z.string().optional(),
  createdBy: z.number().optional(),
  ownerId: z.string().uuid().optional(),
});

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductWithPermissions = Product & { canEdit: boolean };
export type InsertIngredient = typeof ingredients.$inferInsert;
export type Ingredient = typeof ingredients.$inferSelect;
export type LabelIngredient = Pick<Ingredient, 'id' | 'name' | 'eNumber' | 'allergens' | 'category'>;
export type ProductWithIngredients = Product & { ingredients?: LabelIngredient[] };
export type Scan = typeof scans.$inferSelect;
