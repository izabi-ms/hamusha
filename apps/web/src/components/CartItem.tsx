import React from 'react';
import { CartItem as CartItemType, Variant, Product } from '@haimish/shared';
import { useCart } from '../context/CartContext';
import { useLocale } from '../context/LocaleContext';

interface CartItemProps {
  item: CartItemType & {
    variant: Variant & { product: Product };
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const variant = item.variant;
  const product = variant.product;
  const price = variant.priceOverride ?? product.basePrice;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(item.id);
    } else {
      await updateItem(item.id, newQuantity);
    }
  };

  return (
    <div className="cart-item">
      <Link
        to={isBn ? `/bn/product/${product.slug}` : `/product/${product.slug}`}
        className="cart-item-image"
        aria-label={`${product.name} - ${t('catalog.view_details')}`}
      >
        <img
          src={product.poster_png_url}
          alt={product.name}
          loading="lazy"
        />
      </Link>

      <div className="cart-item-details">
        <Link
          to={isBn ? `/bn/product/${product.slug}` : `/product/${product.slug}`}
          className="cart-item-title"
        >
          {isBn ? product.name_bn : product.name}
        </Link>
        <div className="cart-item-variant">
          {variant.colorName} • {variant.size}
        </div>
      </div>

      <div className="cart-item-actions">
        <div className="quantity-selector">
          <button
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            type="number"
            className="quantity-input"
            value={item.quantity}
            min="1"
            max={variant.stock}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            aria-label="Quantity"
          />
          <button
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= variant.stock}
            aria-label="Increase quantity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="cart-item-price">
          ৳{(price * item.quantity).toLocaleString()}
        </div>

        <button
          onClick={() => removeItem(item.id)}
          className="btn btn-sm btn-secondary"
          aria-label="Remove item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}