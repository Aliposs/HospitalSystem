const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/database');
const multer = require('multer');
const path = require('path');

const register = async (req, res) => {
  const {
    fullName,
    email,
    phoneDigits,
    password,
    confirmPassword,
    specialty,
    age,
    bloodType,
    address,
    userType = 'patient',
  } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // 1. Supabase Auth Sign Up
    const { data: authUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userType,
          full_name: fullName,
        },
      },
    });

    if (signUpError) throw signUpError;

    const userId = authUser.user.id;

    // 2. Handle license upload (only for doctors)
    let licenseUrl = null;
    if (userType === 'doctor') {
      if (!req.file) {
        // Optional: delete unverified user
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({ error: 'License file required for doctors' });
      }

      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('licenses').getPublicUrl(filePath);
      licenseUrl = urlData.publicUrl;
    }

    // 3. Insert profile
    if (userType === 'doctor') {
      const { error } = await supabase.from('doctors').insert({
        user_id: userId,
        full_name: fullName,
        phone_number: `+20${phoneDigits}`,
        specialty,
        license_file_path: licenseUrl,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('patients').insert({
        user_id: userId,
        full_name: fullName,
        phone_number: `+20${phoneDigits}`,
        age: Number(age),
        blood_type: bloodType,
        address,
      });
      if (error) throw error;
    }

    res.status(201).json({
      message: 'Registration successful. Check your email to verify your account.',
      email,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
};

// ────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const {
    fullName,
    email,
    phoneDigits,
    password,
    confirmPassword,
    specialty,
    age,
    bloodType,
    address,
    userType = 'patient',
  } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // 1. Create user in Supabase Auth
    const { data: authUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: userType, full_name: fullName },
      },
    });

    if (signUpError) throw signUpError;

    const userId = authUser.user.id;

    // 2. Upload license (only for doctors)
    let licenseUrl = null;
    if (userType === 'doctor') {
      if (!req.file) {
        // Optional: delete the unverified auth user
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({ error: 'License file required for doctors' });
      }

      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('licenses').getPublicUrl(filePath);
      licenseUrl = urlData.publicUrl;
    }

    // 3. Create profile record
    if (userType === 'doctor') {
      const { error } = await supabase.from('doctors').insert({
        user_id: userId,
        full_name: fullName,
        phone_number: `+20${phoneDigits}`,
        specialty,
        license_file_path: licenseUrl,
      });

      if (error) throw error;
    } else {
      const { error } = await supabase.from('patients').insert({
        user_id: userId,
        full_name: fullName,
        phone_number: `+20${phoneDigits}`,
        age: Number(age),
        blood_type: bloodType,
        address,
      });

      if (error) throw error;
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      email,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { email, token } = req.body;

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw error;

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Verification failed' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;

    res.json({ message: 'Verification email resent successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to resend code' });
  }
});

module.exports = router;