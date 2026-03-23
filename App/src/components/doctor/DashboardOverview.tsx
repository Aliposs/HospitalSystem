import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useNotificationStore } from '../../store/notificationStore';
import '../../styles/dashboardOverview.css';

interface DashboardData {
  totalPatients: number;
  todayAppointments: { total: number; completed: number; upcoming: number };
  activeCases: number;
  recentActivities: { id: string; patient: string; lastUpdate: string; status: string }[];
}

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon: Record<string, string> = {
  new_appointment: '📅',
  cancelled_appointment: '❌',
  new_message: '💬',
};

const typeRoute: Record<string, string> = {
  new_appointment: '/doctor/appointments',
  cancelled_appointment: '/doctor/appointments',
  new_message: '/doctor/messages',
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { setUnreadCount, clearUnread, flash } = useNotificationStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/doctor/dashboard'),
      api.get('/doctor/notifications')
    ])
      .then(([dashRes, notifRes]) => {
        setData(dashRes.data);
        setNotifications(notifRes.data);
        setUnreadCount(notifRes.data.filter((n: Notification) => !n.is_read).length);
      })
      .catch(err => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/doctor/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    clearUnread();
  };

  const removeNotification = async (id: string) => {
    try {
      await api.delete(`/doctor/notifications/${id}`);
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        const newUnreadCount = updated.filter(n => !n.is_read).length;
        // Update store after state settles
        setTimeout(() => setUnreadCount(newUnreadCount), 0);
        return updated;
      });
    } catch (err) {
      console.error('Failed to remove notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const { totalPatients, todayAppointments, activeCases, recentActivities } = data || {
    totalPatients: 0,
    todayAppointments: { total: 0, completed: 0, upcoming: 0 },
    activeCases: 0,
    recentActivities: []
  };

  return (
    <div className="dashboard-overview">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="card-content">
            <h3>Total Patients</h3>
            <p className="card-value">{totalPatients}</p>
            <span className="card-change">All registered patients</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="card-content">
            <h3>Today's Appointments</h3>
            <p className="card-value">{todayAppointments.total}</p>
            <span className="card-change">{todayAppointments.completed} completed, {todayAppointments.upcoming} upcoming</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2v6"></path><path d="M15 2v6"></path><path d="M12 2v6"></path>
              <path d="M5 9h14l-1 12H6L5 9z"></path>
              <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
            </svg>
          </div>
          <div className="card-content">
            <h3>Pending Lab Results</h3>
            <p className="card-value">—</p>
            <span className="card-change">Coming soon</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="card-content">
            <h3>Active Cases</h3>
            <p className="card-value">{activeCases}</p>
            <span className="card-change">Confirmed & pending appointments</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activities-table">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No recent activity</td></tr>
                ) : (
                  recentActivities.map(activity => (
                    <tr key={activity.id}>
                      <td>{activity.patient}</td>
                      <td>{activity.lastUpdate}</td>
                      <td>
                        <span className={`status-badge ${activity.status?.toLowerCase()}`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`notifications-panel ${flash ? 'flash' : ''}`}>
          <div className="notifications-header">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p style={{ color: '#999', padding: '10px 0' }}>No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                  <span className="notif-icon">{typeIcon[n.type] || '🔔'}</span>
                  <div className="notif-content">
                    <p>{n.message}</p>
                    <div className="notif-footer">
                      <span className="notification-time">{formatTime(n.created_at)}</span>
                      {typeRoute[n.type] && (
                        <button className="goto-btn" onClick={() => navigate(typeRoute[n.type])}>
                          show
                        </button>
                      )}
                    </div>
                  </div>
                  <button className="remove-notif-btn" onClick={() => removeNotification(n.id)} title="Remove">✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
