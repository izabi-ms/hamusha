import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { eq } from '../db';
import { env } from '../utils/env';
import crypto from 'crypto';

function verifySSLCommerzSignature(data: Record<string, any>, storePassword: string): boolean {
  const { signature, ...rest } = data;
  if (!signature) return false;

  const sortedKeys = Object.keys(rest).sort();
  const concatenated = sortedKeys.map(key => `${key}=${rest[key]}`).join('&');
  
  const expectedSignature = crypto
    .createHash('md5')
    .update(concatenated + storePassword)
    .digest('hex')
    .toUpperCase();

  return signature.toUpperCase() === expectedSignature;
}

async function initSSLCommerzPayment(orderId: string, amount: number, customerInfo: any) {
  const tranId = `HAI-${orderId.slice(0, 8)}-${Date.now()}`;
  
  const postData = {
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: amount.toFixed(2),
    currency: 'BDT',
    tran_id: tranId,
    success_url: env.SSLCOMMERZ_SUCCESS_URL,
    fail_url: env.SSLCOMMERZ_FAIL_URL,
    cancel_url: env.SSLCOMMERZ_CANCEL_URL,
    ipn_url: env.SSLCOMMERZ_IPN_URL,
    shipping_method: 'NO',
    product_name: 'Haimish Order',
    product_category: 'Fashion',
    product_profile: 'general',
    cus_name: customerInfo.shippingAddress.name,
    cus_email: customerInfo.email || 'guest@example.com',
    cus_add1: customerInfo.shippingAddress.line1,
    cus_add2: customerInfo.shippingAddress.line2 || '',
    cus_city: customerInfo.shippingAddress.city,
    cus_state: customerInfo.shippingAddress.state,
    cus_postcode: customerInfo.shippingAddress.postalCode,
    cus_country: customerInfo.shippingAddress.country,
    cus_phone: customerInfo.shippingAddress.phone,
    value_a: orderId,
    value_b: customerInfo.userId || 'guest',
    value_c: 'sslcommerz',
  };

  const sandboxUrl = env.SSLCOMMERZ_SANDBOX 
    ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

  const response = await fetch(sandboxUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(postData as any).toString(),
  });

  const result = await response.json();
  
  if (result.GatewayPageURL) {
    return { success: true, redirectUrl: result.GatewayPageURL, tranId };
  }
  
  return { success: false, error: result };
}

const paymentsRoutes = new Hono();

// Initialize SSLCommerz payment
const initPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

