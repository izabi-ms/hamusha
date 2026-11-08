import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import ProductCard from '../components/ProductCard';
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

interface Category {
  category: string;
  category_bn: string;
}

export function Catalog() {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort,
      });
      if (selectedCategory) params.append('category', selectedCategory);
      if (search) params.append('search', search);

      const response = await fetch(`/api/catalog/products?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, search, sort, pagination.page]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="page-title">{t('catalog.title')}</h1>
        <p className="page-subtitle">{t('catalog.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setSelectedCategory(''); setPagination(p => ({ ...p, page: 1 })); }}
            >
              {t('catalog.category.all')}
            </button>
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`btn btn-sm ${selectedCategory === cat.category ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setSelectedCategory(cat.category); setPagination(p => ({ ...p, page: 1 })); }}
              >
                {isBn ? cat.category_bn : cat.category}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                type="search"
                placeholder={t('search')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                className="form-input pl-10 pr-4 w-64"
                aria-label={t('search')}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" />
              </svg>
            </div>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as any); setPagination(p => ({ ...p, page: 1 })); }}
              className="form-input w-auto"
              aria-label={t('sort')}
            >
              <option value="newest">{t('catalog.sort')} - Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-sm btn-secondary"
                aria-label="Previous page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`btn btn-sm ${pagination.page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pagination.page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-sm btn-secondary"
                aria-label="Next page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <h3 className="empty-state-title">{t('catalog.no_products')}</h3>
          <p className="empty-state-text">Try adjusting your filters or search terms</p>
          <button
            onClick={() => { setSelectedCategory(''); setSearch(''); }}
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}