import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';

export function CheckoutFail() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';

  // Show error toast on mount
  React.useEffect(() => {
    showToast('error', t('payment.failed'));
  }, [showToast, t]);

  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-danger">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h3 className="empty-state-title text-2xl">{t('payment.failed')}</h3>
      <p className="empty-state-text max-w-md">
        We couldn't process your payment. This could be due to insufficient funds,
        an expired card, or a technical issue. Please try again or use a different payment method.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link to={isBn ? '/bn/cart' : '/cart'} className="btn btn-primary btn-lg">
          Try Again
        </Link>
        <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-secondary btn-lg">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}