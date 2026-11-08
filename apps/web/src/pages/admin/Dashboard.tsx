import React, { useState, useEffect } from 'react';
import { useLocale } from '../../context/LocaleContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Stats {
  products: number;
  variants: number;
  orders: number;
  revenue: number;
}

export function AdminDashboard() {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const [stats, setStats] = useState<Stats>({ products: 0, variants: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, variantsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/products?limit=1', { credentials: 'include' }),
          fetch('/api/admin/variants?limit=1', { credentials: 'include' }),
          fetch('/api/admin/orders?limit=1', { credentials: 'include' }),
        ]);
        const [productsData, variantsData, ordersData] = await Promise.all([
          productsRes.json(),
          variantsRes.json(),
          ordersRes.json(),
        ]);
        setStats({
          products: productsData.pagination?.total || 0,
          variants: variantsData.pagination?.total || 0,
          orders: ordersData.pagination?.total || 0,
          revenue: 0, // Would need separate endpoint
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Products', value: stats.products, icon: '📦', color: 'primary' },
    { label: 'Variants', value: stats.variants, icon: '🎨', color: 'secondary' },
    { label: 'Orders', value: stats.orders, icon: '📋', color: 'success' },
    { label: 'Revenue', value: `৳${stats.revenue.toLocaleString()}`, icon: '💰', color: 'warning' },
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">{isBn ? stat.label : stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="/admin/products/new" className="btn btn-outline">Add Product</a>
            <a href="/admin/variants/new" className="btn btn-outline">Add Variant</a>
            <a href="/admin/orders" className="btn btn-outline">View Orders</a>
            <a href="/admin/audit-log" className="btn btn-outline">Audit Log</a>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-muted">Audit log integration coming soon...</p>
        </div>
      </div>
    </div>
  );
}