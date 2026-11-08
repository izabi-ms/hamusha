import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Product {
  id: string;
  slug: string;
  name: string;
  name_bn: string;
  category: string;
  category_bn: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

export function AdminProducts() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products?page=${pagination.page}&limit=${pagination.limit}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setProducts(data.products || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        showToast('success', 'Product deleted');
        fetchProducts();
      } else {
        showToast('error', 'Failed to delete product');
      }
    } catch (error) {
      showToast('error', 'Failed to delete product');
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
        <h1 className="admin-title">Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <h3 className="empty-state-title">No Products Yet</h3>
          <p className="empty-state-text">Get started by creating your first product.</p>
          <Link to="/admin/products/new" className="btn btn-primary mt-4">
            Add Product
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <p className="font-medium">{isBn ? product.name_bn : product.name}</p>
                        <p className="text-sm text-muted">{product.slug}</p>
                      </div>
                    </td>
                    <td>{isBn ? product.category_bn : product.category}</td>
                    <td>৳{product.base_price.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${product.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{new Date(product.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/${product.id}/edit`} className="btn btn-sm btn-outline">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="btn btn-sm btn-danger"
                        >
                          {deletingId === product.id ? '...' : 'Delete'}
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