import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Cart, CartItem } from '@haimish/shared';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  addItem: (variantId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateItem: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      const data = await fetchAPI<{ cart: Cart }>('/cart');
      setCart(data.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (variantId: string, quantity = 1) => {
    try {
      await fetchAPI('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId, quantity }),
      });
      await refreshCart();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    try {
      await fetchAPI(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await fetchAPI(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      await refreshCart();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const clearCart = async () => {
    try {
      await fetchAPI('/cart', { method: 'DELETE' });
      await refreshCart();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}