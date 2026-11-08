import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';
import CartItem from '../components/CartItem';
import LoadingSpinner from '../components/LoadingSpinner';

export function Cart() {
  const { cart, loading, refreshCart, removeItem } = useCart();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: '50vh' }}>
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <h3 className="empty-state-title">{t('cart.empty')}</h3>
        <p className="empty-state-text">Looks like you haven't added any items yet.</p>
        <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-primary mt-4">
          {t('cart.continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">{t('cart.title')}</h1>
          <span className="text-muted">{cart.itemCount} {t('cart.item')}{cart.itemCount !== 1 ? 's' : ''}</span>
        </div>

        <div className="cart-items" role="list" aria-label="Cart items">
          {cart.items.map(item => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      <aside>
        <div className="cart-summary">
          <h2 className="cart-summary-title">{t('cart.order_summary')}</h2>
          
          <div className="cart-summary-row">
            <span>{t('cart.subtotal')}</span>
            <span>৳{cart.subtotal.toLocaleString()}</span>
          </div>
          
          <div className="cart-summary-row">
            <span>{t('cart.shipping')}</span>
            <span>{cart.shipping === 0 ? 'Free' : `৳${cart.shipping.toLocaleString()}`}</span>
          </div>
          
          {cart.shipping === 0 && (
            <p className="cart-summary-free-shipping">You got free shipping!</p>
          )}
          
          <div className="cart-summary-row">
            <span>{t('cart.tax')} (5%)</span>
            <span>৳{cart.tax.toLocaleString()}</span>
          </div>
          
          <div className="cart-summary-row total">
            <span>{t('cart.total')}</span>
            <span>৳{cart.total.toLocaleString()}</span>
          </div>

          <Link
            to={isBn ? '/bn/checkout' : '/checkout'}
            className="btn btn-primary btn-block btn-lg mt-6"
          >
            {t('cart.checkout')}
          </Link>

          <Link
            to={isBn ? '/bn/catalog' : '/catalog'}
            className="btn btn-secondary btn-block mt-2"
          >
            {t('cart.continue_shopping')}
          </Link>
        </div>
      </aside>
    </div>
  );
}