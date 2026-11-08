import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Order {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shipping_address: any;
  billing_address: any | null;
  payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await fetch('/api/orders', { credentials: 'include' });
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; bn: string }> = {
      pending: { en: 'Pending', bn: 'অপেক্ষমান' },
      paid: { en: 'Paid', bn: 'পেমেন্ট হয়েছে' },
      shipped: { en: 'Shipped', bn: 'পাঠানো হয়েছে' },
      delivered: { en: 'Delivered', bn: 'ডেলিভার্ড' },
      cancelled: { en: 'Cancelled', bn: 'বাতিল' },
      refunded: { en: 'Refunded', bn: 'রিফান্ড' },
    };
    return labels[status]?.[isBn ? 'bn' : 'en'] || status;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'shipped': return 'badge-primary';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'refunded': return 'badge-warning';
      default: return 'badge-warning';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className="empty-state" style={{ minHeight: '50vh' }}>
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <h3 className="empty-state-title">Please Log In</h3>
        <p className="empty-state-text">You need to be logged in to view your orders.</p>
        <Link to={isBn ? '/bn/login' : '/login'} className="btn btn-primary mt-4">
          {t('auth.login')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <h3 className="empty-state-title">{t('orders.empty')}</h3>
          <p className="empty-state-text">When you place an order, it will appear here.</p>
          <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-primary mt-4">
            {t('catalog.continue_shopping')}
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <article key={order.id} className="order-card">
              <div className="order-card-header">
                <div className="order-card-info">
                  <span className="order-card-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="order-card-date">{formatDate(order.created_at)}</span>
                </div>
                <div className="order-card-status">
                  <span className={`badge ${getStatusClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="order-card-total">৳{order.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="order-card-items">
                {/* Items would be fetched in detail view */}
                <div className="text-center py-4 text-muted text-sm">
                  Click to view order details
                </div>
              </div>

              <div className="order-card-footer">
                <Link
                  to={isBn ? `/bn/orders/${order.id}` : `/orders/${order.id}`}
                  className="btn btn-outline btn-sm"
                >
                  {t('orders.view')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}