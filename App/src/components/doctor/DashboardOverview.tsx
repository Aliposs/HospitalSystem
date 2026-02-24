import '../../styles/dashboardOverview.css';

const DashboardOverview = () => {
  const recentActivities = [
    { id: 1, patient: 'Sarah Johnson', lastUpdate: '2 hours ago', status: 'New diagnosis' },
    { id: 2, patient: 'Michael Brown', lastUpdate: '5 hours ago', status: 'Lab test requested' },
    { id: 3, patient: 'Emily Davis', lastUpdate: '1 day ago', status: 'Treatment updated' },
    { id: 4, patient: 'Robert Wilson', lastUpdate: '2 days ago', status: 'Appointment completed' },
  ];

  const notifications = [
    { id: 1, message: 'New patient assigned: Sarah Johnson', time: '30 minutes ago' },
    { id: 2, message: 'Lab result available for Michael Brown', time: '2 hours ago' },
    { id: 3, message: 'Appointment reminder: Emily Davis tomorrow at 10:00 AM', time: '3 hours ago' },
  ];

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
            <p className="card-value">142</p>
            <span className="card-change">+12% from last month</span>
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
            <p className="card-value">8</p>
            <span className="card-change">3 completed, 5 upcoming</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2v6"></path>
              <path d="M15 2v6"></path>
              <path d="M12 2v6"></path>
              <path d="M5 9h14l-1 12H6L5 9z"></path>
              <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
            </svg>
          </div>
          <div className="card-content">
            <h3>Pending Lab Results</h3>
            <p className="card-value">5</p>
            <span className="card-change">2 results received today</span>
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
            <p className="card-value">27</p>
            <span className="card-change">3 new cases this week</span>
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
                  <th>Last Update</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map(activity => (
                  <tr key={activity.id}>
                    <td>{activity.patient}</td>
                    <td>{activity.lastUpdate}</td>
                    <td><span className="status-badge">{activity.status}</span></td>
                    <td><button className="view-button">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="notifications-panel">
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.map(notification => (
              <div key={notification.id} className="notification-item">
                <p>{notification.message}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;