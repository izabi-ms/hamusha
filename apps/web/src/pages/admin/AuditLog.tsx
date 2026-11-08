import React, { useState, useEffect } from 'react';
import { useLocale } from '../../context/LocaleContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AdminAuditLog() {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterEntityType) params.append('entityType', filterEntityType);
      if (filterAction) params.append('action', filterAction);

      const response = await fetch(`/api/admin/audit-log?${params}`, { credentials: 'include' });
      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 0 }));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filterEntityType, filterAction]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isBn ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Audit Log</h1>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="admin-form-group flex-1 min-w-[200px]">
            <label className="admin-form-label">Entity Type</label>
            <select
              className="admin-form-input"
              value={filterEntityType}
              onChange={e => { setFilterEntityType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Types</option>
              <option value="product">Product</option>
              <option value="variant">Variant</option>
              <option value="payment">Payment</option>
            </select>
          </div>
          <div className="admin-form-group flex-1 min-w-[200px]">
            <label className="admin-form-label">Action</label>
            <select
              className="admin-form-input"
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Actions</option>
              <option value="create_product">Create Product</option>
              <option value="update_product">Update Product</option>
              <option value="delete_product">Delete Product</option>
              <option value="create_variant">Create Variant</option>
              <option value="update_variant">Update Variant</option>
              <option value="delete_variant">Delete Variant</option>
              <option value="sslcommerz_ipn_invalid_signature">Invalid IPN Signature</option>
              <option value="sslcommerz_ipn_amount_mismatch">IPN Amount Mismatch</option>
            </select>
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h3 className="empty-state-title">No Audit Logs</h3>
          <p className="empty-state-text">No audit log entries found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-sm text-muted">{formatDate(log.created_at)}</td>
                    <td className="font-mono text-sm">{log.admin_user_id.slice(0, 8)}</td>
                    <td>
                      <span className="badge badge-neutral text-xs">{log.action}</span>
                    </td>
                    <td>{log.entity_type}</td>
                    <td className="font-mono text-sm">{log.entity_id?.slice(0, 12) || '-'}</td>
                    <td className="text-sm text-muted">{log.ip_address || '-'}</td>
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