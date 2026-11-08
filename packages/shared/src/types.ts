export interface Product {
  id: string;
  slug: string;
  name: string;
  name_bn: string;
  description: string;
  description_bn: string;
  category: string;
  category_bn: string;
  base_price: number;
  poster_png_url: string;
  template_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color_hex: string;
  color_name: string;
  color_name_bn: string;
  size: string;
  price_override: number | null;
  stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: 'user' | 'admin';
  email_verified: boolean;
  phone_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address | null;
  payment_intent_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_snapshot: ProductSnapshot;
  variant_snapshot: VariantSnapshot;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export interface ProductSnapshot {
  id: string;
  slug: string;
  name: string;
  name_bn: string;
  description: string;
  description_bn: string;
  category: string;
  category_bn: string;
  base_price: number;
  poster_png_url: string;
}

export interface VariantSnapshot {
  id: string;
  sku: string;
  color_hex: string;
  color_name: string;
  color_name_bn: string;
  size: string;
}

export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: 'sslcommerz';
  provider_transaction_id: string | null;
  amount: number;
  currency: string;
  status: 'initiated' | 'pending' | 'paid' | 'failed' | 'refunded';
  raw_response: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface OTPCode {
  id: string;
  identifier: string; // email or phone
  code: string;
  type: 'register' | 'login' | 'verify';
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export type Locale = 'en' | 'bn';

export interface I18nDict {
  [key: string]: {
    en: string;
    bn: string;
  };
}