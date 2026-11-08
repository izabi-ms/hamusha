import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_snapshot: any;
  variant_snapshot: any;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/orders/${id}`, { credentials: 'include' });
        const data = await response.json();
        if (data.order) {
          setOrder(data.order);
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!order) {
    return (
      <div className="empty-state" style={{ minHeight: '50vh' }}>
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
        </svg>
        <h3 className="empty-state-title">Order Not Found</h3>
        <Link to={isBn ? '/bn/orders' : '/orders'} className="btn btn-primary mt-4">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link to={isBn ? '/bn/orders' : '/orders'} className="btn btn-secondary btn-sm">
          ← Back to Orders
        </Link>
        <div className="flex items-center gap-3">
          <span className={`badge ${getStatusClass(order.status)} text-lg px-3 py-1`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">{t('order.detail.items')}</h2>
            </div>
            <div className="divide-y divide-border">
              {items.map(item => (
                <div key={item.id} className="p-6 flex gap-4">
                  <img
                    src={item.product_snapshot.poster_png_url}
                    alt={item.product_snapshot.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product_snapshot.name}</h3>
                    <p className="text-sm text-muted">
                      {item.variant_snapshot.color_name} • {item.variant_snapshot.size}
                    </p>
                    <p className="text-sm text-muted">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">৳{item.total_price.toLocaleString()}</p>
                    <p className="text-sm text-muted">৳{item.unit_price.toLocaleString()} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">{t('order.detail.payment')}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>৳{order.subtotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{order.shipping === 0 ? 'Free' : `৳${order.shipping.toLocaleString()}`}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax (5%)</dt>
                <dd>৳{order.tax.toLocaleString()}</dd>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <dt>Total</dt>
                <dd>৳{order.total.toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">{t('order.detail.shipping')}</h3>
            <address className="not-italic text-sm text-muted space-y-1">
              <p className="font-medium text-text">{order.shipping_address.name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.country}</p>
            </address>
          </div>

          {order.billing_address && order.billing_address !== order.shipping_address && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">{t('order.detail.billing')}</h3>
              <address className="not-italic text-sm text-muted space-y-1">
                <p className="font-medium text-text">{order.billing_address.name}</p>
                <p>{order.billing_address.phone}</p>
                <p>{order.billing_address.line1}</p>
                {order.billing_address.line2 && <p>{order.billing_address.line2}</p>}
                <p>{order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}</p>
                <p>{order.billing_address.country}</p>
              </address>
            </div>
          )}

          <div className="card p-6">
            <h3 className="font-semibold mb-4">{t('order.detail.timeline')}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Order Placed</dt>
                <dd>{formatDate(order.created_at)}</dd>
              </div>
              {order.status !== 'pending' && (
                <div className="flex justify-between">
                  <dt className="text-muted">Last Updated</dt>
                  <dd>{formatDate(order.updated_at)}</dd>
                </div>
              )}
              {order.payment_intent_id && (
                <div className="flex justify-between">
                  <dt className="text-muted">Payment ID</dt>
                  <dd className="font-mono text-xs">{order.payment_intent_id}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}