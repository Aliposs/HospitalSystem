const { supabase } = require('../lib/database');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Memory storage for Supabase uploads (profile pictures)
const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images allowed'), false);
    }
  }
});

// Memory storage for certificates (PDF and images)
const certificateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
});

// Multer storage for message attachments (memory storage for Supabase upload)
const messageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for messages
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
});

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    if (user.user_metadata?.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied: Not a doctor' });
    }

    req.user = {
      userId: user.id, 
      email: user.email,
      role: user.user_metadata.role,
      fullName: user.user_metadata.full_name || 'Doctor'
    };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth error' });
  }
};

module.exports = router;

// GET /api/doctor/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, message, is_read, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/doctor/notifications/read-all
router.patch('/notifications/read-all', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.userId)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /api/doctor/notifications/:id
router.delete('/notifications/:id', authenticate, async (req, res) => {
  try {
    console.log('DELETE notification:', req.params.id, 'for user:', req.user.userId);
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select('id');

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// POST /api/doctor/diagnoses - Save diagnosis for a patient
router.post('/diagnoses', authenticate, async (req, res) => {
  const { patient_id, diagnosis_text } = req.body;

  if (!patient_id || !diagnosis_text?.trim()) {
    return res.status(400).json({ error: 'Patient ID and diagnosis text are required' });
  }

  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .insert({
        doctor_id: req.user.userId,
        patient_id,
        diagnosis_text: diagnosis_text.trim()
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Save diagnosis error:', err);
    res.status(500).json({ error: 'Failed to save diagnosis' });
  }
});

// GET /api/doctor/diagnoses/:patientId - Get latest diagnosis for a patient
router.get('/diagnoses/:patientId', authenticate, async (req, res) => {
  const patientId = req.params.patientId;

  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, diagnosis_text, created_at, updated_at')
      .eq('doctor_id', req.user.userId)
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    res.json(data || null);
  } catch (err) {
    console.error('Fetch diagnosis error:', err);
    res.status(500).json({ error: 'Failed to fetch diagnosis' });
  }
});

// PUT /api/doctor/diagnoses/:diagnosisId - Update diagnosis
router.put('/diagnoses/:diagnosisId', authenticate, async (req, res) => {
  const diagnosisId = req.params.diagnosisId;
  const { diagnosis_text } = req.body;

  if (!diagnosis_text?.trim()) {
    return res.status(400).json({ error: 'Diagnosis text is required' });
  }

  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .update({ diagnosis_text: diagnosis_text.trim(), updated_at: new Date().toISOString() })
      .eq('id', diagnosisId)
      .eq('doctor_id', req.user.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update diagnosis error:', err);
    res.status(500).json({ error: 'Failed to update diagnosis' });
  }
});

// GET /api/doctor/dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const doctorId = req.user.userId;
    console.log('Dashboard request for doctor:', doctorId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Total unique patients + active cases
    const { data: allApts, error: allAptsError } = await supabase
      .from('appointments')
      .select('patient_id, status')
      .eq('doctor_id', doctorId);

    if (allAptsError) console.error('allApts error:', allAptsError);
    console.log('All appointments raw:', allApts);

    const uniquePatients = new Set((allApts || []).map(a => a.patient_id));
    const totalPatients = uniquePatients.size;

    const activeCases = (allApts || []).filter(a =>
      ['confirmed', 'pending'].includes(a.status?.toLowerCase())
    );
    const uniqueActiveCases = new Set(activeCases.map(a => a.patient_id)).size;

    // Today's appointments
    const { data: todayApts, error: todayError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('doctor_id', doctorId)
      .gte('appointment_time', todayStart.toISOString())
      .lte('appointment_time', todayEnd.toISOString());

    if (todayError) console.error('todayApts error:', todayError);
    console.log('Today appointments:', todayApts);

    const todayTotal = (todayApts || []).length;
    const todayCompleted = (todayApts || []).filter(a => a.status?.toLowerCase() === 'completed').length;
    const todayUpcoming = todayTotal - todayCompleted;

    // Recent activities — from yesterday onwards (1 day back + all future)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const { data: recentData, error: recentError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        status,
        patient:patient_id (full_name)
      `)
      .eq('doctor_id', doctorId)
      .gte('appointment_time', yesterday.toISOString())
      .order('appointment_time', { ascending: true });

    if (recentError) console.error('recentData error:', recentError);
    console.log('Recent data:', JSON.stringify(recentData));

    const recentActivities = (recentData || []).map(apt => ({
      id: apt.id,
      patient: apt.patient?.full_name || 'Unknown',
      lastUpdate: new Date(apt.appointment_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: apt.status
    }));

    res.json({
      totalPatients,
      todayAppointments: { total: todayTotal, completed: todayCompleted, upcoming: todayUpcoming },
      activeCases: uniqueActiveCases,
      recentActivities
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select(`*, email:users(email)`)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !doctor) return res.status(404).json({ error: 'Profile not found' });

    const { data: certs } = await supabase
      .from('certificates')
      .select(`
        id,
        name,
        issue_date,
        file
      `)
      .eq('doctor_id', req.user.userId);

    // Format certificates to match frontend expectations
    const formattedCerts = (certs || []).map(cert => ({
      id: cert.id,
      name: cert.name,
      issue_date: cert.issue_date,
      file: cert.file
    }));

    console.log('Doctor profile from DB:', doctor);
    console.log('Profile picture URL:', doctor.profile_picture);

    res.json({
      ...doctor,
      certificates: formattedCerts
    });
    console.log("The Doctor Data:=====>>", doctor);
  } catch (err) {
    console.error('Doctor profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /profile (with file upload)
router.put('/profile', authenticate, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    const updates = {
      full_name: req.body.fullName,
      phone_number: req.body.phone,
      gender: req.body.gender,
      date_of_birth: req.body.dateOfBirth,
      specialty: req.body.specialization,
      years_of_experience: req.body.yearsOfExperience,
      clinic_name: req.body.clinicName,
      biography: req.body.biography
    };

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${req.user.userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      updates.profile_picture = publicUrl;
      console.log('Profile picture uploaded:', publicUrl);
    }

    console.log('Updating doctor with:', updates);

    const { error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    res.json({ message: 'Profile updated', profilePicture: updates.profile_picture });
  } catch (err) {
    console.error('Doctor update error:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

// Appointments GET
router.get('/appointments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        status,
        patient:patient_id (full_name)
      `)
      .eq('doctor_id', req.user.userId)
      .order('appointment_time');

    if (error) throw error;

    // Format the response to match frontend expectation and remove duplicates
    const uniqueAppointmentsMap = new Map();
    (data || []).forEach(item => {
      const appointmentId = item.id;
      // Only add if not already in map (keeps first occurrence)
      if (!uniqueAppointmentsMap.has(appointmentId)) {
        uniqueAppointmentsMap.set(appointmentId, {
          id: appointmentId,
          patient: item.patient?.full_name || 'Unknown Patient',
          date: new Date(item.appointment_time).toISOString().split('T')[0],
          time: new Date(item.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: item.status,
          type: 'Consultation' 
        });
      }
    });

    const formatted = Array.from(uniqueAppointmentsMap.values());
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PUT /api/doctor/appointments/:id - Update appointment status
router.put('/appointments/:id', authenticate, async (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;

  console.log('PUT /appointments/:id called with:', { appointmentId, status, doctorId: req.user.userId });

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // First verify the appointment belongs to this doctor
    const { data: appointmentCheck, error: checkError } = await supabase
      .from('appointments')
      .select('id, doctor_id')
      .eq('id', appointmentId)
      .single();

    console.log('Appointment check:', { appointmentCheck, checkError });

    if (checkError || !appointmentCheck) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointmentCheck.doctor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    // Update the appointment status
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: status.toLowerCase() })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    console.log('Update successful:', data);
    res.json({ message: 'Appointment status updated', data });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ error: 'Failed to update appointment', details: err.message });
  }
});

