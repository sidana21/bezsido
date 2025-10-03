-- SQL Script للتحقق من الجداول الموجودة
-- استخدم هذا في Neon SQL Editor للتحقق من أن جميع الجداول موجودة

-- 1. عرض جميع الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. التحقق من الجداول المطلوبة للميزات الاجتماعية
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_likes') 
    THEN '✅ story_likes موجود'
    ELSE '❌ story_likes مفقود'
  END as story_likes_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_comments') 
    THEN '✅ story_comments موجود'
    ELSE '❌ story_comments مفقود'
  END as story_comments_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') 
    THEN '✅ follows موجود'
    ELSE '❌ follows مفقود'
  END as follows_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') 
    THEN '✅ stories موجود'
    ELSE '❌ stories مفقود'
  END as stories_status;

-- 3. عد الصفوف في كل جدول (للتحقق من البيانات)
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'stories', COUNT(*) FROM stories
UNION ALL
SELECT 'story_likes', COUNT(*) FROM story_likes
UNION ALL
SELECT 'story_comments', COUNT(*) FROM story_comments
UNION ALL
SELECT 'follows', COUNT(*) FROM follows
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'products', COUNT(*) FROM products;
