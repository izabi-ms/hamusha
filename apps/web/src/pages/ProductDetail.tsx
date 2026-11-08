import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Product {
  id: string;
  slug: string;
  name: string;
  name_bn: string;
  description: string;
  description_bn: string;
  category: string;
  category_bn: string;
  base_price: number;
  poster_png_url: string;
  template_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Variant {
  id: string;
  product_id: string;
  sku: string;
  color_hex: string;
  color_name: string;
  color_name_bn: string;
  size: string;
  price_override: number | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t } = useLocale();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const isBn = locale === 'bn';

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/catalog/products/${slug}`);
        const data = await response.json();
        if (data.product) {
          setProduct(data.product);
          setVariants(data.variants || []);
          
          // Auto-select first available color and size
          if (data.variants?.length > 0) {
            const firstColor = data.variants[0].color_hex;
            setSelectedColor(firstColor);
            const firstSize = data.variants.find((v: Variant) => v.color_hex === firstColor && v.stock > 0)?.size;
            if (firstSize) setSelectedSize(firstSize);
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Get available sizes for selected color
  const availableSizes = variants
    .filter(v => v.color_hex === selectedColor && v.stock > 0)
    .map(v => v.size);

  // Get selected variant
  const selectedVariant = variants.find(
    v => v.color_hex === selectedColor && v.size === selectedSize
  );

  // Get all unique colors
  const colors = [...new Map(variants.map(v => [v.color_hex, v])).values()];

  const price = selectedVariant?.price_override ?? product?.base_price ?? 0;
  const inStock = selectedVariant && selectedVariant.stock > 0;

  const handleAddToCart = async () => {
    if (!selectedVariant || !inStock) return;
    
    setAddingToCart(true);
    try {
      const result = await addItem(selectedVariant.id, quantity);
      if (result.success) {
        showToast('success', 'Added to cart!');
      } else {
        showToast('error', result.error || 'Failed to add to cart');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
        </svg>
        <h3 className="empty-state-title">Product Not Found</h3>
        <p className="empty-state-text">The product you're looking for doesn't exist or has been removed.</p>
        <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-primary mt-4">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      {/* Gallery */}
      <div className="product-gallery">
        <img
          src={product.poster_png_url}
          alt={isBn ? product.name_bn : product.name}
          className="product-main-image"
        />
      </div>

      {/* Info */}
      <div className="product-info">
        <div>
          <span className="product-category">{isBn ? product.category_bn : product.category}</span>
          <h1 className="product-title">{isBn ? product.name_bn : product.name}</h1>
          <div className="product-price">৳{price.toLocaleString()}</div>
        </div>

        <div className="product-description">
          <h3 className="font-semibold mb-2">Description</h3>
          <p>{isBn ? product.description_bn : product.description}</p>
        </div>

        {/* Variants */}
        {variants.length > 0 && (
          <div className="product-variants">
            {/* Color Selection */}
            <div className="variant-group">
              <label className="variant-group-label">Color</label>
              <div className="color-options" role="radiogroup" aria-label="Select color">
                {colors.map(color => (
                  <div key={color.id} className="color-option">
                    <input
                      type="radio"
                      id={`color-${color.id}`}
                      name="color"
                      value={color.color_hex}
                      checked={selectedColor === color.color_hex}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        // Auto-select first available size for this color
                        const firstSize = variants.find(v => v.color_hex === e.target.value && v.stock > 0)?.size;
                        if (firstSize) setSelectedSize(firstSize);
                        else setSelectedSize('');
                      }}
                      disabled={!variants.some(v => v.color_hex === color.color_hex && v.stock > 0)}
                      aria-label={`${color.color_name} (${color.color_hex})`}
                    />
                    <label
                      htmlFor={`color-${color.id}`}
                      className="color-option-label"
                      style={{ '--color-hex': color.color_hex }}
                      aria-label={`${color.color_name} - ${color.color_hex}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="variant-group">
              <label className="variant-group-label">Size</label>
              <div className="size-options" role="radiogroup" aria-label="Select size">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'].map(size => {
                  const hasStock = variants.some(v => v.color_hex === selectedColor && v.size === size && v.stock > 0);
                  return (
                    <div key={size} className="size-option">
                      <input
                        type="radio"
                        id={`size-${size}`}
                        name="size"
                        value={size}
                        checked={selectedSize === size}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        disabled={!hasStock}
                        aria-label={`Size ${size}`}
                      />
                      <label
                        htmlFor={`size-${size}`}
                        className="size-option-label"
                      >
                        {size}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="product-actions">
          <div className="quantity-selector flex-1" style={{ maxWidth: '140px' }}>
            <button
              className="quantity-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input
              type="number"
              className="quantity-input"
              value={quantity}
              min="1"
              max={selectedVariant?.stock || 99}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              aria-label="Quantity"
            />
            <button
              className="quantity-btn"
              onClick={() => setQuantity(q => Math.min(selectedVariant?.stock || 99, q + 1))}
              disabled={quantity >= (selectedVariant?.stock || 99)}
              aria-label="Increase quantity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !inStock || !selectedVariant}
            className="btn btn-primary btn-lg flex-1"
          >
            {addingToCart ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                Adding...
              </>
            ) : inStock ? (
              t('catalog.add_to_cart')
            ) : (
              t('catalog.out_of_stock')
            )}
          </button>
        </div>

        {/* Meta */}
        <div className="product-meta">
          <div className="product-meta-item">
            <span className="product-meta-label">SKU:</span>
            <span>{selectedVariant?.sku || 'N/A'}</span>
          </div>
          <div className="product-meta-item">
            <span className="product-meta-label">Stock:</span>
            <span className={inStock ? 'text-success' : 'text-danger'}>
              {inStock ? `${selectedVariant?.stock || 0} in stock` : 'Out of stock'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}