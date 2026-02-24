const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Medical Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Verification Code',
    text: `Your OTP is ${otp}. It expires in 3 minutes.`,
    html: `
      <h2>Email Verification</h2>
      <p>Use this code to verify your account:</p>
      <h1 style="letter-spacing: 8px;">${otp}</h1>
      <p>This code expires in 3 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };