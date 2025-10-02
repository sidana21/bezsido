import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: text("password"), // كلمة المرور المشفرة (اختيارية للمستخدمين القدامى)
  name: text("name").notNull(),
  avatar: text("avatar"),
  location: text("location").notNull(), // المنطقة الجغرافية
  isOnline: boolean("is_online").default(false),
  isVerified: boolean("is_verified").default(false), // Account verification status
  verifiedAt: timestamp("verified_at"), // When account was verified
  verificationType: text("verification_type"), // "verified" للمستخدم العادي الموثق، "admin" للمشرف الموثق
  isAdmin: boolean("is_admin").default(false), // Admin privileges
  lastSeen: timestamp("last_seen").defaultNow(),
  points: integer("points").default(0), // نقاط المستخدم
  streak: integer("streak").default(0), // عدد الأيام المتتالية للنشاط
  lastStreakDate: timestamp("last_streak_date"), // آخر يوم حصل فيه على نقاط
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for email authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  isGroup: boolean("is_group").default(false),
  avatar: text("avatar"),
  participants: jsonb("participants").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content"),
  messageType: text("message_type").notNull().default("text"), // text, image, file, audio, location, sticker
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  stickerUrl: text("sticker_url"),
  stickerId: varchar("sticker_id"),
  locationLat: decimal("location_lat"),
  locationLon: decimal("location_lon"),
  locationName: text("location_name"),
  replyToMessageId: varchar("reply_to_message_id"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  isDelivered: boolean("is_delivered").default(false),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
});

