import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/patientCaseDetails.css';

const PatientCaseDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  // Mock patient data - in a real app, this would come from an API
  const patient = {
    id: parseInt(patientId || '1'),
    name: 'Sarah Johnson',
    age: 34,
    gender: 'Female',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    bloodType: 'O+',
    allergies: 'Penicillin, Peanuts',
    lastVisit: '2023-10-15',
  };

  const symptoms = [
    { date: '2023-10-15', description: 'Frequent headaches, especially in the morning' },
    { date: '2023-10-10', description: 'Nausea and occasional dizziness' },
    { date: '2023-10-05', description: 'Fatigue and difficulty concentrating' },
  ];

  const medicalHistory = [
    { date: '2022-05-12', condition: 'Hypertension diagnosed' },
    { date: '2021-08-20', condition: 'Appendectomy performed' },
    { date: '2020-03-15', condition: 'Seasonal allergies diagnosed' },
  ];

  const aiAnalysis = {
    probability: '85%',
    conditions: ['Migraine', 'Tension Headache', 'Sinusitis'],
    recommendation: 'Further neurological examination recommended',
  };

  const diagnosis = 'Chronic migraine with tension headache components';
  const treatmentPlan = 'Prescribed medication for pain management, recommended lifestyle changes, and follow-up in 4 weeks.';

  const handleRequestLabTest = () => {
    // In a real app, this would navigate to a lab request form
    console.log('Requesting lab test for patient', patient.id);
  };

  const handleGoBack = () => {
    navigate('/doctor/patients');
  };

  return (
    <div className="patient-case-detail">
      <div className="case-header">
        <button className="back-button" onClick={handleGoBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Patients
        </button>
        <h1>Patient Case: {patient.name}</h1>
      </div>
      
      <div className="case-content">
        <div className="patient-info-card">
          <h2>Patient Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Age:</span>
              <span className="info-value">{patient.age}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender:</span>
              <span className="info-value">{patient.gender}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{patient.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{patient.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Blood Type:</span>
              <span className="info-value">{patient.bloodType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Allergies:</span>
              <span className="info-value">{patient.allergies}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Visit:</span>
              <span className="info-value">{patient.lastVisit}</span>
            </div>
          </div>
        </div>
        
        <div className="case-sections">
          <div className="symptoms-section">
            <h2>Symptoms</h2>
            <div className="symptoms-list">
              {symptoms.map((symptom, index) => (
                <div key={index} className="symptom-item">
                  <span className="symptom-date">{symptom.date}</span>
                  <p>{symptom.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="medical-history-section">
            <h2>Medical History</h2>
            <div className="history-list">
              {medicalHistory.map((item, index) => (
                <div key={index} className="history-item">
                  <span className="history-date">{item.date}</span>
                  <p>{item.condition}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="ai-analysis-section">
            <h2>AI Symptom Analysis</h2>
            <div className="analysis-content">
              <div className="analysis-item">
                <span className="analysis-label">Probability:</span>
                <span className="analysis-value">{aiAnalysis.probability}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Possible Conditions:</span>
                <span className="analysis-value">{aiAnalysis.conditions.join(', ')}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Recommendation:</span>
                <span className="analysis-value">{aiAnalysis.recommendation}</span>
              </div>
            </div>
          </div>
          
          <div className="diagnosis-section">
            <h2>Doctor Diagnosis</h2>
            <div className="diagnosis-content">
              <p>{diagnosis}</p>
            </div>
          </div>
          
          <div className="treatment-section">
            <h2>Treatment Plan</h2>
            <div className="treatment-content">
              <p>{treatmentPlan}</p>
            </div>
            <button className="lab-test-button" onClick={handleRequestLabTest}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2v6"></path>
                <path d="M15 2v6"></path>
                <path d="M12 2v6"></path>
                <path d="M5 9h14l-1 12H6L5 9z"></path>
                <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
              </svg>
              Request Lab Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCaseDetail;