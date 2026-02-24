import React from 'react';
import Icon from '../sub-components/Icon';
import '../../../styles/patientDashboard.css';

const LabResultsPage: React.FC = () => {
  const labRequests = [
    { id: 1, testName: 'Complete Blood Count (CBC)', date: '2023-07-10', status: 'Ready' },
    { id: 2, testName: 'Lipid Panel', date: '2023-07-10', status: 'Ready' },
    { id: 3, testName: 'HbA1c', date: '2023-07-15', status: 'Pending' },
  ];

  const handleViewResult = (id: number) => {
    alert(`Opening viewer for Lab Result ID: ${id}`);
  };

  return (
    <>
      <div className="page-header">
        <h1>Lab Results</h1>
        <p>View your lab test reports and statuses.</p>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Date Requested</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {labRequests.map(req => (
              <tr key={req.id}>
                <td>{req.testName}</td>
                <td>{req.date}</td>
                <td>
                  <span className={`badge badge-${req.status === 'Ready' ? 'success' : 'warning'}`} style={{display: 'inline-flex', alignItems: 'center'}}>
                    {req.status === 'Ready' && <Icon name="check-circle" />}
                    {req.status === 'Pending' && <Icon name="clock" />}
                    {req.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleViewResult(req.id)}
                    className="btn btn-primary" 
                    disabled={req.status !== 'Ready'}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default LabResultsPage;