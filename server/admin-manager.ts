import fs from 'fs';
import path from 'path';
import type { IStorage } from './storage';

export interface AdminConfig {
  email: string;
  password: string;
  name: string;
  createdAt: string;
  lastLogin?: string | null;
  isActive: boolean;
}

export class AdminManager {
  private adminFilePath: string;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.adminFilePath = path.join(process.cwd(), 'admin.json');
    this.storage = storage;
  }

  /**
   * قراءة بيانات الإدارة من ملف admin.json أو متغيرات البيئة
   */
  public readAdminConfig(): AdminConfig | null {
    try {
      // المحاولة الأولى: قراءة من ملف admin.json
      if (fs.existsSync(this.adminFilePath)) {
        const adminFileContent = fs.readFileSync(this.adminFilePath, 'utf8');
        const config = JSON.parse(adminFileContent) as AdminConfig;
        console.log('✅ Admin credentials loaded from admin.json');
        return config;
      }
    } catch (error) {
      console.error('⚠️ Error reading admin.json:', error);
    }

    // المحاولة الثانية: استخدام متغيرات البيئة كبديل
    const envEmail = process.env.ADMIN_EMAIL || process.env.DEFAULT_ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD;
    
    if (envEmail && envPassword) {
      console.log('✅ Admin credentials loaded from environment variables');
      return {
        email: envEmail,
        password: envPassword,
        name: process.env.ADMIN_NAME || "المدير العام",
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };
    }

    // المحاولة الثالثة: استخدام بيانات افتراضية للتطوير
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Using default admin credentials for development');
      return {
        email: "admin@bizchat.com",
        password: "admin123456",
        name: "المدير العام",
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };
    }

    console.error('❌ No admin credentials found in admin.json or environment variables');
    return null;
  }

  /**
   * التحقق من صحة بيانات تسجيل الدخول
   */
  public validateCredentials(email: string, password: string): boolean {
    const adminConfig = this.readAdminConfig();
    if (!adminConfig) {
      return false;
    }
    
    return email === adminConfig.email && password === adminConfig.password;
  }

  /**
   * البحث عن مستخدم الإدارة أو إنشاؤه
   */
  public async ensureAdminUser(): Promise<any> {
    const adminConfig = this.readAdminConfig();
    if (!adminConfig) {
      throw new Error('تعذر قراءة إعدادات الإدارة');
    }

    try {
      // البحث عن مستخدم إدارة موجود
      const existingUsers = await this.storage.getAllUsers();
      let adminUser = existingUsers.find(user => user.email === adminConfig.email || user.email === "admin@bizchat.dz");
      
      if (adminUser) {
        console.log('تم العثور على مستخدم إدارة موجود:', adminUser.name);
        // التأكد من أن المستخدم لديه صلاحيات إدارة
        if (!adminUser.isAdmin) {
          adminUser = await this.storage.updateUserAdminStatus(adminUser.id, true);
        }
        return adminUser;
      }

      // البحث عن أي مستخدم إدارة آخر
      const firstAdminUser = existingUsers.find(user => user.isAdmin);
      if (firstAdminUser) {
        console.log('تم العثور على مستخدم إدارة بديل:', firstAdminUser.name);
        return firstAdminUser;
      }

      // إنشاء مستخدم إدارة جديد
      console.log('إنشاء مستخدم إدارة جديد...');
      adminUser = await this.storage.createUser({
        name: adminConfig.name || "المدير العام",
        email: adminConfig.email || "admin@bizchat.dz",
        location: "الجزائر",
        avatar: null,
        isOnline: true,
      });

      if (!adminUser) {
        throw new Error('فشل في إنشاء مستخدم الإدارة');
      }

      // منح صلاحيات الإدارة
      if (adminUser) {
        adminUser = await this.storage.updateUserAdminStatus(adminUser.id, true);
        
        // التحقق من المستخدم
        if (adminUser) {
          await this.storage.updateUserVerificationStatus(adminUser.id, true);
        }
      }
      
      console.log('تم إنشاء مستخدم الإدارة بنجاح:', adminUser?.name);
      return adminUser;

    } catch (error) {
      console.error('خطأ في إدارة مستخدم الإدارة:', error);
      throw new Error('فشل في إنشاء أو العثور على مستخدم الإدارة');
    }
  }

  /**
   * تحديث وقت آخر تسجيل دخول
   */
  public updateLastLogin(): void {
    try {
      const adminConfig = this.readAdminConfig();
      if (adminConfig) {
        adminConfig.lastLogin = new Date().toISOString();
        fs.writeFileSync(this.adminFilePath, JSON.stringify(adminConfig, null, 2));
      }
    } catch (error) {
      console.error('خطأ في تحديث وقت آخر تسجيل دخول:', error);
    }
  }

  /**
   * إنشاء بيانات تجريبية عند أول تسجيل دخول (معطل لضمان حفظ البيانات الحقيقية)
   */
  public async createSampleDataIfNeeded(): Promise<void> {
    // تم تعطيل إنشاء البيانات التجريبية للحفاظ على البيانات الحقيقية للمستخدمين
    console.log('تم تخطي إنشاء البيانات التجريبية - سيتم الاحتفاظ بالبيانات الحقيقية فقط');
    return;
  }

  /**
   * التحقق من صحة حالة الإدارة
   */
  public async validateAdminState(): Promise<boolean> {
    try {
      const adminConfig = this.readAdminConfig();
      if (!adminConfig || !adminConfig.isActive) {
        return false;
      }

      const allUsers = await this.storage.getAllUsers();
      const hasAdminUser = allUsers.some(user => user.isAdmin);
      
      return hasAdminUser;
    } catch (error) {
      console.error('خطأ في التحقق من حالة الإدارة:', error);
      return false;
    }
  }
}