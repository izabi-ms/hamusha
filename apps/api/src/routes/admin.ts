import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, desc, sql } from '../db';
import crypto from 'crypto';

function generateId(): string {
  return crypto.randomUUID();
}

export const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  await next();
};

async function logAudit(adminUserId: string, action: string, entityType: string, entityId: string | null, oldData: any, newData: any, c: any) {
  await db.run(
    `INSERT INTO admin_audit_logs (id, admin_user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    generateId(), adminUserId, action, entityType, entityId,
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    c.req.header('user-agent') || 'unknown'
  );
}

const adminRoutes = new Hono();

adminRoutes.use('*', adminMiddleware);

const productSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  name_bn: z.string().min(1).max(200),
  description: z.string().min(1),
  description_bn: z.string().min(1),
  category: z.string().min(1),
  category_bn: z.string().min(1),
  base_price: z.number().positive(),
  poster_png_url: z.string().url(),
  template_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

adminRoutes.get('/products', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const [items, totalResult] = await Promise.all([
    db.all(`SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?`, limit, offset),
    db.get(`SELECT COUNT(*) as count FROM products`),
  ]);

  return c.json({
    products: items,
    pagination: {
      page,
      limit,
      total: totalResult?.count || 0,
      totalPages: Math.ceil((totalResult?.count || 0) / limit),
    },
  });
});

adminRoutes.get('/products/:id', async (c) => {
  const id = c.req.param('id');
  const product = await db.get(`SELECT * FROM products WHERE id = ? LIMIT 1`, id);
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const productVariants = await db.all(`SELECT * FROM variants WHERE product_id = ?`, id);
  
  return c.json({ product, variants: productVariants });
});

adminRoutes.post('/products', zValidator('json', productSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  
  const existing = await db.get(`SELECT * FROM products WHERE slug = ? LIMIT 1`, data.slug);
  if (existing) {
    return c.json({ error: 'Slug already exists' }, 400);
  }

  const id = generateId();
  await db.run(
    `INSERT INTO products (id, slug, name, name_bn, description, description_bn, category, category_bn, base_price, poster_png_url, template_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    id, data.slug, data.name, data.name_bn, data.description, data.description_bn,
    data.category, data.category_bn, data.base_price, data.poster_png_url, data.template_id, data.is_active ? 1 : 0
  );

  await logAudit(user.id, 'create_product', 'product', id, null, data, c);

  return c.json({ success: true, product: { id, ...data } });
});

adminRoutes.patch('/products/:id', zValidator('json', productSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const existing = await db.get(`SELECT * FROM products WHERE id = ? LIMIT 1`, id);
  if (!existing) {
    return c.json({ error: 'Product not found' }, 404);
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db.get(`SELECT * FROM products WHERE slug = ? LIMIT 1`, data.slug);
    if (slugExists) {
      return c.json({ error: 'Slug already exists' }, 400);
    }
  }

  const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  
  await db.run(
    `UPDATE products SET ${setClause}, updated_at = unixepoch() WHERE id = ?`,
    ...values, id
  );

  await logAudit(user.id, 'update_product', 'product', id, existing, data, c);

  return c.json({ success: true });
});

adminRoutes.delete('/products/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const existing = await db.get(`SELECT * FROM products WHERE id = ? LIMIT 1`, id);
  if (!existing) {
    return c.json({ error: 'Product not found' }, 404);
  }

  await db.run(`DELETE FROM products WHERE id = ?`, id);

  await logAudit(user.id, 'delete_product', 'product', id, existing, null, c);

  return c.json({ success: true });
});

const variantSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string().min(1).max(50),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  color_name: z.string().min(1).max(50),
  color_name_bn: z.string().min(1).max(50),
  size: z.string().min(1).max(20),
  price_override: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

