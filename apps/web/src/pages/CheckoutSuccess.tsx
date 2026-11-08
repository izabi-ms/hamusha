import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';
  const [verified, setVerified] = useState(false);

  const tranId = searchParams.get('tran_id');
  const valId = searchParams.get('val_id');
  const amount = searchParams.get('amount');
  const cardType = searchParams.get('card_type');

  useEffect(() => {
    // The actual verification happens via IPN webhook
    // This page just shows success message
    showToast('success', t('payment.success'));
    setVerified(true);
  }, [showToast, t]);

  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-success">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 className="empty-state-title text-2xl">{t('payment.success')}</h3>
      <p className="empty-state-text max-w-md">
        Thank you for your order! Your payment has been processed successfully.
        You will receive a confirmation email shortly.
      </p>
      
      {tranId && (
        <div className="mt-6 p-4 bg-bg rounded-lg text-left max-w-md w-full text-sm">
          <p className="font-medium mb-2">Transaction Details</p>
          <p><span className="text-muted">Transaction ID:</span> {tranId}</p>
          {valId && <p><span className="text-muted">Validation ID:</span> {valId}</p>}
          {amount && <p><span className="text-muted">Amount:</span> ৳{parseFloat(amount).toLocaleString()}</p>}
          {cardType && <p><span className="text-muted">Card Type:</span> {cardType}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link to={isBn ? '/bn/orders' : '/orders'} className="btn btn-primary btn-lg">
          View My Orders
        </Link>
        <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-secondary btn-lg">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}