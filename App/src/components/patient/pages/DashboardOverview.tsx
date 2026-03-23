import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../sub-components/Icon';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import '../../../styles/patientDashboard.css';

interface Appointment {
  id: string;
  doctor: string;
  specialization: string;
  date: string;
  time: string;
  status: string;
  appointment_time: string;
}

const DashboardOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patient/appointments');
      setAppointments(res.data || []);
    } catch (err: any) {
      console.error('Fetch appointments error:', err);
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // Get next upcoming appointment
  const getNextAppointment = () => {
    const now = new Date();
    const upcoming = appointments
      .filter(apt => {
        const aptDate = new Date(apt.appointment_time);
        return aptDate > now && apt.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
    
    console.log('All appointments:', appointments);
    console.log('Upcoming appointments:', upcoming);
    return upcoming[0] || null;
  };

  // Get current active case (any non-cancelled appointment)
  const getCurrentCase = () => {
    const active = appointments
      .filter(apt => apt.status !== 'cancelled')
      .sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
    
    console.log('Active appointments for current case:', active);
    return active[0] || null;
  };

  const nextAppointment = getNextAppointment();
  const currentCase = getCurrentCase();

  const notifications = [
    { id: 1, text: 'Your lab results are ready.', type: 'info' },
    { id: 2, text: 'Appointment confirmed with Dr. Ahmed Ali.', type: 'success' },
  ];

  const formatAppointmentTime = (appointmentTime: string) => {
    const appointmentDate = new Date(appointmentTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time to midnight for date comparison
    const aptDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    const isToday = aptDateOnly.getTime() === todayDateOnly.getTime();
    const isTomorrow = aptDateOnly.getTime() === tomorrowDateOnly.getTime();

    // Format time
    const timeStr = appointmentDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    if (isToday) {
      return `${timeStr}, Today`;
    } else if (isTomorrow) {
      return `${timeStr}, Tomorrow`;
    } else {
      const dateStr = appointmentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${timeStr}, ${dateStr}`;
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="page-header">
        <h1>Loading...</h1>
        <p>Please wait while we load your information.</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {user?.fullName || 'Patient'}!</h1>
        <p>Here is an overview of your health information.</p>
      </div>

      <div className="card welcome-card">
        <h2>Your Next Appointment</h2>
        {nextAppointment ? (
          <>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>With Dr. {nextAppointment.doctor}</p>
            <p style={{ fontSize: '1.1rem', marginTop: '10px' }}>At: {formatAppointmentTime(currentCase.appointment_time)}</p>
          </>
        ) : (
          <p style={{ color: '#7f8c8d' }}>No upcoming appointments scheduled</p>
        )}
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
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Current Case Summary</h3>
          {currentCase && (
            <span className="badge badge-warning">{currentCase.status}</span>
          )}
        </div>
        {currentCase ? (
          <>
            <p><strong>Assigned Doctor:</strong> {currentCase.doctor}</p>
            <p><strong>Specialization:</strong> {currentCase.specialization}</p>
            <p><strong>Appointment Time:</strong> {formatAppointmentTime(currentCase.appointment_time)}</p>
            <p><strong>Last Update:</strong> {getTimeSince(currentCase.appointment_time)}</p>
          </>
        ) : (
          <p style={{ color: '#7f8c8d' }}>No active case at the moment</p>
        )}
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