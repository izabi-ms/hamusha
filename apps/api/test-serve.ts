import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

serve(app, { port: 3004, hostname: '0.0.0.0' });
console.log('Serve server running on port 3004');