// Admin credentials table
export const adminCredentials = pgTable("admin_credentials", {
  id: varchar("id").primaryKey().default("admin_settings"),
  email: text("email").notNull(),
  password: text("password").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature management table
export const appFeatures = pgTable("app_features", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  category: text("category").notNull().default("general"), // messaging, marketplace, social, admin, etc.
  priority: integer("priority").default(0), // Display order in admin panel
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isVerified: true,
  verifiedAt: true,
  lastSeen: true,
  points: true,
  streak: true,
  lastStreakDate: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for login validation
export const loginUserSchema = z.object({
  email: z.string().email("تأكد من صحة تنسيق البريد الإلكتروني"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

// Schema for registration validation
export const registerUserSchema = z.object({
  email: z.string().email("تأكد من صحة تنسيق البريد الإلكتروني"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفان على الأقل"),
  location: z.string().min(2, "الموقع مطلوب"),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});


export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Stickers for chat messages
export const stickers = pgTable("stickers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull().default("general"), // general, emoji, business, fun
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  location: text("location").notNull(), // المنطقة الجغرافية للحالة
  content: text("content"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  backgroundColor: text("background_color").default("#075e54"),
  textColor: text("text_color").default("#ffffff"),
  timestamp: timestamp("timestamp").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  viewCount: text("view_count").default("0"), // Store as text to handle large numbers
  viewers: jsonb("viewers").$type<string[]>().default([]),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  timestamp: true,
  viewCount: true,
});

export const insertStickerSchema = createInsertSchema(stickers).omit({
  id: true,
  createdAt: true,
});

// فئات الخدمات المتعددة - Service Categories  
export const serviceCategories = pgTable("service_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Transportation, Delivery, Home Services, etc.
  nameAr: text("name_ar").notNull(), // النقل، التوصيل، خدمات منزلية
  description: text("description"),
  icon: text("icon"), // Car, Truck, Home, etc.
  color: text("color").default("#3B82F6"),
  commissionRate: decimal("commission_rate").notNull().default("0.05"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// فئات البائعين - Vendor Categories (متوافق مع النظام الحالي)
export const vendorCategories = pgTable("vendor_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(), // الاسم بالعربية
  description: text("description"),
  icon: text("icon"), // أيقونة الفئة
  color: text("color").default("#3B82F6"), // لون الفئة
  commissionRate: decimal("commission_rate").notNull().default("0.05"), // معدل العمولة لهذه الفئة
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// البائعين - Vendors (يحل محل المتاجر)
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // البائع
  businessName: text("business_name").notNull(), // اسم النشاط التجاري
  displayName: text("display_name").notNull(), // الاسم التجاري
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull().references(() => vendorCategories.id),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"), // صورة غلاف
  location: text("location").notNull(),
  address: text("address"), // العنوان التفصيلي
  email: text("email"),
  whatsappNumber: text("whatsapp_number"),
  website: text("website"),
  socialLinks: jsonb("social_links").$type<{facebook?: string, instagram?: string, twitter?: string}>().default({}),
  
  // حالة البائع
  status: text("status").notNull().default("pending"), // pending, approved, rejected, suspended, featured
  isActive: boolean("is_active").default(false),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false), // بائع مميز
  isPremium: boolean("is_premium").default(false), // اشتراك مدفوع
  
  // تواريخ مهمة
  verifiedAt: timestamp("verified_at"),
  approvedAt: timestamp("approved_at"),
  suspendedAt: timestamp("suspended_at"),
  featuredUntil: timestamp("featured_until"), // تاريخ انتهاء الترويج
  premiumUntil: timestamp("premium_until"), // تاريخ انتهاء الاشتراك المدفوع
  
  // إحصائيات
  totalSales: decimal("total_sales").default("0"),
  totalOrders: integer("total_orders").default(0),
  totalProducts: integer("total_products").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  
  // إعدادات التشغيل
  workingHours: jsonb("working_hours").$type<{[key: string]: {open: string, close: string, isOpen: boolean}}>().default({}),
  deliveryAreas: jsonb("delivery_areas").$type<string[]>().default([]), // مناطق التوصيل
  deliveryFee: decimal("delivery_fee").default("0"), // رسوم التوصيل
  minOrderAmount: decimal("min_order_amount").default("0"), // أقل مبلغ طلب
  
  // إدارة
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"), // ملاحظات الإدارة
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// تقييمات البائعين - Vendor Ratings
export const vendorRatings = pgTable("vendor_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  userId: varchar("user_id").notNull().references(() => users.id), // من قام بالتقييم
  rating: integer("rating").notNull(), // من 1 إلى 5
  review: text("review"), // المراجعة النصية
  orderId: varchar("order_id").references(() => orders.id), // مرتبط بطلب
  
  // جوانب التقييم
  productQuality: integer("product_quality"), // جودة المنتج
  customerService: integer("customer_service"), // خدمة العملاء
  deliverySpeed: integer("delivery_speed"), // سرعة التوصيل
  priceValue: integer("price_value"), // مقابل السعر
  
  isVerified: boolean("is_verified").default(false), // تقييم موثق
  isPublic: boolean("is_public").default(true),
  
  // رد البائع
  vendorReply: text("vendor_reply"),
  repliedAt: timestamp("replied_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// اشتراكات البائعين - Vendor Subscriptions
export const vendorSubscriptions = pgTable("vendor_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  planType: text("plan_type").notNull(), // basic, premium, enterprise
  planName: text("plan_name").notNull(),
  
  // تفاصيل الاشتراك
  monthlyFee: decimal("monthly_fee").notNull(),
  commissionRate: decimal("commission_rate").notNull(), // معدل العمولة المخفض
  maxProducts: integer("max_products"), // عدد المنتجات المسموح
  maxOrders: integer("max_orders"), // عدد الطلبات الشهرية
  
  // مميزات الاشتراك
  features: jsonb("features").$type<string[]>().default([]),
  isFeaturedListing: boolean("is_featured_listing").default(false), // إدراج مميز
  prioritySupport: boolean("priority_support").default(false), // دعم أولوية
  analyticsAccess: boolean("analytics_access").default(false), // الوصول للتحليلات
  customBranding: boolean("custom_branding").default(false), // علامة تجارية مخصصة
  
  // تواريخ الاشتراك
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(true),
  
  // الدفع
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  paymentMethod: text("payment_method"), // card, bank_transfer, cash
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// فئات المنتجات - Product Categories
export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  icon: text("icon"),
  parentId: varchar("parent_id"), // للفئات الفرعية
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// منتجات السوق المتطور - Advanced Marketplace Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id), // البائع
  categoryId: varchar("category_id").notNull().references(() => productCategories.id),
  
  // معلومات المنتج الأساسية
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"), // وصف مختصر
  sku: text("sku").unique(), // رمز المنتج
  barcode: text("barcode"), // الباركود
  
  // الأسعار والخصومات
  originalPrice: decimal("original_price").notNull(),
  salePrice: decimal("sale_price"), // سعر الخصم
  costPrice: decimal("cost_price"), // سعر التكلفة (للبائع فقط)
  currency: text("currency").notNull().default("DZD"),
  
  // الصور والوسائط
  images: jsonb("images").$type<string[]>().default([]),
  videoUrl: text("video_url"), // فيديو المنتج
  
  // المخزون
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  stockStatus: text("stock_status").notNull().default("in_stock"), // in_stock, out_of_stock, low_stock
  manageStock: boolean("manage_stock").default(true),
  
  // المواصفات والخيارات
  attributes: jsonb("attributes").$type<{[key: string]: string}>().default({}), // اللون، الحجم، إلخ
  variations: jsonb("variations").$type<Array<{name: string, price: string, sku?: string, stock?: number}>>().default([]),
  
  // التوصيل والشحن
  weight: decimal("weight"), // الوزن بالكيلوغرام
  dimensions: jsonb("dimensions").$type<{length: number, width: number, height: number}>(), // الأبعاد
  shippingClass: text("shipping_class"), // فئة الشحن
  
  // SEO ومحركات البحث
  slug: text("slug").unique(), // رابط صديق لمحركات البحث
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // الحالة والنشر
  status: text("status").notNull().default("draft"), // draft, pending, published, rejected
  isActive: boolean("is_active").default(false),
  isFeatured: boolean("is_featured").default(false),
  isDigital: boolean("is_digital").default(false), // منتج رقمي
  
  // إحصائيات
  viewCount: integer("view_count").default(0),
  orderCount: integer("order_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  
  // تواريخ مهمة
  publishedAt: timestamp("published_at"),
  featuredUntil: timestamp("featured_until"),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  
  // العمولات والرسوم
  commissionRate: decimal("commission_rate").notNull().default("0.05"),
  marketplaceFee: decimal("marketplace_fee").default("0.02"), // رسوم السوق
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// خدمات متعددة - Multi Services (تاكسي، توصيل، خدمات أخرى)
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id), // مقدم الخدمة
  categoryId: varchar("category_id").notNull().references(() => serviceCategories.id),
  
  // معلومات الخدمة الأساسية
  name: text("name").notNull(), // اسم الخدمة
  description: text("description").notNull(), // وصف الخدمة
  shortDescription: text("short_description"), // وصف مختصر
  
  // الأسعار والتكلفة
  basePrice: decimal("base_price").notNull(), // السعر الأساسي
  pricePerKm: decimal("price_per_km"), // سعر كل كيلومتر (للتاكسي)
  pricePerHour: decimal("price_per_hour"), // سعر كل ساعة
  minimumCharge: decimal("minimum_charge").default("0"), // أقل مبلغ
  currency: text("currency").notNull().default("DZD"),
  
  // الصور والوسائط
  images: jsonb("images").$type<string[]>().default([]),
  videoUrl: text("video_url"),
  
  // معلومات الخدمة المتخصصة
  serviceType: text("service_type").notNull(), // taxi, delivery, cleaning, repair, etc.
  availability: text("availability").notNull().default("available"), // available, busy, offline
  estimatedDuration: integer("estimated_duration"), // المدة المتوقعة بالدقائق
  maxCapacity: integer("max_capacity"), // العدد الأقصى (للتاكسي/التوصيل)
  
  // المواصفات والمميزات
  features: jsonb("features").$type<string[]>().default([]), // مميزات الخدمة
  equipment: jsonb("equipment").$type<string[]>().default([]), // معدات مطلوبة
  requirements: jsonb("requirements").$type<string[]>().default([]), // متطلبات
  
  // المنطقة الجغرافية
  serviceAreas: jsonb("service_areas").$type<string[]>().default([]), // مناطق الخدمة
  location: text("location").notNull(), // الموقع الأساسي
  latitude: decimal("latitude"), // الإحداثيات
  longitude: decimal("longitude"),
  radius: integer("radius").default(10), // نطاق الخدمة بالكيلومتر
  
  // أوقات العمل
  workingHours: jsonb("working_hours").$type<{[key: string]: {open: string, close: string, isOpen: boolean}}>().default({}),
  isAvailable24x7: boolean("is_available_24x7").default(false),
  
  // الحالة والنشر
  status: text("status").notNull().default("draft"), // draft, pending, published, rejected
  isActive: boolean("is_active").default(false),
  isFeatured: boolean("is_featured").default(false),
  isEmergencyService: boolean("is_emergency_service").default(false), // خدمة طارئة
  
  // إحصائيات
  viewCount: integer("view_count").default(0),
  orderCount: integer("order_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  completionRate: decimal("completion_rate", { precision: 3, scale: 2 }).default("0"), // معدل إتمام الخدمات
  
  // تواريخ مهمة
  publishedAt: timestamp("published_at"),
  featuredUntil: timestamp("featured_until"),
  
  // العمولات والرسوم
  commissionRate: decimal("commission_rate").notNull().default("0.05"),
  platformFee: decimal("platform_fee").default("0.02"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// تقييمات المنتجات - Product Reviews
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  
  rating: integer("rating").notNull(), // من 1 إلى 5
  title: text("title"),
  review: text("review"),
  
  // الصور والوسائط
  images: jsonb("images").$type<string[]>().default([]),
  videoUrl: text("video_url"),
  
  isVerified: boolean("is_verified").default(false), // تقييم موثق
  isRecommended: boolean("is_recommended").default(true),
  
  // تفاعل المجتمع
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  
  // رد البائع
  vendorReply: text("vendor_reply"),
  repliedAt: timestamp("replied_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Affiliate links for commission tracking
export const affiliateLinks = pgTable("affiliate_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  affiliateId: varchar("affiliate_id").notNull().references(() => users.id), // Person sharing the link
  uniqueCode: varchar("unique_code").notNull().unique(), // Unique tracking code
  clicks: text("clicks").default("0"), // Number of clicks
  conversions: text("conversions").default("0"), // Number of purchases
  totalCommission: decimal("total_commission").default("0"), // Total commission earned
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission tracking
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateLinkId: varchar("affiliate_link_id").notNull().references(() => affiliateLinks.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id), // Person who bought
  amount: decimal("amount").notNull(), // Commission amount
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  transactionId: varchar("transaction_id"), // Optional transaction reference
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

// Call schema for voice/video calls
export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerId: varchar("caller_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("ringing"), // ringing, accepted, rejected, ended, missed
  callType: text("call_type").notNull().default("voice"), // voice, video
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration").default(0), // in seconds
});

// Contacts table for user friendships
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // User who added the contact
  contactUserId: varchar("contact_user_id").references(() => users.id), // Contact's user ID (if they have app)
  email: varchar("email").notNull(), // Contact's email
  name: text("name").notNull(), // Contact's name (user-defined)
  isAppUser: boolean("is_app_user").default(false), // Whether contact has the app
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping cart items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Cart owner
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: text("quantity").notNull().default("1"), // Quantity as text to handle large numbers
  addedAt: timestamp("added_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id), // Customer
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id), // Vendor
  totalAmount: decimal("total_amount").notNull(), // Total order value
  status: text("status").notNull().default("pending"), // pending, confirmed, prepared, delivered, cancelled
  paymentMethod: text("payment_method").notNull().default("cash_on_delivery"), // cash_on_delivery, bank_transfer, etc.
  deliveryAddress: text("delivery_address").notNull(), // Customer delivery address
  customerEmail: text("customer_email").notNull(), // Customer contact
  customerName: text("customer_name").notNull(), // Customer name
  notes: text("notes"), // Order notes/comments
  orderDate: timestamp("order_date").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
});

// Order items (products in an order)
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(), // Store product name at time of order
  productPrice: decimal("product_price").notNull(), // Store product price at time of order
  quantity: text("quantity").notNull(), // Quantity ordered
  subtotal: decimal("subtotal").notNull(), // price * quantity
});

// Instant Invoices - الفواتير الفورية
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // منشئ الفاتورة
  invoiceNumber: varchar("invoice_number").notNull().unique(), // رقم الفاتورة
  customerName: text("customer_name").notNull(), // اسم العميل
  customerEmail: text("customer_email"), // إيميل العميل
  customerAddress: text("customer_address"), // عنوان العميل
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // المجموع الفرعي
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"), // معدل الضريبة
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"), // مبلغ الضريبة
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"), // مبلغ الخصم
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // المبلغ الإجمالي
  currency: text("currency").notNull().default("SAR"), // العملة
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: timestamp("due_date"), // تاريخ الاستحقاق
  paidAt: timestamp("paid_at"), // تاريخ السداد
  notes: text("notes"), // ملاحظات
  terms: text("terms"), // شروط الدفع
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(), // وصف المنتج/الخدمة
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // الكمية
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // سعر الوحدة
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // السعر الإجمالي
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVendorCategorySchema = createInsertSchema(vendorCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  status: true,
  isVerified: true,
  verifiedAt: true,
  approvedAt: true,
  suspendedAt: true,
  featuredUntil: true,
  premiumUntil: true,
  totalSales: true,
  totalOrders: true,
  totalProducts: true,
  averageRating: true,
  totalReviews: true,
  approvedBy: true,
  rejectionReason: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorRatingSchema = createInsertSchema(vendorRatings).omit({
  id: true,
  isVerified: true,
  repliedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSubscriptionSchema = createInsertSchema(vendorSubscriptions).omit({
  id: true,
  lastPaymentDate: true,
  nextPaymentDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  stockStatus: true,
  viewCount: true,
  orderCount: true,
  averageRating: true,
  totalReviews: true,
  publishedAt: true,
  featuredUntil: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  isVerified: true,
  helpfulCount: true,
  notHelpfulCount: true,
  repliedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
  id: true,
  uniqueCode: true,
  clicks: true,
  conversions: true,
  totalCommission: true,
  createdAt: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
  confirmedAt: true,
  deliveredAt: true,
  cancelledAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  orderId: true,
});

// Verification requests table
export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // User requesting verification
  vendorId: varchar("vendor_id").references(() => vendors.id), // Optional: for vendor verification requests
  requestType: text("request_type").notNull(), // "user" or "store"
  verificationType: text("verification_type"), // نوع التوثيق المطلوب: "verified" للمستخدم العادي، "admin" للمشرف
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  documents: jsonb("documents").$type<string[]>().default([]), // Document URLs submitted
  reason: text("reason"), // User's reason for requesting verification
  adminNote: text("admin_note"), // Admin's note (for approval/rejection)
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Admin who reviewed the request
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

// Story likes for reactions
export const storyLikes = pgTable("story_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reactionType: text("reaction_type").notNull().default("like"), // like, love, laugh, sad, angry
  createdAt: timestamp("created_at").defaultNow(),
});

// Story comments
export const storyComments = pgTable("story_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStoryLikeSchema = createInsertSchema(storyLikes).omit({
  id: true,
  createdAt: true,
});

export const insertStoryCommentSchema = createInsertSchema(storyComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertVendorCategory = z.infer<typeof insertVendorCategorySchema>;
export type VendorCategory = typeof vendorCategories.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendorRating = z.infer<typeof insertVendorRatingSchema>;
export type VendorRating = typeof vendorRatings.$inferSelect;
export type InsertVendorSubscription = z.infer<typeof insertVendorSubscriptionSchema>;
export type VendorSubscription = typeof vendorSubscriptions.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissions.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertStoryLike = z.infer<typeof insertStoryLikeSchema>;
export type StoryLike = typeof storyLikes.$inferSelect;
export type InsertStoryComment = z.infer<typeof insertStoryCommentSchema>;
export type StoryComment = typeof storyComments.$inferSelect;
export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type Sticker = typeof stickers.$inferSelect;

// Admin credentials schema and types
export const insertAdminCredentialsSchema = createInsertSchema(adminCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdminCredentials = z.infer<typeof insertAdminCredentialsSchema>;
export type AdminCredentials = typeof adminCredentials.$inferSelect;

// App features schema and types
export const insertAppFeatureSchema = createInsertSchema(appFeatures).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertAppFeature = z.infer<typeof insertAppFeatureSchema>;
export type AppFeature = typeof appFeatures.$inferSelect;

// Call schema and types
export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  duration: true,
});

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

// مجموعات الحي - Neighborhood Groups
export const neighborhoodGroups = pgTable("neighborhood_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // اسم المجموعة
  location: text("location").notNull(), // المنطقة/الحي
  description: text("description"), // وصف المجموعة
  createdBy: varchar("created_by").notNull().references(() => users.id), // منشئ المجموعة
  members: jsonb("members").$type<string[]>().default([]), // قائمة أعضاء المجموعة
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// طلبات المساعدة - Help Requests
export const helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // طالب المساعدة
  groupId: varchar("group_id").notNull().references(() => neighborhoodGroups.id), // المجموعة
  title: text("title").notNull(), // عنوان الطلب
  description: text("description").notNull(), // وصف المساعدة المطلوبة
  category: text("category").notNull(), // نوع المساعدة: repair, delivery, advice, other
  urgency: text("urgency").notNull().default("normal"), // normal, urgent, emergency
  location: text("location").notNull(), // الموقع المحدد
  budget: decimal("budget"), // الميزانية المتوقعة (اختياري)
  images: jsonb("images").$type<string[]>().default([]), // صور توضيحية
  status: text("status").notNull().default("open"), // open, in_progress, completed, cancelled
  helperId: varchar("helper_id").references(() => users.id), // الشخص الذي يساعد
  acceptedAt: timestamp("accepted_at"), // وقت قبول المساعدة
  completedAt: timestamp("completed_at"), // وقت إنهاء المساعدة
  rating: integer("rating"), // تقييم من 1-5
  feedback: text("feedback"), // تعليق على الخدمة
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// معاملات النقاط - Point Transactions
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(), // النقاط المضافة (+) أو المخصومة (-)
  type: text("type").notNull(), // earned, spent, bonus, penalty
  reason: text("reason").notNull(), // سبب المعاملة
  relatedId: varchar("related_id"), // معرف مرتبط (طلب مساعدة، مهمة، إلخ)
  relatedType: text("related_type"), // help_request, mission, order, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// المهام اليومية - Daily Missions
export const dailyMissions = pgTable("daily_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // عنوان المهمة
  description: text("description").notNull(), // وصف المهمة
  category: text("category").notNull(), // social, help, business, activity
  points: integer("points").notNull(), // النقاط المكتسبة
  targetCount: integer("target_count").default(1), // عدد المرات المطلوبة
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// مهام المستخدم اليومية - User Daily Missions
export const userMissions = pgTable("user_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  missionId: varchar("mission_id").notNull().references(() => dailyMissions.id),
  progress: integer("progress").default(0), // التقدم الحالي
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  date: text("date").notNull(), // تاريخ المهمة YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
});

// التذكيرات - Reminders
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // المستخدم الذي وضع التذكير
  chatId: varchar("chat_id").references(() => chats.id), // المحادثة المرتبطة
  contactId: varchar("contact_id").references(() => contacts.id), // جهة الاتصال المرتبطة
  title: text("title").notNull(), // عنوان التذكير
  description: text("description"), // وصف التذكير
  reminderAt: timestamp("reminder_at").notNull(), // وقت التذكير
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// تصنيفات العملاء - Customer Tags
export const customerTags = pgTable("customer_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // صاحب العمل
  contactId: varchar("contact_id").notNull().references(() => contacts.id), // العميل
  tag: text("tag").notNull(), // lead, customer, vip, lost
  notes: text("notes"), // ملاحظات إضافية
  lastInteraction: timestamp("last_interaction").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// الردود السريعة - Quick Replies
export const quickReplies = pgTable("quick_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // صاحب الردود
  title: text("title").notNull(), // عنوان الرد السريع
  content: text("content").notNull(), // محتوى الرد
  category: text("category").notNull().default("general"), // general, greeting, pricing, delivery
  usageCount: integer("usage_count").default(0), // عدد مرات الاستخدام
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Posts for Instagram-like feed
export const businessPosts = pgTable("business_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").default(''),
  imageUrl: text("image_url"),
  images: jsonb("images").default([]),
  videoUrl: text("video_url"),
  businessName: text("business_name"),
  location: text("location"),
  category: text("category"),
  productName: text("product_name"),
  productPrice: text("product_price"),
  productOriginalPrice: text("product_original_price"),
  postType: text("post_type").default('personal'),
  businessInfo: jsonb("business_info"),
  locationInfo: jsonb("location_info"),
  hashtags: jsonb("hashtags").default([]),
  visibility: text("visibility").default('public'),
  allowComments: boolean("allow_comments").default(true),
  allowShares: boolean("allow_shares").default(true),
  status: text("status").default('published'),
  isActive: boolean("is_active").default(true),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Stories for Instagram-like stories
export const businessStories = pgTable("business_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  imageUrl: text("image_url").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '24 hours'`),
});

// Post Likes
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => businessPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Saves
export const postSaves = pgTable("post_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => businessPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Comments
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => businessPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story Views
export const storyViews = pgTable("story_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => businessStories.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertNeighborhoodGroupSchema = createInsertSchema(neighborhoodGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).omit({
  id: true,
  status: true,
  acceptedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertDailyMissionSchema = createInsertSchema(dailyMissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserMissionSchema = createInsertSchema(userMissions).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertCustomerTagSchema = createInsertSchema(customerTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuickReplySchema = createInsertSchema(quickReplies).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

// Business Posts and Stories schemas
// نظام المتابعة المتقدم - Advanced Following System
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isBusinessAccount: boolean("is_business_account").default(false), // متابعة حساب تجاري
  notificationsEnabled: boolean("notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// منشورات البيزنس تشات المتطورة - Advanced BizChat Posts
export const bizChatPosts = pgTable("bizchat_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // محتوى المنشور
  content: text("content"),
  images: jsonb("images").$type<string[]>().default([]), // متعدد الصور
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"), // منشورات صوتية
  
  // نوع المنشور
  postType: text("post_type").notNull().default("regular"), // regular, product, service, event, offer, story_highlight
  
  // للمنشورات التجارية
  businessInfo: jsonb("business_info").$type<{
    businessName?: string;
    category?: string;
    location?: string;
    website?: string;
    phone?: string;
  }>().default({}),
  
  // المنتجات المرتبطة
  taggedProducts: jsonb("tagged_products").$type<Array<{
    productId: string;
    name: string;
    price: string;
    position: { x: number; y: number }; // موقع المنتج في الصورة
  }>>().default([]),
  
  // معلومات الموقع
  locationInfo: jsonb("location_info").$type<{
    name?: string;
    coordinates?: { lat: number; lng: number };
    address?: string;
    city?: string;
  }>().default({}),
  
  // إعدادات المنشور
  isSponsored: boolean("is_sponsored").default(false), // إعلان مدفوع
  sponsorInfo: jsonb("sponsor_info").$type<{
    budget?: number;
    targetAudience?: string[];
    duration?: number;
  }>().default({}),
  
  // الخصوصية والرؤية
  visibility: text("visibility").notNull().default("public"), // public, friends, private, local
  allowComments: boolean("allow_comments").default(true),
  allowShares: boolean("allow_shares").default(true),
  showLikesCount: boolean("show_likes_count").default(true),
  
  // إحصائيات
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  viewsCount: integer("views_count").default(0),
  
  // SEO والاكتشاف
  hashtags: jsonb("hashtags").$type<string[]>().default([]),
  mentions: jsonb("mentions").$type<string[]>().default([]), // معرفات المستخدمين المذكورين
  
  // حالة المنشور
  status: text("status").notNull().default("published"), // draft, published, archived, deleted
  isActive: boolean("is_active").default(true),
  isPinned: boolean("is_pinned").default(false), // تثبيت في الملف الشخصي
  
  // معدلات التفاعل
  engagementRate: decimal("engagement_rate").default("0"), // نسبة التفاعل
  reachCount: integer("reach_count").default(0), // عدد الوصول
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  scheduledAt: timestamp("scheduled_at"), // للمنشورات المجدولة
});

// تفاعلات المنشورات المتطورة - Advanced Post Interactions
export const postInteractions = pgTable("post_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => bizChatPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // نوع التفاعل
  interactionType: text("interaction_type").notNull(), // like, love, care, haha, wow, sad, angry, share, save, view
  
  // معلومات إضافية
  duration: integer("duration"), // مدة المشاهدة للفيديوهات
  clickedProducts: jsonb("clicked_products").$type<string[]>().default([]), // منتجات تم النقر عليها
  
  createdAt: timestamp("created_at").defaultNow(),
});

// تعليقات متطورة - Advanced Comments
export const postCommentsAdvanced = pgTable("post_comments_advanced", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => bizChatPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // محتوى التعليق
  content: text("content").notNull(),
  imageUrl: text("image_url"), // صورة في التعليق
  gifUrl: text("gif_url"), // GIF في التعليق
  stickerUrl: text("sticker_url"), // ملصق
  
  // تعليق على تعليق - using string reference instead of self-reference
  parentCommentId: varchar("parent_comment_id"),
  replyLevel: integer("reply_level").default(0), // مستوى الرد
  
  // حالة التعليق
  isEdited: boolean("is_edited").default(false),
  isPinned: boolean("is_pinned").default(false), // تثبيت التعليق
  
  // إحصائيات
  likesCount: integer("likes_count").default(0),
  repliesCount: integer("replies_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// مجموعات المحتوى المحلي - Local Content Communities
export const localCommunities = pgTable("local_communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(), // المنطقة الجغرافية
  
  // إعدادات المجموعة
  isPrivate: boolean("is_private").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  allowBusinessPosts: boolean("allow_business_posts").default(true),
  
  // إدارة المجموعة
  adminId: varchar("admin_id").notNull().references(() => users.id),
  moderators: jsonb("moderators").$type<string[]>().default([]),
  
  // إحصائيات
  membersCount: integer("members_count").default(0),
  postsCount: integer("posts_count").default(0),
  
  // صورة الغلاف والرمز
  coverImage: text("cover_image"),
  logoImage: text("logo_image"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// عضوية المجموعات المحلية
export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => localCommunities.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  role: text("role").notNull().default("member"), // member, moderator, admin
  joinedAt: timestamp("joined_at").defaultNow(),
  
  // إعدادات الإشعارات
  notificationsEnabled: boolean("notifications_enabled").default(true),
});

// نظام التسويق بالعمولة المتقدم - Advanced Affiliate Marketing
export const affiliatePrograms = pgTable("affiliate_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => users.id), // صاحب العمل
  
  // إعدادات البرنامج
  programName: text("program_name").notNull(),
  description: text("description"),
  commissionRate: decimal("commission_rate").notNull(), // نسبة العمولة
  minimumPayout: decimal("minimum_payout").default("100"), // أقل مبلغ للسحب
  
  // شروط البرنامج
  requirements: jsonb("requirements").$type<{
    minFollowers?: number;
    categories?: string[];
    locations?: string[];
  }>().default({}),
  
  // الحالة
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// المؤثرين والشركاء التجاريين
export const influencerPartnerships = pgTable("influencer_partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateProgramId: varchar("affiliate_program_id").notNull().references(() => affiliatePrograms.id),
  influencerId: varchar("influencer_id").notNull().references(() => users.id),
  
  // معلومات الشراكة
  status: text("status").notNull().default("pending"), // pending, approved, active, suspended
  approvedAt: timestamp("approved_at"),
  
  // إحصائيات الأداء
  totalEarnings: decimal("total_earnings").default("0"),
  totalViews: integer("total_views").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalSales: integer("total_sales").default(0),
  conversionRate: decimal("conversion_rate").default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessPostSchema = createInsertSchema(businessPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBizChatPostSchema = createInsertSchema(bizChatPosts).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  sharesCount: true,
  viewsCount: true,
  engagementRate: true,
  reachCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertPostInteractionSchema = createInsertSchema(postInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertPostCommentAdvancedSchema = createInsertSchema(postCommentsAdvanced).omit({
  id: true,
  isEdited: true,
  likesCount: true,
  repliesCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocalCommunitySchema = createInsertSchema(localCommunities).omit({
  id: true,
  membersCount: true,
  postsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateProgramSchema = createInsertSchema(affiliatePrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new advanced features
export type Follow = typeof follows.$inferSelect;
export type BizChatPost = typeof bizChatPosts.$inferSelect;
export type PostInteraction = typeof postInteractions.$inferSelect;
export type PostCommentAdvanced = typeof postCommentsAdvanced.$inferSelect;
export type LocalCommunity = typeof localCommunities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type AffiliateProgram = typeof affiliatePrograms.$inferSelect;
export type InfluencerPartnership = typeof influencerPartnerships.$inferSelect;

export const insertBusinessStorySchema = createInsertSchema(businessStories).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPostSaveSchema = createInsertSchema(postSaves).omit({
  id: true,
  createdAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
});

export const insertStoryViewSchema = createInsertSchema(storyViews).omit({
  id: true,
  createdAt: true,
});

// Invoice schemas - مخططات الفواتير
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type InsertNeighborhoodGroup = z.infer<typeof insertNeighborhoodGroupSchema>;
export type NeighborhoodGroup = typeof neighborhoodGroups.$inferSelect;
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type HelpRequest = typeof helpRequests.$inferSelect;
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertDailyMission = z.infer<typeof insertDailyMissionSchema>;
export type DailyMission = typeof dailyMissions.$inferSelect;
export type InsertUserMission = z.infer<typeof insertUserMissionSchema>;
export type UserMission = typeof userMissions.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertCustomerTag = z.infer<typeof insertCustomerTagSchema>;
export type CustomerTag = typeof customerTags.$inferSelect;
export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;
export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// Multi-Service Schemas - مخططات الخدمات المتعددة
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  publishedAt: true,
  featuredUntil: true,
  viewCount: true,
  orderCount: true,
  averageRating: true,
  totalReviews: true,
  completionRate: true,
  createdAt: true,
  updatedAt: true,
});

// Social Notifications for likes, comments, follows
export const socialNotifications = pgTable("social_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // المستقبل للإشعار
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // مرسل الإشعار
  type: text("type").notNull(), // 'like', 'comment', 'follow', 'story_like', 'story_comment'
  postId: varchar("post_id").references(() => businessPosts.id, { onDelete: 'cascade' }), // اختياري للمنشورات
  commentId: varchar("comment_id").references(() => postComments.id, { onDelete: 'cascade' }), // اختياري للتعليقات
  storyId: varchar("story_id"), // اختياري للقصص
  title: text("title").notNull(), // عنوان الإشعار
  message: text("message").notNull(), // محتوى الإشعار
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSocialNotificationSchema = createInsertSchema(socialNotifications).omit({
  id: true,
  createdAt: true,
});

// استخدام جدول follows الموجود بالفعل

// Types for Multi-Service tables
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Social Notifications types
export type InsertSocialNotification = z.infer<typeof insertSocialNotificationSchema>;
export type SocialNotification = typeof socialNotifications.$inferSelect;

// Business Posts and Stories types
export type InsertBusinessPost = z.infer<typeof insertBusinessPostSchema>;
export type BusinessPost = typeof businessPosts.$inferSelect;
export type InsertBusinessStory = z.infer<typeof insertBusinessStorySchema>;
export type BusinessStory = typeof businessStories.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostSave = z.infer<typeof insertPostSaveSchema>;
export type PostSave = typeof postSaves.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertStoryView = z.infer<typeof insertStoryViewSchema>;
export type StoryView = typeof storyViews.$inferSelect;
