import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  if (!loading && (!user || user.role !== 'admin')) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="page" style={{ minHeight: '100vh' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="spinner" style={{ width: '3rem', height: '3rem' }} />
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/products', label: 'Products', icon: 'products' },
    { path: '/admin/variants', label: 'Variants', icon: 'variants' },
    { path: '/admin/orders', label: 'Orders', icon: 'orders' },
    { path: '/admin/audit-log', label: 'Audit Log', icon: 'audit' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar" role="navigation" aria-label="Admin navigation">
        <div className="font-bold text-lg text-primary mb-6">Admin Panel</div>
        <nav className="flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              end={item.path === '/admin'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main" role="main">
        <Outlet />
      </main>
    </div>
  );
}