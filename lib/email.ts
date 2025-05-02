import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

function validateEmailConfig(): EmailConfig {
  const required = [
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }

  return {
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASSWORD!
    },
    from: process.env.EMAIL_FROM!
  };
}

let transporter: nodemailer.Transporter;

try {
  const config = validateEmailConfig();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });
} catch (error) {
  console.error('Email configuration error:', error);
  // Allow the application to start, but email functionality will be disabled
  transporter = null as unknown as nodemailer.Transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  try {
    await transporter.sendMail({
      from: `"Learning Platform" <${process.env.EMAIL_FROM}>`,
      ...options
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
}