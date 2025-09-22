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
   * قراءة بيانات الإدارة من متغيرات البيئة أولاً ثم ملف admin.json
   */
  public readAdminConfig(): AdminConfig | null {
    console.log('🔍 Reading admin config...');
    
    // المحاولة الأولى: استخدام متغيرات البيئة (الأولوية للإنتاج)
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;
    
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

    console.log('⚠️ Environment variables not found, checking admin.json...');

    // المحاولة الثانية: قراءة من ملف admin.json
    try {
      if (fs.existsSync(this.adminFilePath)) {
        const adminFileContent = fs.readFileSync(this.adminFilePath, 'utf8');
        const config = JSON.parse(adminFileContent) as AdminConfig;
        console.log('✅ Admin credentials loaded from admin.json');
        return config;
      } else {
        console.log('⚠️ admin.json file not found at:', this.adminFilePath);
      }
    } catch (error) {
      console.error('⚠️ Error reading admin.json:', error);
    }

    // المحاولة الثالثة: استخدام بيانات افتراضية (للتطوير والطوارئ)
    console.log('⚠️ Using default admin credentials for emergency access');
    return {
      email: "admin@bizchat.com",
      password: "admin123456",
      name: "المدير العام",
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };
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
      throw new Error('admin credentials not found - تعذر قراءة إعدادات الإدارة');
    }

    console.log(`🔍 Looking for admin user with email: ${adminConfig.email}`);

    try {
      // البحث عن مستخدم إدارة موجود
      let existingUsers;
      try {
        existingUsers = await this.storage.getAllUsers();
        console.log(`📊 Found ${existingUsers.length} total users in database`);
      } catch (userFetchError) {
        console.error('❌ Error fetching users:', userFetchError);
        throw new Error('admin user fetch failed - فشل في جلب المستخدمين');
      }

      let adminUser = existingUsers.find(user => 
        user.email === adminConfig.email || 
        user.email === "admin@bizchat.dz" ||
        user.email === "admin@bizchat.com"
      );
      
      if (adminUser) {
        console.log('✅ تم العثور على مستخدم إدارة موجود:', adminUser.name);
        // التأكد من أن المستخدم لديه صلاحيات إدارة
        if (!adminUser.isAdmin) {
          try {
            adminUser = await this.storage.updateUserAdminStatus(adminUser.id, true);
            console.log('✅ Admin privileges updated');
          } catch (updateError) {
            console.error('❌ Error updating admin status:', updateError);
          }
        }
        return adminUser;
      }

      // البحث عن أي مستخدم إدارة آخر
      const firstAdminUser = existingUsers.find(user => user.isAdmin);
      if (firstAdminUser) {
        console.log('✅ تم العثور على مستخدم إدارة بديل:', firstAdminUser.name);
        return firstAdminUser;
      }

      // إنشاء مستخدم إدارة جديد
      console.log('🔧 إنشاء مستخدم إدارة جديد...');
      
      const userData = {
        name: adminConfig.name || "المدير العام",
        email: adminConfig.email || "admin@bizchat.com",
        location: "الجزائر",
        avatar: null,
        isOnline: true,
      };
      
      console.log('Creating user with data:', userData);
      
      try {
        adminUser = await this.storage.createUser(userData);
        console.log('User created successfully:', adminUser?.id);
      } catch (createError) {
        console.error('❌ Error creating admin user:', createError);
        throw new Error('admin user creation failed - فشل في إنشاء مستخدم الإدارة');
      }

      if (!adminUser) {
        throw new Error('admin user creation returned null - إنشاء المستخدم أرجع null');
      }

      // منح صلاحيات الإدارة
      try {
        adminUser = await this.storage.updateUserAdminStatus(adminUser.id, true);
        console.log('✅ Admin status granted');
        
        // التحقق من المستخدم
        if (adminUser) {
          await this.storage.updateUserVerificationStatus(adminUser.id, true);
          console.log('✅ User verified');
        }
      } catch (privilegeError) {
        console.error('❌ Error granting admin privileges:', privilegeError);
      }
      
      console.log('✅ تم إنشاء مستخدم الإدارة بنجاح:', adminUser?.name);
      return adminUser;

    } catch (error) {
      console.error('❌ خطأ في إدارة مستخدم الإدارة:', error);
      
      // رمي خطأ أكثر تفصيلاً
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('admin credentials')) {
        throw error; // اعادة رمي خطأ بيانات الاعتماد
      } else if (errorMessage.includes('fetch failed')) {
        throw error; // اعادة رمي خطأ جلب المستخدمين
      } else if (errorMessage.includes('creation failed')) {
        throw error; // اعادة رمي خطأ إنشاء المستخدم
      } else {
        throw new Error('admin user management failed - فشل في إدارة مستخدم الإدارة');
      }
    }
  }

  /**
   * تحديث وقت آخر تسجيل دخول (فقط إذا كان باستخدام ملف وليس متغيرات البيئة)
   */
  public updateLastLogin(): void {
    // لا نحدث ملف admin.json إذا كنا نستخدم متغيرات البيئة
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      console.log('Using environment variables - skipping admin.json update');
      return;
    }

    // تحديث فقط إذا كان الملف موجود ونحن في بيئة التطوير
    if (process.env.NODE_ENV === 'development' && fs.existsSync(this.adminFilePath)) {
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