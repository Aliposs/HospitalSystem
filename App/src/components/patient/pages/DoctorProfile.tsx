import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../lib/api';
import '../../../styles/patientDashboard.css';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  yearsOfExperience: number;
  clinicName: string;
  profilePicture: string | null;
  education: string[];
  certificates: Array<{
    id: number;
    name: string;
    issue_date: string;
    file_path: string;
  }>;
}

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!id) {
        setError('Doctor ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/doctor/${id}`);
        setDoctor(response.data);
      } catch (err: any) {
        console.error('Failed to fetch doctor profile:', err);
        setError(err.response?.data?.error || 'Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [id]);

  const handleBooking = (time: string) => {
    if (!doctor) return;
    alert(`Booking appointment with ${doctor.name} on ${selectedDate} at ${time}`);
  };

  const handleViewCertificate = (filePath: string) => {
    if (!filePath) {
      alert('No file available');
      return;
    }
    const fullUrl = `http://localhost:5000${filePath}`;
    window.open(fullUrl, '_blank');
  };

  // Simple calendar mockup
  const renderCalendar = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = Array.from({ length: 30 }, (_, i) => i + 1);
    const times = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

    return (
      <div className="card">
        <h3>Available Slots</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '1rem' }}>
          {days.map(day => <strong key={day}>{day}</strong>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(`2023-07-${date}`)}
              className={`btn ${selectedDate === `2023-07-${date}` ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem' }}
            >
              {date}
            </button>
          ))}
        </div>
        {selectedDate && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4>Available times for {selectedDate}:</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {times.map(time => (
                <button key={time} onClick={() => handleBooking(time)} className="btn btn-secondary">{time}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading doctor profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
        <p>{error || 'Doctor not found'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        {doctor.profilePicture && (
          <img 
            src={`http://localhost:5000${doctor.profilePicture}`} 
            alt={doctor.name}
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              marginBottom: '1rem'
            }}
          />
        )}
        <h1>{doctor.name}</h1>
        <p>{doctor.specialization}</p>
        {doctor.yearsOfExperience && (
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            {doctor.yearsOfExperience} years of experience
          </p>
        )}
        {doctor.clinicName && (
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            {doctor.clinicName}
          </p>
        )}
      </div>

      <div className="card">
        <h3>About</h3>
        <p>{doctor.bio || 'No biography available.'}</p>
      </div>

      {doctor.education && doctor.education.length > 0 && (
        <div className="card">
          <h3>Education</h3>
          <ul>
            {doctor.education.map((edu, i) => <li key={i}>{edu}</li>)}
          </ul>
        </div>
      )}

      {doctor.certificates && doctor.certificates.length > 0 && (
        <div className="card">
          <h3>Certificates</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {doctor.certificates.map((cert) => (
              <div 
                key={cert.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <h4 style={{ margin: 0 }}>{cert.name}</h4>
                  {cert.issue_date && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                      Issue Date: {new Date(cert.issue_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleViewCertificate(cert.file_path)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  View Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {renderCalendar()}
    </>
  );
};

export default DoctorProfile;
