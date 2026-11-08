import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, desc } from '../db';
import { getCookie } from 'hono/cookie';

const ordersRoutes = new Hono();

// Create order from cart
const createOrderSchema = z.object({
  shippingAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Bangladesh'),
  }),
  billingAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Bangladesh'),
  }).optional(),
  paymentMethod: z.enum(['sslcommerz']).default('sslcommerz'),
});

ordersRoutes.post('/', zValidator('json', createOrderSchema), async (c) => {
  const user = c.get('user');
  const sessionId = getCookie(c, 'cart_session_id');
  const { shippingAddress, billingAddress, paymentMethod } = c.req.valid('json');

  let cart;
  if (user) {
    cart = await db.get(`SELECT * FROM carts WHERE user_id = ? LIMIT 1`, user.id);
  } else if (sessionId) {
    cart = await db.get(`SELECT * FROM carts WHERE session_id = ? LIMIT 1`, sessionId);
  }

  if (!cart) {
    return c.json({ error: 'Cart is empty' }, 400);
  }

  const items = await db.all(
    `SELECT 
      ci.variant_id,
      ci.quantity,
      v.id as variant_id,
      v.sku,
      v.color_hex,
      v.color_name,
      v.color_name_bn,
      v.size,
      v.price_override,
      v.stock,
      v.product_id,
      p.id as product_id,
      p.slug,
      p.name,
      p.name_bn,
      p.description,
      p.description_bn,
      p.category,
      p.category_bn,
      p.base_price,
      p.poster_png_url
    FROM cart_items ci
    INNER JOIN variants v ON ci.variant_id = v.id
    INNER JOIN products p ON v.product_id = p.id
    WHERE ci.cart_id = ?`,
    cart.id
  );

  if (items.length === 0) {
    return c.json({ error: 'Cart is empty' }, 400);
  }

  for (const item of items) {
    if (item.quantity > item.stock) {
      return c.json({ error: `Insufficient stock for ${item.name} - ${item.color_name} ${item.size}` }, 400);
    }
  }

  const subtotal = items.reduce((sum: number, item: any) => {
    const price = item.price_override ?? item.base_price;
    return sum + price * item.quantity;
  }, 0);

  const shipping = subtotal > 5000 ? 0 : 100;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  const orderId = crypto.randomUUID();
  const orderData = {
    id: orderId,
    user_id: user?.id || null,
    session_id: user ? null : sessionId,
    status: 'pending',
    subtotal,
    tax,
    shipping,
    total,
    currency: 'BDT',
    shipping_address: JSON.stringify(shippingAddress),
    billing_address: JSON.stringify(billingAddress || shippingAddress),
    payment_intent_id: null,
  };

  await db.run(
    `INSERT INTO orders (id, user_id, session_id, status, subtotal, tax, shipping, total, currency, shipping_address, billing_address, payment_intent_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    orderData.id, orderData.user_id, orderData.session_id, orderData.status,
    orderData.subtotal, orderData.tax, orderData.shipping, orderData.total,
    orderData.currency, orderData.shipping_address, orderData.billing_address,
    orderData.payment_intent_id
  );

  for (const item of items) {
    const price = item.price_override ?? item.base_price;
    const productSnapshot = {
      id: item.product_id,
      slug: item.slug,
      name: item.name,
      name_bn: item.name_bn,
      description: item.description,
      description_bn: item.description_bn,
      category: item.category,
      category_bn: item.category_bn,
      base_price: item.base_price,
      poster_png_url: item.poster_png_url,
    };
    
    const variantSnapshot = {
      id: item.variant_id,
      sku: item.sku,
      color_hex: item.color_hex,
      color_name: item.color_name,
      color_name_bn: item.color_name_bn,
      size: item.size,
    };

    await db.run(
      `INSERT INTO order_items (id, order_id, variant_id, product_snapshot, variant_snapshot, quantity, unit_price, total_price, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
      crypto.randomUUID(), orderId, item.variant_id,
      JSON.stringify(productSnapshot), JSON.stringify(variantSnapshot),
      item.quantity, price, price * item.quantity
    );

    await db.run(
      `UPDATE variants SET stock = stock - ? WHERE id = ?`,
      item.quantity, item.variant_id
    );
  }

  await db.run(`DELETE FROM cart_items WHERE cart_id = ?`, cart.id);

  const paymentId = crypto.randomUUID();
  await db.run(
    `INSERT INTO payments (id, order_id, provider, amount, currency, status, created_at, updated_at)
     VALUES (?, ?, 'sslcommerz', ?, 'BDT', 'initiated', unixepoch(), unixepoch())`,
    paymentId, orderId, total
  );

  return c.json({
    success: true,
    order: {
      id: orderId,
      total,
      currency: 'BDT',
      status: 'pending',
    },
    paymentId,
  });
});

// Get order by ID
ordersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const order = await db.get(`SELECT * FROM orders WHERE id = ? LIMIT 1`, id);

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  if (order.user_id && order.user_id !== user?.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  if (!order.user_id && order.session_id !== getCookie(c, 'cart_session_id')) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const items = await db.all(`SELECT * FROM order_items WHERE order_id = ?`, id);
  const payment = await db.get(`SELECT * FROM payments WHERE order_id = ? LIMIT 1`, id);

  return c.json({
    order: {
      ...order,
      shipping_address: JSON.parse(order.shipping_address),
      billing_address: order.billing_address ? JSON.parse(order.billing_address) : null,
    },
    items,
    payment: payment || null,
  });
});

// Get user's orders
ordersRoutes.get('/', async (c) => {
  const user = c.get('user');
  const sessionId = getCookie(c, 'cart_session_id');

  let userOrders;
  if (user) {
    userOrders = await db.all(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      user.id
    );
  } else if (sessionId) {
    userOrders = await db.all(
      `SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC`,
      sessionId
    );
  } else {
    return c.json({ orders: [] });
  }

  return c.json({ 
    orders: userOrders.map((o: any) => ({
      ...o,
      shipping_address: JSON.parse(o.shipping_address),
      billing_address: o.billing_address ? JSON.parse(o.billing_address) : null,
    }))
  });
});

export default ordersRoutes;