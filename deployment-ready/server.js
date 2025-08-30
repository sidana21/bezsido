#!/usr/bin/env node

// ملف تشغيل مبسط للنشر على الاستضافات الخارجية
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// إعداد الملفات الثابتة
const distPath = path.join(__dirname, 'dist', 'public');

if (fs.existsSync(distPath)) {
  // خدمة الملفات الثابتة
  app.use(express.static(distPath));
  
  // توجيه جميع الطلبات إلى index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  console.log(`✅ التطبيق يعمل على المنفذ ${PORT}`);
  console.log(`🌐 الموقع: http://localhost:${PORT}`);
} else {
  // إذا لم يتم بناء المشروع بعد
  app.get('*', (req, res) => {
    res.status(503).send(`
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>BizChat - جاري التحضير</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #25D366; }
            .steps {
              text-align: right;
              margin: 20px 0;
            }
            .step {
              margin: 10px 0;
              padding: 10px;
              background: #f0f0f0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 BizChat</h1>
            <p>التطبيق غير جاهز للتشغيل بعد</p>
            
            <div class="steps">
              <h3>الخطوات المطلوبة:</h3>
              <div class="step">1. تشغيل: npm install</div>
              <div class="step">2. بناء المشروع: npm run build</div>
              <div class="step">3. إعادة تشغيل الخادم</div>
            </div>
            
            <p><small>بعد تنفيذ هذه الخطوات، سيعمل التطبيق بشكل طبيعي</small></p>
          </div>
        </body>
      </html>
    `);
  });
  
  console.log(`⚠️  التطبيق غير مبني بعد`);
  console.log(`📝 يرجى تشغيل: npm run build`);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 خادم BizChat يعمل على http://0.0.0.0:${PORT}`);
});