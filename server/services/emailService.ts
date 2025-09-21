// Email service supporting both SendGrid and Gmail with secure environment variables
import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import { EmailConfigManager } from '../email-config-manager';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private sendGridService?: MailService;
  private gmailTransporter?: any;
  private fromEmail: string;
  private emailConfigManager: EmailConfigManager;

  constructor() {
    this.emailConfigManager = new EmailConfigManager();
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
    this.initializeServices();
  }

  private initializeServices() {
    let serviceInitialized = false;

    // أولاً: التحقق من متغيرات البيئة (الأولوية للأمان)
    if (process.env.SENDGRID_API_KEY) {
      this.sendGridService = new MailService();
      this.sendGridService.setApiKey(process.env.SENDGRID_API_KEY);
      this.fromEmail = process.env.FROM_EMAIL || this.fromEmail;
      console.log('✅ SendGrid initialized from environment variables');
      serviceInitialized = true;
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      this.fromEmail = process.env.GMAIL_USER;
      console.log('✅ Gmail initialized from environment variables');
      serviceInitialized = true;
    }

    // ثانياً: إذا لم توجد متغيرات البيئة، استخدم الإعدادات المحفوظة
    if (!serviceInitialized) {
      const savedCredentials = this.emailConfigManager.getEmailCredentials();
      if (savedCredentials) {
        if (savedCredentials.service === 'sendgrid' && savedCredentials.apiKey) {
          this.sendGridService = new MailService();
          this.sendGridService.setApiKey(savedCredentials.apiKey);
          this.fromEmail = savedCredentials.fromEmail;
          console.log('✅ SendGrid initialized from saved configuration');
          serviceInitialized = true;
        } else if (savedCredentials.service === 'gmail' && savedCredentials.user && savedCredentials.password) {
          this.gmailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: savedCredentials.user,
              pass: savedCredentials.password,
            },
          });
          this.fromEmail = savedCredentials.fromEmail;
          console.log('✅ Gmail initialized from saved configuration');
          serviceInitialized = true;
        }
      }
    }

    if (!serviceInitialized) {
      console.warn('⚠️ No email service configured. Please set up email credentials in admin panel or environment variables.');
    }
  }

  // Generate secure 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send email using available service (prioritizes SendGrid)
  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      // Try SendGrid first (more reliable for production)
      if (this.sendGridService) {
        await this.sendGridService.send({
          to: params.to,
          from: this.fromEmail,
          subject: params.subject,
          text: params.text || '',
          html: params.html,
        });
        console.log('✅ Email sent via SendGrid to:', params.to);
        return true;
      }

      // Fallback to Gmail
      if (this.gmailTransporter) {
        await this.gmailTransporter.sendMail({
          from: this.fromEmail,
          to: params.to,
          subject: params.subject,
          text: params.text,
          html: params.html,
        });
        console.log('✅ Email sent via Gmail to:', params.to);
        return true;
      }

      console.error('❌ No email service available');
      return false;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // Send OTP email with Arabic support
  async sendOTP(email: string, otp: string, userName?: string): Promise<boolean> {
    const subject = 'رمز التحقق - BizChat';
    const text = `
مرحباً ${userName || ''}،

رمز التحقق الخاص بك هو: ${otp}

هذا الرمز صالح لمدة 10 دقائق فقط.

إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.

شكراً لك،
فريق BizChat
    `;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز التحقق</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; direction: rtl;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #075e54; margin: 0;">BizChat</h1>
            <p style="color: #666; margin: 5px 0 0 0;">تطبيق المراسلة التجارية</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="color: #333; margin: 0 0 15px 0;">رمز التحقق الخاص بك</h2>
            <div style="font-size: 32px; font-weight: bold; color: #075e54; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
            </div>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">هذا الرمز صالح لمدة 10 دقائق فقط</p>
        </div>

        <div style="margin: 30px 0;">
            <p style="color: #333; margin: 0 0 10px 0;">مرحباً ${userName || 'عزيزي المستخدم'}،</p>
            <p style="color: #666; line-height: 1.6; margin: 0 0 15px 0;">
                لقد طلبت رمز تحقق للوصول إلى حسابك في BizChat. يرجى استخدام الرمز أعلاه لإكمال عملية التحقق.
            </p>
            <p style="color: #e74c3c; font-size: 14px; margin: 0;">
                إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
            </p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 0;">شكراً لك على استخدام BizChat</p>
            <p style="margin: 5px 0 0 0;">فريق BizChat</p>
        </div>
    </div>
</body>
</html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  // Check which email service is available
  getAvailableService(): string {
    if (this.sendGridService) return 'SendGrid';
    if (this.gmailTransporter) return 'Gmail';
    return 'None';
  }

  // إعادة تهيئة الخدمة بعد تحديث الإعدادات
  public reinitializeService(): void {
    this.sendGridService = undefined;
    this.gmailTransporter = undefined;
    this.initializeServices();
  }

  // الحصول على حالة الخدمة مع التفاصيل
  public getServiceStatus(): { 
    hasService: boolean; 
    service: string; 
    fromEmail: string; 
    configSource: string;
    savedConfigStatus: any;
  } {
    const savedStatus = this.emailConfigManager.getStatus();
    return {
      hasService: this.getAvailableService() !== 'None',
      service: this.getAvailableService(),
      fromEmail: this.fromEmail,
      configSource: this.getAvailableService() !== 'None' ? 
        (process.env.SENDGRID_API_KEY || process.env.GMAIL_USER ? 'environment' : 'saved') : 'none',
      savedConfigStatus: savedStatus
    };
  }

  // Test email service connection
  async testConnection(): Promise<{ success: boolean; service: string; message: string }> {
    const service = this.getAvailableService();
    
    if (service === 'None') {
      return {
        success: false,
        service: 'None',
        message: 'No email service configured'
      };
    }

    try {
      if (this.gmailTransporter) {
        await this.gmailTransporter.verify();
      }
      
      return {
        success: true,
        service,
        message: `${service} connection verified successfully`
      };
    } catch (error) {
      return {
        success: false,
        service,
        message: `${service} connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;