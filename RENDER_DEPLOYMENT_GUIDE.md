# دليل نشر BizChat على منصة Render

## خطوات النشر:

### 1. إعداد قاعدة البيانات
1. اذهب إلى [Render Dashboard](https://render.com)
2. اضغط على "New" → "PostgreSQL"
3. أدخل اسم قاعدة البيانات: `bizchat-db`
4. اختر المنطقة القريبة منك
5. انسخ **External Database URL**

### 2. إعداد Web Service
1. اضغط على "New" → "Web Service"
2. ربط مستودع GitHub الخاص بك
3. أدخل الإعدادات التالية:
   - **Name**: `bizchat-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3. إعداد متغيرات البيئة
أضف هذه المتغيرات في قسم "Environment Variables":

```
DATABASE_URL = [أدخل رابط قاعدة البيانات هنا]
NODE_ENV = production
PORT = 10000
SESSION_SECRET = [أي مفتاح سري قوي]
ADMIN_EMAIL = admin@bizchat.com
ADMIN_PASSWORD = [كلمة مرور قوية]
ADMIN_NAME = المدير العام
```

### 4. إعدادات البريد الإلكتروني (اختيارية)
إذا كنت تريد إرسال الرسائل:

```
# للـ Gmail
GMAIL_USER = your-email@gmail.com
GMAIL_APP_PASSWORD = [كلمة مرور التطبيق]

# أو للـ SendGrid
SENDGRID_API_KEY = [مفتاح SendGrid API]

FROM_EMAIL = noreply@bizchat.com
```

### 5. نشر التطبيق
1. اضغط على "Create Web Service"
2. انتظر انتهاء عملية البناء والنشر
3. ستحصل على رابط للوصول إلى التطبيق

## إصلاح الأخطاء الشائعة:

### خطأ 1065 (استعلام فارغ):
- تأكد من أن DATABASE_URL مُعيَّن بشكل صحيح
- تحقق من أن قاعدة البيانات تعمل

### خطأ AdminManager.ensureAdminUser:
- تأكد من تعيين ADMIN_EMAIL و ADMIN_PASSWORD
- تحقق من الاتصال بقاعدة البيانات

### خطأ parse_target.c:
- قم بمسح cache npm: إعادة النشر
- تأكد من أن package.json سليم

## اختبار النشر:
1. افتح رابط التطبيق
2. جرب تسجيل الدخول كمشرف باستخدام:
   - البريد: admin@bizchat.com
   - كلمة المرور: [التي وضعتها في ADMIN_PASSWORD]

## روابط مفيدة:
- [وثائق Render للـ Node.js](https://render.com/docs/node-express)
- [إعداد قواعد بيانات PostgreSQL](https://render.com/docs/postgresql-creating-connecting)