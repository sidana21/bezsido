import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  location: text("location").notNull(), // المنطقة الجغرافية
  isOnline: boolean("is_online").default(false),
  isVerified: boolean("is_verified").default(false), // Account verification status
  verifiedAt: timestamp("verified_at"), // When account was verified
  isAdmin: boolean("is_admin").default(false), // Admin privileges
  lastSeen: timestamp("last_seen").defaultNow(),
  points: integer("points").default(0), // نقاط المستخدم
  streak: integer("streak").default(0), // عدد الأيام المتتالية للنشاط
  lastStreakDate: timestamp("last_streak_date"), // آخر يوم حصل فيه على نقاط
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for phone authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP verification table
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull(),
  code: varchar("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
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

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSchema = createInsertSchema(otpCodes).omit({
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

// Stores for users
export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Store owner
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  location: text("location").notNull(), // Store location
  phoneNumber: text("phone_number"),
  isOpen: boolean("is_open").default(true),
  isActive: boolean("is_active").default(false), // Default to false until approved
  status: text("status").notNull().default("pending"), // pending, approved, rejected, suspended
  isVerified: boolean("is_verified").default(false), // Store verification status
  verifiedAt: timestamp("verified_at"), // When store was verified
  approvedAt: timestamp("approved_at"), // When store was approved
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved
  rejectionReason: text("rejection_reason"), // Reason for rejection
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products for affiliate marketing
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Product owner
  storeId: varchar("store_id").references(() => stores.id), // Optional: link to store
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  location: text("location").notNull(), // Where product is available
  isActive: boolean("is_active").default(true),
  commissionRate: decimal("commission_rate").notNull().default("0.05"), // 5% default commission
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
  phoneNumber: varchar("phone_number").notNull(), // Contact's phone number
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
  sellerId: varchar("seller_id").notNull().references(() => users.id), // Store owner
  storeId: varchar("store_id").references(() => stores.id), // Optional store reference
  totalAmount: decimal("total_amount").notNull(), // Total order value
  status: text("status").notNull().default("pending"), // pending, confirmed, prepared, delivered, cancelled
  paymentMethod: text("payment_method").notNull().default("cash_on_delivery"), // cash_on_delivery, bank_transfer, etc.
  deliveryAddress: text("delivery_address").notNull(), // Customer delivery address
  customerPhone: text("customer_phone").notNull(), // Customer contact
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

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  status: true,
  isVerified: true,
  verifiedAt: true,
  approvedAt: true,
  approvedBy: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
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
  storeId: varchar("store_id").references(() => stores.id), // Optional: for store verification requests
  requestType: text("request_type").notNull(), // "user" or "store"
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
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
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
