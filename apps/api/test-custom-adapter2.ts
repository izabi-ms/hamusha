import { Hono } from 'hono';
import { createServer } from 'node:http';
import { IncomingMessage, ServerResponse } from 'node:http';

function createFetchRequest(req: IncomingMessage): Promise<Request> {
  return new Promise((resolve) => {
    const url = new URL(req.url || '/', `http://localhost:3005`);
    
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
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        init.body = Buffer.concat(chunks).toString();
        resolve(new Request(`http://localhost:3005${req.url}`, init));
      });
    } else {
      resolve(new Request(`http://localhost:3005${req.url}`, init));
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

const honoApp = new Hono();

honoApp.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const server = createServer(async (req, res) => {
  try {
    const fetchRequest = await createFetchRequest(req);
    const response = await honoApp.fetch(fetchRequest);
    await sendFetchResponse(res, response);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

const PORT = 3005;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Custom adapter server running on port ${PORT}`);
});