import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  product?: {
    name: string;
    name_bn: string;
  };
}

export function AdminVariants() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Array<{id: string, name: string, name_bn: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filterProductId, setFilterProductId] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterProductId) params.append('productId', filterProductId);

      const response = await fetch(`/api/admin/variants?${params}`, { credentials: 'include' });
      const data = await response.json();
      setVariants(data.variants || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
    } catch (error) {
      console.error('Failed to fetch variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products?limit=100', { credentials: 'include' });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    fetchVariants();
    fetchProducts();
  }, [pagination.page, filterProductId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/variants/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        showToast('success', 'Variant deleted');
        fetchVariants();
      } else {
        showToast('error', 'Failed to delete variant');
      }
    } catch (error) {
      showToast('error', 'Failed to delete variant');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Variants</h1>
        <Link to="/admin/variants/new" className="btn btn-primary">
          Add Variant
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="admin-form-group flex-1 min-w-[200px]">
            <label className="admin-form-label">Filter by Product</label>
            <select
              className="admin-form-input"
              value={filterProductId}
              onChange={e => { setFilterProductId(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {isBn ? p.name_bn : p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <h3 className="empty-state-title">No Variants Yet</h3>
          <p className="empty-state-text">Create variants for your products.</p>
          <Link to="/admin/variants/new" className="btn btn-primary mt-4">
            Add Variant
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(variant => (
                  <tr key={variant.id}>
                    <td>
                      <div>
                        <p className="font-medium">{variant.product ? (isBn ? variant.product.name_bn : variant.product.name) : 'Unknown'}</p>
                        <p className="text-sm text-muted">{variant.product_id.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{variant.sku}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded" style={{ backgroundColor: variant.color_hex }} />
                        <span>{isBn ? variant.color_name_bn : variant.color_name}</span>
                      </div>
                    </td>
                    <td>{variant.size}</td>
                    <td>৳{(variant.price_override ?? 0).toLocaleString()}</td>
                    <td>{variant.stock}</td>
                    <td>
                      <span className={`badge ${variant.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/variants/${variant.id}/edit`} className="btn btn-sm btn-outline">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(variant.id)}
                          disabled={deletingId === variant.id}
                          className="btn btn-sm btn-danger"
                        >
                          {deletingId === variant.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-sm btn-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-sm btn-secondary"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}