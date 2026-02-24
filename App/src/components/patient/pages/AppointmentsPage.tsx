import React, { useState } from 'react';
import Icon from '../sub-components/Icon';
import '../../../styles/patientDashboard.css';

const AppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Dummy data
  const appointments = {
    upcoming: [
      { id: 1, doctor: 'Dr. Ahmed Ali', specialization: 'Cardiology', date: '2023-07-25', time: '10:30 AM', status: 'Confirmed' },
      { id: 2, doctor: 'Dr. Sara Salem', specialization: 'Dermatology', date: '2023-08-05', time: '2:00 PM', status: 'Pending' },
    ],
    completed: [
      { id: 3, doctor: 'Dr. Michael Brown', specialization: 'Neurology', date: '2023-06-15', time: '11:00 AM', status: 'Completed' },
    ],
    cancelled: [
      { id: 4, doctor: 'Dr. Jessica Davis', specialization: 'Pediatrics', date: '2023-07-10', time: '9:00 AM', status: 'Cancelled by Patient' },
    ],
  };

  const renderTable = (data: any[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Doctor</th>
          <th>Specialization</th>
          <th>Date & Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(apt => (
          <tr key={apt.id}>
            <td>{apt.doctor}</td>
            <td>{apt.specialization}</td>
            <td>{apt.date} at {apt.time}</td>
            <td>
              <span className={`badge badge-${apt.status === 'Confirmed' ? 'success' : apt.status === 'Pending' ? 'warning' : 'danger'}`} style={{display: 'inline-flex', alignItems: 'center'}}>
                {apt.status === 'Confirmed' && <Icon name="check-circle" />}
                {apt.status === 'Pending' && <Icon name="clock" />}
                {apt.status === 'Completed' && <Icon name="check-circle" />}
                {apt.status === 'Cancelled' && <Icon name="x-circle" />}
                {apt.status}
              </span>
            </td>
            <td>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Reschedule</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>Manage your upcoming and past appointments.</p>
      </div>

      <div className="card">
        <div className="tabs">
          {['upcoming', 'completed', 'cancelled'].map(tab => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>
        {renderTable(appointments[activeTab as keyof typeof appointments])}
      </div>
    </>
  );
};

export default AppointmentsPage;