import dotenv from 'dotenv';
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/haimish',
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production-min-32-characters-long',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  SSLCOMMERZ_STORE_ID: process.env.SSLCOMMERZ_STORE_ID || 'test_store',
  SSLCOMMERZ_STORE_PASSWORD: process.env.SSLCOMMERZ_STORE_PASSWORD || 'test_password',
  SSLCOMMERZ_SANDBOX: process.env.SSLCOMMERZ_SANDBOX === 'true',
  SSLCOMMERZ_SUCCESS_URL: process.env.SSLCOMMERZ_SUCCESS_URL || 'http://localhost:5173/checkout/success',
  SSLCOMMERZ_FAIL_URL: process.env.SSLCOMMERZ_FAIL_URL || 'http://localhost:5173/checkout/fail',
  SSLCOMMERZ_CANCEL_URL: process.env.SSLCOMMERZ_CANCEL_URL || 'http://localhost:5173/checkout/cancel',
  SSLCOMMERZ_IPN_URL: process.env.SSLCOMMERZ_IPN_URL || 'http://localhost:3000/api/payments/sslcommerz/ipn',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};