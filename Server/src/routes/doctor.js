const { supabase } = require('../lib/database');

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer storage for profile and certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
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
      userId: user.id, // UUID
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

    res.json({
      ...doctor,
      certificates: formattedCerts
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /profile (with file upload)
router.put('/profile', authenticate, upload.single('profilePicture'), async (req, res) => {
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
      updates.profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    const { error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('user_id', req.user.userId);

    if (error) throw error;

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
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
        patient:patient_id (full_name as patient)
      `)
      .eq('doctor_id', req.user.userId)
      .order('appointment_time');

    if (error) throw error;

    // Format the response to match frontend expectation
    const formatted = data.map(item => ({
      id: item.id,
      patient: item.patient?.full_name || 'Unknown',
      date: new Date(item.appointment_time).toISOString().split('T')[0],
      time: new Date(item.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: item.status,
      type: 'Consultation' // or add type column later
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
  upload.single("certificate"),
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

    const filePath = `/uploads/profiles/${req.file.filename}`;
    console.log("Generated file path:", filePath);
    console.log("Doctor ID:", req.user.userId);

    try {
      // Insert certificate record
      const { data, error } = await supabase
        .from("certificates")
        .insert({
          doctor_id: req.user.userId,
          name: name,
          issue_date: issue_date || null,
          file: filePath,
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
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ error: "Failed to change password", details: err.message });
  }
});

// GET /api/doctor/:id - Get doctor profile by ID (for patients to view)
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

// GET /api/doctor - Get all doctors (for patients to browse)
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

router.get(
  "/download-certificate/:filename",
  authenticate,
  async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../../uploads/profiles", filename);

    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("id")
        .eq("doctor_id", req.user.userId)
        .ilike("file", `%${filename}`)
        .single();

      if (error || !data) {
        console.error("Access denied or file not found in DB:", error);
        return res.status(403).json({ error: "Access denied or file not found" });
      }

      // 2. Send file for download
      res.download(filePath, filename, (err) => {
        if (err) {
          if (res.headersSent) return; // Prevent double response
          console.error("File system error:", err);
          res.status(404).json({ error: "File not found on server" });
        }
      });

    } catch (err) {
      console.error("Download route error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

module.exports = router;