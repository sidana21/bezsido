import fs from 'fs';
import path from 'path';

export interface EmailConfig {
  service: 'gmail' | 'sendgrid';
  gmail?: {
    user: string;
    password: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  fromEmail: string;
  isConfigured: boolean;
  lastUpdated: string;
}

export class EmailConfigManager {
  private configFilePath: string;

  constructor() {
    this.configFilePath = path.join(process.cwd(), 'email-config.json');
    this.ensureConfigFile();
  }

  /**
   * التأكد من وجود ملف الإعدادات أو إنشاؤه
   */
  private ensureConfigFile(): void {
    if (!fs.existsSync(this.configFilePath)) {
      const defaultConfig: EmailConfig = {
        service: 'gmail',
        fromEmail: '',
        isConfigured: false,
        lastUpdated: new Date().toISOString()
      };
      this.saveConfig(defaultConfig);
    }
  }

  /**
   * قراءة إعدادات البريد الإلكتروني
   */
  public readConfig(): EmailConfig | null {
    try {
      const configContent = fs.readFileSync(this.configFilePath, 'utf8');
      return JSON.parse(configContent) as EmailConfig;
    } catch (error) {
      console.error('خطأ في قراءة إعدادات البريد الإلكتروني:', error);
      return null;
    }
  }

  /**
   * حفظ إعدادات البريد الإلكتروني
   */
  public saveConfig(config: EmailConfig): boolean {
    try {
      config.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), 'utf8');
      console.log('✅ تم حفظ إعدادات البريد الإلكتروني');
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ إعدادات البريد الإلكتروني:', error);
      return false;
    }
  }

  /**
   * تحديث إعدادات Gmail
   */
  public updateGmailConfig(user: string, password: string, fromEmail?: string): boolean {
    const config: EmailConfig = {
      service: 'gmail',
      gmail: { user, password },
      fromEmail: fromEmail || user,
      isConfigured: true,
      lastUpdated: new Date().toISOString()
    };
    return this.saveConfig(config);
  }

  /**
   * تحديث إعدادات SendGrid
   */
  public updateSendGridConfig(apiKey: string, fromEmail: string): boolean {
    const config: EmailConfig = {
      service: 'sendgrid',
      sendgrid: { apiKey },
      fromEmail,
      isConfigured: true,
      lastUpdated: new Date().toISOString()
    };
    return this.saveConfig(config);
  }

  /**
   * الحصول على إعدادات البريد الإلكتروني للاستخدام
   */
  public getEmailCredentials(): {
    service: string;
    user?: string;
    password?: string;
    apiKey?: string;
    fromEmail: string;
  } | null {
    const config = this.readConfig();
    if (!config || !config.isConfigured) {
      return null;
    }

    if (config.service === 'gmail' && config.gmail) {
      return {
        service: 'gmail',
        user: config.gmail.user,
        password: config.gmail.password,
        fromEmail: config.fromEmail
      };
    }

    if (config.service === 'sendgrid' && config.sendgrid) {
      return {
        service: 'sendgrid',
        apiKey: config.sendgrid.apiKey,
        fromEmail: config.fromEmail
      };
    }

    return null;
  }

  /**
   * التحقق من حالة الإعدادات
   */
  public getStatus(): { isConfigured: boolean; service?: string; lastUpdated?: string } {
    const config = this.readConfig();
    if (!config) {
      return { isConfigured: false };
    }
    
    return {
      isConfigured: config.isConfigured,
      service: config.service,
      lastUpdated: config.lastUpdated
    };
  }
}