import { Hono } from 'hono';
import { auth } from '../auth';

// Auth middleware - attaches user to context if authenticated
export const authMiddleware = async (c: any, next: any) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (session) {
    c.set('user', session.user);
  }
  
  await next();
};

// Optional auth middleware - doesn't require auth but attaches user if present
export const optionalAuthMiddleware = async (c: any, next: any) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (session) {
    c.set('user', session.user);
  }
  
  await next();
};