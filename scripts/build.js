#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 بدء عملية البناء للنشر...');

try {
  // تنظيف الملفات السابقة
  console.log('🧹 تنظيف ملفات البناء السابقة...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // بناء الواجهة الأمامية
  console.log('⚛️  بناء الواجهة الأمامية...');
  execSync('vite build', { stdio: 'inherit' });

  // بناء الخادم
  console.log('🖥️  بناء الخادم...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // إنشاء مجلد uploads إذا لم يكن موجوداً
  const uploadsDir = path.join('dist', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 تم إنشاء مجلد uploads');
  }

  // نسخ ملفات مهمة
  const filesToCopy = ['package.json', '.env.example'];
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
      console.log(`📋 تم نسخ ${file}`);
    }
  }

  console.log('✅ تم البناء بنجاح! الملفات جاهزة في مجلد dist/');
  console.log('');
  console.log('📝 خطوات النشر:');
  console.log('1. ارفع محتويات مجلد dist/ إلى الخادم');
  console.log('2. قم بتثبيت الاعتماديات: npm install --production');
  console.log('3. شغّل التطبيق: npm start');

} catch (error) {
  console.error('❌ فشل البناء:', error.message);
  process.exit(1);
}