paymentsRoutes.post('/sslcommerz/init', zValidator('json', initPaymentSchema), async (c) => {
  const { orderId } = c.req.valid('json');
  const user = c.get('user');

  const order = await db.get(`SELECT * FROM orders WHERE id = ? LIMIT 1`, orderId);
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  if (order.user_id && order.user_id !== user?.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const payment = await db.get(`SELECT * FROM payments WHERE order_id = ? LIMIT 1`, orderId);
  
  if (!payment || payment.status !== 'initiated') {
    return c.json({ error: 'Payment already processed' }, 400);
  }

  const customerInfo = {
    shippingAddress: JSON.parse(order.shipping_address),
    email: user?.email,
    userId: user?.id,
  };

  const result = await initSSLCommerzPayment(orderId, order.total, customerInfo);
  
  if (result.success) {
    await db.run(
      `UPDATE payments SET provider_transaction_id = ?, status = 'pending', raw_response = ?, updated_at = unixepoch() WHERE id = ?`,
      result.tranId, JSON.stringify({ initResponse: result }), payment.id
    );

    return c.json({ 
      success: true, 
      redirectUrl: result.redirectUrl,
      tranId: result.tranId,
    });
  }

  return c.json({ success: false, error: result.error }, 500);
});

// SSLCommerz IPN webhook
paymentsRoutes.post('/sslcommerz/ipn', async (c) => {
  const body = await c.req.parseBody();
  const data = Object.fromEntries(body);
  
  console.log('[SSLCommerz IPN] Received:', data);

  if (!verifySSLCommerzSignature(data, env.SSLCOMMERZ_STORE_PASSWORD)) {
    console.error('[SSLCommerz IPN] Invalid signature');
    
    await db.run(
      `INSERT INTO admin_audit_logs (id, admin_user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at)
       VALUES (?, 'system', 'sslcommerz_ipn_invalid_signature', 'payment', ?, NULL, ?, ?, ?, unixepoch())`,
      crypto.randomUUID(), data.tran_id || 'unknown', JSON.stringify(data),
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown'
    );
    
    return c.text('FAIL', 400);
  }

  const { tran_id, val_id, amount, status, value_a: orderId } = data;

  const payment = await db.get(`SELECT * FROM payments WHERE provider_transaction_id = ? LIMIT 1`, tran_id);
  
  if (!payment) {
    console.error('[SSLCommerz IPN] Payment not found for tran_id:', tran_id);
    return c.text('FAIL', 404);
  }

  const order = await db.get(`SELECT * FROM orders WHERE id = ? LIMIT 1`, payment.order_id);
  
  if (!order) {
    console.error('[SSLCommerz IPN] Order not found');
    return c.text('FAIL', 404);
  }

  if (Math.abs(parseFloat(amount) - order.total) > 0.01) {
    console.error('[SSLCommerz IPN] Amount mismatch');
    
    await db.run(
      `INSERT INTO admin_audit_logs (id, admin_user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at)
       VALUES (?, 'system', 'sslcommerz_ipn_amount_mismatch', 'payment', ?, ?, ?, ?, ?, unixepoch())`,
      crypto.randomUUID(), payment.id,
      JSON.stringify({ expected: order.total }),
      JSON.stringify({ received: amount, ...data }),
      c.req.header('x-forwarded-for') || 'unknown',
      c.req.header('user-agent') || 'unknown'
    );
    
    return c.text('FAIL', 400);
  }

  if (status === 'VALID' || status === 'VALIDATED') {
    await db.run(
      `UPDATE payments SET status = 'paid', raw_response = ?, updated_at = unixepoch() WHERE id = ?`,
      JSON.stringify({ ...JSON.parse(payment.raw_response || '{}'), ipnResponse: data }), payment.id
    );

    await db.run(
      `UPDATE orders SET status = 'paid', payment_intent_id = ?, updated_at = unixepoch() WHERE id = ?`,
      val_id, order.id
    );

    console.log('[SSLCommerz IPN] Payment verified and order marked as paid:', orderId);
  } else if (status === 'FAILED') {
    await db.run(
      `UPDATE payments SET status = 'failed', raw_response = ?, updated_at = unixepoch() WHERE id = ?`,
      JSON.stringify({ ...JSON.parse(payment.raw_response || '{}'), ipnResponse: data }), payment.id
    );

    await db.run(
      `UPDATE orders SET status = 'cancelled', updated_at = unixepoch() WHERE id = ?`,
      order.id
    );

    console.log('[SSLCommerz IPN] Payment failed:', orderId);
  } else if (status === 'CANCELLED') {
    await db.run(
      `UPDATE payments SET status = 'failed', raw_response = ?, updated_at = unixepoch() WHERE id = ?`,
      JSON.stringify({ ...JSON.parse(payment.raw_response || '{}'), ipnResponse: data }), payment.id
    );

    await db.run(
      `UPDATE orders SET status = 'cancelled', updated_at = unixepoch() WHERE id = ?`,
      order.id
    );

    console.log('[SSLCommerz IPN] Payment cancelled:', orderId);
  }

  return c.text('SUCCESS');
});

// Payment callbacks
paymentsRoutes.get('/sslcommerz/success', async (c) => {
  const tranId = c.req.query('tran_id');
  const valId = c.req.query('val_id');
  const amount = c.req.query('amount');
  const cardType = c.req.query('card_type');
  
  return c.redirect(`${env.FRONTEND_URL}/checkout/success?tran_id=${tranId}&val_id=${valId}&amount=${amount}&card_type=${cardType}`);
});

paymentsRoutes.get('/sslcommerz/fail', async (c) => {
  return c.redirect(`${env.FRONTEND_URL}/checkout/fail`);
});

paymentsRoutes.get('/sslcommerz/cancel', async (c) => {
  return c.redirect(`${env.FRONTEND_URL}/checkout/cancel`);
});

export default paymentsRoutes;