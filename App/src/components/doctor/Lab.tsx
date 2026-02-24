import { useState } from 'react';
import '../../styles/labModule.css';

const LabModule = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'results'>('requests');
  
  const labRequests = [
    { 
      id: 1, 
      patient: 'Sarah Johnson', 
      testType: 'Blood Test', 
      labName: 'Central Lab', 
      status: 'pending',
      requestDate: '2023-11-14'
    },
    { 
      id: 2, 
      patient: 'Michael Brown', 
      testType: 'X-Ray', 
      labName: 'Imaging Center', 
      status: 'completed',
      requestDate: '2023-11-13'
    },
    { 
      id: 3, 
      patient: 'Emily Davis', 
      testType: 'MRI', 
      labName: 'Advanced Imaging', 
      status: 'pending',
      requestDate: '2023-11-15'
    },
    { 
      id: 4, 
      patient: 'Robert Wilson', 
      testType: 'ECG', 
      labName: 'Cardio Lab', 
      status: 'completed',
      requestDate: '2023-11-12'
    },
  ];

  const labResults = [
    { 
      id: 2, 
      patient: 'Michael Brown', 
      testType: 'X-Ray', 
      labName: 'Imaging Center', 
      resultDate: '2023-11-14',
      hasFile: true
    },
    { 
      id: 4, 
      patient: 'Robert Wilson', 
      testType: 'ECG', 
      labName: 'Cardio Lab', 
      resultDate: '2023-11-13',
      hasFile: true
    },
  ];

  const handleViewResult = (resultId: number) => {
    // In a real app, this would navigate to a detailed result view
    console.log('Viewing result for:', resultId);
  };

  const handleRequestNewTest = () => {
    // In a real app, this would open a form to request a new test
    console.log('Requesting new lab test');
  };

  return (
    <div className="lab-module">
      <div className="module-header">
        <h1>Lab Requests & Results</h1>
        <button className="request-button" onClick={handleRequestNewTest}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2v6"></path>
            <path d="M15 2v6"></path>
            <path d="M12 2v6"></path>
            <path d="M5 9h14l-1 12H6L5 9z"></path>
            <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
          </svg>
          Request New Test
        </button>
      </div>
      
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Lab Requests
        </button>
        <button 
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Lab Results
        </button>
      </div>
      
      {activeTab === 'requests' ? (
        <div className="lab-requests-container">
          <div className="filter-options">
            <select>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="lab-table">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test Type</th>
                  <th>Lab Name</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.patient}</td>
                    <td>{request.testType}</td>
                    <td>{request.labName}</td>
                    <td>{request.requestDate}</td>
                    <td>
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === 'completed' && (
                        <button 
                          className="view-button"
                          onClick={() => handleViewResult(request.id)}
                        >
                          View Result
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="lab-results-container">
          <div className="filter-options">
            <select>
              <option value="all">All Test Types</option>
              <option value="blood">Blood Test</option>
              <option value="imaging">Imaging</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>
          
          <div className="lab-table">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test Type</th>
                  <th>Lab Name</th>
                  <th>Result Date</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labResults.map(result => (
                  <tr key={result.id}>
                    <td>{result.patient}</td>
                    <td>{result.testType}</td>
                    <td>{result.labName}</td>
                    <td>{result.resultDate}</td>
                    <td>
                      {result.hasFile ? (
                        <span className="file-indicator">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          PDF
                        </span>
                      ) : (
                        'No file'
                      )}
                    </td>
                    <td>
                      <button 
                        className="view-button"
                        onClick={() => handleViewResult(result.id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabModule;