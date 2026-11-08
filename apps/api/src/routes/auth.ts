import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { auth } from '../auth';
import { createOTP, verifyOTP } from '../auth/otp';
import { db } from '../db';
import { eq } from '../db';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

const authRoutes = new Hono();

// Mount Better Auth handler
authRoutes.on('*', '/better-auth/*', async (c) => {
  return auth.handler(c.req.raw);
});

// Custom OTP endpoints
const sendOTPSchema = z.object({
  identifier: z.string().min(1),
  type: z.enum(['register', 'login', 'verify']),
});

authRoutes.post('/otp/send', zValidator('json', sendOTPSchema), async (c) => {
  const { identifier, type } = c.req.valid('json');
  
  await createOTP(identifier, type);
  
  return c.json({ success: true, message: 'OTP sent' });
});

const verifyOTPSchema = z.object({
  identifier: z.string().min(1),
  code: z.string().length(6),
  type: z.enum(['register', 'login', 'verify']),
});

authRoutes.post('/otp/verify', zValidator('json', verifyOTPSchema), async (c) => {
  const { identifier, code, type } = c.req.valid('json');
  
  const valid = await verifyOTP(identifier, code, type);
  
  if (!valid) {
    return c.json({ success: false, message: 'Invalid or expired OTP' }, 400);
  }
  
  if (type === 'login') {
    const user = await db.get(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      identifier
    );
    
    if (!user) {
      const userPhone = await db.get(
        `SELECT * FROM users WHERE phone = ? LIMIT 1`,
        identifier
      );
      
      if (!userPhone) {
        return c.json({ success: false, message: 'User not found' }, 404);
      }
      
      const session = await auth.api.createSession({
        body: { userId: userPhone.id },
        asResponse: true,
      });
      
      const cookieHeader = session.headers.get('set-cookie');
      if (cookieHeader) {
        c.header('Set-Cookie', cookieHeader);
      }
      
      return c.json({ success: true, user: userPhone });
    }
    
    const session = await auth.api.createSession({
      body: { userId: user.id },
      asResponse: true,
    });
    
    const cookieHeader = session.headers.get('set-cookie');
    if (cookieHeader) {
      c.header('Set-Cookie', cookieHeader);
    }
    
    return c.json({ success: true, user });
  }
  
  return c.json({ success: true });
});

// Register with email/password
const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, phone, password, name } = c.req.valid('json');
  
  try {
    const result = await auth.api.registerEmail({
      body: {
        email: email!,
        password,
        name,
      },
      asResponse: true,
    });
    
    const cookieHeader = result.headers.get('set-cookie');
    if (cookieHeader) {
      c.header('Set-Cookie', cookieHeader);
    }
    
    const data = await result.json();
    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Registration failed' }, 400);
  }
});

// Login with email/password
const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(1),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, phone, password } = c.req.valid('json');
  const identifier = email || phone!;
  
  try {
    const result = await auth.api.loginEmail({
      body: {
        email: identifier,
        password,
      },
      asResponse: true,
    });
    
    const cookieHeader = result.headers.get('set-cookie');
    if (cookieHeader) {
      c.header('Set-Cookie', cookieHeader);
    }
    
    const data = await result.json();
    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Login failed' }, 401);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  const sessionToken = getCookie(c, 'session_token') || 
                       c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (sessionToken) {
    await auth.api.revokeSession({
      body: { token: sessionToken },
    });
  }
  
  deleteCookie(c, 'session_token', { path: '/', httpOnly: true, secure: false, sameSite: 'Lax' });
  
  return c.json({ success: true });
});

// Get current user
authRoutes.get('/me', async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ user: null }, 401);
  }
  
  return c.json({ user: session.user });
});

export default authRoutes;