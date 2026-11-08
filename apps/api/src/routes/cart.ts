import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { eq, and } from '../db';
import { getCookie, setCookie } from 'hono/cookie';

const CART_SESSION_COOKIE = 'cart_session_id';

async function getOrCreateCart(c: any): Promise<any> {
  const user = c.get('user');
  const sessionId = getCookie(c, CART_SESSION_COOKIE);

  let cart;

  if (user) {
    cart = await db.get(`SELECT * FROM carts WHERE user_id = ? LIMIT 1`, user.id);
    
    if (!cart) {
      const newCartId = crypto.randomUUID();
      await db.run(
        `INSERT INTO carts (id, user_id, session_id, created_at, updated_at) VALUES (?, ?, ?, unixepoch(), unixepoch())`,
        newCartId, user.id, null
      );
      cart = { id: newCartId, user_id: user.id, session_id: null };
      
      if (sessionId) {
        await mergeGuestCart(user.id, sessionId);
        deleteCookie(c, CART_SESSION_COOKIE, { path: '/' });
      }
    }
  } else {
    let cartSessionId = sessionId;
    
    if (!cartSessionId) {
      cartSessionId = crypto.randomUUID();
      setCookie(c, CART_SESSION_COOKIE, cartSessionId, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    
    cart = await db.get(`SELECT * FROM carts WHERE session_id = ? LIMIT 1`, cartSessionId);
    
    if (!cart) {
      const newCartId = crypto.randomUUID();
      await db.run(
        `INSERT INTO carts (id, user_id, session_id, created_at, updated_at) VALUES (?, ?, ?, unixepoch(), unixepoch())`,
        newCartId, null, cartSessionId
      );
      cart = { id: newCartId, user_id: null, session_id: cartSessionId };
    }
  }

  return cart;
}

async function mergeGuestCart(userId: string, guestSessionId: string): Promise<void> {
  const guestCart = await db.get(`SELECT * FROM carts WHERE session_id = ? LIMIT 1`, guestSessionId);
  
  if (!guestCart) return;
  
  const guestCartItems = await db.all(`SELECT * FROM cart_items WHERE cart_id = ?`, guestCart.id);
  const userCart = await db.get(`SELECT * FROM carts WHERE user_id = ? LIMIT 1`, userId);
  
  if (!userCart) return;
  
  for (const item of guestCartItems) {
    const existing = await db.get(
      `SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1`,
      userCart.id, item.variant_id
    );
    
    if (existing) {
      await db.run(
        `UPDATE cart_items SET quantity = ?, updated_at = unixepoch() WHERE id = ?`,
        existing.quantity + item.quantity, existing.id
      );
    } else {
      await db.run(
        `INSERT INTO cart_items (id, cart_id, variant_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, unixepoch(), unixepoch())`,
        crypto.randomUUID(), userCart.id, item.variant_id, item.quantity
      );
    }
  }
  
  await db.run(`DELETE FROM carts WHERE id = ?`, guestCart.id);
}

const cartRoutes = new Hono();

// Get cart
cartRoutes.get('/', async (c) => {
  const cart = await getOrCreateCart(c);
  
  const items = await db.all(
    `SELECT 
      ci.id,
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
      p.base_price,
      p.poster_png_url
    FROM cart_items ci
    INNER JOIN variants v ON ci.variant_id = v.id
    INNER JOIN products p ON v.product_id = p.id
    WHERE ci.cart_id = ?`,
    cart.id
  );

  const subtotal = items.reduce((sum: number, item: any) => {
    const price = item.price_override ?? item.base_price;
    return sum + price * item.quantity;
  }, 0);

  const shipping = subtotal > 5000 ? 0 : 100;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return c.json({
    cart: {
      id: cart.id,
      items: items.map((item: any) => ({
        id: item.id,
        variantId: item.variant_id,
        quantity: item.quantity,
        variant: {
          id: item.variant_id,
          sku: item.sku,
          colorHex: item.color_hex,
          colorName: item.color_name,
          colorNameBn: item.color_name_bn,
          size: item.size,
          priceOverride: item.price_override,
          stock: item.stock,
          productId: item.product_id,
        },
        product: {
          id: item.product_id,
          slug: item.slug,
          name: item.name,
          nameBn: item.name_bn,
          basePrice: item.base_price,
          posterPngUrl: item.poster_png_url,
        },
      })),
      subtotal,
      shipping,
      tax,
      total,
      currency: 'BDT',
      itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    },
  });
});

// Add item to cart
const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
});

cartRoutes.post('/items', zValidator('json', addItemSchema), async (c) => {
  const { variantId, quantity } = c.req.valid('json');
  const cart = await getOrCreateCart(c);

  const variant = await db.get(`SELECT * FROM variants WHERE id = ? LIMIT 1`, variantId);
  
  if (!variant) {
    return c.json({ error: 'Variant not found' }, 404);
  }
  
  if (!variant.is_active) {
    return c.json({ error: 'Variant not available' }, 400);
  }
  
  if (variant.stock < quantity) {
    return c.json({ error: 'Insufficient stock' }, 400);
  }

  const existing = await db.get(
    `SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1`,
    cart.id, variantId
  );

  if (existing) {
    const newQuantity = existing.quantity + quantity;
    if (newQuantity > variant.stock) {
      return c.json({ error: 'Insufficient stock' }, 400);
    }
    
    await db.run(
      `UPDATE cart_items SET quantity = ?, updated_at = unixepoch() WHERE id = ?`,
      newQuantity, existing.id
    );
  } else {
    await db.run(
      `INSERT INTO cart_items (id, cart_id, variant_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, unixepoch(), unixepoch())`,
      crypto.randomUUID(), cart.id, variantId, quantity
    );
  }

  return c.json({ success: true });
});

// Update cart item quantity
const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

cartRoutes.patch('/items/:id', zValidator('json', updateItemSchema), async (c) => {
  const itemId = c.req.param('id');
  const { quantity } = c.req.valid('json');
  const cart = await getOrCreateCart(c);

  const item = await db.get(
    `SELECT * FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1`,
    itemId, cart.id
  );

  if (!item) {
    return c.json({ error: 'Cart item not found' }, 404);
  }

  if (quantity === 0) {
    await db.run(`DELETE FROM cart_items WHERE id = ?`, itemId);
    return c.json({ success: true });
  }

  const variant = await db.get(`SELECT * FROM variants WHERE id = ? LIMIT 1`, item.variant_id);
  
  if (variant && quantity > variant.stock) {
    return c.json({ error: 'Insufficient stock' }, 400);
  }

  await db.run(
    `UPDATE cart_items SET quantity = ?, updated_at = unixepoch() WHERE id = ?`,
    quantity, itemId
  );

  return c.json({ success: true });
});

// Remove item from cart
cartRoutes.delete('/items/:id', async (c) => {
  const itemId = c.req.param('id');
  const cart = await getOrCreateCart(c);

  await db.run(
    `DELETE FROM cart_items WHERE id = ? AND cart_id = ?`,
    itemId, cart.id
  );

  return c.json({ success: true });
});

// Clear cart
cartRoutes.delete('/', async (c) => {
  const cart = await getOrCreateCart(c);
  
  await db.run(`DELETE FROM cart_items WHERE cart_id = ?`, cart.id);
  
  return c.json({ success: true });
});

export default cartRoutes;