import React from 'react';
import { Link } from 'react-router-dom';
import { Product, Variant } from '@haimish/shared';
import { useLocale } from '../context/LocaleContext';

interface ProductCardProps {
  product: Product;
  variants?: Variant[];
}

export default function ProductCard({ product, variants = [] }: ProductCardProps) {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';

  // Get minimum price from variants or use base price
  const minPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.priceOverride ?? product.basePrice))
    : product.basePrice;

  return (
    <article className="card product-card group">
      <Link
        to={isBn ? `/bn/product/${product.slug}` : `/product/${product.slug}`}
        className="block"
        aria-label={`${product.name} - ${t('catalog.view_details')}`}
      >
        <img
          src={product.poster_png_url}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
        />
        <div className="product-card-content">
          <span className="product-card-category">{isBn ? product.category_bn : product.category}</span>
          <h3 className="product-card-title">{isBn ? product.name_bn : product.name}</h3>
          <div className="product-card-price">
            {t('catalog.price_from')} {' '}
            <span className="font-bold">৳{minPrice.toLocaleString()}</span>
          </div>
        </div>
      </Link>
      <div className="product-card-actions p-4 pt-0">
        <Link
          to={isBn ? `/bn/product/${product.slug}` : `/product/${product.slug}`}
          className="btn btn-primary btn-block flex-1"
        >
          {t('catalog.view_details')}
        </Link>
      </div>
    </article>
  );
}