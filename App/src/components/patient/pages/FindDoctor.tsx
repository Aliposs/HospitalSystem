import React, { useState, useEffect } from 'react';
import DoctorCard from '../sub-components/DoctorCard';
import api from '../../../lib/api'; 
import '../../../styles/patientDashboard.css';


const FindDoctor: React.FC = () => {
  const [filters, setFilters] = useState({ name: '', specialization: '', rating: '' });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.specialization) params.append('specialization', filters.specialization);
        if (filters.rating) params.append('rating', filters.rating);

        const res = await api.get(`/doctor/search?${params.toString()}`);
        setDoctors(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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
            <input type="text" id="name" name="name" value={filters.name} onChange={handleFilterChange} />
          </div>
          <div className="form-group">
            <label htmlFor="specialization">Specialization</label>
            <select id="specialization" name="specialization" value={filters.specialization} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="cardiology">Cardiology</option>
              <option value="dermatology">Dermatology</option>
              <option value="neurology">Neurology</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="psychiatry">Psychiatry</option>
              <option value="oncology">Oncology</option>
              <option value="radiology">Radiology</option>             <option>ENT</option>
              <option value="ophthalmology">Ophthalmology</option>
              <option value="urology">Urology</option>
              <option value="gynecology">Gynecology</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rating">Minimum Rating</label>
            <select id="rating" name="rating" value={filters.rating} onChange={handleFilterChange}>
              <option value="">Any</option>
              <option value="4.5">4.5+</option>
              <option value="4.7">4.7+</option>
              <option value="4.9">4.9+</option>
            </select>
          </div>
        </aside>

        <main className="doctor-results-grid">
          {loading ? (
            <div className="loading">Loading doctors...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : doctors.length === 0 ? (
            <div className="no-results">No doctors found matching your filters</div>
          ) : (
            doctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))
          )}
        </main>
      </div>
    </>
  );
};

export default FindDoctor;