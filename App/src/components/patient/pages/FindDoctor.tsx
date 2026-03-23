import React, { useState, useEffect, useCallback } from 'react';
import DoctorCard from '../sub-components/DoctorCard';
import api from '../../../lib/api'; 
import '../../../styles/patientDashboard.css';


const FindDoctor: React.FC = () => {
  const [filters, setFilters] = useState({ name: '', specialization: '', rating: '' });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState({
    show: false,
    doctorId: '',
    doctorName: '',
    selectedDate: '',
    selectedTime: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Debounced fetch function
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.name.trim()) params.append('name', filters.name.trim());
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.rating) params.append('rating', filters.rating);

      const res = await api.get(`/doctor/search?${params.toString()}`);
      setDoctors(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err);
      setError(err.response?.data?.error || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounce the name filter (wait 500ms after user stops typing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, filters.name ? 500 : 0); // Only debounce name search, instant for dropdowns

    return () => clearTimeout(timeoutId);
  }, [filters, fetchDoctors]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearFilters = () => {
    setFilters({ name: '', specialization: '', rating: '' });
  };

  const handleBookAppointment = (doctorId: string, doctorName: string) => {
    setBookingModal({
      show: true,
      doctorId,
      doctorName,
      selectedDate: '',
      selectedTime: ''
    });
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
        doctor_id: bookingModal.doctorId,
        appointment_time: appointmentDateTime
      });

      alert('Appointment booked successfully!');
      setBookingModal({
        show: false,
        doctorId: '',
        doctorName: '',
        selectedDate: '',
        selectedTime: ''
      });
    } catch (err: any) {
      console.error('Failed to book appointment:', err);
      alert(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const getAvailableTimes = () => {
    return [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <>
      <div className="page-header">
        <h1>Find a Doctor</h1>
        <p>Search for specialists by name, field, or availability.</p>
      </div>

      <div className="find-doctor-layout">
        <aside className="filter-panel">
          <h3>Filters</h3>
          <div className="form-group">
            <label htmlFor="name">Doctor Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={filters.name} 
              onChange={handleFilterChange}
              placeholder="Search by name..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialization">Specialization</label>
            <select id="specialization" name="specialization" value={filters.specialization} onChange={handleFilterChange}>
              <option value="">All Specializations</option>
              <option value="cardiology">Cardiology</option>
              <option value="dermatology">Dermatology</option>
              <option value="neurology">Neurology</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="psychiatry">Psychiatry</option>
              <option value="oncology">Oncology</option>
              <option value="radiology">Radiology</option>
              <option value="ent">ENT</option>
              <option value="ophthalmology">Ophthalmology</option>
              <option value="urology">Urology</option>
              <option value="gynecology">Gynecology</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rating">Minimum Rating</label>
            <select id="rating" name="rating" value={filters.rating} onChange={handleFilterChange}>
              <option value="">Any Rating</option>
              <option value="3.0">3.0+</option>
              <option value="3.5">3.5+</option>
              <option value="4.0">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.7">4.7+</option>
              <option value="4.9">4.9+</option>
            </select>
          </div>
          {(filters.name || filters.specialization || filters.rating) && (
            <button 
              onClick={handleClearFilters} 
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Clear Filters
            </button>
          )}
        </aside>

        <main className="doctor-results-grid">
          {loading ? (
            <div className="loading">Loading doctors...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : doctors.length === 0 ? (
            <div className="no-results">
              <p>No doctors found matching your filters</p>
              {(filters.name || filters.specialization || filters.rating) && (
                <button onClick={handleClearFilters} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ gridColumn: '1 / -1', marginBottom: '1rem', color: '#666' }}>
                Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
              </div>
              {doctors.map(doctor => (
                <DoctorCard 
                  key={doctor.id} 
                  doctor={doctor}
                  onBookAppointment={handleBookAppointment}
                />
              ))}
            </>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      {bookingModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2>Book Appointment</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              with <strong>{bookingModal.doctorName}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="appointmentDate">Select Date</label>
              <input
                type="date"
                id="appointmentDate"
                value={bookingModal.selectedDate}
                onChange={(e) => setBookingModal({ ...bookingModal, selectedDate: e.target.value })}
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
                onChange={(e) => setBookingModal({ ...bookingModal, selectedTime: e.target.value })}
              >
                <option value="">Choose a time slot</option>
                {getAvailableTimes().map(time => {
                  const [hours, minutes] = time.split(':');
                  const hour = parseInt(hours);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  return (
                    <option key={time} value={time}>
                      {displayHour}:{minutes} {ampm}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setBookingModal({
                  show: false,
                  doctorId: '',
                  doctorName: '',
                  selectedDate: '',
                  selectedTime: ''
                })}
                className="btn btn-outline"
                style={{ flex: 1, backgroundColor: 'red', color: 'white'}}
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
    </>
  );
};

export default FindDoctor;