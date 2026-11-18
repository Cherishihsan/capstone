const nodemailer = require('nodemailer');

function isEmailEnabled() {
  return String(process.env.EMAIL_ENABLED || 'false').toLowerCase() === 'true';
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || ''
        }
      : undefined
  });
}

module.exports = {
  isEmailEnabled,
  createTransporter,
  defaultFrom: process.env.SMTP_FROM || '"SIMNILAI Sekolah" <no-reply@sekolah.sch.id>'
};
