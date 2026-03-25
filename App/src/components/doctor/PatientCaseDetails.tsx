import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import '../../styles/patientCaseDetails.css';

const PatientCaseDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [pills, setPills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [showPillModal, setShowPillModal] = useState(false);
  const [pillForms, setPillForms] = useState([{ name: '', time: '', frequency: '1x daily', meal_timing: 'After meal' }]);
  const [savingPill, setSavingPill] = useState(false);

  useEffect(() => {
    const fetchPatientCase = async () => {
      try {
        setLoading(true);
        const [patientRes, diagnosisRes, pillsRes] = await Promise.all([
          api.get(`/doctor/patients/${patientId}`),
          api.get(`/doctor/diagnoses/${patientId}`),
          api.get(`/doctor/pills/${patientId}`)
        ]);
        setPatient(patientRes.data);
        setDiagnosis(diagnosisRes.data);
        setDiagnosisText(diagnosisRes.data?.diagnosis_text || '');
        setPills(pillsRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load patient case');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchPatientCase();
  }, [patientId]);

  const handleRequestLabTest = () => {
    console.log('Requesting lab test for patient');
  };

  const handleAddPill = async () => {
    const valid = pillForms.filter(p => p.name.trim() && p.time);
    if (valid.length === 0) return;
    try {
      setSavingPill(true);
      const results = await Promise.all(
        valid.map(p => api.post('/doctor/pills', {
          patient_id: patientId,
          name: p.name.trim(),
          time: p.time,
          frequency: p.frequency,
          meal_timing: p.meal_timing
        }))
      );
      setPills(prev => [...prev, ...results.map(r => r.data)]);
      setPillForms([{ name: '', time: '', frequency: '1x daily', meal_timing: 'After meal' }]);
      setShowPillModal(false);
    } catch (err) {
      console.error('Add pill error:', err);
    } finally {
      setSavingPill(false);
    }
  };

  const handleDeletePill = async (pillId: string) => {
    try {
      await api.delete(`/doctor/pills/${pillId}`);
      setPills(prev => prev.filter(p => p.id !== pillId));
    } catch (err) {
      console.error('Delete pill error:', err);
    }
  };

  const handleGoBack = () => {
    navigate('/doctor/patients');
  };

  const handleSaveDiagnosis = async () => {
    if (!diagnosisText.trim()) return;
    
    try {
      setSavingDiagnosis(true);
      if (diagnosis?.id) {
        // Update existing
        const res = await api.put(`/doctor/diagnoses/${diagnosis.id}`, { diagnosis_text: diagnosisText });
        setDiagnosis(res.data);
      } else {
        // Create new
        const res = await api.post('/doctor/diagnoses', { patient_id: patientId, diagnosis_text: diagnosisText });
        setDiagnosis(res.data);
      }
      setShowDiagnosisModal(false);
      setDiagnosisText('');
    } catch (err) {
      console.error('Save diagnosis error:', err);
    } finally {
      setSavingDiagnosis(false);
    }
  };
  const aiAnalysis = { probability: '85%', conditions: ['Migraine', 'Tension Headache', 'Sinusitis'], recommendation: 'Further neurological examination recommended'};
  const medicalHistory = [
    { date: '2022-05-12', condition: 'Hypertension diagnosed' },
    { date: '2021-08-20', condition: 'Appendectomy performed' },
    { date: '2020-03-15', condition: 'Seasonal allergies diagnosed' },
  ];
  const symptoms = [
    { date: '2023-10-15', description: 'Frequent headaches, especially in the morning' },
    { date: '2023-10-10', description: 'Nausea and occasional dizziness' },
    { date: '2023-10-05', description: 'Fatigue and difficulty concentrating' },
  ];

  if (loading) return <div className='loading'>Loading patient details...</div>;
  if (error) return <div className='error'> Error: </div>;
  if (!patient) return <div className='error'>Patient not found</div>;

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
              <span className="info-value">{patient.gender || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{patient.phone ? patient.phone.replace('+20', '0') : 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Blood Type:</span>
              <span className="info-value">{patient.bloodType || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Allergies:</span>
              <span className="info-value">{patient.allergies || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Visit:</span>
              <span className="info-value">{patient.lastVisit || 'N/A'}</span>
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
            <div className="section-header">
              <h2>Doctor Diagnosis</h2>
              <button className="edit-diagnosis-btn" onClick={() => setShowDiagnosisModal(true)}>
                {diagnosis ? 'Edit' : 'Add'} Diagnosis
              </button>
            </div>
            <div className="diagnosis-content">
              <p>{diagnosis?.diagnosis_text || 'No diagnosis recorded yet'}</p>
            </div>
          </div>
          
          <div className="treatment-section">
            <div className="section-header">
              <h2>Treatment Plan</h2>
            </div>
            <div className="treatment-content">              {pills.length === 0 ? (
                <p style={{ color: '#999' }}>No medications prescribed yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e0e0e0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Medication</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Time</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Frequency</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Meal Timing</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pills.map(pill => (
                      <tr key={pill.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pill.name}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pill.time ? pill.time.slice(0, 5) : '-'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pill.frequency || '-'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{pill.meal_timing || '-'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <button onClick={() => handleDeletePill(pill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }} title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button className="edit-treatmentPlan-btn" onClick={() => setShowPillModal(true)}>
              + Add Medication
            </button>
          </div>

          <div className="treatment-section">
            <h2>Lab Tests</h2>
            <div className="treatment-content">
              <p style={{ color: '#999', marginBottom: '1rem' }}>Request lab tests for this patient.</p>
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

      {showDiagnosisModal && (
        <div className="modal-overlay" onClick={() => setShowDiagnosisModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Diagnosis</h3>
            <textarea
              value={diagnosisText}
              onChange={e => setDiagnosisText(e.target.value)}
              placeholder="Enter diagnosis..."
              rows={6}
              className="diagnosis-textarea"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDiagnosisModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveDiagnosis} disabled={savingDiagnosis}>
                {savingDiagnosis ? 'Saving...' : 'Save Diagnosis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPillModal && (
        <div className="modal-overlay" onClick={() => setShowPillModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Medication</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {pillForms.map((pill, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={pill.name}
                    onChange={e => setPillForms(prev => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                    placeholder="Medication name"
                    style={{ flex: '2', minWidth: '120px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="time"
                    value={pill.time}
                    onChange={e => setPillForms(prev => prev.map((p, i) => i === idx ? { ...p, time: e.target.value } : p))}
                    style={{ flex: '1', minWidth: '100px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <select
                    value={pill.frequency}
                    onChange={e => setPillForms(prev => prev.map((p, i) => i === idx ? { ...p, frequency: e.target.value } : p))}
                    style={{ flex: '1', minWidth: '110px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="1x daily">1x daily</option>
                    <option value="2x daily">2x daily</option>
                    <option value="3x daily">3x daily</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                  <select
                    value={pill.meal_timing}
                    onChange={e => setPillForms(prev => prev.map((p, i) => i === idx ? { ...p, meal_timing: e.target.value } : p))}
                    style={{ flex: '1', minWidth: '130px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="Before meal">Before meal</option>
                    <option value="After meal">After meal</option>
                    <option value="Empty stomach">Empty stomach</option>
                    <option value="With meal">With meal</option>
                  </select>
                  {pillForms.length > 1 && (
                    <button
                      onClick={() => setPillForms(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '1.2rem', lineHeight: 1 }}
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setPillForms(prev => [...prev, { name: '', time: '', frequency: '1x daily', meal_timing: 'After meal' }])}
                style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #3498db', color: '#3498db', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                + more
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setShowPillModal(false); setPillForms([{ name: '', time: '', frequency: '1x daily', meal_timing: 'After meal' }]); }}>Cancel</button>
              <button className="btn-save" onClick={handleAddPill} disabled={savingPill}>
                {savingPill ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCaseDetail;