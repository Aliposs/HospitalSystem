import React, { useState } from 'react';
import Icon from '../sub-components/Icon';
import '../../../styles/patientDashboard.css';

const ProfilePage: React.FC = () => {
  const [personalInfo, setPersonalInfo] = useState({ fullName: 'John Doe', email: 'john.doe@example.com', phone: '+20 1012345678' });
  const [medicalInfo, setMedicalInfo] = useState({ allergies: 'Penicillin', chronicDiseases: 'None', medications: 'Vitamin D' });

  const handleSave = () => {
    alert('Profile information saved!');
  };

  return (
    <>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal and medical information.</p>
      </div>

      <div className="card profile-section">
        <h3>Personal Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={personalInfo.email} onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" value={personalInfo.phone} onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="card profile-section">
        <h3>Medical Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Allergies</label>
            <input type="text" value={medicalInfo.allergies} onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Chronic Diseases</label>
            <input type="text" value={medicalInfo.chronicDiseases} onChange={(e) => setMedicalInfo({...medicalInfo, chronicDiseases: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Current Medications</label>
            <input type="text" value={medicalInfo.medications} onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="card profile-section">
        <h3>Security</h3>
        <p style={{ marginBottom: '1rem' }}>To change your password, please <a href="#" style={{ color: 'var(--primary-color)' }}>click here</a>.</p>
        <p style={{display: 'flex', alignItems: 'center', color: 'var(--muted-text)'}}>
            <Icon name="alert-circle" className='icon-warning-inline'/>
            Ensure your password is strong and not reused.
        </p>
      </div>

      <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Changes</button>
    </>
  );
};

export default ProfilePage;