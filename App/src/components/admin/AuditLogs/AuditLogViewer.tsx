import React, { useEffect, useState } from "react";
import api from '../../../lib/api';
import AuditLogTable from "./AuditLogTable";
import "../../../styles/adminAuditLogs.css";

interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, any>;
  status: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action_type: "",
    resource_type: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action_type && { action_type: filters.action_type }),
        ...(filters.resource_type && { resource_type: filters.resource_type }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });

      const response = await api.get(`/admin/audit-logs?${params}`);
      // Backend returns { success: true, data: { logs: [...], pagination: {...} } }
      const data = response.data.data || response.data;
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <div className="audit-log-page">
      <div className="page-header">
        <h2>Audit Logs</h2>
        <p className="page-subtitle">Track all admin actions and changes</p>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-group">
          <label>Action Type:</label>
          <select
            value={filters.action_type}
            onChange={(e) =>
              handleFilterChange({ ...filters, action_type: e.target.value })
            }
          >
            <option value="\">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="ACTIVATE">Activate</option>
            <option value="DEACTIVATE">Deactivate</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Resource Type:</label>
          <select
            value={filters.resource_type}
            onChange={(e) =>
              handleFilterChange({ ...filters, resource_type: e.target.value })
            }
          >
            <option value="\">All Resources</option>
            <option value="User">User</option>
            <option value="Doctor">Doctor</option>
            <option value="Specialization">Specialization</option>
            <option value="Schedule">Schedule</option>
            <option value="Account">Account</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) =>
              handleFilterChange({ ...filters, start_date: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) =>
              handleFilterChange({ ...filters, end_date: e.target.value })
            }
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading audit logs...</div>
      ) : (
        <>
          <AuditLogTable logs={logs} />

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              ← Previous
            </button>

            <span className="page-info">
              Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
              total)
            </span>

            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogViewer;
