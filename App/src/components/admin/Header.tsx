import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import '../../styles/adminHeader.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    // Clear auth using store (will also clear localStorage)
    logout();
    navigate('/login');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="toggle-sidebar-btn" onClick={onToggleSidebar}>
          <span className="hamburger">☰</span>
        </button>
        <h1 className="page-title">Healthcare Admin Dashboard</h1>
      </div>

      <div className="header-right">
        <div className="user-menu">
          <button className="user-btn" onClick={toggleUserMenu}>
            <span className="user-icon">👤</span>
            <span className="user-name">{user?.fullName || 'Admin'}</span>
            <span className="dropdown-icon">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <a href="#profile" className="dropdown-item">
                Profile
              </a>
              <a href="#settings" className="dropdown-item">
                Settings
              </a>
              <hr />
              <button className="dropdown-item logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
