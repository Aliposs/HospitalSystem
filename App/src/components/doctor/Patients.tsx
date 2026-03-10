import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from "../../lib/api";
import '../../styles/patients.css';

const Patients = () => {
  const navigate = useNavigate(); 
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await api.get("/doctor/patients");
        setPatients(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleViewCase = (patientId: number) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  if (loading) return <div className="loading">Loading patients...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="patients">
      <div className="patient-Head">
        <h1>Patients</h1>
        <button className="add-patient-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Patient
        </button>
      </div>
      
      <div className="patients-table-container">
        <div className="search-filter">
          <div className="search-box">
            <input type="text" placeholder="Search patients..." />
            <button className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
          
          <div className="filter-dropdown">
            <select>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="patients-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Case Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map(patient => (
                  <tr key={patient.id}>
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>
                      <span className={`status-badge ${patient.status.toLowerCase()}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      <button className='view-case-button' onClick={() => handleViewCase(patient.id)}>
                        View Case
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;