import { useNavigate } from 'react-router-dom';
import '../../styles/patients.css';

const Patients = () => {
  const navigate = useNavigate();
  
  const patients = [
    { id: 1, name: 'Sarah Johnson', age: 34, gender: 'Female', status: 'Active' },
    { id: 2, name: 'Michael Brown', age: 45, gender: 'Male', status: 'Pending' },
    { id: 3, name: 'Emily Davis', age: 28, gender: 'Female', status: 'Active' },
    { id: 4, name: 'Robert Wilson', age: 52, gender: 'Male', status: 'Completed' },
    { id: 5, name: 'Jessica Martinez', age: 39, gender: 'Female', status: 'Active' },
    { id: 6, name: 'David Lee', age: 41, gender: 'Male', status: 'Pending' },
  ];

  const handleViewCase = (patientId: number) => {
    navigate(`/doctor/patients/${patientId}`);
  };

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
              {patients.map(patient => (
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
                    <button 
                      className="view-case-button" 
                      onClick={() => handleViewCase(patient.id)}
                    >
                      View Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;