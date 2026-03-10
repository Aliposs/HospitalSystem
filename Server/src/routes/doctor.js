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

// GET /profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('*')
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

    // Format the response to match frontend expectation
    const formatted = data.map(item => ({
      id: item.id,
      patient: item.patient?.full_name || 'Unknown Patient',
      date: new Date(item.appointment_time).toISOString().split('T')[0],
      time: new Date(item.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: item.status,
      type: 'Consultation' 
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
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

    // Format response to match frontend
    const formatted = (data || []).map(item => ({
      id: item.patients.user_id,
      name: item.patients.full_name || 'Unknown',
      age: item.patients.age,
      gender: item.patients.gender || 'N/A',
      status: 'Active' 
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('PATIENTS ROUTE ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch patients', details: err.message});
  }
});

// GET /api/doctor/patients/:id 
router.get('/patients/:id', authenticate, async (req, res) => {
  const patientId = req.params.id;

  try {
    // 1. Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('user_id, full_name, age, gender, blood_type, address')
      .eq('user_id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 2. Fetch appointments - handle null properly
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('appointment_time, status, type')
      .eq('doctor_id', req.user.userId)
      .eq('patient_id', patientId)
      .order('appointment_time', { ascending: false })
      .limit(5);

    // 3. Ensure appointments is always an array
    const appointments = appointmentsData || [];
    
    // 4. Build response safely
    const lastVisit = appointments.length > 0 
      ? new Date(appointments[0].appointment_time).toLocaleDateString()
      : 'N/A';

    res.json({
      id: patient.user_id,
      name: patient.full_name,
      age: patient.age,
      gender: patient.gender || 'N/A',
      email: '',
      phone: '',
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

    // Filter by specialization (exact match)
    if (req.query.specialization) {
      query = query.eq('specialty', req.query.specialization);
    }

    // Filter by rating (minimum rating)
    if (req.query.rating) {
      const minRating = parseFloat(req.query.rating);
      query = query.gte('rating', minRating);
    }

    // Default ordering: highest rating first
    query = query.order('rating', { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) throw error;

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
    res.status(500).json({ error: 'Failed to search doctors' });
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