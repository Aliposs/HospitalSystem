import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import StatisticsCard from './StatisticsCard';
import UserStatsChart from './UserStatsChart';
import CaseStatsChart from './CaseStatsChart';
import '../../../styles/adminDashboard.css';

interface DashboardStats {
  users: {
    total: number;
    by_role: Record<string, number>;
    by_status: Record<string, number>;
  };
  cases: {
    total: number;
    by_status: Record<string, number>;
    by_specialization: Record<string, number>;
  };
  lab_tests: {
    total: number;
    by_status: Record<string, number>;
    by_lab: Record<string, number>;
  };
  last_updated: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/statistics');
      // Backend returns { success: true, data: {...} }
      // axios already extracts response.data, so we get { success: true, data: {...} }
      // We need the nested data property
      setStats(response.data.data || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="dashboard-error">No data available</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <button className="refresh-btn" onClick={fetchStatistics}>
          🔄 Refresh
        </button>
      </div>

      {/* Top Statistics Cards */}
      <div className="statistics-grid">
        <StatisticsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon="👥"
          color="blue"
        />
        <StatisticsCard
          title="Total Cases"
          value={stats?.cases?.total || 0}
          icon="📋"
          color="green"
        />
        <StatisticsCard
          title="Lab Tests"
          value={stats?.lab_tests?.total || 0}
          icon="🧪"
          color="purple"
        />
        <StatisticsCard
          title="Active Users"
          value={stats?.users?.by_status?.['Active'] || 0}
          icon="✅"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Users by Role</h3>
          <UserStatsChart data={stats?.users?.by_role || {}} />
        </div>

        <div className="chart-container">
          <h3>Cases by Status</h3>
          <CaseStatsChart data={stats?.cases?.by_status || {}} />
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="pending-section">
      </div>

      {/* Last Updated */}
      <div className="dashboard-footer">
        <p>Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
