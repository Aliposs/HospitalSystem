import React from 'react';
import Icon from '../sub-components/Icon';
import '../../../styles/patientDashboard.css';

const MedicalRecord: React.FC = () => {
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
        <p><strong>Dr. Sara Salem</strong> diagnosed the condition as "Tension Headaches" likely triggered by stress.</p>
      </div>
      
      <div className="card">
        <h3>Treatment Plan</h3>
        <ul>
          <li>Prescribed medication: Ibuprofen 400mg as needed.</li>
          <li>Lifestyle changes: Recommended 30 minutes of light exercise daily.</li>
          <li>Follow-up: Re-evaluation in one month.</li>
        </ul>
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