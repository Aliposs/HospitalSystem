import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import UserTable from './UserTable';
import FilterBar from './FilterBar';
import '../../../styles/adminUsers.css';

interface User {
  id: string;
  email: string;
  role: string;
  account_status: string;
  registration_date: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/admin/users?${params}`);
      // Backend returns { success: true, data: { users: [...], pagination: {...} } }
      const data = response.data.data || response.data;
      setUsers(data.users || []);
      setPagination(data.pagination || pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
      console.error('Error fetching users:', err);
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
    <div className="user-list-page">
      <div className="page-header">
        <h2>User Management</h2>
        <p className="page-subtitle">Manage all users in the system</p>
      </div>

      <FilterBar onFilterChange={handleFilterChange} />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading users...</div>
      ) : (
        <>
          <UserTable users={users} onRefresh={fetchUsers} />

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              ← Previous
            </button>

            <span className="page-info">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
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

export default UserList;
