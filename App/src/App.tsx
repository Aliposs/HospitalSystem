import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard/Dashboard';
import UserList from './components/admin/Users/UserList';
import SpecializationList from './components/admin/Specializations/SpecializationList';
import AuditLogViewer from './components/admin/AuditLogs/AuditLogViewer';
import './app.css';

// Admin Route Protection Component
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const userRole = localStorage.getItem('userRole');
  
  // Check if user is admin
  if (userRole !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

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

        {/* Admin Module */}
        <Route path='/admin' element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedAdminRoute>
        } />
        <Route path='/admin/dashboard' element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedAdminRoute>
        } />
        <Route path='/admin/users' element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <UserList />
            </AdminLayout>
          </ProtectedAdminRoute>
        } />
        <Route path='/admin/specializations' element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <SpecializationList />
            </AdminLayout>
          </ProtectedAdminRoute>
        } />
        <Route path='/admin/audit-logs' element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AuditLogViewer />
            </AdminLayout>
          </ProtectedAdminRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;