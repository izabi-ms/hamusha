import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, eq, and, ilike, or, desc, asc, sql } from '../db';

const catalogRoutes = new Hono();

// Query params for product listing
const listQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

catalogRoutes.get('/products', zValidator('query', listQuerySchema), async (c) => {
  const { category, search, sort, page, limit } = c.req.valid('query');
  const offset = (page - 1) * limit;

  const conditions: string[] = ['is_active = 1'];
  const params: any[] = [1];
  
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  
  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR name_bn LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  const whereClause = conditions.join(' AND ');

  // Apply sorting
  let orderBy = 'created_at DESC';
  switch (sort) {
    case 'price_asc':
      orderBy = 'base_price ASC';
      break;
    case 'price_desc':
      orderBy = 'base_price DESC';
      break;
    case 'name_asc':
      orderBy = 'name ASC';
      break;
    case 'name_desc':
      orderBy = 'name DESC';
      break;
    case 'newest':
    default:
      orderBy = 'created_at DESC';
      break;
  }

  // Execute sequentially to avoid race conditions on shared database connection
  const items = await db.all(
    `SELECT * FROM products WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    ...params, limit, offset
  );
  const totalResult = await db.get(
    `SELECT COUNT(*) as count FROM products WHERE ${whereClause}`,
    ...params
  );

  const total = totalResult?.count || 0;

  return c.json({
    products: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get categories
catalogRoutes.get('/categories', async (c) => {
  const categories = await db.all(
    `SELECT DISTINCT category, category_bn FROM products WHERE is_active = 1`
  );

  return c.json({ categories });
});

// Get product by slug
catalogRoutes.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  const product = await db.get(
    `SELECT * FROM products WHERE slug = ? AND is_active = 1 LIMIT 1`,
    slug
  );

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  // Get active variants
  const productVariants = await db.all(
    `SELECT * FROM variants WHERE product_id = ? AND is_active = 1 ORDER BY color_hex ASC, size ASC`,
    product.id
  );

  return c.json({
    product,
    variants: productVariants,
  });
});

// Get variants for a product
catalogRoutes.get('/products/:slug/variants', async (c) => {
  const slug = c.req.param('slug');
  
  const product = await db.get(
    `SELECT * FROM products WHERE slug = ? AND is_active = 1 LIMIT 1`,
    slug
  );

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const productVariants = await db.all(
    `SELECT * FROM variants WHERE product_id = ? AND is_active = 1 ORDER BY color_hex ASC, size ASC`,
    product.id
  );

  return c.json({ variants: productVariants });
});

export default catalogRoutes;