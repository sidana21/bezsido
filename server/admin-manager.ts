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
   * قراءة بيانات الإدارة من ملف admin.json
   */
  public readAdminConfig(): AdminConfig | null {
    try {
      const adminFileContent = fs.readFileSync(this.adminFilePath, 'utf8');
      return JSON.parse(adminFileContent) as AdminConfig;
    } catch (error) {
      console.error('Error reading admin.json:', error);
      return null;
    }
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
      let adminUser = existingUsers.find(user => user.phoneNumber === "+213555123456" || user.phoneNumber === "+213123456789");
      
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
        phoneNumber: "+213555123456",
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
   * إنشاء بيانات تجريبية عند أول تسجيل دخول
   */
  public async createSampleDataIfNeeded(): Promise<void> {
    try {
      const allUsers = await this.storage.getAllUsers();
      
      // إنشاء البيانات التجريبية فقط إذا كان هناك مستخدم واحد فقط (الإدارة)
      if (allUsers.length <= 1) {
        console.log('إنشاء بيانات تجريبية...');
        
        // إنشاء مستخدمين تجريبيين
        const user1 = await this.storage.createUser({
          name: "أحمد محمد",
          phoneNumber: "+213555123456",
          location: "تندوف",
          avatar: null,
          isOnline: true,
        });
        await this.storage.updateUserVerificationStatus(user1.id, true);

        await this.storage.createUser({
          name: "فاطمة بن علي",
          phoneNumber: "+213555234567",
          location: "الجزائر",
          avatar: null,
          isOnline: false,
        });

        const user3 = await this.storage.createUser({
          name: "يوسف الزهراني",
          phoneNumber: "+213555345678",
          location: "وهران",
          avatar: null,
          isOnline: true,
        });
        await this.storage.updateUserVerificationStatus(user3.id, true);

        console.log('تم إنشاء البيانات التجريبية بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إنشاء البيانات التجريبية:', error);
      // لا نرمي خطأ هنا لأن هذا ليس ضرورياً لنجاح تسجيل الدخول
    }
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