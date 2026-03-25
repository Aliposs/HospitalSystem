import React, { useState, useEffect } from 'react';
import Icon from '../sub-components/Icon';
import api from '../../../lib/api';
import '../../../styles/patientDashboard.css';

interface Diagnosis {
  id: string;
  diagnosis_text: string;
  created_at: string;
  doctor_name: string;
  specialization: string;
}

interface Pill {
  id: string;
  name: string;
  time: string;
  taken: boolean;
  frequency: string;
  meal_timing: string;
}

const MedicalRecord: React.FC = () => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [pills, setPills] = useState<Pill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diagRes, pillsRes] = await Promise.all([
          api.get('/patient/diagnoses'),
          api.get('/patient/pills')
        ]);
        setDiagnoses(diagRes.data || []);
        setPills(pillsRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load medical record');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>My Medical Record</h1>
        <p>A detailed timeline of your case history.</p>
      </div>

      <div className="card">
        <h3>Submitted Symptoms</h3>
        <p>"I have been experiencing frequent headaches and occasional dizziness for the past two weeks."</p>
      </div>

      <div className="card">
        <h3>AI-Powered Analysis Summary</h3>
        <p style={{ fontStyle: 'italic', color: 'var(--muted-text)', display: 'flex', alignItems: 'center' }}>
          <Icon name="info" className='icon-info-inline' />
          Disclaimer: This is an AI-generated summary and not a substitute for professional medical advice.
        </p>
        <p>The reported symptoms (headaches, dizziness) may be associated with a range of conditions, from stress and dehydration to more complex neurological or cardiovascular issues. A thorough consultation with a medical professional is strongly recommended for an accurate diagnosis.</p>
      </div>

      <div className="card">
        <h3>Doctor's Diagnosis</h3>
        {loading ? (
          <p style={{ color: '#999' }}>Loading diagnoses...</p>
        ) : error ? (
          <p style={{ color: '#c62828' }}>{error}</p>
        ) : diagnoses.length === 0 ? (
          <p style={{ color: '#999' }}>No diagnoses recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {diagnoses.map(d => (
              <div key={d.id} style={{ borderLeft: '3px solid var(--primary-color)', paddingLeft: '1rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>
                  Dr. {d.doctor_name}
                  {d.specialization && <span style={{ fontWeight: 400, color: '#666', marginLeft: '0.5rem' }}>· {d.specialization}</span>}
                </p>
                <p style={{ margin: '0 0 0.25rem' }}>{d.diagnosis_text}</p>
                <small style={{ color: '#999' }}>{new Date(d.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Treatment Plan</h3>
        {loading ? (
          <p style={{ color: '#999' }}>Loading treatment plan...</p>
        ) : pills.length === 0 ? (
          <p style={{ color: '#999' }}>No treatment plan assigned yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Medication</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Time</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Frequency</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Meal Timing</th>
              </tr>
            </thead>
            <tbody>
              {pills.map(pill => (
                <tr key={pill.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{pill.name}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{pill.time ? pill.time.slice(0, 5) : '-'}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{pill.frequency || '-'}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{pill.meal_timing || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Timeline</h3>
        <ul style={{ listStyle: 'none', padding: 0, borderLeft: '2px solid var(--primary-color)', marginLeft: '10px' }}>
          <li style={{ paddingBottom: '1rem' }}><strong>2023-07-01:</strong> Case opened. Symptoms submitted.</li>
          <li style={{ paddingBottom: '1rem' }}><strong>2023-07-02:</strong> AI analysis generated.</li>
          <li style={{ paddingBottom: '1rem' }}><strong>2023-07-05:</strong> Consultation with Dr. Sara Salem. Diagnosis provided.</li>
          <li style={{ paddingBottom: '1rem' }}><strong>2023-07-05:</strong> Treatment plan initiated.</li>
        </ul>
      </div>
    </>
  );
};

export default MedicalRecord;
