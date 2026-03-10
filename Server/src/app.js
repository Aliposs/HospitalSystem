const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');


const app = express();
app.use(cookieParser());


// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());                    
app.use(express.urlencoded({ extended: true }));


// Serve الملفات المرفوعة (licenses, profiles, ...)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use('/api/auth', authRoutes);

app.use('/api/doctor', doctorRoutes);

app.use('/api/patient', patientRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong on the server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;