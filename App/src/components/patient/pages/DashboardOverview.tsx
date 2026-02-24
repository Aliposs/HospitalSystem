import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../sub-components/Icon';
import '../../../styles/patientDashboard.css';

const DashboardOverview: React.FC = () => {
  const nextAppointment = { doctor: 'Dr. Ahmed Ali', time: '10:30 AM, Tomorrow' };
  const currentCase = { doctor: 'Dr. Sara Salem', status: 'In Progress', lastUpdate: '2 days ago' };
  const notifications = [
    { id: 1, text: 'Your lab results are ready.', type: 'info' },
    { id: 2, text: 'Appointment confirmed with Dr. Ahmed Ali.', type: 'success' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, Patient!</h1>
        <p>Here is an overview of your health information.</p>
      </div>

      <div className="card welcome-card">
        <h2>Your Next Appointment</h2>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{nextAppointment.doctor}</p>
        <p>{nextAppointment.time}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="quick-actions">
          <Link to="/patient/find-doctor" className="quick-action-btn">
          <Icon name='search'/>
            <h4>Find a Doctor</h4>
            <p>Search and book with specialists</p>
          </Link>
          <Link to="/patient/lab-results" className="quick-action-btn">
            <Icon name='lab'/>
            <h4>View Lab Results</h4>
            <p>Check your latest test reports</p>
          </Link>
          <a href="#" className="quick-action-btn">
            <Icon name='alert-circle'/>
            <h4>Symptom Check</h4>
            <p>AI-powered preliminary analysis</p>
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Current Case Summary</h3>
          <span className="badge badge-warning">{currentCase.status}</span>
        </div>
        <p><strong>Assigned Doctor:</strong> {currentCase.doctor}</p>
        <p><strong>Last Update:</strong> {currentCase.lastUpdate}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Notifications</h3>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notifications.map(notif => (
            <li key={notif.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className={`badge badge-${notif.type}`} style={{ marginRight: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
                {notif.type === 'info' && <Icon name='info'/>}
                {notif.type === 'success' && <Icon name='check-circle'/>}
                {notif.type}
              </span>
              {notif.text}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default DashboardOverview;