const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../lib/database');

// Memory storage for Supabase uploads (profile pictures)
const upload = multer({
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

// Memory storage for message attachments
const messageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for messages
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
});

const authenticatePatient = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    if (user.user_metadata?.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied: Not a patient' });
    }

    req.user = {
      userId: user.id, // UUID
      email: user.email,
      role: user.user_metadata.role,
      fullName: user.user_metadata.full_name || 'Patient'
    };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth error' });
  }
};

// GET /api/patient/profile - جلب بيانات المريض الحالي
router.get('/profile', authenticatePatient, async (req, res) => {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('user_id, full_name, phone_number, age, blood_type, address, gender, email, profile_picture')
      .eq('user_id', req.user.userId)
      .single();

    if (error || !patient) return res.status(404).json({ error: 'Patient profile not found' });

    console.log('Patient from DB:', patient);
    console.log('Profile picture URL:', patient.profile_picture);

    res.json({
      fullName: patient.full_name,
      email: patient.email || req.user.email,
      phone: patient.phone_number,
      age: patient.age,
      gender: patient.gender || 'N/A',
      bloodType: patient.blood_type || 'N/A',
      address: patient.address || 'N/A',
      profilePicture: patient.profile_picture || null,
      allergies: 'N/A',
      chronicDiseases: 'N/A',
      medications: 'N/A'
    });
    
  } catch (err) {
    console.error('Patient profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/patient/profile
router.put('/profile', authenticatePatient, upload.single('profilePicture'), async (req, res) => {

  try {
    const updates = {
      full_name: req.body.fullName,
      phone_number: req.body.phone,
      age: req.body.age ? Number(req.body.age) : null,
      gender: req.body.gender,
      blood_type: req.body.bloodType,
      address: req.body.address
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

    console.log('Updating patient with:', updates);

    const { error: updateError} = await supabase
      .from('patients')
      .update(updates)
      .eq('user_id', req.user.userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    res.json({ message: 'Profile updated successfully', profilePicture: updates.profile_picture });
  } catch (err) {
    console.error('Patient update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/chats', authenticatePatient, async (req, res) => {
  try {
    const { data: lastMessages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message_text,
        sent_at,
        is_read
      `)
      .eq('sender_id', req.user.userId)
      .order('sent_at', { ascending: false });

    if (msgError) throw msgError;

    const doctorIds = [...new Set(lastMessages.map(msg => msg.receiver_id))];
    if (doctorIds.length === 0) {
      return res.json([]);
    }

    const { data: doctors, error: docError } = await supabase
      .from('doctors')
      .select('user_id, full_name, profile_picture')
      .in('user_id', doctorIds);

    if (docError) throw docError;

    const chats = doctorIds.map(doctorId => {
      const lastMsg = lastMessages.find(msg => msg.receiver_id === doctorId);
      const doctor = doctors.find(d => d.user_id === doctorId) || {};

      return {
        id: doctorId,
        name: doctor.full_name || 'Dr. Unknown',
        avatar: doctor.full_name ? doctor.full_name.charAt(0).toUpperCase() : 'D',
        profilePicture: doctor.profile_picture || null,
        lastMessage: lastMsg?.message_text || '',
        time: lastMsg ? new Date(lastMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: lastMsg?.is_read ? 0 : 1
      };
    });

    res.json(chats);
  } catch (err) {
    console.error('Patient chats fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

router.get('/chats/:doctorId', authenticatePatient, async (req, res) => {
  const doctorId = req.params.doctorId;

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
      .or(`and(sender_id.eq.${req.user.userId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${req.user.userId})`)
      .order('sent_at', { ascending: true });

    if (error) throw error;

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', req.user.userId)
      .eq('sender_id', doctorId)
      .is('is_read', false);

    res.json(data || []);
  } catch (err) {
    console.error('Patient chat messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/chats/:doctorId', authenticatePatient, messageUpload.single('attachment'), async (req, res) => {
  const doctorId = req.params.doctorId;
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

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.userId,
        receiver_id: doctorId,
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
    console.error('Patient send message error:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

module.exports = router;