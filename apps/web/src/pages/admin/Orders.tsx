import React, { useState, useEffect } from 'react';
import { useLocale } from '../../context/LocaleContext';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  created_at: string;
}

export function AdminOrders() {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/admin/orders?${params}`, { credentials: 'include' });
      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filterStatus]);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Orders</h1>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="admin-form-group flex-1 min-w-[200px]">
            <label className="admin-form-label">Filter by Status</label>
            <select
              className="admin-form-input"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <h3 className="empty-state-title">No Orders</h3>
          <p className="empty-state-text">No orders found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                      {order.user_id ? (
                        <span>User: {order.user_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-muted">Guest: {order.session_id?.slice(0, 8)}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="font-medium">৳{order.total.toLocaleString()}</td>
                    <td className="text-sm text-muted">{formatDate(order.created_at)}</td>
                    <td>
                      <a href={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-sm btn-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-sm btn-secondary"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}