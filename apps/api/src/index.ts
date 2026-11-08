import { Hono } from 'hono';
import { createServer } from 'node:http';
import { IncomingMessage, ServerResponse } from 'node:http';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { auth } from './auth';
import { env } from './utils/env';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import cartRoutes from './routes/cart';
import ordersRoutes from './routes/orders';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes
app.route('/api/auth', authRoutes);
app.route('/api/catalog', catalogRoutes);

// Protected routes with optional auth
const protectedRoutes = new Hono();
protectedRoutes.use('*', optionalAuthMiddleware);
protectedRoutes.route('/cart', cartRoutes);
protectedRoutes.route('/orders', ordersRoutes);
protectedRoutes.route('/payments', paymentsRoutes);
app.route('/api', protectedRoutes);

// Admin routes with auth middleware
const adminApp = new Hono();
adminApp.use('*', authMiddleware);
adminApp.route('/', adminRoutes);
app.route('/api/admin', adminApp);

// Better Auth handler
app.on('*', '/api/auth/better-auth/*', async (c) => {
  return auth.handler(c.req.raw);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Custom adapter to convert Node.js request/response to Fetch API
function createFetchRequest(req: IncomingMessage): Promise<Request> {
  return new Promise((resolve) => {
    const url = new URL(req.url || '/', `http://localhost:${env.PORT || 3000}`);
    
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.append(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        init.body = Buffer.concat(chunks).toString();
        resolve(new Request(url.toString(), init));
      });
    } else {
      resolve(new Request(url.toString(), init));
    }
  });
}

function sendFetchResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value);
  }
  
  const body = response.body;
  if (body) {
    const reader = body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    pump();
  } else {
    res.end();
  }
}

// Start server with custom adapter
const server = createServer(async (req, res) => {
  try {
    const fetchRequest = await createFetchRequest(req);
    const response = await app.fetch(fetchRequest);
    await sendFetchResponse(res, response);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

const PORT = env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;