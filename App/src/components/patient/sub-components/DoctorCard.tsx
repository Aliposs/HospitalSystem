import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../../../styles/patientDashboard.css';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  availability: string;
  profilePicture?: string | null;
}

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  // Use profile picture if available, otherwise use a default avatar with doctor's initials
  const avatarUrl = doctor.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=4F46E5&color=fff&size=150`;
  
  return (
    <div className="doctor-card">
      <div className="doctor-card-header">
        <img src={avatarUrl} alt={doctor.name} />
        <div>
          <h3>{doctor.name}</h3>
          <p>{doctor.specialization}</p>
        </div>
      </div>
      <div className="doctor-card-body">
        <p><strong>Experience:</strong> {doctor.experience}</p>
        <p>
        <strong>Rating:</strong> 
        <Icon name="star" className='icon-star-rating'/> 
        {doctor.rating}
        </p>
        <p>
          <strong>Availability:</strong> <span className={`badge badge-${doctor.availability === 'Available Today' ? 'success' : doctor.availability === 'Busy' ? 'danger' : 'warning'}`}>{doctor.availability}</span>
          </p>
      </div>
      <div className="doctor-card-footer">
        <Link to={`/patient/doctor/${doctor.id}`} className="btn btn-outline">View Profile</Link>
        <button className="btn btn-primary">Book Appointment</button>
      </div>
    </div>
  );
};

export default DoctorCard;