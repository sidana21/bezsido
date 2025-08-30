# استخدم صورة Node.js الرسمية
FROM node:18-alpine

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت الاعتماديات
RUN npm ci --only=production && npm cache clean --force

# نسخ التطبيق
COPY . .

# بناء التطبيق
RUN npm run build

# إنشاء مستخدم غير جذر
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bizchat -u 1001

# تغيير الملكية
RUN chown -R bizchat:nodejs /app
USER bizchat

# فتح المنفذ
EXPOSE 5000

# متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=5000

# تشغيل التطبيق
CMD ["npm", "start"]