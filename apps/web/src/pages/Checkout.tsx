import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Address {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function Checkout() {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isBn = locale === 'bn';

  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [shippingAddress, setShippingAddress] = useState<Address>({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Bangladesh',
  });

  const [billingAddress, setBillingAddress] = useState<Address>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Bangladesh',
  });

  const [paymentMethod, setPaymentMethod] = useState<'sslcommerz'>('sslcommerz');

  // Redirect if cart is empty
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      navigate(isBn ? '/bn/cart' : '/cart');
    }
  }, [cart, navigate, isBn]);

  const handleShippingChange = (field: keyof Address, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: keyof Address, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateAddress = (addr: Address): boolean => {
    return !!(addr.name && addr.phone && addr.line1 && addr.city && addr.state && addr.postalCode);
  };

  const handleNext = () => {
    if (!validateAddress(shippingAddress)) {
      showToast('error', 'Please fill in all required shipping address fields');
      return;
    }
    if (!sameAsShipping && !validateAddress(billingAddress)) {
      showToast('error', 'Please fill in all required billing address fields');
      return;
    }
    setStep('payment');
  };

  const handleBack = () => {
    setStep(prev => prev === 'payment' ? 'address' : 'confirm');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        showToast('error', data.error || 'Failed to create order');
        return;
      }

      // Initialize SSLCommerz payment
      const paymentResponse = await fetch('/api/payments/sslcommerz/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: data.order.id }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.redirectUrl) {
        // Redirect to SSLCommerz
        window.location.href = paymentData.redirectUrl;
      } else {
        showToast('error', paymentData.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('error', 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
    return <LoadingSpinner fullScreen />;
  }

  const progressSteps = [
    { key: 'address', label: 'Address' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirm', label: 'Confirm' },
  ];

  return (
    <div className="checkout-page">
      {/* Progress Indicator */}
      <div className="hidden md:flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-border" />
        {progressSteps.map((s, i) => (
          <div key={s.key} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                ['address', 'payment', 'confirm'].indexOf(step) >= ['address', 'payment', 'confirm'].indexOf(s.key)
                  ? 'bg-primary text-white'
                  : 'bg-border text-muted'
              }`}
            >
              {['address', 'payment', 'confirm'].indexOf(step) > ['address', 'payment', 'confirm'].indexOf(s.key) ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className="mt-2 text-xs font-medium text-center w-24">{t(s.label.toLowerCase() as any) || s.label}</span>
          </div>
        ))}
      </div>

      <div>
        {/* Address Step */}
        {step === 'address' && (
          <form onSubmit={e => { e.preventDefault(); handleNext(); }} className="space-y-6">
            <div className="checkout-section">
              <h2 className="checkout-section-title">{t('checkout.shipping_address')}</h2>
              <div className="checkout-form">
                <div className="checkout-form-row">
                  <div className="form-group">
                    <label className="form-label">{t('checkout.full_name')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={shippingAddress.name}
                      onChange={e => handleShippingChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.phone')} *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={shippingAddress.phone}
                      onChange={e => handleShippingChange('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('checkout.address_line1')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shippingAddress.line1}
                    onChange={e => handleShippingChange('line1', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('checkout.address_line2')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shippingAddress.line2}
                    onChange={e => handleShippingChange('line2', e.target.value)}
                  />
                </div>
                <div className="checkout-form-row">
                  <div className="form-group">
                    <label className="form-label">{t('checkout.city')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={shippingAddress.city}
                      onChange={e => handleShippingChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.state')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={shippingAddress.state}
                      onChange={e => handleShippingChange('state', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="checkout-form-row">
                  <div className="form-group">
                    <label className="form-label">{t('checkout.postal_code')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={shippingAddress.postalCode}
                      onChange={e => handleShippingChange('postalCode', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.country')}</label>
                    <select
                      className="form-input"
                      value={shippingAddress.country}
                      onChange={e => handleShippingChange('country', e.target.value)}
                    >
                      <option value="Bangladesh">Bangladesh</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="checkout-section">
              <h2 className="checkout-section-title">{t('checkout.billing_address')}</h2>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={e => setSameAsShipping(e.target.checked)}
                />
                <span>{t('checkout.same_as_shipping')}</span>
              </label>
              {!sameAsShipping && (
                <div className="checkout-form mt-4">
                  <div className="checkout-form-row">
                    <div className="form-group">
                      <label className="form-label">{t('checkout.full_name')} *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={billingAddress.name}
                        onChange={e => handleBillingChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('checkout.phone')} *</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={billingAddress.phone}
                        onChange={e => handleBillingChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.address_line1')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={billingAddress.line1}
                      onChange={e => handleBillingChange('line1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.address_line2')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={billingAddress.line2}
                      onChange={e => handleBillingChange('line2', e.target.value)}
                    />
                  </div>
                  <div className="checkout-form-row">
                    <div className="form-group">
                      <label className="form-label">{t('checkout.city')} *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={billingAddress.city}
                        onChange={e => handleBillingChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('checkout.state')} *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={billingAddress.state}
                        onChange={e => handleBillingChange('state', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="checkout-form-row">
                    <div className="form-group">
                      <label className="form-label">{t('checkout.postal_code')} *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={billingAddress.postalCode}
                        onChange={e => handleBillingChange('postalCode', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('checkout.country')}</label>
                      <select
                        className="form-input"
                        value={billingAddress.country}
                        onChange={e => handleBillingChange('country', e.target.value)}
                      >
                        <option value="Bangladesh">Bangladesh</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleNext} className="btn btn-primary btn-lg">
                Continue to Payment →
              </button>
            </div>
          </form>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <form onSubmit={e => { e.preventDefault(); handlePlaceOrder(); }} className="space-y-6">
            <div className="checkout-section">
              <h2 className="checkout-section-title">{t('checkout.payment_method')}</h2>
              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment"
                    value="sslcommerz"
                    checked={paymentMethod === 'sslcommerz'}
                    onChange={() => setPaymentMethod('sslcommerz')}
                  />
                  <span className="payment-method-label">
                    <span className="payment-method-icon">SSL</span>
                    <span>{t('checkout.sslcommerz')}</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="btn btn-secondary btn-lg">
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    {t('checkout.processing')}
                  </>
                ) : (
                  t('checkout.place_order')
                )}
              </button>
            </div>
          </form>
        )}

        {/* Confirm Step - not used since we redirect to SSLCommerz */}
      </div>

      {/* Order Summary Sidebar */}
      <aside>
        <div className="cart-summary">
          <h2 className="cart-summary-title">{t('checkout.order_summary')}</h2>
          
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {cart.items.map(item => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={item.product.poster_png_url}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted">{item.variant.colorName} • {item.variant.size}</p>
                  <p className="text-sm font-medium">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{(item.unitPrice * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="cart-summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>৳{cart.subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-summary-row">
              <span>{t('cart.shipping')}</span>
              <span>{cart.shipping === 0 ? 'Free' : `৳${cart.shipping.toLocaleString()}`}</span>
            </div>
            <div className="cart-summary-row">
              <span>{t('cart.tax')} (5%)</span>
              <span>৳{cart.tax.toLocaleString()}</span>
            </div>
            <div className="cart-summary-row total">
              <span>{t('cart.total')}</span>
              <span>৳{cart.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}