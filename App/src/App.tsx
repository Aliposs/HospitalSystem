import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import Registration from './components/Registration';
import OtpVerification from './components/OtpVerification';
import Login from './components/Login';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import DashboardOverview from './components/doctor/DashboardOverview';
import Patients from './components/doctor/Patients';
import PatientCaseDetail from './components/doctor/PatientCaseDetails';
import Appointments from './components/doctor/Appointments';
import LabModule from './components/doctor/Lab';
import Messages from './components/doctor/Messages';
import DoctorProfile from './components/doctor/DoctorProfile';
import PatientDashboard from './components/patient/PatientDashboard';
import './app.css';

function App() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'why-choose-us', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout scrollToSection={scrollToSection} activeSection={activeSection}>
            <HomePage scrollToSection={scrollToSection} />
          </Layout>
        } />
        <Route path="/landing" element={
          <Layout isLandingPage={true}>
            <LandingPage />
          </Layout>
        } />
        <Route path="/register" element={<Registration />} />
        <Route path="/verify-otp" element={<OtpVerification/>}/>
        <Route path="/verify-email" element={<OtpVerification/>}/>
        <Route path="/login" element={<Login />} />
         
                    {/* Doctor Module*/}
        <Route path='/doctor' element={<DoctorDashboard/>}>
          <Route index element={<DashboardOverview/>}/>
          <Route path='dashboard' element={<DashboardOverview/>}/>
          <Route path='patients' element={<Patients/>}/>
          <Route path='patients/:patientId' element={<PatientCaseDetail/>}/>
          <Route path='appointments' element={<Appointments/>}/>
          <Route path='lab' element={<LabModule/>}/>
          <Route path='messages' element={<Messages/>}/>
          <Route path='profile' element={<DoctorProfile/>}/>
        </Route>

        <Route path='/patient/*' element={<PatientDashboard/>}/>
      </Routes>
    </Router>
  );
}

export default App;