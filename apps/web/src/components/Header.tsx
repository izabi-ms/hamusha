import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocale } from '../context/LocaleContext';

export default function Header() {
  const { user, logout, loading: authLoading } = useAuth();
  const { itemCount } = useCart();
  const { locale, setLocale } = useLocale();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const isAdmin = user?.role === 'admin';
  const isBn = locale === 'bn';

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to={isBn ? '/bn' : '/'} className="header-logo">
          Haimish
        </Link>

        <nav className="header-nav" role="navigation" aria-label="Main navigation">
          <Link to={isBn ? '/bn/catalog' : '/catalog'} className="header-nav-link">
            Catalog
          </Link>
          {user && (
            <Link to={isBn ? '/bn/orders' : '/orders'} className="header-nav-link">
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="header-nav-link">
              Admin
            </Link>
          )}
        </nav>

        <div className="header-actions">
          {/* Language Selector */}
          <div className="lang-selector" role="group" aria-label="Language selection">
            <button
              className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
            >
              EN
            </button>
            <button
              className={`lang-btn ${locale === 'bn' ? 'active' : ''}`}
              onClick={() => setLocale('bn')}
              aria-pressed={locale === 'bn'}
            >
              BN
            </button>
          </div>

          {/* Cart */}
          <Link
            to={isBn ? '/bn/cart' : '/cart'}
            className="header-cart-btn"
            aria-label="Shopping cart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="header-cart-count" aria-label={`${itemCount} items in cart`}>
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {authLoading ? (
            <div className="spinner" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user.name || user.email || user.phone}</span>
              {isAdmin && (
                <Link to="/admin" className="btn btn-sm btn-outline">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={isBn ? '/bn/login' : '/login'} className="btn btn-sm btn-secondary">
                Login
              </Link>
              <Link to={isBn ? '/bn/register' : '/register'} className="btn btn-sm btn-primary">
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-border bg-surface">
          <nav className="container py-4 flex flex-col gap-2" role="navigation" aria-label="Mobile navigation">
            <Link to={isBn ? '/bn/catalog' : '/catalog'} className="header-nav-link py-2" onClick={() => setMobileMenuOpen(false)}>
              Catalog
            </Link>
            {user && (
              <Link to={isBn ? '/bn/orders' : '/orders'} className="header-nav-link py-2" onClick={() => setMobileMenuOpen(false)}>
                My Orders
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="header-nav-link py-2" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
            )}
            {!user && (
              <>
                <Link to={isBn ? '/bn/login' : '/login'} className="btn btn-secondary mt-2" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to={isBn ? '/bn/register' : '/register'} className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
            {user && (
              <button onClick={handleLogout} className="btn btn-secondary mt-2" onClick={() => setMobileMenuOpen(false)}>
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}