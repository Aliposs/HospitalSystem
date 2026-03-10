import React from 'react';
import { NavLink, useNavigate} from 'react-router-dom';
import Icon from './sub-components/Icon';
import '../../styles/patientDashboard.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here (e.g., clear tokens)
    console.log('Logging out...');
    navigate('/login');
  };

  const navItems = [
    { path: '/patient/dashboard', label: 'Home', icon: 'dashboard' },
    { path: '/patient/find-doctor', label: 'Find a Doctor', icon: 'search' },
    { path: '/patient/appointments', label: 'Appointments', icon: 'calendar' },
    { path: '/patient/medical-record', label: 'My Case / Medical Record', icon: 'folder' },
    { path: '/patient/lab-results', label: 'Lab Results', icon: 'lab' },
    { path: '/patient/messages', label: 'Messages', icon: 'message-circle' },
    { path: '/patient/profile', label: 'Profile', icon: 'user' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">MediCare</div>
      <nav>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon name={item.icon}/>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li className="sidebar-logout">
            <a href="#" onClick={handleLogout}>
              <Icon name="log-out"/>
              Logout
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;