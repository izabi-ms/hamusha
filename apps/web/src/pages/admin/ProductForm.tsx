import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ProductFormData {
  slug: string;
  name: string;
  name_bn: string;
  description: string;
  description_bn: string;
  category: string;
  category_bn: string;
  base_price: number;
  poster_png_url: string;
  template_id: string;
  is_active: boolean;
}

const initialFormData: ProductFormData = {
  slug: '',
  name: '',
  name_bn: '',
  description: '',
  description_bn: '',
  category: 'tshirts',
  category_bn: 'টিশার্ট',
  base_price: 0,
  poster_png_url: 'https://via.placeholder.com/600x800/4F46E5/FFFFFF?text=Haimish+Product',
  template_id: '',
  is_active: true,
};

const categories = [
  { value: 'tshirts', label: { en: 'T-Shirts', bn: 'টিশার্ট' } },
  { value: 'hoodies', label: { en: 'Hoodies', bn: 'হুডি' } },
  { value: 'accessories', label: { en: 'Accessories', bn: 'অ্যাক্সেসরি' } },
];

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isBn = locale === 'bn';
  const isEditing = !!id;
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/admin/products/${id}`, { credentials: 'include' });
          const data = await response.json();
          if (data.product) {
            setFormData({
              slug: data.product.slug,
              name: data.product.name,
              name_bn: data.product.name_bn,
              description: data.product.description,
              description_bn: data.product.description_bn,
              category: data.product.category,
              category_bn: data.product.category_bn,
              base_price: data.product.base_price,
              poster_png_url: data.product.poster_png_url,
              template_id: data.product.template_id || '',
              is_active: data.product.is_active,
            });
          }
        } catch (error) {
          console.error('Failed to fetch product:', error);
          showToast('error', 'Failed to load product');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, showToast]);

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEditing ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('success', isEditing ? 'Product updated' : 'Product created');
        navigate('/admin/products');
      } else {
        showToast('error', data.error || 'Failed to save product');
      }
    } catch (error) {
      showToast('error', 'Failed to save product');
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
        <h1 className="admin-title">{isEditing ? 'Edit Product' : 'Create Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-form-label">Slug *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.slug}
              onChange={e => handleChange('slug', e.target.value)}
              required
              disabled={isEditing}
              placeholder="product-slug"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Category *</label>
            <select
              className="admin-form-input"
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {isBn ? cat.label.bn : cat.label.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-form-label">Name (EN) *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
              placeholder="Product Name"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Name (BN) *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.name_bn}
              onChange={e => handleChange('name_bn', e.target.value)}
              required
              placeholder="পণ্যের নাম"
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Description (EN) *</label>
          <textarea
            className="admin-form-input admin-form-textarea"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            required
            placeholder="Product description in English"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Description (BN) *</label>
          <textarea
            className="admin-form-input admin-form-textarea"
            value={formData.description_bn}
            onChange={e => handleChange('description_bn', e.target.value)}
            required
            placeholder="পণ্যের বিবরণ বাংলায়"
          />
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-form-label">Category Name (BN) *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formData.category_bn}
              onChange={e => handleChange('category_bn', e.target.value)}
              required
              placeholder="ক্যাটাগরির নাম বাংলায়"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Base Price (BDT) *</label>
            <input
              type="number"
              className="admin-form-input"
              value={formData.base_price}
              onChange={e => handleChange('base_price', parseFloat(e.target.value) || 0)}
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Poster Image URL *</label>
          <input
            type="url"
            className="admin-form-input"
            value={formData.poster_png_url}
            onChange={e => handleChange('poster_png_url', e.target.value)}
            required
            placeholder="https://example.com/image.png"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Template ID (Optional)</label>
          <input
            type="text"
            className="admin-form-input"
            value={formData.template_id}
            onChange={e => handleChange('template_id', e.target.value)}
            placeholder="tpl_tshirt_classic"
          />
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
          <button type="button" onClick={() => navigate('/admin/products')} className="btn btn-secondary">
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