// DELETE /api/doctor/appointments/:id - Delete appointment
router.delete('/appointments/:id', authenticate, async (req, res) => {
  const appointmentId = req.params.id;

  console.log('DELETE /appointments/:id called with:', { appointmentId, doctorId: req.user.userId });

  try {
    // First verify the appointment belongs to this doctor
    const { data: appointmentCheck, error: checkError } = await supabase
      .from('appointments')
      .select('id, doctor_id')
      .eq('id', appointmentId)
      .single();

    console.log('Appointment check:', { appointmentCheck, checkError });

    if (checkError || !appointmentCheck) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointmentCheck.doctor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this appointment' });
    }

    // Delete the appointment
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('Delete successful');
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ error: 'Failed to delete appointment', details: err.message });
  }
});

// POST /api/doctor/certificates - Upload new certificate
router.post(
  "/certificates",
  authenticate,
  certificateUpload.single("certificate"),
  async (req, res) => {
    console.log("=== CERTIFICATE UPLOAD STARTED ===");
    console.log("User:", req.user);
    console.log("Body:", req.body);
    console.log("File:", req.file ? req.file.originalname : "NO FILE");

    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { name, issue_date } = req.body;
    if (!name) {
      console.log("Missing name");
      return res.status(400).json({ error: "Certificate name is required" });
    }

    try {
      // Upload to Supabase Storage
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `cert-${req.user.userId}-${Date.now()}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      console.log("Certificate uploaded to:", publicUrl);

      // Insert certificate record
      const { data, error } = await supabase
        .from("certificates")
        .insert({
          doctor_id: req.user.userId,
          name: name,
          issue_date: issue_date || null,
          file: publicUrl,
        })
        .select(`
          id, name, issue_date, file
        `)
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // Format response to match frontend expectations
      const formattedData = {
        id: data.id,
        name: data.name,
        issue_date: data.issue_date,
        file: data.file
      };

      console.log("Insert success:", formattedData);
      res.status(201).json(formattedData);
    } catch (err) {
      console.error("CERTIFICATE UPLOAD ERROR:", err);
      res.status(500).json({ 
        error: "Upload failed", 
        details: err.message,
        code: err.code,
        hint: err.hint
      });
    }
  }
);

router.delete("/certificates/:id", authenticate, async (req, res) => {
  const certificateId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", certificateId)
      .eq("doctor_id", req.user.userId)
      .select("id")
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Certificate not found or not owned" });
    }

    res.json({ message: "Certificate deleted" });
  } catch (err) {
    console.error("Delete certificate error:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

router.post("/change-password", authenticate, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    // Get the token from the request header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "No authentication token" });
    }

    // Use the admin API to update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(
      req.user.userId,
      { password: newPassword }
    );

    if (error) {
      console.error("Supabase password update error:", error);
      throw error;
    }

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err.message, err);
    res.status(500).json({ error: "Failed to change password", details: err.message });
  }
});

// GET /api/doctor/patients 
router.get('/patients', authenticate, async (req, res) => {
  try {

    console.log('PATIENTS ROUTE CALLED - doctor ID:', req.user.userId);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        patients!inner (
          user_id,
          full_name,
          age,
          gender,
          blood_type,
          address
        )
      `)
      .eq('doctor_id', req.user.userId)
      .order('full_name', {foreignTable: 'patients'});

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log('Patients fetched:', data?.length || 0, 'rows');

    // Format response to match frontend and remove duplicates
    const uniquePatientsMap = new Map();
    (data || []).forEach(item => {
      const patientId = item.patients.user_id;
      // Only add if not already in map (keeps first occurrence)
      if (!uniquePatientsMap.has(patientId)) {
        uniquePatientsMap.set(patientId, {
          id: patientId,
          name: item.patients.full_name || 'Unknown',
          age: item.patients.age,
          gender: item.patients.gender || 'N/A',
          status: 'Active' 
        });
      }
    });

    const formatted = Array.from(uniquePatientsMap.values());

    res.status(200).json(formatted);
  } catch (err) {
    console.error('PATIENTS ROUTE ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch patients', details: err.message});
  }
});

