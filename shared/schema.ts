import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  location: text("location").notNull(), // المنطقة الجغرافية
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
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
  messageType: text("message_type").notNull().default("text"), // text, image, file, audio, location
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastSeen: true,
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
  isActive: boolean("is_active").default(true),
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