adminRoutes.get('/variants', async (c) => {
  const productId = c.req.query('productId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  let items, totalResult;
  if (productId) {
    [items, totalResult] = await Promise.all([
      db.all(`SELECT * FROM variants WHERE product_id = ? LIMIT ? OFFSET ?`, productId, limit, offset),
      db.get(`SELECT COUNT(*) as count FROM variants WHERE product_id = ?`, productId),
    ]);
  } else {
    [items, totalResult] = await Promise.all([
      db.all(`SELECT * FROM variants LIMIT ? OFFSET ?`, limit, offset),
      db.get(`SELECT COUNT(*) as count FROM variants`),
    ]);
  }

  return c.json({
    variants: items,
    pagination: { page, limit, total: totalResult?.count || 0, totalPages: Math.ceil((totalResult?.count || 0) / limit) },
  });
});

adminRoutes.post('/variants', zValidator('json', variantSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  const existing = await db.get(`SELECT * FROM variants WHERE sku = ? LIMIT 1`, data.sku);
  if (existing) {
    return c.json({ error: 'SKU already exists' }, 400);
  }

  const product = await db.get(`SELECT * FROM products WHERE id = ? LIMIT 1`, data.product_id);
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const id = generateId();
  await db.run(
    `INSERT INTO variants (id, product_id, sku, color_hex, color_name, color_name_bn, size, price_override, stock, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    id, data.product_id, data.sku, data.color_hex, data.color_name, data.color_name_bn,
    data.size, data.price_override ?? null, data.stock, data.is_active ? 1 : 0
  );

  await logAudit(user.id, 'create_variant', 'variant', id, null, data, c);

  return c.json({ success: true, variant: { id, ...data } });
});

adminRoutes.patch('/variants/:id', zValidator('json', variantSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const existing = await db.get(`SELECT * FROM variants WHERE id = ? LIMIT 1`, id);
  if (!existing) {
    return c.json({ error: 'Variant not found' }, 404);
  }

  if (data.sku && data.sku !== existing.sku) {
    const skuExists = await db.get(`SELECT * FROM variants WHERE sku = ? LIMIT 1`, data.sku);
    if (skuExists) {
      return c.json({ error: 'SKU already exists' }, 400);
    }
  }

  const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  
  await db.run(
    `UPDATE variants SET ${setClause}, updated_at = unixepoch() WHERE id = ?`,
    ...values, id
  );

  await logAudit(user.id, 'update_variant', 'variant', id, existing, data, c);

  return c.json({ success: true });
});

adminRoutes.delete('/variants/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const existing = await db.get(`SELECT * FROM variants WHERE id = ? LIMIT 1`, id);
  if (!existing) {
    return c.json({ error: 'Variant not found' }, 404);
  }

  await db.run(`DELETE FROM variants WHERE id = ?`, id);

  await logAudit(user.id, 'delete_variant', 'variant', id, existing, null, c);

  return c.json({ success: true });
});

adminRoutes.get('/orders', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const status = c.req.query('status');
  const offset = (page - 1) * limit;

  let items, totalResult;
  if (status) {
    [items, totalResult] = await Promise.all([
      db.all(`SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, status, limit, offset),
      db.get(`SELECT COUNT(*) as count FROM orders WHERE status = ?`, status),
    ]);
  } else {
    [items, totalResult] = await Promise.all([
      db.all(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`, limit, offset),
      db.get(`SELECT COUNT(*) as count FROM orders`),
    ]);
  }

  return c.json({
    orders: items.map((o: any) => ({
      ...o,
      shipping_address: JSON.parse(o.shipping_address),
      billing_address: o.billing_address ? JSON.parse(o.billing_address) : null,
    })),
    pagination: { page, limit, total: totalResult?.count || 0, totalPages: Math.ceil((totalResult?.count || 0) / limit) },
  });
});

adminRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const order = await db.get(`SELECT * FROM orders WHERE id = ? LIMIT 1`, id);
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  const items = await db.all(`SELECT * FROM order_items WHERE order_id = ?`, id);
  
  return c.json({ 
    order: {
      ...order,
      shipping_address: JSON.parse(order.shipping_address),
      billing_address: order.billing_address ? JSON.parse(order.billing_address) : null,
    }, 
    items 
  });
});

adminRoutes.get('/audit-log', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const entityType = c.req.query('entityType');
  const action = c.req.query('action');
  const offset = (page - 1) * limit;

  let items, totalResult;
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (entityType) {
    conditions.push('entity_type = ?');
    params.push(entityType);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  
  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  
  [items, totalResult] = await Promise.all([
    db.all(`SELECT * FROM admin_audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, ...params, limit, offset),
    db.get(`SELECT COUNT(*) as count FROM admin_audit_logs ${whereClause}`, ...params),
  ]);

  return c.json({
    logs: items,
    pagination: { page, limit, total: totalResult?.count || 0, totalPages: Math.ceil((totalResult?.count || 0) / limit) },
  });
});

export default adminRoutes;