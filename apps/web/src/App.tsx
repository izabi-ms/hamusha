import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Catalog = lazy(() => import('./pages/Catalog').then(m => ({ default: m.Catalog })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Orders = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('./pages/OrderDetail').then(m => ({ default: m.OrderDetail })));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess').then(m => ({ default: m.CheckoutSuccess })));
const CheckoutFail = lazy(() => import('./pages/CheckoutFail').then(m => ({ default: m.CheckoutFail })));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/Products').then(m => ({ default: m.AdminProducts })));
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm').then(m => ({ default: m.AdminProductForm })));
const AdminVariants = lazy(() => import('./pages/admin/Variants').then(m => ({ default: m.AdminVariants })));
const AdminVariantForm = lazy(() => import('./pages/admin/VariantForm').then(m => ({ default: m.AdminVariantForm })));
const AdminOrders = lazy(() => import('./pages/admin/Orders').then(m => ({ default: m.AdminOrders })));
const AdminAuditLog = lazy(() => import('./pages/admin/AuditLog').then(m => ({ default: m.AdminAuditLog })));

function App() {
  return (
    <ToastProvider>
      <div className="page" dir={document.documentElement.lang === 'bn' ? 'rtl' : 'ltr'}>
        <Header />
        <main className="page-main">
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/bn" element={<Layout><Home /></Layout>} />
              <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
              <Route path="/bn/catalog" element={<Layout><Catalog /></Layout>} />
              <Route path="/product/:slug" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/bn/product/:slug" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/bn/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/bn/checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
              <Route path="/bn/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
              <Route path="/checkout/fail" element={<Layout><CheckoutFail /></Layout>} />
              <Route path="/bn/checkout/fail" element={<Layout><CheckoutFail /></Layout>} />
              <Route path="/checkout/cancel" element={<Layout><CheckoutFail /></Layout>} />
              <Route path="/bn/checkout/cancel" element={<Layout><CheckoutFail /></Layout>} />
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/bn/login" element={<Layout><Login /></Layout>} />
              <Route path="/register" element={<Layout><Register /></Layout>} />
              <Route path="/bn/register" element={<Layout><Register /></Layout>} />
              
              {/* Protected user routes */}
              <Route path="/orders" element={<Layout><Orders /></Layout>} />
              <Route path="/bn/orders" element={<Layout><Orders /></Layout>} />
              <Route path="/orders/:id" element={<Layout><OrderDetail /></Layout>} />
              <Route path="/bn/orders/:id" element={<Layout><OrderDetail /></Layout>} />
              
              {/* Admin routes */}
              <Route path="/admin/*" element={
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id/edit" element={<AdminProductForm />} />
                    <Route path="variants" element={<AdminVariants />} />
                    <Route path="variants/new" element={<AdminVariantForm />} />
                    <Route path="variants/:id/edit" element={<AdminVariantForm />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="audit-log" element={<AdminAuditLog />} />
                  </Routes>
                </AdminLayout>
              } />
              
              {/* Redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;