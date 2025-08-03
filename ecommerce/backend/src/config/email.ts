import dotenv from 'dotenv';

dotenv.config();

// Email configuration
console.log('🔧 Email config debug:', {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? '***HIDDEN***' : 'MISSING'
});

export const emailConfig = {
  smtp: {
    host: process.env.EMAIL_HOST || 'free.mboxhosting.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'contact@nurekha.com',
      pass: process.env.EMAIL_PASS || ''
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  },
  imap: {
    host: process.env.IMAP_HOST || 'free.mboxhosting.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: process.env.IMAP_SECURE === 'true' || true, // true for 993, false for 143
    auth: {
      user: process.env.IMAP_USER || process.env.EMAIL_USER || 'contact@nurekha.com',
      pass: process.env.IMAP_PASS || process.env.EMAIL_PASS || ''
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  defaults: {
    from: process.env.EMAIL_FROM || 'contact@nurekha.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'contact@nurekha.com'
  }
};

// Email templates configuration
export const emailTemplates = {
  passwordReset: {
    subject: 'Password Reset Request',
    template: 'password-reset'
  },
  emailVerification: {
    subject: 'Email Verification',
    template: 'email-verification'
  },
  orderConfirmation: {
    subject: 'Order Confirmation',
    template: 'order-confirmation'
  },
  newsletter: {
    subject: 'Newsletter Subscription',
    template: 'newsletter'
  },
  contactResponse: {
    subject: 'Response to Your Inquiry',
    template: 'contact-response'
  }
};

export default emailConfig;