import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/database'; 
import '../styles/registration.css'; 

const Registration = () => {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<'doctor' | 'patient'>('patient');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneDigits: '',
    age: '',
    bloodType: '',
    address: '',
    specialty: '',
    password: '',
    confirmPassword: '',
    licenseFile: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';

    if (!formData.phoneDigits.trim()) newErrors.phoneDigits = 'Phone is required';
    else if (!/^\d{10,11}$/.test(formData.phoneDigits))
      newErrors.phoneDigits = 'Phone must be 10–11 digits';

    if (userType === 'patient') {
      if (!formData.age.trim()) newErrors.age = 'Age is required';
      else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0 || Number(formData.age) >= 150)
        newErrors.age = 'Enter a valid age';
      if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }

    if (userType === 'doctor') {
      if (!formData.specialty.trim()) newErrors.specialty = 'Specialty is required';
      if (!formData.licenseFile) newErrors.licenseFile = 'License file is required';
    }

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, licenseFile: e.target.files![0] }));
      if (errors.licenseFile) setErrors((prev) => ({ ...prev, licenseFile: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // 1. Sign Up in Supabase Auth with OTP email
      const { data: authUser, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: userType,
            full_name: formData.fullName,
          },
          emailRedirectTo: undefined, 
        },
      });

      if (signUpError) throw signUpError;

      const userId = authUser.user!.id;

      // 2. Upload license (only for doctors)
      let licenseUrl: string | null = null;
      if (userType === 'doctor') {
        if (!formData.licenseFile) throw new Error('License file required for doctors');

        const file = formData.licenseFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `licenses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('licenses')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('licenses').getPublicUrl(filePath);
        licenseUrl = urlData.publicUrl;
      }

      // 3. Create profile record
      if (userType === 'doctor') {
        const { error } = await supabase.from('doctors').insert({
          user_id: userId,
          full_name: formData.fullName,
          phone_number: `+20${formData.phoneDigits}`,
          specialty: formData.specialty,
          license_file_path: licenseUrl,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.from('patients').insert({
          user_id: userId,
          full_name: formData.fullName,
          phone_number: `+20${formData.phoneDigits}`,
          age: Number(formData.age),
          blood_type: formData.bloodType,
          address: formData.address,
        });

        if (error) throw error;
      }

      // 4. Redirect to verification page
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err?.message || 'Registration failed';

      // Supabase rate limit message: "For security purposes, you can only request this after 32 seconds."
      const m = msg.match(/after\s+(\d+)\s+seconds/i);
      if (m) {
        const secs = parseInt(m[1], 10) || 30;
        setErrors({ general: `Please wait ${secs} seconds before trying again.` });
        setRetrySeconds(secs);
        // start countdown
        const id = setInterval(() => {
          setRetrySeconds((prev) => {
            if (!prev || prev <= 1) {
              clearInterval(id);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
      </div>

      <div className="registration-main-container">
        {/* Left Side - Image and Welcome Text */}
        <div className="registration-left-side">
          <div className="doctor-image-container">
            <img 
              src="./register.jpg" 
              alt="Medical Team" 
              className="doctor-image"
            />
          </div>
          <div className="welcome-section">
            <h2>Join to <span className="highlight">MediCare</span></h2>
            <h3>Hospital Management System</h3>
            <p>Register now to access our comprehensive healthcare platform and connect with medical professionals</p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="registration-right-side">
          <div className="registration-form-container">
            <div className="registration-header">
              <h1>Register</h1>
              <p>Create your account to get started</p>
            </div>

            <div className="user-type-selector">
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="patient"
                  checked={userType === 'patient'}
                  onChange={() => setUserType('patient')}
                />
                <span className="radio-custom" />
                <span>Patient</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="doctor"
                  checked={userType === 'doctor'}
                  onChange={() => setUserType('doctor')}
                />
                <span className="radio-custom" />
                <span>Doctor</span>
              </label>
            </div>

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@gmail.com" />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className={`phone-input-container ${errors.phoneDigits ? 'error' : ''}`}>
                  <div className="phone-prefix">+20</div>
                  <input
                    className="phone-input"
                    type="text"
                    name="phoneDigits"
                    value={formData.phoneDigits}
                    onChange={handleChange}
                    maxLength={11}
                    placeholder="1234567890"
                  />
                </div>
                {errors.phoneDigits && <span className="error-message">{errors.phoneDigits}</span>}
              </div>

              {userType === 'patient' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Age</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Enter your age" />
                      {errors.age && <span className="error-message">{errors.age}</span>}
                    </div>

                    <div className="form-group">
                      <label>Blood Type</label>
                      <select name="bloodType" value={formData.bloodType} onChange={handleChange}>
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                      {errors.bloodType && <span className="error-message">{errors.bloodType}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter your address" rows={3} />
                    {errors.address && <span className="error-message">{errors.address}</span>}
                  </div>
                </>
              )}

              {userType === 'doctor' && (
                <>
                  <div className="form-group">
                    <label>Specialty</label>
                    <select name="specialty" value={formData.specialty} onChange={handleChange}>
                      <option value="">Select specialty</option>
                      <option>General Practice</option>
                      <option>Cardiology</option>
                      <option>Dermatology</option>
                      <option>Pediatrics</option>
                      <option>Orthopedics</option>
                      <option>Neurology</option>
                      <option>Psychiatry</option>
                      <option>Oncology</option>
                      <option>Radiology</option>
                      <option>ENT</option>
                      <option>Ophthalmology</option>
                      <option>Urology</option>
                      <option>Gynecology</option>
                    </select>
                    {errors.specialty && <span className="error-message">{errors.specialty}</span>}
                  </div>

                  <div className="form-group">
                    <label>Medical License</label>
                    <div className="file-upload-container">
                      <label className={`file-upload-button ${errors.licenseFile ? 'error' : ''}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormData((prev) => ({ ...prev, licenseFile: e.target.files![0] }));
                            }
                          }}
                        />
                        {formData.licenseFile ? formData.licenseFile.name : 'Choose file'}
                      </label>
                      {errors.licenseFile && <span className="error-message">{errors.licenseFile}</span>}
                    </div>
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••••••••••••••••••" />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••••••••••••••••••"
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>

              {errors.general && <div className="error-message general">{errors.general}</div>}

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || retrySeconds !== null}
              >
                {retrySeconds !== null ? `Please wait ${retrySeconds}s` : isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="login-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;