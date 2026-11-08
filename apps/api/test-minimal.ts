import { Hono } from 'hono';
import { createServer } from 'node:http';
import { getRequestListener } from '@hono/node-server';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const listener = getRequestListener(app);
const server = createServer(listener);
const PORT = 3003;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
});