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
  rating: string;
  certificates: Array<{
    id: number;
    name: string;
    issue_date: string;
    file: string;
  }>;
}

const TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMinDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLocalDateStr(tomorrow);
};

const getMaxDate = () => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  return toLocalDateStr(maxDate);
};

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating] = useState(3);

  // Calendar state
  const [calendarOffset, setCalendarOffset] = useState(0); // weeks offset
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  // Booking modal state
  const [bookingModal, setBookingModal] = useState({
    show: false,
    selectedDate: '',
    selectedTime: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

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

  // Fetch booked appointments for this doctor to mark booked days
  useEffect(() => {
    if (!id) return;
    const fetchBooked = async () => {
      try {
        const res = await api.get(`/patient/appointments`);
        const appointments: any[] = res.data || [];
        const dates = appointments
          .filter((a: any) => a.doctor_id === id || a.doctor?.id === id)
          .map((a: any) => a.appointment_time?.split('T')[0]);
        setBookedDates(dates.filter(Boolean));
      } catch {
        // silently ignore — booked markers are optional
      }
    };
    fetchBooked();
  }, [id]);

  const handleViewCertificate = (filePath: string) => {
    if (!filePath) { alert('No file available'); return; }
    window.open(filePath, '_blank');
  };

  const handleBookingSubmit = async () => {
    if (!bookingModal.selectedDate || !bookingModal.selectedTime) {
      alert('Please select both date and time');
      return;
    }
    try {
      setBookingLoading(true);
      const appointmentDateTime = `${bookingModal.selectedDate}T${bookingModal.selectedTime}:00`;
      await api.post('/patient/appointments', {
        doctor_id: id,
        appointment_time: appointmentDateTime
      });
      alert('Appointment booked successfully!');
      setBookedDates(prev => [...prev, bookingModal.selectedDate]);
      setBookingModal({ show: false, selectedDate: '', selectedTime: '' });
    } catch (err: any) {
      console.error('Failed to book appointment:', err);
      alert(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  // Calendar: build 7 days starting from today + offset*7
  const renderCalendar = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDay = new Date(today);
    startDay.setDate(today.getDate() + calendarOffset * 7);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      return d;
    });

    // Build YYYY-MM-DD without UTC conversion to avoid timezone shift
    const toDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return (
      <div className="card doctor-profile-slots">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Available Slots</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {calendarOffset > 0 && (
              <button className="btn-nav-arrow" onClick={() => setCalendarOffset(o => o - 1)}>‹ Prev</button>
            )}
            <button className="btn-nav-arrow" onClick={() => setCalendarOffset(o => o + 1)}>Next ›</button>
          </div>
        </div>
        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {days.map(date => {
            const dateStr = toDateStr(date);
            const isBooked = bookedDates.includes(dateStr);
            const isPast = date < today;
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                onClick={() => !isPast && !isBooked && setSelectedDate(dateStr)}
                disabled={isPast || isBooked}
                className={`calendar-date ${isSelected ? 'active' : ''} ${isBooked ? 'booked' : ''} ${isPast ? 'past' : ''}`}
                title={isBooked ? 'Already booked' : isPast ? 'Past date' : ''}
              >
                <div className="date-number">{date.getDate()}</div>
                {isBooked && <div style={{ fontSize: '0.55rem', color: '#e53e3e', lineHeight: 1 }}>Booked</div>}
              </button>
            );
          })}
          
        </div>
        {selectedDate && (
          <div className="time-slots-grid" style={{ marginTop: '1rem' }}>
            {TIMES.map(time => (
              <button
                key={time}
                className="time-slot"
                onClick={() => setBookingModal({ show: true, selectedDate, selectedTime: time })}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        )}
        {!selectedDate && (
          <p style={{ color: '#999', fontSize: '0.875rem', marginTop: '1rem' }}>Select a date to see available time slots.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><p>Loading doctor profile...</p></div>;
  }

  if (error || !doctor) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}><p>{error || 'Doctor not found'}</p></div>;
  }

  return (
    <div className="doctor-profile-page">
      {/* Hero Header Card */}
      <div className="doctor-profile-hero card">
        <div className="doctor-profile-hero-left">
          <img
            src={
              doctor.profilePicture
                ? doctor.profilePicture
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=4F46E5&color=fff&size=120`
            }
            alt={doctor.name}
            className="doctor-profile-avatar"
          />
          <div className="doctor-profile-info">
            <h1 className="doctor-profile-name">{doctor.name}</h1>
            <p className="doctor-profile-meta">
              <span className="doctor-profile-specialization">{doctor.specialization}</span>
              {doctor.yearsOfExperience && (
                <span className="doctor-profile-exp"> · {doctor.yearsOfExperience} Years Experience</span>
              )}
            </p>
            {doctor.clinicName && (
              <p className="doctor-profile-clinic">
                {doctor.clinicName}
                <span className="doctor-profile-rating">
                  <span className="star">★</span> {rating} Stars
                </span>
              </p>
            )}
          </div>
        </div>
        <button
          className="btn btn-book-appointment"
          onClick={() => setBookingModal({ show: true, selectedDate: '', selectedTime: '' })}
        >
          Book Appointment
        </button>
      </div>

      {/* Two-column section */}
      <div className="doctor-profile-two-col">
        <div className="doctor-profile-left-col">
          <div className="card doctor-profile-about">
            <h3>About Me</h3>
            <p>{doctor.bio || 'No biography available.'}</p>
          </div>
          {renderCalendar()}
        </div>

        <div className="doctor-profile-right-col">
          {doctor.certificates && doctor.certificates.length > 0 && (
            <div className="card doctor-profile-certs">
              <h3>Certificates</h3>
              <div className="cert-list">
                {doctor.certificates.map((cert) => (
                  <div key={cert.id} className="cert-item">
                    <div className="cert-item-info">
                      <span className="cert-name">{cert.name}</span>
                      {cert.issue_date && (
                        <span className="cert-year">{new Date(cert.issue_date).getFullYear()}</span>
                      )}
                    </div>
                    {cert.issue_date && (
                      <p className="cert-date">Issue Date: {new Date(cert.issue_date).toLocaleDateString()}</p>
                    )}
                    <button onClick={() => handleViewCertificate(cert.file)} className="btn btn-view-cert">
                      View Certificate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            maxWidth: '450px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2>Book Appointment</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              with <strong>{doctor.name}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="appointmentDate">Select Date</label>
              <input
                type="date"
                id="appointmentDate"
                value={bookingModal.selectedDate}
                onChange={(e) => setBookingModal(m => ({ ...m, selectedDate: e.target.value }))}
                min={getMinDate()}
                max={getMaxDate()}
              />
              <small style={{ color: '#999' }}>Available from tomorrow up to 30 days ahead</small>
            </div>

            <div className="form-group">
              <label htmlFor="appointmentTime">Select Time</label>
              <select
                id="appointmentTime"
                value={bookingModal.selectedTime}
                onChange={(e) => setBookingModal(m => ({ ...m, selectedTime: e.target.value }))}
              >
                <option value="">Choose a time slot</option>
                {TIMES.map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setBookingModal({ show: false, selectedDate: '', selectedTime: '' })}
                className="btn btn-outline"
                style={{ flex: 1, backgroundColor: 'red', color: 'white' }}
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
