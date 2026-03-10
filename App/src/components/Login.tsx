import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/database';
import '../styles/login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const stateMessage = location.state?.message;
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(stateMessage || '');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'This field is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'This field is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const user = data.user;
      const session = data.session;

      let fullName = 'User';
      if (user.user_metadata?.role === 'doctor') {
        const { data: doc } = await supabase
          .from('doctors')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        fullName = doc?.full_name || 'Dr. User';
        
      } else if (user.user_metadata?.role === 'patient') {
        const { data: pat } = await supabase
          .from('patients')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        fullName = pat?.full_name || 'Patient';
      }

      // حفظ في الـ store
      setAuth(session.access_token, {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        fullName,
      });

      // توجيه حسب الـ role
      const role = user.user_metadata?.role;
      if (role === 'doctor') {
        navigate('/doctor');
      } else if (role === 'patient') {
        navigate('/patient');
      } else {
        navigate('/');
      }

      setSuccessMessage('Login successful! Redirecting...');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ general: error.message || 'Invalid email or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleGoBack = () => {
    navigate(-1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  
  return (
    <div className="login">
      <div className="back-button-container">
        <button className="back-button" onClick={handleGoBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
      </div>
      
      <div className="login-main-container">
        <div className="login-left-side">
          <div className="doctor-image-container">
            <img 
              src="./public/login.jpg" 
              alt="Doctor" 
              className="doctor-image"
            />
          </div>
          <div className="welcome-section">
            <h2>Welcome to <span className="highlight">MediCare</span></h2>
            <h3>Hospital Management System</h3>
            <p>Cloud Based Streamline Hospital Management system with centralized user friendly platform</p>
          </div>
        </div>

        <div className="login-right-side">
          <div className="login-form-container">  
          <div className="login-header">
              <h1>Login</h1>
              <h5>Enter your credentials to login to your account</h5>
            </div>

            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            {errors.general && (
              <div className='error-message general'>
                {errors.general}
              </div>
            )}
            
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="example.nazarbeck@gmail.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'error' : ''}
                    placeholder="••••••••••••••••••••••••"
                  />
                  <button
                    type="button"
                    className='password-toggle'
                    onClick={togglePasswordVisibility}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="forgot-password-link">
                <a href="#forgot-password">Forgot Password?</a>
              </div>
              
              <button type="submit" className="login-button" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
              
              <div className="register-link">
                Don't have an account? <a href="#register" onClick={() => navigate('/register')}>Sign Up</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

};

export default Login;