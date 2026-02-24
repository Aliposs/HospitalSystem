import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DoctorCard from '../sub-components/DoctorCard';
import '../../../styles/patientDashboard.css';

// Dummy data
const doctorsData = [
  { id: 1, name: 'Dr. John Smith', specialization: 'Cardiology', experience: '15 years', rating: 4.8, availability: 'Available Today' },
  { id: 2, name: 'Dr. Emily White', specialization: 'Dermatology', experience: '10 years', rating: 4.9, availability: 'Available Tomorrow' },
  { id: 3, name: 'Dr. Michael Brown', specialization: 'Neurology', experience: '20 years', rating: 4.7, availability: 'Busy' },
  { id: 4, name: 'Dr. Jessica Davis', specialization: 'Pediatrics', experience: '8 years', rating: 4.9, availability: 'Available Today' },
];

const FindDoctor: React.FC = () => {
  const [filters, setFilters] = useState({ name: '', specialization: '', rating: '' });
  const [doctors] = useState(doctorsData);

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
          {doctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </main>
      </div>
    </>
  );
};

export default FindDoctor;