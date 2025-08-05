import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig, emailTemplates } from '../config/email';
import path from 'path';
import fs from 'fs';

// Email service interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter!: Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
    // Test connection on startup
    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      console.log('🔧 Testing email service connection...');
      const isConnected = await this.verifyConnection();
      if (isConnected) {
        console.log('✅ Email service is ready to send emails');
      } else {
        console.log('❌ Email service connection failed - emails will not be sent');
      }
    } catch (error) {
      console.error('❌ Email service test failed:', error);
    }
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: emailConfig.smtp.auth,
        tls: emailConfig.smtp.tls
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  // Verify SMTP connection
  public async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('Email service is not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      return false;
    }
  }

  // Load email template
  private loadTemplate(templateName: string, data: Record<string, any> = {}): string {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        // Return a basic template if file doesn't exist
        return this.getBasicTemplate(templateName, data);
      }

      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Replace template variables
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        template = template.replace(regex, data[key] || '');
      });

      return template;
    } catch (error) {
      console.error('Error loading email template:', error);
      return this.getBasicTemplate(templateName, data);
    }
  }

  // Basic template fallback
  private getBasicTemplate(templateName: string, data: Record<string, any>): string {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
          .content { padding: 20px; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>\{\{companyName\}\}</h1>
        </div>
        <div class="content">
          \{\{content\}\}
        </div>
        <div class="footer">
          <p>This email was sent from \{\{companyName\}\}. If you have any questions, please contact us.</p>
        </div>
      </body>
      </html>
    `;

    let content = '';
    const companyName = data.companyName || 'Nurekha E-commerce';

    switch (templateName) {
      case 'password-reset':
        content = `
          <h2>Password Reset Request</h2>
          <p>Hello \{\{name\}\},</p>
          <p>You have requested to reset your password. Click the button below to reset it:</p>
          <a href="\{\{resetUrl\}\}" class="button">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `;
        break;
      case 'email-verification':
        content = `
          <h2>Email Verification</h2>
          <p>Hello \{\{name\}\},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="\{\{verificationUrl\}\}" class="button">Verify Email</a>
          <p>If you didn't create an account, please ignore this email.</p>
        `;
        break;
      case 'otp-verification':
        content = `
          <h2>Email Verification Code</h2>
          <p>Hello \{\{name\}\},</p>
          <p>Your verification code is:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">\{\{otpCode\}\}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        `;
        break;
      case 'password-reset-otp':
        content = `
          <h2>Password Reset Code</h2>
          <p>Hello \{\{name\}\},</p>
          <p>You have requested to reset your password. Your reset code is:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">\{\{otpCode\}\}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `;
        break;
      case 'order-confirmation':
        content = `
          <h2>Order Confirmation</h2>
          <p>Hello \{\{customerName\}\},</p>
          <p>Thank you for your order! Your order #\{\{orderNumber\}\} has been confirmed.</p>
          <p><strong>Order Total:</strong> $\{\{orderTotal\}\}</p>
          <p>We'll send you another email when your order ships.</p>
        `;
        break;
      case 'contact-response':
        content = `
          <h2>Response to Your Inquiry</h2>
          <p>Hello \{\{name\}\},</p>
          <p>Thank you for contacting us. Here's our response to your inquiry:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            \{\{responseMessage\}\}
          </div>
          <p>If you have any further questions, please don't hesitate to contact us.</p>
        `;
        break;
      default:
        content = `
          <h2>\{\{subject\}\}</h2>
          <p>\{\{message\}\}</p>
        `;
    }

    let template = baseTemplate.replace('\{\{content\}\}', content);
    template = template.replace(/\{\{companyName\}\}/g, companyName);
    
    // Replace other variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      template = template.replace(regex, data[key] || '');
    });

    return template;
  }

  // Send email
  public async sendEmail(options: EmailOptions): Promise<EmailResult> {
    console.log('📧 Attempting to send email:', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      isConfigured: this.isConfigured
    });

    if (!this.isConfigured) {
      console.error('❌ Email service is not configured');
      return {
        success: false,
        error: 'Email service is not configured'
      };
    }

    try {
      let html = options.html;
      
      // Use template if specified
      if (options.template && options.templateData) {
        console.log('📄 Loading email template:', options.template);
        html = this.loadTemplate(options.template, {
          ...options.templateData,
          subject: options.subject
        });
      }

      const mailOptions = {
        from: emailConfig.defaults.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: html,
        replyTo: emailConfig.defaults.replyTo,
        attachments: options.attachments
      };

      console.log('📤 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html
      });

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', {
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send password reset email
  public async sendPasswordResetEmail(email: string, resetUrl: string, userName?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: emailTemplates.passwordReset.subject,
      template: emailTemplates.passwordReset.template,
      templateData: {
        name: userName || 'User',
        resetUrl: resetUrl,
        companyName: 'Nurekha E-commerce'
      }
    });
  }

  // Send email verification
  public async sendEmailVerification(email: string, verificationUrl: string, userName?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: emailTemplates.emailVerification.subject,
      template: emailTemplates.emailVerification.template,
      templateData: {
        name: userName || 'User',
        verificationUrl: verificationUrl,
        companyName: 'Nurekha E-commerce'
      }
    });
  }

  // Send OTP verification
  public async sendOTPVerification(email: string, otpCode: string, userName?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Email Verification Code',
      template: 'otp-verification',
      templateData: {
        name: userName || 'User',
        otpCode: otpCode,
        companyName: 'Nurekha E-commerce'
      }
    });
  }

  // Send password reset OTP
  public async sendPasswordResetOTP(email: string, otpCode: string, userName?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Code',
      template: 'password-reset-otp',
      templateData: {
        name: userName || 'User',
        otpCode: otpCode,
        companyName: 'Nurekha E-commerce'
      }
    });
  }

  // Send order confirmation
  public async sendOrderConfirmation(email: string, orderData: any): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: emailTemplates.orderConfirmation.subject,
      template: emailTemplates.orderConfirmation.template,
      templateData: {
        customerName: orderData.customerName || 'Customer',
        orderNumber: orderData.orderNumber,
        orderTotal: orderData.orderTotal,
        companyName: 'Nurekha E-commerce'
      }
    });
  }

  // Send contact response
  public async sendContactResponse(email: string, responseData: any): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: responseData.subject || emailTemplates.contactResponse.subject,
      template: emailTemplates.contactResponse.template,
      templateData: {
        name: responseData.name || 'Customer',
        responseMessage: responseData.message,
        companyName: 'Nurekha E-commerce'
      }
    });
  }

  // Send newsletter
  public async sendNewsletter(emails: string[], subject: string, content: string): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail({
        to: email,
        subject: subject,
        html: content
      });
      results.push(result);
      
      // Add small delay to avoid overwhelming the SMTP server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;


export { EmailService };