// POST /api/doctor/patients - Add new patient
router.post('/patients', authenticate, async (req, res) => {
  try {
    const { full_name, age, phone, gender, email } = req.body;

    // Validation
    if (!full_name || !age || !phone || !gender) {
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, age, phone, gender' 
      });
    }

    // Create user account for the patient (optional - if you want them to have login)
    // For now, we'll just create a patient record without user account
    
    // Insert patient into database
    const { data: newPatient, error } = await supabase
      .from('patients')
      .insert({
        full_name,
        age: parseInt(age),
        phone,
        gender,
        email: email || null,
        // You might want to link to a user_id if creating user account
        // user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Insert patient error:', error);
      throw error;
    }

    // Format response to match frontend expectation
    const formatted = {
      id: newPatient.user_id || newPatient.id,
      name: newPatient.full_name,
      age: newPatient.age,
      gender: newPatient.gender,
      status: 'Active'
    };

    res.status(201).json(formatted);
  } catch (err) {
    console.error('ADD PATIENT ERROR:', err);
    res.status(500).json({ error: 'Failed to add patient', details: err.message });
  }
});

// GET /api/doctor/patients/:id 
router.get('/patients/:id', authenticate, async (req, res) => {
  const patientId = req.params.id;
  console.log('GET /patients/:id called with patientId:', patientId);

  try {
    // 1. Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('user_id, full_name, age, gender, blood_type, address, email, phone_number')
      .eq('user_id', patientId)
      .single();

    console.log('Patient query result:', { patient, patientError });

    if (patientError || !patient) {
      console.log('Patient not found for ID:', patientId);
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 2. Fetch ALL appointments for this patient with this doctor
    const { data: appointmentsData, error: aptsError } = await supabase
      .from('appointments')
      .select('appointment_time, status')
      .eq('doctor_id', req.user.userId)
      .eq('patient_id', patientId)
      .order('appointment_time', { ascending: false });

    console.log('Appointments query - doctor_id:', req.user.userId, 'patient_id:', patientId);
    console.log('All appointments for patient:', appointmentsData, 'error:', aptsError);

    // 3. Filter for past appointments in JavaScript
    const now = new Date();
    const pastAppointments = (appointmentsData || []).filter(apt => 
      new Date(apt.appointment_time) < now
    );
    
    console.log('Past appointments filtered:', pastAppointments);

    // 4. Get the most recent past appointment
    const lastVisit = pastAppointments.length > 0 
      ? new Date(pastAppointments[0].appointment_time).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'No past visits';

    res.json({
      id: patient.user_id,
      name: patient.full_name,
      age: patient.age,
      gender: patient.gender || 'N/A',
      email: patient.email || 'N/A',
      phone: patient.phone_number || 'N/A',
      bloodType: patient.blood_type || 'N/A',
      allergies: 'N/A',
      lastVisit,
      symptoms: [],
      medicalHistory: [],
      aiAnalysis: { probability: 'N/A', conditions: [], recommendation: 'N/A' },
      diagnosis: 'N/A',
      treatmentPlan: 'N/A'
    });
  } catch (err) {
    console.error('Patient case error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/doctor/chats - جلب قايمة المحادثات (المرضى اللي كلموهم الدكتور)
router.get('/chats', authenticate, async (req, res) => {
  try {
    const { data: lastMessages, error: msgError} = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message_text,
        sent_at,
        is_read
      `)
      .eq('receiver_id', req.user.userId)
      .order('sent_at', { ascending: false });

    if (msgError) throw msgError;

    const patientIds = [...new Set(lastMessages.map(msg => msg.sender_id))];
    if (patientIds.length === 0){
      return res.json([]);
    }

    const { data: patients, error: patError } = await supabase
      .from('patients')
      .select(`
        user_id,
        full_name,
        profile_picture
      `)
      .in('user_id', patientIds);
    
    if (patError) throw patError;

    const chats = patientIds.map(patientId => {
      const lastMsg = lastMessages.find(msg => msg.sender_id === patientId);
      const patient = patients.find(p => p.user_id === patientId) || {};

      return {
        id: patientId,
        name: patient.full_name || 'Unknown Patient',
        avatar: patient.full_name ? patient.full_name.charAt(0).toUpperCase() : 'P',
        profilePicture: patient.profile_picture || null,
        lastMessage: lastMsg?.message_text || '',
        time: lastMsg ? new Date(lastMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: lastMsg?.is_read ? 0 : 1
      };
    });

    res.json(chats);
  } catch (err) {
    console.error('Chats fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
  }
});

// GET /api/doctor/chats/:patientId
router.get('/chats/:patientId', authenticate, async (req, res) => {
  const patientId = req.params.patientId;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message_text,
        sent_at
      `)
      .or(`and(sender_id.eq.${req.user.userId},receiver_id.eq.${patientId}),and(sender_id.eq.${patientId},receiver_id.eq.${req.user.userId})`)
      .order('sent_at', { ascending: true });

    if (error) throw error;

    // Mark as read (اختياري)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', req.user.userId)
      .eq('sender_id', patientId)
      .is('is_read', false);

    res.json(data || []);
  } catch (err) {
    console.error('Chat messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/doctor/chats/:patientId 
router.post('/chats/:patientId', authenticate, messageUpload.single('attachment'), async (req, res) => {
  const patientId = req.params.patientId;
  const { message_text } = req.body;

  if (!message_text?.trim() && !req.file) {
    return res.status(400).json({ error: 'Message text or attachment is required' });
  }

  let filePath = null;
  let fileType = null;
  let fileName = null;

  try {
    // Upload file to Supabase Storage if present
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const uniqueFileName = `${req.user.userId}-${Date.now()}.${fileExt}`;
      const supabasePath = `messages/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(supabasePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('messages')
        .getPublicUrl(supabasePath);

      filePath = urlData.publicUrl;
      fileType = req.file.mimetype;
      fileName = req.file.originalname;
    }

    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.userId,
        receiver_id: patientId,
        message_text: message_text?.trim() || '',
        file_path: filePath,
        file_type: fileType,
        file_name: fileName,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

// GET /api/doctor/search - Search and filter doctors (for patients) - PUBLIC
router.get('/search', async (req, res) => {
  try {
    let query = supabase.from('doctors').select('user_id, full_name, specialty, years_of_experience, rating, rating_count, is_available, price, profile_picture');

    // Filter by name (partial match)
    if (req.query.name) {
      query = query.ilike('full_name', `%${req.query.name}%`);
    }

    // Filter by specialization (case-insensitive match)
    if (req.query.specialization) {
      console.log('Filtering by specialization:', req.query.specialization);
      query = query.ilike('specialty', `%${req.query.specialization}%`);
    }

    // Filter by rating (minimum rating)
    if (req.query.rating) {
      const minRating = parseFloat(req.query.rating);
      query = query.gte('rating', minRating);
    }

    // Default ordering: highest rating first
    query = query.order('rating', { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Search results:', data?.length || 0, 'doctors found');

    // Format response to match DoctorCard expectations
    const formatted = (data || []).map(doc => ({
      id: doc.user_id,
      name: doc.full_name,
      specialization: doc.specialty,
      experience: doc.years_of_experience ? `${doc.years_of_experience} years` : 'N/A',
      rating: doc.rating || 0,
      availability: doc.is_available ? 'Available' : 'Not Available',
      profilePicture: doc.profile_picture || null
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Doctor search error:', err);
    res.status(500).json({ error: 'Failed to search doctors', details: err.message });
  }
});

// GET /api/doctor - Get all doctors (for patients to browse) - PUBLIC
router.get('/', async (req, res) => {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('user_id, full_name, specialty, years_of_experience, clinic_name, biography, profile_picture')
      .order('full_name');

    if (error) throw error;

    const formatted = doctors.map(doc => ({
      id: doc.user_id,
      name: doc.full_name,
      specialization: doc.specialty,
      yearsOfExperience: doc.years_of_experience,
      clinicName: doc.clinic_name,
      bio: doc.biography,
      profilePicture: doc.profile_picture,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Get doctors error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/doctor/:id - Get doctor profile by ID (for patients to view) - PUBLIC
router.get('/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;

    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('user_id, full_name, specialty, years_of_experience, clinic_name, biography, profile_picture, license_file_path')
      .eq('user_id', doctorId)
      .single();

    if (error || !doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Get certificates
    const { data: certs } = await supabase
      .from('certificates')
      .select(`
        id,
        name,
        issue_date,
        file
      `)
      .eq('doctor_id', doctorId);

    res.json({
      id: doctor.user_id,
      name: doctor.full_name,
      specialization: doctor.specialty,
      yearsOfExperience: doctor.years_of_experience,
      clinicName: doctor.clinic_name,
      bio: doctor.biography,
      profilePicture: doctor.profile_picture,
      licenseFilePath: doctor.license_file_path,
      certificates: certs || [],
      education: [], // Can be added to database later
    });
  } catch (err) {
    console.error('Get doctor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/download-certificate/:id", authenticate, async (req, res) => {
  const certificateId = req.params.id;

  try {
    // Verify the certificate belongs to this doctor
    const { data: cert, error } = await supabase
      .from("certificates")
      .select("file, name")
      .eq("id", certificateId)
      .eq("doctor_id", req.user.userId)
      .single();

    if (error || !cert) {
      return res.status(404).json({ error: "Certificate not found or access denied" });
    }

    // Redirect to the Supabase public URL
    res.redirect(cert.file);
  } catch (err) {
    console.error("Download certificate error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
