import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  service?: string;
  auth: {
    user: string;
    pass: string;
  }
}

let transporter: nodemailer.Transporter | null = null;

// Initialize email configuration from environment variables
function initializeEmailService() {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration missing. Email functionality will be disabled.');
      return;
    }

    // Check if we're using Gmail
    const isGmail = process.env.EMAIL_HOST.includes('gmail');

    const config: EmailConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    // Use service for Gmail to better handle its requirements
    if (isGmail) {
      config.service = 'gmail';
    }

    transporter = nodemailer.createTransport(config);
    console.info('Email service configured successfully.');
  } catch (error) {
    console.error('Failed to initialize email service:', error);
  }
}

// Initialize on module load
initializeEmailService();

// Legacy function for custom configuration
export function configureEmailService(config: {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}) {
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    }
  });
}

export function validateEmailConfig() {
  if (!transporter) {
    console.error('Email service not configured', transporter);
    throw new Error('Email service not configured');
  }

  // For sending emails, we need the FROM address
  if (!process.env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM environment variable is required');
  }

  return {
    ...transporter.options,
    from: process.env.EMAIL_FROM
  };
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  // If transporter is not configured, try to initialize it again
  if (!transporter) {
    initializeEmailService();
    if (!transporter) {
      console.error('Email service not configured and could not be initialized');
      throw new Error('Email service not configured');
    }
  }

  try {
    const config = validateEmailConfig();
    const result = await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    });

    console.log('Email sent successfully');
    return result;
  } catch (error: unknown) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `
      <p>You requested a password reset for your account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `
  });
}

const emailSerivce = {
  configureEmailService,
  sendEmail,
  sendPasswordResetEmail
}

export default emailSerivce;