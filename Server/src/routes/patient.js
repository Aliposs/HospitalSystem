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

// POST /api/patient/appointments - Book a new appointment
router.post('/appointments', authenticatePatient, async (req, res) => {
  const { doctor_id, appointment_time, appointment_type } = req.body;

  if (!doctor_id || !appointment_time) {
    return res.status(400).json({ error: 'Doctor ID and appointment time are required' });
  }

  try {
    // Validate appointment time is in the future
    const appointmentDate = new Date(appointment_time);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({ error: 'Appointment time must be in the future' });
    }

    // Check if doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('user_id')
      .eq('user_id', doctor_id)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check for conflicting appointments (same doctor, same time slot - within 30 min)
    const { data: conflicting } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .gte('appointment_time', new Date(appointmentDate.getTime() - 30 * 60000).toISOString())
      .lte('appointment_time', new Date(appointmentDate.getTime() + 30 * 60000).toISOString())
      .eq('status', 'Confirmed');

    if (conflicting && conflicting.length > 0) {
      return res.status(409).json({ error: 'This time slot is already booked. Please choose another time.' });
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        doctor_id,
        patient_id: req.user.userId,
        appointment_time,
        appointment_type: appointment_type || 'Consultation',
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Notify the doctor
    const aptDate = new Date(appointment_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    await supabase.from('notifications').insert({
      user_id: doctor_id,
      type: 'new_appointment',
      message: `${req.user.fullName} booked an appointment on ${aptDate}`
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: data
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to book appointment', details: err.message });
  }
});

// GET /api/patient/appointments - Get all appointments for the patient
router.get('/appointments', authenticatePatient, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        status,
        doctor:doctor_id (
          user_id,
          full_name,
          specialty
        )
      `)
      .eq('patient_id', req.user.userId)
      .order('appointment_time', { ascending: false });

    if (error) throw error;

    // Format the response
    const formatted = (data || []).map(apt => ({
      id: apt.id,
      doctor: apt.doctor?.full_name || 'Unknown Doctor',
      specialization: apt.doctor?.specialty || 'N/A',
      date: new Date(apt.appointment_time).toISOString().split('T')[0],
      time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: apt.status,
      appointment_time: apt.appointment_time
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Appointments fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/patient/diagnoses - Get all diagnoses for the patient
router.get('/diagnoses', authenticatePatient, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, diagnosis_text, created_at, doctor_id')
      .eq('patient_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch doctor names separately
    const doctorIds = [...new Set((data || []).map(d => d.doctor_id))];
    let doctorsMap = {};

    if (doctorIds.length > 0) {
      const { data: doctors } = await supabase
        .from('doctors')
        .select('user_id, full_name, specialty')
        .in('user_id', doctorIds);

      (doctors || []).forEach(doc => {
        doctorsMap[doc.user_id] = doc;
      });
    }

    const formatted = (data || []).map(d => ({
      id: d.id,
      diagnosis_text: d.diagnosis_text,
      created_at: d.created_at,
      doctor_name: doctorsMap[d.doctor_id]?.full_name || 'Unknown Doctor',
      specialization: doctorsMap[d.doctor_id]?.specialty || ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Diagnoses fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch diagnoses' });
  }
});

// GET /api/patient/pills - Get treatment plan (pills) for the patient
router.get('/pills', authenticatePatient, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pills')
      .select('id, name, time, taken, frequency, meal_timing')
      .eq('user_id', req.user.userId)
      .order('time', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Pills fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch treatment plan' });
  }
});

// PUT /api/patient/appointments/:id - Reschedule an appointment
router.put('/appointments/:id', authenticatePatient, async (req, res) => {
  const appointmentId = req.params.id;
  const { appointment_time } = req.body;

  if (!appointment_time) {
    return res.status(400).json({ error: 'Appointment time is required' });
  }

  try {
    // Verify the appointment belongs to this patient
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, patient_id')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patient_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update the appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ appointment_time })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// DELETE /api/patient/appointments/:id - Cancel an appointment
router.delete('/appointments/:id', authenticatePatient, async (req, res) => {
  const appointmentId = req.params.id;

  try {
    // Verify the appointment belongs to this patient
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, appointment_time')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patient_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'Cancelled' })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // Notify the doctor
    const aptDate = new Date(appointment.appointment_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    await supabase.from('notifications').insert({
      user_id: appointment.doctor_id,
      type: 'cancelled_appointment',
      message: `${req.user.fullName} cancelled their appointment on ${aptDate}`
    });

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
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
      
      // Count all unread messages sent to this doctor (messages patient sent that doctor hasn't read)
      const unreadCount = lastMessages.filter(msg => 
        msg.receiver_id === doctorId && !msg.is_read
      ).length;

      return {
        id: doctorId,
        name: doctor.full_name || 'Dr. Unknown',
        avatar: doctor.full_name ? doctor.full_name.charAt(0).toUpperCase() : 'D',
        profilePicture: doctor.profile_picture || null,
        lastMessage: lastMsg?.message_text || '',
        time: lastMsg ? new Date(lastMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: unreadCount
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

    // Notify the doctor about new message
    await supabase.from('notifications').insert({
      user_id: doctorId,
      type: 'new_message',
      message: `New message from ${req.user.fullName}`
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Patient send message error:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

// GET /api/patient/notifications
router.get('/notifications', authenticatePatient, async (req, res) => {
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

// PATCH /api/patient/notifications/read-all
router.patch('/notifications/read-all', authenticatePatient, async (req, res) => {
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

// DELETE /api/patient/notifications/:id
router.delete('/notifications/:id', authenticatePatient, async (req, res) => {
  try {
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

module.exports = router;