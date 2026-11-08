import { Hono } from 'hono';
import { createServer } from 'node:http';

const app = new Hono();

app.get('/', (c) => c.text('Hello World!'));

console.log('Starting server...');
const server = createServer(app.fetch);

server.listen(3002, '0.0.0.0', () => {
  console.log('Server started on port 3002');
});