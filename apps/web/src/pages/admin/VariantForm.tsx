import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface VariantFormData {
  product_id: string;
  sku: string;
  color_hex: string;
  color_name: string;
  color_name_bn: string;
  size: string;
  price_override: number | null;
  stock: number;
  is_active: boolean;
}

const initialFormData: VariantFormData = {
  product_id: '',
  sku: '',
  color_hex: '#1A1A2E',
  color_name: '',
  color_name_bn: '',
  size: 'M',
  price_override: null,
  stock: 0,
  is_active: true,
};

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export function AdminVariantForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';
  const isEditing = !!id;
  const [formData, setFormData] = useState<VariantFormData>(initialFormData);
  const [products, setProducts] = useState<Array<{id: string, name: string, name_bn: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products?limit=100', { credentials: 'include' });
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchVariant = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/admin/variants/${id}`, { credentials: 'include' });
          const data = await response.json();
          if (data.variant) {
            setFormData({
              product_id: data.variant.product_id,
              sku: data.variant.sku,
              color_hex: data.variant.color_hex,
              color_name: data.variant.color_name,
              color_name_bn: data.variant.color_name_bn,
              size: data.variant.size,
              price_override: data.variant.price_override,
              stock: data.variant.stock,
              is_active: data.variant.is_active,
            });
          }
        } catch (error) {
          console.error('Failed to fetch variant:', error);
          showToast('error', 'Failed to load variant');
        } finally {
          setLoading(false);
        }
      };
      fetchVariant();
    }
  }, [id, showToast]);

  const handleChange = (field: keyof VariantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEditing ? `/api/admin/variants/${id}` : '/api/admin/variants';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('success', isEditing ? 'Variant updated' : 'Variant created');
        navigate('/admin/variants');
      } else {
        showToast('error', data.error || 'Failed to save variant');
      }
    } catch (error) {
      showToast('error', 'Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">{isEditing ? 'Edit Variant' : 'Create Variant'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-group">
          <label className="admin-form-label">Product *</label>
          <select
            className="admin-form-input"
            value={formData.product_id}
            onChange={e => handleChange('product_id', e.target.value)}
            required
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {isBn ? p.name_bn : p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-form-label">SKU *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.sku}
              onChange={e => handleChange('sku', e.target.value.toUpperCase())}
              required
              placeholder="TSHIRT-BLACK-M"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Size *</label>
            <select
              className="admin-form-input"
              value={formData.size}
              onChange={e => handleChange('size', e.target.value)}
              required
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-form-label">Color Hex *</label>
            <input
              type="color"
              className="admin-form-input"
              value={formData.color_hex}
              onChange={e => handleChange('color_hex', e.target.value)}
              required
              style={{ height: '44px', padding: '4px' }}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Color Name (EN) *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.color_name}
              onChange={e => handleChange('color_name', e.target.value)}
              required
              placeholder="Midnight Navy"
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Color Name (BN) *</label>
          <input
            type="text"
            className="admin-form-input"
            value={formData.color_name_bn}
            onChange={e => handleChange('color_name_bn', e.target.value)}
            required
            placeholder="মিডনাইট নেভি"
          />
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-form-label">Price Override (Optional)</label>
            <input
              type="number"
              className="admin-form-input"
              value={formData.price_override ?? ''}
              onChange={e => handleChange('price_override', e.target.value ? parseFloat(e.target.value) : null)}
              min="0"
              step="0.01"
              placeholder="Leave empty for base price"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Stock *</label>
            <input
              type="number"
              className="admin-form-input"
              value={formData.stock}
              onChange={e => handleChange('stock', parseInt(e.target.value) || 0)}
              required
              min="0"
            />
          </div>
        </div>

        <div className="admin-form-group admin-form-checkbox">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={e => handleChange('is_active', e.target.checked)}
          />
          <label htmlFor="is_active">Active</label>
        </div>

        <div className="admin-form-actions">
          <button type="button" onClick={() => navigate('/admin/variants')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
}